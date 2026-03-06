import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Initiative, Stakeholder } from '@/lib/types'

interface InitiativeDashboardRow {
  id: string
  slug: string
  title: string
  status: string
  priority: string
  objective: string | null
  start_date: string | null
  target_date: string | null
  owner_name: string | null
  tasks_todo: number
  tasks_in_progress: number
  tasks_blocked: number
  tasks_done: number
}

function mapInitiative(row: InitiativeDashboardRow, memoryDate?: string | null): Initiative {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as Initiative['status'],
    priority: row.priority as Initiative['priority'],
    objective: row.objective,
    startDate: row.start_date,
    targetDate: row.target_date,
    ownerName: row.owner_name,
    assignedAgent: null, // Not in the view, fetched separately
    tasksTodo: row.tasks_todo ?? 0,
    tasksInProgress: row.tasks_in_progress ?? 0,
    tasksBlocked: row.tasks_blocked ?? 0,
    tasksDone: row.tasks_done ?? 0,
    memoryLastUpdated: memoryDate ?? null,
  }
}

export function useInitiatives() {
  return useQuery({
    queryKey: ['initiatives'],
    queryFn: async (): Promise<Initiative[]> => {
      // Get dashboard data
      const { data: dashboardData, error: dashError } = await supabase
        .from('v_initiative_dashboard' as never)
        .select('*')
        .order('priority')
        .order('title')

      if (dashError) throw dashError

      const rows = (dashboardData ?? []) as unknown as InitiativeDashboardRow[]

      // Get assigned_agent from initiatives table
      const { data: agentData } = await supabase
        .from('initiatives' as never)
        .select('id, assigned_agent')

      const agentMap = new Map(
        ((agentData ?? []) as unknown as Array<{ id: string; assigned_agent: string | null }>)
          .map(r => [r.id, r.assigned_agent])
      )

      // Get memory doc dates for staleness
      const { data: memoryData } = await supabase
        .from('content_sections' as never)
        .select('entity_id, updated_at')
        .eq('section_type', 'memory')
        .eq('entity_type', 'initiative')

      const memoryMap = new Map(
        ((memoryData ?? []) as unknown as Array<{ entity_id: string; updated_at: string }>)
          .map(r => [r.entity_id, r.updated_at])
      )

      return rows.map(row => ({
        ...mapInitiative(row, memoryMap.get(row.id)),
        assignedAgent: agentMap.get(row.id) ?? null,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useInitiative(slug: string) {
  return useQuery({
    queryKey: ['initiative', slug],
    queryFn: async (): Promise<Initiative | null> => {
      const { data, error } = await supabase
        .from('v_initiative_dashboard' as never)
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      if (!data) return null

      const row = data as unknown as InitiativeDashboardRow

      // Get assigned_agent
      const { data: initData } = await supabase
        .from('initiatives' as never)
        .select('assigned_agent')
        .eq('id', row.id)
        .single()

      // Get memory date
      const { data: memData } = await supabase
        .from('content_sections' as never)
        .select('updated_at')
        .eq('entity_id', row.id)
        .eq('section_type', 'memory')
        .eq('entity_type', 'initiative')
        .single()

      return {
        ...mapInitiative(row, (memData as unknown as { updated_at: string } | null)?.updated_at),
        assignedAgent: (initData as unknown as { assigned_agent: string | null } | null)?.assigned_agent ?? null,
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  })
}

export function useInitiativeMemory(initiativeId: string | undefined) {
  return useQuery({
    queryKey: ['initiative-memory', initiativeId],
    queryFn: async (): Promise<string | null> => {
      if (!initiativeId) return null

      const { data, error } = await supabase
        .from('content_sections' as never)
        .select('content')
        .eq('entity_id', initiativeId)
        .eq('section_type', 'memory')
        .eq('entity_type', 'initiative')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as unknown as { content: string } | null)?.content ?? null
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!initiativeId,
  })
}

export function useInitiativeStakeholders(initiativeId: string | undefined) {
  return useQuery({
    queryKey: ['initiative-stakeholders', initiativeId],
    queryFn: async (): Promise<Stakeholder[]> => {
      if (!initiativeId) return []

      const { data, error } = await supabase
        .from('initiative_stakeholders' as never)
        .select('id, role, person_id')
        .eq('initiative_id', initiativeId)

      if (error) throw error

      const rows = (data ?? []) as unknown as Array<{ id: string; role: string; person_id: string }>
      if (rows.length === 0) return []

      // Fetch person names
      const personIds = rows.map(r => r.person_id)
      const { data: people } = await supabase
        .from('people' as never)
        .select('id, name')
        .in('id', personIds)

      const nameMap = new Map(
        ((people ?? []) as unknown as Array<{ id: string; name: string }>)
          .map(p => [p.id, p.name])
      )

      return rows.map(r => ({
        id: r.id,
        name: nameMap.get(r.person_id) ?? 'Unknown',
        role: r.role,
      }))
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!initiativeId,
  })
}
