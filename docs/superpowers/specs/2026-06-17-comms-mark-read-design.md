# Comms Triage — "Mark read in Outlook & dismiss"

**Date:** 2026-06-17
**Status:** Approved (design)
**Surface:** `/triage` app (`app/src/`) + a new dedicated Outlook-side skill

## Problem

The `/triage` app surfaces every comm that needs attention — including
`monitor`/`none` items that Yonatan does **not** need to respond to, only to
acknowledge. Today those linger in two places: as open cards in the app, and as
**unread** mail in Outlook. He wants a single action that clears both: dismiss
the card *and* mark the underlying email read in Outlook, without leaving the
app and without sending anything.

## Constraint being deliberately relaxed

The entire MSFT side is read-only today. The outlook agent's hard rule is "only
ever write to the `agent_tasks` table," and Yonatan acts in his own mailbox
himself. Marking a message read is the **first agent-initiated mailbox write**.
It is the most benign possible one — it flips a read flag, touches no content,
sends nothing, is reversible — but it crosses the read-only line, so the
capability is **isolated in its own dedicated Outlook skill** rather than folded
into the existing read-only skills.

## Architecture

```
/triage app (anon supabase client)
   │  button: "✓ Mark read in Outlook & dismiss"  (channel === 'outlook' only)
   ▼
comms_mark_read(p_prediction_id)        ── Postgres RPC, SECURITY DEFINER
   ├─ INSERT agent_tasks (target_agent='outlook-sync', tags=['outlook-sync','mark-read'])
   ├─ UPDATE comms_predictions SET status='dismissed'
   └─ INSERT comms_feedback (kind='status', payload {to:'dismissed', via:'mark-read'})
   ▼
agent_tasks board  (target_agent = 'outlook-sync')
   ▼  (next time Yonatan runs the sync skill in Outlook — batch)
second-brain-sync skill  ──loads──▶ context_store.outlook_sync_spec
   ├─ find message by internet_message_id → message_id → web_link → subject
   ├─ mark it READ  (the only permitted mailbox mutation)
   └─ write back: status='done', tag 'filed'  (self-terminating, nothing to promote)
```

Batch, not instant: tasks queue in the app and flush whenever Yonatan next runs
the sync skill in Outlook. Several monitors marked across a session all clear in
one agent run.

## Components

### 1. RPC — `comms_mark_read(p_prediction_id uuid)`
New migration. SECURITY DEFINER, mirrors `comms_apply_feedback` (the app uses the
anon client, so a direct `INSERT into agent_tasks` is RLS-blocked — an RPC is the
established path). In one transaction:
- Read the prediction's stored keys: `internet_message_id`, `message_id`,
  `web_link`, `subject` (from `card->'email'->>'subject'` fallback), `channel`.
  These are already top-level columns / card fields on `comms_predictions`.
- **Queue** (only when an Outlook message key exists — `internet_message_id` or
  `message_id` or `web_link`):
  `INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by, tags)`
  with `target_agent='outlook-sync'`, `status='pending'`, `priority='normal'`,
  `created_by='comms-triage-app'`, `tags=ARRAY['outlook-sync','mark-read']`,
  `description` = JSON text `{type:'mark-read', internet_message_id, message_id,
  web_link, subject, prediction_id}`.
- **Dismiss**: `UPDATE comms_predictions SET status='dismissed', updated_at=now()
  WHERE id=p_prediction_id`.
- **Log signal**: a `comms_feedback` row via the same path
  `comms_apply_feedback` uses, kind `status`, payload `{to:'dismissed',
  via:'mark-read'}` — marking a *reply* card read is a useful learning signal
  ("this didn't actually need a response"), so the distill loop sees it.
- If the prediction has no Outlook key (e.g. a Teams card): still dismiss + log,
  but do **not** queue a task. Return a flag indicating whether a task was queued.

### 2. App — hook + button
- `app/src/hooks/use-triage.ts`: add `useMarkRead()` — a mutation calling
  `supabase.rpc('comms_mark_read', { p_prediction_id })`, invalidating
  `['triage']` on success so the card drops off the open list.
