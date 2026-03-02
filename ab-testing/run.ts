#!/usr/bin/env tsx
/**
 * AB Testing Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx ab-testing/run.ts list [--status=live]
 *   npx tsx ab-testing/run.ts analyze <slug-or-expid>
 *   npx tsx ab-testing/run.ts check-tasks
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
AB Testing Agent — CLI

Commands:
  list [--status=<lifecycle>]              Show experiments table with status/verdicts
  analyze <slug-or-expid>                  Run inline Looker query → compare variants → significance test
  check-tasks                              Pick up pending tasks from agent_tasks table

Lifecycle stages: idea, in-design, in-development, live, for-analysis,
                  completed, rollout-live, rollout-in-dev, cancelled, on-hold

Examples:
  npx tsx ab-testing/run.ts list
  npx tsx ab-testing/run.ts list --status=live
  npx tsx ab-testing/run.ts analyze full-address-experiment
  npx tsx ab-testing/run.ts analyze EXPID-165
  npx tsx ab-testing/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'list': {
        const status = getFlag('status') as any
        const { run } = await import('./commands/list.js')
        const result = await run({ status })
        console.log('\n' + result.summary)
        break
      }

      case 'analyze': {
        const identifier = getPositional(1)

        if (!identifier) {
          console.error('Error: provide a slug or EXPID')
          process.exit(1)
        }

        const options: Record<string, unknown> = {}
        if (/^expid-\d+$/i.test(identifier)) {
          options.expid = identifier.toUpperCase()
        } else {
          options.slug = identifier
        }

        const { run } = await import('./commands/analyze.js')
        const result = await run(options as any)
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
