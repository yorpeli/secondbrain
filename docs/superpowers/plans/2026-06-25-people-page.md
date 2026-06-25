# People Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only master-detail People page over Yonatan's 5 direct reports — a left rail plus a 6-card detail pane (header, current focus, team work, open items, 1:1 continuity, coaching/development) — for at-a-glance context and 1:1 prep.

**Architecture:** Two TanStack Query hooks follow the existing `use-initiatives` pattern: `useDirectReports()` loads the cheap rail list; per-person detail is lazy (`usePersonDetail(slug)` + `usePersonTeamWork(...)`) and only fetches when a person is selected. Pure data-shaping logic (merge/sort open items, split 1:1s) lives in a tested `lib/people-data.ts` module so components stay thin and render-only. Read-only throughout.

**Tech Stack:** React 19 + Vite 7, React Router v7, TanStack Query v5, Supabase JS, Tailwind v4, `react-markdown` + `remark-gfm`, `date-fns`, `lucide-react`. Vitest (added in Task 1) for the pure helpers only.

## Global Constraints

These apply to **every** task:

- **Read-only.** No inserts/updates/deletes, no edit affordances. Display only.
- **Resolve people by slug, never hardcode UUIDs.** The direct-reports anchor is `v_org_tree.reports_to_slug = 'yonatan-orpeli'` filtered to `status = 'active'`.
- **Never surface `meetings.private_notes`.** The 1:1 block reads `discussion_notes` only. Never `select` `private_notes`.
- **Exclude `content_sections` rows where `is_private = true`** from the coaching/development block (filter `.eq('is_private', false)`).
- **Initiatives have no team FK.** "Team work" initiatives are matched to a person by **owner_name OR stakeholder membership**, filtered to `kind = 'initiative'` (exclude pillars).
- **No em-dashes in UI copy.** Yonatan strongly dislikes em/en-dashes. For empty/placeholder values use words ("Not set", "None", "No date") or a plain hyphen `-`, never `—` or `–`. (The existing initiative-detail page uses `—`; do not copy that into new People code.)
- **Supabase typed-client convention:** views/tables aren't in generated types. Use `.from('name' as never)` and cast results via `as unknown as TargetType[]` (see `use-initiatives.ts`).
- **Path alias `@/`** maps to `app/src/`. Imports use it (e.g. `@/lib/supabase`).
- **Follow existing component patterns:** `Card`/`CardHeader`/`CardTitle`/`CardContent` from `@/components/ui/card`, `Badge` from `@/components/ui/badge`, `Skeleton` from `@/components/ui/skeleton`. Markdown via `<Markdown remarkPlugins={[remarkGfm]}>` inside a `prose prose-sm dark:prose-invert` wrapper.

---

### Task 1: Types + pure data helpers (with vitest)

Establishes the shared TypeScript types and the two pure, testable functions every later component depends on. Adds a minimal vitest setup (the app currently has none).

**Files:**
- Modify: `app/src/lib/types.ts` (append People types)
- Create: `app/src/lib/people-data.ts`
- Create: `app/src/lib/people-data.test.ts`
- Create: `app/vitest.config.ts`
- Modify: `app/package.json` (add `test` script + `vitest` devDependency via install)

**Interfaces:**
- Produces (types consumed by all later tasks):
  - `DirectReportSummary { id; slug; name; role; teamName: string | null; openItemsCount: number; lastOneOnOne: string | null; nextOneOnOne: string | null }`
  - `PersonOpenItem { id; kind: 'task' | 'action-item'; title; status: string; priority: string | null; dueDate: string | null }`
  - `PersonOneOnOne { id; date: string; topic: string | null; notes: string | null }`
  - `PersonCoachingEntry { id; sectionType: 'coaching-log' | 'dev-plan'; title: string | null; content: string; date: string | null }`
  - `PersonPerfReview { reviewPeriod: string | null; reviewDate: string | null; overallRating: string | null; ratingScore: number | null }`
  - `PersonDetail { id; slug; name; role; teamName; teamSlug; managerName; workingStyle; strengths; growthAreas; relationshipNotes; currentFocus; openItems: PersonOpenItem[]; recentOneOnOnes: PersonOneOnOne[]; nextOneOnOne: PersonOneOnOne | null; coaching: PersonCoachingEntry[]; perfReview: PersonPerfReview | null }`
  - `PersonTeamInitiative { id; slug; title; status: string; priority: string }`
  - `PersonPppStatus { weekDate: string; workstreamName: string; status: string; summary: string | null }`
  - `PersonTeamWork { initiatives: PersonTeamInitiative[]; ppp: PersonPppStatus | null }`
- Produces (functions):
  - `sortOpenItems(items: PersonOpenItem[]): PersonOpenItem[]` — ascending by `dueDate`, nulls last; stable.
  - `splitOneOnOnes(meetings: PersonOneOnOne[], todayISO: string): { recent: PersonOneOnOne[]; next: PersonOneOnOne | null }` — `recent` = meetings with `date <= todayISO` sorted newest-first; `next` = earliest meeting with `date > todayISO`, or null.

- [ ] **Step 1: Install vitest**

