import { describe, it, expect } from 'vitest'
import {
  sortOpenItems,
  splitOneOnOnes,
  formatDate,
  daysSince,
  commitmentStatus,
  countOverdue,
  countDueSoon,
  computeCadenceDays,
  cadenceLabel,
  nextOneOnOneKind,
  deriveAttention,
  assembleAgenda,
} from './people-data'
import type { PersonOpenItem, PersonOneOnOne } from './types'

const TODAY = '2026-06-25'

function item(over: Partial<PersonOpenItem> & { id: string }): PersonOpenItem {
  return { kind: 'task', title: over.id, status: 'todo', priority: null, dueDate: null, ...over }
}

describe('daysSince', () => {
  it('counts whole days between a past date and today', () => {
    expect(daysSince('2026-06-18', TODAY)).toBe(7)
  })
  it('returns null for null or unparseable input', () => {
    expect(daysSince(null, TODAY)).toBeNull()
    expect(daysSince('nope', TODAY)).toBeNull()
  })
})

describe('commitmentStatus', () => {
  it('flags a past due date overdue', () => {
    expect(commitmentStatus('2026-06-20', TODAY)).toBe('overdue')
  })
  it('flags within the due-soon window', () => {
    expect(commitmentStatus('2026-06-30', TODAY)).toBe('due-soon')
  })
  it('treats far-future and null as open', () => {
    expect(commitmentStatus('2026-08-01', TODAY)).toBe('open')
    expect(commitmentStatus(null, TODAY)).toBe('open')
  })
})

describe('countOverdue / countDueSoon', () => {
  const items = [
    item({ id: 'a', dueDate: '2026-06-20' }),
    item({ id: 'b', dueDate: '2026-06-28' }),
    item({ id: 'c', dueDate: null }),
  ]
  it('counts overdue and due-soon separately', () => {
    expect(countOverdue(items, TODAY)).toBe(1)
    expect(countDueSoon(items, TODAY)).toBe(1)
  })
})

describe('computeCadenceDays / cadenceLabel', () => {
  it('averages consecutive gaps', () => {
    const m: PersonOneOnOne[] = [
      { id: '1', date: '2026-06-01', topic: null, notes: null },
      { id: '2', date: '2026-06-08', topic: null, notes: null },
      { id: '3', date: '2026-06-22', topic: null, notes: null },
    ]
    expect(computeCadenceDays(m)).toBe(11) // (7 + 14) / 2 = 10.5 -> 11
    expect(cadenceLabel(11)).toBe('11d')
  })
  it('returns null with fewer than two sessions', () => {
    expect(computeCadenceDays([{ id: '1', date: '2026-06-01', topic: null, notes: null }])).toBeNull()
    expect(cadenceLabel(null)).toBeNull()
  })
})

describe('nextOneOnOneKind', () => {
  it('classifies by proximity', () => {
    expect(nextOneOnOneKind(null, TODAY)).toBe('none')
    expect(nextOneOnOneKind('2026-06-26', TODAY)).toBe('soon')
    expect(nextOneOnOneKind('2026-07-05', TODAY)).toBe('date')
  })
})

describe('deriveAttention', () => {
  it('is new for a recent hire with no overdue', () => {
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 0, daysSinceLast: 5, startedDateISO: '2026-06-01', todayISO: TODAY })).toBe('new')
  })
  it('is high with any overdue item', () => {
    expect(deriveAttention({ overdueCount: 1, dueSoonCount: 0, daysSinceLast: 5, startedDateISO: null, todayISO: TODAY })).toBe('high')
  })
  it('is high when stale beyond 21 days or never met', () => {
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 0, daysSinceLast: 30, startedDateISO: null, todayISO: TODAY })).toBe('high')
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 0, daysSinceLast: null, startedDateISO: null, todayISO: TODAY })).toBe('high')
  })
  it('is watch for due-soon pressure or 14-21d stale', () => {
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 2, daysSinceLast: 5, startedDateISO: null, todayISO: TODAY })).toBe('watch')
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 0, daysSinceLast: 16, startedDateISO: null, todayISO: TODAY })).toBe('watch')
  })
  it('is ok otherwise', () => {
    expect(deriveAttention({ overdueCount: 0, dueSoonCount: 0, daysSinceLast: 7, startedDateISO: '2024-01-01', todayISO: TODAY })).toBe('ok')
  })
})

