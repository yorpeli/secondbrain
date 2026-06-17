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

const emailPayload = (subject: string, to: string[] | null) => ({
  email: { subject, from: null, date: null, to, excerpt: null, webLink: null, thread_summary: null },
  thread: null, suggestion_extras: {} as never, context: {} as never,
})

test('fresh when no top-level reply keys and mode is not reply', () => {
  const c = card({
    mode: 'fresh', predicted_reply: 'Hello there',
    card: emailPayload('New topic', ['a@b.com']),
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'fresh')
  assert.deepEqual(r.to, ['a@b.com'])
  assert.equal(r.subject, 'New topic')
  assert.equal(r.body, 'Hello there')
})

test('reply from top-level internet_message_id; edited_reply wins; subject from card.email', () => {
  const c = card({
    mode: 'reply', internet_message_id: '<id@x>',
    predicted_reply: 'predicted', edited_reply: 'edited body',
    card: emailPayload('RE: HK CRN request', null),
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'reply')
  assert.equal(r.body, 'edited body')
  assert.equal(r.subject, 'RE: HK CRN request')
  assert.equal(r.replyKey?.internetMessageId, '<id@x>')
})

test('reply inferred from mode even with no ids; falls back to last_message_id', () => {
  const c = card({
    mode: 'reply', internet_message_id: null, last_message_id: '<last@x>',
    predicted_reply: 'hi', card: emailPayload('Re: thread', null),
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'reply')
  assert.equal(r.replyKey?.internetMessageId, '<last@x>')
})
