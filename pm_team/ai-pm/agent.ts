/**
 * AI PM Agent — Task Runner
 *
 * Picks up tasks targeted at 'ai-pm' from agent_tasks, routes to a command,
 * writes results back. Mirrors the other PM agents' runner.
 *
 * Note: `scan` and `brief` are gather/plan operations — the runner returns the
 * structured result; web research + final synthesis happen Claude-in-the-loop.
 */

import type { AiPmCommand } from './lib/types.js'
import { AGENT_SLUG } from './lib/config.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

function parseCommand(description: string): AiPmCommand | null {
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as AiPmCommand
  } catch { /* fall through to keywords */ }

  const lower = description.toLowerCase()
  if (lower.includes('portfolio')) return { type: 'portfolio' }
  if (lower.includes('scan') || lower.includes('research') || lower.includes('learn')) return { type: 'scan' }
  if (lower.includes('synthesize') || lower.includes('synthesis')) return { type: 'synthesize' }
  const briefMatch = lower.match(/brief\s+([a-z0-9-]+)/)
  if (briefMatch) return { type: 'brief', slug: briefMatch[1] }
  return null
}

async function executeCommand(command: AiPmCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'portfolio': {
      const { run } = await import('./commands/portfolio.js')
      const r = await run({ days: command.days })
      return { summary: r.summary, details: { flags: r.flags, count: r.snapshots.length } }
    }
    case 'brief': {
      const { run } = await import('./commands/brief.js')
      const r = await run({ slug: command.slug })
      return { summary: r.summary, details: { open_questions: r.open_questions.length, research: r.relevant_research.length } }
    }
    case 'scan': {
      const { plan } = await import('./commands/scan.js')
      const r = await plan()
      return {
        summary: `Research agenda: ${r.agenda.length} item(s) (${r.agenda.filter(a => a.kind === 'demand').length} demand, ${r.agenda.filter(a => a.kind === 'sweep').length} sweep), ${r.stale_research.length} stale. Execute with web research, then scan --store.`,
        details: { agenda: r.agenda, stale_research: r.stale_research },
      }
    }
    case 'synthesize': {
      // Synthesis is the portfolio view plus Claude's narrative on top.
      const { run } = await import('./commands/portfolio.js')
      const r = await run({ days: command.days })
      return { summary: r.summary, details: { flags: r.flags } }
    }
  }
}

interface AgentTask { id: string; title: string; description: string; status: string; priority: string }

export async function checkTasks(): Promise<{ processed: number; errors: number }> {
  const supabase = await getSupabase()

  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, status, priority')
    .eq('target_agent', AGENT_SLUG)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) { console.error('Failed to fetch tasks:', error.message); return { processed: 0, errors: 1 } }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) { console.log(`No pending tasks for ${AGENT_SLUG}.`); return { processed: 0, errors: 0 } }

  console.log(`Found ${pending.length} pending task(s).`)
  let processed = 0, errors = 0

  for (const task of pending) {
    console.log(`\nProcessing: ${task.title} (${task.id})`)
    await supabase.from('agent_tasks' as any).update({ status: 'picked-up', picked_up_by: AGENT_SLUG } as any).eq('id', task.id)

    try {
      const command = parseCommand(task.description)
      if (!command) throw new Error(`Could not parse command from description: "${task.description.slice(0, 100)}"`)
      console.log(`  Command: ${command.type}`)
      const result = await executeCommand(command)
      console.log(`  Done. ${result.summary.slice(0, 120)}...`)

      const update: Record<string, unknown> = { status: 'done', result_summary: result.summary, completed_at: new Date().toISOString() }
      if (result.details) update.result_details = result.details
      await supabase.from('agent_tasks' as any).update(update as any).eq('id', task.id)
      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error: ${message}`)
      await supabase.from('agent_tasks' as any).update({ status: 'failed', result_summary: `Error: ${message}` } as any).eq('id', task.id)
      try {
        const { logError } = await import('../../lib/logging.js')
        await logError(AGENT_SLUG, err instanceof Error ? err : new Error(message), { task_id: task.id, task_title: task.title })
      } catch { /* logging best-effort */ }
      errors++
    }
  }

  return { processed, errors }
}
