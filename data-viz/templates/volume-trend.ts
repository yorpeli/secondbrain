/**
 * Volume Trend — Line chart with area fill.
 *
 * Shows 12-week account creation volume trend.
 * Midnight Blue line with 20% opacity fill below.
 * Data labels on first + last points only.
 * Optional vertical annotation lines for events.
 */

import type { ChartConfiguration } from 'chart.js'
import type { VolumeTrendInput, ChartTemplate } from '../lib/types.js'
import { ChartColors, ChartFills } from '../config/brand.js'
import { baseOptions } from '../lib/chart-defaults.js'

function formatWeekLabel(week: string): string {
  const d = new Date(week)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const volumeTrend: ChartTemplate<VolumeTrendInput> = {
  defaultDimensions: { width: 800, height: 450 },

  sampleData(): VolumeTrendInput {
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (11 - i) * 7)
      const iso = d.toISOString().slice(0, 10)
      return { week: iso, created: 200 + Math.round(Math.sin(i / 2) * 80 + Math.random() * 40) }
    })
    return {
      template: 'volume-trend',
      title: 'Account Volume — Weekly Trend',
      subtitle: 'United Kingdom, last 12 weeks',
      data: weeks,
    }
  },

  build(input: VolumeTrendInput): ChartConfiguration {
    const labels = input.data.map(d => formatWeekLabel(d.week))
    const values = input.data.map(d => d.created)
    const base = baseOptions({ title: input.title, subtitle: input.subtitle, outputContext: input.outputContext })

    // Annotation lines for events
    const annotations: Record<string, unknown> = {}
    if (input.annotations) {
      for (const ann of input.annotations) {
        const idx = input.data.findIndex(d => d.week === ann.week)
        if (idx >= 0) {
          annotations[`event-${idx}`] = {
            type: 'line',
            xMin: idx,
            xMax: idx,
            borderColor: ChartColors.darkGray,
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
              display: true,
              content: ann.label,
              position: 'start',
              font: { size: 10 },
              color: ChartColors.darkGray,
            },
          }
        }
      }
    }

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Accounts Created',
            data: values,
            borderColor: ChartColors.midnightBlue,
            backgroundColor: ChartFills.midnightBlue20,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: ChartColors.midnightBlue,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          legend: { display: false },
          datalabels: {
            display(ctx) {
              return ctx.dataIndex === 0 || ctx.dataIndex === values.length - 1
            },
            color: ChartColors.midnightBlue,
            font: { size: 11, weight: 'bold' },
            anchor: 'end',
            align: 'top',
            formatter: (v: number) => v.toLocaleString(),
          },
          annotation: {
            annotations,
          },
        },
        scales: {
          ...base.scales,
          y: {
            ...base.scales!.y,
            beginAtZero: false,
            ticks: {
              ...(base.scales!.y as any).ticks,
              callback: (v: unknown) => Number(v).toLocaleString(),
            },
          },
        },
      },
    } as ChartConfiguration
  },
}
