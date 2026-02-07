/**
 * Hub Countries PM — Country Configuration
 *
 * Static definitions for the 4 incorporation hub countries.
 * Maps between PPP tags, Looker names, and display names.
 */

export interface HubCountry {
  name: string               // Display name: "United Kingdom"
  code: string               // Short code: "UK"
  lookerName: string          // Looker filter value: "United Kingdom"
  pppTags: string[]           // PPP section tags: ["uk"]
  logTags: string[]           // agent_log tags: ["uk", "united-kingdom"]
  hubType: 'incorporation'    // All 4 are incorporation hubs
  teamSlug: string            // "localization-licensing"
}

export const HUB_COUNTRIES: HubCountry[] = [
  {
    name: 'United Kingdom',
    code: 'UK',
    lookerName: 'United Kingdom',
    pppTags: ['uk'],
    logTags: ['uk', 'united-kingdom'],
    hubType: 'incorporation',
    teamSlug: 'localization-licensing',
  },
  {
    name: 'United States',
    code: 'US',
    lookerName: 'United States of America',
    pppTags: ['usa'],
    logTags: ['usa', 'us', 'united-states'],
    hubType: 'incorporation',
    teamSlug: 'localization-licensing',
  },
  {
    name: 'Singapore',
    code: 'SG',
    lookerName: 'Singapore',
    pppTags: ['singapore'],
    logTags: ['singapore'],
    hubType: 'incorporation',
    teamSlug: 'localization-licensing',
  },
  {
    name: 'United Arab Emirates',
    code: 'UAE',
    lookerName: 'United Arab Emirates',
    pppTags: ['uae'],
    logTags: ['uae', 'united-arab-emirates'],
    hubType: 'incorporation',
    teamSlug: 'localization-licensing',
  },
]

export const ALL_PPP_TAGS = HUB_COUNTRIES.flatMap(c => c.pppTags)
export const ALL_LOG_TAGS = HUB_COUNTRIES.flatMap(c => c.logTags)

/**
 * Resolve a country input (name, code, or Looker name) to a HubCountry.
 * Case-insensitive fuzzy match.
 */
export function resolveCountry(input: string): HubCountry | null {
  const lower = input.toLowerCase().trim()

  for (const country of HUB_COUNTRIES) {
    if (
      country.code.toLowerCase() === lower ||
      country.name.toLowerCase() === lower ||
      country.lookerName.toLowerCase() === lower ||
      country.pppTags.some(t => t === lower) ||
      country.logTags.some(t => t === lower)
    ) {
      return country
    }
  }

  return null
}
