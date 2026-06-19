import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { buildInitiatedRow, recordInitiated, type InitiatedInput } from '../initiated.js'

const base: InitiatedInput = {
  recipient: { email: 'elad@payoneer.com', name: 'Elad Schnarch', slug: 'elad-schnarch' },
  subject: 'India licensing timeline',
  draft: 'Hi Elad —\n\nWhat is the realistic date?',
  approved: 'Hi Elad —\n\nWhat is the realistic date?',
  trigger_text: 'We discussed the India licensing slip and need Elad to commit a date.',
  confidence: 'med',
  why: 'Probe the mechanism, terse.',
}

describe('buildInitiatedRow (pure, no thread → no DB)', () => {
  it('produces an initiated/sent row carrying the draft + trigger', async () => {
    const row = await buildInitiatedRow(base)
    assert.equal(row.mode, 'initiated')
    assert.equal(row.status, 'sent')
    assert.equal(row.channel, 'email')
    assert.equal(row.predicted_reply, base.draft)
    assert.equal(row.trigger_text, base.trigger_text)
    assert.equal(row.action_type, 'reply')
    assert.equal(row.action_target, 'elad-schnarch')
    assert.equal(row.thread_id, null)
    assert.equal(row.confidence, 'med')
    assert.ok(row.card)
  })
  it('defaults action_target to the email when no slug/name', async () => {
    const row = await buildInitiatedRow({ ...base, recipient: { email: 'x@y.com' } })
    assert.equal(row.action_target, 'x@y.com')
  })
})

describe('recordInitiated (DB)', () => {
  const sb = getSupabase() as any
  const ids: string[] = []
  after(async () => {
    for (const id of ids) {
      await sb.from('comms_feedback').delete().eq('prediction_id', id)
      await sb.from('comms_predictions').delete().eq('id', id)
    }
  })

  it('verbatim approval → note feedback, no edited_reply', async () => {
    const r = await recordInitiated(base)
    ids.push(r.predictionId)
    assert.equal(r.signal, 'verbatim')
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', r.predictionId)
    assert.equal(fb.length, 1)
    assert.equal(fb[0].kind, 'note')
    assert.equal(fb[0].payload.outcome, 'approved_verbatim')
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,mode,status').eq('id', r.predictionId).single()
    assert.equal(pred.mode, 'initiated')
    assert.equal(pred.status, 'sent')
    assert.equal(pred.edited_reply, null)
  })

  it('edited approval → edit feedback with delta + edited_reply set', async () => {
    const r = await recordInitiated({ ...base, approved: 'Hi Elad — can you commit a date this week?' })
    ids.push(r.predictionId)
    assert.equal(r.signal, 'edit')
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', r.predictionId)
    assert.equal(fb[0].kind, 'edit')
    assert.equal(fb[0].payload.to, 'Hi Elad — can you commit a date this week?')
    assert.ok(fb[0].payload.delta) // structuralDelta present
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,user_touched').eq('id', r.predictionId).single()
    assert.equal(pred.edited_reply, 'Hi Elad — can you commit a date this week?')
    assert.equal(pred.user_touched, true)
  })
})
