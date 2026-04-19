# Initiative Workspaces

You are working inside a scoped initiative workspace. These rules apply to all initiatives under this directory.

## Core Principles

### Local-First
All working artifacts — drafts, research, frameworks, meeting notes, decision logs — are created as local files within your initiative folder. This is your sandbox.

### Supabase is Read-Heavy, Write-Light
- **Read freely**: Initiative memory docs, people, org context, other initiative data — anything in the Second Brain DB that helps your work.
- **Write only when explicitly asked**: Never write to Supabase (initiative memory, content_sections, project_decisions, agent_log) unless the user specifically requests it or confirms it's needed.
- **Ask before DB writes**: If you believe a Supabase update is warranted, explain what you want to write and why, then wait for confirmation.
- **Exception — workspace sync**: Writes to `workspace-context` and `workspace-memory` rows are automatic (see Workspace Sync below).

### Stay In Your Folder
- Create files only within your initiative's directory (e.g., `initiatives/{name}/docs/`, `initiatives/{name}/memory.md`)
- Never create files elsewhere in the Second Brain repo as part of initiative work
- Exception: updating PM agent context files (`pm_team/*/context.md`) or other cross-system files when explicitly asked

### Memory
Each initiative has a local `memory.md` for Claude Code working memory across sessions — what was discussed, user preferences, draft state, open threads. This is separate from the Supabase initiative memory doc (which is the structured, curated source of truth).

### Workspace Sync (Claude Code ↔ Claude AI)

Each initiative's `CLAUDE.md` and `memory.md` are synced to Supabase via `content_sections` rows with `section_type = 'workspace-context'` and `section_type = 'workspace-memory'`. This allows Claude AI Projects to read and update the same content.

**On session start** (when you begin working on an initiative):
1. Read the initiative's `workspace-memory` and `workspace-context` rows from `content_sections` using the initiative's `entity_id` (found in the initiative's `CLAUDE.md` frontmatter under "Initiative ID").
2. Compare `updated_at` from Supabase with the local file's content.
3. If Supabase content is different from local (meaning Claude AI updated it), overwrite the local file with the Supabase content. Inform the user what changed.

```sql
SELECT section_type, content, updated_at FROM content_sections
WHERE entity_id = '{initiative_id}' AND section_type IN ('workspace-context', 'workspace-memory');
```

**On every edit to `memory.md` or `CLAUDE.md`:**
After writing the local file, immediately upsert the corresponding Supabase row:

```sql
UPDATE content_sections
SET content = '{new_content}', date = CURRENT_DATE, updated_at = now()
WHERE entity_id = '{initiative_id}' AND section_type = '{workspace-memory|workspace-context}';
```

**Rules:**
- This sync is automatic — no user confirmation needed (it's the exception to the "ask before DB writes" rule).
- Only sync `memory.md` → `workspace-memory` and `CLAUDE.md` → `workspace-context`. Other files (docs/, meetings/) are not synced.
- The `entity_id` is always in the initiative's `CLAUDE.md` under "Initiative ID". Never hardcode UUIDs.

## Shared Resources

- Brand guidelines: `context/brand-guidelines.md` — Payoneer brand colors, typography, visual language. Use for any document, slide, or visual generation.

## Directory Convention

```
initiatives/
  CLAUDE.md              # Shared rules (this file)
  portfolio.md           # Cross-initiative strategic analysis
  _template/             # Scaffold for new initiatives
  {slug}/
    CLAUDE.md            # Initiative identity, IDs, stakeholders, working files index
    memory.md            # Working memory across Claude Code sessions
    context.md           # Domain reference knowledge (optional, for rich domains)
    agent.md             # PM agent definition (optional, for initiative-embedded agents)
    docs/                # All working artifacts (drafts, research, frameworks)
```

### Initiative-Embedded Agents

An initiative can embed its own PM agent via `agent.md`. This file defines:
- What the agent monitors (PPP workstreams, people, metrics)
- Commands it supports (check-in, investigate, research, synthesize)
- How it maps to the shared PM infrastructure

The agent still uses the shared PM team layers (`pm_team/clm-context.md`, `pm_team/workflows.md`, `pm_team/playbook.md`) but its domain context lives in `context.md` alongside the initiative's docs — not in `pm_team/`.

### Embedding for External Discovery

Local files (`context.md`, `docs/*.md`) are embedded into Supabase with entity type `initiative_context`, chunked by H2 headings. This allows agents from other initiatives or the main system to discover relevant knowledge via `searchByType(query, ['initiative_context'])` without reading local files directly. The local agent never needs these embeddings — it reads files directly.
