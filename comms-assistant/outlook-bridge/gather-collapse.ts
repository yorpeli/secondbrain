import type { RawGatherRecord } from './gather-types.js'

const PREFIX = /^\s*(re|fwd|fw)\s*:\s*/i

export function normalizeSubject(subject: string): string {
  let s = (subject ?? '').trim()
  while (PREFIX.test(s)) s = s.replace(PREFIX, '').trim()
  return s
}

// An Outlook Thread-Index is per-MESSAGE: the first 22 decoded bytes are the conversation
// root (6-byte time + 16-byte GUID); each reply appends a 5-byte child block. Collapsing on
// the full value would split one conversation into a card per reply, so key on the root.
// Short/non-base64 values (e.g. test fixtures) decode to < 22 bytes → returned unchanged.
export function threadRoot(threadIndex: string): string {
  try {
    const b = Buffer.from(threadIndex, 'base64')
    return b.length >= 22 ? b.subarray(0, 22).toString('base64') : threadIndex
  } catch {
    return threadIndex
  }
}

export function threadKey(r: RawGatherRecord): string {
  const ti = r.threadIndex && r.threadIndex.trim() !== '' ? r.threadIndex.trim() : ''
  return ti !== '' ? threadRoot(ti) : normalizeSubject(r.subject)
}

const MIN_BODY = 200

export function collapseThreads(records: RawGatherRecord[]): RawGatherRecord[] {
  const byThread = new Map<string, RawGatherRecord[]>()
  for (const rec of records) {
    const k = threadKey(rec)
    const arr = byThread.get(k)
    if (arr) arr.push(rec)
    else byThread.set(k, [rec])
  }
  const out: RawGatherRecord[] = []
  for (const arr of byThread.values()) {
    // latest by ISO lexical compare (ISO strings sort chronologically)
    const latest = arr.reduce((a, b) => (b.dateIso > a.dateIso ? b : a))
    if (latest.body.length < MIN_BODY) {
      const longer = arr
        .filter((x) => x !== latest && x.body.length >= MIN_BODY)
        .sort((a, b) => b.body.length - a.body.length)[0]
      if (longer) {
        out.push({ ...latest, body: `${latest.body}\n\n--- earlier in thread ---\n${longer.body}` })
        continue
      }
    }
    out.push(latest)
  }
  return out
}
