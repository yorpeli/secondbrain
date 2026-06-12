# REWIRE Skill — AI-Native Workflow Redesign

**Date:** 2026-06-12
**Status:** Approved design
**Method credit:** REWIRE, Prof. Suraj Srinivasan, HBS Executive Education GenAI Program. The method is encoded here in our own words for Yonatan's internal use — the original prompt guide is not reproduced or redistributed.

## Purpose

A reusable skill that runs the REWIRE method — a six-stage exercise that redesigns a workflow around AI agents — as a live, stage-gated conversation with Yonatan. The HBS original assumes the participant types in the workflow cold; this version is Second-Brain-first: Claude pre-fills the current state from initiatives, PPP signals, people data, and context docs, and interviews Yonatan only on the gaps. Every completed run produces a REWIRE-branded standalone HTML artifact and a DB record.

The reference artifact for output quality is `~/Library/CloudStorage/OneDrive-Personal/HBS AI Course/workflows exercise/REWIRE - KYC Manual Review.html` (produced by hand at HBS); the extracted design system is `context/rewire-design-guidelines.md`.

## Decisions made

| Decision | Choice |
|---|---|
| Reveal data gathering | Second-Brain-first, Yonatan confirms/corrects; pure interview fallback for workflows with no DB footprint |
| Pacing | Hard stage gates — present each stage's output, wait for reaction, only then advance |
| Output | Branded standalone HTML (per design guidelines) + Supabase record |
| Structure | Pure skill (`SKILL.md` procedure), no render script, no agent/task-board machinery |
| Flowcharts | Pure-CSS flow components from the design guidelines, not Mermaid |
| Attribution | In skill frontmatter notes and in every rendered artifact's footer |

## Components

### 1. Skill file — `.claude/skills/rewire/SKILL.md`

- **name:** `rewire`
- **description (trigger):** Use when Yonatan says "rewire this workflow", "run REWIRE on X", "redesign X around AI agents", "AI-native workflow redesign", or asks to run the workflow-redesign exercise.
- Encodes the run lifecycle, the six stage procedures, render instructions, and persistence rules described below.

### 2. Run working file — `output/rewire/{workflow-slug}/run.md`

Created at the start of a run. Frontmatter:

```yaml
---
workflow: <human title>
slug: <workflow-slug>
started: YYYY-MM-DD
initiative: <matching initiative slug or null>
stages_done: [reveal, envision]   # grows as stages complete
verdict: null | go | no-go | fix-process-first
---
```

Body accumulates each stage's finalized output under `## Reveal`, `## Envision`, etc. On invocation the skill checks for an existing run file for the named workflow and resumes from the first incomplete stage. `output/` is gitignored — runs are local working state; the durable record is the DB write at the end.

### 3. The six stages

Each stage ends with a hard gate: present the deliverable in conversation, wait for Yonatan's reaction, incorporate corrections, write the finalized output to `run.md`, then advance.

**R — Reveal** (current-state map)
1. Search the Second Brain: matching initiative + memory doc, `searchByType()` over `ppp` / `agent_log` / `initiative_context`, `v_org_tree` for the people involved, `context/**/*.md` frontmatter scan, KYC team repo skill when the workflow touches KYC/vendor territory.
2. Draft the current-state map with provenance — explicitly separate *found* (with source) from *inferred* (guess, flagged).
3. Ask up to 4 gap questions covering only what the DB couldn't answer (actors, systems/data, handoffs, volumes, exceptions).
4. Deliverable: per-step map (owner, system/data used, output) + top bottlenecks, failure points, delays, unnecessary handoffs. No redesign yet.
5. Fallback: if the workflow has no DB footprint, run as pure interview — describe-then-4-questions.

**E — Envision** (target outcomes + go/no-go)
1. Apply the "So What?" test: 2–3 real business outcomes (recovered capacity, reduced risk, faster cycle time — not "faster reports").
2. Break each outcome into jobs-to-be-done that must happen regardless of how the work is done today.
3. Score on two separate 1–5 scales: **value** (impact if redesigned) and **feasibility** (data readiness, process stability, error-sensitivity).
4. Recommend go / no-go / fix-the-process-first with one line of reasoning. **The call is Yonatan's.** A no-go or fix-first verdict is a legitimate exit: record it in `run.md` frontmatter, offer to stop there.

