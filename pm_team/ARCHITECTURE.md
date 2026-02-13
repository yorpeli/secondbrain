# PM Team — Architecture & Implementation

> Last updated: 2026-02-13
> Status: Phase 1 (Foundation) + Phase 2 (Team Lead) + Phase 2.5 (Research Infra) + Phase 3 (Research Agents) + Phase 4 (First PM Agent) + Phase 5 (KYC Product PM) complete

---

## What Exists

The PM Team is an autonomous AI product management team operating inside Claude Code. It uses the Second Brain's Supabase database as its backbone — tasks, findings, and context flow through `agent_tasks` and `agent_log`.

### Infrastructure (Phase 1)

**Enhanced `agent_tasks` table** — four new columns support team coordination:

| Column | Purpose |
|--------|---------|
| `due_date` | Team-lead hygiene detects overdue tasks |
| `result_details` (jsonb) | Structured results for downstream agents to consume without parsing text |
| `parent_task_id` | Workflow chaining — a task can spawn follow-up tasks |
| `updated_at` | Staleness detection (stuck tasks with no recent update) |

Plus indexes on `parent_task_id` and `(status, target_agent)` for performance, and an `update_updated_at` trigger.

**`v_agent_tasks_dashboard` view** — joins `agent_tasks` with `agent_registry` and computes a `health` field:

| Health | Condition |
|--------|-----------|
| `overdue` | Pending + past due date |
| `stuck` | Picked-up + no update in 24h |
| `stale` | Pending + created > 7 days ago |
| `ok` | Everything else |

This is the primary query surface for the hygiene command.

**`lib/tasks.ts`** — shared utilities consolidating the task pickup/claim/complete pattern that was duplicated across `analytics/agent.ts` and `data-viz/agent.ts`. Functions:

- `createTask(input)` → task ID
- `claimTask(taskId, agentSlug)` → boolean
- `completeTask(taskId, summary, details?)` → boolean
- `failTask(taskId, errorSummary)` → boolean
- `getPendingTasks(agentSlug)` → task[]

Uses lazy Supabase import. Existing agents can migrate incrementally.

**`pm_team/workflows.md`** — the Agent SOP. Single source of truth for how agents behave. Covers mission, session start, task lifecycle, communication, knowledge model, onboarding, escalation, governance, and changelog.

**`pm_team/playbook.md`** — shared PM knowledge. Accumulates generalizable learnings across all PM agents. Read on onboarding and session start. Sections: investigation patterns, data gotchas, domain knowledge, stakeholder patterns, tools & techniques, anti-patterns.

### Four-Layer Knowledge Model

| Layer | File | Scope | Update Cadence | Example |
|-------|------|-------|----------------|---------|
| **Business context** | `clm-context.md` | What the business is | Quarterly | "CLM covers KYC, onboarding, compliance. KYC completion rate globally ~23%." |
| **Process** | `workflows.md` | How to operate | On process changes | "Record result_summary on every completed task" |
| **Shared knowledge** | `playbook.md` | What the team has learned | Continuous | "When approval rates drop >5%, check regulatory changes first" |
| **Individual memory** | `{agent}/memory.md` | Domain-specific context | Continuous | "Brazil baseline approval: 72%. FTL normally 14 days." |

**Business context** is the foundational layer — it gives every PM agent the company, domain, team, metric, and constraint knowledge they need before doing any work. It's populated from teams, initiatives, PPP themes, and context_store. Refreshed quarterly or when strategic priorities shift.

**Knowledge flows upward:** An individual PM discovers something → if generalizable, it goes to the playbook → all PMs benefit on their next session start. New PMs read `clm-context.md` first (what the business is), then the playbook (what the team has learned), starting with everything the org knows.

### Team Lead Agent (Phase 2)

Three CLI subcommands, not one monolithic agent. Each is a focused, testable module.

```
pm_team/team-lead/
├── run.ts                 # CLI entry point (mirrors analytics/run.ts pattern)
├── agent.ts               # Task runner (mirrors analytics/agent.ts pattern)
├── commands/
│   ├── hygiene.ts         # Backlog scan — pure SQL, no LLM
│   ├── synthesize.ts      # Cross-agent pattern detection
│   └── enforce.ts         # Workflow compliance checks
└── lib/
    └── types.ts           # Result types for all three commands
```

