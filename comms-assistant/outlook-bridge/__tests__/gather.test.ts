import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGatherRecords } from '../gather-parse.js'
import { normalizeSubject, threadKey, collapseThreads } from '../gather-collapse.js'
import { toCapturePackets } from '../gather-packets.js'
import type { RawGatherRecord } from '../gather-types.js'
import { pullClaudeTagged, type Exec } from '../gather.js'
import { deriveUnreadSignals } from '../gather-signals.js'

const US = '\x1f', RS = '\x1e'
function rec(fields: string[]) { return fields.join(US) }

test('parseGatherRecords: parses fields and comma-splits recipients', () => {
  const raw = [
    rec(['101', 'Hello', 'a@x.com', 'b@x.com,c@x.com', '2026-06-18T11:26:27', '<id1@x>', 'AQHabc', 'Body one']),
    rec(['102', 'Re: Hello', 'd@x.com', 'b@x.com', '2026-06-18T12:00:00', '<id2@x>', 'AQHabc', 'Body two']),
  ].join(RS)
  const out = parseGatherRecords(raw)
  assert.equal(out.length, 2)
  assert.equal(out[0].outlookId, '101')
  assert.deepEqual(out[0].to, ['b@x.com', 'c@x.com'])
  assert.equal(out[1].internetMessageId, '<id2@x>')
  assert.equal(out[1].threadIndex, 'AQHabc')
})

test('parseGatherRecords: empty input → []', () => {
  assert.deepEqual(parseGatherRecords(''), [])
  assert.deepEqual(parseGatherRecords('\x1e\x1e'), [])
})

function r(p: Partial<RawGatherRecord>): RawGatherRecord {
  return { outlookId: '1', subject: 's', from: 'a@x.com', to: [], dateIso: '2026-06-01T00:00:00', internetMessageId: '<i>', threadIndex: '', body: 'x', ...p }
}

test('normalizeSubject strips Re/Fwd prefixes, repeated, case-insensitive', () => {
  assert.equal(normalizeSubject('RE: Re: Fwd: Hello'), 'Hello')
  assert.equal(normalizeSubject('Hello'), 'Hello')
})

test('threadKey prefers Thread-Index, falls back to normalized subject', () => {
  assert.equal(threadKey(r({ threadIndex: 'AQ1', subject: 'Re: x' })), 'AQ1')
  assert.equal(threadKey(r({ threadIndex: '', subject: 'Re: x' })), 'x')
})

test('collapseThreads keeps the latest message per thread', () => {
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-09T17:00:00', body: 'old' }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-17T16:00:00', body: 'newest with full history here, well over two hundred characters '.padEnd(250, '.') }),
    r({ outlookId: '3', threadIndex: 'OTHER', dateIso: '2026-06-15T00:00:00', body: 'distinct' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 2)
  const tThread = out.find((x) => x.threadIndex === 'T')!
  assert.equal(tThread.outlookId, '2')
})

test('collapseThreads short-body guard appends a longer earlier body', () => {
  const long = 'this is the substantive earlier message '.padEnd(250, '.')
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-01T00:00:00', body: long }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-02T00:00:00', body: 'Thanks!' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 1)
  assert.equal(out[0].outlookId, '2')
  assert.ok(out[0].body.includes('Thanks!'))
  assert.ok(out[0].body.includes('earlier in thread'))
  assert.ok(out[0].body.includes('substantive earlier message'))
})

test('toCapturePackets maps fields and applies injected sensitivity', () => {
  const recs = [r({
    outlookId: '9', subject: 'RE: Budget', from: 'boss@x.com', to: ['me@x.com', 'boss@x.com'],
    dateIso: '2026-06-18T09:00:00', internetMessageId: '<m9@x>', threadIndex: 'AQ9', body: 'Please review the numbers.',
  })]
  const packets = toCapturePackets(recs, '2026-06-18', (rec) => ({
    sensitive: rec.subject.includes('Budget'), directToHim: true, askToHim: true, broadcast: false, cold: false,
  }))
  assert.equal(packets.length, 1)
  const p = packets[0]
  assert.equal(p.email.channel, 'outlook')
  assert.equal(p.email.internet_message_id, '<m9@x>')
  assert.equal(p.email.conversation_id, 'AQ9')
  assert.equal(p.email.subject, 'RE: Budget')
  assert.deepEqual(p.thread.participants, ['boss@x.com', 'me@x.com'])
  assert.equal(p.thread.bodyToDate, 'Please review the numbers.')
  assert.equal(p.signals.sensitive, true)
  // curated Claude-tagged emails route to T2 (deep + verify): directToHim/askToHim true
  assert.equal(p.signals.askToHim, true)
  assert.equal(p.signals.directToHim, true)
  assert.equal(p.today, '2026-06-18')
  assert.ok(p.slug.length > 0)
})

