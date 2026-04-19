---
title: Research Landscape — AI-Native Team Structures (March 2026)
date: 2026-03-20
type: research-synthesis
purpose: Collected perspectives from online sources to inform our AI-native team operating model
---

# Research Landscape: AI-Native Team Structures

Compiled March 2026. Sources drawn from blog posts, industry guides, and thought leadership pieces. Organized by theme, not source.

---

## 1. Emerging Consensus (What Most Sources Agree On)

These points appear across multiple independent sources. They're becoming table stakes, not differentiators:

- **Teams get smaller.** The 8-12 person pod shrinks to 3-5 people. AI agents fill execution capacity that previously required more humans. Multiple sources converge on a "3-5 person pod" as the new default.
- **Role boundaries blur.** PMs write code, engineers make product decisions, designers review live agent output. The assembly-line model (PM specs → Design mockups → Eng implements) is collapsing.
- **"Builder" becomes the dominant archetype.** The person who identifies a problem, determines the solution, and uses AI to build it. Not just engineers — PMs and designers become builders too. Companies like Meta, LinkedIn, Walmart, SoFi, Decagon already adopting "builder" titles.
- **Engineers shift from writing code to reviewing and orchestrating.** The new loop: Spec → Onboard agents → Direct → Verify → Integrate. Code review skills (correctness, security, architecture) become more important than code writing.
- **Documentation becomes infrastructure.** `agents.md`, `CLAUDE.md`, architecture docs — these aren't optional docs, they're how agents understand the codebase. "Context-First Definition of Done": no feature complete until docs updated.
- **Prototype-first replaces PRD-first.** Instead of long spec cycles, teams build working prototypes in hours and iterate. Brian Balfour (Reforge): this eliminates the "document death spiral."
- **Judgment > execution.** The differentiator is quality of thinking, not speed of building. AI inverted the ratio of judgment work to execution work.

## 2. Interesting Frameworks & Models

### The "Centaur Pod" (Optimum Partners)
```
1 Senior Architect (strategic direction, system design)
2 AI Reliability Engineers (human oversight, verification)
+ Autonomous Agent Fleet (execution, testing, boilerplate)
```
- Introduces "AI Reliability Engineer" (ARE) as a new role — not writing code, but managing AI output integrity. Writes specs, checks for hallucinations, owns integration testing.
- KPI shifts from "volume of commits" to "defect capture rate" (% of AI errors caught pre-staging).
- Hiring test: present flawed AI-generated code, have candidates identify risks and refactor. Tests review capability, not coding speed.

### The "Intent Architect" PM (ShiftMag)
- PM becomes an "Intent Architect" — output is no longer a ticket but the "brain" of the feature.
- PM owns the context engine: ensures the AI agent has the exact data and guardrails needed.
- Success measured by "precision of context," not volume of tasks.

### OpenAI Codex Guide — Delegate/Review/Own
```
Delegate → AI agents handle mechanical, repetitive tasks
Review   → Engineers validate quality and correctness
Own      → Humans retain final authority and strategic decisions
```
- Not a team restructure but a workflow overlay. Start small, expand agent scope iteratively.
- Infrastructure requirements: MCP access, `AGENTS.md`, runnable test suites, prompt templates.

### Brian Balfour (Reforge) — AI-Native Product Teams
- AI-native teams are "trained as AI-native from day one" — not traditional teams with AI bolted on.
- Three product responsibilities reshaped: problem expansion, prioritization reshuffle, solution reinvention.
- Returning to "startup magic": tight builder-customer feedback loops that get lost as orgs scale.
- From functional silos → cross-functional autonomous pods with shared outcomes.
- Gap acknowledged between "AI promise and reality of implementing all this change."

### Addy Osmani — Five Tensions Shaping Engineering
1. Junior hiring crisis vs. expansion into new domains
2. Skills atrophy vs. higher-value work
3. Developer as auditor vs. orchestrator
4. Narrow specialist vs. T-shaped developer
5. Traditional degrees vs. alternative pathways

Key insight: "Best software engineers won't be the fastest coders, but those who know when to distrust AI." 45% of roles now expect proficiency across multiple domains.

## 3. Role-Specific Findings

### Product Manager

