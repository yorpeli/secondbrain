# eBay — Enterprise Customer Engagement

## Initiative Context

- **Initiative slug**: `ebay-engagement`
- **Initiative ID**: `e3f87f82-2379-4b69-ac1c-d914991ec7db`
- **Status**: Active (P1)
- **Owner**: Yonatan Orpeli
- **Sponsor**: Yaron Zakai-Or (SVP Product)
- **Supabase memory doc ID**: `ac42b5b5-794c-4e0f-96bf-da21a67f3d0b`

## What This Is

Yonatan's eBay-facing command post. eBay is Payoneer's largest Strategic Enterprise partner — $75M direct revenue, $6Bn volume, ~800 TICPs (~20% of Payoneer total), $90M+ broader ecosystem revenue — and the contract expires **April 2027**. Account health is under pressure, driven primarily by sub-par KYC quality, stability, and measurability. Two pillars:

1. **V-team issue governance** — a cross-functional eBay V-team (weekly, kicked off June 2, 2026) manages the specific eBay issues: KYC ops SLA recovery, KYC revenue & conversion, 2026 audit readiness, and India license readiness. Goal: move account health to Green ahead of the next audit and the Apr-2027 renewal.
2. **KYC results improvement** — the work to deliver measurably better KYC outcomes for eBay: false-approval reduction via CLM (10% → 5% vs 4-Step), high-risk-country controls (Kenya, South Korea), the KYC Quality Framework (Real-Time OCR for POR, E-Collection, upfront fraud-detection accuracy), the QA KPI program, and the Layer-2 AI-powered KYC direction.

Yonatan personally owns 6 of the V-team key-initiative rows: CLM rollout to 100%, CLM conversion plan, India launch readiness, Real-Time OCR for POR, E-Collection, and fraud-detection accuracy.

## Your Role

Help run and synthesize the engagement:
- Capture each weekly V-team summary (Shiri's email) into `docs/` and keep the memory doc's actions/deadlines current.
- Track eBay-facing commitments — what was promised, to whom, by when — and surface slipping items before they reach eBay.
- Prep Yonatan for V-team meetings, workshops, QBRs, and Corp Forum touchpoints.
- Surface related signals from PPP, `clm-full-rollout`/`clm-war-room`, and email/calendar.

## Key Principles

- **Govern, don't duplicate** — delivery lives in home initiatives (`clm-full-rollout` owns rollout status, `t1-localization` owns India mechanics, etc.). This workspace tracks the **eBay-facing commitments, KPIs, deadlines, and optics**, and links over.
- **Control the optics** (V-team guiding principle) — communication with eBay is as critical as execution; track what was shared with eBay, not just what shipped.
- **Summarize and link** — SharePoint decks/reports stay the source of truth; local docs carry summaries + links with provenance.
- **Append-only logs** — decisions and timeline entries are append-only; never rewrite history.

## Stakeholders

**Payoneer V-team** (weekly; Aaron Rossi organizes, Shiri Cohen Hirsh sends per-meeting summaries):

- **Yonatan Orpeli** — CLM / owner of 6 key-initiative rows
- **Yaron Zakai-Or** — sponsor / escalation; co-author of the `eBay_v6` management narrative
- **Aaron Rossi** — V-team lead
- **Shiri Cohen Hirsh** — program manager / scribe; owns client-facing monthly Health/KPI report + 2026 audit Q3 readiness plan
- **Raul Gonzalez Osuna** — account/program management; owns June 17 workshop, growth opportunities, Path to Green & Corp Forum updates
- **Miriam Ner-Gaon** — KYC ops; owns SLA recovery plan, QA program, monthly eBay Health Report
- **Ya Wen, Gaurav Gupta** — enterprise/commercial leadership; Corp Forum MBR
- **Guy Behar** — risk
- **Tal Koren, Prabhat Kumar** — product (Prabhat presents at the partnership workshop)
- cc: **Erica Chan**, **Anat Ben Haim** (Compliance — workshop slides)

**Adjacent owners:** **Gal Appel** (Hybrid KYC / Re-KYC pilot, bi-weekly forum), **Meital Lahat** (India readiness focal for Product), **Eliya Milstein** (data/analytics behind `eBay_v6`), **Estella Cherques Balassiano** (rollout reporting), **Michelle Zucker** (enterprise product / QBR roadmap), **Elad Schnarch** (eKYX / vendor verification).

**eBay-side account map** (from V-team deck, June 2026):

| Function | POC | Health | Role |
|---|---|---|---|
| Payments | Eduardo Righi | Amber | Commercial relationship owner |
| Compliance | Matt Shustrin | **Red** | Performance gatekeeper — false negatives, QA accuracy, audit findings |
| Trust & Safety | Zhi Zhou | Green | Risk partner |
| Business | John Lin | Amber | Growth sponsor |

## Related Initiatives

- `clm-full-rollout` / `clm-war-room` — CLM rollout to 100% of eBay traffic by June 15 (tracked there; the eBay-facing commitment is mirrored here)
- `partners-rollout` — enterprise/partner onboarding overlap (CN/HK partner ramps)
- `t1-localization` — India license mechanics (eBay readiness/comms plan is the V-team item)
- `compliance-data-quality`, `vendor-optimization` — KYC quality levers feeding the eBay Quality Framework

## Live Sources

- **V-team weekly summary email** — from Shiri Cohen Hirsh, subject "eBay V-team meeting summary- {date}" → capture each into `docs/`
- **V-team deck** — Shiri's OneDrive `/mine/Enterprise/Status/Vteam/eBay V-team June 2nd final.pptx` (updated per meeting)
- **Management narrative decks** — Licensing & Regulations site, `Shared Documents/CLM Localization/eBay/` (`eBay_v6.pptx`, `eBay_Update.pptx`, `ebay Q2 plan_ yaron.html`)
- **eBay Health Report (monthly)** + **KYC QA Program** — Miriam's OneDrive
- **Workshop materials** — Raul's OneDrive `/Ebay/Account Management/`
- **Revenue-site eBay page** — aggregates QBRs, audits, compliance testing, program narrative
- **Rollout dailies** — Estella's `Ebay_rollout_{date}.html` in the rollout meeting chat (clm-war-room scope; link only)

Full document index with links: see `context.md`.

## Working Files

| File | Purpose |
|------|---------|
| `docs/` | Dated captures: V-team summaries, workshop prep/outcomes, analyses |
| `memory.md` | Working memory across Claude Code sessions |
| `context.md` | Domain reference: KPI scoreboard, account map, initiative table, key-doc index |
| `../../context/brand-guidelines.md` | Payoneer brand guidelines (shared) |
