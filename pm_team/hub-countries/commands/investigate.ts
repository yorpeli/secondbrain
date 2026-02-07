/**
 * Hub Countries PM — Investigate Command
 *
 * Directed deep-dive into a specific hub country. Gathers all available
 * data, structures it, flags anomalies, and recommends next steps.
 *
 * Deeper than check-in: more history, broader search, trend analysis.
 */

import { resolveCountry, type HubCountry } from '../lib/country-config.js'
import type {
  AgentLogEntry,
  CompletedAgentTask,
  CountryFlag,
  InvestigationResult,
  PppSection,
  ResearchEntry,
} from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Data Gathering (deeper than check-in) ───────────────────

async function getPppHistory(supabase: any, country: HubCountry): Promise<PppSection[]> {
  // Last 4 weeks of PPP data for trend analysis
  const { data, error } = await supabase
    .from('v_ppp_swimlanes' as any)
    .select('section_id, report_id, week_date, workstream_name, lead_name, lead_slug, status, quality_score, quality_notes, summary, raw_text, tags, contributors')
    .overlaps('tags', country.pppTags)
    .order('week_date', { ascending: false })
    .limit(40) // ~4 weeks × up to 10 swimlanes

  if (error) {
    console.error(`[investigate] PPP history query failed for ${country.code}:`, error.message)
    return []
  }

  return (data || []) as unknown as PppSection[]
}

async function getAnalyticsTasks(supabase: any, country: HubCountry): Promise<CompletedAgentTask[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags')
    .eq('status', 'done')
    .eq('picked_up_by', 'analytics')
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .order('completed_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error(`[investigate] Analytics tasks query failed for ${country.code}:`, error.message)
    return []
  }

  // Filter client-side for this country
  const tasks = (data || []) as unknown as CompletedAgentTask[]
  const terms = [country.lookerName.toLowerCase(), country.code.toLowerCase(), country.name.toLowerCase()]

  return tasks.filter(t => {
    const desc = (t.description ?? '').toLowerCase()
    const title = t.title.toLowerCase()
    const summary = (t.result_summary ?? '').toLowerCase()
    return terms.some(term => desc.includes(term) || title.includes(term) || summary.includes(term))
  })
}

async function getAgentFindings(supabase: any, country: HubCountry, topic?: string): Promise<AgentLogEntry[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .overlaps('tags', country.logTags)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error(`[investigate] Agent log query failed for ${country.code}:`, error.message)
    return []
  }

  let entries = (data || []) as unknown as AgentLogEntry[]

  // If topic specified, additionally filter by topic keywords
  if (topic) {
    const topicLower = topic.toLowerCase()
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 3)

    entries = entries.filter(e => {
      const summaryLower = e.summary.toLowerCase()
      const tagsLower = (e.tags ?? []).map(t => t.toLowerCase())
      return topicWords.some(w => summaryLower.includes(w) || tagsLower.some(t => t.includes(w)))
    })
  }

  return entries
}

async function getResearch(supabase: any, country: HubCountry, topic?: string): Promise<ResearchEntry[]> {
  let query = supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .overlaps('tags', country.logTags)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error(`[investigate] Research query failed for ${country.code}:`, error.message)
    return []
  }

  let entries = (data || []) as unknown as ResearchEntry[]

  // Also search by topic if specified
  if (topic) {
    const { data: topicData } = await supabase
      .from('research_results' as any)
      .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
      .eq('status', 'current')
      .ilike('topic', `%${topic}%`)
      .order('created_at', { ascending: false })

    if (topicData) {
      const topicEntries = topicData as unknown as ResearchEntry[]
      const existingIds = new Set(entries.map(e => e.id))
      for (const entry of topicEntries) {
        if (!existingIds.has(entry.id)) {
          entries.push(entry)
        }
      }
    }
  }

  return entries
}

// ─── Analysis ────────────────────────────────────────────────

