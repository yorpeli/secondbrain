# AI-Native Team Operating Model — Week 3 Workstream Snapshot

**Workstream Lead:** Yonatan Orpeli (VP Product, CLM) & Tal Arnon (VP Engineering)
**Facilitator:** [TBD — assigned from Liat's team]
**Date:** March 25, 2026

---

## 1. End-State Vision: Target Architecture (To-Be)

**What does a full AI-native flow look like in this stream?**

A product organization where the default operating unit is a **core pod of 3** (1 PM + 2 Engineers), working in a continuous loop of Discovery → Problem Frame → Co-Solve → Harden → Ship + Measure. AI is embedded in how the team works — not as a separate tool layer, but as the reason the team structure itself changes.

**Key building blocks:**

| Building Block | Description |
|---|---|
| **Data layer** | Shared context infrastructure — living documentation that serves both humans and AI agents. Replaces static specs and handoff artifacts. |
| **Governance & guardrails** | Blast radius framework (L0–L4) that calibrates team autonomy to potential impact. Applies equally to human decisions and AI agent actions. |
| **Models / agents** | AI agents embedded in the development loop — generating code, synthesizing research, prototyping solutions. Engineers orchestrate agents rather than writing every line. |
| **Orchestration / workflows** | The Co-Solve loop: PM and engineer work simultaneously (not sequentially) with AI doing the mechanical building. No handoffs, no PRDs, no sequential gates. |
| **Interfaces** | PM prototypes directly with AI tools; engineers review and harden. Shared IDE environments where PM and engineer collaborate in real time. |

**What exists today vs. what is missing:**

| Exists Today | Missing / In Progress |
|---|---|
| Complete operating model article (published internally) | First live pod to validate the model |
| PM job description — in active recruitment via iTalent | Engineer role definition (co-developing with Tal Arnon) |
| Blast radius governance framework (L0–L4) | Organizational enablement — hiring flows adapted for AI-native roles |
| Research foundation (13+ sources, competitive benchmarks) | Cross-pollination mechanisms between pods |
| Flex-point model for team variants | Transition playbook for existing teams |

**Main workstream outputs:**
- AI-Native Team Operating Model article (complete)
- PM and Director job descriptions (shared with iTalent, in active recruitment)
- Blast radius governance framework
- Human Contract framework (psychological safety, knowledge loss mitigation, decision protocols for small teams)

---

## 2. Quick Wins — Status & Value

| # | What (Use Case) | Status | Impact | Insight |
|---|---|---|---|---|
| 1 | **Operating model article** — codified how AI-native pods should work, end-to-end | Done | Shared language and framework for all stakeholders; basis for hiring, enablement, and org design conversations | Writing it as an opinion piece (not a framework) made it actionable and shareable — people engage with a point of view |
| 2 | **PM JD shared with iTalent** — recruitment started for Principal PM (IC) and Director roles | In progress — active search | Hiring pipeline open; recruiter and candidate reactions validating role definitions | JD needs to be validated against AI-native hiring flow — traditional recruitment filters may screen out the right candidates |
| 3 | **Research landscape synthesis** — 13+ sources including competitive benchmarks (Mercury, Wix, Cellebrite, Anthropic, Vercel) | Done | De-risked key design decisions (team size of 3, shared design function, no QA role); grounded the model in evidence | The strongest signal came from practitioner interviews (Wix, Cellebrite), not published research |

---

## 3. From Experiment → Capability

| Quick Win | POC / Tool / Capability? | Architecture Mapping | What's Required to Scale | Expected Adoption |
|---|---|---|---|---|
| Operating model article | **Scalable capability** — the operating model itself is the blueprint for organizational scaling | Defines all building blocks (governance, workflows, team structure) | Organizational buy-in, first pod as proof point, enablement program | All product + engineering teams transitioning to AI-native ways of working |
| PM JD + recruitment | **POC** — testing whether the market has candidates matching our AI-native PM profile | Validates the "who's in the team" building block | Hiring flow alignment with Liat Ashkenazi & Mor Regev; adapted interview process for pod-fit assessment | First hire validates; then scales to all new PM hiring |
| Research landscape | **Foundation** — informs all downstream decisions, not a standalone capability | Underlies governance calibration and team composition decisions | Needs periodic refresh as industry practices evolve | Used by leadership for decision-making; by HR for JD calibration |

---

## 4. Dual Horizon Plan

### Next 6–12 Weeks (Execution)

| # | Milestone | Owner | Deliverable | Key Dependencies |
|---|---|---|---|---|
| 1 | **Align on hiring flows for AI talent** | Yonatan + Liat Ashkenazi + Mor Regev | Adapted recruitment and interview process for AI-native roles | Internal alignment on process changes |
| 2 | **Understand AI DLC team capabilities** | Yonatan + AI DLC team | Gap analysis — what from their work applies to our enablement needs | AI DLC team availability and willingness to share |
| 3 | **Interview AIR teams** | Yonatan + Tal | Documented learnings on current AI ways of working, pain points, and what's working | AIR team access and scheduling |
| 4 | **Enable AIR teams on operating model** | Yonatan + Tal | First teams experimenting with the pod model and Co-Solve workflow | Completed interviews; leadership buy-in from AIR leads |
| 5 | **Expand to domain teams** | Yonatan + Tal | Teams from different domains adopting AI-enabled ways of working | AIR learnings documented; domain lead buy-in |

### 6–18 Months (Transformation)

**What fundamental change will occur:**
The default team structure shifts from 5–8 person feature teams with sequential handoffs to 3-person pods with AI-embedded workflows. This isn't a process change — it's a structural redesign of how product work gets done.

**What will look materially different:**

- **People:** PMs prototype and analyze directly with AI; engineers orchestrate AI agents and focus on system integrity. New hiring profiles reflect this.
- **Process:** No PRDs, no handoff specs, no estimation ceremonies. Continuous Co-Solve replaces the spec→build→review sequence. Blast radius framework replaces approval committees.
- **Product:** Faster cycle times (days/weeks vs. months). More experimentation — testing 3 approaches in a day instead of committing to 1 per sprint. Higher quality decisions because exploration cost drops dramatically.

---

## 5. Metrics — From Learning to Impact

| Question | Answer |
|---|---|
| **What is measured today?** | Recruitment pipeline metrics (iTalent candidates in funnel). Qualitative feedback from stakeholder reviews of the operating model. |
| **What should be measured next?** | Time-to-first-prototype for teams adopting Co-Solve workflow. Interview-to-hire conversion for AI-native JDs vs. traditional. Team satisfaction and collaboration quality in pod experiments. |
| **When will we be able to measure?** | Once first teams begin experimenting (target: 6–8 weeks). Hiring metrics available once interview pipeline matures (4–6 weeks). |
| **Gaps in measurement?** | No baseline yet for traditional team cycle times to compare against. Need to establish measurement framework before first pod launches. Productivity metrics for AI-augmented work are industry-wide unsolved. |

---

## 6. Risks & Trade-offs

| # | Risk | Type | Mitigation |
|---|---|---|---|
| 1 | **Hiring market may not have AI-native PM profiles** — the role we're describing is emerging; candidate pool is thin | Organizational | iTalent actively searching; JD designed to attract builder-PMs. Candidate reactions will signal if we need to adjust. |
| 2 | **Resistance from existing teams** — current team leads may see pod model as threatening to their structure | Organizational | Starting with willing teams (AIR), framing as experimentation not mandate, demonstrating value before scaling. |
| 3 | **Model unproven at Payoneer scale** — our operating model is well-researched but untested internally | Execution | First pod is explicitly an experiment. Built-in feedback loops. Committed to course-correcting based on evidence, not defending the model. |

**Real trade-offs:**
- **Speed vs. thoroughness:** We could spend more time refining the model before experimenting, but we believe the learning comes from practice, not from more documents. We're choosing to move fast and iterate.
- **Centralized design vs. domain autonomy:** The operating model proposes a universal pod structure with flex points. Some domains may need more customization. We'll learn this from the AIR experiments.

---

## 7. Decisions Needed

| # | Decision | Why It Matters | Who Decides |
|---|---|---|---|
| 1 | **Hiring flow adaptation for AI-native roles** — current recruitment process is built for traditional roles and may filter out pod-fit candidates | Without this, we hire the wrong people or lose the right ones | Liat Ashkenazi + Mor Regev + Yonatan |
| 2 | **Which AIR teams to start with** — need to select teams for initial interviews and enablement | Wrong team selection delays learning; right selection creates momentum | Yonatan + Tal + AIR leadership |
| 3 | **Domain for first full pod** — bounded problem space, real autonomy, real users | The first pod is the proof point; wrong scope undermines credibility | Yonatan + Tal + Oren/Liat |

---

## 8. Overall Self-Assessment

| Dimension | Rating | Explanation |
|---|---|---|
| **Proof of Value** | **Yellow** | Operating model is complete, well-researched, and reviewed by stakeholders. But value is proven when a real team operates this way — we're pre-experiment. |
| **Scalability Potential** | **Green** | The model is designed to scale — flex points handle team variants, blast radius framework handles governance. The architecture is built for organizational adoption. |
| **Architectural Clarity** | **Green** | End-state is clearly defined: pod structure, workflow loop, governance framework, shared functions model. All documented and internally consistent. |
| **Measurement Maturity** | **Red** | No quantitative metrics yet. Measurement framework needs to be built before first pod launches. This is expected at this stage — we're still pre-experiment. |

---

## Summary Table

| Dimension | Answer |
|---|---|
| **Top Quick Win** | Complete AI-native operating model article — shared language and framework for the entire initiative |
| **Proven Value** | Operating model validated through research (13+ sources), stakeholder reviews, and practitioner input (Wix, Cellebrite). Recruitment started based on it. |
| **Scalable Capability** | The operating model and governance framework are designed for org-wide adoption. Flex-point architecture handles team variants without separate models. |
| **Architecture Readiness** | End-state fully designed: pod structure, workflow, governance, shared functions, human contract. Gap is the transition playbook. |
| **Next 6–12 Week Focus** | Align on AI hiring flows (Liat/Mor), understand AI DLC capabilities, interview and enable AIR teams, then expand to domain teams |
| **Biggest Risk** | Model is unproven internally — strong on paper, needs real team validation. First pod experiment is the critical proof point. |
| **Key Decision Needed** | Hiring flow adaptation for AI-native roles — current process may filter out the right candidates |
| **Overall Status (R/Y/G)** | **Yellow** — Strong intellectual foundation and active recruitment, but pre-experiment. Moving to green requires first team operating in the new model. |
