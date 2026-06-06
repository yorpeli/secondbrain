/**
 * Initiative Tracker — refresh-from-ppp
 *
 * Two-phase, Claude-in-the-loop design:
 *   plan(week)   → read-only scaffold of every initiative a PPP week touches
 *                  (matched slug, memory_id, prior/current status, stored
 *                  summary, parsed "Blocked By" excerpt, idempotency flag,
 *                  plus a `suggested` default the model can curate from).
 *   apply(payload) → deterministic applier. Takes Claude-authored per-initiative
 *                  text and writes it into each memory doc by manipulating the
 *                  doc as a string (append PPP signal, prepend Status on change,
 *                  append blockers), idempotent + verified.
 *
 * The model authors the prose; this module owns matching, anchors, and writes.
 * Mapping below is the source of truth for workstream → initiative(s); new
 * lanes (unmapped) are surfaced in the plan so they never get silently dropped.
 */

// ─── Workstream → Initiative mapping ─────────────────────────
// Keep current with the deck. Empty array = intentionally no initiative
// (skip, but report). Unknown workstreams are surfaced as `unmapped`.

export const WORKSTREAM_TO_INITIATIVES: Record<string, string[]> = {
  'Full Rollout': ['clm-full-rollout'],
  'T1 Localization': ['t1-localization'],
  'Partners Rollout': ['partners-rollout'],
  'Compliance-related Improvements': ['compliance-data-quality'],
  'China/Hong Kong': ['china-hong-kong'],
  'Vendor Optimization': ['vendor-optimization'],
  'KYC New Flow': ['kyc-new-flow'],
  'Lead Scoring': ['lead-scoring'],
  'Licenses': ['licenses-regulation', 'india-license'],
  'BackOffice': ['backoffice-modernization'],
  'Agentic KYC': ['claude-kyc-agent'],
  'Dashboards and Monitoring': ['clm-dashboards-monitoring'],
  // Intentionally no initiative record (skip, but report in plan):
  'Product UX': [],
  'eBay': [],
}

const PPP_SIGNAL_HEADERS = ['## PPP Signals (week-over-week)', '## PPP Signals']
const BLOCKER_HEADERS = ['## Blockers & Risks', '## Blockers and Risks', '## Blockers']
const STATUS_HEADERS = ['## Status']

// ─── Types ───────────────────────────────────────────────────

export interface PlanEntry {
  workstream: string
  initiative_slug: string
  memory_id: string
  current_status: string | null
  previous_status: string | null
  status_changed: boolean
  already_present: boolean // week already in this doc's PPP Signals section
  stored_summary: string | null
  blocked_by_excerpt: string | null
  /** Default the model can accept or curate before apply. */
  suggested: {
    ppp_signal: string
    status_line: string | null
    blockers: string[]
  }
}

export interface PlanResult {
  week_date: string
  previous_week_date: string | null
  entries: PlanEntry[]
  unmapped_workstreams: string[] // appeared in PPP, no mapping entry
  no_initiative_workstreams: string[] // mapped to [] on purpose
  missing_memory: { workstream: string; slug: string }[] // slug exists but no memory doc
}

export interface ApplyEntry {
  initiative_slug: string
  ppp_signal: string // full bullet line, e.g. "- 2026-06-04: at-risk — …"
  status_line?: string | null // full status line if status changed, else null/omit
  blockers?: string[] // full bullet lines, [] if none
}

export interface ApplyPayload {
  week_date: string
  entries: ApplyEntry[]
}

export interface ApplyEntryResult {
  initiative_slug: string
  outcome: 'updated' | 'skipped' | 'error'
  detail: string
  changes?: { ppp_signal: boolean; status: boolean; blockers: number }
}

export interface ApplyResult {
  week_date: string
  results: ApplyEntryResult[]
  updated: number
  skipped: number
  errored: number
}

// ─── Supabase ────────────────────────────────────────────────

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

