import type { TriageCard } from './triage-types'

export interface DraftRequest {
  mode: 'fresh' | 'reply'
  to: string[]
  subject: string
  body: string
  replyKey?: { internetMessageId?: string; conversationId?: string }
}

export function buildDraftRequest(card: TriageCard): DraftRequest {
  const email = card.card?.email
  const subject = email?.subject ?? ''
  const to = email?.to ?? []
  const body = card.edited_reply ?? card.predicted_reply ?? ''
  const internetMessageId = email?.internet_message_id ?? undefined
  const conversationId = email?.conversation_id ?? undefined

  if (internetMessageId || conversationId) {
    return { mode: 'reply', to, subject, body, replyKey: { internetMessageId, conversationId } }
  }
  return { mode: 'fresh', to, subject, body }
}
