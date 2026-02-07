# CLM Domain Context — Foundational Knowledge for PM Agents

> Last updated: 2026-02-07
> Update cadence: Quarterly, or when strategic priorities shift
> Read by: All PM agents on session start (before playbook)

---

## 1. Payoneer — Company Context

Payoneer is a global payments and commerce platform serving SMBs, freelancers, and marketplaces in 190+ countries. The core business enables cross-border payments — sellers on marketplaces (Amazon, eBay, Etsy, Walmart, etc.) receive payments from buyers worldwide and withdraw to local bank accounts.

**Scale:** Publicly traded (PAYO). Millions of customers globally. Processes billions in payment volume annually.

**Business model:** Transaction fees on cross-border payments, FX spreads, and value-added services (working capital, tax solutions, commercial cards).

**ICP:** SMBs and freelancers needing cross-border payment and commerce services. B2B focus. Customers range from solo freelancers to enterprise marketplace sellers.

**Regulatory environment:** Payoneer operates under multiple financial licenses across jurisdictions. Every country has its own KYC, AML, and data requirements. This makes CLM inherently a multi-regulatory, multi-country challenge.

---

## 2. What CLM Is

CLM = **Customer Lifecycle Management**. It covers everything from a customer's first touch through onboarding, verification, and ongoing compliance — the full journey from "stranger" to "active, compliant customer on the platform."

### The CLM Funnel

```
Lead/Registration → Account Creation → KYC Verification → Approval → Activation → First Funded Transaction (FFT)
```

At each stage, customers can drop off, get stuck, or be rejected. CLM's job is to maximize the flow of *good* customers through this funnel while keeping out bad actors — balancing conversion with compliance.

### Why CLM Matters

CLM is the front door to Payoneer's revenue. Every customer who generates revenue first went through CLM. A 1% improvement in approval rate across millions of registrations is a significant revenue impact. Conversely, compliance failures create regulatory risk, fines, and potential license revocation.

The tension between conversion and compliance is the central challenge: approve too aggressively and you take on risk; approve too conservatively and you lose revenue and customer trust.

### The 4Step → CLM Migration

Historically, Payoneer's onboarding was a system called **4Step** — a simpler, linear flow. The org is migrating to a new **CLM system** that supports more sophisticated flows: country-specific requirements, vendor orchestration, better UX. This migration is a major ongoing program — many metrics compare "CLM vs 4Step" to prove the new system converts as well or better. Countries are rolled out progressively to CLM.

**Key metric — GLPS-adjusted approval rate:** The 4Step approval rate is adjusted using the GLPS (Global Lead Pre-Screening) qualification funnel. This is the primary metric for CLM vs 4Step comparison. When comparing approval rates, always use the GLPS-adjusted number.

---

## 3. The CLM Organization

**VP of Product:** Yonatan Orpeli (started August 2024, previously Senior Director of Product at Forter for 5 years). Reports to Yaron Zakai Or (SVP Product) who reports to Oren Ryngler (CPO).

**Size:** 6 direct reports leading 5 product teams + 11 skip-level ICs (21 people total).

### Teams and Their Missions

| Team | Lead | Mission | North Star | Key Scope |
|------|------|---------|------------|-----------|
| **KYC Service** | Elad Schnarch (Principal PM) | Own end-to-end KYC — from when a customer hits the KYC step until approval/decline | KYC completion rate | KYC flows, vendor management, document collection, e-collection, decisioning |
| **Self-Service** | Ira Martinenko (Principal PM) | Own the end-to-end self-serve journey — first touch through activation and FFT | Desired customer revenue through onboarding | Lead scoring, account creation, pre-KYC intake, post-decision comms, activation |
| **Localization & Licensing** | Yael Feldhiem (Product Director) | Adapt CLM to local requirements and optimize high-impact countries | Top countries conversion/approval rates | Country-specific flows, licensing, regulatory compliance per country, local vendors |
| **Policy & Eligibility** | Ido Seter (Senior PM) | Define what we verify and maintain the rules for safe, optimized approvals | Compliance and auditability | Eligibility rules, compliance policies, single source of truth for profiles |
| **Delegated Onboarding** | Meital Lahat Dekter (Senior Director) | Own flows where third parties onboard customers | Customers onboarded via delegated channels | Reseller flows, internal ops tools, bulk onboarding, API-based onboarding, partner enablement |

**Cross-cutting:** Yaniv Oved (Principal PSM) leads Product Solutions — cross-cutting product strategy.

### Operations — The 350-Person Reality

CLM doesn't end at product. A ~350-person manual review operation (KYC Operations, led by Sivan Teplitz) handles cases that can't be auto-approved. These teams manually review documents, verify identities, and make approval decisions.

