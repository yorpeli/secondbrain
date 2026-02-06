import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  HeightRule,
  Header,
  Footer,
  PageNumber,
  TabStopPosition,
  TabStopType,
  TableLayoutType,
  FileChild,
  IStylesOptions,
  ISectionOptions,
  convertInchesToTwip,
} from 'docx'

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

export const Colors = {
  midnightBlue: '002373',
  darkGray: '5D6D7E',
  charcoal: '1E1E28',
  white: 'FFFFFF',
  lightGray: 'F8F9FA',
  borderGray: 'D5D8DC',
  // Status
  onTrack: '2E7D32',
  potentialIssues: 'F57F17',
  atRisk: 'C62828',
} as const

export const Fonts = {
  primary: 'Avenir Next LT Pro',
  fallback: 'Arial',
} as const

const FONT = Fonts.primary

export const Sizes = {
  title: 48, // 24pt in half-points
  subtitle: 32, // 16pt
  h1: 36, // 18pt
  h2: 28, // 14pt
  h3: 24, // 12pt
  body: 22, // 11pt
  small: 20, // 10pt
  tableHeader: 20, // 10pt
  tableBody: 20, // 10pt
} as const

export const Spacing = {
  afterTitle: 120,
  afterSubtitle: 240,
  afterHeading: 120,
  afterBody: 160,
  afterBullet: 80,
  sectionGap: 360,
} as const

// ---------------------------------------------------------------------------
// Status color mapping
// ---------------------------------------------------------------------------

const statusColorMap: Record<string, string> = {
  'on-track': Colors.onTrack,
  'potential-issues': Colors.potentialIssues,
  'at-risk': Colors.atRisk,
}

const statusLabelMap: Record<string, string> = {
  'on-track': 'On Track',
  'potential-issues': 'Potential Issues',
  'at-risk': 'At Risk',
  na: 'N/A',
}

// ---------------------------------------------------------------------------
// Primitive builders
// ---------------------------------------------------------------------------

export function title(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.title,
        color: Colors.midnightBlue,
        bold: true,
      }),
    ],
    spacing: { after: Spacing.afterTitle },
  })
}

export function subtitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.subtitle,
        color: Colors.darkGray,
      }),
    ],
    spacing: { after: Spacing.afterSubtitle },
  })
}

export function h1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.h1,
        color: Colors.midnightBlue,
        bold: true,
      }),
    ],
    spacing: { before: Spacing.sectionGap, after: Spacing.afterHeading },
  })
}

export function h2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.h2,
        color: Colors.midnightBlue,
        bold: true,
      }),
    ],
    spacing: { before: 240, after: Spacing.afterHeading },
  })
}

export function h3(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.h3,
        color: Colors.charcoal,
        bold: true,
      }),
    ],
    spacing: { before: 200, after: Spacing.afterHeading },
  })
}

export function body(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.body,
        color: Colors.charcoal,
      }),
    ],
    spacing: { after: Spacing.afterBody },
  })
}

/** Body paragraph built from multiple TextRun children (for inline formatting) */
export function richBody(children: TextRun[]): Paragraph {
  return new Paragraph({
    children,
    spacing: { after: Spacing.afterBody },
  })
}

export function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: Sizes.body,
        color: Colors.charcoal,
      }),
    ],
    bullet: { level },
    spacing: { after: Spacing.afterBullet },
  })
}

/** "Label: Value" metadata line */
export function metadata(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        font: FONT,
        size: Sizes.body,
        color: Colors.darkGray,
        bold: true,
      }),
      new TextRun({
        text: value,
        font: FONT,
        size: Sizes.body,
        color: Colors.charcoal,
      }),
    ],
    spacing: { after: 80 },
  })
}

export function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: Spacing.sectionGap } })
}

/** Thin horizontal divider line */
export function divider(): Paragraph {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: Colors.borderGray,
        space: 1,
      },
    },
    spacing: { before: 120, after: 120 },
  })
}

/** Color-coded status text */
export function statusText(status: string): TextRun {
  const color = statusColorMap[status] ?? Colors.charcoal
  const label = statusLabelMap[status] ?? status
  return new TextRun({
    text: label,
    font: FONT,
    size: Sizes.tableBody,
    color,
    bold: true,
  })
}

