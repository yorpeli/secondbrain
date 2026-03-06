import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "@/components/initiatives/priority-badge"
import { cn } from "@/lib/utils"
import type { QuarterlyPlanItem } from "@/lib/types"
import type { Initiative } from "@/lib/types"

export interface InitiativeGroup {
  initiative: string
  slug: string | null
  priority: string | null
  items: QuarterlyPlanItem[]
}

interface InitiativeScoreboardProps {
  groups: InitiativeGroup[]
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
}

type WorstStatus = "done" | "in-progress" | "at-risk" | "planned"

const statusBadgeConfig: Record<WorstStatus, { label: string; variant: "success" | "default" | "warning" | "secondary" }> = {
  done: { label: "Done", variant: "success" },
  "in-progress": { label: "In Progress", variant: "default" },
  "at-risk": { label: "At Risk", variant: "warning" },
  planned: { label: "Planned", variant: "secondary" },
}

interface GroupRollup {
  group: InitiativeGroup
  totalDeliverables: number
  doneDeliverables: number
  atRiskDeliverables: number
  inProgressDeliverables: number
  worstStatus: WorstStatus
}

export function InitiativeScoreboard({ groups, selectedSlug, onSelect }: InitiativeScoreboardProps) {
  const rollups = useMemo<GroupRollup[]>(() => {
    return groups.map((group) => {
      const totalDeliverables = group.items.reduce((sum, item) => sum + item.totalDeliverables, 0)
      const doneDeliverables = group.items.reduce((sum, item) => sum + item.doneDeliverables, 0)
      const atRiskDeliverables = group.items.reduce((sum, item) => sum + item.atRiskDeliverables, 0)
      const inProgressDeliverables = group.items.reduce((sum, item) => sum + item.inProgressDeliverables, 0)

      let worstStatus: WorstStatus = "planned"
      if (atRiskDeliverables > 0) {
        worstStatus = "at-risk"
      } else if (inProgressDeliverables > 0) {
        worstStatus = "in-progress"
      } else if (doneDeliverables === totalDeliverables && totalDeliverables > 0) {
        worstStatus = "done"
      }

      return { group, totalDeliverables, doneDeliverables, atRiskDeliverables, inProgressDeliverables, worstStatus }
    })
  }, [groups])

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Initiative</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">At Risk</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Items</th>
          </tr>
        </thead>
        <tbody>
          {rollups.map((rollup) => {
            const isSelected = rollup.group.slug === selectedSlug
            const badgeConfig = statusBadgeConfig[rollup.worstStatus]
            const progressPct = rollup.totalDeliverables > 0
              ? (rollup.doneDeliverables / rollup.totalDeliverables) * 100
              : 0

            return (
              <tr
                key={rollup.group.slug ?? rollup.group.initiative}
                onClick={() => onSelect(rollup.group.slug)}
                className={cn(
                  "border-b cursor-pointer hover:bg-muted/50 transition-colors",
                  isSelected
                    ? "bg-accent/60 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                )}
              >
                <td className="px-4 py-3">
                  {rollup.group.priority ? (
                    <PriorityBadge priority={rollup.group.priority as Initiative["priority"]} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-foreground truncate max-w-[240px]">
                  {rollup.group.initiative}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {rollup.doneDeliverables}/{rollup.totalDeliverables}
                    </span>
                    <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {rollup.atRiskDeliverables > 0 ? (
                    <span className="text-amber-600 font-semibold">{rollup.atRiskDeliverables}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {rollup.group.items.length}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
