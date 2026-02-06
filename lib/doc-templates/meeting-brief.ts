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
  bullet,
  metadata,
  spacer,
  divider,
  styledTable,
  createDocumentStyles,
  createSection,
} from '../doc-style.js'

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface PersonContext {
  name: string
  role: string | null
  team_name: string | null
  type: string | null
  working_style: string | null
  strengths: string[] | null
  growth_areas: string[] | null
  current_focus: string | null
  relationship_notes: string | null
}

export interface MeetingRecord {
  date: string
  topic: string | null
  discussion_notes: string | null
}

export interface ActionItem {
  description: string
  status: string
  due_date: string | null
  meeting_topic: string | null
}

export interface CoachingNote {
  content: string
  date: string | null
}

export interface MeetingBriefInput {
  person: PersonContext
  date?: string
  recentMeetings: MeetingRecord[]
  openActions: ActionItem[]
  coachingNotes: CoachingNote[]
  suggestedTopics?: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function generateMeetingBrief(input: MeetingBriefInput): Document {
  const { person } = input
  const briefTitle = `1:1 Brief — ${person.name}`
  const dateStr = input.date ?? new Date().toISOString().split('T')[0]

  const children: FileChild[] = [
    title(briefTitle),
    subtitle(formatDate(dateStr)),
    divider(),
  ]

  // Person context section
  children.push(h1('Person Context'))
  children.push(metadata('Name', person.name))
  if (person.role) children.push(metadata('Role', person.role))
  if (person.team_name) children.push(metadata('Team', person.team_name))
  if (person.type) children.push(metadata('Relationship', person.type))

  if (person.current_focus) {
    children.push(spacer())
    children.push(h2('Current Focus'))
    children.push(body(person.current_focus))
  }

  if (person.working_style) {
    children.push(h2('Working Style'))
    children.push(body(person.working_style))
  }

  if (person.strengths?.length) {
    children.push(h2('Strengths'))
    for (const s of person.strengths) {
      children.push(bullet(s))
    }
  }

  if (person.growth_areas?.length) {
    children.push(h2('Growth Areas'))
    for (const g of person.growth_areas) {
      children.push(bullet(g))
    }
  }

  if (person.relationship_notes) {
    children.push(h2('Relationship Notes'))
    children.push(body(person.relationship_notes))
  }

  children.push(divider())

  // Recent meetings
  if (input.recentMeetings.length > 0) {
    children.push(h1('Recent Meetings'))

    for (const meeting of input.recentMeetings) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formatDate(meeting.date),
              font: Fonts.primary,
              size: Sizes.body,
              color: Colors.midnightBlue,
              bold: true,
            }),
            new TextRun({
              text: meeting.topic ? ` — ${meeting.topic}` : '',
              font: Fonts.primary,
              size: Sizes.body,
              color: Colors.charcoal,
            }),
          ],
          spacing: { after: 80 },
        }),
      )

      if (meeting.discussion_notes) {
        children.push(body(meeting.discussion_notes))
      }
    }

    children.push(divider())
  }

  // Open action items
  if (input.openActions.length > 0) {
    children.push(h1('Open Action Items'))

    const actionRows = input.openActions.map((a) => [
      a.description,
      a.status,
      a.due_date ? formatDate(a.due_date) : '—',
      a.meeting_topic ?? '—',
    ])

    children.push(
      styledTable(
        ['Action Item', 'Status', 'Due', 'From Meeting'],
        actionRows,
        [40, 15, 20, 25],
      ),
    )
    children.push(spacer())
  }

  // Coaching notes
  if (input.coachingNotes.length > 0) {
    children.push(h1('Coaching Notes'))

    for (const note of input.coachingNotes) {
      if (note.date) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: formatDate(note.date),
                font: Fonts.primary,
                size: Sizes.small,
                color: Colors.darkGray,
                italics: true,
              }),
            ],
            spacing: { after: 40 },
          }),
        )
      }
      children.push(body(note.content))
    }

    children.push(divider())
  }

  // Suggested topics
  if (input.suggestedTopics?.length) {
    children.push(h1('Suggested Topics'))
    for (const topic of input.suggestedTopics) {
      children.push(bullet(topic))
    }
  }

  return new Document({
    styles: createDocumentStyles(),
    sections: [createSection(briefTitle, children)],
  })
}
