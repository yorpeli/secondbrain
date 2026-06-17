# App Scout — Build Opportunities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A weekly Claude-in-the-loop "app scout" that inventories the system, classifies app build-candidates, writes them to a `build_opportunities` table, and surfaces them on a new `/workshop` page in the app with read + write-back.

**Architecture:** A thin CLI (`app-scout/`) with two commands — `gather` (deterministic evidence pack: npm scripts, DB surface, app pages/hooks, existing candidates) and `apply` (idempotent upsert of a Claude-authored payload, keyed on `(source_type, source_ref)`, with auto-ship of closed gaps). A new DB table + view + status-change RPC back a Tanstack Query hook and a kanban-style page, mirroring the existing `/triage` (`comms_predictions` → `use-triage` → `comms_apply_feedback`) pattern.

**Tech Stack:** Node + `tsx` CLIs, `@supabase/supabase-js` (service-role in CLI via `lib/supabase.ts`; anon in app via `app/src/lib/supabase.ts`), Supabase Postgres (migrations via the Supabase MCP `apply_migration`), Vite + React + TypeScript + Tanstack Query + Tailwind/shadcn + React Router v7.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-06-17-app-scout-build-opportunities-design.md` — the source of truth for behavior.
- **No hardcoded UUIDs/keys.** CLI DB access goes through `getSupabase()` in `lib/supabase.ts` (service-role, lazy-imported with `dotenv/config`). App DB access goes through `supabase` in `app/src/lib/supabase.ts` (anon key).
- **`build_opportunities` is operational and NEVER embedded** (like `comms_predictions`).
- **Idempotency key is `(source_type, source_ref)`.** Re-running `apply` upserts; decided rows (`accepted`/`building`/`shipped`/`dismissed`) are never overwritten by a sweep.
- **Status enum:** `active` | `accepted` | `building` | `shipped` | `dismissed`. **source_type enum:** `cli-workflow` | `dormant-data` | `app-enhancement` | `manual-habit`. **effort enum:** `S` | `M` | `L`. **Scores** `app_fit_score`/`value_score` are integers 1–5.
- **Priority (derived, in the view):** `app_fit_score * value_score - effort_penalty`, where `effort_penalty` is `S→0, M→2, L→4`.
- **CLI dispatch pattern:** subcommand in `process.argv[2]`, flags as `--name=value` parsed by a helper, guarded by `process.argv[1] === fileURLToPath(import.meta.url)` so the module is import-safe (see `scripts/command-center/capture.ts`).
- **App conventions** (`dev_team/app-context.md`, `dev_team/workflows.md`): one hook file per domain, named exports, query keys `[domain, ...params]`, components one-per-file with local props interface, Tailwind utilities only, dark/light parity via shadcn CSS vars, no inline Supabase queries in components.
- **No new test-runner dependency.** Pure-logic tests are standalone `node:assert` scripts run with `npx tsx <file>` (the repo has no jest/vitest). Frontend verification is `npm run typecheck` + `npm run build` inside `app/`.

---

### Task 1: DB schema — table, introspection RPC, view, status RPC

**Files:**
- Apply via Supabase MCP `apply_migration` (DDL). Migration name: `build_opportunities_init`.
- Record the SQL verbatim in: Create `app-scout/sql/build_opportunities_init.sql` (checked-in copy of the applied migration, for provenance — the repo applies DDL via MCP but keeps SQL readable).

**Interfaces:**
- Produces (DB objects later tasks rely on):
  - Table `public.build_opportunities` (columns per Global Constraints + spec data model).
  - View `public.v_build_opportunities` — all table columns + computed integer `priority`, ordered by status-lane rank then `priority` desc.
  - RPC `public.app_scout_db_surface()` → `setof record (name text, kind text)` where `kind ∈ {'table','view'}` for the `public` schema. Called by `gather` (Task 3).
  - RPC `public.build_opportunity_set_status(p_id uuid, p_status text)` → `void`. Called by the app hook (Task 5).

- [ ] **Step 1: Write the migration SQL file**

Create `app-scout/sql/build_opportunities_init.sql`:

```sql
-- build_opportunities: operational backlog of app build-candidates surfaced by the
-- weekly app-scout review. NEVER embedded. One row per candidate, keyed for
-- idempotent week-over-week upsert on (source_type, source_ref).
create table if not exists public.build_opportunities (
  id                 uuid primary key default gen_random_uuid(),
  source_type        text not null check (source_type in ('cli-workflow','dormant-data','app-enhancement','manual-habit')),
  source_ref         text not null,
  title              text not null,
  summary            text,
  app_part           text,
  cli_part           text,
  app_fit_score      int  not null check (app_fit_score between 1 and 5),
  value_score        int  not null check (value_score   between 1 and 5),
  effort             text not null check (effort in ('S','M','L')),
  proposed_viz       text,
  data_layer         text,
  status             text not null default 'active'
                       check (status in ('active','accepted','building','shipped','dismissed')),
  rationale          text,
  first_seen_week    date,
  last_reviewed_week date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (source_type, source_ref)
);

-- Local single-user app reads/writes with the anon key (same model as comms_predictions).
alter table public.build_opportunities enable row level security;
drop policy if exists build_opportunities_all on public.build_opportunities;
create policy build_opportunities_all on public.build_opportunities
  for all to anon, authenticated using (true) with check (true);

