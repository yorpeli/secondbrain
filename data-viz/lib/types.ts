/**
 * Data-Viz Agent — TypeScript Types
 *
 * ChartSpec is a discriminated union on `template`. Each template defines
 * its own strongly-typed input — callers describe what story to tell,
 * not Chart.js config.
 */

import type { ChartConfiguration } from 'chart.js'

// ─── Shared ──────────────────────────────────────────────────

export interface ChartDimensions {
  width: number
  height: number
}

export interface ChartOutputOptions {
  saveTo?: string
}

/** Output context controls dimensions + typography for the target medium */
export type OutputContext = 'document' | 'slide' | 'dashboard'

export interface ContextPreset {
  dimensions: ChartDimensions
  titleSize: number
  subtitleSize: number
  labelSize: number
  tickSize: number
  maxSeries: number
  legendPosition: 'bottom' | 'top' | 'right'
}

export const CONTEXT_PRESETS: Record<OutputContext, ContextPreset> = {
  document: {
    dimensions: { width: 800, height: 450 },
    titleSize: 16, subtitleSize: 12, labelSize: 11, tickSize: 10,
    maxSeries: 6, legendPosition: 'bottom',
  },
  slide: {
    dimensions: { width: 1920, height: 1080 },
    titleSize: 28, subtitleSize: 18, labelSize: 16, tickSize: 14,
    maxSeries: 4, legendPosition: 'bottom',
  },
  dashboard: {
    dimensions: { width: 600, height: 400 },
    titleSize: 14, subtitleSize: 11, labelSize: 10, tickSize: 9,
    maxSeries: 3, legendPosition: 'bottom',
  },
}

interface BaseChartInput {
  title?: string
  subtitle?: string
  dimensions?: ChartDimensions
  outputContext?: OutputContext
  output?: ChartOutputOptions
}

// ─── Volume Trend ────────────────────────────────────────────

export interface VolumeTrendDataPoint {
  week: string
  created: number
}

export interface VolumeTrendInput extends BaseChartInput {
  template: 'volume-trend'
  data: VolumeTrendDataPoint[]
  annotations?: { week: string; label: string }[]
}

// ─── Approval Comparison ─────────────────────────────────────

export interface ApprovalComparisonData {
  clm: { approval_rate: number; ftl_rate: number; created: number }
  fourStep: { approval_rate: number; ftl_rate: number; created: number }
}

export interface ApprovalComparisonInput extends BaseChartInput {
  template: 'approval-comparison'
  data: ApprovalComparisonData
}

// ─── Opportunity Map ─────────────────────────────────────────

export interface OpportunityMapPoint {
  country: string
  approvalDelta: number
  volume: number
  status: 'STRONG' | 'WEAK' | 'NOT_READY' | 'NO_OPPORTUNITY' | 'INSUFFICIENT_DATA'
}

export interface OpportunityMapInput extends BaseChartInput {
  template: 'opportunity-map'
  data: OpportunityMapPoint[]
}

// ─── Funnel Health ───────────────────────────────────────────

export interface FunnelStage {
  stage: string
  recent: number
  baseline: number
}

export interface FunnelHealthInput extends BaseChartInput {
  template: 'funnel-health'
  data: FunnelStage[]
}

// ─── Segment Heatmap ─────────────────────────────────────────

export interface SegmentMetric {
  name: string
  value: number
  severity: 'RED' | 'YELLOW' | 'OK'
  baseline?: number
}

export interface SegmentRow {
  segment: string
  volume: number
  metrics: SegmentMetric[]
}

export interface SegmentHeatmapInput extends BaseChartInput {
  template: 'segment-heatmap'
  data: SegmentRow[]
}

// ─── Discriminated Union ─────────────────────────────────────

export type ChartSpec =
  | VolumeTrendInput
  | ApprovalComparisonInput
  | OpportunityMapInput
  | FunnelHealthInput
  | SegmentHeatmapInput

// ─── Chart Result ────────────────────────────────────────────

export interface ChartResult {
  buffer: Buffer
  width: number
  height: number
  metadata: {
    template: string
    title: string
    generatedAt: string
  }
}

// ─── Template Interface ──────────────────────────────────────

export interface ChartTemplate<T extends ChartSpec = ChartSpec> {
  build(input: T): ChartConfiguration
  sampleData(): T
  defaultDimensions: ChartDimensions
}
