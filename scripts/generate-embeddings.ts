#!/usr/bin/env npx tsx
/**
 * Batch Embedding Generator
 *
 * Usage: npx tsx scripts/generate-embeddings.ts <agent-log|playbooks|ppp|person|initiative|research|all> [--force]
 *
 * By default, skips entities that already have embeddings (incremental).
 * Pass --force to re-embed everything from scratch.
 *
 * Embeds various entity types into the embeddings table for semantic search
 * via search_knowledge() / searchByType().
 */

import 'dotenv/config'
import { readFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { batchEmbed, deleteEmbeddings, deterministicUuid, type EmbeddingInput } from '../lib/embeddings.js'

/** Parsed from CLI args */
const FORCE = process.argv.includes('--force')

// ─── Helpers ────────────────────────────────────────────────

/**
 * Split long text into overlapping chunks for embedding.
 * Matches the edge function's chunking logic.
 */
function chunkLongText(text: string, maxLen = 2000, overlap = 200): string[] {
  if (text.length <= maxLen) return [text]

  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLen))
    start += maxLen - overlap
  }
  return chunks
}

// ─── Agent Log Embedding ─────────────────────────────────────

async function embedAgentLog(): Promise<void> {
  console.log('\n--- Embedding agent_log entries ---')

  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  // Fetch all non-error entries
  const { data: entries, error } = await supabase
    .from('agent_log')
    .select('id, agent_slug, category, summary, details, related_entity_type, tags')
    .neq('category', 'error')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch agent_log:', error.message)
    return
  }

  if (!entries || entries.length === 0) {
    console.log('No agent_log entries to embed.')
    return
  }

  console.log(`Found ${entries.length} agent_log entries to embed`)

  const inputs: EmbeddingInput[] = entries.map(entry => {
    const tags = (entry.tags as string[] | null)?.join(', ') || ''
    const prefix = `[${entry.agent_slug} | ${entry.category}${tags ? ` | ${tags}` : ''}]`

    // Privacy guard: if related to a person, only embed summary
    const isPersonRelated = entry.related_entity_type === 'person'
    let chunkText: string

    if (isPersonRelated) {
      chunkText = `${prefix} ${entry.summary}`
    } else {
      const detailsStr = entry.details ? `\n${JSON.stringify(entry.details)}` : ''
      chunkText = `${prefix} ${entry.summary}${detailsStr}`
    }

    return {
      entityType: 'agent_log',
      entityId: entry.id,
      chunkText,
      chunkIndex: 0,
    }
  })

  const result = await batchEmbed(inputs, { force: FORCE })
  console.log(`Agent log embedding complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`)
}

// ─── Playbook Embedding ──────────────────────────────────────

interface PlaybookChunk {
  filePath: string
  heading: string
  content: string
  index: number
}

