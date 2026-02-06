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

### Analytics Agent

The analytics agent (`analytics/`) queries Payoneer's Looker dashboards to analyze CLM funnel performance. It can be invoked via CLI or picked up as an `agent_task`.

**Commands:** `scan-opportunities`, `compare <country>`, `deep-dive <country>`, `diagnose <country>`, `check-tasks`

**CLI:** `npx tsx analytics/run.ts <command> [args]`

**Task format:** Set `target_agent = 'analytics'` and put a JSON command in `description`:
```json
{"type": "deep-dive", "country": "Brazil"}
```

**Key concept — GLPS-adjusted approval rate:** The 4Step approval rate is adjusted using the GLPS qualification funnel. This is the primary metric for CLM vs 4Step comparison. See `analytics/lib/data-utils.ts:calculateAccountsApprovedGLPS()`.

**Environment:** Requires `LOOKER_BASE_URL`, `LOOKER_CLIENT_ID`, `LOOKER_CLIENT_SECRET`. See `agents/analytics.md` for full documentation.

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

## Database Schema

### Table Groups

The database has 24 tables organized into four domains:

1. **Core Entities** — People, teams, initiatives, tasks, products
2. **Meetings & Notes** — Meeting records, attendees, action items, content sections
3. **PPP (Weekly Status)** — Reports and swimlane sections
4. **Agent Infrastructure** — Agent log, tasks, registry, project decisions

Plus: context_store (key-value working memory), embeddings (vector search), performance_reviews, tags.

---

### Core Entity Tables

#### `people` (34 active rows)
The central entity. Everyone Yonatan works with.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `slug` | text UNIQUE | Identifier, e.g. `elad-schnarch` |
| `name` | text | Full name |
| `type` | text | `direct-report` · `skip-level` · `internal` · `external` · `leadership` |
| `role` | text | Job title |
| `team_id` | uuid FK → teams | Primary team assignment |
| `reports_to_id` | uuid FK → people | Manager (self-referential) |
| `status` | text | `active` (default). Filter on this — inactive people exist. |
| `working_style` | text | How they operate, communication preferences |
| `strengths` | text[] | Array of strength areas |
| `growth_areas` | text[] | Array of development areas |
| `relationship_notes` | text | Yonatan's notes on the working relationship |
| `current_focus` | text | What they're currently working on |
| `email` | text | |
| `slack` | text | |
| `started_date` | date | When they joined |

**Relationships:** Referenced by nearly every other table. Has FK to self (reports_to_id) and teams (team_id).

#### `teams` (6 active rows)
Product teams in the CLM org.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `slug` | text UNIQUE | e.g. `kyc-service` |
| `name` | text | |
| `mission` | text | Team's mission statement |
| `north_star_metric` | text | Primary success metric |
| `scope` | text[] | What the team owns |
| `leader_id` | uuid FK → people | Team lead |
| `status` | text | `active` (default) |

#### `team_members` (17 rows)
Many-to-many mapping of people to teams. A person can be on multiple teams.

| Column | Type | Description |
|--------|------|-------------|
| `team_id` | uuid FK → teams | |
| `person_id` | uuid FK → people | |
| `role` | text | `lead` or `member` (convention, not enforced) |

#### `initiatives` (3 rows)
Strategic initiatives tracked across the org.

| Column | Type | Description |
|--------|------|-------------|
| `slug` | text UNIQUE | |
| `title` | text | |
| `status` | text | `planned` · `active` · `exploration` · `blocked` · `completed` · `abandoned` |
| `priority` | text | `P0` · `P1` · `P2` |
| `owner_id` | uuid FK → people | |
| `objective` | text | What it aims to achieve |
| `why_it_matters` | text | Strategic rationale |
| `start_date` / `target_date` | date | Timeline |

#### `initiative_stakeholders` (13 rows)
Links people to initiatives with their role in that initiative.

#### `tasks` (17 rows)
Specific deliverables, optionally linked to initiatives.

| Column | Type | Description |
|--------|------|-------------|
| `slug` | text UNIQUE | |
| `title` | text | |
| `status` | text | `todo` · `in-progress` · `blocked` · `done` |
| `priority` | text | `P0` · `P1` · `P2` |
| `owner_id` | uuid FK → people | |
| `initiative_id` | uuid FK → initiatives | Optional link |
| `parent_task_id` | uuid FK → tasks | Optional, for sub-task hierarchy |
| `due_date` | date | |

