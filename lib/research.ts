/**
 * Shared Research Utilities
 *
 * Storage and versioning for research_results. Used by any research agent
 * (competitive analysis, domain research, market, regulatory).
 *
 * Uses lazy Supabase import so scripts that don't need DB access won't fail.
 */

import { ResearchStatus } from './database.types.js'

// Lazy-loaded Supabase
async function getSupabase() {
  const { getSupabase: gs } = await import('./supabase.js')
  return gs()
}

// ─── Types ───────────────────────────────────────────────────

export interface ResearchResult {
  id: string
  topic: string
  research_type: string
  agent_slug: string
  summary: string
  content: string
  source_urls: string[] | null
  status: string
  freshness_date: string
  superseded_by: string | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
}

export interface StoreResearchInput {
  topic: string
  researchType: 'domain' | 'competitive' | 'market' | 'regulatory'
  agentSlug: string
  summary: string
  content: string
  sourceUrls?: string[]
  tags?: string[]
  freshnessDate?: string // Defaults to today
}

// ─── Functions ───────────────────────────────────────────────

/**
 * Store new research. Auto-supersedes any existing 'current' research
 * on the same topic + researchType (sets old -> superseded, links superseded_by).
 *
 * Returns the new research ID, or null on failure.
 */
export async function storeResearch(input: StoreResearchInput): Promise<string | null> {
  const supabase = await getSupabase()
  const today = new Date().toISOString().split('T')[0]

  // 1. Insert the new research entry
  const { data: newRow, error: insertError } = await supabase
    .from('research_results' as any)
    .insert({
      topic: input.topic,
      research_type: input.researchType,
      agent_slug: input.agentSlug,
      summary: input.summary,
      content: input.content,
      source_urls: input.sourceUrls ?? [],
      tags: input.tags ?? [],
      freshness_date: input.freshnessDate ?? today,
      status: ResearchStatus.CURRENT,
    } as any)
    .select('id')
    .single()

  if (insertError) {
    console.error('[research] Failed to store research:', insertError.message)
    return null
  }

  const newId = (newRow as any).id as string

  // 2. Supersede any existing 'current' entries with the same topic + research_type
  const { data: existing } = await supabase
    .from('research_results' as any)
    .select('id')
    .eq('topic', input.topic)
    .eq('research_type', input.researchType)
    .eq('status', ResearchStatus.CURRENT)
    .neq('id', newId)

  if (existing && (existing as any[]).length > 0) {
    const oldIds = (existing as any[]).map((r: any) => r.id)

    const { error: updateError } = await supabase
      .from('research_results' as any)
      .update({
        status: ResearchStatus.SUPERSEDED,
        superseded_by: newId,
        updated_at: new Date().toISOString(),
      } as any)
      .in('id', oldIds)

    if (updateError) {
      console.error('[research] Failed to supersede old research:', updateError.message)
      // Non-fatal — the new entry was still created
    } else {
      console.log(`[research] Superseded ${oldIds.length} previous entries`)
    }
  }

  return newId
}

/**
 * Check for existing research on a topic (returns current entries).
 */
export async function getExistingResearch(
  topic: string,
  researchType?: string
): Promise<ResearchResult[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('research_results' as any)
    .select('*')
    .eq('topic', topic)
    .eq('status', ResearchStatus.CURRENT)
    .order('created_at', { ascending: false })

  if (researchType) {
    query = query.eq('research_type', researchType)
  }

  const { data, error } = await query

  if (error) {
    console.error('[research] Failed to fetch research:', error.message)
    return []
  }

  return (data || []) as unknown as ResearchResult[]
}

/**
 * Mark research as stale (e.g., when freshness_date is too old).
 */
export async function markStale(researchId: string): Promise<boolean> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('research_results' as any)
    .update({
      status: ResearchStatus.STALE,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', researchId)

  if (error) {
    console.error('[research] Failed to mark research as stale:', error.message)
    return false
  }

  return true
}
