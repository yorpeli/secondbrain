# Vendor Optimization PM — Domain Context

> Agent: vendor-optimization-pm
> Purpose: Reference knowledge that informs the agent's reasoning — industry benchmarks, competitive intel, domain frameworks, vendor landscape intelligence. Unlike memory.md (operational state that changes every session), this file changes rarely and only when new research or understanding arrives.

## KYC Metrics Cascade

Vendor performance flows through a cascade that ultimately determines operational cost:

```
Match Rate → Verdict Rate → Auto-Approval Rate → Ops Tickets → Cost
(vendor)      (vendor)       (flow, multi-vendor)  (ops impact)   ($3.50/ticket avg)
```

### Metric Definitions

| Metric | Level | Definition | Example |
|--------|-------|-----------|---------|
| **Match rate** | Vendor | % of requests where the vendor finds a match in their databases | Send 100 requests → 90 match → 90% match rate |
| **Verdict/Success rate** | Vendor | Of matched requests, % where the vendor returns a definitive decision | 90 matches → 80 verdicts → 88.9% verdict rate |
| **Auto-approval rate** | Flow (multi-vendor) | % of end-to-end flows (which may span multiple vendors — ID verification, POR, document checks) that result in an automated approve/decline without human intervention | Full KYC flow completes → system auto-approves or auto-declines |
| **Ops ticket rate** | Flow | % of flows that fail to auto-approve and create a manual review ticket | 1 - auto-approval rate. Each ticket costs **$3.50 average** |
| **Reopen rate** | Ops | % of manual review tickets where the ops rep requests additional documents from the customer | Expensive: ops time + customer friction + delay + second review |

### Why This Matters for Vendor Decisions

