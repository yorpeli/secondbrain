import { cn } from "@/lib/utils"
import type { TriageCard } from "@/lib/triage-types"
import {
  ChannelIcon,
  actionMeta,
  actionLabel,
  daysWaiting,
  FLAG_AMBER,
  verdictFlagged,
  parseTrigger,
} from "./triage-bits"

const pill =
  "inline-flex items-center rounded text-[9.5px] font-semibold uppercase tracking-[0.02em] px-1.5 py-0.5 leading-none"

function relativeAge(date: string | null): string | null {
  const d = daysWaiting(date)
  if (d == null) return null
  if (d <= 0) return "today"
  if (d === 1) return "1d ago"
  return `${d}d ago`
}

export function TriageList({
  cards,
  selectedId,
  onSelect,
}: {
  cards: TriageCard[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Sort newest→oldest by the actual MESSAGE date (card.email.date / trigger fallback), not
  // created_at — a sweep batch-inserts all rows in one transaction so their created_at is ~identical
  // and would render in arbitrary order. Dateless rows sink to the bottom (created_at desc tiebreak).
  const sorted = [...cards].sort((a, b) => {
    const da = a.card?.email.date ?? parseTrigger(a.trigger_text).date ?? ""
    const db = b.card?.email.date ?? parseTrigger(b.trigger_text).date ?? ""
    if (da && db && da !== db) return db.localeCompare(da)
    if (da && !db) return -1
    if (!da && db) return 1
    return (b.created_at ?? "").localeCompare(a.created_at ?? "")
  })
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto">
      {sorted.map((c, i) => {
        const fb = parseTrigger(c.trigger_text)
        const subject = c.card?.email.subject ?? fb.subject ?? "(no subject)"
        const from = c.card?.email.from ?? fb.from ?? "—"
        const date = c.card?.email.date ?? fb.date ?? "—"
        const active = c.id === selectedId
        const age = relativeAge(date === "—" ? null : date)
        const days = daysWaiting(date === "—" ? null : date)
        const actType = c.action_type ?? "none"
        const actColor = (actionMeta[actType] ?? actionMeta.none).color
        const flagged = verdictFlagged(c.verdict)
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "block w-full cursor-pointer border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60",
              active && "bg-muted shadow-[inset_3px_0_0_var(--primary)]"
            )}
          >
            <div className="mb-1 flex items-start gap-[7px]">
              <span
                className={cn(
                  "mt-px inline-flex h-[17px] min-w-[17px] items-center justify-center rounded px-1 text-[10px] font-bold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <ChannelIcon channel={c.channel} className="mt-[3px] h-[13px] w-[13px]" />
              <span
                className={cn(
                  "line-clamp-2 flex-1 text-[12.5px] font-semibold leading-[1.35]",
                  active ? "text-foreground" : "text-foreground/90"
                )}
              >
                {subject}
              </span>
            </div>
            <div className="mb-1.5 text-[11px] text-muted-foreground">
              {from}
              {age && ` · ${age}`}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {/* disposition — colored by action */}
              <span
                className={pill}
                style={{ background: `${actColor}24`, color: actColor }}
              >
                {actionLabel(actType)}
              </span>
              {c.confidence && (
                <span className={cn(pill, "bg-muted text-muted-foreground")}>
                  {c.confidence}
                </span>
              )}
              {c.tier === 2 && (
                <span
                  className={pill}
                  style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}
                >
                  T2
                </span>
              )}
              {flagged && (
                <span
                  className={pill}
                  style={{ background: "rgba(251,191,36,0.16)", color: FLAG_AMBER }}
                >
                  ⚠
                </span>
              )}
              {days != null && days >= 7 && (
                <span
                  className={pill}
                  style={{ background: "#431407", color: "#fdba74" }}
                  title={`awaiting a reply ~${days} days`}
                >
                  ⏳ {days}d
                </span>
              )}
            </div>
          </button>
        )
      })}
    </nav>
  )
}
