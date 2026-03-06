import { Badge } from "@/components/ui/badge"
import type { Initiative } from "@/lib/types"

const priorityConfig: Record<Initiative['priority'], { variant: "destructive" | "warning" | "secondary" }> = {
  P0: { variant: "destructive" },
  P1: { variant: "warning" },
  P2: { variant: "secondary" },
}

interface PriorityBadgeProps {
  priority: Initiative['priority']
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? { variant: "secondary" as const }
  return <Badge variant={config.variant} className="font-mono text-[10px] px-1.5">{priority}</Badge>
}