| Dimension | Traditional | AI-Native |
|-----------|-------------|-----------|
| Output | PRDs, tickets, specs | Context engines, prototypes, structured prompts |
| Scope | Strategy + stakeholder alignment | Strategy + prototyping + data analysis + building internal tools |
| Hiring signal | Domain expertise, stakeholder management | Product sense + technical fluency + builder capability |
| Measure of success | Features shipped, adoption | Quality of judgment, precision of context, outcomes |

- Aha.io (Brian de Haaff): "Role consolidation" — work that fragmented across specialists now flows through one PM. The "full-stack PM" from 2021 is baseline by 2025.
- PMs now absorb: market research synthesis, customer interview analysis, prototype creation, design application, documentation. What they can't absorb: vision, deep customer understanding, cross-functional motivation.
- Lenny Rachitsky (Maven): Running "AI-Native PM" workshop series — three themes: AI workflows, becoming more technical, product sense & influence.
- Boris Cherny (Anthropic/Claude Code): predicts "software engineer" title disappears, replaced by "builder" or "product manager."

### Software Engineer

| Dimension | Traditional | AI-Native |
|-----------|-------------|-----------|
| Core activity | Writing code | Reviewing AI output, system architecture, directing agents |
| Specialization | FE/BE/Infra/Mobile | Full-stack by default, deep in system design |
| Career path | Junior → Mid → Senior → Staff | ARE → Orchestrator → Architect |
| KPIs | Story points, PRs merged | Defect capture rate, MTTV (mean time to verification), change failure rate |

- "AI Reliability Engineer" as entry-level role — writes specs, validates AI output, catches hallucinations.
- The "Senior-Only" hiring model creates a "Talent Hollow" — eliminates the pipeline that produces future seniors. Real risk for orgs that freeze junior hiring.
- 84% of developers use AI tools, but ~45% actively distrust AI output. Trust paradox is real.
- T-shaped developers gain most leverage — one person handling back-end and UI without handoffs.

### Design & QA

- Designers shift from static handovers to reviewing live agent output in real-time ("dynamic orchestration").
- QA evolves from manual testing to designing "self-healing loops" and automated validation systems.
- Both roles trend toward shared/cross-functional rather than embedded in pods.

## 4. Cautionary Tales

### Klarna — The Overcorrection
- Reduced workforce 50%, eliminated 1,200 SaaS tools, AI handled 1.3M conversations/month (~800 FTE equivalent).
- Then **reversed course**: CEO admitted cost was a "too predominant evaluation factor" resulting in "lower quality." Started rehiring human agents.
- Lesson: AI-first ≠ AI-only. The hybrid model (AI handles volume, humans handle complexity) won. Going too fast on headcount reduction before understanding quality thresholds is dangerous.

### Shopify — The Mandate
- CEO told teams to "consider using AI before growing headcount."
- Then quietly laid off customer service employees.
- Less public about results than Klarna, but the mandate approach creates organizational tension.

### The Junior Developer Dilemma (Addy Osmani, Optimum Partners)
- Harvard research: junior developer employment drops 9-10% within six quarters when companies adopt generative AI.
- But cutting junior pipelines today creates leadership vacuums in 5-10 years.
- The "Talent Hollow" is a slow-burn risk that won't show up in quarterly metrics.

## 5. Transition & Change Management (What We Know)

Most live sources are thin on transition. Supplemented with pre-2025 research and case study data.

### The Augment vs. Restructure Spectrum

Two camps:
- **Augmentation camp** (Ethan Mollick/Wharton, most HBR authors): AI makes existing roles more productive. Restructuring prematurely is risky because the technology moves too fast — you optimize for today's capabilities and are wrong in 12 months. Give everyone tools, let the org shape itself.
- **Restructure camp** (startup founders, some consultants): Adding AI to existing structures gets incremental gains. Step-function improvement requires rethinking workflows end-to-end → different roles and team shapes.
- **Emerging consensus**: Start with augmentation. Identify which workflows are *fundamentally changed* (not just faster). Restructure only those areas. Wholesale reorgs based on AI are premature for most companies.

### Three Team Topology Patterns

