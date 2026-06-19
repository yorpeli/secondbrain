import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rankSlots, pickSpread, DEFAULT_CONSTRAINTS } from '../find-times.js'

const NOW = '2026-06-15T08:00' // a Monday morning

test('returns 30-min slots within working hours, skipping lunch', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30, busy: [], nowNaive: NOW,
  })
  // all slots on the requested day, none crossing lunch (13:00-14:00 default)
  assert.ok(slots.length > 0)
  for (const s of slots) {
    assert.ok(s.start.startsWith('2026-06-15'))
    const h = Number(s.start.slice(11, 13))
    assert.ok(h >= DEFAULT_CONSTRAINTS.dayStartHour && h < DEFAULT_CONSTRAINTS.dayEndHour)
    assert.notEqual(h, DEFAULT_CONSTRAINTS.lunchStartHour) // 13:00 slot excluded
  }
})

test('excludes slots overlapping a busy block (with gap buffer)', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30,
    busy: [{ start: '2026-06-15T10:00', end: '2026-06-15T11:00' }],
    nowNaive: NOW,
  })
  // nothing may overlap 10:00-11:00, and the 9:45 start (ends 10:15) is blocked by the 15-min gap
  for (const s of slots) {
    assert.ok(!(s.start < '2026-06-15T11:00' && s.end > '2026-06-15T10:00'))
  }
})

test('excludes slots in the past', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-15',
    durationMin: 30, busy: [], nowNaive: '2026-06-15T11:30',
  })
  for (const s of slots) assert.ok(s.start >= '2026-06-15T11:30')
})

test('skips non-workdays (Israel weekend: Friday=5, Saturday=6)', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-19', windowEndDay: '2026-06-20', // Fri + Sat
    durationMin: 30, busy: [], nowNaive: '2026-06-15T08:00',
  })
  assert.equal(slots.length, 0)
})

test('Sunday is a workday (Israel week), so it yields slots', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-21', windowEndDay: '2026-06-21', // Sunday
    durationMin: 30, busy: [], nowNaive: '2026-06-15T08:00',
  })
  assert.ok(slots.length > 0)
})

test('pickSpread returns at most n slots across distinct days', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-15', windowEndDay: '2026-06-18',
    durationMin: 30, busy: [], nowNaive: NOW,
  })
  const picked = pickSpread(slots, 3)
  assert.equal(picked.length, 3)
  const days = new Set(picked.map((s) => s.start.slice(0, 10)))
  assert.equal(days.size, 3) // one per distinct day
})

test('attendee in New York: drops Sunday (their weekend) and keeps only Israel-evening slots that hit NY mornings', () => {
  const slots = rankSlots({
    windowStartDay: '2026-06-21', windowEndDay: '2026-06-25', // Sun..Thu in Israel
    durationMin: 30, busy: [], nowNaive: '2026-06-19T08:00',
    organizerTz: 'Asia/Jerusalem',
    attendees: [{ timezone: 'America/New_York' }],
  })
  assert.ok(slots.length > 0)
  for (const s of slots) {
    assert.notEqual(s.start.slice(0, 10), '2026-06-21') // 2026-06-21 is Sunday = NY weekend
    assert.ok(Number(s.start.slice(11, 13)) >= 16, `${s.start} should be >= 16:00 Israel (NY >= 9:00)`)
  }
  // Israel Mon 16:00 == NY Mon 09:00 — should be offered
  assert.ok(slots.some((s) => s.start === '2026-06-22T16:00'))
})

test('attendee timezone with no overlap yields no slots', () => {
  // Organizer Israel 9-18 vs an attendee whose 9-18 never overlaps (UTC+14 / Kiritimati): pathological
  const slots = rankSlots({
    windowStartDay: '2026-06-22', windowEndDay: '2026-06-22',
    durationMin: 30, busy: [], nowNaive: '2026-06-19T08:00',
    organizerTz: 'Asia/Jerusalem',
    attendees: [{ timezone: 'Pacific/Kiritimati' }],
  })
  assert.equal(slots.length, 0)
})
