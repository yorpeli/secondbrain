# Dev Team — App Context

> Version 1.0 — 2026-03-06
> The foundational knowledge document for the dev team. Read by all dev agents on session start.

---

## What This App Is

The Second Brain UI is a local-first, read-heavy dashboard for Yonatan's Second Brain system. It visualizes data already in Supabase — initiatives, people, PPP reports, meetings, and agent activity — that is otherwise only accessible via SQL or CLI.

**Primary user:** Yonatan Orpeli (VP Product, CLM at Payoneer)
**Access model:** Local only. Runs on `localhost`, synced via git, no auth needed.
**Data source:** Supabase Postgres (same instance used by Claude Code agents and Claude Chat)

## What It Is NOT

- Not a data entry tool (writes are minimal — status changes, not content creation)
- Not a replacement for Claude Chat or Claude Code (those remain the primary interaction layer)
- Not a shared/deployed app (no auth, no multi-tenancy, no CDN)

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vite + React + TypeScript | Fast, no server, minimal config |
| Components | shadcn/ui | Polished, themeable, accessible, Tailwind-based |
| Styling | Tailwind CSS | Utility-first, pairs with shadcn |
| Data fetching | Tanstack Query | Caching, background refresh, mutations when needed |
| Routing | React Router v7 | Multi-page ready, nested layouts |
| Charts | Recharts (via shadcn charts) | shadcn wraps it — unified styling |
| Markdown rendering | react-markdown + remark-gfm | For initiative memory docs |
| DB client | @supabase/supabase-js | Direct connection, same client pattern as agents |

## Design Principles

1. **Read-first, write-later.** Start with excellent data display. Add writes incrementally (status changes, not content editing).
2. **Dark and light themes from day one.** Use shadcn's CSS variable system. Never hardcode colors.
3. **Component-driven.** Every UI element is a composable component. Pages assemble components, not inline markup.
4. **Data hooks, not inline queries.** All Supabase queries live in `hooks/` as Tanstack Query hooks. Components never touch the DB client directly.
5. **Stale-while-revalidate.** Data is read-heavy and rarely changes mid-session. Cache aggressively, refetch in background.
6. **Progressive disclosure.** List views show summaries. Detail views show everything. Don't overwhelm.

## Supabase Access

The app uses the same Supabase instance as the rest of Second Brain:

```
VITE_SUPABASE_URL=https://tjlcdwsckbbkedyzrzda.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

For local-only use, service role key is acceptable. Store in `app/.env.local` (gitignored).

### Key Views & Tables

The app should prefer database views over raw table joins:

| View | Use in app |
|------|-----------|
| `v_initiative_dashboard` | Initiatives list page |
| `v_org_tree` | People pages |
| `v_ppp_swimlanes` | PPP display |
| `v_ppp_week_comparison` | Week-over-week PPP |
| `v_open_action_items` | Action items widget |
| `v_team_overview` | Team pages |
| `v_agent_tasks_dashboard` | Agent activity |
| `v_content_with_entity` | Notes, coaching logs |
| `v_research_current` | Research display |

For initiative detail, also query:
```sql
-- Initiative memory doc
SELECT content FROM content_sections
WHERE entity_id = '{initiative_id}' AND section_type = 'memory';
```

## App Structure

```
app/
  src/
    components/
      ui/           # shadcn primitives (auto-generated)
      layout/       # Shell, sidebar, theme provider
      {feature}/    # Feature-specific components (initiatives/, people/, etc.)
    hooks/          # Tanstack Query hooks (one file per domain)
    pages/          # Route-level page components
    lib/            # Supabase client, utils, types
    styles/         # Global CSS, shadcn theme variables
```

## Current Features

| Feature | Status | Route |
|---------|--------|-------|
| Initiatives list + detail | Planned | `/initiatives`, `/initiatives/:slug` |
| Dashboard | Stub | `/` |
| People | Stub | `/people` |
| PPP | Stub | `/ppp` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-06 | v1.0 — Initial version |
