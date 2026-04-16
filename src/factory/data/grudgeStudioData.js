const OS = 'https://molochdagod.github.io/ObjectStore/';

export const GRUDGE_ATTRIBUTES = [
  { base: 'Strength', abbr: 'STR', color: '#ef4444', gains: ['Physical Damage', 'Health', 'Defense', 'Block Chance'] },
  { base: 'Vitality', abbr: 'VIT', color: '#22c55e', gains: ['Max Health', 'HP Regen', 'Bleed Resist', 'Defense'] },
  { base: 'Endurance', abbr: 'END', color: '#6b7280', gains: ['Stamina', 'Defense', 'CC Resistance', 'Block Power'] },
  { base: 'Dexterity', abbr: 'DEX', color: '#f59e0b', gains: ['Crit Chance', 'Accuracy', 'Attack Speed', 'Evasion'] },
  { base: 'Agility', abbr: 'AGI', color: '#06b6d4', gains: ['Speed', 'Evasion', 'Dodge', 'Crit Evasion'] },
  { base: 'Intellect', abbr: 'INT', color: '#3b82f6', gains: ['Magic Damage', 'Mana Pool', 'Cooldown Reduction'] },
  { base: 'Wisdom', abbr: 'WIS', color: '#a855f7', gains: ['Healing Power', 'Magic Defense', 'Status Resist'] },
  { base: 'Tactics', abbr: 'TAC', color: '#64748b', gains: ['Stamina', 'Armor Pen', 'Global Stat Multiplier'] },
];

export const GRUDGE_WEAPON_TYPES = [
  { base: 'sword', slot: '1h', icon: `${OS}icons/weapons/greatsword.png`, statBonus: 'Strength' },
  { base: 'dagger', slot: '1h', icon: `${OS}icons/weapons/dagger.png`, statBonus: 'Dexterity' },
  { base: 'staff', slot: '2h', icon: `${OS}icons/weapons/staff.png`, statBonus: 'Intellect' },
  { base: 'tome', slot: '1h', icon: `${OS}icons/weapons/arcane-tome.png`, statBonus: 'Wisdom' },
  { base: 'shield', slot: 'offhand', icon: `${OS}icons/weapons/shield.png`, statBonus: 'Vitality' },
  { base: 'bow', slot: '2h', icon: `${OS}icons/weapons/kinrend-bow.png`, statBonus: 'Dexterity' },
  { base: 'axe', slot: '1h', icon: `${OS}icons/weapons/kinrend-cleaver.png`, statBonus: 'Strength' },
  { base: 'lance', slot: '2h', icon: `${OS}icons/weapons/shadowpiercer.png`, statBonus: 'Strength' },
  { base: 'hammer', slot: '2h', icon: `${OS}icons/weapons/embermaul.png`, statBonus: 'Endurance' },
  { base: 'gun', slot: '1h', icon: `${OS}icons/weapons/wraithbarrel.png`, statBonus: 'Dexterity' },
  { base: 'crossbow', slot: '2h', icon: `${OS}icons/weapons/emberbolt.png`, statBonus: 'Dexterity' },
  { base: 'relic', slot: '1h', icon: `${OS}icons/weapons/holy-tome.png`, statBonus: 'Wisdom' },
];

export const GRUDGE_SKILL_ICONS = {
  aeromancer: [1, 11, 12, 13].map(n => `${OS}icons/skills/aeromancer_${n}.png`),
  berserker: [1, 11, 12, 13].map(n => `${OS}icons/skills/berserker_${n}.png`),
  cleric: [1, 11, 12, 13].map(n => `${OS}icons/skills/cleric_${n}.png`),
  darkmage: [1, 11, 12, 13].map(n => `${OS}icons/skills/darkmage_${n}.png`),
};

export const GRUDGE_CLASS_ICONS = Array.from({ length: 16 }, (_, i) =>
  `${OS}icons/skill_nobg/Archerskill_${String(i + 1).padStart(2, '0')}_nobg.png`
);

export const GRUDGE_RACE_ICONS = Array.from({ length: 39 }, (_, i) =>
  `${OS}icons/rpg_splash/rpg_splash_${i + 1}.png`
);

export const GRUDGE_ENEMY_ICONS = Array.from({ length: 22 }, (_, i) => {
  const prefix = i < 4 ? 'A_Armor' : 'A_Armour';
  const num = i < 4 ? String(i + 1).padStart(2, '0') : String(i - 3).padStart(2, '0');
  return `${OS}icons/496_rpg_icons/${prefix}${num}.png`;
});