**W — Weave** (agent-first redesign)
1. Redesign from a blank page with AI agents as primary actors — explicitly not "automate the current steps."
2. Label each step AI-led / human-led / shared / escalated.
3. Use multiple agents where useful and show handoffs (intake → analysis → drafting pattern).
4. Note key data and tools each agent needs.
5. Rough cost-vs-value read: where effort and running cost concentrate, whether value still justifies.
6. Human review only where risk, judgment, relationships, compliance, or low AI confidence require it.

**I — Integrate** (operating rules + risk + people)
1. Operating-rules table — per major step/decision: AI role, human role, autonomy level, approval/escalation rule, accountable owner, main risk if the AI is wrong.
2. Top 3 risks across security, compliance/privacy, bias — one mitigation each.
3. People impact: which roles change, what reskilling is needed, one thing that would drive adoption.

**R — Rehearse** (pressure test + pilot)
1. Skeptic panel — COO, CFO, CIO, General Counsel: the 4 sharpest objections, each with a one-line fix.
2. Minimal pilot: what to test first, explicit pass/fail criteria, safe-run mode (shadow mode or volume slice), migration plan from old to new if it passes.

**E — Evolve** (measurement + CEO summary)
1. Per Envision outcome: one metric with baseline approach, target, and counterfactual (separating redesign impact from normal variation).
2. 3–4 AI-health leading indicators (accuracy, override rate, escalation rate, adoption).
3. Review cadence and the decision it drives: expand autonomy, retrain, adjust, or stop.
4. 5-line executive summary of the whole redesign, CEO-ready.

### 4. Render — standalone HTML artifact

After Evolve is gated, build `output/rewire/{slug}/rewire-{slug}.html`:

- Follow `context/rewire-design-guidelines.md` exactly: stage cards with crimson badges and the R E W I R E tracker, serif body / sans apparatus, semantic color code, stat pills, navy-header tables, callouts, score dots.
- **Before** flowchart (from Reveal) and **after** flowchart (from Weave) use the pure-CSS flow components — `fnode` classes by actor type, `fdiamond` decision gates, `branch`/`col` for outcomes, legend row at the bottom of each.
- Self-contained: one file, no external fonts or libraries, prints cleanly.
- Footer attribution: "Method: REWIRE — Prof. Suraj Srinivasan, HBS Executive Education. Internal working document."
- Open in the browser when done (`open <path>`).

The KYC Manual Review HTML is the quality bar; the design-guidelines doc is the contract.

### 5. Persist — Supabase record

Confirm with Yonatan before writing (human-facing data rule):

- **Initiative matched** (set during Reveal): insert a `content_sections` row — `entity_type = 'initiative'`, `entity_id` = initiative id, `section_type = 'rewire-redesign'`, `title` = "REWIRE redesign — {workflow}", `content` = the full structured redesign (the six stage outputs as markdown). Then append one line to the initiative memory doc's **Timeline of Key Events**: `[YYYY-MM-DD] REWIRE redesign produced for {workflow} — see rewire-redesign section.` Update memory doc `date`/`updated_at` per convention.
- **No initiative matched:** offer two options — create a new initiative (then proceed as above) or skip the DB write entirely (HTML artifact only).
- A run that exits at Envision with no-go/fix-first can still be recorded on request (the scored verdict is useful organizational memory), but the default is no DB write for aborted runs.

## Edge cases

- **Resume:** invocation with a workflow that has an existing `run.md` resumes at the first incomplete stage; re-running a completed workflow asks whether to start fresh (archive old run dir to `run-archive-YYYY-MM-DD/`) or revise the existing artifact.
- **Cold workflow:** no Second Brain footprint → pure interview Reveal; persistence will hit the "no initiative matched" path.
- **Mid-run drift:** if Yonatan's corrections at a gate invalidate earlier stages (e.g., Weave reveals the Reveal map missed a step), update the earlier section in `run.md` before proceeding — the run file is the single source of truth for the render.

## Out of scope

- No TypeScript renderer, CLI, or npm script — the skill is procedure-only.
- No agent_tasks integration — REWIRE is a live conversation, not async agent work.
- No automatic embedding of the redesign (can be picked up later by `npm run embed:all` conventions if a `rewire-redesign` entity type is ever added — not part of this build).
- The original HBS PDF is not copied into the repo.

## Validation

First real run is the test. Benchmark: re-run the KYC manual review workflow and compare conversation quality + artifact against the hand-made HBS version.
