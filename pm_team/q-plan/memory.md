# Q-Plan PM — Memory

> Agent: q-plan-pm
> Scope: Quarterly plan tracking, progress analysis, execution reviews
> Team: PM Team (follows pm_team playbook)
> Onboarded: 2026-03-06

## Active Quarters

| Quarter | Status | Initiatives Tracked | Notes |
|---------|--------|-------------------|-------|
| Q1-2026 | Active | KYC Vendor Optimization | First quarter tracked. 5 HL items, 14 deliverables. |

## Initiative Planning Patterns

### KYC Vendor Optimization (Q1-2026)
- HL deck structure: 1-slide table with Initiative / Description / Q1 Impact / Q2 Impact columns
- Execution deck structure: multi-slide tables with Theme / Feature / Timing / Impact columns
- 5 HL items map to 14 deliverables across themes: Expansion, Orchestration, Optimization, RT Experience, Data Transparency
- "Enable Online Experience" has the most deliverables (7) — concentration risk
- Impact measured in "% CLM CVR" — this is the standard metric for vendor optimization

## Deck Parsing Conventions

- HL decks: look for tables with "Initiative" or "Feature" in header row
- Execution decks: look for tables with "Theme" / "Feature" / "Timing" / "Impact" columns
- Impact columns may be split (Q1/Q2) or combined
- Timing is free-text (e.g., "Mid January", "End of March") — not standardized dates
- Some execution decks have multiple roadmap tables across slides (slides 7-8 in KYC Documents)
- Vendor testing timelines (TP/TN) appear in separate tables — not always mappable to HL items

## Estimation Accuracy

(To be filled after Q1 review)

## Cross-Quarter Patterns

(To be filled after tracking multiple quarters)

## Conventions

### Pending Outreach lifecycle
When the agent sends a structured update request to initiative owners:
1. Store the outreach in `## Pending Outreach` with deliverable ID mapping and processing instructions
2. When the user shares the response, parse it, apply DB updates, update initiative memory
3. **After processing, delete the outreach entry from this file** to keep memory clean
4. If no response after 2 weeks, flag it in the next `status` run as "outreach unanswered — consider follow-up"

## Intel Sources (multi-source lookup)

When looking for deliverable status updates, the agent checks **all sources**, not just PPP:
1. **PPP sections** — weekly swimlane reports (primary signal)
2. **Meetings** — discussion_notes from 1:1s, team meetings, project meetings (last 30 days)
3. **Meeting action items** — open items related to deliverables
4. **Initiative memories** — living docs with accumulated context
5. **Agent log** — findings/recommendations from other agents

When deliverables are 14+ days overdue with no status change, or have no recent mentions across any source, the agent recommends outreach to initiative owners for a structured update.

## Open Questions

1. How should PPP swimlane updates map to deliverable status changes? Manual for now.
2. Should the agent auto-detect when a deliverable timing has passed and flag it? Yes — status command does this.
3. What's the threshold for "overdue" — strict target_date or some buffer? Currently strict. Stale data threshold: 14 days past due.

## Pending Outreach

### KYC New Flow — Q1-2026 deliverable update request (sent ~2026-03-07)
**Sent to:** Amit, Maya
**Format:** Inline fill-in email with numbered items
**Action when response received:** Parse the inline responses and update deliverable statuses, dates, and notes in `quarterly_plan_deliverables`. Then update the `kyc-new-flow` initiative memory doc.

Deliverable ID mapping (item # in email → DB id):
1. e-Collection Companies T1-2 Rollout → `b0e2f20b-06f2-4fe6-902e-c539755fb1db`
2. IDV All Experiment → `6a947095-b361-42df-94aa-4952cfa799a8`
3. RTQ Rollout → `a6d99000-8233-4563-a8a5-d38a1715b6f1`
4. HK CLM → `490a605c-3f17-4acc-b259-4ee6d09fe327`
5. RTC Rollout → `e88e13c7-e3da-4342-8758-863e060922c7`
6. POR All Experiment → `d1c5267c-b204-47d8-9bcd-3390262cbccd`
7. Real Time OCR → `54783760-d968-4ac8-bd8b-a9ab7dab5ead`
8. CN CLM [P1] → `584b3eb9-d72c-447a-82b3-5eb70b42c144`
9. POR Localization → `111b8a72-67a8-44ec-8898-7825e63049d3`
10. LE Wizard Companies → `7dec995a-0153-4d44-9fb4-f63dfa5b41c4`
11. CVD as POCA → `e1e884e1-07eb-4086-b4c5-784ac97cb929`
12. Visual Identity Review Infra → `3ff949fa-dc60-4cf9-8e2d-a99508e295e1`
13. Aurora – Verification Center Migration → `b1104fad-4e2e-4f88-bf91-d97076bca0c5`

**How to process the response:**
- For each item, determine new status: `done` (set completed_date), `in-progress`, `at-risk`, `cut`, `blocked`, or `planned`
- If metrics/data provided, store in `actual_outcome` field
- If revised target dates mentioned, update `target_date`
- After all updates, refresh the initiative memory doc with new signals
- Log a summary to `agent_log`
- Remove this entry from Pending Outreach once processed

### Vendor Optimization — Q1-2026 deliverable update request (sent ~2026-03-07)
**Sent to:** Yarden, Vova
**Format:** Inline fill-in email with numbered items
**Action when response received:** Parse the inline responses and update deliverable statuses, dates, and notes in `quarterly_plan_deliverables`. Then update the `vendor-optimization` initiative memory doc.

Deliverable ID mapping (item # in email → DB id):
1. Full address from Persona → `78af130e-7c72-4319-b781-ec95c2b49d47`
2. Rollout - RTC → `0726a439-a045-4082-8ce9-7c5e05fbe97f`
3. Digital IDs BR → `15cf39df-bee7-4c30-a3ad-7bd53863740f`
4. Self service configurations → `44ae0156-d1ad-486c-88be-2b69084535ed`
5. Custom file size and formats per vendor → `30c1505e-b8a7-43c6-ba12-41fd83cbd2f8`
6. Password unlock for PDF → `f0fd8b2f-371b-487a-9498-519485e6b6ef`
7. Compare service for RT OCR → `b443dd71-1835-420e-b07c-925b40531e57`
8. Orchestration - classification fallback → `1de549d1-94a2-4c6d-b69e-c955f3983b84`
9. Selfie Orchestrator → `0333d551-69c5-48d0-a644-4c21b4e68b84`

**How to process the response:**
- For each item, determine new status: `done` (set completed_date), `in-progress`, `at-risk`, `cut`, `blocked`, or `planned`
- If metrics/data provided, store in `actual_outcome` field
- If revised target dates mentioned, update `target_date`
- After all updates, refresh the initiative memory doc with new signals
- Log a summary to `agent_log`
- Remove this entry from Pending Outreach once processed

## Waiting On

- Additional Q1-2026 execution decks for other initiatives (only vendor optimization ingested so far)
- PPP integration: currently manual status updates, future: auto-match from PPP ingestion
