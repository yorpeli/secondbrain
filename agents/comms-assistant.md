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

## Pass B — reconcile + distill (later sweep, to build)
Read Sent Items → match to open predictions (thread_id / subject+participants) → `delta` (style
+ stance + **action**: did he take the suggested `action_type`, aimed at the suggested `action_target`?
`actionDelta()` captures the diff — incl. "no in-thread reply / briefed leaders" = `redirect`, "messaged
a third party" = `sidebar`) → `resolution` → ask "why?" on stance/action changes (batched into CC
close-out) → `predictions:reconcile`; then cluster → `confidenceScore`/`statusFor` → `rules:add`/`supersede`.
**Action-selection patterns feed `comms_rules` type `decision`** (higher value than phrasing), scoped by
`{topic, channel}` — they graduate watch→active→assert like style rules.

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
DB: `predictions:add|list|reconcile`, `rules:list|add|supersede|pin`.
Still to build: a `reconcile`/`distill` helper for Pass B (today done agent-side as in the backtest).

## Triage sweep (repeatable) — natural-language trigger
When Yonatan says **"sweep my unread"**, **"triage my inbox"**, **"morning triage"**, or **"what
needs a response?"**, run this and open the HTML (he never runs the CLI; you do):

1. **Gather from two first-class sources** (don't draft from Teams *notification emails* — they carry only a
   clipped preview; scan Teams directly instead):
   - **Email** — `outlook_email_search` with **`query:"isRead:false"`** (folderName "Inbox") — filters to
     unread **server-side** (no client scan, no blind spot for deep unread). Free-text query pages by `cursor`,
     not `offset`; `order` n/a. **Page to exhaustion — don't cap** (old-but-unread is recency-ranked, sinks below
     recent). **Drop** `no-reply@teams.mail.microsoft` / `@odspnotify` notifications.
   - **Teams** — `chat_message_search` over a 24-48h window (`afterDateTime`); keep messages **from others**
     (not Yonatan) in a **1:1 chat or a whitelisted CLM-leadership group**, where **he hasn't replied after**
     (no-reply heuristic — no native unread flag). Scope: **all 1:1s + CLM-leadership groups only**. Fetch
     bodies via `read_resource teams:///chats/{chatId}/messages/{id}`; tag the card `channel:'teams'`.
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
5. **Collect → build → render (orchestrator)** — gather the subagents' JSON into `items.json` (array of
   `{email, thread, suggestion}`) and **render**:
   `npx tsx comms-assistant/render-triage.ts --file=<items.json> --out=output/comms-triage/triage-$(date +%F).html`
   (render-triage re-runs `assembleContext` per item for the People/Guardrails/Rules columns, so subagents
   only need to return `suggestion`.)
6. **Open** the page; walk it with him. (When persistence is wired, also write each card to
   `comms_predictions` — incl. `action_type`/`action_target` — so the outbox sweep reconciles what he does.)

The page look is the editable template **`templates/triage.html`** — restyle freely; the card data
comes from `render-triage.ts` + the retrieval layer.

## Files
`run.ts` (CLI) · `classify.ts` (noise/sensitive gate) · `retrieve.ts` (tiered context) ·
`render-triage.ts` (triage HTML renderer) · `templates/triage.html` (editable page look) ·
`store.ts` `asof.ts` `delta.ts` `confidence.ts` `types.ts` · `prompts/prediction-subagent.md`
· `RUNBOOK.md` (v1 backtest procedure).
