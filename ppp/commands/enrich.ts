/**
 * PPP Enrich Command
 *
 * Phase 3 enrichment: week-over-week diff, cross-swimlane patterns,
 * and cross-reference with current_focus.
 */

import type { EnrichResult, StatusChange, DispatchedTask, SemanticInsight } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

interface WeekComparison {
  workstream_name: string
  current_status: string | null
  previous_status: string | null
  current_quality_score: number | null
  previous_quality_score: number | null
  current_lead_name: string | null
  previous_lead_name: string | null
  current_summary: string | null
  previous_summary: string | null
  current_tags: string[] | null
  previous_tags: string[] | null
}

interface SwimlaneRow {
  workstream_name: string
  lead_name: string | null
  status: string | null
  quality_score: number | null
  summary: string | null
  tags: string[] | null
  week_date: string
}

export async function run(options: { week?: string } = {}): Promise<EnrichResult> {
  const supabase = await getSupabase()

  // Get the target week (latest if not specified)
  let weekDate: string
  if (options.week) {
    weekDate = options.week
  } else {
    const { data: latest } = await supabase
      .from('ppp_reports')
      .select('week_date')
      .order('week_date', { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return emptyResult('No PPP reports found')
    }
    weekDate = (latest as any).week_date
  }

  // Get the two most recent weeks for comparison
  const { data: recentReports } = await supabase
    .from('ppp_reports')
    .select('week_date')
    .lte('week_date', weekDate)
    .order('week_date', { ascending: false })
    .limit(2)

  const reports = (recentReports || []) as unknown as Array<{ week_date: string }>
  const currentWeek = reports[0]?.week_date
  const previousWeek = reports[1]?.week_date ?? null

  if (!currentWeek) {
    return emptyResult(`No report found for ${weekDate}`)
  }

  // Load current week swimlanes
  const { data: currentData } = await supabase
    .from('v_ppp_swimlanes' as any)
    .select('workstream_name, lead_name, status, quality_score, summary, tags, week_date')
    .eq('week_date', currentWeek)

  const currentSwimlanes = (currentData || []) as unknown as SwimlaneRow[]

  // Load previous week swimlanes (if exists)
  let previousSwimlanes: SwimlaneRow[] = []
  if (previousWeek) {
    const { data: prevData } = await supabase
      .from('v_ppp_swimlanes' as any)
      .select('workstream_name, lead_name, status, quality_score, summary, tags, week_date')
      .eq('week_date', previousWeek)

    previousSwimlanes = (prevData || []) as unknown as SwimlaneRow[]
  }

  // Load current_focus
  const { data: focusData } = await supabase
    .from('context_store')
    .select('content')
    .eq('key', 'current_focus')
    .single()

  const currentFocus = (focusData as any)?.content as string | null

  // ─── Week-over-week diff ───────────────────────────────────

  const currentNames = new Set(currentSwimlanes.map(s => s.workstream_name))
  const previousNames = new Set(previousSwimlanes.map(s => s.workstream_name))

  const newWorkstreams = [...currentNames].filter(n => !previousNames.has(n))
  const droppedWorkstreams = [...previousNames].filter(n => !currentNames.has(n))

  const prevByName = new Map(previousSwimlanes.map(s => [s.workstream_name, s]))

  const statusChanges: StatusChange[] = []
  const scoreChanges: Array<{ workstream: string; from: number; to: number }> = []
  const leadChanges: Array<{ workstream: string; from: string | null; to: string | null }> = []

  for (const curr of currentSwimlanes) {
    const prev = prevByName.get(curr.workstream_name)
    if (!prev) continue

    if (prev.status && curr.status && prev.status !== curr.status) {
      statusChanges.push({ workstream: curr.workstream_name, from: prev.status, to: curr.status })
    }

    if (prev.quality_score != null && curr.quality_score != null && prev.quality_score !== curr.quality_score) {
      scoreChanges.push({ workstream: curr.workstream_name, from: prev.quality_score, to: curr.quality_score })
    }

    if (prev.lead_name !== curr.lead_name) {
      leadChanges.push({ workstream: curr.workstream_name, from: prev.lead_name, to: curr.lead_name })
    }
  }

  // ─── Cross-swimlane patterns ───────────────────────────────

  const tagCounts = new Map<string, string[]>()
  for (const s of currentSwimlanes) {
    for (const tag of s.tags || []) {
      if (!tagCounts.has(tag)) tagCounts.set(tag, [])
      tagCounts.get(tag)!.push(s.workstream_name)
    }
  }

  const crossSwimLanePatterns: string[] = []
  for (const [tag, workstreams] of tagCounts) {
    if (workstreams.length >= 2) {
      crossSwimLanePatterns.push(`"${tag}" appears in ${workstreams.length} workstreams: ${workstreams.join(', ')}`)
    }
  }

  // ─── Semantic search for at-risk/deteriorating workstreams ──

  const semanticInsights: SemanticInsight[] = []
  const searchTopics = [
    ...statusChanges.filter(c => c.to === 'at-risk' || c.to === 'potential-issues').map(c => c.workstream),
    ...currentSwimlanes.filter(s => s.status === 'at-risk').map(s => s.workstream_name),
  ]
  if (searchTopics.length > 0) {
    try {
      const { searchByType } = await import('../../lib/embeddings.js')
      for (const topic of [...new Set(searchTopics)].slice(0, 3)) {
        const results = await searchByType(`${topic} CLM blockers issues`, ['agent_log', 'playbook'], { threshold: 0.72, limit: 3 })
        semanticInsights.push(...results.map(r => ({ ...r, workstream: topic })))
      }
    } catch {}
  }

  // ─── Context cross-reference ───────────────────────────────

  const contextAlignment: string[] = []
  const contextGaps: string[] = []
  const newSignals: string[] = []

  if (currentFocus) {
    const focusLower = typeof currentFocus === 'string'
      ? currentFocus.toLowerCase()
      : JSON.stringify(currentFocus).toLowerCase()

    // Check for at-risk items that may need current_focus attention
    const atRiskItems = currentSwimlanes.filter(s => s.status === 'at-risk')
    for (const item of atRiskItems) {
      const nameInFocus = focusLower.includes(item.workstream_name.toLowerCase())
      if (nameInFocus) {
        contextAlignment.push(`${item.workstream_name} is at-risk and tracked in current_focus`)
      } else {
        newSignals.push(`${item.workstream_name} is at-risk but not in current_focus — consider adding`)
      }
    }

    // Check status deteriorations
    for (const change of statusChanges) {
      const worsened = (
        (change.from === 'on-track' && change.to !== 'on-track') ||
        (change.from === 'potential-issues' && change.to === 'at-risk')
      )
      if (worsened) {
        newSignals.push(`${change.workstream} deteriorated: ${change.from} → ${change.to}`)
      }
    }
  }

  // ─── Smart Dispatcher ───────────────────────────────────────
  // Create agent_tasks only when enrichment detects something
  // worth a PM agent's attention.

  const dispatched: DispatchedTask[] = []

  // Hub Countries PM: trigger on hub country status deterioration or at-risk
  const HUB_COUNTRY_TAGS = ['uk', 'usa', 'singapore', 'uae']

  for (const change of statusChanges) {
    const worsened = (
      (change.from === 'on-track' && change.to !== 'on-track') ||
      (change.from === 'potential-issues' && change.to === 'at-risk')
    )
    if (!worsened) continue

    // Check if this workstream has hub country tags
    const swimlane = currentSwimlanes.find(s => s.workstream_name === change.workstream)
    const hubTags = (swimlane?.tags || []).filter(t => HUB_COUNTRY_TAGS.includes(t))

    for (const tag of hubTags) {
      const countryCode = { uk: 'UK', usa: 'US', singapore: 'SG', uae: 'UAE' }[tag]
      if (!countryCode) continue

      dispatched.push({
        target_agent: 'hub-countries-pm',
        title: `Investigate ${countryCode}: ${change.workstream} deteriorated to ${change.to}`,
        description: JSON.stringify({
          type: 'investigate',
          country: countryCode,
          topic: `${change.workstream} status changed from ${change.from} to ${change.to} in PPP ${currentWeek}`,
        }),
        priority: change.to === 'at-risk' ? 'high' : 'normal',
        reason: `${change.workstream} deteriorated (${change.from} → ${change.to}), tagged with ${tag}`,
      })
    }
  }

  // Hub Countries PM: at-risk swimlanes with hub country tags (even without a status change)
  for (const swimlane of currentSwimlanes) {
    if (swimlane.status !== 'at-risk') continue
    // Skip if we already dispatched for this workstream via status change
    const alreadyDispatched = dispatched.some(
      d => d.target_agent === 'hub-countries-pm' && d.title.includes(swimlane.workstream_name)
    )
    if (alreadyDispatched) continue

    const hubTags = (swimlane.tags || []).filter(t => HUB_COUNTRY_TAGS.includes(t))
    for (const tag of hubTags) {
      const countryCode = { uk: 'UK', usa: 'US', singapore: 'SG', uae: 'UAE' }[tag]
      if (!countryCode) continue

      // Only dispatch if this is newly at-risk (wasn't at-risk last week)
      const prev = prevByName.get(swimlane.workstream_name)
      if (prev?.status === 'at-risk') continue // persistent at-risk, don't re-trigger

      dispatched.push({
        target_agent: 'hub-countries-pm',
        title: `Investigate ${countryCode}: ${swimlane.workstream_name} is at-risk`,
        description: JSON.stringify({
          type: 'investigate',
          country: countryCode,
          topic: `${swimlane.workstream_name} flagged at-risk in PPP ${currentWeek}`,
        }),
        priority: 'high',
        reason: `${swimlane.workstream_name} newly at-risk, tagged with ${tag}`,
      })
    }
  }

  // Team Lead: synthesize when there are multiple at-risk or many status changes
  const atRiskCount = currentSwimlanes.filter(s => s.status === 'at-risk').length
  const deteriorations = statusChanges.filter(c =>
    (c.from === 'on-track' && c.to !== 'on-track') ||
    (c.from === 'potential-issues' && c.to === 'at-risk')
  )

  if (atRiskCount >= 3 || deteriorations.length >= 3) {
    dispatched.push({
      target_agent: 'team-lead',
      title: `PPP ${currentWeek}: ${atRiskCount} at-risk, ${deteriorations.length} deteriorations — synthesize`,
      description: JSON.stringify({ type: 'synthesize', days: 7 }),
      priority: 'high',
      reason: `${atRiskCount} at-risk workstreams and ${deteriorations.length} deteriorations warrant synthesis`,
    })
  }

  // KYC Product PM: vendor landscape shifts (3+ workstreams mentioning vendor tags)
  const vendorTags = ['persona', 'trulioo', 'au10tix', 'uipath', 'sumsub', 'applause', 'hyperverge']
  const vendorMentions = new Set<string>()
  for (const s of currentSwimlanes) {
    if ((s.tags || []).some(t => vendorTags.includes(t))) {
      vendorMentions.add(s.workstream_name)
    }
  }
  // Only trigger if vendor landscape looks unusually active (4+ workstreams)
  if (vendorMentions.size >= 4) {
    dispatched.push({
      target_agent: 'kyc-product-pm',
      title: `PPP ${currentWeek}: vendor activity across ${vendorMentions.size} workstreams`,
      description: JSON.stringify({
        type: 'research',
        topic: 'competitive-landscape',
      }),
      priority: 'normal',
      reason: `Vendor tags in ${vendorMentions.size} workstreams: ${[...vendorMentions].join(', ')}`,
    })
  }

  // Write dispatched tasks to agent_tasks
  if (dispatched.length > 0) {
    const { createTask } = await import('../../lib/tasks.js')
    for (const task of dispatched) {
      await createTask({
        title: task.title,
        description: task.description,
        targetAgent: task.target_agent,
        priority: task.priority,
        createdBy: 'agent:ppp-ingest',
        tags: ['ppp-dispatch', currentWeek],
      })
    }
  }

  // ─── Build summary ─────────────────────────────────────────

  const parts: string[] = []
  parts.push(`PPP Enrichment: ${currentWeek}${previousWeek ? ` vs ${previousWeek}` : ' (no previous week)'}`)
  parts.push(`Workstreams: ${currentSwimlanes.length}`)

  if (newWorkstreams.length) parts.push(`New: ${newWorkstreams.join(', ')}`)
  if (droppedWorkstreams.length) parts.push(`Dropped: ${droppedWorkstreams.join(', ')}`)

  if (statusChanges.length) {
    parts.push('Status changes:')
    for (const c of statusChanges) parts.push(`  ${c.workstream}: ${c.from} → ${c.to}`)
  }

  if (scoreChanges.length) {
    parts.push('Quality score changes:')
    for (const c of scoreChanges) parts.push(`  ${c.workstream}: ${c.from} → ${c.to}`)
  }

  if (crossSwimLanePatterns.length) {
    parts.push('Cross-swimlane patterns:')
    for (const p of crossSwimLanePatterns) parts.push(`  ${p}`)
  }

  if (newSignals.length) {
    parts.push('New signals:')
    for (const s of newSignals) parts.push(`  ${s}`)
  }

  if (contextAlignment.length) {
    parts.push('Context alignment:')
    for (const a of contextAlignment) parts.push(`  ${a}`)
  }

  if (contextGaps.length) {
    parts.push('Context gaps:')
    for (const g of contextGaps) parts.push(`  ${g}`)
  }

  if (semanticInsights.length > 0) {
    parts.push(`Semantic insights (${semanticInsights.length}):`)
    for (const si of semanticInsights.slice(0, 5)) {
      parts.push(`  [${si.entity_type}] ${si.workstream}: ${si.chunk_text.slice(0, 120)}...`)
    }
  }

  if (dispatched.length) {
    parts.push(`Dispatched ${dispatched.length} task(s) to PM agents:`)
    for (const d of dispatched) parts.push(`  → ${d.target_agent}: ${d.reason}`)
  }

  return {
    week_date: currentWeek,
    previous_week_date: previousWeek,
    new_workstreams: newWorkstreams,
    dropped_workstreams: droppedWorkstreams,
    status_changes: statusChanges,
    score_changes: scoreChanges,
    lead_changes: leadChanges,
    cross_swimlane_patterns: crossSwimLanePatterns,
    context_alignment: contextAlignment,
    context_gaps: contextGaps,
    new_signals: newSignals,
    dispatched_tasks: dispatched,
    semantic_insights: semanticInsights.length > 0 ? semanticInsights : undefined,
    summary: parts.join('\n'),
  }
}

function emptyResult(message: string): EnrichResult {
  return {
    week_date: '',
    previous_week_date: null,
    new_workstreams: [],
    dropped_workstreams: [],
    status_changes: [],
    score_changes: [],
    lead_changes: [],
    cross_swimlane_patterns: [],
    context_alignment: [],
    context_gaps: [],
    new_signals: [],
    dispatched_tasks: [],
    summary: message,
  }
}
