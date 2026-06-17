import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { createBridge, type SpawnFn, type SpawnedProc } from '../server.js'

const TOKEN = 'secret-123'

function makeFakeSpawn(code: number, stderrText = '') {
  const calls: { command: string; args: string[] }[] = []
  const fn: SpawnFn = (command, args) => {
    calls.push({ command, args })
    const handlers: Record<string, ((arg: unknown) => void)[]> = {}
    const proc: SpawnedProc = {
      stderr: {
        on: (_ev: 'data', cb: (chunk: unknown) => void) => {
          if (stderrText) cb(Buffer.from(stderrText))
        },
      },
      on: (ev: 'close' | 'error', cb: (arg: unknown) => void) => {
        ;(handlers[ev] ||= []).push(cb)
      },
    }
    queueMicrotask(() => (handlers['close'] || []).forEach((cb) => cb(code)))
    return proc
  }
  return { fn, calls }
}

async function startBridge(spawnFn: SpawnFn) {
  const server = createBridge({ token: TOKEN, scriptPath: '/tmp/draft.applescript', spawnFn })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const port = (server.address() as AddressInfo).port
  return { server, base: `http://127.0.0.1:${port}` }
}

test('health returns ok', async () => {
  const { fn } = makeFakeSpawn(0)
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/health`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true })
  server.close()
})

test('POST /draft without token → 401, spawn not called', async () => {
  const { fn, calls } = makeFakeSpawn(0)
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: 'b' }),
  })
  assert.equal(res.status, 401)
  assert.equal(calls.length, 0)
  server.close()
})

test('POST /draft invalid body → 400', async () => {
  const { fn, calls } = makeFakeSpawn(0)
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bridge-token': TOKEN },
    body: JSON.stringify({ mode: 'send', to: [], subject: '', body: '' }),
  })
  assert.equal(res.status, 400)
  assert.equal(calls.length, 0)
  server.close()
})

test('POST /draft valid fresh → 200, spawns osascript with argv', async () => {
  const { fn, calls } = makeFakeSpawn(0)
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bridge-token': TOKEN },
    body: JSON.stringify({ mode: 'fresh', to: ['a@b.com'], subject: 'Hi', body: 'Body' }),
  })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, mode: 'fresh' })
  assert.equal(calls[0].command, 'osascript')
  assert.deepEqual(calls[0].args, ['/tmp/draft.applescript', 'fresh', 'Hi', 'Body', 'a@b.com', ''])
  server.close()
})

test('POST /draft reply NOT_FOUND → 404', async () => {
  const { fn } = makeFakeSpawn(1, 'NOT_FOUND: no match')
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bridge-token': TOKEN },
    body: JSON.stringify({ mode: 'reply', to: [], subject: 'X', body: 'b', replyKey: { internetMessageId: '<i>' } }),
  })
  assert.equal(res.status, 404)
  server.close()
})

test('POST /draft osascript failure → 500', async () => {
  const { fn } = makeFakeSpawn(1, 'some applescript error')
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bridge-token': TOKEN },
    body: JSON.stringify({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: 'b' }),
  })
  assert.equal(res.status, 500)
  server.close()
})

test('OPTIONS /draft preflight → 204 with CORS headers', async () => {
  const { fn } = makeFakeSpawn(0)
  const { server, base } = await startBridge(fn)
  const res = await fetch(`${base}/draft`, { method: 'OPTIONS' })
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('access-control-allow-headers')?.includes('x-bridge-token'), true)
  server.close()
})