-- Ranked view. priority = app_fit * value - effort_penalty(S=0,M=2,L=4).
-- Lane rank orders the kanban columns: active first, dismissed/shipped last.
create or replace view public.v_build_opportunities as
select
  bo.*,
  (bo.app_fit_score * bo.value_score
     - case bo.effort when 'S' then 0 when 'M' then 2 when 'L' then 4 else 0 end) as priority,
  case bo.status
    when 'active' then 0 when 'accepted' then 1 when 'building' then 2
    when 'shipped' then 3 when 'dismissed' then 4 else 9 end as lane_rank
from public.build_opportunities bo;

-- Introspection for the gather step: every base table + view in public.
create or replace function public.app_scout_db_surface()
returns table (name text, kind text)
language sql
security definer
set search_path = public
as $$
  select table_name::text as name, 'table'::text as kind
    from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
  union all
  select table_name::text as name, 'view'::text as kind
    from information_schema.views
   where table_schema = 'public';
$$;

-- Write-back: status changes from the /workshop page (mirrors comms_apply_feedback).
create or replace function public.build_opportunity_set_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active','accepted','building','shipped','dismissed') then
    raise exception 'invalid status: %', p_status;
  end if;
  update public.build_opportunities
     set status = p_status, updated_at = now()
   where id = p_id;
end;
$$;

grant select on public.v_build_opportunities to anon, authenticated;
grant execute on function public.app_scout_db_surface()                 to anon, authenticated;
grant execute on function public.build_opportunity_set_status(uuid,text) to anon, authenticated;
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP tool `apply_migration` with:
- `name`: `build_opportunities_init`
- `query`: the full SQL from Step 1.

(Project ref `tjlcdwsckbbkedyzrzda`. If two Supabase MCP servers are listed, use the one bound to this project — `Supabase_SeondBrain` or the default `Supabase`.)

- [ ] **Step 3: Verify the schema exists**

Run via Supabase MCP `execute_sql`:

```sql
select count(*) as cols from information_schema.columns where table_name = 'build_opportunities';
select * from public.v_build_opportunities limit 1;
select * from public.app_scout_db_surface() limit 3;
```

Expected: `cols` = 17; the view query returns 0 rows (empty table) without error; `app_scout_db_surface()` returns rows including `build_opportunities`.

- [ ] **Step 4: Commit the SQL provenance file**

```bash
git add app-scout/sql/build_opportunities_init.sql
git commit -m "feat(app-scout): build_opportunities table, ranked view, introspection + status RPCs"
```

---

### Task 2: Scoring helper + store (pure logic + DB write)

**Files:**
- Create: `app-scout/score.ts`
- Create: `app-scout/store.ts`
- Test: `app-scout/score.test.ts`

**Interfaces:**
- Produces:
  - `app-scout/score.ts`: `export function priority(o: { app_fit_score: number; value_score: number; effort: Effort }): number` and `export type Effort = 'S' | 'M' | 'L'`.
  - `app-scout/store.ts`:
    - `export type SourceType = 'cli-workflow' | 'dormant-data' | 'app-enhancement' | 'manual-habit'`
    - `export type Status = 'active' | 'accepted' | 'building' | 'shipped' | 'dismissed'`
    - `export interface OpportunityInput { source_type: SourceType; source_ref: string; title: string; summary?: string; app_part?: string; cli_part?: string | null; app_fit_score: number; value_score: number; effort: Effort; proposed_viz?: string; data_layer?: string; rationale?: string }`
    - `export async function applyOpportunities(items: OpportunityInput[], week: string, gatheredRefs: Set<string>): Promise<{ added: number; updated: number; skippedDecided: number; autoShipped: number }>`
  - The decided statuses are `accepted | building | shipped | dismissed`. The key for a row is `` `${source_type}::${source_ref}` ``.

- [ ] **Step 1: Write the failing test for `priority`**

Create `app-scout/score.test.ts`:

```ts
import assert from 'node:assert/strict'
import { priority } from './score.ts'

// app_fit * value - effort_penalty(S=0, M=2, L=4)
assert.equal(priority({ app_fit_score: 5, value_score: 5, effort: 'S' }), 25)
assert.equal(priority({ app_fit_score: 5, value_score: 5, effort: 'M' }), 23)
assert.equal(priority({ app_fit_score: 5, value_score: 5, effort: 'L' }), 21)
assert.equal(priority({ app_fit_score: 3, value_score: 2, effort: 'S' }), 6)
assert.equal(priority({ app_fit_score: 1, value_score: 1, effort: 'L' }), -3)
console.log('score.test.ts OK')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx app-scout/score.test.ts`
Expected: FAIL — `Cannot find module './score.ts'` (file not created yet).

- [ ] **Step 3: Implement `score.ts`**

Create `app-scout/score.ts`:

```ts
// Pure ranking math for build-opportunity candidates. Mirrors v_build_opportunities.priority
// so the CLI and the DB view agree. No IO.
export type Effort = 'S' | 'M' | 'L'

const EFFORT_PENALTY: Record<Effort, number> = { S: 0, M: 2, L: 4 }

export function priority(o: { app_fit_score: number; value_score: number; effort: Effort }): number {
  return o.app_fit_score * o.value_score - EFFORT_PENALTY[o.effort]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx app-scout/score.test.ts`
Expected: PASS — prints `score.test.ts OK`.

- [ ] **Step 5: Implement `store.ts`**

Create `app-scout/store.ts`:

