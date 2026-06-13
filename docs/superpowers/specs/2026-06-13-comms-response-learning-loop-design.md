# Comms Response Learning Loop — Design

**Date:** 2026-06-13
**Status:** v1 scope locked — pending final review before implementation plan
**Related:** `context_store.decision_journal_test` (the manual decision journal this
loop automates a subset of); `agents/command-center-capture.md` (the live sweep this
will eventually hook into); `lib/research.ts` (the supersede pattern the rule store
generalizes).

## Why

The Second Brain captures state and history well but does not model *how Yonatan
decides or communicates*. Every piece of data still routes through him. We want the
system to learn his **style** (voice, tone, length, language) and **decision logic**
(yes/no/defer, escalate vs absorb, reprioritize) by predicting his responses to
comms and learning from where its prediction diverged from what he actually did.

A manual harvest (read sent mail, infer the "why") was tried in conversation and hit
two walls: the "why" is the agent's *guess*, and genuine decisions are buried under
~85% calendar/notification noise. This loop fixes both by using a **ground-truth
label** — the response Yonatan actually sent — to supervise and self-correct each
prediction.

The MSFT connector is **read-only** (search/read, no send). That constraint *is* the
architecture: the system drafts/predicts into the DB, Yonatan sends manually from
Outlook/Teams, and a later sweep reads sent items and diffs. The live loop never
needs send access.

## Scope

### v1 — retrospective backtest (this spec)
- **Silent, email-only, retrospective** over the last ~30 days.
- Ground truth already exists in the thread (incoming email + Yonatan's actual
  reply), so the full pipeline — predict → compare → ask-why → distill — runs *today*
  instead of waiting two weeks for forward data.
- Sample: **genuine reply threads only** (`Re:` with substance). Calendar invites,
  RSVPs, and PPP-comment notifications are filtered out (~85% of sent volume).
  Expected ~15–25 real threads.

### Why backtest first
- Quick win: answers "can the system predict Yonatan at all?" before any UI is built.
- Exercises every engineering decision — storage, per-step processing, rule
  creation/ranking — on real data, cheaply.
- The live silent-mode loop is the *same machinery* pointed at new mail.

### Phase 2 — initiated (non-reply) emails (added later)
Emails Yonatan *starts* (no incoming trigger) can't be predicted, but they are rich
**evidence for rule creation**, and arguably the *cleaner voice corpus*: a reply
mirrors the sender's tone/length/language, whereas an initiated email is Yonatan's
unanchored voice. They flow `observation → distill`, **skipping predict and
reconcile**.

- **Strong for `style` rules** — voice, register, framing to leadership vs. reports,
  who he loops in.
- **Softer for `decision` rules** — they reveal *what he proactively raises* (forcing
  functions, priorities) but carry no delta-correction, so they're lower-weight
  evidence than a reply delta.
- **Excluded from prediction-accuracy metrics** — they have no prediction, so they
  contribute to rule *coverage*, never to the "can it predict Yonatan?" measure.

Kept out of the v1 backtest deliberately, to keep the predict-vs-actual experiment and
its accuracy metric clean. The data model is forward-compatible now (see the `mode`
field) so Phase 2 needs no schema repaint.

### Out of scope (YAGNI for v1)
- Live/forward mode, Teams, assisted mode (suggest-and-edit), the "needs a response"
  classifier as a live gate, any send capability, any UI beyond reading stored
  results. Each is a follow-up once v1 proves predictability.

## The make-or-break: blind prediction (no leakage)

The backtest is only honest if the prediction step is **blind to the answer and to
the future**. Three leaks to seal:

1. **The reply itself** — the predictor sees the incoming email + thread *up to that
   point only*, never Yonatan's actual response.
2. **Downstream context** — initiative-memory docs, `current_focus`, and later
   threads were *shaped by the decision being predicted*. The predictor is conditioned
   only on DB/context state **as it existed at the moment the email landed**
   (`asOf = email.receivedDateTime`). Practically: filter any context record by
   `created_at/updated_at <= asOf`, and prefer point-in-time-safe sources.
3. **Agent foreknowledge** — the predictor must not reason "I know this deal went
   ahead." Mitigated by (a) the time-boxed context above and (b) an explicit prompt
   instruction to predict only from supplied, as-of context.

