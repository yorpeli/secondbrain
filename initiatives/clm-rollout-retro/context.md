---
summary: CLM Rollout Retrospective domain reference — the rollout facts, roster, and the "intended vs. actual" AAR baseline the retro examines
topics: [clm-rollout, retrospective, after-action-review, lessons-learned, post-mortem]
agents: [team-lead]
---

# CLM Rollout Retrospective — Context

Domain reference for the retro program. The facilitation method lives in `docs/00`–`05`;
this file holds the *subject* — the rollout being examined and the baseline facts the AAR
"what did we intend vs. what actually happened" questions hang on.

## The rollout being examined

The multi-month CLM (Customer Lifecycle Management — KYC / onboarding / compliance) rollout,
culminating in the **6/15 cutover to 100%** and the **6/15 → 7/1 stabilization** window.
Spans five product teams, a 350-person manual review operation, external KYC vendors, and
banking partners. Governance during the live window ran through the **CLM War Room**
(`clm-war-room`); track/KPI status lives in **CLM Full Rollout** (`clm-full-rollout`).

## Source material for the AAR baseline

To reconstruct "what we intended" and "what actually happened," pull from:
- **`clm-full-rollout`** — the 7 rollout tracks, funnel KPIs, full risk register (intended plan).
- **`clm-war-room` `docs/` + memory** — incident log, go/no-go gate outcomes, decisions, daily-standup notes, health signals (what actually happened in the live window).
- **PPP reports** — week-over-week status across swimlanes through the rollout.
- **Meetings & action items** — 1:1 and cross-team intel not captured in PPP.
- **The risk whiteboard** (war-room) — the 8 active risks toward 6/15 and how each resolved.

## Roster (who's in which session)

**The lines — each runs as a Product lead + R&D counterpart, with one partner:**
| Line | Product lead | R&D counterpart | Partner |
|---|---|---|---|
| KYC | Elad Schnarch | Omer | Ops |
| Self-Service | Ira Martinenko (also rollout execution lead) | Shani | Enterprise |
| Policy & Eligibility | Ido Seter | Meytal / Linda | Compliance |
| China | Jojo | Wei | China local team (Jojo also runs one with the local team) |
| Localization (BR + UK) | Eliya | Valentine | — |

**Out of scope for now:** Licensing, Delegated Onboarding (Meital Lahat Dekter).

**Horizontal R&D:** Daniel Grin — **R&D lead for CLM engineering** — sits above the per-line
R&D counterparts (Omer · Shani · Meytal/Linda · Wei · Valentine); route into line R&D retros
as the senior R&D voice and into the joint. (Also war-room go/no-go owner, banking partners,
monitoring master.)

**Horizontal functions (1 retro each, also embedded in every product internal):** Design · Data.

**War-room operators to route into the right sessions:** Nadia Gorodetsky & Mor Saar
(monitoring ops) · Chen Alcalay (payer rollout execution & performance data).

**Partners kept (the product lead facilitates and brings their partner in):** Ops (the 350-person
review operation) · Enterprise · Compliance · China local team. Legal and Partnerships were
dropped — less significant to these lines.

**Escalation / book audience:** Yaron Zakai-Or (SVP) → Oren Ryngler (CPO).

## Known rollout texture (seed material — verify in sessions)

From the war-room risk register as of 2026-06-04 (the live-window snapshot):
- 🔴 **Critical risks toward 6/15:** Banking partnerships (Daniel) · Global/HK E2E (Linda) · Selfie CN/HK (Omer; test plan dependency on Einat).
- 🔵 **Medium:** redirect web (Shany) · redirect mobile (Almog) · monitoring master (Daniel) · server errors (Omer) · automation (Daniel).
- ⏸️ Deferred / out of scope for 6/15: 4 mobile risks + VIP STA link.

These are *candidate themes*, not conclusions — the sessions confirm what actually mattered.

## What "good" looks like for the output

A tiered book (wide lessons-learned + restricted appendix) that a future country/onboarding
rollout team can find, search, and reuse — with a follow-through register whose items
actually closed by the 90-day checkpoint. See `docs/05-the-book-template.md`.
