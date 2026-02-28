/**
 * PPP Write Command
 *
 * Validates a PPP JSON payload, resolves lead slugs to UUIDs,
 * and writes to ppp_reports + ppp_sections via the Supabase JS client.
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'
import type { PppPayload, WriteResult } from '../lib/types.js'
import { VALID_STATUSES } from '../lib/config.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ─── Validation ──────────────────────────────────────────────

function validatePayload(payload: PppPayload): string[] {
  const errors: string[] = []

  if (!payload.week_date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.week_date)) {
    errors.push('week_date must be YYYY-MM-DD format')
  }

  if (!payload.overall_summary || payload.overall_summary.length < 20) {
    errors.push('overall_summary is required (min 20 chars)')
  }

  if (!payload.sections || payload.sections.length === 0) {
    errors.push('sections array is required and cannot be empty')
  }

  for (const [i, section] of (payload.sections || []).entries()) {
    const prefix = `sections[${i}] (${section.workstream_name || 'unnamed'})`

    if (!section.workstream_name) {
      errors.push(`${prefix}: workstream_name is required`)
    }
    if (!section.lead_slug) {
      errors.push(`${prefix}: lead_slug is required`)
    }
    if (!VALID_STATUSES.includes(section.status as any)) {
      errors.push(`${prefix}: status must be one of ${VALID_STATUSES.join(', ')}`)
    }
    if (section.quality_score < 1 || section.quality_score > 5) {
      errors.push(`${prefix}: quality_score must be 1-5`)
    }
    if (!section.summary) {
      errors.push(`${prefix}: summary is required`)
    }
    if (!section.raw_text) {
      errors.push(`${prefix}: raw_text is required`)
    }
  }

  return errors
}

// ─── Slug Resolution ─────────────────────────────────────────

interface PersonLookup {
  id: string
  slug: string
  name: string
}

async function buildPeopleIndex(): Promise<Map<string, PersonLookup>> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('people')
    .select('id, slug, name')
    .eq('status', 'active')

  if (error) throw new Error(`Failed to load people: ${error.message}`)

  const index = new Map<string, PersonLookup>()
  for (const p of (data || []) as unknown as PersonLookup[]) {
    index.set(p.slug, p)
    index.set(p.name.split(' ')[0].toLowerCase(), p)
    index.set(p.name.toLowerCase(), p)
  }
  return index
}

function resolveSlug(input: string, index: Map<string, PersonLookup>): PersonLookup | null {
  // Try exact slug match
  const bySlug = index.get(input)
  if (bySlug) return bySlug

  // Try lowercase
  const byLower = index.get(input.toLowerCase())
  if (byLower) return byLower

  return null
}

// ─── Write ───────────────────────────────────────────────────

export async function run(options: {
  path: string
  replaceExisting?: boolean
}): Promise<WriteResult> {
  const errors: string[] = []

  // 1. Read and parse payload
  const fullPath = resolve(options.path)
  let payload: PppPayload
  try {
    const raw = await readFile(fullPath, 'utf-8')
    payload = JSON.parse(raw)
  } catch (err) {
    return {
      success: false,
      report_id: null,
      sections_written: 0,
      errors: [`Failed to read/parse ${fullPath}: ${err instanceof Error ? err.message : err}`],
      backup_path: null,
    }
  }

  // Allow CLI flag to override payload's replace_existing
  if (options.replaceExisting !== undefined) {
    payload.replace_existing = options.replaceExisting
  }

  // 2. Validate
  const validationErrors = validatePayload(payload)
  if (validationErrors.length > 0) {
    return {
      success: false,
      report_id: null,
      sections_written: 0,
      errors: validationErrors,
      backup_path: null,
    }
  }

  const supabase = await getSupabase()
  const peopleIndex = await buildPeopleIndex()

  // 3. Check if report already exists
  const { data: existing } = await supabase
    .from('ppp_reports')
    .select('id')
    .eq('week_date', payload.week_date)
    .single()

  if (existing && !payload.replace_existing) {
    return {
      success: false,
      report_id: null,
      sections_written: 0,
      errors: [`Report for ${payload.week_date} already exists. Use replace_existing: true to overwrite.`],
      backup_path: null,
    }
  }

  // 4. If replacing, delete existing report and sections
  if (existing && payload.replace_existing) {
    console.log(`Replacing existing report for ${payload.week_date}...`)
    await supabase
      .from('ppp_sections')
      .delete()
      .eq('report_id', (existing as any).id)

    await supabase
      .from('ppp_reports')
      .delete()
      .eq('id', (existing as any).id)
  }

  // 5. Insert report
  const { data: report, error: reportError } = await supabase
    .from('ppp_reports')
    .insert({
      week_date: payload.week_date,
      overall_summary: payload.overall_summary,
      private_notes: payload.private_notes,
    })
    .select('id')
    .single()

  if (reportError || !report) {
    return {
      success: false,
      report_id: null,
      sections_written: 0,
      errors: [`Failed to insert report: ${reportError?.message ?? 'no data returned'}`],
      backup_path: null,
    }
  }

  const reportId = (report as any).id as string

  // 6. Insert sections
  let sectionsWritten = 0
  for (const section of payload.sections) {
    // Resolve lead
    const lead = resolveSlug(section.lead_slug, peopleIndex)
    if (!lead) {
      errors.push(`Could not resolve lead "${section.lead_slug}" for ${section.workstream_name}`)
    }

    // Resolve contributors to slugs
    const resolvedContributors = section.contributors.map(c => {
      const person = resolveSlug(c, peopleIndex)
      return person ? person.slug : c
    })

    const { error: sectionError } = await supabase
      .from('ppp_sections')
      .insert({
        report_id: reportId,
        workstream_name: section.workstream_name,
        lead_id: lead?.id ?? null,
        status: section.status,
        quality_score: section.quality_score,
        quality_notes: section.quality_notes,
        summary: section.summary,
        raw_text: section.raw_text,
        contributors: resolvedContributors,
        tags: section.tags,
      })

    if (sectionError) {
      errors.push(`Failed to insert section "${section.workstream_name}": ${sectionError.message}`)
    } else {
      sectionsWritten++
    }
  }

  // 7. Auto-embed new PPP sections (fire-and-forget)
  if (sectionsWritten > 0) {
    try {
      const { data: newSections } = await supabase
        .from('v_ppp_swimlanes' as any)
        .select('section_id, lead_name, workstream_name, week_date, status, quality_score, summary, tags')
        .eq('week_date', payload.week_date)

      if (newSections && (newSections as any[]).length > 0) {
        const { batchEmbed } = await import('../../lib/embeddings.js')
        const inputs = (newSections as any[]).map(s => {
          const tags = (s.tags as string[] | null)?.join(', ') || ''
          return {
            entityType: 'ppp',
            entityId: s.section_id,
            chunkText: `[PPP | ${s.lead_name ?? 'unknown'} | ${s.workstream_name} | ${s.week_date}] Status: ${s.status ?? 'unknown'} | Score: ${s.quality_score ?? 'N/A'}\n${s.summary ?? ''}\nTags: ${tags}`,
            chunkIndex: 0,
          }
        })
        // Force=true since these are freshly written sections
        batchEmbed(inputs, { force: true }).then(r =>
          console.log(`[ppp-write] Embedded ${r.success} PPP sections`)
        ).catch(() => {})
      }
    } catch {
      // Embedding failure is non-fatal
    }
  }

  // 8. Save backup
  let backupPath: string | null = null
  try {
    const outputDir = resolve(dirname(fullPath), '..', 'output')
    await mkdir(outputDir, { recursive: true })
    backupPath = resolve(outputDir, `ppp-${payload.week_date}.json`)
    await writeFile(backupPath, JSON.stringify(payload, null, 2))
  } catch {
    // Non-fatal — just note it
    errors.push('Warning: could not save backup to output/')
  }

  return {
    success: errors.filter(e => !e.startsWith('Warning')).length === 0,
    report_id: reportId,
    sections_written: sectionsWritten,
    errors,
    backup_path: backupPath,
  }
}
