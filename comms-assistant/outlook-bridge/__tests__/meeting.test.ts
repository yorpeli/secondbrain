import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateMeetingSpec, buildMeetingArgs } from '../meeting.js'

test('validateMeetingSpec rejects bad input', () => {
  assert.equal(validateMeetingSpec(null).ok, false)
  assert.equal(validateMeetingSpec({ subject: '', body: 'b', attendees: ['a@b.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: [], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: ['nope'], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: ['a@b.com'], start: 'June', end: '2026-06-17T10:30' }).ok, false)
})

test('validateMeetingSpec rejects end not after start', () => {
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: ['a@b.com'], start: '2026-06-17T10:30', end: '2026-06-17T10:00' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: ['a@b.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:00' }).ok, false)
})

test('validateMeetingSpec accepts a 1:1 with a colon subject', () => {
  const r = validateMeetingSpec({ subject: '1:1 Elad', body: 'agenda', attendees: ['eladsc@payoneer.com'], start: '2026-06-21T15:30', end: '2026-06-21T16:00', location: 'Zoom' })
  assert.equal(r.ok, true)
})

test('buildMeetingArgs builds meeting mode, name||email attendees, numeric date parts', () => {
  const args = buildMeetingArgs('/p/meeting.applescript', {
    subject: '1:1 Elad', body: 'agenda line', attendees: ['eladsc@payoneer.com'],
    start: '2026-06-21T15:30', end: '2026-06-21T16:00',
  })
  assert.deepEqual(args, [
    '/p/meeting.applescript', 'meeting', '1:1 Elad', 'agenda line',
    'eladsc@payoneer.com||eladsc@payoneer.com',
    '2026', '6', '21', '15', '30', '2026', '6', '21', '16', '0',
  ])
})

test('buildMeetingArgs joins multiple attendees with ;; and normalizes dashes in subject/body', () => {
  const args = buildMeetingArgs('/p/meeting.applescript', {
    subject: 'Sync — KYC', body: 'a – b', attendees: ['a@x.com', 'b@y.com'],
    start: '2026-06-21T15:30', end: '2026-06-21T16:00',
  })
  assert.equal(args[2], 'Sync - KYC') // em-dash normalized to hyphen
  assert.equal(args[3], 'a - b') // en-dash normalized to hyphen
  assert.equal(args[4], 'a@x.com||a@x.com;;b@y.com||b@y.com')
})
