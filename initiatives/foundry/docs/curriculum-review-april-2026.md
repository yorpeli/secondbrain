# Foundry Product Track — Curriculum Review & Recommendations

**Date:** April 8, 2026
**Author:** Yonatan Orpeli (with Claude)
**Purpose:** Benchmark the Foundry's product track against external programs and propose targeted improvements before cohort 1 launches.

---

## Part 1: External Programs Reviewed

We reviewed 11 programs across three categories: (A) PM-specific AI courses, (B) agent/vibe-coding programs for non-engineers, and (C) an external consultant proposal already contracted by Payoneer.

---

### A. PM-Specific AI Training Programs

#### A1. Product Faculty — AI Product Management Certification (Maven)

**Instructors:** Rohan Varma & Henry Shi (practitioners from OpenAI and Anthropic)
**Format:** 6-week live cohort · 4-6 hrs/week · $2,500
**Next cohort:** Apr 20 – May 29, 2026

**Curriculum:**
- How AI models work in production (not theory)
- Identifying AI opportunities using their "4D Method"
- Prompt engineering → RAG → agentic AI systems
- 3P Framework: Prioritization, Placement, Prominence
- 4 AI Design Patterns: Inputs, Special Instructions, Outputs, Feedback Loops
- Tools: Claude Code, OpenClaw, Lovable, n8n, Dyad, APIs
- Techniques: RAG, multi-agent systems, embeddings, chunking, context engineering, evals, guardrails, observability
- **Capstone:** Ship a production-ready AI product

**What's distinctive:** The most technical PM-oriented course on the market. Covers the full modern AI stack (embeddings, chunking, evals, guardrails, observability) — topics most PM programs skip entirely. Capstone requires shipping, not just presenting.

**Relevance to Foundry:** Their progression from prompt engineering → RAG → agentic AI mirrors our Makers → Builders arc. Their "4 AI Design Patterns" framework could enrich our S5 or S6. Their evals/observability content is something our Builders sessions lack.

