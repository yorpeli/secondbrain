/**
 * AI PM — Types
 */

// ─── Portfolio (inward loop) ─────────────────────────────────

export interface InitiativeSnapshot {
  slug: string
  title: string
  status: string | null // initiatives.status
  priority: string | null
  assigned_agent: string | null
  memory_status_line: string | null // first line under ## Status in the memory doc
  memory_updated: string | null
  latest_ppp_signal: string | null
  open_blockers: number
  pending_tasks: number
  on_hold: boolean
}

export interface PortfolioFlag {
  slug: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

export interface PortfolioResult {
  generated_for_days: number
  snapshots: InitiativeSnapshot[]
  flags: PortfolioFlag[]
  summary: string
}

// ─── Learning (outward loop) ─────────────────────────────────

export interface ResearchAgendaItem {
  kind: 'demand' | 'sweep'
  source: string // initiative slug (demand) or watchlist key (sweep)
  topic: string
  rationale: string
  existing_research?: { topic: string; freshness_date: string; stale: boolean }[]
}

export interface ScanPlanResult {
  generated_at: string
  agenda: ResearchAgendaItem[]
  watchlist_sources: string[]
  stale_research: { topic: string; freshness_date: string }[]
  on_hold: string[] // parked initiatives excluded from the demand agenda
  note: string
}

/** A single Claude-authored research finding to persist (scan --store). */
export interface ScanStoreEntry {
  topic: string
  research_type: 'domain' | 'competitive' | 'market' | 'regulatory'
  summary: string
  content: string
  source_urls?: string[]
  tags?: string[]
  /** Initiative slugs this finding informs (for the apply-to-initiative note). */
  applies_to?: string[]
}

export interface ScanStorePayload {
  entries: ScanStoreEntry[]
}

export interface ScanStoreResult {
  stored: number
  errored: number
  results: { topic: string; outcome: 'stored' | 'error'; detail: string }[]
}

// ─── Brief (apply learnings to one initiative) ───────────────

export interface BriefResult {
  slug: string
  title: string
  status_line: string | null
  open_questions: string[]
  blockers: string[]
  relevant_research: { topic: string; summary: string; freshness_date: string; similarity?: number }[]
  semantic_context: { entity_type: string; chunk_text: string; similarity: number }[]
  summary: string
}

// ─── Task runner ─────────────────────────────────────────────

export type AiPmCommand =
  | { type: 'portfolio'; days?: number }
  | { type: 'brief'; slug: string }
  | { type: 'scan' }
  | { type: 'synthesize'; days?: number }
