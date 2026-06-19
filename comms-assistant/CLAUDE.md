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
Triggers: "sweep my unread", "triage my inbox", "morning triage", "what needs a response?". Also
**"pull Claude emails"** = the curated source (Outlook `Claude` category) via `pull-outlook --source=claude`.
1. **Gather from two first-class sources:**
   a. **Email — bridge-first (DEFAULT).** Run `npx tsx comms-assistant/run.ts pull-outlook --source=unread`
      (osascript / Legacy Outlook; reads `whose is read is false`, classifies, collapses by Thread-Index root,
      emits `CapturePacket[]`). Full doc: [`outlook-bridge/GATHER.md`](outlook-bridge/GATHER.md). Also
      `--source=claude` for the `Claude`-category curated source (skips classify; lazy tag-drain on resolved
      cards). The packets feed step 3+ directly (the bridge already captured the full body — no `read_resource`).
      **The MCP `outlook_email_search` path below is the FALLBACK** — use it when not at the Mac / the bridge is
      down (Teams always stays MCP):
      `outlook_email_search` with **`query:"isRead:false"`** (folderName "Inbox"). This filters to
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
   b. **Teams** — the MCP has **no native unread flag**, so approximate via recency + a no-reply heuristic.
      **Update (2026-06-17): a date-windowed broad scan now works** — `chat_message_search query="*"
      afterDateTime=<recent>` returns one **recency-sorted stream across all 1:1/group/meeting chats**
      (supersedes the old 2026-06-14 "broad search returns nothing / only sender-scoped works" note). Run **two
      passes, unioned by `chatId`**:
      • **(a) roster + whitelist** — for each of the **CLM leadership roster** (5 directs, Yaron, key peers) a
        sender-scoped search (`sender=<email>`); and for each **whitelisted CLM-Leads/CLM-Leadership/CLM-Product
        group**, read it directly (`read_resource teams:///chats/{chatId}/messages` → sender + bodyPreview).
      • **(b) +15 recent chats** — from the `query="*"` recency stream, group by `chatId` and take the **top 15
        distinct** chats (incl. non-whitelisted groups), so an active thread from someone off the roster isn't
        missed. This pass needs no whitelist — it's purely recency-ranked.
      Keep a message when it's **from someone other than Yonatan** and **Yonatan hasn't replied after it**
      (no-reply check = "is the latest message in the chat from someone other than Yonatan?"). Chat type is in
      the ID: `…@unq.gbl.spaces` = 1:1, `…@thread.v2` = group, `…meeting_…@thread.v2` = meeting (**skip**).
      Single message = `…/messages/{id}`. Tag Teams cards `channel:'teams'`.
      ⚠️ **Serial calls only** — Graph throttles at ~80 req/min; parallel MSFT calls trip a 429. The whitelist of
      group chat IDs lives in `context_store` key `comms_teams_whitelist`; the MCP exposes **no chat name/topic**,
      so seed it from actual chat IDs (paste the group links, or identify a candidate by its participant roster).
2. **Classify (triage gate)** — `npm run comms-assistant -- classify --payload=<EmailMeta[].json>`
   (`--payload` is a **file path**). `EmailMeta = {subject, sender, recipients[], bodyPreview?}`.
   The default **triage gate keeps anything needing a response — fresh OR reply** — and drops only noise
   (automated/bot senders, calendar/RSVP, app notifications, OOO, meeting invites, broadcast DLs) + flags
   sensitive (never drafted). **First-time sends are first-class** — don't gate on `Re:`. Pass `--backtest`
   for the Re:-only `needsPrediction` gate (learning loop only). Always include a realistic `bodyPreview`:
   the meeting-invite rule reads it (body that *opens into* the Teams join block = invite/noise; substantive
   text before the block = real ask, kept — e.g. a "let's schedule…" mail that embeds an invite). Surface the
   drop breakdown (no silent truncation).
2.5. **Skip/refresh check (per classify survivor).** Before capturing, call
   `classifyThreadForSweep({conversationId, internetMessageId, latestMessageId})` for each candidate.
   Drop `skip` threads (already captured + unchanged, OR the card was `user_touched` — never clobber in-app
   edits); capture `analyze` (new) and `refresh` (updated since last sweep). Surface the analyze / skip /
   refresh breakdown — no silent truncation, same discipline as the classify drop breakdown.