export const GRUDGE_MISC_ICONS = {
  airship: `${OS}icons/wcs/misc/Air Ship.png`,
  biohazard: `${OS}icons/wcs/misc/BioHazard.png`,
};

export const GRUDGE_EFFECTS = [
  { id: 'bleed', label: 'Bleed', color: '#ef4444', type: 'dot', description: 'Deals physical damage over time' },
  { id: 'burn', label: 'Burn', color: '#f97316', type: 'dot', description: 'Deals fire damage over time' },
  { id: 'poison', label: 'Poison', color: '#22c55e', type: 'dot', description: 'Deals toxic damage over time' },
  { id: 'stun', label: 'Stun', color: '#fbbf24', type: 'cc', description: 'Target cannot act for 1 turn' },
  { id: 'confuse', label: 'Confuse', color: '#a855f7', type: 'cc', description: 'Target may attack allies' },
  { id: 'lower_defense', label: 'DEF Down', color: '#f97316', type: 'debuff', description: 'Reduces target defense by 50%' },
  { id: 'lower_attack', label: 'ATK Down', color: '#ef4444', type: 'debuff', description: 'Reduces target damage by 30%' },
];

export const SHIP_STYLES = [
  { id: 'interceptor', name: 'Interceptor', role: 'Fighter', icon: '/images/ships/ship_interceptor.png' },
  { id: 'dreadnought', name: 'Dreadnought', role: 'Battleship', icon: '/images/ships/ship_dreadnought.png' },
  { id: 'corvette', name: 'Corvette', role: 'Light Warship', icon: '/images/ships/ship_corvette.png' },
  { id: 'frigate', name: 'Frigate', role: 'Mid Warship', icon: '/images/ships/ship_frigate.png' },
  { id: 'destroyer', name: 'Destroyer', role: 'Assault Ship', icon: '/images/ships/ship_destroyer.png' },
  { id: 'cruiser', name: 'Cruiser', role: 'Heavy Warship', icon: '/images/ships/ship_cruiser.png' },
  { id: 'carrier', name: 'Carrier', role: 'Capital Ship', icon: '/images/ships/ship_carrier.png' },
  { id: 'scout', name: 'Scout', role: 'Recon Ship', icon: '/images/ships/ship_scout.png' },
  { id: 'gunship', name: 'Gunship', role: 'Heavy Fighter', icon: '/images/ships/ship_gunship.png' },
  { id: 'shuttle', name: 'Shuttle', role: 'Transport', icon: '/images/ships/ship_shuttle.png' },
  { id: 'raider', name: 'Raider', role: 'Pirate Ship', icon: '/images/ships/ship_raider.png' },
  { id: 'corsair', name: 'Corsair', role: 'Pirate Flagship', icon: '/images/ships/ship_corsair.png' },
  { id: 'phantom', name: 'Phantom', role: 'Stealth Ship', icon: '/images/ships/ship_phantom.png' },
  { id: 'titan', name: 'Titan', role: 'Capital Ship', icon: '/images/ships/ship_titan.png' },
  { id: 'viper', name: 'Viper', role: 'Strike Fighter', icon: '/images/ships/ship_viper.png' },
  { id: 'marauder', name: 'Marauder', role: 'Boarding Ship', icon: '/images/ships/ship_marauder.png' },
  { id: 'nebula_runner', name: 'Nebula Runner', role: 'Smuggler', icon: '/images/ships/ship_nebula_runner.png' },
  { id: 'void_walker', name: 'Void Walker', role: 'Alien Ship', icon: '/images/ships/ship_void_walker.png' },
  { id: 'rift_jumper', name: 'Rift Jumper', role: 'Portal Ship', icon: '/images/ships/ship_rift_jumper.png' },
  { id: 'solar_wing', name: 'Solar Wing', role: 'Energy Ship', icon: '/images/ships/ship_solar_wing.png' },
];

export function themeAttributes(baseAttributes, themeMap) {
  return GRUDGE_ATTRIBUTES.map(attr => {
    const themed = themeMap[attr.base] || {};
    return {
      ...attr,
      name: themed.name || attr.base,
      abbr: themed.abbr || attr.abbr,
      description: themed.description || attr.gains.join(', '),
      color: themed.color || attr.color,
    };
  });
}

export function themeWeapons(baseWeapons, themeMap) {
  return GRUDGE_WEAPON_TYPES.map(w => {
    const themed = themeMap[w.base];
    if (!themed) return null;
    return { ...w, name: themed.name, description: themed.description || '', icon: themed.icon || w.icon };
  }).filter(Boolean);
}

