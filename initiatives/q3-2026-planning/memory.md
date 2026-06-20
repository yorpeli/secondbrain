## Status
Active planning, Jul to Sep 2026. Owner: Yonatan Orpeli. Agent: q-plan-pm. Parent pillar: quarter-planning.
Stage: strategic frame reconciled with the **top-down spine** (Yaron's CLM Q3 Investment Plan + Yonatan's response, both in `docs/`). 10 threads + cross-cut A; ~184 workbook line-items auto-mapped (in `plan.md`/`q3-plan-review.html`); exec deck for Oren built. Q3 is the first post-rollout quarter.

> Pull-only mirror of the canonical DB memory doc. Source docs: `docs/CLM_Q3_Investment_Plan-Yaron.docx`, `docs/yonatan-response-to-yaron.md`, 2 team workbooks, the Enterprise ask deck.

## Strategic Frame (top-down: Yaron + Yonatan)
- **Licensing as an AI Moat.** Regulatory licenses are a competitive barrier to keep high; AI-driven KYX automation on a licensed/compliant base compounds into a defensible advantage. India, periodic reviews, the Licenses track = moat-building base-layer investment.
- **Top-line outcome = FFT** (First Financial Transaction). The chain is approval CVR -> activation -> FFT. BRR is the gate before FFT.
- **T1/T2 company leverage** lens across all threads. Outcome-driven, experiment-led.
- Yaron's 4 prioritized impact areas: India/PACB compliance (P0, Meital) · Platform Modernization (40%, Yonatan + Avital) · Approval CVR · Activation (Approval->FFT).

## Strategic Threads (Q3 2026) - 10 threads + cross-cut A
1. **Regulatory & licensing (AI moat)** *(DEADLINE)* - Licenses owned by Meital (exec cover for Yael, on leave), Sitara (Principal PM) executing; Ido P&Q/India. India/PACB P0; Israel/AU/JP/Quebec; periodic review (PEL/UK SDD, CA, AU, JP, INC); SAR, payment tagging, VOP.
2. **Vendor modernization & orchestration** - Elad (EVS/DU). EVS->cloud, smart/RT vendor routing + redundancy per KYX step, vendor QA framework + agentic-KYC QA benchmark, AIPrise/Sumsub, new vendors. PROTECTED growth floor.
3. **Approval CVR & Activation (->FFT)** - KYC Journey/FDC + Self-Service. Approval CVR (T1/T2 cos) + FFT rate / time-to-FFT. RT OCR, eCollection / KYC New Flow (at-risk), FDC optimization, Open PS (BRR), CSP. Self-Service protected metric = BRR (gate before FFT).
4. **Existing-base migration / CLM cleanup** *(DEADLINE)* - Ido. Aug'26 start, Jan'27 finalize; 98% revenue retention. AHA-CLM-delta (8MW P0, Estella) on critical path.
5. **Partners / Enterprise** - Estella + Eliya. **eBay = RENEWAL** (P0), consent page (~50% drop), partner KYC integration, marketplaces.
6. **AI KYC / Agentic** - Yonatan/Shilhav (`claude-kyc-agent`, P0). **Flagship AI app.** Metric: extraction accuracy + **60% auto-resolution on D-leads** (Jul 15). Reduces manual review (cost-to-serve). vs Persona.
7. **China TICP optimization** - Jojo Zhou + CLM China.
8. **Localization** - L&L. India (committed); Singapore + UAE (at-risk); US (finishing, local vendors). + local e-collection vendors.
9. **Modernization / post-rollout platform** *(~40%)* - **Engineering-led** (Yonatan + Avital): on-prem->cloud, new data-component architecture, .NET/framework upgrades. Should feed AI/business outcomes. **Monitoring & Alerting is a resourced foundation track here.** Product items (vendors-to-cloud, orchestrator, KYC dashboard, LE refactoring) are a subset (⊕9). Separate full eng modernization deck coming.
10. **Top-of-funnel: Mobile & Lead Scoring** - Self-Service (Ira). Front half of the funnel (pre-registration): mobile-first acquisition + signup-to-submission + Lead Scoring (TICP A-C). Addresses the Q2 Mobile CVR lowlight. **DEPENDENCY: Mobile team (external to CLM).**
- **Cross-cut A:** entity / person-level "add company" model (Cards + Product Compliance depend on it).

## Gap reconciliation (top-down vs our bottoms-up frame)
- **CSP** = Delegated Onboarding (the "Onboarding Handover"). A CVR lever per Yaron (T1 hubs, CSP->customer handover) but **UNFUNDED -> tracked as a RISK**.
- **Mobile / top-of-funnel** = NEW Thread 10 (+ external Mobile-team dependency).
- **Cost-to-serve / auto-decisioning** = COVERED: AI-KYC manual-review reduction (T6) + vendor-orchestration costs (T2). Not a standalone track.
- **Monitoring & Alerting** = COVERED under Modernization (T9).
- **Ongoing lifecycle / InLife** (re-verification, reactivation, expansion) = **explicitly OUT of Q3 scope** - called out as a known omission.
- **Rollout stabilization** = COVERED (post-rollout/KTLO) but added as a **RISK** (a big rollout defect would eat all other efforts).

## Capacity Posture (decided)
- Protect a GROWTH FLOOR, weighted to vendor modernization (Thread 2). Freed localization dev -> EVS/DU.
- Compromise localization -> Thread 8, deprioritized (India only committed).
- Self-Service protects BRR (gate before FFT).
- Deadline threads (1 & 4) take first call.
- Modernization (9) ~40% engineering-led; overlaps vendor-mod (vendors-to-cloud counts in both); largely a separate eng track.