```ts
// DB layer for app-scout. build_opportunities is operational — NEVER embedded.
// Lazy Supabase import (service-role) mirrors comms-assistant/store.ts.
import type { Effort } from './score.ts'

export type SourceType = 'cli-workflow' | 'dormant-data' | 'app-enhancement' | 'manual-habit'
export type Status = 'active' | 'accepted' | 'building' | 'shipped' | 'dismissed'

const DECIDED: Status[] = ['accepted', 'building', 'shipped', 'dismissed']

export interface OpportunityInput {
  source_type: SourceType
  source_ref: string
  title: string
  summary?: string
  app_part?: string
  cli_part?: string | null
  app_fit_score: number
  value_score: number
  effort: Effort
  proposed_viz?: string
  data_layer?: string
  rationale?: string
}

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

export const keyOf = (s: { source_type: string; source_ref: string }) => `${s.source_type}::${s.source_ref}`

interface ExistingRow { id: string; source_type: string; source_ref: string; status: Status }

/**
 * Idempotent upsert of a sweep's candidates, keyed on (source_type, source_ref):
 *  - new key                         → insert as 'active' (first_seen_week = last_reviewed_week = week)
 *  - existing key, status 'active'   → refresh fields, bump last_reviewed_week
 *  - existing key, decided status    → skip (never re-nag a decided item)
 *  - existing 'active' NOT in this run's gather output (gap closed) → auto-mark 'shipped'
 * `gatheredRefs` is the set of keyOf() values the gather step still emits this run.
 */
export async function applyOpportunities(
  items: OpportunityInput[],
  week: string,
  gatheredRefs: Set<string>,
): Promise<{ added: number; updated: number; skippedDecided: number; autoShipped: number }> {
  const sb = await db()
  const { data: existingData, error: exErr } = await (sb as any)
    .from('build_opportunities')
    .select('id, source_type, source_ref, status')
  if (exErr) throw exErr
  const existing = new Map<string, ExistingRow>()
  for (const r of (existingData ?? []) as ExistingRow[]) existing.set(keyOf(r), r)

  let added = 0, updated = 0, skippedDecided = 0, autoShipped = 0

  for (const item of items) {
    const k = keyOf(item)
    const prior = existing.get(k)
    if (prior && DECIDED.includes(prior.status)) { skippedDecided++; continue }
    if (prior) {
      const { error } = await (sb as any).from('build_opportunities').update({
        title: item.title, summary: item.summary ?? null, app_part: item.app_part ?? null,
        cli_part: item.cli_part ?? null, app_fit_score: item.app_fit_score, value_score: item.value_score,
        effort: item.effort, proposed_viz: item.proposed_viz ?? null, data_layer: item.data_layer ?? null,
        rationale: item.rationale ?? null, last_reviewed_week: week, updated_at: new Date().toISOString(),
      }).eq('id', prior.id)
      if (error) throw error
      updated++
    } else {
      const { error } = await (sb as any).from('build_opportunities').insert({
        source_type: item.source_type, source_ref: item.source_ref, title: item.title,
        summary: item.summary ?? null, app_part: item.app_part ?? null, cli_part: item.cli_part ?? null,
        app_fit_score: item.app_fit_score, value_score: item.value_score, effort: item.effort,
        proposed_viz: item.proposed_viz ?? null, data_layer: item.data_layer ?? null,
        rationale: item.rationale ?? null, status: 'active', first_seen_week: week, last_reviewed_week: week,
      })
      if (error) throw error
      added++
    }
  }

  // Self-heal: active candidates the gather no longer surfaces → the gap closed; mark shipped.
  for (const [k, row] of existing) {
    if (row.status !== 'active') continue
    if (gatheredRefs.has(k)) continue
    const { error } = await (sb as any).from('build_opportunities').update({
      status: 'shipped',
      rationale: 'Auto-shipped: no longer surfaced by gather (the underlying gap appears closed).',
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    if (error) throw error
    autoShipped++
  }

  return { added, updated, skippedDecided, autoShipped }
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 7: Commit**

```bash
git add app-scout/score.ts app-scout/score.test.ts app-scout/store.ts
git commit -m "feat(app-scout): pure priority scoring + idempotent build_opportunities store"
```

---

### Task 3: `gather` — deterministic evidence pack

**Files:**
- Create: `app-scout/gather.ts`
- Test: `app-scout/gather.test.ts`

**Interfaces:**
- Consumes: `app_scout_db_surface()` RPC (Task 1); `lib/supabase.ts` `getSupabase()`.
- Produces:
  - `export interface EvidencePack { week: string; cli_workflows: { script: string; cmd: string }[]; dormant_data: { name: string; kind: string }[]; app: { pages: string[]; hooks: string[]; tables_read: string[] }; existing: { source_type: string; source_ref: string; status: string; title: string }[] }`
  - `export async function gather(now: Date, repoRoot: string): Promise<EvidencePack>`
  - `export function tablesReadByHooks(hookSources: string[]): string[]` (pure — extracts `.from('x')` names; exported for the test).
  - `export function isoWeekDate(now: Date): string` (pure — returns the date of the run, `YYYY-MM-DD`; exported for the test).

- [ ] **Step 1: Write the failing test for the pure helpers**

Create `app-scout/gather.test.ts`:

```ts
import assert from 'node:assert/strict'
import { tablesReadByHooks, isoWeekDate } from './gather.ts'

const hookSrc = [
  `const { data } = await supabase.from('comms_predictions' as never).select('id')`,
  `supabase.from("v_initiative_dashboard").select('*')`,
  `await supabase.rpc('comms_apply_feedback', {})`, // rpc, not a table read
]
const tables = tablesReadByHooks(hookSrc)
assert.deepEqual([...tables].sort(), ['comms_predictions', 'v_initiative_dashboard'])

