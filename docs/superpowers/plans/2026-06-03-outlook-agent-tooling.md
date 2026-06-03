# Outlook Agent Tooling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Claude Code side of the Outlook bridge — helpers and a CLI to queue email/calendar lookups, read results, and promote them into initiative memory with provenance — plus the repo-master agent doc and registry entry.

**Architecture:** A thin `lib/outlook.ts` module wraps the existing `agent_tasks` board: it queues `thread-lookup` tasks for `target_agent = 'outlook-agent'`, reads back completed results, and promotes them into `content_sections` memory docs with mandatory `[via email: …]` provenance markers. A small CLI (`outlook/run.ts`) exposes these, mirroring the existing `pm_team/*/run.ts` command-dispatch pattern. The operating spec already lives in `context_store.outlook_agent_spec`; a `sync-spec` command keeps it in lockstep with the repo-master doc `agents/outlook-agent.md`.

**Tech Stack:** TypeScript, `tsx`, `@supabase/supabase-js` (service-role via `lib/supabase.ts`), existing `lib/tasks.ts` helpers. No test framework exists in this repo — verification is `npm run typecheck` + live CLI runs against Supabase.

**Methodology note (read before starting):** This codebase verifies via `npm run typecheck` and running scripts against the live DB, not unit tests. Each task's verification reflects that. Commit after each task. The Outlook-side skill is already created and frozen; nothing in this plan changes it.

---

### Task 1: `lib/outlook.ts` — request + read-result helpers

**Files:**
- Create: `lib/outlook.ts`

- [ ] **Step 1: Create `lib/outlook.ts` with types, request, and read helpers**

```typescript
/**
 * Outlook Agent helpers (Claude Code side).
 *
 * The `outlook-agent` surface is Claude-for-Outlook. It picks up tasks queued
 * here (agent_tasks, target_agent = 'outlook-agent'), executes them against the
 * mailbox/calendar, and writes results back. This module is the Claude Code
 * side: queue requests, read what came back, and promote results into human
 * tables (with provenance). Pull-only: we never act on email except via a task.
 */

import { createTask } from './tasks.js'

const AGENT_SLUG = 'outlook-agent'

async function getSupabase() {
  const { getSupabase: gs } = await import('./supabase.js')
  return gs()
}

// ─── Types ───────────────────────────────────────────────

export type ExtractField = 'summary' | 'decisions' | 'action_items' | 'deadlines'

export interface ThreadLookupInput {
  query: string
  person?: string
  personSlug?: string
  timeframe?: string
  extract?: ExtractField[]
  initiativeSlug?: string
}

export interface OutlookActionItem {
  who: string
  what: string
  due: string | null
}

export interface OutlookThread {
  subject: string
  participants: string[]
  last_message_date: string
  outlook_thread_id: string
  decisions?: string[]
  action_items?: OutlookActionItem[]
  deadlines?: string[]
  sensitive: boolean
  subject_topic?: string
  note?: string
}

export interface OutlookResultDetails {
  threads: OutlookThread[]
  not_found: boolean
  initiative_slug?: string | null
}

export interface OutlookResult {
  id: string
  title: string
  status: string
  result_summary: string | null
  result_details: OutlookResultDetails | null
  completed_at: string | null
}

// ─── Request ─────────────────────────────────────────────

/** Queue a thread-lookup task for the Outlook agent. Returns the task id. */
export async function requestThreadLookup(input: ThreadLookupInput): Promise<string | null> {
  const payload = {
    type: 'thread-lookup',
    query: input.query,
    ...(input.person ? { person: input.person } : {}),
    ...(input.personSlug ? { person_slug: input.personSlug } : {}),
    ...(input.timeframe ? { timeframe: input.timeframe } : {}),
    extract: input.extract ?? ['summary', 'decisions', 'action_items', 'deadlines'],
    ...(input.initiativeSlug ? { initiative_slug: input.initiativeSlug } : {}),
  }

  const titlePerson = input.person ? ` — ${input.person}` : ''
  return createTask({
    title: `Thread lookup: ${input.query}${titlePerson}`,
    description: JSON.stringify(payload),
    targetAgent: AGENT_SLUG,
    createdBy: 'claude-code',
    tags: ['outlook-agent', 'thread-lookup'],
  })
}

// ─── Read results ────────────────────────────────────────

/** List the most recent completed Outlook results. */
export async function listOutlookResults(limit = 20): Promise<OutlookResult[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, status, result_summary, result_details, completed_at')
    .eq('target_agent', AGENT_SLUG)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[outlook] Failed to read results:', error.message)
    return []
  }
  return (data || []) as unknown as OutlookResult[]
}

/** Fetch a single Outlook task result by id. */
export async function getOutlookResult(taskId: string): Promise<OutlookResult | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, status, result_summary, result_details, completed_at')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('[outlook] Failed to read result:', error.message)
    return null
  }
  return data as unknown as OutlookResult
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors). If `Json` import errors appear, none are used here — ensure no stray imports.

- [ ] **Step 3: Live smoke — create a request and read results**

Run (note: `await import('dotenv/config')` first — bare `tsx -e` does not auto-load `.env`, and `lib/supabase.ts` throws at import without env vars):
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/outlook.js'); const id = await m.requestThreadLookup({ query: 'plan smoke test', person: 'Chen Alcalay', personSlug: 'chen-alcalay', timeframe: 'last 7 days' }); console.log('created', id); const r = await m.listOutlookResults(3); console.log('recent done results:', r.length); })()"
```
Expected: prints `created <uuid>` and a count of recent done results (≥1, since the payer-rollout task is done). The new task sits `pending` for the Outlook agent — that's correct.

