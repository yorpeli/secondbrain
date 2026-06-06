import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderDashboard, orderCapturesNewestFirst } from '../build-dashboard.js'

const TEMPLATE =
  '<title>{{DATE}}</title>|{{GENERATED_AT}}|{{REFRESH_SECONDS}}|' +
  'F:{{FOCUS_HTML}}|C:{{CAPTURES_HTML}}|S:{{SUMMARY_HTML}}'

describe('orderCapturesNewestFirst', () => {
  it('orders ## HH:MM blocks newest-first when written append-order (oldest-first)', () => {
    const md = '## 09:00 — morning\nfirst thing\n\n## 14:00 — afternoon\nlater thing'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.indexOf('14:00') < out.indexOf('09:00'))
  })

  it('orders by HH:MM regardless of file write order (regression: file already newest-first)', () => {
    // The agent wrote the file newest-first (prepended). It must NOT be flipped to oldest-first.
    const md = '## 14:00 — afternoon\nlater\n\n## 09:00 — morning\nearlier'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.indexOf('14:00') < out.indexOf('09:00'))
  })

  it('sorts across an unsorted file purely by timestamp', () => {
    const md = '## 11:00 — b\n.\n\n## 23:24 — d\n.\n\n## 09:00 — a\n.\n\n## 14:00 — c\n.'
    const out = orderCapturesNewestFirst(md)
    const order = ['23:24', '14:00', '11:00', '09:00'].map((t) => out.indexOf(t))
    assert.deepEqual(order, [...order].sort((x, y) => x - y))
  })

  it('keeps preamble above the blocks', () => {
    const md = 'intro line\n\n## 09:00 — a\nx\n\n## 10:00 — b\ny'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.startsWith('intro line'))
    assert.ok(out.indexOf('10:00') < out.indexOf('09:00'))
  })

  it('un-timestamped ## blocks sort after timestamped ones', () => {
    const md = '## a note without time\nfoo\n\n## 09:00 — real\nbar'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.indexOf('09:00') < out.indexOf('a note without time'))
  })
})

describe('renderDashboard', () => {
  it('substitutes date, refresh, and rendered focus', () => {
    const html = renderDashboard({
      template: TEMPLATE,
      date: '2026-06-05',
      focusMd: '## Status\n- on track',
      capturesMd: null,
      summaryMd: null,
      generatedAt: '2026-06-05 08:00',
      refreshSeconds: 60,
    })
    assert.ok(html.includes('<title>2026-06-05</title>'))
    assert.ok(html.includes('|60|'))
    assert.ok(html.includes('F:<h2>Status</h2>'))
    assert.ok(html.includes('<li>on track</li>'))
  })

  it('uses empty placeholders when sections are missing', () => {
    const html = renderDashboard({
      template: TEMPLATE,
      date: '2026-06-05',
      focusMd: null,
      capturesMd: null,
      summaryMd: null,
      generatedAt: '2026-06-05 08:00',
      refreshSeconds: 60,
    })
    assert.ok(html.includes('C:<p class="empty">No signals captured yet today.</p>'))
    assert.ok(html.includes('S:<p class="empty">No end-of-day summary yet.</p>'))
  })
})
