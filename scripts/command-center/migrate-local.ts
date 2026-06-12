// One-time migration: local command-center/ files -> Supabase backbone (v2).
// See scripts/command-center/MIGRATE-LOCAL.md. Idempotent on days (upsert by day);
// captures are INSERTs guarded by a per-day "already has rows" check.
import 'dotenv/config'
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getSupabase } from '../../lib/supabase.js'

const ROOT = join(process.cwd(), 'command-center')
const DAILY = join(ROOT, 'daily')
const APPLY = process.argv.includes('--apply')

// ---- conservative slug lookup (high precision: full multi-word name / full title only) ----
// People: only names with a space, excluding Yonatan himself (he owns every capture -> noise).
const PEOPLE: { slug: string; name: string }[] = [
  { slug: 'adi-gdalyahu', name: 'Adi Gdalyahu' }, { slug: 'almog-azlan', name: 'Almog Azlan' },
  { slug: 'amichai-davidovich', name: 'Amichai Davidovich' }, { slug: 'amit-hasson', name: 'Amit Hasson' },
  { slug: 'amit-lipschitz', name: 'Amit Lipschitz' }, { slug: 'asaf-peled', name: 'Asaf Peled' },
  { slug: 'aviv-calev', name: 'Aviv Calev' }, { slug: 'barak-sandach', name: 'Barak Sandach' },
  { slug: 'chen-alcalay', name: 'Chen Alcalay' }, { slug: 'daniel-grin', name: 'Daniel Grin' },
  { slug: 'elad-naama', name: 'Elad Naama' }, { slug: 'elad-schnarch', name: 'Elad Schnarch' },
  { slug: 'eliya-milstein', name: 'Eliya Milstein' }, { slug: 'estella-cherques-balassiano', name: 'Estella Cherques Balassiano' },
  { slug: 'gaurav-gupta', name: 'Gaurav Gupta' }, { slug: 'hadas-sheinfeld', name: 'Hadas Sheinfeld' },
  { slug: 'hila-medina-kraus', name: 'Hila Medina Kraus' }, { slug: 'ian-hubbard', name: 'Ian Hubbard' },
  { slug: 'ido-seter', name: 'Ido Seter' }, { slug: 'ira-martinenko', name: 'Ira Martinenko' },
  { slug: 'jehonathan-bar', name: 'Jehonathan Bar' }, { slug: 'jojo-china', name: 'Jojo Zhou' },
  { slug: 'liat-ashkenazi', name: 'Liat Ashkenazi' }, { slug: 'liron-hulmi', name: 'Liron Hulmi' },
  { slug: 'maya-bar', name: 'Maya Bar' }, { slug: 'meital-lahat-dekter', name: 'Meital Lahat Dekter' },
  { slug: 'meytal-ashkenazi', name: 'Meytal Ashkenazi' }, { slug: 'michael-seg', name: 'Michael Seg' },
  { slug: 'mor-barazani', name: 'Mor Barazani' }, { slug: 'mor-lalush-regev', name: 'Mor Lalush-Regev' },
  { slug: 'mor-saar', name: 'Mor Saar' }, { slug: 'nadia-gorodetsky', name: 'Nadia Gorodetsky' },
  { slug: 'nishant-jaiswal', name: 'Nishant Jaiswal' }, { slug: 'noga-moscovitch', name: 'Noga Moscovitch' },
  { slug: 'ofer-koifman', name: 'Ofer Koifman' }, { slug: 'omer-shnhar', name: 'Omer Shnhar' },
  { slug: 'oren-ryngler', name: 'Oren Ryngler' }, { slug: 'rona-co', name: 'Rona Co' },
  { slug: 'sarit-manor', name: 'Sarit Manor' }, { slug: 'sean-goh', name: 'Sean Goh' },
  { slug: 'shilhav-ben-david', name: 'Shilhav Ben David' }, { slug: 'sitara-zafar', name: 'Sitara Zafar' },
  { slug: 'sivan-teplitz', name: 'Sivan Teplitz' }, { slug: 'tal-arnon', name: 'Tal Arnon' },
  { slug: 'tally-bachar', name: 'Tally Bachar' }, { slug: 'tom-has', name: 'Tom Has' },
  { slug: 'tom-tomer', name: 'Tom Tomer' }, { slug: 'vladimir-pimonov', name: 'Vladimir Pimonov' },
  { slug: 'weisong-li', name: 'Weisong Li' }, { slug: 'ya-wen', name: 'Ya Wen' },
  { slug: 'yael-feldhiem', name: 'Yael Feldhiem' }, { slug: 'yaniv-oved', name: 'Yaniv Oved' },
  { slug: 'yarden-reitzes', name: 'Yarden Reitzes' }, { slug: 'yaron-zakai-or', name: 'Yaron Zakai Or' },
  { slug: 'yonatan-birger', name: 'Yonatan Birger' }, { slug: 'yonatan-leket', name: 'Yonatan Leket' },
  { slug: 'yonatan-ramot', name: 'Yonatan Ramot' }, { slug: 'yoni-kahati', name: 'Yoni Kahati' },
].filter((p) => p.name.includes(' '))

