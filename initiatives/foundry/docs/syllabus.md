# The Foundry — Full Syllabus

## Program Architecture

**The Foundry** is Payoneer's AI academy with two parallel tracks — **Product** and **Engineering** — under a single program identity.

### Dual-Track Structure

- **Product track**: Owned by Yonatan Orpeli. Product faculty with dedicated session leads.
- **Engineering track**: Owned by Tal Arnon. Engineering faculty with their own session leads.
- **Joint sessions**: Where topics naturally overlap (e.g., security, enterprise guidelines, risk), tracks combine. Security sessions (Product S3 / Engineering S3) are a potential joint session candidate — not yet confirmed.
- **Shared ceremonies**: Kickoff, graduation, demo days, celebrations — always joint across both tracks.
- **Cohort size**: 10–20 per track for initial cohorts, to keep it manageable.
- **Launch**: Both tracks target simultaneous launch. Product can pilot first if engineering isn't ready.

### Three-Tier Progression

Both tracks use the same tier model, though engineering content will differ:

**Makers** (~5 weeks) → Personal AI productivity, ending with a working personal agent
**Builders** (starts with L1, ~2 weeks) → Team-level AI solutions, ending with a production-ready spec
**Masters** (not yet designed) → AI architecture, platform services, organizational design

Makers + Builders L1 are designed for both tracks. Masters is future.

---

## Product Track — Session Breakdown

### MAKERS L1 — Fluency (1 week · 3 × 90min)

**Assessment:** Complete a real backlog task using AI, document prompts used, compare time vs. traditional approach.

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 1 | How AI Actually Works | LLMs, tokens, context windows, model families (GPT-4o / Claude / Gemini). Prompting framework (ACTFC): Role–Context–Task–Format–Constraints. Zero/few-shot, chain-of-thought. | 90 min | Shilhav Ben David |
| 2 | AI Tools Landscape | ChatGPT, Claude Projects, Copilot, Cursor, Perplexity — selection matrix + hands-on setup. When to use which tool for which task. | 90 min | Almog Azlan |
| 3 | Risk, Failure Modes & Quality | Hallucination detection, data leakage risks, bias awareness. Verification checklist. Red Team Challenge. AI in an enterprise environment. | 90 min | Elad *(joint session candidate)* |

---

### MAKERS L2 — Application (~1.5 weeks · 2 × 90min + 1 × 120min)

**Assessment:** Portfolio with 5+ AI workflows, measured time savings, 3 validated reusable templates.

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 4 | Workflow Mapping & Baseline | Personal workflow audit, top-10 tasks, time baseline. Leverage Score framework: frequency × time × pain × repeatability. | 90 min | TBD |
| 5 | Advanced Prompting & Context Engineering | Multi-turn conversations, structured outputs (JSON/tables), prompt chaining, role-play. Context engineering: goals, audience, background, constraints. | 90 min | Yoni Ramot |
| 6 | AI for PM Use-Cases | Competitive research, CSV analysis, PRDs, specs, stakeholder emails, exec summaries, presentations — all from one initiative in 45 min. Adapts content from Feb workshop Track 2 (Insights & Data) and Track 4 (Competitive Intelligence). | 120 min | Noa B. |

---

### MAKERS L3 — Judgment & Personal Agents (~1.5 weeks · 2 × 90min + 2 × 120min)

**Assessment:** Working personal agent + iteration log + critical evaluation exercise.

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 7 | Evaluating AI Output | When to trust AI in real PM decisions. Verification frameworks, confidence calibration. Red-teaming your own prompts. Spotting subtle failures. | 90 min | Hisham Abdulhalim |
| 8 | Agent Concepts + Cursor Deep Dive | Agent vs chatbot vs assistant. Agent loop: Perceive→Plan→Act→Observe. Memory & state patterns. Cursor/Claude Code: CLAUDE.md convention, project structure, first working interaction. | 120 min | Shilhav Ben David |
| 9 | Build Your First Agent | Take a real recurring PM task. Build an agent that handles it in Cursor/Claude Code. Test against real scenarios. Iterate on quality. | 120 min | Topaz |
| 10 | Capstone: Agent in Production | Refine agent against real work from the past week. Document what it does and how. Present to cohort. Peer feedback. | 90 min | TBD |

