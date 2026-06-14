// Shared interfaces for the comms-learning backtest pipeline.
export type Mode = 'reply' | 'initiated'
export type ConfidenceBand = 'high' | 'med' | 'low'
export type Resolution = 'match' | 'edited' | 'out_of_band' | 'no_reply'
export type RuleType = 'style' | 'decision'
export type RuleStatus = 'watch' | 'active' | 'superseded' | 'retired'

// The suggested ACTION — the response to a comm is often an action aimed elsewhere, not an
// in-thread reply. `disposition` is the legacy field; `action.type` supersedes it (disposition
// kept as alias during migration). See docs/superpowers/specs/2026-06-14-comms-suggested-actions.md.
export type ActionType =
  | 'reply'      // respond in the thread (default)
  | 'redirect'   // respond, but to a different audience (e.g. brief your leaders, not the thread)
  | 'sidebar'    // message a third party the thread implies (e.g. ping the vendor/owner directly)
  | 'route'      // hand to the owner by name — do NOT publicly instruct them
  | 'task'       // create a follow-up / plan item
  | 'escalate'   // take to a 1:1 / upward
  | 'schedule'   // propose/confirm a sync
  | 'monitor'    // watch, no action now
  | 'none'       // nothing warranted

export interface SuggestedAction {
  type: ActionType
  target: string | null                                  // who/what it's aimed at (free text)
  channel?: 'outlook' | 'teams' | 'task' | '1:1'         // where the action lands
  secondary?: string | null                              // optional one-line secondary action
}

// The card payload the prediction sub-agent produces and render-triage.ts consumes (items.json).
export interface Suggestion {
  action?: SuggestedAction              // primary action (+ optional secondary); falls back to {type: disposition}
  disposition?: string | null           // legacy alias for action.type — kept for backward-compat rendering
  needs_data?: boolean | null
  confidence?: ConfidenceBand | string | null
  text?: string | null                  // drafted message (null for task/monitor/none)
  why?: string | null
  lang?: string; lang_alt?: string; text_alt?: string | null   // HE⇄EN toggle
  memory_brief?: string | { summary?: string; points?: string[] }
}

export interface ContextAvailable {
  personInDb?: boolean
  initiativeMemory?: boolean
  priorThread?: boolean
  coldStart?: boolean
}

export interface PredictionRow {
  id?: string
  mode: Mode
  thread_id: string | null
  message_id: string | null
  internet_message_id: string | null
  web_link: string | null
  channel: string
  as_of: string
  trigger_text: string | null
  disposition: string | null          // legacy: reply | delegate | defer | escalate | ignore | sensitive (alias for action_type)
  action_type: ActionType | string | null   // suggested action taxonomy (supersedes disposition)
  action_target: string | null         // who/what the action is aimed at (free text)
  needs_data: boolean | null           // right reply depends on numbers we don't have (flag, don't fetch)
  predicted_reply: string | null
  predicted_stance: string | null     // the predicted stance label, stored at predict time
  confidence: ConfidenceBand | null
  confidence_score: number | null
  context_available: ContextAvailable
  actual_reply: string | null
  delta: Record<string, unknown> | null
  resolution: Resolution | null
  why: string | null
  derived_rule_ids: string[]
  sensitive: boolean
  created_at?: string
}

export interface RuleRow {
  id?: string
  scope: { person?: string; initiative?: string; topic?: string; channel?: string }
  type: RuleType
  statement: string
  confidence: number
  support: number
  consistency: number
  diversity: number
  data_dependency: string | null
  status: RuleStatus
  supersedes: string | null
  pinned: boolean
  created_at?: string
  updated_at?: string
}
