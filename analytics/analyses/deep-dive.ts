/**
 * Deep Dive Analysis
 *
 * Ported from Looker2/scripts/deep-dive.js
 *
 * 5 queries: rollout, CLM mature, 4Step mature, CLM weekly (12w), CLM recent (2w)
 * Produces: volume trend, funnel health, warning detection, verdict, narrative.
 */

import * as looker from '../lib/looker-client.js';
import { stripViewPrefix, calculateAccountsApprovedGLPS } from '../lib/data-utils.js';
import { formatPct, formatNum, sparkline, getWeeksAgo } from '../lib/formatting.js';
import {
  VIEW_PREFIX,
  LOOKER_MODEL,
  MATURE_COHORT_FILTER,
  RECENT_FILTER,
  WEEKLY_TREND_FILTER,
  DEEP_DIVE_THRESHOLDS as TH,
} from '../config/constants.js';
import type {
  DeepDiveResult,
  CLMMetrics,
  FourStepMetrics,
  FunnelHealth,
  Finding,
} from '../lib/types.js';
import type { DeepDiveVerdict } from '../config/constants.js';

type LookerRow = Record<string, unknown>;

interface DeepDiveOptions {
  country: string;
}

// ─── Queries ──────────────────────────────────────────────────

async function fetchRolloutStatus(countryName: string): Promise<LookerRow | null> {
  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.country_name`,
      `${VIEW_PREFIX}.country_business_tier`,
      `${VIEW_PREFIX}.clm_rollout_percentage`,
    ],
    filters: {
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.country_name`]: countryName,
      [`${VIEW_PREFIX}.ah_creation_date_date`]: '30 days',
    },
    limit: '10',
  });
  const data = stripViewPrefix(result.results);
  return data[0] || null;
}

async function fetchCLMMature(countryName: string): Promise<LookerRow | null> {
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
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
      [`${VIEW_PREFIX}.is_bot`]: '0',
      [`${VIEW_PREFIX}.is_blocked`]: '0',
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    limit: '10',
  });
  const data = stripViewPrefix(result.results);
  return data[0] || null;
}

async function fetch4StepMature(countryName: string): Promise<LookerRow | null> {
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
      `${VIEW_PREFIX}.clm_finished_segmentation`,
      `${VIEW_PREFIX}.submitted_all_docs_step`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters: {
      [`${VIEW_PREFIX}.is_clm_registration`]: 'CLM',
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: WEEKLY_TREND_FILTER,
      [`${VIEW_PREFIX}.is_bot`]: '0',
      [`${VIEW_PREFIX}.is_blocked`]: '0',
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    sorts: [`${VIEW_PREFIX}.ah_creation_date_week`],
    limit: '20',
  });
  return stripViewPrefix(result.results);
}

async function fetchCLMRecent(countryName: string): Promise<LookerRow | null> {
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
      [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
      [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
      [`${VIEW_PREFIX}.ah_creation_date_date`]: RECENT_FILTER,
      [`${VIEW_PREFIX}.is_bot`]: '0',
      [`${VIEW_PREFIX}.is_blocked`]: '0',
      [`${VIEW_PREFIX}.country_name`]: countryName,
    },
    limit: '10',
  });
  const data = stripViewPrefix(result.results);
  return data[0] || null;
}

// ─── Analysis ─────────────────────────────────────────────────

function buildCLMMetrics(row: LookerRow): CLMMetrics {
  const created = (row.accounts_created_clm as number) || 0;
  return {
    created,
    approved: (row.accounts_approved as number) || 0,
    ftl: (row.fft_dynamic_measure as number) || 0,
    approval_rate: created > 0 ? ((row.accounts_approved as number) || 0) / created : 0,
    ftl_rate: created > 0 ? ((row.fft_dynamic_measure as number) || 0) / created : 0,
    seg_rate: created > 0 ? ((row.clm_finished_segmentation as number) || 0) / created : 0,
    docs_rate: created > 0 ? ((row.submitted_all_docs_step as number) || 0) / created : 0,
  };
}

