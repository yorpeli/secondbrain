# Command Center — Slice 1 (Morning Loop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `command-center/` workspace and the morning arc of the daily loop — this (Supabase) session assembles "what matters" into `daily/<date>/01-focus.md` and renders a self-contained, self-refreshing `dashboard.html`.

**Architecture:** A gitignored `command-center/` folder is the shared local workspace between this session and the MSFT Claude Code session. Deterministic `tsx` scripts (matching the repo's `scripts/*` + `npm run` convention) do the work: `scaffold` creates the folder from committed asset templates; `build-dashboard` renders the living dashboard from a template + the daily markdown files; `gather-context` (Skill A) queries Supabase, writes `01-focus.md`, then renders the dashboard. Markdown→HTML rendering is extracted from the existing `initiative-review/build.ts` into a shared, side-effect-free `lib/md-to-html.ts` so it can be unit-tested and reused.

**Tech Stack:** TypeScript run via `tsx`; `@supabase/supabase-js` via `lib/supabase.ts` (env-based); `node:test` + `node:assert/strict` for unit tests (the repo's existing convention — see `analytics/lib/__tests__/`); no new dependencies.

**Out of scope for this slice (later plans):** Skill B (MSFT daily skill — intraday captures + EOD summary) and Skill C (close-the-day reconcile/write-back to Supabase). This slice deliberately stops at a working, viewable morning dashboard.

---

## File Structure

**Created:**
- `lib/md-to-html.ts` — shared, side-effect-free markdown→HTML renderer (moved out of `initiative-review/build.ts`). Exports `renderMarkdown`, `escapeHtml`.
- `lib/__tests__/md-to-html.test.ts` — unit tests for the renderer.
- `scripts/command-center/assets/dashboard.template.html` — **committed** canonical dashboard template (the working copy is copied into the gitignored folder).
- `scripts/command-center/assets/routing.starter.md` — **committed** starter routing doc.
- `scripts/command-center/scaffold.ts` — creates `command-center/{context,templates,daily}/` and copies assets if missing.
- `scripts/command-center/build-dashboard.ts` — renders `daily/<date>/dashboard.html` from the template + daily files. Exports `renderDashboard`, `orderCapturesNewestFirst`, `writeDashboard`.
- `scripts/command-center/__tests__/build-dashboard.test.ts` — unit tests for the pure render helpers.
- `scripts/command-center/gather-context.ts` — Skill A: queries Supabase, writes `01-focus.md`, renders the dashboard.
- `.claude/skills/command-center-gather/SKILL.md` — natural-language trigger for "gather context".

**Modified:**
- `.gitignore` — add `command-center/`.
- `scripts/initiative-review/build.ts:55-193` — delete the moved renderer functions; import from `lib/md-to-html.js`.
- `package.json` — add `command-center:scaffold`, `command-center:dashboard`, `command-center:gather` scripts.
- `CLAUDE.md` — add a natural-language trigger row for "gather context".

---

## Task 1: Extract the shared markdown renderer

Moves the proven renderer out of the side-effectful `build.ts` (which runs `main()` on import) into a clean, testable lib. `build.ts` keeps working by importing it.

**Files:**
- Create: `lib/md-to-html.ts`
- Create: `lib/__tests__/md-to-html.test.ts`
- Modify: `scripts/initiative-review/build.ts` (remove lines 55-193, add an import)

- [ ] **Step 1: Create `lib/md-to-html.ts` with the renderer (verbatim move, `export` added)**

```typescript
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
```

- [ ] **Step 2: Write the failing test**

Create `lib/__tests__/md-to-html.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run the test — expect PASS (the lib already exists from Step 1)**

Run: `node --import tsx --test lib/__tests__/md-to-html.test.ts`
Expected: all tests pass — output ends with `# pass 8` and `# fail 0`.
(If `--import tsx` is unavailable on this Node, use `npx tsx --test lib/__tests__/md-to-html.test.ts`.)

- [ ] **Step 4: Refactor `scripts/initiative-review/build.ts` to use the lib**

Delete lines 49-193 (the comment banner through the end of `renderMarkdown`) — i.e. remove `escapeHtml`, `inline`, `isTableRow`, `isTableSeparator`, `splitRow`, `renderMarkdown`. Then add this import alongside the existing imports at the top of the file (after the `import { getSupabase } from '../../lib/supabase.js'` line):

```typescript
import { renderMarkdown, escapeHtml } from '../../lib/md-to-html.js'
```

Leave every *call site* of `renderMarkdown(...)` and `escapeHtml(...)` later in the file unchanged — they now resolve to the imported functions. `inline`, `isTableRow`, `isTableSeparator`, `splitRow` are internal to the lib and are not referenced elsewhere in `build.ts` (verified).

- [ ] **Step 5: Verify `build.ts` no longer defines the moved functions and still references the imported ones**

Run: `grep -n "function escapeHtml\|function renderMarkdown\|function inline\|function isTableRow" scripts/initiative-review/build.ts`
Expected: no output (none defined locally anymore).

Run: `grep -c "escapeHtml\|renderMarkdown" scripts/initiative-review/build.ts`
Expected: a non-zero count (call sites + the import line remain).

- [ ] **Step 6: Verify the initiative-review page still builds end-to-end**

Run: `npm run initiative-review`
Expected: completes without error and writes `output/initiatives/initiative-review.html`.
(If this machine has no Supabase env configured and the script errors on the DB connection rather than on the renderer, that is acceptable for this step — the renderer change is already proven by Step 3 and Step 5. Note it and continue.)

- [ ] **Step 7: Commit**

```bash
git add lib/md-to-html.ts lib/__tests__/md-to-html.test.ts scripts/initiative-review/build.ts
git commit -m "refactor: extract shared markdown renderer into lib/md-to-html"
```

---

## Task 2: Folder scaffold + gitignore + committed assets

Creates the workspace on demand from committed templates, and keeps `command-center/` out of git.

**Files:**
- Modify: `.gitignore`
- Create: `scripts/command-center/assets/dashboard.template.html`
- Create: `scripts/command-center/assets/routing.starter.md`
- Create: `scripts/command-center/scaffold.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `command-center/` to `.gitignore`**

Append these two lines to `.gitignore`:

```
# Local daily working workspace (raw comms — never committed)
command-center/
```

- [ ] **Step 2: Create the committed dashboard template**

Create `scripts/command-center/assets/dashboard.template.html`. The build script replaces the `{{...}}` tokens. `{{REFRESH_SECONDS}}` drives the self-refresh.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="{{REFRESH_SECONDS}}" />
  <title>Command Center — {{DATE}}</title>
  <style>
    :root {
      --bg: #0f1117; --panel: #171a22; --panel2: #1d212b; --ink: #e7e9ee;
      --muted: #9aa3b2; --line: #2a2f3a; --accent: #5b8cff; --ok: #3ecf8e;
      --warn: #f5b14c; --risk: #ff6b6b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; background: var(--bg); color: var(--ink);
      font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    header {
      padding: 22px 28px; border-bottom: 1px solid var(--line);
      display: flex; align-items: baseline; justify-content: space-between;
    }
    header h1 { margin: 0; font-size: 20px; letter-spacing: .2px; }
    header .gen { color: var(--muted); font-size: 12px; }
    main {
      display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
      padding: 22px 28px; max-width: 1280px;
    }
    .card {
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 12px; padding: 18px 20px; overflow: hidden;
    }
    .card.wide { grid-column: 1 / -1; }
    .card h2 {
      margin: 0 0 10px; font-size: 13px; text-transform: uppercase;
      letter-spacing: .8px; color: var(--muted);
    }
    .card :is(h2, h3, h4) + * { margin-top: 6px; }
    .body h2 { text-transform: none; letter-spacing: 0; color: var(--ink); font-size: 15px; margin: 14px 0 4px; }
    .body h3 { font-size: 14px; color: var(--ink); margin: 12px 0 4px; }
    .body p { margin: 6px 0; }
    .body ul, .body ol { margin: 6px 0 6px 18px; padding: 0; }
    .body li { margin: 3px 0; }
    .body code { background: var(--panel2); padding: 1px 5px; border-radius: 4px; font-size: 13px; }
    .body a { color: var(--accent); }
    .body table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 13px; }
    .body th, .body td { border: 1px solid var(--line); padding: 5px 8px; text-align: left; }
    .body hr { border: 0; border-top: 1px solid var(--line); margin: 12px 0; }
    .logdate { color: var(--accent); font-weight: 600; }
    .empty { color: var(--muted); font-style: italic; }
  </style>
</head>
<body>
  <header>
    <h1>Command Center — {{DATE}}</h1>
    <span class="gen">generated {{GENERATED_AT}} · auto-refresh {{REFRESH_SECONDS}}s</span>
  </header>
  <main>
    <section class="card wide">
      <h2>Today's Focus</h2>
      <div class="body">{{FOCUS_HTML}}</div>
    </section>
    <section class="card">
      <h2>Live Signals</h2>
      <div class="body">{{CAPTURES_HTML}}</div>
    </section>
    <section class="card">
      <h2>Summary &amp; Follow-ups</h2>
      <div class="body">{{SUMMARY_HTML}}</div>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 3: Create the committed starter routing doc**

Create `scripts/command-center/assets/routing.starter.md`:

```markdown
# Routing — where to read what matters

> Durable index for the MSFT Claude Code session. Maps current priorities to
> where the real material lives. Maintained occasionally, not daily. Edit freely.

## Active initiatives → local material
<!-- Filled in as workspaces are added, e.g.:
- clm-war-room → initiatives/clm-war-room/  (read CLAUDE.md + memory.md first)
-->

## External sources
- KYC team repo (read-only, Azure DevOps) — Elad's "Product KYC Team", branch KYC_Team_Branch.

## People who matter this period
<!-- e.g. direct reports, key stakeholders for the current focus -->

## Notes
- This folder (`command-center/`) is gitignored. Raw comms stay local.
```

- [ ] **Step 4: Create `scripts/command-center/scaffold.ts`**

```typescript
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const ASSETS = join(__dirname, 'assets')

function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true })
}

