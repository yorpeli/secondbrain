#!/usr/bin/env tsx
/**
 * KYC Product PM Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx pm_team/kyc-product/run.ts research <topic>
 *   npx tsx pm_team/kyc-product/run.ts research status
 *   npx tsx pm_team/kyc-product/run.ts audit
 *   npx tsx pm_team/kyc-product/run.ts synthesize [--phase=<N>]
 *   npx tsx pm_team/kyc-product/run.ts check-tasks
 */

import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = args.find(a => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

function getPositional(index: number): string | undefined {
  const positionals = args.filter(a => !a.startsWith('--'))
  return positionals[index]
}

async function main() {
  if (!command) {
    console.log(`
KYC Product PM Agent — CLI

Commands:
  research <topic>               Orchestrate research on a specific topic
  research status                Show progress across all research workstreams
  audit                          Internal capability audit (what does Payoneer's KYC do today?)
  synthesize [--phase=<N>]       Pull together findings into a synthesis report
  check-tasks                    Pick up pending tasks from agent_tasks table

Phase 1 Topics: market-sizing, competitive-landscape, customer-segments, existing-customers
Phase 2 Topics: capabilities, manual-ops, performance, cost-structure

Examples:
  npx tsx pm_team/kyc-product/run.ts research market-sizing
  npx tsx pm_team/kyc-product/run.ts research competitive-landscape
  npx tsx pm_team/kyc-product/run.ts research status
  npx tsx pm_team/kyc-product/run.ts audit
  npx tsx pm_team/kyc-product/run.ts synthesize
  npx tsx pm_team/kyc-product/run.ts synthesize --phase=1
  npx tsx pm_team/kyc-product/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'research': {
        const topic = getPositional(1)
        if (!topic) {
          console.error('Error: topic is required. Usage: research <topic>')
          console.error('Valid topics: market-sizing, competitive-landscape, customer-segments, existing-customers')
          console.error('             capabilities, manual-ops, performance, cost-structure')
          console.error('             status (shows all workstreams)')
          process.exit(1)
        }
        const { run } = await import('./commands/research.js')
        const result = await run({ topic })
        console.log('\n' + result.summary)
        break
      }

      case 'audit': {
        const { run } = await import('./commands/audit.js')
        const result = await run()
        console.log('\n' + result.summary)
        break
      }

      case 'synthesize': {
        const phase = getFlag('phase') ? parseInt(getFlag('phase')!, 10) : undefined
        const { run } = await import('./commands/synthesize.js')
        const result = await run({ phase })
        console.log('\n' + result.summary)
        break
      }

      case 'check-tasks': {
        const { checkTasks } = await import('./agent.js')
        const stats = await checkTasks()
        console.log(`\nDone. Processed: ${stats.processed}, Errors: ${stats.errors}`)
        break
      }

      default:
        console.error(`Unknown command: ${command}`)
        console.error('Run without arguments to see usage.')
        process.exit(1)
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
