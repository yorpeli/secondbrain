import type { RawGatherRecord } from './gather-types.js'

const US = '\x1f'
const RS = '\x1e'

export function parseGatherRecords(raw: string): RawGatherRecord[] {
  if (!raw) return []
  const out: RawGatherRecord[] = []
  for (const block of raw.split(RS)) {
    if (block.trim() === '') continue
    const f = block.split(US)
    if (f.length < 8) continue
    out.push({
      outlookId: f[0],
      subject: f[1],
      from: f[2],
      to: f[3] ? f[3].split(',').map((s) => s.trim()).filter(Boolean) : [],
      dateIso: f[4],
      internetMessageId: f[5],
      threadIndex: f[6],
      body: f.slice(7).join(US), // body is last; tolerate stray US inside it
    })
  }
  return out
}
