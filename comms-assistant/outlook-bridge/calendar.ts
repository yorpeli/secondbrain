import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BusyBlock, MeetingSpec } from '../schedule/types.js'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'calendar.applescript')

const NAIVE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const DAY = /^\d{4}-\d{2}-\d{2}$/

function plainTextToHtml(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

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
      start: o.start, end: o.end, location: (o.location as string | undefined),
    },
  }
}

function parts(naive: string): string[] {
  // ['2026','6','17','10','0'] — numeric (no zero-pad; AppleScript coerces to integer)
  return [
    String(+naive.slice(0, 4)), String(+naive.slice(5, 7)), String(+naive.slice(8, 10)),
    String(+naive.slice(11, 13)), String(+naive.slice(14, 16)),
  ]
}

export function buildMeetingArgs(scriptPath: string, spec: MeetingSpec): string[] {
  const csv = spec.attendees.map((s) => s.trim()).filter(Boolean).join(',')
  return [
    scriptPath, 'meeting', spec.subject, plainTextToHtml(spec.body), csv,
    ...parts(spec.start), ...parts(spec.end), spec.location ?? '',
  ]
}

export function buildBusyArgs(scriptPath: string, windowStartDay: string, windowEndDay: string): string[] {
  if (!DAY.test(windowStartDay) || !DAY.test(windowEndDay)) throw new Error('window days must be YYYY-MM-DD')
  const d = (s: string) => [String(+s.slice(0, 4)), String(+s.slice(5, 7)), String(+s.slice(8, 10))]
  return [scriptPath, 'busy', ...d(windowStartDay), ...d(windowEndDay)]
}

export function parseBusyOutput(stdout: string): BusyBlock[] {
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [start, end] = l.split('|')
      return { start, end }
    })
    .filter((b) => b.start && b.end)
}

function exec(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.toString().trim() || err.message))
      resolve(stdout?.toString() ?? '')
    })
  })
}

export async function readBusy(windowStartDay: string, windowEndDay: string): Promise<BusyBlock[]> {
  const out = await exec('osascript', buildBusyArgs(SCRIPT, windowStartDay, windowEndDay))
  return parseBusyOutput(out)
}

export async function createMeetingDraft(spec: MeetingSpec): Promise<void> {
  const out = await exec('osascript', buildMeetingArgs(SCRIPT, spec))
  if (out.trim() !== 'OK') throw new Error(`unexpected osascript output: ${out.trim().slice(-300)}`)
}
