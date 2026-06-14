// retrieve.ts — tiered context assembly for the comms-assistant prediction agent.
//
// assembleContext(thread) gathers everything the predictor needs, tier by tier. Each tier
// has a DISTINCT source and method — that separation is the whole design:
//
//   spine  rules     comms_rules, scope-matched       SQL          "what makes it sound like Yonatan"
//   T1     identity  people + v_org_tree              exact SQL    who is X, role, relation to Yonatan
//   T2     ownership context_store comms_org_ownership load-whole   KYC ∈ CLM, reporting chain, red-lines
//   T3     narrative content_sections/agent_log/ppp…  searchByType what's going on (fuzzy, capped, last)
//
// ANTI-DILUTION: facts that must be EXACTLY right (who, who-owns-what) come from exact
// lookups — never a vector search. Only the fuzzy "where does this stand" is semantic, capped,
// and fenced as low-trust. Prompt precedence: thread → rules → T1/T2 → T3.
//
// AS-OF / BLINDNESS — this is the only backtest-vs-live difference, and it's ONE optional
// cutoff, not a separate code path:
//   • Live mode  → thread.asOf omitted ⇒ every as-of filter below short-circuits (no-op).
//                  Nothing to remove when we go live; the live path IS this code with no cutoff.
//   • Backtest   → thread.asOf set ⇒ T3 snippets and (optionally) rules are filtered to content
//                  that existed at/before asOf, via the SOURCE row's timestamp.
//   T2 is treated as as-of-invariant structural truth (KYC∈CLM held in May too); it is never
//   age-filtered. T1 exposes only slow-moving structural fields (+ a styleNote gated by asOf).

import type { RuleStatus, RuleType } from './types.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

const YONATAN_SLUG = 'yonatan-orpeli'

// ── Inputs ──────────────────────────────────────────────────────────────────

export interface ThreadInput {
  subject: string
  participants: string[]      // sender + To/Cc emails on the incoming trigger
  mentions?: string[]         // @mentioned emails inside the body (often the real targets)
  bodyToDate: string          // incoming trigger + thread-to-date (strongest signal)
  asOf?: string               // omit for live (=now); set to incoming receivedDateTime for backtest
}

// ── Spine ─────────────────────────────────────────────────────────────────────

export interface RuleHit {
  id: string
  type: RuleType
  statement: string
  status: RuleStatus
  confidence: number
  weight: 'assert' | 'whisper' | 'track'   // active&high→assert, active&med→whisper, else→track
  scope: { person?: string; initiative?: string; topic?: string; channel?: string }
}

// ── T1 ─────────────────────────────────────────────────────────────────────────

export type Relation =
  | 'direct-report' | 'skip-level' | 'peer' | 'manager' | 'external' | 'unknown'

export interface PersonCard {
  email: string
  inDb: boolean
  name?: string
  slug?: string
  role?: string
  team?: string
  relation: Relation
  styleNote?: string          // non-private working_style only; gated by asOf
}

// ── T2 ─────────────────────────────────────────────────────────────────────────

export interface OwnershipMap {
  domains: Record<string, { owner_team: string; owner_person?: string; note?: string }>
  clmScope: string
  reportingChain: string[]
  redLines: string[]
  referenceFacts?: Record<string, unknown>   // load-whole reference facts (e.g. office geography) — always surfaced to drafting
  updatedAt?: string
}

// ── T3 ─────────────────────────────────────────────────────────────────────────

export type NarrativeType =
  | 'initiative_memory' | 'initiative_context' | 'agent_log' | 'project_decision' | 'ppp' | 'research' | 'initiative'

export interface Snippet {
  type: string
  text: string
  provenance: string
  score: number
  sourceAt?: string | null    // resolved source timestamp used for as-of filtering
}

// ── Bundle ───────────────────────────────────────────────────────────────────

