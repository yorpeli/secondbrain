# CLM Rollout War Room — Initiative Design

**Date:** 2026-06-04
**Author:** Yonatan Orpeli (with Claude Code)
**Status:** Approved design — ready for implementation

## Summary

Create a new **workspace initiative**, `clm-war-room`, that serves as the operational
governance and monitoring layer for the CLM full rollout. It manages the rollout from
the **pre-rollout phase (now)** through the **6/15 cutover to 100%** and the
**monitor-and-stabilize window (6/15 → 7/1)**.

It is **linked to — not a replacement for** — the existing `clm-full-rollout` initiative.
`clm-full-rollout` remains the program/track/KPI tracker (the 7 rollout tracks, risk
register, funnel KPIs). The War Room watches **rollout health, incidents, decisions, and
meeting cadence** during the critical live window, and does not duplicate track-level
status.

Both initiatives stay `active`. The link is expressed bidirectionally in their memory docs
(there is no initiative-to-initiative join table in the schema).

## Identity & Metadata

| Field | Value |
|-------|-------|
| `slug` | `clm-war-room` |
| `title` | CLM Rollout War Room |
| Type | Workspace initiative (`initiatives/clm-war-room/`) |
| `status` | `active` |
| `priority` | `P0` (critical live window) |
| `owner_id` | Yonatan Orpeli — `7a868fcc-485d-4f04-b4a9-d9f6ab7bc00f` |
| Sponsor / commander | Yonatan Orpeli |
| Execution lead | Ira Martinenko — `20ee3e3e-de48-4fe9-8f17-4cd96578caa1` |
| `assigned_agent` | `team-lead` |
| `start_date` | 2026-06-04 (pre-rollout phase, in progress) |
| `target_date` | 2026-07-01 (end of monitoring window) |
| Linked initiative | `clm-full-rollout` — `df5220b5-9825-4282-9f63-c6b95abec0af` |

`objective`: "Run the CLM rollout to 100% and keep it healthy — govern the cutover, monitor
rollout health and performance, and resolve incidents from pre-rollout through the
6/15 → 7/1 stabilization window."

`why_it_matters`: "The 6/15 100%-rollout is a hard H1 deadline carrying the full CLM
funnel. A dedicated war room ensures readiness gates, live health monitoring, and fast
incident triage during the highest-risk window of the program."

## Scope

Three phases on one timeline:

1. **Pre-rollout (now → 6/15):** readiness reviews, go/no-go prep, risk-register sweeps,
   meeting-cadence setup.
2. **Cutover & ramp (6/15):** the 54%→100% go/no-go gate and live cutover.
3. **Monitor & stabilize (6/15 → 7/1):** daily health tracking, incident triage,
   performance vs. targets, escalations until stable.

**Out of scope:** re-tracking the 7 rollout tracks' status (lives in `clm-full-rollout`).
The War Room watches health, incidents, decisions, and cadence.

## Memory Doc Structure (war-room-shaped)

The Supabase memory doc (`content_sections`, `section_type='memory'`) adapts the standard
template with war-room sections:

- **Status** — overall RAG + days-to-target
- **War Room Cadence** — meeting schedule (pre-rollout readiness reviews, daily standups
  during the window, post-rollout retro)
- **Monitoring & Health** — metrics watched + sources (funnel CVR, FFT, post-rollout bug
  volume, the "Monitoring master" workstream)
- **Go/No-Go Gates** — 6/15 cutover decision + exposure-ramp gates
- **Incident Log** — append-only; issues during the live window (owner, resolution)
- **Hard Deadlines** — date-driven commitments
- **Key Decisions** — append-only log
- **Open Questions**
- **Blockers & Risks** — active blockers with owners
- **Stakeholders**
- **Timeline of Key Events** — append-only log
- **PPP Signals (week-over-week)**
- **Linked: clm-full-rollout** — pointer to the program-level source of truth

## Stakeholders

Seeded from the rollout's known cast (in `initiative_stakeholders`):
- Yonatan Orpeli — sponsor / war-room commander
- Ira Martinenko — rollout execution lead
- Chen Alcalay — payer rollout execution
- Yaron Zakai-Or — escalation
- Daniel — banking partners + monitoring master
- (others added as they surface in pre-rollout meetings)

Only people that already exist in `people` are linked; no new person records created
unless confirmed.

## Files & DB Writes

### Local workspace (`initiatives/clm-war-room/`)
Copy `_template/` then populate:
- `CLAUDE.md` — identity, real IDs, stakeholders, working-files index, link to
  `clm-full-rollout`
- `memory.md` — Claude Code working memory (first-session context)
- `context.md` — light domain reference: monitoring sources, escalation paths, metric defs
- `agent.md` — what `team-lead` watches for this initiative + cadence + PPP mappings
- `docs/` — empty, ready for meeting notes / monitoring snapshots / go-no-go docs

### Supabase
- INSERT `initiatives` row (fields above)
- INSERT memory doc — `content_sections` `entity_type='initiative'`, `section_type='memory'`
- INSERT workspace-sync rows — `section_type='workspace-context'` (← CLAUDE.md) and
  `section_type='workspace-memory'` (← memory.md)
- INSERT `initiative_stakeholders` for the seeded cast above
- UPDATE `clm-full-rollout` memory doc: add a one-line "Linked: CLM Rollout War Room
  (`clm-war-room`) — operational governance/monitoring layer" pointer

All IDs looked up dynamically; no hardcoded UUIDs in code. `updated_at = now()` on the
`clm-full-rollout` update.

## Non-Goals (YAGNI)

- No new join table for initiative-to-initiative links — memory-doc pointers suffice.
- No new PM agent CLI — `team-lead` (existing) is the assigned agent; `agent.md` is a
  definition doc only.
- No migration of `clm-full-rollout` content — it stays as-is, both active.
