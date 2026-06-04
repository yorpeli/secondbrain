---
summary: CLM Rollout War Room domain reference — monitoring sources, escalation paths, go/no-go criteria, metric definitions for the 6/15→7/1 live window
topics: [clm-funnel, clm-rollout, monitoring, rollout-health, incident-management]
agents: [team-lead, hub-countries-pm]
---

# CLM Rollout War Room — Context

Domain reference for governing the CLM rollout through its critical window. Track-level
status lives in `clm-full-rollout`; this file holds the *how we watch and decide* knowledge.

## Live Sources (keep these)

| Source | Link | Local copy / parse |
|--------|------|--------------------|
| **CLM H1 Strategic Roadmap** (CLM Program Office, weekly) | [SharePoint PDF](https://payoneerinc.sharepoint.com/teams/PayoneerProductRoadmap/Domains/Forms/AllItems.aspx?id=%2Fteams%2FPayoneerProductRoadmap%2FDomains%2FCLM%20%26%20Product%20Compliance%20Domain%2FCLM%20Roadmap%2FCLM%20H1%20Strategic%20Roadmap%202026%20%C2%B7%20Payoneer%2Epdf&parent=%2Fteams%2FPayoneerProductRoadmap%2FDomains%2FCLM%20%26%20Product%20Compliance%20Domain%2FCLM%20Roadmap) | `docs/CLM-H1-Strategic-Roadmap-2026.pdf` · parsed → `docs/2026-06-04-rollout-roadmap-snapshot.md` |
| **CLM Risk Whiteboard** (the tasks/risk table — bug-TV content) | [Claude design share](https://claude.ai/design/p/8ec7b7ef-b7f5-4746-9fe1-7b27db84c1cd?via=share&file=CLM+Risk+Whiteboard.html) | `docs/CLM-Risk-Whiteboard-2026-06-04.html` · parsed → `docs/2026-06-04-risk-whiteboard.md` |

Both are dated **2026-06-04**. The risk whiteboard is the live operational register the war
room watches; refresh both when newer versions land.

## The Window

| Phase | Dates | Focus |
|-------|-------|-------|
| Pre-rollout | now → 6/15 | Readiness reviews, risk-register sweeps, go/no-go prep |
| Cutover & ramp | 6/15 | Go/no-go gate, live cutover to 100% |
| Monitor & stabilize | 6/15 → 7/1 | Daily health tracking, incident triage, perf vs. targets |
| Post-rollout | after 7/1 | Retro, handback to steady-state ownership |

## Monitoring & Health Signals

| Signal | What it tells us | Source / owner |
|--------|------------------|----------------|
| Funnel CVR (Global, Tier 1-2) | Conversion health post-cutover | Looker / analytics |
| FFT, FTL, cohort views (15/30/60d) | Activation quality over time | Chen Alcalay / data |
| Post-rollout bug volume | Stability after cutover | "Monitoring master" (Daniel Grin) |
| Exposure ramp % per track | Where each track is in the ramp | clm-full-rollout roadmap |
| Routing health (4-step→CLM redirect) | Traffic leaking off CLM | Shany / Almog |

_Definitions and dashboard links to be filled in as sources are wired up._

## Go/No-Go Criteria (6/15 cutover) — DRAFT

To be finalized in pre-rollout. Candidate gates:
- Post-rollout bug volume within tolerance
- Monitoring master live and green
- Banking partners, selfie (CN/HK), and global/HK E2E tracks green
- Routing redirect (4-step→CLM) verified, no major leak

## Escalation Paths

- **Health/incident during window** → Ira Martinenko (execution lead) → Yonatan Orpeli (commander).
- **Cross-org / routing / partner blockers** → Yaron Zakai-Or (SVP).
- **Banking-partner / monitoring** → Daniel Grin.

## Live Risk Register (as of 2026-06-04)

The operational register the war room monitors — full parse in
`docs/2026-06-04-risk-whiteboard.md` (source: CLM Risk Whiteboard, link above). **8 active
risks** toward Jun 15:
- 🔴 **Critical:** Banking partnerships (Daniel, in QA, Jun 4) · Global/HK E2E (Linda, Jun 11) · Selfie (Omer, Jun 11 — *Einat owes test plan*)
- 🔵 **Medium:** Redirect web (Shany) · Redirect mobile (Almog) · Monitoring master (Daniel) — Jun 11 · Server errors (Omer, Jun 15) · Automation (Daniel, Jun 25)
- ⏸️ 4 Mobile risks + VIP STA link **deferred / out of scope** for Jun 15.
