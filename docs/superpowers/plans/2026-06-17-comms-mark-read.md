# Comms Triage "Mark read in Outlook & dismiss" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click "Mark read in Outlook & dismiss" action to the `/triage` app that dismisses the card and queues an Outlook mark-read task for a new, isolated read/write Outlook skill.

**Architecture:** App button → `comms_mark_read` RPC (queues an `agent_tasks` row for `target_agent='outlook-sync'` + dismisses the card + logs a learning signal). A new dedicated Outlook-side skill `second-brain-sync` (its own spec `outlook_sync_spec`, isolated from the read-only email-agent skill) picks the task up on demand and flips the read flag — the first and only agent-initiated mailbox write, narrowly scoped to the read flag.

**Tech Stack:** Postgres (Supabase MCP `apply_migration`), Node `tsx --test` integration tests, React + Tanstack Query + the Vite app in `app/`, the spec-sync pipeline in `outlook/`.

**Spec:** `docs/superpowers/specs/2026-06-17-comms-mark-read-design.md`

**Commits:** This repo's standing rule is "commit only when Yonatan asks." The commit steps below mark the intended boundaries — confirm with Yonatan before running them, or batch them at the end of execution.

**Migrations:** apply DDL with the Supabase MCP `apply_migration` tool against the Second Brain project (`tjlcdwsckbbkedyzrzda`). Inspect with the MCP `execute_sql`/`list_tables`. (In the predecessor plan this tool was `mcp__claude_ai_Supabase_SeondBrain__apply_migration`; use whichever Supabase MCP is wired to project `tjlcdwsckbbkedyzrzda` in the executing session — verify the project ref before applying.)

---

## File Structure

- **DB migration `comms_mark_read_rpc`** (no file — applied via MCP): the `comms_mark_read(uuid)` function + anon grant.
- `comms-assistant/__tests__/mark-read.test.ts` — **Create.** Integration test for the RPC (mirrors `apply-feedback.test.ts`).
- `outlook/sync-spec.ts` — **Modify.** Generalize from one spec marker to all `<!-- spec:KEY -->` markers.
- `outlook/__tests__/sync-spec.test.ts` — **Create.** Unit test for the multi-spec extractor (pure, no DB).
- `outlook/run.ts` — **Modify.** Update the `sync-spec` command output for multiple specs.
- `agents/outlook-agent.md` — **Modify.** Add the `second-brain-sync` skill block + `<!-- spec:outlook_sync_spec -->` JSON block; add a one-line note about the mark-read path.
- `app/src/hooks/use-triage.ts` — **Modify.** Add `useMarkRead()`.
- `app/src/pages/triage.tsx` — **Modify.** Wire `useMarkRead` + pass `onMarkRead` to the detail.
- `app/src/components/triage/triage-detail.tsx` — **Modify.** Add `onMarkRead?` prop + the channel-aware button.
- **Follow-ups (Task 6):** `project_decisions` row, `agent_coordination` change-log, a memory file + `MEMORY.md` pointer, doc prose.

---

### Task 1: `comms_mark_read` RPC + integration test

**Files:**
- Migration (via MCP `apply_migration`), name: `comms_mark_read_rpc`
- Test: `comms-assistant/__tests__/mark-read.test.ts`

- [ ] **Step 1: Confirm the prediction columns exist.**

Run the MCP `execute_sql`:
```sql
select column_name from information_schema.columns
where table_name = 'comms_predictions'
  and column_name in ('internet_message_id','message_id','web_link','channel','card','status','user_touched');
```
Expected: all 7 rows present. (Verified at design time from `comms-assistant/store.ts` COLS and the predecessor schema migration.)

- [ ] **Step 2: Apply the RPC migration.**

