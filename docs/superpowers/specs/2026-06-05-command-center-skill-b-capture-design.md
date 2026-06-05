# Command Center — Skill B (Capture + Close-the-Day) Design

**Date:** 2026-06-05
**Status:** Approved design — ready for implementation planning
**Parent design:** [2026-06-05-command-center-daily-loop-design.md](2026-06-05-command-center-daily-loop-design.md)
**Author:** Yonatan + Claude Code (Supabase session)

## Problem

Slice 1 built the morning arc: this (Supabase) session assembles `01-focus.md` and
renders a living dashboard. The middle arc is missing — nothing pulls the day's
real signal. The richest real-time intel (Teams chatter, SharePoint docs, mail,
calendar) lives behind MSFT tools in a **separate Claude Code session that cannot
reach Supabase**. Skill B is that session's daily agent: it sweeps comms, surfaces
what needs attention, and feeds the dashboard — writing only into the shared,
gitignored `command-center/` folder.

## Surfaces (recap)

| Surface | Reaches | Role |
|---|---|---|
| This Claude Code | Supabase + repo | Skill A (morning) + Skill C (close-the-loop, future) |
| **MSFT Claude Code** | **Teams + SharePoint + mail + calendar** + filesystem + GitHub; **no Supabase** | **Skill B (this design)** |

Both sessions share the same machine/filesystem and the same `.claude/skills/`
folder and repo. That shared filesystem is the handoff.

## Core decisions

1. **One skill, two phrase-driven modes.** Capture (frictionless, repeatable) and
   Close-the-day (confirm-gated).
2. **Behavior lives in a committed doc; data stays local.** The agent definition
   is `agents/command-center-capture.md` (version-controlled, GitHub/web-reachable,
   syncable to Supabase like other agent docs). A thin local skill points to it.
   Raw comms stay in the gitignored `command-center/`.
3. **Lookback = "since last capture" marker.** No day-of-week logic; Sunday and any
   other gap (holiday, sick day, skipped capture) fall out automatically.
4. **Salience is hybrid** — a manually-curated VIP list plus a DB-derived
   who-matters list — unioned for "⚡ needs attention."
5. **Deterministic bookkeeping is scripted; content is model-generated.** A small
   `capture.ts` owns the window calc, the marker, and the re-render. The MSFT
   session owns sweeping comms and writing the markdown.

## Why behavior-in-`agents/`, not `.claude/skills/`

`command-center/` is gitignored (private, local) and `.claude/skills/` is a Claude
Code CLI feature — **neither is web-readable**. To keep the option of driving or
reading the agent from a web surface (claude.ai) later, the *behavior* must be
committed. This matches the repo's existing convention: every agent has a committed
`agents/*.md` definition with a thin trigger (e.g., `agents/outlook-agent.md`).

- **Behavior (committed, portable):** `agents/command-center-capture.md`
- **Local trigger (thin):** `.claude/skills/command-center-capture/SKILL.md` → "follow `agents/command-center-capture.md`"
- **Data (gitignored, local):** `command-center/daily/<date>/`

## The two modes

### Capture — "scan" / "capture" / "what's new"
Frictionless, run several times a day. No confirmation.

1. Run `capture window` → get the lookback window `{ start, end }`.
2. Read `command-center/context/routing.md` (manual VIPs + routing) and today's
   `command-center/daily/<date>/01-focus.md` (DB-derived who-matters + focus).
3. Sweep **Teams + SharePoint + mail + calendar** for `start..end`.
4. Compose one timestamped block and **append** it to
   `command-center/daily/<date>/02-captures.md`.
5. Run `capture done --date=<date>` → stamps `.last-capture` and re-renders the
   dashboard.

### Close the day — "close out the day" / "wrap up"
Confirm-gated.

1. Read the full `02-captures.md` for the day.
2. Draft `03-summary.md` (day narrative + proposed follow-ups, each tagged to a
   person/initiative and a suggested destination for Skill C).
3. **Show Yonatan the draft and wait for explicit approval.** Do not write on a
   guess.
4. On approval: write `03-summary.md`, then run `capture done --date=<date>` to
   re-render.

## Lookback mechanism

A marker file `command-center/.last-capture` holds an ISO timestamp.

`capture window` logic (`end` is always now):
- **Marker absent** (first run ever) → `start` = now − **3 days**, `reason: "default-3d"`.
- **Marker present, ≤ 7 days old** → `start` = marker, `reason: "marker"`. (The common
  case: mid-week incrementals, and Sunday reaching back to Thursday.)
- **Marker present, > 7 days old** (long gap — vacation, leave) → `start` = now − **7 days**,
  `reason: "capped-7d"`. Sweep the last week rather than the whole gap.
- Output: JSON `{ "start": ISO, "end": ISO, "reason": "marker" | "default-3d" | "capped-7d" }`.

All three branches are reachable, so each has a dedicated unit test.

`capture done` sets the marker to `end` (now) after a successful capture, so the
next run is incremental. Sunday's first run naturally sees a Thursday-evening
marker and sweeps Fri–Sat–Sun. The marker lives under the gitignored folder, so
it never enters git.

