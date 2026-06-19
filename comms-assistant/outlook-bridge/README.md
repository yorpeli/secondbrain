# Outlook Bridge — Push to Outlook Draft

A tiny **localhost HTTP bridge** that lets the `/triage` app open a pre-filled,
reviewable draft in the **Outlook for Mac** desktop app. It **never sends** —
Yonatan reviews and sends from Outlook himself (preserves the comms-assistant's
read-only / human-in-the-loop design).

Two card kinds are supported, both fully local (no Azure / no Graph):
- **Fresh** email → new compose window, pre-addressed.
- **Reply** → true threaded **reply-all** draft ("Re:" subject, original
  recipients, your text above the quoted history).

It also powers the `/triage` **"Open in Outlook"** button: instead of opening the
OWA web link in a browser tab, it pops the **actual message open in the desktop
Outlook app** (`POST /open`). Bridge-first with a **web-link fallback** — if the
bridge is down or the message isn't in the Inbox, the app opens the web link.

Spec: [`../../docs/superpowers/specs/2026-06-17-push-to-outlook-draft-design.md`](../../docs/superpowers/specs/2026-06-17-push-to-outlook-draft-design.md) ·
Plan: [`../../docs/superpowers/plans/2026-06-17-push-to-outlook-draft.md`](../../docs/superpowers/plans/2026-06-17-push-to-outlook-draft.md)

---

## How to run

```bash
# 1. one-time: a shared secret in the repo .env (gitignored)
printf '\nOUTLOOK_BRIDGE_TOKEN=%s\n' "$(openssl rand -hex 16)" >> .env
# and the SAME value in app/.env.local, plus the URL:
#   VITE_OUTLOOK_BRIDGE_URL=http://127.0.0.1:7777
#   VITE_OUTLOOK_BRIDGE_TOKEN=<same value as OUTLOOK_BRIDGE_TOKEN>

# 2. start the bridge (leave running while you triage)
npm run outlook-bridge        # → listening on http://127.0.0.1:7777

# 3. run the app, open /triage, click "✉ Push to Outlook draft" on a card
cd app && npm run dev
```

The bridge is started **manually** for now (no launchd). If it isn't running,
the button shows *"Bridge not running — run `npm run outlook-bridge`"*.

---

## Architecture

```
[/triage button]  --fetch POST /draft (x-bridge-token)-->  [bridge: 127.0.0.1:7777]
   DraftRequest built from the card                            token gate + validate
                                                               spawn('osascript', [args])   ← argv, never a shell string
                                                                      |
                                                               draft.applescript (Legacy Outlook)
                                                                 fresh → make new outgoing message + recipients → open
                                                                 reply → locate original → reply-all → prepend body → open
                                                                 read  → locate original → set isread true  (no window)
                                                                 open  → locate original → open message window (no mutation)
                                                                      |
                                                               reviewable Outlook draft window  (you hit Send)
                                                               — or, for `read`, a silent read-flag flip
                                                               — or, for `open`, the existing message popped open
```

Three endpoints, same spawn machinery:
- **`POST /draft`** — open a reviewable draft (fresh compose / threaded reply-all). Never sends.
- **`POST /open`** — the desktop path for the `/triage` **"Open in Outlook"** button. Locates the
  message (same strategy as reply/read — subject contains + Message-ID in headers) and `open`s its
  window, bringing Outlook forward. **No mutation** (not even the read flag). `OpenRequest =
  {subject, replyKey?}` — same shape as mark-read, so it reuses the validator. The app calls this
  first and falls back to the OWA `web_link` on bridge-down / `NOT_FOUND`.
- **`POST /read`** — the local fast-path for the `/triage` **"Mark read"** button. Flips the
  message's read flag in place (`MarkReadRequest = {subject, replyKey?}`; reuses the reply
  locate strategy — subject contains + Message-ID in headers — but **no window opens**, it's a
  silent write). This is the **primary** path for mark-read; the Supabase `outlook-sync` queue
  is now the **fallback**, used only when the bridge is down / the message isn't found / the card
  has no locate key. On bridge success the client calls `comms_mark_read(..., p_queue_sync=false)`
  so the board carries no redundant sync task. Still read-only-ish: the *only* mailbox write the
  bridge makes silently is the read flag — it never sends.