export interface ContextBundle {
  thread: string
  rules: RuleHit[]
  participants: PersonCard[]
  ownership: OwnershipMap | null
  narrative: Snippet[]
  meta: {
    asOf: string | null
    coldStart: boolean
    contextAvailable: { personInDb: boolean; initiativeMemory: boolean; priorThread: boolean }
    narrativeLeakRisk: boolean   // true only if a kept snippet's age could not be resolved precisely
  }
}

// ── T1: identity & relations (exact) ──────────────────────────────────────────

/**
 * Heuristic email→person match for the (many) people rows with no stored email.
 * Payoneer local-parts are first-name + a short prefix of the last name (eladsc→Elad Schnarch,
 * yaronza→Yaron Zakai-Or, idoset→Ido Seter). Live mode makes this moot — the sweep gets the
 * real email + display name from Graph and should backfill people.email.
 */
function localPartMatches(localpart: string, fullName: string): boolean {
  const lp = localpart.toLowerCase().replace(/[^a-z]/g, '')
  const parts = (fullName || '').toLowerCase().replace(/[^a-z\s-]/g, '').split(/[\s-]+/).filter(Boolean)
  if (!parts.length || !lp) return false
  const first = parts[0]
  if (!lp.startsWith(first)) return false
  const rem = lp.slice(first.length)
  if (rem.length === 0) return parts.length === 1
  if (rem.length > 4) return false
  // rem must prefix any remaining name token (yaronza→za[kai]) or their concatenation.
  const rest = parts.slice(1)
  return rest.some((tok) => tok.startsWith(rem)) || rest.join('').startsWith(rem)
}

export async function resolveParticipants(emails: string[], asOf?: string): Promise<PersonCard[]> {
  const sb = await db()
  const uniq = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()))).filter(Boolean)
  if (!uniq.length) return []

  // people by email (exact, lowercased)
  const { data: peopleRows } = await (sb as any)
    .from('people')
    .select('slug, email, reports_to_id, id, updated_at')
  const byEmail = new Map<string, any>()
  const bySlug = new Map<string, any>()
  for (const r of (peopleRows ?? [])) {
    if (r.email) byEmail.set(String(r.email).toLowerCase(), r)
    if (r.slug) bySlug.set(r.slug, r)
  }
  // org tree (resolved team + manager + structural fields) by slug
  const { data: tree } = await (sb as any)
    .from('v_org_tree')
    .select('slug, name, role, team_name, reports_to_slug, working_style')
  const treeBySlug = new Map<string, any>()
  for (const t of (tree ?? [])) treeBySlug.set(t.slug, t)

  const yonatan = bySlug.get(YONATAN_SLUG)
  const yonatanReportsToSlug = treeBySlug.get(YONATAN_SLUG)?.reports_to_slug
  const directs = new Set<string>()
  for (const t of (tree ?? [])) if (t.reports_to_slug === YONATAN_SLUG) directs.add(t.slug)

  const relate = (slug?: string, t?: any): Relation => {
    if (!slug) return 'unknown'
    if (slug === yonatanReportsToSlug) return 'manager'
    if (t?.reports_to_slug === YONATAN_SLUG) return 'direct-report'
    if (t?.reports_to_slug && directs.has(t.reports_to_slug)) return 'skip-level'
    return 'peer'
  }

  return uniq.map((email): PersonCard => {
    let p = byEmail.get(email)
    if (!p) {
      // Heuristic fallback against org-tree names (people.email is sparse — 10/62).
      const localpart = email.split('@')[0]
      const hits = (tree ?? []).filter((t: any) => localPartMatches(localpart, t.name))
      if (hits.length === 1) p = bySlug.get(hits[0].slug) ?? { slug: hits[0].slug }
    }
    if (!p) return { email, inDb: false, relation: 'external' }
    const t = treeBySlug.get(p.slug)
    const styleAllowed = !asOf || (p.updated_at && new Date(p.updated_at) <= new Date(asOf))
    return {
      email, inDb: true, slug: p.slug, name: t?.name, role: t?.role, team: t?.team_name,
      relation: relate(p.slug, t),
      // never expose growth_areas / current_focus (sensitive + volatile). styleNote gated by asOf.
      styleNote: styleAllowed && t?.working_style ? String(t.working_style).slice(0, 240) : undefined,
    }
  })
}

