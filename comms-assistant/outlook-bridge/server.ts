import http from 'node:http'
import { spawn as realSpawn } from 'node:child_process'
import { validateDraftRequest, buildOsascriptArgs } from './draft-request.js'

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
  const origin = opts.allowedOrigin ?? '*'

  const cors = (res: http.ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-bridge-token')
  }
  const json = (res: http.ServerResponse, status: number, payload: unknown) => {
    cors(res)
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload))
  }

  return http.createServer(async (req, res) => {
    const url = req.url ?? ''

    if (req.method === 'OPTIONS') {
      cors(res)
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

      const args = buildOsascriptArgs(opts.scriptPath, v.value)
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
        if (code === 0) respond(200, { ok: true, mode: v.value.mode })
        else if (stderr.includes('NOT_FOUND')) respond(404, { ok: false, error: 'original message not found in Outlook' })
        else respond(500, { ok: false, error: stderr.trim().slice(-500) || `osascript exited ${code}` })
      })
      return
    }

    json(res, 404, { ok: false, error: 'not found' })
  })
}
