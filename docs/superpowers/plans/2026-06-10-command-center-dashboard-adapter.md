# Command Center — Dashboard Adapter + Attention-Ordered Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the markdown-dump dashboard with the Claude Design attention-ordered template, fed by a single adapter that parses the agents' markdown outputs into the typed `Dashboard` object.

**Architecture:** A pure, unit-tested adapter (`dashboard-data.ts`) parses `01-focus.md` (+ later `02-captures.md` / `03-summary.md`) into a `Dashboard` object. `build-dashboard.ts` reads the daily files, calls the adapter, and injects `JSON.stringify(dashboard)` into the adapted Command Center template. No DB access (Skill A already baked the DB data into `01-focus.md`). Skill A gains a `## My Open Tasks` section so the tasks zone fills.

**Tech Stack:** TypeScript via `tsx`; `node:test` + `node:assert/strict`; `@supabase/supabase-js` (Skill A only). Template is self-contained offline HTML (the design file). No new deps.

**Spec:** [docs/superpowers/specs/2026-06-07-command-center-dashboard-adapter-design.md](../specs/2026-06-07-command-center-dashboard-adapter-design.md)
**Design reference:** `scripts/command-center/design-ref/command-center.design.html` (the contract is in its `<head>`; render bootstrap at lines 849–927; demo data block at lines 483–630).

**Phasing:** P1 = Tasks 1–3 (DB zones + new template → working dashboard). P2 = Task 4 (capture zones). P3 = Task 5 (end-of-day). Task 6 manual.

---

## File Structure

**Created:**
- `scripts/command-center/dashboard-data.ts` — the adapter (types + pure parsers + `assembleDashboard`).
- `scripts/command-center/__tests__/dashboard-data.test.ts` — parser unit tests (markdown fixtures, no DB/fs).

**Modified:**
- `scripts/command-center/build-dashboard.ts` — call the adapter + inject into the new template (drops the old markdown-into-cards renderer; keeps `writeDashboard` + `todayIso` exports that `capture.ts`/`gather-context.ts` import).
- `scripts/command-center/__tests__/build-dashboard.test.ts` — remove the now-obsolete `renderDashboard`/`orderCapturesNewestFirst` tests (those subjects moved to the adapter).
- `scripts/command-center/assets/dashboard.template.html` — replace with the adapted design template.
- `scripts/command-center/gather-context.ts` — add the `## My Open Tasks` section.

---

## Task 1: Adapter — `01-focus.md` parsers + assemble (P1)

Pure parsers, unit-tested with fixtures. Capture/EOD zones return empty (filled in P2/P3).

**Files:**
- Create: `scripts/command-center/dashboard-data.ts`
- Create: `scripts/command-center/__tests__/dashboard-data.test.ts`

- [ ] **Step 1: Create `scripts/command-center/dashboard-data.ts` with EXACTLY this content**

