/**
 * Q-Plan PM — Ingest Command
 *
 * Parses quarterly plan pptx files (HL + execution decks), maps deliverables
 * to HL items, and produces a proposal for review. Does NOT write to DB until
 * explicitly approved via commitIngest().
 *
 * Two-step flow:
 *   1. `run()` — parse + propose (writes proposal to a temp file)
 *   2. `commitIngest()` — read proposal + write to DB
 */

import * as fs from 'fs'
import * as path from 'path'
import type { IngestProposal, IngestResult, ParsedHLItem, ParsedDeliverable } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── PPTX Parsing ────────────────────────────────────────────

interface TableRow {
  cells: string[]
}

async function extractTables(filePath: string): Promise<Array<{ slideIndex: number; rows: TableRow[] }>> {
  // Dynamic import python-pptx via child_process
  const { execSync } = await import('child_process')

  const script = `
import json, sys
from pptx import Presentation
prs = Presentation(sys.argv[1])
tables = []
for i, slide in enumerate(prs.slides):
    for shape in slide.shapes:
        if shape.has_table:
            rows = []
            for row in shape.table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                rows.append({"cells": cells})
            tables.append({"slideIndex": i, "rows": rows})
print(json.dumps(tables))
`

  const result = execSync(`python3 -c '${script.replace(/'/g, "'\\''")}' "${filePath}"`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })

  return JSON.parse(result)
}

// ─── HL Deck Parsing ─────────────────────────────────────────

function parseHLDeck(tables: Array<{ slideIndex: number; rows: TableRow[] }>): ParsedHLItem[] {
  const items: ParsedHLItem[] = []

  for (const table of tables) {
    const rows = table.rows
    if (rows.length < 2) continue

    // Detect header row — look for "Initiative" or "Feature" or similar
    const header = rows[0].cells.map(c => c.toLowerCase())
    const titleIdx = header.findIndex(h => h.includes('initiative') || h.includes('feature') || h.includes('item'))
    const descIdx = header.findIndex(h => h.includes('description') || h.includes('scope'))

    if (titleIdx === -1) continue

    // Impact columns — look for Q1/Q2 or "expected impact"
    const impactCols = header
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => h.includes('impact') || h.includes('q1') || h.includes('q2'))

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].cells
      const title = cells[titleIdx]?.trim()
      if (!title) continue

      items.push({
        title,
        description: descIdx >= 0 ? cells[descIdx]?.trim() ?? '' : '',
        expectedImpactCurrentQ: impactCols[0] ? cells[impactCols[0].i]?.trim() || null : null,
        expectedImpactNextQ: impactCols[1] ? cells[impactCols[1].i]?.trim() || null : null,
      })
    }
  }

  return items
}

// ─── Execution Deck Parsing ──────────────────────────────────

function parseExecutionDeck(tables: Array<{ slideIndex: number; rows: TableRow[] }>): ParsedDeliverable[] {
  const deliverables: ParsedDeliverable[] = []

  for (const table of tables) {
    const rows = table.rows
    if (rows.length < 2) continue

    const header = rows[0].cells.map(c => c.toLowerCase())
    const themeIdx = header.findIndex(h => h.includes('theme') || h.includes('category'))
    const featureIdx = header.findIndex(h => h.includes('feature') || h.includes('item') || h.includes('deliverable'))
    const timingIdx = header.findIndex(h => h.includes('timing') || h.includes('date') || h.includes('when'))
    const impactIdx = header.findIndex(h => h.includes('impact') || h.includes('dependency'))

    if (featureIdx === -1) continue

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r].cells
      const title = cells[featureIdx]?.trim()
      if (!title) continue

      deliverables.push({
        title,
        theme: themeIdx >= 0 ? cells[themeIdx]?.trim() ?? '' : '',
        timing: timingIdx >= 0 ? cells[timingIdx]?.trim() || null : null,
        expectedImpact: impactIdx >= 0 ? cells[impactIdx]?.trim() || null : null,
        dependencies: null,
        parentHLItem: '', // Will be matched later
      })
    }
  }

  return deliverables
}