## Salience — what floats to the top (hybrid)

The MSFT session can't query the DB, so the who-matters signal must be in files it
reads:

- **Manual layer (Yonatan-curated):** a `## VIPs` section in
  `command-center/context/routing.md` for people not in the org DB or needing
  emphasis — CEO, CFO, board, key external partners. Edited whenever it changes.
  The committed starter asset (`scripts/command-center/assets/routing.starter.md`)
  gains an empty `## VIPs` section so new scaffolds include it.
- **Auto layer (Skill A emits):** `gather-context.ts` gains a **"People who matter
  today"** section in `01-focus.md`, listing names (and emails where available)
  for: Yonatan's manager, his direct reports, and the stakeholders of active
  initiatives. Refreshed every "gather context."
- **Skill B unions both** and flags as **⚡ needs attention**: anything
  from/about those people, plus meeting cancellations and explicit escalations.

This is a small, additive change to the already-shipped Skill A — a new section in
the focus doc, no change to existing sections.

## Capture block format

Appended to `02-captures.md` (the dashboard renders newest-first via the existing
renderer):

```markdown
## HH:MM — <one-line headline of the window>
**⚡ Needs attention:** <VIP email / cancelled meeting / escalation — or omit if none>
**Teams:** <signals, tied to [initiative] / [person] where possible>
**SharePoint:** <doc changes in watched spaces>
**Mail/Calendar:** <important mail, calendar changes>
```

`⚡ Needs attention` lines render inline in the dashboard's "Live Signals" card via
the existing markdown renderer. (A dedicated "needs attention" dashboard zone is a
possible future template tweak — out of scope here; the dashboard stays as-is for
now per Yonatan.)

## Privacy

- Raw comms stay in `command-center/` (gitignored, never embedded, never committed).
- Sensitive/personal threads get a one-line `sensitive — not detailed` placeholder
  instead of full content (same spirit as the Outlook agent's allowlist).
- Nothing is auto-promoted to Supabase. Writing the day's outcomes back to the DB is
  **Skill C** (separate, confirm-gated) — not part of Skill B.

## Components & file structure

**Created:**
- `agents/command-center-capture.md` — the committed agent definition (modes,
  lookback, salience, capture format, privacy, the `capture` CLI contract).
- `.claude/skills/command-center-capture/SKILL.md` — thin local trigger (untracked,
  like every other skill in this repo) that points to the agent doc.
- `scripts/command-center/capture.ts` — `window` and `done` subcommands.
- `scripts/command-center/__tests__/capture.test.ts` — unit tests for the window
  logic (marker present / absent / stale>7d / cap) and marker round-trip.

**Modified:**
- `scripts/command-center/gather-context.ts` — add the "People who matter today"
  section (manager + direct reports + active-initiative stakeholders).
- `scripts/command-center/assets/routing.starter.md` — add an empty `## VIPs`
  section.
- `package.json` — add `"command-center:capture": "tsx scripts/command-center/capture.ts"`.
- `CLAUDE.md` — add a Command Center capture trigger row (and note the MSFT-session
  phrases).

## The `capture` CLI contract

```
npm run command-center:capture -- window [--date=YYYY-MM-DD]
  → prints JSON { start, end, reason }

npm run command-center:capture -- done --date=YYYY-MM-DD
  → sets command-center/.last-capture = now; re-renders dashboard.html; prints the path
```

`done` reuses `writeDashboard(date)` from `build-dashboard.ts` (already built).
`window` is pure logic over the marker file + `new Date()` and is the main unit-test
target.

## Testing

- **Unit (scriptable):** `capture window` computation — marker absent
  (→ `start = now−3d`, reason `default-3d`), marker present ≤7d
  (→ `start = marker`, reason `marker`), marker present >7d
  (→ `start = now−7d`, reason `capped-7d`). Marker write/read round-trip via `done`
  (use a temp/injected path so tests don't touch the real marker).
- **Integration (manual, live):** in the MSFT session, run the capture flow against
  real Teams/SharePoint/mail/calendar; confirm a block lands in `02-captures.md`,
  the marker advances, and the dashboard re-renders with newest-first + ⚡ items.
  Then run close-the-day, confirm the draft-and-approve gate, and that `03-summary.md`
  appears and renders.

## Out of scope (this slice)

- Skill C (write approved deltas back to Supabase). Skill B only writes local files.
- A dedicated "needs attention" dashboard zone / template redesign (dashboard stays
  as-is for now).
- Serving the dashboard to the web.
- Any automation/scheduling — both modes are manually triggered in the MSFT session.

## Build order (step by step, each validated before the next)

1. **`capture.ts` (`window` + `done`) + unit tests** — the deterministic core.
2. **Skill A salience block** — `gather-context.ts` emits "People who matter today";
   validate live (names/emails populate).
3. **`routing.starter.md` `## VIPs` section** — and add `## VIPs` to the already-
   scaffolded local `command-center/context/routing.md`.
4. **`agents/command-center-capture.md`** — the full committed agent definition.
5. **Thin local skill + CLAUDE.md trigger row.**
6. **Live integration pass** in the MSFT session (manual).
