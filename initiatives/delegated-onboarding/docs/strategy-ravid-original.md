Delegated Onboarding - Product Strategy Document 
1. Problem Framing 
Current State: Payoneer’s onboarding flow is designed for single user and assumes the person performing onboarding is the customer itself.
Reality: In many key markets, especially incorporation hubs such as US, Hong Kong, UK, UAE, and Singapore - onboarding is often performed by a 3rd  party acting on behalf of the user, including:
	•	External partners - incorporation service providers (ISP), resellers
	•	Internal teams - Ops, CSM, Sales
These delegates collect documents from users, complete registration details and interact with our systems despite not being the legal account owner.
Current Limitations:
	•	Delegates have little to no visibility into the onboarding status of the customers they support
	•	They cannot onboard multiple customers in parallel, limiting scale.
	•	There is no structured or secure mechanism for delegates to act on behalf of customers.
	•	Heavy reliance on manual KYC steps creates friction points and delays.
Conclusion: Payoneer current onboarding design does not differentiate between the actor and the account owner creating operational inefficiency, customer hassle and significant gaps in high potential markets where delegated onboarding is the standard operating model.
Impact:
	•	<15% partner share of wallet, despite strong market demand
	•	Manual handoffs between partner → Ops → customer
	•	Compliance risks due to unclear or missing ownership transitions
2. Opportunity
Enable Delegated Onboarding that allows authorized actors to initiate, manage and complete onboarding on behalf of users, while preserving ownership integrity and providing transparent, real time visibility into onboarding status. 
Expected outcomes:
	•	Collaborate with high volume partner acquisition channels – estimated revenue $12M (as a comparison - total expected revenue from companies for FY2026 is $94M)
	•	Empower internal teams to complete onboarding for high value customers
	•	Reduce friction and operational load by providing a seamless eKYC experience

4. Competitor Landscape 
Industry standard:


Competitors Examples:
	•	Airwallex: Partner initiated onboarding, owner invitation, mandatory ownership verification, auto removal of delegate access.
	•	Mercury: Onboarding API, data prefill, unique referral link, status tracking, partner attribution.
	•	Relay: Partner/advisor dashboard with multi-client onboarding and progress tracking.
	•	Stripe: Platform led merchant onboarding with delegated KYC, hosted flows, and role-based permissions.
Competitive Gaps:
Compared to the above, Payoneer currently lacks:
	•	Partner portal for multi client onboarding
	•	eKYB APIs with prefill capabilities
	•	Structured and secure owner claim handoff
	•	Role based permissioning (actor vs. owner)
	•	Real time onboarding status visibility 
	•	Audit logged delegation trail (who did what)
This reinforces the strategic need for a Delegated Onboarding Framework.
5. User Segmentation
There are several personas for the delegated onboarding use case:
	•	External Delegates-
	•	Incorporation Service Providers / Resellers (high volume)
	•	Platform/Marketplace Partners - e.g Skuad
	•	Accountants/Advisors (portal, smaller volumes)
	•	Internal Delegates-
	•	Ops - complete KYC steps on behalf of the customer, re-open etc
	•	CSM/Sales - usually whenever an existing managed customer opens another entity he needs to re-onboard, CSM could benefit from performing onboarding on behalf of the (already known) customer
	•	End Customer (account holder)-
	•	Approves the account, completes biometric verification, creates credentials, provide final consent, own the account
Prioritization criteria:
	•	Volume (low/med/high), Integration (Portal vs API vs Hosted), Geo tier, KYC complexity, Support model (self serve vs managed?)
6. Pain Points 
There are multiple pain points:
	•	No clear distinction between actor and AH, resulting in back and forth communication 
	•	No partner portal or API to initiate or track multiple clients, resulting in loss of partners with multiple AH’s to onboard (high volume)
	•	Missing secure and structured handover mechanism
	•	KYC process is manual, with friction and long  

	•	Ops and CSM rely on manual emails or informal communication 
	•	Auditable tracking of ‘who did what’ is missing
	•	Risk of duplicate initiations by multiple delegates can potentially cause account blockage (TBD – how frequent it this pain point?)

7. Solutions Themes

Theme A: Portal Based Delegated Onboarding (Portal First)
A Payoneer owned portal for partners (ISPs, resellers) to initiate onboarding, upload documents and manage multiple customers.
	•	Easiest to adopt
	•	Fastest time to value
	•	Highest coverage of partner types
	•	Allows validation before integration and exposing APIs
(This is the recommended MVP direction)
Theme B:  Partner API (System to System Delegation)
A full API for high volume partners to programmatically create onboarding cases, prefill data, upload docs, and receive status via webhooks.
	•	Scales to thousands of onboardings
	•	Required by advanced partners
	•	Higher complexity and compliance governance
