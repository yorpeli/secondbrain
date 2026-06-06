#!/usr/bin/env tsx
/**
 * Initiative Tracker Agent — CLI Entry Point
 *
 * The mechanical applier behind the "refresh initiative memories from PPP"
 * step of PPP ingestion. Claude authors the per-initiative prose; this CLI
 * matches workstreams → initiatives, owns the doc edits, and verifies writes.
 *
 * Usage:
 *   npx tsx scripts/initiative-tracker/run.ts refresh-from-ppp --plan [--week=YYYY-MM-DD]
 *       → prints a JSON scaffold (one entry per initiative the week touches),
 *         including a `suggested` default. Claude curates this into a payload.
 *
 *   npx tsx scripts/initiative-tracker/run.ts refresh-from-ppp --apply --payload=<path>
 *       → applies the (Claude-authored) payload to each memory doc, idempotently.
 *
 * Procedure: this runs as the LAST step of a PPP ingestion (after `ppp write`
 * + `ppp enrich`). See CLAUDE.md → PPP Conventions and agents/initiative-tracker.md.
 */

import 'dotenv/config'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

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

async function main() {
  if (!command || command === 'help' || command === '--help') {
    console.log(`
Initiative Tracker — CLI

Commands:
  refresh-from-ppp --plan [--week=YYYY-MM-DD]   Print JSON scaffold for a PPP week (read-only)
  refresh-from-ppp --apply --payload=<path>     Apply a Claude-authored refresh payload

Examples:
  npx tsx scripts/initiative-tracker/run.ts refresh-from-ppp --plan --week=2026-06-04
  npx tsx scripts/initiative-tracker/run.ts refresh-from-ppp --apply --payload=/tmp/refresh-2026-06-04.json
`)
    process.exit(0)
  }

  if (command !== 'refresh-from-ppp') {
    console.error(`Unknown command: ${command}. Run with no args for usage.`)
    process.exit(1)
  }

  try {
    if (hasFlag('plan')) {
      const { plan } = await import('./refresh.js')
      const result = await plan(getFlag('week'))
      console.log(JSON.stringify(result, null, 2))
      return
    }

    if (hasFlag('apply')) {
      const path = getFlag('payload')
      if (!path) {
        console.error('Error: --payload=<path> is required with --apply')
        process.exit(1)
      }
      const raw = await readFile(resolve(path), 'utf-8')
      const payload = JSON.parse(raw)
      const { apply } = await import('./refresh.js')
      const result = await apply(payload)

      // Human-readable summary (the "print summary" of the auto step).
      console.log(`\nInitiative memory refresh — week ${result.week_date}`)
      console.log(`  Updated: ${result.updated}  Skipped: ${result.skipped}  Errors: ${result.errored}`)
      for (const r of result.results) {
        const icon = r.outcome === 'updated' ? '✓' : r.outcome === 'skipped' ? '–' : '✗'
        console.log(`  ${icon} ${r.initiative_slug}: ${r.detail}`)
      }
      if (result.errored > 0) process.exit(1)
      return
    }

    console.error('Error: pass --plan or --apply. Run with no args for usage.')
    process.exit(1)
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
