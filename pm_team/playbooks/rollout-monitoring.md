# Playbook: Country Rollout Monitoring

> Version 1.1 — 2026-02-14
> First applied to: UK 100% CLM rollout (Feb 2026)
> Owner: hub-countries-pm
> Approved by: Yonatan Orpeli

---

## Purpose

When a country expands CLM rollout (e.g. 25% → 100%), it takes ~4 weeks for mature cohort data to show definitive approval rates. This playbook defines the **leading indicators** to monitor during that maturity window so we can detect problems early — before they show up in the headline numbers.

This playbook is **parameterized** — fill in the country-specific values in the Configuration section and the same monitoring framework applies to any country.

---

## Core Methodology: Apples-to-Apples Cohort Comparison

**Never compare an immature cohort to a mature baseline.** A 1-week-old cohort will always have lower approval rates than a 4-week-old cohort — that's maturation, not a problem.

Instead, use **week-over-week comparison at the same maturity level:**

```
Three-point comparison (each week's data measured at the SAME time):
  1. Rollout week (100%)  — e.g. Feb 8, currently 1 week old
  2. Previous week (25%)  — e.g. Feb 1, currently 2 weeks old
  3. Older week (25%)     — e.g. Jan 25, currently 3 weeks old

All three are immature. The maturation curve is visible in the progression:
  Week 1 → Week 2 → Week 3 shows the NORMAL ramp.
  The rollout week should be on a similar trajectory.
```

**Key: break down by entity type separately.** Company and Individual are different segments with different baselines. Track each against its own history — not against each other.

### How to get this data

Query Looker for weekly CLM data by entity type (last 6 weeks):

```
Fields: week, entity_type, accounts_created, segmentation, docs_submitted, approved, ftl
Filters: CLM, D2P, country, 6 weeks, exclude bots/blocked/MAP
```

This gives you a matrix: each row is one (week × entity type) combination, all measured as of today. Older weeks are naturally more mature.

---

## Configuration (per country)

Fill these in before starting monitoring:

| Parameter | Description | UK (Feb 2026) |
|-----------|-------------|---------------|
| `COUNTRY` | Country name in Looker | United Kingdom |
| `ROLLOUT_DATE` | Date rollout went live | 2026-02-08 |
| `PREVIOUS_ROLLOUT_PCT` | What % were we at before | 25% |
| `NEW_ROLLOUT_PCT` | New rollout percentage | 100% |
| `MATURITY_WEEKS` | Weeks until cohort is mature | 4 |
| `BASELINE_WEEKLY_VOLUME` | Expected weekly CLM accounts at old % | ~144/week at 25% |
| `EXPECTED_VOLUME_MULTIPLIER` | New/old rollout ratio | 4x |
| `FOURSTEP_APPROVAL` | 4Step mature approval for reference | 18.3% |

### Entity Type Baselines (mature cohort, pre-rollout)

| Metric | Company | Individual | Overall |
|--------|---------|------------|---------|
| Mature approval rate | 41.7% | 28.6% | 36.3% |
| Docs submitted rate | 63.5% | 42.0% | 54.7% |
| Segmentation rate | 99.1% | 92.0% | 96.1% |
| FTL rate | 8.4% | 4.0% | 6.6% |
| Volume share | 59% | 41% | 100% |

### Weekly Baselines (pre-rollout weeks at 25%, for apples-to-apples)

| Week | Entity | Created | Seg% | Docs% | Appr% | FTL% |
|------|--------|---------|------|-------|-------|------|
| Jan 25 | Company | 73 | 98.6 | 67.1 | 47.9 | 11.0 |
| Jan 25 | Individual | 53 | 94.3 | 41.5 | 28.3 | 5.7 |
| Feb 1 | Company | 93 | 98.9 | 61.3 | 35.5 | 3.2 |
| Feb 1 | Individual | 51 | 92.2 | 43.1 | 33.3 | 2.0 |

---

## Leading Indicator Hierarchy

Downstream metrics are lagged versions of upstream metrics. Monitor in this order:

```
Volume → Entity Mix → Segmentation → Docs Submitted → Reopened Reqs → Approval Rate → FTL
 (day 1)   (day 1)      (day 2-3)       (week 1)        (week 1-2)      (week 2-4)   (week 4+)
```

**Key principle:** If volume and mix are stable, and docs submission rates hold, approval will follow. If any upstream metric shifts, don't wait for downstream confirmation — investigate immediately.

---

## Phase 1: Days 1-7 — Volume & Intake Health

**Goal:** Confirm traffic is flowing correctly and the 100% population matches expectations.

### What to measure

1. **Volume**: Is the rollout week significantly higher than pre-rollout weeks?
2. **Entity mix**: Is the Company/Individual split the same at 100% as at 25%? A shift means the population changed — not necessarily bad, but it means baselines need rebasing.
3. **Segmentation by entity**: Is each entity type completing segmentation at its own historical rate?

### How to evaluate (apples-to-apples)

Compare the rollout week to the most recent pre-rollout week. Both are immature — the comparison is fair for volume and early funnel steps.

