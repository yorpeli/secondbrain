// Adapter: parse the agents' markdown outputs into the typed Dashboard object.
// Pure (no fs, no DB). build-dashboard.ts feeds it file contents.

export interface DashFocus { priorities: string[]; watching: string[]; waitingOn: { item: string; who: string }[] }
export interface DashInitiative { id: string; name: string; status: 'on_track' | 'at_risk' | 'blocked' | 'done'; priority: string; owner: string; note?: string }
export interface DashPerson { name: string; relation: 'manager' | 'report' | 'stakeholder'; team?: string; initiatives?: string[] }
export interface DashTask { id: string; title: string; priority: string; due?: string; initiative?: string }
export interface DashNeed { id: string; kind: string; severity: 'critical' | 'high' | 'medium'; title: string; detail?: string; person?: { name: string; relation: string }; initiative?: string; source: string; at: string; due?: string; action?: string }
export interface DashSignal { id: string; at: string; source: string; text: string; person?: string; initiative?: string; urgent?: boolean }
export interface DashMeeting { id: string; start: string; end: string; title: string; with?: string[]; status: string; note?: string }
export interface DashEOD { summary: string; highlights: string[]; proposedFollowups: { title: string; priority: string }[] }
export interface Dashboard {
  meta: { user: { name: string; role: string; org: string }; generatedAt: string; partOfDay: 'morning' | 'midday' | 'evening'; asof: string }
  needsAttention: DashNeed[]; signals: DashSignal[]; meetings: DashMeeting[]
  tasks: DashTask[]; initiatives: DashInitiative[]; focus: DashFocus; people: DashPerson[]
  endOfDay: DashEOD | null
}

const USER = { name: 'Yonatan Orpeli', role: 'VP Product', org: 'Customer Lifecycle Management' }

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

