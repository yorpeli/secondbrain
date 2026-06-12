# Partner Retro Guide (Product × Partner, per line)

> **The product lead runs this, bringing in the partner their line depended on** — they
> hold the context and the trust. We don't ask partners to run their own retro; the
> product lead owns it. Partner retros happen **before** the joint session so their input
> becomes raw material for the synthesis, not an afterthought.

Each line pairs to one partner:

| Line (product lead) | Partner |
|---|---|
| KYC (Elad) | Ops — the 350-person manual-review operation |
| Self-Service (Ira) | Enterprise |
| Policy & Eligibility (Ido) | Compliance |
| China (Jojo) | China local team (Jojo also runs one *with* the local team) |

*(Localization has no partner retro. Legal and Partnerships were dropped — less
significant to these lines.)*

This is the most delicate layer. Partners have **different incentives** — Compliance
carries regulatory exposure, Ops owns a large operation under scrutiny, the China local
team sits across an org boundary. A fully open room can suppress candor or turn into
positioning.

---

## The hybrid model (this is the key design choice)

Research is explicit: AAR doctrine *permits* including partners/suppliers, but practice
warns that outsiders in an open room hurt psychological safety. So for each partner:

```
1. PRIVATE 1:1s first  →  2. CURATED joint partner session  →  3. lead synthesizes
   (candid, sensitive)     (shared, blameless, forward)         (into a partner findings card)
```

**Step 1 — 1:1s (run by the product lead):** Gather the candid, sensitive input
one-on-one — where Compliance felt rushed, where Ops absorbed cutover volume without
enough warning, where the China hand-off stalled, where Enterprise needs got deprioritized.
This is where the hard truths surface. Capture, attribute carefully, and mark sensitive
items **appendix-bound**.

**Step 2 — Curated partner session:** A shared, forward-looking room. The product lead
brings the *themes* from the 1:1s (de-identified where needed) and runs the AAR spine on
the **working relationship and the seams** — not on grading individuals. Keep it blameless
and oriented to "how do we run the next rollout together better."

**Step 3 — Synthesize** into a Partner Findings card (below).

---

## Running the curated session (AAR, partner-framed)

**1 · Intended (10 min)** — What did we agree this partnership would deliver for the rollout? SLAs, sign-off gates, escalation paths, integration commitments.

**2 · Actually happened (20 min)** — Facts on the working relationship: where hand-offs worked, where they stalled, sign-off latency, surprises in both directions.

**3 · Why the gap (30 min)** — Seams between us and them: Were they engaged early enough? Were requirements clear? Did escalation work? For vendors: integration quality, support responsiveness, coverage gaps. **Frame as shared system, not blame.**

**4 · What we change (15 min)** — Concrete changes to the operating model with this partner for the next rollout. Owner + date.

---

## Partner-specific lenses

- **Compliance (Policy & Eligibility / Ido):** Were they in the room early enough on policy/eligibility decisions? Did go/no-go criteria reflect compliance reality? Regulatory findings → **appendix**.
- **Ops — 350-person review operation (KYC / Elad):** Were they prepared for the cutover volume? Training, tooling, staffing ramp, handback to steady-state. Named-ops issues → **appendix**.
- **Enterprise (Self-Service / Ira):** Were enterprise needs and edge cases represented in scope and sequencing? Where did self-service vs. enterprise priorities collide?
- **China local team (China / Jojo):** Cross-org hand-offs, local regulatory/market specifics (CN/HK), timezone and decision-latency seams. Run one with the local team directly. Sensitive local-market items → **appendix**.

---

## Deliverable: Partner Findings card (one per partner)

```markdown
# Partner Retro — {Ops | Enterprise | Compliance | China local team}
**Product lead (facilitator):** {name}   **Line:** {line}   **Date:** {date}

## Relationship findings (shareable)
- **What worked:** {…}
- **Seams / what to fix:** {finding} — **change:** {what} — **owner:** {who} — **by:** {when}

## Dependencies this exposes for the joint session
- {cross-team or org-level items the joint session must resolve}

## Appendix-bound (restricted — do NOT put in wide book)
- {vendor performance specifics, regulatory findings, named-ops issues}
```

File to `docs/cards/partner-{slug}.md`. Feeds the joint session.
