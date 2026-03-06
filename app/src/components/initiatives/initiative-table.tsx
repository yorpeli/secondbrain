import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import type { Initiative } from "@/lib/types"
import { StatusBadge } from "./status-badge"
import { PriorityBadge } from "./priority-badge"
import { StalenessIndicator } from "./staleness-indicator"
import { TaskProgress } from "./task-progress"
import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"

type SortKey = 'title' | 'priority' | 'status' | 'targetDate' | 'memoryLastUpdated'
type SortDir = 'asc' | 'desc'

const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

interface InitiativeTableProps {
  initiatives: Initiative[]
}

export function InitiativeTable({ initiatives }: InitiativeTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    return [...initiatives].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'targetDate':
          cmp = (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999')
          break
        case 'memoryLastUpdated':
          cmp = (a.memoryLastUpdated ?? '0000').localeCompare(b.memoryLastUpdated ?? '0000')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [initiatives, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    return (
      <button
        onClick={() => toggleSort(sortKeyName)}
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors",
          sortKey === sortKeyName ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left"><SortHeader label="Title" sortKeyName="title" /></th>
            <th className="px-4 py-3 text-left"><SortHeader label="Status" sortKeyName="status" /></th>
            <th className="px-4 py-3 text-left"><SortHeader label="Priority" sortKeyName="priority" /></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Owner</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tasks</th>
            <th className="px-4 py-3 text-left"><SortHeader label="Memory" sortKeyName="memoryLastUpdated" /></th>
            <th className="px-4 py-3 text-left"><SortHeader label="Target" sortKeyName="targetDate" /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(initiative => (
            <tr
              key={initiative.id}
              onClick={() => navigate(`/initiatives/${initiative.slug}`)}
              className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-medium text-foreground hover:underline">
                  {initiative.title}
                </span>
              </td>
              <td className="px-4 py-3"><StatusBadge status={initiative.status} /></td>
              <td className="px-4 py-3"><PriorityBadge priority={initiative.priority} /></td>
              <td className="px-4 py-3 text-muted-foreground">{initiative.ownerName ?? "—"}</td>
              <td className="px-4 py-3">
                {initiative.assignedAgent ? (
                  <span className="text-xs font-mono text-muted-foreground">{initiative.assignedAgent}</span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3"><TaskProgress initiative={initiative} /></td>
              <td className="px-4 py-3"><StalenessIndicator lastUpdated={initiative.memoryLastUpdated} /></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {initiative.targetDate ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
