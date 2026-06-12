# CLM Rollout Retrospective

## Initiative Context

- **Initiative slug**: `clm-rollout-retro`
- **Initiative ID**: `a76e8f49-3ff9-4743-a967-3a765fc8c004` <!-- from initiatives table -->
- **Status**: Active (P1)
- **Owner**: Yonatan Orpeli (VP Product, CLM) — program sponsor & joint-session facilitator
- **Supabase memory doc ID**: `563ce18e-643b-4e69-a796-40676b78285d` <!-- from content_sections -->
- **Window**: capture opens now (pre-6/15 cutover) → sessions run July → book published early Aug → 90-day follow-through checkpoint (~early Nov)

## What This Is

The structured retrospective on the full multi-month CLM rollout (culminating in the
6/15 cutover to 100% and the 6/15→7/1 stabilization window). A **multi-session cascade**:
each product **line** (Product lead + R&D counterpart + one partner) retros from the bottom
up — solo R&D internal + Product internal retros → R&D×Product combined → Product×Partner
→ Design/Data horizontal retros → one **joint** session with everyone — synthesized into a
tiered **"book"**: a widely-shared lessons-learned doc plus a restricted appendix, with
owned, time-bound follow-through. Success = the CLM org doesn't re-learn these lessons on
the next country/onboarding rollout.

## Your Role

Help run and synthesize the retrospective program. Specifically:
- Keep the facilitation kit (`docs/00`–`05`) current as decisions and dates firm up.
- Stand up and steward the **Step 0 capture channel** so the months pre-cutover and the
  cutover itself are recorded while fresh (memory-decay mitigation).
- Produce session artifacts: invites/pre-reads, the Top-3 intake cards, function/partner
  summaries, and the joint-session skeleton.
- Assemble the **book** from the cards + joint session; shepherd senior review → publish.
- Track the follow-through register; tee up the 90-day checkpoint.

## Key Principles

- **Blameless** — examine systems and decisions, not people. Stated up front in every session.
- **Patterns, not recipes** — AAR + blameless-postmortem spines, adapted to CLM; no rigid N-step formula (the research refuted those).
- **Follow-through or it didn't happen** — every recommendation gets an owner + date; revisited at 90 days.
- **Tiered candor** — sensitive material (vendors, regulatory, named ops) routes to the restricted appendix, never the wide book.
- **Local-first** — all artifacts under `docs/`; no Supabase writes without explicit ask (except workspace sync).

## Stakeholders

- **Yonatan Orpeli** — sponsor; runs the Joint session; owns the book.
- **Lines (Product lead + R&D counterpart → partner; each pair runs its own internal + combined retros):** Elad Schnarch + Omer (KYC → Ops) · Ira Martinenko + Shani (Self-Service, also rollout execution lead → Enterprise) · Ido Seter + Meytal/Linda (Policy & Eligibility → Compliance) · Jojo + Wei (China → China local team) · Eliya + Valentine (Localization BR+UK, no partner).
- **Out of scope for now:** Licensing, Delegated Onboarding (Meital Lahat Dekter).
- **Horizontal functions (own retro each, also embedded in product internals):** Design · Data.
- **Horizontal R&D:** Daniel Grin — R&D lead for CLM engineering — sits above the per-line R&D counterparts (Omer/Shani/Meytal·Linda/Wei/Valentine); route into line R&D retros + the joint. (Also war-room go/no-go owner, banking partners, monitoring master.)
- **War-room operators to route into sessions:** Nadia Gorodetsky & Mor Saar (monitoring ops) · Chen Alcalay (payer rollout & perf data).
- **Partners (product lead brings them in):** Ops · Enterprise · Compliance · China local team.
- **Yaron Zakai-Or** (SVP) — primary reader of the wide book; keep informed.

## Related Initiatives

- `clm-war-room` (`d25a9e07-278f-4423-8a59-8ee704315117`) — the governance layer for the live window; this retro is its post-rollout successor. Pull incident log, go/no-go outcomes, and decisions from the war-room `docs/` and memory as retro source material.
- `clm-full-rollout` (`df5220b5-9825-4282-9f63-c6b95abec0af`) — the program/track/KPI source of truth; the "what we intended vs. what happened" baseline for the AAR.

## Working Files

All drafts, session artifacts, cards, and the book go under `docs/`.

| File | Purpose |
|------|---------|
| `docs/00-program-design.md` | The operating manual — decisions, cascade, schedule, roster |
| `docs/01-team-retro-guide.md` | Handout for R&D + Product internal retros + Top-3 card template |
| `docs/02-functional-retro-guide.md` | R&D×Product combined + Design/Data horizontal retros |
| `docs/03-partner-session-guide.md` | Product×Partner retros (Ops/Enterprise/Compliance/China) — hybrid 1:1 + curated |
| `docs/04-joint-session-guide.md` | The keystone joint session (everyone) |
| `docs/05-the-book-template.md` | The tiered output — wide book + restricted appendix |
| `docs/99-research-foundation.md` | Cited research foundation + confidence levels |
| `docs/cards/` | Filed session cards (team Top-3, function & partner summaries) |
| `memory.md` | Working memory across Claude Code sessions |
| `context.md` | Domain reference — rollout facts, roster, the AAR baseline |
| `../../context/brand-guidelines.md` | Payoneer brand guidelines (shared) |
