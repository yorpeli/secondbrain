# Command Center — Skill B (Capture + Close-the-Day) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the middle arc of the daily loop — the MSFT Claude Code session's capture/close-the-day agent — by shipping the deterministic `capture.ts` helper, a salience ("People who matter today") block in Skill A, a VIPs convention, and the committed agent definition + thin trigger.

**Architecture:** The MSFT session can't reach Supabase, so its *behavior* is a committed markdown doc (`agents/command-center-capture.md`) it reads from the shared repo, and its *data* stays in the gitignored `command-center/`. A small `capture.ts` owns the deterministic bookkeeping — computing the lookback window from a `.last-capture` marker (since-last-capture, 3-day default, 7-day cap) and re-rendering the dashboard — while the model owns sweeping comms and writing markdown. Skill A (already shipped) gains a name-based who-matters block so the MSFT session can flag VIP/escalation signals.

**Tech Stack:** TypeScript via `tsx`; `@supabase/supabase-js` via `lib/supabase.ts` (Skill A only); `node:test` + `node:assert/strict`; reuses `writeDashboard` from `scripts/command-center/build-dashboard.ts`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-06-05-command-center-skill-b-capture-design.md](../specs/2026-06-05-command-center-skill-b-capture-design.md)

**Out of scope (later):** Skill C (write-back to Supabase); a dedicated dashboard "needs attention" zone; web-serving the dashboard; scheduling. Task 6 (live integration in the MSFT session) is a **manual** validation, not a coded task.

---

## File Structure

**Created:**
- `scripts/command-center/capture.ts` — `window` + `done` subcommands; pure `computeWindow` + injectable marker IO.
- `scripts/command-center/__tests__/capture.test.ts` — unit tests for `computeWindow` (3 branches) + marker round-trip.
- `agents/command-center-capture.md` — committed agent definition (modes, lookback, salience, format, people-harvest, privacy, CLI contract).
- `.claude/skills/command-center-capture/SKILL.md` — thin local trigger pointing to the agent doc (untracked, like every other skill here).
- `scripts/command-center/assets/people.starter.md` — committed starter for the durable people doc (VIPs + harvested).

**Modified:**
- `scripts/command-center/gather-context.ts` — add the "People who matter today" section.
- `scripts/command-center/scaffold.ts` — also copy `people.starter.md` → `context/people.md`.
- `scripts/command-center/assets/routing.starter.md` — replace the people section with a pointer to `people.md`.
- `command-center/context/routing.md` — mirror that pointer (local copy; gitignored).
- `package.json` — add `"command-center:capture"`.
- `CLAUDE.md` — add the Command Center capture trigger row.

---

## Task 1: `capture.ts` — window computation + marker + re-render

The deterministic core. `computeWindow` is pure and is the main test target; marker IO is injectable so tests never touch the real marker.

**Files:**
- Create: `scripts/command-center/capture.ts`
- Create: `scripts/command-center/__tests__/capture.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/command-center/capture.ts` with EXACTLY this content**

```typescript
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDashboard, todayIso } from './build-dashboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const MARKER = join(CC, '.last-capture')

const DAY_MS = 86_400_000
const DEFAULT_LOOKBACK_DAYS = 3
const MAX_LOOKBACK_DAYS = 7

export interface CaptureWindow {
  start: string
  end: string
  reason: 'marker' | 'default-3d' | 'capped-7d'
}

/**
 * Compute the capture lookback window. Pure — no IO.
 * - no marker        → start = now − 3d   (first run ever)
 * - marker ≤ 7d old  → start = marker     (incremental; Sunday reaches back to Thu)
 * - marker > 7d old  → start = now − 7d   (long gap — sweep the last week, not the whole gap)
 */
export function computeWindow(markerIso: string | null, now: Date): CaptureWindow {
  const end = now.toISOString()
  if (!markerIso) {
    return {
      start: new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'default-3d',
    }
  }
  const marker = new Date(markerIso)
  const ageMs = now.getTime() - marker.getTime()
  if (ageMs > MAX_LOOKBACK_DAYS * DAY_MS) {
    return {
      start: new Date(now.getTime() - MAX_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'capped-7d',
    }
  }
  return { start: marker.toISOString(), end, reason: 'marker' }
}

export function readMarker(path: string = MARKER): string | null {
  if (!existsSync(path)) return null
  const raw = readFileSync(path, 'utf8').trim()
  return raw || null
}

export function writeMarker(iso: string, path: string = MARKER): void {
  writeFileSync(path, iso, 'utf8')
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

// CLI: only run when invoked directly, not when imported (tests import the pure fns).
const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const sub = process.argv[2]
  if (sub === 'window') {
    console.log(JSON.stringify(computeWindow(readMarker(), new Date()), null, 2))
  } else if (sub === 'done') {
    const date = parseDateArg()
    writeMarker(new Date().toISOString())
    const out = writeDashboard(date)
    console.log(`marker stamped; dashboard written: ${out}`)
  } else {
    console.error('usage: capture <window|done> [--date=YYYY-MM-DD]')
    process.exit(1)
  }
}
```

