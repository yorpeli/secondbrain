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

## Open Questions

1. How should PPP swimlane updates map to deliverable status changes? Manual for now.
2. Should the agent auto-detect when a deliverable timing has passed and flag it? Yes — status command does this.
3. What's the threshold for "overdue" — strict target_date or some buffer? Currently strict.

## Waiting On

- Additional Q1-2026 execution decks for other initiatives (only vendor optimization ingested so far)
- PPP integration: currently manual status updates, future: auto-match from PPP ingestion
