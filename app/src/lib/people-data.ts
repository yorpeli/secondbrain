import { parseISO, isValid, format } from 'date-fns'
import type { PersonOpenItem, PersonOneOnOne } from './types'

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
  const past = meetings.filter(m => m.date <= todayISO)
  const future = meetings.filter(m => m.date > todayISO)
  const recent = [...past].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const sortedFuture = [...future].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { recent, next: sortedFuture[0] ?? null }
}
