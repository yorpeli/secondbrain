/**
 * Base Chart.js options factory.
 *
 * Provides brand-consistent defaults for all chart types:
 * fonts, grid, legend, title, and rendering settings.
 * Supports OutputContext presets for different target media.
 */

import type { ChartOptions, FontSpec } from 'chart.js'
import { Fonts } from '../../lib/doc-style.js'
import { ChartColors, ChartGrid } from '../config/brand.js'
import type { OutputContext, ContextPreset } from './types.js'
import { CONTEXT_PRESETS } from './types.js'

const FONT_FAMILY = `${Fonts.primary}, ${Fonts.fallback}, sans-serif`

const DEFAULT_PRESET = CONTEXT_PRESETS.document

export const defaultFont: Partial<FontSpec> = {
  family: FONT_FAMILY,
  size: 12,
}

/** Base options merged into every chart. Override per-template as needed. */
export function baseOptions(opts?: {
  title?: string
  subtitle?: string
  outputContext?: OutputContext
}): ChartOptions {
  const preset: ContextPreset = opts?.outputContext
    ? CONTEXT_PRESETS[opts.outputContext]
    : DEFAULT_PRESET

  return {
    animation: false,
    responsive: false,
    devicePixelRatio: 2,
    layout: {
      padding: { top: 16, right: 24, bottom: 16, left: 16 },
    },
    plugins: {
      title: opts?.title
        ? {
            display: true,
            text: opts.title,
            color: ChartColors.midnightBlue,
            font: { family: FONT_FAMILY, size: preset.titleSize, weight: 'bold' },
            padding: { bottom: opts.subtitle ? 4 : 16 },
            align: 'start' as const,
          }
        : { display: false },
      subtitle: opts?.subtitle
        ? {
            display: true,
            text: opts.subtitle,
            color: ChartColors.darkGray,
            font: { family: FONT_FAMILY, size: preset.subtitleSize, weight: 'normal' },
            padding: { bottom: 16 },
            align: 'start' as const,
          }
        : { display: false },
      legend: {
        display: true,
        position: preset.legendPosition as 'bottom',
        labels: {
          font: { family: FONT_FAMILY, size: preset.labelSize },
          color: ChartColors.charcoal,
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        display: false, // off by default, templates opt-in
      },
    },
    scales: {
      x: {
        grid: { color: ChartGrid.line },
        border: { color: ChartGrid.border },
        ticks: {
          font: { family: FONT_FAMILY, size: preset.tickSize },
          color: ChartColors.darkGray,
        },
      },
      y: {
        grid: { color: ChartGrid.line },
        border: { color: ChartGrid.border },
        ticks: {
          font: { family: FONT_FAMILY, size: preset.tickSize },
          color: ChartColors.darkGray,
        },
      },
    },
  }
}
