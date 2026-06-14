# Comms Response Learning Loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 retrospective backtest that predicts Yonatan's email replies *blind*, reconciles them against what he actually sent, and distills confidence-scored style/decision rules.

**Architecture:** Four stages — classify → predict(blind) → reconcile → distill. Deterministic plumbing (email classifier, the as-of blindness guard, confidence math, structural delta, DB layer, CLI) is built TDD-first as pure modules. The LLM-driven steps (producing a prediction, judging a stance delta, clustering observations) are run by the agent via the CLI, following the runbook in Task 9 — mirroring the command-center pattern where scripts do plumbing and the agent does MCP + reasoning.

**Tech Stack:** TypeScript (ESM, `type: module`), `tsx`, Node built-in test runner (`node:test` + `node:assert/strict`), `@supabase/supabase-js` (service role, lazy import), Supabase Postgres (DDL via the Supabase MCP `apply_migration`).

**v1 scope note:** Backtest is silent, email-only, reply threads only, last ~30 days. Decay / cross-run supersede / refine / retire are **deferred to live mode** — a single backtest run has no time axis. v1 lifecycle = creation + confidence + promotion + within-run contradiction (consistency).

---

### Task 1: Database schema

**Files:**
- DDL applied via Supabase MCP `apply_migration` (migration name `comms_learning_v1`)
- No repo file; record the SQL in the plan and apply it.

- [ ] **Step 1: Apply the migration**

Apply via the Supabase MCP `apply_migration` tool, `name: "comms_learning_v1"`, query:

```sql
create table if not exists comms_predictions (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'reply' check (mode in ('reply','initiated')),
  thread_id text,
  message_id text,
  internet_message_id text,
  web_link text,
  channel text not null default 'email',
  as_of timestamptz not null,
  trigger_text text,
  predicted_reply text,
  confidence text check (confidence in ('high','med','low')),
  confidence_score numeric,
  context_available jsonb not null default '{}'::jsonb,
  actual_reply text,
  delta jsonb,
  resolution text check (resolution in ('match','edited','out_of_band','no_reply')),
  why text,
  derived_rule_ids uuid[] not null default '{}',
  sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists comms_rules (
  id uuid primary key default gen_random_uuid(),
  scope jsonb not null default '{}'::jsonb,
  type text not null check (type in ('style','decision')),
  statement text not null,
  confidence numeric not null default 0,
  support int not null default 0,
  consistency numeric not null default 0,
  diversity int not null default 0,
  data_dependency text,
  status text not null default 'watch' check (status in ('watch','active','superseded','retired')),
  supersedes uuid references comms_rules(id),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comms_predictions_mode on comms_predictions (mode);
create index if not exists idx_comms_predictions_resolution on comms_predictions (resolution);
create index if not exists idx_comms_rules_status on comms_rules (status);
create index if not exists idx_comms_rules_type on comms_rules (type);
```

- [ ] **Step 2: Verify the tables exist**

Run this via the Supabase MCP `execute_sql`:

```sql
select table_name from information_schema.tables
where table_name in ('comms_predictions','comms_rules') order by table_name;
```

Expected: two rows — `comms_predictions`, `comms_rules`.

- [ ] **Step 3: Record the privacy decision**

Run via Supabase MCP `execute_sql`:

```sql
insert into project_decisions (title, description, status, category)
values (
  'comms_learning tables are never embedded',
  'comms_predictions and comms_rules hold distilled comms content (verbatim relevant span for non-sensitive reply text). Like command_center_* and PPP private_notes, these tables are never embedded and never surfaced wholesale to other agents.',
  'active', 'convention'
);
```

Expected: `INSERT 0 1`.

---

### Task 2: Shared types

**Files:**
- Create: `scripts/comms-learning/types.ts`

- [ ] **Step 1: Write the types**

