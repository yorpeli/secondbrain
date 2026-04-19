ISP Delegated Onboarding — Discovery Brief
CLM Product Mar 2026 Discovery Synthesis: Research, Pain Points, Data, Competitive Gaps & Hypothesis
Bottom Line
Why We're Here
What Was Done
Pain Points
What the Data Shows
What Competitors Do
Who We're Building For
The Problem & Hypothesis
What's Still Missing
BOTTOM LINE
	•	8 discovery sessions across GTM, Partnerships, Compliance, ISP-facing ops, and internal product teams. All pointed to the same root cause: the onboarding flow assumes the customer is the actor. In ISP markets, a delegate does the work. This mismatch drives every pain point below.
	•	ISPs can do ~2 Payoneer registrations/day. Competitors enable 6-10. The gap is not product quality — it's process friction. OTP at registration start and zero partner visibility are the top two blockers.
	•	The data confirms the pain. CFS is a $5M/year segment growing 47% YoY, but only ~50% of approved customers transact — and the real top-of-funnel drop-off (registration start to completion) isn't even measured today.
	•	Competitors have solved this. Airwallex, Wise, and Mercury all offer explicit partner onboarding models with delegation, status visibility, and 1-3 day approval. Payoneer solution for delegated onboarding is far from competition.
	•	Compliance has green-lighted the core change (Lydia Man, Mar 11): ISP can do data + docs, customer does selfie + T&Cs + OTP at end. The structural objection is gone.
DATA SOURCE NOTICE
Cycle times, throughput estimates, and CSM burden percentages are sourced from internal meetings and qualitative interviews. Registration, revenue, and funnel figures marked GTM DASHBOARD are validated from Power BI (CFS affiliate industry filter, pulled Mar 15 2026). Competitive scores are from official docs, public reviews, and partner documentation. Remaining numbers are directional estimates.
01 Why We're Here
Payoneer's onboarding flow was built for a world where the customer opens their own account. But in key incorporation hubs — US, UK, UAE, Hong Kong, Singapore — that's not how it works. A third-party partner (ISP/ CFS) incorporates the company, gathers all documents, and sets up the banking relationship. The customer expects the ISP to handle everything.
Our system doesn't know who the ISP is. It has no concept of a delegate. So ISPs create dummy email accounts to bypass OTP, coordinate with clients across time zones for a verification code they can't receive, and submit applications into a black box with no status visibility. Meanwhile, competitors close the same onboarding in 1-3 days.
The result: ISPs may send more of their customers to whichever provider is faster. Today, Payoneer captures <15% of partner share of wallet, despite being a preferred brand. The potential addressable opportunity in the delegated channel is estimated at more than $10M — we're leaving most of it on the table.
"The reseller layer is where we have the most revenue impact or in terms of revenue quality. True ICP, 20K, 30K, 50K — all of that comes from this reseller layer."
— Shaival Mittal, ISP intro to CLM (Mar 10)

02 What was done so far?
Discovery sessions with stakeholders across GTM, Partnerships, Compliance, and ISP-facing operations. Strategy documents and internal decks review, competitive research across 5 providers, review funnel data from the GTM dashboard.
Discovery Sessions
DATE
SESSION
PARTICIPANTS
KEY SIGNAL
Feb 25
ISPs OB kickoff
Meital, GTM team
Initial scoping; identified ISP flow as distinct from self-serve
Mar 1
China B2B Solution — can we use it for ISPs?
Meital, Product
Explored existing B2B infra; confirmed it doesn't solve ISP delegation
Mar 2
ISPs OB Dashboard & PRM
Meital, GTM
Reviewed partner registration portal capabilities and data gaps
Mar 3
ISPs OB process deep-dive
Meital, Rishabh Ralhan (PDR)
Partner enablement flow; how PDR managers onboard and train partners
Mar 10
ISP intro to CLM — business context recording
Meital, Shaival Mittal (A&P Central), Elad Schnarch, CLM team
Partner types, volume benchmarks, revenue sizing, CSM burden, competitive pressure
Mar 10
Live ISP partner walkthrough recording
Meital, Karen Tan, Galaxy (GTM), Palak (ISP partner)
Real partner-led onboarding: OTP blocker, doc friction, selfie handoff, bank edge cases
Mar 10
Hopetex CLM operational walkthrough recording
CLM ops team
Doc policy friction, single-member entity handling, address verification, bank localization
Mar 11
Compliance guidelines for ISP flow
Meital, Lydia Man (Compliance), Shaival Mittal
Green light: ISP can do data/docs; customer does selfie + T&Cs + OTP at end
Documents & Data Reviewed
SOURCE
TYPE
KEY SIGNAL
Product Strategy — Delegated Onboarding
Strategy doc
$12M TAM, <15% share of wallet, actor/owner gap, solution themes A-G
ISP Delegated Onboarding Current Flow (Feb 26 deck)
Internal deck (10 slides)
"OTP too soon", "20 days vs 3 days", ISP pain list from Karen, Galaxy, Ibrahim
GTM Power BI Dashboard — CFS affiliate industry
Validated data (Mar 15)
11K regs (2025), $5M revenue, 55% approval, 50% FFT, $1,810 ARPU
Competitive research (5 providers)
Official docs, public reviews
Airwallex, Wise, WorldFirst, Mercury, Relay — partner onboarding models and scoring
So what: The consistency of findings across 8 independent conversations, 3 strategy documents, and external competitive evidence gives high confidence in the diagnosis.

