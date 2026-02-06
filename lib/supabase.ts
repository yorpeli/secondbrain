import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types.js'

// Environment validation
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
}

// Singleton client instance
let client: SupabaseClient<Database> | null = null

/**
 * Get the Supabase client instance.
 * Uses service role key for full access - use responsibly.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return client
}

/**
 * Shorthand for getSupabase() - commonly used alias
 */
export const db = () => getSupabase()

// Re-export types for convenience
export type { Database } from './database.types.js'
export type TypedSupabaseClient = SupabaseClient<Database>