assert.equal(isoWeekDate(new Date('2026-06-17T09:00:00Z')), '2026-06-17')
console.log('gather.test.ts OK')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx app-scout/gather.test.ts`
Expected: FAIL — `Cannot find module './gather.ts'`.

- [ ] **Step 3: Implement `gather.ts`**

Create `app-scout/gather.ts`:

```ts
// Deterministic evidence pack for the weekly app-scout review. No judgment — just facts:
// CLI workflows (package.json scripts), DB surface (tables/views) not yet read by the app,
// the app's current pages/hooks, and the existing build_opportunities rows.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export interface EvidencePack {
  week: string
  cli_workflows: { script: string; cmd: string }[]
  dormant_data: { name: string; kind: string }[]
  app: { pages: string[]; hooks: string[]; tables_read: string[] }
  existing: { source_type: string; source_ref: string; status: string; title: string }[]
}

export function isoWeekDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}

// Pull every table/view name referenced via .from('name') across the app's hook sources.
// Ignores .rpc(...) calls (those aren't table reads).
export function tablesReadByHooks(hookSources: string[]): string[] {
  const found = new Set<string>()
  const re = /\.from\(\s*['"]([a-zA-Z0-9_]+)['"]/g
  for (const src of hookSources) {
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) !== null) found.add(m[1])
  }
  return [...found]
}

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

