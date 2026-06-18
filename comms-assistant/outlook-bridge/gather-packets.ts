import type { RawGatherRecord, CapturePacket } from './gather-types.js'
import { normalizeSubject } from './gather-collapse.js'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'thread'
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
      signals: { sensitive: isSensitive(r), directToHim: false, askToHim: false, broadcast: false, cold: false },
      body: r.body,
      today,
    }
  })
}
