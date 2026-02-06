/**
 * CLM vs 4Step Comparison
 *
 * Merged from Looker2: compare-clm-4step.js + analyze-opportunity.js
 *
 * detailed=false → quick comparison (2 queries, approval + FTL delta)
 * detailed=true  → adds weekly trends, mid-funnel steps, trend analysis
 */

import * as looker from '../lib/looker-client.js';
import { stripViewPrefix, calculateAccountsApprovedGLPS } from '../lib/data-utils.js';
import { formatPct, formatNum, getWeeksAgo } from '../lib/formatting.js';
import {
  VIEW_PREFIX,
  LOOKER_MODEL,
  MATURE_COHORT_FILTER,
  OPPORTUNITY_THRESHOLDS,
} from '../config/constants.js';
import type {
  CompareResult,
  CLMMetrics,
  FourStepMetrics,
  WeeklyDataPoint,
  Finding,
} from '../lib/types.js';
import type { OpportunityStatus } from '../config/constants.js';

type LookerRow = Record<string, unknown>;

const TREND_FILTER = '12 weeks';

interface CompareOptions {
  country: string;
  detailed?: boolean;
}

// ─── Queries ──────────────────────────────────────────────────

async function fetchCLM(countryName: string): Promise<LookerRow | null> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.accounts_created_clm`,
      `${VIEW_PREFIX}.clm_finished_segmentation`,
      `${VIEW_PREFIX}.submitted_all_docs_step`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters: {
      [`${VIEW_PREFIX}.is_clm_registration`]: 'CLM',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
      [`${VIEW_PREFIX}.is_bot`]: '0',
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    limit: '10',
  });

  const data = stripViewPrefix(result.results);
  return data[0] || null;
}

async function fetch4Step(countryName: string): Promise<LookerRow | null> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.accounts_created`,
      `${VIEW_PREFIX}.4step_completed_step2`,
      `${VIEW_PREFIX}.4step_completed_step4`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved_auto`,
      `${VIEW_PREFIX}.glps_qualification_opened_not_approved_auto`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters: {
      [`${VIEW_PREFIX}.is_clm_registration`]: '4STEP',
      [`${VIEW_PREFIX}.reg_flow_changes`]: 'pure_4step',
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    limit: '10',
  });

  const data = stripViewPrefix(result.results);
  return data[0] || null;
}

async function fetchCLMWeekly(countryName: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.ah_creation_date_week`,
      `${VIEW_PREFIX}.accounts_created_clm`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters: {
      [`${VIEW_PREFIX}.is_clm_registration`]: 'CLM',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: TREND_FILTER,
      [`${VIEW_PREFIX}.is_bot`]: '0',
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    sorts: [`${VIEW_PREFIX}.ah_creation_date_week`],
    limit: '20',
  });

  return stripViewPrefix(result.results);
}

async function fetch4StepWeekly(countryName: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.ah_creation_date_week`,
      `${VIEW_PREFIX}.accounts_created`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved_auto`,
      `${VIEW_PREFIX}.glps_qualification_opened_not_approved_auto`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters: {
      [`${VIEW_PREFIX}.is_clm_registration`]: '4STEP',
      [`${VIEW_PREFIX}.reg_flow_changes`]: 'pure_4step',
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: TREND_FILTER,
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    sorts: [`${VIEW_PREFIX}.ah_creation_date_week`],
    limit: '20',
  });

  return stripViewPrefix(result.results);
}

// ─── Processing ───────────────────────────────────────────────

function buildCLMMetrics(row: LookerRow): CLMMetrics {
  const created = (row.accounts_created_clm as number) || 0;
  const approved = (row.accounts_approved as number) || 0;
  const ftl = (row.fft_dynamic_measure as number) || 0;
  const seg = (row.clm_finished_segmentation as number) || 0;
  const docs = (row.submitted_all_docs_step as number) || 0;

  return {
    created,
    approved,
    ftl,
    approval_rate: created > 0 ? approved / created : 0,
    ftl_rate: created > 0 ? ftl / created : 0,
    seg_rate: created > 0 ? seg / created : 0,
    docs_rate: created > 0 ? docs / created : 0,
  };
}

function build4StepMetrics(row: LookerRow): FourStepMetrics {
  const created = (row.accounts_created as number) || 0;
  const glpsApproved = calculateAccountsApprovedGLPS(row);
  const ftl = (row.fft_dynamic_measure as number) || 0;

  return {
    created,
    glps_approved: glpsApproved,
    approved: (row.accounts_approved as number) || 0,
    ftl,
    approval_rate: created > 0 ? glpsApproved / created : 0,
    ftl_rate: created > 0 ? ftl / created : 0,
  };
}

function classifyOpportunity(approvalDelta: number): OpportunityStatus {
  if (approvalDelta >= OPPORTUNITY_THRESHOLDS.STRONG) return 'STRONG_OPPORTUNITY';
  if (approvalDelta >= OPPORTUNITY_THRESHOLDS.WEAK) return 'WEAK_OPPORTUNITY';
  if (approvalDelta >= OPPORTUNITY_THRESHOLDS.NOT_READY) return 'NOT_READY';
  return 'NO_OPPORTUNITY';
}