Run from the `app/` directory:
```bash
cd app && npm install -D vitest
```
Expected: `vitest` added to `devDependencies`, no errors.

- [ ] **Step 2: Add the `test` script to `app/package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create `app/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Append People types to `app/src/lib/types.ts`**

```typescript
// --- People page ---

export interface DirectReportSummary {
  id: string
  slug: string
  name: string
  role: string
  teamName: string | null
  openItemsCount: number
  lastOneOnOne: string | null
  nextOneOnOne: string | null
}

export interface PersonOpenItem {
  id: string
  kind: 'task' | 'action-item'
  title: string
  status: string
  priority: string | null
  dueDate: string | null
}

export interface PersonOneOnOne {
  id: string
  date: string
  topic: string | null
  notes: string | null
}

export interface PersonCoachingEntry {
  id: string
  sectionType: 'coaching-log' | 'dev-plan'
  title: string | null
  content: string
  date: string | null
}

export interface PersonPerfReview {
  reviewPeriod: string | null
  reviewDate: string | null
  overallRating: string | null
  ratingScore: number | null
}

export interface PersonDetail {
  id: string
  slug: string
  name: string
  role: string
  teamName: string | null
  teamSlug: string | null
  managerName: string | null
  workingStyle: string | null
  strengths: string[]
  growthAreas: string[]
  relationshipNotes: string | null
  currentFocus: string | null
  openItems: PersonOpenItem[]
  recentOneOnOnes: PersonOneOnOne[]
  nextOneOnOne: PersonOneOnOne | null
  coaching: PersonCoachingEntry[]
  perfReview: PersonPerfReview | null
}

export interface PersonTeamInitiative {
  id: string
  slug: string
  title: string
  status: string
  priority: string
}

export interface PersonPppStatus {
  weekDate: string
  workstreamName: string
  status: string
  summary: string | null
}

export interface PersonTeamWork {
  initiatives: PersonTeamInitiative[]
  ppp: PersonPppStatus | null
}
```

- [ ] **Step 5: Write the failing test `app/src/lib/people-data.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { sortOpenItems, splitOneOnOnes } from './people-data'
import type { PersonOpenItem, PersonOneOnOne } from './types'

describe('sortOpenItems', () => {
  it('sorts by due date ascending with nulls last', () => {
    const items: PersonOpenItem[] = [
      { id: 'a', kind: 'task', title: 'A', status: 'todo', priority: null, dueDate: null },
      { id: 'b', kind: 'task', title: 'B', status: 'todo', priority: null, dueDate: '2026-07-01' },
      { id: 'c', kind: 'action-item', title: 'C', status: 'open', priority: null, dueDate: '2026-06-15' },
    ]
    const result = sortOpenItems(items)
    expect(result.map(i => i.id)).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the input array', () => {
    const items: PersonOpenItem[] = [
      { id: 'b', kind: 'task', title: 'B', status: 'todo', priority: null, dueDate: '2026-07-01' },
      { id: 'c', kind: 'task', title: 'C', status: 'todo', priority: null, dueDate: '2026-06-15' },
    ]
    sortOpenItems(items)
    expect(items[0].id).toBe('b')
  })
})

describe('splitOneOnOnes', () => {
  const meetings: PersonOneOnOne[] = [
    { id: 'past1', date: '2026-06-01', topic: null, notes: 'old' },
    { id: 'past2', date: '2026-06-20', topic: null, notes: 'recent' },
    { id: 'future1', date: '2026-06-30', topic: null, notes: null },
    { id: 'future2', date: '2026-07-10', topic: null, notes: null },
  ]

  it('returns recent meetings newest-first', () => {
    const { recent } = splitOneOnOnes(meetings, '2026-06-25')
    expect(recent.map(m => m.id)).toEqual(['past2', 'past1'])
  })

  it('returns the earliest future meeting as next', () => {
    const { next } = splitOneOnOnes(meetings, '2026-06-25')
    expect(next?.id).toBe('future1')
  })

  it('returns null next when no future meeting exists', () => {
    const { next } = splitOneOnOnes(meetings, '2026-08-01')
    expect(next).toBeNull()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd app && npm test`
Expected: FAIL — `Failed to resolve import "./people-data"` (module does not exist yet).

- [ ] **Step 7: Implement `app/src/lib/people-data.ts`**

```typescript
import type { PersonOpenItem, PersonOneOnOne } from './types'

/** Ascending by dueDate, nulls last. Pure — returns a new array. */
export function sortOpenItems(items: PersonOpenItem[]): PersonOpenItem[] {
  return [...items].sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0
    if (a.dueDate === null) return 1
    if (b.dueDate === null) return -1
    return a.dueDate < b.dueDate ? -1 : 1
  })
}

/**
 * Split 1:1 meetings into recent (date <= today, newest first) and the
 * single next upcoming meeting (earliest date > today), or null.
 */
export function splitOneOnOnes(
  meetings: PersonOneOnOne[],
  todayISO: string,
): { recent: PersonOneOnOne[]; next: PersonOneOnOne | null } {
  const past = meetings.filter(m => m.date <= todayISO)
  const future = meetings.filter(m => m.date > todayISO)
  const recent = [...past].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const sortedFuture = [...future].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return { recent, next: sortedFuture[0] ?? null }
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd app && npm test`
Expected: PASS — all 5 tests green.