// ─── Proposal File ───────────────────────────────────────────

function getProposalPath(quarter: string, initiative: string): string {
  const dir = path.join(process.cwd(), 'output', 'q-plan-proposals')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${quarter}_${initiative}.json`)
}

// ─── Main: Parse & Propose ───────────────────────────────────

export async function run(opts: {
  quarter: string
  initiative: string
  hlFile: string
  executionFiles?: string[]
}): Promise<IngestResult> {
  const supabase = await getSupabase()

  // Verify initiative exists
  const { data: initData, error: initError } = await supabase
    .from('initiatives' as any)
    .select('id, slug, title')
    .eq('slug', opts.initiative)
    .single()

  if (initError || !initData) {
    throw new Error(`Initiative "${opts.initiative}" not found. Check the slug.`)
  }
  const initiative = initData as unknown as { id: string; slug: string; title: string }

  console.log(`  Parsing HL deck: ${opts.hlFile}`)
  const hlTables = await extractTables(opts.hlFile)
  const hlItems = parseHLDeck(hlTables)
  console.log(`  Found ${hlItems.length} HL items`)

  // Parse execution decks
  let allDeliverables: ParsedDeliverable[] = []
  if (opts.executionFiles) {
    for (const file of opts.executionFiles) {
      console.log(`  Parsing execution deck: ${file}`)
      const execTables = await extractTables(file)
      const deliverables = parseExecutionDeck(execTables)
      allDeliverables.push(...deliverables)
      console.log(`  Found ${deliverables.length} deliverables`)
    }
  }

  // Build proposal (deliverables are unmatched — user will validate mapping)
  const proposal: IngestProposal = {
    quarter: opts.quarter,
    initiativeSlug: initiative.slug,
    initiativeTitle: initiative.title,
    hlItems,
    deliverables: allDeliverables,
    unmatchedDeliverables: allDeliverables, // All unmatched until user confirms mapping
  }

  // Save proposal for commit step
  const proposalPath = getProposalPath(opts.quarter, opts.initiative)
  fs.writeFileSync(proposalPath, JSON.stringify(proposal, null, 2))

  // Format summary for human review
  const lines: string[] = []
  lines.push(`Q-Plan Ingest Proposal: ${opts.quarter} / ${initiative.title}`)
  lines.push('─'.repeat(50))
  lines.push('')
  lines.push(`Initiative: ${initiative.title} (${initiative.slug})`)
  lines.push(`Quarter: ${opts.quarter}`)
  lines.push('')

  lines.push('HL Plan Items:')
  for (let i = 0; i < hlItems.length; i++) {
    const item = hlItems[i]
    lines.push(`  ${i + 1}. ${item.title}`)
    if (item.description) lines.push(`     ${item.description}`)
    if (item.expectedImpactCurrentQ) lines.push(`     Q impact: ${item.expectedImpactCurrentQ}`)
    if (item.expectedImpactNextQ) lines.push(`     Next Q: ${item.expectedImpactNextQ}`)
  }

  if (allDeliverables.length > 0) {
    lines.push('')
    lines.push('Deliverables (from execution decks):')
    for (let i = 0; i < allDeliverables.length; i++) {
      const d = allDeliverables[i]
      lines.push(`  ${i + 1}. [${d.theme}] ${d.title}`)
      if (d.timing) lines.push(`     Timing: ${d.timing}`)
      if (d.expectedImpact) lines.push(`     Impact: ${d.expectedImpact}`)
    }
    lines.push('')
    lines.push(`NOTE: ${allDeliverables.length} deliverables need to be mapped to HL items.`)
    lines.push('Edit the proposal file to set parentHLItem for each deliverable, then run commit-ingest.')
  }

  lines.push('')
  lines.push(`Proposal saved to: ${proposalPath}`)

  return {
    summary: lines.join('\n'),
    proposal,
    requiresApproval: true,
  }
}

// ─── Commit: Write Approved Proposal to DB ───────────────────

export async function commitIngest(opts: {
  quarter: string
  initiative: string
}): Promise<{ summary: string }> {
  const supabase = await getSupabase()

  const proposalPath = getProposalPath(opts.quarter, opts.initiative)
  if (!fs.existsSync(proposalPath)) {
    throw new Error(`No proposal found at ${proposalPath}. Run ingest first.`)
  }

  const proposal: IngestProposal = JSON.parse(fs.readFileSync(proposalPath, 'utf-8'))

  // Ensure quarterly plan exists
  let { data: planData } = await supabase
    .from('quarterly_plans' as any)
    .select('id')
    .eq('quarter', proposal.quarter)
    .single()

  if (!planData) {
    const { data: newPlan, error: planError } = await supabase
      .from('quarterly_plans' as any)
      .insert({ quarter: proposal.quarter, title: `${proposal.quarter} CLM Quarterly Plan`, status: 'active' } as any)
      .select('id')
      .single()

    if (planError) throw new Error(`Failed to create plan: ${planError.message}`)
    planData = newPlan
  }

  const plan = planData as unknown as { id: string }

  // Get initiative ID
  const { data: initData } = await supabase
    .from('initiatives' as any)
    .select('id')
    .eq('slug', proposal.initiativeSlug)
    .single()

  const initiativeId = (initData as unknown as { id: string } | null)?.id ?? null

  // Insert HL items
  const insertedItems: Array<{ id: string; title: string }> = []
  for (let i = 0; i < proposal.hlItems.length; i++) {
    const item = proposal.hlItems[i]
    const { data, error } = await supabase
      .from('quarterly_plan_items' as any)
      .insert({
        plan_id: plan.id,
        initiative_id: initiativeId,
        title: item.title,
        description: item.description,
        expected_impact_current_q: item.expectedImpactCurrentQ,
        expected_impact_next_q: item.expectedImpactNextQ,
        status: 'planned',
        sort_order: i + 1,
      } as any)
      .select('id, title')
      .single()

    if (error) {
      console.error(`  Failed to insert HL item "${item.title}": ${error.message}`)
      continue
    }
    insertedItems.push(data as unknown as { id: string; title: string })
  }

  // Build title → id map for deliverable matching
  const itemMap = new Map(insertedItems.map(i => [i.title.toLowerCase(), i.id]))

  // Insert deliverables
  let delivInserted = 0
  let delivUnmatched = 0
  for (let i = 0; i < proposal.deliverables.length; i++) {
    const d = proposal.deliverables[i]
    const parentId = itemMap.get(d.parentHLItem?.toLowerCase() ?? '')

    if (!parentId) {
      console.error(`  Unmatched deliverable: "${d.title}" (parentHLItem: "${d.parentHLItem}")`)
      delivUnmatched++
      continue
    }

    const { error } = await supabase
      .from('quarterly_plan_deliverables' as any)
      .insert({
        plan_item_id: parentId,
        title: d.title,
        theme: d.theme,
        timing: d.timing,
        expected_impact: d.expectedImpact,
        dependencies: d.dependencies,
        status: 'planned',
        sort_order: i + 1,
      } as any)

    if (error) {
      console.error(`  Failed to insert deliverable "${d.title}": ${error.message}`)
    } else {
      delivInserted++
    }
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'q-plan-pm',
    category: 'observation',
    summary: `Ingested ${proposal.quarter} plan for ${proposal.initiativeTitle}: ${insertedItems.length} items, ${delivInserted} deliverables`,
    details: {
      quarter: proposal.quarter,
      initiative: proposal.initiativeSlug,
      hlItems: insertedItems.length,
      deliverables: delivInserted,
      unmatched: delivUnmatched,
    } as any,
    tags: ['q-plan-pm', 'ingest', proposal.quarter, proposal.initiativeSlug],
  })

  // Clean up proposal file
  fs.unlinkSync(proposalPath)

  return {
    summary: `Committed ${proposal.quarter} / ${proposal.initiativeTitle}: ${insertedItems.length} plan items, ${delivInserted} deliverables inserted.${delivUnmatched > 0 ? ` ${delivUnmatched} deliverables skipped (unmatched).` : ''}`,
  }
}
