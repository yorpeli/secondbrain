/**
 * AB Testing Agent — Analyze Command
 *
 * Build an inline Looker query with CLM default filters + experiment filter,
 * compare variants via proportion tests, update history.
 */

import 'dotenv/config'
import {
  CLM_DEFAULT_FILTERS,
  CLM_FUNNEL_FIELDS,
  LOOKER_MODEL,
  LOOKER_VIEW,
  STAT_THRESHOLDS,
  VERDICTS,
  type AnalysisVerdict,
} from '../config/constants.js'
import {
  appendAnalysis,
  getExperiment,
  getExperimentByExpId,
} from '../lib/experiment-store.js'
import { proportionTest } from '../lib/stats.js'
import type { AnalysisHistoryEntry, Experiment, MetricResult } from '../lib/types.js'

interface AnalyzeOptions {
  slug?: string
  expid?: string
}

interface AnalyzeResult {
  summary: string
  experiment: Experiment | null
  entry: AnalysisHistoryEntry | null
}

export async function run(options: AnalyzeOptions): Promise<AnalyzeResult> {
  // Resolve experiment
  let experiment: Experiment | null = null

  if (options.slug) {
    experiment = await getExperiment(options.slug)
  } else if (options.expid) {
    experiment = await getExperimentByExpId(options.expid)
  }

  if (!experiment) {
    return {
      summary: `Experiment not found. Searched by: ${JSON.stringify(options)}`,
      experiment: null,
      entry: null,
    }
  }

  if (!experiment.looker_filter) {
    return {
      summary: `${experiment.expid} (${experiment.name}): No looker_filter configured. Set the experiment's filter field and variant values first.`,
      experiment,
      entry: null,
    }
  }

  const { field, field_value, values, variant_field, date_filter, filter_overrides } = experiment.looker_filter

  // Build Looker inline query: start with CLM defaults, apply overrides, add experiment filter
  const filters: Record<string, string> = {
    ...CLM_DEFAULT_FILTERS,
    ...filter_overrides,
    [`clm_population_main_dashboard.${field}`]: field_value,
  }

  // Remove filters set to empty string (override to "no filter")
  for (const [k, v] of Object.entries(filters)) {
    if (v === '') delete filters[k]
  }

  // Date filter: use experiment-specific override or default from start_date
  if (date_filter) {
    filters['clm_population_main_dashboard.ah_creation_date_date'] = date_filter
  } else if (experiment.start_date) {
    filters['clm_population_main_dashboard.ah_creation_date_date'] = `after ${experiment.start_date.replace(/-/g, '/')}`
  }

  const queryFields = [
    `clm_population_main_dashboard.${variant_field}`,
    ...CLM_FUNNEL_FIELDS,
  ]

  console.log(`Running inline query for ${experiment.expid}...`)
  console.log(`  Filter: ${field} = ${values.join(', ')}`)
  console.log(`  Variant field: ${variant_field}`)
  console.log(`  Date filter: ${filters['clm_population_main_dashboard.ah_creation_date_date'] ?? 'none'}`)

  // Lazy import to avoid requiring Looker creds for other commands
  const { createAndRunQuery } = await import('../../analytics/lib/looker-client.js')

  const { query_id, results: rows } = await createAndRunQuery({
    model: LOOKER_MODEL,
    view: LOOKER_VIEW,
    fields: queryFields,
    filters,
    sorts: [`clm_population_main_dashboard.${variant_field}`],
  })

  console.log(`  Query ID: ${query_id}`)
  console.log(`  Rows: ${rows.length}`)

  if (rows.length === 0) {
    return {
      summary: `${experiment.expid}: Inline query returned no data. Check filter config.`,
      experiment,
      entry: null,
    }
  }

  // The variant field key in results (Looker returns fully qualified names)
  const variantKey = `clm_population_main_dashboard.${variant_field}`
  const totalKey = CLM_FUNNEL_FIELDS[0] // accounts_created_clm = top of funnel

  // Filter out "Not in Experiment" and empty rows
  const experimentRows = rows.filter(r => {
    const val = String(r[variantKey] ?? '').toLowerCase()
    return val !== '' && val !== 'null' && !val.startsWith('not in')
  })

  console.log(`  Experiment rows: ${experimentRows.length} (filtered from ${rows.length})`)

  if (experimentRows.length < 2) {
    return {
      summary: `${experiment.expid}: Only ${experimentRows.length} variant(s) found. Need at least 2 for comparison.`,
      experiment,
      entry: null,
    }
  }

  // Identify control row
  const variantNames = experimentRows.map(r => String(r[variantKey]))
  const control = identifyControl(variantNames)
  const controlRow = experimentRows.find(r => String(r[variantKey]) === control)!
  const controlTotal = toNumber(controlRow[totalKey])
  const treatmentRows = experimentRows.filter(r => String(r[variantKey]) !== control)

  console.log(`  Control "${control}": n=${controlTotal}`)
  for (const row of treatmentRows) {
    console.log(`  Treatment "${row[variantKey]}": n=${toNumber(row[totalKey])}`)
  }

  // Run analysis for each treatment arm vs control
  interface ArmResult {
    name: string
    total: number
    metrics: MetricResult[]
    verdict: AnalysisVerdict
  }

  const arms: ArmResult[] = []

  for (const tRow of treatmentRows) {
    const treatmentName = String(tRow[variantKey])
    const treatmentTotal = toNumber(tRow[totalKey])
    const metrics: MetricResult[] = []

    for (const funnelField of CLM_FUNNEL_FIELDS.slice(1)) { // skip accounts_created (denominator)
      const controlConv = toNumber(controlRow[funnelField])
      const treatmentConv = toNumber(tRow[funnelField])

      if (controlTotal > 0 && treatmentTotal > 0) {
        const result = proportionTest(controlConv, controlTotal, treatmentConv, treatmentTotal)
        metrics.push({
          metric: shortFieldName(funnelField),
          control_rate: result.control_rate,
          treatment_rate: result.treatment_rate,
          lift_pct: result.lift_pct,
          p_value: result.p_value,
          significant: result.significant,
        })
      }
    }

    const verdict = determineVerdict(metrics, controlTotal, treatmentTotal)
    arms.push({ name: treatmentName, total: treatmentTotal, metrics, verdict })
  }

  // Use the first arm for the history entry (primary comparison)
  const primaryArm = arms[0]

  const entry: AnalysisHistoryEntry = {
    date: new Date().toISOString(),
    query_id,
    verdict: primaryArm.verdict,
    metrics: primaryArm.metrics,
    sample_size: { control: controlTotal, treatment: primaryArm.total },
    notes: arms.length > 1
      ? `Multi-arm: ${arms.map(a => `${a.name} (n=${a.total}, ${a.verdict})`).join('; ')}`
      : null,
  }

  // Save to registry
  await appendAnalysis(experiment.slug, entry)

  // Log significant findings
  const allMetrics = arms.flatMap(a => a.metrics)
  if (allMetrics.some(m => m.significant)) {
    try {
      const { logFinding } = await import('../../lib/logging.js')
      await logFinding(
        'ab-testing',
        `${experiment.expid} analysis: ${arms.map(a => `${a.name}=${a.verdict}`).join(', ')}. ${formatTopMetric(allMetrics)}`,
        {
          expid: experiment.expid,
          slug: experiment.slug,
          query_id,
          arms: arms.map(a => ({ name: a.name, verdict: a.verdict, total: a.total })),
          sample_size: { control: controlTotal },
        },
        ['ab-test', 'experiment', experiment.lifecycle],
      )
    } catch {
      // Logging failure is non-blocking
    }
  }

  // Format output
  const lines: string[] = [
    `Analysis: ${experiment.expid} — ${experiment.name}`,
    `Query: inline (id=${query_id}), filter: ${field}`,
    '',
  ]

  for (const arm of arms) {
    lines.push(`--- "${control}" (n=${controlTotal}) vs "${arm.name}" (n=${arm.total}) ---`)
    lines.push('')
    lines.push(formatMetricsTable(arm.metrics))
    lines.push('')
    lines.push(`Verdict: ${arm.verdict}`)
    lines.push('')
  }

  if (experiment.success_criteria) {
    lines.push(`Success criteria: ${experiment.success_criteria}`)
  }
  if (experiment.decision) {
    lines.push(`Asana decision: ${experiment.decision}`)
  }

  return {
    summary: lines.join('\n'),
    experiment,
    entry,
  }
}

