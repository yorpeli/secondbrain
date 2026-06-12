// CLI for the per-day docs in command_center_days (summary / reconcile / close).
// The morning focus doc is written by gather-context.ts; captures by capture.ts.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { writeDashboard, todayIso } from './build-dashboard.js'
import { getDay, setSummary, setReconcile } from './store.js'

function argValue(name: string): string | null {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  return arg ? arg.slice(name.length + 3) : null
}

function readDoc(): string {
  const file = argValue('file')
  if (!file) {
    console.error('missing --file=<markdown path>')
    process.exit(1)
  }
  return readFileSync(file, 'utf8')
}

async function main(): Promise<void> {
  const sub = process.argv[2]
  const date = argValue('date') ?? todayIso()

  if (sub === 'summary') {
    await setSummary(date, readDoc())
    const out = await writeDashboard(date)
    console.log(`summary written: command_center_days.${date}; dashboard: ${out}`)
  } else if (sub === 'reconcile') {
    // writes the audit trail and closes the day unless --keep-open is passed
    const keepOpen = process.argv.includes('--keep-open')
    await setReconcile(date, readDoc(), !keepOpen)
    const out = await writeDashboard(date)
    console.log(`reconcile written: command_center_days.${date} (${keepOpen ? 'open' : 'closed'}); dashboard: ${out}`)
  } else if (sub === 'show') {
    const day = await getDay(date)
    if (!day) {
      console.log(`no command_center_days row for ${date}`)
    } else {
      console.log(JSON.stringify({
        day: day.day, status: day.status,
        focus: !!day.focus_md, summary: !!day.summary_md, reconcile: !!day.reconcile_md,
        focus_generated_at: day.focus_generated_at,
        summary_written_at: day.summary_written_at,
        reconciled_at: day.reconciled_at,
      }, null, 2))
    }
  } else {
    console.error('usage: day <summary|reconcile|show> --file=<md> [--date=YYYY-MM-DD] [--keep-open]')
    process.exit(1)
  }
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  main().catch((err) => { console.error(err); process.exit(1) })
}
