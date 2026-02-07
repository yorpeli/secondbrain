# PM Team — Agent Workflows & SOPs

> Version 1.0 — 2026-02-07
> Editable by: team-lead agent (minor changes), Yonatan (any changes)

---

## 1. Mission

The PM Team is an autonomous AI product management team operating inside Claude Code. We own CLM conversion rate improvement: scanning for opportunities, diagnosing issues, tracking progress, and surfacing insights that help Yonatan and his team make better decisions.

**We are not autonomous decision-makers.** We research, analyze, recommend, and escalate. Decisions that affect people, strategy, or org resources go to Yonatan.

---

## 2. Session Start Protocol

When an agent starts a session (CLI run or task pickup), follow this sequence:

1. **Check backlog**: Query `agent_tasks` for pending tasks assigned to you
2. **Read recent agent_log**: Scan last 48h of entries from all agents for relevant context
3. **Check this file**: If `workflows.md` has been updated since your last run, read the changelog (Section 9)

```sql
-- Check your backlog
SELECT id, title, priority, due_date FROM agent_tasks
WHERE (target_agent = '{my-slug}' OR target_agent IS NULL)
  AND status = 'pending'
ORDER BY priority DESC, created_at ASC;

-- Recent cross-agent activity
SELECT agent_slug, category, summary, created_at
FROM agent_log
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC LIMIT 20;
```

---

## 3. Task Lifecycle

### Creating Tasks

Required fields:
- `title`: Clear, actionable description (imperative form)
- `created_by`: Your agent slug prefixed with `agent:` (e.g., `agent:team-lead`)
- `status`: Always `pending` for new tasks

Recommended fields:
- `target_agent`: Which agent should handle this (null = any agent can pick up)
- `priority`: `low`, `normal`, `high` (default: `normal`)
- `description`: JSON command spec or detailed instructions
- `due_date`: When this should be completed by
- `tags`: For discovery and filtering
- `parent_task_id`: If this is a follow-up from another task

### Claiming Tasks

1. Only claim tasks where `status = 'pending'`
2. Set `status = 'picked-up'` and `picked_up_by = '{my-slug}'`
3. Don't claim tasks targeted at other agents

### Completing Tasks

1. Set `status = 'done'`
2. Write `result_summary` — always (even if brief)
3. Write `result_details` (jsonb) — for structured data that downstream agents can consume
4. Set `completed_at`
5. Log substantial findings to `agent_log`

### Failing Tasks

1. Set `status = 'failed'`
2. Write error to `result_summary`
3. Log error to `agent_log` via `logError()`
4. Consider: should a follow-up task be created?

---

## 4. Communication

Agents communicate through the database only. No direct agent-to-agent calls.

### Assignments → `agent_tasks`

To request work from another agent, create a task with `target_agent` set:

```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Deep dive into Brazil CLM performance',
  '{"type": "deep-dive", "country": "Brazil"}',
  'analytics',
  'pending',
  'normal',
  'agent:team-lead'
);
```

### Findings & Recommendations → `agent_log`

To share insights with all agents, write to `agent_log`:
- `observation`: Something you noticed (trends, patterns, anomalies)
- `finding`: Something you discovered (confirmed insight with data)
- `recommendation`: Suggested action (with rationale)
- `error`: Something that went wrong
- `decision`: A decision made (usually by humans, recorded by agents)

---

## 5. Shared Memory

### When to Write to `agent_log`

**Threshold:** "Would another agent or human benefit from knowing this?"

**Write when:**
- You discover a cross-cutting pattern
- You find a contradiction between data sources
- You identify a gap that needs investigation
- You complete a significant analysis with actionable results
- Something fails in an unexpected way

**Don't write when:**
- Routine task completion (already tracked in `agent_tasks`)
- Intermediate computation steps
- Data that's already available in its source table

### Tagging Convention

Always include your agent slug as a tag. Use additional tags for discoverability:
- Agent: `team-lead`, `analytics`, `data-viz`
- Category: `hygiene`, `synthesis`, `enforcement`, `opportunity`, `diagnostic`
- Domain: `kyc`, `onboarding`, `compliance`, `localization`
- Geography: Country names (lowercase, hyphenated)

---

## 6. Onboarding Checklist (New Agents)

When a new agent is created, it should:

1. [ ] Read this file (`pm_team/workflows.md`)
2. [ ] Read `CLAUDE.md` for database schema and project conventions
3. [ ] Check `agent_registry` for existing agents and their capabilities
4. [ ] Check `agent_tasks` for any pre-assigned backlog
5. [ ] Register in `agent_registry` (optional but recommended)
6. [ ] Introduce self via `agent_log` (category: `observation`, summary: "Agent {slug} initialized — {purpose}")

---

## 7. Escalation

Create a task for Yonatan (`target_agent = NULL`, `tags = ['needs-human']`) when:

- **Human judgment needed**: Ambiguous data requiring product intuition
- **Org authority required**: Cross-team coordination, resource allocation
- **Real-world action needed**: Sending messages, scheduling meetings, approving changes
- **Significant findings**: RED flag diagnostics, major trend reversals, new opportunities
- **Conflicting signals**: When agent findings contradict each other

Format for human-facing tasks:
```
Title: [ACTION NEEDED] Brief description
Description: Context, what was found, recommended action, urgency
Priority: Match the urgency (high for time-sensitive)
Tags: ['needs-human', '{domain}']
```

---

## 8. Workflow Governance

### Who Can Edit This File

- **Team-lead agent**: Minor changes (adding examples, clarifying language, updating tags)
- **Yonatan**: Any changes (new workflows, policy changes, structural edits)

### What Counts as "Minor"

- Fixing typos or clarifying wording
- Adding new tag conventions
- Updating SQL examples to match schema changes
- Adding items to the onboarding checklist

### What Needs Approval

- New sections or workflows
- Changing escalation criteria
- Modifying task lifecycle rules
- Changing communication protocols

---

## 9. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-02-07 | Yonatan + Claude Code | v1.0 — Initial version |
