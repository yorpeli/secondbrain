# Calendar "Create Meetings" Limb — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversational "set up meetings" capability to the comms assistant that resolves attendees, proposes times against the user's real calendar, drafts a per-meeting agenda, and — on in-chat approval — opens each invite as an **editable, sendable `.ics`** in Outlook for the user to add a join link and send himself.

**Architecture:** Claude Code orchestrates (resolve → find times → draft agenda → in-chat slate → create invites), calling local CLI primitives. The **read** path (own busy/free) uses `osascript` via `execFile` against a read-only `calendar.applescript`. The **create** path generates a standard `.ics` file and opens it in Outlook (`open -a "Microsoft Outlook"`), which renders an **editable, sendable** invite the user reviews + sends — AppleScript cannot create a reviewable unsent invite (Task 1 finding). Pure logic (slot ranking, `.ics` generation) is isolated and unit-tested. No Graph required for v1; nothing is ever sent by the agent.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Node `node:test` + `node:assert/strict`, `osascript`/AppleScript against Microsoft Outlook for Mac, Supabase (`@supabase/supabase-js` via `lib/supabase.ts`), `searchByType` from `lib/embeddings.ts`.

## Global Constraints

- **Never send.** The create path generates an `.ics` and **opens** it in Outlook for the user to review + send. The agent never sends. (AppleScript `make new calendar event` / `send meeting` are NOT used — see Task 1.)
- **No auto-record.** v1 does NOT write created meetings into `meetings` / `meeting_attendees` / `agent_log`. Normal calendar sync owns the record.
- **Local-only.** The read path uses `osascript` via `execFile`; the create path writes a temp `.ics` and `open -a "Microsoft Outlook"`. No Azure/Graph dependency. Graph free/busy is optional enrichment only and is NOT built in v1.
- **`.ics` SUMMARY must not contain dashes** — a hyphen/dash blanks the Subject in Outlook-for-Mac (Task 1 finding). Strip/substitute dashes in the SUMMARY (aligns with the hard no-dashes rule); RFC-escape `; , \` and newline in all TEXT fields.
- **`.ics` times use floating local time** (`YYYYMMDDTHHMMSS`, no `Z`, no `TZID`) — matches the naive-local find-times output with no DST math; correct for the Israel-based team. Proper `TZID=Asia/Jerusalem` is a future enhancement.
- **ESM import specifiers end in `.js`** (e.g. `import { rankSlots } from './find-times.js'`) even though sources are `.ts` — match the existing codebase.
- **No `Date.now()` / `new Date()` inside pure functions.** Pass the current time in as a parameter (`nowNaive`) so tests are deterministic.
- **Naive local datetime strings** (`"YYYY-MM-DDTHH:MM"`, no offset) are the time format across the find-times boundary, to avoid timezone ambiguity. The calendar AppleScript emits this format; pure code parses it deterministically via `Date.UTC`.
- **Root person for org-group resolution:** `yonatan-orpeli` (verified in `people`).
- **Locate the real calendar by max event count**, never `default calendar` (errors `-1728`) or `calendar 1` (empty placeholder). Verified live 2026-06-19: real calendar "Calendar" has 2,559 events.
- Tests live in a sibling `__tests__/` dir and run via `npx tsx --test <path>` (match existing `outlook-bridge/__tests__`).

---

## File Structure

**Create:**
- `comms-assistant/schedule/types.ts` — shared types (`BusyBlock`, `Slot`, `SlotConstraints`, `ResolvedAttendee`, `MeetingSpec`).
- `comms-assistant/schedule/find-times.ts` — **pure** slot ranking + spread picking.
- `comms-assistant/schedule/__tests__/find-times.test.ts` — unit tests for the above.
- `comms-assistant/schedule/meeting-request.ts` — attendee + org-group resolution (DB).
- `comms-assistant/schedule/__tests__/meeting-request.test.ts` — tests for the pure identifier/group parsing.
- `comms-assistant/schedule/agenda-context.ts` — gather grounding material for an agenda (DB + `searchByType`).
- `comms-assistant/schedule/ics.ts` — **pure** `.ics` generator (`validateMeetingSpec` + `buildIcs`) + impure `createMeetingInvite` (write temp `.ics`, open in Outlook). **This is the create path** (AppleScript meeting-create is impossible — see Task 1).
- `comms-assistant/schedule/__tests__/ics.test.ts` — unit tests for the pure `.ics` builder/validator.
- `comms-assistant/outlook-bridge/calendar.ts` — `execFile` wrapper + **pure** arg builder/parser for the AppleScript `busy` read only.
- `comms-assistant/outlook-bridge/__tests__/calendar.test.ts` — unit tests for the pure busy arg builder/parser.
- `comms-assistant/outlook-bridge/calendar.applescript` — **read-only**, one mode: `busy` (read events → `start|end` lines). DONE in Task 1.

**Modify:**
- `comms-assistant/run.ts` — add `schedule:resolve`, `schedule:busy`, `schedule:find-times`, `schedule:agenda-context`, `schedule:draft-meeting` CLI commands.
- `agents/comms-assistant.md` — document the trigger + procedure.
- `comms-assistant/CLAUDE.md` — add the "set up meetings" procedure to the folder index.
- `CLAUDE.md` (root) — one line in the comms-assistant row noting the calendar limb.

---

## Task 1: Calendar busy-read AppleScript + create-path spike — DONE (controller-verified)

**Status: COMPLETE** (commit `b2e27db`). Done by the controller, live against the user's Outlook, because AppleScript needs the real app and iterative debugging (the repo's established pattern for `.applescript` files).

**Outcome — a load-bearing finding that pivoted the create path:**
- **`busy` read WORKS** — `calendar.applescript busy <sy> <smo> <sd> <ey> <emo> <ed>` returns real events as `start|end` naive-local lines. The `whose` filter is NOT gutted for calendar (unlike messages). Kept as the **read-only** `calendar.applescript` (busy mode only).
- **AppleScript meeting CREATE is impossible** for our needs (verified live on Legacy Outlook, `IsRunningNewOutlook=0`):
  - Properties set on a `calendar event` object commit on the object (readback OK), but `open ev` renders a **stale** compose window (blank subject/location/time; only `To` binds).
  - Without `open`, a meeting **with attendees vanishes** — an unsent invitation is an **ephemeral draft** that only persists if sent. A plain appointment (no attendees) *does* persist, which confirms the mechanism.
  - So there is **no way** to produce a persistent, reviewable, *unsent* invite via AppleScript. The `make new calendar event` path is dropped.

**Create path pivots to `.ics`** (spiked live, user-confirmed): generate a standard `.ics` and `open -a "Microsoft Outlook"` it → Outlook opens an **editable, sendable** invite with location, agenda, attendees, and time all populated. Fully local; preserves draft-and-send-yourself (the user reviews + adds the join link + sends). See Task 3B.
- **Subject quirk (verified):** a **hyphen/dash** anywhere in the `.ics` `SUMMARY` **blanks the Subject** in Outlook-for-Mac's parser (a colon, e.g. "1:1 Elad", is fine). The generator must strip/substitute dashes in the SUMMARY (which also aligns with the hard no-dashes rule) and RFC-escape `; , \\ \n` in all TEXT fields.

No further action — proceed to Task 2.

---

## Task 2: Pure slot ranking (`find-times.ts` + types)

**Files:**
- Create: `comms-assistant/schedule/types.ts`
- Create: `comms-assistant/schedule/find-times.ts`
- Test: `comms-assistant/schedule/__tests__/find-times.test.ts`

**Interfaces:**
- Produces:
  - `BusyBlock = { start: string; end: string }` (naive local `YYYY-MM-DDTHH:MM`)
  - `Slot = { start: string; end: string; score: number }`
  - `SlotConstraints = { dayStartHour: number; dayEndHour: number; lunchStartHour: number; lunchEndHour: number; minGapMin: number; workdays: number[]; slotStepMin: number }`
  - `DEFAULT_CONSTRAINTS: SlotConstraints`
  - `rankSlots(opts: { windowStartDay: string; windowEndDay: string; durationMin: number; busy: BusyBlock[]; nowNaive: string; constraints?: Partial<SlotConstraints> }): Slot[]`
  - `pickSpread(slots: Slot[], n: number): Slot[]`

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/schedule/__tests__/find-times.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankSlots, pickSpread, DEFAULT_CONSTRAINTS } from '../find-times.js'

const NOW = '2026-06-15T08:00' // a Monday morning

test('returns 30-min slots within working hours, skipping lunch', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30, busy: [], nowNaive: NOW,
  })
  // all slots on the requested day, none crossing lunch (13:00-14:00 default)
  assert.ok(slots.length > 0)
  for (const s of slots) {
    assert.ok(s.start.startsWith('2026-06-15'))
    const h = Number(s.start.slice(11, 13))
    assert.ok(h >= DEFAULT_CONSTRAINTS.dayStartHour && h < DEFAULT_CONSTRAINTS.dayEndHour)
    assert.notEqual(h, DEFAULT_CONSTRAINTS.lunchStartHour) // 13:00 slot excluded
  }
})

test('excludes slots overlapping a busy block (with gap buffer)', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30,
    busy: [{ start: '2026-06-15T10:00', end: '2026-06-15T11:00' }],
    nowNaive: NOW,
  })
  // nothing may overlap 10:00-11:00, and the 9:45 start (ends 10:15) is blocked by the 15-min gap
  for (const s of slots) {
    assert.ok(!(s.start < '2026-06-15T11:00' && s.end > '2026-06-15T10:00'))
  }
})

test('excludes slots in the past', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30, busy: [], nowNaive: '2026-06-15T11:30',
  })
  for (const s of slots) assert.ok(s.start >= '2026-06-15T11:30')
})

test('skips non-workdays (Saturday=6, Sunday=0)', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-20', windowEndDay: '2026-06-21', // Sat + Sun
    durationMin: 30, busy: [], nowNaive: '2026-06-15T08:00',
  })
  assert.equal(slots.length, 0)
})

test('pickSpread returns at most n slots across distinct days', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-18',
    durationMin: 30, busy: [], nowNaive: NOW,
  })
  const picked = pickSpread(slots, 3)
  assert.equal(picked.length, 3)
  const days = new Set(picked.map((s) => s.start.slice(0, 10)))
  assert.equal(days.size, 3) // one per distinct day
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test comms-assistant/schedule/__tests__/find-times.test.ts`
Expected: FAIL — cannot find module `../find-times.js`.

