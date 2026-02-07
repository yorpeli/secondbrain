/**
 * Shared Task Utilities
 *
 * Consolidates the task pickup/claim/complete pattern used by agent task runners.
 * Uses lazy Supabase import so scripts that don't need DB access won't fail.
 */

import type { Json } from './database.types.js'

// Lazy-loaded Supabase
async function getSupabase() {
  const { getSupabase: gs } = await import('./supabase.js')
  return gs()
}

// ─── Types ───────────────────────────────────────────────────

export interface AgentTask {
  id: string
  title: string
  description: string | null
  status: string
  priority: string | null
  target_agent: string | null
  created_by: string
  due_date: string | null
  parent_task_id: string | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateTaskInput {
  title: string
  description?: string
  targetAgent?: string
  priority?: 'low' | 'normal' | 'high'
  createdBy: string
  dueDate?: string
  parentTaskId?: string
  tags?: string[]
  relatedEntityType?: string
  relatedEntityId?: string
}

// ─── Functions ───────────────────────────────────────────────

/**
 * Create a new agent task. Returns the task ID.
 */
export async function createTask(input: CreateTaskInput): Promise<string | null> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .insert({
      title: input.title,
      description: input.description ?? null,
      target_agent: input.targetAgent ?? null,
      priority: input.priority ?? 'normal',
      created_by: input.createdBy,
      due_date: input.dueDate ?? null,
      parent_task_id: input.parentTaskId ?? null,
      tags: input.tags ?? [],
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      status: 'pending',
    } as any)
    .select('id')
    .single()

  if (error) {
    console.error('[tasks] Failed to create task:', error.message)
    return null
  }

  return (data as any).id
}

/**
 * Claim a pending task for an agent. Returns true if successful.
 */
export async function claimTask(taskId: string, agentSlug: string): Promise<boolean> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('agent_tasks' as any)
    .update({ status: 'picked-up', picked_up_by: agentSlug } as any)
    .eq('id', taskId)
    .eq('status', 'pending')

  if (error) {
    console.error('[tasks] Failed to claim task:', error.message)
    return false
  }

  return true
}

/**
 * Mark a task as completed with a summary and optional structured details.
 */
export async function completeTask(
  taskId: string,
  summary: string,
  details?: Record<string, unknown>
): Promise<boolean> {
  const supabase = await getSupabase()

  const update: Record<string, unknown> = {
    status: 'done',
    result_summary: summary,
    completed_at: new Date().toISOString(),
  }
  if (details) {
    update.result_details = details as Json
  }

  const { error } = await supabase
    .from('agent_tasks' as any)
    .update(update as any)
    .eq('id', taskId)

  if (error) {
    console.error('[tasks] Failed to complete task:', error.message)
    return false
  }

  return true
}

/**
 * Mark a task as failed with an error summary.
 */
export async function failTask(taskId: string, errorSummary: string): Promise<boolean> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('agent_tasks' as any)
    .update({
      status: 'failed',
      result_summary: `Error: ${errorSummary}`,
    } as any)
    .eq('id', taskId)

  if (error) {
    console.error('[tasks] Failed to mark task as failed:', error.message)
    return false
  }

  return true
}

/**
 * Get pending tasks for an agent (or unassigned tasks).
 */
export async function getPendingTasks(agentSlug: string): Promise<AgentTask[]> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, status, priority, target_agent, created_by, due_date, parent_task_id, tags, created_at, updated_at')
    .or(`target_agent.eq.${agentSlug},target_agent.is.null`)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[tasks] Failed to fetch pending tasks:', error.message)
    return []
  }

  return (data || []) as unknown as AgentTask[]
}
