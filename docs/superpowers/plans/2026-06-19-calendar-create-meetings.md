# Calendar "Create Meetings" Limb — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversational "set up meetings" capability to the comms assistant that resolves attendees, proposes times against the user's real calendar, drafts a per-meeting agenda, and — on in-chat approval — opens each invite as an **unsent draft** in Outlook for the user to add a join link and send himself.

**Architecture:** Claude Code orchestrates (resolve → find times → draft agenda → in-chat slate → create drafts), calling local CLI primitives. The create path uses `osascript` via `execFile` (the same pattern as the email `gather.ts` side — **not** the HTTP `/draft` bridge route, which exists only for the browser app). Pure logic (slot ranking, arg building) is isolated and unit-tested; AppleScript is verified manually. No Graph required for v1; no event is ever sent (`send meeting` is never called).

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Node `node:test` + `node:assert/strict`, `osascript`/AppleScript against Microsoft Outlook for Mac, Supabase (`@supabase/supabase-js` via `lib/supabase.ts`), `searchByType` from `lib/embeddings.ts`.

## Global Constraints

- **Never send.** The AppleScript creates a draft (`make new calendar event`) and **never** calls the `send meeting` command. The user sends from Outlook.
- **No auto-record.** v1 does NOT write created meetings into `meetings` / `meeting_attendees` / `agent_log`. Normal calendar sync owns the record.
- **Local-only create path.** The create + calendar-read paths use `osascript` via `execFile`; no Azure/Graph dependency. Graph free/busy is optional enrichment only and is NOT built in v1.
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
- `comms-assistant/outlook-bridge/calendar.ts` — `execFile` wrappers + **pure** arg builders/validators for the two AppleScript modes (`busy`, `meeting`).
- `comms-assistant/outlook-bridge/__tests__/calendar.test.ts` — unit tests for the pure arg builders/validators.
- `comms-assistant/outlook-bridge/calendar.applescript` — two modes: `busy` (read events → JSON) and `meeting` (create unsent draft + open).

**Modify:**
- `comms-assistant/run.ts` — add `schedule:resolve`, `schedule:busy`, `schedule:find-times`, `schedule:agenda-context`, `schedule:draft-meeting` CLI commands.
- `agents/comms-assistant.md` — document the trigger + procedure.
- `comms-assistant/CLAUDE.md` — add the "set up meetings" procedure to the folder index.
- `CLAUDE.md` (root) — one line in the comms-assistant row noting the calendar limb.

---

## Task 1: Spike — verify the calendar create-draft + read paths live

This de-risks everything: confirm New/Legacy Outlook actually honors `make new calendar event` with attendees as an **unsent draft** (Send button), that opening it works, and that the `busy` read returns real events. AppleScript can't be unit-tested in CI, so this is a one-time manual verification. **If it fails, STOP and report** (per the spec's error-handling) — the local create path is the whole premise.

**Files:**
- Create: `comms-assistant/outlook-bridge/calendar.applescript`

**Interfaces:**
- Produces: `calendar.applescript` with `on run argv` dispatching `argv item 1` ∈ {`busy`, `meeting`}; consumed by `calendar.ts` (Task 5).

- [ ] **Step 1: Write the AppleScript with both modes**

Create `comms-assistant/outlook-bridge/calendar.applescript`:

