
Executive take

The clearest pattern is not “AI replaces teams.” It is smaller, more cross-functional teams with higher bars for autonomy, stronger shared platforms, and a shift of human effort upward: PMs spend less time on process and more on problem framing; engineers spend less time typing code and more on architecture, review, orchestration, and system quality; design becomes more important, not less, because AI makes rough output cheap but trustworthy product quality still expensive. Shopify, Wix, Klarna, Mercury, Anthropic, GitHub, Vercel, Figma, Intercom, Reforge, and OpenAI all point in roughly that direction, even when they disagree on how far or how fast to push it.  ￼

For a large fintech, the strongest version of this model is usually not a pure “2 PMs and 1 engineer” thought experiment. It is a 4–5 person pod with 1 product lead, 2–3 product/full-stack engineers, and 1 designer or design-heavy product engineer, sitting on top of strong shared AI/platform/security/data capabilities. In regulated environments, the limiting factor is usually not code generation but trust, controls, context, and operational reliability.  ￼

1) Team structure and composition

What companies are actually doing

Shopify: Tobi Lütke’s April 2025 memo made “reflexive AI usage” a baseline expectation, with the practical implication that teams should use AI before asking for more headcount. That is not a formal public org chart, but it is a very strong operating signal: fewer automatic hires, more AI-leveraged execution inside existing teams.  ￼

Wix: Wix publicly said in April 2025 that it was rethinking R&D across engineering, product, UX, and content as a company-wide AI-first initiative, and in March 2026 its leadership described the “xEngineer” model: smaller teams, end-to-end ownership, and less rigid frontend/backend/mobile/infrastructure separation. CTO Yaniv Even Haim explicitly framed the goal as enabling one person to complete more tasks end-to-end.  ￼

Mercury: In a July 2025 interview published by Linear, Matt Russell described using agents to reduce tech debt, enable internal teams, and route repeatable requests from ops through templates into AI-generated PRs, with engineers still reviewing and approving. That is close to a real-world example of a small team increasing surface area without adding a large service layer.  ￼

Anthropic: Anthropic’s internal teams use Claude Code across engineering, design, security, marketing, legal, and data science. Their Product Engineering team uses it as a “first stop” for programming tasks, and their Product Design team uses it for tests and PR-comment automation. That is a strong example of technical boundaries softening inside a company building with agentic tools daily.  ￼

Vercel / Leonardo.AI / Relevance AI: Vercel’s March 2026 write-up argues some AI-native startups are scaling globally without dedicated DevOps teams because the platform absorbs that layer. That is vendor-authored, so it should not be overgeneralized, but it is useful evidence that some high-growth AI companies are centralizing infra into platform rather than embedding it per squad.  ￼

Klarna: Klarna is the cautionary example. It aggressively used AI to cut costs and headcount, then by September 2025 Reuters reported CEO Sebastian Siemiatkowski said Klarna may have gone too far and was shifting from cost-cutting to improving services and products. That matters because it shows that AI-first reorgs can overshoot when they optimize labor reduction faster than product or service quality.  ￼

PM-to-engineer ratio: what seems to be changing

There is real evidence that the historic PM:engineer ratio is under pressure. Andrew Ng wrote in January 2025 that many companies traditionally ran around 6 engineers per PM, often somewhere between 4:1 and 10:1, and argued that as coding gets cheaper, PM and design work become a larger fraction of the bottleneck. In a July 2025 YC talk, he described one AI Fund team proposing a shocking 1 PM to 0.5 engineers ratio. He did not endorse it as universally correct, but he used it as a sign of directional change.  ￼

My read: for a regulated fintech, the likely near-term destination is not PMs outnumbering engineers. It is more like:
	•	fewer engineers than a traditional team needed for the same delivery surface,
	•	more PM/design fluency inside the pod,
	•	more engineering time spent on reliability, controls, architecture, and review,
	•	more shared platform leverage.
That interpretation is more consistent with what Mercury, Wix, Anthropic, GitHub, and OpenAI describe in practice.  ￼

Embedded vs shared roles

The most defensible split for a 4–5 person AI-native product pod is:

Embed in the team
	•	Product lead / AI-native PM
	•	2–3 product engineers or full-stack engineers
	•	1 designer or design-heavy product engineer

