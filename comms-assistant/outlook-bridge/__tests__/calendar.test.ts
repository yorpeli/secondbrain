import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBusyArgs, parseBusyOutput } from '../calendar.js'

test('buildBusyArgs emits busy mode + day components', () => {
  assert.deepEqual(
    buildBusyArgs('/p/calendar.applescript', '2026-06-16', '2026-06-20'),
    ['/p/calendar.applescript', 'busy', '2026', '6', '16', '2026', '6', '20'],
  )
})

test('buildBusyArgs rejects malformed day strings', () => {
  assert.throws(() => buildBusyArgs('/p/calendar.applescript', '2026/06/16', '2026-06-20'))
})

test('parseBusyOutput parses pipe-delimited lines, ignoring blanks', () => {
  const out = '2026-06-17T10:00|2026-06-17T10:30\n2026-06-17T14:00|2026-06-17T15:00\n\n'
  assert.deepEqual(parseBusyOutput(out), [
    { start: '2026-06-17T10:00', end: '2026-06-17T10:30' },
    { start: '2026-06-17T14:00', end: '2026-06-17T15:00' },
  ])
})
