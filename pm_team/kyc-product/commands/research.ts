/**
 * KYC Product PM — Research Command
 *
 * Orchestrates research on a specific topic. Checks what's already known,
 * identifies gaps, creates tasks for other agents or Yonatan, and reports status.
 *
 * This command does NOT do web research itself — it manages the research process
 * by coordinating competitive-analysis, domain-expertise, and human input.
 */

import { resolveWorkstream, WORKSTREAMS, PHASES, getPhaseWorkstreams } from '../lib/playbook-config.js'
import type {
  AgentLogEntry,
  CompletedAgentTask,
  ExistingResearch,
  KnowledgeGap,
  ResearchResult,
  ResearchStatusResult,
  WorkstreamStatus,
} from '../lib/types.js'

const AGENT_SLUG = 'kyc-product-pm'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Data Gathering ──────────────────────────────────────────

async function getExistingResearch(supabase: any, tags: string[]): Promise<ExistingResearch[]> {
  // Search by tags overlap OR by agent_slug
  const { data: byTags } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })

  const { data: byAgent } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .eq('agent_slug', AGENT_SLUG)
    .order('created_at', { ascending: false })

  // Merge and deduplicate
  const all = [...(byTags || []), ...(byAgent || [])] as unknown as ExistingResearch[]
  const seen = new Set<string>()
  return all.filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

async function getRelevantFindings(supabase: any, tags: string[]): Promise<AgentLogEntry[]> {
  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error(`[research] Agent log query failed:`, error.message)
    return []
  }

  return (data || []) as unknown as AgentLogEntry[]
}

async function getRelatedTasks(supabase: any, tags: string[]): Promise<{ completed: CompletedAgentTask[]; pending: CompletedAgentTask[] }> {
  // Completed tasks
  const { data: completed } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags, status, target_agent, created_by')
    .eq('status', 'done')
    .overlaps('tags', [...tags, AGENT_SLUG])
    .order('completed_at', { ascending: false })
    .limit(20)

  // Pending tasks created by this agent
  const { data: pending } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags, status, target_agent, created_by')
    .eq('created_by', `agent:${AGENT_SLUG}`)
    .in('status', ['pending', 'picked-up'])
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    completed: (completed || []) as unknown as CompletedAgentTask[],
    pending: (pending || []) as unknown as CompletedAgentTask[],
  }
}

// ─── Gap Analysis ───────────────────────────────────────────

function identifyGaps(
  workstream: typeof WORKSTREAMS[0],
  research: ExistingResearch[],
  findings: AgentLogEntry[],
  tasks: { completed: CompletedAgentTask[]; pending: CompletedAgentTask[] },
): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = []

  // Check if we need agent research and don't have it
  for (const agentSlug of workstream.requiredAgents) {
    const hasResearch = research.some(r => r.agent_slug === agentSlug)
    const hasCompletedTask = tasks.completed.some(t =>
      t.target_agent === agentSlug ||
      (t.tags ?? []).includes(agentSlug)
    )
    const hasPendingTask = tasks.pending.some(t =>
      t.target_agent === agentSlug
    )

    if (!hasResearch && !hasCompletedTask && !hasPendingTask) {
      gaps.push({
        area: workstream.id,
        description: `Need ${agentSlug} to research: ${workstream.description}`,
        source: 'agent',
        assignTo: agentSlug,
        priority: workstream.phase === 1 ? 'high' : 'normal',
      })
    }
  }

  // Check if we need human data
  for (const need of workstream.humanDataNeeded) {
    // Check if there's already a pending human task for this
    const alreadyRequested = tasks.pending.some(t =>
      (t.tags ?? []).includes('needs-human') &&
      t.title.toLowerCase().includes(workstream.id.replace(/-/g, ' '))
    )
    const alreadyAnswered = tasks.completed.some(t =>
      (t.tags ?? []).includes('needs-human') &&
      t.title.toLowerCase().includes(workstream.id.replace(/-/g, ' '))
    )

    if (!alreadyRequested && !alreadyAnswered) {
      gaps.push({
        area: workstream.id,
        description: need,
        source: 'human',
        assignTo: 'yonatan',
        priority: workstream.phase === 1 ? 'high' : 'normal',
      })
    }
  }

  return gaps
}

