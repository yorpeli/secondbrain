import { Packer } from 'docx'
import * as fs from 'fs'
import * as path from 'path'
import {
  DocumentType,
  templateInfo,
  generatePppReport,
  generateMeetingBrief,
  generateCharter,
  generateGenericBrief,
} from '../lib/doc-templates/index.js'
import type {
  PppReportInput,
  MeetingBriefInput,
  CharterInput,
  GenericBriefInput,
} from '../lib/doc-templates/index.js'

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  type: string
  params: Record<string, string>
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2)
  if (args.length === 0) {
    printUsage()
    process.exit(1)
  }

  const type = args[0]
  const params: Record<string, string> = {}

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=')
      if (eqIdx !== -1) {
        params[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1)
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        params[arg.slice(2)] = args[++i]
      } else {
        params[arg.slice(2)] = 'true'
      }
    }
  }

  return { type, params }
}

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/generate-doc.ts <type> [--param=value ...]

Document types:
`)
  for (const info of Object.values(templateInfo)) {
    const required = info.requiredParams.map((p) => `--${p}=<value>`).join(' ')
    const optional = info.optionalParams.map((p) => `[--${p}=<value>]`).join(' ')
    console.log(`  ${info.type}  ${required} ${optional}`)
    console.log(`    ${info.description}\n`)
  }

  console.log(`Examples:
  npx tsx scripts/generate-doc.ts ppp-report --week=2025-01-27
  npx tsx scripts/generate-doc.ts meeting-brief --person=elad-schnarch
  npx tsx scripts/generate-doc.ts charter --initiative=kyc-new-flow
  npx tsx scripts/generate-doc.ts generic-brief --input=data.json