Keep shared but tightly coupled
	•	Data / analytics
	•	ML platform / AI platform
	•	DevOps / platform engineering
	•	Security / privacy / model governance
	•	Risk / compliance / legal partners in fintech

Why this split? Because the execution bottleneck is moving toward product judgment, end-to-end delivery, and interface quality, while the hardest reusable problems are platform, observability, knowledge/context systems, governance, and security. Vercel’s “no dedicated infrastructure teams” point supports centralizing infra when the platform is strong; Figma’s 2025 data point that 80% of development leaders said design has become more important supports keeping design close, not distant.  ￼

2) Role definitions

How the PM role is changing

Reforge’s 2025 work makes the shift clear: the mechanical parts of prioritization, project tracking, and backlog handling are increasingly automatable, so the PM role moves toward the strategic “why,” judgment, and product intuition.  ￼

In practice, the AI-native PM or builder PM does a few things differently:
	•	prototypes directly instead of waiting for a full handoff,
	•	uses AI for first-pass analysis, synthesis, PRDs, and test plans,
	•	curates context for agents and the team,
	•	specifies evaluation criteria early,
	•	spends more time on edge cases, trust, and human escalation logic,
	•	stays close to users because AI makes output cheap but does not make insight cheap.
Affirm SVP Product Vishal Kapoor’s 2026 guidance is especially relevant for fintech: AI speeds exploration, but “critical insight comes from thoughtful human disagreement,” and there is “no substitute” for staying close to real customer emotion in finance.  ￼

So a strong definition of the role is not “PM who can prompt.” It is PM who can frame the problem, build an informed first version, define the quality bar, and run a human+agent system.  ￼

How the engineer role is changing

Wix’s xEngineer language is among the clearest public formulations: engineers move from code producers to problem definers, system designers, and orchestrators of intelligent tools. Mercury’s Matt Russell similarly describes a future where senior engineers act more like project leads over a set of agents. OpenAI’s AI-native engineering guide says agents handle scaffolding and translation work while engineers focus on core logic, architecture, quality, and reliability.  ￼

So the practical shift is:
	•	less time writing boilerplate,
	•	more time setting guardrails,
	•	more time reviewing generated code,
	•	more time defining interfaces, tests, and reliability standards,
	•	more time debugging ambiguous multi-system failures,
	•	more time choosing where not to automate.  ￼

New roles emerging

The strongest evidence for “new roles” is uneven, but several patterns are becoming visible:

AI platform / reliability / evaluation roles: Anthropic’s context-engineering and harness guidance, plus GitHub’s agentic workflow work, point to new importance for people who can build agent environments, evals, guardrails, and review loops.  ￼

Automation specialists / agent builders: Intercom’s 2025 support planning explicitly names roles like conversation designer and support automation specialist, responsible for workflow logic and backend actions that agents can execute. That is support-specific, but the pattern maps well to product teams building internal or customer-facing agents.  ￼

Field / applied AI engineers: Reuters reported in February 2026 that OpenAI and Anthropic both increasingly rely on deployed technical roles to embed with strategic customers, especially in regulated industries like finance and healthcare.  ￼

Product engineer: This is not brand new, but AI is making it more central. Anthropic’s Product Engineering examples, Intercom’s design hackathon with almost no engineering support, and Vercel/v0’s prompt-to-app model all reinforce a more vertically integrated builder profile.  ￼

Is frontend/backend distinction dying?

Evidence for “yes, it is weakening”
Wix says AI is eroding strict domain boundaries and reducing the need for rigid frontend/backend/mobile separations. Anthropic says agentic coding is dissolving some boundaries between technical and non-technical work. Figma argues more generally for the rise of generalists and cross-disciplinary fluency.  ￼

Evidence for “not really, not in all contexts”
Intercom is still making deliberate bets on frontend engineering as a distinct craft. Deep specialization still matters when quality, scale, accessibility, performance, or compliance matter. Even Wix says specialization does not disappear; the baseline expectation just changes.  ￼

My conclusion: the distinction is not dying, but it is becoming less organizationally rigid. Expect more generalist delivery inside pods, with deep specialists remaining essential as shared experts or as senior anchors in harder domains.  ￼

3) Operating model

How autonomy changes

AI-native autonomy is less about “no oversight” and more about higher local execution power with stronger review systems. Mercury lets repeatable internal requests flow to agents and then to PR review; GitHub’s vision is agents that act independently but stay transparent, test their own work, and keep humans in control; Anthropic’s data show people are delegating more autonomy over time, but not fully walking away.  ￼

