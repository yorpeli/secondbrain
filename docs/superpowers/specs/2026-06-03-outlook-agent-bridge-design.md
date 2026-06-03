# Outlook Agent — Email & Calendar Bridge (Design)

**Date:** 2026-06-03
**Status:** Approved (v1 connectivity + thread-lookup proven end-to-end)
**Owner:** Claude Code, with Yonatan

## Problem

Yonatan's work email and calendar live in Payoneer's Microsoft 365, which **does
not permit external connectors** from this account. That rules out a direct
Outlook MCP connector and rules out (on compliance grounds) driving a browser
into the work mailbox. Yet a large amount of decision/commitment/status context
lives in email and meetings and never reaches the Second Brain.

The available sanctioned surface is **Claude-for-Outlook** — Claude running
*inside* Outlook, which can read the mailbox/calendar and (critically) can be
given **Supabase access**.

## Solution: a third surface on the shared backbone

The Second Brain already treats the database as the shared backbone between two
surfaces — Claude.ai Chat ("the Brain") and Claude Code ("the Hands"). This adds
a **third surface: Claude-for-Outlook ("the Eyes," on email + calendar)**, which
communicates through the existing `agent_tasks` board. No new architecture; a new
agent slug: **`outlook-agent`**.

```
Claude Code / Chat            agent_tasks board              Claude-for-Outlook
─────────────────             ─────────────────              ──────────────────
write thread-lookup task ───▶ status: pending          ◀─── Yonatan runs skill → drain queue
  target_agent=                                              claim → picked-up_by
  'outlook-agent'                                            read mail/calendar, extract (allowlist)
read results, promote    ◀─── result_summary +          ◀─── write back → status: done
  to brain (Yonatan confirms) result_details (jsonb)
```

### Core design decisions

1. **Pull-only.** Outlook never acts unless a task explicitly asks it to. No
   proactive inbox scanning. (Loop 1: Yonatan drains the queue manually. Loop 2
   — also posting to `agent_coordination` — is a future add-on once trusted.)
2. **Agent-tables-only writes.** Outlook writes ONLY to `agent_tasks`. It never
   writes to human tables (`people`, `meetings`, `meeting_action_items`,
   `content_sections`, `initiatives`). Claude Code promotes results into those
   after Yonatan confirms.
3. **Privacy allowlist.** Outlook persists *pointers and summaries*, never raw
   email. Sensitive content collapses to a flag. (Details below.)
4. **Thin skill, smart spec.** The Outlook skill is a ~10-line bootstrap loader.
   All behavior lives in a DB spec (`context_store.outlook_agent_spec`) that
   Claude Code owns. The contract evolves by editing one DB row; the Outlook
   skill never changes.
5. **Provenance.** Anything promoted from email is clearly labeled as
   email-sourced and traceable to its thread.

## The thin-skill / smart-spec mechanism

Claude-for-Outlook cannot receive a file from this repo. Distribution is solved
by storing the operating spec **in the database**:

- **Repo master:** `agents/outlook-agent.md` (human-readable, version-controlled).
- **Machine copy:** `context_store.outlook_agent_spec` (jsonb) — what Outlook
  reads at runtime. Synced from the repo master (repo = source of truth), same
  pattern as the workspace `memory.md` ↔ `content_sections` sync.
- **Outlook skill:** hardcodes only the two stable facts — *where the spec lives*
  and *the task query*. On each run it loads the spec and obeys it. If skill and
  spec disagree, the spec wins.

Result: adding task types (`person-digest`, `topic-sweep`, `extract-commitments`,
`meeting-research`/`calendar-lookup`) or tightening the allowlist is a one-row DB
edit. The Outlook skill is frozen after initial setup.

## Task contract (request — written by Claude Code / Chat)

A row in `agent_tasks`:
- `target_agent = 'outlook-agent'`, `created_by = 'claude-code'` (or `'claude-chat'`)
- `status = 'pending'`, human-readable `title`
- `description` = JSON payload. v1 type: `thread-lookup`:

```json
{
  "type": "thread-lookup",
  "query": "payer rollout status",
  "person": "Chen Alcalay",
  "person_slug": "chen-alcalay",
  "timeframe": "last 60 days",
  "extract": ["summary", "decisions", "action_items", "deadlines"],
  "initiative_slug": "optional routing hint"
}
```

