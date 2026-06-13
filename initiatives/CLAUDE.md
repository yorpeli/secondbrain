# Initiative Workspaces

You are working inside a scoped initiative workspace. These rules apply to all initiatives under this directory.

## Core Principles

### Local-First
All working artifacts — drafts, research, frameworks, meeting notes, decision logs — are created as local files within your initiative folder. This is your sandbox.

### Supabase is Read-Heavy, Write-Light
- **Read freely**: Initiative memory docs, people, org context, other initiative data — anything in the Second Brain DB that helps your work.
- **Write only when explicitly asked**: Never write to Supabase (initiative memory, content_sections, project_decisions, agent_log) unless the user specifically requests it or confirms it's needed.
- **Ask before DB writes**: If you believe a Supabase update is warranted, explain what you want to write and why, then wait for confirmation.
- **Exception — the canonical memory doc**: The initiative's DB memory doc (`content_sections`, `section_type = 'memory'`) is the canonical knowledge home and is meant to be written as knowledge accrues — update it (and re-embed) without round-tripping for confirmation on routine knowledge capture. See "Knowledge is Supabase-canonical" below.

### Stay In Your Folder
- Create files only within your initiative's directory (e.g., `initiatives/{name}/docs/`, `initiatives/{name}/memory.md`)
- Never create files elsewhere in the Second Brain repo as part of initiative work
- Exception: updating PM agent context files (`pm_team/*/context.md`) or other cross-system files when explicitly asked

### Knowledge is Supabase-canonical (Decision 2026-06-13)

The curated initiative **memory doc lives in Supabase** — `content_sections`, `section_type = 'memory'`, embedded as `initiative_memory`. It is the single source of truth for an initiative's knowledge, writable from both Claude Code and Claude AI, and the only copy that's canonical. See `docs/superpowers/specs/2026-06-13-initiative-knowledge-db-canonical.md`.

**No bidirectional file sync.** The old `memory.md ↔ workspace-memory` / `CLAUDE.md ↔ workspace-context` two-way sync is **retired** — it drifted, and one Claude AI edit silently truncated an append-only decision log. Do **not** write knowledge back through the local files.

- **`memory.md`** (where a folder keeps one) is a **pull-only** convenience mirror — refresh it *from* the DB doc to read locally; never treat it as the canonical copy and never push it back. When knowledge changes, **update the DB memory doc** (and re-run `npm run embed:initiative-memory -- --force` so it stays queryable).
- **`CLAUDE.md`** is a **thin local index** (identity, IDs, stakeholders pointer, working-files list). Local-only, not synced, not knowledge.
- **`docs/`** holds working artifacts (drafts, research, meeting notes) — canonical *locally*, not embedded. When a doc produces durable knowledge, distill it into the DB memory doc (the bridge principle); the raw doc stays local as provenance.

Reading the canonical knowledge:

```sql
SELECT content FROM content_sections
WHERE entity_id = '{initiative_id}' AND section_type = 'memory';
```

The `entity_id` is in the initiative's `CLAUDE.md` under "Initiative ID". Never hardcode UUIDs.

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
