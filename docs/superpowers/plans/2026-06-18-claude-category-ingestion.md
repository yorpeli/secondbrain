# Claude-Category Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `comms-assistant -- pull-outlook --source=claude` command that reads emails tagged with the Outlook `Claude` category via the local bridge, collapses threads to the latest message, emits workflow-ready capture packets, and drains (un-tags) emails whose `/triage` card is already resolved.

**Architecture:** A dumb AppleScript (`gather.applescript`) extracts raw message fields from Legacy Outlook into a control-char-delimited stream; smart TypeScript (`gather.ts`) parses it, collapses threads, assembles capture packets, and orchestrates the drain against Supabase. The emitted packets feed the EXISTING `comms-triage` workflow → `predictions:add-many` flow (orchestrated by Claude, unchanged). This is Plan A of two; Plan B reuses this machinery for the unread→bridge replacement.

**Tech Stack:** TypeScript via `tsx`; Node built-ins (`child_process`, `node:test`); AppleScript (`osascript`) against **Legacy Outlook**; Supabase (`store.ts` helpers) for the drain.

## Global Constraints

- Node `>=18`; run TS with `tsx`. Tests run via `node --import tsx --test <file>`.
- No new runtime deps. ESM import paths use `.js` extension even for `.ts` files.
- **Requires Legacy Outlook for Mac** (New Outlook's AppleScript is dead).
- Verified AppleScript forms (do NOT change without re-verifying live):
  - Unread filter (Plan B): `messages of inbox whose is read is false` — property is **`is read`** (two words), NOT `isread`.
  - Claude-category: cannot use a `whose` predicate. Narrow with `messages of inbox whose time received > (current date - <window> * days)` (default window **7**), then per-message check on **live references** (never `contents of` — it breaks category resolution); read names via index access `name of (item k of (categories of mref))`.
  - Category clear (drain): `set categories of <m> to <list of its categories whose name is not "Claude">` (verified write path).
  - Latest-message picker / thread key: `Thread-Index` header (fallback: normalized subject = subject with leading `Re:`/`Fwd:`/`Fw:` stripped, case-insensitive).
- **Claude-tag bypasses the classifier** (auto-keep); `signals.sensitive` is still computed (reuse `classifyEmail(...).isSensitive`).
- Capture-packet shape must match the `comms-triage` workflow input (see Task 3).
- osascript stream uses **`\x1f`** (unit sep) between fields and **`\x1e`** (record sep) between messages; emitted via AppleScript `(ASCII character 31)` / `(ASCII character 30)`.
- All new code lives under `comms-assistant/outlook-bridge/`; the CLI case goes in `comms-assistant/run.ts`.

---

## File Structure

- `comms-assistant/outlook-bridge/gather-types.ts` — shared types (`RawGatherRecord`, `CapturePacket`).
- `comms-assistant/outlook-bridge/gather-parse.ts` — `parseGatherRecords` (pure: delimited stream → `RawGatherRecord[]`).
- `comms-assistant/outlook-bridge/gather-collapse.ts` — `normalizeSubject`, `threadKey`, `collapseThreads` (pure: dedup-to-latest + short-body guard).
- `comms-assistant/outlook-bridge/gather-packets.ts` — `toCapturePackets` (pure: records → workflow packets, injected `isSensitive`).
- `comms-assistant/outlook-bridge/gather.applescript` — `on run argv`: modes `claude-capture` + `clear`.
- `comms-assistant/outlook-bridge/gather.ts` — `runOsascript` (injectable exec), `pullClaudeTagged`, `drainResolved` (Supabase query → clear).
- `comms-assistant/outlook-bridge/__tests__/gather.test.ts` — unit tests for the four pure modules.
- `comms-assistant/run.ts` — add `case 'pull-outlook'`.
- Docs: `comms-assistant/outlook-bridge/README.md`, `comms-assistant/CLAUDE.md`.

---

## Task 1: Raw record parser + types

**Files:**
- Create: `comms-assistant/outlook-bridge/gather-types.ts`
- Create: `comms-assistant/outlook-bridge/gather-parse.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts`

**Interfaces:**
- Produces:
  - `interface RawGatherRecord { outlookId: string; subject: string; from: string; to: string[]; dateIso: string; internetMessageId: string; threadIndex: string; body: string }`
  - `interface CapturePacket { slug: string; email: {...}; thread: {...}; signals: {...}; body: string; today: string }` (full shape in Task 3)
  - `function parseGatherRecords(raw: string): RawGatherRecord[]` — splits on `\x1e` (records) then `\x1f` (8 fields, in the order above); `to` is comma-split; skips empty trailing records.

- [ ] **Step 1: Write the failing test**

Create `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseGatherRecords } from '../gather-parse.js'

const US = '\x1f', RS = '\x1e'
function rec(fields: string[]) { return fields.join(US) }

test('parseGatherRecords: parses fields and comma-splits recipients', () => {
  const raw = [
    rec(['101', 'Hello', 'a@x.com', 'b@x.com,c@x.com', '2026-06-18T11:26:27', '<id1@x>', 'AQHabc', 'Body one']),
    rec(['102', 'Re: Hello', 'd@x.com', 'b@x.com', '2026-06-18T12:00:00', '<id2@x>', 'AQHabc', 'Body two']),
  ].join(RS)
  const out = parseGatherRecords(raw)
  assert.equal(out.length, 2)
  assert.equal(out[0].outlookId, '101')
  assert.deepEqual(out[0].to, ['b@x.com', 'c@x.com'])
  assert.equal(out[1].internetMessageId, '<id2@x>')
  assert.equal(out[1].threadIndex, 'AQHabc')
})

test('parseGatherRecords: empty input → []', () => {
  assert.deepEqual(parseGatherRecords(''), [])
  assert.deepEqual(parseGatherRecords('\x1e\x1e'), [])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — cannot find module `../gather-parse.js`.

- [ ] **Step 3: Write the types and parser**

Create `comms-assistant/outlook-bridge/gather-types.ts`:

```ts
export interface RawGatherRecord {
  outlookId: string
  subject: string
  from: string
  to: string[]
  dateIso: string
  internetMessageId: string
  threadIndex: string
  body: string
}

export interface CapturePacket {
  slug: string
  email: {
    subject: string
    from: string
    date: string
    to: string[]
    excerpt: string
    channel: 'outlook'
    internet_message_id: string
    conversation_id: string
    web_link: string
  }
  thread: { subject: string; participants: string[]; mentions: string[]; bodyToDate: string }
  signals: { sensitive: boolean; directToHim: boolean; askToHim: boolean; broadcast: boolean; cold: boolean }
  body: string
  today: string
}
```

Create `comms-assistant/outlook-bridge/gather-parse.ts`:

```ts
import type { RawGatherRecord } from './gather-types.js'

const US = '\x1f'
const RS = '\x1e'

export function parseGatherRecords(raw: string): RawGatherRecord[] {
  if (!raw) return []
  const out: RawGatherRecord[] = []
  for (const block of raw.split(RS)) {
    if (block.trim() === '') continue
    const f = block.split(US)
    if (f.length < 8) continue
    out.push({
      outlookId: f[0],
      subject: f[1],
      from: f[2],
      to: f[3] ? f[3].split(',').map((s) => s.trim()).filter(Boolean) : [],
      dateIso: f[4],
      internetMessageId: f[5],
      threadIndex: f[6],
      body: f.slice(7).join(US), // body is last; tolerate stray US inside it
    })
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 2`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather-types.ts comms-assistant/outlook-bridge/gather-parse.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): raw record parser + capture types for bridge gather"
```

---

## Task 2: Thread collapse (dedup-to-latest)

**Files:**
- Create: `comms-assistant/outlook-bridge/gather-collapse.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (append)

**Interfaces:**
- Consumes: `RawGatherRecord` (Task 1).
- Produces:
  - `function normalizeSubject(subject: string): string` — strips leading `Re:`/`Fwd:`/`Fw:` (case-insensitive, repeated), trims.
  - `function threadKey(r: RawGatherRecord): string` — `r.threadIndex` if non-empty, else `normalizeSubject(r.subject)`.
  - `function collapseThreads(records: RawGatherRecord[]): RawGatherRecord[]` — one record per thread (latest by `dateIso` lexical compare); short-body guard: if the latest body < 200 chars and a same-thread record has a ≥200-char body, append `"\n\n--- earlier in thread ---\n" + longerBody` to the chosen record's body.

- [ ] **Step 1: Write the failing test**

Append to `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { normalizeSubject, threadKey, collapseThreads } from '../gather-collapse.js'
import type { RawGatherRecord } from '../gather-types.js'

function r(p: Partial<RawGatherRecord>): RawGatherRecord {
  return { outlookId: '1', subject: 's', from: 'a@x.com', to: [], dateIso: '2026-06-01T00:00:00', internetMessageId: '<i>', threadIndex: '', body: 'x', ...p }
}

test('normalizeSubject strips Re/Fwd prefixes, repeated, case-insensitive', () => {
  assert.equal(normalizeSubject('RE: Re: Fwd: Hello'), 'Hello')
  assert.equal(normalizeSubject('Hello'), 'Hello')
})

test('threadKey prefers Thread-Index, falls back to normalized subject', () => {
  assert.equal(threadKey(r({ threadIndex: 'AQ1', subject: 'Re: x' })), 'AQ1')
  assert.equal(threadKey(r({ threadIndex: '', subject: 'Re: x' })), 'x')
})

test('collapseThreads keeps the latest message per thread', () => {
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-09T17:00:00', body: 'old' }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-17T16:00:00', body: 'newest with full history here, well over two hundred characters '.padEnd(250, '.') }),
    r({ outlookId: '3', threadIndex: 'OTHER', dateIso: '2026-06-15T00:00:00', body: 'distinct' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 2)
  const tThread = out.find((x) => x.threadIndex === 'T')!
  assert.equal(tThread.outlookId, '2')
})

test('collapseThreads short-body guard appends a longer earlier body', () => {
  const long = 'this is the substantive earlier message '.padEnd(250, '.')
  const recs = [
    r({ outlookId: '1', threadIndex: 'T', dateIso: '2026-06-01T00:00:00', body: long }),
    r({ outlookId: '2', threadIndex: 'T', dateIso: '2026-06-02T00:00:00', body: 'Thanks!' }),
  ]
  const out = collapseThreads(recs)
  assert.equal(out.length, 1)
  assert.equal(out[0].outlookId, '2')
  assert.ok(out[0].body.includes('Thanks!'))
  assert.ok(out[0].body.includes('earlier in thread'))
  assert.ok(out[0].body.includes('substantive earlier message'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — cannot find module `../gather-collapse.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/outlook-bridge/gather-collapse.ts`:

```ts
import type { RawGatherRecord } from './gather-types.js'

const PREFIX = /^\s*(re|fwd|fw)\s*:\s*/i

export function normalizeSubject(subject: string): string {
  let s = (subject ?? '').trim()
  while (PREFIX.test(s)) s = s.replace(PREFIX, '').trim()
  return s
}

export function threadKey(r: RawGatherRecord): string {
  return r.threadIndex && r.threadIndex.trim() !== '' ? r.threadIndex.trim() : normalizeSubject(r.subject)
}

const MIN_BODY = 200

export function collapseThreads(records: RawGatherRecord[]): RawGatherRecord[] {
  const byThread = new Map<string, RawGatherRecord[]>()
  for (const rec of records) {
    const k = threadKey(rec)
    const arr = byThread.get(k)
    if (arr) arr.push(rec)
    else byThread.set(k, [rec])
  }
  const out: RawGatherRecord[] = []
  for (const arr of byThread.values()) {
    // latest by ISO lexical compare (ISO strings sort chronologically)
    const latest = arr.reduce((a, b) => (b.dateIso > a.dateIso ? b : a))
    if (latest.body.length < MIN_BODY) {
      const longer = arr
        .filter((x) => x !== latest && x.body.length >= MIN_BODY)
        .sort((a, b) => b.body.length - a.body.length)[0]
      if (longer) {
        out.push({ ...latest, body: `${latest.body}\n\n--- earlier in thread ---\n${longer.body}` })
        continue
      }
    }
    out.push(latest)
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 6`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather-collapse.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): thread collapse to latest with short-body guard"
```

---

## Task 3: Capture-packet assembly

**Files:**
- Create: `comms-assistant/outlook-bridge/gather-packets.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (append)

**Interfaces:**
- Consumes: `RawGatherRecord` (Task 1), `CapturePacket` (Task 1), `normalizeSubject` (Task 2).
- Produces:
  - `function toCapturePackets(records: RawGatherRecord[], today: string, isSensitive: (r: RawGatherRecord) => boolean): CapturePacket[]`
  - Each packet: `email.channel='outlook'`, `email.conversation_id = threadKey-equivalent` (use `r.threadIndex || normalizeSubject(r.subject)`), `email.excerpt` = first 200 chars of body, `thread.participants = [from, ...to]` deduped, `thread.mentions = []` (Plan A: no @-mention parsing), `thread.bodyToDate = body`, `signals.sensitive = isSensitive(r)`, other signals false, `slug` = a filesystem-safe slug from threadKey.

- [ ] **Step 1: Write the failing test**

Append to `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { toCapturePackets } from '../gather-packets.js'

test('toCapturePackets maps fields and applies injected sensitivity', () => {
  const recs = [r({
    outlookId: '9', subject: 'RE: Budget', from: 'boss@x.com', to: ['me@x.com', 'boss@x.com'],
    dateIso: '2026-06-18T09:00:00', internetMessageId: '<m9@x>', threadIndex: 'AQ9', body: 'Please review the numbers.',
  })]
  const packets = toCapturePackets(recs, '2026-06-18', (rec) => rec.subject.includes('Budget'))
  assert.equal(packets.length, 1)
  const p = packets[0]
  assert.equal(p.email.channel, 'outlook')
  assert.equal(p.email.internet_message_id, '<m9@x>')
  assert.equal(p.email.conversation_id, 'AQ9')
  assert.equal(p.email.subject, 'RE: Budget')
  assert.deepEqual(p.thread.participants, ['boss@x.com', 'me@x.com'])
  assert.equal(p.thread.bodyToDate, 'Please review the numbers.')
  assert.equal(p.signals.sensitive, true)
  assert.equal(p.today, '2026-06-18')
  assert.ok(p.slug.length > 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — cannot find module `../gather-packets.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/outlook-bridge/gather-packets.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 7`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather-packets.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): capture-packet assembly from raw records"
```

---

## Task 4: The AppleScript (`claude-capture` + `clear`)

**Files:**
- Create: `comms-assistant/outlook-bridge/gather.applescript`

**Interfaces:**
- Consumes argv: `[mode, ...args]`. `mode='claude-capture'` → `args=[windowDays]`; `mode='clear'` → `args=[outlookId, outlookId, ...]`.
- Produces (claude-capture): stdout = records joined by `\x1e`, fields by `\x1f` in order `outlookId, subject, from, to(csv), dateIso, internetMessageId, threadIndex, body`. (clear): stdout = `cleared <n>`.

This task is verified by manual smoke tests (cannot unit-test without Outlook). Every form below was verified live on 2026-06-18 against Legacy Outlook 16.108.

- [ ] **Step 1: Create the AppleScript**

Create `comms-assistant/outlook-bridge/gather.applescript`:

```applescript
on pad(n)
	if n < 10 then return "0" & (n as string)
	return n as string
end pad

on isoDate(d)
	return (year of d as string) & "-" & my pad((month of d) as integer) & "-" & my pad(day of d) & ¬
		"T" & my pad(hours of d) & ":" & my pad(minutes of d) & ":" & my pad(seconds of d)
end isoDate

on senderAddr(m)
	-- `sender` is itself the email-address record {name, address}; it must be bound to a
	-- variable before accessing `address` (inline `address of (sender of m)` fails coercion).
	try
		set s to sender of m
		return address of s
	on error
		try
			set s to sender of m
			return name of s
		on error
			return "(unknown)"
		end try
	end try
end senderAddr

on headerValue(m, fieldName)
	set out to ""
	try
		set hdrs to (headers of m) as string
		repeat with ln in (paragraphs of hdrs)
			set s to (ln as string)
			if s starts with fieldName then
				set out to (text ((length of fieldName) + 1) thru -1 of s)
				exit repeat
			end if
		end repeat
	end try
	return out
end headerValue

on hasClaude(mref)
	try
		set cl to categories of mref
		repeat with k from 1 to (count of cl)
			if (name of (item k of cl)) is "Claude" then return true
		end repeat
	end try
	return false
end hasClaude

on toCsv(addrList)
	set AppleScript's text item delimiters to ","
	set s to addrList as string
	set AppleScript's text item delimiters to ""
	return s
end toCsv

on run argv
	set US to (ASCII character 31)
	set RS to (ASCII character 30)
	set theMode to item 1 of argv

	tell application "Microsoft Outlook"
		if theMode is "claude-capture" then
			set windowDays to (item 2 of argv) as integer
			set cutoff to (current date) - (windowDays * days)
			set recent to (messages of inbox whose time received > cutoff)
			set outRecs to {}
			repeat with i from 1 to (count of recent)
				set mref to item i of recent
				if my hasClaude(mref) then
					set toList to {}
					try
						-- materialize the recipient list, bind each, then two-step the address:
						-- a recipient has an `email address` sub-record; `address of (email address of rcpt)`
						-- only resolves on a bound item of a materialized list (not on `to recipients` directly).
						set rl to to recipients of mref
						repeat with ri from 1 to (count of rl)
							set rcpt to item ri of rl
							try
								set ea to email address of rcpt
								set end of toList to (address of ea)
							end try
						end repeat
					end try
					set fields to {(id of mref as string), (subject of mref), my senderAddr(mref), ¬
						my toCsv(toList), my isoDate(time received of mref), ¬
						my headerValue(mref, "Message-ID:"), my headerValue(mref, "Thread-Index:"), ¬
						((plain text content of mref) as string)}
					set AppleScript's text item delimiters to US
					set end of outRecs to (fields as string)
					set AppleScript's text item delimiters to ""
				end if
			end repeat
			set AppleScript's text item delimiters to RS
			set s to outRecs as string
			set AppleScript's text item delimiters to ""
			return s

		else if theMode is "clear" then
			set ids to items 2 thru -1 of argv
			set n to 0
			repeat with anId in ids
				try
					set m to (item 1 of (messages of inbox whose id is (anId as integer)))
					set keep to {}
					set cl to categories of m
					repeat with k from 1 to (count of cl)
						if (name of (item k of cl)) is not "Claude" then set end of keep to (item k of cl)
					end repeat
					set categories of m to keep
					set n to n + 1
				end try
			end repeat
			return "cleared " & (n as string)
		end if
	end tell
end run
```

- [ ] **Step 2: Smoke test — claude-capture emits records**

Run (pipe through a python one-liner to make the control chars visible as record counts):
```bash
osascript comms-assistant/outlook-bridge/gather.applescript claude-capture 7 \
  | python3 -c "import sys; d=sys.stdin.read(); recs=[x for x in d.split(chr(30)) if x.strip()]; print('records:', len(recs)); print('fields[0]:', len(recs[0].split(chr(31))) if recs else 0); print('subject[0]:', recs[0].split(chr(31))[1] if recs else '-')"
```
Expected: `records: N` (N ≥ 1 given tagged emails exist), `fields[0]: 8`, and a real subject. If `records: 0`, tag an email `Claude` first (and allow ~2 min sync).

- [ ] **Step 3: Smoke test — clear is a no-op on a bogus id**

Run:
```bash
osascript comms-assistant/outlook-bridge/gather.applescript clear 999999999 ; echo " exit=$?"
```
Expected: `cleared 0` and `exit=0` (no such id → nothing cleared, no error). **Do NOT test `clear` on a real id** — that un-tags a real email; the orchestration test (Task 5) and end-to-end (Task 6) cover the real path under control.

- [ ] **Step 4: Commit**

```bash
git add comms-assistant/outlook-bridge/gather.applescript
git commit -m "feat(gather): AppleScript claude-capture + category-clear modes (verified)"
```

---

## Task 5: Orchestration — pull + drain (`gather.ts`)

**Files:**
- Create: `comms-assistant/outlook-bridge/gather.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (append)

**Interfaces:**
- Consumes: `parseGatherRecords` (T1), `collapseThreads` (T2), `toCapturePackets` (T3), `classifyEmail` (`../classify.js`), the AppleScript (T4).
- Produces:
  - `type Exec = (cmd: string, args: string[]) => Promise<string>` (resolves stdout)
  - `interface PullResult { packets: CapturePacket[]; cleared: number; total: number; resolvedDrained: string[] }`
  - `async function pullClaudeTagged(opts: { windowDays: number; today: string; exec?: Exec; isResolved?: (imid: string) => Promise<boolean> }): Promise<PullResult>`
    - runs `claude-capture` → parse → collapse → for each thread: if `isResolved(internetMessageId)` → collect its `outlookId` for clearing; else → keep for packets. Runs `clear` on the resolved outlookIds. `signals.sensitive` via `classifyEmail`.

- [ ] **Step 1: Write the failing test**

Append to `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { pullClaudeTagged, type Exec } from '../gather.js'

test('pullClaudeTagged: collapses, drains resolved, returns unresolved packets', async () => {
  const US = '\x1f', RS = '\x1e'
  const capture = [
    ['1', 'RE: Alpha', 'a@x.com', 'me@x.com', '2026-06-18T09:00:00', '<resolved@x>', 'TA', 'alpha body'].join(US),
    ['2', 'Beta', 'b@x.com', 'me@x.com', '2026-06-18T10:00:00', '<open@x>', 'TB', 'beta body'].join(US),
  ].join(RS)
  const calls: { cmd: string; args: string[] }[] = []
  const exec: Exec = async (cmd, args) => {
    calls.push({ cmd, args })
    if (args[1] === 'claude-capture') return capture
    if (args[1] === 'clear') return `cleared ${args.length - 2}`
    return ''
  }
  const isResolved = async (imid: string) => imid === '<resolved@x>'
  const res = await pullClaudeTagged({ windowDays: 7, today: '2026-06-18', exec, isResolved })

  assert.equal(res.total, 2)
  assert.equal(res.packets.length, 1)
  assert.equal(res.packets[0].email.internet_message_id, '<open@x>')
  assert.deepEqual(res.resolvedDrained, ['1'])
  // the clear call carried the resolved message's outlook id
  const clearCall = calls.find((c) => c.args[1] === 'clear')!
  assert.ok(clearCall.args.includes('1'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — cannot find module `../gather.js`.

- [ ] **Step 3: Write the implementation**

Create `comms-assistant/outlook-bridge/gather.ts`:

```ts
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseGatherRecords } from './gather-parse.js'
import { collapseThreads } from './gather-collapse.js'
import { toCapturePackets } from './gather-packets.js'
import type { CapturePacket, RawGatherRecord } from './gather-types.js'
import { classifyEmail } from '../classify.js'

export type Exec = (cmd: string, args: string[]) => Promise<string>

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'gather.applescript')

const realExec: Exec = (cmd, args) =>
  new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout)
    })
  })

export interface PullResult {
  packets: CapturePacket[]
  cleared: number
  total: number
  resolvedDrained: string[]
}

function sensitiveOf(r: RawGatherRecord): boolean {
  return classifyEmail({ subject: r.subject, sender: r.from, recipients: r.to, bodyPreview: r.body.slice(0, 200) }).isSensitive
}

export async function pullClaudeTagged(opts: {
  windowDays: number
  today: string
  exec?: Exec
  isResolved?: (internetMessageId: string) => Promise<boolean>
}): Promise<PullResult> {
  const exec = opts.exec ?? realExec
  const isResolved = opts.isResolved ?? (async () => false)

  const raw = await exec('osascript', [SCRIPT, 'claude-capture', String(opts.windowDays)])
  const threads = collapseThreads(parseGatherRecords(raw))

  const keep: RawGatherRecord[] = []
  const drainIds: string[] = []
  for (const t of threads) {
    if (await isResolved(t.internetMessageId)) drainIds.push(t.outlookId)
    else keep.push(t)
  }

  let cleared = 0
  if (drainIds.length > 0) {
    const out = await exec('osascript', [SCRIPT, 'clear', ...drainIds])
    cleared = parseInt(out.replace(/\D+/g, ''), 10) || 0
  }

  return {
    packets: toCapturePackets(keep, opts.today, sensitiveOf),
    cleared,
    total: threads.length,
    resolvedDrained: drainIds,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 8`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): pull+drain orchestration with injectable exec and resolved-check"
```

---

## Task 6: CLI subcommand `pull-outlook`

**Files:**
- Modify: `comms-assistant/run.ts`

**Interfaces:**
- Consumes: `pullClaudeTagged` (T5); `getSupabase` (`../lib/supabase.js`); `arg`/`flag` helpers in run.ts.
- Produces: `comms-assistant -- pull-outlook --source=claude [--window=7] [--today=YYYY-MM-DD]` → prints the capture packets JSON (the array `pullClaudeTagged().packets`) to stdout, plus a stderr summary line (`total / kept / drained`). The packets JSON is what Claude feeds into the comms-triage workflow.

- [ ] **Step 1: Add the resolved-card lookup + the CLI case**

In `comms-assistant/run.ts`, add an import near the top (after the existing imports):

```ts
import { pullClaudeTagged } from './outlook-bridge/gather.js'
import { getSupabase } from '../lib/supabase.js'
```

Then add this `case` inside the main `switch` (alongside `case 'classify':`):

```ts
    case 'pull-outlook': {
      const source = arg('source') ?? 'claude'
      if (source !== 'claude') throw new Error("pull-outlook: only --source=claude is supported (Plan A)")
      const windowDays = Number(arg('window') ?? 7)
      const today = arg('today') ?? new Date().toISOString().slice(0, 10)

      const sb = getSupabase() as any
      const isResolved = async (imid: string): Promise<boolean> => {
        if (!imid) return false
        const { data } = await sb
          .from('comms_predictions')
          .select('status,resolution')
          .eq('internet_message_id', imid)
          .limit(1)
        const row = data?.[0]
        if (!row) return false
        return row.resolution != null || row.status === 'dismissed' || row.status === 'sent'
      }

      const res = await pullClaudeTagged({ windowDays, today, isResolved })
      process.stderr.write(`pull-outlook claude: total=${res.total} kept=${res.packets.length} drained=${res.cleared}\n`)
      console.log(JSON.stringify(res.packets, null, 2))
      break
    }
```

- [ ] **Step 2: Type-check**

Run: `cd comms-assistant && npx tsc --noEmit` (or the repo's check). If `comms-assistant` has no local tsconfig, run from repo root: `npx tsc --noEmit -p .` only if a root tsconfig exists; otherwise rely on `tsx` runtime + the test suite.
Expected: no new type errors from the added case.

- [ ] **Step 3: Manual end-to-end verify**

With at least one `Claude`-tagged email present:
```bash
npm run comms-assistant -- pull-outlook --source=claude --window=7 --today=2026-06-18
```
Expected: a JSON array of capture packets on stdout (each with `email.internet_message_id`, `thread.bodyToDate`, `signals`), and a stderr line `pull-outlook claude: total=N kept=M drained=K`. Confirm a known tagged email appears as a packet. (Resolved-card draining only fires if a matching card is already `dismissed`/`sent`.)

- [ ] **Step 4: Commit**

```bash
git add comms-assistant/run.ts
git commit -m "feat(comms): pull-outlook --source=claude CLI (capture packets + resolved-drain)"
```

---

## Task 7: Docs — gather commands + sweep procedure

**Files:**
- Modify: `comms-assistant/outlook-bridge/README.md`
- Modify: `comms-assistant/CLAUDE.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Document the gather in the bridge README**

Add a `## Gather (pull-outlook)` section to `comms-assistant/outlook-bridge/README.md` describing: `comms-assistant -- pull-outlook --source=claude [--window=7]`; the `gather.applescript` modes (`claude-capture`, `clear`); the control-char stream format; the `is read` (two-word) unread-filter fact and the category scan/clear facts; and that the emitted packets feed the existing `comms-triage` workflow → `predictions:add-many`. Note the **Legacy-Outlook requirement**, the **~2-min category sync lag**, and the **7-day default window**.

- [ ] **Step 2: Document the Claude-category path in the sweep procedure**

In `comms-assistant/CLAUDE.md`, add a short subsection under the triage-sweep procedure: when Yonatan says **"pull Claude emails"**, run `pull-outlook --source=claude` → feed the packets into the `comms-triage` workflow (Claude-tag **bypasses classify**, sensitive still flagged) → `predictions:add-many` → `/triage` app. Note the lazy drain (resolved cards get their `Claude` category cleared on the next pull) and that this is the **bridge** path (email), distinct from the MCP Teams path.

- [ ] **Step 3: Commit**

```bash
git add comms-assistant/outlook-bridge/README.md comms-assistant/CLAUDE.md
git commit -m "docs(gather): pull-outlook commands + Claude-category sweep procedure"
```

---

## Self-Review (completed by plan author)

**Spec coverage (Plan A scope = Claude-category path):**
- Bridge gather CLI `pull-outlook --source=claude` → Task 6. ✅
- `claude-capture` one-stage (no classify) → Tasks 4–6. ✅
- Thread collapse (Thread-Index → normalized subject), latest, short-body guard → Task 2. ✅
- Capture-packet shape matching the workflow → Tasks 1, 3. ✅
- Classifier bypass + `signals.sensitive` via `classifyEmail` → Task 5. ✅
- Category drain (lazy, on resolve = dismissed/sent/resolution) → Tasks 4–6. ✅
- Persistence keys / convergence into the existing workflow → reused as-is (Claude orchestrates; packets carry `internet_message_id`/`conversation_id`). ✅
- Date-window default 7d, widenable → Task 6 (`--window`). ✅
- Legacy-Outlook dependency, sync-lag, AppleScript facts documented → Task 7. ✅
- **Deferred to Plan B (not in this plan):** unread `is read = false` two-stage gather, MCP email fallback, Teams convergence. Listed in Global Constraints for forward-reference only.

**Placeholder scan:** none — every code step has complete code; AppleScript verified live 2026-06-18.

**Type consistency:** `RawGatherRecord` (8 fields) is produced by `parseGatherRecords` and consumed by `collapseThreads`/`toCapturePackets`/`pullClaudeTagged` with identical field names; `CapturePacket` shape is defined once (Task 1) and built once (Task 3); the AppleScript field order (Task 4) matches the parser's field order (Task 1) exactly: `outlookId, subject, from, to, dateIso, internetMessageId, threadIndex, body`.
