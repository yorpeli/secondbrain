import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePersonTeamWork } from '@/hooks/use-people'
import type { PersonDetail } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function TeamWorkCard({ person }: { person: PersonDetail }) {
  const { data, isLoading } = usePersonTeamWork(person.id, person.name, person.slug)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Team work</CardTitle>
        {person.teamName && <p className="text-xs text-muted-foreground">{person.teamName}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Initiatives</div>
              {data && data.initiatives.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.initiatives.map(i => (
                    <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/initiatives/${i.slug}`} className="truncate text-primary hover:underline">
                        {i.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline">{i.priority}</Badge>
                        <Badge variant="secondary">{i.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No initiatives linked.</p>
              )}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Latest PPP status</div>
              {data?.ppp ? (
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{data.ppp.status}</Badge>
                    <span className="text-xs text-muted-foreground">{data.ppp.workstreamName} · {data.ppp.weekDate}</span>
                  </div>
                  {data.ppp.summary && <p className="mt-1.5 text-muted-foreground">{data.ppp.summary}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No PPP status logged.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