**Note:** These are HUMAN tasks — things Yonatan's team is working on. Agent work items go in `agent_tasks`.

#### `task_dependencies` (0 rows)
Tracks blocking relationships between tasks. `task_id` is blocked by `blocked_by_task_id`.

#### `products` (0 rows — placeholder)
Product entities. Schema exists but not yet populated.

---

### Meetings & Notes

#### `meetings` (22 rows)
Meeting records with notes.

| Column | Type | Description |
|--------|------|-------------|
| `meeting_type` | text | `1on1` · `team` · `leadership` · `external` · `project` |
| `date` | date | |
| `topic` | text | |
| `purpose` | text | |
| `discussion_notes` | text | What was discussed |
| `private_notes` | text | ⚠️ SENSITIVE — Yonatan's private observations. Never surface casually. |

#### `meeting_attendees` (26 rows)
Links people to meetings. Many-to-many.

#### `meeting_action_items` (13 rows)
Follow-ups from meetings.

| Column | Type | Description |
|--------|------|-------------|
| `meeting_id` | uuid FK → meetings | |
| `owner_id` | uuid FK → people | Who's responsible |
| `description` | text | |
| `status` | text | `open` · `done` |
| `due_date` | date | |

#### `content_sections` (9 rows)
Rich content attached to any entity — coaching logs, development plans, notes.

| Column | Type | Description |
|--------|------|-------------|
| `entity_type` | text | `person`, `initiative`, etc. |
| `entity_id` | uuid | FK to the parent entity |
| `section_type` | text | e.g. `coaching-log`, `dev-plan`, `note` |
| `content` | text | The actual content |
| `is_private` | boolean | ⚠️ If true, never embed or surface without explicit request |
| `date` | date | |

#### `performance_reviews` (2 rows)
Annual/periodic performance reviews. ⚠️ **SENSITIVE** — Performance data requires discretion.

| Column | Type | Description |
|--------|------|-------------|
| `person_id` | uuid FK → people | |
| `reviewer_id` | uuid FK → people | |
| `review_period` | text | e.g. "H2-2025" |
| `rating_score` | numeric | |
| `accomplishments`, `strengths`, `growth_areas`, `challenges` | text | Review content |
| `development_goals` | text | |

---

### PPP (Weekly Status Reports)

The PPP (Progress, Problems, Plans) is a weekly deck from the CLM org. It's processed at the **swimlane level** — each workstream gets a summary, not individual items. This was a deliberate architectural decision to keep DB operations manageable (~10 per report vs ~150 for item-level).

#### `ppp_reports` (3 rows)
One row per weekly report.

| Column | Type | Description |
|--------|------|-------------|
| `week_date` | date UNIQUE | The Monday of the reporting week |
| `overall_summary` | text | 3-5 sentence executive summary |
| `private_notes` | text | ⚠️ SENSITIVE |

#### `ppp_sections` (30 rows)
One row per workstream/swimlane per week.

| Column | Type | Description |
|--------|------|-------------|
| `report_id` | uuid FK → ppp_reports | |
| `workstream_name` | text | e.g. "KYC New Flow", "Vendor Optimization" |
| `lead_id` | uuid FK → people | Workstream lead |
| `status` | text | `on-track` · `potential-issues` · `at-risk` · `na` |
| `quality_score` | smallint | 1-5, on specificity/metrics/actionability |
| `quality_notes` | text | Why that score |
| `summary` | text | Claude-generated 2-4 sentence synthesis |
| `raw_text` | text | Full original slide text (preserved for drill-down) |
| `contributors` | text[] | People who contributed (slugs or names) |
| `tags` | text[] | Searchable tags (countries, vendors, themes) |

---

### Agent Infrastructure

These tables are the shared workspace for Claude Code agents. Separate from human-facing tables by design.

#### `agent_log`
Agent shared memory. Only log **substantial** observations, findings, errors, and recommendations. Not for routine run tracking.

| Column | Type | Description |
|--------|------|-------------|
| `agent_slug` | text | Which agent wrote this |
| `category` | text | `observation` · `finding` · `error` · `recommendation` · `decision` |
| `summary` | text | Human-readable description |
| `details` | jsonb | Structured data if needed (query results, analysis) |
| `related_entity_type` | text | Optional: `person`, `initiative`, `ppp_report`, etc. |
| `related_entity_id` | uuid | Optional: links to the entity |
| `tags` | text[] | For cross-agent discovery |