## Hard Deadlines
[2026-07-15] AI KYC: 60% auto-resolution on D-leads. [2026-08] migration START. [2027-01] migration finalize.

## Key Decisions (2026-06-19/20)
- Reconciled with Yaron's top-down investment plan + Yonatan's response (the spine). Frame: Licensing as an AI Moat; FFT top-line; T1/T2 lens.
- 10 threads. Added Thread 10 (Top-of-funnel: Mobile & Lead Scoring); external Mobile-team dependency. AI KYC raised to 60%. Modernization co-owned Yonatan + Avital; engineering-led infra; Monitoring under it. Cost-to-serve distributed (T6+T2). CSP unfunded + rollout-stabilization = risks; InLife out of scope.
- Licenses owner = Meital (exec cover for Yael, on maternity leave; temp); Sitara (Principal PM) executes. NOTE: an earlier session note that "Yonatan Birger leads Licenses" was an error - Birger is a Senior PM on Elad's KYC team, not Licenses.
- Partners owners = Estella + Eliya. eBay = a RENEWAL, P0. Multi-entity consumers = Cards + Product Compliance.
- Posture: protect growth, weighted vendor modernization. Self-Service protects BRR; "Open PS during onboarding" P2->P1.
- Enterprise deck: ask 05 (Payees Journey Control) DECLINED (no surface-ownership transfers either direction; no branched flows for onboarded customers yet). Ask 06 (Unified KYC Dashboard) COMMITTED (T9, clm-main semantic layer). Asks 03 (Walmart CRP - tension w/ CRP deprecation) + 04 (AHA audit) PENDING.

## Cross-team dependencies (Yonatan's alignment ratings)
- **Multi-entity** - Cards + Product Compliance depend on CLM (inbound). GREEN. Our side scattered across 4 items; consolidating = the alignment.
- **Lead Score** - CLM depends on Data Science (Yeali + Ofir). GREEN.
- **Open PS in onboarding (BRR)** - CLM depends on PS team. **RED** (P1, PS not yet engaged).
- **Mobile / top-of-funnel** - CLM depends on **Mobile team (external to CLM)**.
- **VOP** - Money-Movement-Platform depends on CLM (inbound). ORANGE (P2 our side).
- **Enterprise asks (cleanup, consent)** - Platform-Enterprise depends on CLM (inbound). GREEN.
- **India localized onboarding** - CLM depends on Translations (+ internal FDC/DU/Infra). ORANGE.

## Blockers & Risks (Q3 risk register)
- **CLM Migration (Part I) - RED:** miss Jan'27 backstop; ~$10M partner-rev exposure. Driver: gap analysis not yet scoped; AHA-delta critical path (funding unclear). Mitigation: scope early Q3; single owner (Ido); fund AHA-delta.
- **Resourcing / capacity - RED:** committed load > reclaimed capacity. Driver: 2 deadline threads + 40% modernization; missing MW estimates (Licenses, KYC Journey) + DU `#REF!`. Mitigation: close estimates; protect growth floor.
- **Cross-team dependencies - ORANGE:** India + Activation slip on unaligned upstreams (Open PS/PS team is RED; Mobile team external).
- **Unplanned external demand - ORANGE:** mid-quarter Enterprise/Walmart asks disrupt the plan; CRP collision.
- **CSP / Delegated Onboarding - unfunded** (the Onboarding Handover): a CVR lever with no funding.
- **Rollout stabilization** - post-rollout defect remediation is the principal Q3 capacity constraint; a big enough issue eats all other efforts.
- Owner concentration: Meital (Delegated OB + Licensing exec), Ido (P&Q + migration), Estella (Self-Service P0 + AHA-delta).

## Exec deck for Oren (presented 2026-06-20) - ARCHIVED
**Full deck record: `docs/oren-q3-deck.md`** (6 slides, slide-by-slide). The editable original (PPTX) lives in `docs/` and/or its SharePoint link. This is a point-in-time look-back artifact: what we committed to at the start of Q3 and why.
6 slides: 1) RUN/GROW allocation (RUN ~80%: KTLO 15 / RRC 25 / VSR 40 Modernization; GROW ~20%: Core Optimization 20 CVR + AI KYC seed). 2) CLM HL view (forward = growth engine + moat; Q2 lowlights Mobile CVR + activation; Q3 focus). 3) Q3 Initiatives (10 rows). 4) Health & Predictability (10 planned: 2 high / 7 med / 1 low = 20% high; 8 at-risk by driver). 5) Dependencies (6 rows incl external Mobile team). 6) Risks (6 rows: CLM Migration, Resourcing, Cross-team deps, Unplanned demand, CSP-unfunded, Rollout-stabilization).
**Lead narrative = "Licensing as an AI Moat" + FFT.**

## Pending Capture / Open
- Review + correct the item auto-map (thin threads 6 & 7; dedupe license rows); finish BRR re-sort; capture deliverables to DB.
- Close MW gaps (Licenses, KYC Journey); fix DU `#REF!`. Engage Mobile team (Thread 10) + PS team (Open PS).
- Decide Enterprise asks 03 (Walmart CRP) + 04 (AHA audit). Multi-entity consolidation. VOP bump (MMP).
- Fund decision: CSP / Onboarding Handover. Integrate engineering's full modernization deck. Apply Yael temp-cover DB reconciliation.

## Timeline of Key Events
[2026-06-19/20] Q3 planning with Yonatan: frame set, ~184 items mapped, exec deck for Oren built, **reconciled with Yaron's top-down investment plan + Yonatan's response**. Initiative created to capture it (the originating Yaron/Yonatan working session had not been saved).
