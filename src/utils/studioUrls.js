/**
 * Centralized URLs for all Grudge Studio cross-app links.
 * Update these when custom domains are mapped.
 */

// Grudge Builder — canonical app for character creation, islands, home, roster
export const BUILDER_URL = 'https://grudge-builder.vercel.app';

// Crafting Suite
export const CRAFTING_SUITE_URL = 'https://warlord-crafting-suite.vercel.app';

// Object Store (static CDN)
export const OBJECT_STORE_URL = 'https://molochdagod.github.io/ObjectStore/';

// Grudge Wars API — backend for asset resolution, game data, accounts
export const GRUDGE_API_URL = window.location.origin.includes('localhost')
  ? '' // Same origin in dev
  : 'https://grudgewarlords.com';

/**
 * Resolve an asset path through the Grudge backend (S3 → GitHub fallback).
 * Use this for 3D models, audio, and other binary assets that may live in S3.
 *
 * @param {string} assetPath — relative path, e.g. "KayKit_ResourceBits_1.0_FREE/Assets/obj/Silver_Bars.obj"
 * @returns {Promise<string>} Resolved URL
 */
const _assetCache = new Map();
export async function resolveAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (assetPath.startsWith('http')) return assetPath;

  const cached = _assetCache.get(assetPath);
  if (cached && Date.now() - cached.ts < 3600000) return cached.url;

  try {
    const res = await fetch(`${GRUDGE_API_URL}/api/studio/resolve-asset?path=${encodeURIComponent(assetPath)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        _assetCache.set(assetPath, { url: data.url, ts: Date.now() });
        return data.url;
      }
    }
  } catch { /* backend unreachable */ }

  // Fallback to direct GitHub Pages
  const fallback = `${OBJECT_STORE_URL}${assetPath}`;
  _assetCache.set(assetPath, { url: fallback, ts: Date.now() });
  return fallback;
}

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
