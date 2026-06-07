# Command Center — Dashboard Adapter + Attention-Ordered Template Design

**Date:** 2026-06-07
**Status:** Approved design — ready for implementation planning
**Parent designs:** [daily-loop](2026-06-05-command-center-daily-loop-design.md) · [Skill B](2026-06-05-command-center-skill-b-capture-design.md)
**Design source:** Claude Design bundle → `scripts/command-center/design-ref/command-center.design.html` (self-contained, schema-driven; the typed contract is in its `<head>`).
**Author:** Yonatan + Claude Code (Supabase session)

## Problem

The current dashboard dumps three markdown files into three equal-weight cards,
organized by data source — crowded, no hierarchy of importance. Claude Design
produced a new **attention-ordered** dashboard: a "needs you now" triage zone, a
Focus strip, live signals + today's meetings, at-risk initiatives + top open tasks,
and reference data behind progressive disclosure. It renders from a single typed
`Dashboard` JSON object.

## Decision (Yonatan's architecture)

A **single adapter** parses the existing agent outputs into the typed `Dashboard`
object and injects it into the new template. Rationale:
- The agents already produce everything: `01-focus.md` (Skill A — DB-derived focus,
  initiatives, people, tasks) + `02-captures.md` / `03-summary.md` (Skill B).
- So the adapter only **parses our own markdown** → no DB access needed (Skill A
  already baked the DB data into `01-focus.md`). It runs in either session and is
  the one clean link between skills and dashboard.
- We accept markdown-parse over structured-JSON certainty: at n=1 it's fine, and we
  **own the markdown format**, so we keep it parse-friendly. If a section ever gets
  flaky, tighten that section's format (or have that one skill emit a small
  structured block) — no need for full JSON.

This is the **evolution of the existing render step** (`build-dashboard.ts`), not a
new moving part. Same call sites: auto-run after `gather` and `capture done`, plus
the manual `command-center:dashboard` trigger.

## The `Dashboard` contract (from the design)

```
Dashboard = {
  meta: { user:{name,role,org}, generatedAt:ISO, partOfDay:"morning"|"midday"|"evening" },
  needsAttention: [{ id, kind:"vip_email"|"meeting_change"|"escalation"|"followup_due",
                     severity:"critical"|"high"|"medium", title, detail?,
                     person?:{name,relation}, initiative?, source, at:ISO, due?, action? }],
  signals:  [{ id, at:ISO, source:"teams"|"sharepoint"|"email"|"calendar", text, person?, initiative?, urgent? }],
  meetings: [{ id, start:ISO, end:ISO, title, with?:[], status:"confirmed"|"tentative"|"moved", note? }],
  tasks:    [{ id, title, priority:"P0"|"P1"|"P2", due?, initiative? }],
  initiatives:[{ id, name, status:"on_track"|"at_risk"|"blocked"|"done", priority, owner, note? }],
  focus:    { priorities:[], watching:[], waitingOn:[{item,who}] },
  people:   [{ name, relation:"manager"|"report"|"stakeholder", team?, initiatives?:[] }],
  endOfDay: null | { summary, highlights:[], proposedFollowups:[{title,priority}] }
}
```

## Zone → source mapping

| Dashboard field | Source | Notes |
|---|---|---|
| `meta.user` | constant (Yonatan Orpeli · VP Product · Customer Lifecycle Management) | config in the adapter |
| `meta.generatedAt` | render time | |
| `meta.partOfDay` | derived | `03-summary` present → `evening`; else hour<12 → morning, <17 → midday, else evening |
| `focus` | `01-focus.md` `## Current Focus` | JSON-parse the embedded `current_focus` object → `top_priorities`→priorities, `watching`→watching, `waiting_on`→waitingOn (string → `{item, who:""}`) |
| `initiatives` | `01-focus.md` `## Active Initiatives` | lines `- **Title** (P1) — status · owner: X`. Map status: `active`→`on_track`, `blocked`→`blocked`. (No per-initiative `at_risk` in DB yet → at-risk surfacing = blocked-only for now; PPP-driven at_risk is a later enhancement.) |
| `tasks` | `01-focus.md` `## My Open Tasks` **(NEW — Skill A addition)** | from `tasks` table (owner=Yonatan, status≠done). Lines carry priority + optional due + initiative |
| `people` | `01-focus.md` `## People who matter today` | Leadership/Direct reports → relation manager/report; stakeholders → relation stakeholder |
| `needsAttention` | `02-captures.md` `**⚡ Needs attention:**` bullets | severity/kind/source inferred heuristically from text + tags (P2) |
| `signals` | `02-captures.md` `**Teams/SharePoint/Mail:**` lines | newest block first; `urgent` if under a ⚡ block; `at` from block `## HH:MM` (P2) |
| `meetings` | `02-captures.md` `**Coming up today:**` | parse time + title (P2) |
| `endOfDay` | `03-summary.md` | Narrative → summary; "people noted"/closed → highlights; Follow-ups table → proposedFollowups (P3) |

