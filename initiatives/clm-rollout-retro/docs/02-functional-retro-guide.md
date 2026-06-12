# Combined & Horizontal Retro Guide (R&D × Product · Design · Data)

> This guide covers the **middle layer** of the cascade — two kinds of session that sit
> between the solo internal retros (`01`) and the joint (`04`):
>
> **A. The R&D × Product combined retro** — one per line, run by the **product lead**.
> **B. The Design and Data horizontal retros** — one each, run by those function leads.
>
> Both consume the Top-3 cards from the internal retros and produce a summary card for the joint.

---

## A. The R&D × Product combined retro (per line)

**Who runs it:** the product lead, with their R&D counterpart co-facilitating.
**Room:** the line's R&D and Product people together (KYC: Elad + Omer · Self-Service:
Ira + Shani · Policy: Ido + Meytal/Linda · China: Jojo + Wei · Localization: Eliya +
Valentine). ~75 min.
**Inputs:** both internal Top-3 cards for the line (R&D side + Product side). Pre-read
them — especially anything one side tagged `Needs: our R&D/Product counterpart`.

### Why this layer exists

The two internal retros deliberately ran apart so each side's account stayed unfiltered.
This is where they meet. Most rollout pain on a line lived in the **seam between R&D and
Product** — spec-to-build hand-offs, decisions made without the other half in the room,
"we thought you owned that." The solo retros can name those items; only the combined room
can resolve them.

### The session

Don't re-run the two internal retros. Start from where they **disagree or point at each
other**, then run the AAR spine on the seam:

**1 · Reconcile (15 min)** — Put the two Top-3 lists side by side. Where do they tell the
same story? Where do they contradict? The contradictions are the agenda.

**2 · Why the seam (35 min)** — For each cross-side item: *why* did the hand-off, decision,
or dependency play out that way? Push to the system cause, not the individual. Sort into
"we can fix this inside the line" vs. "this needs the org / another line / our partner."

**3 · What we change (20 min)** — Concrete changes to how R&D and Product run a rollout
together. Each one: *what* + *owner* + *by when*.

**Close (5 min):** confirm the line's **combined Top-3–5** and which items are
appendix-bound. These carry forward to the partner retro (`03`) and the joint (`04`).

---

## B. The Design and Data horizontal retros

**Who runs them:** the Design lead and the Data lead (one session each, ~90 min).
**Why separate from a line:** Design and Data worked *across* every line. A per-line retro
can't see that, say, instrumentation lagged the rollout on all five lines, or that the
design system forked under deadline pressure everywhere. The horizontal cut makes those
**cross-line craft patterns** visible.

**Inputs:** all internal Top-3 cards — pull the items tagged `Needs: design` / `Needs: data`.

### The session (same AAR spine, craft-framed)

**1 · Intended (10 min)** — This function's role and the bar it set: design-system
coverage, research/usability gates · data instrumentation, funnel/CVR observability,
monitoring coverage.

**2 · Actually happened (20 min)** — Walk the tagged items. What recurred across lines?
Ground it in the live window with the war-room operators (Data → Chen Alcalay, Nadia/Mor
on monitoring; Design → the lines that hit UX/localization friction).

**3 · Why the gap (35 min)** — System causes specific to the craft:
- **Design:** design-system drift under deadline, localization/UX friction (BR/UK, CN/HK), research coverage vs. ship pressure, hand-off clarity to R&D.
- **Data:** instrumentation timing, funnel/CVR observability, cohort views, the gap between "we shipped" and "we could see it working," dashboard/monitoring readiness.

**4 · What we change (20 min)** — Craft-level standards for the next rollout. Owner + date each.

**Close (5 min):** confirm the function's **Top-3–5 cross-line findings** + what's appendix-bound.

---

## Deliverable (both kinds): a Summary card

```markdown
# {Combined Retro — <Line>}  |  {Horizontal Retro — Design | Data}
**Facilitator:** {product lead | function lead}   **Date:** {date}   **Participants:** {names}

## Findings (3–5)
### Finding 1 — {title}
- **Pattern:** {the seam/cross-line pattern — who, what recurred}
- **Why:** {system cause}
- **Impact:** {on rollout}
- **Change:** {what} — **owner:** {who} — **by:** {when}

### Finding 2 … (repeat)

## What worked (keep-doing)
- {…}

## Dependencies for the joint session
- {cross-line or org-level items only the joint can resolve}

## Appendix-bound (sensitive)
- {vendor/regulatory/named-ops items}
```

File to `docs/cards/combined-{line}.md` or `docs/cards/horizontal-{design|data}.md`. Feeds the joint session.
