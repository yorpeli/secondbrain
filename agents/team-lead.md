# Team Lead Agent

## Purpose

Maintain PM team health through three responsibilities:
- **Backlog hygiene**: Detect overdue, stale, stuck, and failed tasks across all agents
- **Cross-agent synthesis**: Identify patterns, themes, contradictions, and gaps across agent findings
- **Workflow enforcement**: Check that agents follow the SOPs in `pm_team/workflows.md`

The team-lead does not do analytical work itself. It monitors and coordinates.

## Tools Available

- **Supabase MCP**: Query `v_agent_tasks_dashboard`, `agent_log`, `agent_registry`, `agent_tasks`
- **Logging**: Write findings to `agent_log` via `lib/logging.ts`
- **Task creation**: Create follow-up tasks via `lib/tasks.ts`

## Invocation Pattern

**CLI (direct):**
```bash
npx tsx pm_team/team-lead/run.ts hygiene [--days=7]
npx tsx pm_team/team-lead/run.ts synthesize [--days=7] [--agents=analytics,data-viz]
npx tsx pm_team/team-lead/run.ts enforce [--workflow=all]
npx tsx pm_team/team-lead/run.ts check-tasks
```

**Agent task (from other agents or humans):**
```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Run backlog hygiene check',
  '{"type":"hygiene"}',
  'team-lead',
  'pending',
  'normal',
  'claude-chat'
);
```

## Commands

### `hygiene`

Scans `v_agent_tasks_dashboard` for problems. No LLM needed.

**Detects:**
- Overdue tasks (due_date < today, not done/failed)
- Stale tasks (pending > 7 days, never picked up)
- Stuck tasks (picked-up but no update > 24h)
- Failed tasks without follow-up child tasks
- Tasks awaiting human action (tagged `needs-human`)

**Output:** Console summary + `agent_log` entry (category: `observation`, tags: `['team-lead', 'hygiene']`)

### `synthesize`

Reads recent `agent_log` entries and completed `agent_tasks` across all agents. Identifies patterns.

**Process:**
1. Query `agent_log` for last N days, grouped by agent
2. Query recently completed tasks with results
3. Detect themes (recurring tags), gaps (inactive agents), and surface recommendations
4. Write synthesis to `agent_log` (category: `finding`, tags: `['team-lead', 'synthesis']`)

**Options:**
- `days`: Lookback period (default: 7)
- `agents`: Filter to specific agents (comma-separated)

### `enforce`

Checks agent compliance with `pm_team/workflows.md`.

**Checks:**
- Completed tasks have `result_summary` populated
- Active agents have recent `agent_log` entries
- New agents have completed onboarding (have at least one log entry)
- Failed tasks have follow-up tasks

**Output:** Compliance report to `agent_log` (category: `observation`, tags: `['team-lead', 'enforce']`)

## Task Format

Tasks in `agent_tasks.description` can be JSON or natural language:

**JSON (preferred):**
```json
{"type": "hygiene", "days": 14}
{"type": "synthesize", "days": 30, "agents": ["analytics", "data-viz"]}
{"type": "enforce"}
```

**Natural language (keyword fallback):**
- "Run backlog hygiene check"
- "Synthesize recent agent activity"
- "Check workflow compliance"

## Logging Guidelines

Uses existing categories:
- `observation` — hygiene issues found, compliance check results
- `finding` — synthesis insights, cross-agent patterns
- `recommendation` — suggested actions based on patterns
- `error` — task execution failures

Always tag with `team-lead` + command name (`hygiene`, `synthesis`, `enforce`).

## Environment

Requires:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for DB access
