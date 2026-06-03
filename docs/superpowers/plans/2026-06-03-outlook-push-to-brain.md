# Outlook Push-to-Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the reverse "push" direction to the Outlook bridge — Yonatan triggers a capture in Outlook, it lands unrouted on the `agent_tasks` board, and Claude Code lists it (`inbox`) for knowledge-based triage and promotion.

**Architecture:** Outlook stays dumb: a second thin skill creates an `inbound-capture` task (`created_by='claude-outlook'`, `target_agent='claude-code'`). All behavior lives in the shared `outlook_agent_spec`, extended with a `push` section. Claude Code reads captures via a new `inbox` CLI command + `listInboundCaptures()` helper, then triages in-session (reasoning over initiatives/people/current_focus) and promotes with `promoteToInitiativeMemory()` + provenance, marking the capture done with the existing `completeTask()`.

**Tech Stack:** TypeScript, `tsx`, `@supabase/supabase-js` via `lib/supabase.ts`, existing `lib/outlook.ts` / `lib/tasks.ts`. No test framework in this repo — verification is `npm run typecheck` + live CLI/`tsx -e` runs against Supabase. Commit after each task (to `main`, user-approved).

**Methodology note:** Bare `tsx -e` snippets that touch the DB MUST `await import('dotenv/config')` first — `lib/supabase.ts` throws at import without env vars. The CLI (`outlook/run.ts`) already imports `dotenv/config`, so CLI runs don't need it.

---

### Task 1: `lib/outlook.ts` — `InboundCapture` type + `listInboundCaptures()`

**Files:**
- Modify: `lib/outlook.ts` (append a new section at the end)

- [ ] **Step 1: Append the inbound-capture section to the END of `lib/outlook.ts`**

```typescript
// ─── Inbound captures (push direction: Outlook → board → triage) ────

export interface InboundCapture {
  id: string
  title: string
  note: string | null
  captured_at: string | null
  threads: OutlookThread[]
  created_at: string | null
}

/**
 * List pending inbound-capture tasks pushed from Outlook (created_by =
 * 'claude-outlook'). Parses the JSON description payload; rows whose payload
 * type is not 'inbound-capture' are skipped.
 */
export async function listInboundCaptures(limit = 20): Promise<InboundCapture[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, created_at')
    .eq('created_by', 'claude-outlook')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[outlook] Failed to read inbound captures:', error.message)
    return []
  }

  const rows = (data || []) as unknown as Array<{
    id: string
    title: string
    description: string | null
    created_at: string | null
  }>

  const captures: InboundCapture[] = []
  for (const row of rows) {
    let payload: any = {}
    try {
      payload = row.description ? JSON.parse(row.description) : {}
    } catch {
      payload = {}
    }
    if (payload.type !== 'inbound-capture') continue
    captures.push({
      id: row.id,
      title: row.title,
      note: payload.note ?? null,
      captured_at: payload.captured_at ?? null,
      threads: Array.isArray(payload.threads) ? payload.threads : [],
      created_at: row.created_at,
    })
  }
  return captures
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Live verify — insert a fake capture, list it, delete it**

Run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const sb = (await import('./lib/supabase.js')).getSupabase(); const payload = JSON.stringify({ type:'inbound-capture', note:'plan test note', captured_at:'2026-06-03', threads:[{ subject:'PLAN TEST thread', participants:['Chen Alcalay'], last_message_date:'2026-06-03', outlook_thread_id:'TEST', decisions:[], action_items:[], deadlines:[], sensitive:false }] }); await sb.from('agent_tasks').insert({ title:'Inbound: PLAN TEST thread', description:payload, target_agent:'claude-code', status:'pending', priority:'normal', created_by:'claude-outlook', tags:['outlook-agent','inbound-capture'] }); const m = await import('./lib/outlook.js'); const caps = await m.listInboundCaptures(); const mine = caps.find(c => c.title === 'Inbound: PLAN TEST thread'); console.log('found:', !!mine, '| note:', mine?.note, '| threads:', mine?.threads.length); await sb.from('agent_tasks').delete().eq('title','Inbound: PLAN TEST thread'); console.log('cleaned up'); })()"
```
Expected: `found: true | note: plan test note | threads: 1` then `cleaned up`.

