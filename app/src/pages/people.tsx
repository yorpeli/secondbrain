import { useState, useEffect } from 'react'
import { useDirectReports } from '@/hooks/use-people'
import { PersonRail } from '@/components/people/person-rail'
import { PersonDetailView } from '@/components/people/person-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

export function PeoplePage() {
  const { data: people, isLoading, error } = useDirectReports()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  // Default selection: first direct once loaded
  useEffect(() => {
    if (!selectedSlug && people && people.length > 0) {
      setSelectedSlug(people[0].slug)
    }
  }, [people, selectedSlug])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load people: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">{people?.length ?? 0} direct reports</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : people && people.length > 0 ? (
            <PersonRail people={people} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No direct reports found.</p>
            </div>
          )}
        </div>
        <div>
          {selectedSlug ? (
            <PersonDetailView slug={selectedSlug} />
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">Select a person to see details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
