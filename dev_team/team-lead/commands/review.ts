/**
 * Dev Team Lead — Review Command
 *
 * Reviews completed tasks from dev engineers.
 * Checks convention compliance and reports findings.
 */

import type { ReviewResult, ReviewIssue } from '../lib/types.js'

interface ReviewOptions {
  scope?: string // Filter by agent slug
}

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(options: ReviewOptions): Promise<ReviewResult> {
  const { scope } = options
  const supabase = await getSupabase()

  // Get recently completed dev team tasks
  const agents = scope ? [scope] : ['dev-frontend', 'dev-backend']
  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, target_agent, result_summary, result_details, completed_at, tags')
    .in('target_agent', agents)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(20)

  if (error) {
    return {
      summary: `Failed to fetch completed tasks: ${error.message}`,
      passed: false,
      issues: [],
      stats: { total: 0, errors: 1, warnings: 0, info: 0 },
    }
  }

  const completedTasks = (tasks || []) as unknown as Array<{
    id: string
    title: string
    target_agent: string
    result_summary: string | null
    result_details: Record<string, unknown> | null
    completed_at: string | null
    tags: string[] | null
  }>

  if (completedTasks.length === 0) {
    return {
      summary: 'No completed dev team tasks to review.',
      passed: true,
      issues: [],
      stats: { total: 0, errors: 0, warnings: 0, info: 0 },
    }
  }

  const issues: ReviewIssue[] = []

  // Check each completed task
  for (const task of completedTasks) {
    // Check: result_summary populated
    if (!task.result_summary) {
      issues.push({
        file: task.title,
        issue: 'Task completed without result_summary',
        severity: 'error',
        suggestion: 'Always write a result_summary when completing a task',
      })
    }

    // Check: result_details has structured output
    if (!task.result_details) {
      issues.push({
        file: task.title,
        issue: 'Task completed without structured result_details',
        severity: 'warning',
        suggestion: 'Include result_details with filesCreated/filesModified for traceability',
      })
    }

    // Check: files created are listed
    const details = task.result_details as Record<string, unknown> | null
    if (details) {
      const files = (details.filesCreated as string[] || []).concat(details.filesModified as string[] || [])
      if (files.length === 0 && task.result_summary && !task.result_summary.toLowerCase().includes('no changes')) {
        issues.push({
          file: task.title,
          issue: 'Task completed but no files listed in result_details',
          severity: 'info',
          suggestion: 'List all created/modified files for review tracking',
        })
      }
    }
  }

  const stats = {
    total: issues.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }

  const passed = stats.errors === 0

  // Log review results
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'dev-team-lead',
    category: 'observation',
    summary: `Review: ${completedTasks.length} tasks checked, ${stats.errors} errors, ${stats.warnings} warnings. ${passed ? 'PASSED' : 'ISSUES FOUND'}`,
    details: { stats, scope, taskCount: completedTasks.length },
    tags: ['dev-team', 'dev-review'],
  })

  return {
    summary: `Reviewed ${completedTasks.length} completed task(s). `
      + `${passed ? 'All passed.' : `Found ${stats.errors} error(s), ${stats.warnings} warning(s).`}`,
    passed,
    issues,
    stats,
  }
}
