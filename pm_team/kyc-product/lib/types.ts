/**
 * KYC Product PM — Result Types
 *
 * Types for all commands: research, audit, synthesize.
 */

import type { Json } from '../../../lib/database.types.js'

// ─── Command Types ───────────────────────────────────────────

export type KycProductCommand =
  | { type: 'research'; topic: string; phase?: number }
  | { type: 'audit' }
  | { type: 'synthesize'; phase?: number }

// ─── Playbook Config ────────────────────────────────────────

export interface ResearchWorkstream {
  id: string
  name: string
  phase: number
  description: string
  /** Tags to search in research_results, agent_log, PPP */
  searchTags: string[]
  /** Which agents can produce research for this workstream */
  requiredAgents: string[]
  /** Data that requires human input */
  humanDataNeeded: string[]
}

export interface PhaseDefinition {
  number: number
  name: string
  description: string
  workstreams: string[] // workstream IDs
}

// ─── Shared Data Types ──────────────────────────────────────

export interface ExistingResearch {
  id: string
  topic: string
  research_type: string
  agent_slug: string
  summary: string
  status: string
  freshness_date: string
  tags: string[] | null
  created_at: string | null
}

export interface AgentLogEntry {
  id: string
  agent_slug: string
  category: string
  summary: string
  details: Json | null
  tags: string[] | null
  created_at: string | null
}

export interface CompletedAgentTask {
  id: string
  title: string
  description: string | null
  result_summary: string | null
  result_details: Json | null
  completed_at: string | null
  tags: string[] | null
  status: string
  target_agent: string | null
  created_by: string | null
}

export interface PppSection {
  section_id: string
  report_id: string
  week_date: string
  workstream_name: string
  lead_name: string | null
  lead_slug: string | null
  status: string | null
  quality_score: number | null
  summary: string | null
  raw_text: string | null
  tags: string[] | null
}

// ─── Research Command Types ─────────────────────────────────

export interface KnowledgeGap {
  area: string
  description: string
  source: 'agent' | 'human'
  /** Which agent or 'yonatan' */
  assignTo: string
  priority: 'high' | 'normal' | 'low'
  taskCreated?: boolean
  taskId?: string
}

export interface WorkstreamStatus {
  workstream: ResearchWorkstream
  existingResearch: ExistingResearch[]
  relevantFindings: AgentLogEntry[]
  completedTasks: CompletedAgentTask[]
  pendingTasks: CompletedAgentTask[]
  gaps: KnowledgeGap[]
  completionEstimate: 'not-started' | 'early' | 'partial' | 'substantial' | 'complete'
}

export interface ResearchResult {
  summary: string
  topic: string
  workstreamStatus: WorkstreamStatus
  tasksCreated: { title: string; targetAgent: string | null; id: string | null }[]
  recommendations: string[]
}

export interface ResearchStatusResult {
  summary: string
  phases: {
    phase: number
    name: string
    workstreams: {
      id: string
      name: string
      completion: string
      researchCount: number
      pendingTasks: number
      gaps: number
    }[]
  }[]
  overallProgress: string
  nextSteps: string[]
}

// ─── Audit Command Types ────────────────────────────────────

export interface CapabilityArea {
  name: string
  knownFacts: string[]
  dataFromSystem: string[]
  gaps: string[]
}

export interface AuditResult {
  summary: string
  capabilities: CapabilityArea[]
  pppInsights: { workstream: string; summary: string; status: string }[]
  analyticsInsights: string[]
  humanDataNeeded: KnowledgeGap[]
  tasksCreated: { title: string; targetAgent: string | null; id: string | null }[]
}

// ─── Synthesize Command Types ───────────────────────────────

export interface PhaseSummary {
  phase: number
  name: string
  status: 'not-started' | 'in-progress' | 'complete'
  keyFindings: string[]
  gaps: string[]
  completionPct: number
}

export interface SynthesisResult {
  summary: string
  phases: PhaseSummary[]
  currentPhase: number
  moatValidation: {
    moat: string
    status: 'validated' | 'partially-validated' | 'unvalidated' | 'challenged'
    evidence: string[]
  }[]
  pendingHumanTasks: { title: string; created: string; status: string }[]
  nextSteps: string[]
}