function build4StepMetrics(row: LookerRow, findings?: Finding[]): FourStepMetrics {
  const created = (row.accounts_created as number) || 0;
  const approved = (row.accounts_approved as number) || 0;
  let glpsApproved: number;
  try {
    glpsApproved = calculateAccountsApprovedGLPS(row);
  } catch {
    glpsApproved = approved;
    findings?.push({
      summary: 'GLPS denominator missing — using raw approval count as fallback (rates may be inflated)',
      tags: ['glps-data-missing', 'data-quality'],
    });
  }
  return {
    created,
    glps_approved: glpsApproved,
    approved,
    ftl: (row.fft_dynamic_measure as number) || 0,
    approval_rate: created > 0 ? glpsApproved / created : 0,
    ftl_rate: created > 0 ? ((row.fft_dynamic_measure as number) || 0) / created : 0,
  };
}

function generateNarrative(
  country: string,
  approvalDelta: number | undefined,
  clmMature: CLMMetrics | null,
  fsMature: FourStepMetrics | null,
  volumeChange: number | undefined,
  funnelHealth: FunnelHealth | undefined,
  ftlDelta: number | undefined,
  verdict: DeepDiveVerdict,
  warnings: string[],
  notes: string[],
): string {
  const lines: string[] = [];

  if (approvalDelta !== undefined && approvalDelta >= 0.02) {
    lines.push(`${country} shows strong potential for CLM rollout expansion based on mature cohort performance.`);
  } else if (approvalDelta !== undefined && approvalDelta >= 0) {
    lines.push(`${country} shows CLM performing on par with 4Step, suggesting potential for cautious expansion.`);
  } else {
    lines.push(`${country} shows CLM currently underperforming compared to 4Step in mature cohort data.`);
  }

  if (clmMature && fsMature && approvalDelta !== undefined) {
    const delta = formatPct(approvalDelta, 1, true);
    const comparison = approvalDelta >= 0 ? 'advantage' : 'gap';
    lines.push(`Performance: CLM ${formatPct(clmMature.approval_rate)} vs 4Step ${formatPct(fsMature.approval_rate)} (${delta} ${comparison}). Based on ${formatNum(clmMature.created)} CLM and ${formatNum(fsMature.created)} 4Step accounts.`);
  }

  if (volumeChange !== undefined) {
    if (volumeChange >= 0) {
      lines.push(`Volume trend: Stable or growing (+${formatPct(Math.abs(volumeChange))}). Healthy demand.`);
    } else if (volumeChange > -TH.VOLUME_NOTE) {
      lines.push(`Volume trend: Relatively stable (${formatPct(volumeChange)}). Within normal range.`);
    } else {
      lines.push(`Volume trend: Declined by ${formatPct(Math.abs(volumeChange))}. Warrants monitoring.`);
    }
  }

  if (funnelHealth) {
    const segOk = funnelHealth.seg.delta >= -TH.SEGMENTATION_NOTE;
    const docsOk = funnelHealth.docs.delta >= -TH.DOCS_NOTE;
    if (segOk && docsOk) {
      lines.push(`Funnel health: Recent conversion rates consistent with baseline. No degradation detected.`);
    } else {
      lines.push(`Funnel health: Variance detected. Seg ${formatPct(funnelHealth.seg.delta, 1, true)} vs baseline, docs ${formatPct(funnelHealth.docs.delta, 1, true)} vs baseline.`);
    }
  }

  if (ftlDelta !== undefined) {
    if (ftlDelta >= -0.02) {
      lines.push(`FTL: Comparable between CLM and 4Step.`);
    } else {
      lines.push(`FTL: CLM shows lower activation rate. Gap should be monitored.`);
    }
  }

  // Verdict-based recommendation
  const recs: Record<DeepDiveVerdict, string> = {
    RECOMMEND: `Recommendation: Increase CLM rollout in ${country}. Data supports confidence.`,
    RECOMMEND_WITH_CAUTION: `Recommendation: Increase rollout with monitoring. Warnings: ${[...warnings, ...notes].join('; ')}.`,
    MONITOR: `Recommendation: Maintain current rollout. Monitor for 2-4 more weeks.`,
    NOT_READY: `Recommendation: CLM underperforming. Address bottlenecks before expanding.`,
    NO_OPPORTUNITY: `Recommendation: Significant gap. Investigate root causes.`,
    INSUFFICIENT_DATA: `Recommendation: Insufficient data for assessment.`,
  };
  lines.push(recs[verdict]);

  return lines.join(' ');
}

