import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { loadUndistilledFeedback, markDistilled } from '../distill.js'

const sb = getSupabase() as any
const CONV = 'DISTILL-TEST-CONV-1'
let predId = ''; let fbId = ''

describe('distill load + mark', () => {
  after(async () => { await sb.from('comms_predictions').delete().eq('thread_id', CONV) })

  it('loads undistilled feedback with prediction scope, then marks it', async () => {
    const { data: p } = await sb.from('comms_predictions').insert({
      mode: 'reply', channel: 'email', as_of: new Date().toISOString(), thread_id: CONV,
      context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
      action_type: 'reply', action_target: 'Elad', predicted_reply: 'orig',
      card: { context: { participants: [{ name: 'Elad' }], rules: [] } },
    }).select('id').single()
    predId = p.id
    const { data: f } = await sb.from('comms_feedback').insert({
      prediction_id: predId, kind: 'edit', payload: { from: 'orig', to: 'edited' },
    }).select('id').single()
    fbId = f.id

    const items = await loadUndistilledFeedback()
    const mine = items.find((i) => i.feedback_id === fbId)
    assert.ok(mine, 'loaded our feedback')
    assert.equal(mine!.prediction.action_target, 'Elad')
    assert.equal((mine!.prediction.scope as any).participants[0].name, 'Elad')

    const n = await markDistilled([fbId])
    assert.equal(n, 1)
    const again = await loadUndistilledFeedback()
    assert.equal(again.find((i) => i.feedback_id === fbId), undefined)  // no longer undistilled
    assert.equal(await markDistilled([fbId]), 0)                         // idempotent
  })
})
