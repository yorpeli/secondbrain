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
- **T3 — narrative**: `searchByType` over memory/agent_log/PPP, capped, low-trust, last.
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
   bundle. It returns `{disposition, predicted_reply, predicted_stance, confidence,
   confidence_score, context_available}`.
6. **Store** — map to a `PredictionRow` and `npm run comms-assistant -- predictions:add
   --payload=<row.json>` (`mode:'reply'`, `actual_reply/resolution:null`, identifiers from the
   message). `ignore`/`delegate` dispositions still store a row (with `predicted_reply` null).

## Pass B — reconcile + distill (later sweep, to build)
Read Sent Items → match to open predictions (thread_id / subject+participants) → `delta` (style
+ stance) → `resolution` → ask "why?" on stance changes (batched into CC close-out) →
`predictions:reconcile`; then cluster → `confidenceScore`/`statusFor` → `rules:add`/`supersede`.

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

## Files
`run.ts` (CLI) · `classify.ts` (noise/sensitive gate) · `retrieve.ts` (tiered context — scaffold)
· `store.ts` `asof.ts` `delta.ts` `confidence.ts` `types.ts` · `prompts/prediction-subagent.md`
· `RUNBOOK.md` (v1 backtest procedure).