| Check | Compare | Yellow flag | Red flag |
|-------|---------|-------------|----------|
| Volume | Rollout week vs `BASELINE × MULTIPLIER` | <50% of expected | <25% or >3x expected |
| Company share | Rollout week vs pre-rollout | Shift >10pp | Shift >20pp |
| Company seg rate | Rollout week vs same metric last week | Drop >3pp | Drop >8pp |
| Individual seg rate | Rollout week vs same metric last week | Drop >3pp | Drop >8pp |

### Escalation
- Volume not flowing → **immediate** (routing/system issue). Notify Ira (Full Rollout owner).
- Entity mix shift >10pp → flag to team lead. Rebase expectations — blended rate will shift even if both segments perform identically.

---

## Phase 2: Week 1-2 — Funnel Progression

**Goal:** Are registrants completing the hardest step (document submission)?

### What to measure

Track docs submitted rate **per entity type** — compare the rollout week at N weeks maturity to a pre-rollout week at N weeks maturity.

Example at Week 2: Compare Feb 8 (rollout, now 2 weeks old) to Feb 1 (25%, also measured at ~2 weeks maturity when we first captured it). Both have had similar time to mature.

| Check | Compare | Yellow flag | Red flag |
|-------|---------|-------------|----------|
| Company docs rate | Rollout week vs pre-rollout week (same maturity) | Drop >5pp | Drop >10pp |
| Individual docs rate | Rollout week vs pre-rollout week (same maturity) | Drop >5pp | Drop >10pp |
| Reopened reqs rate | Ops data (needs-human) | >baseline + 5pp | >baseline + 10pp |

### What to look for
- Each entity type should be progressing at its own normal rate
- If docs rate is lower at the same maturity, that's a real signal — not a maturation artifact
- Reopened requirements is the hardest to get (not in Looker) — create a `needs-human` task for Ops data

### Escalation
- Company docs rate degrading vs same-maturity comparison → investigate (vendor/verification issue?)
- Reopened reqs spiking → escalate to Ops + Elad

---

## Phase 3: Week 2-3 — Early Approval Signals

**Goal:** First real look at approval outcomes, still using apples-to-apples comparison.

### What to measure

By now the rollout cohort is 2-3 weeks old. Compare its approval rate to what pre-rollout cohorts looked like at the same age.

| Check | Compare | Yellow flag | Red flag |
|-------|---------|-------------|----------|
| Company approval (at N weeks) | Rollout week vs pre-rollout at same maturity | Drop >5pp | Drop >10pp |
| Individual approval (at N weeks) | Rollout week vs pre-rollout at same maturity | Drop >5pp | Drop >10pp |
| Company approval trajectory | Is it following the normal maturation curve? | Lagging the curve | Flat or declining |
| Individual approval trajectory | Is it following the normal maturation curve? | Lagging the curve | Flat or declining |
| Approval velocity (E2E days) | PPP / Ops data | >5 days | >7 days |
| Ops queue depth | PPP / Ops data | >2x pre-rollout | >3x pre-rollout |

### Normal maturation curve (UK Company, for reference)
```
Week 1:  ~10%  (mostly pending)
Week 2:  ~35%  (big jump — most decisions happen here)
Week 3:  ~45%  (approaching final)
Week 4+: ~42-48%  (mature, may fluctuate)
```

### What to look for
- The rollout cohort should be on a similar trajectory to pre-rollout cohorts
- Track Company and Individual separately — each has its own curve
- If entity mix shifted in Phase 1, the blended rate WILL be different from baseline. That's expected — evaluate each segment on its own terms.

### Escalation
- Company approval below 30% at 3 weeks maturity → immediate flag (should be ~45%)
- Overall approval below `FOURSTEP_APPROVAL` at 3+ weeks → red alert

---

## Phase 4: Week 4+ — Mature Validation

**Goal:** Confirm the rollout with mature cohort data.

### What to measure

| Check | Compare | Success criteria |
|-------|---------|-----------------|
| Company mature approval | vs `BASELINE_COMPANY_APPROVAL` | Within 5pp |
| Individual mature approval | vs `BASELINE_INDIVIDUAL_APPROVAL` | Within 5pp |
| Overall mature approval | vs `BASELINE_APPROVAL` (adjust for mix shift if applicable) | Within 3pp, or explained by mix |
| FTL rate by entity | vs entity baselines | Not declining |
| CLM vs 4Step delta | `deep-dive` | Positive and stable |

### What to do
1. Full weekly-by-entity query with 6+ weeks of data
2. Compare mature rollout cohort to mature pre-rollout cohorts — this is the final apples-to-apples
3. If entity mix shifted: compute what the blended rate WOULD be at the old mix to separate mix effect from performance effect
4. Document learnings in the Retrospective section

---

## Execution Cadence

| Period | Action | Agent |
|--------|--------|-------|
| Daily (week 1 only) | Volume spot check — is traffic at expected level? | hub-countries-pm |
| Weekly (weeks 1-4) | Full weekly-by-entity query + deep-dive + diagnose | analytics agent + hub-countries-pm |
| Weekly | PPP signal scan for country-specific flags | hub-countries-pm `check-in` |
| Week 4 | Mature validation — final assessment | hub-countries-pm + analytics |
| Week 5 | Retrospective — update this playbook | hub-countries-pm |

