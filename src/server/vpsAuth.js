/**
 * Auth API Helper — proxies all auth to id.grudge-studio.com
 * Auth lives on Railway (The-ENGINE) behind Cloudflare Workers.
 * Includes circuit breaker + retry for resilience.
 */
import { query } from './db.js';

const AUTH_API_URL = process.env.AUTH_API_URL || process.env.VPS_AUTH_URL || 'https://id.grudge-studio.com';
const AUTH_TIMEOUT_MS = 5000;
const AUTH_MAX_RETRIES = 1;

// ── Circuit breaker ─────────────────────────────────────────────────────
const circuitBreaker = {
  failures: 0,
  threshold: 3,
  resetMs: 60_000,
  lastFailure: 0,
  isOpen() {
    if (this.failures < this.threshold) return false;
    if (Date.now() - this.lastFailure > this.resetMs) {
      this.failures = 0;
      return false;
    }
    return true;
  },
  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      console.warn(`[authApi] Circuit breaker OPEN — auth API disabled for ${this.resetMs / 1000}s`);
    }
  },
  recordSuccess() { this.failures = 0; },
};

// ── Resilient auth API POST helper ─────────────────────────────────────────
async function authPost(path, body = {}) {
  if (circuitBreaker.isOpen()) {
    return { status: 503, ok: false, data: { error: 'Auth API temporarily unavailable' }, authDown: true };
  }
  for (let attempt = 0; attempt <= AUTH_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
      const res = await fetch(`${AUTH_API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      circuitBreaker.recordSuccess();
      return { status: res.status, ok: res.ok, data, authDown: false };
    } catch (err) {
      console.warn(`[authApi] ${path} attempt ${attempt + 1} failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      if (attempt >= AUTH_MAX_RETRIES) {
        circuitBreaker.recordFailure();
        return { status: 503, ok: false, data: { error: 'Auth API unreachable' }, authDown: true };
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function authGet(path, token) {
  if (circuitBreaker.isOpen()) {
    return { status: 503, ok: false, data: {}, authDown: true };
  }
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
    const res = await fetch(`${AUTH_API_URL}${path}`, { headers, signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    circuitBreaker.recordSuccess();
    return { status: res.status, ok: res.ok, data, authDown: false };
  } catch (err) {
    circuitBreaker.recordFailure();
    return { status: 503, ok: false, data: {}, authDown: true };
  }
}

// ── Auth proxy functions ────────────────────────────────────────────────────

export async function authLogin(username, password) {
  return authPost('/auth/login', { username, password });
}

export async function authRegister(username, password, email) {
  return authPost('/auth/register', { username, password, email });
}

export async function authPuter(puterUuid, puterUsername) {
  return authPost('/auth/puter', { puterUuid, puterUsername });
}

export async function authGuest(deviceId) {
  return authPost('/auth/guest', { deviceId });
}

export async function authWallet(wallet_address, web3auth_token) {
  return authPost('/auth/wallet', { wallet_address, web3auth_token });
}

export async function authDiscordExchange(code, redirect_uri) {
  return authPost('/auth/discord/exchange', { code, redirect_uri });
}

export async function authVerifyToken(token) {
  return authPost('/auth/verify', { token });
}

// ── Identity lookups ────────────────────────────────────────────────────────

export async function authGetIdentity(token) {
  return authGet('/identity/me', token);
}

export async function authLookup(grudge_id) {
  return authGet(`/identity/${encodeURIComponent(grudge_id)}`);
}

// ── Local game account upsert ───────────────────────────────────────────────
// Keeps a local `accounts` row so game data FKs (characters, inventory,
// islands, arena) continue to work. Auth stays on Railway (id.grudge-studio.com).
export async function upsertLocalGameAccount({ grudgeId, username, discordId, walletAddress, puterId }) {
  const result = await query(
    `INSERT INTO accounts (grudge_id, username, discord_id, wallet_address, puter_uuid, auth_type, last_login)
     VALUES ($1, $2, $3, $4, $5, 'grudge-id', NOW())
     ON CONFLICT (grudge_id) DO UPDATE SET
       username     = COALESCE(EXCLUDED.username, accounts.username),
       discord_id   = COALESCE(EXCLUDED.discord_id, accounts.discord_id),
       wallet_address = COALESCE(EXCLUDED.wallet_address, accounts.wallet_address),
       puter_uuid   = COALESCE(EXCLUDED.puter_uuid, accounts.puter_uuid),
       last_login   = NOW(),
       updated_at   = NOW()
     RETURNING *`,
    [grudgeId, username || 'Unknown', discordId || null, walletAddress || null, puterId || null]
  );
  return result.rows[0];
}

// ── Helper: extract user fields from auth API response ──────────────────────
export function extractAuthUser(data) {
  const user = data.user || data;
  return {
    grudgeId: data.grudgeId || user.grudgeId || user.grudge_id,
    username: data.username || user.username,
    discordId: user.discordId || user.discord_id || null,
    walletAddress: user.walletAddress || user.wallet_address || null,
    puterId: user.puter_id || null,
  };
}

export { AUTH_API_URL, AUTH_API_URL as VPS_AUTH_URL };
