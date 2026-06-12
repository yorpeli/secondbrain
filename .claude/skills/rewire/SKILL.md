---
name: rewire
description: Use when Yonatan says "rewire this workflow", "run REWIRE on X",
  "redesign X around AI agents", "AI-native workflow redesign", or asks to run
  the workflow-redesign exercise on a process. Runs the six-stage REWIRE method
  (Reveal → Envision → Weave → Integrate → Rehearse → Evolve) as a stage-gated
  conversation — Second-Brain-first — ending in a branded standalone HTML
  artifact and a Supabase record.
---

# REWIRE — AI-Native Workflow Redesign

Redesigns one real workflow around AI agents in six gated stages. You are the
thinking partner; Yonatan makes the calls. Keep every stage output concise and
executive-ready. Do not jump ahead — one stage at a time.

**Method credit:** REWIRE — Prof. Suraj Srinivasan, HBS Executive Education
GenAI Program. The method is encoded here in our own words for internal use;
never reproduce or redistribute the original prompt guide.

**Design spec:** `docs/superpowers/specs/2026-06-12-rewire-skill-design.md`
**Render contract:** `context/rewire-design-guidelines.md`

## Run lifecycle

1. Identify the workflow from Yonatan's request; derive a kebab-case slug
   (e.g. `kyc-manual-review`).
2. Check `output/rewire/{slug}/run.md`:
   - **Exists, incomplete** → resume at the first stage not listed in
     `stages_done`. Re-read the body so prior stage outputs are in context,
     then go straight into that stage — don't re-present completed ones.
   - **Exists, complete** → ask: start fresh (move the old dir contents to
     `output/rewire/{slug}/run-archive-YYYY-MM-DD/`) or revise the existing
     artifact?
   - **Missing** → create it:

   ```markdown
   ---
   workflow: <human title>
   slug: <slug>
   started: YYYY-MM-DD
   initiative: null
   stages_done: []   # values: reveal, envision, weave, integrate, rehearse, evolve
   verdict: null     # null | go | no-go | fix-the-process-first
   ---
   ```

3. Run the stages in order. **Hard gate after every stage:** present the
   deliverable in conversation, wait for Yonatan's reaction, incorporate
   corrections, then append the finalized output to `run.md` under a `##
   <Stage>` heading and add the stage to `stages_done`. Only then advance.
4. If a correction at a later gate invalidates an earlier stage (e.g. Weave
   surfaces a step Reveal missed), update the earlier section in `run.md`
   before proceeding — the run file is the single source of truth for the
   render.
5. After Evolve: render the HTML artifact, then persist to Supabase (both
   below).

## Stage R — Reveal (current-state map)

Goal: map the workflow as it runs today. No redesign yet.

1. **Search the Second Brain first:**
   - Matching initiative + its memory doc (`initiatives` table,
     `content_sections` with `section_type = 'memory'`). Record the match (or
     null) in `run.md` frontmatter `initiative:`.
   - `searchByType(query, ['ppp', 'agent_log', 'initiative_context'])` from
     `lib/embeddings.ts` for signals about the workflow.
   - `v_org_tree` for the people involved; `context_store` key
     `current_focus` if the workflow touches live priorities.
   - Scan `context/**/*.md` frontmatter for topical docs.
   - The `kyc-team-repo` skill when the workflow touches KYC, vendors, EVS,
     or document understanding.
2. **Draft the current-state map with provenance.** Mark every element as
   *found* (cite the source) or *inferred* (flagged as a guess for Yonatan to
   confirm).
