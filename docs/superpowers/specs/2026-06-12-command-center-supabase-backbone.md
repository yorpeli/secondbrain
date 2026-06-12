# Command Center v2 — Supabase Backbone

**Date:** 2026-06-12
**Status:** Approved + implemented
**Supersedes:** `2026-06-05-command-center-daily-loop-design.md` (the file-relay
transport; the loop's *content* — capture format, EOD distillation, write-back
rules, dashboard — carries over unchanged)

## Why v2

The v1 design assumed no Claude session has both MSFT and Supabase access, and
that the two sessions share one machine's filesystem. Both assumptions broke:
remote Claude Code sessions have the Microsoft 365 MCP **and** the Supabase MCP
simultaneously, and they run in ephemeral containers that share no disk with
the local machine. Yonatan confirmed: the local MSFT session is retired, nothing
sensitive enters the loop by definition, so the daily layer moves into Supabase.
This also brings the command center in line with the standing decisions
"Supabase as shared backbone" and "agent-to-agent communication through
database only."

## Storage

### `command_center_days` — one row per day
| Column | Notes |
|---|---|
| `day` date UNIQUE | the key |
| `focus_md` | morning focus doc (was `01-focus.md`), written by `gather-context.ts` |
| `summary_md` | EOD narrative + proposed follow-ups (was `03-summary.md`) |
| `reconcile_md` | audit trail of what was pushed where (was `04-reconcile.md`) |
| `status` | `open` → `closed` (closed by the reconcile step) |
| `focus_generated_at` / `summary_written_at` / `reconciled_at` | arc timestamps |

### `command_center_captures` — append-only, one row per sweep
| Column | Notes |
|---|---|
| `day`, `captured_at` | grouping + ordering |
| `window_start` / `window_end` | sweep window; nullable (historical file-era rows have none). `max(window_end)` drives the next lookback — replaces the `.last-capture` marker file |
| `headline` | the old `## HH:MM — <headline>` line |
| `needs_attention` | the ⚡ line; NULL when none |
| `body_md` | the `**Teams:** / **SharePoint:** / **Mail:** / **Calendar:**` sections, unchanged format |
| `people[]` / `initiatives[]` / `tags[]` | slug arrays (no FKs, matching the `tags text[]` convention) |
| `source` | which surface captured (`claude-code` default) |

### Durable layer → `context_store`
- `command_center_routing` — the "what matters → where to read it" index
  (was `command-center/context/routing.md`)
- `command_center_people` — manual VIPs + harvested people deltas
  (was `command-center/context/people.md`)

### Privacy
`command_center_*` tables and the two `context_store` keys are **never
embedded** (recorded in `project_decisions`). Content is distilled, not raw;
sensitive items get a one-line placeholder. Only approved, provenance-tagged
deltas flow onward to initiative memories / action items / `current_focus`.

## Code

- `scripts/command-center/store.ts` — DB layer (lazy Supabase import).
- `gather-context.ts` — unchanged assembly; writes `focus_md` to the day row.
- `capture.ts` — `window` (lookback from DB), `add --payload=<json>` (insert
  capture row + re-render), `done` (re-render only). Marker file removed.
- `day.ts` (new) — `summary --file`, `reconcile --file [--keep-open]`, `show`.
- `build-dashboard.ts` — reads day row + capture rows, reconstructs the block
  stream via `capturesToMarkdown()`, renders the same template. Falls back to
  the bundled asset template when the workspace copy doesn't exist (fresh
  containers). Output still lands in `command-center/daily/<date>/dashboard.html`
  — local scratch; the DB is the record.
- `scaffold.ts` — still available for restyling the template locally; no longer
  required for operation.

## What was retired

- The `command-center/` folder as *transport*: `01–04` files, the
  `.last-capture` marker, the same-machine assumption. The folder lives on only
  as scratch for rendered dashboards and payload temp files.
- The MSFT-only Skill B session. One unified agent doc
  (`agents/command-center-capture.md`) covers capture + close-the-day +
  reconcile; any session runs the arcs its access allows.

## Migration of historical days

Performed once from the local machine (where the gitignored daily folders
live) by local Claude Code, following
`scripts/command-center/MIGRATE-LOCAL.md`: day files → `command_center_days`,
`02-captures.md` blocks → capture rows, `context/routing.md` + `people.md` →
the two `context_store` keys.
