/**
 * Shared Embedding Utilities
 *
 * Generate and store embeddings in the `embeddings` table.
 * Uses raw fetch against OpenAI API — no extra dependencies.
 * Follows the lib/research.ts pattern (lazy Supabase import, `as any` casts).
 */

import { createHash } from 'crypto'

// Lazy-loaded Supabase
async function getSupabase() {
  const { getSupabase: gs } = await import('./supabase.js')
  return gs()
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

// ─── Types ───────────────────────────────────────────────────

export interface EmbeddingInput {
  entityType: string
  entityId: string
  chunkText: string
  chunkIndex?: number
  contentSectionId?: string
}

export interface SearchResult {
  entity_type: string
  entity_id: string
  chunk_text: string
  similarity: number
}

// ─── Core Functions ──────────────────────────────────────────

/**
 * Generate an embedding vector via OpenAI's API.
 */
export async function generateEmbeddingVector(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI embeddings API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  return json.data[0].embedding as number[]
}

/**
 * Delete existing embeddings for an entity, then insert new one. Idempotent.
 */
export async function upsertEmbedding(input: EmbeddingInput): Promise<void> {
  const supabase = await getSupabase()
  const vector = await generateEmbeddingVector(input.chunkText)

  // Delete existing for this entity + chunk index
  await supabase
    .from('embeddings' as any)
    .delete()
    .eq('entity_type', input.entityType)
    .eq('entity_id', input.entityId)
    .eq('chunk_index', input.chunkIndex ?? 0)

  const { error } = await supabase
    .from('embeddings' as any)
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      chunk_text: input.chunkText,
      chunk_index: input.chunkIndex ?? 0,
      embedding: JSON.stringify(vector),
      content_section_id: input.contentSectionId ?? null,
    } as any)

  if (error) {
    throw new Error(`Failed to upsert embedding: ${error.message}`)
  }
}

/**
 * Delete all embeddings for an entity.
 */
export async function deleteEmbeddings(entityType: string, entityId: string): Promise<void> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('embeddings' as any)
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (error) {
    console.error(`[embeddings] Failed to delete: ${error.message}`)
  }
}

/**
 * Get the set of entity IDs that already have embeddings for a given type.
 */
export async function getExistingEmbeddingIds(entityType: string): Promise<Set<string>> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('embeddings' as any)
    .select('entity_id')
    .eq('entity_type', entityType)

  if (error) {
    console.error(`[embeddings] Failed to fetch existing IDs for ${entityType}: ${error.message}`)
    return new Set()
  }

  return new Set((data || []).map((r: any) => r.entity_id as string))
}

/**
 * Process a batch of embedding inputs sequentially with progress logging.
 * When force=false (default), skips entities that already have embeddings.
 */
export async function batchEmbed(
  inputs: EmbeddingInput[],
  options?: { force?: boolean }
): Promise<{ success: number; failed: number; skipped: number }> {
  const force = options?.force ?? false
  let success = 0
  let failed = 0
  let skipped = 0

  // When not forcing, build a set of existing entity IDs to skip
  let existingIds = new Set<string>()
  if (!force && inputs.length > 0) {
    const entityType = inputs[0].entityType
    existingIds = await getExistingEmbeddingIds(entityType)
    if (existingIds.size > 0) {
      console.log(`[embeddings] Found ${existingIds.size} existing ${entityType} embeddings — will skip those`)
    }
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]

    // Skip if already embedded (unless forcing)
    if (!force && existingIds.has(input.entityId)) {
      skipped++
      continue
    }

    try {
      await upsertEmbedding(input)
      success++
      if ((i + 1) % 10 === 0 || i === inputs.length - 1) {
        console.log(`[embeddings] Progress: ${i + 1}/${inputs.length} (${success} ok, ${failed} failed, ${skipped} skipped)`)
      }
    } catch (err) {
      failed++
      console.error(`[embeddings] Failed to embed ${input.entityType}/${input.entityId}: ${(err as Error).message}`)
    }
  }

  return { success, failed, skipped }
}

/**
 * Deterministic UUID v5-style from a string input.
 * Uses SHA-256 truncated to UUID format for playbook file paths.
 */
export function deterministicUuid(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID: 8-4-4-4-12
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16), // version 5
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20), // variant
    hash.slice(20, 32),
  ].join('-')
}

/**
 * Convenience wrapper: embed a query and search by entity type(s).
 */
export async function searchByType(
  query: string,
  entityTypes: string[],
  options?: { threshold?: number; limit?: number }
): Promise<SearchResult[]> {
  const supabase = await getSupabase()
  const vector = await generateEmbeddingVector(query)

  const threshold = options?.threshold ?? 0.7
  const limit = options?.limit ?? 10

  const { data, error } = await supabase
    .rpc('search_knowledge', {
      query_embedding: JSON.stringify(vector),
      match_threshold: threshold,
      match_count: limit,
    } as any)

  if (error) {
    console.error(`[embeddings] Search failed: ${error.message}`)
    return []
  }

  const results = (data || []) as unknown as SearchResult[]
  return results.filter(r => entityTypes.includes(r.entity_type))
}
