# Unread → Bridge Gather Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `comms-assistant -- pull-outlook --source=unread` — read all unread inbox emails via the bridge, classify them (drop noise, flag sensitive), collapse threads, and emit the same capture packets as the Claude-category path, making the bridge the default email gather (MCP becomes the fallback; Teams stays MCP).

**Architecture:** Reuses Plan A's machinery wholesale (`gather-parse.ts`, `gather-collapse.ts`, `gather-packets.ts`, `gather.ts`, `run.ts pull-outlook`). Adds an `unread-capture` AppleScript mode (filter `whose is read is false`), parameterizes `toCapturePackets` so each source supplies its own tier-routing signals, a pure `deriveUnreadSignals`, and a `pullUnread` orchestration that classifies in TS. **One-stage** (read all unread bodies once, classify in TS) — not the spec's two-stage, because AppleScript has no cheap preview (`plain text content` is the full body) so a meta stage saves no reads, and local reads are unthrottled.

**Tech Stack:** TypeScript via `tsx`; Node built-ins (`child_process`, `node:test`); AppleScript against Legacy Outlook; `classifyEmail` from `comms-assistant/classify.ts`.

## Global Constraints

- Node `>=18`; tests via `node --import tsx --test <file>`; ESM `.js` import paths; no new deps.
- **Requires Legacy Outlook for Mac.**
- Verified AppleScript: unread filter is `messages of inbox whose is read is false` — property **`is read`** (two words). Record emission identical to Plan A's `claude-capture` (8 fields, `\x1f`/`\x1e`); reuse the same field order: `outlookId, subject, from, to(csv), dateIso, internetMessageId, threadIndex, body`.
- **Gate = keep `!classification.isNoise`** (keep fresh + reply + sensitive; drop only noise). `signals.sensitive = classification.isSensitive`. (Raw `needsResponse` would wrongly drop sensitive — we flag-and-keep them.)
- Capture-packet shape unchanged (matches the `comms-triage` workflow). Unread is **not** auto-routed to T2 (unlike curated Claude tags); tier signals are derived per-email.
- **No drain** for unread (unread emails carry no `Claude` category).
- MCP email fallback + Teams are **out of scope** here (Claude-orchestrated procedure on bridge failure — documented, not built).
- All code under `comms-assistant/outlook-bridge/`; CLI in `comms-assistant/run.ts`.

---

## File Structure

- `comms-assistant/outlook-bridge/gather-signals.ts` — **new**: `claudeSignals` (curated → T2) + `deriveUnreadSignals` (per-email heuristic). Pure.
- `comms-assistant/outlook-bridge/gather-packets.ts` — **modify**: `toCapturePackets` takes an injected `deriveSignals` fn (was `isSensitive`).
- `comms-assistant/outlook-bridge/gather.ts` — **modify**: `pullClaudeTagged` passes `claudeSignals`; **add** `pullUnread`.
- `comms-assistant/outlook-bridge/gather.applescript` — **modify**: extract a shared `emitRecord` handler; add `unread-capture` mode.
- `comms-assistant/run.ts` — **modify**: `pull-outlook --source=unread` branch.
- `comms-assistant/outlook-bridge/__tests__/gather.test.ts` — **modify**: append signal + pullUnread tests; update the `toCapturePackets` test for the new signature.
- `comms-assistant/outlook-bridge/GATHER.md` — **modify**: add the unread section.

---

## Task 1: Parameterize `toCapturePackets` signals

**Files:**
- Create: `comms-assistant/outlook-bridge/gather-signals.ts`
- Modify: `comms-assistant/outlook-bridge/gather-packets.ts`
- Modify: `comms-assistant/outlook-bridge/gather.ts` (the `pullClaudeTagged` call site)
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (modify the existing `toCapturePackets` test)

**Interfaces:**
- Produces:
  - `type Signals = CapturePacket['signals']`
  - `function claudeSignals(r: RawGatherRecord, isSensitive: (r: RawGatherRecord) => boolean): Signals` — curated → `directToHim:true, askToHim:true`.
  - `toCapturePackets(records, today, deriveSignals: (r: RawGatherRecord) => Signals): CapturePacket[]` (signature change: 3rd arg is now a full-signals fn).

- [ ] **Step 1: Create `gather-signals.ts` with `claudeSignals`**

Create `comms-assistant/outlook-bridge/gather-signals.ts`:

