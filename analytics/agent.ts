/**
 * Analytics Agent — Task Runner
 *
 * Picks up tasks from agent_tasks table, routes to the right analysis module,
 * writes results back, and logs substantial findings.
 */

import type { AnalysisCommand, AnalysisResult } from './lib/types.js';
import type { EntityType } from './config/constants.js';
import { ENTITY_TYPES } from './config/constants.js';

// Lazy-loaded Supabase (only needed when running as agent)
async function getSupabase() {
  const { getSupabase: gs } = await import('../lib/supabase.js');
  return gs();
}

async function logFinding(summary: string, details?: Record<string, unknown>, tags?: string[]) {
  const { logFinding: lf } = await import('../lib/logging.js');
  await lf('analytics', summary, details as any, tags);
}

// ─── Command Parsing ──────────────────────────────────────────

function parseCommand(description: string): AnalysisCommand | null {
  // Try JSON first
  try {
    const parsed = JSON.parse(description);
    if (parsed.type) return parsed as AnalysisCommand;
  } catch {
    // Fall through to keyword parsing
  }

  // Keyword fallback
  const lower = description.toLowerCase();

  if (lower.includes('scan') && lower.includes('opportunit')) {
    const entityMatch = lower.match(/entity[_-]?type[:\s=]+["']?(\w[\w\s]*\w)["']?/i);
    let entityType: EntityType | undefined;
    if (entityMatch) {
      const candidate = entityMatch[1];
      const found = ENTITY_TYPES.find(t => t.toLowerCase() === candidate.toLowerCase());
      if (found) entityType = found;
    }
    return { type: 'scan-opportunities', entityType };
  }

  if (lower.includes('deep') && lower.includes('dive')) {
    const countryMatch = description.match(/(?:country|for|in)\s*[:=]?\s*["']?([A-Z][\w\s,]+?)["']?\s*$/i);
    if (countryMatch) return { type: 'deep-dive', country: countryMatch[1].trim() };
  }

  if (lower.includes('diagnos')) {
    const countryMatch = description.match(/(?:country|for|in)\s*[:=]?\s*["']?([A-Z][\w\s,]+?)["']?\s*$/i);
    if (countryMatch) return { type: 'diagnose', country: countryMatch[1].trim() };
  }

  if (lower.includes('compar')) {
    const countryMatch = description.match(/(?:country|for|in)\s*[:=]?\s*["']?([A-Z][\w\s,]+?)["']?\s*$/i);
    const detailed = lower.includes('detail');
    if (countryMatch) return { type: 'compare', country: countryMatch[1].trim(), detailed };
  }

  return null;
}

// ─── Command Routing ──────────────────────────────────────────

async function executeCommand(command: AnalysisCommand): Promise<AnalysisResult> {
  switch (command.type) {
    case 'scan-opportunities': {
      const { run } = await import('./analyses/scan-opportunities.js');
      return run({ entityType: command.entityType, minVolume: command.minVolume });
    }
    case 'compare': {
      const { run } = await import('./analyses/compare.js');
      return run({ country: command.country, detailed: command.detailed });
    }
    case 'deep-dive': {
      const { run } = await import('./analyses/deep-dive.js');
      return run({ country: command.country });
    }
    case 'diagnose': {
      const { run } = await import('./analyses/diagnose-country.js');
      return run({ country: command.country, minVolume: command.minVolume });
    }
  }
}

// ─── Task Pickup ──────────────────────────────────────────────

interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export async function checkTasks(): Promise<{ processed: number; errors: number }> {
  const supabase = await getSupabase();

  const { data: tasks, error } = await supabase
    .from('agent_tasks' as any)
    .select('id, title, description, status, priority')
    .or('target_agent.eq.analytics,target_agent.is.null')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch tasks:', error.message);
    return { processed: 0, errors: 1 };
  }

  const pending = (tasks || []) as unknown as AgentTask[];
  if (pending.length === 0) {
    console.log('No pending tasks.');
    return { processed: 0, errors: 0 };
  }

  console.log(`Found ${pending.length} pending task(s).`);
  let processed = 0;
  let errors = 0;

  for (const task of pending) {
    console.log(`\nProcessing: ${task.title} (${task.id})`);

    // Claim task
    await supabase
      .from('agent_tasks' as any)
      .update({ status: 'picked-up', picked_up_by: 'analytics' } as any)
      .eq('id', task.id);

    try {
      const command = parseCommand(task.description);
      if (!command) {
        throw new Error(`Could not parse command from description: "${task.description.slice(0, 100)}"`);
      }

      console.log(`  Command: ${command.type}`);
      const result = await executeCommand(command);
      console.log(`  Done. Summary: ${result.summary.slice(0, 100)}...`);

      // Write result
      await supabase
        .from('agent_tasks' as any)
        .update({
          status: 'done',
          result_summary: result.summary,
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', task.id);

      // Log substantial findings
      for (const finding of result.findings) {
        await logFinding(finding.summary, finding.details, finding.tags);
      }

      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Error: ${message}`);

      await supabase
        .from('agent_tasks' as any)
        .update({
          status: 'failed',
          result_summary: `Error: ${message}`,
        } as any)
        .eq('id', task.id);

      const { logError } = await import('../lib/logging.js');
      await logError('analytics', err instanceof Error ? err : new Error(message), {
        task_id: task.id,
        task_title: task.title,
      });

      errors++;
    }
  }

  return { processed, errors };
}
