// Pure classifier over email metadata. Two distinct gates:
//  • needsResponse — the LIVE TRIAGE gate: keep anything that plausibly needs a reply, fresh OR
//    reply; drop only true noise (automated senders, calendar/RSVP, app notifications, meeting
//    invites, broadcasts, OOO) and flag sensitive. This is what the triage sweep uses.
//  • needsPrediction — the BACKTEST gate: Re:-only (we can only score predictions against a reply
//    you actually sent). Unchanged; used by the learning loop, NOT by triage.
export interface EmailMeta {
  subject: string
  sender: string
  recipients: string[]
  bodyPreview?: string
}

export interface Classification {
  isReply: boolean
  isNoise: boolean
  isSensitive: boolean
  needsResponse: boolean   // live-triage gate (fresh OR reply)
  needsPrediction: boolean // backtest gate (Re:-only)
  reason: string
}

const NOISE_SUBJECT = /^(re:\s*)?(accepted|declined|canceled|cancelled|tentative|new time proposed):/i
const NOISE_NOTIFICATION = /(mentioned you in|assigned you a task in|left a comment in|replied to a comment in|shared ".*" with you|sent \d+ messages? to your chat)/i
const NOISE_OOO = /\b(out of office|ooo|annual leave|on vacation)\b/i
// Automated / bot / transactional senders that never want a human reply: no-reply variants,
// role-account localparts (orders, billing, marketing, newsletters…), and known bulk-mail vendors.
const NOISE_SENDER = new RegExp([
  'no-?reply', 'do-?not-?reply', 'donotreply', 'autonotification', 'mailer-?daemon',
  '(notifications?|calendar|grouporder|orders?|billing|marketing|newsletter|news|mailer|bounce|alerts?|noreply)@',
  '@teams\\.mail\\.microsoft', '@odspnotify',
  'concursolutions|amazonses|zendesk\\.com|@(mail\\.gallup|m\\.miro|sharebite|contify|quantumworkplace|successfactors|navan|sharepointonline)\\.com',
].join('|'), 'i')
// Meeting invites: detected by the body being DOMINATED by the Teams join block. A real email that
// merely mentions a meeting (e.g. "Yaron asked us to schedule…" + an embedded invite) has substantive
// text BEFORE the block and is kept — only a body that opens straight into the join block is noise.
const MEETING_BLOCK = /(_{10,}|microsoft teams meeting|teams\.microsoft\.com\/meet\b)/i
function isMeetingInvite(body: string): boolean {
  const at = body.search(MEETING_BLOCK)
  return at >= 0 && body.slice(0, at).replace(/\s+/g, ' ').trim().length < 40
}
// Broadcast distribution lists — FYI blasts, not addressed to him for a response.
const BROADCAST_DL = /(^|[,<\s])([a-z0-9._-]*(-all|-il|audience|employees|_updates)|pgl|productmanagement[a-z-]*|productleaders|growthemployees|product_updates_audience)@/i
const SENSITIVE = /(salary|compensation|\bcomp review\b|termination|terminate|performance review|\bpip\b|layoff|fraud|legal|harassment|disciplinary)/i

export function classifyEmail(meta: EmailMeta): Classification {
  const subject = (meta.subject || '').trim()
  const sender = (meta.sender || '').toLowerCase()
  const recipients = (meta.recipients || []).join(' ').toLowerCase()
  const body = meta.bodyPreview || ''
  const isReply = /^re:/i.test(subject)
  const isSensitive = SENSITIVE.test(`${subject} ${recipients}`)

  // Noise detection (any hit → drop from triage). Order picks the most specific reason.
  const noiseReason =
    NOISE_SUBJECT.test(subject) ? 'calendar/rsvp'
    : NOISE_NOTIFICATION.test(subject) ? 'app notification'
    : NOISE_OOO.test(subject) ? 'out-of-office'
    : NOISE_SENDER.test(sender) ? 'automated sender'
    : isMeetingInvite(body) ? 'meeting invite'
    : BROADCAST_DL.test(recipients) && !isReply ? 'broadcast DL'
    : ''
  const isNoise = !!noiseReason

  const needsResponse = !isNoise && !isSensitive   // ← live triage keeps fresh AND reply
  const needsPrediction = isReply && !isSensitive  // ← backtest only (Re:-only)
  const reason = isNoise ? noiseReason
    : isSensitive ? 'sensitive — flag, do not draft'
    : isReply ? 'reply — needs response'
    : 'fresh — needs response'
  return { isReply, isNoise, isSensitive, needsResponse, needsPrediction, reason }
}
