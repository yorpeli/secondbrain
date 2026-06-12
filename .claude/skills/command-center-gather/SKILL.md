---
name: command-center-gather
description: Use when Yonatan says "gather context", "morning brief", "set up
  the command center", "start the day", or asks to assemble today's focus into
  the command-center workspace. Runs the Supabase→focus→dashboard morning arc.
---

# Command Center — Gather Context (Skill A)

The morning arc of the daily loop. This session is the Supabase gateway; the
MSFT Claude Code session reads the files this produces. See
`docs/superpowers/specs/2026-06-05-command-center-daily-loop-design.md`.

## On trigger

1. Ensure the workspace exists (first run only): `npm run command-center:scaffold`
2. Assemble today's focus + render the dashboard: `npm run command-center:gather`
   - Optional explicit date: `npm run command-center:gather -- --date=YYYY-MM-DD`
3. Open it for Yonatan: `open command-center/daily/$(date +%F)/dashboard.html`
4. Skim `01-focus.md`. If curation helps (tighten the current-focus prose, flag
   the day's top 1–3 things), edit the file directly, then re-render with
   `npm run command-center:dashboard -- --date=$(date +%F)`.

## Notes
- `command-center/` is gitignored — never commit it; raw comms stay local.
- This skill only reads Supabase and writes local files. Writing the day's
  outcomes back to Supabase is Skill C ("close the day"), a separate step.
