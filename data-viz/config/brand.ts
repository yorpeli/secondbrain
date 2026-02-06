/**
 * Chart brand colors — derived from lib/doc-style.ts Colors.
 * Chart.js needs '#' prefix; doc-style uses bare hex.
 */

import { Colors } from '../../lib/doc-style.js'

/** Brand colors with # prefix for Chart.js */
export const ChartColors = {
  midnightBlue: `#${Colors.midnightBlue}`,
  darkGray: `#${Colors.darkGray}`,
  charcoal: `#${Colors.charcoal}`,
  white: `#${Colors.white}`,
  lightGray: `#${Colors.lightGray}`,
  borderGray: `#${Colors.borderGray}`,
  onTrack: `#${Colors.onTrack}`,
  potentialIssues: `#${Colors.potentialIssues}`,
  atRisk: `#${Colors.atRisk}`,
} as const

/** Semi-transparent fills for area charts */
export const ChartFills = {
  midnightBlue20: `#${Colors.midnightBlue}33`,
  midnightBlue40: `#${Colors.midnightBlue}66`,
  onTrack20: `#${Colors.onTrack}33`,
  atRisk20: `#${Colors.atRisk}33`,
} as const

/** Severity color mapping for diagnostic charts */
export const SeverityColors = {
  RED: `#${Colors.atRisk}`,
  YELLOW: `#${Colors.potentialIssues}`,
  OK: `#${Colors.midnightBlue}`,
} as const

/** Status colors for opportunity map */
export const StatusColors = {
  STRONG: `#${Colors.onTrack}`,
  WEAK: `#${Colors.potentialIssues}`,
  NOT_READY: `#${Colors.atRisk}`,
  NO_OPPORTUNITY: `#${Colors.darkGray}`,
  INSUFFICIENT_DATA: `#${Colors.borderGray}`,
} as const

/** Grid and axis styling */
export const ChartGrid = {
  line: '#E8E8E8',
  border: `#${Colors.borderGray}`,
} as const
