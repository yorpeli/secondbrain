# Push to Outlook Draft — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/triage` button that opens a pre-filled, reviewable Outlook draft (fresh email or threaded reply-all) via a local AppleScript bridge — never sends.

**Architecture:** A `/triage` card button POSTs a typed `DraftRequest` (built from card data already on the client) to a localhost Node HTTP bridge. The bridge checks a shared-secret token, then `spawn`s `osascript` with the request fields passed as **argv** (never shell-interpolated), running a verified AppleScript against **Legacy Outlook** that either composes a new message or creates a threaded reply-all draft and opens it for review.

**Tech Stack:** TypeScript via `tsx`; Node built-in `http` + `child_process` (no Express); `node:test` + `node:assert/strict`; AppleScript (`osascript`); React 19 + Vite + TanStack Query (the `app/`).

## Global Constraints

- Node `>=18`; run TS with `tsx`. Tests run via `node --import tsx --test <file>`.
- **No new runtime deps** — use Node built-in `http`/`child_process`. (`express` is not installed; do not add it.)
- **Never shell-interpolate email content.** Always `spawn('osascript', [scriptPath, ...args])` with fields as separate argv items.
- **Draft only.** The bridge never sends. AppleScript ends at `open` (a reviewable window).
- **Requires Legacy Outlook for Mac.** New Outlook cannot read mail via AppleScript.
- Bridge binds **`127.0.0.1` only** and requires header `x-bridge-token` on every `/draft` request.
- **CORS:** the app origin (`http://localhost:5173`) differs from the bridge (`http://127.0.0.1:7777`); the bridge must answer `OPTIONS` preflight and set CORS headers.
- Verified AppleScript forms (do not change without re-verifying live):
  - Reply-all: `reply to <message> reply to all true without opening window`
  - Locate: `messages of inbox whose subject contains <subject>`; disambiguate by `headers of <m> contains <internet-message-id>`
  - Quote-preserve: `set content of r to <body> & return & return & (content of r)`
- All files live under `comms-assistant/outlook-bridge/` (server) and `app/src/` (UI).

---

## File Structure

**Bridge (new dir `comms-assistant/outlook-bridge/`):**
- `draft-request.ts` — `DraftRequest` type, `validateDraftRequest()`, `buildOsascriptArgs()` (pure; fully unit-tested).
- `server.ts` — `createBridge()`: token gate, CORS, `GET /health`, `POST /draft` → spawn (injectable `spawnFn`; unit-tested with a fake spawn).
- `draft.applescript` — verified `on run argv` script (fresh + reply branches).
- `bridge.ts` — entrypoint: load env, resolve script path, `listen(7777, '127.0.0.1')`.
- `__tests__/draft-request.test.ts`, `__tests__/server.test.ts`.

**App:**
- `app/src/lib/draft-request.ts` — client `DraftRequest` type + `buildDraftRequest(card)` (pure; unit-tested).
- `app/src/lib/triage-types.ts` — extend `CardPayload.email` with optional `internet_message_id` / `conversation_id`.
- `app/src/hooks/use-triage.ts` — add `usePushOutlookDraft()` mutation.
- `app/src/pages/triage.tsx` — add the button next to "Mark read".
- `app/.env.local` — add `VITE_OUTLOOK_BRIDGE_URL`, `VITE_OUTLOOK_BRIDGE_TOKEN`.

**Root:**
- `package.json` — add `"outlook-bridge": "tsx comms-assistant/outlook-bridge/bridge.ts"`.
- `.env` — add `OUTLOOK_BRIDGE_TOKEN` (and optional `OUTLOOK_BRIDGE_PORT`).

---

## Task 1: Draft request — types, validation, argv builder

**Files:**
- Create: `comms-assistant/outlook-bridge/draft-request.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/draft-request.test.ts`

**Interfaces:**
- Produces:
  - `type DraftMode = 'fresh' | 'reply'`
  - `interface ReplyKey { internetMessageId?: string; conversationId?: string }`
  - `interface DraftRequest { mode: DraftMode; to: string[]; subject: string; body: string; replyKey?: ReplyKey }`
  - `type ValidationResult = { ok: true; value: DraftRequest } | { ok: false; error: string }`
  - `function validateDraftRequest(input: unknown): ValidationResult`
  - `function buildOsascriptArgs(scriptPath: string, req: DraftRequest): string[]`
    - returns `[scriptPath, mode, subject, body, recipientsCsv, internetMessageId]`

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/draft-request.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateDraftRequest, buildOsascriptArgs } from '../draft-request.js'

