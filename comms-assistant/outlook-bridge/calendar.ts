import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BusyBlock } from '../schedule/types.js'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'calendar.applescript')

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function buildBusyArgs(scriptPath: string, windowStartDay: string, windowEndDay: string): string[] {
  if (!DAY.test(windowStartDay) || !DAY.test(windowEndDay)) throw new Error('window days must be YYYY-MM-DD')
  const d = (s: string) => [String(+s.slice(0, 4)), String(+s.slice(5, 7)), String(+s.slice(8, 10))]
  return [scriptPath, 'busy', ...d(windowStartDay), ...d(windowEndDay)]
}

export function parseBusyOutput(stdout: string): BusyBlock[] {
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [start, end] = l.split('|')
      return { start, end }
    })
    .filter((b) => b.start && b.end)
}

function exec(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.toString().trim() || err.message))
      resolve(stdout?.toString() ?? '')
    })
  })
}

export async function readBusy(windowStartDay: string, windowEndDay: string): Promise<BusyBlock[]> {
  const out = await exec('osascript', buildBusyArgs(SCRIPT, windowStartDay, windowEndDay))
  return parseBusyOutput(out)
}
