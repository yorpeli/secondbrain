import { test } from 'node:test'
import assert from 'node:assert/strict'
import { zonedToUtcMin, partsInZone, formatInZone, workdaysForZone } from '../tz.js'

// 2026-06-21 is a Sunday; June = IDT (UTC+3), EDT (UTC-4), BST (UTC+1), IST (UTC+5:30).
const ilSlot = '2026-06-21T15:30'
const utcMin = zonedToUtcMin(ilSlot, 'Asia/Jerusalem')

test('zonedToUtcMin: Israel 15:30 IDT -> 12:30 UTC', () => {
  assert.equal(utcMin, Date.UTC(2026, 5, 21, 12, 30) / 60000)
})

test('partsInZone roundtrips the source zone', () => {
  const p = partsInZone(utcMin, 'Asia/Jerusalem')
  assert.equal(p.naive, ilSlot)
  assert.equal(p.hour, 15)
  assert.equal(p.dow, 0) // Sunday
})

test('same instant across zones (summer offsets)', () => {
  assert.equal(partsInZone(utcMin, 'America/New_York').hour, 8) // EDT 08:30
  assert.equal(partsInZone(utcMin, 'Europe/London').hour, 13) // BST 13:30
  assert.equal(partsInZone(utcMin, 'Asia/Kolkata').hour, 18) // IST 18:00
  assert.equal(partsInZone(utcMin, 'Asia/Kolkata').minute, 0)
})

test('formatInZone shows HH:MM per zone', () => {
  assert.equal(formatInZone(utcMin, 'Asia/Jerusalem'), '15:30')
  assert.equal(formatInZone(utcMin, 'America/New_York'), '08:30')
  assert.equal(formatInZone(utcMin, 'Asia/Kolkata'), '18:00')
})

test('zonedToUtcMin interprets the SAME wall-clock differently per zone', () => {
  // 09:00 in NY is later (in absolute terms) than 09:00 in Israel
  const ilNine = zonedToUtcMin('2026-06-22T09:00', 'Asia/Jerusalem')
  const nyNine = zonedToUtcMin('2026-06-22T09:00', 'America/New_York')
  assert.ok(nyNine > ilNine) // NY morning happens after Israel morning
  assert.equal(nyNine - ilNine, 7 * 60) // 7h apart in summer
})

test('workdaysForZone: Israel Sun-Thu, others Mon-Fri', () => {
  assert.deepEqual(workdaysForZone('Asia/Jerusalem'), [0, 1, 2, 3, 4])
  assert.deepEqual(workdaysForZone('America/New_York'), [1, 2, 3, 4, 5])
  assert.deepEqual(workdaysForZone('Asia/Kolkata'), [1, 2, 3, 4, 5])
})
