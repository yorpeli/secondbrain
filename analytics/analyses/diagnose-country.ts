/**
 * Country Diagnostic Analysis
 *
 * Migrated to the clm_main semantic layer (2026-06-11). CLM-only analysis — no
 * 4Step/GLPS — so it runs entirely on clm_main via lib/clm-main-metrics.ts.
 *
 * 5 queries: baseline, by AH type, by device, by combination, weekly trend.
 * Identifies issues by comparing segments to baseline, detecting red/yellow flags.
 *
 * Changes vs the legacy clm_population_main_dashboard version:
 *   - kyc_flow='D2P' replaces the banned registration_program_calc='Payoneer D2P'
 *   - chosen_country_name replaces country_name
 *   - mandatory population filter_expression replaces flat is_blocked=0
 *   - predefined approval_rate / full_document_submission_rate measures
 *   - account_holder_type / device_category_type replace the dynamic_dimension hack
 */

import { formatPct, getWeeksAgo } from '../lib/formatting.js';
import {
  fetchClmCountry,
  fetchClmByDimension,
  fetchClmWeekly,
  rowToClmMetrics,
  type ClmCountryMetrics,
} from '../lib/clm-main-metrics.js';
import {
  MATURE_COHORT_FILTER,
  WEEKLY_TREND_FILTER,
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

// ─── Analysis ─────────────────────────────────────────────────

/** Rates for a clm_main row, or null when the segment has no created accounts. */
function ratesOrNull(row: LookerRow): ClmCountryMetrics | null {
  const m = rowToClmMetrics(row);
  return m.created > 0 ? m : null;
}

function analyzeSegment(
  segmentName: string,
  rates: ClmCountryMetrics | null,
  baseline: ClmCountryMetrics,
): SegmentAnalysis {
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
      const rates = ratesOrNull(row);
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

  const [baseline, ahTypeData, deviceData, comboData, weeklyData] = await Promise.all([
    fetchClmCountry(country, MATURE_COHORT_FILTER),
    fetchClmByDimension(country, ['account_holder_type'], MATURE_COHORT_FILTER, '10'),
    fetchClmByDimension(country, ['device_category_type'], MATURE_COHORT_FILTER, '10'),
    fetchClmByDimension(country, ['account_holder_type', 'device_category_type'], MATURE_COHORT_FILTER, '20'),
    fetchClmWeekly(country, WEEKLY_TREND_FILTER),
  ]);

  if (!baseline || baseline.created === 0) {
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

  const byAHType = ahTypeData.map(row =>
    analyzeSegment((row.account_holder_type as string) || 'Unknown', ratesOrNull(row), baseline),
  );
  const byDevice = deviceData.map(row =>
    analyzeSegment((row.device_category_type as string) || 'Unknown', ratesOrNull(row), baseline),
  );
  const byCombination = comboData.map(row => {
    const ahType = (row.account_holder_type as string) || 'Unknown';
    const device = (row.device_category_type as string) || 'Unknown';
    return analyzeSegment(`${ahType} + ${device}`, ratesOrNull(row), baseline);
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