- [ ] **Step 2: Write the test `scripts/command-center/__tests__/capture.test.ts` with EXACTLY this content**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync, existsSync } from 'node:fs'
import { computeWindow, readMarker, writeMarker } from '../capture.js'

const NOW = new Date('2026-06-07T09:00:00.000Z') // a Sunday

describe('computeWindow', () => {
  it('no marker → 3-day default lookback', () => {
    const w = computeWindow(null, NOW)
    assert.equal(w.reason, 'default-3d')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
    assert.equal(w.start, '2026-06-04T09:00:00.000Z')
  })

  it('marker within 7 days → start = marker (Sunday reaches back to Thursday)', () => {
    const thu = '2026-06-04T17:30:00.000Z'
    const w = computeWindow(thu, NOW)
    assert.equal(w.reason, 'marker')
    assert.equal(w.start, thu)
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })

  it('marker older than 7 days → capped at 7-day lookback', () => {
    const tenDaysAgo = '2026-05-28T09:00:00.000Z'
    const w = computeWindow(tenDaysAgo, NOW)
    assert.equal(w.reason, 'capped-7d')
    assert.equal(w.start, '2026-05-31T09:00:00.000Z')
    assert.equal(w.end, '2026-06-07T09:00:00.000Z')
  })
})

describe('marker IO round-trip', () => {
  it('writes then reads the same ISO timestamp; absent file → null', () => {
    const p = join(tmpdir(), `cc-marker-test-${process.pid}`)
    if (existsSync(p)) rmSync(p)
    assert.equal(readMarker(p), null)
    writeMarker('2026-06-07T09:00:00.000Z', p)
    assert.equal(readMarker(p), '2026-06-07T09:00:00.000Z')
    rmSync(p)
  })
})
```

- [ ] **Step 3: Run the tests — expect PASS**

Run: `node --import tsx --test scripts/command-center/__tests__/capture.test.ts`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 4: Add the npm script**

In `package.json` `scripts`, add (keep existing entries; valid JSON):

```json
"command-center:capture": "tsx scripts/command-center/capture.ts",
```

- [ ] **Step 5: Validate the CLI end-to-end**

Ensure the workspace exists, then exercise both subcommands:

```bash
npm run command-center:scaffold
# window with no marker yet → default-3d
npm run command-center:capture -- window
```
Expected: JSON with `"reason": "default-3d"` and a `start` ~3 days before now.

```bash
# done stamps the marker and re-renders today's dashboard
npm run command-center:capture -- done --date=$(date +%F)
```
Expected: prints `marker stamped; dashboard written: …/command-center/daily/<today>/dashboard.html`, and the marker file now exists:
Run: `cat command-center/.last-capture` → an ISO timestamp.

```bash
# window again now reads the marker → reason "marker"
npm run command-center:capture -- window
```
Expected: JSON with `"reason": "marker"` and `start` == the marker timestamp.

Confirm the marker is gitignored (under command-center/): `git status --porcelain command-center/` → empty.

- [ ] **Step 6: Commit**

```bash
git add scripts/command-center/capture.ts scripts/command-center/__tests__/capture.test.ts package.json
git commit -m "feat(command-center): capture window + marker + re-render helper"
```

---

## Task 2: Skill A salience block — "People who matter today"

Adds a name-based who-matters section to `01-focus.md` so the MSFT session can flag VIP/escalation signals. Uses only confirmed columns; joins in JS (no PostgREST embed). Emails are empty in this DB, so this is **name-based** by design.

**Files:**
- Modify: `scripts/command-center/gather-context.ts`

- [ ] **Step 1: Add a `buildWhoMatters` helper inside `gather-context.ts`**

Insert this function ABOVE the existing `async function buildFocusDoc(date: string)` definition (it takes the already-created supabase client as a parameter):

```typescript
interface PersonRow {
  id: string
  name: string
  type: string
  slug: string
}
interface StakeholderRow {
  person_id: string
  initiative_id: string
  role: string | null
}
interface InitiativeIdRow {
  id: string
  title: string
}

