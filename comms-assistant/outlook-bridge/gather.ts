import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseGatherRecords } from './gather-parse.js'
import { collapseThreads } from './gather-collapse.js'
import { toCapturePackets } from './gather-packets.js'
import { claudeSignals } from './gather-signals.js'
import type { CapturePacket, RawGatherRecord } from './gather-types.js'
import { classifyEmail } from '../classify.js'

export type Exec = (cmd: string, args: string[]) => Promise<string>

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gather.applescript')

const realExec: Exec = (cmd, args) =>
  new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout)
    })
  })

export interface PullResult {
  packets: CapturePacket[]
  cleared: number
  total: number
  resolvedDrained: string[]
}

function sensitiveOf(r: RawGatherRecord): boolean {
  return classifyEmail({ subject: r.subject, sender: r.from, recipients: r.to, bodyPreview: r.body.slice(0, 200) }).isSensitive
}

export async function pullClaudeTagged(opts: {
  windowDays: number
  today: string
  exec?: Exec
  isResolved?: (internetMessageId: string) => Promise<boolean>
}): Promise<PullResult> {
  const exec = opts.exec ?? realExec
  const isResolved = opts.isResolved ?? (async () => false)

  const raw = await exec('osascript', [SCRIPT, 'claude-capture', String(opts.windowDays)])
  const threads = collapseThreads(parseGatherRecords(raw))

  const keep: RawGatherRecord[] = []
  const drainIds: string[] = []
  for (const t of threads) {
    if (await isResolved(t.internetMessageId)) drainIds.push(t.outlookId)
    else keep.push(t)
  }

  let cleared = 0
  if (drainIds.length > 0) {
    const out = await exec('osascript', [SCRIPT, 'clear', ...drainIds])
    cleared = parseInt(out.replace(/\D+/g, ''), 10) || 0
  }

  return {
    packets: toCapturePackets(keep, opts.today, (r) => claudeSignals(r, sensitiveOf)),
    cleared,
    total: threads.length,
    resolvedDrained: drainIds,
  }
}
