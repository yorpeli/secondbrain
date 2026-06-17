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

export function buildOsascriptArgs(scriptPath: string, req: DraftRequest): string[] {
  const recipientsCsv = req.to.map((s) => s.trim()).filter(Boolean).join(',')
  const imid = req.replyKey?.internetMessageId ?? ''
  return [scriptPath, req.mode, req.subject, req.body, recipientsCsv, imid]
}
