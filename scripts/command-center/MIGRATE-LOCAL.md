# Command Center — one-time local migration to Supabase (v2)

> **Audience:** Claude Code running on Yonatan's local machine (the session with
> the `command-center/` folder on disk and Supabase access via `.env`).
> **Goal:** move the historical daily files and the durable context docs into
> the new Supabase backbone, then retire the file contract.
> Run once. Idempotent-ish: day rows upsert on `day`; captures INSERT, so do
> not re-run step 3 for a date that already has rows (check first).

The target schema already exists (tables `command_center_days`,
`command_center_captures`; `context_store` keys `command_center_routing`,
`command_center_people` seeded with starter placeholders). Pull latest on the
repo first so you have `scripts/command-center/store.ts` and the updated CLIs.

## 0. Inventory

List what exists locally:

```bash
ls command-center/daily/            # the dates to migrate
ls command-center/context/          # routing.md, people.md
cat command-center/.last-capture 2>/dev/null   # informational only; not migrated
```

Also check which dates are already in the DB so you skip them:

```sql
SELECT day FROM command_center_days ORDER BY day;
SELECT day, count(*) FROM command_center_captures GROUP BY day ORDER BY day;
```

## 1. Durable context → context_store

Read `command-center/context/routing.md` and `command-center/context/people.md`
and write each one's **full markdown text** into its key (the column is jsonb;
store the markdown as a JSON string):

```sql
UPDATE context_store SET content = to_jsonb(<routing.md text>::text), updated_at = now()
WHERE key = 'command_center_routing';

UPDATE context_store SET content = to_jsonb(<people.md text>::text), updated_at = now()
WHERE key = 'command_center_people';
```

This overwrites the seeded starter placeholders — that is intended. Preserve the
`## VIPs (manual)` and `## Harvested` sections verbatim.

## 2. Day documents → command_center_days

For each `command-center/daily/<date>/` folder, upsert one row:

- `01-focus.md` → `focus_md` (set `focus_generated_at` to the file's mtime, or
  `<date>T07:00:00Z` if unknown)
- `03-summary.md` → `summary_md` (+ `summary_written_at`, same fallback rule at
  `T17:00:00Z`)
- `04-reconcile.md` → `reconcile_md` (+ `reconciled_at`)
- `status`: `'closed'` if `04-reconcile.md` exists, else `'open'`
- Missing files → leave the column NULL

Upsert on `day` (`INSERT ... ON CONFLICT (day) DO UPDATE`).

## 3. Captures → command_center_captures

Split each `02-captures.md` on lines matching `^## (\d{1,2}:\d{2})` — one row
per block:

- `day` = the folder date; `captured_at` = `<date>T<HH:MM>` in **local time**
  (Asia/Jerusalem) converted to UTC
- `headline` = the text after `## HH:MM — ` (if the heading has no ` — `, use
  `'capture'`)
- `needs_attention` = the text after `**⚡ Needs attention:**` if that line
  exists in the block, else NULL — and **remove that line from the body**
- `body_md` = the rest of the block, trimmed (keep the `**Teams:**` /
  `**SharePoint:**` / `**Mail:**` / `**Calendar — changes:**` /
  `**Coming up today:**` lines exactly as written)
- `window_start` / `window_end` = NULL (file-era captures recorded no window)
- `people` / `initiatives` = slug arrays where you can confidently match names
  in the block to `people.slug` / `initiatives.slug`; empty arrays otherwise.
  Do not guess.
- `source` = `'migrated-local'`

Plain INSERTs. Skip any date that already has rows (step 0 check).

## 4. Verify

```sql
SELECT d.day, d.status,
       d.focus_md IS NOT NULL AS focus, d.summary_md IS NOT NULL AS summary,
       d.reconcile_md IS NOT NULL AS reconcile,
       (SELECT count(*) FROM command_center_captures c WHERE c.day = d.day) AS captures
FROM command_center_days d ORDER BY d.day;
```

Compare against the folder inventory from step 0. Then render one historical
day to confirm the pipeline reads the migrated rows:

```bash
npm run command-center:dashboard -- --date=<a migrated date>
open command-center/daily/<that date>/dashboard.html
```

## 5. Retire the file contract

After verification (with Yonatan's confirmation):

```bash
rm -f command-center/.last-capture
# Optional: archive then remove the migrated daily folders — the DB is now the record.
# The folder stays gitignored and lives on only as scratch for rendered dashboards.
```

Do NOT delete `command-center/templates/` if Yonatan restyled the dashboard
template — the renderer prefers the workspace copy over the bundled asset.

## 6. Close the loop

Reply on the open `agent_coordination` thread "Command Center v2 — daily loop
moved to Supabase backbone" (category `change-log`) with what was migrated
(dates, capture counts), then set the root message's status to `resolved`.