function listFiles(dir: string): string[] {
  try { return readdirSync(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx')) } catch { return [] }
}

export async function gather(now: Date, repoRoot: string): Promise<EvidencePack> {
  const week = isoWeekDate(now)

  // 1. CLI workflows from package.json scripts.
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
  const cli_workflows = Object.entries(pkg.scripts as Record<string, string>)
    .map(([script, cmd]) => ({ script, cmd }))

  // 2. App pages + hooks + the tables they already read.
  const hooksDir = join(repoRoot, 'app/src/hooks')
  const pagesDir = join(repoRoot, 'app/src/pages')
  const hooks = listFiles(hooksDir)
  const pages = listFiles(pagesDir)
  const hookSources = hooks.map((f) => readFileSync(join(hooksDir, f), 'utf8'))
  const tables_read = tablesReadByHooks(hookSources)

  // 3. DB surface − what the app already reads = dormant data.
  const sb = await db()
  const { data: surface, error } = await (sb as any).rpc('app_scout_db_surface')
  if (error) throw error
  const readSet = new Set(tables_read)
  const dormant_data = ((surface ?? []) as { name: string; kind: string }[])
    .filter((r) => !readSet.has(r.name) && r.name !== 'build_opportunities')
    .sort((a, b) => a.name.localeCompare(b.name))

  // 4. Existing candidates so reasoning runs against prior decisions.
  const { data: existing, error: exErr } = await (sb as any)
    .from('build_opportunities').select('source_type, source_ref, status, title')
  if (exErr) throw exErr

  return { week, cli_workflows, dormant_data, app: { pages, hooks, tables_read }, existing: existing ?? [] }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx app-scout/gather.test.ts`
Expected: PASS — prints `gather.test.ts OK`.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app-scout/gather.ts app-scout/gather.test.ts
git commit -m "feat(app-scout): gather — deterministic evidence pack (scripts, dormant DB, app surface)"
```

---

### Task 4: CLI dispatch (`run.ts`) + npm script

**Files:**
- Create: `app-scout/run.ts`
- Modify: `package.json:33` (add `"app-scout"` to the `scripts` block, after the `comms-learning` line)

**Interfaces:**
- Consumes: `gather()` (Task 3), `applyOpportunities()` + `keyOf()` (Task 2).
- Produces: CLI `npm run app-scout -- <gather|apply> [--payload=<path>] [--week=YYYY-MM-DD]`.
  - `gather` prints the `EvidencePack` as pretty JSON to stdout.
  - `apply --payload=<file>` reads a JSON `OpportunityInput[]`, recomputes the current gathered key-set (so auto-ship works), upserts, and prints the summary line.

- [ ] **Step 1: Implement `run.ts`**

Create `app-scout/run.ts`:

```ts
// CLI for the weekly app-scout review. Deterministic facts + idempotent write; the JUDGMENT
// (classifying candidates) happens in the Claude session that runs this — see agents/app-scout.md.
//   gather                               print the evidence pack (JSON) for reasoning over
//   apply --payload=<OpportunityInput[]> upsert candidates (idempotent on source_type+source_ref)
//          [--week=YYYY-MM-DD]           override the run week (defaults to today)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { gather, isoWeekDate, type EvidencePack } from './gather.ts'
import { applyOpportunities, keyOf, type OpportunityInput } from './store.ts'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

async function runGather(): Promise<void> {
  const pack = await gather(new Date(), REPO_ROOT)
  console.log(JSON.stringify(pack, null, 2))
}

async function runApply(): Promise<void> {
  const payloadPath = arg('payload')
  if (!payloadPath) { console.error('usage: app-scout apply --payload=<json path> [--week=YYYY-MM-DD]'); process.exit(1) }
  const items = JSON.parse(readFileSync(payloadPath, 'utf8')) as OpportunityInput[]
  if (!Array.isArray(items) || items.length === 0) { console.error('payload must be a non-empty OpportunityInput[]'); process.exit(1) }
  const week = arg('week') ?? isoWeekDate(new Date())

  // Recompute what gather still surfaces this run, so auto-ship can close gaps.
  const pack: EvidencePack = await gather(new Date(), REPO_ROOT)
  const gatheredRefs = new Set<string>([
    ...pack.cli_workflows.map((w) => keyOf({ source_type: 'cli-workflow', source_ref: w.script })),
    ...pack.dormant_data.map((d) => keyOf({ source_type: 'dormant-data', source_ref: d.name })),
  ])
  // App-enhancement and manual-habit candidates are judgment-only (not re-derivable by gather),
  // so they self-heal only when explicitly re-decided — keep their keys in the gathered set.
  for (const it of items) {
    if (it.source_type === 'app-enhancement' || it.source_type === 'manual-habit') gatheredRefs.add(keyOf(it))
  }

  const r = await applyOpportunities(items, week, gatheredRefs)
  console.log(`app-scout apply (week ${week}): added ${r.added}, updated ${r.updated}, skipped-decided ${r.skippedDecided}, auto-shipped ${r.autoShipped}`)
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const sub = process.argv[2]
  const run = sub === 'gather' ? runGather : sub === 'apply' ? runApply : null
  if (!run) { console.error('usage: app-scout <gather|apply> [--payload=path] [--week=YYYY-MM-DD]'); process.exit(1) }
  run().catch((err) => { console.error(err); process.exit(1) })
}
```

- [ ] **Step 2: Add the npm script**

Modify `package.json` — change the `comms-learning` line (currently the last script, no trailing comma) to add `app-scout` after it:

```json
    "comms-assistant": "tsx comms-assistant/run.ts",
    "comms-learning": "tsx comms-assistant/run.ts",
    "app-scout": "tsx app-scout/run.ts"
```

- [ ] **Step 3: Run `gather` end-to-end against the real DB**

Run: `npm run app-scout -- gather`
Expected: prints a JSON object with non-empty `cli_workflows` (includes `"app-scout"`), a `dormant_data` array of public tables/views the app doesn't read (e.g. `meetings`, `agent_log`, `performance_reviews`), `app.pages`/`app.hooks` listing the current files, and `existing: []`.

- [ ] **Step 4: Smoke-test `apply` with a tiny payload**

Create a throwaway file `/tmp/app-scout-smoke.json`:

```json
[{ "source_type": "dormant-data", "source_ref": "meetings", "title": "Meetings board",
   "summary": "Surface meetings + action items the app can't show today.",
   "app_part": "Read v_meetings_with_attendees + v_open_action_items into a board.",
   "cli_part": null, "app_fit_score": 5, "value_score": 4, "effort": "M",
   "proposed_viz": "Timeline list with an open-action-items side panel.",
   "data_layer": "v_meetings_with_attendees, v_open_action_items",
   "rationale": "Pure read of existing views; high recurring value." }]
```

Run: `npm run app-scout -- apply --payload=/tmp/app-scout-smoke.json`
Expected: `app-scout apply (week <today>): added 1, updated 0, skipped-decided 0, auto-shipped 0`.

Run it again. Expected: `added 0, updated 1, ...` (idempotent — refreshed, not duplicated).

Verify via Supabase MCP `execute_sql`: `select source_ref, status, priority from v_build_opportunities;`
Expected: one row, `meetings`, `active`, `priority = 18` (5×4 − 2).

- [ ] **Step 5: Clean up the smoke row**

Run via Supabase MCP `execute_sql`: `delete from build_opportunities where source_ref = 'meetings' and source_type = 'dormant-data';`
Expected: the smoke row is gone (the real review will repopulate properly).

- [ ] **Step 6: Commit**

```bash
git add app-scout/run.ts package.json
git commit -m "feat(app-scout): gather/apply CLI dispatch + npm script"
```

---

### Task 5: App data layer — types + hook

**Files:**
- Create: `app/src/lib/workshop-types.ts`
- Create: `app/src/hooks/use-build-opportunities.ts`

**Interfaces:**
- Consumes: `v_build_opportunities` view + `build_opportunity_set_status` RPC (Task 1); `app/src/lib/supabase.ts` `supabase`.
- Produces:
  - `workshop-types.ts`: `export type OppStatus`, `export type OppSourceType`, `export type OppEffort`, `export interface BuildOpportunity` (all view columns + `priority: number`, `lane_rank: number`).
  - `use-build-opportunities.ts`: `export function useBuildOpportunities()` (Tanstack query, key `['build-opportunities']`, returns `BuildOpportunity[]`) and `export function useSetOppStatus()` (mutation calling the RPC, invalidates `['build-opportunities']`).

- [ ] **Step 1: Implement the types**

Create `app/src/lib/workshop-types.ts`:

```ts
export type OppStatus = 'active' | 'accepted' | 'building' | 'shipped' | 'dismissed'
export type OppSourceType = 'cli-workflow' | 'dormant-data' | 'app-enhancement' | 'manual-habit'
export type OppEffort = 'S' | 'M' | 'L'

export interface BuildOpportunity {
  id: string
  source_type: OppSourceType
  source_ref: string
  title: string
  summary: string | null
  app_part: string | null
  cli_part: string | null
  app_fit_score: number
  value_score: number
  effort: OppEffort
  proposed_viz: string | null
  data_layer: string | null
  status: OppStatus
  rationale: string | null
  first_seen_week: string | null
  last_reviewed_week: string | null
  priority: number
  lane_rank: number
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Implement the hook**

Create `app/src/hooks/use-build-opportunities.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BuildOpportunity, OppStatus } from '@/lib/workshop-types'

const COLS =
  'id,source_type,source_ref,title,summary,app_part,cli_part,app_fit_score,value_score,effort,' +
  'proposed_viz,data_layer,status,rationale,first_seen_week,last_reviewed_week,priority,lane_rank,created_at,updated_at'

export function useBuildOpportunities() {
  return useQuery({
    queryKey: ['build-opportunities'],
    queryFn: async (): Promise<BuildOpportunity[]> => {
      const { data, error } = await supabase
        .from('v_build_opportunities' as never)
        .select(COLS)
        .order('lane_rank', { ascending: true })
        .order('priority', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as BuildOpportunity[]
    },
  })
}

export function useSetOppStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { id: string; status: OppStatus }) => {
      const { error } = await supabase.rpc('build_opportunity_set_status', { p_id: v.id, p_status: v.status })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['build-opportunities'] }) },
  })
}
```

- [ ] **Step 3: Typecheck the app**

Run: `cd app && npx tsc --noEmit && cd ..`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/workshop-types.ts app/src/hooks/use-build-opportunities.ts
git commit -m "feat(app): build-opportunities types + Tanstack hook (read view, status RPC)"
```

