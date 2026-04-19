---
title: AI-Native Team — Suggested Operating Model and Roles
status: Working draft for Oren's review
authors: [Yonatan Orpeli, Tal Arnon]
date: 2026-03
source: "AI Native Team II.docx"
---

# AI-Native Team — Suggested Operating Model and Roles

## Executive Summary

This document defines what an AI-native product team looks like at Payoneer — how it is structured, how it operates, and what it requires from the people in it and the organization around it.

**Core premise:** AI tools compress the distance between problem and solution. A team of 1 PM + 2 Engineers, supported by shared design and data resources, can do what previously required a much larger group — provided the people have the right profile and the operating model is designed for it.

> **Status:** Working draft for Oren's review. The engineer role section is a placeholder — to be completed by Engineering leadership.

---

## The Vision

The bar for great product work has not changed. Strong judgment, clear ownership, customer proximity, accountability for outcomes — these have always been the standard. What has changed is everything around it.

Execution is faster and cheaper than it has ever been. Engineers are using AI to write and review code. PMs can synthesize markets, run analyses, and prototype ideas in hours instead of weeks. The operational overhead that once justified large, process-heavy teams is dissolving.

When you can build faster with fewer handoffs, the differentiator becomes **quality of judgment** and **depth of customer insight**. The gap between strong practitioners and mediocre ones is now visible almost immediately. There is no longer cover behind coordination overhead, slow data access, or multi-step process as a substitute for real product thinking.

An AI-native team is built for this environment. It is small, autonomous, and accountable for outcomes.

> **Core Shift:** We are not making teams smaller. We are making the people in them more capable — and designing the operating model to match.

---

## Part 1: How the Team Works (Operating Model)

The operating model is built around one organizing idea: **this team has the tools, the context, and the judgment to move without waiting for permission — within defined boundaries.**

### Autonomy by Default

The team owns its roadmap, execution, and outcomes. It does not require sign-off on every decision. It defines hypotheses, runs experiments, interprets results, and makes calls. Autonomy is earned through transparency: the team moves fast and writes down what it does.

### Blast Radius Thresholds (L0–L4)

Not all decisions are equal. The team operates within a tiered framework that defines independent authority relative to potential impact.

| Level | Label | Description |
|-------|-------|-------------|
| **L0** | Self-serve | Low-impact. Team acts and documents. No sign-off needed. |
| **L1** | Inform | Moderate impact. Team moves, then notifies stakeholders promptly. |
| **L2** | Consult | Meaningful impact. Team aligns with a cross-functional partner before acting. |
| **L3** | Approve | Significant business/regulatory impact. Explicit approval required. |
| **L4** | Strategic Gate | Company-level or irreversible decisions. CTPO/leadership alignment required. |

Specific thresholds are defined with leadership at team setup and revisited as the team matures. The framework exists to enable speed, not constrain it.

### Outcomes Over Artifacts

The team is measured by business outcomes — conversion rates, approval rates, ticket reduction, activation, revenue — not by the artifacts it produces. PRDs, decks, and reports exist to support the work. They are not the work.

### Documentation as Operating Discipline

Moving fast and documenting well are not in conflict. The team maintains clear records of decisions made, experiments run, and lessons learned. The standard: **if a team member left tomorrow, the work would not stop.**

### Cross-Pollination as a Responsibility

Every AI-native team is a learning node for the broader organization. When the team finds a better approach, it shares it. This is a core responsibility, not a voluntary contribution. Teams will be part of an always learning, always evolving Platform organization.

### Operating on Context, Not Instructions

This team does not wait to be told what to do next. It operates from deep business context, customer understanding, and strategic clarity — and uses that to make the next right call independently. Hiring for this model means hiring for judgment, accountability, and the ability to hold complexity without needing it resolved from above.

---

## Part 2: Team Composition (Structure)

### Core Team: PM + 2 Engineers + 1 DevOps Engineer

Three to four people with the tools, context, and accountability to take a problem from discovery to production. The lean ratio is intentional: AI handles what previously required additional headcount — research synthesis, data querying, documentation, prototyping, testing. The people do higher-value work that AI cannot own.

### Cross-Functional Layer: Design & Data

**Design — Why It Is Not Embedded**

