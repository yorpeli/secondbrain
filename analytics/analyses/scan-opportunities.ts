/**
 * Opportunity Scanner
 *
 * Merged from Looker2: scan-opportunities.js + scan-opportunities-by-type.js
 * Systematically compares CLM vs 4Step performance across Tier 0/1/2 countries.
 *
 * Methodology:
 * - Uses mature cohorts (8-12 weeks old) for reliable approval/FTL metrics
 * - Fetches all countries in bulk (3 queries) to minimize API usage
 * - Filters locally to Tier 0/1/2
 * - Calculates GLPS-adjusted approval rate for 4Step
 */

import * as looker from '../lib/looker-client.js';
import { stripViewPrefix, calculateAccountsApprovedGLPS } from '../lib/data-utils.js';
import { formatPct, formatNum } from '../lib/formatting.js';
import {
  VIEW_PREFIX,
  LOOKER_MODEL,
  MATURE_COHORT_FILTER,
  ROLLOUT_DATE_FILTER,
  MIN_VOLUME_THRESHOLD,
  MIN_VOLUME_BY_TYPE,
  OPPORTUNITY_THRESHOLDS,
} from '../config/constants.js';
import type {
  ScanResult,
  CountryOpportunity,
  CLMMetrics,
  FourStepMetrics,
  Finding,
} from '../lib/types.js';
import type { OpportunityStatus, EntityType } from '../config/constants.js';

type LookerRow = Record<string, unknown>;

interface ScanOptions {
  entityType?: EntityType;
  minVolume?: number;
}

// ─── Queries ──────────────────────────────────────────────────

async function fetchRolloutStatus(entityType?: string): Promise<LookerRow[]> {
  const filters: Record<string, string> = {
    [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
    [`${VIEW_PREFIX}.country_name`]: '-Country Not Chosen,-NULL',
    [`${VIEW_PREFIX}.ah_creation_date_date`]: ROLLOUT_DATE_FILTER,
  };
  if (entityType) filters[`${VIEW_PREFIX}.entity_type`] = entityType;

  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.country_name`,
      `${VIEW_PREFIX}.country_business_tier`,
      `${VIEW_PREFIX}.clm_rollout_percentage`,
      `${VIEW_PREFIX}.accounts_created_clm`,
      `${VIEW_PREFIX}.accounts_created`,
    ],
    filters,
    sorts: [`${VIEW_PREFIX}.country_name`],
    limit: '500',
  });

  return stripViewPrefix(result.results);
}

async function fetchCLMMature(entityType?: string): Promise<LookerRow[]> {
  const filters: Record<string, string> = {
    [`${VIEW_PREFIX}.is_clm_registration`]: 'CLM',
    [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
    [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
    [`${VIEW_PREFIX}.is_bot`]: '0',
    [`${VIEW_PREFIX}.country_name`]: '-NULL',
  };
  if (entityType) filters[`${VIEW_PREFIX}.entity_type`] = entityType;

  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.country_name`,
      `${VIEW_PREFIX}.accounts_created_clm`,
      `${VIEW_PREFIX}.clm_finished_segmentation`,
      `${VIEW_PREFIX}.submitted_all_docs_step`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters,
    sorts: [`${VIEW_PREFIX}.country_name`],
    limit: '500',
  });

  return stripViewPrefix(result.results);
}

