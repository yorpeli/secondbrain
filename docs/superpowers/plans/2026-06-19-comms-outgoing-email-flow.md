# Comms Outgoing Email Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversation-triggered outgoing ("initiated") email flow to the comms-assistant — gather → draft in voice → adaptive verify → approve in chat → push an Outlook draft via the bridge → persist as `mode:'initiated'` and feed the rules/learning loop, plus a contact-learning loop.

**Architecture:** Composition over existing parts. New code is four small modules — a localhost-bridge push client, a contact resolve/learn module, an initiated-row builder + recorder, and three thin CLI subcommands — plus docs/prompt updates. Gathering reuses `assembleContext`; the draft is authored by the conversation agent applying the `comms_rules` spine; high-stakes drafts get fresh/blind adversarial verifiers dispatched by the agent; the approve-time edit diff lands in `comms_feedback` via the existing `comms_apply_feedback` RPC, which `rules:distill` already consumes.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), `tsx`, Node's built-in test runner (`node --import tsx --test`), Supabase (`@supabase/supabase-js`, service role, lazy import), the existing local Outlook bridge (`127.0.0.1:7777`, `osascript`, Legacy Outlook).

## Global Constraints

- **Read-only channel — never send.** The bridge only opens a reviewable draft (`/draft mode:'fresh'`); Yonatan sends from Outlook. No new mailbox write.
- **No DDL.** `comms_predictions.mode` already allows `'initiated'`; `.status` already allows `'sent'` (verified against live CHECK constraints). External contacts live in `context_store` key `comms_contacts` (key-value, no schema change).
- **Never embedded.** `comms_predictions` / `comms_rules` / `comms_feedback` are never embedded — do not add them to any embedding flow.
- **Never hardcode UUIDs.** Resolve people by `slug` / `name ILIKE`. Yonatan's slug is `yonatan-orpeli`.
- **Lazy Supabase import** inside an async `db()` helper (match `store.ts` / `distill.ts`), so non-DB modules don't fail at load.
- **Tests run with** `node --import tsx --test <file>`. DB-backed tests insert → assert → clean up (mirror `comms-assistant/__tests__/apply-feedback.test.ts`).
- **ESM import specifiers end in `.js`** even for `.ts` sources (the repo's convention).
- **Feedback kinds** are exactly `edit | action_override | note | status` (RPC raises on others). Use `edit` for an edited approval, `note` for a verbatim approval.

---

## File Structure

**New files:**
- `comms-assistant/outlook-bridge/push-client.ts` — `pushFreshDraft()`: POST a fresh-compose `DraftRequest` to the local bridge. One responsibility: HTTP push to the bridge.
- `comms-assistant/outlook-bridge/__tests__/push-client.test.ts` — push-client tests (injected `fetchFn`, no network).
- `comms-assistant/contacts.ts` — recipient resolution + contact learning: `contactBackfillDecision()` (pure), `resolveRecipient()`, `upsertExternalContact()`, `backfillPersonEmail()`.
- `comms-assistant/__tests__/contacts.test.ts` — pure decision test (no DB) + `comms_contacts` round-trip (DB, cleaned up).
- `comms-assistant/initiated.ts` — `buildInitiatedRow()` (maps an `InitiatedInput` to a `PredictionRow`) + `recordInitiated()` (insert + log the approve-time feedback).
- `comms-assistant/__tests__/initiated.test.ts` — `buildInitiatedRow` shape (pure) + `recordInitiated` round-trip (DB, cleaned up).

**Modified files:**
- `comms-assistant/run.ts` — add CLI subcommands `send-initiated`, `contacts:resolve`, `contacts:learn`.
- `comms-assistant/prompts/prediction-subagent.md` — add an *Initiated (outgoing) mode* section.
- `comms-assistant/CLAUDE.md` — add the Outgoing flow procedure + new commands to the Files list.
- `agents/comms-assistant.md` — add the NL-trigger + the outgoing procedure.
- `CLAUDE.md` (project root) — add a row to the comms-assistant NL-trigger table.
- `comms-assistant/agent-arch.md` — note the outgoing flow (one paragraph + file-map rows).
- `comms-assistant/outlook-bridge/README.md` — note `push-client.ts` as a non-app caller of `/draft`.

**Out of scope (deliberate, not gaps):** the `/triage` React app gets no new view in v1 — the initiated row is persisted (visible to the app's data layer) but a dedicated "sent history" UI is a follow-up. Teams-initiated sends are out (bridge is Outlook-only). A later Sent-Items reconcile is not built (the approve-time diff is the primary signal).

---

### Task 1: Bridge push client (`pushFreshDraft`)

A tiny client that POSTs a fresh-compose `DraftRequest` to the local bridge. The bridge route, token gate, and validator already exist (`outlook-bridge/server.ts`, `draft-request.ts`); this is the terminal-side caller the conversation agent uses (the app has its own caller in `app/src/`).

**Files:**
- Create: `comms-assistant/outlook-bridge/push-client.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/push-client.test.ts`

**Interfaces:**
- Consumes: the bridge `POST /draft` contract — body `{mode:'fresh', to:string[], subject:string, body:string}`, header `x-bridge-token`, success `{ok:true, mode:'fresh'}`.
- Produces:
  - `interface FreshDraft { to: string[]; subject: string; body: string }`
  - `interface PushOptions { url?: string; token?: string; fetchFn?: typeof fetch }`
  - `interface PushResult { ok: boolean; error?: string }`
  - `async function pushFreshDraft(draft: FreshDraft, opts?: PushOptions): Promise<PushResult>`

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/push-client.test.ts`:

```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pushFreshDraft } from '../push-client.js'

function fakeFetch(captured: any[], response: { status: number; body: any }) {
  return async (url: any, init: any) => {
    captured.push({ url, init })
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.body,
    } as any
  }
}