/** Body lines of a `## <heading>` section (trimmed), or '' if absent. */
export function sectionBody(md: string, heading: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${esc}\\s*$`, 'i').test(l))
  if (start === -1) return ''
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) { if (/^##\s/.test(lines[i])) break; out.push(lines[i]) }
  return out.join('\n').trim()
}

export function parseFocus(focusMd: string): DashFocus {
  const body = sectionBody(focusMd, 'Current Focus')
  try {
    const obj = JSON.parse(body) as Record<string, unknown>
    const waiting = Array.isArray(obj.waiting_on) ? obj.waiting_on : []
    return {
      priorities: Array.isArray(obj.top_priorities) ? (obj.top_priorities as string[]) : [],
      watching: Array.isArray(obj.watching) ? (obj.watching as string[]) : [],
      waitingOn: waiting.map((w: any) => (typeof w === 'string' ? { item: w, who: '' } : { item: w.item ?? String(w), who: w.who ?? '' })),
    }
  } catch {
    return { priorities: [], watching: body ? [body] : [], waitingOn: [] }
  }
}

const STATUS_MAP: Record<string, DashInitiative['status']> = {
  active: 'on_track', blocked: 'blocked', completed: 'done', 'at-risk': 'at_risk', at_risk: 'at_risk',
}

export function parseInitiatives(focusMd: string): DashInitiative[] {
  const body = sectionBody(focusMd, 'Active Initiatives')
  const out: DashInitiative[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s+\((P\d|—)\)\s+—\s+(.+?)\s+·\s+owner:\s+(.+)$/)
    if (!m) continue
    const name = m[1].trim()
    out.push({
      id: slugify(name), name,
      status: STATUS_MAP[m[3].trim().toLowerCase()] ?? 'on_track',
      priority: m[2] === '—' ? 'P2' : m[2], owner: m[4].trim(),
    })
  }
  return out
}

export function parsePeople(focusMd: string): DashPerson[] {
  const body = sectionBody(focusMd, 'People who matter today')
  const out: DashPerson[] = []
  const names = (s: string) => s.split(',').map((n) => n.trim()).filter(Boolean)
  for (const line of body.split('\n')) {
    let m = line.match(/^\*\*Leadership:\*\*\s+(.+)$/)
    if (m) { for (const n of names(m[1])) out.push({ name: n, relation: 'manager' }); continue }
    m = line.match(/^\*\*Direct reports:\*\*\s+(.+)$/)
    if (m) { for (const n of names(m[1])) out.push({ name: n, relation: 'report' }); continue }
    m = line.match(/^-\s+(.+?)\s+\((.+?)\s+·\s+(.+)\)$/) // - Name (role · Initiative)
    if (m) { out.push({ name: m[1].trim(), relation: 'stakeholder', initiatives: [m[3].trim()] }); continue }
  }
  return out
}

export function parseTasks(focusMd: string): DashTask[] {
  const body = sectionBody(focusMd, 'My Open Tasks')
  const out: DashTask[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+\[(P\d)\]\s+(.+)$/)
    if (!m) continue
    const segs = m[2].split(' · ')
    const title = segs[0].trim()
    let due: string | undefined
    let initiative: string | undefined
    for (const seg of segs.slice(1)) {
      const dm = seg.match(/^due\s+(\d{4}-\d{2}-\d{2})$/i)
      if (dm) { due = dm[1] } else { initiative = seg.trim() }
    }
    out.push({ id: slugify(title), title, priority: m[1], due, initiative })
  }
  return out
}

export function derivePartOfDay(hour: number, hasSummary: boolean): 'morning' | 'midday' | 'evening' {
  if (hasSummary) return 'evening'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'midday'
  return 'evening'
}

export interface CaptureZones { needsAttention: DashNeed[]; signals: DashSignal[]; meetings: DashMeeting[] }

/** Parse 02-captures.md into the live zones. `date` supplies the ISO day for `at`/`start`. */
export function parseCaptures(capturesMd: string | null, date: string): CaptureZones {
  const zones: CaptureZones = { needsAttention: [], signals: [], meetings: [] }
  if (!capturesMd) return zones
  const lines = capturesMd.replace(/\r\n/g, '\n').split('\n')
  let blockAt = `${date}T08:00`
  let label: string | null = null
  let nIdx = 0
  let sIdx = 0
  const labelOf = (raw: string): string | null => {
    const m = raw.match(/^\*\*(.+?):\*\*\s*(.*)$/)
    return m ? m[1].toLowerCase().replace(/[⚡\s]+/g, ' ').trim() : null
  }
  const pushNeed = (text: string) => {
    if (!text.trim()) return
    // source is a placeholder — needs items aren't channel-attributed yet (TODO: thread block source when the capture format stabilizes)
    zones.needsAttention.push({ id: `n${nIdx++}`, kind: 'escalation', severity: 'high', title: text.replace(/\*\*/g, '').trim(), source: 'teams', at: blockAt })
  }
  const pushSignal = (src: string, text: string) => {
    if (!text.trim()) return
    zones.signals.push({ id: `s${sIdx++}`, at: blockAt, source: src, text: text.replace(/\*\*/g, '').trim() })
  }
  const pushMeeting = (text: string) => {
    const m = text.match(/(\d{1,2}:\d{2})\s+(.+)/)
    if (!m) return
    const start = `${date}T${m[1].padStart(5, '0')}`
    zones.meetings.push({ id: `mt${zones.meetings.length}`, start, end: start, title: m[2].trim(), status: 'confirmed' })
  }

  for (const raw of lines) {
    const bm = raw.match(/^##\s+(\d{1,2}:\d{2})\b/)
    if (bm) { blockAt = `${date}T${bm[1].padStart(5, '0')}`; label = null; continue }
    const lbl = labelOf(raw)
    if (lbl !== null) {
      label = lbl
      const m = raw.match(/^\*\*.+?:\*\*\s*(.*)$/)
      const inline = m ? m[1].trim() : ''
      if (inline) routeLine(label, inline)
      continue
    }
    const bullet = raw.match(/^\s*-\s+(.*)$/)
    if (bullet && label) routeLine(label, bullet[1])
  }

  function routeLine(lbl: string, text: string) {
    if (/needs attention/.test(lbl)) pushNeed(text)
    else if (/coming up/.test(lbl)) pushMeeting(text)
    else if (/^teams/.test(lbl)) pushSignal('teams', text)
    else if (/^sharepoint/.test(lbl)) pushSignal('sharepoint', text)
    else if (/^mail/.test(lbl)) pushSignal('email', text)
    else if (/^calendar/.test(lbl)) pushSignal('calendar', text)
  }

  zones.signals.sort((a, b) => (a.at < b.at ? 1 : -1)) // newest first
  return zones
}

export function parseSummary(summaryMd: string | null): DashEOD | null {
  if (!summaryMd || !summaryMd.trim()) return null
  const summary = sectionBody(summaryMd, 'Narrative').split('\n\n')[0]?.trim() || sectionBody(summaryMd, 'Narrative').trim()
  // highlights: the "People noted" names + any "closed" lines; fall back to first follow-up items
  const highlights: string[] = []
  for (const line of sectionBody(summaryMd, 'People noted').split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*/)
    if (m) highlights.push(m[1].trim())
  }
  // proposed follow-ups: parse the Follow-ups table rows → title + a default priority
  const proposedFollowups: { title: string; priority: string }[] = []
  let inTable = false
  for (const raw of summaryMd.replace(/\r\n/g, '\n').split('\n')) {
    const l = raw.trim()
    if (!l.startsWith('|')) {
      if (inTable && l === '') continue   // blank line inside a table — keep scanning
      inTable = false
      continue
    }
    const cells = l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (cells[0] === '#' && /item/i.test(cells[1] || '')) { inTable = true; continue }
    if (/^[-:\s]+$/.test(cells[0] || '')) continue
    if (inTable && cells.length >= 2 && cells[1]) proposedFollowups.push({ title: cells[1], priority: 'P2' })
  }
  return { summary, highlights, proposedFollowups }
}

/** `generatedAt` is a local ISO stamp `YYYY-MM-DDTHH:MM` — `meta.asof` is sliced from it. */
export interface AssembleInput { focusMd: string; capturesMd: string | null; summaryMd: string | null; generatedAt: string; hour: number; date: string }

export function assembleDashboard(inp: AssembleInput): Dashboard {
  const hasSummary = !!(inp.summaryMd && inp.summaryMd.trim())
  const cap = parseCaptures(inp.capturesMd, inp.date)
  return {
    meta: { user: USER, generatedAt: inp.generatedAt, partOfDay: derivePartOfDay(inp.hour, hasSummary), asof: inp.generatedAt.slice(11, 16) },
    needsAttention: cap.needsAttention,
    signals: cap.signals,
    meetings: cap.meetings,
    tasks: parseTasks(inp.focusMd),
    initiatives: parseInitiatives(inp.focusMd),
    focus: parseFocus(inp.focusMd),
    people: parsePeople(inp.focusMd),
    endOfDay: parseSummary(inp.summaryMd),
  }
}