1. **The Amplified Pod** — Traditional product trio (PM, Designer, Engineers) but with 50-70% fewer engineers. AI handles implementation velocity; humans focus on architecture, review, and product judgment. Best fit for enterprise first attempt.
2. **The PM-Engineer Hybrid** — One person does both product and engineering, AI as their "team." Works only at very small scale. Breaks down because product judgment and engineering depth are genuinely different skills.
3. **The AI-Augmented Platform Team** — Dedicated team builds internal AI tooling that other teams consume. Other teams stay traditional but use AI-powered tools. Most common enterprise pattern. Lowest risk, lowest transformation.

### Infrastructure Prerequisites (Before You Restructure)

From GitHub Octoverse, Thoughtworks Tech Radar, Stripe/Airbnb engineering blogs:

1. **Codebase readiness** — Well-documented, modular repos with good test coverage. AI tools dramatically more effective in clean codebases. Legacy spaghetti gets *worse* with AI assistance.
2. **Data access and governance** — Teams need production data, analytics, monitoring access. Data silos kill AI-native workflows.
3. **Tooling standardization** — Same IDE, same AI tools, same prompting patterns. Fragmentation → inconsistent quality.
4. **Security and compliance framework** — Critical in fintech: clear policies on what data goes to AI models, what code AI generates in regulated systems, audit trails.
5. **Measurement baseline** — Must know current velocity, quality metrics, cycle times BEFORE introducing AI, or you can't measure impact.

### Change Management — What Works and What Doesn't

From BCG "AI at Work" study, McKinsey "State of AI 2024," Gartner surveys:

**Adoption is bimodal:**
- 10-20% power users adopt fast and drive most value
- 50-60% use tools superficially or not at all
- 20-30% middle adopts slowly but steadily

**What works:**
- Peer champions (not top-down mandates)
- Visible wins in first 30 days
- Protected time for experimentation
- Explicit permission to fail
- **BCG finding: Teams where the *manager* actively used AI had 3x the adoption rate.** Leadership modeling is the strongest predictor.

**What fails:**
- Announcing "AI-first" without changing incentives, processes, or tooling
- Measuring adoption by license count rather than workflow impact
- Letting AI skeptics opt out indefinitely
- Mandatory training without follow-up → compliance theater

### Deeper Klarna Context

Beyond the headline reversal:
- Reduction was primarily through attrition (hiring freeze), not mass layoffs — from ~5,000 to ~3,500
- Approach was **function-by-function**: customer service first, then marketing. PM and engineering org structure was largely unchanged.
- Marketing team shrank from ~100 to "a handful" using GenAI for copy, imagery, localization
- S-1 filing disclosed AI risks: regulatory uncertainty, customer trust, single-vendor dependency (OpenAI)
- **Key lesson**: Klarna did not restructure team *topology* — they shrank teams doing automatable *operational* work. Product/engineering was barely touched.

### Deeper Shopify Context

- Tobi Lutke's memo introduced a **"prove AI can't do it" gate** for new hires: before any team can grow, show the work can't be done with AI tools
- Team topology (pods, product areas) remained the same. What changed: expectation of individual output per person.
- Performance reviews factor in AI tool adoption and proficiency
- Risk: without structural change, adoption is uneven. Power users thrive, others treat it as checkbox compliance.

### Failure Modes

| Failure Mode | Description | Mitigation |
|---|---|---|
| Premature optimization | Restructuring for today's AI capabilities; obsolete in 12 months | Design for flexibility, not a specific tool |
| Cargo culting | Copying Klarna/Shopify without understanding context differences | Be explicit about what hypothesis you are testing |
| Quality erosion | AI-generated work accepted without sufficient review | Invest in review processes, not just generation |
| Skill atrophy | Team loses foundational skills as AI handles routine work | Maintain deliberate practice of core skills |
| Vendor lock-in | Workflows built around one AI provider | Abstract AI interfaces, use multiple models |
| Compliance blind spots | AI-generated code/decisions in regulated systems without audit trail | Build compliance into workflow from day one |
| Two-tier workforce | Power users promoted, non-adopters pushed out → resentment | Structured upskilling with clear expectations and timelines |
| Measurement theater | Claiming 10x productivity without rigorous before/after data | Baseline metrics before any change |

---

## 6. What's Still Missing From the Landscape

Most sources are thin on:

