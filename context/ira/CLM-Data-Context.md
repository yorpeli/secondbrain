---
summary: CLM onboarding business context — dual registration systems, customer segments, funnel stages, key metrics, drop-off drivers, active experiments
topics: [clm-funnel, onboarding, data-analysis, customer-segments, metrics]
agents: [analytics, hub-countries-pm, team-lead]
---

# CLM Data Context

> Use this file as context when analyzing CLM onboarding data.
> For data structure, event definitions, and field mappings, see `CLM-Data-Dictionary.md`.
> For platform-specific guidance, see the companion files: `amplitude.md`, `fullstory.md`, `unitq.md`.

---

## Two Parallel Registration Systems

Payoneer is migrating from a legacy registration system ("Four Step") to CLM. Both run simultaneously, with traffic split by country and rollout percentage.

| System | Approach | Impact on Data |
|--------|----------|----------------|
| **Four Step** (legacy) | Collects basic data, lets customer in, surfaces KYC requirements incrementally as they use services | Higher initial conversion, but churn spikes later when KYC is enforced at thresholds. Fraud detected late (post-10K status) |
| **CLM** (new) | Collects and verifies everything upfront before granting platform access | Lower initial conversion, but approved customers generate significantly more revenue. Fraud/blocks happen early |

When analyzing funnel data, always check which system the cohort belongs to — combining Four Step and CLM data without segmentation will produce misleading conversion metrics.

**Rollout**:
- **D2P receivers**: Rollout % varies by country (5–100% as of Feb 2026), with a target of 100% by H1 2026. Web (Desktop + Mobile Web) and Mobile App rollout can be controlled independently. Mobile app is currently at ~5% for most countries.
- **Partners**: Rollout is per-partner, not per-country. Once a partner is enabled for CLM, 100% of that partner's traffic goes to CLM. If a partner's customer is in a country not supported by CLM, they fall back to Four Step.
- **Payers**: CLM supports payer registrations in **4 countries only: Israel, Spain, Germany, and UK**. Payer rollout % is aligned with D2P receiver rollout in those countries. In all other countries, payers go through Four Step.
- **Excluded countries** (specific licensing needs): Australia, China, Hong Kong, India.

---

## Customer Segments in the Data

### By Registration Flow

| Flow | Description | CLM Support |
|------|-------------|-------------|
| **D2P** (Direct to Payoneer) | Customer registers directly via payoneer.com | Yes — primary CLM focus |
| **Partner Registration** | Customer onboards through a marketplace/platform (e.g., Etsy, Walmart, Airbnb) and is redirected to Payoneer | Partial — depends on sub-type |
| **Payer Registration** | Customer registers to pay invoices (via Billing Service) | Supported in CLM for 4 countries only: Israel, Spain, Germany, UK. All other countries routed to Four Step |

### By Customer Type

| Type | Internal Label | What It Means | Funnel Impact |
|------|---------------|---------------|---------------|
| **Unregistered business** | Individual | Business is not registered with a government registry (freelancers, sole traders) | Lighter KYC — fewer steps, fewer documents |
| **Registered business** | Company | Business has formal government registration | Heavier KYC — business details, company structure, UBOs, more documents |

This split is determined at sign-up ("Is your business registered?") and heavily impacts funnel length and drop-off patterns.

### By Persona

| Persona | Capabilities | Funnel Path |
|---------|-------------|-------------|
| **Receiver** | Receive and send funds, hold a Payoneer balance, access full account services | Full CLM funnel |
| **Payer** | Pay invoices only — no balance, no money-in | Separate (non-CLM) funnel |

### By Plan

| Plan | Trigger | Account Scope |
|------|---------|---------------|
| **Light Plan** | Customer's sole source of funds is marketplaces tagged as "light account" | Limited services, different fee structure |
| **Regular Plan** | All other customers | Full account capabilities |

Plan is determined automatically during segmentation based on source-of-funds and marketplace selection.

---

## The CLM Funnel Stages

### Stage 1: Sign-Up (Quick Registration / QR)

Sequential steps — each is a potential drop-off point:

1. **Entry** — Customer clicks "Get Started" / "Register" from any Payoneer page
2. **Intent selection** — "Get paid, send payments and more" (receiver → CLM) vs. "Only pay" (payer → legacy)
3. **Email** — Collected; checked for existing account
4. **Email verification** — 6-digit code via email
5. **Business type** — "Is your business registered?" (Individual vs. Company — determines KYC path)
6. **Name / Business name** — First+last name (individual) or legal business name (company)
7. **Country** — Country of residence (individual) or country of business registration (company). **Locked after this point** — determines license and flow
8. **Phone number + verification** — SMS, call, or WhatsApp
9. **Password creation**
10. **Marketing opt-in**

**Output**: Customer has credentials and an account holder record, but is NOT a Payoneer customer yet (no T&Cs signed).

### Stage 2: Segmentation

1. **Industry** — Single-select dropdown
2. **Source of funds** — Marketplace/platform payments, B2B, or checkout solution
3. **Which marketplace(s)** — Multi-select (only if source = marketplace). Determines Light vs. Regular plan
4. **Expected number of payments** — "None yet" skips the volume question
5. **Expected monthly volume** — Revenue band

**Output**: Customer is segmented — plan assigned, sales qualification signal generated.

### Stage 3: Showroom (Holding State)

Customer lands in a static lobby page (Light or Regular version). No services available yet. This is a waiting/transition state before KYC.

> Being replaced with actual My Account UI (services still locked).

### Stage 4: Info & Documents (KYC/KYB)

> Also referred to as **Account Setup** or **Account Activation**.

This is where the heaviest drop-off occurs. Steps vary by customer type.

