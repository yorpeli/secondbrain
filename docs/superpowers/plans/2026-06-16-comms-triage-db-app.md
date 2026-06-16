# Comms Triage — DB-backed presentation + in-app feedback loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the comms triage card from a dead-end HTML file to the DB as backbone, add a write-capable `/triage` page in the existing Vite app so Yonatan can edit/accept-reject/note/set-status per card, and feed that feedback into an interactive CLI distill pass that produces `comms_rules`.

**Architecture:** Two decoupled flows meeting only at the DB. **Flow 1 (assist):** sweep → fan-out → `comms_predictions` (now carrying a full `card` payload) → `/triage` app → feedback via one atomic RPC into `comms_feedback`. **Flow 2 (learn):** on-demand `rules:distill` reads new `comms_feedback`, the Claude session analyzes + asks clarifying questions, then writes `comms_rules`. The LLM reasoning + fan-out stay in a Claude session (subscription); only deterministic plumbing touches the DB.

**Tech Stack:** Supabase Postgres (migrations + a `security definer` RPC + RLS), TypeScript CLI (`tsx`, `node:test`), and the existing `app/` (Vite + React 19 + Tanstack Query + `@supabase/supabase-js` + shadcn).

**Spec:** [docs/superpowers/specs/2026-06-16-comms-triage-db-app-design.md](../specs/2026-06-16-comms-triage-db-app-design.md)

---

## Conventions for this plan

- **Run a single test file:** `npx tsx --test comms-assistant/__tests__/<file>.test.ts`
- **DB access in tests/CLI:** `import 'dotenv/config'` then `getSupabase()` from `lib/supabase.ts` (service role). Tests that hit the DB are integration tests — they need `.env` + network. They create a temp row, assert, and **always clean up** in a `finally`.
- **Migrations:** apply DDL with the Supabase MCP tool `mcp__claude_ai_Supabase_SeondBrain__apply_migration` (name + SQL). Inspect with `mcp__claude_ai_Supabase_SeondBrain__list_tables` / `execute_sql`. Never hardcode UUIDs.
- **Commits:** frequent, one per task. We work on branch `comms-triage-db-app` (created before Task 1). Commit message footer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## File Structure

**New:**
- `comms-assistant/card.ts` — pure `buildCardPayload(item, bundle) → CardPayload` + `CardPayload` type. Shared by `render-triage.ts` and `run.ts` persist.
- `comms-assistant/sweep.ts` — pure `decideSweepAction(state) → 'analyze'|'skip'|'refresh'` + the thin DB wrapper `classifyThreadForSweep(keys)`.
- `comms-assistant/distill.ts` — `loadUndistilledFeedback()` + `markDistilled(ids)` for Flow 2.
- `comms-assistant/__tests__/card.test.ts`, `sweep.test.ts`, `apply-feedback.test.ts`, `upsert-guard.test.ts`, `distill.test.ts`
- `app/src/pages/triage.tsx`, `app/src/components/triage/triage-card.tsx`, `app/src/hooks/use-triage.ts`, `app/src/lib/triage-types.ts`

**Modified:**
- `comms-assistant/types.ts` — `PredictionRow` gains the new columns; add `FeedbackKind`.
- `comms-assistant/store.ts` — `upsertPredictions` guard + new columns; `applyFeedback` (CLI helper, optional); feedback/distill queries.
- `comms-assistant/run.ts` — `itemToRow` sets `card`/`last_message_id`/`captured_at`; new `rules:distill` command.
- `comms-assistant/render-triage.ts` — use `buildCardPayload` (DRY).
- `app/src/App.tsx`, `app/src/components/layout/app-shell.tsx` — route + nav.
- `comms-assistant/CLAUDE.md`, `agents/comms-assistant.md` — app-first flow, skip step 2.5, distill procedure.

---

# Phase 1 — Schema

### Task 1: Enrich `comms_predictions` + create `comms_feedback`

**Files:**
- Migration (via MCP `apply_migration`), name: `comms_triage_app_schema`

- [ ] **Step 1: Inspect current table** so we don't re-add an existing column.

Run the MCP tool `mcp__claude_ai_Supabase_SeondBrain__list_tables` (schemas: `["public"]`) and confirm `comms_predictions` lacks: `card`, `status`, `edited_reply`, `action_accepted`, `overridden_action`, `snooze_until`, `user_touched`, `last_message_id`, `captured_at`. (Verified at design time: it has none of these.)

- [ ] **Step 2: Apply the migration.**

Call `apply_migration` with name `comms_triage_app_schema` and this SQL:

```sql
-- Enrich comms_predictions with presentation payload + feedback state + skip markers.
alter table comms_predictions
  add column if not exists card              jsonb,
  add column if not exists status            text not null default 'open',
  add column if not exists edited_reply      text,
  add column if not exists action_accepted   boolean,
  add column if not exists overridden_action jsonb,
  add column if not exists snooze_until      timestamptz,
  add column if not exists user_touched      boolean not null default false,
  add column if not exists last_message_id   text,
  add column if not exists captured_at       timestamptz;

alter table comms_predictions
  drop constraint if exists comms_predictions_status_check;
alter table comms_predictions
  add constraint comms_predictions_status_check
  check (status in ('open','sent','dismissed','snoozed'));

-- Append-only feedback event log. Never embedded.
create table if not exists comms_feedback (
  id            uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references comms_predictions(id) on delete cascade,
  kind          text not null check (kind in ('edit','action_override','note','status')),
  payload       jsonb not null,
  distilled_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists comms_feedback_prediction_idx on comms_feedback (prediction_id);
create index if not exists comms_feedback_distilled_idx   on comms_feedback (distilled_at);
create index if not exists comms_predictions_status_idx   on comms_predictions (status);
```

- [ ] **Step 3: Verify.**

Run via MCP `execute_sql`:
```sql
select column_name from information_schema.columns
where table_name = 'comms_predictions'
  and column_name in ('card','status','user_touched','last_message_id','captured_at')
order by 1;
select to_regclass('public.comms_feedback') as feedback_table;
```
Expected: 5 column rows + `feedback_table = comms_feedback`.

