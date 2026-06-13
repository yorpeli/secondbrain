# Initiative knowledge → Supabase-canonical, local folders for artifacts

- **Date:** 2026-06-13
- **Status:** Active decision
- **Refines:** `project_decisions` — "Initiative-centric architecture with embedded agents" (2026-04-02, `dff89d96`). The workspace folder pattern and embedded PM agents stand; this revises two clauses of it: (a) `memory.md` "synced to DB" and (b) external discovery via `initiative_context` embeddings.

## Context — why revisit

The workspace model keeps **two canonical copies of the same knowledge**: local `memory.md` / `CLAUDE.md` and the `workspace-memory` / `workspace-context` rows in `content_sections`, reconciled by a best-effort bidirectional sync. The sync only fires when **Claude Code edits in-session** — Claude.ai edits, manual edits, and git operations all bypass it.

A 2026-06-13 audit found the predictable result:

- **5 of 9 synced workspaces had drifted** between local and DB.
- At least one Claude.ai edit was **lossy** — the `foundry`/`ai-academy` append-only decision log was silently compressed 17 → 9 entries.
- The discovery payoff the model was supposed to deliver — local `context.md`/`docs/*` embedded as `initiative_context` so other agents can find them — **was never built: 0 rows.** We paid the sync cost without collecting the retrieval benefit.

Meanwhile the curated `memory` doc embedding path (`initiative_memory`, consumed via `searchByType`) **works today** and is the actual retrieval surface agents use for decisions.

The decisive constraint: **Claude.ai (the Brain) cannot read local files at all.** Any knowledge meant to inform conversational decision-making *must* live in Supabase regardless. So the DB is a non-negotiable home; the local copy is the optional one — and it's the one creating drift.

## Decision

One canonical home **per type of content**, not per initiative:

| Content type | Canonical home | Embedded? | Notes |
|---|---|---|---|
| **Knowledge** — the curated initiative memory doc | **Supabase** `content_sections` (`section_type = 'memory'`) | Yes (`initiative_memory`) | Single source of truth. Read by both Claude.ai and Claude Code. Writable from either. |
| **Working artifacts** — drafts, research, slides, meeting notes | **Local** `initiatives/{slug}/docs/` | No (raw) | Where git history + editing-in-place earn their keep. Stays out of DB rows. |
| **Folder index** — `CLAUDE.md` | Local (thin pointer file) | No | Identity, IDs, working-files index. Navigation aid, not knowledge. Not synced. |

**Bridge principle (make the existing "separate artifacts" rule the default):** when a local doc produces *durable* knowledge, distill it into the embedded memory doc. Raw docs stay local as provenance. No parallel embedding pipeline for raw working files.

**Source-of-truth direction (chose Option B):** Supabase is the **writable** canonical for knowledge. Rationale: Claude.ai is the Brain (meeting prep, decision support, synthesis) and actively updates knowledge; it can only reach the DB. The alternative (Option C — local canonical, one-way push to DB, Claude.ai read-only on knowledge) also kills drift but blocks conversational knowledge updates, which is too restrictive for how the system is actually used.

## What changes

1. **Retire the bidirectional memory sync.** Stop treating local `memory.md` as a canonical second copy. The `workspace-memory` row is the source of truth; `memory.md`, if present, is a read-only convenience mirror (pull-only), not a write-back target.
2. **Demote `CLAUDE.md` to a thin local index.** Keep it as the folder's README (IDs, stakeholders pointer, working-files index). Stop syncing `workspace-context`; let the DB initiative record + memory doc hold the substantive context.
3. **`docs/` stays local.** No change — artifacts live where editing and git history are best.
4. **Folder is now optional, not default.** Most initiatives are fine DB-only (memory doc + no folder). Create a local folder **only** when there's genuine local material to work on (today: `clm-war-room`, `foundry`). Even then, the folder holds `docs/`, not a duplicated knowledge file.
5. **Update `initiatives/CLAUDE.md`** — remove the "Workspace Sync (Claude Code ↔ Claude AI)" bidirectional protocol; replace with the pull-only convenience-mirror note and the bridge principle. Update the root `CLAUDE.md` "Initiative Workspaces" / "Workspace Sync" sections to match.

## Open sub-decision — the `initiative_context` discovery gap

`initiative_context` embeddings are at 0. Two ways to close it:

- **(A, recommended) Fold-into-memory.** Don't build a separate pipeline for raw docs. Durable insights from local docs get distilled into the memory doc, which is already chunked + embedded + consumed. One retrieval surface, curated.
- **(B) Build the pipeline.** Add an `embed:initiative-context` mode that chunks local `context.md`/`docs/*` and embeds them. More retrieval coverage, but re-introduces "local files as a knowledge source" — the thing that just drifted — and embeds raw, uncurated material.

Recommendation: **A.** Keep the memory doc as the single curated, embedded knowledge layer; raw docs stay local provenance. Retire the `initiative_context` entity type (or leave dormant) rather than backfill it.

## Consequences

**Gain:** no duplicated canonical knowledge → no drift; Claude.ai parity (it can reach all knowledge); one embedded, decision-ready knowledge surface; one place to back up; folders only where they pull their weight.

**Lose / mitigate:** git diff/blame on the memory doc goes away → mitigate with periodic DB→markdown exports if a history snapshot is ever wanted. Claude Code can't `Read memory.md` for free → it queries the DB (already has access; cheap) or reads the pull-only mirror.

## Rollout

1. Land this decision (`project_decisions`) + this note.
2. Edit `initiatives/CLAUDE.md` and root `CLAUDE.md` to remove the bidirectional sync protocol and document the new model.
3. (Optional) Add a `npm run` pull-only refresh that writes DB memory docs → local `memory.md` mirrors for the folders that keep one.
4. Decide the `initiative_context` sub-question (recommend: retire/dormant).
5. Post a `context-share` to `agent_coordination` so Claude.ai adopts the same model.