- [ ] **Step 3: Write the types**

Create `comms-assistant/schedule/types.ts`:

```ts
// Naive local datetime string, "YYYY-MM-DDTHH:MM" (no timezone offset).
export type NaiveDateTime = string

export interface BusyBlock {
  start: NaiveDateTime
  end: NaiveDateTime
}

export interface Slot {
  start: NaiveDateTime
  end: NaiveDateTime
  score: number
}

export interface SlotConstraints {
  dayStartHour: number   // first hour a meeting may start
  dayEndHour: number     // a meeting must END by this hour
  lunchStartHour: number // inclusive lunch block start hour
  lunchEndHour: number   // exclusive lunch block end hour
  minGapMin: number      // buffer required around busy blocks
  workdays: number[]     // 0=Sun … 6=Sat (getUTCDay convention)
  slotStepMin: number    // candidate start granularity
}

export interface ResolvedAttendee {
  slug: string
  name: string
  email: string
}

export interface MeetingSpec {
  subject: string
  body: string             // plain text agenda; converted to HTML for the event content
  attendees: string[]      // email addresses
  start: NaiveDateTime
  end: NaiveDateTime
  location?: string
}
```

- [ ] **Step 4: Write the implementation**

Create `comms-assistant/schedule/find-times.ts`:

```ts
import type { BusyBlock, Slot, SlotConstraints } from './types.js'

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
}): Slot[] {
  const c: SlotConstraints = { ...DEFAULT_CONSTRAINTS, ...(opts.constraints ?? {}) }
  const now = parse(opts.nowNaive).abs
  const busy = opts.busy.map((b) => ({ s: parse(b.start).abs, e: parse(b.end).abs }))

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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx tsx --test comms-assistant/schedule/__tests__/find-times.test.ts`
Expected: PASS (5 tests). Note: default workdays are Sun–Thu, so the Sat/Sun test (2026-06-20/21) correctly yields 0 slots.

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/schedule/types.ts comms-assistant/schedule/find-times.ts comms-assistant/schedule/__tests__/find-times.test.ts
git commit -m "feat(comms-cal): pure slot ranking (find-times) with workday/lunch/busy constraints"
```

---

## Task 3: Calendar busy-read wrapper (`calendar.ts`)

**Files:**
- Create: `comms-assistant/outlook-bridge/calendar.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/calendar.test.ts`

**Interfaces:**
- Consumes: `BusyBlock` from `../schedule/types.js`.
- Produces:
  - `buildBusyArgs(scriptPath: string, windowStartDay: string, windowEndDay: string): string[]`
  - `parseBusyOutput(stdout: string): BusyBlock[]`
  - `readBusy(windowStartDay: string, windowEndDay: string): Promise<BusyBlock[]>` (execFile against the read-only `calendar.applescript` from Task 1)

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/calendar.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test comms-assistant/outlook-bridge/__tests__/calendar.test.ts`
Expected: FAIL — cannot find module `../calendar.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/outlook-bridge/calendar.ts`:

