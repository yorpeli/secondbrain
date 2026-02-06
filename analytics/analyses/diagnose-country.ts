/**
 * Country Diagnostic Analysis
 *
 * Ported from Looker2/scripts/diagnose-country.js
 *
 * 5 queries: baseline, by AH type, by device, by combination, weekly trend
 * Identifies issues by comparing segments to baseline, detecting red/yellow flags.
 */

import * as looker from '../lib/looker-client.js';
import { stripViewPrefix } from '../lib/data-utils.js';
import { formatPct, sparkline, getWeeksAgo } from '../lib/formatting.js';
import {
  VIEW_PREFIX,
  LOOKER_MODEL,
  MATURE_COHORT_FILTER,
  WEEKLY_TREND_FILTER,
  CLM_STEPS,
  DIAGNOSTIC_THRESHOLDS as TH,
} from '../config/constants.js';
import type {
  DiagnoseResult,
  SegmentAnalysis,
  SegmentIssue,
  TrendAnalysis,
  TrendMetric,
  Finding,
} from '../lib/types.js';

type LookerRow = Record<string, unknown>;

interface DiagnoseOptions {
  country: string;
  minVolume?: number;
}

// ─── Queries ──────────────────────────────────────────────────

function clmFields(): string[] {
  return [
    ...CLM_STEPS.map(s => `${VIEW_PREFIX}.${s.field}`),
    `${VIEW_PREFIX}.fft_dynamic_measure`,
  ];
}

const BASE_FILTERS = (country: string): Record<string, string> => ({
  [`${VIEW_PREFIX}.is_clm_registration`]: 'CLM',
  [`${VIEW_PREFIX}.country_name`]: country,
  [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
  [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
  [`${VIEW_PREFIX}.is_bot`]: '0',
});

async function fetchOverallBaseline(country: string): Promise<LookerRow | null> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: clmFields(),
    filters: BASE_FILTERS(country),
    limit: '1',
  });
  return stripViewPrefix(result.results)[0] || null;
}

async function fetchByAHType(country: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [`${VIEW_PREFIX}.entity_type`, ...clmFields()],
    filters: BASE_FILTERS(country),
    sorts: [`${VIEW_PREFIX}.accounts_created_clm desc`],
    limit: '10',
  });
  return stripViewPrefix(result.results);
}

async function fetchByDevice(country: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [`${VIEW_PREFIX}.dynamic_dimension`, ...clmFields()],
    filters: {
      ...BASE_FILTERS(country),
      [`${VIEW_PREFIX}.dimension_selector`]: 'device type',
    },
    sorts: [`${VIEW_PREFIX}.accounts_created_clm desc`],
    limit: '10',
  });
  return stripViewPrefix(result.results);
}

