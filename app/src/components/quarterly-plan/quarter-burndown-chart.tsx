import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { QuarterDeliverable } from "@/lib/types"

interface QuarterBurndownChartProps {
  deliverables: QuarterDeliverable[]
  quarter: string
}

interface BurndownPoint {
  week: string
  weekLabel: string
  planned: number
  actual: number
}

function getQuarterWeeks(quarter: string): Date[] {
  // Parse "Q1-2026" -> Jan 1 2026 to Mar 31 2026
  const match = quarter.match(/Q(\d)-(\d{4})/)
  if (!match) return []
  const q = parseInt(match[1])
  const year = parseInt(match[2])
  const startMonth = (q - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0) // last day of quarter

  const weeks: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    weeks.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  // Ensure we include the end
  if (weeks[weeks.length - 1] < end) {
    weeks.push(new Date(end))
  }
  return weeks
}

function formatWeekLabel(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

export function QuarterBurndownChart({ deliverables, quarter }: QuarterBurndownChartProps) {
  const data = useMemo<BurndownPoint[]>(() => {
    const weeks = getQuarterWeeks(quarter)
    if (weeks.length === 0 || deliverables.length === 0) return []

    const total = deliverables.length
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    return weeks.map((weekDate) => {
      // Planned: how many should be done by this week (target_date <= weekDate)
      const plannedDone = deliverables.filter(d => {
        if (!d.targetDate) return false
        return new Date(d.targetDate) <= weekDate
      }).length

      // Actual: how many are actually done by this week
      // For past weeks: count items with status 'done' whose target was <= this week
      // For future weeks: we don't know yet, so use current done count
      let actualDone: number
      if (weekDate <= today) {
        // Count deliverables that are done (completed by or before this week)
        actualDone = deliverables.filter(d => {
          if (d.status !== 'done') return false
          if (d.completedDate) return new Date(d.completedDate) <= weekDate
          // No completed_date but status is done — count if target was <= this week
          return d.targetDate ? new Date(d.targetDate) <= weekDate : true
        }).length
      } else {
        // Future: don't plot actual
        actualDone = NaN
      }

      return {
        week: weekDate.toISOString().slice(0, 10),
        weekLabel: formatWeekLabel(weekDate),
        planned: total - plannedDone, // remaining
        actual: isNaN(actualDone) ? undefined as unknown as number : total - actualDone, // remaining
      }
    })
  }, [deliverables, quarter])

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">No deliverable timeline data available.</p>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Deliverable Burndown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'planned' ? 'Plan (remaining)' : 'Actual (remaining)',
            ]}
          />
          <Area
            type="monotone"
            dataKey="planned"
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            fill="none"
            strokeWidth={2}
            name="planned"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="hsl(142.1 76.2% 36.3%)"
            fill="hsl(142.1 76.2% 36.3%)"
            fillOpacity={0.15}
            strokeWidth={2}
            name="actual"
            dot={false}
            connectNulls={false}
          />
          <ReferenceLine
            x={formatWeekLabel(new Date())}
            stroke="hsl(var(--foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: "Today", position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
