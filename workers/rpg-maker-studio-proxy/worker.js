/**
 * Cloudflare Worker — proxies grudge-studio.com/rpg-maker-studio/* to the Vercel deployment.
 *
 * Setup:
 *   1. `npx wrangler deploy` from this directory (or use the wrangler.toml below)
 *   2. Add Worker Route in Cloudflare dashboard:
 *        Pattern:  grudge-studio.com/rpg-maker-studio*
 *        Worker:   rpg-maker-studio-proxy
 *   3. Ensure grudge-studio.com has a proxied DNS record (A @ 192.0.2.1, orange cloud ON)
 */

// ── Change this to your actual Vercel deployment URL ──
const VERCEL_ORIGIN = 'https://standalone-grudge.vercel.app';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Strip the /rpg-maker-studio prefix before forwarding to Vercel
    // Vercel already serves the app at root with base: '/rpg-maker-studio/'
    const forwardUrl = new URL(url.pathname + url.search, VERCEL_ORIGIN);

    const response = await fetch(forwardUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
    });

    // Clone response and relay with CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Proxied-By', 'grudge-studio-cf-worker');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
