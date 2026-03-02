/**
 * AB Testing Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'ab-testing',
 * routes to the correct command module, writes results back.
 */

import type { ABTestingCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): ABTestingCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as ABTestingCommand
  } catch {
    // Fall through to keyword parsing
  }

  const lower = description.toLowerCase()

  if (lower.includes('list')) {
    // Extract status if mentioned
    const statusMatch = lower.match(/status[=:\s]+(\S+)/)
    return { type: 'list', status: statusMatch ? statusMatch[1] as any : undefined }
  }

  if (lower.includes('analyze') || lower.includes('analysis')) {
    // Try to extract EXPID
    const expidMatch = description.match(/EXPID-\d+/i)
    if (expidMatch) return { type: 'analyze', expid: expidMatch[0].toUpperCase() }

    // Try to extract slug
    const slugMatch = lower.match(/analyze\s+(\S+)/)
    if (slugMatch) return { type: 'analyze', slug: slugMatch[1] }
  }

  return null
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: ABTestingCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'list': {
      const { run } = await import('./commands/list.js')
      const result = await run({ status: command.status })
      return { summary: result.summary }
    }
    case 'analyze': {
      const { run } = await import('./commands/analyze.js')
      const result = await run({
        slug: command.slug,
        expid: command.expid,
      })
      return {
        summary: result.summary,
        details: result.entry ? {
          verdict: result.entry.verdict,
          metrics: result.entry.metrics,
          sample_size: result.entry.sample_size,
        } : undefined,
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
    .eq('target_agent', 'ab-testing')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for ab-testing.')
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
      .update({ status: 'picked-up', picked_up_by: 'ab-testing' } as any)
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

      const { logError } = await import('../lib/logging.js')
      await logError('ab-testing', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
