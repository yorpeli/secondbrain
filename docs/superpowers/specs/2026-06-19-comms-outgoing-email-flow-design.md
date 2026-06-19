# Comms Assistant — Outgoing Email Flow ("send X an email about it")

**Date:** 2026-06-19
**Status:** design (approved in brainstorm; pending spec review → implementation plan)
**Agent:** `comms-assistant`
**Related:** [agent-arch.md](../../../comms-assistant/agent-arch.md) · [comms-assistant/CLAUDE.md](../../../comms-assistant/CLAUDE.md) · [agents/comms-assistant.md](../../../agents/comms-assistant.md) · outgoing-draft bridge [outlook-bridge/README.md](../../../comms-assistant/outlook-bridge/README.md)

---

## 1. Problem & intent

The comms-assistant today is **incoming-only**: it sweeps unread mail/Teams, predicts how
Yonatan would respond, reconciles against what he sent, and distills a rulebook. There is no
flow for the inverse — the very common case where, mid-conversation, Yonatan says **"send Elad
an email about it"** and wants Claude to draft, show, and (on approval) push a reviewable draft
to Outlook.

This spec adds an **outgoing ("initiated") flow** that:

1. Is **conversation-triggered** (natural language), not a batch sweep.
2. **Gathers memory/knowledge first**, exactly as the reply flow does (tiered retrieval + the
   rule spine), so the draft is grounded.
3. **Drafts in Yonatan's voice**, applying the learned rulebook (incl. the pinned executive-voice
   rule).
4. **Shows the draft in chat**; on approval **pushes it to Outlook as a reviewable draft** via the
   existing local bridge (`/draft mode:fresh`). Never sends — Yonatan sends from Outlook.
5. **Feeds the learning loop**: the email is persisted as an `initiated` prediction, and the
   **approve-time edit diff** (draft shown → version approved) becomes a `comms_feedback` signal
   that `rules:distill` consumes — so the rulebook learns *how Yonatan initiates*, not just how he
   replies.
6. **Learns contacts**: a recipient email resolved by asking (or filled in Outlook) is persisted
   back into our systems so Claude never asks twice.

**The flow is composition, not new machinery.** Nearly every part already exists; the new code is
small and additive.

### Non-goals (v1)
- **Teams-initiated** sends — the bridge is Outlook-only. Out of scope.
- **Auto-send** — the agent never sends; the read-only-channel / human-in-the-loop invariant holds.
- **A later Sent-Items reconcile as the primary signal** — the approve-time edit diff is primary
  (consistent with the "in-app feedback primary, Sent reconcile demoted/unbuilt" decision). A Sent
  corroboration may be added later but is not built here.

---

## 2. Design decisions (from brainstorm, 2026-06-19)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | **Primary learning signal** | **Approve-time edit diff** (draft shown vs. approved), to `comms_feedback` | Immediate, high-signal, no later sweep; same machinery as reply edits. |
| 2 | **Eval depth before showing** | **Adaptive by stakes** — light (self-eval + exec-voice) default; escalate to full diverse-lens adversarial verify for high-stakes | Yonatan is the live adversary in chat; spend verify budget only where it matters. |
| 3 | **Record / surface** | **`comms_predictions` (`mode:'initiated'`) + `comms_feedback`** | Closes the loop, shows in `/triage` history, reuses `rules:distill`. No new tables. |
| 4 | **Who drafts** | **Main (conversation) agent drafts**; adversarial **verifiers stay fresh/blind** when escalated | The conversation *is* the source material; a blind sub-agent would discard it. Verifiers only need draft+bundle, so blindness is preserved where it counts. |
| 5 | **Contact learning** | Backfill `people.email` (known person) / `context_store.comms_contacts` (external); ask once if unknown | A resolved address is durable knowledge — persist it so we never re-ask. |
| 6 | **Sensitive topics** | **Draft but flag** (unlike incoming-sensitive, which is never drafted) | Yonatan explicitly asked for the mail; flag for his judgment rather than refuse. |

---

## 3. Flow (step by step)

```
conversation ──"send X an email about it"──┐
                                           ▼
 1. RESOLVE INTENT   recipient(s) → person slug + email (T1 / comms_contacts / ask once)
                     subject matter ("about it") → a short brief  ⇒ trigger_text
 2. GATHER           assembleContext(ThreadInput) → rule spine + T1/T2/T3 bundle
                     (+ searchByType over our own data); surface memory_brief + sources
 3. DRAFT            main agent drafts in Yonatan's voice, rulebook applied
                     → self-eval (language/etiquette/stale-date/exec-voice)
                     → compute stakes signals (routeTier-style)
 3b. ESCALATE (hi)   high-stakes → fresh/blind diverse-lens adversarial verifiers
                     (faithfulness / ownership-and-facts / voice-and-etiquette) → flags
 4. SHOW + APPROVE   present draft + recipient + memory_brief/sources + confidence + flags
                     → approve / edit / revise (loop)
 5. PUSH             bridge POST /draft {mode:'fresh', to, subject, body} → Outlook compose
                     (reviewable; never sends)
 6. PERSIST + DIFF   comms_predictions (mode:'initiated', trigger_text, draft, approved, …)
                     + approve-time edit diff → comms_feedback (kind 'edit')
                     + contact-learning backfill (people.email / comms_contacts)
 7. DISTILL          rules:distill (existing) consumes the feedback → updates comms_rules
```

