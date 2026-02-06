import { Document, Paragraph, TextRun, FileChild } from 'docx'
import {
  Colors,
  Fonts,
  Sizes,
  title,
  subtitle,
  h1,
  h2,
  body,
  metadata,
  spacer,
  divider,
  statusText,
  styledTable,
  createDocumentStyles,
  createSection,
} from '../doc-style.js'

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface InitiativeData {
  title: string
  slug: string
  status: string
  priority: string | null
  objective: string | null
  why_it_matters: string | null
  start_date: string | null
  target_date: string | null
  owner_name: string | null
}

export interface Stakeholder {
  name: string
  role_in_initiative: string | null
  person_role: string | null
}

export interface TaskItem {
  title: string
  status: string
  priority: string | null
  owner_name: string | null
  due_date: string | null
}

export interface CharterInput {
  initiative: InitiativeData
  stakeholders: Stakeholder[]
  tasks: TaskItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function priorityLabel(priority: string | null): string {
  if (!priority) return '—'
  return priority.toUpperCase()
}

function taskStatusCell(status: string): Paragraph[] {
  const colorMap: Record<string, string> = {
    done: Colors.onTrack,
    'in-progress': Colors.potentialIssues,
    blocked: Colors.atRisk,
    todo: Colors.darkGray,
  }
  const color = colorMap[status] ?? Colors.charcoal
  const label = status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: label,
          font: Fonts.primary,
          size: Sizes.tableBody,
          color,
          bold: true,
        }),
      ],
    }),
  ]
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function generateCharter(input: CharterInput): Document {
  const { initiative } = input
  const charterTitle = `Initiative Charter: ${initiative.title}`

  const children: FileChild[] = [
    title(initiative.title),
    subtitle('Initiative Charter'),
    divider(),
  ]

  // Overview
  children.push(h1('Overview'))
  children.push(metadata('Owner', initiative.owner_name ?? '—'))
  children.push(metadata('Priority', priorityLabel(initiative.priority)))
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Status: ',
          font: Fonts.primary,
          size: Sizes.body,
          color: Colors.darkGray,
          bold: true,
        }),
        statusText(initiative.status),
      ],
      spacing: { after: 80 },
    }),
  )

  if (initiative.objective) {
    children.push(h2('Objective'))
    children.push(body(initiative.objective))
  }

  if (initiative.why_it_matters) {
    children.push(h2('Why It Matters'))
    children.push(body(initiative.why_it_matters))
  }

  // Timeline
  if (initiative.start_date || initiative.target_date) {
    children.push(h1('Timeline'))
    if (initiative.start_date) {
      children.push(metadata('Start Date', formatDate(initiative.start_date)))
    }
    if (initiative.target_date) {
      children.push(metadata('Target Date', formatDate(initiative.target_date)))
    }
  }

  children.push(divider())

  // Stakeholders
  if (input.stakeholders.length > 0) {
    children.push(h1('Stakeholders'))

    const stakeholderRows = input.stakeholders.map((s) => [
      s.name,
      s.role_in_initiative ?? '—',
      s.person_role ?? '—',
    ])

    children.push(
      styledTable(
        ['Name', 'Role in Initiative', 'Title'],
        stakeholderRows,
        [30, 35, 35],
      ),
    )
    children.push(spacer())
  }

  // Task breakdown
  if (input.tasks.length > 0) {
    children.push(h1('Task Breakdown'))

    const taskRows = input.tasks.map((t) => [
      t.title,
      t.owner_name ?? '—',
      taskStatusCell(t.status),
      priorityLabel(t.priority),
      t.due_date ? formatDate(t.due_date) : '—',
    ] as (string | Paragraph[])[])

    children.push(
      styledTable(
        ['Task', 'Owner', 'Status', 'Priority', 'Due Date'],
        taskRows,
        [30, 20, 15, 15, 20],
      ),
    )
  }

  return new Document({
    styles: createDocumentStyles(),
    sections: [createSection(charterTitle, children)],
  })
}
