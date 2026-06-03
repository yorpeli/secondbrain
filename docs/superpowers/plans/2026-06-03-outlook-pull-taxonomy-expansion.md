# Outlook Pull Taxonomy Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three pull task types to the Outlook bridge — `calendar-lookup`, `meeting-prep`, `person-digest` — with a shape-aware result display, on the existing spec-driven backbone.

**Architecture:** New task types are defined in the shared `outlook_agent_spec` (the frozen email-agent skill executes whatever the spec says — no Outlook skill change). The Claude Code side adds typed request helpers (via a shared `queueOutlookTask` builder), new result-detail types incl. `OutlookEvent`, a shape-aware `summarizeResultLine()` used by `results`/`check`, and three CLI commands.

**Tech Stack:** TypeScript, `tsx`, `@supabase/supabase-js` via `lib/supabase.ts`, existing `lib/outlook.ts` / `outlook/run.ts`. No test framework — verification is `npm run typecheck` + live CLI/`tsx -e` runs against Supabase. Commit after each task (to `main`, user-approved).

**Methodology note:** Bare `tsx -e` snippets that touch the DB MUST `await import('dotenv/config')` first. The CLI loads dotenv itself.

---

### Task 1: `lib/outlook.ts` — types, request builders, shape-aware summary

**Files:**
- Modify: `lib/outlook.ts` (append a new section at the end)

- [ ] **Step 1: Append this section to the END of `lib/outlook.ts`**

```typescript
// ─── Calendar / meeting-prep / person-digest (pull task types) ────

export interface OutlookEvent {
  subject: string
  start: string
  end: string
  attendees: string[]
  organizer?: string
  location?: string
  online?: boolean
  sensitive: boolean
  subject_topic?: string
}

export interface CalendarResultDetails {
  events: OutlookEvent[]
  not_found: boolean
}

export interface MeetingPrepResultDetails {
  event: OutlookEvent | null
  related_threads: OutlookThread[]
  not_found: boolean
}

export type PersonDigestThread = OutlookThread & { awaiting_reply?: boolean }

export interface PersonDigestResultDetails {
  person: string
  threads: PersonDigestThread[]
  not_found: boolean
}

/** Shared builder: queue any pull task for the Outlook agent. Returns task id. */
async function queueOutlookTask(
  type: string,
  payload: Record<string, unknown>,
  title: string
): Promise<string | null> {
  return createTask({
    title,
    description: JSON.stringify({ type, ...payload }),
    targetAgent: AGENT_SLUG,
    createdBy: 'claude-code',
    tags: ['outlook-agent', type],
  })
}

export interface CalendarLookupInput {
  query?: string
  person?: string
  personSlug?: string
  timeframe?: string
}

/** Queue a calendar-lookup. Returns the task id. */
export async function requestCalendarLookup(input: CalendarLookupInput): Promise<string | null> {
  const payload = {
    ...(input.query ? { query: input.query } : {}),
    ...(input.person ? { person: input.person } : {}),
    ...(input.personSlug ? { person_slug: input.personSlug } : {}),
    timeframe: input.timeframe ?? 'next 7 days',
  }
  const label = input.query ?? input.person ?? payload.timeframe
  return queueOutlookTask('calendar-lookup', payload, `Calendar: ${label}`)
}

export interface MeetingPrepInput {
  meeting: string
  date?: string
}

/** Queue a meeting-prep (find the event + related threads). Returns the task id. */
export async function requestMeetingPrep(input: MeetingPrepInput): Promise<string | null> {
  const payload = {
    meeting: input.meeting,
    ...(input.date ? { date: input.date } : {}),
  }
  return queueOutlookTask('meeting-prep', payload, `Meeting prep: ${input.meeting}`)
}

export interface PersonDigestInput {
  person: string
  personSlug?: string
  timeframe?: string
  focus?: string
}

/** Queue a person-digest. Returns the task id. */
export async function requestPersonDigest(input: PersonDigestInput): Promise<string | null> {
  const payload = {
    person: input.person,
    ...(input.personSlug ? { person_slug: input.personSlug } : {}),
    timeframe: input.timeframe ?? 'last 14 days',
    ...(input.focus ? { focus: input.focus } : {}),
  }
  return queueOutlookTask('person-digest', payload, `Digest: ${input.person}`)
}

/**
 * Shape-aware one-line summary of a result, across all pull task types.
 * Inspects result_details (which varies by type) defensively.
 */
export function summarizeResultLine(result: OutlookResult): string {
  const d = result.result_details as any
  if (!d) return result.result_summary ?? '(no result)'
  if (Array.isArray(d.events)) return `${d.events.length} event(s)`
  if (d.event !== undefined || Array.isArray(d.related_threads)) {
    const n = Array.isArray(d.related_threads) ? d.related_threads.length : 0
    const subj = d.event?.subject ?? 'meeting'
    return `meeting prep: ${subj} + ${n} related thread(s)`
  }
  if (Array.isArray(d.threads)) return `${d.threads.length} thread(s)`
  return result.result_summary ?? '(no result)'
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Live verify the request helpers + summary (insert, inspect, delete)**

Run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const m = await import('./lib/outlook.js'); const sb = (await import('./lib/supabase.js')).getSupabase(); const ids = []; ids.push(await m.requestCalendarLookup({ timeframe:'next 7 days', query:'PLANTEST' })); ids.push(await m.requestMeetingPrep({ meeting:'PLANTEST sync' })); ids.push(await m.requestPersonDigest({ person:'PLANTEST Person' })); console.log('created:', ids.filter(Boolean).length); const { data } = await sb.from('agent_tasks').select('title, description').in('id', ids); for (const r of data) console.log(' -', r.title, '=>', JSON.parse(r.description).type); console.log('summary samples:', m.summarizeResultLine({ id:'x', title:'t', status:'done', result_summary:null, completed_at:null, result_details: { events:[{},{}], not_found:false } }), '|', m.summarizeResultLine({ id:'x', title:'t', status:'done', result_summary:null, completed_at:null, result_details: { event:{subject:'Sync'}, related_threads:[{}], not_found:false } })); await sb.from('agent_tasks').delete().in('id', ids); console.log('cleaned up'); })()"
```
Expected: `created: 3`, three lines mapping titles to types (`calendar-lookup`, `meeting-prep`, `person-digest`), `summary samples: 2 event(s) | meeting prep: Sync + 1 related thread(s)`, then `cleaned up`.

