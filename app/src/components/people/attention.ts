import type { AttentionLevel } from '@/lib/types'

/** Visual mapping for an attention level, shared by the rail and the hero. */
interface AttentionStyle {
  label: string
  badge: 'destructive' | 'warning' | 'info' | 'success'
  dot: string
}

export const ATTENTION: Record<AttentionLevel, AttentionStyle> = {
  high: { label: 'Needs attention', badge: 'destructive', dot: 'bg-red-500' },
  watch: { label: 'Watch', badge: 'warning', dot: 'bg-amber-500' },
  new: { label: 'Ramping', badge: 'info', dot: 'bg-blue-500' },
  ok: { label: 'On track', badge: 'success', dot: 'bg-emerald-500' },
}