**Why this matters for PMs:** Every product decision has an ops impact. A change to document requirements, a new vendor integration, or a new country rollout affects hundreds of reviewers. The KYC Product & Operations Working Group (biweekly, co-chaired by Yonatan and Sivan) exists to coordinate this.

---

## 4. Strategic Priorities

### Current Initiatives

1. **PM Team Workshop** (P0, active) — Two-day in-person workshop to align the 21-person PM org on shared standards, create a PM Playbook v1, and establish leads as topic champions. Context: the PM org has inconsistent practices, feature-led thinking, weak experimentation and discovery, and no shared quality bar.

2. **KYC Product & Operations Working Group** (P1, active) — Standing coordination body between CLM Product and KYC Operations. Biweekly cadence. Addresses: misaligned priorities, reactive coordination, missed dependencies between product and ops.

3. **KYC-as-a-Product** (P1, exploration) — Transform KYC from internal cost center to external revenue-generating product. Payoneer already sells KYC-as-a-service to 2 strategic external customers. Strategic opportunity for revenue generation and product discipline.

### Current Focus Areas (from PPP and watching items)

- **Country rollouts:** China CLM (at-risk, repeated delays), Full Rollout expansion to Israel/Spain/Germany/UK, India expansion (complex regulatory: CKYCR, banking requirements, disability/accessibility)
- **Vendor optimization:** UIPath deprecation, Sumsub/AIPrise/Trulioo POCs, EVS-DCM mapping enabling orchestration
- **Lead scoring:** ZeroBounce enrichment, Clay/SimilarWeb POCs, Salesforce integration, offline scoring model running
- **Data quality:** Recurring theme across multiple teams — Looker gaps, Amplitude/Fullstory gaps, data team dependencies
- **DLC/LaunchDarkly:** Systemic frustration across multiple teams with development lifecycle tooling
- **KYC completion rate:** Global 23% (Dec 2025, flat MoM), T1-2 companies 31% (up 2% MoM)

---

## 5. How Success Is Measured

### Primary CLM Metrics

| Metric | What It Measures | Why It Matters |
|--------|-----------------|----------------|
| **Approval rate** (GLPS-adjusted) | % of qualified leads that get approved | The headline conversion metric. CLM vs 4Step comparison. |
| **KYC completion rate** | % of customers who complete the KYC flow | Measures UX friction and drop-off. Global benchmark ~23%. |
| **First-to-Last (FTL)** | Time from registration to approval | Speed matters — slower = more drop-off, worse customer experience. |
| **First Funded Transaction (FFT)** | % of approved customers who make their first transaction | Approval without activation is hollow. This measures real revenue conversion. |
| **Manual review rate** | % of applications requiring human review | Direct ops cost driver. Every manual review costs time and money. |
| **Auto-approval rate** | % approved without human intervention | Inverse of manual review. Higher = more efficient. |
| **False reject rate** | Good customers wrongly declined | Vendor quality metric. Too high = lost revenue. |

### What "Good" Looks Like

- Approval rates should be **equal to or better than 4Step** in rolled-out countries (the migration must not regress)
- KYC completion rate improvements of even 1-2pp are significant at scale
- FTL measured in days, not weeks — speed is a competitive advantage
- Manual review rate should trend down over time as automation improves

### Metric Caveats

- Always compare CLM to 4Step with the same filters (registration_program_calc = Payoneer D2P, is_blocked = 0)
- Country-level metrics vary enormously — a "good" approval rate in India is very different from the US
- Volume matters: a small country with a high approval rate is less impactful than a large country with a moderate one
- Cohort maturity: accounts need ~4 weeks to reach final approval status. Don't read approval rates on immature cohorts.

---

## 6. Product & System Landscape

### Key Flows

- **Self-service registration:** Customer signs up → creates account → enters pre-KYC data → enters KYC flow → submits documents → gets verified → approved/declined → activates → FFT
- **Delegated/partner onboarding:** Partners (eBay, Etsy, etc.) onboard customers through co-branded or API-based flows
- **e-Collection:** Electronic collection of customer documents and data (alternative to manual upload)
- **e-Verification:** Electronic verification against government databases and third-party sources

### Vendor Ecosystem

CLM depends heavily on external vendors for identity verification:
- **Persona** — Primary identity verification provider (eKYX)
- **Sumsub** — KYC vendor (POC stage)
- **AIPrise** — KYC vendor (POC stage)
- **Trulioo** — KYC vendor (POC stage)
- **IDmerit** — Identity verification (POC stage, under legal review)
- **UIPath** — Document processing (being deprecated)
- **Applause** — Selfie verification (POC stage)
- **ZeroBounce** — Email/business enrichment for lead scoring
- **Clay** — Lead enrichment platform (POC, NDA pending)
- **SimilarWeb** — Web traffic data for lead scoring (POC exploration)

