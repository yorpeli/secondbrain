/**
 * Query Builder
 *
 * Builds Looker queries from Look configs with custom filter overrides.
 * Ported from Looker2/lib/query-builder.js.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEW_PREFIX } from '../config/constants.js';
import type { LookerQueryBody, LookerLookConfig, CountryTiers } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANALYTICS_ROOT = join(__dirname, '..');

// ─── JSON Loaders ─────────────────────────────────────────────

const configCache = new Map<string, LookerLookConfig>();
const knowledgeCache = new Map<string, unknown>();

export function loadLookConfig(lookId: string | number): LookerLookConfig {
  const key = String(lookId);
  if (configCache.has(key)) return configCache.get(key)!;

  const configPath = join(ANALYTICS_ROOT, 'looks', key, 'config.json');
  if (!existsSync(configPath)) {
    throw new Error(`Look config not found: ${configPath}`);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as LookerLookConfig;
  configCache.set(key, config);
  return config;
}

export function loadKnowledge<T = unknown>(name: string): T {
  if (knowledgeCache.has(name)) return knowledgeCache.get(name) as T;

  const knowledgePath = join(ANALYTICS_ROOT, 'knowledge', `${name}.json`);
  if (!existsSync(knowledgePath)) {
    throw new Error(`Knowledge file not found: ${knowledgePath}`);
  }

  const data = JSON.parse(readFileSync(knowledgePath, 'utf8'));
  knowledgeCache.set(name, data);
  return data as T;
}

// ─── Field Helpers ────────────────────────────────────────────

/**
 * Add view prefix to field name if not already present.
 */
export function prefixField(field: string): string {
  if (field.includes('.')) return field;
  return `${VIEW_PREFIX}.${field}`;
}

// ─── Query Building ───────────────────────────────────────────

interface QueryWithMetadata {
  query: LookerQueryBody;
  metadata: {
    look_id: string;
    look_name: string;
    template_name: string;
    template_description?: string;
    filters_used: Record<string, string>;
    filter_overrides_applied: Record<string, string>;
    built_at: string;
  };
}

/**
 * Build a query from a Look config and template.
 */
export function buildQueryFromTemplate(
  lookId: string | number,
  templateName: string,
  filterOverrides: Record<string, string> = {},
): QueryWithMetadata {
  const config = loadLookConfig(lookId);
  const template = config.query_templates?.[templateName];

  if (!template) {
    throw new Error(`Template '${templateName}' not found in Look ${lookId}`);
  }

  const filters: Record<string, string> = {};

  if (template.filters) {
    for (const [key, value] of Object.entries(template.filters)) {
      filters[prefixField(key)] = value;
    }
  }

  for (const [key, value] of Object.entries(filterOverrides)) {
    filters[prefixField(key)] = value;
  }

  const queryBody: LookerQueryBody = {
    model: config.model,
    view: config.view,
    fields: template.fields || [],
    filters,
    sorts: template.sorts || [],
    limit: template.limit || '500',
  };

  return {
    query: queryBody,
    metadata: {
      look_id: String(lookId),
      look_name: config.name,
      template_name: templateName,
      template_description: template.description,
      filters_used: filters,
      filter_overrides_applied: filterOverrides,
      built_at: new Date().toISOString(),
    },
  };
}

/**
 * Build a custom query for a Look.
 */
export function buildCustomQuery(
  lookId: string | number,
  options: {
    fields?: string[];
    filters?: Record<string, string>;
    sorts?: string[];
    limit?: string;
  } = {},
): QueryWithMetadata {
  const config = loadLookConfig(lookId);

  const filters: Record<string, string> = {};
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      filters[prefixField(key)] = value;
    }
  }

  const fields = (options.fields || []).map(prefixField);

  const queryBody: LookerQueryBody = {
    model: config.model,
    view: config.view,
    fields,
    filters,
    sorts: options.sorts || [],
    limit: options.limit || '500',
  };

  return {
    query: queryBody,
    metadata: {
      look_id: String(lookId),
      look_name: config.name,
      template_name: 'custom',
      filters_used: filters,
      filter_overrides_applied: {},
      built_at: new Date().toISOString(),
    },
  };
}

/**
 * Get default filters for a Look.
 */
export function getDefaultFilters(lookId: string | number): Record<string, string> {
  const config = loadLookConfig(lookId);
  const defaults: Record<string, string> = {};

  if (config.filters?.required) {
    for (const def of Object.values(config.filters.required)) {
      defaults[def.field] = def.value;
    }
  }

  if (config.filters?.recommended_defaults) {
    for (const def of Object.values(config.filters.recommended_defaults)) {
      defaults[def.field] = def.value;
    }
  }

  return defaults;
}

// ─── Country Helpers ──────────────────────────────────────────

/**
 * Get country name in Looker format.
 */
export function getLookerCountryName(countryInput: string): string {
  const tiers = loadKnowledge<CountryTiers>('country-tiers');

  // Check if already a valid Looker name
  for (const tier of Object.values(tiers.tiers)) {
    if (tier.countries_looker_names?.includes(countryInput)) {
      return countryInput;
    }
  }

  // Try to find mapping
  for (const tier of Object.values(tiers.tiers)) {
    if (!tier.countries || !Array.isArray(tier.countries) || !tier.countries_looker_names) continue;

    const idx = tier.countries.findIndex(
      (c: string) => c.toLowerCase() === countryInput.toLowerCase(),
    );
    if (idx >= 0 && tier.countries_looker_names[idx]) {
      return tier.countries_looker_names[idx];
    }
  }

  return countryInput;
}

/**
 * Get tier info for a country.
 */
export function getCountryTier(countryName: string): {
  tier: string;
  name: string;
  baseline: number;
  target: number;
} {
  const tiers = loadKnowledge<CountryTiers>('country-tiers');
  const lookerName = getLookerCountryName(countryName);

  for (const [tierKey, tier] of Object.entries(tiers.tiers)) {
    if (tier.countries_looker_names?.includes(lookerName)) {
      return {
        tier: tierKey,
        name: tier.name,
        baseline: tier.baseline,
        target: tier.target,
      };
    }
  }

  const tier3 = tiers.tiers.tier3;
  return {
    tier: 'tier3',
    name: tier3.name,
    baseline: tier3.baseline,
    target: tier3.target,
  };
}
