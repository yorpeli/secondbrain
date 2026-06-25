import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'

export function PersonHeaderCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{person.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {person.role}
          {person.teamName ? ` · ${person.teamName}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {person.workingStyle && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Working style</div>
            <p>{person.workingStyle}</p>
          </div>
        )}
        {person.strengths.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Strengths</div>
            <div className="flex flex-wrap gap-1.5">
              {person.strengths.map(s => <Badge key={s} variant="success">{s}</Badge>)}
            </div>
          </div>
        )}
        {person.growthAreas.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Growth areas</div>
            <div className="flex flex-wrap gap-1.5">
              {person.growthAreas.map(g => <Badge key={g} variant="warning">{g}</Badge>)}
            </div>
          </div>
        )}
        {person.relationshipNotes && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Relationship notes</div>
            <p className="text-muted-foreground">{person.relationshipNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