function buildWeeklyDataPoints(rows: LookerRow[], createdField: string): WeeklyDataPoint[] {
  return rows.map(row => {
    const week = row.ah_creation_date_week as string;
    const created = (row[createdField] as number) || 0;
    const approved = (row.accounts_approved as number) || 0;
    const ftl = (row.fft_dynamic_measure as number) || 0;

    return {
      week,
      weeks_ago: getWeeksAgo(week),
      created,
      approved,
      ftl,
      approval_rate: created > 0 ? approved / created : 0,
      ftl_rate: created > 0 ? ftl / created : 0,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────

export async function run(options: CompareOptions): Promise<CompareResult> {
  const { country, detailed = false } = options;

  // Always fetch mature baselines
  const fetchOps: Promise<unknown>[] = [fetchCLM(country), fetch4Step(country)];
  if (detailed) {
    fetchOps.push(fetchCLMWeekly(country), fetch4StepWeekly(country));
  }

  const results = await Promise.all(fetchOps);
  const clmData = results[0] as LookerRow | null;
  const fsData = results[1] as LookerRow | null;

  const clm = clmData ? buildCLMMetrics(clmData) : null;
  const fourStep = fsData ? build4StepMetrics(fsData) : null;

  let delta: { approval: number; ftl: number } | null = null;
  let status: OpportunityStatus = 'MISSING_DATA';

  if (clm && fourStep) {
    delta = {
      approval: clm.approval_rate - fourStep.approval_rate,
      ftl: clm.ftl_rate - fourStep.ftl_rate,
    };
    status = classifyOpportunity(delta.approval);
  }

  // Build trend analysis if detailed
  let weeklyTrends: WeeklyDataPoint[] | undefined;
  let trendAnalysis: CompareResult['data']['trend_analysis'] | undefined;

  if (detailed) {
    const clmWeekly = results[2] as LookerRow[];
    weeklyTrends = buildWeeklyDataPoints(clmWeekly, 'accounts_created_clm');

    const matureWeeks = weeklyTrends.filter(w => w.weeks_ago >= 8);
    if (matureWeeks.length >= 2) {
      const halfPoint = Math.floor(matureWeeks.length / 2);
      const olderWeeks = matureWeeks.slice(0, halfPoint);
      const newerWeeks = matureWeeks.slice(halfPoint);

      const olderAgg = olderWeeks.reduce(
        (acc, r) => { acc.created += r.created; acc.approved += r.approved; return acc; },
        { created: 0, approved: 0 },
      );
      const newerAgg = newerWeeks.reduce(
        (acc, r) => { acc.created += r.created; acc.approved += r.approved; return acc; },
        { created: 0, approved: 0 },
      );

      const olderRate = olderAgg.created > 0 ? olderAgg.approved / olderAgg.created : 0;
      const newerRate = newerAgg.created > 0 ? newerAgg.approved / newerAgg.created : 0;
      const trendDelta = newerRate - olderRate;

      trendAnalysis = {
        older_rate: olderRate,
        newer_rate: newerRate,
        trend_delta: trendDelta,
        direction: trendDelta > 0.005 ? 'improving' : trendDelta < -0.005 ? 'declining' : 'stable',
      };
    }
  }

  // Findings
  const findings: Finding[] = [];
  if (delta && status === 'STRONG_OPPORTUNITY') {
    findings.push({
      summary: `${country}: CLM outperforms 4Step by ${formatPct(delta.approval, 1, true)} — strong rollout opportunity`,
      tags: ['opportunity', 'compare', country.toLowerCase().replace(/\s+/g, '-')],
    });
  }
  if (delta && delta.ftl < -0.02) {
    findings.push({
      summary: `${country}: FTL gap of ${formatPct(delta.ftl)} — CLM activation lower than 4Step`,
      tags: ['ftl-gap', 'compare', country.toLowerCase().replace(/\s+/g, '-')],
    });
  }

  // Summary text
  let summaryText = `${country}: `;
  if (!clm || !fourStep) {
    summaryText += 'Insufficient data for comparison.';
  } else {
    summaryText += `CLM ${formatPct(clm.approval_rate)} vs 4Step ${formatPct(fourStep.approval_rate)} (${formatPct(delta!.approval, 1, true)}). `;
    summaryText += `Status: ${status}. `;
    summaryText += `CLM: ${formatNum(clm.created)} accounts, 4Step: ${formatNum(fourStep.created)} accounts.`;
  }

  return {
    command: { type: 'compare', country, detailed },
    summary: summaryText,
    data: {
      country,
      clm,
      four_step: fourStep,
      delta,
      status,
      weekly_trends: weeklyTrends,
      trend_analysis: trendAnalysis,
    },
    findings,
    timestamp: new Date().toISOString(),
  };
}
