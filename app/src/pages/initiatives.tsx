import { useState, useMemo } from "react"
import { useInitiatives } from "@/hooks/use-initiatives"
import { InitiativeTable } from "@/components/initiatives/initiative-table"
import { InitiativeFilters, type Filters } from "@/components/initiatives/initiative-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, Search } from "lucide-react"

export function InitiativesPage() {
  const { data: initiatives, isLoading, error } = useInitiatives()
  const [filters, setFilters] = useState<Filters>({ status: [], priority: [] })
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!initiatives) return []
    return initiatives.filter(i => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filters.status.length > 0 && !filters.status.includes(i.status)) return false
      if (filters.priority.length > 0 && !filters.priority.includes(i.priority)) return false
      return true
    })
  }, [initiatives, filters, search])

  const agentOptions = useMemo(() => {
    if (!initiatives) return []
    const agents = new Set(initiatives.map(i => i.assignedAgent).filter(Boolean) as string[])
    return Array.from(agents).sort()
  }, [initiatives])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load initiatives: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Initiatives</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {initiatives?.length ?? 0} initiatives
            </p>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search initiatives..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </div>

      <InitiativeFilters
        filters={filters}
        onChange={setFilters}
        agentOptions={agentOptions}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No initiatives match your filters.</p>
        </div>
      ) : (
        <InitiativeTable initiatives={filtered} />
      )}
    </div>
  )
}