```ts
// Shared interfaces for the comms-learning backtest pipeline.
export type Mode = 'reply' | 'initiated'
export type ConfidenceBand = 'high' | 'med' | 'low'
export type Resolution = 'match' | 'edited' | 'out_of_band' | 'no_reply'
export type RuleType = 'style' | 'decision'
export type RuleStatus = 'watch' | 'active' | 'superseded' | 'retired'

export interface ContextAvailable {
  personInDb?: boolean
  initiativeMemory?: boolean
  priorThread?: boolean
  coldStart?: boolean
}

export interface PredictionRow {
  id?: string
  mode: Mode
  thread_id: string | null
  message_id: string | null
  internet_message_id: string | null
  web_link: string | null
  channel: string
  as_of: string
  trigger_text: string | null
  predicted_reply: string | null
  confidence: ConfidenceBand | null
  confidence_score: number | null
  context_available: ContextAvailable
  actual_reply: string | null
  delta: Record<string, unknown> | null
  resolution: Resolution | null
  why: string | null
  derived_rule_ids: string[]
  sensitive: boolean
  created_at?: string
}

export interface RuleRow {
  id?: string
  scope: { person?: string; initiative?: string; topic?: string; channel?: string }
  type: RuleType
  statement: string
  confidence: number
  support: number
  consistency: number
  diversity: number
  data_dependency: string | null
  status: RuleStatus
  supersedes: string | null
  pinned: boolean
  created_at?: string
  updated_at?: string
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 3: Email classifier (pure, TDD)

**Files:**
- Create: `scripts/comms-learning/classify.ts`
- Test: `scripts/comms-learning/__tests__/classify.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { classifyEmail } from '../classify.js'

