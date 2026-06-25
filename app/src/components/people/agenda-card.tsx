import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PersonDetail, PersonAgendaItem } from '@/lib/types'

const TAG_STYLE: Record<PersonAgendaItem['tag'], string> = {
  Focus: 'bg-primary/10 text-primary',
  Overdue: 'bg-destructive/10 text-destructive',
  Cadence: 'bg-destructive/10 text-destructive',
  'Carry-over': 'bg-muted text-muted-foreground',
  Blocker: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Growth: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Topic: 'bg-muted text-muted-foreground',
  Ramp: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

export function AgendaCard({ person }: { person: PersonDetail }) {
  return (
    <Card className="overflow-hidden border-primary/30">
      <div className="border-b border-primary/30 bg-accent px-4 py-3">
        <div className="text-sm font-bold">To cover in your next 1:1</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Auto-assembled from overdue items, carry-overs &amp; cadence
        </div>
      </div>
      <div className="px-2 py-1.5">
        {person.agenda.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nothing flagged - your 1:1 is clear.</p>
        ) : (
          person.agenda.map((a, i) => (
            <div
              key={`${a.tag}-${i}`}
              className="flex items-start gap-3 border-b border-border/60 px-2 py-2.5 last:border-0"
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-[1.5px] border-muted-foreground/40" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{a.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{a.meta}</div>
              </div>
              <span className={cn('shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold', TAG_STYLE[a.tag])}>
                {a.tag}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
