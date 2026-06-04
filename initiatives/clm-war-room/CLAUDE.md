# CLM Rollout War Room

## Initiative Context

- **Initiative slug**: `clm-war-room`
- **Initiative ID**: `d25a9e07-278f-4423-8a59-8ee704315117` <!-- from initiatives table -->
- **Status**: Active (P0)
- **Owner**: Yonatan Orpeli (VP Product, CLM) — war-room commander
- **Execution lead**: Ira Martinenko (Principal PM, Self-Service)
- **Assigned agent**: `team-lead`
- **Supabase memory doc ID**: `080142ba-3513-4ab4-9985-db68fc36a995` <!-- from content_sections -->
- **Window**: pre-rollout (now) → **6/15 cutover to 100%** → monitor & stabilize → **7/1**

## What This Is

The operational governance and monitoring layer for the CLM full rollout. It manages the
rollout end to end across the critical window: pre-rollout readiness and go/no-go prep,
the 6/15 cutover to 100%, and the monitor-and-stabilize phase through 7/1 — tracking
rollout health, performance vs. targets, incidents, decisions, and meeting cadence.

It is **linked to, not a replacement for**, `clm-full-rollout`. That initiative remains the
program/track/KPI source of truth (the 7 rollout tracks, funnel KPIs, full risk register).
The War Room watches health, incidents, decisions, and cadence — it does not re-track
track-level status. Both initiatives stay active.

## Your Role

Help run and synthesize the war room. Specifically:
- Keep the memory doc current: incident log, go/no-go gate status, health signals,
  decisions, and the meeting cadence.
- Surface rollout health and early risk signals during the live window — pull from
  `clm-full-rollout`, PPP, meetings, and email intel rather than re-entering track status.
- Prep go/no-go reviews and daily standups; capture outcomes into `docs/`.
- Escalate fast: flag 🔴 risks to the commander (Yonatan) and execution lead (Ira).

## Key Principles

- **Govern, don't duplicate** — track-level status lives in `clm-full-rollout`; link to it.
- **Time-boxed urgency** — this is a P0 live-window initiative; bias to speed and signal.
- **Append-only logs** — incidents, decisions, and timeline are append-only; never rewrite history.
- **Local-first** — meeting notes, monitoring snapshots, and go/no-go docs go under `docs/`.

## Stakeholders

- **Yonatan Orpeli** — sponsor / war-room commander
- **Ira Martinenko** — rollout execution lead
- **Daniel Grin** — go/no-go owner (per-item, by confidence) + banking partners + monitoring master
- **Nadia Gorodetsky** — war-room operations lead (monitoring)
- **Mor Saar** — war-room operations lead (monitoring)
- **Chen Alcalay** — payer rollout execution & performance data
- **Yaron Zakai Or** — escalation (keep informed; reduce stress)

## Related Initiatives

- `clm-full-rollout` — the program/track/KPI tracker this war room governs (source of
  truth for track-level status; id `df5220b5-9825-4282-9f63-c6b95abec0af`).
- `clm-dashboards-monitoring` — parked (on hold); monitoring tooling that may feed health views.

## Live Sources (keep these)

- **CLM H1 Strategic Roadmap** (weekly PDF) — [SharePoint](https://payoneerinc.sharepoint.com/teams/PayoneerProductRoadmap/Domains/Forms/AllItems.aspx?id=%2Fteams%2FPayoneerProductRoadmap%2FDomains%2FCLM%20%26%20Product%20Compliance%20Domain%2FCLM%20Roadmap%2FCLM%20H1%20Strategic%20Roadmap%202026%20%C2%B7%20Payoneer%2Epdf&parent=%2Fteams%2FPayoneerProductRoadmap%2FDomains%2FCLM%20%26%20Product%20Compliance%20Domain%2FCLM%20Roadmap) · local: `docs/CLM-H1-Strategic-Roadmap-2026.pdf`
- **CLM Risk Whiteboard** (tasks/risk table — bug-TV content) — [Claude design share](https://claude.ai/design/p/8ec7b7ef-b7f5-4746-9fe1-7b27db84c1cd?via=share&file=CLM+Risk+Whiteboard.html) · local: `docs/CLM-Risk-Whiteboard-2026-06-04.html`
- Full details + parses in `context.md` and the dated `docs/` snapshots.

## Working Files

All drafts, meeting notes, monitoring snapshots, and go/no-go docs go under `docs/`.

| File | Purpose |
|------|---------|
| `docs/` | Meeting notes, monitoring snapshots, go/no-go reviews, retro |
| `memory.md` | Working memory across Claude Code sessions |
| `context.md` | Domain reference: monitoring sources, escalation paths, metric defs |
| `agent.md` | PM agent definition (what team-lead watches, cadence, PPP mappings) |
| `../../context/brand-guidelines.md` | Payoneer brand guidelines (shared) |