- [ ] **Step 4: Clean up the smoke task**

Run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/supabase.js'); const s = m.getSupabase(); const { error } = await s.from('agent_tasks').delete().eq('title','Thread lookup: plan smoke test — Chen Alcalay'); console.log(error ? error.message : 'deleted smoke task'); })()"
```
Expected: `deleted smoke task`

- [ ] **Step 5: Commit**

```bash
git add lib/outlook.ts
git commit -m "feat(outlook): add request + read-result helpers for outlook-agent bridge"
```

---

### Task 2: `lib/outlook.ts` — `promote` (memory append with provenance)

**Files:**
- Modify: `lib/outlook.ts` (append the promote section)

- [ ] **Step 1: Append promote types and helpers to `lib/outlook.ts`**

Add to the end of `lib/outlook.ts`:

```typescript
// ─── Promote into initiative memory (with provenance) ────

export interface MemoryAppend {
  /** Exact heading line in the memory doc, e.g. '## Key Decisions'. */
  section: string
  /** Lines to append under that section (provenance is added automatically). */
  lines: string[]
}

export interface PromoteSource {
  person: string
  subject: string
  date: string // YYYY-MM-DD
  threadId?: string
}

export interface PromoteOptions {
  initiativeSlug: string
  appends: MemoryAppend[]
  source: PromoteSource
  /** When true, returns the would-be content without writing. */
  dryRun?: boolean
}

export interface PromoteResult {
  ok: boolean
  preview?: string
  error?: string
}

/** Provenance marker appended to every promoted line. */
function provenanceMarker(source: PromoteSource): string {
  return ` *[via email: ${source.person}, "${source.subject}", ${source.date}]*`
}

/**
 * Insert `lines` under a markdown `## Section` heading, before the next `## `
 * heading (or at end of doc / end of file if it's the last section). If the
 * section is missing, a new section is appended at the end of the document.
 */
