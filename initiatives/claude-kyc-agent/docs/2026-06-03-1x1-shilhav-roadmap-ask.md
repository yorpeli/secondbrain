# 1:1 — Yonatan / Shilhav (KYC Agent) — 2026-06-03

> Reconstructed from an auto-transcribed Hebrew recording (`Yonatan _ Shilhav - 1x1.vtt`). Substance is reliable; some proper nouns (esp. the screening vendor) are best-effort — flagged below.

**Lead:** Shilhav Ben-David is running this initiative day-to-day.

## 1. Google ADK KYC release — discussion
Reviewed Google's "Build KYC agentic workflows with ADK" post. Key points understood:
- ADK is a **model- and platform-agnostic** multi-agent orchestration framework. The KYC sample = a root agent orchestrating **Document Checker, Resume Crosschecker, External Search (PEP/sanctions/adverse media), Wealth Calculator**, using Gemini + BigQuery + **Search Grounding** (grounded, source-cited external checks for auditability).
- The appealing part: the agent has **near out-of-the-box access to public/screening sources** (via Search Grounding) — could save integration work on the external-screening side.
- **UK is easier than US.** The external compliance/screening connection is simpler in the UK (free/standard API); the US is more complex (needs an aggregator / paid relationship).
- Internal Payoneer systems (back office, document store) still require **our own integration** regardless.
- Tension Yonatan raised: connect directly to providers vs. **keep some of it in our own hands** (don't fully outsource to a provider's connectors). Reinforces the agnostic-layer / control thesis. ADK being model-agnostic is itself interesting — a candidate shell we could build on and swap models within.
- **Action:** Shilhav to keep investigating the Google/ADK path and the screening-vendor connection (UK first), and report what's extractable.

## 2. The deck shown to Bea — options
The deck presented options for where the agent plugs into onboarding. Yonatan's read:
- The **simplest viable** implementation: when a case/ticket opens in the back office, hand an agent the documents and produce the report. **Assumption: <3 minutes** if the documents are surfaced up front.
- An **intermediate** option (surface docs to the rep in-flow) **requires dev work** from us and is further out.
- The **near-term, zero-cost win: post-rep QA** — making QA more efficient requires almost nothing.

## 3. Roadmap ask (the main output)
Yonatan asked Shilhav for a **roadmap / "word map"** — explicitly a **matrix**:

| Placement ↓ \\ Maturity → | Testing | Near-real-time | Real-time |
|---|---|---|---|
| **Pre-rep** (before agent) | | | |
| **With-rep** (assist) | | | |
| **Post-rep** (QA) | | | |
| **Real-time onboarding** | | | |

For each cell: **what we can do, when (tomorrow / in 2 weeks / in 1 month), and what it requires.** Goal is a step-by-step you can mark off one cell at a time, fast.

Yonatan's framing: the bottleneck now is **plumbing & placement, not per-language extraction accuracy.** He explicitly redirected Shilhav *away* from per-language perfection ("don't create a gut feeling / don't chase 80→90 on Arabic before deploying") and *toward* getting it in front of reps.

## 4. Action items
- **Shilhav → Yaniv:** get the **audited document set** Yaniv passed to the back office; run the agent on it and **reproduce the official audit result** (prove we get the same output). This is the credibility benchmark.
- **Shilhav:** run on Yaniv's set (mostly English) **now**, regardless of language, to benchmark vs the audit. Don't over-optimize specific languages. If a language is genuinely needed: run ~10 docs, get a validator via **Sivan**, move on.
- **Shilhav:** produce the **roadmap matrix** (above).
- **Shilhav / Omer:** stand up the **document-access service** — surface the right documents at a button press → hand to the agent → produce the report. Currently **Omer's** to enable; escalate to Yonatan if Omer is blocked.
- **Shilhav:** engage the **screening/compliance vendor** *(name uncertain from transcript — likely an AML/screening data provider; verify)* — UK free API; US via aggregator/paid. Decide connect-direct vs collect-data-ourselves.
- **Deploy push:** sit with reps **face-to-face 3–4 days** during the upcoming in-office weeks; target **eBay flows, pre-rep**; get reps seeing the UI. Urgency — don't miss the momentum.

## 5. Decisions / signals
- **[Decision]** Reproduce the official audit (Yaniv's set) first as the benchmark.
- **[Decision]** Prioritize **deployment/placement** over per-language accuracy tuning.
- **[Direction]** Keep a piece **in-house** (don't fully outsource to provider connectors) — agnostic/control thesis.
- **[Signal]** Strong urgency from Yonatan; wants reps seeing value within weeks, starting on eBay flows.

## Open questions
- Exact name of the screening/compliance vendor (UK-free / US-aggregator).
- US deployment is gated (nothing deployed there yet) — does ADK's out-of-box screening access actually clear the US path, or only UK?
- Which onboarding placement is genuinely closest (post-rep QA looks like the fastest first cell).