- [ ] **Step 4: Commit**

```bash
git add lib/outlook.ts
git commit -m "feat(outlook): add calendar/meeting-prep/person-digest request helpers + shape-aware summary"
```

---

### Task 2: `outlook/run.ts` — three commands + shape-aware display

**Files:**
- Modify: `outlook/run.ts`

- [ ] **Step 1: Add usage lines**

In the usage block, replace this segment:
```
  request --query=<q> [--person=<name>] [--slug=<person-slug>]
          [--timeframe=<window>] [--initiative=<slug>]   Queue a thread-lookup
  results [--limit=10]                                    List recent completed results
```
with:
```
  request --query=<q> [--person=<name>] [--slug=<person-slug>]
          [--timeframe=<window>] [--initiative=<slug>]   Queue a thread-lookup
  calendar [--query=<q>] [--person=<name>] [--timeframe=<window>]   Queue a calendar-lookup
  meeting-prep <meeting> [--date=<date>]                  Queue meeting prep (event + related threads)
  digest <person> [--timeframe=<window>] [--focus=<focus>]   Queue a person email digest
  results [--limit=10]                                    List recent completed results
```

- [ ] **Step 2: Add usage examples**

In the Examples block, after the `request` example line, add:
```
  npx tsx outlook/run.ts calendar --timeframe="next 7 days" --person="Chen Alcalay"
  npx tsx outlook/run.ts meeting-prep "CLM weekly" --date=2026-06-05
  npx tsx outlook/run.ts digest "Elad Schnarch" --focus=unanswered
```

- [ ] **Step 3: Switch the `results` case to the shape-aware summary**

