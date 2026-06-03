# Outlook Push-to-Brain (Inbound Capture) — Design

**Date:** 2026-06-03
**Status:** Approved
**Owner:** Claude Code, with Yonatan
**Builds on:** `2026-06-03-outlook-agent-bridge-design.md` (the pull-direction bridge)

## Problem

The pull bridge lets Claude Code request lookups from Outlook. But often Yonatan
is *already reading* a thread in Outlook and wants to send it into the Second
Brain — "log this somewhere useful." Forcing him to decide the destination at
capture time (which initiative? which person?) is friction, and Outlook lacks
the system knowledge to route it well anyway.

## Solution: dumb capture, smart triage

Outlook captures a clean summary and drops it on the board, unrouted. Claude
Code — which has the initiatives, people, `current_focus`, and embeddings —
reads it and **suggests** the destination and action. The intelligence lives
where the knowledge is; Outlook stays a thin, frozen skill.

This is the reverse direction of the pull bridge, on the same backbone and the
same `agent_tasks` board.

```
You in Outlook                board (agent_tasks)           Claude Code
──────────────                ───────────────────           ───────────
trigger push skill on a  ───▶ INSERT inbound-capture    ◀── npm run outlook:run inbox
thread (+ optional note)      created_by='claude-outlook'     → lists pending captures
                              type='inbound-capture'          → I read summary + note,
                              status='pending'                  search initiatives/people/
                                                                current_focus/embeddings,
                              status='done'           ◀────────SUGGEST destination + action
                                                                → on your confirm, promote
                                                                  (provenance + [via email])
```

## Design decisions

1. **Unrouted capture (destination type D).** Yonatan does not specify a
   destination in Outlook. The capture lands without routing; Claude Code
   proposes where it belongs.
2. **Optional note, never prompted.** If Yonatan includes a hint inline ("push
   this — relevant to the vendor POC"), the skill captures it as `note`. The
   skill MUST NOT ask a follow-up question for the note — bare "push this to the
   brain" must work with zero extra friction.
3. **Smart triage is Claude Code's job, not the CLI's.** The `inbox` command
   only lists raw captures. The routing suggestion (which initiative/person,
   what action) is produced by Claude Code reasoning over system knowledge, then
   confirmed by Yonatan.
4. **Same privacy allowlist and confirmation gate as pull.** Outlook writes only
   `agent_tasks`, summaries only, never raw body. Nothing reaches a human table
   until Yonatan confirms a suggestion. Sensitive threads are flagged, never
   auto-promoted.

## The push skill (Outlook, thin — second frozen skill)

A second skill installed once in Claude-for-Outlook. Trigger phrases: "push this
to the brain", "send this thread to Supabase", "log this thread". Behavior:

1. Load `outlook_agent_spec` from `context_store` (same spec as pull).
2. Follow the spec's new `push` section: extract the CURRENT thread under the
   privacy allowlist; if Yonatan's trigger included a free-text hint, capture it
   as `note` (do NOT prompt for one if absent).
3. INSERT one `inbound-capture` task (contract below).
4. Confirm to Yonatan in chat what was captured (subject + that it's queued).

Like the pull skill, it carries no domain logic — all behavior is in the spec.

## Inbound task contract (written by Outlook)

A row in `agent_tasks`:
- `target_agent = 'claude-code'`
- `created_by = 'claude-outlook'`
- `type = 'inbound-capture'` (in the JSON `description` payload)
- `status = 'pending'`
- `title` = e.g. `Inbound: <thread subject>`
- `tags = ['outlook-agent','inbound-capture']`
- `description` (JSON):

```json
{
  "type": "inbound-capture",
  "note": "free-text hint from Yonatan, or null",
  "captured_at": "YYYY-MM-DD",
  "threads": [{
    "subject": "string",
    "participants": ["Full Name"],
    "last_message_date": "YYYY-MM-DD",
    "outlook_thread_id": "pointer back to Outlook",
    "decisions": ["..."],
    "action_items": [{"who": "...", "what": "...", "due": "YYYY-MM-DD or null"}],
    "deadlines": ["..."],
    "sensitive": false
  }]
}
```

Reuses the same `threads[]` shape as the pull result contract, so existing types
in `lib/outlook.ts` (`OutlookThread`) apply.

## Claude Code triage

**CLI — list raw captures:**
`npm run outlook:run inbox` → `listInboundCaptures()` in `lib/outlook.ts` queries
`agent_tasks` where `created_by = 'claude-outlook'`, `status = 'pending'`,
description `type = 'inbound-capture'`, ordered by `created_at`. Prints subject,
note, participants, and a one-line summary per capture.

**Suggestion (Claude Code, in-session, not code):** For each capture, Claude Code:
1. Reads the summary + `note`.
2. Resolves participant names → person slugs; matches the topic to initiatives
   (keyword + `searchByType(query, ['initiative','initiative_memory','initiative_context'])`),
   and checks `current_focus`.
3. Proposes: a destination (initiative memory, a person, an action item, or
   "unsure — where do you want it?") and the concrete change.
4. On Yonatan's confirm, promotes — initiative memory via the existing
   `promoteToInitiativeMemory()` (provenance `[via email: …]`); other
   destinations handled per their table. Marks the capture task `done` with a
   `result_summary` noting where it was filed.

Unrouted/uncertain captures are surfaced to Yonatan, never guessed into a table.

## Build scope (v1)

1. Extend `context_store.outlook_agent_spec` with a `push` section documenting
   the inbound-capture behavior + the "note: allow, never prompt" rule; bump
   `version`; keep the repo-master `agents/outlook-agent.md` as source of truth
   and `sync-spec` it.
2. Add the push skill markdown to `agents/outlook-agent.md` (a second fenced
   skill block, alongside the existing pull skill).
3. `lib/outlook.ts`: add `listInboundCaptures()` (+ an `InboundCapture` type) and
   `completeInboundCapture(taskId, summary)` to mark a capture done after filing.
4. `outlook/run.ts`: add the `inbox` command.

No new tables, no schema changes. The promote path reuses existing helpers.

## Out of scope (v1)

- Outlook resolving destinations itself (it stays dumb).
- Auto-promoting without Yonatan's confirmation.
- Destination types B (person) and C (action item) as *dedicated* push targets —
  Claude Code can still file a capture to a person or action item during triage,
  but there is no separate Outlook-side flow for them.

## Open dependency

Outlook's Supabase connection needs `INSERT` on `agent_tasks` (it already has
this from the pull bridge's write tests). No new grants.
