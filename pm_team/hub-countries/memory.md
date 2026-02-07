# Hub Countries PM — Memory

> Agent: hub-countries-pm
> Scope: UK, US, Singapore, UAE (incorporation hubs)
> Maps to: Localization & Licensing team (Yael Feldhiem)
> Onboarded: 2026-02-07

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
| UK      | 25%       | Expanding | Payer expansion planned (IL/ES/DE/UK). E2E testing may delay. |
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

## Regulatory Knowledge (from domain-expertise research, 2026-02-07)

### Verification Difficulty Ranking

| Country | Registry | BO Data Public? | Document Language | eKYB Difficulty | Key Challenge |
|---------|----------|----------------|-------------------|-----------------|---------------|
| **SG** | ACRA (single, digital-first, UEN) | No (law enforcement only) | English | **Low** | BO verification for foreign APAC owners |
| **UK** | Companies House (single, free API) | Yes (PSC register) | English | **Low** | ECCTA transition (biometric IDV by late 2026) |
| **UAE** | 45+ free zones + 7 emirate DEDs | No | Arabic (mainland) + English (free zones) | **High** | Free zone fragmentation, Arabic OCR |
| **US** | 50+ state registries | No (CTA narrowed March 2025) | English | **High** | Registry fragmentation, DE/WY opacity |

### Per-Country Regulatory Essentials

**UK:** MLR 2017 + PSR 2017 govern. FCA supervises. Companies House PSC register is public (good for UBO). ECCTA 2023 went live Nov 2025 — mandatory biometric IDV for all directors/PSCs by ~Autumn 2026. This will make Companies House data much stronger over time. Key product levers: Companies House BigQuery auto-verification, ePOR vendor A/B test, reopened requirements reduction.

**US:** BSA/AML + CDD Rule (2018). FinCEN supervises. No centralized federal business registry — 50+ state SoS registries with wildly different data quality. Delaware/Wyoming are deliberately opaque (no officer/BO data). CTA narrowed in March 2025 — FinCEN BO database won't help for domestic companies. EIN verified electronically via IRS TIN Matching (higher assurance than document). BRN challenge = 50+ different registration number formats.

**SG:** Payment Services Act 2019 + MAS Notice PSN01. ACRA is clean, digital, UEN-based. SGD $5.50 Business Profile gives shareholders, officers, capital structure. BO register exists but restricted to law enforcement. Companies (Amendment) Act 2024 (June 2025) strengthened BO transparency. English-only jurisdiction. CLM advantage (+21.3%) structurally explained by clean data + low entity-type complexity.

**UAE:** New Federal Law 10/2025 (Oct 2025) + Cabinet Resolution 134/2025 (Dec 2025). CBUAE supervises. FATF grey list exit Feb 2024 — regulators actively tightening ahead of 2026 mutual evaluation. Free zone fragmentation is the core problem: DMCC (24K+ companies), DIFC (DFSA-regulated), ADGM (FSRA-regulated) each have their own registries. Mainland documents in Arabic — OCR challenges with RTL script, ligatures, name transliteration. Vendor discovery aims to solve Arabic OCR + multi-registry verification.

### Key Regulatory Insights for Product Decisions

1. **UK ECCTA is a tailwind** — by late 2026, Companies House data will be biometrically verified. This strengthens automated verification. Plan for it.
2. **US has no registry fix coming** — CTA narrowing means no federal BO database for domestic companies. Must rely on commercial data providers (Middesk, D&B, Experian) and IRS TIN Matching.
3. **SG is the model** — clean single registry, English docs, digital-first. What works in SG can be partially templated for other clean-registry countries.
4. **UAE expansion should segment by registration type** — free zone companies (English docs, online registries) vs mainland (Arabic docs, fragmented). Consider expanding CLM for free zone traffic first.

## Competitive Landscape (from competitive-analysis research, 2026-02-07)

### Cross-Country Competitive Threat Map

