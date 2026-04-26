/**
 * GRUDA LEGION MONITOR — Cloudflare Worker
 *
 * Centralized error aggregation, alerting, and health monitoring
 * for all Grudge Studio deployments.
 *
 * Endpoints:
 *   POST /error           — receive an error report from any deployment
 *   POST /errors/bulk     — receive a batch of error reports
 *   GET  /health          — run health checks on all known deployments
 *   GET  /errors          — view recent errors (requires X-Admin-Token)
 *   GET  /errors/stats    — error counts by site (requires X-Admin-Token)
 *   DELETE /errors        — clear error log (requires X-Admin-Token)
 *
 * Cron: every 5 minutes → health check all deployments, Discord alert on failures
 *
 * Bindings:
 *   KV: LEGION_KV          — stores errors + health state
 *   Secrets: DISCORD_WEBHOOK, ADMIN_TOKEN
 */

// ─── Known Grudge Studio deployments to health-check ──────────────────────

const DEPLOYMENTS = [
  { name: 'grudge-warlords-rpg',     url: 'https://grudgewarlords.com/api/health',           type: 'railway' },
  { name: 'grudge-builder',          url: 'https://client.grudge-studio.com/api/health',     type: 'vercel'  },
  { name: 'grudge-engine-web',       url: 'https://grudge-engine-web.vercel.app',            type: 'vercel'  },
  { name: 'grudge-pvp-server',       url: 'https://grudge-pvp-server.up.railway.app/health', type: 'railway' },
  { name: 'gruda-wars',              url: 'https://standalone-grudge.vercel.app',            type: 'vercel'  },
  { name: 'grudge-space-rts',        url: 'https://grudgespacerts.vercel.app',               type: 'vercel'  },
];

// Known auto-fixable error patterns → action to take
const AUTO_FIX_PATTERNS = [
  {
    pattern: /rate.?limit/i,
    fix: 'Rate limit hit — automatically backing off. Will retry after cooldown.',
    severity: 'warn',
  },
  {
    pattern: /failed to fetch|network error|econnrefused/i,
    fix: 'Network connectivity issue detected — check Railway/Vercel service status.',
    severity: 'error',
  },
  {
    pattern: /xai.*unavailable|grok.*error/i,
    fix: 'xAI API error — check XAI_API_KEY env var and x.ai service status.',
    severity: 'error',
  },
  {
    pattern: /legion ai unavailable/i,
    fix: 'Legion AI offline — XAI_API_KEY may be missing from Railway env vars.',
    severity: 'error',
  },
  {
    pattern: /cors/i,
    fix: 'CORS error — check ALLOWED_ORIGINS in server and Cloudflare Worker route.',
    severity: 'warn',
  },
  {
    pattern: /chunk.*failed|dynamically imported module/i,
    fix: 'Vite chunk load failure — likely a stale cache. User needs to hard-refresh (Ctrl+Shift+R).',
    severity: 'warn',
  },
  {
    pattern: /out of memory|heap.*allocation/i,
    fix: 'Memory leak or heap overflow — check Three.js dispose() calls and object pooling.',
    severity: 'critical',
  },
];

// ─── Main fetch handler ────────────────────────────────────────────────────

export default {
  // HTTP requests
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    try {
      if (method === 'POST' && url.pathname === '/error') {
        return corsResponse(await handleError(request, env));
      }
      if (method === 'POST' && url.pathname === '/errors/bulk') {
        return corsResponse(await handleBulkErrors(request, env));
      }
      if (method === 'GET' && url.pathname === '/health') {
        return corsResponse(await handleHealth(env));
      }
      if (method === 'GET' && url.pathname === '/errors') {
        return corsResponse(await handleListErrors(request, env));
      }
      if (method === 'GET' && url.pathname === '/errors/stats') {
        return corsResponse(await handleErrorStats(request, env));
      }
      if (method === 'DELETE' && url.pathname === '/errors') {
        return corsResponse(await handleClearErrors(request, env));
      }
      if (method === 'GET' && url.pathname === '/ping') {
        return corsResponse(new Response(JSON.stringify({ status: 'online', ts: Date.now() }), jsonHeaders()));
      }

      return corsResponse(new Response('Legion Monitor Online', { status: 200 }));
    } catch (err) {
      console.error('[Legion Monitor] Unhandled error:', err);
      return corsResponse(new Response(JSON.stringify({ error: err.message }), { status: 500, ...jsonHeaders() }));
    }
  },

  // Scheduled cron — runs every 5 minutes
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runHealthChecks(env));
  },
};