---

### BUILDERS L1 — Use Case Design (~2 weeks · 4 × 120min)

**Prerequisite:** Makers complete.
**Boundary principle:** Everything runs on your machine, your files, your credentials. The moment it needs shared data or deployment — that's L2.
**Assessment:** Working personal agent with custom skills + team workflow POC with measured results + spec document ready for L2 handoff.

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 11 | Skills Architecture & Tool Integration | SKILL.md anatomy, config files, templates, tool permissions. MCP protocol — file system, web, APIs you own. Input validation, output guardrails, adversarial testing. | 120 min | TBD |
| 12 | Use Case Design for Team Workflows | Identifying operational automation beyond personal productivity. Categories: team rituals, information synthesis, decision support. Extended Leverage Score: frequency × people × time × error rate. Prioritization matrix. | 120 min | TBD |
| 13 | Building a Team Workflow POC | Pick a real workflow from Session 12. Build a working local prototype against your own data. Define inputs/outputs → happy path → edge cases → test. | 120 min | Yoni Ramot |
| 14 | Evaluation & Spec Handoff | Rigorous POC testing — accuracy, edge cases, failure modes. Measure actual vs estimated impact. Write L2 handoff spec: what it does, data needs, who it serves, security considerations. | 120 min | TBD |

---

## Product Track — Session Lead Assignments

| Lead | Sessions | Notes |
|------|----------|-------|
| Shilhav Ben David | 1, 8 | 2 sessions (one light, one heavy) |
| Almog Azlan | 2 | 1 session |
| Elad | 3 | 1 session (joint session candidate) |
| Noa B. | 6 | 1 session |
| Yoni Ramot | 5, 13 | 2 sessions (one light, one heavy) |
| Hisham Abdulhalim | 7 | 1 session |
| Topaz | 9 | 1 session |
| TBD | 4, 10, 11, 12, 14 | 5 sessions unassigned |

**Rules:** No one leads more than 2 sessions. Avoid pairing two heavy (120min) sessions for same person.

---

## Engineering Track — Session Breakdown

**Track owner:** Tal Arnon
**Level owners:** M3 — Matan, B1 — Daniel O

### MAKERS M1 — Foundations

**Objective:** TBD
**Assessment:** TBD

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 1 | Modes — Ask, Agent, Prompt Engineering | Interaction modes, when to use each, prompt engineering fundamentals for engineers. | — | Noah Lerner |
| 2 | Basic Principles | Halo Effect, You Are The Owner, and other mental models for working with AI. | — | Noah Lerner |
| 3 | Security | Security considerations for AI in enterprise engineering. | — | TBD *(potential joint session with Product S3)* |
| 4 | IDEs Entry | VS Code, Cursor, Claude Code — how to select, pros and cons, hands-on setup. | — | Noah Lerner |
| 5 | Model Selection (Simplified) | Model families overview, cost considerations, when to use which model. | — | Omer Wolf |

---

### MAKERS M2 — Tooling & Context

**Objective:** TBD
**Assessment:** TBD

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 6 | Use Rules Commands | Simplified creation and usage of rules/commands in AI tools. | — | TBD |
| 7 | Use Skills | Simplified skill creation and usage patterns. | — | Noah Lerner |
| 8 | Context Window + Management | Context window mechanics, strategies for managing context effectively. | — | Omer Wolf |
| 9 | Run MCP — Read + Write | MCP protocol basics — using existing MCP servers for read and write operations. | — | Shlomi |
| 10 | NotebookLM | Using NotebookLM for engineering knowledge management and research. | — | Omer Wolf |

---

### MAKERS M3 — Advanced Workflows & SDLC Integration

