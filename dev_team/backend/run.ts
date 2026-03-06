#!/usr/bin/env tsx
/**
 * Dev Backend Engineer Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx dev_team/backend/run.ts build <hook> [--spec="..."]
 *   npx tsx dev_team/backend/run.ts refactor <target> [--reason="..."]
 *   npx tsx dev_team/backend/run.ts check-tasks
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
Dev Backend Engineer Agent — CLI

Commands:
  build <hook> [--spec="..."]          Implement hooks, queries, data transforms
  refactor <target> [--reason="..."]   Optimize queries, restructure data layer
  check-tasks                          Pick up pending tasks from agent_tasks table

Examples:
  npx tsx dev_team/backend/run.ts build useInitiatives --spec="Hook for v_initiative_dashboard"
  npx tsx dev_team/backend/run.ts refactor useInitiatives --reason="Add filtering support"
  npx tsx dev_team/backend/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'build': {
        const hook = getPositional(1)
        if (!hook) {
          console.error('Error: hook name is required.')
          process.exit(1)
        }
        const spec = getFlag('spec') || ''
        const { run } = await import('./commands/build.js')
        const result = await run({ hook, spec })
        console.log('\n' + result.summary)
        break
      }

      case 'refactor': {
        const target = getPositional(1)
        if (!target) {
          console.error('Error: refactor target is required.')
          process.exit(1)
        }
        const reason = getFlag('reason')
        const { run } = await import('./commands/refactor.js')
        const result = await run({ target, reason })
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