03 Pain Points, Ranked by Impact
#1OTP at registration start blocks the entire ISP flow
OTP is sent to the customer's email/phone at signup. ISPs must coordinate with the client in real-time — often across time zones — before they can even begin data entry. This is the single most cited blocker across every session.
"It's very, very cumbersome… get the client to be on standby… different time zones… almost impossible."
— Karen Tan, live partner walkthrough (Mar 10)
"Is it possible verification code comes to me and not client directly?"
— Palak (ISP partner), live walkthrough (Mar 10)
"In our case, the partner sends the link to the customer and then starts the ping pong match…"
— Shaival Mittal, ISP intro to CLM (Mar 10)
#2No actor/owner separation — the system doesn't know who the ISP is
The current model has no concept of a delegate. ISPs create dummy email accounts to bypass OTP, fill forms using "save form" workarounds, and have no system-native identity. This creates compliance ambiguity, audit gaps, and friction at every handoff.
"There is no structured or secure mechanism for delegates to act on behalf of customers."
— Product Strategy doc
"Some partners create a dummy email."
— Shaival Mittal, Feb 26 deck (Slide 3)
#3ISP has zero visibility after submission
Once the ISP submits the application, all notifications go to the customer — not the ISP. The ISP has no dashboard, no status updates, no idea if docs were bounced. They run the operation but fly blind.
"Doc re-submission requests and onboarding status go to customers only; ISP visibility is limited."
— Karen & Galaxy, Feb 26 deck (Slide 2)
"The customer gets the notification but the ISP is the one that needs to submit it."
— Ibrahim Youssef, Feb 26 deck (Slide 9)
#4Manual review cycle is 5-7x slower than competitors
When ISP-led cases hit manual review, the cycle averages ~10 days. Communication is email-only, and document bounces route through a GTM intermediary instead of going directly to the ISP. Competitors close the same loop in 1-3 business days.
VERIFIED
"20 days vs 3 days at competitors."
— Karen & Galaxy, Feb 26 deck (Slide 2)
#5CSM time consumed by ops instead of growth
CSMs spend 60-70% of their time on operational escalations instead of upsell and cross-sell. Every unclear rejection, every doc bounce, every status question routes through the CSM because the ISP has no direct channel.
VERIFIED
"CSMs are investing 60 to 70% of their time in OPS… limiting bandwidth to do actual upsell and cross sell."
— Shaival Mittal, ISP intro to CLM (Mar 10)
"There's one guy per region who looks after all these reseller requests and then he reroutes them via back office, ORN, OPS, CS, Salesforce…"
— Shaival Mittal (Mar 10)
#6Document policy and bank-link edge cases create high-touch ops
Address verification requirements, board resolution formats, UBO ownership thresholds, and name-mismatch bank flows are procedurally heavy and poorly documented for partners. Each unclear requirement generates a back-and-forth cycle.
VERIFIED
"Address verification, board resolution, and corporate docs create substantial procedural load."
— Partner walkthrough synthesis (Mar 10)
"Competitors don't require to connect bank account as part of the OB. Most of ISP don't have a bank account."
— Karen & Galaxy, Feb 26 deck (Slide 4)
The Root Cause: Process-Reality Mismatch
Every pain point above traces back to one structural issue — the system was designed for a world that doesn't match how ISPs operate:
THE PROCESS ASSUMES…
THE FIELD REALITY IS…
Actor = account holder
Actor = ISP delegate; owner = customer
Customer available for real-time OTP
Customer in different timezone; ISP creates dummy emails to bypass
Customer monitors notifications
Customer "sleeps on emails"; ISP has no visibility
Direct customer-to-rep communication
ISP handles everything but is invisible to the system
One registration at a time
ISPs need to manage 5-50+ clients in parallel
So what: This isn't about convenience. ISPs are the high-quality acquisition channel (true ICP, $20-50K+ customers), but Payoneer captures <15% of their wallet. Every pain point above is revenue left on the table.
"If all of these partners even were to do instead of two registrations, four registrations — we'll double the business."
— Shaival Mittal (Mar 10)

