/**
 * AB Testing Agent — Asana MCP Helpers
 *
 * Wrappers for querying the Asana MCP to extract experiment metadata
 * from the AB Tests board. These functions are designed to be called
 * from bootstrap.ts and any future sync commands.
 *
 * IMPORTANT: These helpers format the data but do NOT call the MCP directly.
 * The caller (bootstrap.ts, run from Claude Code) will use the Asana MCP tool
 * to fetch raw task data, then pass it through these parsers.
 */

import { SECTION_TO_LIFECYCLE, type ExperimentLifecycle } from '../config/constants.js'
import type { Experiment } from './types.js'

// ─── Types for Asana task data ───────────────────────────────

export interface AsanaTask {
  gid: string
  name: string
  notes?: string
  completed?: boolean
  memberships?: Array<{ section?: { name: string; gid: string } }>
  custom_fields?: Array<{
    gid: string
    name: string
    display_value?: string | null
    text_value?: string | null
    number_value?: number | null
    enum_value?: { name: string; gid: string } | null
    multi_enum_values?: Array<{ name: string; gid: string }>
  }>
  permalink_url?: string
}

// ─── Parsing ─────────────────────────────────────────────────

/**
 * Parse an Asana task into an Experiment object.
 * Returns null if the task is a template or has no name.
 */
export function parseExperimentFromTask(task: AsanaTask): Experiment | null {
  if (!task.name || task.name.startsWith('[Template')) return null

  const fields = parseCustomFields(task.custom_fields ?? [])
  const notesData = parseNotes(task.notes ?? '')
  const lifecycle = resolveLifecycle(task)

  const expid = fields['EXPID'] || extractExpid(task.name) || `TASK-${task.gid.slice(-6)}`
  const slug = toSlug(task.name)

  return {
    slug,
    name: task.name,
    expid,
    asana_task_id: task.gid,
    experiment_id: notesData.experimentId ?? fields['Experiment ID'] ?? null,
    lifecycle,

    hypothesis: fields['Hypothesis'] ?? notesData.hypothesis ?? null,
    objective: fields['Objective'] ?? null,
    main_kpis: parseList(fields['Main KPIs'] ?? fields['KPIs'] ?? ''),
    success_criteria: fields['Success Criteria'] ?? null,
    owner: fields['PM'] ?? fields['Owner'] ?? null,
    audience: fields['Audience'] ?? fields['Target Audience'] ?? null,
    start_date: fields['Start Date'] ?? null,
    estimated_end_date: fields['Estimated End Date'] ?? null,
    end_date: fields['End Date'] ?? null,
    result: fields['Result'] ?? null,
    decision: fields['Decision'] ?? null,
    quarter: fields['Quarter'] ?? null,
    winning_variant: fields['Winning Variant'] ?? null,

    looker_filter: null, // Set manually after bootstrap
    link_to_analysis: notesData.analysisLink ?? null,
    link_to_measurement: notesData.measurementLink ?? null,
    link_to_design: notesData.designLink ?? null,

    tags: [],
    analysis_history: [],
    notes: null,
  }
}

/**
 * Filter tasks to CLM domain only (based on Domain custom field).
 * If no Domain field exists, include the task (assume CLM board).
 */
export function filterCLMTasks(tasks: AsanaTask[]): AsanaTask[] {
  return tasks.filter(task => {
    const domainField = (task.custom_fields ?? []).find(
      f => f.name?.toLowerCase() === 'domain'
    )
    if (!domainField) return true // No domain field → include
    const val = domainField.enum_value?.name ?? domainField.display_value ?? ''
    return val === '' || val.toUpperCase().includes('CLM')
  })
}

// ─── Internal Helpers ────────────────────────────────────────

function parseCustomFields(fields: AsanaTask['custom_fields']): Record<string, string> {
  const result: Record<string, string> = {}
  for (const f of fields ?? []) {
    if (!f.name) continue
    const val = f.display_value
      ?? f.text_value
      ?? f.enum_value?.name
      ?? (f.multi_enum_values?.map(v => v.name).join(', '))
      ?? (f.number_value != null ? String(f.number_value) : '')
      ?? ''
    if (val) result[f.name] = val
  }
  return result
}

interface ParsedNotes {
  experimentId: string | null
  hypothesis: string | null
  lookIds: number[]
  dashboardIds: number[]
  analysisLink: string | null
  measurementLink: string | null
  designLink: string | null
}

function parseNotes(notes: string): ParsedNotes {
  const result: ParsedNotes = {
    experimentId: null,
    hypothesis: null,
    lookIds: [],
    dashboardIds: [],
    analysisLink: null,
    measurementLink: null,
    designLink: null,
  }

  if (!notes) return result

  // Extract experiment IDs like fdcDynamicContent_172
  const expIdMatch = notes.match(/\b(fdc\w+_\d+)\b/i)
  if (expIdMatch) result.experimentId = expIdMatch[1]

  // Extract Looker Look IDs from URLs like /looks/9291
  const lookMatches = notes.matchAll(/\/looks\/(\d+)/g)
  for (const m of lookMatches) result.lookIds.push(parseInt(m[1], 10))

  // Extract Dashboard IDs from URLs like /dashboards/1234
  const dashMatches = notes.matchAll(/\/dashboards\/(\d+)/g)
  for (const m of dashMatches) result.dashboardIds.push(parseInt(m[1], 10))

  // Extract links by context
  const urls = [...notes.matchAll(/(https?:\/\/[^\s)]+)/g)].map(m => m[1])
  for (const url of urls) {
    if (url.includes('looker') && url.includes('look')) {
      result.analysisLink = result.analysisLink ?? url
    }
    if (url.includes('measurement') || url.includes('measure')) {
      result.measurementLink = url
    }
    if (url.includes('design') || url.includes('figma')) {
      result.designLink = url
    }
  }

  // Hypothesis extraction (line starting with "Hypothesis:" or "H:")
  const hypMatch = notes.match(/(?:hypothesis|h)\s*:\s*(.+)/i)
  if (hypMatch) result.hypothesis = hypMatch[1].trim()

  return result
}

function resolveLifecycle(task: AsanaTask): ExperimentLifecycle {
  // Try section membership
  for (const m of task.memberships ?? []) {
    const sectionName = m.section?.name
    if (sectionName && SECTION_TO_LIFECYCLE[sectionName]) {
      return SECTION_TO_LIFECYCLE[sectionName]
    }
  }
  // Default
  return task.completed ? 'completed' : 'idea'
}

function extractExpid(name: string): string | null {
  const match = name.match(/EXPID-\d+/i)
  return match ? match[0].toUpperCase() : null
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/expid-\d+\s*[-:]*\s*/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function parseList(value: string): string[] {
  if (!value) return []
  return value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
}
