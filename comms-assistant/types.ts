// Shared interfaces for the comms-learning backtest pipeline.
export type Mode = 'reply' | 'initiated'
export type ConfidenceBand = 'high' | 'med' | 'low'
export type Resolution = 'match' | 'edited' | 'out_of_band' | 'no_reply'
export type RuleType = 'style' | 'decision'
export type RuleStatus = 'watch' | 'active' | 'superseded' | 'retired'

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
  disposition: string | null          // reply | delegate | defer | escalate | ignore | sensitive
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
