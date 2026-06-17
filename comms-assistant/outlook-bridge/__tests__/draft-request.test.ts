import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateDraftRequest, buildOsascriptArgs } from '../draft-request.js'

test('rejects non-object', () => {
  assert.equal(validateDraftRequest(null).ok, false)
  assert.equal(validateDraftRequest('x').ok, false)
})

test('rejects bad mode', () => {
  const r = validateDraftRequest({ mode: 'send', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('rejects empty body', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: '' })
  assert.equal(r.ok, false)
})

test('fresh requires at least one recipient', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: [], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('reply requires non-empty subject', () => {
  const r = validateDraftRequest({ mode: 'reply', to: [], subject: '', body: 'b' })
  assert.equal(r.ok, false)
})

test('accepts valid fresh', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value.mode, 'fresh')
})

test('accepts valid reply', () => {
  const r = validateDraftRequest({
    mode: 'reply', to: [], subject: 'Hello', body: 'hi',
    replyKey: { internetMessageId: '<abc@x>' },
  })
  assert.equal(r.ok, true)
})

test('buildOsascriptArgs fresh joins recipients, empty imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'fresh', to: [' a@b.com ', 'c@d.com', ''], subject: 'Sub', body: 'Body',
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'fresh', 'Sub', 'Body', 'a@b.com,c@d.com', ''])
})

test('buildOsascriptArgs reply empty recipients, passes imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'reply', to: [], subject: 'Re: x', body: 'Body', replyKey: { internetMessageId: '<id@x>' },
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'reply', 'Re: x', 'Body', '', '<id@x>'])
})