async function buildWhoMatters(
  supabase: ReturnType<typeof getSupabase>
): Promise<string> {
  // Leadership + direct reports (exclude Yonatan's own row).
  const { data: core, error: coreErr } = await supabase
    .from('people' as any)
    .select('id, name, type, slug')
    .eq('status', 'active')
    .in('type', ['leadership', 'direct-report'])
    .neq('slug', 'yonatan-orpeli')
  if (coreErr) throw coreErr
  const people = (core as unknown as PersonRow[]) ?? []
  const leadership = people.filter((p) => p.type === 'leadership').map((p) => p.name)
  const directs = people.filter((p) => p.type === 'direct-report').map((p) => p.name)

  // Active-initiative stakeholders — plain joins in JS (no embed).
  const { data: actInits, error: aiErr } = await supabase
    .from('initiatives' as any)
    .select('id, title')
    .eq('status', 'active')
  if (aiErr) throw aiErr
  const titleById = new Map<string, string>(
    ((actInits as unknown as InitiativeIdRow[]) ?? []).map((i) => [i.id, i.title])
  )

  const { data: stk, error: stkErr } = await supabase
    .from('initiative_stakeholders' as any)
    .select('person_id, initiative_id, role')
  if (stkErr) throw stkErr

  const { data: ppl, error: pplErr } = await supabase
    .from('people' as any)
    .select('id, name')
    .eq('status', 'active')
  if (pplErr) throw pplErr
  const nameById = new Map<string, string>(
    ((ppl as unknown as { id: string; name: string }[]) ?? []).map((p) => [p.id, p.name])
  )

  const stakeholderLines = ((stk as unknown as StakeholderRow[]) ?? [])
    .filter((s) => titleById.has(s.initiative_id) && nameById.has(s.person_id))
    .map(
      (s) =>
        `- ${nameById.get(s.person_id)} (${s.role ?? 'stakeholder'} · ${titleById.get(
          s.initiative_id
        )})`
    )

  const parts: string[] = []
  if (leadership.length) parts.push(`**Leadership:** ${leadership.join(', ')}`)
  if (directs.length) parts.push(`**Direct reports:** ${directs.join(', ')}`)
  if (stakeholderLines.length)
    parts.push(`**Active-initiative stakeholders:**\n${stakeholderLines.join('\n')}`)
  return parts.join('\n\n')
}
```

- [ ] **Step 2: Call it from `buildFocusDoc` and add the section to the returned doc**

Inside `buildFocusDoc`, after the `headline` block (step 4) and before the `return [ … ]`, add:

```typescript
  // 5. people who matter today (name-based salience for the MSFT capture agent)
  const whoMatters = await buildWhoMatters(supabase)
```

Then change the `return [ … ]` array to include the new section AFTER `Open Action Items` and BEFORE `Portfolio Headline`:

```typescript
  return [
    `# Focus — ${date}`,
    '',
    section('Current Focus', currentFocus),
    section('Active Initiatives', initiativesBody),
    section('Open Action Items', actionItems),
    section('People who matter today', whoMatters),
    section('Portfolio Headline', headline),
  ].join('\n')