04 What the Data Shows
~2/day
Payoneer registrations per ISP
Competitors: 6-10/day
~20 days
Reported time to approval (ISP flow)
Competitors: 1-3 business days
60-70%
CSM time consumed by OPS
Instead of upsell/cross-sell
CFS Segment — Validated Funnel GTM DASHBOARD
Funnel starts at registration completed — does not capture registration-start-to-completion drop-off (where OTP friction hits hardest).
PERIOD
REG COMPLETE
REG APPROVED
APPROVAL RATE *
FFT
FFT / APPROVED
2024 (mature)
7,588
4,488
59.1%
2,200
49.0%
2025
11,147
6,154
55.2% *
3,134
50.9%
2026 YTD
2,542
1,393
54.8% *
676
48.5%
* Newer cohorts may still be maturing.
PERIOD
IN-YEAR VOLUME
REVENUE
ARPU
TAKE RATE
2025
$474M
$5.0M
$1,810
1.05%
2024
$246M
$2.6M
$1,440
1.05%
2026 YTD
$62M
$422K
$802
0.68%
Context Metrics
METRIC
VALUE
SOURCE
Active reseller partners
~70
MEETING Shaival, Mar 10
CFS revenue (2025 actual)
$5.0M
GTM DASHBOARD
YoY registration growth (2024 → 2025)
+47%
GTM DASHBOARD
YoY volume growth (2024 → 2025)
+93% ($246M → $474M)
GTM DASHBOARD
Estimated revenue uplift with product changes
+$2.5-3M
MEETING Shaival, Mar 10
Estimated total addressable (delegated channel)
~$12M
MEETING Product Strategy doc
Partner share of wallet
<15%
MEETING Product Strategy doc
Top incorporation hubs
US, UK, UAE, HK, Singapore
MEETING Shaival, Mar 10
So what: CFS is already a significant growth driver for Payoneer — $5M/year segment growing 47% YoY on completed registrations. ~50% of approved accounts transact — and the real top-of-funnel loss (registration start → completion) is not even captured, meaning the true conversion is significantly worse. Removing friction could unlock additional value from the $12M TAM. Even a modest 10pp improvement in FFT conversion = ~600 additional transacting customers per year at $1,800 ARPU = ~$1.1M incremental revenue — and that's before counting the registrations that never complete today.

05 What Competitors Do Differently
Competitive analysis across 5 providers, scored on a hybrid partner-centric scorecard (70% partner criteria, 30% customer-impact criteria). Scores from official docs, public reviews, and partner documentation.
Partner Experience Scorecard (Hybrid, /5.0)
Airwallex

4.14
Wise

3.38
WorldFirst

3.14
Mercury

3.10
Relay

2.58
Payoneer

2.24
How They Solve What We Don't
CAPABILITY
COMPETITORS
PAYONEER TODAY
Partner delegation model
Airwallex: embedded, hosted, and native API onboarding for connected accounts. Wise: first-party vs third-party partner model with OAuth. Stripe: role-based delegation with hosted KYC.
No delegate concept. ISP is invisible to the system.
OTP / identity ownership
Partner initiates onboarding; customer completes identity verification at end. No real-time sync required between partner and customer.
OTP at registration start. Partner and customer must be online simultaneously.
Multi-client management
Airwallex: list/filter/manage multiple connected accounts via API. Relay: partner dashboard with multi-client progress tracking. Mercury: onboarding API with status tracking.
No partner portal. No API. ISPs manage clients via email/spreadsheets.
Status visibility
Relay: explicit review statuses (In Review, Waiting on Docs, Under Review). Mercury: 1-2 day decision expectation with clear status. Airwallex: webhook-driven status updates.
All notifications go to customer. ISP has no visibility.
Time to approval
1-3 business days (Relay, Mercury, Wise). Automated for low-risk cases.
~20 days reported for ISP-led cases.
So what: The competitive gap is not about pure KYC capability — it's about orchestration quality: faster partner launch, better ISP and customer waiting experience. Airwallex's 4.14/5.0 vs Payoneer's 2.24/5.0 is not a branding problem — it's a structural product gap in how we handle delegation.