Call `apply_migration` name `comms_mark_read_rpc` with this SQL:
```sql
-- Queue an Outlook mark-read task + dismiss the card + log the learning signal,
-- atomically. SECURITY DEFINER so the app's anon client can call it (mirrors
-- comms_apply_feedback). The mark-read task is routed to target_agent
-- 'outlook-sync' so the read-only email-agent board never sees a write task.
create or replace function comms_mark_read(p_prediction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r         record;
  v_subject text;
  v_has_key boolean;
  v_queued  boolean := false;
begin
  select id, internet_message_id, message_id, web_link, channel, card
    into r
    from comms_predictions
   where id = p_prediction_id;

  if not found then
    raise exception 'prediction not found: %', p_prediction_id;
  end if;

  v_subject := coalesce(r.card->'email'->>'subject', 'message');
  v_has_key := coalesce(r.internet_message_id, r.message_id, r.web_link) is not null;

  -- Queue only when we have a key to find the message AND it's a mail channel.
  -- Teams read-state is a different API (out of scope) — those cards still dismiss.
  if v_has_key and (r.channel is null or r.channel in ('outlook','email')) then
    insert into agent_tasks (title, description, target_agent, status, priority, created_by, tags)
    values (
      'Mark read: ' || left(v_subject, 120),
      jsonb_build_object(
        'type',                'mark-read',
        'internet_message_id', r.internet_message_id,
        'message_id',          r.message_id,
        'web_link',            r.web_link,
        'subject',             v_subject,
        'prediction_id',       r.id
      )::text,
      'outlook-sync', 'pending', 'normal', 'comms-triage-app',
      array['outlook-sync','mark-read']
    );
    v_queued := true;
  end if;

  -- Dismiss so it drops off the open queue (matches comms_apply_feedback's status path).
  update comms_predictions
     set status = 'dismissed', user_touched = true
   where id = p_prediction_id;

  -- Learning signal — marking a card read = "this didn't need a response".
  insert into comms_feedback (prediction_id, kind, payload)
  values (p_prediction_id, 'status',
          jsonb_build_object('to','dismissed','via','mark-read','queued',v_queued));

  return jsonb_build_object('queued', v_queued, 'subject', v_subject);
end;
$$;

grant execute on function comms_mark_read(uuid) to anon;
```

- [ ] **Step 3: Write the test.**

`comms-assistant/__tests__/mark-read.test.ts`:
```ts
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { getSupabase } from '../../lib/supabase.js'

const sb = getSupabase() as any
let outlookId: string
let teamsId: string

const MSG = 'MARKREAD-TEST-MSG-1'

describe('comms_mark_read', () => {
  before(async () => {
    const ins = async (channel: string, imid: string | null) => {
      const { data, error } = await sb.from('comms_predictions').insert({
        mode: 'reply', channel, as_of: new Date().toISOString(),
        context_available: {}, derived_rule_ids: [], sensitive: false, status: 'open',
        internet_message_id: imid,
        card: { email: { subject: 'Weekly vendor digest' } },
      }).select('id').single()
      if (error) throw error
      return data.id as string
    }
    outlookId = await ins('outlook', MSG)
    teamsId = await ins('teams', null)
  })
  after(async () => {
    await sb.from('agent_tasks').delete().eq('target_agent', 'outlook-sync').ilike('description', `%${MSG}%`)
    await sb.from('comms_predictions').delete().in('id', [outlookId, teamsId])
  })

  it('outlook card: queues a mark-read task, dismisses, logs feedback', async () => {
    const { data, error } = await sb.rpc('comms_mark_read', { p_prediction_id: outlookId })
    assert.equal(error, null)
    assert.equal(data.queued, true)

    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', outlookId).single()
    assert.equal(pred.status, 'dismissed')

    const { data: tasks } = await sb.from('agent_tasks')
      .select('target_agent,status,description,tags').eq('target_agent', 'outlook-sync').ilike('description', `%${MSG}%`)
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].status, 'pending')
    assert.ok(tasks[0].description.includes('"type":"mark-read"') || tasks[0].description.includes('"type": "mark-read"'))
    assert.ok(tasks[0].tags.includes('mark-read'))

    const { data: fb } = await sb.from('comms_feedback').select('kind,payload').eq('prediction_id', outlookId).eq('kind', 'status')
    assert.equal(fb.length, 1)
    assert.equal(fb[0].payload.via, 'mark-read')
  })

  it('teams card: dismisses but queues no task', async () => {
    const { data, error } = await sb.rpc('comms_mark_read', { p_prediction_id: teamsId })
    assert.equal(error, null)
    assert.equal(data.queued, false)
    const { data: pred } = await sb.from('comms_predictions').select('status').eq('id', teamsId).single()
    assert.equal(pred.status, 'dismissed')
  })
})
```

