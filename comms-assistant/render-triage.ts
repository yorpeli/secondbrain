// render-triage.ts — self-contained HTML triage page for reviewing comms one-by-one.
// Master-detail: left list (channel-iconed) + main canvas for the selected item. Dark/light toggle.
// Each detail, left→middle→right:
//   ① Original — channel icon + subject; optional Thread summary (multi-msg threads) then latest message.
//   ② Context — Memory brief (lead) + sources · People (known-first, +N more) · collapsed Guardrails(T2)
//      & Rules. All from assembleContext (T1/T2/spine/T3).
//   ③ Suggested response — disposition/needs_data/confidence badges · HE⇄EN toggle (when text_alt set,
//      preserves per-language edits + flips dir) · Copy · prominent "Why this draft".
// Channel-aware open button + leading icon: 'outlook' (email) | 'teams' | 'meeting'. Shell/styling +
// theme + interactions live in templates/triage.html (editable).
//   npx tsx comms-assistant/render-triage.ts --file=<items.json> [--out=<path>]
// items.json: array of {
//   email:      { subject, from, date, to, excerpt, webLink, channel?, thread_summary? }
//   thread:     ThreadInput (retrieve.ts) — assembleContext() is called per item for ②
//   suggestion: { disposition, needs_data, confidence, text, why,
//                 lang?, lang_alt?, text_alt?,                 // HE⇄EN toggle
//                 memory_brief?: string | { summary?, points?[] } }
// }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { assembleContext, type ContextBundle } from './retrieve.js'

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const relColor: Record<string, string> = {
  'direct-report': '#3b82f6', 'skip-level': '#06b6d4', peer: '#22c55e',
  manager: '#a855f7', external: '#9ca3af', unknown: '#9ca3af',
}
const weightBadge: Record<string, string> = { assert: '#dc2626', whisper: '#d97706', track: '#6b7280' }

