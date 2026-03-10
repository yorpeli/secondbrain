# Hub Countries PM — Memory

> Agent: hub-countries-pm
> Scope: UK, US, Singapore, UAE (incorporation hubs)
> Maps to: Localization & Licensing team (Yael Feldhiem)
> Onboarded: 2026-02-07
> Last refactored: 2026-03-10 (regulatory landscape + competitive intelligence moved to context.md)

## Country Baselines (from Looker via analytics agent, 2026-02-07)

| Country | Tier | Rollout % | CLM Approval | 4Step Approval | Delta | CLM Volume | 4Step Volume | Volume Trend | Verdict |
|---------|------|-----------|-------------|----------------|-------|-----------|-------------|-------------|---------|
| UK      | T1   | 25%       | 32.4%       | 17.4%          | **+15.0%** | 509   | 2,614       | +19.8%      | **RECOMMEND** |
| US      | T1   | 25%       | 22.0%       | 24.5%          | **-2.5%**  | 1,457 | 9,020       | +14.6%      | **NOT_READY** |
| SG      | T1   | 100%      | 33.1%       | 11.8%          | **+21.3%** | 145   | 186         | +42.9%      | **RECOMMEND** |
| UAE     | T1   | 25%       | 21.6%       | 18.9%          | **+2.7%**  | 384   | 2,205       | +8.6%       | **RECOMMEND** |

**Key observations:**
- All 4 are Tier 1 countries on CLM.
- **SG is already at 100% rollout** — the only hub country fully migrated. Small volume but strongest CLM advantage (+21.3%).
- **US is the problem child** — CLM underperforming 4Step by 2.5%. Largest volume by far (10,477 total accounts). Needs investigation before expansion.
- **UK has the strongest case for expansion** — +15.0% CLM advantage with meaningful volume. Currently at 25%.
- **UAE shows modest CLM advantage** (+2.7%) — weakest positive signal among the three "recommend" countries.
- All countries show healthy volume growth trends.

## What I Know (from PPP, 3 weeks: Jan 22 – Feb 5)

### UK (richest signal)
- Approval rate hit 45% (+5 PPT WoW) as of Jan 29. Approval within 14 days improved 26% (5.8→4.3 days avg MoM).
- Companies House data now available in BigQuery — analysis starting.
- UK is one of 4 payer expansion countries for Full Rollout (IL/ES/DE/UK). E2E testing may delay launch. Payer vs receiver differentiation still unresolved.
- Ops bottleneck: 48% of UK pending approvals are reopened requirements (Jan 22).
- UK ePOR launched (Persona/Trulioo A/B test).
- T1 Localization swimlane covers UK consistently. Vendor Optimization also tags UK.
- V-team approved 100% rollout. Going live week of Feb 8th 2026.
- **Executive announcement sent** (Feb 2026) — co-authored with PMM. Key narrative: performance + ops impact + one-team collaboration.
- **Validated performance data (shared with V-team):**
  - CLM vs 4Step approval: 32% vs 20% (all), 38% vs 27% (companies), 40% vs 29% (desktop+companies). Record 47% for companies last week.
  - E2E time: 5.9 days (Oct) → 3.3 days (Jan), -44%
  - Reopened docs: 35.2% → 17.4%, -51%
- **eKYB pilot (live Dec 28):** CVR 44% vs 33% baseline (+11pp). 55% of companies (125/229) saw reduced doc requests.
- **Cross-functional wins:** Compliance (Guy, Ari) — eCollection, reduced POCA & CVD. Legal (Diana) — small-scale launch without Companies House disclaimer. Ops (Sivan, Asaf) — SLA cut from 2 days to 12 hours, pipeline prioritization.
- **Product team:** Eliya (PM lead), Yael, Ido, Daniel, Shani, Einat.

### US
- EIN doc removal: sanity check successful, rolling to 100%.
- US e-collection solution determined and WIP.
- OpenCorporates sampling for eCollection — BRN data structure challenging.
- Minimal dedicated PPP signal (1 section, on-track).

### Singapore
- No dedicated localization swimlane. Only appears via Vendor Optimization tags.
- Persona expansion to 7 countries planned (SG among them).
- Thin signal — need analytics to understand actual performance.

### UAE
- UAE vendor discovery planned (noted in PPP Feb 5).
- Appears in Vendor Optimization context (potential-issues).
- Free zone complexity (DMCC/DIFC/ADGM) not yet reflected in PPP detail.
- Thin signal — need analytics to understand actual performance.

## Migration Status

Target: Full CLM rollout by end of H1 2026.

| Country | Rollout % | Status | Notes |
|---------|-----------|--------|-------|
| UK      | 100%      | **Live** | Full rollout week of Feb 8, 2026. First hub country fully migrated. |
| US      | 25%       | **Needs work** | CLM underperforming 4Step (-2.5%). Fix bottlenecks before expanding. |
| SG      | 100%      | Complete | Fully migrated. Monitor performance. |
| UAE     | 25%       | Expanding | Modest CLM advantage (+2.7%). Vendor discovery underway. |

## Critical Context (from current_focus)

- **Yael maternity leave early March** — she leads Localization & Licensing (my mapped team). Coverage gap risk for all 4 hub countries. Direct conversation needed soon.
- **Full Rollout payer expansion** — UK is a target country. E2E testing risk, no firm date.
- **Data blindness** — systemic PM data access problem. Affects my ability to establish baselines (Elad flagged, multiple teams affected).

## Investigation History

| Date | Country | Topic | Key Findings |
|------|---------|-------|-------------|
| 2026-02-07 | UK | General (onboarding) | 5 PPP sections across 3 weeks. Strong metric movement (45% approval). No analytics or research. |
| 2026-02-07 | UAE | General (onboarding) | 3 PPP sections across 2 weeks. Thin signal, vendor-driven. No analytics or research. |

## Open Questions

1. ~~What are the actual Looker metrics for each hub country?~~ **RESOLVED** — baselines established 2026-02-07.
2. ~~What system are SG and UAE on?~~ **RESOLVED** — All 4 are T1, on CLM. SG at 100%, others at 25%.
3. **Why is US CLM underperforming 4Step?** 22.0% vs 24.5% on the largest volume country. Regulatory research suggests: eKYB data gaps forcing document fallback (DE/WY opacity), BRN matching failures across 50+ state formats. **→ Backlog task: diagnose.**
4. Who covers hub countries during Yael's maternity leave?
5. ~~Are there country-specific regulatory requirements driving KYC complexity?~~ **RESOLVED** — regulatory briefs in research_results + context.md (2026-02-07, enriched 2026-03-10).
6. What's the UK ePOR A/B test result? (Persona vs Trulioo)
7. **UAE CLM advantage is thin (+2.7%)** — regulatory research suggests free zone fragmentation + Arabic OCR as root causes. Consider segmenting by registration type. **→ Backlog task: expansion recommendation.**

## Waiting On

- **US diagnose** — backlogged, need to understand CLM underperformance root cause
- **UAE expansion recommendation doc** — backlogged, need segment-level analysis
- Yael maternity coverage plan clarity
