/**
 * Dev Team Lead — Delegate Command
 *
 * Reads an approved plan from agent_log and creates agent_tasks
 * for frontend and backend engineers.
 */

import type { DelegateResult } from '../lib/types.js'
import { createTask } from '../../../lib/tasks.js'

interface DelegateOptions {
  planRef: string
}

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(options: DelegateOptions): Promise<DelegateResult> {
  const { planRef } = options

  // Find the plan in agent_log
  const plan = await findPlan(planRef)
  if (!plan) {
    return {
      summary: `Plan "${planRef}" not found in agent_log. Run 'plan' first.`,
      tasksCreated: 0,
      backendTasks: [],
      frontendTasks: [],
    }
  }

  if (plan.status !== 'approved' && plan.status !== 'proposed') {
    return {
      summary: `Plan "${planRef}" has status "${plan.status}". Only proposed/approved plans can be delegated.`,
      tasksCreated: 0,
      backendTasks: [],
      frontendTasks: [],
    }
  }

  if (plan.buildSequence.length === 0) {
    return {
      summary: `Plan "${planRef}" has no build sequence defined. Fill in the plan before delegating.`,
      tasksCreated: 0,
      backendTasks: [],
      frontendTasks: [],
    }
  }

  const backendTasks: string[] = []
  const frontendTasks: string[] = []

  // Create tasks from the build sequence
  for (const step of plan.buildSequence) {
    const taskId = await createTask({
      title: `[${planRef}] ${step.task}`,
      description: JSON.stringify({
        type: 'build',
        [step.agent === 'dev-backend' ? 'hook' : 'component']: step.task,
        spec: step.spec,
        plan_ref: planRef,
        dependencies: step.dependencies,
      }),
      targetAgent: step.agent,
      priority: 'normal',
      createdBy: 'agent:dev-team-lead',
      tags: ['dev-team', planRef, step.agent === 'dev-backend' ? 'backend' : 'frontend'],
    })

    if (taskId) {
      if (step.agent === 'dev-backend') {
        backendTasks.push(step.task)
      } else {
        frontendTasks.push(step.task)
      }
    }
  }

  const total = backendTasks.length + frontendTasks.length

  // Log the delegation
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'dev-team-lead',
    category: 'observation',
    summary: `Delegated plan "${planRef}": ${total} tasks created (${backendTasks.length} backend, ${frontendTasks.length} frontend)`,
    details: { planRef, backendTasks, frontendTasks },
    tags: ['dev-team', 'delegation', planRef],
  })

  return {
    summary: `Delegated "${planRef}": ${total} tasks created.\n`
      + `  Backend (${backendTasks.length}): ${backendTasks.join(', ') || 'none'}\n`
      + `  Frontend (${frontendTasks.length}): ${frontendTasks.join(', ') || 'none'}`,
    tasksCreated: total,
    backendTasks,
    frontendTasks,
  }
}

async function findPlan(planRef: string) {
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('agent_log')
      .select('details')
      .eq('agent_slug', 'dev-team-lead')
      .eq('category', 'decision')
      .contains('tags', ['dev-plan', planRef])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return null
    return (data as any).details?.plan ?? null
  } catch {
    return null
  }
}
