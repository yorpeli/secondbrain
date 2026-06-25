import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'
import { Lock } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function CoachingCard({ person }: { person: PersonDetail }) {
  const hasContent = person.coaching.length > 0 || person.perfReview !== null
  const latestCoaching = person.coaching.find(c => c.sectionType === 'coaching-log')
  const latestDevPlan = person.coaching.find(c => c.sectionType === 'dev-plan')

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Coaching & development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!hasContent && <p className="text-muted-foreground">Nothing logged yet.</p>}

        {person.perfReview && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Latest review</div>
            <div className="flex items-center gap-2">
              {person.perfReview.overallRating && <Badge variant="purple">{person.perfReview.overallRating}</Badge>}
              <span className="text-xs text-muted-foreground">
                {person.perfReview.reviewPeriod ?? person.perfReview.reviewDate ?? ''}
              </span>
            </div>
          </div>
        )}

        {latestCoaching && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Latest coaching log{latestCoaching.date ? ` · ${latestCoaching.date}` : ''}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
              <Markdown remarkPlugins={[remarkGfm]}>{latestCoaching.content}</Markdown>
            </div>
          </div>
        )}

        {latestDevPlan && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Development plan{latestDevPlan.date ? ` · ${latestDevPlan.date}` : ''}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
              <Markdown remarkPlugins={[remarkGfm]}>{latestDevPlan.content}</Markdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