async function fetch4StepMature(entityType?: string): Promise<LookerRow[]> {
  const filters: Record<string, string> = {
    [`${VIEW_PREFIX}.is_clm_registration`]: '4STEP',
    [`${VIEW_PREFIX}.reg_flow_changes`]: 'pure_4step',
    [`${VIEW_PREFIX}.registration_program_calc`]: 'Payoneer D2P',
    [`${VIEW_PREFIX}.map_payments`]: 'Exclude',
    [`${VIEW_PREFIX}.ah_creation_date_date`]: MATURE_COHORT_FILTER,
    [`${VIEW_PREFIX}.country_name`]: '-NULL',
  };
  if (entityType) filters[`${VIEW_PREFIX}.entity_type`] = entityType;

  const result = await looker.createAndRunQuery({
    model: LOOKER_MODEL,
    view: VIEW_PREFIX,
    fields: [
      `${VIEW_PREFIX}.country_name`,
      `${VIEW_PREFIX}.accounts_created`,
      `${VIEW_PREFIX}.4step_completed_step2`,
      `${VIEW_PREFIX}.4step_completed_step4`,
      `${VIEW_PREFIX}.accounts_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved`,
      `${VIEW_PREFIX}.glps_qualification_approved_auto`,
      `${VIEW_PREFIX}.glps_qualification_opened_not_approved_auto`,
      `${VIEW_PREFIX}.fft_dynamic_measure`,
    ],
    filters,
    sorts: [`${VIEW_PREFIX}.country_name`],
    limit: '500',
  });

  return stripViewPrefix(result.results);
}

// ─── Data Processing ──────────────────────────────────────────

function joinData(
  rolloutData: LookerRow[],
  clmData: LookerRow[],
  fourStepData: LookerRow[],
): { country_name: string; tier: number; rollout_pct: number; clm: LookerRow | null; four_step: LookerRow | null }[] {
  const clmByCountry: Record<string, LookerRow> = {};
  for (const row of clmData) clmByCountry[row.country_name as string] = row;

  const fourStepByCountry: Record<string, LookerRow> = {};
  for (const row of fourStepData) fourStepByCountry[row.country_name as string] = row;

  const joined = [];
  for (const rollout of rolloutData) {
    const country = rollout.country_name as string;
    const tier = rollout.country_business_tier;
    if (!['0', '1', '2'].includes(String(tier))) continue;

    joined.push({
      country_name: country,
      tier: parseInt(String(tier)),
      rollout_pct: (rollout.clm_rollout_percentage as number) || 0,
      clm: clmByCountry[country] || null,
      four_step: fourStepByCountry[country] || null,
    });
  }

  return joined;
}

function calculateMetrics(
  joinedData: ReturnType<typeof joinData>,
  minVolume: number,
): CountryOpportunity[] {
  return joinedData.map(row => {
    const result: CountryOpportunity = {
      country_name: row.country_name,
      tier: row.tier,
      rollout_pct: row.rollout_pct,
      clm: null,
      four_step: null,
      delta: null,
      status: 'MISSING_DATA',
      warnings: [],
    };

    if (row.clm) {
      const created = (row.clm.accounts_created_clm as number) || 0;
      const approved = (row.clm.accounts_approved as number) || 0;
      const ftl = (row.clm.fft_dynamic_measure as number) || 0;
      const seg = (row.clm.clm_finished_segmentation as number) || 0;
      const docs = (row.clm.submitted_all_docs_step as number) || 0;

      result.clm = {
        created,
        approved,
        ftl,
        approval_rate: created > 0 ? approved / created : 0,
        ftl_rate: created > 0 ? ftl / created : 0,
        seg_rate: created > 0 ? seg / created : 0,
        docs_rate: created > 0 ? docs / created : 0,
      };

      if (created < minVolume) {
        result.warnings.push(`LOW_CLM_VOLUME (${created})`);
      }
    } else {
      result.warnings.push('NO_CLM_DATA');
    }

    if (row.four_step) {
      const created = (row.four_step.accounts_created as number) || 0;
      const glpsApproved = calculateAccountsApprovedGLPS(row.four_step);
      const ftl = (row.four_step.fft_dynamic_measure as number) || 0;

      result.four_step = {
        created,
        glps_approved: glpsApproved,
        approved: (row.four_step.accounts_approved as number) || 0,
        ftl,
        approval_rate: created > 0 ? glpsApproved / created : 0,
        ftl_rate: created > 0 ? ftl / created : 0,
      };

      if (created < minVolume) {
        result.warnings.push(`LOW_4STEP_VOLUME (${created})`);
      }
    } else {
      result.warnings.push('NO_4STEP_DATA');
    }

    if (result.clm && result.four_step) {
      const approvalDelta = result.clm.approval_rate - result.four_step.approval_rate;
      const ftlDelta = result.clm.ftl_rate - result.four_step.ftl_rate;
      result.delta = { approval: approvalDelta, ftl: ftlDelta };

      if (approvalDelta >= OPPORTUNITY_THRESHOLDS.STRONG) {
        result.status = 'STRONG_OPPORTUNITY';
      } else if (approvalDelta >= OPPORTUNITY_THRESHOLDS.WEAK) {
        result.status = 'WEAK_OPPORTUNITY';
      } else if (approvalDelta >= OPPORTUNITY_THRESHOLDS.NOT_READY) {
        result.status = 'NOT_READY';
      } else {
        result.status = 'NO_OPPORTUNITY';
      }

      if (ftlDelta < -0.02) {
        result.warnings.push(`FTL_GAP (${formatPct(ftlDelta)})`);
      }
    }

    return result;
  });
}

