# Second Brain — Claude Code Project Guide

## Project Context

### Who This Serves

Yonatan Orpeli — VP of Product at Payoneer, leading the CLM (Customer Lifecycle Management) domain. He manages a ~21-person product organization: 6 direct reports leading 5 product teams, plus 11 skip-level ICs. He started in August 2024, coming from 5 years as Senior Director of Product at Forter.

CLM covers the full customer lifecycle at Payoneer: KYC (know-your-customer) verification, onboarding, compliance, localization & licensing, and policy & eligibility. This involves coordinating across a 350-person manual review operation, multiple external vendors, and country-specific regulatory requirements.

### What This System Does

The Second Brain is Yonatan's knowledge management system — it maintains the context a product leader needs across dozens of relationships, initiatives, and workstreams. Concretely:

- **People context**: Working styles, strengths, growth areas, coaching history, and current focus for every person in the org. This enables better 1:1s, delegation, and development conversations.
- **Meeting continuity**: Discussion notes, action items, and follow-ups persist across meetings. Nothing falls through the cracks.
- **Initiative tracking**: Strategic initiatives with owners, stakeholders, task breakdowns, and status.
- **Weekly status analysis (PPP)**: The CLM org produces a weekly Progress/Problems/Plans deck. The system ingests it, scores quality, tags themes, and enables week-over-week pattern detection.
- **Organizational memory**: Decisions, insights, and context that would otherwise be lost between conversations.

### What Matters

Yonatan's leadership philosophy shapes what the system optimizes for:

- **Context preservation**: "I can't fix what I don't know." The system exists to ensure nothing important is forgotten or missed.
- **Early signal detection**: Patterns across PPP reports, accumulating delays, recurring blockers — surfacing these before they become crises.
- **PM development**: Tracking growth areas, coaching conversations, and quality of work product over time. Team capability is the output, not just shipped features.
- **Data-informed, not data-driven**: Metrics matter, but understanding WHY matters more. Analysis should surface insight, not just numbers.

### The Org

Six direct reports, five teams:

| Lead | Team | Scope |
|------|------|-------|
| Elad Schnarch (Principal PM) | KYC Service | KYC verification flows, vendor management, new country rollouts |
| Ira Martinenko (Principal PM) | Self-Service | Self-service onboarding, lead scoring, full rollout |
| Yael Feldhiem (Product Director) | Localization & Licensing | Country localization, licensing, India expansion |
| Ido Seter (Senior PM) | Policy & Eligibility | Compliance policies, eligibility rules |
| Meital Lahat Dekter (Senior Director) | Delegated Onboarding | Partner/delegated onboarding flows |
| Yaniv Oved (Principal PSM) | Product Solutions | Cross-cutting product solutions and strategy |

Yonatan reports to Yaron Zakai Or (SVP Product) who reports to Oren Ryngler (CPO).

### Current State (Dynamic)

The system maintains a `current_focus` key in `context_store` that reflects Yonatan's live priorities, watching items, blockers, and open loops. **Agents should read this** when their work touches strategic context — it tells you what matters right now, not just what exists in the schema.

```sql
SELECT content FROM context_store WHERE key = 'current_focus';
```

---

## Architecture

Two entry points share one Supabase Postgres database:

```
┌─────────────────────┐     ┌─────────────────────────────┐
│   Claude.ai Chat    │     │        Claude Code           │
│   (The Brain)       │     │        (The Hands)           │
│                     │     │                              │
│ - Conversations     │     │ - Scripts & agents           │
│ - Meeting prep      │     │ - PPP ingestion              │
│ - Decision support  │     │ - Data processing            │
│ - Context synthesis │     │ - Scheduled automation       │
│ - Workflow execution│     │ - Sub-agents (research, etc) │
└────────┬────────────┘     └──────────┬──────────────────┘
         │                             │
         └──────────┬──────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Supabase Postgres  │
         │  (Source of Truth)  │
         │                     │
         │  + Edge Functions   │
         │  + Vector Search    │
         └─────────────────────┘
```

**Key principle:** The database is the shared backbone. Neither entry point owns the data. Claude.ai handles conversational interaction and human decision-making. Claude Code handles automation, scripts, and programmatic tasks. Both read and write the same tables.

---

## Agents

Fourteen agents across two teams, each with a CLI entry point or definition doc. For full details (commands, task formats, key concepts), see [docs/agents.md](docs/agents.md).

