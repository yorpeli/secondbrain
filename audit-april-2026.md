# Second Brain — Full System Audit (April 2026)

**Date:** 2026-04-02  
**System age:** ~5 months (Supabase migration ~Feb 2026)  
**Auditor:** Claude Code (Opus 4.6)  
**Scope:** Full system — database, local files, agents, architecture, usage patterns, future vision

---

## Executive Summary

The Second Brain is a mature, well-architected system that has accumulated significant technical debt over 5 months of growth. The **architecture is fundamentally sound** — the hybrid local-files + Supabase + embeddings approach aligns with industry best practices. But the system is suffering from three classes of problems:

1. **Decay** — Data has gone stale across multiple tables, agent activity stopped ~18 days ago, PPP pipeline is broken, memory docs are aging
2. **Asymmetry** — Claude Code works well (strong CLAUDE.md + organized local files); Claude.ai struggles (overloaded instructions, stale DB, no sourcing)
3. **Unrealized potential** — The system is entirely pull-based (you ask, it answers); it should be proactively surfacing insights, flagging staleness, and connecting dots

**Bottom line:** The system needs a cleanup sprint, an instructions overhaul for Claude.ai, and a shift toward proactive intelligence.

---

## Part 1: Database Health

### 1.1 Table Utilization


| Category             | Tables                                                                                                                                                                                                            | Status                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Active & healthy** | people, initiatives, meetings, meeting_attendees, meeting_action_items, content_sections, conversations_log, tasks, ppp_reports, ppp_sections, quarterly_plans, quarterly_plan_items, quarterly_plan_deliverables | Working, data being written             |
| **Active but stale** | agent_log (18 days), agent_tasks (19 days), embeddings (19 days), context_store (22 days), project_decisions (54 days), performance_reviews (55 days), agent_coordination (22 days), research_results (21 days)   | Data exists but stopped getting updates |
| **Never used**       | products (0 rows), tags (0 rows), entity_tags (0 rows), task_dependencies (0 rows)                                                                                                                                | Dead weight — decide: use or drop       |


### 1.2 Data Volume


| Table                | Rows           | Avg Content Size                   |
| -------------------- | -------------- | ---------------------------------- |
| people               | 44             | —                                  |
| initiatives          | 25 (23 active) | —                                  |
| meetings             | 55             | —                                  |
| meeting_action_items | 111            | —                                  |
| content_sections     | 56             | Varies (memory docs avg ~4K chars) |
| ppp_reports          | 7              | —                                  |
| ppp_sections         | 75             | —                                  |
| agent_log            | 70             | —                                  |
| agent_tasks          | 41             | —                                  |
| embeddings           | 487            | 1536-dim vectors                   |
| conversations_log    | 101            | —                                  |
| context_store        | 15 keys        | 66K total chars                    |
| project_decisions    | 26             | —                                  |


### 1.3 Critical Data Issues

**PPP Pipeline Broken** — Last ingestion: Mar 12. Three weeks missing (Mar 19, 26, Apr 2). PPP is the primary signal pipeline for the org.

**16 of 23 Active Initiatives Unassigned** — Only 7 initiatives have a PM agent tracking them. The initiative memory pattern depends on agent assignment — 70% of initiatives are not being curated.

**15 Pending Agent Tasks** — 9 have no target agent (will never be picked up). 2 target agents (`competitive-analysis`, `domain-expertise`) have no CLI runner. Oldest pending task is 7 weeks old.

**Content Section Naming Chaos** — Both `coaching_log` and `coaching-log` exist. Also `note` vs `notes` vs `private_notes`. Queries miss data depending on variant used. No CHECK constraint prevents drift.

**11 of 22 Initiative Memory Docs Are 1+ Month Stale** — Memory docs are supposed to accumulate context over time, but most haven't been updated.

**1 P1 Initiative Missing Memory Doc** — `kyc-new-flow` has no memory document at all.