// ─── Public API ───────────────────────────────────────────────

export async function run(options: ScanOptions = {}): Promise<ScanResult> {
  const minVolume = options.minVolume ?? (options.entityType ? MIN_VOLUME_BY_TYPE : MIN_VOLUME_THRESHOLD);

  const [rolloutData, clmData, fourStepData] = await Promise.all([
    fetchRolloutStatus(options.entityType),
    fetchCLMMature(options.entityType),
    fetch4StepMature(options.entityType),
  ]);

  const joined = joinData(rolloutData, clmData, fourStepData);
  const countries = calculateMetrics(joined, minVolume);

  // Build summary
  const statusCounts: Record<OpportunityStatus, number> = {
    STRONG_OPPORTUNITY: 0,
    WEAK_OPPORTUNITY: 0,
    NOT_READY: 0,
    NO_OPPORTUNITY: 0,
    MISSING_DATA: 0,
  };
  for (const c of countries) statusCounts[c.status]++;

  const tierCounts: Record<string, number> = {};
  for (const c of countries) {
    const key = `tier_${c.tier}`;
    tierCounts[key] = (tierCounts[key] || 0) + 1;
  }

  // Build findings
  const findings: Finding[] = [];
  const strong = countries.filter(c => c.status === 'STRONG_OPPORTUNITY');
  if (strong.length > 0) {
    findings.push({
      summary: `${strong.length} strong opportunities found: ${strong.map(c => c.country_name).join(', ')}`,
      details: {
        countries: strong.map(c => ({
          country: c.country_name,
          tier: c.tier,
          approval_delta: c.delta?.approval,
          rollout_pct: c.rollout_pct,
        })),
      },
      tags: ['opportunity', 'scan'],
    });
  }

  // Build summary text
  const typeLabel = options.entityType ? ` (${options.entityType})` : '';
  const summaryLines = [
    `Opportunity scan${typeLabel}: ${countries.length} Tier 0/1/2 countries analyzed.`,
    `Strong: ${statusCounts.STRONG_OPPORTUNITY}, Weak: ${statusCounts.WEAK_OPPORTUNITY}, Not Ready: ${statusCounts.NOT_READY}, No Opportunity: ${statusCounts.NO_OPPORTUNITY}, Missing: ${statusCounts.MISSING_DATA}.`,
  ];
  if (strong.length > 0) {
    summaryLines.push(
      `Recommended: ${strong.map(c => `${c.country_name} (${formatPct(c.delta!.approval, 1, true)})`).join(', ')}.`,
    );
  }

  return {
    command: { type: 'scan-opportunities', entityType: options.entityType, minVolume },
    summary: summaryLines.join(' '),
    data: {
      countries,
      summary: {
        total_countries: countries.length,
        by_status: statusCounts,
        by_tier: tierCounts,
      },
      methodology: {
        mature_cohort_filter: MATURE_COHORT_FILTER,
        min_volume_threshold: minVolume,
        thresholds: { ...OPPORTUNITY_THRESHOLDS },
        entity_type: options.entityType,
      },
    },
    findings,
    timestamp: new Date().toISOString(),
  };
}