3. **Capture each survivor — orchestrator, SERIAL.** `read_resource` (`mail:///messages/{id}`) the full body +
   participants + @mentions, **one at a time**. This is the throttle-bound step (Graph ~80/min; parallel reads
   trip a 429) and it **stays in the orchestrator** (the session that owns the MSFT MCP). Subagents must NOT call
   MSFT (they often can't see the claude.ai MCP in headless runs anyway).
   ✅ **ALWAYS pull `conversation_id` and `internet_message_id` from the read result onto the card's `email`** —
   not optional. These are the keys the later Sent-Items reconcile matches on; `web_link` is only a fallback.
   Capturing them every run is what lets persistence (step 7) close the loop — don't decide per-run whether they're
   "needed", just always grab them. (For Teams: `conversation_id` = the chatId.)
   ⚠️ Long threads exceed the tool's token cap and spill to a saved file — slice the top of the
   message with `python3 -c "...json.load...re.sub('<[^>]+>',' ',html)...[:1800]"` rather than re-reading.
   For **Teams** survivors (step 1b) set the card `channel:'teams'` and `webLink` to the message `webUrl`;
   pull a few prior messages in the same chat for `bodyToDate` so the thread context is real, not a stub.
   ⚠️ **Never draft from a Teams notification email** — they're dropped in step 1a precisely because the body is
   a clipped preview; Teams content always comes from step 1b. (A truncated input can't be rescued by grounding —
   you'll answer the wrong question. See the 2026-06-14 AI-portfolio miss, where the email cut the ask at "...ומי".)
   Build a `ThreadInput` (`retrieve.ts`): `{subject, participants[], mentions?, bodyToDate}` — **omit `asOf`** (= live).
   (Teams messages have no subject — synthesize a short topic line for `subject` from the message.)
4. **Run the `comms-triage` workflow on the captured threads — this IS the reasoning + verify flow, never
   inline drafting** (`triage.workflow.js`; pass the capture packets as `args`, each with a `signals` object so
   tiering works). **Pass the live date** so the workflow isn't hardcoded: either a per-packet `today` field or a
   top-level `args = { today: "<YYYY-MM-DD>", items: [...] }`. The workflow reads it (never assumes a calendar
   date) — it drives scheduling stale-date checks and the ~1wk+ delay-acknowledgment rule. It fans out one subagent per thread — PARALLEL, no MSFT (each runs `context:assemble` = DB
   only, parallel-safe; reasons via `prompts/triage-runner.md` → `prediction-subagent.md`) — and runs the full
   **3-layer evaluation, all captured per card**: ① **tier-route** (`routeTier`: sensitive / direct-ask → **T2
   deep**; cc-only → T1 shallow; broadcast/cold → T0 templated, no agent) → ② **schema-forced draft** → ③
   **self-eval** → ④ **(T2 only) three diverse-lens ADVERSARIAL verifiers** (`faithfulness` / `ownership-and-facts`
   / `voice-and-etiquette`; each prompted to *refute*; majority refute ≥2/3 with severity>none → `verdict.flagged`).
   It returns each `{email, thread, suggestion, tier, self_check, verdict}` — **`tier` + `verdict` are part of the
   captured flow and persisted on every card; do NOT draft inline and skip them.** The split: capture is serial +
   MSFT-bound (orchestrator); reasoning + drafting + verify is the expensive part (the workflow fans out) — so the
   orchestrator's context never fills with raw 60KB–800KB bodies. Within the workflow each
   subagent **chooses the action, then drafts it** — the response to a comm is often an **action aimed elsewhere**,
   not an in-thread reply. Pick a primary `action` `{type, target, channel?, secondary?}` —
   `reply | redirect | sidebar | route | task | escalate | schedule | monitor | none` — and name its **target**
   (who/what it's aimed at). Apply the rulebook (pinned executive-voice + terse/probe/route; **`route` = name
   the owner, hand off, do NOT publicly instruct**; `redirect` = brief your leaders, not the thread). Draft the
   message for action types that produce one (reply/redirect/sidebar/route/escalate/schedule); `task`/`monitor`/
   `none` carry **no `text`**. Set `needs_data` (flag, don't fetch — see grounding below), `confidence`, `why`,
   and a curated **`memory_brief`** ("nothing material in memory" if not load-bearing). Keep `disposition` as the
   legacy alias of `action.type`. Default to `monitor`/`none` over manufacturing work — "you're clear" is valid.
   ⚠️ For **scheduling / meeting** items, check the meeting date isn't already **past** before drafting a
   confirm — a stale confirm is noise (2026-06-14: a war-room-sync confirm was drafted after the meeting had passed).
5. **Build `items.json` from the workflow output** (it already returns the per-thread items **with `tier`,
   `self_check`, and the 3-lens `verdict`** — persist them as-is; don't strip the verify result) —
   `[{ email:{subject,from,date,to,excerpt,webLink, conversation_id, internet_message_id, channel?, thread_summary?},
   thread:ThreadInput, suggestion:{action:{type,target,channel?,secondary?}, disposition, needs_data, confidence,
   text, why, lang?,lang_alt?,text_alt?, memory_brief} }]`. The card shows a prominent **▸ TYPE → target** line
   above the draft; `text:null` actions render the action line + `why` with no textarea.
   `channel`: `outlook`|`teams`|`meeting` (drives the leading icon + open button). For Hebrew drafts set
   `text`+`text_alt`(EN)+`lang`/`lang_alt` for the **HE⇄EN toggle**. `memory_brief` = a string OR
   `{summary, points[]}` (structured, scannable). Full card anatomy: the `render-triage.ts` header comment.
6. **Review surface — the `/triage` app (the ONLY default surface).** The **`/triage` app** (Supabase-backed,
   in `app/`, route `/triage`) is the review surface — it reads `comms_predictions`, lets
   Yonatan edit drafts / accept-reject the suggested action / add notes / set status, and writes feedback to
   `comms_feedback` via `comms_apply_feedback` RPC. Persisting (step 7) is what populates it. **Do NOT generate
   the local HTML export by default** — only when Yonatan explicitly asks for it ("export the HTML", "render the
   triage page"). When asked: `npx tsx comms-assistant/render-triage.ts --file=<items.json> --out=output/comms-triage/triage-$(date +%F).html`.
   `render-triage.ts` calls `assembleContext(thread)` itself → the card's People/Guardrails/Rules come from the
   retrieval layer; you supply `suggestion` + `memory_brief`. Page shell/styling is [templates/triage.html](templates/triage.html) (editable).
7. **Persist the sweep** — `npm run comms-assistant -- predictions:add-many --payload=<items.json>` writes every
   card to `comms_predictions` (idempotent per thread; carries `action_type`/`action_target`, `tier`, the
   adversarial `verdict`, the full `card` payload, `last_message_id`, and `captured_at`). ⚠️ `upsertPredictions`
   never clobbers a `user_touched` card — in-app edits are safe. This is **not optional** — without it the
   `/triage` app has nothing to display and the loop never closes. ⚠️ Include **`conversation_id`** and
   `internet_message_id` on each `email` during capture (`read_resource` returns them) — they're the primary
   match keys; `web_link` is the fallback.
8. **He reviews in the `/triage` app; feedback drives Flow 2 (learn).** He edits drafts, accepts/rejects the
   suggested action, adds notes — all feedback lands in `comms_feedback` via the `comms_apply_feedback` RPC.
   **Flow 2 (learn)** is on-demand: `npm run comms-assistant -- rules:distill` loads undistilled
   `comms_feedback`, the session clusters + asks clarifying questions + proposes `rules:add`/`supersede`; then
   `rules:distill --mark=<ids>` stamps them processed. **In-app feedback is the primary learning signal.**
   The Sent-Items reconcile (Pass B) is demoted to a secondary fallback for *out-of-band sends only* (replied
   from Outlook without opening the card) and is **not built** — when eventually built, it must treat
   `comms_feedback` as primary and `actual_reply` as secondary corroboration.

Single-email help ("draft a reply to X") = the same pipeline for one thread.

## Outgoing flow — "send X an email about it" (Yonatan never runs the CLI; you do)
Triggers (mid-conversation): "send Elad an email about it", "draft an email to Yael re: …", "email Yaron a
heads-up on this". The email is about **what you just discussed** — you (the conversation agent) draft it.
1. **Resolve recipient.** `npm run comms-assistant -- contacts:resolve --query="<name|email>"` → `{slug?,name?,email?,source}`.
   If `source:'unknown'` or `email` missing → ask Yonatan once (or he adds it in Outlook). Capture the address.
2. **Gather.** Build a `ThreadInput` (`subject`=topic, `participants`=[Yonatan's email, the recipient's email
   (from step 1's `contacts:resolve`)], `bodyToDate`=a short brief of what we discussed) and run `assembleContext`
   (`context:assemble --file=…`) — rule spine + T1/T2/T3. **T1 resolves participants by email (exact `people.email`
   match), not slug — always pass email addresses here.** Surface what you pulled (`memory_brief` + sources).
3. **Draft** in Yonatan's voice applying the rule spine + pinned executive-voice (see `prompts/prediction-subagent.md`
   → *Initiated mode*). Self-eval (language/etiquette/exec-voice). Compute **stakes**: SVP+ / external-or-vendor /
   sensitive / grounding-heavy claims → **escalate**.
4. **Escalate (high-stakes only).** Dispatch three fresh/blind adversarial verifiers (faithfulness /
   ownership-and-facts / voice-and-etiquette) over {draft, bundle, brief}; majority-refute → surface the flags
   inline before showing the draft.
5. **Show + approve in chat.** Present draft + recipient + `memory_brief`/sources + confidence + any flags. Yonatan
   approves / edits / asks for a revision (loop 3).
6. **Push + persist + record the learning signal (one command).** `npm run comms-assistant -- send-initiated --payload=<InitiatedInput.json>`:
   pushes a fresh Outlook draft via the bridge (best-effort — needs `npm run outlook-bridge` + Legacy Outlook; if
   down, fall back to pasting the approved text), then persists the `mode:'initiated'` card and records the
   **approve-time signal** (edit → `comms_feedback` kind `edit` with the `delta`; verbatim → kind `note`
   `approved_verbatim`). `rules:distill` consumes it like any feedback.
7. **Learn the contact (if you had to ask).** `--payload` is a **file path** (like every other command), NOT inline JSON.
   Write the JSON to a temp file, then `npm run comms-assistant -- contacts:learn --payload=/tmp/learn.json`. File shape:
   `{"slug":"elad-schnarch","email":"…"}` (known person → backfill `people.email`; `fill` silently, `confirm` first if it
   differs; a slug that doesn't resolve to a person → `{"learned":"none","reason":"slug not found in people"}`) or
   `{"name":"Vendor X","email":"…"}` (external → `comms_contacts`). Next time, no ask.

`InitiatedInput` (step 6 payload): `{ recipient:{email,name?,slug?}, subject, draft, approved, trigger_text,
action_type?, action_target?, thread?:ThreadInput, tier?, verdict?, confidence?, why?, memory_brief?, sensitive? }`.
`draft` = what you first composed; `approved` = what Yonatan OK'd (equal if verbatim).

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
- **Orchestrator captures serial; subagents reason in parallel.** MSFT reads (`read_resource`) are throttle-bound
  (~80/min, parallel → 429) and stay in the orchestrator session that owns the MSFT MCP. Fan out one subagent per
  *captured* thread for the expensive part (assembleContext + action-choice + drafting); they touch DB only and
  return a `suggestion` JSON. Keeps raw 60KB–800KB bodies out of the orchestrator's context and judges every thread
  through the same `prediction-subagent.md`. Don't let subagents call MSFT (parallel 429; and headless runs can't see it).
- **Office geography is a load-whole fact.** Payoneer/Yonatan's office = **Glilot**; Au10tix = **Hod Hasharon**. Lives in
  `comms_org_ownership.referenceFacts.offices` (T2, always in drafting context) — `אצלנו` = Glilot, not the vendor's site.
- **Suggest the ACTION, not just a reply.** The response to a comm is frequently an action aimed *elsewhere* —
  `redirect` to your leaders, `sidebar` a third party, `route` to the owner (named, not instructed), `task`, `monitor`.
  Reply-to-sender is one option among many; the highest-value thing to learn is action selection + targeting, not
  phrasing. The card leads with **▸ TYPE → target**. (2026-06-14: Meital→sidebar Tal; UBO→redirect to leaders, no
  in-thread reply; Elena→route to Ido without publicly instructing.)
- **Judgment refines the permissive gate.** "Needs a response?" is decided at the read step (reply / monitor / open-loop /
  done) — the assistant must NOT manufacture work. Saying "you're clear" (action `monitor`/`none`) is a valid, trust-building result.
- **Page unread to exhaustion + check time-sensitivity.** Don't cap the sweep (old-but-unread sinks below recent);
  and for meeting/scheduling items, drop confirms whose date already passed.

## Files
`run.ts` (CLI: classify · context:assemble/probe · predictions:* · rules:* · **send-initiated · contacts:resolve/learn**) · `classify.ts` (triage gate — keeps fresh+reply, drops noise/sensitive; `--backtest` = Re:-only `needsPrediction`)
· `retrieve.ts` (tiered context: T1 identity / T2 ownership / T3 narrative + rule spine; `assembleContext`, `ThreadInput`, `ContextBundle`)
· `render-triage.ts` (triage HTML fallback/export — **▸ action line**, channel icons, HE⇄EN toggle, collapsible context, structured brief) · `templates/triage.html` (page look)
· `card.ts` (`buildCardPayload` — assembles the full presentation payload written to `comms_predictions.card`)
· `sweep.ts` (`classifyThreadForSweep` — skip/refresh policy; guards `user_touched` cards from clobber)
· `distill.ts` (Flow 2 load/mark — reads undistilled `comms_feedback`, marks rows processed after `rules:distill`)
· `initiated.ts` (outgoing flow: `buildInitiatedRow` + `recordInitiated` — persist a `mode:'initiated'` card + approve-time `comms_feedback`)
· `contacts.ts` (`resolveRecipient` / `upsertExternalContact` / `backfillPersonEmail` / `contactBackfillDecision` — recipient resolution + contact learning)
· `store.ts` `asof.ts` `delta.ts` (`actionDelta` — suggested-vs-actual action diff) `confidence.ts` `types.ts` (`SuggestedAction`/`ActionType`) · `prompts/prediction-subagent.md` · `RUNBOOK.md` (v1 backtest).
· **`outlook-bridge/`** — the **"✉ Push to Outlook draft"** path: `/triage` button → local Node bridge (`npm run outlook-bridge`, 127.0.0.1:7777, token-gated) → `osascript` (argv, no shell) → `draft.applescript` opens a reviewable Outlook draft (fresh compose / threaded **reply-all**). **Never sends** (read-only/human-in-the-loop preserved). The same bridge backs **"Open in Outlook"** (`POST /open`) — pops the actual message open in the desktop app (locate-only, **no mutation**), **bridge-first with OWA web-link fallback** when the bridge is down / the message isn't in the Inbox. **Requires Legacy Outlook for Mac** (New Outlook's AppleScript is dead — compose-only). Reply keys are read from the **top-level `comms_predictions` columns** (`mode`/`internet_message_id`/`last_message_id`), NOT `card.email`. Full doc + hard-won AppleScript/data-shape lessons: [`outlook-bridge/README.md`](outlook-bridge/README.md).
  The same `outlook-bridge/` is also the **DEFAULT email GATHER** (not just the send/open side): `npx tsx comms-assistant/run.ts pull-outlook --source=unread|claude` → osascript reads unread (`whose is read is false`) or `Claude`-category emails → classify (drop noise / flag sensitive; Claude-tag bypasses) → collapse by **Thread-Index root** → emits `CapturePacket[]` for the `comms-triage` workflow → `predictions:add-many` → `/triage`. **Email gather is bridge-first; MCP `outlook_email_search` is the fallback; Teams stays MCP.** Trigger "pull Claude emails" = `--source=claude` (curated, with lazy tag-drain). Full doc: [`outlook-bridge/GATHER.md`](outlook-bridge/GATHER.md).
· `outlook-bridge/push-client.ts` (`pushFreshDraft` — terminal-side POST /draft fresh compose) for the outgoing flow (`run.ts send-initiated`). The app's browser caller is `app/src/lib/draft-request.ts`.
· **`schedule/` + `outlook-bridge/{calendar,meeting}.*` (calendar create-meetings flow)** — `schedule:resolve` (attendees / org-groups directs·skip-levels) · `schedule:busy` (your own free/busy via `outlook-bridge/calendar.applescript`, busy-read only) · `schedule:find-times` (`find-times.ts` pure slot ranking — Sun–Thu, 9–18, skip 13:00 lunch, 15-min buffer, one-per-day spread) · `schedule:agenda-context` (`agenda-context.ts` — focus + 1:1s + action items + narrative for the agenda you write) · `schedule:draft-meeting` (`outlook-bridge/meeting.ts` + `meeting.applescript` — opens ONE reviewable **unsent** meeting: To+subject+time pre-filled, agenda staged on the **clipboard** for a ⌘V into notes). **Never sends** (Yonatan pastes agenda, adds the Teams/Zoom link, sends). **No auto-record.** Outlook-for-Mac field-binding is buggy: attendees bind before `open`, subject/start/end only after `open`, body is ignored after open (so it goes to the clipboard); `.ics` was dropped because Outlook imports it as an attendee-less Appointment. Run meetings one at a time (clipboard is per-meeting). Full procedure: [../agents/comms-assistant.md](../agents/comms-assistant.md).
