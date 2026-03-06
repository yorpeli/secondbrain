/**
 * Q-Plan PM — Status Command
 *
 * Current quarter progress: rollup by initiative, flags for overdue/at-risk,
 * completion stats.
 */

import type { DeliverableRow, ProgressRow, PlanItemStatus, QPlanFlag, StatusResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Flag Detection ──────────────────────────────────────────

function detectFlags(
  items: ProgressRow[],
  deliverablesByItem: Map<string, DeliverableRow[]>,
  today: Date,
): QPlanFlag[] {
  const flags: QPlanFlag[] = []

  for (const item of items) {
    // No progress at mid-quarter
    if (item.total_deliverables > 0 && item.done_deliverables === 0 && item.in_progress_deliverables === 0) {
      flags.push({
        severity: 'yellow',
        flag: 'No progress',
        detail: `"${item.plan_item_title}" has ${item.total_deliverables} deliverables, none started`,
        planItem: item.plan_item_title,
        recommendedAction: 'Check with the initiative owner on blockers or deprioritization',
      })
    }

    // At-risk deliverables
    if (item.at_risk_deliverables > 0) {
      flags.push({
        severity: 'yellow',
        flag: 'At-risk deliverables',
        detail: `"${item.plan_item_title}" has ${item.at_risk_deliverables} at-risk deliverable(s)`,
        planItem: item.plan_item_title,
      })
    }

    // Overdue: target_date passed but not done
    const deliverables = deliverablesByItem.get(item.plan_item_id) ?? []
    for (const d of deliverables) {
      if (d.target_date && d.status !== 'done' && d.status !== 'cut' && new Date(d.target_date) < today) {
        flags.push({
          severity: 'red',
          flag: 'Overdue deliverable',
          detail: `"${d.title}" was due ${d.target_date}, status: ${d.status}`,
          planItem: item.plan_item_title,
          deliverable: d.title,
          recommendedAction: 'Update status or escalate the delay',
        })
      }
    }

    // High concentration: single item has > 50% of all deliverables
    const totalAcrossAll = items.reduce((sum, i) => sum + i.total_deliverables, 0)
    if (totalAcrossAll > 4 && item.total_deliverables > totalAcrossAll * 0.5) {
      flags.push({
        severity: 'info',
        flag: 'Concentration risk',
        detail: `"${item.plan_item_title}" has ${item.total_deliverables}/${totalAcrossAll} deliverables (${Math.round(item.total_deliverables / totalAcrossAll * 100)}%)`,
        planItem: item.plan_item_title,
      })
    }
  }

  // Sort: red first
  const severityOrder = { red: 0, yellow: 1, info: 2 }
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return flags
}

// ─── Main ────────────────────────────────────────────────────

export async function run(opts: { quarter?: string } = {}): Promise<StatusResult> {
  const supabase = await getSupabase()

  // Resolve quarter: use provided or find active
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

  // Get rollup data
  const { data: progressData, error: progressError } = await supabase
    .from('v_quarterly_plan_progress' as any)
    .select('*')
    .eq('quarter', quarter)

  if (progressError) throw new Error(`Failed to fetch plan progress: ${progressError.message}`)
  const items = (progressData ?? []) as unknown as ProgressRow[]

  if (items.length === 0) {
    return {
      summary: `No plan items found for ${quarter}.`,
      quarter,
      initiativeGroups: [],
      flags: [],
      stats: { totalItems: 0, totalDeliverables: 0, doneDeliverables: 0, atRiskDeliverables: 0, overdueDeliverables: 0, completionPct: 0 },
    }
  }

  // Get all deliverables for overdue detection
  const itemIds = items.map(i => i.plan_item_id)
  const { data: delivData } = await supabase
    .from('quarterly_plan_deliverables' as any)
    .select('*')
    .in('plan_item_id', itemIds)
    .order('sort_order')

  const allDeliverables = (delivData ?? []) as unknown as DeliverableRow[]
  const deliverablesByItem = new Map<string, DeliverableRow[]>()
  for (const d of allDeliverables) {
    const list = deliverablesByItem.get(d.plan_item_id) ?? []
    list.push(d)
    deliverablesByItem.set(d.plan_item_id, list)
  }

  const today = new Date()

  // Detect flags
  const flags = detectFlags(items, deliverablesByItem, today)

  // Group by initiative
  const groupMap = new Map<string, { initiative: string; slug: string | null; priority: string | null; items: PlanItemStatus[] }>()
  for (const item of items) {
    const key = item.initiative_slug ?? 'unlinked'
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        initiative: item.initiative_title ?? 'Unlinked',
        slug: item.initiative_slug,
        priority: item.initiative_priority,
        items: [],
      })
    }

    const deliverables = deliverablesByItem.get(item.plan_item_id) ?? []
    const overdue = deliverables.filter(d =>
      d.target_date && d.status !== 'done' && d.status !== 'cut' && new Date(d.target_date) < today
    )

    groupMap.get(key)!.items.push({
      title: item.plan_item_title,
      theme: item.theme,
      status: item.item_status,
      expectedImpact: item.expected_impact_current_q,
      total: item.total_deliverables,
      done: item.done_deliverables,
      inProgress: item.in_progress_deliverables,
      atRisk: item.at_risk_deliverables,
      planned: item.planned_deliverables,
      cut: item.cut_deliverables,
      overdueDeliverables: overdue,
    })
  }

  const initiativeGroups = Array.from(groupMap.values())

  // Compute stats
  const totalDeliverables = items.reduce((s, i) => s + i.total_deliverables, 0)
  const doneDeliverables = items.reduce((s, i) => s + i.done_deliverables, 0)
  const atRiskDeliverables = items.reduce((s, i) => s + i.at_risk_deliverables, 0)
  const overdueCount = allDeliverables.filter(d =>
    d.target_date && d.status !== 'done' && d.status !== 'cut' && new Date(d.target_date) < today
  ).length
  const completionPct = totalDeliverables > 0 ? Math.round((doneDeliverables / totalDeliverables) * 100) : 0

  const stats = {
    totalItems: items.length,
    totalDeliverables,
    doneDeliverables,
    atRiskDeliverables,
    overdueDeliverables: overdueCount,
    completionPct,
  }

  // Build summary
  const lines: string[] = []
  lines.push(`Q-Plan Status: ${quarter}`)
  lines.push('─'.repeat(40))
  lines.push(`${stats.totalItems} plan items | ${totalDeliverables} deliverables | ${completionPct}% done`)
  lines.push(`Done: ${doneDeliverables} | In Progress: ${items.reduce((s, i) => s + i.in_progress_deliverables, 0)} | At Risk: ${atRiskDeliverables} | Overdue: ${overdueCount}`)

  for (const group of initiativeGroups) {
    lines.push('')
    lines.push(`${group.initiative} (${group.priority ?? '–'})`)
    for (const item of group.items) {
      const bar = `[${item.done}/${item.total}]`
      const riskTag = item.atRisk > 0 ? ` [${item.atRisk} at-risk]` : ''
      const overdueTag = item.overdueDeliverables.length > 0 ? ` [${item.overdueDeliverables.length} OVERDUE]` : ''
      lines.push(`  ${item.title} ${bar} ${item.status}${riskTag}${overdueTag}`)
      if (item.expectedImpact) lines.push(`    Expected: ${item.expectedImpact}`)
    }
  }

  if (flags.length > 0) {
    lines.push('')
    lines.push('Flags:')
    for (const f of flags) {
      const icon = f.severity === 'red' ? 'RED' : f.severity === 'yellow' ? 'YLW' : 'INF'
      lines.push(`  [${icon}] ${f.flag}: ${f.detail}`)
      if (f.recommendedAction) lines.push(`    → ${f.recommendedAction}`)
    }
  }

  const result: StatusResult = {
    summary: lines.join('\n'),
    quarter,
    initiativeGroups,
    flags,
    stats,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'q-plan-pm',
    category: flags.some(f => f.severity === 'red') ? 'finding' : 'observation',
    summary: `${quarter} status: ${completionPct}% done, ${overdueCount} overdue, ${flags.filter(f => f.severity === 'red').length} red flags`,
    details: { stats, flagCount: flags.length } as any,
    tags: ['q-plan-pm', 'status', quarter],
  })

  return result
}
