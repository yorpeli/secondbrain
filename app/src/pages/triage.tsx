import { useEffect, useMemo, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTriageCards, useApplyFeedback } from "@/hooks/use-triage"
import { useTheme } from "@/components/layout/theme-provider"
import { TriageList } from "@/components/triage/triage-list"
import { TriageDetail } from "@/components/triage/triage-detail"
import { Skeleton } from "@/components/ui/skeleton"

export function TriagePage() {
  const { data: cards, isLoading, error } = useTriageCards()
  const apply = useApplyFeedback()
  const { theme, setTheme } = useTheme()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const list = useMemo(() => cards ?? [], [cards])

  // Keep a valid selection. When the selected card leaves the open queue
  // (status change → refetch), advance to the card that took its slot, or
  // the previous one, so the page never points at a missing card.
  const [prevIndex, setPrevIndex] = useState(0)
  useEffect(() => {
    if (!list.length) {
      setSelectedId(null)
      return
    }
    const idx = list.findIndex((c) => c.id === selectedId)
    if (idx === -1) {
      const next = Math.min(prevIndex, list.length - 1)
      setSelectedId(list[next]?.id ?? list[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, selectedId])

  const selectedIndex = list.findIndex((c) => c.id === selectedId)
  const selected = selectedIndex >= 0 ? list[selectedIndex] : null

  const onSelect = (id: string) => {
    setSelectedId(id)
    setPrevIndex(list.findIndex((c) => c.id === id))
  }

  const ThemeToggle = (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground hover:bg-accent/60"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  )

  return (
    // Cancel the AppShell padding and fill the content area; manage own scroll.
    <div className="-m-6 flex h-screen flex-col overflow-hidden bg-background lg:-m-8">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-base font-semibold">Comms Triage</h1>
          {!isLoading && !error && (
            <span className="text-xs text-muted-foreground">{list.length} open</span>
          )}
        </div>
        {ThemeToggle}
      </div>

      {/* Body */}
      {error ? (
        <div className="m-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load triage: {(error as Error).message}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[300px] shrink-0 space-y-2 border-r border-border bg-muted/40 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      ) : !list.length ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Inbox clear — no open cards.</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <TriageList cards={list} selectedId={selectedId} onSelect={onSelect} />
          {selected ? (
            <TriageDetail
              key={selected.id}
              card={selected}
              index={selectedIndex}
              onFeedback={(kind, payload) =>
                apply.mutate({ predictionId: selected.id, kind, payload })
              }
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">Select a card.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
