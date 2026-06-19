# Calendar — "Create Meetings" Limb for Comms Assistant — Design

**Date:** 2026-06-19
**Status:** Approved design — ready for implementation plan
**Owner:** Comms Assistant / Dev Team

## Summary

Add a conversational **"set up meetings"** capability to the comms assistant. Yonatan
says something like *"set up 1:1s with my skip-levels over the next two weeks"* → the
agent resolves who, proposes times, drafts a tailored agenda per meeting, shows the
**slate in chat** for approval → on his go, the **local bridge opens each invite as an
unsent draft in Outlook** → Yonatan adds the Teams/Zoom link and **hits Send himself**.

This is the calendar analog of the existing **"✉ Push to Outlook draft"** email path. It
deliberately preserves the system's core invariant — **read-only MSFT, Yonatan always
sends from Outlook** — rather than introducing autonomous sending. The `schedule` action
type and `meeting` channel already exist in the comms model; this is the **execution
layer** for an action the agent already knows how to *choose*.

## How we got here (decision trail)

The flow evolved during brainstorming as constraints surfaced:

1. Initial idea: agent **creates + sends** invites autonomously after batch approval.
2. Constraint — **no reliable Graph send.** In a local Claude Code session the Microsoft
   365 connector is **not authenticated** (only `authenticate`/`complete_authentication`
   exposed); even when connected it is a **read-oriented** surface (mail/Teams/calendar
   *read*) — a write `create_event`/send tool is unverified and historically absent. So
   autonomous Graph send is not a dependable v1 path.
3. Constraint — **no local join link.** AppleScript / `Outlook.sdef` has no online-meeting
   property; it cannot mint a Teams/Zoom link. A static personal Zoom (PMI) link was
   considered but is a same-room-every-time hack.
4. **Resolution (Yonatan's call):** revert to the **draft-and-send-yourself** model. The
   agent opens the invite as a draft; Yonatan clicks Outlook's native Teams/Zoom button
   (a real, unique link per meeting) and sends. This *removes* the link limitation instead
   of working around it, and restores the never-sends invariant — one mental model shared
   with the email side, not two.

## Goals

- Conversational trigger (Yonatan never runs a CLI): *"set up meetings with X over
  \<window\>"*, *"schedule 1:1s with my skip-levels next two weeks"*, etc.
- Agent **proposes**: attendees (resolved), candidate times, a per-meeting agenda grounded
  in that person's context.
- **In-chat slate approval** — one row per meeting; Yonatan approves or edits inline
  ("move Elad to Thursday", "drop the agenda line about X").
- On approval, the **local bridge** creates each meeting as an **unsent draft** in Outlook
  and opens it for review. Yonatan adds the join link and **sends himself**.
- Stay **local** — reuse the existing bridge (`Outlook.sdef`), no Azure/Graph required for
  the create path.

## Non-goals (YAGNI — explicitly excluded)

- **Sending invites.** The bridge creates a *draft* meeting (`make new calendar event`,
  **never** the `send meeting` command); Yonatan sends from Outlook.
- **Responding to incoming invites** (accept/decline/tentative). The `Outlook.sdef`
  supports it (`accept meeting` / `decline meeting` / `accept tentatively meeting`) — it is
  a clean **v2**, out of scope here.
- **Auto-recording** created meetings into `meetings` / `meeting_attendees` / `agent_log`.
  The agent doesn't know the moment Yonatan hits Send; normal calendar sync owns the
  record. (Decision 2026-06-19.)
- **Minting join links** (Teams/Zoom) — Yonatan adds these in the Outlook draft.
- **Unique-per-meeting Zoom links** — would need a net-new Zoom API integration; excluded.
- **A new HTML/review surface** — approval is in chat; no page to build.
- **Recurring-meeting series** — single events only in v1.

## Background & key findings (verified live, 2026-06-19)

### Outlook calendar AppleScript runtime — LIVE for reads
Unlike the **message** model (which New Outlook for Mac guts — folders report 0 messages,
`accounts` errors; see `2026-06-17-push-to-outlook-draft-design.md`), the **calendar**
model is live at runtime on the installed build (16.108.1):

- `count of calendars` → **6**; iterating them, one calendar named **"Calendar"** holds
  **2,559 readable events** (also "United States holidays" = 106, "Imports" = 5).
- **Quirks to handle:** `default calendar` **errors** (`-1728`); `calendar 1` is an empty
  placeholder (`name = missing value`, 0 events). **Locate the real calendar by name /
  non-zero event count**, not by index and not via `default calendar`.

So computing Yonatan's own openings from his calendar works locally today.

### `Outlook.sdef` calendar dictionary (declared)
`/Applications/Microsoft Outlook.app/Contents/Resources/Outlook.sdef` declares:
- Classes: `calendar`, `calendar event`, `attendee`, `required attendee`,
  `optional attendee`, `resource attendee`, `meeting message`.
- `calendar event` properties: `subject`, `content` / `plain text content`, `start time`,
  `end time`, `all day flag`, `location`, `timezone`, `free busy status`, `recurrence`,
  `organizer`, attendees, etc.
- Commands: `send meeting` (**we will NOT call this**), plus the v2 response commands.

### Microsoft 365 connector (Graph) — read-only / often absent
Not authenticated in a local session; read-oriented when connected. Used **only** to
*optionally* enrich find-times with attendee free/busy when a connector session is present.
Not required for the create path.

### Existing bridge to extend
`comms-assistant/outlook-bridge/server.ts` already has the exact plumbing pattern:
token-gated POST routes (`/draft`, `/read`, `/open`) → validate → `buildXArgs` →
`runScript` spawns `osascript` (argv, no shell) → `*.applescript`. The new route mirrors
`/draft` precisely.

## The flow (orchestrated by Claude Code, like the triage sweep)

1. **Parse the request** → a `MeetingRequest`: attendees, window (date range), per-meeting
   type/duration/purpose. Resolve "skip-levels" / names → `people` rows → email addresses.
2. **Find times** → candidate slots from **Yonatan's own openings** (read his calendar via
   the bridge), intersected with his scheduling preferences (working hours, avoid lunch,
   avoid back-to-back). *Optional enrichment:* when a Graph connector session is available,
   also check each attendee's free/busy and prefer mutually-free slots. Precision is
   non-critical because every draft is reviewed before sending.
