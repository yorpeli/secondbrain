/**
 * AI PM — Configuration
 *
 * The AI PM is the portfolio PM for every AI initiative in the org, plus a
 * continuous-learning function that keeps the org current on AI-in-enterprise,
 * AI product management, and AI engineering. Two loops:
 *   - inward  (portfolio): track + synthesize across the AI initiatives
 *   - outward (learning):  scan curated sources + research the portfolio's
 *                          open questions, store distilled intel as research_results
 */

export const AGENT_SLUG = 'ai-pm'

/** Every initiative the AI PM owns (assigned_agent = 'ai-pm'). */
export const AI_PORTFOLIO_SLUGS = [
  'claude-kyc-agent',        // P0 — agentic KYC review (a.k.a. AIR-KYC, Shilhav)
  'air-squared',             // P0 — AIR², fast AI disruption
  'ai-native-team-structure',// P0 — AI-native operating model & JDs
  'ai-academy-product',      // P1 — Foundry / AI Academy for the product team
  'ai-powered-pm-team',      // P1 — AI tooling for the PM org itself
] as const

/**
 * Parked initiatives — still owned, but the PM does no active work on them:
 * excluded from the scan research agenda and shown greyed + un-flagged in the
 * portfolio. This is an explicit list (not derived from `blocked` status, since
 * e.g. ai-powered-pm-team is blocked but kept in active focus). To resume one,
 * remove it here (and restore its initiatives.status).
 */
export const ON_HOLD_SLUGS: string[] = [
  'ai-academy-product',
  'air-squared',
  'ai-native-team-structure',
]

export const isOnHold = (slug: string): boolean => ON_HOLD_SLUGS.includes(slug)

/**
 * Standing watchlist — the broad-sweep half of the learning loop.
 * Each topic is a durable area to keep current on; `scan --plan` pairs these
 * with the portfolio's live open questions to form the research agenda.
 */
export const WATCHLIST_TOPICS: { key: string; topic: string; why: string }[] = [
  { key: 'agentic-enterprise', topic: 'AI agents in the enterprise — agentic workflows, tool use, human-in-the-loop patterns, production deployments', why: 'Directly informs claude-kyc-agent and air-squared.' },
  { key: 'llm-evaluation', topic: 'LLM evaluation & benchmarking — LLM-as-judge, eval harnesses, golden sets, false-approval/quality guardrails', why: 'Core to claude-kyc-agent QA benchmark vs Auditrail.' },
  { key: 'ai-pm-craft', topic: 'AI product management craft — discovery, scoping, metrics, and roadmapping for AI/LLM products', why: 'Raises the bar for how the team runs AI initiatives.' },
  { key: 'ai-engineering', topic: 'AI engineering — RAG, orchestration, agent frameworks, evals, guardrails, observability, cost/latency', why: 'Shared infra knowledge across all AI builds.' },
  { key: 'enterprise-ai-governance', topic: 'Enterprise AI governance, safety & compliance — risk frameworks, model governance, auditability', why: 'Compliance posture for KYC/regulated AI.' },
  { key: 'kyc-ai-automation', topic: 'AI for KYC / identity / compliance operations — document understanding, fraud, automated review', why: 'Domain anchor for claude-kyc-agent; corroborates vendor/EVS intel.' },
  { key: 'ai-org-design', topic: 'AI-native org design & enablement — team operating models, role definitions, AI upskilling programs', why: 'Informs ai-native-team-structure and ai-academy-product.' },
]

/**
 * Curated sources for the broad sweep. Kept short on purpose — high
 * signal-to-noise beats coverage. Maintained in detail in watchlist.md.
 */
export const WATCHLIST_SOURCES: string[] = [
  'Anthropic engineering & research (anthropic.com/research, news)',
  'OpenAI research & cookbook',
  'Google DeepMind / Google Research blogs',
  'arXiv cs.AI / cs.CL (agents, evaluation, RAG)',
  "Simon Willison's Weblog (simonwillison.net)",
  'Latent Space (latent.space)',
  "Lenny's Newsletter (AI PM topics)",
  'Hamel Husain / "Your AI Product Needs Evals"',
  'a16z / Sequoia enterprise-AI writing',
  'Chip Huyen (AI engineering)',
]

/** Research entries older than this are flagged stale by `scan --plan`. */
export const RESEARCH_STALE_DAYS = 30
