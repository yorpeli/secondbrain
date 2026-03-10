# Vendor Optimization PM — Agent Memory

> Agent: vendor-optimization-pm
> Scope: KYC vendor portfolio management, POC lifecycle, coverage gap analysis, vendor deprecation
> Maps to: KYC Service team (Elad Schnarch) — contributors: Elad (strategy), Yarden (documents), Vova (EVS/eKYX)
> Onboarded: 2026-03-10

## Last Updated
2026-03-10 (post-onboarding data collection — full sweep of PPP, meetings, action items, agent_log, initiative memory, quarterly plan, research, people context)

## Vendor Portfolio

### Production Vendors

| Vendor | Capability | Countries | Key Metric | Status | Notes |
|--------|-----------|-----------|------------|--------|-------|
| **Persona** | OCR, POR, CVD, eKYC | Expanding (7+ countries planned) | POR auto-approval lower than UIPath | Active — scaling | Primary doc verification vendor. 2x traffic increase planned for POR/CVD. UK ePOR A/B with Trulioo. |
| **Au10tix** | Document auth, fraud verdict, selfie | 190+ countries (doc auth) | 60% false reject rate (workshop Jan 22) | Active + POC | Fraud verdict alignment launched Mar 1. Government-grade docs. UA jurisdiction issue. |
| **Trulioo** | eKYC, eKYB, ePOR | Multi-country | eKYX match rate: 66.6% T1-2, 64.5% global (target 70% EOQ1) | Active + POC | UK ePOR A/B test running. eKYB POC agreement finalized. ML-optimized regional routing. |
| **RAI** | Document classification | Global | 98% real-time coverage | Active | Increased from lower coverage to 98%. MSA and LLM activation for reduced false negatives. |
| **AsiaVerify** | eCollection | HK (production), APAC (expanding) | Saves 3 min/ticket x 3,000 companies/month | Active | Promising for KR, TH, VN, PH eCollection. |

### Deprecating Vendors

| Vendor | Capability | Status | Days Since First Flag | Blocker |
|--------|-----------|--------|-----------------------|---------|
| **UIPath** | POR OCR | Deprecation plan overdue | **47 days** (first flagged Jan 22) | Per Mar 5 1:1: Elad says 100% Persona by May would allow UIPath deprecation. Has a plan but hasn't sent it. Original ETA was Mar 7 — still not delivered. |

### POC Pipeline

| Vendor | Capability | Stage | Hypothesis | Success Criteria | Owner | Start Date | Time-box | Last Update | Status |
|--------|-----------|-------|------------|-----------------|-------|-----------|----------|-------------|--------|
| **AiPrise** | eKYB | RESULTS | AiPrise achieves >80% match rate in target markets | Match rate >80% in majority of tested countries | Vova | ~Feb 2026 | TBD | Mar 7 (results received) | **Pending Vova validation** |
| **AiPrise** | eKYX | TESTING | AiPrise eKYX improves match rates vs current stack | TBD | Vova | Feb 19 | TBD | Feb 19 (testing started) | Active |
| **Trulioo** | eKYB | TESTING | Trulioo eKYB expands coverage for business verification | TBD | Vova | ~Feb 2026 | TBD | Feb 26 (batch testing) | Active |
| **IDMerit** | eKYB | AGREEMENT | IDMerit fills LATAM eKYB gaps | TBD | Vova | Feb 12 (legal review) | TBD | Feb 12 | Pending legal |
| **Au10tix** | eKYC/eKYB | TESTING | Au10tix POC improves verification in target markets | TBD | Vova | Feb 19 (finally initiated) | TBD | Feb 19 | Active |
| **Sumsub** | Selfie | AGREEMENT | Sumsub provides competitive selfie verification | TBD | Elad | Jan 29 (pricing received) | TBD | Mar 5 (fast-tracking via Applause) | **Active — bundled into selfie POC sprint** |
| **AiPrise** | Selfie | AGREEMENT | AiPrise selfie verification quality | TBD | Elad | Mar 5 (bundled) | TBD | Mar 5 (fast-tracking via Applause) | **Active — bundled into selfie POC sprint** |
| **Persona** | Selfie | AGREEMENT | Persona selfie verification quality | TBD | Elad | Mar 5 (bundled) | TBD | Mar 5 (fast-tracking via Applause) | **Active — bundled into selfie POC sprint** |
| **Applause** | Selfie testing platform | ACTIVE | Applause provides testing infrastructure for all selfie POCs | N/A | Elad | Jan 22 (agreement closed Feb 5) | N/A | Mar 5 (being used as test platform for AiPrise/Persona/Sumsub) | **Active — testing platform, not a vendor POC** |

