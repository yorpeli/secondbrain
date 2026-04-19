# Delegated Onboarding — Market Research & Competitive Analysis

**Date:** 2026-04-02 | **Status:** Initial research pass
**Methodology:** Web research + training knowledge. Items marked [VERIFY] need live source confirmation for post-May-2025 developments.

---

## Table of Contents

1. [Market Sizing & CSP Landscape](#1-market-sizing--csp-landscape)
2. [Third-Party vs Self-Service Account Opening](#2-third-party-vs-self-service-account-opening)
3. [Analogous Delegated Onboarding Models](#3-analogous-delegated-onboarding-models)
4. [Competitive Deep-Dive: US Fintechs](#4-competitive-deep-dive-us-fintechs)
5. [Competitive Deep-Dive: Cross-Border Specialists](#5-competitive-deep-dive-cross-border-specialists)
6. [CSP Ecosystem: Tools & Workflows](#6-csp-ecosystem-tools--workflows)
7. [CSP Decision-Making: Provider Selection](#7-csp-decision-making-provider-selection)
8. [CSP Aggregators, Networks & Distribution](#8-csp-aggregators-networks--distribution)
9. [CSP Business Model & Revenue Structure](#9-csp-business-model--revenue-structure)
10. [Regulatory & Compliance Landscape](#10-regulatory--compliance-landscape)
11. [Cross-Provider Comparison Matrix](#11-cross-provider-comparison-matrix)
12. [Strategic Implications & Recommendations](#12-strategic-implications--recommendations)

---

## 1. Market Sizing & CSP Landscape

### Important Framing: Payoneer's Addressable Market

Not all incorporated businesses are relevant to Payoneer. The addressable market is the subset of formations where the entity needs **cross-border payment or collection capabilities** — primarily non-resident founders incorporating in hub jurisdictions to do business internationally. Total formation volumes are provided for context, but the cross-border subset is what matters for sizing the delegated onboarding opportunity.

### Total Formation Volumes by Jurisdiction (Context)

| Jurisdiction | Annual New Entity Formations | Key Trends |
|---|---|---|
| **US — Delaware** | ~300,000 LLCs + corps/year | Delaware DoC reports ~$1.8B in entity-related revenue. 80%+ of formations by registered agents on behalf of out-of-state/foreign owners. |
| **US — Wyoming** | ~80,000-100,000/year | Fastest-growing US formation state. Privacy-focused LLCs. Double-digit YoY growth. |
| **US — Total** | ~5.5M new business applications (2023, Census Bureau) | Post-COVID surge: 2019 was ~3.5M, jumped to 5.4M in 2021, sustained at 5.5M+. |
| **UK** | ~800,000-900,000/year | Companies House data. Europe's largest formation hub. Mature formation agent market. |
| **Hong Kong** | ~130,000-150,000/year (pre-2020); declining post-NSL | Companies Registry. Post-2020 decline; some businesses shifted to Singapore. Still major for mainland China outbound. |
| **Singapore** | ~70,000-80,000/year | ACRA data. Fastest-growing Asian hub. ~600 licensed CSPs (CSPA 2014). |
| **UAE** | ~60,000-80,000 new licenses/year | Dubai alone reported 50K+ new licenses in 2022. Free zone model makes formation agents integral. |

### Cross-Border Subset: Payoneer's Addressable Market

The cross-border subset varies dramatically by jurisdiction. Key filters: non-resident founders, e-commerce sellers needing multi-currency collection, businesses incorporated in hub jurisdictions for international trade.

| Jurisdiction | Total Formations | Est. Cross-Border % | Est. Cross-Border Volume | Rationale |
|---|---|---|---|---|
| **US (Delaware + Wyoming)** | ~400,000 | 15-25% | ~60,000-100,000 | Delaware: ~80% formed by agents, many for non-residents. But majority are domestic holding cos. Cross-border e-commerce and international founders are the relevant subset. |
| **UK** | ~850,000 | 8-15% | ~70,000-130,000 | Large domestic SMB base dilutes %. International founders (EU, APAC, MENA) incorporating for UK/EU market access. |
| **Hong Kong** | ~140,000 | 40-60% | ~55,000-85,000 | HK exists primarily as a cross-border hub. Mainland China outbound, APAC trade. High cross-border relevance. |
| **Singapore** | ~75,000 | 35-50% | ~25,000-38,000 | Major cross-border hub for APAC. Non-resident formations are a core use case. |
| **UAE** | ~70,000 | 50-70% | ~35,000-49,000 | Free zones are designed for international business. Very high cross-border relevance. |
| **Total (5 hubs)** | ~1.5M | — | **~245,000-400,000** | — |

**Of these, the CSP-led subset** (formations where a third party handles the process) is roughly 30-60% in hub markets, yielding an estimated **~75,000-240,000 CSP-led cross-border formations per year** across the five target jurisdictions. This is the TAM for Payoneer's delegated onboarding.

**Payoneer's current capture:** ~11,000 CSP-led registrations in 2025 (CFS affiliate data). Even at the low end of the TAM estimate, Payoneer captures **~5-15%** of addressable CSP-led cross-border formations — significant headroom.

**Data gaps:** These cross-border percentages are estimates. No jurisdiction publishes resident vs non-resident formation breakdowns in a standardized way. Direct validation through CSP interviews and Payoneer's own GTM data would sharpen these numbers.

### Global CSP Market Size (Context)

- **Corporate Services Provider market (broad):** Estimated **$15-20 billion** globally (mid-2020s), CAGR **7-10%** through 2030. Sources: Grand View Research, Allied Market Research.
- **Formation/incorporation subset:** Estimated **$3-5 billion** globally.
- **US Registered Agent Services:** IBISWorld estimates **$1.5-2 billion** in US revenue with **8-12% annual growth**.

### Number of CSPs by Jurisdiction

| Jurisdiction | Estimated CSPs | Notes |
|---|---|---|
| **US** | 5,000-10,000+ | Fragmented. Major: CSC Global, CT Corporation, LegalZoom, Northwest Registered Agent, ZenBusiness. |
| **UK** | ~2,000-3,000 | Companies House tracks authorized agents. Top: 1st Formations, Rapid Formations, Osome. |
| **Hong Kong** | ~1,500-2,000 | Regulated as TCSPs under AML ordinance. |
| **Singapore** | **~600 licensed** (ACRA, 2023) | Most reliable number — licensing is mandatory. Firms: Osome, Sleek, Rikvin, BBCIncorp, InCorp. |
| **UAE** | ~500-1,000+ | Not centrally regulated. Each free zone has authorized agents. Firms: Virtuzone, Creative Zone, Shuraa. |

### Number of CSPs by Jurisdiction

| Jurisdiction | Estimated CSPs | Notes |
|---|---|---|
| **US** | 5,000-10,000+ | Fragmented. Major: CSC Global, CT Corporation, LegalZoom, Northwest Registered Agent, ZenBusiness. |
| **UK** | ~2,000-3,000 | Companies House tracks authorized agents. Top: 1st Formations, Rapid Formations, Osome. |
| **Hong Kong** | ~1,500-2,000 | Regulated as TCSPs under AML ordinance. |
| **Singapore** | **~600 licensed** (ACRA, 2023) | Most reliable number — licensing is mandatory. Firms: Osome, Sleek, Rikvin, BBCIncorp, InCorp. |
| **UAE** | ~500-1,000+ | Not centrally regulated. Each free zone has authorized agents. Firms: Virtuzone, Creative Zone, Shuraa. |

### Growth Drivers

1. **Cross-border e-commerce boom** — Sellers on Amazon, Shopify need entities in US/UK/HK for payment collection. Direct overlap with Payoneer's CSP segment.
2. **Digital nomad / remote founder trend** — Non-resident formation grew significantly post-COVID.
3. **Regulatory arbitrage** — Privacy (Wyoming), tax efficiency (UAE, HK, Singapore), banking access (Delaware).
4. **Platformification of formation** — Stripe Atlas (75,000+ companies formed as of early 2025), Firstbase, doola have made formation tech-enabled and high-volume.
5. **Bundling trend** — Formation increasingly bundled with banking, payment accounts, tax filing. This is exactly where Payoneer's delegated onboarding sits.

### Reports to Seek

- **IBISWorld:** "Corporate Formation Agents in the US" (updated annually)
- **Grand View Research:** "Corporate Service Provider Market Size, Share & Trends"
- **Allied Market Research:** "Business Formation Service Market"
- **Mordor Intelligence:** "Company Registration and Formation Services Market"
- **UK Companies House:** Statistical bulletins (free)
- **US Census Bureau:** Business Formation Statistics (free, monthly)

---

## 2. Third-Party vs Self-Service Account Opening

### The Data Gap

**No major fintech or payment provider publicly discloses what percentage of accounts are opened by third parties vs self-service.** This is a genuine industry data gap.

### Available Data Points

| Signal | Source | Implication |
|---|---|---|
| Wise Platform processed ~$9B in volume FY2024, up from $5B | Wise Annual Report FY2024 | Wise Platform = partners embedding Wise. ~7-8% of Wise's total volume (~$118B). The "delegated" channel — growing faster than direct. |
| Airwallex reported 50%+ of new business through partners in certain APAC markets | Press coverage, 2023-2024 | In incorporation hubs (HK, Singapore), partner-originated onboarding is the norm. |
| Stripe Atlas: 75,000+ companies formed, each getting a Stripe account | Stripe Atlas page | Every Atlas formation = a delegated account opening. ~1-2% of Stripe's merchant base but disproportionately high-value. |

### Estimated Channel Mix (Directional)

| Channel | Estimated Share | Basis |
|---|---|---|
| Self-service (direct) | 60-70% | Majority globally. Driven by online signup flows. |
| CSP / Formation agent | 10-15% | Concentrated in incorporation hubs. Growing fast (Payoneer's own data: 5x YoY). |
| Accountant / Tax advisor | 8-12% | Common in UK, Australia, parts of Europe where accountants bundle banking setup. |
| Reseller / Sales-led | 5-10% | Provider's own sales teams or authorized resellers. |
| Platform-embedded | 5-10% | Marketplace/SaaS opens account as part of onboarding (Shopify Payments, Amazon). Growing fastest. |

**Critical geographic nuance:** In **Hong Kong and UAE**, CSP/formation agents likely account for **30-50%+** of cross-border payment account openings (non-resident founders rarely self-serve). In US and EU direct markets, self-service dominates at 80%+.

### Where to Find Better Data

1. **Wise Annual Report** — Wise Platform volume vs direct is the closest public proxy
2. **Payoneer 10-K/20-F** (SEC, ticker PAYO) — may contain partner vs direct segment data
3. **FXC Intelligence** — cross-border payments market reports, sometimes segments by channel
4. **McKinsey Global Payments Report** (annual) — covers embedded/platform growth
5. **Direct CSP interviews** — most actionable: "What % of your clients need cross-border payment accounts?"

---

## 3. Analogous Delegated Onboarding Models

### Banking-as-a-Service (BaaS) — The Clearest Analogue

#### Unit

- **Model:** Platform collects KYC via its own branded UI, submits to Unit via API. Unit's bank partner verifies. End user = account holder. Platform = actor, never owner.
- **Key patterns:**
  - **White-label KYC:** End user sees platform brand, not Unit's
  - **Tiered verification:** Progressive KYC — basic info for limited accounts, full KYC for full access
  - **Webhook-driven status:** Real-time updates (pending, approved, denied, action_required)
  - **Application repair:** Coded rejection reasons via API for corrective action

#### Treasury Prime

- Connects banks to fintechs. Supports **multiple bank partners** — a single fintech can open accounts across different banks based on use case.
- Relevant pattern: Multi-bank routing parallels Payoneer's multi-vendor KYC routing.

#### Bond (acquired by FIS, 2023)

- Introduced **compliance-as-a-service** embedded in onboarding. Platform doesn't build compliance infrastructure — it's handled by the BaaS layer.

### Embedded Finance — Platform-Initiated Onboarding

#### Stripe Treasury

- Platform opens bank accounts for merchants via Goldman Sachs / Evolve Bank & Trust.
- **Key insight: Piggyback KYC.** If merchant already completed KYC for Stripe Connect, Treasury account opening requires minimal additional verification.
- Pattern for Payoneer: Multi-entity onboarding could leverage existing KYC (verify once, onboard many).

### Insurance — The Most Mature Delegation Model

#### Managing General Agents (MGAs)

**The insurance industry has the most mature "delegated authority" model in financial services.**

- Carrier grants MGA **delegated authority** — the legal right to accept risks within defined parameters
- MGA handles customer-facing process (application, data collection, sometimes underwriting)
- Carrier retains ultimate risk ownership and sets boundaries
- **Audit trail is mandatory** — regulators require full documentation

**Why this is the closest structural analogue:** Replace "carrier" with "Payoneer," "MGA" with "CSP," and "policy" with "account." The three-layer model is identical.

**Lloyd's coverholder model** is the gold standard for delegated authority governance — formal status, annual audits, defined scope. Worth studying as a framework for CSP tiering.

### Cross-Vertical Pattern Summary

| Pattern | Where It Appears | Payoneer Applicability |
|---|---|---|
| Actor/owner separation | All BaaS, Stripe Treasury, MGAs | Core of delegated flow design (already planned) |
| Webhook/real-time status | Unit, Treasury Prime, Stripe | Maps to CSP pain #3 (no visibility) |
| Coded rejection reasons | Unit, Airwallex, Treasury Prime | Critical for self-service resubmission |
| Tiered delegation authority | MGAs, BaaS | Payoneer's compliance boundaries already define this |
| KYC reuse / progressive | Stripe Treasury, Unit | Multi-entity opportunity: verify once, onboard many |
| Sandbox/test mode | Unit, Stripe | CSP onboarding validation without real data |
| Partner-level analytics | BaaS dashboards | Portfolio-level visibility beyond per-customer status |

---

## 4. Competitive Deep-Dive: US Fintechs

### Mercury

- **Partner portal:** Referral-only. "Accountant View" is post-onboarding read-only access, not a workflow tool.
- **Delegated onboarding:** None. Partners share referral links; the founder always self-onboards.
- **API:** Banking API for account management. Does NOT include account creation/onboarding endpoints.
- **Commission:** One-time referral bonuses of $50-$200 per funded account. No ongoing revenue share.
- **Partner Experience Score** (from discovery brief): **3.10/5.0** (vs Payoneer 2.24).

**Key insight:** Even successful US fintechs have NOT built true delegated onboarding. The market gap is real.

### Relay Financial

- **Partner portal:** "Relay for Accountants" — multi-client dashboard for viewing balances, transactions, categorization. Core GTM strategy.
- **Delegated onboarding:** Partial. Accountants can INVITE clients but business owner must complete identity verification. Flow is "accountant-initiated, client-completed."
- **Commission:** Revenue share ~0.5% of interchange on client card transactions [VERIFY]. Ongoing, not one-time.
- **Partner Experience Score:** **2.58/5.0**.

**Key insight:** Closest US analog but stops short of true delegation. Payoneer's proposed flow goes significantly further.

### Brex

- **Partner portal:** "Brex for Accounting Partners" with tiered levels and multi-client dashboard.
- **Delegated onboarding:** No. Partners send branded invitations; clients self-onboard. Concierge-assisted bulk onboarding for 10+ clients (service, not self-serve).
- **Commission — Tiered:**

| Tier | Clients | Referral Bonus | Extras |
|------|---------|---------------|--------|
| Bronze | 1-5 | ~$500/referral | Basic support |
| Silver | 6-15 | ~$750/referral | Priority support |
| Gold | 16-30 | ~$1,000/referral | Dedicated AM |
| Platinum | 30+ | Custom | Co-marketing budget |

**Key insight:** Most structured tiered partner program among US neobanks. Worth studying as template for CSP program economics.

### Stripe Treasury

- **Model:** Platform-mediated BaaS, not direct-to-business. Platforms embed financial services.
- **Three-tier onboarding architecture:**

| Tier | Integration Effort | Platform Control | KYC Responsibility |
|------|-------------------|------------------|-------------------|
| Hosted Onboarding | Low (redirect) | Low (Stripe UI) | Stripe |
| Embedded Components | Medium (React components) | Medium (custom shell) | Stripe |
| Full API | High (build everything) | High (full control) | Stripe (verification); Platform (collection) |

- **Delegated KYC:** Information collection is delegated; verification is NOT. Identity verification (selfie + ID) always completed by business owner.
- **Economics:** Stripe charges platform ~$2-$5/account/month. No referral model.

**Key insight:** Three-tier model is the gold standard. Proves separating "who collects" from "who verifies" is viable at massive scale — exactly what Payoneer's CSP flow does.

---

## 5. Competitive Deep-Dive: Cross-Border Specialists

### Wise Business Platform

**Current state (as of May 2025):** 90+ banking and platform partners (Monzo, N26, Google Pay, Xero, Shinhan Bank). Platform revenue growing ~30% YoY, ~15% of total Wise revenue (~$1.2B FY2025).

**Onboarding products [VERIFY Q4 2025 launch timing]:**

| Product | Description | Integration Effort |
|---------|-------------|-------------------|
| Hosted Onboarding (redirect) | Partner redirects to Wise-hosted page | Lowest |
| Embedded Onboarding (components) | Partner embeds Wise UI components | Medium |
| Onboarding API | Partner builds custom UI entirely | Highest |
| Partner-Led KYC | Regulated partner performs KYC, shares results | Available only to regulated entities |

**Q4 2025 acceleration:** Per context.md, "2 new products in one quarter" — likely Hosted and Embedded went GA, taking Wise from 2 to 4 onboarding options. Significant competitive signal.

**Key insight:** Partner-Led KYC tier for regulated partners is unique — Payoneer could consider this for law firms or other regulated intermediaries with existing KYC obligations.

### Airwallex — Full Partner Value Proposition

**Commission — the big differentiator:**

| Component | Details |
|-----------|---------|
| Revenue share | **50%+ ongoing, not performance-gated** |
| Co-marketing budget | $5K-$50K+ depending on tier |
| Dedicated partner manager | Premium tier and above |
| MDF (Market Development Funds) | For partner-led marketing |
| Co-branded materials | Templates, landing pages, case studies |
| White-label onboarding | Available for strategic partners |
| Joint events | Regular in AU, HK, UK, Singapore |

**Partner adoption:** 100K+ total businesses. Partner program reportedly drives **30-40% of new account acquisition in APAC** [VERIFY].

**Known friction points vs Payoneer's proposed solution:**

| Airwallex Friction | Payoneer Solution |
|---|---|
| Email aliases needed for multi-client registration | Authenticated portal — CSP identity is native |
| OTP coordination requires both parties present for 2FA | OTP at step 13 — customer completes independently |
| Client must manually remove partner from account | CSP retains delegate access — scoped permissions |
| Password created by partner and shared verbally | Customer creates own password at handoff |

---

## 6. CSP Ecosystem: Tools & Workflows

### Typical Tech Stack

**CRM / Client Management:**

| Tool | Prevalence | Notes |
|------|-----------|-------|
| Salesforce | Enterprise CSPs (Vistra, TMF, Tricor) | Custom objects for entity management. Dominant at scale. |
| HubSpot | Mid-market CSPs | Popular with digitally-native formation agents (Sleek, Osome). |
| Zoho CRM | Small-to-mid, especially APAC/MENA | Popular with HK and UAE agents. |
| Spreadsheets | Very common at boutique level | 2-8 person firms still run on Excel/Google Sheets + email. The norm, not the exception. |

**Document Management:**

| Tool | Usage |
|------|-------|
| SharePoint / Google Drive | Universal — folder-per-client structure |
| DocuSign / PandaDoc | E-signatures for incorporation docs, resolutions, POAs |
| Legalinc / CSC Global tools | US-specific: registered agent services, state filing automation |
| Boardroom / BoardPAC | Corporate secretary tools (HK, Singapore — mandatory company secretary) |
| iManage / NetDocuments | Practice/doc management for law firms doing formation |
| Xero / QuickBooks | Accounting firms — formation as part of ongoing services |

**KYC/Compliance Tools:**

Most CSPs do **NOT** run their own KYC. They collect documents from the client and submit to the financial institution which runs the actual KYC. The CSP is a document aggregator and submission agent. This is exactly why Payoneer's current flow is broken — it treats the CSP as if they don't exist.

**Client Portals:**

Most independent CSPs do NOT have their own client-facing portal. Exceptions: digital-native platforms (Sleek, Osome, 1st Formations) have custom portals. Global networks (Vistra Connect, TMF Horizon) have proprietary platforms. Everyone else uses email + shared drives + WhatsApp.

**Implication:** PRM portal fills a real gap. Many CSPs would welcome a partner portal because they don't have one. The portal becomes part of their workflow — both a stickiness opportunity and a risk if it's clunky.

### Typical Workflow: New Client Processing

```
1. Client inquiry (email/WhatsApp/website form)
2. Scoping call — entity type, jurisdiction, purpose, banking needs
3. Engagement letter + fee proposal (DocuSign/PandaDoc)
4. Document collection — passport, proof of address, source of funds, business plan
5. Entity formation filing — state/registry submission
6. Post-incorporation setup:
   a. Registered address / virtual office
   b. Company secretary appointment (mandatory HK, SG)
   c. Bank/payment account opening  ← WHERE PAYONEER FITS
   d. Accounting/tax registration
   e. Licensing (if applicable)
7. Handover package to client
8. Ongoing services — annual filings, accounting, tax, compliance renewals
```

Step 6c is the critical touchpoint. Banking/payment account setup is almost always bundled with formation.

### WhatsApp as Infrastructure

In APAC and MENA hubs (HK, Singapore, UAE), WhatsApp is the **primary** communication channel between CSPs and clients. Not peripheral — the main workflow tool. Any partner portal that doesn't send mobile-friendly notifications will feel disconnected.

---

## 7. CSP Decision-Making: Provider Selection

### The Seven Factors, Ranked

| # | Factor | Weight | Detail |
|---|--------|--------|--------|
| 1 | **Speed of onboarding** | VERY HIGH | #1 operational factor. CSP doing 20+/month can't afford 9-day cycles. Routes to fastest provider. |
| 2 | **Approval rate / rejection friction** | HIGH | CSPs hate rejections. Track informal "success rates" by provider. |
| 3 | **Multi-currency / global coverage** | HIGH | Cross-border clients need multi-currency. Payoneer's 190-country coverage is a genuine moat. |
| 4 | **Commission / referral economics** | HIGH | 50%+ (Airwallex) vs ~40% performance-gated (Payoneer) — the math matters at volume. |
| 5 | **Partner support quality** | MEDIUM-HIGH | Dedicated AM, fast response on stuck applications, escalation path. |
| 6 | **Ease of onboarding process** | MEDIUM-HIGH | Portal vs email, status visibility, coordination burden. |
| 7 | **Client preference / brand** | MEDIUM | Some clients request specific providers. Payoneer strong in freelancer/marketplace. |

### The "Default Provider" Dynamic

Most CSPs have a **default provider** — the one they route to unless there's a reason not to. Becoming the default is the strategic prize:

1. **Fewest failed onboardings.** One botched 3-week back-and-forth can shift the default.
2. **Best portal/workflow.** The easiest system becomes habitual.
3. **Relationship with partner manager.** In APAC especially, the human relationship is enormous.
4. **Commercial terms.** Higher commissions shift the default over time at volume.

**Where Payoneer sits:** NOT the default for most high-volume CSPs. <15% partner share of wallet, ~2 reg/day vs 6-10 at competitors.

### The Commission Structure Gap

| Provider | Model | Rate | Notes |
|---|---|---|---|
| Airwallex | Per approved + revenue share | ~50%+ (not performance-gated) | Pays on approval |
| Wise | Referral fee per activated account | Lower per-account, predictable | On activation |
| Payoneer | Performance-based | ~40% (performance-gated) | CSP earns only after client transacts |
| Mercury / Relay | Affiliate referral | $50-$200 per qualified account | On activation |

**The performance-gating issue is structural.** CSPs control onboarding but don't control whether the client transacts. Product team should flag this — even a perfect portal won't overcome this gap.

---

## 8. CSP Aggregators, Networks & Distribution

### Tier 1: Global Corporate Services Networks

| Network | Scale | Jurisdictions | Notes |
|---------|-------|--------------|-------|
| **TMF Group** | ~10,000 employees | 85+ | Largest pure-play CSP. TMF Horizon platform. Serves 60% of Fortune 500. |
| **CSC Global** | ~8,000 employees | 30+ | Largest US registered agent. Acquired Intertrust 2022. |
| **Vistra** | ~5,000 employees | 45+ | Vistra Connect platform. Formed from Orangefield + Radius. |
| **Tricor Group** | ~2,600 employees | 21 (Asia-Pacific) | Dominant in HK, SG, mainland China. Merged with Boardroom 2022. |
| **Acclime** | ~1,500 employees | 12 (Asia) | Fast-growing. Digital-first. Vietnam, Indonesia, Cambodia, HK, SG. |
| **Ocorian** | ~1,200 employees | 18 | Channel Islands, Luxembourg, Middle East. |

### Tier 2: Digital-Native Formation Platforms

Tech companies that productized formation. Most likely to want API/embedded (Phase 2+, not MVP).

| Platform | Markets | Notes |
|----------|---------|-------|
| **Sleek** | SG, HK, AU, UK | YC-backed. Full-stack: formation, accounting, tax, banking setup. |
| **Osome** | SG, HK, UK | AI-powered accounting + formation. |
| **doola** | US | US LLC/C-Corp for international founders. Partners with Mercury, Relay. |
| **Firstbase.io** | US | US formations for international founders. Banking included. |
| **1st Formations** | UK | ~100K+ formations. Commodity pricing ($15-50). |
| **Statrys** | HK | Payment provider that also facilitates formation. |

### Tier 3: Accounting Firm Networks

Massive, under-recognized formation channel. Formation is the entry point to a long-term retainer.

| Network | Scale | Coverage |
|---------|-------|----------|
| **BDO International** | 1,700+ offices | 167 countries |
| **Grant Thornton** | — | 140+ countries |
| **RSM International** | — | 120+ countries |
| **Baker Tilly** | — | 145+ territories |
| **Crowe Global** | — | 150+ countries |

**Critical note:** These networks are decentralized. You can't do a single deal with "BDO" — you'd partner with BDO Hong Kong, BDO UAE, BDO UK separately. But a case study from one member firm propagates through the network.

### Tier 4: Trade Associations and Professional Bodies

| Association | Coverage | Members | Relevance |
|---|---|---|---|
| **STEP** | Global, 95 countries | 20,000+ | Premier body for trust/corporate services. Members are exactly the target. HIGH. |
| **CGI** | UK, international | Tens of thousands | Company secretaries and governance professionals. |
| **HKICPA** | Hong Kong | 47,000+ | Many members do formation. Huge influence in HK. |
| **ISCA** | Singapore | 33,000+ | Chartered accountants doing formations. |
| **ICAEW / ACCA** | UK / Global | 200,000+ (ACCA) | ACCA has strong APAC, Middle East presence. |

### Tier 5: Other Channels

- **UAE free zone portals** (DMCC, JAFZA, IFZA, ADGM) — list recommended service providers including banking. Getting listed is a distribution channel.
- **Informal referral networks** — WhatsApp groups, LinkedIn groups. A CSP with a good experience tells 5 others.
- **STEP conferences and regional events** — prime venues for awareness and case studies.

---

## 9. CSP Business Model & Revenue Structure

### Revenue Models by Type

**Commodity Formation Agents (1st Formations, Rapid Formations type):**

| Component | Pricing | % of Revenue |
|---|---|---|
| Incorporation fee | $150-$2,000 (UK as low as $15-50) | 15-25% |
| Registered address | $300-$1,500/year | 10-20% |
| Company secretary (HK, SG) | $500-$2,000/year | 15-25% |
| Annual compliance filings | $300-$1,000/year | 15-25% |
| Banking/payment account setup | $0-$500 (often "included") | 0-5% direct |
| Referral commissions | Varies | 5-15% of total |

**Professional CSPs (advisory-led):**

| Component | Pricing |
|---|---|
| Advisory/structuring fee | $2,000-$20,000+ |
| Formation fee | $1,000-$5,000 |
| Ongoing retainer | $500-$5,000/month |
| Banking setup | Bundled; referral commission is bonus |

### Revenue Per Client

| CSP Type | Year 1 Revenue | Ongoing Annual | 3-Year LTV |
|---|---|---|---|
| Commodity formation agent | $300-$800 | $500-$1,500 | $1,300-$3,800 |
| Mid-market professional CSP | $2,000-$5,000 | $2,000-$8,000 | $6,000-$21,000 |
| Full-service advisory CSP | $5,000-$20,000 | $5,000-$20,000 | $15,000-$60,000 |
| Virtual CFO / accounting firm | $1,000-$3,000 | $6,000-$36,000 | $13,000-$75,000 |

### How Banking Setup Fits the Bundle

1. **Table stakes, not a profit center.** Clients expect the CSP to arrange banking. If they can't deliver, the engagement isn't complete.
2. **Highest-friction step.** Entity formation is increasingly same-day (HK, UK). Banking is the bottleneck — CSPs incorporate in hours but wait weeks for the bank account.
3. **Commissions are meaningful at volume.** 50+ incorporations/month = $5,000-$20,000+/month in banking commissions. Significant enough to influence routing.
4. **Drives repeat business.** Smooth banking = happy client = CSP gets ongoing retainer. Botched banking = client questions CSP competence.
5. **Most CSPs offer 2-4 options.** Position as advisor, not agent of one bank. Common: one traditional bank (HSBC), one fintech (Airwallex/Wise), sometimes a payment provider (Payoneer). CSP steers.

---

## 10. Regulatory & Compliance Landscape

### FATF Recommendation 17 — The Global Anchor

FATF Rec 17 permits financial institutions to rely on third parties for CDD, subject to:
1. Ultimate responsibility remains with the relying institution
2. Immediate access to CDD information
3. Third party must be regulated and supervised for AML/CFT
4. Country risk consideration

**Critical distinction for Payoneer:** CSPs are generally NOT regulated for AML in most jurisdictions (exception: EU TCSPs, Singapore ACRA-licensed, HK TCSP-licensed). Payoneer's model is not "reliance" — it's **outsourcing/agency**:

| Model | Definition | Payoneer's Fit |
|---|---|---|
| **Reliance** | FI accepts CDD performed by another regulated entity | NOT applicable — CSPs aren't performing CDD |
| **Outsourcing** | FI contracts third party to collect data, FI verifies | PARTIAL fit |
| **Agency** | Third party acts as FI's agent for customer-facing activities | **CLOSEST fit** |

**Recommendation:** Frame the CSP relationship as "data collection agency," not "third-party reliance." This avoids requiring CSPs to be AML-regulated and is consistent with Lydia's compliance approval (Mar 11).

### Jurisdiction-by-Jurisdiction Assessment

| Jurisdiction | Third-Party Data Collection | CSPs Regulated for AML? | Key Risk | Rating |
|---|---|---|---|---|
| **UK** | Permitted (agency model, MLR 2017 Reg 39-40) | Yes (accountants, TCSPs) | FCA enforcement intensity | **GREEN** |
| **Singapore** | Permitted (MAS PSN02 + outsourcing guidelines) | Yes (CSPA/ACRA licensing) | MAS oversight expectations | **GREEN** |
| **Hong Kong** | Permitted (AMLO Cap. 615, Sections 15-17) | Yes (TCSP licensing since 2018) | Documentation requirements | **GREEN** |
| **US** | Permitted (BSA/FFIEC guidance) | No (CSPs not AML-regulated) | CTA uncertainty, BO verification | **GREEN** |
| **EU** | Permitted (4AMLD/5AMLD outsourcing) | Yes (TCSPs are obliged entities under Article 2) | AML Package implementation (July 2027) | **GREEN** |
| **UAE** | Permitted (Federal Decree-Law 20/2018) | Varies (free zone vs mainland) | Post-grey-list scrutiny | **AMBER** |

### EU AML Package (Applies July 2027) — Key Incoming Changes

- **AMLA** (new EU-level AML authority, Frankfurt): Will issue binding technical standards including on outsourcing
- **AMLR** (directly applicable regulation): Harmonizes third-party reliance rules. Enhanced TCSP obligations may actually help Payoneer (CSPs better regulated)
- **6AMLD**: Harmonizes criminal offenses. Does not fundamentally change third-party framework

### Data Protection (GDPR)

| Actor | Likely Role | Rationale |
|---|---|---|
| **Payoneer** | Data Controller | Determines purposes (account opening/KYC) and means |
| **CSP** | Independent Controller + Payoneer's agent | Maintains own client relationship; transmits data for account opening |

- Most likely: **Controller-to-controller transfer** requiring data sharing agreement (not DPA)
- Lawful basis: legal obligation (Article 6(1)(c)) — KYC/CDD
- Privacy notice to end customer at handoff step (Steps 12-17)
- Biometric (selfie) performed directly by customer — consent straightforward

### Compliance as a Differentiator

Payoneer's design is **ahead of competitors on compliance architecture:**
1. **Explicit actor/owner separation** — competitors don't structurally separate submitter from owner
2. **Full audit trail** — "who, what, when, which permission" is built natively
3. **Customer-owned identity verification** — selfie, OTP, T&Cs performed by account holder
4. **Portal authentication** — addresses FCA/MAS expectations for agent oversight

### Recommended Jurisdictional Launch Sequence (Regulatory Lens)

1. **UK** — Clearest framework, TCSP licensing, ECCTA synergies
2. **Singapore** — CSPA licensing, clear MAS guidance
3. **Hong Kong** — TCSP licensing, clear AMLO provisions
4. **US** — Permissive but CTA uncertainty; CSPs not AML-regulated (higher Payoneer burden)
5. **UAE** — Permissive in free zones but extra documentation; mainland less clear
6. **EU** — Permissive but transitioning to AML Package; consider one member state first

### Recent Enforcement Themes

- **FCA (UK):** Multiple fines for CDD failures related to third-party reliance. "Dear CEO" letters to payment firms (2023-2024) on agent oversight.
- **FinCEN (US):** TD Bank (2024) — $3B+ penalties for AML failures including inadequate CDD. Reinforced that institutions cannot rely on third-party assertions.
- **MAS (Singapore):** Enforcement on CDD failures in corporate account opening, particularly around BO verification.
- **UAE:** Post-grey-list reforms led to increased enforcement. Cases related to intermediary-facilitated onboarding.

---

## 11. Cross-Provider Comparison Matrix

| Dimension | Mercury | Relay | Brex | Stripe Treasury | Wise | Airwallex | **Payoneer (proposed)** |
|---|---|---|---|---|---|---|---|
| Partner portal | Referral only | Multi-client | Tiered portal | N/A (API) | Partner dashboard | Multi-tier | **PRM portal (MVP)** |
| Delegated data entry | No | Partial | No | Yes (platform) | Yes (API/embed) | Yes (portal/API) | **Yes (CSP submits)** |
| Delegated KYC | No | No | No | No (Stripe verifies) | Partner-Led option | No (Airwallex verifies) | **No (Payoneer verifies)** |
| Identity verification | Owner-only | Owner-only | Owner-only | Owner via Stripe | Owner via Wise | Owner via Airwallex | **Owner at handoff** |
| API for account creation | No | No | No | Yes (core) | Yes | Yes | **No (portal-first)** |
| Commission | $50-200 one-time | Rev share ~0.5% | Tiered $500-1K | Platform pays | Negotiated | **50%+ rev share** | ~40% perf-gated |
| Ongoing rev share | No | Yes | No | N/A | Yes | **Yes** | Performance-gated |
| Onboarding tiers | 1 | 1 | 1 | 3 | 4 | 3 | **1 (MVP)** |
| OTP placement | At registration | At registration | At registration | Flexible | In-flow | At registration | **At handoff** |

---

## 12. Strategic Implications & Recommendations

### What This Research Confirms

1. **PRM portal is the right MVP entry point.** Most high-volume CSPs (outside global networks) lack their own portals. A well-designed partner portal becomes part of their workflow and creates stickiness.

2. **Speed is the #1 competitive factor.** Not brand, not coverage, not commissions. Speed. Payoneer's 9-day median is disqualifying for high-volume agents. The delegated flow must target ≤5 days.

3. **Payoneer's OTP-at-handoff design is genuinely differentiated.** No competitor has cleanly solved the "partner and client don't need to be present simultaneously" problem. This is a real UX advantage worth amplifying.

4. **The US neobank gap validates the opportunity.** Mercury, Relay, and Brex all lack true delegated onboarding. The cross-border market is where delegated onboarding matters most — and Payoneer is positioned to lead.

5. **Compliance architecture is a genuine differentiator.** Actor/owner separation, full audit trail, and customer-owned identity verification are ahead of competitors. Regulators are tightening requirements on intermediary-facilitated onboarding — Payoneer is building in the right direction.

6. **The regulatory landscape is GREEN across all target jurisdictions.** The agency/outsourcing model is permissible everywhere. UAE requires extra documentation (AMBER). No jurisdiction blocks the proposed flow.

### What This Research Challenges or Adds

7. **Commission structure needs GTM attention.** Performance-gating puts Payoneer at a structural disadvantage vs Airwallex's 50%+ non-gated model. Product should flag this even though it's a commercial decision — even a perfect portal won't overcome a 10pp+ commission gap.

8. **The "Formation Factory" persona is bifurcated.** Digital-native platforms (Sleek, Osome, doola) want API/embedded (Phase 2+). Traditional high-volume agents want portal + WhatsApp (MVP). Target traditional agents first — but plan API partnerships with digital platforms early.

9. **Distribution is fragmented but mappable.** Best channels: (a) direct outreach to top 30 current CSP partners, (b) STEP conferences/publications, (c) UAE free zone authority listings, (d) individual accounting firm network member firms in hub jurisdictions.

10. **Insurance MGA model is the strongest structural analogue.** Lloyd's coverholder framework (formal status, annual audits, defined scope) is worth studying as a template for CSP tiering and trust-building.

11. **BaaS platforms surface features not yet in the roadmap:** sandbox/test mode for CSPs, partner-level analytics dashboards (not just per-customer status), and tiered processing speed based on CSP quality track record.

### Items Needing Verification

| Item | Priority | Why |
|---|---|---|
| Wise Q4 2025 launches — did Hosted, Embedded, and API all ship? | HIGH | Competitive urgency signal |
| Wise adoption data for new onboarding products | HIGH | Market validation |
| Airwallex current exact commission rates and tier thresholds | HIGH | Commercial benchmarking |
| Brex revenue share introduction (late 2025/2026?) | MEDIUM | Economics comparison |
| Relay exact interchange share rate | MEDIUM | Economics comparison |
| Airwallex partner certification program status | MEDIUM | Program maturity |

### Discovery Interview Questions (for upcoming CSP interviews)

1. What tools do you use daily? CRM? Document management? How do you track client onboarding status?
2. How do you choose which banking/payment provider to route a client to? What would make you switch your default?
3. Which providers do you currently offer? What's your experience with each?
4. How important are referral commissions to your business? What commission model do you prefer?
5. Would you use a partner portal if one existed, or do you prefer email/WhatsApp?
6. How many payment/banking accounts do you open per month? What's the biggest friction point?
7. What would "ideal" look like — if you could design the perfect partner onboarding experience?

---

*Last updated: 2026-04-02. This document should be reviewed against live sources for post-May-2025 developments, particularly Wise Q4 2025 launches and Airwallex commercial terms.*