```typescript
// Adapter: parse the agents' markdown outputs into the typed Dashboard object.
// Pure (no fs, no DB). build-dashboard.ts feeds it file contents.

export interface DashFocus { priorities: string[]; watching: string[]; waitingOn: { item: string; who: string }[] }
export interface DashInitiative { id: string; name: string; status: 'on_track' | 'at_risk' | 'blocked' | 'done'; priority: string; owner: string; note?: string }
export interface DashPerson { name: string; relation: 'manager' | 'report' | 'stakeholder'; team?: string; initiatives?: string[] }
export interface DashTask { id: string; title: string; priority: string; due?: string; initiative?: string }
export interface DashNeed { id: string; kind: string; severity: 'critical' | 'high' | 'medium'; title: string; detail?: string; person?: { name: string; relation: string }; initiative?: string; source: string; at: string; due?: string; action?: string }
export interface DashSignal { id: string; at: string; source: string; text: string; person?: string; initiative?: string; urgent?: boolean }
export interface DashMeeting { id: string; start: string; end: string; title: string; with?: string[]; status: string; note?: string }
export interface DashEOD { summary: string; highlights: string[]; proposedFollowups: { title: string; priority: string }[] }
export interface Dashboard {
  meta: { user: { name: string; role: string; org: string }; generatedAt: string; partOfDay: 'morning' | 'midday' | 'evening'; asof: string }
  needsAttention: DashNeed[]; signals: DashSignal[]; meetings: DashMeeting[]
  tasks: DashTask[]; initiatives: DashInitiative[]; focus: DashFocus; people: DashPerson[]
  endOfDay: DashEOD | null
}

const USER = { name: 'Yonatan Orpeli', role: 'VP Product', org: 'Customer Lifecycle Management' }

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

/** Body lines of a `## <heading>` section (trimmed), or '' if absent. */
export function sectionBody(md: string, heading: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${esc}\\s*$`, 'i').test(l))
  if (start === -1) return ''
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) { if (/^##\s/.test(lines[i])) break; out.push(lines[i]) }
  return out.join('\n').trim()
}

export function parseFocus(focusMd: string): DashFocus {
  const body = sectionBody(focusMd, 'Current Focus')
  try {
    const obj = JSON.parse(body) as Record<string, unknown>
    const waiting = Array.isArray(obj.waiting_on) ? obj.waiting_on : []
    return {
      priorities: Array.isArray(obj.top_priorities) ? (obj.top_priorities as string[]) : [],
      watching: Array.isArray(obj.watching) ? (obj.watching as string[]) : [],
      waitingOn: waiting.map((w: any) => (typeof w === 'string' ? { item: w, who: '' } : { item: w.item ?? String(w), who: w.who ?? '' })),
    }
  } catch {
    return { priorities: [], watching: body ? [body] : [], waitingOn: [] }
  }
}

const STATUS_MAP: Record<string, DashInitiative['status']> = {
  active: 'on_track', blocked: 'blocked', completed: 'done', 'at-risk': 'at_risk', at_risk: 'at_risk',
}

export function parseInitiatives(focusMd: string): DashInitiative[] {
  const body = sectionBody(focusMd, 'Active Initiatives')
  const out: DashInitiative[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s+\((P\d|—)\)\s+—\s+(.+?)\s+·\s+owner:\s+(.+)$/)
    if (!m) continue
    const name = m[1].trim()
    out.push({
      id: slugify(name), name,
      status: STATUS_MAP[m[3].trim().toLowerCase()] ?? 'on_track',
      priority: m[2] === '—' ? 'P2' : m[2], owner: m[4].trim(),
    })
  }
  return out
}

export function parsePeople(focusMd: string): DashPerson[] {
  const body = sectionBody(focusMd, 'People who matter today')
  const out: DashPerson[] = []
  const names = (s: string) => s.split(',').map((n) => n.trim()).filter(Boolean)
  for (const line of body.split('\n')) {
    let m = line.match(/^\*\*Leadership:\*\*\s+(.+)$/)
    if (m) { for (const n of names(m[1])) out.push({ name: n, relation: 'manager' }); continue }
    m = line.match(/^\*\*Direct reports:\*\*\s+(.+)$/)
    if (m) { for (const n of names(m[1])) out.push({ name: n, relation: 'report' }); continue }
    m = line.match(/^-\s+(.+?)\s+\((.+?)\s+·\s+(.+)\)$/) // - Name (role · Initiative)
    if (m) { out.push({ name: m[1].trim(), relation: 'stakeholder', initiatives: [m[3].trim()] }); continue }
  }
  return out
}

export function parseTasks(focusMd: string): DashTask[] {
  const body = sectionBody(focusMd, 'My Open Tasks')
  const out: DashTask[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+\[(P\d)\]\s+(.+)$/)
    if (!m) continue
    const segs = m[2].split(' · ')
    const title = segs[0].trim()
    let due: string | undefined
    let initiative: string | undefined
    for (const seg of segs.slice(1)) {
      const dm = seg.match(/^due\s+(\d{4}-\d{2}-\d{2})$/i)
      if (dm) { due = dm[1] } else { initiative = seg.trim() }
    }
    out.push({ id: slugify(title), title, priority: m[1], due, initiative })
  }
  return out
}

export function derivePartOfDay(hour: number, hasSummary: boolean): 'morning' | 'midday' | 'evening' {
  if (hasSummary) return 'evening'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'midday'
  return 'evening'
}

export interface AssembleInput { focusMd: string; capturesMd: string | null; summaryMd: string | null; generatedAt: string; hour: number; date: string }

export function assembleDashboard(inp: AssembleInput): Dashboard {
  const hasSummary = !!(inp.summaryMd && inp.summaryMd.trim())
  return {
    meta: { user: USER, generatedAt: inp.generatedAt, partOfDay: derivePartOfDay(inp.hour, hasSummary), asof: inp.generatedAt.slice(11, 16) },
    needsAttention: [], // P2 — parseCaptures
    signals: [],        // P2
    meetings: [],       // P2
    tasks: parseTasks(inp.focusMd),
    initiatives: parseInitiatives(inp.focusMd),
    focus: parseFocus(inp.focusMd),
    people: parsePeople(inp.focusMd),
    endOfDay: null,     // P3 — parseSummary
  }
}
```

- [ ] **Step 2: Create the test `scripts/command-center/__tests__/dashboard-data.test.ts` with EXACTLY this content**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseFocus, parseInitiatives, parsePeople, parseTasks, derivePartOfDay, assembleDashboard } from '../dashboard-data.js'

