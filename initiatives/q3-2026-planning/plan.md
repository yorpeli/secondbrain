# Q3 2026 CLM Plan - working draft

> **Living working doc** (canonical: re-render with `python3 _render.py`). `q3-plan-review.html` is generated from the same script. DB memory doc refreshed at checkpoints.
> Window: 2026-07-01 to 2026-09-30. Owner: Yonatan. Agent: q-plan-pm.
> First-pass auto-map (184 items). ⊕ = cross-thread tag (A = entity/person model; digits = other threads, incl ⊕9 = counts toward the ~40% modernization). REVIEW + correct misfits.

## Build steps
1. [x] Lock the main threads (9 threads + cross-cut A)
2. [~] **Map planning items -> threads (first-pass auto-map; needs review)**
3. [~] Cross-team dependencies + inbound requests (below)
4. [ ] Map everything to top-line metrics (workbook metric carried per item)

## Posture (decided)
- **Strategic frame: Licensing as an AI Moat** (Yaron + Yonatan, top-down). A compliant licensed base + AI-driven KYX automation compounds into a defensible advantage. **Top-line outcome = FFT** (approval CVR -> activation -> FFT). **T1/T2 company** leverage lens across all threads.
- **Protect a growth floor**, weighted to **vendor modernization** (freed localization dev -> EVS/DU).
- **Compromise localization** -> Thread 8, deprioritized (India committed; SG/UAE at-risk; US finishing with local vendors).
- **Self-Service protects BRR** (Business Ready Rate), not CVR. "Open PS during onboarding" -> P1.
- **Deadline threads (1 & 4) take first call** on capacity.
- **Modernization (Thread 9) ~= 40% of effort**, cross-cutting. It overlaps the protected vendor-mod floor (vendors-to-cloud counts in both), so the 40% is *not* fully additive on top of the growth floor.

## Threads overview
| # | Thread | Owner | Type | Items |
|---|--------|-------|------|-------|
| 1 | Regulatory & licensing (AI moat) | Meital (Licenses, exec cover for Yael) · Sitara (PM) · Ido (P&Q/India) · License Infra | deadline | 23 |
| 2 | Vendor modernization & orchestration | Elad (EVS/DU) | protected growth | 37 |
| 3 | Approval CVR & Activation (→FFT) | KYC Journey/FDC + Self-Service | growth | 59 |
| 4 | Existing-base migration / CLM cleanup | Ido (+ Estella AHA delta) | deadline | 10 |
| 5 | Partners / Enterprise | Estella + Eliya | growth | 11 |
| 6 | AI KYC / Agentic | Yonatan / Shilhav | strategic | 2 |
| 7 | China TICP optimization | Jojo Zhou + CLM China | growth | 2 |
| 8 | Localization | L&L (confirm) | growth | 13 |
| 9 | Modernization / post-rollout platform | Engineering: Yonatan + Avital (on-prem→cloud, .NET, data arch; Monitoring & Alerting here) | ~40% · modernization | 17 |
| 10 | Top-of-funnel: Mobile & Lead Scoring | Self-Service (Ira) · dep: Mobile team (external) | growth | 10 |

- **Cross-cut A:** entity / person-level "add company" model (Cards + Product Compliance both pulling on it)


