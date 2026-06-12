import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeWindow } from '../capture.js'
import { capturesToMarkdown } from '../dashboard-data.js'

const NOW = new Date('2026-06-07T09:00:00.000Z') // a Sunday

describe('computeWindow', () => {
  it('no prior capture → 3-day default lookback', () => {
    const w = computeWindow(null, NOW)
    assert.equal(w.reason, 'default-3d')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
    assert.equal(w.start, '2026-06-04T09:00:00.000Z')
  })

  it('last window_end within 7 days → start = last end (Sunday reaches back to Thursday)', () => {
    const thu = '2026-06-04T17:30:00.000Z'
    const w = computeWindow(thu, NOW)
    assert.equal(w.reason, 'last-capture')
    assert.equal(w.start, thu)
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })

  it('last window_end older than 7 days → capped at 7-day lookback', () => {
    const tenDaysAgo = '2026-05-28T09:00:00.000Z'
    const w = computeWindow(tenDaysAgo, NOW)
    assert.equal(w.reason, 'capped-7d')
    assert.equal(w.start, '2026-05-31T09:00:00.000Z')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })
})

describe('capturesToMarkdown', () => {
  it('reconstructs ## HH:MM blocks that parseCaptures understands', () => {
    const md = capturesToMarkdown(
      [
        {
          captured_at: '2026-06-07T09:15:00.000Z',
          headline: 'morning sweep',
          needs_attention: 'CLM rollout escalation',
          body_md: '**Teams:** rollout chatter\n**Mail:** none',
        },
        {
          captured_at: '2026-06-07T14:05:00.000Z',
          headline: 'midday sweep',
          needs_attention: null,
          body_md: '**Teams:** quiet',
        },
      ],
      'UTC'
    )
    assert.ok(md.startsWith('## 09:15 — morning sweep'))
    assert.ok(md.includes('**⚡ Needs attention:** CLM rollout escalation'))
    assert.ok(md.includes('## 14:05 — midday sweep'))
    // no ⚡ line for the block without needs_attention
    const second = md.slice(md.indexOf('## 14:05'))
    assert.ok(!second.includes('⚡'))
  })
})
