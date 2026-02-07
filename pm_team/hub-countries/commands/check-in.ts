/**
 * Hub Countries PM — Check-in Command
 *
 * Weekly routine: gathers PPP, analytics, research, and agent_log data
 * for all 4 hub countries. Flags issues and recommends actions.
 *
 * No LLM needed — pure SQL + flag detection + formatting.
 */

import { HUB_COUNTRIES, type HubCountry } from '../lib/country-config.js'
import type {
  AgentLogEntry,
  CheckInResult,
  CompletedAgentTask,
  CountryFlag,
  CountrySnapshot,
  PppSection,
  ResearchEntry,
} from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Data Gathering ──────────────────────────────────────────

async function getPppSections(supabase: any, country: HubCountry): Promise<PppSection[]> {
  const { data, error } = await supabase
    .from('v_ppp_swimlanes' as any)
    .select('section_id, report_id, week_date, workstream_name, lead_name, lead_slug, status, quality_score, quality_notes, summary, raw_text, tags, contributors')
    .overlaps('tags', country.pppTags)
    .order('week_date', { ascending: false })
    .limit(10)

  if (error) {
    console.error(`[check-in] PPP query failed for ${country.code}:`, error.message)
    return []
  }

  return (data || []) as unknown as PppSection[]
}

async function getAnalyticsFindings(supabase: any, country: HubCountry): Promise<AgentLogEntry[]> {
  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .eq('agent_slug', 'analytics')
    .overlaps('tags', country.logTags)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error(`[check-in] Analytics log query failed for ${country.code}:`, error.message)
    return []
  }

  return (data || []) as unknown as AgentLogEntry[]
}

async function getAnalyticsTasks(supabase: any, country: HubCountry): Promise<CompletedAgentTask[]> {
  // Search completed analytics tasks mentioning this country
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags')
    .eq('status', 'done')
    .eq('picked_up_by', 'analytics')
    .order('completed_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error(`[check-in] Analytics tasks query failed for ${country.code}:`, error.message)
    return []
  }

  // Filter client-side: description or title mentions this country
  const tasks = (data || []) as unknown as CompletedAgentTask[]
  const lower = [country.lookerName.toLowerCase(), country.code.toLowerCase()]

  return tasks.filter(t => {
    const desc = (t.description ?? '').toLowerCase()
    const title = t.title.toLowerCase()
    return lower.some(term => desc.includes(term) || title.includes(term))
  }).slice(0, 3)
}

async function getResearch(supabase: any, country: HubCountry): Promise<ResearchEntry[]> {
  const { data, error } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .overlaps('tags', country.logTags)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`[check-in] Research query failed for ${country.code}:`, error.message)
    return []
  }

  return (data || []) as unknown as ResearchEntry[]
}

async function getRecentActivity(supabase: any, country: HubCountry): Promise<AgentLogEntry[]> {
  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .overlaps('tags', country.logTags)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error(`[check-in] Activity query failed for ${country.code}:`, error.message)
    return []
  }

  return (data || []) as unknown as AgentLogEntry[]
}

// ─── Flag Detection ──────────────────────────────────────────

