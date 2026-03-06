/**
 * Q-Plan PM — Review Command
 *
 * Quarter-end review: what shipped, what got cut, what rolls forward.
 * Captures lessons learned into memory.
 */

import type { DeliverableRow, ProgressRow, ReviewResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(opts: { quarter: string }): Promise<ReviewResult> {
  const supabase = await getSupabase()

  // Get plan items
  const { data: progressData } = await supabase
    .from('v_quarterly_plan_progress' as any)
    .select('*')
    .eq('quarter', opts.quarter)

  const items = (progressData ?? []) as unknown as ProgressRow[]

  if (items.length === 0) {
    return {
      summary: `No plan items found for ${opts.quarter}.`,
      quarter: opts.quarter,
      shipped: [],
      cut: [],
      rolledForward: [],
      lessons: [],
    }
  }

  // Get all deliverables
  const itemIds = items.map(i => i.plan_item_id)
  const { data: delivData } = await supabase
    .from('quarterly_plan_deliverables' as any)
    .select('*')
    .in('plan_item_id', itemIds)

  const allDeliverables = (delivData ?? []) as unknown as DeliverableRow[]

  // Categorize
  const shipped = allDeliverables
    .filter(d => d.status === 'done')
    .map(d => ({ title: d.title, actualOutcome: d.actual_outcome }))

  const cut = allDeliverables
    .filter(d => d.status === 'cut')
    .map(d => ({ title: d.title, reason: d.actual_outcome }))

  const rolledForward = allDeliverables
    .filter(d => !['done', 'cut'].includes(d.status))
    .map(d => ({ title: d.title, status: d.status }))

  // Generate lessons
  const lessons: string[] = []
  const totalCount = allDeliverables.length
  const doneCount = shipped.length
  const cutCount = cut.length
  const rollCount = rolledForward.length
  const pctShipped = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  if (pctShipped >= 80) {
    lessons.push(`Strong execution: ${pctShipped}% shipped. Planning accuracy was good.`)
  } else if (pctShipped >= 50) {
    lessons.push(`Mixed execution: ${pctShipped}% shipped. Review estimation and scoping for next quarter.`)
  } else {
    lessons.push(`Low completion: ${pctShipped}% shipped. Significant overcommitment or blockers. Reduce scope next quarter.`)
  }

  if (cutCount > 2) {
    lessons.push(`${cutCount} items cut — consider tighter scope definition at planning time.`)
  }

  if (rollCount > totalCount * 0.3) {
    lessons.push(`${rollCount} items rolling forward (${Math.round(rollCount / totalCount * 100)}%) — persistent carry-over indicates systematic underestimation.`)
  }

  // Check for items with no target dates
  const noTargetDate = allDeliverables.filter(d => !d.target_date && d.status !== 'done' && d.status !== 'cut')
  if (noTargetDate.length > 0) {
    lessons.push(`${noTargetDate.length} deliverables had no target date — enforce dates at planning time.`)
  }

  // ─── Build Summary ────────────────────────────────────────

  const lines: string[] = []
  lines.push(`Q-Plan Review: ${opts.quarter}`)
  lines.push('─'.repeat(40))
  lines.push(`Total: ${totalCount} deliverables`)
  lines.push(`Shipped: ${doneCount} (${pctShipped}%) | Cut: ${cutCount} | Rolling Forward: ${rollCount}`)

  if (shipped.length > 0) {
    lines.push('')
    lines.push('Shipped:')
    for (const s of shipped) {
      lines.push(`  + ${s.title}${s.actualOutcome ? ` — ${s.actualOutcome}` : ''}`)
    }
  }

  if (cut.length > 0) {
    lines.push('')
    lines.push('Cut:')
    for (const c of cut) {
      lines.push(`  x ${c.title}${c.reason ? ` — ${c.reason}` : ''}`)
    }
  }

  if (rolledForward.length > 0) {
    lines.push('')
    lines.push('Rolling Forward:')
    for (const r of rolledForward) {
      lines.push(`  → ${r.title} (${r.status})`)
    }
  }

  if (lessons.length > 0) {
    lines.push('')
    lines.push('Lessons:')
    for (const l of lessons) {
      lines.push(`  - ${l}`)
    }
  }

  const result: ReviewResult = {
    summary: lines.join('\n'),
    quarter: opts.quarter,
    shipped,
    cut,
    rolledForward,
    lessons,
  }

  // Log review
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'q-plan-pm',
    category: 'finding',
    summary: `${opts.quarter} review: ${pctShipped}% shipped, ${cutCount} cut, ${rollCount} rolling forward`,
    details: { pctShipped, shipped: doneCount, cut: cutCount, rolledForward: rollCount, lessons } as any,
    tags: ['q-plan-pm', 'review', opts.quarter],
    autoEmbed: true,
  })

  return result
}