function copyIfMissing(src: string, dest: string): 'copied' | 'kept' {
  if (existsSync(dest)) return 'kept'
  copyFileSync(src, dest)
  return 'copied'
}

export function scaffold(): void {
  ensureDir(join(CC, 'context'))
  ensureDir(join(CC, 'templates'))
  ensureDir(join(CC, 'daily'))

  const t = copyIfMissing(
    join(ASSETS, 'dashboard.template.html'),
    join(CC, 'templates', 'dashboard.template.html')
  )
  const r = copyIfMissing(
    join(ASSETS, 'routing.starter.md'),
    join(CC, 'context', 'routing.md')
  )

  console.log(`command-center scaffolded at ${CC}`)
  console.log(`  templates/dashboard.template.html: ${t}`)
  console.log(`  context/routing.md: ${r}`)
}

scaffold()
```

- [ ] **Step 5: Add the npm script**

In `package.json` `scripts`, add:

```json
"command-center:scaffold": "tsx scripts/command-center/scaffold.ts",
```

- [ ] **Step 6: Run the scaffold and verify**

Run: `npm run command-center:scaffold`
Expected: prints the scaffold paths with `copied` for both files on first run.

Run: `ls command-center command-center/context command-center/templates`
Expected: `context/ templates/ daily/` exist; `context/routing.md` and `templates/dashboard.template.html` exist.

Run: `git status --porcelain command-center`
Expected: **no output** (the folder is gitignored).

- [ ] **Step 7: Commit**

```bash
git add .gitignore scripts/command-center/assets/dashboard.template.html scripts/command-center/assets/routing.starter.md scripts/command-center/scaffold.ts package.json
git commit -m "feat(command-center): scaffold workspace + gitignore + committed assets"
```

---

## Task 3: Dashboard build script

Renders `daily/<date>/dashboard.html` from the template + whichever of `01`/`02`/`03` exist. Pure render functions are unit-tested; the CLI does file IO.

**Files:**
- Create: `scripts/command-center/build-dashboard.ts`
- Create: `scripts/command-center/__tests__/build-dashboard.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/command-center/build-dashboard.ts`**

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderMarkdown } from '../../lib/md-to-html.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')

const DEFAULT_REFRESH_SECONDS = 60

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Reorder an append-only captures doc so the newest `## HH:MM` block is first.
 * Any preamble before the first `## ` heading is kept at the top.
 */
