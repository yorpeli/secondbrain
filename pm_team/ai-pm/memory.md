# AI PM — Operational Memory (memory.md)

Working state across the AI portfolio. The per-initiative living memory lives in `content_sections` (kept current by the initiative-tracker); this file is the *cross-portfolio* layer — what's hot, what's drifting, what the learning loop has surfaced. Append with `[date]` prefixes; keep it tight.

## Portfolio snapshot — [2026-06-05] (agent created)

| Initiative | Pri | Status | Note |
|---|---|---|---|
| `claude-kyc-agent` | P0 | active | First PPP appearance 2026-06-04 (Agentic KYC, Shilhav). 40% auto-resolution on D-leads by July 15; QA benchmark (600 docs/50 AHs) vs Auditrail. Open infra deps: 600-doc set, Swagger endpoint, BO integration, agent hosting. |
| `air-squared` | P0 | blocked | AIR² fast AI disruption. Yonatan leads (from Tal Arnon, 2026-03-20); sponsor Gaurav Gupta. Target areas + governance cadence are open. |
| `ai-native-team-structure` | P0 | blocked | AI-native operating model & JDs. Open: pod model, role definitions (PM title, engineer role pending Tomer/Tal), cross-pollination ritual. |
| `ai-academy-product` | P1 | active | Foundry / AI Academy. Memory was stale (last update 2026-03-13) at takeover — needs a refresh. Open: first cohort, entry criteria, session leads. |
| `ai-powered-pm-team` | P1 | blocked | AI tooling for the PM org. Reassigned from team-lead → ai-pm. All PMs have Cursor; adoption uneven — needs milestones + tracking. |

## Watching

- [2026-06-05] `ai-academy-product` memory is ~83 days stale — highest-priority refresh in the portfolio.
- [2026-06-05] Three P0s (claude-kyc-agent, air-squared, ai-native-team-structure); two are `blocked`. Clarify what unblocks air-squared and ai-native-team-structure.

## Learning log

_(Findings promoted from `scan` that are worth a portfolio-level note. Detailed research lives in `research_results`, discoverable via embeddings / `brief <slug>`.)_

- [2026-06-05] **First scan — seeded 10 research entries** (7 watchlist sweep + 3 claude-kyc-agent demand), each from 6–8 web sources, stored in `research_results` + embedded. Headlines:
  - *Agentic enterprise:* ~57% have agents in prod but ~74% roll back post-launch (G2, 2025) — reliability engineering, not model IQ, is the bottleneck. Copy: tight scope, human-in-loop, eval-in-CI.
  - *LLM evaluation:* binary pass/fail LLM-as-judge (not Likert), calibrated against humans; golden sets are the asset; set the false-approval guardrail from benchmark results. → directly shapes the claude-kyc-agent QA benchmark.
  - *Doc-AI accuracy:* industry IDP field accuracy ~85–97% (LLMs at the high end); validate 91% on a larger Japanese sample with a stratified, representative set + confidence intervals.
  - *Error drivers:* image-quality defects (glare/blur/occlusion) ≈ largest single error source (~34%) → confidence-routing + targeted QA.
  - *Build vs buy:* market has settled on **orchestrate-on-top-of-vendors** — the LLM agent is a reasoning layer over vendor outputs (Persona/Au10tix/Trulioo/AsiaVerify), highest value in the ambiguous medium-confidence middle tier (60–90% manual-review reduction in case studies). → frames where claude-kyc-agent sits vs the vendor portfolio.
  - *Governance:* NIST AI RMF + EU AI Act raise the bar for regulated decisioning — auditability/logging + human oversight are table stakes for KYC.
  - Plus *AI engineering*, *AI-PM craft*, *AI-native org design*, *KYC AI automation*.
  - _Note: first-pass research — spot-check sources before citing externally (one entry referenced an implausible arXiv id)._

## On hold (parked — no active PM work)

- [2026-06-05] **`ai-academy-product`, `air-squared`, `ai-native-team-structure` parked** (per Yonatan). Still owned by `ai-pm` but excluded from the scan research agenda and shown greyed/un-flagged in `portfolio` (`ON_HOLD_SLUGS` in `lib/config.ts`). `ai-academy-product` status set active→blocked to reflect the hold (the other two were already blocked). **Active focus: `claude-kyc-agent` (P0) + `ai-powered-pm-team` (P1).** To resume one: remove from `ON_HOLD_SLUGS` and restore its `initiatives.status`.

## Decisions & changes

- [2026-06-05] AI PM agent created. Took ownership (`assigned_agent = ai-pm`) of all 5 AI initiatives, incl. `ai-powered-pm-team` (reassigned from `team-lead`). Registered in `agent_registry`.
