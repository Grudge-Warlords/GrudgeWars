/**
 * VPS Auth Helper — proxies all auth to id.grudge-studio.com
 * GrudgeWars game data stays in Neon; auth lives on VPS.
 * Includes circuit breaker + retry for resilience.
 */
import { query } from './db.js';

const VPS_AUTH_URL = process.env.VPS_AUTH_URL || 'https://id.grudge-studio.com';
const VPS_TIMEOUT_MS = 5000;
const VPS_MAX_RETRIES = 1;

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
      console.warn(`[vpsAuth] Circuit breaker OPEN — VPS disabled for ${this.resetMs / 1000}s`);
    }
  },
  recordSuccess() { this.failures = 0; },
};

// ── Resilient VPS POST helper ──────────────────────────────────────────────
async function vpsPost(path, body = {}) {
  if (circuitBreaker.isOpen()) {
    return { status: 503, ok: false, data: { error: 'VPS auth temporarily unavailable' }, vpsDown: true };
  }
  for (let attempt = 0; attempt <= VPS_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), VPS_TIMEOUT_MS);
      const res = await fetch(`${VPS_AUTH_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      circuitBreaker.recordSuccess();
      return { status: res.status, ok: res.ok, data, vpsDown: false };
    } catch (err) {
      console.warn(`[vpsAuth] ${path} attempt ${attempt + 1} failed: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
      if (attempt >= VPS_MAX_RETRIES) {
        circuitBreaker.recordFailure();
        return { status: 503, ok: false, data: { error: 'VPS auth unreachable' }, vpsDown: true };
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function vpsGet(path, token) {
  if (circuitBreaker.isOpen()) {
    return { status: 503, ok: false, data: {}, vpsDown: true };
  }
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VPS_TIMEOUT_MS);
    const res = await fetch(`${VPS_AUTH_URL}${path}`, { headers, signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    circuitBreaker.recordSuccess();
    return { status: res.status, ok: res.ok, data, vpsDown: false };
  } catch (err) {
    circuitBreaker.recordFailure();
    return { status: 503, ok: false, data: {}, vpsDown: true };
  }
}

// ── Auth proxy functions ────────────────────────────────────────────────────

export async function vpsLogin(username, password) {
  return vpsPost('/auth/login', { username, password });
}

export async function vpsRegister(username, password, email) {
  return vpsPost('/auth/register', { username, password, email });
}

export async function vpsPuter(puterUuid, puterUsername) {
  return vpsPost('/auth/puter', { puterUuid, puterUsername });
}

export async function vpsGuest(deviceId) {
  return vpsPost('/auth/guest', { deviceId });
}

export async function vpsWallet(wallet_address, web3auth_token) {
  return vpsPost('/auth/wallet', { wallet_address, web3auth_token });
}

export async function vpsDiscordExchange(code, redirect_uri) {
  return vpsPost('/auth/discord/exchange', { code, redirect_uri });
}

export async function vpsVerifyToken(token) {
  return vpsPost('/auth/verify', { token });
}

// ── Identity lookups ────────────────────────────────────────────────────────

export async function vpsGetIdentity(token) {
  return vpsGet('/identity/me', token);
}

export async function vpsLookup(grudge_id) {
  return vpsGet(`/identity/${encodeURIComponent(grudge_id)}`);
}

// ── Local game account upsert ───────────────────────────────────────────────
// Keeps a local Neon `accounts` row so game data FKs (characters, inventory,
// islands, arena) continue to work. Auth stays on VPS.
export async function upsertLocalGameAccount({ grudgeId, username, discordId, walletAddress, puterId }) {
  const result = await query(
    `INSERT INTO accounts (grudge_id, username, discord_id, wallet_address, puter_uuid, auth_type, last_login)
     VALUES ($1, $2, $3, $4, $5, 'vps', NOW())
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

// ── Helper: extract user fields from VPS response ───────────────────────────
export function extractVpsUser(data) {
  const user = data.user || data;
  return {
    grudgeId: data.grudgeId || user.grudgeId || user.grudge_id,
    username: data.username || user.username,
    discordId: user.discordId || user.discord_id || null,
    walletAddress: user.walletAddress || user.wallet_address || null,
    puterId: user.puter_id || null,
  };
}

export { VPS_AUTH_URL };