const FOCUS_MD = [
  '# Focus — 2026-06-10', '',
  '## Current Focus', '',
  JSON.stringify({ top_priorities: ['Ship rollout', 'Plan Q3'], watching: ['China gap'], waiting_on: ['SOC2 from Legal'] }, null, 2),
  '',
  '## Active Initiatives', '',
  '- **CLM Rollout War Room** (P0) — blocked · owner: team-lead',
  '- **KYC Vendor Optimization** (P1) — active · owner: vendor-pm',
  '',
  '## Open Action Items', '',
  '- some meeting item',
  '',
  '## My Open Tasks', '',
  '- [P1] Reply to Sivan · due 2026-06-11 · KYC Vendor Optimization',
  '- [P2] File AI Think Tank materials',
  '',
  '## People who matter today', '',
  '**Leadership:** Oren Ryngler, Yaron Zakai Or',
  '**Direct reports:** Elad Schnarch, Ira Martinenko',
  '**Active-initiative stakeholders:**',
  '- Daniel Grin (sponsor · CLM Rollout War Room)',
  '',
  '## Portfolio Headline', '',
  'the headline',
].join('\n')

describe('parseFocus', () => {
  it('JSON-parses current_focus into priorities/watching/waitingOn', () => {
    const f = parseFocus(FOCUS_MD)
    assert.deepEqual(f.priorities, ['Ship rollout', 'Plan Q3'])
    assert.deepEqual(f.watching, ['China gap'])
    assert.deepEqual(f.waitingOn, [{ item: 'SOC2 from Legal', who: '' }])
  })
})

describe('parseInitiatives', () => {
  it('parses lines + maps status (active→on_track, blocked→blocked)', () => {
    const i = parseInitiatives(FOCUS_MD)
    assert.equal(i.length, 2)
    assert.deepEqual({ name: i[0].name, status: i[0].status, priority: i[0].priority, owner: i[0].owner },
      { name: 'CLM Rollout War Room', status: 'blocked', priority: 'P0', owner: 'team-lead' })
    assert.equal(i[1].status, 'on_track')
  })
})

describe('parsePeople', () => {
  it('maps leadership→manager, directs→report, stakeholders→stakeholder', () => {
    const p = parsePeople(FOCUS_MD)
    assert.deepEqual(p.find((x) => x.name === 'Oren Ryngler')!.relation, 'manager')
    assert.deepEqual(p.find((x) => x.name === 'Elad Schnarch')!.relation, 'report')
    const stk = p.find((x) => x.name === 'Daniel Grin')!
    assert.equal(stk.relation, 'stakeholder')
    assert.deepEqual(stk.initiatives, ['CLM Rollout War Room'])
  })
})

describe('parseTasks', () => {
  it('parses [priority] title · due · initiative', () => {
    const t = parseTasks(FOCUS_MD)
    assert.equal(t.length, 2)
    assert.deepEqual({ title: t[0].title, priority: t[0].priority, due: t[0].due, initiative: t[0].initiative },
      { title: 'Reply to Sivan', priority: 'P1', due: '2026-06-11', initiative: 'KYC Vendor Optimization' })
    assert.equal(t[1].due, undefined)
  })
})

describe('derivePartOfDay', () => {
  it('summary→evening; else by hour', () => {
    assert.equal(derivePartOfDay(9, false), 'morning')
    assert.equal(derivePartOfDay(14, false), 'midday')
    assert.equal(derivePartOfDay(19, false), 'evening')
    assert.equal(derivePartOfDay(9, true), 'evening')
  })
})

