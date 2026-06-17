# Comms Assistant — Agent Architecture

> A reference architecture for a **decision-learning agent**: one that models how a specific
> person decides and communicates, predicts what they'll do, reconciles against what they
> actually did, and compounds the difference into a living rulebook.
>
> This document captures the *why* behind the build — the flows, the retrieval model, the
> learning loop, and the evaluation mechanisms — in enough detail to (a) operate and extend
> this agent, and (b) **reuse the pattern as a template** for future agents. Domain-specific
> details (Payoneer/CLM, Yonatan, Outlook/Teams) are called out as the swappable parts; the
> scaffolding around them is the reusable part.

**Status:** live (v1 backtest done; live triage + 3-layer evaluation shipped 2026-06-14).
**Source of truth for behaviour:** the code (`classify.ts`, `retrieve.ts`, `store.ts`,
`triage.workflow.js`, `prompts/*`). This doc explains intent; when they disagree, the code wins.

---

## 1. What this agent is (and is not)

**Is:** a system that *learns a person's judgment*. It predicts how Yonatan (VP Product, CLM)
will handle an incoming communication — **what action** he'll take and **what** he'll say — then,
on a later pass, compares the prediction to what he actually did and updates a rulebook. The
human-facing surface is a triage page of suggested actions he reviews, edits, and sends himself.

**Is not:** an autosender, a generic email summarizer, or a "best answer" engine. It models the
*short, routing-heavy thing the person actually sends*, not the maximal correct essay. It is
**read-only** on the communication channel by design — it never sends; the human always does.

### The core insight that shapes everything
The right response to a communication is **often an action aimed elsewhere, not a reply to the
sender.** Briefing your own leaders, sidebarring a third party, routing to an owner, opening a
task — these are first-class outcomes. An agent that only drafts in-thread replies under-serves
the real decision. So the unit of output is a **suggested action** (`reply | redirect | sidebar |
route | task | escalate | schedule | monitor | none`), each with a **target**.

### Two products under one roof — keep them apart
- **Predict** (the silent learning loop): model what the person *would send* — usually terse,
  routing the digging elsewhere. It **never auto-pulls data**; when a good reply depends on
  numbers, it sets `needs_data: true` and stops. This is what gets stored and reconciled.
- **Assist** (opt-in, human-in-the-loop): when the person *wants* a data-backed answer, a
  separate flow pulls real numbers (here: the `clm-main` analytics layer) and produces a clearly
  labeled data-backed option.

Conflating them hurts prediction — a data-rich draft was 6.5× longer than the 2-line reply the
person actually sent (CLM payer-rollout thread, 2026-06-12). **Predicting behaviour ≠ producing
the best answer.** Keep the two modes separate; let the human opt into Assist.

---

## 2. System architecture at a glance

