import 'dotenv/config'
// CLI for the comms-assistant. DB + retrieval primitives; MSFT reads happen in the agent
// session via MCP, not here (see agents/comms-assistant.md for the Pass A / Pass B procedures).
//   classify --payload=<json>               batch classifyEmail(EmailMeta[]) → survivors + drop breakdown
//   context:assemble --file=<ThreadInput>   emit the machine-readable ContextBundle for the prediction sub-agent
//   context:probe --file=<ThreadInput>      human view of the bundle (as-of-honest + live-sim)
//   predictions:add --payload=<json>        insert a blind prediction
//   predictions:add-many --payload=<items>  persist a whole triage sweep (idempotent per thread)
//   predictions:list [--unreconciled]       list rows (optionally needing reconcile)
//   predictions:reconcile --payload=<json>  { id, actual_reply, delta, resolution, why? }
//   rules:list                              list rules, highest confidence first
//   rules:add --payload=<json>              insert a rule
//   rules:supersede --payload=<json>        { oldId, rule }
//   rules:pin --id=<uuid>
//   rules:distill [--mark=<ids>]            load undistilled feedback (or stamp processed ids)
import { readFileSync } from 'node:fs'
import {
  insertPrediction, upsertPredictions, listPredictions, reconcilePrediction,
  listRules, insertRule, supersedeRule, pinRule,
} from './store.js'
import type { PredictionRow } from './types.js'
import { assembleContext, type ThreadInput, type ContextBundle } from './retrieve.js'
import { classifyEmail, type EmailMeta } from './classify.js'
import { buildCardPayload } from './card.js'
import { loadUndistilledFeedback, markDistilled } from './distill.js'
import { pullClaudeTagged } from './outlook-bridge/gather.js'
import { getSupabase } from '../lib/supabase.js'

function renderBundle(label: string, b: ContextBundle): string {
  const lines: string[] = [`── ${label} ──`]
  lines.push(`as_of=${b.meta.asOf ?? '(live)'}  coldStart=${b.meta.coldStart}  ctx=${JSON.stringify(b.meta.contextAvailable)}`)
  lines.push(`T1 participants:`)
  for (const p of b.participants) lines.push(`   ${p.inDb ? '●' : '○'} ${p.email} → ${p.inDb ? `${p.name} (${p.role ?? '?'}, ${p.team ?? '?'}) [${p.relation}]` : 'not in DB'}`)
  lines.push(`T2 ownership: ${b.ownership ? `loaded (${b.ownership.redLines.length} red-lines, clmScope present)` : 'MISSING'}`)
  lines.push(`spine rules (${b.rules.length}):`)
  for (const r of b.rules) lines.push(`   [${r.weight}] ${r.confidence.toFixed(2)} ${r.type} — ${r.statement.slice(0, 64)}`)
  lines.push(`T3 narrative (${b.narrative.length}, leakRisk=${b.meta.narrativeLeakRisk}):`)
  for (const s of b.narrative) lines.push(`   ~${s.score.toFixed(2)} ${s.provenance} — ${s.text.slice(0, 70).replace(/\s+/g, ' ')}`)
  return lines.join('\n')
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}
function payload(): any {
  const p = arg('payload')
  if (!p) throw new Error('--payload=<path> required')
  return JSON.parse(readFileSync(p, 'utf8'))
}