// ---------------------------------------------------------------------------
// Table builders
// ---------------------------------------------------------------------------

function cellBorders() {
  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: Colors.borderGray,
  }
  return { top: border, bottom: border, left: border, right: border }
}

/** Header row cell: white text on midnight blue */
function headerCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT,
            size: Sizes.tableHeader,
            color: Colors.white,
            bold: true,
          }),
        ],
      }),
    ],
    shading: { type: ShadingType.CLEAR, fill: Colors.midnightBlue },
    borders: cellBorders(),
    ...(widthPct != null
      ? { width: { size: widthPct, type: WidthType.PERCENTAGE } }
      : {}),
  })
}

/** Data row cell — supports plain text or custom children */
function dataCell(
  content: string | Paragraph[],
  opts?: { shaded?: boolean; widthPct?: number },
): TableCell {
  const children =
    typeof content === 'string'
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: content,
                font: FONT,
                size: Sizes.tableBody,
                color: Colors.charcoal,
              }),
            ],
          }),
        ]
      : content

  return new TableCell({
    children,
    shading: opts?.shaded
      ? { type: ShadingType.CLEAR, fill: Colors.lightGray }
      : undefined,
    borders: cellBorders(),
    ...(opts?.widthPct != null
      ? { width: { size: opts.widthPct, type: WidthType.PERCENTAGE } }
      : {}),
  })
}

/** Build a full header row */
export function headerRow(
  labels: string[],
  widths?: number[],
): TableRow {
  return new TableRow({
    children: labels.map((label, i) =>
      headerCell(label, widths?.[i]),
    ),
    tableHeader: true,
    height: { value: 400, rule: HeightRule.ATLEAST },
  })
}

/** Build a data row. Items can be strings or Paragraph[] for rich content. */
export function dataRow(
  items: (string | Paragraph[])[],
  opts?: { shaded?: boolean; widths?: number[] },
): TableRow {
  return new TableRow({
    children: items.map((item, i) =>
      dataCell(item, {
        shaded: opts?.shaded,
        widthPct: opts?.widths?.[i],
      }),
    ),
  })
}

/** Full styled table from header + data rows */
export function styledTable(
  headers: string[],
  rows: (string | Paragraph[])[][],
  widths?: number[],
): Table {
  return new Table({
    rows: [
      headerRow(headers, widths),
      ...rows.map((row, i) =>
        dataRow(row, { shaded: i % 2 === 1, widths }),
      ),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  })
}

// ---------------------------------------------------------------------------
// Document-level styles
// ---------------------------------------------------------------------------

export function createDocumentStyles(): IStylesOptions {
  return {
    default: {
      document: {
        run: {
          font: FONT,
          size: Sizes.body,
          color: Colors.charcoal,
        },
        paragraph: {
          spacing: { after: Spacing.afterBody },
        },
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Page header / footer
// ---------------------------------------------------------------------------

export function createHeader(text: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT,
            size: 16, // 8pt
            color: Colors.darkGray,
          }),
        ],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: Colors.borderGray,
            space: 4,
          },
        },
        spacing: { after: 200 },
      }),
    ],
  })
}

export function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Payoneer CLM',
            font: FONT,
            size: 16,
            color: Colors.darkGray,
          }),
          new TextRun({
            children: ['\t'],
          }),
          new TextRun({
            text: 'Page ',
            font: FONT,
            size: 16,
            color: Colors.darkGray,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: 16,
            color: Colors.darkGray,
          }),
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: TabStopPosition.MAX,
          },
        ],
        border: {
          top: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: Colors.borderGray,
            space: 4,
          },
        },
      }),
    ],
  })
}

// ---------------------------------------------------------------------------
// Section builder (reusable)
// ---------------------------------------------------------------------------

/** Build a complete section with branded header, footer, and margins */
export function createSection(
  headerText: string,
  children: readonly FileChild[],
): ISectionOptions {
  return {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1),
        },
      },
    },
    headers: {
      default: createHeader(headerText),
    },
    footers: {
      default: createFooter(),
    },
    children,
  }
}
