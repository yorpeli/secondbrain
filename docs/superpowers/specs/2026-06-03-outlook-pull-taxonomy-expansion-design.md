# Outlook Pull Taxonomy Expansion — calendar-lookup, meeting-prep, person-digest (Design)

**Date:** 2026-06-03
**Status:** Approved
**Owner:** Claude Code, with Yonatan
**Builds on:** `2026-06-03-outlook-agent-bridge-design.md` (pull bridge), `2026-06-03-outlook-push-to-brain-design.md` (push)

## Problem

The pull bridge supports one task type, `thread-lookup`. Claude-for-Outlook can
also read the calendar and surface per-person email activity. Three high-value
pull capabilities are missing: looking at the calendar, prepping for a specific
meeting (the high-leverage one — the brain pulls related threads + context the
calendar can't), and digesting recent activity with a given person.

## Solution

Add three pull task types on the same backbone. Same pattern as `thread-lookup`:
the behavior lives in `context_store.outlook_agent_spec`; the frozen email-agent
skill executes whatever the spec defines; Claude Code queues requests and reads
results. The Outlook skills do not change.

### Task types

**1. `calendar-lookup`** — "what's on my calendar about X / this week"
- Input: `query?` (topic), `person?`, `timeframe` (default "next 7 days")
- Result: `{ events: OutlookEvent[], not_found }`

**2. `meeting-prep`** — "prep me for the meeting with X"
- Input: `meeting` (subject/keywords, required), `date?`
- Result: `{ event: OutlookEvent | null, related_threads: OutlookThread[], not_found }`
- Outlook finds the event AND the related email threads. Claude Code synthesizes
  the prep brief in-session (resolve attendees → person slugs, match initiatives,
  check `current_focus`). The brief is NOT produced by the agent or by code.

**3. `person-digest`** — "anything unanswered from Elad?"
- Input: `person` (required, name or slug), `timeframe` (default "last 14 days"), `focus?` (e.g. "unanswered")
- Result: `{ person: string, threads: PersonDigestThread[], not_found }`
  where `PersonDigestThread` is an `OutlookThread` plus optional `awaiting_reply: boolean`.

### Data shapes

New `OutlookEvent`:
```
{ subject, start, end, attendees: string[], organizer?, location?, online?: boolean, sensitive: boolean, subject_topic? }
```
`threads` reuses the existing `OutlookThread`. `PersonDigestThread = OutlookThread & { awaiting_reply?: boolean }`.

### Result display generalization (shared decision)

`check`/`results` currently assume `result_details.threads` and print "N thread(s)".
Generalize: detect the payload shape and print the right summary line —
- has `events` → "N event(s)"
- has `event` + `related_threads` → "meeting prep: <subject> + N related thread(s)"
- has `threads` → "N thread(s)"

`result <id>` already prints raw JSON, so it remains the universal detailed
viewer for any type. Implement the line logic as one helper
(`summarizeResultLine(result)`) reused by `results` and `check`.

### Privacy

Calendar events run through the existing `privacy_allowlist` + `sensitive_rule`.
Interviews, compensation, HR, medical, or personal events → persist only
`{subject_topic, sensitive:true}`, no details. Same discipline as email threads.

## Build surface (one plan — shared infrastructure)

1. **Spec** (`agents/outlook-agent.md` JSON block → `sync-spec`): update `run_loop`
   step 3 to accept `thread-lookup | calendar-lookup | meeting-prep | person-digest`
   (else fail); add `calendar_lookup`, `meeting_research`, `person_digest` sections
   with input_fields + steps + result shapes; add an `event` schema to
   `result_format`; extend `privacy_allowlist` with a calendar note; bump
   `version` to `1.2-calendar-and-digests`. Outlook skills unchanged.
2. **`lib/outlook.ts`:** add `OutlookEvent`, `CalendarResultDetails`,
   `MeetingPrepResultDetails`, `PersonDigestThread`, `PersonDigestResultDetails`;
   add `requestCalendarLookup()`, `requestMeetingPrep()`, `requestPersonDigest()`
   (each via a shared internal `queueOutlookTask(type, payload, title)` builder);
   add `summarizeResultLine(result)` and use it where results are printed.
3. **`outlook/run.ts`:** add commands `calendar`, `meeting-prep`, `digest`;
   route `results`/`check` thread-count line through `summarizeResultLine`.
4. **`CLAUDE.md`:** add natural-language triggers for the three (e.g. "prep me for
   the X meeting", "what's on my calendar about Y", "anything unanswered from Z").

## Out of scope (v1)

- Calendar *push* (creating events) — pull/read only.
- Auto-promotion of results — promotion stays Claude-Code + Yonatan-confirmed.
- A dedicated meeting-prep document artifact — the brief is delivered in-session;
  Yonatan can ask to file pieces of it via the existing promote path.

## Open dependency

Outlook's connection already has calendar read + `agent_tasks` write from prior
work. No new grants. The `filed` tag convention (from the status-lifecycle work)
applies: promoted/used results get tagged `filed` to drop off the sweep.
