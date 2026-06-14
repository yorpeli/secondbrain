// Pure classifier over email metadata. Decides reply vs noise vs sensitive,
// and whether the item is a prediction candidate for the v1 backtest.
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
  needsPrediction: boolean
  reason: string
}

const NOISE_SUBJECT = /^(re:\s*)?(accepted|declined|canceled|cancelled|tentative|new time proposed):/i
const NOISE_NOTIFICATION = /(mentioned you in|assigned you a task in|left a comment in|replied to a comment in|shared ".*" with you)/i
const SENSITIVE = /(salary|compensation|\bcomp review\b|termination|terminate|performance review|\bpip\b|layoff|fraud|legal|harassment|disciplinary)/i

export function classifyEmail(meta: EmailMeta): Classification {
  const subject = (meta.subject || '').trim()
  if (NOISE_SUBJECT.test(subject)) {
    return { isReply: false, isNoise: true, isSensitive: false, needsPrediction: false, reason: 'calendar/rsvp subject' }
  }
  if (NOISE_NOTIFICATION.test(subject)) {
    return { isReply: false, isNoise: true, isSensitive: false, needsPrediction: false, reason: 'office notification' }
  }
  const isReply = /^re:/i.test(subject)
  const isSensitive = SENSITIVE.test(`${subject} ${meta.recipients.join(' ')}`)
  const needsPrediction = isReply && !isSensitive
  const reason = !isReply
    ? 'not a reply (initiated/other)'
    : isSensitive ? 'sensitive — skip in v1' : 'reply needs prediction'
  return { isReply, isNoise: false, isSensitive, needsPrediction, reason }
}
