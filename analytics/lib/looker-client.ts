/**
 * Looker API Client
 *
 * Ported from Looker2/lib/looker-client.js to TypeScript.
 * Uses native fetch (Node 18+), adds retry with backoff, timeout, and typed errors.
 */

import { LookerApiError, type LookerQueryBody, type LookerQueryResult } from './types.js';

// ─── Config ───────────────────────────────────────────────────

interface LookerConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

let config: LookerConfig | null = null;

function getConfig(): LookerConfig {
  if (!config) {
    const baseUrl = process.env.LOOKER_BASE_URL;
    const clientId = process.env.LOOKER_CLIENT_ID;
    const clientSecret = process.env.LOOKER_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
      throw new Error(
        'Missing Looker credentials. Set LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET in .env',
      );
    }

    config = { baseUrl, clientId, clientSecret };
  }
  return config;
}

// ─── Token Cache ──────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

function clearToken() {
  cachedToken = null;
  tokenExpiry = null;
}

// ─── Fetch with Retry ─────────────────────────────────────────

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;
const RETRYABLE_STATUSES = [429, 502, 503];

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (response.ok) return response;

      // 401 → clear token and retry once (re-auth will happen on next call)
      if (response.status === 401 && attempt === 0) {
        clearToken();
        continue;
      }

      // Retryable status codes → exponential backoff
      if (RETRYABLE_STATUSES.includes(response.status) && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error
      const body = await response.text().catch(() => '');
      throw new LookerApiError(
        `HTTP ${response.status}: ${body.slice(0, 200)}`,
        response.status,
        url,
        body,
      );
    } catch (err) {
      if (err instanceof LookerApiError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < retries) continue;
        throw new LookerApiError('Request timed out', 0, url);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new LookerApiError('Max retries exceeded', 0, url);
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Authenticate with Looker API. Returns an access token.
 * Caches the token until it expires (with 5min buffer).
 */
export async function authenticate(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300_000) {
    return cachedToken;
  }

  const cfg = getConfig();
  const postData = `client_id=${encodeURIComponent(cfg.clientId)}&client_secret=${encodeURIComponent(cfg.clientSecret)}`;

  const response = await fetchWithRetry(
    `https://${cfg.baseUrl}/api/4.0/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    },
  );

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

/**
 * Get a Look's details including query information.
 */
export async function getLook(lookId: string | number): Promise<Record<string, unknown>> {
  const cfg = getConfig();
  const token = await authenticate();

  const response = await fetchWithRetry(
    `https://${cfg.baseUrl}/api/4.0/looks/${lookId}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.json() as Promise<Record<string, unknown>>;
}

/**
 * Run a saved Look with its original filters.
 */
export async function runLook(lookId: string | number, format = 'json'): Promise<unknown> {
  const cfg = getConfig();
  const token = await authenticate();

  const response = await fetchWithRetry(
    `https://${cfg.baseUrl}/api/4.0/looks/${lookId}/run/${format}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.json();
}

/**
 * Create a new query with custom parameters.
 */
export async function createQuery(queryBody: LookerQueryBody): Promise<{ id: number; slug: string }> {
  const cfg = getConfig();
  const token = await authenticate();

  const response = await fetchWithRetry(
    `https://${cfg.baseUrl}/api/4.0/queries`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryBody),
    },
  );

  return response.json() as Promise<{ id: number; slug: string }>;
}

/**
 * Run a query by ID and return results.
 */
export async function runQuery(queryId: number, format = 'json'): Promise<unknown> {
  const cfg = getConfig();
  const token = await authenticate();

  const response = await fetchWithRetry(
    `https://${cfg.baseUrl}/api/4.0/queries/${queryId}/run/${format}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.json();
}

/**
 * Create and run a query in one step.
 * Returns both the query metadata and results.
 */
export async function createAndRunQuery(
  queryBody: LookerQueryBody,
  format = 'json',
): Promise<LookerQueryResult> {
  const query = await createQuery(queryBody);
  const results = (await runQuery(query.id, format)) as Record<string, unknown>[];

  return {
    query_id: query.id,
    query_slug: query.slug,
    results,
  };
}