**CLI:**
```bash
npx tsx pm_team/team-lead/run.ts hygiene [--days=7]
npx tsx pm_team/team-lead/run.ts synthesize [--days=7] [--agents=analytics,data-viz]
npx tsx pm_team/team-lead/run.ts enforce [--workflow=all]
npx tsx pm_team/team-lead/run.ts check-tasks
```

#### `hygiene`
Scans `v_agent_tasks_dashboard` for overdue, stale, stuck, and failed-without-followup tasks. Also flags `needs-human` tasks. Pure SQL — no LLM needed. Writes findings to `agent_log` with tags `['team-lead', 'hygiene']`.

#### `synthesize`
Queries recent `agent_log` entries and completed `agent_tasks` across all agents. Detects recurring themes (via tag frequency), identifies gaps (active agents with no recent log entries), and surfaces recommendations. Writes synthesis to `agent_log` with tags `['team-lead', 'synthesis']`.

#### `enforce`
Checks compliance with `pm_team/workflows.md`:
- Completed tasks have `result_summary` populated
- Active agents have recent `agent_log` entries (30-day window)
- New agents (registered in last 14 days) have at least one log entry
- Failed tasks have follow-up child tasks

Writes compliance report to `agent_log` with tags `['team-lead', 'enforce']`.

---

### Research Infrastructure (Phase 2.5)

**`research_results` table** — dedicated storage for PM domain expertise, competitive analysis, market research, and regulatory knowledge. Separate from `content_sections` (which is read-heavy for human-facing data).

| Column | Purpose |
|--------|---------|
| `topic` | What was researched |
| `research_type` | `domain`, `competitive`, `market`, `regulatory` |
| `agent_slug` | Which agent produced it |
| `summary` | 2-3 sentence executive summary |
| `content` | Full research content (markdown) |
| `source_urls` | URLs consulted |
| `status` | `current`, `stale`, `superseded` |
| `freshness_date` | When last verified |
| `superseded_by` | Points to newer version (self-referential FK) |
| `tags` | For discovery |

**Versioning model:** When research is refreshed, the old row gets `status = 'superseded'` and `superseded_by` pointing to the new row. History is preserved — you can always trace back through versions.

**`v_research_current` view** — joins with `agent_registry` and computes a `freshness` field:

| Freshness | Condition |
|-----------|-----------|
| `fresh` | freshness_date within 30 days |
| `aging` | freshness_date 30-90 days old |
| `needs-refresh` | freshness_date > 90 days old |

**Embedding pipeline:** The `generate-embeddings` edge function (v3) now processes `research_results` as a fourth source (alongside people, content_sections, initiatives). Only `status = 'current'` research is embedded. Entity type in embeddings: `research`.

---

## Key Architecture Decisions

All recorded in `project_decisions` table. The PM-team-specific ones:

1. **Team-lead = three subcommands** — hygiene, synthesize, enforce are separate modules under one CLI, not a monolithic agent. Each can be tested and run independently.

2. **PM workflows in markdown** — `pm_team/workflows.md` is the PM team SOP. Version-controlled, diff-friendly, readable by humans and agents. Note: other workflows (e.g. `workflow_ppp_ingest`) remain in `context_store` as JSON — this decision applies specifically to PM team agent SOPs.

3. **Analytics agent stays as a tool** — the existing analytics agent serves as a data analyst tool, not a promoted "analytics PM." PM agents create tasks targeting it when they need data.

4. **Database-only communication** — agents talk through `agent_tasks` (assignments) and `agent_log` (findings). No direct agent-to-agent function calls. This keeps agents decoupled and allows any entry point (Claude.ai, Claude Code, scheduled jobs) to participate.

5. **Manual invocation only** — no scheduling infrastructure (cron, cloud scheduler). Commands are run manually or via the task runner (`check-tasks`). Scheduling can be added later without changing the agent architecture.

