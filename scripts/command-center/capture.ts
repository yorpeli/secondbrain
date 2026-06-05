import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDashboard, todayIso } from './build-dashboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const MARKER = join(CC, '.last-capture')

const DAY_MS = 86_400_000
const DEFAULT_LOOKBACK_DAYS = 3
const MAX_LOOKBACK_DAYS = 7

export interface CaptureWindow {
  start: string
  end: string
  reason: 'marker' | 'default-3d' | 'capped-7d'
}

/**
 * Compute the capture lookback window. Pure — no IO.
 * - no marker        → start = now − 3d   (first run ever)
 * - marker ≤ 7d old  → start = marker     (incremental; Sunday reaches back to Thu)
 * - marker > 7d old  → start = now − 7d   (long gap — sweep the last week, not the whole gap)
 */
export function computeWindow(markerIso: string | null, now: Date): CaptureWindow {
  const end = now.toISOString()
  if (!markerIso) {
    return {
      start: new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'default-3d',
    }
  }
  const marker = new Date(markerIso)
  const ageMs = now.getTime() - marker.getTime()
  if (ageMs > MAX_LOOKBACK_DAYS * DAY_MS) {
    return {
      start: new Date(now.getTime() - MAX_LOOKBACK_DAYS * DAY_MS).toISOString(),
      end,
      reason: 'capped-7d',
    }
  }
  return { start: marker.toISOString(), end, reason: 'marker' }
}

export function readMarker(path: string = MARKER): string | null {
  if (!existsSync(path)) return null
  const raw = readFileSync(path, 'utf8').trim()
  return raw || null
}

export function writeMarker(iso: string, path: string = MARKER): void {
  writeFileSync(path, iso, 'utf8')
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

// CLI: only run when invoked directly, not when imported (tests import the pure fns).
const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const sub = process.argv[2]
  if (sub === 'window') {
    console.log(JSON.stringify(computeWindow(readMarker(), new Date()), null, 2))
  } else if (sub === 'done') {
    const date = parseDateArg()
    writeMarker(new Date().toISOString())
    const out = writeDashboard(date)
    console.log(`marker stamped; dashboard written: ${out}`)
  } else {
    console.error('usage: capture <window|done> [--date=YYYY-MM-DD]')
    process.exit(1)
  }
}
