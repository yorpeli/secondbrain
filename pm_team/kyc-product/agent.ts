/**
 * KYC Product PM Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table targeted at 'kyc-product-pm',
 * routes to the correct command module, writes results back.
 */

import type { KycProductCommand } from './lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): KycProductCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description)
    if (parsed.type) return parsed as KycProductCommand
  } catch {
    // Fall through to keyword parsing
  }

  // Keyword fallback
  const lower = description.toLowerCase()

  if (lower.includes('research')) {
    // Try to extract topic
    const topicMatch = lower.match(/research\s+(\S+)/)
    if (topicMatch) {
      return { type: 'research', topic: topicMatch[1] }
    }
    return { type: 'research', topic: 'status' }
  }

  if (lower.includes('audit')) {
    return { type: 'audit' }
  }

  if (lower.includes('synthesize') || lower.includes('synthesis')) {
    return { type: 'synthesize' }
  }

  return null
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: KycProductCommand): Promise<{ summary: string; details?: Record<string, unknown> }> {
  switch (command.type) {
    case 'research': {
      const { run } = await import('./commands/research.js')
      const result = await run({ topic: command.topic, phase: command.phase })
      return {
        summary: result.summary,
        details: 'workstreamStatus' in result
          ? {
              topic: (result as any).topic,
              tasksCreated: (result as any).tasksCreated?.length ?? 0,
              recommendations: (result as any).recommendations,
            }
          : {
              phases: (result as any).phases,
              overallProgress: (result as any).overallProgress,
              nextSteps: (result as any).nextSteps,
            },
      }
    }
    case 'audit': {
      const { run } = await import('./commands/audit.js')
      const result = await run()
      return {
        summary: result.summary,
        details: {
          capabilityAreas: result.capabilities.length,
          pppInsights: result.pppInsights.length,
          humanDataNeeded: result.humanDataNeeded.length,
          tasksCreated: result.tasksCreated.length,
        },
      }
    }
    case 'synthesize': {
      const { run } = await import('./commands/synthesize.js')
      const result = await run({ phase: command.phase })
      return {
        summary: result.summary,
        details: {
          currentPhase: result.currentPhase,
          phases: result.phases.map(p => ({ phase: p.phase, status: p.status, completionPct: p.completionPct })),
          moatValidation: result.moatValidation.map(m => ({ moat: m.moat, status: m.status })),
          pendingHumanTasks: result.pendingHumanTasks.length,
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
    .eq('target_agent', 'kyc-product-pm')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch tasks:', error.message)
    return { processed: 0, errors: 1 }
  }

  const pending = (tasks || []) as unknown as AgentTask[]
  if (pending.length === 0) {
    console.log('No pending tasks for kyc-product-pm.')
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
      .update({ status: 'picked-up', picked_up_by: 'kyc-product-pm' } as any)
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
      await logError('kyc-product-pm', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      })

      errors++
    }
  }

  return { processed, errors }
}
