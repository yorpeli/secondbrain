/**
 * Validate the clm_main semantic layer against the legacy
 * clm_population_main_dashboard explore on the same mature cohort window.
 *
 * Variants:
 *   A. legacy explore, analytics-agent defaults (no blocked filtering)
 *   B. legacy explore + flat is_blocked=0 (ab-testing agent style)
 *   C. clm_main with flat is_blocked/is_closed_by_risk filters (the WRONG way per contract)
 *   D. clm_main with the mandatory population filter_expression (correct)
 *
 * Usage: npx tsx scripts/validate-clm-main-explore.ts
 */

import 'dotenv/config';
import { createAndRunQuery } from '../analytics/lib/looker-client.js';
import { buildClmMainQuery } from '../analytics/lib/query-builder.js';
import type { LookerQueryBody } from '../analytics/lib/types.js';

// Fully mature under both the legacy 4-week and clm_main 6-week rules
const WINDOW = '12 weeks ago for 4 weeks';
const OLD_VIEW = 'clm_population_main_dashboard';

interface Totals {
  created: number;
  approved: number;
  rate: number;
}

function num(row: Record<string, unknown>, field: string): number {
  const v = row[field];
  return typeof v === 'number' ? v : Number(v) || 0;
}

async function runOld(extraFilters: Record<string, string>, byCountry = false): Promise<Record<string, Totals>> {
  const fields = [
    ...(byCountry ? [`${OLD_VIEW}.country_name`] : []),
    `${OLD_VIEW}.accounts_created_clm`,
    `${OLD_VIEW}.accounts_approved`,
  ];
  const body: LookerQueryBody = {
    model: 'product',
    view: OLD_VIEW,
    fields,
    filters: {
      [`${OLD_VIEW}.is_clm_registration`]: 'CLM',
      [`${OLD_VIEW}.is_bot`]: '0',
      [`${OLD_VIEW}.ah_creation_date_date`]: WINDOW,
      ...(byCountry ? { [`${OLD_VIEW}.country_name`]: '-NULL', [`${OLD_VIEW}.accounts_created_clm`]: '>=500' } : {}),
      ...extraFilters,
    },
    sorts: byCountry ? [`${OLD_VIEW}.accounts_created_clm desc`] : [],
    limit: '50',
  };
  const res = await createAndRunQuery(body);
  const out: Record<string, Totals> = {};
  for (const row of res.results) {
    const key = byCountry ? String(row[`${OLD_VIEW}.country_name`]) : 'TOTAL';
    const created = num(row, `${OLD_VIEW}.accounts_created_clm`);
    const approved = num(row, `${OLD_VIEW}.accounts_approved`);
    out[key] = { created, approved, rate: created ? approved / created : 0 };
  }
  return out;
}

async function runNew(opts: { wrongFlatFilters?: boolean; byCountry?: boolean }): Promise<Record<string, Totals>> {
  const body = buildClmMainQuery({
    fields: [
      ...(opts.byCountry ? ['chosen_country_name'] : []),
      'accounts_created',
      'accounts_approved',
      'approval_rate',
    ],
    filters: {
      ah_creation_date_date: WINDOW,
      ...(opts.wrongFlatFilters ? { is_blocked: 'No', is_closed_by_risk_ind: 'No' } : {}),
      ...(opts.byCountry ? { accounts_created: '>=500' } : {}),
    },
    sorts: opts.byCountry ? ['clm_main.accounts_created desc'] : [],
    limit: '50',
    // when testing the wrong flat filters, drop the correct filter_expression
    includeFullPopulation: opts.wrongFlatFilters,
  });
  const res = await createAndRunQuery(body);
  const out: Record<string, Totals> = {};
  for (const row of res.results) {
    const key = opts.byCountry ? String(row['clm_main.chosen_country_name']) : 'TOTAL';
    out[key] = {
      created: num(row, 'clm_main.accounts_created'),
      approved: num(row, 'clm_main.accounts_approved'),
      rate: num(row, 'clm_main.approval_rate'),
    };
  }
  return out;
}

function pct(x: number): string {
  return (100 * x).toFixed(2) + '%';
}

async function main() {
  console.log(`Cohort window: accounts created "${WINDOW}" (fully mature)\n`);

  const [oldDefault, oldFlatBlocked, newWrong, newCorrect] = [
    await runOld({}),
    await runOld({ [`${OLD_VIEW}.is_blocked`]: '0' }),
    await runNew({ wrongFlatFilters: true }),
    await runNew({}),
  ];

  console.log('═══ Overall totals ═══');
  const rows: Array<[string, Totals]> = [
    ['A. legacy explore, analytics defaults      ', oldDefault.TOTAL],
    ['B. legacy explore + flat is_blocked=0      ', oldFlatBlocked.TOTAL],
    ['C. clm_main, flat blocked/risk (wrong)     ', newWrong.TOTAL],
    ['D. clm_main, population expression (right) ', newCorrect.TOTAL],
  ];
  for (const [label, t] of rows) {
    console.log(`${label} created: ${String(t.created).padStart(7)}  approved: ${String(t.approved).padStart(6)}  rate: ${pct(t.rate)}`);
  }

  const d = newCorrect.TOTAL;
  console.log('\n═══ Deltas vs D (correct clm_main) ═══');
  for (const [label, t] of rows.slice(0, 3)) {
    console.log(
      `${label} Δcreated: ${(((t.created - d.created) / d.created) * 100).toFixed(2)}%`,
      ` Δapproved: ${(((t.approved - d.approved) / d.approved) * 100).toFixed(2)}%`,
      ` Δrate: ${((t.rate - d.rate) * 100).toFixed(2)}pp`,
    );
  }

  console.log('\n═══ By country (>=500 created): legacy defaults (A) vs clm_main correct (D) ═══');
  const [oldByCountry, newByCountry] = [await runOld({}, true), await runNew({ byCountry: true })];
  const countries = Object.keys(newByCountry).slice(0, 12);
  console.log('country'.padEnd(28), 'A.rate'.padStart(8), 'D.rate'.padStart(8), 'Δpp'.padStart(7), '  A.created→D.created');
  for (const c of countries) {
    const a = oldByCountry[c];
    const dd = newByCountry[c];
    if (!dd) continue;
    console.log(
      c.padEnd(28),
      (a ? pct(a.rate) : 'n/a').padStart(8),
      pct(dd.rate).padStart(8),
      (a ? ((dd.rate - a.rate) * 100).toFixed(2) : 'n/a').padStart(7),
      `  ${a ? a.created : 'n/a'} → ${dd.created}`,
    );
  }
}

main().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
