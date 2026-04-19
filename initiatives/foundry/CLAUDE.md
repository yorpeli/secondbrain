# The Foundry — AI Academy & Community

## Initiative Context

- **Initiative slug**: `ai-academy-product`
- **Initiative ID**: `eb1823ee-4cc8-4918-ae0b-ba99bf76e551`
- **Status**: Active (P0)
- **Owner**: Yonatan Orpeli
- **Supabase memory doc ID**: `c79cc8eb-31ba-4f4a-bb8b-7a4327317ed0`

## What This Is

The Foundry is Payoneer's company-wide AI enablement program, led by Yonatan. It has two main pillars:

### 1. Academy — Cohort-Based Deep Training

Intensive, cohort-based tracks for selected participants. Currently two tracks, expanding to more roles over time:

- **Product track** — Yonatan owns. 14 sessions across Makers L1-L3 and Builders L1. 9 session leads assigned, 5 TBD.
- **Engineering track** — Tal Arnon owns. 23 sessions across M1-M3 and B1. Separate faculty/session leads.

Three-tier progression (shared across all Academy tracks):
- **Makers** (~5 weeks) — Personal AI productivity, ending with a working personal agent
- **Builders** (starts with L1, ~2 weeks) — Team-level AI solutions, ending with a production-ready spec
- **Masters** (not yet designed) — AI architecture, platform services, organizational design

**Joint elements:** Shared ceremonies (kickoff, graduation, demo days). Joint sessions where topics overlap (Session 3 confirmed). Cohort size: 10–20 per track.

**Alumni expectation:** Academy graduates are expected to give back to the broader org — contributing content, mentoring, or leading Community activities.

### 2. Community — AI for Everyone

Broad-access pillar ensuring the entire company benefits from AI enablement, not just Academy cohorts. Led by **Itai Haetzni**.

Two functions:
- **Content management & accessibility** — Curates and publishes Academy-derived content (recordings, materials, guides) for broad consumption, plus produces its own distinct content for the wider org.
- **"AI for All" track** — Live sessions, events, and other formats (details TBD) designed to raise the AI baseline across all of Payoneer. Ensures no one is left behind while a select few go deep in the Academy.

The Academy and Community are parallel tracks with separate audiences, but they reinforce each other — Academy produces depth, Community spreads breadth.

## Your Role

Help Yonatan lead and manage the entire Foundry — both Academy and Community pillars. Specifically:

**Academy:**
- Develop lesson plans, exercises, hands-on activities, assessments
- Review and improve materials from session leads
- Generate supporting materials (slides content, exercise briefs, assessment rubrics)
- Track what's built, in progress, and missing

**Community:**
- Help shape the "AI for All" format, content strategy, and event planning
- Support content curation from Academy materials for broader distribution
- Track Community workstream progress

**Cross-cutting:**
- Program-level planning, tracking, and coordination across both pillars
- Stakeholder materials, communications, and reporting
- Strategic thinking on how Academy and Community reinforce each other

## Key Principles

**Program-wide:**
- **No one left behind**: The Academy goes deep, but the Community ensures the whole company moves forward
- **Enterprise context**: Data sensitivity, compliance, what you can/can't put into AI tools at Payoneer

**Academy-specific:**
- **Role-specific, not generic AI**: Every example and exercise framed through the participant's actual work
- **Hands-on first**: Theory supports practice. Participants should be doing, not listening
- **Measured outcomes**: Each level has clear assessments. Content builds toward them
- **Progressive depth**: L1 concepts deepen in L2, feed into L3. Don't repeat — build
- **Real work, not homework**: Exercises use actual workflows, real data, actual tools

## Session Development Workflow

When developing content for a session:
1. Load session details from `docs/syllabus.md`
2. Reference `docs/session-template.md` for structure
3. Consider what comes before and after — content should build naturally
4. Include hands-on exercises using real PM scenarios
5. Every session produces at least one tangible artifact the PM keeps
6. Save session plans to `docs/sessions/session-{N}-{short-name}.md`

When reviewing content from session leads:
- Check alignment with session topics and learning outcomes
- Verify difficulty matches the tier (L1 accessible, L2 intermediate, L3 advanced, Builders expert)
- Ensure exercises are practical and PM-specific
- Flag gaps where content doesn't connect to adjacent sessions

## Local Files

| File | Purpose |
|------|---------|
| `docs/syllabus.md` | Full program architecture and session breakdown |
| `docs/session-template.md` | Standard structure for session plans |
| `docs/content-tracker.md` | Development status of all sessions and materials |
| `../../context/brand-guidelines.md` | Payoneer brand colors, typography, visual language (shared project-wide) |
| `docs/sessions/` | Individual session plans as developed |

## Stakeholders

- **Yonatan Orpeli** — Foundry owner, leads entire program + owns Academy Product track
- **Itai Haetzni** — Community pillar lead
- **Tal Arnon** — Academy Engineering track owner (VP Engineering)
- **Omer** — Ops/project manager for the Foundry
- **Product session leads**: Shilhav Ben David (1, 8), Almog Azlan (2), Elad (3), Noa B. (6), Yoni Ramot (5, 13), Hisham Abdulhalim (7), Topaz (9)
- **5 product sessions unassigned**: 4, 10, 11, 12, 14
- **Engineering session leads**: TBD (separate faculty)

## Related Initiatives

- `ai-native-team-structure` (AI Team OS) — AI-native team operating model and JDs
- `dlc-ai-era` — DLC framework connection (open question)

## Claude.ai Project

A dedicated Claude.ai Project ("The Foundry") also exists for this initiative, with scoped Supabase MCP access. Both environments can work on this initiative — Claude.ai for conversational content development, Claude Code for file-based work, slides, and technical session content.