export const SHADOW_KNIGHTS_THEME = {
  attributes: {
    Strength: { name: 'Might', abbr: 'MGT', description: 'Raw physical power and melee damage' },
    Vitality: { name: 'Fortitude', abbr: 'FRT', description: 'Life force and survivability' },
    Endurance: { name: 'Resolve', abbr: 'RSV', description: 'Mental and physical stamina' },
    Dexterity: { name: 'Precision', abbr: 'PRC', description: 'Weapon mastery and critical strikes' },
    Agility: { name: 'Swiftness', abbr: 'SWF', description: 'Speed and evasion in combat' },
    Intellect: { name: 'Arcana', abbr: 'ARC', description: 'Mastery of shadow and ember magic' },
    Wisdom: { name: 'Insight', abbr: 'INS', description: 'Planar awareness and healing power' },
    Tactics: { name: 'Command', abbr: 'CMD', description: 'Battlefield leadership and coordination' },
  },
  weapons: {
    sword: { name: 'Shadow Blade', description: 'Umbral-forged longsword' },
    dagger: { name: 'Veil Fang', description: 'Whisper-thin shadow dagger' },
    staff: { name: 'Ember Staff', description: 'Staff crackling with ember fire' },
    tome: { name: 'Veil Grimoire', description: 'Book of planar weaving' },
    shield: { name: 'Iron Bulwark', description: 'Covenant-forged shield' },
    axe: { name: 'Dusk Cleaver', description: 'Shadow-touched war axe' },
    lance: { name: 'Doom Spear', description: 'Cursed throwing lance' },
    bow: { name: 'Shadow Bow', description: 'Bow that fires umbral arrows' },
    hammer: { name: 'Ember Maul', description: 'Molten forge hammer' },
  },
  backgrounds: [
    '/backgrounds/factory/shadow-knights/shadow_ruins.png',
    '/backgrounds/factory/shadow-knights/ember_forge.png',
    '/backgrounds/factory/shadow-knights/umbral_forest.png',
    '/backgrounds/factory/shadow-knights/crystal_cavern.png',
    '/backgrounds/factory/shadow-knights/duskfall_nexus.png',
  ],
};

export const STARBOUND_CORSAIRS_THEME = {
  attributes: {
    Strength: { name: 'Power', abbr: 'PWR', description: 'Physical and melee combat strength' },
    Vitality: { name: 'Hull', abbr: 'HUL', description: 'Shield capacity and damage absorption' },
    Endurance: { name: 'Reactor', abbr: 'RCT', description: 'Energy reserves and damage resistance' },
    Dexterity: { name: 'Targeting', abbr: 'TGT', description: 'Weapon accuracy and critical hit systems' },
    Agility: { name: 'Thrusters', abbr: 'THR', description: 'Movement speed and evasion systems' },
    Intellect: { name: 'Systems', abbr: 'SYS', description: 'Tech damage and rift manipulation' },
    Wisdom: { name: 'Sensors', abbr: 'SNS', description: 'Detection, healing nanobots, and anomaly resistance' },
    Tactics: { name: 'Command', abbr: 'CMD', description: 'Fleet coordination and battle planning' },
  },
  weapons: {
    sword: { name: 'Plasma Blade', description: 'Energy-edged melee weapon' },
    dagger: { name: 'Vibro-Knife', description: 'High-frequency combat knife' },
    staff: { name: 'Ion Staff', description: 'Channeled energy projector' },
    tome: { name: 'Holo-Codex', description: 'Holographic data weapon' },
    shield: { name: 'Shield Generator', description: 'Personal energy barrier' },
    gun: { name: 'Blaster Pistol', description: 'Standard energy sidearm' },
    crossbow: { name: 'Rail Gun', description: 'Electromagnetic accelerator' },
    lance: { name: 'Plasma Lance', description: 'Long-range energy pike' },
    hammer: { name: 'Power Fist', description: 'Augmented melee gauntlet' },
    bow: { name: 'Photon Bow', description: 'Light-energy ranged weapon' },
  },
  backgrounds: [
    '/backgrounds/factory/starbound-corsairs/asteroid_belt.png',
    '/backgrounds/factory/starbound-corsairs/space_station.png',
    '/backgrounds/factory/starbound-corsairs/nebula_field.png',
    '/backgrounds/factory/starbound-corsairs/alien_planet.png',
    '/backgrounds/factory/starbound-corsairs/rift_anomaly.png',
  ],
  ships: SHIP_STYLES,
};
