/**
 * Hub Countries PM — Result Types
 *
 * Types for all commands: check-in and investigate.
 */

import type { Json } from '../../../lib/database.types.js'
import type { HubCountry } from './country-config.js'

// ─── Command Types ───────────────────────────────────────────

export type HubCountriesCommand =
  | { type: 'check-in'; days?: number }
  | { type: 'investigate'; country: string; topic?: string }

// ─── Shared Data Types ───────────────────────────────────────

export interface PppSection {
  section_id: string
  report_id: string
  week_date: string
  workstream_name: string
  lead_name: string | null
  lead_slug: string | null
  status: string | null
  quality_score: number | null
  quality_notes: string | null
  summary: string | null
  raw_text: string | null
  tags: string[] | null
  contributors: string[] | null
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

export interface ResearchEntry {
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

export interface CompletedAgentTask {
  id: string
  title: string
  description: string | null
  result_summary: string | null
  result_details: Json | null
  completed_at: string | null
  tags: string[] | null
}

// ─── Check-in Types ──────────────────────────────────────────

export interface CountryFlag {
  severity: 'red' | 'yellow' | 'info'
  flag: string
  detail: string
  country: string
  recommendedAction?: string
}

export interface CountrySnapshot {
  country: HubCountry
  ppp: {
    sections: PppSection[]
    statusSummary: string
  }
  analytics: {
    lastAnalysis: string | null
    recentFindings: AgentLogEntry[]
    dataStale: boolean
  }
  research: {
    entries: ResearchEntry[]
  }
  recentActivity: AgentLogEntry[]
  flags: CountryFlag[]
}

export interface CheckInResult {
  summary: string
  countries: CountrySnapshot[]
  flags: CountryFlag[]
  recommendations: string[]
  stats: {
    countriesChecked: number
    redFlags: number
    yellowFlags: number
    staleData: number
  }
}

// ─── Investigate Types ───────────────────────────────────────

export interface InvestigationResult {
  summary: string
  country: string
  topic?: string
  pppHistory: PppSection[]
  analyticsResults: CompletedAgentTask[]
  agentFindings: AgentLogEntry[]
  researchResults: ResearchEntry[]
  flags: CountryFlag[]
  openQuestions: string[]
  recommendedActions: string[]
}
