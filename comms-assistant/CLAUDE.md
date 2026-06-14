# Comms Assistant — folder index

Thin operational index for this folder. **Don't re-derive the pipeline from source** —
follow this. Full agent doc: [../agents/comms-assistant.md](../agents/comms-assistant.md).
Backtest procedure: [RUNBOOK.md](RUNBOOK.md). Sub-agent voice/rules: [prompts/prediction-subagent.md](prompts/prediction-subagent.md).

## What this is
Learns how Yonatan decides/communicates by predicting his email replies and reconciling
against what he actually sent. **Read-only MSFT** — he always sends from Outlook himself.
Two modes share the retrieval + rule spine:
- **Live triage (assist):** draft suggested replies for an unread sweep. On-demand, current context.
- **Blind backtest (learn):** predict a past reply using only as-of context, then reconcile. See RUNBOOK.

## Triage sweep — the procedure (Yonatan never runs the CLI; you do)
Triggers: "sweep my unread", "triage my inbox", "morning triage", "what needs a response?".
1. **Gather from two first-class sources:**
   a. **Email** — `outlook_email_search` with **`query:"isRead:false"`** (folderName "Inbox"). This filters to
      unread **server-side** (KQL token in `query`; verified 2026-06-14 — all results came back unread), so you
      pull ONLY unread directly: no client-side scan of read mail, and **no blind spot for older-but-unread**
      threads (the old `order:newest` + client-filter approach paged through read mail AND missed deep unread,
      e.g. a 5-day-old "would appreciate your guidance" ask). Note: a free-text `query` pages by **`cursor`**,
      not `offset`, and `order` is not compatible (results are recency/relevance-ranked, not strict newest).
      ⚠️ **Page the cursor to exhaustion — do NOT cap.** Unread is recency-ranked, so old-but-unread items sink
      *below* recent ones; stopping early silently drops them (2026-06-14: a 30-item cap missed unread May
      messages in an Au10tix thread). An unread sweep is also blind to **read-but-unanswered** threads (you
      opened the latest but never replied) — catching those needs a Sent-side check, out of scope here.
      **Drop Teams notification emails** (`no-reply@teams.mail.microsoft` / `@odspnotify`) — lossy shadows
      (clipped ~1-line preview); Teams is scanned directly in (b), so they'd only duplicate + truncate.
   b. **Teams** — the MCP has **no native unread flag** and **broad/content-only `chat_message_search`
      returns nothing** (verified 2026-06-14) — only **sender-scoped** search works. So survey by **roster**:
      `chat_message_search sender=<email> query=<broad token like "CLM" or a greeting>` (recent window) for
      each of the **CLM leadership roster** (the 5 directs, Yaron, key peers). Keep a message when it's **from
      that person** (not Yonatan), in a **1:1 chat OR a whitelisted CLM-Leads/CLM-Leadership group**, and
      **Yonatan hasn't replied after it** (no-reply heuristic). Chat type is in the ID: `…@unq.gbl.spaces` = 1:1,
      `…@thread.v2` = group, `…meeting_…@thread.v2` = meeting (skip).
      **For a whitelisted group, skip search — read its messages directly:** `read_resource
      teams:///chats/{chatId}/messages` returns the message list (sender + bodyPreview), so the no-reply check is
      just "is the latest message from someone other than Yonatan?". Single message = `…/messages/{id}`. Tag Teams
      cards `channel:'teams'`.
      ⚠️ **Serial calls only** — Graph throttles at ~80 req/min; parallel MSFT calls trip a 429. Scope =
      **all 1:1s + the CLM-Leads / CLM-Leadership / CLM-Product groups** (whitelist of chat IDs in
      `context_store` key `comms_teams_whitelist`). The MCP exposes **no chat name/topic**, so seed the whitelist
      from actual chat IDs (paste the group links, or identify a candidate by its participant roster).
2. **Classify (triage gate)** — `npm run comms-assistant -- classify --payload=<EmailMeta[].json>`
   (`--payload` is a **file path**). `EmailMeta = {subject, sender, recipients[], bodyPreview?}`.
   The default **triage gate keeps anything needing a response — fresh OR reply** — and drops only noise
   (automated/bot senders, calendar/RSVP, app notifications, OOO, meeting invites, broadcast DLs) + flags
   sensitive (never drafted). **First-time sends are first-class** — don't gate on `Re:`. Pass `--backtest`
   for the Re:-only `needsPrediction` gate (learning loop only). Always include a realistic `bodyPreview`:
   the meeting-invite rule reads it (body that *opens into* the Teams join block = invite/noise; substantive
   text before the block = real ask, kept — e.g. a "let's schedule…" mail that embeds an invite). Surface the
   drop breakdown (no silent truncation).
