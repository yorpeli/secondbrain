import type { Json } from '../../../lib/database.types.js'

// ─── Command Types ───────────────────────────────────────────

export type TeamLeadCommand =
  | { type: 'hygiene'; days?: number }
  | { type: 'synthesize'; days?: number; agents?: string[] }
  | { type: 'enforce'; workflow?: string }

// ─── Dashboard Task (from v_agent_tasks_dashboard) ───────────

export interface DashboardTask {
  id: string
  title: string
  status: string
  priority: string | null
  target_agent: string | null
  picked_up_by: string | null
  created_by: string | null
  due_date: string | null
  parent_task_id: string | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
  result_summary: string | null
  agent_name: string | null
  agent_type: string | null
  health: string | null
}

// ─── Hygiene Result ──────────────────────────────────────────

export interface HygieneIssue {
  taskId: string
  title: string
  issueType: 'overdue' | 'stale' | 'stuck' | 'failed-no-followup' | 'needs-human'
  detail: string
  targetAgent: string | null
  priority: string | null
}

export interface HygieneResult {
  summary: string
  issues: HygieneIssue[]
  stats: {
    total: number
    overdue: number
    stale: number
    stuck: number
    failedNoFollowup: number
    needsHuman: number
  }
}

// ─── Synthesize Result ───────────────────────────────────────

export interface SynthesizeResult {
  summary: string
  themes: string[]
  gaps: string[]
  recommendations: string[]
  details: {
    logEntriesAnalyzed: number
    tasksAnalyzed: number
    agentsCovered: string[]
    periodDays: number
  }
}

// ─── Enforce Result ──────────────────────────────────────────

export interface ComplianceCheck {
  check: string
  passed: boolean
  detail: string
  agent?: string
}

export interface EnforceResult {
  summary: string
  checks: ComplianceCheck[]
  stats: {
    total: number
    passed: number
    failed: number
  }
}

// ─── Agent Log Entry (from agent_log table) ──────────────────

export interface AgentLogEntry {
  id: string
  agent_slug: string
  category: string
  summary: string
  details: Json | null
  tags: string[] | null
  created_at: string | null
}

// ─── Completed Task (for synthesis) ──────────────────────────

export interface CompletedTask {
  id: string
  title: string
  target_agent: string | null
  picked_up_by: string | null
  result_summary: string | null
  result_details: Json | null
  completed_at: string | null
  tags: string[] | null
}
