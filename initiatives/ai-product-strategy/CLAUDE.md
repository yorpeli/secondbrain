---
id: pillar-ai-product-strategy
type: pillar
title: AI Product Strategy
status: local-staging
owner: yonatan-orpeli
created: 2026-05-29
migration_status: not-in-supabase
rehomes_from: []
---

# AI Product Strategy — Pillar Workspace

> **⚠️ LOCAL STAGING — NOT IN SUPABASE.** This is a **pillar**: a grain *above* a normal initiative that will eventually hold multiple initiatives. It is intentionally not modeled in the database yet (modeling deferred to a pending architecture session).
>
> **Override of `initiatives/CLAUDE.md`:** The workspace-sync protocol does **not** apply here. There is no `entity_id`, no `initiatives` row, and no `content_sections` rows. Do **not** read/upsert `workspace-context` or `workspace-memory`, do **not** create DB records, and do **not** migrate this folder to Supabase — unless Yonatan explicitly asks. Filesystem only.

## Objective

Lead Payoneer's AI product strategy — where the company goes with AI, and what it invests and bets on.

## Why It Matters

Sets the direction the other three pillars execute against.

## Current State

**Greenfield** — no existing Supabase initiative. `rehomes_from` is intentionally empty.

## Scope

- AI product direction
- Investment and bets
- Prioritization of where to invest

## Re-homes From

None — this pillar is greenfield.

## Reference Feeders (Not Owned)

- [[kyc-as-product]] — a case study in productizing an internal capability.
- [[air-squared]] — rapid-experiment method as a reusable pattern.

## Net-New

- AI investment thesis.
- Bet portfolio.
- Prioritization framework for where to invest.

## Open Questions

- *(none flagged yet)*

## Working Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — pillar charter, context, and operating rules |
| `memory.md` | Working memory across Claude Code sessions (local only; not synced) |
| `docs/hbs-case-convergences.md` | Six cross-case patterns from the HBS GenAI course pre-work — the evidence base (per-pattern quotes, Payoneer bridges, mapping to the three net-new artifacts) |
| `docs/patterns-to-business-outcomes.md` | Each pattern → business outcomes at two altitudes (CLM / Payoneer) + June 2026 market research → three candidate business moves |
| `docs/agentic-era-market-map.md` | Future-back: three 2030 market maps (eCom, money movement, B2B trade) → playable areas → Payoneer plays in 4 tiers, scored by right-to-win + convergence test vs the inside-out work |
| `docs/` | Further working artifacts as they accumulate (create on demand) |