---

### Task 6: App page — `/workshop` with lanes + cards

**Files:**
- Create: `app/src/components/workshop/opportunity-card.tsx`
- Create: `app/src/pages/workshop.tsx`

**Interfaces:**
- Consumes: `useBuildOpportunities()`, `useSetOppStatus()` (Task 5); `BuildOpportunity`, `OppStatus` (Task 5).
- Produces: `export function OpportunityCard(props: { opp: BuildOpportunity; onSetStatus: (id: string, status: OppStatus) => void })` and `export function WorkshopPage()`.

- [ ] **Step 1: Implement the card component**

Create `app/src/components/workshop/opportunity-card.tsx`:

```tsx
import { useState } from "react"
import type { BuildOpportunity, OppStatus } from "@/lib/workshop-types"

const SOURCE_LABEL: Record<string, string> = {
  "cli-workflow": "CLI workflow",
  "dormant-data": "Dormant data",
  "app-enhancement": "App enhancement",
  "manual-habit": "Manual habit",
}

function Dots({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={`${label}: ${n}/5`}>
      <span className="font-medium">{label}</span>
      <span className="tracking-tight">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= n ? "text-foreground" : "text-muted-foreground/30"}>●</span>
        ))}
      </span>
    </span>
  )
}

// Status transitions offered per current lane.
const NEXT: Record<OppStatus, { to: OppStatus; label: string }[]> = {
  active: [{ to: "accepted", label: "Accept" }, { to: "dismissed", label: "Dismiss" }],
  accepted: [{ to: "building", label: "Mark building" }, { to: "active", label: "Un-accept" }],
  building: [{ to: "shipped", label: "Mark shipped" }, { to: "accepted", label: "Back to accepted" }],
  shipped: [{ to: "active", label: "Reopen" }],
  dismissed: [{ to: "active", label: "Reopen" }],
}

export function OpportunityCard({
  opp,
  onSetStatus,
}: {
  opp: BuildOpportunity
  onSetStatus: (id: string, status: OppStatus) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{opp.title}</h3>
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {SOURCE_LABEL[opp.source_type] ?? opp.source_type}
        </span>
      </div>

      {opp.app_part && (
        <p className="text-xs text-foreground/90">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">↳ App gains: </span>
          {opp.app_part}
        </p>
      )}
      {opp.cli_part && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">⤷ Stays CLI: </span>
          {opp.cli_part}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Dots n={opp.app_fit_score} label="App-fit" />
        <Dots n={opp.value_score} label="Value" />
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground" title="Effort">{opp.effort}</span>
        <span className="ml-auto text-xs font-medium text-muted-foreground" title="priority = app-fit × value − effort">
          ★ {opp.priority}
        </span>
      </div>

      {(opp.proposed_viz || opp.data_layer) && (
        <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {opp.proposed_viz && <p>📊 {opp.proposed_viz}</p>}
          {opp.data_layer && <p className="font-mono">{opp.data_layer}</p>}
        </div>
      )}

      {opp.rationale && (
        <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:underline">
          {open ? "Hide rationale" : "Why?"}
        </button>
      )}
      {open && opp.rationale && <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">{opp.rationale}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {NEXT[opp.status].map(({ to, label }) => (
          <button
            key={to}
            onClick={() => onSetStatus(opp.id, to)}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground/70">
        first seen {opp.first_seen_week ?? "—"} · still surfaced {opp.last_reviewed_week ?? "—"}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Implement the page**

Create `app/src/pages/workshop.tsx`:

```tsx
import { useMemo } from "react"
import { Moon, Sun } from "lucide-react"
import { useBuildOpportunities, useSetOppStatus } from "@/hooks/use-build-opportunities"
import { useTheme } from "@/components/layout/theme-provider"
import { OpportunityCard } from "@/components/workshop/opportunity-card"
import type { BuildOpportunity, OppStatus } from "@/lib/workshop-types"
import { Skeleton } from "@/components/ui/skeleton"

const LANES: { status: OppStatus; title: string }[] = [
  { status: "active", title: "Active" },
  { status: "accepted", title: "Accepted" },
  { status: "building", title: "Building" },
  { status: "shipped", title: "Shipped" },
  { status: "dismissed", title: "Dismissed" },
]

