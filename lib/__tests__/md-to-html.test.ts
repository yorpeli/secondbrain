import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown, escapeHtml } from '../md-to-html.js'

describe('escapeHtml', () => {
  it('escapes &, <, >', () => {
    assert.equal(escapeHtml('a & b <c> d'), 'a &amp; b &lt;c&gt; d')
  })
})

describe('renderMarkdown', () => {
  it('renders headings by level', () => {
    assert.equal(renderMarkdown('## Status'), '<h2>Status</h2>')
    assert.equal(renderMarkdown('#### Deep'), '<h4>Deep</h4>')
  })

  it('renders bold and inline code', () => {
    assert.equal(renderMarkdown('**hi** `x`'), '<p><strong>hi</strong> <code>x</code></p>')
  })

  it('groups consecutive bullets into one <ul>', () => {
    const html = renderMarkdown('- one\n- two')
    assert.equal(html, '<ul>\n<li>one</li>\n<li>two</li>\n</ul>')
  })

  it('renders an ordered list', () => {
    const html = renderMarkdown('1. first\n2. second')
    assert.equal(html, '<ol>\n<li>first</li>\n<li>second</li>\n</ol>')
  })

  it('wraps a leading [date] token in a logdate span', () => {
    const html = renderMarkdown('[2026-06-05] shipped')
    assert.ok(html.includes('<span class="logdate">[2026-06-05]</span> shipped'))
  })

  it('renders a GitHub-style table', () => {
    const html = renderMarkdown('| A | B |\n| - | - |\n| 1 | 2 |')
    assert.ok(html.startsWith('<table>'))
    assert.ok(html.includes('<th>A</th>'))
    assert.ok(html.includes('<td>1</td>'))
  })

  it('renders links with target=_blank', () => {
    const html = renderMarkdown('see [docs](https://example.com)')
    assert.ok(html.includes('<a href="https://example.com" target="_blank" rel="noopener">docs</a>'))
  })
})
