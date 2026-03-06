import { X } from "lucide-react"
import { PlanItemCard } from "./plan-item-card"
import { PriorityBadge } from "@/components/initiatives/priority-badge"
import type { Initiative } from "@/lib/types"
import type { InitiativeGroup } from "./initiative-scoreboard"

interface InitiativeDetailPanelProps {
  group: InitiativeGroup | null
  onClose: () => void
}

export function InitiativeDetailPanel({ group, onClose }: InitiativeDetailPanelProps) {
  if (!group) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Select an initiative above to view plan items.
        </p>
      </div>
    )
  }

  const totalDeliverables = group.items.reduce((sum, item) => sum + item.totalDeliverables, 0)

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {group.priority && (
            <PriorityBadge priority={group.priority as Initiative["priority"]} />
          )}
          <h3 className="text-lg font-semibold">{group.initiative}</h3>
          <span className="text-sm text-muted-foreground">
            {group.items.length} item{group.items.length !== 1 ? "s" : ""} · {totalDeliverables} deliverable{totalDeliverables !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {group.items.map(item => (
          <PlanItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
