/**
 * Analytics Agent — Centralized Constants
 *
 * All hardcoded values from the Looker2 project in one place.
 */

// Looker model/view
export const VIEW_PREFIX = 'clm_population_main_dashboard';
export const LOOKER_MODEL = 'product';

// Cohort filters (Looker native date syntax)
export const MATURE_COHORT_FILTER = '4 weeks ago for 4 weeks';
export const RECENT_FILTER = '2 weeks';
export const WEEKLY_TREND_FILTER = '12 weeks';
export const ROLLOUT_DATE_FILTER = '30 days';

// Volume thresholds
export const MIN_VOLUME_THRESHOLD = 100;
export const MIN_VOLUME_BY_TYPE = 50;
export const MIN_SEGMENT_VOLUME = 20;

// Opportunity classification thresholds (approval delta)
export const OPPORTUNITY_THRESHOLDS = {
  STRONG: 0.02,      // +2% or more → strong opportunity
  WEAK: 0,           // 0% to +2% → weak opportunity
  NOT_READY: -0.05,  // -5% to 0% → not ready
  // Below -5% → no opportunity
} as const;

// Deep-dive thresholds
export const DEEP_DIVE_THRESHOLDS = {
  VOLUME_NOTE: 0.10,
  VOLUME_RED_FLAG: 0.20,
  SEGMENTATION_NOTE: 0.10,
  SEGMENTATION_RED_FLAG: 0.20,
  DOCS_NOTE: 0.15,
  DOCS_RED_FLAG: 0.25,
  APPROVAL_GAP_NOTE: 0.05,
  APPROVAL_GAP_RED: 0.10,
} as const;

// Diagnostic thresholds
export const DIAGNOSTIC_THRESHOLDS = {
  LOW_APPROVAL_RATE: 0.15,
  MIN_VOLUME: 100,
  MIN_SEGMENT_VOLUME: 20,
  YELLOW_FLAG: 0.10,
  RED_FLAG: 0.20,
  TREND_YELLOW: 0.10,
  TREND_RED: 0.20,
} as const;

// Entity types in Looker
export const ENTITY_TYPES = ['Company', 'Individual', 'Sole Proprietor'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

// Opportunity statuses
export const OPPORTUNITY_STATUSES = [
  'STRONG_OPPORTUNITY',
  'WEAK_OPPORTUNITY',
  'NOT_READY',
  'NO_OPPORTUNITY',
  'MISSING_DATA',
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

// Deep-dive verdicts
export const DEEP_DIVE_VERDICTS = [
  'RECOMMEND',
  'RECOMMEND_WITH_CAUTION',
  'MONITOR',
  'NOT_READY',
  'NO_OPPORTUNITY',
  'INSUFFICIENT_DATA',
] as const;
export type DeepDiveVerdict = (typeof DEEP_DIVE_VERDICTS)[number];

// CLM funnel steps (for diagnostic analysis)
export const CLM_STEPS = [
  { field: 'accounts_created_clm', name: 'Created', short: 'created' },
  { field: 'clm_finished_segmentation', name: 'Segmentation', short: 'seg' },
  { field: 'submitted_all_docs_step', name: 'Docs Submitted', short: 'docs' },
  { field: 'accounts_approved', name: 'Approved', short: 'approved' },
] as const;
