import { usePersonDetail } from '@/hooks/use-people'
import { PersonHeroCard } from './person-hero-card'
import { AgendaCard } from './agenda-card'
import { CurrentFocusCard } from './current-focus-card'
import { OpenItemsCard } from './open-items-card'
import { OneOnOneCard } from './one-on-one-card'
import { CoachingCard } from './coaching-card'
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
        <Skeleton className="h-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
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
      <PersonHeroCard person={person} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-4">
          <AgendaCard person={person} />
          <CurrentFocusCard person={person} />
          <OpenItemsCard person={person} />
        </div>
        <div className="flex flex-col gap-4">
          <OneOnOneCard person={person} />
          <CoachingCard person={person} />
        </div>
      </div>
    </div>
  )
}
