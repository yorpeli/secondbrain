export type DraftMode = 'fresh' | 'reply'

export interface ReplyKey {
  internetMessageId?: string
  conversationId?: string
}

export interface DraftRequest {
  mode: DraftMode
  to: string[]
  subject: string
  body: string
  replyKey?: ReplyKey
}

export type ValidationResult =
  | { ok: true; value: DraftRequest }
  | { ok: false; error: string }

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((s) => typeof s === 'string')
}

export function validateDraftRequest(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'body must be a JSON object' }
  }
  const o = input as Record<string, unknown>

  if (o.mode !== 'fresh' && o.mode !== 'reply') {
    return { ok: false, error: "mode must be 'fresh' or 'reply'" }
  }
  if (typeof o.subject !== 'string') {
    return { ok: false, error: 'subject must be a string' }
  }
  if (typeof o.body !== 'string' || o.body.trim() === '') {
    return { ok: false, error: 'body must be a non-empty string' }
  }
  if (!isStringArray(o.to ?? [])) {
    return { ok: false, error: 'to must be an array of strings' }
  }
  const to = (o.to as string[] | undefined) ?? []

  if (o.mode === 'fresh') {
    if (to.map((s) => s.trim()).filter(Boolean).length === 0) {
      return { ok: false, error: 'fresh draft requires at least one recipient' }
    }
  } else {
    // reply
    if (o.subject.trim() === '') {
      return { ok: false, error: 'reply requires a non-empty subject to locate the original' }
    }
  }

  let replyKey: ReplyKey | undefined
  if (o.replyKey !== undefined) {
    if (typeof o.replyKey !== 'object' || o.replyKey === null) {
      return { ok: false, error: 'replyKey must be an object' }
    }
    const rk = o.replyKey as Record<string, unknown>
    replyKey = {
      internetMessageId: typeof rk.internetMessageId === 'string' ? rk.internetMessageId : undefined,
      conversationId: typeof rk.conversationId === 'string' ? rk.conversationId : undefined,
    }
  }

  return {
    ok: true,
    value: { mode: o.mode, to, subject: o.subject, body: o.body, replyKey },
  }
}

/**
 * Convert a plain-text body (with newlines) to minimal HTML so it renders with
 * line breaks when set as the HTML `content` of an Outlook message. Outlook for
 * Mac treats message `content` as HTML, so raw newlines collapse into one run —
 * we escape the HTML special chars first (the body is AI-generated / user-edited
 * plain text, never trusted markup) and then map newlines to <br>.
 */
export function plainTextToHtml(s: string): string {
  return s
    .replace(/\r\n?/g, '\n') // normalize CRLF / lone CR
    .replace(/&/g, '&amp;') // must precede < and >
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

export function buildOsascriptArgs(scriptPath: string, req: DraftRequest): string[] {
  const recipientsCsv = req.to.map((s) => s.trim()).filter(Boolean).join(',')
  const imid = req.replyKey?.internetMessageId ?? ''
  // Body crosses into Outlook's HTML content — convert here so both fresh and
  // reply drafts keep their paragraph breaks (was a single collapsed run).
  return [scriptPath, req.mode, req.subject, plainTextToHtml(req.body), recipientsCsv, imid]
}

// --- mark-read (bridge primary path) -------------------------------------
// The /triage app flips the read flag locally via the bridge before falling
// back to the queued outlook-sync task. Locating the message reuses the reply
// strategy (subject contains + Message-ID in headers), so a request only needs
// the subject and an optional reply key — no body, no recipients.

export interface MarkReadRequest {
  subject: string
  replyKey?: ReplyKey
}

export type MarkReadValidation =
  | { ok: true; value: MarkReadRequest }
  | { ok: false; error: string }

export function validateMarkReadRequest(input: unknown): MarkReadValidation {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'body must be a JSON object' }
  }
  const o = input as Record<string, unknown>

  if (typeof o.subject !== 'string' || o.subject.trim() === '') {
    return { ok: false, error: 'subject must be a non-empty string to locate the message' }
  }

  let replyKey: ReplyKey | undefined
  if (o.replyKey !== undefined) {
    if (typeof o.replyKey !== 'object' || o.replyKey === null) {
      return { ok: false, error: 'replyKey must be an object' }
    }
    const rk = o.replyKey as Record<string, unknown>
    replyKey = {
      internetMessageId: typeof rk.internetMessageId === 'string' ? rk.internetMessageId : undefined,
      conversationId: typeof rk.conversationId === 'string' ? rk.conversationId : undefined,
    }
  }

  return { ok: true, value: { subject: o.subject, replyKey } }
}

export function buildMarkReadArgs(scriptPath: string, req: MarkReadRequest): string[] {
  const imid = req.replyKey?.internetMessageId ?? ''
  // read mode: subject locates, imid disambiguates; body + recipients unused.
  // Slots kept positional so `on run argv` reads the same 5 args as fresh/reply.
  return [scriptPath, 'read', req.subject, '', '', imid]
}

// --- open-in-outlook (pop the desktop message) ---------------------------
// The /triage "Open in Outlook" button pops the actual message open in Legacy
// Outlook desktop (instead of the OWA web link). Locate is identical to mark-read
// (subject contains + Message-ID in headers); the `open` AppleScript branch just
// focuses the message window instead of flipping the read flag — it never mutates
// the message. Same request shape as mark-read, so it reuses the validator.

export type OpenRequest = MarkReadRequest
export const validateOpenRequest = validateMarkReadRequest

export function buildOpenArgs(scriptPath: string, req: OpenRequest): string[] {
  const imid = req.replyKey?.internetMessageId ?? ''
  // open mode: subject locates, imid disambiguates; body + recipients unused.
  return [scriptPath, 'open', req.subject, '', '', imid]
}
