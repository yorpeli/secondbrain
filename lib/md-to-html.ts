// ----------------------------------------------------------------------------
// Minimal, self-contained markdown -> HTML renderer.
// Shared by the initiative-review page and the command-center dashboard.
// Source docs follow a known template (## headings, bullet/ordered lists,
// [date] append-only logs, **bold**, GitHub-style tables, links). Source is
// HTML-escaped first. No external dependencies; no side effects on import.
// ----------------------------------------------------------------------------
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(text: string): string {
  let t = escapeHtml(text)
  // inline code
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  // bold
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // italic (avoid matching ** already consumed)
  t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
  t = t.replace(/(^|[^_])_([^_\s][^_]*?)_/g, '$1<em>$2</em>')
  // links [text](url)
  t = t.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    (_m, label, url) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
  )
  // highlight leading [date] tokens in log lines
  t = t.replace(/^\[(\d{4}-\d{2}-\d{2})\]/, '<span class="logdate">[$1]</span>')
  return t
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line)
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('-')
}

function splitRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li]
    const line = raw.trimEnd()

    // GitHub-style table: a pipe row followed by a separator row
    if (isTableRow(line) && li + 1 < lines.length && isTableSeparator(lines[li + 1])) {
      closeList()
      const header = splitRow(line)
      const rows: string[][] = []
      li += 2 // skip header + separator
      while (li < lines.length && isTableRow(lines[li])) {
        rows.push(splitRow(lines[li]))
        li++
      }
      li-- // step back; loop will increment
      const thead =
        '<thead><tr>' +
        header.map((h) => `<th>${inline(h)}</th>`).join('') +
        '</tr></thead>'
      const tbody =
        '<tbody>' +
        rows
          .map(
            (r) =>
              '<tr>' +
              header.map((_, ci) => `<td>${inline(r[ci] ?? '')}</td>`).join('') +
              '</tr>'
          )
          .join('') +
        '</tbody>'
      out.push(`<table>${thead}${tbody}</table>`)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    // horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList()
      out.push('<hr/>')
      continue
    }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      closeList()
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }

    // unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        out.push('<ul>')
        listType = 'ul'
      }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }

    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        out.push('<ol>')
        listType = 'ol'
      }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }

    // paragraph
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}
