/**
 * PPP Ingest Agent — Types
 */

// ─── Payload Types (input to write command) ─────────────────

export interface PppSectionPayload {
  workstream_name: string
  lead_slug: string
  contributors: string[]
  status: 'on-track' | 'potential-issues' | 'at-risk' | 'na'
  quality_score: number // 1-5
  quality_notes: string
  summary: string
  raw_text: string
  tags: string[]
}

export interface PppPayload {
  week_date: string // YYYY-MM-DD
  overall_summary: string
  private_notes: string | null
  replace_existing: boolean
  sections: PppSectionPayload[]
}

// ─── Context Types (output of context command) ───────────────

export interface PeopleMap {
  [slugOrName: string]: { id: string; slug: string; name: string }
}

export interface PreviousWeekSection {
  workstream_name: string
  lead_name: string | null
  status: string | null
  quality_score: number | null
  summary: string | null
  tags: string[] | null
}

export interface PppContext {
  previous_week: {
    week_date: string | null
    sections: PreviousWeekSection[]
  }
  people: PeopleMap
  tag_dictionary: {
    themes: string[]
    domains: string[]
    vendors: string[]
    countries: string[]
  }
  default_contributors: Record<string, string[]>
  current_focus: string | null
}

// ─── Write Result ────────────────────────────────────────────

export interface WriteResult {
  success: boolean
  report_id: string | null
  sections_written: number
  errors: string[]
  backup_path: string | null
}

// ─── Enrich Types ────────────────────────────────────────────

export interface StatusChange {
  workstream: string
  from: string
  to: string
}

export interface SemanticInsight {
  entity_type: string
  chunk_text: string
  similarity: number
  workstream: string
}

export interface EnrichResult {
  week_date: string
  previous_week_date: string | null
  new_workstreams: string[]
  dropped_workstreams: string[]
  status_changes: StatusChange[]
  score_changes: { workstream: string; from: number; to: number }[]
  lead_changes: { workstream: string; from: string | null; to: string | null }[]
  cross_swimlane_patterns: string[]
  context_alignment: string[]
  context_gaps: string[]
  new_signals: string[]
  dispatched_tasks: DispatchedTask[]
  semantic_insights?: SemanticInsight[]
  summary: string
}

// ─── Dispatcher Types ────────────────────────────────────────

export interface DispatchedTask {
  target_agent: string
  title: string
  description: string // JSON command for the target agent
  priority: 'low' | 'normal' | 'high'
  reason: string // Why this task was dispatched (for summary)
}

// ─── Command Types (for task runner) ─────────────────────────

export type PppCommand =
  | { type: 'context' }
  | { type: 'write'; path: string; replace_existing?: boolean }
  | { type: 'enrich'; week?: string }
