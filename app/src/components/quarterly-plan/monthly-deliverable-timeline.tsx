import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { QuarterDeliverable } from "@/lib/types"

interface MonthlyDeliverableTimelineProps {
  deliverables: QuarterDeliverable[]
  quarter: string
}

interface MonthBucket {
  label: string
  month: number
  year: number
  deliverables: QuarterDeliverable[]
}

const statusDot: Record<string, string> = {
  done: "bg-emerald-500",
  "in-progress": "bg-blue-500",
  "at-risk": "bg-amber-500",
  planned: "bg-zinc-400",
  cut: "bg-zinc-300 dark:bg-zinc-600",
  blocked: "bg-red-500",
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parseQuarterMonths(quarter: string): Array<{ month: number; year: number; label: string }> {
  const match = quarter.match(/Q(\d)-(\d{4})/)
  if (!match) return []
  const q = parseInt(match[1])
  const year = parseInt(match[2])
  const startMonth = (q - 1) * 3

  return [0, 1, 2].map(offset => {
    const m = startMonth + offset
    return { month: m, year, label: `${MONTH_NAMES[m]} ${year}` }
  })
}

export function MonthlyDeliverableTimeline({ deliverables, quarter }: MonthlyDeliverableTimelineProps) {
  const months = useMemo<MonthBucket[]>(() => {
    const quarterMonths = parseQuarterMonths(quarter)
    if (quarterMonths.length === 0) return []

    // Bucket for items with no target date
    const buckets: MonthBucket[] = quarterMonths.map(qm => ({
      label: qm.label,
      month: qm.month,
      year: qm.year,
      deliverables: [],
    }))

    for (const d of deliverables) {
      if (!d.targetDate) {
        // Put undated items in last month
        buckets[buckets.length - 1].deliverables.push(d)
        continue
      }
      const date = new Date(d.targetDate)
      const m = date.getMonth()
      const bucket = buckets.find(b => b.month === m && b.year === date.getFullYear())
      if (bucket) {
        bucket.deliverables.push(d)
      } else {
        // Outside quarter — put in nearest bucket
        buckets[buckets.length - 1].deliverables.push(d)
      }
    }

    return buckets
  }, [deliverables, quarter])

  if (months.length === 0) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Monthly Timeline</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {months.map(bucket => (
          <div key={bucket.label}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {bucket.label}
              </h4>
              <span className="text-xs text-muted-foreground">
                {bucket.deliverables.length} item{bucket.deliverables.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1">
              {bucket.deliverables.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No deliverables</p>
              ) : (
                bucket.deliverables.map(d => {
                  const isOverdue =
                    d.targetDate &&
                    d.status !== "done" &&
                    d.status !== "cut" &&
                    new Date(d.targetDate) < today

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-xs",
                        isOverdue
                          ? "border-l-2 border-l-red-500 bg-red-500/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          statusDot[d.status] ?? "bg-zinc-400"
                        )}
                      />
                      <span className="truncate font-medium">{d.title}</span>
                      {isOverdue && (
                        <span className="text-red-500 text-[10px] shrink-0 ml-auto">overdue</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
