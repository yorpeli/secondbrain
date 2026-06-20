## Status
Active. Owner: Yonatan Orpeli. Assigned agent: q-plan-pm. The overarching home for CLM quarterly planning. Each quarter's plan lives as a child initiative (parent_id -> quarter-planning). First child: q3-2026-planning.

> Pull-only local mirror of the canonical DB memory doc (content_sections, section_type='memory'). Write knowledge to the DB doc, not back through this file.

## Planning Method
- **Two homes, no duplication.** Structured plan lives in `quarterly_plans` / `quarterly_plan_items` / `quarterly_plan_deliverables` (machine-readable, dashboard, `v_quarterly_plan_progress`). Narrative knowledge (rationale, threads, postures, decisions, metric definitions) lives in these memory docs.
- **Strategic-threads lens.** Read the team workbooks as a portfolio of cross-cutting threads, not tab-by-tab. Each thread has an owner and a posture. Threads map onto `quarterly_plan_items`; line-items map onto `quarterly_plan_deliverables`.
- **Capacity model (man-weeks).** Each workstream has Total MW vs Committed MW vs Capacity. Capacity = Available Manpower x MWs-in-Q, minus Tech Debt %, Buffer %, and Extra Holiday MW. Committed items must fit within Capacity; the gap between the Total wishlist and Capacity is the cut decision.
- **Posture-first.** Set the quarter's allocation intent (e.g. protect a growth floor vs compliance-first) before sizing individual items.

## Metrics Glossary
- **BRR (Business Ready Rate)** - customers who completed onboarding AND are fully set up to transact (receive money in or pay out). The gate immediately before FFT. The revenue-proximate self-service metric.
- **FFT (First Financial Transaction)** - first real money movement; the revenue event.
- **CVR (Conversion Rate)** - conversion through the registration/onboarding funnel. Upstream of BRR.
- **TICP** - truly-ICP (ideal customer profile) leads; lead-score A/B ranks predict TICP.
- **MW (Man-Weeks)** - unit of effort and capacity.
- **Capacity deductions** - Tech Debt %, Buffer %, Extra Holiday MW, applied to gross manpower to get committable Capacity.

## Cross-Quarter Patterns
- **Post-rollout (Q3 2026 onward):** CLM rollout to 100% completed ~EOQ1 / June 15, freeing capacity that had been crowding out every team. Each quarter's central question becomes where the reclaimed capacity goes.
- **Owner concentration:** watch leads carrying two heavy threads at once - a capacity risk at the owner level, separate from team-MW capacity.

## Artifact archival (look-back convention)
Each quarter's **exec deck** is a point-in-time artifact worth keeping: archive the full content as `initiatives/{quarter}-planning/docs/oren-q3-deck.md` (or equiv.) and the editable PPTX in `docs/` (+ SharePoint link). The quarter's child memory doc references it. This lets us look back on what was committed at the start of each quarter, and run quarter-over-quarter retrospectives.

## Tooling & Agent
- The **Q-Plan PM** (`pm_team/q-plan/`) maintains this pillar memory (method + metrics), each quarter's child memory, and the structured `quarterly_plans` tables.
- Structured CLI: `npx tsx pm_team/q-plan/run.ts <command>`; progress dashboard via the UI app.

## Timeline of Key Events
[2026-06-20] Pillar created. Q3 2026 planning discussion captured as the first child initiative.
