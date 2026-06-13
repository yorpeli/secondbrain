---
id: pillar-ai-foundry
type: pillar
title: AI Foundry
status: active
owner: yonatan-orpeli
created: 2026-05-29
migration_status: in-supabase
entity_id: 8c9889b1-e14e-4fa0-b810-9505a00f8b88
rehomes_from:
  - ai-academy-product
---

# AI Foundry — Pillar Workspace

> **Pillar — modeled in Supabase (2026-06-13).** This is a **pillar**: a grain *above* a normal initiative that holds multiple initiatives (`initiatives.kind = 'pillar'`; children linked via `parent_id`). Initiative ID: `8c9889b1-e14e-4fa0-b810-9505a00f8b88`.
>
> Per the DB-canonical model (`docs/superpowers/specs/2026-06-13-initiative-knowledge-db-canonical.md`): the **canonical knowledge is the Supabase memory doc** (`content_sections`, `section_type = 'memory'`). This folder holds working artifacts; this `CLAUDE.md` is a thin index; `memory.md` is a **pull-only mirror** — write knowledge to the DB memory doc (and re-embed), not back through the files.
>
> Note: the existing AI Academy ([[ai-academy-product]], workspace folder `foundry/`) is now a **child** of this pillar, linked via `parent_id`.

## Objective

Run Payoneer's internal AI academy — a structured curriculum that builds AI fluency.

## Why It Matters

It's the capability-building engine behind the transformation.

## Current State

Already exists as the AI Academy, currently scoped to the CLM product org. **Re-scope company-wide.**

## Scope

- Structured AI-fluency curriculum
- Cohort delivery
- (Re-scope) company-wide audience beyond CLM product

## Re-homes From

Existing Supabase initiatives that will move under this pillar once the architecture is decided:

- [[ai-academy-product]]

## Net-New

- Company-wide cohort model.

## Open Questions

- *(Flag, don't resolve)* Audience — PMs only, or all BU roles? If the latter, this couples tightly to the [[dlc-ai-era|BU AI Transformation]] pillar.

## Working Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — pillar charter, context, and operating rules |
| `memory.md` | Working memory across Claude Code sessions (local only; not synced) |
| `docs/` | Working artifacts as they accumulate (create on demand) |