function estimateCompletion(
  research: ExistingResearch[],
  findings: AgentLogEntry[],
  tasks: { completed: CompletedAgentTask[]; pending: CompletedAgentTask[] },
  gaps: KnowledgeGap[],
): WorkstreamStatus['completionEstimate'] {
  const totalSignals = research.length + findings.length + tasks.completed.length
  const pendingCount = tasks.pending.length + gaps.length

  if (totalSignals === 0 && pendingCount === 0) return 'not-started'
  if (totalSignals === 0 && pendingCount > 0) return 'early'
  if (gaps.length > 0) return 'partial'
  if (totalSignals > 0 && gaps.length === 0 && tasks.pending.length === 0) return 'complete'
  return 'substantial'
}

// ─── Task Creation ──────────────────────────────────────────

async function createGapTasks(
  gaps: KnowledgeGap[],
  workstreamId: string,
): Promise<{ title: string; targetAgent: string | null; id: string | null }[]> {
  const { createTask } = await import('../../../lib/tasks.js')
  const created: { title: string; targetAgent: string | null; id: string | null }[] = []

  // Group human gaps into a single task
  const humanGaps = gaps.filter(g => g.source === 'human')
  if (humanGaps.length > 0) {
    const title = `[KYC-PRODUCT] Data needed: ${workstreamId.replace(/-/g, ' ')}`
    const id = await createTask({
      title,
      description: JSON.stringify({
        type: 'data-request',
        workstream: workstreamId,
        questions: humanGaps.map(g => g.description),
        source: AGENT_SLUG,
      }),
      priority: humanGaps.some(g => g.priority === 'high') ? 'high' : 'normal',
      createdBy: `agent:${AGENT_SLUG}`,
      tags: ['needs-human', AGENT_SLUG, 'kyc-as-a-service', workstreamId],
    })

    created.push({ title, targetAgent: null, id })
    for (const gap of humanGaps) {
      gap.taskCreated = true
      gap.taskId = id ?? undefined
    }
  }

  // Create individual tasks for agent research
  const agentGaps = gaps.filter(g => g.source === 'agent')
  for (const gap of agentGaps) {
    const title = `[KYC-PRODUCT] Research: ${gap.description.slice(0, 80)}`
    const id = await createTask({
      title,
      description: JSON.stringify({
        type: gap.assignTo === 'competitive-analysis' ? 'competitive-analysis' : 'domain-research',
        topic: `KYC-as-a-Service: ${workstreamId.replace(/-/g, ' ')}`,
        context: `Research for KYC Product PM agent, workstream: ${workstreamId}`,
        source: AGENT_SLUG,
      }),
      targetAgent: gap.assignTo,
      priority: gap.priority,
      createdBy: `agent:${AGENT_SLUG}`,
      tags: [AGENT_SLUG, 'kyc-as-a-service', workstreamId, gap.assignTo],
    })

    created.push({ title, targetAgent: gap.assignTo, id })
    gap.taskCreated = true
    gap.taskId = id ?? undefined
  }

  return created
}

// ─── Status Report ──────────────────────────────────────────

