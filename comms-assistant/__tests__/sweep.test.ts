import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decideSweepAction } from '../sweep.js'

describe('decideSweepAction', () => {
  it('no open row → analyze', () => {
    assert.equal(decideSweepAction({ exists: false }, 'm1'), 'analyze')
  })
  it('open + user_touched → skip', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: true, lastMessageId: 'm1' }, 'm2'), 'skip')
  })
  it('open + same latest message → skip', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, 'm1'), 'skip')
  })
  it('open + new inbound → refresh', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, 'm2'), 'refresh')
  })
  it('open + new inbound but missing latest id → skip (cannot prove advance)', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, null), 'skip')
  })
})
