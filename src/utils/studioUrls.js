/**
 * Centralized URLs for all Grudge Studio cross-app links.
 * Update these when custom domains are mapped.
 */

// Grudge Builder — canonical app for character creation, islands, home, roster
export const BUILDER_URL = 'https://grudge-builder.vercel.app';

// Crafting Suite
export const CRAFTING_SUITE_URL = 'https://warlord-crafting-suite.vercel.app';

// Object Store (static CDN) — no trailing slash
export const OBJECT_STORE_URL = 'https://molochdagod.github.io/ObjectStore';

// Grudge Wars API — backend for asset resolution, game data, accounts
export const GRUDGE_API_URL = window.location.origin.includes('localhost')
  ? '' // Same origin in dev
  : 'https://grudgewarlords.com';

/**
 * Open a Grudge Builder page, optionally forwarding the current session token
 * so the user stays logged in across apps.
 */
export function openBuilder(path = '/', { newTab = false } = {}) {
  const url = new URL(path, BUILDER_URL);

  // Forward session token for cross-domain SSO
  const token = localStorage.getItem('grudge_session_token');
  if (token) {
    url.searchParams.set('sso_token', token);
  }

  if (newTab) {
    window.open(url.toString(), '_blank', 'noopener');
  } else {
    window.location.href = url.toString();
  }
}
