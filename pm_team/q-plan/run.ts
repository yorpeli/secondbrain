#!/usr/bin/env tsx
/**
 * Q-Plan PM Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx pm_team/q-plan/run.ts ingest --quarter=Q1-2026 --initiative=vendor-optimization --hl=<path> [--exec=<path>,<path>]
 *   npx tsx pm_team/q-plan/run.ts status [--quarter=Q1-2026]
 *   npx tsx pm_team/q-plan/run.ts update --deliverable=<id> --status=done [--notes="..."]
 *   npx tsx pm_team/q-plan/run.ts analyze [--quarter=Q1-2026]
 *   npx tsx pm_team/q-plan/run.ts review --quarter=Q1-2026
 *   npx tsx pm_team/q-plan/run.ts check-tasks
 */

import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = args.find(a => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

async function main() {
  if (!command) {
    console.log(`
Q-Plan PM Agent — CLI

Commands:
  ingest --quarter=Q1-2026 --initiative=<slug> --hl=<path> [--exec=<path>,<path>]
      Parse quarterly plan decks and propose inserts (requires approval before writing)

  status [--quarter=Q1-2026]
      Current quarter progress: rollup by initiative, flags, overdue items

  update --deliverable=<id> --status=<status> [--notes="..."]
      Update a deliverable's status

  analyze [--quarter=Q1-2026]
      Gap analysis: planned vs actual, slippage patterns, impact tracking

  review --quarter=Q1-2026
      Quarter-end review: shipped, cut, rolled forward, lessons

  check-tasks
      Pick up pending tasks from agent_tasks table

Examples:
  npx tsx pm_team/q-plan/run.ts ingest --quarter=Q1-2026 --initiative=vendor-optimization --hl=/path/to/HL.pptx --exec=/path/to/exec1.pptx,/path/to/exec2.pptx
  npx tsx pm_team/q-plan/run.ts status
  npx tsx pm_team/q-plan/run.ts analyze --quarter=Q1-2026
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'ingest': {
        const quarter = getFlag('quarter')
        const initiative = getFlag('initiative')
        const hlFile = getFlag('hl')
        const execFiles = getFlag('exec')?.split(',').map(f => f.trim())

        if (!quarter || !initiative || !hlFile) {
          console.error('Error: --quarter, --initiative, and --hl are required.')
          console.error('Usage: ingest --quarter=Q1-2026 --initiative=<slug> --hl=<path> [--exec=<path>,<path>]')
          process.exit(1)
        }

        const { run } = await import('./commands/ingest.js')
        const result = await run({ quarter, initiative, hlFile, executionFiles: execFiles })
        console.log('\n' + result.summary)

        if (result.requiresApproval) {
          console.log('\n⏳ Review the proposal above. To commit, run:')
          console.log(`  npx tsx pm_team/q-plan/run.ts commit-ingest --quarter=${quarter} --initiative=${initiative}`)
        }
        break
      }

      case 'commit-ingest': {
        const quarter = getFlag('quarter')
        const initiative = getFlag('initiative')
        if (!quarter || !initiative) {
          console.error('Error: --quarter and --initiative are required.')
          process.exit(1)
        }
        const { commitIngest } = await import('./commands/ingest.js')
        const result = await commitIngest({ quarter, initiative })
        console.log('\n' + result.summary)
        break
      }

      case 'status': {
        const quarter = getFlag('quarter')
        const { run } = await import('./commands/status.js')
        const result = await run({ quarter })
        console.log('\n' + result.summary)
        break
      }

      case 'update': {
        const deliverableId = getFlag('deliverable')
        const planItemId = getFlag('plan-item')
        const status = getFlag('status')
        const notes = getFlag('notes')

        if (!status || (!deliverableId && !planItemId)) {
          console.error('Error: --status and either --deliverable or --plan-item are required.')
          process.exit(1)
        }

        const { run } = await import('./commands/update.js')
        const result = await run({ deliverableId, planItemId, status, notes })
        console.log('\n' + result.summary)
        break
      }

      case 'analyze': {
        const quarter = getFlag('quarter')
        const { run } = await import('./commands/analyze.js')
        const result = await run({ quarter })
        console.log('\n' + result.summary)
        break
      }

      case 'review': {
        const quarter = getFlag('quarter')
        if (!quarter) {
          console.error('Error: --quarter is required.')
          process.exit(1)
        }
        const { run } = await import('./commands/review.js')
        const result = await run({ quarter })
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
    process.exit(0)
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
