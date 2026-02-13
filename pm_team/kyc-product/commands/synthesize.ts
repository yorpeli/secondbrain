/**
 * KYC Product PM — Synthesize Command
 *
 * Pulls together all research and audit findings into a coherent state-of-knowledge
 * document. Tracks phase completion, identifies remaining gaps, validates moat
 * hypotheses, and recommends next steps.
 */

import { PHASES, WORKSTREAMS, getPhaseWorkstreams } from '../lib/playbook-config.js'
import type {
  AgentLogEntry,
  CompletedAgentTask,
  ExistingResearch,
  PhaseSummary,
  SynthesisResult,
} from '../lib/types.js'

const AGENT_SLUG = 'kyc-product-pm'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

// ─── Data Gathering ──────────────────────────────────────────

async function getAllResearch(supabase: any): Promise<ExistingResearch[]> {
  // All current research tagged with kyc-as-a-service or created by this agent
  const { data: byTag } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .overlaps('tags', ['kyc-as-a-service', 'kyc-product', 'kyc-product-pm'])
    .order('created_at', { ascending: false })

  const { data: byAgent } = await supabase
    .from('research_results' as any)
    .select('id, topic, research_type, agent_slug, summary, status, freshness_date, tags, created_at')
    .eq('status', 'current')
    .eq('agent_slug', AGENT_SLUG)
    .order('created_at', { ascending: false })

  const all = [...(byTag || []), ...(byAgent || [])] as unknown as ExistingResearch[]
  const seen = new Set<string>()
  return all.filter(r => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

async function getAllFindings(supabase: any): Promise<AgentLogEntry[]> {
  const { data, error } = await supabase
    .from('agent_log' as any)
    .select('id, agent_slug, category, summary, details, tags, created_at')
    .eq('agent_slug', AGENT_SLUG)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[synthesize] Agent log query failed:', error.message)
    return []
  }

  return (data || []) as unknown as AgentLogEntry[]
}

async function getAgentTasks(supabase: any): Promise<{ all: CompletedAgentTask[]; humanPending: CompletedAgentTask[] }> {
  // All tasks created by this agent
  const { data: all } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags, status, target_agent, created_by')
    .eq('created_by', `agent:${AGENT_SLUG}`)
    .order('created_at', { ascending: false })

  // Pending human tasks
  const { data: humanPending } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, result_summary, result_details, completed_at, tags, status, target_agent, created_by')
    .eq('created_by', `agent:${AGENT_SLUG}`)
    .overlaps('tags' as any, ['needs-human'])
    .in('status', ['pending', 'picked-up'])

  return {
    all: (all || []) as unknown as CompletedAgentTask[],
    humanPending: (humanPending || []) as unknown as CompletedAgentTask[],
  }
}

// ─── Phase Assessment ───────────────────────────────────────

function assessPhase(
  phase: typeof PHASES[0],
  research: ExistingResearch[],
  tasks: CompletedAgentTask[],
): PhaseSummary {
  const workstreams = getPhaseWorkstreams(phase.number)

  if (workstreams.length === 0) {
    // Phases 3-5 don't have predefined workstreams yet
    return {
      phase: phase.number,
      name: phase.name,
      status: 'not-started',
      keyFindings: [],
      gaps: [`Phase ${phase.number} workstreams not yet defined — depends on earlier phases`],
      completionPct: 0,
    }
  }

  let completedWorkstreams = 0
  let startedWorkstreams = 0
  const keyFindings: string[] = []
  const gaps: string[] = []

  for (const ws of workstreams) {
    // Check research coverage
    const wsResearch = research.filter(r =>
      (r.tags ?? []).some(t => ws.searchTags.includes(t))
    )
    const wsTasks = tasks.filter(t =>
      (t.tags ?? []).some(tag => tag === ws.id) && t.status === 'done'
    )
    const wsPending = tasks.filter(t =>
      (t.tags ?? []).some(tag => tag === ws.id) && ['pending', 'picked-up'].includes(t.status)
    )

    if (wsResearch.length > 0 || wsTasks.length > 0) {
      startedWorkstreams++

      // Extract key findings from research summaries
      for (const r of wsResearch.slice(0, 2)) {
        keyFindings.push(`[${ws.name}] ${r.summary.slice(0, 100)}`)
      }

      // Check if workstream has no remaining gaps
      const hasHumanGaps = ws.humanDataNeeded.length > 0 &&
        !tasks.some(t =>
          t.status === 'done' &&
          (t.tags ?? []).includes('needs-human') &&
          (t.tags ?? []).includes(ws.id)
        )
      const hasAgentGaps = ws.requiredAgents.some(agent =>
        !research.some(r => r.agent_slug === agent && (r.tags ?? []).some(t => ws.searchTags.includes(t)))
      )

      if (!hasHumanGaps && !hasAgentGaps) {
        completedWorkstreams++
      }
    }

    if (wsPending.length > 0) {
      startedWorkstreams++
      gaps.push(`${ws.name}: ${wsPending.length} tasks pending`)
    }

    if (wsResearch.length === 0 && wsTasks.length === 0 && wsPending.length === 0) {
      gaps.push(`${ws.name}: not started`)
    }
  }

  const completionPct = workstreams.length > 0
    ? Math.round((completedWorkstreams / workstreams.length) * 100)
    : 0

  const status: PhaseSummary['status'] =
    completionPct === 100 ? 'complete' :
    startedWorkstreams > 0 ? 'in-progress' :
    'not-started'

  return {
    phase: phase.number,
    name: phase.name,
    status,
    keyFindings,
    gaps,
    completionPct,
  }
}

// ─── Moat Validation ────────────────────────────────────────

function validateMoats(
  research: ExistingResearch[],
  findings: AgentLogEntry[],
  tasks: CompletedAgentTask[],
): SynthesisResult['moatValidation'] {
  const allText = [
    ...research.map(r => r.summary),
    ...findings.map(f => f.summary),
    ...tasks.filter(t => t.result_summary).map(t => t.result_summary!),
  ].join(' ').toLowerCase()

  return [
    {
      moat: 'Brand — "We use it ourselves for fintech"',
      status: allText.includes('brand') && (allText.includes('validated') || allText.includes('confirmed'))
        ? 'partially-validated'
        : 'unvalidated',
      evidence: research
        .filter(r => r.summary.toLowerCase().includes('brand'))
        .map(r => r.summary.slice(0, 100)),
    },
    {
      moat: 'High-risk country expertise',
      status: allText.includes('high-risk') && (allText.includes('advantage') || allText.includes('strong'))
        ? 'partially-validated'
        : 'unvalidated',
      evidence: research
        .filter(r =>
          r.summary.toLowerCase().includes('high-risk') ||
          r.summary.toLowerCase().includes('country expertise')
        )
        .map(r => r.summary.slice(0, 100)),
    },
    {
      moat: 'Manual operations fallback (automated + manual = quality)',
      status: allText.includes('manual') && (allText.includes('advantage') || allText.includes('quality'))
        ? 'partially-validated'
        : 'unvalidated',
      evidence: research
        .filter(r =>
          r.summary.toLowerCase().includes('manual') ||
          r.summary.toLowerCase().includes('operations')
        )
        .map(r => r.summary.slice(0, 100)),
    },
  ]
}

// ─── Main ───────────────────────────────────────────────────

export async function run(opts: { phase?: number } = {}): Promise<SynthesisResult> {
  console.log('  Synthesizing KYC Product research...')
  const supabase = await getSupabase()

  // Gather everything
  const [research, findings, tasks] = await Promise.all([
    getAllResearch(supabase),
    getAllFindings(supabase),
    getAgentTasks(supabase),
  ])

  console.log(`  Data: ${research.length} research, ${findings.length} findings, ${tasks.all.length} tasks (${tasks.humanPending.length} human pending)`)

  // Assess each phase
  const phases = PHASES.map(phase => assessPhase(phase, research, tasks.all))

  // Determine current phase
  let currentPhase = 1
  for (const phase of phases) {
    if (phase.status === 'complete') {
      currentPhase = phase.phase + 1
    } else {
      currentPhase = phase.phase
      break
    }
  }

  // Validate moats
  const moatValidation = validateMoats(research, findings, tasks.all)

  // Pending human tasks
  const pendingHumanTasks = tasks.humanPending.map(t => ({
    title: t.title,
    created: t.completed_at ?? 'unknown',
    status: t.status,
  }))

  // Next steps
  const nextSteps: string[] = []

  const currentPhaseData = phases.find(p => p.phase === currentPhase)
  if (currentPhaseData) {
    if (currentPhaseData.status === 'not-started') {
      nextSteps.push(`Begin Phase ${currentPhase}: ${currentPhaseData.name}`)
      const workstreams = getPhaseWorkstreams(currentPhase)
      if (workstreams.length > 0) {
        nextSteps.push(`Run: research ${workstreams[0].id} (start with first workstream)`)
      }
    } else if (currentPhaseData.gaps.length > 0) {
      nextSteps.push(`Complete Phase ${currentPhase} gaps:`)
      for (const gap of currentPhaseData.gaps.slice(0, 3)) {
        nextSteps.push(`  - ${gap}`)
      }
    }
  }

  if (pendingHumanTasks.length > 0) {
    nextSteps.push(`${pendingHumanTasks.length} human tasks awaiting response — follow up with Yonatan`)
  }

  const unvalidatedMoats = moatValidation.filter(m => m.status === 'unvalidated')
  if (unvalidatedMoats.length > 0 && currentPhase >= 2) {
    nextSteps.push(`Validate moats: ${unvalidatedMoats.map(m => m.moat.split(' — ')[0]).join(', ')}`)
  }

  // Build summary
  const summaryParts: string[] = []
  summaryParts.push('KYC Product PM — Synthesis Report')
  summaryParts.push('═'.repeat(50))
  summaryParts.push(`Current Phase: ${currentPhase} — ${PHASES.find(p => p.number === currentPhase)?.name ?? 'Unknown'}`)

  summaryParts.push(`\nData Available:`)
  summaryParts.push(`  Research entries: ${research.length}`)
  summaryParts.push(`  Agent findings: ${findings.length}`)
  summaryParts.push(`  Tasks (total): ${tasks.all.length}`)
  summaryParts.push(`  Human tasks pending: ${tasks.humanPending.length}`)

  summaryParts.push(`\nPhase Progress:`)
  for (const phase of phases) {
    const icon = phase.status === 'complete' ? 'DONE' :
      phase.status === 'in-progress' ? 'WIP ' : '----'
    summaryParts.push(`  [${icon}] Phase ${phase.phase}: ${phase.name} (${phase.completionPct}%)`)

    if (phase.keyFindings.length > 0) {
      for (const finding of phase.keyFindings.slice(0, 2)) {
        summaryParts.push(`         ${finding}`)
      }
    }
    if (phase.gaps.length > 0) {
      for (const gap of phase.gaps.slice(0, 2)) {
        summaryParts.push(`         Gap: ${gap}`)
      }
    }
  }

  summaryParts.push(`\nMoat Validation:`)
  for (const moat of moatValidation) {
    const icon = moat.status === 'validated' ? 'YES' :
      moat.status === 'partially-validated' ? 'WIP' :
      moat.status === 'challenged' ? 'NO!' : '???'
    summaryParts.push(`  [${icon}] ${moat.moat}`)
    if (moat.evidence.length > 0) {
      for (const e of moat.evidence) {
        summaryParts.push(`         ${e}`)
      }
    }
  }

  if (pendingHumanTasks.length > 0) {
    summaryParts.push(`\nAwaiting Human Input (${pendingHumanTasks.length}):`)
    for (const task of pendingHumanTasks) {
      summaryParts.push(`  - ${task.title} [${task.status}]`)
    }
  }

  if (nextSteps.length > 0) {
    summaryParts.push(`\nNext Steps:`)
    for (const step of nextSteps) {
      summaryParts.push(`  > ${step}`)
    }
  }

  const result: SynthesisResult = {
    summary: summaryParts.join('\n'),
    phases,
    currentPhase,
    moatValidation,
    pendingHumanTasks,
    nextSteps,
  }

  // Log to agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: AGENT_SLUG,
    category: 'finding',
    summary: `Synthesis: Phase ${currentPhase}, ${research.length} research, ${moatValidation.filter(m => m.status !== 'unvalidated').length}/3 moats with evidence`,
    details: {
      currentPhase,
      phases: phases.map(p => ({ phase: p.phase, status: p.status, completionPct: p.completionPct })),
      moats: moatValidation.map(m => ({ moat: m.moat.split(' — ')[0], status: m.status })),
      humanTasksPending: pendingHumanTasks.length,
      nextSteps,
    } as any,
    tags: [AGENT_SLUG, 'kyc-as-a-service', 'synthesis'],
  })

  return result
}