### AiPrise eKYB POC Results (Mar 7)

First match metrics received. Results by country:

| Country | Match Rate | Assessment |
|---------|-----------|------------|
| Argentina | 99.2% | Strong |
| Colombia | 99.2% | Strong |
| Mexico | 97.6% | Strong |
| Japan | 86.4% | Decent |
| Israel | 66.3% | Weak |
| Philippines | 66.9% | Weak |
| Ukraine | 58.2% | Weak |
| Vietnam | 53.0% | Weak |
| Pakistan | No data yet | Gap |
| Turkey | No data yet | Gap |
| UAE | No data yet | Gap |

**Key signal:** LATAM coverage is strong. MENA/SEA is weak. Next step: Vova needs to cross-reference against Payoneer internal data before results are actionable. Task created Mar 7, due Mar 21.

## EVS Funnel (as of Feb 12, 2026)

```
TOTAL REQUESTS:   128,731  (Total hits to entry point)
INELIGIBLE:        89,039  (69.2% — Pre-API rejection, NO VENDOR COVERAGE)
ELIGIBLE:          39,692  (30.8% — Processed by vendors)
VERIFIED:          17,633  (13.7% — Final verified)
  Matches:         17,633
  No Match:        18,199
  Other:            3,860
```

**Match rate among eligible:** 44%
**Ineligibility root causes:** Not supported country, incorrect/missing data, ePOCA not allowed when no eKYB

The 69.2% ineligible cohort is the biggest lever. Every point of coverage reclaimed = more users entering vendor verification.

## Coverage Matrix (Known Gaps & Coverage)

### eKYX Match Rates (Trulioo — primary)

- T1-2: 66.6% (target 70% EOQ1)
- Global: 64.5%
- Trend: +~1% WoW as of Feb 19, then flat Feb 26

### Document Verification (Persona rollout status)

Countries with Persona POR active: expanding (UA, TR, AE added to sandbox Jan 29)
Countries with Persona CVD active: PK, SG, KR, IL (opened/planned Jan 29)
UIPath POR: still active, pending sunset plan

### eKYB Coverage

- Trulioo: production (multi-country), POC for expansion
- AiPrise: POC results in (strong LATAM, weak MENA/SEA)
- IDMerit: pending legal (LATAM focus)

### eCollection

- AsiaVerify: HK production, APAC expansion promising (KR, TH, VN, PH)
- BVD: special characters fix enabling additional countries

## PPP Status History

| Week | Status | Key Theme |
|------|--------|-----------|
| Jan 22 | potential-issues | Au10tix workshop (60% false reject), data blindness, multiple POCs starting |
| Jan 29 | potential-issues | Docs orchestration live, UIPath deprecation not done, Applause/Sumsub negotiations |
| Feb 5 | potential-issues | UIPath still not done, data blindness critical, EVS-DCM mapping complete, Germany bot attack |
| Feb 12 | potential-issues | UIPath STILL not done, EVS funnel analysis (69.2% rejection), AiPrise/Trulioo/IDMerit POCs advancing |
| Feb 19 | on-track | AiPrise/Trulioo/Au10tix POCs all started, EVS rule manager identified as future bottleneck |
| Feb 26 | on-track | Auth fallback at 50%, Au10tix fraud verdict complete, global OCR rollout planned Mar-May |

**Trend:** Improved to on-track from Feb 19. UIPath remains a recurring drag. POC momentum accelerating.

## Open Action Items (as of Mar 10)

| Item | Owner | Due | Status | Days Open |
|------|-------|-----|--------|-----------|
| UIPath deprecation plan — Elad has it, hasn't sent. By May could be 100% Persona. | Elad | Was Mar 7 | **Overdue** — plan exists but not shared | 47+ days since first flag |
| AiPrise eKYB — Vova validation against Payoneer data | Vova/Elad | Mar 21 | Pending | 3 days |
| Check Vova validation status (next 1:1 agenda) | Yonatan | Mar 21 | Pending | 5 days |
| Selfie POC sprint — AiPrise, Persona, Sumsub all testing via Applause | Elad | TBD | Active (Mar 5 — commercial agreement broken to fast-track) | 5 days |
| Selfie rules review — nonsensical matching criteria discovered | Elad | TBD | New (Mar 5) — doc type mismatch auto-approving | 5 days |
| Persona convention — get Yaron's input on Yarden attending | Yonatan | No date | Open | 29 days |
| DLC/LaunchDarkly escalation — specific examples | Maya | Was Feb 13 | Overdue | 25+ days |
| Data blindness — Yonatan handling on thread with Maya (Mar 5) | Yonatan/Maya | No date | In progress | 47+ days since first flag |
| Fraud comparison RAI vs Persona — Yarden said "next week" on Feb 26 | Yarden | Was ~Mar 5 | **Overdue** — no results shared yet | 12 days |

