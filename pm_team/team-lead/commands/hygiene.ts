/**
 * Team Lead — Hygiene Command
 *
 * Scans v_agent_tasks_dashboard for problems:
 * - Overdue tasks (due_date < today, not done/failed)
 * - Stale tasks (pending > 7 days)
 * - Stuck tasks (picked-up, no update > 24h)
 * - Failed tasks without follow-up
 * - Yonatan's pending items (needs-human tag)
 *
 * No LLM needed — pure SQL + formatting.
 */

import type { DashboardTask, HygieneIssue, HygieneResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(opts: { days?: number } = {}): Promise<HygieneResult> {
  const supabase = await getSupabase()

  // Query the dashboard view for non-completed tasks
  const { data, error } = await supabase
    .from('v_agent_tasks_dashboard' as any)
    .select('*')
    .not('status', 'in', '("done","failed")')

  if (error) {
    throw new Error(`Failed to query dashboard: ${error.message}`)
  }

  const tasks = (data || []) as unknown as DashboardTask[]
  const issues: HygieneIssue[] = []

  // Detect issues based on the health field computed by the view
  for (const task of tasks) {
    if (task.health === 'overdue') {
      issues.push({
        taskId: task.id,
        title: task.title,
        issueType: 'overdue',
        detail: `Due ${task.due_date}, still ${task.status}`,
        targetAgent: task.target_agent,
        priority: task.priority,
      })
    }

    if (task.health === 'stale') {
      issues.push({
        taskId: task.id,
        title: task.title,
        issueType: 'stale',
        detail: `Pending since ${task.created_at?.slice(0, 10)}, never picked up`,
        targetAgent: task.target_agent,
        priority: task.priority,
      })
    }

    if (task.health === 'stuck') {
      issues.push({
        taskId: task.id,
        title: task.title,
        issueType: 'stuck',
        detail: `Picked up by ${task.picked_up_by}, last updated ${task.updated_at?.slice(0, 10)}`,
        targetAgent: task.target_agent,
        priority: task.priority,
      })
    }

    // Needs-human detection
    if (task.tags?.includes('needs-human') && task.status === 'pending') {
      issues.push({
        taskId: task.id,
        title: task.title,
        issueType: 'needs-human',
        detail: `Awaiting human action since ${task.created_at?.slice(0, 10)}`,
        targetAgent: task.target_agent,
        priority: task.priority,
      })
    }
  }

  // Check for failed tasks without follow-up (no child task)
  const { data: failedData } = await supabase
    .from('v_agent_tasks_dashboard' as any)
    .select('*')
    .eq('status', 'failed')

  const failedTasks = (failedData || []) as unknown as DashboardTask[]

  for (const failed of failedTasks) {
    // Check if there's a child task (follow-up)
    const { data: children } = await supabase
      .from('agent_tasks' as any)
      .select('id')
      .eq('parent_task_id', failed.id)
      .limit(1)

    if (!children || children.length === 0) {
      issues.push({
        taskId: failed.id,
        title: failed.title,
        issueType: 'failed-no-followup',
        detail: `Failed: ${failed.result_summary?.slice(0, 100) ?? 'no details'}`,
        targetAgent: failed.target_agent,
        priority: failed.priority,
      })
    }
  }

  // Build stats
  const stats = {
    total: issues.length,
    overdue: issues.filter(i => i.issueType === 'overdue').length,
    stale: issues.filter(i => i.issueType === 'stale').length,
    stuck: issues.filter(i => i.issueType === 'stuck').length,
    failedNoFollowup: issues.filter(i => i.issueType === 'failed-no-followup').length,
    needsHuman: issues.filter(i => i.issueType === 'needs-human').length,
  }

  // Build summary
  const parts: string[] = []
  if (stats.total === 0) {
    parts.push('Backlog is clean — no issues detected.')
  } else {
    parts.push(`Found ${stats.total} issue(s):`)
    if (stats.overdue > 0) parts.push(`  ${stats.overdue} overdue`)
    if (stats.stale > 0) parts.push(`  ${stats.stale} stale (pending > 7 days)`)
    if (stats.stuck > 0) parts.push(`  ${stats.stuck} stuck (no update > 24h)`)
    if (stats.failedNoFollowup > 0) parts.push(`  ${stats.failedNoFollowup} failed without follow-up`)
    if (stats.needsHuman > 0) parts.push(`  ${stats.needsHuman} awaiting human action`)
  }

  const result: HygieneResult = {
    summary: parts.join('\n'),
    issues,
    stats,
  }

  // Log to agent_log if there are issues
  if (stats.total > 0) {
    const { logAgent } = await import('../../../lib/logging.js')
    await logAgent({
      agentSlug: 'team-lead',
      category: 'observation',
      summary: `Hygiene scan: ${stats.total} issue(s) — ${stats.overdue} overdue, ${stats.stale} stale, ${stats.stuck} stuck, ${stats.failedNoFollowup} failed, ${stats.needsHuman} needs-human`,
      details: { stats, issues: issues.map(i => ({ id: i.taskId, type: i.issueType, title: i.title })) } as any,
      tags: ['team-lead', 'hygiene'],
    })
  }

  return result
}
