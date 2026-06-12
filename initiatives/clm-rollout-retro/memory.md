# CLM Rollout Retrospective — Working Memory

## Last Session
- **Date**: 2026-06-09
- **What happened**: Restructured the program around a **per-line cascade** and propagated
  it through the whole kit (`docs/00`–`05`, `context.md`). The new shape, confirmed with
  Yonatan: each line = a **Product lead + R&D counterpart + one partner**; the cascade runs
  Capture → solo R&D internal + Product internal retros → **R&D×Product combined** →
  **Product×Partner** → **Design/Data horizontal** → one **Joint** with everyone → Book.
  - **Lines & pairs:** KYC (Elad/Omer→Ops) · Self-Service (Ira/Shani→Enterprise) · Policy &
    Eligibility (Ido/Meytal·Linda→Compliance) · China (Jojo/Wei→China local team) ·
    Localization BR+UK (Eliya + Valentine, no partner; Daniel Grin = R&D lead for CLM
    engineering, horizontal across all lines — not pinned to Localization).
  - **Dropped:** Licensing, Delegated Onboarding (Meital). **Partners dropped:** Legal,
    Partnerships (less significant to these lines).
  - **Session counts:** R&D ×3 (internal, combined, joint) · Product ×4 (internal, combined,
    partner, joint; Localization's lead ×3 — no partner) · Design & Data ×1 each · one joint
    with all ≈ 22 sessions.
  - Design + Data are **embedded in every product internal** *and* run their own horizontal retro.
  - **Communications plan:** heads-up email **sent 2026-06-09** to product + R&D leads
    (purpose, July run / August present, blameless "learning not finger-pointing" framing,
    hold July calendars, jot things down while fresh; explainer meeting flagged as next, no
    invites until after it). Then an explainer meeting before end of June to walk the flow.
- **Next steps**: (a) ~~send heads-up email~~ DONE 6/9; (b) schedule the end-of-June
  explainer meeting + build a short walkthrough (the phases, who's in which session, the ask);
  (c) draft the **Step 0 capture-log template** to stand up before 6/15; (d) confirm + create
  the Supabase initiative row + memory doc, fill IDs into CLAUDE.md.

## Open Threads
- **Heads-up email** sent 2026-06-09 (product + R&D leads). Explainer meeting (before end of June) not yet scheduled — the open item now.
- **Step 0 capture channel** must open before the 6/15 cutover (memory-decay mitigation) — not yet stood up.
- Schedule in `docs/00` is a proposal anchored to the rollout window (sessions July); confirm/compress once stabilization lands.
- Appendix access list (who can see vendor scorecards / regulatory findings) — TBD.
- DB writes (initiative row, content_sections) pending Yonatan's green-light.

## Context to Remember
- This retro covers the **whole multi-month rollout**, not just the war-room window. War room (`clm-war-room`) is the live-window governance predecessor; `clm-full-rollout` is the intended-vs-actual baseline.
- Frameworks: **AAR** drives the *meetings* (4-question spine; review ≠ report); **blameless postmortem** drives the *book* (structure, themed actions, senior review, dissemination).
- Guide mapping after the restructure: `01` = solo internal retros (R&D + Product); `02` = R&D×Product combined + Design/Data horizontal; `03` = Product×Partner; `04` = joint; `05` = book. Cards live in `docs/cards/`.
- Non-negotiable: every recommendation needs an **owner + date**; 90-day follow-through checkpoint (~early Nov). This was the #1 research-cited failure mode.
- Cutover 6/15 · stabilize → 7/1 · retro sessions July · book early Aug.
