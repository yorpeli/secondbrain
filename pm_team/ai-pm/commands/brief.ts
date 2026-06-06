/**
 * AI PM — Brief command
 *
 * Applies the AI PM's accumulated learnings to ONE initiative: pulls the
 * initiative's open questions + blockers from its memory doc, then surfaces the
 * most relevant stored research and cross-agent findings (semantic search).
 * The connective synthesis ("which finding answers which question") is for
 * Claude to write on top of this structured gather.
 */

import type { BriefResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

function sectionBullets(content: string, header: string): string[] {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === header.toLowerCase()) {
      let j = i + 1
      while (j < lines.length && !/^##\s/.test(lines[j])) j++
      return lines.slice(i + 1, j).filter(l => /^\s*-\s+/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim())
    }
  }
  return []
}
const firstStatus = (c: string) => {
  const lines = c.split('\n')
  const i = lines.findIndex(l => l.trim().toLowerCase() === '## status')
  if (i < 0) return null
  for (let j = i + 1; j < lines.length && !/^##\s/.test(lines[j]); j++) if (lines[j].trim()) return lines[j].trim()
  return null
}

export async function run(options: { slug: string }): Promise<BriefResult> {
  const supabase = await getSupabase()
  const slug = options.slug

  const { data: it } = await supabase
    .from('initiatives' as any).select('id, slug, title').eq('slug', slug).limit(1).single()
  if (!it) {
    return { slug, title: slug, status_line: null, open_questions: [], blockers: [], relevant_research: [], semantic_context: [], summary: `Initiative '${slug}' not found.` }
  }
  const initiative = it as unknown as { id: string; slug: string; title: string }

  const { data: mem } = await supabase
    .from('content_sections' as any).select('content')
    .eq('entity_id', initiative.id).eq('section_type', 'memory').limit(1).single()
  const content = (mem as any)?.content as string | undefined ?? ''

  const openQ = sectionBullets(content, '## Open Questions')
  const blockers = sectionBullets(content, '## Blockers & Risks')
  const statusLine = content ? firstStatus(content) : null

  // Semantic search: pull relevant stored research + cross-agent findings.
  const query = `${initiative.title} ${openQ.slice(0, 3).join(' ')}`.trim()
  let relevantResearch: BriefResult['relevant_research'] = []
  let semanticContext: BriefResult['semantic_context'] = []
  try {
    const { searchByType } = await import('../../../lib/embeddings.js')
    const hits = await searchByType(query, ['research', 'agent_log', 'playbook'], { threshold: 0.7, limit: 8 })
    semanticContext = hits.map(h => ({ entity_type: h.entity_type, chunk_text: h.chunk_text, similarity: h.similarity }))
  } catch { /* semantic search is best-effort */ }

  // Current research authored for the portfolio, tagged to this initiative.
  try {
    const { data: research } = await supabase
      .from('research_results' as any)
      .select('topic, summary, freshness_date, tags, status')
      .eq('status', 'current').contains('tags', [slug])
      .order('freshness_date', { ascending: false }).limit(8)
    relevantResearch = ((research || []) as any[]).map(r => ({ topic: r.topic, summary: r.summary, freshness_date: r.freshness_date }))
  } catch { /* best-effort */ }

  const parts: string[] = []
  parts.push(`Brief — ${initiative.title} (${slug})`)
  if (statusLine) parts.push(`Status: ${statusLine.replace(/\*\*/g, '')}`)
  parts.push('')
  parts.push(`Open questions (${openQ.length}):`)
  for (const q of openQ.slice(0, 8)) parts.push(`  - ${q}`)
  parts.push('')
  parts.push(`Open blockers (${blockers.length}):`)
  for (const b of blockers.slice(0, 8)) parts.push(`  - ${b}`)
  parts.push('')
  parts.push(`Tagged research (${relevantResearch.length}):`)
  for (const r of relevantResearch) parts.push(`  - [${r.freshness_date}] ${r.topic}: ${r.summary.slice(0, 140)}`)
  parts.push('')
  parts.push(`Semantic context (${semanticContext.length} hits across research/agent_log/playbook):`)
  for (const s of semanticContext.slice(0, 6)) parts.push(`  - [${s.entity_type} ${s.similarity.toFixed(2)}] ${s.chunk_text.slice(0, 140)}`)

  return {
    slug, title: initiative.title, status_line: statusLine,
    open_questions: openQ, blockers, relevant_research: relevantResearch, semantic_context: semanticContext,
    summary: parts.join('\n'),
  }
}