### Step 1 — Resolve intent (from the conversation)
The main agent extracts, from the live conversation:
- **Recipient(s):** resolve name → person `slug` via `people` / `v_org_tree` (T1 fuzzy `name ILIKE`).
  Then resolve the **email address** (see §4, contact learning).
- **Subject matter:** "about it" = what we just discussed. Distill into a short **brief** of what
  the mail must convey. This brief is stored as `trigger_text`.
- **Mode:** normally a fresh initiated send. (If the conversation is clearly continuing an existing
  thread, the agent may note it, but v1 pushes `mode:'fresh'`.)

### Step 2 — Gather (reuse reply grounding verbatim)
Build a `ThreadInput` (`retrieve.ts`): `{ subject: <synthesized topic>, participants: [Yonatan,
recipient(s)], bodyToDate: <the brief> }`, **omit `asOf`** (live). Run `assembleContext()` →
- **Spine:** `comms_rules` scope-matched to the recipient/topic (pinned exec-voice asserts).
- **T1:** recipient identity / role / relation.
- **T2:** ownership map, red-lines, `referenceFacts` (office geography, etc.).
- **T3:** `searchByType` narrative over `initiative_memory` / `agent_log` / `ppp` / `research`,
  curated into a 1–3 line `memory_brief` (or "nothing material in memory").

Surface the `memory_brief` + a faint `sources` line — same transparency safeguard as triage.

### Step 3 — Draft (main agent authors)
The main agent drafts the email itself, holding the conversation context, after explicitly loading
the rule spine returned by `assembleContext`:
- Apply pinned **executive-voice** rule (cooperative/positive; soften accusatory/defensive); plus
  terse / probe-the-mechanism / route conventions and any person/topic-scoped `style`+`decision`
  rules.
- Write in Yonatan's voice. Set `confidence`, `why`, `memory_brief`.
- **Self-eval** (`self_check`): language correct, etiquette OK, no stale dates, exec-voice applied.
  Revise-then-show if any check fails.
- Compute **stakes signals** (an outgoing analogue of `routeTier`, §5): recipient seniority (SVP+),
  external/vendor, sensitive topic, grounding-heavy factual claims.

### Step 3b — Adaptive escalation (high-stakes only)
If stakes escalate, dispatch the existing **diverse-lens adversarial verifiers** (fresh, blind to
our chat) over `{ draft, bundle, brief }`: `faithfulness` (does it say what we intend, not a
strawman), `ownership-and-facts` (every name/owner/number/office traces to the bundle), and
`voice-and-etiquette` (no public instruction / accusatory / stale date; exec-voice). Majority refute
(≥2/3, severity>none) → the flags render inline **before** the draft is shown. Low-stakes skips this
entirely. This reuses the verify stage from `triage.workflow.js` (extracted or invoked thinly).

### Step 4 — Show + approve (in chat)
Present: the draft, the recipient(s), `memory_brief` + sources, `confidence`, and any verifier
flags. Yonatan: **approves** verbatim, **edits** (gives the final text), or **asks for a revision**
(re-draft, loop step 3). The approved text is captured for the diff.

### Step 5 — Push to Outlook draft (bridge)
On approval, `POST` to the local bridge `/draft`:
```json
{ "mode": "fresh", "to": ["recipient@payoneer.com"], "subject": "...", "body": "<approved text>" }
```
→ `osascript` → reviewable Outlook compose window. **Never sends.** Requires `npm run
outlook-bridge` running (127.0.0.1:7777, token-gated) + Legacy Outlook for Mac. If the bridge is
down, fall back to showing the approved text for manual paste (and say so).

### Step 6 — Persist + capture the diff
- **Persist** an initiated card to `comms_predictions`:
  `mode:'initiated'`, `channel:'outlook'`, `as_of:<today>`, `trigger_text:<brief>`,
  `predicted_reply:<my draft>`, `action_type:'reply'|'redirect'`, `action_target:<recipient>`,
  `confidence`, `tier`, `verdict` (if escalated), `memory_brief`, `card` payload,
  `edited_reply:<approved text>` (if edited), `status:'sent'` on push.
  `thread_id`/`message_id`/`internet_message_id` stay `null` (fresh send — the bridge returns no id).
