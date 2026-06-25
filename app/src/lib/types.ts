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

// --- People page ---

/** Derived per-person status signal driving the rail dot + hero badge. */
export type AttentionLevel = 'high' | 'watch' | 'new' | 'ok'

/** A single auto-assembled "to cover in your next 1:1" agenda item. */
export interface PersonAgendaItem {
  title: string
  meta: string
  tag: 'Focus' | 'Overdue' | 'Cadence' | 'Carry-over' | 'Blocker' | 'Growth' | 'Topic' | 'Ramp'
}

export interface DirectReportSummary {
  id: string
  slug: string
  name: string
  role: string
  teamName: string | null
  openItemsCount: number
  overdueCount: number
  lastOneOnOne: string | null
  nextOneOnOne: string | null
  daysSinceLast: number | null
  cadenceDays: number | null
  cadenceLabel: string | null
  attention: AttentionLevel
}

export interface PersonOpenItem {
  id: string
  kind: 'task' | 'action-item'
  title: string
  status: string
  priority: string | null
  dueDate: string | null
}

export interface PersonOneOnOne {
  id: string
  date: string
  topic: string | null
  notes: string | null
}

export interface PersonCoachingEntry {
  id: string
  sectionType: 'coaching-log' | 'dev-plan'
  title: string | null
  content: string
  date: string | null
}

export interface PersonPerfReview {
  reviewPeriod: string | null
  reviewDate: string | null
  overallRating: string | null
  ratingScore: number | null
}

export interface PersonDetail {
  id: string
  slug: string
  name: string
  role: string
  teamName: string | null
  teamSlug: string | null
  managerName: string | null
  workingStyle: string | null
  strengths: string[]
  growthAreas: string[]
  relationshipNotes: string | null
  currentFocus: string | null
  openItems: PersonOpenItem[]
  recentOneOnOnes: PersonOneOnOne[]
  nextOneOnOne: PersonOneOnOne | null
  coaching: PersonCoachingEntry[]
  perfReview: PersonPerfReview | null
  overdueCount: number
  dueSoonCount: number
  daysSinceLast: number | null
  cadenceLabel: string | null
  nextKind: 'today' | 'soon' | 'date' | 'none'
  attention: AttentionLevel
  agenda: PersonAgendaItem[]
}

export interface PersonTeamInitiative {
  id: string
  slug: string
  title: string
  status: string
  priority: string
}

export interface PersonPppStatus {
  weekDate: string
  workstreamName: string
  status: string
  summary: string | null
}

export interface PersonTeamWork {
  initiatives: PersonTeamInitiative[]
  ppp: PersonPppStatus | null
}