// Channel icon: outlook=envelope, teams=chat bubble, meeting=calendar. Inline SVG (offline-safe).
const channelMeta: Record<string, { label: string; color: string; svg: string }> = {
  outlook: { label: 'Email', color: '#3b82f6', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>' },
  teams: { label: 'Teams', color: '#7b83eb', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.6 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.6-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' },
  meeting: { label: 'Meeting', color: '#d97706', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
}
const cicon = (ch: string) => {
  const m = channelMeta[ch] || channelMeta.outlook
  return `<span class="cicon" style="color:${m.color}" title="${m.label}">${m.svg}</span>`
}

// memory_brief accepts a plain string OR { summary?, points?[] } for a structured, scannable brief.
function briefHtml(mb: any): string {
  if (mb && typeof mb === 'object') {
    const sum = mb.summary ? `<div class="brief-sum">${esc(mb.summary)}</div>` : ''
    const pts = Array.isArray(mb.points) && mb.points.length
      ? `<ol class="brief-pts">${mb.points.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ol>` : ''
    return (sum || pts) ? `<div class="brief">${sum}${pts}</div>` : '<div class="brief muted">nothing material in memory</div>'
  }
  return mb && String(mb).trim()
    ? `<div class="brief">${esc(String(mb))}</div>` : '<div class="brief muted">nothing material in memory</div>'
}

function listItem(item: any, i: number): string {
  const e = item.email, s = item.suggestion
  return `<button class="li" id="li${i}" onclick="sel(${i})">
    <div class="li-subj">${cicon(e.channel)}${esc(e.subject)}</div>
    <div class="li-meta">${esc(e.from)}</div>
    <div class="li-badges"><span class="badge dp">${esc(s.disposition)}</span>${s.needs_data ? '<span class="badge nd">data</span>' : ''}<span class="badge cf">${esc(s.confidence)}</span></div>
  </button>`
}

function detail(item: any, b: ContextBundle, i: number): string {
  const e = item.email, s = item.suggestion
  // Known people (in DB) first, external/unknown after; collapse the overflow past 5.
  const chip = (p: any) => {
    const c = relColor[p.relation] || '#9ca3af'
    return `<span class="chip" style="border-color:${c};color:${c}">${esc(p.name || p.email)}${p.inDb ? ` · ${esc(p.relation)}` : ' · external'}</span>`
  }
  // Drop Yonatan himself — he's the reader, not a participant to surface.
  const isYonatan = (p: any) => p.slug === 'yonatan-orpeli' || /yonatanorp@|yorpeli@/i.test(p.email || '')
  const sortedPeople = b.participants.filter((p) => !isYonatan(p)).sort((a, z) => Number(z.inDb) - Number(a.inDb))
  const head = sortedPeople.slice(0, 5).map(chip).join(' ')
  const tail = sortedPeople.slice(5)
  const people = !sortedPeople.length
    ? '<span class="muted">—</span>'
    : tail.length
      ? `${head} <span id="pp${i}" class="hidden">${tail.map(chip).join(' ')}</span>` +
        `<button class="morebtn" onclick="togMore('pp${i}',this,${tail.length})">+${tail.length} more</button>`
      : head
  const redlines = b.ownership?.redLines?.length
    ? `<ul class="rl">${b.ownership.redLines.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<span class="muted">—</span>'
  const rules = b.rules.length
    ? b.rules.map((r) => `<div class="rule"><span class="wb" style="background:${weightBadge[r.weight]}">${r.weight}</span> ${esc(r.statement.slice(0, 160))}</div>`).join('') : '<span class="muted">none fired</span>'
  const brief = briefHtml(s.memory_brief)
  const sources = b.narrative.length
    ? `<div class="src">sources: ${b.narrative.map((n) => esc(n.provenance)).join(' · ')}</div>` : ''
  const nd = s.needs_data ? `<span class="badge nd">needs data</span>` : ''
  // Bilingual draft: when text_alt is present, offer a HE/EN toggle. Primary (text) is the one to send.
  const hasHe = (t: string) => /[֐-׿]/.test(t || '')
  const hasAlt = !!(s.text_alt && String(s.text_alt).trim())
  const heDir = hasHe(s.text) ? 'rtl' : 'ltr'
  const langA = (s.lang || (hasHe(s.text) ? 'HE' : 'EN')).toUpperCase()
  const langB = (s.lang_alt || (hasHe(s.text_alt) ? 'HE' : 'EN')).toUpperCase()
  // Channel-aware open button (outlook | teams | …). Default outlook.
  const channels: Record<string, string> = { outlook: 'Open in Outlook', teams: 'Open in Teams', gmail: 'Open in Gmail' }
  const openLabel = channels[e.channel] || channels.outlook
  const tsum = e.thread_summary && String(e.thread_summary).trim()
    ? `<div class="lbl">Thread summary</div><div class="tsum">${esc(e.thread_summary)}</div><div class="lbl">Latest message</div>` : ''
  return `<div class="detail" id="d${i}">
    <header class="ch">
      <div><div class="subj">${cicon(e.channel)}${esc(e.subject)}</div>
      <div class="meta">from <b>${esc(e.from)}</b> · ${esc(e.date)} · to ${esc(e.to)}</div></div>
      <a class="btn primary" href="${esc(e.webLink)}" target="_blank" rel="noopener" onclick="navigator.clipboard.writeText(document.getElementById('t${i}').value)">${openLabel} + copy draft ↗</a>
    </header>
    <div class="cols">
      <section class="col"><h3>① Original</h3>${tsum}<div class="excerpt">${esc(e.excerpt)}</div></section>
      <section class="col"><h3>② Context</h3>
        <div class="lbl">Memory brief</div>${brief}${sources}
        <div class="lbl">People</div><div class="people">${people}</div>
        <div class="lbl tog collapsed" onclick="togSec(this)"><span class="car">▸</span> Guardrails (T2)${b.ownership?.redLines?.length ? ` · ${b.ownership.redLines.length}` : ''}</div>
        <div class="sec hidden">${redlines}</div>
        <div class="lbl tog collapsed" onclick="togSec(this)"><span class="car">▸</span> Rules that fired${b.rules.length ? ` · ${b.rules.length}` : ''}</div>
        <div class="sec hidden">${rules}</div>
      </section>
      <section class="col"><h3>③ Suggested response <span class="badge dp">${esc(s.disposition)}</span>${nd}<span class="badge cf">${esc(s.confidence)}</span></h3>
        ${hasAlt ? `<div class="langtog"><span class="langnote">you send the first; EN is to check intent</span>
          <button class="langbtn on" onclick="setLang(${i},'a',this)">${esc(langA)}</button>
          <button class="langbtn" onclick="setLang(${i},'b',this)">${esc(langB)}</button></div>` : ''}
        <textarea id="t${i}" class="draft" dir="${heDir}" data-cur="a" data-a="${esc(s.text)}"${hasAlt ? ` data-b="${esc(s.text_alt)}"` : ''} rows="11">${esc(s.text)}</textarea>
        <div class="row"><button class="btn copy" onclick="navigator.clipboard.writeText(document.getElementById('t${i}').value);this.textContent='Copied ✓';setTimeout(()=>this.textContent='Copy',1200)">Copy</button></div>
        <div class="why"><span class="why-lbl">Why this draft</span>${esc(s.why)}</div>
      </section>
    </div>
  </div>`
}

async function main(file: string, out: string) {
  const items = JSON.parse(readFileSync(file, 'utf8'))
  const lis: string[] = [], details: string[] = []
  for (let i = 0; i < items.length; i++) {
    const b = await assembleContext(items[i].thread)
    lis.push(listItem(items[i], i))
    details.push(detail(items[i], b, i))
  }
  const subtitle = `${items.length} item${items.length === 1 ? '' : 's'} needing a response · you send from Outlook`
  const tpl = readFileSync(new URL('templates/triage.html', import.meta.url), 'utf8')
  const htmlOut = tpl
    .replace('{{TITLE}}', 'Comms Triage')
    .replace('{{SUBTITLE}}', () => esc(subtitle))
    .replace('{{LIST}}', () => lis.join('\n'))
    .replace('{{DETAILS}}', () => details.join('\n'))
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, htmlOut)
  console.log('wrote ' + out)
}

const file = process.argv.find((a) => a.startsWith('--file='))?.slice(7)
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) || 'output/comms-triage/triage.html'
if (!file) { console.error('--file=<items.json> required'); process.exit(1) }
main(file, out).catch((e) => { console.error(e); process.exit(1) })
