import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { contactBackfillDecision, resolveRecipient, upsertExternalContact } from '../contacts.js'

describe('contactBackfillDecision (pure)', () => {
  it('fills when no existing email', () => {
    assert.equal(contactBackfillDecision(null, 'a@b.com'), 'fill')
    assert.equal(contactBackfillDecision('', 'a@b.com'), 'fill')
    assert.equal(contactBackfillDecision(undefined, 'a@b.com'), 'fill')
  })
  it('noop when identical (case/space-insensitive)', () => {
    assert.equal(contactBackfillDecision('a@b.com', 'a@b.com'), 'noop')
    assert.equal(contactBackfillDecision('A@B.com ', 'a@b.com'), 'noop')
  })
  it('confirms when different', () => {
    assert.equal(contactBackfillDecision('old@b.com', 'new@b.com'), 'confirm')
  })
})

describe('comms_contacts round-trip (DB)', () => {
  const sb = getSupabase() as any
  const testName = 'ZZ Plan Test Vendor'
  after(async () => {
    // restore comms_contacts to whatever it was minus our test entry
    const { data } = await sb.from('context_store').select('content').eq('key', 'comms_contacts').maybeSingle()
    const list = (data?.content?.contacts ?? []).filter((c: any) => c.name !== testName)
    await sb.from('context_store').update({ content: { contacts: list } }).eq('key', 'comms_contacts')
  })

  it('upsert then resolve returns the external contact', async () => {
    await upsertExternalContact({ name: testName, email: 'vendor@example.com' })
    const r = await resolveRecipient(testName)
    assert.equal(r.source, 'contacts')
    assert.equal(r.email, 'vendor@example.com')
  })

  it('resolves a known person from people by name', async () => {
    const r = await resolveRecipient('Yonatan')
    assert.equal(r.source, 'people')
    assert.equal(r.slug, 'yonatan-orpeli')
  })
})