1. **Transition playbooks** — Everyone describes the target state. Almost no one describes how to get there from a traditional org. Balfour explicitly acknowledges this gap.
2. **Team variants** — One-size-fits-all models. No one distinguishes infra teams vs. product teams vs. platform teams vs. compliance-heavy teams (like ours).
3. **Regulated industry specifics** — Fintech, healthcare, etc. where agent autonomy has real compliance implications. Most sources assume startup-like freedom.
4. **Embedded vs. shared functions** — The DevOps/Design/Data placement question gets hand-waved. No strong frameworks for when to embed vs. share.
5. **Measurement** — New KPIs are proposed (MTTV, defect capture rate) but no one has data yet on what "good" looks like.
6. **Manager role** — How does engineering management change? The Optimum Partners piece touches it, but most sources focus on IC roles.

## 7. What This Means For Our Framework

### Where we're aligned with consensus
- Small, autonomous team (1 PM + 2 Eng + shared functions) ✓
- Blast radius / autonomy governance ✓
- Outcomes over artifacts ✓
- Builder/reviewer lens ✓

### Where we can be sharper
- **PM as "Intent Architect"** — our PM JD is good but could explicitly frame the PM as the context engine owner, not just strategy + execution.
- **Engineer as reviewer/orchestrator** — our Engineer JD is still placeholder. The ARE concept and the Spec→Direct→Verify→Integrate loop give us concrete framing.
- **Repo readiness as prerequisite** — `agents.md`, doc-code sync hooks, knowledge-in-git. Both Cellebrite (practical) and OpenAI (guide) converge here. We should call this out as Day 1 infrastructure.
- **Transition path** — this is our biggest gap, and it's also the biggest gap in the industry. Opportunity to lead here.

### Where we might differentiate
- **Regulated-industry variant** — nobody's writing about AI-native teams in fintech/compliance contexts. Our blast radius framework is a natural fit.
- **Honest transition playbook** — if we can describe how to get from current Payoneer teams to AI-native pods, with sequencing and prerequisites, that's genuinely novel.
- **The Talent Hollow warning** — most "smaller teams" narratives ignore the junior pipeline problem. We can be explicit about this risk and design for it.

---

## Sources

- [Engineering Management 2026: Structuring an AI-Native Team](https://optimumpartners.com/insight/engineering-management-2026-how-to-structure-an-ai-native-team/) — Optimum Partners
- [Building an AI-Native Engineering Team](https://developers.openai.com/codex/guides/build-ai-native-engineering-team) — OpenAI Codex Guide
- [AI Native Product Teams](https://blog.brianbalfour.com/p/ai-native-product-teams-how-they) — Brian Balfour / Reforge
- [How AI Is Redefining Product Teams](https://shiftmag.dev/its-time-to-redesign-how-product-teams-work-7935/) — ShiftMag
- [The New Product Manager in the Era of Role Consolidation](https://www.aha.io/blog/the-new-product-manager-in-the-era-of-role-consolidation) — Brian de Haaff / Aha.io
- ['Engineer' is so 2025. In AI land, everyone's a 'builder' now](https://sfstandard.com/2026/03/05/engineer-2025-ai-land-everyone-s-builder-now/) — SF Standard
- [The AI Software Engineer in 2026](https://www.builder.io/blog/ai-software-engineer) — Builder.io
- [The Next Two Years of Software Engineering](https://addyosmani.com/blog/next-two-years/) — Addy Osmani
- [The AI-Native Product Manager](https://maven.com/x/ai-native-pm-lenny) — Lenny Rachitsky / Maven
- [How Coding Agents Are Reshaping Engineering, Product and Design](https://blog.langchain.com/how-coding-agents-are-reshaping-engineering-product-and-design/) — Harrison Chase / LangChain (already on reading list)
- [Klarna Customer Service: AI-First to Human-Hybrid](https://blog.promptlayer.com/klarna-customer-service-from-ai-first-to-human-hybrid-balance/) — PromptLayer
- [Shopify CEO: AI before headcount](https://techcrunch.com/2025/04/07/shopify-ceo-tells-teams-to-consider-using-ai-before-growing-headcount/) — TechCrunch
- [HBR: Build Your Team's Product Management Skills for AI Adoption](https://hbr.org/2026/02/to-drive-ai-adoption-build-your-teams-product-management-skills) — Harvard Business Review
