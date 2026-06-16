import { Inbox } from "lucide-react"
import { useTriageCards, useApplyFeedback } from "@/hooks/use-triage"
import { TriageCard } from "@/components/triage/triage-card"
import { Skeleton } from "@/components/ui/skeleton"

export function TriagePage() {
  const { data: cards, isLoading, error } = useTriageCards()
  const apply = useApplyFeedback()

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load triage: {(error as Error).message}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Triage</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {cards?.length ?? 0} open {cards?.length === 1 ? "card" : "cards"}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !cards?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Inbox clear — no open cards.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((c) => (
            <TriageCard
              key={c.id}
              card={c}
              onFeedback={(kind, payload) =>
                apply.mutate({ predictionId: c.id, kind, payload })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
