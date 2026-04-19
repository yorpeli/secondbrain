# Delegated Onboarding — Domain Context

> Agent: delegated-onboarding-pm
> Purpose: Reference knowledge that informs reasoning about delegated onboarding — ops flows, competitive landscape, metrics, strategic framing. Unlike memory.md (operational state that changes every session), this file changes only when new research or domain understanding arrives.

## Problem Statement

Payoneer's onboarding assumes the person registering is the account owner. In reality, especially in incorporation hubs (US, HK, UK, UAE, Singapore), onboarding is performed by CSPs (Company Service Providers) — formation agents, virtual CFOs, accounting/tax firms, law firms. The system doesn't distinguish between actor and account holder.

### What's Broken (Verified)

| # | Limitation | Evidence |
|---|-----------|----------|
| 1 | OTP required at registration start — customer isn't involved, forcing CSP to coordinate or workaround | VERIFIED: #1 reason CSPs route to competitors |
| 2 | No actor/owner separation — delegates use customer credentials | VERIFIED: No audit trail; compliance risk |
| 3 | No status visibility for CSPs — updates go to customer only | VERIFIED: "I have no idea what's happening with my client" |
| 4 | ~9 days manual review — email-based reopen loops | VERIFIED: vs 1-3 days at competitors |
| 5 | No structured handoff — selfie/ID non-delegable but handoff is awkward | VERIFIED: Time-zone friction |
| 6 | Post-approval visibility cliff — bank, PS, first txn are customer-only | VERIFIED: CSP cares about "operational" not "approved" |

### Impact Signals

- <10%: 134 CSPs onboarded, <10% activated
- <15%: Partner share of wallet
- ~2/day: Per active CSP (vs 6-10 at competitors)
- ~20 days: Reported time to approval for ISP flow (vs 1-3 days at competitors)
- 60-70%: CSM/Ops time on OB support instead of upsell/cross-sell
- Dummy emails: CSPs use to bypass OTP
- Top-of-funnel drop-off (reg start → completion) not even measured — where OTP friction hits hardest

### Key Quotes

> "Unless there is something that only Payoneer can solve, if everything else is equal, why do I want to go through the onboarding flow of Payoneer where I waste so much time talking to the customer?" — Shaival Mittal, GTM/APAC, Mar 16

> "We have to pre-coordinate a 20-minute live window with the client just for the OTP step. We collect everything upfront, but the client still has to be there at that exact moment." — Iryna, MaIra Consult (CSP partner since 2012), Mar 31

## Strategic Frame

### Vision & Aspiration

**"Separate who acts from who owns."** Become the default onboarding destination for partner-led cross-border account opening. The platform CSPs choose first because it's fastest, most transparent, and gives them the most control — while Payoneer's moats make it the most valuable for their customers.

### Where to Play

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Segment | CSP — formation, virtual CFO/tax, law firms | Highest ICP ($50K+), holds all KYC docs, 5x YoY growth |
| Persona | High-volume CSPs first ("Formation Factory") | Highest throughput leverage; validates model before expanding |
| Geography | Incorporation hubs: US, UK, HK, UAE, Singapore | Where delegated OB is the norm; highest drop-off |
| Channel | Reseller — currently ~1/4 of referral; goal is parity | Self-serve scaling down; reseller is the growth vector |

### How to Win — Five Product Decisions

1. **Separate actor from owner** — CSP handles data/docs/submission; customer handles identity/consent/claim. Zero compliance incidents target.
2. **Move OTP to handoff** — CSP completes reg without customer online. Target: throughput ~2→≥4/day; OTP drop-off ≥40% reduction.
3. **Portal first, API + batch only when validated** — Ship, measure, iterate before heavier integration.
4. **Make compliance a trust differentiator** — Explicit permissions, full audit logging, secure tokenized handoff.
5. **Let moats close deals — onboarding removes the barrier** — Settlement reliability, risk breadth (190 countries vs Airwallex 70), local GTM are the real reasons to choose Payoneer.

### Broader Opportunity: Sales-Led Delegated Onboarding

Meital's strategy focuses on CSPs, but delegated onboarding also serves a **sales-led / reseller journey** where a sales team onboards customers after they've already purchased a package. This is being explored jointly by Yonatan and Eyal Zehavi (VP Product, Pricing & Packaging) under a "CLM × Pricing & Packaging" framework.

**Two distinct paths, one shared goal:**