**Objective:** Create a Plugin for SDLC Workflow (includes hooks).
**Assessment:** TBD
**Level owner:** Matan

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 11 | Model Selection (Advanced) | Model families and architecture differences (fast/reasoning). Capability benchmarking for coding tasks. Context window limitations and strategies (summarization, chunking). Cost vs performance tradeoffs. Model specialization for specific dev tasks. Dynamic model switching + multi-model orchestration patterns. | 1h | Omer Wolf |
| 12 | Full Workflow | PBI → Implementation Plan → Test Plan → Code Implementation → Docs. Includes version for PMs and Data Engineers. | 2h+ | Omer Wolf |
| 13 | Memory | Why memory matters for AI coding. Session context vs persistent memory. Storing project knowledge (architecture decisions, conventions, domain rules, patterns). Preventing context drift and hallucinations. Updating and pruning memory stores. Security and sensitive data handling. | 1–1.5h | TBD |
| 14 | Hooks | What hooks are in AI tools. Event-driven AI workflow automation. Hook events — integrate agent execution lifecycle. Types (Commands, Prompt, Agent). Hook inputs (arguments). Usage — enforcing coding standards, validation hooks for generated code. Debugging hook execution failures. Security considerations. Practice: Building memory system with hooks. | 1.5h | TBD |
| 15 | Plugins | What is a plugin, why we need them (versioning, grouping). Plugin marketplace. Required vs optional plugins. Plugin/marketplace config. Install and create plugins. | 30min–1h | TBD |
| 16 | Non-Code Workflows | Hands-on creation of non-code workflows: product discovery, analyzing records & generating reports, and other knowledge work. | 1.5–2h | TBD |

---

### BUILDERS B1 — Building AI Tools & Agents

**Objective:** TBD
**Assessment:** TBD
**Level owner:** Daniel O

| # | Session | Key Topics | Duration | Lead |
|---|---------|------------|----------|------|
| 17 | Create Skills — Advanced (Prompt Engineering) | System prompt architecture. Few-shot & chain-of-thought design. Dynamic prompt composition. Evaluation & iteration loops. Token budget & cost optimization. | 3h workshop | Daniel O |
| 18 | Write MCP / Tools | MCP protocol fundamentals. Implementing tool schemas. Server-side tool handlers. Testing & mocking MCP servers. Publishing & versioning MCP servers. | 3h workshop | Daniel O |
| 19 | Agents: Prompted vs Runtime Autonomous | Taxonomy of agent architectures. Prompt-driven orchestration. Goal & subgoal decomposition. Memory & state management. Handoff patterns & human-in-the-loop. | — | TBD |
| 20 | Agent Loop | Observe–Think–Act–Reflect cycle. Tool call parsing & dispatch. Loop termination & convergence checks. Error recovery & retry logic. Observability & trace logging. | — | TBD |
| 21 | Security-by-Design for AI Tools | Prompt injection & jailbreak mitigations. Least-privilege tool scoping. Data exfiltration prevention. Audit trails & accountability. Threat modeling for agentic systems. | — | TBD |
| 22 | RAG Architecture (Basic RAG) | Document ingestion & chunking strategies. Embedding models & vector stores. Retrieval pipelines & reranking. Context assembly & prompt integration. Evaluation: faithfulness & answer relevance. | — | TBD |
| 23 | Intro Claude Agent SDK / Codex / Deep Agents | Claude Agent SDK quickstart. Codex integration for code agents. Deep agent patterns & long-horizon tasks. Multi-agent coordination. Production deployment & monitoring. | — | TBD |

---

## Engineering Track — Session Lead Assignments

| Lead | Sessions | Notes |
|------|----------|-------|
| Noah Lerner | 1, 2, 4, 7 | 4 sessions (all M1/M2) |
| Omer Wolf | 5, 8, 10, 11, 12 | 5 sessions (M1 through M3) |
| Shlomi | 9 | 1 session |
| Daniel O | 17, 18 | 2 sessions (B1 workshops), also B1 level owner |
| Matan | — | M3 level owner (no sessions assigned as lead) |
| TBD | 3, 6, 13, 14, 15, 16, 19, 20, 21, 22, 23 | 11 sessions unassigned |

**Notes:**
- Noah Lerner and Omer Wolf carry the heaviest load. No max-2 rule stated for engineering yet.
- Matan owns M3 level design but isn't leading sessions. Daniel O owns B1 level design and leads 2 sessions.
- 11 of 23 sessions still need leads — concentrated in M3 and B1.

