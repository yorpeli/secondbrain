import type { RawGatherRecord, CapturePacket } from './gather-types.js'
import { classifyEmail } from '../classify.js'

export type Signals = CapturePacket['signals']

// Curated Claude-tagged emails are the highest-intent input → route to T2 (deep + verify).
export function claudeSignals(r: RawGatherRecord, isSensitive: (r: RawGatherRecord) => boolean): Signals {
  return { sensitive: isSensitive(r), directToHim: true, askToHim: true, broadcast: false, cold: false }
}

// Per-email tier-routing heuristic for unread emails
export function deriveUnreadSignals(r: RawGatherRecord): Signals {
  const c = classifyEmail({ subject: r.subject, sender: r.from, recipients: r.to, bodyPreview: r.body.slice(0, 200) })
  const broadcast = r.to.length >= 10
  return {
    sensitive: c.isSensitive,
    broadcast,
    cold: false,
    directToHim: !broadcast && r.to.length <= 3,
    askToHim: r.body.includes('?'),
  }
}