| Country | Top Threats | Onboarding Speed Benchmark | Payoneer's Moat | Biggest Gap |
|---------|-----------|--------------------------|-----------------|-------------|
| **UK** | Wise, Airwallex (+109% YoY), Revolut | Revolut: minutes. Wise: 1-2d. Airwallex: 1-3d (STP: seconds) | Marketplace integrations | Verification speed (3-30d) + 48% reopened reqs |
| **US** | Brex (40% auto-approval), Mercury, Wise, Airwallex | Brex: minutes. Mercury: 2-5d. Wise: 24-48h | Marketplace integrations | eKYB automation gap — competitors use Middesk, solved state fragmentation |
| **SG** | Airwallex ($800M ARR), WorldFirst (Ant Group), Wise, Aspire (local) | Airwallex: 1-3d. Wise: 1-3d. Aspire: 2-3d | Marketplace integrations, global reach | Fee structure (up to 3.5% vs Airwallex 0.2%), subscale presence (145 accounts) |
| **UAE** | Local banks (Wio 30K+ SMEs), WorldFirst (DIFC), Airwallex (entering H1 2026) | Wio: 3d. Magnati: same-day. WorldFirst: 48h | Marketplace integrations, global reach | Free zone routing, Arabic doc processing |

### Key Competitive Patterns (across all 4 markets)

1. **Onboarding speed is the #1 battleground everywhere.** Competitors in every market are at 1-3 days or faster. Payoneer's 3-30 day range is not competitive. Table stakes = <48h for standard cases.

2. **Marketplace integration remains the moat** — no competitor matches Payoneer's breadth (Amazon, Upwork, Fiverr, eBay). But it's a shrinking moat if onboarding friction gives sellers reason to explore alternatives (Mercury + Wise + Stripe stack risk in US).

3. **eKYB automation is table stakes** — Brex (AI-native, 40% auto-approval), Mercury (best-in-class digital KYC), Airwallex (Trulioo STP) have all solved automated business verification. Payoneer is still fighting manual fallback paths.

4. **Airwallex is the most consistent threat across all 4 markets** — growing 109% YoY in UK, entering UAE with CBUAE license, $800M ARR in APAC. Full-stack offering (accounts + payments + cards + expense management).

5. **Local players matter in UAE and SG** — Wio Bank (30K+ UAE SMEs), Aspire (50K SG businesses) own the local relationship. Global-only positioning won't win these markets.

### Competitive Urgency by Market

| Market | Urgency | Why |
|--------|---------|-----|
| **UK** | HIGH | Airwallex +109% growth, Revolut banking license expansion. Companies House automation is table stakes — all competitors already do it. |
| **US** | HIGH | CLM underperforming while competitors have solved eKYB. Brex/Mercury set the bar. EIN removal catches up, doesn't leap ahead. |
| **SG** | MEDIUM | Strong approval rate but subscale. Fee structure disadvantage. APAC-native players (Airwallex, WorldFirst) treat SG as home turf. |
| **UAE** | HIGH (time-sensitive) | Airwallex entering ~H1 2026. Must optimize CLM before they launch. Local digital banks (Wio) capturing free zone segment. |

## Open Questions

1. ~~What are the actual Looker metrics for each hub country?~~ **RESOLVED** — baselines established 2026-02-07.
2. ~~What system are SG and UAE on?~~ **RESOLVED** — All 4 are T1, on CLM. SG at 100%, others at 25%.
3. **Why is US CLM underperforming 4Step?** 22.0% vs 24.5% on the largest volume country. Regulatory research suggests: eKYB data gaps forcing document fallback (DE/WY opacity), BRN matching failures across 50+ state formats. **→ Backlog task: diagnose.**
4. Who covers hub countries during Yael's maternity leave?
5. ~~Are there country-specific regulatory requirements driving KYC complexity?~~ **RESOLVED** — regulatory briefs stored in research_results for all 4 countries (2026-02-07).
6. What's the UK ePOR A/B test result? (Persona vs Trulioo)
7. **UAE CLM advantage is thin (+2.7%)** — regulatory research suggests free zone fragmentation + Arabic OCR as root causes. Consider segmenting by registration type. **→ Backlog task: expansion recommendation.**

## Waiting On

- **US diagnose** — backlogged, need to understand CLM underperformance root cause
- **UAE expansion recommendation doc** — backlogged, need segment-level analysis
- Yael maternity coverage plan clarity