export async function runStatus(): Promise<ResearchStatusResult> {
  const supabase = await getSupabase()
  const phases: ResearchStatusResult['phases'] = []
  const nextSteps: string[] = []

  for (const phase of PHASES.filter(p => p.workstreams.length > 0)) {
    const workstreams = getPhaseWorkstreams(phase.number)
    const wsStatuses: ResearchStatusResult['phases'][0]['workstreams'] = []

    for (const ws of workstreams) {
      const research = await getExistingResearch(supabase, ws.searchTags)
      const tasks = await getRelatedTasks(supabase, ws.searchTags)
      const gaps = identifyGaps(ws, research, [], tasks)
      const completion = estimateCompletion(research, [], tasks, gaps)

      wsStatuses.push({
        id: ws.id,
        name: ws.name,
        completion,
        researchCount: research.length,
        pendingTasks: tasks.pending.length,
        gaps: gaps.length,
      })
    }

    phases.push({ phase: phase.number, name: phase.name, workstreams: wsStatuses })
  }

  // Determine overall progress
  const allWorkstreams = phases.flatMap(p => p.workstreams)
  const notStarted = allWorkstreams.filter(w => w.completion === 'not-started').length
  const complete = allWorkstreams.filter(w => w.completion === 'complete').length
  const total = allWorkstreams.length

  let overallProgress: string
  if (complete === total) {
    overallProgress = 'All research workstreams complete'
  } else if (notStarted === total) {
    overallProgress = 'Not started — no research initiated yet'
  } else {
    overallProgress = `${complete}/${total} workstreams complete, ${notStarted} not started`
  }

  // Generate next steps
  const phase1 = phases.find(p => p.phase === 1)
  if (phase1) {
    const unstarted = phase1.workstreams.filter(w => w.completion === 'not-started')
    if (unstarted.length > 0) {
      nextSteps.push(`Start Phase 1 research: ${unstarted.map(w => w.id).join(', ')}`)
    }
    const withGaps = phase1.workstreams.filter(w => w.gaps > 0)
    if (withGaps.length > 0) {
      nextSteps.push(`Fill gaps in: ${withGaps.map(w => w.id).join(', ')}`)
    }
  }

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push('KYC Product PM — Research Status')
  summaryParts.push('═'.repeat(50))

  for (const phase of phases) {
    summaryParts.push(`\nPhase ${phase.phase}: ${phase.name}`)
    summaryParts.push('─'.repeat(40))

    for (const ws of phase.workstreams) {
      const icon = ws.completion === 'complete' ? 'DONE' :
        ws.completion === 'not-started' ? '----' :
        ws.completion === 'early' ? 'INIT' :
        ws.completion === 'partial' ? 'WIP ' : 'GOOD'
      summaryParts.push(`  [${icon}] ${ws.name} — ${ws.researchCount} research, ${ws.pendingTasks} pending, ${ws.gaps} gaps`)
    }
  }

  summaryParts.push(`\n${'═'.repeat(50)}`)
  summaryParts.push(`Overall: ${overallProgress}`)

  if (nextSteps.length > 0) {
    summaryParts.push(`\nNext steps:`)
    for (const step of nextSteps) {
      summaryParts.push(`  > ${step}`)
    }
  }

  return {
    summary: summaryParts.join('\n'),
    phases,
    overallProgress,
    nextSteps,
  }
}

// ─── Main ───────────────────────────────────────────────────

