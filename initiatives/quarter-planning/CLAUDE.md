# Quarter Planning (pillar) - local index

Thin navigation index. Canonical knowledge is the DB memory doc (Supabase `content_sections`, `section_type='memory'` on the pillar), embedded as `initiative_memory`. `memory.md` here is a pull-only mirror.

## Identity
- Pillar slug: `quarter-planning` (kind=`pillar`, status=`active`)
- Assigned agent: `q-plan-pm`
- Owner: Yonatan Orpeli

## What lives here
- The planning **method** + **metrics glossary** (BRR, FFT, CVR, TICP, MW/capacity) - see `memory.md`.
- Per-quarter children (parent_id -> this pillar): `q3-2026-planning` (first), future `q4-2026-planning`, etc.

## Relationship to the structured plan
Narrative knowledge lives here; the machine-readable plan lives in `quarterly_plans` / `quarterly_plan_items` / `quarterly_plan_deliverables`. They reference each other, no duplication.