Replace the `results` case body:
```typescript
      case 'results': {
        const limitRaw = getFlag('limit')
        const limit = limitRaw ? (parseInt(limitRaw, 10) || 10) : 10
        const { listOutlookResults } = await import('../lib/outlook.js')
        const rows = await listOutlookResults(limit)
        if (rows.length === 0) {
          console.log('No completed Outlook results yet.')
          break
        }
        for (const r of rows) {
          const threadCount = r.result_details?.threads?.length ?? 0
          console.log(`\n${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}`)
          console.log(`  ${r.title}`)
          console.log(`  ${threadCount} thread(s). ${r.result_summary ?? ''}`)
        }
        break
      }
```
with:
```typescript
      case 'results': {
        const limitRaw = getFlag('limit')
        const limit = limitRaw ? (parseInt(limitRaw, 10) || 10) : 10
        const { listOutlookResults, summarizeResultLine } = await import('../lib/outlook.js')
        const rows = await listOutlookResults(limit)
        if (rows.length === 0) {
          console.log('No completed Outlook results yet.')
          break
        }
        for (const r of rows) {
          console.log(`\n${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}`)
          console.log(`  ${r.title}`)
          console.log(`  ${summarizeResultLine(r)}`)
        }
        break
      }
```

- [ ] **Step 4: Switch the `check` results loop to the shape-aware summary**

In the `check` case, replace:
```typescript
        const { listInboundCaptures, listOutlookResults } = await import('../lib/outlook.js')
```
with:
```typescript
        const { listInboundCaptures, listOutlookResults, summarizeResultLine } = await import('../lib/outlook.js')
```
and replace:
```typescript
          for (const r of results) {
            const threadCount = r.result_details?.threads?.length ?? 0
            console.log(`  ${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}  ${r.title} (${threadCount} thread(s))`)
          }
```
with:
```typescript
          for (const r of results) {
            console.log(`  ${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}  ${r.title} — ${summarizeResultLine(r)}`)
          }
```

- [ ] **Step 5: Add the three command cases**

Insert these three cases immediately AFTER the `request` case's closing `}` (before the `results` case):

```typescript
      case 'calendar': {
        const { requestCalendarLookup } = await import('../lib/outlook.js')
        const id = await requestCalendarLookup({
          query: getFlag('query'),
          person: getFlag('person'),
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued calendar-lookup task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }

      case 'meeting-prep': {
        const meeting = getFlag('meeting') ?? getPositional(1)
        if (!meeting) {
          console.error('Error: a meeting subject/keywords is required. Usage: meeting-prep <meeting> [--date=<date>]')
          process.exit(1)
        }
        const { requestMeetingPrep } = await import('../lib/outlook.js')
        const id = await requestMeetingPrep({ meeting, date: getFlag('date') })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued meeting-prep task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }

      case 'digest': {
        const person = getFlag('person') ?? getPositional(1)
        if (!person) {
          console.error('Error: a person is required. Usage: digest <person> [--timeframe=<window>] [--focus=<focus>]')
          process.exit(1)
        }
        const { requestPersonDigest } = await import('../lib/outlook.js')
        const id = await requestPersonDigest({
          person,
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
          focus: getFlag('focus'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued person-digest task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Run the commands (queue, verify, clean up)**

Run:
```bash
npx tsx outlook/run.ts calendar --timeframe="next 7 days" --query="PLANTEST"
npx tsx outlook/run.ts meeting-prep "PLANTEST sync"
npx tsx outlook/run.ts digest "PLANTEST Person"
```
Expected: each prints `Queued <type> task <uuid>. Run the email agent ...`.

Then run: `npx tsx outlook/run.ts` and confirm the usage block shows `calendar`, `meeting-prep`, and `digest`.

Then clean up the three PLANTEST tasks:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const sb = (await import('./lib/supabase.js')).getSupabase(); const { data } = await sb.from('agent_tasks').delete().like('title','%PLANTEST%').select('id'); console.log('deleted', (data||[]).length, 'PLANTEST tasks'); })()"
```
Expected: `deleted 3 PLANTEST tasks`.

- [ ] **Step 8: Commit**

```bash
git add outlook/run.ts
git commit -m "feat(outlook): add calendar/meeting-prep/digest commands + shape-aware result display"
```

---

### Task 3: Extend the spec (`agents/outlook-agent.md`) + CLAUDE.md triggers

**Files:**
- Modify: `agents/outlook-agent.md` (spec JSON block)
- Modify: `CLAUDE.md` (Outlook trigger table)

READ `agents/outlook-agent.md` first. The spec lives in the ```json block after the `<!-- spec:outlook_agent_spec -->` marker. Keep it VALID JSON — Step 6's sync + Step 7's DB read prove it.

- [ ] **Step 1: Bump the version**

In the spec ```json block, replace:
```
  "version": "1.1-push",
```
with:
```
  "version": "1.2-calendar-and-digests",
```

