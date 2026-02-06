/**
 * Data-Viz Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table, renders charts based on spec,
 * writes results back, and logs substantial findings.
 */

import { renderChart } from './lib/renderer.js'
import { templates } from './templates/index.js'
import type { ChartSpec } from './lib/types.js'

// Lazy-loaded Supabase (only needed when running as agent)
async function getSupabase() {
  const { getSupabase: gs } = await import('../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

interface RenderCommand {
  type: 'render'
  spec: ChartSpec
}

function parseCommand(description: string): RenderCommand | null {
  try {
    const parsed = JSON.parse(description)
    if (parsed.type === 'render' && parsed.spec?.template) {
      return parsed as RenderCommand
    }
    // Direct spec with template field
    if (parsed.template && templates[parsed.template]) {
      return { type: 'render', spec: parsed as ChartSpec }
    }
  } catch {
    // Not JSON
  }
  return null
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
    .or('target_agent.eq.data-viz,target_agent.is.null')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks.')
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
      .update({ status: 'picked-up', picked_up_by: 'data-viz' } as any)
      .eq('id', task.id)

    try {
      const command = parseCommand(task.description)
      if (!command) {
        throw new Error(`Could not parse render command from: "${task.description.slice(0, 100)}"`)
      }

      console.log(`  Template: ${command.spec.template}`)
      const result = await renderChart(command.spec)

      const summary = `Rendered ${command.spec.template} chart (${result.width}x${result.height})`
        + (command.spec.output?.saveTo ? ` → ${command.spec.output.saveTo}` : '')

      console.log(`  Done: ${summary}`)

      await supabase
        .from('agent_tasks' as any)
        .update({
          status: 'done',
          result_summary: summary,
          completed_at: new Date().toISOString(),
        } as any)
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
      await logError('data-viz', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
