/**
 * Daily Summary — Briefing Composer
 *
 * Takes structured data from gather.ts and composes a natural-sounding
 * spoken briefing text. Written for the ear, not the eye.
 */

import type { DailySummaryData } from './gather.js'

export function composeBriefing(data: DailySummaryData): string {
  const sections: string[] = []

  // 1. Greeting
  sections.push(
    `Good morning Yonatan. Here's your briefing for ${data.dayOfWeek}, ${formatDate(data.date)}.`
  )

  // 2. Today's meetings
  if (data.meetings.length > 0) {
    const meetingLines = data.meetings.map(m => {
      const attendeeStr = m.attendees.length > 0
        ? ` with ${joinNames(m.attendees)}`
        : ''
      const purposeStr = m.purpose ? `. ${m.purpose}` : ''
      return `${formatMeetingType(m.meeting_type)}${attendeeStr}: ${m.topic}${purposeStr}`
    })
    sections.push(
      `You have ${data.meetings.length} meeting${data.meetings.length > 1 ? 's' : ''} today. ` +
      meetingLines.join('. ') + '.'
    )
  }

  // 3. Action items due today or overdue
  if (data.actionItems.length > 0) {
    const overdue = data.actionItems.filter(a => a.is_overdue)
    const dueToday = data.actionItems.filter(a => !a.is_overdue)

    const parts: string[] = []

    if (overdue.length > 0) {
      const overdueLines = overdue.slice(0, 3).map(a =>
        `${a.owner_name}: ${a.description}`
      )
      parts.push(
        `${overdue.length} overdue action item${overdue.length > 1 ? 's' : ''}. ` +
        overdueLines.join('. ')
      )
    }

    if (dueToday.length > 0) {
      const todayLines = dueToday.slice(0, 3).map(a =>
        `${a.owner_name}: ${a.description}`
      )
      parts.push(
        `${dueToday.length} item${dueToday.length > 1 ? 's' : ''} due today. ` +
        todayLines.join('. ')
      )
    }

    sections.push(parts.join('. '))
  }

  // 4. Current focus / blockers
  if (data.currentFocus) {
    const focusSummary = extractFocusHighlights(data.currentFocus)
    if (focusSummary) {
      sections.push(focusSummary)
    }
  }

  // 5. Initiative status
  const blockedInitiatives = data.initiatives.filter(i => i.tasks_blocked > 0)
  if (blockedInitiatives.length > 0) {
    const lines = blockedInitiatives.map(i =>
      `${i.title}, owned by ${i.owner_name}, has ${i.tasks_blocked} blocked task${i.tasks_blocked > 1 ? 's' : ''}`
    )
    sections.push(`Initiative blockers: ${lines.join('. ')}.`)
  }

  // 6. PPP signals
  if (data.pppSignals.length > 0) {
    const atRisk = data.pppSignals.filter(s => s.status === 'at-risk')
    const potentialIssues = data.pppSignals.filter(s => s.status === 'potential-issues')

    const signalParts: string[] = []
    if (atRisk.length > 0) {
      const riskLines = atRisk.slice(0, 3).map(s =>
        `${s.workstream_name} led by ${s.lead_name}`
      )
      signalParts.push(`At risk: ${riskLines.join(', ')}`)
    }
    if (potentialIssues.length > 0) {
      const issueLine = potentialIssues.slice(0, 3).map(s =>
        `${s.workstream_name}`
      )
      signalParts.push(`Potential issues in ${issueLine.join(', ')}`)
    }
    if (signalParts.length > 0) {
      sections.push(`From the latest PPP. ${signalParts.join('. ')}.`)
    }
  }

  // 7. Sign-off
  sections.push("That's your briefing. Have a great day.")

  return sections.join('\n\n')
}

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatMeetingType(type: string): string {
  const map: Record<string, string> = {
    '1on1': 'One-on-one',
    'team': 'Team meeting',
    'leadership': 'Leadership meeting',
    'external': 'External meeting',
    'project': 'Project meeting',
  }
  return map[type] || 'Meeting'
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1]
}

function extractFocusHighlights(focus: string): string | null {
  // The current_focus field can be plain text or JSON.
  // Extract key watching/blocked items for the briefing.
  try {
    const parsed = JSON.parse(focus)
    const parts: string[] = []

    if (parsed.blockers && Array.isArray(parsed.blockers) && parsed.blockers.length > 0) {
      parts.push(`Active blockers: ${parsed.blockers.slice(0, 3).join('. ')}`)
    }
    if (parsed.watching && Array.isArray(parsed.watching) && parsed.watching.length > 0) {
      parts.push(`Watching: ${parsed.watching.slice(0, 3).join('. ')}`)
    }
    if (parsed.priorities && Array.isArray(parsed.priorities) && parsed.priorities.length > 0) {
      parts.push(`Top priorities: ${parsed.priorities.slice(0, 3).join('. ')}`)
    }

    return parts.length > 0 ? parts.join('. ') + '.' : null
  } catch {
    // Plain text — use as-is but truncate for spoken delivery
    const trimmed = focus.trim()
    if (trimmed.length > 300) {
      return `Current focus: ${trimmed.slice(0, 300)}...`
    }
    return trimmed.length > 0 ? `Current focus: ${trimmed}` : null
  }
}
