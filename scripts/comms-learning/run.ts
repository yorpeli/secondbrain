// CLI for the comms-learning backtest. Agent-facing: ingest payloads, list work.
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
    default:
      console.error('unknown command: ' + cmd)
      process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