```

- [ ] **Step 3: Run Skill A and verify the new section populates**

Run: `npm run command-center:gather`
Expected: `focus written:` + `dashboard written:`, no error.

Run: `sed -n '/## People who matter today/,/## Portfolio Headline/p' command-center/daily/$(date +%F)/01-focus.md`
Expected: a `**Leadership:**` line (Oren Ryngler, Yaron Zakai Or), a `**Direct reports:**` line (Elad Schnarch, Ira Martinenko, Yael Feldhiem, Ido Seter, Meital Lahat Dekter, Shilhav Ben David — names, order may vary), and a `**Active-initiative stakeholders:**` list with `- Name (role · Initiative)` lines. Yonatan's own name must NOT appear in Leadership.

- [ ] **Step 4: Commit**

```bash
git add scripts/command-center/gather-context.ts
git commit -m "feat(command-center): emit 'People who matter today' salience in Skill A"
```

---

## Task 3: Durable `people.md` doc (VIPs + harvest home)

Adds the durable people doc the MSFT session reads: manual VIPs Yonatan curates plus
a `## Harvested` section Skill B appends to. The committed starter is copied in by
`scaffold.ts`; `routing.md` gets a one-line pointer (VIPs move OUT of routing).

**Files:**
- Create: `scripts/command-center/assets/people.starter.md`
- Modify: `scripts/command-center/scaffold.ts`
- Modify: `scripts/command-center/assets/routing.starter.md`
- Modify: `command-center/context/routing.md` (local, gitignored — pointer only)
- Create (via scaffold): `command-center/context/people.md` (local, gitignored)

- [ ] **Step 1: Create the committed starter `scripts/command-center/assets/people.starter.md` with EXACTLY this content**

```markdown
# People — durable reference

> Read by the MSFT capture agent alongside today's `01-focus.md`.
> The DB-derived names (manager, direct reports, active-initiative stakeholders) are
> auto-emitted into `01-focus.md` by "gather context" — do NOT duplicate them here.
> This file holds what the DB doesn't: manually-curated VIPs + data harvested from
> comms. "gather context" never overwrites this file.

## VIPs (manual)
<!-- People to surface immediately if they appear in comms — especially those NOT in
the org DB. Add anyone the auto list in 01-focus.md won't catch. e.g.:
- John Caplan — CEO
- Bea Ordonez — CFO
- <key external partner / board member>
-->

## Harvested (from comms — proposed for the people table via Skill C)
<!-- The capture agent appends observations here when it sees missing/new people data.
One line per observation:
- <name> | email: <x> | <note, e.g. role / new face / which initiative> | seen <date>
Skill C later reconciles these into the people table (with confirmation). -->
```

- [ ] **Step 2: Make `scaffold.ts` copy `people.starter.md` → `context/people.md`**

In `scripts/command-center/scaffold.ts`, inside the `scaffold()` function, after the
existing `routing.md` copy block (the `const r = copyIfMissing(... 'routing.starter.md' ...)`
lines) and before the `console.log(...)` lines, add a third copy:

```typescript
  const p = copyIfMissing(
    join(ASSETS, 'people.starter.md'),
    join(CC, 'context', 'people.md')
  )
```

Then add a line to the existing console output (after the `context/routing.md` log line):

```typescript
  console.log(`  context/people.md: ${p}`)
```

- [ ] **Step 3: Turn the routing starter's people section into a pointer to `people.md`**

In `scripts/command-center/assets/routing.starter.md`, REPLACE the existing
`## People who matter this period` section (its heading and the HTML comment under it)
with this pointer:

```markdown
## People
See `people.md` in this folder — the durable people reference (manual VIPs + harvested
data). Today's DB-derived who-matters is in `01-focus.md`.
```

- [ ] **Step 4: Mirror the pointer into the already-scaffolded local routing.md**

The local `command-center/context/routing.md` won't be overwritten by `scaffold.ts`
(copy-if-missing). Apply the same change by hand: replace its
`## People who matter this period` heading + comment with the same `## People`
pointer block from Step 3.

- [ ] **Step 5: Scaffold so the local `people.md` is created, and verify**

Run: `npm run command-center:scaffold`
Expected: prints `context/people.md: copied` (and `kept` for the already-present template + routing).

Run: `ls command-center/context/` → shows `people.md` and `routing.md`.
Run: `grep -n "## VIPs\|## Harvested" command-center/context/people.md` → both headings present.
Run: `grep -n "people.md" command-center/context/routing.md` → the pointer is present.
Run: `git status --porcelain command-center/` → empty (local files stay gitignored).

