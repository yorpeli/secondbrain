#!/usr/bin/env tsx
/**
 * Dev Team Lead Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx dev_team/team-lead/run.ts plan "<feature description>"
 *   npx tsx dev_team/team-lead/run.ts delegate --plan=<ref>
 *   npx tsx dev_team/team-lead/run.ts review [--scope=<agent>]
 *   npx tsx dev_team/team-lead/run.ts status
 *   npx tsx dev_team/team-lead/run.ts check-tasks
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
Dev Team Lead Agent — CLI

Commands:
  plan "<feature>"                  Produce an implementation plan for a feature
  delegate --plan=<ref>             Break an approved plan into tasks for engineers
  review [--scope=<agent>]          Review completed work against conventions
  status                            Team health and progress dashboard
  check-tasks                       Pick up pending tasks from agent_tasks table

Examples:
  npx tsx dev_team/team-lead/run.ts plan "initiatives dashboard"
  npx tsx dev_team/team-lead/run.ts delegate --plan=initiatives-v1
  npx tsx dev_team/team-lead/run.ts review
  npx tsx dev_team/team-lead/run.ts review --scope=dev-frontend
  npx tsx dev_team/team-lead/run.ts status
  npx tsx dev_team/team-lead/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'plan': {
        const feature = getPositional(1)
        if (!feature) {
          console.error('Error: feature description is required.')
          console.error('Usage: plan "<feature description>"')
          process.exit(1)
        }
        const { run } = await import('./commands/plan.js')
        const result = await run({ feature })
        console.log('\n' + result.summary)
        console.log('\n--- Plan Document ---\n')
        console.log(formatPlan(result.plan))
        break
      }

      case 'delegate': {
        const planRef = getFlag('plan')
        if (!planRef) {
          console.error('Error: --plan=<ref> is required.')
          console.error('Usage: delegate --plan=<ref>')
          process.exit(1)
        }
        const { run } = await import('./commands/delegate.js')
        const result = await run({ planRef })
        console.log('\n' + result.summary)
        break
      }

      case 'review': {
        const scope = getFlag('scope')
        const { run } = await import('./commands/review.js')
        const result = await run({ scope })
        console.log('\n' + result.summary)
        if (result.issues.length > 0) {
          console.log('\nIssues:')
          for (const issue of result.issues) {
            console.log(`  [${issue.severity.toUpperCase()}] ${issue.file}`)
            console.log(`    ${issue.issue}`)
            console.log(`    Suggestion: ${issue.suggestion}`)
          }
        }
        break
      }

      case 'status': {
        const { run } = await import('./commands/status.js')
        const result = await run()
        console.log('\n' + result.summary)
        if (result.agents.length > 0) {
          console.log('\nAgent Status:')
          for (const agent of result.agents) {
            console.log(`  ${agent.slug}: ${agent.pendingTasks} pending, ${agent.completedTasks} done, ${agent.failedTasks} failed`)
          }
        }
        if (result.activePlans.length > 0) {
          console.log('\nActive Plans:')
          for (const plan of result.activePlans) {
            console.log(`  ${plan.ref}: ${plan.feature} [${plan.status}] (${plan.tasksDone}/${plan.tasksTotal} tasks)`)
          }
        }
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

function formatPlan(plan: import('./lib/types.js').FeaturePlan): string {
  const lines: string[] = []
  lines.push(`# Plan: ${plan.feature} (${plan.ref})`)
  lines.push(`\n## Overview\n${plan.overview}`)

  if (plan.routes.length > 0) {
    lines.push('\n## Routes')
    for (const r of plan.routes) {
      lines.push(`- \`${r.path}\` -> ${r.page}: ${r.description}`)
    }
  }

  if (plan.components.length > 0) {
    lines.push('\n## Components')
    for (const c of plan.components) {
      lines.push(`\n### ${c.name}`)
      lines.push(c.description)
      if (c.props.length > 0) lines.push(`Props: ${c.props.join(', ')}`)
      if (c.dataNeeds.length > 0) lines.push(`Data: ${c.dataNeeds.join(', ')}`)
      if (c.designNotes) lines.push(`Design: ${c.designNotes}`)
    }
  }

  if (plan.dataLayer.length > 0) {
    lines.push('\n## Data Layer')
    for (const d of plan.dataLayer) {
      lines.push(`- \`${d.hook}\` (${d.view}): ${d.description}`)
    }
  }

  if (plan.designNotes) {
    lines.push(`\n## Design Notes\n${plan.designNotes}`)
  }

  if (plan.buildSequence.length > 0) {
    lines.push('\n## Build Sequence')
    for (const s of plan.buildSequence) {
      const deps = s.dependencies.length > 0 ? ` (after: ${s.dependencies.join(', ')})` : ''
      lines.push(`${s.order}. [${s.agent}] ${s.task}${deps}`)
    }
  }

  return lines.join('\n')
}

main()
