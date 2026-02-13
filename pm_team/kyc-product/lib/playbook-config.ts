/**
 * KYC Product PM — Playbook Configuration
 *
 * Defines phases, research workstreams, and their data requirements.
 */

import type { PhaseDefinition, ResearchWorkstream } from './types.js'

// ─── Research Workstreams ───────────────────────────────────

export const WORKSTREAMS: ResearchWorkstream[] = [
  // Phase 1: Market & Competitive Analysis
  {
    id: 'market-sizing',
    name: 'Market Sizing',
    phase: 1,
    description: 'TAM/SAM/SOM for KYC/IDV-as-a-Service (B2B)',
    searchTags: ['market-sizing', 'kyc-market', 'idv-market', 'tam', 'market-size'],
    requiredAgents: ['competitive-analysis', 'domain-expertise'],
    humanDataNeeded: [],
  },
  {
    id: 'competitive-landscape',
    name: 'Competitive Landscape',
    phase: 1,
    description: 'Key competitors, positioning, pricing, strengths/weaknesses',
    searchTags: ['competitive-landscape', 'competitor', 'jumio', 'onfido', 'sumsub', 'stripe-identity', 'persona', 'veriff', 'trulioo'],
    requiredAgents: ['competitive-analysis'],
    humanDataNeeded: [],
  },
  {
    id: 'customer-segments',
    name: 'Customer Segments',
    phase: 1,
    description: 'Who buys B2B KYC, why, buying criteria by segment',
    searchTags: ['customer-segments', 'customer-analysis', 'marketplace', 'enterprise', 'buying-criteria'],
    requiredAgents: ['competitive-analysis', 'domain-expertise'],
    humanDataNeeded: [],
  },
  {
    id: 'existing-customers',
    name: 'Existing Customer Analysis',
    phase: 1,
    description: 'eBay, Best Buy, Etsy — what they use, value, pay',
    searchTags: ['existing-customers', 'ebay', 'best-buy', 'etsy', 'enterprise-kyc'],
    requiredAgents: [],
    humanDataNeeded: [
      'What KYC services do eBay, Best Buy, Etsy use from Payoneer?',
      'Why did they choose Payoneer over competitors?',
      'Contract details: volume, revenue, pricing model',
      'Customer satisfaction and improvement requests',
    ],
  },

  // Phase 2: Internal Capability Audit
  {
    id: 'capabilities',
    name: 'Current Capabilities',
    phase: 2,
    description: 'KYC verification flows, country coverage, vendor integrations',
    searchTags: ['kyc', 'kyc-service', 'verification', 'kyc-flow', 'vendor', 'evs', 'ekyx', 'country-coverage'],
    requiredAgents: ['analytics', 'domain-expertise'],
    humanDataNeeded: [
      'Detailed KYC capability map (what verification steps exist)',
      'Vendor list and what each vendor provides',
      'Country-by-country coverage matrix',
    ],
  },
  {
    id: 'manual-ops',
    name: 'Manual Operations',
    phase: 2,
    description: 'Manual review team: throughput, quality, cost, process',
    searchTags: ['manual-review', 'manual-ops', 'operations', 'review-team'],
    requiredAgents: [],
    humanDataNeeded: [
      'Manual review throughput (reviews per day/person)',
      'Manual review accuracy rate',
      'Cost per manual review',
      'Average turnaround time',
      'What triggers manual review vs auto-decision',
      'Team structure and skill specialization',
    ],
  },
  {
    id: 'performance',
    name: 'Performance Metrics',
    phase: 2,
    description: 'Decision rates, accuracy, FP/FN rates, SLA compliance',
    searchTags: ['approval-rate', 'decision-rate', 'false-positive', 'false-negative', 'accuracy', 'kyc-performance'],
    requiredAgents: ['analytics'],
    humanDataNeeded: [
      'Overall KYC decision rate (% of applicants that get a decision)',
      'False positive rate (legitimate applicants rejected)',
      'False negative rate (fraudulent applicants approved)',
      'Current SLAs for enterprise customers',
    ],
  },
  {
    id: 'cost-structure',
    name: 'Cost Structure',
    phase: 2,
    description: 'Unit economics: cost per decision, vendor costs, ops costs',
    searchTags: ['cost-structure', 'unit-economics', 'cost-per-decision', 'pricing'],
    requiredAgents: [],
    humanDataNeeded: [
      'Cost per automated KYC decision',
      'Cost per manual review',
      'Blended cost per decision',
      'Vendor costs breakdown',
      'What do enterprise customers currently pay per decision?',
    ],
  },
]

// ─── Phase Definitions ──────────────────────────────────────

export const PHASES: PhaseDefinition[] = [
  {
    number: 1,
    name: 'Market & Competitive Analysis',
    description: 'Understand the market opportunity, competitive landscape, and target customer segments',
    workstreams: ['market-sizing', 'competitive-landscape', 'customer-segments', 'existing-customers'],
  },
  {
    number: 2,
    name: 'Internal Capability Audit',
    description: 'Map what Payoneer has today: capabilities, performance, costs, operations',
    workstreams: ['capabilities', 'manual-ops', 'performance', 'cost-structure'],
  },
  {
    number: 3,
    name: 'Gap Analysis & Product Definition',
    description: 'Compare market needs with capabilities, define product packaging and pricing',
    workstreams: [], // Defined dynamically based on Phase 1+2 findings
  },
  {
    number: 4,
    name: 'Business Case',
    description: 'Revenue projections, investment, positioning, go-to-market',
    workstreams: [],
  },
  {
    number: 5,
    name: 'Stakeholder Alignment',
    description: 'Internal pitch materials, consensus building, leadership proposal',
    workstreams: [],
  },
]

// ─── Helpers ────────────────────────────────────────────────

export function resolveWorkstream(topic: string): ResearchWorkstream | null {
  const lower = topic.toLowerCase().replace(/\s+/g, '-')

  // Exact match
  const exact = WORKSTREAMS.find(w => w.id === lower)
  if (exact) return exact

  // Fuzzy: check if the topic contains or is contained by a workstream ID
  const fuzzy = WORKSTREAMS.find(w =>
    lower.includes(w.id) || w.id.includes(lower) ||
    w.name.toLowerCase().includes(topic.toLowerCase())
  )
  if (fuzzy) return fuzzy

  return null
}

export function getPhaseWorkstreams(phase: number): ResearchWorkstream[] {
  return WORKSTREAMS.filter(w => w.phase === phase)
}

export function getPhase(number: number): PhaseDefinition | undefined {
  return PHASES.find(p => p.number === number)
}

/** All tags this agent uses for discovery across workstreams */
export const ALL_SEARCH_TAGS = Array.from(new Set(WORKSTREAMS.flatMap(w => w.searchTags)))