The decision model tends to shift like this:
	•	humans set goals, constraints, quality bar, and escalation rules;
	•	agents execute bounded tasks and first drafts;
	•	humans review risk, correctness, UX, and policy-sensitive cases.  ￼

Infrastructure prerequisites before a team can truly be AI-native

This is where many companies underinvest.

At minimum, you need:
	1.	Repo readiness: clean structure, tests, sensible scripts, consistent conventions.
	2.	Context infrastructure: shared docs, architectural decisions, style guides, domain rules, reusable prompts or skills, and ideally structured context files like Anthropic’s CLAUDE.md style approach.  ￼
	3.	Agent harnesses: a way to initialize context, define feature lists, run checks, persist memory, and constrain tools. Anthropic’s long-running harness guidance is directly relevant here.  ￼
	4.	Eval and review loops: automated checks, test coverage, PR review, and quality gates. GitHub’s agentic workflow and code review materials are useful references.  ￼
	5.	Knowledge management: not just documents, but curated, current context. Anthropic’s context engineering piece makes this a first-class discipline.  ￼
	6.	Security and policy guardrails: especially in fintech, including data access controls, prompt injection defenses, auditability, and approval flows. Anthropic’s sandboxing and security framing around autonomous coding is a reminder here.  ￼
	7.	Shared platform services: deployment, observability, model access, logging, secrets, retrieval, approval chains, and monitoring, so the pod does not re-solve them. Vercel’s small-team/no-DevOps examples are an extreme version of this principle.  ￼

What the workflow looks like

The public evidence points toward prototype-first, spec-lite, review-heavy workflows rather than classic PRD-first handoff models.

Examples:
	•	Linear explicitly markets workflows “from drafting PRDs to pushing PRs.”  ￼
	•	GitHub describes an “idea to PR” path using agentic workflows, tested PRs, and MCP-based context.  ￼
	•	Mercury uses templates and “notes for AI,” then agent-generated PRs reviewed by engineers.  ￼
	•	Anthropic’s own teams use agents for codebase navigation, tests, PR comments, debugging, and bug fixes.  ￼
	•	Vercel argues agents work best when narrowly scoped and built on solid software practices.  ￼

A realistic fintech workflow looks like:
	1.	problem framing + success criteria,
	2.	fast prototype,
	3.	red-team / risk / policy checks for critical flows,
	4.	agent-assisted implementation,
	5.	agent-assisted test generation and review,
	6.	human signoff on correctness, compliance, and UX,
	7.	post-ship telemetry and evals.
That sequence is much more robust for regulated products than a pure “one-shot prompt to production” model.  ￼

4) Transition path

How organizations move from traditional to AI-native

The credible pattern is not “big-bang reorg.” It is staged adoption.

Wix described a company-wide initiative with pillars for tooling, support functions, and confidence-building. Shopify started by making AI a baseline expectation culturally. Mercury started with repeatable internal use cases. Anthropic shows teams adopting use case by use case across functions.  ￼

A practical step-by-step transition for a large fintech would be:

Phase 1: make AI execution normal
	•	baseline tools,
	•	default prompt/code/research workflows,
	•	internal examples and demos,
	•	shared templates and context packs.
This looks a lot like Shopify’s cultural move and Mercury’s IC-led experimentation.  ￼

Phase 2: harden the environment
	•	repo cleanup,
	•	test and CI upgrades,
	•	knowledge/context system,
	•	role expectations reset,
	•	security and governance layer.
This maps closely to Anthropic’s harness/context work and GitHub’s agentic review model.  ￼

Phase 3: redesign pods
	•	collapse handoffs where possible,
	•	move to smaller end-to-end teams,
	•	centralize reusable platform/data/security functions,
	•	redefine PM and engineer responsibilities.
This is where the Wix xEngineer idea becomes most useful.  ￼

Phase 4: operate with measured autonomy
	•	bounded agent roles,
	•	evals,
	•	human approval on high-risk actions,
	•	production monitoring,
	•	explicit escalation logic.  ￼

Failure modes

1. Optimizing cost before quality
Klarna is the clearest public warning. The company got headline value from AI-driven efficiency, but later acknowledged it had gone too far and shifted focus toward better services and products.  ￼

