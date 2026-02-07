/**
 * Data Utilities
 *
 * Transform and prepare Looker data for analysis.
 * Ported from Looker2/lib/data-utils.js — kept all calculation functions exactly as-is.
 * Dropped: prepareForPython, saveToAnalysis, loadFromAnalysis.
 * Moved: formatPercent, formatNumber → formatting.ts.
 */

import { VIEW_PREFIX } from '../config/constants.js';

type LookerRow = Record<string, unknown>;

/**
 * Strip view prefix from field names for cleaner output.
 * Works on arrays and single objects.
 */
export function stripViewPrefix(
  data: LookerRow[],
  prefix?: string,
): LookerRow[];
export function stripViewPrefix(
  data: LookerRow,
  prefix?: string,
): LookerRow;
export function stripViewPrefix(
  data: LookerRow | LookerRow[],
  prefix = `${VIEW_PREFIX}.`,
): LookerRow | LookerRow[] {
  if (Array.isArray(data)) {
    return data.map(row => stripViewPrefix(row, prefix) as LookerRow);
  }

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const cleaned: LookerRow = {};
  for (const [key, value] of Object.entries(data)) {
    const cleanKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    cleaned[cleanKey] = value;
  }
  return cleaned;
}

/**
 * Calculate approval rate from a row.
 */
export function calculateApprovalRate(
  row: LookerRow,
  createdField = 'accounts_created_clm',
  approvedField = 'accounts_approved',
): number {
  const created = (row[createdField] as number) || 0;
  const approved = (row[approvedField] as number) || 0;
  return created > 0 ? approved / created : 0;
}

/**
 * Calculate FTL rate from a row.
 */
export function calculateFtlRate(
  row: LookerRow,
  createdField = 'accounts_created_clm',
  ftlField = 'fft_dynamic_measure',
): number {
  const created = (row[createdField] as number) || 0;
  const ftl = (row[ftlField] as number) || 0;
  return created > 0 ? ftl / created : 0;
}

/**
 * Calculate "Accounts Approved (GLPS)" — the table calculation from Look 6823.
 * Formula: (glps_approved - glps_auto) / glps_opened_not_approved_auto * accounts_approved
 *
 * This is the PRIMARY metric for comparing CLM vs 4Step.
 */
export function calculateAccountsApprovedGLPS(row: LookerRow): number {
  const glps = (row.glps_qualification_approved as number) || 0;
  const glpsAuto = (row.glps_qualification_approved_auto as number) || 0;
  const glpsOpenedNotApprovedAuto =
    (row.glps_qualification_opened_not_approved_auto as number) || 0;
  const approved = (row.accounts_approved as number) || 0;

  if (glpsOpenedNotApprovedAuto === 0) {
    if (approved > 0) {
      throw new Error(
        `Cannot calculate GLPS-adjusted approval: glps_opened_not_approved_auto is 0 but accounts_approved is ${approved}. Data may be incomplete or filters misconfigured.`,
      );
    }
    return 0;
  }

  const glpsWithoutAuto = glps - glpsAuto;
  const glpsParam = glpsWithoutAuto / glpsOpenedNotApprovedAuto;
  return Math.round(glpsParam * approved);
}

/**
 * Calculate GLPS approval rate.
 * Returns accounts_approved_glps / accounts_created.
 */
export function calculateGLPSApprovalRate(
  row: LookerRow,
  createdField = 'accounts_created',
): number {
  const created = (row[createdField] as number) || 0;
  const approvedGLPS = calculateAccountsApprovedGLPS(row);
  return created > 0 ? approvedGLPS / created : 0;
}

/**
 * Add calculated rates to each row.
 */
export function addCalculatedRates(data: LookerRow[]): (LookerRow & {
  approval_rate: number;
  ftl_rate: number;
  segmentation_rate: number;
  doc_completion_rate: number;
})[] {
  return data.map(row => {
    const created = (row.accounts_created_clm as number) || 0;
    return {
      ...row,
      approval_rate: calculateApprovalRate(row),
      ftl_rate: calculateFtlRate(row),
      segmentation_rate:
        created > 0 ? ((row.clm_finished_segmentation as number) || 0) / created : 0,
      doc_completion_rate:
        created > 0 ? ((row.submitted_all_docs_step as number) || 0) / created : 0,
    };
  });
}

/**
 * Group data by a field.
 */
export function groupBy(data: LookerRow[], field: string): Record<string, LookerRow[]> {
  const groups: Record<string, LookerRow[]> = {};
  for (const row of data) {
    const key = String(row[field] ?? 'unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }
  return groups;
}

/**
 * Sort data by a field.
 */
export function sortBy(data: LookerRow[], field: string, descending = false): LookerRow[] {
  return [...data].sort((a, b) => {
    const aVal = (a[field] as number) || 0;
    const bVal = (b[field] as number) || 0;
    return descending ? bVal - aVal : aVal - bVal;
  });
}

/**
 * Filter data by minimum accounts threshold.
 */
export function filterByMinAccounts(
  data: LookerRow[],
  minAccounts = 20,
  field = 'accounts_created_clm',
): LookerRow[] {
  return data.filter(row => ((row[field] as number) || 0) >= minAccounts);
}

/**
 * Aggregate data (sum numeric fields).
 */
export function aggregate(
  data: LookerRow[],
  groupByField?: string,
): LookerRow | LookerRow[] {
  if (groupByField) {
    const groups = groupBy(data, groupByField);
    return Object.entries(groups).map(([key, rows]) => ({
      [groupByField]: key,
      ...aggregateRows(rows),
    }));
  }
  return aggregateRows(data);
}

function aggregateRows(rows: LookerRow[]): LookerRow {
  if (rows.length === 0) return {};

  const numericFields = Object.keys(rows[0]).filter(
    key => typeof rows[0][key] === 'number',
  );

  const result: LookerRow = { row_count: rows.length };
  for (const field of numericFields) {
    result[field] = rows.reduce((sum, row) => sum + ((row[field] as number) || 0), 0);
  }
  return result;
}