3. **Ask up to 4 gap questions** — only what the search couldn't answer:
   actors, systems/data, handoffs, volumes, exceptions. If the workflow has
   no Second Brain footprint, fall back to the pure interview: ask Yonatan to
   describe it (trigger, rough steps, who's involved, where it hurts), then
   the 4 gap questions.
4. **Deliverable:** (a) a per-step map — each step with its owner, the system
   or data used, and its output; (b) the top bottlenecks, failure points,
   delays, and unnecessary handoffs. Executive-friendly, not exhaustive.

## Stage E — Envision (outcomes + go/no-go)

1. Apply the **"So What?" test**: turn the workflow's outputs into 2–3 real
   business outcomes — recovered capacity, reduced risk, faster cycle time —
   not "faster reports".
2. Break each outcome into the **jobs-to-be-done** that must happen
   regardless of how the work is done today.
3. Score on two SEPARATE 1–5 scales: **value** (impact if redesigned) and
   **feasibility** (data readiness, process stability, low
   error-sensitivity).
4. Recommend **go / no-go / fix-the-process-first** with one line of
   reasoning. The call is Yonatan's — record it in `run.md` frontmatter
   `verdict:` (`go` | `no-go` | `fix-the-process-first`). If no-go or
   fix-first: complete the Envision gate bookkeeping as usual (append the
   stage output, update `stages_done`), then offer to stop — that is a
   legitimate, useful exit. (Default: no DB write for aborted runs; if
   Yonatan asks to record one, persist the stages done so far with the
   verdict, same shape as a full run.)

## Stage W — Weave (agent-first redesign)

Redesign from a **blank page** with AI agents as the primary actors — do not
just automate the current steps.

1. New step sequence; label each step **AI-led / human-led / shared /
   escalated**.
2. Use more than one agent where useful and show the handoffs (e.g. intake
   agent → analysis agent → drafting agent).
3. Note the key data and tools each agent needs.
4. Rough **cost-vs-value read**: where effort and running cost concentrate,
   and whether the value still justifies it.
5. Include human review **only** where risk, judgment, relationships,
   compliance, or low AI confidence require it.

## Stage I — Integrate (operating rules + risk + people)

1. **Operating-rules table** — one row per major step or decision: AI role,
   human role, autonomy level, approval/escalation rule, accountable owner,
   main risk if the AI is wrong.
2. **Top 3 risks** across security, compliance/privacy, and bias — one
   mitigation each.
3. **People impact**: which roles change, what reskilling is needed, and one
   thing that would drive adoption.

## Stage R — Rehearse (pressure test + pilot)

1. **Skeptic panel**: as a skeptical COO, CFO, CIO, and General Counsel, give
   the 4 sharpest objections to the redesign, each with a one-line fix.
2. **Minimal pilot**: what to test first; explicit pass/fail success
   criteria; how to run it safely (shadow mode or a small slice of volume);
   a simple migration plan from old workflow to new if it passes.

## Stage E — Evolve (measurement + CEO summary)

1. For each Envision outcome: one **metric** with a baseline approach, a
   target, and a **counterfactual** (how to separate the redesign's impact
   from normal variation).
2. 3–4 **AI-health leading indicators** (e.g. accuracy, override rate,
   escalation rate, adoption).
3. **Review cadence** and the decision it drives: when to expand autonomy,
   retrain, adjust, or stop.
4. A **5-line executive summary** of the whole redesign, CEO-ready.

## Render — standalone HTML artifact

After the Evolve gate, build `output/rewire/{slug}/rewire-{slug}.html`:

- Follow `context/rewire-design-guidelines.md` **exactly** — copy its CSS
  block verbatim, then use its component recipes: stage cards with crimson
  badges and the `R E W I R E` progress tracker, serif body / sans apparatus,
  semantic color code, stat pills, navy-header tables, callouts, score dots
  for the value/feasibility scores.
- One stage card per REWIRE stage, in order, each carrying that stage's
  finalized output from `run.md`.
- The **before** flowchart (Reveal) and **after** flowchart (Weave) use the
  pure-CSS flow components — `fnode` with semantic classes (`ai`, `human`,
  `shared`, `exception`, `system`), `fdiamond` decision gates, `branch` >
  `col` for outcomes, a `legend` row under each chart. **Not Mermaid.**
- Self-contained: one file, no external fonts or libraries, prints cleanly.
- Footer: `Method: REWIRE — Prof. Suraj Srinivasan, HBS Executive Education.
  Internal working document.`
- If any figures are illustrative, add the single italic note *Numbers are
  illustrative.* once.
- Open it: `open output/rewire/{slug}/rewire-{slug}.html`

Quality bar: the hand-made HBS artifact `~/Library/CloudStorage/
OneDrive-Personal/HBS AI Course/workflows exercise/REWIRE - KYC Manual
Review.html`.

## Persist — Supabase record

Confirm with Yonatan before any DB write (human-facing data rule).

- **Initiative matched** (frontmatter `initiative:` is set):
  1. Insert a `content_sections` row: `entity_type = 'initiative'`,
     `entity_id` = the initiative's id (looked up by slug, never hardcoded),
     `section_type = 'rewire-redesign'`, `title` = `REWIRE redesign —
     {workflow}`, `content` = the six finalized stage outputs from `run.md`
     as markdown, `date` = today.
  2. Append to the initiative memory doc's **Timeline of Key Events**:
     `[YYYY-MM-DD] REWIRE redesign produced for {workflow} — see
     rewire-redesign section.` Update the memory doc's `date` field and
     `updated_at = now()` per convention.
- **No initiative matched:** offer two options — create a new initiative
  (initiative row with `status = 'active'` — confirm priority and
  `assigned_agent` with Yonatan — plus a memory doc `content_sections` row
  per the Initiative Memory template in CLAUDE.md; set `initiative:` in
  `run.md` to the new slug, then proceed as above), or skip the DB write
  (HTML artifact only).

## Notes

- `output/` is gitignored — run files and artifacts are local; the DB record
  is the durable copy.
- Namespace rule: this skill writes human-facing tables (`content_sections`)
  only with confirmation; it never touches `agent_tasks`/`agent_log`.