- [ ] **Step 4: Commit** (the plan + spec are already tracked; this records the migration in history if a SQL mirror exists — otherwise skip if nothing is on disk).

```bash
git add -A && git commit -m "feat(comms): schema — enrich comms_predictions + comms_feedback table"
```

---

### Task 2: `comms_apply_feedback` RPC (atomic, security definer)

**Files:**
- Migration (via MCP `apply_migration`), name: `comms_apply_feedback_rpc`
- Test: `comms-assistant/__tests__/apply-feedback.test.ts`

- [ ] **Step 1: Apply the function.**

`apply_migration` name `comms_apply_feedback_rpc`:

```sql
create or replace function comms_apply_feedback(
  p_prediction_id uuid,
  p_kind          text,
  p_payload       jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('edit','action_override','note','status') then
    raise exception 'invalid kind: %', p_kind;
  end if;

  insert into comms_feedback (prediction_id, kind, payload)
  values (p_prediction_id, p_kind, p_payload);

  if p_kind = 'edit' then
    update comms_predictions
      set edited_reply = p_payload->>'to', user_touched = true
      where id = p_prediction_id;
  elsif p_kind = 'action_override' then
    update comms_predictions
      set action_accepted   = coalesce((p_payload->>'accepted')::boolean, false),
          overridden_action = case when p_payload ? 'to' then p_payload->'to' else overridden_action end,
          user_touched = true
      where id = p_prediction_id;
  elsif p_kind = 'note' then
    update comms_predictions set user_touched = true where id = p_prediction_id;
  elsif p_kind = 'status' then
    update comms_predictions
      set status = p_payload->>'to',
          snooze_until = nullif(p_payload->>'snooze_until','')::timestamptz,
          user_touched = true
      where id = p_prediction_id;
  end if;
end;
$$;
```

- [ ] **Step 2: Write the failing test.**

`comms-assistant/__tests__/apply-feedback.test.ts`:
```ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'

const sb = getSupabase() as any
let predId: string

describe('comms_apply_feedback', () => {
  before(async () => {
    const { data, error } = await sb.from('comms_predictions').insert({
      mode: 'reply', channel: 'email', as_of: new Date().toISOString(),
      context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
      predicted_reply: 'orig draft', action_type: 'reply', action_target: 'sender',
    }).select('id').single()
    if (error) throw error
    predId = data.id
  })
  after(async () => { await sb.from('comms_predictions').delete().eq('id', predId) })

  it('edit sets edited_reply + user_touched + logs event', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'edit', p_payload: { from: 'orig draft', to: 'my edit' },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,user_touched').eq('id', predId).single()
    assert.equal(pred.edited_reply, 'my edit')
    assert.equal(pred.user_touched, true)
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', predId).eq('kind', 'edit')
    assert.equal(fb.length, 1)
    assert.equal(fb[0].payload.to, 'my edit')
  })

  it('status=dismissed sets status', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'status', p_payload: { to: 'dismissed' },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', predId).single()
    assert.equal(pred.status, 'dismissed')
  })

  it('action_override sets accepted=false + overridden_action', async () => {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predId, p_kind: 'action_override',
      p_payload: { accepted: false, to: { type: 'route', target: 'ido-seter' } },
    })
    assert.equal(error, null)
    const { data: pred } = await sb.from('comms_predictions').select('action_accepted,overridden_action').eq('id', predId).single()
    assert.equal(pred.action_accepted, false)
    assert.equal(pred.overridden_action.type, 'route')
  })
})
```

- [ ] **Step 3: Run — expect PASS** (the function exists from Step 1).

Run: `npx tsx --test comms-assistant/__tests__/apply-feedback.test.ts`
Expected: `# pass 3 # fail 0`. (If the function were missing, the RPC call would return a non-null error and the asserts would fail — that's the failing state.)

- [ ] **Step 4: Commit.**

```bash
git add comms-assistant/__tests__/apply-feedback.test.ts && git commit -m "feat(comms): comms_apply_feedback RPC + integration tests"
```

---

### Task 3: RLS policies (anon read/write on the two comms tables)

**Files:**
- Migration (via MCP `apply_migration`), name: `comms_triage_rls`

- [ ] **Step 1: Apply policies.** The app uses the anon key on localhost.

`apply_migration` name `comms_triage_rls`:
```sql
alter table comms_predictions enable row level security;
alter table comms_feedback    enable row level security;

drop policy if exists comms_predictions_anon_rw on comms_predictions;
create policy comms_predictions_anon_rw on comms_predictions
  for all to anon using (true) with check (true);

drop policy if exists comms_feedback_anon_rw on comms_feedback;
create policy comms_feedback_anon_rw on comms_feedback
  for all to anon using (true) with check (true);

grant execute on function comms_apply_feedback(uuid, text, jsonb) to anon;
```

- [ ] **Step 2: Verify the anon path** with a throwaway script (anon key, not service role).

```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && cat > comms-assistant/__tests__/_rls_probe.ts <<'EOF'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!
const sb = createClient(url, anon)
const { data, error } = await sb.from('comms_predictions').select('id,status').eq('status','open').limit(1)
console.log('anon read:', error ? 'ERR '+error.message : `ok (${data?.length} rows)`)
EOF
npx tsx comms-assistant/__tests__/_rls_probe.ts ; rm comms-assistant/__tests__/_rls_probe.ts
```
Expected: `anon read: ok (...)`. If `SUPABASE_ANON_KEY` is not in the root `.env`, read it from `app/.env.local` (`VITE_SUPABASE_ANON_KEY`) — the probe checks both. If neither exists, add `SUPABASE_ANON_KEY` to `.env` from the Supabase dashboard (Settings → API → anon/public key).

- [ ] **Step 3: Commit.**

```bash
git commit --allow-empty -m "feat(comms): RLS — anon rw on comms_predictions + comms_feedback"
```

---

# Phase 2 — Pipeline persist + clobber guard

### Task 4: `card.ts` — pure card-payload builder

**Files:**
- Create: `comms-assistant/card.ts`
- Test: `comms-assistant/__tests__/card.test.ts`

- [ ] **Step 1: Write the failing test.**

`comms-assistant/__tests__/card.test.ts`:
```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCardPayload } from '../card.js'

const bundle = { thread: 'prior msgs', rules: [{ statement: 'be terse' }], participants: [{ name: 'Elad' }], ownership: { x: 1 }, narrative: ['note'], meta: { tier: 2 } } as any

describe('buildCardPayload', () => {
  it('packs email meta, suggestion extras, and serialized context', () => {
    const item = {
      email: { subject: 'Re: KYC', from: 'elad@p.com', date: '2026-06-15', to: ['y@p.com'], excerpt: 'hi', webLink: 'http://x', thread_summary: 'sum' },
      thread: { subject: 'Re: KYC', participants: [], bodyToDate: 'body' },
      suggestion: { memory_brief: { summary: 's', points: ['p'] }, text_alt: 'EN', lang: 'he', lang_alt: 'en', action: { secondary: 'fyi' } },
    }
    const card = buildCardPayload(item, bundle)
    assert.equal(card.email.subject, 'Re: KYC')
    assert.equal(card.email.webLink, 'http://x')
    assert.deepEqual(card.suggestion_extras.memory_brief, { summary: 's', points: ['p'] })
    assert.equal(card.suggestion_extras.text_alt, 'EN')
    assert.equal(card.context.rules[0].statement, 'be terse')
    assert.equal(card.context.participants[0].name, 'Elad')
  })

  it('tolerates a sparse item (no suggestion extras)', () => {
    const card = buildCardPayload({ email: { subject: 'x' }, thread: {} }, bundle)
    assert.equal(card.email.subject, 'x')
    assert.equal(card.suggestion_extras.memory_brief ?? null, null)
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '../card.js'`).

