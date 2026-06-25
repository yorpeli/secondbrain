import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { splitOneOnOnes } from '@/lib/people-data'
import type { DirectReportSummary, PersonOneOnOne } from '@/lib/types'

interface OrgTreeRow {
  id: string
  slug: string
  name: string
  role: string
  team_name: string | null
  team_slug: string | null
  reports_to_name: string | null
  reports_to_slug: string | null
  working_style: string | null
  strengths: string[] | null
  growth_areas: string[] | null
  relationship_notes: string | null
  current_focus: string | null
  status: string
}

export function useDirectReports() {
  return useQuery({
    queryKey: ['direct-reports'],
    queryFn: async (): Promise<DirectReportSummary[]> => {
      const { data: orgData, error } = await supabase
        .from('v_org_tree' as never)
        .select('id, slug, name, role, team_name, reports_to_slug, status')
        .eq('reports_to_slug', 'yonatan-orpeli')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      const directs = (orgData ?? []) as unknown as OrgTreeRow[]
      if (directs.length === 0) return []

      const ids = directs.map(d => d.id)

      // Open tasks (not done) per owner
      const { data: taskData } = await supabase
        .from('tasks' as never)
        .select('owner_id, status')
        .in('owner_id', ids)
        .neq('status', 'done')
      const taskRows = (taskData ?? []) as unknown as Array<{ owner_id: string }>

      // Open action items per owner
      const { data: aiData } = await supabase
        .from('meeting_action_items' as never)
        .select('owner_id, status')
        .in('owner_id', ids)
        .eq('status', 'open')
      const aiRows = (aiData ?? []) as unknown as Array<{ owner_id: string }>

      // 1:1 meetings these people attend
      const { data: attData } = await supabase
        .from('meeting_attendees' as never)
        .select('meeting_id, person_id')
        .in('person_id', ids)
      const attRows = (attData ?? []) as unknown as Array<{ meeting_id: string; person_id: string }>

      const meetingIds = [...new Set(attRows.map(a => a.meeting_id))]
      let meetingDateById = new Map<string, string>()
      if (meetingIds.length > 0) {
        const { data: mtgData } = await supabase
          .from('meetings' as never)
          .select('id, date, meeting_type')
          .in('id', meetingIds)
          .eq('meeting_type', '1on1')
        const mtgRows = (mtgData ?? []) as unknown as Array<{ id: string; date: string }>
        meetingDateById = new Map(mtgRows.map(m => [m.id, m.date]))
      }

      const todayISO = new Date().toISOString().slice(0, 10)

      const countByOwner = (rows: Array<{ owner_id: string }>) => {
        const m = new Map<string, number>()
        for (const r of rows) m.set(r.owner_id, (m.get(r.owner_id) ?? 0) + 1)
        return m
      }
      const taskCounts = countByOwner(taskRows)
      const aiCounts = countByOwner(aiRows)

      // person_id -> 1:1 dates
      const datesByPerson = new Map<string, PersonOneOnOne[]>()
      for (const a of attRows) {
        const date = meetingDateById.get(a.meeting_id)
        if (!date) continue
        const list = datesByPerson.get(a.person_id) ?? []
        list.push({ id: a.meeting_id, date, topic: null, notes: null })
        datesByPerson.set(a.person_id, list)
      }

      return directs.map(d => {
        const { recent, next } = splitOneOnOnes(datesByPerson.get(d.id) ?? [], todayISO)
        return {
          id: d.id,
          slug: d.slug,
          name: d.name,
          role: d.role,
          teamName: d.team_name,
          openItemsCount: (taskCounts.get(d.id) ?? 0) + (aiCounts.get(d.id) ?? 0),
          lastOneOnOne: recent[0]?.date ?? null,
          nextOneOnOne: next?.date ?? null,
        }
      })
    },
    staleTime: 5 * 60 * 1000,
  })
}
