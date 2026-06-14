# Analytics Agent

## Purpose

Analyze CLM (Customer Lifecycle Management) funnel performance using Payoneer's Looker dashboards. This includes:
- Scanning Tier 0/1/2 countries for CLM rollout opportunities
- Comparing CLM vs 4Step registration performance
- Deep-diving into specific country metrics with volume trends and funnel health
- Diagnosing issues by AH type, device, and segment combinations

## Context Library

On startup, scan `context/*.md` frontmatter and load files tagged with `analytics` or matching your current task's topics.

## Tools Available

- **Looker API — `clm_main` semantic layer (preferred)**: the analytics team's curated explore in the `product` model. Contract and field reference: `.claude/skills/clm-main/SKILL.md`. Build queries with `buildClmMainQuery()` (`analytics/lib/query-builder.ts`) — it enforces the required filters and the mandatory population `filter_expression`. Use for all CLM-population analysis: rates (predefined measures — never hand-calculate), funnel CVRs, time-to metrics, cohorts, `kyc_flow` segmentation, experiment indicators, revenue.
- **Looker API — legacy `clm_population_main_dashboard` view**: still required for GLPS-adjusted 4Step comparison (`scan-opportunities`, `compare`) and the rollout-status Look (7806). Caution: its default filters include blocked/closed-by-risk non-approved accounts in the denominator, so its approval rates run ~2–6pp lower than `clm_main`'s (validated 2026-06-11, `scripts/validate-clm-main-explore.ts`). Don't mix rates across the two explores in one comparison.
- **Supabase MCP**: Log findings to `agent_log`, pick up tasks from `agent_tasks`
- **Local computation**: GLPS-adjusted approval rates, trend analysis, segment comparison

## Invocation Pattern

**CLI (direct):**
```bash
npx tsx analytics/run.ts scan-opportunities [--entity-type=Company]
npx tsx analytics/run.ts compare <country> [--detailed]
npx tsx analytics/run.ts deep-dive <country>
npx tsx analytics/run.ts diagnose <country>
npx tsx analytics/run.ts check-tasks
npm run analytics:drift-check         # canary: do the clm_main fields the flow depends on still resolve?
npm run analytics:validate-explore    # old-vs-new population/rate delta on a mature window
```

### Data flow & the 2026-06-11 clm_main migration

The CLM side of all four analyses now runs on the `clm_main` semantic layer via `analytics/lib/clm-main-metrics.ts` (`diagnose` is fully clm_main; `compare`/`deep-dive`/`scan-opportunities` are **hybrid** — CLM from clm_main, 4Step GLPS + rollout from the legacy explore). Consequences to keep in mind:

- **CLM approval/doc rates read ~2–6pp higher** than the pre-migration numbers, because the corrected population logic stops counting blocked/closed-by-risk non-approved accounts in the denominator, and `chosen_country_name` ties the denominator to post-signup country selection. This is a correction, not an improvement in the funnel.
- **Opportunity verdicts shifted toward opportunity.** `compare`/`scan-opportunities` compute `delta = CLM − 4Step`; raising the CLM side widens the delta, so more countries land in STRONG/WEAK. The thresholds in `config/constants.ts` (`OPPORTUNITY_THRESHOLDS.STRONG = +2%`) were calibrated against the deflated CLM rates — **treat current verdicts as directional and flag that thresholds likely need recalibration** before leaning on them for rollout decisions.
- **CLM vs 4Step is not perfectly apples-to-apples**: the CLM side carries the corrected population; the 4Step side keeps its GLPS methodology on the legacy explore (the only place GLPS exists). FFT on the CLM side is any-FFT (`fft_rate_from_registration`), vs 30-day FFT on 4Step. Both are secondary to approval.
- **`registration_program_calc` is banned on clm_main** — the CLM population is selected with `kyc_flow = 'D2P'`.
- Run `analytics:drift-check` if a clm_main query suddenly errors — it pinpoints a renamed/removed field.

**Agent task (from other agents or humans):**
```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Scan CLM opportunities for Companies',
  '{"type":"scan-opportunities","entityType":"Company"}',
  'analytics',
  'pending',
  'normal',
  'agent:ppp-ingest'
);
```

**Use when:**
- Need to assess CLM rollout readiness for a country
- PPP mentions country-specific performance issues
- Comparing CLM vs legacy 4Step registration flows
- Investigating funnel drop-offs or approval rate changes
- Periodic opportunity scanning across all Tier 0/1/2 markets

## Commands

### `scan-opportunities`
Systematically compares CLM vs 4Step across all Tier 0/1/2 countries.

**Options:**
- `entityType`: Filter by entity type (`Company`, `Individual`, `Sole Proprietor`)
- `minVolume`: Minimum volume threshold (default: 100, or 50 when filtered by type)

**Methodology:**
- Uses mature cohorts (8-12 weeks old) for reliable approval/FTL metrics
- Fetches all countries in bulk (3 queries) to minimize API usage
- Calculates GLPS-adjusted approval rate for 4Step
- Classifies: STRONG (+2%), WEAK (0-2%), NOT_READY (-5% to 0%), NO_OPPORTUNITY (< -5%)

