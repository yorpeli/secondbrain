/**
 * Dev Team Lead Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'dev-team-lead',
 * routes to the correct command module, writes results back.
 */

import type { DevTeamLeadCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): DevTeamLeadCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as DevTeamLeadCommand
  } catch {
    // Fall through to keyword parsing
  }

  // Keyword fallback
  const lower = description.toLowerCase()

  if (lower.includes('plan')) {
    // Extract feature from description
    const feature = description.replace(/plan\s*/i, '').trim() || 'unnamed feature'
    return { type: 'plan', feature }
  }
  if (lower.includes('delegate')) {
    return { type: 'delegate', planRef: 'latest' }
  }
  if (lower.includes('review')) {
    return { type: 'review' }
  }
  if (lower.includes('status')) {
    return { type: 'status' }
  }

  return null
}

// ── Command Routing ──────────────────────────────────────────

async function executeCommand(command: DevTeamLeadCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'plan': {
      const { run } = await import('./commands/plan.js')
      const result = await run({ feature: command.feature })
      return { summary: result.summary, details: { plan: result.plan } }
    }
    case 'delegate': {
      const { run } = await import('./commands/delegate.js')
      const result = await run({ planRef: command.planRef })
      return { summary: result.summary, details: { tasksCreated: result.tasksCreated } }
    }
    case 'review': {
      const { run } = await import('./commands/review.js')
      const result = await run({ scope: command.scope })
      return { summary: result.summary, details: { stats: result.stats, issues: result.issues } }
    }
    case 'status': {
      const { run } = await import('./commands/status.js')
      const result = await run()
      return { summary: result.summary, details: { agents: result.agents, stats: result.stats } }
    }
  }
}

// ── Task Pickup ──────────────────────────────────────────────

interface AgentTask {
  id: string
  title: string
  description: string
  status: string
  priority: string
}

export async function checkTasks(): Promise<{ processed: number; errors: number }> {
  const supabase = await getSupabase()

  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, status, priority')
    .eq('target_agent', 'dev-team-lead')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for dev-team-lead.')
    return { processed: 0, errors: 0 }
  }

  console.log(`Found ${pending.length} pending task(s).`)
  let processed = 0
  let errors = 0

  for (const task of pending) {
    console.log(`\nProcessing: ${task.title} (${task.id})`)

    // Claim task
    await supabase
      .from('agent_tasks' as any)
      .update({ status: 'picked-up', picked_up_by: 'dev-team-lead' } as any)
      .eq('id', task.id)

    try {
      const command = parseCommand(task.description)
      if (!command) {
        throw new Error(`Could not parse command from description: "${task.description.slice(0, 100)}"`)
      }

      console.log(`  Command: ${command.type}`)
      const result = await executeCommand(command)
      console.log(`  Done. Summary: ${result.summary.slice(0, 120)}...`)

      // Write result
      const update: Record<string, unknown> = {
        status: 'done',
        result_summary: result.summary,
        completed_at: new Date().toISOString(),
      }
      if (result.details) {
        update.result_details = result.details
      }

      await supabase
        .from('agent_tasks' as any)
        .update(update as any)
        .eq('id', task.id)

      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error: ${message}`)

      await supabase
        .from('agent_tasks' as any)
        .update({
          status: 'failed',
          result_summary: `Error: ${message}`,
        } as any)
        .eq('id', task.id)

      const { logError } = await import('../../lib/logging.js')
      await logError('dev-team-lead', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
