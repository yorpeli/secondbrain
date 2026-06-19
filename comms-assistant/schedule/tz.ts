// Timezone helpers for cross-zone scheduling. Pure + deterministic: they use Intl
// (ICU tz data) over explicit epoch values — no Date.now()/argless new Date().

// Offset (ms) of `tz` at the given absolute instant: wallclock(tz, utcMs) - utcMs.
function tzOffsetMs(tz: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const m: Record<string, string> = {}
  for (const p of dtf.formatToParts(new Date(utcMs))) m[p.type] = p.value
  const asIfUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second)
  return asIfUtc - utcMs
}

// A naive wall-clock "YYYY-MM-DDTHH:MM" interpreted IN `tz` → absolute minutes since epoch.
export function zonedToUtcMin(naive: string, tz: string): number {
  const y = +naive.slice(0, 4), mo = +naive.slice(5, 7), d = +naive.slice(8, 10)
  const h = +naive.slice(11, 13), mi = +naive.slice(14, 16)
  const asUtc = Date.UTC(y, mo - 1, d, h, mi) // pretend the wall-clock is UTC
  const off = tzOffsetMs(tz, asUtc)           // then correct by the zone's offset
  return Math.round((asUtc - off) / 60000)
}

// Wall-clock of an absolute instant (minutes since epoch) IN `tz`.
// Returns the hour (0-23), day-of-week (0=Sun..6=Sat), and the naive "YYYY-MM-DDTHH:MM".
export function partsInZone(utcMin: number, tz: string): { hour: number; minute: number; dow: number; naive: string } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  const m: Record<string, string> = {}
  for (const p of dtf.formatToParts(new Date(utcMin * 60000))) m[p.type] = p.value
  const y = +m.year, mo = +m.month, d = +m.day, hour = +m.hour, minute = +m.minute
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return { hour, minute, dow, naive: `${y}-${p2(mo)}-${p2(d)}T${p2(hour)}:${p2(minute)}` }
}

// Format an absolute instant as "HH:MM" in `tz` (for showing a slot in each attendee's zone).
export function formatInZone(utcMin: number, tz: string): string {
  const p = partsInZone(utcMin, tz)
  return p.naive.slice(11)
}

// Israel works Sun–Thu; everywhere else in this org works Mon–Fri. Derive the work-week
// (getUTCDay convention) from the timezone so callers don't have to store it per person.
export function workdaysForZone(tz: string): number[] {
  return tz === 'Asia/Jerusalem' ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 5]
}
