import http from 'node:http'
import { spawn as realSpawn } from 'node:child_process'
import {
  validateDraftRequest,
  buildOsascriptArgs,
  validateMarkReadRequest,
  buildMarkReadArgs,
  validateOpenRequest,
  buildOpenArgs,
} from './draft-request.js'

export interface SpawnedProc {
  stderr: { on(ev: 'data', cb: (chunk: unknown) => void): void } | null
  on(ev: 'close', cb: (code: number | null) => void): void
  on(ev: 'error', cb: (err: Error) => void): void
}

export type SpawnFn = (command: string, args: string[]) => SpawnedProc

export interface BridgeOptions {
  token: string
  scriptPath: string
  spawnFn?: SpawnFn
  allowedOrigin?: string
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export function createBridge(opts: BridgeOptions): http.Server {
  const spawnFn: SpawnFn = opts.spawnFn ?? (realSpawn as unknown as SpawnFn)
  const configuredOrigin = opts.allowedOrigin ?? '*'

  // The bridge binds 127.0.0.1 only and gates every mutating route on
  // x-bridge-token, so any loopback origin (localhost / 127.0.0.1, ANY port) is
  // trusted and reflected back. This keeps the Vite dev server working no matter
  // which port it grabs (5173, 5174, …) — a fixed allow-origin broke the moment
  // Vite bumped ports. Non-loopback origins fall back to the configured origin.
  const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
  const resolveOrigin = (reqOrigin?: string): string =>
    reqOrigin && LOOPBACK.test(reqOrigin) ? reqOrigin : configuredOrigin

  const setCors = (res: http.ServerResponse, aco: string) => {
    res.setHeader('Access-Control-Allow-Origin', aco)
    res.setHeader('Vary', 'Origin') // response varies by request Origin (reflected)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-bridge-token')
  }
  // CORS headers are set once per request (setCors at the handler top), so json()
  // only writes the status + body.
  const json = (res: http.ServerResponse, status: number, payload: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  }

  // Spawn osascript and map its exit to a single HTTP response. Shared by /draft,
  // /read and /open; the one-shot `responded` guard prevents ERR_HTTP_HEADERS_SENT when
  // spawn fires 'error' then 'close(null)'. `okMode` is echoed back on success.
  const runScript = (res: http.ServerResponse, args: string[], okMode: string) => {
    const child = spawnFn('osascript', args)
    let stderr = ''
    let responded = false
    const respond = (status: number, payload: unknown) => {
      if (responded) return
      responded = true
      json(res, status, payload)
    }
    child.stderr?.on('data', (c) => (stderr += String(c)))
    child.on('error', (e) => respond(500, { ok: false, error: e.message }))
    child.on('close', (code) => {
      if (code === 0) respond(200, { ok: true, mode: okMode })
      else if (stderr.includes('NOT_FOUND')) respond(404, { ok: false, error: 'original message not found in Outlook' })
      else respond(500, { ok: false, error: stderr.trim().slice(-500) || `osascript exited ${code}` })
    })
  }

  return http.createServer(async (req, res) => {
    const url = req.url ?? ''
    setCors(res, resolveOrigin(req.headers.origin))

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'GET' && url === '/health') {
      json(res, 200, { ok: true })
      return
    }

    if (req.method === 'POST' && url === '/draft') {
      if (req.headers['x-bridge-token'] !== opts.token) {
        json(res, 401, { ok: false, error: 'bad or missing token' })
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(await readBody(req))
      } catch {
        json(res, 400, { ok: false, error: 'invalid JSON' })
        return
      }
      const v = validateDraftRequest(parsed)
      if (!v.ok) {
        json(res, 400, { ok: false, error: v.error })
        return
      }

      runScript(res, buildOsascriptArgs(opts.scriptPath, v.value), v.value.mode)
      return
    }

    if (req.method === 'POST' && url === '/read') {
      if (req.headers['x-bridge-token'] !== opts.token) {
        json(res, 401, { ok: false, error: 'bad or missing token' })
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(await readBody(req))
      } catch {
        json(res, 400, { ok: false, error: 'invalid JSON' })
        return
      }
      const v = validateMarkReadRequest(parsed)
      if (!v.ok) {
        json(res, 400, { ok: false, error: v.error })
        return
      }

      runScript(res, buildMarkReadArgs(opts.scriptPath, v.value), 'read')
      return
    }

    if (req.method === 'POST' && url === '/open') {
      if (req.headers['x-bridge-token'] !== opts.token) {
        json(res, 401, { ok: false, error: 'bad or missing token' })
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(await readBody(req))
      } catch {
        json(res, 400, { ok: false, error: 'invalid JSON' })
        return
      }
      const v = validateOpenRequest(parsed)
      if (!v.ok) {
        json(res, 400, { ok: false, error: v.error })
        return
      }

      runScript(res, buildOpenArgs(opts.scriptPath, v.value), 'open')
      return
    }

    json(res, 404, { ok: false, error: 'not found' })
  })
}
