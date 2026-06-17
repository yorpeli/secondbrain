# Push to Outlook Draft — Design

**Date:** 2026-06-17
**Status:** Approved design — ready for implementation plan
**Owner:** Comms Assistant / Dev Team

## Summary

Add a **"Push to Outlook draft"** button to each `/triage` card. Clicking it opens a
pre-filled, reviewable **draft** in the Outlook desktop app — Yonatan reviews and hits
**Send in Outlook himself**. It never sends. Both **fresh emails** and **threaded
reply-alls** are supported, fully locally, with **no Azure/Graph setup**.

This removes the copy-paste friction of the current loop (review draft in `/triage` →
manually retype/paste into Outlook) while preserving the deliberate human-in-the-loop
design of the comms assistant: read-only MSFT, Yonatan always sends from Outlook.

## Goals

- One-click: `/triage` card → pre-filled Outlook draft window opens.
- Support **fresh** emails (new compose) and **replies** (true threaded reply-all).
- Stay **local** — no Azure app registration, no Graph token, no new cloud dependency.
- Preserve the review gate: the bridge **drafts only**, never sends.
- Keep the bridge shaped so a future Graph path is a contained add, not a rewrite.

## Non-goals (YAGNI — explicitly excluded)

- Sending email (no `send`; draft-only).
- Live output streaming / WebSocket / terminal pane (this is a fire-and-forget one-shot,
  not a long-running job — none of the spawn-stream-render apparatus applies).
- Ring buffer, reconnect, cancel, run-state machine, single-run guard.
- The Supabase `agent_tasks` queue + drain agent (that exists for the *async* mark-read
  path; this draft path is synchronous and local).
- Microsoft Graph (kept as a documented future fallback — see "Future").
- Always-on service / launchd automation (manual start for now; may automate later).

## Background & key findings

### The triage app (verified)
- `app/` is a **React 19 + Vite SPA** hitting Supabase **directly** via `@supabase/supabase-js`
  + TanStack Query. Dev server: `npm run dev` (localhost:5173). Route `/triage` at
  `app/src/App.tsx`.
- The selected card already has **all draft data client-side** (no extra fetch needed):
  - `card.email.to` — recipients
  - `card.email.from` — original sender (reply target)
  - `card.email.subject` — subject
  - `edited_reply ?? predicted_reply` — the body (respects in-app edits + HE/EN toggle)
  - `web_link`, and on the card payload `email.conversation_id` / `email.internet_message_id`
- The existing **"Mark read in Outlook"** button (`app/src/pages/triage.tsx`, hook
  `useMarkRead()` in `app/src/hooks/use-triage.ts`) is the UI/precedent to model the new
  button on. (It uses the `comms_mark_read` RPC + `agent_tasks` queue — that async path is
  **not** reused here; only the button pattern is.)

### Outlook AppleScript capability (verified live, 2026-06-17)
- **New Outlook for Mac**: AppleScript message model is **gutted** — every folder reports
  `count of messages = 0`; `accounts` errors; `whose` search finds nothing. Only
  **compose** (`make new outgoing message`) works. This is a documented Microsoft
  limitation; AppleScript restoration has been promised (roadmap Dec 2025) but has slipped
  repeatedly and is not working in build 16.108.
- **Legacy Outlook for Mac**: full classic dictionary works. Verified:
  - `count of messages of inbox` → 5486 (real).
  - `headers of m` contains the RFC `Message-ID:` (matchable against the card's
    `internet_message_id`).
  - `reply to m without opening window` → produces a threaded outgoing message with
    `subject` = `"Re: …"`, recipient auto-populated; `set content of r` sets the body.
  - `messages of inbox whose subject is "…"` → native fast filter, returned exactly 1.
- **Decision:** build for **Legacy Outlook**. Yonatan has switched back to Legacy.

### Lessons adopted from the "server-spawned-terminal" pattern (a friend's doc)
That doc targets long-running streamed CLI jobs — most of it is over-engineering for our
one-shot. Three principles **were** adopted:
1. **Spawn with an argv array, never shell-interpolate.** `spawn('osascript', [script,
   ...args])` and the AppleScript reads `on run argv`. Email content (AI-generated, often
   Hebrew) never touches a shell → no injection, no escaping.
2. **Injectable `spawnFn`** so the server is unit-testable without launching Outlook.
3. **Immediate REST response with clear status codes** (`{ok:true}` / 4xx / 5xx) so the
   button can show success vs error.

## Architecture

