Delegated Onboarding — Product Strategy
Separate who acts from who owns

Active Owner: CLM Product Updated: 2026-03-31 · Living document — data and content are adjusted as discovery matures Audience: Product, Compliance, Ops, Partnerships, GTM, Engineering
TL;DR Problem Competitors Opportunity Strategy Personas Solution MVP Pilot Metrics Risks Questions
TL;DR
CSPs (formation agents, virtual CFOs, law firms) grew 5x YoY (2024→2025), deliver ICP $50K+ customers, and align with Payoneer's multi-entity upmarket strategy. But our onboarding assumes one actor = one owner. CSPs work around it — dummy emails, credential sharing, or routing to competitors.
Fix: Separate who acts from who owns. Build a delegated flow where CSPs handle data/docs, Payoneer verifies, and customers claim ownership at the end. OTP moves to handoff (not registration start). Portal first, API + batch when validated.
Stake: +$2.5M–$5M revenue uplift (conservative to 2x). ~2 reg/day per CSP today vs 6–10 at competitors. 9d median / 30d P90 to approval vs 1–3 at competitors.
1. The Problem
Company Service Providers (CSPs) — formation agents, virtual CFOs, accounting/tax firms, law firms — are a fast-growing strategic segment for Payoneer, growing 5x YoY (1,964 → 10,235 registrations, 2024→2025) and aligned with the company's upmarket multi-entity strategy (ICP $50K+). In incorporation hubs (US, HK, UK, UAE, Singapore), CSPs perform onboarding on behalf of the customer — they hold all KYC documents, manage registration, and push the customer to activation.
Payoneer's onboarding was built for a single actor — it assumes the person registering is the customer. When a CSP tries to onboard on behalf of a customer, the result is friction, workarounds, and unrealized potential.
What's Broken
#
LIMITATION
EVIDENCE
1
OTP required at registration start — customer isn't involved at this stage, forcing CSP to coordinate or use workarounds
VERIFIED #1 reason CSPs route to competitors
2
No actor/owner separation — delegates use customer credentials
VERIFIED No audit trail; compliance risk
3
No status visibility for CSPs — updates go to customer only
VERIFIED "I have no idea what's happening with my client"
4
~9 days manual review — email-based reopen loops
VERIFIED vs 1–3 days at competitors
5
No structured handoff — selfie/ID non-delegable but handoff is awkward
VERIFIED Time-zone friction
6
Post-approval visibility cliff — bank, PS, first txn are customer-only
VERIFIED CSP cares about "operational" not "approved"
"Unless there is something that only Payoneer can solve, if everything else is equal, why do I want to go through the onboarding flow of Payoneer where I waste so much time talking to the customer?"
— Shaival Mittal, GTM/APAC, Mar 16
"We have to pre-coordinate a 20-minute live window with the client just for the OTP step. We collect everything upfront, but the client still has to be there at that exact moment."
— Iryna, MaIra Consult (CSP partner since 2012), Mar 31
<10%
134 CSPs onboarded, <10% activated
<15%
Partner share of wallet
~2/day
Per active CSP (vs 6–10 competitors)
60–70%
CSM/Ops time on OB support
Dummy emails
CSPs use to bypass OTP
2. Competitive Position
Partner Onboarding Capabilities — Bottom Lines
CATEGORY
PAYONEER CLM
AIRWALLEX
WISE BUSINESS
VERDICT
Partner Control
Single opaque path. No portal, no batch, no API. Partner uses customer credentials
3 tiers: Hosted redirect, Embedded KYB iframe, full API. Partner chooses depth. PartnerStack auth
4 options: Redirect, Hosted OB, Onboarding API, Partner-Led KYC. Shipped 3 new models in Q4 2025
PAYONEER LAGS
Workflow Efficiency
~9 days manual review. Email-based doc reopen loops. No structured retry path
3–5 biz day KYC review. Partner submits via portal, email updates to partner + AM. Authorization letter flow
Sub-day for API-integrated partners. Automated verification for standard cases
PAYONEER LAGS
Automation Quality
eKYB, eKYC, ePOCA, ePOR, registry auto-population. Strong verification engine, but no partner-facing STP
STP for standard cases. Embedded component auto-validates doc types and blur detection. Multi-vendor routing + OCR
Automated verification for standard cases. Multi-vendor status unknown
PARITY
Exception Recovery
Generic rejection emails. No coded errors. No structured retry. Partner calls KYC Ops to unblock
Coded error matrix with recommended actions per type. Session-expiry re-entry. Status-based filtering for stuck accounts
Automated + manual fallback. Rejections sometimes unexplained
PAYONEER LAGS
Visibility / Comms
Opaque waiting state. Updates go to customer only. "I have no idea what's happening with my client"
Real-time account statuses (INIT → IN_REVIEW → ACTIVE). Partner sees all accounts in dashboard. Dedicated AM
Partner dashboard with status tracking. Clear state machine visibility
PAYONEER LAGS
Customer Effort
10 steps, 15–30 min. OTP at step 1 requires customer involvement before CSP can proceed. Mobile app, country-adaptive
5–6 steps, 15–25 min. OTP at partner side during reg; client only does liveness + password at handoff
4–5 steps, 10–15 min. Social login (Google, Apple). Full mobile registration
PAYONEER LAGS
Time-to-Transaction
3–9 days to approval. Post-approval: bank details, PS, first txn are customer-only steps
3–5 biz days to approval. Global Accounts available immediately after. Partner can pre-configure products
Sub-day for API-integrated. Standard: 1–3 days
PAYONEER LAGS
Trust / Compliance
Strong: full KYC/KYB engine, actor/owner separation (proposed), 190-country coverage, broad risk acceptance
Strong: KYC always Airwallex-owned. Authorization letter validates delegation. Client does own liveness check
Strong: Wise-led or Partner-Led KYC (for regulated entities only). First-party vs third-party governance model
PARITY
How Competitors Onboard Partner Customers
Every direct competitor offers partners a choice of integration depth. Payoneer is the only one without a multi-tier architecture.
PROVIDER
HOSTED / REDIRECT
EMBEDDED COMPONENT
NATIVE API
Airwallex
✓ White-labeled redirect, AM-configured
✓ Iframe KYB component with STP, conversion-optimized
✓ Full API — partner builds all UI
Wise
✓ Hosted Onboarding NEW Q4 2025
✓ Embedded with partner branding NEW Q4 2025
✓ Onboarding API, UK biz first NEW Q4 2025
WorldFirst
✓ Redirect with step-by-step flow
✗ None documented
✓ Customer Onboarding API
Payoneer
~ Single opaque path
✗ None
~ Fund APIs only; no partner-built OB
AIRWALLEX — THE BENCHMARK (ACTUAL PARTNER FLOW)
Source: Airwallex Partner Account Opening Guide (HK Channel Partner Program, Mar 2025)
Part 1: Partner Opens Account on Client's Behalf
STEP
ACTION
NOTES
1.1
Partner clicks own referral link → "Get Started"
Authenticated via PartnerStack
1.2
Enter partner's business email
Gmail alias trick for multi-client (name+client123@gmail.com)
1.3
Answer questions about client's needs