function detectFlags(country: HubCountry, snapshot: Omit<CountrySnapshot, 'flags'>): CountryFlag[] {
  const flags: CountryFlag[] = []
  const code = country.code

  // PPP status regression: compare latest 2 weeks
  const weekDates = [...new Set(snapshot.ppp.sections.map(s => s.week_date))].sort().reverse()
  if (weekDates.length >= 2) {
    const currentWeek = snapshot.ppp.sections.filter(s => s.week_date === weekDates[0])
    const previousWeek = snapshot.ppp.sections.filter(s => s.week_date === weekDates[1])

    for (const curr of currentWeek) {
      const prev = previousWeek.find(p => p.workstream_name === curr.workstream_name)
      if (prev && prev.status === 'on-track' && curr.status === 'at-risk') {
        flags.push({
          severity: 'red',
          flag: 'PPP status regression',
          detail: `"${curr.workstream_name}" went from on-track to at-risk (${prev.week_date} → ${curr.week_date})`,
          country: code,
          recommendedAction: 'Review the workstream and check with the lead for root cause',
        })
      }
    }
  }

  // PPP at-risk or potential-issues (latest week only)
  const latestWeek = weekDates[0]
  const latestSections = latestWeek ? snapshot.ppp.sections.filter(s => s.week_date === latestWeek) : []

  for (const section of latestSections) {
    if (section.status === 'at-risk') {
      flags.push({
        severity: 'yellow',
        flag: 'PPP at-risk',
        detail: `"${section.workstream_name}" is at-risk (week ${section.week_date})`,
        country: code,
      })
    } else if (section.status === 'potential-issues') {
      flags.push({
        severity: 'yellow',
        flag: 'PPP potential issues',
        detail: `"${section.workstream_name}" has potential issues (week ${section.week_date})`,
        country: code,
      })
    }
  }

  // Low quality PPP
  for (const section of latestSections) {
    if (section.quality_score != null && section.quality_score <= 2) {
      flags.push({
        severity: 'yellow',
        flag: 'Low quality PPP',
        detail: `"${section.workstream_name}" quality score ${section.quality_score}/5: ${section.quality_notes ?? 'no notes'}`,
        country: code,
        recommendedAction: 'Consider coaching the lead on PPP quality expectations',
      })
    }
  }

  // No PPP coverage
  if (snapshot.ppp.sections.length === 0) {
    flags.push({
      severity: 'info',
      flag: 'No PPP coverage',
      detail: `No PPP sections tagged with ${country.pppTags.join(', ')}`,
      country: code,
    })
  }

  // Stale analytics
  if (snapshot.analytics.dataStale) {
    flags.push({
      severity: 'yellow',
      flag: 'Stale analytics',
      detail: `No analytics analysis for ${code} in last 14 days`,
      country: code,
      recommendedAction: `Create an analytics task: deep-dive for ${country.name}`,
    })
  }

  // Analytics RED/YELLOW flags
  for (const finding of snapshot.analytics.recentFindings) {
    const summaryLower = (finding.summary ?? '').toLowerCase()
    const tagsLower = (finding.tags ?? []).map(t => t.toLowerCase())
    const all = [...tagsLower, summaryLower]

    if (all.some(s => s.includes('red'))) {
      flags.push({
        severity: 'red',
        flag: 'Analytics RED flag',
        detail: finding.summary,
        country: code,
        recommendedAction: 'Investigate the analytics finding immediately',
      })
    } else if (all.some(s => s.includes('yellow') || s.includes('warning'))) {
      flags.push({
        severity: 'yellow',
        flag: 'Analytics warning',
        detail: finding.summary,
        country: code,
      })
    }
  }

  // Research aging
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  for (const entry of snapshot.research.entries) {
    if (new Date(entry.freshness_date) < sixtyDaysAgo) {
      flags.push({
        severity: 'info',
        flag: 'Research aging',
        detail: `"${entry.topic}" last refreshed ${entry.freshness_date}`,
        country: code,
        recommendedAction: 'Consider refreshing this research via domain-expertise agent',
      })
    }
  }

  return flags
}

// ─── Main ────────────────────────────────────────────────────

