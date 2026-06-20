# CLM Q3 2026 - Executive Deck for Oren (CPO)

> Point-in-time record of the Q3 plan as presented to Oren Ryngler, 2026-06-20. Owner: Yonatan.
> Narrative spine: **Licensing as an AI Moat**; top-line outcome = **FFT**; **T1/T2** company leverage lens.
> The editable original (PPTX) lives alongside this file in `docs/` (and/or its SharePoint link). This markdown is the look-back record.

---

## Slide 1 - HL View | Q3 Planned Resource Allocation (RUN / GROW)

**RUN (~80%)**
- **KTLO ~15%** - Post-CLM-rollout activities (config/rollout-flag cleanup, periodic-review support, KTLO services)
- **RRC ~25%** - ~20% India License (+ Israel/AU/JP licensing, SAR, payment tagging, VOP); ~5% CLM Migration (Part I)
- **BAU** - folded into KTLO (no distinct slice)
- **VSR 40%** - Modernization (engineering-led: on-prem→cloud, .NET/framework upgrades, data re-architecture)

**GROW (~20%)**
- **Growth Enablement** - Partners/Enterprise, Multi-entity, China TICP
- **Core Optimization ~20%** - Activation & CVR (→FFT)
- **New Value Prop ~5%** - AI-based KYC (Claude agent)

## Slide 2 - CLM High-level View
- **Forward looking:** CLM as a growth engine, enabling high activation and fast onboarding for high-quality customers - while maintaining Payoneer's moat: high-quality customer data, **licenses (an AI moat)**, strong compliance, and KYC operational excellence. Top-line outcome = **FFT**.
- **Q2 Recap** - Highlights: CLM at 100%. Lowlights: Lower Mobile CVR; activation rates need to be higher.
- **Q3 Focus:** Modernization · India License · CLM Migration (Part I) · Activation Optimization (incl. CVR→FFT) · AI-based KYC

## Slide 3 - HL View | Q3 Planned Initiatives
| Key Result | Initiative | Exp. Impact | Health | Comments |
|---|---|---|---|---|
| New licensed markets live, 100% compliant | India License (+ IL/AU/JP, SAR, tagging) | New-market enablement; India CVR | 🟠 | Deadline-driven; cross-domain deps (FDC/DU/Infra); India requirements firming |
| Existing base brought to CLM compliance | CLM Migration - Part I | 100% compliance by Jan'27 | 🟠 | Q3 = scope + enablers; gap-analysis net-new; AHA-delta on critical path |
| Modernized, resilient platform (velocity/stability/scale) | Modernization (~40%) | Latency/stability/dev-velocity; enables AI-automation base (OKRs being defined) | 🟢 | Cross-cutting; engineering-led |
| Higher activation / Business-Ready Rate | Activation & CVR Optimization (→FFT) | Vendor flexibility + KYC-approval uplift; +0.2 CVR (smart routing); multiple CVR uplifts | 🟢 | CVR + BRR improvements |
| Autonomous KYC document handling | AI-based KYC | 60% auto-resolution on D-leads (target); less vendor dependence | 🟠 | Flagship AI app; vs Persona; Jul 15 |
| Enterprise/partner conversion protected | Partners / Enterprise | Recover ~50% consent drop; support eBay Renewal | 🟠 | eBay P0; consent-flow fix; external Enterprise demand |
| Multi-entity ("add company") enabled | Multi-entity model | 20% add-company adoption; unblocks Cards + Product Compliance | 🟠 | Cross-crew demand |
| Localized onboarding in priority markets | Localization | Per-market CVR | 🟠 | India committed; SG/UAE at-risk; US finishing w/ local vendors |
| Front-half-of-funnel conversion | Top-of-funnel: Mobile & Lead Scoring | Mobile signup→submission CVR; TICP lead-rank | 🟠 | Mobile CVR lowlight; depends on external Mobile team |
| CSP→customer handover (Tier-1 hubs) | CSP / Delegated Onboarding | Company approval CVR (US/UK/SG/HK/UAE) | 🔴 | UNFUNDED - see Risks |

## Slide 4 - Q3 Health and Predictability
**Summary:** Q3 is deliverable but front-loaded. Deadline-driven compliance (India/PACB, CLM migration) and the ~40% modernization track take first call, with a protected growth floor underneath. Predictability is moderate - only 2 of 10 initiatives are high-confidence; the rest hinge on cross-domain alignment, a few external dependencies (PS, Mobile, Data Science), and unscoped discovery. Major risks: CLM migration and post-rollout stabilization (a large defect there would eat into everything else).

**HL Health - Crew:** Total Planned 10 · High 🟢 2 · Med 🟠 7 · Low 🔴 1 · High/Total 20% (2/10). *(High = Modernization, Activation & CVR→FFT. Low = CSP, unfunded.)*

**Initiatives at Risk - Crew:** Total not-high 8 · External deps 2 · Cross-domain 3 · Capacity gaps 1 · Discovery 2 · Tech debt 0.
- External (2): Partners/Enterprise, Top-of-funnel/Mobile · Cross-domain (3): India, Multi-entity, Localization · Capacity (1): CSP · Discovery (2): CLM Migration, AI KYC.

## Slide 5 - Dependencies
| Initiative | Dependencies | Aligned? | Comments |
|---|---|---|---|
| Multi-entity / add-company | Cards + Product Compliance depend on CLM (inbound) | 🟢 | Our side scattered across 4 items |
| Lead Score | CLM depends on Data Science | 🟢 | Confirm DS modeling capacity (online model + enrichment) |
| Open PS in onboarding (BRR) | CLM depends on PS team | 🔴 | Outbound; P1, PS not yet engaged |
| VOP (Verification of Payee) | Money-Movement-Platform depends on CLM (inbound) | 🟠 | P2 our side - reconcile priority |
| Enterprise asks (cleanup, consent) | Platform-Enterprise depends on CLM (inbound) | 🟢 | |
| Top-of-funnel / Mobile | CLM depends on Mobile team (external) | 🔴 | Mobile still not satisfactory, esp. Mobile-First countries |

## Slide 6 - Risks for Q3
| Initiative | Risk Level | Risk (Impact) | Primary Risk Driver | Corrective Action | Delivery Conf. |
|---|---|---|---|---|---|
| CLM Migration (Part I) | 🔴 | Miss Jan'27 compliance backstop | Gap analysis not yet scoped; AHA-delta on critical path (funding unclear) | Scope gap analysis early Q3; single owner (Ido) across P&Q+SS+Infra; fund AHA-delta | Medium |
| Resourcing / capacity | 🔴 | Committed load > reclaimed post-rollout capacity → deadline slips or growth starved | 2 deadline threads (India + Migration) + 40% modernization | Close estimates + protect growth explicitly | Medium |
| Cross-team dependencies | 🟠 | India License & Activation slip on unaligned upstreams | India needs FDC/DU/Infra/Reg/Translations; Open PS needs PS team | Lock cross-team commitments | Medium |
| Unplanned external demand | 🟠 | Mid-quarter asks disrupt the committed plan | Tight resourcing prevents significant changes | Triage asks vs capacity now | Medium |
| CSP / Delegated Onboarding | 🔴 | A top CVR lever doesn't get delivered | Unfunded | Fund it or explicitly descope | Low |
| Rollout stabilization | 🔴 | A large post-rollout defect eats all other Q3 capacity | Post-rollout remediation is the principal Q3 capacity constraint | Sequence against it / hold buffer - don't layer on top | The constraint everything else rides on |
