import { useEffect, useMemo, useState } from "react"
import { ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type {
  TriageCard,
  FeedbackKind,
  CardParticipant,
  CardRule,
} from "@/lib/triage-types"
import {
  ChannelIcon,
  channelOf,
  actionMeta,
  relColor,
  weightBadge,
  DispositionBadge,
  ConfidenceBadge,
  NeedsDataBadge,
  AgeBadge,
  TierBadge,
  MemoryBrief,
  hasHebrew,
  verdictFlagged,
  parseTrigger,
} from "./triage-bits"

const YONATAN = (p: CardParticipant) =>
  p.slug === "yonatan-orpeli" || /yonatanorp@|yorpeli@/i.test(p.email ?? "")

function Collapsible({
  label,
  count,
  children,
}: {
  label: string
  count?: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex select-none items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground/70 hover:text-muted-foreground"
      >
        <ChevronRight className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-90")} />
        {label}
        {count != null && count > 0 && ` · ${count}`}
      </button>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  )
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 mt-3.5 text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground/70">
    {children}
  </div>
)

function PeopleChips({ participants }: { participants: CardParticipant[] }) {
  const [showAll, setShowAll] = useState(false)
  const sorted = useMemo(
    () =>
      participants
        .filter((p) => !YONATAN(p))
        .sort((a, z) => Number(z.inDb) - Number(a.inDb)),
    [participants]
  )
  if (!sorted.length) return <span className="text-xs text-muted-foreground/70">—</span>
  const shown = showAll ? sorted : sorted.slice(0, 5)
  const tail = sorted.length - 5
  const chip = (p: CardParticipant, i: number) => {
    const c = relColor[p.relation ?? "unknown"] ?? "#9ca3af"
    const suffix = p.inDb && p.relation ? ` · ${p.relation}` : p.role ? ` · ${p.role}` : " · external"
    return (
      <span
        key={i}
        className="rounded-full border px-2 py-0.5 text-[11px]"
        style={{ borderColor: c, color: c }}
      >
        {p.name ?? p.email}
        {suffix}
      </span>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map(chip)}
      {!showAll && tail > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          +{tail} more
        </button>
      )}
    </div>
  )
}

function RulesList({ rules }: { rules: CardRule[] }) {
  if (!rules.length) return <span className="text-xs text-muted-foreground/70">none fired</span>
  return (
    <div className="space-y-1.5">
      {rules.map((r, i) => (
        <div key={i} className="text-xs leading-snug text-foreground">
          <span
            className="mr-1 rounded px-1.5 py-px text-[9px] uppercase text-white"
            style={{ background: weightBadge[r.weight ?? "track"] ?? "#6b7280" }}
          >
            {r.weight ?? "track"}
          </span>
          {(r.statement ?? "").slice(0, 160)}
        </div>
      ))}
    </div>
  )
}