```
┌─ ORCHESTRATOR (a session that owns the channel connector: MSFT MCP) ─────────────┐
│                                                                                   │
│  1. SWEEP        two first-class sources: unread Inbox + unread Teams             │
│  2. CLASSIFY     classify.ts — deterministic noise/sensitive gate (+ tier hint)   │
│  3. CAPTURE      read_resource each survivor — SERIAL (throttle-bound)            │
│                                                                                   │
│        ── hand captured threads to the reasoning fan-out ──┐                      │
│                                                            ▼                      │
│  ┌─ WORKFLOW (deterministic orchestration; no channel access) ─────────────────┐ │
│  │  per thread:                                                                 │ │
│  │   TIER     routeTier()  → T0 templated · T1 shallow · T2 deep                │ │
│  │   GROUND   retrieve.ts assembleContext() → rule spine + T1/T2/T3 bundle      │ │
│  │   DRAFT    prediction sub-agent → suggested ACTION + message  (schema-forced)│ │
│  │   SELF-EVAL the drafter checks its own output (language, etiquette, facts)   │ │
│  │   VERIFY   (T2 only) 3 diverse-lens ADVERSARIAL verifiers → verdict          │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                            │                      │
│  4. RENDER       render-triage.ts → numbered, newest-first HTML triage page       │
│  5. (human)      reviews / edits / SENDS from the channel himself                 │
└───────────────────────────────────────────────────────────────────────────────────┘
                                     │  (a later sweep)
                                     ▼
┌─ LEARNING LOOP ───────────────────────────────────────────────────────────────────┐
│  6. RECONCILE   read Sent Items → match to predictions → delta (style+stance+action)│
│  7. DISTILL     "why?" on divergences → update comms_rules (the living rulebook)    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### The orchestrator / sub-agent split (a load-bearing decision)
The channel reads (`read_resource`) are **throttle-bound** (Graph ~80 req/min; parallel calls
trip a 429) and tied to an interactively-authenticated MCP that may be absent in headless runs.
So:
- **Capture stays in the orchestrator, serial.** One session owns the connector; it reads each
  thread one at a time.
- **Reasoning fans out, parallel.** Each captured thread becomes one sub-agent that only touches
  the DB (grounding) — no channel calls. The expensive part (judgment + drafting + verification)
  is what parallelizes.

Why it matters beyond throttle: the orchestrator's context never fills with raw 60KB–800KB
message bodies (one thread this session was 872KB), and every thread is judged through the *same*
prompt contract rather than ad-hoc inline reasoning that drifts thread to thread.

**Template takeaway:** any agent that reads from a rate-limited / interactively-authed source
should split *capture* (serial, in the connector-owning session) from *reasoning* (parallel
fan-out over already-captured payloads).

---

## 3. Retrieval — tiered, anti-dilution (`retrieve.ts`)

`assembleContext(thread)` returns a `ContextBundle`. The tiers are deliberately *different
sources and methods*, ordered by trust, so exact facts stay exact and fuzzy memory stays clearly
labeled as fuzzy. The drafting prompt consumes them in precedence **thread → rules → T1/T2 → T3.**

| Tier | Source / method | Trust | Carries |
|---|---|---|---|
| **Spine — rules** | `comms_rules`, scope-matched (SQL) | governs | learned style/decision rules by weight (assert/whisper/track) |
| **T1 — identity** | `people` / `v_org_tree`, exact lookup | high | who each participant is, role, relation to the person |
| **T2 — ownership** | `context_store.comms_org_ownership`, load-whole | high | domain ownership, reporting chain, red-lines, `referenceFacts` (e.g. office geography) |
| **T3 — narrative** | `searchByType` vector search over memory | **low** | background snippets from initiative memory / agent_log / PPP / research |

**Why tiering, not one big RAG blob:** a single semantic dump dilutes exact facts with
similar-but-irrelevant snippets. A snippet that merely *mentions* the same person/initiative but
doesn't change the decision will pull a draft toward generic mush. So:
- Exact facts (who owns what, who reports to whom, office locations) come from **structured
  lookups (T1/T2)**, never from embeddings.
- T3 is **augmentation, not spine** — labeled low-trust, capped, and the sub-agent must **curate**
  it into a 1–3 line `memory_brief` ("what actually bears on this email"), not dump it. If nothing
  is load-bearing, it says "nothing material in memory."

**Grounding mechanics (important nuance):** T3's OpenAI embedding call is **query-time** — it
embeds the thread's *topic string* to nearest-neighbor search the pre-built `embeddings` table.
It does **not create/store** embeddings. Writing embeddings happens in entirely separate flows
(`npm run embed:*` batch scripts; `logFinding()`/`logRecommendation()` auto-embed). This agent is
a pure *consumer* of the index. Because T3 is augmentation, an embeddings outage degrades T3 to
empty while T1/T2/spine (Supabase) still populate — a resilience property the code enforces.

**`referenceFacts`** (added 2026-06-14): a load-whole slot in the T2 map for durable facts the
drafter must always know — e.g. *Payoneer office = Glilot ("אצלנו"); Au10tix = Hod Hasharon.* A
single inverted office reference is exactly the kind of error that belongs in always-on context,
not in fuzzy memory.

---

## 4. The learned rulebook (`comms_rules`) — the heart of the learning

The rulebook is the persistent memory of *how the person decides*. It is the most valuable
artifact the system produces — more than any single draft.

**Rule shape** (`types.ts` `RuleRow`): `scope {person?, initiative?, topic?, channel?}` · `type`
· `statement` · `confidence` · `support` · `consistency` · `diversity` · `status` · `pinned`.

**Two rule types — and decision rules are the prize:**
- `style` — *how* he phrases things (terse; probe the mechanism; executive voice).
- `decision` — *what action he takes and at whom* (route to the owner without publicly
  instructing; redirect to your own leaders when you add no value in-thread; sidebar the vendor
  directly). **Action-selection + targeting patterns are higher-value than phrasing** — they're
  the real judgment being learned.

**Status lifecycle** (a rule earns trust over time):
```
watch ──(support≥3, consistency≥0.7, diversity≥2)──▶ active ──▶ (superseded | retired)
                                                       │
   pinned ◀── the person's EXPLICIT word (asserts immediately, confidence 1)