async function fetchByCombination(country: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.entity_type`,
      `${VIEW_PREFIX}.dynamic_dimension`,
      ...clmFields(),
    ],
    filters: {
      ...BASE_FILTERS(country),
      [`${VIEW_PREFIX}.dimension_selector`]: 'device type',
    },
    sorts: [`${VIEW_PREFIX}.accounts_created_clm desc`],
    limit: '20',
  });
  return stripViewPrefix(result.results);
}

async function fetchWeeklyTrend(country: string): Promise<LookerRow[]> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [`${VIEW_PREFIX}.ah_creation_date_week`, ...clmFields()],
    filters: {
      ...BASE_FILTERS(country),
      [`${VIEW_PREFIX}.ah_creation_date_date`]: WEEKLY_TREND_FILTER,
    },
    sorts: [`${VIEW_PREFIX}.ah_creation_date_week`],
    limit: '20',
  });
  return stripViewPrefix(result.results);
}

// ─── Analysis ─────────────────────────────────────────────────

interface BaselineRates {
  created: number;
  seg_rate: number;
  docs_rate: number;
  approval_rate: number;
  ftl_rate: number;
}

function calculateRates(row: LookerRow): BaselineRates | null {
  const created = (row.accounts_created_clm as number) || 0;
  if (created === 0) return null;
  return {
    created,
    seg_rate: ((row.clm_finished_segmentation as number) || 0) / created,
    docs_rate: ((row.submitted_all_docs_step as number) || 0) / created,
    approval_rate: ((row.accounts_approved as number) || 0) / created,
    ftl_rate: ((row.fft_dynamic_measure as number) || 0) / created,
  };
}

function analyzeSegment(
  segmentName: string,
  segmentData: LookerRow,
  baseline: BaselineRates,
): SegmentAnalysis {
  const rates = calculateRates(segmentData);
  if (!rates || rates.created < TH.MIN_SEGMENT_VOLUME) {
    return {
      segment: segmentName,
      volume: rates?.created || 0,
      low_volume: true,
      issues: [],
    };
  }

  const issues: SegmentIssue[] = [];
  const metrics = [
    { name: 'Segmentation', key: 'seg_rate' as const },
    { name: 'Docs Submitted', key: 'docs_rate' as const },
    { name: 'Approval', key: 'approval_rate' as const },
  ];

  for (const metric of metrics) {
    const segmentRate = rates[metric.key];
    const baselineRate = baseline[metric.key];

    if (baselineRate > 0) {
      const delta = (segmentRate - baselineRate) / baselineRate;

      if (delta <= -TH.RED_FLAG) {
        issues.push({ metric: metric.name, segment_rate: segmentRate, baseline_rate: baselineRate, delta, severity: 'RED' });
      } else if (delta <= -TH.YELLOW_FLAG) {
        issues.push({ metric: metric.name, segment_rate: segmentRate, baseline_rate: baselineRate, delta, severity: 'YELLOW' });
      }
    }
  }

  return {
    segment: segmentName,
    volume: rates.created,
    low_volume: false,
    rates,
    issues,
  };
}

function analyzeTrend(weeklyData: LookerRow[]): TrendAnalysis {
  if (weeklyData.length < 4) {
    return { insufficient_data: true, trends: [] };
  }

  const allWeeks = weeklyData
    .map(row => {
      const rates = calculateRates(row);
      return rates
        ? {
            week: row.ah_creation_date_week as string,
            weeks_ago: getWeeksAgo(row.ah_creation_date_week as string),
            ...rates,
          }
        : null;
    })
    .filter((w): w is NonNullable<typeof w> => w !== null && w.created > 0);

  if (allWeeks.length < 4) {
    return { insufficient_data: true, trends: [] };
  }

  const matureWeeks = allWeeks.filter(w => w.weeks_ago >= 4);
  const volumeSparkline = allWeeks.map(w => w.created);

  if (matureWeeks.length < 4) {
    return {
      all_weeks: allWeeks.length,
      mature_weeks: matureWeeks.length,
      volume_sparkline: volumeSparkline,
      trends: [],
      note: 'Insufficient mature weeks for trend analysis',
    };
  }

  const mid = Math.floor(matureWeeks.length / 2);
  const olderPeriod = matureWeeks.slice(0, mid);
  const newerPeriod = matureWeeks.slice(mid);

  const avg = (weeks: typeof matureWeeks, key: 'seg_rate' | 'docs_rate' | 'approval_rate') =>
    weeks.reduce((sum, w) => sum + w[key], 0) / weeks.length;

  const avgOlder = { seg_rate: avg(olderPeriod, 'seg_rate'), docs_rate: avg(olderPeriod, 'docs_rate'), approval_rate: avg(olderPeriod, 'approval_rate') };
  const avgNewer = { seg_rate: avg(newerPeriod, 'seg_rate'), docs_rate: avg(newerPeriod, 'docs_rate'), approval_rate: avg(newerPeriod, 'approval_rate') };

  const trends: TrendMetric[] = [];
  const metrics = [
    { name: 'Segmentation', key: 'seg_rate' as const },
    { name: 'Docs Submitted', key: 'docs_rate' as const },
    { name: 'Approval', key: 'approval_rate' as const },
  ];

  for (const metric of metrics) {
    if (avgOlder[metric.key] > 0) {
      const change = (avgNewer[metric.key] - avgOlder[metric.key]) / avgOlder[metric.key];
      if (change <= -TH.TREND_RED) {
        trends.push({ metric: metric.name, older_period_avg: avgOlder[metric.key], newer_period_avg: avgNewer[metric.key], change, severity: 'RED', direction: 'DECLINING' });
      } else if (change <= -TH.TREND_YELLOW) {
        trends.push({ metric: metric.name, older_period_avg: avgOlder[metric.key], newer_period_avg: avgNewer[metric.key], change, severity: 'YELLOW', direction: 'DECLINING' });
      }
    }
  }

  return {
    all_weeks: allWeeks.length,
    mature_weeks: matureWeeks.length,
    volume_sparkline: volumeSparkline,
    volume_date_range: `${allWeeks[0].week} to ${allWeeks[allWeeks.length - 1].week}`,
    trends,
    older_period: {
      dates: `${olderPeriod[0].week} to ${olderPeriod[olderPeriod.length - 1].week}`,
      weeks_ago: `${olderPeriod[olderPeriod.length - 1].weeks_ago}-${olderPeriod[0].weeks_ago}`,
      avg: avgOlder,
    },
    newer_period: {
      dates: `${newerPeriod[0].week} to ${newerPeriod[newerPeriod.length - 1].week}`,
      weeks_ago: `${newerPeriod[newerPeriod.length - 1].weeks_ago}-${newerPeriod[0].weeks_ago}`,
      avg: avgNewer,
    },
    note: 'Trend analysis uses only mature weeks (4+ weeks ago)',
  };
}

// ─── Public API ───────────────────────────────────────────────

export async function run(options: DiagnoseOptions): Promise<DiagnoseResult> {
  const { country } = options;

  const [overallData, ahTypeData, deviceData, comboData, weeklyData] = await Promise.all([
    fetchOverallBaseline(country),
    fetchByAHType(country),
    fetchByDevice(country),
    fetchByCombination(country),
    fetchWeeklyTrend(country),
  ]);

  if (!overallData || !((overallData.accounts_created_clm as number) > 0)) {
    return {
      command: { type: 'diagnose', country },
      summary: `${country}: No CLM data found.`,
      data: {
        country,
        baseline: { created: 0, seg_rate: 0, docs_rate: 0, approval_rate: 0, ftl_rate: 0 },
        by_ah_type: [],
        by_device: [],
        by_combination: [],
        trend: { insufficient_data: true, trends: [] },
      },
      findings: [],
      timestamp: new Date().toISOString(),
    };
  }

  const baseline = calculateRates(overallData)!;

  const byAHType = ahTypeData.map(row => analyzeSegment((row.entity_type as string) || 'Unknown', row, baseline));
  const byDevice = deviceData.map(row => analyzeSegment((row.dynamic_dimension as string) || 'Unknown', row, baseline));
  const byCombination = comboData.map(row => {
    const ahType = (row.entity_type as string) || 'Unknown';
    const device = (row.dynamic_dimension as string) || 'Unknown';
    return analyzeSegment(`${ahType} + ${device}`, row, baseline);
  });
  const trend = analyzeTrend(weeklyData);

  // Collect priority issues
  const allRedIssues: { segment: string; metric: string; delta: number }[] = [];
  for (const segment of [...byAHType, ...byDevice, ...byCombination]) {
    if (segment.low_volume) continue;
    for (const issue of segment.issues) {
      if (issue.severity === 'RED') {
        allRedIssues.push({ segment: segment.segment, metric: issue.metric, delta: issue.delta });
      }
    }
  }
  for (const t of trend.trends) {
    if (t.severity === 'RED') {
      allRedIssues.push({ segment: 'Overall Trend', metric: t.metric, delta: t.change });
    }
  }

  // Findings
  const findings: Finding[] = [];
  if (allRedIssues.length > 0) {
    findings.push({
      summary: `${country} diagnostic: ${allRedIssues.length} critical issue(s). Top: ${allRedIssues[0].segment} ${allRedIssues[0].metric} (${formatPct(allRedIssues[0].delta, 1, true)}).`,
      details: { issues: allRedIssues.slice(0, 5) },
      tags: ['diagnostic', 'issues', country.toLowerCase().replace(/\s+/g, '-')],
    });
  }

  const totalIssues = [...byAHType, ...byDevice, ...byCombination].reduce(
    (sum, s) => sum + s.issues.length, 0,
  );

  return {
    command: { type: 'diagnose', country },
    summary: `${country}: ${baseline.created} accounts, ${formatPct(baseline.approval_rate)} approval. ${allRedIssues.length} critical, ${totalIssues - allRedIssues.length} warning issues. ${trend.trends.length} declining trends.`,
    data: {
      country,
      baseline,
      by_ah_type: byAHType,
      by_device: byDevice,
      by_combination: byCombination,
      trend,
    },
    findings,
    timestamp: new Date().toISOString(),
  };
}
