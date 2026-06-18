import type { RawGatherRecord, CapturePacket } from './gather-types.js'

export type Signals = CapturePacket['signals']

// Curated Claude-tagged emails are the highest-intent input → route to T2 (deep + verify).
export function claudeSignals(r: RawGatherRecord, isSensitive: (r: RawGatherRecord) => boolean): Signals {
  return { sensitive: isSensitive(r), directToHim: true, askToHim: true, broadcast: false, cold: false }
}
