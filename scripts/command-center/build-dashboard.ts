import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assembleDashboard, capturesToMarkdown } from './dashboard-data.js'
import { getDay, listCaptures } from './store.js'

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

/** Workspace copy if scaffolded (restylable in place), else the bundled asset —
 *  so rendering works in fresh containers without a scaffold step. */
function templatePath(): string {
  const workspace = join(CC, 'templates', 'dashboard.template.html')
  return existsSync(workspace) ? workspace : join(__dirname, 'assets', 'dashboard.template.html')
}

/** Read the day's docs + captures from Supabase, assemble the Dashboard, inject
 *  into the template, write dashboard.html. Returns the output path. */
export async function writeDashboard(date: string): Promise<string> {
  const [day, captures] = await Promise.all([getDay(date), listCaptures(date)])
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })
  const { generatedAt, hour } = localStamp()
  const dashboard = assembleDashboard({
    focusMd: day?.focus_md ?? '',
    capturesMd: captures.length ? capturesToMarkdown(captures) : null,
    summaryMd: day?.summary_md ?? null,
    generatedAt, hour, date,
  })
  const json = JSON.stringify(dashboard).replace(/<\/script>/gi, '<\\/script>')
  const html = readFileSync(templatePath(), 'utf8')
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
  writeDashboard(parseDateArg())
    .then((out) => console.log(`dashboard written: ${out}`))
    .catch((err) => { console.error(err); process.exit(1) })
}
