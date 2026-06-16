import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { upsertPredictions } from '../store.js'

const sb = getSupabase() as any
const CONV = 'GUARD-TEST-CONV-1'
const base = {
  mode: 'reply' as const, thread_id: CONV, message_id: null, internet_message_id: null, web_link: null,
  channel: 'email', as_of: new Date().toISOString(), trigger_text: null,
  disposition: 'reply', action_type: 'reply', action_target: 'x', needs_data: false,
  predicted_reply: 'first draft', predicted_stance: 'reply', confidence: 'med' as const,
  confidence_score: 0.6, context_available: {} as any, actual_reply: null, delta: null,
  resolution: null, why: null, derived_rule_ids: [], sensitive: false,
}

describe('upsertPredictions clobber guard', () => {
  after(async () => { await sb.from('comms_predictions').delete().eq('thread_id', CONV) })

  it('does NOT overwrite an open user_touched row', async () => {
    await upsertPredictions([{ ...base }])
    await sb.from('comms_predictions').update({ user_touched: true, edited_reply: 'MY EDIT' }).eq('thread_id', CONV)
    const res = await upsertPredictions([{ ...base, predicted_reply: 'SECOND draft' }])
    const { data } = await sb.from('comms_predictions').select('predicted_reply,edited_reply').eq('thread_id', CONV).single()
    assert.equal(data.edited_reply, 'MY EDIT')          // edit preserved
    assert.equal(data.predicted_reply, 'first draft')    // NOT overwritten
    assert.equal(res.updated + res.inserted >= 0, true)  // call succeeds, no throw
  })
})
