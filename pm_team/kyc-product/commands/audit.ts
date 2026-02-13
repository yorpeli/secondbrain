/**
 * KYC Product PM — Audit Command
 *
 * Gathers all internally available data about Payoneer's KYC capabilities.
 * Queries PPP sections, analytics findings, agent logs, and research results.
 * Identifies what data must come from Yonatan and creates needs-human tasks.
 */

import { getPhaseWorkstreams } from '../lib/playbook-config.js'
import type {
  AgentLogEntry,
  AuditResult,
  CapabilityArea,
  CompletedAgentTask,
  KnowledgeGap,
  PppSection,
} from '../lib/types.js'

const AGENT_SLUG = 'kyc-product-pm'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Data Gathering ──────────────────────────────────────────

/** PPP sections related to KYC workstreams */
async function getKycPppSections(supabase: any): Promise<PppSection[]> {
  const kycTags = ['kyc', 'kyc-service', 'verification', 'vendor', 'kyc-new-flow', 'kyc-optimization', 'vendor-optimization']

  const { data, error } = await supabase
    .from('v_ppp_swimlanes' as any)
    .select('section_id, report_id, week_date, workstream_name, lead_name, lead_slug, status, quality_score, summary, raw_text, tags')
    .overlaps('tags', kycTags)
    .order('week_date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[audit] PPP query failed:', error.message)
    return []
  }

  return (data || []) as unknown as PppSection[]
}

/** Agent findings related to KYC */
async function getKycFindings(supabase: any): Promise<AgentLogEntry[]> {
  const kycTags = ['kyc', 'kyc-service', 'verification', 'vendor', 'approval-rate', 'decision-rate']

  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .overlaps('tags', kycTags)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[audit] Agent log query failed:', error.message)
    return []
  }

  return (data || []) as unknown as AgentLogEntry[]
}

/** Completed analytics tasks with KYC relevance */
async function getAnalyticsTasks(supabase: any): Promise<CompletedAgentTask[]> {
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags, status, target_agent, created_by')
    .eq('status', 'done')
    .eq('picked_up_by', 'analytics')
    .order('completed_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[audit] Analytics tasks query failed:', error.message)
    return []
  }

  return (data || []) as unknown as CompletedAgentTask[]
}

/** Existing research related to KYC */
async function getKycResearch(supabase: any): Promise<{ id: string; topic: string; research_type: string; summary: string; tags: string[] | null }[]> {
  const kycTags = ['kyc', 'kyc-service', 'verification', 'kyc-as-a-service', 'kyc-product']

  const { data, error } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, summary, tags')
    .eq('status', 'current')
    .overlaps('tags', kycTags)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[audit] Research query failed:', error.message)
    return []
  }

  return (data || []) as unknown as { id: string; topic: string; research_type: string; summary: string; tags: string[] | null }[]
}

/** Get KYC-related team info */
async function getKycTeam(supabase: any): Promise<{ name: string; role: string; slug: string }[]> {
  const { data, error } = await supabase
    .from('v_org_tree' as any)
    .select('name, role, slug, team_name')
    .eq('team_name', 'KYC Service')

  if (error) {
    console.error('[audit] Team query failed:', error.message)
    return []
  }

  return (data || []) as unknown as { name: string; role: string; slug: string }[]
}

// ─── Capability Mapping ─────────────────────────────────────