function analyzeTrends(pppHistory: PppSection[]): { trend: string; details: string }[] {
  const trends: { trend: string; details: string }[] = []

  // Group by workstream
  const byWorkstream = new Map<string, PppSection[]>()
  for (const section of pppHistory) {
    const list = byWorkstream.get(section.workstream_name) || []
    list.push(section)
    byWorkstream.set(section.workstream_name, list)
  }

  for (const [workstream, sections] of byWorkstream) {
    // Sort by week_date ascending for trend analysis
    const sorted = [...sections].sort((a, b) => a.week_date.localeCompare(b.week_date))

    if (sorted.length < 2) continue

    // Check status trajectory
    const statuses = sorted.map(s => s.status)
    const statusOrder: Record<string, number> = { 'on-track': 0, 'potential-issues': 1, 'at-risk': 2 }

    const latest = statuses[statuses.length - 1]
    const previous = statuses[statuses.length - 2]

    if (latest && previous && statusOrder[latest] !== undefined && statusOrder[previous] !== undefined) {
      if (statusOrder[latest] > statusOrder[previous]) {
        trends.push({
          trend: 'declining',
          details: `"${workstream}" declined from ${previous} to ${latest}`,
        })
      } else if (statusOrder[latest] < statusOrder[previous]) {
        trends.push({
          trend: 'improving',
          details: `"${workstream}" improved from ${previous} to ${latest}`,
        })
      }
    }

    // Check quality trajectory
    const scores = sorted.map(s => s.quality_score).filter((s): s is number => s != null)
    if (scores.length >= 2) {
      const latestScore = scores[scores.length - 1]
      const avgPrev = scores.slice(0, -1).reduce((a, b) => a + b, 0) / (scores.length - 1)

      if (latestScore < avgPrev - 1) {
        trends.push({
          trend: 'quality-drop',
          details: `"${workstream}" quality dropped to ${latestScore} (avg was ${avgPrev.toFixed(1)})`,
        })
      }
    }
  }

  return trends
}

function buildFlags(
  country: HubCountry,
  pppHistory: PppSection[],
  analyticsResults: CompletedAgentTask[],
  agentFindings: AgentLogEntry[],
  researchResults: ResearchEntry[],
): CountryFlag[] {
  const flags: CountryFlag[] = []
  const code = country.code

  // Trends from PPP
  const trends = analyzeTrends(pppHistory)
  for (const trend of trends) {
    if (trend.trend === 'declining') {
      flags.push({
        severity: 'yellow',
        flag: 'Declining PPP trend',
        detail: trend.details,
        country: code,
      })
    }
  }

  // No recent analytics
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const hasRecentAnalytics = analyticsResults.some(
    t => t.completed_at && new Date(t.completed_at) > fourteenDaysAgo
  )
  if (!hasRecentAnalytics) {
    flags.push({
      severity: 'yellow',
      flag: 'No recent analytics',
      detail: `No analytics results for ${code} in the last 14 days`,
      country: code,
      recommendedAction: `Create analytics task: {"type": "deep-dive", "country": "${country.lookerName}"}`,
    })
  }

  // Analytics flags from findings
  for (const finding of agentFindings.filter(f => f.agent_slug === 'analytics')) {
    const summaryLower = finding.summary.toLowerCase()
    if (summaryLower.includes('red') || summaryLower.includes('regression') || summaryLower.includes('drop')) {
      flags.push({
        severity: 'red',
        flag: 'Analytics concern',
        detail: finding.summary,
        country: code,
      })
    }
  }

  // Research freshness
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  for (const entry of researchResults) {
    if (new Date(entry.freshness_date) < sixtyDaysAgo) {
      flags.push({
        severity: 'info',
        flag: 'Research needs refresh',
        detail: `"${entry.topic}" last refreshed ${entry.freshness_date}`,
        country: code,
        recommendedAction: 'Run domain-expertise research to update',
      })
    }
  }

  // No PPP data at all
  if (pppHistory.length === 0) {
    flags.push({
      severity: 'info',
      flag: 'No PPP history',
      detail: `No PPP sections tagged with ${country.pppTags.join(', ')}`,
      country: code,
    })
  }

  return flags
}

// ─── Main ────────────────────────────────────────────────────

