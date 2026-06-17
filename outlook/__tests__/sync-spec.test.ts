import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractSpecs } from '../sync-spec.js'

const DOC = `
intro text
<!-- spec:outlook_agent_spec -->
\`\`\`json
{ "name": "agent", "version": "1.2" }
\`\`\`
more prose
<!-- spec:outlook_sync_spec -->
\`\`\`json
{ "name": "sync", "version": "0.1" }
\`\`\`
trailing
`

describe('extractSpecs', () => {
  it('returns every spec block keyed by its marker', () => {
    const out = extractSpecs(DOC)
    assert.equal(out.length, 2)
    assert.deepEqual(out.map((s) => s.key), ['outlook_agent_spec', 'outlook_sync_spec'])
    assert.equal((out[1].spec as any).version, '0.1')
  })

  it('throws when no markers are present', () => {
    assert.throws(() => extractSpecs('no markers here'), /No spec markers/)
  })
})
