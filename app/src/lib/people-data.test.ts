import { describe, it, expect } from 'vitest'
import { sortOpenItems, splitOneOnOnes } from './people-data'
import type { PersonOpenItem, PersonOneOnOne } from './types'

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
