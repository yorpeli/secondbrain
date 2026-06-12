import 'dotenv/config'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../../lib/supabase.js'
import { writeDashboard, todayIso } from './build-dashboard.js'
import { upsertFocus } from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

interface InitiativeRow {
  slug: string
  title: string
  status: string
  priority: string | null
  assigned_agent: string | null
}

interface ActionItemRow {
  description: string | null
  owner_name: string | null
  due_date: string | null
}

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim() || '_none_'}\n`
}

interface PersonRow {
  id: string
  name: string
  type: string
  slug: string
}
interface StakeholderRow {
  person_id: string
  initiative_id: string
  role: string | null
}
interface InitiativeIdRow {
  id: string
  title: string
}

async function buildWhoMatters(
  supabase: ReturnType<typeof getSupabase>
): Promise<string> {
  // Leadership + direct reports (exclude Yonatan's own row).
  const { data: core, error: coreErr } = await supabase
    .from('people' as any)
    .select('id, name, type, slug')
    .eq('status', 'active')
    .in('type', ['leadership', 'direct-report'])
    .neq('slug', 'yonatan-orpeli')
  if (coreErr) throw coreErr
  const people = (core as unknown as PersonRow[]) ?? []
  const leadership = people.filter((p) => p.type === 'leadership').map((p) => p.name)
  const directs = people.filter((p) => p.type === 'direct-report').map((p) => p.name)

  // Active-initiative stakeholders — plain joins in JS (no embed).
  const { data: actInits, error: aiErr } = await supabase
    .from('initiatives' as any)
    .select('id, title')
    .eq('status', 'active')
  if (aiErr) throw aiErr
  const titleById = new Map<string, string>(
    ((actInits as unknown as InitiativeIdRow[]) ?? []).map((i) => [i.id, i.title])
  )

  const { data: stk, error: stkErr } = await supabase
    .from('initiative_stakeholders' as any)
    .select('person_id, initiative_id, role')
  if (stkErr) throw stkErr

  const { data: ppl, error: pplErr } = await supabase
    .from('people' as any)
    .select('id, name')
    .eq('status', 'active')
  if (pplErr) throw pplErr
  const nameById = new Map<string, string>(
    ((ppl as unknown as { id: string; name: string }[]) ?? []).map((p) => [p.id, p.name])
  )

  const stakeholderLines = ((stk as unknown as StakeholderRow[]) ?? [])
    .filter((s) => titleById.has(s.initiative_id) && nameById.has(s.person_id))
    .map(
      (s) =>
        `- ${nameById.get(s.person_id)} (${s.role ?? 'stakeholder'} · ${titleById.get(
          s.initiative_id
        )})`
    )

  const parts: string[] = []
  if (leadership.length) parts.push(`**Leadership:** ${leadership.join(', ')}`)
  if (directs.length) parts.push(`**Direct reports:** ${directs.join(', ')}`)
  if (stakeholderLines.length)
    parts.push(`**Active-initiative stakeholders:**\n${stakeholderLines.join('\n')}`)
  return parts.join('\n\n')
}

interface TaskRow { title: string; priority: string | null; due_date: string | null; initiative_id: string | null }

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
    const { data: inits, error: initsErr } = await supabase
      .from('initiatives' as any).select('id, title').in('id', initIds)
    if (initsErr) console.warn('buildMyTasks: could not resolve initiative titles', initsErr)
    for (const i of (inits as unknown as { id: string; title: string }[]) ?? []) titleById.set(i.id, i.title)
  }
  return tasks
    .sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'P3'] ?? 9) - (PRIORITY_ORDER[b.priority ?? 'P3'] ?? 9) || (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .map((t) => {
      const segs = [`[${t.priority ?? 'P2'}] ${t.title}`]
      if (t.due_date) segs.push(`due ${t.due_date}`)
      if (t.initiative_id && titleById.has(t.initiative_id)) segs.push(titleById.get(t.initiative_id)!)
      return `- ${segs.join(' · ')}`
    })
    .join('\n')
}

async function buildFocusDoc(date: string): Promise<string> {
  const supabase = getSupabase()

  // 1. current_focus (live priorities)
  const { data: cf, error: cfErr } = await supabase
    .from('context_store' as any)
    .select('content')
    .eq('key', 'current_focus')
    .maybeSingle()
  if (cfErr) throw cfErr
  const currentFocus =
    cf && (cf as any).content
      ? typeof (cf as any).content === 'string'
        ? (cf as any).content
        : JSON.stringify((cf as any).content, null, 2)
      : ''

  // 2. active initiatives
  const { data: inits, error: initsErr } = await supabase
    .from('initiatives' as any)
    .select('slug, title, status, priority, assigned_agent')
    .eq('status', 'active')
  if (initsErr) throw initsErr
  const initiatives = ((inits as unknown as InitiativeRow[]) ?? []).sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? ''] ?? 9
    const pb = PRIORITY_ORDER[b.priority ?? ''] ?? 9
    return pa - pb || a.title.localeCompare(b.title)
  })
  const initiativesBody = initiatives
    .map(
      (i) =>
        `- **${i.title}** (${i.priority ?? '—'}) — ${i.status} · owner: ${
          i.assigned_agent ?? '—'
        }`
    )
    .join('\n')

  // 3. open action items (view: v_open_action_items)
  const { data: ai, error: aiErr } = await supabase
    .from('v_open_action_items' as any)
    .select('description, owner_name, due_date')
    .limit(25) // cap at 25 open items for daily-brief readability
  if (aiErr) throw aiErr
  const actionItems = ((ai as unknown as ActionItemRow[]) ?? [])
    .map((a) => {
      const due = a.due_date ? ` (due ${a.due_date})` : ''
      const owner = a.owner_name ? ` — ${a.owner_name}` : ''
      return `- ${a.description ?? '(no description)'}${owner}${due}`
    })
    .join('\n')

  // 4. portfolio headline from the initiative-review highlights snapshot
  let headline = ''
  const hlPath = join(ROOT, 'scripts', 'initiative-review', 'highlights.json')
  if (existsSync(hlPath)) {
    try {
      const hl = JSON.parse(readFileSync(hlPath, 'utf8')) as {
        _overview?: { headline?: string }
      }
      headline = hl._overview?.headline ?? ''
    } catch {
      headline = ''
    }
  }

  // 5. people who matter today (name-based salience for the MSFT capture agent)
  const whoMatters = await buildWhoMatters(supabase)

  // 6. my open follow-up tasks (tasks table → dashboard tasks zone)
  const myTasks = await buildMyTasks(supabase)

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
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

async function main(): Promise<void> {
  const date = parseDateArg()

  const doc = await buildFocusDoc(date)
  await upsertFocus(date, doc)
  console.log(`focus written: command_center_days.${date}`)

  const dashPath = await writeDashboard(date)
  console.log(`dashboard written: ${dashPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
