export const BETTA_WARLORDS_SPEC = {
  meta: {
    gameName: 'Betta Warlords',
    studioName: 'Grudge Studios',
    tagline: 'Where Magic Sleeps in Three Vessels',
    version: '1.0.0',
    theme: 'underwater-freshwater-rpg',
    setting: 'A vast underwater freshwater kingdom called Abyssia, built on root groves, deep trenches, volcanic vents, and frozen depths. Betta fish are the warrior race fighting to restore balance.',
    artStyle: 'pixel',
    colorPalette: {
      primary: '#06b6d4',
      secondary: '#a855f7',
      accent: '#f59e0b',
      danger: '#ef4444',
      background: '#050a18',
      text: '#e2e8f0',
    },
    fonts: { heading: 'Cinzel', body: 'Jost' },
    currency: { name: 'Pearls', icon: 'pearl', plural: 'Pearls' },
    resources: [
      { name: 'Root', icon: 'wood', description: 'Tangled root fiber from ancient groves' },
      { name: 'Shells', icon: 'shell', description: 'Hardened shells from the reef beds' },
      { name: 'Algae', icon: 'herb', description: 'Bioluminescent algae clusters' },
      { name: 'Crystals', icon: 'gem', description: 'Deep pressure crystals from volcanic vents' },
    ],
  },

  raceCount: 8,
  classCount: 4,
  attributeCount: 8,
  enemyCount: 30,
  bossCount: 3,
  locationCount: 32,
  chapterCount: 8,
  skillTierCount: 4,
  equipmentTierCount: 8,

  raceSummaries: [
    { name: 'Halfmoon', color: 'Blue/Cyan', trait: 'Balanced +1 all stats', role: 'Generalist' },
    { name: 'Plakat', color: 'Red', trait: 'Blood Frenzy', role: 'Berserker' },
    { name: 'Doubletail', color: 'Purple', trait: 'Arcane Depths', role: 'Mage' },
    { name: 'Cambodian', color: 'White/Silver', trait: 'Phantom Scales', role: 'Tank' },
    { name: 'Giant', color: 'Green', trait: 'Reef Fury', role: 'Bruiser' },
    { name: 'Crowntail', color: 'Gold', trait: 'Royal Guard', role: 'Defender' },
    { name: 'Dragonscale', color: 'Orange', trait: 'Thermal Dash', role: 'Speed DPS' },
    { name: 'Butterfly', color: 'Pink', trait: 'Healing Tide', role: 'Healer' },
  ],

  classSummaries: [
    { name: 'Bruiser', role: 'Frontline Tank/DPS', transform: 'Leviathan Form', resource: 'Stamina' },
    { name: 'Mystic', role: 'Caster/Healer', transform: 'Bubble Shield', resource: 'Mana' },
    { name: 'Vesselist', role: 'Shapeshifter', transform: 'Shark Form', resource: 'Mana+Stamina' },
    { name: 'Ranger', role: 'Precision Striker', transform: 'Elite Form', resource: 'Stamina' },
  ],

  loreSummary: {
    centralConflict: 'Three vessels of magic sustained all life. The Plankton Magic went silent, shattering the Root Crown and driving the Gorgon Sirens mad. Betta Warlords must restore balance.',
    factions: ['Betta (Fire of Will)', 'Gorgons (Weight of Law)', 'Plankton (Light of Unity)'],
    bossNames: ['Scylla', 'Medusa', 'Charybdis'],
    regions: ['Root Groves', 'Kelp Forests', 'Volcanic Vents', 'Frozen Depths', 'The Abyss'],
  },

  battleSystem: {
    type: 'turn-based',
    positioning: '4-row (Front/Mid-Front/Mid-Back/Back)',
    initiative: 'speed-based',
    partySize: 4,
    effects: ['bleed', 'burn', 'poison', 'stun', 'sleep', 'confuse', 'lower_defense', 'lower_attack'],
    mechanics: ['guardian-intercept', 'transformation', 'skill-tree-passives', 'weapon-skills'],
  },
};
