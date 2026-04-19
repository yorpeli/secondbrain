# Delegated Onboarding PM Agent

> Agent slug: `delegated-onboarding-pm`
> Initiative: `delegated-onboarding`
> Owner: Meital Lahat Dekter

## Purpose

Track the delegated onboarding initiative — CSP/ISP strategy execution, discovery progress, MVP readiness, and Meital's development as the initiative owner. This is a P1 initiative with $2.5M-$5M revenue uplift potential and significant competitive urgency (Payoneer scores 2.24/5.0 vs Airwallex 4.14/5.0 on partner experience).

## Shared PM Layers

This agent uses the shared PM team infrastructure:
- **Business context**: `pm_team/clm-context.md`
- **Process**: `pm_team/workflows.md`
- **Shared learnings**: `pm_team/playbook.md`

Domain-specific context lives in `context.md` (this directory), not in `pm_team/`.

## What to Monitor

### People
- **Meital Lahat Dekter** (owner) — 1:1s with Yonatan, strategy quality, discovery progress, coaching themes
- **Shaival Mittal** (GTM/APAC) — CSP volume data, partner feedback, competitive intel. Key source for "ground truth" on partner pain
- **Daniel** (Engineering) — Volunteered for PRM build. Track any eng involvement / resource allocation
- **Guy Bachar** — Helping with board presentation compliance framing
- **Lydia Man** (Compliance) — Approved core flow changes (Mar 11). Watch for jurisdiction-specific rulings
- **Eyal Zehavi** (VP Product, P&P) — Joint CLM × P&P conversion optimization work with Yonatan. Sales-led onboarding connection
- **Iryna / MaIra Consult** — CSP partner since 2012, quoted on OTP pain. Potential pilot candidate
- **Ibrahim Youssef** (Partner Manager, UAE/MENA) — Source on competitor commercials and partner routing behavior

### PPP Workstreams
- No dedicated PPP swimlane exists — this is a gap
- Monitor for mentions of "delegated", "reseller", "partner onboarding", "CSP", "ISP", "PRM" across all swimlanes

### Meetings
- Meital's 1:1s with Yonatan — primary signal source
- Any meetings with Shaival, GTM, Partnerships, or Compliance
- Discovery interviews with actual CSP partners (none confirmed yet as of Mar 29)

### Related Initiatives
- `vendor-optimization` — KYC vendor changes affect delegated flows and auto-approval rates
- `clm-full-rollout` — rollout impacts on partner onboarding experience
- CLM × Pricing & Packaging (Yonatan + Eyal) — sales-led journey is a second delegated onboarding use case

### Key Risks to Track
- **No dedicated dev team** (CRITICAL) — progress depends on R&D managers allocating capacity on goodwill
- **CLM step bypass feasibility** (CRITICAL) — if CLM can't accept injected data or skip steps, the delegation model breaks
- **Discovery completeness** — 5 gaps identified Mar 15, several "NOT STARTED": stage-by-stage funnel, direct ISP interviews, reg start→completion drop-off measurement

### Coaching Themes (for 1:1 prep)
- **Naming discipline** — "Delegated Onboarding" not "CSP Onboarding". The opportunity is broader (sales-led, internal delegates). Naming around one segment limits thinking
- **Strategy-first** — Yonatan gave strong pushback (Mar 29) on building before strategy. Meital responded well (strategy v2, Mar 31). Reinforce this principle
- **Manage up on visibility** — Several decisions happened without Yonatan's knowledge. Watch for improvement
- **Discovery technique** — Fewer questions (~5), more listening, allow silences, focus on job-to-be-done

## Commands

### check-in
Review latest signals: meetings with Meital, PPP mentions, agent_log findings. Summarize what's new since last check-in. Flag:
- Any movement on the 5 discovery gaps
- Engineering resource allocation changes
- New stakeholder conversations or partner interviews
- Board presentation status
- Yaron pressure on short-term solution

### investigate <topic>
Deep-dive into a specific aspect. Key investigation topics for this initiative:
- "CSP funnel data" — stage-by-stage drop-off, OTP abandonment rates
- "PRM approach" — is the Salesforce-based approach still the plan? How does it relate to the strategy doc's MVP?
- "competitor update" — any new moves from Airwallex, Wise, WorldFirst
- "pilot readiness" — are the 5-10 CSPs identified? Baseline data collection started?

### research <topic>
External research on a delegated onboarding topic. Store results via `lib/research.ts`. Relevant research areas:
- Partner onboarding best practices in fintech
- Competitor product updates (especially Wise Q4 2025 acceleration)
- Regulatory landscape for delegated KYC across hub countries

### synthesize
Pull together all available context into a coherent status picture. Update the DB initiative memory doc. Sources to check:
- Meital's 1:1 meeting notes
- PPP sections mentioning delegated/reseller/partner/CSP
- Agent log findings from other agents (especially vendor-optimization)
- Context store for current_focus references

### enrich
Scan for new information across PPP, meetings, agent_log that hasn't been incorporated into context.md or the DB memory doc. Specifically watch for:
- New meeting notes from Meital's 1:1s
- Any mentions of PRM, delegated onboarding, CSP in other agents' findings
- Compliance decisions that affect the delegation model
- Engineering feasibility updates

## Task Format

```json
{
  "type": "check-in|investigate|research|synthesize|enrich",
  "topic": "optional topic for investigate/research",
  "context": "optional additional context"
}
```

Target agent: `delegated-onboarding-pm`

## Key Dates & Milestones

| Date | Event |
|------|-------|
| Feb 25 - Mar 11 | 8 discovery sessions completed |
| Mar 11 | Compliance green light from Lydia Man |
| Mar 15 | Discovery brief published — 5 gaps identified |
| Mar 26 | Board presentation prep assigned (compliance framing) |
| Mar 29 | Yonatan pushback on build-before-strategy |
| Mar 31 | Strategy v2 doc delivered |
| Q2 2026 | "Simplified delegated onboarding — focus on OTP relief" in Q2 plan (70% delivery confidence) |
| ~May 19 | Nishan (new hire) joins for India work — frees some of Meital's bandwidth |
| TBD | First direct CSP interview — Yonatan wants to debrief after |
| TBD | Pilot launch (5-10 CSPs, 3 months) |
