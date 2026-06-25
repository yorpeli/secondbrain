import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate, daysSince } from '@/lib/people-data'
import { ATTENTION } from './attention'
import type { PersonDetail } from '@/lib/types'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function nextDisplay(person: PersonDetail, todayISO: string): { big: string; sub: string } {
  const next = person.nextOneOnOne
  if (person.nextKind === 'none' || !next) {
    return {
      big: 'Unscheduled',
      sub: person.daysSinceLast != null ? `Last met ${person.daysSinceLast}d ago` : 'No 1:1s yet',
    }
  }
  if (person.nextKind === 'today') {
    return { big: 'Today', sub: formatDate(next.date) }
  }
  const until = -(daysSince(next.date, todayISO) ?? 0)
  return { big: formatDate(next.date), sub: until === 1 ? 'in 1 day' : `in ${until} days` }
}

function Tile({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={cn('flex-1 rounded-lg border bg-background p-3', alert && 'border-destructive/40')}>
      <div className={cn('text-xs font-semibold', alert ? 'text-destructive' : 'text-muted-foreground')}>{label}</div>
      <div className={cn('mt-1 text-lg font-bold', alert ? 'text-destructive' : 'text-foreground')}>{value}</div>
    </div>
  )
}

export function PersonHeroCard({ person }: { person: PersonDetail }) {
  const todayISO = new Date().toISOString().slice(0, 10)
  const att = ATTENTION[person.attention]
  const next = nextDisplay(person, todayISO)
  const isToday = person.nextKind === 'today'
  const isUnscheduled = person.nextKind === 'none'
  const review = person.perfReview
    ? `${person.perfReview.overallRating ?? 'Reviewed'}${person.perfReview.reviewPeriod ? ` · ${person.perfReview.reviewPeriod}` : ''}`
    : 'No review'

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-b from-background to-muted/30 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-semibold text-secondary-foreground">
            {initials(person.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight">{person.name}</h2>
              <Badge variant={att.badge}>{att.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {person.role}
              {person.teamName ? ` · ${person.teamName}` : ''} · reports to you
            </p>
            {person.workingStyle && <p className="mt-1.5 text-xs text-muted-foreground">{person.workingStyle}</p>}
          </div>
          <div
            className={cn(
              'flex min-w-[170px] items-center gap-3 rounded-xl border p-3',
              isToday && 'border-primary/40 bg-accent',
              isUnscheduled && 'border-destructive/40 bg-destructive/5',
            )}
          >
            <div className="flex-1">
              <div className={cn('text-[10.5px] font-bold uppercase tracking-wide', isUnscheduled ? 'text-destructive' : 'text-muted-foreground')}>
                Next 1:1
              </div>
              <div className={cn('mt-0.5 text-base font-bold', isToday ? 'text-primary' : isUnscheduled ? 'text-destructive' : 'text-foreground')}>
                {next.big}
              </div>
              <div className="text-xs text-muted-foreground">{next.sub}</div>
            </div>
            {isToday && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />}
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <Tile label="Open commitments" value={String(person.openItems.length)} />
          <Tile label="Overdue" value={String(person.overdueCount)} alert={person.overdueCount > 0} />
          <Tile label="1:1 cadence" value={person.cadenceLabel ?? '-'} />
          <Tile label="Latest review" value={review} />
        </div>
      </div>
    </Card>
  )
}