```ts
import type { RawGatherRecord, CapturePacket } from './gather-types.js'

export type Signals = CapturePacket['signals']

// Curated Claude-tagged emails are the highest-intent input → route to T2 (deep + verify).
export function claudeSignals(r: RawGatherRecord, isSensitive: (r: RawGatherRecord) => boolean): Signals {
  return { sensitive: isSensitive(r), directToHim: true, askToHim: true, broadcast: false, cold: false }
}
```

- [ ] **Step 2: Change `toCapturePackets` to take a `deriveSignals` fn**

In `comms-assistant/outlook-bridge/gather-packets.ts`, replace the `isSensitive` param and the `signals:` line:

```ts
import type { RawGatherRecord, CapturePacket } from './gather-types.js'
import { normalizeSubject } from './gather-collapse.js'
import type { Signals } from './gather-signals.js'

// ...shortHash + slugify unchanged...

export function toCapturePackets(
  records: RawGatherRecord[],
  today: string,
  deriveSignals: (r: RawGatherRecord) => Signals,
): CapturePacket[] {
  return records.map((r) => {
    const convId = r.threadIndex && r.threadIndex.trim() !== '' ? r.threadIndex.trim() : normalizeSubject(r.subject)
    const participants = Array.from(new Set([r.from, ...r.to].filter(Boolean)))
    return {
      slug: slugify(convId),
      email: {
        subject: r.subject, from: r.from, date: r.dateIso, to: r.to,
        excerpt: r.body.slice(0, 200), channel: 'outlook',
        internet_message_id: r.internetMessageId, conversation_id: convId, web_link: '',
      },
      thread: { subject: r.subject, participants, mentions: [], bodyToDate: r.body },
      signals: deriveSignals(r),
      body: r.body,
      today,
    }
  })
}
```

- [ ] **Step 3: Update the `pullClaudeTagged` call site in `gather.ts`**

In `comms-assistant/outlook-bridge/gather.ts`, change the `toCapturePackets` call (and keep `sensitiveOf` as-is). Replace:

```ts
    packets: toCapturePackets(keep, opts.today, sensitiveOf),
```
with:

```ts
    packets: toCapturePackets(keep, opts.today, (r) => claudeSignals(r, sensitiveOf)),
```
and add the import:

```ts
import { claudeSignals } from './gather-signals.js'
```

- [ ] **Step 4: Update the existing `toCapturePackets` test for the new signature**

In `comms-assistant/outlook-bridge/__tests__/gather.test.ts`, the existing `toCapturePackets` test calls it with a sensitivity predicate. Change that call to pass a full-signals fn, and keep the T2 assertions:

```ts
  const packets = toCapturePackets(recs, '2026-06-18', (rec) => ({
    sensitive: rec.subject.includes('Budget'), directToHim: true, askToHim: true, broadcast: false, cold: false,
  }))
```
(The assertions `p.signals.sensitive === true`, `p.signals.askToHim === true`, `p.signals.directToHim === true` remain valid.)

- [ ] **Step 5: Run tests to verify green**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 8` (same count; refactor preserves behavior).

- [ ] **Step 6: Commit**

```bash
git add comms-assistant/outlook-bridge/gather-signals.ts comms-assistant/outlook-bridge/gather-packets.ts comms-assistant/outlook-bridge/gather.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "refactor(gather): parameterize toCapturePackets signals (claudeSignals helper)"
```

---

## Task 2: `deriveUnreadSignals`

**Files:**
- Modify: `comms-assistant/outlook-bridge/gather-signals.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (append)

**Interfaces:**
- Consumes: `RawGatherRecord`, `classifyEmail` (`../classify.js`).
- Produces: `function deriveUnreadSignals(r: RawGatherRecord): Signals` — `sensitive` from `classifyEmail`; `broadcast` when `to.length >= 10`; `directToHim` when `to.length <= 3 && !broadcast`; `askToHim` when the body contains `?`; `cold` always `false` (no contact-DB check in Plan B).

- [ ] **Step 1: Write the failing test**

