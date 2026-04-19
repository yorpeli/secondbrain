# AIR² — Working Memory

## Last Session
- **Date**: 2026-03-20
- **What happened**: Reviewed kickoff scope alignment slide and Yonatan's meeting notes. Captured key decisions, team structure, framework, and open items.
- **Attendees at kickoff**: Yonatan Orpeli, Tom Tomer (operations manager), Tomer Raivit (Platform Engineering), Gaurav Gupta (exec sponsor)
- **Next steps**: Discuss what to work on next — potential items: evaluation framework, idea collection mechanism, environment setup brief, detailed stakeholder map

## Open Threads
- **Core team staffing**: 2 Devs + 1 PM not yet identified. Deck is the ask to Oren for headcount. Must be execution-focused people ("mercenaries").
- **Evaluation framework**: Needs to be built — defines what we evaluate before starting an experiment, during development, and at Keep/Toss decision point. Innovation Delta metric depends on this.
- **"The Beat" target**: No target throughput yet. Evaluate after first experiments run.
- **India team environment**: Gaurav's ~50 engineers (+ some PMs) in India. First task may be standing up the sandbox/working environment. They have ~2 hours every morning available.
- **Tooling standardization**: Need lightweight alignment on tools (Cursor, Claude Code, etc.) — not free-for-all, but not heavy governance either. Enterprise guardrails required (security, compliance).
- **Idea collection ("scraping")**: Need a mechanism for anyone in the org to submit experiment ideas. No ownership competition — execution matters, not who had the idea.

## Key Decisions from Kickoff
- **Mission**: Disrupt ways of working internally (not building next external product). Speed above all.
- **"In production"**: Must be tangible and deployed, even if internal-only. Not strategy decks.
- **Framework**: Discovery (up to 3 days) → Build MVP (up to 1.5 weeks) → Run 3 weeks → Keep or Toss → Scale. Yonatan thinks timing is too generous — prefers 1 day discovery, 1 week build. Starting pragmatically with slide timings.
- **Keep/Toss**: Joint group decision. Yonatan leads, Gaurav sponsors, but inclusive.
- **No Payo dependency**: Avoid getting blocked by legacy systems/release processes. Don't depend on existing pipelines.
- **Enterprise constraints**: Security, guardrails, standardization required even though moving fast.

## Stakeholder Notes
- **Tom Tomer**: She/her. Operations manager — keeps the initiative moving (logistics, coordination). Not a secretary role.
- **Tomer Raivit**: Platform Engineering. Motivated contributor, wants to help. May lead environment setup.
- **Gaurav Gupta**: Exec sponsor. Has India team (~50 engineers + some PMs). Supportive, resource provider.
- **Tal Arnon**: Previous lead, now contributor. Supportive of transition. VP Engineering.

## Context to Remember
- Leadership transition from Tal (infra-focused) to Yonatan (speed/disruption-focused)
- Tal is fine with the transition per direct conversation
- AIR² is peer-level with Foundry and AI Team OS, not a sub-initiative of AIR
- This deck is being built to present to Oren (CPO org) for resources
- Success metrics: Throughput ("The Beat") + Innovation Delta (estimated cost savings/revenue of scaled projects)

## Background: Why Oren Rejected the Previous Version
- The original meeting (pre-Yonatan) framed AIR² as an enablement/platform play: "paved path for agent development," new team structures, cross-stream collaboration. Infrastructure-first, broad scope (Products, DLC, Support infra), no concrete success metrics.
- Oren rejected this direction. The likely reason: he wanted execution and results, not another platform initiative. Yonatan's new scope directly answers this — ship experiments to production, measure throughput and impact, keep or toss fast.
- **Important for framing**: If the initiative ever drifts back toward "build infrastructure so others can innovate," that's the direction that was already tried and rejected. The mandate is execution.
- **Gaurav's instinct is volume**: In the original meeting he pushed for "100 agents in 3 months." The new scope is more disciplined (fewer, higher-quality experiments that reach production). Worth knowing when managing his expectations — he'll likely push for more throughput, which is fine as long as quality/production bar holds.
- **Early experiment idea**: Tom raised a vendor management agent — consolidating vendor data across systems to find spending inefficiencies. Concrete, high-value, fits the "low hanging fruit" criteria.
