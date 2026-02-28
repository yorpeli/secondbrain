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

1. **Read CLM context**: Read `pm_team/clm-context.md` — foundational business knowledge (company, domain, teams, metrics, constraints). On first run, read fully. On subsequent runs, check the `Last updated` date.
2. **Check backlog**: Query `agent_tasks` for pending tasks assigned to you
3. **Read recent agent_log**: Scan last 48h of entries from all agents for relevant context
4. **Check this file**: If `workflows.md` has been updated since your last run, read the changelog (Section 9)
5. **Check the playbook**: If `pm_team/playbook.md` has new entries since your last run, read them (check its changelog)
6. **Semantic search for task context**: If you have a specific task, use `searchByType()` to find relevant prior findings, playbook entries, and PPP data (see Section 5.5)

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

## 5.5. Semantic Search

All PM agents have access to semantic search via `searchByType()` from `lib/embeddings.ts`. This enables finding relevant context that tag-based queries miss.

### Entity Types

| Type | Content | Best for |
|------|---------|----------|
| `agent_log` | Agent findings, observations, recommendations | Cross-agent context, historical findings |
| `playbook` | Shared team knowledge, patterns, gotchas | Institutional knowledge |
| `ppp` | PPP swimlane entries (status, summary, scores) | Weekly status context, workstream patterns |
| `research` | Current research results | Domain knowledge, competitive analysis |
| `person` | People profiles (role, strengths, focus) | People context |
| `initiative` | Initiative objectives and rationale | Strategic context |

### Usage Pattern

```typescript
// Lazy import, try/catch, empty array fallback
let results = []
try {
  const { searchByType } = await import('../../../lib/embeddings.js')
  results = await searchByType(
    'UK approval rate drop',  // natural language query
    ['agent_log', 'ppp'],     // entity types to search
    { threshold: 0.70, limit: 5 }
  )
} catch {}
```

### When to Use Semantic vs Tag Queries

- **Tag queries** (SQL `overlaps`): When you know the exact tags — e.g., `tags @> ['uk']`
- **Semantic search**: When looking for conceptual matches — e.g., "approval rate regression" may match PPP entries tagged differently
- **Both**: Agent commands use tag queries for primary data and semantic search for supplementary context

### Threshold Guidelines

- `0.72`: Tight — use when precision matters (check-in, enrich). Fewer but more relevant results.
- `0.70`: Balanced — use for investigations and research. Good recall with reasonable precision.
- `0.65`: Loose — use for exploratory searches when casting a wide net.

### Graceful Degradation

Embedding failures (missing `OPENAI_API_KEY`, network errors) must never break agent commands. Always wrap in `try/catch {}` with empty array fallback.

---

## 6. Three-Layer Knowledge Model

PM agents operate with three layers of knowledge:

| Layer | File | Scope | Updated by |
|-------|------|-------|------------|
| **Process** | `pm_team/workflows.md` | How to operate (lifecycle, communication, escalation) | Team-lead (minor), Yonatan (any) |
| **Shared knowledge** | `pm_team/playbook.md` | What the team has learned (patterns, gotchas, domain insights) | Any PM agent, team-lead synthesize |
| **Individual memory** | `{agent}/memory.md` | Domain-specific working context (baselines, metrics, history) | The owning agent only |

### Decision rule for where to write

- "This is about **how I should work**" → check `workflows.md` (probably already there)
- "This is about **what any PM would benefit from knowing**" → add to `playbook.md`
- "This is about **my specific domain only**" → add to my `memory.md`
- "This is a **specific finding or recommendation**" → write to `agent_log` (and to `playbook.md` if generalizable)

### Adding to the playbook

When you learn something generalizable, add it to the appropriate section in `playbook.md`:
- Tag your entry with your agent slug and date
- Add a line to the playbook's changelog
- If unsure whether something is generalizable, write it to `agent_log` with tag `playbook-candidate` — team-lead synthesize will review

---

## 7. Onboarding Checklist (New Agents)

When a new agent is created, it should:

1. [ ] Read this file (`pm_team/workflows.md`)
2. [ ] Read `pm_team/playbook.md` for shared team knowledge
3. [ ] Read `CLAUDE.md` for database schema and project conventions
4. [ ] Check `agent_registry` for existing agents and their capabilities
5. [ ] Check `agent_tasks` for any pre-assigned backlog
6. [ ] Register in `agent_registry` (optional but recommended)
7. [ ] Introduce self via `agent_log` (category: `observation`, summary: "Agent {slug} initialized — {purpose}")

---

## 8. Escalation

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

## 9. Workflow Governance

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

## 10. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-02-07 | Yonatan + Claude Code | v1.0 — Initial version |
| 2026-02-07 | Yonatan + Claude Code | v1.1 — Added three-layer knowledge model (Section 6), playbook to session start and onboarding |
| 2026-02-28 | Claude Code | v1.2 — Added Section 5.5 (Semantic Search), step 6 to Session Start Protocol |
