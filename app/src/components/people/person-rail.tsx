import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/people-data'
import { ATTENTION } from './attention'
import type { DirectReportSummary } from '@/lib/types'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function nextLabel(p: DirectReportSummary): { text: string; stale: boolean } {
  if (p.nextOneOnOne) return { text: `Next 1:1 ${formatDate(p.nextOneOnOne)}`, stale: false }
  if (p.daysSinceLast != null) return { text: `No 1:1 in ${p.daysSinceLast}d`, stale: true }
  return { text: 'No 1:1s', stale: true }
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{children}</span>
    </div>
  )
}

function WeekSummary({ people }: { people: DirectReportSummary[] }) {
  const scheduled = people.filter(p => p.nextOneOnOne).length
  const openItems = people.reduce((s, p) => s + p.openItemsCount, 0)
  const overdue = people.reduce((s, p) => s + p.overdueCount, 0)
  const cadences = people.map(p => p.cadenceDays).filter((d): d is number => d != null)
  const avgCadence = cadences.length > 0 ? Math.round(cadences.reduce((s, d) => s + d, 0) / cadences.length) : null

  return (
    <div className="mt-4 space-y-1.5 rounded-lg border bg-muted/40 p-3">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">This week</div>
      <SummaryRow label="1:1s scheduled">{scheduled}</SummaryRow>
      <SummaryRow label="Open items">
        {openItems}
        {overdue > 0 && <span className="text-destructive"> · {overdue} overdue</span>}
      </SummaryRow>
      <SummaryRow label="Avg cadence">{avgCadence != null ? `${avgCadence}d` : '-'}</SummaryRow>
    </div>
  )
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
    <div>
      <div className="px-1.5 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Direct reports
      </div>
      <nav aria-label="Direct reports" className="space-y-1">
        {people.map(p => {
          const selected = p.slug === selectedSlug
          const next = nextLabel(p)
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onSelect(p.slug)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border border-l-[3px] p-2.5 text-left transition-colors',
                selected
                  ? 'border-border border-l-primary bg-accent'
                  : 'border-transparent border-l-transparent hover:bg-accent/50',
              )}
            >
              <span className="relative shrink-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(p.name)}
                </span>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                    ATTENTION[p.attention].dot,
                  )}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className={cn('truncate text-xs', next.stale ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground')}>
                  {next.text}
                </div>
              </div>
              {p.overdueCount > 0 && (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10.5px] font-bold text-destructive">
                  {p.overdueCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <WeekSummary people={people} />
    </div>
  )
}