interface SwimSection {
  workstream_name: string
  status: string | null
  summary: string | null
  raw_text: string | null
}

async function loadWeekSections(weekDate: string): Promise<SwimSection[]> {
  const supabase = await getSupabase()
  const { data: report } = await supabase
    .from('ppp_reports')
    .select('id')
    .eq('week_date', weekDate)
    .single()
  if (!report) return []
  const { data } = await supabase
    .from('ppp_sections')
    .select('workstream_name, status, summary, raw_text')
    .eq('report_id', (report as any).id)
  return (data || []) as unknown as SwimSection[]
}

async function resolveWeeks(week?: string): Promise<{ current: string | null; previous: string | null }> {
  const supabase = await getSupabase()
  let current = week ?? null
  if (!current) {
    const { data } = await supabase
      .from('ppp_reports').select('week_date').order('week_date', { ascending: false }).limit(1).single()
    current = (data as any)?.week_date ?? null
  }
  if (!current) return { current: null, previous: null }
  const { data: prev } = await supabase
    .from('ppp_reports').select('week_date').lt('week_date', current)
    .order('week_date', { ascending: false }).limit(1)
  const previous = ((prev || []) as any[])[0]?.week_date ?? null
  return { current, previous }
}

interface MemoryDoc { id: string; slug: string; content: string }

async function loadMemoryDocs(slugs: string[]): Promise<Map<string, MemoryDoc>> {
  const supabase = await getSupabase()
  const map = new Map<string, MemoryDoc>()
  if (slugs.length === 0) return map
  const { data } = await supabase
    .from('initiatives')
    .select('slug, content_sections!inner(id, content, section_type, entity_id)')
    .in('slug', slugs)
  // The nested select shape varies; fall back to a manual two-step if needed.
  if (data && (data as any[]).length) {
    for (const row of data as any[]) {
      const mem = (row.content_sections || []).find((cs: any) => cs.section_type === 'memory')
      if (mem) map.set(row.slug, { id: mem.id, slug: row.slug, content: mem.content })
    }
  }
  // Fill any misses via explicit join (covers PostgREST embedding quirks).
  const missing = slugs.filter(s => !map.has(s))
  if (missing.length) {
    const { data: inits } = await supabase.from('initiatives').select('id, slug').in('slug', missing)
    for (const it of (inits || []) as any[]) {
      const { data: cs } = await supabase
        .from('content_sections').select('id, content')
        .eq('entity_id', it.id).eq('section_type', 'memory').limit(1).single()
      if (cs) map.set(it.slug, { id: (cs as any).id, slug: it.slug, content: (cs as any).content })
    }
  }
  return map
}

// ─── String manipulation (the reliable applier core) ─────────

interface SectionSpan { headerIndex: number; bodyStart: number; bodyEnd: number }