`type` is an open taxonomy. v1 implements `thread-lookup` only; other names are
reserved and slot in via spec edits with no contract change.

## Result contract (response — written by Outlook)

On the same row: `status = 'done'` (or `'failed'`), plus:
- `result_summary` (text) — human-readable answer, **summaries only**
- `result_details` (jsonb):

```json
{
  "threads": [{
    "subject": "string",
    "participants": ["Full Name"],
    "last_message_date": "YYYY-MM-DD",
    "outlook_thread_id": "stable pointer back to Outlook",
    "decisions": ["..."],
    "action_items": [{"who": "...", "what": "...", "due": "YYYY-MM-DD or null"}],
    "deadlines": ["..."],
    "sensitive": false
  }],
  "not_found": false,
  "initiative_slug": "passed through from the task if present"
}
```

## Privacy allowlist

**May persist:** Claude-generated summaries of decisions/action items/
commitments/deadlines; participant **names** + dates; subject + topic tag;
Outlook thread/message ID (pointer, not content).

**Never persist:** verbatim email body text; attachments or their contents;
anything from a thread not explicitly targeted; comp/personnel/legal/sensitive
specifics.

**Sensitive rule:** if a thread contains compensation, personnel/HR, legal, or
otherwise sensitive content, do NOT extract details — persist only
`{"subject_topic": "...", "sensitive": true, "note": "review in Outlook"}` and
flag it in `result_summary`. When in doubt, treat as sensitive.

## Promote step (Claude Code, on Yonatan's confirmation)

When Claude Code reads a `done` task it:
1. Resolves participant names → person slugs.
2. Shows Yonatan the extracted decisions/action items.
3. **Only after confirmation**, promotes into human tables — initiative memory
   (`content_sections`), `meeting_action_items`, etc.

**Provenance convention (required):**
- Initiative-memory entries carry an inline marker:
  `[via email: <person>, <thread subject>, <date>]`, and retain
  `outlook_thread_id` in structured fields where available.
- Action items promoted to `meeting_action_items` get an `email-sourced` tag.
- Email-sourced items never read as confirmed decisions unless the email
  explicitly states the decision.
- Sensitive-flagged threads are never auto-promoted — surfaced for Yonatan to
  handle directly in Outlook.

**Staging:** the result sits in `agent_tasks.result_*` until promoted — that *is*
the staging area. No dedicated holding table needed; reuse existing human tables.

## What was proven (2026-06-03)

End-to-end, with the thin skill unchanged across all three:
1. **Connectivity (spec read + board read)** — v0.1 spec. Passed.
2. **Write path (claim + writeback)** — v0.2 spec. Verified in DB:
   `status=done`, `picked_up_by=outlook-agent`, result fields populated.
3. **Real thread-lookup** — v1.0 spec, query "payer rollout status" / Chen
   Alcalay. Returned 3 on-topic threads with correct extractions; **allowlist
   held** (summaries only, no raw body, real thread-id pointers).

## Build scope

**v1 (now):**
1. `agents/outlook-agent.md` — repo master contract + the Outlook skill snippet;
   document the repo→`context_store.outlook_agent_spec` sync rule.
2. `lib/outlook.ts` + thin CLI (`outlook/run.ts`), mirroring `ppp/`:
   - `request` — queue a lookup task in one command
   - `results` — read completed tasks
   - `promote` — file a result into initiative memory / action items, with
     confirmation gate + provenance markers
3. `agent_registry` row for `outlook-agent`.
4. CLAUDE.md agents-table entry.

**Later (spec edits only, no skill change):**
- Task types: `person-digest`, `topic-sweep`, `extract-commitments`,
  `meeting-research` / `calendar-lookup` (calendar uses the same surface).
- Loop 2: Outlook also posts results to `agent_coordination`
  (`source = 'claude-outlook'`).

## Out of scope (v1)

- Proactive/scheduled inbox scanning (stays pull-only).
- Any write by Outlook to human tables.
- Promoting sensitive-flagged content.

## Open dependency

Claude-for-Outlook's Supabase connection needs `SELECT` on `context_store` +
`agent_tasks` and `UPDATE`/`INSERT` on `agent_tasks` only — never grant it write
access to human tables.
