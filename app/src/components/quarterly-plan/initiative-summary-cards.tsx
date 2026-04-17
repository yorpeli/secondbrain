import { useMemo } from "react"
import { PriorityBadge } from "@/components/initiatives/priority-badge"
import type { Initiative } from "@/lib/types"
import type { QuarterDeliverable } from "@/lib/types"
import type { InitiativeGroup } from "./initiative-scoreboard"

interface InitiativeSummaryCardsProps {
  groups: InitiativeGroup[]
  deliverables: QuarterDeliverable[]
}

interface CardData {
  group: InitiativeGroup
  totalDeliverables: number
  doneDeliverables: number
  atRiskDeliverables: number
  overdueDeliverables: number
  progressPct: number
}

export function InitiativeSummaryCards({ groups, deliverables }: InitiativeSummaryCardsProps) {
  const cards = useMemo<CardData[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return groups.map(group => {
      const groupDeliverables = deliverables.filter(
        d => d.initiativeSlug === group.slug
      )
      const total = groupDeliverables.length
      const done = groupDeliverables.filter(d => d.status === 'done').length
      const atRisk = groupDeliverables.filter(d => d.status === 'at-risk').length
      const overdue = groupDeliverables.filter(d => {
        if (!d.targetDate) return false
        if (d.status === 'done' || d.status === 'cut') return false
        return new Date(d.targetDate) < today
      }).length

      return {
        group,
        totalDeliverables: total,
        doneDeliverables: done,
        atRiskDeliverables: atRisk,
        overdueDeliverables: overdue,
        progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
      }
    })
  }, [groups, deliverables])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cards.map(card => (
        <div
          key={card.group.slug ?? card.group.initiative}
          className="rounded-lg border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            {card.group.priority && (
              <PriorityBadge priority={card.group.priority as Initiative["priority"]} />
            )}
            <h4 className="font-semibold text-sm truncate">{card.group.initiative}</h4>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${card.progressPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {card.doneDeliverables}/{card.totalDeliverables}
            </span>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 text-xs">
            {card.overdueDeliverables > 0 && (
              <span className="flex items-center gap-1 text-red-500 font-semibold">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {card.overdueDeliverables} overdue
              </span>
            )}
            {card.atRiskDeliverables > 0 && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {card.atRiskDeliverables} at risk
              </span>
            )}
            {card.overdueDeliverables === 0 && card.atRiskDeliverables === 0 && (
              <span className="text-muted-foreground">On track</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
