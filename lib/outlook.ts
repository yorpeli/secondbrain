/**
 * Outlook Agent helpers (Claude Code side).
 *
 * The `outlook-agent` surface is Claude-for-Outlook. It picks up tasks queued
 * here (agent_tasks, target_agent = 'outlook-agent'), executes them against the
 * mailbox/calendar, and writes results back. This module is the Claude Code
 * side: queue requests, read what came back, and promote results into human
 * tables (with provenance). Pull-only: we never act on email except via a task.
 */

import { createTask } from './tasks.js'

const AGENT_SLUG = 'outlook-agent'

async function getSupabase() {
  const { getSupabase: gs } = await import('./supabase.js')
  return gs()
}

// ─── Types ───────────────────────────────────────────────

export type ExtractField = 'summary' | 'decisions' | 'action_items' | 'deadlines'

export interface ThreadLookupInput {
  query: string
  person?: string
  personSlug?: string
  timeframe?: string
  extract?: ExtractField[]
  initiativeSlug?: string
}

export interface OutlookActionItem {
  who: string
  what: string
  due: string | null
}

export interface OutlookThread {
  subject: string
  participants: string[]
  last_message_date: string
  outlook_thread_id: string
  decisions?: string[]
  action_items?: OutlookActionItem[]
  deadlines?: string[]
  sensitive: boolean
  subject_topic?: string
  note?: string
}

export interface OutlookResultDetails {
  threads: OutlookThread[]
  not_found: boolean
  initiative_slug?: string | null
}

export interface OutlookResult {
  id: string
  title: string
  status: string
  result_summary: string | null
  result_details: OutlookResultDetails | null
  completed_at: string | null
}

// ─── Request ─────────────────────────────────────────────

/** Queue a thread-lookup task for the Outlook agent. Returns the task id. */
export async function requestThreadLookup(input: ThreadLookupInput): Promise<string | null> {
  const payload = {
    type: 'thread-lookup',
    query: input.query,
    ...(input.person ? { person: input.person } : {}),
    ...(input.personSlug ? { person_slug: input.personSlug } : {}),
    ...(input.timeframe ? { timeframe: input.timeframe } : {}),
    extract: input.extract ?? ['summary', 'decisions', 'action_items', 'deadlines'],
    ...(input.initiativeSlug ? { initiative_slug: input.initiativeSlug } : {}),
  }

  const titlePerson = input.person ? ` — ${input.person}` : ''
  return createTask({
    title: `Thread lookup: ${input.query}${titlePerson}`,
    description: JSON.stringify(payload),
    targetAgent: AGENT_SLUG,
    createdBy: 'claude-code',
    tags: ['outlook-agent', 'thread-lookup'],
  })
}

// ─── Read results ────────────────────────────────────────

/** List the most recent completed Outlook results. */
export async function listOutlookResults(limit = 20): Promise<OutlookResult[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, status, result_summary, result_details, completed_at')
    .eq('target_agent', AGENT_SLUG)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[outlook] Failed to read results:', error.message)
    return []
  }
  return (data || []) as unknown as OutlookResult[]
}

/** Fetch a single Outlook task result by id. */
export async function getOutlookResult(taskId: string): Promise<OutlookResult | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, status, result_summary, result_details, completed_at')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('[outlook] Failed to read result:', error.message)
    return null
  }
  return data as unknown as OutlookResult
}
