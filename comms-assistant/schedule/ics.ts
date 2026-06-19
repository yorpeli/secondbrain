import { writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import type { MeetingSpec } from './types.js'

const NAIVE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export type MeetingValidation =
  | { ok: true; value: MeetingSpec }
  | { ok: false; error: string }

export function validateMeetingSpec(input: unknown): MeetingValidation {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'spec must be a JSON object' }
  const o = input as Record<string, unknown>
  if (typeof o.subject !== 'string' || o.subject.trim() === '') return { ok: false, error: 'subject required' }
  if (typeof o.body !== 'string') return { ok: false, error: 'body must be a string' }
  if (!Array.isArray(o.attendees) || o.attendees.length === 0 || !o.attendees.every((a) => typeof a === 'string' && a.includes('@')))
    return { ok: false, error: 'attendees must be a non-empty array of email addresses' }
  if (typeof o.start !== 'string' || !NAIVE.test(o.start)) return { ok: false, error: 'start must be YYYY-MM-DDTHH:MM' }
  if (typeof o.end !== 'string' || !NAIVE.test(o.end)) return { ok: false, error: 'end must be YYYY-MM-DDTHH:MM' }
  if (o.location !== undefined && typeof o.location !== 'string') return { ok: false, error: 'location must be a string' }
  return {
    ok: true,
    value: {
      subject: o.subject, body: o.body, attendees: o.attendees as string[],
      start: o.start, end: o.end, location: o.location as string | undefined,
    },
  }
}

// RFC 5545 TEXT escaping: backslash, semicolon, comma, newline.
export function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n?|\n/g, '\\n')
}

// A dash/hyphen anywhere in SUMMARY blanks the Subject in Outlook-for-Mac (Task 1 finding),
// and Yonatan's hard no-dashes rule wants them gone anyway. Replace dash-likes with a space,
// collapse runs, then RFC-escape. Colons are fine and preserved ("1:1 Elad").
export function sanitizeSummary(s: string): string {
  const noDash = s.replace(/[‒–—―-]/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return escapeIcsText(noDash)
}

// Naive "YYYY-MM-DDTHH:MM" -> floating-local iCal "YYYYMMDDTHHMMSS".
function icsLocal(naive: string): string {
  return naive.replace(/[-:]/g, '') + '00'
}

// Fold a content line to <=75 octets per RFC 5545 (continuation lines start with a space).
export function foldLine(line: string): string {
  return line
}

export interface IcsOpts {
  uid: string
  dtstamp: string
  organizerEmail?: string
  organizerName?: string
}

export function buildIcs(spec: MeetingSpec, opts: IcsOpts): string {
  const orgEmail = opts.organizerEmail ?? 'yonatanorp@payoneer.com'
  const orgName = opts.organizerName ?? 'Yonatan Orpeli'
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SecondBrain//Comms Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${opts.dtstamp}`,
    `DTSTART:${icsLocal(spec.start)}`,
    `DTEND:${icsLocal(spec.end)}`,
    `SUMMARY:${sanitizeSummary(spec.subject)}`,
  ]
  if (spec.location && spec.location.trim()) lines.push(`LOCATION:${escapeIcsText(spec.location)}`)
  if (spec.body && spec.body.trim()) lines.push(`DESCRIPTION:${escapeIcsText(spec.body)}`)
  lines.push(`ORGANIZER;CN=${orgName}:mailto:${orgEmail}`)
  for (const a of spec.attendees) {
    lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a.trim()}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

function pad(n: number): string { return String(n).padStart(2, '0') }
function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

// Write the .ics to a temp file and open it in Outlook (editable, sendable invite).
// Returns the temp path. NEVER sends — the user reviews, adds the join link, and sends.
export async function createMeetingInvite(spec: MeetingSpec, opts?: Partial<IcsOpts>): Promise<string> {
  const now = new Date()
  const uid = opts?.uid ?? `sb-${now.getTime()}-${Math.round(Math.random() * 1e6)}@secondbrain`
  const dtstamp = opts?.dtstamp ?? utcStamp(now)
  const ics = buildIcs(spec, { uid, dtstamp, organizerEmail: opts?.organizerEmail, organizerName: opts?.organizerName })
  const safe = spec.subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'meeting'
  const file = path.join(os.tmpdir(), `sb-invite-${now.getTime()}-${safe}.ics`)
  await writeFile(file, ics, 'utf8')
  await new Promise<void>((resolve, reject) => {
    execFile('open', ['-a', 'Microsoft Outlook', file], (err) => (err ? reject(err) : resolve()))
  })
  return file
}
