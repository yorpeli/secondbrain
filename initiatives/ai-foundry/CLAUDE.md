---
id: pillar-ai-foundry
type: pillar
title: AI Foundry
status: local-staging
owner: yonatan-orpeli
created: 2026-05-29
migration_status: not-in-supabase
rehomes_from:
  - ai-academy-product
---

# AI Foundry — Pillar Workspace

> **⚠️ LOCAL STAGING — NOT IN SUPABASE.** This is a **pillar**: a grain *above* a normal initiative that will eventually hold multiple initiatives. It is intentionally not modeled in the database yet (modeling deferred to a pending architecture session).
>
> **Override of `initiatives/CLAUDE.md`:** The workspace-sync protocol does **not** apply here. There is no `entity_id`, no `initiatives` row, and no `content_sections` rows. Do **not** read/upsert `workspace-context` or `workspace-memory`, do **not** create DB records, and do **not** migrate this folder to Supabase — unless Yonatan explicitly asks. Filesystem only.
>
> Note: the existing AI Academy lives in Supabase as [[ai-academy-product]] (workspace folder `foundry/`). That record is untouched; it re-homes under this pillar only when the architecture is decided.

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
