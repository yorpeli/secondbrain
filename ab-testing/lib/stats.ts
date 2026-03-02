/**
 * AB Testing Agent — Statistical Utilities
 *
 * Two-proportion z-test for comparing conversion rates between variants.
 * No external dependencies.
 */

import { STAT_THRESHOLDS } from '../config/constants.js'
import type { ProportionTestResult } from './types.js'

/**
 * Approximate the cumulative distribution function of the standard normal.
 * Uses Abramowitz & Stegun approximation (formula 26.2.17).
 */
export function normalCDF(z: number): number {
  if (z < -8) return 0
  if (z > 8) return 1

  const isNegative = z < 0
  const x = isNegative ? -z : z

  const b1 = 0.319381530
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429

  const t = 1 / (1 + 0.2316419 * x)
  const pdf = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t
  const cdf = 1 - pdf * poly

  return isNegative ? 1 - cdf : cdf
}

/**
 * Calculate percentage lift from control to treatment.
 */
export function calculateLift(controlRate: number, treatmentRate: number): number {
  if (controlRate === 0) return treatmentRate > 0 ? Infinity : 0
  return ((treatmentRate - controlRate) / controlRate) * 100
}

/**
 * Two-proportion z-test.
 *
 * Tests whether the treatment conversion rate is significantly different
 * from the control conversion rate.
 *
 * @param controlConv - Number of conversions in control group
 * @param controlTotal - Total observations in control group
 * @param treatmentConv - Number of conversions in treatment group
 * @param treatmentTotal - Total observations in treatment group
 */
export function proportionTest(
  controlConv: number,
  controlTotal: number,
  treatmentConv: number,
  treatmentTotal: number,
): ProportionTestResult {
  const controlRate = controlTotal > 0 ? controlConv / controlTotal : 0
  const treatmentRate = treatmentTotal > 0 ? treatmentConv / treatmentTotal : 0
  const liftPct = calculateLift(controlRate, treatmentRate)

  // Insufficient data check
  if (controlTotal < STAT_THRESHOLDS.MIN_SAMPLE || treatmentTotal < STAT_THRESHOLDS.MIN_SAMPLE) {
    return {
      z_score: 0,
      p_value: 1,
      significant: false,
      lift_pct: liftPct,
      control_rate: controlRate,
      treatment_rate: treatmentRate,
    }
  }

  // Pooled proportion
  const pooled = (controlConv + treatmentConv) / (controlTotal + treatmentTotal)
  const pooledComplement = 1 - pooled

  // Standard error of the difference
  const se = Math.sqrt(pooled * pooledComplement * (1 / controlTotal + 1 / treatmentTotal))

  if (se === 0) {
    return {
      z_score: 0,
      p_value: 1,
      significant: false,
      lift_pct: liftPct,
      control_rate: controlRate,
      treatment_rate: treatmentRate,
    }
  }

  // Z-score
  const zScore = (treatmentRate - controlRate) / se

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

  return {
    z_score: zScore,
    p_value: pValue,
    significant: pValue < STAT_THRESHOLDS.P_VALUE,
    lift_pct: liftPct,
    control_rate: controlRate,
    treatment_rate: treatmentRate,
  }
}