`**current_focus` 22 Days Stale** — Both Claude.ai and agents read this to understand priorities. Stale priorities = misaligned work.

**People Data Only ~20% Rich** — Of 44 people, only ~9 have working_style, strengths, and growth_areas populated. The rest are name + role only.

**Project Decisions Frozen** — 26 decisions, none updated since Feb 7. Should be reviewed for which are still active vs resolved/superseded.

### 1.4 Security

**RLS Disabled on All Tables** — Supabase flags 30 ERROR-level security issues. If the React app's anon key is exposed, all data (including private coaching logs, performance reviews) is readable. All 12 views are SECURITY DEFINER. Not critical today (service role key only), but a risk if the app goes public.

### 1.5 Unused Infrastructure

- `tags` + `entity_tags` — PPP uses inline arrays instead. Never adopted.
- `task_dependencies` — 0 rows. Tasks don't track dependencies.
- `products` — 0 rows. No product entities tracked.
- `people.email` — 0% populated across all 44 records.

### 1.6 Embeddings

- 487 embeddings across 7 entity types (initiative_memory: 193, research: 89, ppp: 75, agent_log: 52, person: 44, playbook: 25, initiative: 9)
- `search_knowledge()` function exists and works
- Embeddings haven't been regenerated since Mar 14
- Only 9 of 25 initiatives have initiative-level embeddings (separate from memory chunks)

---

## Part 2: Agent System Health

### 2.1 Agent Activity

**All agents have been dormant since Mar 15.** No agent_log entries or task completions in 18 days. Agent infrastructure appears to have gone cold.


| Agent                  | Log Entries | Latest Activity | Status                   |
| ---------------------- | ----------- | --------------- | ------------------------ |
| hub-countries-pm       | 20          | Mar 15          | Most active, but dormant |
| analytics              | 8           | Feb 8           | Dormant 53 days          |
| team-lead              | 7           | Mar 15          | Dormant                  |
| domain-expertise       | 5           | Mar 12          | No CLI runner            |
| competitive-analysis   | 9           | Feb 7           | No CLI runner            |
| q-plan-pm              | 4           | Mar 15          | Dormant                  |
| ab-testing             | 4           | Mar 1           | Dormant 32 days          |
| dev-team-lead          | 6           | Mar 7           | Dormant                  |
| kyc-product-pm         | 4           | Feb 13          | Dormant 48 days          |
| vendor-optimization-pm | 1           | Mar 10          | Barely activated         |


### 2.2 Agent Memory Quality


| Agent                  | Memory Quality      | Lines | Last Updated | Assessment                                                                       |
| ---------------------- | ------------------- | ----- | ------------ | -------------------------------------------------------------------------------- |
| hub-countries-pm       | Excellent           | 195   | Mar 10       | Detailed country baselines, PPP signals, investigation history                   |
| vendor-optimization-pm | Excellent           | 174   | Mar 10       | Vendor portfolio, POC pipeline, EVS metrics, action items                        |
| q-plan-pm              | Good but incomplete | 124   | Mar 6        | Quarterly tracking, but "Estimation Accuracy" and "Cross-Quarter Patterns" empty |
| kyc-product-pm         | Incomplete          | 118   | Feb 13       | Mostly "NOT STARTED" placeholders. Research roadmap, not operational memory      |
| dev-frontend           | Dead stub           | 18    | Mar 6        | "No components built yet" despite working app                                    |
| dev-backend            | Dead stub           | 18    | Feb 7        | "No hooks built yet" despite working app                                         |
| dev-team-lead          | Minimal             | 23    | Mar 6        | Task hygiene stub                                                                |
| ab-testing             | Minimal             | 24    | Mar 1        | Registry stub                                                                    |


### 2.3 Agent Context Files


