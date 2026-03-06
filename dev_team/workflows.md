# Dev Team — Workflows & SOPs

> Version 1.0 — 2026-03-06
> Editable by: dev-team-lead agent (minor changes), Yonatan (any changes)

---

## 1. Mission

The Dev Team is an AI engineering team operating inside Claude Code. We build and maintain the Second Brain UI — a local dashboard that visualizes Yonatan's knowledge management data. The team-lead orchestrates planning and delegation, specialist agents (frontend, backend) execute implementation, and the architect provides design and technical guidance.

**We build what Yonatan approves.** The team-lead translates feature requests into plans, gets approval, then delegates. No speculative features.

---

## 2. Session Start Protocol

When an agent starts a session (CLI run or task pickup):

1. **Read app context**: Read `dev_team/app-context.md` — tech stack, structure, design principles
2. **Check backlog**: Query `agent_tasks` for pending tasks assigned to you
3. **Read recent agent_log**: Scan last 48h of entries from dev team agents
4. **Check this file**: If `workflows.md` has been updated since your last run, read the changelog
5. **Check the playbook**: If `dev_team/playbook.md` has new entries, read them

```sql
-- Check your backlog
SELECT id, title, priority, due_date FROM agent_tasks
WHERE (target_agent = '{my-slug}' OR target_agent IS NULL)
  AND status = 'pending'
ORDER BY priority DESC, created_at ASC;

-- Recent dev team activity
SELECT agent_slug, category, summary, created_at
FROM agent_log
WHERE agent_slug IN ('dev-team-lead', 'dev-frontend', 'dev-backend', 'dev-architect', 'dev-designer')
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC LIMIT 20;
```

---

## 3. The Planning Workflow

This is the core workflow. Every feature goes through this cycle.

### 3.1 Feature Request

Yonatan describes what he wants to see in the app. The team-lead receives this.

### 3.2 Plan Phase

Team-lead runs `plan "<feature description>"`:

1. Reads the architect definition (`agents/app-architect.md`) for technical guidance
2. Reads the designer definition (`agents/dev-designer.md`) for UX/UI guidance
3. Scans existing app code (components, hooks, pages) for reuse opportunities
4. Checks in-progress work to avoid conflicts
5. Produces a **plan document** with:
   - Overview (what we're building, why)
   - Routes and pages
   - Components (with design specs — layout, states, interactions per designer format)
   - Data layer (queries, hooks, types)
   - Design notes (layout, visual identity, responsive behavior, dark/light considerations)
   - Build sequence (ordered steps with dependencies)

### 3.3 Approval

Team-lead presents the plan to Yonatan. Yonatan approves, requests changes, or rejects.

### 3.4 Delegation

Team-lead runs `delegate` to create tasks:
- Backend tasks: query hooks, types, data transforms
- Frontend tasks: components, pages, styling
- Sequenced correctly (backend data layer before frontend consumption)
- Each task references the plan and includes specific acceptance criteria

### 3.5 Execution

Engineers pick up tasks via `check-tasks` or direct CLI invocation. Each task:
1. Read the plan and task spec
2. Implement following conventions in `playbook.md`
3. Write result summary when done

### 3.6 Review

Team-lead reviews completed work:
- Convention compliance
- Plan adherence
- Component quality
- Integration correctness
- Design consistency (per designer specs — spacing, states, theme parity)

---

## 4. Task Lifecycle

Same as PM team convention (see root `CLAUDE.md`):

- **Creating**: `status = 'pending'`, `created_by = 'agent:{slug}'`
- **Claiming**: `status = 'picked-up'`, `picked_up_by = '{slug}'`
- **Completing**: `status = 'done'`, `result_summary` always populated
- **Failing**: `status = 'failed'`, error logged

### Task Conventions for Dev Team

Tasks targeted at dev agents use JSON descriptions:

```json
{
  "type": "build",
  "component": "initiative-list",
  "spec": "Table component showing initiatives with status, priority, agent, staleness",
  "plan_ref": "initiatives-v1",
  "dependencies": ["use-initiatives hook"]
}
```

```json
{
  "type": "build",
  "hook": "use-initiatives",
  "spec": "Tanstack Query hook for v_initiative_dashboard view",
  "plan_ref": "initiatives-v1"
}
```

---

## 5. Communication

Database-only, same as PM team. Agents talk through:
- `agent_tasks` — assignments and work
- `agent_log` — findings, observations, decisions

### Dev Team Agent Slugs

| Agent | Slug | Type |
|-------|------|------|
| Team Lead | `dev-team-lead` | TypeScript CLI |
| Frontend Engineer | `dev-frontend` | TypeScript CLI |
| Backend Engineer | `dev-backend` | TypeScript CLI |
| Architect | `dev-architect` | Definition-only |
| Designer | `dev-designer` | Definition-only |

---

## 6. Knowledge Model

Same four-layer model as PM team, scoped to the app:

| Layer | File | Scope |
|-------|------|-------|
| **App context** | `dev_team/app-context.md` | What we're building, tech stack, structure |
| **Process** | `dev_team/workflows.md` | How to operate (this file) |
| **Shared knowledge** | `dev_team/playbook.md` | Component patterns, gotchas, lessons |
| **Individual memory** | `{agent}/memory.md` | Agent-specific context |

### Decision rule for where to write

- "How should the team work?" -> check `workflows.md`
- "What pattern should any dev agent follow?" -> add to `playbook.md`
- "What did I learn about my specific area?" -> add to my `memory.md`
- "What's a significant finding?" -> write to `agent_log`

---

## 7. Conventions

### Naming

- Components: PascalCase (`InitiativeList.tsx` -> exports `InitiativeList`)
- Hooks: camelCase with `use` prefix (`use-initiatives.ts` -> exports `useInitiatives`)
- Pages: kebab-case files (`initiative-detail.tsx`)
- CSS: Tailwind utility classes only (no custom CSS except shadcn globals)

### Component Rules

- Every component gets its own file
- Props interfaces defined in the same file
- No inline Supabase queries — use hooks
- Loading and error states handled via Tanstack Query patterns
- Responsive by default (mobile-first with Tailwind breakpoints)

### Hook Rules

- One file per data domain (`use-initiatives.ts`, `use-people.ts`)
- Export named hooks, not default
- Return Tanstack Query results directly (let components handle loading/error)
- Query keys follow pattern: `[domain, ...params]` (e.g., `['initiatives']`, `['initiative', slug]`)

---

## 8. Escalation

Create a task for Yonatan (`target_agent = NULL`, `tags = ['needs-human', 'dev-team']`) when:
- Design decision needed that affects UX
- Data model question (missing view, new query needed)
- Feature scope unclear

---

## 9. Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-06 | Yonatan + Claude Code | v1.0 — Initial version |
| 2026-03-06 | Yonatan + Claude Code | v1.1 — Added Designer agent to planning and review flow |