// ─── Error Ingestion ──────────────────────────────────────────────────────

async function handleError(request, env) {
  const body = await request.json().catch(() => ({}));
  const error = normalizeError(body);

  await storeError(env, error);

  const fix = detectAutoFix(error.message);
  if (fix) error.autoFix = fix.fix;

  // Alert on error or critical
  if (fix?.severity !== 'warn' || error.type === 'unhandledrejection') {
    await sendDiscordAlert(env, error, fix);
  }

  return new Response(JSON.stringify({ ok: true, autoFix: fix?.fix || null }), jsonHeaders());
}

async function handleBulkErrors(request, env) {
  const body = await request.json().catch(() => ({ errors: [] }));
  const errors = (body.errors || []).map(normalizeError);

  for (const error of errors.slice(0, 20)) {
    await storeError(env, error);
    const fix = detectAutoFix(error.message);
    if (fix?.severity === 'critical') {
      await sendDiscordAlert(env, error, fix);
    }
  }

  // Single summary alert for bulk errors
  if (errors.length > 0) {
    await sendDiscordAlert(env, {
      site: errors[0].site,
      message: `${errors.length} errors received in bulk report`,
      type: 'bulk',
    }, null);
  }

  return new Response(JSON.stringify({ ok: true, processed: errors.length }), jsonHeaders());
}

function normalizeError(body) {
  return {
    id: crypto.randomUUID(),
    ts: Date.now(),
    site: body.site || body.deployment || 'unknown',
    message: String(body.message || body.error || 'Unknown error').slice(0, 1000),
    stack: String(body.stack || '').slice(0, 2000),
    type: body.type || 'error',
    url: body.url || '',
    sessionId: body.sessionId || '',
    userAgent: body.userAgent || '',
    severity: body.severity || 'error',
    context: body.context || {},
  };
}

// ─── Health Checks ────────────────────────────────────────────────────────

async function handleHealth(env) {
  const results = await runHealthChecks(env, false); // don't alert on manual check
  return new Response(JSON.stringify({ results, ts: Date.now() }), jsonHeaders());
}

async function runHealthChecks(env, alertOnFail = true) {
  const results = await Promise.all(
    DEPLOYMENTS.map(async (dep) => {
      try {
        const start = Date.now();
        const res = await fetch(dep.url, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'GrudaLegionMonitor/1.0' },
        });
        const latency = Date.now() - start;
        const ok = res.status < 500;

        // Store health state in KV
        if (env.LEGION_KV) {
          await env.LEGION_KV.put(
            `health:${dep.name}`,
            JSON.stringify({ ok, status: res.status, latency, ts: Date.now() }),
            { expirationTtl: 3600 }
          );
        }

        return { name: dep.name, ok, status: res.status, latency };
      } catch (err) {
        const result = { name: dep.name, ok: false, error: err.message, ts: Date.now() };

        if (env.LEGION_KV) {
          await env.LEGION_KV.put(
            `health:${dep.name}`,
            JSON.stringify({ ok: false, error: err.message, ts: Date.now() }),
            { expirationTtl: 3600 }
          );
        }

        if (alertOnFail) {
          await sendDiscordAlert(env, {
            site: dep.name,
            message: `🔴 Health check FAILED: ${err.message}`,
            type: 'health_failure',
            severity: 'critical',
          }, null);
        }

        return result;
      }
    })
  );

  const failed = results.filter(r => !r.ok);
  if (alertOnFail && failed.length > 0) {
    await sendDiscordAlert(env, {
      site: 'legion-monitor',
      message: `${failed.length}/${results.length} deployments are DOWN`,
      type: 'health_summary',
      severity: 'critical',
      context: { failed: failed.map(f => f.name) },
    }, null);
  }

  return results;
}

// ─── Error Storage & Retrieval ─────────────────────────────────────────────

async function storeError(env, error) {
  if (!env.LEGION_KV) return;
  const key = `error:${error.ts}:${error.id.slice(0, 8)}`;
  await env.LEGION_KV.put(key, JSON.stringify(error), { expirationTtl: 86400 * 7 }); // 7 days
}

