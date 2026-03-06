import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface StalenessIndicatorProps {
  lastUpdated: string | null
}

export function StalenessIndicator({ lastUpdated }: StalenessIndicatorProps) {
  if (!lastUpdated) {
    return (
      <Tooltip content="No memory document">
        <span className="flex items-center gap-1.5">
          <span className={cn("inline-block h-2 w-2 rounded-full bg-muted-foreground/30")} />
          <span className="text-xs text-muted-foreground">None</span>
        </span>
      </Tooltip>
    )
  }

  const date = new Date(lastUpdated)
  const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  const relativeTime = formatDistanceToNow(date, { addSuffix: true })

  let color: string
  if (daysSince <= 7) {
    color = "bg-emerald-500"
  } else if (daysSince <= 14) {
    color = "bg-amber-500"
  } else {
    color = "bg-red-500"
  }

  return (
    <Tooltip content={`Updated ${relativeTime}`}>
      <span className="flex items-center gap-1.5">
        <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
        <span className="text-xs text-muted-foreground">{relativeTime}</span>
      </span>
    </Tooltip>
  )
}
