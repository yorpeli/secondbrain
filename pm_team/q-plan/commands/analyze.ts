/**
 * Q-Plan PM — Analyze Command
 *
 * Gap analysis: planned vs actual, slippage patterns, impact tracking.
 * Reads initiative memories and PPP signals for cross-referencing.
 */

import type { AnalyzeResult, DeliverableRow, ProgressRow } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(opts: { quarter?: string } = {}): Promise<AnalyzeResult> {
  const supabase = await getSupabase()

  // Resolve quarter
  let quarter = opts.quarter
  if (!quarter) {
    const { data } = await supabase
      .from('quarterly_plans' as any)
      .select('quarter')
      .eq('status', 'active')
      .order('quarter', { ascending: false })
      .limit(1)

    quarter = ((data as unknown as Array<{ quarter: string }>) ?? [])[0]?.quarter
    if (!quarter) throw new Error('No active quarterly plan found.')
  }

  // Get plan items
  const { data: progressData } = await supabase
    .from('v_quarterly_plan_progress' as any)
    .select('*')
    .eq('quarter', quarter)

  const items = (progressData ?? []) as unknown as ProgressRow[]

  // Get all deliverables
  const itemIds = items.map(i => i.plan_item_id)
  const { data: delivData } = await supabase
    .from('quarterly_plan_deliverables' as any)
    .select('*')
    .in('plan_item_id', itemIds)
    .order('sort_order')

  const allDeliverables = (delivData ?? []) as unknown as DeliverableRow[]
  const today = new Date()

  // ─── Slippage Patterns ─────────────────────────────────────

  const slippagePatterns: AnalyzeResult['slippagePatterns'] = []

  // Pattern: items with all deliverables still planned
  const stuckItems = items.filter(i =>
    i.total_deliverables > 0 && i.done_deliverables === 0 && i.in_progress_deliverables === 0
  )
  if (stuckItems.length > 0) {
    slippagePatterns.push({
      pattern: 'Stuck at planned',
      detail: `${stuckItems.length} plan item(s) have zero progress — all deliverables still in "planned" state`,
      affectedItems: stuckItems.map(i => i.plan_item_title),
    })
  }

  // Pattern: overdue deliverables clustered under one item
  const overdueByItem = new Map<string, string[]>()
  for (const d of allDeliverables) {
    if (d.target_date && d.status !== 'done' && d.status !== 'cut' && new Date(d.target_date) < today) {
      const item = items.find(i => i.plan_item_id === d.plan_item_id)
      const key = item?.plan_item_title ?? d.plan_item_id
      const list = overdueByItem.get(key) ?? []
      list.push(d.title)
      overdueByItem.set(key, list)
    }
  }
  for (const [itemTitle, deliverables] of overdueByItem) {
    if (deliverables.length >= 2) {
      slippagePatterns.push({
        pattern: 'Clustered overdue',
        detail: `"${itemTitle}" has ${deliverables.length} overdue deliverables — possible systemic blocker`,
        affectedItems: deliverables,
      })
    }
  }

  // Pattern: timing says early Q but still not done
  const earlyQKeywords = ['january', 'jan', 'early', 'beginning']
  const lateStarters = allDeliverables.filter(d => {
    if (d.status === 'done' || d.status === 'cut') return false
    const timing = (d.timing ?? '').toLowerCase()
    return earlyQKeywords.some(k => timing.includes(k))
  })
  if (lateStarters.length > 0) {
    slippagePatterns.push({
      pattern: 'Early-Q items lagging',
      detail: `${lateStarters.length} deliverable(s) planned for early in the quarter are still not done`,
      affectedItems: lateStarters.map(d => d.title),
    })
  }

  // ─── Impact Gaps ───────────────────────────────────────────

  const impactGaps: AnalyzeResult['impactGaps'] = []
  for (const item of items) {
    if (!item.expected_impact_current_q) continue
    const pct = item.total_deliverables > 0
      ? Math.round((item.done_deliverables / item.total_deliverables) * 100)
      : 0

    if (pct < 50 && item.at_risk_deliverables + (overdueByItem.get(item.plan_item_title)?.length ?? 0) > 0) {
      impactGaps.push({
        planItem: item.plan_item_title,
        expectedImpact: item.expected_impact_current_q,
        currentStatus: `${pct}% done (${item.done_deliverables}/${item.total_deliverables})`,
        gap: `Expected ${item.expected_impact_current_q} but only ${pct}% of deliverables complete with at-risk/overdue items`,
      })
    }
  }

  // ─── Semantic context from PPP ─────────────────────────────

  let pppContext: string[] = []
  try {
    const { searchByType } = await import('../../../lib/embeddings.js')
    const initiativeTitles = [...new Set(items.map(i => i.initiative_title).filter(Boolean))]
    for (const title of initiativeTitles) {
      const results = await searchByType(`${title} progress blockers delays`, ['ppp'], { threshold: 0.72, limit: 3 })
      pppContext.push(...results.map(r => r.chunk_text))
    }
  } catch {}

  // ─── Recommendations ──────────────────────────────────────

  const recommendations: string[] = []

  if (stuckItems.length > 0) {
    recommendations.push(`Review ${stuckItems.length} stuck item(s) — they may need deprioritization or owner check-in`)
  }

  const totalOverdue = Array.from(overdueByItem.values()).reduce((s, l) => s + l.length, 0)
  if (totalOverdue > 0) {
    recommendations.push(`${totalOverdue} deliverables are overdue — update statuses or escalate`)
  }

  if (impactGaps.length > 0) {
    recommendations.push(`${impactGaps.length} plan item(s) have significant impact gaps — Q commitments at risk`)
  }

  const totalDone = items.reduce((s, i) => s + i.done_deliverables, 0)
  const totalAll = items.reduce((s, i) => s + i.total_deliverables, 0)
  const pctDone = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0
  if (pctDone < 30) {
    recommendations.push(`Overall completion is ${pctDone}% — consider scope reduction or resource reallocation`)
  }

  // ─── Build Summary ────────────────────────────────────────

  const lines: string[] = []
  lines.push(`Q-Plan Analysis: ${quarter}`)
  lines.push('─'.repeat(40))
  lines.push(`Overall: ${pctDone}% complete (${totalDone}/${totalAll} deliverables)`)
  lines.push(`Overdue: ${totalOverdue} | At-risk: ${items.reduce((s, i) => s + i.at_risk_deliverables, 0)}`)

  if (slippagePatterns.length > 0) {
    lines.push('')
    lines.push('Slippage Patterns:')
    for (const p of slippagePatterns) {
      lines.push(`  [${p.pattern}] ${p.detail}`)
      for (const a of p.affectedItems.slice(0, 5)) {
        lines.push(`    - ${a}`)
      }
    }
  }

  if (impactGaps.length > 0) {
    lines.push('')
    lines.push('Impact Gaps:')
    for (const g of impactGaps) {
      lines.push(`  ${g.planItem}: ${g.gap}`)
    }
  }

  if (recommendations.length > 0) {
    lines.push('')
    lines.push('Recommendations:')
    for (const r of recommendations) {
      lines.push(`  - ${r}`)
    }
  }

  const result: AnalyzeResult = {
    summary: lines.join('\n'),
    quarter,
    slippagePatterns,
    impactGaps,
    recommendations,
  }

  // Log analysis
  const { logAgent } = await import('../../../lib/logging.js')
  const hasGaps = slippagePatterns.length > 0 || impactGaps.length > 0
  await logAgent({
    agentSlug: 'q-plan-pm',
    category: hasGaps ? 'finding' : 'observation',
    summary: `${quarter} analysis: ${pctDone}% done, ${slippagePatterns.length} slippage patterns, ${impactGaps.length} impact gaps`,
    details: { pctDone, slippagePatterns: slippagePatterns.length, impactGaps: impactGaps.length, recommendations } as any,
    tags: ['q-plan-pm', 'analyze', quarter],
    autoEmbed: hasGaps,
  })

  return result
}