export function orderCapturesNewestFirst(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[][] = []
  let preamble: string[] = []
  let cur: string[] | null = null
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (cur) blocks.push(cur)
      cur = [line]
    } else if (cur) {
      cur.push(line)
    } else {
      preamble.push(line)
    }
  }
  if (cur) blocks.push(cur)
  const ordered = blocks.reverse().map((b) => b.join('\n').replace(/\n+$/, '')).join('\n\n')
  const pre = preamble.join('\n').trim()
  return [pre, ordered].filter(Boolean).join('\n\n')
}

interface DashboardParts {
  template: string
  date: string
  focusMd: string | null
  capturesMd: string | null
  summaryMd: string | null
  generatedAt: string
  refreshSeconds: number
}

const EMPTY_FOCUS = '<p class="empty">No focus gathered yet — run “gather context”.</p>'
const EMPTY_CAPTURES = '<p class="empty">No signals captured yet today.</p>'
const EMPTY_SUMMARY = '<p class="empty">No end-of-day summary yet.</p>'

export function renderDashboard(p: DashboardParts): string {
  const focusHtml = p.focusMd ? renderMarkdown(p.focusMd) : EMPTY_FOCUS
  const capturesHtml = p.capturesMd
    ? renderMarkdown(orderCapturesNewestFirst(p.capturesMd))
    : EMPTY_CAPTURES
  const summaryHtml = p.summaryMd ? renderMarkdown(p.summaryMd) : EMPTY_SUMMARY
  return p.template
    .replaceAll('{{DATE}}', p.date)
    .replaceAll('{{GENERATED_AT}}', p.generatedAt)
    .replaceAll('{{REFRESH_SECONDS}}', String(p.refreshSeconds))
    .replace('{{FOCUS_HTML}}', focusHtml)
    .replace('{{CAPTURES_HTML}}', capturesHtml)
    .replace('{{SUMMARY_HTML}}', summaryHtml)
}

