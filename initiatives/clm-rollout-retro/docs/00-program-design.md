# CLM Rollout Retrospective — Program Design

> The operating manual for the post-rollout retrospective. Read this first; the
> per-stage guides (`01`–`04`) and the book template (`05`) hang off this spine.
> Research foundation and citations: `99-research-foundation.md`.

**Owner:** Yonatan Orpeli (VP Product, CLM) — program sponsor & joint-session facilitator
**Scope:** The full multi-month CLM rollout culminating in the 6/15 cutover to 100% and the 6/15→7/1 stabilization window.
**Goal:** A shared, honest account of what worked and what didn't — synthesized into a **tiered "book"** (widely-shared lessons + a restricted appendix) with **owned, time-bound follow-through**.

---

## Design decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| **Sequence** | Capture → per-line retros (R&D internal · Product internal · R&D×Product · Product×Partner) + Design/Data → Joint → Book | Each line cascades from solo retros up to a combined and a partner retro; all fan into one joint synthesis. Partners are brought in by the product lead — we don't ask them to self-run. |
| **Line = a pair** | Every product line runs as a **Product lead + R&D counterpart**, plus the external **partner** that line depended on | The rollout was built and felt by both halves of each line; a single team retro would lose one side of the story. |
| **Output** | **Tiered**: a wide-share book + a restricted appendix | Dissemination breadth (research-backed) without exposing vendor scorecards, regulatory findings, or 350-ops specifics. |
| **Facilitation** | **Leads run their own** internal + combined retros; Yonatan runs the Joint | Scales the calendar; keeps the VP out of team-level rooms where presence would mute candor. |

---

## The two frameworks we're using

We borrow the proven spine of each, rather than inventing a format.

- **After-Action Review (AAR)** — drives the *conversation* in every session. Four questions:
  1. **What did we intend** to accomplish? (the plan / targets)
  2. **What actually happened**? (the facts, no spin)
  3. **Why the gap** — what went well, what didn't, and *why*?
  4. **What do we change** next time? (specific, owned)
  AAR doctrine separates **the review** (the meeting) from **the report** (the written corrective-action doc) — we honor that split: sessions feed the book, they are not the book.

- **Blameless postmortem (Google SRE)** — drives the *document* (the book) and its dissemination: standard structure, themed action items, senior review before release, widest beneficial audience, central searchable home.

**Blameless rule, stated up front in every session:** we examine *systems and decisions*, not people. The goal is a CLM org that doesn't re-learn these lessons on the next country rollout.

---

## The fan-in shape

```
STEP 0 — Capture (running now)
   │
   ▼
PER LINE   (KYC · Self-Service · Policy & Eligibility · China · Localization*)
   ├─ R&D internal        ─┐
   ├─ Product internal     │   (design + data embedded in the product retro)
   ├─ R&D × Product        │
   └─ Product × Partner   ─┘   (*Localization runs internal + combined, no partner)
   │
   +  Design (own)   +  Data (own)
   │
   ▼
JOINT — one session, everyone   (cross-team review + dependency synthesis)
   │
   ▼
THE BOOK — wide book + restricted appendix
```

Each layer produces a **structured handoff** upward (top-3 trend cards, combined-retro notes, partner findings). The joint session consumes all of them. Nothing is re-litigated downstream — each layer adds the cross-cutting view the layer below couldn't see.

### Session model

Counted per role, the matrix is:

- **Each R&D counterpart — 3 sessions:** internal · R&D×Product · joint.
- **Each product lead — 4 sessions:** internal · R&D×Product · Product×Partner · joint. *(Localization's lead has 3 — no partner.)*
- **Design and Data — 1 each:** their own retro (and they sit in on every product internal).
- **Plus one joint** with everyone.

So R&D×Product is a single shared meeting (it shows up in both leads' counts), and the joint is the one room they all end up in. Four full lines × four per-line meetings (16) + Localization's three (no partner) + Design + Data + the joint ≈ **22 sessions** feeding the book.

---

## Roster

**The lines (each runs as a Product lead + R&D counterpart, with one partner):**

| Line | Product lead | R&D counterpart | Partner |
|---|---|---|---|
| KYC | Elad Schnarch | Omer | Ops |
| Self-Service | Ira Martinenko *(also rollout execution lead)* | Shani | Enterprise |
| Policy & Eligibility | Ido Seter | Meytal / Linda | Compliance |
| China | Jojo | Wei | China local team *(Jojo also runs one with the local team)* |
| Localization (BR + UK) | Eliya | Valentine | — |

**Out of scope for now:** Licensing, Delegated Onboarding (Meital Lahat Dekter).

**Horizontal R&D:** Daniel Grin — **R&D lead for CLM engineering** — sits above the per-line R&D counterparts (Omer · Shani · Meytal/Linda · Wei · Valentine). Route him into the line R&D retros as the senior R&D voice, and into the joint. (Also the war-room go/no-go owner, banking partners, monitoring master.)

**Horizontal functions (1 retro each, also embedded in every product internal):** Design · Data.

**War-room operators to ensure are heard** (route into the relevant retro): Nadia Gorodetsky & Mor Saar (monitoring ops), Chen Alcalay (payer rollout & performance data).

**Partners kept** (the product lead facilitates and brings their partner in): Ops · Enterprise · Compliance · China local team. Legal and Partnerships were dropped — less significant to these lines.

**Escalation / book audience:** Yaron Zakai-Or (SVP) — keep informed; primary reader of the wide book.

---

## Schedule (anchored to the rollout window)

Cutover 6/15 · stabilize to 7/1 · retro runs through July. Dates are targets — compress if stabilization finishes clean.

| When | What | Who runs |
|---|---|---|
| **Now → ongoing** | **Step 0: open the capture channel.** Running "retro log" so the pre-cutover crunch and cutover day are recorded *while fresh*. | Yonatan / war-room ops |
| Wk of **7/7** | **Internal retros** — R&D internal + Product internal for all 5 lines (incl. Localization) (60–90 min each). Each files a top-3 card. | Line leads (R&D + product) |
| Wk of **7/14** (early) | **R&D × Product** combined retros (×5 lines, incl. Localization). | Product leads |
| Wk of **7/14** (mid) | **Product × Partner** retros (×4 lines — Ops, Enterprise, Compliance, China local team). | Product leads |
| Wk of **7/14** | **Design** + **Data** own retros (90 min each). | Design / Data leads |
| Wk of **7/21** | **Joint session** — everyone (half-day, cross-team review + dependency synthesis). | Yonatan |
| Wk of **7/28** | **Book draft** assembled. | Yonatan + scribe |
| Early **Aug** | **Senior review** of draft (small group), then **publish** wide + circulate appendix to the restricted list. | Yonatan |

---

## The non-negotiable: follow-through

The single most-cited failure mode in the research: AARs and lessons-learned **don't drive change unless every recommendation has an owner and a date.** Findings without follow-through mean "the same challenges get learned over and over."

So the book's action items are not a flat list — they are **tracked**. The book closes with a follow-through register (owner, date, status) that we revisit at a 90-day checkpoint. See `05-the-book-template.md`.

---

## Facilitator quick-map

| Running a… | Use guide |
|---|---|
| R&D or Product internal retro (you're a lead) | `01-team-retro-guide.md` |
| R&D × Product combined, or Design / Data retro | `02-functional-retro-guide.md` |
| Product × Partner retro (Ops/Enterprise/Compliance/China) | `03-partner-session-guide.md` |
| Joint session (everyone) | `04-joint-session-guide.md` |
| Building the book | `05-the-book-template.md` |
