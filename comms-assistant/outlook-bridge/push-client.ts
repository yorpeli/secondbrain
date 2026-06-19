// Terminal-side caller for the local Outlook bridge's POST /draft (fresh compose).
// Used by the conversation agent's outgoing flow (`run.ts send-initiated`). The /triage
// app has its own caller in app/src/lib/draft-request.ts — this is the Node equivalent.
// Never sends: the bridge only opens a reviewable Outlook compose window.

export interface FreshDraft {
  to: string[]
  subject: string
  body: string
}

export interface PushOptions {
  url?: string
  token?: string
  fetchFn?: typeof fetch
}

export interface PushResult {
  ok: boolean
  error?: string
}

export async function pushFreshDraft(draft: FreshDraft, opts: PushOptions = {}): Promise<PushResult> {
  const url = opts.url ?? process.env.OUTLOOK_BRIDGE_URL ?? 'http://127.0.0.1:7777'
  const token = opts.token ?? process.env.OUTLOOK_BRIDGE_TOKEN ?? ''
  const doFetch = opts.fetchFn ?? fetch
  try {
    const res = await doFetch(`${url}/draft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bridge-token': token },
      body: JSON.stringify({ mode: 'fresh', to: draft.to, subject: draft.subject, body: draft.body }),
    })
    if (!res.ok) {
      let msg = `bridge returned ${res.status}`
      try { const j: any = await res.json(); if (j?.error) msg = j.error } catch { /* keep status msg */ }
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: `bridge unreachable: ${(e as Error).message}` }
  }
}
