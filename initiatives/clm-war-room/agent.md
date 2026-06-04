# CLM Rollout War Room — Embedded Agent Notes

This initiative is tracked by the shared **`team-lead`** PM agent (it has no standalone CLI).
This file defines what to watch and how to keep the war room current. It uses the shared PM
layers — `pm_team/clm-context.md`, `pm_team/workflows.md`, `pm_team/playbook.md` — and the
local `context.md` for domain reference.

## Mission

Keep the rollout healthy and the war-room memory doc current through the 6/15 → 7/1 window.
Govern and monitor; do not duplicate track-level status (that lives in `clm-full-rollout`).

## What to Monitor

- **Rollout health** — funnel CVR, FFT/FTL, post-rollout bug volume, exposure ramp %.
- **Inherited 🔴 risks** — banking partners, global/HK E2E, selfie (CN/HK) toward Jun 11–15.
- **Go/no-go readiness** — status of each gate ahead of the 6/15 cutover.
- **Incidents** — anything breaking during the live window; log with owner + status.

## Cadence

- **Pre-rollout**: readiness reviews + go/no-go prep (cadence TBD).
- **During window (6/15 → 7/1)**: daily health standup; incident triage as needed.
- **Post**: retro and handback.

## Intel Sources (multi-source — not PPP-only)

Pull updates from: PPP sections, meetings (discussion_notes + action items), the
`clm-full-rollout` memory doc, email intel (Chen's payer updates), and agent_log findings.
When deliverable/track status is stale, reach out to owners — don't just flag the gap.

## PPP Mappings

War-room health maps loosely to the CLM rollout swimlane(s). Track week-over-week signal in
the memory doc's **PPP Signals** section; defer track-level detail to `clm-full-rollout`.

## Keeping Memory Current

On new intel, UPDATE the memory doc (`content_sections`, id `080142ba-3513-4ab4-9985-db68fc36a995`):
append to **Incident Log**, **Key Decisions**, **Timeline**, or **PPP Signals**; refresh
**Status** and **Go/No-Go Gates**. Set `date` + `updated_at = now()`. Append-only logs are
never rewritten.