Files:
- `draft-request.ts` — `DraftRequest`/`MarkReadRequest`/`OpenRequest` types, `validateDraftRequest`/`validateMarkReadRequest`/`validateOpenRequest`, `buildOsascriptArgs`/`buildMarkReadArgs`/`buildOpenArgs` (pure).
- `server.ts` — `createBridge()`: token gate, CORS, single-response guard, shared `runScript` spawn (injectable `spawnFn`); routes `/draft` + `/read` + `/open`.
- `draft.applescript` — `on run argv` → fresh compose / threaded reply-all / read-flag flip / open-message.
- `bridge.ts` — entrypoint: loads env, binds `127.0.0.1:7777`.
- `push-client.ts` — Node/terminal caller of `POST /draft` (fresh compose) for the comms-assistant
  **outgoing flow** (`run.ts send-initiated`). The app's browser caller is `app/src/lib/draft-request.ts`.
- App side: `app/src/lib/draft-request.ts` (`buildDraftRequest`, `buildMarkReadRequest`, `canBridgeMarkRead`, `buildOpenRequest`, `canBridgeOpen`), `app/src/hooks/use-triage.ts` (`usePushOutlookDraft`, `useMarkRead`, `useOpenInOutlook`), `app/src/pages/triage.tsx` (push/mark-read buttons), `app/src/components/triage/triage-detail.tsx` (the "Open in Outlook" header button).
- DB side: `comms_mark_read(p_prediction_id, p_queue_sync default true)` — dismisses the card + logs feedback always; queues the `outlook-sync` task only when `p_queue_sync` (the fallback).

---

## ⚠️ HARD REQUIREMENT: Legacy Outlook for Mac

**New Outlook for Mac has a gutted AppleScript dictionary** — the message object
model is gone. Verified live (build 16.108): every mail folder reports
`count of messages = 0`, `every account` errors, `whose` search finds nothing.
**Only compose works** under New Outlook; you cannot read, search, or reply to
existing mail. Microsoft has promised to restore AppleScript (M365 roadmap target
Dec 2025) but it has slipped repeatedly — **do not design around it returning.**

**Legacy Outlook** has the full classic dictionary (verified live): inbox has
real messages, `headers` carry the RFC `Message-ID`, `reply to` works.

To check / switch: Outlook menu → toggle **"New Outlook"** off. Programmatic check:
```bash
defaults read com.microsoft.Outlook | grep IsRunningNewOutlook   # 1 = New (bridge reply path won't work)
```

When Legacy is eventually removed by Microsoft, the fallback is **Microsoft Graph
`createReply`/`createReplyAll`** (needs an Azure app registration + `Mail.Send`/
`Mail.ReadWrite`) — a contained swap of the AppleScript executor behind the same
`/draft` contract.

---

## AppleScript facts we learned (Legacy Outlook dictionary)

These were non-obvious and cost real time — the dictionary lives at
`/Applications/Microsoft Outlook.app/Contents/Resources/Outlook.sdef` (read it
with `awk`/`grep`; `sdef`/Script Editor needs full Xcode).

- **There is no `reply to all` command.** Reply-all is the `reply to` command with
  a boolean parameter: `reply to <message> reply to all true [without opening window]`.
  (`reply to all <message>` is a *syntax* error; `reply to all (<message>)` parses
  but errors "Can't continue all".)
- **Locate a message fast** with the native filter
  `messages of inbox whose subject contains <subject>` — do NOT loop 5000+ messages.
- **No native `internet message id` property** — the RFC `Message-ID` is inside
  `headers of <message>`. Disambiguate same-subject hits by
  `(headers of h) contains <internet-message-id>`.
- **Mark read = `set isread of <message> to true`** (one word, `isread`). It's a
  read/write boolean on `message`; compiles against the Legacy dictionary
  (`osacompile` resolves it). This is the whole `read` mode after the shared locate.
