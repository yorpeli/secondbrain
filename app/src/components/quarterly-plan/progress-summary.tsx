import type { QuarterlyPlanItem } from "@/lib/types"

interface ProgressSummaryProps {
  items: QuarterlyPlanItem[]
}

export function ProgressSummary({ items }: ProgressSummaryProps) {
  const totals = items.reduce(
    (acc, item) => ({
      total: acc.total + item.totalDeliverables,
      done: acc.done + item.doneDeliverables,
      inProgress: acc.inProgress + item.inProgressDeliverables,
      atRisk: acc.atRisk + item.atRiskDeliverables,
      planned: acc.planned + item.plannedDeliverables,
      cut: acc.cut + item.cutDeliverables,
    }),
    { total: 0, done: 0, inProgress: 0, atRisk: 0, planned: 0, cut: 0 }
  )

  const pctDone = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard label="Total Deliverables" value={totals.total} />
      <SummaryCard label="Done" value={totals.done} accent="text-emerald-600 dark:text-emerald-400" />
      <SummaryCard label="In Progress" value={totals.inProgress} accent="text-blue-600 dark:text-blue-400" />
      <SummaryCard label="At Risk" value={totals.atRisk} accent="text-amber-600 dark:text-amber-400" />
      <SummaryCard label="Planned" value={totals.planned} accent="text-muted-foreground" />
      <SummaryCard label="Completion" value={`${pctDone}%`} />
    </div>
  )
}

function SummaryCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  )
}
