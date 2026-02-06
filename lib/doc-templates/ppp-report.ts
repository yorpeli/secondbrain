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

export interface PppSwimlane {
  workstream_name: string
  lead_name: string | null
  status: string
  quality_score: number | null
  quality_notes: string | null
  summary: string | null
  raw_text: string | null
  tags: string[] | null
}

export interface PppReportInput {
  week_date: string
  overall_summary: string | null
  swimlanes: PppSwimlane[]
  includeRawText?: boolean
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

function statusCell(status: string): Paragraph[] {
  return [
    new Paragraph({
      children: [statusText(status)],
    }),
  ]
}

function scoreDisplay(score: number | null): string {
  if (score == null) return '—'
  return `${score}/5`
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function generatePppReport(input: PppReportInput): Document {
  const weekLabel = `Week of ${formatDate(input.week_date)}`

  const children: FileChild[] = [
    title('CLM Weekly Status Report'),
    subtitle(weekLabel),
    metadata('Teams Reporting', String(input.swimlanes.length)),
    divider(),
  ]

  // Executive summary
  if (input.overall_summary) {
    children.push(h1('Executive Summary'))
    children.push(body(input.overall_summary))
  }

  // Status overview table
  children.push(h1('Workstream Status'))

  const widths = [30, 20, 20, 15, 15]

  const statusRows = input.swimlanes.map((s) => [
    s.workstream_name,
    s.lead_name ?? '—',
    statusCell(s.status),
    scoreDisplay(s.quality_score),
    (s.tags ?? []).join(', ') || '—',
  ] as (string | Paragraph[])[])

  children.push(
    styledTable(
      ['Workstream', 'Lead', 'Status', 'Score', 'Tags'],
      statusRows,
      widths,
    ),
  )
  children.push(spacer())

  // Per-swimlane detail
  children.push(h1('Workstream Details'))

  for (const swimlane of input.swimlanes) {
    children.push(h2(swimlane.workstream_name))

    // Status + lead line
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
          statusText(swimlane.status),
          new TextRun({
            text: `    Lead: ${swimlane.lead_name ?? '—'}`,
            font: Fonts.primary,
            size: Sizes.body,
            color: Colors.darkGray,
          }),
        ],
        spacing: { after: 120 },
      }),
    )

    if (swimlane.summary) {
      children.push(body(swimlane.summary))
    }

    if (swimlane.quality_notes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Quality Notes: ',
              font: Fonts.primary,
              size: Sizes.body,
              color: Colors.darkGray,
              bold: true,
            }),
            new TextRun({
              text: swimlane.quality_notes,
              font: Fonts.primary,
              size: Sizes.body,
              color: Colors.charcoal,
            }),
          ],
          spacing: { after: 120 },
        }),
      )
    }

    if (input.includeRawText && swimlane.raw_text) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Raw Report Text:',
              font: Fonts.primary,
              size: Sizes.small,
              color: Colors.darkGray,
              italics: true,
            }),
          ],
          spacing: { before: 80 },
        }),
      )
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: swimlane.raw_text,
              font: Fonts.primary,
              size: Sizes.small,
              color: Colors.darkGray,
            }),
          ],
          spacing: { after: 160 },
        }),
      )
    }

    children.push(divider())
  }

  return new Document({
    styles: createDocumentStyles(),
    sections: [createSection('CLM Weekly Status Report', children)],
  })
}
