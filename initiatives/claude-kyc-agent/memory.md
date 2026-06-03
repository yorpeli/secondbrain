# Claude KYC Agent — Working Memory

## Last Session
- **Date**: 2026-06-03
- **What happened**: Processed the Yonatan/Shilhav 1:1. **Shilhav Ben-David leads** this day-to-day. Reviewed Google's ADK KYC release (filled the Google gap — see `context.md`). Captured Yonatan's **roadmap ask**: a matrix of placement (pre-rep / with-rep / post-rep QA / real-time onboarding) × maturity (testing → near-real-time → real-time), each cell = what / when / requirements. Key redirect: **deployment & placement > per-language accuracy.** Full note: `docs/2026-06-03-1x1-shilhav-roadmap-ask.md`.
- **Next steps**: Shilhav owns the roadmap matrix + reproducing Yaniv's audited set + the doc-access service (with Omer). Yonatan wants reps seeing the UI within weeks (eBay flows, pre-rep). I can draft a first-cut roadmap matrix if asked.

## Open Threads
- **Roadmap matrix** — Shilhav to produce; I offered to draft a first cut.
- **Document-access service** — surface the right docs at a button press → agent → report. Omer's to enable; the real near-term bottleneck (plumbing, not accuracy).
- **Screening/compliance vendor** — name uncertain from the transcript (AML/screening data provider; UK free API, US aggregator/paid). Verify the name; decide connect-direct vs collect-ourselves.
- **Reproduce the official audit** — run on Yaniv's set, match the audited output (credibility benchmark).
- **US vs UK path** — US gated (nothing deployed); does ADK's out-of-box screening clear the US path or only UK?
- **People** — Shilhav (`shilhav-ben-david`, PM, reports to Yonatan) is in the DB and linked as **Lead** on this initiative. Yaniv, Sivan, Omer not in the people table yet.

## Context to Remember
- **Framing:** agnostic layer on provider KYC agents (Anthropic KYC Screener / Google ADK), use-not-compete. ADK is itself model-agnostic — a candidate shell to build on.
- **Yonatan's bias now:** ship/place it (post-rep QA first, then pre-rep on eBay), don't perfect per-language accuracy. Strong urgency.
- Structured source of truth = Supabase memory doc `8b47a160-3f03-487f-bd64-e6cff71e8255`. This file is local working state.
- Materials drop into `docs/` (Yonatan). The raw 1:1 transcript is `~/Downloads/Yonatan _ Shilhav - 1x1.vtt` (not yet copied in).
