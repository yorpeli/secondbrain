# Command Center — Skill C (Reconcile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `command-center:reconcile` — a `plan → curate → confirm → apply` agent that pushes the day's Skill B output (`03-summary.md` follow-ups + `people.md` harvested) back into Supabase, resolving each candidate against existing state instead of blindly ingesting it.

**Architecture:** A deterministic resolver (pure, unit-tested: input parsers + exact-match people resolution with a false-positive guard + initiative resolution + tier assignment) wired into two CLI subcommands — `plan` (read inputs + live DB → emit a resolved `reconcile-plan.json`) and `apply` (idempotent writes; auto tier always, gated tier only with `--confirmed`). Claude curates the plan in between (Phase 2) — deriving memory/current_focus notes from the narrative and resolving anything flagged. Mirrors `initiative-tracker refresh-from-ppp`.

**Tech Stack:** TypeScript via `tsx`; `@supabase/supabase-js` via `lib/supabase.ts`; `node:test` + `node:assert/strict`. No new deps.

**Spec:** [docs/superpowers/specs/2026-06-06-command-center-skill-c-reconcile-design.md](../specs/2026-06-06-command-center-skill-c-reconcile-design.md)

**Out of scope (later):** scheduling; re-mining `02-captures.md`; a reconcile UI. Task 5 (live integration) is manual.

---

## File Structure

**Created:**
- `scripts/command-center/reconcile.ts` — types, pure resolver (parsers/matchers/tiers), and the `plan`/`apply` CLI.
- `scripts/command-center/__tests__/reconcile.test.ts` — resolver unit tests (no live DB).
- `.claude/skills/command-center-reconcile/SKILL.md` — thin local trigger (untracked).

**Modified:**
- `package.json` — add `"command-center:reconcile"`.
- `agents/command-center-capture.md` — richer close-the-day follow-up rows (the "B documents more context" tweak).
- `CLAUDE.md` — add a "reconcile the day" trigger row.

---

## Task 1: Resolver core — parsers, matchers, tiers (pure, unit-tested)

The "not blind" heart. All functions are pure (take data, return data) so they unit-test without a DB. The CLI (Task 2/3) calls them with live rows.

**Files:**
- Create: `scripts/command-center/reconcile.ts`
- Create: `scripts/command-center/__tests__/reconcile.test.ts`

- [ ] **Step 1: Create `scripts/command-center/reconcile.ts` with the types + pure resolver (CLI added in Task 2)**

```typescript
// ── Types ───────────────────────────────────────────────────────────────────
export interface HarvestedEntry { name: string; email: string | null; note: string; seen: string }
export interface FollowupRow { num: string; item: string; person: string; destination: string }
export interface PersonRow { id: string; slug: string; name: string; type: string; email: string | null }
export interface InitiativeRow { id: string; slug: string; title: string; status: string }

export type PersonMatch =
  | { status: 'new' }
  | { status: 'exists'; id: string }
  | { status: 'enrich'; id: string; fill: { email: string } }
  | { status: 'ambiguous'; ids: string[] }

export interface InitiativeResolution {
  id: string; slug: string; title: string; status: string
  matchedBy: 'slug' | 'title-exact' | 'title-contains'
}

export type DestinationKind = 'task' | 'memory' | 'current_focus' | 'skip'

const norm = (s: string): string => s.trim().toLowerCase()

// ── Input parsers ────────────────────────────────────────────────────────────

/** Parse the `## Harvested` section of people.md. Skips the template/comment
 *  lines and any entry already marked `✓ filed`. */
export function parseHarvested(md: string): HarvestedEntry[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((l) => /^##\s+Harvested/i.test(l))
  if (start === -1) return []
  const out: HarvestedEntry[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break
    const m = lines[i].match(/^-\s+(.*)$/)
    if (!m) continue
    const body = m[1].trim()
    if (body.startsWith('✓ filed')) continue
    const parts = body.split('|').map((p) => p.trim())
    const name = parts[0]
    if (!name || name.startsWith('<')) continue // template placeholder
    let email: string | null = null
    let note = ''
    let seen = ''
    for (const p of parts.slice(1)) {
      const em = p.match(/^email:\s*(.*)$/i)
      if (em) { const v = em[1].trim(); email = v && v !== '—' && v !== '-' ? v : null; continue }
      const sm = p.match(/^seen\s+(.*)$/i)
      if (sm) { seen = sm[1].trim(); continue }
      if (!note) note = p
    }
    out.push({ name, email, note, seen })
  }
  return out
}

/** Parse the Follow-ups table (header row: `# | Item | Person | Destination`). */
export function parseFollowups(md: string): FollowupRow[] {
  const out: FollowupRow[] = []
  let inTable = false
  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const l = raw.trim()
    if (!l.startsWith('|')) { inTable = false; continue }
    const cells = l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (norm(cells[0]) === '#' && /item/i.test(cells[1] || '')) { inTable = true; continue }
    if (/^[-:\s]+$/.test(cells[0] || '')) continue // separator row
    if (!inTable || cells.length < 4) continue
    out.push({ num: cells[0], item: cells[1], person: cells[2], destination: cells[3] })
  }
  return out
}

