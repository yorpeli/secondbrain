// Point-in-time filter: only context that existed at/before `asOf` is visible.
// Unknown timestamp → excluded, so the predictor is blind by default.
export interface Timestamped {
  updated_at?: string | null
  created_at?: string | null
}

export function filterAsOf<T extends Timestamped>(records: T[], asOf: string): T[] {
  const cut = new Date(asOf).getTime()
  return records.filter((r) => {
    const t = r.updated_at ?? r.created_at
    if (!t) return false
    return new Date(t).getTime() <= cut
  })
}
