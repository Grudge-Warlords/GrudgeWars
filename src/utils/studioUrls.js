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

// Gruda Wars — 2D war-room client (sibling Vercel project, same repo/build)
export const GRUDA_WARS_URL = 'https://gruda-wars.vercel.app';

// Grudge Wars API — backend for asset resolution, game data, accounts
export const GRUDGE_API_URL = window.location.origin.includes('localhost')
  ? '' // Same origin in dev
  : 'https://api.grudge-studio.com';

/**
 * Open a Grudge Builder page.
 * Cross-app SSO is handled by id.grudge-studio.com — no token in URL.
 */
export function openBuilder(path = '/', { newTab = false } = {}) {
  const url = new URL(path, BUILDER_URL);
  if (newTab) {
    window.open(url.toString(), '_blank', 'noopener noreferrer');
  } else {
    window.location.href = url.toString();
  }
}