- **Capture the approve-time edit diff** (my draft vs. approved) via `delta.ts` `structuralDelta`
  (length ratio, language match) + a substance note → write to `comms_feedback` (kind `'edit'`) with
  `mode:'initiated'` provenance. Verbatim approval = positive reinforcement (low/no edit). Heavy edit
  = strong style/decision signal.

### Step 7 — Distill (existing, on-demand, unchanged)
`npm run comms-assistant -- rules:distill` already loads undistilled `comms_feedback`, clusters,
asks "why", proposes `rules:add`/`supersede`, then `--mark`s rows processed. Initiated-mode edits
flow through with no change — they just carry `mode:'initiated'` provenance, so the rulebook begins
learning **initiation patterns** (opening conventions, per-person directness, what Yonatan puts in
writing vs. handles live) alongside reply patterns.

---

## 4. Contact learning (decision #5, detailed)

Recipient → email resolution order:
1. **`people.email`** for a known person (T1). (Column exists; frequently empty.)
2. **`context_store.comms_contacts`** — a `{ alias/name → { email, learned_at, source } }` map for
   externals/vendors who don't warrant a full `people` row (same lightweight pattern as
   `comms_teams_whitelist`).
3. **Ask Yonatan once** (or he fills the address into the Outlook draft directly).

**Backfill (the learning step), on resolution by ask/Outlook:**
- **Known person, `email` empty** → `UPDATE people SET email=…, updated_at=now()` (silent enrichment).
- **Known person, `email` differs** → confirm with Yonatan before overwriting (human data).
- **External / not in `people`** → upsert into `context_store.comms_contacts` with provenance
  `[learned via outgoing email: <date>]`.

Next time the same recipient is named, step 1/2 resolves it — no re-ask.

---

## 5. Stakes signals (outgoing analogue of `routeTier`)

A thin classifier decides whether to escalate to adversarial verify. Escalate when **any** of:
- Recipient is **SVP+** (e.g. Yaron, Oren) or a **board/exec** audience.
- Recipient is **external / a vendor**.
- Topic is flagged **sensitive** (HR/comp/legal/fraud) — drafted-but-flagged (decision #6).
- The draft makes **grounding-heavy factual claims** (specific numbers/owners/commitments) drawn
  from T3 memory rather than the conversation.

Otherwise stay **light** (self-eval + exec-voice only). Bias toward escalation on ambiguity — same
principle as triage tiering.

---

## 6. Reused vs. new

**Reused as-is (no change):**
- `retrieve.ts` `assembleContext` / `ThreadInput` / `ContextBundle` — gather.
- `comms_rules` spine + `prompts/prediction-subagent.md` voice — draft.
- `triage.workflow.js` adversarial-verify stage — escalation (invoked thinly / extracted).
- `outlook-bridge` `/draft mode:'fresh'` — push (already supports fresh compose).
- `comms_predictions` (`mode:'initiated'`, `trigger_text` already in schema) + `comms_feedback` +
  `rules:distill` — persist + learn.
- `delta.ts` `structuralDelta` — the edit diff.

**New, small (additive):**
1. **Documented NL-trigger procedure** — a row in the `agents/comms-assistant.md` + project
   `CLAUDE.md` comms-assistant trigger table ("send X an email about it" → this flow), plus a
   section in `comms-assistant/CLAUDE.md`.
2. **Persistence helper** — a CLI path to write an initiated card (`predictions:add-initiated`, or
   reuse `predictions:add-many` with `mode:'initiated'`) **and** a feedback write for the
   approve-time diff (`feedback:add` or equivalent). Firmed up in the implementation plan.
3. **Contact-learning helper** — resolve/backfill `people.email` and a `comms_contacts` upsert in
   `context_store`.
4. **Outgoing stakes check** — the §5 classifier (small, reuses `routeTier`-style structural signals).
5. **Prompt addition** — an *Initiated (outgoing) mode* section in `prompts/prediction-subagent.md`
   covering opening conventions / initiation voice (the main agent follows it when drafting).

---

## 7. Privacy & invariants (unchanged, must hold)
- **Read-only channel / never send.** The bridge only opens a reviewable draft; Yonatan sends.
- **`comms_predictions` / `comms_rules` / `comms_feedback` are never embedded.**
- **Sensitive outgoing = drafted-but-flagged** (Yonatan asked for it); the flag is always shown.
- **Transparency:** always surface `memory_brief` + `sources` so the evidence behind a draft is
  visible and judgeable.
- **Human data writes** (`people.email` overwrite) confirm before clobbering a differing value.

---

## 8. Open items to resolve in the plan
- Exact CLI surface for the initiated persist + feedback write (new subcommands vs. reuse
  `add-many`).
- Shape of `context_store.comms_contacts` and its read path in resolution.
- Whether the adversarial-verify stage is extracted into a shared module or invoked via a trimmed
  workflow call.
- `delta`/substance-diff representation written to `comms_feedback` for initiated mode.
```