```
[/triage card button "Push to Outlook draft"]   (Outlook/email cards only)
  → fetch POST http://127.0.0.1:7777/draft
       header: x-bridge-token: <shared secret>
       body:   DraftRequest (read from the selected card, client-side)
  → outlook-bridge  (local Node/Express; started manually: `npm run outlook-bridge`)
       · binds 127.0.0.1 only
       · rejects missing/wrong token → 401
       · validates body → 400 on bad input
       · spawn('osascript', [draft.applescript, mode, ...args])   ← argv, no shell
  → draft.applescript  (Legacy Outlook):
       · FRESH  → make new outgoing message {subject, content}
                  + make recipient per address → open
       · REPLY  → locate original (whose subject → refine by Message-ID)
                  → reply to all → prepend body above quoted history → open
  → reviewable draft window opens in Outlook
  → bridge returns {ok:true, mode} → button flashes "Draft opened ✓"
```

The split mirrors the existing comms architecture: the **app** owns presentation + the
click; the **local bridge** owns the OS-level action. They communicate over a typed
HTTP contract.

## Components

Each unit is small and single-purpose.

### 1. `comms-assistant/outlook-bridge/server.ts`
A ~50-line localhost HTTP server (Express or `http.createServer`).
- **Binds `127.0.0.1` only** (never `0.0.0.0`) — unreachable from the network.
- **Token gate:** every request must carry `x-bridge-token` matching the configured
  secret; otherwise `401`. (Defends against other local processes / DNS-rebinding from a
  browser tab.)
- **One route:** `POST /draft` accepting `DraftRequest` (below). Validates, then
  `spawn('osascript', [scriptPath, ...args])`.
- **Injectable spawn:** `createBridge({ spawnFn = realSpawn, token, scriptPath })` so tests
  pass a fake spawn and never launch Outlook.
- **Responses:** `200 {ok:true, mode}` on success; `400` invalid body; `401` bad token;
  `500 {ok:false, error}` if osascript exits non-zero (return stderr tail).
- **Health route (optional):** `GET /health` → `{ok:true}` so the app can detect "bridge
  not running" and show a helpful hint instead of a fetch error.

### 2. `comms-assistant/outlook-bridge/draft.applescript`
Reads positional args via `on run argv`. First arg is `mode` (`fresh` | `reply`).
- **fresh:** `make new outgoing message with properties {subject, content}`; one
  `make new recipient … {email address:{address:…}}` per recipient; `open` it.
- **reply:**
  1. **Locate** the original in Inbox: `messages of inbox whose subject is <subject>`
     (native fast filter). If >1 hit, **disambiguate** by extracting `Message-ID:` from
     each hit's `headers` and matching the card's `internet_message_id`. If still none,
     return a non-zero exit with `NOT_FOUND` (button surfaces "original not found").
  2. `set r to reply to all <original>` (reply-all default).
  3. **Preserve quoted history:** `set content of r to (body & return & return &
     (content of r))` — prepend the draft *above* Outlook's auto-quoted original, do not
     overwrite it.
  4. `open r`.
- Args passed individually (subject, body, recipients, replyKey) — never concatenated
  into a shell string.

### 3. App: hook + button
- `app/src/hooks/use-triage.ts`: add `usePushOutlookDraft()` — a TanStack `useMutation`
  modeled on `useMarkRead()`, but its `mutationFn` does `fetch(BRIDGE_URL + '/draft', …)`
  with the token header and a `DraftRequest` body built from the selected card. On success,
  no Supabase write is required (it does not change card status); optionally show a toast.
- `app/src/pages/triage.tsx`: add the button next to "Mark read", shown for
  `channel === 'outlook' || channel === 'email'`. Disabled while pending; label
  "Push to Outlook draft", success state "Draft opened ✓", error state surfaces the bridge
  error (incl. "bridge not running — run `npm run outlook-bridge`").

### 4. Config / secret
- Shared secret stored in a **gitignored local file**, surfaced to:
  - the app as `VITE_OUTLOOK_BRIDGE_TOKEN` (in `app/.env.local`),
  - the server via an env var read at startup (same value).
- Bridge URL/port (`http://127.0.0.1:7777`) likewise configurable; `7777` default.
- `npm run outlook-bridge` script added (root or `comms-assistant/` package) to start the
  server with the token loaded from env.

## Data contract

```ts
// Sent by the app, validated by the bridge
interface DraftRequest {
  mode: 'fresh' | 'reply'
  to: string[]                 // recipients (fresh); for reply, ignored (reply-all derives them)
  subject: string              // original subject for reply-locate; new subject for fresh
  body: string                 // plain text; the currently-shown card draft (edited or predicted)
  replyKey?: {                 // present iff mode === 'reply'
    internetMessageId?: string // primary disambiguator against headers' Message-ID
    conversationId?: string    // secondary (if used)
  }
}

// Bridge → app
type DraftResponse =
  | { ok: true;  mode: 'fresh' | 'reply' }
  | { ok: false; error: string }          // 400 | 401 | 500; error is a short reason
```

**Reply detection (client-side):** a card is `reply` mode when its payload carries
`internet_message_id` (or `conversation_id`); otherwise `fresh`. The body in both cases is
`edited_reply ?? predicted_reply`.

