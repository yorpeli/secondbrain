# Joint Session Guide (the keystone)

> **Yonatan facilitates. Half-day.** This is the one room with everyone in it — where the
> per-line retros, the combined retros, the Design/Data cuts, and the partner findings all
> converge. Its job is *not* to re-run anything below it — it's to resolve the
> **cross-line dependencies and shared-system issues** that no single layer could fix, and
> to lock the narrative for the book.

**Inputs (pre-read, all of them):** the internal Top-3 cards (R&D + Product per line) ·
the combined-retro cards (one per line) · the Design and Data horizontal cards · the
partner findings cards. By now the recurring cross-cutting themes should be visible —
your prep job is to cluster them before the room opens.

**Room:** each line's pair (product + R&D leads — Elad/Omer, Ira/Shani, Ido/Meytal·Linda,
Jojo/Wei, Eliya/Valentine), the Design and Data leads, **Daniel Grin (R&D lead for CLM
engineering — horizontal across all lines)**, the partners brought by their product leads,
and key war-room operators (Nadia/Mor, Chen). Yaron optional — decide based on whether his
presence helps or mutes candor.

---

## Format: cross-team review, not status

Use the proven **cross-team review model**: a team walks its key finding while the
others ask questions and learn — then the dependency that finding exposes gets owned.
Learning is the point, not reporting.

### Pre-work (Yonatan, before the session)
Cluster every card's findings into **a small number of themes** (aim for 4–6 — the
research model splits even a major incident into ~5 themes). Candidate CLM themes,
to be confirmed by the data:
- R&D↔Product seam & cross-line dependency management
- Go/no-go criteria & decision latency
- Monitoring, instrumentation & "could we see it working"
- Partner readiness & timing (Ops cutover volume, Compliance, Enterprise, China hand-off)
- Design-system & localization friction (BR/UK, CN/HK)
- Scope discipline & what we deferred

### Agenda (half-day)

**1 · Frame (10 min)** — Blameless rule. The rollout outcome in one slide (what we shipped, the headline numbers). Purpose: fix the seams, write the book.

**2 · Theme walk (≈25 min × themes)** — For each theme:
- The team/function that owns the sharpest example walks it (5 min).
- Others ask questions, add their version of the same pattern (10 min).
- **Land it:** agree the root cause and the *one change* — with an **owner and a date** (10 min). If it's a cross-line dependency, name which lines and who arbitrates.

**3 · Keep-doing (15 min)** — The wins worth institutionalizing across teams. These matter as much as the fixes — the book is "what worked AND what didn't."

**4 · The book & follow-through (15 min)** — Confirm the theme set, the owners, the 90-day checkpoint, and what's appendix-bound vs. wide. Assign the scribe.

---

## Facilitation notes

- **Protect the blameless frame.** If the room drifts to blaming a team or a vendor, pull it back to the system: "what about how we worked made that the likely outcome?"
- **Force ownership.** A theme without an owner + date is not done. This is the research's #1 failure mode — don't leave the room with orphan findings.
- **Cross-line items are yours to arbitrate.** Where two lines point at each other, you (the VP) own the call on who owns the fix.
- **Capture verbatim, theme live.** The scribe fills the book skeleton (`05`) in real time so the draft is 70% done when the room ends.

---

## Deliverable

A populated **book skeleton** (`05-the-book-template.md`) — themes, findings, keep-doings,
and a follow-through register with owners and dates — ready for drafting and senior review.