```
- `watch` — one observation, low confidence (~0.4). Informs but doesn't drive.
- `active` — graduated: enough independent, consistent support across diverse contexts.
- `pinned` — the person stated it outright (e.g. the **executive-voice** rule; the **stale-thread
  acknowledgment** rule). Pinned rules assert and outrank inferred patterns.
- `superseded` / `retired` — contradicted or decayed; kept for provenance, not applied.

**Weight in the spine** (how a fired rule influences a draft): `assert` rules drive the reply;
`whisper` rules inform but stay tentative; `track` rules are ignored for now. On conflict,
narrower-scope + higher-confidence wins; an unresolved tie *lowers* the draft's confidence.

**Privacy:** `comms_rules` and `comms_predictions` are **never embedded** — the system never
semantic-searches its own learned data about the person.

---

## 5. The action model (`types.ts` `SuggestedAction`)

Each card carries a primary **action** (optionally a one-line secondary):

| Action | Meaning | Target |
|---|---|---|
| `reply` | respond in the thread | the thread/sender |
| `redirect` | respond, but to a different audience | named people/group (e.g. brief your leaders) |
| `sidebar` | message a third party the thread implies | a person + channel |
| `route` | hand to the owner by name — **do NOT publicly instruct** | the owner |
| `task` | create a follow-up / plan item | an owner + the line |
| `escalate` | take to a 1:1 / upward | a person + forum |
| `schedule` | propose/confirm a sync (check the date isn't already past) | attendees + time |
| `monitor` / `none` | watch / nothing warranted | — |

`disposition` is the legacy field, kept as an **alias** of `action.type` for backward-compatible
rendering. `task`/`monitor`/`none` carry no drafted message (`text: null`); the card shows the
action line + the "why" with no textarea.

Reconciliation learns **action selection + targeting** into `decision`-type rules — e.g. "broad
cross-functional thread, no value to add in-thread → redirect to own leaders." The three rules
seeded 2026-06-14 (Meital→sidebar Tal; UBO→redirect to leaders; Elena→route to Ido) are exactly
this class.

---

## 6. The triage sweep (the live operating flow)

Triggered by natural language ("sweep my unread", "triage my inbox", "what needs a response?").
The human never runs a CLI; the orchestrator runs it for him.

1. **Gather — two first-class sources.**
   - **Email:** `outlook_email_search` with **`query:"isRead:false"`** (server-side unread filter;
     no client scan, no blind spot for deep unread). **Page to exhaustion** — old-but-unread sinks
     below recent in recency ranking, so a cap silently drops it. **Drop** Teams *notification
     emails* (`@teams.mail.microsoft` / `@odspnotify`) — they're clipped 1-line shadows.
   - **Teams:** the MCP has **no native unread flag** and broad content search returns nothing, so
     survey by **roster** (sender-scoped search) and by **folder-reading whitelisted chats** by ID
     (`comms_teams_whitelist`). Keep messages **from others** in a **1:1 or CLM-leadership group**
     where **he hasn't replied after** (no-reply heuristic). Serial calls only.
2. **Classify (`classify.ts`)** — deterministic gate. The **triage gate keeps anything needing a
   response (fresh OR reply)** and drops only noise (bot senders, calendar/RSVP, app notifications,
   OOO, broadcast DLs, meeting-invite-dominated bodies) + flags **sensitive** (never drafted).
   First-time sends are first-class — *not* gated on `Re:`. (A separate `--backtest` gate is
   `Re:`-only, for the learning loop.) **Never silently truncate** — log the drop breakdown.
3. **Capture (serial)** — `read_resource` each survivor for the full body + participants +
   @mentions. **Always pull `conversation_id` + `internet_message_id`** onto the card (the reconcile
   match-keys; `web_link` is fallback) — capture them every run, never decide per-run if they're needed.
   Long threads spill to a file → slice the top, don't re-read.
4. **Fan out** — one sub-agent per thread (see §7–8).
5. **Render** — `render-triage.ts` → a numbered, **newest-first** master-detail HTML page (channel
   icons; HE⇄EN toggle for Hebrew; collapsible context; ⏳ aging badges; tier + verdict badges).
6. **Persist** — `predictions:add-many` writes every card to `comms_predictions` (action + target,
   `tier`, `verdict`; idempotent per thread). Without this the loop can't close — there's nothing for
   the Sent-Items sweep to reconcile against. Matching keys come from capture (`conversation_id` →
   `internet_message_id` → `web_link`).
7. **Human reviews/edits/sends.** A later sweep reads Sent Items and reconciles (§9).

**Capture is the foundation.** A truncated or wrong input poisons retrieval *and* drafting
downstream — grounding cannot rescue a clipped question. Verify you have the real message first.

---

## 7. Tiering — match processing depth to the judgment required

Not every thread needs a deep, grounded, verified sub-agent. Spending ~50K tokens to conclude
"monitor" on a 24-person broadcast is waste. `routeTier()` (in `triage.workflow.js`) routes by
cheap structural signals available *before* spending anything:

| Tier | When | What runs | ~Cost |
|---|---|---|---|
| **T0 — templated** | broadcast DL / cold external | orchestrator writes the card, **no sub-agent** | ~0 |
| **T1 — shallow** | cc-only / peripheral | one light sub-agent, no deep T3 search | ~10–15K |
| **T2 — deep** | direct ask / decision / vendor 1:1 / **sensitive** | full grounding + self-eval + adversarial verify | ~50K + verify |

Routing signals: `sensitive` → T2 (high stakes); a direct ask / @mention / he's a primary
recipient → T2; cc-only + owner present → T1; broadcast DL / cold external → T0. **Bias toward T2
on any ambiguity** — over-spending occasionally is cheap; missing a real ask is not.

This concentrates the expensive verification budget on the few drafts that will actually be sent.
On the 9-thread sweep (2026-06-14): 4×T2 + 3×T1 + 2×T0 — roughly half the cost of treating all
nine as deep, with no quality loss on the cards that mattered. **Every card still renders** (T0/T1
get a tier badge), so a mis-tier is visible and one-click re-runnable, never hidden.

---

## 8. Evaluation — three independent nets, three defect classes

The system's correctness rests on **three layers that each catch a different class of error.** A
draft only ships clean through all three. This is the most reusable idea in the architecture.

| Layer | Mechanism | Catches | Cannot catch |
|---|---|---|---|
| **Schema forcing** | `StructuredOutput` / Workflow `agent({schema})` — output must validate against a JSON Schema (enums, required fields); the runtime retries on mismatch | malformed shape, bad enums (`confidence` as an object → `[object Object]`), missing fields, prose-wrapping | wrong language, bad judgment |
| **Self-eval** | the drafter returns a `self_check{...}` it must fill honestly; revise-then-return if any check fails | self-*visible* slips — language drift, garbled tokens, an obvious etiquette miss, a stale-date confirm | its own blind spots (it shares the drafter's beliefs) |
| **Adversarial verify** | a **separate** agent, fresh context, prompted to **refute** (not review) through a specific lens; default `refuted: true` unless it clearly survives | faithfulness to the thread, fact/ownership errors, hallucinated grounding, public-instruction etiquette | what isn't in the thread+bundle (but it flags "unverifiable") |

**Why three, not one:** schema forcing guarantees *shape*, not *correctness*. Self-eval is the
model grading its own homework — it caught a Hebrew-on-English drift, but it certified a draft
whose grounding fact was confabulated. Only an **independent skeptic checking the claim against
the data** caught that.

### Adversarial verify, in detail (the layer that earns its cost)
- **Independence + asymmetry are the whole trick.** "Is this fine?" rubber-stamps; "find the
  strongest reason it's wrong, assume there's a flaw" finds flaws. The verifier has no investment
  in the answer.
- **Perspective-diverse lenses beat N identical skeptics.** Each verifier gets a distinct failure
  mode: `faithfulness` (does it answer the real ask or a strawman?), `ownership-and-facts` (does
  every name/owner/number/location trace to the bundle, or is it invented?), `voice-and-etiquette`
  (public instruction? accusatory? stale-date? missing delay-ack?). Three "is it faithful?" checks
  all miss an ownership bug; one ownership lens nails it.
- **Vote:** majority refute (≥2 of 3, severity > none) → **flagged**.
- **Surface, don't auto-fix.** Flags render on the card (`⚠ Verifier flagged: …`); the human
  decides and can "re-run #N". This keeps the human in the loop and turns each flag into learning
  signal. (Auto-revise is possible but deliberately not the default here.)
- **Verifiers can be wrong too** — their own claims are surfaced for judgment, not auto-applied;
  majority + diverse lenses dampen false flags.

**What it caught on its first real run (2026-06-14), both on drafts that self-eval passed clean:**
- *China KPI* — the `memory_brief` cited a "cross-region comparability red-line" that **does not
  exist** in the ownership map (confabulated grounding), and argued a comparability point the
  sender had actually *made herself* (strawman). 2/3 refuted.
- *Au10tix fraud* — the draft `route`d to an owner who is on an **exit track / overloaded** (wrong
  owner, found via people-memory), and the `route` text **publicly handed her a to-do list in
  front of an SVP and a Compliance peer** — the exact public-instruction etiquette the person had
  explicitly prohibited. 2/3 refuted.

Both are errors that would have gone out under the person's name. Neither was catchable by shape
validation or self-grading.

---

## 9. The learning loop — predict → reconcile → distill

This is what makes it an *agent that gets better*, not a one-shot drafter.

- **Pass A · Predict** (new mail needing a decision): sweep → classify → per-thread sub-agent →
  **`predictions:add-many` persists each card** to `comms_predictions` (`action_type`/`action_target`
  + drafted message + `confidence` + `tier` + adversarial `verdict`; `actual_reply = null`). *(Write
  side: wired 2026-06-15. Idempotent per thread — re-sweeping updates open rows, never duplicates.)*
- **Pass B · Reconcile + distill** (a later sweep): read **Sent Items** → match to open predictions
  (thread_id / subject+participants) → compute **delta**:
  - *style delta* (`delta.ts` `structuralDelta`) — length ratio, language match.
  - *action delta* (`delta.ts` `actionDelta`) — did he take the suggested `action_type`, aimed at
    the suggested `target`? "No in-thread reply, briefed leaders" = `redirect`; "messaged a third
    party" = `sidebar`.
  - bucket a **resolution** (`match | edited | out_of_band | no_reply`).
  - ask **"why?"** on stance/action divergences (batched, human-in-the-loop).
- **Distill** → update `comms_rules` (reinforce / contradict / decay / supersede / promote). Action
  patterns feed `decision` rules; phrasing patterns feed `style` rules. They graduate
  watch→active→assert by accumulating support/consistency/diversity.

**Blind-prediction integrity (for backtests):** the same retrieval runs but is **as-of filtered**
(`asof.ts` / `filterAsOf`) so a backtest at time *t* cannot see memory written after *t*. T3
embeddings can leak the future if unfiltered, so the as-of cap is never bypassed in backtest mode.
(Live triage has no as-of cap — there's no future to leak.) Sub-agents are also dispatched fresh
so they can't see across threads — a Sent-Items search can leak a reply preview, so blind
prediction is delegated to clean contexts.

**Prediction and analysis run on *different* items each sweep:** Pass B reconciles yesterday's
predictions while Pass A predicts today's new mail.

---

## 10. Data model & privacy

| Store | Holds | Embedded? |
|---|---|---|
| `comms_predictions` | per-item prediction + reconciliation (action/target, draft, `tier`, `verdict`, delta, resolution, why) | **never** |
| `comms_rules` | the living rulebook (versioned, scoped, status lifecycle) | **never** |
| `context_store.comms_org_ownership` | T2 map: domains/owners, reporting chain, red-lines, `referenceFacts` | n/a |
| `context_store.comms_teams_whitelist` | Teams scope: CLM-leadership group IDs + 1:1 chat IDs | n/a |
| `embeddings` (shared) | vector index of initiative_memory / agent_log / ppp / research / initiative | read-only here |

**Privacy guardrails:**
- **Read-only channel.** The agent never sends; the human sends from the channel himself.
- **Sensitive threads** (HR/comp/legal/personal fraud) are flagged and **never drafted** — surfaced
  as placeholders. (The deterministic flag can over-trigger on keywords like "fraud"; a T2
  sub-agent may judge an operational thread draftable and **say so explicitly** in `why` — judgment
  refines the gate, but the flag is always shown.)
- **Comms data is never embedded** — no semantic search over the person's predicted/learned data.
- **Private content** (per the wider Second-Brain conventions) is never embedded or surfaced.

---

## 11. Design principles & lessons (the ones worth not relearning)

1. **Capture is the foundation.** A truncated/wrong input poisons everything downstream. Verify the
   real message before retrieval or drafting. Grounding can't rescue a clipped question.
2. **Orchestrator captures serial; sub-agents reason in parallel.** Keep rate-limited / interactive
   channel reads in one session; fan out the expensive reasoning over captured payloads.
3. **Tier the work.** Match processing depth to the judgment required; bias to deep on ambiguity;
   render every card so a mis-tier is visible and re-runnable. Don't pay deep-reasoning cost to
   conclude "monitor."
4. **Three evaluation nets, not one.** Schema forcing (shape) + self-eval (self-visible slips) +
   adversarial verify (faithfulness/facts/etiquette). Each catches what the others can't.
5. **Independent + adversarial beats self-review.** Self-eval shares the drafter's blind spots. A
   fresh agent prompted to *refute*, through *diverse lenses*, catches confabulated grounding and
   rule violations the drafter certified as fine.
6. **Surface, don't auto-fix.** Flag and let the human decide; flags are also learning signal.
7. **Suggest the action, not just a reply.** The response is often aimed elsewhere; learn action
   selection + targeting (`decision` rules), which is higher-value than phrasing.
8. **Predict ≠ best answer.** Model the short thing the person sends; gate data-pulls behind an
   explicit Assist opt-in.
9. **Exact facts exact, fuzzy memory fuzzy.** Structured lookups for ownership/identity; embeddings
   only for low-trust background, curated into a brief, never dumped.
10. **Don't manufacture work.** "You're clear" (`monitor`/`none`) is a valid, trust-building
    result. The gate is permissive; judgment at the read step keeps it honest.
11. **Pinned = the person's explicit word.** It asserts immediately and outranks inferred patterns
    (executive voice; stale-thread acknowledgment).
12. **Degrade gracefully.** Augmentation layers (T3 embeddings) must not be able to fail the spine;
    a network blip degrades T3 to empty, not the whole bundle.

---

## 12. Reusing this as a template

To retarget this architecture to a different person/domain, swap the **bold** parts and keep the
rest:

- **Channel connector** (here: MSFT Outlook/Teams MCP) — any read-only source. Keep the
  serial-capture / parallel-reason split.
- **The person + their org** (here: Yonatan + CLM) — re-seed T1 (`people`/org tree), T2 ownership
  map + red-lines + reference facts.
- **The deterministic gate** (`classify.ts`) — re-tune noise/sensitive/tier signals to the domain.
- **The voice + rulebook seed** (`prompts/prediction-subagent.md`, initial `comms_rules`) — encode
  the person's known style/decision patterns; the loop learns the rest.
- **The Assist hook** (here: `clm-main` analytics) — whatever authoritative data source the domain
  has, gated behind explicit opt-in.

What you keep — the reusable scaffolding:
- **Predict → reconcile → distill** learning loop with a versioned, status-graduated rulebook.
- **Tiered, anti-dilution retrieval** (rule spine + exact T1/T2 + low-trust curated T3).
- **The action model** (suggest actions, not just replies; learn targeting).
- **The three-layer evaluation** (schema forcing + self-eval + diverse-lens adversarial verify),
  tiered so verification spend lands where it matters.
- **The orchestrator/sub-agent/Workflow shape** (serial capture → tiered, schema-forced, verified
  fan-out → render → human-in-the-loop).

The deepest reusable idea: **an agent that models a person's judgment should be evaluated the way
you'd pressure-test a person's judgment — independently, adversarially, from several angles — and
should compound what it learns from being wrong.**

---

## File map

| File | Role |
|---|---|
| `classify.ts` | deterministic noise/sensitive triage gate (+ tier signals) |
| `retrieve.ts` | tiered retrieval — `assembleContext`, `ThreadInput`, `ContextBundle`, as-of filtering |
| `store.ts` | DB layer for `comms_predictions` + `comms_rules` |
| `types.ts` | shared types — `SuggestedAction`/`ActionType`, `Suggestion`, `PredictionRow`, `RuleRow` |
| `delta.ts` | reconciliation deltas — `structuralDelta` (style), `actionDelta` (action) |
| `confidence.ts` / `asof.ts` | rule-confidence scoring · as-of leak guard |
| `prompts/prediction-subagent.md` | the drafter's brief — voice, action taxonomy, etiquette, pinned rules |
| `prompts/triage-runner.md` | the per-thread sub-agent contract — steps, output schema, self-eval checklist |
| `triage.workflow.js` | the 3-layer Workflow — tier → schema-forced draft → self-eval → adversarial verify |
| `render-triage.ts` / `templates/triage.html` | the numbered, newest-first triage page (tier/verdict/age/channel badges) |
| `run.ts` | CLI — `classify`, `context:assemble`, `predictions:*`, `rules:*` |
| `CLAUDE.md` | operational index / runbook for the sweep |
| `RUNBOOK.md` | v1 backtest procedure |

---

*Living document. Write-side persistence is wired (2026-06-15); the **Pass-B reconcile helper**
(match Sent Items → delta → resolution → distill into `comms_rules`) is the next missing piece. When
the build moves ahead — the reconcile helper, new evaluation lenses, auto-revise, a generalized
template extraction — update this file in the same PR.*