// Map a rendered triage card ({email, thread, suggestion, tier, verdict, self_check}) to a
// comms_predictions row. Matching keys for the later Sent-Items reconcile: thread_id
// (conversationId) → internet_message_id → web_link (carry conversationId in capture for best matching).
async function itemToRow(it: any): Promise<PredictionRow> {
  const e = it.email || {}, s = it.suggestion || {}
  const a = s.action || { type: s.disposition ?? null, target: null }
  const chMap: Record<string, string> = { outlook: 'email', teams: 'teams', meeting: 'meeting' }
  const confScore: Record<string, number> = { high: 0.85, med: 0.6, low: 0.35 }
  let bundle: any = { thread: '', rules: [], participants: [], ownership: null, narrative: [], meta: {} }
  try { if (it.thread) bundle = await assembleContext(it.thread) } catch { /* sparse context */ }
  return {
    mode: 'reply',
    thread_id: e.conversation_id ?? e.conversationId ?? null,
    message_id: e.message_id ?? e.id ?? null,
    internet_message_id: e.internet_message_id ?? e.internetMessageId ?? null,
    web_link: e.webLink ?? e.web_link ?? null,
    channel: chMap[e.channel] ?? e.channel ?? 'email',
    as_of: new Date().toISOString(),
    trigger_text: `${e.from ?? '?'} (${e.date ?? '?'}), thread '${e.subject ?? ''}'`,
    disposition: a.type ?? s.disposition ?? null,
    action_type: a.type ?? null,
    action_target: a.target ?? null,
    needs_data: !!s.needs_data,
    predicted_reply: s.text ?? null,
    predicted_stance: a.type ?? null,
    confidence: (s.confidence ?? null) as any,
    confidence_score: confScore[s.confidence] ?? null,
    context_available: { draft_why: s.why ?? null, self_check_passed: it.self_check?.passed ?? null } as any,
    actual_reply: null, delta: null, resolution: null, why: s.why ?? null,
    derived_rule_ids: [],
    sensitive: !!(it.sensitive ?? it.signals?.sensitive),
    tier: it.tier ?? null,
    verdict: it.verdict ?? null,
    card: buildCardPayload(it, bundle),
    status: 'open',
    user_touched: false,
    last_message_id: e.internet_message_id ?? e.internetMessageId ?? null,
    captured_at: new Date().toISOString(),
  }
}