test('rejects non-object', () => {
  assert.equal(validateDraftRequest(null).ok, false)
  assert.equal(validateDraftRequest('x').ok, false)
})

test('rejects bad mode', () => {
  const r = validateDraftRequest({ mode: 'send', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('rejects empty body', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: '' })
  assert.equal(r.ok, false)
})

test('fresh requires at least one recipient', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: [], subject: 's', body: 'b' })
  assert.equal(r.ok, false)
})

test('reply requires non-empty subject', () => {
  const r = validateDraftRequest({ mode: 'reply', to: [], subject: '', body: 'b' })
  assert.equal(r.ok, false)
})

test('accepts valid fresh', () => {
  const r = validateDraftRequest({ mode: 'fresh', to: ['a@b.com'], subject: 's', body: 'b' })
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value.mode, 'fresh')
})

test('accepts valid reply', () => {
  const r = validateDraftRequest({
    mode: 'reply', to: [], subject: 'Hello', body: 'hi',
    replyKey: { internetMessageId: '<abc@x>' },
  })
  assert.equal(r.ok, true)
})

test('buildOsascriptArgs fresh joins recipients, empty imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'fresh', to: [' a@b.com ', 'c@d.com', ''], subject: 'Sub', body: 'Body',
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'fresh', 'Sub', 'Body', 'a@b.com,c@d.com', ''])
})

