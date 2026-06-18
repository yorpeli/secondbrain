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

export interface MarkReadRequest {
  subject: string
  replyKey?: { internetMessageId?: string }
}

// The local Outlook bridge can flip the read flag instantly — but only for mail
// channels that carry a locate key (subject + Message-ID). Teams read-state is a
// different API, and a card with no key can't be found, so both fall straight
// through to the queued outlook-sync fallback (the button is already gated to
// outlook/email in the UI; the key check guards the rest).
export function canBridgeMarkRead(card: TriageCard): boolean {
  const ch = card.channel
  const hasKey = Boolean(card.internet_message_id ?? card.last_message_id)
  const subject = card.card?.email?.subject ?? ''
  return (ch === 'outlook' || ch === 'email') && hasKey && subject.trim() !== ''
}

export function buildMarkReadRequest(card: TriageCard): MarkReadRequest {
  const subject = card.card?.email?.subject ?? ''
  // Same locate key as a reply draft — internet Message-ID matches in headers.
  const internetMessageId = card.internet_message_id ?? card.last_message_id ?? undefined
  return { subject, replyKey: { internetMessageId } }
}

// "Open in Outlook" pops the desktop message via the bridge's /open route. Same
// locate shape as mark-read (subject + Message-ID); the bridge `open` branch just
// focuses the window — it never mutates the message.
export type OpenRequest = MarkReadRequest

export function buildOpenRequest(card: TriageCard): OpenRequest {
  return buildMarkReadRequest(card)
}

// The bridge can pop the desktop message only for mail channels with a real
// subject to locate against. Teams (and missing-subject cards) fall back to the
// web link in the UI.
export function canBridgeOpen(card: TriageCard): boolean {
  const ch = card.channel
  const subject = card.card?.email?.subject ?? ''
  return (ch === 'outlook' || ch === 'email') && subject.trim() !== ''
}