Getting this right is most of the value: the live loop gets blindness for free (the
future genuinely hasn't happened), so the backtest is the only place we can fool
ourselves. If we can't enforce it, the backtest looks great and teaches nothing.

## Architecture — four stages

Each stage is an independent unit with a clear interface, runnable and testable on its
own.

1. **Classify** — from the last-30-days sent corpus, identify genuine reply threads
   needing a response; drop calendar/notification noise. Output: a worklist of
   `(incoming_email, thread_to_date, asOf)`.
2. **Predict (blind)** — for each worklist item, assemble *as-of* context (person
   record, initiative memory, prior thread — all filtered to `<= asOf`), predict the
   reply, and self-rate confidence + record what context was available. Writes a
   `comms_predictions` row. **Never reads the actual reply.**
3. **Reconcile** — match each prediction to Yonatan's actual sent reply via
   conversation/thread id. Compute the delta (style vs stance). Bucket the
   `resolution`. Where the *stance* delta is meaningful, queue a "why?" question.
   Yonatan answers; the answer is stored. **v1 cadence: asked item-by-item during the
   run.** Day-to-day later: batched into the command-center sweep or a scheduled task.
4. **Distill** — cluster observations into candidate rules, score confidence, promote
   / reinforce / contradict / supersede existing rules. Writes/updates `comms_rules`.

Stages are sequential for v1 (classify → predict, barrier, then reconcile → distill)
because reconcile needs the full prediction set and distill needs cross-item
clustering.

## Data model

Two new tables (dedicated tables, following the `command_center_*` precedent, rather
than cramming structured records into `context_store` jsonb).

### `comms_predictions` — one row per backtested item
| Column | Notes |
|---|---|
| `id` uuid pk | |
| `mode` | `reply` (v1 — full predict→reconcile loop) or `initiated` (Phase 2 — observation only; `predicted_reply`/`delta`/`resolution`/`confidence` null; excluded from accuracy metrics, included in distill) |
| `thread_id` / `message_id` | the incoming email + its conversation id (for `initiated`: the sent message itself, no incoming trigger) |
| `channel` | `email` (v1); `teams` later |
| `as_of` timestamptz | the email's arrival time — the blindness cutoff (for `initiated`: the send time) |
| `trigger_text` | verbatim *relevant span* of incoming email + thread-to-date (quoted history/signatures stripped); placeholder if sensitive |
| `predicted_reply` | agent output, blind |
| `confidence` | agent self-rating *before* truth: `high`/`med`/`low` + numeric |
| `context_available` jsonb | what it had: person-in-db? initiative memory? prior thread? cold-start? |
| `actual_reply` | ground truth (filled in reconcile); verbatim relevant span, placeholder if sensitive |
| `delta` jsonb | `{ style: {...}, stance: {...} }` |
| `resolution` | `match` / `edited` / `out_of_band` / `no_reply` |
| `why` | Yonatan's reason, when asked |
| `derived_rule_ids` uuid[] | rules this item supported/created |
| `created_at` | |

`out_of_band` is a first-class bucket: Yonatan often resolves in a meeting, verbally,
or on WhatsApp (observed in Teams). Without it the loop mislabels "ignored" when he
actually handled it elsewhere.

### `comms_rules` — the living rulebook (versioned, append-only history)
| Column | Notes |
|---|---|
| `id` uuid pk | |
| `scope` jsonb | `{ person?, initiative?, topic?, channel? }` |
| `type` | `style` or `decision` (decision rules also feed `decision_journal`) |
| `statement` | human-readable rule, e.g. "With Elad: terse Hebrew, one line." |
| `confidence` numeric | computed from the four dimensions below |
| `support` int | # corroborating observations |
| `consistency` numeric | agree vs contradict ratio |
| `diversity` int | distinct threads/days/contexts (guards against one chatty thread) |
| `data_dependency` | conditions for reliability, e.g. "only when prior thread + person context exist; cold-start → don't assert" |
| `status` | `watch` / `active` / `superseded` / `retired` |
| `supersedes` uuid | self-reference to the version this replaces |
| `pinned` bool | Yonatan declared it; max confidence, exempt from decay |
| `created_at` / `updated_at` | |

## Rule lifecycle

### Creation — with confidence, never from one row
An observation (one delta) is **evidence**, not a rule. A **candidate rule** is
proposed only when observations cluster on a pattern. Confidence is a function of four
dimensions, not just count:

- **Support** (n) — guards against one-offs.
- **Consistency** — agree vs contradict; guards against cherry-picking.
- **Diversity** — distinct threads/days/contexts; guards against one thread inflating n.
- **Recency** — recent evidence weighted higher; guards against stale patterns.

**Confidence gates use**, it doesn't just label:
- `active`/high → asserts (drives the prediction).
- `active`/medium → whispers (informs, flagged tentative).
- `watch` (below floor) → tracked, not allowed to influence predictions yet.

**Promotion `watch → active` (v1):** support ≥ 3, consistency ≥ 0.7, diversity ≥ 2.
Deliberately simple; adjust after the backtest.

Each rule also records **`data_dependency`** — the conditions under which it's allowed
to be confident. This makes "does the agent predict well *when it has data* and badly
when cold?" a measurable question, which tells us whether the loop's value is gated on
**data availability** vs model quality.

### Evolution over time
| Event | Effect |
|---|---|
| Reinforce | matching observation → confidence ↑ |
| Contradict | violating observation → confidence ↓ |
| Decay | no supporting evidence over time → confidence slowly bleeds (passive drift handling) |
| Supersede | a contradicting pattern accumulates its own support → new rule replaces old, **versioned not deleted** (`supersedes` link) |
| Refine / split | right in some contexts, wrong in others → add a condition, split by scope |
| Retire | confidence below floor → `retired` with a tombstone (so it isn't silently relearned) |

Two safety principles:
- **Versioned + append-only history.** Never silently overwrite — supersede with
  provenance. Buys auditability ("why do you think this?"), makes Yonatan's *own
  drift* visible, and tombstones prevent relearning rejected rules. (Generalizes the
  `lib/research.ts` supersede pattern.)
- **Human override outranks inference.** Yonatan can pin / edit / kill any rule. A
  `pinned` rule gets max confidence and is exempt from decay — his explicit word beats
  accumulated inference.

### Drift is a feature
When a rule **flips** (e.g. used to defer eBay metric debates to Yaron; last three he
took himself), the flip triggers the **same "why?" loop one level up**: "Your stance
here seems to have changed — did it?" The system learns not just the rules but the
*moments they change*.

### Conflict at prediction time
When two rules apply and disagree: **higher-confidence + narrower-scope wins**. An
unresolved tie yields a **low-confidence** prediction — which is exactly the
`confidence` signal we wanted to capture.

## Privacy

- Existing sensitivity rules hold: sensitive threads (HR, comp, legal, fraud
  investigation) — store a `sensitive — not detailed` placeholder, never the text.
  Silent mode can still self-grade whether the *stance* was predicted right without
  storing content.
- **Non-sensitive threads store verbatim the *relevant span*** — the incoming trigger
  message and Yonatan's reply — because style/wording deltas cannot be computed from an
  abstraction. Strip quoted prior-thread history, signatures, and disclaimers to the
  relevant part only. This is a deliberate, scoped exception to the "distilled, not
  raw" norm, justified by the delta-comparison purpose.
- `comms_predictions` and `comms_rules` content is **never embedded** (consistent with
  the `command_center_*` and PPP `private_notes` rules). Record this as a
  `project_decisions` entry on build.

## Relationship to the decision journal

The `decision_journal_test` catches decisions that never become an email (in-meeting
routing, verbal escalations). This loop is the **automated engine** for the comms
subset: every `decision`-type rule and every `why` answer is a decision-journal entry,
auto-generated. They feed the same heuristics layer; neither supersedes the other.

## Success / kill criteria

- **Primary question:** can the system predict Yonatan's replies at all? Measure
  `resolution` distribution and, among `match`/`edited`, how close.
- **The diagnostic that matters most:** prediction quality **conditioned on
  `context_available`**. If good-with-context / poor-when-cold, the highest-leverage
  investment is feeding context, not a smarter prompt.
- **Do deltas cluster into rules** with real `confidence`, or is every one a special
  case? (Same test as the decision journal, now automated.)
- **Kill:** if predictions are no better than random *even when context exists*, and
  deltas don't cluster, the loop's premise is wrong — stop before building live mode.

## Resolved decisions (v1)

1. **Confidence promotion `watch → active`:** support ≥ 3, consistency ≥ 0.7,
   diversity ≥ 2. Start simple; adjust after the backtest.
2. **"Why?" cadence:** item-by-item during the v1 backtest run. Day-to-day comes
   later — built into the command-center sweep or a scheduled task.
3. **Text storage:** non-sensitive threads store the verbatim *relevant span*
   (incoming trigger + reply, quoted history/signatures stripped) so deltas are
   computable; sensitive threads → placeholder; never embedded.
