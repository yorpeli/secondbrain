import { cn } from "@/lib/utils"
import type { TriageCard } from "@/lib/triage-types"
import {
  ChannelIcon,
  DispositionBadge,
  ConfidenceBadge,
  NeedsDataBadge,
  AgeBadge,
  TierBadge,
  VerdictFlagBadge,
  verdictFlagged,
  parseTrigger,
} from "./triage-bits"

export function TriageList({
  cards,
  selectedId,
  onSelect,
}: {
  cards: TriageCard[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <nav className="w-[300px] shrink-0 overflow-y-auto border-r border-border bg-muted/40">
      {cards.map((c, i) => {
        const fb = parseTrigger(c.trigger_text)
        const subject = c.card?.email.subject ?? fb.subject ?? "(no subject)"
        const from    = c.card?.email.from    ?? fb.from   ?? "—"
        const date    = c.card?.email.date    ?? fb.date   ?? "—"
        const active = c.id === selectedId
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "block w-full cursor-pointer border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent/60",
              active && "bg-accent/60 shadow-[inset_3px_0_0_var(--primary)]"
            )}
          >
            <div className="mb-1 flex items-start gap-1.5 text-[13px] font-semibold leading-snug">
              <span className="mt-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <ChannelIcon channel={c.channel} className="mt-0.5 h-3.5 w-3.5" />
              <span className="flex-1">{subject}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {from} · {date}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <DispositionBadge type={c.action_type} />
              {c.needs_data && <NeedsDataBadge />}
              <ConfidenceBadge value={c.confidence} />
              <AgeBadge date={date === "—" ? null : date} />
              <TierBadge tier={c.tier} />
              {verdictFlagged(c.verdict) && <VerdictFlagBadge />}
            </div>
          </button>
        )
      })}
    </nav>
  )
}