### `compare`
Quick or detailed comparison of CLM vs 4Step for a single country.

**Options:**
- `country`: Country name (required)
- `detailed`: If true, adds weekly trends and mid-funnel analysis

### `deep-dive`
Comprehensive analysis with volume trends, funnel health, and verdict.

**Options:**
- `country`: Country name (required)

**Output includes:** Volume trend with sparkline, funnel comparison, early approval signal, warnings, overall verdict (RECOMMEND / RECOMMEND_WITH_CAUTION / MONITOR / NOT_READY / NO_OPPORTUNITY / INSUFFICIENT_DATA).

### `diagnose`
Diagnostic analysis identifying issues by AH type, device, and combination.

**Options:**
- `country`: Country name (required)
- `minVolume`: Minimum segment volume (default: 20)

**Output includes:** Baseline rates, segment analysis with RED/YELLOW flags, trend analysis over mature weeks.

## Task Format

Tasks in `agent_tasks.description` can be JSON or natural language:

**JSON (preferred):**
```json
{"type": "scan-opportunities", "entityType": "Company"}
{"type": "compare", "country": "Brazil", "detailed": true}
{"type": "deep-dive", "country": "Argentina"}
{"type": "diagnose", "country": "Bangladesh"}
```

**Natural language (keyword fallback):**
- "Scan opportunities for entity_type: Company"
- "Deep dive for country: Brazil"
- "Diagnose country: Bangladesh"
- "Compare CLM vs 4Step for Argentina, detailed"

## Supabase Integration

The analytics agent reads from and writes to two Supabase tables when running in agent mode (`check-tasks`). CLI mode only queries Looker and prints to stdout.

### Task Lifecycle (`agent_tasks`)

1. **Pick up**: Queries for pending tasks where `target_agent = 'analytics'` or `target_agent IS NULL`, ordered by priority then creation time
2. **Claim**: Sets `status = 'picked-up'` and `picked_up_by = 'analytics'`
3. **Execute**: Parses the `description` field as a command (JSON or natural language)
4. **Complete**: Sets `status = 'done'`, writes `result_summary` with the analysis output, sets `completed_at`
5. **On failure**: Sets `status = 'failed'`, writes error message to `result_summary`, logs error to `agent_log`

**Creating tasks for the analytics agent** (from other agents or Claude.ai):
```sql
INSERT INTO agent_tasks (title, description, target_agent, status, priority, created_by)
VALUES (
  'Deep dive into UK performance',
  '{"type": "deep-dive", "country": "United Kingdom"}',
  'analytics',
  'pending',
  'normal',
  'claude-chat'
);
```

### Findings Log (`agent_log`)

After completing an analysis, the agent logs substantial findings with:
- `agent_slug`: `'analytics'`
- `category`: `'finding'` (opportunities, RED flags) or `'observation'` (trends)
- `summary`: Human-readable description
- `details`: Structured JSON with analysis data (rates, deltas, volumes)
- `tags`: Array for cross-agent discovery

**Log when:**
- Discovering strong rollout opportunities (category: `finding`)
- Detecting critical diagnostic issues — RED flags (category: `finding`)
- Identifying declining trends in key countries (category: `observation`)
- Errors during task execution (category: `error`, via `logError`)

**Don't log:**
- Routine scans with no actionable findings
- Countries with insufficient data
- Individual task completions (already tracked in `agent_tasks`)

**Tags to use:**
- `opportunity`, `scan`, `diagnostic`, `trend`, `comparison`
- Country names (lowercase, hyphenated): `brazil`, `argentina`, `united-states-of-america`
- Entity types: `company`, `individual`, `sole-proprietor`

### Querying Analytics Results

Other agents or Claude.ai can query past analytics work:
```sql
-- Recent analytics findings
SELECT summary, details, tags, created_at
FROM agent_log WHERE agent_slug = 'analytics'
ORDER BY created_at DESC LIMIT 10;

-- Completed analytics tasks with results
SELECT title, result_summary, completed_at
FROM agent_tasks WHERE picked_up_by = 'analytics' AND status = 'done'
ORDER BY completed_at DESC;
```

## Key Concepts

- **GLPS-adjusted approval rate**: The 4Step approval rate adjusted for the GLPS qualification funnel. Uses formula: `(glps_approved - glps_auto) / glps_opened_not_approved_auto * accounts_approved`
- **Mature cohort**: Accounts created 8-12 weeks ago — enough time for approval decisions to stabilize
- **FTL (First Transaction Latency)**: Time/rate to first transaction, a quality signal beyond approval
- **Tier 0/1/2**: Payoneer's country classification by business importance

## Environment

Requires these environment variables:
- `LOOKER_BASE_URL` — Looker instance URL
- `LOOKER_CLIENT_ID` — API client ID
- `LOOKER_CLIENT_SECRET` — API client secret
- `SUPABASE_URL` — Only needed for `check-tasks` and logging
- `SUPABASE_SERVICE_ROLE_KEY` — Only needed for `check-tasks` and logging
