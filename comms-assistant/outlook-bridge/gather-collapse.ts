import type { RawGatherRecord } from './gather-types.js'

const PREFIX = /^\s*(re|fwd|fw)\s*:\s*/i

export function normalizeSubject(subject: string): string {
  let s = (subject ?? '').trim()
  while (PREFIX.test(s)) s = s.replace(PREFIX, '').trim()
  return s
}

export function threadKey(r: RawGatherRecord): string {
  return r.threadIndex && r.threadIndex.trim() !== '' ? r.threadIndex.trim() : normalizeSubject(r.subject)
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