In an AI-native team, the PM and engineers have direct access to component libraries, design systems, and tools that enable rapid visual iteration. The better model: a designer who sits across multiple teams and owns consistency at the system level. They define and maintain the design language, are available for specific component decisions, and ensure that development speed does not erode product coherence.

**Data — Why It Is Not Embedded**

The PM owns their data directly — query, analyze, decide. No waiting for dashboards or BI tickets. This only works if the underlying data is trustworthy.

> **The Data Shift:**
> - **From:** PM requests analysis, analyst produces dashboard.
> - **To:** Analyst owns data integrity and structure. PM owns analysis and decision.

---

## Part 3: Role Definitions

### The Product Manager Role

The PM on an AI-native team is a business owner in the fullest sense. They own the problem space, the customer, the data, the roadmap, the communication, and the outcome.

**The three things that matter most: judgment, bias for action, and creativity. AI fluency is table stakes.**

#### PM — What You'll Do

- Own the full product lifecycle — discovery, definition, delivery, post-launch learning — end-to-end
- Develop deep customer understanding. Spend real time with users.
- Run and interpret your own data. Build queries, track cohorts, make evidence-based decisions.
- Define and manage experiments with statistical rigor.
- Orchestrate AI agents and tools to accelerate research, synthesis, and execution.
- Communicate decisions clearly and proactively.
- Document what the team learns. Share it across the organization.
- Operate in a high autonomy environment with high sense of ownership.

#### PM — Who You Are

- 6+ years of product management experience with a track record of owning business outcomes
- Commercially minded — product decisions connect directly to metrics that matter
- Strong analytical instincts — work directly with data
- High agency — move without being pushed
- Technically fluent — substantive conversations with engineers, make trade-offs
- AI-native — AI tools are a core part of how you work (not optional)
- Clear communicator — write and speak with precision
- Curious and honest — ask hard questions, share what didn't work

### The Engineer Role

> **Placeholder** — To be completed by Engineering Leadership, in alignment with the operating principles in this document.

Key inputs to consider:
- How the engineer's relationship to code production changes when AI agents handle significant portions of implementation
- What quality ownership means when much of the code is AI-generated — and how the engineer functions as the guardrail
- The architectural thinking required to design systems that agents can work within reliably
- How the engineer collaborates with a PM who is more directly involved in implementation than in a traditional model

### AI-Native Builder / Engineer (Suggested JD)

**The Opportunity:** No hand-offs between Product, Engineering, and DevOps. Building systems that blend probabilistic AI with deterministic logic. Each engineer is a team by itself.

#### What You'll Actually Do

- **100X engineer model:** All resources to build and ship the solution directly from your CLI.
- **Co-Design:** Work directly with your squad to define decision logic, capability, risk thresholds, and success metrics.
- **Architect for robustness and reliability:** Harness AI power not only for acceleration but for improved robustness and reliability.
- **Build the Harness:** Treat evaluation as a first-class citizen. If you can't measure decision quality, you haven't finished building it.
- **Own the Outcome:** Accountable for system performance in production. Monitoring baked into architecture from day one.

#### The "AI-Native" DNA

- **From Features to Workflows:** Think in agentic loops, skills, and workflows — not just CRUD endpoints.
- **Probabilistic Skepticism:** Models are components. Wrap them in strict, deterministic logic where needed for business safety.
- **Cost & Risk Awareness:** Intuitively understand trade-offs between latency, model cost, and decision accuracy.
- **Full Stack Ownership:** Comfortable tweaking prompts, RAG architecture, or backend orchestrator.

#### Why Join

- Small squads (3–5 person autonomous teams), no middle management
- Direct impact — code goes directly to solving core business challenges
- Next-gen tech — building production-grade AI systems, not just calling APIs

---

## What This Requires from the Organization

1. **Push autonomy down in practice.** Stop asking for the deck. Ask for the decision and the reasoning.
2. **Make access frictionless.** Tools, data, infrastructure from day one. Optimize for operational first; tighten governance after.
3. **Set guardrails clearly and early.** Define non-negotiables and blast radius thresholds at team setup.
4. **Protect learning time.** Space to experiment and occasionally fail — explicitly protected.
5. **Invest in shared context.** Define how teams share what they discover. Make it a structural expectation.
6. **Judge by outcomes.** Do not revert to artifact-based evaluation when visible process output decreases.