**For registered businesses (worst case / longest path):**

1. Business details — type (first step: choose business type, e.g., sole proprietorship, public company, partnership), name, DBA, online presence, activity region, address, BRN/EIN, incorporation date. **Sole Proprietors (SPs)** are a special case — they follow the Company path but skip business structure and UBO requirements
2. Personal details (account operator) — name, DOB, nationality, residential address, ID details
3. Bank account — withdrawal bank details (dynamic by country + currency). Registered businesses can add a personal bank account if it belongs to a UBO (exception: Japan)
4. T&Cs — Terms, pricing/fees, privacy policy signed
5. **Verification engines fire** — e-verification, screening, connection checks, rule checks
6. **Document submission** — Identity verification + selfie, proof of address, proof of company address, proof of company activity, company structure (not required for SPs). Each requirement has its own page; submitted items queue for review

**For unregistered businesses (shorter path):**
- No business details section
- Fewer document requirements
- No company structure / company address proof

### Stage 5: Review & Approval

- Customer waits (returns to showroom with no CTA)
- Documents may be rejected → customer must resubmit (loop back)
- Additional info may be requested
- **Approval** → customer gains full My Account access
- **Rejection/Block** → customer is denied

---

## Key Metrics to Track

| Metric | What It Measures | Notes |
|--------|-----------------|-------|
| **Conversion rate** | Registration start → approved account | CLM is intentionally lower than Four Step due to upfront verification. Compare within cohorts, not across systems |
| **FFT (First Financial Transaction)** | Time/rate to first real transaction after approval | The ultimate activation metric |
| **Drop-off by step** | Where customers abandon the funnel | Expect heavy drop-off at document submission (Stage 4) |
| **Blocked rate** | Customers blocked during verification | Higher in CLM (early detection) vs. Four Step (late detection) |
| **Resubmission rate** | Documents rejected → customer resubmits | Indicates document quality / instruction clarity |
| **Revenue per approved customer** | Post-approval revenue | CLM-approved customers show significantly higher revenue |
| **Country tier performance** | Conversion and approval by country grouping | Rollout % varies by tier; vendor performance varies significantly by country |

---

## Known Drop-Off Drivers

| Where | Why |
|-------|-----|
| **Email verification** | Friction from switching to email to get the code |
| **Business type question** | Confusion about "registered" vs. "unregistered" — some customers don't know |
| **Country selection** | Country is locked after this point; mistakes require re-registration with a new email |
| **Showroom → KYC** | Customer sees the lobby page and doesn't proceed to the heavier KYC steps |
| **Document submission** | Most significant drop-off — the list of requirements can feel overwhelming (worst case shows 5+ document types) |
| **Document rejection loop** | Customers who need to resubmit may give up |
| **Contact Us wall** | Pre-T&C customers can't access customer support — if they're stuck, there's no help channel |

---

## Experiments Affecting Data

Active experiments may create variant cohorts in the data:

- **Gated access / free trial** — Testing whether restricting access or offering a trial impacts conversion and downstream revenue
- **Upfront payment** — Asking for credit card payment for the plan during onboarding
- **Streamlined ID verification** — Replacing manual data entry with OCR-based ID capture + selfie (fewer steps)
- **eKYB** — Auto-pulling business details from registries using BRN (fewer manual fields for registered businesses)
- **WhatsApp outreach** — Proactive contact for high-potential customers during onboarding

When analyzing conversion, check if the cohort is part of an experiment — these intentionally introduce or remove friction.

---

## Terminology Quick Reference

| Term | Meaning |
|------|---------|
| **CLM** | Customer Lifecycle Management — the new onboarding system |
| **Sign-Up / Quick Registration / Quick Reg / QR** | The first phase of onboarding — these terms are used interchangeably |
| **Four Step** | Legacy registration (being replaced) |
| **D2P** | Direct to Payoneer — self-service registration via payoneer.com |
| **FFT** | First Financial Transaction — a transaction attempt (incoming or outgoing, not necessarily successful). Applies to both payers and receivers |
| **FTL** | First Time Load — funds successfully loaded to the account balance. Successful incoming payments only |
| **KYC** | Know Your Customer — individual identity verification |
| **KYB** | Know Your Business — business verification |
| **eKYB** | Electronic KYB — automated registry lookup |
| **UBO** | Ultimate Beneficial Owner |
| **BRN / EIN** | Business Registration Number / Employer ID Number |
| **Receiver** | Primary customer type — can receive/send funds, holds a balance |
| **Payer** | Limited type — can only pay invoices, no balance |
| **Individual** | Internal label for unregistered business |
| **Company** | Internal label for registered business |
| **Sole Proprietor (SP)** | Sub-type of Company — registered business with a single owner. Skips business structure and UBO requirements |
| **AR (Account Representative)** | The person who operates the Payoneer account. For Companies, the AR undergoes the same KYC as Individuals (compliance requirement) |
| **Info & Documents / Account Setup / Account Activation** | The KYC/KYB phase of onboarding — these terms are used interchangeably. Starts after the customer completes segmentation and chooses to proceed |
| **Light Plan** | Limited plan for marketplace-only customers |
| **Regular Plan** | Full-capability plan |
| **Showroom** | Lobby page between segmentation and KYC |
| **GBT** | Global Bank Transfer — partner pass-through flow |
| **ICP** | Ideal Customer Profile |
| **T&Cs** | Terms and Conditions |
| **UTM attribution timing** | `utm_registration_source` is only populated after the customer signs T&Cs. Customers who dropped before T&Cs appear as "Unknown Channel." This is a data artifact — do NOT interpret "Unknown Channel" as low-quality traffic or use it to filter "clean" cohorts |
| **BVD** | Vendor for eKYB |
