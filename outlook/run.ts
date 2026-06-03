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
  check                                                   Full sweep: pushes from Outlook + recent lookup results
  request --query=<q> [--person=<name>] [--slug=<person-slug>]
          [--timeframe=<window>] [--initiative=<slug>]   Queue a thread-lookup
  calendar [--query=<q>] [--person=<name>] [--timeframe=<window>]   Queue a calendar-lookup
  meeting-prep <meeting> [--date=<date>]                  Queue meeting prep (event + related threads)
  digest <person> [--timeframe=<window>] [--focus=<focus>]   Queue a person email digest
  results [--limit=10]                                    List recent completed results
  result <task-id>                                        Show one result in full
  inbox                                                   List pending inbound captures pushed from Outlook
  sync-spec                                               Push agents/outlook-agent.md spec → context_store

Examples:
  npx tsx outlook/run.ts check
  npx tsx outlook/run.ts request --query="payer rollout status" --person="Chen Alcalay" --slug=chen-alcalay --timeframe="last 60 days"
  npx tsx outlook/run.ts calendar --timeframe="next 7 days" --person="Chen Alcalay"
  npx tsx outlook/run.ts meeting-prep "CLM weekly" --date=2026-06-05
  npx tsx outlook/run.ts digest "Elad Schnarch" --focus=unanswered
  npx tsx outlook/run.ts results --limit=5
  npx tsx outlook/run.ts result 257334f2-8f1f-4023-a947-1d8e603360ad
  npx tsx outlook/run.ts inbox
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

      case 'calendar': {
        const { requestCalendarLookup } = await import('../lib/outlook.js')
        const id = await requestCalendarLookup({
          query: getFlag('query'),
          person: getFlag('person'),
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued calendar-lookup task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }

      case 'meeting-prep': {
        const meeting = getFlag('meeting') ?? getPositional(1)
        if (!meeting) {
          console.error('Error: a meeting subject/keywords is required. Usage: meeting-prep <meeting> [--date=<date>]')
          process.exit(1)
        }
        const { requestMeetingPrep } = await import('../lib/outlook.js')
        const id = await requestMeetingPrep({ meeting, date: getFlag('date') })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued meeting-prep task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }

      case 'digest': {
        const person = getFlag('person') ?? getPositional(1)
        if (!person) {
          console.error('Error: a person is required. Usage: digest <person> [--timeframe=<window>] [--focus=<focus>]')
          process.exit(1)
        }
        const { requestPersonDigest } = await import('../lib/outlook.js')
        const id = await requestPersonDigest({
          person,
          personSlug: getFlag('slug'),
          timeframe: getFlag('timeframe'),
          focus: getFlag('focus'),
        })
        if (!id) {
          console.error('Failed to create task.')
          process.exit(1)
        }
        console.log(`Queued person-digest task ${id}. Run the email agent in Outlook, then: npx tsx outlook/run.ts check`)
        break
      }

      case 'results': {
        const limitRaw = getFlag('limit')
        const limit = limitRaw ? (parseInt(limitRaw, 10) || 10) : 10
        const { listOutlookResults, summarizeResultLine } = await import('../lib/outlook.js')
        const rows = await listOutlookResults(limit)
        if (rows.length === 0) {
          console.log('No completed Outlook results yet.')
          break
        }
        for (const r of rows) {
          console.log(`\n${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}`)
          console.log(`  ${r.title}`)
          console.log(`  ${summarizeResultLine(r)}`)
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

      case 'check': {
        const { listInboundCaptures, listOutlookResults, summarizeResultLine } = await import('../lib/outlook.js')
        const [caps, results] = await Promise.all([listInboundCaptures(), listOutlookResults(10)])
        console.log(`Outlook sweep: ${caps.length} pending push(es), ${results.length} recent lookup result(s).`)
        if (caps.length) {
          console.log('\n— Pushed from Outlook (to triage):')
          for (const c of caps) {
            const when = c.captured_at ?? c.created_at?.slice(0, 10) ?? '????-??-??'
            console.log(`  ${when}  ${c.id}  ${c.title}`)
            if (c.note) console.log(`    note: ${c.note}`)
          }
        }
        if (results.length) {
          console.log('\n— Recent lookup results:')
          for (const r of results) {
            console.log(`  ${r.completed_at?.slice(0, 10) ?? '????-??-??'}  ${r.id}  ${r.title} — ${summarizeResultLine(r)}`)
          }
        }
        if (!caps.length && !results.length) console.log('Nothing waiting.')
        break
      }

      case 'inbox': {
        const { listInboundCaptures } = await import('../lib/outlook.js')
        const caps = await listInboundCaptures()
        if (caps.length === 0) {
          console.log('No pending inbound captures.')
          break
        }
        console.log(`${caps.length} pending inbound capture(s):`)
        for (const c of caps) {
          const t = c.threads[0]
          const when = c.captured_at ?? c.created_at?.slice(0, 10) ?? '????-??-??'
          console.log(`\n${when}  ${c.id}`)
          console.log(`  ${c.title}`)
          if (c.note) console.log(`  note: ${c.note}`)
          if (t && 'participants' in t) console.log(`  participants: ${(t.participants ?? []).join(', ')}`)
        }
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
