# Claude KYC Agent — Working Memory

## Last Session
- **Date**: 2026-06-03
- **What happened**: Initiative created (`claude-kyc-agent`, P2, owner Yonatan) and workspace stood up. Seeded from an Outlook push capture: the Japan initial-validation thread (Claude KYC OCR vs Persona — 91% vs 65% on 45 native-validated docs). Loaded the v2.2 master extraction prompt for context. Read Anthropic's finance-agents announcement (KYC Screener). **Reframed the initiative**: this is a vendor-agnostic layer built ON provider KYC agents (Anthropic/Google), not a from-scratch model and not a competitor.
- **Next steps**: Yonatan drops materials into `docs/` (the v2.2 prompt file, Japan validation results, the deck shown to Bea). Then: flesh out `context.md` provider landscape (Google gap), and set up ongoing news-tracking for Anthropic/Google KYC.

## Open Threads
- **Google equivalent** — we don't yet know Google's KYC/finance-agent offering. Need to research and add to the landscape.
- **Agnostic-layer design** — how to abstract Anthropic ↔ Google (interface, provider adapters, where Payoneer logic/compliance/audit lives).
- **Naming** — initiative is `claude-kyc-agent` but the goal is provider-agnostic; revisit if/when it matters.
- **News-tracking cadence** — decide how often to scan provider KYC announcements (candidate for a scheduled routine).

## Context to Remember
- **Framing (important):** use-what-they-built, not build-or-compete. Their advances are tailwinds we consume.
- **Phase 1 = validate the Claude extraction core (v2.2 prompt).** Early signal strong (91% vs Persona 65%), treated as signal not verdict — continue on a larger sample.
- The full structured initiative memory lives in Supabase (`content_sections`, memory doc `8b47a160-3f03-487f-bd64-e6cff71e8255`). This file is local working state.
- Materials will be dropped into `docs/` by Yonatan — don't assume they're here yet.
