# Session Template — The Foundry

Every session follows this structure. Session leads should use this as their planning framework.

---

## Session Plan Structure

### 1. Session Header
- **Session #:** [number]
- **Title:** [name]
- **Level:** Makers L1 / L2 / L3 / Builders L1
- **Duration:** 90 min / 120 min
- **Lead:** [name]
- **Prerequisites:** What participants should have completed or know before this session

### 2. Learning Outcomes (3-4 max)
What will participants be able to DO after this session? Not "understand" — DO.
- Bad: "Understand how context windows work"
- Good: "Adjust prompt strategy based on context window limits to avoid truncation"

### 3. Session Flow

**Opening (10 min)**
- Quick connection to previous session — what did we learn, how does this build on it
- The "why" — one compelling example of why this skill matters for a PM
- Session roadmap — what we'll cover and what they'll walk out with

**Core Content (varies by session length)**
For 90-min sessions: ~50 min of content + exercises
For 120-min sessions: ~70 min of content + exercises

Structure as 2-3 content blocks. Each block follows:
1. Concept (5-10 min) — explain the idea with a PM-relevant example
2. Demo (5-10 min) — show it live, in the actual tool
3. Exercise (10-15 min) — participants do it themselves with their own work

**Synthesis (15 min)**
- Key takeaways — 3 things to remember
- Common mistakes — what to watch out for
- How this connects to the next session

**Assessment Setup (5-10 min)**
- Explain the assessment criteria for this level
- Point to the take-home exercise or portfolio item they should complete

### 4. Materials Required
- Tools needed (Claude, Cursor, specific MCP servers, etc.)
- Data or artifacts participants should bring
- Reference materials or cheat sheets to distribute

### 5. Exercises
Each exercise should include:
- **Context:** A realistic PM scenario (not abstract)
- **Task:** What participants need to do
- **Expected output:** What good looks like
- **Time box:** How long they have
- **Stretch goal:** For participants who finish early

### 6. Facilitator Notes
- Where participants typically get stuck
- Common questions and how to handle them
- Backup content if the session runs fast
- What to cut if running behind

---

## Quality Standards

### Every session MUST:
- Include at least one hands-on exercise using real tools (not slides about tools)
- Produce at least one artifact the PM keeps and reuses
- Connect explicitly to the session before and after it
- Use PM-specific examples (not generic "write an email" exercises)
- Address the enterprise context — data sensitivity, compliance, what you can/can't put into AI tools at Payoneer

### Every session MUST NOT:
- Be a lecture with exercises tacked on at the end
- Use toy examples that don't reflect real PM work
- Assume participants have coding experience (Makers L1-L2)
- Skip the "why this matters" framing
- Overlap significantly with content from another session

---

## Difficulty Calibration

| Level | Assumption | Exercise Complexity |
|-------|-----------|-------------------|
| L1 | No prior AI training. May have used ChatGPT casually. | Follow guided steps, fill in the blanks, compare outputs |
| L2 | Comfortable with AI tools. Can prompt effectively. | Design their own workflows, measure outcomes, build templates |
| L3 | Power users. Ready to build. Have Cursor installed. | Build working agents, evaluate outputs critically, present to peers |
| Builders L1 | Completed Makers. Can build basic agents. | Architecture decisions, integration design, POC development, spec writing |

---

## Payoneer-Specific Context

- All PMs have Cursor seats
- Claude Pro access is provided for the program duration
- Exercises should use Payoneer-relevant scenarios where possible (onboarding flows, KYC, compliance, cross-border payments) — but can be generalized when needed for confidentiality
- Enterprise data sensitivity is real — Session 3 (Risk & Quality) sets the guardrails that all subsequent sessions must respect
- The Feb 2026 PM Workshop covered adjacent topics (competitive research, data & insights, validation, communication) — session leads can reference those materials as a foundation
