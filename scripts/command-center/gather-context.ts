import 'dotenv/config'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../../lib/supabase.js'
import { writeDashboard, todayIso } from './build-dashboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const CC = join(ROOT, 'command-center')

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

  return [
    `# Focus — ${date}`,
    '',
    section('Current Focus', currentFocus),
    section('Active Initiatives', initiativesBody),
    section('Open Action Items', actionItems),
    section('Portfolio Headline', headline),
  ].join('\n')
}

function parseDateArg(): string {
  const arg = process.argv.find((a) => a.startsWith('--date='))
  return arg ? arg.slice('--date='.length) : todayIso()
}

async function main(): Promise<void> {
  const date = parseDateArg()
  const dayDir = join(CC, 'daily', date)
  mkdirSync(dayDir, { recursive: true })

  const doc = await buildFocusDoc(date)
  const focusPath = join(dayDir, '01-focus.md')
  writeFileSync(focusPath, doc, 'utf8')
  console.log(`focus written: ${focusPath}`)

  const dashPath = writeDashboard(date)
  console.log(`dashboard written: ${dashPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
