import { Mail, MessagesSquare, CalendarDays, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Semantic accent maps (ported from comms-assistant/render-triage.ts) ──────
// These are meaningful colors, applied via inline style (not theme tokens).

export const relColor: Record<string, string> = {
  "direct-report": "#3b82f6", "skip-level": "#06b6d4", peer: "#22c55e",
  manager: "#a855f7", external: "#9ca3af", unknown: "#9ca3af",
}
export const weightBadge: Record<string, string> = { assert: "#dc2626", whisper: "#d97706", track: "#6b7280" }
export const actionMeta: Record<string, { label: string; color: string }> = {
  reply: { label: "Reply", color: "#3b82f6" }, redirect: { label: "Redirect", color: "#a855f7" },
  sidebar: { label: "Sidebar", color: "#06b6d4" }, route: { label: "Route", color: "#22c55e" },
  task: { label: "Task", color: "#d97706" }, escalate: { label: "Escalate", color: "#dc2626" },
  schedule: { label: "Schedule", color: "#0ea5e9" }, monitor: { label: "Monitor", color: "#6b7280" },
  none: { label: "No action", color: "#9ca3af" },
}
export const tierMeta: Record<number, { l: string; c: string }> = {
  0: { l: "T0 light", c: "#9ca3af" }, 1: { l: "T1", c: "#0ea5e9" }, 2: { l: "T2 deep", c: "#7c3aed" },
}

export const channelMeta: Record<string, { icon: LucideIcon; color: string; label: string; openLabel: string }> = {
  outlook: { icon: Mail, color: "#3b82f6", label: "Email", openLabel: "Open in Outlook" },
  teams: { icon: MessagesSquare, color: "#7b83eb", label: "Teams", openLabel: "Open in Teams" },
  meeting: { icon: CalendarDays, color: "#d97706", label: "Meeting", openLabel: "Open" },
}

export function channelOf(ch: string | null | undefined) {
  return channelMeta[ch ?? "outlook"] ?? channelMeta.outlook
}

// Verdict-flag amber (Checks tab badge / flag callouts)
export const FLAG_AMBER = "#fbbf24"

// Initials for the avatar in column ① (e.g. "Maya Cohen" → "MC").
export function initials(name: string | null | undefined): string {
  const n = (name ?? "").trim()
  if (!n) return "?"
  const parts = n.split(/[\s,]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Relation pill (header + people chips). Returns null when relation is unknown.
export function RelationPill({
  relation,
  className,
}: {
  relation: string | null | undefined
  className?: string
}) {
  if (!relation || relation === "unknown") return null
  const c = relColor[relation] ?? "#9ca3af"
  return (
    <span
      className={cn("rounded-full border px-2 py-px text-[10.5px] leading-tight", className)}
      style={{ borderColor: `${c}66`, color: c }}
    >
      {relation}
    </span>
  )
}

export function ChannelIcon({ channel, className }: { channel: string | null | undefined; className?: string }) {
  const m = channelOf(channel)
  const Icon = m.icon
  return <Icon className={cn("shrink-0", className)} style={{ color: m.color }} aria-label={m.label} />
}

export const actionLabel = (type: string | null | undefined) => actionMeta[type ?? "none"]?.label ?? type ?? "—"

export function daysWaiting(d: string | null): number | null {
  if (!d) return null
  const t = Date.parse(d)
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000)
}

const hasHebrew = (t: string | null | undefined) => /[֐-׿]/.test(t ?? "")
export { hasHebrew }

// ── Badges ────────────────────────────────────────────────────────────────
// Small uppercase pills; theme-token surfaces would clash with the meaningful
// palette, so the semantic ones keep literal colors (per the spec).

const badgeBase = "inline-flex items-center rounded text-[10px] font-medium uppercase tracking-[0.03em] px-1.5 py-0.5 leading-none"

export function DispositionBadge({ type }: { type: string | null | undefined }) {
  return (
    <span className={cn(badgeBase, "bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300")}>
      {actionLabel(type)}
    </span>
  )
}
export function ConfidenceBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null
  return (
    <span className={cn(badgeBase, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}>
      {value}
    </span>
  )
}
export function NeedsDataBadge({ label = "data" }: { label?: string }) {
  return (
    <span className={cn(badgeBase, "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300")}>{label}</span>
  )
}
export function AgeBadge({ date }: { date: string | null }) {
  const w = daysWaiting(date)
  if (w == null || w < 7) return null
  return (
    <span
      className={cn(badgeBase, "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300")}
      title={`awaiting a reply ~${w} days — acknowledge the delay`}
    >
      ⏳ {w}d
    </span>
  )
}
export function TierBadge({ tier }: { tier: number | null | undefined }) {
  if (tier !== 0 && tier !== 1 && tier !== 2) return null
  const m = tierMeta[tier]
  return (
    <span
      className={cn(badgeBase)}
      style={{ background: `${m.c}22`, color: m.c }}
      title="processing tier"
    >
      {m.l}
    </span>
  )
}
export function VerdictFlagBadge() {
  return (
    <span className={cn(badgeBase, "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300")}>⚠</span>
  )
}

// ── Trigger-text parser ──────────────────────────────────────────────────────
// Fallback for rows persisted before the card payload existed: trigger_text holds
//   `${from} (${date}), thread '${subject}'`  — the date is the LAST (...) before ", thread".
export function parseTrigger(t: string | null | undefined): { from: string | null; date: string | null; subject: string | null } {
  if (!t) return { from: null, date: null, subject: null }
  const m = t.match(/^(.*)\s+\(([^)]*)\),\s*thread '([\s\S]*)'$/)
  if (!m) return { from: t, date: null, subject: null }
  return { from: m[1] || null, date: m[2] || null, subject: m[3] || null }
}

// ── Verdict helpers ─────────────────────────────────────────────────────────
import type { CardVerdict } from "@/lib/triage-types"

export function verdictFlagged(v: CardVerdict | null | undefined): boolean {
  if (!v) return false
  const refuted = (v.verdicts ?? []).filter((x) => x && x.refuted && x.severity !== "none")
  return !!v.flagged || refuted.length > 0
}

// ── Memory brief renderer ────────────────────────────────────────────────────
type Brief = string | { summary?: string; points?: string[] } | null | undefined

export function MemoryBrief({ brief }: { brief: Brief }) {
  if (brief && typeof brief === "object") {
    const sum = brief.summary?.trim()
    const pts = Array.isArray(brief.points) ? brief.points.filter(Boolean) : []
    if (sum || pts.length) {
      return (
        <div className="text-xs leading-relaxed text-foreground">
          {sum && <div className="mb-1.5 font-semibold">{sum}</div>}
          {pts.length > 0 && (
            <ol className="ml-[18px] list-decimal space-y-1">
              {pts.map((p, i) => (
                <li key={i} className="leading-snug">{p}</li>
              ))}
            </ol>
          )}
        </div>
      )
    }
  }
  if (brief && typeof brief === "string" && brief.trim()) {
    return <div className="text-xs leading-relaxed text-foreground">{brief}</div>
  }
  return <div className="text-xs italic text-muted-foreground/70">nothing material in memory</div>
}
