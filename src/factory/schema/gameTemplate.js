export const GAME_TEMPLATE_SCHEMA = {
  meta: {
    gameName: '',
    studioName: '',
    tagline: '',
    version: '1.0.0',
    theme: '',
    setting: '',
    artStyle: 'pixel',
    colorPalette: {
      primary: '#06b6d4',
      secondary: '#a855f7',
      accent: '#f59e0b',
      danger: '#ef4444',
      background: '#050a18',
      text: '#e2e8f0',
    },
    fonts: {
      heading: 'Cinzel',
      body: 'Jost',
    },
    currency: { name: 'Gold', icon: 'coin', plural: 'Gold' },
    resources: [],
  },

  races: [],
  classes: [],
  attributes: [],
  enemies: [],
  bosses: [],
  equipment: {
    slots: [],
    tiers: [],
    weaponTypes: [],
    armorSets: [],
    items: [],
  },
  skillTrees: {},
  lore: {
    title: '',
    subtitle: '',
    prologue: '',
    factions: [],
    worldHistory: '',
  },
  chapters: [],
  worldMap: {
    name: '',
    regions: [],
    locations: [],
    connections: [],
  },
  dialogue: {
    greetings: [],
    battleCries: [],
    victory: [],
    defeat: [],
    idle: [],
  },
  assets: {
    backgrounds: [],
    raceSprites: [],
    enemySprites: [],
    icons: [],
    effects: [],
    uiElements: [],
  },
};

export const RACE_TEMPLATE = {
  id: '',
  name: '',
  icon: '',
  color: '#ffffff',
  description: '',
  lore: '',
  bonuses: {},
  passive: '',
  trait: '',
  traitDescription: '',
};

export const CLASS_TEMPLATE = {
  id: '',
  name: '',
  icon: '',
  color: '#ffffff',
  description: '',
  lore: '',
  role: '',
  startingAttributes: {},
  abilities: [],
  signatureAbility: null,
  transformAbility: null,
  transformAbilities: null,
};

export const ABILITY_TEMPLATE = {
  id: '',
  name: '',
  icon: '',
  description: '',
  type: 'physical',
  damage: 1.0,
  manaCost: 0,
  staminaCost: 0,
  cooldown: 0,
  target: 'enemy',
  effect: null,
};

export const ENEMY_TEMPLATE = {
  id: '',
  name: '',
  icon: '',
  color: '#ffffff',
  portrait: '',
  baseHealth: 100,
  baseDamage: 15,
  baseDefense: 5,
  baseMana: 0,
  xpReward: 20,
  goldReward: 10,
  speed: 10,
  isBoss: false,
  abilities: [],
  lore: '',
};

export const EQUIPMENT_TEMPLATE = {
  id: '',
  name: '',
  slot: 'weapon',
  tier: 1,
  icon: '',
  stats: {},
  description: '',
  lore: '',
};

export const SKILL_NODE_TEMPLATE = {
  id: '',
  name: '',
  icon: '',
  description: '',
  effect: '',
  maxPoints: 3,
  requires: null,
  bonuses: {},
  passive: false,
  grantedAbility: null,
};

export const CHAPTER_TEMPLATE = {
  id: '',
  number: 1,
  title: '',
  subtitle: '',
  description: '',
  color: '#ffffff',
  objectives: [],
  rewards: { xp: 0, currency: 0 },
  loreReveal: '',
};

export const LOCATION_TEMPLATE = {
  id: '',
  name: '',
  region: '',
  x: 0,
  y: 0,
  description: '',
  lore: '',
  enemyPool: [],
  levelRange: [1, 5],
  type: 'field',
  background: '',
  unlockRequirement: null,
};

export const REGION_TEMPLATE = {
  id: '',
  name: '',
  color: '#ffffff',
  description: '',
  terrainType: '',
  levelRange: [1, 20],
};

export const ATTRIBUTE_NAMES = [
  'Strength', 'Vitality', 'Endurance', 'Dexterity',
  'Agility', 'Intellect', 'Wisdom', 'Tactics'
];

export const EQUIPMENT_SLOTS = ['weapon', 'offhand', 'helmet', 'armor', 'feet', 'ring', 'relic'];

export const ABILITY_TYPES = ['physical', 'magical', 'heal', 'heal_over_time', 'buff', 'debuff'];

export const EFFECT_TYPES = ['dot', 'stun', 'sleep', 'confuse', 'lower_defense', 'lower_attack', 'bleed', 'burn', 'poison'];

export const SCENE_TYPES = ['field', 'dungeon', 'camp', 'trading', 'portal', 'boss', 'city', 'arena'];

export function validateGameSpec(spec) {
  const errors = [];
  if (!spec.meta?.gameName) errors.push('Game name is required');
  if (!spec.meta?.theme) errors.push('Theme is required');
  if (!spec.meta?.setting) errors.push('Setting description is required');
  if (!spec.races || spec.races.length < 2) errors.push('At least 2 races required');
  if (!spec.classes || spec.classes.length < 2) errors.push('At least 2 classes required');
  if (!spec.attributes || spec.attributes.length < 4) errors.push('At least 4 attributes required');
  if (!spec.enemies || spec.enemies.length < 5) errors.push('At least 5 enemies required');
  if (!spec.lore?.prologue) errors.push('Lore prologue is required');
  if (!spec.chapters || spec.chapters.length < 3) errors.push('At least 3 chapters required');
  if (!spec.worldMap?.locations || spec.worldMap.locations.length < 5) errors.push('At least 5 map locations required');
  return { valid: errors.length === 0, errors };
}
