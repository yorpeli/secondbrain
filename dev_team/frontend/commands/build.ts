/**
 * Dev Frontend Engineer — Build Command
 *
 * Implements a React component or page from a task specification.
 * This command gathers context about what needs to be built.
 * The actual implementation is done by Claude Code using this context.
 */

import type { BuildResult } from '../lib/types.js'

interface BuildOptions {
  component: string
  spec: string
  planRef?: string
  dependencies?: string[]
}

export async function run(options: BuildOptions): Promise<BuildResult> {
  const { component, spec, planRef, dependencies } = options

  // This is a scaffold — the actual file creation happens when
  // Claude Code executes the task with full context.
  // The command's job is to:
  // 1. Validate the spec
  // 2. Check dependencies are met
  // 3. Report what was done

  return {
    summary: `Frontend build task received: ${component}.\n`
      + `Spec: ${spec || 'none provided'}\n`
      + `Plan: ${planRef || 'standalone'}\n`
      + `Dependencies: ${dependencies?.join(', ') || 'none'}\n`
      + `\nReady for implementation by Claude Code.`,
    filesCreated: [],
    filesModified: [],
    component,
    status: 'partial',
  }
}