A vendor with a high match rate can still cause expensive ops tickets if:
- Its verdict rate is low (matches but can't decide)
- Its part of the flow fails, breaking the auto-approval chain
- Its false reject rate is high (rejects good customers → ops ticket → reopen → resubmit)

**Always frame vendor performance in terms of ops impact.** "Vendor X has 90% match rate" is less useful than "Vendor X's 90% match rate in Brazil means ~10% of requests fail to auto-approve, generating ~500 tickets/month at $3.50 = $1,750/month in ops cost for that country alone."

### Cost Impact Model

At $3.50/ticket, every 1% improvement in auto-approval rate across ~40K eligible EVS requests = ~400 fewer tickets/month = ~$1,400/month savings. At full volume (128K requests if coverage gaps closed), the multiplier is ~3x.

### Data Availability & Gaps

| Metric | Available? | Source | Notes |
|--------|-----------|--------|-------|
| Match rate | Yes | PPP, POC results | Tracked per vendor |
| Verdict rate | Partial | PPP, vendor reports | Not always reported separately from match rate |
| Auto-approval rate | Yes | Analytics/Looker | Flow-level, not per-vendor |
| Ops ticket volume | Yes (manual extraction) | Ops systems | Not yet connected to analytics agent — **surface this gap repeatedly** |
| Reopen rate | Yes (manual extraction) | Ops systems | No per-vendor granularity yet — **future capability to push for** |
| Cost per ticket | Known | $3.50 average | Use for impact quantification |

**Key gap:** We cannot currently trace reopens back to which vendor caused the failure. This means we can see the FLOW failed but not WHY or which vendor in the chain was responsible. This is a critical capability gap — the agent should keep surfacing this as something to solve, potentially via the analytics agent or a dedicated data pipeline.

---

## Vendor Landscape Intelligence

### Regional Vendor Strengths (from market research + Q1 actuals, Mar 2026)

| Region | Strong Vendors | Notes |
|--------|---------------|-------|
| **LATAM** | AiPrise (POC confirms: ARG/COL 99.2%), Persona (BR, MX, CO), Trulioo (MX, CO, CL, EC), IDMerit (MX, BR, CL, CR, EC) | AiPrise POC complete → proceeding to eKYB contract. IDMerit pending legal. |
| **APAC** | AsiaVerify (already in stack), AiPrise, Persona (TH), Trulioo (PH — strong), Signzy (India, broader APAC) | AsiaVerify HK production. AiPrise weak in PH/VN. Trulioo PH is a bright spot. |
| **MENA** | Au10tix (gov-grade docs), Persona (AE), FOCAL/Mozn (ME specialist) | AiPrise weak here (UAE no data). Au10tix POC in progress. |
| **Europe** | Sumsub, Trulioo (PT, RO — expanded Q1), Ondato (cost-effective) | Trulioo primary for eKYC in Europe. Low performance in new EU countries except PH. |
| **North America** | Persona (customizable, UK expanded Q1), Socure (AI risk scoring), Trulioo | Persona primary. |
| **Africa** | Smile Identity (leading Africa IDV), AiPrise | Not yet explored. |

### Q1 Vendor Expansion Actuals (from Vova, Mar 9 2026)

| Vendor | Countries Expanded To | Avg Match Rate | Notes |
|--------|----------------------|---------------|-------|
| **Persona** | BR, MX, AE, UK, TR, TH, CO, IL (8 countries) | ~60% | Broad expansion, moderate performance |
| **Trulioo** | MX, CO, CL, EC, PH, PT, RO (7 countries) | Low overall | PH is the standout performer |
| **AIPrise** | POC completed | Varies by country | Proceeding to eKYB contract. LATAM strong, MENA/SEA weak |

### Active Fallback Chains (confirmed working, Mar 9 2026)

| Pattern | Status | Impact |
|---------|--------|--------|
| Trulioo → IDentiflo | Working | Cost optimization + performance uplift |
| Persona → Trulioo | Working | Cost optimization + performance uplift |
| EVS ↔ AWS | Completed | Coverage expansion |

### Payoneer Verdict Rate Actuals (from Yarden, Mar 10 2026)

| Vendor/Category | Beginning Q1 | Current | Target |
|----------------|-------------|---------|--------|
| RAI + Persona (Fraud + Classification) | 84% | 86% | ~100% with auth fallback |
| Au10tix (Fraud) | 70% | 98% | 98% |
| Persona (Fraud, Classification, OCR) | TBM | TBM | TBM |
| RAI Authenticity | <80% (2025) | 85.5% (Feb) | — |
| RAI RTC | 85% | 98% | — |

Target KPI: Verdict rate >90% across all vendors. Authenticity orchestration achieves ~100%.

**Key fraud finding:** RAI-Persona comparison shows 21% of fraud missed by RAI but caught by Persona.

### Payoneer Feature Impact Actuals (from Yarden, Mar 10 2026)

| Feature | Approved Δ | Reopen Δ | CVR Δ |
|---------|-----------|----------|-------|
| Address validation skip | +6.3% | +1.4% | TBD |
| Ignore country mismatch | +3.34% | -0.7% | TBD |
| Authenticity fallback | +1.2% | — | TBD |

### Key Industry Metrics (benchmarks, from public vendor data)

- Auto-approval rate: Top vendors claim 90-95% for low-risk segments
- Verification speed: 6 seconds (Veriff) to 60 seconds (Onfido)
- Document type coverage: 2,500 (Onfido) to 12,000+ (Veriff, AiPrise)
- Cost per verification: ~$0.50 (high-volume, basic) to $2+ (enterprise, complex)

> **Gap:** These are vendor-reported numbers, often for low-risk cohorts. We need independent benchmarks for auto-approval rate, manual review rate, and reopen rate across fintech KYC operations. See Open Research section below.

---

## Orchestration Patterns

### Current Patterns (Payoneer, in production or testing)

| Pattern | Status | Details |
|---------|--------|---------|
| **Authenticity fallback** | Live (50% as of Feb 26) | Primary auth check returns indecisive → fall back to Persona (source: Elad Jan 29 PPP). Primary vendor unconfirmed — likely RAI based on indecisive rate tracking. |
| **Trulioo → IDentiflo fallback** | Live (Mar 9) | Cost optimization + performance uplift |
| **Persona → Trulioo fallback** | Live (Mar 9) | Cost optimization + performance uplift |
| **EVS ↔ AWS integration** | Completed (Mar 9) | Full eKYX coverage enabler |
| **Classification fallback** | Live (Mar 10) | Priority changed from UiPath → Persona (Feb). RAI classification per doc type |
| **UK ePOR A/B** | Running | Persona vs Trulioo — expanding Persona coverage |
| **Vendor priority routing** | Planned | Trulioo/Persona priority setting in UK, CO, MX, AR |
| **EVS-DCM mapping** | Complete (Feb 5) | New KYC flow completed (confirmed Mar 9) |

### UiPath Sunset Timeline (from Yarden, Mar 10 2026)

| Month | Action |
|-------|--------|
| Feb | Classification fallback priority: UiPath → Persona (done) |
| Feb-Mar | Expand Persona country coverage |
| Apr | Keep only high-approval countries (>50%), low reopen |
| May | Optimize low performers, move CN CVD to AsiaVerify/Persona |
| Jun | New docs vendor OCR + orchestration |
| **Jul 1** | **UiPath traffic to 0** |

### Industry Orchestration Strategies

- **Waterfall:** Try cheapest adequate vendor first → escalate on failure. Optimizes cost while maintaining coverage.
- **Best-of-breed:** Route to the vendor with highest match rate for that specific country + doc type. Optimizes accuracy.
- **Fallback chains:** Define explicit fallback sequences per country/doc type. Maximizes coverage.
- **A/B testing:** Split traffic to compare vendor performance on identical cohorts. Enables data-driven routing decisions.
- **Cost-tiered:** Route low-risk verifications to cheaper vendors, high-risk to premium vendors. Balances cost vs accuracy.
- **Confidence-based:** If vendor returns low-confidence result, escalate to a second vendor before creating ops ticket. Reduces manual review.

### Orchestration Platforms in the Market

| Company | Approach |
|---------|----------|
| **Alloy** | Decision engine with 200+ pre-built data source integrations; low-code vendor switching |
| **AiPrise** | Orchestration-first; 100+ data sources, 200 countries; strong in emerging markets |
| **Persona** | Modular verification with customizable workflows |
| **Trulioo** | Proprietary ML that automatically routes to best-performing sources per region |

---

## Industry Benchmarks (from competitive research, Mar 2026)

### Auto-Approval / Straight-Through Processing (STP) Rates

| Context | Rate | Source Type |
|---------|------|-------------|
| **Vendor claims** (Veriff, Persona, HyperVerge) | 95-98% | Vendor marketing — optimistic, low-risk cohorts |
| **Real-world fintech (pre-orchestration)** | ~45% | Independently verified (Earnest before Alloy) |
| **Real-world fintech (post-orchestration)** | 70%+ | Independently verified (Earnest after Alloy) |
| **Bank periodic KYC reviews (STP target)** | 50-65% of low-risk population | McKinsey |
| **False rejection rate (industry standard)** | ~1.9% per 100 IDV submissions | Industry benchmark |

**Key insight:** Vendor-claimed 95-98% rates are marketing numbers for low-risk, clean cohorts. Real-world fintech rates are 45-70%. The gap between vendor claims and reality is where orchestration and ops optimization create value.

**Important caveat (from Persona):** A high-level pass rate "probably isn't telling you what you actually need to know" — pass rates include false passes (bad actors getting through), so they must be read alongside fraud catch rates.

### Manual Review Costs

| Context | Cost | Source |
|---------|------|--------|
| **Payoneer (individual IDV ticket)** | $3.50/ticket | Internal |
| **Corporate/commercial full KYC review** | $2,598 average (up 17% from 2022) | Fenergo survey |
| **Two-thirds of FIs surveyed** | $1,501 - $3,500/review | Fenergo survey |
| **Automated IDV check cost** | $0.20 average, $0.90-$2.30 (Jumio), $1.35 (Sumsub), $1.50 (Stripe) | Industry/vendor pricing |

**Critical distinction:** The $2,598 figure is for **corporate KYC** (identity + beneficial ownership + AML + EDD). Payoneer's $3.50/ticket is for **individual IDV manual review** — a narrower task. **$3.50 is competitive** for this scope.

**Cost structure insight:** More than half of FIs report 31-60% of KYC tasks are still manual. McKinsey finds **85% of KYC effort is clerical, not risk judgment** — meaning most manual work is automatable.

### Reopen / Document Re-request Rates

| Metric | Value | Source |
|--------|-------|--------|
| **Onboarding abandonment (fintech)** | 60-80% overall, 70-80% in banking/fintech | Jumio, citing fintech.global 2022 (68% figure) |
| **Onboarding abandonment (general)** | ~63% never finish signing up | Sardine (unsourced) |
| **Average time before abandonment** | 18 minutes 53 seconds | Industry research |
| **Resubmission reduction (best practice)** | -73% with better upload guidance | Credit union case study |

**Important nuance:** The 60-80% figure is for **overall onboarding abandonment** (driven by process length, complexity, and number of verification steps), not specifically for document re-request drop-off. No isolated resubmission abandonment rate has been published. Document re-requests compound the overall abandonment problem, but the exact incremental impact is unmeasured industry-wide.

**No published industry benchmark exists** for "what % of manual reviews result in re-requests." Tracking this internally would give Payoneer a competitive intelligence advantage.

**Best practices for reducing reopens:**
1. Real-time document quality feedback at point of capture (blur, wrong type, expired)
2. Mobile-friendly capture (accept photos, not just scans)
3. AI-powered pre-validation before submission
4. Clear upfront guidance on document requirements
5. Fewer verification steps overall

### Manual Review Operations KPIs

| KPI | Description |
|-----|-------------|
| Average review time | Minutes per case |
| First-pass verification rate | % verified without rework |
| Manual touchpoints per case | Number of human interventions |
| Cost per verification (all-in) | Software + labor + vendor + exceptions |
| Instant decision rate | % with automated decision |
| Customer outreach rate | How often reviewers contact the customer |
| QA/accuracy score | % passing quality audit |
| Cases processed per FTE per month | Throughput efficiency |

### False Decline Cost

- **J.P. Morgan:** False positive losses = **19% of total cost of fraud** — wrongly rejecting good customers is expensive
- **NIST standard** for false acceptance: 1 in 10,000 (moving to 1 in 100,000)
- Every false decline = lost customer lifetime value + acquisition cost wasted

---

## Orchestration Impact (Evidence-Based)

### Proven Results

| Company | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Earnest** (via Alloy) | 45% auto-approval | 70%+ auto-approval | **+25pp auto-approval, ~36% fewer manual reviews** |
| **Elements Financial** (via Alloy) | Baseline | +40% auto-approval | **60% decrease in manual review, 50% reduction in review time** |
| **Grey** (via AiPrise) | 6 regional providers | Single orchestration | **2x KYC approvals, 64% fewer support tickets, done in 4 weeks** |
| **Alloy aggregate** | Client average | Post-orchestration | **+33% approval rates, -48% fraud** |

### Why Multi-Vendor Orchestration Improves STP

1. **Fallback coverage:** If Vendor A can't verify a document type, Vendor B may, avoiding manual review entirely
2. **Consensus scoring:** Multiple vendor signals combined yield higher confidence than any single vendor
3. **Smart routing:** Different vendors excel in different geographies/doc types — routing to the best vendor per case improves first-try success
4. **Reduced downtime impact:** Eliminates single-vendor outage → manual review spikes

### Implications for Payoneer

With a 350-person manual review team, even modest orchestration improvements have significant impact:
- **McKinsey:** 20% increase in KYC automation → 48% more cases processed, 18% fewer customer outreaches, 13% better QA
- **KPMG:** Optimized operations achieved 90% reduction in FTE and costs
- **Industry:** Automation can deliver 60-80% reduction in manual review time

**Payoneer-specific opportunity:** If current auto-approval is ~44% (EVS eligible match rate as proxy), orchestration could push this to 70%+ based on Earnest/Alloy precedent. At 40K eligible requests/month, that's ~10,400 fewer tickets/month × $3.50 = **~$36,400/month savings** — plus the conversion lift from fewer customer drop-offs.

---

## Automated-Only vs Hybrid (Automated + Manual) KYC

### The Trade-off

| Dimension | Automated-Only | Hybrid (Automated + Manual) |
|-----------|---------------|---------------------------|
| **Cost** | Up to 70% reduction in KYC costs | Higher cost but catches edge cases |
| **Speed** | Sub-10 second verification | Minutes to hours for manual cases |
| **Scalability** | No headcount scaling needed | Requires ops team scaling |
| **Edge case handling** | Rejects unusual documents → lost customers | Humans catch what AI misses → higher approval |
| **Regulatory** | Some regulators expect human oversight | Defensible for high-risk decisions |
| **Fraud** | Sophisticated fraud may pass automated | Trained reviewers catch complex patterns |

### Payoneer's Position

Payoneer's 350-person ops team is a **competitive advantage, not just a cost center** — if positioned correctly:
- It enables a hybrid model that achieves higher overall approval rates than automated-only
- The ops team handles the long tail that no vendor can automate
- This is a key differentiator for the KYC-as-a-Service thesis (the "manual fallback moat")

**The optimization target is not eliminating manual review — it's ensuring only cases that genuinely need human judgment reach the ops team.** McKinsey's finding that 85% of KYC effort is clerical (not risk judgment) means the current ops workload likely includes significant automatable work.

---

## Open Research (Remaining Gaps)

1. **Vendor SLA norms** — Standard SLAs for KYC vendors: uptime guarantees, response time, match rate guarantees, penalty clauses
2. **Payoneer's actual auto-approval rate** — We use EVS match rate (44%) as a proxy, but the true flow-level auto-approval rate may differ. Need to extract this from ops/analytics.
3. **Reopen rate baseline** — What is Payoneer's current reopen rate? No industry benchmark exists, so establishing our own baseline is the first step.
4. **Cost per false decline** — What's the lifetime value of a customer we wrongly reject? This frames the ROI of reducing false rejection rates.

---

## Sources

- [McKinsey: Solving the KYC puzzle with STP](https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/solving-the-kyc-puzzle-with-straight-through-processing)
- [McKinsey: Five actions for next-gen KYC](https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/five-actions-to-build-next-generation-know-your-customer-capabilities)
- [Fenergo: KYC Compliance Cost](https://resources.fenergo.com/blogs/kyc-compliance-for-banks-addressing-the-cost)
- [ComplyCube: KYC API Pricing 2025](https://www.complycube.com/en/a-guide-to-kyc-api-pricing-in-2025/)
- [Persona: Rethink IDV Pass Rates](https://withpersona.com/blog/identity-verification-pass-rate-metrics)
- [Alloy: Fintech Solutions](https://www.alloy.com/fintechs)
- [Contrary Research: Alloy Business Breakdown](https://research.contrary.com/company/alloy)
- [AiPrise: Neobank Case Study](https://www.aiprise.com/case-studies/a-fast-growing-fintech-streamlined-global-kyc)
- [Sardine: KYC Conversion Rates](https://www.sardine.ai/blog/kyc-conversion-rates)
- [Middesk: True Cost of Manual ID Verification](https://www.middesk.com/blog/manual-identity-verification)
- [KYC AML Guide: False Acceptance vs Rejection Rate](https://kycaml.guide/blog/false-acceptance-rate-vs-false-rejection-rate/)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-10 | Claude Code | v1.0 — Initial version. KYC metrics cascade, vendor landscape, orchestration patterns, open research gaps. |
| 2026-03-10 | Claude Code | v1.1 — Added industry benchmarks (auto-approval, manual review costs, reopen rates, ops KPIs, false decline cost), orchestration impact evidence, automated vs hybrid analysis, Payoneer positioning. Reduced open research gaps from 5 to 4. |
| 2026-03-10 | Claude Code | v1.2 — Updated vendor landscape with Q1 expansion actuals from Vova (Persona 8 countries, Trulioo 7 countries, AIPrise → contract). Added active fallback chains. Updated orchestration patterns to reflect confirmed-working fallbacks. |
| 2026-03-10 | Claude Code | v1.3 — Added Payoneer verdict rate actuals, feature impact actuals, UiPath sunset timeline (Jul 1), updated classification fallback to live. From Yarden bi-weekly update. |
