import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { consistencyOf, confidenceScore, isPromotable, statusFor, THRESHOLDS } from '../confidence.js'

describe('confidence', () => {
  it('consistency = support / (support+contradict)', () => {
    assert.equal(consistencyOf({ support: 3, contradict: 1, diversity: 2 }), 0.75)
  })

  it('promotes when all thresholds met', () => {
    assert.equal(isPromotable({ support: 3, contradict: 0, diversity: 2 }), true)
  })

  it('blocks promotion when support too low', () => {
    assert.equal(isPromotable({ support: 2, contradict: 0, diversity: 2 }), false)
  })

  it('blocks promotion when consistency below 0.7', () => {
    assert.equal(isPromotable({ support: 5, contradict: 3, diversity: 3 }), false)
  })

  it('pinned is always active', () => {
    assert.equal(statusFor({ support: 1, contradict: 0, diversity: 1 }, true), 'active')
  })

  it('thresholds are the agreed v1 values', () => {
    assert.deepEqual(THRESHOLDS, { support: 3, consistency: 0.7, diversity: 2 })
  })

  it('confidenceScore in [0,1]', () => {
    const s = confidenceScore({ support: 5, contradict: 0, diversity: 3 })
    assert.equal(s, 1)
  })
})
