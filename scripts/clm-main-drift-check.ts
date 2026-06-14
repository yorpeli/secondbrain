/**
 * clm_main contract drift-check (canary query).
 *
 * The skill at .claude/skills/clm-main/SKILL.md is a snapshot of the analytics
 * team's semantic layer, and analytics/lib/clm-main-metrics.ts depends on a specific
 * set of its fields. This API role can't read LookML metadata (no see_lookml), so
 * instead of enumerating the explore we run a single CANARY query that selects every
 * field our data flow relies on — dimensions, predefined rate measures, and the
 * population filter_expression fields. If the team renames or removes any of them,
 * the query fails and Looker names the offending field.
 *
 * This catches the drift that actually matters: the kind that silently breaks
 * `analytics/run.ts diagnose|compare|deep-dive|scan-opportunities` and the clm-main
 * skill queries. It does NOT detect newly-added fields (use the Looker UI for that).
 *
 * Usage:
 *   npx tsx scripts/clm-main-drift-check.ts
 *
 * Exit code 0 = all depended-on fields resolve, 1 = drift detected, 2 = run error.
 */

import 'dotenv/config';
import { createAndRunQuery } from '../analytics/lib/looker-client.js';
import { buildClmMainQuery } from '../analytics/lib/query-builder.js';
import {
  CLM_MAIN_METRIC_FIELDS,
  D2P_KYC_FLOW,
} from '../analytics/lib/clm-main-metrics.js';
import { CLM_MAIN_VIEW, CLM_MAIN_POPULATION_FILTER } from '../analytics/config/constants.js';

// Dimensions the analyses group/filter by (must stay selectable).
const CRITICAL_DIMENSIONS = [
  'chosen_country_name',
  'device_category_type',
  'account_holder_type',
  'kyc_flow',
  'ah_creation_date_week',
  'lead_score_group',
];

// Extra measures used outside clm-main-metrics (agent defaults / ad-hoc).
const EXTRA_MEASURES = ['fft_rate_from_approval', 'total_days_registration_to_approval'];

// Fields referenced only inside the population filter_expression (validated implicitly
// because buildClmMainQuery always attaches that expression).
const POPULATION_FIELDS = ['account_approval_ind', 'is_blocked', 'is_closed_by_risk_ind'];

async function main() {
  const selected = [...CRITICAL_DIMENSIONS, ...CLM_MAIN_METRIC_FIELDS, ...EXTRA_MEASURES];

  const query = buildClmMainQuery({
    fields: selected,
    filters: { kyc_flow: D2P_KYC_FLOW, ah_creation_date_date: '2 weeks' },
    limit: '1',
  });

  console.log(`clm_main drift-check (canary) — explore product/${CLM_MAIN_VIEW}`);
  console.log(`  validating ${selected.length} selected fields + population filter_expression`);
  console.log(`  population fields exercised: ${POPULATION_FIELDS.join(', ')}`);
  console.log(`  filter_expression: ${CLM_MAIN_POPULATION_FILTER}\n`);

  try {
    await createAndRunQuery(query);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log('⚠️  DRIFT DETECTED — the canary query failed. A field our data flow depends on');
    console.log('    was likely renamed or removed. Looker said:\n');
    console.log(`    ${msg}\n`);
    console.log('→ Reconcile .claude/skills/clm-main/SKILL.md and analytics/lib/clm-main-metrics.ts');
    console.log('  with the current explore (per the skill provenance note), then re-run.');
    process.exit(1);
  }

  console.log(`✅ In sync — all ${selected.length} depended-on fields resolve and the`);
  console.log('   population filter_expression is accepted. The analytics data flow is intact.');
  process.exit(0);
}

main().catch(e => {
  console.error('FAILED:', e instanceof Error ? e.message : String(e));
  process.exit(2);
});
