# Comms Triage — DB-backed presentation + in-app feedback loop

**Date:** 2026-06-16
**Status:** Design approved — ready for implementation plan
**Owner:** comms-assistant
**Supersedes nothing.** Builds on:
[2026-06-13-comms-response-learning-loop-design.md](2026-06-13-comms-response-learning-loop-design.md),
[2026-06-14-comms-suggested-actions.md](2026-06-14-comms-suggested-actions.md).

## Problem

The comms-assistant triage sweep ends by rendering a **static HTML** file
(`render-triage.ts` → `output/comms-triage/triage-<date>.html`). That HTML is a dead end:
Yonatan reads it, edits/sends from Outlook, but there is **no path back** — he can't give
per-item feedback that the system captures. The only learning channel is the unbuilt "Pass B"
(read Sent Items, *infer* what he did, distill rules), which is passive and lossy.

We want an **interactive surface** where Yonatan edits drafts, accepts/rejects the suggested
action, leaves notes, and sets status per card — and that feedback persists to the DB as a
**direct, high-quality learning signal**.

Two hard constraints shaped the approach:
- **Cost stays on subscription.** The LLM reasoning + subagent fan-out must stay in a Claude
  session (Claude Code locally, or a claude.ai Project) — never in an edge function that calls
  the Anthropic API.
- **No re-analysis churn.** An unread email stays unread until sent from Outlook, so every sweep
  re-grabs it. Today we re-capture + re-fan-out it wastefully (dedup is write-time only). Once the
  app can write, an unguarded sweep would also **clobber in-app edits**.

## Architecture principle: brain vs plumbing

The agent splits into **brain** (reasoning, action-choice, drafting, subagent fan-out — stays in a
Claude session, on subscription) and **plumbing** (classify, retrieve, vector search, store,
feedback — deterministic, callable from anywhere). This spec moves *presentation + feedback* from a
local HTML file to the **DB as backbone**, with the existing read-only Vite app
(`app/`) gaining a write-capable triage page. The brain is untouched and stays in Claude Code.

## Two decoupled flows

The app and the learning are **separate flows that meet only at the DB** — neither blocks the other:

```
FLOW 1 (assist):  sweep → fan-out → comms_predictions (full card) → /triage app
                                                                        │
                                                  you edit / accept-reject / note / status
                                                                        ▼
                                              comms_feedback (+ user_touched guard)
FLOW 2 (learn):   [later, on demand]  rules:distill  →  reads NEW comms_feedback  →
                  Claude analyzes + ASKS CLARIFYING QUESTIONS  →  rules:add/supersede  →  comms_rules
                                                                        │
                                                          next sweep's drafting context
```

## Goals

- A card is **fully reconstructable from the DB** (no dependency on the in-memory `items.json` or
  the retrieval layer at view time).
- Yonatan can **edit draft / accept-reject action / note / set status** per card, persisted to the DB.
- In-app edits are **never clobbered** by a later sweep.
- The sweep **skips already-captured threads** unless they advanced (cost/time).
- The feedback is **distill-ready**: a later CLI pass turns it into `comms_rules`, interactively.

## Non-goals

- **Pass B (Sent-Items reconcile) is NOT built.** It is demoted to a secondary fallback whose only
  remaining job is catching *out-of-band sends* (replied from Outlook without opening the card). If
  the app is used reliably, it may never be worth building. See "Pass B demotion" below.
- No multi-user auth. The app is **localhost-only, single user** (Yonatan).
- No automated/cron distillation. Distill is **on-demand, Claude-in-the-loop, with approval**.
- The brain (sweep, classify, capture, fan-out) is unchanged except for the persist + skip steps.

## Data model (Phase 1)

### `comms_predictions` — enrich in place

The prediction *is* the card; we do not split it into a separate presentation table. Add:

