/**
 * Q-Plan PM — Update Command
 *
 * Update deliverable or plan item status.
 */

import type { UpdateResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

const VALID_DELIVERABLE_STATUSES = ['planned', 'in-progress', 'done', 'at-risk', 'cut', 'blocked']
const VALID_ITEM_STATUSES = ['planned', 'in-progress', 'done', 'at-risk', 'cut']

export async function run(opts: {
  deliverableId?: string
  planItemId?: string
  status: string
  notes?: string
}): Promise<UpdateResult> {
  const supabase = await getSupabase()
  const updated: UpdateResult['updated'] = []

  if (opts.deliverableId) {
    if (!VALID_DELIVERABLE_STATUSES.includes(opts.status)) {
      throw new Error(`Invalid deliverable status "${opts.status}". Valid: ${VALID_DELIVERABLE_STATUSES.join(', ')}`)
    }

    // Get current state
    const { data: current } = await supabase
      .from('quarterly_plan_deliverables' as any)
      .select('id, title, status')
      .eq('id', opts.deliverableId)
      .single()

    if (!current) throw new Error(`Deliverable ${opts.deliverableId} not found.`)
    const row = current as unknown as { id: string; title: string; status: string }

    const updateFields: Record<string, unknown> = {
      status: opts.status,
      updated_at: new Date().toISOString(),
    }
    if (opts.status === 'done') {
      updateFields.completed_date = new Date().toISOString().split('T')[0]
    }
    if (opts.notes) {
      updateFields.actual_outcome = opts.notes
    }

    const { error } = await supabase
      .from('quarterly_plan_deliverables' as any)
      .update(updateFields as any)
      .eq('id', opts.deliverableId)

    if (error) throw new Error(`Update failed: ${error.message}`)

    updated.push({
      id: row.id,
      title: row.title,
      previousStatus: row.status,
      newStatus: opts.status,
    })
  }

  if (opts.planItemId) {
    if (!VALID_ITEM_STATUSES.includes(opts.status)) {
      throw new Error(`Invalid item status "${opts.status}". Valid: ${VALID_ITEM_STATUSES.join(', ')}`)
    }

    const { data: current } = await supabase
      .from('quarterly_plan_items' as any)
      .select('id, title, status')
      .eq('id', opts.planItemId)
      .single()

    if (!current) throw new Error(`Plan item ${opts.planItemId} not found.`)
    const row = current as unknown as { id: string; title: string; status: string }

    const { error } = await supabase
      .from('quarterly_plan_items' as any)
      .update({ status: opts.status, updated_at: new Date().toISOString() } as any)
      .eq('id', opts.planItemId)

    if (error) throw new Error(`Update failed: ${error.message}`)

    updated.push({
      id: row.id,
      title: row.title,
      previousStatus: row.status,
      newStatus: opts.status,
    })
  }

  const summary = updated.map(u => `${u.title}: ${u.previousStatus} → ${u.newStatus}`).join('\n')

  // Log status changes
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'q-plan-pm',
    category: 'observation',
    summary: `Updated ${updated.length} item(s): ${summary}`,
    tags: ['q-plan-pm', 'update'],
  })

  return { summary: `Updated:\n${summary}`, updated }
}