- [ ] **Step 9: Commit**

```bash
git add app/src/lib/types.ts app/src/lib/people-data.ts app/src/lib/people-data.test.ts app/vitest.config.ts app/package.json app/package-lock.json
git commit -m "feat(people): types + tested data helpers + vitest setup"
```

---

### Task 2: `useDirectReports` hook (rail list)

Loads the 5 directs and their two at-a-glance rail signals (open-items count, last/next 1:1) in a constant number of queries (no N+1).

**Files:**
- Create: `app/src/hooks/use-people.ts`

**Interfaces:**
- Consumes: `DirectReportSummary`, `PersonOneOnOne` (Task 1); `splitOneOnOnes` (Task 1); `supabase` (`@/lib/supabase`).
- Produces: `useDirectReports(): UseQueryResult<DirectReportSummary[]>`.

- [ ] **Step 1: Implement `useDirectReports` in `app/src/hooks/use-people.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { splitOneOnOnes } from '@/lib/people-data'
import type { DirectReportSummary, PersonOneOnOne } from '@/lib/types'

interface OrgTreeRow {
  id: string
  slug: string
  name: string
  role: string
  team_name: string | null
  team_slug: string | null
  reports_to_name: string | null
  reports_to_slug: string | null
  working_style: string | null
  strengths: string[] | null
  growth_areas: string[] | null
  relationship_notes: string | null
  current_focus: string | null
  status: string
}

export function useDirectReports() {
  return useQuery({
    queryKey: ['direct-reports'],
    queryFn: async (): Promise<DirectReportSummary[]> => {
      const { data: orgData, error } = await supabase
        .from('v_org_tree' as never)
        .select('id, slug, name, role, team_name, reports_to_slug, status')
        .eq('reports_to_slug', 'yonatan-orpeli')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      const directs = (orgData ?? []) as unknown as OrgTreeRow[]
      if (directs.length === 0) return []

      const ids = directs.map(d => d.id)

      // Open tasks (not done) per owner
      const { data: taskData } = await supabase
        .from('tasks' as never)
        .select('owner_id, status')
        .in('owner_id', ids)
        .neq('status', 'done')
      const taskRows = (taskData ?? []) as unknown as Array<{ owner_id: string }>

      // Open action items per owner
      const { data: aiData } = await supabase
        .from('meeting_action_items' as never)
        .select('owner_id, status')
        .in('owner_id', ids)
        .eq('status', 'open')
      const aiRows = (aiData ?? []) as unknown as Array<{ owner_id: string }>

      // 1:1 meetings these people attend
      const { data: attData } = await supabase
        .from('meeting_attendees' as never)
        .select('meeting_id, person_id')
        .in('person_id', ids)
      const attRows = (attData ?? []) as unknown as Array<{ meeting_id: string; person_id: string }>

      const meetingIds = [...new Set(attRows.map(a => a.meeting_id))]
      let meetingDateById = new Map<string, string>()
      if (meetingIds.length > 0) {
        const { data: mtgData } = await supabase
          .from('meetings' as never)
          .select('id, date, meeting_type')
          .in('id', meetingIds)
          .eq('meeting_type', '1on1')
        const mtgRows = (mtgData ?? []) as unknown as Array<{ id: string; date: string }>
        meetingDateById = new Map(mtgRows.map(m => [m.id, m.date]))
      }

      const todayISO = new Date().toISOString().slice(0, 10)

      const countByOwner = (rows: Array<{ owner_id: string }>) => {
        const m = new Map<string, number>()
        for (const r of rows) m.set(r.owner_id, (m.get(r.owner_id) ?? 0) + 1)
        return m
      }
      const taskCounts = countByOwner(taskRows)
      const aiCounts = countByOwner(aiRows)

      // person_id -> 1:1 dates
      const datesByPerson = new Map<string, PersonOneOnOne[]>()
      for (const a of attRows) {
        const date = meetingDateById.get(a.meeting_id)
        if (!date) continue
        const list = datesByPerson.get(a.person_id) ?? []
        list.push({ id: a.meeting_id, date, topic: null, notes: null })
        datesByPerson.set(a.person_id, list)
      }

      return directs.map(d => {
        const { recent, next } = splitOneOnOnes(datesByPerson.get(d.id) ?? [], todayISO)
        return {
          id: d.id,
          slug: d.slug,
          name: d.name,
          role: d.role,
          teamName: d.team_name,
          openItemsCount: (taskCounts.get(d.id) ?? 0) + (aiCounts.get(d.id) ?? 0),
          lastOneOnOne: recent[0]?.date ?? null,
          nextOneOnOne: next?.date ?? null,
        }
      })
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `cd app && npm run lint`
Expected: no errors in `use-people.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/src/hooks/use-people.ts
git commit -m "feat(people): useDirectReports rail hook"
```

---

### Task 3: `usePersonDetail` hook (person-level detail)

Assembles identity + open items + 1:1 continuity + coaching/perf for one selected person. Lazy (`enabled: !!slug`).

**Files:**
- Modify: `app/src/hooks/use-people.ts` (append)

**Interfaces:**
- Consumes: `PersonDetail`, `PersonOpenItem`, `PersonOneOnOne`, `PersonCoachingEntry`, `PersonPerfReview` (Task 1); `sortOpenItems`, `splitOneOnOnes` (Task 1); the `OrgTreeRow` interface from Task 2 (same file).
- Produces: `usePersonDetail(slug: string): UseQueryResult<PersonDetail | null>`.

- [ ] **Step 1: Append `usePersonDetail` to `app/src/hooks/use-people.ts`**

```typescript
export function usePersonDetail(slug: string) {
  return useQuery({
    queryKey: ['person-detail', slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PersonDetail | null> => {
      const { data: orgData, error } = await supabase
        .from('v_org_tree' as never)
        .select('id, slug, name, role, team_name, team_slug, reports_to_name, working_style, strengths, growth_areas, relationship_notes, current_focus, status')
        .eq('slug', slug)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!orgData) return null
      const p = orgData as unknown as OrgTreeRow

      // Open tasks
      const { data: taskData } = await supabase
        .from('tasks' as never)
        .select('id, title, status, priority, due_date')
        .eq('owner_id', p.id)
        .neq('status', 'done')
      const tasks = ((taskData ?? []) as unknown as Array<{ id: string; title: string; status: string; priority: string | null; due_date: string | null }>)
        .map(t => ({ id: t.id, kind: 'task' as const, title: t.title, status: t.status, priority: t.priority, dueDate: t.due_date }))

      // Open action items
      const { data: aiData } = await supabase
        .from('meeting_action_items' as never)
        .select('id, description, status, due_date')
        .eq('owner_id', p.id)
        .eq('status', 'open')
      const actionItems = ((aiData ?? []) as unknown as Array<{ id: string; description: string; status: string; due_date: string | null }>)
        .map(a => ({ id: a.id, kind: 'action-item' as const, title: a.description, status: a.status, priority: null, dueDate: a.due_date }))

      const openItems = sortOpenItems([...tasks, ...actionItems])

      // 1:1 meetings (discussion_notes only, never private_notes)
      const { data: attData } = await supabase
        .from('meeting_attendees' as never)
        .select('meeting_id')
        .eq('person_id', p.id)
      const meetingIds = [...new Set(((attData ?? []) as unknown as Array<{ meeting_id: string }>).map(a => a.meeting_id))]

      let oneOnOnes: PersonOneOnOne[] = []
      if (meetingIds.length > 0) {
        const { data: mtgData } = await supabase
          .from('meetings' as never)
          .select('id, date, topic, discussion_notes, meeting_type')
          .in('id', meetingIds)
          .eq('meeting_type', '1on1')
        oneOnOnes = ((mtgData ?? []) as unknown as Array<{ id: string; date: string; topic: string | null; discussion_notes: string | null }>)
          .map(m => ({ id: m.id, date: m.date, topic: m.topic, notes: m.discussion_notes }))
      }
      const todayISO = new Date().toISOString().slice(0, 10)
      const { recent, next } = splitOneOnOnes(oneOnOnes, todayISO)

      // Coaching + dev-plan (non-private only)
      const { data: csData } = await supabase
        .from('content_sections' as never)
        .select('id, section_type, title, content, date, is_private')
        .eq('entity_id', p.id)
        .in('section_type', ['coaching-log', 'dev-plan'])
        .eq('is_private', false)
        .order('date', { ascending: false })
      const coaching = ((csData ?? []) as unknown as Array<{ id: string; section_type: string; title: string | null; content: string; date: string | null }>)
        .map(c => ({ id: c.id, sectionType: c.section_type as 'coaching-log' | 'dev-plan', title: c.title, content: c.content, date: c.date }))

      // Latest performance review (metadata only)
      const { data: prData } = await supabase
        .from('performance_reviews' as never)
        .select('review_period, review_date, overall_rating, rating_score')
        .eq('person_id', p.id)
        .order('review_date', { ascending: false })
        .limit(1)
      const prRow = ((prData ?? []) as unknown as Array<{ review_period: string | null; review_date: string | null; overall_rating: string | null; rating_score: number | null }>)[0]
      const perfReview = prRow
        ? { reviewPeriod: prRow.review_period, reviewDate: prRow.review_date, overallRating: prRow.overall_rating, ratingScore: prRow.rating_score }
        : null

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        role: p.role,
        teamName: p.team_name,
        teamSlug: p.team_slug,
        managerName: p.reports_to_name,
        workingStyle: p.working_style,
        strengths: p.strengths ?? [],
        growthAreas: p.growth_areas ?? [],
        relationshipNotes: p.relationship_notes,
        currentFocus: p.current_focus,
        openItems,
        recentOneOnOnes: recent,
        nextOneOnOne: next,
        coaching,
        perfReview,
      }
    },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `cd app && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/hooks/use-people.ts
git commit -m "feat(people): usePersonDetail hook"
```

---

### Task 4: `usePersonTeamWork` hook (initiatives + PPP)

Loads the initiatives a person owns or is a stakeholder on, plus their latest PPP swimlane status. Lazy.

**Files:**
- Modify: `app/src/hooks/use-people.ts` (append)

**Interfaces:**
- Consumes: `PersonTeamWork`, `PersonTeamInitiative`, `PersonPppStatus` (Task 1).
- Produces: `usePersonTeamWork(personId: string | undefined, personName: string | undefined, slug: string | undefined): UseQueryResult<PersonTeamWork>`.

- [ ] **Step 1: Append `usePersonTeamWork` to `app/src/hooks/use-people.ts`**

```typescript
export function usePersonTeamWork(
  personId: string | undefined,
  personName: string | undefined,
  slug: string | undefined,
) {
  return useQuery({
    queryKey: ['person-team-work', personId],
    enabled: !!personId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PersonTeamWork> => {
      // Initiatives where this person is a stakeholder
      const { data: stkData } = await supabase
        .from('initiative_stakeholders' as never)
        .select('initiative_id')
        .eq('person_id', personId as string)
      const stakeholderInitiativeIds = [...new Set(
        ((stkData ?? []) as unknown as Array<{ initiative_id: string }>).map(s => s.initiative_id),
      )]

      const byId = new Map<string, PersonTeamInitiative>()

      // Initiatives owned by this person (owner_name match), kind = initiative
      if (personName) {
        const { data: ownData } = await supabase
          .from('v_initiative_dashboard' as never)
          .select('id, slug, title, status, priority, owner_name, kind')
          .eq('kind', 'initiative')
          .eq('owner_name', personName)
        for (const r of (ownData ?? []) as unknown as Array<PersonTeamInitiative & { owner_name: string; kind: string }>) {
          byId.set(r.id, { id: r.id, slug: r.slug, title: r.title, status: r.status, priority: r.priority })
        }
      }

      // Initiatives where they're a stakeholder
      if (stakeholderInitiativeIds.length > 0) {
        const { data: stkInitData } = await supabase
          .from('v_initiative_dashboard' as never)
          .select('id, slug, title, status, priority, kind')
          .eq('kind', 'initiative')
          .in('id', stakeholderInitiativeIds)
        for (const r of (stkInitData ?? []) as unknown as Array<PersonTeamInitiative & { kind: string }>) {
          byId.set(r.id, { id: r.id, slug: r.slug, title: r.title, status: r.status, priority: r.priority })
        }
      }

      const initiatives = Array.from(byId.values()).sort((a, b) =>
        a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : (a.title < b.title ? -1 : 1),
      )

      // Latest PPP swimlane for this lead
      let ppp: PersonPppStatus | null = null
      if (slug) {
        const { data: pppData } = await supabase
          .from('v_ppp_swimlanes' as never)
          .select('week_date, workstream_name, status, summary, lead_slug')
          .eq('lead_slug', slug)
          .order('week_date', { ascending: false })
          .limit(1)
        const row = ((pppData ?? []) as unknown as Array<{ week_date: string; workstream_name: string; status: string; summary: string | null }>)[0]
        if (row) ppp = { weekDate: row.week_date, workstreamName: row.workstream_name, status: row.status, summary: row.summary }
      }

      return { initiatives, ppp }
    },
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `cd app && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/src/hooks/use-people.ts
git commit -m "feat(people): usePersonTeamWork hook (initiatives + PPP)"
```

---

### Task 5: Person rail component

The left list of directs with at-a-glance signals and selection.

**Files:**
- Create: `app/src/components/people/person-rail.tsx`

**Interfaces:**
- Consumes: `DirectReportSummary` (Task 1).
- Produces: `<PersonRail people={DirectReportSummary[]} selectedSlug={string | null} onSelect={(slug: string) => void} />`.

- [ ] **Step 1: Implement `app/src/components/people/person-rail.tsx`**

```typescript
import { cn } from '@/lib/utils'
import type { DirectReportSummary } from '@/lib/types'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function PersonRail({
  people,
  selectedSlug,
  onSelect,
}: {
  people: DirectReportSummary[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}) {
  return (
    <nav className="space-y-1">
      {people.map(p => {
        const selected = p.slug === selectedSlug
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.slug)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors',
              selected ? 'border-primary bg-accent' : 'border-transparent hover:bg-accent/50',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.teamName ?? p.role}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.openItemsCount} open item{p.openItemsCount === 1 ? '' : 's'}</span>
              <span>{p.nextOneOnOne ? `Next 1:1 ${p.nextOneOnOne}` : p.lastOneOnOne ? `Last 1:1 ${p.lastOneOnOne}` : 'No 1:1s'}</span>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd app && npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/people/person-rail.tsx
git commit -m "feat(people): person rail component"
```

---

### Task 6: Page wiring + detail orchestrator + header & focus cards

Replaces the placeholder page with the working master-detail layout. Renders the rail and a detail pane with the first two (always-populated) cards, giving an end-to-end working screen.

**Files:**
- Create: `app/src/components/people/person-detail.tsx`
- Create: `app/src/components/people/person-header-card.tsx`
- Create: `app/src/components/people/current-focus-card.tsx`
- Modify: `app/src/pages/people.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `useDirectReports`, `usePersonDetail`, `usePersonTeamWork` (Tasks 2-4); `PersonRail` (Task 5); `PersonDetail` (Task 1); `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Badge`, `Skeleton`.
- Produces: `<PeoplePage />` (default route element, already wired in the router); `<PersonDetailView slug={string} />`; `<PersonHeaderCard person={PersonDetail} />`; `<CurrentFocusCard person={PersonDetail} />`.

- [ ] **Step 1: Implement `app/src/components/people/person-header-card.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'

export function PersonHeaderCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{person.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {person.role}
          {person.teamName ? ` · ${person.teamName}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {person.workingStyle && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Working style</div>
            <p>{person.workingStyle}</p>
          </div>
        )}
        {person.strengths.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Strengths</div>
            <div className="flex flex-wrap gap-1.5">
              {person.strengths.map((s, i) => <Badge key={i} variant="success">{s}</Badge>)}
            </div>
          </div>
        )}
        {person.growthAreas.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Growth areas</div>
            <div className="flex flex-wrap gap-1.5">
              {person.growthAreas.map((g, i) => <Badge key={i} variant="warning">{g}</Badge>)}
            </div>
          </div>
        )}
        {person.relationshipNotes && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Relationship notes</div>
            <p className="text-muted-foreground">{person.relationshipNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Implement `app/src/components/people/current-focus-card.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PersonDetail } from '@/lib/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function CurrentFocusCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Current focus</CardTitle>
      </CardHeader>
      <CardContent>
        {person.currentFocus ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
            <Markdown remarkPlugins={[remarkGfm]}>{person.currentFocus}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Implement `app/src/components/people/person-detail.tsx`**

(Cards added in later tasks are imported here as they're built. For this task, only header + focus render.)

```typescript
import { usePersonDetail } from '@/hooks/use-people'
import { PersonHeaderCard } from './person-header-card'
import { CurrentFocusCard } from './current-focus-card'
import { Skeleton } from '@/components/ui/skeleton'

export function PersonDetailView({ slug }: { slug: string }) {
  const { data: person, isLoading, error } = usePersonDetail(slug)

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load person: {(error as Error).message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Person not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PersonHeaderCard person={person} />
      <CurrentFocusCard person={person} />
    </div>
  )
}
```

- [ ] **Step 4: Replace `app/src/pages/people.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { useDirectReports } from '@/hooks/use-people'
import { PersonRail } from '@/components/people/person-rail'
import { PersonDetailView } from '@/components/people/person-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

export function PeoplePage() {
  const { data: people, isLoading, error } = useDirectReports()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  // Default selection: first direct once loaded
  useEffect(() => {
    if (!selectedSlug && people && people.length > 0) {
      setSelectedSlug(people[0].slug)
    }
  }, [people, selectedSlug])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Failed to load people: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">{people?.length ?? 0} direct reports</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : people && people.length > 0 ? (
            <PersonRail people={people} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No direct reports found.</p>
            </div>
          )}
        </div>
        <div>
          {selectedSlug ? (
            <PersonDetailView slug={selectedSlug} />
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">Select a person to see details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `cd app && npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual browser verification**

Run: `cd app && npm run dev` (use `dangerouslyDisableSandbox` if the dev server appears to hang on file reads — known sandbox quirk). Open the local URL, click **People**.
Expected: 5 directs in the rail (Elad Schnarch, Ido Seter, Ira Martinenko, Meital Lahat Dekter, Yael Feldhiem), first selected by default; detail pane shows the header card (role, team, strengths/growth chips, relationship notes where present) and a current-focus card with markdown. Clicking another rail row swaps the detail. Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add app/src/pages/people.tsx app/src/components/people/person-detail.tsx app/src/components/people/person-header-card.tsx app/src/components/people/current-focus-card.tsx
git commit -m "feat(people): master-detail page wiring + header & focus cards"
```

---

### Task 7: Open items + 1:1 continuity cards

**Files:**
- Create: `app/src/components/people/open-items-card.tsx`
- Create: `app/src/components/people/one-on-one-card.tsx`
- Modify: `app/src/components/people/person-detail.tsx` (render the two new cards)

**Interfaces:**
- Consumes: `PersonDetail`, `PersonOpenItem`, `PersonOneOnOne` (Task 1); `Card`, `Badge`.
- Produces: `<OpenItemsCard person={PersonDetail} />`, `<OneOnOneCard person={PersonDetail} />`.

- [ ] **Step 1: Implement `app/src/components/people/open-items-card.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'

export function OpenItemsCard({ person }: { person: PersonDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Open items ({person.openItems.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {person.openItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open items logged.</p>
        ) : (
          <ul className="space-y-2">
            {person.openItems.map(item => (
              <li key={`${item.kind}-${item.id}`} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span>{item.title}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={item.kind === 'task' ? 'info' : 'secondary'}>
                      {item.kind === 'task' ? 'Task' : 'Action item'}
                    </Badge>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{item.dueDate ?? 'No date'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Implement `app/src/components/people/one-on-one-card.tsx`**

```typescript
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PersonDetail } from '@/lib/types'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function OneOnOneCard({ person }: { person: PersonDetail }) {
  const [expanded, setExpanded] = useState<string | null>(person.recentOneOnOnes[0]?.id ?? null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">1:1 continuity</CardTitle>
        {person.nextOneOnOne && (
          <p className="text-xs text-muted-foreground">Next 1:1 scheduled {person.nextOneOnOne.date}</p>
        )}
      </CardHeader>
      <CardContent>
        {person.recentOneOnOnes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No 1:1 notes logged.</p>
        ) : (
          <div className="space-y-2">
            {person.recentOneOnOnes.map(m => {
              const open = expanded === m.id
              return (
                <div key={m.id} className="rounded-md border">
                  <button
                    onClick={() => setExpanded(open ? null : m.id)}
                    className="flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm"
                  >
                    <span className="font-medium">{m.topic ?? '1:1'}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  </button>
                  {open && m.notes && (
                    <div className="border-t p-2.5 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.notes}</Markdown>
                    </div>
                  )}
                  {open && !m.notes && (
                    <div className="border-t p-2.5 text-sm text-muted-foreground">No notes recorded.</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Render both cards in `person-detail.tsx`**

Add the imports near the top:
```typescript
import { OpenItemsCard } from './open-items-card'
import { OneOnOneCard } from './one-on-one-card'
```

In the returned JSX, insert after `<CurrentFocusCard person={person} />`:
```typescript
      <OpenItemsCard person={person} />
      <OneOnOneCard person={person} />
```

- [ ] **Step 4: Typecheck + lint**

Run: `cd app && npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual browser verification**

Run: `cd app && npm run dev`. Open People.
Expected: Ido Seter shows ~3 open action items + 1 task; Ira shows 2 action items; people with none show "No open items logged." 1:1 card shows collapsible dated entries (Elad ~10, others fewer), newest expanded; discussion notes render as markdown; no private notes appear. Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/people/open-items-card.tsx app/src/components/people/one-on-one-card.tsx app/src/components/people/person-detail.tsx
git commit -m "feat(people): open items + 1:1 continuity cards"
```

---

### Task 8: Team work card

**Files:**
- Create: `app/src/components/people/team-work-card.tsx`
- Modify: `app/src/components/people/person-detail.tsx` (render it, wired to `usePersonTeamWork`)

**Interfaces:**
- Consumes: `usePersonTeamWork` (Task 4); `PersonDetail`, `PersonTeamWork` (Task 1); `Card`, `Badge`; React Router `Link`.
- Produces: `<TeamWorkCard person={PersonDetail} />` (calls the hook internally).

- [ ] **Step 1: Implement `app/src/components/people/team-work-card.tsx`**

```typescript
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePersonTeamWork } from '@/hooks/use-people'
import type { PersonDetail } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function TeamWorkCard({ person }: { person: PersonDetail }) {
  const { data, isLoading } = usePersonTeamWork(person.id, person.name, person.slug)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Team work</CardTitle>
        {person.teamName && <p className="text-xs text-muted-foreground">{person.teamName}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Initiatives</div>
              {data && data.initiatives.length > 0 ? (
                <ul className="space-y-1.5">
                  {data.initiatives.map(i => (
                    <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/initiatives/${i.slug}`} className="truncate text-primary hover:underline">
                        {i.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline">{i.priority}</Badge>
                        <Badge variant="secondary">{i.status}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No initiatives linked.</p>
              )}
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Latest PPP status</div>
              {data?.ppp ? (
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{data.ppp.status}</Badge>
                    <span className="text-xs text-muted-foreground">{data.ppp.workstreamName} · {data.ppp.weekDate}</span>
                  </div>
                  {data.ppp.summary && <p className="mt-1.5 text-muted-foreground">{data.ppp.summary}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No PPP status logged.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Render it in `person-detail.tsx`**

Add the import:
```typescript
import { TeamWorkCard } from './team-work-card'
```

Insert it between the current-focus card and the open-items card (team work above open items, per the approved card order):
```typescript
      <TeamWorkCard person={person} />
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd app && npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Run: `cd app && npm run dev`. Open People, click through directs.
Expected: Team work card lists initiatives the person owns/is a stakeholder on (each links to `/initiatives/:slug`) and their latest PPP swimlane line; people with neither show the respective empty states. Card sits above Open items. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/people/team-work-card.tsx app/src/components/people/person-detail.tsx
git commit -m "feat(people): team work card (initiatives + PPP)"
```

---

### Task 9: Coaching & development card (sensitive zone)

**Files:**
- Create: `app/src/components/people/coaching-card.tsx`
- Modify: `app/src/components/people/person-detail.tsx` (render it last)

**Interfaces:**
- Consumes: `PersonDetail`, `PersonCoachingEntry`, `PersonPerfReview` (Task 1); `Card`, `Badge`; `lucide-react` `Lock`.
- Produces: `<CoachingCard person={PersonDetail} />`.

- [ ] **Step 1: Implement `app/src/components/people/coaching-card.tsx`**

The discreet treatment: a muted/dashed border and a lock affordance signal the sensitive zone.

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonDetail } from '@/lib/types'
import { Lock } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function CoachingCard({ person }: { person: PersonDetail }) {
  const hasContent = person.coaching.length > 0 || person.perfReview !== null
  const latestCoaching = person.coaching.find(c => c.sectionType === 'coaching-log')
  const latestDevPlan = person.coaching.find(c => c.sectionType === 'dev-plan')

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Coaching & development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!hasContent && <p className="text-muted-foreground">Nothing logged yet.</p>}

        {person.perfReview && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Latest review</div>
            <div className="flex items-center gap-2">
              {person.perfReview.overallRating && <Badge variant="purple">{person.perfReview.overallRating}</Badge>}
              <span className="text-xs text-muted-foreground">
                {person.perfReview.reviewPeriod ?? person.perfReview.reviewDate ?? ''}
              </span>
            </div>
          </div>
        )}

        {latestCoaching && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Latest coaching log{latestCoaching.date ? ` · ${latestCoaching.date}` : ''}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
              <Markdown remarkPlugins={[remarkGfm]}>{latestCoaching.content}</Markdown>
            </div>
          </div>
        )}

        {latestDevPlan && (
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Development plan{latestDevPlan.date ? ` · ${latestDevPlan.date}` : ''}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5">
              <Markdown remarkPlugins={[remarkGfm]}>{latestDevPlan.content}</Markdown>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Render it last in `person-detail.tsx`**

Add the import:
```typescript
import { CoachingCard } from './coaching-card'
```

Insert as the final card in the stack:
```typescript
      <CoachingCard person={person} />
```

- [ ] **Step 3: Typecheck + lint**

Run: `cd app && npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual browser verification**

Run: `cd app && npm run dev`. Open People.
Expected: Coaching card renders last with a dashed/muted border + lock icon. Elad shows a coaching log (he has 8; latest renders) + his review rating; Yael shows 1 coaching log; the rest show review rating only or "Nothing logged yet." No dev-plans exist, so that sub-block is absent for all. Stop with Ctrl+C.

- [ ] **Step 5: Run the full test + verification sweep**

```bash
cd app && npm test && npx tsc -b && npm run lint
```
Expected: tests PASS, typecheck clean, lint clean.

- [ ] **Step 6: Commit**

```bash
git add app/src/components/people/coaching-card.tsx app/src/components/people/person-detail.tsx
git commit -m "feat(people): coaching & development card (sensitive zone)"
```

---

## Self-Review

**1. Spec coverage**

| Spec requirement | Task |
|---|---|
| Directs-only, resolve by `reports_to_slug` | Task 2 |
| Master-detail layout (rail ~300px + detail) | Task 6 |
| Rail signals: open-items count, last/next 1:1 | Tasks 1 (split), 2 |
| Header card (role/team/working style/strengths/growth/rel-notes) | Task 6 |
| Current focus card (markdown) | Task 6 |
| Team work card (initiatives + PPP) | Tasks 4, 8 |
| Open items (tasks + action items merged, sorted by due date) | Tasks 1, 3, 7 |
| 1:1 continuity (recent discussion_notes, next 1:1) | Tasks 1, 3, 7 |
| Coaching/dev + perf, discreet treatment | Tasks 3, 9 |
| Empty states first-class | Every card task (explicit empty branches) |
| Never surface `private_notes` | Task 3 (selects `discussion_notes` only) |
| Exclude `is_private` content | Task 3 (`.eq('is_private', false)`) |
| Lazy detail | Tasks 3, 4 (`enabled: !!...`) |
| Card order header→focus→team→open→1:1→coaching | Tasks 6-9 (insertion order) |
| Read-only | All tasks (no writes) |
| No em-dashes in copy | Global constraint; empty states use words |

No gaps.

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N". All code blocks are complete.

**3. Type consistency:** `DirectReportSummary`, `PersonDetail`, `PersonOpenItem`, `PersonOneOnOne`, `PersonCoachingEntry`, `PersonPerfReview`, `PersonTeamInitiative`, `PersonPppStatus`, `PersonTeamWork` defined once in Task 1 and consumed with matching field names throughout. Function names `sortOpenItems` / `splitOneOnOnes` consistent across Tasks 1, 2, 3. Hook names `useDirectReports` / `usePersonDetail` / `usePersonTeamWork` consistent across Tasks 2-8. Component prop shapes match their call sites.

## Notes for the implementer

- The app has **no pre-existing test suite**; Task 1 introduces vitest solely for the two pure helpers. Do not add React Testing Library or component tests — components are verified by typecheck + lint + the manual browser checks in each task.
- Known environment quirk: a sandboxed vite dev server can appear to hang on file reads. If `npm run dev` seems stuck, re-run with the sandbox disabled. There is no `start` script; use `npm run dev`. Kill a zombie server holding port 5173 with Ctrl+C (not Ctrl+Z).
- `react-markdown` import is the default export: `import Markdown from 'react-markdown'`.
