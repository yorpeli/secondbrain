#!/usr/bin/env tsx
/**
 * Outlook Agent — CLI Entry Point (Claude Code side)
 *
 * Usage:
 *   npx tsx outlook/run.ts request --query="payer rollout" [--person="Chen Alcalay"] [--slug=chen-alcalay] [--timeframe="last 60 days"] [--initiative=clm-full-rollout]
 *   npx tsx outlook/run.ts results [--limit=10]
 *   npx tsx outlook/run.ts result <task-id>
 *   npx tsx outlook/run.ts sync-spec
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
Outlook Agent — CLI (Claude Code side)

Commands:
  request --query=<q> [--person=<name>] [--slug=<person-slug>]
          [--timeframe=<window>] [--initiative=<slug>]   Queue a thread-lookup
  results [--limit=10]                                    List recent completed results
  result <task-id>                                        Show one result in full
  sync-spec                                               Push agents/outlook-agent.md spec → context_store

Examples:
  npx tsx outlook/run.ts request --query="payer rollout status" --person="Chen Alcalay" --slug=chen-alcalay --timeframe="last 60 days"
  npx tsx outlook/run.ts results --limit=5
  npx tsx outlook/run.ts result 257334f2-8f1f-4023-a947-1d8e603360ad
  npx tsx outlook/run.ts sync-spec
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'request': {
        const query = getFlag('query')
        if (!query) {
          console.error('Error: --query is required.')
          process.exit(1)
        }
        const { requestThreadLookup } = await import('../lib/outlook.js')
        const id = await requestThreadLookup({
          query,
          person: getFlag('person'),
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
          initiativeSlug: getFlag('initiative'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued thread-lookup task ${id} for outlook-agent.`)
        console.log('Run the email agent in Outlook to process it, then: npx tsx outlook/run.ts results')
        break
      }

      case 'results': {
        const limit = getFlag('limit') ? parseInt(getFlag('limit')!, 10) : 10
        const { listOutlookResults } = await import('../lib/outlook.js')
        const rows = await listOutlookResults(limit)
        if (rows.length === 0) {
          console.log('No completed Outlook results yet.')
          break
        }
        for (const r of rows) {
          const threadCount = r.result_details?.threads?.length ?? 0
          console.log(`\n${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}`)
          console.log(`  ${r.title}`)
          console.log(`  ${threadCount} thread(s). ${r.result_summary ?? ''}`)
        }
        break
      }

      case 'result': {
        const id = getPositional(1)
        if (!id) {
          console.error('Error: task-id is required. Usage: result <task-id>')
          process.exit(1)
        }
        const { getOutlookResult } = await import('../lib/outlook.js')
        const r = await getOutlookResult(id)
        if (!r) {
          console.error('Result not found.')
          process.exit(1)
        }
        console.log(JSON.stringify(r, null, 2))
        break
      }

      case 'sync-spec': {
        const { syncSpec } = await import('./sync-spec.js')
        const version = await syncSpec()
        console.log(`Synced outlook_agent_spec → context_store. version: ${version}`)
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
