import type { Json } from '../../../lib/database.types.js'

// ── Command Types ───────────────────────────────────────────

export type DevTeamLeadCommand =
  | { type: 'plan'; feature: string }
  | { type: 'delegate'; planRef: string }
  | { type: 'review'; scope?: string }
  | { type: 'status' }

// ── Plan Result ─────────────────────────────────────────────

export interface ComponentSpec {
  name: string
  description: string
  props: string[]
  dataNeeds: string[]
  designNotes: string
}

export interface DataLayerSpec {
  hook: string
  view: string
  description: string
  returnType: string
}

export interface PlanStep {
  order: number
  agent: 'dev-backend' | 'dev-frontend'
  task: string
  spec: string
  dependencies: string[]
}

export interface FeaturePlan {
  ref: string
  feature: string
  overview: string
  routes: Array<{ path: string; page: string; description: string }>
  components: ComponentSpec[]
  dataLayer: DataLayerSpec[]
  designNotes: string
  buildSequence: PlanStep[]
  status: 'proposed' | 'approved' | 'in-progress' | 'completed'
}

export interface PlanResult {
  summary: string
  plan: FeaturePlan
}

// ── Delegate Result ─────────────────────────────────────────

export interface DelegateResult {
  summary: string
  tasksCreated: number
  backendTasks: string[]
  frontendTasks: string[]
}

// ── Review Result ───────────────────────────────────────────

export interface ReviewIssue {
  file: string
  issue: string
  severity: 'error' | 'warning' | 'info'
  suggestion: string
}

export interface ReviewResult {
  summary: string
  passed: boolean
  issues: ReviewIssue[]
  stats: {
    total: number
    errors: number
    warnings: number
    info: number
  }
}

// ── Status Result ───────────────────────────────────────────

export interface AgentStatus {
  slug: string
  pendingTasks: number
  completedTasks: number
  failedTasks: number
  lastActivity: string | null
}

export interface StatusResult {
  summary: string
  agents: AgentStatus[]
  activePlans: Array<{
    ref: string
    feature: string
    status: string
    tasksTotal: number
    tasksDone: number
  }>
  stats: {
    totalPending: number
    totalDone: number
    totalFailed: number
  }
}
