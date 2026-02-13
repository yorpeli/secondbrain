# KYC Product PM — Agent Memory

> Individual memory for the KYC Product PM agent. Domain-specific context, baselines, investigation history, and accumulated knowledge.

## Last Updated
2026-02-13 (initial onboarding)

## Current Phase
**Phase 1: Market & Competitive Analysis** — NOT STARTED

## Thesis & Strategic Context

### Core Thesis (from Yonatan, 2026-02-13)
Payoneer already runs KYC at scale for its own platform. If treated as an internal product (Payoneer = first customer), the economics and performance naturally align for external sale.

### Three Moat Hypotheses
| # | Moat | Status | Evidence |
|---|------|--------|----------|
| 1 | **Brand** — "We use it ourselves for fintech" | UNVALIDATED | Need market research on brand impact in KYC buying decisions |
| 2 | **High-risk country expertise** — Complex jurisdictions others struggle with | UNVALIDATED | Internal data shows strong high-risk performance (need specifics) |
| 3 | **Manual ops fallback** — Automated + manual = high quality decisions | UNVALIDATED | 350-person ops team exists; need throughput/quality metrics |

### Target Value Proposition
- **Decision rate:** 95%+ (send 100, we decide on 95)
- **Accuracy:** 99-99.5% (false positive AND false negative)
- **Full stack:** Automated verification + manual review for edge cases

### Target Customers
- **Primary:** Marketplaces (eBay, Etsy model)
- **Secondary:** Large enterprises (Best Buy model)
- **NOT:** Small businesses (too expensive, no competitive advantage)

### Existing Enterprise Customers (buying KYC today)
| Customer | Type | Notes |
|----------|------|-------|
| eBay | Marketplace | Large-scale, established relationship |
| Best Buy | Enterprise | High value |
| Etsy | Marketplace | Established relationship |

> **Data gap:** Need contract details, volume, revenue, satisfaction, what they value most. Create `needs-human` tasks for this.

## Phase 1 Research Tracker

### Market Sizing
- **Status:** NOT STARTED
- **Key questions:**
  - What is the TAM/SAM/SOM for KYC-as-a-Service (B2B)?
  - What's the growth rate?
  - Which segments are growing fastest?
- **Data sources needed:** Market reports, competitive analysis agent
- **Research stored:** (none yet)

### Competitive Landscape
- **Status:** NOT STARTED
- **Known competitors:** Jumio, Onfido, Sumsub, Stripe Identity, Persona, ComplyAdvantage, Veriff, Trulioo
- **Key questions:**
  - How do competitors position? What do they charge?
  - Who has manual review capability? Who's automation-only?
  - What's the market consolidation trend?
  - Where are competitors weak in high-risk countries?
- **Data sources needed:** Competitive analysis agent, web research
- **Research stored:** (none yet)

### Customer Segments
- **Status:** NOT STARTED
- **Key questions:**
  - Beyond marketplaces and enterprises, who else buys B2B KYC?
  - What are buying criteria by segment?
  - What's the typical sales cycle and contract size?
- **Data sources needed:** Competitive analysis agent, domain expertise agent
- **Research stored:** (none yet)

### Existing Customers
- **Status:** NOT STARTED
- **Key questions:**
  - What do eBay, Best Buy, Etsy actually use? Full KYC or specific components?
  - Why did they choose Payoneer over Jumio/Onfido/etc.?
  - What do they pay? What volume?
  - What's their satisfaction? What do they wish was better?
- **Data sources needed:** Yonatan (needs-human tasks)
- **Research stored:** (none yet)

## Phase 2 Research Tracker

### Current Capabilities
- **Status:** NOT STARTED
- **Known from CLM context:**
  - KYC covers: identity verification, document checks, sanctions screening, PEP screening
  - Country coverage: 190+ countries
  - Vendor integrations exist (EVS, eKYX mentioned in PPP)
  - 4Step → CLM migration in progress
- **Data gaps:** Detailed capability map, country-by-country coverage, vendor list

### Manual Operations
- **Status:** NOT STARTED
- **Known:** 350-person manual review operation exists
- **Data gaps:** Throughput, accuracy, cost per review, turnaround time, what triggers manual review

### Performance Metrics
- **Status:** NOT STARTED
- **Known from analytics agent:** GLPS-adjusted approval rates exist for hub countries
- **Data gaps:** Overall decision rate, false positive/negative rates, SLA compliance

### Cost Structure
- **Status:** NOT STARTED
- **Data gaps:** Cost per automated decision, cost per manual review, total KYC cost per applicant, vendor costs

## Open Questions
1. What exactly do eBay, Best Buy, Etsy use from our KYC? (ask Yonatan)
2. What is the current cost per KYC decision? (ask Yonatan)
3. What are our false positive/negative rates? (ask Yonatan or analytics)
4. How does the manual review operation work end-to-end? (ask Yonatan)
5. Is there existing sales collateral for enterprise KYC? (ask Yonatan)
6. Who in Sales/Solution Engineering knows this business best? (ask Yonatan)

## Playbook Contributions
(none yet — will add generalizable learnings as research progresses)
