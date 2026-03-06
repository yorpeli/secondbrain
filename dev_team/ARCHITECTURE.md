# Dev Team — Architecture & Implementation

> Last updated: 2026-03-06
> Status: Phase 1 (Team Foundation) complete

---

## What Exists

The Dev Team is an AI engineering team operating inside Claude Code, responsible for building and maintaining the Second Brain UI app.

### Team Structure

```
Yonatan
  |
  v
Team Lead (dev-team-lead)
  |-- consults --> Architect (dev-architect, definition-only)
  |-- delegates --> Frontend Engineer (dev-frontend)
  |-- delegates --> Backend Engineer (dev-backend)
```

**Workflow:** Yonatan talks to team-lead -> team-lead plans (consulting architect) -> Yonatan approves -> team-lead delegates to engineers -> engineers build -> team-lead reviews.

### Infrastructure (Phase 1)

**Four context documents:**
- `app-context.md` — What the app is, tech stack, data sources
- `workflows.md` — How the team operates (planning cycle, task conventions)
- `playbook.md` — Shared patterns and learnings
- `ARCHITECTURE.md` — This file (decisions and implementation log)

**Team Lead Agent** — Four CLI commands:

| Command | Purpose |
|---------|---------|
| `plan "<feature>"` | Gather context, produce a structured plan |
| `delegate --plan=<ref>` | Break plan into tasks for frontend/backend |
| `review [--scope=<agent>]` | Check completed work against conventions |
| `status` | Team health and progress dashboard |

**Frontend Agent** — Two CLI commands:

| Command | Purpose |
|---------|---------|
| `build <component>` | Implement a component/page from task spec |
| `refactor <target>` | Improve existing UI code |

**Backend Agent** — Two CLI commands:

| Command | Purpose |
|---------|---------|
| `build <hook>` | Implement hooks, queries, data transforms |
| `refactor <target>` | Optimize queries, restructure data layer |

**Architect** — Definition-only agent (`agents/app-architect.md`). Consulted by team-lead during plan phase. Owns tech decisions, component patterns, data model, design guidelines.

---

## Key Architecture Decisions

1. **Team-lead is the orchestrator, not a builder.** Team-lead plans, delegates, and reviews. It never writes app code. This mirrors the PM team pattern where the team-lead does meta-work, not domain work.

2. **Frontend/backend separation.** Frontend owns React components, styling, layout. Backend owns Supabase queries, hooks, types, transforms. Clear ownership prevents coupling and enables parallel work.

3. **Architect is definition-only.** Architecture guidance lives in a markdown definition, not TypeScript. The team-lead reads it during planning. If complexity grows, it can be promoted to a TypeScript agent later.

4. **Separate `app/` directory with own package.json.** App dependencies (React, Vite, shadcn) don't pollute the root project's agent/script dependencies. The app is a self-contained sub-project.

5. **Reuse existing shared libraries where appropriate.** The app's Supabase client follows the same pattern as `lib/supabase.ts` but uses `VITE_` prefixed env vars for Vite compatibility. Agent task and logging utilities remain in root `lib/` — dev agents use them like PM agents do.

6. **Planning before building, always.** Every feature goes through the plan -> approve -> delegate -> build -> review cycle. No cowboy coding.

7. **Database views are the data API.** The app reads Supabase views, not raw tables. This keeps the UI decoupled from schema internals and lets views evolve without changing the app.

---

## Communication Patterns

Same as PM team — database-only:

```
Yonatan --> Team Lead (via CLI or conversation)
Team Lead --> Architect (reads definition doc during plan)
Team Lead --> Frontend/Backend (via agent_tasks)
Frontend/Backend --> Team Lead (via task completion + agent_log)
```

---

## What's Next

- **Phase 2**: Plan and build the Initiatives feature (first real test of the team)
- **Phase 3**: Additional views (People, PPP, Dashboard)
- **Phase 4**: Write capabilities (status changes, simple edits)
- **Phase 5**: Visual representations (charts, progress indicators)
- **Future**: Claude API integration for structured analysis within the UI
