# Triage "Open in Outlook" → pop the desktop email via the bridge

**Date:** 2026-06-18
**Status:** Approved (design)
**Area:** `comms-assistant/outlook-bridge/` + `app/` (`/triage`)

## Problem

The `/triage` app's **"Open in Outlook"** button is an anchor that opens the OWA
**web link** (`webLink`) in a new browser tab. Now that the local Outlook bridge
exists (`npm run outlook-bridge`, 127.0.0.1:7777, token-gated → `osascript` →
Legacy Outlook for Mac), we want the button to **pop the actual message open in
the desktop Outlook app** instead.

## Goal

Clicking "Open in Outlook" on an `outlook`/`email` triage card opens a real
message window in Legacy Outlook desktop. When the bridge is down or the message
can't be located, fall back to opening the web link (no regression when the
bridge is off).

## Decision

**Bridge-first, web fallback.** Reuse the bridge's existing message-locate logic;
add a pure `open` action (no read-flag flip, no reply). Teams cards are unchanged.

## Design

### 1. Bridge — new `open` mode

**`outlook-bridge/draft.applescript`** — add an `open` branch that reuses the
locate logic already shared by `read`/`reply`:

- `set hits to (messages of inbox whose subject contains stripReplyPrefix(theSubject))`
- if `internetMessageId` provided, disambiguate by `(headers of h) contains imid`;
  else `item 1 of hits`
- no match → `error "NOT_FOUND: no inbox message matches subject" number 1`
  (same convention as `read`/`reply`)
- on match → `open target`, then `activate` Outlook so the window comes forward
- **never** mutates the message (no `set isread`, no `reply`) — pure open

### 2. Bridge — `POST /open` route

**`outlook-bridge/server.ts`** — add `POST /open`, token-gated identically to
`/read` and `/draft` (`x-bridge-token` checked before any spawn; 401 on mismatch).

Request shape mirrors `MarkReadRequest`:

```ts
interface OpenRequest {
  subject: string
  replyKey?: { internetMessageId?: string }
}
```

Spawns `osascript` (argv, no shell) with mode `open` + subject + `internetMessageId`.
Returns `{ ok: true }` on success; `{ ok: false, error }` on NOT_FOUND / failure
(non-2xx for transport-level errors, matching `/read`).

### 3. App — `useOpenInOutlook()` hook

**`app/src/hooks/use-triage.ts`** — new mutation mirroring `usePushOutlookDraft()`:

- builds `{ subject, replyKey: { internetMessageId } }` from the card
  (`subject` = `card.card.email.subject`; `internetMessageId` =
  `card.internet_message_id ?? card.last_message_id` — the top-level columns,
  same source `buildDraftRequest` uses)
- `POST ${VITE_OUTLOOK_BRIDGE_URL ?? 'http://127.0.0.1:7777'}/open` with
  `content-type: application/json` + `x-bridge-token: VITE_OUTLOOK_BRIDGE_TOKEN`
- throws on bridge-unreachable (fetch catch) or `!ok` (NOT_FOUND) so the caller
  can fall back

### 4. App — rewire the button

**`app/src/components/triage/triage-detail.tsx`** — for `outlook`/`email`
channels **and** when the card has a locate key (`internetMessageId` or
`subject`), render "Open in Outlook" as a `<button onClick>` that calls the
mutation. On **any** failure (bridge down *or* NOT_FOUND), fall back to
`window.open(webLink, '_blank', 'noopener,noreferrer')`.

For `teams` cards, or `outlook`/`email` cards with no bridge keys, keep the
existing web-link anchor unchanged. If there's neither a `webLink` nor bridge
keys, render nothing (as today).

## Scope / non-goals

- **Inbox-scoped locate only** — triage cards are unread inbox messages (matches
  `/read`). A message moved out of Inbox simply falls back to the web link.
- **Teams unchanged** — its "Open in Teams" web link stays.
- **Read-only preserved** — `open` never sends and never flips the read flag.
- No new data plumbing; the card already carries subject + reply keys.

## Testing

- `outlook-bridge/__tests__/server.test.ts` — add `/open` cases: token gate
  (401), happy path spawns `osascript` with mode `open`, NOT_FOUND → `ok:false`.
- `outlook-bridge/__tests__/draft-request.test.ts` (or a new test) — assert the
  `OpenRequest` → argv mapping if a builder is added.
- Manual: with Legacy Outlook + bridge running, click "Open in Outlook" on an
  inbox card → desktop message window pops; stop the bridge → click → web link
  opens.
