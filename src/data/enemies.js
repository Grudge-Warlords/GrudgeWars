import { calculateStats } from './attributes.js';
import { classDefinitions } from './classes.js';
import { raceDefinitions } from './races.js';

export const enemyTemplates = {
  goblin: {
    name: 'Puffer Scout', icon: 'sword', color: '#0ea5e9', portrait: '/images/enemies/puffer_scout.png',
    baseHealth: 80, baseDamage: 12, baseDefense: 5, baseMana: 20,
    xpReward: 15, goldReward: 8, speed: 14,
    abilities: [
      { id: 'scratch', name: 'Spine Jab', icon: 'sword', type: 'physical', damage: 1.0, description: 'A quick jab with venomous spines' },
      { id: 'sneak_stab', name: 'Ambush Sting', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Darts in from the murky water to sting' },
    ]
  },
  skeleton: {
    name: 'Barnacle Warrior', icon: 'skull', color: '#94a3b8', portrait: '/images/enemies/barnacle_warrior.png',
    baseHealth: 120, baseDamage: 18, baseDefense: 15, baseMana: 0,
    xpReward: 22, goldReward: 12, speed: 10,
    abilities: [
      { id: 'bone_strike', name: 'Shell Slam', icon: 'skull', type: 'physical', damage: 1.1, description: 'Slams with a barnacle-encrusted fist' },
      { id: 'shield_block', name: 'Shell Guard', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Retreats into a hardened shell', effect: { stat: 'defense', flat: 20, duration: 2 } },
    ]
  },
  wolf: {
    name: 'Barracuda', icon: 'wolf', color: '#64748b', portrait: '/images/enemies/barracuda.png',
    baseHealth: 100, baseDamage: 22, baseDefense: 8, baseMana: 0,
    xpReward: 18, goldReward: 6, speed: 18,
    abilities: [
      { id: 'bite', name: 'Razor Bite', icon: 'sword', type: 'physical', damage: 1.2, description: 'A savage bite with needle-sharp teeth' },
      { id: 'howl_buff', name: 'Predator Surge', icon: 'sparkle', type: 'buff', damage: 0, cooldown: 5, description: 'Enters a feeding frenzy', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  dark_mage: {
    name: 'Ink Sorcerer', icon: 'crystal', color: '#4c1d95', portrait: '/images/enemies/ink_sorcerer.png',
    baseHealth: 90, baseDamage: 25, baseDefense: 6, baseMana: 100,
    xpReward: 30, goldReward: 20, speed: 12,
    abilities: [
      { id: 'shadow_bolt', name: 'Ink Bolt', icon: 'skull', type: 'magical', damage: 1.3, description: 'A bolt of concentrated ink energy' },
      { id: 'dark_nova', name: 'Ink Cloud', icon: 'bomb', type: 'magical', damage: 2.2, cooldown: 3, description: 'An explosion of blinding ink' },
      { id: 'drain_life', name: 'Leech Current', icon: 'crystal', type: 'magical', damage: 0.8, cooldown: 4, description: 'Drains life force through dark currents', drainPercent: 0.5 },
    ]
  },
  dark_knight: {
    name: 'Armored Crab', icon: 'skull', color: '#1e3a5f', portrait: '/images/enemies/armored_crab.png',
    baseHealth: 160, baseDamage: 26, baseDefense: 22, baseMana: 30,
    xpReward: 32, goldReward: 18, speed: 10,
    abilities: [
      { id: 'dk_slash', name: 'Claw Crush', icon: 'sword', type: 'physical', damage: 1.2, description: 'A heavy pincer strike' },
      { id: 'dk_shield', name: 'Carapace Wall', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Raises an impenetrable carapace', effect: { stat: 'defense', flat: 25, duration: 2 } },
      { id: 'dk_crush', name: 'Shell Breaker', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'A crushing overhead claw slam' },
    ]
  },
  shadow_warrior: {
    name: 'Shadow Eel', icon: 'skull', color: '#0f172a', portrait: '/images/enemies/shadow_eel.png',
    baseHealth: 140, baseDamage: 30, baseDefense: 16, baseMana: 40,
    xpReward: 35, goldReward: 20, speed: 14,
    abilities: [
      { id: 'sw_strike', name: 'Electric Strike', icon: 'sword', type: 'physical', damage: 1.3, description: 'A swift shock from the darkness' },
      { id: 'sw_frenzy', name: 'Voltage Surge', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Charges with electric energy', effect: { stat: 'damage', multiplier: 1.5, duration: 2 } },
      { id: 'sw_leap', name: 'Eel Lunge', icon: 'sword', type: 'physical', damage: 2.0, cooldown: 4, description: 'Lunges from the depths with crackling energy' },
    ]
  },
  water_priestess_mage: {
    name: 'Water Priestess', icon: 'ice', color: '#0891b2', portrait: '/images/enemies/water_priestess.png',
    baseHealth: 110, baseDamage: 20, baseMagicDamage: 32, baseDefense: 12, baseMana: 150,
    xpReward: 38, goldReward: 24, speed: 12,
    abilities: [
      { id: 'wp_bolt', name: 'Tidal Strike', icon: 'ice', type: 'magical', damage: 1.3, description: 'A bolt of pressurized water' },
      { id: 'wp_heal', name: 'Healing Tide', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Heals with tidal energy', healPercent: 0.15 },
      { id: 'wp_frost', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Encases in ice', effect: { type: 'stun', duration: 1 } },
    ]
  },
  orc: {
    name: 'Giant Mantis Shrimp', icon: 'sword', color: '#dc2626', portrait: '/images/enemies/mantis_shrimp.png',
    baseHealth: 180, baseDamage: 28, baseDefense: 20, baseMana: 0,
    xpReward: 35, goldReward: 18, speed: 8,
    abilities: [
      { id: 'smash', name: 'Hammer Strike', icon: 'sword', type: 'physical', damage: 1.2, description: 'A devastating claw punch' },
      { id: 'berserk', name: 'Cavitation Rage', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Enters a cavitation-powered frenzy', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'ground_pound', name: 'Seafloor Shatter', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Smashes the ocean floor with tremendous force' },
    ]
  },
  dragon_whelp: {
    name: 'Sea Serpent Hatchling', icon: 'fire', color: '#0d9488', portrait: '/images/enemies/sea_serpent.png',
    baseHealth: 150, baseDamage: 30, baseDefense: 18, baseMana: 80,
    xpReward: 45, goldReward: 30, speed: 15,
    abilities: [
      { id: 'claw', name: 'Fang Snap', icon: 'sword', type: 'physical', damage: 1.1, description: 'A quick snap of serpentine fangs' },
      { id: 'fire_breath', name: 'Toxic Spray', icon: 'fire', type: 'magical', damage: 2.0, cooldown: 3, description: 'Sprays a cloud of venomous water' },
      { id: 'tail_whip', name: 'Tail Lash', icon: 'sparkle', type: 'physical', damage: 1.5, cooldown: 2, description: 'A powerful tail strike through the current' },
    ]
  },
  lich: {
    name: 'Kraken Lich', icon: 'skull', color: '#312e81', portrait: '/images/enemies/kraken_lich.png',
    baseHealth: 700, baseDamage: 40, baseDefense: 22, baseMana: 350,
    xpReward: 120, goldReward: 90, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'soul_bolt', name: 'Abyssal Bolt', icon: 'skull', type: 'magical', damage: 1.4, description: 'A bolt of deep-sea necromantic energy' },
      { id: 'death_coil', name: 'Depth Coil', icon: 'skull', type: 'magical', damage: 2.5, cooldown: 3, description: 'Devastating tentacle blast that drains life', drainPercent: 0.4 },
      { id: 'bone_shield', name: 'Coral Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Summons a shell of ancient coral', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'soul_drain', name: 'Ink Drain', icon: 'crystal', type: 'heal', damage: 0, cooldown: 4, description: 'Drains life from surrounding sea creatures', healPercent: 0.15, drainPercent: 0.5 },
      { id: 'raise_dead', name: 'Raise Drowned', icon: 'skull', type: 'buff', damage: 0, cooldown: 7, description: 'Enrages with the fury of drowned souls', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'shadow_nova', name: 'Ink Nova', icon: 'skull', type: 'magical', damage: 3.0, cooldown: 5, description: 'Unleashes a wave of abyssal ink' },
      { id: 'curse_weakness', name: 'Curse of the Deep', icon: 'skull', type: 'magical', damage: 0.5, cooldown: 4, description: 'Curses with crushing ocean pressure', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  demon_lord: {
    name: 'Volcanic Leviathan', icon: 'fire', color: '#ea580c', portrait: '/images/enemies/demon_lord.png',
    baseHealth: 900, baseDamage: 52, baseDefense: 35, baseMana: 250,
    xpReward: 160, goldReward: 120, speed: 13,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'lava_spit', name: 'Magma Jet', icon: 'fire', type: 'magical', damage: 1.6, description: 'Spews superheated volcanic water' },
      { id: 'worm_bite', name: 'Leviathan Bite', icon: 'sword', type: 'physical', damage: 3.0, cooldown: 4, description: 'A crushing bite from massive jaws' },
      { id: 'heat_wave', name: 'Thermal Surge', icon: 'fire', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates scorching hydrothermal energy', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'volcanic_slam', name: 'Tidal Slam', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'Slams the seafloor with volcanic fury' },
    ]
  },
  evil_wizard: {
    name: 'Abyssal Sorcerer', icon: 'crystal', color: '#7e22ce', portrait: '/images/enemies/abyss_king.png',
    baseHealth: 1400, baseDamage: 65, baseDefense: 35, baseMana: 600,
    xpReward: 350, goldReward: 250, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'arcane_bolt', name: 'Trench Bolt', icon: 'crystal', type: 'magical', damage: 1.6, description: 'A crackling bolt of deep-sea arcane energy' },
      { id: 'chaos_storm', name: 'Maelstrom', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Unleashes a devastating underwater vortex' },
      { id: 'soul_siphon', name: 'Current Siphon', icon: 'crystal', type: 'magical', damage: 1.8, cooldown: 3, description: 'Drains life force through dark currents', drainPercent: 0.6 },
      { id: 'dark_barrier', name: 'Abyssal Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects a barrier of pressurized water', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'necrotic_curse', name: 'Brine Curse', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 4, description: 'Curses with corrosive saltwater decay', effect: { type: 'dot', damage: 0.15, duration: 4 } },
      { id: 'hellfire_rain', name: 'Volcanic Rain', icon: 'fire', type: 'magical', damage: 4.0, cooldown: 6, description: 'Rains superheated vents from the ocean floor' },
      { id: 'petrify', name: 'Coral Encase', icon: 'shield', type: 'magical', damage: 0.5, cooldown: 5, description: 'Encases a hero in rapidly-growing coral', effect: { type: 'stun', duration: 2 } },
      { id: 'dark_empowerment', name: 'Abyssal Empowerment', icon: 'fire', type: 'buff', damage: 0, cooldown: 7, description: 'Channels forbidden deep-sea power', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'shadow_teleport', name: 'Current Warp', icon: 'chaos', type: 'buff', damage: 0, cooldown: 6, description: 'Rides a powerful current to reposition', effect: { stat: 'speed', flat: 20, duration: 2 } },
    ]
  },
  void_king: {
    name: 'The Abyss King', icon: 'crown', color: '#0c4a6e', portrait: '/images/enemies/abyss_king.png',
    baseHealth: 1200, baseDamage: 60, baseDefense: 48, baseMana: 500,
    xpReward: 300, goldReward: 200, speed: 16,
    isBoss: true,
    abilities: [
      { id: 'void_slash', name: 'Trench Slash', icon: 'chaos', type: 'physical', damage: 1.8, description: 'A slash through the crushing depths' },
      { id: 'annihilate', name: 'Tidal Annihilation', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 4, description: 'Pure oceanic destruction unleashed' },
      { id: 'void_barrier', name: 'Pressure Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Impenetrable wall of crushing pressure', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'reality_tear', name: 'Rift Tide', icon: 'chaos', type: 'magical', damage: 4.5, cooldown: 7, description: 'Tears open the ocean floor, devastating all' },
      { id: 'void_drain', name: 'Abyssal Drain', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs life force from the crushing deep', healPercent: 0.12 },
      { id: 'oblivion_pulse', name: 'Depth Pulse', icon: 'sparkle', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates obliterating pressure waves', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'time_stop', name: 'Frozen Current', icon: 'sparkle', type: 'magical', damage: 0.6, cooldown: 6, description: 'Freezes the currents around a hero', effect: { type: 'stun', duration: 2 } },
      { id: 'void_enrage', name: 'Abyss Enrage', icon: 'fire', type: 'buff', damage: 0, cooldown: 8, description: 'The Abyss King enters a furious state', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
    ]
  },
  god_odin: {
    name: 'Poseidon, Lord of Tides', icon: 'lightning', color: '#0284c7', portrait: '/images/enemies/poseidon.png',
    baseHealth: 1800, baseDamage: 75, baseDefense: 55, baseMana: 600,
    xpReward: 500, goldReward: 400, speed: 18,
    isBoss: true,
    isGod: true,
    faction: 'crusade',
    abilities: [
      { id: 'gungnir', name: 'Trident Strike', icon: 'sword', type: 'physical', damage: 2.2, description: 'Hurls the divine trident of the seas' },
      { id: 'thunderclap', name: 'Storm Surge', icon: 'lightning', type: 'magical', damage: 3.8, cooldown: 4, description: 'Lightning crashes through the ocean depths' },
      { id: 'divine_shield', name: 'Tidal Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'An impenetrable barrier of divine water', effect: { stat: 'defense', flat: 80, duration: 3 } },
      { id: 'wisdom_sight', name: 'Ocean Omniscience', icon: 'crystal', type: 'buff', damage: 0, cooldown: 7, description: 'Sees all through the currents, boosting damage', effect: { stat: 'damage', multiplier: 2.2, duration: 3 } },
      { id: 'valkyrie_storm', name: 'Nereid Storm', icon: 'crossed_swords', type: 'magical', damage: 4.5, cooldown: 6, description: 'Summons a storm of divine sea warriors' },
      { id: 'ragnarok', name: 'Deluge', icon: 'fire', type: 'magical', damage: 5.0, cooldown: 8, description: 'Unleashes the great flood upon all' },
      { id: 'divine_heal', name: 'Tidal Restoration', icon: 'sparkle', type: 'heal', damage: 0, cooldown: 5, description: 'Restores vitality through the healing seas', healPercent: 0.15 },
      { id: 'time_freeze', name: 'Whirlpool Trap', icon: 'sparkle', type: 'magical', damage: 0.8, cooldown: 5, description: 'Traps a hero in a swirling whirlpool', effect: { type: 'stun', duration: 2 } },
    ]
  },
  god_madra: {
    name: 'Charybdis, The Devourer', icon: 'target', color: '#be123c', portrait: '/images/enemies/charybdis.png',
    baseHealth: 2000, baseDamage: 82, baseDefense: 45, baseMana: 500,
    xpReward: 500, goldReward: 400, speed: 17,
    isBoss: true,
    isGod: true,
    faction: 'legion',
    abilities: [
      { id: 'blood_rend', name: 'Maw Rend', icon: 'target', type: 'physical', damage: 2.0, description: 'Tears flesh with crushing mandibles' },
      { id: 'soul_devour', name: 'Soul Devour', icon: 'skull', type: 'magical', damage: 3.5, cooldown: 4, description: 'Consumes a hero\'s essence in the whirlpool', drainPercent: 0.5 },
      { id: 'corruption_aura', name: 'Toxic Tide', icon: 'skull', type: 'magical', damage: 1.5, cooldown: 3, description: 'Radiates poisonous ocean currents', effect: { type: 'dot', damage: 0.18, duration: 4 } },
      { id: 'blood_frenzy', name: 'Feeding Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 6, description: 'Enters a blood-mad feeding frenzy', effect: { stat: 'damage', multiplier: 2.5, duration: 3 } },
      { id: 'death_grip', name: 'Whirlpool Grip', icon: 'sword', type: 'magical', damage: 1.2, cooldown: 5, description: 'Grips a hero in an inescapable vortex', effect: { type: 'stun', duration: 2 } },
      { id: 'apocalypse', name: 'Cataclysm', icon: 'bomb', type: 'magical', damage: 5.5, cooldown: 8, description: 'Brings forth total oceanic annihilation' },
      { id: 'vampiric_feast', name: 'Devouring Feast', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feasts on prey to heal wounds', healPercent: 0.18 },
      { id: 'plague_wave', name: 'Blight Wave', icon: 'skull', type: 'magical', damage: 2.8, cooldown: 5, description: 'A wave of toxic blight washes over all' },
    ]
  },
  god_omni: {
    name: 'The Leviathan, Weaver of Currents', icon: 'sparkle', color: '#7c3aed', portrait: '/images/enemies/leviathan.png',
    baseHealth: 1600, baseDamage: 70, baseDefense: 60, baseMana: 800,
    xpReward: 500, goldReward: 400, speed: 20,
    isBoss: true,
    isGod: true,
    faction: 'fabled',
    abilities: [
      { id: 'arcane_blast', name: 'Current Blast', icon: 'sparkle', type: 'magical', damage: 2.0, description: 'A blast of pure ocean arcane energy' },
      { id: 'fate_weave', name: 'Current Weave', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Rewrites the tides to deal massive damage' },
      { id: 'cosmic_barrier', name: 'Tidal Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'A barrier woven from bioluminescent light', effect: { stat: 'defense', flat: 70, duration: 3 } },
      { id: 'time_warp', name: 'Current Warp', icon: 'sparkle', type: 'magical', damage: 1.0, cooldown: 5, description: 'Warps the currents around a hero', effect: { type: 'stun', duration: 2 } },
      { id: 'stellar_rain', name: 'Biolume Rain', icon: 'sparkle', type: 'magical', damage: 4.8, cooldown: 6, description: 'Bioluminescent projectiles rain from the depths' },
      { id: 'genesis', name: 'Genesis Tide', icon: 'sparkle', type: 'magical', damage: 5.5, cooldown: 9, description: 'Unmakes and reshapes the ocean itself' },
      { id: 'cosmic_heal', name: 'Deep Restoration', icon: 'crystal', type: 'heal', damage: 0, cooldown: 5, description: 'Draws healing from the deepest currents', healPercent: 0.14 },
      { id: 'mind_shatter', name: 'Pressure Crush', icon: 'mind', type: 'magical', damage: 2.5, cooldown: 4, description: 'Crushes the mind with abyssal pressure', effect: { type: 'dot', damage: 0.20, duration: 3 } },
    ]
  },
  water_elemental: {
    name: 'Grand Water Elemental', icon: 'ice', color: '#06b6d4', portrait: '/images/enemies/water_elemental.png',
    baseHealth: 550, baseDamage: 50, baseDefense: 38, baseMana: 300,
    xpReward: 175, goldReward: 120, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'tidal_strike', name: 'Tidal Strike', icon: 'ice', type: 'magical', damage: 1.4, description: 'A crashing wave of water' },
      { id: 'torrent', name: 'Torrent', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'A devastating torrent that poisons', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'frost_armor', name: 'Frost Armor', icon: 'ice', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in ice armor', effect: { stat: 'defense', flat: 45, duration: 3 } },
      { id: 'tsunami', name: 'Tsunami', icon: 'chaos', type: 'magical', damage: 3.5, cooldown: 6, description: 'A massive wave crashes down on all' },
      { id: 'healing_tide', name: 'Healing Tide', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Heals with the power of the tides', healPercent: 0.18 },
      { id: 'frozen_prison', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Freezes a hero solid', effect: { type: 'stun', duration: 1 } },
    ]
  },
  nature_elemental: {
    name: 'Coral Elemental', icon: 'nature', color: '#f472b6', portrait: '/images/enemies/nature_elemental.png',
    baseHealth: 600, baseDamage: 44, baseDefense: 42, baseMana: 250,
    xpReward: 175, goldReward: 120, speed: 12,
    isBoss: true,
    abilities: [
      { id: 'vine_lash', name: 'Coral Lash', icon: 'nature', type: 'physical', damage: 1.3, description: 'Sharp coral tendrils whip out' },
      { id: 'natures_wrath', name: "Ocean's Wrath", icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'The fury of the reef unleashed', effect: { type: 'dot', damage: 0.18, duration: 3 } },
      { id: 'regenerate', name: 'Reef Regenerate', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Regenerates health from coral growth', healPercent: 0.20 },
      { id: 'earthquake', name: 'Seafloor Quake', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'The ocean floor splits apart, hitting all heroes' },
      { id: 'thorn_armor', name: 'Coral Armor', icon: 'nature', type: 'buff', damage: 0, cooldown: 5, description: 'Sharp coral reflects damage to attackers', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'root_bind', name: 'Kelp Bind', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Kelp entangles a hero, stunning them', effect: { type: 'stun', duration: 1 } },
    ]
  },
  grand_shaman: {
    name: 'Reef Shaman', icon: 'nature', color: '#059669', portrait: '/images/enemies/grand_shaman.png',
    baseHealth: 500, baseDamage: 32, baseDefense: 18, baseMana: 200,
    xpReward: 80, goldReward: 55, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'nature_bolt', name: 'Coral Bolt', icon: 'nature', type: 'magical', damage: 1.3, description: 'A bolt of concentrated reef energy' },
      { id: 'healing_rain', name: 'Healing Current', icon: 'bow', type: 'heal', damage: 0, cooldown: 4, description: 'Calls healing currents to restore vitality', healPercent: 0.18 },
      { id: 'thorn_burst', name: 'Urchin Burst', icon: 'nature', type: 'magical', damage: 2.2, cooldown: 3, description: 'Sea urchin spines erupt from the seafloor', effect: { type: 'dot', damage: 0.10, duration: 3 } },
      { id: 'bark_shield', name: 'Coral Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in hardened coral', effect: { stat: 'defense', flat: 30, duration: 3 } },
      { id: 'entangle', name: 'Kelp Snare', icon: 'nature', type: 'magical', damage: 0.6, cooldown: 5, description: 'Kelp tendrils grab and hold a hero', effect: { type: 'stun', duration: 1 } },
    ]
  },
  canyon_warlord: {
    name: 'Trench Warlord', icon: 'crossed_swords', color: '#991b1b', portrait: '/images/enemies/lobster_warlord.png',
    baseHealth: 650, baseDamage: 38, baseDefense: 28, baseMana: 50,
    xpReward: 95, goldReward: 65, speed: 10,
    isBoss: true,
    abilities: [
      { id: 'cleave', name: 'Trench Cleave', icon: 'axe', type: 'physical', damage: 1.4, description: 'A massive cleaving strike through the water' },
      { id: 'war_cry', name: 'Battle Roar', icon: 'sword', type: 'buff', damage: 0, cooldown: 5, description: 'Sends shockwaves through the deep', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'skull_crusher', name: 'Depth Crusher', icon: 'skull', type: 'physical', damage: 2.8, cooldown: 4, description: 'A devastating pressure-powered smash' },
      { id: 'iron_skin', name: 'Pressure Shell', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Hardens shell under extreme pressure', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'bloodlust', name: 'Blood Current', icon: 'target', type: 'physical', damage: 1.6, cooldown: 3, description: 'Frenzied strikes that drain life through the currents', drainPercent: 0.3 },
    ]
  },
  frost_wyrm: {
    name: 'Frost Serpent', icon: 'ice', color: '#22d3ee', portrait: '/images/enemies/frost_wyrm.png',
    baseHealth: 750, baseDamage: 42, baseDefense: 30, baseMana: 200,
    xpReward: 110, goldReward: 80, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'ice_fang', name: 'Ice Fang', icon: 'sword', type: 'physical', damage: 1.3, description: 'Freezing bite from arctic waters' },
      { id: 'blizzard_breath', name: 'Frost Jet', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes a devastating jet of freezing water', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'ice_armor', name: 'Glacial Shell', icon: 'ice', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in thick glacial armor', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'glacial_slam', name: 'Glacial Slam', icon: 'crystal', type: 'physical', damage: 3.0, cooldown: 5, description: 'Slams the seafloor creating ice spikes' },
      { id: 'freeze', name: 'Deep Freeze', icon: 'ice', type: 'magical', damage: 0.8, cooldown: 4, description: 'Freezes a hero solid in arctic water', effect: { type: 'stun', duration: 1 } },
      { id: 'frost_heal', name: 'Frost Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs cold ocean water to heal', healPercent: 0.12 },
    ]
  },
  shadow_beast: {
    name: 'Shadow Shark', icon: 'skull', color: '#581c87', portrait: '/images/enemies/shadow_manta.png',
    baseHealth: 800, baseDamage: 45, baseDefense: 25, baseMana: 250,
    xpReward: 130, goldReward: 90, speed: 15,
    isBoss: true,
    abilities: [
      { id: 'shadow_claw', name: 'Shadow Fin', icon: 'skull', type: 'physical', damage: 1.4, description: 'Razor fins made of living shadow' },
      { id: 'dark_pulse', name: 'Dark Current', icon: 'crystal', type: 'magical', damage: 2.4, cooldown: 3, description: 'A pulse of dark energy through the water', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'shadow_veil', name: 'Murk Veil', icon: 'chaos', type: 'buff', damage: 0, cooldown: 5, description: 'Wraps in murky shadows increasing defense', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'devour', name: 'Devour', icon: 'fire', type: 'physical', damage: 2.0, cooldown: 4, description: 'Devours life force from a hero', drainPercent: 0.4 },
      { id: 'nightmare', name: 'Abyssal Terror', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 5, description: 'Traps a hero in deep-sea terror', effect: { type: 'stun', duration: 1 } },
      { id: 'shadow_mend', name: 'Shadow Mend', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feeds on darkness to heal', healPercent: 0.14 },
    ]
  },
  forest_guardian: {
    name: 'Guardian of the Reef', icon: 'nature', color: '#2dd4bf', portrait: '/images/enemies/kelp_giant.png',
    baseHealth: 280, baseDamage: 28, baseDefense: 18, baseMana: 120,
    xpReward: 50, goldReward: 35, speed: 11,
    abilities: [
      { id: 'nature_strike', name: 'Coral Strike', icon: 'nature', type: 'physical', damage: 1.1, description: 'A coral-armed charge attack' },
      { id: 'forest_heal', name: 'Reef Heal', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Channels the reef to heal wounds', healPercent: 0.15 },
      { id: 'poison_spore', name: 'Venom Cloud', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 3, description: 'Releases a cloud of sea venom', effect: { type: 'dot', damage: 0.12, duration: 3 } },
    ]
  },
  corrupted_grove_keeper: {
    name: 'Corrupted Reef Keeper', icon: 'crystal', color: '#0d9488', portrait: '/images/enemies/kelp_giant.png',
    baseHealth: 600, baseDamage: 35, baseDefense: 20, baseMana: 300,
    xpReward: 100, goldReward: 70, speed: 12,
    isBoss: true,
    bossScale: 3.0,
    abilities: [
      { id: 'corrupted_bolt', name: 'Corrupted Bolt', icon: 'skull', type: 'magical', damage: 1.3, description: 'A bolt of corrupted ocean magic' },
      { id: 'verdant_stun', name: 'Kelp Stun', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Entangling kelp stuns a hero in place', effect: { type: 'stun', duration: 1 } },
      { id: 'grove_fireball', name: 'Biolume Blast', icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'Hurls a massive bioluminescent blast of corrupted energy' },
      { id: 'resurrect_guardian', name: 'Resurrect Guardian', icon: 'heart', type: 'resurrect', damage: 0, cooldown: 6, description: 'Channels dark ocean magic to resurrect a fallen Guardian', isResurrect: true },
      { id: 'dark_bloom', name: 'Dark Bloom', icon: 'nature', type: 'magical', damage: 1.8, cooldown: 4, description: 'Toxic algae blooms dealing damage and reducing defense', effect: { stat: 'defense', flat: -15, duration: 3 } },
    ]
  },
  void_sentinel: {
    name: 'Void Angler', icon: 'crystal', color: '#7c3aed', portrait: '/images/enemies/void_sentinel.png',
    baseHealth: 1000, baseDamage: 55, baseDefense: 42, baseMana: 400,
    xpReward: 200, goldReward: 150, speed: 13,
    isBoss: true,
    abilities: [
      { id: 'void_strike', name: 'Angler Strike', icon: 'chaos', type: 'physical', damage: 1.5, description: 'A strike with bioluminescent lure energy' },
      { id: 'reality_rift', name: 'Depth Rift', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'Tears open a rift in the ocean floor' },
      { id: 'void_shield', name: 'Angler Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects an impenetrable deep-sea barrier', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'entropy_pulse', name: 'Lure Pulse', icon: 'sparkle', type: 'magical', damage: 2.0, cooldown: 3, description: 'Radiates hypnotic bioluminescent energy', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'dimensional_lock', name: 'Depth Lock', icon: 'sparkle', type: 'magical', damage: 0.8, cooldown: 5, description: 'Locks a hero in crushing pressure', effect: { type: 'stun', duration: 2 } },
      { id: 'void_siphon', name: 'Deep Siphon', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Siphons energy from the deep to heal', healPercent: 0.13 },
      { id: 'null_burst', name: 'Pressure Burst', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 6, description: 'Unleashes a burst of crushing pressure' },
    ]
  },
  abyssal_demon: {
    name: 'Abyssal Leviathan', icon: 'fire', color: '#b91c1c', portrait: '/images/enemies/demon_lord.png',
    baseHealth: 1600, baseDamage: 72, baseDefense: 40, baseMana: 400,
    xpReward: 400, goldReward: 300, speed: 15,
    isBoss: true,
    bossScale: 2.2,
    abilities: [
      { id: 'demon_cleave', name: 'Abyssal Cleave', icon: 'axe', type: 'physical', damage: 2.0, description: 'A massive cleave from the abyss' },
      { id: 'hellfire_eruption', name: 'Vent Eruption', icon: 'fire', type: 'magical', damage: 3.5, cooldown: 4, description: 'Volcanic vents erupt under all heroes' },
      { id: 'demon_roar', name: 'Leviathan Roar', icon: 'skull', type: 'buff', damage: 0, cooldown: 5, description: 'Roars with abyssal fury, boosting damage', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'soul_crush', name: 'Depth Crush', icon: 'skull', type: 'physical', damage: 4.0, cooldown: 6, description: 'Crushes with the weight of the deep ocean' },
      { id: 'abyssal_drain', name: 'Abyssal Drain', icon: 'skull', type: 'magical', damage: 2.0, cooldown: 4, description: 'Drains life through dark ocean magic', drainPercent: 0.5 },
      { id: 'infernal_shield', name: 'Hydrothermal Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Wraps in superheated vent armor', effect: { stat: 'defense', flat: 55, duration: 3 } },
      { id: 'demon_stun', name: 'Abyssal Gaze', icon: 'crystal', type: 'magical', damage: 1.0, cooldown: 5, description: 'Paralyzes a hero with bioluminescent gaze', effect: { type: 'stun', duration: 2 } },
    ]
  },
  eldritch_horror: {
    name: 'The Deep Horror', icon: 'chaos', color: '#065f46', portrait: '/images/enemies/void_sentinel.png',
    baseHealth: 1800, baseDamage: 68, baseDefense: 35, baseMana: 500,
    xpReward: 450, goldReward: 350, speed: 12,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'tentacle_lash', name: 'Tentacle Lash', icon: 'skull', type: 'physical', damage: 1.8, description: 'Lashes out with massive tentacles' },
      { id: 'madness_wave', name: 'Madness Wave', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'A wave of deep-sea madness washes over all', effect: { type: 'dot', damage: 0.16, duration: 4 } },
      { id: 'eldritch_scream', name: 'Abyssal Scream', icon: 'skull', type: 'magical', damage: 1.2, cooldown: 5, description: 'A scream from the depths that stuns with terror', effect: { type: 'stun', duration: 2 } },
      { id: 'void_consumption', name: 'Void Consumption', icon: 'chaos', type: 'magical', damage: 2.5, cooldown: 3, description: 'Consumes a hero with crushing pressure', drainPercent: 0.6 },
      { id: 'cosmic_regeneration', name: 'Deep Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Regenerates through abyssal energy', healPercent: 0.16 },
      { id: 'reality_shatter', name: 'Trench Shatter', icon: 'bomb', type: 'magical', damage: 4.5, cooldown: 7, description: 'Shatters the ocean floor itself' },
      { id: 'abyssal_armor', name: 'Abyssal Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Encases in otherworldly deep-sea armor', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'mind_flay', name: 'Pressure Flay', icon: 'crystal', type: 'magical', damage: 2.2, cooldown: 4, description: 'Flays the mind with crushing ocean pressure' },
    ]
  },
  frost_titan: {
    name: 'Frost Leviathan', icon: 'ice', color: '#67e8f9', portrait: '/images/enemies/frost_titan.png',
    baseHealth: 1500, baseDamage: 65, baseDefense: 50, baseMana: 350,
    xpReward: 380, goldReward: 280, speed: 10,
    isBoss: true,
    bossScale: 2.0,
    abilities: [
      { id: 'frost_smash', name: 'Glacial Smash', icon: 'ice', type: 'physical', damage: 2.2, description: 'A devastating icy deep-sea smash' },
      { id: 'absolute_zero', name: 'Absolute Zero', icon: 'ice', type: 'magical', damage: 3.8, cooldown: 5, description: 'Drops temperature to absolute zero in the deep' },
      { id: 'ice_prison', name: 'Ice Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Encases a hero in unbreakable deep-sea ice', effect: { type: 'stun', duration: 2 } },
      { id: 'glacial_armor', name: 'Glacial Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Hardens into impenetrable glacial armor', effect: { stat: 'defense', flat: 65, duration: 3 } },
      { id: 'frost_breath', name: 'Frost Current', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes devastating frozen currents', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'permafrost_heal', name: 'Permafrost', icon: 'heart', type: 'heal', damage: 0, cooldown: 6, description: 'Draws power from eternal ice to heal', healPercent: 0.14 },
      { id: 'avalanche', name: 'Ice Cascade', icon: 'bomb', type: 'physical', damage: 4.0, cooldown: 6, description: 'Summons a cascade of ice to crush all heroes' },
    ]
  },
  flying_eye: {
    name: 'Jellyfish Scout', icon: 'crystal', color: '#c084fc', portrait: '/images/enemies/jellyfish_eye.png',
    baseHealth: 70, baseDamage: 16, baseDefense: 4, baseMana: 40,
    xpReward: 14, goldReward: 7, speed: 19,
    abilities: [
      { id: 'eye_beam', name: 'Sting Beam', icon: 'crystal', type: 'magical', damage: 1.2, description: 'A focused beam of bioluminescent energy' },
      { id: 'dive_attack', name: 'Tentacle Dive', icon: 'energy', type: 'physical', damage: 1.6, cooldown: 3, description: 'Dives down trailing venomous tentacles' },
    ]
  },
  mushroom: {
    name: 'Sea Urchin', icon: 'nature', color: '#a855f7', portrait: '/images/enemies/sea_mushroom.png',
    baseHealth: 90, baseDamage: 10, baseDefense: 8, baseMana: 60,
    xpReward: 13, goldReward: 6, speed: 8,
    abilities: [
      { id: 'spore_slap', name: 'Spine Slap', icon: 'nature', type: 'physical', damage: 0.9, description: 'A slap with venomous spines' },
      { id: 'toxic_spore', name: 'Toxic Spine', icon: 'skull', type: 'magical', damage: 0.6, cooldown: 3, description: 'Releases toxic spine fragments that poison', effect: { type: 'dot', damage: 0.10, duration: 3 } },
    ]
  },
  skeleton_knight: {
    name: 'Shell Knight', icon: 'skull', color: '#64748b', portrait: '/images/enemies/barnacle_warrior.png',
    baseHealth: 160, baseDamage: 22, baseDefense: 20, baseMana: 0,
    xpReward: 28, goldReward: 15, speed: 9,
    abilities: [
      { id: 'sword_slash', name: 'Shell Slash', icon: 'crossed_swords', type: 'physical', damage: 1.2, description: 'A heavy slash with a shell blade' },
      { id: 'shield_wall', name: 'Shell Wall', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Raises shell to block attacks', effect: { stat: 'defense', flat: 25, duration: 2 } },
      { id: 'bone_breaker', name: 'Shell Breaker', icon: 'skull', type: 'physical', damage: 2.0, cooldown: 4, description: 'A devastating overhead shell strike' },
    ]
  },
  shadow_bat: {
    name: 'Moray Eel', icon: 'energy', color: '#4c1d95', portrait: '/images/enemies/shadow_manta.png',
    baseHealth: 55, baseDamage: 14, baseDefense: 3, baseMana: 30,
    xpReward: 12, goldReward: 5, speed: 22,
    abilities: [
      { id: 'wing_slash', name: 'Coil Slash', icon: 'energy', type: 'physical', damage: 0.9, description: 'Slashes with razor-sharp fangs from a crevice' },
      { id: 'sonic_screech', name: 'Echolocation Pulse', icon: 'energy', type: 'magical', damage: 1.4, cooldown: 3, description: 'A disorienting pulse that rattles the senses', effect: { type: 'dot', damage: 0.08, duration: 2 } },
      { id: 'blood_drain', name: 'Venom Drain', icon: 'target', type: 'physical', damage: 1.1, cooldown: 4, description: 'Latches on and drains with venomous bite', drainPercent: 0.6 },
    ]
  },
  imp: {
    name: 'Pufferfish Imp', icon: 'fire', color: '#0891b2', portrait: '/images/enemies/sea_devil.png',
    baseHealth: 65, baseDamage: 11, baseDefense: 4, baseMana: 50,
    xpReward: 13, goldReward: 7, speed: 17,
    abilities: [
      { id: 'imp_scratch', name: 'Spine Scratch', icon: 'fire', type: 'physical', damage: 0.8, description: 'Quick spines rake across flesh' },
      { id: 'hex_bolt', name: 'Toxin Bolt', icon: 'crystal', type: 'magical', damage: 1.5, cooldown: 3, description: 'A toxic bolt that weakens the target', effect: { stat: 'defense', flat: -10, duration: 2 } },
      { id: 'imp_frenzy', name: 'Puff Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Inflates into a spiny frenzy, boosting damage', effect: { stat: 'damage', multiplier: 1.5, duration: 2 } },
    ]
  },
  mimic: {
    name: 'Mimic Clam', icon: 'shield', color: '#0e7490', portrait: '/images/enemies/ocean_mimic.png',
    baseHealth: 200, baseDamage: 26, baseDefense: 22, baseMana: 80,
    xpReward: 40, goldReward: 35, speed: 7,
    abilities: [
      { id: 'jaw_snap', name: 'Shell Snap', icon: 'sword', type: 'physical', damage: 1.3, description: 'Enormous shell halves snap shut on the target' },
      { id: 'tongue_lash', name: 'Siphon Lash', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'A whip-like siphon lashes out with stunning force', effect: { type: 'stun', duration: 1 } },
      { id: 'devour_gold', name: 'Pearl Snatch', icon: 'gold', type: 'physical', damage: 2.2, cooldown: 4, description: 'Snaps hard and steals pearls from the hero' },
      { id: 'iron_shell', name: 'Pearl Shell', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Retreats into its shell, hardening its defenses', effect: { stat: 'defense', flat: 35, duration: 3 } },
    ]
  },
  crow_knight: {
    name: 'Swordfish Knight', icon: 'sword', color: '#1e3a5f', portrait: '/images/enemies/swordfish_knight.png',
    baseHealth: 170, baseDamage: 24, baseDefense: 16, baseMana: 40,
    xpReward: 32, goldReward: 18, speed: 16,
    abilities: [
      { id: 'talon_strike', name: 'Bill Strike', icon: 'sword', type: 'physical', damage: 1.1, description: 'A swift blade-nose slash guided by predator instinct' },
      { id: 'dive_bomb', name: 'Depth Charge', icon: 'energy', type: 'physical', damage: 2.2, cooldown: 3, description: 'Launches from the deep and crashes down with force' },
      { id: 'murder_flock', name: 'School Swarm', icon: 'energy', type: 'magical', damage: 1.4, cooldown: 4, description: 'Summons a swarm of fish that slash and blind', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'shadow_feint', name: 'Current Feint', icon: 'skull', type: 'buff', damage: 0, cooldown: 5, description: 'Blends with the current, increasing evasion', effect: { stat: 'damage', multiplier: 1.4, duration: 2 } },
    ]
  },
  stone_guardian: {
    name: 'Coral Guardian', icon: 'shield', color: '#f472b6', portrait: '/images/enemies/stone_guardian.png',
    baseHealth: 250, baseDamage: 20, baseDefense: 30, baseMana: 60,
    xpReward: 38, goldReward: 22, speed: 6,
    abilities: [
      { id: 'stone_fist', name: 'Coral Fist', icon: 'sword', type: 'physical', damage: 1.2, description: 'A heavy fist of living coral crushes down' },
      { id: 'petrify_gaze', name: 'Hypnotic Gaze', icon: 'crystal', type: 'magical', damage: 0.6, cooldown: 5, description: 'Eyes glow with bioluminescence, stunning a hero', effect: { type: 'stun', duration: 1 } },
      { id: 'quake_slam', name: 'Reef Slam', icon: 'shield', type: 'physical', damage: 2.0, cooldown: 4, description: 'Slams the reef causing a localized tremor' },
      { id: 'fortify', name: 'Reef Fortify', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Channels ancient reef magic to harden its body', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'crumble_curse', name: 'Erosion Curse', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 4, description: 'Curses a hero with saltwater decay, eroding armor', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
};

export const locations = [
  {
    id: 'verdant_plains',
    name: 'Coral Shallows',
    description: 'Peaceful shallow reefs teeming with colorful fish. A good place to begin your underwater journey.',
    levelRange: [1, 3],
    enemies: ['goblin', 'wolf', 'mushroom', 'imp', 'shadow_bat'],
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #0891b2 100%)',
    icon: 'nature',
    unlocked: true,
    boss: null,
    enemyCount: [2, 2],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [1, 2] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [1, 3] },
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [1, 2] },
    ],
  },
  {
    id: 'dark_forest',
    name: 'Kelp Forest',
    description: 'Towering kelp fronds block out the light above. Dangerous creatures lurk in every shadow.',
    levelRange: [3, 5],
    enemies: ['wolf', 'goblin', 'skeleton', 'mushroom', 'flying_eye', 'shadow_bat', 'imp'],
    bgGradient: 'linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #0f766e 100%)',
    icon: 'nature',
    unlocked: true,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [3, 5] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [3, 4] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [3, 5] },
    ],
  },
  {
    id: 'mystic_grove',
    name: 'Anemone Garden',
    description: 'A mystical garden of giant sea anemones where ancient magic hums through the currents.',
    levelRange: [4, 6],
    enemies: ['goblin', 'wolf', 'dark_mage', 'mushroom', 'flying_eye', 'imp'],
    bgGradient: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #22d3ee 100%)',
    icon: 'crystal',
    unlocked: false,
    unlockLevel: 3,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'purple_betta', classId: 'mage', levelRange: [4, 6] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [4, 5] },
      { raceId: 'blue_betta', classId: 'worge', levelRange: [4, 6] },
    ],
  },
  {
    id: 'whispering_caverns',
    name: 'Biolume Caves',
    description: 'Twisting underwater caverns lit by bioluminescent organisms. Strange echoes ripple through the water.',
    levelRange: [3, 5],
    enemies: ['goblin', 'skeleton', 'flying_eye', 'shadow_bat', 'mimic'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 50%, #164e63 100%)',
    icon: 'chaos',
    unlocked: false,
    unlockLevel: 3,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [3, 4] },
    ],
  },
  {
    id: 'haunted_marsh',
    name: 'Sargasso Maze',
    description: 'A tangled maze of sargassum seaweed where lost creatures drift endlessly. The dead float among the fronds.',
    levelRange: [5, 7],
    enemies: ['skeleton', 'dark_mage', 'wolf', 'mushroom', 'flying_eye', 'shadow_bat'],
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0c4a6e 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 4,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [5, 7] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [5, 6] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [5, 7] },
    ],
  },
  {
    id: 'cursed_ruins',
    name: 'Ancient Ruins',
    description: 'The sunken remnants of a lost civilization, now haunted by spectral sea creatures and dark ocean magic.',
    levelRange: [6, 9],
    enemies: ['skeleton', 'dark_mage', 'skeleton_knight', 'mimic', 'crow_knight', 'dark_knight', 'shadow_warrior'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 5,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [6, 8] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [6, 9] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [7, 9] },
    ],
  },
  {
    id: 'crystal_caves',
    name: 'Crystal Grotto',
    description: 'Glittering underwater caverns filled with crystalline formations. Ancient sea dwarves carved these halls.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'goblin', 'orc', 'skeleton_knight', 'mimic', 'stone_guardian', 'water_priestess_mage'],
    bgGradient: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)',
    icon: 'crystal',
    unlocked: false,
    unlockLevel: 6,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'gold_betta', classId: 'ranger', levelRange: [7, 8] },
    ],
  },
  {
    id: 'thornwood_pass',
    name: 'Tide Stream',
    description: 'A treacherous underwater passage swept by powerful tidal currents. Ambushes are common along this narrow channel.',
    levelRange: [6, 8],
    enemies: ['wolf', 'goblin', 'orc', 'mushroom', 'crow_knight', 'imp'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
    icon: 'nature',
    unlocked: false,
    unlockLevel: 5,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 1,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'ranger', levelRange: [6, 8] },
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [6, 8] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [6, 7] },
    ],
  },
  {
    id: 'sunken_temple',
    name: 'Sunken Wreck',
    description: 'An ancient shipwreck resting on the ocean floor. A powerful reef shaman guards the inner hull.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'dark_mage', 'goblin', 'skeleton_knight', 'flying_eye', 'mimic', 'stone_guardian', 'water_priestess_mage'],
    bgGradient: 'linear-gradient(135deg, #155e75 0%, #164e63 50%, #0e7490 100%)',
    icon: 'shield',
    unlocked: false,
    unlockLevel: 6,
    boss: 'grand_shaman',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'blue_betta', classId: 'mage', levelRange: [8, 9] },
    ],
  },
  {
    id: 'iron_peaks',
    name: 'Coral Fortress',
    description: 'Rugged coral formations where rival sea creatures clash over territory and precious resources.',
    levelRange: [8, 11],
    enemies: ['orc', 'skeleton', 'dark_mage', 'stone_guardian', 'crow_knight', 'dark_knight'],
    bgGradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #115e59 100%)',
    icon: 'hammer',
    unlocked: false,
    unlockLevel: 7,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [8, 10] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [9, 11] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [8, 11] },
    ],
  },
  {
    id: 'blood_canyon',
    name: 'Thermal Vent',
    description: 'A scorching hydrothermal vent field stained by mineral deposits. A brutal trench warlord commands the stronghold.',
    levelRange: [9, 12],
    enemies: ['orc', 'skeleton', 'dark_mage', 'crow_knight', 'dark_knight', 'shadow_warrior'],
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #431407 100%)',
    icon: 'shield',
    unlocked: false,
    unlockLevel: 8,
    boss: 'canyon_warlord',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [9, 12] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [9, 11] },
      { raceId: 'red_betta', classId: 'ranger', levelRange: [10, 12] },
    ],
  },
  {
    id: 'frozen_tundra',
    name: 'Frozen Depths',
    description: 'Endless frigid waters where ice formations drift and a mighty frost serpent rules the darkness below.',
    levelRange: [10, 13],
    enemies: ['orc', 'skeleton', 'dark_mage', 'shadow_bat', 'water_priestess_mage'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #7dd3fc 50%, #bae6fd 100%)',
    icon: 'ice',
    unlocked: false,
    unlockLevel: 9,
    boss: 'frost_wyrm',
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'green_betta', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'blue_betta', classId: 'mage', levelRange: [11, 13] },
    ],
  },
  {
    id: 'dragon_peaks',
    name: 'Sea Serpent Nest',
    description: 'Volcanic underwater peaks where young sea serpents nest. The water burns with each breath.',
    levelRange: [11, 14],
    enemies: ['dragon_whelp', 'orc', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #0f766e 100%)',
    icon: 'fire',
    unlocked: false,
    unlockLevel: 10,
    boss: 'water_elemental',
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'green_betta', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  {
    id: 'ashen_battlefield',
    name: 'Sandy Wastes',
    description: 'Barren ocean floor littered with the remnants of ancient battles. Scavengers and drifters roam freely.',
    levelRange: [10, 13],
    enemies: ['orc', 'skeleton', 'dark_mage', 'crow_knight', 'stone_guardian'],
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #475569 50%, #334155 100%)',
    icon: 'crossed_swords',
    unlocked: false,
    unlockLevel: 9,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'green_betta', classId: 'ranger', levelRange: [11, 13] },
    ],
  },
  {
    id: 'windswept_ridge',
    name: 'Current Ridge',
    description: 'A narrow underwater ridge battered by relentless ocean currents. Only the hardiest survive the crossing.',
    levelRange: [11, 14],
    enemies: ['orc', 'dragon_whelp', 'dark_mage', 'crow_knight'],
    bgGradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0c4a6e 100%)',
    icon: 'energy',
    unlocked: false,
    unlockLevel: 10,
    boss: null,
    enemyCount: [2, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'green_betta', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'gold_betta', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  {
    id: 'molten_core',
    name: 'Volcanic Core',
    description: 'Deep volcanic vents where rivers of magma meet the ocean. Superheated water and fire creatures thrive.',
    levelRange: [12, 14],
    enemies: ['dragon_whelp', 'orc', 'dark_mage'],
    bgGradient: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #7f1d1d 100%)',
    icon: 'fire',
    unlocked: false,
    unlockLevel: 11,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [12, 14] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [12, 14] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [12, 14] },
    ],
  },
  {
    id: 'shadow_forest',
    name: 'Mushroom Forest',
    description: 'An otherworldly underwater forest of giant fungi corrupted by dark magic. Shadows move with malicious intent.',
    levelRange: [12, 15],
    enemies: ['dark_mage', 'orc', 'skeleton', 'mushroom', 'flying_eye', 'shadow_bat', 'crow_knight'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 11,
    boss: 'corrupted_grove_keeper',
    bossAdds: ['forest_guardian', 'forest_guardian'],
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [12, 15] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [12, 14] },
      { raceId: 'blue_betta', classId: 'worge', levelRange: [13, 15] },
    ],
  },
  {
    id: 'obsidian_wastes',
    name: 'Obsidian Wastes',
    description: 'A desolate underwater volcanic wasteland of black glass and ash. Nothing grows here but hatred and toxic vents.',
    levelRange: [13, 15],
    enemies: ['orc', 'dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 12,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'green_betta', classId: 'mage', levelRange: [13, 15] },
    ],
  },
  {
    id: 'ruins_of_ashenmoor',
    name: 'Ruins of the Deep',
    description: 'The sunken remains of an ancient deep-sea city destroyed by volcanic eruptions. Dark spirits haunt the rubble.',
    levelRange: [13, 16],
    enemies: ['skeleton', 'dark_mage', 'orc', 'skeleton_knight', 'mimic', 'stone_guardian'],
    bgGradient: 'linear-gradient(135deg, #164e63 0%, #0e7490 50%, #1e293b 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 12,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [13, 16] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [14, 16] },
    ],
  },
  {
    id: 'blight_hollow',
    name: 'Blight Hollow',
    description: 'A toxic underwater trench where poisonous chemicals seep from the seafloor. Corrosion and decay consume everything.',
    levelRange: [14, 16],
    enemies: ['dark_mage', 'skeleton', 'orc', 'mushroom', 'skeleton_knight', 'imp'],
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #042f2e 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 13,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [14, 16] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [14, 16] },
    ],
  },
  {
    id: 'shadow_citadel',
    name: 'Shadow Citadel',
    description: 'A fortress of pure darkness on the ocean floor. The Kraken Lich commands undead armies from within its black walls.',
    levelRange: [14, 17],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #000000 100%)',
    icon: 'shield',
    unlocked: false,
    unlockLevel: 13,
    boss: 'lich',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [15, 17] },
    ],
  },
  {
    id: 'stormspire_peak',
    name: 'Maelstrom Peak',
    description: 'An underwater mountain summit perpetually caught in a churning maelstrom. Raw elemental energy crackles through the water.',
    levelRange: [14, 17],
    enemies: ['dark_mage', 'dragon_whelp', 'orc', 'skeleton_knight', 'flying_eye', 'crow_knight'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #0369a1 100%)',
    icon: 'lightning',
    unlocked: false,
    unlockLevel: 13,
    boss: null,
    enemyCount: [3, 3],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'purple_betta', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [15, 17] },
    ],
  },
  {
    id: 'demon_gate',
    name: 'Leviathan Lair',
    description: 'A massive underwater cavern where the barrier between worlds grows thin. Sea monsters pour through the cracks.',
    levelRange: [15, 18],
    enemies: ['dark_mage', 'dragon_whelp', 'orc', 'skeleton_knight', 'crow_knight', 'imp'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
    icon: 'chaos',
    unlocked: false,
    unlockLevel: 14,
    boss: 'demon_lord',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [15, 18] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [15, 17] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [16, 18] },
    ],
  },
  {
    id: 'abyssal_depths',
    name: 'Abyssal Trench',
    description: 'Lightless trenches that plunge into the deepest void. Reality warps in the suffocating darkness.',
    levelRange: [16, 18],
    enemies: ['dark_mage', 'orc', 'dragon_whelp', 'shadow_bat', 'mimic'],
    bgGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #000000 100%)',
    icon: 'chaos',
    unlocked: false,
    unlockLevel: 15,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [16, 18] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [16, 18] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [17, 18] },
    ],
  },
  {
    id: 'infernal_forge',
    name: 'Infernal Forge',
    description: 'A volcanic underwater forge where superheated water meets magma. The hiss of cursed metal echoes endlessly.',
    levelRange: [16, 18],
    enemies: ['orc', 'dark_mage', 'dragon_whelp', 'stone_guardian'],
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)',
    icon: 'hammer',
    unlocked: false,
    unlockLevel: 15,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'gold_betta', classId: 'worge', levelRange: [16, 18] },
    ],
  },
  {
    id: 'dreadmaw_canyon',
    name: 'Dreadmaw Canyon',
    description: 'A massive underwater ravine filled with the bones of ancient sea beasts. The canyon itself seems alive and hungry.',
    levelRange: [17, 19],
    enemies: ['dark_mage', 'orc', 'dragon_whelp', 'crow_knight', 'mimic'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #2e1065 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 16,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [17, 19] },
    ],
  },
  {
    id: 'void_threshold',
    name: 'Void Threshold',
    description: 'The edge of the known ocean. A Void Angler guards the passage to the realm beyond the deepest trenches.',
    levelRange: [17, 19],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #000000 100%)',
    icon: 'crystal',
    unlocked: false,
    unlockLevel: 16,
    boss: 'void_sentinel',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [18, 19] },
    ],
  },
  {
    id: 'corrupted_spire',
    name: 'Corrupted Spire',
    description: 'A twisted underwater tower of pure evil that rises from the ocean floor. Dark energy radiates from every coral stone.',
    levelRange: [18, 20],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)',
    icon: 'fire',
    unlocked: false,
    unlockLevel: 17,
    boss: null,
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [18, 20] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [18, 20] },
    ],
  },
  {
    id: 'void_throne',
    name: 'Abyssal Throne',
    description: 'Beyond the deepest trench sits the Abyss King on his throne of darkness. This is the final battle.',
    levelRange: [18, 20],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #020617 0%, #0c4a6e 50%, #000000 100%)',
    icon: 'crown',
    unlocked: false,
    unlockLevel: 18,
    boss: 'void_king',
    enemyCount: [3, 4],
    allyCount: 2,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [18, 20] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [19, 20] },
    ],
  },
  {
    id: 'hall_of_odin',
    name: 'Temple of Poseidon',
    description: 'The grand underwater temple where Poseidon, Lord of Tides, awaits those who dare challenge divine authority. Only true Crusade champions may enter.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #0c4a6e 100%)',
    icon: 'lightning',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['grand_shaman', 'frost_wyrm'],
    boss: 'god_odin',
    isGodFight: true,
    faction: 'crusade',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'blue_betta', classId: 'mage', levelRange: [20, 20] },
    ],
  },
  {
    id: 'maw_of_madra',
    name: 'Maw of Charybdis',
    description: 'A churning whirlpool of blood and shadow where Charybdis, The Devourer, feasts on mortal souls. Only those who conquered the Legion may survive.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #be123c 50%, #450a0a 100%)',
    icon: 'target',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['shadow_beast', 'lich'],
    boss: 'god_madra',
    isGodFight: true,
    faction: 'legion',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [19, 20] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [20, 20] },
    ],
  },
  {
    id: 'sanctum_of_omni',
    name: 'Sanctum of the Leviathan',
    description: 'A realm beyond mortal comprehension where The Leviathan, Weaver of Currents, reshapes the ocean at will. Only Fabled champions may challenge destiny.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'dragon_whelp'],
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #1e1b4b 100%)',
    icon: 'sparkle',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['canyon_warlord', 'water_elemental'],
    boss: 'god_omni',
    isGodFight: true,
    faction: 'fabled',
    enemyCount: [3, 4],
    allyCount: 3,
    raceClassEnemies: [
      { raceId: 'purple_betta', classId: 'mage', levelRange: [19, 20] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [19, 20] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [20, 20] },
    ],
  }
];

