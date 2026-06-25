import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate, commitmentStatus } from '@/lib/people-data'
import type { PersonDetail } from '@/lib/types'

const STATUS = {
  overdue: { dot: 'bg-red-500', label: 'Overdue', badge: 'destructive' as const },
  'due-soon': { dot: 'bg-amber-500', label: 'Due soon', badge: 'warning' as const },
  open: { dot: 'bg-muted-foreground/40', label: 'Open', badge: 'outline' as const },
}

export function OpenItemsCard({ person }: { person: PersonDetail }) {
  const todayISO = new Date().toISOString().slice(0, 10)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
        <span className="text-sm font-semibold text-foreground">Open commitments</span>
        <span className="text-xs text-muted-foreground">
          {person.openItems.length} open · sorted by due date
        </span>
      </div>
      {person.openItems.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">No open items logged.</p>
      ) : (
        person.openItems.map(item => {
          const s = STATUS[commitmentStatus(item.dueDate, todayISO)]
          return (
            <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 border-t px-4 py-2.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', s.dot)} />
              <span className="line-clamp-1 min-w-0 flex-1 text-sm text-foreground">{item.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.dueDate ? formatDate(item.dueDate) : 'No date'}
              </span>
              <Badge variant={s.badge}>{s.label}</Badge>
            </div>
          )
        })
      )}
    </Card>
  )
}
