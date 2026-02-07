#!/usr/bin/env tsx
/**
 * Hub Countries PM Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx pm_team/hub-countries/run.ts check-in [--days=7]
 *   npx tsx pm_team/hub-countries/run.ts investigate <country> [--topic=<topic>]
 *   npx tsx pm_team/hub-countries/run.ts check-tasks
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
  // Return args at index, skipping flags (--foo=bar)
  const positionals = args.filter(a => !a.startsWith('--'))
  return positionals[index]
}

async function main() {
  if (!command) {
    console.log(`
Hub Countries PM Agent — CLI

Commands:
  check-in [--days=7]                          Weekly routine: PPP + analytics + flags
  investigate <country> [--topic=<topic>]       Deep-dive into a specific hub country
  check-tasks                                  Pick up pending tasks from agent_tasks table

Countries: UK, US, SG, UAE

Examples:
  npx tsx pm_team/hub-countries/run.ts check-in
  npx tsx pm_team/hub-countries/run.ts investigate UK
  npx tsx pm_team/hub-countries/run.ts investigate US --topic="approval rate drop"
  npx tsx pm_team/hub-countries/run.ts investigate UAE --topic="licensing"
  npx tsx pm_team/hub-countries/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'check-in': {
        const days = getFlag('days') ? parseInt(getFlag('days')!, 10) : undefined
        const { run } = await import('./commands/check-in.js')
        const result = await run({ days })
        console.log('\n' + result.summary)
        break
      }

      case 'investigate': {
        const country = getPositional(1)
        if (!country) {
          console.error('Error: country is required. Usage: investigate <country> [--topic=<topic>]')
          console.error('Valid countries: UK, US, SG, UAE')
          process.exit(1)
        }
        const topic = getFlag('topic')
        const { run } = await import('./commands/investigate.js')
        const result = await run({ country, topic })
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
