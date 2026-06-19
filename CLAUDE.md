# Second Brain — Claude Code Project Guide

## Project Context

### Who This Serves

Yonatan Orpeli — VP of Product at Payoneer, leading the CLM (Customer Lifecycle Management) domain. He manages a ~21-person product organization: 5 direct reports leading 5 product teams, plus 12 skip-level ICs. He started in August 2024, coming from 5 years as Senior Director of Product at Forter.

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

Five direct reports, five teams:

| Lead | Team | Scope |
|------|------|-------|
| Elad Schnarch (Principal PM) | KYC Service | KYC verification flows, vendor management, new country rollouts |
| Ira Martinenko (Principal PM) | Self-Service | Self-service onboarding, lead scoring, full rollout |
| Yael Feldhiem (Product Director) | Localization & Licensing | Country localization, licensing, India expansion |
| Ido Seter (Senior PM) | Policy & Eligibility | Compliance policies, eligibility rules |
| Meital Lahat Dekter (Senior Director) | Delegated Onboarding | Partner/delegated onboarding flows |

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

Fifteen agents across two teams, each with a CLI entry point or definition doc. For full details (commands, task formats, key concepts), see [docs/agents.md](docs/agents.md).

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
| Initiative Tracker | `initiative-tracker` | `agents/initiative-tracker.md` + `scripts/initiative-tracker/` | Keeps initiative memory docs current from PPP, meetings, decisions. `refresh-from-ppp` CLI (plan→apply) is the final step of PPP ingestion |
| Q-Plan PM | `q-plan-pm` | `pm_team/q-plan/` | Quarterly plan ingestion, progress tracking, gap analysis, quarter reviews |
| Vendor Optimization PM | `vendor-optimization-pm` | `pm_team/vendor-optimization/` | KYC vendor portfolio, POC lifecycle, coverage gap analysis, vendor deprecation tracking |
| AI PM | `ai-pm` | `pm_team/ai-pm/` | Portfolio PM for all AI initiatives (claude-kyc-agent, air-squared, ai-native-team-structure, ai-academy-product, ai-powered-pm-team) + continuous-learning loop (demand-driven research + standing watchlist) on AI-in-enterprise, AI PM craft, AI engineering. `portfolio` / `brief` / `scan --plan`/`--store` |
| AB Testing | `ab-testing` | `ab-testing/` | CLM experiment registry, Looker-based statistical analysis, Asana lifecycle tracking |
| Outlook Agent | `outlook-agent` | `outlook/` + `agents/outlook-agent.md` | Claude-for-Outlook bridge — pull-only email/calendar lookups via agent_tasks, results promoted to initiative memory with provenance |
| Initiative Review | `initiative-review` | `agents/initiative-review.md` + `scripts/initiative-review/` | Visual portfolio review — gathers active initiatives + memory docs, dispatches analysis sub-agents for TL;DR/recommendation cards, renders a self-contained offline HTML review page |
| Comms Assistant | `comms-assistant` | `comms-assistant/` + `agents/comms-assistant.md` | Learns how Yonatan decides/communicates by predicting his email replies and reconciling against what he sent (read-only MSFT; he sends from Outlook). Tiered retrieval (T1 identity / T2 ownership / T3 narrative + rule spine), a learned `comms_rules` rulebook, and a triage-sweep HTML (`render-triage.ts`). `classify` / `context:assemble` / `predictions:*` / `rules:*`. Also a calendar **create-meetings** limb (`schedule/`): resolve attendees → find times (your openings, local) → draft agenda → in-chat approval → opens an editable, sendable `.ics` invite in Outlook (you add the join link + send; never auto-sent; no auto-record). `schedule:resolve` / `busy` / `find-times` / `agenda-context` / `draft-meeting` |

**Analytics / CLM data — natural-language trigger (canonical data flow):** Any question about CLM registrations, approval rates, funnel conversion, document submission, FFT/activation, time-to-approval, cohorts, or country/device/segment breakdowns goes through the **`clm-main` skill** (`.claude/skills/clm-main/SKILL.md`) — the analytics team's semantic-layer contract. The skill auto-triggers; invoke it before answering. In code, query via `buildClmMainQuery()` / the helpers in `analytics/lib/clm-main-metrics.ts` (they enforce the required filters, the mandatory population `filter_expression`, and predefined rate measures — never hand-divide rates, never flat-filter `is_blocked`). Apply the skill's autonomous-agent defaults (mature window, `fft_rate_from_approval`, `chosen_country_name`) and state them in the answer.

