/**
 * Hub Countries PM Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'hub-countries-pm',
 * routes to the correct command module, writes results back.
 */

import type { HubCountriesCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): HubCountriesCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as HubCountriesCommand
  } catch {
    // Fall through to keyword parsing
  }

  // Keyword fallback
  const lower = description.toLowerCase()

  if (lower.includes('check-in') || lower.includes('checkin') || lower.includes('weekly')) {
    return { type: 'check-in' }
  }

  if (lower.includes('investigate')) {
    // Try to extract country
    const countryMatch = lower.match(/investigate\s+(\w+)/)
    if (countryMatch) {
      return { type: 'investigate', country: countryMatch[1] }
    }
  }

  return null
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: HubCountriesCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'check-in': {
      const { run } = await import('./commands/check-in.js')
      const result = await run({ days: command.days })
      return {
        summary: result.summary,
        details: { stats: result.stats, flags: result.flags, recommendations: result.recommendations },
      }
    }
    case 'investigate': {
      const { run } = await import('./commands/investigate.js')
      const result = await run({ country: command.country, topic: command.topic })
      return {
        summary: result.summary,
        details: {
          country: result.country,
          topic: result.topic,
          flagCount: result.flags.length,
          openQuestions: result.openQuestions,
          recommendedActions: result.recommendedActions,
        },
      }
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
    .eq('target_agent', 'hub-countries-pm')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for hub-countries-pm.')
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
      .update({ status: 'picked-up', picked_up_by: 'hub-countries-pm' } as any)
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
      await logError('hub-countries-pm', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
