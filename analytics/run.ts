#!/usr/bin/env tsx
/**
 * Analytics Agent — CLI Entry Point
 *
 * Usage:
 *   npx tsx analytics/run.ts scan-opportunities [--entity-type=Company]
 *   npx tsx analytics/run.ts compare <country> [--detailed]
 *   npx tsx analytics/run.ts deep-dive <country>
 *   npx tsx analytics/run.ts diagnose <country>
 *   npx tsx analytics/run.ts check-tasks
 */

import 'dotenv/config';
import type { EntityType } from './config/constants.js';
import { ENTITY_TYPES } from './config/constants.js';

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = args.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getPositional(index: number): string | undefined {
  // Skip flags when counting positional args
  const positionals = args.filter(a => !a.startsWith('--'));
  return positionals[index];
}

async function main() {
  if (!command) {
    console.log(`
Analytics Agent — CLI

Commands:
  scan-opportunities [--entity-type=Company]   Scan Tier 0/1/2 countries for CLM opportunities
  compare <country> [--detailed]               Compare CLM vs 4Step for a country
  deep-dive <country>                          Deep analysis with volume trends and funnel health
  diagnose <country>                           Diagnostic: identify issues by AH type, device
  check-tasks                                  Pick up pending tasks from agent_tasks table

Examples:
  npx tsx analytics/run.ts scan-opportunities
  npx tsx analytics/run.ts scan-opportunities --entity-type=Company
  npx tsx analytics/run.ts compare Argentina
  npx tsx analytics/run.ts compare Argentina --detailed
  npx tsx analytics/run.ts deep-dive "United States of America"
  npx tsx analytics/run.ts diagnose Bangladesh
  npx tsx analytics/run.ts check-tasks
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'scan-opportunities':
      case 'scan': {
        const entityTypeRaw = getFlag('entity-type');
        let entityType: EntityType | undefined;
        if (entityTypeRaw) {
          const found = ENTITY_TYPES.find(t => t.toLowerCase() === entityTypeRaw.toLowerCase());
          if (!found) {
            console.error(`Invalid entity type: ${entityTypeRaw}. Valid: ${ENTITY_TYPES.join(', ')}`);
            process.exit(1);
          }
          entityType = found;
        }
        const { run } = await import('./analyses/scan-opportunities.js');
        const result = await run({ entityType });
        console.log('\n' + result.summary);
        console.log(`\n${result.data.countries.length} countries analyzed.`);
        console.log(JSON.stringify(result.data.summary, null, 2));
        break;
      }

      case 'compare': {
        const country = getPositional(1);
        if (!country) {
          console.error('Usage: compare <country> [--detailed]');
          process.exit(1);
        }
        const detailed = hasFlag('detailed');
        const { run } = await import('./analyses/compare.js');
        const result = await run({ country, detailed });
        console.log('\n' + result.summary);
        if (result.data.trend_analysis) {
          console.log(`\nTrend: ${result.data.trend_analysis.direction} (${(result.data.trend_analysis.trend_delta * 100).toFixed(1)}pp)`);
        }
        break;
      }

      case 'deep-dive': {
        const country = getPositional(1);
        if (!country) {
          console.error('Usage: deep-dive <country>');
          process.exit(1);
        }
        const { run } = await import('./analyses/deep-dive.js');
        const result = await run({ country });
        console.log('\n' + result.summary);
        console.log('\n' + result.data.narrative);
        break;
      }

      case 'diagnose': {
        const country = getPositional(1);
        if (!country) {
          console.error('Usage: diagnose <country>');
          process.exit(1);
        }
        const { run } = await import('./analyses/diagnose-country.js');
        const result = await run({ country });
        console.log('\n' + result.summary);
        break;
      }

      case 'check-tasks': {
        const { checkTasks } = await import('./agent.js');
        const stats = await checkTasks();
        console.log(`\nDone. Processed: ${stats.processed}, Errors: ${stats.errors}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