### PM Team & Infrastructure Agents

| Agent | `target_agent` slug | Directory | Purpose |
|-------|---------------------|-----------|---------|
| Analytics | `analytics` | `analytics/` | Looker-based CLM funnel analysis |
| Data-Viz | *(subagent, no tasks)* | `data-viz/` | Chart rendering for visual storytelling |
| PPP Ingest | `ppp-ingest` | `ppp/` | Local PPP deck processing → DB writes |
| Team Lead | `team-lead` | `pm_team/team-lead/` | Task hygiene, cross-agent synthesis, convention enforcement |
| Hub Countries PM | `hub-countries-pm` | `pm_team/hub-countries/` | CLM performance for UK, US, Singapore, UAE |
| KYC Product PM | `kyc-product-pm` | `pm_team/kyc-product/` | 0-to-1 KYC-as-a-Service exploration |
| Competitive Analysis | `competitive-analysis` | `agents/competitive-analysis.md` | Definition-only research agent (no CLI) |
| Domain Expertise | `domain-expertise` | `agents/domain-expertise.md` | Definition-only research agent (no CLI) |
| Initiative Tracker | `initiative-tracker` | `agents/initiative-tracker.md` | Keeps initiative memory docs current from PPP, meetings, decisions (no CLI yet) |
| Q-Plan PM | `q-plan-pm` | `pm_team/q-plan/` | Quarterly plan ingestion, progress tracking, gap analysis, quarter reviews |
| AB Testing | `ab-testing` | `ab-testing/` | CLM experiment registry, Looker-based statistical analysis, Asana lifecycle tracking |

### Dev Team (UI App)

| Agent | `target_agent` slug | Directory | Purpose |
|-------|---------------------|-----------|---------|
| Dev Team Lead | `dev-team-lead` | `dev_team/team-lead/` | Plans features, delegates to engineers, reviews work |
| App Architect | `dev-architect` | `agents/app-architect.md` | Definition-only design/architecture guidance |
| App Designer | `dev-designer` | `agents/dev-designer.md` | Definition-only UX/UI design, design system, usability |
| Frontend Engineer | `dev-frontend` | `dev_team/frontend/` | React components, pages, styling, layout |
| Backend Engineer | `dev-backend` | `dev_team/backend/` | Tanstack Query hooks, Supabase queries, types |

**CLI pattern:** All TypeScript agents use `npx tsx {dir}/run.ts <command>`. Task runners are `{dir}/agent.ts`.

**PM Team knowledge model:** `pm_team/clm-context.md` (business context) → `pm_team/workflows.md` (process) → `pm_team/playbook.md` (shared learnings) → `{agent}/memory.md` (individual memory).

**Dev Team knowledge model:** `dev_team/app-context.md` (app context) → `dev_team/workflows.md` (process) → `dev_team/playbook.md` (shared learnings) → `{agent}/memory.md` (individual memory). Dev team workflow: Yonatan → Team Lead (plan) → Architect (technical design) + Designer (UX/UI design) consulted → approved → Team Lead (delegate) → Engineers build → Designer (design review) + Team Lead (code review).

### Shared Utilities

`lib/tasks.ts` consolidates the task pickup/claim/complete pattern used by agent task runners. Functions: `createTask()`, `claimTask()`, `completeTask()`, `failTask()`, `getPendingTasks()`. Uses lazy Supabase import.

`lib/research.ts` provides shared research storage and versioning for any research agent. Functions: `storeResearch()` (auto-supersedes existing entries), `getExistingResearch()`, `markStale()`. Uses lazy Supabase import.

`lib/embeddings.ts` provides embedding generation and semantic search utilities. Functions: `generateEmbeddingVector()`, `upsertEmbedding()`, `batchEmbed()`, `deleteEmbeddings()`, `deterministicUuid()`, `searchByType()`. Uses lazy Supabase import + raw fetch to OpenAI.

### Key Files

| Need to... | Look in |
|------------|---------|
| Initialize Supabase client | `lib/supabase.ts` |
| Create/claim/complete agent tasks | `lib/tasks.ts` |
| Store/version research results | `lib/research.ts` |
| Generate/search embeddings | `lib/embeddings.ts` |
| Batch-embed agent_log + playbooks | `scripts/generate-embeddings.ts` |
| Brand colors, fonts, table styles (docx) | `lib/doc-style.ts` |
| Embed charts in docx | `lib/chart-embed.ts` |
| Agent logging helpers | `lib/logging.ts` |
| TypeScript types | `lib/types.ts` |
| Agent definition docs | `agents/*.md` |
| Edge function source | `supabase/functions/{name}/` |
| Standalone scripts | `scripts/` |

