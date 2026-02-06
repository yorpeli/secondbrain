/**
 * Core render engine — wraps ChartJSNodeCanvas.
 *
 * Single entry point: renderChart(spec) → ChartResult.
 * Caches canvas instances by dimension key to avoid re-init overhead.
 */

import { Chart } from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

import type { ChartSpec, ChartResult, ChartDimensions } from './types.js'
import { CONTEXT_PRESETS } from './types.js'
import { templates } from '../templates/index.js'

// Register plugins globally
Chart.register(annotationPlugin, ChartDataLabels)

// ─── Canvas Cache ────────────────────────────────────────────

const canvasCache = new Map<string, ChartJSNodeCanvas>()

function getCanvas(dims: ChartDimensions): ChartJSNodeCanvas {
  const key = `${dims.width}x${dims.height}`
  let canvas = canvasCache.get(key)
  if (!canvas) {
    canvas = new ChartJSNodeCanvas({
      width: dims.width,
      height: dims.height,
      backgroundColour: 'white',
    })
    canvasCache.set(key, canvas)
  }
  return canvas
}

// ─── Render ──────────────────────────────────────────────────

export async function renderChart(spec: ChartSpec): Promise<ChartResult> {
  const template = templates[spec.template]
  if (!template) {
    throw new Error(`Unknown chart template: ${spec.template}`)
  }

  const contextDims = spec.outputContext ? CONTEXT_PRESETS[spec.outputContext].dimensions : undefined
  const dims = spec.dimensions ?? contextDims ?? template.defaultDimensions
  const canvas = getCanvas(dims)
  const config = template.build(spec as any)
  const buffer = Buffer.from(await canvas.renderToBuffer(config))

  const result: ChartResult = {
    buffer,
    width: dims.width,
    height: dims.height,
    metadata: {
      template: spec.template,
      title: spec.title ?? '',
      generatedAt: new Date().toISOString(),
    },
  }

  // Save to file if requested
  if (spec.output?.saveTo) {
    await mkdir(dirname(spec.output.saveTo), { recursive: true })
    await writeFile(spec.output.saveTo, buffer)
    console.log(`  Saved: ${spec.output.saveTo} (${dims.width}x${dims.height})`)
  }

  return result
}
