# AI-Native Pod — 90-Day Experiment Inside AIR²

**To:** Oren Ryngler
**From:** Yonatan Orpeli
**Ask:** One platform engineer seconded to the pod for 4–6 weeks to land harness basics. Everything else lives within AIR²'s existing mandate.

---

## The Shift: Augmented → Native

**AI-Augmented** — where most teams are today. Humans do the work. Agents help: Copilot suggests, LLMs draft, tools accelerate. The team looks structurally identical to any team — just faster.

**AI-Native** — a different structure. Agents *own* the operational plane: code, deployment, bug triage, documentation, design integration, ops workflows. Humans spec, evaluate, and keep the contract.

This isn't "how much AI does the team use." It's **who owns the work.** Augmented teams stay structurally the same. Native teams restructure: the role mix changes because the work redistribution changes.

## The Primitive: The Unit of Value

A team is the **smallest unit that can autonomously deliver a unit of value** — a measurable outcome, end-to-end, within blast-radius guardrails.

Size follows. Shape follows. Everything else follows.

Not "how small can a team be?" — "what's the smallest we can be while still owning a complete value unit?"

## Operating Mode

**Agents own:** code, configuration, documentation, deployment, bug triage and routing, design system integration, monitoring and routine remediation.

**Humans own:** specifications (what to build, for whom, why now), evaluator criteria and tuning, behavioral verification for high-blast-radius work, and the Human Contract (relationships, cross-pollination, career paths).

**The test:** if a human is manually triaging a bug or hand-authoring a deployment config, we're augmented. If an agent triages and proposes the fix, and a human reviews the spec, we're native.

## Home: AIR²

The pod lives **inside** AIR²'s experiment portfolio as a persistent cell — not a replacement for the parallel experiment stream. AIR²'s charter (no legacy Payoneer dependency, ship to production, fast Keep/Toss) is a fit-for-purpose environment by coincidence. Every experiment still runs AIR²'s Discovery → Build → Run → Keep/Toss cadence.

This is not the infra-first framing that was rejected. The pod hires two *product engineers*, not a harness engineer. The harness is built *through* shipping, as residue, not as prelude.

## Shape (3 humans — consequence, not mandate)

- **1 PM** — the specifier. Problem frames, evaluator criteria.
- **2 Product Engineers** — both ship with agents, both own blast radius.

## 90 Days

| Weeks | What |
|-------|------|
| 1–2 | Setup sprint — minimum infrastructure, scoped only to what experiment 1 needs. Exit = experiment 1 unblocked. |
| 3–5 | **Experiment 1: internal idea-collection system for AIR²** — solves an existing AIR² open thread, de-risks the operating model. First user-facing ship by end of week 4. |
| 6–8 | Experiment 2 — stronger-depth domain (candidate: internal tooling for the 350-person manual review team). |
| 9–11 | Experiment 3. Measure harness reusability and evaluator override trends. |
| 12–13 | Honest assessment against the operating model — not just the experiments. |

## How we measure

Measured on the operating mode, not any single ship:

- **% of operational loop agent-owned, trending up week-over-week** — the augmented-to-native transition, tracked. Instrumented: % of PRs agent-authored, % of bug triage agent-handled, % of deploys agent-executed, % of docs agent-maintained.
- **Three units of value through AIR²'s Keep/Toss framework** — the loop works end-to-end
- **Transferable harness** — ≥40% reusable for a second pod
- **Human Contract intact** — fragility and isolation are real in micro-teams; checked qualitatively

## What I need from you

**One thing: a platform engineer seconded to the pod for 4–6 weeks** to land the infrastructure basics:

- Sandbox environment (likely already in AIR² scope)
- CI/CD configured to route agent-authored PRs through appropriate gates
- Observability and logging stack — the harness needs sensors
- Security posture clarified for agent-authored production code on internal-only tools

Everything else is inside AIR²'s existing mandate. I'm not asking for greenlight on the pod — I'm asking for the one structural dependency I can't source from inside CLM.

## Risks I'm acknowledging

- **Platform security could block agent-authored production code.** If so, the pod re-scopes to fully internal-only or delays. Better to surface it in week 1 with a seconded engineer than discover it in week 6.
- **The commitment is ambitious.** Owning the full operational loop — not just code — is harder than "ship with Copilot." We expect hand-fixes and manual triage moments in the first 90 days; the discipline is back-propagating them into the harness and tracking the trendline, not hitting perfection.
- **Insularity risk on experiment 1** (AI team builds AI tool for AI ideas). Mitigated by experiments 2–3 picking domains with external-facing impact and strategic depth.

## Governance

One experiment stream inside AIR². Yonatan owns pod-level Keep/Toss. Liat (AI Team OS sponsor) and Gaurav (AIR² sponsor) stay informed. Status through AIR²'s existing cadence.

---

*Full reasoning and references: [`thesis-v2-value-unit.md`](./thesis-v2-value-unit.md)*