Full file tree: [docs/project-structure.md](docs/project-structure.md)

---

## Supabase Connection

- **Project ref:** `tjlcdwsckbbkedyzrzda`
- **URL:** `https://tjlcdwsckbbkedyzrzda.supabase.co`
- **API URL:** `https://tjlcdwsckbbkedyzrzda.supabase.co/rest/v1/`
- **Edge Functions:** `https://tjlcdwsckbbkedyzrzda.supabase.co/functions/v1/`

```bash
# Required environment variables (.env — never commit)
SUPABASE_URL=https://tjlcdwsckbbkedyzrzda.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OPENAI_API_KEY=<for-embeddings-only>
```

Use `@supabase/supabase-js` with the service role key for all DB access. Never hardcode keys or UUIDs.

---

## Database Overview

The database has 27 tables organized into five domains. For full column definitions, see [docs/schema.md](docs/schema.md).

1. **Core Entities** — `people`, `teams`, `team_members`, `initiatives`, `initiative_stakeholders`, `tasks`, `task_dependencies`, `products`
2. **Meetings & Notes** — `meetings`, `meeting_attendees`, `meeting_action_items`, `content_sections`, `performance_reviews`
3. **PPP (Weekly Status)** — `ppp_reports`, `ppp_sections`
4. **Quarterly Plans** — `quarterly_plans`, `quarterly_plan_items`, `quarterly_plan_deliverables`
5. **Agent Infrastructure** — `agent_log`, `agent_tasks`, `agent_registry`, `research_results`, `project_decisions`, `agent_coordination`

Plus: `context_store` (key-value working memory), `conversations_log`, `embeddings` (vector search), `tags`/`entity_tags`.

### Database Views

Pre-joined queries for common lookups. **Always prefer a view over a raw multi-table query when one exists.**

| View | Returns | Use For |
|------|---------|---------|
| `v_org_tree` | People with team + manager resolved | Person lookups, org queries |
| `v_person_teams` | All team memberships per person | Cross-team context |
| `v_open_action_items` | Open action items with meeting context | "What's pending?" |
| `v_meetings_with_attendees` | Meetings with attendee arrays | Meeting history |
| `v_initiative_dashboard` | Initiatives with task status counts | Initiative status |
| `v_team_overview` | Teams with leader, members, counts | Team summaries |
| `v_content_with_entity` | Content sections with parent entity name | Notes, coaching logs |
| `v_ppp_swimlanes` | PPP sections with lead name resolved | PPP analysis |
| `v_ppp_week_comparison` | Current vs previous week per swimlane | Week-over-week diffs |
| `v_agent_tasks_dashboard` | Agent tasks with health status + registry info | Task monitoring, hygiene |
| `v_research_current` | Current research with agent name + freshness | Research lookup, PM onboarding |
| `v_quarterly_plan_progress` | Plan items with deliverable rollup counts | Q plan tracking, progress dashboards |

---

## Conventions

### Identifiers
- **Slugs** are the human-readable identifiers: `elad-schnarch`, `kyc-service`, `ppp-ingest`
- **UUIDs** are the database PKs. Never hardcode them — always look up by slug or name
- **People resolution:** Use `slug` for exact match, `name ILIKE '%term%'` for fuzzy

### Data Sensitivity

Three levels of sensitivity exist in the data:

| Level | Where | Rule |
|-------|-------|------|
| **Private notes** | `meetings.private_notes`, `content_sections.is_private = true`, `ppp_reports.private_notes` | Never surface unless explicitly requested |
| **Performance data** | `performance_reviews`, `people.growth_areas`, coaching logs | Handle with discretion |
| **General** | Everything else | Normal access |

**Hard rule:** Private content is never embedded, never included in summaries, never exposed to other agents without explicit instruction.

### Writing Data

- Always look up IDs dynamically — never hardcode UUIDs
- Set `updated_at = now()` on any UPDATE
- For human-facing data (people, tasks, initiatives): confirm before writing
- For agent infrastructure (agent_log, agent_tasks): write freely, that's what it's for
- Use `execute_sql` for data operations (INSERT/UPDATE/DELETE)
- Use `apply_migration` only for DDL (schema changes)

### Context Library