| Journey | Optimize For | Essence | Intent | Experience |
|---------|-------------|---------|--------|------------|
| **Sales-Led / Resellers** | Conversion (~100%) | Enablement to customer/payer | Very high — already committed | Max efficiency, min friction, fast time-to-active |
| **Self-Service** | ~100% desired, ~0% non-desired | Smart filtering + activation | Unknown — inferred from data | Lead score + package signal determine investment |

**Package selection placement — three models:**
- **A: Package-First** (Sales-led/Resellers) — Customer already sold on package. Package → Onboard → Approve.
- **B: Pre-Approval** (Self-service, pre-account) — Customer selects package during registration. Register → Package → Approve.
- **C: Post-Approval** (Self-service, in-account) — CLM approves first, package selection after. Register → Approve → Package.

**Key insight:** The sales-led journey (A) is essentially delegated onboarding — someone other than the customer initiates and manages the process. The infrastructure built for CSPs (actor/owner separation, portal, status visibility) serves this use case too. This means the delegated onboarding TAM extends beyond CSPs to include Payoneer's own sales-led acquisition.

**Open questions from CLM × P&P work:**
- Are flows B and C truly separate or one adaptive journey?
- Lead score thresholds for positive vs negative ROI customers
- Where/how package selection surfaces in each journey
- Cross-functional "desired customer" criteria definition

**Status:** Work in progress (Yonatan + Eyal). Source: `docs/clm-conversion-optimization-deck.md`

### What We're NOT Doing (Yet)
- API/embedded/hosted before validating portal
- Serving all partner types simultaneously
- Competing on product bundle parity (yield, expense mgmt)
- Cross-product delegation in the first build

### Payoneer's Moats
- **Settlement Reliability** — Transaction efficiency, banking network consistently completes transactions
- **Risk Breadth** — More edge cases accepted, more LOBs supported
- **Coverage** — 190 countries vs Airwallex 70; multi-currency PSs significant
- **Local GTM Presence** — Partner managers in-region vs competitors from home base only
- **Parity gaps to close:** Yield on USD balances, expense management

## CSP Segment Data

### Growth Trajectory (Company Formation Services)

Two data sets exist — strategy doc (v2) and validated GTM dashboard (discovery brief, Mar 15). Dashboard numbers are authoritative.

**From strategy doc (v2):**

| Year | Completed Regs | FFT | ICP50K | Revenue | ARPU |
|------|---------------|-----|--------|---------|------|
| 2024 | 1,964 | 569 | 58 | $0.51M | $896 |
| 2025 | 10,235 | 2,941 | 432 | $4.98M | $1,694 |
| Δ 2024→2025 | +421% | +417% | +645% | +876% | +89% |
| 2026 YTD (Jan-Feb) | 1,968 | 577 | 58 | $0.51M | $884 |

**From validated GTM Dashboard (Mar 15 — CFS affiliate industry filter):**

| Period | Reg Complete | Reg Approved | Approval Rate | FFT | FFT/Approved |
|--------|-------------|-------------|---------------|-----|-------------|
| 2024 (mature) | 7,588 | 4,488 | 59.1% | 2,200 | 49.0% |
| 2025 | 11,147 | 6,154 | 55.2%* | 3,134 | 50.9% |
| 2026 YTD | 2,542 | 1,393 | 54.8%* | 676 | 48.5% |

*Newer cohorts may still be maturing.

| Period | In-Year Volume | Revenue | ARPU | Take Rate |
|--------|---------------|---------|------|-----------|
| 2025 | $474M | $5.0M | $1,810 | 1.05% |
| 2024 | $246M | $2.6M | $1,440 | 1.05% |
| 2026 YTD | $62M | $422K | $802 | 0.68% |

**Key data insight:** ~50% of approved accounts transact (FFT/Approved). The real top-of-funnel loss (registration *start* → completion) is not even captured — where OTP friction hits hardest. Even a modest 10pp improvement in FFT conversion = ~600 additional transacting customers/year at $1,800 ARPU = ~$1.1M incremental revenue.

**Quality upside:** 2026 customers are 3-4x the ARPU of 2025 same-month cohorts. If that holds, conservative scenario pushes to +$3.7M-$4.3M.

### Revenue Projections

| Scenario | Additional Regs | Additional FFTs | Revenue Uplift |
|----------|----------------|-----------------|----------------|
| Conservative (+50% regs) | +5,118 | +1,469 | +$2.49M/year |
| Normal (2x regs) | +10,235 | +2,937 | +$4.97M/year |
| 30-CSP pilot (top CSPs) | — | — | $750K-$1.5M+ |

