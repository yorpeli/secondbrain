// CLI for the comms-assistant. DB + retrieval primitives; MSFT reads happen in the agent
// session via MCP, not here (see agents/comms-assistant.md for the Pass A / Pass B procedures).
//   classify --payload=<json>               batch classifyEmail(EmailMeta[]) → survivors + drop breakdown
//   context:assemble --file=<ThreadInput>   emit the machine-readable ContextBundle for the prediction sub-agent
//   context:probe --file=<ThreadInput>      human view of the bundle (as-of-honest + live-sim)
//   predictions:add --payload=<json>        insert a blind prediction
//   predictions:list [--unreconciled]       list rows (optionally needing reconcile)
//   predictions:reconcile --payload=<json>  { id, actual_reply, delta, resolution, why? }
//   rules:list                              list rules, highest confidence first
//   rules:add --payload=<json>              insert a rule
//   rules:supersede --payload=<json>        { oldId, rule }
//   rules:pin --id=<uuid>
import { readFileSync } from 'node:fs'
import {
  insertPrediction, listPredictions, reconcilePrediction,
  listRules, insertRule, supersedeRule, pinRule,
} from './store.js'
import { assembleContext, type ThreadInput, type ContextBundle } from './retrieve.js'
import { classifyEmail, type EmailMeta } from './classify.js'

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

async function main() {
  const cmd = process.argv[2]
  switch (cmd) {
    case 'predictions:add': {
      const id = await insertPrediction(payload())
      console.log(JSON.stringify({ inserted: id }))
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
    case 'classify': {
      // Pass-A step 1. --payload=<json array of EmailMeta>. Returns survivors (needsPrediction)
      // + a drop breakdown so the agent never silently truncates the sweep.
      const items = payload() as EmailMeta[]
      const scored = items.map((m) => ({ meta: m, c: classifyEmail(m) }))
      const kept = scored.filter((s) => s.c.needsPrediction)
      const dropped: Record<string, number> = {}
      for (const s of scored) if (!s.c.needsPrediction) dropped[s.c.reason] = (dropped[s.c.reason] ?? 0) + 1
      console.log(JSON.stringify({
        total: items.length, kept: kept.length, droppedTotal: items.length - kept.length, dropped,
        keep: kept.map((s) => ({ subject: s.meta.subject, sender: s.meta.sender, reason: s.c.reason })),
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
    default:
      console.error('unknown command: ' + cmd)
      process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
