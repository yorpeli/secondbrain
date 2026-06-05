# Command Center — Daily Loop Design

**Date:** 2026-06-05
**Status:** Approved design — ready for implementation planning
**Author:** Yonatan + Claude Code (Supabase session)

## Problem

Yonatan runs two Claude Code sessions plus the existing Claude-for-Outlook surface.
The most valuable real-time signal — Teams chatter, SharePoint docs, meeting
transcripts, mail — lives behind MSFT tools in a session that **cannot reach
Supabase**. The durable record of "what matters" (initiatives, `current_focus`,
highlights, action items) lives in Supabase, reachable only from the **other**
session. Today there is no channel between them, so daily comms never connect to
the strategic context, and nothing from the day flows back into organizational
memory.

## Surfaces

| Surface | Can reach | Role in this design |
|---|---|---|
| **This** Claude Code | Supabase + repo | DB gateway: exports context out, reconciles deltas back in |
| **MSFT** Claude Code | Teams + SharePoint + filesystem + GitHub; **no Supabase** | Intraday capture + end-of-day synthesis, via files only |
| Claude-for-Outlook *(existing)* | Outlook/calendar + Supabase | Out of scope here; unchanged `agent_tasks` bridge |

Both Claude Code sessions run on the **same machine** and share the filesystem.
That shared filesystem — not git, not Supabase — is the handoff channel.

## Core idea

A single gitignored `command-center/` folder is the shared workspace and the
interface between the two sessions. It has two layers:

- **Durable layer** (`context/`) — slow-moving reference + a routing index that
  points the MSFT session at where the real material lives (local initiative
  dirs, external sources, key people, current priorities).
- **Daily layer** (`daily/<YYYY-MM-DD>/`) — per-day handoff files written across
  the loop.

The loop is a circle with three arcs, all **manual** to start (Yonatan triggers
each):

```
(1) This session, morning      → write daily/<date>/01-focus.md from Supabase
(2) MSFT session, during day    → read context/ + 01 → append 02-captures.md
                                  (several runs/day, append-only)
    MSFT session, end of day     → distill 02 → write 03-summary.md
(3) This session, end of day    → read 03 → push approved deltas to Supabase
                                  → log 04-reconcile.md
```

## Folder contract

```
command-center/                  (gitignored)
  context/                       ← durable, slow-moving (Yonatan + this session curate)
    routing.md                   ← the index: what matters now → where to read it
                                   (local initiative dirs, external sources, people)
    *.md                         ← any long-term context worth keeping handy
  templates/
    dashboard.template.html      ← living-dashboard skeleton + styling (editable in place)
  daily/<YYYY-MM-DD>/
    01-focus.md                  ← THIS session writes (morning)
    02-captures.md               ← MSFT session appends (intraday, append-only)
    03-summary.md                ← MSFT session writes (end of day)
    04-reconcile.md              ← THIS session writes (end of day)
    dashboard.html               ← rendered from the template + the files above;
                                   re-rendered on every touch (the "living" view)
```

### File responsibilities

- **`context/routing.md`** — maintained occasionally (not daily). Maps current
  priorities to where the MSFT session should read: local initiative directories
  (`initiatives/{slug}/`), external sources, and the people who matter. The MSFT
  session has the repo + filesystem, so it follows these pointers and reads the
  actual files directly.
- **`01-focus.md`** — today's "what matters," assembled from Supabase:
  `context_store.current_focus` + active initiatives (title/status/priority/owner)
  + the `highlights.json` `_overview` + open action items + upcoming hard
  deadlines. Mostly cached/slow-moving day to day.
- **`02-captures.md`** — append-only. Each MSFT run stamps a `## HH:MM` block
  recording what it pulled from Teams/SharePoint/mail and any signals, tagged to
  a person or initiative where possible. Multiple runs/day never clobber.
- **`03-summary.md`** — end-of-day synthesis: the day's narrative + a list of
  proposed follow-ups, each tagged to a person/initiative and marked with a
  suggested destination (initiative memory / action item / `current_focus`).
- **`04-reconcile.md`** — what THIS session actually pushed back to Supabase,
  with provenance — the audit trail of the loop.

## Living dashboard

A single self-contained, offline HTML page that gives Yonatan an at-a-glance view
of the day and updates as the loop runs.

