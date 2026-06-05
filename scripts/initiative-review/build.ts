import 'dotenv/config'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSupabase } from '../../lib/supabase.js'
import { renderMarkdown, escapeHtml } from '../../lib/md-to-html.js'

/**
 * Initiative Review builder — gather + render.
 *
 * 1. GATHER (read-only): pulls every active initiative's living memory doc
 *    (content_sections, section_type 'memory', falling back to
 *    'workspace-memory') plus metadata from Supabase, and computes staleness.
 * 2. MERGE: attaches the curated analysis (TL;DR / signals / recommendation)
 *    from ./highlights.json, keyed by slug.
 * 3. RENDER: writes a data snapshot (initiative-review.json) and a
 *    self-contained, offline, double-clickable HTML view
 *    (initiative-review.html) to output/initiatives/.
 *
 * The analysis itself is model-generated (see agents/initiative-review.md);
 * this script is the deterministic gather+render around it.
 *
 * Triggered in natural language ("run an initiative review") — see CLAUDE.md.
 * Manual run: npm run initiative-review
 */

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

interface InitiativeRow {
  id: string
  slug: string
  title: string
  status: string
  priority: string | null
  assigned_agent: string | null
}

interface MemoryRow {
  entity_id: string
  content: string
  updated_at: string
}

interface ReviewItem extends InitiativeRow {
  memory: string | null
  memoryUpdated: string | null
  staleDays: number | null
}

// ----------------------------------------------------------------------------
// Curated analysis — TL;DR + signals + recommendation per initiative.
// Synthesized 2026-06-03 from: memory doc, workspace-memory, workspace-context,
// stakeholders, and context_store.current_focus. No linked tasks/agent_log
// exist for these P0s. Point-in-time; regenerate the analysis when refreshing.
// ----------------------------------------------------------------------------
type Tone = 'risk' | 'warn' | 'ok' | 'info'
interface Highlight {
  tldr: string
  signals: { label: string; value: string; tone: Tone }[]
  recommendation: string[]
}

// Executive overview — qualitative cross-cutting analysis for the landing page.
// Quantitative stats are computed live from the DB; this is the narrative layer.
interface Overview {
  headline: string
  patterns: { title: string; tone: Tone; body: string }[]
  keyDates?: { date: string; label: string }[]
  watchlist?: { slug: string; label: string; note: string }[]
}

// Highlights are generated separately and loaded from JSON so the analysis
// content stays free of TypeScript string-escaping. See
// scripts/initiative-highlights.json (regenerate when refreshing the review).
const __dir = dirname(fileURLToPath(import.meta.url))
const HIGHLIGHTS_RAW = JSON.parse(
  readFileSync(join(__dir, 'highlights.json'), 'utf8')
) as Record<string, unknown>
const ANALYSIS_DATE =
  (HIGHLIGHTS_RAW._meta as { analyzed?: string } | undefined)?.analyzed ?? ''
const OVERVIEW = HIGHLIGHTS_RAW._overview as Overview | undefined
const HIGHLIGHTS: Record<string, Highlight> = Object.fromEntries(
  Object.entries(HIGHLIGHTS_RAW).filter(
    ([k]) => k !== '_meta' && k !== '_overview'
  )
) as Record<string, Highlight>

function renderHighlight(h: Highlight): string {
  const signals = h.signals
    .map(
      (s) =>
        `<div class="sig sig-${s.tone}"><span class="sig-label">${escapeHtml(
          s.label
        )}</span><span class="sig-val">${escapeHtml(s.value)}</span></div>`
    )
    .join('')
  const recs = h.recommendation.map((r) => `<li>${escapeHtml(r)}</li>`).join('')
  return `<section class="highlight">
    <div class="hl-head"><span class="hl-badge">⚡ Highlights &amp; Recommendation</span>
      <span class="hl-src">analyzed ${ANALYSIS_DATE} · memory + workspace + stakeholders + current_focus</span></div>
    <p class="hl-tldr"><strong>TL;DR.</strong> ${escapeHtml(h.tldr)}</p>
    <div class="hl-signals">${signals}</div>
    <div class="hl-rec"><h4>Recommendation</h4><ol>${recs}</ol></div>
  </section>`
}

