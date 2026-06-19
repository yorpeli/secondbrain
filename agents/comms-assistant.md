# Comms Assistant — orchestrator decision-assistant

**Slug:** `comms-assistant`  ·  **Dir:** `comms-assistant/`  ·  **Status:** scaffold (v1 backtest done; live mode in design)

Learns *how Yonatan decides and communicates* by predicting his responses to comms and
self-correcting from where the prediction diverged from what he actually sent. Read-only
MSFT connector by design: the system predicts/drafts into the DB, Yonatan sends manually
from Outlook, a later sweep reads Sent Items and diffs. Spec:
`docs/superpowers/specs/2026-06-13-comms-response-learning-loop-design.md`.

## The loop — two passes
- **Pass A · Predict** (new mail that needs a decision): sweep Inbox → `classify.ts`
  deterministic noise/sensitive cull → per-thread **prediction sub-agent**
  (`prompts/prediction-subagent.md`) using the retrieval bundle → write `comms_predictions`
  (`actual_reply=null`).
- **Pass B · Reconcile + distill** (a later sweep): read Sent Items → match to open
  predictions → delta (style + stance) → bucket `resolution` → ask "why?" on stance changes
  (batched) → update `comms_rules` (reinforce / contradict / decay / supersede / promote).

Prediction and analysis run on *different* items each sweep: Pass B on yesterday's
predictions, Pass A on today's new mail. **Triggered from the Command Center** gather/close
cycle (standalone agent; CC calls into it).

## Retrieval — `retrieve.ts` (`assembleContext`)
Tiered context, each tier a distinct source/method (anti-dilution: exact facts exact, fuzzy
narrative semantic):
- **Spine — rules**: `comms_rules` scope-match (SQL). assert / whisper / track by confidence.
- **T1 — identity**: `people` / `v_org_tree` exact lookup → who, role, relation to Yonatan.
- **T2 — ownership**: `context_store` key `comms_org_ownership` (load-whole) → KYC∈CLM, reporting chain, red-lines.
- **T3 — narrative**: `searchByType` over memory/agent_log/PPP (threshold 0.4, capped, low-trust, last). The sub-agent **curates** it into a 1-3 line `memory_brief` (what actually bears on this email / what he should know), not a raw snippet dump — the triage card shows the brief + a faint sources line, "nothing material in memory" when empty.
Prompt precedence: thread → rules → T1/T2 → T3.