// ── T2: domain & ownership map (curated, load-whole, as-of-invariant) ──────────

export async function loadOwnership(_asOf?: string): Promise<OwnershipMap | null> {
  const sb = await db()
  const { data } = await (sb as any)
    .from('context_store').select('content, updated_at').eq('key', 'comms_org_ownership').single()
  if (!data?.content) return null
  const c = data.content
  // Stable structure → NOT age-filtered even under asOf (we have no versioned history and the
  // org map held at past as-of points). updatedAt is surfaced for transparency only.
  return {
    domains: c.domains ?? {}, clmScope: c.clmScope ?? '',
    reportingChain: c.reportingChain ?? [], redLines: c.redLines ?? [],
    referenceFacts: c.referenceFacts ?? undefined,
    updatedAt: data.updated_at,
  }
}

// ── Spine: the learned rulebook (scope-matched) ────────────────────────────────

export async function matchRules(
  scope: { personSlugs?: string[]; topic?: string; channel?: string },
  opts?: { includeWatch?: boolean; asOf?: string },
): Promise<RuleHit[]> {
  const sb = await db()
  const statuses = opts?.includeWatch ? ['active', 'watch'] : ['active']
  let q = (sb as any).from('comms_rules')
    .select('id, type, statement, status, confidence, scope, created_at')
    .in('status', statuses)
  const { data } = await q
  const rows = (data ?? []).filter((r: any) => !opts?.asOf || new Date(r.created_at) <= new Date(opts.asOf))

  const topic = (scope.topic ?? '').toLowerCase()
  const persons = new Set((scope.personSlugs ?? []).filter(Boolean))

  const matches = (s: any): boolean => {
    const sc = s ?? {}
    if (!sc.person && !sc.topic && !sc.initiative) return true        // global rule
    if (sc.channel && scope.channel && sc.channel !== scope.channel) return false
    if (sc.person && persons.has(sc.person)) return true
    if (sc.topic && topic && (topic.includes(String(sc.topic).toLowerCase()) || String(sc.topic).toLowerCase().includes(topic))) return true
    if (sc.channel === scope.channel && !sc.person && !sc.topic && !sc.initiative) return true
    return false
  }
  const weightOf = (r: any): RuleHit['weight'] =>
    r.status === 'active' && r.confidence >= 0.67 ? 'assert'
    : r.status === 'active' && r.confidence >= 0.34 ? 'whisper' : 'track'

  return rows.filter((r: any) => matches(r.scope)).map((r: any): RuleHit => ({
    id: r.id, type: r.type, statement: r.statement, status: r.status,
    confidence: Number(r.confidence), weight: weightOf(r), scope: r.scope ?? {},
  }))
}

// ── T3: narrative (semantic, capped, source-timestamp as-of filter) ────────────

/** Resolve each result's SOURCE authored timestamp; falls back to the leak-safe embeddings.created_at. */
async function sourceTimestamps(results: { entity_type: string; entity_id: string }[]): Promise<Map<string, string>> {
  const sb = await db()
  const out = new Map<string, string>()
  const key = (t: string, id: string) => `${t}/${id}`
  const csIds = results.filter(r => r.entity_type === 'initiative_memory').map(r => r.entity_id)
  const alIds = results.filter(r => r.entity_type === 'agent_log').map(r => r.entity_id)

  if (csIds.length) {
    const { data } = await (sb as any).from('content_sections').select('id, updated_at').in('id', csIds)
    for (const r of (data ?? [])) out.set(key('initiative_memory', r.id), r.updated_at)
  }
  if (alIds.length) {
    const { data } = await (sb as any).from('agent_log').select('id, created_at').in('id', alIds)
    for (const r of (data ?? [])) out.set(key('agent_log', r.id), r.created_at)
  }
  // Fallback for everything unresolved: embeddings.created_at (>= source date ⇒ leak-safe).
  const missing = results.filter(r => !out.has(key(r.entity_type, r.entity_id)))
  for (const m of missing) {
    const { data } = await (sb as any).from('embeddings')
      .select('created_at').eq('entity_type', m.entity_type).eq('entity_id', m.entity_id).limit(1)
    if (data?.[0]?.created_at) out.set(key(m.entity_type, m.entity_id), data[0].created_at)
  }
  return out
}

