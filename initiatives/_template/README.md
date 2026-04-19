# Initiative Template

Use this template when creating a new initiative workspace.

## Setup Checklist

1. **Copy this folder** to `initiatives/{slug}/`
2. **Create Supabase records**:
   - Insert into `initiatives` table (slug, title, objective, why_it_matters, status, priority, owner_id)
   - Insert stakeholders into `initiative_stakeholders`
   - Create memory doc in `content_sections` (entity_type='initiative', section_type='memory')
   - Add person records for any new stakeholders (`people` table)
3. **Fill in CLAUDE.md** with initiative details, replacing all `{placeholders}`
4. **Initialize memory.md** with first session context
5. **Create `docs/` folder** for working artifacts

## Supabase Memory Doc Template

The memory doc (`content_sections`) should follow this structure:

```markdown
## Status
Current state, owner, escalation path

## Hard Deadlines
Date-driven commitments

## Key Decisions
[date] Decision and rationale — append-only log

## Open Questions
Unresolved items

## Blockers & Risks
Active blockers with owners

## Stakeholders
People and their roles

## Timeline of Key Events
[date] What happened — append-only log

## PPP Signals (week-over-week)
Weekly status from PPP reports
```