| Agent                  | context.md        | Quality                                                                     |
| ---------------------- | ----------------- | --------------------------------------------------------------------------- |
| hub-countries-pm       | Yes (251 lines)   | **Exceptional** — regulatory landscape, competitive intel, 30+ sourced URLs |
| vendor-optimization-pm | Yes (newly added) | Recently created                                                            |
| kyc-product-pm         | No                | **Missing** — inconsistent with the pattern                                 |
| Others                 | N/A               | Context files are domain-specific; not all agents need them                 |


### 2.4 Shared Knowledge Layer

**PM Team:**

- `clm-context.md` (228 lines, Feb 7) — Good foundation but **55 days stale**. Contains Q1 priorities that may have shifted.
- `workflows.md` (250+ lines) — Comprehensive SOPs. Well-designed but **not enforced in code**.
- `playbook.md` (116 lines) — Active but **sparse**. Large empty sections (Stakeholder Patterns, Anti-Patterns). Only ~11 entries total.

**Dev Team:**

- `app-context.md` (109 lines) — Good technical guidance for the app
- `workflows.md` (95+ lines) — Well-designed but **untested** (team pre-MVP)
- `playbook.md` (64 lines) — Skeleton only, 2 entries

### 2.5 Embeddings Usage in Agents

Embeddings **are** being used effectively by PM agents:

- `hub-countries-pm`: Uses `searchByType()` in check-in and investigate commands
- `q-plan-pm`: Uses in analyze command
- `team-lead`: Uses in synthesize command
- `kyc-product-pm`: Uses in research command
- `ppp/enrich`: Uses for PPP enrichment

**Gap:** Dev team agents don't use embeddings at all.

### 2.6 Critical Agent Issue: Context Loading Mismatch

Agent definitions specify elaborate startup protocols (read clm-context.md, read domain context, read playbook, etc.), but **the actual TypeScript code doesn't implement these file reads**. Agents rely on `searchByType()` embeddings instead of explicit file loading.

This actually works (embeddings provide flexible dynamic context), but the documentation doesn't match the implementation. Either implement the documented file reads or update the docs.

---

## Part 3: Claude.ai vs Claude Code

### 3.1 Why Claude Code Works Better


| Factor              | Claude Code                                              | Claude.ai                                                            |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- |
| **Instructions**    | CLAUDE.md: 395 lines, structured as decision guide       | Project instructions: ~4,500 words, tries to be complete manual      |
| **Context loading** | On-demand: agents scan frontmatter, read what's relevant | All-at-once: 7,000+ words loaded before first message                |
| **Data freshness**  | Local files are edited directly, always current          | DB data is stale (3+ weeks on multiple tables)                       |
| **Memory**          | Per-agent memory.md files, scoped and maintained         | Project memory is unstructured accumulation, no freshness management |
| **Sourcing**        | Code outputs are verifiable (files, SQL)                 | No citation pattern — Claude.ai "makes things up"                    |


### 3.2 Claude.ai Specific Issues

1. **SQL typo**: `WHERE stus = 'open'` in session start protocol (Claude autocorrects, but should fix)
2. **Stale row counts**: Says "39 people" (actually 44), "38 meetings" (actually 55), etc.
3. **Full schema in always-loaded context**: Every table, every column, every enum — should be reference material
4. **Duplicate org chart**: In both instructions and project memory
5. **Hardcoded UUIDs** in project memory (7 people)
6. **Project memory as kitchen sink**: No timestamps, no pruning, stale items treated as truth
7. **No sourcing pattern**: Nothing tells Claude.ai to cite data sources and dates
8. `**fssfddsadsakjh`** at the end of project memory — accidental input

### 3.3 Dual-Storage Drift Risk