- [ ] **Step 4: Commit**

```bash
git add lib/outlook.ts
git commit -m "feat(outlook): add listInboundCaptures for push-direction inbound tasks"
```

---

### Task 2: `outlook/run.ts` — `inbox` command

**Files:**
- Modify: `outlook/run.ts` (add a case + a usage line)

- [ ] **Step 1: Add the `inbox` usage line**

In `outlook/run.ts`, in the usage block printed when there is no command, add this line immediately after the `result <task-id>` line:

```
  inbox                                                   List pending inbound captures pushed from Outlook
```

- [ ] **Step 2: Add an `inbox` example**

In the same usage block, after the `npx tsx outlook/run.ts result ...` example line, add:

```
  npx tsx outlook/run.ts inbox
```

- [ ] **Step 3: Add the `inbox` case to the switch**

Insert this case immediately BEFORE the `case 'sync-spec':` block:

```typescript
      case 'inbox': {
        const { listInboundCaptures } = await import('../lib/outlook.js')
        const caps = await listInboundCaptures()
        if (caps.length === 0) {
          console.log('No pending inbound captures.')
          break
        }
        console.log(`${caps.length} pending inbound capture(s):`)
        for (const c of caps) {
          const t = c.threads[0]
          console.log(`\n${c.created_at?.slice(0, 10) ?? '????-??-??'}  ${c.id}`)
          console.log(`  ${c.title}`)
          if (c.note) console.log(`  note: ${c.note}`)
          if (t) console.log(`  participants: ${(t.participants ?? []).join(', ')}`)
        }
        break
      }

```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Run the command**

Run: `npx tsx outlook/run.ts inbox`
Expected: prints `No pending inbound captures.` (nothing is queued right now).

Run: `npx tsx outlook/run.ts`
Expected: usage block now includes the `inbox` command line and example.

- [ ] **Step 6: Commit**

```bash
git add outlook/run.ts
git commit -m "feat(outlook): add inbox command to list inbound captures"
```

---

### Task 3: Extend the spec with a `push` section + add the push skill

**Files:**
- Modify: `agents/outlook-agent.md` (spec JSON block, prose skill block, Claude Code side section)

This task edits the repo-master doc, then syncs the spec to `context_store`.

- [ ] **Step 1: Bump the spec version**

In `agents/outlook-agent.md`, inside the ```json spec block, replace:

```
  "version": "1.0-thread-lookup",
```
with:
```
  "version": "1.1-push",
```

- [ ] **Step 2: Broaden the purpose to cover push**

Replace:
```
  "purpose": "Process email-lookup tasks queued by other Second Brain agents. Read the mailbox, extract requested information under a strict privacy allowlist, and write structured results back to agent_tasks. Pull-only: never act unless a task asks you to.",
```
with:
```
  "purpose": "Two modes on the same board. PULL: process email-lookup tasks queued by other agents (run_loop + thread_lookup). PUSH: when Yonatan explicitly triggers it, capture the current thread and queue an inbound-capture task for Claude Code to triage (push). Read the mailbox only to satisfy a queued task or an explicit Yonatan push; extract under a strict privacy allowlist; write only to agent_tasks.",
```

- [ ] **Step 3: Update the PULL-ONLY hard rule to allow Yonatan-triggered push**

Replace:
```
    "PULL-ONLY: never read or summarize email except to satisfy an explicit task.",
```
with:
```
    "ACT ONLY ON DEMAND: read or summarize email only to satisfy (a) a task queued for you, or (b) an explicit Yonatan trigger to push the current thread. Never proactively scan the mailbox.",
