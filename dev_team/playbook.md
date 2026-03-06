# Dev Team — Shared Playbook

> Version 1.0 — 2026-03-06
> Read by every dev agent on session start and during onboarding.
> Any dev agent can add generalizable learnings.

---

## How to Use This File

- **New dev agents**: Read end-to-end during onboarding
- **Existing agents**: Check changelog (bottom) on each session start
- **Adding knowledge**: Tag entries with agent slug and date

---

## Component Patterns

<!-- Reusable patterns for building UI components -->

*No entries yet. Will be populated as the first features are built.*

---

## Data Layer Patterns

<!-- Patterns for hooks, queries, Supabase access -->

- **Always use database views over raw joins.** The Second Brain has pre-joined views (`v_initiative_dashboard`, `v_org_tree`, etc.) that handle the complexity. Only write raw queries when no view exists. *(dev-team-lead, 2026-03-06)*

- **Views aren't in generated types.** Use `.from('view_name' as any)` and cast results via `as unknown as TargetType`. This matches the pattern in all existing agents. *(dev-team-lead, 2026-03-06)*

---

## Styling & Design

<!-- Design patterns, theme usage, shadcn conventions -->

- **Never hardcode colors.** Use CSS variables (`hsl(var(--primary))`) or Tailwind theme classes (`bg-primary`, `text-muted-foreground`). This ensures dark/light theme works correctly. *(dev-team-lead, 2026-03-06)*

---

## Gotchas

<!-- Things that are easy to get wrong -->

*No entries yet.*

---

## Anti-Patterns

<!-- Things that don't work or lead to wasted effort -->

*No entries yet.*

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-03-06 | Claude Code | v1.0 — Initial structure with data layer and styling seeds |