| Data Type           | Claude Code Source              | Claude.ai Source              | Sync?                      |
| ------------------- | ------------------------------- | ----------------------------- | -------------------------- |
| Initiative memory   | Local `initiatives/*/memory.md` | DB `content_sections`         | No sync — drift guaranteed |
| Agent memory        | Local `pm_team/*/memory.md`     | Not accessed                  | One-way only               |
| People/meetings/PPP | DB (via agents)                 | DB (direct)                   | Same source                |
| Priorities          | CLAUDE.md + local files         | `context_store.current_focus` | Separate, can diverge      |
| Workflows           | Local docs                      | `context_store.workflow_*`    | Separate copies            |


---

## Part 4: What's Working Well

1. **Hybrid architecture** — Local files for Code + DB for Chat is the right pattern (industry consensus)
2. **Layered knowledge model** — clm-context → workflows → playbook → context.md → memory.md is well-designed
3. **Embeddings infrastructure** — Working, used by PM agents, provides flexible semantic search
4. **Agent definitions** — Consistent pattern across all agents, clear scope and responsibilities
5. **Hub-countries PM** — Memory + context files are exceptional quality, a model for other agents
6. **Initiative memory pattern** — Living docs that accumulate context over time (when maintained)
7. **View layer** — 12 views cover common access patterns, reducing query complexity
8. **Data integrity** — Zero orphaned foreign key references
9. **Context library** — Frontmatter-based auto-loading is elegant and extensible
10. **Local initiative workspaces** — `initiatives/*/CLAUDE.md` + `memory.md` pattern for Code is excellent

---

## Part 5: What's Missing — Future Vision

### 5.1 Proactive Daily Briefing (Highest Impact)

The system is entirely pull-based. Build a **scheduled briefing agent** that runs daily/weekly and surfaces:

- Action items aging >7 days
- People you haven't met in >2 weeks  
- Initiatives with no PPP update this week
- Deliverables approaching deadline
- PPP quality score drops
- Agent tasks stuck pending

Output to `agent_coordination` or a push notification. You already have cron/schedule infrastructure.

### 5.2 Temporal Staleness Scoring

Add `days_open` and staleness tiers (fresh/aging/stale/critical) to views. Flag initiative memory docs with `updated_at > 14 days`. Make everything time-aware.

### 5.3 Calendar Auto-Sync

Meeting data requires manual entry — this is the #1 friction point causing knowledge decay. You have Google Calendar MCP tools. Build a sync that auto-creates `meetings` rows from calendar events, resolves attendees against `people`, and pre-populates prep context.

### 5.4 Cross-Entity Synthesis

Surface emergent connections across domains. Example: "Elad's PPP vendor mention relates to Ido's policy deadline and Yael's licensing dependency." Use embedding co-occurrence analysis.

### 5.5 Effectiveness Metrics

Track automatically:

- **Coverage**: Days since last 1:1 per direct report
- **Follow-through**: % action items completed vs stale
- **Signal detection**: Issues surfaced before escalation vs surprises
- **Context freshness**: Average age of initiative memory docs

### 5.6 Source Citations (Auditability)

Add to Claude.ai instructions: "Every factual claim must reference source and date." Example: "Based on the Mar 12 PPP report..." or "From your 1:1 with Elad on Mar 24..."

### 5.7 Architectural Direction: Thin UI + Smart Terminal (Decided Apr 2)

**The model:** Terminal (Claude Code) is the primary interaction surface for conversation, synthesis, and action. The React app becomes a **read-only command center** for things that need to be visual.

```
┌──────────────────────────┐     ┌──────────────────────────┐
│   Terminal (Claude Code)  │     │   Browser (React App)     │
│   ═══════════════════════ │     │   ═══════════════════════ │
│                           │     │                           │
│ • Conversation & action   │     │ • Relationship spider     │
│ • Agent orchestration     │     │ • Timeline / Gantt        │
│ • Meeting prep & logging  │     │ • Staleness heatmap       │
│ • PPP analysis            │     │ • Daily briefing cards    │
│ • Decision support        │     │ • Agent health dashboard  │
│ • Scheduled agents (cron) │     │ • Effectiveness metrics   │
│                           │     │                           │
│ [writes computed insights │────▶│ [renders what agents      │
│  to Supabase]             │     │  computed — no own logic] │
└──────────────────────────┘     └──────────────────────────┘
                │                             │
                └──────────┬──────────────────┘
                           │
                ┌──────────▼──────────┐
                │  Supabase Postgres  │
                │  (Source of Truth)  │
                └─────────────────────┘
```