**Source:** [maven.com/product-faculty/ai-product-management-certification](https://maven.com/product-faculty/ai-product-management-certification)

---

#### A2. Agentic AI Product Management Certification — Mahesh Yadav (Maven)

**Instructor:** Mahesh Yadav (ex-Google, Meta, AWS, Microsoft; 12 AI patents)
**Format:** 7-week cohort · 6+ hrs/week · 21+ live sessions · $3,000
**Next cohort:** May 9 – Jun 20, 2026

**Curriculum:**
- ML foundations: neural networks, DL vs traditional ML vs agents
- Prompt engineering: zero-shot, few-shot, role-playing
- History and taxonomy of agentic AI
- Building agents with frontend and backend
- AI tenets for opportunity selection
- AI roadmap with moat
- Evaluation frameworks for AI agents
- AI pricing & go-to-market (startup + FAANG perspectives)
- **Capstone:** Build an AI PM co-pilot using n8n + v0.dev that writes PRDs. Rehearse, polish evaluation dashboards and guardrail evidence, present to judges.

**What's distinctive:** Heaviest program in the market (21+ sessions, 6+ hrs/week). Strong on product strategy and business model — not just "here's how to build." The pricing/GTM module is unique. The judge panel format for capstone presentations is a strong finishing ceremony.

**Relevance to Foundry:** The "AI tenets for opportunity selection" concept could strengthen our S12 (Use Case Design for Team Workflows). The idea of evaluation dashboards and guardrail evidence as part of the capstone is worth borrowing for our S14.

**Source:** [maven.com/mahesh-yadav/genaipm](https://maven.com/mahesh-yadav/genaipm)

---

#### A3. Dr. Marily Nika — AI PM Bootcamp & Certification (Maven)

**Instructor:** Dr. Marily Nika (AI @ Google)
**Format:** 6-week cohort · 4-6 hrs/week · $2,300
**Next cohorts:** Apr 13 – May 23, 2026 · Sep 7 – Oct 20, 2026

**What's distinctive:** Focused on building AI *products* — i.e., being a PM on a team that ships AI features. Less relevant for our "use AI as a PM" framing, but still the most popular AI PM course on Maven with multiple cohorts per year.

**Relevance to Foundry:** Limited. Her focus is "PM who builds AI products" vs. our focus "PM who uses AI to be a better PM." However, some of her frameworks for evaluating AI product quality could inform our S7 (Evaluating AI Output).

**Source:** [maven.com/marily-nika/ai-pm-bootcamp](https://maven.com/marily-nika/ai-pm-bootcamp)

---

#### A4. AI for Product Managers Bootcamp — Valerio Zanini / SparkEngine (Maven)

**Format:** 2-week cohort · 2 sessions/week · 90 min each · $795
**Next cohorts:** Apr 28 – May 8, 2026 · May 19 – Jun 3, 2026

**Curriculum:** Accelerate discovery, synthesize insights, explore solutions, support decisions — all using AI. Hands-on assignments between sessions.

**What's distinctive:** Short and focused. The "AI across the PM lifecycle" framing (discovery → synthesis → exploration → decisions) is clean and practical.

**Relevance to Foundry:** The PM-lifecycle framing is something we should thread through L2. Our S6 speed-runs this, but it could be an explicit thread across S4-S6.

**Source:** [maven.com/sparkengine/aiproductmanagers](https://maven.com/sparkengine/aiproductmanagers)

---

#### A5. Pragmatic Institute — AI for Product Managers

**Format:** 1-day live online session
**Modules:** AI-Assisted Discovery · AI-Powered Prioritization · AI in Prototyping · Communicating AI Strategy to Stakeholders

**Curriculum:** Using AI agents to scan competitors and extract market themes. Crafting AI-driven hypotheses. Scoring agents for strategic decisions. Stakeholder messaging. Building testable product concepts with AI tools.

**What's distinctive:** The only program that explicitly teaches "Communicating AI Strategy to Stakeholders" — a PM leadership skill the others ignore. Also the shortest serious program (1 day).

**Relevance to Foundry:** The stakeholder communication angle is missing from our curriculum. PMs need to explain AI initiatives to leadership, get buy-in, and articulate value. Could be a component of S12 (Use Case Design) or S14 (Spec Handoff).

**Source:** [pragmaticinstitute.com/product/course/ai-for-product-managers](https://www.pragmaticinstitute.com/product/course/ai-for-product-managers/)

---

### B. Agent-Building & Vibe Coding Programs (Non-Engineer Focused)

#### B1. Claude Code for PMs — Carl Vellotti (ccforpms.com)

**Format:** Free · self-paced · ~20-30 hours · 5 modules · 26 lessons
**Delivery:** Learn-by-doing inside Claude Code itself — no videos, no slides

**Curriculum:**
- **Module 0 — Getting Started:** Install Claude Code, clone course repo
- **Module 1 — Fundamentals:**
  - 1.1 Welcome — intro to TaskFlow (practice company)
  - 1.2 Visualizing Files — set up split-screen workspace (Obsidian/VS Code)
  - 1.3 First Tasks — process meeting notes, analyze research, work with images
  - 1.4 Agents — use parallel agents for complex workflows
  - 1.5 Custom Sub-Agents — create specialized AI personas (Engineer, Executive, Researcher)
  - 1.6 Project Memory — CLAUDE.md for persistent context and instructions
  - 1.7 Navigation — master file operations and searches
- **Module 2 — Advanced PM Work:**
  - 2.1 Write a PRD — partner with AI to create product requirements
  - (Additional lessons on data analysis, competitive strategy)
- **Module 4 — Vibe Coding:**
  - Planning with Claude, building a web app from scratch

**What's distinctive:** The only program where Claude Code is both the teaching medium and the tool being taught. No videos, no passive consumption — participants learn by doing real PM tasks inside the CLI. The sub-agents concept (creating specialized AI personas for different review perspectives) is practical and novel. The "practice company" (TaskFlow) provides realistic context without requiring participants to use sensitive work data.

**Relevance to Foundry:** High. Three specific concepts worth borrowing:
1. **Sub-agents/personas** — building an Engineer persona, Executive persona, Researcher persona for different PM tasks. Could enrich S9.
2. **Project memory (CLAUDE.md)** — explicitly teaching how to set up persistent context. Should be central to S5 and S8.
3. **Practice company pattern** — using a fictional company for exercises so participants can learn without data sensitivity concerns. We should consider this for L1-L2 exercises, then switch to real data in L3.

**Source:** [ccforpms.com](https://ccforpms.com/) · [GitHub](https://github.com/carlvellotti/claude-code-pm-course)

---

#### B2. Lenny Rachitsky — "The AI-Native Product Manager" Workshop Series (Maven)

**Format:** Free live workshops with guest instructors
**Themes:**
1. AI workflows
2. Becoming more technical
3. Product sense & influence

**Notable guest instructors:** Tomer Cohen, Wes Kao, Hamel Husain, Peter Yang, Marily Nika, Tal Raviv, Aman Khan, Hila Qu

**What's distinctive:** Not a course — a curated speaker series from the most influential PM newsletter in the industry. Lenny's framing: "a few years from now, these skills will be table stakes for PMs." The instructor lineup represents the leading thinking on what AI-native PM work looks like.

**Relevance to Foundry:** Signals what the industry considers essential PM skills in 2026. The three themes (AI workflows, becoming more technical, product sense & influence) validate our Makers L1→L2→L3 arc. The "Forward Deployed Engineer" mindset (from Palantir/OpenAI/Anduril) — PMs who can build, not just spec — aligns with our Builders philosophy.

**Source:** [maven.com/x/ai-native-pm-lenny](https://maven.com/x/ai-native-pm-lenny)

---

#### B3. Tal Raviv — PM Productivity System & AI Copilot (Maven)

**Instructor:** Tal Raviv (ex-Airbnb, Lenny's Newsletter author)
**Format:** 3-week cohort · 47 lessons · 23 projects · 7 live sessions + 2 AMAs

**Curriculum:**
- **Week 1:** PM productivity foundations, emotional inner game, applied mindfulness
- **Week 2:** Self-reliant product teams, shipping sooner, communicating overhead to leadership
- **Week 3:** AI agents, AI prototyping, AI co-pilot, AI mindsets (PM-focused)

**What's distinctive:** AI is the culmination, not the starting point. The first two weeks build a productivity foundation, then Week 3 layers AI on top. The "AI copilot" concept — a personal AI system tailored to your PM work — is exactly what our Makers L3 capstone aims for. Every submission gets personal review and feedback.

**Relevance to Foundry:** The progression (productivity foundations → then AI) is the inverse of ours, but the endpoint is the same: a personal AI copilot for PM work. His framing of AI as the *tool* for a broader productivity system (not the *goal*) is worth considering for how we position the Foundry to participants.

**Source:** [maven.com/tal-raviv/product-manager-productivity-system](https://maven.com/tal-raviv/product-manager-productivity-system)

---

#### B4. Product School — AI Certifications (Tiered)

**Format:** Live online, small cohorts, multiple tracks

**Tracks offered:**
- **AI for Product Management** — foundational vocabulary, frameworks (beginners)
- **Advanced AI Agents & Vibe Coding** — building LLM-based features, autonomous agents, multi-step workflows, reasoning paths, tool triggers. Teaches "transitioning from single prompts to autonomous agents."
- **AI Evals** — measuring, testing, optimizing model outputs for production
- **AI Product Strategy** — portfolio-level AI leadership
- **Vibe Coding** — designed by Dejan (GPM at Spotify), in partnership with Lovable. "The Living Spec" workflow: natural language → functional builds. Localhost → live URLs. Replaces static slide decks with working software.

**What's distinctive:** The tiered approach mirrors our L1→L2→L3→Builders philosophy. The dedicated Vibe Coding cert — specifically designed for product teams, not engineers — validates the "Build an App" idea we have in our parking lot. Their "Living Spec" concept (PMs present working software instead of slide decks) is a compelling vision for what Builders graduates should be able to do.

**Relevance to Foundry:** The strongest external validation that:
1. Tiered progression works (they independently arrived at a similar structure)
2. Vibe coding for PMs is a real category worth a dedicated session
3. AI Evals deserves standalone attention (we have S7, which is good)

**Source:** [productschool.com/certifications/ai-for-product-managers](https://productschool.com/certifications/ai-for-product-managers) · [productschool.com/certifications/vibe-coding](https://productschool.com/certifications/vibe-coding)

---

#### B5. Aman Khan — Claude Code for Product Managers (Maven)

**Format:** Live cohort on Maven
**Curriculum:** PM master class using AI across research, design, data, engineering, and marketing. Includes 200+ skills library, plugins, and tutorials for user research, product strategy, and decision making.

**What's distinctive:** Broader than Claude Code as a tool — frames it as a complete PM operating system. The 200+ skills library that participants take with them is a concrete, lasting artifact.

**Relevance to Foundry:** The "skills library as a takeaway" concept is strong. If our Builders graduates leave with a curated set of reusable skills/templates for common PM tasks, that's more valuable than just the knowledge. Could inform S11 (Skills Architecture).

**Source:** [maven.com/aman-khan/claude-code-for-product-managers](https://maven.com/aman-khan/claude-code-for-product-managers)

---

#### B6. DeepLearning.AI — Vibe Coding 101 with Replit

**Instructor:** Andrew Ng + Replit team (Michele Catasta, Head of Developer Relations)
**Format:** Short course (free)
**Curriculum:** Build and host applications with an AI agent using Replit

**What's distinctive:** Andrew Ng's stamp of credibility. The absolute lowest barrier to entry for vibe coding. Useful as a benchmark for what "minimum viable vibe coding" looks like — if Andrew Ng thinks non-engineers can learn this in a short course, our Builders participants certainly can.

**Source:** [deeplearning.ai/short-courses/vibe-coding-101-with-replit](https://www.deeplearning.ai/short-courses/vibe-coding-101-with-replit/)

---

### C. External Consultant — Already Contracted by Payoneer

#### C1. Beyond AI — Shira Weinberg Harel

**Background:** Product leader and AI consultant, ex-Microsoft (14 years, led AI product teams in Office 365), 250+ client companies. Founded Product Management School, co-founded LeadWith.
**Format:** 2 progressive workshops (7 sessions total, ~1.5h each). Live webinar with recording. Significant upfront customization (up to 4 prep meetings per workshop).
**Audience:** Payoneer employees NOT in the Foundry — broad enablement.

**Workshop 1 — AI Practitioner** (3 sessions):
1. Advanced prompting & collaborative thinking — LLMs, model strengths/limitations, tool selection per task, chain-of-thought, structured outputs, role-based prompting, AI for research & decision-making
2. Building your first AI agent — custom agents via GPTs/Gemini Gems (no code), memory, instructions, knowledge sources, testing/iteration. Hands-on: each participant builds a role-tailored agent.
3. From agents to code — intro to vibe coding — Cursor/Claude Code intro, core agent configs (memory, data, behaviors), building a working tool/dashboard with zero coding experience. Hands-on: idea to working prototype in one session.

**Workshop 2 — Advanced AI** (3-4 sessions):
1. Building advanced agents — Cursor/Claude Code, agent instructions/memory/knowledge, testing for reliability. Hands-on: role-specific agent connected to real data.
2. Agent orchestration — MCP, RAG, multi-agent systems, architecture patterns (routing agents, specialist agents, review agents). Hands-on: multi-agent system for a real workflow.
3. Automated workflows — triggers, conditional logic, human-in-the-loop, end-to-end design, monitoring, error handling, production maintenance. Hands-on: automated workflow for their team.
4. Data track add-on — AI coding assistants for Python/SQL, data agents, automated reporting pipelines.

**What's distinctive:** The no-code → code progression is textbook. Session 2 (GPTs/Gems as first agent) before Session 3 (Cursor intro) is the exact sequencing every major program uses. Payoneer-specific customization (4 prep meetings) grounds exercises in real workflows.

**Relevance to Foundry:**
- **Sequencing signal:** Her S2 (no-code agents) → S3 (vibe coding) progression is validated by every other program in this review. Our curriculum skips the no-code step.
- **Orchestration gap:** Her W2-S2 (agent orchestration — MCP, RAG, multi-agent) is a topic our Builders sessions touch implicitly but never name explicitly.
- **Production ops gap:** Her W2-S3 (monitoring, error handling, maintenance) goes further than our S14 (which stops at spec handoff).
- **Coordination opportunity:** Since she's running workshops for non-Foundry employees on overlapping topics, there's a risk of inconsistent messaging. Worth coordinating so the Foundry and her workshops reinforce rather than contradict each other.

**Source:** Proposal PDF — "Beyond AI - AI Workshops Proposal - Payoneer March 28, 2026" (on file)

---

## Part 2: Cross-Program Analysis

### What Every Program Teaches (Table Stakes)

| Topic | Programs that cover it | Foundry status |
|-------|----------------------|----------------|
| LLM fundamentals (how models work) | All 11 programs | S1 — covered |
| Tool selection (which AI for which task) | 9 of 11 | S2 — covered |
| Prompt engineering / context engineering | All 11 | S5 — covered (needs deepening) |
| Building a personal AI agent | 10 of 11 | S8-S9 — covered |
| Hands-on exercises with real tasks | All 11 | Throughout — covered |
| Capstone / portfolio artifact | 8 of 11 | S10 capstone — covered |

### What Leading Programs Teach (Differentiators)

| Topic | Programs that cover it | Foundry status |
|-------|----------------------|----------------|
| **No-code agents first** (GPTs, Claude Projects, Gems) | Beyond AI, ccforpms, Product Faculty, Mahesh Yadav, Product School | **Gap — we jump straight to Cursor in L3** |
| **Context engineering** (CLAUDE.md, project memory, knowledge sources) as named skill | ccforpms, Product Faculty | S5 title says it, content could go deeper |
| **Vibe coding for PMs** (build apps, not just agents) | Product School, ccforpms, Beyond AI, DeepLearning.AI | **Parking lot idea — not yet a session** |
| **Sub-agents / personas** (specialist AI roles) | ccforpms | **Not in curriculum** |
| **Agent orchestration** (multi-agent, routing, MCP+RAG) | Beyond AI, Product Faculty, Mahesh Yadav | **Not in product track** |
| **Production ops** (monitoring, error handling, maintenance) | Beyond AI, Product Faculty | **S14 stops at spec handoff** |
| **AI across PM lifecycle** (discovery → prioritization → prototyping → comms) | Pragmatic Institute, SparkEngine, Product Faculty | Partially in S6, not an explicit thread |
| **AI design patterns / frameworks** (reusable mental models) | Product Faculty (4 patterns), Pragmatic Institute | **Not explicitly taught** |
| **Stakeholder communication for AI initiatives** | Pragmatic Institute | **Not in curriculum** |
| **Skills/templates library as takeaway** | Aman Khan (200+ skills) | S11 covers architecture, but no curated library |

### What Only the Foundry Teaches (Our Differentiators)

| Topic | Detail | Who else has it |
|-------|--------|-----------------|
| **Evaluating AI output / judgment** (S7) | Verification frameworks, confidence calibration, red-teaming your own prompts, spotting subtle failures | Almost no one — Product School has an "AI Evals" cert but it's production-focused, not PM-judgment-focused |
| **Enterprise security / compliance** (S3) | Hallucination in enterprise context, data leakage, CISO involvement | No one teaches this for PMs. Beyond AI mentions it briefly. |
| **Progressive assessments at each tier** | L1 assessment → L2 portfolio → L3 capstone → Builders spec | No one has gate assessments. Most have a single capstone. |
| **Role-specific PM exercises** | Every exercise framed through actual PM work at Payoneer | Most programs are generic or use fictional scenarios |
| **Builders tier** (team-level AI, not just personal) | S11-S14 take participants from personal productivity to team workflow automation | Most programs stop at personal agent building |

---

## Part 3: Recommended Changes to Product Track

### Philosophy

The research validates our overall structure. The three-tier progression, the hands-on-first principle, and the emphasis on judgment are all differentiators we should protect. The changes below are targeted adjustments, not a restructure.

### Change 1: Add a No-Code Agent Session (S4)

**Current S4:** Workflow Mapping & Baseline (TBD)
**Proposed S4:** "Your First AI Agent — No Code Required"

**Rationale:** This is the single strongest signal from the research. Every external program — Beyond AI, ccforpms, Product Faculty, Product School, Mahesh Yadav — starts agent-building with no-code tools (GPTs, Claude Projects, Gemini Gems) before introducing Cursor or Claude Code. The current curriculum jumps from "AI for PM use cases" (S6) to "Agent Concepts + Cursor Deep Dive" (S8) with no stepping stone.

**Proposed content:**
- What is an agent vs. a chatbot vs. an assistant (moved from S8 — concept intro belongs before the tool intro)
- Build a working agent using Claude Projects (or GPTs/Gems — participant's choice)
- Configure: instructions, memory/knowledge sources, personality, constraints
- Test against 3 real scenarios from your PM work
- Iterate: what breaks, what surprises, what's useful
- **Hands-on:** Each participant leaves with a working no-code agent tailored to their role

**What happens to the current S4 content:** The Workflow Mapping & Leverage Score content redistributes:
- The personal workflow audit moves to S5 (as the input for context engineering — "map your workflows, then build context around the most valuable ones")
- The Leverage Score framework moves to S12 (where it's more relevant — choosing team workflows to automate)

**Impact on session leads:** S4 was TBD anyway. No reassignment needed.

**Impact on assessments:** L2 assessment gets richer — portfolio now includes a no-code agent alongside the 5+ workflows and templates.

---

### Change 2: Deepen Context Engineering in S5

**Current S5:** "Advanced Prompting & Context Engineering" — multi-turn conversations, structured outputs, prompt chaining, role-play, context engineering (goals, audience, background, constraints)
**Proposed S5:** "Context Engineering & Your AI Workspace" — rebalanced toward context engineering as the primary skill

**Rationale:** "Prompt engineering" is rapidly becoming dated terminology. The leading programs (Product Faculty, ccforpms) have shifted to "context engineering" — how you structure knowledge, memory, and instructions for AI systems. Our S5 already has the right title but the content description is still 70% prompting, 30% context.

**Proposed rebalance:**
- **Keep:** Structured outputs (JSON/tables), multi-turn conversations, prompt chaining — these are practical skills
- **Elevate:** Context engineering as the primary frame. Teach it as:
  - Project memory (CLAUDE.md convention, persistent instructions)
  - Knowledge sources (what to attach, how to structure reference material)
  - Workflow context (from S4's audit — bring your mapped workflows as input)
  - Persona/role design (how to shape AI behavior through context, not just prompts)
- **Add:** Personal workflow audit (absorbed from current S4). Participants map their top-10 tasks, score them, then build context structures for the top 3.
- **De-emphasize:** Role-play prompting as a standalone technique (it's a subset of context engineering)

**Impact on session leads:** Yoni Ramot still leads. Content shifts, not replacement.

---

### Change 3: Add Vibe Coding to Builders (S11)

**Current S11:** "Skills Architecture & Tool Integration" — SKILL.md anatomy, config files, templates, tool permissions, MCP protocol, input validation, output guardrails, adversarial testing (TBD lead)
**Proposed S11:** "Skills, Tools & Vibe Coding" — add a vibe coding component

**Rationale:** The "Build an App" idea has been in the syllabus parking lot since inception. The market has validated it: Product School has a dedicated Vibe Coding cert for product teams, ccforpms has a full module, Andrew Ng released a course on it. PMs who can go from idea → working internal tool in one session is a powerful capability — and it's the natural extension of Builders' "team-level AI" focus.

**Proposed content addition (second half of the 120min session):**
- From spec to working tool: use Cursor/Claude Code to build a simple internal dashboard or tool
- Not a "learn to code" session — it's "use AI to build without coding"
- Connects to the skills architecture from the first half: the tool you build can use the skills you designed
- **Hands-on:** Each participant builds a functional (if rough) internal tool relevant to their team

**What stays:** SKILL.md anatomy, MCP protocol, input validation, guardrails. These are the first 60 min. Vibe coding is the second 60 min — applying what you just learned.

---

### Change 4: Enrich S14 with Production Thinking

**Current S14:** "Evaluation & Spec Handoff" — rigorous POC testing, accuracy/edge cases/failure modes, measure actual vs estimated impact, write L2 handoff spec (TBD lead)
**Proposed S14:** "Evaluation, Handoff & What Comes Next" — add production thinking

**Rationale:** Both Beyond AI and Product Faculty cover what happens after you build — monitoring, error handling, maintaining agents in production. Our Builders stops at "here's the spec, hand it off." But the handoff spec is more useful if it includes how the thing should be monitored and maintained.

**Proposed content additions:**
- What production means for AI tools (drift, failure modes that emerge over time, data freshness)
- What to include in a handoff spec: not just "what it does" but "how to know it's still working"
- Monitoring basics: what signals to watch, when to intervene, how to set up simple health checks
- Communicating AI initiatives to stakeholders (borrowed from Pragmatic Institute): how to explain the value, the risks, and the maintenance cost to leadership
- **Hands-on:** Enrich the handoff spec from S13's POC with monitoring plan + stakeholder summary

---

### Change 5: Thread Sub-Agents into S9

**Current S9:** "Build Your First Agent" — take a real recurring PM task, build an agent in Cursor/Claude Code, test against real scenarios, iterate on quality
**Proposed addition:** Add sub-agent/persona concept to the session

**Rationale:** ccforpms teaches building specialized sub-agents (Engineer persona, Executive persona, Researcher persona) for different PM tasks. This is a practical pattern: instead of one generic agent, build agents with distinct perspectives that can review each other's work.

**Proposed addition (within existing session, not extending):**
- After building the base agent, create 2 sub-agent personas (e.g., "Skeptical Engineer" and "Impatient Executive") that review the base agent's output
- Show how multi-perspective review catches errors a single agent misses
- This also plants the seed for S12-S13's team workflow concepts

**Impact:** No time extension. Topaz still leads. It's a design pattern within the existing build exercise.

---

### Change 6: Explicit PM Lifecycle Mapping in L2 (Framing, Not Content)

**Not a session change** — a framing enhancement across S4-S6.

**Rationale:** Pragmatic Institute and SparkEngine explicitly map AI to PM lifecycle phases: discovery → prioritization → prototyping → stakeholder comms. We do this implicitly in S6 (speed-run of PM tasks), but making it explicit gives participants a mental model they'll use long after the program ends.

**Proposed implementation:**
- Each exercise in S4-S6 is tagged with which PM lifecycle phase it serves
- S6 is reframed not as "here are PM use cases" but as "here's how AI accelerates each phase of your PM workflow"
- Assessment criteria for L2 portfolio includes: "demonstrate AI application across at least 3 PM lifecycle phases"

---

### Summary: Proposed Session Map

Changes are in **bold**.

#### MAKERS L1 — Fluency (unchanged)
| # | Session | Duration | Lead |
|---|---------|----------|------|
| 1 | How AI Actually Works | 90 min | Shilhav Ben David |
| 2 | AI Tools Landscape | 90 min | Almog Azlan |
| 3 | Risk, Failure Modes & Quality | 90 min | Elad |

#### MAKERS L2 — Application
| # | Session | Duration | Lead | Change |
|---|---------|----------|------|--------|
| 4 | **Your First AI Agent — No Code Required** | 90 min | TBD | **New content.** Claude Projects/GPTs agent building. Old S4 content (workflow mapping) redistributed to S5 and S12. |
| 5 | **Context Engineering & Your AI Workspace** | 90 min | Yoni Ramot | **Rebalanced.** Context engineering elevated as primary skill. Workflow audit absorbed from old S4. |
| 6 | AI for PM Use-Cases | 120 min | Noa B. | **Minor framing change.** Exercises tagged to PM lifecycle phases. |

**L2 Assessment (revised):** Portfolio with 5+ AI workflows, measured time savings, 3 validated reusable templates, **+ a working no-code agent**.

#### MAKERS L3 — Judgment & Personal Agents
| # | Session | Duration | Lead | Change |
|---|---------|----------|------|--------|
| 7 | Evaluating AI Output | 90 min | Hisham Abdulhalim | No change |
| 8 | Agent Concepts + Cursor Deep Dive | 120 min | Shilhav Ben David | **Minor adjustment.** "Agent vs chatbot vs assistant" moves to S4. S8 focuses on IDE setup, CLAUDE.md, and the Perceive→Plan→Act→Observe loop. |
| 9 | Build Your First Agent | 120 min | Topaz | **Add sub-agent/persona concept** within existing time. |
| 10 | Capstone: Agent in Production | 90 min | TBD | No change |

#### BUILDERS L1 — Use Case Design
| # | Session | Duration | Lead | Change |
|---|---------|----------|------|--------|
| 11 | **Skills, Tools & Vibe Coding** | 120 min | TBD | **Added vibe coding component** (second half). |
| 12 | Use Case Design for Team Workflows | 120 min | TBD | **Absorbs Leverage Score framework** from old S4. |
| 13 | Building a Team Workflow POC | 120 min | Yoni Ramot | No change |
| 14 | **Evaluation, Handoff & What Comes Next** | 120 min | TBD | **Added production thinking + stakeholder communication.** |

---

## Part 4: What We Deliberately Chose NOT to Change

| Suggestion considered | Decision | Why |
|----------------------|----------|-----|
| Add multi-agent orchestration session | Not now | Too advanced for Builders L1. Better fit for future Builders L2 or Masters. |
| Add AI pricing/GTM content (from Mahesh Yadav) | No | Not our audience — our PMs aren't launching AI products commercially. |
| Add ML fundamentals module (from Mahesh Yadav, Duke) | No | We're training AI users, not AI product managers. S1 covers enough theory. |
| Replace S7 (Evaluation) with production evals | No | S7's focus on PM judgment is our biggest differentiator. Production evals are folded into S14 instead. |
| Create a skills/templates library as a program artifact | Defer | Good idea (from Aman Khan), but scope it as a post-program project. Graduates contribute to a shared library. Could be an alumni activity. |
| Add "Designing for Agent Consumers" session | Defer | Already in syllabus as a future idea. Better fit for Builders L2 or Masters. |

---

## Appendix: Source Index

| # | Program | Provider | Link |
|---|---------|----------|------|
| A1 | AI PM Certification | Product Faculty (Maven) | [maven.com/product-faculty/ai-product-management-certification](https://maven.com/product-faculty/ai-product-management-certification) |
| A2 | Agentic AI PM Certification | Mahesh Yadav (Maven) | [maven.com/mahesh-yadav/genaipm](https://maven.com/mahesh-yadav/genaipm) |
| A3 | AI PM Bootcamp | Dr. Marily Nika (Maven) | [maven.com/marily-nika/ai-pm-bootcamp](https://maven.com/marily-nika/ai-pm-bootcamp) |
| A4 | AI for PMs Bootcamp | SparkEngine (Maven) | [maven.com/sparkengine/aiproductmanagers](https://maven.com/sparkengine/aiproductmanagers) |
| A5 | AI for Product Managers | Pragmatic Institute | [pragmaticinstitute.com/product/course/ai-for-product-managers](https://www.pragmaticinstitute.com/product/course/ai-for-product-managers/) |
| B1 | Claude Code for PMs | Carl Vellotti | [ccforpms.com](https://ccforpms.com/) |
| B2 | The AI-Native PM | Lenny Rachitsky (Maven) | [maven.com/x/ai-native-pm-lenny](https://maven.com/x/ai-native-pm-lenny) |
| B3 | PM Productivity & AI Copilot | Tal Raviv (Maven) | [maven.com/tal-raviv/product-manager-productivity-system](https://maven.com/tal-raviv/product-manager-productivity-system) |
| B4 | AI Certifications (tiered) | Product School | [productschool.com/certifications/ai-for-product-managers](https://productschool.com/certifications/ai-for-product-managers) |
| B5 | Claude Code for PMs | Aman Khan (Maven) | [maven.com/aman-khan/claude-code-for-product-managers](https://maven.com/aman-khan/claude-code-for-product-managers) |
| B6 | Vibe Coding 101 | DeepLearning.AI + Replit | [deeplearning.ai/short-courses/vibe-coding-101-with-replit](https://www.deeplearning.ai/short-courses/vibe-coding-101-with-replit/) |
| C1 | Beyond AI Workshops | Shira Weinberg Harel | Proposal PDF (on file, March 28, 2026) |
