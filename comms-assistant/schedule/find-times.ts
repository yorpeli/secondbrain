import type { BusyBlock, Slot, SlotConstraints } from './types.js'
import { zonedToUtcMin, partsInZone, workdaysForZone } from './tz.js'

// A meeting attendee in their own timezone/work-week, for cross-zone slot filtering.
export interface AttendeeWindow {
  timezone: string // IANA, e.g. 'America/New_York'
  workdays?: number[] // 0=Sun..6=Sat; defaults from the timezone (Israel Sun–Thu, else Mon–Fri)
  dayStartHour?: number // local working-hours start (default = organizer's dayStartHour)
  dayEndHour?: number // local working-hours end
}

export const DEFAULT_CONSTRAINTS: SlotConstraints = {
  dayStartHour: 9,
  dayEndHour: 18,
  lunchStartHour: 13,
  lunchEndHour: 14,
  minGapMin: 15,
  workdays: [0, 1, 2, 3, 4], // Sun–Thu (Israel work week)
  slotStepMin: 30,
}

// Parse a naive "YYYY-MM-DDTHH:MM" into absolute minutes (via Date.UTC, deterministic
// regardless of the host timezone) plus wall-clock parts.
function parse(s: string): { abs: number; h: number; dow: number; day: string } {
  const y = +s.slice(0, 4), mo = +s.slice(5, 7), d = +s.slice(8, 10)
  const h = +s.slice(11, 13), mi = +s.slice(14, 16)
  const abs = Date.UTC(y, mo - 1, d, h, mi) / 60000
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
  return { abs, h, dow, day: s.slice(0, 10) }
}

function fmt(absMin: number): string {
  const d = new Date(absMin * 60000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// Prefer mid-morning (10:00–12:00) and early-afternoon (14:00–16:00); earlier days win.
function scoreSlot(startH: number, dayIndex: number): number {
  const timePref = (startH >= 10 && startH < 12) || (startH >= 14 && startH < 16) ? 1 : 0
  return timePref * 100 - dayIndex // earlier days rank higher; good time-of-day breaks ties
}

export function rankSlots(opts: {
  windowStartDay: string
  windowEndDay: string
  durationMin: number
  busy: BusyBlock[]
  nowNaive: string
  constraints?: Partial<SlotConstraints>
  organizerTz?: string // IANA zone the busy blocks / candidate slots are expressed in (default Asia/Jerusalem)
  attendees?: AttendeeWindow[] // keep only slots that also fall in every attendee's local work window
}): Slot[] {
  const c: SlotConstraints = { ...DEFAULT_CONSTRAINTS, ...(opts.constraints ?? {}) }
  const now = parse(opts.nowNaive).abs
  const busy = opts.busy.map((b) => ({ s: parse(b.start).abs, e: parse(b.end).abs }))
  const organizerTz = opts.organizerTz ?? 'Asia/Jerusalem'
  const attendees = opts.attendees ?? []

  const startDay = parse(opts.windowStartDay + 'T00:00')
  const endDay = parse(opts.windowEndDay + 'T00:00')
  const slots: Slot[] = []
  let dayIndex = -1

  for (let dayAbs = startDay.abs; dayAbs <= endDay.abs; dayAbs += 24 * 60) {
    dayIndex++
    const dow = new Date(dayAbs * 60000).getUTCDay()
    if (!c.workdays.includes(dow)) continue

    for (let h = c.dayStartHour * 60; h + opts.durationMin <= c.dayEndHour * 60; h += c.slotStepMin) {
      const startAbs = dayAbs + h
      const endAbs = startAbs + opts.durationMin
      const startH = Math.floor(h / 60)

      if (startAbs < now) continue // past
      // lunch overlap
      const lunchS = dayAbs + c.lunchStartHour * 60
      const lunchE = dayAbs + c.lunchEndHour * 60
      if (startAbs < lunchE && endAbs > lunchS) continue
      // busy overlap with gap buffer
      const blocked = busy.some((b) => startAbs < b.e + c.minGapMin && endAbs + c.minGapMin > b.s)
      if (blocked) continue

      // attendee timezones: the slot must also land inside every attendee's local work window
      if (attendees.length) {
        const u = zonedToUtcMin(fmt(startAbs), organizerTz)
        const uEnd = u + opts.durationMin
        const okForAll = attendees.every((a) => {
          const wd = a.workdays ?? workdaysForZone(a.timezone)
          const aStart = (a.dayStartHour ?? c.dayStartHour) * 60
          const aEnd = (a.dayEndHour ?? c.dayEndHour) * 60
          const ps = partsInZone(u, a.timezone)
          const pe = partsInZone(uEnd, a.timezone)
          if (!wd.includes(ps.dow) || ps.dow !== pe.dow) return false // off-day or crosses their midnight
          return (ps.hour * 60 + ps.minute) >= aStart && (pe.hour * 60 + pe.minute) <= aEnd
        })
        if (!okForAll) continue
      }

      slots.push({ start: fmt(startAbs), end: fmt(endAbs), score: scoreSlot(startH, dayIndex) })
    }
  }

  return slots.sort((a, b) => b.score - a.score || a.start.localeCompare(b.start))
}

// Pick up to n slots, one per distinct day, highest-scoring first — spreads meetings out.
export function pickSpread(slots: Slot[], n: number): Slot[] {
  const seen = new Set<string>()
  const out: Slot[] = []
  for (const s of slots) {
    const day = s.start.slice(0, 10)
    if (seen.has(day)) continue
    seen.add(day)
    out.push(s)
    if (out.length === n) break
  }
  return out
}
