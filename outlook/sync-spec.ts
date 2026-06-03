/**
 * Sync the operating spec from agents/outlook-agent.md → context_store.
 *
 * The repo-master doc holds the authoritative spec inside a fenced json block
 * preceded by the marker `<!-- spec:outlook_agent_spec -->`. This reads that
 * block, validates it as JSON, and upserts it into context_store under key
 * 'outlook_agent_spec'. Returns the spec version string.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOC_PATH = resolve(__dirname, '../agents/outlook-agent.md')
const MARKER = '<!-- spec:outlook_agent_spec -->'

export function extractSpecJson(doc: string): unknown {
  const markerIdx = doc.indexOf(MARKER)
  if (markerIdx === -1) {
    throw new Error(`Marker not found in agents/outlook-agent.md: ${MARKER}`)
  }
  const after = doc.slice(markerIdx)
  const fenceStart = after.indexOf('```json')
  if (fenceStart === -1) {
    throw new Error('No ```json block after spec marker.')
  }
  const bodyStart = fenceStart + '```json'.length
  // Match the closing fence only at the start of a line, so a backtick run that
  // happens to appear inside a JSON string value can't terminate the block early.
  const closeRel = after.slice(bodyStart).search(/\n```/)
  if (closeRel === -1) {
    throw new Error('Unterminated ```json block after spec marker.')
  }
  const fenceEnd = bodyStart + closeRel
  const jsonText = after.slice(bodyStart, fenceEnd).trim()
  return JSON.parse(jsonText)
}

export async function syncSpec(): Promise<string> {
  const doc = readFileSync(DOC_PATH, 'utf8')
  const spec = extractSpecJson(doc) as Record<string, unknown>
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()
  const { error } = await supabase
    .from('context_store' as any)
    .upsert({ key: 'outlook_agent_spec', content: spec as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
  if (error) {
    throw new Error(`Failed to upsert spec: ${error.message}`)
  }
  return String((spec as any).version ?? 'unknown')
}
