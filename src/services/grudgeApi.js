/**
 * Grudge API Client
 * Single source of truth for all backend API calls in grudge-wars.
 *
 * Rules:
 * - All calls use grudge_auth_token as Bearer token
 * - Base URL resolves from VITE_API_URL or API_BASE (same-origin in prod)
 * - Throws on non-2xx responses with a normalized { error, status } object
 * - Never reads grudge_session_token, grudge_sync_token, or any legacy key
 */

import { API_BASE } from '../utils/apiBase.js';
const ID_BASE = import.meta.env.VITE_AUTH_URL || 'https://id.grudge-studio.com';

// ── Auth helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('grudge_auth_token') || null;
}

export function getGrudgeId() {
  return localStorage.getItem('grudge_id') || null;
}

export function isAuthenticated() {
  return !!getToken();
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(path, init = {}, baseOverride) {
  const token = getToken();
  const base = baseOverride || API_BASE;
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

// ── Auth endpoints ───────────────────────────────────────────────────────────

export const auth = {
  /** Fetch current user profile from id.grudge-studio.com */
  me: () => apiFetch('/api/auth/user', {}, ID_BASE),

  /** Server-side logout (invalidates JWT) */
  logout: () => {
    const token = getToken();
    if (!token) return Promise.resolve();
    return fetch(`${ID_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).catch(() => {}); // best-effort
  },
};

// ── Character endpoints ──────────────────────────────────────────────────────

export const characters = {
  /** List all characters for the authenticated account */
  list: () => apiFetch('/api/characters'),

  /** Get a single character by ID */
  get: (id) => apiFetch(`/api/characters/${id}`),

  /**
   * Create a new character
   * @param {{ name, classId, raceId, attributePoints, level?, equipment?, unlockedSkills? }} data
   */
  create: (data) => apiFetch('/api/characters', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update character progression fields
   * @param {string} id
   * @param {{ level?, xp?, attributePoints?, unlockedSkills?, skillPoints?,
   *           currentHealth?, currentMana?, currentStamina?, abilityLoadout?,
   *           unspentPoints? }} data
   */
  patch: (id, data) => apiFetch(`/api/characters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Soft-delete / archive a character */
  delete: (id) => apiFetch(`/api/characters/${id}`, { method: 'DELETE' }),
};

// ── Inventory endpoints ──────────────────────────────────────────────────────

export const inventory = {
  /** List all inventory items for a character */
  list: (characterId) => apiFetch(`/api/characters/${characterId}/inventory`),

  /** Add an item to character inventory */
  add: (characterId, item) => apiFetch(`/api/characters/${characterId}/inventory`, {
    method: 'POST',
    body: JSON.stringify(item),
  }),

  /** Update an inventory item (quantity, stats, tier, etc.) */
  patch: (itemId, data) => apiFetch(`/api/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Remove an item from inventory */
  remove: (itemId) => apiFetch(`/api/inventory/${itemId}`, { method: 'DELETE' }),

  /**
   * Equip or unequip an item atomically
   * @param {string} characterId
   * @param {{ slot, itemId, unequip? }} data
   */
  equip: (characterId, data) => apiFetch(`/api/characters/${characterId}/equip`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Economy endpoints ────────────────────────────────────────────────────────

export const economy = {
  /** Get gold + GBUX + wallet balance for authenticated account */
  balance: () => apiFetch('/api/economy/balance'),

  /** Transfer gold or GBUX to another player by grudgeId or wallet */
  transfer: (data) => apiFetch('/api/economy/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Cloud sync endpoints ─────────────────────────────────────────────────────

export const sync = {
  /**
   * Push game state snapshot to the cloud
   * @param {object} gameState - serialized Zustand state slice
   */
  push: (gameState) => apiFetch('/api/studio/sync/push', {
    method: 'POST',
    body: JSON.stringify({ gameState }),
  }),

  /** Pull latest cloud save */
  pull: () => apiFetch('/api/studio/sync/pull', { method: 'POST' }),
};

// ── Crafting endpoints ───────────────────────────────────────────────────────

export const crafting = {
  /** List all recipes, optionally filtered by profession/category/tier */
  recipes: (filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return apiFetch(`/api/crafting/recipes${q ? `?${q}` : ''}`);
  },

  /** Get profession levels for authenticated account */
  professions: () => apiFetch(`/api/crafting/professions/${getGrudgeId()}`),

  /**
   * Craft an item
   * @param {{ recipeId, characterId, quantity? }} data
   */
  craft: (data) => apiFetch('/api/crafting/craft', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ── Missions / quests ────────────────────────────────────────────────────────

export const missions = {
  list: () => apiFetch('/api/missions'),
  complete: (missionId, data) => apiFetch(`/api/missions/${missionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),
};

// ── Default export: all namespaces ───────────────────────────────────────────

export default {
  auth,
  characters,
  inventory,
  economy,
  sync,
  crafting,
  missions,
  getToken,
  getGrudgeId,
  isAuthenticated,
};