export async function run(opts: { topic: string; phase?: number }): Promise<ResearchResult | ResearchStatusResult> {
  // Handle status request
  if (opts.topic === 'status') {
    const result = await runStatus()

    // Log to agent_log
    const { logAgent } = await import('../../../lib/logging.js')
    await logAgent({
      agentSlug: AGENT_SLUG,
      category: 'observation',
      summary: `Research status check: ${result.overallProgress}`,
      details: {
        phases: result.phases,
        nextSteps: result.nextSteps,
      } as any,
      tags: [AGENT_SLUG, 'kyc-as-a-service', 'status'],
    })

    return result
  }

  // Resolve topic to a workstream
  const workstream = resolveWorkstream(opts.topic)
  if (!workstream) {
    const validTopics = WORKSTREAMS.map(w => w.id).join(', ')
    throw new Error(`Unknown research topic: "${opts.topic}". Valid topics: ${validTopics}, status`)
  }

  console.log(`  Researching: ${workstream.name} (Phase ${workstream.phase})...`)
  const supabase = await getSupabase()

  // Gather existing knowledge
  const [research, findings, tasks] = await Promise.all([
    getExistingResearch(supabase, workstream.searchTags),
    getRelevantFindings(supabase, workstream.searchTags),
    getRelatedTasks(supabase, workstream.searchTags),
  ])

  console.log(`  Found: ${research.length} research, ${findings.length} findings, ${tasks.completed.length} completed tasks, ${tasks.pending.length} pending`)

  // Identify gaps
  const gaps = identifyGaps(workstream, research, findings, tasks)
  console.log(`  Gaps identified: ${gaps.length}`)

  // Create tasks for gaps
  let tasksCreated: { title: string; targetAgent: string | null; id: string | null }[] = []
  if (gaps.length > 0) {
    tasksCreated = await createGapTasks(gaps, workstream.id)
    console.log(`  Tasks created: ${tasksCreated.length}`)
  }

  // Estimate completion
  const completionEstimate = estimateCompletion(research, findings, tasks, gaps)

  // Build recommendations
  const recommendations: string[] = []

  if (gaps.filter(g => g.source === 'human').length > 0) {
    recommendations.push('Human data requests created — follow up with Yonatan')
  }
  if (gaps.filter(g => g.source === 'agent').length > 0) {
    recommendations.push(`Agent research tasks created — run check-tasks on: ${Array.from(new Set(gaps.filter(g => g.source === 'agent').map(g => g.assignTo))).join(', ')}`)
  }
  if (completionEstimate === 'complete') {
    recommendations.push('Workstream has sufficient data — consider running synthesize')
  }
  if (tasks.pending.length > 0) {
    recommendations.push(`${tasks.pending.length} tasks still pending — data collection in progress`)
  }

  const workstreamStatus: WorkstreamStatus = {
    workstream,
    existingResearch: research,
    relevantFindings: findings,
    completedTasks: tasks.completed,
    pendingTasks: tasks.pending,
    gaps,
    completionEstimate,
  }

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push(`Research: ${workstream.name} (Phase ${workstream.phase})`)
  summaryParts.push('─'.repeat(40))
  summaryParts.push(`Completion: ${completionEstimate.toUpperCase()}`)

  summaryParts.push(`\nExisting knowledge:`)
  summaryParts.push(`  Research entries: ${research.length}`)
  summaryParts.push(`  Agent findings: ${findings.length}`)
  summaryParts.push(`  Completed tasks: ${tasks.completed.length}`)
  summaryParts.push(`  Pending tasks: ${tasks.pending.length}`)

  if (research.length > 0) {
    summaryParts.push(`\nResearch available:`)
    for (const r of research.slice(0, 5)) {
      summaryParts.push(`  - ${r.topic} (${r.agent_slug}, ${r.freshness_date})`)
    }
  }

  if (findings.length > 0) {
    summaryParts.push(`\nRelevant findings:`)
    for (const f of findings.slice(0, 5)) {
      summaryParts.push(`  - [${f.agent_slug}] ${f.summary.slice(0, 100)}`)
    }
  }

  if (gaps.length > 0) {
    summaryParts.push(`\nGaps (${gaps.length}):`)
    for (const gap of gaps) {
      const icon = gap.source === 'human' ? 'HUMAN' : 'AGENT'
      summaryParts.push(`  [${icon}] ${gap.description.slice(0, 100)}`)
    }
  }

  if (tasksCreated.length > 0) {
    summaryParts.push(`\nTasks created (${tasksCreated.length}):`)
    for (const task of tasksCreated) {
      summaryParts.push(`  > ${task.title} → ${task.targetAgent ?? 'Yonatan'}`)
    }
  }

  if (recommendations.length > 0) {
    summaryParts.push(`\nRecommendations:`)
    for (const rec of recommendations) {
      summaryParts.push(`  - ${rec}`)
    }
  }

  const result: ResearchResult = {
    summary: summaryParts.join('\n'),
    topic: workstream.id,
    workstreamStatus,
    tasksCreated,
    recommendations,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: AGENT_SLUG,
    category: gaps.length > 0 ? 'observation' : 'finding',
    summary: `Research orchestration: ${workstream.name} — ${completionEstimate}, ${gaps.length} gaps, ${tasksCreated.length} tasks created`,
    details: {
      workstream: workstream.id,
      phase: workstream.phase,
      completion: completionEstimate,
      researchCount: research.length,
      findingsCount: findings.length,
      gapCount: gaps.length,
      tasksCreated: tasksCreated.length,
    } as any,
    tags: [AGENT_SLUG, 'kyc-as-a-service', workstream.id],
  })

  return result
}
