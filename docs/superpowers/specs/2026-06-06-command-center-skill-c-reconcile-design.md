# Command Center — Skill C (Reconcile / Close-the-Loop) Design

**Date:** 2026-06-06
**Status:** Approved design — ready for implementation planning
**Parent designs:** [daily-loop](2026-06-05-command-center-daily-loop-design.md) · [Skill B](2026-06-05-command-center-skill-b-capture-design.md)
**Author:** Yonatan + Claude Code (Supabase session)

## Problem

Skills A (morning context) and B (intraday capture + end-of-day summary + people
harvest) are live. The loop's final arc is missing: nothing pushes the day's output
back into Supabase, the system of record. Tonight that reconciliation was done by
hand — and that manual run is the reference implementation. Skill C scripts the
deterministic rails around it so it's a repeatable, confirm-gated step instead of
ad-hoc SQL.

**Core principle (Yonatan):** Skill C must **not blindly ingest** Skill B's output.
It gathers the candidates, **resolves them against existing Supabase + local state,
enriches and verifies** (pulling more context where needed), and only then writes.
The smart middle is Claude; the script is the deterministic gather/resolve/apply
rails.

## Pattern

Mirrors the repo's existing Claude-in-the-loop writer, `initiative-tracker
refresh-from-ppp`: `--plan` emits a resolved scaffold → Claude curates → `--apply
--payload=` writes idempotently and prints a summary. Skill C is the same shape.

## Surface & trigger

- Runs in **this (Supabase) session** — the only surface that can write the DB.
- Natural-language trigger (Yonatan never runs the CLI): "reconcile the day",
  "close the loop", "push the day to the brain". Claude then runs `--plan`, curates,
  presents, and on confirmation runs `--apply`.
- CLI: `npm run command-center:reconcile -- plan --date=YYYY-MM-DD` and
  `npm run command-center:reconcile -- apply --date=YYYY-MM-DD --payload=<path> [--confirmed]`.

## Inputs — trust B's promotion

Skill C acts on what Skill B **curated**, not the raw feed:
- `command-center/daily/<date>/03-summary.md` — the Follow-ups table (each row:
  item, person, destination) and the "People noted" list.
- `command-center/context/people.md` `## Harvested` — entries NOT already marked
  `✓ filed`.

`02-captures.md` is **context only** — Claude may read it during verification to
check a detail, but the resolver never auto-mines it for new candidates. If B is
under-promoting, the fix is to enrich **B's documentation** (see "Concurrent B
tweak"), not to add a second extractor here — we can't second-guess B with less
content than B had.

## Phase 1 — Gather + Resolve (`plan`, deterministic)

The script parses the inputs and resolves every candidate against current state,
emitting `command-center/daily/<date>/reconcile-plan.json` (+ a human-readable
echo). No writes.

**People (from `## Harvested` + "People noted"):**
- Match against `people` by **exact email → slug → exact (case-insensitive) name**.
  Never substring/ILIKE — that produced false positives (e.g. "Ya Wen"→Yaron, "Elad
  Naama"→Elad Schnarch) in the manual run.
- Classify: `new` (no match), `enrich` (match + the harvested line has a value for a
  field that is empty in the DB row, e.g. email), `exists` (match, nothing to add),
  `ambiguous` (>1 match).

**Follow-ups (from the summary table):**
- Read the row's **destination hint** (B already suggests one: current_focus /
  calendar / personal / a named initiative memory / a task).
- Resolve any named initiative → slug → id; flag `active | blocked | abandoned |
  missing` and `has-memory-doc?`.
- For task candidates: check for an existing `tasks` row by slug and by close title
  match → `exists` vs `new`.
- Mark `calendar` / `personal` destinations as **skip** (not DB writes).

**Each plan item carries:** `kind` (person | task | memory-note | current_focus),
`status` (new | enrich | exists | ambiguous | unresolved | skip), `tier` (auto |
gated), the resolved target id(s), and a draft payload.

## Phase 2 — Curate + Verify (Claude, this session)

The "not blind" core. For any item flagged `ambiguous | unresolved | gated`, Claude
pulls more context before deciding:
- read the target initiative's **memory doc** to avoid duplicating a known item;
- disambiguate a person (check `meetings`/`meeting_attendees`, role, team);
- infer a new person's `type` (internal / external / …);
- fill or correct an email/role from the captures or DB;
- drop noise, merge duplicates, fix mis-routed destinations (e.g. the manual run
  re-routed "CLM Mobile Performance memory" — which doesn't exist — to
  `clm-full-rollout` + a task).

Output: a **curated payload** file with two sections — `auto` and `gated`.

## Phase 3 — Confirm (Yonatan)

