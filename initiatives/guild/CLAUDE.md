---
id: pillar-guild
type: pillar
title: Guild
status: active
owner: yonatan-orpeli
created: 2026-05-29
migration_status: in-supabase
entity_id: 070ae6a8-23f8-4418-b726-dd42fe9f2711
rehomes_from:
  - ai-powered-pm-team
  - pm-workshop-2026
  - ai-native-team-structure
---

# Guild — Pillar Workspace

> **Pillar — modeled in Supabase (2026-06-13).** This is a **pillar**: a grain *above* a normal initiative that holds multiple initiatives (`initiatives.kind = 'pillar'`; children linked via `parent_id`). Initiative ID: `070ae6a8-23f8-4418-b726-dd42fe9f2711`.
>
> **Override of `initiatives/CLAUDE.md`:** The workspace-sync protocol does **not** apply here. There is no `entity_id`, no `initiatives` row, and no `content_sections` rows. Do **not** read/upsert `workspace-context` or `workspace-memory`, do **not** create DB records, and do **not** migrate this folder to Supabase — unless Yonatan explicitly asks. Filesystem only.

## Objective

Lead Payoneer's Product Management Guild — product craft, standards, community, and AI fluency across the PM org.

## Why It Matters

The Guild is how product craft and AI-native ways of working propagate across Payoneer's PM population.

## Scope

- PM standards & playbook
- PM community and rituals
- PM AI adoption
- Product role / team definition

## Stakeholders

- **Mor Lalush-Regev** — Current PM Guild Leader; stepping down. Yonatan replaces her.
- **Noa Lichtig** — Guild Ops.
- **Yonatan Orpeli** — Incoming Guild lead (pillar owner).

## Re-homes From

Existing Supabase initiatives that will move under this pillar once the architecture is decided:

- [[ai-powered-pm-team]]
- [[pm-workshop-2026]] — completed; keep as artifact.
- [[ai-native-team-structure]] — the AI-native operating model & JDs. Source of truth lives here; the BU AI Transformation pillar consumes it.

## Net-New

- Guild charter / operating model under new leadership.

## Open Questions

- *(Flag, don't resolve)* The relationship between the Guild (community + standards) and the [[ai-academy-product|AI Foundry]] (training program) — keep distinct, define the handoff.

## Working Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — pillar charter, context, and operating rules |
| `memory.md` | Working memory across Claude Code sessions (local only; not synced) |
| `docs/` | Working artifacts as they accumulate (create on demand) |