function chunkMarkdownByHeadings(filePath: string, content: string): PlaybookChunk[] {
  const lines = content.split('\n')
  const chunks: PlaybookChunk[] = []
  let currentHeading = basename(filePath, '.md')
  let currentContent: string[] = []
  let chunkIndex = 0

  for (const line of lines) {
    // Split on ## headings (H2)
    if (line.startsWith('## ')) {
      // Save previous chunk if it has content
      if (currentContent.length > 0) {
        const text = currentContent.join('\n').trim()
        if (text.length > 50) {  // Skip tiny chunks
          chunks.push({
            filePath,
            heading: currentHeading,
            content: text,
            index: chunkIndex++,
          })
        }
      }
      currentHeading = line.replace(/^## /, '')
      currentContent = [line]
    } else {
      currentContent.push(line)
    }
  }

  // Don't forget the last chunk
  if (currentContent.length > 0) {
    const text = currentContent.join('\n').trim()
    if (text.length > 50) {
      chunks.push({
        filePath,
        heading: currentHeading,
        content: text,
        index: chunkIndex,
      })
    }
  }

  return chunks
}

async function embedPlaybooks(): Promise<void> {
  console.log('\n--- Embedding playbook sections ---')

  const playbookFiles = [
    'pm_team/playbook.md',
  ]

  // Add all files from pm_team/playbooks/
  const playbooksDir = join(process.cwd(), 'pm_team/playbooks')
  if (existsSync(playbooksDir)) {
    const { readdirSync } = await import('fs')
    const files = readdirSync(playbooksDir).filter(f => f.endsWith('.md'))
    for (const f of files) {
      playbookFiles.push(`pm_team/playbooks/${f}`)
    }
  }

  console.log(`Found ${playbookFiles.length} playbook files: ${playbookFiles.join(', ')}`)

  const allInputs: EmbeddingInput[] = []

  // Check which playbook entity IDs already have embeddings
  const { getExistingEmbeddingIds } = await import('../lib/embeddings.js')
  const existingPlaybookIds = FORCE ? new Set<string>() : await getExistingEmbeddingIds('playbook')

  for (const relPath of playbookFiles) {
    const absPath = join(process.cwd(), relPath)
    if (!existsSync(absPath)) {
      console.warn(`Skipping missing file: ${relPath}`)
      continue
    }

    const content = readFileSync(absPath, 'utf-8')
    const entityId = deterministicUuid(relPath)

    // Skip if already embedded (unless forcing)
    if (!FORCE && existingPlaybookIds.has(entityId)) {
      console.log(`  ${relPath}: already embedded, skipping (use --force to re-embed)`)
      continue
    }

    // Clear existing embeddings for this playbook file before re-embedding
    await deleteEmbeddings('playbook', entityId)

    const chunks = chunkMarkdownByHeadings(relPath, content)
    console.log(`  ${relPath}: ${chunks.length} chunks (entity_id: ${entityId})`)

    for (const chunk of chunks) {
      const filename = basename(chunk.filePath, '.md')
      allInputs.push({
        entityType: 'playbook',
        entityId,
        chunkText: `[Playbook: ${filename}] ## ${chunk.heading}\n${chunk.content}`,
        chunkIndex: chunk.index,
      })
    }
  }

  if (allInputs.length === 0) {
    console.log('No playbook chunks to embed (all already embedded).')
    return
  }

  // Force=true here because we already handled skip logic above per-file
  const result = await batchEmbed(allInputs, { force: true })
  console.log(`Playbook embedding complete: ${result.success} succeeded, ${result.failed} failed`)
}

// ─── PPP Embedding ──────────────────────────────────────────

async function embedPpp(): Promise<void> {
  console.log('\n--- Embedding PPP sections ---')

  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  const { data: sections, error } = await supabase
    .from('v_ppp_swimlanes' as any)
    .select('section_id, lead_name, workstream_name, week_date, status, quality_score, summary, tags')
    .order('week_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch PPP swimlanes:', error.message)
    return
  }

  if (!sections || sections.length === 0) {
    console.log('No PPP sections to embed.')
    return
  }

  console.log(`Found ${sections.length} PPP sections to embed`)

  const inputs: EmbeddingInput[] = (sections as any[]).map(s => {
    const tags = (s.tags as string[] | null)?.join(', ') || ''
    const chunkText = `[PPP | ${s.lead_name ?? 'unknown'} | ${s.workstream_name} | ${s.week_date}] Status: ${s.status ?? 'unknown'} | Score: ${s.quality_score ?? 'N/A'}\n${s.summary ?? ''}\nTags: ${tags}`

    return {
      entityType: 'ppp',
      entityId: s.section_id,
      chunkText,
      chunkIndex: 0,
    }
  })

  const result = await batchEmbed(inputs, { force: FORCE })
  console.log(`PPP embedding complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`)
}

// ─── Person Embedding ───────────────────────────────────────

async function embedPerson(): Promise<void> {
  console.log('\n--- Embedding people ---')

  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  const { data: people, error } = await supabase
    .from('people')
    .select('id, name, role, type, working_style, strengths, growth_areas, relationship_notes, current_focus')

  if (error) {
    console.error('Failed to fetch people:', error.message)
    return
  }

  if (!people || people.length === 0) {
    console.log('No people to embed.')
    return
  }

  console.log(`Found ${people.length} people to embed`)

  const inputs: EmbeddingInput[] = []

  for (const p of people as any[]) {
    const parts: string[] = [`${p.name} — ${p.role ?? 'no role'} (${p.type ?? 'unknown'})`]
    if (p.working_style) parts.push(`Working style: ${p.working_style}`)
    if (p.strengths?.length) parts.push(`Strengths: ${p.strengths.join(', ')}`)
    if (p.growth_areas?.length) parts.push(`Growth areas: ${p.growth_areas.join(', ')}`)
    if (p.current_focus) parts.push(`Current focus: ${p.current_focus}`)
    if (p.relationship_notes) parts.push(`Relationship notes: ${p.relationship_notes}`)

    const profileText = parts.join('\n')
    if (profileText.length < 50) continue

    inputs.push({
      entityType: 'person',
      entityId: p.id,
      chunkText: profileText,
      chunkIndex: 0,
    })
  }

  if (inputs.length === 0) {
    console.log('No person profiles long enough to embed.')
    return
  }

  const result = await batchEmbed(inputs, { force: FORCE })
  console.log(`Person embedding complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`)
}

