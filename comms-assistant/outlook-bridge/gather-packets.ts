import type { RawGatherRecord, CapturePacket } from './gather-types.js'
import { normalizeSubject } from './gather-collapse.js'

// Short stable hash so two long convIds that share a 48-char slug prefix don't collide
// on the workflow's per-thread temp files (/tmp/ti-<slug>.json) under parallel subagents.
function shortHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 6)
}

function slugify(s: string): string {
  const base = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'thread'
  return `${base}-${shortHash(s)}`
}

export function toCapturePackets(
  records: RawGatherRecord[],
  today: string,
  isSensitive: (r: RawGatherRecord) => boolean,
): CapturePacket[] {
  return records.map((r) => {
    const convId = r.threadIndex && r.threadIndex.trim() !== '' ? r.threadIndex.trim() : normalizeSubject(r.subject)
    const participants = Array.from(new Set([r.from, ...r.to].filter(Boolean)))
    return {
      slug: slugify(convId),
      email: {
        subject: r.subject,
        from: r.from,
        date: r.dateIso,
        to: r.to,
        excerpt: r.body.slice(0, 200),
        channel: 'outlook',
        internet_message_id: r.internetMessageId,
        conversation_id: convId,
        web_link: '',
      },
      thread: { subject: r.subject, participants, mentions: [], bodyToDate: r.body },
      // Claude-tagged = curated, highest-intent input → route to T2 (deep + adversarial verify),
      // not T1 shallow. Yonatan hand-tags an email precisely because it needs real attention.
      signals: { sensitive: isSensitive(r), directToHim: true, askToHim: true, broadcast: false, cold: false },
      body: r.body,
      today,
    }
  })
}
