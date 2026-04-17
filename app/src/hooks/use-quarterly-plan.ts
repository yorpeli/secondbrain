import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { QuarterlyPlanItem, QuarterlyPlanDeliverable, QuarterDeliverable } from '@/lib/types'

interface PlanProgressRow {
  quarter: string
  plan_status: string
  plan_item_id: string
  plan_item_title: string
  theme: string | null
  item_status: string
  expected_impact_current_q: string | null
  expected_impact_next_q: string | null
  initiative_slug: string | null
  initiative_title: string | null
  initiative_priority: string | null
  total_deliverables: number
  done_deliverables: number
  in_progress_deliverables: number
  at_risk_deliverables: number
  planned_deliverables: number
  cut_deliverables: number
}

interface DeliverableRow {
  id: string
  title: string
  description: string | null
  theme: string | null
  timing: string | null
  target_date: string | null
  completed_date: string | null
  expected_impact: string | null
  actual_outcome: string | null
  status: string
  sort_order: number
}

function mapPlanItem(row: PlanProgressRow): QuarterlyPlanItem {
  return {
    id: row.plan_item_id,
    title: row.plan_item_title,
    description: null,
    theme: row.theme,
    status: row.item_status as QuarterlyPlanItem['status'],
    expectedImpactCurrentQ: row.expected_impact_current_q,
    expectedImpactNextQ: row.expected_impact_next_q,
    initiativeSlug: row.initiative_slug,
    initiativeTitle: row.initiative_title,
    initiativePriority: row.initiative_priority,
    totalDeliverables: row.total_deliverables,
    doneDeliverables: row.done_deliverables,
    inProgressDeliverables: row.in_progress_deliverables,
    atRiskDeliverables: row.at_risk_deliverables,
    plannedDeliverables: row.planned_deliverables,
    cutDeliverables: row.cut_deliverables,
  }
}

function mapDeliverable(row: DeliverableRow): QuarterlyPlanDeliverable {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    theme: row.theme,
    timing: row.timing,
    targetDate: row.target_date,
    completedDate: row.completed_date,
    expectedImpact: row.expected_impact,
    actualOutcome: row.actual_outcome,
    status: row.status as QuarterlyPlanDeliverable['status'],
    sortOrder: row.sort_order,
  }
}

export function useQuarterlyPlan(quarter: string) {
  return useQuery({
    queryKey: ['quarterly-plan', quarter],
    queryFn: async (): Promise<QuarterlyPlanItem[]> => {
      const { data, error } = await supabase
        .from('v_quarterly_plan_progress' as never)
        .select('*')
        .eq('quarter', quarter)

      if (error) throw error
      const rows = (data ?? []) as unknown as PlanProgressRow[]
      return rows.map(mapPlanItem)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!quarter,
  })
}

export function useQuarterlyPlanQuarters() {
  return useQuery({
    queryKey: ['quarterly-plan-quarters'],
    queryFn: async (): Promise<Array<{ quarter: string; status: string }>> => {
      const { data, error } = await supabase
        .from('quarterly_plans' as never)
        .select('quarter, status')
        .order('quarter', { ascending: false })

      if (error) throw error
      return (data ?? []) as unknown as Array<{ quarter: string; status: string }>
    },
    staleTime: 10 * 60 * 1000,
  })
}

interface QuarterDeliverableRow {
  id: string
  title: string
  description: string | null
  theme: string | null
  timing: string | null
  target_date: string | null
  completed_date: string | null
  expected_impact: string | null
  actual_outcome: string | null
  status: string
  sort_order: number
  initiative_slug: string | null
  initiative_title: string | null
  initiative_priority: string | null
  plan_item_title: string
}

export function useQuarterDeliverables(quarter: string) {
  return useQuery({
    queryKey: ['quarter-deliverables', quarter],
    queryFn: async (): Promise<QuarterDeliverable[]> => {
      const { data, error } = await supabase.rpc('get_quarter_deliverables' as never, { q: quarter })
      if (error) {
        // Fallback: manual join query
        const { data: items, error: itemsErr } = await supabase
          .from('quarterly_plan_items' as never)
          .select('id, title, plan_id, initiative_id')
          .order('sort_order')
        if (itemsErr) throw itemsErr

        // Get plan IDs for this quarter
        const { data: plans, error: plansErr } = await supabase
          .from('quarterly_plans' as never)
          .select('id')
          .eq('quarter', quarter)
        if (plansErr) throw plansErr

        const planIds = ((plans ?? []) as any[]).map(p => p.id)
        const matchedItems = ((items ?? []) as any[]).filter(i => planIds.includes(i.plan_id))
        const itemIds = matchedItems.map(i => i.id)

        if (itemIds.length === 0) return []

        // Get initiatives for these items
        const initIds = [...new Set(matchedItems.map(i => i.initiative_id).filter(Boolean))]
        let initMap = new Map<string, { slug: string; title: string; priority: string }>()
        if (initIds.length > 0) {
          const { data: inits } = await supabase
            .from('initiatives' as never)
            .select('id, slug, title, priority')
            .in('id', initIds)
          for (const init of (inits ?? []) as any[]) {
            initMap.set(init.id, { slug: init.slug, title: init.title, priority: init.priority })
          }
        }

        // Get deliverables
        const { data: delivs, error: delivsErr } = await supabase
          .from('quarterly_plan_deliverables' as never)
          .select('*')
          .in('plan_item_id', itemIds)
          .order('sort_order')
        if (delivsErr) throw delivsErr

        const itemMap = new Map(matchedItems.map((i: any) => [i.id, i]))

        return ((delivs ?? []) as any[]).map((d: any) => {
          const item = itemMap.get(d.plan_item_id)
          const init = item?.initiative_id ? initMap.get(item.initiative_id) : null
          return {
            id: d.id,
            title: d.title,
            description: d.description,
            theme: d.theme,
            timing: d.timing,
            targetDate: d.target_date,
            completedDate: d.completed_date,
            expectedImpact: d.expected_impact,
            actualOutcome: d.actual_outcome,
            status: d.status,
            sortOrder: d.sort_order ?? 0,
            initiativeSlug: init?.slug ?? null,
            initiativeTitle: init?.title ?? null,
            initiativePriority: init?.priority ?? null,
            planItemTitle: item?.title ?? '',
          } satisfies QuarterDeliverable
        })
      }

      // RPC path (if function exists)
      return ((data ?? []) as unknown as QuarterDeliverableRow[]).map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        theme: d.theme,
        timing: d.timing,
        targetDate: d.target_date,
        completedDate: d.completed_date,
        expectedImpact: d.expected_impact,
        actualOutcome: d.actual_outcome,
        status: d.status as QuarterDeliverable['status'],
        sortOrder: d.sort_order,
        initiativeSlug: d.initiative_slug,
        initiativeTitle: d.initiative_title,
        initiativePriority: d.initiative_priority,
        planItemTitle: d.plan_item_title,
      }))
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!quarter,
  })
}

export function usePlanItemDeliverables(planItemId: string | undefined) {
  return useQuery({
    queryKey: ['plan-item-deliverables', planItemId],
    queryFn: async (): Promise<QuarterlyPlanDeliverable[]> => {
      if (!planItemId) return []

      const { data, error } = await supabase
        .from('quarterly_plan_deliverables' as never)
        .select('*')
        .eq('plan_item_id', planItemId)
        .order('sort_order')

      if (error) throw error
      return ((data ?? []) as unknown as DeliverableRow[]).map(mapDeliverable)
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!planItemId,
  })
}
