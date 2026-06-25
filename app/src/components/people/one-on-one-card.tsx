import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/people-data'
import type { PersonDetail } from '@/lib/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function OneOnOneCard({ person }: { person: PersonDetail }) {
  const [expanded, setExpanded] = useState<string | null>(person.recentOneOnOnes[0]?.id ?? null)
  const sessions = person.recentOneOnOnes

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <span className="text-sm font-semibold text-foreground">1:1 continuity</span>
        <span className="text-xs text-muted-foreground">{sessions.length} sessions</span>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No 1:1 notes logged.</p>
        ) : (
          <div>
            {sessions.map((m, i) => {
              const open = expanded === m.id
              return (
                <div key={m.id} className="relative border-l-2 border-border pb-4 pl-5 last:pb-0">
                  <span
                    className={cn(
                      'absolute -left-[7px] top-0.5 h-3 w-3 rounded-full border-2 border-background',
                      i === 0 ? 'bg-primary' : 'bg-muted-foreground/40',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : m.id)}
                    aria-expanded={open}
                    className="flex w-full flex-wrap items-center gap-2 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground">{m.topic ?? '1:1'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                  </button>
                  {open && m.notes ? (
                    <div className="prose prose-sm dark:prose-invert mt-1 max-w-none prose-p:my-1.5">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.notes}</Markdown>
                    </div>
                  ) : (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.notes ?? 'No notes recorded.'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