- [ ] **Step 4: Run the test — expect PASS** (the function exists from Step 2).

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain && npx tsx --test comms-assistant/__tests__/mark-read.test.ts`
Expected: `# pass 2  # fail 0`. (If the function were missing, the RPC call returns a non-null error and the asserts fail — that's the failing state.)

- [ ] **Step 5: Commit** (gated — see header).
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && git add comms-assistant/__tests__/mark-read.test.ts && git commit -m "feat(comms): comms_mark_read RPC + integration tests"
```

---

### Task 2: Generalize `outlook/sync-spec.ts` to all spec markers + unit test

**Files:**
- Modify: `outlook/sync-spec.ts`
- Create: `outlook/__tests__/sync-spec.test.ts`
- Modify: `outlook/run.ts` (the `sync-spec` case output)

- [ ] **Step 1: Check for existing importers** of `extractSpecJson`/`syncSpec` so nothing breaks.

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain && grep -rn "extractSpecJson\|syncSpec" --include=*.ts . | grep -v node_modules`
Expected: references in `outlook/sync-spec.ts` and `outlook/run.ts` only. If a test imports `extractSpecJson`, keep the wrapper added in Step 3.

- [ ] **Step 2: Write the failing unit test.**

`outlook/__tests__/sync-spec.test.ts`:
```ts
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractSpecs } from '../sync-spec.js'

const DOC = `
intro text
<!-- spec:outlook_agent_spec -->
\`\`\`json
{ "name": "agent", "version": "1.2" }
\`\`\`
more prose
<!-- spec:outlook_sync_spec -->
\`\`\`json
{ "name": "sync", "version": "0.1" }
\`\`\`
trailing
`

describe('extractSpecs', () => {
  it('returns every spec block keyed by its marker', () => {
    const out = extractSpecs(DOC)
    assert.equal(out.length, 2)
    assert.deepEqual(out.map((s) => s.key), ['outlook_agent_spec', 'outlook_sync_spec'])
    assert.equal((out[1].spec as any).version, '0.1')
  })

  it('throws when no markers are present', () => {
    assert.throws(() => extractSpecs('no markers here'), /No spec markers/)
  })
})
```

- [ ] **Step 3: Run — expect FAIL** (no `extractSpecs` export yet).

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain && npx tsx --test outlook/__tests__/sync-spec.test.ts`
Expected: FAIL — `extractSpecs is not a function` / import error.

- [ ] **Step 4: Implement the generalized extractor.**

Replace the body of `outlook/sync-spec.ts` (keep the imports + `DOC_PATH`) with:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOC_PATH = resolve(__dirname, '../agents/outlook-agent.md')
const MARKER_RE = /<!--\s*spec:([a-z0-9_]+)\s*-->/g

/** Scan every `<!-- spec:KEY -->` marker and return its following ```json block. */
export function extractSpecs(doc: string): { key: string; spec: unknown }[] {
  const out: { key: string; spec: unknown }[] = []
  let m: RegExpExecArray | null
  while ((m = MARKER_RE.exec(doc)) !== null) {
    const key = m[1]
    const after = doc.slice(m.index)
    const fenceStart = after.indexOf('```json')
    if (fenceStart === -1) throw new Error(`No \`\`\`json block after spec marker: ${key}`)
    const bodyStart = fenceStart + '```json'.length
    // Close only on a fence at line start, so backticks inside a JSON string can't end it early.
    const closeRel = after.slice(bodyStart).search(/\n```/)
    if (closeRel === -1) throw new Error(`Unterminated \`\`\`json block for spec: ${key}`)
    const jsonText = after.slice(bodyStart, bodyStart + closeRel).trim()
    out.push({ key, spec: JSON.parse(jsonText) })
  }
  if (out.length === 0) throw new Error('No spec markers found in agents/outlook-agent.md')
  return out
}