3. **Draft agenda** → per meeting, a short agenda grounded in that person's context —
   `current_focus`, recent 1:1 notes / open action items, growth areas, relevant initiative
   memory — via the `searchByType` grounding path the agent already uses.
4. **Present the slate in chat** → one row per meeting (attendee · proposed time · agenda
   summary). Yonatan says "go" or edits inline.
5. **Create drafts** → for each approved meeting, `POST /meeting` to the bridge →
   `meeting.applescript` runs `make new calendar event` (subject, agenda body, start/end +
   timezone, required/optional attendees) on the real calendar, **without** `send meeting`,
   then **opens** it for review.
6. **Yonatan adds the join link and sends** from Outlook. No auto-record.

## Components (new, isolated)

- `comms-assistant/schedule/meeting-request.ts` — `MeetingRequest` types + attendee
  resolution (slug/name → `people` row → email). Pure + DB lookup; unit-testable.
- `comms-assistant/schedule/find-times.ts` — **pure** slot ranking: takes busy-blocks +
  constraints in, returns ranked candidate slots out. No MSFT/IO inside (the calendar read
  and optional free/busy fetch happen in the orchestrator and are passed in). Fully
  unit-testable.
- `comms-assistant/schedule/agenda.ts` — per-person agenda draft from grounded context.
- `outlook-bridge/`:
  - `server.ts` — new token-gated `POST /meeting` route, modeled on `/draft`.
  - `draft-request.ts` — `validateMeetingRequest()` + `buildMeetingArgs()` (argv only).
  - `meeting.applescript` — locate the real calendar (by name / non-zero events),
    `make new calendar event` with attendees, set body/time/location, **open** it. Returns
    `NOT_FOUND`-style errors mapped by `runScript` exactly like the message scripts.
  - Bridge calendar **read** helper (for find-times): a read-only script that returns
    Yonatan's events in the window as busy-blocks (start/end), JSON to stdout.

## Data flow

```
NL request
  └─> MeetingRequest (attendees resolved → emails, window, per-mtg type)
        ├─ orchestrator: read own calendar (bridge) → busy-blocks
        ├─ orchestrator (optional): Graph free/busy → attendee busy-blocks
        └─> find-times.ts (pure) → ranked candidate slots
              └─ agenda.ts (grounded) → per-meeting agenda
                    └─> CHAT SLATE  ──approve/edit──>  per meeting:
                          POST /meeting → meeting.applescript
                            (make new calendar event, NO send) → open draft
                              └─ Yonatan adds link + Sends from Outlook
```

## Error handling

- **Bridge down / not at the Mac:** the create path requires the local bridge. If
  unreachable, the agent reports it and offers to present the slate as text Yonatan can act
  on manually — no silent failure.
- **Calendar not addressable (gutted mode):** if the read-only calendar probe returns no
  real calendar (all `missing value` / 0 events), the agent stops and reports that Outlook's
  calendar AppleScript isn't responding (e.g. Outlook mode), rather than guessing.
- **Attendee not resolvable to an email:** flag that row in the slate; never invent an
  address. Yonatan can supply it or drop the attendee.
- **Per-meeting failure during create:** each `POST /meeting` is independent; a failure on
  one meeting is reported per-row and does not abort the rest of the batch.
- **`osascript` exit mapping:** reuse `runScript`'s existing pattern (`NOT_FOUND` → 404,
  nonzero → 500 with trimmed stderr).

## Testing

- `find-times.ts` — pure unit tests: openings vs. busy-blocks, working-hours/lunch/
  back-to-back constraints, multiple meetings packed into a window, edge cases (no slot
  found, window in the past).
- `meeting-request.ts` — attendee resolution (slug, fuzzy name, unresolved → flagged).
- `draft-request.ts` — `validateMeetingRequest` (rejects missing fields, bad dates) and
  `buildMeetingArgs` (correct argv ordering), matching the existing `__tests__` style.
- `server.ts` — `/meeting` route: token gate, JSON validation, `spawnFn` injection
  (success/failure), like `server.test.ts`.
- **`meeting.applescript`** — verified manually against a throwaway draft (see Open Items),
  not in CI (it mutates Outlook).

## Open items to verify at the start of implementation

1. **The write path (the one true unknown):** confirm `make new calendar event` with
   `required attendee`s creates an **unsent draft** that Outlook shows with a **Send**
   button, and that the bridge can **open** it for review — i.e. creating-without-sending
   behaves like the email draft path. Test against a throwaway event, then delete it.
2. **Real-calendar locator:** finalize the AppleScript that picks the actual calendar (by
   name / non-zero event count), since `default calendar` errors and index 1 is empty.
3. **Graph free/busy availability:** confirm whether a connector session exposes a
   free/busy / `findMeetingTimes` tool; if not, v1 ships with the own-openings path only.

## Future (v2+, explicitly deferred)

- **Respond to incoming invites** (`accept` / `decline` / `accept tentatively meeting`),
  wired into the existing triage sweep's `schedule` action.
- **Auto-mint join links** (Graph `onlineMeeting` or a Zoom API integration).
- **Auto-record** sent meetings into `meetings` / `meeting_attendees` via a later sweep.
- **Recurring series.**
