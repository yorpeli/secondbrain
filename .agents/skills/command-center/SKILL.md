---
name: command-center
description: >-
  Run Yonatan's daily Command Center loop — the gather → capture → close cycle
  over the Supabase backbone. Use when he says "gather context", "morning brief",
  "start the day", "scan", "capture", "what's new", "refresh the dashboard",
  "close out the day", or "wrap up". Works from any session that can reach
  Supabase plus the Microsoft 365 comms tools (Claude Code or a Claude.ai Project
  with both connectors).
metadata:
  tags: command-center, daily-loop, supabase, msft, teams, dashboard, briefing
---

## What this is

The Command Center is Yonatan's daily loop. It has three arcs — **gather** (morning
focus), **capture** (intraday comms sweeps), **close** (end-of-day synthesis +
write-back). A single session that can reach both Supabase and the Microsoft 365
tools runs the whole loop; a session with only one side runs its arc.

**The durable record is the database, never the filesystem.** v1 used a gitignored
`command-center/` folder to hand off between two single-sided sessions; v2 moved the
daily layer into Supabase so any session interoperates. The rendered `dashboard.html`
is local scratch — the DB is the source of truth.

Yonatan never runs a CLI. He speaks; you run the loop and handle the rest
conversationally.

## The contract (shared by both surfaces)

| What | Where |
|---|---|
| Per-day docs (focus / summary / reconcile) | `command_center_days` (one row per `day`) |
| Append-only capture log | `command_center_captures` (one row per sweep) |
| Lookback cursor | `max(window_end)` from `command_center_captures` (no marker file) |
| Durable routing index | `context_store.command_center_routing` |
| VIPs + harvested people | `context_store.command_center_people` |

**Never embed `command_center_*` content** — it holds distilled comms. Treat it like
PPP `private_notes`: never embedded, never surfaced to other agents wholesale.

## Surface routing

Same DB rows either way; only the mechanism differs.

| Step | Claude Code (web + local) | Claude.ai Project |
|---|---|---|
| gather focus | `npm run command-center:gather [-- --date=YYYY-MM-DD]` | MCP SQL: read `current_focus` + active initiatives + open action items → upsert `command_center_days.focus_md` |
| capture window | `npm run command-center:capture -- window` | MCP SQL: `SELECT max(window_end) FROM command_center_captures` → apply the 3d/7d rule below |
| capture add | `npm run command-center:capture -- add --payload=<json> [--date=]` | MCP SQL: `INSERT INTO command_center_captures (...)` |
| close — summary | `npm run command-center:day -- summary --file=<md> [--date=]` | MCP SQL: upsert `summary_md` |
| close — reconcile | `npm run command-center:day -- reconcile --file=<md> [--date=]` | MCP SQL: upsert `reconcile_md`, set `status='closed'` |
| dashboard | `build-dashboard` re-renders local HTML (gather/capture/day do it for you) | skip — read the rows directly |

The MSFT sweep itself (Teams / SharePoint / mail / calendar) is identical on both
surfaces — the Microsoft 365 MCP tools.

## Mode: gather — "gather context", "morning brief", "start the day"

1. Run the gather step for today (writes `focus_md`, renders the dashboard).
2. Open / send the day's `dashboard.html` (Claude Code) or summarize the focus doc
   (Claude.ai).
3. Skim the focus doc; if useful, curate it and re-render.

## Mode: capture — "scan", "capture", "what's new"

Frictionless. No confirmation. Run several times a day.

1. Get the window (`{ start, end, reason }`). Sweep comms for `start..end` only.
2. Read `command_center_people` (VIPs + harvested) + `command_center_routing` (incl.
   its `## Watched Teams channels`) + today's `focus_md` ("People who matter today").
   Union into your salience list.
3. Sweep **Teams** (1:1 + the watched channels), **SharePoint**, **mail** backward
   over `start..end`; sweep **calendar twice** — `start..end` for past changes AND
   `end → end of today` for upcoming meetings / cancellations.
4. Compose ONE capture and store it (`headline` + `body_md`, plus `needs_attention`
   when something is salient, and `people` / `initiatives` slug arrays where you can
   tag them). The dashboard re-renders automatically.
5. If you saw new/changed people data, append a line to the `## Harvested` section of
   `command_center_people` (this is also where unified sessions can propose a `people`
   write on the spot).
6. Tell Yonatan in one line what you stored, and call out anything under ⚡ Needs
   attention.

**Capture `body_md` format** (the dashboard parses these labels):

```markdown
**⚡ Needs attention:** <VIP email / cancelled meeting / escalation — omit if none>
**Teams:** <signals, tied to [initiative] / [person] where possible>
**SharePoint:** <doc changes in watched spaces>
**Mail:** <important mail in the window>
**Calendar — changes:** <cancellations/reschedules/new invites — omit if none>
**Coming up today:** <remaining meetings now → end of day, time-ordered — omit if none>
```

**Lookback rule** (what `window` computes for you): no prior capture → last 3 days;
last window ≤ 7d old → since that window; > 7d old → last 7 days only.

## Mode: close — "close out the day", "wrap up"

CONFIRM-GATED. This arc writes to human/organizational tables.

1. Read the day's captures.
2. Draft the summary: a short day narrative + proposed follow-ups, each tagged to a
   person/initiative with a suggested destination (initiative memory / action item /
   `current_focus`). **Show Yonatan and wait for explicit approval.**
3. On approval: write `summary_md`.
4. Reconcile approved deltas to their destinations with provenance —
   `[via Teams: …]` / `[via SharePoint: …]` / `[via email: …]` — then write the
   `reconcile_md` audit trail and close the day. Confirm before any human-facing
   write; agent-infrastructure writes are free.

## Privacy

- Raw comms stay distilled — never paste full sensitive or personal threads. For
  sensitive items write a one-line `sensitive — not detailed` placeholder instead of
  content.
- `command_center_*` rows are never embedded and never surfaced wholesale to other
  agents. Only approved, distilled deltas flow into initiative memories / action
  items, respecting `is_private`.

## Detail references

- **Capture agent procedure & salience rules:** [agents/command-center-capture.md](../../../agents/command-center-capture.md)
- **v2 design (Supabase backbone):** [docs/superpowers/specs/2026-06-12-command-center-supabase-backbone.md](../../../docs/superpowers/specs/2026-06-12-command-center-supabase-backbone.md)
- **CLI source:** `scripts/command-center/` (`gather-context.ts`, `capture.ts`, `day.ts`, `store.ts`, `build-dashboard.ts`)
