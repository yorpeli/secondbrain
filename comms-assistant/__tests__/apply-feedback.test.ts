import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'

const sb = getSupabase() as any
let predId: string

describe('comms_apply_feedback', () => {
  before(async () => {
    const { data, error } = await sb.from('comms_predictions').insert({
      mode: 'reply', channel: 'email', as_of: new Date().toISOString(),
      context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
      predicted_reply: 'orig draft', action_type: 'reply', action_target: 'sender',
    }).select('id').single()
    if (error) throw error
    predId = data.id
  })
  after(async () => { await sb.from('comms_predictions').delete().eq('id', predId) })

  it('edit sets edited_reply + user_touched + logs event', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'edit', p_payload: { from: 'orig draft', to: 'my edit' },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,user_touched').eq('id', predId).single()
    assert.equal(pred.edited_reply, 'my edit')
    assert.equal(pred.user_touched, true)
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', predId).eq('kind', 'edit')
    assert.equal(fb.length, 1)
    assert.equal(fb[0].payload.to, 'my edit')
  })

  it('status=dismissed sets status', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'status', p_payload: { to: 'dismissed' },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', predId).single()
    assert.equal(pred.status, 'dismissed')
  })

  it('action_override sets accepted=false + overridden_action', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'action_override',
      p_payload: { accepted: false, to: { type: 'route', target: 'ido-seter' } },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('action_accepted,overridden_action').eq('id', predId).single()
    assert.equal(pred.action_accepted, false)
    assert.equal(pred.overridden_action.type, 'route')
  })
})