6. **Build the org before you hire** — foundation infrastructure (backlog, memory, workflows, team lead) was built before any PM agents. This ensures every future agent plugs into a working system from day one.

7. **Consolidated task utilities** — `lib/tasks.ts` provides the shared create/claim/complete/fail pattern. New agents import this instead of duplicating the Supabase calls.

8. **Health monitoring via SQL view** — `v_agent_tasks_dashboard` computes task health at query time rather than requiring a separate monitoring process. The team-lead hygiene command simply reads the view.

9. **Dedicated research_results table** — PM domain expertise and competitive analysis stored separately from `content_sections`. Research has its own versioning model (`superseded_by`), freshness tracking, and embedding pipeline integration. This avoids polluting the read-heavy human content table with agent-generated research.

---

## Communication Patterns

```
Agent A                    Supabase                     Agent B
  │                           │                            │
  ├──► INSERT agent_tasks ────►│                            │
  │    (target_agent = B)      │                            │
  │                           │◄──── SELECT pending tasks ──┤
  │                           │      (picked-up)            │
  │                           │◄──── UPDATE done ───────────┤
  │                           │                            │
  │                           │◄──── INSERT agent_log ──────┤
  │◄── SELECT agent_log ──────│      (finding/rec)         │
  │                           │                            │
```

**Yonatan's involvement:** Tasks tagged `needs-human` or with `target_agent = NULL`. The hygiene command surfaces these.

---

### Research Agents (Phase 3)

Research agents are **definition-only** — no TypeScript CLI. The work IS Claude doing web research + reasoning. This pattern differs from the analytics or team-lead agents which have TypeScript implementations.

**Why definition-only?** Research is inherently an LLM task (reading web pages, synthesizing findings, judging quality). A TypeScript wrapper would just be boilerplate. The agent definition in `agents/` IS the agent — it tells Claude what to do, what standards to follow, and where to store results.

**Shared infrastructure:** `lib/research.ts` provides storage utilities for any research agent:
- `storeResearch()` — stores results in `research_results`, auto-supersedes previous entries on the same topic + type
- `getExistingResearch()` — checks what's already known before starting new research
- `markStale()` — flags outdated research

#### Competitive Analysis Agent

