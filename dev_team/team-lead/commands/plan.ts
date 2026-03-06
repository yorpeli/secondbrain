/**
 * Dev Team Lead — Plan Command
 *
 * Gathers context about the current app state and produces a structured
 * feature plan. The plan document is stored in agent_log for traceability.
 *
 * This command gathers data and produces a structured template.
 * The actual planning intelligence comes from Claude Code reading
 * the architect definition and filling in the plan.
 */

import type { PlanResult, FeaturePlan, ComponentSpec, DataLayerSpec, PlanStep } from '../lib/types.js'

interface PlanOptions {
  feature: string
}

async function getSupabase() {
  const { getSupabase: gs } = await import('../../../lib/supabase.js')
  return gs()
}

export async function run(options: PlanOptions): Promise<PlanResult> {
  const { feature } = options

  // Generate a slug-like ref from the feature name
  const ref = feature
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-v1'

  // Gather existing app context
  const appState = await gatherAppState()

  // Gather active plans to avoid conflicts
  const activePlans = await getActivePlans()

  // Build the plan structure (template — Claude fills in the details)
  const plan: FeaturePlan = {
    ref,
    feature,
    overview: `Implementation plan for: ${feature}`,
    routes: [],
    components: [],
    dataLayer: [],
    designNotes: '',
    buildSequence: [],
    status: 'proposed',
  }

  // Store the plan in agent_log
  const { logAgent } = await import('../../../lib/logging.js')
  await logAgent({
    agentSlug: 'dev-team-lead',
    category: 'decision',
    summary: `Plan proposed: ${feature} (${ref})`,
    details: {
      plan,
      appState,
      activePlans: activePlans.map(p => p.ref),
    },
    tags: ['dev-team', 'dev-plan', ref],
  })

  const conflictWarning = activePlans.length > 0
    ? `\n\nNote: ${activePlans.length} active plan(s) exist: ${activePlans.map(p => p.ref).join(', ')}. Check for conflicts.`
    : ''

  return {
    summary: `Plan "${ref}" proposed for feature: ${feature}.\n`
      + `App state: ${appState.existingPages.length} pages, ${appState.existingHooks.length} hooks, ${appState.existingComponents.length} components.`
      + conflictWarning
      + `\n\nThe plan template is ready. Fill in components, data layer, and build sequence, then run 'delegate --plan=${ref}'.`,
    plan,
  }
}

// ── Context Gathering ────────────────────────────────────────

interface AppState {
  existingPages: string[]
  existingHooks: string[]
  existingComponents: string[]
  existingRoutes: string[]
}

async function gatherAppState(): Promise<AppState> {
  // Scan the app directory for existing code
  // This is a best-effort scan — the app may not exist yet
  const state: AppState = {
    existingPages: [],
    existingHooks: [],
    existingComponents: [],
    existingRoutes: [],
  }

  try {
    const { readdirSync } = await import('fs')
    const { join } = await import('path')

    const appSrc = join(process.cwd(), 'app', 'src')

    // Check if app exists
    try {
      readdirSync(appSrc)
    } catch {
      return state // App not scaffolded yet
    }

    // Scan pages
    try {
      const pagesDir = join(appSrc, 'pages')
      state.existingPages = readdirSync(pagesDir).filter(f => f.endsWith('.tsx'))
    } catch {}

    // Scan hooks
    try {
      const hooksDir = join(appSrc, 'hooks')
      state.existingHooks = readdirSync(hooksDir).filter(f => f.endsWith('.ts'))
    } catch {}

    // Scan components (non-ui, non-layout)
    try {
      const componentsDir = join(appSrc, 'components')
      const subdirs = readdirSync(componentsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== 'ui' && d.name !== 'layout')
      for (const dir of subdirs) {
        const files = readdirSync(join(componentsDir, dir.name)).filter(f => f.endsWith('.tsx'))
        state.existingComponents.push(...files.map(f => `${dir.name}/${f}`))
      }
    } catch {}
  } catch {
    // fs not available or app doesn't exist — that's fine
  }

  return state
}

async function getActivePlans(): Promise<Array<{ ref: string; feature: string }>> {
  try {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('agent_log')
      .select('details')
      .eq('agent_slug', 'dev-team-lead')
      .eq('category', 'decision')
      .contains('tags', ['dev-plan'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (!data) return []

    return (data as any[])
      .filter(row => row.details?.plan?.status && row.details.plan.status !== 'completed')
      .map(row => ({
        ref: row.details.plan.ref,
        feature: row.details.plan.feature,
      }))
  } catch {
    return []
  }
}
