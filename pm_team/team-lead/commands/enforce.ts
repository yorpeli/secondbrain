/**
 * Team Lead — Enforce Command
 *
 * Checks whether agents are following the SOPs in pm_team/workflows.md.
 *
 * Checks:
 * - Are completed tasks recording outcomes (result_summary not empty)?
 * - Are agents logging findings to agent_log (threshold check)?
 * - Did new agents complete onboarding steps?
 *
 * Start simple — add more checks as workflows mature.
 */

import type { ComplianceCheck, EnforceResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(opts: { workflow?: string } = {}): Promise<EnforceResult> {
  const supabase = await getSupabase()
  const checks: ComplianceCheck[] = []

  // ─── Check 1: Completed tasks have result_summary ──────────

  const { data: doneTasks } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, picked_up_by, result_summary, completed_at')
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(50)

  const doneList = (doneTasks || []) as unknown as Array<{
    id: string; title: string; picked_up_by: string | null;
    result_summary: string | null; completed_at: string | null
  }>

  const missingOutcome = doneList.filter(t => !t.result_summary || t.result_summary.trim() === '')

  checks.push({
    check: 'Completed tasks record outcomes',
    passed: missingOutcome.length === 0,
    detail: missingOutcome.length === 0
      ? `All ${doneList.length} recent completed tasks have result_summary`
      : `${missingOutcome.length}/${doneList.length} completed tasks missing result_summary: ${missingOutcome.map(t => t.title).slice(0, 3).join(', ')}`,
  })

  // ─── Check 2: Active agents logging findings ──────────────

  const { data: registryData } = await supabase
    .from('agent_registry' as any)
    .select('slug, name, status')
    .eq('status', 'active')

  const activeAgents = (registryData || []) as unknown as Array<{ slug: string; name: string }>

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  for (const agent of activeAgents) {
    const { data: logEntries } = await supabase
      .from('agent_log' as any)
      .select('id')
      .eq('agent_slug', agent.slug)
      .gte('created_at', thirtyDaysAgo.toISOString())

    const entryCount = (logEntries || []).length

    checks.push({
      check: 'Agent logs findings regularly',
      passed: entryCount > 0,
      detail: entryCount > 0
        ? `${agent.name} (${agent.slug}): ${entryCount} log entries in last 30 days`
        : `${agent.name} (${agent.slug}): no log entries in last 30 days`,
      agent: agent.slug,
    })
  }

  // ─── Check 3: New agents completed onboarding ─────────────

  // "New" = registered in last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const { data: newAgents } = await supabase
    .from('agent_registry' as any)
    .select('slug, name, created_at')
    .gte('created_at', fourteenDaysAgo.toISOString())

  const newAgentList = (newAgents || []) as unknown as Array<{ slug: string; name: string; created_at: string }>

  for (const agent of newAgentList) {
    // Check if they introduced themselves via agent_log
    const { data: introEntries } = await supabase
      .from('agent_log' as any)
      .select('id')
      .eq('agent_slug', agent.slug)
      .limit(1)

    const hasIntro = (introEntries || []).length > 0

    checks.push({
      check: 'New agent completed onboarding',
      passed: hasIntro,
      detail: hasIntro
        ? `${agent.name} (${agent.slug}): has log entries (onboarding complete)`
        : `${agent.name} (${agent.slug}): no log entries yet (onboarding incomplete)`,
      agent: agent.slug,
    })
  }

  // ─── Check 4: Failed tasks have follow-ups ────────────────

  const { data: failedTasks } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, picked_up_by')
    .eq('status', 'failed')
    .limit(20)

  const failedList = (failedTasks || []) as unknown as Array<{ id: string; title: string; picked_up_by: string | null }>

  let failedWithFollowup = 0
  for (const failed of failedList) {
    const { data: children } = await supabase
      .from('agent_tasks' as any)
      .select('id')
      .eq('parent_task_id', failed.id)
      .limit(1)

    if ((children || []).length > 0) failedWithFollowup++
  }

  if (failedList.length > 0) {
    checks.push({
      check: 'Failed tasks have follow-up tasks',
      passed: failedWithFollowup === failedList.length,
      detail: `${failedWithFollowup}/${failedList.length} failed tasks have follow-up tasks`,
    })
  }

  // ─── Build Result ──────────────────────────────────────────

  const stats = {
    total: checks.length,
    passed: checks.filter(c => c.passed).length,
    failed: checks.filter(c => !c.passed).length,
  }

  const summaryParts: string[] = []
  summaryParts.push(`Compliance check: ${stats.passed}/${stats.total} passed`)

  if (stats.failed > 0) {
    summaryParts.push('\nFailed checks:')
    for (const check of checks.filter(c => !c.passed)) {
      summaryParts.push(`  - ${check.check}: ${check.detail}`)
    }
  }

  const result: EnforceResult = {
    summary: summaryParts.join('\n'),
    checks,
    stats,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'team-lead',
    category: 'observation',
    summary: `Enforce: ${stats.passed}/${stats.total} checks passed, ${stats.failed} failed`,
    details: {
      stats,
      failedChecks: checks.filter(c => !c.passed).map(c => ({ check: c.check, detail: c.detail })),
    } as any,
    tags: ['team-lead', 'enforce'],
  })

  return result
}
