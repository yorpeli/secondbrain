# AI PM — Watchlist

The broad-sweep half of the learning loop. `scan --plan` pairs these standing topics with the portfolio's live open questions to form the research agenda. Keep this list **short and high-signal** — coverage is not the goal; intel that changes a decision is.

The machine-readable subset lives in `lib/config.ts` (`WATCHLIST_TOPICS`, `WATCHLIST_SOURCES`). This doc is the human rationale + the fuller source list. When you add/retire a source here, mirror the change in config.

## Standing topics

| Key | Topic | Why we track it | Primary initiative |
|---|---|---|---|
| `agentic-enterprise` | AI agents in the enterprise — agentic workflows, tool use, human-in-the-loop, production deployments | Architecture + patterns for our agents | claude-kyc-agent, air-squared |
| `llm-evaluation` | LLM eval & benchmarking — LLM-as-judge, eval harnesses, golden sets, guardrails | Core to the claude-kyc-agent QA benchmark vs Auditrail | claude-kyc-agent |
| `ai-pm-craft` | AI product management — discovery, scoping, metrics, roadmapping for LLM products | Raises how the team runs every AI initiative | ai-academy-product, all |
| `ai-engineering` | AI engineering — RAG, orchestration, agent frameworks, evals, guardrails, observability, cost/latency | Shared build infra knowledge | all |
| `enterprise-ai-governance` | Enterprise AI governance, safety & compliance — risk frameworks, model governance, auditability | Compliance posture for regulated AI | claude-kyc-agent |
| `kyc-ai-automation` | AI for KYC / identity / compliance ops — document understanding, fraud, automated review | Domain anchor; corroborates vendor/EVS intel | claude-kyc-agent |
| `ai-org-design` | AI-native org design & enablement — operating models, role definitions, upskilling programs | Informs the org/enablement initiatives | ai-native-team-structure, ai-academy-product |

## Curated sources

**Labs / primary research**
- Anthropic — research + engineering blog + news (anthropic.com)
- OpenAI — research + cookbook
- Google DeepMind / Google Research
- arXiv — cs.AI / cs.CL (agents, evaluation, RAG); scan weekly digests, don't read everything

**Practitioners / engineering**
- Simon Willison's Weblog (simonwillison.net) — pragmatic, high-signal
- Latent Space (latent.space) — AI engineering podcast + newsletter
- Chip Huyen — AI engineering, ML systems
- Hamel Husain — evals ("Your AI Product Needs Evals"), LLM-as-judge

**Product / enterprise**
- Lenny's Newsletter — AI PM craft
- a16z + Sequoia — enterprise-AI theses, adoption patterns
- Vendor changelogs relevant to our stack (as they surface in initiatives)

## Maintenance

- Review the source list ~monthly; cut anything that hasn't produced applied intel.
- New lanes in the AI portfolio → add a standing topic + the initiative it serves.
- When a sweep repeatedly surfaces nothing actionable, retire it (and `log()` that you did, so the dropped coverage is visible).
