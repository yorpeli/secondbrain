---
id: pillar-bu-ai-transformation
type: pillar
title: BU AI Transformation
status: local-staging
owner: yonatan-orpeli
created: 2026-05-29
migration_status: not-in-supabase
rehomes_from:
  - dlc-ai-era
---

# BU AI Transformation (incl. AI DLC) — Pillar Workspace

> **⚠️ LOCAL STAGING — NOT IN SUPABASE.** This is a **pillar**: a grain *above* a normal initiative that will eventually hold multiple initiatives. It is intentionally not modeled in the database yet (modeling deferred to a pending architecture session).
>
> **Override of `initiatives/CLAUDE.md`:** The workspace-sync protocol does **not** apply here. There is no `entity_id`, no `initiatives` row, and no `content_sections` rows. Do **not** read/upsert `workspace-context` or `workspace-memory`, do **not** create DB records, and do **not** migrate this folder to Supabase — unless Yonatan explicitly asks. Filesystem only.

## Objective

Partner with every Payoneer business unit to drive AI transformation — embedding the AI-native delivery lifecycle (the "AI DLC") into how each BU builds product.

## Why It Matters

AI transformation only lands if it reaches the BUs where product actually ships.

## Scope

- Per-BU engagement
- AI DLC rollout
- Cross-BU intake and prioritization

## Re-homes From

Existing Supabase initiatives that will move under this pillar once the architecture is decided:

- [[dlc-ai-era]] — this is the AI DLC.

## Consumes (Reference, Not Owned)

- [[ai-native-team-structure]] — the operating model, applied per BU. Owned by the [[ai-powered-pm-team|Guild]] pillar.

## Net-New

- A per-BU engagement model + intake / prioritization.
- Expect this pillar to spawn one sub-initiative per BU engagement.

## Open Questions

- *(none flagged yet)*

## Working Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — pillar charter, context, and operating rules |
| `memory.md` | Working memory across Claude Code sessions (local only; not synced) |
| `docs/` | Working artifacts as they accumulate (create on demand) |