| Yonatan says (or similar) | You do |
|---|---|
| "what's the approval rate for X", "funnel for Y", "break down Z by device/country/segment", any CLM metric | Use the `clm-main` skill; build the query with `buildClmMainQuery()`; report the defaults you applied. |
| "run the country diagnostic / opportunity scan / CLM-vs-4Step compare / deep-dive" | `npm run analytics:run -- diagnose\|scan-opportunities\|compare\|deep-dive <country>`. CLM side is on `clm_main`; 4Step/GLPS + rollout stay on the legacy explore. |
| "did the clm_main fields change?", "is the analytics data flow still working?" | `npm run analytics:drift-check` (canary query over every field the flow depends on). For an old-vs-new population delta, `npm run analytics:validate-explore`. |

**Initiative Review — natural-language trigger (Yonatan never runs the CLI; you do):** When Yonatan says any of the below, run it for him and handle the rest conversationally. See [agents/initiative-review.md](agents/initiative-review.md) for the full procedure and the analysis sub-agent prompt template.

| Yonatan says (or similar) | You do |
|---|---|
| "review the initiatives", "run an initiative review", "let's look at the open initiatives" | Decide path. If analysis is fresh → **render-only**: `npm run initiative-review`, then `open output/initiatives/initiative-review.html`. If analysis is stale/missing or he wants a fresh take → **full review**: gather, dispatch one read-only analysis sub-agent per substantive initiative (parallel), merge results into `scripts/initiative-review/highlights.json` (bump `_meta.analyzed`), then `npm run initiative-review` + open. Then walk P0→P1 and surface the cross-cutting pattern. |
| "refresh the review", "rebuild the review page" | `npm run initiative-review` + open (render-only from current Supabase data + existing highlights). |
| "re-analyze X", "add X to the review" | Dispatch the analysis sub-agent for that slug, merge into `highlights.json`, re-render. |

**Command Center — natural-language trigger (Yonatan never runs the CLI; you do):** The daily loop's backbone is Supabase (`command_center_days` + `command_center_captures`, durable docs in `context_store` keys `command_center_routing`/`command_center_people`). Any session with both MSFT and Supabase access runs the whole loop; a session with only one side runs its arc. The rendered `dashboard.html` is local scratch — the DB is the record. See [docs/superpowers/specs/2026-06-12-command-center-supabase-backbone.md](docs/superpowers/specs/2026-06-12-command-center-supabase-backbone.md) and [agents/command-center-capture.md](agents/command-center-capture.md).

| Yonatan says (or similar) | You do |
|---|---|
| "gather context", "morning brief", "start the day" | `npm run command-center:gather` → open/send `command-center/daily/$(date +%F)/dashboard.html`. Skim the focus doc (`command_center_days.focus_md`); curate if useful and re-render with `npm run command-center:dashboard -- --date=$(date +%F)`. |
| "refresh the dashboard" | `npm run command-center:dashboard -- --date=$(date +%F)` + open/send. |
| "scan" / "capture" / "what's new" | Follow `agents/command-center-capture.md` capture mode: `command-center:capture -- window` → sweep Teams/SharePoint/mail/calendar via MSFT MCP tools → `command-center:capture -- add --payload=<json>` (inserts the capture row + re-renders). No confirmation needed. |
| "close out the day" / "wrap up" | Follow `agents/command-center-capture.md` close mode: draft the summary from the day's capture rows, show Yonatan, get approval, `command-center:day -- summary --file=<md>`; then reconcile approved deltas to their destinations with provenance and log them via `command-center:day -- reconcile --file=<md>` (closes the day). |

Default scope: all active, tiered (full cards for substantive memory docs; a "not analyzed — too sparse" banner for thin/empty ones). `blocked` initiatives render in a greyed **"On Hold"** group at the bottom (cards kept). Closing/parking an initiative is a status change — `completed` drops it off entirely; `blocked` moves it to On Hold. The HTML + a data-layer JSON land in `output/initiatives/`.