const INITIATIVES: { slug: string; title: string }[] = [
  { slug: 'ai-academy-product', title: 'AI Academy — Product Team Syllabus & Plan' },
  { slug: 'ai-think-tank', title: 'AI Think Tank — Enterprise AI Strategy' },
  { slug: 'ai-native-team-structure', title: 'AI-Native Team Operating Model & Job Descriptions' },
  { slug: 'ai-powered-pm-team', title: 'AI-Powered PM Team' },
  { slug: 'air-ai-revolution', title: 'AIR — AI Revolution' },
  { slug: 'air-squared', title: 'AIR² — Fast AI Disruption' },
  { slug: 'backoffice-modernization', title: 'Back Office Modernization' },
  { slug: 'china-hong-kong', title: 'China & Hong Kong Expansion' },
  { slug: 'claude-kyc-agent', title: 'Claude KYC Agent' },
  { slug: 'clm-dashboards-monitoring', title: 'CLM Dashboards & Monitoring' },
  { slug: 'clm-full-rollout', title: 'CLM Full Rollout' },
  { slug: 'clm-narrative', title: 'CLM Narrative & External Positioning' },
  { slug: 'clm-rollout-retro', title: 'CLM Rollout Retrospective' },
  { slug: 'clm-war-room', title: 'CLM Rollout War Room' },
  { slug: 'compliance-data-quality', title: 'Compliance & Data Quality Improvements' },
  { slug: 'delegated-onboarding', title: 'Delegated Onboarding' },
  { slug: 'ebay-engagement', title: 'eBay — Enterprise Customer Engagement' },
  { slug: 'india-license', title: 'India License Implementation' },
  { slug: 'kyc-new-flow', title: 'KYC New Flow' },
  { slug: 'kyc-product-ops-working-group', title: 'KYC Product & Operations Working Group' },
  { slug: 'vendor-optimization', title: 'KYC Vendor Optimization' },
  { slug: 'kyc-as-product', title: 'KYC-as-a-Product Strategic Opportunity' },
  { slug: 'lead-scoring', title: 'Lead Scoring' },
  { slug: 'licenses-regulation', title: 'Licenses & Regulation' },
  { slug: 'localization-what-went-right', title: 'Localization — What Went Right' },
  { slug: 'dlc-ai-era', title: 'New Delivery Lifecycle (DLC) for PMs in the AI Era' },
  { slug: 'partners-rollout', title: 'Partners Rollout' },
  { slug: 'pm-workshop-2026', title: 'PM Team Workshop: Building the Playbook' },
  { slug: 't1-localization', title: 'T1 Country Localization' },
  { slug: 'yael-maternity-transition', title: 'Yael Maternity Leave Transition' },
]

function matchPeople(text: string): string[] {
  const lc = text.toLowerCase()
  return PEOPLE.filter((p) => lc.includes(p.name.toLowerCase())).map((p) => p.slug)
}
function matchInitiatives(text: string): string[] {
  const lc = text.toLowerCase()
  return INITIATIVES.filter((i) => lc.includes(i.title.toLowerCase())).map((i) => i.slug)
}

function mtimeIso(path: string, fallbackIso: string): string {
  try {
    return new Date(statSync(path).mtime).toISOString()
  } catch {
    return fallbackIso
  }
}

// Local capture timestamps were recorded Asia/Jerusalem; June 2026 = IDT (UTC+3).
function localToUtc(day: string, hhmm: string): string {
  return new Date(`${day}T${hhmm}:00+03:00`).toISOString()
}

interface ParsedCapture {
  hhmm: string
  headline: string
  needs_attention: string | null
  body_md: string
}

