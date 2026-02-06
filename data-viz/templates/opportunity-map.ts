/**
 * Opportunity Map — Bubble chart.
 *
 * X: approval delta (CLM - 4Step), Y: volume.
 * Bubble size proportional to volume (sqrt scale).
 * Color by status: STRONG=green, WEAK=yellow, NOT_READY=red, NO_OPP=gray.
 * Vertical dashed lines at +2%, 0%, -5% thresholds.
 * Country labels via datalabels plugin.
 */

import type { ChartConfiguration } from 'chart.js'
import type { OpportunityMapInput, OpportunityMapPoint, ChartTemplate } from '../lib/types.js'
import { StatusColors, ChartColors } from '../config/brand.js'
import { baseOptions } from '../lib/chart-defaults.js'

function bubbleRadius(volume: number, maxVolume: number): number {
  const minR = 6
  const maxR = 30
  return minR + (maxR - minR) * Math.sqrt(volume / maxVolume)
}

export const opportunityMap: ChartTemplate<OpportunityMapInput> = {
  defaultDimensions: { width: 900, height: 550 },

  sampleData(): OpportunityMapInput {
    return {
      template: 'opportunity-map',
      title: 'CLM Opportunity Map',
      subtitle: 'Approval rate delta vs volume, Tier 0-2 countries',
      data: [
        { country: 'Brazil', approvalDelta: 5.2, volume: 1200, status: 'STRONG' },
        { country: 'Argentina', approvalDelta: 1.1, volume: 800, status: 'WEAK' },
        { country: 'UK', approvalDelta: -2.3, volume: 2100, status: 'NOT_READY' },
        { country: 'India', approvalDelta: -7.5, volume: 3500, status: 'NO_OPPORTUNITY' },
        { country: 'Germany', approvalDelta: 3.8, volume: 450, status: 'STRONG' },
        { country: 'Japan', approvalDelta: -0.5, volume: 620, status: 'NOT_READY' },
        { country: 'Mexico', approvalDelta: 0.3, volume: 380, status: 'WEAK' },
        { country: 'Bangladesh', approvalDelta: -4.1, volume: 900, status: 'NOT_READY' },
      ],
    }
  },

  build(input: OpportunityMapInput): ChartConfiguration {
    const base = baseOptions({ title: input.title, subtitle: input.subtitle, outputContext: input.outputContext })
    const maxVolume = Math.max(...input.data.map(d => d.volume))

    // Group by status for legend
    const statusGroups = new Map<string, OpportunityMapPoint[]>()
    for (const pt of input.data) {
      const group = statusGroups.get(pt.status) ?? []
      group.push(pt)
      statusGroups.set(pt.status, group)
    }

    const statusOrder: OpportunityMapPoint['status'][] = [
      'STRONG', 'WEAK', 'NOT_READY', 'NO_OPPORTUNITY', 'INSUFFICIENT_DATA',
    ]
    const statusLabels: Record<string, string> = {
      STRONG: 'Strong (+2%)',
      WEAK: 'Weak (0-2%)',
      NOT_READY: 'Not Ready (-5%-0%)',
      NO_OPPORTUNITY: 'No Opportunity (<-5%)',
      INSUFFICIENT_DATA: 'Insufficient Data',
    }

    const datasets = statusOrder
      .filter(s => statusGroups.has(s))
      .map(status => ({
        label: statusLabels[status],
        data: statusGroups.get(status)!.map(pt => ({
          x: pt.approvalDelta,
          y: pt.volume,
          r: bubbleRadius(pt.volume, maxVolume),
        })),
        backgroundColor: StatusColors[status] + '99',
        borderColor: StatusColors[status],
        borderWidth: 1.5,
        // Stash country names for datalabels
        _countries: statusGroups.get(status)!.map(pt => pt.country),
      }))

    return {
      type: 'bubble',
      data: { datasets },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          datalabels: {
            display: true,
            color: ChartColors.charcoal,
            font: { size: 9 },
            anchor: 'end',
            align: 'top',
            offset: 2,
            formatter(_value: unknown, ctx: any) {
              const ds = ctx.dataset as any
              return ds._countries?.[ctx.dataIndex] ?? ''
            },
          },
          annotation: {
            annotations: {
              zeroLine: {
                type: 'line',
                xMin: 0,
                xMax: 0,
                borderColor: ChartColors.darkGray,
                borderWidth: 1,
                borderDash: [4, 4],
              },
              strongThreshold: {
                type: 'line',
                xMin: 2,
                xMax: 2,
                borderColor: StatusColors.STRONG + '66',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: '+2%',
                  position: 'start',
                  font: { size: 9 },
                  color: StatusColors.STRONG,
                  backgroundColor: 'transparent',
                },
              },
              notReadyThreshold: {
                type: 'line',
                xMin: -5,
                xMax: -5,
                borderColor: StatusColors.NOT_READY + '66',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: '-5%',
                  position: 'start',
                  font: { size: 9 },
                  color: StatusColors.NOT_READY,
                  backgroundColor: 'transparent',
                },
              },
            },
          },
        },
        scales: {
          x: {
            ...base.scales!.x,
            title: {
              display: true,
              text: 'Approval Rate Delta (CLM - 4Step, pp)',
              font: { size: 11 },
              color: ChartColors.darkGray,
            },
            ticks: {
              ...(base.scales!.x as any).ticks,
              callback: (v: unknown) => `${Number(v) >= 0 ? '+' : ''}${v}%`,
            },
          },
          y: {
            ...base.scales!.y,
            title: {
              display: true,
              text: 'Account Volume',
              font: { size: 11 },
              color: ChartColors.darkGray,
            },
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