export function WorkshopPage() {
  const { data, isLoading, error } = useBuildOpportunities()
  const setStatus = useSetOppStatus()
  const { theme, setTheme } = useTheme()

  const byLane = useMemo(() => {
    const groups: Record<OppStatus, BuildOpportunity[]> = {
      active: [], accepted: [], building: [], shipped: [], dismissed: [],
    }
    for (const o of data ?? []) groups[o.status]?.push(o)
    return groups
  }, [data])

  const newThisWeek = useMemo(() => {
    const list = data ?? []
    if (!list.length) return 0
    const latest = list.reduce((m, o) => (o.last_reviewed_week && o.last_reviewed_week > m ? o.last_reviewed_week : m), "")
    return list.filter((o) => o.status === "active" && o.first_seen_week === latest && latest !== "").length
  }, [data])

  const onSetStatus = (id: string, status: OppStatus) => setStatus.mutate({ id, status })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Build Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            {(data ?? []).length} candidates · {byLane.active.length} active
            {newThisWeek > 0 && <span className="ml-1 font-medium text-foreground">· {newThisWeek} new this week</span>}
          </p>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
        </button>
      </div>

      {isLoading && <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>}
      {error && <p className="text-sm text-destructive">Failed to load: {(error as Error).message}</p>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {LANES.map(({ status, title }) => (
            <section key={status} className="space-y-2">
              <h2 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{title}</span>
                <span className="rounded bg-muted px-1.5 py-0.5">{byLane[status].length}</span>
              </h2>
              <div className="space-y-2">
                {byLane[status].map((o) => <OpportunityCard key={o.id} opp={o} onSetStatus={onSetStatus} />)}
                {byLane[status].length === 0 && <p className="rounded-lg border border-dashed border-border px-2 py-6 text-center text-[11px] text-muted-foreground">none</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck the app**

Run: `cd app && npx tsc --noEmit && cd ..`
Expected: PASS. (If `@/components/ui/skeleton` does not exist, replace the `Skeleton` import + usages with a plain `<div className="h-40 w-full animate-pulse rounded-lg bg-muted" />`.)

- [ ] **Step 4: Commit**

```bash
git add app/src/components/workshop/opportunity-card.tsx app/src/pages/workshop.tsx
git commit -m "feat(app): /workshop page — lane board + opportunity cards with status write-back"
```

---

### Task 7: Wire the route + sidebar nav

**Files:**
- Modify: `app/src/App.tsx` (import + `<Route>`)
- Modify: `app/src/components/layout/sidebar.tsx` (icon import + nav item)

**Interfaces:**
- Consumes: `WorkshopPage` (Task 6).

- [ ] **Step 1: Register the route**

In `app/src/App.tsx`, add the import after the `TriagePage` import (line 11):

```tsx
import { TriagePage } from "@/pages/triage"
import { WorkshopPage } from "@/pages/workshop"
```

And add the route after the `/triage` route (inside `<Route element={<AppShell />}>`):

```tsx
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/workshop" element={<WorkshopPage />} />
```

- [ ] **Step 2: Add the sidebar nav item**

In `app/src/components/layout/sidebar.tsx`, add `Hammer` to the `lucide-react` import list (line 3–15), then add the nav item after the Triage entry (line 26):

```tsx
  { to: "/triage", icon: Inbox, label: "Triage" },
  { to: "/workshop", icon: Hammer, label: "Workshop" },
```

- [ ] **Step 3: Build the app to verify wiring**

Run: `cd app && npm run build && cd ..`
Expected: build succeeds (TypeScript + Vite), no unresolved imports.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `cd app && npm run dev` — open the printed localhost URL, click **Workshop** in the sidebar. Expected: the lane board renders (empty lanes show "none" until the first real review populates rows). Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/src/App.tsx app/src/components/layout/sidebar.tsx
git commit -m "feat(app): register /workshop route + sidebar nav"
```

---

### Task 8: Docs + agent wiring

**Files:**
- Create: `agents/app-scout.md`
- Modify: `CLAUDE.md` (agent table row + a natural-language trigger table)
- Modify: `dev_team/workflows.md` (session-start line for the accepted backlog)
- Modify: `dev_team/app-context.md` (refresh the stale Current Features table + add `/workshop`)

**Interfaces:** none (documentation).

- [ ] **Step 1: Write the agent definition doc**

Create `agents/app-scout.md`:

```markdown
# App Scout — Weekly Build-Opportunity Review

> Definition + procedure. Yonatan never runs the CLI; Claude does.
> Spec: docs/superpowers/specs/2026-06-17-app-scout-build-opportunities-design.md

## Purpose

A weekly Claude-in-the-loop review that finds slices of the system worth building into
the Second Brain app — workflows/data/habits that are pure data read/write + visualization
and don't need agent reasoning. Output is a ranked, read/write backlog on the `/workshop`
page, backed by the `build_opportunities` table.

## When to run

Triggered in natural language (see CLAUDE.md trigger table): "run the build-opportunity
review", "what should we build next", "scout the app backlog". Cadence is weekly by habit.

## Procedure

1. **Gather (facts).** `npm run app-scout -- gather`. Returns the evidence pack:
   - `cli_workflows` — every npm script.
   - `dormant_data` — public tables/views the app's hooks don't read yet.
   - `app` — current pages/hooks + the tables they read (the "what we have" baseline).
   - `existing` — current `build_opportunities` rows (so you reason against prior decisions).
2. **Classify (judgment — this is you).** For each candidate across the four sources
   (`cli-workflow`, `dormant-data`, `app-enhancement`, `manual-habit`), apply the rubric:
   - `app_fit_score` 1–5: how little agent reasoning the *app half* needs (5 = pure CRUD/viz).
   - **Split hybrids:** `cli_part` = the reasoning that stays in CLI; `app_part` = the
     data/viz half the app surfaces. (Pure-data candidates have `cli_part: null`.)
   - `value_score` 1–5: usefulness, judged vs `current_focus` and how often the data changes.
   - `effort` S/M/L: based on whether the view/hook exists, table shape, viz complexity.
   - `proposed_viz` + `data_layer`: concrete enough for dev-team-lead to plan from.
   Never re-propose a candidate the `existing` list shows as decided
   (accepted/building/shipped/dismissed) — `apply` skips those anyway.
3. **Write the payload.** Build an `OpportunityInput[]` JSON file (see `app-scout/store.ts`
   for the shape) and `npm run app-scout -- apply --payload=<path>`. New candidates land
   `active`; still-relevant ones refresh + bump `last_reviewed_week`; gaps that closed
   auto-ship. The summary prints added/updated/skipped-decided/auto-shipped.
4. **Walk the board.** Open the app's `/workshop` page; talk Yonatan through what's new and
   the top-ranked active candidates. He accepts/dismisses/advances on the page.

## Files

`app-scout/run.ts` (CLI: gather · apply) · `gather.ts` (evidence pack — pure helpers
`tablesReadByHooks`, `isoWeekDate`) · `store.ts` (`applyOpportunities` idempotent on
`(source_type, source_ref)`, auto-ship) · `score.ts` (`priority`, mirrors the view) ·
`sql/build_opportunities_init.sql` (schema provenance). App surface: `/workshop` page,
`use-build-opportunities` hook, `v_build_opportunities` view, `build_opportunity_set_status` RPC.
```

- [ ] **Step 2: Add the CLAUDE.md agent-table row**

In `CLAUDE.md`, in the **PM Team & Infrastructure Agents** table, add a row after the `Comms Assistant` row:

```markdown
| App Scout | `app-scout` | `app-scout/` + `agents/app-scout.md` | Weekly Claude-in-the-loop review that inventories CLI workflows, dormant DB surface, app-enhancement gaps, and manual habits; classifies app build-candidates (splitting hybrid flows into a CLI-reasoning half + an app data/viz half); writes them to `build_opportunities`; surfaces a ranked read/write backlog on the app's `/workshop` page. `gather` / `apply` |
```

- [ ] **Step 3: Add the CLAUDE.md natural-language trigger block**

In `CLAUDE.md`, immediately after the **Comms Assistant — natural-language trigger** paragraph, add:

```markdown
**App Scout — natural-language trigger (Yonatan never runs the CLI; you do):** When Yonatan says **"run the build-opportunity review"**, **"what should we build next"**, or **"scout the app backlog"**, run `npm run app-scout -- gather`, reason over the evidence pack to classify app build-candidates (split hybrid flows: reasoning stays CLI, data/viz becomes the app half), write an `OpportunityInput[]` payload, `npm run app-scout -- apply --payload=<path>`, then open the app's `/workshop` page and walk P0→P1 candidates. Decided items are never re-proposed; closed gaps auto-ship. Full procedure: [agents/app-scout.md](agents/app-scout.md).
```

- [ ] **Step 4: Add the dev-team backlog check**

In `dev_team/workflows.md`, in the **Session Start Protocol** numbered list (after item 2 "Check backlog"), add:

```markdown
6. **Check accepted build-opportunities**: `SELECT title, app_part, data_layer, proposed_viz, priority FROM v_build_opportunities WHERE status = 'accepted' ORDER BY priority DESC;` — these are app candidates Yonatan greenlit on the `/workshop` page. Treat them as candidate backlog for planning (they don't auto-become tasks).
```

- [ ] **Step 5: Refresh the stale app-context Current Features table**

In `dev_team/app-context.md`, replace the **Current Features** table (the block under `## Current Features`) with the real current state:

```markdown
| Feature | Status | Route |
|---------|--------|-------|
| Dashboard | Live | `/` |
| Initiatives list + detail | Live | `/initiatives`, `/initiatives/:slug` |
| People | Live | `/people` |
| PPP | Live | `/ppp` |
| Quarterly Plan | Live | `/plans` |
| Triage (comms) | Live | `/triage` |
| Workshop (build opportunities) | Live | `/workshop` |
```

And add a changelog row at the bottom of the file:

```markdown
| 2026-06-17 | v1.1 — Refreshed Current Features to reality; added /workshop (App Scout build-opportunity board) |
```

- [ ] **Step 6: Commit**

```bash
git add agents/app-scout.md CLAUDE.md dev_team/workflows.md dev_team/app-context.md
git commit -m "docs(app-scout): agent doc, CLAUDE.md agent+trigger, dev-team backlog check, app-context refresh"
```

---

## Self-Review

**Spec coverage:**
- Data model (table/view/RPC) → Task 1. ✓
- `gather` = facts, `apply` = judgment, rubric → Tasks 3, 4, 8 (agent doc). ✓
- Idempotent upsert on `(source_type, source_ref)`, skip-decided, auto-ship → Task 2. ✓
- Derived priority `app_fit×value − effort_penalty(S0/M2/L4)` → Task 1 (view) + Task 2 (score.ts), consistent. ✓
- `/workshop` page: lanes, the split rows, score dots, effort chip, proposed_viz/data_layer, rationale, write-back actions, "N new this week" strip, first-seen/still-surfaced footer → Tasks 6, 7. ✓
- Natural-language trigger + week-over-week behavior → Task 8. ✓
- Dev-team bridge (read accepted as backlog, not auto-tasks) → Task 8 step 4. ✓
- Docs touched (agent doc, CLAUDE.md, dev_team/workflows.md, app-context.md, package.json) → Tasks 4, 8. ✓
- Out of scope (cron, auto agent_tasks, persistent agent) — correctly not built. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; the one conditional (Task 6 step 3 Skeleton fallback) gives the exact replacement. ✓

**Type consistency:** `priority` signature identical in `score.ts` and its test; `OpportunityInput` fields match the `applyOpportunities` insert/update and the Task 4 payload and the Task 8 doc; `BuildOpportunity` (app) mirrors the view columns + `priority`/`lane_rank`; RPC names `app_scout_db_surface` / `build_opportunity_set_status` consistent across Tasks 1, 3, 5; status/source/effort enums identical in SQL CHECKs, `store.ts`, and `workshop-types.ts`. ✓
```