```

- [ ] **Step 4: Add the `push` section to the spec JSON**

In the same ```json block, replace the tail (the end of `privacy_allowlist` and the root close):
```
    "sensitive_rule": "If a thread contains compensation, personnel/HR, legal, or otherwise sensitive content, DO NOT extract its details. Instead persist only: {\"subject_topic\": \"<short topic>\", \"sensitive\": true, \"note\": \"review in Outlook directly\"} and set result_summary to flag it. Never copy sensitive specifics into the database."
  }
}
```
with:
```
    "sensitive_rule": "If a thread contains compensation, personnel/HR, legal, or otherwise sensitive content, DO NOT extract its details. Instead persist only: {\"subject_topic\": \"<short topic>\", \"sensitive\": true, \"note\": \"review in Outlook directly\"} and set result_summary to flag it. Never copy sensitive specifics into the database."
  },
  "push": {
    "description": "Yonatan-triggered inbound capture. When Yonatan asks to push the CURRENT thread to the brain, summarize it under the privacy allowlist and INSERT ONE inbound-capture task for Claude Code to triage. Do NOT route it — Claude Code decides where it belongs.",
    "trigger": "Yonatan says 'push this to the brain', 'send this thread to Supabase', 'log this thread', or similar, while viewing a thread.",
    "note_rule": "If Yonatan's trigger message includes a free-text hint (e.g. 'push this — relevant to the vendor POC'), capture it as 'note'. NEVER ask a follow-up question for a note; if none is given, set note to null.",
    "steps": [
      "Extract the CURRENT thread under privacy_allowlist, using the same fields as result_format.result_details_jsonb.threads (subject, participants, last_message_date, outlook_thread_id, and any decisions/action_items/deadlines present).",
      "If the thread is sensitive, capture only {subject_topic, sensitive:true} per sensitive_rule — no specifics.",
      "Build the capture_payload below and INSERT one task: INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by, tags) VALUES ('Inbound: <subject>', '<capture_payload as JSON text>', 'claude-code', 'pending', 'normal', 'claude-outlook', ARRAY['outlook-agent','inbound-capture']);",
      "Confirm to Yonatan in chat: the subject captured and that it is queued for Claude Code triage. Do not claim to have filed it anywhere — Claude Code routes it later."
    ],
    "capture_payload": {
      "type": "inbound-capture",
      "note": "free-text hint from Yonatan, or null",
      "captured_at": "YYYY-MM-DD",
      "threads": "array, same shape as result_format.result_details_jsonb.threads"
    }
  }
}
```

- [ ] **Step 5: Add the push skill block (before the spec marker)**

In `agents/outlook-agent.md`, immediately AFTER the closing ``` of the existing "Outlook-side skill" ```markdown block (the pull skill, which ends just before the line `## Operating spec ...`) and BEFORE the `## Operating spec` heading, insert:

````markdown
## Outlook-side skill #2 — push to brain (created once, then frozen)

```markdown
---
name: second-brain-push-to-brain
description: Use when Yonatan says "push this to the brain", "send this thread to
  Supabase", "log this thread", or similar while viewing an email thread. Captures
  the current thread to the Second Brain board for Claude Code to triage.
---

# Second Brain — Push to Brain

You push the CURRENT Outlook thread into the Second Brain. Your behavior is
defined by the database spec, not hardcoded here.

## 1. Load the operating spec FIRST
Query Supabase: `SELECT content FROM context_store WHERE key = 'outlook_agent_spec';`
Follow its `push` section exactly. The spec wins over this skill.

## 2. Capture and queue (per the spec's push.steps)
Summarize the current thread under the privacy allowlist, capture an inline note
if Yonatan gave one (never ask for one), and INSERT one inbound-capture task.

## 3. Report to Yonatan
Confirm the subject captured and that it is queued for Claude Code triage.
```
````

- [ ] **Step 6: Update the "Claude Code side" section**