```ts
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BusyBlock } from '../schedule/types.js'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'calendar.applescript')

const DAY = /^\d{4}-\d{2}-\d{2}$/

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test comms-assistant/outlook-bridge/__tests__/calendar.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/calendar.ts comms-assistant/outlook-bridge/__tests__/calendar.test.ts
git commit -m "feat(comms-cal): calendar.ts busy-read wrapper + pure arg builder/parser"
```

---

## Task 3B: `.ics` meeting-invite generator (`ics.ts`) — the create path

The create path is an `.ics` file opened in Outlook (Task 1 finding: AppleScript cannot make a reviewable unsent invite). `buildIcs` is pure and heavily unit-tested; `createMeetingInvite` does the file write + `open`.

**Files:**
- Create: `comms-assistant/schedule/ics.ts`
- Test: `comms-assistant/schedule/__tests__/ics.test.ts`

**Interfaces:**
- Consumes: `MeetingSpec` from `./types.js`.
- Produces:
  - `validateMeetingSpec(input: unknown): { ok: true; value: MeetingSpec } | { ok: false; error: string }`
  - `escapeIcsText(s: string): string`
  - `sanitizeSummary(s: string): string`
  - `foldLine(line: string): string`
  - `buildIcs(spec: MeetingSpec, opts: { uid: string; dtstamp: string; organizerEmail?: string; organizerName?: string }): string`
  - `createMeetingInvite(spec: MeetingSpec, opts?: Partial<{uid,dtstamp,organizerEmail,organizerName}>): Promise<string>` (writes temp `.ics`, opens in Outlook, returns the path)

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/schedule/__tests__/ics.test.ts`:

```ts
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
  assert.equal(escapeIcsText('a; b, c\\ d\ne'), 'a\; b\\, c\\\\ d\\ne')
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test comms-assistant/schedule/__tests__/ics.test.ts`
Expected: FAIL — cannot find module `../ics.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/schedule/ics.ts`:

```ts
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
    .replace(/;/g, '\;')
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
  if (line.length <= 75) return line
  const parts: string[] = [line.slice(0, 75)]
  let i = 75
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74))
    i += 74
  }
  return parts.join('\r\n')
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test comms-assistant/schedule/__tests__/ics.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/schedule/ics.ts comms-assistant/schedule/__tests__/ics.test.ts
git commit -m "feat(comms-cal): .ics meeting-invite generator (dash-safe SUMMARY, floating local time)"
```

---

## Task 4: Attendee + org-group resolution (`meeting-request.ts`)

**Files:**
- Create: `comms-assistant/schedule/meeting-request.ts`
- Test: `comms-assistant/schedule/__tests__/meeting-request.test.ts`

**Interfaces:**
- Consumes: `ResolvedAttendee` from `./types.js`; `getSupabase` from `../../lib/supabase.js`.
- Produces:
  - `KNOWN_GROUPS: Record<string, string>` (group keyword → SQL relation kind)
  - `normalizeGroup(raw: string): string | null` (maps "skip levels"/"skip-levels"/"skips" → canonical key, else null)
  - `resolveGroup(group: string, rootSlug?: string): Promise<ResolvedAttendee[]>`
  - `resolveNames(identifiers: string[]): Promise<{ resolved: ResolvedAttendee[]; unresolved: string[] }>`

- [ ] **Step 1: Write the failing test (pure parts only)**

Create `comms-assistant/schedule/__tests__/meeting-request.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeGroup } from '../meeting-request.js'

