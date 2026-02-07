/**
 * Daily Summary — Data Gathering
 *
 * Queries Supabase for all the data needed to produce a morning briefing.
 * Returns structured data that the briefing composer turns into spoken text.
 */

import { getSupabase } from '../lib/supabase.js'

// ─── Types ───────────────────────────────────────────────────

export interface MeetingItem {
  topic: string
  meeting_type: string
  attendees: string[]
  purpose: string | null
}

export interface ActionItem {
  description: string
  owner_name: string
  due_date: string | null
  meeting_topic: string | null
  is_overdue: boolean
}

export interface InitiativeStatus {
  title: string
  owner_name: string
  status: string
  priority: string
  tasks_in_progress: number
  tasks_blocked: number
}

export interface PppSignal {
  workstream_name: string
  lead_name: string
  status: string
  summary: string
  quality_score: number
}

export interface DailySummaryData {
  date: string
  dayOfWeek: string
  meetings: MeetingItem[]
  actionItems: ActionItem[]
  currentFocus: string | null
  initiatives: InitiativeStatus[]
  pppSignals: PppSignal[]
}

// ─── Queries ─────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function todayISO(): string {
  // Israel time (UTC+2 / UTC+3 DST)
  const now = new Date()
  const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))
  return israelTime.toISOString().split('T')[0]
}

export async function gatherDailyData(): Promise<DailySummaryData> {
  const supabase = getSupabase()
  const today = todayISO()
  const dayOfWeek = DAYS[new Date(today + 'T12:00:00').getDay()]

  // Run all queries in parallel
  const [meetingsRes, actionItemsRes, focusRes, initiativesRes, pppRes] = await Promise.all([
    // Today's meetings
    supabase
      .from('v_meetings_with_attendees')
      .select('topic, meeting_type, attendees, purpose')
      .eq('date', today),

    // Open action items (due today or overdue)
    supabase
      .from('v_open_action_items')
      .select('description, owner_name, due_date, meeting_topic')
      .lte('due_date', today)
      .order('due_date', { ascending: true }),

    // Current focus from context_store
    supabase
      .from('context_store')
      .select('content')
      .eq('key', 'current_focus')
      .single(),

    // Active initiatives
    supabase
      .from('v_initiative_dashboard')
      .select('title, owner_name, status, priority, tasks_in_progress, tasks_blocked')
      .in('status', ['active', 'exploration']),

    // Latest PPP — at-risk or potential-issues
    supabase
      .from('v_ppp_swimlanes')
      .select('workstream_name, lead_name, status, summary, quality_score, week_date')
      .in('status', ['at-risk', 'potential-issues'])
      .order('week_date', { ascending: false })
      .limit(20),
  ])

  // Process meetings
  const meetings: MeetingItem[] = (meetingsRes.data || []).map((m: any) => ({
    topic: m.topic || 'Untitled meeting',
    meeting_type: m.meeting_type || 'meeting',
    attendees: m.attendees || [],
    purpose: m.purpose,
  }))

  // Process action items
  const actionItems: ActionItem[] = (actionItemsRes.data || []).map((a: any) => ({
    description: a.description || '',
    owner_name: a.owner_name || 'Unknown',
    due_date: a.due_date,
    meeting_topic: a.meeting_topic,
    is_overdue: a.due_date ? a.due_date < today : false,
  }))

  // Current focus
  let currentFocus: string | null = null
  if (focusRes.data?.content) {
    const content = focusRes.data.content
    currentFocus = typeof content === 'string' ? content : JSON.stringify(content)
  }

  // Initiatives
  const initiatives: InitiativeStatus[] = (initiativesRes.data || []).map((i: any) => ({
    title: i.title || '',
    owner_name: i.owner_name || 'Unknown',
    status: i.status || 'active',
    priority: i.priority || 'P1',
    tasks_in_progress: i.tasks_in_progress || 0,
    tasks_blocked: i.tasks_blocked || 0,
  }))

  // PPP signals — only from the most recent week
  const pppData = pppRes.data || []
  const latestWeek = pppData.length > 0 ? (pppData[0] as any).week_date : null
  const pppSignals: PppSignal[] = (pppData as any[])
    .filter(p => p.week_date === latestWeek)
    .map(p => ({
      workstream_name: p.workstream_name || '',
      lead_name: p.lead_name || 'Unknown',
      status: p.status || 'na',
      summary: p.summary || '',
      quality_score: p.quality_score || 0,
    }))

  return {
    date: today,
    dayOfWeek,
    meetings,
    actionItems,
    currentFocus,
    initiatives,
    pppSignals,
  }
}
