---
summary: Step-by-step CLM D2P onboarding flow — fields collected, UX pain points, communication triggers per phase
topics: [clm-funnel, onboarding, customer-journey, ux, kyc]
agents: [analytics, hub-countries-pm, kyc-product-pm]
---

# CLM Customer Journey

> Detailed step-by-step breakdown of the CLM onboarding flow, including fields collected at each step, communications triggered, and known UX considerations.
> This file covers the **D2P Receiver** flow — the primary CLM onboarding path.

---

## Phase 1: Sign-Up (Quick Registration / QR)

The sign-up phase creates an account holder record. After completing this phase, the customer has credentials but is **not yet a Payoneer customer** — no T&Cs have been signed.

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **Entry point** | "Get Started" / "Register" button on any Payoneer web page or landing page | — | Traffic is split here: a percentage goes to CLM, the rest to Four Step |
| **Intent selection** | "Why do you want to join Payoneer?" — _Get paid, send payments and more_ vs. _Only pay_ | Receiver or Payer intent | CLM currently handles receivers only. "Only pay" routes to legacy payer registration |
| **Email** | Email input field | Email address | Checked against existing accounts — if email exists, customer is prompted to log in |
| **Email verification** | "Enter the 6-digit code we sent to your email" | Verified email | — |
| **Business type** | "Is your business registered?" — Yes / No | Individual (unregistered) or Company (registered) | This is a critical branching point — determines the entire KYC path downstream |
| **Name / Business name** | If unregistered → first name + last name. If registered → legal business name | Name or business name | Business name is editable later during account setup — commitment is low at this point, so customers may enter DBA instead of legal name |
| **Country** | If unregistered → "Where do you live?" If registered → "Where is your business registered?" | Country | **Locked after this point.** Country determines the license and the entire downstream flow. Mistakes require re-registration with a new email |
| **Phone number** | Phone input + verification method selection | Phone number | Verification via SMS, call, or WhatsApp |
| **Phone verification** | Enter code received via selected method | Verified phone | WhatsApp was recently added as a verification channel |
| **Password** | Create password | Password | Account credentials are now complete |
| **Marketing opt-in** | Checkbox for marketing communications | Consent | Placement may move to the start of the process (under discussion) |

### Communications triggered during Sign-Up:
- Email verification code (6-digit code)
- Phone verification code (SMS / call / WhatsApp)

---

## Phase 2: Segmentation

Purpose: Understand the customer's persona for sales qualification, plan assignment, and routing.

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **Industry** | "What does your business do?" — single-select dropdown | Industry category | — |
| **Source of funds** | "How will you use Payoneer?" — Marketplace/platform payments, B2B, or checkout solution | Source of funds | Determines follow-up questions and plan assignment |
| **Which marketplace(s)** | "Which marketplace(s) do you sell on?" — multi-select | Selected marketplaces | Only shown if source = marketplace. Marketplace selection determines Light vs. Regular plan |
| **Expected number of payments** | "How many payments do you expect to receive/send?" | Payment volume band | "None yet" option available — skips the volume question |
| **Expected monthly volume** | "What is your expected monthly volume?" | Revenue band | Skipped if "None yet" was selected above |

**Plan assignment logic**: If the customer's sole source of funds is marketplace payments from marketplaces tagged as "light account" → **Light Plan**. Otherwise → **Regular Plan**.

### Communications triggered during Segmentation:
- None

---

## Phase 3: Showroom

After segmentation, customers land in a **Showroom** — a static lobby page that serves as a holding state before KYC.

- Two versions exist: **Light** and **Regular** — to avoid advertising services the customer won't have access to
- No services are available at this point
- The customer's call-to-action is to proceed to account setup (Info & Documents)

> **Upcoming change**: The showroom is being replaced with the actual My Account interface to give customers a stronger sense of value, even though services remain locked until approval.