**EVS-DCM mapping:** The mapping between External Verification Services (EVS) and Document Collection Matrix (DCM) is a key architectural piece — it determines which vendor capabilities match which document requirements. This was recently completed and enables vendor orchestration.

### Key Systems

- **Looker:** Primary analytics/BI tool. CLM funnel dashboards. Some data gaps exist.
- **LaunchDarkly:** Feature flagging. Currently a pain point — not suitable for country-level testing under 10K users.
- **InRule:** Business rules engine for policy and eligibility decisions.
- **BigQuery:** Data warehouse. Source for analytics.
- **Amplitude / Fullstory:** Product analytics and session replay. Gaps exist for partner registration filtering.

---

## 7. Recurring Themes and Patterns

These themes surface repeatedly across PPP reports and are ongoing challenges PM agents should be aware of:

| Theme | Frequency | What It Means |
|-------|-----------|---------------|
| **Rollout management** | Very high | Country-by-country CLM rollout is the biggest operational program. Delays are common (China is the current example). |
| **Data quality/access** | Very high | Multiple teams blocked by missing data, Looker gaps, or data team dependencies. Systemic problem, not individual. |
| **Compliance complexity** | High | Every product change intersects with regulations. Country-specific requirements create n-dimensional complexity. |
| **Vendor management** | High | Multiple concurrent vendor POCs, deprecations, and integrations. Each has legal, technical, and ops dependencies. |
| **Experimentation gaps** | High | The org wants to be more experiment-driven but lacks infrastructure and muscle (LaunchDarkly limitations, no A/B framework). |
| **Cross-team dependencies** | High | Shared resources (QA, regulatory team, data team) create bottlenecks. One team's delay cascades. |
| **Country-specific complexity** | High | India, China, Canada, Israel, US, UK — each has unique regulatory, licensing, and flow requirements. |

---

## 8. Key Constraints PM Agents Should Know

1. **Regulatory-first:** In fintech, compliance isn't optional. A feature that's great for conversion but violates KYC regulations is a non-starter. When in doubt, flag the compliance angle.

2. **Multi-country complexity:** What works in the US doesn't work in India. Every recommendation should consider geographic applicability. Tier 0/1 markets get priority.

3. **Ops impact is real:** 350 manual reviewers are affected by product changes. A "simple" change to document requirements might mean retraining hundreds of people. Always consider the ops side.

4. **Vendor dependencies:** Many capabilities depend on external vendors with their own timelines, legal processes, and technical limitations. POCs take months, not days.

5. **Data is a bottleneck:** Getting data for analysis often requires data team involvement. Looker dashboards may not have what you need. This is a known systemic issue.

6. **Migration in progress:** The 4Step → CLM migration means two systems run in parallel. Any analysis needs to account for which system a country is on.

7. **Manual invocation only:** No automation scheduling exists. Agents run when invoked. Plan accordingly.

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| **4Step** | Legacy onboarding system being replaced by CLM |
| **CLM** | Customer Lifecycle Management — the new onboarding and verification platform |
| **GLPS** | Global Lead Pre-Screening — qualification funnel before KYC |
| **FTL** | First-to-Last — time from registration to final decision |
| **FFT** | First Funded Transaction — customer's first real payment |
| **EVS** | External Verification Services — third-party verification APIs |
| **DCM** | Document Collection Matrix — defines required documents per customer type/country |
| **eKYX** | Electronic Know Your Customer/Business — Persona's verification product |
| **e-Collection** | Electronic document collection flows |
| **e-Verification** | Electronic verification against databases |
| **PPI** | Pre-Paid Instrument (India regulatory context) |
| **CKYCR** | Central KYC Registry (India regulatory requirement) |
| **V-CIP** | Video-based Customer Identification Process (India RBI requirement) |
| **D2P** | Direct-to-Payoneer — customers who register directly (vs via partner) |
| **InRule** | Business rules engine for policy/eligibility |
| **CPR** | Compliance Policy Review — review of compliance-related items |
| **ORN** | Operations Rejection Notification — tickets created when ops rejects a customer |
| **EDD** | Enhanced Due Diligence — deeper verification for higher-risk customers |
| **ARI** | items from Ari (compliance-originated review items) |

---

## 10. How to Use This Document

- **On session start:** Read this before the playbook. It gives you the "what" and "why" — the playbook gives you the "what we've learned."
- **When framing analysis:** Use the team missions and metrics to understand whose area you're touching and what they care about.
- **When making recommendations:** Check constraints (Section 8) — especially regulatory, ops impact, and data availability.
- **When something's unfamiliar:** Check the glossary first, then use the domain expertise agent for deeper research.
- **When this feels outdated:** Flag it. This document should be refreshed when strategic priorities shift.
