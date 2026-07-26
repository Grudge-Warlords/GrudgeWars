/**
 * grudgeGateway.js
 * Universal Grudge Auth Gateway client utility.
 * Gateway URL: https://id.grudge-studio.com (Grudge Identity API)
 *
 * After auth, the gateway stores in localStorage:
 *   grudge_auth_token   – JWT
 *   grudge_user_id      – numeric account ID
 *   grudge_id           – universal Grudge ID (e.g. GRUDGE_XXXXX_YYYYY)
 *   grudge_username     – display name
 */

export const GATEWAY_URL = 'https://id.grudge-studio.com';

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
  // Canonical login — /login?redirect_uri= (sso-check optional after probe:auth passes)
  window.location.href = `${GATEWAY_URL}/login?redirect_uri=${encodeURIComponent(ret)}`;
}

// ── Map gateway session → grudge-wars local session format ────────────────────
export function hydrateSessionFromGateway() {
  const gw = getGatewayUser();
  if (!gw) return null;

  // grudge_auth_token is the canonical key — already set by checkGatewayOnBoot()
  // No need to copy to grudge_session_token

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
  // Canonical keys
  localStorage.removeItem('grudge_auth_token');
  localStorage.removeItem('grudge_user_id');
  localStorage.removeItem('grudge_id');
  localStorage.removeItem('grudge_username');
  localStorage.removeItem('grudge-session');
  // Legacy keys — clear for backward compat during transition
  localStorage.removeItem('grudge_session_token');
  localStorage.removeItem('grudge_sync_token');
  localStorage.removeItem('grudge_sync_user');
  localStorage.removeItem('grudge_imported_characters');
  localStorage.removeItem('discordUser');
  localStorage.removeItem('grudge_studio_session');
  localStorage.removeItem('grudge_studio_user');
  localStorage.removeItem('grudge_current_user');
  localStorage.removeItem('grudge_auth_user');
  localStorage.removeItem('grudge_last_sync');
}

// ── Check on boot — returns session or null ───────────────────────────────────
/**
 * Call at app boot. If gateway token exists, hydrate and return session.
 * If not, and `autoRedirect` is true, redirect to gateway immediately.
 */
export function checkGatewayOnBoot({ autoRedirect = false } = {}) {
  // Check URL params — OAuth callbacks return ?token=&grudge_id=&provider=
  // Also support legacy ?grudge_token= and SSO ?sso_token= params.
  const params = new URLSearchParams(window.location.search);
  const returnedToken = params.get('token') || params.get('sso_token') || params.get('grudge_token');
  if (returnedToken) {
    localStorage.setItem('grudge_auth_token', returnedToken);
    const username = params.get('grudge_username') || params.get('username') || 'Player';
    const userId = params.get('grudge_user_id') || '';
    const grudgeId = params.get('grudge_id') || '';
    if (username) localStorage.setItem('grudge_username', username);
    if (userId) localStorage.setItem('grudge_user_id', userId);
    if (grudgeId) localStorage.setItem('grudge_id', grudgeId);
    // Clean URL
    const url = new URL(window.location.href);
    ['token', 'sso_token', 'grudge_token', 'grudge_username', 'grudge_user_id', 'grudge_id', 'provider', 'username', 'displayName', 'isNew', 'sso_required'].forEach(k => url.searchParams.delete(k));
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
