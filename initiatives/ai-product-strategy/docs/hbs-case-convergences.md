# What the HBS Cases Give the Payoneer AI Strategy

> **Method:** A pattern is admitted only if three or more cases converge on it *independently* — different industries, different problems, no shared playbook. That's the strongest form of validation: not "HBS endorsed the framework" but "reality forced unrelated organizations to invent the same structure."
>
> **Sources:** HBS GenAI: Strategy & Execution pre-work — Microsoft/Copilot (MCAPS), Adobe Firefly, Coursera, Criteo, Gamma, Harvey, Salesforce Agentforce, Unilever, HBR "Reskilling in the Age of AI" — plus the prep-doc analyses. Compiled 2026-06-12.

---

## Pattern 1 — The autonomy ladder (convergent evolution of blast radius L0–L4)

Four organizations in four industries, facing four different problems, each independently rebuilt the structure the blast-radius model formalizes. None call it that; none got it from each other.

- **Gamma — the level is set by consequence, not capability.** Fox invents the framework verbatim: *"If there were '1 through 5 autonomy levels' for AI coding, like with autonomous vehicles, it feels like we're crossing from level 1 into 2, not 4 into 5."* The most AI-native company in the course — 17 engineers, 30–40% AI productivity gains — still ships no unreviewed AI code, because *"one bad line of code can take down your entire application... at 3:00 am when Japan wakes up."* Refinement: **capability is not permission.** The autonomy level is set by the blast radius of failure, and maximal AI enthusiasm doesn't change that.
- **Microsoft — when leadership doesn't define the levels, individuals improvise them.** No framework existed at MCAPS, so every seller drew their own line. Brian: drafts and summaries fine, but *"I wouldn't want anything automated going directly to a customer. I just don't trust it enough."* Owen's developers wanted controllable, auditable, chained workflows, not an autonomous chat box. The pattern across interviews: AI trusted for retrieval/recaps (low stakes, verifiable), distrusted for customer-facing output (high stakes, unverifiable in the moment). Refinement: **the absence of explicit autonomy levels is itself an adoption blocker.** Ambiguity reads as risk; people resolve risk by retreating to the lowest level. Publishing L0–L4 isn't just governance — it's an adoption intervention. It doesn't only constrain AI; it gives people *permission* to use it.
- **Unilever — autonomy is purchased with governance infrastructure.** Many-to-many content is physically impossible with per-asset human review, so Unilever granted autonomy at scale by encoding the rules first: BrandDNAi embeds brand and compliance standards into generation itself. Visibly tiered by consequence: content generation runs high-autonomy; Liquid I.V. pricing is AI-driven but every change ships with a human-reviewed explanation; customer service is majority-autonomous with humans on escalation. Refinement: **guardrails are throughput enablers, not friction.** You remove the human from the loop by encoding what the human was checking for. This is the exact argument for why compliance gates make agentic KYC *possible* rather than slower.
- **Harvey — autonomy levels are the roadmap, and promotion is earned with evidence.** The product ladder is a graduated autonomy ladder sold as SKUs: Assistant (human in the loop per query) → Vault (bulk but verifiable, citations) → Workflows (no prompting, end-to-end on repeatable tasks) → the autonomous agentic vision. In the highest-stakes domain in the course, each rung is climbed with proof from the rung below: sentence-level citations, task-level evals measuring % of work completed. Refinement: **define promotion criteria between levels, like promoting an employee.** An agent moves L2→L3 when it hits a measured evidence bar — not when someone feels comfortable. Bonus: monetization can follow autonomy (per-seat at copilot level, per-outcome at workflow level).
- *Salesforce is the fifth instance but the assigned topic, so it doesn't count as independent — though its org-side rule (Pattern 5) does.*

**Synthesis line:** *Every organization that deploys AI seriously ends up rebuilding the same ladder — capability determines what AI **could** do, consequence determines what it **may** do, and evidence is what moves the boundary.*