Outward-looking: "What are competitors doing, and what should we do about it?" Produces PM-focused competitive intelligence with five sections:
1. Situation & Key Findings (with "so what" for the PM's area)
2. Market Map (MECE segmentation with gap/opportunity column)
3. Competitive Deep-Dive (how competitors solve the problem, not just that they do)
4. Voice of Customer (pain points, praised features, unmet needs)
5. Product Implications & Recommendations (specific actions with effort signal and priority)

**Key design decisions:**
- Payoneer CLM context as defaults, fully overridable
- Evidence standards: `[Fact]` / `[Inference]` / `[Hypothesis]`, triangulation, source/query logs
- Depth parameter (`quick` / `standard` / `full`) — quick produces a focused snapshot with feature comparison table, not just a summary
- Loads team/initiative context to frame findings for the specific PM's decisions
- Results stored in `research_results` with `research_type = 'competitive'`

See `agents/competitive-analysis.md` for the full definition.

#### Domain Expertise Agent

Inward-looking: "What do I need to understand about [topic] to make good product decisions?" Builds the knowledge PMs need in three research types:
- **`domain`** — technical/process knowledge (document orchestration, OCR vendor integration, lead scoring models)
- **`regulatory`** — country-specific compliance (India CKYCR, Canada EFT, EU MiCA, US eKYB)
- **`market`** — industry trends, benchmarks, best practices (KYC completion rates, vendor pricing models, onboarding patterns)

Deliverable structure:
1. What This Is (plain-language explanation)
2. Why It Matters for [Team/Initiative] (connected to real workstreams)
3. How It Works (detail level appropriate for product decisions)
4. Current State at Payoneer (pulls from PPP, agent_log, initiatives)
5. Key Considerations for Product Decisions (risks, decision points, dependencies)
6. Open Questions & Next Steps (specific people to consult, follow-up research)

**Key design decisions:**
- Starts with internal context (PPP, agent_log, team data) before external research — identifies what's already known and where the gaps are
- Specificity over breadth: "RBI requires V-CIP for PPI above INR 10,000" not "India requires KYC"
- Source preference hierarchy: primary (regulator sites, official docs) > authoritative secondary (law firms, Big 4) > commentary > community
- Three depth modes: `quick` (fast knowledge brief for unfamiliar terms), `standard` (working knowledge), `deep` (comprehensive with implementation considerations)

See `agents/domain-expertise.md` for the full definition.

#### Research Agent Scope Split

The two research agents together replace the original generic `agents/research.md`:
- **Competitive analysis** owns `research_type = 'competitive'` — "what are competitors doing?"
- **Domain expertise** owns `research_type = 'domain' | 'regulatory' | 'market'` — "what do I need to know?"

Both use `lib/research.ts` for storage. Both load team/initiative context. Both follow the same evidence standards.

---

### Hub Countries PM Agent (Phase 4)

The first PM agent in the team. Owns CLM performance for the 4 incorporation hub countries: UK, US, Singapore, UAE. Maps to Yael Feldhiem's Localization & Licensing team.

```
pm_team/hub-countries/
├── run.ts                    # CLI entry point (mirrors team-lead/run.ts pattern)
├── agent.ts                  # Task runner (mirrors team-lead/agent.ts pattern)
├── commands/
│   ├── check-in.ts           # Weekly routine: PPP + analytics + flags
│   └── investigate.ts        # Directed country investigation
├── lib/
│   ├── types.ts              # Result types for all commands
│   └── country-config.ts     # Hub country definitions (names, tags, Looker names)
└── memory.md                 # Individual PM memory (baselines, migration status)

agents/hub-countries-pm.md    # Full agent definition
```

**Why incorporation hubs?** These are countries where companies *incorporate* — the entity is registered in the hub, but beneficial owners may be elsewhere. This creates distinct product challenges: cross-border verification, hub-specific licensing, different document requirements. It's a well-bounded PM scope with clear metrics.

#### `check-in`

Weekly routine. Gathers data for all 4 hub countries in parallel:
1. PPP sections (matched by country tags via `overlaps`)
2. Analytics agent findings (from agent_log)
3. Completed analytics tasks (from agent_tasks, filtered client-side by country name)
4. Current research (from research_results)
5. All recent agent_log entries tagged with the country

**Flag detection** — 8 rules ranging from PPP status regression (RED) to stale analytics (YELLOW) to research aging (INFO). RED flags auto-create `needs-human` tasks for Yonatan.

Pure SQL + programmatic analysis — no LLM needed.

#### `investigate`

Directed deep-dive into a specific country, optionally filtered by topic. Deeper than check-in: 4 weeks of PPP history, 30-day agent_log window, trend analysis (improving/declining/stable from PPP status trajectory), broader research search.

Produces: structured investigation with data, trends, flags, open questions, and recommended actions.

#### Key design decisions

1. **Country config is self-contained** — `country-config.ts` duplicates Looker names from analytics rather than importing them. PM agent independence from analytics internals.

2. **No brief command in TypeScript** — briefs require LLM reasoning (synthesis, recommendations, formatting). The agent definition in `agents/hub-countries-pm.md` describes how Claude should produce briefs using the `/docx` skill and data-viz agent. TypeScript commands provide the data foundation.

3. **Lazy Supabase imports** — follows the established pattern from lib/tasks.ts and team-lead. Every DB accessor is a separate async function.

4. **Client-side filtering for analytics tasks** — Supabase's PostgREST doesn't support ILIKE on description easily. Analytics tasks are fetched broadly then filtered in TypeScript by country name/code.

---

### KYC Product PM Agent (Phase 5)

A fundamentally different PM agent — **0-to-1 product exploration** rather than operational monitoring. Investigates whether Payoneer should productize its KYC capabilities as a standalone B2B service.

```
pm_team/kyc-product/
├── run.ts                    # CLI entry point
├── agent.ts                  # Task runner
├── commands/
│   ├── research.ts           # Research orchestration (checks knowledge, creates tasks)
│   ├── audit.ts              # Internal capability audit (gathers system data, flags gaps)
│   └── synthesize.ts         # Synthesis report (phase progress, moat validation)
├── lib/
│   ├── types.ts              # Result types for all commands
│   └── playbook-config.ts    # Phase definitions, research workstreams
└── memory.md                 # Thesis, moat hypotheses, research tracker

agents/kyc-product-pm.md      # Full agent definition
```

**Why this is different from hub-countries:**
- Hub-countries **monitors** existing operations (PPP, analytics, flags)
- KYC Product **orchestrates research** toward building a business case
- Hub-countries queries data and detects anomalies
- KYC Product identifies knowledge gaps, creates tasks for other agents and humans, tracks progressive knowledge building

#### `research <topic>`

Orchestrates a research workstream. Does NOT do the research itself — it:
1. Checks existing knowledge (research_results, agent_log, completed tasks)
2. Identifies gaps (what's missing, who can provide it)
3. Creates tasks for competitive-analysis, domain-expertise agents, or Yonatan (needs-human)
4. Reports current status and recommendations

Also supports `research status` — shows progress across all workstreams.

Phase 1 topics: `market-sizing`, `competitive-landscape`, `customer-segments`, `existing-customers`
Phase 2 topics: `capabilities`, `manual-ops`, `performance`, `cost-structure`

#### `audit`

Internal capability assessment. Gathers KYC-related data from across the system (PPP sections, analytics results, agent findings, research). Maps 6 capability areas (Verification Flows, Country Coverage, Vendor Integrations, Manual Operations, Performance Metrics, Technology Stack) with known facts, system data, and gaps. Creates grouped `needs-human` tasks for data only Yonatan can provide.

#### `synthesize`

Pulls everything together: phase progress, moat hypothesis validation, pending human tasks, next steps. Produces a state-of-knowledge report.

#### Playbook structure

Five phases with defined workstreams (Phases 1-2) and dynamic workstreams (Phases 3-5):

| Phase | Name | Workstreams |
|-------|------|-------------|
| 1 | Market & Competitive Analysis | market-sizing, competitive-landscape, customer-segments, existing-customers |
| 2 | Internal Capability Audit | capabilities, manual-ops, performance, cost-structure |
| 3 | Gap Analysis & Product Definition | Dynamic (depends on Phase 1+2) |
| 4 | Business Case | Dynamic |
| 5 | Stakeholder Alignment | Dynamic |

Each workstream has: searchTags (for DB discovery), requiredAgents (who can research it), humanDataNeeded (what only Yonatan can provide).

#### Key design decisions

1. **Orchestrator, not researcher** — the agent manages the research process, not the research itself. Competitive analysis and domain expertise agents do the actual research. The agent's job is gap analysis, task creation, and synthesis.

2. **Structured playbook with phases** — unlike hub-countries which runs the same check-in cycle, this agent progresses through phases toward a defined outcome (business case for leadership).

3. **Three moat hypotheses as first-class concept** — brand, high-risk expertise, and manual ops fallback are tracked explicitly in memory.md and validated in synthesis reports.

4. **Grouped human task creation** — rather than creating dozens of individual tasks, the audit command groups data gaps by capability area into single tasks (6 tasks for Yonatan, not 26).

5. **Existing customer context** — eBay, Best Buy, Etsy are documented as proof points in memory.md, with specific data gaps identified for each.

---

## What's Next (Phase 6+)

Per the vision in `pmTeamContext.md`:
- **More PM agents** — each owning a specific metric, segment, or area (e.g., KYC completion rate PM, onboarding conversion PM)
- **Cross-PM coordination** — team-lead synthesize command already detects cross-agent patterns. As more PMs come online, this becomes more valuable.
- **KYC Product PM progression** — as Phases 1-2 complete, the agent evolves to produce gap analysis, business case artifacts, and stakeholder alignment materials
- **AI adoption** — using the PM team's outputs to demonstrate AI value to the human PM team

The infrastructure built in Phases 1-5 is designed to make adding new agents trivial: create an agent definition in `agents/`, register in `agent_registry`, add a `pm_team/{agent}/` directory following the established patterns, and follow `pm_team/workflows.md`.
