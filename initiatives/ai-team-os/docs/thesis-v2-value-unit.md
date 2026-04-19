# Thesis v2 — Value Unit, Not Size

**Status:** Draft for discussion (April 2026, revised 2026-04-17). Supersedes the size-as-organizing-principle framing in [`ai-native-team-article.md`](./ai-native-team-article.md). Informed by Oren Elenbogen (Forter), the three harness engineering posts (Fowler, Anthropic, OpenAI), and a cross-review from the AIR² perspective. Key revisions: harness engineer role dropped in favor of two product engineers + setup sprint; "no human-authored source code" softened from disqualifier to leading indicator; pod homed inside AIR²'s experiment portfolio; first experiment scoped as internal idea-collection.

---

## The Shift

**v1:** AI shrinks distance → teams get smaller and closer. Organizing unit = a 3-person pod. Size is the mechanic.

**v2:** The organizing unit is the **value unit** — a bounded team whose work product ships **without human-authored source code**. Size is derivative, not prescriptive. Small is what falls out when agents do the implementation — not a doctrine.

This is the Oren framing ("self-developed → self-guided products → self-guided teams") with a sharp, testable commitment attached.

---

## The Commitment (defined precisely)

We mirror OpenAI's actual, demonstrated claim — not a broader slogan that collapses on contact with reality.

**Agents author:**
- Implementation code (application logic, UI, integrations)
- Configuration (CI, infra-as-code, observability)
- Documentation
- Scaffolding, tooling, draft tests

**Humans author:**
- Specifications (what, for whom, why now, constraints)
- Architecture rules and structural constraints
- Evaluator criteria and prompts
- Behavioral/integration tests for anything with meaningful blast radius (until the harness earns trust)
- The harness itself

**The discipline:** When an agent fails, the default response is to re-spec, re-prompt, or tighten the harness — not to open an editor and hand-fix. When a hand-fix does happen (it will), it must be back-propagated into guides or sensors so the next failure is caught by the harness, not by a human.

**How we measure it:** "No human-authored source code" is tracked as a **leading indicator**, not a disqualifier. Weekly from git history: trending down signals operating model health. A single hand-fix does not fail the experiment — a pattern of un-backpropagated hand-fixes is the canary. This framing is deliberate: AIR²'s charter is "learn by shipping," and a rigid pass/fail commitment in the first 90 days would collide with that ethos without teaching us anything useful.

**Why the commitment matters even as a leading indicator:** This is the size → value shift made legible. Without it, the thesis collapses into "small team with AI tools." With it, there is a crisp, observable answer to "how would anyone know AI-native is actually different?"

---

## Preconditions

1. **Harnessable scope.** Greenfield or strongly carved-out. Not embedded in KYC's legacy core. Fowler: *"the harness is most needed where it is hardest to build."* We don't fight that fight first.

2. **Structural enforcement.** Fixed dependency ordering (OpenAI uses Types → Config → Repo → Service → Runtime → UI) plus structural tests agents cannot violate. Architecture is enforced by the harness, not by code review.

3. **Evaluator architecture.** A separate evaluator agent, tuned over weeks, independent of the generator. Sprint contracts (or equivalent) negotiate "done" before implementation. Anthropic: *"out of the box, Claude is a poor QA agent"* — expect weeks of tuning.

4. **Machine-readable docs as single source of truth.** Architecture, APIs, domain constraints in structured docs the harness reads at execution time. Replaces the spec-rots problem.

5. **Behavioral correctness honored.** Fowler is blunt: AI-generated tests aren't trustworthy yet. For anything with real blast radius, humans own behavioral verification — hand-crafted integration tests, hand-reviewed audit trails. This constraint weakens as the harness matures; it does not vanish.

---

## Human Role

What humans do when agents write the code:

- **Spec and re-spec** — translate messy reality into declarative problem frames
- **Tune the evaluator** — sit with the logs for weeks
- **Build and maintain the harness** — guides, sensors, structural rules
- **Own behavioral verification** for high-blast-radius work
- **Keep the Human Contract** — relationships, cross-pollination, career paths, documentation for posterity

---

## Human Contract (carried forward, reframed)

The Contract survives. It was never *about* size — it was about what happens to humans in small, AI-dense teams. Reframed: **the Contract applies to any value unit operating below Dunbar's threshold** (effectively: always). Small is the empirical consequence of agents doing the implementation, not a design mandate. Triad fragility, coalition dynamics, isolation, shared ownership, growth beyond the pod — all still load-bearing.

This keeps the Contract as the differentiator. The three harness posts say nothing about humans. Our contribution does.

---

## Harness Disposability

Both Anthropic and Fowler are explicit: **as models improve, the harness shrinks.** Anthropic stripped the sprint construct entirely moving Opus 4.5 → 4.6. Implications:

- Design the first harness to be thrown away. Don't over-engineer for today's model limits.
- Budget tuning cost honestly. Anthropic: evaluator-based workflows ran ~20x the cost of a solo agent. Evaluator tuning took "several rounds" and real engineer-weeks.
- Measure harness ROI per component. A guide or sensor that adds no lift on the current model should be cut.

---

# The First Team

## Home: AIR²

The pod lives **inside** AIR²'s experiment portfolio as a persistent cell — not alongside it and not as a replacement for the parallel experiment stream. AIR²'s charter (no legacy Payoneer dependency, ship to production, fast Keep/Toss) reads as a harnessability checklist by coincidence. This makes AIR² the natural home, not a governance compromise.