06 Who We're Building For
Three partner archetypes emerged consistently from the discovery. One is the clear MVP target.
So what: The MVP should be built for Persona 1. They hold all KYC docs (they created the company), have the highest volume, generate the best-quality customers, and are the most motivated to switch from competitors. If we solve for them, Persona 2 benefits from the same infrastructure with lighter UX.
Persona 1: High-Volume Incorporation Provider
P0 — MVP target
Company formation firms in the top-5 incorporation hubs (US, UK, UAE, HK, Singapore). They create companies and need Payoneer to fill the "business banking gap" in their client journey.
VOLUME
20-50+ incorporations/month. Wants 4-10 Payoneer registrations/day. Currently limited to ~2.
HAS AT HAND
All KYC/KYB docs — they created the company. Incorporation cert, CBD, UBO info, address proof.
KEY PAIN
Cannot complete onboarding without customer coordination. OTP, selfie, and status visibility force multiple sync points across time zones.
COMPETITORS
Active with Airwallex, Wise, Mercury. Sends more clients to whichever provider is faster.
SUCCESS =
Complete onboarding without client involvement (except final ID/consent). Real-time multi-client status. Predictable cycle time.
"Anyone whose core business is company formation… they have this gap in between of a business banking account because for this service they have to let the customer go in the middle."
— Shaival Mittal
Persona 2: Boutique Reseller / Regional Agent
P1 — fast follow
Small accounting firms, trade consultants, or business advisors. 2-8 clients per month. Less tech-savvy. Payoneer is complementary, not core.
KEY PAIN
Doesn't understand rejection reasons. Has to go through a regional GTM person to resolve anything. No status visibility.
SUCCESS =
Simple guided flow. Plain-language rejection explanations. Direct channel to KYC — no intermediary.
MVP implication: Same delegation infrastructure as Persona 1, but with guided UX and simpler onboarding wizard.
Persona 3: Internal Delegate (Ops / CSM / Sales)
P2 — later
Payoneer internal teams assisting high-value customers. They have back-office workarounds that external ISPs don't.
KEY PAIN
60-70% of CSM time consumed by OPS instead of growth. No streamlined assisted-onboarding flow.
MVP ROLE
Not the target. Benefits from the same delegation layer once built for ISPs.
Why This Priority Order

REVENUE LEVERAGE
PAIN SEVERITY
DATA AVAILABILITY
COMPETITIVE PRESSURE
P0: Formation Provider
Highest ($20-50K ICP)
Critical — blocked daily
Holds all docs
Actively using competitors
P1: Boutique Reseller
Moderate (smaller deals)
High — but lower frequency
Partial docs
Some competitor exposure
P2: Internal Delegate
Indirect (CSM efficiency)
Medium — has workarounds
Full internal access
None (internal)

07 The Problem & Hypothesis
PROBLEM STATEMENT
Payoneer's onboarding system assumes the person filling out the application is the account holder. In ISP-led markets, a delegate does the work. This mismatch between the product model and the field reality is the root cause of:
	•	Throughput bottleneck: ISPs limited to ~2 registrations/day vs 6-10 at competitors, because OTP requires real-time customer coordination
	•	Visibility blackout: ISP has no status tracking, no doc-bounce notifications, no multi-client dashboard — they run the operation blind
	•	Cycle time gap: ~20 days to approval vs 1-3 days at competitors, driven by email-only communication and intermediary routing
	•	Revenue leakage: <15% share of wallet from a $12M addressable channel; ISPs route customers to whichever provider is fastest
	•	Internal cost: 60-70% of CSM time consumed by OPS escalations instead of revenue-generating activities