**Key principles:**
- All intelligence stays in Claude (agents compute, app renders)
- App has no business logic — just queries views and displays
- Scheduled agents write briefings, scores, alerts to DB; app shows them
- Terminal + browser side by side is the daily operating setup
- No capability loss — Claude Code keeps full agent/automation power

**What the thin UI gains us:**
- Visual relationship graphs (people ↔ initiatives ↔ blockers ↔ PPP signals)
- At-a-glance morning dashboard without starting a conversation
- Temporal views (timelines, deadline proximity, aging items)
- System health monitoring (agent activity, data freshness)

**What stays in the terminal:**
- All conversation, synthesis, reasoning
- Meeting prep and logging
- PPP ingestion and analysis
- Agent management and task orchestration
- Decision support and coaching context

---

## Part 6: Prioritized Action Plan

### Tier 1: Fix What's Broken (This Week)


| #   | Action                                                       | Impact | Effort                    |
| --- | ------------------------------------------------------------ | ------ | ------------------------- |
| 1   | Update `current_focus` with actual April priorities          | High   | Low (needs Yonatan input) |
| 2   | Triage 15 pending agent tasks (cancel stale, assign valid)   | Medium | Low                       |
| 3   | Fix content_section naming (`coaching_log` → `coaching-log`) | Low    | Low                       |
| 4   | Regenerate embeddings (`npm run embed:all`)                  | Medium | Low                       |
| 5   | Investigate and restore PPP pipeline                         | High   | Medium                    |


### Tier 2: Claude.ai Overhaul (This Week)


| #   | Action                                                    | Impact | Effort                 |
| --- | --------------------------------------------------------- | ------ | ---------------------- |
| 6   | Rewrite Claude.ai project instructions (~60% smaller)     | High   | Medium                 |
| 7   | Move schema + enums + query recipes to reference approach | High   | Medium                 |
| 8   | Add sourcing/auditability instructions                    | High   | Low                    |
| 9   | Prune project memory item by item                         | High   | Medium (needs Yonatan) |
| 10  | Fix SQL typo in session start protocol                    | Low    | Trivial                |


### Tier 3: Data Quality (Next 2 Weeks)


| #   | Action                                                       | Impact | Effort                 |
| --- | ------------------------------------------------------------ | ------ | ---------------------- |
| 11  | Review 26 project_decisions — mark resolved/superseded       | Medium | Medium                 |
| 12  | Close Q1 quarterly plan, create Q2                           | High   | Medium (needs Yonatan) |
| 13  | Assign or flag 16 unassigned initiatives                     | High   | Medium (needs Yonatan) |
| 14  | Create memory doc for `kyc-new-flow` (P1, missing)           | Medium | Low                    |
| 15  | Refresh 11 stale initiative memory docs                      | Medium | High                   |
| 16  | Enrich people data (working_style, strengths for key people) | Medium | High (needs Yonatan)   |


### Tier 4: Agent & Architecture Improvements (Next Month)


| #   | Action                                                     | Impact | Effort  |
| --- | ---------------------------------------------------------- | ------ | ------- |
| 17  | Slim CLAUDE.md from 395 → <300 lines                       | Medium | Medium  |
| 18  | Create context.md for kyc-product-pm                       | Medium | Medium  |
| 19  | Refresh clm-context.md for Q2                              | Medium | Medium  |
| 20  | Delete dev team memory stubs (or fill them)                | Low    | Trivial |
| 21  | Build dual-storage sync mechanism                          | Medium | High    |
| 22  | Decide on empty tables (tags, products, task_dependencies) | Low    | Low     |
| 23  | Flesh out PM playbook (extract from agent_log)             | Medium | Medium  |


