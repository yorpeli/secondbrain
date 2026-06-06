#!/usr/bin/env tsx
/**
 * AI PM Agent — CLI Entry Point
 *
 * Portfolio PM for every AI initiative + a continuous-learning function.
 *
 * Usage:
 *   npx tsx pm_team/ai-pm/run.ts portfolio [--days=7]            Inward loop: AI portfolio dashboard
 *   npx tsx pm_team/ai-pm/run.ts brief <initiative-slug>         Apply learnings to one initiative
 *   npx tsx pm_team/ai-pm/run.ts scan --plan                     Outward loop: build research agenda (read-only)
 *   npx tsx pm_team/ai-pm/run.ts scan --store --payload=<path>   Persist Claude-authored findings
 *   npx tsx pm_team/ai-pm/run.ts check-tasks                     Pick up pending agent_tasks
 */

import 'dotenv/config'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const args = process.argv.slice(2)
const command = args[0]

const getFlag = (name: string): string | undefined => {
  const arg = args.find(a => a.startsWith(`--${name}=`))
  return arg ? arg.slice(name.length + 3) : undefined
}
const hasFlag = (name: string): boolean => args.includes(`--${name}`)
const getPositional = (i: number): string | undefined => args.filter(a => !a.startsWith('--'))[i]

async function main() {
  if (!command || command === 'help') {
    console.log(`
AI PM Agent — CLI

Commands:
  portfolio [--days=7]                    AI portfolio dashboard (status, memory, PPP, flags)
  brief <initiative-slug>                 Apply stored research + learnings to one initiative
  scan --plan                             Build the research agenda (demand + sweep), read-only
  scan --store --payload=<path>           Persist Claude-authored research findings
  check-tasks                             Pick up pending tasks from agent_tasks

Portfolio: claude-kyc-agent, air-squared, ai-native-team-structure, ai-academy-product, ai-powered-pm-team

Examples:
  npx tsx pm_team/ai-pm/run.ts portfolio
  npx tsx pm_team/ai-pm/run.ts brief claude-kyc-agent
  npx tsx pm_team/ai-pm/run.ts scan --plan
  npx tsx pm_team/ai-pm/run.ts scan --store --payload=/tmp/ai-research.json
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'portfolio': {
        const days = getFlag('days') ? parseInt(getFlag('days')!, 10) : undefined
        const { run } = await import('./commands/portfolio.js')
        const result = await run({ days })
        console.log('\n' + result.summary)
        break
      }

      case 'brief': {
        const slug = getPositional(1)
        if (!slug) { console.error('Error: initiative slug required. Usage: brief <initiative-slug>'); process.exit(1) }
        const { run } = await import('./commands/brief.js')
        const result = await run({ slug })
        console.log('\n' + result.summary)
        break
      }

      case 'scan': {
        const { plan, store } = await import('./commands/scan.js')
        if (hasFlag('plan')) {
          console.log(JSON.stringify(await plan(), null, 2))
        } else if (hasFlag('store')) {
          const path = getFlag('payload')
          if (!path) { console.error('Error: --payload=<path> required with --store'); process.exit(1) }
          const payload = JSON.parse(await readFile(resolve(path), 'utf-8'))
          const result = await store(payload)
          console.log(`\nScan store — ${result.stored} stored, ${result.errored} error(s)`)
          for (const r of result.results) console.log(`  ${r.outcome === 'stored' ? '✓' : '✗'} ${r.topic}: ${r.detail}`)
          if (result.errored > 0) process.exit(1)
        } else {
          console.error('Error: pass --plan or --store. See `run.ts help`.'); process.exit(1)
        }
        break
      }

      case 'check-tasks': {
        const { checkTasks } = await import('./agent.js')
        const stats = await checkTasks()
        console.log(`\nDone. Processed: ${stats.processed}, Errors: ${stats.errors}`)
        break
      }

      default:
        console.error(`Unknown command: ${command}. Run without arguments to see usage.`)
        process.exit(1)
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
