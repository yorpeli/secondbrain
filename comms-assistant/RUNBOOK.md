# Comms Learning — v1 Backtest Runbook

Run by Claude with the Microsoft 365 MCP + this repo's CLI. Silent, email-only,
last ~30 days, reply threads only. Spec:
`docs/superpowers/specs/2026-06-13-comms-response-learning-loop-design.md`.

## Stage 1 — Classify (build the worklist)
1. Pull Sent Items for the last 30 days via `outlook_email_search`
   (folderName "Sent Items", paginate by offset).
2. Apply `classifyEmail()` (scripts/comms-learning/classify.ts) to each — keep only
   `needsPrediction === true`. Target ~15–25 genuine reply threads. Log how many were
   dropped as noise/sensitive (no silent truncation).

## Stage 2 — Predict (BLIND)
For each worklist item:
1. Read the thread *up to the incoming message only* (never your own later reply).
   Set `as_of = incoming message receivedDateTime`.
2. Assemble context, then pass it through `filterAsOf(records, as_of)` — person row,
   initiative memory, prior thread. Record what survived in `context_available`
   (personInDb / initiativeMemory / priorThread / coldStart).
3. Produce `predicted_reply` and a self-rated `confidence` band — using ONLY the
   as-of context. Do not use anything you know about how things turned out.
4. Store it:
   `npm run comms-learning -- predictions:add --payload=<file>`
   (`mode:'reply'`, `trigger_text` = verbatim relevant span of the incoming message,
   quoted history/signatures stripped; `actual_reply:null`, `resolution:null`).
   Capture identifiers from the search/`read_resource` result: `message_id` ← Graph
   `id`, `internet_message_id` ← `internetMessageId`, `web_link` ← `webLink`,
   `thread_id` ← `conversationId` (from `read_resource`; if absent, leave null and
   match in Stage 3 by normalized subject + participants).

## Stage 3 — Reconcile (item-by-item)
`npm run comms-learning -- predictions:list --unreconciled`. For each:
1. Fetch Yonatan's actual sent reply in that thread.
2. `delta` = `structuralDelta(predicted, actual)` (scripts/comms-learning/delta.ts)
   MERGED with your judged **stance delta**: did yes/no/defer/escalate change?
3. Pick `resolution`: `match` (≈ same), `edited` (same stance, different wording),
   `out_of_band` (he resolved in a meeting/verbally/WhatsApp — no email reply),
   `no_reply` (never answered).
4. If the **stance** changed, ask Yonatan "why?" now (item-by-item) and capture his
   answer in `why`.
5. `npm run comms-learning -- predictions:reconcile --payload=<file>`.

## Stage 4 — Distill
1. Cluster reconciled rows by scope (person / topic / channel) and by delta pattern.
2. For each cluster compute evidence {support, contradict, diversity} and run
   `confidenceScore` / `statusFor` (scripts/comms-learning/confidence.ts).
3. Write rules: `npm run comms-learning -- rules:add --payload=<file>` (set `type`
   style|decision, `data_dependency`, computed `confidence`/`support`/`consistency`/
   `diversity`/`status`). Derive the rule's confidence band consistently from
   `confidenceScore` (high ≥ 0.67, med ≥ 0.34, else low) so prediction-time gating is
   stable. Decision-type rules also belong in `decision_journal`.

## Report
- `resolution` distribution (match / edited / out_of_band / no_reply).
- Among match+edited: accuracy **conditioned on `context_available`** — the key
  diagnostic (good-with-context vs poor-when-cold?).
- Rules created, with confidence and which are `active` vs `watch`.
- Recommendation: does the loop predict Yonatan well enough to build live mode?
