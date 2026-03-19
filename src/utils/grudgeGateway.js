/**
 * grudgeGateway.js
 * Universal Grudge Auth Gateway client utility.
 * Gateway URL: https://auth-gateway-otb8qmmyd-grudgenexus.vercel.app
 *
 * After auth, the gateway stores in localStorage:
 *   grudge_auth_token   – JWT
 *   grudge_user_id      – numeric account ID
 *   grudge_id           – universal Grudge ID (e.g. GRUDGE_XXXXX_YYYYY)
 *   grudge_username     – display name
 */

export const GATEWAY_URL = 'https://auth-gateway-otb8qmmyd-grudgenexus.vercel.app';

// ── Read gateway keys ─────────────────────────────────────────────────────────
export function getGatewayToken() {
  return localStorage.getItem('grudge_auth_token') || null;
}

export function getGatewayUser() {
  const token = getGatewayToken();
  if (!token) return null;
  return {
    token,
    userId: localStorage.getItem('grudge_user_id') || null,
    grudgeId: localStorage.getItem('grudge_id') || null,
    username: localStorage.getItem('grudge_username') || 'Player',
  };
}

export function isGatewayAuthenticated() {
  return !!getGatewayToken();
}

// ── Redirect to gateway ───────────────────────────────────────────────────────
export function redirectToGateway(returnUrl) {
  const ret = returnUrl || window.location.href;
  window.location.href = `${GATEWAY_URL}?return=${encodeURIComponent(ret)}`;
}

// ── Map gateway session → grudge-wars local session format ────────────────────
export function hydrateSessionFromGateway() {
  const gw = getGatewayUser();
  if (!gw) return null;

  // Sync JWT so API calls via grudge_session_token also work
  localStorage.setItem('grudge_session_token', gw.token);

  const session = {
    type: 'gateway',
    username: gw.username,
    grudgeId: gw.grudgeId,
    accountId: gw.userId,
    loginTime: Date.now(),
  };
  localStorage.setItem('grudge-session', JSON.stringify(session));
  return session;
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export function gatewaySignOut() {
  // Gateway keys
  localStorage.removeItem('grudge_auth_token');
  localStorage.removeItem('grudge_user_id');
  localStorage.removeItem('grudge_id');
  localStorage.removeItem('grudge_username');
  // Local app keys
  localStorage.removeItem('grudge_session_token');
  localStorage.removeItem('grudge-session');
  localStorage.removeItem('discordUser');
  localStorage.removeItem('grudge_studio_session');
  localStorage.removeItem('grudge_studio_user');
  localStorage.removeItem('grudge_current_user');
  localStorage.removeItem('grudge_auth_user');
}

// ── Check on boot — returns session or null ───────────────────────────────────
/**
 * Call at app boot. If gateway token exists, hydrate and return session.
 * If not, and `autoRedirect` is true, redirect to gateway immediately.
 */
export function checkGatewayOnBoot({ autoRedirect = false } = {}) {
  // Also check URL params — gateway may have just redirected back
  const params = new URLSearchParams(window.location.search);
  const returnedToken = params.get('grudge_token');
  if (returnedToken) {
    localStorage.setItem('grudge_auth_token', returnedToken);
    const username = params.get('grudge_username') || 'Player';
    const userId = params.get('grudge_user_id') || '';
    const grudgeId = params.get('grudge_id') || '';
    if (username) localStorage.setItem('grudge_username', username);
    if (userId) localStorage.setItem('grudge_user_id', userId);
    if (grudgeId) localStorage.setItem('grudge_id', grudgeId);
    // Clean URL
    const url = new URL(window.location.href);
    ['grudge_token', 'grudge_username', 'grudge_user_id', 'grudge_id'].forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.toString());
  }

  const session = hydrateSessionFromGateway();
  if (session) return session;

  if (autoRedirect) {
    redirectToGateway();
    return null;
  }
  return null;
}
