import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseFocus, parseInitiatives, parsePeople, parseTasks, derivePartOfDay, assembleDashboard, parseCaptures, parseSummary } from '../dashboard-data.js'

const FOCUS_MD = [
  '# Focus — 2026-06-10', '',
  '## Current Focus', '',
  JSON.stringify({ top_priorities: ['Ship rollout', 'Plan Q3'], watching: ['China gap'], waiting_on: ['SOC2 from Legal'] }, null, 2),
  '',
  '## Active Initiatives', '',
  '- **CLM Rollout War Room** (P0) — blocked · owner: team-lead',
  '- **KYC Vendor Optimization** (P1) — active · owner: vendor-pm',
  '',
  '## Open Action Items', '',
  '- some meeting item',
  '',
  '## My Open Tasks', '',
  '- [P1] Reply to Sivan · due 2026-06-11 · KYC Vendor Optimization',
  '- [P2] File AI Think Tank materials',
  '',
  '## People who matter today', '',
  '**Leadership:** Oren Ryngler, Yaron Zakai Or',
  '**Direct reports:** Elad Schnarch, Ira Martinenko',
  '**Active-initiative stakeholders:**',
  '- Daniel Grin (sponsor · CLM Rollout War Room)',
  '',
  '## Portfolio Headline', '',
  'the headline',
].join('\n')

describe('parseFocus', () => {
  it('JSON-parses current_focus into priorities/watching/waitingOn', () => {
    const f = parseFocus(FOCUS_MD)
    assert.deepEqual(f.priorities, ['Ship rollout', 'Plan Q3'])
    assert.deepEqual(f.watching, ['China gap'])
    assert.deepEqual(f.waitingOn, [{ item: 'SOC2 from Legal', who: '' }])
  })
})

describe('parseInitiatives', () => {
  it('parses lines + maps status (active→on_track, blocked→blocked)', () => {
    const i = parseInitiatives(FOCUS_MD)
    assert.equal(i.length, 2)
    assert.deepEqual({ name: i[0].name, status: i[0].status, priority: i[0].priority, owner: i[0].owner },
      { name: 'CLM Rollout War Room', status: 'blocked', priority: 'P0', owner: 'team-lead' })
    assert.equal(i[1].status, 'on_track')
  })
})

describe('parsePeople', () => {
  it('maps leadership→manager, directs→report, stakeholders→stakeholder', () => {
    const p = parsePeople(FOCUS_MD)
    assert.deepEqual(p.find((x) => x.name === 'Oren Ryngler')!.relation, 'manager')
    assert.deepEqual(p.find((x) => x.name === 'Elad Schnarch')!.relation, 'report')
    const stk = p.find((x) => x.name === 'Daniel Grin')!
    assert.equal(stk.relation, 'stakeholder')
    assert.deepEqual(stk.initiatives, ['CLM Rollout War Room'])
  })
})

describe('parseTasks', () => {
  it('parses [priority] title · due · initiative', () => {
    const t = parseTasks(FOCUS_MD)
    assert.equal(t.length, 2)
    assert.deepEqual({ title: t[0].title, priority: t[0].priority, due: t[0].due, initiative: t[0].initiative },
      { title: 'Reply to Sivan', priority: 'P1', due: '2026-06-11', initiative: 'KYC Vendor Optimization' })
    assert.equal(t[1].due, undefined)
  })
})

describe('derivePartOfDay', () => {
  it('summary→evening; else by hour', () => {
    assert.equal(derivePartOfDay(9, false), 'morning')
    assert.equal(derivePartOfDay(14, false), 'midday')
    assert.equal(derivePartOfDay(19, false), 'evening')
    assert.equal(derivePartOfDay(9, true), 'evening')
  })
})

describe('assembleDashboard', () => {
  it('fills DB zones, leaves capture/EOD empty, sets meta', () => {
    const d = assembleDashboard({ focusMd: FOCUS_MD, capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    assert.equal(d.meta.partOfDay, 'morning')
    assert.equal(d.meta.asof, '09:30')
    assert.equal(d.initiatives.length, 2)
    assert.equal(d.tasks.length, 2)
    assert.ok(d.focus.priorities.length === 2)
    assert.deepEqual(d.needsAttention, [])
    assert.equal(d.endOfDay, null)
  })
  it('degrades gracefully on empty focus', () => {
    const d = assembleDashboard({ focusMd: '', capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    assert.deepEqual(d.initiatives, [])
    assert.deepEqual(d.focus, { priorities: [], watching: [], waitingOn: [] })
  })
})

describe('parseCaptures', () => {
  const CAP = [
    '# Captures — 2026-06-10', '',
    '## 14:20 — sweep',
    '**⚡ Needs attention:**',
    '- VIP email from Yaron re: planning',
    '**Teams:**',
    '- Yaron ↔ Yonatan: planning this week',
    '**SharePoint:**',
    '- Deck updated',
    '**Coming up today:**',
    '- 16:00 Roadmap review',
  ].join('\n')
  it('routes labels to needs/signals/meetings with ISO at/start', () => {
    const z = parseCaptures(CAP, '2026-06-10')
    assert.equal(z.needsAttention.length, 1)
    assert.match(z.needsAttention[0].title, /VIP email from Yaron/)
    assert.equal(z.needsAttention[0].at, '2026-06-10T14:20')
    assert.equal(z.signals.filter((s) => s.source === 'teams').length, 1)
    assert.equal(z.signals.filter((s) => s.source === 'sharepoint').length, 1)
    assert.equal(z.meetings.length, 1)
    assert.equal(z.meetings[0].start, '2026-06-10T16:00')
  })
  it('empty/absent captures → empty zones', () => {
    const z = parseCaptures(null, '2026-06-10')
    assert.deepEqual(z, { needsAttention: [], signals: [], meetings: [] })
  })
})

describe('parseSummary', () => {
  const SUM = [
    '# Day Summary — 2026-06-05', '',
    '## Narrative', '', 'A short day. Planning must move.', '',
    '## Follow-ups',
    '| # | Item | Person | Destination |',
    '|---|------|--------|-------------|',
    '| 1 | Reply to Sivan | Sivan | → vendor memory |',
    '',
    '## People noted',
    '- **Ofer Koifman** — VP Demand Gen',
  ].join('\n')
  it('parses summary, highlights, follow-ups', () => {
    const e = parseSummary(SUM)!
    assert.match(e.summary, /Planning must move/)
    assert.deepEqual(e.highlights, ['Ofer Koifman'])
    assert.equal(e.proposedFollowups.length, 1)
    assert.equal(e.proposedFollowups[0].title, 'Reply to Sivan')
  })
  it('absent summary → null', () => {
    assert.equal(parseSummary(null), null)
  })
  it('survives a blank line between the separator and the data rows', () => {
    const withBlank = SUM.replace('|---|------|--------|-------------|', '|---|------|--------|-------------|\n')
    const e = parseSummary(withBlank)!
    assert.equal(e.proposedFollowups.length, 1)
  })
})