// ── Resolution ───────────────────────────────────────────────────────────────

function enrichOrExists(candEmail: string | null, p: PersonRow): PersonMatch {
  if (candEmail && !p.email) return { status: 'enrich', id: p.id, fill: { email: candEmail } }
  return { status: 'exists', id: p.id }
}

/** Match a harvested/noted person to a DB row by EXACT email → EXACT name.
 *  Never substring — substring matching produced false positives
 *  ("Ya Wen"→Yaron, "Elad Naama"→Elad Schnarch). */
export function matchPerson(cand: { name: string; email: string | null }, people: PersonRow[]): PersonMatch {
  if (cand.email) {
    const byEmail = people.filter((p) => p.email && norm(p.email) === norm(cand.email!))
    if (byEmail.length === 1) return enrichOrExists(cand.email, byEmail[0])
    if (byEmail.length > 1) return { status: 'ambiguous', ids: byEmail.map((p) => p.id) }
  }
  const byName = people.filter((p) => norm(p.name) === norm(cand.name))
  if (byName.length === 1) return enrichOrExists(cand.email, byName[0])
  if (byName.length > 1) return { status: 'ambiguous', ids: byName.map((p) => p.id) }
  return { status: 'new' }
}

/** Resolve an initiative reference (a slug or a title fragment from a
 *  destination hint) to a DB initiative. Returns null if unresolved (Claude
 *  decides in Phase 2). */
export function resolveInitiative(ref: string, inits: InitiativeRow[]): InitiativeResolution | null {
  const r = norm(ref)
  let m = inits.find((i) => norm(i.slug) === r)
  if (m) return { ...m, matchedBy: 'slug' }
  m = inits.find((i) => norm(i.title) === r)
  if (m) return { ...m, matchedBy: 'title-exact' }
  const contains = inits.filter((i) => r.includes(norm(i.title)))
  if (contains.length === 1) return { ...contains[0], matchedBy: 'title-contains' }
  return null
}

/** Coarse routing of a follow-up's destination hint. A DB-relevant target
 *  (current_focus / memory) wins over calendar/personal when both appear
 *  (e.g. "current_focus / calendar" → current_focus). Pure calendar/personal → skip. */