2. Talent hollowing
Reuters reported in August 2025 that new-grad hiring had fallen sharply, citing Signalfire data, and broader reporting in late 2025 and early 2026 reflects growing concern that firms may over-prune entry-level roles. At the same time, OpenAI and Accenture are publicly maintaining early-career pipelines, which suggests better operators may treat junior hiring as a strategic capability, not dead weight.  ￼

3. Weak context and messy repos
Without curated context, agent performance degrades fast. Anthropic’s context engineering guidance exists because this is a real operational problem, not a nice-to-have.  ￼

4. Believing frontend/design can be “absorbed” completely
Figma’s research and Intercom’s own work both suggest design craft is becoming more important as AI output grows.  ￼

5. Confusing autonomy with unsupervised execution
The strongest current operator pattern is review-heavy autonomy, not blind delegation. Mercury, GitHub, and Anthropic all reinforce that.  ￼

What month 1 vs month 6 should look like

Month 1
	•	one pilot pod,
	•	high-leverage but bounded scope,
	•	strong product/engineering/design trio,
	•	shared AI/platform/security support,
	•	default use of AI for prototyping, analysis, test generation, PR review,
	•	explicit context pack and review gates.
This is about proving a working system, not maximizing autonomy immediately.  ￼

Month 6
	•	pod operates end-to-end on a live problem area,
	•	agents participate in coding, testing, review, triage, and internal tooling,
	•	measurable reduction in lead time and dependency overhead,
	•	clearer role evolution,
	•	reusable harnesses, context assets, and evals,
	•	a second and third pod can copy the model.
That trajectory aligns with the staged stories from Mercury, Anthropic, GitHub, and Wix.  ￼

5) Contrarian and underexplored takes

What skeptics are saying

The best skepticism is not “AI won’t matter.” It is:
	•	quality breaks before org charts do,
	•	regulated domains have slower true autonomy curves,
	•	headcount cuts are easier than capability redesign,
	•	many “AI-native” claims are really platform leverage plus better tooling,
	•	small elite teams may create fragile talent systems if they stop training the next generation.  ￼

What is being underestimated

Context engineering is a core org capability
A lot of discourse still treats prompting as the key skill. Anthropic’s 2025 work suggests the real frontier is context engineering and harness design.  ￼

Design becomes more critical, not less
Figma’s 2025 reporting is one of the clearest counters to the “design is commoditized” story. AI lowers the cost of rough output; it does not lower the need for taste, trust, clarity, and refinement.  ￼

AI-native teams need more systems thinking, not just more builders
The new bottleneck is often integration: context, reviews, evals, permissions, compliance, observability. That is why shared platform functions still matter.  ￼

Fintech is different
Public examples from commerce and software are useful, but financial services have heavier trust and regulatory requirements. Affirm’s product perspective is particularly relevant here: real customer understanding, transparency, and trust remain human-led advantages.  ￼

Recommended model for your use case

For a large fintech, I would start with this pod shape:

Core pod (4–5 people)
	•	1 AI-native Product Lead
	•	2 Product Engineers / Full-stack Engineers
	•	1 Senior Engineer with strong systems/reliability instincts
	•	1 Product Designer or design-heavy Product Engineer

Shared matrix
	•	AI platform / LLM infra
	•	Data / analytics
	•	Security / privacy / governance
	•	Risk / compliance
	•	DevOps / platform
	•	User research as needed

Operating principles
	•	prototype before heavy documentation,
	•	one shared context system,
	•	AI-first by default, not AI-only,
	•	human signoff for regulated/high-risk decisions,
	•	end-to-end ownership inside the pod,
	•	evals and review loops before scale.

That structure is the closest match to the evidence: small enough to move fast, broad enough to avoid brittle heroics, and controlled enough for fintech reality.  ￼

Most useful source set

The most valuable sources for this topic were:
	•	Reforge on AI-native product teams and PM role change.  ￼
	•	Shopify’s 2025 memo and company framing.  ￼
	•	Wix on AI-first R&D and the xEngineer model.  ￼
	•	Mercury/Linear on small-team agent workflows.  ￼
	•	Anthropic on internal Claude Code usage, context engineering, and harnesses.  ￼
	•	GitHub on agentic workflows and code review.  ￼
	•	Figma and Intercom on why design and cross-functional craft still matter.  ￼
	•	Reuters on Klarna and labor-market caution signals.  ￼