// ─── Helpers ────────────────────────────────────────────────

function identifyControl(variants: string[]): string {
  const controlPatterns = [/control/i, /baseline/i, /original/i, /^0$/, /^a$/i, /^off$/i, /^false$/i, /current/i]

  for (const v of variants) {
    if (controlPatterns.some(p => p.test(v))) return v
  }
  return variants[0]
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const n = parseFloat(val)
    return isNaN(n) ? 0 : n
  }
  return 0
}

function shortFieldName(field: string): string {
  const parts = field.split('.')
  return parts[parts.length - 1]
}

// ─── Verdict ─────────────────────────────────────────────────

function determineVerdict(
  metrics: MetricResult[],
  controlTotal: number,
  treatmentTotal: number,
): AnalysisVerdict {
  if (controlTotal < STAT_THRESHOLDS.MIN_SAMPLE || treatmentTotal < STAT_THRESHOLDS.MIN_SAMPLE) {
    return VERDICTS.INSUFFICIENT_DATA
  }

  const significant = metrics.filter(m => m.significant)

  if (significant.length === 0) {
    const totalSample = controlTotal + treatmentTotal
    if (totalSample < STAT_THRESHOLDS.MIN_SAMPLE * 10) {
      return VERDICTS.TOO_EARLY
    }
    return VERDICTS.NO_DIFFERENCE
  }

  const positiveLifts = significant.filter(m => m.lift_pct > STAT_THRESHOLDS.MIN_LIFT_PCT)
  const negativeLifts = significant.filter(m => m.lift_pct < -STAT_THRESHOLDS.MIN_LIFT_PCT)

  if (positiveLifts.length > negativeLifts.length) return VERDICTS.TREATMENT_WINS
  if (negativeLifts.length > positiveLifts.length) return VERDICTS.CONTROL_WINS
  return VERDICTS.NO_DIFFERENCE
}

