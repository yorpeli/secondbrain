import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MeetingSpec } from '../schedule/types.js'
import { normalizeDashes } from './draft-request.js'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'meeting.applescript')

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
  // Naive datetime strings are fixed-length + zero-padded, so lexical order == chronological.
  if (o.end <= o.start) return { ok: false, error: 'end must be after start' }
  if (o.location !== undefined && typeof o.location !== 'string') return { ok: false, error: 'location must be a string' }
  return {
    ok: true,
    value: {
      subject: o.subject, body: o.body, attendees: o.attendees as string[],
      start: o.start, end: o.end, location: o.location as string | undefined,
    },
  }
}

// Numeric date components for AppleScript: ['2026','6','21','15','30'] (no zero-pad — coerced to integer).
function parts(naive: string): string[] {
  return [
    String(+naive.slice(0, 4)), String(+naive.slice(5, 7)), String(+naive.slice(8, 10)),
    String(+naive.slice(11, 13)), String(+naive.slice(14, 16)),
  ]
}

// Build the argv for meeting.applescript. Attendees become "email||email" pairs joined by ";;"
// (the address doubles as the display name; Outlook resolves internal addresses to a name).
// Subject + body run through normalizeDashes (the hard no-dashes rule). Location is intentionally
// omitted — the opened window won't render it, and Yonatan adds the join link there himself.
export function buildMeetingArgs(scriptPath: string, spec: MeetingSpec): string[] {
  const attSpec = spec.attendees
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => `${e}||${e}`)
    .join(';;')
  return [
    scriptPath, 'meeting',
    normalizeDashes(spec.subject),
    normalizeDashes(spec.body ?? ''),
    attSpec,
    ...parts(spec.start), ...parts(spec.end),
  ]
}

function exec(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.toString().trim() || err.message))
      resolve(stdout?.toString() ?? '')
    })
  })
}

// Create a reviewable, UNSENT meeting invite in Outlook (To + subject + time pre-filled) and
// open it; the agenda body is left on the clipboard for a one-paste into the notes field.
// NEVER sends — Yonatan reviews, pastes the agenda, adds the join link, and sends.
export async function createMeeting(spec: MeetingSpec): Promise<void> {
  const out = await exec('osascript', buildMeetingArgs(SCRIPT, spec))
  if (out.trim() !== 'OK') throw new Error(`unexpected osascript output: ${out.trim().slice(-300)}`)
}