function findSection(lines: string[], headers: string[]): SectionSpan | null {
  const wanted = headers.map(h => h.toLowerCase())
  for (let i = 0; i < lines.length; i++) {
    if (wanted.includes(lines[i].trim().toLowerCase())) {
      let j = i + 1
      while (j < lines.length && !/^##\s/.test(lines[j])) j++
      return { headerIndex: i, bodyStart: i + 1, bodyEnd: j }
    }
  }
  return null
}

/** Text of a section's body (between its header and the next `## `), or null. */
export function sectionBody(content: string, headers: string[]): string | null {
  const lines = content.split('\n')
  const span = findSection(lines, headers)
  if (!span) return null
  return lines.slice(span.bodyStart, span.bodyEnd).join('\n')
}

/** Append a bullet after the last non-empty line of a section; create the section if absent. */
export function appendToSection(content: string, headers: string[], bullet: string): string {
  const lines = content.split('\n')
  const span = findSection(lines, headers)
  if (!span) {
    const trimmed = content.replace(/\s+$/, '')
    return `${trimmed}\n\n${headers[0]}\n${bullet}\n`
  }
  let insertAt = span.bodyEnd
  while (insertAt > span.bodyStart && lines[insertAt - 1].trim() === '') insertAt--
  lines.splice(insertAt, 0, bullet)
  return lines.join('\n')
}

/** Insert a new status line directly under `## Status` (newest on top). Returns null if no Status header. */
export function prependStatus(content: string, statusLine: string): string | null {
  const lines = content.split('\n')
  const span = findSection(lines, STATUS_HEADERS)
  if (!span) return null
  lines.splice(span.headerIndex + 1, 0, statusLine, '')
  return lines.join('\n')
}

/** Idempotency: is this week already recorded in the doc's PPP Signals section? */
export function weekAlreadyPresent(content: string, week: string): boolean {
  const body = sectionBody(content, PPP_SIGNAL_HEADERS)
  return body != null && body.includes(week)
}

// ─── Blocked-By extraction (hint for the plan only) ──────────

function extractBlockedBy(rawText: string | null): string | null {
  if (!rawText) return null
  // Grab text after a "Blocked By" heading up to the next known heading.
  const m = rawText.match(/Blocked By[^\n]*\n([\s\S]*?)(?:\n[A-Z][^\n]*?:\s*\n|\nPlanned for Next Week|\nNext:|\n---|$)/i)
  const body = (m?.[1] ?? '').trim()
  return body ? body.slice(0, 600) : null
}

// ─── Plan ────────────────────────────────────────────────────

export async function plan(week?: string): Promise<PlanResult> {
  const { current, previous } = await resolveWeeks(week)
  if (!current) {
    return { week_date: '', previous_week_date: null, entries: [], unmapped_workstreams: [], no_initiative_workstreams: [], missing_memory: [] }
  }

  const [currSections, prevSections] = await Promise.all([
    loadWeekSections(current),
    previous ? loadWeekSections(previous) : Promise.resolve([] as SwimSection[]),
  ])
  const prevStatus = new Map(prevSections.map(s => [s.workstream_name, s.status]))

  // Figure out which slugs we need memory docs for.
  const wantedSlugs = new Set<string>()
  for (const s of currSections) {
    const slugs = WORKSTREAM_TO_INITIATIVES[s.workstream_name]
    if (slugs) for (const sl of slugs) wantedSlugs.add(sl)
  }
  const docs = await loadMemoryDocs([...wantedSlugs])

  const entries: PlanEntry[] = []
  const unmapped: string[] = []
  const noInitiative: string[] = []
  const missingMemory: { workstream: string; slug: string }[] = []

  for (const s of currSections) {
    const mapping = WORKSTREAM_TO_INITIATIVES[s.workstream_name]
    if (mapping === undefined) { unmapped.push(s.workstream_name); continue }
    if (mapping.length === 0) { noInitiative.push(s.workstream_name); continue }

    for (const slug of mapping) {
      const doc = docs.get(slug)
      if (!doc) { missingMemory.push({ workstream: s.workstream_name, slug }); continue }

      const prev = prevStatus.get(s.workstream_name) ?? null
      const statusChanged = prev != null && s.status != null && prev !== s.status
      const blocked = extractBlockedBy(s.raw_text)

      const pppSignal = `- ${current}: ${s.status ?? 'na'} — ${(s.summary ?? '').trim()}`
      const statusLine = statusChanged
        ? `**[${current}] ${labelFor(s.status)}** (PPP) — ${firstSentence(s.summary)}`
        : null
      const blockers = blocked ? [`- [${current}] ${blocked.replace(/\s*\n\s*/g, ' ')}`] : []

      entries.push({
        workstream: s.workstream_name,
        initiative_slug: slug,
        memory_id: doc.id,
        current_status: s.status,
        previous_status: prev,
        status_changed: statusChanged,
        already_present: weekAlreadyPresent(doc.content, current),
        stored_summary: s.summary,
        blocked_by_excerpt: blocked,
        suggested: { ppp_signal: pppSignal, status_line: statusLine, blockers },
      })
    }
  }

  return {
    week_date: current,
    previous_week_date: previous,
    entries,
    unmapped_workstreams: unmapped,
    no_initiative_workstreams: noInitiative,
    missing_memory: missingMemory,
  }
}

function labelFor(status: string | null): string {
  switch (status) {
    case 'on-track': return 'On track'
    case 'potential-issues': return 'Potential issues'
    case 'at-risk': return 'At risk'
    case 'na': return 'N/A'
    default: return status ?? 'Unknown'
  }
}

function firstSentence(text: string | null): string {
  if (!text) return ''
  const m = text.trim().match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : text).trim()
}

