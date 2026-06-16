import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TriageCard, FeedbackKind } from '@/lib/triage-types'

const COLS = 'id,channel,action_type,action_target,predicted_reply,edited_reply,action_accepted,confidence,why,status,sensitive,card,created_at,needs_data,tier,verdict,trigger_text,web_link'

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
