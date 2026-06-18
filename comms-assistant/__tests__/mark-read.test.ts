import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'

const sb = getSupabase() as any
let outlookId: string
let teamsId: string
let bridgeId: string

const MSG = 'MARKREAD-TEST-MSG-1'
const MSG_BRIDGE = 'MARKREAD-TEST-MSG-BRIDGE'

describe('comms_mark_read', () => {
  before(async () => {
    const ins = async (channel: string, imid: string | null) => {
      const { data, error } = await sb.from('comms_predictions').insert({
        mode: 'reply', channel, as_of: new Date().toISOString(),
        context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
        internet_message_id: imid,
        card: { email: { subject: 'Weekly vendor digest' } },
      }).select('id').single()
      if (error) throw error
      return data.id as string
    }
    outlookId = await ins('outlook', MSG)
    teamsId = await ins('teams', null)
    bridgeId = await ins('outlook', MSG_BRIDGE)
  })
  after(async () => {
    await sb.from('agent_tasks').delete().eq('target_agent', 'outlook-sync').ilike('description', `%${MSG}%`)
    await sb.from('agent_tasks').delete().eq('target_agent', 'outlook-sync').ilike('description', `%${MSG_BRIDGE}%`)
    await sb.from('comms_predictions').delete().in('id', [outlookId, teamsId, bridgeId])
  })

  it('outlook card: queues a mark-read task, dismisses, logs feedback', async () => {
    const { data, error } = await sb.rpc('comms_mark_read', { p_prediction_id: outlookId })
    assert.equal(error, null)
    assert.equal(data.queued, true)

    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', outlookId).single()
    assert.equal(pred.status, 'dismissed')

    const { data: tasks } = await sb.from('agent_tasks')
      .select('target_agent,status,description,tags').eq('target_agent', 'outlook-sync').ilike('description', `%${MSG}%`)
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].status, 'pending')
    assert.ok(tasks[0].description.includes('"type":"mark-read"') || tasks[0].description.includes('"type": "mark-read"'))
    assert.ok(tasks[0].tags.includes('mark-read'))

    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', outlookId).eq('kind', 'status')
    assert.equal(fb.length, 1)
    assert.equal(fb[0].payload.via, 'mark-read')
  })

  it('teams card: dismisses but queues no task', async () => {
    const { data, error } = await sb.rpc('comms_mark_read', { p_prediction_id: teamsId })
    assert.equal(error, null)
    assert.equal(data.queued, false)
    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', teamsId).single()
    assert.equal(pred.status, 'dismissed')
  })

  it('outlook card with p_queue_sync=false (bridge handled it): dismisses, no task', async () => {
    // The bridge already flipped the read flag locally → caller suppresses the
    // fallback queue. Same outlook card + key, but no agent_tasks row this time.
    const { data, error } = await sb.rpc('comms_mark_read', {
      p_prediction_id: bridgeId, p_queue_sync: false,
    })
    assert.equal(error, null)
    assert.equal(data.queued, false)

    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', bridgeId).single()
    assert.equal(pred.status, 'dismissed')

    const { data: tasks } = await sb.from('agent_tasks')
      .select('id').eq('target_agent', 'outlook-sync').ilike('description', `%${MSG_BRIDGE}%`)
    assert.equal(tasks.length, 0)

    const { data: fb } = await sb.from('comms_feedback').select('payload').eq('prediction_id', bridgeId).eq('kind', 'status')
    assert.equal(fb.length, 1)
    assert.equal(fb[0].payload.bridge, true)
  })
})
