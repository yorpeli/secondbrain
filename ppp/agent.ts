/**
 * PPP Ingest Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'ppp-ingest',
 * routes to the correct command module, writes results back.
 */

import type { PppCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): PppCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as PppCommand
  } catch {
    // Fall through to keyword parsing
  }

  // Keyword fallback
  const lower = description.toLowerCase()

  if (lower.includes('context')) {
    return { type: 'context' }
  }

  if (lower.includes('enrich')) {
    return { type: 'enrich' }
  }

  if (lower.includes('write') || lower.includes('ingest')) {
    // Try to extract a path
    const pathMatch = description.match(/(?:write|ingest)\s+(\S+\.json)/i)
    if (pathMatch) {
      return { type: 'write', path: pathMatch[1] }
    }
  }

  return null
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: PppCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'context': {
      const { run } = await import('./commands/context.js')
      const result = await run()
      return {
        summary: `Context loaded: ${result.previous_week.sections.length} previous swimlanes, ${Object.keys(result.people).length} people entries`,
        details: result as unknown as Record<string, unknown>,
      }
    }
    case 'write': {
      const { run } = await import('./commands/write.js')
      const result = await run({ path: command.path, replaceExisting: command.replace_existing })
      return {
        summary: result.success
          ? `Wrote ${result.sections_written} sections for report ${result.report_id}`
          : `Write failed: ${result.errors.join('; ')}`,
        details: result as unknown as Record<string, unknown>,
      }
    }
    case 'enrich': {
      const { run } = await import('./commands/enrich.js')
      const result = await run({ week: command.week })
      return {
        summary: result.summary,
        details: result as unknown as Record<string, unknown>,
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
    .eq('target_agent', 'ppp-ingest')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for ppp-ingest.')
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
      .update({ status: 'picked-up', picked_up_by: 'ppp-ingest' } as any)
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

      const { logError } = await import('../lib/logging.js')
      await logError('ppp-ingest', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