/** Upsert every spec block to its context_store key. Returns key+version per spec. */
export async function syncSpec(): Promise<{ key: string; version: string }[]> {
  const doc = readFileSync(DOC_PATH, 'utf8')
  const specs = extractSpecs(doc)
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()
  const results: { key: string; version: string }[] = []
  for (const { key, spec } of specs) {
    const { error } = await supabase
      .from('context_store' as any)
      .upsert({ key, content: spec as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
    if (error) throw new Error(`Failed to upsert spec ${key}: ${error.message}`)
    results.push({ key, version: String((spec as any).version ?? 'unknown') })
  }
  return results
}
```
(If Step 1 found a test importing `extractSpecJson`, also add: `export function extractSpecJson(doc: string) { return extractSpecs(doc).find((s) => s.key === 'outlook_agent_spec')?.spec }`.)

- [ ] **Step 5: Run the unit test — expect PASS.**

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain && npx tsx --test outlook/__tests__/sync-spec.test.ts`
Expected: `# pass 2  # fail 0`.

- [ ] **Step 6: Update the `sync-spec` command output in `outlook/run.ts`.**

Find (around line 211):
```ts
      case 'sync-spec': {
        const { syncSpec } = await import('./sync-spec.js')
        const version = await syncSpec()
        console.log(`Synced outlook_agent_spec → context_store. version: ${version}`)
```
Replace the body with:
```ts
      case 'sync-spec': {
        const { syncSpec } = await import('./sync-spec.js')
        const results = await syncSpec()
        for (const r of results) console.log(`Synced ${r.key} → context_store. version: ${r.version}`)
```
(Leave the rest of the case — the `break;`/closing brace — unchanged.)

- [ ] **Step 7: Commit** (gated).
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && git add outlook/sync-spec.ts outlook/run.ts outlook/__tests__/sync-spec.test.ts && git commit -m "feat(outlook): sync-spec syncs all spec markers (multi-spec)"
```

---

### Task 3: Add the `second-brain-sync` skill + `outlook_sync_spec` to `agents/outlook-agent.md`

**Files:**
- Modify: `agents/outlook-agent.md`

- [ ] **Step 1: Add the Outlook-side skill block.** Insert after the "Outlook-side skill #2 — push to brain" block (before the "## Operating spec" heading) this new section:
````markdown
## Outlook-side skill #3 — sync (read/write, created once, then frozen)

This is the ONLY skill permitted to write to the mailbox, and only to toggle a
message's read flag. Kept separate from the read-only skills above on purpose.

```markdown
---
name: second-brain-sync
description: Use when Yonatan says "sync second brain", "/sync-second-brain",
  "mark these read", or "process second brain sync tasks". Connects to the
  Second Brain Supabase database, loads its sync spec, and follows it.
---

# Second Brain — Sync (read/write)

You are the `outlook-sync` surface of Yonatan's Second Brain. Your behavior is
defined by a spec stored in the database — not hardcoded here.

## 1. Load your sync spec FIRST
Query Supabase: `SELECT content FROM context_store WHERE key = 'outlook_sync_spec';`
It is the source of truth. Read it fully and follow its `run_loop` exactly.

## 2. Do what the spec says
Follow the spec step by step. The ONLY mailbox write you may perform is toggling
a message's read flag, for a message a task names by ID.

## 3. Report to Yonatan
Summarize what you marked read and flag anything you could not find.
```
````

- [ ] **Step 2: Add the spec block.** Immediately after the skill block from Step 1, add:
````markdown
## Sync operating spec (source of truth → synced to context_store.outlook_sync_spec)

<!-- spec:outlook_sync_spec -->
```json
{
  "mode": "production",
  "name": "Outlook Sync — Operating Spec",
  "version": "0.1-mark-read",
  "purpose": "Process write tasks queued for target_agent 'outlook-sync'. Currently one type: 'mark-read' — mark a specific message read in Outlook. This is the only agent that writes to the mailbox, and the only permitted write is the read flag.",
  "run_loop": [
    "1. Read this spec (you just did). State its version in your report.",
    "2. Get pending tasks: SELECT id, description FROM agent_tasks WHERE target_agent = 'outlook-sync' AND status = 'pending' ORDER BY created_at;",
    "3. For EACH task, parse the JSON in description and act on its 'type'. Supported: 'mark-read' (mark_read). If type is anything else, mark the task failed with result_summary = 'unsupported sync type <type>' and move on.",
    "4. Claim before working: UPDATE agent_tasks SET status = 'picked-up', picked_up_by = 'outlook-sync', updated_at = now() WHERE id = '<id>';",
    "5. Execute per the mark_read section.",
    "6. Write back (see write_back).",
    "7. After all tasks, report to Yonatan: count marked read, one line per task, and flag any message you could not find."
  ],
  "hard_rules": [
    "ACT ONLY ON DEMAND: only when Yonatan triggers this skill. Never proactively scan the mailbox.",
    "SUPABASE WRITE SCOPE: only ever write to the agent_tasks table (your own task rows).",
    "MAILBOX WRITE SCOPE: the ONLY mailbox mutation permitted is toggling a message's read flag, and only for a message a mark-read task names by ID. NEVER modify content, send, reply, delete, move, flag, or categorize.",
    "Only touch the single message a task explicitly names.",
    "If you cannot find the message, or your environment cannot toggle the read flag, do NOT guess — mark the task failed with a clear reason."
  ],
  "mark_read": {
    "description": "Mark one specific message as read.",
    "input_fields": {
      "internet_message_id": "RFC message-id — the preferred key to find the message",
      "message_id": "Graph/Outlook message id — fallback key",
      "web_link": "Outlook deep link — fallback key",
      "subject": "subject line — last-resort disambiguation only",
      "prediction_id": "pass-through id from comms_predictions (do not interpret)"
    },
    "steps": [
      "Find the message by internet_message_id; if unavailable, try message_id, then web_link, then subject as a last resort.",
      "If exactly one message matches, mark it read.",
      "If no message matches, or more than one matches an ambiguous subject search with no id, do not act — record not-found."
    ]
  },
  "write_back": {
    "success": "UPDATE agent_tasks SET status = 'done', result_summary = '<text>', completed_at = now(), updated_at = now(), tags = array_append(coalesce(tags,'{}'), 'filed') WHERE id = '<id>'; -- tag 'filed' because nothing needs Claude Code promotion; this self-terminates.",
    "failure": "UPDATE agent_tasks SET status = 'failed', result_summary = '<reason>', updated_at = now() WHERE id = '<id>';"
  }
}
```
````

- [ ] **Step 3: Add a one-line note** under the "## Claude Code side" list (after the `result` bullet) so the path is discoverable:
```markdown
- Mark-read tasks are queued by the `/triage` app for `target_agent='outlook-sync'` (a separate board) and handled by the `second-brain-sync` skill — not by `check`/`request`.
```

- [ ] **Step 4: Sync both specs to `context_store`.**

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain && npx tsx outlook/run.ts sync-spec`
Expected output:
```
Synced outlook_agent_spec → context_store. version: 1.2-calendar-and-digests
Synced outlook_sync_spec → context_store. version: 0.1-mark-read
```

- [ ] **Step 5: Verify the new key landed.** Run the MCP `execute_sql`:
```sql
select key, content->>'version' as version from context_store where key in ('outlook_agent_spec','outlook_sync_spec');
```
Expected: two rows, including `outlook_sync_spec | 0.1-mark-read`.

- [ ] **Step 6: Commit** (gated).
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && git add agents/outlook-agent.md && git commit -m "feat(outlook): second-brain-sync skill + outlook_sync_spec (mark-read)"
```

---

### Task 4: App — `useMarkRead` hook + the button

**Files:**
- Modify: `app/src/hooks/use-triage.ts`
- Modify: `app/src/pages/triage.tsx`
- Modify: `app/src/components/triage/triage-detail.tsx`

- [ ] **Step 1: Add the `useMarkRead` hook.** In `app/src/hooks/use-triage.ts`, append after `useApplyFeedback`:
```ts
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (predictionId: string) => {
      const { error } = await supabase.rpc('comms_mark_read', { p_prediction_id: predictionId })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['triage'] }) },
  })
}
```

- [ ] **Step 2: Wire it in `app/src/pages/triage.tsx`.**

(a) Update the import on line 3:
```ts
import { useTriageCards, useApplyFeedback, useMarkRead } from "@/hooks/use-triage"
```
(b) After `const apply = useApplyFeedback()` (line 11) add:
```ts
  const markRead = useMarkRead()