function parseCaptures(md: string): ParsedCapture[] {
  const lines = md.split('\n')
  const headIdx: number[] = []
  const headRe = /^##\s+(\d{1,2}:\d{2})\b/
  lines.forEach((l, i) => {
    if (headRe.test(l)) headIdx.push(i)
  })
  const out: ParsedCapture[] = []
  for (let h = 0; h < headIdx.length; h++) {
    const start = headIdx[h]
    const end = h + 1 < headIdx.length ? headIdx[h + 1] : lines.length
    const headLine = lines[start]
    const m = headLine.match(/^##\s+(\d{1,2}:\d{2})\s*(?:[—-]\s*(.*))?$/)
    const hhmm = m![1]
    const headline = (m![2]?.trim() || 'capture').trim()
    const bodyLines = lines.slice(start + 1, end)
    // strip trailing/standalone --- separators
    const filtered = bodyLines.filter((l) => l.trim() !== '---')
    // extract needs-attention line(s): the "**⚡ Needs attention:**" label and the
    // bullets under it until a blank line, removed from body.
    let needs: string | null = null
    const naLabelIdx = filtered.findIndex((l) => /\*\*.*Needs attention:?\*\*/i.test(l))
    let body = filtered
    if (naLabelIdx !== -1) {
      let j = naLabelIdx + 1
      const naLines: string[] = []
      while (j < filtered.length && filtered[j].trim() !== '' && !/^\*\*/.test(filtered[j].trim())) {
        naLines.push(filtered[j])
        j++
      }
      needs = naLines.join('\n').trim() || filtered[naLabelIdx].replace(/\*\*/g, '').replace(/.*Needs attention:?/i, '').trim() || null
      body = [...filtered.slice(0, naLabelIdx), ...filtered.slice(j)]
    }
    out.push({
      hhmm,
      headline,
      needs_attention: needs,
      body_md: body.join('\n').trim(),
    })
  }
  return out
}

async function main() {
  const dumpArg = process.argv.find((a) => a.startsWith('--dump='))
  if (dumpArg) {
    const day = dumpArg.split('=')[1]
    const parsed = parseCaptures(readFileSync(join(DAILY, day, '02-captures.md'), 'utf8'))
    for (const c of parsed) {
      const block = `${c.headline}\n${c.body_md}\n${c.needs_attention ?? ''}`
      console.log('────────────────────────────────────────')
      console.log(`HHMM: ${c.hhmm}  -> captured_at ${localToUtc(day, c.hhmm)}`)
      console.log(`HEADLINE: ${c.headline}`)
      console.log(`PEOPLE: ${JSON.stringify(matchPeople(block))}`)
      console.log(`INITIATIVES: ${JSON.stringify(matchInitiatives(block))}`)
      console.log(`NEEDS_ATTENTION:\n${c.needs_attention ?? '(none)'}`)
      console.log(`BODY (first 240):\n${c.body_md.slice(0, 240)}`)
    }
    return
  }

  const sb = getSupabase()
  const summary: string[] = []

  // ---- Step 1: durable context docs ----
  for (const [file, key] of [
    ['routing.md', 'command_center_routing'],
    ['people.md', 'command_center_people'],
  ] as const) {
    const path = join(ROOT, 'context', file)
    if (!existsSync(path)) {
      summary.push(`context/${file}: MISSING — skipped`)
      continue
    }
    const text = readFileSync(path, 'utf8')
    if (APPLY) {
      const { error } = await sb
        .from('context_store' as any)
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) throw error
    }
    summary.push(`context_store[${key}] <- context/${file} (${text.length} chars)`)
  }

  // ---- Steps 2 & 3: days + captures ----
  const dates = readdirSync(DAILY).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  for (const day of dates) {
    const dir = join(DAILY, day)
    const focus = join(dir, '01-focus.md')
    const summaryF = join(dir, '03-summary.md')
    const reconcile = join(dir, 'reconciled.md') // note: files are named reconciled.md, not 04-reconcile.md

    const row: Record<string, unknown> = { day }
    if (existsSync(focus)) {
      row.focus_md = readFileSync(focus, 'utf8')
      row.focus_generated_at = mtimeIso(focus, `${day}T07:00:00Z`)
    }
    if (existsSync(summaryF)) {
      row.summary_md = readFileSync(summaryF, 'utf8')
      row.summary_written_at = mtimeIso(summaryF, `${day}T17:00:00Z`)
    }
    if (existsSync(reconcile)) {
      row.reconcile_md = readFileSync(reconcile, 'utf8')
      row.reconciled_at = mtimeIso(reconcile, `${day}T17:00:00Z`)
    }
    row.status = existsSync(reconcile) ? 'closed' : 'open'

    if (APPLY) {
      const { error } = await sb.from('command_center_days' as any).upsert(row, { onConflict: 'day' })
      if (error) throw error
    }
    summary.push(
      `day ${day}: status=${row.status} focus=${!!row.focus_md} summary=${!!row.summary_md} reconcile=${!!row.reconcile_md}`
    )

    // captures
    const capFile = join(dir, '02-captures.md')
    if (!existsSync(capFile)) {
      summary.push(`  captures ${day}: no 02-captures.md`)
      continue
    }
    // guard: skip if rows already exist for this day
    const { data: existing, error: exErr } = await sb
      .from('command_center_captures' as any)
      .select('id')
      .eq('day', day)
      .limit(1)
    if (exErr) throw exErr
    if (existing && existing.length > 0) {
      summary.push(`  captures ${day}: SKIPPED — rows already exist`)
      continue
    }
    const parsed = parseCaptures(readFileSync(capFile, 'utf8'))
    let inserted = 0
    for (const c of parsed) {
      const block = `${c.headline}\n${c.body_md}\n${c.needs_attention ?? ''}`
      const insertRow = {
        day,
        captured_at: localToUtc(day, c.hhmm),
        window_start: null,
        window_end: null,
        headline: c.headline,
        needs_attention: c.needs_attention,
        body_md: c.body_md,
        people: matchPeople(block),
        initiatives: matchInitiatives(block),
        tags: [],
        source: 'migrated-local',
      }
      if (APPLY) {
        const { error } = await sb.from('command_center_captures' as any).insert(insertRow)
        if (error) throw error
      }
      inserted++
    }
    summary.push(`  captures ${day}: ${inserted} block(s) ${APPLY ? 'inserted' : 'parsed (dry-run)'}`)
  }

  console.log(`\n=== Command Center migration ${APPLY ? '(APPLIED)' : '(DRY RUN — pass --apply to write)'} ===\n`)
  console.log(summary.join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
