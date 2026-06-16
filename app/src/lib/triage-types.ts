export type TriageStatus = 'open' | 'sent' | 'dismissed' | 'snoozed'
export type FeedbackKind = 'edit' | 'action_override' | 'note' | 'status'

export interface CardEmail {
  subject: string | null; from: string | null; date: string | null
  to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
}
export interface CardContext {
  thread: string; rules: { statement?: string }[]; participants: { name?: string; role?: string }[]
  ownership: unknown | null; narrative: unknown[]; meta: unknown
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
}