## Thread 1 - Regulatory & licensing (AI moat)
**Owner:** Meital (Licenses, exec cover for Yael) · Sitara (PM) · Ido (P&Q/India) · License Infra · **Type:** deadline · **Top-line:** India/PACB P0 + moat base-layer

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | Australia License Migration | Licenses | - | Yes | Conversion | ⊕4 | 1. FDC + Document understanding - enabling docs expiry date of 3 months for utility bills  |
| P0 | Australia License Migration | P&Q Plan | - | - | - | ⊕4 | - |
| P0 | India License | P&Q Plan | 6 | Yes | Conversion | ⊕8 | - |
| P0 | India License Migration | P&Q Plan | - | - | Conversion | ⊕4 ⊕8 | - |
| P0 | Indirect tax - Nigeria (VAT) | License Infra | - | Yes | - | - | - |
| P0 | Israel License | P&Q Plan | - | - | - | - | - |
| P0 | Japan License - Pre-discovery and application | Licenses | - | TBD | Conversion | - | - |
| P1 | CPM UI | P&Q Plan | ???? | Yes | - | - | - |
| P1 | Fuzzy Matching via Data Compare Service​ | P&Q Plan | 1 | Yes | - | - | - |
| P2 | VOP - Verification of payee | License Infra | 2 | Yes | - | - | - |
| P3 | SAR Hong Kong [High] | License Infra | 1 | - | - | - | - |
| - | Banking table automation (Kryba integration) | License Infra | 4 | - | - | - | - |
| - | DEM to Operate on Person Level | P&Q Plan | 5 | - | - | ⊕A | - |
| - | Payment Tagging - Add new licenses [Q4] | License Infra | 8 | - | - | - | - |
| - | Payment Tagging - money-in processor [Q4] | License Infra | 2 | - | - | - | PS, BLS |
| - | SAR Australia [Medium] | License Infra | - | - | - | - | - |
| - | SAR Inc | License Infra | - | - | - | - | - |
| - | SAR Japan [Medium] | License Infra | - | - | - | - | - |
| - | SAR PEL [low] | License Infra | - | - | - | - | - |
| - | SAR UK [low] | License Infra | - | - | - | - | - |
| - | Screening Adjasments | License Infra | 2 | - | - | - | - |
| - | Screening Integration [Q4] | License Infra | 2 | - | - | - | Screening |
| - | Stablecoin Wallet Enablement | P&Q Plan | - | - | - | - | - |


## Thread 2 - Vendor modernization & orchestration
**Owner:** Elad (EVS/DU) · **Type:** protected growth · **Top-line:** KYC approval rate / efficiency (+ QA layers)

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | New vendor integration - AIPrise | EVS Q3 plan | 4 | - | Conversion | - | - |
| P0 | Smart vendor routing | EVS Q3 plan | 8 | - | Efficiency | - | - |
| P0 | Sumsub POC and rollout | EVS Q3 plan | 3 | - | Conversion | - | - |
| P1 | AddressValidation Service - support/enchancement | EVS Q3 plan | 2 | - | Efficiency | - | - |
| P1 | BVD to cloud | EVS Q3 plan | - | - | Efficiency | ⊕9 | - |
| P1 | EVS <> DCM | EVS Q3 plan | 6 | - | Efficiency | ⊕9 | - |
| P1 | Fuiou to cloud | EVS Q3 plan | - | - | Efficiency | ⊕9 | - |
| P1 | Launch Darkly Integration | EVS Q3 plan | TBD | - | Efficiency | - | - |
| P1 | Persona to cloud | EVS Q3 plan | - | - | Efficiency | ⊕9 | - |
| P1 | Trulioo to cloud | EVS Q3 plan | 8 | - | Efficiency | ⊕4 ⊕9 | - |
| P1 | URL Validation Service - support/enchancement | EVS Q3 plan | 2 | - | Efficiency | - | - |
| P2 | New vendor integration - Au10tix | EVS Q3 plan | 6 | - | Conversion | - | - |
| P3 | India license support | EVS Q3 plan | 1 | - | Conversion | ⊕8 | - |
| P3 | Individual fetch data - discovery | EVS Q3 plan | 2 | - | Conversion | - | - |
| P3 | Israel License - support/discovery | EVS Q3 plan | 1 | - | Conversion | - | - |
| P3 | Japan PKK - new eKYC - support/discovery | EVS Q3 plan | 1 | - | Conversion | - | - |
| - | Address validation - alternative solutions to Google | DU Q3 2026 | - | - | - | - | - |
| - | Align au10tix decision | DU Q3 2026 | - | - | - | - | - |
| - | Automate more documents: Poca, bank doc, Held ID | DU Q3 2026 | - | - | - | ⊕9 | FDC for data elements |
| - | Customer Risk Score - support/enchancement | EVS Q3 plan | - | - | - | - | - |
| - | Data - Activity with ECS | DU Q3 2026 | - | - | - | - | None |
| - | Data requirements | DU Q3 2026 | - | - | - | - | - |
| - | Datamodelprocessing Sservice - support | EVS Q3 plan | - | - | - | - | - |
| - | File Sanitization (meta defender upgrade) | DU Q3 2026 | - | - | - | - | None |
| - | India - person via vendor / | DU Q3 2026 | - | - | India | ⊕8 ⊕A | CLM |
| - | Integrate with DVM/DCM compare service | DU Q3 2026 | - | - | - | - | Qualification |
| - | Mass actions service - support | EVS Q3 plan | - | - | - | - | P&Q |
| - | NMM improvements | DU Q3 2026 | - | - | - | - | - |
| - | New entity model - Person entity eKYX | EVS Q3 plan | 4 | - | Conversion | ⊕A | - |
| - | No reopen for high segments - manual only | DU Q3 2026 | - | - | - | - | FDC? |
| - | RT monitor | DU Q3 2026 | - | - | - | - | - |
| - | Remove ofac criteria for all: ID, POR | DU Q3 2026 | - | - | - | - | Screening |
| - | Resistant tier leveling | DU Q3 2026 | - | - | - | - | - |
| - | Review explainer Ops | DU Q3 2026 | - | - | - | - | - |
| - | Serial fraud two way feedback loop with au10tix | DU Q3 2026 | - | - | - | - | - |
| - | Submission charecteristics to RAI | DU Q3 2026 | - | - | - | - | None |
| - | Sumsub Docs POC | DU Q3 2026 | - | - | - | - | - |