async function handleListErrors(request, env) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, ...jsonHeaders() });
  }
  if (!env.LEGION_KV) {
    return new Response(JSON.stringify({ errors: [], note: 'KV not configured' }), jsonHeaders());
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const site = url.searchParams.get('site');

  const listed = await env.LEGION_KV.list({ prefix: 'error:', limit: limit * 2 });
  const errors = [];

  for (const key of listed.keys.slice(-limit)) {
    const val = await env.LEGION_KV.get(key.name, 'json');
    if (val && (!site || val.site === site)) {
      errors.push(val);
    }
  }

  return new Response(JSON.stringify({ errors: errors.reverse(), total: errors.length }), jsonHeaders());
}

async function handleErrorStats(request, env) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, ...jsonHeaders() });
  }
  if (!env.LEGION_KV) {
    return new Response(JSON.stringify({ stats: {} }), jsonHeaders());
  }

  const listed = await env.LEGION_KV.list({ prefix: 'error:', limit: 1000 });
  const stats = {};

  for (const key of listed.keys) {
    const val = await env.LEGION_KV.get(key.name, 'json');
    if (val) {
      stats[val.site] = (stats[val.site] || 0) + 1;
    }
  }

  return new Response(JSON.stringify({ stats, total: listed.keys.length }), jsonHeaders());
}

async function handleClearErrors(request, env) {
  if (!requireAdmin(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, ...jsonHeaders() });
  }
  if (!env.LEGION_KV) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }), jsonHeaders());
  }

  const listed = await env.LEGION_KV.list({ prefix: 'error:', limit: 500 });
  await Promise.all(listed.keys.map(k => env.LEGION_KV.delete(k.name)));
  return new Response(JSON.stringify({ ok: true, deleted: listed.keys.length }), jsonHeaders());
}

// ─── Auto-fix Detection ───────────────────────────────────────────────────

function detectAutoFix(message = '') {
  return AUTO_FIX_PATTERNS.find(p => p.pattern.test(message)) || null;
}

// ─── Discord Alerting ─────────────────────────────────────────────────────

const SEVERITY_COLORS = {
  warn: 0xFACC15,     // yellow
  error: 0xF87171,    // red
  critical: 0xFF0000, // bright red
  info: 0x7DF9FF,     // cyan
};

async function sendDiscordAlert(env, error, fix) {
  const webhookUrl = env.DISCORD_WEBHOOK;
  if (!webhookUrl) return;

  const color = SEVERITY_COLORS[error.severity || 'error'];
  const ts = new Date().toISOString();

  const fields = [
    { name: '🌐 Site', value: error.site || 'unknown', inline: true },
    { name: '⚡ Type', value: error.type || 'error', inline: true },
    { name: '🕐 Time', value: ts.slice(0, 19).replace('T', ' ') + ' UTC', inline: true },
  ];

  if (error.url) fields.push({ name: '🔗 URL', value: error.url.slice(0, 100), inline: false });
  if (error.sessionId) fields.push({ name: '🔑 Session', value: error.sessionId.slice(-12), inline: true });
  if (fix?.fix) fields.push({ name: '🔧 Auto-fix', value: fix.fix, inline: false });
  if (error.context?.failed?.length) {
    fields.push({ name: '💀 Down', value: error.context.failed.join(', '), inline: false });
  }

  const embed = {
    title: `⚡ LEGION ALERT — ${(error.message || '').slice(0, 100)}`,
    color,
    fields,
    footer: { text: 'Gruda Legion Monitor | grudge-studio.com' },
    timestamp: ts,
  };

  if (error.stack && error.severity !== 'warn') {
    embed.description = `\`\`\`\n${error.stack.slice(0, 500)}\n\`\`\``;
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed], username: 'Gruda Legion Monitor' }),
  }).catch(e => console.error('[Legion Monitor] Discord alert failed:', e));
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function requireAdmin(request, env) {
  const token = request.headers.get('X-Admin-Token');
  return token && env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

function jsonHeaders() {
  return { headers: { 'Content-Type': 'application/json' } };
}

function corsResponse(response) {
  const r = new Response(response.body, response);
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  return r;
}
