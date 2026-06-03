---
summary: Domain reference for the agnostic KYC agent layer — extraction-prompt architecture, foundation-provider KYC landscape (Anthropic/Google), and agnostic-layer design.
topics: [kyc, document-extraction, ai-agents, vendor-strategy, compliance]
agents: [kyc-product-pm, vendor-optimization-pm]
---

# Claude KYC Agent — Domain Reference

## Strategic Framing

We are building a **vendor-agnostic KYC orchestration layer**, not a KYC model and not a competitor to the foundation providers. The layer:

- Runs **on top of** provider KYC agents (Anthropic's KYC Screener, Google's equivalent), using their prompts/capabilities as the engine.
- **Abstracts the provider** so Payoneer can swap Anthropic ↔ Google without rewriting the workflow.
- **Owns** the Payoneer-specific pieces: the document-extraction logic/prompt, verification connectors, compliance policy, and audit.

Their advances are tailwinds we consume. The risk we manage is *lock-in*, not competition.

## The Extraction Core — Master Extraction Prompt (v2.2 runtime)

The current extraction engine is a single-pass, **standalone** global KYC document parser: no external tools, registry lookups, or sanctions/PEP screening — every value is derived from the document text alone. Per document it:

1. **Detects the document family** — `CorporateData`, `Address`, `Identity`, or `NotKYC`.
2. **Extracts a fixed per-family JSON schema** — exact keys only; `null` when a value is missing/illegible/ambiguous (no added or dropped fields).
3. **Scores confidence** — per-field plus an `Overall` on a 0–1 rubric, with capping rules (any null → cap 0.95; more than half of identifying fields null → 0.00).
4. **Emits structured insights** — `extraction` (e.g. `OCR_LOW_CONFIDENCE`, `DATE_FALLBACK`, `NAME_TRANSLITERATED`, `OCR_CHAR_SUBSTITUTION_SUSPECTED`) and `rules` (e.g. `MISSING_REQUIRED_FIELD`, `BRN_FORMAT_INVALID`, `ADDRESS_FORMAT_INVALID`).

**Design choices worth preserving in any provider:**
- **Never guess in the extraction block** — hallucinated KYC data is a P0 defect. Inference is quarantined to a separate `EnrichedAddress` mirror, capped ≤0.80, every inference flagged `FIELD_ENRICHED`.
- **Deep locale playbook** — per-country script/transliteration, postcode regex, ID-number regex (CUIT/CNPJ/RFC/EDRPOU/VKN/CRN/BR/사업자등록번호/USCC/…), name-ordering tables.
- **Strict country attestation** — `Country` set only on a direct attestation (printed name/ISO, country-adjective brand, government issuer, country-specific template); otherwise left `null` and inferred only in the enriched mirror.
- **Prompt-injection hardening** — document text is treated as data, not instructions.

> The full prompt is in `docs/` (`master-kyc-prompt-v2.2-runtime.md`). This section is the durable summary; update the version when the prompt advances.

## Validation Results

| Date | Scope | Result |
|------|-------|--------|
| 2026-06-03 | 45 Japanese documents, native-speaker validation (Yasue Or) | Field-extraction accuracy: **Persona 65% → Agent v1 80% → Agent v2 91%** (+26.5pp over Persona after a skill fix) |

Treated as an early positive signal, not a verdict — expand the sample and document families.

## Provider Landscape

### Anthropic — KYC Screener (announced 2026)
- **What it does:** "assembles entity files, reviews source documents, and packages escalations for compliance review." One of ten finance-services templates.
- **Delivery:** plugin in Claude Cowork / Claude Code, or a cookbook for **Claude Managed Agents** (public beta).
- **Compliance infra (Managed Agents):** per-tool permissions, managed credential vaults, and a **full audit log** (inspect every tool call and decision) — exactly what a regulated KYC workflow needs.
- **Connector:** **Dun & Bradstreet** for "verified business identity" — the verification layer our standalone prompt deliberately omits.
- **Model:** pairs with Claude Opus 4.7; heavy human-in-the-loop framing.
- **Our read:** a candidate **shell/engine we build ON**. The opportunity is to drop our (deeper) extraction core into the Managed-Agents shell and inherit the audit/credential/permission infra. (ref: anthropic.com/news/finance-agents)

### Google — equivalent (TO RESEARCH)
- Gap in our knowledge. Need to identify Google's KYC / finance-agent offering, its document-processing capability, connectors, and compliance/audit story, then compare to Anthropic's for the agnostic-layer adapter design.

## Agnostic-Layer Design (open)

Open design questions to develop:
- **Provider abstraction** — a common interface over Anthropic ↔ Google (request/response shape, confidence, insights normalization).
- **Where Payoneer logic lives** — extraction prompt, verification connectors (D&B or equivalent), compliance policy, audit — kept provider-independent.
- **Routing** — choose provider per document type / cost / accuracy / region.
- **Compliance & audit** — leverage Managed-Agents audit logs vs. owning our own.