**Governance:**
- Yonatan drives greenlight with Oren directly
- Liat (AI Team OS sponsor) and Gaurav (AIR² sponsor) stay informed, not operational
- Keep/Toss on each experiment uses AIR²'s existing framework
- Keep/Toss on the pod itself is a separate 90-day assessment owned by Yonatan

## Shape

- **1 PM** — the specifier. Owns continuous discovery, problem frames, evaluator criteria. iTalent pipeline (first candidate declined April 2026).
- **2 Product Engineers** — both ship with agents. Both take responsibility for blast radius. Neither is titled "harness engineer." Harness knowledge accumulates in whoever gets closest to it; if a specialist emerges organically, fine.

Three humans. Consequence, not mandate. If the value unit needs a fourth (designer, domain expert), it has a fourth.

**Why no harness engineer as a distinct role:** AIR²'s previous infra-first framing was rejected once. Hiring a harness specialist as the first engineer is that framing in new clothes — it signals "build the platform, then ship," which is exactly what Oren said no to. The discipline we keep: **harness is residue from shipping, not prelude to it.**

## Setup Sprint (before the first experiment)

1–2 weeks. Scoped only to what the first experiment demonstrably needs. No speculative abstractions. No reusable framework thinking. No platform posture.

**Exit criterion:** first experiment is unblocked — not "harness complete."

The real harness accumulates as **residue** from experiments 1–N, not as pre-built infrastructure. This is the core sequencing call: the harness grows through shipping, not before it.

## First Experiment: Internal Idea-Collection System

A system for anyone at Payoneer to submit experiment ideas to AIR² — intake, deduplication, AI scoring, routing to evaluation. This is already an open thread in AIR²'s memory (the "idea scraping" mechanism). Picking it is a deliberate de-risking move.

**Why it's a good first experiment:**
- Meets all five domain criteria (harnessable, low blast radius, real customer, bounded, AIR²-useful)
- Exercises the full stack (UI, data, AI scoring, operational workflow)
- Makes the discovery → build → run → Keep/Toss loop observable end-to-end
- Solves an AIR² open problem — the pod pays rent on day one

**What it is NOT:**
- The pod's flagship identity. "AI team builds AI tool for AI ideas" is insular if it becomes the pod's signature. The flagship emerges from experiments 2–4 once the operating model is de-risked.

## Domain criteria (for experiments 2–N)

1. **Harnessable** — greenfield or strongly carved-out
2. **Low blast radius** — failure is recoverable, not regulatory
3. **Real internal customer** — feedback loop exists; no imaginary-user experiments
4. **Bounded** — edges legible enough to spec precisely
5. **Strategically defensible** — worth scaling if it works

Strong candidate for experiment 2: internal tooling for the 350-person manual review team. Higher user count, clearer Innovation Delta, still low external blast radius.

## 90-day plan (sketch)

- **Weeks 1–2:** Team forms. Setup sprint — minimum-viable harness scoped to the idea-collection system only.
- **Weeks 3–5:** First experiment (idea-collection). AIR² cadence: Discovery → Build → Run → Keep/Toss. First user-facing ship by end of week 4.
- **Weeks 6–8:** Experiment 2 (stronger-depth domain). Harness grows through the experiment, not before.
- **Weeks 9–11:** Experiment 3. Begin measuring harness reusability and evaluator override trends.
- **Weeks 12–13:** Honest assessment. What did the harness catch? What slipped? Where did humans hand-author code, and were hand-fixes back-propagated? What scales?

## Success criteria

Success is measured on the operating model, not on any single experiment.

- **"No human-authored source code" trending down** — weekly from git history, as a leading indicator (not a gate)
- **Three experiments through AIR²'s Keep/Toss framework** — the loop works
- **At least one user-facing change per week** by week 6
- **Evaluator override rate declining** week-over-week
- **Human Contract intact** — qualitative, checked via 1:1s, peer feedback, burnout signals
- **Transferable harness** — ≥40% of guides, sensors, and structural rules would carry to a second pod without rework

## Disqualifiers

- **Un-backpropagated hand-fixes becoming routine.** A single hand-fix is expected; a pattern is the canary.
- Behavioral-correctness constraint collapsing under delivery pressure
- Pod isolating from the broader org (Human Contract failure)
- Pod absorbing AIR²'s parallel experiment stream — the pod is one stream inside the portfolio, not a replacement for it

---

## Open questions (decide before greenlight with Oren)

1. **Platform / security / compliance tolerance.** Does Payoneer tolerate agent-authored production code today, even for internal-only tools? This is the hard blocker — pre-negotiation with Platform / Ilona needed before week 1.
2. **Evaluator governance.** Who owns tuning decisions? Who signs off on prompt changes that affect experiment outcomes?
3. **CLM integration pattern.** If experiment output graduates from AIR² into CLM proper, what's the consumption and handoff model?
4. **Rollback path.** If the pod fails at day 90, does it dissolve back into AIR²'s parallel portfolio, or get redeployed elsewhere?
5. **Experiments 2–4 domains.** Internal ops for the manual review team is a strong candidate for #2. What are the candidates for #3 and #4?

---

## What changes in the article

If this thesis holds, the article needs:
- "The Pod: Composition" de-anchored from 3 as doctrine → 3 as consequence of the value-unit framing
- "No human-authored source code" added as the explicit commitment and the size → value narrative anchor
- Harness framed as **residue from shipping**, not pre-built infrastructure — this is the key sequencing shift
- "What Comes Next" rewritten as the first-team proposal, housed inside AIR²
- Human Contract reframed as applying to any sub-Dunbar value unit
- Flex dimensions simplified — blast radius and harnessability do more work than the current four
