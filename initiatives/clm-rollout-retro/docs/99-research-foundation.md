# Research Foundation — why this program is shaped the way it is

> Frameworks and best practices behind the retro design, from a multi-source review
> (25 sources, 86 claims, 21 verified via 3-vote adversarial checking). Confidence
> levels and citations included so the choices are defensible. Date: 2026-06-08.

## Frameworks chosen

- **After-Action Review (AAR)** — U.S. Army origin (1970s), now mainstream in business/health/gov; "one of the most successful organizational learning methods yet devised." Four-question spine (intended → actual → why → adapt). Crucially separates **the review** (conversation) from **the report** (written corrective-action doc). *High confidence — primary sources.*
  - Wharton Exec Ed: https://executiveeducation.wharton.upenn.edu/thought-leadership/wharton-at-work/2021/07/after-action-reviews-simple-tool/
  - NIH/PMC (peer-reviewed): https://pmc.ncbi.nlm.nih.gov/articles/PMC3447598/

- **Blameless postmortem (Google SRE)** — canonical document structure (Exec Summary, Problem Summary, Root Causes & Trigger, Impact, Action Items), themed action items, senior review before release, widest-audience dissemination, central repository. *High confidence — primary.*
  - SRE Book: https://sre.google/sre-book/postmortem-culture/
  - SRE Workbook: https://sre.google/workbook/postmortem-culture/

## Practices that drove specific design choices

| Practice (→ where it shows up) | Confidence | Source |
|---|---|---|
| **Teams retro first, compile top-3 trends — esp. issues *outside their control* — feed up to a joint/program level** (→ internal retros `01` + fan-in) | medium | methodsandtools.com; teleretro.com |
| **Cross-team review model: one team walks its incident, others learn vicariously** (→ joint session `04` format) | high | Google SRE Workbook |
| **Partners/suppliers *can* be included, but outsiders in an open room can suppress candor → use 1:1s for sensitive input + a curated room** (→ partner retros `03` hybrid) | high / medium | Wharton; plane.so; WHO/BetterEvaluation caveat |
| **Capture at milestones, not deferred to the end — multi-month efforts suffer memory decay & recency bias** (→ Step 0 capture channel opens now) | high | Enterprise Knowledge; PMI |
| **Organize action items into a small number of themes** (→ joint session `04` clustering + book §4) | high | Google SRE Workbook (split one incident into 5 themes) |
| **Standardized per-lesson entry template** (→ book §4 template) | high | Brainsensei; plane.so (corroborated by PMI/PMBOK) |
| **Senior review before release — an unreviewed postmortem "might as well never have existed"** (→ book publish step 2) | high | Google SRE Book |
| **One central tagged repository; disseminate to widest beneficial audience** (→ book "where it lives") | high | Enterprise Knowledge; Brainsensei (PMBOK OPA) |
| **Formalized follow-through (owner + date) or lessons get "learned over and over"** (→ follow-through register, the non-negotiable) | high | NIH/PMC |

## What the research refuted (so we don't over-engineer)

Rigid "N-step" formulas were knocked down in verification: a fixed 4-element postmortem
content list, a 4-phase scaled-retro recipe, a 4-level scaled hierarchy. **The field
offers patterns, not one canonical recipe** — we adapt the AAR/postmortem spines to the
CLM context rather than following any single template by rote.

## Open questions the research flagged (worth a decision during the program)

1. **Sensitivity tiering** of the output — handled here via the wide-book/restricted-appendix split, but confirm the appendix access list.
2. **Concrete sequencing/timing** for a *one-time* multi-month rollout (vs. sprint cadence) — the schedule in `00` is our call, not doctrine; compress if stabilization is clean.
3. **Facilitating partners with conflicting incentives** (Compliance regulatory exposure, Ops under scrutiny, cross-org China hand-off) while staying blameless — the hybrid 1:1+curated model in `03` is the mitigation.
4. **Measuring whether lessons actually reduced recurrence** on the next rollout — the 90-day follow-through checkpoint is the start; consider a recurrence metric.