**Comms Assistant — natural-language trigger (Yonatan never runs the CLI; you do):** When Yonatan says **"sweep my unread"**, **"triage my inbox"**, **"morning triage"**, or **"what needs a response?"**, run the triage sweep over **two first-class sources** — unread Inbox **and** unread Teams. **Email gather is bridge-first** (run at the Mac): `npx tsx comms-assistant/run.ts pull-outlook --source=unread` (osascript / Legacy Outlook) emits ready capture packets — **MCP `outlook_email_search` is the fallback**; **Teams stays MCP** (all 1:1s + CLM-leadership groups **+ the 15 most-recently-active chats**, via `chat_message_search` recency + no-reply heuristic; **drop** `no-reply@teams.mail.microsoft` notification emails — they're truncated shadows). **"pull Claude emails"** = the curated source (`pull-outlook --source=claude`, Outlook `Claude` category, skips classify). Then: `npm run comms-assistant -- classify` (drop noise, flag sensitive) on MCP/Teams survivors → build context + draft a suggested reply applying the learned rulebook (incl. the **pinned executive-voice** rule) → persist the cards to `comms_predictions` (`predictions:add-many`) so they show in the **`/triage` app** (the only default review surface). Bridge gather doc: [comms-assistant/outlook-bridge/GATHER.md](comms-assistant/outlook-bridge/GATHER.md). **Do NOT render the local HTML export unless Yonatan explicitly asks** ("export the HTML"). He reviews/edits in the app and sends from Outlook (read-only MSFT); a later sweep reads Sent Items and reconciles. Single-email help ("draft a reply to X", "suggest a response") runs the same pipeline for one thread. Full procedure: [agents/comms-assistant.md](agents/comms-assistant.md). **Outgoing ("send X an email about it"):** mid-conversation, when Yonatan says "send <person> an email about it" / "draft an email to <person> re: …" / "email <person> a heads-up", run the outgoing flow — resolve recipient (`contacts:resolve`), gather (`assembleContext`), draft in voice applying the rulebook, self-eval + adaptive adversarial verify by stakes, show in chat for approval, then `send-initiated` (push a fresh Outlook draft via the bridge — never sends — and persist a `mode:'initiated'` card + the approve-time edit diff to `comms_feedback`, which `rules:distill` learns from). Backfill the recipient's address (`contacts:learn`) so it's never re-asked. Full procedure: [comms-assistant/CLAUDE.md](comms-assistant/CLAUDE.md).

### Dev Team (UI App)

| Agent | `target_agent` slug | Directory | Purpose |
|-------|---------------------|-----------|---------|
| Dev Team Lead | `dev-team-lead` | `dev_team/team-lead/` | Plans features, delegates to engineers, reviews work |
| App Architect | `dev-architect` | `agents/app-architect.md` | Definition-only design/architecture guidance |
| App Designer | `dev-designer` | `agents/dev-designer.md` | Definition-only UX/UI design, design system, usability |
| Frontend Engineer | `dev-frontend` | `dev_team/frontend/` | React components, pages, styling, layout |
| Backend Engineer | `dev-backend` | `dev_team/backend/` | Tanstack Query hooks, Supabase queries, types |

**CLI pattern:** All TypeScript agents use `npx tsx {dir}/run.ts <command>`. Task runners are `{dir}/agent.ts`.

**PM Team knowledge model (four layers):** `pm_team/clm-context.md` (business context) → `pm_team/workflows.md` (process) → `pm_team/playbook.md` (shared learnings) → `{agent}/context.md` (domain reference knowledge — benchmarks, frameworks, competitive intel; optional, for agents with rich domains) → `{agent}/memory.md` (operational working state).

**Initiative-embedded agents:** Heavy initiatives (with significant local materials and docs) can embed their PM agent directly within `initiatives/{slug}/`. These agents use the same shared PM layers (clm-context, workflows, playbook) but store domain context and memory alongside initiative artifacts. See [Initiative Workspaces](#initiative-workspaces) below.

**Dev Team knowledge model:** `dev_team/app-context.md` (app context) → `dev_team/workflows.md` (process) → `dev_team/playbook.md` (shared learnings) → `{agent}/memory.md` (individual memory). Dev team workflow: Yonatan → Team Lead (plan) → Architect (technical design) + Designer (UX/UI design) consulted → approved → Team Lead (delegate) → Engineers build → Designer (design review) + Team Lead (code review).

**Outlook agent — natural-language triggers (Yonatan never runs the CLI; you do):** The `outlook-agent` bridges Claude-for-Outlook ↔ the `agent_tasks` board (see [agents/outlook-agent.md](agents/outlook-agent.md)). When Yonatan says any of the below, run the command for him and handle the rest conversationally — never make him remember a command:

| Yonatan says (or similar) | You run | Then |
|---|---|---|
| "check Outlook", "anything from Outlook?", "what did I push?" | `npm run outlook:run check` | Triage each item: match to initiative/person/`current_focus`, propose a destination + action, and on his confirm promote it (initiative memory via `promoteToInitiativeMemory()` with `[via email: …]` provenance; or a human task/etc.). Then **tag the source task `filed`** so it drops off the sweep. Never auto-promote `sensitive` threads. |
| "look up X in email", "find the thread with Y about Z" | `npm run outlook:run request --query=... [--person=...] [--slug=...] [--timeframe=...]` | Tell him to run the email agent in Outlook; read the result later with `check`. |
| "prep me for the X meeting", "what do I need for my meeting with Y" | `npm run outlook:run meeting-prep "<meeting>" [--date=...]` | After he runs the email agent, read with `check`/`result <id>` and synthesize a prep brief (attendees→person slugs, initiative match, `current_focus`). |
| "what's on my calendar about X", "my meetings this/next week" | `npm run outlook:run calendar [--query=...] [--person=...] [--timeframe=...]` | Read events with `check`/`result <id>`. |
| "anything unanswered from Z", "digest of emails with Z" | `npm run outlook:run digest "<person>" [--focus=unanswered] [--timeframe=...]` | Read with `check`/`result <id>`; flag `awaiting_reply` threads. |

Pushed captures are unrouted by design — Claude Code suggests where they belong. Outlook only ever writes `agent_tasks`; promotion to human tables is gated on Yonatan's confirmation.

**Status lifecycle on the board.** `agent_tasks.status` is a shared CHECK constraint (`pending | picked-up | done | failed`) — do not try to add values. "Claude Code has filed this" is tracked with a **`filed` tag**, not a status:
- **Pull** (lookup): `pending` → `picked-up` (Outlook) → `done` (Outlook wrote the result; awaiting your promotion) → you promote, then add tag `filed`. `check`/`results` show `done` **and not `filed`**.
- **Push** (inbound capture): `pending` (awaiting your triage) → you triage/file, set `done` + tag `filed`. `inbox` shows only `pending`.

So a `done` Outlook task means "the producing agent finished," NOT "filed." The `filed` tag is the real terminal for Claude-Code processing; tag it once you've acted, or it lingers in the sweep.

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

## External Data Sources

Beyond the Supabase backbone, the system has **read-only** access to external knowledge stores. These are live sources (no local copy) — read on demand, never the source of truth for our own data.

### KYC Team Repo (Azure DevOps) — read-only

Elad Schnarch's KYC/KYB team maintains a shared context repo on Azure DevOps (`Product KYC Team`, branch `KYC_Team_Branch`). We have a **read-only** live connection to it via the `kyc-team-repo` skill (`.claude/skills/kyc-team-repo/SKILL.md`), backed by a Code:Read PAT in `AZURE_DEVOPS_PAT` (`.env`, gitignored).

- **What's in it:** KYC/KYB PRDs, competitive research (Stripe/Wise/Airwallex), vendor & competitor analyses, EVS architecture/metrics/providers, DU (document-understanding) core context + vendor docs + monthly vendor reports, the canonical glossary, vendor QA framework, and dashboard links.
- **Who benefits:** `vendor-optimization-pm`, `kyc-product-pm`, `competitive-analysis`, and EVS/eCollection initiative work — this is external corroboration for our own CLM vendor/KYC intel.
- **How to use:** The skill auto-triggers on mentions of the KYC team repo, their glossary, competitive research, vendor/EVS/DU references, etc. It reads files and lists folders live; it **never writes** (Yonatan is a consumer of this repo, not an author).
- **Bridge convention:** Azure DevOps stays the source of truth (read live); the Second Brain is the index. When carrying repo content into our DB (e.g. an initiative memory doc), cite provenance as `[KYC team repo: /path/to/file @ KYC_Team_Branch]` — summarize and link, don't bulk-copy.
- **Full procedure & repo layout:** see the skill file.

---

## Database Overview

The database has 29 tables organized into five domains. For full column definitions, see [docs/schema.md](docs/schema.md).

1. **Core Entities** — `people`, `teams`, `team_members`, `initiatives`, `initiative_stakeholders`, `tasks`, `task_dependencies`, `products`
2. **Meetings & Notes** — `meetings`, `meeting_attendees`, `meeting_action_items`, `content_sections`, `performance_reviews`
3. **PPP (Weekly Status)** — `ppp_reports`, `ppp_sections`
4. **Quarterly Plans** — `quarterly_plans`, `quarterly_plan_items`, `quarterly_plan_deliverables`
5. **Agent Infrastructure** — `agent_log`, `agent_tasks`, `agent_registry`, `research_results`, `project_decisions`, `agent_coordination`

Plus: `context_store` (key-value working memory), `conversations_log`, `embeddings` (vector search), `tags`/`entity_tags`, and the command-center daily loop (`command_center_days`, `command_center_captures` — distilled comms, **never embedded**).

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

**Ingestion has three phases, then a memory-refresh final step:** `ppp write` (Phase 1–2: parse → review → write) → `ppp enrich` (Phase 3: week-over-week diff, cross-swimlane patterns, dispatch PM tasks) → **`initiative-tracker refresh-from-ppp`** (fan this week's signals into the initiative memory docs). The refresh is **not optional** — always run it after enrich so the initiative docs reflect the latest PPP. It is Claude-in-the-loop: `--plan --week=…` emits a per-initiative scaffold (matched slug, prior/current status, stored summary, `suggested` text), Claude curates it (tight PPP-signal line; `status_line` only when status changed; real blocker bullets), then `--apply --payload=<path>` writes idempotently and prints an Updated/Skipped/Errors summary. See [agents/initiative-tracker.md](agents/initiative-tracker.md) for the procedure and the `WORKSTREAM_TO_INITIATIVES` mapping.

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
- Entity types: `person`, `initiative`, `initiative_memory`, `initiative_context`, `research`, `agent_log`, `playbook`, `ppp`
- **All entity types** are embedded via the local script: `npm run embed:all` (or individual modes: `embed:agent-log`, `embed:playbooks`, `embed:ppp`, `embed:person`, `embed:initiative`, `embed:initiative-memory`, `embed:research`)
- `logFinding()` and `logRecommendation()` auto-embed new entries (fire-and-forget). Pass `autoEmbed: true` to `logAgent()` for other categories.
- Private content (`is_private = true`) is never embedded. Person-related agent_log entries embed only the summary, not details. PPP `private_notes` are never embedded.
- Use `search_knowledge()` DB function for raw vector queries
- Use `searchByType(query, ['agent_log', 'ppp'])` from `lib/embeddings.ts` for typed semantic search across specific entity types
- PM agent commands (check-in, investigate, research, synthesize, enrich) use `searchByType()` to augment SQL results with semantic context. Embedding failures are caught and never break agent commands.

### Initiative Workspaces

**Knowledge is Supabase-canonical; local folders hold artifacts only.** (Decision 2026-06-13, refines the 2026-04-02 workspace decision — see `docs/superpowers/specs/2026-06-13-initiative-knowledge-db-canonical.md`.) One canonical home **per type of content**:

- **Knowledge** — the curated initiative memory doc lives in Supabase `content_sections` (`section_type = 'memory'`), embedded as `initiative_memory`, consumed via `searchByType`. Single source of truth, writable from both Claude.ai and Claude Code. This is the non-negotiable home — Claude.ai can't read local files.
- **Working artifacts** — drafts, research, slides, meeting notes — live in local `initiatives/{slug}/docs/`, where git history and in-place editing earn their keep. Not embedded.
- **`CLAUDE.md`** — a thin local folder index (IDs, stakeholders pointer, working-files list). Navigation aid, not knowledge. Not synced.

A local folder is **optional** — create one only when an initiative has genuine local material to work on; most initiatives are fine DB-only (memory doc, no folder).

**Bridge principle:** when a local doc produces durable knowledge, distill it into the embedded memory doc. Raw docs stay local as provenance.

**Directory structure (folders that keep one):**

```
initiatives/{slug}/
  CLAUDE.md            # Thin index: identity, IDs, stakeholders pointer, working files list
  memory.md            # OPTIONAL pull-only mirror of the DB memory doc (read convenience; never the canonical copy)
  context.md           # Domain reference knowledge (benchmarks, frameworks, competitive intel)
  agent.md             # PM agent definition — what to monitor, commands, PPP mappings
  docs/                # All working artifacts (research, drafts, meeting notes, materials) — canonical, local
```

**Two types of initiatives coexist:**

| Type | Where it lives | Agent location | When to use |
|------|---------------|----------------|-------------|
| **Workspace initiative** | `initiatives/{slug}/` with local files | `agent.md` inside the initiative dir | Heavy initiatives with lots of materials, active strategic work |
| **DB-only initiative** | `initiatives` table + memory doc in `content_sections` | `pm_team/{agent}/` or `assigned_agent` field | Lighter initiatives tracked via PPP and meetings |

Both types share the same DB backbone (initiative record, memory doc, stakeholders) and the same PM team shared layers (clm-context, workflows, playbook).

**Grain — initiatives vs. pillars (`initiatives.kind`):** The `initiatives` table holds two grains, distinguished by the `kind` column (`'initiative'` default, or `'pillar'`). A **pillar** is a parent container that holds multiple initiatives (e.g. `ai-foundry`, `ai-product-strategy`, `bu-ai-transformation`, `guild`); its children point to it via `parent_id`. Pillars have their own canonical memory doc + embeddings just like initiatives. **When a consumer wants only normal initiatives (dashboards, initiative-review, portfolio rollups), filter `WHERE kind = 'initiative'`** so pillars don't show up as if they were initiatives. To list a pillar's children: `WHERE parent_id = '{pillar_id}'`. (Schema added 2026-06-13 — migration `initiatives_add_kind_and_parent`.)

**Knowledge access patterns:**

- **Local agent (within its own initiative):** Reads local `context.md` / `docs/*.md` directly for artifacts; reads the **DB memory doc** (or its pull-only `memory.md` mirror) for canonical knowledge. `CLAUDE.md` is the index of what exists locally.
- **Any agent (discovering other initiatives):** Search Supabase embeddings via `searchByType(query, ['initiative_memory'])` — the curated memory doc is the single embedded knowledge surface. (The `initiative_context` entity type — raw local docs chunked for discovery — is **dormant/retired**: it was never populated, and durable knowledge belongs in the memory doc instead. See the bridge principle above.)

**No bidirectional sync.** The DB memory doc is canonical. Retired the old `memory.md ↔ workspace-memory` / `CLAUDE.md ↔ workspace-context` two-way sync (it drifted; one Claude.ai edit was lossy). `memory.md`, where kept, is a **pull-only** convenience mirror — read it, but write knowledge to the DB doc, not back through the file. `CLAUDE.md` is local-only and not synced.

**Creating a new initiative:**
1. Create the initiative row + memory doc (`content_sections`, `section_type = 'memory'`) in the DB — this is the canonical home and works with no folder.
2. Only if there's genuine local material to work on: copy `initiatives/_template/` to `initiatives/{slug}/`, populate `CLAUDE.md` (thin index) with real IDs from the DB, add `context.md` / `agent.md` / `docs/` as materials are loaded.
3. Run `npm run embed:initiative-memory` (and `embed:initiative`) so the knowledge is queryable. Re-run after substantive memory-doc edits (`-- --force`).

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
