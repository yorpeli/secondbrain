import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PersonDetail } from '@/lib/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function OneOnOneCard({ person }: { person: PersonDetail }) {
  const [expanded, setExpanded] = useState<string | null>(person.recentOneOnOnes[0]?.id ?? null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">1:1 continuity</CardTitle>
        {person.nextOneOnOne && (
          <p className="text-xs text-muted-foreground">Next 1:1 scheduled {person.nextOneOnOne.date}</p>
        )}
      </CardHeader>
      <CardContent>
        {person.recentOneOnOnes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No 1:1 notes logged.</p>
        ) : (
          <div className="space-y-2">
            {person.recentOneOnOnes.map(m => {
              const open = expanded === m.id
              return (
                <div key={m.id} className="rounded-md border">
                  <button
                    onClick={() => setExpanded(open ? null : m.id)}
                    className="flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm"
                  >
                    <span className="font-medium">{m.topic ?? '1:1'}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </button>
                  {open && m.notes && (
                    <div className="border-t p-2.5 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.notes}</Markdown>
                    </div>
                  )}
                  {open && !m.notes && (
                    <div className="border-t p-2.5 text-sm text-muted-foreground">No notes recorded.</div>
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