(Chosen later, after portal validation)
Theme C: Role Based Delegation Layer
Introduce a unified delegation engine with clear separation between delegate and account owner, including permissions, masking rules and lifecycle management.
	•	Fundamental for all models
	•	Ensures compliance and auditability
Theme D:  Secure Ownership Handoff
A tokenized “claim ownership” flow for the end customer to complete Selfie and accept final consent, with auto revocation of delegate access.
	•	Mandatory compliance requirement (Assumption, needs to validate?)
	•	Standard pattern in competitor solutions
Theme E: Multi Customer Visibility (dashboard?)
Provide delegates and internal teams with shared, real time visibility into onboarding status, next steps, and required actions.
	•	Reduces back and forth
	•	Improves conversion
	•	Supports high volume partners
Theme F:  Duplicate Prevention  (TBD - how frequent is this?)
Prevent multiple delegates from initiating onboarding for the same entity.
	•	Critical for partner ecosystem
	•	Reduces confusion and compliance risk
Theme G: Reusable Delegation Framework for All Personas
Build once and reuse across:
	•	External partners (ISPs, resellers, advisors)
	•	Internal delegates (Ops, CSM, Sales)
	•	Future external APIs
This ensures consistency, scalability and compliance alignment.

8. Product Vision
Separate who acts from who owns. Build a delegated onboarding abilities that empowers verified delegates to initiate and progress onboarding on a customer’s behalf. While ownership, consent and control always remain with the end customer (AH). 
9. Suggested MVP
Portal first + delegation layer + ownership handoff
The MVP focuses on enabling delegated onboarding for ISPs and internal teams, using a Payoneer Partner Portal on top of a unified delegated onboarding backend.
MVP Personas Included:
	•	External Delegates: ISPs (portal first)
	•	Internal Delegates: Ops (for support, not onboarding users for now)
	•	End Customer: AH (claim & verification)
MVP Flow:

Primary MVP Goal: Allow authorized delegates to initiate, manage and track onboarding for multiple customers with a secure ownership handoff and clear audit trail.
Not included in MVP:
	•	Full public Partner API
	•	Bulk uploads 
	•	Marketplace integrations
	•	Advanced analytics in portal
	•	Partner specific workflows or custom branding
	•	Change settings
	•	
	•	


10. Metrics
KPI
Description
Relevance
Target
Delegated onboarding conversion rate
% of onboarding flows initiated by delegates that reach activation
Core performance metric
TBD
Time to FFT
Days from initiation to FFT
Efficiency & user experience
Reduction from 3-12 days to 1-2 days 
Manual Ops touches per onboarding
Average manual interventions per flow
Operational impact
TBD
Handoff completion rate
% of customers completing claim & Selfie after delegate initiation
Process health
TBD
Partner / Reseller revenue contribution
Total revenue generated through partner initiated onboardings
Business growth
Annual $12M revenue
Customer touch points
How many times the partner needed to contact the user during the onboarding process
Customer experience
Reduce from avg. of 5 touch points  to 1
Compliance exceptions
% of delegated onboardings with missing consent/audit trail
Risk & compliance
0 tolerance



12. Open Questions
	•	How much revenue could the portal MVP bring? Without bulk
	•	How to prevent duplicate onboarding initiated by multiple delegates?
	•	Should internal and external delegates share one UI or distinct interfaces?
	•	How will CLM perform without Ravid?


























APPENDIX


Glossary
	•	Incorporation Service Providers (ISP) –  Companies that help businesses set up legal entities in incorporation hubs (US, UK, HK, UAE, Singapore, etc.). They open the company for the customer and because the customer typically doesn't understand USA/UAE/HK incorporation requirements or KYC terminology the ISPs already have the documents and simply perform the same workflow.
	•	Resellers - partners who sell or promote Payoneer as part of their offering. They may or may not provide incorporation services (Payment consultants, Freelance agencies) they can assist the user with onboarding.
	•	AnP (Affiliates and Partners) - a broad category that includes any external partner who brings customers to Payoneer. Can be through referrals, promotions, integrations, or value added services.
	•	Incorporation Hubs - are countries or jurisdictions where international businesses commonly choose to register a company
Useful Materials
Shaival Deck
Recording of Relay flow -  Relay-Comparative-Explainer 1.mp4
Delegated Onboarding in Non-Fintech Industries
Delegation happens whenever:
	•	The process is complex
	•	A professional helper assists a non-expert
	•	Multiple actors are involved
	•	Compliance requires identity to be verified separately
	•	Ownership must be transferred to the end user
Examples include:
	•	Healthcare: Clinic admins register patients. patients later verify identity and sign consents.
	•	SaaS: IT admins create employee accounts, employees later claim access.
	•	Government & Legal: Attorneys or accountants complete applications, citizens later authenticate.
	•	Education: School admins create student profile, students accept terms and log in.
These industries share the same pattern Payoneer faces: actor ≠ owner, multiple personas involved and compliance requiring a secure ownership handoff.













