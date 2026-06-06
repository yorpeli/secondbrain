# AI PM — Domain Reference (context.md)

Durable reference knowledge for running AI initiatives well. This is the *standing* layer — frameworks and benchmarks that change slowly. Fast-moving, source-specific intel goes into `research_results` via `scan --store` (and is discoverable by embedding), not here. Operational state goes in `memory.md`.

This file is a seed; grow it as the `scan` loop surfaces durable lessons worth promoting from research into reference.

## How to run an AI/LLM product (working model)

- **Start from the eval, not the model.** For any LLM/agent feature, define the success metric and the golden set *before* building. "What would convince us this works, and what would catch it failing?" The claude-kyc-agent QA benchmark (600 docs / 50 AHs vs Auditrail) is the template: a labeled set + a comparison baseline + a guardrail metric (false-approval rate).
- **Two metrics, always:** a quality metric (auto-resolution / accuracy) *and* a safety metric (false-approval / false-positive). Optimizing one without the other is how AI features ship and then get pulled.
- **Human-in-the-loop is a design axis, not a fallback.** Decide explicitly where a human reviews, with what context, and how their decisions feed back into evals.
- **Cost & latency are product requirements.** Track $/task and p50/p95 latency from the first POC; they decide whether something scales.

## Evaluation & benchmarking

- **LLM-as-judge** — using a strong model to score outputs against a rubric. Powerful but needs its own validation (does the judge agree with humans on a sample?). Bias toward rubric-based, few-shot judges; spot-check judge agreement.
- **Golden / reference sets** — a curated, labeled set you can re-run on every change. Versioned, with provenance. The benchmark *is* the asset.
- **Comparison baselines** — measure against the incumbent (e.g., Auditrail / human reviewer), not against zero. Head-to-head beats absolute numbers.
- **Guardrail thresholds** — set the acceptable false-approval bar from benchmark results *before* rollout, not after.

## Agent architecture patterns

- Tool use + retrieval over fine-tuning for most enterprise tasks (faster iteration, auditability).
- Keep the agent's decision auditable — log inputs, tool calls, and rationale (matters doubly for KYC/compliance).
- Clear done-criteria and a hosting/runtime decision are recurring blockers (cf. claude-kyc-agent: Swagger endpoint, BO integration, agent hosting). Treat infra dependencies as first-class roadmap items.

## AI-native org & enablement

- **Enablement compounds; tooling alone doesn't.** Seats (e.g., Cursor) are necessary, not sufficient — adoption needs milestones, visible wins, and a sustaining ritual (cf. ai-powered-pm-team, ai-academy-product).
- **Role design follows the work.** Define new AI-native roles from the actual tasks the new operating model creates, not from titles (cf. ai-native-team-structure).

## Cross-references

- KYC/vendor domain: the `kyc-team-repo` skill (Elad's Azure DevOps) and the `vendor-optimization` initiative are external corroboration for claude-kyc-agent.
- Foundry positioning: keep enablement framing, avoid "transformation" language (Mor Barazani owns AI Transformation) — see the project memory note.
- Shared PM context: `pm_team/clm-context.md`, `workflows.md`, `playbook.md`.
