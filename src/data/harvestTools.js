/**
 * Harvest Tools
 * 4 tool slots that map to hotkeys 1-2-3-4 in harvest mode.
 * Each tool is linked to a profession — its effective tier equals
 * the player's level in that profession.
 *
 * Slot 1: Hatchet    → Forester  (wood, lumber)
 * Slot 2: Pickaxe    → Miner     (stone, ore)
 * Slot 3: Bone Knife → Mystic    (leather, cloth, herb)
 * Slot 4: Fishing Pole → Chef    (fish) — craftable, not a starter
 */

import { TIERS } from './equipment.js';

// ── Tool Slot Definitions ───────────────────────────────────────────────────

export const HARVEST_TOOL_SLOTS = [
  {
    slotIndex: 0,
    id: 'hatchet',
    name: 'Hatchet',
    icon: 'axe',
    profession: 'Forester',
    desc: 'Chop trees for wood and lumber.',
    harvestTypes: ['wood', 'lumber'],
    baseSpeed: 1.0,       // harvests per second at T0
    animation: 'attack1',
    starter: true,
    starterName: 'Crude Hatchet',
  },
  {
    slotIndex: 1,
    id: 'pickaxe',
    name: 'Pickaxe',
    icon: 'hammer',
    profession: 'Miner',
    desc: 'Mine rocks for stone and ore.',
    harvestTypes: ['stone', 'ore'],
    baseSpeed: 0.8,
    animation: 'attack1',
    starter: true,
    starterName: 'Crude Pickaxe',
  },
  {
    slotIndex: 2,
    id: 'bone_knife',
    name: 'Bone Knife',
    icon: 'sword',
    profession: 'Mystic',
    desc: 'Skin animals, pick flowers, harvest hemp.',
    harvestTypes: ['leather', 'cloth', 'herb'],
    baseSpeed: 1.2,
    animation: 'attack1',
    starter: true,
    starterName: 'Crude Bone Knife',
  },
  {
    slotIndex: 3,
    id: 'fishing_pole',
    name: 'Fishing Pole',
    icon: 'lance',
    profession: 'Chef',
    desc: 'Catch fish from water tiles.',
    harvestTypes: ['fish'],
    baseSpeed: 0.5,
    animation: 'cast',
    starter: false,      // must be crafted: 2 stone + 2 gem
    starterName: null,
    recipe: [
      { id: 'stone', name: 'Stone', qty: 2 },
      { id: 'gem',   name: 'Gem',   qty: 2 },
    ],
  },
];

// ── Profession XP Thresholds (level → total XP needed) ──────────────────────

export const PROFESSION_MAX_LEVEL = 20;

export const PROFESSION_XP_THRESHOLDS = (() => {
  const thresholds = [0]; // level 0 = 0 xp
  for (let lvl = 1; lvl <= PROFESSION_MAX_LEVEL; lvl++) {
    // Curve: 50 * lvl^1.6 — roughly 50, 152, 296, 477, 690, ...
    thresholds.push(Math.floor(50 * Math.pow(lvl, 1.6)));
  }
  return thresholds;
})();

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get the effective tier of a tool based on profession level.
 * Tier 0 at profession level 0, tier 1 at level 1, etc. Capped at 8.
 */
export function getToolTier(professionLevel) {
  return Math.min(8, Math.max(0, professionLevel));
}

/**
 * Get the tier display info (name, color) for a tool.
 * Tier 0 returns a custom "Crude" label.
 */
export function getToolTierInfo(professionLevel) {
  const tier = getToolTier(professionLevel);
  if (tier === 0) return { name: 'Crude', color: '#6b7280', tier: 0 };
  return { ...(TIERS[tier] || TIERS[1]), tier };
}

/**
 * Calculate harvest speed for a tool at a given profession level.
 * Speed scales: baseSpeed * (1 + profLevel * 0.15)
 */
export function getHarvestSpeed(toolDef, professionLevel) {
  if (!toolDef) return 0;
  return Math.round(toolDef.baseSpeed * (1 + professionLevel * 0.15) * 100) / 100;
}

/**
 * Check if a profession has enough XP to level up.
 * Returns the new level, or current level if not enough XP.
 */
export function getProfessionLevelFromXp(totalXp) {
  for (let lvl = PROFESSION_MAX_LEVEL; lvl >= 1; lvl--) {
    if (totalXp >= PROFESSION_XP_THRESHOLDS[lvl]) return lvl;
  }
  return 0;
}

/**
 * Get XP needed for next profession level.
 */
export function getXpForNextLevel(currentLevel) {
  if (currentLevel >= PROFESSION_MAX_LEVEL) return Infinity;
  return PROFESSION_XP_THRESHOLDS[currentLevel + 1];
}

/**
 * Get the harvest XP reward for a single harvest action.
 * Scales slightly with tier of resource gathered.
 */
export function getHarvestXpReward(resourceTier) {
  return Math.max(1, 5 + (resourceTier || 0) * 3);
}

/**
 * Build tool items for starting character (slots 0-2 populated, slot 3 null).
 */
export function getStartingHarvestToolSlots() {
  return HARVEST_TOOL_SLOTS.map(def => {
    if (!def.starter) return null;
    return {
      id: def.id,
      name: def.starterName || def.name,
      icon: def.icon,
      tier: 0,
      slotIndex: def.slotIndex,
      profession: def.profession,
    };
  });
}

/**
 * Get tool definition by slot index.
 */
export function getToolDefBySlot(slotIndex) {
  return HARVEST_TOOL_SLOTS[slotIndex] || null;
}

/**
 * Get tool definition by id.
 */
export function getToolDefById(toolId) {
  return HARVEST_TOOL_SLOTS.find(t => t.id === toolId) || null;
}
