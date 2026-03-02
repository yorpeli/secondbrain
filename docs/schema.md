# Database Schema Reference

> Full column definitions for all 24 tables. For a summary overview, see [CLAUDE.md](../CLAUDE.md#database-overview).

---

## Core Entity Tables

### `people` (34 active rows)
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

### `teams` (6 active rows)
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

### `team_members` (17 rows)
Many-to-many mapping of people to teams. A person can be on multiple teams.

| Column | Type | Description |
|--------|------|-------------|
| `team_id` | uuid FK → teams | |
| `person_id` | uuid FK → people | |
| `role` | text | `lead` or `member` (convention, not enforced) |

### `initiatives` (3 rows)
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

### `initiative_stakeholders` (13 rows)
Links people to initiatives with their role in that initiative.

### `tasks` (17 rows)
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

### `task_dependencies` (0 rows)
Tracks blocking relationships between tasks. `task_id` is blocked by `blocked_by_task_id`.

### `products` (0 rows — placeholder)
Product entities. Schema exists but not yet populated.

---

## Meetings & Notes

### `meetings` (22 rows)
Meeting records with notes.

| Column | Type | Description |
|--------|------|-------------|
| `meeting_type` | text | `1on1` · `team` · `leadership` · `external` · `project` |
| `date` | date | |
| `topic` | text | |
| `purpose` | text | |
| `discussion_notes` | text | What was discussed |
| `private_notes` | text | SENSITIVE — Yonatan's private observations. Never surface casually. |

### `meeting_attendees` (26 rows)
Links people to meetings. Many-to-many.

### `meeting_action_items` (13 rows)
Follow-ups from meetings.

| Column | Type | Description |
|--------|------|-------------|
| `meeting_id` | uuid FK → meetings | |
| `owner_id` | uuid FK → people | Who's responsible |
| `description` | text | |
| `status` | text | `open` · `done` |
| `due_date` | date | |

### `content_sections` (9 rows)
Rich content attached to any entity — coaching logs, development plans, notes.

| Column | Type | Description |
|--------|------|-------------|
| `entity_type` | text | `person`, `initiative`, etc. |
| `entity_id` | uuid | FK to the parent entity |
| `section_type` | text | e.g. `coaching-log`, `dev-plan`, `note` |
| `content` | text | The actual content |
| `is_private` | boolean | If true, never embed or surface without explicit request |
| `date` | date | |

### `performance_reviews` (2 rows)
Annual/periodic performance reviews. **SENSITIVE** — Performance data requires discretion.

| Column | Type | Description |
|--------|------|-------------|
| `person_id` | uuid FK → people | |
| `reviewer_id` | uuid FK → people | |
| `review_period` | text | e.g. "H2-2025" |
| `rating_score` | numeric | |
| `accomplishments`, `strengths`, `growth_areas`, `challenges` | text | Review content |
| `development_goals` | text | |

---

## PPP (Weekly Status Reports)

The PPP (Progress, Problems, Plans) is a weekly deck from the CLM org. It's processed at the **swimlane level** — each workstream gets a summary, not individual items. This was a deliberate architectural decision to keep DB operations manageable (~10 per report vs ~150 for item-level).

### `ppp_reports` (3 rows)
One row per weekly report.

| Column | Type | Description |
|--------|------|-------------|
| `week_date` | date UNIQUE | The date of the PPP report (typically Thursday) |
| `overall_summary` | text | 3-5 sentence executive summary |
| `private_notes` | text | SENSITIVE |

### `ppp_sections` (30 rows)
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

## Agent Infrastructure

These tables are the shared workspace for Claude Code agents. Separate from human-facing tables by design.

### `agent_log`
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

### `agent_tasks`
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
| `result_details` | jsonb | Structured results for downstream consumption |
| `due_date` | date | When this should be completed by |
| `parent_task_id` | uuid FK → agent_tasks | For workflow chaining (follow-up tasks) |
| `updated_at` | timestamptz | Auto-updated on modification |
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

### `agent_registry`
Lightweight, optional self-registration. Agents can register when they first run to make themselves discoverable. The codebase is the source of truth for agent definitions.

| Column | Type | Description |
|--------|------|-------------|
| `slug` | text UNIQUE | Agent identifier |
| `name` | text | Human-readable name |
| `description` | text | What this agent does |
| `agent_type` | text | `script` · `edge-function` · `scheduled` · `sub-agent` |
| `status` | text | `active` · `development` · `deprecated` · `disabled` |
| `config` | jsonb | Agent-specific configuration |

### `research_results`
Domain expertise, competitive analysis, market research, and regulatory knowledge produced by research agents.

| Column | Type | Description |
|--------|------|-------------|
| `topic` | text | What was researched (e.g. "KYC verification market landscape") |
| `research_type` | text | `domain` · `competitive` · `market` · `regulatory` |
| `agent_slug` | text | Which agent produced this research |
| `summary` | text | 2-3 sentence executive summary |
| `content` | text | Full research content (markdown) |
| `source_urls` | text[] | URLs consulted during research |
| `status` | text | `current` · `stale` · `superseded` |
| `freshness_date` | date | When the research was last verified as current |
| `superseded_by` | uuid FK → research_results | Points to newer version |
| `tags` | text[] | For discovery (country names, vendor names, domains) |

**Versioning:** When research is updated, the old row gets `status = 'superseded'` + `superseded_by` pointing to the new row. This preserves history.

**Embedding pipeline:** Current research (`status = 'current'`) is embedded via the `generate-embeddings` edge function with `entity_type = 'research'`. PMs can semantically search their domain knowledge.

### `project_decisions`
Architectural and convention decisions that all agents (and Claude.ai) should follow.

| Column | Type | Description |
|--------|------|-------------|
| `category` | text | `architecture` · `convention` · `schema` · `workflow` · `integration` · `deprecation` |
| `title` | text | Short description |
| `description` | text | Full context and rationale |
| `status` | text | `active` · `superseded` · `proposed` · `rejected` |
| `supersedes_id` | uuid FK → project_decisions | Links to decision this replaces |
| `tags` | text[] | |

**Currently active decisions.** Always check before making architectural choices:
```sql
SELECT title, description FROM project_decisions WHERE status = 'active' ORDER BY category;
```

### `agent_coordination`
Threaded message board between Claude Code (`claude-code`), Claude Chat (`claude-chat`), and Yonatan (`yonatan`). Async coordination layer — neither agent operates in real-time with the other, but both work from shared understanding.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Auto-generated |
| `parent_id` | uuid FK → agent_coordination | Thread parent. Root messages have `NULL`, replies point to root. |
| `source` | text | `claude-chat` · `claude-code` · `yonatan` |
| `category` | text | `change-log` · `suggestion` · `question` · `decision` · `context-share` · `priority-shift` · `sync-request` |
| `subject` | text | Thread subject (root messages only) |
| `body` | text | Message content |
| `status` | text | `open` · `acknowledged` · `resolved` · `wont-do` |
| `priority` | text | `low` · `medium` · `high` |
| `related_area` | text | `schema` · `workflows` · `edge-functions` · `instructions` · `data` · `product` · `people` · `general` |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

**Check open items (on request):**
```sql
SELECT * FROM agent_coordination WHERE status = 'open' ORDER BY priority, created_at;
```

---

## Supporting Tables

### `context_store` (12 rows)
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

### `conversations_log` (41 rows)
Human-side conversation log. Key decisions, insights, context from Yonatan's interactions with Claude.ai.

| Column | Type | Description |
|--------|------|-------------|
| `summary` | text | What was decided/learned |
| `category` | text | `decision` · `insight` · `context` · `action` · `reflection` · `system` |
| `related_entity_type` / `related_entity_id` | text / uuid | Optional entity link |
| `tags` | text[] | |

**For agents:** Read this for human context when relevant. Write to `agent_log` instead — keep the namespaces separate.

### `embeddings` (115 rows)
Vector embeddings for semantic search. Uses OpenAI `text-embedding-3-small` with IVFFlat cosine index.

What's embedded: people profiles, non-private content sections, initiatives, current research results. **Private content is never embedded.**

### `tags` / `entity_tags`
Flexible tagging system. Currently unused (0 rows) — tags are stored as text[] arrays on entities directly.

---

## Database Views

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

## Database Functions

| Function | Purpose |
|----------|---------|
| `search_knowledge(embedding, threshold, count)` | Vector similarity search |
| `get_person_context(slug)` | Person + content sections (legacy, prefer views) |
| `get_team_with_members(slug)` | Team + members (legacy, prefer views) |
| `update_updated_at()` | Trigger function for timestamp management |

---

## Edge Functions (Deployed)

| Function | Purpose | Auth |
|----------|---------|------|
| `ingest-ppp` | Accepts PPP JSON payload → writes to ppp_reports + ppp_sections | JWT required |
| `generate-embeddings` | Chunks and embeds people, content_sections, initiatives, research_results | JWT required |
| `semantic-search` | Natural language → embedding → ranked results | JWT required |

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

agent_tasks ── agent_tasks (parent_task_id, self-referential for follow-ups)
agent_log (standalone — references agent_slug as text, not FK)
research_results ── research_results (superseded_by, self-referential for versioning)
project_decisions (self-referential via supersedes_id)
agent_registry (standalone)
agent_coordination ── agent_coordination (parent_id, self-referential for threading)
```