function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

/**
 * Read the template + daily files for `date`, render, and write dashboard.html.
 * Returns the output path. Used by the CLI and by gather-context (Skill A).
 */
export function writeDashboard(date: string): string {
  const templatePath = join(CC, 'templates', 'dashboard.template.html')
  if (!existsSync(templatePath)) {
    throw new Error(
      `Dashboard template not found at ${templatePath}. Run: npm run command-center:scaffold`
    )
  }
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })
  const html = renderDashboard({
    template: readFileSync(templatePath, 'utf8'),
    date,
    focusMd: readIfExists(join(dayDir, '01-focus.md')),
    capturesMd: readIfExists(join(dayDir, '02-captures.md')),
    summaryMd: readIfExists(join(dayDir, '03-summary.md')),
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    refreshSeconds: DEFAULT_REFRESH_SECONDS,
  })
  const outPath = join(dayDir, 'dashboard.html')
  writeFileSync(outPath, html, 'utf8')
  return outPath
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

// CLI entry: only run when invoked directly, not when imported.
const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const out = writeDashboard(parseDateArg())
  console.log(`dashboard written: ${out}`)
}
```

- [ ] **Step 2: Write the failing test**

Create `scripts/command-center/__tests__/build-dashboard.test.ts`:

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderDashboard, orderCapturesNewestFirst } from '../build-dashboard.js'

const TEMPLATE =
  '<title>{{DATE}}</title>|{{GENERATED_AT}}|{{REFRESH_SECONDS}}|' +
  'F:{{FOCUS_HTML}}|C:{{CAPTURES_HTML}}|S:{{SUMMARY_HTML}}'

describe('orderCapturesNewestFirst', () => {
  it('reverses ## HH:MM blocks so newest is first', () => {
    const md = '## 09:00 — morning\nfirst thing\n\n## 14:00 — afternoon\nlater thing'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.indexOf('14:00') < out.indexOf('09:00'))
  })

  it('keeps preamble above the blocks', () => {
    const md = 'intro line\n\n## 09:00 — a\nx\n\n## 10:00 — b\ny'
    const out = orderCapturesNewestFirst(md)
    assert.ok(out.startsWith('intro line'))
    assert.ok(out.indexOf('10:00') < out.indexOf('09:00'))
  })
})

describe('renderDashboard', () => {
  it('substitutes date, refresh, and rendered focus', () => {
    const html = renderDashboard({
      template: TEMPLATE,
      date: '2026-06-05',
      focusMd: '## Status\n- on track',
      capturesMd: null,
      summaryMd: null,
      generatedAt: '2026-06-05 08:00',
      refreshSeconds: 60,
    })
    assert.ok(html.includes('<title>2026-06-05</title>'))
    assert.ok(html.includes('|60|'))
    assert.ok(html.includes('F:<h2>Status</h2>'))
    assert.ok(html.includes('<li>on track</li>'))
  })

  it('uses empty placeholders when sections are missing', () => {
    const html = renderDashboard({
      template: TEMPLATE,
      date: '2026-06-05',
      focusMd: null,
      capturesMd: null,
      summaryMd: null,
      generatedAt: '2026-06-05 08:00',
      refreshSeconds: 60,
    })
    assert.ok(html.includes('C:<p class="empty">No signals captured yet today.</p>'))
    assert.ok(html.includes('S:<p class="empty">No end-of-day summary yet.</p>'))
  })
})
```