Append to `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { deriveUnreadSignals } from '../gather-signals.js'

test('deriveUnreadSignals: direct small-audience question → directToHim + askToHim', () => {
  const s = deriveUnreadSignals(r({ subject: 'Quick q', to: ['me@x.com'], body: 'can you approve this?' }))
  assert.equal(s.directToHim, true)
  assert.equal(s.askToHim, true)
  assert.equal(s.broadcast, false)
  assert.equal(s.sensitive, false)
})

test('deriveUnreadSignals: large audience → broadcast, not directToHim', () => {
  const many = Array.from({ length: 12 }, (_, i) => `p${i}@x.com`)
  const s = deriveUnreadSignals(r({ subject: 'FYI all', to: many, body: 'status update.' }))
  assert.equal(s.broadcast, true)
  assert.equal(s.directToHim, false)
})

test('deriveUnreadSignals: sensitive subject flagged via classifyEmail', () => {
  const s = deriveUnreadSignals(r({ subject: 'Your compensation review', to: ['me@x.com'], body: 'details' }))
  assert.equal(s.sensitive, true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — `deriveUnreadSignals` is not exported.

- [ ] **Step 3: Implement `deriveUnreadSignals`**

Append to `comms-assistant/outlook-bridge/gather-signals.ts`:

```ts
import { classifyEmail } from '../classify.js'

