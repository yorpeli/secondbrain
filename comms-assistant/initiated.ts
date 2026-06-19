// Outgoing ("initiated") flow: map a conversation-authored, Yonatan-approved email to a
// comms_predictions row (mode:'initiated', status:'sent') and record the approve-time signal
// to comms_feedback via comms_apply_feedback. predicted_reply = what the agent drafted;
// edited_reply = what Yonatan approved (only when it differs). NEVER embedded.
import type { PredictionRow } from './types.js'
import { assembleContext, type ThreadInput } from './retrieve.js'
import { buildCardPayload } from './card.js'
import { structuralDelta } from './delta.js'
import { insertPrediction } from './store.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

export interface InitiatedInput {
  recipient: { email: string; name?: string; slug?: string }
  subject: string
  draft: string
  approved: string
  trigger_text: string
  action_type?: string
  action_target?: string | null
  thread?: ThreadInput
  tier?: number | null
  verdict?: Record<string, unknown> | null
  confidence?: 'high' | 'med' | 'low' | null
  why?: string | null
  memory_brief?: unknown
  sensitive?: boolean
}

const CONF_SCORE: Record<string, number> = { high: 0.85, med: 0.6, low: 0.35 }
const EMPTY_BUNDLE = { thread: '', rules: [], participants: [], ownership: null, narrative: [], meta: {} }

export async function buildInitiatedRow(input: InitiatedInput): Promise<PredictionRow> {
  const now = new Date().toISOString()
  const actionType = input.action_type ?? 'reply'
  const target = input.action_target ?? input.recipient.slug ?? input.recipient.name ?? input.recipient.email
  let bundle: any = EMPTY_BUNDLE
  try { if (input.thread) bundle = await assembleContext(input.thread) } catch { /* sparse context */ }
  // Shape an `it`-like object for buildCardPayload (same contract as run.ts itemToRow).
  const it = {
    email: { subject: input.subject, from: 'Yonatan Orpeli', to: [input.recipient.email], date: now, channel: 'outlook' },
    thread: input.thread,
    suggestion: {
      action: { type: actionType, target },
      disposition: actionType,
      text: input.approved,
      why: input.why ?? null,
      confidence: input.confidence ?? null,
      memory_brief: input.memory_brief ?? null,
    },
    tier: input.tier ?? null,
    verdict: input.verdict ?? null,
  }
  return {
    mode: 'initiated',
    thread_id: null, message_id: null, internet_message_id: null, web_link: null,
    channel: 'email',
    as_of: now,
    trigger_text: input.trigger_text,
    disposition: actionType,
    action_type: actionType,
    action_target: target,
    needs_data: false,
    predicted_reply: input.draft,
    predicted_stance: actionType,
    confidence: (input.confidence ?? null) as any,
    confidence_score: input.confidence ? (CONF_SCORE[input.confidence] ?? null) : null,
    context_available: { draft_why: input.why ?? null } as any,
    actual_reply: null, delta: null, resolution: null, why: input.why ?? null,
    derived_rule_ids: [],
    sensitive: !!input.sensitive,
    tier: input.tier ?? null,
    verdict: input.verdict ?? null,
    card: buildCardPayload(it as any, bundle),
    status: 'sent',
    last_message_id: null,
    captured_at: now,
  }
}

export interface RecordResult { predictionId: string; signal: 'edit' | 'verbatim' }

export async function recordInitiated(input: InitiatedInput): Promise<RecordResult> {
  const row = await buildInitiatedRow(input)
  const predictionId = await insertPrediction(row)
  const sb = await db()
  const edited = input.approved !== input.draft
  const delta = structuralDelta(input.draft, input.approved)
  if (edited) {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predictionId, p_kind: 'edit',
      p_payload: { from: input.draft, to: input.approved, delta, mode: 'initiated' },
    })
    if (error) throw error
    return { predictionId, signal: 'edit' }
  }
  const { error } = await sb.rpc('comms_apply_feedback', {
    p_prediction_id: predictionId, p_kind: 'note',
    p_payload: { outcome: 'approved_verbatim', delta, mode: 'initiated' },
  })
  if (error) throw error
  return { predictionId, signal: 'verbatim' }
}
