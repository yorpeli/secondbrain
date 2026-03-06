import { Badge } from "@/components/ui/badge"
import type { Initiative } from "@/lib/types"

const statusConfig: Record<Initiative['status'], { label: string; variant: "info" | "purple" | "success" }> = {
  active: { label: "Active", variant: "info" },
  exploration: { label: "Exploration", variant: "purple" },
  completed: { label: "Completed", variant: "success" },
}

interface StatusBadgeProps {
  status: Initiative['status']
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "secondary" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
