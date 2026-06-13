import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { filterAsOf } from '../asof.js'

const ASOF = '2026-06-10T12:00:00.000Z'

describe('filterAsOf', () => {
  it('excludes records updated after asOf', () => {
    const out = filterAsOf([{ updated_at: '2026-06-11T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 0)
  })

  it('includes records updated before asOf', () => {
    const out = filterAsOf([{ updated_at: '2026-06-09T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 1)
  })

  it('includes a record exactly at asOf (<=)', () => {
    const out = filterAsOf([{ updated_at: ASOF }], ASOF)
    assert.equal(out.length, 1)
  })

  it('excludes records with no timestamp (blind by default)', () => {
    const out = filterAsOf([{ updated_at: null, created_at: null }], ASOF)
    assert.equal(out.length, 0)
  })

  it('falls back to created_at when updated_at is missing', () => {
    const out = filterAsOf([{ created_at: '2026-06-01T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 1)
  })
})