test('normalizeGroup canonicalizes skip-level phrasings', () => {
  assert.equal(normalizeGroup('skip-levels'), 'skip-levels')
  assert.equal(normalizeGroup('skip levels'), 'skip-levels')
  assert.equal(normalizeGroup('my skips'), 'skip-levels')
  assert.equal(normalizeGroup('Skip Levels'), 'skip-levels')
})

test('normalizeGroup canonicalizes directs phrasings', () => {
  assert.equal(normalizeGroup('directs'), 'directs')
  assert.equal(normalizeGroup('my direct reports'), 'directs')
  assert.equal(normalizeGroup('direct-reports'), 'directs')
})

test('normalizeGroup returns null for unknown', () => {
  assert.equal(normalizeGroup('the marketing team'), null)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx --test comms-assistant/schedule/__tests__/meeting-request.test.ts`
Expected: FAIL — cannot find module `../meeting-request.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/schedule/meeting-request.ts`:

```ts
import type { ResolvedAttendee } from './types.js'
import { getSupabase } from '../../lib/supabase.js'

export const ROOT_SLUG = 'yonatan-orpeli'

export const KNOWN_GROUPS = {
  'directs': 'directs',
  'skip-levels': 'skip-levels',
} as const

// Map free-text group phrasing to a canonical key, or null if not a known group.
export function normalizeGroup(raw: string): string | null {
  const s = raw.toLowerCase().replace(/[_\s]+/g, '-').replace(/^my-/, '')
  if (['direct', 'directs', 'direct-reports', 'direct-report'].includes(s)) return 'directs'
  if (['skip', 'skips', 'skip-level', 'skip-levels'].includes(s)) return 'skip-levels'
  return null
}

function toAttendees(rows: Array<{ slug: string; name: string; email: string | null }>): ResolvedAttendee[] {
  return rows
    .filter((r) => r.email && r.email.includes('@'))
    .map((r) => ({ slug: r.slug, name: r.name, email: r.email as string }))
}

// directs = people whose reports_to_id is the root; skip-levels = reports of those directs.
export async function resolveGroup(group: string, rootSlug: string = ROOT_SLUG): Promise<ResolvedAttendee[]> {
  const key = normalizeGroup(group)
  if (!key) throw new Error(`unknown group: ${group}`)
  const sb = getSupabase() as any

  const { data: root } = await sb.from('people').select('id').eq('slug', rootSlug).limit(1)
  const rootId = root?.[0]?.id
  if (!rootId) throw new Error(`root person not found: ${rootSlug}`)

  const { data: directs } = await sb.from('people').select('id,slug,name,email').eq('reports_to_id', rootId)
  if (key === 'directs') return toAttendees(directs ?? [])

  const directIds = (directs ?? []).map((d: any) => d.id)
  if (directIds.length === 0) return []
  const { data: skips } = await sb.from('people').select('slug,name,email').in('reports_to_id', directIds)
  return toAttendees(skips ?? [])
}

// Resolve explicit names/slugs → people rows. Exact slug first, then fuzzy name ILIKE.
export async function resolveNames(identifiers: string[]): Promise<{ resolved: ResolvedAttendee[]; unresolved: string[] }> {
  const sb = getSupabase() as any
  const resolved: ResolvedAttendee[] = []
  const unresolved: string[] = []
  for (const id of identifiers) {
    const term = id.trim()
    if (!term) continue
    let { data } = await sb.from('people').select('slug,name,email').eq('slug', term).limit(1)
    if (!data?.length) {
      ;({ data } = await sb.from('people').select('slug,name,email').ilike('name', `%${term}%`).limit(2))
    }
    const matches = toAttendees(data ?? [])
    if (matches.length === 1) resolved.push(matches[0])
    else unresolved.push(term) // 0 matches, ambiguous (>1), or no email
  }
  return { resolved, unresolved }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test comms-assistant/schedule/__tests__/meeting-request.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Smoke-test the DB resolution end-to-end**

Run from the project root:

```bash
npx tsx -e "import('./comms-assistant/schedule/meeting-request.js').then(async m => { console.log('skips:', (await m.resolveGroup('skip-levels')).length); console.log('directs:', (await m.resolveGroup('directs')).map(d=>d.slug)); })"
```

Expected: prints a non-zero skips count and the list of direct-report slugs (Elad, Ira, Yael, Ido, Meital). If a direct has no email in `people`, it's silently filtered — note any gaps.

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/schedule/meeting-request.ts comms-assistant/schedule/__tests__/meeting-request.test.ts
git commit -m "feat(comms-cal): attendee + org-group (directs/skip-levels) resolution"
```

---

## Task 5: Agenda grounding material (`agenda-context.ts`)

The agenda prose is written by Claude Code (the orchestrator) — this module only **gathers the raw material** so the orchestrator doesn't hand-write ad-hoc SQL. Returns current focus, recent 1:1 notes, open action items, and growth areas for a person.

**Files:**
- Create: `comms-assistant/schedule/agenda-context.ts`

**Interfaces:**
- Consumes: `getSupabase` from `../../lib/supabase.js`; `searchByType` from `../../lib/embeddings.js`.
- Produces:
  - `AgendaContext = { person: { slug: string; name: string; role: string | null }; currentFocus: string | null; recentOneOnOnes: Array<{ date: string; summary: string }>; openActionItems: string[]; narrative: string[] }`
  - `gatherAgendaContext(slug: string): Promise<AgendaContext>`

- [ ] **Step 1: Write the implementation**

Create `comms-assistant/schedule/agenda-context.ts`:

```ts
import { getSupabase } from '../../lib/supabase.js'
import { searchByType } from '../../lib/embeddings.js'

export interface AgendaContext {
  person: { slug: string; name: string; role: string | null }
  currentFocus: string | null
  recentOneOnOnes: Array<{ date: string; summary: string }>
  openActionItems: string[]
  narrative: string[]
}

export async function gatherAgendaContext(slug: string): Promise<AgendaContext> {
  const sb = getSupabase() as any

  const { data: people } = await sb.from('people').select('slug,name,role').eq('slug', slug).limit(1)
  const person = people?.[0] ?? { slug, name: slug, role: null }

  const { data: cf } = await sb.from('context_store').select('content').eq('key', 'current_focus').limit(1)
  const currentFocus = cf?.[0]?.content ?? null

  // recent meetings that include this person, newest first
  const { data: mtgs } = await sb
    .from('v_meetings_with_attendees')
    .select('date,title,discussion_notes,attendee_slugs')
    .contains('attendee_slugs', [slug])
    .order('date', { ascending: false })
    .limit(3)
  const recentOneOnOnes = (mtgs ?? []).map((m: any) => ({
    date: m.date,
    summary: (m.discussion_notes ?? m.title ?? '').toString().slice(0, 400),
  }))

  // open action items for this person
  const { data: ai } = await sb
    .from('v_open_action_items')
    .select('description,owner_slug')
    .eq('owner_slug', slug)
    .limit(10)
  const openActionItems = (ai ?? []).map((r: any) => r.description).filter(Boolean)

  // semantic narrative — never throws (embedding failures must not break the flow)
  let narrative: string[] = []
  try {
    const hits = await searchByType(`${person.name} current focus growth coaching`, ['person', 'agent_log'], 4)
    narrative = (hits ?? []).map((h: any) => (h.content ?? h.text ?? '').toString().slice(0, 240)).filter(Boolean)
  } catch { /* sparse / offline — fine */ }

  return { person, currentFocus, recentOneOnOnes, openActionItems, narrative }
}
```

- [ ] **Step 2: Smoke-test against a real person**

Run from the project root:

```bash
npx tsx -e "import('./comms-assistant/schedule/agenda-context.js').then(async m => console.log(JSON.stringify(await m.gatherAgendaContext('elad-schnarch'), null, 2)))"
```

Expected: a JSON object with `person.name = "Elad Schnarch"`, possibly populated `currentFocus`, `recentOneOnOnes`, `openActionItems`, `narrative`. Empty arrays are acceptable (sparse data) — it must not throw. If `v_open_action_items` lacks an `owner_slug` column, adjust the select to the actual owner column (check `docs/schema.md`) and re-run.

- [ ] **Step 3: Commit**

```bash
git add comms-assistant/schedule/agenda-context.ts
git commit -m "feat(comms-cal): agenda grounding gatherer (focus + 1:1s + action items + narrative)"
```

---

## Task 6: CLI wiring in `run.ts`

Expose the primitives so Claude Code can orchestrate the flow without ad-hoc code.

**Files:**
- Modify: `comms-assistant/run.ts`

**Interfaces:**
- Consumes: everything produced in Tasks 2–5.
- Produces CLI commands: `schedule:resolve`, `schedule:busy`, `schedule:find-times`, `schedule:agenda-context`, `schedule:draft-meeting`.

- [ ] **Step 1: Add imports**

In `comms-assistant/run.ts`, after the existing imports (the block ending at the `getSupabase` import on line 27), add:

```ts
import { rankSlots, pickSpread } from './schedule/find-times.js'
import { resolveGroup, resolveNames, normalizeGroup } from './schedule/meeting-request.js'
import { gatherAgendaContext } from './schedule/agenda-context.js'
import { readBusy } from './outlook-bridge/calendar.js'
import { validateMeetingSpec, createMeetingInvite } from './schedule/ics.js'
```

- [ ] **Step 2: Add the command cases**

In the `switch (cmd)` block, before the `default:` case, add:

```ts
    case 'schedule:resolve': {
      // --group=skip-levels|directs  OR  --names=elad-schnarch,ira-martinenko
      const group = arg('group')
      const names = arg('names')
      if (group) {
        const out = await resolveGroup(group)
        console.log(JSON.stringify({ group: normalizeGroup(group), resolved: out }, null, 2))
      } else if (names) {
        const out = await resolveNames(names.split(',').map((s) => s.trim()).filter(Boolean))
        console.log(JSON.stringify(out, null, 2))
      } else {
        throw new Error('schedule:resolve needs --group=<group> or --names=<csv>')
      }
      break
    }
    case 'schedule:busy': {
      // --window=YYYY-MM-DD..YYYY-MM-DD — the user's own busy blocks (local osascript)
      const win = arg('window')
      if (!win || !win.includes('..')) throw new Error('schedule:busy needs --window=YYYY-MM-DD..YYYY-MM-DD')
      const [a, b] = win.split('..')
      console.log(JSON.stringify(await readBusy(a, b), null, 2))
      break
    }
    case 'schedule:find-times': {
      // --payload=<{ windowStartDay, windowEndDay, durationMin, busy[], nowNaive, constraints?, count? }>
      const p = payload()
      const slots = rankSlots(p)
      const out = p.count ? pickSpread(slots, p.count) : slots
      console.log(JSON.stringify(out, null, 2))
      break
    }
    case 'schedule:agenda-context': {
      const slug = arg('slug')
      if (!slug) throw new Error('schedule:agenda-context needs --slug=<person-slug>')
      console.log(JSON.stringify(await gatherAgendaContext(slug), null, 2))
      break
    }
    case 'schedule:draft-meeting': {
      // --payload=<MeetingSpec>. Generates ONE .ics and opens it in Outlook as an
      // editable, sendable invite (the user reviews, adds the join link, sends). Never sends.
      const v = validateMeetingSpec(payload())
      if (!v.ok) throw new Error(v.error)
      const file = await createMeetingInvite(v.value)
      console.log(JSON.stringify({ drafted: v.value.subject, start: v.value.start, ics: file }))
      break
    }
```

- [ ] **Step 3: Update the CLI header comment**

In the top-of-file comment block (lines 2–15), add these lines describing the new commands, after the `rules:distill` line:

```ts
//   schedule:resolve --group=<g>|--names=<csv>   resolve attendees → {slug,name,email}
//   schedule:busy --window=A..B                  the user's own busy blocks (local osascript)
//   schedule:find-times --payload=<json>         rank candidate slots (pure); --payload.count to spread
//   schedule:agenda-context --slug=<slug>        grounding material for an agenda
//   schedule:draft-meeting --payload=<MeetingSpec>  generate ONE .ics + open it in Outlook (editable, sendable; never sent)
```

- [ ] **Step 4: Smoke-test each command (non-mutating ones first)**

```bash
npx tsx comms-assistant/run.ts schedule:resolve --group=skip-levels
npx tsx comms-assistant/run.ts schedule:busy --window=2026-06-16..2026-06-20
echo '{"windowStartDay":"2026-06-22","windowEndDay":"2026-06-25","durationMin":30,"busy":[],"nowNaive":"2026-06-19T09:00","count":3}' > /tmp/ft.json
npx tsx comms-assistant/run.ts schedule:find-times --payload=/tmp/ft.json
```

Expected: resolve prints attendees with emails; busy prints your real busy blocks; find-times prints 3 spread slots. (If you are not on the Mac / Outlook is closed, `schedule:busy` will error — that is expected off-device.)

- [ ] **Step 5: Smoke-test the .ics create command with a throwaway**

Use a subject WITHOUT a dash (a dash blanks the Subject — Task 1 finding) and a colon to confirm "1:1" works:

```bash
echo '{"subject":"ZZZ 1:1 spike","body":"agenda line 1\nagenda line 2","attendees":["yorpeli@gmail.com"],"start":"2027-01-06T09:00","end":"2027-01-06T09:30","location":"Zoom"}' > /tmp/mtg.json
npx tsx comms-assistant/run.ts schedule:draft-meeting --payload=/tmp/mtg.json
```

Expected: prints `{"drafted":"ZZZ 1:1 spike", ..., "ics":"/var/folders/.../sb-invite-...ics"}` and opens an editable invite in Outlook with Subject, Location, agenda body, time, and attendee all populated. Confirm the Subject shows (colon is fine), then close without sending. Nothing persists (it's an unsent draft window). Delete the temp `.ics` if you like.

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/run.ts
git commit -m "feat(comms-cal): schedule:* CLI primitives (resolve/busy/find-times/agenda-context/draft-meeting)"
```

---

## Task 7: Documentation — agent doc, folder index, root CLAUDE.md

**Files:**
- Modify: `agents/comms-assistant.md`
- Modify: `comms-assistant/CLAUDE.md`
- Modify: `CLAUDE.md` (root)

- [ ] **Step 1: Add the procedure to the agent doc**

In `agents/comms-assistant.md`, add a new section documenting the calendar limb. Insert this after the triage-sweep section (find the heading that describes the triage procedure and add this as the next `##` section):

```markdown
## Set up meetings (create flow) — Yonatan never runs the CLI; you do

Triggers: "set up meetings with X", "schedule 1:1s with my skip-levels", "book time with my directs next week". **Create-only** (responding to invites is a future v2). The agent proposes; Yonatan approves in chat; each invite opens in Outlook as an **editable, sendable `.ics`**; **Yonatan adds the Teams/Zoom link and sends himself** (never the agent — preserves read-only MSFT).

1. **Resolve attendees.** Groups: `npx tsx comms-assistant/run.ts schedule:resolve --group=skip-levels` (or `directs`, or `--names=elad-schnarch,ira-martinenko`). Flag any `unresolved` — never invent an email.
2. **Read your own availability.** `schedule:busy --window=YYYY-MM-DD..YYYY-MM-DD` (local osascript; your calendar only). Attendee free/busy is NOT available locally — note that proposed times are based on your openings; invitees accept or counter.
3. **Rank times.** Feed busy blocks into `schedule:find-times --payload=<{windowStartDay,windowEndDay,durationMin,busy,nowNaive,count}>`. Defaults: 30-min, Sun–Thu, 09:00–18:00, no 13:00 lunch slot, 15-min buffer. Pass `count` = number of meetings to spread one-per-day.
4. **Draft an agenda per meeting.** `schedule:agenda-context --slug=<person>` returns current focus + recent 1:1s + open action items + narrative. **You write the agenda prose** from that material (ground via `searchByType` if you want more) — keep it short and specific.
5. **Present the slate in chat** — one row per meeting: attendee · proposed time · agenda summary. Yonatan approves or edits inline ("move Elad to Thursday", "drop the X line").
6. **Create invites on approval.** For each meeting: `schedule:draft-meeting --payload=<MeetingSpec>` (`{subject,body,attendees[email],start,end,location?}`) — generates an `.ics` and opens it in Outlook as an **editable, sendable** invite. Keep subjects dash-free (a dash blanks the Subject; the generator strips them anyway). Each meeting is independent — report per-row failures, don't abort the batch.
7. **Hand off.** Tell Yonatan the invites are open in Outlook; he adds the join link and sends. **No auto-record** — normal calendar sync owns the record.

Requires Outlook for Mac running locally. The busy-read AppleScript and the `.ics` create path were verified live (2026-06-19). If `schedule:busy` returns nothing for a known-busy window, the calendar isn't addressable — report it rather than guessing.
```

- [ ] **Step 2: Add to the folder index**

In `comms-assistant/CLAUDE.md`, under the `## Files` section, add to the `outlook-bridge/` description (or as a new bullet near it):

```markdown
- **Calendar create flow** (`schedule/` + `outlook-bridge/calendar.applescript`): `schedule:resolve` (attendees/org-groups) · `schedule:busy` (your own free/busy, local osascript) · `schedule:find-times` (pure slot ranking — Sun–Thu, 9–18, skip lunch, 15-min buffer) · `schedule:agenda-context` (grounding for the agenda) · `schedule:draft-meeting` (generate ONE `.ics` + open in Outlook as an editable, sendable invite). **Never sends** (Yonatan reviews, adds the join link, sends). **No auto-record.** AppleScript is read-only (busy); create is `.ics` (AppleScript can't make a reviewable unsent invite). Full procedure: [../agents/comms-assistant.md](../agents/comms-assistant.md).
```

- [ ] **Step 3: Note the limb in the root CLAUDE.md**

In `CLAUDE.md` (root), in the Comms Assistant row of the agent table, append to the purpose cell:

```markdown
Also a calendar **create-meetings** limb: resolve attendees → find times (your openings) → draft agenda → in-chat approval → opens an editable, sendable `.ics` invite in Outlook (you add the join link + send; never auto-sent; no auto-record).
```

- [ ] **Step 4: Commit**

```bash
git add agents/comms-assistant.md comms-assistant/CLAUDE.md CLAUDE.md
git commit -m "docs(comms-cal): document the set-up-meetings create flow + schedule CLI"
```

---

## Task 8: Full regression run

**Files:** none (verification only)

- [ ] **Step 1: Run the comms-assistant test suite**

Run: `npx tsx --test comms-assistant/schedule/__tests__/*.test.ts comms-assistant/outlook-bridge/__tests__/*.test.ts`
Expected: all tests pass (find-times 5, meeting-request 3, ics 6, calendar 3, plus the existing bridge tests).

- [ ] **Step 2: Confirm no throwaway artifacts remain**

Remove any temp invites: `rm -f /tmp/sb-invite-*.ics`. Close any leftover unsent invite windows in Outlook (they don't persist). Check the calendar for stray `ZZZ` events and delete any.

- [ ] **Step 3: Final commit (if anything changed)**

```bash
git add -A && git commit -m "chore(comms-cal): regression pass for calendar create-meetings limb" || echo "nothing to commit"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- Trigger / conversational entry → Task 7 (docs) + Task 6 (CLI).
- Resolve attendees (incl. "skip-levels") → Task 4.
- Find times (own openings; Graph optional/not-built) → Tasks 2, 3 (busy read), 6.
- Draft agenda (grounded) → Task 5 + orchestrator prose (Task 7).
- In-chat slate approval → Task 7 procedure (no code surface, by design).
- Create editable, sendable invite via `.ics` + open; agent never sends → Tasks 3B, 6 (AppleScript create dropped per Task 1).
- No auto-record → enforced by omission; stated in Global Constraints + Task 7.
- Error handling (bridge down, calendar not addressable, unresolved attendee, per-meeting failure) → Tasks 4, 6, 7 + AppleScript `NO_CALENDAR` error.
- The three spec "verify in planning" items → Task 1 (create-path spike: AppleScript can't make a reviewable unsent invite → pivoted to `.ics`; busy-read + calendar locator verified) and Task 7/agent-doc note (Graph free/busy not built in v1).

**Refinement vs. spec:** the spec described a `POST /meeting` HTTP bridge route and an `agenda.ts` module. This plan instead uses the **CLI/`execFile`** transport (consistent with the email `gather.ts` side, since the orchestrator is Claude Code, not the browser) and replaces `agenda.ts` with `agenda-context.ts` (grounding gatherer) + orchestrator-written prose (agenda text is LLM work, not a pure function). Both are deliberate simplifications that reduce moving parts (no bridge server needed for v1); noted here so the change from the spec is explicit.

**Placeholder scan:** none — every code step has complete code; every command has expected output.

**Type consistency:** `BusyBlock`/`Slot`/`MeetingSpec`/`ResolvedAttendee` defined in `schedule/types.ts` (Task 2); `BusyBlock` consumed in `calendar.ts` (Task 3); `MeetingSpec` consumed in `ics.ts` (Task 3B) and `run.ts` (Task 6). `rankSlots`/`pickSpread`/`resolveGroup`/`resolveNames`/`normalizeGroup`/`gatherAgendaContext`/`readBusy`/`buildBusyArgs`/`parseBusyOutput`/`buildIcs`/`createMeetingInvite`/`validateMeetingSpec` names are identical across their definition and call sites.