HYPOTHESIS
If we introduce a true delegated onboarding mode — separating who acts from who owns — we can unlock the ISP channel at scale.
Specifically:
Main Hypothesis — Moving OTP and customer identity verification to the end of the flow (after ISP completes data + docs) will remove the #1 blocker and enable ISPs to reach 4-6+ registrations/day without requiring real-time customer coordination. COMPLIANCE GREEN-LIGHTED
Expected Impact (if hypothesis holds)
2x-3x
ISP throughput uplift
From ~2/day to 4-6+/day

08 What's Still Missing
The diagnosis is strong but not complete. These gaps need to be closed before moving to solution design.
GAP
WHY IT MATTERS
STATUS
Stage-by-stage funnel for ISP motion
We have top-line CFS numbers but no breakdown for the ISP-specific flow. Without it we can't size the OTP drop-off everyone cites as #1, can't quantify each friction point, and can't set measurable MVP targets. This is the top-priority data gap.
NOT STARTED
Direct ISP voice
All evidence is from internal stakeholders observing ISP behavior. Zero direct interviews with ISP partners. We need to validate that our understanding of their pain matches their lived experience.
NOT STARTED
Engineering feasibility
No engineering input yet on actor/owner separation complexity, OTP flow configurability, or partner portal integration effort. We need T-shirt sizing before committing to an MVP scope.
STARTED
Persona validation with Partnerships
Three archetypes are derived from transcripts, not validated with the Partnerships team or with actual partners. Need to confirm the priority order and partner distribution across personas.
DRAFT
Registration start-to-completion drop-off
The GTM dashboard starts at REG Complete. The biggest friction (OTP) happens before that point. We have no data on how many registrations are started but never completed — this is where the real opportunity may be largest.
NOT MEASURED
Next steps: (1) Pull stage-by-stage funnel data for ISP-led cases from CLM/ORN systems. (2) Schedule 3-5 direct ISP interviews starting with high-volume formation providers. (3) Run a technical feasibility session with Engineering on OTP configurability and actor/owner separation. (4) Validate personas with Shaival and Partnerships team.

Evidence Source Index (8 sessions, 2 strategy docs, 3 decks, 1 dashboard, 5-provider competitive research)
SOURCE
TYPE
DATE
KEY SIGNAL
ISPs OB kickoff
Meeting
Feb 25
Scoping; ISP flow identified as distinct from self-serve
China B2B Solution — ISP feasibility
Meeting
Mar 1
Existing B2B infra doesn't solve ISP delegation
ISPs OB Dashboard & PRM
Meeting
Mar 2
Partner Registration Portal capabilities and data gaps
Rishabh Ralhan — ISPs OB process
Meeting
Mar 3
PDR enablement flow, partner training, relationship management
Shaival Mittal — ISP intro to CLM
Meeting
Mar 10
Partner types, volume benchmarks, revenue sizing, CSM burden
Karen Tan — Partner registering client
Meeting + walkthrough
Mar 10
OTP blocker, doc friction, selfie handoff, bank edge cases
Hopetex CLM meeting
Meeting
Mar 10
Doc policy friction, single-member entity, bank localization
Lydia Man — Compliance guidelines
Meeting
Mar 11
ISP/customer responsibility split, OTP green light, T&Cs update
ISP Delegated Onboarding Current Flow
Deck (10 slides)
Feb 26
"OTP too soon", "20 days vs 3 days", ISP pain list (Karen, Galaxy, Ibrahim)
Product Strategy — Delegated Onboarding
Strategy doc
—
$12M opportunity, <15% share of wallet, actor/AH gap, solution themes
GTM Power BI Dashboard — CFS affiliate
Dashboard
Mar 15
11K regs, $5M revenue, 55% approval, 50% FFT, $1,810 ARPU
Competitive research — Airwallex
Official docs + reviews
Mar 5
Embedded/hosted/API partner onboarding; score 4.14/5.0
Competitive research — Wise
Official docs + reviews
Mar 5
First-party/third-party model; OAuth; score 3.38/5.0
Competitive research — WorldFirst, Mercury, Relay
Official docs + reviews
Mar 5
Partner dashboards, status communication, 1-3 day approval
Prepared by CLM Product. Evidence labels: VERIFIED = direct quote or confirmed data point. GTM DASHBOARD = validated from Power BI (CFS affiliate industry, Mar 15 2026). MEETING = stated in internal meeting (not validated from data systems). GAP = not yet validated.
