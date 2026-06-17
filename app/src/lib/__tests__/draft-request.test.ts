import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDraftRequest } from '../draft-request.js'
import type { TriageCard } from '../triage-types.js'

function card(partial: Partial<TriageCard>): TriageCard {
  return {
    id: 'x', channel: 'outlook', action_type: null, action_target: null,
    predicted_reply: null, edited_reply: null, action_accepted: null,
    confidence: null, why: null, status: 'pending' as TriageCard['status'],
    sensitive: false, card: null, created_at: '', ...partial,
  } as TriageCard
}

test('fresh when no message ids present', () => {
  const c = card({
    predicted_reply: 'Hello there',
    card: { email: { subject: 'New topic', from: null, date: null, to: ['a@b.com'], excerpt: null, webLink: null, thread_summary: null }, thread: null, suggestion_extras: {} as never, context: {} as never },
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'fresh')
  assert.deepEqual(r.to, ['a@b.com'])
  assert.equal(r.subject, 'New topic')
  assert.equal(r.body, 'Hello there')
})

test('reply when internet_message_id present; edited_reply wins', () => {
  const c = card({
    predicted_reply: 'predicted', edited_reply: 'edited body',
    card: { email: { subject: 'Re: thread', from: 'x@y.com', date: null, to: ['a@b.com'], excerpt: null, webLink: null, thread_summary: null, internet_message_id: '<id@x>', conversation_id: 'conv1' }, thread: null, suggestion_extras: {} as never, context: {} as never },
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'reply')
  assert.equal(r.body, 'edited body')
  assert.equal(r.replyKey?.internetMessageId, '<id@x>')
  assert.equal(r.replyKey?.conversationId, 'conv1')
})
