import { useEffect, useMemo, useState } from "react"
import {
  ExternalLink,
  MessageSquare,
  Shield,
  Clock,
  Check,
  Pencil,
  RotateCcw,
  ExternalLink as OutLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  TierBadge,
  MemoryBrief,
  hasHebrew,
  initials,
  RelationPill,
  daysWaiting,
  FLAG_AMBER,
  parseTrigger,
} from "./triage-bits"

const YONATAN = (p: CardParticipant) =>
  p.slug === "yonatan-orpeli" || /yonatanorp@|yorpeli@/i.test(p.email ?? "")

const SectionLabel = ({
  num,
  children,
}: {
  num: string
  children: React.ReactNode
}) => (
  <div className="mb-4 flex items-center gap-[7px]">
    <span className="text-[13px] font-bold text-muted-foreground/70">{num}</span>
    <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
      {children}
    </span>
  </div>
)

const MiniLabel = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={cn(
      "mb-2 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground/70",
      className
    )}
  >
    {children}
  </div>
)

// ── People chips (column ②) — relation-colored, drops Yonatan ───────────────
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
  const shown = showAll ? sorted : sorted.slice(0, 6)
  const tail = sorted.length - 6
  const chip = (p: CardParticipant, i: number) => {
    const c = relColor[p.relation ?? "unknown"] ?? "#9ca3af"
    const suffix =
      p.inDb && p.relation ? ` · ${p.relation}` : p.role ? ` · ${p.role}` : " · external"
    return (
      <span
        key={i}
        className="rounded-full border px-2.5 py-px text-[11px]"
        style={{ borderColor: `${c}66`, color: c }}
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
          className="rounded-full border border-border bg-card px-2 py-px text-[10px] text-muted-foreground hover:text-foreground"
        >
          +{tail} more
        </button>
      )}
    </div>
  )
}