Run: `npx tsx --test comms-assistant/__tests__/card.test.ts`

- [ ] **Step 3: Implement `comms-assistant/card.ts`.**

```ts
// Pure presentation-payload builder. Shared by render-triage.ts (view) and run.ts add-many
// (persist) so a comms_predictions.card is fully reconstructable in the browser — incl. the
// People/Guardrails/Rules context that the retrieval layer (assembleContext) produces server-side.
import type { ContextBundle } from './retrieve.js'

export interface CardPayload {
  email: {
    subject: string | null; from: string | null; date: string | null
    to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
  }
  thread: unknown               // the ThreadInput as captured (subject/participants/mentions/bodyToDate)
  suggestion_extras: {
    memory_brief: unknown | null
    text_alt: string | null; lang: string | null; lang_alt: string | null
    secondary: string | null; sources: unknown | null
  }
  context: {                    // serialized ContextBundle — what the card's collapsible context shows
    thread: string; rules: unknown[]; participants: unknown[]
    ownership: unknown | null; narrative: unknown[]; meta: unknown
  }
}

export function buildCardPayload(item: any, bundle: ContextBundle): CardPayload {
  const e = item?.email ?? {}
  const s = item?.suggestion ?? {}
  const b = (bundle ?? {}) as any
  return {
    email: {
      subject: e.subject ?? null, from: e.from ?? null, date: e.date ?? null,
      to: e.to ?? null, excerpt: e.excerpt ?? null,
      webLink: e.webLink ?? e.web_link ?? null, thread_summary: e.thread_summary ?? null,
    },
    thread: item?.thread ?? null,
    suggestion_extras: {
      memory_brief: s.memory_brief ?? null,
      text_alt: s.text_alt ?? null, lang: s.lang ?? null, lang_alt: s.lang_alt ?? null,
      secondary: s.action?.secondary ?? s.secondary ?? null,
      sources: s.sources ?? null,
    },
    context: {
      thread: b.thread ?? '', rules: b.rules ?? [], participants: b.participants ?? [],
      ownership: b.ownership ?? null, narrative: b.narrative ?? [], meta: b.meta ?? {},
    },
  }
}
```

- [ ] **Step 4: Run — expect PASS.**

Run: `npx tsx --test comms-assistant/__tests__/card.test.ts`
Expected: `# pass 2 # fail 0`.

- [ ] **Step 5: Commit.**

```bash
git add comms-assistant/card.ts comms-assistant/__tests__/card.test.ts && git commit -m "feat(comms): pure buildCardPayload + tests"
```

---

### Task 5: Wire `card` + markers into persist, and reuse builder in render

**Files:**
- Modify: `comms-assistant/types.ts` (PredictionRow new columns + `FeedbackKind`)
- Modify: `comms-assistant/run.ts:52-105` (`itemToRow` + `add-many`)
- Modify: `comms-assistant/render-triage.ts:198-213` (use `buildCardPayload`)

- [ ] **Step 1: Extend `PredictionRow` in `comms-assistant/types.ts`.** Add these fields to the interface (after `verdict?` near line 74):

```ts
  card?: import('./card.js').CardPayload | null
  status?: 'open' | 'sent' | 'dismissed' | 'snoozed'
  edited_reply?: string | null
  action_accepted?: boolean | null
  overridden_action?: { type: string; target: string | null } | null
  snooze_until?: string | null
  user_touched?: boolean
  last_message_id?: string | null
  captured_at?: string | null
```

And add at the end of the file:
```ts
export type FeedbackKind = 'edit' | 'action_override' | 'note' | 'status'
```

- [ ] **Step 2: Make `add-many` compute the bundle + card per item.** In `comms-assistant/run.ts`:

Add import near the top (after the `assembleContext` import line ~20):
```ts
import { buildCardPayload } from './card.js'
```

