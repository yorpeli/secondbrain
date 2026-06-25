import { usePersonDetail } from '@/hooks/use-people'
import { PersonHeaderCard } from './person-header-card'
import { CurrentFocusCard } from './current-focus-card'
import { TeamWorkCard } from './team-work-card'
import { OpenItemsCard } from './open-items-card'
import { OneOnOneCard } from './one-on-one-card'
import { Skeleton } from '@/components/ui/skeleton'

export function PersonDetailView({ slug }: { slug: string }) {
  const { data: person, isLoading, error } = usePersonDetail(slug)

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load person: {(error as Error).message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Person not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PersonHeaderCard person={person} />
      <CurrentFocusCard person={person} />
      <TeamWorkCard person={person} />
      <OpenItemsCard person={person} />
      <OneOnOneCard person={person} />
    </div>
  )
}
