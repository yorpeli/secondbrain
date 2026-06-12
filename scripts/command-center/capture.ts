import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { writeDashboard, todayIso } from './build-dashboard.js'
import { lastWindowEnd, insertCapture, type CapturePayload } from './store.js'

const DAY_MS = 86_400_000
const DEFAULT_LOOKBACK_DAYS = 3
const MAX_LOOKBACK_DAYS = 7

export interface CaptureWindow {
  start: string
  end: string
  reason: 'last-capture' | 'default-3d' | 'capped-7d'
}

/**
 * Compute the capture lookback window. Pure — no IO.
 * `lastEndIso` is the most recent capture's window_end from the DB.
 * - no prior capture   → start = now − 3d   (first run ever)
 * - last end ≤ 7d old  → start = last end   (incremental; Sunday reaches back to Thu)
 * - last end > 7d old  → start = now − 7d   (long gap — sweep the last week, not the whole gap)
 */
export function computeWindow(lastEndIso: string | null, now: Date): CaptureWindow {
  const end = now.toISOString()
  if (!lastEndIso) {
    return {
      start: new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'default-3d',
    }
  }
  const last = new Date(lastEndIso)
  const ageMs = now.getTime() - last.getTime()
  if (ageMs > MAX_LOOKBACK_DAYS * DAY_MS) {
    return {
      start: new Date(now.getTime() - MAX_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'capped-7d',
    }
  }
  return { start: last.toISOString(), end, reason: 'last-capture' }
}

function argValue(name: string): string | null {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  return arg ? arg.slice(name.length + 3) : null
}

async function runWindow(): Promise<void> {
  const last = await lastWindowEnd()
  console.log(JSON.stringify(computeWindow(last, new Date()), null, 2))
}

async function runAdd(): Promise<void> {
  const payloadPath = argValue('payload')
  if (!payloadPath) {
    console.error('usage: capture add --payload=<json path> [--date=YYYY-MM-DD]')
    process.exit(1)
  }
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as CapturePayload
  if (!payload.headline || !payload.body_md) {
    console.error('payload must include "headline" and "body_md"')
    process.exit(1)
  }
  const date = argValue('date') ?? payload.day ?? todayIso()
  const id = await insertCapture({ ...payload, day: date })
  const out = await writeDashboard(date)
  console.log(`capture stored (${id}); dashboard written: ${out}`)
}

async function runDone(): Promise<void> {
  const date = argValue('date') ?? todayIso()
  const out = await writeDashboard(date)
  console.log(`dashboard written: ${out}`)
}

// CLI: only run when invoked directly, not when imported (tests import the pure fns).
const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const sub = process.argv[2]
  const run =
    sub === 'window' ? runWindow :
    sub === 'add' ? runAdd :
    sub === 'done' ? runDone :
    null
  if (!run) {
    console.error('usage: capture <window|add|done> [--payload=path] [--date=YYYY-MM-DD]')
    process.exit(1)
  }
  run().catch((err) => { console.error(err); process.exit(1) })
}
