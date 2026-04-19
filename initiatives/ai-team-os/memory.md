# AI Team OS — Working Memory

## Guiding Principle (from Yonatan — non-negotiable)

**This must end as a pragmatic, actionable output.** Not a manifesto, not a deck to forget about. The final deliverable should honestly say: here's where we are, here's the team we think we need, here's what it takes to get there. It might conclude that the first investment is infrastructure and readiness — not restructuring.

## Initiative Phases

1. **Define the model** — thesis, team structure, workflow, human contract, enterprise lens → **Done** (article published March 2026)
2. **Design hiring process** — product + engineering tracks → **Done** (March 2026)
3. **Hire the team** — Principal PM, engineers → **In progress** (iTalent active; first candidate declined April 2026, pipeline continues)
4. **Transition playbook** — infrastructure prerequisites, domain selection, onboarding, success criteria → **Next**
5. **Stand up first pod** — real team, real problem, real autonomy → **Planned**
6. **Learn and iterate** — what works, what breaks, course-correct → **Planned**

## The Thesis (Settled, March 2026)

- **AI shrinks the distance between people.** When distance shrinks, teams get smaller, faster, and closer. "Smaller" isn't the point — "closer" is.
- The artifacts that existed to bridge distance (PRDs, handoff docs, detailed tickets, approval flows) become unnecessary.
- **"Handoff artifact → Context as living infrastructure"** is the organizing principle.

### The Pod: Composition
- **Core pod**: 1 PM + 2 Engineers
- **Shared functions**: Design, DevOps, Data Infrastructure, Security/Compliance
- Data role shifts: PM handles analytical work directly with AI. Data person becomes infrastructure/integrity/quality. Same pattern as Design and DevOps: craft application absorbed into pod, deep expertise sits in shared teams.

### The Workflow
```
Continuous Discovery (PM-led, ongoing, not a phase)
    ↓ feeds into
Problem Frame (what, for whom, why now, constraints)
    ↓
Co-Solve (PM + Engineer together, AI does the building)
    ↓
Harden (Engineer-led: architecture, reliability, edge cases, compliance)
    ↓
Ship + Measure (team together)
    ↓ feeds back into
Continuous Discovery
```

### The Human Contract (Core Pillar — Our Differentiator)
This is the thing nobody else is writing about. Keep it prominent, not an afterthought.
- **Psychological safety at micro-scale** — one bad relationship in 3 people is fatal. Hiring for chemistry is structural.
- **Loneliness is a design problem** — small teams are isolating. Organization must provide community beyond the pod.
- **Fragility and knowledge loss** — losing 1 of 3 = losing 33% of capability AND context. Documentation is survival, not overhead.
- **Shared ownership without territorial ambiguity** — "not my job" is fatal, but roles still exist.
- **Growth beyond the pod** — career can't come only from within. Cross-pod movement, guild leadership, mentorship, scope expansion.

### Team Variants — Flex Points, Not Taxonomy
Four dimensions that flex:
1. **Who is the customer?** (External user vs. internal engineer vs. operations)
2. **What is the blast radius ceiling?** (Consumer feature vs. compliance-critical flow)
3. **What kind of engineering dominates?** (Product/full-stack vs. ML/data vs. infra/platform)
4. **How much domain expertise is required?** (Generic product vs. deep regulatory/financial)

### Two Organizational Requirements
1. **Documenting Organization** — document for humans AND agents. Knowledge loss in 3-person teams is catastrophic.
2. **Learning Organization / Cross-Pollination** — innovation in small pods diverges fast. Need team-level sharing.

## Resolved Tensions (March 2026)

Tensions identified when testing the article against all research. These are deliberate choices, not oversights.

