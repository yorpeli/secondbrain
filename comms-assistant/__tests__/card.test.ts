import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCardPayload } from '../card.js'

const bundle = { thread: 'prior msgs', rules: [{ statement: 'be terse' }], participants: [{ name: 'Elad' }], ownership: { x: 1 }, narrative: ['note'], meta: { tier: 2 } } as any

describe('buildCardPayload', () => {
  it('packs email meta, suggestion extras, and serialized context', () => {
    const item = {
      email: { subject: 'Re: KYC', from: 'elad@p.com', date: '2026-06-15', to: ['y@p.com'], excerpt: 'hi', webLink: 'http://x', thread_summary: 'sum' },
      thread: { subject: 'Re: KYC', participants: [], bodyToDate: 'body' },
      suggestion: { memory_brief: { summary: 's', points: ['p'] }, text_alt: 'EN', lang: 'he', lang_alt: 'en', action: { secondary: 'fyi' } },
    }
    const card = buildCardPayload(item, bundle)
    assert.equal(card.email.subject, 'Re: KYC')
    assert.equal(card.email.webLink, 'http://x')
    assert.deepEqual(card.suggestion_extras.memory_brief, { summary: 's', points: ['p'] })
    assert.equal(card.suggestion_extras.text_alt, 'EN')
    assert.equal(card.context.rules[0].statement, 'be terse')
    assert.equal(card.context.participants[0].name, 'Elad')
  })

  it('tolerates a sparse item (no suggestion extras)', () => {
    const card = buildCardPayload({ email: { subject: 'x' }, thread: {} }, bundle)
    assert.equal(card.email.subject, 'x')
    assert.equal(card.suggestion_extras.memory_brief ?? null, null)
  })
})