test('buildOsascriptArgs reply empty recipients, passes imid', () => {
  const args = buildOsascriptArgs('/p/draft.applescript', {
    mode: 'reply', to: [], subject: 'Re: x', body: 'Body', replyKey: { internetMessageId: '<id@x>' },
  })
  assert.deepEqual(args, ['/p/draft.applescript', 'reply', 'Re: x', 'Body', '', '<id@x>'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/draft-request.test.ts`
Expected: FAIL — cannot find module `../draft-request.js`.

- [ ] **Step 3: Write minimal implementation**

Create `comms-assistant/outlook-bridge/draft-request.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/draft-request.test.ts`
Expected: PASS — `# pass 9`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/draft-request.ts comms-assistant/outlook-bridge/__tests__/draft-request.test.ts
git commit -m "feat(outlook-bridge): DraftRequest type, validation, argv builder"
```

---

## Task 2: Bridge HTTP server (token gate, CORS, spawn)

**Files:**
- Create: `comms-assistant/outlook-bridge/server.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/server.test.ts`

**Interfaces:**
- Consumes: `validateDraftRequest`, `buildOsascriptArgs` from Task 1.
- Produces:
  - `type SpawnFn = (command: string, args: string[]) => SpawnedProc`
  - `interface SpawnedProc { stderr: { on(ev: 'data', cb: (chunk: unknown) => void): void } | null; on(ev: 'close', cb: (code: number | null) => void): void; on(ev: 'error', cb: (err: Error) => void): void }`
  - `interface BridgeOptions { token: string; scriptPath: string; spawnFn?: SpawnFn; allowedOrigin?: string }`
  - `function createBridge(opts: BridgeOptions): http.Server`
- Behavior: `GET /health` → 200 `{ok:true}`. `OPTIONS /draft` → 204 + CORS. `POST /draft`: 401 bad token; 400 invalid body; spawn `osascript`; on close code 0 → 200 `{ok:true,mode}`; stderr contains `NOT_FOUND` → 404; else → 500 `{ok:false,error}`.

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/server.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/server.test.ts`
Expected: FAIL — cannot find module `../server.js`.

- [ ] **Step 3: Write minimal implementation**

Create `comms-assistant/outlook-bridge/server.ts`:

```ts
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
      child.stderr?.on('data', (c) => (stderr += String(c)))
      child.on('error', (e) => json(res, 500, { ok: false, error: e.message }))
      child.on('close', (code) => {
        if (code === 0) {
          json(res, 200, { ok: true, mode: v.value.mode })
        } else if (stderr.includes('NOT_FOUND')) {
          json(res, 404, { ok: false, error: 'original message not found in Outlook' })
        } else {
          json(res, 500, { ok: false, error: stderr.trim().slice(-500) || `osascript exited ${code}` })
        }
      })
      return
    }

    json(res, 404, { ok: false, error: 'not found' })
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/server.test.ts`
Expected: PASS — `# pass 7`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/server.ts comms-assistant/outlook-bridge/__tests__/server.test.ts
git commit -m "feat(outlook-bridge): localhost HTTP server with token gate, CORS, osascript spawn"
```

---

## Task 3: AppleScript — fresh compose + threaded reply-all

**Files:**
- Create: `comms-assistant/outlook-bridge/draft.applescript`

**Interfaces:**
- Consumes (argv from Task 1's `buildOsascriptArgs`): `[mode, subject, body, recipientsCsv, internetMessageId]`.
- Produces: a Legacy-Outlook draft window (`open`). Exits non-zero with `NOT_FOUND` when a reply target can't be located.

This task is verified via a manual smoke test against Legacy Outlook (it cannot be unit-tested without launching Outlook). Every command form below was verified live on Outlook 16.108 (Legacy) on 2026-06-17.

- [ ] **Step 1: Create the AppleScript**

Create `comms-assistant/outlook-bridge/draft.applescript`:

```applescript
on trimText(s)
	set s to s as string
	repeat while s starts with " "
		set s to text 2 thru -1 of s
	end repeat
	repeat while s ends with " "
		set s to text 1 thru -2 of s
	end repeat
	return s
end trimText

on run argv
	set theMode to item 1 of argv
	set theSubject to item 2 of argv
	set theBody to item 3 of argv
	set recipientsCsv to item 4 of argv
	set imid to item 5 of argv

	tell application "Microsoft Outlook"
		if theMode is "fresh" then
			set m to make new outgoing message with properties {subject:theSubject, content:theBody}
			set AppleScript's text item delimiters to ","
			repeat with addrRef in (text items of recipientsCsv)
				set addr to my trimText(addrRef as string)
				if addr is not "" then
					make new recipient at m with properties {email address:{address:addr}}
				end if
			end repeat
			set AppleScript's text item delimiters to ""
			open m
		else
			-- reply: locate the original, then reply-all
			set subjMatch to my trimText(theSubject)
			set hits to (messages of inbox whose subject contains subjMatch)
			if (count of hits) is 0 then error "NOT_FOUND: no inbox message matches subject" number 1

			set target to missing value
			if imid is not "" then
				repeat with h in hits
					if (headers of h) contains imid then
						set target to (contents of h)
						exit repeat
					end if
				end repeat
			end if
			if target is missing value then set target to item 1 of hits

			set r to reply to target reply to all true without opening window
			set content of r to theBody & return & return & (content of r)
			open r
		end if
	end tell
end run
```

- [ ] **Step 2: Smoke test — fresh draft to self**

Run:
```bash
osascript comms-assistant/outlook-bridge/draft.applescript fresh "Bridge smoke test" "Hello from the bridge." "yorpeli@gmail.com" ""
```
Expected: a new Outlook compose window opens, To = yorpeli@gmail.com, Subject = "Bridge smoke test", body present. **Do not send** — close/discard it.

- [ ] **Step 3: Smoke test — threaded reply-all**

Pick a real inbox subject substring you can identify, then run (replace SUBJECT and leave imid empty to use best-subject-match):
```bash
osascript comms-assistant/outlook-bridge/draft.applescript reply "SUBJECT SUBSTRING" "Thanks — my reply goes on top." "" ""
```
Expected: a reply-all draft opens, Subject prefixed "Re:", recipients populated (to + cc), your text **above** the quoted original. **Do not send** — discard.

- [ ] **Step 4: Smoke test — NOT_FOUND path**

Run:
```bash
osascript comms-assistant/outlook-bridge/draft.applescript reply "zzz-no-such-subject-zzz" "body" "" "<no@match>" ; echo "exit=$?"
```
Expected: stderr contains `NOT_FOUND`, `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/draft.applescript
git commit -m "feat(outlook-bridge): verified AppleScript for fresh compose + threaded reply-all"
```

---

## Task 4: Bridge entrypoint + npm script + env

**Files:**
- Create: `comms-assistant/outlook-bridge/bridge.ts`
- Modify: `package.json` (root, add script)
- Modify: `.env` (root, add `OUTLOOK_BRIDGE_TOKEN`)

**Interfaces:**
- Consumes: `createBridge` (Task 2); `draft.applescript` (Task 3, resolved relative to this file).
- Produces: `npm run outlook-bridge` starts the server on `127.0.0.1:7777`.

- [ ] **Step 1: Create the entrypoint**

Create `comms-assistant/outlook-bridge/bridge.ts`:

```ts
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBridge } from './server.js'

const token = process.env.OUTLOOK_BRIDGE_TOKEN
if (!token) {
  console.error('OUTLOOK_BRIDGE_TOKEN is not set (add it to .env). Refusing to start.')
  process.exit(1)
}

const port = Number(process.env.OUTLOOK_BRIDGE_PORT ?? 7777)
const here = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = path.join(here, 'draft.applescript')
const allowedOrigin = process.env.OUTLOOK_BRIDGE_ORIGIN ?? 'http://localhost:5173'

const server = createBridge({ token, scriptPath, allowedOrigin })
server.listen(port, '127.0.0.1', () => {
  console.log(`outlook-bridge listening on http://127.0.0.1:${port} (origin ${allowedOrigin})`)
})
```

- [ ] **Step 2: Add the npm script**

Modify root `package.json` `scripts` — add:

```json
    "outlook-bridge": "tsx comms-assistant/outlook-bridge/bridge.ts",
```

- [ ] **Step 3: Add the token to `.env`**

Append to root `.env` (generate a random secret):

```bash
printf '\nOUTLOOK_BRIDGE_TOKEN=%s\n' "$(openssl rand -hex 16)" >> .env
```

- [ ] **Step 4: Manual verify — start + health + auth**

In one terminal: `npm run outlook-bridge` (expect the "listening on http://127.0.0.1:7777" line).
In another:
```bash
curl -s http://127.0.0.1:7777/health                                   # {"ok":true}
TOKEN=$(grep OUTLOOK_BRIDGE_TOKEN .env | cut -d= -f2)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:7777/draft \
  -H 'content-type: application/json' -d '{}'                           # 401
curl -s -X POST http://127.0.0.1:7777/draft \
  -H 'content-type: application/json' -H "x-bridge-token: $TOKEN" \
  -d '{"mode":"fresh","to":["yorpeli@gmail.com"],"subject":"curl test","body":"hi"}'
# {"ok":true,"mode":"fresh"} and a draft window opens — discard it.
```
Stop the server with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
git add package.json comms-assistant/outlook-bridge/bridge.ts
git commit -m "feat(outlook-bridge): entrypoint + npm run outlook-bridge (127.0.0.1:7777)"
# NOTE: .env is gitignored — do not commit the token.
```

---

## Task 5: App — client DraftRequest builder + push hook

**Files:**
- Create: `app/src/lib/draft-request.ts`
- Modify: `app/src/lib/triage-types.ts` (extend `CardPayload.email`)
- Modify: `app/src/hooks/use-triage.ts` (add `usePushOutlookDraft`)
- Modify: `app/.env.local` (add bridge URL + token)
- Test: `app/src/lib/__tests__/draft-request.test.ts`

**Interfaces:**
- Consumes: `TriageCard` from `app/src/lib/triage-types.ts`.
- Produces:
  - `interface DraftRequest { mode: 'fresh' | 'reply'; to: string[]; subject: string; body: string; replyKey?: { internetMessageId?: string; conversationId?: string } }`
  - `function buildDraftRequest(card: TriageCard): DraftRequest`
  - `function usePushOutlookDraft(): UseMutationResult<{ ok: true; mode: 'fresh' | 'reply' }, Error, TriageCard>`

- [ ] **Step 1: Extend the card email type**

Modify `app/src/lib/triage-types.ts` — in `CardPayload.email`, add two optional fields (capture writes them per the comms doc; the TS type just omitted them):

```ts
  email: {
    subject: string | null; from: string | null; date: string | null
    to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
    internet_message_id?: string | null; conversation_id?: string | null
  }
```

- [ ] **Step 2: Write the failing test**

Create `app/src/lib/__tests__/draft-request.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDraftRequest } from '../draft-request.js'
import type { TriageCard } from '../triage-types.js'

function card(partial: Partial<TriageCard>): TriageCard {
  return {
    id: 'x', channel: 'outlook', action_type: null, action_target: null,
    predicted_reply: null, edited_reply: null, action_accepted: null,
    confidence: null, why: null, status: 'pending' as TriageCard['status'],
    sensitive: false, card: null, created_at: '', ...partial,
  } as TriageCard
}

test('fresh when no message ids present', () => {
  const c = card({
    predicted_reply: 'Hello there',
    card: { email: { subject: 'New topic', from: null, date: null, to: ['a@b.com'], excerpt: null, webLink: null, thread_summary: null }, thread: null, suggestion_extras: {} as never, context: {} as never },
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'fresh')
  assert.deepEqual(r.to, ['a@b.com'])
  assert.equal(r.subject, 'New topic')
  assert.equal(r.body, 'Hello there')
})

test('reply when internet_message_id present; edited_reply wins', () => {
  const c = card({
    predicted_reply: 'predicted', edited_reply: 'edited body',
    card: { email: { subject: 'Re: thread', from: 'x@y.com', date: null, to: ['a@b.com'], excerpt: null, webLink: null, thread_summary: null, internet_message_id: '<id@x>', conversation_id: 'conv1' }, thread: null, suggestion_extras: {} as never, context: {} as never },
  })
  const r = buildDraftRequest(c)
  assert.equal(r.mode, 'reply')
  assert.equal(r.body, 'edited body')
  assert.equal(r.replyKey?.internetMessageId, '<id@x>')
  assert.equal(r.replyKey?.conversationId, 'conv1')
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --import tsx --test app/src/lib/__tests__/draft-request.test.ts`
Expected: FAIL — cannot find module `../draft-request.js`.

- [ ] **Step 4: Implement the builder**

Create `app/src/lib/draft-request.ts`:

```ts
import type { TriageCard } from './triage-types'

export interface DraftRequest {
  mode: 'fresh' | 'reply'
  to: string[]
  subject: string
  body: string
  replyKey?: { internetMessageId?: string; conversationId?: string }
}

export function buildDraftRequest(card: TriageCard): DraftRequest {
  const email = card.card?.email
  const subject = email?.subject ?? ''
  const to = email?.to ?? []
  const body = card.edited_reply ?? card.predicted_reply ?? ''
  const internetMessageId = email?.internet_message_id ?? undefined
  const conversationId = email?.conversation_id ?? undefined

  if (internetMessageId || conversationId) {
    return { mode: 'reply', to, subject, body, replyKey: { internetMessageId, conversationId } }
  }
  return { mode: 'fresh', to, subject, body }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test app/src/lib/__tests__/draft-request.test.ts`
Expected: PASS — `# pass 2`, `# fail 0`.

- [ ] **Step 6: Add the hook**

Modify `app/src/hooks/use-triage.ts` — add (near `useMarkRead`):

```ts
import { buildDraftRequest } from '../lib/draft-request'
import type { TriageCard } from '../lib/triage-types'

export function usePushOutlookDraft() {
  return useMutation({
    mutationFn: async (card: TriageCard): Promise<{ ok: true; mode: 'fresh' | 'reply' }> => {
      const req = buildDraftRequest(card)
      const url = import.meta.env.VITE_OUTLOOK_BRIDGE_URL ?? 'http://127.0.0.1:7777'
      const token = import.meta.env.VITE_OUTLOOK_BRIDGE_TOKEN ?? ''
      let res: Response
      try {
        res = await fetch(`${url}/draft`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-bridge-token': token },
          body: JSON.stringify(req),
        })
      } catch {
        throw new Error('Bridge not running — run `npm run outlook-bridge`')
      }
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mode?: 'fresh' | 'reply'; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Bridge error (${res.status})`)
      return { ok: true, mode: data.mode ?? req.mode }
    },
  })
}
```

(If `useMutation` is not already imported in this file, add it to the existing `@tanstack/react-query` import.)

- [ ] **Step 7: Add app env vars**

Append to `app/.env.local` (use the same token value as root `.env`'s `OUTLOOK_BRIDGE_TOKEN`):

```
VITE_OUTLOOK_BRIDGE_URL=http://127.0.0.1:7777
VITE_OUTLOOK_BRIDGE_TOKEN=<paste OUTLOOK_BRIDGE_TOKEN value here>
```

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/draft-request.ts app/src/lib/__tests__/draft-request.test.ts app/src/lib/triage-types.ts app/src/hooks/use-triage.ts
git commit -m "feat(triage-app): client DraftRequest builder + usePushOutlookDraft hook"
# NOTE: app/.env.local is gitignored — do not commit the token.
```

