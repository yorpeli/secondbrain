import type { ResolvedAttendee } from './types.js'

export const ROOT_SLUG = 'yonatan-orpeli'

export const KNOWN_GROUPS = {
  'directs': 'directs',
  'skip-levels': 'skip-levels',
} as const

// Map free-text group phrasing to a canonical key, or null if not a known group.
export function normalizeGroup(raw: string): string | null {
  const s = raw.toLowerCase().replace(/[_\s]+/g, '-').replace(/^my-/, '')
  if (['direct', 'directs', 'direct-reports', 'direct-report'].includes(s)) return 'directs'
  if (['skip', 'skips', 'skip-level', 'skip-levels'].includes(s)) return 'skip-levels'
  return null
}

function toAttendees(rows: Array<{ slug: string; name: string; email: string | null }>): ResolvedAttendee[] {
  return rows
    .filter((r) => r.email && r.email.includes('@'))
    .map((r) => ({ slug: r.slug, name: r.name, email: r.email as string }))
}

// directs = people whose reports_to_id is the root; skip-levels = reports of those directs.
export async function resolveGroup(group: string, rootSlug: string = ROOT_SLUG): Promise<ResolvedAttendee[]> {
  const key = normalizeGroup(group)
  if (!key) throw new Error(`unknown group: ${group}`)
  const { getSupabase } = await import('../../lib/supabase.js')
  const sb = getSupabase() as any

  const { data: root } = await sb.from('people').select('id').eq('slug', rootSlug).limit(1)
  const rootId = root?.[0]?.id
  if (!rootId) throw new Error(`root person not found: ${rootSlug}`)

  const { data: directs } = await sb.from('people').select('id,slug,name,email').eq('reports_to_id', rootId)
  if (key === 'directs') return toAttendees(directs ?? [])

  const directIds = (directs ?? []).map((d: any) => d.id)
  if (directIds.length === 0) return []
  const { data: skips } = await sb.from('people').select('slug,name,email').in('reports_to_id', directIds)
  return toAttendees(skips ?? [])
}

// Resolve explicit names/slugs → people rows. Exact slug first, then fuzzy name ILIKE.
export async function resolveNames(identifiers: string[]): Promise<{ resolved: ResolvedAttendee[]; unresolved: string[] }> {
  const { getSupabase } = await import('../../lib/supabase.js')
  const sb = getSupabase() as any
  const resolved: ResolvedAttendee[] = []
  const unresolved: string[] = []
  for (const id of identifiers) {
    const term = id.trim()
    if (!term) continue
    let { data } = await sb.from('people').select('slug,name,email').eq('slug', term).limit(1)
    if (!data?.length) {
      ;({ data } = await sb.from('people').select('slug,name,email').ilike('name', `%${term}%`).limit(2))
    }
    const matches = toAttendees(data ?? [])
    if (matches.length === 1) resolved.push(matches[0])
    else unresolved.push(term) // 0 matches, ambiguous (>1), or no email
  }
  return { resolved, unresolved }
}
