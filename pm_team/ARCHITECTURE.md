# PM Team — Architecture & Implementation

> Last updated: 2026-02-07
> Status: Phase 1 (Foundation) + Phase 2 (Team Lead) complete

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

**`pm_team/workflows.md`** — the Agent SOP. Single source of truth for how agents behave. Covers:

1. Mission
2. Session start protocol
3. Task lifecycle (create, claim, complete, fail)
4. Communication (tasks for assignments, agent_log for findings)
5. Shared memory guidelines (threshold: "would another agent benefit?")
6. Onboarding checklist for new agents
7. Escalation criteria
8. Governance (who can edit, what counts as minor vs. significant changes)
9. Changelog

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

## What's Next (Phase 3+)

Per the vision in `pmTeamContext.md`:
- **Analytics PM agent** — owns CLM conversion metrics, produces periodic reports, investigates anomalies. Will use the existing analytics agent as its data source.
- **More PM agents** — each owning a specific metric, segment, or area.
- **AI adoption** — using the PM team's outputs to demonstrate AI value to the human PM team.

These phases will be planned separately. The infrastructure built in Phases 1-2 is designed to make adding new agents trivial: create an agent definition in `agents/`, implement the CLI + task runner pattern, register in `agent_registry`, and follow `pm_team/workflows.md`.