---

## Task 6: App — the "Push to Outlook draft" button

**Files:**
- Modify: `app/src/pages/triage.tsx`

**Interfaces:**
- Consumes: `usePushOutlookDraft` (Task 5); the existing `selected` card and the "Mark read" button block as the placement/pattern reference.

This is a UI wiring task, verified by running the app and clicking the button.

- [ ] **Step 1: Wire the hook + button**

Modify `app/src/pages/triage.tsx`:

1. Near the existing `const markRead = useMarkRead()`, add:
```tsx
  const pushDraft = usePushOutlookDraft()
```
(and add `usePushOutlookDraft` to the import from `../hooks/use-triage`).

2. Immediately after the existing "Mark read" `<button>` block (the one gated on `selected.channel === "outlook" || selected.channel === "email"`), add a sibling button inside the same conditional region:
```tsx
{selected &&
  (selected.channel === "outlook" || selected.channel === "email") && (
    <button
      onClick={() => {
        if (pushDraft.isPending) return
        pushDraft.mutate(selected)
      }}
      disabled={pushDraft.isPending}
      title="Opens a pre-filled, reviewable draft in Outlook (does not send). Requires the local bridge: npm run outlook-bridge"
      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        color: "#93c5fd",
        background: "rgba(59,130,246,0.1)",
        borderColor: "rgba(59,130,246,0.35)",
      }}
    >
      {pushDraft.isPending
        ? "Opening…"
        : pushDraft.isError
        ? "⚠ " + (pushDraft.error as Error).message
        : pushDraft.isSuccess
        ? "Draft opened ✓"
        : "✉ Push to Outlook draft"}
    </button>
  )}
```

