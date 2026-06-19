import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateMeetingSpec, buildMeetingArgs, buildBusyArgs, parseBusyOutput,
} from '../calendar.js'

test('validateMeetingSpec rejects missing fields', () => {
  assert.equal(validateMeetingSpec(null).ok, false)
  assert.equal(validateMeetingSpec({ subject: '', body: 'b', attendees: ['a@b.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: [], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
})

test('validateMeetingSpec rejects malformed datetimes', () => {
  const r = validateMeetingSpec({ subject: 's', body: 'b', attendees: ['a@b.com'], start: 'June 17', end: '2026-06-17T10:30' })
  assert.equal(r.ok, false)
})

test('validateMeetingSpec accepts a well-formed spec', () => {
  const r = validateMeetingSpec({ subject: '1:1 Elad', body: 'agenda', attendees: ['elad@x.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:30', location: 'Zoom' })
  assert.equal(r.ok, true)
})

test('buildMeetingArgs splits datetimes into numeric components, HTML body, csv attendees', () => {
  const args = buildMeetingArgs('/p/calendar.applescript', {
    subject: '1:1', body: 'line1\nline2', attendees: ['a@b.com', 'c@d.com'],
    start: '2026-06-17T10:00', end: '2026-06-17T10:30', location: 'Zoom',
  })
  assert.deepEqual(args, [
    '/p/calendar.applescript', 'meeting', '1:1', 'line1<br>line2', 'a@b.com,c@d.com',
    '2026', '6', '17', '10', '0', '2026', '6', '17', '10', '30', 'Zoom',
  ])
})

test('buildBusyArgs emits day components', () => {
  assert.deepEqual(
    buildBusyArgs('/p/calendar.applescript', '2026-06-16', '2026-06-20'),
    ['/p/calendar.applescript', 'busy', '2026', '6', '16', '2026', '6', '20'],
  )
})

test('parseBusyOutput parses pipe-delimited lines, ignoring blanks', () => {
  const out = '2026-06-17T10:00|2026-06-17T10:30\n2026-06-17T14:00|2026-06-17T15:00\n\n'
  assert.deepEqual(parseBusyOutput(out), [
    { start: '2026-06-17T10:00', end: '2026-06-17T10:30' },
    { start: '2026-06-17T14:00', end: '2026-06-17T15:00' },
  ])
})
