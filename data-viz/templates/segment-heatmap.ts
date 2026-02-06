/**
 * Segment Heatmap — Grouped bar with severity coloring.
 *
 * Groups: segments (Company, Individual, etc.).
 * Bars per group: metrics (Segmentation, Docs, Approval rates).
 * Bar color by severity: RED=red, YELLOW=yellow, OK=midnight blue.
 * Baseline reference line per metric.
 */

import type { ChartConfiguration } from 'chart.js'
import type { SegmentHeatmapInput, ChartTemplate } from '../lib/types.js'
import { SeverityColors, ChartColors } from '../config/brand.js'
import { baseOptions } from '../lib/chart-defaults.js'

export const segmentHeatmap: ChartTemplate<SegmentHeatmapInput> = {
  defaultDimensions: { width: 850, height: 500 },

  sampleData(): SegmentHeatmapInput {
    return {
      template: 'segment-heatmap',
      title: 'Segment Diagnostic — Rate by AH Type',
      subtitle: 'Bangladesh, CLM mature cohort',
      data: [
        {
          segment: 'Company',
          volume: 520,
          metrics: [
            { name: 'Seg Rate', value: 78.2, severity: 'OK', baseline: 80.0 },
            { name: 'Docs Rate', value: 52.1, severity: 'YELLOW', baseline: 60.0 },
            { name: 'Approval', value: 45.3, severity: 'RED', baseline: 65.0 },
          ],
        },
        {
          segment: 'Individual',
          volume: 310,
          metrics: [
            { name: 'Seg Rate', value: 85.0, severity: 'OK', baseline: 80.0 },
            { name: 'Docs Rate', value: 68.4, severity: 'OK', baseline: 60.0 },
            { name: 'Approval', value: 72.1, severity: 'OK', baseline: 65.0 },
          ],
        },
        {
          segment: 'Sole Proprietor',
          volume: 180,
          metrics: [
            { name: 'Seg Rate', value: 71.5, severity: 'YELLOW', baseline: 80.0 },
            { name: 'Docs Rate', value: 41.2, severity: 'RED', baseline: 60.0 },
            { name: 'Approval', value: 38.7, severity: 'RED', baseline: 65.0 },
          ],
        },
      ],
    }
  },

  build(input: SegmentHeatmapInput): ChartConfiguration {
    const base = baseOptions({ title: input.title, subtitle: input.subtitle, outputContext: input.outputContext })
    const segments = input.data.map(d => `${d.segment} (n=${d.volume})`)

    // Collect unique metric names from first segment
    const metricNames = input.data[0]?.metrics.map(m => m.name) ?? []

    // One dataset per metric — each bar colored by its own severity
    const datasets = metricNames.map((metricName, mIdx) => ({
      label: metricName,
      data: input.data.map(seg => seg.metrics[mIdx]?.value ?? 0),
      backgroundColor: input.data.map(seg => {
        const severity = seg.metrics[mIdx]?.severity ?? 'OK'
        return SeverityColors[severity]
      }),
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.7,
    }))

    // Baseline annotations — horizontal lines per metric
    const annotations: Record<string, unknown> = {}
    for (const metric of (input.data[0]?.metrics ?? [])) {
      if (metric.baseline != null) {
        annotations[`baseline-${metric.name}`] = {
          type: 'line',
          yMin: metric.baseline,
          yMax: metric.baseline,
          borderColor: ChartColors.darkGray,
          borderWidth: 1,
          borderDash: [6, 3],
          label: {
            display: true,
            content: `${metric.name} baseline: ${metric.baseline}%`,
            position: 'end',
            font: { size: 9 },
            color: ChartColors.darkGray,
            backgroundColor: 'rgba(255,255,255,0.8)',
          },
        }
      }
    }

    return {
      type: 'bar',
      data: {
        labels: segments,
        datasets,
      },
      options: {
        ...base,
        plugins: {
          ...base.plugins,
          legend: {
            ...base.plugins!.legend,
            display: true,
          },
          datalabels: {
            display: true,
            color: ChartColors.white,
            font: { size: 10, weight: 'bold' },
            anchor: 'center',
            align: 'center',
            formatter: (v: number) => `${v.toFixed(1)}%`,
          },
          annotation: { annotations },
        },
        scales: {
          x: {
            ...base.scales!.x,
            grid: { display: false },
          },
          y: {
            ...base.scales!.y,
            beginAtZero: true,
            max: 100,
            ticks: {
              ...(base.scales!.y as any).ticks,
              callback: (v: unknown) => `${v}%`,
            },
          },
        },
      },
    } as ChartConfiguration
  },
}
