// DB layer for the comms-learning backtest. comms_predictions (per-item) and
// comms_rules (the living rulebook). NEVER embedded. Lazy Supabase import.
import type { PredictionRow, RuleRow, Resolution } from './types.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

const PRED_COLS =
  'id, mode, thread_id, message_id, internet_message_id, web_link, channel, as_of, trigger_text, disposition, action_type, action_target, needs_data, predicted_reply, predicted_stance, confidence, confidence_score, context_available, actual_reply, delta, resolution, why, derived_rule_ids, sensitive, tier, verdict, created_at'

export async function insertPrediction(row: PredictionRow): Promise<string> {
  const { data, error } = await (await db())
    .from('comms_predictions' as any)
    .insert(row as any)
    .select('id')
    .single()
  if (error) throw error
  return (data as any).id as string
}

// Persist a whole sweep's predictions. Idempotent per thread: if an UNRECONCILED row already
// exists for the same thread (thread_id, else internet_message_id, else web_link), update it in
// place rather than duplicating — so a re-run of the same sweep refreshes instead of piling up.
// Reconciled rows (resolution set) are never touched — they're historical record.
export async function upsertPredictions(rows: PredictionRow[]): Promise<{ inserted: number; updated: number }> {
  const sb = await db()
  let inserted = 0, updated = 0
  for (const row of rows) {
    const keyCol = row.thread_id ? 'thread_id' : row.internet_message_id ? 'internet_message_id' : row.web_link ? 'web_link' : null
    const keyVal = row.thread_id ?? row.internet_message_id ?? row.web_link ?? null
    let existingId: string | null = null
    if (keyCol && keyVal) {
      const { data } = await (sb as any)
        .from('comms_predictions').select('id').eq(keyCol, keyVal).is('resolution', null).limit(1)
      existingId = (data?.[0] as any)?.id ?? null
    }
    if (existingId) {
      const { error } = await (sb as any).from('comms_predictions').update(row as any).eq('id', existingId)
      if (error) throw error
      updated++
    } else {
      const { error } = await (sb as any).from('comms_predictions').insert(row as any)
      if (error) throw error
      inserted++
    }
  }
  return { inserted, updated }
}

export async function listPredictions(opts: { unreconciledOnly?: boolean } = {}): Promise<PredictionRow[]> {
  let q = (await db()).from('comms_predictions' as any).select(PRED_COLS)
  if (opts.unreconciledOnly) q = q.is('resolution', null)
  const { data, error } = await q
  if (error) throw error
  return (data as unknown as PredictionRow[]) ?? []
}

export interface ReconcilePatch {
  actual_reply: string | null
  delta: Record<string, unknown> | null
  resolution: Resolution
  why?: string | null
}

export async function reconcilePrediction(id: string, patch: ReconcilePatch): Promise<void> {
  const { error } = await (await db())
    .from('comms_predictions' as any)
    .update({ ...patch } as any)
    .eq('id', id)
  if (error) throw error
}

const RULE_COLS =
  'id, scope, type, statement, confidence, support, consistency, diversity, data_dependency, status, supersedes, pinned, created_at, updated_at'

export async function listRules(): Promise<RuleRow[]> {
  const { data, error } = await (await db())
    .from('comms_rules' as any)
    .select(RULE_COLS)
    .order('confidence', { ascending: false })
  if (error) throw error
  return (data as unknown as RuleRow[]) ?? []
}

export async function insertRule(row: RuleRow): Promise<string> {
  const { data, error } = await (await db())
    .from('comms_rules' as any)
    .insert({ ...row, updated_at: new Date().toISOString() } as any)
    .select('id')
    .single()
  if (error) throw error
  return (data as any).id as string
}

// Supersede: mark the old rule superseded, insert the new one linked via supersedes.
export async function supersedeRule(oldId: string, next: RuleRow): Promise<string> {
  const sb = await db()
  const { error: e1 } = await sb
    .from('comms_rules' as any)
    .update({ status: 'superseded', updated_at: new Date().toISOString() } as any)
    .eq('id', oldId)
  if (e1) throw e1
  return insertRule({ ...next, supersedes: oldId })
}

export async function pinRule(id: string): Promise<void> {
  const { error } = await (await db())
    .from('comms_rules' as any)
    .update({ pinned: true, status: 'active', confidence: 1, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
  if (error) throw error
}