CSP segment 2025 baseline: $4.98M. Conservative total: ~$7.5M. Normal total: ~$10M. FY2026 total companies revenue: $94M.

**Strategic context:** Onboarding is table stakes, not sufficient. Revenue growth requires competitive commercials + network value alongside good onboarding. Partners route to competitors primarily over commercials gaps (50%+ vs Payoneer's 40% performance-based).

## User Segmentation

### External Delegates

| Persona | Description | Volume | Priority |
|---------|------------|--------|----------|
| "The Formation Factory" | High-volume CSPs, 20-50+ inc/month, holds all KYC docs, multi-hub | High | P0 — TARGET |
| "The Trusted Advisor" | Boutique reseller, 2-8/month; pain = rejections, no status | Medium | P1 |
| Platform/Marketplace | e.g., Skuad — API-first integration | Medium | P2 |

### Internal Delegates
- **Ops** — Complete KYC steps on behalf of customer, re-open — high manual load
- **CSM/Sales** — Multi-entity re-onboarding; 60-70% of time on ops coordination

### End Customer (Account Holder)
Approves account, completes biometric verification, creates credentials, provides final consent, owns the account.

## Competitive Landscape

### Head-to-Head Comparison

| Category | Payoneer CLM | Airwallex | Wise Business | Verdict |
|----------|-------------|-----------|---------------|---------|
| Partner Control | Single opaque path, no portal/batch/API | 3 tiers: Hosted, Embedded, full API | 4 options: Redirect, Hosted, API, Partner-Led KYC | LAGS |
| Workflow Efficiency | ~9 days manual review, email-based loops | 3-5 biz day KYC, partner submits via portal | Sub-day for API-integrated | LAGS |
| Automation Quality | eKYB, eKYC, ePOCA, ePOR, registry auto-population | STP for standard cases, embedded component | Automated for standard cases | PARITY |
| Exception Recovery | Generic rejection emails, no coded errors | Coded error matrix with recommended actions | Automated + manual fallback | LAGS |
| Visibility/Comms | Opaque waiting state, updates to customer only | Real-time statuses, partner dashboard, dedicated AM | Partner dashboard with status tracking | LAGS |
| Customer Effort | 10 steps, 15-30 min, OTP at step 1 | 5-6 steps, 15-25 min, OTP at partner side | 4-5 steps, 10-15 min, social login | LAGS |
| Time-to-Transaction | 3-9 days to approval | 3-5 biz days, Global Accounts immediate | Sub-day to 1-3 days | LAGS |
| Trust/Compliance | Strong: full KYC/KYB engine, 190-country coverage | Strong: KYC always Airwallex-owned | Strong: Wise-led or Partner-Led KYC | PARITY |

### Multi-Tier Architecture (Payoneer is the only one without)

| Provider | Hosted/Redirect | Embedded Component | Native API |
|----------|----------------|-------------------|------------|
| Airwallex | Yes | Yes (iframe KYB) | Yes |
| Wise | Yes (NEW Q4 2025) | Yes (NEW Q4 2025) | Yes (NEW Q4 2025) |
| WorldFirst | Yes | No | Yes |
| Payoneer | ~Single opaque path | No | ~Fund APIs only |

### Competitor GTM & Commercial Advantages
- **Airwallex** — 50%+ commission (not performance-gated); main alternative alongside Currency
- **WorldFirst** — Customized volume-based pricing across all partner's clients
- **3S Money** — Heavy co-branding and joint marketing
- **Currency** — Stronger commercials; main alternative in MENA

**Partner Experience Scorecard** (hybrid, /5.0 — from discovery brief competitive analysis):
Airwallex 4.14 > Wise 3.38 > WorldFirst 3.14 > Mercury 3.10 > Relay 2.58 > **Payoneer 2.24**

**Why now:** Wise's Q4 2025 acceleration (2 new products in one quarter) signals increasing competitive pace.

## Solution: E2E Delegated Flow

### Three-Phase Flow

**Phase 1 — CSP:**
1. Log in to PRM Portal → 2. Initiate new onboarding → 3. Enter initial data → 5. Enter data + bank account + upload docs → 6. Submit application → 9. Resubmit if bounced

**Phase 2 — Payoneer:**
4. Trigger required verification based on initial data → 7. Auto verification → 8. Manual review + KYC Ops accelerator → 10. Approve/Decline → 11. Trigger customer handoff

**Phase 3 — Customer (AH):**
12. Receive handoff link → 13. OTP + create password (moved here) → 14. Accept T&Cs → 15. Selfie (ID) → 16. Self-attestation → 17. Final consent — CSP retains delegate access

### Key Design Choices

| # | Choice | Why |
|---|--------|-----|
| 1 | OTP at step 13, not step 1 | CSP completes 1-6 without customer online. Eliminates #1 pain point |
| 2 | Dynamic requirement surfacing (3→4) | CSP knows what to collect upfront. Prevents bounce/resubmit loops |
| 3 | Three-phase separation | Each actor has bounded responsibility. Foundation for API/embedded/hosted |
| 4 | CSP resubmission (step 9) | Direct CSP → verification center. Cuts 2-5 days off loops |
| 5 | Single handoff view (step 12) | One page with everything remaining. Matches competitor pattern |
| 6 | Meet CSPs where they work | PRM portal today, designed for API/CRM/WhatsApp when validated |

### Compliance Boundaries (Lydia, Mar 11)

**CSP can do:** Data entry, document upload, basic info input, all steps before handoff
**CSP must NOT do:** Selfie, T&Cs acceptance, self-attestation, password creation, operate account

| Topic | Decision | Status |
|-------|----------|--------|
| OTP placement | Can move to end of flow; jurisdiction review needed | APPROVED |
| Bank account | Required at registration; name-mismatch/UBO path acceptable | APPROVED |
| Portal gating | Flow via authenticated partner portal, not open link | REQUIRED |
| Partner T&Cs | Must explicitly allow: input, upload, set up (not operate) | UPDATE NEEDED |
| CSP→AH linkage | "AH X onboarded by CSP Y" visible; CSP must disclose | REQUIRED |
| Doc resubmission | CSP responds directly to verification center | APPROVED |
| Audit trail | Full logging: who, what, when, which permission | REQUIRED |

### How Our Flow Beats Airwallex

| Airwallex Friction | Our Solution |
|-------------------|--------------|
| Email aliases for multi-client registration | Authenticated portal — CSP identity is native |
| OTP coordination requires both parties present | OTP at step 13 — customer completes independently |
| Client must manually remove partner | CSP retains delegate access — scoped permissions |
| Password created by partner and shared verbally | Customer creates own password at handoff |

## MVP Scope

**Core:** Portal-first + delegation layer + ownership handoff. INC (incorporation) entity type only. CSP ("Formation Factory") persona only.

### MVP Capabilities

| Capability | What It Does | Why It's In MVP |
|-----------|-------------|-----------------|
| Actor/owner role separation | CSP = actor; customer = AH. Each action logged | Fixes identity architecture gap |
| PRM → Payoneer app delegated flow | CSP initiates via PRM, authenticated token routes to Payoneer-owned app | Reduces Salesforce dependency; reusable |
| Dynamic requirement surfacing | After initial data, system surfaces required docs/verifications | Prevents bounce/resubmit loops |
| Secure ownership claim | Handoff link → selfie, T&Cs, OTP, password, consent | Clean handoff; CSP retains access |
| Status visibility | Per-customer status tracking on PRM dashboard | #1 complaint after OTP |
| Communication routing | Doc bounces → CSP; identity items → customer | Prevents confusion |

**Not in MVP:** Other entity types, pre-population, auto-fill/OCR, API/embedded/hosted/batch, multi-entity, other personas.

### Why PRM Portal First
- Already deployed — PRM exists, CSPs have accounts. Adoption (~25-30% login) is the constraint.
- Target persona doesn't need API — formation agents and law firms aren't tech companies.
- Fastest to pilot data — ship, measure, iterate before heavier integration.
- PRM is entry point, not destination — new app under Payoneer reduces Salesforce dependency.

**Important context (Mar 29 1:1):** Before the strategy doc, a quick-fix Salesforce/PRM build was proposed (Daniel from eng volunteered). Yonatan blocked it — "the way we skip product strategy and jump to building — I fail candidates in interviews for this." The v2 strategy doc (Mar 31) reframes PRM as the *entry point* for a proper MVP with strategy behind it, not a quick hack. The distinction matters: PRM is now part of a deliberate product strategy, not a shortcut.

## Phased Roadmap

| Phase | What | Timeline |
|-------|------|----------|
| **MVP** | Core delegation via PRM Portal (INC only, CSP persona) | 2-6 months |
| **Phase 2** | Expand to all entity types, jurisdiction-specific requirements | After MVP validated |
| **Phase 3** | Prepopulation from eCollection, batch registrations | After Phase 2 |
| **Future** | Multi-model onboarding (API/embedded/hosted), lifecycle management, cross-product delegation | 6-24 months |

### Alternatives Examined Before MVP

| Alternative | Finding | Status |
|------------|---------|--------|
| Move OTP to end of flow | Compliance approved (Lydia, Mar 11), but no dev solution for CLM step bypass | PENDING DEV SOLUTION |
| CSP direct doc resubmission | GTM confirmed not top priority — CSPs fine with existing model | DEPRIORITIZED |
| Affiliate ID-based CSP tagging | Use existing affiliate ID for CSP-led flow identification | USEFUL FOR MEASUREMENT |

## Pilot & Measurement

### Pilot Design
- **Cohort:** 5-10 CSPs, ≥100 registrations/month combined, 3 months
- **Selection criteria:** Active 6+ months, hub geography, ≥5 reg/month, formation + VAS, known competitor users, ICP quality track record
- **Method:** Pre/post comparison (not A/B — population too small). Baseline top 15 CSPs for 3 months pre-launch.

### Three Checkpoints

| Checkpoint | When | Question | Key Threshold |
|-----------|------|----------|---------------|
| Activation | Week 2 | Are CSPs using it? | ≥3 of 10 pilot CSPs initiated ≥1 reg |
| Early Signal | Week 6 | Is the mechanic working? | ≥3 reg/day per CSP; ≥70% completion rate |
| Full Go/No-Go | Month 3 | Scale, iterate, or pause? | All 6 criteria met → Scale |

### Month 3 Go/No-Go Criteria

| Criterion | Threshold |
|----------|-----------|
| Throughput | ≥4 reg/day per active CSP (from ~2) |
| Registration completion | ≥85% of started regs submitted |
| Handoff completion | ≥60% of regs where customer completes verification |
| Reg → approval speed | ≤5d median / ≤14d P90 (from 9d/30d) |
| CSP adoption | ≥6 of 10 pilot CSPs complete ≥5 regs |
| Compliance | Zero incidents; 100% audit trail |

## Metrics

### Primary KPIs

| KPI | Baseline | Target |
|-----|----------|--------|
| Registrations per CSP per day | ~2 (top 15, Jul 25-Feb 26) | ≥4 |
| Reg → FFT (CSP-led) | TBD (data gap) | Establish + improve |
| Reg → approval | 9d median / 30d P90 | ≤5d median / ≤14d P90 |

### Secondary KPIs

| KPI | Baseline | Target |
|-----|----------|--------|
| Registration completion rate | TBD | ≥85% |
| Handoff completion rate | N/A (new) | ≥60% |
| Manual review time to approval | ~9 days | ≤2 days |
| First-touch resolution | 42% | ≥50% |
| Compliance incidents | 0 | 0 / 100% audit |

### Segment Health (Monitor Only)
- ICP$50K rate: 15% (2025) — watch for drop below 12%
- ARPU per CSP-led customer: $1,694 (2025) — watch for decline

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **No dedicated dev team** | CRITICAL | No engineering team assigned. Progress depends on R&D managers allocating on goodwill. Timeline unpredictable. |
| **CLM step bypass not feasible** | CRITICAL | PRM injects into CLM backend, skipping front-end steps. If CLM can't accept, delegation model breaks. |
| Dynamic requirement surfacing timing | MEDIUM | Static forms fallback |
| Compliance/jurisdictional variance | MEDIUM | Roll out only in approved geos |
| Slow CSP adoption | MEDIUM | PRM login ~25-30%. Pilot with high-intent CSPs. |
| Engineering scope creep | MEDIUM | Phased delivery; clear MVP boundaries |
| Entity model readiness | MEDIUM | Not MVP blocker; needed for Phase 2+ |
| Product parity gaps beyond OB scope | MEDIUM | Commercials (50%+ vs 40%) and two-way referrals — flag to GTM, don't oversell OB |
| Salesforce team dependency | LOW | Architecture moves core logic off Salesforce |

## Open Questions

| # | Question | Owner | Status |
|---|---------|-------|--------|
| 1 | CLM step bypass feasibility — can PRM inject data and skip CLM front-end steps? (P0 blocker) | Eng lead | PENDING |
| 2 | Auth model for delegated flow — SSO from Salesforce? Payoneer login? New identity flow? | Eng (Amit) + Product | OPEN |
| 3 | Duplicate onboarding prevention | Product | DEFERRED |
| 4 | Revenue potential of the portal — validated by top CSP interviews? | Product + GTM + Finance | PENDING |
| 5 | Entity model design for Phase 2+ | Eng + Arch | DEFERRED |

### Design Questions to Resolve

1. Step 3→4: Is dynamic requirement surfacing ready? Static fallback?
2. Step 9: Who notifies CSP when docs bounce?
3. Step 11→12: What if customer doesn't act on handoff? (Reminder cadence TBD)
4. Step 17: What scope of post-approval access does CSP retain?

## Glossary

| Term | Definition |
|------|-----------|
| **CSP** | Company Service Provider — formation agents, virtual CFO/tax, law firms in incorporation hubs |
| **ISP** | Incorporation Service Provider — subset of CSPs focused on entity formation |
| **AH** | Account Holder — end customer who owns the Payoneer account |
| **FFT** | First Financial Transaction — marks customer as truly activated |
| **CLM** | Customer Lifecycle Management — current onboarding system |
| **PRM** | Partner Registration Portal — CSP entry point (Salesforce-based) |
| **ICP** | Ideal Customer Profile — $50K+ revenue threshold |
| **ARPU** | Average Revenue Per User (calculated as Revenue/FFTs) |

## Discovery Status & Knowledge Gaps

### Discovery Completed (8 sessions, as of Mar 15)

| Date | Session | Key Signal |
|------|---------|-----------|
| Feb 25 | ISPs OB kickoff | ISP flow distinct from self-serve |
| Mar 1 | China B2B Solution feasibility | Existing B2B infra doesn't solve ISP delegation |
| Mar 2 | ISPs OB Dashboard & PRM | PRM capabilities and data gaps |
| Mar 3 | Rishabh Ralhan — process deep-dive | PDR enablement flow, partner training |
| Mar 10 | Shaival Mittal — ISP intro to CLM | Volume benchmarks, revenue sizing, CSM burden |
| Mar 10 | Karen Tan — live partner walkthrough | OTP blocker, doc friction, selfie handoff |
| Mar 10 | Hopetex CLM operational walkthrough | Doc policy friction, bank localization |
| Mar 11 | Lydia Man — compliance guidelines | Green light on core flow changes |

### Gaps Still Open (from discovery brief, Mar 15)

| Gap | Why It Matters | Status |
|-----|---------------|--------|
| **Stage-by-stage funnel for ISP motion** | Can't size OTP drop-off or set measurable MVP targets | NOT STARTED |
| **Direct ISP voice** | All evidence from internal stakeholders, zero direct ISP interviews | NOT STARTED |
| **Engineering feasibility** | No T-shirt sizing on actor/owner separation, OTP configurability | STARTED |
| **Persona validation with Partnerships** | Priority order derived from transcripts, not validated | DRAFT |
| **Registration start-to-completion drop-off** | Biggest friction (OTP) happens before GTM dashboard starts measuring | NOT MEASURED |

### Other Gaps
- Reseller identification in the panel (can't identify from stage one — only later)
- Ops flow mapping (Meital created a Miro board — not yet reviewed)
- BigQuery access issues (Meital reached out to Aviv, hit technical issues)
- Tomerang may have reseller identification data

## Source Documents

| Document | Author | Date | Location | Description |
|----------|--------|------|----------|-------------|
| Product Strategy - Delegated Onboarding | Ravid (pre-departure) | Pre-2026 | `docs/strategy-ravid-original.md` | Original strategy: problem, opportunity, competitors, solution themes, MVP scope |
| Delegated Onboarding — Product Strategy v2 | Meital Lahat Dekter | 2026-03-31 | `docs/strategy-meital-v2.md` | Comprehensive living doc: verified pain points, CSP data, competitive deep-dive, E2E flow, MVP, pilot plan, metrics |
| ISP Delegated Onboarding — Discovery Brief | Meital Lahat Dekter | 2026-03-15 | `docs/discovery-brief-meital-mar15.md` | Discovery synthesis: 8 sessions, validated pain points with quotes, GTM dashboard data, competitive scorecard (Payoneer 2.24/5.0), knowledge gaps |
| CLM × Pricing & Packaging: Conversion Optimization | Yonatan Orpeli + Eyal Zehavi | WIP | `docs/clm-conversion-optimization-deck.md` | Joint framework showing sales-led/reseller journey as a second delegated onboarding use case beyond CSPs |