describe('classifyEmail', () => {
  it('calendar RSVP subject → noise, no prediction', () => {
    const c = classifyEmail({ subject: 'Accepted: CLM Leadership - Q3 Planning', sender: 'x', recipients: [] })
    assert.equal(c.isNoise, true)
    assert.equal(c.needsPrediction, false)
  })

  it('office notification subject → noise', () => {
    const c = classifyEmail({ subject: 'Yonatan Orpeli mentioned you in "Jun_11_PPP".', sender: 'x', recipients: [] })
    assert.equal(c.isNoise, true)
    assert.equal(c.needsPrediction, false)
  })

  it('genuine reply → isReply + needsPrediction', () => {
    const c = classifyEmail({ subject: 'Re: eBay Kenya manual review', sender: 'x', recipients: ['a@p.com'] })
    assert.equal(c.isReply, true)
    assert.equal(c.isNoise, false)
    assert.equal(c.needsPrediction, true)
  })

  it('sensitive reply → flagged, not predicted in v1', () => {
    const c = classifyEmail({ subject: 'Re: Compensation review', sender: 'x', recipients: [] })
    assert.equal(c.isSensitive, true)
    assert.equal(c.needsPrediction, false)
  })

  it('initiated (non-reply) → not predicted', () => {
    const c = classifyEmail({ subject: 'War room set up', sender: 'x', recipients: [] })
    assert.equal(c.isReply, false)
    assert.equal(c.needsPrediction, false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/comms-learning/__tests__/classify.test.ts`
Expected: FAIL — `Cannot find module '../classify.js'`.

- [ ] **Step 3: Write the implementation**

```ts
// Pure classifier over email metadata. Decides reply vs noise vs sensitive,
// and whether the item is a prediction candidate for the v1 backtest.
export interface EmailMeta {
  subject: string
  sender: string
  recipients: string[]
  bodyPreview?: string
}

export interface Classification {
  isReply: boolean
  isNoise: boolean
  isSensitive: boolean
  needsPrediction: boolean
  reason: string
}

const NOISE_SUBJECT = /^(re:\s*)?(accepted|declined|canceled|cancelled|tentative|new time proposed):/i
const NOISE_NOTIFICATION = /(mentioned you in|assigned you a task in|left a comment in|replied to a comment in|shared ".*" with you)/i
const SENSITIVE = /(salary|compensation|\bcomp review\b|termination|terminate|performance review|\bpip\b|layoff|fraud|legal|harassment|disciplinary)/i

export function classifyEmail(meta: EmailMeta): Classification {
  const subject = (meta.subject || '').trim()
  if (NOISE_SUBJECT.test(subject)) {
    return { isReply: false, isNoise: true, isSensitive: false, needsPrediction: false, reason: 'calendar/rsvp subject' }
  }
  if (NOISE_NOTIFICATION.test(subject)) {
    return { isReply: false, isNoise: true, isSensitive: false, needsPrediction: false, reason: 'office notification' }
  }
  const isReply = /^re:/i.test(subject)
  const isSensitive = SENSITIVE.test(`${subject} ${meta.recipients.join(' ')}`)
  const needsPrediction = isReply && !isSensitive
  const reason = !isReply
    ? 'not a reply (initiated/other)'
    : isSensitive ? 'sensitive — skip in v1' : 'reply needs prediction'
  return { isReply, isNoise: false, isSensitive, needsPrediction, reason }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/comms-learning/__tests__/classify.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/comms-learning/classify.ts scripts/comms-learning/__tests__/classify.test.ts scripts/comms-learning/types.ts
git commit -m "feat(comms-learning): email classifier + shared types"
```

---

### Task 4: As-of blindness guard (pure, TDD)

**Files:**
- Create: `scripts/comms-learning/asof.ts`
- Test: `scripts/comms-learning/__tests__/asof.test.ts`

This is the leakage seal: context records dated *after* the email landed must never reach the predictor.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { filterAsOf } from '../asof.js'

const ASOF = '2026-06-10T12:00:00.000Z'

describe('filterAsOf', () => {
  it('excludes records updated after asOf', () => {
    const out = filterAsOf([{ updated_at: '2026-06-11T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 0)
  })

  it('includes records updated before asOf', () => {
    const out = filterAsOf([{ updated_at: '2026-06-09T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 1)
  })

  it('includes a record exactly at asOf (<=)', () => {
    const out = filterAsOf([{ updated_at: ASOF }], ASOF)
    assert.equal(out.length, 1)
  })

  it('excludes records with no timestamp (blind by default)', () => {
    const out = filterAsOf([{ updated_at: null, created_at: null }], ASOF)
    assert.equal(out.length, 0)
  })

  it('falls back to created_at when updated_at is missing', () => {
    const out = filterAsOf([{ created_at: '2026-06-01T00:00:00.000Z' }], ASOF)
    assert.equal(out.length, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/comms-learning/__tests__/asof.test.ts`
Expected: FAIL — `Cannot find module '../asof.js'`.

- [ ] **Step 3: Write the implementation**

```ts
// Point-in-time filter: only context that existed at/before `asOf` is visible.
// Unknown timestamp → excluded, so the predictor is blind by default.
export interface Timestamped {
  updated_at?: string | null
  created_at?: string | null
}

export function filterAsOf<T extends Timestamped>(records: T[], asOf: string): T[] {
  const cut = new Date(asOf).getTime()
  return records.filter((r) => {
    const t = r.updated_at ?? r.created_at
    if (!t) return false
    return new Date(t).getTime() <= cut
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/comms-learning/__tests__/asof.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/comms-learning/asof.ts scripts/comms-learning/__tests__/asof.test.ts
git commit -m "feat(comms-learning): as-of blindness guard for context"
```

---

### Task 5: Structural delta (pure, TDD)

**Files:**
- Create: `scripts/comms-learning/delta.ts`
- Test: `scripts/comms-learning/__tests__/delta.test.ts`

Deterministic style metrics (length, language). The *semantic stance* delta is judged by the agent at reconcile time and merged into the same `delta` jsonb.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectLang, structuralDelta } from '../delta.js'

describe('detectLang', () => {
  it('English', () => assert.equal(detectLang('Can we push this'), 'en'))
  it('Hebrew', () => assert.equal(detectLang('חשבתי שזה קרה'), 'he'))
  it('mixed', () => assert.equal(detectLang('Walla ? חשבתי'), 'mixed'))
  it('empty', () => assert.equal(detectLang('   '), 'empty'))
})

describe('structuralDelta', () => {
  it('length ratio + language match', () => {
    const d = structuralDelta('Hi there', 'Hi')
    assert.equal(d.lengthRatio, 4)
    assert.equal(d.languageMatch, true)
  })

  it('language mismatch flagged', () => {
    const d = structuralDelta('Yes, aligned', 'כן, מסכים')
    assert.equal(d.languageMatch, false)
  })

  it('empty actual → ratio 0', () => {
    const d = structuralDelta('something', '')
    assert.equal(d.lengthRatio, 0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/comms-learning/__tests__/delta.test.ts`
Expected: FAIL — `Cannot find module '../delta.js'`.

- [ ] **Step 3: Write the implementation**

```ts
// Deterministic style-delta metrics between predicted and actual replies.
const HEBREW = /[֐-׿]/
const LATIN = /[A-Za-z]/

export type Lang = 'he' | 'en' | 'mixed' | 'empty'

export function detectLang(text: string): Lang {
  if (!text.trim()) return 'empty'
  const he = HEBREW.test(text)
  const en = LATIN.test(text)
  if (he && en) return 'mixed'
  return he ? 'he' : 'en'
}

export interface StructuralDelta {
  predictedLen: number
  actualLen: number
  lengthRatio: number
  langPredicted: Lang
  langActual: Lang
  languageMatch: boolean
}

export function structuralDelta(predicted: string, actual: string): StructuralDelta {
  const langPredicted = detectLang(predicted)
  const langActual = detectLang(actual)
  return {
    predictedLen: predicted.length,
    actualLen: actual.length,
    lengthRatio: actual.length === 0 ? 0 : +(predicted.length / actual.length).toFixed(2),
    langPredicted,
    langActual,
    languageMatch: langPredicted === langActual,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/comms-learning/__tests__/delta.test.ts`
Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/comms-learning/delta.ts scripts/comms-learning/__tests__/delta.test.ts
git commit -m "feat(comms-learning): structural style-delta metrics"
```

---

### Task 6: Confidence math + promotion (pure, TDD)

**Files:**
- Create: `scripts/comms-learning/confidence.ts`
- Test: `scripts/comms-learning/__tests__/confidence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { consistencyOf, confidenceScore, isPromotable, statusFor, THRESHOLDS } from '../confidence.js'

describe('confidence', () => {
  it('consistency = support / (support+contradict)', () => {
    assert.equal(consistencyOf({ support: 3, contradict: 1, diversity: 2 }), 0.75)
  })

  it('promotes when all thresholds met', () => {
    assert.equal(isPromotable({ support: 3, contradict: 0, diversity: 2 }), true)
  })

  it('blocks promotion when support too low', () => {
    assert.equal(isPromotable({ support: 2, contradict: 0, diversity: 2 }), false)
  })

  it('blocks promotion when consistency below 0.7', () => {
    assert.equal(isPromotable({ support: 5, contradict: 3, diversity: 3 }), false)
  })

  it('pinned is always active', () => {
    assert.equal(statusFor({ support: 1, contradict: 0, diversity: 1 }, true), 'active')
  })

  it('thresholds are the agreed v1 values', () => {
    assert.deepEqual(THRESHOLDS, { support: 3, consistency: 0.7, diversity: 2 })
  })

  it('confidenceScore in [0,1]', () => {
    const s = confidenceScore({ support: 5, contradict: 0, diversity: 3 })
    assert.equal(s, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test scripts/comms-learning/__tests__/confidence.test.ts`
Expected: FAIL — `Cannot find module '../confidence.js'`.

- [ ] **Step 3: Write the implementation**

```ts
// Confidence scoring + watch->active promotion for comms_rules.
export interface RuleEvidence {
  support: number     // supporting observations
  contradict: number  // contradicting observations
  diversity: number   // distinct thread/day contexts among supporting
}

export const THRESHOLDS = { support: 3, consistency: 0.7, diversity: 2 } as const

export function consistencyOf(e: RuleEvidence): number {
  const total = e.support + e.contradict
  return total === 0 ? 0 : +(e.support / total).toFixed(2)
}

export function confidenceScore(e: RuleEvidence): number {
  const consistency = consistencyOf(e)
  const supportFactor = Math.min(1, e.support / 5)
  const diversityFactor = Math.min(1, e.diversity / 3)
  return +(consistency * supportFactor * diversityFactor).toFixed(2)
}

export function isPromotable(e: RuleEvidence): boolean {
  return (
    e.support >= THRESHOLDS.support &&
    consistencyOf(e) >= THRESHOLDS.consistency &&
    e.diversity >= THRESHOLDS.diversity
  )
}

export function statusFor(e: RuleEvidence, pinned = false): 'watch' | 'active' {
  if (pinned) return 'active'
  return isPromotable(e) ? 'active' : 'watch'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test scripts/comms-learning/__tests__/confidence.test.ts`
Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/comms-learning/confidence.ts scripts/comms-learning/__tests__/confidence.test.ts
git commit -m "feat(comms-learning): confidence scoring + promotion thresholds"
```

---

### Task 7: DB store layer

**Files:**
- Create: `scripts/comms-learning/store.ts`

Follows the `scripts/command-center/store.ts` convention: lazy Supabase import, `.from('table' as any)`, cast results `as unknown as Row`. DB-touching layer is verified manually (matching the repo, which unit-tests pure logic, not the store).

- [ ] **Step 1: Write the store**

```ts
// DB layer for the comms-learning backtest. comms_predictions (per-item) and
// comms_rules (the living rulebook). NEVER embedded. Lazy Supabase import.
import type { PredictionRow, RuleRow, Resolution } from './types.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../../lib/supabase.js')
  return getSupabase()
}

const PRED_COLS =
  'id, mode, thread_id, message_id, internet_message_id, web_link, channel, as_of, trigger_text, predicted_reply, confidence, confidence_score, context_available, actual_reply, delta, resolution, why, derived_rule_ids, sensitive, created_at'

export async function insertPrediction(row: PredictionRow): Promise<string> {
  const { data, error } = await (await db())
    .from('comms_predictions' as any)
    .insert(row as any)
    .select('id')
    .single()
  if (error) throw error
  return (data as any).id as string
}

export async function listPredictions(opts: { unreconciledOnly?: boolean } = {}): Promise<PredictionRow[]> {
  let q = (await db()).from('comms_predictions' as any).select(PRED_COLS)
  if (opts.unreconciledOnly) q = q.is('resolution', null)
  const { data, error } = await q
  if (error) throw error
  return (data as unknown as PredictionRow[]) ?? []
}

export interface ReconcilePatch {
  actual_reply: string | null
  delta: Record<string, unknown>
  resolution: Resolution
  why?: string | null
}

export async function reconcilePrediction(id: string, patch: ReconcilePatch): Promise<void> {
  const { error } = await (await db())
    .from('comms_predictions' as any)
    .update({ ...patch } as any)
    .eq('id', id)
  if (error) throw error
}

const RULE_COLS =
  'id, scope, type, statement, confidence, support, consistency, diversity, data_dependency, status, supersedes, pinned, created_at, updated_at'

export async function listRules(): Promise<RuleRow[]> {
  const { data, error } = await (await db())
    .from('comms_rules' as any)
    .select(RULE_COLS)
    .order('confidence', { ascending: false })
  if (error) throw error
  return (data as unknown as RuleRow[]) ?? []
}

export async function insertRule(row: RuleRow): Promise<string> {
  const { data, error } = await (await db())
    .from('comms_rules' as any)
    .insert({ ...row, updated_at: new Date().toISOString() } as any)
    .select('id')
    .single()
  if (error) throw error
  return (data as any).id as string
}

// Supersede: mark the old rule superseded, insert the new one linked via supersedes.
export async function supersedeRule(oldId: string, next: RuleRow): Promise<string> {
  const sb = await db()
  const { error: e1 } = await sb
    .from('comms_rules' as any)
    .update({ status: 'superseded', updated_at: new Date().toISOString() } as any)
    .eq('id', oldId)
  if (e1) throw e1
  return insertRule({ ...next, supersedes: oldId })
}

export async function pinRule(id: string): Promise<void> {
  const { error } = await (await db())
    .from('comms_rules' as any)
    .update({ pinned: true, status: 'active', confidence: 1, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke-test against the DB**

Run:
```bash
npx tsx -e "import('./scripts/comms-learning/store.js').then(async s => { const id = await s.insertPrediction({ mode:'reply', thread_id:'t1', message_id:'m1', internet_message_id:null, web_link:null, channel:'email', as_of:new Date().toISOString(), trigger_text:'smoke', predicted_reply:'hi', confidence:'low', confidence_score:0.1, context_available:{coldStart:true}, actual_reply:null, delta:null, resolution:null, why:null, derived_rule_ids:[], sensitive:false }); console.log('inserted', id); console.log('unreconciled', (await s.listPredictions({unreconciledOnly:true})).length) })"
```
Expected: prints `inserted <uuid>` then `unreconciled <n>` (n ≥ 1).

- [ ] **Step 4: Clean up the smoke row**

Run via Supabase MCP `execute_sql`:
```sql
delete from comms_predictions where trigger_text = 'smoke';
```
Expected: `DELETE 1` (or more if re-run).

- [ ] **Step 5: Commit**

```bash
git add scripts/comms-learning/store.ts
git commit -m "feat(comms-learning): supabase store layer for predictions + rules"
```

---

### Task 8: CLI orchestrator

**Files:**
- Create: `scripts/comms-learning/run.ts`
- Modify: `package.json` (add the `comms-learning` script)

The agent drives the backtest through this CLI: it ingests blind-prediction payloads, lists items to reconcile, ingests reconcile/rule payloads. Mirrors `command-center` payload-file ingestion.

- [ ] **Step 1: Write the CLI**

```ts
// CLI for the comms-learning backtest. Agent-facing: ingest payloads, list work.
//   predictions:add --payload=<json>        insert a blind prediction
//   predictions:list [--unreconciled]       list rows (optionally needing reconcile)
//   predictions:reconcile --payload=<json>  { id, actual_reply, delta, resolution, why? }
//   rules:list                              list rules, highest confidence first
//   rules:add --payload=<json>              insert a rule
//   rules:supersede --payload=<json>        { oldId, rule }
//   rules:pin --id=<uuid>
import { readFileSync } from 'node:fs'
import {
  insertPrediction, listPredictions, reconcilePrediction,
  listRules, insertRule, supersedeRule, pinRule,
} from './store.js'

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}
function payload(): any {
  const p = arg('payload')
  if (!p) throw new Error('--payload=<path> required')
  return JSON.parse(readFileSync(p, 'utf8'))
}

async function main() {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'predictions:add': {
      const id = await insertPrediction(payload())
      console.log(JSON.stringify({ inserted: id }))
      break
    }
    case 'predictions:list': {
      const rows = await listPredictions({ unreconciledOnly: flag('unreconciled') })
      console.log(JSON.stringify(rows, null, 2))
      break
    }
    case 'predictions:reconcile': {
      const { id, ...patch } = payload()
      await reconcilePrediction(id, patch)
      console.log(JSON.stringify({ reconciled: id }))
      break
    }
    case 'rules:list': {
      console.log(JSON.stringify(await listRules(), null, 2))
      break
    }
    case 'rules:add': {
      console.log(JSON.stringify({ inserted: await insertRule(payload()) }))
      break
    }
    case 'rules:supersede': {
      const { oldId, rule } = payload()
      console.log(JSON.stringify({ inserted: await supersedeRule(oldId, rule) }))
      break
    }
    case 'rules:pin': {
      const id = arg('id')
      if (!id) throw new Error('--id=<uuid> required')
      await pinRule(id)
      console.log(JSON.stringify({ pinned: id }))
      break
    }
    default:
      console.error('unknown command: ' + cmd)
      process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Add the npm script**

In `package.json`, inside `"scripts"`, after the `command-center:day` line, add:

```json
    "comms-learning": "tsx scripts/comms-learning/run.ts"
```

- [ ] **Step 3: Verify the CLI dispatches**

Run: `npm run comms-learning -- rules:list`
Expected: prints `[]` (empty rules table) and exits 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/comms-learning/run.ts package.json
git commit -m "feat(comms-learning): CLI orchestrator + npm script"
```

---

### Task 9: Backtest runbook (agent-driven)

**Files:**
- Create: `scripts/comms-learning/RUNBOOK.md`

This documents the procedure the agent (Claude, with the Microsoft 365 MCP) follows to run the backtest using the CLI from Task 8. It is the LLM-reasoning glue, kept out of code by design.

- [ ] **Step 1: Write the runbook**

````markdown
# Comms Learning — v1 Backtest Runbook

Run by Claude with the Microsoft 365 MCP + this repo's CLI. Silent, email-only,
last ~30 days, reply threads only. Spec:
`docs/superpowers/specs/2026-06-13-comms-response-learning-loop-design.md`.

## Stage 1 — Classify (build the worklist)
1. Pull Sent Items for the last 30 days via `outlook_email_search`
   (folderName "Sent Items", paginate by offset).
2. Apply `classifyEmail()` (scripts/comms-learning/classify.ts) to each — keep only
   `needsPrediction === true`. Target ~15–25 genuine reply threads. Log how many were
   dropped as noise/sensitive (no silent truncation).

## Stage 2 — Predict (BLIND)
For each worklist item:
1. Read the thread *up to the incoming message only* (never your own later reply).
   Set `as_of = incoming message receivedDateTime`.
2. Assemble context, then pass it through `filterAsOf(records, as_of)` — person row,
   initiative memory, prior thread. Record what survived in `context_available`
   (personInDb / initiativeMemory / priorThread / coldStart).
3. Produce `predicted_reply` and a self-rated `confidence` band — using ONLY the
   as-of context. Do not use anything you know about how things turned out.
4. Store it:
   `npm run comms-learning -- predictions:add --payload=<file>`
   (`mode:'reply'`, `trigger_text` = verbatim relevant span of the incoming message,
   quoted history/signatures stripped; `actual_reply:null`, `resolution:null`).
   Capture identifiers from the search/`read_resource` result: `message_id` ← Graph
   `id`, `internet_message_id` ← `internetMessageId`, `web_link` ← `webLink`,
   `thread_id` ← `conversationId` (from `read_resource`; if absent, leave null and
   match in Stage 3 by normalized subject + participants).

## Stage 3 — Reconcile (item-by-item)
`npm run comms-learning -- predictions:list --unreconciled`. For each:
1. Fetch Yonatan's actual sent reply in that thread.
2. `delta` = `structuralDelta(predicted, actual)` (scripts/comms-learning/delta.ts)
   MERGED with your judged **stance delta**: did yes/no/defer/escalate change?
3. Pick `resolution`: `match` (≈ same), `edited` (same stance, different wording),
   `out_of_band` (he resolved in a meeting/verbally/WhatsApp — no email reply),
   `no_reply` (never answered).
4. If the **stance** changed, ask Yonatan "why?" now (item-by-item) and capture his
   answer in `why`.
5. `npm run comms-learning -- predictions:reconcile --payload=<file>`.

## Stage 4 — Distill
1. Cluster reconciled rows by scope (person / topic / channel) and by delta pattern.
2. For each cluster compute evidence {support, contradict, diversity} and run
   `confidenceScore` / `statusFor` (scripts/comms-learning/confidence.ts).
3. Write rules: `npm run comms-learning -- rules:add --payload=<file>` (set `type`
   style|decision, `data_dependency`, computed `confidence`/`support`/`consistency`/
   `diversity`/`status`). Decision-type rules also belong in `decision_journal`.

## Report
- `resolution` distribution (match / edited / out_of_band / no_reply).
- Among match+edited: accuracy **conditioned on `context_available`** — the key
  diagnostic (good-with-context vs poor-when-cold?).
- Rules created, with confidence and which are `active` vs `watch`.
- Recommendation: does the loop predict Yonatan well enough to build live mode?
````

- [ ] **Step 2: Commit**

```bash
git add scripts/comms-learning/RUNBOOK.md
git commit -m "docs(comms-learning): v1 backtest runbook"
```

---

## Definition of done

- Migration applied; both tables verified; privacy decision recorded.
- `classify`, `asof`, `delta`, `confidence` all green (`npx tsx --test scripts/comms-learning/__tests__/*.test.ts`).
- `npm run comms-learning -- rules:list` returns `[]`; store smoke-test inserts/reads.
- RUNBOOK committed.
- Ready to run the backtest against real last-30-day mail (separate session step).