```applescript
-- Calendar bridge for the comms assistant.
-- Modes:
--   busy <startEpochDays-ignored> ...        (see below) — read events in a window → JSON lines
--   meeting <subj> <bodyHtml> <attendeesCsv> <sy> <smo> <sd> <sh> <smi> <ey> <emo> <ed> <eh> <emi> <location>
-- NEVER calls `send meeting` — the event is left as an unsent draft and opened for review.

on trimText(s)
	set s to s as string
	repeat while s starts with " "
		set s to text 2 thru -1 of s
	end repeat
	repeat while s ends with " "
		set s to text 1 thru -2 of s
	end repeat
	return s
end trimText

-- Build a local AppleScript date from numeric components, guarding month/day overflow.
on makeDate(y, mo, d, h, mi)
	set theDate to current date
	set day of theDate to 1
	set year of theDate to (y as integer)
	set month of theDate to (mo as integer)
	set day of theDate to (d as integer)
	set hours of theDate to (h as integer)
	set minutes of theDate to (mi as integer)
	set seconds of theDate to 0
	return theDate
end makeDate

-- Pick the real calendar: the one with the most events. `default calendar` errors (-1728)
-- and `calendar 1` is an empty placeholder, so neither is usable.
on realCalendar()
	tell application "Microsoft Outlook"
		set theCal to missing value
		set maxEvt to -1
		repeat with c in calendars
			set ec to (count of calendar events of c)
			if ec > maxEvt then
				set maxEvt to ec
				set theCal to c
			end if
		end repeat
		if theCal is missing value then error "NO_CALENDAR: no addressable calendar" number 2
		return theCal
	end tell
end realCalendar

-- Format an AppleScript date as naive local "YYYY-MM-DDTHH:MM".
on fmtNaive(d)
	set y to year of d as integer
	set mo to (month of d as integer)
	set dy to day of d as integer
	set hh to hours of d as integer
	set mm to minutes of d as integer
	set p2 to "0"
	set moS to text -2 thru -1 of (p2 & mo)
	set dyS to text -2 thru -1 of (p2 & dy)
	set hhS to text -2 thru -1 of (p2 & hh)
	set mmS to text -2 thru -1 of (p2 & mm)
	return (y as string) & "-" & moS & "-" & dyS & "T" & hhS & ":" & mmS
end fmtNaive

on run argv
	set theMode to item 1 of argv
	tell application "Microsoft Outlook"
		if theMode is "busy" then
			-- busy <sy> <smo> <sd> <ey> <emo> <ed>  (inclusive day window, midnight..midnight+1)
			set winStart to my makeDate(item 2 of argv, item 3 of argv, item 4 of argv, 0, 0)
			set winEnd to my makeDate(item 5 of argv, item 6 of argv, item 7 of argv, 23, 59)
			set theCal to my realCalendar()
			set out to ""
			repeat with e in (calendar events of theCal whose start time is greater than or equal to winStart and start time is less than or equal to winEnd)
				try
					if (all day flag of e) is false then
						set out to out & my fmtNaive(start time of e) & "|" & my fmtNaive(end time of e) & linefeed
					end if
				end try
			end repeat
			return out
		else if theMode is "meeting" then
			set theSubject to item 2 of argv
			set theBody to item 3 of argv
			set attendeesCsv to item 4 of argv
			set startDate to my makeDate(item 5 of argv, item 6 of argv, item 7 of argv, item 8 of argv, item 9 of argv)
			set endDate to my makeDate(item 10 of argv, item 11 of argv, item 12 of argv, item 13 of argv, item 14 of argv)
			set theLocation to ""
			if (count of argv) ≥ 15 then set theLocation to item 15 of argv
			set theCal to my realCalendar()
			set ev to make new calendar event at theCal with properties {subject:theSubject, content:theBody, start time:startDate, end time:endDate}
			if theLocation is not "" then set location of ev to theLocation
			set AppleScript's text item delimiters to ","
			repeat with addrRef in (text items of attendeesCsv)
				set addr to my trimText(addrRef as string)
				if addr is not "" then
					make new required attendee at ev with properties {email address:{address:addr}}
				end if
			end repeat
			set AppleScript's text item delimiters to ""
			-- DRAFT ONLY: never `send meeting`. Open for the user to add a join link + send.
			open ev
			activate
			return "OK"
		else
			error "BAD_MODE: " & theMode number 3
		end if
	end tell
end run
```

- [ ] **Step 2: Verify the `busy` read returns real events**

Run (adjust the window to a week you know has events):

```bash
osascript comms-assistant/outlook-bridge/calendar.applescript busy 2026 6 16 2026 6 20
```

Expected: one or more lines like `2026-06-17T10:00|2026-06-17T10:30`. If empty for a known-busy week, debug the calendar locator before continuing.

- [ ] **Step 3: Verify the `meeting` create path against a THROWAWAY event**

Run (use your own email so the invite would only go to you; pick a clearly-fake time):

```bash
osascript comms-assistant/outlook-bridge/calendar.applescript meeting "ZZZ DELETE ME spike" "test body" "yorpeli@gmail.com" 2027 1 5 9 0 2027 1 5 9 30 ""
```

Expected: prints `OK`; an Outlook window opens showing a **meeting** titled "ZZZ DELETE ME spike" with you as a required attendee and a **Send** button (i.e. it is an unsent draft, NOT auto-sent).

- [ ] **Step 4: Confirm it did NOT send, then delete the throwaway**

Visually confirm no invitation was sent (no "sent" state). Close the window **without sending** and delete the "ZZZ DELETE ME spike" event from your calendar.

