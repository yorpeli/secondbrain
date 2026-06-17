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

  // Reply keys live on the TOP-LEVEL capture columns (comms_predictions), not in
  // card.email. A card is a reply when capture tagged mode='reply' or it carries a
  // message-id to thread against; reply-all derives recipients, so `to` is unused there.
  const internetMessageId = card.internet_message_id ?? card.last_message_id ?? undefined
  const isReply = card.mode === 'reply' || Boolean(internetMessageId)

  if (isReply) {
    return { mode: 'reply', to, subject, body, replyKey: { internetMessageId } }
  }
  return { mode: 'fresh', to, subject, body }
}