describe('pushFreshDraft', () => {
  it('POSTs a fresh draft with the token header and returns ok', async () => {
    const captured: any[] = []
    const res = await pushFreshDraft(
      { to: ['elad@payoneer.com'], subject: 'India timeline', body: 'Hi Elad —\n\nQuick note.' },
      { url: 'http://127.0.0.1:7777', token: 'secret', fetchFn: fakeFetch(captured, { status: 200, body: { ok: true, mode: 'fresh' } }) },
    )
    assert.equal(res.ok, true)
    assert.equal(captured.length, 1)
    assert.equal(captured[0].url, 'http://127.0.0.1:7777/draft')
    assert.equal(captured[0].init.headers['x-bridge-token'], 'secret')
    const sent = JSON.parse(captured[0].init.body)
    assert.equal(sent.mode, 'fresh')
    assert.deepEqual(sent.to, ['elad@payoneer.com'])
    assert.equal(sent.subject, 'India timeline')
  })

  it('returns ok:false with the bridge error message on non-2xx', async () => {
    const res = await pushFreshDraft(
      { to: ['x@y.com'], subject: 's', body: 'b' },
      { token: 't', fetchFn: fakeFetch([], { status: 401, body: { ok: false, error: 'bad or missing token' } }) },
    )
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /token/)
  })

  it('returns ok:false (bridge down) when fetch throws', async () => {
    const res = await pushFreshDraft(
      { to: ['x@y.com'], subject: 's', body: 'b' },
      { token: 't', fetchFn: async () => { throw new Error('ECONNREFUSED') } },
    )
    assert.equal(res.ok, false)
    assert.match(res.error ?? '', /ECONNREFUSED|bridge/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/push-client.test.ts`
Expected: FAIL — `Cannot find module '../push-client.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `comms-assistant/outlook-bridge/push-client.ts`:

```ts
// Terminal-side caller for the local Outlook bridge's POST /draft (fresh compose).
// Used by the conversation agent's outgoing flow (`run.ts send-initiated`). The /triage
// app has its own caller in app/src/lib/draft-request.ts — this is the Node equivalent.
// Never sends: the bridge only opens a reviewable Outlook compose window.

export interface FreshDraft {
  to: string[]
  subject: string
  body: string
}

export interface PushOptions {
  url?: string
  token?: string
  fetchFn?: typeof fetch
}

export interface PushResult {
  ok: boolean
  error?: string
}

export async function pushFreshDraft(draft: FreshDraft, opts: PushOptions = {}): Promise<PushResult> {
  const url = opts.url ?? process.env.OUTLOOK_BRIDGE_URL ?? 'http://127.0.0.1:7777'
  const token = opts.token ?? process.env.OUTLOOK_BRIDGE_TOKEN ?? ''
  const doFetch = opts.fetchFn ?? fetch
  try {
    const res = await doFetch(`${url}/draft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bridge-token': token },
      body: JSON.stringify({ mode: 'fresh', to: draft.to, subject: draft.subject, body: draft.body }),
    })
    if (!res.ok) {
      let msg = `bridge returned ${res.status}`
      try { const j: any = await res.json(); if (j?.error) msg = j.error } catch { /* keep status msg */ }
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: `bridge unreachable: ${(e as Error).message}` }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/push-client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/push-client.ts comms-assistant/outlook-bridge/__tests__/push-client.test.ts
git commit -m "feat(comms): bridge push-client for fresh outgoing drafts"
```

---

### Task 2: Contact resolution & learning (`contacts.ts`)

Resolve a recipient name/email to `{slug?, name?, email?}` from `people` (T1) or `context_store.comms_contacts`; learn a newly-supplied address back into our systems so we never re-ask. The fill-vs-confirm-vs-noop logic is a pure function (testable without mutating production `people` rows); the writes are thin.

**Files:**
- Create: `comms-assistant/contacts.ts`
- Test: `comms-assistant/__tests__/contacts.test.ts`

**Interfaces:**
- Consumes: `lib/supabase.ts` `getSupabase()`; `people` (`slug, name, email, status`); `context_store` (`key, content`).
- Produces:
  - `type BackfillDecision = 'fill' | 'confirm' | 'noop'`
  - `function contactBackfillDecision(existingEmail: string | null | undefined, incomingEmail: string): BackfillDecision`
  - `interface ResolvedRecipient { slug?: string; name?: string; email?: string; source: 'people' | 'contacts' | 'unknown' }`
  - `async function resolveRecipient(query: string): Promise<ResolvedRecipient>`
  - `async function upsertExternalContact(c: { name: string; email: string }): Promise<void>`
  - `async function backfillPersonEmail(slug: string, email: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/__tests__/contacts.test.ts`:

```ts
import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { contactBackfillDecision, resolveRecipient, upsertExternalContact } from '../contacts.js'

describe('contactBackfillDecision (pure)', () => {
  it('fills when no existing email', () => {
    assert.equal(contactBackfillDecision(null, 'a@b.com'), 'fill')
    assert.equal(contactBackfillDecision('', 'a@b.com'), 'fill')
    assert.equal(contactBackfillDecision(undefined, 'a@b.com'), 'fill')
  })
  it('noop when identical (case/space-insensitive)', () => {
    assert.equal(contactBackfillDecision('a@b.com', 'a@b.com'), 'noop')
    assert.equal(contactBackfillDecision('A@B.com ', 'a@b.com'), 'noop')
  })
  it('confirms when different', () => {
    assert.equal(contactBackfillDecision('old@b.com', 'new@b.com'), 'confirm')
  })
})

describe('comms_contacts round-trip (DB)', () => {
  const sb = getSupabase() as any
  const testName = 'ZZ Plan Test Vendor'
  after(async () => {
    // restore comms_contacts to whatever it was minus our test entry
    const { data } = await sb.from('context_store').select('content').eq('key', 'comms_contacts').single()
    const list = (data?.content?.contacts ?? []).filter((c: any) => c.name !== testName)
    await sb.from('context_store').update({ content: { contacts: list } }).eq('key', 'comms_contacts')
  })

  it('upsert then resolve returns the external contact', async () => {
    await upsertExternalContact({ name: testName, email: 'vendor@example.com' })
    const r = await resolveRecipient(testName)
    assert.equal(r.source, 'contacts')
    assert.equal(r.email, 'vendor@example.com')
  })

  it('resolves a known person from people by name', async () => {
    const r = await resolveRecipient('Yonatan')
    assert.equal(r.source, 'people')
    assert.equal(r.slug, 'yonatan-orpeli')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/__tests__/contacts.test.ts`
Expected: FAIL — `Cannot find module '../contacts.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `comms-assistant/contacts.ts`:

```ts
// Recipient resolution + contact learning for the outgoing flow.
// Resolve order: people (T1) → context_store.comms_contacts → unknown (ask).
// Learn: backfill people.email when empty; confirm before overwriting a different value;
// externals (not in people) go to context_store.comms_contacts. NEVER embedded.
async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

export type BackfillDecision = 'fill' | 'confirm' | 'noop'

// Pure: decide what to do with a newly-supplied address given what's on record.
export function contactBackfillDecision(existingEmail: string | null | undefined, incomingEmail: string): BackfillDecision {
  if (!norm(existingEmail)) return 'fill'
  if (norm(existingEmail) === norm(incomingEmail)) return 'noop'
  return 'confirm'
}

export interface ResolvedRecipient {
  slug?: string
  name?: string
  email?: string
  source: 'people' | 'contacts' | 'unknown'
}

interface ContactsDoc { contacts: { name: string; email: string; learned_at?: string; source?: string }[] }

async function readContacts(sb: any): Promise<ContactsDoc> {
  const { data } = await sb.from('context_store').select('content').eq('key', 'comms_contacts').maybeSingle()
  const content = data?.content
  return content && Array.isArray(content.contacts) ? content : { contacts: [] }
}

export async function resolveRecipient(query: string): Promise<ResolvedRecipient> {
  const sb = await db()
  const q = query.trim()
  // 1) people — exact email, exact slug, or fuzzy name (active only)
  const isEmail = q.includes('@')
  let person: any = null
  if (isEmail) {
    const { data } = await sb.from('people').select('slug,name,email').eq('email', q).limit(1)
    person = data?.[0] ?? null
  } else {
    const { data: bySlug } = await sb.from('people').select('slug,name,email').eq('slug', q).limit(1)
    person = bySlug?.[0] ?? null
    if (!person) {
      const { data: byName } = await sb.from('people').select('slug,name,email').ilike('name', `%${q}%`).eq('status', 'active').limit(1)
      person = byName?.[0] ?? null
    }
  }
  if (person) return { slug: person.slug, name: person.name, email: person.email ?? undefined, source: 'people' }

  // 2) external contacts in context_store
  const doc = await readContacts(sb)
  const hit = doc.contacts.find((c) => norm(c.name) === norm(q) || norm(c.email) === norm(q))
  if (hit) return { name: hit.name, email: hit.email, source: 'contacts' }

  // 3) unknown — caller asks Yonatan once, then calls upsertExternalContact / backfillPersonEmail
  return { source: 'unknown', ...(isEmail ? { email: q } : { name: q }) }
}

export async function upsertExternalContact(c: { name: string; email: string }): Promise<void> {
  const sb = await db()
  const doc = await readContacts(sb)
  const rest = doc.contacts.filter((x) => norm(x.name) !== norm(c.name))
  rest.push({ name: c.name, email: c.email, learned_at: new Date().toISOString().slice(0, 10), source: 'outgoing-email' })
  // upsert the single key-value row
  const { error } = await sb.from('context_store').upsert({ key: 'comms_contacts', content: { contacts: rest } }, { onConflict: 'key' })
  if (error) throw error
}

export async function backfillPersonEmail(slug: string, email: string): Promise<void> {
  const sb = await db()
  const { error } = await sb.from('people').update({ email, updated_at: new Date().toISOString() }).eq('slug', slug)
  if (error) throw error
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/__tests__/contacts.test.ts`
Expected: PASS (5 tests). If the `context_store` upsert errors on `onConflict`, confirm `context_store.key` is unique (it is the PK) — the `onConflict:'key'` is correct.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/contacts.ts comms-assistant/__tests__/contacts.test.ts
git commit -m "feat(comms): recipient resolution + contact-learning (people.email / comms_contacts)"
```

---

### Task 3: Initiated row builder + recorder (`initiated.ts`)

Map an `InitiatedInput` (recipient, subject, draft, approved text, the conversation brief, grounding, tier/verdict) to a `comms_predictions` row with `mode:'initiated'`, and record the approve-time signal to `comms_feedback` via the existing RPC.

**Files:**
- Create: `comms-assistant/initiated.ts`
- Test: `comms-assistant/__tests__/initiated.test.ts`

**Interfaces:**
- Consumes: `types.ts` `PredictionRow`; `retrieve.ts` `assembleContext`/`ThreadInput`; `card.ts` `buildCardPayload`; `delta.ts` `structuralDelta`; `store.ts` `insertPrediction`; the `comms_apply_feedback` RPC (`p_prediction_id`, `p_kind`, `p_payload`).
- Produces:
  - `interface InitiatedInput { recipient: { email: string; name?: string; slug?: string }; subject: string; draft: string; approved: string; trigger_text: string; action_type?: string; action_target?: string | null; thread?: ThreadInput; tier?: number | null; verdict?: Record<string, unknown> | null; confidence?: 'high' | 'med' | 'low' | null; why?: string | null; memory_brief?: unknown; sensitive?: boolean }`
  - `async function buildInitiatedRow(input: InitiatedInput): Promise<PredictionRow>`
  - `interface RecordResult { predictionId: string; signal: 'edit' | 'verbatim' }`
  - `async function recordInitiated(input: InitiatedInput): Promise<RecordResult>`

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/__tests__/initiated.test.ts`:

```ts
import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'
import { buildInitiatedRow, recordInitiated, type InitiatedInput } from '../initiated.js'

const base: InitiatedInput = {
  recipient: { email: 'elad@payoneer.com', name: 'Elad Schnarch', slug: 'elad-schnarch' },
  subject: 'India licensing timeline',
  draft: 'Hi Elad —\n\nWhat is the realistic date?',
  approved: 'Hi Elad —\n\nWhat is the realistic date?',
  trigger_text: 'We discussed the India licensing slip and need Elad to commit a date.',
  confidence: 'med',
  why: 'Probe the mechanism, terse.',
}

describe('buildInitiatedRow (pure, no thread → no DB)', () => {
  it('produces an initiated/sent row carrying the draft + trigger', async () => {
    const row = await buildInitiatedRow(base)
    assert.equal(row.mode, 'initiated')
    assert.equal(row.status, 'sent')
    assert.equal(row.channel, 'email')
    assert.equal(row.predicted_reply, base.draft)
    assert.equal(row.trigger_text, base.trigger_text)
    assert.equal(row.action_type, 'reply')
    assert.equal(row.action_target, 'elad-schnarch')
    assert.equal(row.thread_id, null)
    assert.equal(row.confidence, 'med')
    assert.ok(row.card)
  })
  it('defaults action_target to the email when no slug/name', async () => {
    const row = await buildInitiatedRow({ ...base, recipient: { email: 'x@y.com' } })
    assert.equal(row.action_target, 'x@y.com')
  })
})

describe('recordInitiated (DB)', () => {
  const sb = getSupabase() as any
  const ids: string[] = []
  after(async () => {
    for (const id of ids) {
      await sb.from('comms_feedback').delete().eq('prediction_id', id)
      await sb.from('comms_predictions').delete().eq('id', id)
    }
  })

  it('verbatim approval → note feedback, no edited_reply', async () => {
    const r = await recordInitiated(base)
    ids.push(r.predictionId)
    assert.equal(r.signal, 'verbatim')
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', r.predictionId)
    assert.equal(fb.length, 1)
    assert.equal(fb[0].kind, 'note')
    assert.equal(fb[0].payload.outcome, 'approved_verbatim')
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,mode,status').eq('id', r.predictionId).single()
    assert.equal(pred.mode, 'initiated')
    assert.equal(pred.status, 'sent')
    assert.equal(pred.edited_reply, null)
  })

  it('edited approval → edit feedback with delta + edited_reply set', async () => {
    const r = await recordInitiated({ ...base, approved: 'Hi Elad — can you commit a date this week?' })
    ids.push(r.predictionId)
    assert.equal(r.signal, 'edit')
    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', r.predictionId)
    assert.equal(fb[0].kind, 'edit')
    assert.equal(fb[0].payload.to, 'Hi Elad — can you commit a date this week?')
    assert.ok(fb[0].payload.delta) // structuralDelta present
    const { data: pred } = await sb.from('comms_predictions').select('edited_reply,user_touched').eq('id', r.predictionId).single()
    assert.equal(pred.edited_reply, 'Hi Elad — can you commit a date this week?')
    assert.equal(pred.user_touched, true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/__tests__/initiated.test.ts`
Expected: FAIL — `Cannot find module '../initiated.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `comms-assistant/initiated.ts`:

```ts
// Outgoing ("initiated") flow: map a conversation-authored, Yonatan-approved email to a
// comms_predictions row (mode:'initiated', status:'sent') and record the approve-time signal
// to comms_feedback via comms_apply_feedback. predicted_reply = what the agent drafted;
// edited_reply = what Yonatan approved (only when it differs). NEVER embedded.
import type { PredictionRow } from './types.js'
import { assembleContext, type ThreadInput } from './retrieve.js'
import { buildCardPayload } from './card.js'
import { structuralDelta } from './delta.js'
import { insertPrediction } from './store.js'

async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

export interface InitiatedInput {
  recipient: { email: string; name?: string; slug?: string }
  subject: string
  draft: string
  approved: string
  trigger_text: string
  action_type?: string
  action_target?: string | null
  thread?: ThreadInput
  tier?: number | null
  verdict?: Record<string, unknown> | null
  confidence?: 'high' | 'med' | 'low' | null
  why?: string | null
  memory_brief?: unknown
  sensitive?: boolean
}

const CONF_SCORE: Record<string, number> = { high: 0.85, med: 0.6, low: 0.35 }
const EMPTY_BUNDLE = { thread: '', rules: [], participants: [], ownership: null, narrative: [], meta: {} }

export async function buildInitiatedRow(input: InitiatedInput): Promise<PredictionRow> {
  const now = new Date().toISOString()
  const actionType = input.action_type ?? 'reply'
  const target = input.action_target ?? input.recipient.slug ?? input.recipient.name ?? input.recipient.email
  let bundle: any = EMPTY_BUNDLE
  try { if (input.thread) bundle = await assembleContext(input.thread) } catch { /* sparse context */ }
  // Shape an `it`-like object for buildCardPayload (same contract as run.ts itemToRow).
  const it = {
    email: { subject: input.subject, from: 'Yonatan Orpeli', to: [input.recipient.email], date: now, channel: 'outlook' },
    thread: input.thread,
    suggestion: {
      action: { type: actionType, target },
      disposition: actionType,
      text: input.approved,
      why: input.why ?? null,
      confidence: input.confidence ?? null,
      memory_brief: input.memory_brief ?? null,
    },
    tier: input.tier ?? null,
    verdict: input.verdict ?? null,
  }
  return {
    mode: 'initiated',
    thread_id: null, message_id: null, internet_message_id: null, web_link: null,
    channel: 'email',
    as_of: now,
    trigger_text: input.trigger_text,
    disposition: actionType,
    action_type: actionType,
    action_target: target,
    needs_data: false,
    predicted_reply: input.draft,
    predicted_stance: actionType,
    confidence: (input.confidence ?? null) as any,
    confidence_score: input.confidence ? (CONF_SCORE[input.confidence] ?? null) : null,
    context_available: { draft_why: input.why ?? null } as any,
    actual_reply: null, delta: null, resolution: null, why: input.why ?? null,
    derived_rule_ids: [],
    sensitive: !!input.sensitive,
    tier: input.tier ?? null,
    verdict: input.verdict ?? null,
    card: buildCardPayload(it as any, bundle),
    status: 'sent',
    last_message_id: null,
    captured_at: now,
  }
}

export interface RecordResult { predictionId: string; signal: 'edit' | 'verbatim' }

export async function recordInitiated(input: InitiatedInput): Promise<RecordResult> {
  const row = await buildInitiatedRow(input)
  const predictionId = await insertPrediction(row)
  const sb = await db()
  const edited = input.approved !== input.draft
  const delta = structuralDelta(input.draft, input.approved)
  if (edited) {
    const { error } = await sb.rpc('comms_apply_feedback', {
      p_prediction_id: predictionId, p_kind: 'edit',
      p_payload: { from: input.draft, to: input.approved, delta, mode: 'initiated' },
    })
    if (error) throw error
    return { predictionId, signal: 'edit' }
  }
  const { error } = await sb.rpc('comms_apply_feedback', {
    p_prediction_id: predictionId, p_kind: 'note',
    p_payload: { outcome: 'approved_verbatim', delta, mode: 'initiated' },
  })
  if (error) throw error
  return { predictionId, signal: 'verbatim' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/__tests__/initiated.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/initiated.ts comms-assistant/__tests__/initiated.test.ts
git commit -m "feat(comms): initiated-row builder + recordInitiated (persist + approve-time feedback)"
```

---

### Task 4: CLI wiring (`send-initiated`, `contacts:resolve`, `contacts:learn`)

Expose the modules as three CLI subcommands the conversation agent calls. `send-initiated` pushes the draft to the bridge (best-effort) and always persists + records — so a learning signal is kept even if the bridge is down.

**Files:**
- Modify: `comms-assistant/run.ts`

**Interfaces:**
- Consumes: `pushFreshDraft` (Task 1), `resolveRecipient`/`upsertExternalContact`/`backfillPersonEmail`/`contactBackfillDecision` (Task 2), `recordInitiated` + `InitiatedInput` (Task 3).
- Produces: CLI subcommands (no new exported types).

- [ ] **Step 1: Add imports**

In `comms-assistant/run.ts`, after the existing `import { pullClaudeTagged, pullUnread } from './outlook-bridge/gather.js'` line, add:

```ts
import { pushFreshDraft } from './outlook-bridge/push-client.js'
import { recordInitiated, type InitiatedInput } from './initiated.js'
import { resolveRecipient, upsertExternalContact, backfillPersonEmail, contactBackfillDecision } from './contacts.js'
```

- [ ] **Step 2: Add the `send-initiated` case**

In the `switch (cmd)` block in `run.ts main()`, before `default:`, add:

```ts
    case 'send-initiated': {
      // Outgoing flow post-approval. --payload=<InitiatedInput json>. Pushes a fresh Outlook
      // draft via the bridge (best-effort) and persists the initiated card + approve-time signal.
      const input = payload() as InitiatedInput
      const push = await pushFreshDraft(
        { to: [input.recipient.email], subject: input.subject, body: input.approved },
      )
      const rec = await recordInitiated(input)
      console.log(JSON.stringify({
        pushed: push.ok,
        pushError: push.ok ? undefined : push.error,
        predictionId: rec.predictionId,
        signal: rec.signal,
      }, null, 2))
      break
    }
    case 'contacts:resolve': {
      const q = arg('query')
      if (!q) throw new Error('--query=<name|email> required')
      console.log(JSON.stringify(await resolveRecipient(q), null, 2))
      break
    }
    case 'contacts:learn': {
      // --payload={ email, name?, slug? }. Known person → backfill people.email (fill/confirm/noop);
      // external → upsert context_store.comms_contacts.
      const p = payload() as { email: string; name?: string; slug?: string }
      if (p.slug) {
        const r = await resolveRecipient(p.slug)
        const decision = contactBackfillDecision(r.email, p.email)
        if (decision === 'fill') { await backfillPersonEmail(p.slug, p.email); console.log(JSON.stringify({ learned: 'people', slug: p.slug, decision })) }
        else console.log(JSON.stringify({ learned: 'none', slug: p.slug, decision, existing: r.email }))
      } else if (p.name) {
        await upsertExternalContact({ name: p.name, email: p.email })
        console.log(JSON.stringify({ learned: 'contacts', name: p.name }))
      } else {
        throw new Error('contacts:learn needs slug (person) or name (external)')
      }
      break
    }
```

- [ ] **Step 3: Update the run.ts command header comment**

In the top-of-file comment block in `run.ts`, after the `rules:distill` line, add:

```ts
//   send-initiated --payload=<InitiatedInput>  outgoing flow: push Outlook draft + persist initiated card + feedback
//   contacts:resolve --query=<name|email>      resolve a recipient → {slug?,name?,email?,source}
//   contacts:learn --payload={email,name?|slug?} backfill people.email / upsert comms_contacts
```

- [ ] **Step 4: Verify wiring with a real run (integration smoke)**

The bridge need not be running (push is best-effort). Run a verbatim send end-to-end and confirm it persists, then clean up:

```bash
cat > /tmp/initiated-smoke.json <<'JSON'
{ "recipient": { "email": "elad@payoneer.com", "name": "Elad Schnarch", "slug": "elad-schnarch" },
  "subject": "PLAN SMOKE — delete me", "draft": "Hi Elad —\n\ntest.", "approved": "Hi Elad —\n\ntest.",
  "trigger_text": "plan smoke test", "confidence": "low" }
JSON
npm run comms-assistant -- send-initiated --payload=/tmp/initiated-smoke.json
```

Expected output JSON: `pushed:false` (bridge down — fine) with a `pushError`, a real `predictionId` (uuid), and `signal:"verbatim"`.

Clean up the smoke row (use the printed id):

```bash
npx tsx -e "import('dotenv/config').then(async()=>{const {getSupabase}=await import('./lib/supabase.js');const sb=getSupabase();const id=process.argv[1];await sb.from('comms_feedback').delete().eq('prediction_id',id);await sb.from('comms_predictions').delete().eq('id',id);console.log('deleted',id)})" <PREDICTION_ID>
```

- [ ] **Step 5: Run the full comms test suite (no regressions)**

Run: `node --import tsx --test comms-assistant/__tests__/*.test.ts comms-assistant/outlook-bridge/__tests__/*.test.ts`
Expected: PASS (existing suites + the three new files).

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/run.ts
git commit -m "feat(comms): send-initiated + contacts CLI for the outgoing email flow"
```

---

### Task 5: Documentation & prompt

Wire the flow into the agent's operating docs so it triggers conversationally and the procedure is followed exactly. No code.

**Files:**
- Modify: `comms-assistant/prompts/prediction-subagent.md`, `comms-assistant/CLAUDE.md`, `agents/comms-assistant.md`, `CLAUDE.md` (root), `comms-assistant/agent-arch.md`, `comms-assistant/outlook-bridge/README.md`

- [ ] **Step 1: Add the Initiated-mode section to the sub-agent prompt**

In `comms-assistant/prompts/prediction-subagent.md`, after the `## Step 3 — Output` section, append:

````markdown
---

## Initiated (outgoing) mode — "send X an email about it"

This is the inverse of prediction. Yonatan, mid-conversation, asks to send someone an email about
what you just discussed. **The conversation is the source material** — the main agent drafts (it holds
that context), not a blind sub-agent. The same voice + rulebook + grounding apply. Differences:

- **Source of intent:** the conversation (distilled into `trigger_text`), not an incoming thread.
- **Gather first:** build a `ThreadInput` (`subject`=synthesized topic, `participants`=[Yonatan, recipient],
  `bodyToDate`=the brief) and run `assembleContext` — same tiers, same `memory_brief` + `sources` transparency.
- **Opening conventions:** a fresh initiated email opens with a greeting in the recipient's register/language
  and states the purpose in the first line — no "stale-thread acknowledgment" (there's no lag to own). Terse
  still governs; structure multi-point asks as a list.
- **Executive voice (PINNED) still applies** — cooperative, never accusatory.
- **Stakes → verify:** escalate to fresh/blind adversarial verifiers (faithfulness / ownership-and-facts /
  voice-and-etiquette) when the recipient is SVP+ (Yaron, Oren), external/a vendor, the topic is sensitive,
  or the draft makes grounding-heavy factual claims. Otherwise self-eval + exec-voice is enough — Yonatan is
  the live reviewer.
- **Sensitive topics are drafted-but-flagged here** (he explicitly asked), unlike incoming-sensitive which is
  never drafted. Always show the flag.
````

- [ ] **Step 2: Add the Outgoing-flow procedure to `comms-assistant/CLAUDE.md`**

In `comms-assistant/CLAUDE.md`, after the `## Triage sweep — the procedure` section (before `## Grounding`), insert:

````markdown
## Outgoing flow — "send X an email about it" (Yonatan never runs the CLI; you do)
Triggers (mid-conversation): "send Elad an email about it", "draft an email to Yael re: …", "email Yaron a
heads-up on this". The email is about **what you just discussed** — you (the conversation agent) draft it.
1. **Resolve recipient.** `npm run comms-assistant -- contacts:resolve --query="<name|email>"` → `{slug?,name?,email?,source}`.
   If `source:'unknown'` or `email` missing → ask Yonatan once (or he adds it in Outlook). Capture the address.
2. **Gather.** Build a `ThreadInput` (`subject`=topic, `participants`=[yonatan-orpeli, recipient], `bodyToDate`=a short
   brief of what we discussed) and run `assembleContext` (`context:assemble --file=…`) — rule spine + T1/T2/T3.
   Surface what you pulled (`memory_brief` + sources).
3. **Draft** in Yonatan's voice applying the rule spine + pinned executive-voice (see `prompts/prediction-subagent.md`
   → *Initiated mode*). Self-eval (language/etiquette/exec-voice). Compute **stakes**: SVP+ / external-or-vendor /
   sensitive / grounding-heavy claims → **escalate**.
4. **Escalate (high-stakes only).** Dispatch three fresh/blind adversarial verifiers (faithfulness /
   ownership-and-facts / voice-and-etiquette) over {draft, bundle, brief}; majority-refute → surface the flags
   inline before showing the draft.
5. **Show + approve in chat.** Present draft + recipient + `memory_brief`/sources + confidence + any flags. Yonatan
   approves / edits / asks for a revision (loop 3).
6. **Push + persist + learn (one command).** `npm run comms-assistant -- send-initiated --payload=<InitiatedInput.json>`:
   pushes a fresh Outlook draft via the bridge (best-effort — needs `npm run outlook-bridge` + Legacy Outlook; if
   down, fall back to pasting the approved text), then persists the `mode:'initiated'` card and records the
   **approve-time signal** (edit → `comms_feedback` kind `edit` with the `delta`; verbatim → kind `note`
   `approved_verbatim`). `rules:distill` consumes it like any feedback.
7. **Learn the contact (if you had to ask).** `npm run comms-assistant -- contacts:learn --payload='{"slug":"…","email":"…"}'`
   (known person → backfill `people.email`; `fill` silently, `confirm` first if it differs) or
   `--payload='{"name":"Vendor X","email":"…"}'` (external → `comms_contacts`). Next time, no ask.

`InitiatedInput` (step 6 payload): `{ recipient:{email,name?,slug?}, subject, draft, approved, trigger_text,
action_type?, action_target?, thread?:ThreadInput, tier?, verdict?, confidence?, why?, memory_brief?, sensitive? }`.
`draft` = what you first composed; `approved` = what Yonatan OK'd (equal if verbatim).
````

- [ ] **Step 3: Add the new commands to the `comms-assistant/CLAUDE.md` Files list**

In the `## Files` section of `comms-assistant/CLAUDE.md`, update the `run.ts` line to mention the new commands and add the two new modules. Change the `run.ts` bullet to:

```
`run.ts` (CLI: classify · context:assemble/probe · predictions:* · rules:* · **send-initiated · contacts:resolve/learn**)
```

and add after the `sweep.ts` bullet:

```
· `initiated.ts` (outgoing flow: `buildInitiatedRow` + `recordInitiated` — persist a `mode:'initiated'` card + approve-time `comms_feedback`)
· `contacts.ts` (`resolveRecipient` / `upsertExternalContact` / `backfillPersonEmail` / `contactBackfillDecision` — recipient resolution + contact learning)
· `outlook-bridge/push-client.ts` (`pushFreshDraft` — terminal-side POST /draft fresh compose)
```

- [ ] **Step 4: Add the NL-trigger + procedure to `agents/comms-assistant.md`**

Add a section to `agents/comms-assistant.md` documenting the outgoing flow. Read the file first to match its heading style, then add a section titled `## Outgoing email flow ("send X an email about it")` summarizing steps 1–7 from Step 2 above and noting: the agent drafts (conversation is source material); verifiers stay fresh/blind; read-only (bridge opens a draft, never sends); approve-time edit diff is the primary learning signal; contact learning backfills `people.email` / `comms_contacts`.

- [ ] **Step 5: Add a row to the project `CLAUDE.md` comms-assistant trigger table**

In the root `CLAUDE.md`, in the **Comms Assistant — natural-language trigger** paragraph, add a sentence after the triage-sweep description:

```
**Outgoing ("send X an email about it"):** mid-conversation, when Yonatan says "send <person> an email about it" / "draft an email to <person> re: …" / "email <person> a heads-up", run the outgoing flow — resolve recipient (`contacts:resolve`), gather (`assembleContext`), draft in voice applying the rulebook, self-eval + adaptive adversarial verify by stakes, show in chat for approval, then `send-initiated` (push a fresh Outlook draft via the bridge — never sends — and persist a `mode:'initiated'` card + the approve-time edit diff to `comms_feedback`, which `rules:distill` learns from). Backfill the recipient's address (`contacts:learn`) so it's never re-asked. Full procedure: [comms-assistant/CLAUDE.md](comms-assistant/CLAUDE.md).
```

- [ ] **Step 6: Note the outgoing flow in `agent-arch.md`**

In `comms-assistant/agent-arch.md`, add a short subsection under §9 (or a new §9.1) titled **"Initiated (outgoing) flow"** describing: conversation-triggered; main agent drafts (conversation is source); reuses gather + rulebook + (adaptive) verifiers; pushes via the bridge fresh path; persists `mode:'initiated'`; the **approve-time edit diff** (not a Sent reconcile) is the primary learning signal; contact learning. Add to the File map table rows for `initiated.ts`, `contacts.ts`, and `outlook-bridge/push-client.ts`. Update the closing "next missing piece" paragraph to note the outgoing flow shipped 2026-06-19.

- [ ] **Step 7: Note `push-client.ts` in the bridge README**

In `comms-assistant/outlook-bridge/README.md`, in the `Files:` list under Architecture, add:

```
- `push-client.ts` — Node/terminal caller of `POST /draft` (fresh compose) for the comms-assistant
  **outgoing flow** (`run.ts send-initiated`). The app's browser caller is `app/src/lib/draft-request.ts`.
```

- [ ] **Step 8: Verify the docs reference real commands**

Run: `grep -rn "send-initiated" comms-assistant/CLAUDE.md agents/comms-assistant.md CLAUDE.md comms-assistant/run.ts`
Expected: matches in all four files (the CLI case + the three doc references).

- [ ] **Step 9: Commit**

```bash
git add comms-assistant/prompts/prediction-subagent.md comms-assistant/CLAUDE.md agents/comms-assistant.md CLAUDE.md comms-assistant/agent-arch.md comms-assistant/outlook-bridge/README.md
git commit -m "docs(comms): document the outgoing email flow + initiated mode + contact learning"
```

---

## Self-Review

**1. Spec coverage:**
- §1 intent (conversation trigger, gather, draft, push, learn, contacts) → Tasks 1–5. ✓
- §2 decision #1 (approve-time edit diff) → Task 3 `recordInitiated` (edit/note + `delta`). ✓
- §2 decision #2 (adaptive verify by stakes) → documented in Task 5 (prompt + procedure); the agent dispatches fresh verifiers. ✓ (No code module — by design, the agent applies it conversationally; criteria are written into the prompt/procedure.)
- §2 decision #3 (comms_predictions mode:'initiated' + comms_feedback) → Task 3. ✓
- §2 decision #4 (main agent drafts; verifiers fresh) → Task 5 prompt section. ✓
- §2 decision #5 (contact learning) → Task 2 + Task 4 `contacts:learn`. ✓
- §2 decision #6 (sensitive drafted-but-flagged) → Task 5 prompt section. ✓
- §3 flow steps 1–7 → Task 5 procedure. ✓
- §4 contact learning detail (people.email fill/confirm/noop; comms_contacts) → Task 2. ✓
- §5 stakes signals → Task 5 (documented criteria). ✓
- §6 reused-vs-new → matches Tasks 1–4. ✓
- §7 privacy/invariants (never send, never embed, confirm overwrite) → Global Constraints + Task 2 `contactBackfillDecision`. ✓
- §8 open items → resolved: CLI surface (Task 4 = new subcommands, not reuse of add-many); comms_contacts shape (Task 2 `{contacts:[{name,email,learned_at,source}]}`); verify stage (agent-dispatched fresh, not a workflow refactor); delta representation (Task 3 `structuralDelta` in the feedback payload). ✓

**2. Placeholder scan:** No TBD/TODO; every code step has complete code; commands have expected output. The one `<PREDICTION_ID>` / `<person>` tokens are runtime values a human substitutes, not plan placeholders. ✓

**3. Type consistency:** `InitiatedInput`, `RecordResult`, `FreshDraft`/`PushResult`, `ResolvedRecipient`, `BackfillDecision` are defined once (Tasks 1–3) and consumed by Task 4 with matching names/shapes. `recordInitiated`/`buildInitiatedRow`/`pushFreshDraft`/`resolveRecipient`/`upsertExternalContact`/`backfillPersonEmail`/`contactBackfillDecision` names are identical across definition and CLI import. `comms_apply_feedback` kinds (`edit`/`note`) match the live RPC. ✓