- [ ] **Step 2: Manual verify**

1. Terminal A: `npm run outlook-bridge`.
2. Terminal B: `cd app && npm run dev`, open the `/triage` route.
3. Select an Outlook/email **fresh** card → click "Push to Outlook draft" → a compose window opens pre-filled; button shows "Draft opened ✓". Discard the draft.
4. Select a **reply** card (one with a real thread) → click → a reply-all draft opens, "Re:" subject, your text above the quote. Discard.
5. Stop the bridge (Ctrl-C in A), click again → button shows the "Bridge not running — run `npm run outlook-bridge`" error. Restart the bridge.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/triage.tsx
git commit -m "feat(triage-app): Push to Outlook draft button (fresh + threaded reply-all)"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Localhost bridge, manual start, 127.0.0.1, token → Tasks 2 & 4. ✅
- argv-not-shell → Task 1 `buildOsascriptArgs` + Task 2 spawn. ✅
- Fresh compose + threaded reply-all (Legacy Outlook) → Task 3 (verified live). ✅
- Reply detection from card ids + body = edited ?? predicted → Task 5 `buildDraftRequest`. ✅
- Quote preservation → Task 3 (`content & return & return & content`). ✅
- Button modeled on Mark-read → Task 6. ✅
- Error handling (401/400/404 NOT_FOUND/500/bridge-down) → Tasks 2 & 5. ✅
- Plain-text body, reply-all default → Tasks 3 & 5. ✅
- CORS (gap found vs spec, added) → Task 2. ✅
- No card status change on push → Task 5 (no invalidate). ✅
- Future Graph fallback / Legacy dependency → documented in spec; not built (YAGNI). ✅

**Placeholder scan:** none — every code step has complete code; AppleScript verified live.

**Type consistency:** `DraftRequest` shape identical across bridge (`draft-request.ts`) and app (`app/src/lib/draft-request.ts`); argv order `[script, mode, subject, body, recipientsCsv, imid]` matches the AppleScript `on run argv` item order (1..5 after script); `usePushOutlookDraft` returns `{ok, mode}` matching the server's `POST /draft` success payload.
