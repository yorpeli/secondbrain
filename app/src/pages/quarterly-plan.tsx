import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarRange } from "lucide-react"
import { useQuarterlyPlan, useQuarterlyPlanQuarters } from "@/hooks/use-quarterly-plan"
import { QuarterAggregateBar } from "@/components/quarterly-plan/quarter-aggregate-bar"
import { InitiativeScoreboard } from "@/components/quarterly-plan/initiative-scoreboard"
import type { InitiativeGroup } from "@/components/quarterly-plan/initiative-scoreboard"
import { InitiativeDetailPanel } from "@/components/quarterly-plan/initiative-detail-panel"
import { Skeleton } from "@/components/ui/skeleton"

export function QuarterlyPlanPage() {
  const { data: quarters, isLoading: quartersLoading } = useQuarterlyPlanQuarters()
  const activeQuarter = quarters?.find(q => q.status === 'active')?.quarter
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const quarter = selectedQuarter ?? activeQuarter ?? ''
  const { data: items, isLoading, error } = useQuarterlyPlan(quarter)

  // Group items by initiative
  const grouped = useMemo<InitiativeGroup[]>(() => {
    if (!items) return []
    const map = new Map<string, InitiativeGroup>()
    for (const item of items) {
      const key = item.initiativeSlug ?? 'unlinked'
      if (!map.has(key)) {
        map.set(key, {
          initiative: item.initiativeTitle ?? 'Unlinked Items',
          slug: item.initiativeSlug,
          priority: item.initiativePriority,
          items: [],
        })
      }
      map.get(key)!.items.push(item)
    }
    return Array.from(map.values()).sort((a, b) => {
      const pOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
      return (pOrder[a.priority ?? 'P2'] ?? 3) - (pOrder[b.priority ?? 'P2'] ?? 3)
    })
  }, [items])

  // Auto-select first initiative on load / quarter change
  useEffect(() => {
    setSelectedSlug(grouped[0]?.slug ?? null)
  }, [grouped])

  // Scroll to detail panel on selection change
  useEffect(() => {
    if (selectedSlug && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [selectedSlug])

  const selectedGroup = grouped.find(g => g.slug === selectedSlug) ?? null

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load quarterly plan: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quarterly Plan</h1>
            {!isLoading && items && (
              <p className="text-sm text-muted-foreground">
                {grouped.length} initiative{grouped.length !== 1 ? 's' : ''} · {items.length} plan items
              </p>
            )}
          </div>
        </div>

        {!quartersLoading && quarters && quarters.length > 0 && (
          <select
            value={quarter}
            onChange={e => setSelectedQuarter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {quarters.map(q => (
              <option key={q.quarter} value={q.quarter}>
                {q.quarter}{q.status === 'active' ? ' (active)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : !items?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No plan items for {quarter}.</p>
        </div>
      ) : (
        <>
          {/* Aggregate bar */}
          <QuarterAggregateBar items={items} />

          {/* Initiative scoreboard */}
          <InitiativeScoreboard
            groups={grouped}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
          />

          {/* Detail panel */}
          <div ref={detailRef}>
            <InitiativeDetailPanel
              group={selectedGroup}
              onClose={() => setSelectedSlug(null)}
            />
          </div>
        </>
      )}
    </div>
  )
}
