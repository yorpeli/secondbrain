# Gather (pull-outlook) — Claude-category ingestion

A separate path from the app-facing HTTP bridge (`/draft` · `/read` · `/open`, see
[README.md](README.md)): a **CLI that Claude runs** which pulls emails Yonatan tags with the
Outlook **`Claude` category**, collapses threads, and emits capture packets for the existing
`comms-triage` workflow.

Spec/plan: `docs/superpowers/specs/2026-06-18-bridge-first-comms-gather-design.md` ·
`docs/superpowers/plans/2026-06-18-claude-category-ingestion.md` (Plan A). Plan B replaces the
**unread** email sweep with the bridge too, reusing this machinery.

## Run it

```bash
# emit capture packets (JSON on stdout) for Claude-tagged emails in the last 7 days.
# run via tsx DIRECTLY — `npm run` prepends a "> …" banner that breaks JSON parsing:
npx tsx comms-assistant/run.ts pull-outlook --source=claude --window=7 --today=2026-06-18
#   stderr: "pull-outlook claude: total=N kept=M drained=K"
#   stdout: CapturePacket[]
```

Then Claude feeds the packets into the `comms-triage` workflow → `predictions:add-many` →
`/triage` app — Claude-tagged emails **skip the classifier** (auto-keep, curated) but still get
a `signals.sensitive` flag via `classifyEmail`.

## Flow

```
pull-outlook --source=claude
  → gather.applescript claude-capture <window>     (Legacy Outlook, control-char stream)
  → parseGatherRecords  (\x1f fields, \x1e records)
  → collapseThreads     (one per Thread-Index / normalized-subject, latest, short-body guard)
  → per thread: isResolved(internet_message_id)?   (query comms_predictions)
        resolved (status dismissed/sent or resolution set) → gather.applescript clear <id>  (drain the Claude tag)
        else                                                → toCapturePackets → stdout
```

The **drain** (clearing the `Claude` category on a resolved card's email) is the only new
mailbox write, and it stays inside this on-demand command — no app↔bridge live coupling.

## Files

| File | Role |
|------|------|
| `gather.applescript` | modes `claude-capture` (emit records) + `clear` (remove Claude category) |
| `gather-parse.ts` | `parseGatherRecords` — delimited stream → `RawGatherRecord[]` |
| `gather-collapse.ts` | `normalizeSubject` / `threadKey` / `collapseThreads` (latest per thread + short-body guard) |
| `gather-packets.ts` | `toCapturePackets` — records → workflow-shaped `CapturePacket[]` |
| `gather.ts` | `pullClaudeTagged` — orchestration; injectable `exec` + `isResolved` |
| `run.ts` | `case 'pull-outlook'` (`--source=claude --window --today`) |

## AppleScript facts the gather added (Legacy Outlook)

- **Unread filter** (used by Plan B): `messages of inbox whose is read is false` — the property
  is **`is read`** (two words), NOT `isread`.
- **Category is not filterable in a `whose` predicate**, and `message i of inbox` is **not**
  date-ordered — narrow with `whose time received > (current date - <window> days)`, then a
  per-message category check on **live references** (`contents of` breaks category resolution),
  reading names via index access `name of (item k of (categories of mref))`.
- **Category assignment has a ~1–2 min sync lag** to the AppleScript-visible store.
- **`my`-called handlers run in the script context, not the app** — a handler touching Outlook
  (sender/headers/categories) must wrap its access in its own `tell application "Microsoft
  Outlook"` block, or the property access silently fails.
- **`sender` is itself the email-address record** — bind it (`set s to sender of m`) before
  `address of s`. **Recipients:** materialize `to recipients`, then `address of (email address
  of rcpt)` on a bound item.
- **Header values can fold onto the next line** (e.g. `Message-ID:`) — take the next paragraph
  only when it's a real RFC-2822 fold (starts with space/tab), and guard `text (len+1) thru -1`
  against the out-of-range throw when the line is just the field name.
- **Thread-Index is per-message** (replies extend the parent's), so two same-subject messages
  with different Thread-Index roots are genuinely **different conversations** and stay separate.

## Unread (`--source=unread`) — Plan B

The bridge is also the **default email gather** for the unread sweep (MCP becomes the
fallback; Teams stays MCP). Same machinery, one extra mode:

```bash
npx tsx comms-assistant/run.ts pull-outlook --source=unread --today=2026-06-18
#   stderr: "pull-outlook unread: total=N kept=M | dropped: automated sender=8, app notification=5, …"
#   stdout: CapturePacket[]
```

Flow: `gather.applescript unread-capture` (`messages of inbox whose is read is false`) →
parse → **classify each** (`classifyEmail`; keep `!isNoise`, drop noise with a per-reason
breakdown, **flag** sensitive — sensitive is kept, not dropped) → collapse → `toCapturePackets`
with **`deriveUnreadSignals`** (per-email tier heuristic: `broadcast` ≥10 recipients,
`directToHim` ≤3, `askToHim` if body has `?`, `cold` always false). Unlike curated Claude
tags, unread is **not** auto-routed to T2 — its tier is derived.

**One-stage, not two-stage.** AppleScript has no cheap preview (`plain text content` *is* the
body), so a "metadata" stage would read bodies anyway; since local reads are unthrottled we
read all unread once and classify in TS. (Deviation from the spec's two-stage, by design.)

**No drain** for unread (unread emails carry no `Claude` category). **MCP fallback** for email
+ **Teams** are Claude-orchestrated on bridge failure (not built into the CLI).

Live-verified (2026-06-18): 41 unread → 15 noise dropped (automated senders incl. Teams
notifications, app notifications, meeting invites, broadcast DLs) → 26 packets with
Message-ID + derived signals.

## Limitations

- **Legacy Outlook only** (New Outlook's AppleScript is gutted — see README).
- **Drain is message-level** — matched by `internet_message_id`, so a tag clears only when
  *that* message's card is resolved (a sibling reply being `sent` won't clear it).
- **7-day default window** (`--window` to widen); a tag older than the window is missed.
- Consume stdout JSON via `npx tsx …` (or redirect), not `npm run` (banner breaks parsing).
- **Unread one-stage reads all unread bodies at once** into the 64 MB `execFile` buffer before
  classifying. Fine for a normal inbox (tens of unread); a very large unread backlog (hundreds
  of long threads) could approach the ceiling — clear the backlog or raise `maxBuffer` if so.