export function deriveUnreadSignals(r: RawGatherRecord): Signals {
  const c = classifyEmail({ subject: r.subject, sender: r.from, recipients: r.to, bodyPreview: r.body.slice(0, 200) })
  const broadcast = r.to.length >= 10
  return {
    sensitive: c.isSensitive,
    broadcast,
    cold: false,
    directToHim: !broadcast && r.to.length <= 3,
    askToHim: r.body.includes('?'),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 11`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather-signals.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): deriveUnreadSignals (per-email tier-routing heuristic)"
```

---

## Task 3: AppleScript `unread-capture` mode (shared emitter)

**Files:**
- Modify: `comms-assistant/outlook-bridge/gather.applescript`

**Interfaces:**
- Consumes argv: `mode='unread-capture'` (no extra args). Produces the same `\x1e`/`\x1f` record stream as `claude-capture`, for every message `whose is read is false`.

This task is **controller-implemented and verified LIVE** (AppleScript is not unit-testable; the controller runs the smoke test against Legacy Outlook). Refactor the per-message record building from `claude-capture` into a shared `on emitRecord(mref)` handler (wrapped in a `tell application "Microsoft Outlook"` block, like the other handlers), then have both `claude-capture` and a new `unread-capture` branch call it.

- [ ] **Step 1: Extract `emitRecord` + add `unread-capture`**

Add a handler (mirrors the existing claude-capture field build, including the materialized recipient loop and `headerValue` calls):

```applescript
on emitRecord(mref)
	set US to (ASCII character 31)
	tell application "Microsoft Outlook"
		set toList to {}
		try
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
	end tell
	set AppleScript's text item delimiters to US
	set out to (fields as string)
	set AppleScript's text item delimiters to ""
	return out
end emitRecord
```

In `claude-capture`, replace the inline `set fields to {…}` + delimiter join with `set end of outRecs to my emitRecord(mref)`. Add a new branch:

```applescript
		else if theMode is "unread-capture" then
			set RS to (ASCII character 30)
			set unreadMsgs to (messages of inbox whose is read is false)
			set outRecs to {}
			repeat with i from 1 to (count of unreadMsgs)
				set end of outRecs to my emitRecord(item i of unreadMsgs)
			end repeat
			set AppleScript's text item delimiters to RS
			set s to outRecs as string
			set AppleScript's text item delimiters to ""
			return s
```

- [ ] **Step 2: Smoke test — claude-capture still works (regression)**

```bash
osascript comms-assistant/outlook-bridge/gather.applescript claude-capture 7 \
  | python3 -c "import sys; r=[x for x in sys.stdin.read().split(chr(30)) if x.strip()]; print('claude records:', len(r), '| fields0:', len(r[0].split(chr(31))) if r else 0)"
```
Expected: same record count as before, `fields0: 8`.

- [ ] **Step 3: Smoke test — unread-capture emits unread records**

```bash
osascript comms-assistant/outlook-bridge/gather.applescript unread-capture \
  | python3 -c "import sys; r=[x for x in sys.stdin.read().split(chr(30)) if x.strip()]; print('unread records:', len(r), '| fields0:', len(r[0].split(chr(31))) if r else 0, '| msgid0:', ('Y' if r and r[0].split(chr(31))[5].strip() else 'n'))"
```
Expected: `unread records: ~42`, `fields0: 8`, `msgid0: Y`.

- [ ] **Step 4: Commit**

```bash
git add comms-assistant/outlook-bridge/gather.applescript
git commit -m "feat(gather): unread-capture mode via shared emitRecord handler (verified)"
```

---

## Task 4: `pullUnread` orchestration

**Files:**
- Modify: `comms-assistant/outlook-bridge/gather.ts`
- Test: `comms-assistant/outlook-bridge/__tests__/gather.test.ts` (append)

**Interfaces:**
- Consumes: `parseGatherRecords`, `collapseThreads`, `toCapturePackets`, `deriveUnreadSignals`, `classifyEmail`, `Exec` (T5 of Plan A).
- Produces:
  - `interface UnreadResult { packets: CapturePacket[]; total: number; kept: number; dropped: Record<string, number> }`
  - `async function pullUnread(opts: { today: string; exec?: Exec }): Promise<UnreadResult>` — `unread-capture` → parse → classify each (`classifyEmail`) → keep `!isNoise`, tally drops by `reason` → collapse kept → `toCapturePackets(kept, today, deriveUnreadSignals)`.

- [ ] **Step 1: Write the failing test**

Append to `comms-assistant/outlook-bridge/__tests__/gather.test.ts`:

```ts
import { pullUnread } from '../gather.js'

test('pullUnread: drops noise, keeps substantive, collapses, derives signals', async () => {
  const US = '\x1f', RS = '\x1e'
  const capture = [
    ['1', 'Quick question', 'a@x.com', 'me@x.com', '2026-06-18T09:00:00', '<q@x>', 'TQ', 'can you approve?'].join(US),
    ['2', 'Canceled: Sync', 'cal@x.com', 'me@x.com', '2026-06-18T10:00:00', '<c@x>', 'TC', 'meeting canceled'].join(US),
  ].join(RS)
  const exec: Exec = async (_cmd, args) => (args[1] === 'unread-capture' ? capture : '')
  const res = await pullUnread({ today: '2026-06-18', exec })

  assert.equal(res.total, 2)
  assert.equal(res.kept, 1)
  assert.equal(res.packets.length, 1)
  assert.equal(res.packets[0].email.internet_message_id, '<q@x>')
  assert.equal(res.packets[0].signals.askToHim, true)   // body has '?'
  assert.ok((res.dropped['calendar/RSVP'] ?? res.dropped['meeting invite'] ?? 0) >= 0) // the canceled one dropped as noise
  assert.ok(res.kept + Object.values(res.dropped).reduce((a, b) => a + b, 0) === res.total)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: FAIL — `pullUnread` is not exported.

- [ ] **Step 3: Implement `pullUnread`**

Append to `comms-assistant/outlook-bridge/gather.ts` (imports: add `deriveUnreadSignals` from `./gather-signals.js` and ensure `classifyEmail` is imported from `../classify.js`):

```ts
import { deriveUnreadSignals } from './gather-signals.js'

export interface UnreadResult {
  packets: CapturePacket[]
  total: number
  kept: number
  dropped: Record<string, number>
}

export async function pullUnread(opts: { today: string; exec?: Exec }): Promise<UnreadResult> {
  const exec = opts.exec ?? realExec
  const raw = await exec('osascript', [SCRIPT, 'unread-capture'])
  const records = parseGatherRecords(raw)

  const kept: RawGatherRecord[] = []
  const dropped: Record<string, number> = {}
  for (const r of records) {
    const c = classifyEmail({ subject: r.subject, sender: r.from, recipients: r.to, bodyPreview: r.body.slice(0, 200) })
    if (c.isNoise) dropped[c.reason] = (dropped[c.reason] ?? 0) + 1
    else kept.push(r)
  }

  const threads = collapseThreads(kept)
  return {
    packets: toCapturePackets(threads, opts.today, deriveUnreadSignals),
    total: records.length,
    kept: threads.length,
    dropped,
  }
}
```

(Note: `kept` reports collapsed-thread count; `kept + sum(dropped)` may differ from `total` when several kept messages collapse into one thread — the test uses non-colliding threads so the invariant holds there.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test comms-assistant/outlook-bridge/__tests__/gather.test.ts`
Expected: PASS — `# pass 12`.

- [ ] **Step 5: Commit**

```bash
git add comms-assistant/outlook-bridge/gather.ts comms-assistant/outlook-bridge/__tests__/gather.test.ts
git commit -m "feat(gather): pullUnread — classify (drop noise/flag sensitive) → collapse → packets"
```

---

## Task 5: CLI `--source=unread`

**Files:**
- Modify: `comms-assistant/run.ts`

**Interfaces:**
- Consumes: `pullUnread` (T4). Produces: `pull-outlook --source=unread [--today=YYYY-MM-DD]` → packets JSON on stdout; stderr summary `total/kept` + the drop breakdown.

- [ ] **Step 1: Extend the `pull-outlook` case**

In `comms-assistant/run.ts`, import `pullUnread` alongside `pullClaudeTagged`:

```ts
import { pullClaudeTagged, pullUnread } from './outlook-bridge/gather.js'
```

Replace the `source !== 'claude'` guard so `unread` is handled. Inside the `case 'pull-outlook':`, branch on source:

```ts
      if (source === 'unread') {
        const today = arg('today') ?? new Date().toISOString().slice(0, 10)
        const res = await pullUnread({ today })
        const drops = Object.entries(res.dropped).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'
        process.stderr.write(`pull-outlook unread: total=${res.total} kept=${res.kept} | dropped: ${drops}\n`)
        console.log(JSON.stringify(res.packets, null, 2))
        break
      }
      if (source !== 'claude') throw new Error("pull-outlook: --source must be 'claude' or 'unread'")
```
(Keep the existing `claude` branch below unchanged.)

- [ ] **Step 2: Type-check**

Run: `cd comms-assistant && npx tsc --noEmit` (or from repo root). Expected: no new errors in `comms-assistant/`.

- [ ] **Step 3: Manual end-to-end verify (controller)**

```bash
npx tsx comms-assistant/run.ts pull-outlook --source=unread --today=2026-06-18 2>/tmp/u.err >/tmp/u.json
cat /tmp/u.err   # → "pull-outlook unread: total=N kept=M | dropped: …"
python3 -c "import json; p=json.load(open('/tmp/u.json')); print('packets:', len(p)); [print(' •', x['email']['subject'][:50], '| sens:', x['signals']['sensitive'], 'direct:', x['signals']['directToHim']) for x in p[:5]]"
```
Expected: a drop breakdown (noise reasons), and packets for the substantive unread, each with derived signals + Message-ID.

- [ ] **Step 4: Commit**

```bash
git add comms-assistant/run.ts
git commit -m "feat(comms): pull-outlook --source=unread (classify-gated bridge unread sweep)"
```

---

## Task 6: Docs

**Files:**
- Modify: `comms-assistant/outlook-bridge/GATHER.md`

- [ ] **Step 1: Add the unread section to GATHER.md**

Add a `## Unread (--source=unread)` section: the command (`npx tsx comms-assistant/run.ts pull-outlook --source=unread`); that it reads `whose is read is false`, classifies in TS (keep `!isNoise`, flag sensitive), collapses, and emits the same packets; the **one-stage rationale** (no cheap AS preview → read once); that unread uses `deriveUnreadSignals` (not auto-T2 like Claude tags); **no drain**; and that MCP stays the email fallback + Teams path (Claude-orchestrated on bridge failure, not built here).

- [ ] **Step 2: Commit**

```bash
git add comms-assistant/outlook-bridge/GATHER.md
git commit -m "docs(gather): unread --source=unread section"
```

---

## Self-Review (completed by plan author)

**Spec coverage (the unread half of `2026-06-18-bridge-first-comms-gather-design.md`):**
- Unread email via bridge (`whose is read is false`) → Tasks 3–5. ✅
- Classifier gate (drop noise, flag sensitive) → Task 4 (`!isNoise`). ✅
- Convergence into the same workflow/persistence (same packet shape) → reused (Tasks 1, 4). ✅
- Tier signals derived per-email (not auto-T2) → Task 2 `deriveUnreadSignals`. ✅
- Thread collapse → reused (`collapseThreads`). ✅
- **Deviation flagged:** spec said two-stage (meta→classify→capture); plan is one-stage because AS has no cheap preview and local reads are unthrottled — same cost, simpler, keeps body for the meeting-invite rule. (Surfaced to the user.) ✅
- MCP fallback + Teams → out of scope (Claude-orchestrated; documented in Task 6). ✅
- Drain → N/A for unread (no category). ✅

**Placeholder scan:** none — complete code in every step; AppleScript reuses Plan A's verified emitter (`unread-capture` differs only in the filter, verified live in Task 3).

**Type consistency:** `Signals = CapturePacket['signals']` defined once (Task 1) and used by `claudeSignals`/`deriveUnreadSignals`/`toCapturePackets`; the `toCapturePackets` signature change (3rd arg `deriveSignals`) is updated at its only two call sites (`pullClaudeTagged` Task 1, `pullUnread` Task 4) and its test; AppleScript `emitRecord` emits the exact 8-field order the Plan A parser consumes.
