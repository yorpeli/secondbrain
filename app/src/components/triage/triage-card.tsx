import { useState } from "react"
import { Mail, MessagesSquare, CalendarDays, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TriageCard as TriageCardType, FeedbackKind } from "@/lib/triage-types"

const channelIcon = (ch: string) =>
  ch === "teams" ? MessagesSquare : ch === "meeting" ? CalendarDays : Mail

export function TriageCard({
  card,
  onFeedback,
}: {
  card: TriageCardType
  onFeedback: (kind: FeedbackKind, payload: Record<string, unknown>) => void
}) {
  const extras = card.card?.suggestion_extras
  const baseText = card.edited_reply ?? card.predicted_reply ?? ""
  const [draft, setDraft] = useState(baseText)
  const [note, setNote] = useState("")
  const [showCtx, setShowCtx] = useState(false)
  const [showEN, setShowEN] = useState(false)
  const Icon = channelIcon(card.channel)
  const hasAlt = !!extras?.text_alt
  const shown = showEN && hasAlt ? (extras!.text_alt as string) : draft

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="uppercase tracking-wide">▸ {card.action_type ?? "none"}</span>
        {card.action_target && (
          <span className="text-muted-foreground">→ {card.action_target}</span>
        )}
        {card.sensitive && (
          <span className="ml-auto text-xs font-medium text-destructive">sensitive</span>
        )}
      </div>

      <div className="mt-2 text-sm">
        <div className="font-semibold">{card.card?.email.subject ?? "(no subject)"}</div>
        <div className="text-xs text-muted-foreground">
          {card.card?.email.from} · {card.card?.email.date}
        </div>
        {card.card?.email.excerpt && (
          <p className="mt-1 line-clamp-3 text-muted-foreground">{card.card.email.excerpt}</p>
        )}
      </div>

      {card.predicted_reply !== null && (
        <div className="mt-3">
          {hasAlt && (
            <button
              className="mb-1 text-xs underline"
              onClick={() => setShowEN((s) => !s)}
            >
              {showEN ? "Show original" : "Show EN"}
            </button>
          )}
          <textarea
            className="min-h-[120px] w-full rounded-md border bg-background p-2 font-sans text-sm outline-none focus:ring-1 focus:ring-ring"
            value={shown}
            disabled={showEN && hasAlt}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() => onFeedback("edit", { from: baseText, to: draft })}
              disabled={draft === baseText}
            >
              Save edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFeedback("status", { to: "sent" })}
            >
              Mark sent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFeedback("status", { to: "dismissed" })}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onFeedback("action_override", { accepted: true })}
        >
          👍 Action right
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const t = window.prompt('Correct action as "type:target" (e.g. route:ido-seter)')
            if (!t) return
            const [type, target] = t.split(":")
            onFeedback("action_override", { accepted: false, to: { type, target: target ?? null } })
          }}
        >
          👎 Wrong action
        </Button>
      </div>

      {card.why && (
        <p className="mt-2 text-xs italic text-muted-foreground">{card.why}</p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-md border bg-background p-1 text-sm outline-none focus:ring-1 focus:ring-ring"
          placeholder="note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (note.trim()) {
              onFeedback("note", { text: note.trim() })
              setNote("")
            }
          }}
        >
          Add note
        </Button>
      </div>

      <button
        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"
        onClick={() => setShowCtx((s) => !s)}
      >
        <ChevronDown className="h-3 w-3" /> Context (
        {card.card?.context.rules.length ?? 0} rules,{" "}
        {card.card?.context.participants.length ?? 0} people)
      </button>
      {showCtx && (
        <div className="mt-2 space-y-1 text-xs">
          {card.card?.context.rules.map((r, i) => (
            <div key={i}>• {r.statement ?? ""}</div>
          ))}
          {card.card?.context.participants.map((p, i) => (
            <div key={i} className="text-muted-foreground">
              {p.name ?? ""} {p.role ? `— ${p.role}` : ""}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
