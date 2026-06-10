import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assembleDashboard } from '../dashboard-data.js'

describe('dashboard injection contract', () => {
  it('assembleDashboard output is JSON-serializable and has the zones the template reads', () => {
    const d = assembleDashboard({ focusMd: '## Active Initiatives\n\n- **X** (P0) — active · owner: a', capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    const json = JSON.stringify(d)
    assert.ok(json.length > 0)
    for (const k of ['meta', 'needsAttention', 'signals', 'meetings', 'tasks', 'initiatives', 'focus', 'people', 'endOfDay']) {
      assert.ok(k in d, `missing zone: ${k}`)
    }
    assert.ok('partOfDay' in d.meta && 'user' in d.meta)
  })

  it('token substitution removes the placeholder and survives $-patterns and </script>', () => {
    const d = assembleDashboard({ focusMd: '## Current Focus\n\n{"top_priorities":["watch $& and </script> edge"],"watching":[],"waiting_on":[]}', capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    const json = JSON.stringify(d).replace(/<\/script>/gi, '<\\/script>')
    const out = 'before const DATA = {{DATA_JSON}}; after'.replace('{{DATA_JSON}}', () => json)
    assert.ok(!out.includes('{{DATA_JSON}}'))
    assert.ok(out.includes('watch $& and'))
    assert.ok(!out.includes('</script>'))
  })
})
