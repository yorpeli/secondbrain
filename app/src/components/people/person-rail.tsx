import { cn } from '@/lib/utils'
import type { DirectReportSummary } from '@/lib/types'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function PersonRail({
  people,
  selectedSlug,
  onSelect,
}: {
  people: DirectReportSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}) {
  return (
    <nav className="space-y-1">
      {people.map(p => {
        const selected = p.slug === selectedSlug
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.slug)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors',
              selected ? 'border-primary bg-accent' : 'border-transparent hover:bg-accent/50',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.teamName ?? p.role}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.openItemsCount} open item{p.openItemsCount === 1 ? '' : 's'}</span>
              <span>{p.nextOneOnOne ? `Next 1:1 ${p.nextOneOnOne}` : p.lastOneOnOne ? `Last 1:1 ${p.lastOneOnOne}` : 'No 1:1s'}</span>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
