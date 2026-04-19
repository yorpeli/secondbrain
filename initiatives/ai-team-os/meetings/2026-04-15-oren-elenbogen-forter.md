---
date: 2026-04-15
person: Oren Elenbogen
company: Forter
role: SVP Engineering
topics: [ai-native-teams, self-developed-products, self-guided-products, team-design, value-unit, hiring-philosophy, leadership, documentation]
---

# Meeting with Oren Elenbogen (Forter)

## Context

Discussion focused on how AI-based teams can work, where this model is heading, and the broader question:

**How do we compete with / beat those teams?**

A core theme throughout the conversation was that this is not just about adding AI to existing work. It is about rethinking:
- how products are built,
- how teams are structured,
- what roles exist,
- what leadership should do,
- and what the actual unit of ownership should be.

## Reference Points Oren Mentioned

Oren pointed to a few blog posts / reference points that describe this direction:

- **Martin Fowler Harness** — [Harness Engineering for Coding Agent Users](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html) (Birgitta Böckeler, April 2, 2026). Guides vs. sensors taxonomy for controlling AI agent output quality.
- **Anthropic Harness** — [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Prithvi Rajasekaran, March 24, 2026). GAN-inspired Planner/Generator/Evaluator architecture for multi-agent development.
- **OpenAI Harness** — [Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/) (~February 2026). Million-line codebase with zero manually-written code; engineers shift to designing environments and feedback loops.

The point was that there are already examples and published thinking that describe parts of this operating model in practice.

## Key Learnings

- **Self-developed products are becoming the baseline** — Oren described a model where products and features are increasingly built by the machine. The specific naming may change, but the core idea is that AI is not just assisting development, it is doing more and more of the actual implementation work.
- **Humans do not write code** — this came through as a strong philosophy, not just a tactical point. In many PRs, everything is being done by the machine, with humans operating at a different level.
- **Quality / availability / health metrics improve** — in the companies he referenced, and to some extent in Forter as well, he said they are seeing software quality, availability, and general health metrics improve in this AI-heavy development model.
- **All tickets should be solved and reviewed by AI** — this was one of the sharper statements in the conversation. The direction is not just AI-assisted work, but AI-first execution and review.
- **The next phase is self-guided products** — beyond self-developed products, Oren described a phase where agents do not only help decide how to build, but also help decide what to build.
- **Self-guided products could use company inputs directly** — for example: company OKRs, customer feedback, brainstorming, outreach to customers, gathering responses, running A/B tests, and using all of that to help determine what should be developed.
- **Timing is unclear** — he did not claim this is fully here now. He framed it as possibly 2026, 2027, or 2028, but as a real direction rather than a hypothetical.
- **Self-guided teams depend on documentation** — documentation was described as a key feature / key operating layer. It is not support material; it becomes essential infrastructure for how teams and agents work.
- **The key question is not team size** — Oren was very explicit that the main unit is not whether a team has 1, 2, 3, or 6 people.
- **The real atomic unit is the value unit** — what matters is the value deliverable: whether a team delivers value, impact, and revenue, and whether it can do so consistently over time.
- **Consistency and autonomy matter more than structure** — the important question is whether a team can provide value over time, consistently and autonomously. Size and structure are secondary to that.
- **Hiring should be about philosophy** — Oren said the key thing to evaluate is not whether someone can solve a coding problem in a traditional interview setting, because tools like CloudCode can already do that and candidates are expected to use them.
- **Misalignment on philosophy is a hiring problem** — if someone fundamentally does not believe in the model, for example if they reject the idea that humans no longer need to be the primary writers of code, then that is a deeper issue than skill. The hiring bar becomes philosophical alignment.
- **Leadership is mostly about change management** — one of the clearest points was that leadership’s role in this world is heavily about helping the organization transition.
- **Leadership must also define roles** — another major leadership challenge is deciding what roles should look like in this model. Should PMs stay PMs? Should engineers stay engineers? Should both become more hybrid?
- **Autonomy may need to include selling, not just building** — one especially interesting point was that if teams are truly autonomous, they may need to own more than implementation. They may need to solve for marketing, selling, and actual value realization, not only product delivery.

## Oren's Team / Product Evolution Model

### 1. Self-developed products

This is the current or near-current stage Oren described.

Characteristics:
- products increasingly built by AI,
- features increasingly built by AI,
- machines doing most implementation work,
- humans reviewing, guiding, and operating above the code layer.

Associated outcomes he mentioned:
- better quality,
- better availability,
- stronger health metrics.

### 2. Self-guided products

This is the next stage.

Characteristics:
- AI helps determine not only how to build, but what to build,
- agents can work from OKRs, customer feedback, experiments, and direct outreach,
- the machine participates in product discovery and prioritization.

Example activities he described:
- getting company OKRs,
- brainstorming directions,
- emailing customers,
- collecting responses,
- running A/B tests,
- using that information to decide what should be developed.

