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

const EMPTY_FOCUS = '<p class="empty">No focus gathered yet — run "gather context".</p>'
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
