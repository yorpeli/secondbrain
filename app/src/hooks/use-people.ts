import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { splitOneOnOnes, sortOpenItems } from '@/lib/people-data'
import type { DirectReportSummary, PersonOneOnOne, PersonDetail, PersonCoachingEntry, PersonTeamWork, PersonTeamInitiative, PersonPppStatus } from '@/lib/types'

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

export function usePersonDetail(slug: string) {
  return useQuery({
    queryKey: ['person-detail', slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PersonDetail | null> => {
      const { data: orgData, error } = await supabase
        .from('v_org_tree' as never)
        .select('id, slug, name, role, team_name, team_slug, reports_to_name, working_style, strengths, growth_areas, relationship_notes, current_focus, status')
        .eq('slug', slug)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!orgData) return null
      const p = orgData as unknown as OrgTreeRow

      // Open tasks
      const { data: taskData } = await supabase
        .from('tasks' as never)
        .select('id, title, status, priority, due_date')
        .eq('owner_id', p.id)
        .neq('status', 'done')
      const tasks = ((taskData ?? []) as unknown as Array<{ id: string; title: string; status: string; priority: string | null; due_date: string | null }>)
        .map(t => ({ id: t.id, kind: 'task' as const, title: t.title, status: t.status, priority: t.priority, dueDate: t.due_date }))

      // Open action items
      const { data: aiData } = await supabase
        .from('meeting_action_items' as never)
        .select('id, description, status, due_date')
        .eq('owner_id', p.id)
        .eq('status', 'open')
      const actionItems = ((aiData ?? []) as unknown as Array<{ id: string; description: string; status: string; due_date: string | null }>)
        .map(a => ({ id: a.id, kind: 'action-item' as const, title: a.description, status: a.status, priority: null, dueDate: a.due_date }))

      const openItems = sortOpenItems([...tasks, ...actionItems])

      // 1:1 meetings (discussion_notes only, never private_notes)
      const { data: attData } = await supabase
        .from('meeting_attendees' as never)
        .select('meeting_id')
        .eq('person_id', p.id)
      const meetingIds = [...new Set(((attData ?? []) as unknown as Array<{ meeting_id: string }>).map(a => a.meeting_id))]

      let oneOnOnes: PersonOneOnOne[] = []
      if (meetingIds.length > 0) {
        const { data: mtgData } = await supabase
          .from('meetings' as never)
          .select('id, date, topic, discussion_notes, meeting_type')
          .in('id', meetingIds)
          .eq('meeting_type', '1on1')
        oneOnOnes = ((mtgData ?? []) as unknown as Array<{ id: string; date: string; topic: string | null; discussion_notes: string | null }>)
          .map(m => ({ id: m.id, date: m.date, topic: m.topic, notes: m.discussion_notes }))
      }
      const todayISO = new Date().toISOString().slice(0, 10)
      const { recent, next } = splitOneOnOnes(oneOnOnes, todayISO)

      // Coaching + dev-plan (non-private only)
      const { data: csData } = await supabase
        .from('content_sections' as never)
        .select('id, section_type, title, content, date, is_private')
        .eq('entity_id', p.id)
        .in('section_type', ['coaching-log', 'dev-plan'])
        .eq('is_private', false)
        .order('date', { ascending: false })
      const coaching = ((csData ?? []) as unknown as Array<{ id: string; section_type: string; title: string | null; content: string; date: string | null }>)
        .map(c => ({ id: c.id, sectionType: c.section_type as PersonCoachingEntry['sectionType'], title: c.title, content: c.content, date: c.date }))

      // Latest performance review (metadata only)
      const { data: prData } = await supabase
        .from('performance_reviews' as never)
        .select('review_period, review_date, overall_rating, rating_score')
        .eq('person_id', p.id)
        .order('review_date', { ascending: false })
        .limit(1)
      const prRow = ((prData ?? []) as unknown as Array<{ review_period: string | null; review_date: string | null; overall_rating: string | null; rating_score: number | null }>)[0]
      const perfReview = prRow
        ? { reviewPeriod: prRow.review_period, reviewDate: prRow.review_date, overallRating: prRow.overall_rating, ratingScore: prRow.rating_score }
        : null

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        role: p.role,
        teamName: p.team_name,
        teamSlug: p.team_slug,
        managerName: p.reports_to_name,
        workingStyle: p.working_style,
        strengths: p.strengths ?? [],
        growthAreas: p.growth_areas ?? [],
        relationshipNotes: p.relationship_notes,
        currentFocus: p.current_focus,
        openItems,
        recentOneOnOnes: recent,
        nextOneOnOne: next,
        coaching,
        perfReview,
      }
    },
  })
}

export function usePersonTeamWork(
  personId: string | undefined,
  personName: string | undefined,
  slug: string | undefined,
) {
  return useQuery({
    queryKey: ['person-team-work', personId],
    enabled: !!personId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PersonTeamWork> => {
      // Initiatives where this person is a stakeholder
      const { data: stkData } = await supabase
        .from('initiative_stakeholders' as never)
        .select('initiative_id')
        .eq('person_id', personId as string)
      const stakeholderInitiativeIds = [...new Set(
        ((stkData ?? []) as unknown as Array<{ initiative_id: string }>).map(s => s.initiative_id),
      )]

      const byId = new Map<string, PersonTeamInitiative>()

      // Initiatives owned by this person (owner_name match), kind = initiative
      if (personName) {
        const { data: ownData } = await supabase
          .from('v_initiative_dashboard' as never)
          .select('id, slug, title, status, priority, owner_name, kind')
          .eq('kind', 'initiative')
          .eq('owner_name', personName)
        for (const r of (ownData ?? []) as unknown as Array<PersonTeamInitiative & { owner_name: string; kind: string }>) {
          byId.set(r.id, { id: r.id, slug: r.slug, title: r.title, status: r.status, priority: r.priority })
        }
      }

      // Initiatives where they're a stakeholder
      if (stakeholderInitiativeIds.length > 0) {
        const { data: stkInitData } = await supabase
          .from('v_initiative_dashboard' as never)
          .select('id, slug, title, status, priority, kind')
          .eq('kind', 'initiative')
          .in('id', stakeholderInitiativeIds)
        for (const r of (stkInitData ?? []) as unknown as Array<PersonTeamInitiative & { kind: string }>) {
          byId.set(r.id, { id: r.id, slug: r.slug, title: r.title, status: r.status, priority: r.priority })
        }
      }

      const initiatives = Array.from(byId.values()).sort((a, b) =>
        a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : (a.title < b.title ? -1 : 1),
      )

      // Latest PPP swimlane for this lead
      let ppp: PersonPppStatus | null = null
      if (slug) {
        const { data: pppData } = await supabase
          .from('v_ppp_swimlanes' as never)
          .select('week_date, workstream_name, status, summary, lead_slug')
          .eq('lead_slug', slug)
          .order('week_date', { ascending: false })
          .limit(1)
        const row = ((pppData ?? []) as unknown as Array<{ week_date: string; workstream_name: string; status: string; summary: string | null }>)[0]
        if (row) ppp = { weekDate: row.week_date, workstreamName: row.workstream_name, status: row.status, summary: row.summary }
      }

      return { initiatives, ppp }
    },
  })
}