// ─── Initiative Embedding ───────────────────────────────────

async function embedInitiative(): Promise<void> {
  console.log('\n--- Embedding initiatives ---')

  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  const { data: initiatives, error } = await supabase
    .from('initiatives')
    .select('id, title, objective, why_it_matters')

  if (error) {
    console.error('Failed to fetch initiatives:', error.message)
    return
  }

  if (!initiatives || initiatives.length === 0) {
    console.log('No initiatives to embed.')
    return
  }

  console.log(`Found ${initiatives.length} initiatives to embed`)

  const inputs: EmbeddingInput[] = (initiatives as any[]).map(i => {
    const parts: string[] = [i.title]
    if (i.objective) parts.push(`Objective: ${i.objective}`)
    if (i.why_it_matters) parts.push(`Why it matters: ${i.why_it_matters}`)

    return {
      entityType: 'initiative',
      entityId: i.id,
      chunkText: parts.join('\n'),
      chunkIndex: 0,
    }
  })

  const result = await batchEmbed(inputs, { force: FORCE })
  console.log(`Initiative embedding complete: ${result.success} succeeded, ${result.failed} failed, ${result.skipped} skipped`)
}

// ─── Research Embedding ─────────────────────────────────────

async function embedResearch(): Promise<void> {
  console.log('\n--- Embedding research results ---')

  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()

  const { data: research, error } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, tags')
    .eq('status', 'current')

  if (error) {
    console.error('Failed to fetch research:', error.message)
    return
  }

  if (!research || research.length === 0) {
    console.log('No research results to embed.')
    return
  }

  console.log(`Found ${research.length} research results to embed`)

  // Check which research IDs already have embeddings
  const { getExistingEmbeddingIds } = await import('../lib/embeddings.js')
  const existingResearchIds = FORCE ? new Set<string>() : await getExistingEmbeddingIds('research')

  const allInputs: EmbeddingInput[] = []
  let researchSkipped = 0

  for (const r of research as any[]) {
    // Skip if already embedded (unless forcing)
    if (!FORCE && existingResearchIds.has(r.id)) {
      researchSkipped++
      continue
    }

    // Pre-delete all existing chunks for this research entry before re-embedding
    await deleteEmbeddings('research', r.id)

    const tags = (r.tags as string[] | null)?.join(', ') || ''
    const fullText = `[Research: ${r.topic} | ${r.research_type} | ${r.agent_slug}]\n${r.summary}\nTags: ${tags}`

    const chunks = chunkLongText(fullText, 2000, 200)
    for (let i = 0; i < chunks.length; i++) {
      allInputs.push({
        entityType: 'research',
        entityId: r.id,
        chunkText: chunks[i],
        chunkIndex: i,
      })
    }
  }

  if (researchSkipped > 0) {
    console.log(`  Skipped ${researchSkipped} already-embedded research entries`)
  }

  if (allInputs.length === 0) {
    console.log('No research chunks to embed (all already embedded).')
    return
  }

  // Force=true here because we already handled skip logic above per-entity
  const result = await batchEmbed(allInputs, { force: true })
  console.log(`Research embedding complete: ${result.success} succeeded, ${result.failed} failed`)
}

// ─── Main ────────────────────────────────────────────────────

const VALID_MODES = ['agent-log', 'playbooks', 'ppp', 'person', 'initiative', 'research', 'all']

async function main() {
  const mode = process.argv[2]

  if (!mode || !VALID_MODES.includes(mode)) {
    console.error(`Usage: npx tsx scripts/generate-embeddings.ts <${VALID_MODES.join('|')}> [--force]`)
    process.exit(1)
  }

  console.log(`Generating embeddings (mode: ${mode}${FORCE ? ', force=true' : ', incremental'})`)

  if (mode === 'agent-log' || mode === 'all') {
    await embedAgentLog()
  }

  if (mode === 'playbooks' || mode === 'all') {
    await embedPlaybooks()
  }

  if (mode === 'ppp' || mode === 'all') {
    await embedPpp()
  }

  if (mode === 'person' || mode === 'all') {
    await embedPerson()
  }

  if (mode === 'initiative' || mode === 'all') {
    await embedInitiative()
  }

  if (mode === 'research' || mode === 'all') {
    await embedResearch()
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