// Stats for the overview landing page — computed live from the DB.
interface OverviewStats {
  active: number
  onHold: number
  analyzed: number
  unassigned: number
  veryStale: number
  missing: number
  byPriority: { p: string; n: number }[]
}

function renderOverview(stats: OverviewStats, ov: Overview | undefined): string {
  const tiles = [
    { n: stats.active, label: 'Active', cls: '' },
    { n: stats.analyzed, label: '⚡ Analyzed', cls: '' },
    { n: stats.byPriority.find((x) => x.p === 'P0')?.n ?? 0, label: 'P0', cls: 'tile-p0' },
    { n: stats.unassigned, label: 'Unassigned', cls: stats.unassigned ? 'tile-warn' : '' },
    { n: stats.veryStale, label: '>60d stale', cls: stats.veryStale ? 'tile-warn' : '' },
    { n: stats.missing, label: 'No memory', cls: stats.missing ? 'tile-bad' : '' },
    { n: stats.onHold, label: '⏸ On hold', cls: 'tile-muted' },
  ]
    .map(
      (t) =>
        `<div class="tile ${t.cls}"><span class="tile-n">${t.n}</span><span class="tile-l">${t.label}</span></div>`
    )
    .join('')

  const prioBar = stats.byPriority
    .map(
      (x) =>
        `<span class="prio-seg prio-${x.p}" style="flex:${x.n}" title="${x.p}: ${x.n}">${x.p} ${x.n}</span>`
    )
    .join('')

  const patterns = (ov?.patterns ?? [])
    .map(
      (p) =>
        `<div class="ptn ptn-${p.tone}"><div class="ptn-title">${escapeHtml(
          p.title
        )}</div><div class="ptn-body">${escapeHtml(p.body)}</div></div>`
    )
    .join('')

  const dates = (ov?.keyDates ?? [])
    .map(
      (d) =>
        `<div class="kd"><span class="kd-date">${escapeHtml(
          d.date
        )}</span><span class="kd-label">${escapeHtml(d.label)}</span></div>`
    )
    .join('')

  const watch = (ov?.watchlist ?? [])
    .map(
      (w) =>
        `<button class="watch" data-jump="${escapeHtml(w.slug)}">
          <span class="watch-label">${escapeHtml(w.label)}</span>
          <span class="watch-note">${escapeHtml(w.note)}</span>
          <span class="watch-slug">${escapeHtml(w.slug)} →</span>
        </button>`
    )
    .join('')

  return `<article class="panel overview" data-slug="__overview">
    <header class="panel-head">
      <h1>Portfolio Overview</h1>
      <div class="meta-chips">
        <span class="chip">${stats.active} active initiatives</span>
        <span class="chip">⚡ ${stats.analyzed} analyzed</span>
        <span class="chip slug">analysis ${ANALYSIS_DATE}</span>
      </div>
    </header>
    ${ov?.headline ? `<p class="ov-headline">${escapeHtml(ov.headline)}</p>` : ''}
    <div class="tiles">${tiles}</div>
    ${prioBar ? `<div class="prio-bar">${prioBar}</div>` : ''}
    ${
      patterns
        ? `<h2 class="ov-h">Cross-cutting patterns</h2><div class="ptns">${patterns}</div>`
        : ''
    }
    ${
      dates
        ? `<h2 class="ov-h">Key dates</h2><div class="kds">${dates}</div>`
        : ''
    }
    ${
      watch
        ? `<h2 class="ov-h">Needs attention now</h2><div class="watches">${watch}</div>`
        : ''
    }
  </article>`
}