async function main() {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'predictions:add': {
      const id = await insertPrediction(payload())
      console.log(JSON.stringify({ inserted: id }))
      break
    }
    case 'predictions:add-many': {
      // Persist a whole sweep. --payload=<items.json> (the array render-triage was given, each
      // item optionally carrying tier + verdict). Idempotent per thread (upsert on open rows).
      const items = payload() as any[]
      const rows = await Promise.all(items.map(itemToRow))
      const res = await upsertPredictions(rows)
      const byTier = rows.reduce((m: Record<string, number>, r) => { const k = 'T' + (r.tier ?? '?'); m[k] = (m[k] || 0) + 1; return m }, {})
      console.log(JSON.stringify({
        persisted: rows.length, ...res,
        withDraft: rows.filter((r) => r.predicted_reply).length,
        byTier,
        flagged: rows.filter((r) => (r.verdict as any)?.flagged).length,
      }, null, 2))
      break
    }
    case 'predictions:list': {
      const rows = await listPredictions({ unreconciledOnly: flag('unreconciled') })
      console.log(JSON.stringify(rows, null, 2))
      break
    }
    case 'predictions:reconcile': {
      const { id, ...patch } = payload()
      await reconcilePrediction(id, patch)
      console.log(JSON.stringify({ reconciled: id }))
      break
    }
    case 'rules:list': {
      console.log(JSON.stringify(await listRules(), null, 2))
      break
    }
    case 'rules:add': {
      console.log(JSON.stringify({ inserted: await insertRule(payload()) }))
      break
    }
    case 'rules:supersede': {
      const { oldId, rule } = payload()
      console.log(JSON.stringify({ inserted: await supersedeRule(oldId, rule) }))
      break
    }
    case 'rules:pin': {
      const id = arg('id')
      if (!id) throw new Error('--id=<uuid> required')
      await pinRule(id)
      console.log(JSON.stringify({ pinned: id }))
      break
    }
    case 'rules:distill': {
      // Flow 2: emit undistilled in-app feedback for the Claude session to cluster → propose rules.
      // After the session adds rules (rules:add/supersede) it stamps the processed feedback:
      //   rules:distill --mark='<comma-separated feedback ids>'
      const mark = arg('mark')
      if (mark) {
        const n = await markDistilled(mark.split(',').map((s) => s.trim()).filter(Boolean))
        console.log(JSON.stringify({ marked: n }))
        break
      }
      const items = await loadUndistilledFeedback()
      console.log(JSON.stringify({ count: items.length, items }, null, 2))
      break
    }
    case 'classify': {
      // Triage gate. --payload=<json array of EmailMeta>. Keeps anything that needs a response
      // (fresh OR reply) and drops only noise/sensitive, with a breakdown so nothing is silently cut.
      // (Pass --backtest to use the Re:-only needsPrediction gate instead, for the learning loop.)
      const items = payload() as EmailMeta[]
      const backtest = flag('backtest')
      const scored = items.map((m) => ({ meta: m, c: classifyEmail(m) }))
      const survived = (s: { c: ReturnType<typeof classifyEmail> }) => backtest ? s.c.needsPrediction : s.c.needsResponse
      const kept = scored.filter(survived)
      const dropped: Record<string, number> = {}
      for (const s of scored) if (!survived(s)) dropped[s.c.reason] = (dropped[s.c.reason] ?? 0) + 1
      console.log(JSON.stringify({
        gate: backtest ? 'backtest (Re:-only)' : 'triage (fresh + reply)',
        total: items.length, kept: kept.length, droppedTotal: items.length - kept.length, dropped,
        keep: kept.map((s) => ({ subject: s.meta.subject, sender: s.meta.sender, kind: s.c.isReply ? 'reply' : 'fresh', reason: s.c.reason })),
        sensitive: scored.filter((s) => s.c.isSensitive).map((s) => s.meta.subject),
      }, null, 2))
      break
    }
    case 'context:assemble': {
      // Pass-A step 2. --file=<ThreadInput json>. Emits the machine-readable ContextBundle to
      // hand to the prediction sub-agent (see prompts/prediction-subagent.md).
      const thread = JSON.parse(readFileSync(arg('file')!, 'utf8')) as ThreadInput
      console.log(JSON.stringify(await assembleContext(thread), null, 2))
      break
    }
    case 'context:probe': {
      // --file=<ThreadInput json>. Prints the as-of-honest bundle and a live-sim (asOf stripped)
      // so the flywheel is visible: rules distilled today don't exist at backtest as_of, but DO
      // surface in the live view.
      const thread = JSON.parse(readFileSync(arg('file')!, 'utf8')) as ThreadInput
      const honest = await assembleContext(thread)
      const live = await assembleContext({ ...thread, asOf: undefined })
      console.log(renderBundle(`AS-OF HONEST (asOf=${thread.asOf})`, honest))
      console.log('\n' + renderBundle('LIVE-SIM (no asOf — what live mode sees today)', live))
      break
    }
    case 'pull-outlook': {
      const source = arg('source') ?? 'claude'
      if (source !== 'claude') throw new Error("pull-outlook: only --source=claude is supported (Plan A)")
      const windowDays = Number(arg('window') ?? 7)
      const today = arg('today') ?? new Date().toISOString().slice(0, 10)

      const sb = getSupabase() as any
      const isResolved = async (imid: string): Promise<boolean> => {
        if (!imid) return false
        const { data } = await sb
          .from('comms_predictions')
          .select('status,resolution')
          .eq('internet_message_id', imid)
          .limit(1)
        const row = data?.[0]
        if (!row) return false
        return row.resolution != null || row.status === 'dismissed' || row.status === 'sent'
      }

      const res = await pullClaudeTagged({ windowDays, today, isResolved })
      process.stderr.write(`pull-outlook claude: total=${res.total} kept=${res.packets.length} drained=${res.cleared}\n`)
      console.log(JSON.stringify(res.packets, null, 2))
      break
    }
    default:
      console.error('unknown command: ' + cmd)
      process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
