# Outlook Bridge — Push to Outlook Draft

A tiny **localhost HTTP bridge** that lets the `/triage` app open a pre-filled,
reviewable draft in the **Outlook for Mac** desktop app. It **never sends** —
Yonatan reviews and sends from Outlook himself (preserves the comms-assistant's
read-only / human-in-the-loop design).

Two card kinds are supported, both fully local (no Azure / no Graph):
- **Fresh** email → new compose window, pre-addressed.
- **Reply** → true threaded **reply-all** draft ("Re:" subject, original
  recipients, your text above the quoted history).

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
                                                                      |
                                                               reviewable Outlook draft window  (you hit Send)
```

Files:
- `draft-request.ts` — `DraftRequest` type, `validateDraftRequest`, `buildOsascriptArgs` (pure).
- `server.ts` — `createBridge()`: token gate, CORS, single-response guard, spawn (injectable `spawnFn`).
- `draft.applescript` — `on run argv` → fresh compose / threaded reply-all.
- `bridge.ts` — entrypoint: loads env, binds `127.0.0.1:7777`.
- App side: `app/src/lib/draft-request.ts` (`buildDraftRequest`), `app/src/hooks/use-triage.ts` (`usePushOutlookDraft`), `app/src/pages/triage.tsx` (the button).

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
- **Draft-only.** Both AppleScript branches end at `open`; there is no `send`
  anywhere. Worst case is an unsent compose window.
- Refuses to start if `OUTLOOK_BRIDGE_TOKEN` is unset, or `OUTLOOK_BRIDGE_PORT` is
  non-integer.

---

## Known limitations

- **Legacy Outlook only** (see above).
- **Reply lookup is Inbox-scoped.** A thread whose original you've already filed to
  a subfolder returns `NOT_FOUND` (button shows "original not found"). Fine for a
  fresh triage sweep (messages are still in the Inbox).
- **Fresh first-time sends need a recipient.** Reply cards derive recipients via
  reply-all; a genuinely fresh card with an empty `to` is rejected (the button is
  hidden when there's no draft body, which covers the common no-op cases).
- Manual server start; success state ("Draft opened ✓") can linger when switching
  cards (inherited from the "Mark read" button pattern).

---

## Tests

```bash
node --import tsx --test comms-assistant/outlook-bridge/__tests__/draft-request.test.ts \
                          comms-assistant/outlook-bridge/__tests__/server.test.ts
node --import tsx --test app/src/lib/__tests__/draft-request.test.ts
```

The AppleScript can't be unit-tested without launching Outlook; its behavior is
verified by the live smoke tests in the plan (Task 3) and the `NOT_FOUND` path.
