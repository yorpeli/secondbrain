# Comms Assistant — suggested *actions*, not just replies (design spec)

**Date:** 2026-06-14 · **Status:** approved, not yet implemented (spec → compact → implement)
**Builds on:** `2026-06-13-comms-response-learning-loop-design.md` and the two-source triage sweep
(`comms-assistant/CLAUDE.md`, shipped in `feat(comms-assistant): two-source triage sweep`).

## Problem / motivation

The triage system today treats every card as **a reply to the sender**: `suggestion.text` is a drafted
in-thread reply, `disposition` is a loose label (reply/monitor/open-loop/done). But observation of how
Yonatan *actually* responds shows the right output of triaging an incoming comm is usually **a decision
about what to do and who to aim it at** — and a reply-to-sender is only one option.

Evidence (2026-06-14 sweep reconciliation):
- **Meital** (India RTBV, Teams 1:1) → he **messaged a third party (Tal)**, not a reply to Meital.
- **Keurig / UBO** (email thread) → he **briefed his leaders privately** (Ido/Elad/Ira) and did **not**
  reply in-thread, because he had no value to add to the thread itself.
- **Elena / Compliance** (CLM risk-score) → he **routed to the owner (Ido)** by name and deliberately did
  **not** publicly instruct him.

These are already encoded as `comms_rules` (type `decision`, status `watch`) — they are **action rules**,
not style rules:
- *sidebar the vendor/owner directly* (Tal)  → rule `bd3c8879` (thread-participation) / sidebar
- *redirect to your leaders when you add no value in-thread* (UBO) → rule `bd3c8879`
- *route to the owner by name without publicly instructing them* (Elena) → rule `7945cfb6` (delegation-routing)

The exercise's whole point — "suggest comms **and actions**, and learn my patterns" — is under-served by a
reply-only model. The highest-value thing to learn is **action selection + targeting**, not phrasing.

## Target model: a suggested **action**

Each card's `suggestion` carries a **primary action** (optionally a secondary). `disposition` is formalized
into an **action type**, and we add a **target** (who/what it's aimed at).

| Action type | Meaning | Target | This session's example |
|---|---|---|---|
| `reply` | respond in the thread | the thread/sender | (default) |
| `redirect` | respond, but to a different audience | named people/group | UBO → your leaders (Ido/Elad/Ira) |
| `sidebar` | message a third party the thread implies | a person + channel | Meital → ping **Tal** (1:1) |
| `route` | hand to the owner by name (do NOT over-instruct) | the owner | Elena → **Ido** |
| `task` | create a follow-up / plan item | an owner + plan | Au10tix → Yarden, Q3 line |
| `escalate` | take to a 1:1 / upward | a person + forum | — |
| `schedule` | propose/confirm a sync | attendees + time | (war-room; see freshness check) |
| `monitor` / `none` | no action | — | (clear) |

## Schema changes

Extend `suggestion` (in `items.json` and, when persisted, `comms_predictions`):

```
suggestion: {
  action: { type: <action type>, target: <free text: who/what>, channel?: 'outlook'|'teams'|'task'|'1:1' },
  text,            // the drafted message for reply/redirect/sidebar/route (null for task/monitor)
  needs_data, confidence, why,
  lang?, lang_alt?, text_alt?,        // HE⇄EN toggle (unchanged)
  memory_brief,                       // unchanged
}
```
- `disposition` (current field) → becomes `action.type` (keep `disposition` as an alias during migration so
  existing pages render). The card's existing disposition badge shows `action.type`.
- `comms_predictions`: add `action_type` + `action_target` columns (nullable) so reconciliation can store
  what was suggested vs what he did.

## Drafting changes (`prompts/prediction-subagent.md`)

The sub-agent's job expands from "draft the reply" to **"choose the action + target, then draft it."**
Decision order: does this even warrant an in-thread reply? If he adds no value in-thread → `redirect`/
`sidebar`/`route` to the right person. Obey the new etiquette rule (`route` = name + hand off, no public
to-do list). Default to `monitor` over manufacturing work.

## Rendering changes (`render-triage.ts` + `templates/triage.html`)

Card ③ gains a prominent **action line** above the draft: `▸ <ACTION> → <target>` (e.g. *"Sidebar → message
Tal (1:1)"*, *"Redirect → your leaders (Ido/Elad/Ira)"*). The channel icon already exists; reuse it for the
target channel. The draft textarea + Copy stay. For `task`/`monitor`, show the action line and the `why`, no
textarea.

## Reconciliation / learning changes

The outbox/Sent sweep already captures what he sent. Extend reconciliation to record **action_type +
action_target actually taken** (incl. "sent to a different audience" / "messaged a third party" / "no
in-thread reply") and diff against the suggested action. Feed confirmed patterns into `comms_rules`
(type `decision`), scoped by `{topic, channel}` — e.g. "broad cross-functional thread, no value to add →
redirect to own leaders." Action rules graduate watch→active→assert like style rules.

## Migration / compat

- Backward compatible: cards without `action` fall back to `{type: disposition, target: null}`; renderer
  defaults to `reply`.
- The 3 `watch` rules already logged are the seed corpus for action-pattern learning — don't re-derive.

## Open questions (resolve at implementation)

1. Secondary actions: do we render more than one action per card, or keep primary-only + a note? (Lean: primary + optional one-line secondary.)
2. `task` action: just descriptive text, or actually create a `tasks`/`agent_tasks` row? (Lean: descriptive first; wire creation later.)
3. Do we want a "to whom" picker that resolves against `people`/`v_org_tree` for the target, or free text? (Lean: free text first, resolve later.)

## Implementation checklist (post-compact)

- [ ] `types.ts` / `classify`-adjacent: add the `action` shape; `comms_predictions` columns (`action_type`, `action_target`).
- [ ] `prompts/prediction-subagent.md`: action-selection + targeting + etiquette.
- [ ] `render-triage.ts` + `templates/triage.html`: the action line.
- [ ] reconciliation (`store.ts`/`delta.ts`): capture + diff action_type/target; feed `comms_rules`.
- [ ] `comms-assistant/CLAUDE.md`: document the action model in the procedure + Lessons.
