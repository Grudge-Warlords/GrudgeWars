const OS_BASE = 'https://molochdagod.github.io/ObjectStore';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const ENDPOINTS = {
  weapons: '/api/v1/weapons.json',
  armor: '/api/v1/armor.json',
  materials: '/api/v1/materials.json',
  consumables: '/api/v1/consumables.json',
  enemies: '/api/v1/enemies.json',
  races: '/api/v1/races.json',
  classes: '/api/v1/classes.json',
  factions: '/api/v1/factions.json',
  attributes: '/api/v1/attributes.json',
  skills: '/api/v1/skills.json',
  bosses: '/api/v1/bosses.json',
  sprites: '/api/v1/sprites.json',
  spriteMaps: '/api/v1/spriteMaps.json',
  effectSprites: '/api/v1/effectSprites.json',
};

const memoryCache = {};

function getCached(key) {
  const mem = memoryCache[key];
  if (mem && Date.now() - mem.ts < CACHE_TTL) return mem.data;
  try {
    const raw = localStorage.getItem(`os_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < CACHE_TTL) {
        memoryCache[key] = parsed;
        return parsed.data;
      }
    }
  } catch {}
  return null;
}

function setCache(key, data) {
  const entry = { data, ts: Date.now() };
  memoryCache[key] = entry;
  try {
    localStorage.setItem(`os_${key}`, JSON.stringify(entry));
  } catch {}
}

async function fetchEndpoint(key) {
  const cached = getCached(key);
  if (cached) return cached;
  const url = `${OS_BASE}${ENDPOINTS[key]}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ObjectStore fetch failed: ${url} (${res.status})`);
  const data = await res.json();
  setCache(key, data);
  return data;
}

export function iconUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${OS_BASE}/${path.replace(/^\//, '')}`;
}

export function weaponFullIcon(filename) {
  return `${OS_BASE}/icons/weapons_full/${filename}`;
}

export function armorFullIcon(filename) {
  return `${OS_BASE}/icons/armor_full/${filename}`;
}

export function consumableIcon(filename) {
  return `${OS_BASE}/icons/consumables/${filename}`;
}

export function lootIcon(filename) {
  return `${OS_BASE}/icons/loot/${filename}`;
}

export function materialIcon(filename) {
  return `${OS_BASE}/icons/materials/${filename}`;
}

export function namedWeaponIcon(name) {
  return `${OS_BASE}/icons/weapons/${name}.png`;
}

const WEAPON_FULL_PREFIXES = {
  sword: 'Sword', axe: 'Axe', dagger: 'Dagger', bow: 'Bow',
  hammer: 'Hammer', spear: 'Spear', crossbow: 'Crossbow',
  staff: 'Staff', shield: 'shield', scythe: 'Scythe',
};

export function weaponFullIconByType(type, index = 1) {
  const prefix = WEAPON_FULL_PREFIXES[type] || 'Sword';
  const num = String(index).padStart(2, '0');
  return weaponFullIcon(`${prefix}_${num}.png`);
}

const ARMOR_SLOT_PREFIXES = {
  head: 'Helmet', chest: 'Chest', boots: 'Boot', gloves: 'Glove',
  shoulders: 'Shoulder', pants: 'Pant', belt: 'Belt', back: 'Back',
};

export function armorFullIconBySlot(slot, index = 1) {
  const prefix = ARMOR_SLOT_PREFIXES[slot] || 'Chest';
  const num = String(index).padStart(2, '0');
  return armorFullIcon(`${prefix}_${num}.png`);
}

export async function getWeapons() {
  return fetchEndpoint('weapons');
}

export async function getArmor() {
  return fetchEndpoint('armor');
}

export async function getMaterials() {
  return fetchEndpoint('materials');
}

export async function getConsumables() {
  return fetchEndpoint('consumables');
}

export async function getEnemies() {
  return fetchEndpoint('enemies');
}

export async function getRaces() {
  return fetchEndpoint('races');
}

export async function getClasses() {
  return fetchEndpoint('classes');
}

export async function getFactions() {
  return fetchEndpoint('factions');
}

export async function getAttributes() {
  return fetchEndpoint('attributes');
}

export async function getSkills() {
  return fetchEndpoint('skills');
}

export async function getBosses() {
  return fetchEndpoint('bosses');
}

export async function getSprites() {
  return fetchEndpoint('sprites');
}

export async function getSpriteMaps() {
  return fetchEndpoint('spriteMaps');
}

export async function getEffectSprites() {
  return fetchEndpoint('effectSprites');
}

export async function getWeaponsByCategory(category) {
  const data = await getWeapons();
  const cat = data.categories?.[category];
  if (!cat) return [];
  return cat.items || cat;
}

export async function getAllWeaponCategories() {
  const data = await getWeapons();
  return Object.keys(data.categories || {});
}

export async function getArmorBySlot(slot) {
  const data = await getArmor();
  const sets = data.sets || {};
  const result = [];
  for (const setName of Object.keys(sets)) {
    const s = sets[setName];
    const pieces = s.pieces || [];
    for (const p of pieces) {
      if (p.slot === slot) result.push({ ...p, setName, material: s.material, tier: s.tier });
    }
  }
  return result;
}

export async function getMaterialsByType(type) {
  const data = await getMaterials();
  const cat = data.categories?.[type];
  return cat?.items || cat || [];
}

export async function getEnemiesByCategory(category) {
  const data = await getEnemies();
  const cat = data.categories?.[category];
  return cat?.items || cat || [];
}

export async function getConsumablesByCategory(category) {
  const data = await getConsumables();
  const cat = data.categories?.[category];
  return cat?.items || cat || [];
}

export async function getSkillsByCategory(category) {
  const data = await getSkills();
  const cat = data.categories?.[category];
  return cat?.items || cat || [];
}

export async function getAllFlatWeapons() {
  const data = await getWeapons();
  const all = [];
  const tiers = data.tiers || {};
  for (const [catKey, cat] of Object.entries(data.categories || {})) {
    const items = cat.items || cat;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      all.push({ ...item, category: catKey });
    }
  }
  return { weapons: all, tiers };
}

export async function getAllFlatArmor() {
  const data = await getArmor();
  const all = [];
  for (const [setName, s] of Object.entries(data.sets || {})) {
    const pieces = s.pieces || [];
    for (const p of pieces) {
      all.push({ ...p, setName, material: s.material, tier: s.tier, tierColor: (data.tierColors || {})[s.tier] });
    }
  }
  return { armor: all, tiers: data.tiers || {}, tierColors: data.tierColors || {} };
}

export async function getAllFlatConsumables() {
  const data = await getConsumables();
  const all = [];
  for (const [catKey, cat] of Object.entries(data.categories || {})) {
    const items = cat.items || cat;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      all.push({ ...item, category: catKey });
    }
  }
  return all;
}

export async function getAllFlatMaterials() {
  const data = await getMaterials();
  const all = [];
  for (const [catKey, cat] of Object.entries(data.categories || {})) {
    const items = cat.items || cat;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      all.push({ ...item, category: catKey });
    }
  }
  return all;
}

export async function preloadAll() {
  const keys = Object.keys(ENDPOINTS);
  await Promise.allSettled(keys.map(k => fetchEndpoint(k)));
}

export function clearCache() {
  Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  Object.keys(ENDPOINTS).forEach(k => {
    try { localStorage.removeItem(`os_${k}`); } catch {}
  });
}

export { OS_BASE, ENDPOINTS };