**Logging threshold:** Before writing, ask: "Would another agent or human benefit from knowing this?" If no, don't log.

#### `agent_tasks`
Work items for and between agents.

| Column | Type | Description |
|--------|------|-------------|
| `title` | text | What needs to be done |
| `description` | text | Details |
| `target_agent` | text | Which agent should pick this up (slug, or null for any) |
| `status` | text | `pending` · `picked-up` · `done` · `failed` |
| `priority` | text | `low` · `normal` · `high` |
| `created_by` | text | `human`, `agent:ppp-ingest`, `claude-chat`, etc. |
| `picked_up_by` | text | Which agent actually took it |
| `result_summary` | text | Outcome when completed |
| `related_entity_type` / `related_entity_id` | text / uuid | Optional entity link |
| `tags` | text[] | |
| `completed_at` | timestamptz | When finished |

**Pattern for agents checking for work:**
```sql
SELECT * FROM agent_tasks
WHERE (target_agent = 'my-slug' OR target_agent IS NULL)
  AND status = 'pending'
ORDER BY priority DESC, created_at ASC;
```

#### `agent_registry`
Lightweight, optional self-registration. Agents can register when they first run to make themselves discoverable. The codebase is the source of truth for agent definitions.

| Column | Type | Description |
|--------|------|-------------|
| `slug` | text UNIQUE | Agent identifier |
| `name` | text | Human-readable name |
| `description` | text | What this agent does |
| `agent_type` | text | `script` · `edge-function` · `scheduled` · `sub-agent` |
| `status` | text | `active` · `development` · `deprecated` · `disabled` |
| `config` | jsonb | Agent-specific configuration |

#### `project_decisions`
Architectural and convention decisions that all agents (and Claude.ai) should follow.

| Column | Type | Description |
|--------|------|-------------|
| `category` | text | `architecture` · `convention` · `schema` · `workflow` · `integration` · `deprecation` |
| `title` | text | Short description |
| `description` | text | Full context and rationale |
| `status` | text | `active` · `superseded` · `proposed` · `rejected` |
| `supersedes_id` | uuid FK → project_decisions | Links to decision this replaces |
| `tags` | text[] | |

**Currently 8 active decisions.** Always check before making architectural choices:
```sql
SELECT title, description FROM project_decisions WHERE status = 'active' ORDER BY category;
```

---

### Supporting Tables

#### `context_store` (12 rows)
Key-value store for working memory. Used primarily by Claude.ai for session context and workflow definitions.

| Key | Purpose |
|-----|---------|
| `current_focus` | Yonatan's priorities, waiting-on items, blockers |
| `me` | Yonatan's management philosophy and values |
| `org_structure` | Org overview |
| `preferences` | Communication and output preferences |
| `quarterly_goals` | Current quarter objectives |
| `workflow_*` | Workflow definitions (7 workflows stored as JSON) |

**For agents:** Read `current_focus` when you need to understand what matters right now. Read `workflow_*` keys if you're implementing or extending a workflow.

#### `conversations_log` (41 rows)
Human-side conversation log. Key decisions, insights, context from Yonatan's interactions with Claude.ai.

| Column | Type | Description |
|--------|------|-------------|
| `summary` | text | What was decided/learned |
| `category` | text | `decision` · `insight` · `context` · `action` · `reflection` · `system` |
| `related_entity_type` / `related_entity_id` | text / uuid | Optional entity link |
| `tags` | text[] | |

**For agents:** Read this for human context when relevant. Write to `agent_log` instead — keep the namespaces separate.

#### `embeddings` (115 rows)
Vector embeddings for semantic search. Uses OpenAI `text-embedding-3-small` with IVFFlat cosine index.

What's embedded: people profiles, non-private content sections, initiatives. **Private content is never embedded.**

#### `tags` / `entity_tags`
Flexible tagging system. Currently unused (0 rows) — tags are stored as text[] arrays on entities directly.

---

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

### Database Functions

| Function | Purpose |
|----------|---------|
| `search_knowledge(embedding, threshold, count)` | Vector similarity search |
| `get_person_context(slug)` | Person + content sections (legacy, prefer views) |
| `get_team_with_members(slug)` | Team + members (legacy, prefer views) |
| `update_updated_at()` | Trigger function for timestamp management |