The `context/` directory contains domain reference documents (CLM funnel, data models, Looker guides, etc.) contributed by subject-matter experts. Each file has YAML frontmatter:

```yaml
---
summary: One-line description of what's in the file
topics: [clm-funnel, data-analysis, onboarding]
agents: [analytics, hub-countries-pm]
---
```

**Agent startup convention:** Before running a command, scan frontmatter of all `context/**/*.md` files (organized by contributor subfolder). Load any file where your agent slug appears in `agents` or where `topics` overlap with your current task. This is cheap (read ~6 lines per file) and ensures agents pick up new context docs automatically.

### Agent Behavior

- **Context library:** On startup, scan `context/**/*.md` frontmatter and load matching files (see Context Library section above)
- **Log threshold:** Only log to `agent_log` when something is substantial enough that another agent or human would benefit from knowing it
- **Task lifecycle:** Check `agent_tasks` for pending work → set status to `picked-up` → do work → set `done`/`failed` with `result_summary`
- **Project decisions:** Always check `project_decisions WHERE status = 'active'` before making architectural choices
- **Namespace separation:** Human data in `conversations_log`, `tasks`, `meetings`. Agent data in `agent_log`, `agent_tasks`. Don't cross-contaminate.
- **Cross-agent discovery:** Use `searchByType(query, ['agent_log'])` from `lib/embeddings.ts` to find relevant findings/recommendations from other agents. Use `searchByType(query, ['playbook'])` for institutional knowledge.
- **Self-registration (optional):** On first run, an agent can INSERT into `agent_registry` to make itself discoverable. Not required.

### Agent Coordination Protocol

The `agent_coordination` table is the async communication channel between Claude Code, Claude Chat, and Yonatan. It's a threaded message board — not a real-time chat.

**When to check:** Only when Yonatan explicitly asks (e.g., "check the coordination table", "load Claude Chat's messages"). Not automatic at session start.

**When to write:**
- **After system changes:** Schema migrations, edge function deployments, bug fixes, config changes — anything that alters how the system works. Use `category = 'change-log'`.
- **When something affects Claude Chat:** If a change impacts data Claude Chat reads, workflows it triggers, or conventions it follows, post it. Don't fix things silently if the other agent relies on them.
- **Suggestions and questions:** Use `category = 'suggestion'` or `'question'` when proposing changes or needing input from Claude Chat or Yonatan.
- **Context sharing:** Product decisions, priority changes, or architectural choices that emerged in a session — use `category = 'context-share'` or `'priority-shift'`.

**Threading:**
- Root messages: `parent_id IS NULL`, include a `subject`.
- Replies: `parent_id` points to the root message's `id`. No subject needed.
- Don't create new root messages for replies to existing threads.

**Status lifecycle:** `open` → `acknowledged` → `resolved` or `wont-do`. When resolving, post a reply explaining what was done, then update the root message's status.

**Source:** Always use `source = 'claude-code'`.

### PPP Conventions

The PPP workflow has a detailed specification stored in `context_store` key `workflow_ppp_ingest`. Key points:
- Swimlane-level tracking, not item-level
- Status values: `on-track`, `potential-issues`, `at-risk`, `na`
- Quality scores: 1-5 (specificity, metrics, actionability)
- Tags follow a dictionary: countries, vendors, themes, domains
- Raw text preserved alongside Claude-generated summaries
- Week-over-week comparison via `v_ppp_week_comparison` view

### Initiative Memory

Each initiative has a **living memory document** stored as a `content_sections` row with `entity_type = 'initiative'`, `section_type = 'memory'`, and `entity_id` pointing to the initiative. This is the single source of truth for accumulated context on an initiative — decisions, blockers, stakeholders, timeline, and signals.

**Structure:** Every initiative memory follows this template:

```markdown
## Status
Current state, owner, escalation path

## Hard Deadlines
Date-driven commitments (regulatory, contractual, org)

## Key Decisions
[date] Decision and rationale — append-only log

## Open Questions
Unresolved items that need answers

## Blockers & Risks
Active blockers with owners and mitigation status

## Stakeholders
People involved and their roles in this initiative

## Timeline of Key Events
[date] What happened — append-only log

## PPP Signals (week-over-week)
Weekly status summary from PPP reports
```

**Reading:** `SELECT content FROM content_sections WHERE entity_id = '{initiative_id}' AND section_type = 'memory'`

