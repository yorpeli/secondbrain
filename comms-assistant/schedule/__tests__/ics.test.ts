import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIcs, validateMeetingSpec, escapeIcsText, sanitizeSummary } from '../ics.js'

const OPTS = { uid: 'u1@sb', dtstamp: '20260619T120000Z' }

test('validateMeetingSpec rejects bad input', () => {
  assert.equal(validateMeetingSpec(null).ok, false)
  assert.equal(validateMeetingSpec({ subject: '', body: 'b', attendees: ['a@b.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: [], start: '2026-06-17T10:00', end: '2026-06-17T10:30' }).ok, false)
  assert.equal(validateMeetingSpec({ subject: 's', body: 'b', attendees: ['a@b.com'], start: 'June', end: '2026-06-17T10:30' }).ok, false)
})

test('validateMeetingSpec accepts a 1:1 with a colon subject', () => {
  const r = validateMeetingSpec({ subject: '1:1 Elad', body: 'agenda', attendees: ['elad@x.com'], start: '2026-06-17T10:00', end: '2026-06-17T10:30', location: 'Zoom' })
  assert.equal(r.ok, true)
})

test('sanitizeSummary strips dashes (which blank the Subject in Outlook) but keeps colons', () => {
  assert.equal(sanitizeSummary('Weekly Sync - Elad'), 'Weekly Sync Elad')
  assert.equal(sanitizeSummary('1:1 Elad'), '1:1 Elad')
  assert.equal(sanitizeSummary('Q3 — KYC'), 'Q3 KYC') // em-dash too
})

test('escapeIcsText escapes RFC 5545 special chars', () => {
  assert.equal(escapeIcsText('a; b, c\\ d\ne'), 'a\\; b\\, c\\\\ d\\ne')
})

test('buildIcs emits floating-local DTSTART/DTEND, a colon-safe SUMMARY, and attendees', () => {
  const ics = buildIcs({ subject: '1:1 Elad', body: 'agenda line', attendees: ['elad@x.com'], start: '2027-03-10T14:00', end: '2027-03-10T14:30', location: 'Zoom' }, OPTS)
  assert.match(ics, /DTSTART:20270310T140000\r\n/)
  assert.match(ics, /DTEND:20270310T143000\r\n/)
  assert.match(ics, /SUMMARY:1:1 Elad\r\n/)
  assert.match(ics, /LOCATION:Zoom\r\n/)
  assert.match(ics, /ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:elad@x.com\r\n/)
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})

test('buildIcs substitutes a dash subject so the Subject will not blank', () => {
  const ics = buildIcs({ subject: 'Weekly Sync - Elad', body: 'x', attendees: ['e@x.com'], start: '2027-03-10T14:00', end: '2027-03-10T14:30' }, OPTS)
  assert.match(ics, /SUMMARY:Weekly Sync Elad\r\n/)
  assert.doesNotMatch(ics, /SUMMARY:[^\r\n]*-/)
})
