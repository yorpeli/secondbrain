// DB layer for the command-center daily loop (v2: Supabase backbone).
// command_center_days holds the per-day docs (focus / summary / reconcile);
// command_center_captures is the append-only capture log. These tables hold
// distilled comms content and are NEVER embedded.
// Lazy Supabase import (repo convention) — importing this module never requires
// env vars; they're checked on first DB call.
async function db() {
  await import('dotenv/config')
  const { getSupabase } = await import('../../lib/supabase.js')
  return getSupabase()
}

export interface DayRow {
  day: string
  focus_md: string | null
  summary_md: string | null
  reconcile_md: string | null
  status: 'open' | 'closed'
  focus_generated_at: string | null
  summary_written_at: string | null
  reconciled_at: string | null
}

export interface CaptureRow {
  id?: string
  day: string
  captured_at: string
  window_start: string | null
  window_end: string | null
  headline: string
  needs_attention: string | null
  body_md: string
  people: string[]
  initiatives: string[]
  tags: string[]
  source: string
}

export interface CapturePayload {
  day?: string
  window_start?: string
  window_end?: string
  headline: string
  needs_attention?: string | null
  body_md: string
  people?: string[]
  initiatives?: string[]
  tags?: string[]
  source?: string
}

export async function getDay(day: string): Promise<DayRow | null> {
  const { data, error } = await (await db())
    .from('command_center_days' as any)
    .select('day, focus_md, summary_md, reconcile_md, status, focus_generated_at, summary_written_at, reconciled_at')
    .eq('day', day)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as DayRow) ?? null
}

export async function upsertFocus(day: string, focusMd: string): Promise<void> {
  const { error } = await (await db())
    .from('command_center_days' as any)
    .upsert(
      { day, focus_md: focusMd, focus_generated_at: new Date().toISOString() },
      { onConflict: 'day' }
    )
  if (error) throw error
}

export async function setSummary(day: string, summaryMd: string): Promise<void> {
  const { error } = await (await db())
    .from('command_center_days' as any)
    .upsert(
      { day, summary_md: summaryMd, summary_written_at: new Date().toISOString() },
      { onConflict: 'day' }
    )
  if (error) throw error
}

export async function setReconcile(
  day: string,
  reconcileMd: string,
  close = true
): Promise<void> {
  const row: Record<string, unknown> = {
    day,
    reconcile_md: reconcileMd,
    reconciled_at: new Date().toISOString(),
  }
  if (close) row.status = 'closed'
  const { error } = await (await db())
    .from('command_center_days' as any)
    .upsert(row, { onConflict: 'day' })
  if (error) throw error
}

export async function listCaptures(day: string): Promise<CaptureRow[]> {
  const { data, error } = await (await db())
    .from('command_center_captures' as any)
    .select('id, day, captured_at, window_start, window_end, headline, needs_attention, body_md, people, initiatives, tags, source')
    .eq('day', day)
    .order('captured_at', { ascending: true })
  if (error) throw error
  return (data as unknown as CaptureRow[]) ?? []
}

/** End of the most recent capture window across all days — drives the lookback. */
export async function lastWindowEnd(): Promise<string | null> {
  const { data, error } = await (await db())
    .from('command_center_captures' as any)
    .select('window_end')
    .not('window_end', 'is', null)
    .order('window_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as { window_end: string } | null)?.window_end ?? null
}

export async function insertCapture(payload: CapturePayload): Promise<string> {
  const day = payload.day ?? new Date().toISOString().slice(0, 10)
  const { data, error } = await (await db())
    .from('command_center_captures' as any)
    .insert({
      day,
      window_start: payload.window_start ?? null,
      window_end: payload.window_end ?? null,
      headline: payload.headline,
      needs_attention: payload.needs_attention ?? null,
      body_md: payload.body_md,
      people: payload.people ?? [],
      initiatives: payload.initiatives ?? [],
      tags: payload.tags ?? [],
      source: payload.source ?? 'claude-code',
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as unknown as { id: string }).id
}

/** Durable-layer doc from context_store (command_center_routing / command_center_people). */
export async function getContextDoc(key: string): Promise<string | null> {
  const { data, error } = await (await db())
    .from('context_store' as any)
    .select('content')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  const content = (data as unknown as { content: unknown } | null)?.content
  if (content == null) return null
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2)
}
