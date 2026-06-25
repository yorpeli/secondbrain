import { useState } from 'react'
import { useDirectReports } from '@/hooks/use-people'
import { PersonRail } from '@/components/people/person-rail'
import { PersonDetailView } from '@/components/people/person-detail'
import { Skeleton } from '@/components/ui/skeleton'

export function PeoplePage() {
  const { data: people, isLoading, error } = useDirectReports()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  // Default selection: first direct once loaded (derived, no setState in effect)
  const activeSlug = selectedSlug ?? people?.[0]?.slug ?? null
  const needAttention = (people ?? []).filter(p => p.attention === 'high').length

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load people: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">
            Second Brain <span className="text-muted-foreground/50">›</span> People
          </div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {people?.length ?? 0} direct reports
              {needAttention > 0 && (
                <>
                  {' · '}
                  <span className="font-semibold text-destructive">{needAttention} need attention</span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs font-medium">
          <span className="rounded-md bg-foreground px-3.5 py-1.5 text-background">Per person</span>
          <span className="cursor-not-allowed px-3.5 py-1.5 text-muted-foreground/60" title="Coming soon">Overview</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[264px_1fr]">
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : people && people.length > 0 ? (
            <PersonRail people={people} selectedSlug={activeSlug} onSelect={setSelectedSlug} />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No direct reports found.</p>
            </div>
          )}
        </div>
        <div className="min-w-0">
          {activeSlug ? (
            <PersonDetailView key={activeSlug} slug={activeSlug} />
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">Select a person to see details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
