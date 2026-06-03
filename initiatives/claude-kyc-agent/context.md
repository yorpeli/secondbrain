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

| Date | Scope | Metric | Result |
|------|-------|--------|--------|
| 2026-05-17 | 114 docs, 6 fields (Shilhav) | **Coverage** (cells filled, agent vs Persona) | Near-tie overall: **Agent 87.4% vs Persona 86.8% (+4 cells)**. Agent ahead on Country (+19), City (+14), Address (+9), IssuingDate (+9); FullName tied. **Behind on Zip: 41% vs 82% (−47)**. |
| 2026-06-03 | 45 Japanese docs, native-speaker validation (Yasue Or) | **Accuracy** (field extraction correct) | **Persona 65% → Agent v1 80% → Agent v2 91%** (+26.5pp over Persona after a skill fix). |

**Read these two together — they measure different things:**
- May 17 is **coverage** (did the agent fill the cell?), not correctness. The agent's conservative "never guess → null" rule *lowers* coverage where a value is ambiguous — most visibly **Zip (41%)**, where it leaves uncertain postcodes null while Persona fills them. That is the precision/recall tradeoff by design: lower coverage, higher trustworthiness of what *is* filled.
- June 3 is **accuracy** on filled cells — where the agent clearly leads (91% vs 65%).
- **Known weakness to track: Zip coverage.** Decide whether to enrich Zip (the `EnrichedAddress` mirror exists for exactly this) or accept low coverage as a safety feature. Treated as early signal, not verdict — expand sample + document families.

## Provider Landscape

### Anthropic — KYC Screener (announced 2026)
- **What it does:** "assembles entity files, reviews source documents, and packages escalations for compliance review." One of ten finance-services templates.
- **Delivery:** plugin in Claude Cowork / Claude Code, or a cookbook for **Claude Managed Agents** (public beta).
- **Compliance infra (Managed Agents):** per-tool permissions, managed credential vaults, and a **full audit log** (inspect every tool call and decision) — exactly what a regulated KYC workflow needs.
- **Connector:** **Dun & Bradstreet** for "verified business identity" — the verification layer our standalone prompt deliberately omits.
- **Model:** pairs with Claude Opus 4.7; heavy human-in-the-loop framing.
- **Our read:** a candidate **shell/engine we build ON**. The opportunity is to drop our (deeper) extraction core into the Managed-Agents shell and inherit the audit/credential/permission infra. (ref: anthropic.com/news/finance-agents)

### Google — ADK KYC agentic workflows (researched 2026-06-03)
- **Agent Development Kit (ADK)** — a **model- and platform-agnostic** agentic orchestration framework. The KYC sample is a **root agent** orchestrating four sub-agents: **Document Checker** (consistency/validity across docs), **Resume Crosschecker** (verify vs LinkedIn/company sites), **External Search** (PEP / sanctions / adverse-media due diligence), **Wealth Calculator** (net worth / source-of-wealth).
- **Stack:** Vertex AI **Gemini** (multimodal, multilingual reasoning), **BigQuery** (internal customer/risk data + dedup), **Search Grounding** (grounds external checks in real-time Google Search, source-cited URIs → "significantly reducing hallucinations"), Cloud Run for deploy.
- **Auditability:** unique case IDs + grounded source attribution (cite URIs) — the audit story.
- **vs our extraction prompt:** ADK is the **orchestration shell** (multi-agent, tool-integrated, screening + risk), not a document-extraction prompt. Our v2.2 prompt is a deeper *extraction* core; ADK is the *workflow* around it — parallels Anthropic's KYC Screener.
- **Strategic note:** ADK being model-agnostic is directly aligned with our thesis — a candidate shell we could build on and swap models within. **UK easier than US** for the external-compliance connection (free/standard API vs aggregator/paid). Out-of-box public/screening access is the attractive part; internal Payoneer systems still need our integration.
- Source: cloud.google.com/blog/products/ai-machine-learning/build-kyc-agentic-workflows-with-googles-adk

### Provider comparison (for the agnostic adapter)
| | Anthropic KYC Screener | Google ADK |
|---|---|---|
| Shape | Template/plugin + Managed Agents | Open-source agentic framework |
| Model | Claude Opus 4.7 | Gemini (model-agnostic framework) |
| Screening | D&B connector (verified business identity) | Search Grounding (PEP/sanctions/adverse media) |
| Audit | Managed-Agents audit log, credential vaults | Case IDs + grounded source URIs |
| Our use | Shell to inherit compliance infra | Model-agnostic shell to build on / swap |

## Agnostic-Layer Design (open)

Open design questions to develop:
- **Provider abstraction** — a common interface over Anthropic ↔ Google (request/response shape, confidence, insights normalization).
- **Where Payoneer logic lives** — extraction prompt, verification connectors (D&B or equivalent), compliance policy, audit — kept provider-independent.
- **Routing** — choose provider per document type / cost / accuracy / region.
- **Compliance & audit** — leverage Managed-Agents audit logs vs. owning our own.