```
(c) In the `<TriageDetail .../>` element (around line 131), add an `onMarkRead` prop after `onFeedback`:
```tsx
                onFeedback={(kind, payload) =>
                  apply.mutate({ predictionId: selected.id, kind, payload })
                }
                onMarkRead={() => markRead.mutate(selected.id)}
```

- [ ] **Step 3: Add the prop + button in `app/src/components/triage/triage-detail.tsx`.**

(a) Extend the component signature (lines 155-163) to accept the optional callback:
```tsx
export function TriageDetail({
  card,
  index,
  onFeedback,
  onMarkRead,
}: {
  card: TriageCard
  index: number
  onFeedback: (kind: FeedbackKind, payload: Record<string, unknown>) => void
  onMarkRead?: () => void
}) {
```
(b) Add the button as a new full-width row inside the pinned action bar, immediately AFTER the `flex gap-2` row that holds the Copy/Save buttons (i.e. after its closing `</div>`, before the action-bar's closing `</div>`). Insert:
```tsx
            {onMarkRead && (c.channel === "outlook" || c.channel === "email") && (
              <button
                onClick={onMarkRead}
                title="Marks the email read in Outlook (next sync run) and dismisses this card"
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-[9px] text-[12px] text-muted-foreground hover:text-foreground"
              >
                <Check className="h-[13px] w-[13px]" /> Mark read in Outlook &amp; dismiss
              </button>
            )}
```
(`Check` is already imported at the top of the file — no new import needed.)

- [ ] **Step 4: Typecheck + build the app.**

Run: `cd /Users/yorpeli/Documents/Dev/SecondBrain/app && npm run build`
Expected: `tsc -b` passes with no errors and `vite build` completes (`✓ built in …`).

- [ ] **Step 5: Manual smoke (optional but recommended).**

Run `cd /Users/yorpeli/Documents/Dev/SecondBrain/app && npm run dev`, open `/triage`, select an Outlook-channel card → the "Mark read in Outlook & dismiss" button appears below Copy/Save; clicking it removes the card from the list. Select a Teams card → the button is absent. Then confirm a row landed:
```sql
select target_agent, status, tags, left(description,80) from agent_tasks where target_agent = 'outlook-sync' order by created_at desc limit 3;
```

- [ ] **Step 6: Commit** (gated).
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && git add app/src/hooks/use-triage.ts app/src/pages/triage.tsx app/src/components/triage/triage-detail.tsx && git commit -m "feat(triage-app): Mark read in Outlook & dismiss button"
```

---

### Task 5: Follow-ups — decision record, coordination, memory, docs

**Files:**
- DB rows via MCP `execute_sql`; memory files under the user memory dir; prose edits.

- [ ] **Step 1: Record the policy decision.** MCP `execute_sql`:
```sql
insert into project_decisions (title, description, status)
values (
  'Agent mailbox writes limited to read-flag via second-brain-sync',
  'The comms /triage "Mark read in Outlook & dismiss" action queues a mark-read task for target_agent=outlook-sync, handled by a dedicated read/write Outlook skill (second-brain-sync, spec outlook_sync_spec). This is the first agent-initiated mailbox write; it is isolated from the read-only email-agent skill and narrowly scoped to toggling a message read flag — never content, send, delete, move, or categorize. Mark-read tasks live on a separate board (outlook-sync) so the read-only agent never sees write tasks.',
  'active'
);
```

- [ ] **Step 2: Post the change-log to coordination.** MCP `execute_sql`:
```sql
insert into agent_coordination (source, category, subject, body, status)
values (
  'claude-code', 'change-log',
  'New outlook-sync board + second-brain-sync skill (mark-read)',
  'Added comms_mark_read(uuid) RPC and a new target_agent ''outlook-sync'' on the agent_tasks board. The /triage app can now queue mark-read tasks; the new Outlook-side skill second-brain-sync (spec key outlook_sync_spec) processes them and marks messages read. The read-only outlook-agent board and skills are unchanged. If you read the agent_tasks board, note outlook-sync rows are write tasks, self-terminating (done+filed), not lookups.',
  'open'
);
```

- [ ] **Step 3: Write the memory note.** Create `/Users/yorpeli/.claude/projects/-Users-yorpeli-Documents-Dev-SecondBrain/memory/project_comms_mark_read.md`:
```markdown
---
name: project-comms-mark-read
description: /triage "mark read in Outlook" queues outlook-sync tasks; second-brain-sync skill is the only mailbox-write surface
metadata:
  type: project
---

The comms `/triage` app has a "Mark read in Outlook & dismiss" button (Outlook/email
cards only). It calls the `comms_mark_read(uuid)` RPC, which dismisses the card and
queues an `agent_tasks` row for **`target_agent='outlook-sync'`** carrying the message
keys. A dedicated Outlook-side skill **`second-brain-sync`** (spec `outlook_sync_spec`,
synced via `npx tsx outlook/run.ts sync-spec` — which now syncs ALL `<!-- spec:KEY -->`
blocks) picks these up on demand and marks the message read.

This is the **first and only agent-initiated mailbox write**, deliberately isolated from
the read-only `second-brain-email-agent` skill and narrowly scoped to the read flag —
never content/send/delete/move. See [[project_comms_suggested_actions]] and the spec
`docs/superpowers/specs/2026-06-17-comms-mark-read-design.md`.
```
Then add this line to `/Users/yorpeli/.claude/projects/-Users-yorpeli-Documents-Dev-SecondBrain/memory/MEMORY.md` under "### Initiative work" or "### External connections":
```markdown
- [Comms mark-read → outlook-sync](project_comms_mark_read.md) — /triage "mark read in Outlook" queues outlook-sync tasks; second-brain-sync is the only mailbox-write skill
```

- [ ] **Step 4: Update doc prose.** In `comms-assistant/CLAUDE.md` (the triage-sweep section, near step 8) and `agents/comms-assistant.md`, add one line noting the new app action:
```markdown
- **Mark read (no reply needed):** In `/triage`, "Mark read in Outlook & dismiss" dismisses the card and queues an `outlook-sync` mark-read task — handled by the `second-brain-sync` Outlook skill (read flag only). For monitor/none items he just needs cleared from the inbox.
```

- [ ] **Step 5: Commit** (gated).
```bash
cd /Users/yorpeli/Documents/Dev/SecondBrain && git add comms-assistant/CLAUDE.md agents/comms-assistant.md && git commit -m "docs(comms): document mark-read action + outlook-sync skill"
```

---

## Self-Review

**Spec coverage:**
- RPC (queue + dismiss + log, Outlook-key gate, Teams skip) → Task 1. ✓
- App hook + channel-aware button in detail action bar → Task 4. ✓
- New `second-brain-sync` skill + `outlook_sync_spec` (mark-read type, mailbox-write rule, done+filed) → Task 3. ✓
- `sync-spec.ts` generalized to multiple markers → Task 2. ✓
- Error handling (prediction-not-found raise, no-key dismiss-only, optimistic dismiss) → Task 1 SQL + test. ✓
- Capability assumption (env may not flip read flag) → encoded in spec hard_rules (Task 3) + design doc. ✓
- Follow-ups (decision, coordination, memory, docs) → Task 5. ✓

**Type/name consistency:** `comms_mark_read(uuid)` / `p_prediction_id` used in RPC, hook, test. `target_agent='outlook-sync'`, `tags`=`['outlook-sync','mark-read']`, task `type`='mark-read' consistent across RPC, spec run_loop, and test asserts. `extractSpecs`/`syncSpec` names consistent across Task 2 impl, test, and run.ts. `onMarkRead` prop name consistent across triage.tsx and triage-detail.tsx.

**Placeholders:** none — all SQL, TS, and commands are concrete.