// ----------------------------------------------------------------------------
// Data fetch
// ----------------------------------------------------------------------------
async function fetchData(): Promise<ReviewItem[]> {
  const sb = getSupabase()

  const { data: inits, error: e1 } = await sb
    .from('initiatives')
    .select('id, slug, title, status, priority, assigned_agent')
    .in('status', ['active', 'blocked'])
  if (e1) throw e1

  const ids = (inits as InitiativeRow[]).map((i) => i.id)

  // Prefer the standard 'memory' doc; fall back to 'workspace-memory'.
  const { data: mems, error: e2 } = await sb
    .from('content_sections')
    .select('entity_id, content, updated_at, section_type')
    .in('entity_id', ids)
    .in('section_type', ['memory', 'workspace-memory'])
  if (e2) throw e2

  const memByEntity = new Map<string, MemoryRow>()
  for (const m of mems as (MemoryRow & { section_type: string })[]) {
    const existing = memByEntity.get(m.entity_id)
    // 'memory' wins over 'workspace-memory'
    if (!existing || m.section_type === 'memory') {
      memByEntity.set(m.entity_id, m)
    }
  }

  const now = new Date()
  const items: ReviewItem[] = (inits as InitiativeRow[]).map((i) => {
    const m = memByEntity.get(i.id) ?? null
    let staleDays: number | null = null
    if (m?.updated_at) {
      const upd = new Date(m.updated_at)
      staleDays = Math.floor((now.getTime() - upd.getTime()) / 86_400_000)
    }
    return {
      ...i,
      memory: m?.content ?? null,
      memoryUpdated: m?.updated_at ?? null,
      staleDays,
    }
  })

  items.sort((a, b) => {
    // Active first (by priority), then On Hold (blocked) at the bottom.
    const ha = isOnHold(a) ? 1 : 0
    const hb = isOnHold(b) ? 1 : 0
    if (ha !== hb) return ha - hb
    const pa = PRIORITY_ORDER[a.priority ?? 'P3'] ?? 9
    const pb = PRIORITY_ORDER[b.priority ?? 'P3'] ?? 9
    if (pa !== pb) return pa - pb
    return a.title.localeCompare(b.title)
  })

  return items
}

