/**
 * Dev Backend Engineer Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'dev-backend',
 * routes to the correct command module, writes results back.
 */

import type { DevBackendCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): DevBackendCommand | null {
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as DevBackendCommand
  } catch {
    // Fall through
  }

  const lower = description.toLowerCase()
  if (lower.includes('build')) {
    return { type: 'build', hook: 'unknown', spec: description }
  }
  if (lower.includes('refactor')) {
    return { type: 'refactor', target: description }
  }

  return null
}

// ── Command Routing ──────────────────────────────────────────

async function executeCommand(command: DevBackendCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'build': {
      const { run } = await import('./commands/build.js')
      const result = await run({ hook: command.hook, spec: command.spec })
      return { summary: result.summary, details: { filesCreated: result.filesCreated, exports: result.exports } }
    }
    case 'refactor': {
      const { run } = await import('./commands/refactor.js')
      const result = await run({ target: command.target, reason: command.reason })
      return { summary: result.summary, details: { filesModified: result.filesModified } }
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
    .eq('target_agent', 'dev-backend')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for dev-backend.')
    return { processed: 0, errors: 0 }
  }

  console.log(`Found ${pending.length} pending task(s).`)
  let processed = 0
  let errors = 0

  for (const task of pending) {
    console.log(`\nProcessing: ${task.title} (${task.id})`)

    await supabase
      .from('agent_tasks' as any)
      .update({ status: 'picked-up', picked_up_by: 'dev-backend' } as any)
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
      if (result.details) update.result_details = result.details

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
        .update({ status: 'failed', result_summary: `Error: ${message}` } as any)
        .eq('id', task.id)

      const { logError } = await import('../../lib/logging.js')
      await logError('dev-backend', err instanceof Error ? err : new Error(message), {
        task_id: task.id, task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
