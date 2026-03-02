/**
 * AB Testing Agent — Experiment Store
 *
 * Read/write experiments.json — the agent's local experiment registry.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AnalysisHistoryEntry, Experiment, ExperimentRegistry } from './types.js'

const STORE_PATH = join(import.meta.dirname, '..', 'experiments.json')

const EMPTY_REGISTRY: ExperimentRegistry = {
  version: 1,
  updated_at: new Date().toISOString(),
  experiments: [],
}

/**
 * Load the experiment registry from disk. Returns empty registry if file doesn't exist.
 */
export async function loadRegistry(): Promise<ExperimentRegistry> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8')
    return JSON.parse(raw) as ExperimentRegistry
  } catch {
    return { ...EMPTY_REGISTRY, updated_at: new Date().toISOString() }
  }
}

/**
 * Save the experiment registry to disk.
 */
export async function saveRegistry(registry: ExperimentRegistry): Promise<void> {
  registry.updated_at = new Date().toISOString()
  await writeFile(STORE_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8')
}

/**
 * Get a single experiment by slug.
 */
export async function getExperiment(slug: string): Promise<Experiment | null> {
  const registry = await loadRegistry()
  return registry.experiments.find(e => e.slug === slug) ?? null
}

/**
 * Get a single experiment by EXPID (e.g. "EXPID-165").
 */
export async function getExperimentByExpId(expid: string): Promise<Experiment | null> {
  const registry = await loadRegistry()
  const normalized = expid.toUpperCase()
  return registry.experiments.find(e => e.expid.toUpperCase() === normalized) ?? null
}

/**
 * Append an analysis history entry to an experiment.
 */
export async function appendAnalysis(slug: string, entry: AnalysisHistoryEntry): Promise<boolean> {
  const registry = await loadRegistry()
  const experiment = registry.experiments.find(e => e.slug === slug)
  if (!experiment) return false

  experiment.analysis_history.push(entry)
  await saveRegistry(registry)
  return true
}

/**
 * Partially update an experiment's fields.
 */
export async function updateExperiment(slug: string, partial: Partial<Experiment>): Promise<boolean> {
  const registry = await loadRegistry()
  const idx = registry.experiments.findIndex(e => e.slug === slug)
  if (idx === -1) return false

  registry.experiments[idx] = { ...registry.experiments[idx], ...partial }
  await saveRegistry(registry)
  return true
}