// ─── Public API ───────────────────────────────────────────────

export async function run(options: DeepDiveOptions): Promise<DeepDiveResult> {
  const { country } = options;

  // Fetch all data (5 queries, rollout first since we need it to validate)
  const rollout = await fetchRolloutStatus(country);
  if (!rollout) {
    return {
      command: { type: 'deep-dive', country },
      summary: `${country}: Not found in rollout data.`,
      data: {
        country,
        tier: 'unknown',
        rollout_pct: 0,
        verdict: 'INSUFFICIENT_DATA',
        clm_mature: null,
        fs_mature: null,
        volume_trend: [],
        warnings: [],
        notes: [],
        narrative: `${country} not found in rollout data.`,
      },
      findings: [],
      timestamp: new Date().toISOString(),
    };
  }

  const [clmMatureRaw, fsMatureRaw, clmWeekly, clmRecentRaw] = await Promise.all([
    fetchCLMMature(country),
    fetch4StepMature(country),
    fetchCLMWeekly(country),
    fetchCLMRecent(country),
  ]);

  const findings: Finding[] = [];
  const clmMature = clmMatureRaw ? buildCLMMetrics(clmMatureRaw) : null;
  const fsMature = fsMatureRaw ? build4StepMetrics(fsMatureRaw, findings) : null;
  const clmRecent = clmRecentRaw ? buildCLMMetrics(clmRecentRaw) : null;
  const tier = String(rollout.country_business_tier);
  const rolloutPct = (rollout.clm_rollout_percentage as number) || 0;

  const warnings: string[] = [];
  const notes: string[] = [];

  // Delta
  let approvalDelta: number | undefined;
  let ftlDelta: number | undefined;
  if (clmMature && fsMature) {
    approvalDelta = clmMature.approval_rate - fsMature.approval_rate;
    ftlDelta = clmMature.ftl_rate - fsMature.ftl_rate;
  }

  // Volume trend
  const volumeTrend = clmWeekly.map(w => ({
    week: w.ah_creation_date_week as string,
    weeks_ago: getWeeksAgo(w.ah_creation_date_week as string),
    created: (w.accounts_created_clm as number) || 0,
  })).sort((a, b) => b.weeks_ago - a.weeks_ago);

  let volumeChange: number | undefined;
  if (volumeTrend.length >= 4) {
    const firstHalf = volumeTrend.slice(0, Math.floor(volumeTrend.length / 2));
    const secondHalf = volumeTrend.slice(Math.floor(volumeTrend.length / 2));
    const firstAvg = firstHalf.reduce((s, w) => s + w.created, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, w) => s + w.created, 0) / secondHalf.length;
    volumeChange = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;

    if (volumeChange < -TH.VOLUME_RED_FLAG) {
      warnings.push(`Volume declining ${formatPct(Math.abs(volumeChange))} - RED FLAG`);
    } else if (volumeChange < -TH.VOLUME_NOTE) {
      notes.push(`Volume declining ${formatPct(Math.abs(volumeChange))}`);
    }
  }

  // Funnel health
  let funnelHealth: FunnelHealth | undefined;
  if (clmRecent && clmMature) {
    funnelHealth = {
      seg: {
        recent: clmRecent.seg_rate,
        baseline: clmMature.seg_rate,
        delta: clmRecent.seg_rate - clmMature.seg_rate,
      },
      docs: {
        recent: clmRecent.docs_rate,
        baseline: clmMature.docs_rate,
        delta: clmRecent.docs_rate - clmMature.docs_rate,
      },
    };

    if (funnelHealth.seg.delta < -TH.SEGMENTATION_RED_FLAG) {
      warnings.push(`Segmentation rate dropped ${formatPct(Math.abs(funnelHealth.seg.delta))} - RED FLAG`);
    } else if (funnelHealth.seg.delta < -TH.SEGMENTATION_NOTE) {
      notes.push(`Segmentation rate dropped ${formatPct(Math.abs(funnelHealth.seg.delta))}`);
    }

    if (funnelHealth.docs.delta < -TH.DOCS_RED_FLAG) {
      warnings.push(`Doc submission rate dropped ${formatPct(Math.abs(funnelHealth.docs.delta))} - RED FLAG`);
    } else if (funnelHealth.docs.delta < -TH.DOCS_NOTE) {
      notes.push(`Doc submission rate dropped ${formatPct(Math.abs(funnelHealth.docs.delta))} (lagging indicator)`);
    }
  }

  // Early approval signal
  let earlyApproval: { recent: number; mature: number; gap: number } | undefined;
  if (clmRecent && clmMature) {
    earlyApproval = {
      recent: clmRecent.approval_rate,
      mature: clmMature.approval_rate,
      gap: clmRecent.approval_rate - clmMature.approval_rate,
    };
    if (earlyApproval.gap < -TH.APPROVAL_GAP_RED) {
      notes.push(`Recent approval significantly below baseline (${formatPct(earlyApproval.gap)})`);
    }
  }

  // Verdict
  let verdict: DeepDiveVerdict;
  if (approvalDelta === undefined) {
    verdict = 'INSUFFICIENT_DATA';
  } else if (approvalDelta >= 0.02) {
    verdict = warnings.length > 0 ? 'RECOMMEND_WITH_CAUTION' : 'RECOMMEND';
  } else if (approvalDelta >= 0) {
    verdict = 'MONITOR';
  } else if (approvalDelta >= -0.05) {
    verdict = 'NOT_READY';
  } else {
    verdict = 'NO_OPPORTUNITY';
  }

  const narrative = generateNarrative(
    country, approvalDelta, clmMature, fsMature,
    volumeChange, funnelHealth, ftlDelta, verdict, warnings, notes,
  );

  // Findings
  if (verdict === 'RECOMMEND' || verdict === 'RECOMMEND_WITH_CAUTION') {
    findings.push({
      summary: `${country} deep-dive: ${verdict}. CLM ${formatPct(approvalDelta!, 1, true)} vs 4Step. Rollout at ${formatPct(rolloutPct)}.`,
      details: { verdict, approval_delta: approvalDelta, warnings, notes },
      tags: ['deep-dive', 'opportunity', country.toLowerCase().replace(/\s+/g, '-')],
    });
  }
  if (warnings.length > 0) {
    findings.push({
      summary: `${country}: ${warnings.length} warning(s) — ${warnings[0]}`,
      tags: ['deep-dive', 'warning', country.toLowerCase().replace(/\s+/g, '-')],
    });
  }

  return {
    command: { type: 'deep-dive', country },
    summary: `${country} (Tier ${tier}, ${formatPct(rolloutPct)} rollout): ${verdict}. ${approvalDelta !== undefined ? `CLM ${formatPct(approvalDelta, 1, true)} vs 4Step.` : 'Insufficient data.'} ${warnings.length > 0 ? `Warnings: ${warnings.length}.` : 'No warnings.'}`,
    data: {
      country,
      tier,
      rollout_pct: rolloutPct,
      verdict,
      clm_mature: clmMature,
      fs_mature: fsMature,
      approval_delta: approvalDelta,
      ftl_delta: ftlDelta,
      volume_trend: volumeTrend,
      volume_change: volumeChange,
      funnel_health: funnelHealth,
      early_approval: earlyApproval,
      warnings,
      notes,
      narrative,
    },
    findings,
    timestamp: new Date().toISOString(),
  };
}