// ─── Formatting ──────────────────────────────────────────────

function formatMetricsTable(metrics: MetricResult[]): string {
  if (metrics.length === 0) return 'No metrics available'

  const header = ['Metric', 'Control', 'Treatment', 'Lift', 'p-value', 'Sig?']
  const widths = [28, 10, 10, 10, 10, 5]

  const lines = [
    header.map((h, i) => h.padEnd(widths[i])).join('  '),
    '-'.repeat(header.reduce((a, _, i) => a + widths[i] + 2, 0)),
  ]

  for (const m of metrics) {
    lines.push([
      m.metric.padEnd(widths[0]),
      formatPct(m.control_rate).padEnd(widths[1]),
      formatPct(m.treatment_rate).padEnd(widths[2]),
      formatLift(m.lift_pct).padEnd(widths[3]),
      m.p_value.toFixed(4).padEnd(widths[4]),
      (m.significant ? 'YES' : 'no').padEnd(widths[5]),
    ].join('  '))
  }

  return lines.join('\n')
}

function formatPct(rate: number): string {
  if (rate >= 0 && rate <= 1) return `${(rate * 100).toFixed(2)}%`
  return rate.toFixed(2).toString()
}

function formatLift(lift: number): string {
  const sign = lift > 0 ? '+' : ''
  return `${sign}${lift.toFixed(2)}%`
}

function formatTopMetric(metrics: MetricResult[]): string {
  const sig = metrics.filter(m => m.significant)
  if (sig.length === 0) return 'No significant metrics'
  const top = sig.sort((a, b) => Math.abs(b.lift_pct) - Math.abs(a.lift_pct))[0]
  return `${top.metric}: ${formatLift(top.lift_pct)} lift (p=${top.p_value.toFixed(4)})`
}