- **Template** (`command-center/templates/dashboard.template.html`) is kept in the
  workspace folder so Yonatan can restyle it in place. It is gitignored content,
  not code.
- **Render** is done by a committed build script
  (`scripts/command-center/build-dashboard.ts`, mirroring the
  `scripts/initiative-review/build.ts` pattern): it reads the template + the
  current `01`/`02`/`03` files for the day and writes
  `daily/<date>/dashboard.html`. Self-contained — no external assets, opens
  offline.
- **"Living"** means it is re-rendered on every touch: Skill A renders it in the
  morning from `01-focus.md`; the MSFT session re-renders after each intraday
  capture (so `02` signals show up through the day); Skill C re-renders with the
  EOD summary. The page includes a `<meta http-equiv="refresh">` so a tab left
  open refreshes itself — no server, still fully offline.
- **Sections** (initial cut): today's focus (from `01`), live signals/captures
  (from `02`, newest first), proposed follow-ups (from `03` once it exists), and
  upcoming hard deadlines. Empty sections render a quiet placeholder rather than
  breaking.

## Three skills

- **Skill A — "gather context"** (this session). Assembles `01-focus.md` from
  Supabase; refreshes `routing.md` when priorities shift; renders the initial
  `dashboard.html`. Cheap (mostly reads). *Built first.*
- **Skill B — MSFT daily skill** (frozen-spec style, mirroring the Outlook agent
  pattern). Reads `context/` + `01-focus.md`; pulls Teams/SharePoint/mail;
  appends `02-captures.md` and re-renders `dashboard.html` each run; at end of day
  distills `02` → `03-summary.md` and re-renders once more. Behavior lives in a
  spec, not hardcoded, so it can evolve without editing the skill.
- **Skill C — "close the day"** (this session). Reads `03-summary.md`, decides
  what is durable, writes approved deltas to Supabase, logs `04-reconcile.md`, and
  re-renders `dashboard.html` with the day's outcome.

## Write-back rules (Skill C)

The reconcile step touches human/organizational data, so it follows the existing
project conventions:

- **Confirm before writing human-facing data** (initiatives, people, action
  items). Agent-infrastructure writes are free.
- **Provenance** on every write carried from comms:
  `[via Teams: …]` / `[via SharePoint: …]` / `[via email: …]`, mirroring the
  Outlook bridge's `[via email: …]` convention.
- **Privacy:** raw comms never leave `command-center/`. Only distilled, approved
  deltas land in Supabase, respecting `is_private`. Nothing from `02-captures.md`
  is embedded or surfaced to other agents wholesale.
- Typical destinations: initiative memory docs (`content_sections`,
  `section_type = 'memory'`, append to the right section), human action items,
  and `context_store.current_focus` updates.

## Privacy & git

- **`command-center/` is gitignored in full.** It holds raw Teams/SharePoint/email
  content; that must never enter git history or embeddings. The durable record is
  Supabase, not the folder, so gitignoring costs nothing — the same-machine
  filesystem already moves files between the two sessions.

## Cadence

- **Manual, both bookends** to start. Yonatan runs Skill A in the morning, runs
  Skill B a few times through the day, and runs Skill C to close out. No cron yet.
- Scheduling (cron the morning export, draft evening reconcile) is a **possible
  later iteration**, explicitly out of scope for v1.

## Out of scope (v1)

- Any automation/scheduling — all three arcs are manually triggered.
- Changes to the Claude-for-Outlook bridge.
- A live web server or websockets — the dashboard updates via re-render +
  `<meta refresh>`, no server.
- Cross-machine sync — both sessions are same-machine by assumption.

## Build order

Built and validated **step by step** — each piece is tested before the next.

1. **Folder scaffold** — `command-center/{context,templates,daily}/`, the
   `.gitignore` entry, a starter `context/routing.md`, and the dashboard template.
2. **Dashboard build script** (`scripts/command-center/build-dashboard.ts`) —
   renders `dashboard.html` from template + daily files. Validate against a
   hand-written sample day.
3. **Skill A — "gather context"** (this session) — assembles `01-focus.md` from
   Supabase and renders the morning dashboard. Validate end-to-end.
4. **Skill B — MSFT daily skill** (frozen spec) — the intraday + EOD producer.
5. **Skill C — "close the day"** (this session) — the reconcile/write-back.
