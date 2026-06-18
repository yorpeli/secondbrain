# Bridge-First Comms Gather — Design

**Date:** 2026-06-18
**Status:** Approved design — ready for implementation plan
**Owner:** Comms Assistant

## Summary

Replace the comms sweep's **email gather + capture** with the local **Outlook bridge**
(`osascript` against Legacy Outlook), keeping the MCP only as a fallback for email and as
the sole path for Teams. Add a new **Claude-category** source (hand-picked emails that skip
the classifier). All sources converge into the existing pipeline unchanged:
**classify → comms-triage workflow → `predictions:add-many` → `/triage` app**.

The sweep runs **on-demand, at Yonatan's Mac** (confirmed). So the bridge — which needs the
Mac on with Legacy Outlook open — is the default; the MCP is the break-glass fallback.

## Goals

- **Email gather + capture move to the bridge** (default). No throttle, no 429, full bodies +
  Message-IDs in one local pass.
- **New Claude-category source:** emails Yonatan tags with the Outlook `Claude` category are
  pulled and **skip the classifier** (curated input), converging into the same pipeline.
- **MCP retained** as the email **fallback** (bridge down/unavailable) and as the **only**
  Teams path.
- **Nothing downstream changes** — classify, the workflow, `upsertPredictions`, the card
  payload, and the `/triage` app are reused as-is.

## Non-goals (YAGNI)

- Replacing the **Teams** gather (osascript cannot see Teams — it's a separate app with no
  usable AppleScript; Teams stays MCP, by physical necessity not choice).
- Headless/cloud/scheduled runs of the gather (the bridge needs the Mac; out of scope — those
  would use the MCP fallback path).
- An all-in-one "sweep" binary. The gather stays **Claude-orchestrated** per the CLAUDE.md
  procedure; this spec adds the bridge gather *commands* it calls and updates the procedure.
- HTTP endpoints for the gather (the gather is invoked by Claude in the terminal, not by the
  app — it's a CLI; the app-facing HTTP bridge for `/draft`/`/read`/`/open` is unchanged).
- Sending mail, or any mailbox write beyond the read-flag (existing) and the **category
  clear** introduced here.

## Source matrix

| Source | Gather | Classifier? | Notes |
|--------|--------|-------------|-------|
| **Unread email** | **Bridge** (`whose isread = false`) → MCP fallback | yes | two-stage: metadata → classify → capture survivors |
| **Claude-category email** | **Bridge** (`whose categories ∋ Claude`) | **no** (auto-keep; sensitive still flagged) | one-stage: capture directly |
| **Teams** | **MCP** (`chat_message_search` / `read_resource teams://`) | yes | unchanged from today |

All three converge at **classify** (which Claude-tag bypasses) and flow identically onward.

## Architecture

```
"sweep my unread"  /  "pull Claude emails"        (Yonatan, at his Mac)
   │
   ├── EMAIL  ── bridge (osascript, DEFAULT) ─────────────┐   [MCP email = fallback if bridge down]
   │      ├ unread:          whose isread = false          │      → classifier
   │      └ Claude-category: whose categories ∋ Claude     │      → SKIP classifier (auto-keep)
   │
   ├── TEAMS  ── MCP always ──────────────────────────────┤      → classifier
   │                                                       │
   └──────────────────── CONVERGE ─────────────────────────┘
            classify (unread + Teams; Claude-tag bypasses, sensitive still flagged)
              → comms-triage workflow ({ today, items })
              → predictions:add-many → upsertPredictions → /triage app
```

## Components

### 1. Bridge gather CLI — `comms-assistant -- pull-outlook --source=<unread|claude> [--stage=meta|capture]`
A new `run.ts` subcommand that shells out to `osascript` (Legacy Outlook) and emits clean
JSON on stdout / to a file. It is **read-only** on the mailbox (no flag/category writes in the
gather; the category *clear* is a separate explicit command — see §4).

- **`--source=unread --stage=meta`** → emits `{ outlook_id, subject, sender, recipients[],
  bodyPreview }[]` for every unread inbox message (cheap: id + subject/sender/to + a short
  `plain text content` slice). The `EmailMeta` subset feeds `classify`; the `outlook_id`
  (the Outlook integer message id, stable per store — verified stable across separate
  `osascript` invocations) is retained so survivors can be addressed in the capture stage.
- **`--source=unread --stage=capture --ids=<outlookIds.json>`** → for the classifier
  survivors (addressed by `outlook_id` via `messages of inbox whose id is <n>`), emits full
  **capture packets** (§3).
- **`--source=claude --stage=capture`** → emits full capture packets for all
  `Claude`-categorized inbox messages directly (no meta/classify stage).

Two-stage for unread mirrors today's cost model (don't read bodies for noise that gets
dropped). One-stage for Claude (curated; read bodies directly).