3. **Per survivor** — `read_resource` (`mail:///messages/{id}`) for the full body + participants + @mentions.
   ⚠️ Long threads exceed the tool's token cap and spill to a saved file — slice the top of the
   message with `python3 -c "...json.load...re.sub('<[^>]+>',' ',html)...[:1800]"` rather than re-reading.
   For **Teams** survivors (step 1b) set the card `channel:'teams'` and `webLink` to the message `webUrl`;
   pull a few prior messages in the same chat for `bodyToDate` so the thread context is real, not a stub.
   ⚠️ **Never draft from a Teams notification email** — they're dropped in step 1a precisely because the body is
   a clipped preview; Teams content always comes from step 1b. (A truncated input can't be rescued by grounding —
   you'll answer the wrong question. See the 2026-06-14 AI-portfolio miss, where the email cut the ask at "...ומי".)
   Build a `ThreadInput` (`retrieve.ts`): `{subject, participants[], mentions?, bodyToDate}` — **omit `asOf`** (= live).
   (Teams messages have no subject — synthesize a short topic line for `subject` from the message.)
4. **Draft** the suggested reply applying the rulebook (pinned executive-voice + terse/probe/route).
   Set `disposition`, `needs_data` (flag, don't fetch — see grounding below), `confidence`,
   `why`, and a curated **`memory_brief`** ("nothing material in memory" if not load-bearing).
   ⚠️ For **scheduling / meeting** items, check the meeting date isn't already **past** before drafting a
   confirm — a stale confirm is noise (2026-06-14: a war-room-sync confirm was drafted after the meeting had passed).
5. **Build `items.json`** — `[{ email:{subject,from,date,to,excerpt,webLink, channel?, thread_summary?},
   thread:ThreadInput, suggestion:{disposition,needs_data,confidence,text,why, lang?,lang_alt?,text_alt?, memory_brief} }]`.
   `channel`: `outlook`|`teams`|`meeting` (drives the leading icon + open button). For Hebrew drafts set
   `text`+`text_alt`(EN)+`lang`/`lang_alt` for the **HE⇄EN toggle**. `memory_brief` = a string OR
   `{summary, points[]}` (structured, scannable). Full card anatomy: the `render-triage.ts` header comment.
6. **Render + open** — `npx tsx comms-assistant/render-triage.ts --file=<items.json> --out=output/comms-triage/triage-$(date +%F).html`.
   `render-triage.ts` calls `assembleContext(thread)` itself → the card's People/Guardrails/Rules come from the
   retrieval layer; you supply `suggestion` + `memory_brief`. Page shell/styling is [templates/triage.html](templates/triage.html) (editable).
7. He reviews/edits, sends from Outlook. A later sweep reads **Sent Items** and reconciles.

Single-email help ("draft a reply to X") = the same pipeline for one thread.

## Grounding (live mode) — use the vector search we already built
We have embeddings + vector search built **for exactly this**. If you believe more of our own data
would make a draft better, **just go get it** via `searchByType(query, [types])` (`lib/embeddings.ts`) —
types: `initiative_memory`, `agent_log`, `ppp`, `person`, `initiative`, `research`. This is the
sanctioned grounding path; **don't hand-write ad-hoc SQL** and don't build a separate structured layer.
- **Always surface what you pulled in the card** — the `memory_brief` + the faint `sources` line. The
  transparency is the safeguard: Yonatan sees the evidence that informed the draft and can judge it.
- CLM **metrics** still route through the `clm-main` skill (not vector search).
- ⚠️ In **blind backtest** mode the same search runs but is **as-of filtered** (`filterAsOf`) so it can't
  leak the future — never bypass that. In **live triage** there's no as-of cap; search freely.

## Lessons learned (don't relearn these)
- **Capture is the foundation.** A truncated/wrong input poisons retrieval *and* drafting downstream — verify you
  got the **real** message before anything else. Grounding can't rescue a clipped question.
- **Teams notifications ≠ content** — a `@teams.mail.microsoft` "sent N messages" email is a clipped ~1-line
  preview; scan Teams directly (step 1b), don't draft from the notification.
- **`isRead:false`** filters unread server-side (cheaper *and* no blind spot for deep unread) — don't pull-all-and-filter.
- **Triage gate keeps fresh + reply.** `Re:`-only (`needsPrediction`) is the backtest, not triage. First-time sends matter.
- **Teams search is content-filtered + has no unread flag** — broad queries return nothing; sender-scope, or (better)
  **folder-read whitelisted chats** by ID. Serial calls only (~80/min throttle). Chat type from the ID; no chat-name field.
- **1:1s:** seed chat IDs into `comms_teams_whitelist.one_on_one_chat_ids`, then folder-read directly. No keyword needed.
- **Grounding = the vector search we already built** (`searchByType`) — surface what you pulled in the card; never ground in blind backtest.
- **Judgment refines the permissive gate.** "Needs a response?" is decided at the read step (reply / monitor / open-loop /
  done) — the assistant must NOT manufacture work. Saying "you're clear" is a valid, trust-building result.
- **Page unread to exhaustion + check time-sensitivity.** Don't cap the sweep (old-but-unread sinks below recent);
  and for meeting/scheduling items, drop confirms whose date already passed.

## Files
`run.ts` (CLI: classify · context:assemble/probe · predictions:* · rules:*) · `classify.ts` (triage gate — keeps fresh+reply, drops noise/sensitive; `--backtest` = Re:-only `needsPrediction`)
· `retrieve.ts` (tiered context: T1 identity / T2 ownership / T3 narrative + rule spine; `assembleContext`, `ThreadInput`, `ContextBundle`)
· `render-triage.ts` (triage HTML — channel icons, HE⇄EN toggle, collapsible context, structured brief) · `templates/triage.html` (page look)
· `store.ts` `asof.ts` `delta.ts` `confidence.ts` `types.ts` · `prompts/prediction-subagent.md` · `RUNBOOK.md` (v1 backtest).
