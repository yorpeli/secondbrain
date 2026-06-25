import { parseISO, isValid, format, differenceInCalendarDays } from 'date-fns'
import type { PersonOpenItem, PersonOneOnOne, AttentionLevel, PersonAgendaItem } from './types'

/**
 * Format an ISO date/timestamp string into a friendly absolute date
 * (e.g. "Jun 30, 2026"). Returns "" for null or unparseable input.
 * Pure - uses parseISO so date-only strings are not shifted by timezone.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, 'MMM d, yyyy')
}

/** Ascending by dueDate, nulls last. Pure - returns a new array. */
export function sortOpenItems(items: PersonOpenItem[]): PersonOpenItem[] {
  return [...items].sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0
    if (a.dueDate === null) return 1
    if (b.dueDate === null) return -1
    return a.dueDate < b.dueDate ? -1 : 1
  })
}

/**
 * Split 1:1 meetings into recent (date <= today, newest first) and the
 * single next upcoming meeting (earliest date > today), or null.
 */
export function splitOneOnOnes(
  meetings: PersonOneOnOne[],
  todayISO: string,
): { recent: PersonOneOnOne[]; next: PersonOneOnOne | null } {
  // A 1:1 dated today counts as the upcoming "next" (so the Today state can
  // render), not as a past session.
  const past = meetings.filter(m => m.date < todayISO)
  const future = meetings.filter(m => m.date >= todayISO)
  const recent = [...past].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const sortedFuture = [...future].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { recent, next: sortedFuture[0] ?? null }
}

// --- Cockpit derivation layer (all pure; take todayISO, never call Date.now) ---

/** Whole calendar days between dateISO and todayISO (today - date), or null. */
export function daysSince(dateISO: string | null, todayISO: string): number | null {
  if (!dateISO) return null
  const d = parseISO(dateISO)
  const t = parseISO(todayISO)
  if (!isValid(d) || !isValid(t)) return null
  return differenceInCalendarDays(t, d)
}

/** Three-way commitment status from a due date. */
export function commitmentStatus(
  dueDate: string | null,
  todayISO: string,
  dueSoonDays = 7,
): 'overdue' | 'due-soon' | 'open' {
  if (!dueDate) return 'open'
  const due = parseISO(dueDate)
  const t = parseISO(todayISO)
  if (!isValid(due) || !isValid(t)) return 'open'
  const diff = differenceInCalendarDays(due, t)
  if (diff < 0) return 'overdue'
  if (diff <= dueSoonDays) return 'due-soon'
  return 'open'
}

export function countOverdue(items: PersonOpenItem[], todayISO: string): number {
  return items.filter(i => commitmentStatus(i.dueDate, todayISO) === 'overdue').length
}

export function countDueSoon(items: PersonOpenItem[], todayISO: string): number {
  return items.filter(i => commitmentStatus(i.dueDate, todayISO) === 'due-soon').length
}

/** Average whole-day gap between consecutive 1:1s; null if fewer than 2. */
export function computeCadenceDays(oneOnOnes: PersonOneOnOne[]): number | null {
  const dates = oneOnOnes.map(m => m.date).filter(Boolean).sort()
  if (dates.length < 2) return null
  let total = 0
  let n = 0
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]))
    if (diff > 0) {
      total += diff
      n++
    }
  }
  if (n === 0) return null
  return Math.round(total / n)
}

export function cadenceLabel(days: number | null): string | null {
  return days == null ? null : `${days}d`
}

/** Classify the next upcoming 1:1 by proximity. */
export function nextOneOnOneKind(
  nextDateISO: string | null,
  todayISO: string,
): 'today' | 'soon' | 'date' | 'none' {
  if (!nextDateISO) return 'none'
  const next = parseISO(nextDateISO)
  const t = parseISO(todayISO)
  if (!isValid(next) || !isValid(t)) return 'none'
  const diff = differenceInCalendarDays(next, t)
  if (diff <= 0) return 'today'
  if (diff <= 2) return 'soon'
  return 'date'
}

/**
 * Derive the attention level. Precedence: new (recent hire, no overdue) ->
 * high (any overdue, or no recent 1:1 / >21d stale) -> watch (due-soon
 * pressure or 14-21d stale) -> ok.
 */
export function deriveAttention(input: {
  overdueCount: number
  dueSoonCount: number
  daysSinceLast: number | null
  startedDateISO: string | null
  todayISO: string
}): AttentionLevel {
  const { overdueCount, dueSoonCount, daysSinceLast, startedDateISO, todayISO } = input
  const startedDays = daysSince(startedDateISO, todayISO)
  const isNew = startedDays != null && startedDays <= 60
  if (isNew && overdueCount === 0) return 'new'
  const veryStale = daysSinceLast == null || daysSinceLast > 21
  if (overdueCount >= 1 || veryStale) return 'high'
  if (dueSoonCount >= 1 || daysSinceLast >= 14) return 'watch'
  return 'ok'
}

/**
 * Auto-assemble the "to cover in your next 1:1" agenda from real signals
 * only: a cadence nudge when no upcoming 1:1, overdue commitments, due-soon
 * commitments, then open action-item carry-overs. Capped at 5.
 */
export function assembleAgenda(input: {
  commitments: PersonOpenItem[]
  nextKind: 'today' | 'soon' | 'date' | 'none'
  daysSinceLast: number | null
  todayISO: string
}): PersonAgendaItem[] {
  const { commitments, nextKind, daysSinceLast, todayISO } = input
  const items: PersonAgendaItem[] = []

  if (nextKind === 'none') {
    const meta = daysSinceLast != null
      ? `No 1:1 in ${daysSinceLast} days - re-establish cadence`
      : 'No 1:1 scheduled - re-establish cadence'
    items.push({ title: 'Reschedule a standing 1:1', meta, tag: 'Cadence' })
  }

  for (const c of commitments) {
    if (commitmentStatus(c.dueDate, todayISO) === 'overdue') {
      items.push({ title: c.title, meta: `Overdue since ${formatDate(c.dueDate)}`, tag: 'Overdue' })
    }
  }
  for (const c of commitments) {
    if (commitmentStatus(c.dueDate, todayISO) === 'due-soon') {
      items.push({ title: c.title, meta: `Due ${formatDate(c.dueDate)}`, tag: 'Topic' })
    }
  }

  const seen = new Set(items.map(i => i.title))
  for (const c of commitments) {
    if (c.kind === 'action-item' && commitmentStatus(c.dueDate, todayISO) === 'open' && !seen.has(c.title)) {
      items.push({ title: c.title, meta: 'Carry-over action item', tag: 'Carry-over' })
      seen.add(c.title)
    }
  }

  return items.slice(0, 5)
}
