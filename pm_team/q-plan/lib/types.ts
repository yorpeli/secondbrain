/**
 * Q-Plan PM — Command & Result Types
 *
 * Types for all commands: ingest, status, update, analyze, review.
 */

import type { Json } from '../../../lib/database.types.js'

// ─── Command Types ───────────────────────────────────────────

export type QPlanCommand =
  | { type: 'ingest'; hlFile: string; executionFiles?: string[]; quarter: string; initiative: string }
  | { type: 'status'; quarter?: string }
  | { type: 'update'; deliverableId?: string; planItemId?: string; status: string; notes?: string }
  | { type: 'analyze'; quarter?: string }
  | { type: 'review'; quarter: string }

// ─── Shared Data Types ───────────────────────────────────────

export interface PlanItemRow {
  id: string
  plan_id: string
  initiative_id: string | null
  title: string
  description: string | null
  theme: string | null
  expected_impact_current_q: string | null
  expected_impact_next_q: string | null
  status: string
  sort_order: number
}

export interface DeliverableRow {
  id: string
  plan_item_id: string
  title: string
  description: string | null
  theme: string | null
  timing: string | null
  target_date: string | null
  completed_date: string | null
  expected_impact: string | null
  actual_outcome: string | null
  dependencies: string | null
  risks: string | null
  status: string
  sort_order: number
}

export interface ProgressRow {
  quarter: string
  plan_status: string
  plan_item_id: string
  plan_item_title: string
  theme: string | null
  item_status: string
  expected_impact_current_q: string | null
  expected_impact_next_q: string | null
  initiative_slug: string | null
  initiative_title: string | null
  initiative_priority: string | null
  total_deliverables: number
  done_deliverables: number
  in_progress_deliverables: number
  at_risk_deliverables: number
  planned_deliverables: number
  cut_deliverables: number
}

// ─── Ingest Types ────────────────────────────────────────────

export interface ParsedHLItem {
  title: string
  description: string
  expectedImpactCurrentQ: string | null
  expectedImpactNextQ: string | null
}

export interface ParsedDeliverable {
  title: string
  theme: string
  timing: string | null
  expectedImpact: string | null
  dependencies: string | null
  parentHLItem: string  // matched to HL item title
}

export interface IngestProposal {
  quarter: string
  initiativeSlug: string
  initiativeTitle: string | null
  hlItems: ParsedHLItem[]
  deliverables: ParsedDeliverable[]
  unmatchedDeliverables: ParsedDeliverable[]
}

export interface IngestResult {
  summary: string
  proposal: IngestProposal
  requiresApproval: true
}

// ─── Status Types ────────────────────────────────────────────

export interface PlanItemStatus {
  title: string
  theme: string | null
  status: string
  expectedImpact: string | null
  total: number
  done: number
  inProgress: number
  atRisk: number
  planned: number
  cut: number
  overdueDeliverables: DeliverableRow[]
}

export interface QPlanFlag {
  severity: 'red' | 'yellow' | 'info'
  flag: string
  detail: string
  planItem?: string
  deliverable?: string
  recommendedAction?: string
}

export interface StatusResult {
  summary: string
  quarter: string
  initiativeGroups: Array<{
    initiative: string
    slug: string | null
    priority: string | null
    items: PlanItemStatus[]
  }>
  flags: QPlanFlag[]
  stats: {
    totalItems: number
    totalDeliverables: number
    doneDeliverables: number
    atRiskDeliverables: number
    overdueDeliverables: number
    completionPct: number
  }
}

// ─── Update Types ────────────────────────────────────────────

export interface UpdateResult {
  summary: string
  updated: Array<{
    id: string
    title: string
    previousStatus: string
    newStatus: string
  }>
}

// ─── Analyze Types ───────────────────────────────────────────

export interface AnalyzeResult {
  summary: string
  quarter: string
  slippagePatterns: Array<{
    pattern: string
    detail: string
    affectedItems: string[]
  }>
  impactGaps: Array<{
    planItem: string
    expectedImpact: string
    currentStatus: string
    gap: string
  }>
  recommendations: string[]
}

// ─── Review Types ────────────────────────────────────────────

export interface ReviewResult {
  summary: string
  quarter: string
  shipped: Array<{ title: string; actualOutcome: string | null }>
  cut: Array<{ title: string; reason: string | null }>
  rolledForward: Array<{ title: string; status: string }>
  lessons: string[]
}