## Template adaptation

Start from `command-center.design.html`. Changes to make it render one real snapshot:
- Replace the demo `SNAPSHOTS` (morning/midday/evening) + per-state `NOW` with a
  **single injected** `const DATA = {{DATA_JSON}}` and `const NOW = "{{GENERATED_AT}}"`.
- `render()` uses `DATA` directly; `partOfDay` comes from `DATA.meta.partOfDay`.
- **Remove** the morning/midday/evening demo state-switcher. **Keep** the Triage/Hero
  and Rail/Bands toggles (persisted to localStorage — real user prefs).
- Keep the `<meta http-equiv="refresh">` (set to the dashboard's refresh interval).
- Everything else (CSS, the `renderNeeds/Signals/Meetings/Risks/Tasks/Focus/EOD/
  Reference` functions) is reused as-is — match the visual output, don't rewrite it.

The committed template lives at `scripts/command-center/assets/dashboard.template.html`
(replacing the old one); `scaffold.ts` already copies it to the workspace.

## Architecture

- **`scripts/command-center/dashboard-data.ts` (new)** — the adapter: pure parser
  functions (one per source section) + an `assembleDashboard(focusMd, capturesMd,
  summaryMd, generatedAt)` that returns the `Dashboard` object. Pure + unit-tested
  (markdown fixtures, no DB, no fs).
- **`scripts/command-center/build-dashboard.ts` (modified)** — reads the three daily
  files, calls `assembleDashboard`, injects `JSON.stringify(dashboard)` as
  `{{DATA_JSON}}` into the template, writes `dashboard.html`. (Drops the old
  markdown-into-cards renderer; `orderCapturesNewestFirst` moves into the adapter's
  signal parsing.)
- **`scripts/command-center/gather-context.ts` (modified)** — add the `## My Open
  Tasks` section (tasks table, owner=Yonatan, status≠done, ordered by priority then
  due) so the adapter can fill the `tasks` zone.

## Phasing (each phase = a working dashboard)

- **P1 — DB zones + new template.** Parse `01-focus.md` → `meta`, `focus`,
  `initiatives`, `people`, `tasks`; render the adapted template. Capture zones empty
  (the design degrades gracefully — quiet empty states). This alone is the new,
  far-better morning dashboard.
- **P2 — capture zones.** Parse `02-captures.md` → `needsAttention`, `signals`,
  `meetings`.
- **P3 — end of day.** Parse `03-summary.md` → `endOfDay`.

## Testing

- **Unit (scriptable):** each parser against a small markdown fixture — focus JSON
  parse, initiative-line parse + status mapping, people relation mapping, tasks
  parse; (P2) ⚡/signals/meetings parse; (P3) summary parse. Plus `assembleDashboard`
  produces a schema-valid object and degrades gracefully when a file is empty/absent.
- **Integration (manual, live):** run on the real 2026-06-07 day; open the dashboard;
  confirm the attention ordering, the Focus strip, at-risk-only initiatives, top
  tasks, and the reference disclosure all render from real data; toggles persist.

## Out of scope (this slice)

- Having the skills emit structured JSON (we parse markdown by decision).
- PPP-driven per-initiative `at_risk` derivation (blocked-only for now).
- Web-hosting the dashboard; the second design file (`SecondBrain.html`).
- Wiring action chips ("Reply"/"Reschedule") to real deep-links.

## Build order (step by step, each validated)

1. **Adapter parsers for `01-focus.md` + tests** — focus/initiatives/people/tasks
   (pure, fixture-tested).
2. **Skill A `## My Open Tasks` section** — `gather-context.ts`; validate live.
3. **Adapt the template** — single injected DATA, drop demo switcher, keep toggles;
   wire `build-dashboard.ts` to assemble (P1 zones) + inject. Validate render on 6/7.
4. **P2 parsers** — `02-captures.md` → needsAttention/signals/meetings + tests; render.
5. **P3 parser** — `03-summary.md` → endOfDay + tests; render the evening view.
6. **Live integration pass** (manual).
