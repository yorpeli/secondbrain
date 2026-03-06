/**
 * Q-Plan PM Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'q-plan-pm',
 * routes to the correct command module, writes results back.
 */

import type { QPlanCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): QPlanCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as QPlanCommand
  } catch {
    // Fall through to keyword parsing
  }

  const lower = description.toLowerCase()

  if (lower.includes('status') || lower.includes('progress')) {
    const quarterMatch = lower.match(/q\d-\d{4}/i)
    return { type: 'status', quarter: quarterMatch?.[0]?.toUpperCase() }
  }

  if (lower.includes('analyze') || lower.includes('analysis') || lower.includes('gap')) {
    const quarterMatch = lower.match(/q\d-\d{4}/i)
    return { type: 'analyze', quarter: quarterMatch?.[0]?.toUpperCase() }
  }

  if (lower.includes('review') || lower.includes('retrospective')) {
    const quarterMatch = lower.match(/q\d-\d{4}/i)
    if (quarterMatch) {
      return { type: 'review', quarter: quarterMatch[0].toUpperCase() }
    }
  }

  return null
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: QPlanCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'status': {
      const { run } = await import('./commands/status.js')
      const result = await run({ quarter: command.quarter })
      return { summary: result.summary, details: { stats: result.stats, flags: result.flags } }
    }
    case 'analyze': {
      const { run } = await import('./commands/analyze.js')
      const result = await run({ quarter: command.quarter })
      return { summary: result.summary, details: { slippagePatterns: result.slippagePatterns, recommendations: result.recommendations } }
    }
    case 'review': {
      const { run } = await import('./commands/review.js')
      const result = await run({ quarter: command.quarter })
      return { summary: result.summary, details: { shipped: result.shipped.length, cut: result.cut.length, rolledForward: result.rolledForward.length } }
    }
    case 'update': {
      const { run } = await import('./commands/update.js')
      const result = await run(command)
      return { summary: result.summary, details: { updated: result.updated } }
    }
    case 'ingest': {
      // Ingest requires human approval — return the proposal, don't commit
      const { run } = await import('./commands/ingest.js')
      const result = await run(command)
      return { summary: result.summary + '\n\n[REQUIRES APPROVAL — proposal saved, not committed]', details: { proposal: result.proposal } }
    }
  }
}

// ─── Task Pickup ──────────────────────────────────────────────

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
    .eq('target_agent', 'q-plan-pm')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for q-plan-pm.')
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
      .update({ status: 'picked-up', picked_up_by: 'q-plan-pm' } as any)
      .eq('id', task.id)

    try {
      const command = parseCommand(task.description)
      if (!command) {
        throw new Error(`Could not parse command from description: "${task.description.slice(0, 100)}"`)
      }

      console.log(`  Command: ${command.type}`)
      const result = await executeCommand(command)
      console.log(`  Done. Summary: ${result.summary.slice(0, 120)}...`)

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
      await logError('q-plan-pm', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
