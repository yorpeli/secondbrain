/**
 * CLM-side metrics from the `clm_main` semantic layer.
 *
 * Single source of truth for "CLM funnel metrics" across the analytics analyses.
 * Encapsulates the team's contract (.claude/skills/clm-main/SKILL.md):
 *   - required filters + mandatory population filter_expression (via buildClmMainQuery)
 *   - kyc_flow = 'D2P' for the D2P registration population (replaces the banned
 *     registration_program_calc = 'Payoneer D2P')
 *   - chosen_country_name for country (user-selected; implies completed_signup_clm)
 *   - PREDEFINED rate measures (approval_rate, full_document_submission_rate,
 *     fft_rate_from_registration) — never hand-divided
 *
 * Replaces the legacy clm_population_main_dashboard CLM-side queries. The 4Step
 * (GLPS) and rollout-status queries stay on the legacy explore — see each analysis.
 *
 * NOTE on definitions vs the legacy explore:
 *   - `created` here counts AHs filtered to chosen_country_name, which the contract
 *     says implies completed_signup_clm. The legacy `accounts_created_clm` counted
 *     email-verified AHs. Country-attributed denominators are therefore slightly
 *     tighter, and combined with the corrected population logic, CLM approval rates
 *     read ~2-6pp higher than the legacy explore (validated 2026-06-11).
 *   - `ftl_rate` uses fft_rate_from_registration (any FFT), whereas the legacy
 *     fft_dynamic_measure was FTL-within-30-days. For mature cohorts the gap is small.
 */

import * as looker from './looker-client.js';
import { buildClmMainQuery } from './query-builder.js';

type LookerRow = Record<string, unknown>;

/** kyc_flow value for the Direct-to-Payoneer registration population. */
export const D2P_KYC_FLOW = 'D2P';

const PREFIX = 'clm_main.';

/** Count measures + predefined rate measures pulled for every CLM funnel query. */
export const CLM_MAIN_METRIC_FIELDS = [
  'accounts_created',
  'completed_segmentation',
  'submitted_all_docs',
  'accounts_approved',
  'fft_accounts',
  'approval_rate',
  'full_document_submission_rate',
  'fft_rate_from_registration',
];

export interface ClmCountryMetrics {
  created: number;
  approved: number;
  ftl: number;
  /** predefined clm_main.approval_rate */
  approval_rate: number;
  /** predefined clm_main.fft_rate_from_registration (any FFT, not 30d) */
  ftl_rate: number;
  /** computed: no predefined measure exists for segmentation rate */
  seg_rate: number;
  /** predefined clm_main.full_document_submission_rate */
  docs_rate: number;
}

function n(row: LookerRow, key: string): number {
  const v = row[key];
  return typeof v === 'number' ? v : Number(v) || 0;
}

/** Strip the `clm_main.` prefix from result keys for cleaner local access. */
function strip(rows: LookerRow[]): LookerRow[] {
  return rows.map(row => {
    const out: LookerRow = {};
    for (const [k, v] of Object.entries(row)) {
      out[k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k] = v;
    }
    return out;
  });
}

/**
 * Convert a stripped clm_main row to ClmCountryMetrics.
 * Uses predefined rates; falls back to a local divide only if a predefined
 * measure wasn't selected in the query (defensive — callers include them).
 */
export function rowToClmMetrics(row: LookerRow): ClmCountryMetrics {
  const created = n(row, 'accounts_created');
  const approved = n(row, 'accounts_approved');
  const seg = n(row, 'completed_segmentation');
  const ftl = n(row, 'fft_accounts');

  const approval_rate = 'approval_rate' in row ? n(row, 'approval_rate') : created > 0 ? approved / created : 0;
  const docs_rate = 'full_document_submission_rate' in row
    ? n(row, 'full_document_submission_rate')
    : created > 0 ? n(row, 'submitted_all_docs') / created : 0;
  const ftl_rate = 'fft_rate_from_registration' in row
    ? n(row, 'fft_rate_from_registration')
    : created > 0 ? ftl / created : 0;

  return {
    created,
    approved,
    ftl,
    approval_rate,
    ftl_rate,
    seg_rate: created > 0 ? seg / created : 0,
    docs_rate,
  };
}

/** Base filters for the D2P CLM population in a given country + window. */
function baseFilters(country: string | null, window: string): Record<string, string> {
  const f: Record<string, string> = {
    kyc_flow: D2P_KYC_FLOW,
    ah_creation_date_date: window,
  };
  if (country) f.chosen_country_name = country;
  return f;
}

/** Single-row CLM metrics for one country over a cohort window. */
export async function fetchClmCountry(country: string, window: string): Promise<ClmCountryMetrics | null> {
  const result = await looker.createAndRunQuery(
    buildClmMainQuery({
      fields: CLM_MAIN_METRIC_FIELDS,
      filters: baseFilters(country, window),
      limit: '1',
    }),
  );
  const rows = strip(result.results as LookerRow[]);
  if (!rows[0]) return null;
  return rowToClmMetrics(rows[0]);
}

/**
 * CLM metrics for one country broken down by a dimension (e.g. device_category_type,
 * account_holder_type). Returns stripped rows with the dimension + raw + rate fields.
 */
export async function fetchClmByDimension(
  country: string,
  dimensions: string[],
  window: string,
  limit = '20',
): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery(
    buildClmMainQuery({
      fields: [...dimensions, ...CLM_MAIN_METRIC_FIELDS],
      filters: baseFilters(country, window),
      sorts: ['clm_main.accounts_created desc'],
      limit,
    }),
  );
  return strip(result.results as LookerRow[]);
}

/** Weekly CLM trend rows for one country (dimension `ah_creation_date_week`). */
export async function fetchClmWeekly(country: string, window: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery(
    buildClmMainQuery({
      fields: ['ah_creation_date_week', ...CLM_MAIN_METRIC_FIELDS],
      filters: baseFilters(country, window),
      sorts: ['clm_main.ah_creation_date_week'],
      limit: '30',
    }),
  );
  return strip(result.results as LookerRow[]);
}

/**
 * CLM metrics for ALL chosen countries over a window (for the opportunity scan).
 * Excludes the "Country Not Chosen" / null buckets. Returns stripped rows keyed
 * by chosen_country_name.
 */
export async function fetchClmAllCountries(window: string, entityType?: string): Promise<LookerRow[]> {
  const filters: Record<string, string> = {
    kyc_flow: D2P_KYC_FLOW,
    ah_creation_date_date: window,
    chosen_country_name: '-Country Not Chosen,-NULL,-EMPTY',
  };
  if (entityType) filters.account_holder_type = entityType;

  const result = await looker.createAndRunQuery(
    buildClmMainQuery({
      fields: ['chosen_country_name', ...CLM_MAIN_METRIC_FIELDS],
      filters,
      sorts: ['clm_main.chosen_country_name'],
      limit: '500',
    }),
  );
  return strip(result.results as LookerRow[]);
}
