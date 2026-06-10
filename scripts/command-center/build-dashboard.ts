import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assembleDashboard } from './dashboard-data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const DEFAULT_REFRESH_SECONDS = 600

export function todayIso(): string { return new Date().toISOString().slice(0, 10) }

function localStamp(): { generatedAt: string; hour: number } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const generatedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return { generatedAt, hour: now.getHours() }
}

/** Read the day's agent files, assemble the Dashboard, inject into the template,
 *  write dashboard.html. Returns the output path. Used by gather + capture. */
export function writeDashboard(date: string): string {
  // NOTE: scaffold copies the template copy-if-missing — if the template seam changes,
  // delete command-center/templates/dashboard.template.html and re-run npm run command-center:scaffold
  const templatePath = join(CC, 'templates', 'dashboard.template.html')
  if (!existsSync(templatePath)) {
    throw new Error(`Dashboard template not found at ${templatePath}. Run: npm run command-center:scaffold`)
  }
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })
  const read = (f: string): string | null => (existsSync(join(dayDir, f)) ? readFileSync(join(dayDir, f), 'utf8') : null)
  const { generatedAt, hour } = localStamp()
  const dashboard = assembleDashboard({
    focusMd: read('01-focus.md') ?? '',
    capturesMd: read('02-captures.md'),
    summaryMd: read('03-summary.md'),
    generatedAt, hour, date,
  })
  const json = JSON.stringify(dashboard).replace(/<\/script>/gi, '<\\/script>')
  const html = readFileSync(templatePath, 'utf8')
    .replace('{{DATA_JSON}}', () => json)           // callback bypasses $-pattern interpolation
    .replaceAll('{{GENERATED_AT}}', generatedAt)
    .replaceAll('{{REFRESH_SECONDS}}', String(DEFAULT_REFRESH_SECONDS))
  const outPath = join(dayDir, 'dashboard.html')
  writeFileSync(outPath, html, 'utf8')
  return outPath
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const out = writeDashboard(parseDateArg())
  console.log(`dashboard written: ${out}`)
}