function buildCapabilityAreas(
  pppSections: PppSection[],
  findings: AgentLogEntry[],
  analyticsTasks: CompletedAgentTask[],
  research: { topic: string; summary: string }[],
): CapabilityArea[] {
  const areas: CapabilityArea[] = []

  // Extract known facts from PPP workstream names and summaries
  const workstreamNames = Array.from(new Set(pppSections.map(s => s.workstream_name)))
  const pppSummaries = pppSections
    .filter(s => s.summary)
    .map(s => s.summary!)

  // 1. Verification Flows
  areas.push({
    name: 'Verification Flows',
    knownFacts: [
      'KYC covers identity verification, document checks, sanctions/PEP screening',
      '4Step → CLM migration in progress (new KYC flow being rolled out)',
      `PPP tracks ${workstreamNames.length} KYC-related workstreams`,
    ],
    dataFromSystem: workstreamNames.map(w => `PPP workstream: "${w}"`),
    gaps: [
      'Full list of verification steps in the new CLM flow',
      'Decision logic: what triggers auto-approve vs manual review vs reject',
      'Document types accepted per country',
    ],
  })

  // 2. Country Coverage
  const countryMentions = pppSections
    .flatMap(s => s.tags ?? [])
    .filter(t => ['uk', 'us', 'sg', 'uae', 'india', 'brazil'].includes(t.toLowerCase()))
  const uniqueCountries = Array.from(new Set(countryMentions.map(c => c.toUpperCase())))

  areas.push({
    name: 'Country Coverage',
    knownFacts: [
      'Payoneer operates in 190+ countries',
      `Hub countries tracked in PPP: ${uniqueCountries.length > 0 ? uniqueCountries.join(', ') : 'UK, US, SG, UAE'}`,
      'Country-specific regulatory requirements affect verification flows',
    ],
    dataFromSystem: uniqueCountries.map(c => `Active PPP tracking for: ${c}`),
    gaps: [
      'Full country-by-country KYC coverage matrix',
      'Which countries have full automation vs manual-heavy?',
      'High-risk country list and what makes them high-risk',
      'Country-specific pass/fail rates',
    ],
  })

  // 3. Vendor Integrations
  areas.push({
    name: 'Vendor Integrations',
    knownFacts: [
      'Multiple external vendors for verification (EVS, eKYX mentioned in PPP)',
      'Vendor optimization is an active workstream',
    ],
    dataFromSystem: pppSections
      .filter(s => (s.tags ?? []).some(t => t.includes('vendor')))
      .map(s => `Vendor PPP: "${s.workstream_name}" (${s.week_date})`),
    gaps: [
      'Complete vendor list and what each provides',
      'Vendor costs breakdown',
      'Vendor performance comparison',
      'Which vendors are critical path vs redundant',
    ],
  })

  // 4. Manual Operations
  areas.push({
    name: 'Manual Operations',
    knownFacts: [
      '350-person manual review operation exists',
      'Manual review serves as fallback for automated decisions',
    ],
    dataFromSystem: findings
      .filter(f => f.summary.toLowerCase().includes('manual') || (f.tags ?? []).some(t => t.includes('manual')))
      .map(f => `Finding: ${f.summary.slice(0, 100)}`),
    gaps: [
      'Throughput: reviews per day per reviewer',
      'Accuracy rate of manual reviews',
      'Cost per manual review',
      'Average turnaround time',
      'What triggers manual review vs auto-decision',
      'Team structure, specialization, training',
    ],
  })

  // 5. Performance
  areas.push({
    name: 'Performance Metrics',
    knownFacts: [
      'GLPS-adjusted approval rates tracked by analytics agent',
      'KYC completion rate ~23% globally (from CLM context)',
    ],
    dataFromSystem: analyticsTasks
      .filter(t => t.result_summary && (
        t.result_summary.toLowerCase().includes('approval') ||
        t.result_summary.toLowerCase().includes('kyc')
      ))
      .map(t => `Analytics: ${t.result_summary?.slice(0, 100)}`)
      .slice(0, 5),
    gaps: [
      'Overall decision rate (% applicants that get a final decision)',
      'False positive rate (legitimate applicants rejected)',
      'False negative rate (fraudulent applicants approved)',
      'End-to-end KYC processing time (automated vs manual)',
      'SLA performance for enterprise customers',
    ],
  })

  // 6. Technology
  areas.push({
    name: 'Technology Stack',
    knownFacts: [
      'InRule used for decision rules engine',
      'CLM system replacing legacy 4Step',
      'Edge functions and Supabase for agent infrastructure',
    ],
    dataFromSystem: [],
    gaps: [
      'Architecture of the KYC decision engine',
      'API capabilities (does an external API exist?)',
      'Data flow: how applicant data moves through the system',
      'Integration points: what would need to change for external customers',
    ],
  })

  return areas
}

// ─── Main ───────────────────────────────────────────────────

