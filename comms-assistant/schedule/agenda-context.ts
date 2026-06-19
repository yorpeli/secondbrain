import { getSupabase } from '../../lib/supabase.js'
import { searchByType } from '../../lib/embeddings.js'

export interface AgendaContext {
  person: { slug: string; name: string; role: string | null }
  currentFocus: string | null
  recentOneOnOnes: Array<{ date: string; summary: string }>
  openActionItems: string[]
  narrative: string[]
}

export async function gatherAgendaContext(slug: string): Promise<AgendaContext> {
  const sb = getSupabase() as any

  const { data: people } = await sb.from('people').select('slug,name,role').eq('slug', slug).limit(1)
  const person = people?.[0] ?? { slug, name: slug, role: null }

  const { data: cf } = await sb.from('context_store').select('content').eq('key', 'current_focus').limit(1)
  const currentFocus = cf?.[0]?.content ?? null

  // recent meetings that include this person, newest first
  const { data: mtgs } = await sb
    .from('v_meetings_with_attendees')
    .select('date,topic,discussion_notes,attendee_slugs')
    .contains('attendee_slugs', [slug])
    .order('date', { ascending: false })
    .limit(3)
  const recentOneOnOnes = (mtgs ?? []).map((m: any) => ({
    date: m.date,
    summary: (m.discussion_notes ?? m.topic ?? '').toString().slice(0, 400),
  }))

  // open action items for this person
  const { data: ai } = await sb
    .from('v_open_action_items')
    .select('description,owner_slug')
    .eq('owner_slug', slug)
    .limit(10)
  const openActionItems = (ai ?? []).map((r: any) => r.description).filter(Boolean)

  // semantic narrative — never throws (embedding failures must not break the flow)
  let narrative: string[] = []
  try {
    const hits = await searchByType(`${person.name} current focus growth coaching`, ['person', 'agent_log'], 4)
    narrative = (hits ?? []).map((h: any) => (h.content ?? h.text ?? '').toString().slice(0, 240)).filter(Boolean)
  } catch { /* sparse / offline — fine */ }

  return { person, currentFocus, recentOneOnOnes, openActionItems, narrative }
}
