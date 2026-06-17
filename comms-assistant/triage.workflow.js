export const meta = {
  name: 'comms-triage',
  description: 'Tier-route → schema-forced draft → self-eval → diverse-lens adversarial verify, per captured comms thread',
  phases: [
    { title: 'Draft', detail: 'tier-routed, schema-forced suggestion (T0 templated / T1 shallow / T2 deep)' },
    { title: 'Verify', detail: 'three diverse-lens adversarial verifiers per T2 draft' },
  ],
}

const REPO = '/Users/yorpeli/Documents/Dev/SecondBrain'

// ── Schemas (StructuredOutput forces shape: enums, required fields — no [object Object], no prose) ──
const SUGGESTION_SCHEMA = {
  type: 'object', required: ['suggestion', 'self_check'], additionalProperties: true,
  properties: {
    suggestion: {
      type: 'object', required: ['action', 'disposition', 'needs_data', 'confidence', 'why'],
      properties: {
        action: {
          type: 'object', required: ['type', 'target'],
          properties: {
            type: { enum: ['reply', 'redirect', 'sidebar', 'route', 'task', 'escalate', 'schedule', 'monitor', 'none'] },
            target: { type: ['string', 'null'] }, channel: { type: ['string', 'null'] }, secondary: { type: ['string', 'null'] },
          },
        },
        disposition: { type: 'string' }, needs_data: { type: 'boolean' },
        confidence: { enum: ['high', 'med', 'low'] },            // ← string enum, never an object
        text: { type: ['string', 'null'] },
        lang: { type: ['string', 'null'] }, lang_alt: { type: ['string', 'null'] }, text_alt: { type: ['string', 'null'] },
        why: { type: 'string' }, memory_brief: {},
      },
    },
    self_check: {
      type: 'object', required: ['passed', 'notes'],
      properties: {
        draft_lang_matches_thread: { type: 'boolean' }, no_garbled_tokens: { type: 'boolean' },
        delay_acknowledged: { type: 'boolean' }, etiquette_ok: { type: 'boolean' },
        facts_traceable: { type: 'boolean' }, voice_ok: { type: 'boolean' }, schema_ok: { type: 'boolean' },
        passed: { type: 'boolean' }, notes: { type: 'string' },
      },
    },
  },
}
const VERDICT_SCHEMA = {
  type: 'object', required: ['lens', 'refuted', 'severity', 'issue'],
  properties: {
    lens: { type: 'string' }, refuted: { type: 'boolean' },
    severity: { enum: ['none', 'minor', 'major'] }, issue: { type: 'string' },
  },
}

// ── Tiering: route by cheap structural signals (sensitive/ask → deep; cc-only → shallow; broadcast/cold → templated) ──
function routeTier(it) {
  const s = it.signals || {}
  if (s.sensitive) return 2                     // high stakes → deep + verify
  if (s.broadcast || s.cold) return 0           // structurally forced → templated, no agent
  if (s.directToHim || s.askToHim) return 2     // a decision/ask aimed at him → deep
  return 1                                       // cc-only / peripheral → shallow
}

// T0: action is forced by structure — produce the card deterministically, no subagent.
function t0Card(it) {
  const s = it.signals || {}, ch = (it.email && it.email.channel) || 'outlook'
  const type = s.cold ? 'none' : 'monitor'
  const why = s.broadcast
    ? 'Broadcast / informational to a large distribution list — no response expected. Monitor for anything CLM-relevant; no reply warranted.'
    : 'Cold external follow-up with no active need behind it — no reply warranted; reach back only if a real evaluation opens.'
  return {
    suggestion: { action: { type, target: null, channel: ch, secondary: null }, disposition: type, needs_data: false, confidence: 'high', text: null, why, memory_brief: 'nothing material in memory' },
    self_check: { passed: true, notes: 'T0 — templated, no subagent (action forced by thread structure)' },
    verdict: null,
  }
}

function draftPrompt(it, tier, today) {
  const deep = tier === 2
  // TODAY is supplied by the caller (orchestrator passes the live date) — never hardcoded, so it
  // can't drift. If absent, instruct the agent to treat the most recent thread date as "now".
  const dateLine = today
    ? `TODAY = ${today}.`
    : `TODAY = (not provided — reason relative to the latest message date in the thread; do not assume a specific calendar date).`
  return `Follow the contract in \`comms-assistant/prompts/triage-runner.md\` (read it first, then \`comms-assistant/prompts/prediction-subagent.md\`). Repo root: ${REPO}. ${dateLine} slug: ${it.slug}.
${deep
    ? `DEEP (T2): write the THREAD json to /tmp/ti-${it.slug}.json and run \`npx tsx comms-assistant/run.ts context:assemble --file=/tmp/ti-${it.slug}.json\` to ground (rules spine, T1 people, T2 ownership incl. referenceFacts, T3 narrative). You MAY searchByType for more.`
    : `SHALLOW (T1): do NOT run deep grounding — reason from the thread + the ownership note below. ${it.ownership_note || ''}`}
