import { Document, FileChild } from 'docx'
import {
  title,
  subtitle,
  h1,
  h2,
  h3,
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

export interface GenericBriefSection {
  heading: string
  /** 1 = h1, 2 = h2, 3 = h3. Default: 2 */
  level?: 1 | 2 | 3
  paragraphs?: string[]
  bullets?: string[]
  /** Simple table: first row = headers, rest = data */
  table?: { headers: string[]; rows: string[][]; widths?: number[] }
}

export interface GenericBriefInput {
  title: string
  subtitle?: string
  date?: string
  sections: GenericBriefSection[]
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function generateGenericBrief(input: GenericBriefInput): Document {
  const headingFn = { 1: h1, 2: h2, 3: h3 }

  const children: FileChild[] = [
    title(input.title),
    ...(input.subtitle ? [subtitle(input.subtitle)] : []),
    ...(input.date ? [metadata('Date', input.date)] : []),
    divider(),
  ]

  for (const section of input.sections) {
    const hFn = headingFn[section.level ?? 2]
    children.push(hFn(section.heading))

    if (section.paragraphs) {
      for (const p of section.paragraphs) {
        children.push(body(p))
      }
    }

    if (section.bullets) {
      for (const b of section.bullets) {
        children.push(bullet(b))
      }
    }

    if (section.table) {
      children.push(
        styledTable(section.table.headers, section.table.rows, section.table.widths),
      )
      children.push(spacer())
    }
  }

  return new Document({
    styles: createDocumentStyles(),
    sections: [createSection(input.title, children)],
  })
}
