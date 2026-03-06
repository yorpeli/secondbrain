import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

const statusOptions: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "exploration", label: "Exploration" },
  { value: "completed", label: "Completed" },
]

const priorityOptions: FilterOption[] = [
  { value: "P0", label: "P0" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
]

export interface Filters {
  status: string[]
  priority: string[]
}

interface InitiativeFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  agentOptions: string[]
}

export function InitiativeFilters({ filters, onChange, agentOptions: _agentOptions }: InitiativeFiltersProps) {
  const hasFilters = filters.status.length > 0 || filters.priority.length > 0

  function toggleFilter(key: keyof Filters, value: string) {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  function clearFilters() {
    onChange({ status: [], priority: [] })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
        {statusOptions.map(opt => (
          <Button
            key={opt.value}
            variant={filters.status.includes(opt.value) ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => toggleFilter("status", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</span>
        {priorityOptions.map(opt => (
          <Button
            key={opt.value}
            variant={filters.priority.includes(opt.value) ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => toggleFilter("priority", opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {hasFilters && (
        <>
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Clear
          </Button>
        </>
      )}
    </div>
  )
}
