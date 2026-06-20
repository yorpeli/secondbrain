# Q3 2026 Planning - local index

Thin navigation index. Canonical knowledge is the DB memory doc (Supabase `content_sections`, `section_type='memory'`), embedded as `initiative_memory`. `memory.md` here is a pull-only mirror.

## Identity
- Initiative slug: `q3-2026-planning` (kind=`initiative`, status=`active`, priority=`P1`)
- Parent pillar: `quarter-planning`
- Assigned agent: `q-plan-pm`
- Owner: Yonatan Orpeli
- Window: 2026-07-01 to 2026-09-30
- Structured plan: `quarterly_plans` row `Q3-2026` (items = the 6 strategic threads; deliverables = line-items, capture pending)

## Working files
- `_render.py` - **canonical renderer**: reads the workbooks, auto-maps items to the 9 threads, applies discussion decisions, emits `plan.md` + `q3-plan-review.html`. Re-run: `python3 _render.py`. Corrections to the map/decisions are made here.
- `plan.md` - generated working draft (threads → items → deps → metrics)
- `q3-plan-review.html` - generated tabbed review view (Overview · 9 threads · Cross-team)
- `memory.md` - pull-only mirror of the canonical DB memory doc
- `docs/CLM Quarter Planning Q3 2026.xlsx` - source workbook (Elad/Ido/Licensing/Infra, 8 tabs)
- `docs/H2 2026 Candidates - Self Service.xlsx` - source workbook (Ira/Self-Service)

## Stakeholders
Yonatan (owner), Elad, Ido, Meital, Sitara, Ira, Estella, Shilhav. See the DB memory doc Stakeholders section.