describe('assembleAgenda', () => {
  it('adds a cadence nudge, overdue, due-soon, then carry-overs (capped at 5)', () => {
    const commitments: PersonOpenItem[] = [
      item({ id: 'o1', title: 'Ship X', dueDate: '2026-06-20' }),
      item({ id: 'd1', title: 'Spec Y', dueDate: '2026-06-30' }),
      { id: 'a1', kind: 'action-item', title: 'Follow up Z', status: 'open', priority: null, dueDate: null },
    ]
    const agenda = assembleAgenda({ commitments, nextKind: 'none', daysSinceLast: 24, todayISO: TODAY })
    expect(agenda[0].tag).toBe('Cadence')
    expect(agenda.find(a => a.tag === 'Overdue')?.title).toBe('Ship X')
    expect(agenda.find(a => a.tag === 'Topic')?.title).toBe('Spec Y')
    expect(agenda.find(a => a.tag === 'Carry-over')?.title).toBe('Follow up Z')
    expect(agenda.length).toBeLessThanOrEqual(5)
  })
  it('omits the cadence nudge when a 1:1 is upcoming', () => {
    const agenda = assembleAgenda({ commitments: [], nextKind: 'date', daysSinceLast: 5, todayISO: TODAY })
    expect(agenda).toEqual([])
  })
})

describe('formatDate', () => {
  it('formats a date-only string without timezone shift', () => {
    expect(formatDate('2026-06-30')).toBe('Jun 30, 2026')
  })

  it('formats a full timestamp', () => {
    expect(formatDate('2026-01-05T14:30:00Z')).toBe('Jan 5, 2026')
  })

  it('returns empty string for null, undefined, or unparseable input', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('not-a-date')).toBe('')
  })
})

describe('sortOpenItems', () => {
  it('sorts by due date ascending with nulls last', () => {
    const items: PersonOpenItem[] = [
      { id: 'a', kind: 'task', title: 'A', status: 'todo', priority: null, dueDate: null },
      { id: 'b', kind: 'task', title: 'B', status: 'todo', priority: null, dueDate: '2026-07-01' },
      { id: 'c', kind: 'action-item', title: 'C', status: 'open', priority: null, dueDate: '2026-06-15' },
    ]
    const result = sortOpenItems(items)
    expect(result.map(i => i.id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the input array', () => {
    const items: PersonOpenItem[] = [
      { id: 'b', kind: 'task', title: 'B', status: 'todo', priority: null, dueDate: '2026-07-01' },
      { id: 'c', kind: 'task', title: 'C', status: 'todo', priority: null, dueDate: '2026-06-15' },
    ]
    sortOpenItems(items)
    expect(items[0].id).toBe('b')
  })
})

describe('splitOneOnOnes', () => {
  const meetings: PersonOneOnOne[] = [
    { id: 'past1', date: '2026-06-01', topic: null, notes: 'old' },
    { id: 'past2', date: '2026-06-20', topic: null, notes: 'recent' },
    { id: 'future1', date: '2026-06-30', topic: null, notes: null },
    { id: 'future2', date: '2026-07-10', topic: null, notes: null },
  ]

  it('returns recent meetings newest-first', () => {
    const { recent } = splitOneOnOnes(meetings, '2026-06-25')
    expect(recent.map(m => m.id)).toEqual(['past2', 'past1'])
  })

  it('returns the earliest future meeting as next', () => {
    const { next } = splitOneOnOnes(meetings, '2026-06-25')
    expect(next?.id).toBe('future1')
  })

  it('returns null next when no future meeting exists', () => {
    const { next } = splitOneOnOnes(meetings, '2026-08-01')
    expect(next).toBeNull()
  })
})