- [ ] **Step 3: Run the test — expect PASS**

Run: `node --import tsx --test scripts/command-center/__tests__/build-dashboard.test.ts`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 4: Add the npm script**

In `package.json` `scripts`, add:

```json
"command-center:dashboard": "tsx scripts/command-center/build-dashboard.ts",
```

- [ ] **Step 5: Validate against a hand-written sample day**

Create a sample focus + captures file, render, and confirm the HTML:

```bash
mkdir -p command-center/daily/2026-06-05
printf '## Status\n- CLM cutover on track\n\n## Active Initiatives\n- **CLM War Room** (P0) — at-risk\n' > command-center/daily/2026-06-05/01-focus.md
printf '## 09:15 — Teams: war room sync\nQA env still single-tenant; unowned.\n\n## 13:40 — SharePoint: rollout deck\nUpdated cutover checklist.\n' > command-center/daily/2026-06-05/02-captures.md
npm run command-center:dashboard -- --date=2026-06-05
```

Expected: prints `dashboard written: …/command-center/daily/2026-06-05/dashboard.html`.

Run: `grep -c "CLM War Room\|war room sync\|13:40" command-center/daily/2026-06-05/dashboard.html`
Expected: non-zero. Confirm the `13:40` block appears before the `09:15` block in the rendered HTML:
Run: `grep -o "1[34]:[0-9][0-9]" command-center/daily/2026-06-05/dashboard.html | head -2`
Expected: `13:40` printed before `09:15`.

Then open it to eyeball the living dashboard: `open command-center/daily/2026-06-05/dashboard.html`

- [ ] **Step 6: Remove the sample day (keep the workspace clean) and commit**

```bash
rm -rf command-center/daily/2026-06-05
git add scripts/command-center/build-dashboard.ts scripts/command-center/__tests__/build-dashboard.test.ts package.json
git commit -m "feat(command-center): living dashboard render from template + daily files"
```

---

## Task 4: Skill A — gather-context (Supabase → 01-focus.md → dashboard)

The morning arc. Deterministically assembles "what matters" from Supabase, writes `01-focus.md`, and renders the dashboard. Curation/judgment can be layered on by the operator after; this produces a complete, useful baseline.

**Files:**
- Create: `scripts/command-center/gather-context.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/command-center/gather-context.ts`**

```typescript
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../../lib/supabase.js'
import { writeDashboard, todayIso } from './build-dashboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')

interface InitiativeRow {
  slug: string
  title: string
  status: string
  priority: string | null
  assigned_agent: string | null
}

interface ActionItemRow {
  description: string | null
  owner_name: string | null
  due_date: string | null
}

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim() || '_none_'}\n`
}

