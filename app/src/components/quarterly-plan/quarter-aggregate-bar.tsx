import type { QuarterlyPlanItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function QuarterAggregateBar({ items }: { items: QuarterlyPlanItem[] }) {
  const total = items.reduce((sum, i) => sum + i.totalDeliverables, 0)
  const done = items.reduce((sum, i) => sum + i.doneDeliverables, 0)
  const inProgress = items.reduce((sum, i) => sum + i.inProgressDeliverables, 0)
  const atRisk = items.reduce((sum, i) => sum + i.atRiskDeliverables, 0)

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-2 flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total}</span> deliverables
      </span>
      <span className="text-sm text-muted-foreground">&middot;</span>
      <span className="text-sm">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{done}</span>{" "}
        <span className="text-muted-foreground">done</span>
      </span>
      <span className="text-sm text-muted-foreground">&middot;</span>
      <span className="text-sm">
        <span className="font-medium text-blue-600 dark:text-blue-400">{inProgress}</span>{" "}
        <span className="text-muted-foreground">in progress</span>
      </span>
      <span className="text-sm text-muted-foreground">&middot;</span>
      <span className="text-sm">
        <span className="font-medium text-amber-600 dark:text-amber-400">{atRisk}</span>{" "}
        <span className="text-muted-foreground">at risk</span>
      </span>
      <span
        className={cn(
          "ml-auto text-lg font-bold",
          pct > 75
            ? "text-emerald-600 dark:text-emerald-400"
            : pct > 25
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
        )}
      >
        {pct}%
      </span>
    </div>
  )
}