export async function run(opts: { country: string; topic?: string }): Promise<InvestigationResult> {
  const country = resolveCountry(opts.country)
  if (!country) {
    throw new Error(`Unknown country: "${opts.country}". Valid: UK, US, SG, UAE`)
  }

  console.log(`  Investigating ${country.name}${opts.topic ? ` (topic: ${opts.topic})` : ''}...`)
  const supabase = await getSupabase()

  // Gather all data in parallel
  const [pppHistory, analyticsResults, agentFindings, researchResults] = await Promise.all([
    getPppHistory(supabase, country),
    getAnalyticsTasks(supabase, country),
    getAgentFindings(supabase, country, opts.topic),
    getResearch(supabase, country, opts.topic),
  ])

  // Detect flags
  const flags = buildFlags(country, pppHistory, analyticsResults, agentFindings, researchResults)

  // Build open questions
  const openQuestions: string[] = []

  if (pppHistory.length === 0) {
    openQuestions.push(`No PPP data for ${country.name} — is this country tracked in the weekly deck?`)
  }

  if (analyticsResults.length === 0) {
    openQuestions.push(`No analytics results for ${country.name} — has a deep-dive been run?`)
  }

  if (researchResults.length === 0) {
    openQuestions.push(`No research for ${country.name} — is domain/regulatory research needed?`)
  }

  if (opts.topic && agentFindings.length === 0) {
    openQuestions.push(`No agent findings related to "${opts.topic}" for ${country.name}`)
  }

  // Build recommended actions
  const recommendedActions: string[] = []

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const hasRecentAnalytics = analyticsResults.some(
    t => t.completed_at && new Date(t.completed_at) > fourteenDaysAgo
  )

  if (!hasRecentAnalytics) {
    recommendedActions.push(`Run analytics deep-dive for ${country.name}: npx tsx analytics/run.ts deep-dive ${country.lookerName}`)
  }

  if (researchResults.length === 0) {
    recommendedActions.push(`Create domain-expertise research task for ${country.name} regulatory requirements`)
  }

  const redFlags = flags.filter(f => f.severity === 'red')
  if (redFlags.length > 0) {
    recommendedActions.push(`Escalate ${redFlags.length} red flag(s) to Yonatan for review`)
  }

  // Add recommended actions from flags
  for (const flag of flags) {
    if (flag.recommendedAction && !recommendedActions.includes(flag.recommendedAction)) {
      recommendedActions.push(flag.recommendedAction)
    }
  }

  // Trend analysis for summary
  const trends = analyzeTrends(pppHistory)

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push(`Investigation: ${country.name} (${country.code})`)
  if (opts.topic) summaryParts.push(`Topic: ${opts.topic}`)
  summaryParts.push('─'.repeat(40))

  summaryParts.push(`\nData available:`)
  summaryParts.push(`  PPP sections: ${pppHistory.length} (across ${new Set(pppHistory.map(s => s.week_date)).size} weeks)`)
  summaryParts.push(`  Analytics results: ${analyticsResults.length}`)
  summaryParts.push(`  Agent findings: ${agentFindings.length}`)
  summaryParts.push(`  Research entries: ${researchResults.length}`)

  if (trends.length > 0) {
    summaryParts.push(`\nTrends:`)
    for (const trend of trends) {
      summaryParts.push(`  [${trend.trend.toUpperCase()}] ${trend.details}`)
    }
  }

  if (flags.length > 0) {
    summaryParts.push(`\nFlags (${flags.length}):`)
    for (const flag of flags) {
      const icon = flag.severity === 'red' ? 'RED' : flag.severity === 'yellow' ? 'YLW' : 'INF'
      summaryParts.push(`  [${icon}] ${flag.flag} — ${flag.detail}`)
    }
  }

  if (openQuestions.length > 0) {
    summaryParts.push(`\nOpen questions:`)
    for (const q of openQuestions) {
      summaryParts.push(`  ? ${q}`)
    }
  }

  if (recommendedActions.length > 0) {
    summaryParts.push(`\nRecommended actions:`)
    for (const action of recommendedActions) {
      summaryParts.push(`  > ${action}`)
    }
  }

  const result: InvestigationResult = {
    summary: summaryParts.join('\n'),
    country: country.code,
    topic: opts.topic,
    pppHistory,
    analyticsResults,
    agentFindings,
    researchResults,
    flags,
    openQuestions,
    recommendedActions,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'hub-countries-pm',
    category: 'finding',
    summary: `Investigation: ${country.name}${opts.topic ? ` — ${opts.topic}` : ''} — ${flags.length} flags, ${openQuestions.length} open questions`,
    details: {
      country: country.code,
      topic: opts.topic ?? null,
      flagCount: flags.length,
      redFlags: flags.filter(f => f.severity === 'red').length,
      trends: trends.map(t => t.details),
      recommendedActions,
      openQuestions,
    } as any,
    tags: ['hub-countries-pm', 'investigation', country.code.toLowerCase()],
  })

  return result
}
