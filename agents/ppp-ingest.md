# PPP Ingest Agent

## Purpose

Local agent for processing the CLM weekly PPP (Progress/Problems/Plans) status deck. Replaces the edge function HTTP workflow with direct Supabase JS client writes — no MCP timeouts, no HTTP middleman.

## Context Library

On startup, scan `context/*.md` frontmatter and load files tagged with `ppp-ingest` or matching your current task's topics.

## Scope

- Load analysis context (previous week data, people map, tags, current_focus)
- Validate and write PPP payloads to `ppp_reports` + `ppp_sections`
- Run week-over-week enrichment (status changes, cross-swimlane patterns, context cross-reference)

## Commands

| Command | Description |
|---------|-------------|
| `context` | Load previous week PPP, people slugs, tag dictionary, default contributors, current_focus |
| `write <json-path> [--replace]` | Validate payload, resolve slugs, write to DB, save backup |
| `enrich [--week=YYYY-MM-DD]` | Week-over-week diff, cross-swimlane patterns, context cross-reference |
| `check-tasks` | Pick up pending `agent_tasks` where `target_agent = 'ppp-ingest'` |

## CLI

```bash
npx tsx ppp/run.ts context
npx tsx ppp/run.ts write output/ppp-2026-02-19.json
npx tsx ppp/run.ts write output/ppp-2026-02-19.json --replace
npx tsx ppp/run.ts enrich
npx tsx ppp/run.ts enrich --week=2026-02-19
npx tsx ppp/run.ts check-tasks
```

## Task Format

Set `target_agent = 'ppp-ingest'` and put a JSON command in `description`:
```json
{"type": "context"}
{"type": "write", "path": "output/ppp-2026-02-19.json", "replace_existing": true}
{"type": "enrich", "week": "2026-02-19"}
```

## Workflow

When processing a PPP deck:

1. **Extract text** from PPTX (python-pptx or manual paste)
2. **Run `context`** — get previous week data, people map, tags, current_focus
3. **Claude Code analyzes** the extracted text using the context
4. **Present review table** — 1 row per swimlane (name, lead, status, score, headline)
5. User approves or corrects
6. **Run `write`** with the finalized JSON payload
7. **Run `enrich`** for week-over-week analysis

## Payload Format

See `output/ppp-2026-02-12.json` for a reference payload. Key fields per section:

- `workstream_name`: String
- `lead_slug`: Person slug or first name (resolved to UUID during write)
- `contributors`: Array of slugs or first names
- `status`: `on-track` | `potential-issues` | `at-risk` | `na`
- `quality_score`: 1-5
- `quality_notes`, `summary`, `raw_text`: Strings
- `tags`: Array from tag dictionary

## Key Design Decisions

- **Direct DB writes** via Supabase JS client — no edge function HTTP call
- **Slug resolution** handles slugs, first names, and full names (case-insensitive)
- **Replace mode** deletes existing report + sections before re-inserting
- **Backup** always saved to `output/ppp-{week_date}.json`
- **Tag dictionary** and **default contributors** extracted from workflow_ppp_ingest v3.4

## Dependencies

- `lib/supabase.ts` — DB client
- `lib/tasks.ts` — task pickup (for `check-tasks`)
- `lib/logging.ts` — error logging to `agent_log`
