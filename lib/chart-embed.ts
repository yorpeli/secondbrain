/**
 * Chart embedding helper for docx documents.
 *
 * Converts a PNG buffer from the data-viz agent into Paragraph[] with
 * ImageRun + optional caption, ready to insert into a docx section.
 */

import { Paragraph, ImageRun, TextRun } from 'docx'
import { Fonts, Colors, Sizes, Spacing } from './doc-style.js'

const MAX_WIDTH_PX = 550
const FONT = Fonts.primary

interface ChartParagraphOptions {
  buffer: Buffer
  width: number
  height: number
  caption?: string
}

/**
 * Create Paragraph[] for embedding a chart image in a docx document.
 * Width is auto-scaled to fit page (max ~550px). Aspect ratio preserved.
 */
export function chartParagraph(opts: ChartParagraphOptions): Paragraph[] {
  const scale = opts.width > MAX_WIDTH_PX ? MAX_WIDTH_PX / opts.width : 1
  const displayWidth = Math.round(opts.width * scale)
  const displayHeight = Math.round(opts.height * scale)

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new ImageRun({
          data: opts.buffer,
          transformation: { width: displayWidth, height: displayHeight },
          type: 'png',
        }),
      ],
      spacing: { before: 120, after: opts.caption ? 40 : Spacing.afterBody },
    }),
  ]

  if (opts.caption) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: opts.caption,
            font: FONT,
            size: Sizes.small,
            color: Colors.darkGray,
            italics: true,
          }),
        ],
        spacing: { after: Spacing.afterBody },
      }),
    )
  }

  return paragraphs
}
