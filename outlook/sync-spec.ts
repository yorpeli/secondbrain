/**
 * Sync the operating spec(s) from agents/outlook-agent.md → context_store.
 *
 * The repo-master doc holds each authoritative spec inside a fenced json block
 * preceded by a marker `<!-- spec:KEY -->` (e.g. `outlook_agent_spec`,
 * `outlook_sync_spec`). This scans every marker, validates each block as JSON,
 * and upserts it into context_store under its key. Returns key + version per spec.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOC_PATH = resolve(__dirname, '../agents/outlook-agent.md')
const MARKER_RE = /<!--\s*spec:([a-z0-9_]+)\s*-->/g

/** Scan every `<!-- spec:KEY -->` marker and return its following ```json block. */
export function extractSpecs(doc: string): { key: string; spec: unknown }[] {
  const out: { key: string; spec: unknown }[] = []
  let m: RegExpExecArray | null
  while ((m = MARKER_RE.exec(doc)) !== null) {
    const key = m[1]
    const after = doc.slice(m.index)
    const fenceStart = after.indexOf('```json')
    if (fenceStart === -1) throw new Error(`No \`\`\`json block after spec marker: ${key}`)
    const bodyStart = fenceStart + '```json'.length
    // Close only on a fence at line start, so backticks inside a JSON string can't end it early.
    const closeRel = after.slice(bodyStart).search(/\n```/)
    if (closeRel === -1) throw new Error(`Unterminated \`\`\`json block for spec: ${key}`)
    const jsonText = after.slice(bodyStart, bodyStart + closeRel).trim()
    out.push({ key, spec: JSON.parse(jsonText) })
  }
  if (out.length === 0) throw new Error('No spec markers found in agents/outlook-agent.md')
  return out
}

/** Upsert every spec block to its context_store key. Returns key+version per spec. */
export async function syncSpec(): Promise<{ key: string; version: string }[]> {
  const doc = readFileSync(DOC_PATH, 'utf8')
  const specs = extractSpecs(doc)
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase()
  const results: { key: string; version: string }[] = []
  for (const { key, spec } of specs) {
    const { error } = await supabase
      .from('context_store' as any)
      .upsert({ key, content: spec as any, updated_at: new Date().toISOString() } as any, { onConflict: 'key' })
    if (error) throw new Error(`Failed to upsert spec ${key}: ${error.message}`)
    results.push({ key, version: String((spec as any).version ?? 'unknown') })
  }
  return results
}