**Tactically (course + readout):** don't open with this on day 1. Let the first instance surface in discussion (Fox's quote, or Brian's trust boundary if Microsoft runs first), then name the pattern on its second appearance — "this is the third case where an org independently invented autonomy levels" lands harder than a framework pitch. Same spine for the readout to Oren: not "here's my model," but "here's the structure four unrelated organizations were forced to invent — and here's ours, already built."

---

## Pattern 2 — The moat is process data, not models

Every defensible position in these cases rests on data the foundation models don't have and can't get — specifically *how work is actually done*, not what its outputs look like. We have 350 people generating data - We need to capture it, this is a moat for us - the manual, heavliy regulated work - is our moat.

- **Harvey:** *"Lawyers have to be trained for many years to do this, and process data isn't publicly available anywhere. To train AI, you need a combination of domain experts and AI engineers. In the application layer, many companies are missing domain experts."* (Weinberg). Harvey's build mechanism: in-house lawyers walking engineers through how legal work products are actually created.
- **Adobe:** the strategic options were determined by the asset inventory — 300M rights-cleared Stock assets with a decade-old contributor-terms provision permitting AI training. The unglamorous homework done years early is what made the fast move possible.
- **Criteo:** *"LLM platforms like ChatGPT and Perplexity are excellent at predicting words, but not purchases"* (Komasinski). The bet: generic web-crawl data isn't good enough for commerce; the longitudinal transaction-linked dataset is the asset. And because that data is borrowed from retailers, the viable posture is **insight transfer without data transfer** — derive cross-portfolio insight, never share one party's raw data.
- **Gamma:** builds zero models; the compounding asset is the feedback layer that learns which prompts, layouts, and model-routing decisions work — hundreds of A/B tests per model release.

**Payoneer translation:** **From Cost reduction to AI-Data-Capture.** the 350-person manual review operation generates labeled compliance decisions every day. That is Payoneer's Adobe Stock — KYC adjudication reasoning ("how a reviewer actually decides an edge case, how a compliance officer reasons about a licensing question") exists in no foundation model and no competitor's corpus. The investment thesis should treat the review op not as a cost center being automated but as a **process-data flywheel being captured**: every AI deployment into review ops must be designed to harvest decisions/rationales as training and eval data. For KYC-as-a-Service, Criteo's "insight transfer, not data transfer" is directly reusable governance language with regulators and partners.

**Synthesis line:** *Models depreciate; process data compounds. Invest where the flywheel is.*

---

## Pattern 3 — Rent the models, own the governance and orchestration layer

The build-vs-buy question resolves the same way in every case: buy velocity at the layer where the external market moves faster than you can, build the layer that encodes your accumulated judgment.

- **Unilever:** bought generation velocity (Brandtech/Pencil, frontier models) — *"AI is evolving at such a pace that by the time you've built something, it's already out of date"* (Fun) — but built and owns **BrandDNAi**, the governance platform embedding brand/compliance standards into every generated asset.
- **Gamma:** *"Rather than spend money trying to compete with the foundation models, we made the decision to use them as suppliers and just focus on our end users"* (Noronha). The owned layer: orchestration across 20+ models, adaptive routing by intent and cost, the feedback loop.
- **Criteo:** doesn't build an LLM; makes its proprietary data legible to *any* agent via an MCP server — a data-infrastructure play that outlasts whichever model wins.
- **Adobe — the boundary case that proves the rule:** Adobe *did* build, but the decisive argument was goal alignment and trust, not capability: *"Their goals are radically different from ours... they're not tightly intertwined with the creative community."* A partner's training data and risk posture become your brand (read: regulatory) exposure. Build when the partner's ethics are your liability.

