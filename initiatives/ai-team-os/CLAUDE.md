# AI-Native Team Operating Model

## Initiative Context

- **Initiative slug**: `ai-native-team-structure`
- **Initiative ID**: `72a2dc76-126e-4fee-9ddd-cfa38c22dff9`
- **Status**: Active (P0)
- **Sponsor**: Liat Ashkenazi (exec sponsor)
- **Authors**: Yonatan Orpeli, Tal Arnon (VP Eng)
- **Supabase memory doc**: `content_sections` with `entity_id = '72a2dc76-126e-4fee-9ddd-cfa38c22dff9'`, `section_type = 'memory'`

## What This Is

Designing and standing up the first AI-native product team at Payoneer — from operating model through hiring to a running pod. This is a multi-phase initiative: define the model, hire the people, build the infrastructure, launch the first team, learn, and iterate.

Key question: how should a team be structured from scratch when AI is a first-class capability, not a bolt-on?

## Where We Are (May 2026)

The thesis has evolved from "small team" framing (v1) to "value unit" framing (v2), informed by the Oren Elenbogen (Forter) conversation and the three harness engineering posts (Fowler, Anthropic, OpenAI). The proposal now lives inside AIR²'s experiment portfolio. Recruitment is active. Communication to leadership is in progress: one-pager to Oren Ryngler for AIR² greenlight, PM evolution deck for Orrin (CPO).

### Completed
- **Operating model & opinion piece (v1)** — `docs/ai-native-team-article.md`. The published thesis, team structure, workflow, human contract, enterprise lens. (March 2026)
- **Thesis v2 (value unit framing)** — `docs/thesis-v2-value-unit.md`. Supersedes the size-as-organizing-principle framing. Pod lives inside AIR²; harness is residue from shipping, not prelude; "no human-authored source code" as leading indicator. (April 2026)
- **One-pager for Oren Ryngler** — `docs/one-pager-oren-greenlight.md`. AIR² greenlight ask: one platform engineer seconded for 4–6 weeks. (April 2026)
- **PM Evolution piece for Orrin (CPO)** — `decks/pm-evolution.pptx` and `docs/pm-evolution.md`. Applies Manual → Augmented → AI-Native to the PM role; built for board-grade reading. (May 2026)
- **Research corpus** — Three rounds: landscape synthesis; GPT/Perplexity deep research on AI-native teams; deep research on small teams (HR, org psych, wellbeing).
- **Hiring process design** — Product and engineering tracks (2-day structure, AI-specific assessment, curated panels).
- **External input** — Wix (Yuval Nissan), Cellebrite (via Mor), Forter (Nir Mayyan, Oren Elenbogen) conversations logged.

### In Progress
- **Recruitment** — iTalent active on Principal PM + Director role. First candidate (Denis) declined April 2026; pipeline continues, no named successor yet. Engineering: Tomer Zosman building AI Wizard assessment.
- **AIR² greenlight** — One-pager with Oren Ryngler; pending platform engineer secondment decision.
- **Leadership communication** — PM evolution deck en route to Orrin (CPO); may forward to board.
- **External conversations** — Ongoing (Wix, Cellebrite, Forter × 2) shaping transition approach and hiring philosophy.

### Next
- **Stand up first pod inside AIR²** — 90-day experiment. First experiment: internal idea-collection system (solves an open AIR² thread, de-risks the operating model). Experiment 2 candidate: internal tooling for the 350-person manual review team.
- **Engineer role definition** — Two product engineers (not a harness engineer). Pending Tomer + Tal input.
- **Transition playbook** — Day-to-day pod operations: infrastructure prerequisites, evaluator architecture, blast-radius calibration.

## Stakeholders

- **Liat Ashkenazi** — Exec sponsor, eng guild lead
- **Tal Arnon** — VP Engineering, co-developing the framework
- **Yonatan Orpeli** — Primary author, drives greenlight
- **Tomer Zosman** — VP R&D, building AI assessment for engineering hiring
- **Mor Regev Lalush** — Product guild, owns hiring playbook documentation
- **Noa Lichtig** — Talent/recruitment
- **Ilona** — Platform org, pre-built comp package for engineering
- **Orrin** — CPO, audience for PM evolution deck (May 2026)
- **Oren Ryngler** — Recipient of AIR² greenlight one-pager; original initiative sponsor
- **Gaurav** — AIR² sponsor (host context for the first pod)

## Working Files

### Core Artifacts
| File | What it is | Status |
|------|-----------|--------|
| `docs/ai-native-team-article.md` | The opinion piece (v1) — operating model, team structure, human contract | Complete (point-in-time, March 2026) |
| `docs/thesis-v2-value-unit.md` | Current thesis — value unit framing, AIR² as home, harness as residue, first-team proposal | Current (April 2026) |
| `docs/one-pager-oren-greenlight.md` | AIR² greenlight ask to Oren Ryngler — 90-day plan, one platform engineer secondment | Active (April 2026) |
| `docs/pm-evolution.md` | Two-slide PM evolution synthesis (Manual → Augmented → AI-Native) — companion to AIR² jump deck, built for Orrin/board (May 2026) | Complete |
| `docs/ai-native-team-operating-model-v1.md` | Original framework doc v1 (superseded by article) | Archive |

### Decks
| File | What it is | Status |
|------|-----------|--------|
| `decks/pm-evolution.pptx` | PowerPoint for Orrin (CPO). Editable. Siblings: `.html` source, `.pdf` export | Complete (May 2026) |

### Research
| File | What it is |
|------|-----------|
| `docs/research-landscape-2026-03.md` | 13+ sources on AI-native teams |
| `docs/research_gpt.md` | GPT synthesis — Mercury, Anthropic, Vercel, Affirm examples |
| `docs/research_preplexity.md` | 61-footnote deep research with LinkedIn, Andrew Ng data |
| `docs/research-small-teams-deep-dive.md` | Deep research on small teams from HR, org psych, employee wellbeing (not AI-specific) |
| `docs/research-vs-article-gap-analysis.md` | 13 open areas from research — inputs for transition playbook and role definitions |
| `docs/reading-list.md` | 12+ articles and references with summaries and relevance notes |

### Meetings & External Input
| File | What it is |
|------|-----------|
| `meetings/2026-03-11-yuval-nissan-wix.md` | Wix input on team structure |
| `meetings/2026-03-18-cellebrite-input-via-mor.md` | Cellebrite input via Mor Regev |
| `meetings/2026-03-18-italent-recruitment-kickoff.md` | iTalent recruitment kickoff |
| `meetings/2026-03-25-nir-mayyan-forter.md` | Forter input — "Productize the process," PM-as-coder |
| `meetings/2026-03-26-hiring-process-product-guild.md` | Product guild hiring process design |
| `meetings/2026-03-26-hiring-process-engineering-guild.md` | Engineering guild hiring process design |
| `meetings/2026-04-15-oren-elenbogen-forter.md` | Forter SVP Eng — self-developed/self-guided products, value unit, hiring philosophy, harness engineering |

### Other
| File | What it is |
|------|-----------|
| `docs/ai-native-team-article_v1.md` | Earlier article draft (archive) |
| `docs/week3-workstream-snapshot.md` | Week 3 status snapshot |
