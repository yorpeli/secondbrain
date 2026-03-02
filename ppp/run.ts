#!/usr/bin/env tsx
/**
 * PPP Ingest Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx ppp/run.ts context                              Load analysis context
 *   npx tsx ppp/run.ts write <json-path> [--replace]        Validate + write PPP to DB
 *   npx tsx ppp/run.ts enrich [--week=YYYY-MM-DD]           Week-over-week enrichment
 *   npx tsx ppp/run.ts check-tasks                          Pick up pending agent_tasks
 */

import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = args.find(a => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`)
}

function getPositional(index: number): string | undefined {
  const positionals = args.filter(a => !a.startsWith('--'))
  return positionals[index]
}

async function main() {
  if (!command) {
    console.log(`
PPP Ingest Agent — CLI

Commands:
  context                              Load analysis context (previous week, people, tags, focus)
  write <json-path> [--replace]        Validate PPP payload and write to DB
  enrich [--week=YYYY-MM-DD]           Week-over-week diff + pattern detection
  check-tasks                          Pick up pending tasks from agent_tasks table

Examples:
  npx tsx ppp/run.ts context
  npx tsx ppp/run.ts write output/ppp-2026-02-19.json
  npx tsx ppp/run.ts write output/ppp-2026-02-19.json --replace
  npx tsx ppp/run.ts enrich
  npx tsx ppp/run.ts enrich --week=2026-02-19
  npx tsx ppp/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'context': {
        const { run } = await import('./commands/context.js')
        const result = await run()
        console.log(JSON.stringify(result, null, 2))
        break
      }

      case 'write': {
        const path = getPositional(1)
        if (!path) {
          console.error('Error: JSON path is required. Usage: write <json-path> [--replace]')
          process.exit(1)
        }
        const replace = hasFlag('replace')
        const { run } = await import('./commands/write.js')
        const result = await run({ path, replaceExisting: replace })

        if (result.success) {
          console.log(`\nSuccess! Report ${result.report_id}`)
          console.log(`  Sections written: ${result.sections_written}`)
          if (result.backup_path) console.log(`  Backup: ${result.backup_path}`)
        } else {
          console.error('\nWrite failed:')
          for (const err of result.errors) console.error(`  - ${err}`)
          process.exit(1)
        }

        if (result.errors.length > 0 && result.success) {
          console.log('\nWarnings:')
          for (const err of result.errors) console.log(`  - ${err}`)
        }
        break
      }

      case 'enrich': {
        const week = getFlag('week')
        const { run } = await import('./commands/enrich.js')
        const result = await run({ week })
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