**Payoneer translation:** the decision rule for the investment thesis — **buy where the market outruns you (models, generation, infra); build where the asset is your accumulated proprietary judgment** (policy & eligibility rules, KYC decisioning logic, the compliance constraints any agent must obey). Payoneer's BrandDNAi-equivalent is a centralized policy/governance layer sitting above every AI agent that touches onboarding or verification — vendor- and model-agnostic, owned in-house. Note this is the same playbook vendor-optimization already runs for KYC vendors (portfolio, routing, continuous benchmarking, renegotiate as unit costs deflate ~10x/year); extend it from verification vendors to model vendors.

**Synthesis line:** *The swap-out layers you rent; the judgment layer you own.*

---

## Pattern 4 — Evidence infrastructure is the strategy's load-bearing wall

The cases that work all built measurement *first*; the unsolved problems in every case are measurement problems. This is also what powers the autonomy ladder — evidence is the promotion mechanism.

- **Harvey:** *"It didn't make sense to base eval on accuracy, as nobody wants a 90% accurate draft... we developed a rubric for each major task... and measured performance by how much of the total work the model was able to perform"* (Nayak). BigLaw Bench + use-case heat maps + utilization tracking — nobody's hiding places disappeared until the instruments existed.
- **Salesforce:** the instrumented pair — 84% resolution / 2% human escalation — plus the unit economics ($2 per agent conversation vs. $8–9 human). And the trap: when humans and agents co-work a case, per-case attribution breaks; pricing/measurement had to move to the conversation level.
- **Unilever:** the case *ends* on measurement as the open strategic question — when no single asset drives an outcome, attribution collapses and underperformance hides in the metrics vacuum.
- **Microsoft:** adoption metrics alone can't distinguish a bad tool from an unredesigned job — the J-curve dip looks identical in both.

**Payoneer translation:** build the **CLM Bench** — per-workflow rubrics measuring % of work completed (what fraction of a standard KYC review can the agent perform to rubric? escalation quality? rationale quality?), per-role utilization visibility, and cost-per-resolved-case instrumentation patterned on Salesforce's 84/2/$2 triple. Two strategic payoffs: it's the *promotion evidence* that moves agents up the L0–L4 ladder, and it's the credibility currency with Compliance and the exec team — the difference between "trust us" and "here's the bar and here's the measurement." Whoever owns the evals owns the pace of the strategy.

**Synthesis line:** *Without built instruments, the hiding places don't disappear — they relocate (into the J-curve dip, unused licenses, and the metrics vacuum).*

---

## Pattern 5 — Adoption is a managed system, not a launch (ways of working)

Five cases, one mechanism: AI adoption decays by default and is sustained only by line-management ownership and continuous reinforcement.

- **Microsoft:** DAU 22.7% → 5.1% after a technically flawless rollout. What worked: one killer-app wedge per role (Teams meeting recap), manager-owned rituals ("Find Your Five," weekly wins, team targets), and accepting that *"you get one or two at-bats, it breaks on the third, and people go back to their workflow."* Usage slipped every time the push paused.
- **Harvey:** the acquisition→utilization pivot — one firm went 19%→97% utilization in a month with deliberate, customer-success-style re-engagement. Training people once is "acquisition"; the game is utilization.
- **Coursera:** Maggioncalda halted the annual OKR release to force GenAI into objectives, and mandated continuous hands-on internal use so *"the lack of behavioral change did not become a constraint to technological advancement."* Forcing functions, not enthusiasm.
- **HBR Reskilling:** programs siloed in L&D die; winners make line leaders own development — Amazon promotes managers on *"How have you developed your team?"* — with protected time and clearly described destination roles.
- **Unilever:** executives made TikToks themselves in masterclasses; and Sykes's regression warning — every rollout wave *"reverted back to 1.0"* until learnings were deliberately codified.

**Payoneer translation (Foundry + operating model design checklist):** (1) a killer-app wedge per role — the Teams-recap equivalent for PMs, reviewers, policy analysts; (2) the five leads own their people's reskilling and are evaluated on it — not the Foundry as a program office; (3) utilization metrics per team, visible (Customer-Zero-style public numbers make non-engagement legible); (4) protected time, in-flow assignments producing real artifacts (a PPP analysis, a vendor analysis, a KYC flow spec); (5) budget for continuous reinforcement and expect regression after each wave. Consistent with the standing positioning: this is *enablement owned by line leadership*, not transformation theater.

