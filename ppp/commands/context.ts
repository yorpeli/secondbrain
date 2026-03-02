/**
 * PPP Context Command
 *
 * Loads all context needed for PPP analysis:
 * - Previous week's PPP data
 * - People slugs lookup (name → slug → UUID)
 * - Tag dictionary
 * - Default contributors map
 * - current_focus from context_store
 */

import type { PppContext, PeopleMap, PreviousWeekSection } from '../lib/types.js'
import { TAG_DICTIONARY, DEFAULT_CONTRIBUTORS } from '../lib/config.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../lib/supabase.js')
  return gs()
}

export async function run(): Promise<PppContext> {
  const supabase = await getSupabase()

  // Run all queries in parallel
  const [swimlanesRes, peopleRes, focusRes] = await Promise.all([
    // Previous week PPP (latest report)
    supabase
      .from('v_ppp_swimlanes' as any)
      .select('workstream_name, lead_name, status, quality_score, summary, tags')
      .eq('week_date', (
        await supabase
          .from('ppp_reports')
          .select('week_date')
          .order('week_date', { ascending: false })
          .limit(1)
          .single()
      ).data?.week_date ?? '1970-01-01')
      .order('workstream_name'),

    // All active people (for slug resolution)
    supabase
      .from('people')
      .select('id, slug, name')
      .eq('status', 'active'),

    // Current focus
    supabase
      .from('context_store')
      .select('content')
      .eq('key', 'current_focus')
      .single(),
  ])

  // Get the latest week_date separately for the response
  const { data: latestReport } = await supabase
    .from('ppp_reports')
    .select('week_date')
    .order('week_date', { ascending: false })
    .limit(1)
    .single()

  // Build people map: index by slug, first name (lowercase), and full name (lowercase)
  const peopleMap: PeopleMap = {}
  const people = (peopleRes.data || []) as unknown as Array<{ id: string; slug: string; name: string }>

  for (const p of people) {
    const entry = { id: p.id, slug: p.slug, name: p.name }
    peopleMap[p.slug] = entry

    // Index by first name (lowercase)
    const firstName = p.name.split(' ')[0].toLowerCase()
    if (!peopleMap[firstName]) {
      peopleMap[firstName] = entry
    }

    // Index by full name (lowercase)
    peopleMap[p.name.toLowerCase()] = entry
  }

  const previousSections = (swimlanesRes.data || []) as unknown as PreviousWeekSection[]

  const context: PppContext = {
    previous_week: {
      week_date: latestReport?.week_date ?? null,
      sections: previousSections,
    },
    people: peopleMap,
    tag_dictionary: { ...TAG_DICTIONARY },
    default_contributors: DEFAULT_CONTRIBUTORS,
    current_focus: (focusRes.data as any)?.content ?? null,
  }

  return context
}
