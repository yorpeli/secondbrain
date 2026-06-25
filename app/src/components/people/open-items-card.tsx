import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'

export function OpenItemsCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Open items ({person.openItems.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {person.openItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open items logged.</p>
        ) : (
          <ul className="space-y-2">
            {person.openItems.map(item => (
              <li key={`${item.kind}-${item.id}`} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span>{item.title}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={item.kind === 'task' ? 'info' : 'secondary'}>
                      {item.kind === 'task' ? 'Task' : 'Action item'}
                    </Badge>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{item.dueDate ?? 'No date'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
