/**
 * AB Testing Agent — TypeScript Types
 */

import type { AnalysisVerdict, ExperimentLifecycle } from '../config/constants.js'

// ─── Commands ────────────────────────────────────────────────

export type ABTestingCommand =
  | { type: 'list'; status?: ExperimentLifecycle }
  | { type: 'analyze'; slug?: string; expid?: string }

// ─── Experiment Registry ─────────────────────────────────────

export interface Experiment {
  slug: string
  name: string
  expid: string                          // e.g. "EXPID-165"
  asana_task_id: string                  // Asana task GID for re-sync
  experiment_id: string | null           // Looker experiment ID, e.g. "fdcDynamicContent_172"
  lifecycle: ExperimentLifecycle

  // From Asana (read-only source)
  hypothesis: string | null
  objective: string | null
  main_kpis: string[]
  success_criteria: string | null
  owner: string | null                   // PM name
  audience: string | null
  start_date: string | null
  estimated_end_date: string | null
  end_date: string | null
  result: string | null                  // Asana result text
  decision: string | null                // Go / No Go
  quarter: string | null
  winning_variant: string | null

  // Looker query config
  looker_filter: {
    field: string           // filter field, e.g. "persona_experiment_group" or "experiments_dimension_selector"
    field_value: string     // value to set on the filter field (e.g. "Control,Test" or "full address persona experiment group")
    values: string[]        // expected variant labels in results, e.g. ["Control", "Test"]
    variant_field: string   // the Looker field name returned as the grouping dimension
    date_filter?: string    // override date range, e.g. "after 2026/01/12"
    filter_overrides?: Record<string, string>  // override or add to CLM_DEFAULT_FILTERS
  } | null
  link_to_analysis: string | null
  link_to_measurement: string | null
  link_to_design: string | null

  // Agent-managed
  tags: string[]
  analysis_history: AnalysisHistoryEntry[]
  notes: string | null
}

// ─── Analysis ────────────────────────────────────────────────

export interface AnalysisHistoryEntry {
  date: string                           // ISO date
  query_id: number | null                // Looker inline query ID
  verdict: AnalysisVerdict
  metrics: MetricResult[]
  sample_size: { control: number; treatment: number }
  notes: string | null
}

export interface MetricResult {
  metric: string
  control_rate: number
  treatment_rate: number
  lift_pct: number
  p_value: number
  significant: boolean
}

// ─── Experiment Registry File ────────────────────────────────

export interface ExperimentRegistry {
  version: number
  updated_at: string
  experiments: Experiment[]
}

// ─── Statistical Test Results ────────────────────────────────

export interface ProportionTestResult {
  z_score: number
  p_value: number
  significant: boolean
  lift_pct: number
  control_rate: number
  treatment_rate: number
}
