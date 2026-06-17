import { useEffect, useMemo, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTriageCards, useApplyFeedback, useMarkRead, usePushOutlookDraft } from "@/hooks/use-triage"
import { useTheme } from "@/components/layout/theme-provider"
import { TriageList } from "@/components/triage/triage-list"
import { TriageDetail } from "@/components/triage/triage-detail"
import { Skeleton } from "@/components/ui/skeleton"

export function TriagePage() {
  const { data: cards, isLoading, error } = useTriageCards()
  const apply = useApplyFeedback()
  const markRead = useMarkRead()
  const pushDraft = usePushOutlookDraft()
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

  const setStatus = (to: "sent" | "dismissed") => {
    if (selected) apply.mutate({ predictionId: selected.id, kind: "status", payload: { to } })
  }

  const ThemeToggle = (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
    </button>
  )

  return (
    // Cancel the AppShell padding and fill the content area; manage own scroll.
    <div className="-m-6 flex h-screen overflow-hidden bg-background lg:-m-8">
      {error ? (
        <div className="m-6 flex-1 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load triage: {(error as Error).message}
          </p>
        </div>
      ) : isLoading ? (
        <>
          <div className="w-[312px] shrink-0 space-y-2 border-r border-border bg-card p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        </>
      ) : !list.length ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Inbox clear — no open cards.</p>
        </div>
      ) : (
        <>
          {/* ═══════════ QUEUE ═══════════ */}
          <section className="flex w-[312px] shrink-0 flex-col border-r border-border bg-card">
            <div className="border-b border-border px-4 pb-3 pt-4">
              <div className="flex items-baseline gap-2">
                <h1 className="text-[15px] font-semibold tracking-[-0.01em]">Comms Triage</h1>
                <span className="text-xs text-muted-foreground">{list.length} open</span>
              </div>
            </div>
            <TriageList cards={list} selectedId={selectedId} onSelect={onSelect} />
          </section>

          {/* ═══════════ WORKSPACE ═══════════ */}
          <section className="flex min-w-0 flex-1 flex-col bg-background">
            {/* workspace top bar */}
            <div className="flex shrink-0 items-center gap-3.5 border-b border-border bg-card px-6 py-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">Card</span>
                <span className="text-xs font-semibold text-foreground">
                  {selectedIndex >= 0 ? selectedIndex + 1 : "—"}{" "}
                  <span className="font-normal text-muted-foreground/70">of {list.length}</span>
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setStatus("dismissed")}
                  disabled={!selected}
                  className="rounded-lg border border-border px-[11px] py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setStatus("sent")}
                  disabled={!selected}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                  style={{
                    color: "#86efac",
                    background: "rgba(52,211,153,0.1)",
                    borderColor: "rgba(52,211,153,0.3)",
                  }}
                >
                  Mark sent
                </button>
                {selected &&
                  (selected.channel === "outlook" || selected.channel === "email") && (
                    <button
                      onClick={() => {
                        if (markRead.isPending) return
                        markRead.mutate(selected.id)
                      }}
                      disabled={markRead.isPending}
                      title="Marks the email read in Outlook (next sync run) and dismisses this card"
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: "#fcd34d",
                        background: "rgba(251,191,36,0.1)",
                        borderColor: "rgba(251,191,36,0.35)",
                      }}
                    >
                      {markRead.isPending ? "Marking…" : "✓ Mark read"}
                    </button>
                  )}
                {selected &&
                  (selected.channel === "outlook" || selected.channel === "email") &&
                  !!(selected.edited_reply ?? selected.predicted_reply) && (
                    <button
                      onClick={() => {
                        if (pushDraft.isPending) return
                        pushDraft.mutate(selected)
                      }}
                      disabled={pushDraft.isPending}
                      title="Opens a pre-filled, reviewable draft in Outlook (does not send). Requires the local bridge: npm run outlook-bridge"
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: "#93c5fd",
                        background: "rgba(59,130,246,0.1)",
                        borderColor: "rgba(59,130,246,0.35)",
                      }}
                    >
                      {pushDraft.isPending
                        ? "Opening…"
                        : pushDraft.isError
                        ? "⚠ " + (pushDraft.error as Error).message
                        : pushDraft.isSuccess
                        ? "Draft opened ✓"
                        : "✉ Push to Outlook draft"}
                    </button>
                  )}
                {ThemeToggle}
              </div>
            </div>

            {/* card header + 3-column grid */}
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
          </section>
        </>
      )}
    </div>
  )
}
