import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/people-data'
import type { PersonDetail } from '@/lib/types'
import { Lock } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function CoachingCard({ person }: { person: PersonDetail }) {
  const latestCoaching = person.coaching.find(c => c.sectionType === 'coaching-log')
  const latestDevPlan = person.coaching.find(c => c.sectionType === 'dev-plan')
  const hasStrengthsGrowth = person.strengths.length > 0 || person.growthAreas.length > 0
  const hasNotes = latestCoaching !== undefined || latestDevPlan !== undefined || person.perfReview !== null
  const hasContent = hasStrengthsGrowth || hasNotes

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">Coaching &amp; development</span>
        <span className="ml-auto text-[10px] text-muted-foreground">Private to you</span>
      </div>

      {!hasContent && <p className="text-sm text-muted-foreground">Nothing logged yet.</p>}

      {hasStrengthsGrowth && (
        <div className="mb-3.5 flex gap-4">
          <div className="flex-1">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Strengths</div>
            <div className="flex flex-wrap gap-1.5">
              {person.strengths.map(s => <Badge key={s} variant="success">{s}</Badge>)}
              {person.strengths.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Growth areas</div>
            <div className="flex flex-wrap gap-1.5">
              {person.growthAreas.map(g => <Badge key={g} variant="warning">{g}</Badge>)}
              {person.growthAreas.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
            </div>
          </div>
        </div>
      )}

      {hasNotes && (
        <div className="space-y-3 border-t pt-3 text-sm">
          {person.perfReview && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Latest review</span>
              {person.perfReview.overallRating && <Badge variant="purple">{person.perfReview.overallRating}</Badge>}
              <span className="text-xs text-muted-foreground">
                {person.perfReview.reviewPeriod ?? formatDate(person.perfReview.reviewDate)}
              </span>
            </div>
          )}
          {latestCoaching && (
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                Latest coaching log{latestCoaching.date ? ` · ${formatDate(latestCoaching.date)}` : ''}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
                <Markdown remarkPlugins={[remarkGfm]}>{latestCoaching.content}</Markdown>
              </div>
            </div>
          )}
          {latestDevPlan && (
            <div>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">
                Development plan{latestDevPlan.date ? ` · ${formatDate(latestDevPlan.date)}` : ''}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
                <Markdown remarkPlugins={[remarkGfm]}>{latestDevPlan.content}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