describe('assembleDashboard', () => {
  it('fills DB zones, leaves capture/EOD empty, sets meta', () => {
    const d = assembleDashboard({ focusMd: FOCUS_MD, capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    assert.equal(d.meta.partOfDay, 'morning')
    assert.equal(d.meta.asof, '09:30')
    assert.equal(d.initiatives.length, 2)
    assert.equal(d.tasks.length, 2)
    assert.ok(d.focus.priorities.length === 2)
    assert.deepEqual(d.needsAttention, [])
    assert.equal(d.endOfDay, null)
  })
  it('degrades gracefully on empty focus', () => {
    const d = assembleDashboard({ focusMd: '', capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    assert.deepEqual(d.initiatives, [])
    assert.deepEqual(d.focus, { priorities: [], watching: [], waitingOn: [] })
  })
})
```

- [ ] **Step 3: Run the tests — expect PASS**

Run: `node --import tsx --test scripts/command-center/__tests__/dashboard-data.test.ts`
Expected: `# pass 7`, `# fail 0`.

- [ ] **Step 4: Commit**

```bash
git add scripts/command-center/dashboard-data.ts scripts/command-center/__tests__/dashboard-data.test.ts
git commit -m "feat(command-center): dashboard adapter — 01-focus parsers + assemble (P1)"
```

---

## Task 2: Skill A — `## My Open Tasks` section

Adds a section to `01-focus.md` from the `tasks` table (owner = Yonatan, status ≠ done) so the adapter can fill the tasks zone. Format the adapter expects: `- [P1] <title> · due <YYYY-MM-DD> · <initiative title>` (due + initiative optional).

**Files:**
- Modify: `scripts/command-center/gather-context.ts`

- [ ] **Step 1: Add a `buildMyTasks` helper inside `gather-context.ts`** (above `buildFocusDoc`)

```typescript
interface TaskRow { title: string; priority: string | null; due_date: string | null; initiative_id: string | null }

const PRIO_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

async function buildMyTasks(supabase: ReturnType<typeof getSupabase>): Promise<string> {
  const { data: yon, error: ye } = await supabase.from('people' as any).select('id').eq('slug', 'yonatan-orpeli').maybeSingle()
  if (ye) throw ye
  if (!yon) return ''
  const { data: rows, error } = await supabase
    .from('tasks' as any).select('title, priority, due_date, initiative_id')
    .eq('owner_id', (yon as any).id).neq('status', 'done')
  if (error) throw error
  const tasks = (rows as unknown as TaskRow[]) ?? []
  if (!tasks.length) return ''
  // resolve initiative titles
  const initIds = [...new Set(tasks.map((t) => t.initiative_id).filter(Boolean))] as string[]
  const titleById = new Map<string, string>()
  if (initIds.length) {
    const { data: inits } = await supabase.from('initiatives' as any).select('id, title').in('id', initIds)
    for (const i of (inits as unknown as { id: string; title: string }[]) ?? []) titleById.set(i.id, i.title)
  }
  return tasks
    .sort((a, b) => (PRIO_ORDER[a.priority ?? 'P3'] ?? 9) - (PRIO_ORDER[b.priority ?? 'P3'] ?? 9) || (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .map((t) => {
      const segs = [`[${t.priority ?? 'P2'}] ${t.title}`]
      if (t.due_date) segs.push(`due ${t.due_date}`)
      if (t.initiative_id && titleById.has(t.initiative_id)) segs.push(titleById.get(t.initiative_id)!)
      return `- ${segs.join(' · ')}`
    })
    .join('\n')
}
```

- [ ] **Step 2: Call it in `buildFocusDoc` and add the section** (after the `whoMatters` line / before `return [`)

```typescript
  // 6. my open follow-up tasks (tasks table → dashboard tasks zone)
  const myTasks = await buildMyTasks(supabase)
```

Then add `section('My Open Tasks', myTasks)` to the return array, AFTER `Open Action Items` and BEFORE `People who matter today`:

```typescript
  return [
    `# Focus — ${date}`,
    '',
    section('Current Focus', currentFocus),
    section('Active Initiatives', initiativesBody),
    section('Open Action Items', actionItems),
    section('My Open Tasks', myTasks),
    section('People who matter today', whoMatters),
    section('Portfolio Headline', headline),
  ].join('\n')
```

- [ ] **Step 3: Run live + verify**

Run: `npm run command-center:gather -- --date=2026-06-10`
Expected: `focus written:` + `dashboard written:`, no error.

Run: `sed -n '/## My Open Tasks/,/## People who matter today/p' command-center/daily/2026-06-10/01-focus.md`
Expected: `- [P1] …` / `- [P2] …` lines from the open tasks (the 6/5 batch — AI Think Tank etc. — should appear since they're not done; the 3 we marked done won't).

- [ ] **Step 4: Commit**

```bash
git add scripts/command-center/gather-context.ts
git commit -m "feat(command-center): Skill A emits 'My Open Tasks' from the tasks table"
```

---

## Task 3: Adapt the template + rewire build-dashboard (P1 → working dashboard)

**Files:**
- Modify: `scripts/command-center/assets/dashboard.template.html` (replace with adapted design)
- Modify: `scripts/command-center/build-dashboard.ts`
- Modify: `scripts/command-center/__tests__/build-dashboard.test.ts`

- [ ] **Step 1: Replace the template with the design file**

```bash
cp scripts/command-center/design-ref/command-center.design.html scripts/command-center/assets/dashboard.template.html
```

- [ ] **Step 2: In `assets/dashboard.template.html`, replace the demo data block (the lines from `const INITIATIVES = [` through `const NOW = { morning:...};`) with the injection point**

Delete everything from the line beginning `const INITIATIVES = [` down to and including the line beginning `const NOW = { morning:` (this removes `INITIATIVES`, `PEOPLE`, `TASKS`, `FOCUS`, `MEETINGS`, `NEEDS_FULL`, `SIGNALS_FULL`, `EOD`, `SNAPSHOTS`, the `for(const k in SNAPSHOTS)` loop, and the per-state `NOW`). Replace that whole span with:

```javascript
const DATA = {{DATA_JSON}};
const INITIATIVES = DATA.initiatives;   // initName() looks these up
const NOW = "{{GENERATED_AT}}";
```

- [ ] **Step 3: Rewire `render()` to use the single DATA (edit the exact lines)**

Replace:
```javascript
  const d=SNAPSHOTS[state]; const nowIso=NOW[state];
  const GREET={morning:"Good morning",midday:"Good afternoon",evening:"Good evening"}[state];
```
with:
```javascript
  const d=DATA; const nowIso=NOW;
  const GREET={morning:"Good morning",midday:"Good afternoon",evening:"Good evening"}[d.meta.partOfDay] || "Hello";
```

Replace the footmeta line:
```javascript
  $("#footmeta").textContent=`${state} snapshot · ${d.meta.asof} · auto-refreshes every 10 min`;
```
with:
```javascript
  $("#footmeta").textContent=`${d.meta.partOfDay} · ${d.meta.asof} · auto-refreshes`;
```

Delete this line entirely (the demo state-switcher pressed-state):
```javascript
  document.querySelectorAll("#stateSeg button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.state===state)));
```

- [ ] **Step 4: Remove the remaining demo-state plumbing**

Delete these lines:
```javascript
let state = localStorage.getItem("cc_state") || "morning";
```
```javascript
if(!SNAPSHOTS[state]) state="morning";
```
```javascript
function setState(s){ state=s; localStorage.setItem("cc_state",s); render(); }
```
```javascript
document.querySelectorAll("#stateSeg button").forEach(b=>b.addEventListener("click",()=>setState(b.dataset.state)));
```
Keep `topLayout`, `arrange`, `setLayout`, `setArrange`, and the `#arrangeSeg` wiring.

- [ ] **Step 5: Remove the `#stateSeg` control from the body HTML**

Find the `<div class="seg" id="stateSeg" role="group" aria-label="Time of day"> … </div>` block (its three Morning/Midday/Evening buttons) and delete the whole `<div ... id="stateSeg" ...>…</div>` (and its immediately-preceding label span/wrapper if one only labels it). Leave the `#arrangeSeg` (Rail/Bands) control intact.

- [ ] **Step 6: Make the refresh interval a token**

Replace `<meta http-equiv="refresh" content="600" />` with `<meta http-equiv="refresh" content="{{REFRESH_SECONDS}}" />`.

- [ ] **Step 7: Rewrite `scripts/command-center/build-dashboard.ts` to assemble + inject** — replace the WHOLE file with:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assembleDashboard } from './dashboard-data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')
const DEFAULT_REFRESH_SECONDS = 600

export function todayIso(): string { return new Date().toISOString().slice(0, 10) }

function localStamp(): { generatedAt: string; hour: number } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const generatedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return { generatedAt, hour: now.getHours() }
}

/** Read the day's agent files, assemble the Dashboard, inject into the template,
 *  write dashboard.html. Returns the output path. Used by gather + capture. */
export function writeDashboard(date: string): string {
  const templatePath = join(CC, 'templates', 'dashboard.template.html')
  if (!existsSync(templatePath)) {
    throw new Error(`Dashboard template not found at ${templatePath}. Run: npm run command-center:scaffold`)
  }
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })
  const read = (f: string): string | null => (existsSync(join(dayDir, f)) ? readFileSync(join(dayDir, f), 'utf8') : null)
  const { generatedAt, hour } = localStamp()
  const dashboard = assembleDashboard({
    focusMd: read('01-focus.md') ?? '',
    capturesMd: read('02-captures.md'),
    summaryMd: read('03-summary.md'),
    generatedAt, hour, date,
  })
  const html = readFileSync(templatePath, 'utf8')
    .replace('{{DATA_JSON}}', JSON.stringify(dashboard))
    .replaceAll('{{GENERATED_AT}}', generatedAt)
    .replaceAll('{{REFRESH_SECONDS}}', String(DEFAULT_REFRESH_SECONDS))
  const outPath = join(dayDir, 'dashboard.html')
  writeFileSync(outPath, html, 'utf8')
  return outPath
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const out = writeDashboard(parseDateArg())
  console.log(`dashboard written: ${out}`)
}
```

- [ ] **Step 8: Replace the obsolete build-dashboard test**

The old `scripts/command-center/__tests__/build-dashboard.test.ts` tested `renderDashboard`/`orderCapturesNewestFirst`, which no longer exist. Replace the WHOLE file with a thin smoke test of the template-injection contract:

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assembleDashboard } from '../dashboard-data.js'

describe('dashboard injection contract', () => {
  it('assembleDashboard output is JSON-serializable and has the zones the template reads', () => {
    const d = assembleDashboard({ focusMd: '## Active Initiatives\n\n- **X** (P0) — active · owner: a', capturesMd: null, summaryMd: null, generatedAt: '2026-06-10T09:30', hour: 9, date: '2026-06-10' })
    const json = JSON.stringify(d)
    assert.ok(json.length > 0)
    for (const k of ['meta', 'needsAttention', 'signals', 'meetings', 'tasks', 'initiatives', 'focus', 'people', 'endOfDay']) {
      assert.ok(k in d, `missing zone: ${k}`)
    }
    assert.ok('partOfDay' in d.meta && 'user' in d.meta)
  })
})
```

- [ ] **Step 9: Validate — tests + a real render with NO leftover tokens**

Run: `node --import tsx --test scripts/command-center/__tests__/dashboard-data.test.ts scripts/command-center/__tests__/build-dashboard.test.ts`
Expected: all pass (`# fail 0`).

Run: `npm run command-center:scaffold` (copies the new template in — but it's copy-if-missing, so first delete the stale one): `rm -f command-center/templates/dashboard.template.html && npm run command-center:scaffold`
Then: `npm run command-center:gather -- --date=2026-06-10`
Expected: `dashboard written:` with no error.

Run: `grep -c "{{" command-center/daily/2026-06-10/dashboard.html`
Expected: `0` (no unsubstituted tokens).

Run: `grep -c "SNAPSHOTS\|stateSeg\|setState" command-center/daily/2026-06-10/dashboard.html`
Expected: `0` (demo plumbing fully removed).

Then open it: `open command-center/daily/2026-06-10/dashboard.html` — confirm: greeting + as-of; "Needs you now" shows "clear" (empty, quiet); Focus strip shows priorities/watching/waiting; "At risk" shows blocked initiatives; "Top open items" shows the tasks; Reference disclosure holds the full people/initiatives; Triage/Hero + Rail/Bands toggles work and persist.

- [ ] **Step 10: Commit**

```bash
git add scripts/command-center/assets/dashboard.template.html scripts/command-center/build-dashboard.ts scripts/command-center/__tests__/build-dashboard.test.ts
git commit -m "feat(command-center): attention-ordered dashboard template + adapter wiring (P1)"
```

---

## Task 4: P2 — capture zones (needsAttention / signals / meetings)

Parse `02-captures.md` blocks into the live zones. Heuristic but bounded; refine later.

**Files:**
- Modify: `scripts/command-center/dashboard-data.ts` (add `parseCaptures` + wire into `assembleDashboard`)
- Modify: `scripts/command-center/__tests__/dashboard-data.test.ts` (add capture tests)

- [ ] **Step 1: Add `parseCaptures` to `dashboard-data.ts`** (above `assembleDashboard`)

```typescript
const SRC_OF: Record<string, string> = { teams: 'teams', sharepoint: 'sharepoint', mail: 'email', 'mail/calendar': 'email', calendar: 'calendar' }

export interface CaptureZones { needsAttention: DashNeed[]; signals: DashSignal[]; meetings: DashMeeting[] }

/** Parse 02-captures.md into the live zones. `date` supplies the ISO day for `at`/`start`. */
export function parseCaptures(capturesMd: string | null, date: string): CaptureZones {
  const zones: CaptureZones = { needsAttention: [], signals: [], meetings: [] }
  if (!capturesMd) return zones
  const lines = capturesMd.replace(/\r\n/g, '\n').split('\n')
  let blockAt = `${date}T08:00`
  let label: string | null = null
  let nIdx = 0
  let sIdx = 0
  const labelOf = (raw: string): string | null => {
    const m = raw.match(/^\*\*(.+?):\*\*\s*(.*)$/)
    return m ? m[1].toLowerCase().replace(/[⚡\s]+/g, ' ').trim() : null
  }
  const pushNeed = (text: string) => {
    if (!text.trim()) return
    zones.needsAttention.push({ id: `n${nIdx++}`, kind: 'escalation', severity: 'high', title: text.replace(/\*\*/g, '').trim(), source: 'teams', at: blockAt })
  }
  const pushSignal = (src: string, text: string) => {
    if (!text.trim()) return
    zones.signals.push({ id: `s${sIdx++}`, at: blockAt, source: src, text: text.replace(/\*\*/g, '').trim() })
  }
  const pushMeeting = (text: string) => {
    const m = text.match(/(\d{1,2}:\d{2})\s+(.+)/)
    if (!m) return
    const start = `${date}T${m[1].padStart(5, '0')}`
    zones.meetings.push({ id: `mt${zones.meetings.length}`, start, end: start, title: m[2].trim(), status: 'confirmed' })
  }

  for (const raw of lines) {
    const bm = raw.match(/^##\s+(\d{1,2}:\d{2})\b/)
    if (bm) { blockAt = `${date}T${bm[1].padStart(5, '0')}`; label = null; continue }
    const lbl = labelOf(raw)
    if (lbl !== null) {
      label = lbl
      const m = raw.match(/^\*\*.+?:\*\*\s*(.*)$/)
      const inline = m ? m[1].trim() : ''
      if (inline) routeLine(label, inline)
      continue
    }
    const bullet = raw.match(/^\s*-\s+(.*)$/)
    if (bullet && label) routeLine(label, bullet[1])
  }

  function routeLine(lbl: string, text: string) {
    if (/needs attention/.test(lbl)) pushNeed(text)
    else if (/coming up/.test(lbl)) pushMeeting(text)
    else if (/^teams/.test(lbl)) pushSignal('teams', text)
    else if (/^sharepoint/.test(lbl)) pushSignal('sharepoint', text)
    else if (/^mail/.test(lbl)) pushSignal('email', text)
    else if (/^calendar/.test(lbl)) pushSignal('calendar', text)
  }

  zones.signals.sort((a, b) => (a.at < b.at ? 1 : -1)) // newest first
  return zones
}
```

- [ ] **Step 2: Wire it into `assembleDashboard`** — replace the three `// P2` empty arrays:

```typescript
  const cap = parseCaptures(inp.capturesMd, inp.date)
```
and in the returned object set `needsAttention: cap.needsAttention, signals: cap.signals, meetings: cap.meetings,`.

- [ ] **Step 3: Add capture tests to `dashboard-data.test.ts`**

```typescript
describe('parseCaptures', () => {
  const CAP = [
    '# Captures — 2026-06-10', '',
    '## 14:20 — sweep',
    '**⚡ Needs attention:**',
    '- VIP email from Yaron re: planning',
    '**Teams:**',
    '- Yaron ↔ Yonatan: planning this week',
    '**SharePoint:**',
    '- Deck updated',
    '**Coming up today:**',
    '- 16:00 Roadmap review',
  ].join('\n')
  it('routes labels to needs/signals/meetings with ISO at/start', async () => {
    const { parseCaptures } = await import('../dashboard-data.js')
    const z = parseCaptures(CAP, '2026-06-10')
    assert.equal(z.needsAttention.length, 1)
    assert.match(z.needsAttention[0].title, /VIP email from Yaron/)
    assert.equal(z.needsAttention[0].at, '2026-06-10T14:20')
    assert.equal(z.signals.filter((s) => s.source === 'teams').length, 1)
    assert.equal(z.signals.filter((s) => s.source === 'sharepoint').length, 1)
    assert.equal(z.meetings.length, 1)
    assert.equal(z.meetings[0].start, '2026-06-10T16:00')
  })
  it('empty/absent captures → empty zones', async () => {
    const { parseCaptures } = await import('../dashboard-data.js')
    const z = parseCaptures(null, '2026-06-10')
    assert.deepEqual(z, { needsAttention: [], signals: [], meetings: [] })
  })
})
```

- [ ] **Step 4: Run tests + re-render against the real 6/5 captures**

Run: `node --import tsx --test scripts/command-center/__tests__/dashboard-data.test.ts`
Expected: `# fail 0`.

Run: `npm run command-center:dashboard -- --date=2026-06-05` (6/5 has real captures)
Then `grep -c "needsAttention\|signals" command-center/daily/2026-06-05/dashboard.html` → non-zero, and open it to confirm signals + needs render in the live zones.

- [ ] **Step 5: Commit**

```bash
git add scripts/command-center/dashboard-data.ts scripts/command-center/__tests__/dashboard-data.test.ts
git commit -m "feat(command-center): adapter P2 — parse captures into needs/signals/meetings"
```

---

## Task 5: P3 — end-of-day zone

Parse `03-summary.md` into `endOfDay` (renders only in the evening view).

**Files:**
- Modify: `scripts/command-center/dashboard-data.ts` (add `parseSummary` + wire)
- Modify: `scripts/command-center/__tests__/dashboard-data.test.ts`

- [ ] **Step 1: Add `parseSummary` to `dashboard-data.ts`**

```typescript
export function parseSummary(summaryMd: string | null): DashEOD | null {
  if (!summaryMd || !summaryMd.trim()) return null
  const summary = sectionBody(summaryMd, 'Narrative').split('\n\n')[0]?.trim() || sectionBody(summaryMd, 'Narrative').trim()
  // highlights: the "People noted" names + any "closed" lines; fall back to first follow-up items
  const highlights: string[] = []
  for (const line of sectionBody(summaryMd, 'People noted').split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*/)
    if (m) highlights.push(m[1].trim())
  }
  // proposed follow-ups: parse the Follow-ups table rows → title + a default priority
  const proposedFollowups: { title: string; priority: string }[] = []
  let inTable = false
  for (const raw of summaryMd.replace(/\r\n/g, '\n').split('\n')) {
    const l = raw.trim()
    if (!l.startsWith('|')) { inTable = false; continue }
    const cells = l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (cells[0] === '#' && /item/i.test(cells[1] || '')) { inTable = true; continue }
    if (/^[-:\s]+$/.test(cells[0] || '')) continue
    if (inTable && cells.length >= 2 && cells[1]) proposedFollowups.push({ title: cells[1], priority: 'P2' })
  }
  return { summary, highlights, proposedFollowups }
}
```

- [ ] **Step 2: Wire into `assembleDashboard`** — replace `endOfDay: null,` with:

```typescript
    endOfDay: parseSummary(inp.summaryMd),
```

- [ ] **Step 3: Add a test**

```typescript
describe('parseSummary', () => {
  const SUM = [
    '# Day Summary — 2026-06-05', '',
    '## Narrative', '', 'A short day. Planning must move.', '',
    '## Follow-ups',
    '| # | Item | Person | Destination |',
    '|---|------|--------|-------------|',
    '| 1 | Reply to Sivan | Sivan | → vendor memory |',
    '',
    '## People noted',
    '- **Ofer Koifman** — VP Demand Gen',
  ].join('\n')
  it('parses summary, highlights, follow-ups', async () => {
    const { parseSummary } = await import('../dashboard-data.js')
    const e = parseSummary(SUM)!
    assert.match(e.summary, /Planning must move/)
    assert.deepEqual(e.highlights, ['Ofer Koifman'])
    assert.equal(e.proposedFollowups.length, 1)
    assert.equal(e.proposedFollowups[0].title, 'Reply to Sivan')
  })
  it('absent summary → null', async () => {
    const { parseSummary } = await import('../dashboard-data.js')
    assert.equal(parseSummary(null), null)
  })
})
```

- [ ] **Step 4: Run tests + render the 6/5 evening view**

Run: `node --import tsx --test scripts/command-center/__tests__/dashboard-data.test.ts`
Expected: `# fail 0`.

Run: `npm run command-center:dashboard -- --date=2026-06-05` then open it — because 6/5 has a `03-summary.md`, `partOfDay` is `evening` and the EOD recap renders at the top.

- [ ] **Step 5: Commit**

```bash
git add scripts/command-center/dashboard-data.ts scripts/command-center/__tests__/dashboard-data.test.ts
git commit -m "feat(command-center): adapter P3 — parse summary into end-of-day zone"
```

---

## Task 6: Live integration pass (MANUAL — not a coded task)

Not for a subagent. Yonatan:
1. "gather context" for today → confirm the new dashboard renders the DB zones (focus strip near top, at-risk-only initiatives, top open tasks, reference disclosure).
2. Run `capture` in the MSFT session → confirm needs/signals/meetings populate the live zones, newest-first.
3. End of day "close out the day" → confirm the EOD recap appears.
4. Try the Triage/Hero + Rail/Bands toggles; confirm they persist across refresh.
Report rough edges to tune the parsers / the markdown formats.

---

## Self-Review

**Spec coverage:**
- Adapter parses agent markdown → Dashboard, DB-free → Tasks 1, 4, 5 (pure) + Task 3 (build-dashboard wiring).
- Zone→source mapping (focus/initiatives/people/tasks from 01-focus; needs/signals/meetings from 02; endOfDay from 03) → Tasks 1, 4, 5 per the spec table.
- `## My Open Tasks` in Skill A → Task 2.
- Template adaptation (single injected DATA, drop demo switcher, keep Triage/Hero + Rail/Bands, refresh token) → Task 3 Steps 1–6.
- `partOfDay` derivation (summary→evening else by hour); at_risk = blocked-only (status map) → Task 1.
- Phasing P1/P2/P3 → Tasks 1–3 / 4 / 5.
- Graceful empty states → Task 1 (assemble degrades) + Task 3 validation (Needs "clear").
- Live integration → Task 6.

**Placeholder scan:** No TBD/"handle edge cases"/"similar to". Code steps carry full code; run steps have exact commands + expected output. Template edits give exact old→new snippets + precise deletion boundaries (lines 483–630, the `#stateSeg` block) grounded in the read design file.

**Type consistency:** `Dashboard` + zone interfaces defined in Task 1, consumed by `assembleDashboard` (Tasks 1/4/5) and `build-dashboard.ts` (Task 3, imports `assembleDashboard`). `writeDashboard`/`todayIso` kept as exports (capture.ts + gather-context.ts depend on them). Template tokens `{{DATA_JSON}}` / `{{GENERATED_AT}}` / `{{REFRESH_SECONDS}}` match the `.replace`/`.replaceAll` in `writeDashboard`. `parseCaptures`/`parseSummary` signatures defined in Tasks 4/5 and wired in the same task.
