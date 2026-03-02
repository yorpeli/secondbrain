/**
 * PPP Ingest Agent — Configuration
 *
 * Extracted from workflow_ppp_ingest v3.4.
 */

// ─── Tag Dictionary ──────────────────────────────────────────

export const TAG_DICTIONARY = {
  themes: [
    'data-quality', 'dlc', 'rollout', 'mobile', 'ocr',
    'experimentation', 'migration', 'e-collection', 'e-verification',
    'orchestration',
  ],
  domains: [
    'kyc', 'compliance', 'localization', 'vendors', 'backoffice',
    'partners', 'lead-scoring', 'licensing',
  ],
  vendors: [
    'persona', 'trulioo', 'au10tix', 'uipath', 'sumsub', 'applause',
    'hyperverge', 'clay', 'similarweb', 'zerobounce', 'bvd',
    'opencorporates', 'everc', 'identiflo',
  ],
  countries: [
    'uk', 'brazil', 'uae', 'china', 'india', 'canada', 'usa',
    'israel', 'ukraine', 'turkey', 'pakistan', 'singapore',
    'south-korea', 'colombia', 'australia', 'hong-kong',
  ],
} as const

// ─── Default Contributors ────────────────────────────────────

export const DEFAULT_CONTRIBUTORS: Record<string, string[]> = {
  'Full Rollout': ['chen'],
  'T1 Localization': ['eliya'],
  'Partners Rollout': ['estella'],
  'Compliance-related Improvements': [],
  'China/Hong Kong': [],
  'Vendor Optimization': ['yarden', 'vladimir'],
  'KYC New Flow': ['amit-lipschitz', 'maya'],
  'Lead Scoring': ['chen'],
  'Licenses': ['sitara', 'noga', 'hila'],
  'BackOffice': [],
}

// ─── Valid Statuses ──────────────────────────────────────────

export const VALID_STATUSES = ['on-track', 'potential-issues', 'at-risk', 'na'] as const

// ─── Quality Scoring Rubric ──────────────────────────────────

export const QUALITY_RUBRIC = {
  1: 'Vague, no metrics, no actionable items',
  2: 'Some structure but lacking specificity or metrics',
  3: 'Decent structure, some metrics cited, mostly actionable',
  4: 'Good specificity and metrics, clear attribution, actionable plans',
  5: 'Exemplary: quantified progress, clear ownership, strategic context, actionable next steps',
} as const
