/**
 * Outlook Agent helpers (Claude Code side).
 *
 * The `outlook-agent` surface is Claude-for-Outlook. It picks up tasks queued
 * here (agent_tasks, target_agent = 'outlook-agent'), executes them against the
 * mailbox/calendar, and writes results back. This module is the Claude Code
 * side: queue requests, read what came back, and promote results into human
 * tables (with provenance). Two directions: pull results from the agent, and
 * list inbound captures the agent pushes for triage. Acts only on demand.
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

// ─── Promote into initiative memory (with provenance) ────

export interface MemoryAppend {
  /** Exact heading line in the memory doc, e.g. '## Key Decisions'. */
  section: string
  /** Lines to append under that section (provenance is added automatically). */
  lines: string[]
}

export interface PromoteSource {
  person: string
  subject: string
  date: string // YYYY-MM-DD
  threadId?: string
}

export interface PromoteOptions {
  initiativeSlug: string
  appends: MemoryAppend[]
  source: PromoteSource
  /** When true, returns the would-be content without writing. */
  dryRun?: boolean
}

export interface PromoteResult {
  ok: boolean
  preview?: string
  error?: string
}

/** Provenance marker appended to every promoted line. */
function provenanceMarker(source: PromoteSource): string {
  // Inner double-quotes would break the italic markdown; downgrade to single.
  const subject = source.subject.replace(/"/g, "'")
  // Retain the Outlook thread id so promoted intel is traceable back to the source.
  const id = source.threadId ? `, id:${source.threadId}` : ''
  return ` *[via email: ${source.person}, "${subject}", ${source.date}${id}]*`
}

/**
 * Insert `lines` under a markdown `## Section` heading, before the next `## `
 * heading (or at end of doc / end of file if it's the last section). If the
 * section is missing, a new section is appended at the end of the document.
 */
export function appendUnderSection(content: string, section: string, lines: string[]): string {
  // Anchor the heading to the start of a line (or start of doc) so a section
  // name appearing in prose inside an earlier section is never matched.
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const headingRe = new RegExp(`(^|\\n)(${escaped})(\\n|$)`)
  const match = headingRe.exec(content)
  if (!match) {
    return `${content.trimEnd()}\n\n${section}\n${lines.join('\n')}\n`
  }
  const afterHeading = match.index + match[1].length + match[2].length
  const rest = content.slice(afterHeading)
  const nextHeadingRel = rest.search(/\n## /)
  if (nextHeadingRel === -1) {
    return `${content.trimEnd()}\n${lines.join('\n')}\n`
  }
  const insertAt = afterHeading + nextHeadingRel
  const before = content.slice(0, insertAt).trimEnd()
  const after = content.slice(insertAt)
  return `${before}\n${lines.join('\n')}\n${after}`
}

/**
 * Promote email-sourced intel into an initiative memory doc. Every appended
 * line carries a [via email: …] provenance marker. Caller composes the exact
 * lines (Claude does this after Yonatan confirms); this enforces provenance and
 * the markdown structure. Use dryRun to preview before writing.
 */
export async function promoteToInitiativeMemory(opts: PromoteOptions): Promise<PromoteResult> {
  if (opts.appends.length === 0) {
    return { ok: false, error: 'No appends provided — nothing to promote.' }
  }
  const supabase = await getSupabase()

  const { data: init, error: initErr } = await supabase
    .from('initiatives' as any)
    .select('id')
    .eq('slug', opts.initiativeSlug)
    .single()
  if (initErr || !init) {
    return { ok: false, error: `Initiative not found: ${opts.initiativeSlug}` }
  }

  const { data: mem, error: memErr } = await supabase
    .from('content_sections' as any)
    .select('id, content')
    .eq('entity_id', (init as any).id)
    .eq('section_type', 'memory')
    .single()
  if (memErr || !mem) {
    return { ok: false, error: `Memory doc not found for ${opts.initiativeSlug}` }
  }

  const marker = provenanceMarker(opts.source)
  const rawContent = (mem as any).content as string | null
  if (!rawContent) {
    return { ok: false, error: `Memory doc for ${opts.initiativeSlug} has empty content` }
  }
  let content = rawContent
  for (const a of opts.appends) {
    const marked = a.lines.map(l => `${l}${marker}`)
    content = appendUnderSection(content, a.section, marked)
  }

  if (opts.dryRun) {
    return { ok: true, preview: content }
  }

  const today = new Date().toISOString().slice(0, 10)
  const { error: upErr } = await supabase
    .from('content_sections' as any)
    .update({ content, date: today, updated_at: new Date().toISOString() } as any)
    .eq('id', (mem as any).id)
  if (upErr) {
    return { ok: false, error: upErr.message }
  }
  return { ok: true, preview: content }
}

// ─── Inbound captures (push direction: Outlook → board → triage) ────

/** A captured thread is either fully extracted, or a sensitive stub (per the spec). */
export type CapturedThread = OutlookThread | { subject_topic: string; sensitive: true }

export interface InboundCapture {
  id: string
  title: string
  note: string | null
  captured_at: string | null
  threads: CapturedThread[]
  created_at: string | null
}

/**
 * List pending inbound-capture tasks pushed from Outlook (created_by =
 * 'claude-outlook'). Parses the JSON description payload; rows whose payload
 * type is not 'inbound-capture' are skipped.
 */
export async function listInboundCaptures(limit = 20): Promise<InboundCapture[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, created_at')
    .eq('created_by', 'claude-outlook')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[outlook] Failed to read inbound captures:', error.message)
    return []
  }

  const rows = (data || []) as unknown as Array<{
    id: string
    title: string
    description: string | null
    created_at: string | null
  }>

  const captures: InboundCapture[] = []
  for (const row of rows) {
    let payload: any = {}
    try {
      payload = row.description ? JSON.parse(row.description) : {}
    } catch {
      payload = {}
    }
    if (payload.type !== 'inbound-capture') continue
    captures.push({
      id: row.id,
      title: row.title,
      note: payload.note ?? null,
      captured_at: payload.captured_at ?? null,
      threads: Array.isArray(payload.threads) ? payload.threads : [],
      created_at: row.created_at,
    })
  }
  return captures
}
