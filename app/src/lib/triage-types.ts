export type TriageStatus = 'open' | 'sent' | 'dismissed' | 'snoozed'
export type FeedbackKind = 'edit' | 'action_override' | 'note' | 'status'

export interface CardEmail {
  subject: string | null; from: string | null; date: string | null
  to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
  internet_message_id?: string | null; conversation_id?: string | null
}
export interface CardParticipant {
  name?: string; role?: string; relation?: string; inDb?: boolean; email?: string; slug?: string
}
export interface CardRule { statement?: string; weight?: string }
export interface CardNarrative { provenance?: string }
export interface CardOwnership { redLines?: string[] }
export interface CardContext {
  thread: string
  rules: CardRule[]
  participants: CardParticipant[]
  ownership: CardOwnership | null
  narrative: CardNarrative[]
  meta: unknown
}
export interface CardPayload {
  email: CardEmail
  thread: unknown
  suggestion_extras: {
    memory_brief: unknown | null
    text_alt: string | null; lang: string | null; lang_alt: string | null
    secondary: string | null; sources: unknown | null
  }
  context: CardContext
}
export interface VerdictLens {
  lens?: string; issue?: string; refuted?: boolean; severity?: string
}
export interface CardVerdict {
  flagged?: boolean
  verdicts?: VerdictLens[]
}
export interface TriageCard {
  id: string
  channel: string
  action_type: string | null
  action_target: string | null
  predicted_reply: string | null
  edited_reply: string | null
  action_accepted: boolean | null
  confidence: string | null
  why: string | null
  status: TriageStatus
  sensitive: boolean
  card: CardPayload | null
  created_at: string
  needs_data?: boolean | null
  tier?: number | null
  verdict?: CardVerdict | null
  trigger_text?: string | null
  web_link?: string | null
  context_available?: { draft_why?: string | null } | null
}