async function buildFocusDoc(date: string): Promise<string> {
  const supabase = getSupabase()

  // 1. current_focus (live priorities)
  const { data: cf } = await supabase
    .from('context_store' as any)
    .select('content')
    .eq('key', 'current_focus')
    .maybeSingle()
  const currentFocus =
    cf && (cf as any).content
      ? typeof (cf as any).content === 'string'
        ? (cf as any).content
        : JSON.stringify((cf as any).content, null, 2)
      : ''

  // 2. active initiatives
  const { data: inits } = await supabase
    .from('initiatives' as any)
    .select('slug, title, status, priority, assigned_agent')
    .eq('status', 'active')
  const initiatives = ((inits as unknown as InitiativeRow[]) ?? []).sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? ''] ?? 9
    const pb = PRIORITY_ORDER[b.priority ?? ''] ?? 9
    return pa - pb || a.title.localeCompare(b.title)
  })
  const initiativesBody = initiatives
    .map(
      (i) =>
        `- **${i.title}** (${i.priority ?? '—'}) — ${i.status} · owner: ${
          i.assigned_agent ?? '—'
        }`
    )
    .join('\n')

  // 3. open action items (view: v_open_action_items)
  const { data: ai } = await supabase
    .from('v_open_action_items' as any)
    .select('description, owner_name, due_date')
    .limit(25)
  const actionItems = ((ai as unknown as ActionItemRow[]) ?? [])
    .map((a) => {
      const due = a.due_date ? ` (due ${a.due_date})` : ''
      const owner = a.owner_name ? ` — ${a.owner_name}` : ''
      return `- ${a.description ?? '(no description)'}${owner}${due}`
    })
    .join('\n')

  // 4. portfolio headline from the initiative-review highlights snapshot
  let headline = ''
  const hlPath = join(ROOT, 'scripts', 'initiative-review', 'highlights.json')
  if (existsSync(hlPath)) {
    try {
      const hl = JSON.parse(readFileSync(hlPath, 'utf8')) as {
        _overview?: { headline?: string }
      }
      headline = hl._overview?.headline ?? ''
    } catch {
      headline = ''
    }
  }

  return [
    `# Focus — ${date}`,
    '',
    section('Current Focus', currentFocus),
    section('Active Initiatives', initiativesBody),
    section('Open Action Items', actionItems),
    section('Portfolio Headline', headline),
  ].join('\n')
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