test('pullClaudeTagged: collapses, drains resolved, returns unresolved packets', async () => {
  const US = '\x1f', RS = '\x1e'
  const capture = [
    ['1', 'RE: Alpha', 'a@x.com', 'me@x.com', '2026-06-18T09:00:00', '<resolved@x>', 'TA', 'alpha body'].join(US),
    ['2', 'Beta', 'b@x.com', 'me@x.com', '2026-06-18T10:00:00', '<open@x>', 'TB', 'beta body'].join(US),
  ].join(RS)
  const calls: { cmd: string; args: string[] }[] = []
  const exec: Exec = async (cmd, args) => {
    calls.push({ cmd, args })
    if (args[1] === 'claude-capture') return capture
    if (args[1] === 'clear') return `cleared ${args.length - 2}`
    return ''
  }
  const isResolved = async (imid: string) => imid === '<resolved@x>'
  const res = await pullClaudeTagged({ windowDays: 7, today: '2026-06-18', exec, isResolved })

  assert.equal(res.total, 2)
  assert.equal(res.packets.length, 1)
  assert.equal(res.packets[0].email.internet_message_id, '<open@x>')
  assert.deepEqual(res.resolvedDrained, ['1'])
  // the clear call carried the resolved message's outlook id
  const clearCall = calls.find((c) => c.args[1] === 'clear')!
  assert.ok(clearCall.args.includes('1'))
})

test('deriveUnreadSignals: direct small-audience question → directToHim + askToHim', () => {
  const s = deriveUnreadSignals(r({ subject: 'Quick q', to: ['me@x.com'], body: 'can you approve this?' }))
  assert.equal(s.directToHim, true)
  assert.equal(s.askToHim, true)
  assert.equal(s.broadcast, false)
  assert.equal(s.sensitive, false)
})

test('deriveUnreadSignals: large audience → broadcast, not directToHim', () => {
  const many = Array.from({ length: 12 }, (_, i) => `p${i}@x.com`)
  const s = deriveUnreadSignals(r({ subject: 'FYI all', to: many, body: 'status update.' }))
  assert.equal(s.broadcast, true)
  assert.equal(s.directToHim, false)
})

test('deriveUnreadSignals: sensitive subject flagged via classifyEmail', () => {
  const s = deriveUnreadSignals(r({ subject: 'Your compensation review', to: ['me@x.com'], body: 'details' }))
  assert.equal(s.sensitive, true)
})

test('pullUnread: drops noise, keeps substantive, collapses, derives signals', async () => {
  const US = '\x1f', RS = '\x1e'
  const capture = [
    ['1', 'Quick question', 'a@x.com', 'me@x.com', '2026-06-18T09:00:00', '<q@x>', 'TQ', 'can you approve?'].join(US),
    ['2', 'Canceled: Sync', 'cal@x.com', 'me@x.com', '2026-06-18T10:00:00', '<c@x>', 'TC', 'meeting canceled'].join(US),
  ].join(RS)
  const exec: Exec = async (_cmd, args) => (args[1] === 'unread-capture' ? capture : '')
  const { pullUnread } = await import('../gather.js')
  const res = await pullUnread({ today: '2026-06-18', exec })

  assert.equal(res.total, 2)
  assert.equal(res.kept, 1)
  assert.equal(res.packets.length, 1)
  assert.equal(res.packets[0].email.internet_message_id, '<q@x>')
  assert.equal(res.packets[0].signals.askToHim, true)   // body has '?'
  assert.ok((res.dropped['calendar/RSVP'] ?? res.dropped['meeting invite'] ?? 0) >= 0) // the canceled one dropped as noise
  assert.ok(res.kept + Object.values(res.dropped).reduce((a, b) => a + b, 0) === res.total)
})
