import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeGroup } from '../meeting-request.js'

test('normalizeGroup canonicalizes skip-level phrasings', () => {
  assert.equal(normalizeGroup('skip-levels'), 'skip-levels')
  assert.equal(normalizeGroup('skip levels'), 'skip-levels')
  assert.equal(normalizeGroup('my skips'), 'skip-levels')
  assert.equal(normalizeGroup('Skip Levels'), 'skip-levels')
})

test('normalizeGroup canonicalizes directs phrasings', () => {
  assert.equal(normalizeGroup('directs'), 'directs')
  assert.equal(normalizeGroup('my direct reports'), 'directs')
  assert.equal(normalizeGroup('direct-reports'), 'directs')
})

test('normalizeGroup returns null for unknown', () => {
  assert.equal(normalizeGroup('the marketing team'), null)
})
