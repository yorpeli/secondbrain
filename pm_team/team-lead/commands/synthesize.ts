/**
 * Team Lead — Synthesize Command
 *
 * Reads recent agent_log entries and completed agent_tasks across all agents,
 * identifies cross-cutting themes, contradictions, gaps, and recommendations.
 *
 * This is the LLM-intensive command — data fetching is here,
 * but the intelligence is in how it's presented and interpreted.
 * For now, synthesis is done programmatically (pattern detection).
 * LLM integration can be added later via the Task tool pattern.
 */

import type { AgentLogEntry, CompletedTask, SynthesizeResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(opts: { days?: number; agents?: string[] } = {}): Promise<SynthesizeResult> {
  const days = opts.days ?? 7
  const supabase = await getSupabase()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffISO = cutoff.toISOString()

  // Fetch recent agent_log entries
  let logQuery = supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .gte('created_at', cutoffISO)
    .order('created_at', { ascending: false })

  const { data: logData, error: logError } = await logQuery

  if (logError) {
    throw new Error(`Failed to query agent_log: ${logError.message}`)
  }

  let logEntries = (logData || []) as unknown as AgentLogEntry[]

  // Filter by agents if specified
  if (opts.agents && opts.agents.length > 0) {
    logEntries = logEntries.filter(e => opts.agents!.includes(e.agent_slug))
  }

  // Fetch recently completed tasks
  const { data: taskData, error: taskError } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, target_agent, picked_up_by, result_summary, result_details, completed_at, tags')
    .eq('status', 'done')
    .gte('completed_at', cutoffISO)
    .order('completed_at', { ascending: false })

  if (taskError) {
    throw new Error(`Failed to query agent_tasks: ${taskError.message}`)
  }

  const completedTasks = (taskData || []) as unknown as CompletedTask[]

  // ─── Analysis ──────────────────────────────────────────────

  // Group log entries by agent
  const byAgent = new Map<string, AgentLogEntry[]>()
  for (const entry of logEntries) {
    const list = byAgent.get(entry.agent_slug) || []
    list.push(entry)
    byAgent.set(entry.agent_slug, list)
  }

  const agentsCovered = [...byAgent.keys()]

  // Collect all tags for theme detection
  const tagCounts = new Map<string, number>()
  for (const entry of logEntries) {
    for (const tag of entry.tags ?? []) {
      // Skip meta tags
      if (['finding', 'recommendation', 'error', 'observation'].includes(tag)) continue
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }

  // Themes = tags that appear more than once across entries
  const themes = [...tagCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `${tag} (${count} mentions)`)

  // Check for registered agents with no recent activity
  const { data: registryData } = await supabase
    .from('agent_registry' as any)
    .select('slug, name, status')
    .eq('status', 'active')

  const activeAgents = (registryData || []) as unknown as Array<{ slug: string; name: string }>
  const gaps: string[] = []

  for (const agent of activeAgents) {
    if (!byAgent.has(agent.slug)) {
      gaps.push(`${agent.name} (${agent.slug}): no log entries in last ${days} days`)
    }
  }

  // Detect findings and recommendations
  const findings = logEntries.filter(e => e.category === 'finding')
  const recommendations = logEntries.filter(e => e.category === 'recommendation')
  const errors = logEntries.filter(e => e.category === 'error')

  // Build recommendations list
  const recs: string[] = []

  if (errors.length > 0) {
    const errorAgents = [...new Set(errors.map(e => e.agent_slug))]
    recs.push(`Investigate ${errors.length} error(s) from: ${errorAgents.join(', ')}`)
  }

  if (gaps.length > 0) {
    recs.push(`${gaps.length} active agent(s) had no log activity — check if they need tasks assigned`)
  }

  // Surface existing recommendations from agents
  for (const rec of recommendations) {
    recs.push(`[${rec.agent_slug}] ${rec.summary}`)
  }

  // ─── Build Result ──────────────────────────────────────────

  const summaryParts: string[] = []
  summaryParts.push(`Synthesis for last ${days} days:`)
  summaryParts.push(`  ${logEntries.length} log entries from ${agentsCovered.length} agent(s)`)
  summaryParts.push(`  ${completedTasks.length} tasks completed`)
  summaryParts.push(`  ${findings.length} findings, ${recommendations.length} recommendations, ${errors.length} errors`)

  if (themes.length > 0) {
    summaryParts.push(`\nTop themes: ${themes.slice(0, 5).join(', ')}`)
  }
  if (gaps.length > 0) {
    summaryParts.push(`\nGaps: ${gaps.length} agent(s) with no recent activity`)
  }
  if (recs.length > 0) {
    summaryParts.push(`\nRecommendations:`)
    for (const r of recs.slice(0, 10)) {
      summaryParts.push(`  - ${r}`)
    }
  }

  const result: SynthesizeResult = {
    summary: summaryParts.join('\n'),
    themes,
    gaps,
    recommendations: recs,
    details: {
      logEntriesAnalyzed: logEntries.length,
      tasksAnalyzed: completedTasks.length,
      agentsCovered,
      periodDays: days,
    },
  }

  // Log synthesis to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'team-lead',
    category: 'finding',
    summary: `Synthesis (${days}d): ${logEntries.length} entries, ${completedTasks.length} tasks, ${themes.length} themes, ${gaps.length} gaps, ${recs.length} recommendations`,
    details: {
      themes,
      gaps,
      recommendations: recs,
      agentsCovered,
    } as any,
    tags: ['team-lead', 'synthesis'],
  })

  return result
}
