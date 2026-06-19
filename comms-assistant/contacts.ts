// Recipient resolution + contact learning for the outgoing flow.
// Resolve order: people (T1) → context_store.comms_contacts → unknown (ask).
// Learn: backfill people.email when empty; confirm before overwriting a different value;
// externals (not in people) go to context_store.comms_contacts. NEVER embedded.
async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../lib/supabase.js')
  return getSupabase() as any
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

export type BackfillDecision = 'fill' | 'confirm' | 'noop'

// Pure: decide what to do with a newly-supplied address given what's on record.
export function contactBackfillDecision(existingEmail: string | null | undefined, incomingEmail: string): BackfillDecision {
  if (!norm(existingEmail)) return 'fill'
  if (norm(existingEmail) === norm(incomingEmail)) return 'noop'
  return 'confirm'
}

export interface ResolvedRecipient {
  slug?: string
  name?: string
  email?: string
  source: 'people' | 'contacts' | 'unknown'
}

interface ContactsDoc { contacts: { name: string; email: string; learned_at?: string; source?: string }[] }

async function readContacts(sb: any): Promise<ContactsDoc> {
  const { data } = await sb.from('context_store').select('content').eq('key', 'comms_contacts').maybeSingle()
  const content = data?.content
  return content && Array.isArray(content.contacts) ? content : { contacts: [] }
}

export async function resolveRecipient(query: string): Promise<ResolvedRecipient> {
  const sb = await db()
  const q = query.trim()
  // 1) people — exact email, exact slug, or fuzzy name (active only)
  const isEmail = q.includes('@')
  let person: any = null
  if (isEmail) {
    const { data } = await sb.from('people').select('slug,name,email').eq('email', q).limit(1)
    person = data?.[0] ?? null
  } else {
    const { data: bySlug } = await sb.from('people').select('slug,name,email').eq('slug', q).limit(1)
    person = bySlug?.[0] ?? null
    if (!person) {
      const { data: byName } = await sb.from('people').select('slug,name,email').ilike('name', `%${q}%`).eq('status', 'active').limit(1)
      person = byName?.[0] ?? null
    }
  }
  if (person) return { slug: person.slug, name: person.name, email: person.email ?? undefined, source: 'people' }

  // 2) external contacts in context_store
  const doc = await readContacts(sb)
  const hit = doc.contacts.find((c) => norm(c.name) === norm(q) || norm(c.email) === norm(q))
  if (hit) return { name: hit.name, email: hit.email, source: 'contacts' }

  // 3) unknown — caller asks Yonatan once, then calls upsertExternalContact / backfillPersonEmail
  return { source: 'unknown', ...(isEmail ? { email: q } : { name: q }) }
}

export async function upsertExternalContact(c: { name: string; email: string }): Promise<void> {
  const sb = await db()
  const doc = await readContacts(sb)
  const rest = doc.contacts.filter((x) => norm(x.name) !== norm(c.name))
  rest.push({ name: c.name, email: c.email, learned_at: new Date().toISOString().slice(0, 10), source: 'outgoing-email' })
  // upsert the single key-value row
  const { error } = await sb.from('context_store').upsert({ key: 'comms_contacts', content: { contacts: rest } }, { onConflict: 'key' })
  if (error) throw error
}

export async function backfillPersonEmail(slug: string, email: string): Promise<void> {
  const sb = await db()
  const { error } = await sb.from('people').update({ email, updated_at: new Date().toISOString() }).eq('slug', slug)
  if (error) throw error
}
