# CLM Rollout War Room — Working Memory

## Last Session
- **Date**: 2026-06-04
- **What happened**: (1) Created the War Room initiative (P0 workspace) as the operational
  governance/monitoring layer for the CLM rollout. (2) Processed the **war-room setup meeting**
  (Yonatan, Daniel Grin, Nadia, Mor Saar) — see `docs/2026-06-04-war-room-setup-meeting.md`.
  - **Relationship**: Linked to — not absorbing — `clm-full-rollout`. Both stay active.
    `clm-full-rollout` keeps track-level status; the War Room governs/monitors the window.
  - **Owner**: Yonatan Orpeli (commander). Execution lead: Ira Martinenko. Agent: `team-lead`.
  - **Window**: starts **this week** (pre-rollout, Daniel: next week is most critical) →
    6/15 cutover to 100% → monitor & stabilize → **7/1 (the real target)**.
  - **DB**: initiative row + memory doc + workspace-sync rows + stakeholders created.
    Link pointer added to `clm-full-rollout` memory.
- **Meeting takeaways folded into memory doc**:
  - 🎯 **July 1 is the real target, not June 15.** June 15 cutover exists to surface what's
    broken so it can be fixed by July 1.
  - **Deployment freeze from ~next week**; June 15 checklists pre-approved.
  - **Go/No-Go owner = Daniel Grin** (per-item, by confidence; risky items can defer ~a week;
    full item/risk/confidence visibility for all).
  - **War-room ops = Nadia + Mor**, splitting monitoring. Physical room reserved 2 weeks;
    IT sets up 2–3 monitors; **the big TV shows one thing only — the bugs.**
  - Banking integration got overnight help from **Tal Arnon's** team.
- **Also ingested (2026-06-04)**: the **rollout roadmap PDF** + the **risk whiteboard** (tasks
  table). Kept both source links (SharePoint + Claude design) in `CLAUDE.md`/`context.md`;
  copied local files into `docs/`; parsed into `docs/2026-06-04-rollout-roadmap-snapshot.md`
  and `docs/2026-06-04-risk-whiteboard.md`. Roadmap: On-Track, 56%→100% by Jun 15. Risk
  register: 8 active (3 Critical / 5 Medium) — now the live register the war room watches.
- **Also done (2026-06-04, later)**: Mor Saar set to **Program Manager** (Operations).
  Drafted the **go/no-go checklist** → `docs/2026-06-15-go-no-go-checklist.md` (Gate A cutover,
  Gate B July-1 compliance, daily standup checklist). Refreshed **clm-full-rollout** memory
  (Jun-4 snapshot 56%, risk register from the whiteboard). **gitignored `docs/`** (local-only;
  content lives in Supabase memory).
- **Framing clarified (Yonatan)**: **June 15 = 100% of traffic** (minus specifically excluded
  cohorts) — the cutover (may start earlier). **July 1 = the committed full-compliance date** —
  100% of traffic, no leaks, all bugs sealed. The two weeks are for running at 100% and sealing
  bugs.
- **Daily standup ingested (2026-06-04)** → `docs/2026-06-04-daily-standup.md`. Started the
  daily loop: full note local, distilled signal into the memory doc (Incident Log, Action
  Item Tracker A1–A10, Decisions, Blockers, Timeline) + delta computed on ingest.
  - 🔴 **Selfie escalated to BLOCKED** (QA-environment instability) — whiteboard still says
    "in dev." Root bottleneck: single shared QA/sandbox + Banking deploy-queue. **12:00
    decision** on a workaround; Selfie top priority, **testable by Sun Jun 7**.
  - ⚠️ Unassigned: OCR testing owner (A6); infra single-environment owner (Yaron Weiss noted).
- **Next steps**: Confirm war-room start day + physical room (Nadia/Mor); Daniel to produce
  pre-approvable June 15 checklists (use the go/no-go draft); wire the bug monitor/TV
  (Monitoring master R-11); chase Einat for the Selfie test plan; reflect status to Yaron.
  **Tomorrow's standup:** carry A1–A10, check Selfie 12:00-decision outcome, chase the 2
  unassigned items, and watch the items not discussed today (Redirects, Server errors).

## Open Threads
- War-room start day (this week vs. 6/15) + which physical room — Nadia/Mor to confirm.
- Daniel to produce June 15 readiness checklists for advance approval.
- Bug-monitoring view for the room TV — Monitoring master (R-11, Daniel, Jun 11) must be
  live/green before cutover. (IT to set up 2–3 PCs.)
- **Einat owes a Selfie test plan (R-04)** — chase; it gates the Selfie Critical risk.
- Reduce other commitments for the team during the 2-week window; some join remotely.
- Mor Saar = Program Manager (Operations); manager/reports-to still TBD.
- Refresh both live sources (roadmap PDF + risk whiteboard) when newer versions land.
- ✅ Done: refreshed `clm-full-rollout` risk snapshot from the Jun 4 whiteboard.

## Context to Remember
- This is a time-boxed P0. Bias to speed and early signal over completeness.
- **Two committed dates:** June 15 = 100% of traffic (minus excluded cohorts); July 1 =
  full compliance (no leaks, bugs sealed). Frame decisions around being compliant by July 1.
- Govern, don't duplicate: pull track status from `clm-full-rollout`, don't re-enter it.
- Incident / decision / timeline logs in the memory doc are append-only.
- Daniel Grin holds the go/no-go call; Yonatan wants visibility, not to override.