Change `itemToRow` to be async and accept the bundle. Replace the signature + the return-object tail of `itemToRow` (run.ts:52-80) so it also sets the new columns:
```ts
async function itemToRow(it: any): Promise<PredictionRow> {
  const e = it.email || {}, s = it.suggestion || {}
  const a = s.action || { type: s.disposition ?? null, target: null }
  const chMap: Record<string, string> = { outlook: 'email', teams: 'teams', meeting: 'meeting' }
  const confScore: Record<string, number> = { high: 0.85, med: 0.6, low: 0.35 }
  let bundle: any = { thread: '', rules: [], participants: [], ownership: null, narrative: [], meta: {} }
  try { if (it.thread) bundle = await assembleContext(it.thread) } catch { /* sparse context */ }
  return {
    mode: 'reply',
    thread_id: e.conversation_id ?? e.conversationId ?? null,
    message_id: e.message_id ?? e.id ?? null,
    internet_message_id: e.internet_message_id ?? e.internetMessageId ?? null,
    web_link: e.webLink ?? e.web_link ?? null,
    channel: chMap[e.channel] ?? e.channel ?? 'email',
    as_of: new Date().toISOString(),
    trigger_text: `${e.from ?? '?'} (${e.date ?? '?'}), thread '${e.subject ?? ''}'`,
    disposition: a.type ?? s.disposition ?? null,
    action_type: a.type ?? null,
    action_target: a.target ?? null,
    needs_data: !!s.needs_data,
    predicted_reply: s.text ?? null,
    predicted_stance: a.type ?? null,
    confidence: (s.confidence ?? null) as any,
    confidence_score: confScore[s.confidence] ?? null,
    context_available: { draft_why: s.why ?? null, self_check_passed: it.self_check?.passed ?? null } as any,
    actual_reply: null, delta: null, resolution: null, why: null,
    derived_rule_ids: [],
    sensitive: !!(it.sensitive ?? it.signals?.sensitive),
    tier: it.tier ?? null,
    verdict: it.verdict ?? null,
    card: buildCardPayload(it, bundle),
    status: 'open',
    user_touched: false,
    last_message_id: e.internet_message_id ?? e.internetMessageId ?? null,
    captured_at: new Date().toISOString(),
  }
}
```

In the `predictions:add-many` case (run.ts:91-105) change the mapping to await:
```ts
      const items = payload() as any[]
      const rows = await Promise.all(items.map(itemToRow))
```
(Leave the rest of the summary logging as-is.)

- [ ] **Step 3: Reuse the builder in `render-triage.ts`** so view + persist share one context source (DRY). In `comms-assistant/render-triage.ts` the `main()` loop (lines ~204-211) already computes `b = await assembleContext(items[i].thread)`. No behavior change is required for rendering, but add the import so a follow-on can serialize identically:
```ts
import { buildCardPayload } from './card.js'
```
Then, right after `b` is assigned in the loop, attach the payload for any downstream use:
```ts
      ;(items[i] as any)._card = buildCardPayload(items[i], b)
```
(This keeps render and persist producing the same `card` shape; rendering still uses `b` directly.)

- [ ] **Step 4: Typecheck.**

Run: `npm run typecheck`
Expected: no errors. (If `assembleContext`'s return type doesn't structurally match the `bundle` fallback, cast the fallback `as any` — it already is.)

- [ ] **Step 5: Smoke-test persist end-to-end** with a one-item fixture (writes a real row, then deletes it).

```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && cat > /tmp/one.json <<'EOF'
[{"email":{"subject":"Re: smoke","from":"elad@p.com","date":"2026-06-16","to":["y@p.com"],"excerpt":"hi","webLink":"http://x","conversation_id":"SMOKE-CONV-1","internet_message_id":"SMOKE-MSG-1","channel":"outlook"},
  "thread":{"subject":"Re: smoke","participants":["elad@p.com"],"bodyToDate":"hi"},
  "suggestion":{"action":{"type":"reply","target":"Elad"},"disposition":"reply","text":"ok","confidence":"med","why":"test","memory_brief":"none"}}]
EOF
npm run comms-assistant -- predictions:add-many --payload=/tmp/one.json
```
Expected JSON: `persisted: 1, inserted: 1`. Then verify the card landed + clean up via MCP `execute_sql`:
```sql
select (card->'email'->>'subject') as s, status, last_message_id from comms_predictions where thread_id = 'SMOKE-CONV-1';
delete from comms_predictions where thread_id = 'SMOKE-CONV-1';
```
Expected: one row `s = 'Re: smoke', status = 'open', last_message_id = 'SMOKE-MSG-1'`.

- [ ] **Step 6: Commit.**

```bash
git add comms-assistant/types.ts comms-assistant/run.ts comms-assistant/render-triage.ts && git commit -m "feat(comms): persist full card payload + skip markers; share builder with render"
```

---

### Task 6: `user_touched` clobber-guard in `upsertPredictions`

**Files:**
- Modify: `comms-assistant/store.ts:28-51`
- Test: `comms-assistant/__tests__/upsert-guard.test.ts`

- [ ] **Step 1: Write the failing test.**