1.4
Enter client's name, create password
Partner must remember password for handoff
1.5
Enter client's business name + HQ location + partner's mobile for OTP
OTP goes to partner, not client
1.6–1.8
Input OTP → Activate → Start KYB doc upload

1.9–1.13
Fill business details, upload docs, add directors/UBOs, submit with Authorization Letter
Partner selects "None of the above" (not a director/UBO) — signals authorized representative
1.14
Submit application with PPTA Authorization Letter + supporting docs
KYC review: 3–5 business days
Part 2: Account Ownership Transfer to Client
STEP
ACTION
NOTES
2.1–2.2
Update contact info to client's details
Future emails go to client
2.3–2.4
Update login email to client's email
Client receives verification email
2.5
Update 2FA to client's mobile
Requires OTP from both partner's and client's phone — coordination needed
Client
Accept Owner invitation → liveness check (selfie/ID via QR code) → password change
Verified immediately or manual review up to 3 days
Final
Client removes partner from the account
Go to Account → User Management → Remove user
Payoneer's Moats
Settlement Reliability
Transaction efficiency — banking network consistently completes transactions. Under-advertised advantage
Risk Breadth
More edge cases accepted, more LOBs supported. When competitors say "no," partners lose face
Coverage — 190 Countries
vs Airwallex 70. Multi-currency PSs significant (e.g., AUD PS core need in Singapore)
Local GTM Presence
Partner managers in-region vs competitors from home base only. Deeper market penetration
Parity gaps to close: Yield on USD balances, expense management — "everyone's giving it, we need to figure out how to do it" [Shaival]
Competitor GTM & Commercial Advantages
Beyond onboarding architecture, competitors also compete on partner economics and GTM motions that Payoneer currently lacks:
COMPETITOR
GTM/COMMERCIAL EDGE
Airwallex
Stronger commission (50%+, not performance-gated); main alternative alongside Currency
WorldFirst
Customized contracts — volume-based pricing adjustments across all partner's clients
3S Money
Heavy co-branding and joint marketing initiatives with partners
Currency
Stronger commercials; main alternative alongside Airwallex in MENA
Source: Ibrahim Youssef (Partner Manager, UAE/MENA), Mar 2026
Why now: Wise's Q4 2025 acceleration (2 new products in one quarter) signals increasing competitive pace.
3. The Opportunity
CSP Segment Baseline HIGH LEVEL PERFORMANCE — COMPANY FORMATION SERVICES
YEAR
COMPLETED REGS
FFT
ICP50K
REVENUE
ARPU
2024
1,964
569
58
$0.51M
$896
2025 (baseline)
10,235
2,941
432
$4.98M
$1,694
Δ 2024→2025
+421%
+417%
+645%
+876%
+89%
2026 YTD (Jan–Feb)
1,968
577
58
$0.51M
$884
*ARPU = Revenues/FFTs
Primary Outcomes
OUTCOME
BASELINE
TARGET
SOURCE
STATUS
CSP-led registrations per day
~2/day per active CSP (top 15 avg, Jul 25–Feb 26)
≥4/day (competitors: 6–10)
Portfolio Dashboard; confirmed by Shaival Mar 16
VERIFIED
Reg → FFT (CSP-led)
TBD — not surfaced in Portfolio Dashboard
Establish baseline, then improve
Requires CLM data pull
GAP
Reg → approval (days)
9d median / 30d P90
≤5d median / ≤14d P90
Internal data; competitor benchmark 1–3 days
VERIFIED
Revenue Estimates
REVENUE PROJECTION
Based on 2025 mature funnel rates and $1,694 revenue per FFT:
SCENARIO
ADDITIONAL REGS
ADDITIONAL FFTS
REVENUE UPLIFT
Conservative (+50% regs)
+5,118
+1,469
+$2.49M/year
Normal (2x regs)
+10,235
+2,937
+$4.97M/year
CONTEXT
FIGURE
SOURCE
CSP segment 2025 revenue (baseline)
$4.98M
High Level Performance
Conservative scenario — total channel
~$7.5M
Baseline + uplift
Normal scenario — total channel
~$10M
Baseline + uplift
30-CSP pilot (top CSPs — disproportionate share)
$750K–$1.5M+
Largest CSPs; ~3 months to see impact
FY2026 total companies revenue
$94M
Finance
Quality upside not yet priced in: 2026 customers are already 3–4x the ARPU of 2025 same-month cohorts. If that holds, the revenue per FFT will be significantly higher — potentially pushing the conservative scenario to +$3.7M–$4.3M.
Strategic Context: Onboarding Is Table Stakes
Partner feedback (Ibrahim Youssef, Partner Manager UAE/MENA, Mar 2026) confirms that onboarding quality is necessary but not sufficient for CSP volume growth:
	•	Onboarding keeps partnerships alive — partners who experience fast, quality onboarding stay even when commercials are weaker
	•	It allows Payoneer to justify premium pricing, especially in industries with high working capital dependency
	•	But revenue growth requires competitive commercials + network value (two-way referrals) alongside good onboarding
	•	Partners route volume to competitors primarily over commercials gaps (50%+ vs Payoneer's 40% performance-based), not onboarding friction
"For us to be able to even have these discussions, we have to maintain a certain level of service delivery." — Ibrahim Youssef
Implication: The revenue projections above assume onboarding improvement unlocks latent demand. The full revenue potential depends on GTM and commercial levers outside this initiative's scope.
4. Strategy
Aspiration
Become the default onboarding destination for partner-led cross-border account opening.
The platform CSPs choose first because it's fastest, most transparent, and gives them the most control — while Payoneer's moats (settlement reliability, risk breadth, 190-country coverage, local GTM) make it the most valuable for their customers.
Where to Play
DIMENSION
CHOICE
RATIONALE
Segment
CSP — formation, virtual CFO/tax, law firms
Highest ICP ($50K+), holds all KYC docs, strong incentive to push activation, 5x YoY growth
Persona
High-volume CSPs first ("Formation Factory")
Highest throughput leverage; validates model before expanding
Geography
Incorporation hubs: US, UK, HK, UAE, Singapore
Where delegated OB is the norm; highest drop-off = highest improvement potential
Channel
Reseller — currently ~1/4 of referral; goal is parity
Self-serve scaling down; referral has high CAC; reseller is the growth vector
How to Win
Five product decisions, each with a measurable bet.
DECISION
WHAT IT MEANS IN PRACTICE
HOW WE'LL KNOW IT'S WORKING
1. Separate actor from owner
CSP handles data, docs, and submission. Customer handles identity verification, consent, and account claim. System logs who did what.
Zero compliance incidents; full audit trail coverage; CSPs stop using dummy emails
2. Move OTP to handoff
CSP completes registration without needing the customer online. Customer verifies identity at handoff, not at start. Eliminates time-zone friction and the need for customer involvement during registration.
Per-CSP throughput ~2 → ≥4/day; OTP-stage drop-off ≥40% reduction
3. Portal first, API + batch only when validated
Self-serve partner portal for registration. No API/embedded/hosted/batch until CSPs tell us portal isn't enough — based on pilot data, not assumptions.
High-volume CSPs adopt portal; throughput and conversion improve measurably without API
4. Make compliance a trust differentiator
Explicit actor/owner permissions, full audit logging, secure tokenized handoff. CSP retains delegate access post-approval. Regulated CSPs choose Payoneer because of compliance, not despite it.
Regulated CSPs cite compliance model as a reason to stay; zero jurisdictional blocks
5. Let moats close deals — onboarding just removes the barrier
Don't compete on OB UX alone. Settlement reliability, risk breadth (190 countries vs Airwallex 70), and local GTM are the reasons to choose Payoneer. Onboarding improvements remove the barrier to accessing those moats.
CSP-led ARPU holds or increases; FFT conversion ≥15% relative lift
What We're Choosing NOT to Do (Yet)
NOT DOING
WHY
API/embedded/hosted before validating portal
Resist pressure to build integration infra before proving the delegation model works
Serving all partner types simultaneously
Boutique resellers, platforms, internal delegates benefit from same infra but are not the initial focus
Competing on product bundle parity (yield, expense mgmt)
Acknowledge the gap but don't let it block OB improvements — separate product decisions
Cross-product delegation in the first build
Bank, PS, first txn delegation is a future phase — don't scope-creep the first delivery
5. Who We're Building For
External Delegates
PERSONA
DESCRIPTION
VOLUME
PRIORITY
"The Formation Factory"
High-volume CSPs, 20–50+ inc/month, holds all KYC docs, multi-hub
High
P0 — TARGET
"The Trusted Advisor"
Boutique reseller, 2–8/month; pain = rejections, no status
Medium
P1
Platform/Marketplace
e.g., Skuad — API-first integration
Medium
P2
Internal Delegates
PERSONA
CURRENT PAIN
Ops
Complete KYC steps on behalf of customer, re-open — high manual load
CSM/Sales
Multi-entity re-onboarding; 60–70% of time on ops coordination
6. The Solution: E2E Delegated Flow
PHASE 1
CSP
1
Log in to PRM Portal
2
Initiate new onboarding
3
Enter initial data + receive required verifications/docs
5
Enter data + bank account + upload docs
6
Submit application
9
Resubmit if bounced
PHASE 2
PAYONEER
4
Trigger required verification based on initial data
7
Auto verification
8
Manual review + KYC Ops accelerator
10
Approve / Decline
11
Trigger customer handoff
PHASE 3
CUSTOMER (AH)
12
Receive handoff link
13
OTP + create password ← moved here
14
Accept T&Cs
15
Selfie (ID)
16
Self-attestation
17
Final consent — CSP retains delegate access
Key Design Choices
#
CHOICE
WHY IT MATTERS
1
OTP at step 13, not step 1
CSP completes 1–6 without customer online. Eliminates #1 pain point
2
Dynamic requirement surfacing (3→4)
CSP knows what to collect upfront. Prevents bounce/resubmit loops
3
Three-phase separation
Each actor has bounded responsibility. Foundation for API/embedded/hosted
4
CSP resubmission (step 9)
Direct CSP → verification center. Cuts 2–5 days off loops
5
Single handoff view (step 12)
One page with everything remaining. Matches competitor pattern
6
Meet CSPs where they work
CSPs use the system most convenient to them — PRM portal today, but designed so the same flow can surface via API, CRM integration, or WhatsApp when validated by pilot data
Compliance Boundaries
CSP — Can Do
	•	Data entry
	•	Document upload
	•	Basic info input
	•	All steps before customer handoff
MUST NOT DO
	•	Selfie
	•	T&Cs acceptance
	•	Self-attestation
	•	Password creation
	•	Operate account
Customer (AH) — Must Do
	•	Selfie / biometric ID
	•	T&Cs acceptance
	•	Self-attestation
	•	Password creation
	•	Final consent
Key Compliance Decisions LYDIA, MAR 11
TOPIC
DECISION
STATUS
OTP placement
Can move to end of flow; jurisdiction review needed
APPROVED
Bank account
Required at registration; name-mismatch/UBO path acceptable
APPROVED
Portal gating
Flow via authenticated partner portal, not open link
REQUIRED
Partner T&Cs
Must explicitly allow: input, upload, set up (not operate)
UPDATE NEEDED
CSP→AH linkage
"AH X onboarded by CSP Y" visible; CSP must disclose
REQUIRED
Doc resubmission
CSP responds directly to verification center; identified as linked CSP
APPROVED
Audit trail
Full logging: who, what, when, which permission
REQUIRED
Design Questions to Resolve
#
QUESTION
IMPACT
1
Step 3→4: Is dynamic requirement surfacing ready? Static fallback?
Functional but creates tech debt if static
2
Step 9: Who notifies CSP when docs bounce?
Communication routing needs system design
3
Step 11→12: What if customer doesn't act on handoff?
Reminder cadence TBD; CSP notification needed
4
Step 17: What scope of post-approval access does CSP retain?
CSP retains access; scope of visibility (status, docs, transactions) needs definition
How Our Flow Compares to Airwallex (see §2 for full flow)
Airwallex's actual partner flow validates our direction — both follow the same pattern: partner does data/docs, then ownership transfers to client via identity verification. But their flow has friction we solve:
AIRWALLEX FRICTION
OUR SOLUTION
Partner uses email aliases for multi-client registration
Authenticated portal — CSP identity is native
OTP coordination requires both parties present for 2FA handover
OTP at step 13 — customer completes independently via handoff link
Client must manually remove partner from account
CSP retains delegate access — no manual removal needed; scoped permissions by design
Password created by partner and shared verbally
Customer creates own password at handoff
7. MVP
MVP Scope
The MVP is scoped to INC (incorporation) customers only — the core CSP use case.
IN MVP
NOT IN MVP
INC entity type only
Other entity types (sole proprietors, etc.)
Dynamic data requirements based on CLM qualification rules
Pre-population of fields from external sources
CSP enters all data manually
Auto-fill, OCR, or data enrichment
PRM Portal as the single entry point
API, embedded, hosted, or batch
Single registration flow
Multi-entity or bulk registration
CSP ("Formation Factory") persona only
Other personas (resellers, internal delegates, boutique partners)
Alternatives Examined Before MVP
Before committing to a full delegated flow, we explored lighter-touch fixes. None proved sufficient on their own.
ALTERNATIVE
WHAT WE FOUND
STATUS
Move OTP to end of flow
Compliance approved (Lydia, Mar 11), but no dev solution found for CLM step bypass (PRM collects data upfront, injects into CLM backend, skipping front-end steps). Lightweight pre-registration form is an option but very manual.
PENDING DEV SOLUTION
CSP direct doc resubmission to KYC Ops
GTM (Shaival) confirmed not a top priority — CSPs are fine with the existing resubmission model and E2E time.
DEPRIORITIZED
Affiliate ID-based CSP tagging
Use existing affiliate ID (tags company formation partners in Salesforce) to identify CSP-led flows for separate routing and measurement. Config change, no new UI.
USEFUL FOR MEASUREMENT
Conclusion: Incremental fixes within the existing flow don't address the structural issue — the identity model still assumes actor = owner. This led us to pursue the MVP: a proper delegated flow via the PRM Portal.
Why PRM Portal First
	•	Already deployed — PRM exists, CSPs have accounts, routes to CLM via authenticated token. Adoption (~25–30% log in) is the constraint, not availability.
	•	Target persona doesn't need API — formation agents and law firms are not tech companies. A portal they can log into is the right interface.
	•	Fastest to pilot data — ship, measure, iterate before committing to heavier integration architecture. API/embedded/hosted are Phase 3+ if portal proves insufficient.
	•	PRM is the starting point, not the destination — the delegated onboarding app will be developed under the Payoneer application, reducing Salesforce dependency. PRM serves as the initial entry point while the Payoneer-owned experience is built.
MVP: Core Delegation via PRM Portal (2–6 months)
CORE BUILD
CSP logs into PRM → initiates registration → CLM handles data/docs/verification → customer receives handoff link for identity claim.
CAPABILITY
WHAT IT DOES
WHY IT'S IN MVP
Actor/owner role separation
CSP = actor; customer = AH. Each action logged with delegation context
Prerequisite for everything; fixes identity architecture gap
PRM → Payoneer app delegated flow
CSP initiates via PRM portal, authenticated token routes to a Payoneer-owned application for data and document collection. The app is designed to serve additional personas and flows beyond CSP onboarding
PRM as entry point; new app reduces Salesforce dependency and is reusable across delegated flows
Dynamic requirement surfacing
After initial data, system surfaces required docs/verifications
Prevents bounce/resubmit loops
Secure ownership claim
Handoff link → selfie, T&Cs, OTP, password, consent
Clean handoff; CSP retains delegate access
Status visibility
Per-customer status tracking on PRM dashboard
#1 complaint after OTP; dashboard scaffolding already exists
Communication routing
Doc bounces → CSP; identity items → customer
Prevents confusion / CSP exclusion
Phase 2: Expand Entity Types
AFTER MVP VALIDATED
Once the INC flow is validated, extend the delegated flow to all license/entity types.
WHAT
DESCRIPTION
All entity types
Sole proprietors, partnerships, LLCs, etc. — same delegation model, different qualification rules
Jurisdiction-specific requirements
Dynamic data requirements adapt per entity type and country
Phase 3: Prepopulation & Efficiency
REDUCE CSP EFFORT
Reduce CSP manual effort by leveraging existing data.
WHAT
DESCRIPTION
Prepopulation from eCollection
If a customer already has eCollection data, pre-fill known fields to reduce data entry
Batch registrations
CSP initiates multiple onboardings in parallel — only if Phase 1–2 prove single-reg is a bottleneck
Future Phases — Dependent on CSP Needs
What we build beyond Phase 3 is validated through pilot data and CSP interviews, not assumptions.
6–12 MONTHS
Multi-Model Onboarding
Embedded / Hosted / API options — only if portal proves insufficient for target CSPs
6–12 MONTHS
Lifecycle Management
CSP dashboard: customer status tracking, SLA monitoring, duplicate prevention
12–24 MONTHS
Cross-Product Delegation
Extend delegation beyond KYC: bank setup, PS activation, first-transaction guidance, multi-entity expansion
8. Pilot & Measurement
Overview
The MVP ships to a controlled cohort of 5–10 high-volume CSPs before broader rollout. The pilot runs for 3 months and uses three structured checkpoints — at week 2, week 6, and month 3 — to surface issues early, avoid 3-month blind spots, and generate early evidence for engineering allocation decisions.
Pilot Cohort
Size: 5–10 CSPs  |  Combined volume: ≥100 registrations/month  |  Duration: 3 months
Selection criteria:
	•	Active on Payoneer for 6+ months
	•	Hub geography: US, UK, UAE, or Singapore
	•	≥5 registrations/month
	•	Formation + VAS services (not referral-only)
	•	Known to use competitors (validates switching potential)
	•	ICP quality track record
	•	Multi-hub presence preferred
Checkpoint 1 — Week 2: Activation Check
Question: Are CSPs actually using the new flow?
Qualitative checkpoint — catches adoption failures (portal UX, enablement gaps, wrong CSP selection) before they compound into 3-month failures.
SIGNAL
THRESHOLD
ACTION IF MISSED
CSPs initiated ≥1 registration via new flow
≥3 of 10 pilot CSPs
Pause — investigate blocker before proceeding
No critical bugs or compliance blocks reported
0 blockers
Fix before proceeding
Checkpoint 2 — Week 6: Early Signal Check
Question: Is the core mechanic working?
Throughput and registration completion rate are readable at week 6. Approval speed is not yet reliable (cycle too long).
CRITERION
THRESHOLD
DATA SOURCE
Throughput trend
≥3 reg/day per active CSP (directional toward ≥4 target)
PRM dashboard
Registration completion rate
≥70% of started registrations submitted (directional toward ≥85%)
CLM funnel data
CSP-reported friction
No new structural blockers raised by ≥2 CSPs
Pilot interviews
If both trends directionally positive → continue. If either flat or negative → one focused sprint to fix before month 3 gate. A positive early read also provides leverage for sustaining engineering allocation.
Checkpoint 3 — Month 3: Full Go/No-Go
Question: Do we scale, iterate, or pause?
CRITERION
THRESHOLD
DATA SOURCE
Throughput
≥4 reg/day per active CSP (from ~2 baseline)
PRM dashboard
Registration completion rate
≥85% of started registrations submitted
CLM funnel data
Handoff completion rate
≥60% of registrations where customer completes verification
CLM / PRM
Reg → approval speed
≤5d median / ≤14d P90 (from 9d / 30d)
CLM / KYC Ops
CSP adoption
≥6 of 10 pilot CSPs complete ≥5 registrations via new flow
PRM logs
Compliance
Zero incidents; 100% audit trail coverage
Compliance review
	•	All 6 met → Scale. Expand to full CSP portfolio. Begin Phase 2 (additional entity types). Evaluate API/batch need based on pilot data.
	•	4–5 met → Iterate. One 6-week sprint to address gaps before re-evaluation.
	•	Fewer than 4 met → Pause. Escalate to product leadership. Re-examine structural assumptions before committing further engineering capacity.
Measurement Approach
WHY PRE/POST AND NOT A/B
A full A/B test is not feasible. The active CSP population (~15 high-volume CSPs) is too small for statistical significance, conversion cycles are too long (9d median / 30d P90 reg → approval, longer to FFT), and splitting CSPs into control/treatment groups would contaminate results — a single CSP registers multiple customers and cannot cleanly experience two flows simultaneously. Pre/post comparison is directionally reliable but not causally definitive. If results are strong (throughput doubles, approval time halves), confidence is high. If results are marginal, external factors cannot be fully ruled out. Where possible, we will use non-pilot CSPs as a passive comparison group to control for seasonality and market-level effects.
PRIMARY METHOD: PRE/POST COMPARISON
Baseline the top 15 CSPs for 3 months before launch. Measure the same metrics for the same CSPs after launch. Compare.
METRIC
MEASUREMENT WINDOW
DATA SOURCE
Registrations per CSP per day
3 months pre / 3 months post
PRM dashboard
Registration completion rate (start → submit)
3 months pre / 3 months post
CLM funnel
Handoff completion rate (customer verification)
N/A pre / 3 months post
CLM / PRM
Reg → approval (median + P90)
3 months pre / 3 months post
CLM / KYC Ops
Reg → FFT conversion
3 months pre / 6 months post*
CLM
CSP support contacts per case
3 months pre / 3 months post
Ops ticketing
*FFT conversion requires a longer post window given the activation cycle length.
Passive comparison group: Where possible, track non-pilot CSPs as a passive comparison group to sense-check directional findings and control for seasonality or market-level effects.
CHECKPOINT × MEASUREMENT METHOD
CHECKPOINT
MEASUREMENT METHOD
Week 2 — Activation
Observation only — no statistical analysis needed
Week 6 — Early signal
Pre/post directional read
Month 3 — Full go/no-go
Pre/post full comparison
9. Success Metrics
Primary KPIs
CATEGORY
KPI
BASELINE
TARGET
Throughput
Registrations per CSP per day
~2 (top 15, Jul 25–Feb 26)
≥4
FFT Conversion
Reg → FFT (CSP-led)
TBD (data gap)
Establish + improve
Speed
Reg → approval
9d median / 30d P90
≤5d median / ≤14d P90
Secondary KPIs
CATEGORY
KPI
BASELINE
TARGET
Conversion
Reg → Approval CVR (CSP-led)
TBD (data gap)
Establish + improve
Reg completion
Registration completion rate (start → submit)
TBD
≥85%
Handoff
Handoff completion rate (customer verification)
N/A (new metric)
≥60%
MR Speed
Time to approval (manual review)
~9 days
≤2 days
MR Quality
First-touch resolution
42%
≥50%
Compliance
Incident rate / audit coverage
0 / —
0 / 100%
Segment Health — Monitor Only
These metrics reflect CSP segment quality but are not directly impacted by the onboarding flow change. Tracked for regression detection.
METRIC
BASELINE
WATCH FOR
ICP$50K rate (of FFT)
15% (2025)
Drop below 12%
ARPU per CSP-led customer
$1,694 (2025)
Decline vs. 2025 cohort
10. Risks
RISK
SEVERITY
MITIGATION
No dedicated dev team
CRITICAL
No engineering team assigned to delegated onboarding. Progress depends on R&D managers allocating capacity on goodwill basis. Without dedicated ownership, MVP timeline is unpredictable and competes with BAU priorities
CLM step bypass not feasible
CRITICAL
PRM collects data upfront and injects into CLM backend, skipping front-end steps. If CLM can't accept injected data or skip steps, the delegation model breaks. Early R&D engagement
Dynamic requirement surfacing timing
MEDIUM
Align timeline; static forms fallback
Compliance / jurisdictional variance
MEDIUM
Most delegation rules resolved (Lydia, Mar 11). Remaining risk: OTP placement may vary by jurisdiction. If complications arise in a region, we won't launch MVP there — roll out only in approved geos
Slow CSP adoption
MEDIUM
PRM login is ~25–30% today. If CSPs don't adopt the new flow, impact is zero. Pilot with high-intent CSPs; guided enablement; measure adoption before scaling
Engineering scope creep
MEDIUM
Phased delivery; clear MVP boundaries; API deferred
Entity model readiness
MEDIUM
Not an MVP blocker — MVP uses flow-level delegation logging (PRM auth + CLM transaction context). Entity model needed for Phase 2+ (multi-entity, lifecycle dashboards, permission inheritance). Track timeline for post-MVP planning
Product parity gaps beyond OB scope
MEDIUM
Even with great onboarding, CSPs route volume to competitors over commercials (50%+ commission vs Payoneer's 40% performance-based) and lack of two-way referrals (partners want Payoneer to send clients TO them). Outside MVP scope — flag to GTM and product leadership; don't oversell OB as the full growth solution
Salesforce team dependency
LOW
Architecture decision to build under Payoneer-owned application reduces Salesforce dependency. PRM remains the entry point only; core flow logic moves off Salesforce. Residual risk limited to PRM auth token handoff
11. Open Questions
#
QUESTION
OWNER
STATUS
1
CLM step bypass feasibility — can PRM inject data and skip CLM front-end steps? (P0 blocker)
Eng lead
PENDING
2
Auth model for delegated flow — SSO from Salesforce? Payoneer login? New identity flow? Must CSP already have a Payoneer account?
Eng (Amit) + Product
OPEN
3
Duplicate onboarding prevention
Product
DEFERRED
4
Revenue potential of the portal — validated by top CSP interviews confirming MVP solves their needs?
Product + GTM + Finance
PENDING
5
Entity model design for Phase 2+ (not MVP blocker)
Eng + Arch
DEFERRED
Appendix
Glossary
TERM
DEFINITION
CSP
Company Service Provider — formation agents, virtual CFO/tax, law firms in incorporation hubs
Verification Center
Entity reviewing documents and verification requirements
Partner Registration Portal
CSP entry point (formerly PRM)
Actor
Person performing onboarding actions (CSP, reseller, Ops, CSM)
AH
Account Holder — end customer who owns the account
FFT
First Financial Transaction — marks customer as truly activated
CLM
Customer Lifecycle Management — current onboarding system
Last updated: 2026-03-31 · Owner: CLM Product · Sources: Product Strategy Doc, Competitive Deep Dives, MVP Definition, PRD Lite, Pain Points Master, Hypothesis Framework, Compliance Guidelines (Lydia Mar 11), GTM Dashboard, Shaival CSP Numbers Meeting, CSP Onboarding Compliance Flow PPTX