- **Strip `Re:`/`Fwd:` before the subject filter.** A reply card's subject often
  already carries "Re:", but the original inbox message may not — `whose subject
  contains "Re: X"` then returns zero hits. Normalize the prefix first; let the
  Message-ID narrow.
- **Preserve quoted history** by *prepending*, not overwriting:
  `set content of r to body & return & return & (content of r)`.
- AppleScript string comparison is **case-insensitive by default** (so a "Re:"
  strip also catches "RE:").
- `sdef` from the CLI needs full Xcode; without it, read the bundled `.sdef` XML
  directly or probe behavior with `osascript -e`.

---

## ⚠️ Data-shape gotcha (cost us a live bug)

The reply keys we thread against are **top-level `comms_predictions` columns**, NOT
nested in `card.email`:

| Need | Column (top-level) |
|------|--------------------|
| reply vs fresh | `mode` (`'reply'` / `'fresh'`) |
| thread key | `internet_message_id` (fallback `last_message_id`) |
| open in Outlook | `web_link` |

The comms-assistant doc *says* capture writes `conversation_id`/`internet_message_id`
"onto the card's email" — but in the persisted rows, `card.email.to` /
`card.email.internet_message_id` are **null**; the real values are the top-level
columns. The app query must `select` them and `buildDraftRequest` must read them
from the top level. **Lesson: verify the actual persisted shape, don't trust the
doc's claim.**

---

## Security model

- Binds **`127.0.0.1` only** (never network-exposed).
- Every `/draft` requires header **`x-bridge-token`** matching `OUTLOOK_BRIDGE_TOKEN`
  (blocks other local processes / browser-tab DNS-rebinding). 401 before any spawn.
- **No shell interpolation, ever.** Inputs travel as discrete **argv** items to
  `spawn('osascript', [...])`; AppleScript reads them via `on run argv`. Email body
  (AI-generated, attacker-influenceable) never touches a shell — no injection surface.
- **No `send`, ever.** The `fresh`/`reply` branches end at `open` (an unsent compose
  window — worst case); the `open` branch only opens an existing message window (no
  mutation at all); the `read` branch's only mutation is `set isread … true`. The
  bridge never sends mail. (Marking a message read is the single silent mailbox write
  it makes — deliberate, low-stakes, and the same write `second-brain-sync` already does
  via Graph; the human-in-the-loop send invariant is untouched.)
- Refuses to start if `OUTLOOK_BRIDGE_TOKEN` is unset, or `OUTLOOK_BRIDGE_PORT` is
  non-integer.

---

## Known limitations

- **Legacy Outlook only** (see above).
- **Reply + read + open lookup is Inbox-scoped.** A thread whose original you've already filed
  to a subfolder returns `NOT_FOUND`. For reply the button shows "original not found";
  for mark-read the client falls back to the queued `outlook-sync` task; for **open** the client
  falls back to the OWA `web_link` in a browser tab. Fine for a fresh triage sweep (still in Inbox).
- **Fresh first-time sends need a recipient.** Reply cards derive recipients via
  reply-all; a genuinely fresh card with an empty `to` is rejected (the button is
  hidden when there's no draft body, which covers the common no-op cases).
- Manual server start; success state ("Draft opened ✓") can linger when switching
  cards (inherited from the "Mark read" button pattern).

---

## Tests

```bash
# bridge: draft + mark-read + open request builders, /draft + /read + /open routes (mocked spawn)
node --import tsx --test comms-assistant/outlook-bridge/__tests__/draft-request.test.ts \
                          comms-assistant/outlook-bridge/__tests__/server.test.ts
node --import tsx --test app/src/lib/__tests__/draft-request.test.ts
# RPC fallback flag (hits the DB — run from repo root so root .env loads):
node --import tsx --test comms-assistant/__tests__/mark-read.test.ts
```

The AppleScript can't be unit-tested without launching Outlook; `osacompile -o
/dev/null comms-assistant/outlook-bridge/draft.applescript` confirms it *compiles*
(and that `isread` resolves against the Legacy dictionary), but the read-flag flip
and the `open` message-window pop need a live smoke test against Legacy Outlook. The
`/read` and `/open` routes, request shapes, and `NOT_FOUND` → fallback paths are
covered by the mocked tests above.
