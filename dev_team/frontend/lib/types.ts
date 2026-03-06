import type { Json } from '../../../lib/database.types.js'

// ── Command Types ───────────────────────────────────────────

export type DevFrontendCommand =
  | { type: 'build'; component: string; spec: string; planRef?: string; dependencies?: string[] }
  | { type: 'refactor'; target: string; reason?: string }

// ── Build Result ────────────────────────────────────────────

export interface BuildResult {
  summary: string
  filesCreated: string[]
  filesModified: string[]
  component: string
  status: 'complete' | 'partial' | 'blocked'
  blockers?: string[]
}

// ── Refactor Result ─────────────────────────────────────────

export interface RefactorResult {
  summary: string
  filesModified: string[]
  improvements: string[]
}
