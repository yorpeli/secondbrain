import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DeliverableStatusBadge } from "./deliverable-status-badge"
import { usePlanItemDeliverables } from "@/hooks/use-quarterly-plan"
import type { QuarterlyPlanItem } from "@/lib/types"

const itemStatusVariant: Record<string, "info" | "success" | "warning" | "secondary" | "outline"> = {
  planned: "secondary",
  "in-progress": "info",
  done: "success",
  "at-risk": "warning",
  cut: "outline",
}

export function PlanItemCard({ item }: { item: QuarterlyPlanItem }) {
  const [expanded, setExpanded] = useState(false)
  const { data: deliverables, isLoading } = usePlanItemDeliverables(expanded ? item.id : undefined)

  const doneRatio = item.totalDeliverables > 0
    ? Math.round((item.doneDeliverables / item.totalDeliverables) * 100)
    : 0

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
      >
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <Badge variant={itemStatusVariant[item.status] ?? "secondary"} className="text-[10px]">
              {item.status}
            </Badge>
            {item.theme && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.theme}
              </span>
            )}
          </div>
          {item.expectedImpactCurrentQ && (
            <p className="text-xs text-muted-foreground mt-1">
              Q impact: <span className="text-foreground font-medium">{item.expectedImpactCurrentQ}</span>
              {item.expectedImpactNextQ && (
                <span className="ml-2">Next Q: {item.expectedImpactNextQ}</span>
              )}
            </p>
          )}
        </div>
        {/* Progress mini-bar */}
        <div className="shrink-0 text-right">
          <span className="text-xs font-mono text-muted-foreground">
            {item.doneDeliverables}/{item.totalDeliverables}
          </span>
          <div className="mt-1 h-1.5 w-20 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${doneRatio}%` }}
            />
          </div>
        </div>
      </button>

      {/* Deliverables */}
      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="p-4 text-xs text-muted-foreground">Loading deliverables...</div>
          ) : !deliverables?.length ? (
            <div className="p-4 text-xs text-muted-foreground">No deliverables found.</div>
          ) : (
            <div className="divide-y">
              {deliverables.map(d => (
                <div key={d.id} className="px-4 py-3 pl-11">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{d.title}</span>
                        <DeliverableStatusBadge status={d.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {d.timing && <span>Timing: {d.timing}</span>}
                        {d.targetDate && <span>Target: {d.targetDate}</span>}
                      </div>
                      {d.expectedImpact && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Impact: <span className="text-foreground">{d.expectedImpact}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
