/**
 * AB Testing Agent — List Command
 *
 * Show experiments table with status, verdicts, and summary stats.
 */

import type { ExperimentLifecycle } from '../config/constants.js'
import { loadRegistry } from '../lib/experiment-store.js'
import type { Experiment } from '../lib/types.js'

interface ListOptions {
  status?: ExperimentLifecycle
}

export async function run(options: ListOptions): Promise<{ summary: string }> {
  const registry = await loadRegistry()
  let experiments = registry.experiments

  if (experiments.length === 0) {
    return { summary: 'No experiments in registry. Run bootstrap first: npx tsx ab-testing/bootstrap.ts' }
  }

  // Filter by lifecycle status
  if (options.status) {
    experiments = experiments.filter(e => e.lifecycle === options.status)
    if (experiments.length === 0) {
      return { summary: `No experiments with status "${options.status}".` }
    }
  }

  // Sort: live first, then for-analysis, then by name
  const stageOrder: Record<string, number> = {
    'live': 0,
    'for-analysis': 1,
    'in-development': 2,
    'in-design': 3,
    'rollout-live': 4,
    'rollout-in-dev': 5,
    'completed': 6,
    'idea': 7,
    'on-hold': 8,
    'cancelled': 9,
  }
  experiments.sort((a, b) => {
    const oa = stageOrder[a.lifecycle] ?? 99
    const ob = stageOrder[b.lifecycle] ?? 99
    return oa !== ob ? oa - ob : a.name.localeCompare(b.name)
  })

  // Build table
  const lines: string[] = []
  const header = padRow(['EXPID', 'Lifecycle', 'Verdict', 'Decision', 'Owner', 'Name'])
  lines.push(header)
  lines.push('-'.repeat(header.length))

  for (const exp of experiments) {
    const lastAnalysis = exp.analysis_history[exp.analysis_history.length - 1]
    const verdict = lastAnalysis?.verdict ?? '-'
    const decision = exp.decision ?? '-'
    const owner = exp.owner ? truncate(exp.owner, 16) : '-'
    const name = truncate(exp.name, 40)

    lines.push(padRow([
      exp.expid,
      exp.lifecycle,
      verdict,
      decision,
      owner,
      name,
    ]))
  }

  // Summary stats
  const byLifecycle: Record<string, number> = {}
  for (const exp of experiments) {
    byLifecycle[exp.lifecycle] = (byLifecycle[exp.lifecycle] ?? 0) + 1
  }

  const needsAnalysis = experiments.filter(
    e => (e.lifecycle === 'live' || e.lifecycle === 'for-analysis')
      && e.looker_filter !== null
      && (e.analysis_history.length === 0 || isStale(e))
  )

  lines.push('')
  lines.push(`Total: ${experiments.length} experiments`)
  const stageStr = Object.entries(byLifecycle)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
  lines.push(`By stage: ${stageStr}`)

  if (needsAnalysis.length > 0) {
    lines.push(`Needing analysis: ${needsAnalysis.length} (${needsAnalysis.map(e => e.expid).join(', ')})`)
  }

  return { summary: lines.join('\n') }
}

// ─── Helpers ─────────────────────────────────────────────────

function padRow(cols: string[]): string {
  const widths = [12, 16, 20, 10, 18, 40]
  return cols.map((c, i) => c.padEnd(widths[i] ?? 20)).join('  ')
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s
}

function isStale(exp: Experiment): boolean {
  const last = exp.analysis_history[exp.analysis_history.length - 1]
  if (!last) return true
  const daysSince = (Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > 7
}