## Thread 3 - Approval CVR & Activation (→FFT)
**Owner:** KYC Journey/FDC + Self-Service · **Type:** growth · **Top-line:** Approval CVR (T1/T2) + FFT rate / time-to-FFT

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | Busienss type question | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| P0 | Data | KYC Journey Q3 2026 | - | - | Modernization | - | - |
| P0 | Documents expiration date configuration per country | FDC Q3 2026 | 4 | Yes | 100% Compliance | - | - |
| P0 | Experiments entry point | KYC Journey Q3 2026 | - | - | Modernization | - | - |
| P0 | India CLM Flow | FDC Q3 2026 | 6 | Yes | CVR | ⊕8 | License Infra team / Reg team / Production services / Translations team / DU team / P&Q te |
| P0 | New Selfie Infra | FDC Q3 2026 | 6 | Yes | - | - | - |
| P0 | Organization type simplification | H2 2026 Candidates - Self Servi | 2 | - | - | - | - |
| P0 | POR in AS | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| P0 | Reg.<> Journey Service autonomy | KYC Journey Q3 2026 | - | - | Modernization | - | - |
| P0 | Remove whatsapp phone verification - APAC | H2 2026 Candidates - Self Servi | 1 | - | - | - | - |
| P0 | Segmentation - Smart industry search | H2 2026 Candidates - Self Servi | 2-4 | - | - | - | - |
| P0 | Sumamry page for ecollection | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| P1 | Add company (home team) | H2 2026 Candidates - Self Servi | - | TBD | - | ⊕A | - |
| P1 | Bank details UX - Company | H2 2026 Candidates - Self Servi | 0 | - | - | ⊕2 | MMP |
| P1 | CVD/POCA collection in AS | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| P1 | Criteria Accuracy | FDC Q3 2026 | TBD | Yes | CVR | - | - |
| P1 | EDD LOB post account set up verification | FDC Q3 2026 | 0 | Yes | CVR | - | - |
| P1 | Inrule - Oscilar support | H2 2026 Candidates - Self Servi | 1 | - | - | - | - |
| P1 | KYC Orchestration - Leftovers | H2 2026 Candidates - Self Servi | 2 | Yes | - | ⊕2 | profile(linda)  and e-verificarion (anton) |
| P1 | LE Sole owner collection in AS | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| P1 | LS - Data enrichment | H2 2026 Candidates - Self Servi | 0 | Yes | Efficiency | ⊕9 | Data Science team ( Yeali's team), Shachar's team  . |
| P1 | RT OCR CVD | FDC Q3 2026 | 6 | TBD | CVR | - | KYC Ops resources / Reg team |
| P1 | RT OCR POR | FDC Q3 2026 | 10 | Yes | CVR | ⊕4 | - |
| P1 | RT survey | KYC Journey Q3 2026 | - | - | NA | - | - |
| P1 | RTC for POCA experiment | FDC Q3 2026 | 1 | Yes | CVR | - | - |
| P1 | Real Time Actions Latencey | FDC Q3 2026 | 4 | TBD | CVR | - | - |
| P1 | Support Entity Model [Person] | FDC Q3 2026 | 12 | Yes | Adoption | ⊕2 ⊕A | Legal Entity team / P&Q team |
| P2 | Blocked account due to duplicate account | H2 2026 Candidates - Self Servi | - | No | Conversion | - | - |
| P2 | FDC Documentation | FDC Q3 2026 | - | TBD | - | - | - |
| P2 | New CVD and POCA requirement page UI | FDC Q3 2026 | TBD | No | - | - | - |
| P2 | New Entity for Cards (KYC for employee) | FDC Q3 2026 | 2 | TBD | - | ⊕A | - |
| P2 | Offer WhatsApp as sole phone verification method instead of blocking p | H2 2026 Candidates - Self Servi | - | - | Efficiency | - | - |
| P2 | Onboarding with no BA | H2 2026 Candidates - Self Servi | - | - | - | - | MMP, InRule |
| P2 | Open PS during the onboarding | H2 2026 Candidates - Self Servi | - | - | Conversion | - | PS, PS team |
| P2 | P&P support | H2 2026 Candidates - Self Servi | - | - | - | - | InRule/AAS, P&P |
| P2 | RT OCR POCA | FDC Q3 2026 | TBD | No | CVR | - | KYC Ops resources / Reg team |
| P2 | Replace the segmentation questions experiment | H2 2026 Candidates - Self Servi | 4 | - | Efficiency | - | - |
| P3 | Document reuse | FDC Q3 2026 | - | No | - | - | - |
| P3 | LS - Managing email domain from internal data | H2 2026 Candidates - Self Servi | 1 | - | Efficiency | ⊕9 | Data Science team ( Yeali's team), Support from Data dep, Data Analyst Team (Ofir's team) |
| P3 | Legal Entity collection as part of Account setup | H2 2026 Candidates - Self Servi | - | - | Conversion | ⊕A | - |
| P3 | Password Protected | FDC Q3 2026 | TBD | No | - | - | KYC Group |
| P3 | RT OCR BAV | FDC Q3 2026 | TBD | No | CVR | - | KYC Ops resources / Reg team |
| P3 | RT OCR BO feedback loop | FDC Q3 2026 | TBD | No | - | - | BO |
| P3 | RT OCR POR LE | FDC Q3 2026 | TBD | No | CVR | - | KYC Ops resources / Reg team |
| P3 | RTC & RTQ for Held ID | FDC Q3 2026 | TBD | No | CVR | - | - |
| P3 | Use CVD as POCA | FDC Q3 2026 | TBD | No | CVR | - | - |
| P4 | Bug - Phone country MM | H2 2026 Candidates - Self Servi | - | - | - | - | - |
| - | CVD download from vendor | KYC Journey Q3 2026 | - | - | - | ⊕2 | - |
| - | Communications | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| - | Entity model - add company | KYC Journey Q3 2026 | - | - | - | ⊕A | - |
| - | Fuzzy match for eCollection / IDV / POR / CVD / POCA | KYC Journey Q3 2026 | - | - | Account approval | - | - |
| - | Orchestration | KYC Journey Q3 2026 | NA | - | Account approval | - | * Registration? / * P&Q / * EVS |
| - | Orchestration | KYC Journey Q3 2026 | NA | - | Account approval | - | * Registration? / * P&Q / * EVS |
| - | PH for split | H2 2026 Candidates - Self Servi | - | - | - | - | - |
| - | Segmentation re-design | KYC Journey Q3 2026 | - | - | - | - | - |
| - | Support IDV for IL?? | KYC Journey Q3 2026 | - | - | - | - | - |
| - | Support doc. upload draft mode | KYC Journey Q3 2026 | - | - | - | - | - |
| - | Support draft mode | KYC Journey Q3 2026 | - | - | - | - | - |
| - | eCollection for LE | KYC Journey Q3 2026 | - | - | Account approval | - | * P&Q / * EVS |


## Thread 4 - Existing-base migration / CLM cleanup
**Owner:** Ido (+ Estella AHA delta) · **Type:** deadline · **Top-line:** 100% compliance by Jan'27; 98% rev retention

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | AHA - CLM delta | H2 2026 Candidates - Self Servi | 8 | TBD | Conversion | - | P&Q/ Inrule AAS |
| P0 | Israel License | Licenses | - | Yes | Conversion | - | 1. CLM - IDV + selfie in new onboarding requires additional restrictions  / 2. Data - safe |
| P0 | Periodic Review Implementation (PEL/UK SDD, AU, CA) | P&Q Plan | ??? | - | - | - | - |
| P0 | User Journey optimization - Companies | H2 2026 Candidates - Self Servi | 5 | Yes | - | - | - |
| P1 | Move Payer / Reveicer question to CLM | H2 2026 Candidates - Self Servi | 3 | - | Efficiency | ⊕9 | Marketing, BLS |
| P2 | Configuration cleanup | H2 2026 Candidates - Self Servi | - | - | - | ⊕9 | - |
| P3 | Payer support - Upgrade from payer to CLM receiver | H2 2026 Candidates - Self Servi | - | - | Efficiency | - | - |
| - | Funds Consolidation Eligibility | P&Q Plan | - | - | - | - | - |
| - | Migrate CRP Prep Work | P&Q Plan | - | - | - | ⊕9 | - |
| - | PWP Eligibility | P&Q Plan | - | - | - | - | - |


## Thread 5 - Partners / Enterprise
**Owner:** Estella + Eliya · **Type:** growth · **Top-line:** Enterprise/partner CVR (eBay renewal)

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | Partner integration with KYC improvements | H2 2026 Candidates - Self Servi | 4 | - | Conversion | - | - |
| P0 | Partners - Consent page | H2 2026 Candidates - Self Servi | 2 | - | Conversion | - | - |
| P0 | eBay Renewal + KYC Optimization | discussion | - | - | Protect+grow eBay partner rev (renewal) | - | - |
| P1 | Customer tagging - Existing customers | License Infra | 12 | Yes | - | ⊕4 ⊕9 | Profile & Qualification |
| P1 | Partner data - Fix HQ vs incorporation mapping | H2 2026 Candidates - Self Servi | 1 | - | - | - | - |
| P2 | VOP - Verification of payee | License Infra | 17 | TBD | - | ⊕9 | - |
| P3 | Dynamic marketing consent | H2 2026 Candidates - Self Servi | - | - | - | - | - |
| P3 | Partners - reduced KYC for Lite Plan | H2 2026 Candidates - Self Servi | - | No | Conversion | - | Most of the effort P&Q |
| P4 | WL - T&Cs link don't mention Payoneer | H2 2026 Candidates - Self Servi | - | - | - | - | - |
| - | Onboarding Handover | Delegated Onboarding | - | No (UNFUNDED) | - | ⊕1 | - |
| - | Support IDV and POR for Partners?? | KYC Journey Q3 2026 | - | - | - | - | - |


## Thread 6 - AI KYC / Agentic
**Owner:** Yonatan / Shilhav · **Type:** strategic · **Top-line:** 60% auto-resolution on D-leads (Jul 15); flagship

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P4 | Agentic document collection | FDC Q3 2026 | TBD | No | - | - | - |
| - | New vendor implementation - documents | DU Q3 2026 | - | - | CVR | ⊕2 ⊕9 | None |


## Thread 7 - China TICP optimization
**Owner:** Jojo Zhou + CLM China · **Type:** growth · **Top-line:** China TICP CVR / lead-rank accuracy

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P4 | LS - China Model  (Not required RND resources) | H2 2026 Candidates - Self Servi | - | - | Efficiency | - | Data Science team ( Yeali's team), Support from Data dep, Data Analyst Team (Ofir's team) |
| - | Selfie vendor global alternative to au10tix | DU Q3 2026 | - | - | CVR | ⊕2 | FDC/BO/InRule/Qualification |


## Thread 8 - Localization
**Owner:** L&L (confirm) · **Type:** growth · **Top-line:** Localized onboarding CVR per country

> Country status: **India** (start, committed) · **Singapore + UAE** (at-risk) · **US** (finishing, local vendors).

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P1 | Expand new POR page UI for KR, Turkey and Ukraine | FDC Q3 2026 | 2 | TBD | Tech debt | - | - |
| P1 | Google Address API | KYC Journey Q3 2026 | - | - | - | - | - |
| P1 | Payment Tagging - Add new licenses | License Infra | 3 | Yes | - | - | Finance, Legal, Data |
| P1 | Quebec | Licenses | - | Yes | Conversion | - | Detailed here /  / https://payoneerinc.sharepoint.com/:x:/s/Product/IQAicxsOr5ziTLieW7EL-j |
| P1 | Singpass integration - support | EVS Q3 plan | 1 | - | Conversion | - | - |
| P3 | POR localization | FDC Q3 2026 | TBD | No | - | - | - |
| - | Delegated OB | India License | - | - | Account approval | - | - |
| - | Localized Onbboarding | India License | - | yes | Account approval | - | - |
| - | Migration | India License | - | - | Account approval | ⊕4 | - |
| - | OB Optimization | India License | - | - | Account approval | - | - |
| - | POR enrich when no country on Doc or from Google | DU Q3 2026 | - | - | CVR | ⊕9 | - |
| - | SAR Singapore [Medium] | License Infra | - | - | - | - | - |
| - | Utilising CKYCR in place of VKYC | India License | - | - | Account approval | - | - |


## Thread 9 - Modernization / post-rollout platform
**Owner:** Engineering: Yonatan + Avital (on-prem→cloud, .NET, data arch; Monitoring & Alerting here) · **Type:** ~40% · modernization · **Top-line:** ~40% · engineering-led; feeds AI/business outcomes

> Cross-cutting: ⊕9-tagged items elsewhere also count toward the ~40% modernization target (e.g. vendors-to-cloud in Thread 2).

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | Aurora - Data | H2 2026 Candidates - Self Servi | - | - | - | - | - |
| P0 | Aurora modules - Migration | H2 2026 Candidates - Self Servi | - | Yes | - | ⊕4 | - |
| P0 | KYC Data Orchestrator | P&Q Plan | 8 | Yes | Conversion | - | - |
| P0 | State machines deprecation | KYC Journey Q3 2026 | NA | - | Modernization | - | * EVS / * DU |
| P0 | engineering excellence - Automation coverage | H2 2026 Candidates - Self Servi | - | Yes | - | - | - |
| P0 | engineering excellence - Monitoring | H2 2026 Candidates - Self Servi | - | Yes | - | - | - |
| P1 | Customer tagging - T&Cs | License Infra | 4 | Yes | - | - | - |
| P1 | Unified KYC Dashboard | Enterprise deck | - | Yes | Internal KYC visibility | - | clm-main semantic layer |
| P3 | Data Collection Manager | FDC Q3 2026 | TBD | No | Modernization | - | - |
| P3 | New FDC Configuration Manager Tool | FDC Q3 2026 | TBD | TBD | - | - | - |
| P3 | New RFI Center | FDC Q3 2026 | TBD | No | - | - | - |
| P4 | Sign document api refactoring | License Infra | 4 | - | - | - | - |
| - | Legal Entity Service Refactoring | P&Q Plan | - | - | - | - | - |
| - | Management Tools (DEM, Qualification, Profile) | P&Q Plan | - | - | - | - | - |
| - | OCR extraction implementation | KYC Journey Q3 2026 | - | - | Modernization | - | - |
| - | Reduce review time | DU Q3 2026 | - | - | modernization | - | - |
| - | SAR refactoring [Q4] | License Infra | 6 | - | - | - | - |


## Thread 10 - Top-of-funnel: Mobile & Lead Scoring
**Owner:** Self-Service (Ira) · dep: Mobile team (external) · **Type:** growth · **Top-line:** Mobile signup→submission CVR; TICP lead-rank

| P | Item | Source | MW | Committed | Top metric | Cross | Deps |
|---|------|--------|----|-----------|-----------|-------|------|
| P0 | India PWD - BE dev | H2 2026 Candidates - Self Servi | 2 | - | - | ⊕8 | - |
| P1 | LS - Rank  deciosn point to a later reg stage | H2 2026 Candidates - Self Servi | 0 | - | - | - | Data Science team ( Yeali's team), Support from Data dep, Elad's team, Data Analyst Team. |
| P1 | LS - Remove blocked accounts from Lead score model | H2 2026 Candidates - Self Servi | 0 | - | - | - | Data Science team ( Yeali's team), Support from Data dep, Ido Seter, Ido Lustig. |
| P1 | LS - Two Stage Lead Calculation | H2 2026 Candidates - Self Servi | 0 | - | - | - | Data Science team ( Yeali's team), Data eng., Elad's team support , Data Analyst Team. |
| P3 | LS - Build the Online Model (Lead Score Service) | H2 2026 Candidates - Self Servi | 8 | - | Efficiency | ⊕9 | Data Science team ( Yeali's team), Support from Data dep, Segment (Moran H.) |
| - | Align high value customer in DU | DU Q3 2026 | - | - | - | - | - |
| - | Au10tix Selfie flow device AB test | DU Q3 2026 | - | - | CVR | ⊕2 | Maya? |
| - | Au10tix new workflow | DU Q3 2026 | - | - | - | ⊕2 | None |
| - | Data‑driven routing logic | DU Q3 2026 | - | - | - | ⊕2 ⊕9 | None |
| - | Merge mobile app IDV FF | KYC Journey Q3 2026 | - | - | Modernization | - | - |


## Cross-team requests (inbound demand)

| Requesting team | Ask | Maps to | Status |
|---|---|---|---|
| **Cards** | Multi-entity work | Cross-cut A (entity/person model): DEM person-level, Entity Model [Person], person eKYX, Add company | 🟢 aligned (consolidate our 4 scattered items) |
| **Product Compliance** | Multi-entity work | Cross-cut A (same) | 🟢 aligned |
| **Money-Movement-Platform** | VOP (Verification of Payee) | License Infra VOP (P2) | 🟠 in plan at P2 - reconcile priority |

### Platform-Enterprise deck (Gal Appel) - mapping only

| # | Enterprise ask | Maps to | Verdict |
|---|---|---|---|
| 01 | KYC Services Monitoring + one-time existing-pop cleanup (~$10M/yr; eBay/CN) | Thread 4 + License Infra customer-tagging Monitoring + eBay→T5 | ✅ cleanup covered; external validation of Thread 4 ($ + Compliance sponsor) |
| 02a | Consent flow - push consent after document submission | Thread 5 consent page + SS fast-follower | ✅ already have it; reinforces the P0 (~50% drop) |
| 02b | Billing-country role-based locking (companies) | SS 'HQ vs incorporation mapping' (P1) | ~partial |
| 03 | Expose Final CRP for Walmart | 'Migrate CRP Prep Work' = CRP deprecation | ❌ net-new + TENSION (we're deprecating CRP) — PENDING |
| 04 | AHA audit risky-payee attempts (~$40.5M TFL, 15.2K AHs) | adjacent to AHA-CLM-delta, different (risk/compliance) | ❌ net-new — PENDING |
| 05 | Payees Journey Control (gate activation + comms transfer to Enterprise) | not in plan | ❌ DECLINED — no surface-ownership moves either direction; no branched flows for onboarded customers yet |
| 06 | Unified KYC Dashboard | clm-main Looker semantic layer (built) | ✅ COMMITTED — internal teams dashboard, low effort → Thread 9 |

## Open gaps, risks & data asks
- **RISK - CSP / Delegated Onboarding** (the "Onboarding Handover"): a CVR lever per Yaron (Tier-1 hubs, CSP→customer handover) but currently **UNFUNDED**. Track as a risk.
- **RISK - Rollout stabilization:** post-rollout defect remediation is the principal Q3 capacity constraint; a big enough rollout issue would eat all other efforts. Sequence against it, don't layer on top.
- **OUT OF SCOPE - Ongoing lifecycle / InLife** (re-verification, reactivation, expansion beyond add-company): explicitly not in Q3 - called out as a known omission.
- **Dependency - Mobile team** (external to CLM) for the Top-of-funnel / mobile track (Thread 10).
- Covered, not gaps: Cost-to-serve = AI-KYC manual-review reduction (T6) + vendor-orchestration costs (T2); Monitoring & Alerting = under Modernization (T9).
- No MW estimates for Licenses & KYC Journey; DU capacity = `#REF!`; License Infra over capacity (21/19).
- Existing-base migration gap analysis (which segments fail which CLM requirements) net-new, unscoped.
- Enterprise asks 03 (Walmart CRP) + 04 (AHA audit) PENDING decision.

## Decisions log
[2026-06-20] 9 threads locked. Modernization Thread 9 (~40%) is PRIMARILY ENGINEERING-LED infra (on-prem->cloud, .NET/framework upgrades, data-component re-architecture); product items are a subset (⊕9). Separate full modernization deck coming from engineering.
[2026-06-20] Multi-entity consumers = Cards + Product Compliance (corrected from Fin-Crimes). eBay = a RENEWAL (partner contract), P0.
[2026-06-20] Exec deck for Oren built (RUN/GROW · CLM HL · Q3 Initiatives · Risks · Dependencies) - captured in the DB memory doc.
[2026-06-20] Reconciled with Yaron's top-down CLM Q3 Investment Plan + Yonatan's response (the strategic spine). Frame: Licensing as an AI Moat; FFT top-line; T1/T2 lens. Docs in docs/.
[2026-06-20] Added Thread 10 (Top-of-funnel: Mobile & Lead Scoring) - front half of funnel; external Mobile-team dependency. AI KYC raised to 60% auto-resolution. Modernization co-owned Yonatan + Avital; Monitoring under Modernization; Cost-to-serve distributed (T6 + T2). CSP unfunded + rollout-stabilization = risks; InLife out of scope.
[2026-06-20] Licenses owner = Meital (exec cover for Yael, on leave); Sitara (Principal PM) executes. (Correction 2026-06-20: an earlier 'Yonatan Birger leads Licenses' note was an error - Birger is a Senior PM on Elad's KYC team.)
[2026-06-20] Partners owners = Estella + Eliya; eBay KYC Optimization added P0.
[2026-06-20] Posture: protect growth, weighted to vendor modernization.
[2026-06-20] Self-Service protects BRR; "Open PS during onboarding" P2->P1.
[2026-06-20] Delegated Onboarding: "Onboarding Handover" added, at-risk/unfunded.
[2026-06-20] Yael on leave; Meital exec cover - temp.
[2026-06-20] Enterprise ask 05 (Payees Journey Control) DECLINED - no surface-ownership transfers between CLM and Enterprise; no branched flows for onboarded customers yet.
[2026-06-20] Enterprise ask 06 (Unified KYC Dashboard) COMMITTED - Thread 9, on clm-main semantic layer.
[2026-06-20] Cards + Fin-Crimes request multi-entity (cross-cut A); MMP requests VOP (consider bump from P2).
