// Database client
export { getSupabase, db } from './supabase.js'
export type { Database, TypedSupabaseClient } from './supabase.js'

// Types
export * from './database.types.js'

// Logging
export { logAgent, logError, logFinding, logRecommendation } from './logging.js'