Apply the pinned rules (executive voice; route = name owner don't publicly instruct; stale-thread delay-acknowledgment if it's been waiting ~1wk+). ${it.lang_hint || ''}
Produce suggestion + self_check via the enforced schema. Return ONLY the structured object.
EMAIL: ${JSON.stringify(it.email)}
THREAD: ${JSON.stringify(it.thread)}
BODY:
${it.body || it.email.excerpt || ''}`
}

const LENS_GUIDE = {
  faithfulness: 'Does the draft answer what the thread ACTUALLY asked, or a strawman / a point nobody raised? Does it miss the real ask?',
  'ownership-and-facts': 'Every name, owner, number, location in the draft + memory_brief — does it trace to the thread or a verifiable fact? Flag anything invented or contradicted (wrong owner, wrong domain, wrong office). You MAY run context:assemble (write /tmp/tv-<slug>.json) to check ownership.',
  'voice-and-etiquette': 'Does a route/redirect publicly instruct someone in front of an audience? Accusatory/defensive tone? A stale-date confirm? A thread waiting ~1wk+ with NO delay-acknowledgment?',
}
function verifyPrompt(d, lens) {
  return `You are an ADVERSARIAL verifier. Find the strongest reason the suggestion below is WRONG, through the "${lens}" lens. Assume there is a flaw; default refuted=true unless it clearly survives. Repo: ${REPO}; slug: ${d.slug}.
LENS — ${lens}: ${LENS_GUIDE[lens]}
THREAD: ${JSON.stringify(d.thread)}
BODY:
${d.body || d.email.excerpt || ''}
SUGGESTED ACTION: ${JSON.stringify(d.suggestion.action)}
DRAFT TEXT: ${d.suggestion.text || '(no drafted message — non-message action)'}
WHY: ${d.suggestion.why}
MEMORY_BRIEF: ${JSON.stringify(d.suggestion.memory_brief)}
Return a verdict via the enforced schema: lens, refuted (bool), severity (none|minor|major), issue = ONE specific sentence naming the concrete flaw, or "survives: <one-line reason>" if not refuted.`
}

const LENSES = ['faithfulness', 'ownership-and-facts', 'voice-and-etiquette']
let parsed = args
if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { parsed = [] } }
// args may be a bare items array (legacy) or { today, items } — the caller supplies the live date.
let items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : [])
const TODAY = (parsed && !Array.isArray(parsed) && parsed.today) || (items[0] && items[0].today) || ''
log(`triage: ${items.length} captured threads (today: ${TODAY || 'unset'})`)

const out = await pipeline(items,
  // Stage 1 — tier + draft
  async (it) => {
    const tier = routeTier(it)
    if (tier === 0) { log(`#${it.slug}: T0 templated`); return { email: it.email, thread: it.thread, tier, ...t0Card(it) } }
    const r = await agent(draftPrompt(it, tier, TODAY), { label: `draft:${it.slug} (T${tier})`, phase: 'Draft', schema: SUGGESTION_SCHEMA })
    if (!r) return { email: it.email, thread: it.thread, tier, suggestion: null, verdict: null }
    return { email: it.email, thread: it.thread, body: it.body, slug: it.slug, tier, suggestion: r.suggestion, self_check: r.self_check, verdict: null }
  },
  // Stage 2 — adversarial verify (T2 only): 3 diverse lenses, majority refute = flagged
  async (d) => {
    if (!d || d.tier !== 2 || !d.suggestion) return d
    const verdicts = (await parallel(LENSES.map((lens) => () =>
      agent(verifyPrompt(d, lens), { label: `verify:${d.slug}:${lens}`, phase: 'Verify', schema: VERDICT_SCHEMA })))).filter(Boolean)
    const refuted = verdicts.filter((v) => v.refuted && v.severity !== 'none')
    return { ...d, verdict: { flagged: refuted.length >= 2, refuted_count: refuted.length, verdicts } }
  },
)

return out.filter(Boolean)
