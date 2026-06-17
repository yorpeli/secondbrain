# App Scout — Weekly Build-Opportunity Review

> Design spec — 2026-06-17
> Status: approved, ready for implementation plan

## Problem

The Second Brain has ~15 agents running ~28 CLI workflows over a 29-table Postgres
DB, but the app surfaces only 7 pages / 3 hooks. A lot of value is locked behind SQL
and the terminal. Some of that value does **not** need agent reasoning — it's pure
data read/write plus a good visualization, and could live in the app instead. There
is no recurring practice that spots these and feeds the dev team.

We want a **weekly review** that inventories the system (CLI workflows, the DB
surface, existing app pages, recurring manual habits), judges which slices are good
app build-candidates, and surfaces them as a ranked, visualized, read/write backlog
**inside the app itself** — so the feature that recommends what to build is itself an
example of the kind of feature it recommends.

## Goals

- A repeatable weekly review that produces a ranked list of app build-candidates.
- Candidates drawn from four sources: CLI workflows/agent commands, DB tables/views
  with no app surface, existing app pages that could be cheaply enhanced, and
  recurring manual habits that are really structured DB reads/writes.
- For **hybrid** flows (agent reasoning + data/viz output), decompose: the reasoning
  half stays in CLI, the data-display half becomes the app candidate.
- The deliverable is a **new app page** (`/workshop`) backed by a DB table, with
  read **and** write (accept/dismiss/status changes) — fulfilling the "clear
  visualization + DB read/write" criterion.
- Week-over-week continuity: decided items are never re-proposed; closed gaps
  self-heal off the board.

## Non-Goals

- Not a fully autonomous cron. The analysis is Claude-in-the-loop, triggered in
  natural language (the analysis requires judgment about agent-dependence).
- Not auto-writing `agent_tasks`. The page is the signal surface; dev planning stays
  in the normal dev-team flow. (An optional "Accept → draft dev task" button is a
  future enhancement, explicitly out of scope here.)
- Not a new persistent agent (no memory.md / registry entry). The review is stateless
  week-to-week except for what lives in the `build_opportunities` table.

## Approach (chosen: A)

Thin deterministic **inventory CLI** + Claude reasoning + idempotent **write**, with a
new app page + hook rendering the table. Reuses two proven patterns already in the
codebase:

- `initiative-tracker` plan→apply (Claude curates a scaffold, `--apply` writes
  idempotently and prints an Added/Updated/Skipped summary).
- `/triage` table→hook→RPC (`comms_predictions` → `useTriageCards` → `comms_apply_feedback`).

Rejected: **B** (full PM-style agent — overkill, no persistent state needed) and
**C** (fully inline, no CLI — less reproducible, more tokens, no reusable
evidence-gathering primitive).

## Data Model

New table `build_opportunities` (operational; **never embedded**, like
`comms_predictions`). One row per candidate.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk default gen_random_uuid() | |
| `source_type` | text | `cli-workflow` \| `dormant-data` \| `app-enhancement` \| `manual-habit` |
| `source_ref` | text | stable id: npm script name, table/view name, page name, or habit slug |
| `title` | text | human label |
| `summary` | text | what the candidate is |
| `app_part` | text | the read/write+viz half that would live in the app |
| `cli_part` | text null | the agent-reasoning half that stays in CLI (null if fully non-agent) |
| `app_fit_score` | int | 1–5; how little agent logic the app half needs (5 = pure CRUD/viz) |
| `value_score` | int | 1–5; usefulness to Yonatan |
| `effort` | text | `S` \| `M` \| `L` |
| `proposed_viz` | text | the visualization, one line |
| `data_layer` | text | tables/views/hooks it would read/write |
| `status` | text | `active` → `accepted` → `building` → `shipped` \| `dismissed` (default `active`) |
| `rationale` | text | why it ranks where it does |
| `first_seen_week` | date | which review first surfaced it |
| `last_reviewed_week` | date | bumped each run that still sees it |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |

**Constraints:**
- `UNIQUE (source_type, source_ref)` — idempotency key for week-over-week upsert.
- CHECK on `source_type`, `status` enumerations; CHECK `app_fit_score`/`value_score`
  between 1 and 5; CHECK `effort` in (S,M,L).

**Priority** is derived, not stored, computed in the view so re-ranking is free:
`app_fit_score * value_score - effort_penalty`, where `effort_penalty` is
`S → 0`, `M → 2`, `L → 4`. (Range: 1–25 before penalty, so the penalty nudges
without dominating.)

**View** `v_build_opportunities`: all columns + computed `priority`, ordered by a
status-lane rank then `priority` desc.

**Write-back RPC** `build_opportunity_set_status(p_id uuid, p_status text)` — sets
`status`, `updated_at = now()`. Mirrors `comms_apply_feedback`. The page mutates
through this.

## Inventory CLI (`app-scout/`)

New directory `app-scout/` (mirrors `comms-assistant/`, `command-center/`), one CLI
entry `npm run app-scout` with two commands.

