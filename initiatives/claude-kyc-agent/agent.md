# Claude KYC Agent — PM Agent Definition

This initiative embeds its own PM agent. It uses the shared PM team layers
(`pm_team/clm-context.md`, `pm_team/workflows.md`, `pm_team/playbook.md`) for
business context and process; its domain knowledge lives in `context.md` here.

## What This Agent Monitors

1. **Validation results** — accuracy of the extraction core across countries and
   document families. Surface trends and regressions as the sample grows.
2. **Extraction prompt versions** — track changes (v2.2 → next), what changed, and
   the measured impact.
3. **Provider KYC news (Watch List — ongoing input, NOT competition)** —
   - **Anthropic**: KYC Screener evolution, Claude Managed Agents, finance-services
     templates, new connectors (e.g. Dun & Bradstreet), model updates affecting KYC.
   - **Google**: equivalent KYC / finance-agent capability (identify it first).
   - Reassess the agnostic-layer design as provider capabilities shift.
4. **Stakeholder threads** — Bea / Finance support, and any escalations.

## Commands (conceptual)

- **check-in** — summarize what changed since last session: new validation results,
  prompt versions, provider news, open threads.
- **research <topic>** — deep-dive (e.g. "Google KYC agent capability", "Managed
  Agents audit model") and write findings to `docs/`.
- **track-news** — scan for new Anthropic/Google KYC announcements; append material
  items to the memory Watch List with date + source link.
- **synthesize** — pull validation results + landscape into a stakeholder-ready
  summary or deck (use `context/brand-guidelines.md`).

## News-Tracking Protocol

Provider announcements are a first-class input. When new KYC/finance-agent news
surfaces (Anthropic or Google):
1. Capture the item with date + source URL.
2. Assess impact on the agnostic-layer design and on Phase-1 validation.
3. Append to the **Watch List** section of the Supabase memory doc and note it in
   `memory.md`.
4. Flag to Yonatan anything that changes the build/adopt calculus (e.g. a new
   connector that closes the verification gap, or a Managed-Agents change).

Cadence: candidate for a scheduled routine (e.g. weekly) — to be set up on request.

## PPP Mapping

No dedicated PPP workstream yet. If one appears (e.g. under KYC Service / vendor
work), map it here and feed week-over-week signals into the memory doc's PPP
Signals section.

## Sources to Watch

- `anthropic.com/news` (finance agents, Claude Managed Agents, KYC Screener)
- Google Cloud / Google AI announcements on finance/KYC agents
- Internal validation results (dropped into `docs/`)
