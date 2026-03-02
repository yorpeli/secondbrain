# Agent Reference

> Detailed agent descriptions, CLI commands, task formats, and key concepts. For a summary overview, see [CLAUDE.md](../CLAUDE.md#agents).

---

## Analytics Agent

The analytics agent (`analytics/`) queries Payoneer's Looker dashboards to analyze CLM funnel performance. It can be invoked via CLI or picked up as an `agent_task`.

**Commands:** `scan-opportunities`, `compare <country>`, `deep-dive <country>`, `diagnose <country>`, `check-tasks`

**CLI:** `npx tsx analytics/run.ts <command> [args]`

**Task format:** Set `target_agent = 'analytics'` and put a JSON command in `description`:
```json
{"type": "deep-dive", "country": "Brazil"}
```

**Key concept — GLPS-adjusted approval rate:** The 4Step approval rate is adjusted using the GLPS qualification funnel. This is the primary metric for CLM vs 4Step comparison. See `analytics/lib/data-utils.ts:calculateAccountsApprovedGLPS()`.

**Environment:** Requires `LOOKER_BASE_URL`, `LOOKER_CLIENT_ID`, `LOOKER_CLIENT_SECRET`. See `agents/analytics.md` for full documentation.

---

## Data-Viz Agent

The data-viz agent (`data-viz/`) is a **visual storytelling subagent**. It receives structured analytics results, decides which charts to produce, crafts insight-stating titles, and renders branded PNG images.

**Architecture:** LLM-powered chart advisor (the intelligence) + rendering library (templates + renderer, the infrastructure).

**Invocation:** Claude Code subagent via the Task tool. Pass analytics result data + intent + output context.

**Templates:** `volume-trend`, `approval-comparison`, `funnel-health`, `opportunity-map`, `segment-heatmap`

**Output contexts:** `document` (800x450), `slide` (1920x1080), `dashboard` (600x400)

**CLI (for direct use):**
```bash
npx tsx data-viz/run.ts demo <template> [--output=<path>]
npx tsx data-viz/run.ts render <template> --data=<spec.json> --output=<path>
npx tsx data-viz/run.ts list-templates
```

**Key design decisions:**
- The agent does NOT query data sources — the analytics agent owns data acquisition
- If the agent needs more data for better visualization, it returns an advisory (not a request) — the orchestrator decides whether to fetch it
- Brand colors derived from `lib/doc-style.ts` — single source of truth
- Docx embedding handled via `lib/chart-embed.ts` (separate from the agent)

See `agents/data-viz.md` for the full subagent definition.

---

## PPP Ingest Agent

The PPP ingest agent (`ppp/`) handles local processing of the CLM weekly PPP deck. It replaces the edge function HTTP workflow with direct Supabase JS client writes — no MCP timeouts.

**Commands:** `context`, `write <json-path>`, `enrich`, `check-tasks`

**CLI:** `npx tsx ppp/run.ts <command> [args]`

**Task format:** Set `target_agent = 'ppp-ingest'` and put a JSON command in `description`:
```json
{"type": "write", "path": "output/ppp-2026-02-19.json"}
```

**Workflow:** Extract text → `context` (load previous week + people + tags) → Claude analyzes → user reviews → `write` (validate + DB insert) → `enrich` (week-over-week diff).

See `agents/ppp-ingest.md` for the full agent definition.

---

## PM Team & Team Lead Agent

The PM Team (`pm_team/`) is an autonomous AI product management team. Agents behave like junior-to-mid PMs — they own areas, track metrics, investigate, recommend, and escalate.

**Four-layer knowledge model:**
- `pm_team/clm-context.md` — **business context**: Payoneer, CLM domain, teams, metrics, constraints, glossary (refreshed quarterly)
- `pm_team/workflows.md` — **process**: how agents operate (session start, task lifecycle, communication, escalation)
- `pm_team/playbook.md` — **shared knowledge**: generalizable learnings across all PM agents (patterns, gotchas, domain insights)
- `{agent}/memory.md` — **individual memory**: domain-specific context per agent (baselines, metrics, investigation history)

**Team Lead Agent** (`pm_team/team-lead/`): Three CLI subcommands, not one monolithic agent.

**Commands:** `hygiene`, `synthesize`, `enforce`, `check-tasks`

**CLI:** `npx tsx pm_team/team-lead/run.ts <command> [args]`

**Task format:** Set `target_agent = 'team-lead'` and put a JSON command in `description`:
```json
{"type": "hygiene", "days": 14}
{"type": "synthesize", "days": 7, "agents": ["analytics"]}
{"type": "enforce"}
```

See `agents/team-lead.md` for the full agent definition.

---

## Competitive Analysis Agent

The competitive analysis agent (`agents/competitive-analysis.md`) is a **definition-only research agent** — no TypeScript CLI. Claude performs web research + reasoning directly, storing results in `research_results` via `lib/research.ts`.

**Invocation:** Via `agent_tasks` or direct request. Set `target_agent = 'competitive-analysis'`.

**Task format:**
```json
{"type": "competitive-analysis", "topic": "KYC verification solutions", "competitors": ["Stripe Identity", "Onfido", "Jumio"]}
```

**Deliverable:** Five-section PM-focused analysis (Situation & Key Findings, Market Map, Competitive Deep-Dive, Voice of Customer, Product Implications & Recommendations). Depth parameter controls scope: `quick`, `standard`, `full`.

See `agents/competitive-analysis.md` for the full agent definition.

---

## Domain Expertise Agent

The domain expertise agent (`agents/domain-expertise.md`) is a **definition-only research agent** that builds domain knowledge PMs need for product decisions. Covers three research types: `domain` (technical/process), `regulatory` (country-specific compliance), `market` (best practices, benchmarks).

**Invocation:** Via `agent_tasks` or direct request. Set `target_agent = 'domain-expertise'`.

**Task format:**
```json
{"type": "domain-research", "topic": "India CKYCR requirements", "research_type": "regulatory", "team": "localization-licensing"}
```

**Key behavior:** Before external research, loads internal context from PPP, agent_log, and team data to identify what's already known and where the gaps are.

See `agents/domain-expertise.md` for the full agent definition.

---

## Hub Countries PM Agent

The hub countries PM agent (`pm_team/hub-countries/`) is the **first PM agent** — it owns CLM performance for the 4 incorporation hub countries: UK, US, Singapore, UAE. Maps to Yael's Localization & Licensing team.

**Commands:** `check-in`, `investigate <country>`, `check-tasks`

**CLI:** `npx tsx pm_team/hub-countries/run.ts <command> [args]`

**Task format:** Set `target_agent = 'hub-countries-pm'` and put a JSON command in `description`:
```json
{"type": "check-in"}
{"type": "investigate", "country": "UK", "topic": "approval rate drop"}
```

**Key concepts:**
- Incorporation hubs have distinct dynamics: entity registers in the hub, beneficial owner may be elsewhere. This affects verification, documents, and regulatory requirements.
- The agent does NOT query Looker directly — it uses the analytics agent for data acquisition.
- Check-in runs flag detection (RED/YELLOW/INFO) and auto-escalates RED flags as `needs-human` tasks.
- Country config (PPP tags, Looker names, log tags) is in `pm_team/hub-countries/lib/country-config.ts`.

See `agents/hub-countries-pm.md` for the full agent definition.

---

## KYC Product PM Agent

The KYC Product PM agent (`pm_team/kyc-product/`) is a **0-to-1 product exploration agent** — it investigates whether Payoneer should productize its KYC capabilities as a standalone B2B service (KYC-as-a-Service).

**Commands:** `research <topic>`, `research status`, `audit`, `synthesize`, `check-tasks`

**CLI:** `npx tsx pm_team/kyc-product/run.ts <command> [args]`

**Task format:** Set `target_agent = 'kyc-product-pm'` and put a JSON command in `description`:
```json
{"type": "research", "topic": "market-sizing"}
{"type": "research", "topic": "competitive-landscape"}
{"type": "research", "topic": "status"}
{"type": "audit"}
{"type": "synthesize", "phase": 1}
```

**Key concepts:**
- Unlike operational PM agents, this one **orchestrates research toward a business case** through a structured 5-phase playbook.
- Phase 1: Market & Competitive Analysis. Phase 2: Internal Capability Audit. Phases 3-5: Gap Analysis, Business Case, Stakeholder Alignment.
- The agent does NOT do research itself — it identifies knowledge gaps, creates tasks for competitive-analysis/domain-expertise agents and `needs-human` tasks for Yonatan, then tracks progress.
- Three moat hypotheses under validation: brand, high-risk country expertise, manual operations fallback.
- Existing enterprise customers: eBay, Best Buy, Etsy.
- Target value proposition: 95%+ decision rate, 99-99.5% accuracy, automated + manual full stack.
- Playbook config (phases, workstreams, data requirements) is in `pm_team/kyc-product/lib/playbook-config.ts`.

See `agents/kyc-product-pm.md` for the full agent definition.
