import type { Initiative } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskProgressProps {
  initiative: Pick<Initiative, 'tasksTodo' | 'tasksInProgress' | 'tasksBlocked' | 'tasksDone'>
}

export function TaskProgress({ initiative }: TaskProgressProps) {
  const { tasksTodo, tasksInProgress, tasksBlocked, tasksDone } = initiative
  const total = tasksTodo + tasksInProgress + tasksBlocked + tasksDone

  if (total === 0) {
    return <span className="text-xs text-muted-foreground">No tasks</span>
  }

  const percent = Math.round((tasksDone / total) * 100)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {tasksDone}/{total}
      </span>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", percent === 100 ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