---

## Key Design Decisions

- Dual-track structure: product (14 sessions) and engineering (23 sessions) run in parallel under one Foundry brand
- Agent building split between Makers (basic agent in L3) and Builders (skills/MCP in L1)
- "Evaluating AI Output" moved from L2 to L3 to create a judgment-oriented capstone
- Builders L1 scoped to operational AI (automating team workflows/processes/decisions), not product AI
- Session 6 enriched with research/competitive intel and data/metrics — adapting Feb workshop Track 2 and Track 4
- All participants have Cursor pre-installed before L3 begins
- "Simulate stakeholder reviews pre-meeting" is a parking lot idea (could fit L2 or L3)
- "PRD skill that learns over time" is a parking lot idea (could fit Builders L1, Session 11 or 13)
- **"Developing for Agents"** — designing products for agent-as-user consumption (source: Oren Ryngler, CPO). Agent-to-agent interaction surface: APIs as primary interface, permission models for non-human consumers, escalation patterns when agents talk to agents. The entire interaction layer (onboarding, empty states, contextual nudges) assumes a human is watching — what happens when it's another AI? Deserves its own session in both tracks. Product: "Designing for Agent Consumers." Engineering: "Agent-Ready Architecture." Likely Builders or Masters level.
- **"Build an App" (PM track)** — two-part topic:
  - *Makers (L1/L2)*: Intro to no-code AI app building (Lovable or similar). PMs ship a simple working app in one session. Mindset shift: from "request a tool" to "build the tool." Standalone session, not bolted onto existing use-case sessions.
  - *Builders*: Build shareable internal applications — connect to real data, serve a team, handle auth, persist state. The prototype-to-production bridge.

---

## External Benchmark

Reviewed "Claude Code for PMs Mastery" (6 parts, 27 lessons, external paid course). Key takeaways incorporated:
- Research & Discovery and Data & Decisions were gaps — folded into Session 6
- "PM Operating System" concept — our L3 capstone + Builders arc covers this
- Sub-agents content reserved for Builders L2+

---

## What Success Looks Like

**Makers graduate:** Measured power user with agent literacy, critical judgment, and a working personal agent in daily use.

**Builders L1 graduate:** Custom skills, MCP integration, team workflow POC with a spec document ready for L2 handoff. Has built a team of agents working on real data.

**Engineering Makers graduate:** Proficient AI-assisted developer with context management skills, capable of building plugins for SDLC workflows.

**Engineering Builders L1 graduate:** Can build custom skills, MCP servers, and understand agent architectures. Ready for production AI tooling.

**The overall promise:** An AI-powered toolkit for every PM task (product track) and every engineering task (engineering track).

---

## Timeline

- **Announce:** Week of March 22–23, 2026
- **Registration open:** 2–3 weeks after announcement
- **First lessons:** After Passover (~mid April 2026)
- **First cohort size:** 10–20 per track

---

## Entry & Exit Criteria (TBD)

Each level needs clearly defined criteria before registration opens:

| Level | Minimum to Attend | Overqualified Threshold | Expected Outcome |
|-------|-------------------|------------------------|------------------|
| Product Makers L1 | TBD | TBD | TBD |
| Product Makers L2 | TBD | TBD | TBD |
| Product Makers L3 | TBD | TBD | TBD |
| Product Builders L1 | TBD | TBD | TBD |
| Engineering M1 | TBD | TBD | TBD |
| Engineering M2 | TBD | TBD | TBD |
| Engineering M3 | TBD | TBD | TBD |
| Engineering B1 | TBD | TBD | TBD |

**Purpose:** Enables cohort selection (who fits, who doesn't), supports the 10–20 cap per track, and sets clear expectations for participants.

**Open decision:** Need to decide with Tal what subset of sessions forms the first class — not necessarily all sessions in the first cohort.

---

## Security Sessions — CISO Involvement

Security sessions (Product S3, Engineering S3, Engineering S21) need CISO input. Critical framing principle: **enablement, not restriction** — "what we CAN do with AI responsibly," not "what we can't do." Yonatan to initiate conversation with CISO.
