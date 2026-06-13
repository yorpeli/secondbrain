---
id: pillar-bu-ai-transformation
type: pillar
title: BU AI Transformation
status: active
owner: yonatan-orpeli
created: 2026-05-29
migration_status: in-supabase
entity_id: f39103e3-5443-4a4a-a28d-110d512e3af3
rehomes_from:
  - dlc-ai-era
---

# BU AI Transformation (incl. AI DLC) — Pillar Workspace

> **Pillar — modeled in Supabase (2026-06-13).** This is a **pillar**: a grain *above* a normal initiative that holds multiple initiatives (`initiatives.kind = 'pillar'`; children linked via `parent_id`). Initiative ID: `f39103e3-5443-4a4a-a28d-110d512e3af3`. Expect one sub-initiative per BU engagement.
>
> Per the DB-canonical model (`docs/superpowers/specs/2026-06-13-initiative-knowledge-db-canonical.md`): the **canonical knowledge is the Supabase memory doc** (`content_sections`, `section_type = 'memory'`). This folder holds working artifacts; this `CLAUDE.md` is a thin index; `memory.md` is a **pull-only mirror** — write knowledge to the DB memory doc (and re-embed), not back through the files.

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