## Error handling

| Condition | Bridge behavior | App behavior |
|---|---|---|
| Missing/wrong token | `401` | "bridge auth failed" (config issue) |
| Invalid body | `400` | show validation message |
| Bridge not running | fetch fails / `/health` unreachable | "Bridge not running — run `npm run outlook-bridge`" |
| Reply original not found | osascript exits non-zero `NOT_FOUND` | "Couldn't find the original in Outlook" — offer fresh-compose fallback |
| osascript/Outlook error | `500` + stderr tail | show error, leave card unchanged |
| Success | `200 {ok,mode}` | "Draft opened ✓" |

No card status changes on push (unlike mark-read) — pushing a draft is not a disposition;
Yonatan still acts on the card normally.

## Security

- Bound to `127.0.0.1` only — not exposed on the network.
- Shared-secret token on every request — blocks other local processes and browser-tab
  DNS-rebinding from triggering drafts.
- Draft-only blast radius: even if a request slipped through, the worst case is an
  unsent draft window — nothing leaves the mailbox without Yonatan clicking Send.
- argv-passed inputs — no shell interpolation, no injection surface from email content.

## Testing

- **Bridge unit tests** with an injected fake `spawnFn`: token gate (401), body validation
  (400), fresh vs reply argv assembly, success/error mapping — all without launching Outlook.
- **AppleScript smoke test** (manual, documented): fresh draft to self; reply to a known
  inbox message — assert a draft window opens, "Re:" subject, body present, quote preserved.
  Tests must `delete` any outgoing message they create (as the probes did) to avoid Drafts
  clutter.
- **App:** hook test that `usePushOutlookDraft` posts the right `DraftRequest` for a given
  card (mocked fetch).

## Future (documented, not built)

- **Graph fallback for when Legacy Outlook sunsets.** Microsoft is winding down Legacy
  Outlook for Mac; when it's gone (or if New Outlook finally restores AppleScript), replace
  the AppleScript reply branch with Microsoft Graph `createReply`/`createReplyAll` on the
  message id, then PATCH the body. This is a contained change: the bridge's `/draft`
  endpoint already branches on `mode`/`replyKey`; only the executor swaps. Cost deferred:
  the one-time Azure app registration + `Mail.ReadWrite` scope.
- **Automate bridge startup** (launchd or app-coupled) once the manual flow proves out.
- **HTML body / RTL** for richer Hebrew formatting (v1 is plain text).

## Dependencies & risks

- **Requires Legacy Outlook for Mac.** New Outlook cannot read mail via AppleScript, so the
  reply path (and any message lookup) only works on Legacy. If Yonatan is forced onto New
  Outlook, fresh-compose still works but replies fall back to the Graph path above.
- **macOS Automation permission:** first run prompts "Terminal/node wants to control
  Microsoft Outlook" — approve once.
- **Subject-based reply lookup** can be ambiguous on threads with repeated subjects;
  mitigated by `Message-ID` disambiguation from headers. If lookup fails, the app offers a
  fresh-compose fallback rather than guessing.

## Post-implementation lessons (2026-06-17)

What we actually learned building this — the operational reference is
[`../../comms-assistant/outlook-bridge/README.md`](../../comms-assistant/outlook-bridge/README.md).

1. **New Outlook for Mac AppleScript is dead (compose-only); Legacy works.** Verified
   live: New Outlook reports `count of messages = 0` everywhere, no account/search access.
   The whole reply path depends on running **Legacy Outlook**. Microsoft's promised
   restoration (roadmap Dec 2025) had not shipped/worked as of build 16.108. Don't design
   around it returning.
2. **Reply-all is a parameter, not a verb.** `reply to <message> reply to all true` — there
   is no `reply to all` command. Found by reading the bundled `Outlook.sdef` (the `sdef`
   CLI needs full Xcode).
3. **A browser can't shell out** — hence the localhost bridge. `spawn('osascript', [argv])`
   (never a shell string) both solved the boundary and removed the injection surface for
   attacker-influenceable email body.
4. **The data-shape bug the unit tests couldn't catch.** The reply keys
   (`mode`/`internet_message_id`/`last_message_id`) are **top-level `comms_predictions`
   columns, not in `card.email`** — contrary to what the comms-assistant doc states. The
   synthetic-card unit tests passed; the live click test surfaced it (every reply defaulted
   to recipient-less "fresh" → 400). **Verify the persisted shape against the DB; don't
   trust a doc's claim about where fields are written.** The manual end-to-end test is what
   caught it — its value was real, not ceremonial.
5. **Reply subjects carry `Re:`/`Fwd:` that the original may not** — strip the prefix before
   the `whose subject contains` filter, or the lookup misses the very threads the feature is
   for. Let `Message-ID` disambiguate after.