`comms-assistant/__tests__/upsert-guard.test.ts`:
```ts
import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { upsertPredictions } from '../store.js'

const sb = getSupabase() as any
const CONV = 'GUARD-TEST-CONV-1'
const base = {
  mode: 'reply' as const, thread_id: CONV, message_id: null, internet_message_id: null, web_link: null,
  channel: 'email', as_of: new Date().toISOString(), trigger_text: null,
  disposition: 'reply', action_type: 'reply', action_target: 'x', needs_data: false,
  predicted_reply: 'first draft', predicted_stance: 'reply', confidence: 'med' as const,
  confidence_score: 0.6, context_available: {} as any, actual_reply: null, delta: null,
  resolution: null, why: null, derived_rule_ids: [], sensitive: false,
}

describe('upsertPredictions clobber guard', () => {
  after(async () => { await sb.from('comms_predictions').delete().eq('thread_id', CONV) })

  it('does NOT overwrite an open user_touched row', async () => {
    await upsertPredictions([{ ...base }])
    await sb.from('comms_predictions').update({ user_touched: true, edited_reply: 'MY EDIT' }).eq('thread_id', CONV)
    const res = await upsertPredictions([{ ...base, predicted_reply: 'SECOND draft' }])
    const { data } = await sb.from('comms_predictions').select('predicted_reply,edited_reply').eq('thread_id', CONV).single()
    assert.equal(data.edited_reply, 'MY EDIT')          // edit preserved
    assert.equal(data.predicted_reply, 'first draft')    // NOT overwritten
    assert.equal(res.updated + res.inserted >= 0, true)  // call succeeds, no throw
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (current upsert overwrites; `predicted_reply` becomes `SECOND draft`).

Run: `npx tsx --test comms-assistant/__tests__/upsert-guard.test.ts`
Expected: FAIL on `predicted_reply` assertion.

- [ ] **Step 3: Add the guard** in `comms-assistant/store.ts`. In `upsertPredictions`, change the existing-row branch (store.ts:34-43) to also fetch `user_touched` and skip the update when touched:

```ts
    let existingId: string | null = null
    let touched = false
    if (keyCol && keyVal) {
      const { data } = await (sb as any)
        .from('comms_predictions').select('id,user_touched').eq(keyCol, keyVal).is('resolution', null).limit(1)
      existingId = (data?.[0] as any)?.id ?? null
      touched = !!(data?.[0] as any)?.user_touched
    }
    if (existingId && touched) {
      // In-app edits win — never clobber a card the user has touched.
      continue
    }
    if (existingId) {
```

(The `continue` is inside the `for (const row of rows)` loop — leaving `inserted`/`updated` unchanged for skipped rows.)

- [ ] **Step 4: Run — expect PASS.**

Run: `npx tsx --test comms-assistant/__tests__/upsert-guard.test.ts`
Expected: `# pass 1 # fail 0`.

- [ ] **Step 5: Commit.**

```bash
git add comms-assistant/store.ts comms-assistant/__tests__/upsert-guard.test.ts && git commit -m "feat(comms): upsertPredictions never clobbers a user_touched card"
```

---

# Phase 3 — The /triage app

### Task 7: App data layer — types + read hook

**Files:**
- Create: `app/src/lib/triage-types.ts`
- Create: `app/src/hooks/use-triage.ts`

- [ ] **Step 1: Add `SUPABASE_ANON_KEY` discoverability.** Confirm `app/.env.local` has `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (verified present at design time). No change if so.

- [ ] **Step 2: Create `app/src/lib/triage-types.ts`.**

```ts
export type TriageStatus = 'open' | 'sent' | 'dismissed' | 'snoozed'
export type FeedbackKind = 'edit' | 'action_override' | 'note' | 'status'

export interface CardEmail {
  subject: string | null; from: string | null; date: string | null
  to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
}
export interface CardContext {
  thread: string; rules: { statement?: string }[]; participants: { name?: string; role?: string }[]
  ownership: unknown | null; narrative: unknown[]; meta: unknown
}
export interface CardPayload {
  email: CardEmail
  thread: unknown
  suggestion_extras: {
    memory_brief: unknown | null
    text_alt: string | null; lang: string | null; lang_alt: string | null
    secondary: string | null; sources: unknown | null
  }
  context: CardContext
}
export interface TriageCard {
  id: string
  channel: string
  action_type: string | null
  action_target: string | null
  predicted_reply: string | null
  edited_reply: string | null
  action_accepted: boolean | null
  confidence: string | null
  why: string | null
  status: TriageStatus
  sensitive: boolean
  card: CardPayload | null
  created_at: string
}
```

- [ ] **Step 3: Create `app/src/hooks/use-triage.ts`.**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TriageCard, FeedbackKind } from '@/lib/triage-types'

const COLS = 'id,channel,action_type,action_target,predicted_reply,edited_reply,action_accepted,confidence,why,status,sensitive,card,created_at'

export function useTriageCards() {
  return useQuery({
    queryKey: ['triage', 'open'],
    queryFn: async (): Promise<TriageCard[]> => {
      const { data, error } = await supabase
        .from('comms_predictions')
        .select(COLS)
        .eq('status', 'open')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as TriageCard[]
    },
  })
}

export function useApplyFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { predictionId: string; kind: FeedbackKind; payload: Record<string, unknown> }) => {
      const { error } = await supabase.rpc('comms_apply_feedback', {
        p_prediction_id: v.predictionId, p_kind: v.kind, p_payload: v.payload,
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['triage'] }) },
  })
}
```

- [ ] **Step 4: Typecheck the app.**

Run: `cd app && npx tsc -b --noEmit && cd ..`
Expected: no errors.

- [ ] **Step 5: Commit.**

```bash
git add app/src/lib/triage-types.ts app/src/hooks/use-triage.ts && git commit -m "feat(app): triage types + read/feedback hooks"
```

---

### Task 8: Triage card component + page + route

**Files:**
- Create: `app/src/components/triage/triage-card.tsx`
- Create: `app/src/pages/triage.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/layout/app-shell.tsx`

- [ ] **Step 1: Create `app/src/components/triage/triage-card.tsx`** (the four interactions; HE⇄EN toggle; collapsible context). Uses existing shadcn primitives from `@/components/ui` — if a primitive is missing, fall back to a plain element.

```tsx
import { useState } from 'react'
import { Mail, MessagesSquare, CalendarDays, ChevronDown } from 'lucide-react'
import type { TriageCard as Card, FeedbackKind } from '@/lib/triage-types'

const channelIcon = (ch: string) => ch === 'teams' ? MessagesSquare : ch === 'meeting' ? CalendarDays : Mail

export function TriageCard({ card, onFeedback }: {
  card: Card
  onFeedback: (kind: FeedbackKind, payload: Record<string, unknown>) => void
}) {
  const extras = card.card?.suggestion_extras
  const baseText = card.edited_reply ?? card.predicted_reply ?? ''
  const [draft, setDraft] = useState(baseText)
  const [note, setNote] = useState('')
  const [showCtx, setShowCtx] = useState(false)
  const [showEN, setShowEN] = useState(false)
  const Icon = channelIcon(card.channel)
  const hasAlt = !!extras?.text_alt
  const shown = showEN && hasAlt ? (extras!.text_alt as string) : draft

  return (
    <div className="rounded-lg border p-4 mb-4 bg-card">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <span className="uppercase tracking-wide">▸ {card.action_type ?? 'none'}</span>
        {card.action_target && <span className="text-muted-foreground">→ {card.action_target}</span>}
        {card.sensitive && <span className="ml-auto text-xs text-red-500">sensitive</span>}
      </div>

      <div className="mt-2 text-sm">
        <div className="font-semibold">{card.card?.email.subject ?? '(no subject)'}</div>
        <div className="text-muted-foreground text-xs">
          {card.card?.email.from} · {card.card?.email.date}
        </div>
        {card.card?.email.excerpt && <p className="mt-1 text-muted-foreground line-clamp-3">{card.card.email.excerpt}</p>}
      </div>

      {card.predicted_reply !== null && (
        <div className="mt-3">
          {hasAlt && (
            <button className="text-xs underline mb-1" onClick={() => setShowEN(s => !s)}>
              {showEN ? 'Show original' : 'Show EN'}
            </button>
          )}
          <textarea
            className="w-full rounded border p-2 text-sm min-h-[120px] font-sans"
            value={shown}
            disabled={showEN && hasAlt}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button className="rounded bg-primary text-primary-foreground px-3 py-1 text-sm"
              onClick={() => onFeedback('edit', { from: baseText, to: draft })}
              disabled={draft === baseText}>Save edit</button>
            <button className="rounded border px-3 py-1 text-sm"
              onClick={() => onFeedback('status', { to: 'sent' })}>Mark sent</button>
            <button className="rounded border px-3 py-1 text-sm"
              onClick={() => onFeedback('status', { to: 'dismissed' })}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button className="rounded border px-3 py-1 text-sm"
          onClick={() => onFeedback('action_override', { accepted: true })}>👍 Action right</button>
        <button className="rounded border px-3 py-1 text-sm"
          onClick={() => {
            const t = window.prompt('Correct action as "type:target" (e.g. route:ido-seter)')
            if (!t) return
            const [type, target] = t.split(':')
            onFeedback('action_override', { accepted: false, to: { type, target: target ?? null } })
          }}>👎 Wrong action</button>
      </div>

      {card.why && <p className="mt-2 text-xs text-muted-foreground italic">{card.why}</p>}

      <div className="mt-3 flex gap-2">
        <input className="flex-1 rounded border p-1 text-sm" placeholder="note…" value={note}
          onChange={(e) => setNote(e.target.value)} />
        <button className="rounded border px-3 py-1 text-sm"
          onClick={() => { if (note.trim()) { onFeedback('note', { text: note.trim() }); setNote('') } }}>Add note</button>
      </div>

      <button className="mt-3 flex items-center gap-1 text-xs text-muted-foreground" onClick={() => setShowCtx(s => !s)}>
        <ChevronDown className="h-3 w-3" /> Context ({card.card?.context.rules.length ?? 0} rules, {card.card?.context.participants.length ?? 0} people)
      </button>
      {showCtx && (
        <div className="mt-2 text-xs space-y-1">
          {card.card?.context.rules.map((r, i) => <div key={i}>• {r.statement}</div>)}
          {card.card?.context.participants.map((p, i) => <div key={i} className="text-muted-foreground">{p.name} {p.role ? `— ${p.role}` : ''}</div>)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/src/pages/triage.tsx`.**

```tsx
import { useTriageCards, useApplyFeedback } from '@/hooks/use-triage'
import { TriageCard } from '@/components/triage/triage-card'

export function TriagePage() {
  const { data: cards, isLoading, error } = useTriageCards()
  const apply = useApplyFeedback()

  if (isLoading) return <div className="p-6">Loading triage…</div>
  if (error) return <div className="p-6 text-red-500">Error: {(error as Error).message}</div>
  if (!cards?.length) return <div className="p-6 text-muted-foreground">Inbox clear — no open cards.</div>

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Triage — {cards.length} open</h1>
      {cards.map((c) => (
        <TriageCard key={c.id} card={c}
          onFeedback={(kind, payload) => apply.mutate({ predictionId: c.id, kind, payload })} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Register the route in `app/src/App.tsx`.** Add the import and the `<Route>`:
```tsx
import { TriagePage } from "@/pages/triage"
```
```tsx
            <Route path="/triage" element={<TriagePage />} />
```
(Place the `<Route>` next to the others, inside the `<Route element={<AppShell />}>` group.)

- [ ] **Step 4: Add the nav entry.** Open `app/src/components/layout/app-shell.tsx`, find the nav-items array (the other routes like `/initiatives`, `/people`), and add an entry following the exact same shape used there, e.g.:
```tsx
{ to: "/triage", label: "Triage", icon: Inbox },
```
Import `Inbox` from `lucide-react` alongside the existing icon imports. (Match the file's existing item structure — if it uses a different key name than `to`/`label`/`icon`, mirror that.)

- [ ] **Step 5: Typecheck + build the app.**

Run: `cd app && npx tsc -b --noEmit && npm run build && cd ..`
Expected: build succeeds.

- [ ] **Step 6: Manual verification.** Seed one open card (reuse the `/tmp/one.json` smoke fixture from Task 5 Step 5 — `predictions:add-many`, but DON'T delete it). Then:

```bash
cd app && npm run dev
```
Open the printed localhost URL → `/triage`. Confirm: the card shows ▸ REPLY → Elad, subject "Re: smoke", an editable draft. Test each control and confirm via MCP `execute_sql` after each:
- Edit draft → Save edit → `select edited_reply, user_touched from comms_predictions where thread_id='SMOKE-CONV-1'` → edited text + `user_touched=true`; `select kind,payload from comms_feedback` → one `edit` row.
- 👎 Wrong action → enter `route:ido-seter` → `action_accepted=false`, `overridden_action->>'type'='route'`.
- Add note → a `note` row in `comms_feedback`.
- Dismiss → row leaves the queue (`status='dismissed'`); the card disappears on refetch.

Then clean up: `delete from comms_predictions where thread_id='SMOKE-CONV-1';` (cascade clears feedback).

- [ ] **Step 7: Commit.**

```bash
git add app/src && git commit -m "feat(app): /triage page — card with edit/action/note/status feedback"
```

---

# Phase 4 — Skip / refresh policy

### Task 9: `decideSweepAction` (pure) + `classifyThreadForSweep` (DB)

**Files:**
- Create: `comms-assistant/sweep.ts`
- Test: `comms-assistant/__tests__/sweep.test.ts`

- [ ] **Step 1: Write the failing test** (pure decision logic only).

`comms-assistant/__tests__/sweep.test.ts`:
```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { decideSweepAction } from '../sweep.js'

describe('decideSweepAction', () => {
  it('no open row → analyze', () => {
    assert.equal(decideSweepAction({ exists: false }, 'm1'), 'analyze')
  })
  it('open + user_touched → skip', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: true, lastMessageId: 'm1' }, 'm2'), 'skip')
  })
  it('open + same latest message → skip', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, 'm1'), 'skip')
  })
  it('open + new inbound → refresh', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, 'm2'), 'refresh')
  })
  it('open + new inbound but missing latest id → skip (cannot prove advance)', () => {
    assert.equal(decideSweepAction({ exists: true, userTouched: false, lastMessageId: 'm1' }, null), 'skip')
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '../sweep.js'`).

Run: `npx tsx --test comms-assistant/__tests__/sweep.test.ts`

- [ ] **Step 3: Implement `comms-assistant/sweep.ts`.**

```ts
// Skip/refresh decision for the unread sweep — runs BEFORE any MSFT read or fan-out.
// Reconciled rows (resolution set) are never returned here; the caller queries open rows only.
import type { SweepAction } from './types.js'

export interface ThreadSweepState {
  exists: boolean
  userTouched?: boolean
  lastMessageId?: string | null
}

export function decideSweepAction(state: ThreadSweepState, latestMessageId: string | null): SweepAction {
  if (!state.exists) return 'analyze'
  if (state.userTouched) return 'skip'            // in-app edits win — never regenerate
  if (!latestMessageId) return 'skip'             // can't prove the thread advanced → don't churn
  if (latestMessageId === state.lastMessageId) return 'skip'
  return 'refresh'                                // new inbound since capture
}

// Thin DB wrapper: look up the open row for a thread and decide.
export async function classifyThreadForSweep(
  keys: { conversationId?: string | null; internetMessageId?: string | null; latestMessageId: string | null },
): Promise<SweepAction> {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  const sb = getSupabase() as any
  const keyCol = keys.conversationId ? 'thread_id' : keys.internetMessageId ? 'internet_message_id' : null
  const keyVal = keys.conversationId ?? keys.internetMessageId ?? null
  if (!keyCol || !keyVal) return 'analyze'
  const { data } = await sb.from('comms_predictions')
    .select('id,user_touched,last_message_id').eq(keyCol, keyVal).is('resolution', null).limit(1)
  const row = data?.[0]
  return decideSweepAction(
    { exists: !!row, userTouched: !!row?.user_touched, lastMessageId: row?.last_message_id ?? null },
    keys.latestMessageId,
  )
}
```

- [ ] **Step 4: Add the `SweepAction` type** to `comms-assistant/types.ts`:
```ts
export type SweepAction = 'analyze' | 'skip' | 'refresh'
```

- [ ] **Step 5: Run — expect PASS.**

Run: `npx tsx --test comms-assistant/__tests__/sweep.test.ts`
Expected: `# pass 5 # fail 0`.

- [ ] **Step 6: Commit.**

```bash
git add comms-assistant/sweep.ts comms-assistant/types.ts comms-assistant/__tests__/sweep.test.ts && git commit -m "feat(comms): skip/refresh sweep policy (pure decision + DB wrapper)"
```

---

# Phase 5 — Distill (Flow 2)

### Task 10: `distill.ts` + `rules:distill` command

**Files:**
- Create: `comms-assistant/distill.ts`
- Modify: `comms-assistant/run.ts` (add `rules:distill` case + header comment)
- Test: `comms-assistant/__tests__/distill.test.ts`

- [ ] **Step 1: Implement `comms-assistant/distill.ts`.**

```ts
// Flow 2 — pull undistilled in-app feedback joined to its prediction, so the Claude session can
// cluster patterns (scope + suggestion-vs-yours delta) and propose comms_rules. On-demand,
// Claude-in-the-loop with approval. Stamps distilled_at so the next run sees only new signal.
async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

export interface DistillItem {
  feedback_id: string
  kind: string
  payload: Record<string, unknown>
  created_at: string
  prediction: {
    id: string
    action_type: string | null
    action_target: string | null
    predicted_reply: string | null
    edited_reply: string | null
    overridden_action: unknown | null
    scope: { participants?: unknown[]; rules?: unknown[] } | null
  }
}

export async function loadUndistilledFeedback(): Promise<DistillItem[]> {
  const sb = await db()
  const { data, error } = await sb
    .from('comms_feedback')
    .select('id,kind,payload,created_at,prediction_id,comms_predictions(id,action_type,action_target,predicted_reply,edited_reply,overridden_action,card)')
    .is('distilled_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    feedback_id: r.id, kind: r.kind, payload: r.payload, created_at: r.created_at,
    prediction: {
      id: r.comms_predictions?.id,
      action_type: r.comms_predictions?.action_type ?? null,
      action_target: r.comms_predictions?.action_target ?? null,
      predicted_reply: r.comms_predictions?.predicted_reply ?? null,
      edited_reply: r.comms_predictions?.edited_reply ?? null,
      overridden_action: r.comms_predictions?.overridden_action ?? null,
      scope: r.comms_predictions?.card?.context
        ? { participants: r.comms_predictions.card.context.participants, rules: r.comms_predictions.card.context.rules }
        : null,
    },
  }))
}

export async function markDistilled(feedbackIds: string[]): Promise<number> {
  if (!feedbackIds.length) return 0
  const sb = await db()
  const { error, count } = await sb
    .from('comms_feedback')
    .update({ distilled_at: new Date().toISOString() }, { count: 'exact' })
    .in('id', feedbackIds).is('distilled_at', null)
  if (error) throw error
  return count ?? 0
}
```

- [ ] **Step 2: Add the `rules:distill` command to `comms-assistant/run.ts`.** Add imports:
```ts
import { loadUndistilledFeedback, markDistilled } from './distill.js'
```
Add a case in the `switch` (next to the other `rules:` cases):
```ts
    case 'rules:distill': {
      // Flow 2: emit undistilled in-app feedback for the Claude session to cluster → propose rules.
      // After the session adds rules (rules:add/supersede) it stamps the processed feedback:
      //   rules:distill --mark='<comma-separated feedback ids>'
      const mark = arg('mark')
      if (mark) {
        const n = await markDistilled(mark.split(',').map((s) => s.trim()).filter(Boolean))
        console.log(JSON.stringify({ marked: n }))
        break
      }
      const items = await loadUndistilledFeedback()
      console.log(JSON.stringify({ count: items.length, items }, null, 2))
      break
    }
```
Also add `rules:distill` to the header-comment usage block (run.ts:10-13).

- [ ] **Step 3: Write the test** (integration: seed prediction + feedback, load, mark, confirm idempotent).

`comms-assistant/__tests__/distill.test.ts`:
```ts
import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { loadUndistilledFeedback, markDistilled } from '../distill.js'

const sb = getSupabase() as any
const CONV = 'DISTILL-TEST-CONV-1'
let predId = ''; let fbId = ''

describe('distill load + mark', () => {
  after(async () => { await sb.from('comms_predictions').delete().eq('thread_id', CONV) })

  it('loads undistilled feedback with prediction scope, then marks it', async () => {
    const { data: p } = await sb.from('comms_predictions').insert({
      mode: 'reply', channel: 'email', as_of: new Date().toISOString(), thread_id: CONV,
      context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
      action_type: 'reply', action_target: 'Elad', predicted_reply: 'orig',
      card: { context: { participants: [{ name: 'Elad' }], rules: [] } },
    }).select('id').single()
    predId = p.id
    const { data: f } = await sb.from('comms_feedback').insert({
      prediction_id: predId, kind: 'edit', payload: { from: 'orig', to: 'edited' },
    }).select('id').single()
    fbId = f.id

    const items = await loadUndistilledFeedback()
    const mine = items.find((i) => i.feedback_id === fbId)
    assert.ok(mine, 'loaded our feedback')
    assert.equal(mine!.prediction.action_target, 'Elad')
    assert.equal((mine!.prediction.scope as any).participants[0].name, 'Elad')

    const n = await markDistilled([fbId])
    assert.equal(n, 1)
    const again = await loadUndistilledFeedback()
    assert.equal(again.find((i) => i.feedback_id === fbId), undefined)  // no longer undistilled
    assert.equal(await markDistilled([fbId]), 0)                         // idempotent
  })
})
```

- [ ] **Step 4: Run — expect PASS.**

Run: `npx tsx --test comms-assistant/__tests__/distill.test.ts`
Expected: `# pass 1 # fail 0`.

- [ ] **Step 5: Commit.**

```bash
git add comms-assistant/distill.ts comms-assistant/run.ts comms-assistant/__tests__/distill.test.ts && git commit -m "feat(comms): rules:distill — load/mark in-app feedback for interactive distillation"
```

---

# Phase 6 — Docs

### Task 11: Update the agent docs to the app-first flow

**Files:**
- Modify: `comms-assistant/CLAUDE.md`
- Modify: `agents/comms-assistant.md`

- [ ] **Step 1: In `comms-assistant/CLAUDE.md`,** update the triage procedure:
  - Step 6 (render HTML): mark **optional** — "the `/triage` app (Supabase-backed) is the primary review surface; `render-triage.ts` HTML stays as a fallback/export."
  - Add **Step 2.5 — skip/refresh check:** before capture, call `classifyThreadForSweep({conversationId, internetMessageId, latestMessageId})` per candidate; drop `skip`, capture `analyze`/`refresh`; surface the analyze/skip/refresh breakdown (no silent truncation).
  - Step 7 (persist): note it now writes the full `card` payload + `last_message_id` + `captured_at`, and that `upsertPredictions` never clobbers a `user_touched` card.
  - Add a **Flow 2 (learn)** line: "`npm run comms-assistant -- rules:distill` emits undistilled in-app feedback; the session clusters + asks clarifying questions + proposes `rules:add`/`supersede`; then `rules:distill --mark=<ids>` stamps them."
  - Files list: add `card.ts`, `sweep.ts`, `distill.ts`.

- [ ] **Step 2: In `agents/comms-assistant.md`,** update the "Pass B" section (line ~63) and the "Still to build" line (~96):
  - State that **in-app feedback (`comms_feedback`) is now the primary learning signal**, consumed by the on-demand `rules:distill` pass (Flow 2).
  - State that **Pass B / Sent-Items reconcile is demoted** to a secondary fallback for *out-of-band sends only* and is **not built**; when built, it must treat `comms_feedback` as primary and `actual_reply` as secondary corroboration.
  - Add the `/triage` app + the two-flow architecture pointer to the spec.

- [ ] **Step 3: Verify no stale "render HTML is the surface" claims** remain:
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && grep -niE "render-triage|html" comms-assistant/CLAUDE.md agents/comms-assistant.md
```
Confirm each remaining mention frames HTML as fallback, not primary.

- [ ] **Step 4: Commit.**

```bash
git add comms-assistant/CLAUDE.md agents/comms-assistant.md && git commit -m "docs(comms): app-first triage flow, skip step, demoted Pass B, distill"
```

---

## Final verification

- [ ] **Run the full comms test suite:**

Run: `for f in comms-assistant/__tests__/*.test.ts; do echo "== $f =="; npx tsx --test "$f"; done`
Expected: every file `# fail 0`.

- [ ] **Typecheck both projects:**

Run: `npm run typecheck && (cd app && npx tsc -b --noEmit)`
Expected: no errors.

- [ ] **Confirm no test rows linger:**

MCP `execute_sql`: `select count(*) from comms_predictions where thread_id like '%TEST%' or thread_id like 'SMOKE%';`
Expected: `0`.

---

## Self-review notes (author)

- **Spec coverage:** Phase 1 = data model (predictions enrich + comms_feedback + RPC + RLS + distilled_at). Phase 2 = persist card+markers + clobber guard. Phase 3 = /triage app with all four interactions. Phase 4 = skip/refresh. Phase 5 = distill. Phase 6 = docs + Pass B demotion seam note. All spec sections map to a task.
- **DB integration tests** (apply-feedback, upsert-guard, distill) require `.env` + network; they self-clean in `after`/`finally`. The pure logic (card, sweep) is unit-tested without DB.
- **Type consistency:** `CardPayload` defined once in `card.ts` (CLI) and mirrored in `app/src/lib/triage-types.ts` (browser, no cross-package import). `SweepAction`, `FeedbackKind` in `types.ts`. RPC param names `p_prediction_id/p_kind/p_payload` consistent between SQL, the test, and the hook.
