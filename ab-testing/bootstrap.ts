/**
 * AB Testing Agent — Bootstrap Script
 *
 * One-time (or re-runnable) script to populate experiments.json
 * from Asana MCP data.
 *
 * Usage: npx tsx ab-testing/bootstrap.ts --asana-file=<path>
 *
 * This script parses Asana task data into experiment records. Looker
 * query config (looker_filter) is set manually per experiment — see
 * experiments.json for the schema.
 */

import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { filterCLMTasks, parseExperimentFromTask, type AsanaTask } from './lib/asana.js'
import { saveRegistry } from './lib/experiment-store.js'
import type { Experiment, ExperimentRegistry } from './lib/types.js'

const args = process.argv.slice(2)
const asanaFilePath = args.find(a => a.startsWith('--asana-file='))?.split('=')[1]

async function main() {
  console.log('AB Testing Bootstrap')
  console.log('====================\n')

  if (!asanaFilePath) {
    console.log('No --asana-file provided.')
    console.log('To bootstrap, first fetch Asana tasks via MCP and save to JSON:')
    console.log('')
    console.log('  1. Use Asana MCP: search_projects or get_tasks_for_project with project ID 1209189164647481')
    console.log('  2. Save the JSON response to a file (e.g., /tmp/asana-ab-tests.json)')
    console.log('  3. Re-run: npx tsx ab-testing/bootstrap.ts --asana-file=/tmp/asana-ab-tests.json')
    console.log('')
    console.log('After bootstrap, set looker_filter on each experiment in experiments.json.')
    process.exit(0)
  }

  console.log(`Reading Asana data from: ${asanaFilePath}\n`)
  const raw = await readFile(asanaFilePath, 'utf-8')
  const asanaTasks = JSON.parse(raw) as AsanaTask[]

  console.log(`  Total tasks from Asana: ${asanaTasks.length}`)

  const clmTasks = filterCLMTasks(asanaTasks)
  console.log(`  CLM tasks after filter: ${clmTasks.length}`)

  const experiments: Experiment[] = []
  for (const task of clmTasks) {
    const exp = parseExperimentFromTask(task)
    if (exp) experiments.push(exp)
  }
  console.log(`  Parsed experiments: ${experiments.length}\n`)

  // Save registry
  const registry: ExperimentRegistry = {
    version: 1,
    updated_at: new Date().toISOString(),
    experiments,
  }

  await saveRegistry(registry)
  console.log(`Saved ${experiments.length} experiments to experiments.json`)
  console.log('Note: Set looker_filter on each experiment manually for analysis.')

  // Summary by lifecycle
  const byLifecycle: Record<string, number> = {}
  for (const exp of experiments) {
    byLifecycle[exp.lifecycle] = (byLifecycle[exp.lifecycle] ?? 0) + 1
  }
  console.log('\nBy lifecycle:')
  for (const [stage, count] of Object.entries(byLifecycle).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${stage}: ${count}`)
  }
}

main().catch(err => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