export async function run(): Promise<AuditResult> {
  console.log('  Running internal capability audit...')
  const supabase = await getSupabase()

  // Gather all internal data in parallel
  const [pppSections, findings, analyticsTasks, research, team] = await Promise.all([
    getKycPppSections(supabase),
    getKycFindings(supabase),
    getAnalyticsTasks(supabase),
    getKycResearch(supabase),
    getKycTeam(supabase),
  ])

  console.log(`  Data gathered: ${pppSections.length} PPP, ${findings.length} findings, ${analyticsTasks.length} analytics, ${research.length} research`)

  // Build capability map
  const capabilities = buildCapabilityAreas(pppSections, findings, analyticsTasks, research)

  // PPP insights
  const latestWeek = pppSections.length > 0 ? pppSections[0].week_date : null
  const pppInsights = latestWeek
    ? pppSections
        .filter(s => s.week_date === latestWeek)
        .map(s => ({
          workstream: s.workstream_name,
          summary: s.summary ?? '(no summary)',
          status: s.status ?? 'unknown',
        }))
    : []

  // Analytics insights
  const analyticsInsights = analyticsTasks
    .filter(t => t.result_summary)
    .map(t => t.result_summary!)
    .slice(0, 5)

  // Collect all gaps that need human data
  const humanDataNeeded: KnowledgeGap[] = []
  for (const cap of capabilities) {
    for (const gap of cap.gaps) {
      humanDataNeeded.push({
        area: cap.name,
        description: gap,
        source: 'human',
        assignTo: 'yonatan',
        priority: 'normal',
      })
    }
  }

  // Check for existing pending human tasks from this agent
  const { data: existingHumanTasks } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, tags')
    .eq('created_by', `agent:${AGENT_SLUG}`)
    .in('status', ['pending', 'picked-up'])
    .overlaps('tags' as any, ['needs-human'])

  const existingTitles = ((existingHumanTasks || []) as any[]).map((t: any) => t.title.toLowerCase())

  // Create needs-human tasks for gaps (grouped by capability area)
  const { createTask } = await import('../../../lib/tasks.js')
  const tasksCreated: { title: string; targetAgent: string | null; id: string | null }[] = []

  const capAreasWithGaps = capabilities.filter(c => c.gaps.length > 0)

  for (const cap of capAreasWithGaps) {
    const titleKey = cap.name.toLowerCase().replace(/\s+/g, '-')
    const alreadyExists = existingTitles.some(t => t.includes(titleKey))

    if (!alreadyExists) {
      const title = `[KYC-PRODUCT] Audit data needed: ${cap.name}`
      const id = await createTask({
        title,
        description: JSON.stringify({
          type: 'audit-data-request',
          capabilityArea: cap.name,
          knownFacts: cap.knownFacts,
          dataGaps: cap.gaps,
          source: AGENT_SLUG,
        }),
        priority: 'normal',
        createdBy: `agent:${AGENT_SLUG}`,
        tags: ['needs-human', AGENT_SLUG, 'kyc-as-a-service', 'audit', titleKey],
      })

      tasksCreated.push({ title, targetAgent: null, id })
    }
  }

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push('KYC Product PM — Internal Capability Audit')
  summaryParts.push('═'.repeat(50))

  if (team.length > 0) {
    summaryParts.push(`\nKYC Service Team: ${team.map(t => `${t.name} (${t.role})`).join(', ')}`)
  }

  summaryParts.push(`\nData sources:`)
  summaryParts.push(`  PPP sections: ${pppSections.length} (${Array.from(new Set(pppSections.map(s => s.week_date))).length} weeks)`)
  summaryParts.push(`  Agent findings: ${findings.length}`)
  summaryParts.push(`  Analytics results: ${analyticsTasks.length}`)
  summaryParts.push(`  Research entries: ${research.length}`)

  for (const cap of capabilities) {
    summaryParts.push(`\n${'─'.repeat(40)}`)
    summaryParts.push(`${cap.name}`)
    summaryParts.push(`  Known (${cap.knownFacts.length}):`)
    for (const fact of cap.knownFacts) {
      summaryParts.push(`    [Fact] ${fact}`)
    }
    if (cap.dataFromSystem.length > 0) {
      summaryParts.push(`  From system (${cap.dataFromSystem.length}):`)
      for (const d of cap.dataFromSystem.slice(0, 3)) {
        summaryParts.push(`    ${d}`)
      }
    }
    summaryParts.push(`  Gaps (${cap.gaps.length}):`)
    for (const gap of cap.gaps) {
      summaryParts.push(`    ? ${gap}`)
    }
  }

  if (pppInsights.length > 0) {
    summaryParts.push(`\n${'═'.repeat(50)}`)
    summaryParts.push(`Latest PPP (${latestWeek}):`)
    for (const insight of pppInsights) {
      summaryParts.push(`  [${insight.status}] ${insight.workstream}: ${insight.summary.slice(0, 80)}`)
    }
  }

  if (tasksCreated.length > 0) {
    summaryParts.push(`\nTasks created for Yonatan (${tasksCreated.length}):`)
    for (const task of tasksCreated) {
      summaryParts.push(`  > ${task.title}`)
    }
  }

  const totalGaps = capabilities.reduce((sum, c) => sum + c.gaps.length, 0)
  const totalKnown = capabilities.reduce((sum, c) => sum + c.knownFacts.length + c.dataFromSystem.length, 0)
  summaryParts.push(`\nSummary: ${totalKnown} known facts, ${totalGaps} data gaps, ${tasksCreated.length} human tasks created`)

  const result: AuditResult = {
    summary: summaryParts.join('\n'),
    capabilities,
    pppInsights,
    analyticsInsights,
    humanDataNeeded,
    tasksCreated,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: AGENT_SLUG,
    category: 'finding',
    summary: `Internal capability audit: ${totalKnown} known facts, ${totalGaps} data gaps across ${capabilities.length} areas`,
    details: {
      capabilityAreas: capabilities.map(c => ({
        name: c.name,
        knownFacts: c.knownFacts.length,
        dataFromSystem: c.dataFromSystem.length,
        gaps: c.gaps.length,
      })),
      pppSectionsCount: pppSections.length,
      tasksCreated: tasksCreated.length,
    } as any,
    tags: [AGENT_SLUG, 'kyc-as-a-service', 'audit'],
  })

  return result
}