**Synthesis line:** *Adoption is a flywheel with a manager's hand on it; take the hand off and it stops.*

---

## Pattern 6 — Customer Zero → productize (the sequencing for KYC-as-a-Service)

The same three-step arc appears in four cases: dogfood internally → build credibility/evidence → externalize as product.

- **Salesforce:** Agentforce on its own help site (380K conversations, 84% resolution) generated both the de-risking and the sales narrative.
- **Microsoft:** MCAPS as Customer Zero — with the warning attached: visible internal adoption metrics are simultaneously a product feedback loop, a sales asset, and a public-narrative risk.
- **Adobe:** its own design team as "Customer Zero" / first litmus test for Firefly.
- **Coursera:** built internal AI literacy, then *sold it* (GenAI Academy) when an enterprise customer surfaced the demand — the cleanest precedent for a Foundry second act.
- **Harvey adds the segmentation:** *"For the very high-end law firms we're going to be an assistant, and for the rest of the world, we're going to be the service"* (Grady) — the framing for whether KYCaaS is a copilot for sophisticated partners or the full service for smaller ones.
- **Salesforce adds the monetization roadmap:** pricing follows autonomy — seats → conversations → universal credits → outcomes. Don't price the end state on day one; pricing is a discovery process.

**Payoneer translation:** CLM as Payoneer's Customer Zero is already the play (the AI-native blueprint scaling from CLM company-wide; kyc-as-product as the externalization case study). The cases add three upgrades: instrument the internal deployment like a product (Pattern 4) because the numbers *are* the pitch; expect the metrics to cut both ways reputationally; and sequence monetization up the autonomy ladder rather than guessing the end-state price.

**Synthesis line:** *The internal deployment is the first product; its metrics are the first marketing.*

---

## How the patterns map to this pillar's three net-new artifacts


| Artifact                     | Built from                                                                                                                   | Core claim                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI investment thesis**     | Patterns 2 + 3                                                                                                               | Own the process-data flywheel (review-op decisions) and the policy/governance layer; rent models and generation. Models depreciate, process data compounds.             |
| **Prioritization framework** | Patterns 1 + 4 (+ Coursera's value/cost/ease filter, with value = customer problem / business model / competitive advantage) | Consequence sets the autonomy ceiling per bet; evidence (CLM Bench) is the promotion mechanism that raises it.                                                          |
| **Bet portfolio**            | Patterns 5 + 6                                                                                                               | Every bet ships with its adoption system (wedge, manager rituals, utilization metrics) and its instrumentation; sequence bets along the Customer Zero → productize arc. |


**The one-sentence spine for the exec readout:** *Capability determines what AI could do, consequence determines what it may do, and evidence is what moves the boundary — Payoneer's edge is that we own the consequence layer (policy/governance) and the evidence factory (the review operation's process data), and we've already built the ladder.*

---

## Open cautions (carry into the course, don't resolve prematurely)

1. **Fox's quote is about AI *coding* autonomy, not product-agent autonomy.** It still supports the pattern, but a sharp discussant could note the domain is narrower — be ready to bridge it ("same logic, different blast radius").
2. **Confirmation comfort.** Seven of eight cases validate the existing program. The two genuinely uncomfortable findings to keep live: Gamma's ARR-per-FTE logic (AI removes the org's hiding places too — a 21-person org vs. a 5-person one), and Salesforce's Lin: *"AI can only go at the pace of what humans can actually digest"* — nothing in the current blueprint measures absorption capacity.
3. **Measurement is everyone's unsolved problem.** Unilever ends on it, Salesforce hit the attribution trap, Microsoft couldn't separate tool quality from job design. CLM Bench is the differentiating move precisely because nobody in the course has solved it — which also means there's no template to copy.

