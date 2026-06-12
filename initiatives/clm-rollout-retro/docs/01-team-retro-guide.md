# Internal Retro Guide (for R&D and Product leads)

> **You are facilitating your own team's internal retro.** This is a handout — everything
> you need is here. ~60–90 min. Your one deliverable afterward is a **Top-3 Trends card**
> (template at the bottom) that feeds your line's combined retro and the joint session.

This is the bottom layer of the cascade. Every line runs **two** internal retros — the
**R&D** side and the **Product** side — separately, so each half of the story comes out
unfiltered before they meet. The lines and their pairs:

| Line | Product | R&D | Partner (later) |
|---|---|---|---|
| KYC | Elad | Omer | Ops |
| Self-Service | Ira | Shani | Enterprise |
| Policy & Eligibility | Ido | Meytal / Linda | Compliance |
| China | Jojo | Wei | China local team |
| Localization (BR + UK) | Eliya | Valentine | — |

Same format across all of them so the outputs stack cleanly. **If you're running the
Product internal retro, pull Design and Data into the room** — they're embedded in the
product side (and also run their own horizontal retro separately).

---

## Before the room (15 min prep)

- Pull your team's rollout artifacts: PPP entries, your tracks in `clm-full-rollout`, incidents, go/no-go items you owned, the risk register lines that were yours.
- Send the four AAR questions to your team 2 days ahead so people arrive with examples, not cold.
- **Open with the blameless rule** and mean it: *we examine decisions and systems, not people.* Name it out loud. If you (the lead) made a call that hurt, say so first — it sets the ceiling for everyone's honesty.

> ⚠️ **Lead-as-facilitator caveat:** you can't fully chair *and* participate. Pick one of:
> ask a senior IC to scribe and gently chase quiet voices; or run a 5-min silent-write
> on each question before discussion so the room's input isn't anchored to yours.

---

## The session (AAR four-question spine)

Timebox each block. Capture verbatim — you'll theme it later.

**1 · What did we intend? (10 min)**
What were *our team's* commitments in the rollout — targets, dates, the tracks we owned? State the plan as it was, not as it should have been.

**2 · What actually happened? (20 min)**
The facts. What shipped, what slipped, what broke, what we caught. Pull in the senior R&D / war-room voices who touched your work (Daniel Grin on R&D / go/no-go & banking, Nadia/Mor on monitoring, Chen on payer perf data) — make sure their view is in the room.

**3 · Why the gap? (30 min) — the heart of it**
For each notable gap *and* each notable win: *why* did it happen? Push past the first answer to the system cause.
- Sort what surfaces into **In our control** vs. **Outside our control**.
- The **outside-our-control** items are the gold — those are the cross-team dependencies, hand-offs, and shared-system issues the joint session exists to fix. Flag them hard.

**4 · What do we change? (20 min)**
Concrete changes for the next rollout. Each one: *what* + *who'd own it* + *by when*. Distinguish "we can fix this ourselves" from "this needs the other half of our line (R&D↔Product), another team, or our partner." Items tagged for your R&D/Product counterpart are exactly what the **combined retro** (guide `02`) picks up next.

**Close (5 min):** read back the candidate Top-3. Confirm the team agrees these are *the* three.

---

## Your deliverable: the Top-3 Trends card

Pick your **three most important trends** — weighted toward recurring issues and anything
**outside your team's control**. These roll up; a flat dump of 20 items does not.

```markdown
# Internal Retro — Top-3 Trends
**Line:** {KYC | Self-Service | Policy & Eligibility | China | Localization}
**Side:** {R&D | Product}
**Lead:** {name}   **Date:** {date}   **Participants:** {n}

## Trend 1 — {short title}
- **What:** {the pattern, 1–2 lines}
- **In/Out of our control:** {In | Out | Mixed}
- **Why it happened:** {system/decision cause}
- **Impact on rollout:** {what it cost — time, quality, risk}
- **Proposed change:** {what} — **owner:** {who} — **by:** {when}
- **Needs:** {self | our R&D/Product counterpart | another line: which | design | data | partner: which}

## Trend 2 — {…}
## Trend 3 — {…}

## Wins worth keeping (1–3 bullets)
- {practices that worked and should become standard}

## For the restricted appendix (if any)
- {anything sensitive: vendor performance, regulatory specifics, named-ops issues —
   flag here so it routes to the appendix, NOT the wide book}
```

**File it:** drop the card in `docs/cards/{line}-{rnd|product}.md` (or send to Yonatan). It's the input to your combined retro (`02`) and the joint session (`04`) — without it your team's voice doesn't make the book.
