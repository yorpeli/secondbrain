/**
 * Analytics Agent — TypeScript Types
 */

import type { OpportunityStatus, DeepDiveVerdict, EntityType } from '../config/constants.js';

// ─── Analysis Commands ────────────────────────────────────────

export type AnalysisCommand =
  | { type: 'scan-opportunities'; entityType?: EntityType; minVolume?: number }
  | { type: 'compare'; country: string; detailed?: boolean }
  | { type: 'deep-dive'; country: string }
  | { type: 'diagnose'; country: string; minVolume?: number };

// ─── Analysis Results ─────────────────────────────────────────

export interface Finding {
  summary: string;
  details?: Record<string, unknown>;
  tags?: string[];
}

export interface AnalysisResult {
  command: AnalysisCommand;
  summary: string;
  data: Record<string, unknown>;
  findings: Finding[];
  timestamp: string;
}

// ─── Scan Opportunities ───────────────────────────────────────

export interface CountryMetrics {
  created: number;
  approved: number;
  ftl: number;
  approval_rate: number;
  ftl_rate: number;
}

export interface CLMMetrics extends CountryMetrics {
  seg_rate: number;
  docs_rate: number;
}

export interface FourStepMetrics extends CountryMetrics {
  glps_approved: number;
}

export interface CountryOpportunity {
  country_name: string;
  tier: number;
  rollout_pct: number;
  clm: CLMMetrics | null;
  four_step: FourStepMetrics | null;
  delta: { approval: number; ftl: number } | null;
  status: OpportunityStatus;
  warnings: string[];
}

export interface ScanResult extends AnalysisResult {
  data: {
    countries: CountryOpportunity[];
    summary: {
      total_countries: number;
      by_status: Record<OpportunityStatus, number>;
      by_tier: Record<string, number>;
    };
    methodology: {
      mature_cohort_filter: string;
      min_volume_threshold: number;
      thresholds: Record<string, number>;
      entity_type?: string;
    };
  };
}

// ─── Compare ──────────────────────────────────────────────────

export interface CompareResult extends AnalysisResult {
  data: {
    country: string;
    clm: CLMMetrics | null;
    four_step: FourStepMetrics | null;
    delta: { approval: number; ftl: number } | null;
    status: OpportunityStatus;
    weekly_trends?: WeeklyDataPoint[];
    trend_analysis?: {
      older_rate: number;
      newer_rate: number;
      trend_delta: number;
      direction: 'improving' | 'declining' | 'stable';
    };
  };
}

export interface WeeklyDataPoint {
  week: string;
  weeks_ago: number;
  created: number;
  approved: number;
  ftl: number;
  approval_rate: number;
  ftl_rate: number;
}

// ─── Deep Dive ────────────────────────────────────────────────

export interface FunnelHealth {
  seg: { recent: number; baseline: number; delta: number };
  docs: { recent: number; baseline: number; delta: number };
}

export interface DeepDiveResult extends AnalysisResult {
  data: {
    country: string;
    tier: string;
    rollout_pct: number;
    verdict: DeepDiveVerdict;
    clm_mature: CLMMetrics | null;
    fs_mature: FourStepMetrics | null;
    approval_delta?: number;
    ftl_delta?: number;
    volume_trend: { week: string; weeks_ago: number; created: number }[];
    volume_change?: number;
    funnel_health?: FunnelHealth;
    early_approval?: { recent: number; mature: number; gap: number };
    warnings: string[];
    notes: string[];
    narrative: string;
  };
}

// ─── Diagnose Country ─────────────────────────────────────────

export interface SegmentIssue {
  metric: string;
  segment_rate: number;
  baseline_rate: number;
  delta: number;
  severity: 'RED' | 'YELLOW';
}

export interface SegmentAnalysis {
  segment: string;
  volume: number;
  low_volume: boolean;
  rates?: {
    created: number;
    seg_rate: number;
    docs_rate: number;
    approval_rate: number;
    ftl_rate: number;
  };
  issues: SegmentIssue[];
}

export interface TrendMetric {
  metric: string;
  older_period_avg: number;
  newer_period_avg: number;
  change: number;
  severity: 'RED' | 'YELLOW';
  direction: 'DECLINING';
}

export interface TrendAnalysis {
  insufficient_data?: boolean;
  all_weeks?: number;
  mature_weeks?: number;
  volume_sparkline?: number[];
  volume_date_range?: string;
  trends: TrendMetric[];
  older_period?: { dates: string; weeks_ago: string; avg: Record<string, number> };
  newer_period?: { dates: string; weeks_ago: string; avg: Record<string, number> };
  note?: string;
}

export interface DiagnoseResult extends AnalysisResult {
  data: {
    country: string;
    baseline: {
      created: number;
      seg_rate: number;
      docs_rate: number;
      approval_rate: number;
      ftl_rate: number;
    };
    by_ah_type: SegmentAnalysis[];
    by_device: SegmentAnalysis[];
    by_combination: SegmentAnalysis[];
    trend: TrendAnalysis;
  };
}

// ─── Looker Types ─────────────────────────────────────────────

export interface LookerQueryBody {
  model: string;
  view: string;
  fields: string[];
  filters: Record<string, string>;
  sorts?: string[];
  limit?: string;
}

export interface LookerQueryResult {
  query_id: number;
  query_slug: string;
  results: Record<string, unknown>[];
}

export interface LookerLookConfig {
  look_id: string;
  name: string;
  model: string;
  view: string;
  query_templates?: Record<string, {
    name: string;
    description: string;
    fields?: string[];
    filters?: Record<string, string>;
    sorts?: string[];
    limit?: string;
  }>;
  filters?: {
    required?: Record<string, { field: string; value: string }>;
    recommended_defaults?: Record<string, { field: string; value: string }>;
  };
  [key: string]: unknown;
}

export interface CountryTiers {
  tiers: Record<string, {
    name: string;
    countries?: string[] | string;
    countries_looker_names?: string[];
    baseline: number;
    target: number;
  }>;
}

export class LookerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
    public responseBody?: string,
  ) {
    super(message);
    this.name = 'LookerApiError';
  }
}
