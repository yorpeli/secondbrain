/**
 * AI PM — Scan command (outward / learning loop)
 *
 * Two-phase, Claude-in-the-loop (same shape as initiative-tracker):
 *   plan()  → builds the research agenda: DEMAND items (the portfolio's open
 *             questions, parsed from each initiative's memory doc) + SWEEP items
 *             (the standing watchlist), plus stale-research flags and sources.
 *             Claude executes the agenda with web research (deep-research skill).
 *   store() → persists Claude-authored findings via lib/research.ts
 *             (auto-versions + embeds), tagged with the initiatives they inform.
 *
 * Both loops run at full weight (demand + sweep) by design.
 */

import { AGENT_SLUG, AI_PORTFOLIO_SLUGS, ON_HOLD_SLUGS, isOnHold, WATCHLIST_TOPICS, WATCHLIST_SOURCES, RESEARCH_STALE_DAYS } from '../lib/config.js'
import type { ScanPlanResult, ResearchAgendaItem, ScanStorePayload, ScanStoreResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

function openQuestions(content: string): string[] {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === '## open questions') {
      let j = i + 1
      while (j < lines.length && !/^##\s/.test(lines[j])) j++
      return lines.slice(i + 1, j).filter(l => /^\s*-\s+/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim())
    }
  }
  return []
}

const daysSince = (iso: string | null): number | null =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null

// ─── Plan ────────────────────────────────────────────────────

export async function plan(): Promise<ScanPlanResult> {
  const supabase = await getSupabase()
  const agenda: ResearchAgendaItem[] = []

  // DEMAND: open questions from each AI initiative's memory doc.
  const { data: inits } = await supabase
    .from('initiatives' as any)
    .select('id, slug, title')
    .in('slug', [...AI_PORTFOLIO_SLUGS])

  for (const it of (inits || []) as unknown as Array<{ id: string; slug: string; title: string }>) {
    if (isOnHold(it.slug)) continue // parked — no demand research
    const { data: mem } = await supabase
      .from('content_sections' as any)
      .select('content').eq('entity_id', it.id).eq('section_type', 'memory').limit(1).single()
    const content = (mem as any)?.content as string | undefined
    if (!content) continue
    for (const q of openQuestions(content).slice(0, 5)) {
      agenda.push({
        kind: 'demand',
        source: it.slug,
        topic: q,
        rationale: `Open question on ${it.slug} — research the current best answer / industry approach.`,
      })
    }
  }

  // SWEEP: the standing watchlist.
  for (const w of WATCHLIST_TOPICS) {
    agenda.push({ kind: 'sweep', source: w.key, topic: w.topic, rationale: w.why })
  }

  // Stale-research flags (this agent's current research past the freshness window).
  const { data: research } = await supabase
    .from('research_results' as any)
    .select('topic, freshness_date, status')
    .eq('agent_slug', AGENT_SLUG).eq('status', 'current')
  const stale = ((research || []) as unknown as Array<{ topic: string; freshness_date: string }>)
    .filter(r => (daysSince(r.freshness_date) ?? 0) > RESEARCH_STALE_DAYS)
    .map(r => ({ topic: r.topic, freshness_date: r.freshness_date }))

  return {
    generated_at: new Date().toISOString(),
    agenda,
    watchlist_sources: WATCHLIST_SOURCES,
    stale_research: stale,
    on_hold: [...ON_HOLD_SLUGS],
    note: 'Execute the agenda with web research (deep-research skill / WebSearch+WebFetch). Then author a payload of findings and run `scan --store --payload=<path>`. Demand items answer a live portfolio question; sweep items keep the watchlist current. Skip what is already well-covered and fresh. Parked initiatives (on_hold) are excluded from the demand agenda.',
  }
}

// ─── Store ───────────────────────────────────────────────────

export async function store(payload: ScanStorePayload): Promise<ScanStoreResult> {
  const { storeResearch } = await import('../../../lib/research.js')
  const results: ScanStoreResult['results'] = []

  for (const e of payload.entries) {
    if (!e.topic || !e.summary || !e.content) {
      results.push({ topic: e.topic ?? '(missing)', outcome: 'error', detail: 'topic, summary, content are required' })
      continue
    }
    const tags = [...new Set([...(e.tags ?? []), ...(e.applies_to ?? []), 'ai-pm'])]
    const id = await storeResearch({
      topic: e.topic,
      researchType: e.research_type ?? 'domain',
      agentSlug: AGENT_SLUG,
      summary: e.summary,
      content: e.content,
      sourceUrls: e.source_urls,
      tags,
    })
    results.push(id
      ? { topic: e.topic, outcome: 'stored', detail: `id=${id}${e.applies_to?.length ? `; applies_to=${e.applies_to.join(',')}` : ''}` }
      : { topic: e.topic, outcome: 'error', detail: 'storeResearch returned null' })
  }

  return {
    stored: results.filter(r => r.outcome === 'stored').length,
    errored: results.filter(r => r.outcome === 'error').length,
    results,
  }
}