`)
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function ensureOutputDir(): string {
  const dir = path.join(process.cwd(), 'output')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function outputPath(type: string, label: string): string {
  const dir = ensureOutputDir()
  const timestamp = new Date().toISOString().slice(0, 10)
  const safeName = label.replace(/[^a-zA-Z0-9-]/g, '-')
  return path.join(dir, `${type}_${safeName}_${timestamp}.docx`)
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

/** Lazy-load Supabase client (avoids env var check when not needed) */
async function getDb() {
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase()
}

async function fetchPppData(weekDate: string, includeRaw: boolean): Promise<PppReportInput> {
  const db = await getDb()

  const { data: report, error: reportErr } = await db
    .from('ppp_reports')
    .select('week_date, overall_summary')
    .eq('week_date', weekDate)
    .single()

  if (reportErr || !report) {
    throw new Error(`PPP report not found for week ${weekDate}: ${reportErr?.message}`)
  }

  const { data: swimlanes, error: swimErr } = await db
    .from('v_ppp_swimlanes' as any)
    .select('workstream_name, lead_name, status, quality_score, quality_notes, summary, raw_text, tags')
    .eq('week_date', weekDate)
    .order('workstream_name')

  if (swimErr) {
    throw new Error(`Failed to fetch swimlanes: ${swimErr.message}`)
  }

  return {
    week_date: report.week_date,
    overall_summary: report.overall_summary,
    swimlanes: (swimlanes ?? []) as unknown as PppReportInput['swimlanes'],
    includeRawText: includeRaw,
  }
}

async function fetchMeetingBriefData(personSlug: string, date?: string): Promise<MeetingBriefInput> {
  const db = await getDb()

  // Fetch person via v_org_tree view
  const { data: person, error: personErr } = await db
    .from('v_org_tree' as any)
    .select('name, role, team_name, type, working_style, strengths, growth_areas, current_focus, relationship_notes')
    .eq('slug', personSlug)
    .single()

  if (personErr || !person) {
    throw new Error(`Person not found: ${personSlug}: ${personErr?.message}`)
  }

  // Fetch person ID for FK lookups
  const { data: personRow } = await db
    .from('people')
    .select('id')
    .eq('slug', personSlug)
    .single()

  const personId = personRow?.id

  // Recent meetings (last 5 with this person)
  let recentMeetings: MeetingBriefInput['recentMeetings'] = []
  if (personId) {
    const { data: meetings } = await db
      .from('v_meetings_with_attendees' as any)
      .select('date, topic, discussion_notes')
      .contains('attendee_ids' as any, [personId])
      .order('date', { ascending: false })
      .limit(5)

    recentMeetings = (meetings ?? []) as unknown as MeetingBriefInput['recentMeetings']
  }

  // Open action items
  let openActions: MeetingBriefInput['openActions'] = []
  if (personId) {
    const { data: actions } = await db
      .from('v_open_action_items' as any)
      .select('description, status, due_date, meeting_topic')
      .eq('owner_id', personId)

    openActions = (actions ?? []) as unknown as MeetingBriefInput['openActions']
  }

  // Coaching notes (non-private content_sections)
  let coachingNotes: MeetingBriefInput['coachingNotes'] = []
  if (personId) {
    const { data: notes } = await db
      .from('content_sections')
      .select('content, date')
      .eq('entity_type', 'person')
      .eq('entity_id', personId)
      .eq('section_type', 'coaching-log')
      .eq('is_private', false)
      .order('date', { ascending: false })
      .limit(5)

    coachingNotes = (notes ?? []).map((n) => ({
      content: n.content,
      date: n.date,
    }))
  }

  return {
    person: person as unknown as MeetingBriefInput['person'],
    date,
    recentMeetings,
    openActions,
    coachingNotes,
  }
}

async function fetchCharterData(initiativeSlug: string): Promise<CharterInput> {
  const db = await getDb()

  // Fetch initiative
  const { data: initiative, error: initErr } = await db
    .from('initiatives')
    .select('id, title, slug, status, priority, objective, why_it_matters, start_date, target_date, owner_id')
    .eq('slug', initiativeSlug)
    .single()

  if (initErr || !initiative) {
    throw new Error(`Initiative not found: ${initiativeSlug}: ${initErr?.message}`)
  }

  // Resolve owner name
  let ownerName: string | null = null
  if (initiative.owner_id) {
    const { data: owner } = await db
      .from('people')
      .select('name')
      .eq('id', initiative.owner_id)
      .single()
    ownerName = owner?.name ?? null
  }

  // Stakeholders
  const { data: stakeholders } = await db
    .from('initiative_stakeholders')
    .select('role, person_id')
    .eq('initiative_id', initiative.id)

  const stakeholderList: CharterInput['stakeholders'] = []
  for (const s of stakeholders ?? []) {
    const { data: p } = await db
      .from('people')
      .select('name, role')
      .eq('id', s.person_id)
      .single()
    stakeholderList.push({
      name: p?.name ?? '—',
      role_in_initiative: s.role,
      person_role: p?.role ?? null,
    })
  }

  // Tasks
  const { data: tasks } = await db
    .from('tasks')
    .select('title, status, priority, owner_id, due_date')
    .eq('initiative_id', initiative.id)
    .order('priority')

  const taskList: CharterInput['tasks'] = []
  for (const t of tasks ?? []) {
    let taskOwnerName: string | null = null
    if (t.owner_id) {
      const { data: owner } = await db
        .from('people')
        .select('name')
        .eq('id', t.owner_id)
        .single()
      taskOwnerName = owner?.name ?? null
    }
    taskList.push({
      title: t.title,
      status: t.status ?? 'todo',
      priority: t.priority,
      owner_name: taskOwnerName,
      due_date: t.due_date,
    })
  }

  return {
    initiative: {
      title: initiative.title,
      slug: initiative.slug,
      status: initiative.status ?? 'planned',
      priority: initiative.priority,
      objective: initiative.objective,
      why_it_matters: initiative.why_it_matters,
      start_date: initiative.start_date,
      target_date: initiative.target_date,
      owner_name: ownerName,
    },
    stakeholders: stakeholderList,
    tasks: taskList,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { type, params } = parseArgs(process.argv)

  // Validate type
  const validTypes = Object.values(DocumentType) as string[]
  if (!validTypes.includes(type)) {
    console.error(`Unknown document type: ${type}`)
    console.error(`Valid types: ${validTypes.join(', ')}`)
    process.exit(1)
  }

  const info = templateInfo[type as DocumentType]

  // Validate required params
  for (const p of info.requiredParams) {
    if (!params[p]) {
      console.error(`Missing required parameter: --${p}`)
      console.error(`Required for ${type}: ${info.requiredParams.map((r) => `--${r}`).join(', ')}`)
      process.exit(1)
    }
  }

  console.log(`Generating ${type}...`)

  let doc
  let label: string

  switch (type as DocumentType) {
    case DocumentType.PPP_REPORT: {
      const data = await fetchPppData(params.week, params.raw === 'true')
      doc = generatePppReport(data)
      label = params.week
      break
    }

    case DocumentType.MEETING_BRIEF: {
      const data = await fetchMeetingBriefData(params.person, params.date)
      doc = generateMeetingBrief(data)
      label = params.person
      break
    }

    case DocumentType.CHARTER: {
      const data = await fetchCharterData(params.initiative)
      doc = generateCharter(data)
      label = params.initiative
      break
    }

    case DocumentType.GENERIC_BRIEF: {
      const inputPath = path.resolve(params.input)
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`)
      }
      const raw = fs.readFileSync(inputPath, 'utf-8')
      const data: GenericBriefInput = JSON.parse(raw)
      doc = generateGenericBrief(data)
      label = data.title.slice(0, 30)
      break
    }

    default:
      throw new Error(`Unhandled document type: ${type}`)
  }

  const buffer = await Packer.toBuffer(doc)
  const filePath = outputPath(type, label)
  fs.writeFileSync(filePath, buffer)
  console.log(`Generated: ${filePath}`)
}

main().catch((err) => {
  console.error('Error:', err.message ?? err)
  process.exit(1)
})
