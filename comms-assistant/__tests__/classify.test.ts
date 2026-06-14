import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyEmail } from '../classify.js'

describe('classifyEmail', () => {
  it('calendar RSVP subject → noise, no prediction', () => {
    const c = classifyEmail({ subject: 'Accepted: CLM Leadership - Q3 Planning', sender: 'x', recipients: [] })
    assert.equal(c.isNoise, true)
    assert.equal(c.needsPrediction, false)
  })

  it('office notification subject → noise', () => {
    const c = classifyEmail({ subject: 'Yonatan Orpeli mentioned you in "Jun_11_PPP".', sender: 'x', recipients: [] })
    assert.equal(c.isNoise, true)
    assert.equal(c.needsPrediction, false)
  })

  it('genuine reply → isReply + needsPrediction', () => {
    const c = classifyEmail({ subject: 'Re: eBay Kenya manual review', sender: 'x', recipients: ['a@p.com'] })
    assert.equal(c.isReply, true)
    assert.equal(c.isNoise, false)
    assert.equal(c.needsPrediction, true)
  })

  it('sensitive reply → flagged, not predicted in v1', () => {
    const c = classifyEmail({ subject: 'Re: Compensation review', sender: 'x', recipients: [] })
    assert.equal(c.isSensitive, true)
    assert.equal(c.needsPrediction, false)
  })

  it('initiated (non-reply) → not predicted', () => {
    const c = classifyEmail({ subject: 'War room set up', sender: 'x', recipients: [] })
    assert.equal(c.isReply, false)
    assert.equal(c.needsPrediction, false)
  })
})
