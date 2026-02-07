#!/usr/bin/env tsx
/**
 * Team Lead Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx pm_team/team-lead/run.ts hygiene [--days=7]
 *   npx tsx pm_team/team-lead/run.ts synthesize [--days=7] [--agents=analytics,data-viz]
 *   npx tsx pm_team/team-lead/run.ts enforce [--workflow=all]
 *   npx tsx pm_team/team-lead/run.ts check-tasks
 */

import 'dotenv/config'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`
  const arg = args.find(a => a.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : undefined
}

async function main() {
  if (!command) {
    console.log(`
Team Lead Agent — CLI

Commands:
  hygiene [--days=7]                         Scan backlog for overdue/stale/stuck tasks
  synthesize [--days=7] [--agents=a,b]       Cross-agent pattern detection and synthesis
  enforce [--workflow=all]                   Check workflow compliance across agents
  check-tasks                                Pick up pending tasks from agent_tasks table

Examples:
  npx tsx pm_team/team-lead/run.ts hygiene
  npx tsx pm_team/team-lead/run.ts hygiene --days=14
  npx tsx pm_team/team-lead/run.ts synthesize
  npx tsx pm_team/team-lead/run.ts synthesize --days=30 --agents=analytics,data-viz
  npx tsx pm_team/team-lead/run.ts enforce
  npx tsx pm_team/team-lead/run.ts check-tasks
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'hygiene': {
        const days = getFlag('days') ? parseInt(getFlag('days')!, 10) : undefined
        const { run } = await import('./commands/hygiene.js')
        const result = await run({ days })
        console.log('\n' + result.summary)
        if (result.issues.length > 0) {
          console.log('\nDetails:')
          for (const issue of result.issues) {
            console.log(`  [${issue.issueType.toUpperCase()}] ${issue.title}`)
            console.log(`    ${issue.detail}`)
            if (issue.targetAgent) console.log(`    Agent: ${issue.targetAgent}`)
          }
        }
        break
      }

      case 'synthesize': {
        const days = getFlag('days') ? parseInt(getFlag('days')!, 10) : undefined
        const agentsFlag = getFlag('agents')
        const agents = agentsFlag ? agentsFlag.split(',').map(a => a.trim()) : undefined
        const { run } = await import('./commands/synthesize.js')
        const result = await run({ days, agents })
        console.log('\n' + result.summary)
        break
      }

      case 'enforce': {
        const workflow = getFlag('workflow')
        const { run } = await import('./commands/enforce.js')
        const result = await run({ workflow })
        console.log('\n' + result.summary)
        if (result.checks.length > 0) {
          console.log('\nAll checks:')
          for (const check of result.checks) {
            const icon = check.passed ? 'PASS' : 'FAIL'
            console.log(`  [${icon}] ${check.check}`)
            console.log(`    ${check.detail}`)
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

main()
