import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TriageCard, FeedbackKind } from '@/lib/triage-types'
import { buildDraftRequest } from '@/lib/draft-request'

const COLS = 'id,channel,action_type,action_target,predicted_reply,edited_reply,action_accepted,confidence,why,status,sensitive,card,created_at,needs_data,tier,verdict,trigger_text,web_link,context_available'

export function useTriageCards() {
  return useQuery({
    queryKey: ['triage', 'open'],
    queryFn: async (): Promise<TriageCard[]> => {
      const { data, error } = await supabase
        .from('comms_predictions' as never)
        .select(COLS)
        .eq('status', 'open')
        .is('resolution', null)        // exclude reconciled/historical rows
        .order('created_at', { ascending: false })   // newest first (matches the HTML template)
      if (error) throw error
      return (data ?? []) as unknown as TriageCard[]
    },
  })
}

export function useApplyFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { predictionId: string; kind: FeedbackKind; payload: Record<string, unknown> }) => {
      const { error } = await supabase.rpc('comms_apply_feedback', {
        p_prediction_id: v.predictionId, p_kind: v.kind, p_payload: v.payload,
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['triage'] }) },
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (predictionId: string) => {
      const { error } = await supabase.rpc('comms_mark_read', { p_prediction_id: predictionId })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['triage'] }) },
  })
}

export function usePushOutlookDraft() {
  return useMutation({
    mutationFn: async (card: TriageCard): Promise<{ ok: true; mode: 'fresh' | 'reply' }> => {
      const req = buildDraftRequest(card)
      const url = import.meta.env.VITE_OUTLOOK_BRIDGE_URL ?? 'http://127.0.0.1:7777'
      const token = import.meta.env.VITE_OUTLOOK_BRIDGE_TOKEN ?? ''
      let res: Response
      try {
        res = await fetch(`${url}/draft`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-bridge-token': token },
          body: JSON.stringify(req),
        })
      } catch {
        throw new Error('Bridge not running — run `npm run outlook-bridge`')
      }
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; mode?: 'fresh' | 'reply'; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Bridge error (${res.status})`)
      return { ok: true, mode: data.mode ?? req.mode }
    },
  })
}