### Tier 5: Command Center + Proactive Intelligence (Next Quarter)

**Architecture:** Thin React UI as read-only command center + scheduled Claude Code agents. Terminal stays primary for all interaction.

| #   | Action                                                            | Impact    | Effort | Notes                                                   |
| --- | ----------------------------------------------------------------- | --------- | ------ | ------------------------------------------------------- |
| 24  | Build scheduled daily briefing agent (cron)                       | Very High | High   | Writes computed briefing to DB; app renders as cards     |
| 25  | Add temporal staleness scoring to views                           | Medium    | Low    | `days_open`, freshness tiers on action items + memories  |
| 26  | Build relationship spider graph (React app)                       | High      | High   | People ↔ initiatives ↔ blockers ↔ PPP signals           |
| 27  | Build staleness heatmap page (React app)                          | Medium    | Medium | Visual grid of what's aging across all domains           |
| 28  | Calendar auto-sync (Google Calendar → meetings table)             | Very High | High   | Auto-create meeting rows, resolve attendees from people  |
| 29  | Build effectiveness metrics dashboard (React app)                 | Medium    | Medium | Coverage, follow-through, signal detection, freshness    |
| 30  | Cross-entity synthesis agent (scheduled)                          | Medium    | High   | Weekly embedding co-occurrence analysis                  |
| 31  | Enable RLS on sensitive tables                                    | Medium    | High   | Security hardening for when app uses anon key            |


---

## Progress Log

**Tier 1 — COMPLETE (Apr 2)**
- [x] 17 stale agent_tasks deferred (marked failed with audit note)
- [x] content_sections naming fixed: `coaching_log`→`coaching-log` (4 rows), `note`→`notes` (1 row)
- [x] Embeddings regenerated: 114 new (36 person, 42 initiative-memory, 20 initiative, 15 agent-log, 1 research)
- [x] PPP pipeline investigated: not broken, just manual. Missing decks for Mar 19, 26, Apr 2
- [x] `current_focus` updated with April priorities (4 AI initiatives, eBay, product principles, Elad feedback, CLM rollout, CLM mobile)
- [x] Added waiting-on: Jojo (What Went Right), Eliya (Brazil/UK doc), Meital (delegated onboarding strategy)

**Tier 2 — COMPLETE (Apr 2)**
- [x] New Claude.ai instructions drafted: `output/claude-ai-instructions-v2-draft.md` (~1,800 words, down from ~4,500)
- [x] Schema reference created as project file: `output/claude-ai-schema-reference.md`
- [x] Sourcing/auditability section added (hard rule: cite source + date, flag >2 weeks)
- [x] SQL typo fixed (`stus`→`status`)
- [ ] Project memory pruning — deferred (Yonatan reviewed, leaving as-is for now)

**Revised execution order (decided Apr 2):**
- Tier 4 (Agent & Architecture) → Tier 5 (Command Center) → Tier 3 (Data Quality)
- Rationale: Build the tools first, then use them to improve the data

## Appendix: Questions for Yonatan

These items need your input before we can proceed:

1. **Current priorities** — What's top of mind right now? (to refresh `current_focus`)
2. **Q2 planning** — Has Q2 planning started? What are the Q2 initiatives?
3. **Initiative assignments** — Which of the 16 unassigned initiatives actually need agent tracking?
4. **Empty tables** — Should we keep `tags`, `entity_tags`, `products`, `task_dependencies` or drop them?
5. **PPP source data** — Do you have the PPP decks for Mar 19, 26, Apr 2?
6. **Project memory pruning** — Ready to go through items together?
7. **Calendar sync** — Would auto-syncing Google Calendar meetings be valuable?
8. **Daily briefing** — Would a proactive daily/weekly briefing be useful? What would you want in it?