export async function run(opts: { days?: number } = {}): Promise<CheckInResult> {
  const supabase = await getSupabase()
  const countries: CountrySnapshot[] = []
  const allFlags: CountryFlag[] = []

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  for (const country of HUB_COUNTRIES) {
    console.log(`  Checking ${country.name}...`)

    // Gather all data in parallel
    const [pppSections, analyticsFindings, analyticsTasks, research, recentActivity] = await Promise.all([
      getPppSections(supabase, country),
      getAnalyticsFindings(supabase, country),
      getAnalyticsTasks(supabase, country),
      getResearch(supabase, country),
      getRecentActivity(supabase, country),
    ])

    // Determine if analytics data is stale
    const lastAnalysisDate = analyticsTasks.length > 0 ? analyticsTasks[0].completed_at : null
    const dataStale = !lastAnalysisDate || new Date(lastAnalysisDate) < fourteenDaysAgo

    // Build PPP status summary
    const latestWeek = [...new Set(pppSections.map(s => s.week_date))].sort().reverse()[0]
    const latestSections = latestWeek ? pppSections.filter(s => s.week_date === latestWeek) : []
    const statusCounts = new Map<string, number>()
    for (const s of latestSections) {
      const st = s.status ?? 'unknown'
      statusCounts.set(st, (statusCounts.get(st) ?? 0) + 1)
    }
    const statusSummary = latestSections.length === 0
      ? 'No PPP data'
      : [...statusCounts.entries()].map(([s, c]) => `${c} ${s}`).join(', ')

    const snapshotData = {
      country,
      ppp: { sections: pppSections, statusSummary },
      analytics: {
        lastAnalysis: lastAnalysisDate,
        recentFindings: analyticsFindings,
        dataStale,
      },
      research: { entries: research },
      recentActivity,
    }

    const flags = detectFlags(country, snapshotData)
    const snapshot: CountrySnapshot = { ...snapshotData, flags }

    countries.push(snapshot)
    allFlags.push(...flags)
  }

  // Sort flags: red first, then yellow, then info
  const severityOrder = { red: 0, yellow: 1, info: 2 }
  allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Stats
  const stats = {
    countriesChecked: countries.length,
    redFlags: allFlags.filter(f => f.severity === 'red').length,
    yellowFlags: allFlags.filter(f => f.severity === 'yellow').length,
    staleData: countries.filter(c => c.analytics.dataStale).length,
  }

  // Cross-country recommendations
  const recommendations: string[] = []

  if (stats.staleData > 0) {
    const staleCountries = countries.filter(c => c.analytics.dataStale).map(c => c.country.code)
    recommendations.push(`Analytics data is stale for ${staleCountries.join(', ')} — consider running deep-dive analyses`)
  }

  if (stats.redFlags > 0) {
    recommendations.push(`${stats.redFlags} red flag(s) require immediate attention`)
  }

  // Check for countries with no PPP coverage at all
  const noPpp = countries.filter(c => c.ppp.sections.length === 0)
  if (noPpp.length > 0) {
    recommendations.push(`No PPP data for ${noPpp.map(c => c.country.code).join(', ')} — check if these countries have dedicated workstreams`)
  }

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push('Hub Countries Weekly Check-in')
  summaryParts.push('─'.repeat(40))

  for (const snapshot of countries) {
    const flagCounts = {
      red: snapshot.flags.filter(f => f.severity === 'red').length,
      yellow: snapshot.flags.filter(f => f.severity === 'yellow').length,
    }
    const flagStr = flagCounts.red > 0 || flagCounts.yellow > 0
      ? ` [${flagCounts.red} RED, ${flagCounts.yellow} YELLOW]`
      : ' [clean]'

    summaryParts.push(`\n${snapshot.country.code} (${snapshot.country.name})${flagStr}`)
    summaryParts.push(`  PPP: ${snapshot.ppp.statusSummary}`)
    summaryParts.push(`  Analytics: ${snapshot.analytics.dataStale ? 'STALE' : 'recent'} (last: ${snapshot.analytics.lastAnalysis?.slice(0, 10) ?? 'never'})`)
    summaryParts.push(`  Research: ${snapshot.research.entries.length} current entries`)
  }

  if (allFlags.length > 0) {
    summaryParts.push('\n' + '─'.repeat(40))
    summaryParts.push('Flags:')
    for (const flag of allFlags) {
      const icon = flag.severity === 'red' ? 'RED' : flag.severity === 'yellow' ? 'YLW' : 'INF'
      summaryParts.push(`  [${icon}] ${flag.country}: ${flag.flag} — ${flag.detail}`)
    }
  }

  if (recommendations.length > 0) {
    summaryParts.push('\nRecommendations:')
    for (const rec of recommendations) {
      summaryParts.push(`  - ${rec}`)
    }
  }

  summaryParts.push(`\nStats: ${stats.countriesChecked} countries, ${stats.redFlags} red, ${stats.yellowFlags} yellow, ${stats.staleData} stale`)

  const result: CheckInResult = {
    summary: summaryParts.join('\n'),
    countries,
    flags: allFlags,
    recommendations,
    stats,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  const hasFlags = stats.redFlags > 0 || stats.yellowFlags > 0

  await logAgent({
    agentSlug: 'hub-countries-pm',
    category: stats.redFlags > 0 ? 'finding' : hasFlags ? 'observation' : 'observation',
    summary: `Weekly check-in: ${stats.redFlags} red flags, ${stats.yellowFlags} yellow flags across hub countries`,
    details: {
      stats,
      flags: allFlags.map(f => ({ severity: f.severity, flag: f.flag, country: f.country })),
      recommendations,
    } as any,
    tags: [
      'hub-countries-pm',
      'check-in',
      ...countries.filter(c => c.flags.length > 0).map(c => c.country.code.toLowerCase()),
    ],
  })

  // Escalate RED flags
  if (stats.redFlags > 0) {
    const { createTask } = await import('../../../lib/tasks.js')
    const redFlags = allFlags.filter(f => f.severity === 'red')
    const countriesWithRed = [...new Set(redFlags.map(f => f.country))]

    await createTask({
      title: `[ACTION NEEDED] Hub country red flags: ${countriesWithRed.join(', ')}`,
      description: JSON.stringify({
        type: 'check-in-escalation',
        flags: redFlags,
        source: 'hub-countries-pm check-in',
      }),
      priority: 'high',
      createdBy: 'agent:hub-countries-pm',
      tags: ['needs-human', 'hub-countries-pm', ...countriesWithRed.map(c => c.toLowerCase())],
    })
  }

  return result
}