- **Team size of 3 vs. research consensus of 4-5** → 3 is the vanilla default. Flex points handle teams that need a 4th.
- **Design as fully shared vs. partially embedded** → Depends on the team and problem. Designers own the system centrally, teams consume it.
- **No QA role** → Absorbed into engineer role and platform. Part of Harden phase.
- **Skepticism about AI productivity** → Forward bet. Pragmatic approach (first pod as experiment) is the answer.
- **"Augment first, restructure later" consensus** → Doc describes end state. "What Comes Next" is the bridge.
- **PM ratio** → What we're seeing now. Can change. Not cast in stone.
- **Frankenstein AI stacks risk** → Covered by tooling standardization + learning organization.
- **Trust paradox in AI-generated code** → Harden phase is the structural answer.
- **"Intent Architect" as PM title** → Dropped. Description does the work.
- **Waterfall → Agile → AI evolution** → Added to "The Shift" section.
- **"Co-Prototype" → "Co-Solve"** → Better captures joint problem-solving.
- **"Fintech Lens" → "Enterprise Lens"** → Broadened for relevance beyond Payoneer.
- **Hiring process adaptation** → Added to "What Happens Next."

## Research Corpus

### Round 1: AI-native teams landscape (March 2026)
- `docs/research-landscape-2026-03.md` — 13+ sources. Consensus: 3-5 person pods, builder archetype, prototype-first, documentation as infrastructure.
- `docs/research_gpt.md` — Mercury, Anthropic, Vercel, Affirm examples.
- `docs/research_preplexity.md` — 61-footnote deep research. LinkedIn FSB, Andrew Ng ratio data, Stack Overflow stats.
- `docs/reading-list.md` — 9 articles with summaries and relevance.

### Round 2: Small teams — HR, org psych, employee wellbeing (April 2026)
- `docs/research-small-teams-deep-dive.md` — Deep research NOT specific to AI-native teams. Covers what decades of organizational science already know about micro-teams (3-5 people). Three lenses: org psychology (Hackman, Simmel, Steiner, Edmondson, Woolley), HR/management practice (military fire teams, Basecamp, Buurtzorg, Zappos, hiring, career pathing), employee wellbeing (isolation, burnout, presenteeism, cognitive load, identity).
- `docs/research-vs-article-gap-analysis.md` — 13 gaps mapped against the article. Top blind spots: coalition dynamics, role overload, autonomy paradox, AI brain fry, Dunbar deficit, presenteeism.

## Open Items

- **Cognitive strain / "AI brain fry"** — BCG study (March 2026, n=1,488): 14% acute cognitive fatigue, 3-tool sweet spot, 39% more errors beyond it. Engineer-as-reviewer is exactly the high-oversight pattern flagged as most taxing. Ju & Aral (2025): AI collaboration suppresses interpersonal communication. Both documented in research-small-teams-deep-dive.md.
- **Coalition dynamics in triads** — Simmel's structural instability, Caplow's coalition theory. Input for transition playbook (team formation, hiring for chemistry). Documented in gap analysis.
- **Role overload replacing social loafing** — Kohler effect + overload paradox. Input for role definitions and pod operating norms. Documented in gap analysis.
- **Autonomy paradox** — Blast radius governs boundaries but not capacity. Input for first pod domain scoping. Documented in gap analysis.
- **Cross-pollination mechanism** — what's the actual ritual? Who owns it?
- **Engineer role detail** — pending Tomer + Tal input
- **Transition playbook** — next major deliverable
- **Director role relationship to pod model** — out of scope for now
- **Recommendation to Liat** — framed as "here's what we think, next step is standing up the first team"
- **First pod domain** — being scoped (bounded problem space, real autonomy, real users)
- **Mercado Libre deep dive** — Agent Harness + Spec-Driven Development (SDD). Validates our model, fills in infrastructure/methodology layer. Key input for: transition playbook, engineer role definition, what co-solve output should look like. Two X threads saved in reading list.
- **Execution interview redesign** — needs to test AI-specific capability, not standard PM execution. Open: what does the exercise look like?
- **Dedicated AI Wizard assessment** — Tomer building; details TBD
- **Unified hiring summary doc** — Yonatan to share combined process with timelines and responsibilities