### `app-scout -- gather`

Deterministic, no judgment. Emits a JSON evidence pack to stdout:

- **CLI workflows:** parse `package.json` scripts + agent command surfaces → list of
  `{script, agent, purpose}`.
- **DB surface:** query `information_schema` for all tables + views; diff against the
  set the app's hooks already read (parsed from `app/src/hooks/*.ts`) → flag those
  with no app surface.
- **App pages/hooks:** list `app/src/pages/*` and `app/src/hooks/*` → the "what we
  have" baseline.
- **Existing open candidates:** current `build_opportunities` rows, so reasoning runs
  against prior decisions (never re-propose decided keys).

Lazy Supabase import (script may run without all env). Uses the project `.env`.

### The reasoning step (Claude, on trigger)

Read the evidence pack; classify each item against the rubric; produce an `--apply`
payload (JSON array of candidate objects).

**Rubric:**
- `app_fit_score` (1–5): how little agent reasoning the *app half* needs. 5 = pure DB
  read/write + render; 1 = value inseparable from agent judgment.
- **Split** (hybrid flows): write `cli_part` (reasoning stays CLI) and `app_part` (the
  data/viz the app surfaces).
- `value_score` (1–5): usefulness, judged vs `current_focus` and data-change cadence.
- `effort` (S/M/L): based on whether the view/hook exists, table shape, viz complexity.
- `proposed_viz` + `data_layer`: concrete enough for dev-team-lead to plan from.

New candidates land as `status='active'` (no unattended pass to gate, since the NL
trigger keeps Claude in the loop).

### `app-scout -- apply --payload=<path>`

Idempotent upsert keyed on `(source_type, source_ref)`:
- New key → insert (`status='active'`, `first_seen_week`/`last_reviewed_week` = run week).
- Existing key with status `active` → update scores/text, bump `last_reviewed_week`.
- Existing key with a **decided** status (`accepted`/`building`/`shipped`/`dismissed`)
  → skip (don't re-nag).
- Self-heal: an `active` candidate whose `(source_type, source_ref)` is **not** in this
  run's gather output (gap closed) → mark `shipped` with a note in `rationale`.

Prints an Added / Updated / Skipped-decided / Auto-shipped summary, like
`initiative-tracker --apply`.

## App Page (`/workshop`)

Route + page following the `/triage` blueprint. `use-build-opportunities.ts` reads
`v_build_opportunities`; the page renders cards; status changes mutate via the RPC.

**Layout:** status lanes (kanban columns), ranked within each by `priority`:
`Active (proposed)` | `Accepted` | `Building` | `Shipped / Dismissed` (last lane
collapsed by default).

**Each card:**
- Title + `source_type` chip.
- The split, two stacked rows: `↳ App gains:` *(app_part)* / `⤷ Stays CLI:` *(cli_part)*.
- Three compact score indicators: App-fit (1–5 dots), Value (1–5 dots), Effort (S/M/L chip).
- `proposed_viz` one-liner + `data_layer` in muted text.
- `rationale` on expand.
- Write-back actions via RPC: Accept, Dismiss, Mark building, Mark shipped.
- Footer: "first seen {week}" / "still surfaced {week}".

**Top summary strip:** counts per lane + "N new this week".

Dark/light parity. Recharts only if a score-distribution mini-chart earns its place
(likely not — dots/bars suffice). Stays within the app's "status changes, not content
creation" write model (consistent with `app-context.md` and `/triage`).

The page can be iterated after first ship — the lane layout is the v1 target, not a
frozen contract.

## Weekly Loop & Trigger

**Natural-language trigger** (added to CLAUDE.md trigger tables):

| Yonatan says | Claude does |
|---|---|
| "run the build-opportunity review", "what should we build next", "scout the app backlog" | `npm run app-scout -- gather` → reason over the evidence pack → write `--apply` payload → `npm run app-scout -- apply` → open `/workshop`, walk through what's new + top-ranked candidates |

**Week-over-week:** bumps `last_reviewed_week` on still-relevant candidates; inserts
new ones as `active`; never re-proposes decided keys; auto-ships candidates whose gap
has closed.

**Dev-team bridge (light):** `dev-team-lead` session-start protocol gains one line —
*"check `v_build_opportunities WHERE status='accepted'` as candidate backlog."*
Accepting on the page is the signal; planning stays in the normal dev flow.

## Docs Touched On Build

- New `app-scout/` dir + `agents/app-scout.md` definition doc.
- CLAUDE.md: agent table row + natural-language trigger table.
- `dev_team/workflows.md`: session-start line for the accepted-backlog check.
- `dev_team/app-context.md`: refresh the stale "Current Features" table to reality
  (it still says everything is Planned/Stub) and add the `/workshop` page.
- `package.json`: `app-scout` script.

## Open Questions

None blocking. Future enhancement (out of scope): "Accept → also draft a dev task"
button wiring the page to `agent_tasks`.