export async function searchNarrative(
  query: string,
  opts?: { types?: NarrativeType[]; topK?: number; asOf?: string },
): Promise<{ snippets: Snippet[]; leakRisk: boolean }> {
  const { searchByType } = await import('../lib/embeddings.js')
  const types = opts?.types ?? ['initiative_memory', 'agent_log', 'ppp', 'research', 'initiative']
  const topK = opts?.topK ?? 3
  // comms_predictions / comms_rules are NEVER searched (privacy). Lower threshold + higher limit
  // because subject-line queries are short; we trim to topK after the as-of filter.
  // T3 is augmentation, not the spine — if embeddings are unreachable (network/OpenAI), degrade to
  // no-narrative rather than failing the whole bundle. T1/T2/rules (Supabase) still populate.
  let raw: Awaited<ReturnType<typeof searchByType>>
  try {
    raw = await searchByType(query, types as string[], { threshold: 0.4, limit: 40 })
  } catch (e) {
    console.error(`[retrieve] T3 narrative search failed (${(e as Error).message}); continuing without narrative`)
    return { snippets: [], leakRisk: false }
  }
  if (!raw.length) return { snippets: [], leakRisk: false }

  const tsMap = await sourceTimestamps(raw)
  const key = (t: string, id: string) => `${t}/${id}`
  let leakRisk = false
  const kept: Snippet[] = []
  for (const r of raw) {
    const at = tsMap.get(key(r.entity_type, r.entity_id)) ?? null
    if (opts?.asOf) {
      if (!at) continue                                   // unresolved age + backtest ⇒ drop (no leak)
      if (new Date(at) > new Date(opts.asOf)) continue    // post-as_of ⇒ drop
    }
    kept.push({
      type: r.entity_type, text: String(r.chunk_text ?? '').slice(0, 320),
      provenance: `${r.entity_type}:${r.entity_id}${at ? ' @' + String(at).slice(0, 10) : ''}`,
      score: Number(r.similarity), sourceAt: at,
    })
    if (kept.length >= topK) break
  }
  return { snippets: kept, leakRisk }
}

// ── Orchestrator ───────────────────────────────────────────────────────────────

export async function assembleContext(thread: ThreadInput): Promise<ContextBundle> {
  const asOf = thread.asOf ?? null
  const participants = await resolveParticipants([...(thread.participants ?? []), ...(thread.mentions ?? [])], asOf ?? undefined)
  const ownership = await loadOwnership(asOf ?? undefined)

  const personSlugs = participants.filter(p => p.inDb && p.slug).map(p => p.slug!)
  const rules = await matchRules(
    { personSlugs, topic: thread.subject, channel: 'email' },
    { includeWatch: false, asOf: asOf ?? undefined },
  )
  const { snippets, leakRisk } = await searchNarrative(
    `${thread.subject}`, { topK: 3, asOf: asOf ?? undefined },
  )

  const personInDb = participants.some(p => p.inDb)
  const initiativeMemory = snippets.some(s => s.type === 'initiative_memory')
  const priorThread = /\bFrom:|wrote:|^>|-----Original/m.test(thread.bodyToDate ?? '')

  return {
    thread: thread.bodyToDate,
    rules, participants, ownership, narrative: snippets,
    meta: {
      asOf, coldStart: !personInDb && !priorThread,
      contextAvailable: { personInDb, initiativeMemory, priorThread },
      narrativeLeakRisk: leakRisk,
    },
  }
}