### Communications triggered at Showroom:
- None (may receive a nudge email if they don't proceed — TBD)

---

## Phase 4: Info & Documents (Account Setup / Account Activation)

This phase begins after the customer completes segmentation and **chooses to proceed** to account setup. This is the KYC/KYB phase. The path varies significantly based on whether the customer is an Individual or Company.

### 4A: Business Details (Company only)

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **Business type** | "What type of business?" — Sole proprietorship, public company, partnership, etc. | Business entity type | **Sole Proprietors (SPs)** are a special case: they follow the Company path but skip business structure and UBO requirements (one-person business) |
| **Business name** | Legal name + DBA (if different) | Legal business name, DBA | Customer may update the name they provided during sign-up |
| **Online presence** | "What is your business website?" | URL (website, LinkedIn, etc.) | If "I don't have a website" → warning message about potential friction later (will need to prove business activity via contract/invoice instead) |
| **Business activity region** | "In which region does most of your business activity take place?" | Region | Compliance question — no wrong answers |
| **Business address** | Registered business address (country field is locked) | Full address | Country was locked during sign-up and cannot be changed |
| **Business ID** | Business registration number (BRN, EIN, etc.) + date of registration/incorporation | BRN/EIN, incorporation date | Field labels vary by country |

### 4B: Account Representative / Personal Details (All customers)

Every onboarding requires full KYC of the person who will operate the Payoneer account — the **Account Representative (AR)**. For Individuals, this is the customer themselves. For Companies, the AR is the designated person who will manage the account. The same KYC is performed on ARs as on Individuals — this is a compliance requirement.

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **Personal info** (AR details) | First name, last name, date of birth, nationality | Personal details | For Companies: labeled as "Authorized Representative" in the UI |
| **Residential address** (AR address) | Home address | Full address | — |
| **ID details** (AR ID) | Dynamic form based on country — supported document types (passport, national ID, driving license) with relevant fields | ID type + details | Allowed document types and required fields vary by country |

### 4C: Bank Account (All customers)

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **Bank account type** | Personal or business account | Account type | Registered businesses can add a personal bank account as long as it belongs to one of the UBOs (exception: Japan). Unregistered businesses use personal accounts by default |
| **Bank country & currency** | Country and currency selection | Bank country, currency | — |
| **Bank details** | Dynamic fields calculated based on country + currency | Bank-specific fields (IBAN, SWIFT, routing number, etc.) | Component owned by the Money Movement team, hosted in CLM |

### 4D: Terms & Conditions

| Step | What the customer sees | What is collected | Notes |
|------|----------------------|-------------------|-------|
| **T&Cs** | Terms and Conditions, pricing/fees schedule, privacy policy | Signed consent | Placed before document submission to enable background verification engines to fire while the customer works on documents |

**After T&Cs are signed**: Verification engines run in the background — e-verification, connection checks, screening, rule checks. This determines whether to proceed with the customer.

### 4E: Document Submission

Requirements vary by customer type and verification results. Documents may include:

| Requirement | Who needs it | Details |
|------------|-------------|---------|
| **Identity verification** | All | ID document capture + selfie |
| **Proof of address** | All (varies by country) | Utility bill, bank statement, etc. |
| **Proof of company address** | Company (not SP) | — |
| **Proof of company activity** | Company (not SP) | Business license, registration certificate, etc. |
| **Company structure** | Company (not SP) | UBO documentation, ownership structure |

Each requirement has its own page with:
- Instructions on what to submit
- Supported document types
- Issuance timeframe requirements (e.g., "issued within the last 3 months")
- Visual examples where applicable

Submitted items move to the bottom of the list. Customer submits one by one until all requirements are complete.

### Communications triggered during Info & Documents:
- TBD — to be mapped from Miro communication flow

---

## Phase 5: Review & Approval

After submitting all documents, the customer returns to the showroom with no call-to-action — they are waiting for Payoneer's review.

| Outcome | What happens | Communication |
|---------|-------------|---------------|
| **Document rejected** | Customer is notified and must resubmit the specific document | Email notification with rejection reason |
| **Additional info needed** | Customer is contacted for supplementary information | Email notification |
| **Approved** | Customer gains access to the full My Account | Approval email |
| **Rejected / Blocked** | Account is denied | Rejection email |

### Communications triggered during Review:
- Document rejection notification (per rejected document)
- Additional information request
- Approval notification
- Rejection notification

---

## Known UX Pain Points

| Issue | Where in the journey | Details |
|-------|---------------------|---------|
| **Country lock** | Sign-Up → Country step | Customers cannot change their country after sign-up — they must re-register with a different email. Reason: country determines license, and changing it mid-flow would invalidate the entire process |
| **Contact Us wall** | Any point before T&Cs | Pre-T&C customers are not eligible for customer support. They can email via the website, but the experience feels like a "dead end" |
| **Fragmented process** | Between Phases 4D and 4E | Info collection → T&Cs → verification → documents is split into phases for technical reasons (platform limitations), not UX reasons. Streamlining is ongoing |
| **Document overwhelm** | Phase 4E | The full list of requirements (worst case 5+ items) can feel overwhelming, causing drop-off |
| **Resubmission fatigue** | Phase 5 → loop back to 4E | Customers whose documents are rejected may give up rather than resubmit |

---

## Communication Strategy

- **Minimalistic by design** — customer feedback showed Payoneer users felt "bombarded" by communications overall
- Goal: every email from Payoneer during onboarding must be genuinely important
- The communication overload is primarily a cross-domain issue — at least 6 different teams/systems trigger communications to the same customer
- Payments-related notifications are the top complaint area overall ("10 payments = 40 emails")
- Full communication mapping maintained in Miro

---

## Related Files

| File | What it covers |
|------|---------------|
| **`CLM-Domain-Overview.md`** | High-level domain context — what CLM is, team structure, onboarding flows, rollout status |
| **`data/CLM-Data-Context.md`** | Analytical context — segments, metrics, drop-off drivers for data analysis |
| **`kyc/`** | Detailed KYC/KYB documentation (maintained by Elad's team) |