const ZONE_TERRAIN_MAP = {
  verdant_plains: 'green', dark_forest: 'green', eldergrove: 'green', misty_marshes: 'green',
  haunted_graveyard: 'purple', cursed_ruins: 'purple', shadow_forest: 'purple',
  necropolis: 'purple', dreadmaw_canyon: 'purple', abyssal_depths: 'purple',
  void_threshold: 'purple', void_throne: 'purple', corrupted_spire: 'purple',
  crystal_caves: 'blue', sunken_temple: 'blue', frozen_tundra: 'blue',
  frost_haven: 'blue', stormspire_peak: 'blue',
  ironhold_mines: 'red', blood_canyon: 'red', molten_core: 'red',
  obsidian_wastes: 'red', ruins_of_ashenmoor: 'red', demon_gate: 'red',
  infernal_forge: 'red', dragon_peaks: 'red',
  silver_citadel: 'gold', blight_hollow: 'green',
  hall_of_odin: 'gold', maw_of_madra: 'red', sanctum_of_omni: 'purple',
};

export function getZoneTerrain(locationId) {
  return ZONE_TERRAIN_MAP[locationId] || 'green';
}

export function createEnemy(templateId, playerLevel) {
  const template = enemyTemplates[templateId];
  if (!template) return null;

  const levelScale = 1 + (playerLevel * 0.15);
  return {
    id: `enemy_${templateId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    templateId,
    name: template.name,
    icon: template.icon,
    color: template.color,
    team: 'enemy',
    isPlayerControlled: false,
    classId: null,
    maxHealth: Math.floor(template.baseHealth * levelScale),
    health: Math.floor(template.baseHealth * levelScale),
    physicalDamage: Math.floor(template.baseDamage * levelScale),
    magicDamage: Math.floor((template.baseMagicDamage || 0) * levelScale),
    defense: Math.floor(template.baseDefense * levelScale),
    mana: template.baseMana,
    maxMana: template.baseMana,
    stamina: 100,
    maxStamina: 100,
    speed: (template.speed || 12) + Math.floor(Math.random() * 6),
    abilities: template.abilities.map(a => ({ ...a, currentCooldown: 0 })),
    cooldowns: {},
    xpReward: Math.floor(template.xpReward * levelScale),
    goldReward: Math.floor(template.goldReward * levelScale),
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    isBoss: !!template.isBoss,
    bossScale: template.bossScale || null,
    level: playerLevel,
    critChance: 5,
    criticalDamage: 50,
    evasion: 3,
    block: 0,
    blockEffect: 0,
    damageReduction: 0,
    drainHealth: 0,
    healthRegen: 0,
    manaRegen: 0,
    defenseBreak: 0,
    criticalEvasion: 0,
  };
}

const enemyNamePools = {
  blue_betta: ['Aldric', 'Cedric', 'Roland', 'Gareth', 'Edmund', 'Leland', 'Oswin', 'Theron', 'Brant', 'Corin', 'Hilda', 'Elara', 'Maren', 'Solene', 'Brenna'],
  red_betta: ['Grimgor', 'Thrakk', 'Mogash', 'Durgol', 'Zargoth', 'Gruumak', 'Borzag', 'Kragoth', 'Ulgath', 'Nazgul', 'Gorsha', 'Drukha', 'Vreka', 'Skara', 'Bolgra'],
  purple_betta: ['Eldrin', 'Aeris', 'Thalion', 'Caelum', 'Lyris', 'Faelon', 'Sylvar', 'Ilmenor', 'Aranthi', 'Mirael', 'Elowen', 'Niamh', 'Seraphel', 'Arwen', 'Celebris'],
  white_betta: ['Morthos', 'Vexran', 'Calcifer', 'Dreadmaw', 'Necroth', 'Ashfall', 'Rotjaw', 'Grimsoul', 'Bonechill', 'Plagus', 'Withera', 'Morbella', 'Shadewyn', 'Crypta', 'Graviss'],
  green_betta: ['Wulfgar', 'Thorin', 'Bjorn', 'Ragnar', 'Ulfric', 'Skald', 'Fenrir', 'Hrothgar', 'Torvald', 'Draken', 'Sigrid', 'Astrid', 'Freya', 'Brynhild', 'Thyra'],
  gold_betta: ['Durak', 'Balin', 'Gromli', 'Thorek', 'Bardin', 'Kazak', 'Gimrik', 'Dwalin', 'Thundrik', 'Grolmak', 'Helga', 'Magna', 'Bruni', 'Kethra', 'Dagni'],
  human: ['Aldric', 'Cedric', 'Roland', 'Gareth', 'Edmund', 'Leland', 'Oswin', 'Theron', 'Brant', 'Corin', 'Hilda', 'Elara', 'Maren', 'Solene', 'Brenna'],
  orc: ['Grimgor', 'Thrakk', 'Mogash', 'Durgol', 'Zargoth', 'Gruumak', 'Borzag', 'Kragoth', 'Ulgath', 'Nazgul', 'Gorsha', 'Drukha', 'Vreka', 'Skara', 'Bolgra'],
  elf: ['Eldrin', 'Aeris', 'Thalion', 'Caelum', 'Lyris', 'Faelon', 'Sylvar', 'Ilmenor', 'Aranthi', 'Mirael', 'Elowen', 'Niamh', 'Seraphel', 'Arwen', 'Celebris'],
  undead: ['Morthos', 'Vexran', 'Calcifer', 'Dreadmaw', 'Necroth', 'Ashfall', 'Rotjaw', 'Grimsoul', 'Bonechill', 'Plagus', 'Withera', 'Morbella', 'Shadewyn', 'Crypta', 'Graviss'],
  barbarian: ['Wulfgar', 'Thorin', 'Bjorn', 'Ragnar', 'Ulfric', 'Skald', 'Fenrir', 'Hrothgar', 'Torvald', 'Draken', 'Sigrid', 'Astrid', 'Freya', 'Brynhild', 'Thyra'],
  dwarf: ['Durak', 'Balin', 'Gromli', 'Thorek', 'Bardin', 'Kazak', 'Gimrik', 'Dwalin', 'Thundrik', 'Grolmak', 'Helga', 'Magna', 'Bruni', 'Kethra', 'Dagni'],
};

const classPrimaryStats = {
  warrior: ['Strength', 'Vitality', 'Endurance'],
  mage: ['Intellect', 'Wisdom', 'Vitality'],
  ranger: ['Dexterity', 'Agility', 'Tactics'],
  worge: ['Strength', 'Dexterity', 'Agility', 'Intellect'],
};

function generateEnemyName(raceId, classId) {
  const pool = enemyNamePools[raceId] || enemyNamePools.blue_betta;
  const firstName = pool[Math.floor(Math.random() * pool.length)];
  const raceDef = raceDefinitions[raceId];
  const classDef = classDefinitions[classId];
  const raceName = raceDef ? raceDef.name : 'Unknown';
  const className = classDef ? classDef.name : 'Fighter';
  return `${firstName} the ${raceName} ${className}`;
}

function generateAttributePoints(classId, raceId, level) {
  const classDef = classDefinitions[classId];
  const raceDef = raceDefinitions[raceId];
  if (!classDef || !raceDef) return {};

  const attrs = { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 };

  Object.entries(classDef.startingAttributes).forEach(([attr, val]) => {
    attrs[attr] += val;
  });

  Object.entries(raceDef.bonuses).forEach(([attr, val]) => {
    attrs[attr] += val;
  });

  const extraPoints = level * 2;
  const primary = classPrimaryStats[classId] || ['Strength', 'Vitality'];
  const allAttrs = Object.keys(attrs);

  for (let i = 0; i < extraPoints; i++) {
    if (Math.random() < 0.7) {
      const stat = primary[Math.floor(Math.random() * primary.length)];
      attrs[stat] += 1;
    } else {
      const stat = allAttrs[Math.floor(Math.random() * allAttrs.length)];
      attrs[stat] += 1;
    }
  }

  return attrs;
}

function selectAbilities(classId, level, isBoss) {
  const classDef = classDefinitions[classId];
  if (!classDef) return [];

  const allAbilities = [...classDef.abilities];

  if (isBoss && classDef.signatureAbility) {
    allAbilities.push(classDef.signatureAbility);
    return allAbilities.map(a => ({ ...a, currentCooldown: 0 }));
  }

  const maxAbilities = Math.min(3 + Math.floor(level / 5), allAbilities.length);
  const selected = allAbilities.slice(0, maxAbilities);
  return selected.map(a => ({ ...a, currentCooldown: 0 }));
}

export function createRaceClassEnemy(raceId, classId, level, options = {}) {
  const classDef = classDefinitions[classId];
  const raceDef = raceDefinitions[raceId];
  if (!classDef || !raceDef) return null;

  const isBoss = !!options.isBoss;
  const effectiveLevel = isBoss ? level + 5 : level;
  const scaleFactor = isBoss ? 1.4 : 0.75;

  const attributePoints = generateAttributePoints(classId, raceId, effectiveLevel);
  const rawStats = calculateStats(attributePoints, effectiveLevel);

  const health = Math.floor(rawStats.health * scaleFactor * (isBoss ? 1.5 : 1));
  const physDmg = Math.floor(rawStats.physicalDamage * scaleFactor * (isBoss ? 1.2 : 1));
  const magDmg = Math.floor(rawStats.magicDamage * scaleFactor * (isBoss ? 1.2 : 1));
  const def = Math.floor(rawStats.defense * scaleFactor);
  const mana = Math.floor(rawStats.mana * scaleFactor);
  const stamina = Math.floor(rawStats.stamina * scaleFactor);

  const abilities = selectAbilities(classId, level, isBoss);
  const name = options.name || generateEnemyName(raceId, classId);

  const xpBase = 10 + level * 8;
  const goldBase = 5 + level * 5;

  return {
    id: `enemy_${raceId}_${classId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    icon: classDef.icon,
    color: raceDef.color,
    team: 'enemy',
    isPlayerControlled: false,
    raceId,
    classId,
    maxHealth: health,
    health,
    physicalDamage: physDmg,
    magicDamage: magDmg,
    defense: def,
    mana,
    maxMana: mana,
    stamina,
    maxStamina: stamina,
    speed: 10 + Math.floor(rawStats.movementSpeed || 0) + Math.floor(Math.random() * 4),
    abilities,
    cooldowns: {},
    xpReward: Math.floor((isBoss ? xpBase * 3 : xpBase) * (1 + level * 0.05)),
    goldReward: Math.floor((isBoss ? goldBase * 3 : goldBase) * (1 + level * 0.05)),
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    isBoss,
    level,
    critChance: Math.min(rawStats.criticalChance * scaleFactor, 40),
    criticalDamage: rawStats.criticalDamage || 50,
    evasion: Math.min(rawStats.evasion * scaleFactor, 30),
    block: rawStats.block * scaleFactor,
    blockEffect: rawStats.blockEffect * scaleFactor,
    damageReduction: rawStats.damageReduction * scaleFactor,
    drainHealth: rawStats.drainHealth * scaleFactor,
    healthRegen: rawStats.healthRegen * scaleFactor,
    manaRegen: rawStats.manaRegen * scaleFactor,
    defenseBreak: rawStats.defenseBreak * scaleFactor,
    criticalEvasion: rawStats.criticalEvasion * scaleFactor,
    attributePoints,
  };
}

const zoneEnemyPresets = {
  verdant_plains: {
    levelRange: [1, 3],
    presets: [
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [1, 2] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [1, 3] },
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [1, 2] },
    ],
  },
  dark_forest: {
    levelRange: [3, 5],
    presets: [
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [3, 5] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [3, 4] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [3, 5] },
    ],
  },
  mystic_grove: {
    levelRange: [4, 6],
    presets: [
      { raceId: 'purple_betta', classId: 'mage', levelRange: [4, 6] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [4, 5] },
      { raceId: 'blue_betta', classId: 'worge', levelRange: [4, 6] },
    ],
  },
  whispering_caverns: {
    levelRange: [3, 5],
    presets: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [3, 5] },
      { raceId: 'blue_betta', classId: 'ranger', levelRange: [3, 4] },
    ],
  },
  haunted_marsh: {
    levelRange: [5, 7],
    presets: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [5, 7] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [5, 6] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [5, 7] },
    ],
  },
  cursed_ruins: {
    levelRange: [6, 9],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [6, 8] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [6, 9] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [7, 9] },
    ],
  },
  thornwood_pass: {
    levelRange: [6, 8],
    presets: [
      { raceId: 'red_betta', classId: 'ranger', levelRange: [6, 8] },
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [6, 8] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [6, 7] },
    ],
  },
  crystal_caves: {
    levelRange: [7, 9],
    presets: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'gold_betta', classId: 'ranger', levelRange: [7, 8] },
    ],
  },
  sunken_temple: {
    levelRange: [7, 9],
    presets: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [7, 9] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [7, 9] },
      { raceId: 'blue_betta', classId: 'mage', levelRange: [8, 9] },
    ],
  },
  iron_peaks: {
    levelRange: [8, 11],
    presets: [
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [8, 10] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [9, 11] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [8, 11] },
    ],
  },
  blood_canyon: {
    levelRange: [9, 12],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [9, 12] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [9, 11] },
      { raceId: 'red_betta', classId: 'ranger', levelRange: [10, 12] },
    ],
  },
  frozen_tundra: {
    levelRange: [10, 13],
    presets: [
      { raceId: 'green_betta', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'blue_betta', classId: 'mage', levelRange: [11, 13] },
    ],
  },
  ashen_battlefield: {
    levelRange: [10, 13],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [10, 13] },
      { raceId: 'blue_betta', classId: 'warrior', levelRange: [10, 12] },
      { raceId: 'green_betta', classId: 'ranger', levelRange: [11, 13] },
    ],
  },
  windswept_ridge: {
    levelRange: [11, 14],
    presets: [
      { raceId: 'green_betta', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'gold_betta', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  dragon_peaks: {
    levelRange: [11, 14],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [11, 14] },
      { raceId: 'green_betta', classId: 'ranger', levelRange: [11, 13] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [12, 14] },
    ],
  },
  molten_core: {
    levelRange: [12, 14],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [12, 14] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [12, 14] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [12, 14] },
    ],
  },
  shadow_forest: {
    levelRange: [12, 15],
    presets: [
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [12, 15] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [12, 14] },
      { raceId: 'blue_betta', classId: 'worge', levelRange: [13, 15] },
    ],
  },
  obsidian_wastes: {
    levelRange: [13, 15],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'green_betta', classId: 'mage', levelRange: [13, 15] },
    ],
  },
  ruins_of_ashenmoor: {
    levelRange: [13, 16],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [13, 16] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [13, 15] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [14, 16] },
    ],
  },
  blight_hollow: {
    levelRange: [14, 16],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [14, 16] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [14, 16] },
    ],
  },
  shadow_citadel: {
    levelRange: [14, 17],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'white_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'purple_betta', classId: 'ranger', levelRange: [15, 17] },
    ],
  },
  stormspire_peak: {
    levelRange: [14, 17],
    presets: [
      { raceId: 'purple_betta', classId: 'mage', levelRange: [14, 17] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [14, 16] },
      { raceId: 'gold_betta', classId: 'warrior', levelRange: [15, 17] },
    ],
  },
  demon_gate: {
    levelRange: [15, 18],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [15, 18] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [15, 17] },
      { raceId: 'white_betta', classId: 'mage', levelRange: [16, 18] },
    ],
  },
  abyssal_depths: {
    levelRange: [16, 18],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [16, 18] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [16, 18] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [17, 18] },
    ],
  },
  infernal_forge: {
    levelRange: [16, 18],
    presets: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [16, 18] },
      { raceId: 'gold_betta', classId: 'worge', levelRange: [16, 18] },
    ],
  },
  dreadmaw_canyon: {
    levelRange: [17, 19],
    presets: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'red_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'green_betta', classId: 'worge', levelRange: [17, 19] },
    ],
  },
  void_threshold: {
    levelRange: [17, 19],
    presets: [
      { raceId: 'white_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [17, 19] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [18, 19] },
    ],
  },
  corrupted_spire: {
    levelRange: [18, 20],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [18, 20] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [18, 20] },
    ],
  },
  void_throne: {
    levelRange: [18, 20],
    presets: [
      { raceId: 'white_betta', classId: 'mage', levelRange: [18, 20] },
      { raceId: 'green_betta', classId: 'warrior', levelRange: [18, 20] },
      { raceId: 'red_betta', classId: 'worge', levelRange: [19, 20] },
    ],
  },
};

export function getZoneEnemyPresets(zoneId) {
  return zoneEnemyPresets[zoneId] || null;
}