// ── Weight-badged rule rows (columns ② and ③ Reasoning) ─────────────────────
function RuleRow({ weight, statement }: { weight: string | null | undefined; statement: string }) {
  const w = weight ?? "track"
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
        style={{ background: weightBadge[w] ?? "#6b7280" }}
      >
        {w}
      </span>
      <span className="text-[12.5px] leading-snug text-foreground/85">{statement}</span>
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
  const from = e?.from ?? fb.from ?? "—"
  const date = e?.date ?? fb.date ?? "—"
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
  const [showNote, setShowNote] = useState(false)
  const [copied, setCopied] = useState(false)
  // Action verdict: true = accepted, false = overridden, null = untouched. Reflects the persisted state.
  const [accepted, setAccepted] = useState<boolean | null>(c.action_accepted ?? null)
  // Suggested-action tab.
  const [tab, setTab] = useState<"draft" | "reasoning" | "checks">("draft")

  // Reset local state when the selected card changes.
  useEffect(() => {
    setLang("a")
    setTextA(baseText)
    setTextB(textAlt ?? "")
    setNote("")
    setShowNote(false)
    setCopied(false)
    setAccepted(c.action_accepted ?? null)
    setTab("draft")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id])

  const draftPrimary = textA // what we send / save
  const shown = lang === "a" ? textA : textB
  const setShown = (v: string) => (lang === "a" ? setTextA(v) : setTextB(v))
  const dir = hasHebrew(shown) ? "rtl" : "ltr"

  const actType = c.action_type ?? "none"
  const actInfo = actionMeta[actType] ?? { label: actType, color: "#6b7280" }

  const toStr = Array.isArray(e?.to) ? e!.to!.join(", ") : (e?.to as unknown as string) ?? "—"
  const webLink = e?.webLink ?? c.web_link ?? null // card payload first, then the top-level column (legacy rows)
  // Rationale: the `why` column, else the legacy home in context_available.draft_why.
  const whyText = c.why ?? (c.context_available?.draft_why ?? null)

  const days = daysWaiting(date === "—" ? null : date)

  // Relation pill in the header — from the matching participant entry.
  const headerRelation = useMemo(() => {
    const ps = ctx?.participants ?? []
    const match = ps.find(
      (p) => !YONATAN(p) && (p.name === from || (p.email && from.includes(p.email)))
    )
    return match?.relation ?? null
  }, [ctx, from])

  const sources = useMemo(() => {
    const raw = extras?.sources
    if (Array.isArray(raw) && raw.length) return raw.map((s) => String(s))
    const narr = ctx?.narrative ?? []
    return narr.map((n) => n.provenance).filter(Boolean) as string[]
  }, [extras, ctx])

  const copyDraft = (text: string) => {
    if (text) navigator.clipboard?.writeText(text)
  }

  // Verdict lenses
  const allVerdicts = c.verdict?.verdicts ?? []
  const refuted = allVerdicts.filter((x) => x && x.refuted && x.severity !== "none")
  const passedCount = allVerdicts.length - refuted.length
  const flagCount = refuted.length

  const memoryPoints = useMemo(() => {
    const mb = extras?.memory_brief
    if (mb && typeof mb === "object" && Array.isArray((mb as { points?: string[] }).points)) {
      return ((mb as { points?: string[] }).points ?? []).filter(Boolean)
    }
    return []
  }, [extras])

  const rules = ctx?.rules ?? []
  const redLines = ctx?.ownership?.redLines ?? []

  // ── Card header (message identity / status only) ──────────────────────────
  const Header = (
    <div className="shrink-0 border-b border-border px-6 py-[18px]">
      <div className="flex items-start gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="mb-[7px] flex items-center gap-[9px]">
            <span className="text-[18px] font-bold text-muted-foreground/70">#{index + 1}</span>
            <ChannelIcon channel={c.channel} className="h-[17px] w-[17px]" />
            <span className="break-words text-[19px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
              {subject}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-[7px] gap-y-1 text-[12.5px] text-muted-foreground">
            <span>
              from <b className="font-semibold text-foreground">{from}</b>
            </span>
            <RelationPill relation={headerRelation} />
            <span>
              · {date} · to {toStr}
            </span>
            {days != null && days >= 1 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-[13px] w-[13px]" />
                {days} {days === 1 ? "day" : "days"} waiting
              </span>
            )}
            {c.sensitive && <span className="font-medium text-destructive">· sensitive</span>}
          </div>
        </div>
        {webLink && (
          <a
            href={webLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-[7px] text-[12.5px] font-medium text-foreground hover:bg-muted"
          >
            {ch.openLabel} <ExternalLink className="h-[13px] w-[13px]" />
          </a>
        )}
      </div>
    </div>
  )

  const TabButton = ({
    id,
    label,
    badge,
  }: {
    id: "draft" | "reasoning" | "checks"
    label: string
    badge?: number
  }) => (
    <button
      onClick={() => setTab(id)}
      className={cn(
        "-mb-px inline-flex items-center gap-1.5 px-3.5 py-[9px] text-[12.5px] font-semibold",
        tab === id
          ? "border-b-2 border-primary text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground/80"
      )}
    >
      {label}
      {badge != null && badge > 0 && (
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ background: "rgba(251,191,36,0.16)", color: FLAG_AMBER }}
        >
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {Header}

      {/* 3-column grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-border lg:grid-cols-[minmax(300px,1fr)_minmax(290px,0.94fr)_minmax(360px,1.18fr)]">
        {/* ═══════════ ① ORIGINAL ═══════════ */}
        <section className="overflow-y-auto bg-background p-5">
          <SectionLabel num="①">Original message</SectionLabel>

          {e?.thread_summary?.trim() && (
            <div className="mb-[18px] rounded-[10px] border border-border bg-card px-[13px] py-3">
              <div className="mb-[7px] flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground/70">
                <MessageSquare className="h-3 w-3" />
                Thread
              </div>
              <div className="text-[12.5px] leading-relaxed text-foreground/80">
                {e.thread_summary}
              </div>
            </div>
          )}

          {/* Latest message */}
          {e?.excerpt?.trim() || from !== "—" ? (
            <>
              <div className="mb-[11px] flex items-center gap-[9px]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-foreground">
                  {initials(from)}
                </span>
                <div className="leading-[1.3]">
                  <div className="text-[13px] font-semibold text-foreground">{from}</div>
                  <div className="text-[11px] text-muted-foreground/70">{date}</div>
                </div>
              </div>
              {e?.excerpt?.trim() ? (
                <div className="whitespace-pre-line text-[13.5px] leading-[1.65] text-foreground">
                  {e.excerpt}
                </div>
              ) : (
                <div className="text-[13px] text-muted-foreground/70">—</div>
              )}
            </>
          ) : (
            <div className="text-[13px] text-muted-foreground/70">—</div>
          )}
        </section>

        {/* ═══════════ ② CONTEXT ═══════════ */}
        <section className="overflow-y-auto bg-background p-5">
          <SectionLabel num="②">Context</SectionLabel>

          {/* Memory brief — purple insight card */}
          <MiniLabel className="text-[#c4b5fd]">Memory brief</MiniLabel>
          <div
            className="mb-2 rounded-[10px] px-[13px] py-3"
            style={{
              background:
                "linear-gradient(180deg, rgba(124,58,237,0.1), rgba(124,58,237,0.02))",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
          >
            <MemoryBrief brief={extras?.memory_brief as never} />
          </div>
          {sources.length > 0 && (
            <div className="mb-[18px] break-words text-[10px] leading-snug text-muted-foreground/70">
              sources: {sources.join(" · ")}
            </div>
          )}

          {/* People */}
          <MiniLabel className={sources.length > 0 ? "" : "mt-4"}>People</MiniLabel>
          <div className="mb-[18px]">
            <PeopleChips participants={ctx?.participants ?? []} />
          </div>

          {/* Rules that fired */}
          {rules.length > 0 && (
            <>
              <MiniLabel>Rules that fired</MiniLabel>
              <div className="mb-[18px] flex flex-col gap-2">
                {rules.map((r: CardRule, i) => (
                  <RuleRow key={i} weight={r.weight} statement={(r.statement ?? "").slice(0, 200)} />
                ))}
              </div>
            </>
          )}

          {/* Guardrails · T2 — inline callout */}
          {redLines.length > 0 && (
            <div
              className="flex items-start gap-[9px] rounded-r-[10px] border border-l-[3px] border-border bg-card px-[13px] py-[11px]"
              style={{ borderLeftColor: "#7c3aed" }}
            >
              <Shield className="mt-px h-[15px] w-[15px] shrink-0" style={{ color: "#c4b5fd" }} />
              <div>
                <div
                  className="mb-1 text-[10px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: "#c4b5fd" }}
                >
                  Guardrail · T2
                </div>
                <div className="flex flex-col gap-1 text-[12.5px] leading-[1.5] text-foreground/85">
                  {redLines.map((r, i) => (
                    <div key={i}>{r}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════ ③ SUGGESTED ACTION (TABS) ═══════════ */}
        <section className="flex min-h-0 flex-col bg-background">
          {/* header */}
          <div className="shrink-0 px-5 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-bold text-muted-foreground/70">③</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
                Suggested action
              </span>
              {c.confidence && (
                <span className="ml-auto rounded bg-muted px-[7px] py-0.5 text-[10.5px] font-semibold uppercase text-muted-foreground">
                  {c.confidence}
                </span>
              )}
              <span className={c.confidence ? "" : "ml-auto"}>
                <TierBadge tier={c.tier} />
              </span>
            </div>

            {/* the disposition this whole column is about */}
            <div
              className="mb-3.5 flex items-center gap-[9px] rounded-[9px] px-[13px] py-2.5"
              style={{
                background: `${actInfo.color}1a`,
                border: `1px solid ${actInfo.color}4d`,
              }}
            >
              <span
                className="h-[7px] w-[7px] shrink-0 rounded-full"
                style={{ background: actInfo.color }}
              />
              <span className="text-[14px] font-bold" style={{ color: actInfo.color }}>
                {actInfo.label}
              </span>
              {c.action_target && (
                <>
                  <span className="text-[13px] text-muted-foreground/70">→</span>
                  <span className="text-[14px] font-semibold text-foreground">
                    {c.action_target}
                  </span>
                </>
              )}
            </div>

            {/* tab bar */}
            <div className="flex gap-0.5 border-b border-border">
              <TabButton id="draft" label="Draft" />
              <TabButton id="reasoning" label="Reasoning" />
              <TabButton id="checks" label="Checks" badge={flagCount} />
            </div>
          </div>

          {/* tab bodies (scroll) */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {/* ░░ DRAFT ░░ */}
            {tab === "draft" && (
              <>
                {hasDraft ? (
                  <>
                    {hasAlt && (
                      <div className="mb-2.5 flex items-center gap-2">
                        <div className="flex overflow-hidden rounded-[7px] border border-border">
                          <button
                            onClick={() => setLang("a")}
                            className={cn(
                              "px-3 py-1 text-[10.5px] font-semibold uppercase",
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
                              "border-l border-border px-3 py-1 text-[10.5px] font-semibold uppercase",
                              lang === "b"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-muted-foreground"
                            )}
                          >
                            {langB}
                          </button>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground/70">
                          you send the first; the other checks intent
                        </span>
                      </div>
                    )}
                    <textarea
                      dir={dir}
                      value={shown}
                      onChange={(ev) => setShown(ev.target.value)}
                      className={cn(
                        "min-h-[172px] w-full resize-y rounded-[11px] border border-border bg-card p-[15px] font-sans text-[14px] leading-[1.65] text-foreground outline-none focus:ring-1 focus:ring-ring",
                        dir === "rtl" && "text-right"
                      )}
                    />
                    {draftPrimary !== baseText && (
                      <div className="mt-[11px] flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        <Pencil className="h-3 w-3" />
                        edited from the original suggestion ·{" "}
                        <span style={{ color: FLAG_AMBER }}>unsaved</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-[11px] border border-dashed border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground/70">
                    No drafted message — {actInfo.label.toLowerCase()} action
                  </div>
                )}
              </>
            )}

            {/* ░░ REASONING ░░ */}
            {tab === "reasoning" && (
              <>
                <div
                  className="mb-2 text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: "#a78bfa" }}
                >
                  Why this draft
                </div>
                {whyText ? (
                  <div className="mb-5 text-[13.5px] leading-[1.65] text-foreground/85">
                    {whyText}
                  </div>
                ) : (
                  <div className="mb-5 text-[13px] italic text-muted-foreground/70">
                    No rationale recorded.
                  </div>
                )}

                {(rules.length > 0 || memoryPoints.length > 0) && (
                  <>
                    <MiniLabel>Signals used</MiniLabel>
                    <div className="flex flex-col gap-2.5">
                      {rules.map((r: CardRule, i) => (
                        <RuleRow
                          key={`r${i}`}
                          weight={r.weight}
                          statement={(r.statement ?? "").slice(0, 200)}
                        />
                      ))}
                      {memoryPoints.map((p, i) => (
                        <div key={`m${i}`} className="flex items-baseline gap-2">
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd" }}
                          >
                            memory
                          </span>
                          <span className="text-[12.5px] leading-snug text-foreground/85">
                            {p}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ░░ CHECKS ░░ */}
            {tab === "checks" && (
              <>
                {c.verdict ? (
                  <>
                    <div className="mb-3.5 flex items-center gap-[9px]">
                      <span className="text-[13px] font-semibold text-foreground">
                        Adversarial verifier
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-emerald-500 dark:text-emerald-400">
                        <Check className="h-3 w-3" strokeWidth={3} />
                        {passedCount} passed
                      </span>
                      {flagCount > 0 && (
                        <span className="text-[11.5px]" style={{ color: FLAG_AMBER }}>
                          ⚠ {flagCount} flag
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      {allVerdicts.map((v, i) => {
                        const isFlag = !!v.refuted && v.severity !== "none"
                        if (!isFlag) {
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-[9px] rounded-lg border border-border bg-card px-[11px] py-[9px]"
                            >
                              <Check
                                className="h-[13px] w-[13px] text-emerald-500 dark:text-emerald-400"
                                strokeWidth={3}
                              />
                              <span className="text-[12.5px] text-foreground/85">
                                {v.lens ?? "lens"}
                              </span>
                              <span className="ml-auto text-[11px] text-muted-foreground/70">
                                pass
                              </span>
                            </div>
                          )
                        }
                        return (
                          <div
                            key={i}
                            className="rounded-lg px-[11px] py-2.5"
                            style={{ background: "#1f1503", border: "1px solid #422006" }}
                          >
                            <div className="mb-[5px] flex items-center gap-[9px]">
                              <span className="text-[13px]">⚠</span>
                              <span className="text-[12.5px] font-semibold text-[#fcd34d]">
                                {v.lens ?? "lens"}
                              </span>
                              {v.severity && (
                                <span
                                  className="ml-auto rounded px-[7px] py-0.5 text-[10px] font-semibold uppercase"
                                  style={{
                                    background: "rgba(251,191,36,0.15)",
                                    color: FLAG_AMBER,
                                  }}
                                >
                                  {v.severity}
                                </span>
                              )}
                            </div>
                            <div className="pl-[22px] text-[12px] leading-[1.5] text-[#e4d9c0]">
                              {v.issue}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3.5 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground/70">
                      <RotateCcw className="h-3 w-3" />
                      Re-run checks
                    </div>
                  </>
                ) : (
                  <div className="rounded-[11px] border border-dashed border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground/70">
                    Not verified — tier {c.tier ?? 0}
                  </div>
                )}
              </>
            )}
          </div>

          {/* pinned action bar */}
          <div className="shrink-0 border-t border-border bg-card px-5 py-3.5">
            <div className="mb-[11px] flex gap-[7px]">
              {/* 👍 Right */}
              <button
                aria-pressed={accepted === true}
                onClick={() => {
                  if (accepted === true) return // already accepted — don't re-log
                  setAccepted(true)
                  onFeedback("action_override", {
                    accepted: true,
                    from: { type: c.action_type, target: c.action_target },
                  })
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-[9px] text-[12px] font-semibold"
                style={{
                  background:
                    accepted === true ? "rgba(52,211,153,0.2)" : "rgba(52,211,153,0.1)",
                  borderColor:
                    accepted === true ? "rgba(52,211,153,0.65)" : "rgba(52,211,153,0.35)",
                  color: "#6ee7b7",
                }}
              >
                👍 Right{accepted === true && " ✓"}
              </button>
              {/* 👎 Change */}
              <button
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
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-[9px] text-[12px] font-semibold",
                  accepted === false
                    ? "border-red-400/55 bg-red-400/15 text-red-400"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                👎 Change{accepted === false && " ✓"}
              </button>
              {/* ＋ Note */}
              <button
                onClick={() => setShowNote((s) => !s)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-[9px] text-[12px]",
                  showNote ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                ＋ Note
              </button>
            </div>

            {showNote && (
              <div className="mb-[11px] flex gap-2">
                <input
                  autoFocus
                  className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-ring"
                  placeholder="note…"
                  value={note}
                  onChange={(ev) => setNote(ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" && note.trim()) {
                      onFeedback("note", { text: note.trim() })
                      setNote("")
                      setShowNote(false)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (note.trim()) {
                      onFeedback("note", { text: note.trim() })
                      setNote("")
                      setShowNote(false)
                    }
                  }}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  copyDraft(draftPrimary)
                  if (webLink) window.open(webLink, "_blank", "noopener,noreferrer")
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1400)
                }}
                disabled={!hasDraft && !webLink}
                className="flex flex-1 items-center justify-center gap-[7px] rounded-lg bg-primary px-3 py-[11px] text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {copied ? "Copied ✓" : "Copy draft & open in Outlook"}
                <OutLink className="h-[13px] w-[13px]" />
              </button>
              <button
                disabled={draftPrimary === baseText}
                onClick={() => onFeedback("edit", { from: baseText, to: draftPrimary })}
                className="flex items-center justify-center rounded-lg border border-border bg-card px-3.5 py-[11px] text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
