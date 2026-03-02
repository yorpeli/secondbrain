---
summary: BigQuery data warehouse guide — GCP project, table discovery, PM-friendly SQL templates, safety rails, query patterns
topics: [data-analysis, bigquery, metrics, sql]
agents: [analytics, hub-countries-pm, kyc-product-pm, team-lead]
source: Adapted from Pablo Battro's payoneer-cursor-skills (2026-Q1)
---

# BigQuery for PMs — Payoneer Data Warehouse

> How to query Payoneer's production BigQuery data warehouse.
> For Looker-based analysis, see `../ira/looker.md`.
> For CLM-specific data context, see `../ira/CLM-Data-Context.md`.

---

## Connection Details

| Setting | Value |
|---------|-------|
| GCP Project | `payoneer-prod-eu-svc-data-016f` |
| Region | `region-europe-west1` (for INFORMATION_SCHEMA) |
| CLI tools | `gcloud` + `bq` (Google Cloud SDK) |
| Auth | gcloud CLI authenticated with BigQuery Reader access |

## Safety Rules — Non-Negotiable

1. **SELECT only** — never INSERT, UPDATE, DELETE, CREATE, ALTER, DROP
2. **Always LIMIT** — every query ends with `LIMIT 500` unless explicitly asked for more
3. **No `--` comments** — use `/* */` block comments only (double-dash breaks piped `bq` execution)
4. **Verify before executing** — show the query and confirm before running
5. **Schema queries are exempt from LIMIT** — INFORMATION_SCHEMA queries don't need it

## Running Queries

Save to `.sql` file, then:

```bash
bq query --use_legacy_sql=false --format=csv < query.sql > results.csv
```

## Table Discovery

### Search tables by name pattern

```sql
SELECT table_catalog, table_schema, table_name, creation_time
FROM `region-europe-west1`.INFORMATION_SCHEMA.TABLES
WHERE table_name LIKE '%pattern%'
```

### Explore columns of a table

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM `region-europe-west1`.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = 'target_table'
ORDER BY ordinal_position
```

### List all datasets

```bash
bq ls -n 1000 --project_id=payoneer-prod-eu-svc-data-016f
```

### Preview data shape

```sql
SELECT * FROM `project.dataset.table` LIMIT 10
```

Always preview before writing complex queries.

## SQL Templates

### 1. Metric Over Time

Trends — "how has X changed over the last N months?"

```sql
SELECT
  DATE_TRUNC(date_column, MONTH) AS month,
  COUNT(*) AS total,
  COUNT(DISTINCT user_id) AS unique_users
FROM `project.dataset.table`
WHERE date_column >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
GROUP BY month
ORDER BY month
LIMIT 500
```

### 2. Segmented Breakdown

Comparisons — "break down by country / product / status"

```sql
SELECT
  segment_column,
  COUNT(*) AS total,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount
FROM `project.dataset.table`
WHERE date_column >= 'YYYY-MM-DD'
GROUP BY segment_column
ORDER BY total DESC
LIMIT 500
```

### 3. Funnel / Conversion Analysis

Stage-to-stage conversion rates:

```sql
WITH stage_counts AS (
  SELECT
    COUNT(DISTINCT CASE WHEN stage = 'registered' THEN user_id END) AS registered,
    COUNT(DISTINCT CASE WHEN stage = 'verified' THEN user_id END) AS verified,
    COUNT(DISTINCT CASE WHEN stage = 'first_transaction' THEN user_id END) AS transacted
  FROM `project.dataset.table`
  WHERE created_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
)
SELECT
  registered, verified, transacted,
  ROUND(SAFE_DIVIDE(verified, registered) * 100, 1) AS reg_to_verify_pct,
  ROUND(SAFE_DIVIDE(transacted, verified) * 100, 1) AS verify_to_transact_pct
FROM stage_counts
LIMIT 500
```

### 4. Cohort Analysis

Retention / behavior by signup cohort:

```sql
SELECT
  DATE_TRUNC(signup_date, MONTH) AS cohort_month,
  DATE_DIFF(activity_date, signup_date, MONTH) AS months_since_signup,
  COUNT(DISTINCT user_id) AS active_users
FROM `project.dataset.table`
WHERE signup_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY cohort_month, months_since_signup
ORDER BY cohort_month, months_since_signup
LIMIT 500
```

### 5. Top N / Ranking

"Who are the top X?" / "What are the biggest Y?"

```sql
SELECT
  entity_id, entity_name,
  SUM(amount) AS total_amount,
  COUNT(*) AS transaction_count,
  RANK() OVER (ORDER BY SUM(amount) DESC) AS rank
FROM `project.dataset.table`
WHERE date_column >= 'YYYY-MM-DD'
GROUP BY entity_id, entity_name
ORDER BY total_amount DESC
LIMIT 100
```

## Post-Query Workflow

1. Save results to a descriptive CSV filename
2. Summarize: row count, key numbers, notable patterns
3. Suggest visualization type (line for trends, bar for comparisons, funnel for conversion)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Not found: Dataset" | Check dataset name and region. Use `region-europe-west1` for INFORMATION_SCHEMA |
| Query runs too long | Tighter date filters, fewer columns, add LIMIT |
| Permission denied | Needs BigQuery Reader role — contact data team |
| Results seem wrong | Preview raw data first (`SELECT * LIMIT 10`), check for NULLs, verify date filters |
| `bq` command not found | Google Cloud SDK not installed or not on PATH |