### 3. Self-guided teams

This is the organizational implication of the above.

Characteristics:
- documentation as a core operating layer,
- broader autonomy,
- ownership defined by value delivery rather than org chart structure,
- blurred boundaries between traditional roles.

## Core Operating Ideas

### Documentation as a key feature

Oren emphasized that documentation becomes one of the foundational elements in this model.

Not as passive documentation, but as:
- the basis for alignment,
- the layer agents can work from,
- the way a self-guided team remains coherent.

### Humans do not write code

This was one of the clearest philosophical statements in the meeting.

The point was not merely that AI helps engineers write code faster. The deeper idea is that code writing itself is moving to the machine, and human contribution shifts upward into judgment, direction, integration, philosophy, and system design.

### Value unit over team size

This was likely the strongest takeaway.

The key question is not:
- how many people are on the team,
- what the reporting structure looks like,
- how many PMs vs engineers there are.

The key question is:
- what value unit does the team own?
- does it generate impact / revenue / outcomes?
- can it do so consistently over time?
- can it do so autonomously?

## Team Design Implications

Oren’s framing implies that teams should be evaluated less by shape and more by output.

### The relevant unit of analysis

Not:
- team size,
- fixed role composition,
- classic product / engineering boundaries.

But:
- the value deliverable,
- the repeatability of value creation,
- the team’s ability to own that value end-to-end.

### What matters

A strong team in this model is one that:
- provides value over time,
- does so consistently,
- does so autonomously,
- owns the outcome rather than just the artifact.

## Hiring Philosophy

Oren was very direct that hiring should increasingly focus on philosophy.

### What no longer matters as much

Traditional problem-solving exercises matter less because:
- AI tools like CloudCode can already solve many of those problems,
- candidates are expected to use these tools,
- manual problem-solving is no longer the key differentiator.

### What matters more

Hiring for:
- alignment with the model,
- belief in the way of working,
- comfort with AI-first execution,
- philosophical compatibility with the team.

### The risk he highlighted

If someone fundamentally disagrees with the premise, for example:
- they do not believe in AI-first execution,
- they reject the idea that humans are no longer the primary coders,
- they are attached to old role assumptions,

then the issue is not just capability. It is a hiring mismatch.

## Leadership Implications

Oren framed leadership as having two central responsibilities.

### 1. Change management

Leadership will be heavily about helping the organization move into this new model:
- helping people adapt,
- managing resistance,
- changing habits,
- helping teams move away from legacy assumptions,
- making the organizational transition workable.

### 2. Defining roles

Leadership also has to decide:
- whether PMs remain pure PMs,
- whether engineers remain pure engineers,
- whether both roles become hybrid,
- what expectations belong to each role,
- and what new role design best supports AI-native work.

## Role Design Questions Raised

The conversation surfaced open questions rather than fixed answers.

Examples:
- Should PMs remain only PMs?
- Should engineers remain only engineers?
- Should engineers also take on PM-like work?
- Should PMs become more builder-oriented?
- What should role boundaries look like in small, autonomous, AI-native teams?

Oren framed this as one of the major leadership challenges ahead.

## End-to-End Ownership: Builders and Sellers

One especially interesting extension of the discussion was that truly autonomous teams may need to own more than building.

Oren raised the question of the **builders** versus the **sellers**.

His point was that if the team is only responsible for building, then it is not fully autonomous in business terms.

A more complete autonomous team may need to solve:
- the build,
- the marketing,
- the sale,
- the path to adoption,
- the full journey from inception to value delivery.

That would mean the team is not only shipping software, but owning the full value realization loop.

## Phrases / Notes Preserved from the Discussion

- self-developed products
- all products will be self-developed
- features will be self-developed
- quality / availability / health metrics improve
- self-guided products
- what should we develop?
- maybe 2026 / 2027 / 2028
- self-guided teams
- documentation as a key feature
- humans do not write code
- are we delivering value?
- sustainable
- more value over time
- value unit, not size
- team can be 1 or 6, not the main question
- team that provides value over time, consistently and autonomously
- revenue / impact / input over time, consistently
- hiring is about philosophy
- all tickets should be solved and reviewed by AI
- leadership will mostly be about change management
- leadership must define the roles
- autonomy may need to include sellers, not just builders

## Relevance to AI-Native Team Model

- Reinforces the idea that the future operating model is not just “current teams using better tools,” but a different definition of product building and ownership
- Strong support for the thesis that team size matters less than the value unit owned
- Documentation emerges as a central enabler of AI-native team operations
- Hiring shifts from skill demonstration toward philosophical alignment with AI-first work
- Leadership focus shifts away from managing functional silos and toward managing transition + redesigning roles
- Suggests that true team autonomy may require ownership beyond product and engineering, into go-to-market and value realization