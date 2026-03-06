/**
 * Dev Team Lead — Status Command
 *
 * Team health and progress dashboard.
 * Queries agent_tasks for dev team agents, shows progress.
 */

import type { StatusResult, AgentStatus } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

const DEV_AGENTS = ['dev-team-lead', 'dev-frontend', 'dev-backend']

export async function run(): Promise<StatusResult> {
  const supabase = await getSupabase()

  // Get all dev team tasks
  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, status, target_agent, picked_up_by, result_summary, result_details, created_at, completed_at, tags')
    .or(DEV_AGENTS.map(a => `target_agent.eq.${a}`).join(','))
    .order('created_at', { ascending: false })

  if (error) {
    return {
      summary: `Failed to fetch tasks: ${error.message}`,
      agents: [],
      activePlans: [],
      stats: { totalPending: 0, totalDone: 0, totalFailed: 0 },
    }
  }

  const allTasks = (tasks || []) as unknown as Array<{
    id: string
    title: string
    status: string
    target_agent: string | null
    picked_up_by: string | null
    result_summary: string | null
    result_details: Record<string, unknown> | null
    created_at: string | null
    completed_at: string | null
    tags: string[] | null
  }>

  // Per-agent status
  const agents: AgentStatus[] = DEV_AGENTS.map(slug => {
    const agentTasks = allTasks.filter(t => t.target_agent === slug)
    const lastDone = agentTasks
      .filter(t => t.status === 'done')
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))[0]

    return {
      slug,
      pendingTasks: agentTasks.filter(t => t.status === 'pending').length,
      completedTasks: agentTasks.filter(t => t.status === 'done').length,
      failedTasks: agentTasks.filter(t => t.status === 'failed').length,
      lastActivity: lastDone?.completed_at ?? null,
    }
  })

  // Find active plans from agent_log
  const activePlans = await getActivePlans(supabase, allTasks)

  const stats = {
    totalPending: agents.reduce((sum, a) => sum + a.pendingTasks, 0),
    totalDone: agents.reduce((sum, a) => sum + a.completedTasks, 0),
    totalFailed: agents.reduce((sum, a) => sum + a.failedTasks, 0),
  }

  const total = stats.totalPending + stats.totalDone + stats.totalFailed

  return {
    summary: `Dev Team Status: ${total} total tasks (${stats.totalPending} pending, ${stats.totalDone} done, ${stats.totalFailed} failed). `
      + `${activePlans.length} active plan(s).`,
    agents,
    activePlans,
    stats,
  }
}

async function getActivePlans(supabase: any, allTasks: any[]) {
  try {
    const { data } = await supabase
      .from('agent_log')
      .select('details')
      .eq('agent_slug', 'dev-team-lead')
      .eq('category', 'decision')
      .contains('tags', ['dev-plan'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (!data) return []

    return (data as any[])
      .filter(row => row.details?.plan?.status && row.details.plan.status !== 'completed')
      .map(row => {
        const plan = row.details.plan
        const planTasks = allTasks.filter(t => t.tags?.includes(plan.ref))
        return {
          ref: plan.ref,
          feature: plan.feature,
          status: plan.status,
          tasksTotal: planTasks.length,
          tasksDone: planTasks.filter((t: any) => t.status === 'done').length,
        }
      })
  } catch {
    return []
  }
}
