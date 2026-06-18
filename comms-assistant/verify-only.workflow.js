export const meta = {
  name: 'comms-verify-only',
  description: 'Run the 3 diverse-lens adversarial verifiers against a pre-supplied suggestion (no re-draft)',
  phases: [{ title: 'Verify', detail: 'three diverse-lens adversarial verifiers' }],
}

const REPO = '/Users/yorpeli/Documents/Dev/SecondBrain'

const VERDICT_SCHEMA = {
  type: 'object', required: ['lens', 'refuted', 'severity', 'issue'],
  properties: {
    lens: { type: 'string' }, refuted: { type: 'boolean' },
    severity: { enum: ['none', 'minor', 'major'] }, issue: { type: 'string' },
  },
}

const LENS_GUIDE = {
  faithfulness: 'Does the draft answer what the thread ACTUALLY asked, or a strawman / a point nobody raised? Does it miss the real ask?',
  'ownership-and-facts': 'Every name, owner, number, location in the draft + memory_brief — does it trace to the thread or a verifiable fact? Flag anything invented or contradicted (wrong owner, wrong domain, wrong office). You MAY run context:assemble (write /tmp/tv-<slug>.json) to check ownership.',
  'voice-and-etiquette': 'Does a route/redirect publicly instruct someone in front of an audience? Accusatory/defensive tone? A stale-date confirm? A thread waiting ~1wk+ with NO delay-acknowledgment? Does it visibly contradict the sender\'s own prior commitment in the thread?',
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
let d = args
if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = {} } }
log(`verify-only: ${d.slug}`)
const verdicts = (await parallel(LENSES.map((lens) => () =>
  agent(verifyPrompt(d, lens), { label: `verify:${d.slug}:${lens}`, phase: 'Verify', schema: VERDICT_SCHEMA })))).filter(Boolean)
const refuted = verdicts.filter((v) => v.refuted && v.severity !== 'none')
return { slug: d.slug, verdict: { flagged: refuted.length >= 2, refuted_count: refuted.length, verdicts } }
