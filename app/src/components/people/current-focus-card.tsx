import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PersonDetail } from '@/lib/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function CurrentFocusCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Current focus</CardTitle>
      </CardHeader>
      <CardContent>
        {person.currentFocus ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
            <Markdown remarkPlugins={[remarkGfm]}>{person.currentFocus}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
