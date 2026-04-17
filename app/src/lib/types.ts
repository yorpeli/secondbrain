export interface Initiative {
  id: string
  slug: string
  title: string
  status: 'active' | 'exploration' | 'completed'
  priority: 'P0' | 'P1' | 'P2'
  objective: string | null
  startDate: string | null
  targetDate: string | null
  ownerName: string | null
  assignedAgent: string | null
  tasksTodo: number
  tasksInProgress: number
  tasksBlocked: number
  tasksDone: number
  memoryLastUpdated: string | null
}

export interface Stakeholder {
  id: string
  name: string
  role: string
}

export interface InitiativeDetail extends Initiative {
  memoryContent: string | null
  stakeholders: Stakeholder[]
}

export interface QuarterlyPlan {
  quarter: string
  title: string | null
  status: 'active' | 'closed'
}

export interface QuarterlyPlanItem {
  id: string
  title: string
  description: string | null
  theme: string | null
  status: 'planned' | 'in-progress' | 'done' | 'at-risk' | 'cut'
  expectedImpactCurrentQ: string | null
  expectedImpactNextQ: string | null
  initiativeSlug: string | null
  initiativeTitle: string | null
  initiativePriority: string | null
  totalDeliverables: number
  doneDeliverables: number
  inProgressDeliverables: number
  atRiskDeliverables: number
  plannedDeliverables: number
  cutDeliverables: number
}

export interface QuarterlyPlanDeliverable {
  id: string
  title: string
  description: string | null
  theme: string | null
  timing: string | null
  targetDate: string | null
  completedDate: string | null
  expectedImpact: string | null
  actualOutcome: string | null
  status: 'planned' | 'in-progress' | 'done' | 'at-risk' | 'cut' | 'blocked'
  sortOrder: number
}

export interface QuarterDeliverable extends QuarterlyPlanDeliverable {
  initiativeSlug: string | null
  initiativeTitle: string | null
  initiativePriority: string | null
  planItemTitle: string
}