// ----------------------------------------------------------------------------
// HTML assembly
// ----------------------------------------------------------------------------
function staleClass(days: number | null): string {
  if (days === null) return 'missing'
  if (days > 60) return 'stale-hi'
  if (days >= 30) return 'stale-mid'
  return 'stale-lo'
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

// Tier drives what shows in the detail pane:
//  - 'analyzed' : has a highlight card in highlights.json
//  - 'thin'     : has a memory doc but no analysis yet (banner)
//  - 'missing'  : no memory doc at all (callout)
function tierOf(it: ReviewItem): 'analyzed' | 'thin' | 'missing' {
  if (HIGHLIGHTS[it.slug]) return 'analyzed'
  if (!it.memory) return 'missing'
  return 'thin'
}

// Non-active statuses (currently 'blocked') are parked — grouped under "On Hold"
// at the bottom of the review, greyed but with their cards intact.
function isOnHold(it: ReviewItem): boolean {
  return it.status !== 'active'
}

const SECTION_RANK: Record<string, number> = {
  P0: 0, P1: 1, P2: 2, P3: 3, 'On Hold': 9,
}

function buildHtml(items: ReviewItem[], buildDate: string): string {
  const groups: Record<string, ReviewItem[]> = {}
  for (const it of items) {
    const section = isOnHold(it) ? 'On Hold' : it.priority ?? 'P3'
    ;(groups[section] ||= []).push(it)
  }
  const groupKeys = Object.keys(groups).sort(
    (a, b) => (SECTION_RANK[a] ?? 5) - (SECTION_RANK[b] ?? 5)
  )

  let rowIdx = 0
  const sidebar = groupKeys
    .map((key) => {
      const onHoldGroup = key === 'On Hold'
      const rows = groups[key]
        .map((it) => {
          const sc = staleClass(it.staleDays)
          const staleLabel =
            it.staleDays === null ? 'no memory' : `${it.staleDays}d`
          const warn = it.staleDays === null ? ' ⚠' : ''
          const spark = HIGHLIGHTS[it.slug] ? ' <span class="spark">⚡</span>' : ''
          // On Hold rows show their original priority as a small tag instead of staleness.
          const meta = onHoldGroup
            ? `<span class="tag">${it.priority ?? '—'}</span>`
            : `<span class="badge ${sc}">${staleLabel}</span>`
          const agent = it.assigned_agent
            ? `<span class="tag agent">${escapeHtml(it.assigned_agent)}</span>`
            : `<span class="tag unassigned">unassigned</span>`
          rowIdx++
          return `<button class="nav-row${onHoldGroup ? ' onhold' : ''}" data-slug="${it.slug}">
            <span class="nav-title">${escapeHtml(it.title)}${spark}${warn}</span>
            <span class="nav-meta">${agent}${meta}</span>
          </button>`
        })
        .join('\n')
      const headLabel = onHoldGroup ? '⏸ On Hold' : key
      return `<div class="nav-group${onHoldGroup ? ' onhold-group' : ''}">
        <div class="nav-group-head">${headLabel} <span class="grp-count">${groups[key].length}</span></div>
        ${rows}
      </div>`
    })
    .join('\n')

  const panels = items
    .map((it, i) => {
      const sc = staleClass(it.staleDays)
      const staleLabel =
        it.staleDays === null
          ? 'No memory doc'
          : `${it.staleDays} days stale`
      const body = it.memory
        ? renderMarkdown(it.memory)
        : `<div class="callout warn"><strong>⚠ No memory doc exists for this initiative.</strong><br/>
           There is no <code>memory</code> content section in Supabase — this initiative has no living memory document and needs one created.</div>`
      const agent = it.assigned_agent
        ? escapeHtml(it.assigned_agent)
        : 'unassigned'
      return `<article class="panel${isOnHold(it) ? ' onhold' : ''}" data-slug="${it.slug}" hidden>
        <header class="panel-head">
          <h1>${escapeHtml(it.title)}</h1>
          <div class="meta-chips">
            <span class="chip prio-${it.priority ?? 'P3'}">${it.priority ?? '—'}</span>
            <span class="chip${it.status === 'blocked' ? ' status-blocked' : ''}">${escapeHtml(it.status)}</span>
            <span class="chip">agent: ${agent}</span>
            <span class="chip ${sc}">updated ${fmtDate(it.memoryUpdated)} · ${staleLabel}</span>
            <span class="chip slug">${it.slug}</span>
          </div>
        </header>
        ${
          HIGHLIGHTS[it.slug]
            ? renderHighlight(HIGHLIGHTS[it.slug])
            : tierOf(it) === 'thin'
              ? `<div class="banner">⚡ <strong>Not analyzed in this review.</strong> The memory doc is too sparse for a reliable TL;DR/recommendation — refresh it (or promote the initiative) to include a full card next time.</div>`
              : ''
        }
        <div class="doc">${body}</div>
      </article>`
    })
    .join('\n')

  const activeItems = items.filter((i) => !isOnHold(i))
  const activeCount = activeItems.length
  const onHold = items.length - activeCount
  // Staleness / missing-memory signals describe the live portfolio only.
  const missing = activeItems.filter((i) => i.staleDays === null).length
  const veryStale = activeItems.filter((i) => (i.staleDays ?? 0) > 60).length
  const analyzed = activeItems.filter((i) => HIGHLIGHTS[i.slug]).length
  const unassigned = activeItems.filter((i) => !i.assigned_agent).length

  // Active priority breakdown (P0→P2), only buckets that exist.
  const byPriority = ['P0', 'P1', 'P2', 'P3']
    .map((p) => ({ p, n: activeItems.filter((i) => (i.priority ?? 'P3') === p).length }))
    .filter((x) => x.n > 0)

  const overviewPanel = renderOverview(
    { active: activeCount, onHold, analyzed, unassigned, veryStale, missing, byPriority },
    OVERVIEW
  )
  const overviewNav = `<div class="nav-pinned">
    <button class="nav-row pinned active" data-slug="__overview">
      <span class="nav-title">📋 Portfolio Overview</span>
      <span class="nav-meta"><span class="tag">${activeCount} active · ⚡ ${analyzed}</span></span>
    </button>
  </div>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Initiative Review — ${buildDate}</title>
<style>
  :root{
    --bg:#0f1115; --panel:#161922; --sidebar:#13151c; --line:#262a35;
    --text:#e6e8ee; --muted:#9aa1b1; --faint:#6b7280;
    --accent:#ff4800; --accent-soft:#ff48001a;
    --p0:#ff4d4f; --p1:#3b82f6; --p2:#8b8f9c;
    --green:#22c55e; --amber:#f59e0b; --red:#ef4444; --gray:#6b7280;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{background:var(--bg);color:var(--text);
    font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
  .app{display:grid;grid-template-columns:340px 1fr;height:100vh}

  /* Sidebar */
  .sidebar{background:var(--sidebar);border-right:1px solid var(--line);
    overflow-y:auto;padding:0 0 40px}
  .brand{position:sticky;top:0;background:var(--sidebar);z-index:2;
    padding:18px 18px 12px;border-bottom:1px solid var(--line)}
  .brand h2{margin:0;font-size:15px;letter-spacing:.2px}
  .brand .sub{color:var(--muted);font-size:12px;margin-top:4px}
  .brand .stats{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap}
  .pill{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}
  .pill.bad{color:var(--red);border-color:#ef444455}
  .pill.warnp{color:var(--amber);border-color:#f59e0b55}

  .nav-group{padding:8px 10px 0}
  .nav-group-head{font-size:11px;font-weight:700;letter-spacing:.12em;
    color:var(--faint);text-transform:uppercase;padding:10px 8px 6px;display:flex;gap:8px;align-items:center}
  .grp-count{background:var(--line);color:var(--muted);border-radius:999px;padding:0 7px;font-size:10px}
  .nav-row{display:flex;flex-direction:column;gap:5px;width:100%;text-align:left;
    background:transparent;border:1px solid transparent;border-radius:9px;
    color:var(--text);padding:9px 10px;cursor:pointer;margin-bottom:2px}
  .nav-row:hover{background:#1c1f29}
  .nav-row.active{background:var(--accent-soft);border-color:var(--accent)}
  .nav-title{font-size:13.5px;font-weight:550;line-height:1.3}
  .spark{color:var(--accent);font-size:11px}
  .onhold-group{margin-top:14px;border-top:1px dashed var(--line);padding-top:6px}
  .onhold-group .nav-group-head{color:#6b7280}
  .nav-row.onhold{opacity:.5}
  .nav-row.onhold:hover,.nav-row.onhold.active{opacity:1}
  .nav-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .tag{font-size:10px;padding:1px 6px;border-radius:5px;color:var(--muted);background:#20242f}
  .tag.unassigned{color:#b08;background:#b0086618;color:#e879b9}
  .badge{font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px}
  .badge.stale-lo{background:#22c55e22;color:#5fe39a}
  .badge.stale-mid{background:#f59e0b22;color:#fbbf57}
  .badge.stale-hi{background:#ef444422;color:#ff8a8a}
  .badge.missing{background:#ef444433;color:#ff8a8a}

  /* Detail */
  .main{overflow-y:auto;padding:0}
  .panel{max-width:860px;margin:0 auto;padding:34px 48px 120px}
  .panel-head{border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:8px}
  .panel-head h1{font-size:26px;margin:0 0 12px;line-height:1.2}
  .meta-chips{display:flex;gap:8px;flex-wrap:wrap}
  .chip{font-size:11.5px;padding:3px 10px;border-radius:7px;background:#20242f;color:var(--muted);border:1px solid var(--line)}
  .chip.slug{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--faint)}
  .chip.prio-P0{background:#ff4d4f22;color:#ff9a9b;border-color:#ff4d4f44}
  .chip.prio-P1{background:#3b82f622;color:#93c2ff;border-color:#3b82f644}
  .chip.prio-P2{background:#8b8f9c22;color:#c3c7d1;border-color:#8b8f9c44}
  .chip.stale-mid{background:#f59e0b22;color:#fbbf57;border-color:#f59e0b44}
  .chip.stale-hi{background:#ef444422;color:#ff8a8a;border-color:#ef444444}
  .chip.missing{background:#ef444433;color:#ff8a8a;border-color:#ef444466}
  .chip.status-blocked{background:#f59e0b22;color:#fbbf57;border-color:#f59e0b44}

  /* Highlight / recommendation card */
  .highlight{margin:20px 0 6px;border:1px solid #ff480055;border-left:3px solid var(--accent);
    background:linear-gradient(180deg,#ff48000f,#ff480005);border-radius:12px;padding:18px 20px}
  .hl-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:10px}
  .hl-badge{font-size:12px;font-weight:700;letter-spacing:.04em;color:#ff9a76;text-transform:uppercase}
  .hl-src{font-size:11px;color:var(--faint)}
  .hl-tldr{margin:0 0 14px;font-size:14.5px;line-height:1.6;color:#eef0f4}
  .hl-tldr strong{color:#ff9a76}
  .hl-signals{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
  @media(max-width:760px){.hl-signals{grid-template-columns:1fr}}
  .sig{display:flex;flex-direction:column;gap:2px;padding:8px 11px;border-radius:8px;
    background:#161922;border:1px solid var(--line);border-left:3px solid var(--gray)}
  .sig-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .sig-val{font-size:12.5px;line-height:1.45;color:#d6d9e1}
  .sig-risk{border-left-color:var(--red)}
  .sig-warn{border-left-color:var(--amber)}
  .sig-ok{border-left-color:var(--green)}
  .sig-info{border-left-color:var(--p1)}
  .hl-rec h4{margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#ff9a76}
  .hl-rec ol{margin:0;padding-left:20px}
  .hl-rec li{margin:5px 0;font-size:13.5px;line-height:1.5;color:#e6e8ee}

  /* Sidebar pinned overview row */
  .nav-pinned{padding:10px 10px 0;border-bottom:1px solid var(--line);margin-bottom:4px}
  .nav-row.pinned{background:#1a1d27;border-color:var(--line)}
  .nav-row.pinned.active{background:var(--accent-soft);border-color:var(--accent)}

  /* Overview / front page */
  .overview .ov-headline{font-size:16px;line-height:1.6;color:#eef0f4;margin:20px 0 22px;
    padding-left:14px;border-left:3px solid var(--accent)}
  .overview .ov-h{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
    margin:30px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line)}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px;margin:4px 0 18px}
  .tile{display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:13px 14px;
    background:#161922;border:1px solid var(--line);border-radius:11px;border-top:2px solid var(--gray)}
  .tile-n{font-size:26px;font-weight:700;line-height:1;color:#fff}
  .tile-l{font-size:11px;color:var(--muted)}
  .tile.tile-p0{border-top-color:var(--p0)}
  .tile.tile-warn{border-top-color:var(--amber)}
  .tile.tile-warn .tile-n{color:#fbbf57}
  .tile.tile-bad{border-top-color:var(--red)}
  .tile.tile-bad .tile-n{color:#ff8a8a}
  .tile.tile-muted{border-top-color:var(--gray);opacity:.75}

  .prio-bar{display:flex;gap:4px;margin:0 0 6px;height:30px;border-radius:8px;overflow:hidden}
  .prio-seg{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
    color:#fff;min-width:46px;letter-spacing:.04em}
  .prio-seg.prio-P0{background:#ff4d4f55}
  .prio-seg.prio-P1{background:#3b82f655}
  .prio-seg.prio-P2{background:#8b8f9c55}
  .prio-seg.prio-P3{background:#6b728055}

  .ptns{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  @media(max-width:760px){.ptns{grid-template-columns:1fr}}
  .ptn{padding:14px 16px;border-radius:11px;background:#161922;border:1px solid var(--line);
    border-left:3px solid var(--gray)}
  .ptn-risk{border-left-color:var(--red)}
  .ptn-warn{border-left-color:var(--amber)}
  .ptn-ok{border-left-color:var(--green)}
  .ptn-info{border-left-color:var(--p1)}
  .ptn-title{font-size:14px;font-weight:650;color:#fff;margin-bottom:6px}
  .ptn-body{font-size:13px;line-height:1.55;color:#cdd1da}

  .kds{display:flex;flex-direction:column;gap:0}
  .kd{display:flex;gap:14px;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line)}
  .kd:last-child{border-bottom:0}
  .kd-date{flex:0 0 64px;font-weight:700;color:#ff9a76;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .kd-label{font-size:13px;line-height:1.5;color:#d6d9e1}

  .watches{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:760px){.watches{grid-template-columns:1fr}}
  .watch{display:flex;flex-direction:column;gap:4px;text-align:left;cursor:pointer;
    padding:13px 15px;border-radius:11px;background:#161922;border:1px solid var(--line);
    border-left:3px solid var(--red);color:var(--text)}
  .watch:hover{background:#1c1f29;border-color:var(--accent)}
  .watch-label{font-size:13.5px;font-weight:650;color:#fff}
  .watch-note{font-size:12px;line-height:1.45;color:var(--muted)}
  .watch-slug{font-size:11px;color:#ff9a76;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-top:2px}

  /* Rendered doc */
  .doc{padding-top:18px}
  .doc h1{font-size:21px;margin:26px 0 10px}
  .doc h2{font-size:18px;margin:26px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);color:#fff}
  .doc h3{font-size:15px;margin:18px 0 8px;color:#cfd3dd}
  .doc h4{font-size:13.5px;margin:14px 0 6px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
  .doc p{margin:9px 0;color:#d6d9e1}
  .doc ul,.doc ol{margin:8px 0;padding-left:22px}
  .doc li{margin:4px 0;color:#d6d9e1}
  .doc code{background:#20242f;padding:1px 6px;border-radius:5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:#ffb59b}
  .doc strong{color:#fff}
  .doc a{color:var(--accent)}
  .doc hr{border:0;border-top:1px solid var(--line);margin:20px 0}
  .doc table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13.5px;display:block;overflow-x:auto}
  .doc th,.doc td{border:1px solid var(--line);padding:7px 11px;text-align:left;vertical-align:top}
  .doc th{background:#1c1f29;color:#fff;font-weight:600;white-space:nowrap}
  .doc tbody tr:nth-child(even){background:#171a22}
  .doc td{color:#d6d9e1}
  .doc .logdate{color:var(--accent);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;font-weight:700}
  .callout{padding:16px 18px;border-radius:10px;margin:10px 0}
  .callout.warn{background:#ef44441a;border:1px solid #ef444455;color:#ffc9c9}
  .banner{margin:20px 0 6px;padding:13px 16px;border-radius:10px;font-size:13px;line-height:1.5;
    background:#8b8f9c14;border:1px solid var(--line);border-left:3px solid var(--gray);color:var(--muted)}
  .banner strong{color:#cfd3dd}

  .empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--faint);text-align:center;padding:0 40px}
  .empty[hidden]{display:none}
  .kbdhint{position:fixed;bottom:14px;right:18px;font-size:11px;color:var(--faint);
    background:var(--panel);border:1px solid var(--line);padding:6px 11px;border-radius:8px}
  kbd{background:#20242f;border:1px solid var(--line);border-radius:4px;padding:0 5px;font-size:10px}
  ::-webkit-scrollbar{width:11px}::-webkit-scrollbar-thumb{background:#2a2e3a;border-radius:6px}
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <h2>Initiative Review</h2>
      <div class="sub">${activeCount} active${onHold ? ` · ${onHold} on hold` : ''} · built ${buildDate}</div>
      <div class="stats">
        <span class="pill">${activeCount} active</span>
        <span class="pill">⚡ ${analyzed} analyzed</span>
        ${onHold ? `<span class="pill">⏸ ${onHold} on hold</span>` : ''}
        ${veryStale ? `<span class="pill warnp">${veryStale} &gt;60d stale</span>` : ''}
        ${missing ? `<span class="pill bad">${missing} no memory</span>` : ''}
      </div>
    </div>
    ${overviewNav}
    ${sidebar}
  </aside>
  <main class="main">
    <div class="empty" id="empty" hidden><div>Select an initiative from the left to review its memory doc.<br/>Use <kbd>↑</kbd> / <kbd>↓</kbd> or <kbd>j</kbd> / <kbd>k</kbd> to move through them.</div></div>
    ${overviewPanel}
    ${panels}
  </main>
</div>
<div class="kbdhint"><kbd>j</kbd>/<kbd>k</kbd> or <kbd>↑</kbd>/<kbd>↓</kbd> to navigate · <span id="progress"></span></div>
<script>
  const rows = Array.from(document.querySelectorAll('.nav-row'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const empty = document.getElementById('empty');
  const progress = document.getElementById('progress');
  let idx = 0;

  function show(i){
    if(i<0||i>=rows.length) return;
    idx = i;
    const slug = rows[i].dataset.slug;
    rows.forEach(r=>r.classList.toggle('active', r.dataset.slug===slug));
    panels.forEach(p=>p.hidden = p.dataset.slug!==slug);
    empty.hidden = true;
    rows[i].scrollIntoView({block:'nearest'});
    document.querySelector('.main').scrollTop = 0;
    progress.textContent = (i+1)+' / '+rows.length;
  }
  rows.forEach((r,i)=>r.addEventListener('click',()=>show(i)));
  // Watchlist cards on the overview jump to the relevant initiative.
  document.querySelectorAll('[data-jump]').forEach(el=>{
    el.addEventListener('click',()=>{
      const slug = el.getAttribute('data-jump');
      const i = rows.findIndex(r=>r.dataset.slug===slug);
      if(i>=0) show(i);
    });
  });
  document.addEventListener('keydown',(e)=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.key==='ArrowDown'||e.key==='j'){e.preventDefault();show(idx<0?0:Math.min(idx+1,rows.length-1));}
    else if(e.key==='ArrowUp'||e.key==='k'){e.preventDefault();show(idx<0?0:Math.max(idx-1,0));}
  });
  if(rows.length) show(0);
</script>
</body>
</html>`
}

async function main() {
  const items = await fetchData()
  const buildDate = new Date().toISOString().slice(0, 10)
  const html = buildHtml(items, buildDate)

  const outDir = join(process.cwd(), 'output', 'initiatives')
  mkdirSync(outDir, { recursive: true })

  // Data layer — full snapshot for separate consumption.
  const activeItems = items.filter((i) => !isOnHold(i))
  const data = {
    generated: buildDate,
    analysisDate: ANALYSIS_DATE,
    overview: OVERVIEW ?? null,
    counts: {
      total: items.length,
      active: activeItems.length,
      onHold: items.length - activeItems.length,
      analyzed: activeItems.filter((i) => HIGHLIGHTS[i.slug]).length,
      unassigned: activeItems.filter((i) => !i.assigned_agent).length,
      missingMemory: activeItems.filter((i) => i.memory === null).length,
      veryStale: activeItems.filter((i) => (i.staleDays ?? 0) > 60).length,
    },
    initiatives: items.map((it) => ({
      slug: it.slug,
      title: it.title,
      priority: it.priority,
      status: it.status,
      onHold: isOnHold(it),
      assigned_agent: it.assigned_agent,
      memoryUpdated: it.memoryUpdated,
      staleDays: it.staleDays,
      tier: tierOf(it),
      highlight: HIGHLIGHTS[it.slug] ?? null,
      memory: it.memory,
    })),
  }
  const jsonPath = join(outDir, 'initiative-review.json')
  const htmlPath = join(outDir, 'initiative-review.html')
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8')
  writeFileSync(htmlPath, html, 'utf8')

  const missing = activeItems.filter((i) => i.memory === null).map((i) => i.slug)
  console.log(
    `✓ ${data.counts.active} active · ${data.counts.onHold} on hold · ${data.counts.analyzed} analyzed · ${data.counts.veryStale} >60d stale`
  )
  if (missing.length) console.log(`⚠ No memory doc: ${missing.join(', ')}`)
  console.log(`→ ${htmlPath}`)
  console.log(`→ ${jsonPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
