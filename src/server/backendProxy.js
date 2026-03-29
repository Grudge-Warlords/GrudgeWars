/**
 * backendProxy.js
 * Shared proxy helper for all server.js routes that forward to api.grudge-studio.com.
 * Pattern mirrors grudge-platform/api/_grudge-proxy.js.
 *
 * Rules:
 * - No direct DB access from this layer — all data ops go through api.grudge-studio.com
 * - CORS allowlist is the single source of truth; update only here
 * - Circuit breaker prevents cascading failures if backend is down
 */

export const GAME_API_URL = process.env.GRUDGE_API_URL || 'https://api.grudge-studio.com';
export const ID_API_URL   = process.env.GRUDGE_AUTH_URL || 'https://id.grudge-studio.com';
const TIMEOUT_MS = 8000;

// ── CORS allowlist ───────────────────────────────────────────────────────────
// Keep in sync with server.js ALLOWED_ORIGINS
export const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://www.grudgewarlords.com',
  'https://grudgeplatform.io',
  'https://www.grudgeplatform.io',
  'https://grudge-studio.com',
  'https://www.grudge-studio.com',
  'https://gdevelop-assistant.vercel.app',
  'https://warlord-crafting-suite.vercel.app',
  'https://molochdagod.github.io',
  'https://grudge-crafting.puter.site',
  'https://grudge-studio-app.puter.site',
];

export function buildCorsHeaders(req) {
  const origin = (req && req.headers && req.headers.origin) || '';
  const isPuter = origin.endsWith('.puter.com') || origin === 'https://puter.com';
  const allowed = ALLOWED_ORIGINS.includes(origin) || isPuter;
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

// ── Circuit breaker ──────────────────────────────────────────────────────────
const breaker = {
  failures: 0, threshold: 5, resetMs: 60_000, lastFailure: 0,
  isOpen() {
    if (this.failures < this.threshold) return false;
    if (Date.now() - this.lastFailure > this.resetMs) { this.failures = 0; return false; }
    return true;
  },
  record(ok) {
    if (ok) { this.failures = 0; return; }
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold)
      console.warn('[backendProxy] Circuit breaker OPEN — api.grudge-studio.com unreachable');
  },
};

// ── Core proxy ───────────────────────────────────────────────────────────────

/**
 * Forward an Express request to the Grudge Game API.
 * @param {string} path     - Backend path, e.g. '/api/characters'
 * @param {object} req      - Express request
 * @param {object} res      - Express response
 * @param {object} [opts]
 * @param {string} [opts.baseUrl]     - Override base URL (default: GAME_API_URL)
 * @param {string} [opts.method]      - Override HTTP method
 * @param {boolean} [opts.passQuery]  - Forward query params
 * @param {object} [opts.extraHeaders] - Additional headers to inject
 */
export async function proxyToBackend(path, req, res, opts = {}) {
  // CORS
  const cors = buildCorsHeaders(req);
  Object.entries(cors).forEach(([k, v]) => { if (v) res.setHeader(k, v); });
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (breaker.isOpen()) {
    return res.status(503).json({ error: 'Game API temporarily unavailable — try again shortly' });
  }

  const base = opts.baseUrl || GAME_API_URL;
  const method = opts.method || req.method;
  const url = new URL(path, base);

  if (opts.passQuery && req.query) {
    Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(opts.extraHeaders || {}),
  };

  // Forward auth token
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  // Forward client IP for backend logging
  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  headers['X-Forwarded-For'] = clientIp;
  headers['X-Real-IP'] = clientIp;
  if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fetchOpts = { method, headers, signal: controller.signal, redirect: 'manual' };
    if (method !== 'GET' && method !== 'HEAD') {
      const body = typeof req.body === 'object' ? JSON.stringify(req.body) : (req.body || '');
      fetchOpts.body = body;
    }

    const upstream = await fetch(url.toString(), fetchOpts);
    clearTimeout(timeout);
    breaker.record(true);

    // Handle redirects (e.g. OAuth flows)
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (location) return res.redirect(upstream.status, location);
    }

    const ct = upstream.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }
    const text = await upstream.text();
    if (ct) res.setHeader('Content-Type', ct);
    return res.status(upstream.status).send(text);

  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err.name === 'AbortError';
    console.error(`[backendProxy] ${method} ${path} failed: ${isTimeout ? 'timeout' : err.message}`);
    breaker.record(false);
    return res.status(502).json({
      error: isTimeout ? 'Backend request timed out' : 'Backend unavailable',
      detail: `Could not reach ${base}`,
    });
  }
}

/**
 * Verify a Bearer token against id.grudge-studio.com.
 * Returns the user profile on success, null on failure.
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const r = await fetch(`${ID_API_URL}/api/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
