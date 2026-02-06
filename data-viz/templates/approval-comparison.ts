/**
 * Approval Comparison — Grouped horizontal bars.
 *
 * Two groups: "Approval Rate" and "FTL Rate".
 * CLM bar (Midnight Blue) vs 4Step bar (Border Gray).
 * Percentage labels on each bar.
 * Volume annotation text at bottom.
 */

import type { ChartConfiguration } from 'chart.js'
import type { ApprovalComparisonInput, ChartTemplate } from '../lib/types.js'
import { ChartColors } from '../config/brand.js'
import { baseOptions } from '../lib/chart-defaults.js'

export const approvalComparison: ChartTemplate<ApprovalComparisonInput> = {
  defaultDimensions: { width: 700, height: 400 },

  sampleData(): ApprovalComparisonInput {
    return {
      template: 'approval-comparison',
      title: 'CLM vs 4Step — Key Rates',
      subtitle: 'Brazil, mature cohort (8-12 weeks)',
      data: {
        clm: { approval_rate: 72.3, ftl_rate: 58.1, created: 1240 },
        fourStep: { approval_rate: 68.7, ftl_rate: 55.4, created: 3800 },
      },
    }
  },

  build(input: ApprovalComparisonInput): ChartConfiguration {
    const { clm, fourStep } = input.data
    const base = baseOptions({ title: input.title, subtitle: input.subtitle, outputContext: input.outputContext })

    return {
      type: 'bar',
      data: {
        labels: ['Approval Rate', 'FTL Rate'],
        datasets: [
          {
            label: `CLM (n=${clm.created.toLocaleString()})`,
            data: [clm.approval_rate, clm.ftl_rate],
            backgroundColor: ChartColors.midnightBlue,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
          {
            label: `4Step (n=${fourStep.created.toLocaleString()})`,
            data: [fourStep.approval_rate, fourStep.ftl_rate],
            backgroundColor: ChartColors.borderGray,
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
            color: ChartColors.white,
            font: { size: 12, weight: 'bold' },
            anchor: 'center',
            align: 'center',
            formatter: (v: number) => `${v.toFixed(1)}%`,
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
