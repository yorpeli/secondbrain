import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync, existsSync } from 'node:fs'
import { computeWindow, readMarker, writeMarker } from '../capture.js'

const NOW = new Date('2026-06-07T09:00:00.000Z') // a Sunday

describe('computeWindow', () => {
  it('no marker → 3-day default lookback', () => {
    const w = computeWindow(null, NOW)
    assert.equal(w.reason, 'default-3d')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
    assert.equal(w.start, '2026-06-04T09:00:00.000Z')
  })

  it('marker within 7 days → start = marker (Sunday reaches back to Thursday)', () => {
    const thu = '2026-06-04T17:30:00.000Z'
    const w = computeWindow(thu, NOW)
    assert.equal(w.reason, 'marker')
    assert.equal(w.start, thu)
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })

  it('marker older than 7 days → capped at 7-day lookback', () => {
    const tenDaysAgo = '2026-05-28T09:00:00.000Z'
    const w = computeWindow(tenDaysAgo, NOW)
    assert.equal(w.reason, 'capped-7d')
    assert.equal(w.start, '2026-05-31T09:00:00.000Z')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })
})

describe('marker IO round-trip', () => {
  it('writes then reads the same ISO timestamp; absent file → null', () => {
    const p = join(tmpdir(), `cc-marker-test-${process.pid}`)
    if (existsSync(p)) rmSync(p)
    assert.equal(readMarker(p), null)
    writeMarker('2026-06-07T09:00:00.000Z', p)
    assert.equal(readMarker(p), '2026-06-07T09:00:00.000Z')
    rmSync(p)
  })
})