---

## Escalation Matrix

| Trigger | Severity | Action |
|---------|----------|--------|
| Volume <50% expected | RED | Immediate — check routing/system. Notify Ira (Full Rollout owner) |
| Company approval degrading vs same-maturity pre-rollout | RED | Escalate to Yonatan + Yael/Elad |
| Individual approval degrading vs same-maturity pre-rollout | YELLOW | Investigate — is it the rollout or a pre-existing trend? |
| Overall approval below 4Step baseline at 3+ weeks | RED | Escalate to Yonatan — rollout may need pause |
| Reopened reqs >baseline + 10pp | RED | Escalate to Ops + Elad |
| Entity mix shift >10pp | YELLOW | Rebase blended expectations. Track segments independently. |
| Docs rate drop >5pp (same maturity) | YELLOW | Investigate by segment — vendor issue? |
| E2E time >5 days | YELLOW | Check Ops queue |

---

## Analytics Commands Reference

```bash
# Full funnel with trends and volume sparkline
npx tsx analytics/run.ts deep-dive "{COUNTRY}"

# Segment breakdown (entity type, device, combinations)
npx tsx analytics/run.ts diagnose "{COUNTRY}"

# Quick CLM vs 4Step comparison
npx tsx analytics/run.ts compare "{COUNTRY}"

# Weekly by entity type (custom Looker query — see Core Methodology)
# Query fields: week, entity_type, created, segmentation, docs_submitted, approved, ftl
# Filter: CLM, D2P, {COUNTRY}, 6 weeks, exclude bots/blocked/MAP
```

---

## UK Phase 1 Results (Feb 14, 2026)

### Volume: HEALTHY
- Rollout week (Feb 8): **243 accounts** (136 Company + 107 Individual)
- Previous week (Feb 1): 144 accounts (93 Company + 51 Individual)
- Growth: +69% overall. Company +46%, Individual +110%.

### Entity Mix: SHIFTED — rebase expectations
| | Pre-rollout (Feb 1) | Rollout week (Feb 8) | Change |
|--|---------------------|---------------------|--------|
| Company share | 65% | 56% | -9pp |
| Individual share | 35% | 44% | +9pp |

More Individuals are entering at 100%. Blended approval rate will be lower than at 25% even if both segments perform identically. **Track each segment against its own baseline.**

### Company funnel (weekly progression):
| Week | Created | Seg% | Docs% | Appr% | Maturity |
|------|---------|------|-------|-------|----------|
| Jan 25 (25%) | 73 | 98.6 | 67.1 | 47.9 | 3 wks |
| Feb 1 (25%) | 93 | 98.9 | 61.3 | 35.5 | 2 wks |
| **Feb 8 (100%)** | **136** | **97.8** | **48.5** | **10.3** | **1 wk** |

Normal maturation pattern. 10.3% at 1 week is expected — Feb 1 was also ~35% at 2 weeks. No degradation.

### Individual funnel (weekly progression):
| Week | Created | Seg% | Docs% | Appr% | Maturity |
|------|---------|------|-------|-------|----------|
| Jan 25 (25%) | 53 | 94.3 | 41.5 | 28.3 | 3 wks |
| Feb 1 (25%) | 51 | 92.2 | 43.1 | 33.3 | 2 wks |
| **Feb 8 (100%)** | **107** | **90.7** | **37.4** | **23.4** | **1 wk** |

Normal pattern. Docs rate (37.4%) is within range of weekly variation (39.6-43.3% across all 25% weeks). Will revisit at 2 weeks maturity.

### Phase 1 Verdict: GREEN
- Volume flowing correctly
- Both entity types progressing normally for their maturity
- Entity mix shift noted (-9pp Company share) — not a problem but means blended rate expectations should be adjusted

### Follow-ups for Week 2 (Feb 21)
1. Re-run weekly-by-entity query — compare Feb 8 at 2 weeks maturity to Feb 1 at 2 weeks (today's snapshot)
2. Track whether entity mix shift stabilizes
3. Request Ops data on reopened requirements rate for post-rollout cohort (needs-human task)

---

## Retrospective (fill after maturity)

_To be completed after Week 4 maturity window closes (Mar 8)._

| Question | Answer |
|----------|--------|
| Was the 25% sample representative of 100%? | Partially — entity mix shifted 9pp toward Individual |
| Did entity mix shift at 100%? | Yes — Company 65%→56%, Individual 35%→44% |
| Did Company approval hold? | (Week 4) |
| Did Individual approval hold? | (Week 4) |
| What was the biggest surprise? | (Week 4) |
| What would we monitor differently next time? | (Week 4) |
| Recommended changes to this playbook? | (Week 4) |

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-02-14 | Claude Code + Yonatan | v1.1 — Added apples-to-apples cohort methodology, entity type as breakdown (not comparison), weekly-by-entity baselines, Phase 1 results |
| 2026-02-14 | Claude Code + Yonatan | v1.0 — Created from UK 100% rollout monitoring plan |
