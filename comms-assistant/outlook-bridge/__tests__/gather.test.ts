import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGatherRecords } from '../gather-parse.js'

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
