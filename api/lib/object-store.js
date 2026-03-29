/**
 * ObjectStore — Grudge Studio Unified Game Data Layer
 * Fetches JSON datasets from GitHub Pages (primary) or S3 bucket (fallback),
 * caches in-memory (5-min TTL), and provides standardised Puter KV keys for
 * client-side caching.
 *
 * Resolution order: Memory cache → S3 (exports/) → GitHub Pages → Stale cache
 */

import * as S3 from './s3.js';

const OBJECT_STORE_BASE = 'https://molochdagod.github.io/ObjectStore';

// Every published dataset in ObjectStore
export const DATASETS = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'professions', 'spriteMaps', 'classes', 'races',
  'factions', 'attributes', 'enemies', 'bosses', 'sprites',
  'ai', 'animations', 'controllers', 'ecs', 'factionUnits',
  'nodeUpgrades', 'rendering', 'terrain', 'tileMaps', 'models',
];


// ── In-memory TTL cache ─────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchDataset(name) {
  if (!DATASETS.includes(name)) return null;

  const cached = cache.get(name);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // 1. Try S3 bucket first (faster if migrated)
  if (S3.isConfigured()) {
    try {
      const s3Key = `exports/v1/${name}.json`;
      const resp = await S3.download(s3Key);
      const text = await resp.Body.transformToString();
      const data = JSON.parse(text);
      cache.set(name, { data, ts: Date.now(), source: 's3' });
      return data;
    } catch {
      // S3 miss — fall through to GitHub Pages
    }
  }

  // 2. GitHub Pages (original source)
  const url = `${OBJECT_STORE_BASE}/api/v1/${name}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} for ${name}`);
    const data = await res.json();
    cache.set(name, { data, ts: Date.now(), source: 'github' });
    return data;
  } catch (err) {
    // 3. Stale cache fallback
    if (cached) return cached.data;
    throw err;
  }
}

/** Resolve a binary asset URL — returns S3 presigned URL or GitHub Pages URL.
 *  Checks S3 first, then validates the GitHub Pages URL exists (HEAD request).
 *  Throws if the asset is not found in either location.
 */
export async function resolveAssetUrl(assetPath) {
  // Normalise slashes
  const cleanPath = assetPath.replace(/^\/+/, '');

  // 1. Try S3/R2 bucket first (fastest for migrated assets)
  if (S3.isConfigured()) {
    // Try multiple key patterns (direct path + models/ prefix)
    const keysToTry = [cleanPath];
    if (!cleanPath.startsWith('models/')) keysToTry.push(`models/${cleanPath}`);
    for (const key of keysToTry) {
      try {
        await S3.head(key);
        return await S3.presignedDownloadUrl(key);
      } catch { /* not at this key */ }
    }
  }

  // 2. If requesting OBJ/FBX/DAE, try GLTF/GLB equivalents first (smaller, faster)
  const ext = cleanPath.match(/\.(obj|fbx|dae)$/i)?.[1]?.toLowerCase();
  if (ext) {
    const stem = cleanPath.replace(/\.(obj|fbx|dae)$/i, '');
    // Try common GLB naming patterns: .glb, .gltf.glb, .gltf
    const altPaths = [`${stem}.glb`, `${stem}.gltf.glb`, `${stem}.gltf`];
    for (const altPath of altPaths) {
      const altUrl = `${OBJECT_STORE_BASE}/${altPath}`;
      try {
        const altHead = await fetch(altUrl, { method: 'HEAD' });
        if (altHead.ok) return altUrl;
      } catch { /* try next */ }
    }
  }

  // 3. Check GitHub Pages for the original path
  const ghUrl = `${OBJECT_STORE_BASE}/${cleanPath}`;
  try {
    const headRes = await fetch(ghUrl, { method: 'HEAD' });
    if (headRes.ok) return ghUrl;
  } catch { /* GitHub Pages unreachable */ }

  // 4. Nothing found — throw so callers can handle gracefully
  throw new Error(`Asset not found: ${cleanPath} (checked S3 and GitHub Pages)`);
}

// ── Cross-resource search ───────────────────────────────────────────────────
const SEARCHABLE = [
  'weapons', 'equipment', 'armor', 'materials', 'consumables',
  'skills', 'enemies', 'bosses', 'classes', 'races', 'factions',
];

export async function searchAll(query, opts = {}) {
  const q = query.toLowerCase();
  const typeFilter = opts.type;
  const limit = Math.min(parseInt(opts.limit) || 50, 200);
  const results = [];

  const targets = typeFilter ? [typeFilter] : SEARCHABLE;

  for (const ds of targets) {
    try {
      const data = await fetchDataset(ds);
      if (!data) continue;
      const items = extractItems(data);
      for (const item of items) {
        const hay = JSON.stringify(item).toLowerCase();
        if (hay.includes(q)) {
          results.push({ source: ds, item, relevance: hay.split(q).length - 1 });
        }
        if (results.length >= limit) break;
      }
    } catch { /* skip broken dataset */ }
    if (results.length >= limit) break;
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

function extractItems(data) {
  if (data.categories) {
    return Object.values(data.categories).flatMap(c =>
      Array.isArray(c.items) ? c.items : Array.isArray(c) ? c : [c]
    );
  }
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') return Object.values(data).filter(v => v && typeof v === 'object');
  return [];
}

// ── Puter KV key convention ─────────────────────────────────────────────────
// Clients cache datasets in Puter KV under these standardised keys.
// e.g. puter.kv.set('grudge:objectstore:weapons', data)
export function puterKvKey(dataset) {
  return `grudge:objectstore:${dataset}`;
}

/** Build the full Puter KV manifest clients use for bootstrapping */
export function puterKvManifest() {
  return DATASETS.map(ds => ({
    dataset: ds,
    kvKey: puterKvKey(ds),
    sourceUrl: `${OBJECT_STORE_BASE}/api/v1/${ds}.json`,
    cacheTtlMs: CACHE_TTL,
  }));
}

// ── Cache stats ─────────────────────────────────────────────────────────────
export function getCacheStats() {
  const entries = {};
  for (const [key, val] of cache) {
    entries[key] = { ageSec: Math.round((Date.now() - val.ts) / 1000), stale: Date.now() - val.ts > CACHE_TTL };
  }
  return { totalDatasets: DATASETS.length, cachedCount: cache.size, entries };
}

export function clearCache() { cache.clear(); }