---

### Edge Functions (Deployed)

| Function | Purpose | Auth |
|----------|---------|------|
| `ingest-ppp` | Accepts PPP JSON payload → writes to ppp_reports + ppp_sections | JWT required |
| `generate-embeddings` | Chunks and embeds people, content_sections, initiatives | JWT required |
| `semantic-search` | Natural language → embedding → ranked results | JWT required |

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

### Agent Behavior

- **Log threshold:** Only log to `agent_log` when something is substantial enough that another agent or human would benefit from knowing it
- **Task lifecycle:** Check `agent_tasks` for pending work → set status to `picked-up` → do work → set `done`/`failed` with `result_summary`
- **Project decisions:** Always check `project_decisions WHERE status = 'active'` before making architectural choices
- **Namespace separation:** Human data in `conversations_log`, `tasks`, `meetings`. Agent data in `agent_log`, `agent_tasks`. Don't cross-contaminate.
- **Self-registration (optional):** On first run, an agent can INSERT into `agent_registry` to make itself discoverable. Not required.

### PPP Conventions

The PPP workflow has a detailed specification stored in `context_store` key `workflow_ppp_ingest`. Key points:
- Swimlane-level tracking, not item-level
- Status values: `on-track`, `potential-issues`, `at-risk`, `na`
- Quality scores: 1-5 (specificity, metrics, actionability)
- Tags follow a dictionary: countries, vendors, themes, domains
- Raw text preserved alongside Claude-generated summaries
- Week-over-week comparison via `v_ppp_week_comparison` view

### Embedding Conventions

- Model: OpenAI `text-embedding-3-small`
- Embeddings are NOT auto-updated — regenerate via `generate-embeddings` edge function after significant data changes
- Private content (`is_private = true`) is never embedded
- Use `search_knowledge()` DB function for vector queries

---

## Entity Relationship Summary

```
people ──┬── teams (via team_members, many-to-many)
         ├── people (reports_to_id, self-referential)
         ├── initiatives (via initiative_stakeholders)
         ├── tasks (owner_id)
         ├── meetings (via meeting_attendees)
         ├── meeting_action_items (owner_id)
         ├── ppp_sections (lead_id)
         ├── performance_reviews (person_id, reviewer_id)
         └── content_sections (entity_type='person')

initiatives ── tasks (initiative_id)
            └── initiative_stakeholders (person + role)

meetings ── meeting_attendees (person_id)
         └── meeting_action_items (owner_id)

ppp_reports ── ppp_sections (report_id)

tasks ── tasks (parent_task_id, self-referential)
      └── task_dependencies (blocking relationships)

agent_tasks (standalone — no FK to people or agents)
agent_log (standalone — references agent_slug as text, not FK)
project_decisions (self-referential via supersedes_id)
agent_registry (standalone)
```

---

## Project Structure

```
second-brain/
├── CLAUDE.md              # This file — project definition for Claude Code
├── README.md              # Setup and overview
├── .env                   # Supabase + Looker credentials (never commit)
├── package.json
├── tsconfig.json
├── scripts/               # Standalone automation scripts
│   └── ppp-ingest.ts      # PPP processing
├── agents/                # Agent definitions
│   ├── research.md        # Research agent
│   └── analytics.md       # Analytics agent (CLM funnel analysis)
├── analytics/             # Analytics agent — Looker-based CLM analysis
│   ├── config/            # Constants, look configs
│   ├── knowledge/         # Country tiers, funnels, filter mappings
│   ├── looks/             # Looker Look configurations (JSON)
│   ├── lib/               # Looker client, data utils, formatting
│   │   └── __tests__/     # Unit tests (node --test)
│   ├── analyses/          # Analysis modules (scan, compare, deep-dive, diagnose)
│   ├── agent.ts           # Task runner (picks up agent_tasks)
│   └── run.ts             # CLI entry point
├── lib/                   # Shared utilities
│   ├── supabase.ts        # Supabase client initialization
│   ├── types.ts           # TypeScript types (generated or manual)
│   └── logging.ts         # Agent logging helpers
└── supabase/
    └── functions/         # Edge function source (reference)
        ├── ingest-ppp/
        ├── generate-embeddings/
        └── semantic-search/
```

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
```
