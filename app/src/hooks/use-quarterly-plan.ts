import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { QuarterlyPlanItem, QuarterlyPlanDeliverable } from '@/lib/types'

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