export function classifyDestination(dest: string): DestinationKind {
  const d = norm(dest)
  if (/current_focus|current focus/.test(d)) return 'current_focus'
  if (/memory/.test(d)) return 'memory'
  if (/calendar|personal/.test(d)) return 'skip'
  return 'task'
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

export function personTier(m: PersonMatch): 'auto' | 'gated' | 'skip' {
  if (m.status === 'enrich') return 'auto'
  if (m.status === 'exists') return 'skip'
  return 'gated' // new | ambiguous
}
```

- [ ] **Step 2: Create the test `scripts/command-center/__tests__/reconcile.test.ts` with EXACTLY this content**

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseHarvested, parseFollowups, matchPerson, resolveInitiative,
  classifyDestination, slugify, personTier,
  type PersonRow, type InitiativeRow,
} from '../reconcile.js'

const PEOPLE: PersonRow[] = [
  { id: 'p-yaron', slug: 'yaron-zakai-or', name: 'Yaron Zakai Or', type: 'leadership', email: null },
  { id: 'p-elad', slug: 'elad-schnarch', name: 'Elad Schnarch', type: 'direct-report', email: null },
  { id: 'p-ira', slug: 'ira-martinenko', name: 'Ira Martinenko', type: 'direct-report', email: 'ira@payoneer.com' },
]
const INITS: InitiativeRow[] = [
  { id: 'i-war', slug: 'clm-war-room', title: 'CLM Rollout War Room', status: 'active' },
  { id: 'i-vendor', slug: 'vendor-optimization', title: 'KYC Vendor Optimization', status: 'active' },
  { id: 'i-air', slug: 'air-squared', title: 'AIR² — Fast AI Disruption', status: 'blocked' },
]

describe('parseHarvested', () => {
  const md = [
    '## Harvested (from comms)',
    '<!-- comment -->',
    '- <name> | email: <x> | <note> | seen <date>',
    '- ✓ filed — Old Guy | email: old@x.com | note | seen 2026-06-01',
    '- Ya Wen | email: yawe@payoneer.com | BD/Partnerships | seen 2026-06-05',
    '- Elad Naama | email: — | GM GTM | seen 2026-06-05',
    '',
    '## Next',
    '- not me',
  ].join('\n')
  it('returns only real unfiled entries with parsed fields', () => {
    const r = parseHarvested(md)
    assert.equal(r.length, 2)
    assert.deepEqual(r[0], { name: 'Ya Wen', email: 'yawe@payoneer.com', note: 'BD/Partnerships', seen: '2026-06-05' })
    assert.equal(r[1].name, 'Elad Naama')
    assert.equal(r[1].email, null) // "—" → null
  })
})

describe('parseFollowups', () => {
  const md = [
    '## Follow-ups',
    '| # | Item | Person | Destination |',
    '|---|------|--------|-------------|',
    '| 1 | Reply to Sivan | Sivan Teplitz | → KYC Vendor Optimization initiative memory |',
    '| 2 | Confirm Monday meeting | Yaron Zakai Or | → current_focus / calendar |',
    '',
    'text after',
  ].join('\n')
  it('parses rows, ignoring header + separator', () => {
    const r = parseFollowups(md)
    assert.equal(r.length, 2)
    assert.equal(r[0].item, 'Reply to Sivan')
    assert.equal(r[1].person, 'Yaron Zakai Or')
  })
})

describe('matchPerson — false-positive guard', () => {
  it('does NOT substring-match: "Ya Wen" is new, not Yaron', () => {
    assert.deepEqual(matchPerson({ name: 'Ya Wen', email: 'yawe@payoneer.com' }, PEOPLE), { status: 'new' })
  })
  it('does NOT substring-match: "Elad Naama" is new, not Elad Schnarch', () => {
    assert.deepEqual(matchPerson({ name: 'Elad Naama', email: null }, PEOPLE), { status: 'new' })
  })
  it('exact email match → exists (email already populated, no overwrite)', () => {
    const r = matchPerson({ name: 'Whatever Name', email: 'ira@payoneer.com' }, PEOPLE)
    assert.deepEqual(r, { status: 'exists', id: 'p-ira' })
  })
  it('exact name match + DB email empty → enrich', () => {
    const r = matchPerson({ name: 'yaron zakai or', email: 'yaron@payoneer.com' }, PEOPLE)
    assert.deepEqual(r, { status: 'enrich', id: 'p-yaron', fill: { email: 'yaron@payoneer.com' } })
  })
  it('exact name match + DB email present → exists (no overwrite)', () => {
    const r = matchPerson({ name: 'Ira Martinenko', email: 'other@x.com' }, PEOPLE)
    assert.deepEqual(r, { status: 'exists', id: 'p-ira' })
  })
})

describe('resolveInitiative', () => {
  it('resolves a title fragment from a destination hint', () => {
    const r = resolveInitiative('KYC Vendor Optimization initiative memory', INITS)
    assert.equal(r?.slug, 'vendor-optimization')
    assert.equal(r?.matchedBy, 'title-contains')
  })
  it('resolves an exact slug', () => {
    assert.equal(resolveInitiative('clm-war-room', INITS)?.matchedBy, 'slug')
  })
  it('returns null for an unknown target (Claude decides)', () => {
    assert.equal(resolveInitiative('CLM Mobile Performance initiative memory', INITS), null)
  })
})

describe('classifyDestination', () => {
  it('routes calendar/personal to skip, memory/current_focus/task otherwise', () => {
    assert.equal(classifyDestination('→ current_focus / calendar'), 'current_focus')
    assert.equal(classifyDestination('→ calendar'), 'skip')
    assert.equal(classifyDestination('→ personal'), 'skip')
    assert.equal(classifyDestination('→ KYC Vendor Optimization initiative memory'), 'memory')
    assert.equal(classifyDestination('→ a task'), 'task')
  })
})

describe('tiers + slugify', () => {
  it('enrich→auto, new/ambiguous→gated, exists→skip', () => {
    assert.equal(personTier({ status: 'enrich', id: 'x', fill: { email: 'a@b.c' } }), 'auto')
    assert.equal(personTier({ status: 'new' }), 'gated')
    assert.equal(personTier({ status: 'exists', id: 'x' }), 'skip')
    assert.equal(personTier({ status: 'ambiguous', ids: ['a', 'b'] }), 'gated')
  })
  it('slugify makes a kebab slug', () => {
    assert.equal(slugify('Reply to Sivan (KYC)!'), 'reply-to-sivan-kyc')
  })
})
```

- [ ] **Step 3: Run the tests — expect PASS**

Run: `node --import tsx --test scripts/command-center/__tests__/reconcile.test.ts`
Expected: all pass — `# pass 13`, `# fail 0` (counts the `it` blocks above).

- [ ] **Step 4: Commit**

```bash
git add scripts/command-center/reconcile.ts scripts/command-center/__tests__/reconcile.test.ts
git commit -m "feat(command-center): Skill C resolver — parsers, person/initiative matching, tiers"
```

---

## Task 2: `reconcile plan` — wire resolver to live DB + inputs

Reads the day's inputs + live DB, runs the resolver, and emits `reconcile-plan.json` — a draft payload Claude will curate. No writes.

**Files:**
- Modify: `scripts/command-center/reconcile.ts` (append the `plan` command + DB plumbing + CLI)
- Modify: `package.json`

- [ ] **Step 1: Append the DB-backed `plan` builder + CLI to `scripts/command-center/reconcile.ts`**

Add these imports at the TOP of the file (above the existing `// ── Types ──` banner):

```typescript
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../../lib/supabase.js'
```

Append this to the END of the file:

```typescript
// ── Paths ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')

function todayIso(): string { return new Date().toISOString().slice(0, 10) }
function parseDateArg(): string {
  const a = process.argv.find((x) => x.startsWith('--date='))
  return a ? a.slice('--date='.length) : todayIso()
}

// ── Plan payload shape (draft → Claude curates → apply reads) ─────────────────
export interface PlanPerson {
  tier: 'auto' | 'gated'; action: 'create' | 'enrich'; status: PersonMatch['status']
  id?: string; slug: string; name: string; type: string; role: string; email: string | null
  relationship_notes: string
}
export interface PlanTask {
  tier: 'gated'; status: 'new' | 'exists'; slug: string; title: string; priority: string
  initiative_slug: string | null; initiative_status: string | null; owner_slug: string
}
export interface ReconcilePlan {
  date: string
  people: PlanPerson[]
  tasks: PlanTask[]
  followups_for_claude: Array<{ item: string; person: string; destination: string; kind: DestinationKind; resolved_initiative: string | null }>
  narrative: string
  memoryNotes: Array<{ tier: 'auto'; initiative_slug: string; note: string }>
  currentFocus: Array<{ tier: 'gated'; array: string; text: string }>
  harvestedFiled: string[]
}

function extractNarrative(summaryMd: string): string {
  const lines = summaryMd.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((l) => /^##\s+Narrative/i.test(l))
  if (start === -1) return ''
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break
    out.push(lines[i])
  }
  return out.join('\n').trim()
}

async function buildPlan(date: string): Promise<ReconcilePlan> {
  const s = getSupabase()
  const dayDir = join(CC, 'daily', date)
  const summaryPath = join(dayDir, '03-summary.md')
  const peoplePath = join(CC, 'context', 'people.md')
  if (!existsSync(summaryPath)) throw new Error(`No 03-summary.md for ${date} at ${summaryPath}`)
  const summaryMd = readFileSync(summaryPath, 'utf8')
  const peopleMd = existsSync(peoplePath) ? readFileSync(peoplePath, 'utf8') : ''

  const { data: peopleRows, error: pe } = await s.from('people' as any).select('id, slug, name, type, email').eq('status', 'active')
  if (pe) throw pe
  const people = (peopleRows as unknown as PersonRow[]) ?? []
  const { data: initRows, error: ie } = await s.from('initiatives' as any).select('id, slug, title, status')
  if (ie) throw ie
  const inits = (initRows as unknown as InitiativeRow[]) ?? []
  const ownerSlug = 'yonatan-orpeli'

  // People (from harvested)
  const harvested = parseHarvested(peopleMd)
  const planPeople: PlanPerson[] = []
  const harvestedFiled: string[] = []
  for (const h of harvested) {
    const m = matchPerson(h, people)
    const tier = personTier(m)
    if (tier === 'skip') { harvestedFiled.push(h.name); continue } // already in DB
    planPeople.push({
      tier: tier === 'auto' ? 'auto' : 'gated',
      action: m.status === 'enrich' ? 'enrich' : 'create',
      status: m.status,
      id: 'id' in m ? m.id : undefined,
      slug: slugify(h.name), name: h.name, type: 'internal', role: h.note.split('—')[0].trim() || 'unknown',
      email: h.email, relationship_notes: `Surfaced via comms [seen ${h.seen}]: ${h.note}`,
    })
    harvestedFiled.push(h.name)
  }

  // Follow-ups → tasks (and route the rest to Claude)
  const followups = parseFollowups(summaryMd)
  const planTasks: PlanTask[] = []
  const forClaude: ReconcilePlan['followups_for_claude'] = []
  for (const f of followups) {
    const kind = classifyDestination(f.destination)
    const initRef = f.destination.replace(/^[→\s]+/, '')
    const resolved = kind === 'memory' || kind === 'task' ? resolveInitiative(initRef, inits) : null
    if (kind === 'task') {
      const slug = slugify(f.item)
      const { data: existing } = await s.from('tasks' as any).select('id').eq('slug', slug).maybeSingle()
      planTasks.push({
        tier: 'gated', status: existing ? 'exists' : 'new', slug, title: f.item, priority: 'P2',
        initiative_slug: resolved?.slug ?? null, initiative_status: resolved?.status ?? null, owner_slug: ownerSlug,
      })
    } else {
      forClaude.push({ item: f.item, person: f.person, destination: f.destination, kind, resolved_initiative: resolved?.slug ?? null })
    }
  }

  return {
    date, people: planPeople, tasks: planTasks, followups_for_claude: forClaude,
    narrative: extractNarrative(summaryMd), memoryNotes: [], currentFocus: [], harvestedFiled,
  }
}

async function cmdPlan(date: string): Promise<void> {
  const plan = await buildPlan(date)
  const outPath = join(CC, 'daily', date, 'reconcile-plan.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf8')
  console.log(`plan written: ${outPath}`)
  console.log(`  people: ${plan.people.length} (${plan.people.filter((p) => p.tier === 'auto').length} auto / ${plan.people.filter((p) => p.tier === 'gated').length} gated)`)
  console.log(`  tasks: ${plan.tasks.length} (new: ${plan.tasks.filter((t) => t.status === 'new').length})`)
  console.log(`  follow-ups for Claude (memory/current_focus): ${plan.followups_for_claude.length}`)
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const sub = process.argv[2]
  const date = parseDateArg()
  if (sub === 'plan') {
    cmdPlan(date).catch((e) => { console.error(e); process.exit(1) })
  } else {
    console.error('usage: reconcile <plan|apply> --date=YYYY-MM-DD [--payload=<path>] [--confirmed]')
    process.exit(1)
  }
}
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add (valid JSON):

```json
"command-center:reconcile": "tsx scripts/command-center/reconcile.ts",
```

- [ ] **Step 3: Re-run the unit tests (importing the file must stay side-effect-free)**

Run: `node --import tsx --test scripts/command-center/__tests__/reconcile.test.ts`
Expected: still `# pass 13`, `# fail 0`. (The CLI is behind `invokedDirectly`, so importing the resolver does not run `plan`.)

- [ ] **Step 4: Validate `plan` against the 2026-06-05 day**

Run: `npm run command-center:reconcile -- plan --date=2026-06-05`
Expected: prints `plan written: …/reconcile-plan.json` and counts. Because tonight's manual run already created those 4 people and 5 tasks and marked the harvested `✓ filed`:
- `people`: 0 (all harvested are `✓ filed` now → skipped)
- `tasks`: most should show `status: exists` (slugs differ from the hand-made ones, so some may show `new` — that's fine; this validates parsing/resolution, not exact dedup of the manual slugs)

Run: `node -e "const p=require('./command-center/daily/2026-06-05/reconcile-plan.json'); console.log('keys:', Object.keys(p).join(',')); console.log('narrative chars:', p.narrative.length)"`
Expected: the JSON has all keys and a non-empty `narrative`.

Confirm gitignored: `git status --porcelain command-center/` → empty.

- [ ] **Step 5: Commit**

```bash
git add scripts/command-center/reconcile.ts package.json
git commit -m "feat(command-center): reconcile plan — resolve inputs+DB into a draft payload"
```

---

## Task 3: `reconcile apply` — idempotent writes (auto always; gated on --confirmed)

Reads a curated payload and writes idempotently. Reuses the write patterns proven in tonight's manual reconciliation.

**Files:**
- Modify: `scripts/command-center/reconcile.ts` (append `apply` + CLI branch)

- [ ] **Step 1: Append the `apply` implementation to `scripts/command-center/reconcile.ts`** (above the `// ── CLI ──` banner)

```typescript
// ── Apply ────────────────────────────────────────────────────────────────────
function nowIso(): string { return new Date().toISOString() }

async function initiativeIdBySlug(s: ReturnType<typeof getSupabase>, slug: string): Promise<string | null> {
  const { data } = await s.from('initiatives' as any).select('id').eq('slug', slug).maybeSingle()
  return data ? (data as any).id : null
}

async function appendMemoryNote(s: ReturnType<typeof getSupabase>, initiativeSlug: string, note: string, log: string[]): Promise<void> {
  const id = await initiativeIdBySlug(s, initiativeSlug)
  if (!id) { log.push(`memory ${initiativeSlug}: initiative not found — skipped`); return }
  const { data: mem } = await s.from('content_sections' as any).select('id, content').eq('entity_id', id).eq('section_type', 'memory').maybeSingle()
  if (!mem) { log.push(`memory ${initiativeSlug}: no memory doc — skipped`); return }
  let content = (mem as any).content as string
  if (content.includes(note)) { log.push(`memory ${initiativeSlug}: note present — skipped`); return }
  const lines = content.split('\n')
  const h = lines.findIndex((l) => /^##\s+Timeline of Key Events/i.test(l))
  if (h === -1) { content = content.replace(/\s*$/, '') + `\n\n## Timeline of Key Events\n${note}\n` }
  else {
    let end = lines.length
    for (let i = h + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break }
    lines.splice(end, 0, note); content = lines.join('\n')
  }
  const { error } = await s.from('content_sections' as any).update({ content, updated_at: nowIso() } as any).eq('id', (mem as any).id)
  log.push(error ? `memory ${initiativeSlug}: ERROR ${error.message}` : `memory ${initiativeSlug}: appended signal`)
}

function markHarvestedFiled(names: string[]): string | null {
  const path = join(CC, 'context', 'people.md')
  if (!existsSync(path) || names.length === 0) return null
  let md = readFileSync(path, 'utf8')
  let changed = false
  for (const name of names) {
    const re = new RegExp(`^(- )(?!✓ filed)(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\|)`, 'm')
    if (re.test(md)) { md = md.replace(re, `$1✓ filed — $2`); changed = true }
  }
  if (changed) { writeFileSync(path, md, 'utf8'); return 'people.md harvested lines marked ✓ filed' }
  return null
}

async function cmdApply(date: string, payloadPath: string, confirmed: boolean): Promise<void> {
  const s = getSupabase()
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as ReconcilePlan
  const log: string[] = []
  const allow = (tier: 'auto' | 'gated') => tier === 'auto' || confirmed

  // People
  for (const p of payload.people) {
    if (!allow(p.tier)) { log.push(`person ${p.name}: gated (needs --confirmed) — skipped`); continue }
    if (p.action === 'enrich' && p.id) {
      const { error } = await s.from('people' as any).update({ email: p.email, updated_at: nowIso() } as any).eq('id', p.id)
      log.push(error ? `person ${p.name}: ERROR ${error.message}` : `person ${p.name}: enriched email`)
    } else {
      const { data: ex } = await s.from('people' as any).select('id').eq('slug', p.slug).maybeSingle()
      if (ex) { log.push(`person ${p.name}: slug ${p.slug} exists — skipped`); continue }
      const { error } = await s.from('people' as any).insert({ slug: p.slug, name: p.name, type: p.type, role: p.role, email: p.email, status: 'active', relationship_notes: p.relationship_notes } as any)
      log.push(error ? `person ${p.name}: ERROR ${error.message}` : `person ${p.name}: created`)
    }
  }
  // Tasks (always gated)
  for (const t of payload.tasks) {
    if (!confirmed) { log.push(`task ${t.slug}: gated — skipped`); continue }
    const { data: ex } = await s.from('tasks' as any).select('id').eq('slug', t.slug).maybeSingle()
    if (ex) { log.push(`task ${t.slug}: exists — skipped`); continue }
    const row: Record<string, any> = { slug: t.slug, title: t.title, status: 'todo', priority: t.priority }
    if (t.owner_slug) { const { data: o } = await s.from('people' as any).select('id').eq('slug', t.owner_slug).maybeSingle(); if (o) row.owner_id = (o as any).id }
    if (t.initiative_slug) row.initiative_id = await initiativeIdBySlug(s, t.initiative_slug)
    const { error } = await s.from('tasks' as any).insert(row as any)
    log.push(error ? `task ${t.slug}: ERROR ${error.message}` : `task ${t.slug}: created`)
  }
  // Memory notes (auto)
  for (const m of payload.memoryNotes) { if (allow(m.tier)) await appendMemoryNote(s, m.initiative_slug, m.note, log); else log.push(`memory ${m.initiative_slug}: gated — skipped`) }
  // current_focus (gated)
  if (payload.currentFocus.length) {
    if (!confirmed) { log.push(`current_focus: ${payload.currentFocus.length} item(s) gated — skipped`) }
    else {
      const { data: cfRow } = await s.from('context_store' as any).select('content').eq('key', 'current_focus').maybeSingle()
      const cf = (cfRow as any).content as Record<string, any>
      let added = 0
      for (const item of payload.currentFocus) {
        if (!Array.isArray(cf[item.array])) cf[item.array] = []
        const prefix = item.text.slice(0, 30)
        if (cf[item.array].some((x: string) => typeof x === 'string' && x.startsWith(prefix))) continue
        cf[item.array].push(item.text); added++
      }
      if (added) { cf.last_updated = date; const { error } = await s.from('context_store' as any).update({ content: cf, updated_at: nowIso() } as any).eq('key', 'current_focus'); log.push(error ? `current_focus: ERROR ${error.message}` : `current_focus: +${added} item(s)`) }
      else log.push('current_focus: nothing new — skipped')
    }
  }
  // Mark harvested filed (only for people we actually processed/created)
  if (confirmed || payload.people.some((p) => p.tier === 'auto')) {
    const filedNames = payload.harvestedFiled.filter((n) => confirmed || payload.people.find((p) => p.name === n)?.tier === 'auto')
    const r = markHarvestedFiled(filedNames); if (r) log.push(r)
  }

  const errors = log.filter((l) => /ERROR/.test(l)).length
  const updated = log.filter((l) => /created|enriched|appended|\+\d|marked/.test(l)).length
  const skipped = log.filter((l) => /skipped/.test(l)).length
  console.log(`\n=== reconcile apply (${confirmed ? 'confirmed' : 'auto-only'}) ===`)
  log.forEach((l) => console.log('  ' + l))
  console.log(`\nUpdated ${updated} · Skipped ${skipped} · Errors ${errors}`)
}
```

- [ ] **Step 2: Wire the `apply` branch into the CLI**

In the `if (invokedDirectly) { ... }` block, replace the `else` usage error with an `apply` branch first:

```typescript
  } else if (sub === 'apply') {
    const pa = process.argv.find((x) => x.startsWith('--payload='))
    if (!pa) { console.error('apply requires --payload=<path>'); process.exit(1) }
    const confirmed = process.argv.includes('--confirmed')
    cmdApply(date, pa.slice('--payload='.length), confirmed).catch((e) => { console.error(e); process.exit(1) })
  } else {
```

- [ ] **Step 3: Re-run unit tests (still side-effect-free)**

Run: `node --import tsx --test scripts/command-center/__tests__/reconcile.test.ts`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 4: Validate apply idempotency on a tiny synthetic payload**

Create a throwaway payload that only enriches nothing and creates nothing, to confirm the apply harness runs clean:

```bash
cat > /tmp/cc-payload.json <<'JSON'
{ "date":"2026-06-05","people":[],"tasks":[],"followups_for_claude":[],"narrative":"","memoryNotes":[],"currentFocus":[],"harvestedFiled":[] }
JSON
npm run command-center:reconcile -- apply --date=2026-06-05 --payload=/tmp/cc-payload.json --confirmed
```
Expected: prints `=== reconcile apply (confirmed) ===` and `Updated 0 · Skipped 0 · Errors 0`, no stack trace. Clean up: `rm /tmp/cc-payload.json`.

- [ ] **Step 5: Commit**

```bash
git add scripts/command-center/reconcile.ts
git commit -m "feat(command-center): reconcile apply — idempotent tiered writes + harvested filing"
```

---

## Task 4: Trigger skill + CLAUDE.md row + B-documentation tweak

**Files:**
- Create: `.claude/skills/command-center-reconcile/SKILL.md` (LOCAL — do NOT git-add)
- Modify: `CLAUDE.md`
- Modify: `agents/command-center-capture.md`

- [ ] **Step 1: Create `.claude/skills/command-center-reconcile/SKILL.md` with EXACTLY this content**

```markdown
---
name: command-center-reconcile
description: Use in the Supabase session when Yonatan says "reconcile the day",
  "close the loop", "push the day to the brain". Resolves Skill B's summary +
  harvested people against Supabase and writes back (plan → curate → confirm → apply).
---

# Command Center — Reconcile (Skill C)

Close-the-loop. Runs in THIS (Supabase) session. Never blindly ingest Skill B —
resolve, enrich, verify, then write. See
`docs/superpowers/specs/2026-06-06-command-center-skill-c-reconcile-design.md`.

## Flow
1. `npm run command-center:reconcile -- plan --date=$(date +%F)` → writes
   `reconcile-plan.json` (people/tasks resolved; narrative + memory/current_focus
   follow-ups left for you).
2. **Curate (you):** open the plan. For `followups_for_claude` and the narrative,
   draft `memoryNotes` (auto: append to an existing initiative's memory Timeline)
   and `currentFocus` (gated). For people flagged `gated`/ambiguous, verify type and
   resolve. Read initiative memory docs to avoid duplicating known items. Write the
   curated payload back to the same JSON (fill memoryNotes/currentFocus, fix targets).
3. **Confirm (Yonatan):** present the bucketed list — auto items FYI, gated items for
   his OK.
4. **Apply:** `... -- apply --date=$(date +%F) --payload=command-center/daily/$(date +%F)/reconcile-plan.json`
   first WITHOUT `--confirmed` (lands safe auto enrichments), then WITH `--confirmed`
   after his OK (lands gated creates). Re-runs are no-ops.

## Rules
- Tiers: auto = fill EMPTY person field on exact match + append deduped memory signal;
  gated = new person, new task, current_focus, any overwrite, anything ambiguous.
- Match people by exact email→name, never substring. Carry `[via …]` provenance.
- `command-center/` is gitignored. Calendar/personal follow-ups never go to the DB.
```

- [ ] **Step 2: Add a reconcile row to the Command Center trigger table in `CLAUDE.md`**

Find the Command Center trigger table (the one with "gather context", "scan/capture", "close out the day"). Add this row at the end of that table:

```markdown
| "reconcile the day", "close the loop", "push to the brain" *(Supabase session)* | Follow `agents`/skill: `command-center:reconcile -- plan --date=$(date +%F)` → curate the plan (draft memory/current_focus from the narrative, verify gated people) → show Yonatan auto-vs-gated → `... -- apply --payload=… ` then `--confirmed`. Idempotent; re-runs are no-ops. |
```

- [ ] **Step 3: Enrich Skill B's close-the-day follow-up rows (the "B documents more context" tweak)**

In `agents/command-center-capture.md`, find the "Close the day" mode, step 2 (the line describing the `03-summary.md` follow-ups). Replace that step 2 with:

```markdown
2. Draft `03-summary.md`: a short day narrative + a **Follow-ups** table. Each row:
   **Item** (the action), **Person** (named), **Destination** (current_focus /
   calendar / personal / a *named initiative* memory / a task), and enough **context
   in the Item cell** for the reconcile step to act without re-reading the day — name
   the initiative explicitly where known, and say *why* it matters in a few words.
   Skill C (reconcile) trusts this table, so a thin row becomes a thin DB write.
```

- [ ] **Step 4: Verify**

Run: `head -5 .claude/skills/command-center-reconcile/SKILL.md`
Expected: valid frontmatter, `name: command-center-reconcile`.

Run: `grep -c "reconcile the day\|command-center:reconcile" CLAUDE.md`
Expected: non-zero.

Run: `grep -c "context in the Item cell" agents/command-center-capture.md`
Expected: 1.

- [ ] **Step 5: Commit — CLAUDE.md + agent doc only (skill stays untracked)**

```bash
git add CLAUDE.md agents/command-center-capture.md
git commit -m "docs(command-center): reconcile trigger + richer B follow-up rows"
```

Then confirm the skill is untracked: `git ls-files .claude/skills/command-center-reconcile/` → no output.

---

## Task 5: Live integration pass (MANUAL — not a coded task)

Not for a subagent. On the next real captured day:
1. "reconcile the day" → I run `plan`, curate (memory/current_focus from narrative, verify gated people), show you auto-vs-gated.
2. Apply auto, then `--confirmed` after your OK.
3. **Re-run `plan` + `apply --confirmed`** → confirm it's a **no-op** (all Skipped) — the idempotency acceptance bar.
Report rough edges to tune the resolver / B's documentation.

---

## Self-Review

**Spec coverage:**
- plan→curate→confirm→apply, this session, trigger → Tasks 2, 3, 4.
- Trust B's promotion (03-summary + Harvested; 02-captures context-only) → Task 2 (`buildPlan` reads only those).
- Resolver with exact-match false-positive guard → Task 1 (`matchPerson`, tested with Ya Wen/Elad Naama).
- Initiative resolution + active/blocked/missing + unresolved→Claude → Task 1 (`resolveInitiative`) + Task 2 (`followups_for_claude`, `initiative_status`).
- Auto vs gated tiers → Task 1 (`personTier`) + Task 3 (`allow()` + `--confirmed`).
- Idempotency (dedup by email/slug/content; harvested ✓ filed) → Task 3.
- Memory append to Timeline + current_focus append (not overwrite) → Task 3.
- Provenance → Task 2 (`relationship_notes`) + curated memory notes.
- B-documentation tweak → Task 4 Step 3.
- Live integration → Task 5.

**Placeholder scan:** No TBD/"handle edge cases"/"similar to". Every code step has full code; every run step has a command + expected output.

**Type consistency:** `PersonMatch`, `PersonRow`, `InitiativeRow`, `ReconcilePlan`, `PlanPerson`, `PlanTask` defined in Tasks 1–2 and consumed consistently in Task 3 (`cmdApply` reads `ReconcilePlan`). `matchPerson`/`resolveInitiative`/`classifyDestination`/`slugify`/`personTier` defined in Task 1, used in Task 2's `buildPlan`. CLI subcommands (`plan`/`apply`) + npm name (`command-center:reconcile`) consistent across Tasks 2–4. `allow(tier)` gates auto-vs-`--confirmed` consistently.
