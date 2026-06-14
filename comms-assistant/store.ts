// DB layer for the comms-learning backtest. comms_predictions (per-item) and
// comms_rules (the living rulebook). NEVER embedded. Lazy Supabase import.
import type { PredictionRow, RuleRow, Resolution } from './types.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

const PRED_COLS =
  'id, mode, thread_id, message_id, internet_message_id, web_link, channel, as_of, trigger_text, disposition, needs_data, predicted_reply, predicted_stance, confidence, confidence_score, context_available, actual_reply, delta, resolution, why, derived_rule_ids, sensitive, created_at'

export async function insertPrediction(row: PredictionRow): Promise<string> {
  const { data, error } = await (await db())
    .from('comms_predictions' as any)
    .insert(row as any)
    .select('id')
    .single()
  if (error) throw error
  return (data as any).id as string
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