## Data
- `comms_predictions` (per-item, `actual_reply=null` until reconciled) — never embedded.
- `comms_rules` (versioned rulebook; `watch`→`active` at support≥3, consistency≥0.7, diversity≥2; `pinned` = Yonatan's explicit word) — never embedded.
- `context_store.comms_org_ownership` (T2 map; editable from Claude Code + Claude.ai).
- Decision-type rules + `why` answers also belong in `decision_journal` (follow-up).

## Pass A — sweep (agent procedure)
The Node CLI has **no Graph access**; MSFT reads happen here in the agent session via MCP
(same split as command-center/outlook). Steps:

1. **Pull Inbox** — `mcp__claude_ai_Microsoft_365__outlook_email_search` (folderName "Inbox",
   recent window, paginate). Build `EmailMeta[]` = `{subject, sender, recipients, bodyPreview}`.
2. **Classify** — `npm run comms-assistant -- classify --payload=<EmailMeta[].json>` → keep
   `needsPrediction` survivors; the drop breakdown is logged (no silent truncation; sensitive
   threads are flagged, never drafted).
3. **Per survivor** — `read_resource` the message for the full incoming body + participants +
   @mentions. Build a `ThreadInput` `{subject, participants, mentions, bodyToDate}` — **omit
   `asOf`** (live = blind for free). Backfill `people.email` from the message when missing.
4. **Assemble context** — `npm run comms-assistant -- context:assemble --file=<ThreadInput.json>`
   → the `ContextBundle` (T1/T2/spine/T3).
5. **Predict (sub-agent)** — dispatch a sub-agent with `prompts/prediction-subagent.md` + the
   bundle. It returns `{action:{type,target,channel?,secondary?}, disposition, predicted_reply,
   predicted_stance, needs_data, confidence, confidence_score, context_available}` — it **chooses the
   action + target** (reply/redirect/sidebar/route/task/escalate/schedule/monitor/none), then drafts
   the message for action types that produce one.
6. **Store** — map to a `PredictionRow` and `npm run comms-assistant -- predictions:add
   --payload=<row.json>` (`mode:'reply'`, `action_type`/`action_target` set, `disposition` alias,
   `actual_reply/resolution:null`, identifiers from the message). `task`/`monitor`/`none` actions still
   store a row (with `predicted_reply` null).

## Two-flow architecture (spec: `docs/superpowers/specs/2026-06-16-comms-triage-db-app-design.md`)

- **Flow 1 (assist):** sweep → fan-out → `comms_predictions` (full card payload) → **`/triage` app**
  (primary review surface, `app/`, route `/triage`) → in-app edits / accept-reject → `comms_feedback`
  via `comms_apply_feedback` RPC. The `render-triage.ts` HTML is now an optional fallback/export only.
- **Flow 2 (learn):** on-demand `rules:distill` reads new `comms_feedback`, session clusters + asks
  clarifying questions + proposes `rules:add`/`supersede`, then `rules:distill --mark=<ids>` stamps
  rows processed. **In-app feedback (`comms_feedback`) is the PRIMARY learning signal.**

## Pass B — reconcile (demoted, not built)
~~Pass B / Sent-Items reconcile~~ is **demoted** to a secondary fallback for *out-of-band sends only*
(Yonatan replied from Outlook without ever opening the card). **It is not built.** When eventually built,
it must treat `comms_feedback` as primary and `actual_reply` from Sent Items as secondary corroboration.
Prior Pass B description for reference: read Sent Items → match to open predictions (thread_id /
subject+participants) → `delta` (style + stance + **action**: `actionDelta()` captures the diff —
incl. "briefed leaders" = `redirect`, "messaged third party" = `sidebar`) → `resolution` →
`predictions:reconcile` → cluster → `rules:add`/`supersede`. Action-selection patterns feed
`comms_rules` type `decision`, scoped `{topic, channel}`, graduate watch→active→assert.

## Predict vs Assist — two modes, and the analytics hook
These are **different products** and conflating them hurts prediction (proven on the CLM payer
rollout thread, 2026-06-12: a data-rich draft was 6.5× longer than the 2-line reply Yonatan
actually sent).

- **Predict** (the silent loop): model what Yonatan *would send* — usually terse, routing the
  digging to a tracking forum, not answering with analysis in-thread. **It never auto-pulls data.**
  When the right reply depends on numbers, the sub-agent sets **`needs_data: true`** and flags it —
  it does not fetch. This is what gets stored in `comms_predictions` and reconciled.
- **Assist** (opt-in, human-in-the-loop): when `needs_data` is set *and* Yonatan wants a data-backed
  answer, invoke the **analytics agent** (`clm-main` skill / `analytics/`) to pull the real numbers
  and produce a **clearly-labeled data-backed draft option**, separate from the behavioral
  prediction. Caveat data as preliminary unless verified (per the data-discipline rule). Yonatan
  picks; whatever he sends is the `actual_reply` that Pass B reconciles against the behavioral
  prediction.

Why gated, not automatic: pulling Looker on every data-mentioning email is slow/expensive and
biases predictions long — toward a "best answer" the recipient never sees rather than the short
thing Yonatan sends. (Unlike T3 embeddings, Looker *can* filter by date, so the analytics tool is
as-of-safe for backtests — but that's secondary to the predict-vs-assist split.)

## Commands (`npm run comms-assistant -- <cmd>`)
Live wiring: `classify`, `context:assemble`, `context:probe`.
DB: `predictions:add|add-many|list|reconcile`, `rules:list|add|supersede|pin`, `rules:distill [--mark=<ids>]`.
Outgoing: `send-initiated --payload=<InitiatedInput.json>`, `contacts:resolve --query=<name|email>`, `contacts:learn --payload='{...}'`.
Still to build: Pass B Sent-Items reconcile (demoted fallback; see Two-flow architecture above).

## Outgoing email flow ("send X an email about it")

Triggered mid-conversation when Yonatan says "send Elad an email about it", "draft an email to Yael re: …",
"email Yaron a heads-up on this". The conversation is the source material — **you (the conversation agent)
draft it**, not a blind sub-agent. Read-only: the bridge opens a draft in Outlook, **never sends**.

1. **Resolve recipient.** `npm run comms-assistant -- contacts:resolve --query="<name|email>"` →
   `{slug?,name?,email?,source}`. If `source:'unknown'` or `email` missing → ask Yonatan once.
2. **Gather.** Build a `ThreadInput` (`subject`=topic, `participants`=[Yonatan's email, the recipient's email
   (from step 1's `contacts:resolve`)], `bodyToDate`=brief of what was discussed) and run `context:assemble`
   — rule spine + T1/T2/T3. **T1 resolves participants by email (exact `people.email` match), not slug —
   always pass email addresses here.** Surface the `memory_brief` + sources.
3. **Draft** in Yonatan's voice applying the rule spine + pinned executive-voice (see
   `prompts/prediction-subagent.md` → *Initiated mode*). Opening conventions: greeting + purpose
   in the first line (no stale-thread acknowledgment — there's no lag to own). Self-eval
   (language / etiquette / exec-voice). Compute **stakes**: SVP+ recipient (Yaron, Oren) /
   external or vendor / sensitive topic / grounding-heavy factual claims → **escalate**.
4. **Escalate (high-stakes only).** Dispatch three fresh/blind adversarial verifiers (faithfulness /
   ownership-and-facts / voice-and-etiquette) over {draft, bundle, brief}. Majority-refute
   (≥2/3, severity > none) → surface the flags inline before showing the draft. Verifiers stay
   fresh (independent, never sharing the drafter's context).
5. **Show + approve in chat.** Present draft + recipient + `memory_brief`/sources + confidence +
   any flags. Yonatan approves / edits / asks for a revision (loop back to 3 up to three times).
6. **Push + persist (one command).** `npm run comms-assistant -- send-initiated --payload=<InitiatedInput.json>`:
   pushes a fresh Outlook draft via the bridge (needs `npm run outlook-bridge` + Legacy Outlook;
   if bridge is down, fall back to pasting the approved text). Then persists the `mode:'initiated'`
   card to `comms_predictions` and records the **approve-time edit diff** as the primary learning
   signal: edit → `comms_feedback` kind `edit` with the `delta`; verbatim → kind `note`
   `approved_verbatim`. `rules:distill` consumes it like any feedback. The approve-time edit diff
   is the primary signal — not a Sent-Items reconcile.
7. **Learn the contact (if you had to ask).** `npm run comms-assistant -- contacts:learn --payload='{"slug":"…","email":"…"}'`
   (known person → backfills `people.email`; `fill` silently, `confirm` if it differs) or
   `--payload='{"name":"Vendor X","email":"…"}'` (external → `comms_contacts`). Next time, no ask.

`InitiatedInput`: `{ recipient:{email,name?,slug?}, subject, draft, approved, trigger_text,
action_type?, action_target?, thread?:ThreadInput, tier?, verdict?, confidence?, why?, memory_brief?, sensitive? }`.
`draft` = what you first composed; `approved` = what Yonatan OK'd (equal if verbatim).

Sensitive topics: drafted-but-flagged (he explicitly asked), unlike incoming-sensitive which is never
drafted. Always show the flag. Contact learning: known-person backfills `people.email`; external
upserts to `comms_contacts`. Full procedure: [comms-assistant/CLAUDE.md](../comms-assistant/CLAUDE.md).

## Triage sweep (repeatable) — natural-language trigger
When Yonatan says **"sweep my unread"**, **"triage my inbox"**, **"morning triage"**, or **"what
needs a response?"**, run this and open the `/triage` app (he never runs the CLI; you do):

1. **Gather from two first-class sources** (don't draft from Teams *notification emails* — they carry only a
   clipped preview; scan Teams directly instead):
   - **Email — bridge-first (DEFAULT, run at the Mac):** `npx tsx comms-assistant/run.ts pull-outlook
     --source=unread` (osascript / Legacy Outlook; `whose is read is false` → classify → collapse by
     Thread-Index root → emits `CapturePacket[]`, full bodies already captured). Also `--source=claude` =
     the curated `Claude`-category source ("pull Claude emails"; skips classify, lazy tag-drain). Doc:
     [../comms-assistant/outlook-bridge/GATHER.md](../comms-assistant/outlook-bridge/GATHER.md).
     **Fallback (not at the Mac / bridge down):** `outlook_email_search` with **`query:"isRead:false"`**
     (folderName "Inbox") — filters to unread **server-side** (no client scan, no blind spot for deep unread).
     Free-text query pages by `cursor`, not `offset`; `order` n/a. **Page to exhaustion — don't cap** (old-but-unread
     is recency-ranked, sinks below recent). **Drop** `no-reply@teams.mail.microsoft` / `@odspnotify` notifications.
   - **Teams** — two passes, unioned by `chatId`:
     **(a) roster + whitelist** — all 1:1s + whitelisted CLM-leadership groups (the known scope).
     **(b) +15 recent chats** — `chat_message_search query:"*"` over a 24-48h window (`afterDateTime`) returns one
     **recency-sorted stream across all chats** (broad scan works as of 2026-06-17 — supersedes the old "returns
     nothing" note); group by `chatId`, take the **top 15 distinct** chats, incl. non-whitelisted groups, so an
     active thread from someone off the roster isn't missed. In both passes keep messages **from others** (not
     Yonatan) where **he hasn't replied after** (no-reply heuristic — no native unread flag); **skip meeting
     chats** (`…meeting_…@thread.v2`). Fetch bodies via `read_resource teams:///chats/{chatId}/messages/{id}`;
     tag the card `channel:'teams'`.
2. **Classify** — `npm run comms-assistant -- classify --payload=<EmailMeta[].json>` → the **triage gate
   keeps fresh + reply** emails needing a response, dropping only noise (bot senders, calendar/RSVP, app
   notifications, OOO, meeting invites, broadcast DLs) and flagging sensitive (never drafted). First-time
   sends are first-class — not gated on `Re:`. (`--backtest` = Re:-only `needsPrediction`, learning loop only.)
   Apply the same noise/sensitive judgment to Teams survivors. Drop breakdown logged (no silent truncation).
3. **Capture each survivor (orchestrator, SERIAL)** — `read_resource` the full body + participants +
   @mentions for every survivor, **one at a time**. This is the throttle-bound step (Graph ~80/min;
   parallel reads trip a 429) and it **stays in the orchestrator session** — it owns the MSFT MCP. Build a
   `ThreadInput` per thread (`{subject, participants[], mentions?, bodyToDate}`, **omit `asOf`** = live; for
   Teams synthesize a short `subject`). Long threads spill to a saved file → slice the top with python, don't
   re-read. (Subagents must NOT call MSFT — they often can't see the claude.ai MCP in headless runs anyway.)
4. **Fan out one subagent per thread (PARALLEL, no MSFT)** — dispatch a subagent per captured thread with
   `prompts/prediction-subagent.md` + the thread text + its `ThreadInput`. Each subagent: runs
   `context:assemble` for its thread (DB only — `searchByType`/T1/T2/spine, parallel-safe), **chooses the
   action + target** (`action.type` ∈ reply/redirect/sidebar/route/task/escalate/schedule/monitor/none,
   `action.target`) applying the rulebook (**pinned executive-voice**; **`route` = name the owner, don't
   publicly instruct**; `redirect` = brief leaders, not the thread; default `monitor`/`none` over busywork),
   drafts `text` for message-producing actions (`task`/`monitor`/`none` = no text), sets `needs_data` (flag,
   don't fetch) + a curated **`memory_brief`**, and **returns the `{email, thread, suggestion}` item as strict
   JSON**. Hebrew → `text` + `text_alt`(EN). Why split this way: capture is serial-and-MSFT-bound, so it stays
   in one place; reasoning + drafting is the expensive part, so it fans out — and the orchestrator's context
   never fills with raw 60KB–800KB bodies.
5. **Collect → build → persist (orchestrator)** — gather the subagents' JSON into `items.json` (array of
   `{email, thread, suggestion}`) then **persist**: `npm run comms-assistant -- predictions:add-many --payload=<items.json>`
   writes each card (full payload, `action_type`/`action_target`, `last_message_id`, `captured_at`) to
   `comms_predictions`. `upsertPredictions` never clobbers a `user_touched` card.
6. **Review in the `/triage` app** (primary) — Supabase-backed, `app/`, route `/triage`. He edits drafts /
   accepts-rejects actions / adds notes; feedback lands in `comms_feedback` via `comms_apply_feedback` RPC.
   **Mark read (no reply needed):** the "Mark read in Outlook & dismiss" button (Outlook/email cards only)
   dismisses the card and queues an `outlook-sync` mark-read task — handled by the `second-brain-sync` Outlook
   skill (read flag only) so monitor/none items he never needs to answer get cleared from the inbox too. Calls
   the `comms_mark_read` RPC.
   Optional fallback: render the HTML export with
   `npx tsx comms-assistant/render-triage.ts --file=<items.json> --out=output/comms-triage/triage-$(date +%F).html`
   (render-triage re-runs `assembleContext` per item for the People/Guardrails/Rules columns).

For the HTML fallback/export, the page look is the editable template **`templates/triage.html`** — restyle
freely; card data comes from `render-triage.ts` + the retrieval layer.

## Files
`run.ts` (CLI) · `classify.ts` (noise/sensitive gate) · `retrieve.ts` (tiered context) ·
`card.ts` (`buildCardPayload`) · `sweep.ts` (`classifyThreadForSweep` — skip/refresh/user_touched guard) ·
`distill.ts` (Flow 2 load/mark) · `render-triage.ts` (HTML fallback/export) ·
`templates/triage.html` (editable page look) ·
`store.ts` `asof.ts` `delta.ts` `confidence.ts` `types.ts` · `prompts/prediction-subagent.md`
· `RUNBOOK.md` (v1 backtest procedure).