## Open Questions

1. ~~Did Elad deliver the UIPath deprecation plan by Mar 7?~~ **PARTIALLY ANSWERED (Mar 5):** Elad says he has it but hasn't shared. Claims 100% Persona by May. Need to see the actual plan with country-by-country timeline.
2. ~~What is the status of Sumsub POC negotiation?~~ **ANSWERED (Mar 5):** Sumsub bundled into selfie POC sprint with AiPrise and Persona. All testing via Applause. Commercial agreement broken to fast-track.
3. ~~What happened with Applause Selfie POC?~~ **ANSWERED (Mar 5):** Applause is the testing PLATFORM, not a vendor POC. Being used to test AiPrise, Persona, Sumsub selfie simultaneously.
4. What are the fraud comparison results between RAI and Persona? (Yarden said "next week" on Feb 26 — now 12 days overdue)
5. What countries are in the Global OCR rollout plan (Mar-May)?
6. Has the EVS Rule Manager bottleneck been addressed? (flagged Feb 19 as "POC solution in progress")
7. Is the eKYX match rate on track for 70% EOQ1 target? (66.6% T1-2 as of Feb 26, target needs +3.4pp in ~4 weeks — Q1 ends ~Mar 31, only 3 weeks left)
8. **NEW:** What is the full scope of the selfie rules issue? (Mar 5 — doc type mismatch auto-approving. Needs full rules audit.)
9. **NEW:** What are the Vova POC results that were sent Mar 5? (Yonatan reviewed, "looking good" — need details)
10. **NEW:** No PPP data since Feb 26 — 12-day gap. Next PPP should show Mar 5 or Mar 12 data. Critical for eKYX match rate tracking.

## Playbook Contributions

*None yet — will add generalizable learnings as the agent begins operating.*

## People Context (Contributors)

| Person | Slug | Role | Current Focus | Key Strengths |
|--------|------|------|--------------|---------------|
| **Elad Schnarch** | elad-schnarch | Principal PM, KYC Service | Persona migration (100% by May), Selfie POCs (AiPrise/Persona/Sumsub via Applause), DeepCheck (AI committee), KYC New Flow (Maya), Foundry & AI effort | Data mastery, driver mentality, deep domain expertise, strategic vision |
| **Vladimir Pimonov (Vova)** | vladimir-pimonov | Product Manager | EVS/eKYX optimization, vendor POC execution (AiPrise/Trulioo/Au10tix/IDMerit) | Building AI PM agent with Cursor, hands-on with data |
| **Yarden Reitzes** | yarden-reitzes | Senior PM, KYC & Ops Efficiency | Documents — OCR, authenticity, classification, POR/CVD rollout, Persona traffic scaling | Working with Cursor regularly, strong on fraud/doc verification |

## AB Test Intelligence

EXPID-140 (Full Address Experiment) — relevant to vendor performance:
- Manual Review arm: control-wins on fft_dynamic_measure (-40.66% lift, p=0.0000)
- Persona arm: treatment-wins on icp_10k (+194.09% lift, p=0.0013)
- **Signal:** Persona outperforms on high-value metric (icp_10k) but underperforms on dynamic measure. Needs deeper analysis of what this means for vendor routing decisions.

## Quarterly Plan Context

- **"Vendor Results Improvements"** — status: in-progress, theme: Vendor Optimization. Description: "Improve existing vendors performance to increase automation and accuracy." No expected impact quantified.

## Investigation History

| Date | Topic | Key Findings |
|------|-------|-------------|
| 2026-03-10 | Full onboarding data collection | Swept all 10 data sources. Key new findings from Mar 5 1:1: (1) UIPath 100% Persona by May — plan exists but not shared, (2) Selfie POC sprint — AiPrise/Persona/Sumsub all testing via Applause (commercial agreement broken to fast-track), (3) Selfie rules issue — doc type mismatch auto-approving, needs audit, (4) Vova sent POC results (Yonatan says "looking good"). Also found: competitive-analysis agent recommends Middesk/Persona for US eKYB, domain-expertise has regulatory research on UAE free zone complexity affecting vendor stack. No PPP data since Feb 26 — 12 day gap. |
| 2026-03-10 | Initial onboarding | Seeded from initiative memory, 6 weeks of PPP (Jan 22 - Feb 26), meeting action items. Identified: UIPath deprecation chronically stalled, AiPrise POC results in hand (strong LATAM, weak MENA/SEA), eKYX match rate below EOQ1 target, 69.2% EVS ineligibility is the #1 lever. |
