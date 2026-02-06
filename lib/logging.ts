import { getSupabase } from './supabase.js'
import { AgentLogCategory, Json } from './database.types.js'

type LogCategory = typeof AgentLogCategory[keyof typeof AgentLogCategory]

interface LogEntry {
  agentSlug: string
  category: LogCategory
  summary: string
  details?: Json
  relatedEntityType?: string
  relatedEntityId?: string
  tags?: string[]
}

/**
 * Log a significant observation, finding, error, or recommendation to agent_log.
 *
 * IMPORTANT: Only log substantial items that another agent or human would benefit
 * from knowing. Not for routine run tracking.
 *
 * @example
 * await logAgent({
 *   agentSlug: 'research',
 *   category: 'finding',
 *   summary: 'Competitor X launched new KYC product',
 *   details: { source: 'https://...', confidence: 'high' },
 *   tags: ['competitor', 'kyc']
 * })
 */
export async function logAgent(entry: LogEntry): Promise<string | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('agent_log')
    .insert({
      agent_slug: entry.agentSlug,
      category: entry.category,
      summary: entry.summary,
      details: entry.details ?? null,
      related_entity_type: entry.relatedEntityType ?? null,
      related_entity_id: entry.relatedEntityId ?? null,
      tags: entry.tags ?? [],
    })
    .select('id')
    .single()

  if (error) {
    console.error('[agent_log] Failed to write:', error.message)
    return null
  }

  return data.id
}

/**
 * Log an error to agent_log with standard formatting
 */
export async function logError(
  agentSlug: string,
  error: Error | string,
  context?: Record<string, Json>
): Promise<string | null> {
  const errorMessage = error instanceof Error ? error.message : error
  const errorStack = error instanceof Error ? error.stack : undefined

  return logAgent({
    agentSlug,
    category: 'error',
    summary: errorMessage,
    details: {
      ...context,
      stack: errorStack ?? null,
    },
    tags: ['error'],
  })
}

/**
 * Log a finding (discovery, insight) to agent_log
 */
export async function logFinding(
  agentSlug: string,
  summary: string,
  details?: Json,
  tags?: string[]
): Promise<string | null> {
  return logAgent({
    agentSlug,
    category: 'finding',
    summary,
    details,
    tags: ['finding', ...(tags ?? [])],
  })
}

/**
 * Log a recommendation to agent_log
 */
export async function logRecommendation(
  agentSlug: string,
  summary: string,
  details?: Json,
  tags?: string[]
): Promise<string | null> {
  return logAgent({
    agentSlug,
    category: 'recommendation',
    summary,
    details,
    tags: ['recommendation', ...(tags ?? [])],
  })
}
