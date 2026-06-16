// Flow 2 — pull undistilled in-app feedback joined to its prediction, so the Claude session can
// cluster patterns (scope + suggestion-vs-yours delta) and propose comms_rules. On-demand,
// Claude-in-the-loop with approval. Stamps distilled_at so the next run sees only new signal.
async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

export interface DistillItem {
  feedback_id: string
  kind: string
  payload: Record<string, unknown>
  created_at: string
  prediction: {
    id: string
    action_type: string | null
    action_target: string | null
    predicted_reply: string | null
    edited_reply: string | null
    overridden_action: unknown | null
    scope: { participants?: unknown[]; rules?: unknown[] } | null
  }
}

export async function loadUndistilledFeedback(): Promise<DistillItem[]> {
  const sb = await db()
  const { data, error } = await sb
    .from('comms_feedback')
    .select('id,kind,payload,created_at,prediction_id,comms_predictions(id,action_type,action_target,predicted_reply,edited_reply,overridden_action,card)')
    .is('distilled_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    feedback_id: r.id, kind: r.kind, payload: r.payload, created_at: r.created_at,
    prediction: {
      id: r.comms_predictions?.id,
      action_type: r.comms_predictions?.action_type ?? null,
      action_target: r.comms_predictions?.action_target ?? null,
      predicted_reply: r.comms_predictions?.predicted_reply ?? null,
      edited_reply: r.comms_predictions?.edited_reply ?? null,
      overridden_action: r.comms_predictions?.overridden_action ?? null,
      scope: r.comms_predictions?.card?.context
        ? { participants: r.comms_predictions.card.context.participants, rules: r.comms_predictions.card.context.rules }
        : null,
    },
  }))
}

export async function markDistilled(feedbackIds: string[]): Promise<number> {
  if (!feedbackIds.length) return 0
  const sb = await db()
  const { error, count } = await sb
    .from('comms_feedback')
    .update({ distilled_at: new Date().toISOString() }, { count: 'exact' })
    .in('id', feedbackIds).is('distilled_at', null)
  if (error) throw error
  return count ?? 0
}
