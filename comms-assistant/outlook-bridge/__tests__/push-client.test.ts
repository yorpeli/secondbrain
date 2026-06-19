import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pushFreshDraft } from '../push-client.js'

function fakeFetch(captured: any[], response: { status: number; body: any }) {
  return async (url: any, init: any) => {
    captured.push({ url, init })
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
    } as any
  }
}

describe('pushFreshDraft', () => {
  it('POSTs a fresh draft with the token header and returns ok', async () => {
    const captured: any[] = []
    const res = await pushFreshDraft(
      { to: ['elad@payoneer.com'], subject: 'India timeline', body: 'Hi Elad —\n\nQuick note.' },
      { url: 'http://127.0.0.1:7777', token: 'secret', fetchFn: fakeFetch(captured, { status: 200, body: { ok: true, mode: 'fresh' } }) },
    )
    assert.equal(res.ok, true)
    assert.equal(captured.length, 1)
    assert.equal(captured[0].url, 'http://127.0.0.1:7777/draft')
    assert.equal(captured[0].init.headers['x-bridge-token'], 'secret')
    const sent = JSON.parse(captured[0].init.body)
    assert.equal(sent.mode, 'fresh')
    assert.deepEqual(sent.to, ['elad@payoneer.com'])
    assert.equal(sent.subject, 'India timeline')
  })

  it('returns ok:false with the bridge error message on non-2xx', async () => {
    const res = await pushFreshDraft(
      { to: ['x@y.com'], subject: 's', body: 'b' },
      { token: 't', fetchFn: fakeFetch([], { status: 401, body: { ok: false, error: 'bad or missing token' } }) },
    )
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /token/)
  })

  it('returns ok:false (bridge down) when fetch throws', async () => {
    const res = await pushFreshDraft(
      { to: ['x@y.com'], subject: 's', body: 'b' },
      { token: 't', fetchFn: async () => { throw new Error('ECONNREFUSED') } },
    )
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /ECONNREFUSED|bridge/i)
  })
})