- `app/src/components/triage/triage-detail.tsx`: add
  **`✓ Mark read in Outlook & dismiss`** to the pinned action bar (next to
  Copy/Save). Rendered only for `channel === 'outlook'` cards. Teams cards keep
  the normal dismiss path (Teams read state is a different API — out of scope).

### 3. New Outlook-side skill `second-brain-sync` + spec `outlook_sync_spec`
Both authored as blocks in `agents/outlook-agent.md`.
- **Skill block** (frozen thin skill, like the other two): triggers on "sync
  second brain", "/sync-second-brain", "mark these read", "process second brain
  sync tasks". Loads `context_store.outlook_sync_spec` and obeys it.
- **Spec block** `<!-- spec:outlook_sync_spec -->`:
  - `run_loop`: read spec (state version) → `SELECT id, description FROM
    agent_tasks WHERE target_agent='outlook-sync' AND status='pending' ORDER BY
    created_at` → per task parse `description.type` (supported: `mark-read`;
    unknown → `failed` "unsupported sync type <type>") → claim
    (`status='picked-up'`) → execute → write back → report to Yonatan (count
    marked read, one line each, flag any not found).
  - `mark_read` section: find the message by `internet_message_id` (preferred) →
    `message_id` → `web_link` → `subject`; mark it read; on success
    `status='done'` + append tag `filed` (self-terminating — nothing for Claude
    Code to promote, so it won't linger in the `check` sweep); on
    not-found/unsupported `status='failed'` with a clear `result_summary`.
  - `hard_rules`: ACT ONLY ON DEMAND (only when Yonatan triggers this skill);
    Supabase write scope = only `agent_tasks` (its own rows); **MAILBOX write
    scope = the only permitted mutation is toggling a message's read flag, and
    only for a message a mark-read task names by ID — never content, send,
    delete, or move.**

### 4. `outlook/sync-spec.ts` — generalize to multiple specs
Replace single-marker extraction with a scan of every `<!-- spec:KEY -->` marker
(the marker already encodes the destination key). Upsert each block to its
`context_store` key. `npm run outlook:run sync-spec` then pushes both
`outlook_agent_spec` and `outlook_sync_spec`; the CLI prints each key + version.

## Error handling
- **RPC**: prediction not found → raise. No Outlook key → dismiss + log, skip
  queue (returns `queued:false`).
- **App**: optimistic — the card is dismissed as soon as the RPC succeeds. The
  mark-read runs later in Outlook; if it fails (message not found, or the
  Claude-for-Outlook environment can't toggle a read flag), the card stays
  dismissed and the email simply stays bold — visible in the sync skill's report,
  flippable by hand. No resurfacing.
- **Capability assumption**: whether Claude-for-Outlook can flip a read flag
  depends on what that environment exposes. The spec instructs it to; if the
  action is unavailable, it reports "couldn't mark read" rather than failing
  silently. First real run is the test.

## Testing
- **RPC**: call `comms_mark_read` against a real open Outlook-channel prediction;
  assert a task row appears for `outlook-sync` with the right keys, the card
  flips to `dismissed`, and a `comms_feedback` row is logged.
- **App**: typecheck/build; click-through — button appears only on Outlook cards,
  card drops off the list on click.
- **sync-spec**: run `sync-spec`, assert both `outlook_agent_spec` and
  `outlook_sync_spec` upserted with correct versions.
- **Outlook skill**: cannot be tested headless (needs the Outlook environment) —
  first real run validates it.

## Follow-ups (post-merge)
- `project_decisions` row + memory note: first agent-initiated mailbox write,
  isolated in the `second-brain-sync` skill (policy shift worth recording).
- `agent_coordination` change-log entry: new spec/skill + new `outlook-sync`
  target_agent on the board (affects anyone reading the agent_tasks board).
- Update `agents/outlook-agent.md` prose + `comms-assistant` docs to mention the
  mark-read path and the new skill.

## Out of scope (YAGNI)
- Bulk / multi-select mark-read (single card, detail action bar only).
- Teams read-state syncing.
- Any other mailbox write (move, flag, categorize, send) — the sync skill is
  deliberately limited to the read flag.
