// Pure presentation-payload builder. Shared by render-triage.ts (view) and run.ts add-many
// (persist) so a comms_predictions.card is fully reconstructable in the browser — incl. the
// People/Guardrails/Rules context that the retrieval layer (assembleContext) produces server-side.
import type { ContextBundle } from './retrieve.js'

export interface CardPayload {
  email: {
    subject: string | null; from: string | null; date: string | null
    to: string[] | null; excerpt: string | null; webLink: string | null; thread_summary: string | null
  }
  thread: unknown               // the ThreadInput as captured (subject/participants/mentions/bodyToDate)
  suggestion_extras: {
    memory_brief: unknown | null
    text_alt: string | null; lang: string | null; lang_alt: string | null
    secondary: string | null; sources: unknown | null
  }
  context: {                    // serialized ContextBundle — what the card's collapsible context shows
    thread: string; rules: unknown[]; participants: unknown[]
    ownership: unknown | null; narrative: unknown[]; meta: unknown
  }
}

export function buildCardPayload(item: any, bundle: ContextBundle): CardPayload {
  const e = item?.email ?? {}
  const s = item?.suggestion ?? {}
  const b = (bundle ?? {}) as any
  // When capture writes the body to thread.bodyToDate but omits email.excerpt, fall back so the
  // card's "Original message" column isn't blank (the field the /triage app and HTML export read).
  const excerpt = e.excerpt ?? item?.body ?? item?.thread?.bodyToDate ?? null
  return {
    email: {
      subject: e.subject ?? null, from: e.from ?? null, date: e.date ?? null,
      to: e.to ?? null, excerpt,
      webLink: e.webLink ?? e.web_link ?? null, thread_summary: e.thread_summary ?? null,
    },
    thread: item?.thread ?? null,
    suggestion_extras: {
      memory_brief: s.memory_brief ?? null,
      text_alt: s.text_alt ?? null, lang: s.lang ?? null, lang_alt: s.lang_alt ?? null,
      secondary: s.action?.secondary ?? s.secondary ?? null,
      sources: s.sources ?? null,
    },
    context: {
      thread: b.thread ?? '', rules: b.rules ?? [], participants: b.participants ?? [],
      ownership: b.ownership ?? null, narrative: b.narrative ?? [], meta: b.meta ?? {},
    },
  }
}