| Column | Type | Purpose |
|---|---|---|
| `card` | `jsonb` | Full presentation payload so the app renders purely from the DB: `email{subject,from,date,to,excerpt,webLink,thread_summary}`, `thread` (ThreadInput), suggestion extras (`memory_brief`, `text_alt`, `lang`, `lang_alt`, `secondary`, `sources`), **and `context`** (the People/Guardrails/Rules that `render-triage.ts` gets from `assembleContext` today — precomputed at persist time, since the browser can't run the retrieval layer). |
| `status` | `text` default `'open'` | `open \| sent \| dismissed \| snoozed`. Drives the app queue + sweep skip. CHECK constraint. |
| `edited_reply` | `text` null | Yonatan's edited draft. Kept **separate from `predicted_reply`** so the suggestion-vs-edit delta survives as signal. |
| `action_accepted` | `boolean` null | null = untouched, true = accepted, false = overridden. |
| `overridden_action` | `jsonb` null | If rejected: corrected `{type,target}`. |
| `snooze_until` | `timestamptz` null | For snooze status. |
| `user_touched` | `boolean` default `false` | **Clobber guard.** Set true on any feedback event; the sweep upsert must never overwrite a touched row. |
| `last_message_id` | `text` null | `internet_message_id` of the newest message captured — the refresh ("did the thread advance?") check. |
| `captured_at` | `timestamptz` null | When this card was last (re)analyzed. |

### `comms_feedback` — new, append-only event log

```sql
create table comms_feedback (
  id            uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references comms_predictions(id) on delete cascade,
  kind          text not null check (kind in ('edit','action_override','note','status')),
  payload       jsonb not null,   -- edit:{from,to,lang?} · action_override:{from,to} · note:{text} · status:{to,snooze_until?}
  distilled_at  timestamptz null, -- "what's new since last distill" marker (Flow 2)
  created_at    timestamptz default now()
);
create index on comms_feedback (prediction_id);
create index on comms_feedback (distilled_at);
```

App reads *current* state from `comms_predictions` (one query). Distill + audit read the *event log*.
Nothing is ever destructively overwritten.

### `comms_apply_feedback` RPC — one atomic write path

Each interaction must (a) append a `comms_feedback` event, (b) update the denormalized latest-state
column(s) on `comms_predictions`, and (c) flip `user_touched`. To keep the browser dumb and the
write atomic, one Postgres function does all three in a transaction:

```
comms_apply_feedback(p_prediction_id uuid, p_kind text, p_payload jsonb) returns void
```

| UI control | `kind` | Effect |
|---|---|---|
| Edit draft (save) | `edit` | set `edited_reply` (+ lang variant in payload), `user_touched=true`, log `{from,to}` |
| Accept / reject action | `action_override` | set `action_accepted` / `overridden_action`, `user_touched=true`, log |
| Note field | `note` | `user_touched=true`, log `{text}` |
| Sent / dismiss / snooze | `status` | set `status` (+ `snooze_until`), `user_touched=true`, log `{to}` |

### RLS (localhost personal)

Enable RLS on `comms_predictions` and `comms_feedback`. Add policies letting the **anon** role
`select` / `insert` / `update` on **only these two tables** (the app uses `VITE_SUPABASE_ANON_KEY`).
Narrow door; avoids shipping the service key into the Vite bundle. The RPC runs `security definer`.

## Pipeline persist + clobber guard (Phase 2)

Changes to the orchestrator persist step (step 7) and `store.ts`:

- `predictions:add-many` writes the **full `card` payload** (incl. precomputed `card.context`),
  `last_message_id`, and `captured_at`.
- `upsertPredictions` (store.ts:28) gains the **`user_touched` guard**: an open row with
  `user_touched = true` is **never overwritten** (the in-app edit wins). This ships in Phase 2 — the
  moment the app (Phase 3) can write, the sweep must already respect it.
- `render-triage.ts` HTML render (step 6) **becomes optional** — the app is the primary surface;
  HTML stays as a fallback/export.

## The /triage app (Phase 3)

In the existing Vite + React 19 + Tanstack Query + Supabase + shadcn app (`app/`), following its
conventions (pages / hooks / components / `lib/supabase.ts`):

- `src/App.tsx` — add `<Route path="/triage" .../>`; nav entry in `src/components/layout/app-shell`.
- `src/pages/triage.tsx` — the queue: open cards (oldest-first), filter for snoozed/dismissed.
- `src/components/triage/triage-card.tsx` — ports the `render-triage.ts` card anatomy: ▸ **TYPE →
  target** line, channel icon, email meta, excerpt, draft, HE⇄EN toggle, collapsible `memory_brief`
  + People/Guardrails/Rules (from `card.context`), faint `sources` line, confidence, `why` — plus
  the four interactive controls.
- `src/hooks/use-triage.ts` — `useQuery` for `status='open'` (and `snooze_until` passed);
  `useMutation` wrapping `supabase.rpc('comms_apply_feedback', …)`, invalidating the queue on success.

The app renders **purely from the DB** — no retrieval layer, no MSFT calls in the browser.

## Skip / refresh policy (Phase 4)

A cost/time optimization on the collection side (Claude Code), run **before** any MSFT `read_resource`
or fan-out. New helper `classifyThreadForSweep(keys) → 'analyze' | 'skip' | 'refresh'` in `store.ts`,
keyed on `conversation_id` (→ `thread_id`), falling back to `internet_message_id`:

| DB state for this thread | Decision |
|---|---|
| No open row | **analyze** (new — capture + fan-out) |
| Open row, `user_touched = true` | **skip** regeneration — edits win |
| Open row, latest msg id == `last_message_id` (no new inbound) | **skip** — reuse card, no MSFT read, no fan-out |
| Open row, new inbound since `last_message_id` | **refresh** — re-capture + re-fan-out (respecting the guard) |
| Reconciled row (`resolution` set) | untouched (historical) — already the case today |

Orchestrator gains a step 2.5: run the check, drop `skip` threads, surface the
analyze/skip/refresh breakdown (no silent truncation). The critical *clobber* protection already
shipped in Phase 2; this phase adds the *don't-recompute-unchanged* savings.

## Distill — Flow 2 (Phase 5)

On-demand, Claude-in-the-loop, **interactive**. Same machinery as the backtest's RUNBOOK Stage 4,
now fed by `comms_feedback` instead of Sent-Items reconcile.

1. **Trigger** (natural language): "distill my comms feedback into rules", "what have I been
   teaching the assistant?".
2. `npm run comms-assistant -- rules:distill` pulls **undistilled** `comms_feedback`
   (`distilled_at IS NULL`) joined to their predictions, so each signal carries: suggested
   action+draft → your edit/override, your note, and **scope** (person / topic / channel /
   initiative, from `card.context`).
3. The Claude session **clusters the patterns**, scores them with the existing `confidence.ts`
   (support / consistency / diversity), and uses `delta.ts` (`actionDelta`, now pointed at
   `edited_reply` / `overridden_action`) for the suggestion-vs-yours diff. The reasoning is the LLM,
   not code.
4. It **asks clarifying questions** where a pattern is ambiguous, then proposes `rules:add` /
   `supersede` (existing `store.ts` functions). **Yonatan approves** every rule. Pinned /
   executive-voice rules are never touched.
5. Processed `comms_feedback` rows are stamped `distilled_at = now()` so the next run only sees new
   signal.

The app never blocks on this; distillation never blocks triage.

## Pass B demotion

Today "Pass B" bundled **reconcile** (Sent-Items → infer `actual_reply`) and **distill** (signal →
rules). This spec **keeps distill** (Phase 5, now fed by `comms_feedback`) and **demotes reconcile**
to a secondary fallback for *out-of-band sends* only. It is **not built here**. Seam note for
whenever it is built: the distiller must treat `comms_feedback` as the **primary** signal and
Sent-Items `actual_reply` as secondary corroboration — not the reverse.

## Build order

1. **Schema** — predictions enrichment + `comms_feedback` + `comms_apply_feedback` RPC + RLS + `distilled_at`.
2. **Pipeline persist** — step 7 writes full `card` + markers; `user_touched` clobber-guard in `upsertPredictions`.
3. **The app** ⭐ — `/triage` page, read + 4 feedback interactions via the RPC.
4. **Skip/refresh** — `classifyThreadForSweep` in collection.
5. **Distill** — `rules:distill` command (interactive) + `distilled_at` stamping.

## Testing

- **Schema/RPC:** unit-test `comms_apply_feedback` for each `kind` — correct event row + correct
  denormalized state + `user_touched` flip, all atomic.
- **Clobber guard:** test that `upsertPredictions` skips an open `user_touched=true` row.
- **Skip policy:** unit-test `classifyThreadForSweep` across the decision matrix.
- **App:** the existing app has no test harness; verify manually (read queue, exercise each of the
  four interactions, confirm DB rows). Keep card-rendering logic in pure functions where feasible.
- **Distill:** dry-run on the existing 31 prediction rows once feedback exists; confirm only
  `distilled_at IS NULL` rows are pulled and that stamping is idempotent.

## Open risks

- **`card.context` staleness:** context is precomputed at persist; if it goes stale before review,
  the card shows as-of-capture context. Acceptable — it mirrors what the HTML showed; a refresh
  re-runs `assembleContext`.
- **anon write surface:** permissive RLS on two tables via the anon key. Acceptable for a
  localhost-only personal tool; revisit if ever hosted (would need Supabase Auth + per-user RLS).
