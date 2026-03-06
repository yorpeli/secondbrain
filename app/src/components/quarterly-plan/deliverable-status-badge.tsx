import { Badge } from "@/components/ui/badge"
import type { QuarterlyPlanDeliverable } from "@/lib/types"

const statusConfig: Record<QuarterlyPlanDeliverable['status'], { label: string; variant: "info" | "success" | "warning" | "destructive" | "secondary" | "outline" }> = {
  planned: { label: "Planned", variant: "secondary" },
  "in-progress": { label: "In Progress", variant: "info" },
  done: { label: "Done", variant: "success" },
  "at-risk": { label: "At Risk", variant: "warning" },
  blocked: { label: "Blocked", variant: "destructive" },
  cut: { label: "Cut", variant: "outline" },
}

export function DeliverableStatusBadge({ status }: { status: QuarterlyPlanDeliverable['status'] }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
