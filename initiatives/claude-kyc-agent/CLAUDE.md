# Claude KYC Agent

## Initiative Context

- **Initiative slug**: `claude-kyc-agent`
- **Initiative ID**: `d8a55bd0-491b-4809-a2ee-b6306c953947` <!-- from initiatives table -->
- **Status**: Active (P2)
- **Owner**: Yonatan Orpeli
- **Supabase memory doc ID**: `8b47a160-3f03-487f-bd64-e6cff71e8255` <!-- from content_sections -->

## What This Is

A **vendor-agnostic KYC orchestration layer** for Payoneer that runs *on top of* foundation-model KYC agents (Anthropic's KYC Screener, Google's equivalent), using their prompts/capabilities as the engine. We are **not** building our own KYC model and **not** competing with Anthropic — we are building the Payoneer-owned layer that abstracts the provider (swap Anthropic ↔ Google), and that owns the Payoneer-specific extraction logic, verification connectors, compliance, and audit.

**Phase 1:** validate the Claude-based extraction core (the v2.2 master extraction prompt). Early result: 91% field-extraction accuracy vs Persona's 65% on 45 native-validated Japanese documents.

Success = a production-ready agnostic layer where Payoneer can route KYC document processing to the best available provider without lock-in, with extraction quality, verification, compliance, and audit under our control.

## Your Role

Help develop, track, and synthesize this initiative. Specifically:
- Maintain the extraction prompt and version history (v2.2 → next) as it evolves.
- Track validation results across countries/document families and surface accuracy trends.
- **Track foundation-provider KYC news** (Anthropic KYC Screener, Managed Agents, connectors; Google equivalent) — these are inputs/substrate, not competition. See `agent.md` and the Watch List.
- Develop the agnostic-layer design (provider abstraction, verification connectors, compliance/audit).
- Prep materials (decks, summaries) for stakeholders (e.g., Bea / Finance).

## Key Principles

- **Use-what-they-built, not build-from-scratch.** Lean on provider capabilities; own the layer, not the model.
- **Provider-agnostic by design.** Every design choice should preserve the ability to swap Anthropic ↔ Google.
- **Never guess in extraction.** Hallucinated KYC data is a P0 defect (mirrors the v2.2 prompt's own rule).
- **Compliance & audit are first-class.** A regulated KYC workflow needs the audit trail / human-in-the-loop the providers' Managed-Agents frameworks offer.

## Stakeholders

- **Yonatan Orpeli** — Owner / sponsor.
- **Shilhav Ben David** (`shilhav-ben-david`) — **Lead** (day-to-day driver).
- **Yaniv Oved** (`yaniv-oved`) — Back-office / document source (points to where docs live).
- **Sivan Teplitz** (`sivan-teplitz`) — KYC Operations Lead; supplies validators.
- **Omer Shnhar** (`omer-shnhar`) — Engineering Team Lead (KYC); owns the doc-access service.
- **Bea Ordonez** — Senior stakeholder; offered Finance's support for testing.
- **Yasue Or** — Native-speaker validation (Japanese documents).
- Derek Green, Yaron Zakai-Or — involved in the initial validation thread.

## Related Initiatives

- `kyc-new-flow` — Payoneer's KYC flow work; the agnostic layer would plug into KYC document processing here.
- `vendor-optimization` — KYC vendor portfolio (Persona, etc.); this initiative is the "replace/augment with foundation-model agents" thread.

## Working Files

All drafts, research, frameworks, and working docs go under `docs/`.

| File | Purpose |
|------|---------|
| `docs/` | All working artifacts (the v2.2 prompt, validation results, the Bea deck — Yonatan drops these in) |
| `memory.md` | Working memory across Claude Code sessions |
| `context.md` | Domain reference: extraction-prompt architecture, provider landscape (Anthropic/Google), agnostic-layer design |
| `agent.md` | PM agent definition (monitoring, commands, news-tracking) |
| `../../context/brand-guidelines.md` | Payoneer brand guidelines (shared) |