**Updating:** When new information arrives (PPP ingestion, meeting notes, decisions, escalations), UPDATE the memory doc — don't create a new row. Append to the relevant section. Always update the `date` field to today and `updated_at = now()`.

**Separate artifacts:** Point-in-time documents (meeting notes, escalation memos, handover plans) are stored as separate `content_sections` rows linked to the same `entity_id`. The memory doc references them but doesn't duplicate their content.

**Privacy:** If an initiative has private context, use `is_private = true` on the specific content_section. The memory doc itself should remain non-private and contain only shareable content.

**PM Agent Assignment:** Every initiative has an `assigned_agent` field (text, nullable) that links it to a PM agent from the PM team (`hub-countries-pm`, `kyc-product-pm`, `team-lead`). The assigned agent is responsible for tracking the initiative — using the memory doc for check-ins, investigations, and synthesis. Initiatives with `assigned_agent = NULL` are flagged as **needs-to-assign**. Query unassigned initiatives:

```sql
SELECT slug, title, priority FROM initiatives WHERE status = 'active' AND assigned_agent IS NULL;
```

The Initiative Tracker agent (`agents/initiative-tracker.md`) keeps memory docs current and notifies the assigned PM agent when status changes, new blockers appear, or deadlines approach.

### Embedding Conventions

- Model: OpenAI `text-embedding-3-small`
- Entity types: `person`, `initiative`, `initiative_memory`, `research`, `agent_log`, `playbook`, `ppp`
- **All entity types** are embedded via the local script: `npm run embed:all` (or individual modes: `embed:agent-log`, `embed:playbooks`, `embed:ppp`, `embed:person`, `embed:initiative`, `embed:initiative-memory`, `embed:research`)
- `logFinding()` and `logRecommendation()` auto-embed new entries (fire-and-forget). Pass `autoEmbed: true` to `logAgent()` for other categories.
- Private content (`is_private = true`) is never embedded. Person-related agent_log entries embed only the summary, not details. PPP `private_notes` are never embedded.
- Use `search_knowledge()` DB function for raw vector queries
- Use `searchByType(query, ['agent_log', 'ppp'])` from `lib/embeddings.ts` for typed semantic search across specific entity types
- PM agent commands (check-in, investigate, research, synthesize, enrich) use `searchByType()` to augment SQL results with semantic context. Embedding failures are caught and never break agent commands.

---

## Quick Reference: Useful Queries

```sql
-- Active project decisions (read before making architectural choices)
SELECT title, description FROM project_decisions WHERE status = 'active';

-- Pending agent tasks for a specific agent
SELECT * FROM agent_tasks WHERE target_agent = '{my-slug}' AND status = 'pending';

-- Recent agent observations
SELECT agent_slug, category, summary, created_at
FROM agent_log ORDER BY created_at DESC LIMIT 20;

-- Current priorities (what matters to Yonatan right now)
SELECT content FROM context_store WHERE key = 'current_focus';

-- Person lookup
SELECT * FROM v_org_tree WHERE name ILIKE '%{name}%';

-- PPP latest week
SELECT * FROM v_ppp_swimlanes WHERE week_date = (SELECT MAX(week_date) FROM ppp_reports);

-- Open human action items
SELECT * FROM v_open_action_items;

-- Full context for meeting prep
SELECT * FROM v_meetings_with_attendees WHERE '{slug}' = ANY(attendee_slugs) ORDER BY date DESC LIMIT 5;

-- Initiative memory (living doc for a specific initiative)
SELECT cs.content FROM content_sections cs
JOIN initiatives i ON cs.entity_id = i.id
WHERE i.slug = '{initiative-slug}' AND cs.section_type = 'memory';

-- All initiative memories overview
SELECT i.title, i.slug, i.status, i.priority, cs.updated_at as memory_last_updated
FROM initiatives i
LEFT JOIN content_sections cs ON cs.entity_id = i.id AND cs.section_type = 'memory'
ORDER BY i.priority, i.title;
```

---

## Deep-Dive References

| Doc | What's in it | When to read |
|-----|-------------|--------------|
| [docs/schema.md](docs/schema.md) | Full table definitions, column types, views, functions, edge functions, ER diagram | Writing queries, building features, schema changes |
| [docs/agents.md](docs/agents.md) | Agent CLI commands, task formats, key concepts, environment requirements | Running or extending agents |
| [docs/project-structure.md](docs/project-structure.md) | Full file tree | Finding files, understanding codebase layout |
