# The Foundry — Working Memory

## Session Log

### 2026-03-11 — Setup
- Created local initiative workspace under `initiatives/foundry/`
- Copied 4 knowledge files from Claude.ai Project (syllabus, session template, content tracker, brand guidelines)
- Initiative has been active since 2026-03-02, syllabus restructured 2026-03-04

### 2026-03-11 — Dual-track expansion + lead updates
- Major update: Foundry is now dual-track (Product + Engineering), not product-only
- Engineering track owned by Tal. Own faculty, own session leads.
- Joint ceremonies (kickoff, graduation, demo days). Joint sessions where topics overlap.
- Cohort size: 10–20 per track. Both tracks target simultaneous launch.
- Product lead assignment changes from latest spreadsheet:
  - Session 3: Elad (new)
  - Session 4: Noa B. removed, now TBD
  - Session 7: Hisham Abdulhalim (new)
  - Session 9: Topaz (moved from Session 11)
  - Session 11: now TBD (Topaz moved to 9)
  - Session 13: Yoni Ramot (new)
- Down to 5 unassigned product sessions: 4, 10, 11, 12, 14
- Prompting framework renamed to ACTFC in Session 1

### 2026-03-12 — Engineering track syllabus added
- Full engineering syllabus received: 23 sessions across M1 (5), M2 (5), M3 (6), B1 (7)
- Original had duplicate session numbers (two 12s, two 13s) — renumbered to 1–23
- Level owners: Matan (M3), Daniel O (B1)
- Engineering leads: Noah Lerner (4 sessions), Omer Wolf (5 sessions), Shlomi (1), Daniel O (2)
- 11 engineering sessions unassigned
- Security sessions (Product S3 / Engineering S3) noted as potential joint session — not confirmed
- Updated Supabase initiative memory doc

### 2026-03-12 — Conversation with Omer (ops/PM) + timeline set
- **Omer's role**: Ops/project manager helping Yonatan lead the Foundry effort
- **Entry/exit criteria needed**: For each major level (Makers, Builders), define:
  - Minimum requirement to attend (entry bar)
  - Overqualification threshold (too advanced for this level)
  - Expected outcomes (what attendees walk away with)
  - This is critical for cohort selection and the 10-20 cap per track
- **First class scoping**: Need to decide with Tal what subset of sessions forms the first cohort. Not necessarily all sessions.
- **Timeline confirmed**:
  - Announce: week of March 22-23
  - Registration open: 2-3 weeks
  - First lessons: after Passover (~mid April 2026)
  - ~10 days to finalize syllabus, entry criteria, registration plan
- **Content development approach**: Omer built a Lovable tool for session leads to fill materials. Yonatan prefers simple docs — optimize for volunteers' convenience. Position: "whatever works for them." Omer was somewhat insulted but Yonatan held firm.
- **CISO involvement needed**: Yonatan needs to talk to CISO about security sessions. Key: must be framed as enablement ("what we CAN do with AI"), not restriction ("what we can't do").
- **Omer asked to reach out to PMs** to start working on their sessions

### 2026-03-13 — New topic areas from Oren + app building idea
- **"Developing for Agents"** — Oren Ryngler (CPO) flagged this. Agent-as-user paradigm: your product's next user isn't a human, it's another AI agent. APIs as primary interface, permission models, escalation patterns. The entire UX layer (onboarding, empty states, nudges) assumes a human — what when it's an agent? Deserves own session in both tracks. Likely Builders or Masters.
- **"Build an App" for PMs** — two levels:
  - Makers (L1/L2): No-code AI app building (Lovable or similar). PMs ship a simple working app in one session. Mindset shift from "request a tool" to "build the tool." Should be standalone session.
  - Builders: Shareable internal apps — real data, auth, persistence. Prototype-to-production bridge.
- Both added to syllabus parking lot for now. Will slot into specific sessions later.

### 2026-03-25 — Foundry expansion: Academy + Community
- **Major restructure**: The Foundry is now two pillars, not just the Academy
  - **Academy** — Cohort-based deep training (Product + Engineering tracks, expanding to more roles later)
  - **Community** — Broad access for the entire company, led by Itai Haetzni
    - Content management & accessibility: curates Academy content for broader consumption + produces own content
    - "AI for All" track: live sessions, events, other formats (details TBD)
- Academy and Community are parallel tracks with separate audiences
- Academy alumni/participants expected to give back to the org (mentoring, content, Community activities)
- Yonatan owns the entire Foundry. Claude's role expanded to help manage both pillars.
- Itai Haetzni is the Community lead (new stakeholder)

