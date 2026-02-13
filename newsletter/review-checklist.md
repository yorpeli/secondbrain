# CLM Newsletter — Review Checklist

> Run through this before sending each newsletter.
> Can be used by Yonatan, by Claude (via PMM + PM team context), or both.

---

## 1. Structure Check

- [ ] Opening has a personal note and sign-off
- [ ] "Status of CLM" section is present with a consistent header
- [ ] Approval rates table shows rolling 4 months
- [ ] Rollout status one-liner is present (with new countries or explicit "no change")
- [ ] Key Achievements are grouped by swimlane, each with "why it matters"
- [ ] Challenges/learnings are separated from achievements (not buried)
- [ ] Looking Ahead section has new forward-looking items
- [ ] Open Items Tracker carries forward all unresolved items from previous months

---

## 2. Content Quality

- [ ] Every achievement is specific and measurable (no "significant progress" without numbers)
- [ ] Every "why it matters" connects to business impact (revenue, conversion, cost, CX, compliance)
- [ ] Approval rate numbers are consistent with known data (cross-check with PPP/analytics)
- [ ] No item appears in both "achievements" and "challenges" — pick one
- [ ] Depth is roughly balanced across swimlanes (no single area > 40% of achievements)
- [ ] Acronyms defined on first use or are well-known to the audience

---

## 3. Continuity Check

Cross-reference with `newsletter/history.md`:

- [ ] Every item from last month's "Looking Ahead" is accounted for (either in achievements, challenges, or open items tracker)
- [ ] Every item in the open items tracker has a real status update (not just carried forward silently)
- [ ] Items open for 2+ months are flagged for review
- [ ] No item silently disappeared between newsletters

---

## 4. Voice & Tone (PMM Review)

Run PMM agent at `standard` depth with audience = `leadership`, content type = `status_update`.

Key checks:
- [ ] Active voice preferred throughout (flag passive constructions)
- [ ] Lead with impact, not activity ("Reduced review time from 3 days to 1" not "The team worked on reducing review time")
- [ ] No anti-patterns from brand voice guidelines (vague claims, effort-as-status, unnamed stakeholders)
- [ ] Consistent tense and formatting (bullet style, capitalization, date formats)
- [ ] Personality: smart not self-indulgent, straight-talking not blunt, accessible not generic

---

## 5. Data Enrichment (PM Team Context)

Pull from PPP data and agent memory to check:

- [ ] Are there PPP items from the month that should be mentioned but aren't? (query `ppp_sections` for the relevant weeks)
- [ ] Do agent_log findings or recommendations from the month add context to any achievement?
- [ ] Are there red/yellow flags from the hub-countries agent or analytics that should be acknowledged?
- [ ] Does the "Status of CLM" summary align with what the data actually shows?

---

## 6. Polish

- [ ] Spell check / typo scan
- [ ] Consistent date formatting throughout
- [ ] Table formatting renders correctly
- [ ] No garbled or truncated text
- [ ] Links and references are complete
