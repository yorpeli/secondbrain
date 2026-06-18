import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGatherRecords } from '../gather-parse.js'
import { normalizeSubject, threadKey, collapseThreads } from '../gather-collapse.js'
import type { RawGatherRecord } from '../gather-types.js'

const US = '\x1f', RS = '\x1e'
function rec(fields: string[]) { return fields.join(US) }

test('parseGatherRecords: parses fields and comma-splits recipients', () => {
  const raw = [
    rec(['101', 'Hello', 'a@x.com', 'b@x.com,c@x.com', '2026-06-18T11:26:27', '<id1@x>', 'AQHabc', 'Body one']),
    rec(['102', 'Re: Hello', 'd@x.com', 'b@x.com', '2026-06-18T12:00:00', '<id2@x>', 'AQHabc', 'Body two']),
  ].join(RS)
  const out = parseGatherRecords(raw)
  assert.equal(out.length, 2)
  assert.equal(out[0].outlookId, '101')
  assert.deepEqual(out[0].to, ['b@x.com', 'c@x.com'])
  assert.equal(out[1].internetMessageId, '<id2@x>')
  assert.equal(out[1].threadIndex, 'AQHabc')
})

test('parseGatherRecords: empty input → []', () => {
  assert.deepEqual(parseGatherRecords(''), [])
  assert.deepEqual(parseGatherRecords('\x1e\x1e'), [])
})

function r(p: Partial<RawGatherRecord>): RawGatherRecord {
  return { outlookId: '1', subject: 's', from: 'a@x.com', to: [], dateIso: '2026-06-01T00:00:00', internetMessageId: '<i>', threadIndex: '', body: 'x', ...p }
}

test('normalizeSubject strips Re/Fwd prefixes, repeated, case-insensitive', () => {
  assert.equal(normalizeSubject('RE: Re: Fwd: Hello'), 'Hello')
  assert.equal(normalizeSubject('Hello'), 'Hello')
})

test('threadKey prefers Thread-Index, falls back to normalized subject', () => {
  assert.equal(threadKey(r({ threadIndex: 'AQ1', subject: 'Re: x' })), 'AQ1')
  assert.equal(threadKey(r({ threadIndex: '', subject: 'Re: x' })), 'x')
})

test('collapseThreads keeps the latest message per thread', () => {
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-09T17:00:00', body: 'old' }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-17T16:00:00', body: 'newest with full history here, well over two hundred characters '.padEnd(250, '.') }),
    r({ outlookId: '3', threadIndex: 'OTHER', dateIso: '2026-06-15T00:00:00', body: 'distinct' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 2)
  const tThread = out.find((x) => x.threadIndex === 'T')!
  assert.equal(tThread.outlookId, '2')
})

test('collapseThreads short-body guard appends a longer earlier body', () => {
  const long = 'this is the substantive earlier message '.padEnd(250, '.')
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-01T00:00:00', body: long }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-02T00:00:00', body: 'Thanks!' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 1)
  assert.equal(out[0].outlookId, '2')
  assert.ok(out[0].body.includes('Thanks!'))
  assert.ok(out[0].body.includes('earlier in thread'))
  assert.ok(out[0].body.includes('substantive earlier message'))
})
