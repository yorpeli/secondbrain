# eBay Engagement — Domain Context

Reference knowledge for the eBay enterprise engagement. Compiled 2026-06-10 from a Teams/Outlook/SharePoint scan (V-team decks, meeting summaries, working decks). SharePoint stays the source of truth — this file summarizes and links.

## Partnership Facts & Renewal Stakes

- 5-year client; Payoneer's largest Strategic Enterprise partner.
- $75M direct revenue, $6Bn volume; $90M+ broader ecosystem revenue; ~800 TICPs (~20% of Payoneer total).
- Contract expires **April 2027** — the renewal is the forcing function for everything below.
- Account-health pressure driven primarily by sub-par KYC quality, stability, and measurability (V-team kickoff framing).
- Company objective the eBay KRs roll up to: **O7 — Defend and maintain market share with Strategic Enterprise Partners**.
- Exec governance above the V-team: monthly **Corporate Forum eBay update** (CEO office), Raul's **"Path to Green"** monthly program updates, and **QBRs** (FY25 QBR held Feb 11, 2026; eBay-side organizer Craig Wellhoefer).
- 2024–2025 history (per Yaron's `CLM eBay highlights`): fraud catch failures of 34% & 48% were the burning platform; Q2-2026 focus is KYC decision quality via CLM.

## V-team Structure & Cadence

- **Weekly**, kicked off **June 2, 2026**; second session June 9. Aaron Rossi organizes; Shiri Cohen Hirsh sends a structured summary email the morning after each meeting and maintains the deck.
- **Purpose:** align on how to move eBay to Green, strengthen KYC quality in a transparent and measurable way, maintain a shared definition of success ahead of the next audit and renewal, and rebuild confidence in Payoneer's ability to support eBay at scale.
- **Guiding principles:** *Own It Together* (joint ownership of account health) · *Control the Optics* (communication rhythm matters as much as execution) · *Focus and Elevate* (high-impact initiatives, not just reaction).
- **Members:** Aaron Rossi, Raul Gonzalez Osuna, Ya Wen, Gaurav Gupta, Yaron Zakai-Or, Yonatan Orpeli, Guy Behar, Miriam Ner-Gaon, Tal Koren, Prabhat Kumar; cc Shiri Cohen Hirsh, Erica Chan, Anat Ben Haim.

## eBay-Side Account Map (June 2026)

| Function | POC | Health | Role | Leading KPIs they watch |
|---|---|---|---|---|
| Payments | Eduardo Righi (Enterprise Growth) | Amber | Commercial relationship owner — "deal maker" | Platform availability, P0/P1 incidents, KYC SLA |
| Compliance | Matt Shustrin (CLM, Enterprise Ops Services) | **Red** | Performance gatekeeper — "deal breaker" | False-negative rate, QA accuracy, audit findings |
| Trust & Safety | Zhi Zhou (Compliance/Risk) | Green | Risk partner | Risk-blocked volume & AHs, early-life detection |
| Business | John Lin (Ent & Regional Growth) | Amber | Growth sponsor | Conversion %, high-value services usage, seller acquisition, % sellers on >1 marketplace |

## KPI Scoreboard (targets vs latest — June 9, 2026 V-team deck)

| KPI | Target | Latest | Status |
|---|---|---|---|
| 2026 Revenue | $85.8M | YTD $33.5M (102% of plan) | On track |
| 2026 KYC Revenue | $8M | YTD $2.4M (73%) | **Med risk** (was 51%/high-risk on Jun 2) |
| China Revenue | TBD | YTD $12.8M (+9% YoY) | On track |
| High-value services usage | TBD | YTD 39% (+12% YoY) | On track |
| % seller volume on >1 marketplace | TBD | 17% | Low risk (LEA green-channel working group forming) |
| QA Testing | 90% @ 5% coverage | May 92.93% (+1.3 MoM) | Low risk |
| Blocked During Registration | TBD | Apr 12% | TBD (target to be agreed) |
| False Negatives — True Approval | 95% | Apr 87% | Low risk |
| False Negatives — True Decline | 80% | Apr 70% | Low risk |
| CLM Conversion rate (excl. China) | 25% | May 23% (Apr 21.7%) | Low risk — RCA on bank details, company ID & address, POR reopen |
| KYC Ops SLA — doc review <72h | 90% | Apr 92.8% | On track |
| KYC Ops SLA — doc review <120h | 98% | Apr 96.2% | **V-team attention** — recovery plan due Jun 16 |
| Risk-blocked volume | <1% | Apr 0.06% | On track (bands: <3% low / 3–5% med / >5% high) |
| Pre-life closure | >50% | TTM 63.1% | On track |
| Platform availability | 99.95% | YTD 99.90%; May 99.696% | Low risk — Cloudflare migration ETA Jun 30 |
| P0 incidents | None | None | On track (HK cleanup closure + monitoring controls pending) |

Note: the Jun 2 deck showed slightly different April SLA figures (94.2% / 96.8%) — apparently restated in the Jun 9 deck. Use the latest deck as canonical.

## V-team Key Initiatives & Owners (June 9, 2026 deck)

| Workstream | Item | Owner | Priority | ETA / Next |
|---|---|---|---|---|
| Partnership governance | June 17 workshop | Raul | High | Materials final + dry run Jun 10 |
| Partnership governance | Client-facing monthly Health/KPI report (external KPIs for transparency) | Shiri | Med | EO June — pending V-team alignment on KPIs, KYC quality baseline, risk KPIs |
| CLM roll-out | Roll out CLM to 100% of eBay traffic | **Yonatan** | High | Jun 15 (China to 75% by Jun 9) |
| CLM conversion plan | Q3 roadmap to improve conversion / reduce OB friction | **Yonatan** | High | TBD |
| India new license | India launch readiness plan | **Yonatan** (Meital Lahat = Product focal) | High | Med risk — new-flows/CX comms Jun 11; E2E plan: onboarding, migration, comms, ops readiness, contingency, R&Rs |
| 2026 audit | Q3 readiness plan | Shiri | High | Q2 — led by Compliance Audit team; analysis of active payees without sufficient docs |
| KYC plan | Real-Time OCR for POR | **Yonatan** | High | EOQ2 |
| KYC plan | E-Collection | **Yonatan** | High | EOQ2 |
| KYC plan | Upfront fraud-detection accuracy (reduce false approvals) | **Yonatan** | High | EOQ2 ph1, Q3 ph2 |
| Growth | Eastern Europe + US/UK/EU markets (multi-entity sellers) | Raul | High | Q2 |
| Growth | Early pay / advanced settlements | Raul | Med | Q2 (feasibility) |
| Platform | Hybrid KYC (Re-KYC) | Gal Appel | Med | EO June — 3rd-batch ~150–200-seller pilot mid-June, validate Q3 scale-up |
| Platform | Cloudflare transition (clear, timely comms to eBay) | Eli | Med | Jun 30 |
| Platform | IPO roll-out (payments stability, fewer stuck payments) | Michelle Zucker | Low | EOQ2 |

The KYC Plan rows roll up into the **KYC Quality Framework** — roadmap, milestones, governance, success metrics, and business impact across OCR, E-Collection, and fraud-detection enhancements — to be finalized and aligned with eBay at the workshop, with a phased plan for sharing progress.

## KYC Results Narrative (`eBay_v6` management update, June 2026)

- **CLM vs 4-Step:** 5% vs 10% false-approval rate (50% reduction); CLM blocks 2× fraudulent accounts vs legacy; CVR 20% (legacy) → 24% (CLM). Post-approval block since 1/1/2026: CLM 0.9% vs 4-Step 2% (per Eliya).
- **High-risk countries (Kenya, South Korea):** elevated false-approval rates; two controls — (Q2) stricter auto-approval thresholds for high-risk geos, (Q3) low-lead-score customers failing verification blocked outright, no manual-review fallback. Q2 dev plan tests on low-traffic segments (Kenya, Egypt — volume-constrained).
- **Strategy:** Layer 1 = multi-vendor, ML-driven orchestration (continuous vendor benchmarking, threshold/bucket calibration, replace underperforming data sources); Layer 2 = AI-powered KYC trained on approval/decline outcomes (Q3 initiative).
- **Framing cautions** (from deck comments, Jun 7–10): false approvals are not yet an agreed metric with eBay (Yonatan → Yaron: needs sign-off before presenting); don't name high-risk countries in general sections — numbers can change, rationale won't; it's a KYC flow, not a scoring flow.

## Adjacent KYC Workstreams

- **RO-hub verification testing** (Dina Sh.): eBay approval-flow review by RO CW agent — ~700 of ~3,200 done at ~200/day, ETA Jun 18; TELUS 7-language scope (8,000 reviews, ~€21K) approved by Chen, ETA end of July.
- **eKYX / eVendors** (Elad Schnarch ↔ Raul): open thread on whether eVendor confirmation of POCA + CVD removes the need to collect documents — wording was contradictory, being clarified.
- **Hybrid KYC / Re-KYC** (Gal Appel, bi-weekly forum since Jan): automating seller re-verification for sellers originally onboarded via Payoneer KYC; pilot closing EO June, Q3 scale-up. Public page on the Professional Services site.
- **KYC docs testing** (Yaron, kicked off Mar 2): document-verification accuracy testing (Elad, Ido, et al.).
- **eBay Audit RCA** (Dec 2024): prior audit on document/selfie verification accuracy — context for 2026 audit readiness.
- **Enterprise flow improvements** (Marcela Chaves, Jun 9 email): deck presented to Yaron on enterprise-flow improvement opportunities — feeds the conversion plan.

## Key Documents Index

| Document | Where | What |
|---|---|---|
| [eBay V-team June 2nd final.pptx](https://payoneerinc-my.sharepoint.com/personal/shirico_payoneer_com/Documents/mine/Enterprise/Status/Vteam/eBay%20V-team%20June%202nd%20final.pptx) | Shiri OneDrive | The V-team deck — KPI scoreboard + initiative table, updated per meeting |
| [eBay V-team.pptx](https://payoneerinc-my.sharepoint.com/personal/aaronro_payoneer_com/Documents/eBay%20V-team.pptx) | Aaron OneDrive | Kickoff variant (exec summary, account map) |
| [eBay_v6.pptx](https://payoneerinc.sharepoint.com/teams/LicensingandRegulationsProduct/Shared%20Documents/CLM%20Localization/eBay/eBay_v6.pptx) | L&R site · CLM Localization/eBay | Yonatan/Yaron management update — KYC findings & path forward (active) |
| [eBay_Update.pptx](https://payoneerinc.sharepoint.com/teams/LicensingandRegulationsProduct/Shared%20Documents/CLM%20Localization/eBay/eBay_Update.pptx) | same folder | June 2026 onboarding project-management update |
| [ebay Q2 plan_ yaron.html](https://payoneerinc.sharepoint.com/teams/LicensingandRegulationsProduct/Shared%20Documents/CLM%20Localization/eBay/ebay%20Q2%20plan_%20yaron.html) | same folder | Q2 dev sprint roadmap (incl. Kenya/Egypt test segments) |
| [eBay_Workshop_vr0.5.pptx](https://payoneerinc-my.sharepoint.com/personal/raulgo_payoneer_com/Documents/Ebay/Account%20Management/eBay_Workshop_vr0.5.pptx) | Raul OneDrive | June 17 partnership-workshop deck (Compliance slides 17–20, Risk 16+) |
| [eBay KYC Quality Assurance Program.pptx](https://payoneerinc-my.sharepoint.com/personal/miriamro_payoneer_com/Documents/eBay%20KYC%20Quality%20Assurance%20Program.pptx) | Miriam OneDrive | QA program (May Product↔Ops workshop): KPI 1 blocked-during-registration, KPI 2 false negatives |
| [eBay Health Report - April 2026.docx](https://payoneerinc-my.sharepoint.com/personal/miriamro_payoneer_com/Documents/eBay%20Health%20Report%20-%20April%202026.docx) | Miriam OneDrive | Monthly exec report on the eBay KYC program |
| [ebay FY25 QBR.pptx](https://payoneerinc-my.sharepoint.com/personal/shirico_payoneer_com/Documents/mine/Enterprise/Status/eBay%20QBRs/ebay%20FY25%20QBR.pptx) | Shiri OneDrive | FY2025 business review (onboarding & KYC, seller performance) |
| [202502 CF MBR_eBay_vR1.pptx](https://payoneerinc-my.sharepoint.com/personal/raulgo_payoneer_com/Documents/Ebay/Account%20Management/Corp%20Forum/202502%20CF%20MBR_eBay_vR1.pptx) | Raul OneDrive | Corp Forum monthly business review (Feb) |
| [eBay Program Update CF_March.pptx](https://payoneerinc-my.sharepoint.com/personal/raulgo_payoneer_com/Documents/Ebay/Program%20Management/Tactical%20Program%20Governance/eBay%20Program%20Update%20CF_March.pptx) | Raul OneDrive | "Path to Green" monthly update (March) |
| [CLM eBay highlights.pptx](https://payoneerinc-my.sharepoint.com/personal/yaronza_payoneer_com/Documents/CLM%20eBay%20highlights.pptx) | Yaron OneDrive | 2024+2025 narrative — fraud-failure history, Q2 quality focus |
| [eBay_payees_analysis_Final.pptx](https://payoneerinc-my.sharepoint.com/personal/kerenha_payoneer_com/Documents/Desktop/ECs%20Protfolio/eBay/eBay%20Analyisis/eBay_payees_analysis_Final.pptx) | Keren OneDrive | Payee population analysis by lifecycle stage |
| [May 18-20 eBay workshop.xlsx](https://payoneerinc-my.sharepoint.com/personal/aaronro_payoneer_com/Documents/May%2018-20%20eBay%20workshop.xlsx) | Aaron OneDrive | San Jose onsite agenda/goals (May 19) |
| [eBay vendor performance.xlsx](https://payoneerinc-my.sharepoint.com/personal/yonatanorp_payoneer_com/Documents/Shared/eBay%20vendor%20performance.xlsx) | Yonatan OneDrive | Vendor scores for eBay registrations |
| [eBay KYC transition - Production Readiness.pptx](https://payoneerinc-my.sharepoint.com/personal/vladimirpi_payoneer_com/Documents/Documents/eBay%20KYC/eBay%20KYC%20transition%20-%20Production%20Readiness.pptx) | Vladimir OneDrive | Jan 2026 — legacy eBay KYC → new-platform transition |
| [eBay Audit RCA.docx](https://payoneerinc.sharepoint.com/teams/Solutionsteam/projects1/Vendors/Sagi%20-%20Au10tix,%20RAI,%20DU,%20FDC/eBay%20Audit%20RCA.docx) | Solutions team site | Dec 2024 audit RCA (doc/selfie verification accuracy) |
| [Revenue-site eBay page](https://payoneerinc.sharepoint.com/teams/Revenue/SitePages/eBay.aspx) | Revenue site | Aggregator: QBRs, partnership-agreement audits, compliance testing reports, program narrative |
| [eBay Re-KYC page](https://payoneerinc.sharepoint.com/sites/ProfessionalServicesAmericas/SitePages/eBay-ReKYC.aspx) | Prof. Services site | Hybrid KYC / Re-KYC program overview |

## Recurring Forums

| Forum | Cadence | Organizer | Notes |
|---|---|---|---|
| eBay V-team | Weekly | Aaron Rossi | Summary email from Shiri after each; canonical record |
| eBay – Hybrid KYC (Re-KYC) | Bi-weekly | Gal Appel | ~27 attendees incl. Yonatan, Yaron, Ido |
| T1 + eBay localization | Bi-weekly | Yaron | India/localization overlap |
| Corporate Forum — eBay update | Monthly | CEO office | Exec optics; "Path to Green" inputs |
| QBR with eBay | Quarterly | eBay (Craig Wellhoefer) | FY25 review held Feb 11, 2026 |
