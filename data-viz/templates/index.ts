/**
 * Template registry — maps template name to its implementation.
 */

import type { ChartTemplate, ChartSpec } from '../lib/types.js'
import { volumeTrend } from './volume-trend.js'
import { approvalComparison } from './approval-comparison.js'
import { funnelHealth } from './funnel-health.js'
import { opportunityMap } from './opportunity-map.js'
import { segmentHeatmap } from './segment-heatmap.js'

export const templates: Record<string, ChartTemplate<any>> = {
  'volume-trend': volumeTrend,
  'approval-comparison': approvalComparison,
  'funnel-health': funnelHealth,
  'opportunity-map': opportunityMap,
  'segment-heatmap': segmentHeatmap,
}

export function listTemplates(): { name: string; description: string }[] {
  return [
    { name: 'volume-trend', description: 'Line chart: 12-week account volume trend with area fill' },
    { name: 'approval-comparison', description: 'Grouped horizontal bar: CLM vs 4Step approval/FTL rates' },
    { name: 'funnel-health', description: 'Paired horizontal bar: recent vs baseline funnel stage rates' },
    { name: 'opportunity-map', description: 'Bubble chart: countries by approval delta vs volume' },
    { name: 'segment-heatmap', description: 'Grouped bar: segment metrics with severity coloring' },
  ]
}
