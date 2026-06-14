// Confidence scoring + watch->active promotion for comms_rules.
export interface RuleEvidence {
  support: number     // supporting observations
  contradict: number  // contradicting observations
  diversity: number   // distinct thread/day contexts among supporting
}

export const THRESHOLDS = { support: 3, consistency: 0.7, diversity: 2 } as const

export function consistencyOf(e: RuleEvidence): number {
  const total = e.support + e.contradict
  return total === 0 ? 0 : +(e.support / total).toFixed(2)
}

export function confidenceScore(e: RuleEvidence): number {
  const consistency = consistencyOf(e)
  const supportFactor = Math.min(1, e.support / 5)
  const diversityFactor = Math.min(1, e.diversity / 3)
  return +(consistency * supportFactor * diversityFactor).toFixed(2)
}

export function isPromotable(e: RuleEvidence): boolean {
  const total = e.support + e.contradict
  const rawConsistency = total === 0 ? 0 : e.support / total
  return (
    e.support >= THRESHOLDS.support &&
    rawConsistency >= THRESHOLDS.consistency &&
    e.diversity >= THRESHOLDS.diversity
  )
}

export function statusFor(e: RuleEvidence, pinned = false): 'watch' | 'active' {
  if (pinned) return 'active'
  return isPromotable(e) ? 'active' : 'watch'
}