## Current State
- **Academy — Product track**: 14 sessions, 9 leads assigned, 5 TBD (4, 10, 11, 12, 14). All content: not started.
- **Academy — Engineering track**: 23 sessions, 12 leads assigned, 11 TBD. All content: not started.
- **Academy total**: 37 sessions across both tracks. 16 unassigned.
- **Community**: Early stage. Itai Haetzni leading. "AI for All" format TBD.
- **Timeline**: Announce March 22-23 → Registration 2-3 weeks → First lessons April 26 (post-Passover)
- **Executive briefing deck created** (5 slides) for Oren kickoff — saved to `docs/The_Foundry_Executive_Briefing.pptx`
- Meital working on data/dashboard exercise for Session 6 area — redirected to focus on PM data self-sufficiency
- Three LinkedIn assets created (course page, operating standard, game map)
- Omer reaching out to PM session leads to start content development
- Oren tracking multiple AI initiatives (WOW, Talent) — Foundry should align with these threads

## Key Decisions
- [2026-03-25] Foundry expanded: two pillars — Academy (cohort-based) + Community (broad access, "AI for All")
- [2026-03-25] Itai Haetzni leads the Community pillar
- [2026-03-25] Academy will expand beyond Product + Engineering to more roles over time
- [2026-03-25] Academy alumni expected to contribute back to the org via Community activities
- [2026-03-04] Agent content split: basic agents in Makers L3, skills/MCP in Builders L1
- [2026-03-04] Evaluating AI Output moved from L2 to L3 for judgment-oriented capstone
- [2026-03-04] Builders L1 boundary: everything on your machine. Shared data = L2.
- [2026-03-05] Session 6 enriched with competitive research + data/metrics from Feb workshop
- [2026-03-11] Dual-track structure: Product + Engineering under one Foundry brand
- [2026-03-11] Tal Arnon owns engineering track. Yonatan oversees everything + owns product track.
- [2026-03-11] Both tracks target simultaneous launch. Product can pilot if engineering not ready.
- [2026-03-11] Cohort size: 10–20 per track for initial rounds
- [2026-03-12] Engineering syllabus added: 23 sessions (M1–M3 + B1). Level owners: Matan (M3), Daniel O (B1).
- [2026-03-12] Security sessions = potential joint session, not confirmed yet.
- [2026-03-12] Timeline: announce March 22-23, registration 2-3 weeks, lessons after Passover.
- [2026-03-12] Content dev approach: simple docs preferred over Omer's Lovable tool. Optimize for volunteer convenience.
- [2026-03-12] Security sessions must be framed as enablement, not restriction. CISO conversation needed.

## Action Items
- [ ] Define entry/exit criteria for each level (both tracks) — needed before registration
- [ ] Decide with Tal: what sessions form the first cohort?
- [ ] Yonatan: talk to CISO about security sessions (enablement framing)
- [ ] Omer: reach out to PM session leads to start content development
- [ ] Finalize registration plan and announcement materials by March 22

## Open Questions
- What subset of sessions forms the first class? (decide with Tal)
- Entry criteria per level — what's the bar, what's overqualified?
- Which sessions could be joint beyond Security?
- 5 product sessions still need leads (4, 10, 11, 12, 14)
- 11 engineering sessions still need leads (3, 6, 13, 14, 15, 16, 19, 20, 21, 22, 23)
- Engineering M1, M2, B1 objectives and assessments TBD
- Noah Lerner (4) and Omer Wolf (5) carry heavy load — should there be a cap?
- Builders L2/L3 and Masters design not started (both tracks)
- Community/peer support format?
- Connection to DLC framework and AI-Native Team Structure JDs
- Was Noa B. losing Product Session 4 intentional?

## People to Add to Second Brain
- Hisham Abdulhalim (Product S7 lead)
- Noa B. (Product S6 lead)
- Topaz (Product S9 lead)
- Noah Lerner (Engineering S1, S2, S4, S7 lead)
- Omer Wolf (Engineering S5, S8, S10, S11, S12 lead)
- Omer (ops/project manager for Foundry)
- Shlomi (Engineering S9 lead)
- Daniel O (Engineering B1 level owner, S17, S18 lead)
- Matan (Engineering M3 level owner)

## User Preferences
- Prefers simple docs over specialized tools for session lead content development
- Optimize for volunteers — don't add friction to their process
