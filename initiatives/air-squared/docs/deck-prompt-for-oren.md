# AIR² Deck for Oren — Prompt for Claude AI

## General Instructions

Create a **2-slide PowerPoint presentation** for AIR² (AI Revolution squared), Payoneer's fast AI experimentation initiative. This deck is a **resource ask** to Oren Ryngler (CPO) — the goal is to get approval for a dedicated execution team and air cover to move fast.

**Critical context:** A previous version of this initiative was pitched to Oren by a different leader (Tal Arnon). It was rejected because it was infrastructure/enablement-focused — "build a platform so others can innovate." The new version, led by Yonatan Orpeli, is execution-focused: ship experiments to production, measure throughput and impact, keep or toss fast. The deck must make this contrast obvious without explicitly calling out the previous failure.

**Audience:** Oren Ryngler, CPO. He wants to see results, not platforms. He wants clarity, not ambition. He wants a tight scope with accountability.

**Tone:** Confident, concise, action-oriented. No fluff. Every element on the slide should earn its place. This is a "we know what we're doing, give us the people and get out of the way" pitch.

---

## Brand Guidelines

Follow Payoneer brand guidelines strictly:

### Theme
Use the **dark theme** — this is a presentation/keynote moment.
- **Background:** Charcoal Black (#1E1E28)
- **Primary text:** Pure White (#FFFFFF)
- **Secondary text:** Mid Gray (#888899)
- **Primary accent:** Neon Purple (#977DFF) — for highlights, key terms, section headers, badges
- **Secondary accent:** Electric Blue (#0033FF) — for interactive elements, secondary emphasis
- **Decorative elements:** Circle outlines and dotted patterns in low-opacity purple/blue (rgba overlays at 20-25%) — use sparingly

### Typography
- **Font:** Avenir Next World (fallback: DM Sans, system sans-serif)
- **Monospace accent font:** Space Mono — for labels, badges, metadata, category tags
- **Headers:** Demi weight, ALL CAPS or Title Case
- **Body:** Regular weight, sentence case
- **Labels/badges:** Monospace, uppercase, letter-spacing 1.5-3px, 10-12px

### Logo
- Payoneer logo: white wordmark on dark background, bottom-left corner of each slide

### Layout Principles
- Minimalistic — strip out anything non-essential, embrace negative space
- No cards with rounded corners on dark theme (that's a light theme pattern)
- Content sits directly on the dark background
- Use flat layout, strong hierarchy through typography size and weight contrast
- If using gradient for a CTA or banner section: Midnight Blue (#002373) to Charcoal Black (#1E1E28)

---

## Slide 1: Scope & Framework

**Title:** `M:AIR² | Scope Alignment`

**Subtitle/Mission line:** `Disruption in production — ship experiments, not platforms`
(This one-liner is critical — it signals to Oren that this is different from the previous pitch. "Not platforms" is the key phrase.)

### Three-Column Layout

**Column 1: Mission & Principles**
Header: "Mission & Principles" with sub-label "Core Values & Operating Rules"

Bullet points (use concise, punchy language):
- Move fast, might fail — value emerges from velocity
- Fail fast, learn fast
- No dependency on "Payo" flows — we don't get blocked
- Low hanging fruits + high value only (no rabbit holes)
- MVP is NOT an investment — the team is
- Dedicated execution team — high-caliber people

Key change from original slide: Replace "value is TBD" with "value emerges from velocity." Replace "Mercenaries — high-end people" with "Dedicated execution team — high-caliber people."

**Column 2: Framework**
Header: "Framework" with sub-label "Discovery → Build → Validate → Scale"

Show as a vertical flow/funnel with four steps. Each step has a label and a time constraint:
1. **Discovery** — Up to 3 Days
2. **Dev / Build MVP** — Up to 1.5 Weeks
3. **Keep or Toss** — After a 3-Week Run (joint decision)
4. **Scale** — Successful MVPs only

Add a small note or visual cue next to "Keep or Toss" indicating it's a group decision, not top-down. Something like "(joint decision — leadership team)" in secondary text.

The total cycle is ~5 weeks per experiment. Make this visible — either annotate the total or make the time constraints prominent enough that Oren can do the math instantly.

**Column 3: Team & Enablement**
Header: "Team & Enablement" with sub-label "People, Tools & Org Culture"

Split into two sub-sections:

**Team** (with checkmarks or bullet indicators):
- 2 Devs + 1 PM (dedicated execution team)
- External IDEs — break walls
- India engineering team for rapid experiments (~50 engineers, first mission: stand up environment)

**Org Enablement:**
- Ideation layer — anyone can submit experiment ideas
- Encourage org-wide innovation culture
- Idea collection + lightweight effort estimation

### Bottom Bar: Success Metrics

Two metric boxes side by side at the bottom of the slide, styled as highlighted metric cards (use Neon Purple accent or Midnight Blue gradient background):

**Left metric:**
- Label (monospace, uppercase): `THROUGHPUT`
- Title: **"The Beat"**
- Description: Number of experiments pushed to production per month

**Right metric:**
- Label (monospace, uppercase): `IMPACT`
- Title: **"Innovation Delta"**
- Description: Estimated potential impact (cost savings or revenue) of projects moved to Scale phase

**Third metric (NEW — add this):**
- Label (monospace, uppercase): `GUARDRAILS`
- Title: **"Enterprise Grade"**
- Description: All experiments within security, compliance & enterprise standards — no exceptions

This third metric is important. It tells Oren: we move fast but we don't cut corners on security/compliance. Position it as a constraint we embrace, not one that slows us down. Make it visually equal weight to the other two metrics — it's not a footnote, it's a first-class success criterion.

---

## Slide 2: The Ask + Concrete Examples

**Title:** `M:AIR² | What We Need & What We'll Ship`

This slide has two purposes: (1) make the resource ask explicit, and (2) show Oren concrete experiment examples so this doesn't feel abstract.

### Left Half: The Ask

Header: "What We Need" (in Neon Purple accent)

Three clear ask items, each with a short label and one-line explanation. Format as a clean list with clear visual hierarchy:

1. **Dedicated Team**
   2 engineers + 1 PM, full-time on AIR². Execution-focused — these are the people who ship experiments, not plan them. Internal allocation, not new hires.

2. **Environment & Access**
   A sandbox with enterprise guardrails — security-compliant, isolated from production flows, ready for rapid development. India engineering team's first mission is to stand this up. Platform Engineering (Tomer Raivit) is supporting.

3. **Air Cover**
   Freedom to move at AIR² speed without getting blocked by standard release processes or cross-team dependencies. The "no Payo dependency" principle needs organizational backing.

### Right Half: Example Experiments

Header: "What We'll Ship — Week 1 Candidates" (in Neon Purple accent)

Show 2-3 concrete experiment ideas in a compact format. Each one should have:
- A short, punchy name
- One-line description of what it does
- Estimated effort (e.g., "~1 week")
- Potential impact category (e.g., "Cost savings" or "Efficiency")

**Example 1:**
- **Name:** Vendor Spend Optimizer
- **What:** Agent that consolidates vendor data across systems, identifies spending inefficiencies and redundant contracts
- **Effort:** ~1 week build
- **Impact:** Cost savings — vendor portfolio optimization

**Example 2:**
- **Name:** Knowledge Navigator
- **What:** Agent that surfaces undocumented organizational knowledge from scattered sources, reducing dependency on individual expertise
- **Effort:** ~1 week build
- **Impact:** Efficiency — faster onboarding, fewer knowledge bottlenecks

**Example 3:**
- **Name:** [Leave as placeholder: "Experiment #3 — TBD from ideation pipeline"]
- **What:** First experiment sourced from open idea submission across the org
- **Effort:** TBD
- **Impact:** Validates the ideation-to-execution pipeline

The third one being a placeholder is intentional — it shows Oren that the system is designed to continuously source ideas, not just execute a pre-defined list.

### Bottom: Team & Timeline

A simple horizontal timeline or bar showing:
- **Week 0-1:** Environment setup (India team + Platform Engineering)
- **Week 1-2:** First experiment Discovery + Build
- **Week 3-5:** First Keep/Toss decision
- **Month 2+:** Steady-state "Beat" — continuous experiment throughput

Below the timeline, a single closing line in accent color:
**"We prove by doing — not by planning."**

---

## Formatting Notes

- Both slides should feel like they belong together — same visual language, same hierarchy approach
- Slide 1 is the "what and how," Slide 2 is the "what we need and what you'll get"
- Keep text density moderate — Oren should be able to scan each slide in 30 seconds
- The Payoneer logo should appear on both slides (bottom-left, white wordmark)
- Slide numbers bottom-right
- No stock images, no decorative illustrations — this is a serious operational pitch, not a marketing deck
