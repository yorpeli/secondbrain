/**
 * Funnel Health — Paired horizontal bars.
 *
 * Y: funnel stages (e.g. "Segmentation", "Docs Submitted", "Approval").
 * Two bars per stage: "Recent" (Midnight Blue) vs "Baseline" (light gray).
 * Delta annotation at bar end: "+2.3pp" green or "-5.1pp" red.
 */

import type { ChartConfiguration } from 'chart.js'
import type { FunnelHealthInput, ChartTemplate } from '../lib/types.js'
import { ChartColors } from '../config/brand.js'
import { baseOptions } from '../lib/chart-defaults.js'

export const funnelHealth: ChartTemplate<FunnelHealthInput> = {
  defaultDimensions: { width: 700, height: 400 },

  sampleData(): FunnelHealthInput {
    return {
      template: 'funnel-health',
      title: 'Funnel Health — Recent vs Baseline',
      subtitle: 'Argentina, CLM mature cohort',
      data: [
        { stage: 'Segmentation', recent: 82.4, baseline: 80.1 },
        { stage: 'Docs Submitted', recent: 61.2, baseline: 66.8 },
        { stage: 'Approval', recent: 71.5, baseline: 69.3 },
      ],
    }
  },

  build(input: FunnelHealthInput): ChartConfiguration {
    const labels = input.data.map(d => d.stage)
    const recentValues = input.data.map(d => d.recent)
    const baselineValues = input.data.map(d => d.baseline)
    const deltas = input.data.map(d => d.recent - d.baseline)
    const base = baseOptions({ title: input.title, subtitle: input.subtitle, outputContext: input.outputContext })

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Recent',
            data: recentValues,
            backgroundColor: ChartColors.midnightBlue,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
          {
            label: 'Baseline',
            data: baselineValues,
            backgroundColor: '#E0E0E0',
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
        ],
      },
      options: {
        ...base,
        indexAxis: 'y' as const,
        plugins: {
          ...base.plugins,
          datalabels: {
            display: true,
            font: { size: 11, weight: 'bold' },
            anchor: 'end',
            align: 'end',
            formatter(value: number, ctx) {
              const dsIndex = ctx.datasetIndex
              const idx = ctx.dataIndex
              if (dsIndex === 0) {
                // Recent bar — show delta
                const delta = deltas[idx]
                const sign = delta >= 0 ? '+' : ''
                return `${value.toFixed(1)}% (${sign}${delta.toFixed(1)}pp)`
              }
              return `${value.toFixed(1)}%`
            },
            color(ctx) {
              if (ctx.datasetIndex === 0) {
                const delta = deltas[ctx.dataIndex]
                return delta >= 0 ? ChartColors.onTrack : ChartColors.atRisk
              }
              return ChartColors.darkGray
            },
          },
        },
        scales: {
          x: {
            ...base.scales!.x,
            beginAtZero: true,
            max: 100,
            ticks: {
              ...(base.scales!.x as any).ticks,
              callback: (v: unknown) => `${v}%`,
            },
          },
          y: {
            ...base.scales!.y,
            grid: { display: false },
          },
        },
      },
    } as ChartConfiguration
  },
}
