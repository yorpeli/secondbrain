/**
 * AB Testing Agent — Constants & Configuration
 */

// ─── Looker ──────────────────────────────────────────────────

export const LOOKER_MODEL = 'product'
export const LOOKER_VIEW = 'clm_population_main_dashboard'

/** Standard CLM filters from Ira's Looker guide — applied to every experiment query */
export const CLM_DEFAULT_FILTERS: Record<string, string> = {
  'clm_population_main_dashboard.is_clm_registration': 'CLM',
  'clm_population_main_dashboard.reg_flow_changes': '"pure_clm"',
  'clm_population_main_dashboard.country_group': '-Not in Rollout',
  'clm_population_main_dashboard.is_bot': '0',
  'clm_population_main_dashboard.is_bot_expanded': '0',
  'clm_population_main_dashboard.is_arkose_bot': '0',
  'clm_population_main_dashboard.is_blocked': '0',
  'clm_population_main_dashboard.map_payments': 'Include',
}

/** Standard CLM funnel fields — ordered from top to bottom of funnel */
export const CLM_FUNNEL_FIELDS = [
  'clm_population_main_dashboard.accounts_created_clm',
  'clm_population_main_dashboard.mfa_approved',
  'clm_population_main_dashboard.clm_completed_signup',
  'clm_population_main_dashboard.clm_finished_segmentation',
  'clm_population_main_dashboard.provided_information',
  'clm_population_main_dashboard.requests_created_step',
  'clm_population_main_dashboard.requests_submitted_step',
  'clm_population_main_dashboard.submitted_all_docs_step',
  'clm_population_main_dashboard.accounts_approved',
  'clm_population_main_dashboard.fft_dynamic_measure',
  'clm_population_main_dashboard.icp_500',
  'clm_population_main_dashboard.icp_10k',
]

// ─── Statistical Thresholds ──────────────────────────────────

export const STAT_THRESHOLDS = {
  /** p-value threshold for significance */
  P_VALUE: 0.05,
  /** Minimum sample size per variant */
  MIN_SAMPLE: 100,
  /** Minimum meaningful lift percentage */
  MIN_LIFT_PCT: 1,
} as const

// ─── Analysis Verdicts ───────────────────────────────────────

export const VERDICTS = {
  TREATMENT_WINS: 'treatment-wins',
  CONTROL_WINS: 'control-wins',
  NO_DIFFERENCE: 'no-difference',
  INSUFFICIENT_DATA: 'insufficient-data',
  TOO_EARLY: 'too-early',
} as const

export type AnalysisVerdict = (typeof VERDICTS)[keyof typeof VERDICTS]

// ─── Experiment Lifecycle (Asana board columns) ──────────────

export const LIFECYCLE_STAGES = {
  IDEA: 'idea',
  IN_DESIGN: 'in-design',
  IN_DEVELOPMENT: 'in-development',
  LIVE: 'live',
  FOR_ANALYSIS: 'for-analysis',
  COMPLETED: 'completed',
  ROLLOUT_LIVE: 'rollout-live',
  ROLLOUT_IN_DEV: 'rollout-in-dev',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on-hold',
} as const

export type ExperimentLifecycle = (typeof LIFECYCLE_STAGES)[keyof typeof LIFECYCLE_STAGES]

/** Map Asana board section names → lifecycle stage */
export const SECTION_TO_LIFECYCLE: Record<string, ExperimentLifecycle> = {
  'Ideas': 'idea',
  'In Design': 'in-design',
  'In Development': 'in-development',
  'Live': 'live',
  'For Analysis': 'for-analysis',
  'Completed': 'completed',
  'Rollouts-Live': 'rollout-live',
  'Rollouts - Live': 'rollout-live',
  'Rollouts-In Development': 'rollout-in-dev',
  'Rollouts - In Development': 'rollout-in-dev',
  'Cancelled': 'cancelled',
  'On Hold': 'on-hold',
  'Removed': 'cancelled',
}

// ─── Asana ───────────────────────────────────────────────────

export const ASANA_PROJECT_ID = '1209189164647481'