Claude presents the curated, bucketed list (People / current_focus / Memory / Tasks,
as tonight). `auto` items are shown **FYI ("will apply")**; `gated` items are shown
**for approval**. One gate for the whole gated set; Yonatan can edit/drop items.

## Phase 4 — Apply (`apply`, deterministic, idempotent)

- Writes the `auto` section **always**; writes the `gated` section **only when
  `--confirmed` is passed** (Claude passes it after Yonatan's OK).
- **Idempotent:** people deduped by email/slug/name; tasks by slug; memory notes by
  exact-content presence; `current_focus` appends checked by a stable prefix.
- After success: mark the reconciled `## Harvested` lines `✓ filed` in `people.md`,
  and stamp the applied summary follow-ups (e.g. a trailing ` ✓` / a `## Reconciled`
  note) so re-running `plan` doesn't re-propose them.
- Prints an **Updated / Skipped / Errors** summary (like `refresh-from-ppp`).

## Apply tiers

| Tier | Items | Behavior |
|------|-------|----------|
| **auto** | Fill an **empty** field on an **exact-match** existing person; append a deduped, dated memory-Timeline signal to an **existing** initiative | Applied without per-item approval (still reported) |
| **gated** | Create a new person; create a task; change `current_focus`; **overwrite** any non-empty value; anything `ambiguous`/`unresolved` | Requires `--confirmed` (Yonatan's OK) |

Never auto-overwrite a non-empty DB value — enrichment only ever fills blanks.

## Provenance & privacy

- Inherits B: never promote sensitive/personal content; respect `is_private`.
- Carry `[via Teams/SharePoint/email <date>]` provenance into people
  `relationship_notes` and memory notes; tag Yonatan's in-conversation decisions
  `[decision <date>]`.
- Memory notes are append-only to the initiative memory doc (`section_type =
  'memory'`), inserted into the `## Timeline of Key Events` section.

## Concurrent B tweak (small)

Per "ask B to add a bit more context when documenting": update
`agents/command-center-capture.md` so the **close-the-day** follow-ups table carries
a short **context/why** per row (not just a title) and names the initiative
explicitly where known — giving C enough to reconcile without guessing. No structural
change to B; just richer rows.

## Components & file structure

**Created:**
- `scripts/command-center/reconcile.ts` — `plan` + `apply` subcommands and the
  resolver. Pure resolver/matcher functions exported for tests.
- `scripts/command-center/__tests__/reconcile.test.ts` — unit tests for the resolver
  (people match tiers incl. the false-positive guard, initiative resolution, dedup,
  tier assignment).
- `.claude/skills/command-center-reconcile/SKILL.md` — thin local trigger
  (untracked, like the others) describing the plan→curate→confirm→apply flow.

**Modified:**
- `package.json` — add `"command-center:reconcile"`.
- `agents/command-center-capture.md` — richer close-the-day follow-up rows.
- `CLAUDE.md` — add a "reconcile the day" trigger row to the Command Center table.

## Testing

- **Unit (scriptable):** the resolver — exact-match wins over substring (false-
  positive guard), `enrich` only when DB field is empty, initiative slug resolution
  + active/blocked/missing flags, task dedup by slug, tier assignment (auto vs
  gated), and idempotency predicates (already-filed harvested, existing task,
  memory-note-present). Use fixtures / injected fake query results — no live DB in
  unit tests.
- **Integration (manual, live):** run `plan` on a real day, curate, `apply
  --confirmed`, confirm the four buckets land and a **re-run is a no-op** (everything
  Skipped). This mirrors tonight's manual reconciliation, which is the acceptance
  bar.

## Out of scope (this slice)

- Scheduling / auto-running reconcile (manual trigger only).
- Re-mining `02-captures.md` for candidates B didn't promote.
- A reconcile UI / dashboard panel (the bucketed list in chat is the surface).
- Two-way sync back out to comms (C only writes Supabase).

## Build order (step by step, each validated before the next)

1. **Resolver core + unit tests** — people matching (false-positive guard), initiative
   resolution, dedup, tier assignment. Pure functions; no DB.
2. **`reconcile plan`** — wire the resolver to the live DB + input files; emit
   `reconcile-plan.json`. Validate on the 2026-06-05 day (should resolve the same
   candidates we did by hand; the 4 people now `exists`, so a re-run shows them filed).
3. **`reconcile apply`** — idempotent writes (auto always; gated on `--confirmed`),
   harvested `✓ filed` stamping, Updated/Skipped/Errors summary. Validate idempotency
   (re-run = all Skipped).
4. **Skill + CLAUDE.md trigger + the B-documentation tweak.**
5. **Live integration pass** — a fresh day end-to-end (manual).
