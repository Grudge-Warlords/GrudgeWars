/**
 * Grudge Production — Cloudflare Worker
 * Routes: grudgeplatform.io/*, www.grudgeplatform.io/*
 *
 * Bindings (from wrangler.toml):
 *   ASSETS        — R2 bucket (grudge-assets)
 *   CACHE         — KV namespace (edge cache: leaderboard, arena stats)
 *   RATE_LIMIT    — KV namespace (per-IP rate limiting)
 *   OBJECTSTORE_DB — D1 database (grudge-objectstore metadata)
 *   AI            — Workers AI binding
 *
 * Env vars:
 *   VPS_API_URL   — https://api.grudge-studio.com
 *   ASSETS_CDN_URL — https://assets.grudge-studio.com
 *   OBJECTSTORE_URL — https://objectstore.grudge-studio.com
 *   BACKEND_API_KEY — wrangler secret (auth for VPS proxied requests)
 *
 * Auth: This worker NEVER handles auth directly.
 *       All auth flows go through id.grudge-studio.com.
 */

// ── CORS headers for Grudge origins ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://grudgeplatform.io',
  'https://www.grudgeplatform.io',
  'https://grudge-studio.com',
  'https://grudge-platform.vercel.app',
  'https://gdevelop-assistant.vercel.app',
  'https://warlord-crafting-suite.vercel.app',
  'https://grim-armada-web.vercel.app',
  'https://molochdagod.github.io',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || origin.endsWith('.vercel.app')
    || origin.endsWith('.puter.site')
    || origin.endsWith('.puter.com');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// ── Rate limiter (per IP, via KV) ────────────────────────────────────────────
async function checkRateLimit(env, ip, path, maxPerMin = 60) {
  const key = `rl:${ip}:${path.split('/')[1] || 'root'}`;
  const existing = await env.RATE_LIMIT.get(key, { type: 'json' });
  const now = Date.now();

  if (!existing || now > existing.resetAt) {
    await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt: now + 60000 }), { expirationTtl: 120 });
    return null; // allowed
  }

  if (existing.count >= maxPerMin) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((existing.resetAt - now) / 1000)) },
    });
  }

  existing.count++;
  await env.RATE_LIMIT.put(key, JSON.stringify(existing), { expirationTtl: 120 });
  return null;
}

// ── R2 asset serving ─────────────────────────────────────────────────────────
async function handleAssetRequest(env, key) {
  const object = await env.ASSETS.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
}

// ── D1 objectstore queries ───────────────────────────────────────────────────
async function handleObjectstoreQuery(env, request, url) {
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('q');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  let stmt;
  if (search) {
    stmt = env.OBJECTSTORE_DB.prepare(
      'SELECT * FROM assets WHERE name LIKE ? LIMIT ?'
    ).bind(`%${search}%`, limit);
  } else if (category) {
    stmt = env.OBJECTSTORE_DB.prepare(
      'SELECT * FROM assets WHERE category = ? LIMIT ?'
    ).bind(category, limit);
  } else {
    stmt = env.OBJECTSTORE_DB.prepare(
      'SELECT * FROM assets LIMIT ?'
    ).bind(limit);
  }

  const { results } = await stmt.all();
  return new Response(JSON.stringify({ assets: results, count: results.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── KV-cached proxy to VPS backend ───────────────────────────────────────────
async function cachedProxyToBackend(env, backendPath, cacheTtlSec = 60) {
  const cacheKey = `api:${backendPath}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (env.BACKEND_API_KEY) {
    headers['X-Api-Key'] = env.BACKEND_API_KEY;
  }

  const upstream = await fetch(`${env.VPS_API_URL}${backendPath}`, { headers });
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'Backend error', status: upstream.status }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await upstream.text();
  await env.CACHE.put(cacheKey, body, { expirationTtl: cacheTtlSec });

  return new Response(body, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
}

// ── Main router ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = corsHeaders(request);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Health
    if (path === '/health' || path === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'grudgeproduction-worker',
        environment: env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

      // ── R2 Assets: /assets/* ──
      if (path.startsWith('/assets/')) {
        const key = path.slice(8); // strip /assets/
        if (!key) return new Response('Not found', { status: 404 });
        const resp = await handleAssetRequest(env, key);
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      // ── ObjectStore D1: /api/objectstore ──
      if (path === '/api/objectstore' && request.method === 'GET') {
        const rateLimited = await checkRateLimit(env, ip, path, 120);
        if (rateLimited) return rateLimited;
        const resp = await handleObjectstoreQuery(env, request, url);
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      // ── Cached public game data: /api/leaderboard, /api/arena/stats ──
      if (path === '/api/leaderboard' && request.method === 'GET') {
        const rateLimited = await checkRateLimit(env, ip, path, 30);
        if (rateLimited) return rateLimited;
        const resp = await cachedProxyToBackend(env, '/api/leaderboard', 60);
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      if (path === '/api/arena/stats' && request.method === 'GET') {
        const rateLimited = await checkRateLimit(env, ip, path, 30);
        if (rateLimited) return rateLimited;
        const resp = await cachedProxyToBackend(env, '/api/arena/stats', 120);
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      // ── Workers AI: /api/ai/* ──
      if (path.startsWith('/api/ai/') && request.method === 'POST') {
        const rateLimited = await checkRateLimit(env, ip, path, 10);
        if (rateLimited) return rateLimited;

        const body = await request.json();
        const model = body.model || '@cf/meta/llama-3.1-8b-instruct';
        const messages = body.messages || [{ role: 'user', content: body.prompt || '' }];

        const result = await env.AI.run(model, { messages });
        const resp = new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      // ── Proxy all other /api/* to VPS backend (uncached) ──
      if (path.startsWith('/api/')) {
        const rateLimited = await checkRateLimit(env, ip, path, 60);
        if (rateLimited) return rateLimited;

        const headers = new Headers(request.headers);
        if (env.BACKEND_API_KEY) {
          headers.set('X-Api-Key', env.BACKEND_API_KEY);
        }
        headers.set('X-Forwarded-For', ip);

        const upstream = await fetch(`${env.VPS_API_URL}${path}${url.search}`, {
          method: request.method,
          headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });

        const resp = new Response(upstream.body, {
          status: upstream.status,
          headers: upstream.headers,
        });
        Object.entries(cors).forEach(([k, v]) => { if (v) resp.headers.set(k, v); });
        return resp;
      }

      // ── Default: 404 ──
      return new Response(JSON.stringify({
        error: 'Not found',
        service: 'grudgeproduction-worker',
        hint: 'Available routes: /health, /assets/*, /api/objectstore, /api/leaderboard, /api/arena/stats, /api/ai/*, /api/*',
      }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal worker error', message: err.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