## Recruitment Status

- iTalent agency active on: Principal PM (IC) + Director role
- PM JD from framework doc shared with them
- **Hiring process designed (2026-03-26):** 2-day structure with gap day. Day 1: Sense + Execution. Day 2: Leadership + VP panel → offer same day if passes. Curated interviewer panel. Execution interview being rethought for AI-specific capability. $100 AI tool budget for candidates.
- Mor Regev Lalush owns playbook documentation ("Red Carpet" / "Wizard" track)
- First candidate (Denis) declined the offer April 2026, joining elsewhere. iTalent pipeline continues; no named successor yet.
- **Engineering hiring process designed (2026-03-26):** Accelerated multi-stage. Tomer Zosman building dedicated AI Wizard assessment. Ilona preparing pre-built comp package for instant offers. Start with 1 hire, evaluate, then expand.
- Key people: Liat Ashkenazi (eng guild lead + exec sponsor), Tomer Zosman (VP R&D), Ilona (comp/Platform org), Mor Regev Lalush (product guild), Noa Lichtig (talent)

## Session Log

### 2026-03-11 — Setup & First Input
- Created initiative workspace, meetings/ folder, docs/ folder
- Logged Yuval Nissan (Wix) meeting notes
- Converted and saved framework doc v1 from docx
- Assessed initiative at ~40% complete
- Yonatan clarified: pragmatic output > aspirational framework

### 2026-03-20 — Research Sprint + Brainstorm + Article Complete
- Completed online research sprint — 13+ sources across our search, GPT, and Perplexity
- Deep brainstorm session — all major thesis and structural decisions made
- Article drafted, iterated, reviewed against all research (12 tensions identified and resolved)
- Key evolutions: Co-Prototype → Co-Solve, Intent Architect dropped, Fintech → Enterprise Lens
- Article finalized in MD and converted to doc format
- CLAUDE.md updated: sponsor changed from Oren Ryngler to Liat Ashkenazi

### 2026-03-26 — Hiring Process Design
- Product guild meeting (Mor Regev Lalush + Noa Lichtig): 2-day interview structure, execution interview rethink, $100 AI tool budget, curated panel
- Engineering guild meeting (Liat Ashkenazi + Tomer Zosman): accelerated multi-stage, dedicated AI assessment, pre-built comp package, start with 1
- Both tracks documented and aligned

### 2026-04-03 — Deep Research: Small Teams (HR, Org Psych, Wellbeing)
- Ran three parallel research agents covering org psychology, HR/management practice, and employee mental health
- Produced comprehensive research document (research-small-teams-deep-dive.md) and gap analysis (research-vs-article-gap-analysis.md)
- Key findings: triad instability is structural (Simmel), role overload replaces social loafing, autonomy paradox, AI brain fry, belonging below Dunbar's threshold, presenteeism/guilt cycle
- Fixed CLAUDE.md and memory.md — were anchoring on article as the initiative's center; reframed to reflect broader multi-phase initiative

### 2026-04-15 — Oren Elenbogen (Forter) Meeting + Harness Engineering
- Logged meeting with Oren Elenbogen (SVP Engineering, Forter) — self-developed → self-guided products → self-guided teams evolution model
- Key new concepts: value unit > team size, documentation-as-infrastructure, hiring for philosophical alignment, builders vs. sellers autonomy
- Tracked down three harness engineering references he cited (Martin Fowler, Anthropic, OpenAI) — verified URLs, added to reading list
- Cleaned up residual article-centric framing in CLAUDE.md and memory.md

## User Preferences
- Wants to be kept honest — flag when things are hand-wavy or missing
- Final output must be grounded in current reality, not clean-sheet
- Don't over-index on PRD argument — it's an example of distance, not the point
- Human aspect is a core differentiator — keep it prominent
- Write as strong opinion, not hedged framework
- The article is one milestone, not the initiative — don't anchor on it as the central artifact
- Iterate in MD, convert to doc when ready