- [ ] **Step 5: Record the verification result**

If all three behaviors hold, note it in the commit message and proceed. If creating the event auto-sends, or it lands in the wrong calendar, or no Send button appears — **STOP** and report; the design's draft-only premise needs revisiting before any more work.

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/outlook-bridge/calendar.applescript
git commit -m "feat(comms-cal): calendar.applescript busy+meeting modes (draft-only, verified live)"
```

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

## Task 3: Calendar AppleScript arg builders/validators (`calendar.ts`)

**Files:**
- Create: `comms-assistant/outlook-bridge/calendar.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/calendar.test.ts`

**Interfaces:**
- Consumes: `MeetingSpec`, `BusyBlock` from `../schedule/types.js`.
- Produces:
  - `validateMeetingSpec(input: unknown): { ok: true; value: MeetingSpec } | { ok: false; error: string }`
  - `buildMeetingArgs(scriptPath: string, spec: MeetingSpec): string[]`
  - `buildBusyArgs(scriptPath: string, windowStartDay: string, windowEndDay: string): string[]`
  - `parseBusyOutput(stdout: string): BusyBlock[]`
  - `readBusy(windowStartDay: string, windowEndDay: string): Promise<BusyBlock[]>` (execFile)
  - `createMeetingDraft(spec: MeetingSpec): Promise<void>` (execFile; throws on non-OK)

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/calendar.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test comms-assistant/outlook-bridge/__tests__/calendar.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/calendar.ts comms-assistant/outlook-bridge/__tests__/calendar.test.ts
git commit -m "feat(comms-cal): calendar.ts execFile wrappers + pure arg builders/validators"
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
import { readBusy, createMeetingDraft, validateMeetingSpec } from './outlook-bridge/calendar.js'
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
      // --payload=<MeetingSpec>. Creates ONE unsent draft meeting in Outlook and opens it.
      const v = validateMeetingSpec(payload())
      if (!v.ok) throw new Error(v.error)
      await createMeetingDraft(v.value)
      console.log(JSON.stringify({ drafted: v.value.subject, start: v.value.start }))
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
//   schedule:draft-meeting --payload=<MeetingSpec>  create ONE unsent Outlook draft + open it
```

- [ ] **Step 4: Smoke-test each command (non-mutating ones first)**

```bash
npx tsx comms-assistant/run.ts schedule:resolve --group=skip-levels
npx tsx comms-assistant/run.ts schedule:busy --window=2026-06-16..2026-06-20
echo '{"windowStartDay":"2026-06-22","windowEndDay":"2026-06-25","durationMin":30,"busy":[],"nowNaive":"2026-06-19T09:00","count":3}' > /tmp/ft.json
npx tsx comms-assistant/run.ts schedule:find-times --payload=/tmp/ft.json
```

Expected: resolve prints attendees with emails; busy prints your real busy blocks; find-times prints 3 spread slots. (If you are not on the Mac / Outlook is closed, `schedule:busy` will error — that is expected off-device.)

- [ ] **Step 5: Smoke-test the mutating draft command with a throwaway**

```bash
echo '{"subject":"ZZZ DELETE ME cli","body":"agenda line 1\nagenda line 2","attendees":["yorpeli@gmail.com"],"start":"2027-01-06T09:00","end":"2027-01-06T09:30","location":"Zoom"}' > /tmp/mtg.json
npx tsx comms-assistant/run.ts schedule:draft-meeting --payload=/tmp/mtg.json
```

Expected: prints `{"drafted":"ZZZ DELETE ME cli",...}` and opens an unsent draft in Outlook. Confirm it did not send, close without sending, and delete the event.

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

Triggers: "set up meetings with X", "schedule 1:1s with my skip-levels", "book time with my directs next week". **Create-only** (responding to invites is a future v2). The agent proposes; Yonatan approves in chat; the bridge opens **unsent drafts** in Outlook; **Yonatan adds the Teams/Zoom link and sends himself** (never the agent — preserves read-only MSFT).