- [ ] **Step 6: Commit (committed assets + scaffold only — local copies are gitignored)**

```bash
git add scripts/command-center/assets/people.starter.md scripts/command-center/assets/routing.starter.md scripts/command-center/scaffold.ts
git commit -m "feat(command-center): durable people.md doc (VIPs + harvest) + scaffold"
```

---

## Task 4: The committed agent definition

The full behavior doc the MSFT Claude Code session follows. Committed (web/GitHub-portable), version-controlled.

**Files:**
- Create: `agents/command-center-capture.md`

- [ ] **Step 1: Create `agents/command-center-capture.md` with EXACTLY this content**

````markdown
# Command Center — Capture Agent (Skill B)

The capture/close-the-day agent for the **MSFT Claude Code session** (Teams +
SharePoint + mail + calendar; no Supabase). It is the middle arc of the daily
loop — it sweeps comms and feeds the living dashboard, writing only into the
gitignored `command-center/` workspace. See
`docs/superpowers/specs/2026-06-05-command-center-skill-b-capture-design.md`.

This session reaches the database only through files: it reads what this (Supabase)
session exports, and writes captures back as files. It never writes to Supabase —
that is Skill C (a separate, confirm-gated step).

## What this session can see
- **Reads:** `command-center/context/people.md` (durable: manual VIPs + harvested),
  `command-center/context/routing.md` (the "where to read" index) and today's
  `command-center/daily/<date>/01-focus.md` (DB-derived focus + "People who matter
  today"). These define *what matters* — do not re-derive from scratch.
- **Sweeps:** Teams (1:1 + channel chatter, meeting transcripts/recordings if
  reachable), SharePoint (doc changes in watched spaces), mail, calendar.
- **Writes:** `command-center/daily/<date>/02-captures.md` (captures), on
  close-the-day `03-summary.md`, and the `## Harvested` section of
  `command-center/context/people.md` (people-data deltas). Nothing else — never
  Supabase.

## Modes (one agent, phrase-driven)

### Capture — triggers: "scan", "capture", "what's new"
Frictionless. Run several times a day. NO confirmation.

1. `npm run command-center:capture -- window` → returns `{ start, end, reason }`.
   Sweep comms for `start..end` only.
2. Read `people.md` (VIPs + harvested) + `01-focus.md` ("People who matter today").
   Union them into your salience list.
3. Sweep Teams + SharePoint + mail + calendar for the window.
4. Compose ONE timestamped block (format below) and **append** it to
   `command-center/daily/<date>/02-captures.md` (create the file if absent; never
   overwrite existing blocks).
5. If you saw missing/new people data (an email for someone, a recurring new face, a
   role change), append a delta line to the `## Harvested` section of `people.md`
   (format below). This improves the next match and queues it for Skill C.
6. `npm run command-center:capture -- done --date=<date>` → stamps the marker and
   re-renders the dashboard.
7. Tell Yonatan what you appended in one line, and call out anything under
   ⚡ Needs attention.

### Close the day — triggers: "close out the day", "wrap up"
CONFIRM-GATED.

1. Read the full `02-captures.md` for the day.
2. Draft `03-summary.md`: a short day narrative + proposed follow-ups, each tagged
   to a person/initiative and a suggested destination for Skill C (initiative
   memory / action item / current_focus).
3. **Show Yonatan the draft and wait for explicit approval.** Do NOT write on a guess.
4. On approval: write `03-summary.md`, then
   `npm run command-center:capture -- done --date=<date>` to re-render.

## Salience — what floats to the top (⚡ Needs attention)
Flag, at the top of the capture block:
- Anything from/about a person in your unioned salience list (VIPs + leadership +
  direct reports + active-initiative stakeholders).
- Meeting cancellations / reschedules of meetings Yonatan owns or attends.
- Explicit escalations, blockers, or anything marked urgent.
If none, omit the ⚡ line.

## Capture block format
Append to `02-captures.md` (the dashboard renders newest-first automatically):

```markdown
## HH:MM — <one-line headline of the window>
**⚡ Needs attention:** <VIP email / cancelled meeting / escalation — omit if none>
**Teams:** <signals, tied to [initiative] / [person] where possible>
**SharePoint:** <doc changes in watched spaces>
**Mail/Calendar:** <important mail, calendar changes>
```

Use `HH:MM` in local time. Tie items to initiatives/people by name where possible
(match against `01-focus.md`). Keep it tight — one block per capture run.

## People-data harvest (you are also a source)
The DB's emails are empty and new people surface in comms. When you notice missing or
new people data, append ONE line per observation to the `## Harvested` section of
`command-center/context/people.md`:

```markdown
- <name> | email: <x or —> | <note: role / new face / which initiative> | seen <YYYY-MM-DD>
```

Only record real, useful signal (a confirmed email, a recurring relevant person, a
clear role change) — not every name you see. This improves the next capture's matching
and is the queue Skill C reconciles into the `people` table (with Yonatan's
confirmation). Do not edit the `## VIPs (manual)` section — that is Yonatan's.

## Lookback (handled for you by `capture window`)
- First run ever → last 3 days.
- Normal → since your last capture (so Sunday's first run reaches back across the
  weekend automatically).
- Long gap (>7 days) → last 7 days only.
Never sweep further back than `start`.

## Privacy
- Raw comms stay in `command-center/` (gitignored). Never paste full sensitive or
  personal threads — summarize, and for sensitive/personal items write a one-line
  `sensitive — not detailed` placeholder instead of content.
- Never write to Supabase. Never commit `command-center/`.

## CLI contract (this repo, shared filesystem)
```
npm run command-center:capture -- window [--date=YYYY-MM-DD]   # → { start, end, reason }
npm run command-center:capture -- done --date=YYYY-MM-DD       # stamp marker + re-render
npm run command-center:dashboard -- --date=YYYY-MM-DD          # re-render only (rarely needed)
```
````

- [ ] **Step 2: Verify it reads cleanly and references real commands**

Run: `grep -n "command-center:capture\|02-captures.md\|03-summary.md\|⚡" agents/command-center-capture.md | head`
Expected: matches for the CLI commands, both file names, and the ⚡ marker — confirming the doc is intact.

- [ ] **Step 3: Commit**

```bash
git add agents/command-center-capture.md
git commit -m "docs(command-center): committed capture agent definition (Skill B)"
```

---

## Task 5: Thin local trigger + CLAUDE.md row

A thin skill that points the local CLI to the committed agent doc, plus documentation of the trigger in CLAUDE.md.

**Files:**
- Create: `.claude/skills/command-center-capture/SKILL.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Create `.claude/skills/command-center-capture/SKILL.md` with EXACTLY this content**

```markdown
---
name: command-center-capture
description: Use in the MSFT Claude Code session when Yonatan says "scan",
  "capture", "what's new" (intraday capture) or "close out the day", "wrap up"
  (end-of-day summary) for the command center. Sweeps Teams/SharePoint/mail/
  calendar and feeds the living dashboard.
---

# Command Center — Capture Agent (Skill B)

Your full behavior is defined in the committed agent doc. On trigger:

1. Read `agents/command-center-capture.md` and follow it exactly.
2. It is the source of truth — modes (capture vs close-the-day), the lookback,
   salience rules, capture format, and privacy all live there.

Quick reference (the doc has the detail):
- Capture: `npm run command-center:capture -- window` → sweep that window → append
  a block to `command-center/daily/<date>/02-captures.md` → `npm run command-center:capture -- done --date=<date>`.
- Close the day: draft `03-summary.md`, show Yonatan, get approval, then write +
  `done`.
- `command-center/` is gitignored — never commit it; never write to Supabase.
```

- [ ] **Step 2: Add a Command Center capture trigger row to `CLAUDE.md`**

In `CLAUDE.md`, find the **"Command Center — natural-language trigger"** subsection added in the previous slice (it has the "gather context" / "refresh the dashboard" table). Replace that subsection's table with this expanded version that adds the capture/close rows (keep the bold intro paragraph above the table unchanged; only the table rows change — add the two new rows at the end):

```markdown
| Yonatan says (or similar) | You do |
|---|---|
| "gather context", "morning brief", "start the day" | First run: `npm run command-center:scaffold`. Then `npm run command-center:gather` → `open command-center/daily/$(date +%F)/dashboard.html`. Skim `01-focus.md`; curate if useful and re-render with `npm run command-center:dashboard -- --date=$(date +%F)`. |
| "refresh the dashboard" | `npm run command-center:dashboard -- --date=$(date +%F)` + open. |
| "scan" / "capture" / "what's new" *(MSFT session)* | Follow `agents/command-center-capture.md` capture mode: `command-center:capture -- window` → sweep Teams/SharePoint/mail/calendar → append a block to `02-captures.md` → `command-center:capture -- done --date=$(date +%F)`. |
| "close out the day" / "wrap up" *(MSFT session)* | Follow `agents/command-center-capture.md` close mode: draft `03-summary.md`, show Yonatan, get approval, write it, then `command-center:capture -- done --date=$(date +%F)`. |
```

- [ ] **Step 3: Verify the local skill loads and CLAUDE.md is intact**

Run: `head -6 .claude/skills/command-center-capture/SKILL.md`
Expected: valid YAML frontmatter with `name: command-center-capture`.

Run: `grep -c "command-center-capture\|02-captures.md\|close out the day" CLAUDE.md`
Expected: non-zero (the new rows reference the agent doc + capture flow).

- [ ] **Step 4: Commit (CLAUDE.md only — the skill is local/untracked, matching repo convention)**

```bash
git add CLAUDE.md
git commit -m "docs(command-center): capture agent trigger rows in CLAUDE.md"
```

Note: `.claude/skills/command-center-capture/SKILL.md` stays untracked on disk (do NOT `git add` it — every other skill in this repo is local/untracked).

---

## Task 6: Live integration pass (MANUAL — not a coded task)

Not for a subagent. After Tasks 1-5 land, Yonatan runs this in the **MSFT Claude Code session**:
1. "gather context" here first (so today's `01-focus.md` + dashboard exist with the who-matters block).
2. In the MSFT session: "scan" → confirm a block lands in `02-captures.md`, `⚡ Needs attention` surfaces real VIP/cancellation signal, the marker advances, and the dashboard re-renders newest-first.
3. "close out the day" → confirm the draft-and-approve gate works and `03-summary.md` renders.
Report back any rough edges to tune the agent doc.

---

## Self-Review

**Spec coverage (against `2026-06-05-command-center-skill-b-capture-design.md`):**
- Behavior-in-`agents/` + thin local skill + gitignored data → Tasks 4, 5.
- Two phrase-driven modes; close-the-day confirm-gated → Task 4 (agent doc), Task 5 (triggers).
- `capture window`/`done`, marker, 3-day default / 7-day cap, all three branches → Task 1.
- Durable people doc + hybrid salience: `people.md` (manual VIPs + harvested, Task 3) + DB-derived "People who matter today" emitted by Skill A (Task 2), unioned by the agent (Task 4); `routing.md` becomes a pointer.
- People-data harvest loop (Skill B → `## Harvested` deltas → Skill C) → Task 4 (agent doc).
- Capture block format + ⚡ needs-attention + newest-first → Task 4 (uses the existing renderer; no dashboard change, per spec).
- Privacy (local-only, sensitive placeholder, no Supabase writes) → Task 4.
- Lookback robustness incl. Sunday/weekend → Task 1 (`computeWindow`), validated in tests.
- Live integration → Task 6 (manual).

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". Every code step carries full code; every run step has an exact command + expected output. The agent doc and skill bodies are given verbatim.

**Type consistency:** `computeWindow(markerIso, now) → CaptureWindow {start,end,reason}`, `readMarker(path?)`, `writeMarker(iso, path?)` defined in Task 1 and used consistently in its tests. `buildWhoMatters(supabase)` (Task 2) returns a string consumed by `section('People who matter today', whoMatters)`, matching the existing `section(title, body)` helper and `return [...]` shape in `gather-context.ts`. CLI subcommands (`window`, `done`) and npm script name (`command-center:capture`) match across Tasks 1, 4, 5. Marker path (`command-center/.last-capture`) consistent across Task 1 and the agent doc.