- [ ] **Step 2: Broaden run_loop step 3 to route all pull types**

Replace this run_loop entry:
```
    "3. For EACH task, parse the JSON in description and act on its 'type'. In v1 the only supported type is 'thread-lookup'. If type is anything else, mark the task failed with result_summary = 'unsupported task type <type>' and move on.",
```
with:
```
    "3. For EACH task, parse the JSON in description and act on its 'type'. Supported pull types: 'thread-lookup' (thread_lookup), 'calendar-lookup' (calendar_lookup), 'meeting-prep' (meeting_research), 'person-digest' (person_digest). Use the matching spec section for input fields, steps, and result shape. If type is none of these, mark the task failed with result_summary = 'unsupported task type <type>' and move on.",
```

- [ ] **Step 3: Add an event schema to result_format**

In `result_format`, replace:
```
    "result_summary": "Plain-text, human-readable answer for Yonatan. Summaries only — no raw email text.",
```
with:
```
    "result_summary": "Plain-text, human-readable answer for Yonatan. Summaries only — no raw email text.",
    "event_jsonb": {
      "subject": "string",
      "start": "ISO datetime",
      "end": "ISO datetime",
      "attendees": ["Full Name"],
      "organizer": "Full Name",
      "location": "string or null",
      "online": "boolean",
      "sensitive": false
    },
```

- [ ] **Step 4: Add the three new sections after `thread_lookup`**

Find the end of the `thread_lookup` object (its `input_fields` object closes, then `thread_lookup` closes with `}`). Immediately after `thread_lookup`'s closing `},` insert these three sections:

```
  "calendar_lookup": {
    "description": "Read Yonatan's calendar and return matching events (no email).",
    "input_fields": {
      "query": "optional topic/keywords to filter events",
      "person": "optional name/slug — restrict to events involving this person",
      "timeframe": "window, e.g. 'next 7 days' (default if absent)"
    },
    "steps": [
      "Read calendar events in the timeframe (filtered by query/person if given).",
      "For each event, extract event_jsonb fields under the privacy allowlist. Apply sensitive_rule to events too (interviews, comp, HR, medical, personal → {subject_topic, sensitive:true} only).",
      "Write result_details {\"events\": [...], \"not_found\": <bool>}."
    ]
  },
  "meeting_research": {
    "description": "Prep for a specific meeting: find the calendar event AND the email threads related to it.",
    "input_fields": {
      "meeting": "subject/keywords identifying the meeting (required)",
      "date": "optional date/window to disambiguate"
    },
    "steps": [
      "Find the calendar event matching 'meeting' (and 'date' if given).",
      "Find email threads related to that meeting (by subject, attendees, and topic) and extract them under the privacy allowlist (same fields as result_format.result_details_jsonb.threads).",
      "Write result_details {\"event\": <event_jsonb or null>, \"related_threads\": [...], \"not_found\": <bool>}. Claude Code builds the prep brief from this — do not editorialize."
    ]
  },
  "person_digest": {
    "description": "Summarize recent email activity with a specific person.",
    "input_fields": {
      "person": "name or slug (required)",
      "timeframe": "window, e.g. 'last 14 days' (default if absent)",
      "focus": "optional emphasis, e.g. 'unanswered' / 'needs reply'"
    },
    "steps": [
      "Find threads involving the person within the timeframe.",
      "Extract each under the privacy allowlist; set 'awaiting_reply': true on threads where Yonatan owes a response (especially when focus = unanswered).",
      "Write result_details {\"person\": \"<name>\", \"threads\": [...], \"not_found\": <bool>}."
    ]
  },
```

- [ ] **Step 5: Extend the privacy allowlist with a calendar note**

In `privacy_allowlist.may_persist`, replace:
```
      "Outlook thread/message ID as a pointer back (NOT content)"
```
with:
```
      "Outlook thread/message ID as a pointer back (NOT content)",
      "Calendar event metadata: subject, start/end, attendee NAMES, organizer, location — same summaries-only discipline as email"
```

