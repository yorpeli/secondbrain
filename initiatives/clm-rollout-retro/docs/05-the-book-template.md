# The Book — Structure, Template & Dissemination

> The synthesized output of the whole program. **Tiered:** a **wide-share book**
> (org, peers, Yaron, future rollout teams) plus a **restricted appendix** (sensitive
> material, narrow list). Structure follows the blameless-postmortem model; the
> follow-through register is what makes it drive change instead of gathering dust.

---

## Two tiers, one source

| Tier | Contains | Audience |
|---|---|---|
| **Wide book** | Narrative, themes, what worked, de-identified lessons, recommendations, follow-through register | CLM org, PM peers, Yaron/leadership, future rollout teams |
| **Restricted appendix** | Vendor performance scorecards, regulatory/compliance findings, named review-ops issues, anything attributable & sensitive | Yonatan + named need-to-know only |

Everything tagged `appendix-bound` in the session cards routes to the appendix. When in
doubt, a lesson goes in the wide book in **de-identified** form and its sensitive specifics
go to the appendix.

---

## Wide-book structure

```markdown
# CLM Rollout Retrospective — Lessons Learned
Period: {rollout start} → 7/1 stabilization · Published: {date} · Owner: Yonatan Orpeli

## 1. Executive Summary
What the rollout was, the outcome vs. targets, and the 3–5 headline lessons. One page. Written last.

## 2. The Rollout in Brief
Scope (the tracks/teams), the timeline, the cutover, the numbers. So a future reader has context.

## 3. What Worked (keep-doing)
The practices, decisions, and structures to repeat on the next rollout. Concrete, not platitudes.

## 4. Lessons by Theme
The 4–6 themes from the joint session. For EACH theme:
  - The pattern (across which teams/functions)
  - Why it happened (system cause)
  - Impact on the rollout
  - What we're changing → see follow-through register
(Themes, not a flat list — this is how a multi-month, multi-team effort stays readable.)

## 5. Follow-Through Register   ← the part that makes this matter
| # | Change | Theme | Owner | Due | Status |
|---|--------|-------|-------|-----|--------|
| 1 | … | … | … | … | open |
→ Revisited at the 90-day checkpoint. No item ships without an owner and a date.

## 6. How We Ran This Retro
One paragraph on the method (so the next rollout can reuse it): the cascade — solo R&D and
Product internal retros per line → R&D×Product combined → Product×Partner → Design/Data
horizontal → one joint session → this book. Link to `docs/`.

## Appendix index
Pointer to the restricted appendix (not its contents): "Sensitive findings on vendors,
regulatory matters, and operations are held in the restricted appendix — request access from Yonatan."
```

### Per-lesson entry template (use inside §4)

```markdown
### {Lesson title}
- **What happened:** {the pattern}
- **Impact:** {time / quality / risk cost}
- **Root cause / contributing factors:** {system cause}
- **Early warning signs:** {what we could have noticed sooner}
- **Recommended change:** {specific}
- **Action item:** {what} — **owner:** {who} — **due:** {when}  → register #{n}
- **Sources:** {cards / PPP / incidents this draws from}
```

---

## Process: draft → review → publish

1. **Assemble** the draft from the joint-session skeleton + all cards (target: wk of 7/28).
2. **Senior review before release.** Share the draft with a small group of senior peers
   (e.g. 1–2 leads + Yaron) for completeness — *an unreviewed retrospective might as well
   not exist.* Incorporate, then finalize.
3. **Publish wide; circulate the appendix narrowly.** Store both in **one central, tagged
   home** so the next rollout team can actually find them — not scattered across decks and
   threads. Tag by phase/topic/team for searchability.
4. **Announce** to the widest beneficial audience (org channel + a note to Yaron). The point
   is reuse on the next country/onboarding rollout.

---

## Where it lives in the Second Brain

- **Local:** these `docs/` files are the working set; the published book lands as `docs/CLM-Rollout-Retro-Book.md`.
- **DB (when you say so):** the book can become a point-in-time `content_sections` artifact row on **this** initiative (`clm-rollout-retro`, `a76e8f49-3ff9-4743-a967-3a765fc8c004`), referenced from its memory doc (`563ce18e-643b-4e69-a796-40676b78285d`), and the appendix as a separate `is_private = true` row. Per workspace rules I won't write to Supabase until you ask.
- **90-day checkpoint:** schedule a review of the follow-through register (~early November) to confirm changes actually landed.