export function appendUnderSection(content: string, section: string, lines: string[]): string {
  const idx = content.indexOf(section)
  if (idx === -1) {
    return `${content.trimEnd()}\n\n${section}\n${lines.join('\n')}\n`
  }
  const afterHeading = idx + section.length
  const rest = content.slice(afterHeading)
  const nextHeadingRel = rest.search(/\n## /)
  if (nextHeadingRel === -1) {
    return `${content.trimEnd()}\n${lines.join('\n')}\n`
  }
  const insertAt = afterHeading + nextHeadingRel
  const before = content.slice(0, insertAt).trimEnd()
  const after = content.slice(insertAt)
  return `${before}\n${lines.join('\n')}\n${after}`
}

/**
 * Promote email-sourced intel into an initiative memory doc. Every appended
 * line carries a [via email: …] provenance marker. Caller composes the exact
 * lines (Claude does this after Yonatan confirms); this enforces provenance and
 * the markdown structure. Use dryRun to preview before writing.
 */
export async function promoteToInitiativeMemory(opts: PromoteOptions): Promise<PromoteResult> {
  const supabase = await getSupabase()

  const { data: init, error: initErr } = await supabase
    .from('initiatives' as any)
    .select('id')
    .eq('slug', opts.initiativeSlug)
    .single()
  if (initErr || !init) {
    return { ok: false, error: `Initiative not found: ${opts.initiativeSlug}` }
  }

  const { data: mem, error: memErr } = await supabase
    .from('content_sections' as any)
    .select('id, content')
    .eq('entity_id', (init as any).id)
    .eq('section_type', 'memory')
    .single()
  if (memErr || !mem) {
    return { ok: false, error: `Memory doc not found for ${opts.initiativeSlug}` }
  }

  const marker = provenanceMarker(opts.source)
  let content = (mem as any).content as string
  for (const a of opts.appends) {
    const marked = a.lines.map(l => `${l}${marker}`)
    content = appendUnderSection(content, a.section, marked)
  }

  if (opts.dryRun) {
    return { ok: true, preview: content }
  }

  const today = new Date().toISOString().slice(0, 10)
  const { error: upErr } = await supabase
    .from('content_sections' as any)
    .update({ content, date: today, updated_at: new Date().toISOString() } as any)
    .eq('id', (mem as any).id)
  if (upErr) {
    return { ok: false, error: upErr.message }
  }
  return { ok: true }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Unit-verify the pure `appendUnderSection` logic (no DB)**

Run:
```bash
npx tsx -e "import('./lib/outlook.js').then(m => { const doc='## Status\nactive\n\n## Key Decisions\n[old] thing\n\n## Open Questions\n- q1\n'; const out=m.appendUnderSection(doc,'## Key Decisions',['[new] decision']); console.log(out); const ok = out.includes('[new] decision') && out.indexOf('[new] decision') < out.indexOf('## Open Questions') && out.indexOf('[old] thing') < out.indexOf('[new] decision'); console.log('PASS:', ok); })"
```
Expected: prints the doc with `[new] decision` inserted after `[old] thing` and before `## Open Questions`, then `PASS: true`.

- [ ] **Step 4: Dry-run-verify provenance + DB resolution against a real memory doc**

Run (loads dotenv first — this snippet hits the DB):
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/outlook.js'); const r = await m.promoteToInitiativeMemory({ initiativeSlug:'clm-full-rollout', appends:[{section:'## Open Questions', lines:['- [2026-06-03] DRYRUN provenance check']}], source:{person:'Chen Alcalay', subject:'Test', date:'2026-06-03'}, dryRun:true }); console.log('ok:', r.ok, 'has marker:', (r.preview||'').includes('*[via email: Chen Alcalay, \"Test\", 2026-06-03]*')); })()"
```
Expected: `ok: true has marker: true`. Nothing is written (dryRun).

- [ ] **Step 5: Commit**

```bash
git add lib/outlook.ts
git commit -m "feat(outlook): add promoteToInitiativeMemory with mandatory email provenance"
```

---

### Task 3: `outlook/run.ts` — CLI

**Files:**
- Create: `outlook/run.ts`

- [ ] **Step 1: Create `outlook/run.ts`**

```typescript
#!/usr/bin/env tsx
/**
 * Outlook Agent — CLI Entry Point (Claude Code side)
 *
 * Usage:
 *   npx tsx outlook/run.ts request --query="payer rollout" [--person="Chen Alcalay"] [--slug=chen-alcalay] [--timeframe="last 60 days"] [--initiative=clm-full-rollout]
 *   npx tsx outlook/run.ts results [--limit=10]
 *   npx tsx outlook/run.ts result <task-id>
 *   npx tsx outlook/run.ts sync-spec
 */

import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = args.find(a => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

function getPositional(index: number): string | undefined {
  const positionals = args.filter(a => !a.startsWith('--'))
  return positionals[index]
}

async function main() {
  if (!command) {
    console.log(`
Outlook Agent — CLI (Claude Code side)

Commands:
  request --query=<q> [--person=<name>] [--slug=<person-slug>]
          [--timeframe=<window>] [--initiative=<slug>]   Queue a thread-lookup
  results [--limit=10]                                    List recent completed results
  result <task-id>                                        Show one result in full
  sync-spec                                               Push agents/outlook-agent.md spec → context_store

Examples:
  npx tsx outlook/run.ts request --query="payer rollout status" --person="Chen Alcalay" --slug=chen-alcalay --timeframe="last 60 days"
  npx tsx outlook/run.ts results --limit=5
  npx tsx outlook/run.ts result 257334f2-8f1f-4023-a947-1d8e603360ad
  npx tsx outlook/run.ts sync-spec
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'request': {
        const query = getFlag('query')
        if (!query) {
          console.error('Error: --query is required.')
          process.exit(1)
        }
        const { requestThreadLookup } = await import('../lib/outlook.js')
        const id = await requestThreadLookup({
          query,
          person: getFlag('person'),
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
          initiativeSlug: getFlag('initiative'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued thread-lookup task ${id} for outlook-agent.`)
        console.log('Run the email agent in Outlook to process it, then: npx tsx outlook/run.ts results')
        break
      }

      case 'results': {
        const limit = getFlag('limit') ? parseInt(getFlag('limit')!, 10) : 10
        const { listOutlookResults } = await import('../lib/outlook.js')
        const rows = await listOutlookResults(limit)
        if (rows.length === 0) {
          console.log('No completed Outlook results yet.')
          break
        }
        for (const r of rows) {
          const threadCount = r.result_details?.threads?.length ?? 0
          console.log(`\n${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}`)
          console.log(`  ${r.title}`)
          console.log(`  ${threadCount} thread(s). ${r.result_summary ?? ''}`)
        }
        break
      }

      case 'result': {
        const id = getPositional(1)
        if (!id) {
          console.error('Error: task-id is required. Usage: result <task-id>')
          process.exit(1)
        }
        const { getOutlookResult } = await import('../lib/outlook.js')
        const r = await getOutlookResult(id)
        if (!r) {
          console.error('Result not found.')
          process.exit(1)
        }
        console.log(JSON.stringify(r, null, 2))
        break
      }

      case 'sync-spec': {
        const { syncSpec } = await import('./sync-spec.js')
        const version = await syncSpec()
        console.log(`Synced outlook_agent_spec → context_store. version: ${version}`)
        break
      }

      default:
        console.error(`Unknown command: ${command}`)
        console.error('Run without arguments to see usage.')
        process.exit(1)
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: FAIL — `Cannot find module './sync-spec.js'`. That module is created in Task 5; this is expected until then. Proceed.

- [ ] **Step 3: Run the CLI help + results (sync-spec untested until Task 5)**

Run: `npx tsx outlook/run.ts results --limit=3`
Expected: prints the payer-rollout result line (1+ thread(s), with summary). Confirms `request`/`results`/`result` wiring works end-to-end against the DB.

- [ ] **Step 4: Commit**

```bash
git add outlook/run.ts
git commit -m "feat(outlook): add CLI (request, results, result, sync-spec)"
```

---

### Task 4: `package.json` — add `outlook:run` script

**Files:**
- Modify: `package.json` (scripts block)

- [ ] **Step 1: Add the script**

In `package.json`, in `"scripts"`, after the `"ab-testing:run"` line, add:

```json
    "ab-testing:run": "tsx ab-testing/run.ts",
    "outlook:run": "tsx outlook/run.ts"
```

(Add a comma after the `ab-testing:run` value; `outlook:run` is the last entry.)

- [ ] **Step 2: Verify the script resolves**

Run: `npm run outlook:run`
Expected: prints the CLI usage block (no command → usage).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(outlook): add npm run outlook:run script"
```

---

### Task 5: `agents/outlook-agent.md` + `outlook/sync-spec.ts`

**Files:**
- Create: `agents/outlook-agent.md`
- Create: `outlook/sync-spec.ts`

- [ ] **Step 1: Create `agents/outlook-agent.md` (repo master)**

The file must contain a single fenced ```json block tagged with the marker
`<!-- spec:outlook_agent_spec -->` immediately before it — `sync-spec.ts` reads
exactly that block. Use the current live spec (version `1.0-thread-lookup`) as
the JSON body. Structure:

```markdown
# Outlook Agent

The `outlook-agent` is Claude-for-Outlook — a third Second Brain surface on the
shared Supabase backbone (alongside Claude.ai Chat and Claude Code). It reads
Yonatan's Outlook mailbox/calendar and processes lookup tasks queued on the
`agent_tasks` board. Pull-only, agent-tables-only writes, strict privacy
allowlist. See `docs/superpowers/specs/2026-06-03-outlook-agent-bridge-design.md`.

## How it works (thin skill, smart spec)

Claude-for-Outlook runs a tiny, frozen skill that does two things: load its spec
from `context_store.outlook_agent_spec`, then obey it. ALL behavior lives in the
spec below. To change behavior, edit the JSON block here and run
`npm run outlook:run sync-spec` — the Outlook skill is never edited.

## Outlook-side skill (created once in Outlook, then frozen)

(paste the exact skill markdown that is installed in Claude-for-Outlook — the
~10-line bootstrap loader that reads context_store.outlook_agent_spec and obeys)

## Operating spec (source of truth → synced to context_store.outlook_agent_spec)

<!-- spec:outlook_agent_spec -->
```json
{ ...the full current outlook_agent_spec JSON (version 1.0-thread-lookup)... }
```

## Claude Code side

Use `lib/outlook.ts` / `npm run outlook:run`:
- `request` — queue a thread-lookup
- `results` / `result <id>` — read what came back
- promote results into initiative memory via `promoteToInitiativeMemory()` (with
  confirmation + `[via email: …]` provenance) — never auto-promote sensitive threads
```

To get the exact current spec JSON to paste into the block, run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/supabase.js'); const s=m.getSupabase(); const { data } = await s.from('context_store').select('content').eq('key','outlook_agent_spec').single(); console.log(JSON.stringify(data.content, null, 2)); })()"
```

- [ ] **Step 2: Create `outlook/sync-spec.ts`**

```typescript
/**
 * Sync the operating spec from agents/outlook-agent.md → context_store.
 *
 * The repo-master doc holds the authoritative spec inside a fenced json block
 * preceded by the marker `<!-- spec:outlook_agent_spec -->`. This reads that
 * block, validates it as JSON, and upserts it into context_store under key
 * 'outlook_agent_spec'. Returns the spec version string.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOC_PATH = resolve(__dirname, '../agents/outlook-agent.md')
const MARKER = '<!-- spec:outlook_agent_spec -->'

export function extractSpecJson(doc: string): unknown {
  const markerIdx = doc.indexOf(MARKER)
  if (markerIdx === -1) {
    throw new Error(`Marker not found in agents/outlook-agent.md: ${MARKER}`)
  }
  const after = doc.slice(markerIdx)
  const fenceStart = after.indexOf('```json')
  if (fenceStart === -1) {
    throw new Error('No ```json block after spec marker.')
  }
  const bodyStart = fenceStart + '```json'.length
  const fenceEnd = after.indexOf('```', bodyStart)
  if (fenceEnd === -1) {
    throw new Error('Unterminated ```json block after spec marker.')
  }
  const jsonText = after.slice(bodyStart, fenceEnd).trim()
  return JSON.parse(jsonText)
}

export async function syncSpec(): Promise<string> {
  const doc = readFileSync(DOC_PATH, 'utf8')
  const spec = extractSpecJson(doc) as Record<string, unknown>
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()
  const { error } = await supabase
    .from('context_store' as any)
    .upsert({ key: 'outlook_agent_spec', content: spec as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
  if (error) {
    throw new Error(`Failed to upsert spec: ${error.message}`)
  }
  return String((spec as any).version ?? 'unknown')
}
```

- [ ] **Step 3: Typecheck (now resolves the Task 3 import too)**

Run: `npm run typecheck`
Expected: PASS (the `./sync-spec.js` import from Task 3 now resolves).

- [ ] **Step 4: Verify sync round-trips without changing the live spec**

Run: `npm run outlook:run sync-spec`
Expected: `Synced outlook_agent_spec → context_store. version: 1.0-thread-lookup`

Then confirm the DB still parses and matches:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/supabase.js'); const s=m.getSupabase(); const { data } = await s.from('context_store').select('content').eq('key','outlook_agent_spec').single(); console.log('version:', data.content.version, 'mode:', data.content.mode); })()"
```
Expected: `version: 1.0-thread-lookup mode: production` (unchanged — the .md block must equal the live spec).

- [ ] **Step 5: Commit**

```bash
git add agents/outlook-agent.md outlook/sync-spec.ts
git commit -m "feat(outlook): add repo-master agent doc + sync-spec (md → context_store)"
```

---

### Task 6: Register the agent + document it in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (PM Team & Infrastructure Agents table)
- DB write via Supabase MCP (no file)

- [ ] **Step 1: Insert the `agent_registry` row**

Run this SQL via the Supabase MCP `execute_sql` (service role):

```sql
INSERT INTO agent_registry (slug, name, description, agent_type, status, config)
VALUES (
  'outlook-agent',
  'Outlook Agent',
  'Claude-for-Outlook bridge. Processes pull-only email/calendar lookup tasks from agent_tasks, extracts under a privacy allowlist, writes results back. Spec in context_store.outlook_agent_spec.',
  'external-surface',
  'active',
  '{"surface":"claude-for-outlook","writes":"agent_tasks-only","mode":"pull-only"}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
  SET description = EXCLUDED.description, status = EXCLUDED.status,
      config = EXCLUDED.config, updated_at = now()
RETURNING slug, name, status;
```
Expected: one row, `outlook-agent | Outlook Agent | active`.

- [ ] **Step 2: Add the CLAUDE.md table row**

In `CLAUDE.md`, in the **PM Team & Infrastructure Agents** table, after the `AB Testing` row, add:

```markdown
| Outlook Agent | `outlook-agent` | `outlook/` + `agents/outlook-agent.md` | Claude-for-Outlook bridge — pull-only email/calendar lookups via agent_tasks, results promoted to initiative memory with provenance |
```

- [ ] **Step 3: Verify**

Run: `git diff --stat CLAUDE.md`
Expected: shows `CLAUDE.md` modified (1 insertion).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(outlook): register outlook-agent in registry + CLAUDE.md"
```

---

## Self-Review

**Spec coverage** (against `2026-06-03-outlook-agent-bridge-design.md` build scope):
- Build scope #1 (`agents/outlook-agent.md` + sync rule) → Task 5 ✅
- Build scope #2 (`lib/outlook.ts` + CLI: request/results/promote) → Tasks 1, 2, 3 ✅
- Build scope #3 (`agent_registry` row) → Task 6 ✅
- Build scope #4 (CLAUDE.md entry) → Task 6 ✅
- Provenance convention (`[via email: …]`) → Task 2 (`provenanceMarker`) ✅
- Promote confirmation gate → enforced by Claude orchestration; `dryRun` preview supports it (Task 2) ✅
- Pull-only / agent-tables-only → request helper only ever writes `agent_tasks`; promote is Claude-side ✅
- Sensitive threads never auto-promoted → documented in `agents/outlook-agent.md` (Task 5); promote takes caller-composed lines so Claude excludes sensitive content ✅
- Later items (person-digest, calendar, Loop 2) → intentionally out of scope, spec-only ✅

**Placeholder scan:** The only intentional "fill from live data" is the spec JSON block in Task 5 Step 1 — Step 1 provides the exact command to fetch it. No TBD/TODO logic steps.

**Type consistency:** `requestThreadLookup`, `listOutlookResults`, `getOutlookResult`, `promoteToInitiativeMemory`, `appendUnderSection`, `syncSpec`, `extractSpecJson` — names used identically across Tasks 1–5. `OutlookResult.result_details` typed as `OutlookResultDetails | null`, consumed safely with `?.` in the CLI (Task 3).

**Known ordering note:** Task 3 typecheck fails until Task 5 creates `outlook/sync-spec.ts` (called out in Task 3 Step 2). If implementing strictly task-by-task with a green typecheck gate each step, swap the order to do Task 5 before Task 3.