- [ ] **Step 6: Typecheck + sync**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm run outlook:run sync-spec`
Expected: `Synced outlook_agent_spec → context_store. version: 1.2-calendar-and-digests`

(If sync throws a JSON parse error, the JSON edit broke validity — fix and re-run.)

- [ ] **Step 7: Verify the pushed spec**

Run:
```bash
npx tsx -e "(async () => { await import('dotenv/config'); const sb = (await import('./lib/supabase.js')).getSupabase(); const { data } = await sb.from('context_store').select('content').eq('key','outlook_agent_spec').single(); const c = data.content; console.log('version:', c.version, '| calendar:', !!c.calendar_lookup, '| meeting:', !!c.meeting_research, '| digest:', !!c.person_digest, '| event schema:', !!c.result_format.event_jsonb); })()"
```
Expected: `version: 1.2-calendar-and-digests | calendar: true | meeting: true | digest: true | event schema: true`

- [ ] **Step 8: Add CLAUDE.md triggers**

In `CLAUDE.md`, in the Outlook trigger table, replace this row:
```
| "look up X in email", "find the thread with Y about Z" | `npm run outlook:run request --query=... [--person=...] [--slug=...] [--timeframe=...]` | Tell him to run the email agent in Outlook; read the result later with `check`. |
```
with:
```
| "look up X in email", "find the thread with Y about Z" | `npm run outlook:run request --query=... [--person=...] [--slug=...] [--timeframe=...]` | Tell him to run the email agent in Outlook; read the result later with `check`. |
| "prep me for the X meeting", "what do I need for my meeting with Y" | `npm run outlook:run meeting-prep "<meeting>" [--date=...]` | After he runs the email agent, read with `check`/`result <id>` and synthesize a prep brief (attendees→person slugs, initiative match, `current_focus`). |
| "what's on my calendar about X", "my meetings this/next week" | `npm run outlook:run calendar [--query=...] [--person=...] [--timeframe=...]` | Read events with `check`/`result <id>`. |
| "anything unanswered from Z", "digest of emails with Z" | `npm run outlook:run digest "<person>" [--focus=unanswered] [--timeframe=...]` | Read with `check`/`result <id>`; flag `awaiting_reply` threads. |
```

- [ ] **Step 9: Commit**

```bash
git add agents/outlook-agent.md CLAUDE.md
git commit -m "feat(outlook): add calendar/meeting-prep/person-digest to spec (v1.2) + CLAUDE.md triggers"
```

---

## Self-Review

**Spec coverage** (against `2026-06-03-outlook-pull-taxonomy-expansion-design.md`):
- `calendar-lookup` (input/result) → spec `calendar_lookup` (Task 3 Step 4) + `requestCalendarLookup` (Task 1) + `calendar` command (Task 2) ✅
- `meeting-prep` (event + related_threads; brief synthesized by Claude Code) → spec `meeting_research` (Task 3 Step 4, note "Claude Code builds the brief") + `requestMeetingPrep` (Task 1) + `meeting-prep` command (Task 2) ✅
- `person-digest` (+ awaiting_reply) → spec `person_digest` (Task 3 Step 4) + `requestPersonDigest` + `PersonDigestThread` (Task 1) + `digest` command (Task 2) ✅
- `OutlookEvent` + result-detail types → Task 1 ✅
- Result display generalization (`summarizeResultLine`, events/meeting/threads) → Task 1 (function) + Task 2 (wired into `results` + `check`) ✅
- Calendar privacy (allowlist + sensitive_rule) → spec calendar_lookup step 2 + privacy_allowlist note (Task 3 Steps 4, 5) ✅
- Spec version bump + run_loop routing → Task 3 Steps 1, 2 ✅
- CLAUDE.md triggers → Task 3 Step 8 ✅
- `filed` tag convention (from prior work) still applies — unchanged, results already exclude `filed` ✅

**Placeholder scan:** No TBD/TODO. All code and JSON given verbatim; spec edits are exact old→new strings.

**Type consistency:** `OutlookEvent`, `CalendarResultDetails`, `MeetingPrepResultDetails`, `PersonDigestThread`, `PersonDigestResultDetails`, `summarizeResultLine`, `requestCalendarLookup`, `requestMeetingPrep`, `requestPersonDigest`, `queueOutlookTask` defined in Task 1; consumed by Task 2 commands and display. `summarizeResultLine` takes `OutlookResult` and reads `result_details` defensively via `as any` (DB returns loose JSON), so it works for all type shapes without changing the `OutlookResult.result_details` declaration.

**Ordering:** Task 1 (exports) → Task 2 (consumes them) → Task 3 (doc/spec, independent but last so the version bump lands after the code). Each task typechecks independently.
