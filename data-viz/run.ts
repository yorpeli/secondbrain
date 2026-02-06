#!/usr/bin/env tsx
/**
 * Data-Viz Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx data-viz/run.ts demo <template> [--output=<path>]
 *   npx tsx data-viz/run.ts render <template> --data=<json-file>
 *   npx tsx data-viz/run.ts list-templates
 *   npx tsx data-viz/run.ts check-tasks
 */

import 'dotenv/config'
import { readFile } from 'fs/promises'
import { renderChart } from './lib/renderer.js'
import { templates, listTemplates } from './templates/index.js'
import type { ChartSpec } from './lib/types.js'

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
Data-Viz Agent — CLI

Commands:
  demo <template> [--output=<path>]     Render demo chart with sample data
  render <template> --data=<json>       Render from JSON spec file
  list-templates                        Show available templates
  check-tasks                           Pick up pending tasks from agent_tasks table

Templates:
${listTemplates().map(t => `  ${t.name.padEnd(24)} ${t.description}`).join('\n')}

Examples:
  npx tsx data-viz/run.ts demo volume-trend --output=output/demo-trend.png
  npx tsx data-viz/run.ts demo approval-comparison
  npx tsx data-viz/run.ts render volume-trend --data=spec.json
  npx tsx data-viz/run.ts list-templates
  npx tsx data-viz/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'demo': {
        const templateName = getPositional(1)
        if (!templateName) {
          console.error('Usage: demo <template> [--output=<path>]')
          process.exit(1)
        }
        const template = templates[templateName]
        if (!template) {
          console.error(`Unknown template: ${templateName}`)
          console.error(`Available: ${Object.keys(templates).join(', ')}`)
          process.exit(1)
        }

        const spec = template.sampleData()
        const output = getFlag('output')
        if (output) {
          spec.output = { saveTo: output }
        }

        console.log(`Rendering demo: ${templateName}`)
        const result = await renderChart(spec)

        if (!output) {
          console.log(`  Rendered ${result.width}x${result.height} PNG (${result.buffer.length} bytes)`)
          console.log('  Use --output=<path> to save to file')
        }
        break
      }

      case 'render': {
        const templateName = getPositional(1)
        const dataPath = getFlag('data')
        if (!templateName || !dataPath) {
          console.error('Usage: render <template> --data=<json-file>')
          process.exit(1)
        }
        if (!templates[templateName]) {
          console.error(`Unknown template: ${templateName}`)
          process.exit(1)
        }

        const raw = await readFile(dataPath, 'utf-8')
        const spec: ChartSpec = { ...JSON.parse(raw), template: templateName }
        const output = getFlag('output')
        if (output) {
          spec.output = { saveTo: output }
        }

        console.log(`Rendering: ${templateName}`)
        const result = await renderChart(spec)

        if (!output) {
          console.log(`  Rendered ${result.width}x${result.height} PNG (${result.buffer.length} bytes)`)
          console.log('  Use --output=<path> to save to file')
        }
        break
      }

      case 'list-templates':
      case 'list': {
        console.log('\nAvailable chart templates:\n')
        for (const t of listTemplates()) {
          console.log(`  ${t.name.padEnd(24)} ${t.description}`)
        }
        console.log()
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
        process.exit(1)
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