export function TriageDetail({
  card,
  index,
  onFeedback,
}: {
  card: TriageCard
  index: number
  onFeedback: (kind: FeedbackKind, payload: Record<string, unknown>) => void
}) {
  const c = card
  const e = c.card?.email
  const fb = parseTrigger(c.trigger_text)
  const subject = e?.subject ?? fb.subject ?? "(no subject)"
  const from    = e?.from    ?? fb.from   ?? "—"
  const date    = e?.date    ?? fb.date   ?? "—"
  const extras = c.card?.suggestion_extras
  const ctx = c.card?.context
  const ch = channelOf(c.channel)

  const baseText = c.edited_reply ?? c.predicted_reply ?? ""
  const hasDraft = !!baseText.trim()
  const textAlt = (extras?.text_alt as string | null) ?? null
  const hasAlt = !!textAlt?.trim()
  const langA = (extras?.lang ?? (hasHebrew(baseText) ? "HE" : "EN")).toUpperCase()
  const langB = (extras?.lang_alt ?? (hasHebrew(textAlt) ? "HE" : "EN")).toUpperCase()

  // Per-language edit state. 'a' = primary (sent), 'b' = alternate (intent check).
  const [lang, setLang] = useState<"a" | "b">("a")
  const [textA, setTextA] = useState(baseText)
  const [textB, setTextB] = useState(textAlt ?? "")
  const [note, setNote] = useState("")
  const [copied, setCopied] = useState(false)
  // Action verdict: true = accepted, false = overridden, null = untouched. Reflects the persisted state.
  const [accepted, setAccepted] = useState<boolean | null>(c.action_accepted ?? null)

  // Reset local state when the selected card changes.
  useEffect(() => {
    setLang("a")
    setTextA(baseText)
    setTextB(textAlt ?? "")
    setNote("")
    setCopied(false)
    setAccepted(c.action_accepted ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id])

  const draftPrimary = textA // what we send / save
  const shown = lang === "a" ? textA : textB
  const setShown = (v: string) => (lang === "a" ? setTextA(v) : setTextB(v))
  const dir = hasHebrew(shown) ? "rtl" : "ltr"

  const actType = c.action_type ?? "none"
  const actInfo = actionMeta[actType] ?? { label: actType, color: "#6b7280" }
  const secondary = (extras?.secondary as string | null) ?? null

  const toStr = Array.isArray(e?.to) ? e!.to!.join(", ") : (e?.to as unknown as string) ?? "—"
  const webLink = e?.webLink ?? c.web_link ?? null   // card payload first, then the top-level column (legacy rows)
  // Rationale: the `why` column, else the legacy home in context_available.draft_why.
  const whyText = c.why ?? (c.context_available?.draft_why ?? null)

  const sources = useMemo(() => {
    const raw = extras?.sources
    if (Array.isArray(raw) && raw.length) return raw.map((s) => String(s))
    const narr = ctx?.narrative ?? []
    return narr.map((n) => n.provenance).filter(Boolean) as string[]
  }, [extras, ctx])

  const copyDraft = (text: string) => {
    if (text) navigator.clipboard?.writeText(text)
  }

  const onOpen = () => {
    if (hasDraft) copyDraft(draftPrimary)
  }

  const refuted = (c.verdict?.verdicts ?? []).filter((x) => x && x.refuted && x.severity !== "none")
  const flagged = verdictFlagged(c.verdict)
  const lensCount = c.verdict?.verdicts?.length ?? 0

  return (
    <div className="flex-1 overflow-y-auto p-5 lg:p-6">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[17px] font-semibold leading-tight">
            <span className="font-bold text-muted-foreground/70">#{index + 1}</span>
            <ChannelIcon channel={c.channel} className="h-4 w-4" />
            <span className="break-words">{subject}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            from <b className="font-semibold text-foreground">{from}</b> · {date}
            <AgeBadge date={date === "—" ? null : date} /> · to {toStr}
            {c.sensitive && (
              <span className="ml-1 font-medium text-destructive">· sensitive</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {webLink && (
            <a
              href={webLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpen}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              {ch.openLabel}
              {hasDraft && " + copy draft"} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button size="sm" variant="outline" onClick={() => onFeedback("status", { to: "sent" })}>
            Mark sent
          </Button>
          <Button size="sm" variant="outline" onClick={() => onFeedback("status", { to: "dismissed" })}>
            Dismiss
          </Button>
        </div>
      </header>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
        {/* ① Original */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            ① Original
          </h3>
          {e?.thread_summary?.trim() && (
            <>
              <Label>Thread summary</Label>
              <div className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
                {e.thread_summary}
              </div>
            </>
          )}
          {e?.excerpt?.trim() ? (
            <>
              {e.thread_summary?.trim() && <Label>Latest message</Label>}
              <div className="mt-1 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                {e.excerpt}
              </div>
            </>
          ) : (
            !e?.thread_summary?.trim() && (
              <div className="text-[13px] text-muted-foreground/70">—</div>
            )
          )}
        </section>

        {/* ② Context */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            ② Context
          </h3>
          <Label>Memory brief</Label>
          <MemoryBrief brief={extras?.memory_brief as never} />
          {sources.length > 0 && (
            <div className="mt-2 break-words text-[10px] leading-snug text-muted-foreground/70">
              sources: {sources.join(" · ")}
            </div>
          )}

          <Label>People</Label>
          <PeopleChips participants={ctx?.participants ?? []} />

          <Collapsible label="Guardrails (T2)" count={ctx?.ownership?.redLines?.length}>
            {ctx?.ownership?.redLines?.length ? (
              <ul className="ml-4 list-disc space-y-1">
                {ctx.ownership.redLines.map((r, i) => (
                  <li key={i} className="text-xs leading-snug text-foreground/85">{r}</li>
                ))}
              </ul>
            ) : (
              <span className="text-xs text-muted-foreground/70">—</span>
            )}
          </Collapsible>

          <Collapsible label="Rules that fired" count={ctx?.rules?.length}>
            <RulesList rules={ctx?.rules ?? []} />
          </Collapsible>
        </section>

        {/* ③ Suggested action */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            ③ Suggested action
            <DispositionBadge type={actType} />
            {c.needs_data && <NeedsDataBadge label="needs data" />}
            <ConfidenceBadge value={c.confidence} />
            <TierBadge tier={c.tier} />
          </h3>

          {/* ▸ TYPE → target */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-muted px-3 py-2.5 text-sm">
            <span className="font-bold tracking-[0.02em]" style={{ color: actInfo.color }}>
              ▸ {actInfo.label}
            </span>
            {c.action_target && (
              <>
                <span className="text-muted-foreground/70">→</span>
                <span className="font-semibold text-foreground">{c.action_target}</span>
              </>
            )}
          </div>
          {secondary && (
            <div className="-mt-2 mb-3 pl-3 text-[11px] text-muted-foreground/70">also: {secondary}</div>
          )}

          {hasDraft && (
            <>
              {hasAlt && (
                <div className="mb-1.5 flex items-center justify-end gap-1.5">
                  <span className="mr-auto text-[10px] text-muted-foreground/70">
                    you send the first; EN is to check intent
                  </span>
                  <div className="flex overflow-hidden rounded-md border border-border">
                    <button
                      onClick={() => setLang("a")}
                      className={cn(
                        "px-2.5 py-1 text-[10px] uppercase tracking-[0.04em]",
                        lang === "a"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      )}
                    >
                      {langA}
                    </button>
                    <button
                      onClick={() => setLang("b")}
                      className={cn(
                        "border-l border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.04em]",
                        lang === "b"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      )}
                    >
                      {langB}
                    </button>
                  </div>
                </div>
              )}
              <textarea
                dir={dir}
                rows={11}
                value={shown}
                onChange={(ev) => setShown(ev.target.value)}
                className={cn(
                  "w-full resize-y rounded-lg border border-border bg-background p-3 font-sans text-[13px] leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-ring",
                  dir === "rtl" && "text-right"
                )}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    copyDraft(shown)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1200)
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={draftPrimary === baseText}
                  onClick={() => onFeedback("edit", { from: baseText, to: draftPrimary })}
                >
                  Save edit
                </Button>
              </div>
            </>
          )}

          {/* Action feedback — buttons reflect the persisted verdict; clicking the active one is a no-op. */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={accepted === true ? "default" : "outline"}
              aria-pressed={accepted === true}
              onClick={() => {
                if (accepted === true) return // already accepted — don't re-log
                setAccepted(true)
                onFeedback("action_override", {
                  accepted: true,
                  from: { type: c.action_type, target: c.action_target },
                })
              }}
            >
              {accepted === true ? "👍 Action right ✓" : "👍 Action right"}
            </Button>
            <Button
              size="sm"
              variant={accepted === false ? "default" : "outline"}
              aria-pressed={accepted === false}
              onClick={() => {
                const t = window.prompt('Correct action as "type:target" (e.g. route:ido-seter)')
                if (!t) return
                const [type, target] = t.split(":")
                setAccepted(false)
                onFeedback("action_override", {
                  accepted: false,
                  from: { type: c.action_type, target: c.action_target },
                  to: { type, target: target ?? null },
                })
              }}
            >
              {accepted === false ? "👎 Wrong action ✓" : "👎 Wrong action"}
            </Button>
          </div>

          {/* Why */}
          {whyText && (
            <div className="mt-3 rounded-r-lg border-l-[3px] border-primary bg-muted px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {hasDraft ? "Why this draft" : "Why this action"}
              </span>
              {whyText}
            </div>
          )}

          {/* Verdict */}
          {lensCount > 0 && (
            <div
              className={cn(
                "mt-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed",
                flagged
                  ? "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                  : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              )}
            >
              {flagged ? (
                <>
                  <b>⚠ Verifier flagged</b> · {refuted.length}/{lensCount} lenses
                  {refuted.map((x, i) => (
                    <div key={i} className="mt-1.5 font-normal">
                      • <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.03em] opacity-80">
                        {x.lens}
                      </span>
                      {x.issue}
                    </div>
                  ))}
                </>
              ) : (
                <>✓ Adversarially verified · {lensCount} lenses, no flags</>
              )}
            </div>
          )}

          {/* Note */}
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
              placeholder="note…"
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
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
        </section>
      </div>
    </div>
  )
}
