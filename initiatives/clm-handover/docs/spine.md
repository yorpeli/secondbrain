# CLM Handover — Narrative Spine & Section Outline

> Living design doc. The agreed skeleton for the handover document. Update as sections firm up.
> **Spine: the two reframes.** Read every section through "which reframe does this serve."

---

## The thesis (stated up front)

CLM under Yonatan was two deliberate reframes:

1. **Compliance machine → Platform** — what was built.
2. **Platform → Acquisition engine** — the next phase: onboarding as an integral part of how Payoneer *acquires and activates* customers, not a gate they survive.

The second reframe is the point of view this document exists to argue.

---

## Section outline

### 0. Framing (½ page)
CLM at Aug 2024 vs. now. State the two-reframe thesis immediately so Yaron sees the argument before the evidence.

### 1. Reframe 1 — Compliance machine → Platform *(what was built / "the bits")*
- **The platform itself** — CLM Full Rollout, unified payer/payee registration onto one flow *(headline achievement — the "career-defining" July rollout)*
- **Compliance & regulatory foundation** — licenses (Canada migration, Australia, Israel cards, India SAR), T1 localization, Compliance & Data Quality (Q1 KPI hit & exceeded)
- **KYC modernization** — vendor-stack overhaul (Persona/UiPath migration, AsiaVerify APAC coverage, Vendor Monitoring System), new KYC CX flow
- **The org** — 6 teams / 5 leads, embedded ownership & product-principles culture
- **AI inside the org** — AIR (customer-level ticket reduction), broad PM AI adoption as a management capability

### 2. Reframe 2 — Platform → Acquisition engine *(the thesis / bits for the next phase)*
- **The shift**: compliance → table-stakes / BAU (maintained, not built); investment tilts to conversion, activation, time-to-value; onboarding pulled *upstream* into acquisition
- **Next-phase bits**:
  - Delegated Onboarding as a platform capability (CSP/reseller batch flows — biggest B2B growth lever)
  - KYC-as-a-Product (cost center → revenue)
  - Acquisition-funnel ownership (EVS coverage gap, mobile conversion, drop-off)
- **Licensing as a strategic moat for AI** *(Yonatan's add)* — regulatory/licensing coverage as a defensible moat as AI agents begin transacting and onboarding. Hard to replicate; compounds over time.

### 3. What the next phase needs — Team structure *(the open question)*
Current shape: KYC Service (Elad), Self-Service (Ira), Localization & Licensing (Yael), Policy & Eligibility (Ido), Delegated Onboarding (Meital), Product Solutions (Yaniv, IC).
**The structural question the thesis forces**: if compliance is "built," does Localization & Licensing stay a heavy standalone team or shrink to a thin regulatory-maintenance function — freeing senior capacity to redeploy onto acquisition/conversion + delegated onboarding? → Yonatan's explicit recommendation. *(Builds on the Mar 10 Meital/Ido/Eliya licensing-restructure debate.)*

### 4. What the next phase needs — Metrics CLM should focus on
- **Conversion** — CLM CVR overall + by step/drop-off; mobile conversion `[verify target/actual]`
- **Activation** — FFT. Flag the open thread: no correlation found between onboarding speed and FFT `[Mar 12]` — needs segmentation by customer type
- **Efficiency** — CC/CJ ticket reduction (AIR's primary metric)
- **Vendor/automation** — the six confirmed KPIs (accuracy, verdict rate, coverage, completion impact, automation rate, approval impact)
- **Compliance** — kept as a non-negotiable floor, not a growth metric

### 5. What the next phase needs — Opportunities
- **KYC-as-a-Product** — biggest strategic upside; already sold to `[verify: 2]` external customers
- **EVS coverage gap** — `[verify: 69.2%]` of `[verify: 128K]` requests rejected pre-API for no vendor coverage — single largest CVR lever sitting in the vendor work
- **Delegated onboarding** as the B2B growth platform
- **Localization template** — "What Went Right" work (China ~50% wk-1 approval `[verify]`, Brazil/UK) productized into faster market entry

### 6. Team dynamics
- **Shareable layer (main doc)**: lead strengths, how each lead operates, the culture built
- **Sensitive layer (private annex)**: active separations, fit concerns, capacity risks — transferred carefully, never in the circulated doc

### 7. Appendix — CLM at the forefront of AI in onboarding *(set-aside / forward innovation)*
The agent-onboarding / MCP-or-A2A-protocol thesis: what happens when AI agents start onboarding, and why CLM should define the protocol. Yonatan drops in his existing document → `docs/ai-in-onboarding.md`.
Pairs with §2's licensing-moat point: the two sides of **"CLM should lead Payoneer's thinking on AI in onboarding — defensively (licensing moat) and offensively (agent-onboarding protocol)."**

---

## Artifacts

| Artifact | Audience | File |
|----------|----------|------|
| Main handover document | Yaron + product leaders | `handover-main.md` |
| Private annex | Yaron-only / Yonatan's verbal use | `private-annex.md` |
| AI-in-onboarding appendix | TBD with main doc | `ai-in-onboarding.md` |

## Open decisions
- Draft order (recommend: §2 first — it anchors everything).
- Final home for licensing-moat point — §2 pillar vs. shared with §7 appendix (currently: §2 pillar, cross-referenced from §7).
- Whether the AI-in-onboarding piece ships *with* the handover or as a separate forward-looking memo.