// ─── Apply ───────────────────────────────────────────────────

export async function apply(payload: ApplyPayload): Promise<ApplyResult> {
  const supabase = await getSupabase()
  const week = payload.week_date
  const results: ApplyEntryResult[] = []

  // Load all target docs once.
  const slugs = payload.entries.map(e => e.initiative_slug)
  const docs = await loadMemoryDocs(slugs)
  const today = new Date().toISOString().slice(0, 10)

  for (const entry of payload.entries) {
    const doc = docs.get(entry.initiative_slug)
    if (!doc) {
      results.push({ initiative_slug: entry.initiative_slug, outcome: 'error', detail: 'no memory doc found' })
      continue
    }
    if (weekAlreadyPresent(doc.content, week)) {
      results.push({ initiative_slug: entry.initiative_slug, outcome: 'skipped', detail: `week ${week} already in PPP Signals` })
      continue
    }

    let content = doc.content
    const changes = { ppp_signal: false, status: false, blockers: 0 }
    const warnings: string[] = []

    // 1) PPP signal (required)
    if (entry.ppp_signal && entry.ppp_signal.trim()) {
      content = appendToSection(content, PPP_SIGNAL_HEADERS, entry.ppp_signal.trim())
      changes.ppp_signal = true
    }
    // 2) Status (only when provided)
    if (entry.status_line && entry.status_line.trim()) {
      const next = prependStatus(content, entry.status_line.trim())
      if (next) { content = next; changes.status = true }
      else warnings.push('no "## Status" header — status line skipped')
    }
    // 3) Blockers (optional)
    for (const b of entry.blockers ?? []) {
      if (!b || !b.trim()) continue
      content = appendToSection(content, BLOCKER_HEADERS, b.trim())
      changes.blockers++
    }

    if (!changes.ppp_signal && !changes.status && changes.blockers === 0) {
      results.push({ initiative_slug: entry.initiative_slug, outcome: 'skipped', detail: 'nothing to write' })
      continue
    }

    const { error } = await supabase
      .from('content_sections')
      .update({ content, date: today, updated_at: new Date().toISOString() })
      .eq('id', doc.id)

    if (error) {
      results.push({ initiative_slug: entry.initiative_slug, outcome: 'error', detail: error.message, changes })
    } else {
      // Verify the write landed.
      const { data: check } = await supabase
        .from('content_sections').select('content').eq('id', doc.id).single()
      const ok = check && weekAlreadyPresent((check as any).content, week)
      results.push({
        initiative_slug: entry.initiative_slug,
        outcome: ok ? 'updated' : 'error',
        detail: ok ? [`signal${changes.status ? '+status' : ''}${changes.blockers ? `+${changes.blockers} blocker(s)` : ''}`, ...warnings].join('; ') : 'verification failed (week not found after write)',
        changes,
      })
    }
  }

  return {
    week_date: week,
    results,
    updated: results.filter(r => r.outcome === 'updated').length,
    skipped: results.filter(r => r.outcome === 'skipped').length,
    errored: results.filter(r => r.outcome === 'error').length,
  }
}
