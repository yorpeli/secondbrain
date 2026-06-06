/**
 * AI PM — Portfolio command (inward loop)
 *
 * Deterministic dashboard across every AI initiative: status, memory freshness,
 * latest PPP signal, open blockers, pending tasks — plus flags (unowned, stale,
 * blocked, missing memory). No LLM needed.
 */

import { AI_PORTFOLIO_SLUGS, AGENT_SLUG, isOnHold } from '../lib/config.js'
import type { InitiativeSnapshot, PortfolioFlag, PortfolioResult } from '../lib/types.js'

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

const PPP_HEADERS = ['## PPP Signals (week-over-week)', '## PPP Signals']
const BLOCKER_HEADERS = ['## Blockers & Risks', '## Blockers and Risks', '## Blockers']

function sectionLines(content: string, headers: string[]): string[] | null {
  const lines = content.split('\n')
  const wanted = headers.map(h => h.toLowerCase())
  for (let i = 0; i < lines.length; i++) {
    if (wanted.includes(lines[i].trim().toLowerCase())) {
      let j = i + 1
      while (j < lines.length && !/^##\s/.test(lines[j])) j++
      return lines.slice(i + 1, j)
    }
  }
  return null
}
const firstStatusLine = (c: string) => sectionLines(c, ['## Status'])?.find(l => l.trim() !== '')?.trim() ?? null
const blockerBullets = (c: string) => (sectionLines(c, BLOCKER_HEADERS) ?? []).filter(l => /^\s*-\s+/.test(l))
function lastPppSignal(c: string): string | null {
  const bullets = (sectionLines(c, PPP_HEADERS) ?? []).filter(l => /^\s*-\s+/.test(l))
  return bullets.length ? bullets[bullets.length - 1].trim() : null
}

const daysSince = (iso: string | null): number | null =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null

export async function run(options: { days?: number } = {}): Promise<PortfolioResult> {
  const days = options.days ?? 7
  const supabase = await getSupabase()

  const { data: inits } = await supabase
    .from('initiatives' as any)
    .select('id, slug, title, status, priority, assigned_agent')
    .in('slug', [...AI_PORTFOLIO_SLUGS])

  const initiatives = (inits || []) as unknown as Array<{
    id: string; slug: string; title: string; status: string | null; priority: string | null; assigned_agent: string | null
  }>

  const snapshots: InitiativeSnapshot[] = []
  const flags: PortfolioFlag[] = []

  for (const it of initiatives) {
    const { data: mem } = await supabase
      .from('content_sections' as any)
      .select('content, updated_at')
      .eq('entity_id', it.id).eq('section_type', 'memory')
      .limit(1).single()

    const content = (mem as any)?.content as string | undefined
    const memUpdated = (mem as any)?.updated_at as string | undefined ?? null

    const { count: pendingCount } = await supabase
      .from('agent_tasks' as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .contains('tags', [it.slug])

    const onHold = isOnHold(it.slug)
    const snap: InitiativeSnapshot = {
      slug: it.slug,
      title: it.title,
      status: it.status,
      priority: it.priority,
      assigned_agent: it.assigned_agent,
      memory_status_line: content ? firstStatusLine(content) : null,
      memory_updated: memUpdated,
      latest_ppp_signal: content ? lastPppSignal(content) : null,
      open_blockers: content ? blockerBullets(content).length : 0,
      pending_tasks: pendingCount ?? 0,
      on_hold: onHold,
    }
    snapshots.push(snap)

    // ── Flags ── (parked initiatives are intentionally un-flagged)
    if (onHold) continue
    if (it.assigned_agent !== AGENT_SLUG) {
      flags.push({ slug: it.slug, severity: it.priority === 'P0' ? 'high' : 'medium', message: `not owned by ${AGENT_SLUG} (assigned_agent=${it.assigned_agent ?? 'null'})` })
    }
    if (!content) {
      flags.push({ slug: it.slug, severity: 'high', message: 'no memory doc' })
    } else {
      const stale = daysSince(memUpdated)
      if (stale != null && stale > 14) {
        flags.push({ slug: it.slug, severity: stale > 30 ? 'high' : 'medium', message: `memory stale (${stale}d since update)` })
      }
    }
    if (it.status === 'blocked') {
      flags.push({ slug: it.slug, severity: it.priority === 'P0' ? 'high' : 'medium', message: 'initiative status = blocked' })
    }
  }

  const missing = AI_PORTFOLIO_SLUGS.filter(s => !initiatives.some(i => i.slug === s) && !isOnHold(s))
  for (const s of missing) flags.push({ slug: s, severity: 'high', message: 'initiative not found in DB' })

  // ── Summary ──
  const order = { high: 0, medium: 1, low: 2 } as const
  flags.sort((a, b) => order[a.severity] - order[b.severity])

  const byPriority = (a: InitiativeSnapshot, b: InitiativeSnapshot) => (a.priority ?? 'P9').localeCompare(b.priority ?? 'P9')
  const active = snapshots.filter(s => !s.on_hold).sort(byPriority)
  const held = snapshots.filter(s => s.on_hold).sort(byPriority)

  const parts: string[] = []
  parts.push(`AI Portfolio — ${active.length} active, ${held.length} on hold, ${flags.length} flag(s) [window ${days}d]`)
  parts.push('')
  for (const s of active) {
    const owned = s.assigned_agent === AGENT_SLUG ? '' : `  ⚠ owner:${s.assigned_agent ?? 'none'}`
    parts.push(`[${s.priority ?? '—'}] ${s.slug} (${s.status ?? '—'})${owned}`)
    if (s.memory_status_line) parts.push(`   status: ${s.memory_status_line.replace(/\*\*/g, '')}`)
    if (s.latest_ppp_signal) parts.push(`   ppp:    ${s.latest_ppp_signal.replace(/^-\s*/, '')}`)
    parts.push(`   blockers: ${s.open_blockers} | pending tasks: ${s.pending_tasks} | memory: ${s.memory_updated?.slice(0, 10) ?? 'none'}`)
  }
  if (flags.length) {
    parts.push('')
    parts.push('Flags:')
    for (const f of flags) parts.push(`   ${f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '⚪'} ${f.slug}: ${f.message}`)
  }
  if (held.length) {
    parts.push('')
    parts.push('On hold (parked — PM does no active work):')
    for (const s of held) parts.push(`   · [${s.priority ?? '—'}] ${s.slug} (${s.status ?? '—'})`)
  }

  return { generated_for_days: days, snapshots, flags, summary: parts.join('\n') }
}
