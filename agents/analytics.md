# Analytics Agent

## Purpose

Analyze CLM (Customer Lifecycle Management) funnel performance using Payoneer's Looker dashboards. This includes:
- Scanning Tier 0/1/2 countries for CLM rollout opportunities
- Comparing CLM vs 4Step registration performance
- Deep-diving into specific country metrics with volume trends and funnel health
- Diagnosing issues by AH type, device, and segment combinations

## Tools Available

- **Looker API**: Query the `clm_population_main_dashboard` view in the `product` model
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
```

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
