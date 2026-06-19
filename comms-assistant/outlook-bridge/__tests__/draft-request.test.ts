import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateDraftRequest,
  buildOsascriptArgs,
  plainTextToHtml,
  normalizeDashes,
  validateMarkReadRequest,
  buildMarkReadArgs,
  validateOpenRequest,
  buildOpenArgs,
} from '../draft-request.js'

test('rejects non-object', () => {
  assert.equal(validateDraftRequest(null).ok, false)
  assert.equal(validateDraftRequest('x').ok, false)
})

test('rejects bad mode', () => {
  const r = validateDraftRequest({ mode: 'send', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('rejects empty body', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: '' })
  assert.equal(r.ok, false)
})

test('fresh requires at least one recipient', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: [], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('reply requires non-empty subject', () => {
  const r = validateDraftRequest({ mode: 'reply', to: [], subject: '', body: 'b' })
  assert.equal(r.ok, false)
})

test('accepts valid fresh', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value.mode, 'fresh')
})

test('accepts valid reply', () => {
  const r = validateDraftRequest({
    mode: 'reply', to: [], subject: 'Hello', body: 'hi',
    replyKey: { internetMessageId: '<abc@x>' },
  })
  assert.equal(r.ok, true)
})

test('buildOsascriptArgs fresh joins recipients, empty imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'fresh', to: [' a@b.com ', 'c@d.com', ''], subject: 'Sub', body: 'Body',
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'fresh', 'Sub', 'Body', 'a@b.com,c@d.com', ''])
})

test('buildOsascriptArgs reply empty recipients, passes imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'reply', to: [], subject: 'Re: x', body: 'Body', replyKey: { internetMessageId: '<id@x>' },
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'reply', 'Re: x', 'Body', '', '<id@x>'])
})

test('plainTextToHtml maps newlines to <br> and preserves single line', () => {
  assert.equal(plainTextToHtml('one line'), 'one line')
  assert.equal(plainTextToHtml('a\nb'), 'a<br>b')
  assert.equal(plainTextToHtml('p1\n\np2'), 'p1<br><br>p2')
  assert.equal(plainTextToHtml('a\r\nb\rc'), 'a<br>b<br>c') // CRLF and lone CR normalized
})

test('plainTextToHtml escapes HTML special chars before adding markup', () => {
  assert.equal(plainTextToHtml('a & b < c > d'), 'a &amp; b &lt; c &gt; d')
  // & escaped to &amp; (not double-escaped), then newline → <br>
  assert.equal(plainTextToHtml('R&D\nnext'), 'R&amp;D<br>next')
})

test('buildOsascriptArgs converts a multi-paragraph body to HTML breaks (and strips dashes)', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'reply', to: [], subject: 'Re: x', body: 'Hi —\n\nLine two.', replyKey: { internetMessageId: '<id@x>' },
  })
  // PINNED no-dash rule: the em-dash in the body is normalized to a hyphen.
  assert.equal(args[3], 'Hi -<br><br>Line two.')
})

test('normalizeDashes maps em/en/figure/bar dashes to a hyphen, leaves hyphens alone', () => {
  assert.equal(normalizeDashes('a — b'), 'a - b')   // em
  assert.equal(normalizeDashes('a – b'), 'a - b')   // en
  assert.equal(normalizeDashes('word—word'), 'word-word')
  assert.equal(normalizeDashes('already - fine'), 'already - fine')
})

test('buildOsascriptArgs strips dashes from a FRESH subject but preserves a reply subject (locate)', () => {
  const fresh = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'fresh', to: ['a@b.com'], subject: 'eBay workshop — thank you', body: 'b',
  })
  assert.equal(fresh[2], 'eBay workshop - thank you')
  const reply = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'reply', to: [], subject: 'Re: eBay workshop — thank you', body: 'b', replyKey: { internetMessageId: '<id@x>' },
  })
  // reply subject left intact so the AppleScript can still locate the original by subject
  assert.equal(reply[2], 'Re: eBay workshop — thank you')
})

// --- mark-read (bridge primary path) ---

test('validateMarkReadRequest rejects non-object', () => {
  assert.equal(validateMarkReadRequest(null).ok, false)
  assert.equal(validateMarkReadRequest('x').ok, false)
})

test('validateMarkReadRequest requires a non-empty subject to locate the message', () => {
  assert.equal(validateMarkReadRequest({ subject: '' }).ok, false)
  assert.equal(validateMarkReadRequest({}).ok, false)
})

test('validateMarkReadRequest accepts subject + optional reply key', () => {
  const r = validateMarkReadRequest({ subject: 'Weekly digest', replyKey: { internetMessageId: '<id@x>' } })
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.equal(r.value.subject, 'Weekly digest')
    assert.equal(r.value.replyKey?.internetMessageId, '<id@x>')
  }
})

test('validateMarkReadRequest accepts subject with no reply key', () => {
  const r = validateMarkReadRequest({ subject: 'Weekly digest' })
  assert.equal(r.ok, true)
})

test('buildMarkReadArgs uses read mode, empty body + recipients, passes imid', () => {
  const args = buildMarkReadArgs('/p/draft.applescript', {
    subject: 'Weekly digest', replyKey: { internetMessageId: '<id@x>' },
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'read', 'Weekly digest', '', '', '<id@x>'])
})

test('buildMarkReadArgs tolerates a missing reply key (empty imid)', () => {
  const args = buildMarkReadArgs('/p/draft.applescript', { subject: 'Weekly digest' })
  assert.deepEqual(args, ['/p/draft.applescript', 'read', 'Weekly digest', '', '', ''])
})

// --- open-in-outlook (pop the desktop message) ---

test('validateOpenRequest requires a non-empty subject to locate the message', () => {
  assert.equal(validateOpenRequest({ subject: '' }).ok, false)
  assert.equal(validateOpenRequest({}).ok, false)
})

test('validateOpenRequest accepts subject + optional reply key', () => {
  const r = validateOpenRequest({ subject: 'Weekly digest', replyKey: { internetMessageId: '<id@x>' } })
  assert.equal(r.ok, true)
})

test('buildOpenArgs uses open mode, empty body + recipients, passes imid', () => {
  const args = buildOpenArgs('/p/draft.applescript', {
    subject: 'Weekly digest', replyKey: { internetMessageId: '<id@x>' },
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'open', 'Weekly digest', '', '', '<id@x>'])
})

test('buildOpenArgs tolerates a missing reply key (empty imid)', () => {
  const args = buildOpenArgs('/p/draft.applescript', { subject: 'Weekly digest' })
  assert.deepEqual(args, ['/p/draft.applescript', 'open', 'Weekly digest', '', '', ''])
})
