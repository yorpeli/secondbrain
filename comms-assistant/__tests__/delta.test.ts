import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { detectLang, structuralDelta } from '../delta.js'

describe('detectLang', () => {
  it('English', () => assert.equal(detectLang('Can we push this'), 'en'))
  it('Hebrew', () => assert.equal(detectLang('חשבתי שזה קרה'), 'he'))
  it('mixed', () => assert.equal(detectLang('Walla ? חשבתי'), 'mixed'))
  it('empty', () => assert.equal(detectLang('   '), 'empty'))
})

describe('structuralDelta', () => {
  it('length ratio + language match', () => {
    const d = structuralDelta('Hi there', 'Hi')
    assert.equal(d.lengthRatio, 4)
    assert.equal(d.languageMatch, true)
  })

  it('language mismatch flagged', () => {
    const d = structuralDelta('Yes, aligned', 'כן, מסכים')
    assert.equal(d.languageMatch, false)
  })

  it('empty actual → ratio 0', () => {
    const d = structuralDelta('something', '')
    assert.equal(d.lengthRatio, 0)
  })
})