async function main(): Promise<void> {
  const date = parseDateArg()
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })

  const doc = await buildFocusDoc(date)
  const focusPath = join(dayDir, '01-focus.md')
  writeFileSync(focusPath, doc, 'utf8')
  console.log(`focus written: ${focusPath}`)

  const dashPath = writeDashboard(date)
  console.log(`dashboard written: ${dashPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add:

```json
"command-center:gather": "tsx scripts/command-center/gather-context.ts",
```

- [ ] **Step 3: Run Skill A end-to-end against the live DB**

Run: `npm run command-center:gather`
Expected: prints `focus written: …/01-focus.md` and `dashboard written: …/dashboard.html` with no error.

- [ ] **Step 4: Verify the focus doc has real content**

Run: `sed -n '1,40p' command-center/daily/$(date +%F)/01-focus.md`
Expected: an `# Focus — <date>` heading and the four `##` sections, with at least the Active Initiatives section populated by real initiative titles from the DB.

- [ ] **Step 5: Open the dashboard and confirm the morning view renders**

Run: `open command-center/daily/$(date +%F)/dashboard.html`
Expected: "Today's Focus" shows the initiatives/current-focus; "Live Signals" and "Summary" show the quiet empty placeholders; the header shows the date and auto-refresh note.

- [ ] **Step 6: Commit**

```bash
git add scripts/command-center/gather-context.ts package.json
git commit -m "feat(command-center): Skill A gather-context (Supabase to focus + dashboard)"
```

---

## Task 5: Natural-language trigger + docs

Make "gather context" runnable conversationally (the way Yonatan triggers the other agents) and record the convention.

**Files:**
- Create: `.claude/skills/command-center-gather/SKILL.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Create the skill doc**

Create `.claude/skills/command-center-gather/SKILL.md`:

```markdown
---
name: command-center-gather
description: Use when Yonatan says "gather context", "morning brief", "set up
  the command center", "start the day", or asks to assemble today's focus into
  the command-center workspace. Runs the Supabase→focus→dashboard morning arc.
---

# Command Center — Gather Context (Skill A)

The morning arc of the daily loop. This session is the Supabase gateway; the
MSFT Claude Code session reads the files this produces. See
`docs/superpowers/specs/2026-06-05-command-center-daily-loop-design.md`.

## On trigger

1. Ensure the workspace exists (first run only): `npm run command-center:scaffold`
2. Assemble today's focus + render the dashboard: `npm run command-center:gather`
   - Optional explicit date: `npm run command-center:gather -- --date=YYYY-MM-DD`
3. Open it for Yonatan: `open command-center/daily/$(date +%F)/dashboard.html`
4. Skim `01-focus.md`. If curation helps (tighten the current-focus prose, flag
   the day's top 1–3 things), edit the file directly, then re-render with
   `npm run command-center:dashboard -- --date=$(date +%F)`.

## Notes
- `command-center/` is gitignored — never commit it; raw comms stay local.
- This skill only reads Supabase and writes local files. Writing the day's
  outcomes back to Supabase is Skill C ("close the day"), a separate step.
```

- [ ] **Step 2: Add a trigger row to `CLAUDE.md`**

In `CLAUDE.md`, find the "Initiative Review — natural-language trigger" table area and add this short subsection after it (keep the existing content intact):

```markdown
**Command Center — natural-language trigger (Yonatan never runs the CLI; you do):** The `command-center/` workspace is the shared local handoff between this (Supabase) session and the MSFT Claude Code session. See [docs/superpowers/specs/2026-06-05-command-center-daily-loop-design.md](docs/superpowers/specs/2026-06-05-command-center-daily-loop-design.md).

| Yonatan says (or similar) | You do |
|---|---|
| "gather context", "morning brief", "start the day" | First run: `npm run command-center:scaffold`. Then `npm run command-center:gather` → `open command-center/daily/$(date +%F)/dashboard.html`. Skim `01-focus.md`; curate if useful and re-render with `npm run command-center:dashboard -- --date=$(date +%F)`. |
| "refresh the dashboard" | `npm run command-center:dashboard -- --date=$(date +%F)` + open. |
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/command-center-gather/SKILL.md CLAUDE.md
git commit -m "docs(command-center): gather-context skill trigger + CLAUDE.md row"
```

---

## Self-Review

**Spec coverage (against `2026-06-05-command-center-daily-loop-design.md`):**
- Folder contract (`context/`, `templates/`, `daily/<date>/`, gitignored) → Task 2.
- `01-focus.md` payload (current_focus + active initiatives + open action items + highlights overview) → Task 4. *Upcoming hard deadlines* are folded into the current-focus / portfolio-headline content for this slice rather than a dedicated query (no single deadline column exists); noted as a deliberate v1 simplification.
- Living dashboard (template in folder, committed source, re-rendered on touch, `<meta refresh>`, empty placeholders) → Tasks 2 + 3.
- Skill A (assemble focus + render morning dashboard) → Task 4; natural-language trigger → Task 5.
- Privacy/git (gitignore `command-center/`) → Task 2 Step 1 + verified Task 2 Step 6.
- Skills B and C → explicitly out of scope for this slice (separate plans).

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to" — every code step carries full code; every run step has an exact command + expected output.

**Type consistency:** `writeDashboard(date)`, `todayIso()`, `renderDashboard(parts)`, `orderCapturesNewestFirst(md)` are defined in Task 3 and consumed with the same signatures in Task 4. `renderMarkdown`/`escapeHtml` exported in Task 1 and imported in Tasks 1 (build.ts) and 3. Token names in the template (`{{DATE}}`, `{{GENERATED_AT}}`, `{{REFRESH_SECONDS}}`, `{{FOCUS_HTML}}`, `{{CAPTURES_HTML}}`, `{{SUMMARY_HTML}}`) match the replacements in `renderDashboard`.
