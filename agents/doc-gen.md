# Document Generation Agent

## Purpose

Generate consistently styled .docx documents from Second Brain data. Documents follow the Payoneer brand guidelines (minimalistic, monochrome-first, Avenir Next font) blended with clean executive structure.

## Tools Available

- **Supabase MCP**: Fetch data from people, meetings, PPP, initiatives tables/views
- **Bash**: Run `npx tsx scripts/generate-doc.ts` to generate documents
- **Read/Write**: Read input files, write output documents

## Document Types

| Type | Description | Required Params |
|------|-------------|-----------------|
| `ppp-report` | Weekly CLM status report | `--week=YYYY-MM-DD` |
| `meeting-brief` | 1:1 preparation brief | `--person=<slug>` |
| `charter` | Initiative charter | `--initiative=<slug>` |
| `generic-brief` | Flexible document from JSON | `--input=<path>` |

## Invocation Pattern

**Use when:**
- User needs a document generated for a meeting, review, or presentation
- Preparing for a 1:1 (generate meeting brief)
- Weekly status review (generate PPP report)
- Initiative kickoff or review (generate charter)
- Any ad-hoc structured document need (generic brief)

**PMM review:** For leadership-facing documents, consider invoking the PMM agent (`agents/pmm.md`) for a voice review of text content before generating the document. Use `quick` depth for routine docs, `standard` for charters and initiative descriptions.

**CLI usage:**
```bash
npx tsx scripts/generate-doc.ts <type> [--param=value ...]
```

**Examples:**
```bash
# Weekly PPP report
npx tsx scripts/generate-doc.ts ppp-report --week=2025-01-27

# 1:1 prep brief for Elad
npx tsx scripts/generate-doc.ts meeting-brief --person=elad-schnarch

# Initiative charter
npx tsx scripts/generate-doc.ts charter --initiative=kyc-new-flow

# Generic brief from JSON data
npx tsx scripts/generate-doc.ts generic-brief --input=data.json
```

## Architecture

```
lib/doc-style.ts           -- Brand constants + primitive builders
lib/doc-templates/
  index.ts                 -- Registry + barrel exports
  ppp-report.ts            -- Weekly PPP status report
  meeting-brief.ts         -- 1:1 preparation brief
  charter.ts               -- Initiative charter
  generic-brief.ts         -- Flexible catch-all template
scripts/generate-doc.ts    -- CLI entry point (arg parsing + Supabase data fetching)
```

Data flow: `CLI args -> Supabase fetch -> template function -> docx Document -> Packer -> .docx file`

**Key design decisions:**
- Templates are pure functions (data in, Document out). No Supabase calls inside templates.
- Single style file (`doc-style.ts`) is the source of truth for all visual constants.
- Output goes to `output/` directory (gitignored).

## Style Spec

- **Font**: Avenir Next LT Pro (fallback: Arial)
- **Title**: 24pt, Midnight Blue `#002373`, bold
- **H1**: 18pt, Midnight Blue, bold
- **H2**: 14pt, Midnight Blue, bold
- **Body**: 11pt, Charcoal `#1E1E28`
- **Tables**: White on `#002373` headers, alternating `#F8F9FA` rows
- **Status colors**: On Track `#2E7D32`, Potential Issues `#F57F17`, At Risk `#C62828`

## Generic Brief JSON Format

For the `generic-brief` type, provide a JSON file:

```json
{
  "title": "Document Title",
  "subtitle": "Optional subtitle",
  "date": "2025-01-27",
  "sections": [
    {
      "heading": "Section Name",
      "level": 2,
      "paragraphs": ["Paragraph text..."],
      "bullets": ["Bullet point 1", "Bullet point 2"],
      "table": {
        "headers": ["Col 1", "Col 2"],
        "rows": [["val1", "val2"]],
        "widths": [50, 50]
      }
    }
  ]
}
```

## Logging

Log to `agent_log` when:
- Generating a document that reveals notable patterns (category: `observation`)
- Encountering data quality issues during generation (category: `error`)

**Don't log:**
- Routine document generation
- Expected empty data sets