At the end of `agents/outlook-agent.md`, replace:
```
## Claude Code side

Use `lib/outlook.ts` / `npm run outlook:run`:
- `request` — queue a thread-lookup
- `results` / `result <id>` — read what came back
- promote results into initiative memory via `promoteToInitiativeMemory()` (with
  confirmation + `[via email: …]` provenance) — never auto-promote sensitive threads
```
with:
```
## Claude Code side

Use `lib/outlook.ts` / `npm run outlook:run`:
- `request` — queue a thread-lookup (pull)
- `results` / `result <id>` — read pull results
- `inbox` — list inbound captures pushed from Outlook (`listInboundCaptures()`)
- triage an inbound capture: reason over initiatives/people/current_focus, suggest
  a destination, and on Yonatan's confirm promote via `promoteToInitiativeMemory()`
  (with `[via email: …]` provenance), then mark the capture done with `completeTask()`
- never auto-promote sensitive threads
```

- [ ] **Step 7: Typecheck (no code changed, but confirm nothing broke) + sync the spec**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run outlook:run sync-spec`
Expected: `Synced outlook_agent_spec → context_store. version: 1.1-push`

- [ ] **Step 8: Verify the pushed spec in the DB has the push section**

Run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const sb = (await import('./lib/supabase.js')).getSupabase(); const { data } = await sb.from('context_store').select('content').eq('key','outlook_agent_spec').single(); console.log('version:', data.content.version, '| has push:', !!data.content.push, '| note_rule:', (data.content.push?.note_rule||'').slice(0,40)); })()"
```
Expected: `version: 1.1-push | has push: true | note_rule: If Yonatan's trigger message includes a fr`

- [ ] **Step 9: Commit**

```bash
git add agents/outlook-agent.md
git commit -m "feat(outlook): add push-to-brain mode to spec + second Outlook skill"
```

---

## Self-Review

**Spec coverage** (against `2026-06-03-outlook-push-to-brain-design.md`):
- Push skill (Outlook, thin, second frozen skill) → Task 3 Step 5 ✅
- Optional note, never prompted → spec `push.note_rule` (Task 3 Step 4) + skill text (Step 5) ✅
- Inbound task contract (`target_agent='claude-code'`, `created_by='claude-outlook'`, `type='inbound-capture'`, payload) → spec `push.steps`/`capture_payload` (Task 3 Step 4); consumed by `listInboundCaptures()` (Task 1) ✅
- `inbox` CLI + `listInboundCaptures()` → Tasks 2, 1 ✅
- Triage = Claude Code in-session (not code); promote via existing `promoteToInitiativeMemory`; mark done via existing `completeTask` → documented in `agents/outlook-agent.md` Claude Code side (Task 3 Step 6); no code needed ✅
- Same privacy allowlist + confirmation gate → spec reuses `privacy_allowlist`; push.steps reference it + sensitive_rule ✅
- No schema changes / no new tables → confirmed; reuses `agent_tasks` ✅

**Deviation from design (intentional, DRY):** design listed a `completeInboundCapture()` helper; `lib/tasks.ts` already exports `completeTask(taskId, summary, details?)` which marks an `agent_tasks` row done with summary + completed_at. The plan reuses `completeTask` instead of adding a near-duplicate. No new completion helper is built.

**Placeholder scan:** No TBD/TODO. All JSON and code given verbatim. The only "fill from context" is none — even the spec edits are exact old→new strings.

**Type consistency:** `InboundCapture` (Task 1) is consumed by the `inbox` case (Task 2) via `listInboundCaptures()`; fields used in Task 2 (`created_at`, `id`, `title`, `note`, `threads[0].participants`) all exist on `InboundCapture` / `OutlookThread`. `OutlookThread` is the existing type from the pull build — `threads` reuses it.

**Ordering note:** Tasks are independent enough to run 1→2→3. Task 2 depends on Task 1's `listInboundCaptures` export (do 1 first). Task 3 is doc-only and can run anytime, but is placed last so the spec version bump lands after the code that reads captures exists.