### 2. Locate & scan strategy (AppleScript, Legacy Outlook)
- **Unread:** `messages of inbox whose isread is false` — fast native filter; returns only
  unread (no pagination/cursor). Page nothing; it's one set.
- **Claude-category:** category cannot be used in a `whose` predicate, and `message i of
  inbox` is **not** date-ordered, so: narrow with the valid filter
  `messages of inbox whose time received > (current date - <window> days)` (default window 7d,
  widenable via `--window`), then per-message category check on the **live references**
  (dereferencing with
  `contents of` breaks category resolution). Read category names via **index access**:
  `name of (item k of (categories of mref)) is "Claude"`.
- **Message fields:** `subject`, `sender` (use `address of (sender of m)`; on failure parse the
  `From:` header — internal Exchange senders don't always resolve), `time received`,
  `plain text content`, and `headers` (for `Message-ID`, `Thread-Index`, `References`).
- These AppleScript facts are documented in `comms-assistant/outlook-bridge/README.md`.

### 3. Thread collapsing + capture-packet shape
- **Collapse threads to the latest message.** Group by `Thread-Index` header (fallback:
  normalized subject = subject with leading `Re:`/`Fwd:`/`Fw:` stripped, case-insensitive),
  keep the single newest by `time received`. The latest body carries the quoted history.
  **Short-body guard:** if the latest body is < 200 chars and an earlier tagged message in the
  same thread is longer, include the longer one's body too (forked/contentless-"thanks" case).
- **Stable `thread_id`:** derive from `Thread-Index` (fallback normalized subject) so re-pulls
  of the same conversation **update the same card** even as the latest Message-ID changes.
- **Capture packet** (matches the workflow input contract — `triage.workflow.js`):

```jsonc
{
  "slug": "<stable thread slug>",
  "email": {
    "subject": "...", "from": "...", "date": "<ISO>",
    "to": ["..."], "excerpt": "...",
    "channel": "outlook",
    "internet_message_id": "<RFC Message-ID of latest>",
    "conversation_id": "<Thread-Index or normalized-subject key>",  // → thread_id on persist
    "web_link": "<owa link if available>"
  },
  "thread": { "subject": "...", "participants": ["...To/Cc..."], "mentions": ["..."], "bodyToDate": "<full latest body>" },
  "signals": { "sensitive": false, "directToHim": true, "askToHim": true, "broadcast": false, "cold": false },
  "body": "<full latest body>",
  "today": "<ISO date — live date passed in>"
}
```

`participants` = sender + To/Cc; `mentions` = @-mentioned addresses parsed from the body;
`signals` are cheap structural flags for tier-routing (sensitive → T2, etc.).

### 4. Category drain — `comms-assistant -- pull-outlook --drain` (clear after resolve)
Before ingesting, the run **drains resolved tags**: for each currently-`Claude`-tagged email,
look up its card in `comms_predictions` by `internet_message_id` (fallback `thread_id`/
`web_link`); if the card is **resolved** (`status in ('dismissed','sent')` or `resolution`
not null), the bridge **removes the `Claude` category** from that message (AppleScript: set the
message's categories to the list minus `Claude`). This is the only new mailbox write; it is
benign metadata, comparable to the read-flag write. All Outlook mutations stay inside the
on-demand command Claude runs — no app↔bridge live coupling.

### 5. Classifier routing & convergence
- **Unread email + Teams** → `classify` (default triage gate: drop noise, flag sensitive,
  keep fresh+reply).
- **Claude-category** → **bypass** classify (auto-keep). Still compute `isSensitive` (so the
  sensitive flag/tiering holds and a sensitive thread isn't blindly auto-drafted).
- All survivors → one `items` array → **comms-triage workflow** (`{ today, items }`) →
  `predictions:add-many`.

### 6. Persistence keys (so app buttons work)
`upsertPredictions` maps capture-packet fields to the top-level `comms_predictions` columns —
critically `mode`, `internet_message_id`, `last_message_id`, `thread_id`, `web_link`,
`channel`, `action_type/target`, `tier`, `verdict`, `card`. These are exactly the columns the
`/triage` app reads for **Push to Outlook draft / Mark read / Open in Outlook**, so
bridge-gathered cards get working buttons for free (this is the top-level-columns lesson from
the push-to-draft build). Idempotency: upsert matches `thread_id → internet_message_id →
web_link`, guards `user_touched`, never touches reconciled rows.

## Data flow (end-to-end, one run)

1. `pull-outlook --drain` → clear `Claude` category on already-resolved tagged emails.
2. `pull-outlook --source=unread --stage=meta` → `EmailMeta[]`.
3. `classify --payload=<meta>` → survivors (+ sensitive flags).
4. `pull-outlook --source=unread --stage=capture --ids=<survivor ids>` → unread capture packets.
5. `pull-outlook --source=claude --stage=capture` → Claude-tag capture packets (no classify).
6. **Teams (MCP):** existing procedure → Teams capture packets → classify.
7. Merge all packets → **comms-triage workflow** `{ today, items }`.
8. Build `items.json` → `predictions:add-many` → `/triage` app.
9. **Fallback:** if step 2/4 fails (bridge down), fall back to the MCP email gather
   (`outlook_email_search` + `read_resource`) for the unread source; Claude-category has no MCP
   equivalent (category is local-only) and is simply skipped in fallback mode.

## Error handling

| Condition | Behavior |
|---|---|
| Bridge / osascript unavailable (Outlook closed, New Outlook on) | Email gather falls back to MCP unread; Claude-category skipped (local-only); surface a clear notice. |
| New Outlook detected (`IsRunningNewOutlook=1`) | Hard notice: bridge gather needs Legacy; either switch or use MCP fallback. |
| Sender address unresolved | Parse `From:` header; else `(unknown)`. |
| Drain: message not found for a resolved card | Skip (already moved/deleted); no error. |
| Category clear fails | Log + continue ingest (drain is best-effort). |
| Empty unread / no Claude tags | Report "nothing to gather" — no silent success. |

Surface all drop/skip/fallback counts (no silent truncation — same discipline as the existing
sweep).

## Testing

- **Pure units (`node --import tsx --test`):** thread-collapse + normalized-subject key,
  capture-packet assembly from a raw osascript JSON fixture, classifier-routing (Claude-tag
  bypass vs unread/Teams gated), drain target selection (resolved-card filter).
- **AppleScript (manual smoke, documented):** `pull-outlook --source=claude --stage=capture`
  against a real tagged email; `--source=unread --stage=meta` returns unread only;
  `--drain` clears a tag whose card is resolved (and leaves an open one). Scripts must not
  mutate beyond the intended category clear.
- **Idempotency:** re-running a pull updates the same cards (no duplicates); a `user_touched`
  card is not clobbered.

## Dependencies & risks

- **Legacy Outlook for Mac required** (New Outlook's AppleScript is dead — compose-only).
  Bridge gather is unavailable on New Outlook → MCP fallback for unread; Claude-category
  unavailable.
- **Mac on, Outlook open, on-demand** — by design (confirmed run context). Not for
  headless/cloud.
- **Category assignment has a sync lag** (~1-2 min) to the AppleScript-visible store — a
  freshly-tagged email may not appear until the next pull. Documented behavior, not a bug.
- **Full-mailbox category filter is unavailable** — the date-windowed scan (default 7d) is the
  mitigation; a tag older than the window needs `--window` widened.
- **Teams unchanged** — still throttle-bound MCP, serial.

## Procedure updates (docs, not code)

Update `comms-assistant/CLAUDE.md` (and the agent doc) sweep procedure: email gather/capture →
bridge-first with MCP fallback; Teams → MCP; classifier routing (Claude-tag bypass); the drain
step; the `pull-outlook` CLI. The `outlook-bridge/README.md` gains the gather commands + the
`isread`/category scan facts.
