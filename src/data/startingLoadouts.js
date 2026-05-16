/**
 * Starting Loadouts
 * Defines the gear, inventory, tools, and consumables every new character
 * receives based on their class.
 *
 * Equipment slots: mainHand, offHand, helmet, armor, pants, feet, back
 * Tools: hatchet (lumber), pickaxe (stone) — always given
 * HomeTome: 1 hr cooldown, returns to camp or selected town hall
 *
 * Craftable tools (NOT given, must be crafted):
 *   Fishing Pole  — 2 stone + 2 gem
 *   Builder's Hammer — 2 wood + 2 stone  (unlocks Build tab, auto-equips in build mode)
 */

// ── Class starting equipment ────────────────────────────────────────────────

export const classStartingEquipment = {
  warrior: {
    mainHand: { id: 't0_sword',       name: 'Crude Sword',       type: 'sword',    tier: 0, slot: 'mainHand', icon: 'sword' },
    offHand:  { id: 't0_shield',      name: 'Crude Shield',      type: 'shield',   tier: 0, slot: 'offHand',  icon: 'shield' },
    helmet:   null,
    armor:    { id: 't0_metal_chest',  name: 'Metal Chest',       type: 'metal',    tier: 0, slot: 'armor',    icon: 'armor' },
    pants:    { id: 't0_metal_legs',   name: 'Metal Legs',        type: 'metal',    tier: 0, slot: 'pants',    icon: 'pants' },
    feet:     null,
    back:     null,
  },
  mage: {
    mainHand: { id: 't0_wand',        name: 'Crude Wand',        type: 'wand',     tier: 0, slot: 'mainHand', icon: 'wand' },
    offHand:  { id: 't0_staff',       name: 'Crude Staff',       type: 'staff',    tier: 0, slot: 'offHand',  icon: 'staff' },
    helmet:   null,
    armor:    null,
    pants:    null,
    feet:     null,
    back:     null,
  },
  ranger: {
    mainHand: { id: 't0_bow',         name: 'Crude Bow',         type: 'bow',      tier: 0, slot: 'mainHand', icon: 'bow' },
    offHand:  { id: 't0_dagger',      name: 'Crude Dagger',      type: 'dagger',   tier: 0, slot: 'offHand',  icon: 'dagger' },
    helmet:   null,
    armor:    { id: 't0_leather_chest',name: 'Leather Chest',     type: 'leather',  tier: 0, slot: 'armor',    icon: 'armor' },
    pants:    { id: 't0_leather_pants',name: 'Leather Pants',     type: 'leather',  tier: 0, slot: 'pants',    icon: 'pants' },
    feet:     { id: 't0_leather_boots',name: 'Leather Boots',     type: 'leather',  tier: 0, slot: 'feet',     icon: 'feet' },
    back:     null,
  },
  worge: {
    mainHand: { id: 't0_mace',        name: 'Crude Mace',        type: 'hammer1h', tier: 0, slot: 'mainHand', icon: 'hammer1h' },
    offHand:  { id: 't0_nature_tome',  name: 'Nature Tome',       type: 'tome',     tier: 0, slot: 'offHand',  icon: 'tome' },
    helmet:   null,
    armor:    null,
    pants:    null,
    feet:     null,
    back:     null,
  },
};

// ── Starting tools (every character gets these) ─────────────────────────────

export const STARTING_TOOLS = [
  { id: 'hatchet',    name: 'Hatchet',    category: 'tool', tier: 0, desc: 'Chop trees for lumber',                    icon: 'axe',    profession: 'Forester', harvestTypes: ['wood', 'lumber'] },
  { id: 'pickaxe',    name: 'Pickaxe',    category: 'tool', tier: 0, desc: 'Mine rocks for stone',                     icon: 'hammer', profession: 'Miner',    harvestTypes: ['stone', 'ore'] },
  { id: 'bone_knife', name: 'Bone Knife', category: 'tool', tier: 0, desc: 'Skin animals, pick flowers, harvest hemp.', icon: 'sword',  profession: 'Mystic',   harvestTypes: ['leather', 'cloth', 'herb'] },
];

// ── HomeTome (every character gets 1) ───────────────────────────────────────

export const HOME_TOME = {
  id: 'home_tome',
  name: 'HomeTome',
  category: 'consumable',
  qty: 1,
  cooldown: 3600, // 1 hour in seconds
  desc: 'Return to your camp or selected town hall. 1 hr cooldown.',
  icon: 'tome',
};

// ── Starting inventory (same for all classes) ───────────────────────────────

const BASE_INVENTORY = [
  { ...HOME_TOME },
  { id: 'small_health_potion', name: 'Small Health Potion', category: 'consumable', qty: 2 },
  { id: 'small_mana_potion',   name: 'Small Mana Potion',   category: 'consumable', qty: 2 },
];

// ── Craftable tools (NOT in starting inventory) ─────────────────────────────

export const CRAFTABLE_TOOLS = {
  fishing_pole: {
    id: 'fishing_pole',
    name: 'Fishing Pole',
    category: 'tool',
    desc: 'Catch fish from water tiles.',
    icon: 'lance',
    recipe: [
      { id: 'stone', name: 'Stone', qty: 2 },
      { id: 'gem',   name: 'Gem',   qty: 2 },
    ],
  },
  builders_hammer: {
    id: 'builders_hammer',
    name: "Builder's Hammer",
    category: 'tool',
    desc: 'Unlocks the Build tab. Auto-equips when entering build mode.',
    icon: 'hammer1h',
    autoEquipInBuildMode: true,
    recipe: [
      { id: 'wood',  name: 'Wood',  qty: 2 },
      { id: 'stone', name: 'Stone', qty: 2 },
    ],
  },
};

// ── Starting gold ───────────────────────────────────────────────────────────

export const STARTING_GOLD = 25;
export const STARTING_GBUX = 0;

// ── Public API ──────────────────────────────────────────────────────────────

export function getStartingEquipment(classId) {
  return classStartingEquipment[classId] || classStartingEquipment.warrior;
}

export function getStartingInventory(classId) {
  return [
    ...BASE_INVENTORY,
    ...STARTING_TOOLS,
  ];
}

export const ATTR_KEYS = ['Strength', 'Vitality', 'Endurance', 'Dexterity', 'Agility', 'Intellect', 'Wisdom', 'Tactics'];

/**
 * Combine race bonuses + class starting attributes to get starting attribute points.
 * @param {object} classDef - from classDefinitions[classId]
 * @param {object} raceDef  - from raceDefinitions[raceId]
 */
export function getStartingAttributes(classDef, raceDef) {
  if (!raceDef || !classDef) return {};
  const attrs = {};
  for (const key of ATTR_KEYS) {
    attrs[key] = (classDef.startingAttributes?.[key] || 0) + (raceDef.bonuses?.[key] || 0);
  }
  return attrs;
}

// ── Equipment slot display order ────────────────────────────────────────────

export const EQUIP_SLOT_ORDER = ['helmet', 'armor', 'pants', 'mainHand', 'offHand', 'feet', 'back'];

export const EQUIP_SLOT_LABELS = {
  helmet:   'Head',
  armor:    'Chest',
  pants:    'Legs',
  mainHand: 'Main Hand',
  offHand:  'Off Hand',
  feet:     'Feet',
  back:     'Back',
};
