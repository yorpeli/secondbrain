// Skip/refresh decision for the unread sweep — runs BEFORE any MSFT read or fan-out.
// Reconciled rows (resolution set) are never returned here; the caller queries open rows only.
import type { SweepAction } from './types.js'

export interface ThreadSweepState {
  exists: boolean
  userTouched?: boolean
  lastMessageId?: string | null
}

export function decideSweepAction(state: ThreadSweepState, latestMessageId: string | null): SweepAction {
  if (!state.exists) return 'analyze'
  if (state.userTouched) return 'skip'            // in-app edits win — never regenerate
  if (!latestMessageId) return 'skip'             // can't prove the thread advanced → don't churn
  if (latestMessageId === state.lastMessageId) return 'skip'
  return 'refresh'                                // new inbound since capture
}

// Thin DB wrapper: look up the open row for a thread and decide.
export async function classifyThreadForSweep(
  keys: { conversationId?: string | null; internetMessageId?: string | null; latestMessageId: string | null },
): Promise<SweepAction> {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  const sb = getSupabase() as any
  const keyCol = keys.conversationId ? 'thread_id' : keys.internetMessageId ? 'internet_message_id' : null
  const keyVal = keys.conversationId ?? keys.internetMessageId ?? null
  if (!keyCol || !keyVal) return 'analyze'
  const { data } = await sb.from('comms_predictions')
    .select('id,user_touched,last_message_id').eq(keyCol, keyVal).is('resolution', null).limit(1)
  const row = data?.[0]
  return decideSweepAction(
    { exists: !!row, userTouched: !!row?.user_touched, lastMessageId: row?.last_message_id ?? null },
    keys.latestMessageId,
  )
}
