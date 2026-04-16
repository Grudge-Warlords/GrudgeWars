/**
 * Grudge Studio — Unified Auth Service
 * Ported from GrudgeBuilder's grudgeBackend.ts
 * Supports: Puter, Discord, Wallet, Guest, Credentials
 */

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'grudge_auth_token';
const LEGACY_TOKEN_KEY = 'grudge_session_token';
const SESSION_KEY = 'grudge-session';
const DEVICE_ID_KEY = 'grudge_device_id';

// ── Token helpers ────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {};
}

// ── Session helpers ──────────────────────────────────────────────────

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentUser() {
  const session = getSession();
  if (session) {
    return {
      grudgeId: session.grudgeId || '',
      username: session.username,
      walletAddress: session.walletAddress,
      accountLevel: session.accountLevel,
      type: session.type,
    };
  }
  const token = getToken();
  if (!token) return null;
  const grudgeId = localStorage.getItem('grudge_id') || '';
  const username = localStorage.getItem('grudge_username') || '';
  if (!grudgeId && !username) return null;
  return { grudgeId, username: username || 'Player' };
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'gb_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function logout() {
  clearToken();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('grudge_user_id');
  localStorage.removeItem('grudge_id');
  localStorage.removeItem('grudge_username');
}

// ── Core auth response handler ───────────────────────────────────────

async function handleAuthResponse(res, sessionType, extra = {}) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Auth failed (${res.status})`);
  }
  const data = await res.json();
  const token = data.sessionToken || data.token;
  if (token) setToken(token);

  const user = data.user || {};
  const resolvedGrudgeId = user.grudgeId || data.grudgeId || '';
  const resolvedUsername = user.displayName || user.username || data.username || 'Unknown';
  if (user.id) localStorage.setItem('grudge_user_id', String(user.id));
  if (resolvedGrudgeId) localStorage.setItem('grudge_id', resolvedGrudgeId);
  if (resolvedUsername) localStorage.setItem('grudge_username', resolvedUsername);

  setSession({
    type: sessionType,
    username: resolvedUsername,
    grudgeId: resolvedGrudgeId || undefined,
    accountId: user.id,
    accountLevel: user.accountLevel || 'pleb',
    loginTime: Date.now(),
    ...extra,
  });

  return data;
}

// ── Auth methods ─────────────────────────────────────────────────────

export async function loginWithCredentials(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleAuthResponse(res, 'grudge');
}

export async function registerAccount(username, password, email) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email }),
  });
  return handleAuthResponse(res, 'grudge');
}

export async function loginWithPuter(puterUuid, puterUsername) {
  const res = await fetch(`${API_BASE}/auth/puter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puterUuid, puterUsername }),
  });
  return handleAuthResponse(res, 'puter', { puterUsername });
}

export async function loginAsGuest() {
  // Try Puter quiet guest first
  if (typeof window !== 'undefined' && window.puter) {
    try {
      const puter = window.puter;
      if (!puter.auth?.isSignedIn?.()) await puter.auth.signIn();
      const user = await puter.auth.getUser();
      if (user?.uuid) return loginWithPuter(user.uuid, user.username);
    } catch { /* fall through */ }
  }
  // Fallback: device-based guest
  const res = await fetch(`${API_BASE}/auth/puter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puterUuid: `guest_${getDeviceId()}`, puterUsername: 'Guest' }),
  });
  return handleAuthResponse(res, 'guest');
}

export async function loginWithWallet(walletAddress, web3authToken) {
  const res = await fetch(`${API_BASE}/auth/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress, web3auth_token: web3authToken }),
  });
  return handleAuthResponse(res, 'wallet', { walletAddress });
}

export async function startDiscordLogin() {
  const res = await fetch(`${API_BASE}/discord/login`);
  const data = await res.json();
  return data.url;
}

export async function completeDiscordLogin(code, state) {
  const res = await fetch(`${API_BASE}/discord/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  return handleAuthResponse(res, 'discord');
}

export async function verifyToken() {
  const token = getToken();
  if (!token) return { valid: false };
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, { headers: authHeaders() });
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: true, ...data };
  } catch {
    return { valid: false };
  }
}

// ── Account API ──────────────────────────────────────────────────────

export async function fetchAccount() {
  const res = await fetch(`${API_BASE}/account/me`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

export async function saveGameProgress(gameSlug, progressData) {
  const res = await fetch(`${API_BASE}/account/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ gameSlug, progress: progressData }),
  });
  if (!res.ok) throw new Error('Failed to save progress');
  return res.json();
}

export async function earnGBux(amount, reason) {
  const res = await fetch(`${API_BASE}/gbux/earn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ amount, reason }),
  });
  if (!res.ok) throw new Error('Failed to earn GBuX');
  return res.json();
}

export async function getGBuxBalance() {
  const res = await fetch(`${API_BASE}/gbux/balance`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get balance');
  return res.json();
}