1. **Resolve attendees.** Groups: `npx tsx comms-assistant/run.ts schedule:resolve --group=skip-levels` (or `directs`, or `--names=elad-schnarch,ira-martinenko`). Flag any `unresolved` — never invent an email.
2. **Read your own availability.** `schedule:busy --window=YYYY-MM-DD..YYYY-MM-DD` (local osascript; your calendar only). Attendee free/busy is NOT available locally — note that proposed times are based on your openings; invitees accept or counter.
3. **Rank times.** Feed busy blocks into `schedule:find-times --payload=<{windowStartDay,windowEndDay,durationMin,busy,nowNaive,count}>`. Defaults: 30-min, Sun–Thu, 09:00–18:00, no 13:00 lunch slot, 15-min buffer. Pass `count` = number of meetings to spread one-per-day.
4. **Draft an agenda per meeting.** `schedule:agenda-context --slug=<person>` returns current focus + recent 1:1s + open action items + narrative. **You write the agenda prose** from that material (ground via `searchByType` if you want more) — keep it short and specific.
5. **Present the slate in chat** — one row per meeting: attendee · proposed time · agenda summary. Yonatan approves or edits inline ("move Elad to Thursday", "drop the X line").
6. **Create drafts on approval.** For each meeting: `schedule:draft-meeting --payload=<MeetingSpec>` (`{subject,body,attendees[email],start,end,location?}`). This opens an **unsent** draft in Outlook. Each meeting is independent — report per-row failures, don't abort the batch.
7. **Hand off.** Tell Yonatan the drafts are open; he adds the join link and sends. **No auto-record** — normal calendar sync owns the record.

Requires Outlook for Mac running locally (calendar AppleScript verified live). If `schedule:busy` returns nothing for a known-busy window, the calendar isn't addressable — report it rather than guessing.
```

- [ ] **Step 2: Add to the folder index**

In `comms-assistant/CLAUDE.md`, under the `## Files` section, add to the `outlook-bridge/` description (or as a new bullet near it):

```markdown
- **Calendar create flow** (`schedule/` + `outlook-bridge/calendar.*`): `schedule:resolve` (attendees/org-groups) · `schedule:busy` (your own free/busy, local osascript) · `schedule:find-times` (pure slot ranking — Sun–Thu, 9–18, skip lunch, 15-min buffer) · `schedule:agenda-context` (grounding for the agenda) · `schedule:draft-meeting` (create ONE **unsent** Outlook draft + open). **Never sends** (Yonatan adds the join link + sends). **No auto-record.** Full procedure: [../agents/comms-assistant.md](../agents/comms-assistant.md).
```

- [ ] **Step 3: Note the limb in the root CLAUDE.md**

In `CLAUDE.md` (root), in the Comms Assistant row of the agent table, append to the purpose cell:

```markdown
Also a calendar **create-meetings** limb: resolve attendees → find times (your openings) → draft agenda → in-chat approval → bridge opens **unsent** Outlook drafts (you add the join link + send; never auto-sent; no auto-record).
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
Expected: all tests pass (find-times 5, meeting-request 3, calendar 6, plus the existing bridge tests).

- [ ] **Step 2: Confirm no throwaway events remain**

Check the calendar for any `ZZZ DELETE ME` events from spikes/smokes and delete them.

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
- Create unsent draft + open, never `send meeting` → Tasks 1, 3, 6.
- No auto-record → enforced by omission; stated in Global Constraints + Task 7.
- Error handling (bridge down, calendar not addressable, unresolved attendee, per-meeting failure) → Tasks 4, 6, 7 + AppleScript `NO_CALENDAR` error.
- The three spec "verify in planning" items → Task 1 (write path + calendar locator) and Task 7/agent-doc note (Graph free/busy not built in v1).

**Refinement vs. spec:** the spec described a `POST /meeting` HTTP bridge route and an `agenda.ts` module. This plan instead uses the **CLI/`execFile`** transport (consistent with the email `gather.ts` side, since the orchestrator is Claude Code, not the browser) and replaces `agenda.ts` with `agenda-context.ts` (grounding gatherer) + orchestrator-written prose (agenda text is LLM work, not a pure function). Both are deliberate simplifications that reduce moving parts (no bridge server needed for v1); noted here so the change from the spec is explicit.

**Placeholder scan:** none — every code step has complete code; every command has expected output.

**Type consistency:** `BusyBlock`/`Slot`/`MeetingSpec`/`ResolvedAttendee` defined in `schedule/types.ts` (Task 2) and consumed unchanged in `calendar.ts` (Task 3), `meeting-request.ts` (Task 4), and `run.ts` (Task 6). `rankSlots`/`pickSpread`/`resolveGroup`/`resolveNames`/`normalizeGroup`/`gatherAgendaContext`/`readBusy`/`createMeetingDraft`/`validateMeetingSpec` names are identical across their definition and call sites.
