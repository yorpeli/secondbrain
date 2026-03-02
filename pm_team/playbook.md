# PM Team — Shared Playbook

> Version 1.0 — 2026-02-07
> This file is read by every PM agent on session start and during onboarding.
> Any PM can add generalizable learnings. Team-lead synthesize may also propose additions.

---

## How to Use This File

- **New PM agents**: Read this end-to-end during onboarding (step in workflows.md)
- **Existing PM agents**: Check the changelog (bottom) on each session start for new entries
- **Adding knowledge**: If you learn something that other PMs would benefit from, add it here under the right section. Tag your entry with your agent slug and date.

### What belongs here vs. elsewhere

| Knowledge type | Where it goes |
|----------------|---------------|
| How agents should operate (process, lifecycle) | `workflows.md` |
| What the team has learned (patterns, gotchas, domain insights) | **This file** |
| Your domain-specific working context (baselines, metrics) | Your `memory.md` |
| A specific finding or recommendation | `agent_log` (and here if it's generalizable) |

---

## Playbooks

Reusable, parameterized monitoring/investigation frameworks:

| Playbook | File | Use when |
|----------|------|----------|
| Rollout Monitoring | [`playbooks/rollout-monitoring.md`](playbooks/rollout-monitoring.md) | A country expands CLM rollout %. Covers leading indicators during 4-week maturity window. |

---

## Investigation Patterns

<!-- Patterns learned about how to investigate effectively -->

- **Entity type matters more than overall rate.** Always break down by Company vs Individual vs Sole Proprietor. Company is the top-priority entity type — if Company holds, the rollout is healthy even if Individual lags. *(hub-countries-pm, 2026-02-14)*
- **Run both `deep-dive` AND `diagnose` for country investigations.** Deep-dive gives overall funnel + trends. Diagnose gives segment breakdown (entity type, device, combinations). Neither alone tells the full story. *(hub-countries-pm, 2026-02-14)*

---

## Data & Metrics Gotchas

<!-- Things that are easy to get wrong when working with data -->

- **UTM attribution is only populated after T&Cs.** `utm_registration_source` is assigned when the customer signs T&Cs. Customers who dropped before T&Cs appear as "Unknown Channel." This means: (1) filtering by UTM source inherently excludes pre-T&C drop-offs, (2) "Unknown Channel" approval rates will be near-zero by definition — it's a data artifact, not a traffic quality signal. Never use UTM to filter "clean" cohorts. *(context-library, 2026-02-28)*

- **Two different default date windows exist — know which you're using.** The analytics agent uses `4 weeks ago for 4 weeks` (mature cohort). Ira's Looker dashboards use `51 days ago for 30 days` (30-day window ending 21 days ago, allowing 21 days for approval). Both are valid but answer different questions. If you're comparing your analysis to a dashboard number and they don't match, check the date window first. *(context-library, 2026-02-28)*

- **Don't mix CLM and 4Step cohorts without segmenting.** Both systems run simultaneously with traffic split by country and rollout %. Combining them produces misleading conversion metrics. Always filter by `is_clm_registration` and check `reg_flow_changes` for pure cohorts. *(context-library, 2026-02-28)*

- **Experiments create variant cohorts that affect conversion.** Active experiments (gated access, upfront payment, streamlined ID verification, eKYB, WhatsApp outreach) intentionally introduce or remove friction. When analyzing conversion, check if the cohort is part of an experiment — use the experiment filters in Looker (10+ experiment filters exist). *(context-library, 2026-02-28)*

- **Partner rollout is binary per-partner, not per-country.** D2P rollout % varies by country (5-100%). But once a partner is enabled for CLM, 100% of that partner's traffic goes to CLM regardless of the country's D2P rollout %. When estimating rollout % from data, use `registration_program_calc = "Payoneer D2P"` for accurate D2P rollout — partner traffic inflates the apparent rollout for countries with significant partner share. *(context-library, 2026-02-28)*

- **Payer CLM is limited to 4 countries.** Payer registrations only go through CLM in Israel, Spain, Germany, and UK. All other countries route payers to 4Step. Use `Is_Payer_UTM` filter to segment payers from receivers when analyzing these 4 countries. *(context-library, 2026-02-28)*

---

## Domain Knowledge

<!-- CLM-specific knowledge that any PM benefits from knowing -->

- **Individual vs Company determines the entire KYC path.** "Is your business registered?" at sign-up splits customers into Individual (unregistered, lighter KYC — fewer steps, fewer documents) vs Company (registered, heavier KYC — business details, company structure, UBOs, more documents). Sole Proprietors are a Company sub-type that skips business structure and UBO requirements. This split is the single biggest driver of funnel length and drop-off patterns. *(context-library, 2026-02-28)*

- **Country is locked at sign-up and cannot be changed.** Country determines license and the entire downstream flow. Mistakes require re-registration with a new email. This is a known UX pain point and a source of drop-off. *(context-library, 2026-02-28)*

- **Light Plan vs Regular Plan is assigned automatically.** If the customer's sole source of funds is marketplaces tagged as "light account," they get the Light Plan (limited services, different fee structure). Otherwise Regular Plan (full capabilities). This is determined during segmentation, not a customer choice. *(context-library, 2026-02-28)*

- **Document submission is the biggest drop-off point.** The full list of requirements (worst case 5+ document types for non-SP Companies) can feel overwhelming. This is followed by resubmission fatigue when documents are rejected. *(context-library, 2026-02-28)*

- **Pre-T&C customers cannot access customer support.** Customers who are stuck before signing T&Cs can only email via the website — there's no live support channel. This is a known "contact-us wall" that contributes to drop-off. *(context-library, 2026-02-28)*

- **Excluded countries for CLM:** Australia, China, Hong Kong, India have specific licensing needs and are excluded from standard CLM rollout. Don't flag these as "not rolled out" opportunities — they require dedicated work. *(context-library, 2026-02-28)*

---

## Stakeholder & Escalation Patterns

<!-- What works when escalating, who to involve for what -->
<!-- Example: "Vendor-related issues should be tagged for Elad's team even if they surface in another domain" -->

*No entries yet.*

---

## Tools & Techniques

<!-- Effective ways to use the available tools (analytics agent, data-viz, Supabase queries) -->

- **Looker has separate Company and Individual sub-funnels.** Account setup steps differ by entity type. Companies go through: business info → website → business regions → business address → business legal ID → AR details → AR address → AR ID. Individuals go through: website → business regions → personal details → personal address → personal ID. Use `ah_type` filter to segment. See `context/ira/looker.md` for the full measure list. *(context-library, 2026-02-28)*

- **14 saved Looks exist in Looker for CLM analysis.** Before building a custom query, check if a saved Look covers your need. Key ones: Look 7177 (core funnel), 7800/7801 (account setup sub-funnels for Companies/Individuals), 9238 (WoW diff), 7424 (rollout by country), 8274 (CLM vs 4Step unified). Full list in `context/ira/looker.md`. *(context-library, 2026-02-28)*

---

## Anti-Patterns

<!-- Things that don't work or lead to wasted effort -->
<!-- Example: "Don't create tasks for the analytics agent without specifying entity type — the scan takes 3x longer" -->

*No entries yet.*

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-02-28 | Claude Code | Added Data & Metrics Gotchas (6 entries), Domain Knowledge (6 entries), Tools & Techniques (2 entries) — sourced from Ira's CLM context docs in context library |
| 2026-02-14 | hub-countries-pm | Added rollout monitoring playbook, investigation patterns (entity type, deep-dive+diagnose) |
| 2026-02-07 | Claude Code | v1.0 — Initial structure, placeholder sections |
