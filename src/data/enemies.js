import { calculateStats } from './attributes.js';
import { classDefinitions } from './classes.js';
import { raceDefinitions } from './races.js';

export const enemyTemplates = {
  shield_droid: {
    name: 'Shield Droid', icon: 'shield', color: '#64748b', portrait: '/sprites/shield_droid/idle.png',
    baseHealth: 300, baseDamage: 25, baseDefense: 50, baseMana: 100,
    xpReward: 80, goldReward: 40, speed: 8,
    isBoss: false,
    isBlocker: true,
    abilities: [
      { id: 'shock_pulse', name: 'Shock Pulse', icon: 'lightning', type: 'magical', damage: 1.2, description: 'Emits a crackling electric pulse' },
      { id: 'shield_bash', name: 'Shield Bash', icon: 'shield', type: 'physical', damage: 1.4, cooldown: 3, description: 'Charges forward with energy shield for a devastating bash' },
      { id: 'energy_barrier', name: 'Energy Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Activates a temporary energy barrier boosting defense', effect: { stat: 'defense', flat: 30, duration: 3 } },
    ]
  },
  goblin: {
    name: 'Grove Bandit', icon: 'sword', color: '#0ea5e9', portrait: '/images/enemies/puffer_scout.png',
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
    name: 'Mantis Shrimp', icon: 'wolf', color: '#64748b', portrait: '/images/enemies/barracuda.png',
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
    name: 'Abyssal Knight', icon: 'skull', color: '#1e3a5f', portrait: '/images/enemies/armored_crab.png',
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
    name: 'Root Priestess', icon: 'ice', color: '#0891b2', portrait: '/images/enemies/water_priestess.png',
    baseHealth: 110, baseDamage: 20, baseMagicDamage: 32, baseDefense: 12, baseMana: 150,
    xpReward: 38, goldReward: 24, speed: 12,
    abilities: [
      { id: 'wp_bolt', name: 'Current Strike', icon: 'ice', type: 'magical', damage: 1.3, description: 'A bolt of pressurized water' },
      { id: 'wp_heal', name: 'Healing Current', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Heals with current energy', healPercent: 0.15 },
      { id: 'wp_frost', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Encases in ice', effect: { type: 'stun', duration: 1 } },
    ]
  },
  orc: {
    name: 'Hammerhead Brute', icon: 'sword', color: '#dc2626', portrait: '/images/enemies/mantis_shrimp.png',
    baseHealth: 180, baseDamage: 28, baseDefense: 20, baseMana: 0,
    xpReward: 35, goldReward: 18, speed: 8,
    abilities: [
      { id: 'smash', name: 'Hammer Strike', icon: 'sword', type: 'physical', damage: 1.2, description: 'A devastating claw punch' },
      { id: 'berserk', name: 'Cavitation Rage', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Enters a cavitation-powered frenzy', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'ground_pound', name: 'Lakebed Shatter', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Smashes the lakebed with tremendous force' },
    ]
  },
  dragon_whelp: {
    name: 'River Drake', icon: 'fire', color: '#0d9488', portrait: '/images/enemies/sea_serpent.png',
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
      { id: 'soul_bolt', name: 'Abyssal Bolt', icon: 'skull', type: 'magical', damage: 1.4, description: 'A bolt of deepwater necromantic energy' },
      { id: 'death_coil', name: 'Depth Coil', icon: 'skull', type: 'magical', damage: 2.5, cooldown: 3, description: 'Devastating tentacle blast that drains life', drainPercent: 0.4 },
      { id: 'bone_shield', name: 'Root Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Summons a shell of ancient root', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'soul_drain', name: 'Ink Drain', icon: 'crystal', type: 'heal', damage: 0, cooldown: 4, description: 'Drains life from surrounding water creatures', healPercent: 0.15, drainPercent: 0.5 },
      { id: 'raise_dead', name: 'Raise Drowned', icon: 'skull', type: 'buff', damage: 0, cooldown: 7, description: 'Enrages with the fury of drowned souls', effect: { stat: 'damage', multiplier: 1.6, duration: 3 } },
      { id: 'shadow_nova', name: 'Ink Nova', icon: 'skull', type: 'magical', damage: 3.0, cooldown: 5, description: 'Unleashes a wave of abyssal ink' },
      { id: 'curse_weakness', name: 'Curse of the Deep', icon: 'skull', type: 'magical', damage: 0.5, cooldown: 4, description: 'Curses with crushing water pressure', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  demon_lord: {
    name: 'Leviathan', icon: 'fire', color: '#ea580c', portrait: '/images/enemies/demon_lord.png',
    baseHealth: 900, baseDamage: 52, baseDefense: 35, baseMana: 250,
    xpReward: 160, goldReward: 120, speed: 13,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'lava_spit', name: 'Magma Jet', icon: 'fire', type: 'magical', damage: 1.6, description: 'Spews superheated volcanic water' },
      { id: 'worm_bite', name: 'Leviathan Bite', icon: 'sword', type: 'physical', damage: 3.0, cooldown: 4, description: 'A crushing bite from massive jaws' },
      { id: 'heat_wave', name: 'Thermal Surge', icon: 'fire', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates scorching hydrothermal energy', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'volcanic_slam', name: 'Current Slam', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'Slams the lakebed with volcanic fury' },
    ]
  },
  evil_wizard: {
    name: 'Void Sorcerer', icon: 'crystal', color: '#7e22ce', portrait: '/images/enemies/abyss_king.png',
    baseHealth: 1400, baseDamage: 65, baseDefense: 35, baseMana: 600,
    xpReward: 350, goldReward: 250, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'arcane_bolt', name: 'Trench Bolt', icon: 'crystal', type: 'magical', damage: 1.6, description: 'A crackling bolt of deepwater arcane energy' },
      { id: 'chaos_storm', name: 'Maelstrom', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Unleashes a devastating underwater vortex' },
      { id: 'soul_siphon', name: 'Current Siphon', icon: 'crystal', type: 'magical', damage: 1.8, cooldown: 3, description: 'Drains life force through dark currents', drainPercent: 0.6 },
      { id: 'dark_barrier', name: 'Abyssal Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects a barrier of pressurized water', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'necrotic_curse', name: 'Brine Curse', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 4, description: 'Curses with corrosive waterborne decay', effect: { type: 'dot', damage: 0.15, duration: 4 } },
      { id: 'hellfire_rain', name: 'Volcanic Rain', icon: 'fire', type: 'magical', damage: 4.0, cooldown: 6, description: 'Rains superheated vents from the lakebed' },
      { id: 'petrify', name: 'Root Encase', icon: 'shield', type: 'magical', damage: 0.5, cooldown: 5, description: 'Encases a hero in rapidly-growing root', effect: { type: 'stun', duration: 2 } },
      { id: 'dark_empowerment', name: 'Abyssal Empowerment', icon: 'fire', type: 'buff', damage: 0, cooldown: 7, description: 'Channels forbidden deepwater power', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
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
      { id: 'annihilate', name: 'Current Annihilation', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 4, description: 'Pure aquatic destruction unleashed' },
      { id: 'void_barrier', name: 'Pressure Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Impenetrable wall of crushing pressure', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'reality_tear', name: 'Rift Current', icon: 'chaos', type: 'magical', damage: 4.5, cooldown: 7, description: 'Tears open the lakebed, devastating all' },
      { id: 'void_drain', name: 'Abyssal Drain', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs life force from the crushing deep', healPercent: 0.12 },
      { id: 'oblivion_pulse', name: 'Depth Pulse', icon: 'sparkle', type: 'magical', damage: 2.2, cooldown: 3, description: 'Radiates obliterating pressure waves', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'time_stop', name: 'Frozen Current', icon: 'sparkle', type: 'magical', damage: 0.6, cooldown: 6, description: 'Freezes the currents around a hero', effect: { type: 'stun', duration: 2 } },
      { id: 'void_enrage', name: 'Abyss Enrage', icon: 'fire', type: 'buff', damage: 0, cooldown: 8, description: 'The Abyss King enters a furious state', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
    ]
  },
  god_odin: {
    name: 'Poseidon, Lord of Currents', icon: 'lightning', color: '#0284c7', portrait: '/images/enemies/poseidon.png',
    baseHealth: 1800, baseDamage: 75, baseDefense: 55, baseMana: 600,
    xpReward: 500, goldReward: 400, speed: 18,
    isBoss: true,
    isGod: true,
    faction: 'crusade',
    abilities: [
      { id: 'gungnir', name: 'Trident Strike', icon: 'sword', type: 'physical', damage: 2.2, description: 'Hurls the divine trident of the waters' },
      { id: 'thunderclap', name: 'Storm Surge', icon: 'lightning', type: 'magical', damage: 3.8, cooldown: 4, description: 'Lightning crashes through the dark depths' },
      { id: 'divine_shield', name: 'Current Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'An impenetrable barrier of divine water', effect: { stat: 'defense', flat: 80, duration: 3 } },
      { id: 'wisdom_sight', name: 'Depth Omniscience', icon: 'crystal', type: 'buff', damage: 0, cooldown: 7, description: 'Sees all through the currents, boosting damage', effect: { stat: 'damage', multiplier: 2.2, duration: 3 } },
      { id: 'valkyrie_storm', name: 'Nereid Storm', icon: 'crossed_swords', type: 'magical', damage: 4.5, cooldown: 6, description: 'Summons a storm of divine water warriors' },
      { id: 'ragnarok', name: 'Deluge', icon: 'fire', type: 'magical', damage: 5.0, cooldown: 8, description: 'Unleashes the great flood upon all' },
      { id: 'divine_heal', name: 'Current Restoration', icon: 'sparkle', type: 'heal', damage: 0, cooldown: 5, description: 'Restores vitality through the healing waters', healPercent: 0.15 },
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
      { id: 'corruption_aura', name: 'Toxic Current', icon: 'skull', type: 'magical', damage: 1.5, cooldown: 3, description: 'Radiates poisonous dark currents', effect: { type: 'dot', damage: 0.18, duration: 4 } },
      { id: 'blood_frenzy', name: 'Feeding Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 6, description: 'Enters a blood-mad feeding frenzy', effect: { stat: 'damage', multiplier: 2.5, duration: 3 } },
      { id: 'death_grip', name: 'Whirlpool Grip', icon: 'sword', type: 'magical', damage: 1.2, cooldown: 5, description: 'Grips a hero in an inescapable vortex', effect: { type: 'stun', duration: 2 } },
      { id: 'apocalypse', name: 'Cataclysm', icon: 'bomb', type: 'magical', damage: 5.5, cooldown: 8, description: 'Brings forth total aquatic annihilation' },
      { id: 'vampiric_feast', name: 'Devouring Feast', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feasts on prey to heal wounds', healPercent: 0.18 },
      { id: 'plague_wave', name: 'Blight Wave', icon: 'skull', type: 'magical', damage: 2.8, cooldown: 5, description: 'A wave of toxic blight washes over all' },
    ]
  },
  cacodaemon: {
    name: 'Cacodaemon, Consumer of Plankton', icon: 'skull', color: '#991b1b', portrait: '/images/enemies/cacodaemon.png',
    baseHealth: 2400, baseDamage: 90, baseDefense: 75, baseMana: 1000,
    xpReward: 800, goldReward: 600, speed: 22,
    isBoss: true,
    isGod: true,
    isFinalBoss: true,
    faction: 'void',
    abilities: [
      { id: 'void_bite', name: 'Void Bite', icon: 'skull', type: 'physical', damage: 2.2, description: 'Jaws of pure void rend flesh and spirit' },
      { id: 'plankton_drain', name: 'Plankton Drain', icon: 'chaos', type: 'magical', damage: 2.8, cooldown: 3, description: 'Siphons the stolen Light of Unity to burn all heroes', effect: { type: 'dot', damage: 0.25, duration: 3 } },
      { id: 'silence_of_unity', name: 'Silence of Unity', icon: 'mind', type: 'magical', damage: 1.5, cooldown: 4, description: 'The silenced Plankton Magic crushes hope itself', effect: { type: 'stun', duration: 2 } },
      { id: 'consumed_light', name: 'Consumed Light', icon: 'sparkle', type: 'buff', damage: 0, cooldown: 5, description: 'Devours ambient magic to strengthen its form', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'abyssal_roar', name: 'Abyssal Roar', icon: 'bomb', type: 'magical', damage: 4.0, cooldown: 5, description: 'A roar that shakes the foundations of the deep' },
      { id: 'devour_magic', name: 'Devour Magic', icon: 'skull', type: 'heal', damage: 0, cooldown: 6, description: 'Consumes nearby magic to regenerate', healPercent: 0.15 },
      { id: 'extinction_wave', name: 'Extinction Wave', icon: 'bomb', type: 'magical', damage: 6.0, cooldown: 9, description: 'Unleashes the full force of consumed Plankton Magic - total annihilation' },
      { id: 'void_corruption', name: 'Void Corruption', icon: 'chaos', type: 'magical', damage: 2.0, cooldown: 4, description: 'Corrupts the water itself with void energy', effect: { type: 'dot', damage: 0.30, duration: 4 } },
      { id: 'shatter_vessel', name: 'Shatter Vessel', icon: 'skull', type: 'magical', damage: 3.5, cooldown: 5, description: 'Attempts to shatter the Betta Vessel of Fire', effect: { type: 'lower_defense', amount: 40, duration: 3 } },
    ]
  },
  gorgon_siren_1: {
    name: 'Medusa, Siren of the Mid-Waters', icon: 'sword', color: '#a78bfa', portrait: '/images/bosses/gorgon_siren_1_medusa.png',
    baseHealth: 750, baseDamage: 45, baseDefense: 28, baseMana: 250,
    xpReward: 140, goldReward: 100, speed: 15,
    isBoss: true,
    bossScale: 2.2,
    isGorgonSiren: true,
    gorgonIndex: 1,
    abilities: [
      { id: 'serpent_blade', name: 'Serpent Blade', icon: 'sword', type: 'physical', damage: 1.6, description: 'A blood-soaked blade strikes with serpentine fury' },
      { id: 'petrifying_gaze', name: 'Petrifying Gaze', icon: 'mind', type: 'magical', damage: 1.0, cooldown: 4, description: 'Her green eyes flash — muscles lock, turning to stone', effect: { type: 'stun', duration: 2 } },
      { id: 'serpent_coil', name: 'Serpent Coil', icon: 'skull', type: 'physical', damage: 2.4, cooldown: 3, description: 'Her massive purple coils constrict and crush' },
      { id: 'twilight_venom', name: 'Twilight Venom', icon: 'skull', type: 'magical', damage: 1.2, cooldown: 3, description: 'Venomous magic from her serpent hair seeps through the water', effect: { type: 'dot', damage: 0.15, duration: 4 } },
      { id: 'abyssal_tears', name: 'Abyssal Tears', icon: 'crystal', type: 'heal', damage: 0, cooldown: 5, description: 'Weeps cursed pearls that restore her shattered form', healPercent: 0.12 },
      { id: 'stone_barrier', name: 'Stone Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Summons a wall of petrified root to shield herself', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'blade_storm', name: 'Crimson Current', icon: 'sword', type: 'physical', damage: 3.2, cooldown: 6, description: 'A whirlwind of blade strikes stains the water red' },
    ]
  },
  gorgon_siren_2: {
    name: 'Charybdis, Siren of the Abyss', icon: 'crystal', color: '#c084fc', portrait: '/images/bosses/gorgon_siren_2_charybdis.png',
    baseHealth: 2000, baseDamage: 82, baseDefense: 45, baseMana: 500,
    xpReward: 500, goldReward: 400, speed: 17,
    isBoss: true,
    bossScale: 2.5,
    isGorgonSiren: true,
    isGod: true,
    faction: 'legion',
    gorgonIndex: 2,
    abilities: [
      { id: 'void_scepter', name: 'Void Scepter', icon: 'crystal', type: 'magical', damage: 2.0, description: 'Her skull-crowned staff channels raw abyssal energy' },
      { id: 'soul_devour', name: 'Soul Devour', icon: 'skull', type: 'magical', damage: 3.5, cooldown: 4, description: 'The skull on her staff opens its jaws and devours a hero\'s essence', drainPercent: 0.5 },
      { id: 'maw_of_madness', name: 'Maw of Madness', icon: 'skull', type: 'magical', damage: 1.5, cooldown: 3, description: 'Purple vortex radiates corruption that poisons mind and body', effect: { type: 'dot', damage: 0.18, duration: 4 } },
      { id: 'feeding_frenzy', name: 'Feeding Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 6, description: 'Enters a blood-mad state, her golden scales pulsing with dark magic', effect: { stat: 'damage', multiplier: 2.5, duration: 3 } },
      { id: 'whirlpool_grip', name: 'Whirlpool Grip', icon: 'chaos', type: 'magical', damage: 1.2, cooldown: 5, description: 'Creates a crushing vortex that traps heroes in place', effect: { type: 'stun', duration: 2 } },
      { id: 'cataclysm', name: 'Cataclysm', icon: 'bomb', type: 'magical', damage: 5.5, cooldown: 8, description: 'Unleashes the full fury of the Abyss — total annihilation' },
      { id: 'devouring_feast', name: 'Devouring Feast', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feasts on fallen souls to mend her ancient wounds', healPercent: 0.18 },
      { id: 'blight_wave', name: 'Blight Wave', icon: 'skull', type: 'magical', damage: 2.8, cooldown: 5, description: 'A wave of sickening purple blight washes over all heroes' },
    ]
  },
  gorgon_siren_3: {
    name: 'Scylla, Siren of the Shallows', icon: 'skull', color: '#06b6d4', portrait: '/images/bosses/gorgon_siren_3_scylla.png',
    baseHealth: 450, baseDamage: 32, baseDefense: 20, baseMana: 180,
    xpReward: 90, goldReward: 65, speed: 16,
    isBoss: true,
    bossScale: 2.0,
    isGorgonSiren: true,
    gorgonIndex: 3,
    abilities: [
      { id: 'wing_slash', name: 'Wing Slash', icon: 'sword', type: 'physical', damage: 1.4, description: 'Massive bat-like wings slice through the water like blades' },
      { id: 'terror_gaze', name: 'Terror Gaze', icon: 'mind', type: 'magical', damage: 0.8, cooldown: 4, description: 'Glowing yellow eyes paralyze prey with primal fear', effect: { type: 'stun', duration: 1 } },
      { id: 'serpent_strike', name: 'Serpent Strike', icon: 'skull', type: 'physical', damage: 2.0, cooldown: 3, description: 'Six serpentine heads strike with the speed of a riptide' },
      { id: 'toxic_cloud', name: 'Toxic Cloud', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 3, description: 'Breathes a cloud of venomous mist from her corrupted lungs', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'reef_cage', name: 'Root Cage', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Wraps herself in living roots torn from the grove', effect: { stat: 'defense', flat: 30, duration: 3 } },
      { id: 'tidal_fury', name: 'Current Fury', icon: 'chaos', type: 'physical', damage: 2.8, cooldown: 5, description: 'Beats her wings to create a devastating current shockwave' },
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
      { id: 'arcane_blast', name: 'Current Blast', icon: 'sparkle', type: 'magical', damage: 2.0, description: 'A blast of pure water arcane energy' },
      { id: 'fate_weave', name: 'Current Weave', icon: 'chaos', type: 'magical', damage: 3.2, cooldown: 4, description: 'Rewrites the currents to deal massive damage' },
      { id: 'cosmic_barrier', name: 'Current Barrier', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'A barrier woven from bioluminescent light', effect: { stat: 'defense', flat: 70, duration: 3 } },
      { id: 'time_warp', name: 'Current Warp', icon: 'sparkle', type: 'magical', damage: 1.0, cooldown: 5, description: 'Warps the currents around a hero', effect: { type: 'stun', duration: 2 } },
      { id: 'stellar_rain', name: 'Biolume Rain', icon: 'sparkle', type: 'magical', damage: 4.8, cooldown: 6, description: 'Bioluminescent projectiles rain from the depths' },
      { id: 'genesis', name: 'Genesis Current', icon: 'sparkle', type: 'magical', damage: 5.5, cooldown: 9, description: 'Unmakes and reshapes the waters' },
      { id: 'cosmic_heal', name: 'Deep Restoration', icon: 'crystal', type: 'heal', damage: 0, cooldown: 5, description: 'Draws healing from the deepest currents', healPercent: 0.14 },
      { id: 'mind_shatter', name: 'Pressure Crush', icon: 'mind', type: 'magical', damage: 2.5, cooldown: 4, description: 'Crushes the mind with abyssal pressure', effect: { type: 'dot', damage: 0.20, duration: 3 } },
    ]
  },
  water_elemental: {
    name: 'Storm Elemental', icon: 'ice', color: '#06b6d4', portrait: '/images/enemies/water_elemental.png',
    baseHealth: 550, baseDamage: 50, baseDefense: 38, baseMana: 300,
    xpReward: 175, goldReward: 120, speed: 14,
    isBoss: true,
    abilities: [
      { id: 'tidal_strike', name: 'Current Strike', icon: 'ice', type: 'magical', damage: 1.4, description: 'A crashing wave of water' },
      { id: 'torrent', name: 'Torrent', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'A devastating torrent that poisons', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'frost_armor', name: 'Frost Armor', icon: 'ice', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in ice armor', effect: { stat: 'defense', flat: 45, duration: 3 } },
      { id: 'tsunami', name: 'Tsunami', icon: 'chaos', type: 'magical', damage: 3.5, cooldown: 6, description: 'A massive wave crashes down on all' },
      { id: 'healing_tide', name: 'Healing Current', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Heals with the power of the currents', healPercent: 0.18 },
      { id: 'frozen_prison', name: 'Frozen Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Freezes a hero solid', effect: { type: 'stun', duration: 1 } },
    ]
  },
  nature_elemental: {
    name: 'Current Guardian', icon: 'nature', color: '#f472b6', portrait: '/images/enemies/nature_elemental.png',
    baseHealth: 600, baseDamage: 44, baseDefense: 42, baseMana: 250,
    xpReward: 175, goldReward: 120, speed: 12,
    isBoss: true,
    abilities: [
      { id: 'vine_lash', name: 'Root Lash', icon: 'nature', type: 'physical', damage: 1.3, description: 'Sharp root tendrils whip out' },
      { id: 'natures_wrath', name: "Water's Wrath", icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'The fury of the grove unleashed', effect: { type: 'dot', damage: 0.18, duration: 3 } },
      { id: 'regenerate', name: 'Grove Regenerate', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Regenerates health from root growth', healPercent: 0.20 },
      { id: 'earthquake', name: 'Lakebed Quake', icon: 'shield', type: 'physical', damage: 3.5, cooldown: 6, description: 'The lakebed splits apart, hitting all heroes' },
      { id: 'thorn_armor', name: 'Root Armor', icon: 'nature', type: 'buff', damage: 0, cooldown: 5, description: 'Sharp root reflects damage to attackers', effect: { stat: 'defense', flat: 35, duration: 3 } },
      { id: 'root_bind', name: 'Kelp Bind', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Kelp entangles a hero, stunning them', effect: { type: 'stun', duration: 1 } },
    ]
  },
  grand_shaman: {
    name: 'Grove Shaman', icon: 'nature', color: '#059669', portrait: '/images/enemies/grand_shaman.png',
    baseHealth: 500, baseDamage: 32, baseDefense: 18, baseMana: 200,
    xpReward: 80, goldReward: 55, speed: 11,
    isBoss: true,
    abilities: [
      { id: 'nature_bolt', name: 'Root Bolt', icon: 'nature', type: 'magical', damage: 1.3, description: 'A bolt of concentrated grove energy' },
      { id: 'healing_rain', name: 'Healing Current', icon: 'bow', type: 'heal', damage: 0, cooldown: 4, description: 'Calls healing currents to restore vitality', healPercent: 0.18 },
      { id: 'thorn_burst', name: 'Urchin Burst', icon: 'nature', type: 'magical', damage: 2.2, cooldown: 3, description: 'Urchin spines erupt from the lakebed', effect: { type: 'dot', damage: 0.10, duration: 3 } },
      { id: 'bark_shield', name: 'Root Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Encases in hardened root', effect: { stat: 'defense', flat: 30, duration: 3 } },
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
      { id: 'glacial_slam', name: 'Glacial Slam', icon: 'crystal', type: 'physical', damage: 3.0, cooldown: 5, description: 'Slams the lakebed creating ice spikes' },
      { id: 'freeze', name: 'Deep Freeze', icon: 'ice', type: 'magical', damage: 0.8, cooldown: 4, description: 'Freezes a hero solid in arctic water', effect: { type: 'stun', duration: 1 } },
      { id: 'frost_heal', name: 'Frost Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Absorbs cold cold water to heal', healPercent: 0.12 },
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
      { id: 'nightmare', name: 'Abyssal Terror', icon: 'skull', type: 'magical', damage: 1.0, cooldown: 5, description: 'Traps a hero in deepwater terror', effect: { type: 'stun', duration: 1 } },
      { id: 'shadow_mend', name: 'Shadow Mend', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Feeds on darkness to heal', healPercent: 0.14 },
    ]
  },
  forest_guardian: {
    name: 'Guardian of the Grove', icon: 'nature', color: '#2dd4bf', portrait: '/images/enemies/kelp_giant.png',
    baseHealth: 280, baseDamage: 28, baseDefense: 18, baseMana: 120,
    xpReward: 50, goldReward: 35, speed: 11,
    abilities: [
      { id: 'nature_strike', name: 'Root Strike', icon: 'nature', type: 'physical', damage: 1.1, description: 'A root-armed charge attack' },
      { id: 'forest_heal', name: 'Grove Heal', icon: 'heart', type: 'heal', damage: 0, cooldown: 4, description: 'Channels the grove to heal wounds', healPercent: 0.15 },
      { id: 'poison_spore', name: 'Venom Cloud', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 3, description: 'Releases a cloud of water venom', effect: { type: 'dot', damage: 0.12, duration: 3 } },
    ]
  },
  corrupted_grove_keeper: {
    name: 'Corrupted Grove Keeper', icon: 'crystal', color: '#0d9488', portrait: '/images/enemies/kelp_giant.png',
    baseHealth: 600, baseDamage: 35, baseDefense: 20, baseMana: 300,
    xpReward: 100, goldReward: 70, speed: 12,
    isBoss: true,
    bossScale: 3.0,
    abilities: [
      { id: 'corrupted_bolt', name: 'Corrupted Bolt', icon: 'skull', type: 'magical', damage: 1.3, description: 'A bolt of corrupted water magic' },
      { id: 'verdant_stun', name: 'Kelp Stun', icon: 'nature', type: 'magical', damage: 0.8, cooldown: 4, description: 'Entangling kelp stuns a hero in place', effect: { type: 'stun', duration: 1 } },
      { id: 'grove_fireball', name: 'Biolume Blast', icon: 'nature', type: 'magical', damage: 2.4, cooldown: 3, description: 'Hurls a massive bioluminescent blast of corrupted energy' },
      { id: 'resurrect_guardian', name: 'Resurrect Guardian', icon: 'heart', type: 'resurrect', damage: 0, cooldown: 6, description: 'Channels dark water magic to resurrect a fallen Guardian', isResurrect: true },
      { id: 'dark_bloom', name: 'Dark Bloom', icon: 'nature', type: 'magical', damage: 1.8, cooldown: 4, description: 'Toxic algae blooms dealing damage and reducing defense', effect: { stat: 'defense', flat: -15, duration: 3 } },
    ]
  },
  void_sentinel: {
    name: 'Void Sentinel', icon: 'crystal', color: '#7c3aed', portrait: '/images/enemies/void_sentinel.png',
    baseHealth: 1000, baseDamage: 55, baseDefense: 42, baseMana: 400,
    xpReward: 200, goldReward: 150, speed: 13,
    isBoss: true,
    abilities: [
      { id: 'void_strike', name: 'Angler Strike', icon: 'chaos', type: 'physical', damage: 1.5, description: 'A strike with bioluminescent lure energy' },
      { id: 'reality_rift', name: 'Depth Rift', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'Tears open a rift in the lakebed' },
      { id: 'void_shield', name: 'Angler Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Erects an impenetrable deepwater barrier', effect: { stat: 'defense', flat: 50, duration: 3 } },
      { id: 'entropy_pulse', name: 'Lure Pulse', icon: 'sparkle', type: 'magical', damage: 2.0, cooldown: 3, description: 'Radiates hypnotic bioluminescent energy', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'dimensional_lock', name: 'Depth Lock', icon: 'sparkle', type: 'magical', damage: 0.8, cooldown: 5, description: 'Locks a hero in crushing pressure', effect: { type: 'stun', duration: 2 } },
      { id: 'void_siphon', name: 'Deep Siphon', icon: 'skull', type: 'heal', damage: 0, cooldown: 5, description: 'Siphons energy from the deep to heal', healPercent: 0.13 },
      { id: 'null_burst', name: 'Pressure Burst', icon: 'bomb', type: 'magical', damage: 3.5, cooldown: 6, description: 'Unleashes a burst of crushing pressure' },
    ]
  },
  abyssal_demon: {
    name: 'Abyssal Kraken', icon: 'fire', color: '#b91c1c', portrait: '/images/enemies/demon_lord.png',
    baseHealth: 1600, baseDamage: 72, baseDefense: 40, baseMana: 400,
    xpReward: 400, goldReward: 300, speed: 15,
    isBoss: true,
    bossScale: 2.2,
    abilities: [
      { id: 'demon_cleave', name: 'Abyssal Cleave', icon: 'axe', type: 'physical', damage: 2.0, description: 'A massive cleave from the abyss' },
      { id: 'hellfire_eruption', name: 'Vent Eruption', icon: 'fire', type: 'magical', damage: 3.5, cooldown: 4, description: 'Volcanic vents erupt under all heroes' },
      { id: 'demon_roar', name: 'Leviathan Roar', icon: 'skull', type: 'buff', damage: 0, cooldown: 5, description: 'Roars with abyssal fury, boosting damage', effect: { stat: 'damage', multiplier: 2.0, duration: 3 } },
      { id: 'soul_crush', name: 'Depth Crush', icon: 'skull', type: 'physical', damage: 4.0, cooldown: 6, description: 'Crushes with the weight of the dark depths' },
      { id: 'abyssal_drain', name: 'Abyssal Drain', icon: 'skull', type: 'magical', damage: 2.0, cooldown: 4, description: 'Drains life through dark water magic', drainPercent: 0.5 },
      { id: 'infernal_shield', name: 'Hydrothermal Shield', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Wraps in superheated vent armor', effect: { stat: 'defense', flat: 55, duration: 3 } },
      { id: 'demon_stun', name: 'Abyssal Gaze', icon: 'crystal', type: 'magical', damage: 1.0, cooldown: 5, description: 'Paralyzes a hero with bioluminescent gaze', effect: { type: 'stun', duration: 2 } },
    ]
  },
  eldritch_horror: {
    name: 'The Devourer', icon: 'chaos', color: '#065f46', portrait: '/images/enemies/void_sentinel.png',
    baseHealth: 1800, baseDamage: 68, baseDefense: 35, baseMana: 500,
    xpReward: 450, goldReward: 350, speed: 12,
    isBoss: true,
    bossScale: 2.5,
    abilities: [
      { id: 'tentacle_lash', name: 'Tentacle Lash', icon: 'skull', type: 'physical', damage: 1.8, description: 'Lashes out with massive tentacles' },
      { id: 'madness_wave', name: 'Madness Wave', icon: 'chaos', type: 'magical', damage: 3.0, cooldown: 4, description: 'A wave of deepwater madness washes over all', effect: { type: 'dot', damage: 0.16, duration: 4 } },
      { id: 'eldritch_scream', name: 'Abyssal Scream', icon: 'skull', type: 'magical', damage: 1.2, cooldown: 5, description: 'A scream from the depths that stuns with terror', effect: { type: 'stun', duration: 2 } },
      { id: 'void_consumption', name: 'Void Consumption', icon: 'chaos', type: 'magical', damage: 2.5, cooldown: 3, description: 'Consumes a hero with crushing pressure', drainPercent: 0.6 },
      { id: 'cosmic_regeneration', name: 'Deep Regeneration', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Regenerates through abyssal energy', healPercent: 0.16 },
      { id: 'reality_shatter', name: 'Trench Shatter', icon: 'bomb', type: 'magical', damage: 4.5, cooldown: 7, description: 'Shatters the lakebed itself' },
      { id: 'abyssal_armor', name: 'Abyssal Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 6, description: 'Encases in otherworldly deepwater armor', effect: { stat: 'defense', flat: 60, duration: 3 } },
      { id: 'mind_flay', name: 'Pressure Flay', icon: 'crystal', type: 'magical', damage: 2.2, cooldown: 4, description: 'Flays the mind with crushing water pressure' },
    ]
  },
  frost_titan: {
    name: 'Glacial Titan', icon: 'ice', color: '#67e8f9', portrait: '/images/enemies/frost_titan.png',
    baseHealth: 1500, baseDamage: 65, baseDefense: 50, baseMana: 350,
    xpReward: 380, goldReward: 280, speed: 10,
    isBoss: true,
    bossScale: 2.0,
    abilities: [
      { id: 'frost_smash', name: 'Glacial Smash', icon: 'ice', type: 'physical', damage: 2.2, description: 'A devastating icy deepwater smash' },
      { id: 'absolute_zero', name: 'Absolute Zero', icon: 'ice', type: 'magical', damage: 3.8, cooldown: 5, description: 'Drops temperature to absolute zero in the deep' },
      { id: 'ice_prison', name: 'Ice Prison', icon: 'ice', type: 'magical', damage: 1.0, cooldown: 4, description: 'Encases a hero in unbreakable deepwater ice', effect: { type: 'stun', duration: 2 } },
      { id: 'glacial_armor', name: 'Glacial Armor', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Hardens into impenetrable glacial armor', effect: { stat: 'defense', flat: 65, duration: 3 } },
      { id: 'frost_breath', name: 'Frost Current', icon: 'ice', type: 'magical', damage: 2.5, cooldown: 3, description: 'Breathes devastating frozen currents', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'permafrost_heal', name: 'Permafrost', icon: 'heart', type: 'heal', damage: 0, cooldown: 6, description: 'Draws power from eternal ice to heal', healPercent: 0.14 },
      { id: 'avalanche', name: 'Ice Cascade', icon: 'bomb', type: 'physical', damage: 4.0, cooldown: 6, description: 'Summons a cascade of ice to crush all heroes' },
    ]
  },
  flying_eye: {
    name: 'Lantern Jellyfish', icon: 'crystal', color: '#c084fc', portrait: '/images/enemies/jellyfish_eye.png',
    baseHealth: 70, baseDamage: 16, baseDefense: 4, baseMana: 40,
    xpReward: 14, goldReward: 7, speed: 19,
    abilities: [
      { id: 'eye_beam', name: 'Sting Beam', icon: 'crystal', type: 'magical', damage: 1.2, description: 'A focused beam of bioluminescent energy' },
      { id: 'dive_attack', name: 'Tentacle Dive', icon: 'energy', type: 'physical', damage: 1.6, cooldown: 3, description: 'Dives down trailing venomous tentacles' },
    ]
  },
  mushroom: {
    name: 'Toxic Urchin', icon: 'nature', color: '#a855f7', portrait: '/images/enemies/sea_mushroom.png',
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
    name: 'Manta Ray', icon: 'energy', color: '#4c1d95', portrait: '/images/enemies/shadow_manta.png',
    baseHealth: 55, baseDamage: 14, baseDefense: 3, baseMana: 30,
    xpReward: 12, goldReward: 5, speed: 22,
    abilities: [
      { id: 'wing_slash', name: 'Coil Slash', icon: 'energy', type: 'physical', damage: 0.9, description: 'Slashes with razor-sharp fangs from a crevice' },
      { id: 'sonic_screech', name: 'Echolocation Pulse', icon: 'energy', type: 'magical', damage: 1.4, cooldown: 3, description: 'A disorienting pulse that rattles the senses', effect: { type: 'dot', damage: 0.08, duration: 2 } },
      { id: 'blood_drain', name: 'Venom Drain', icon: 'target', type: 'physical', damage: 1.1, cooldown: 4, description: 'Latches on and drains with venomous bite', drainPercent: 0.6 },
    ]
  },
  imp: {
    name: 'Electric Eel', icon: 'fire', color: '#0891b2', portrait: '/images/enemies/sea_devil.png',
    baseHealth: 65, baseDamage: 11, baseDefense: 4, baseMana: 50,
    xpReward: 13, goldReward: 7, speed: 17,
    abilities: [
      { id: 'imp_scratch', name: 'Spine Scratch', icon: 'fire', type: 'physical', damage: 0.8, description: 'Quick spines rake across flesh' },
      { id: 'hex_bolt', name: 'Toxin Bolt', icon: 'crystal', type: 'magical', damage: 1.5, cooldown: 3, description: 'A toxic bolt that weakens the target', effect: { stat: 'defense', flat: -10, duration: 2 } },
      { id: 'imp_frenzy', name: 'Puff Frenzy', icon: 'fire', type: 'buff', damage: 0, cooldown: 5, description: 'Inflates into a spiny frenzy, boosting damage', effect: { stat: 'damage', multiplier: 1.5, duration: 2 } },
    ]
  },
  mimic: {
    name: 'Hermit Mimic', icon: 'shield', color: '#0e7490', portrait: '/images/enemies/ocean_mimic.png',
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
    name: 'Barracuda Knight', icon: 'sword', color: '#1e3a5f', portrait: '/images/enemies/swordfish_knight.png',
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
    name: 'Stone Crab', icon: 'shield', color: '#f472b6', portrait: '/images/enemies/stone_guardian.png',
    baseHealth: 250, baseDamage: 20, baseDefense: 30, baseMana: 60,
    xpReward: 38, goldReward: 22, speed: 6,
    abilities: [
      { id: 'stone_fist', name: 'Root Fist', icon: 'sword', type: 'physical', damage: 1.2, description: 'A heavy fist of living roots crushes down' },
      { id: 'petrify_gaze', name: 'Hypnotic Gaze', icon: 'crystal', type: 'magical', damage: 0.6, cooldown: 5, description: 'Eyes glow with bioluminescence, stunning a hero', effect: { type: 'stun', duration: 1 } },
      { id: 'quake_slam', name: 'Root Slam', icon: 'shield', type: 'physical', damage: 2.0, cooldown: 4, description: 'Slams the grove causing a localized tremor' },
      { id: 'fortify', name: 'Root Fortify', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Channels ancient grove magic to harden its body', effect: { stat: 'defense', flat: 40, duration: 3 } },
      { id: 'crumble_curse', name: 'Erosion Curse', icon: 'skull', type: 'magical', damage: 0.8, cooldown: 4, description: 'Curses a hero with waterborne decay, eroding armor', effect: { type: 'dot', damage: 0.10, duration: 4 } },
    ]
  },
  jellyfish_swarm: {
    name: 'Stinging Swarm', icon: 'nature', color: '#e879f9', portrait: '/images/enemies/jellyfish_eye.png',
    baseHealth: 60, baseDamage: 14, baseDefense: 3, baseMana: 50,
    xpReward: 12, goldReward: 6, speed: 20,
    abilities: [
      { id: 'jelly_sting', name: 'Venom Sting', icon: 'nature', type: 'physical', damage: 0.9, description: 'Stinging tendrils lash out' },
      { id: 'jelly_shock', name: 'Bio-shock', icon: 'lightning', type: 'magical', damage: 1.4, cooldown: 3, description: 'Releases a burst of bioluminescent electricity', effect: { type: 'stun', duration: 1 } },
    ]
  },
  ice_elemental: {
    name: 'Frost Wisp', icon: 'ice', color: '#7dd3fc', portrait: '/images/enemies/water_elemental.png',
    baseHealth: 130, baseDamage: 20, baseDefense: 12, baseMana: 80,
    xpReward: 25, goldReward: 14, speed: 13,
    abilities: [
      { id: 'frost_shard', name: 'Ice Shard', icon: 'ice', type: 'magical', damage: 1.1, description: 'Hurls a shard of deepwater ice' },
      { id: 'freeze_touch', name: 'Freezing Touch', icon: 'ice', type: 'magical', damage: 1.6, cooldown: 3, description: 'Flash-freezes on contact', effect: { type: 'dot', damage: 0.10, duration: 3 } },
      { id: 'ice_shield', name: 'Frost Shell', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Encases in protective ice', effect: { stat: 'defense', flat: 18, duration: 2 } },
    ]
  },
  crab_warrior: {
    name: 'Grove Crab', icon: 'shield', color: '#a16207', portrait: '/images/enemies/armored_crab.png',
    baseHealth: 110, baseDamage: 16, baseDefense: 18, baseMana: 0,
    xpReward: 16, goldReward: 9, speed: 9,
    abilities: [
      { id: 'claw_pinch', name: 'Claw Pinch', icon: 'sword', type: 'physical', damage: 1.0, description: 'Snaps with hardened claws' },
      { id: 'shell_retreat', name: 'Shell Retreat', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Retreats into shell for protection', effect: { stat: 'defense', flat: 22, duration: 2 } },
      { id: 'crab_crush', name: 'Crusher Claw', icon: 'sword', type: 'physical', damage: 1.6, cooldown: 3, description: 'A devastating claw crush' },
    ]
  },
  frost_jellyfish: {
    name: 'Arctic Jellyfish', icon: 'ice', color: '#a5f3fc', portrait: '/images/enemies/jellyfish_eye.png',
    baseHealth: 140, baseDamage: 22, baseDefense: 8, baseMana: 100,
    xpReward: 28, goldReward: 16, speed: 16,
    abilities: [
      { id: 'cryo_sting', name: 'Cryo-Sting', icon: 'ice', type: 'magical', damage: 1.2, description: 'A freezing venom sting' },
      { id: 'ice_cloud', name: 'Frost Cloud', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Releases a cloud of sub-zero water', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'cryo_flash', name: 'Flash Freeze', icon: 'ice', type: 'magical', damage: 0.8, cooldown: 4, description: 'Instantly freezes a hero in place', effect: { type: 'stun', duration: 1 } },
    ]
  },
  lava_crab: {
    name: 'Magma Crab', icon: 'fire', color: '#dc2626', portrait: '/images/enemies/armored_crab.png',
    baseHealth: 180, baseDamage: 24, baseDefense: 24, baseMana: 40,
    xpReward: 36, goldReward: 22, speed: 7,
    abilities: [
      { id: 'lava_claw', name: 'Molten Claw', icon: 'fire', type: 'physical', damage: 1.2, description: 'Claws heated by volcanic vents' },
      { id: 'lava_shell', name: 'Magma Shell', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Hardens shell with cooling lava', effect: { stat: 'defense', flat: 28, duration: 3 } },
      { id: 'eruption_slam', name: 'Eruption Slam', icon: 'fire', type: 'physical', damage: 2.0, cooldown: 4, description: 'Slams the ground causing a mini-eruption', effect: { type: 'dot', damage: 0.12, duration: 2 } },
    ]
  },
  diver_warrior: {
    name: 'Sunken Raider', icon: 'sword', color: '#4a7c6f', portrait: '/sprites/enemies/diver_warrior/Idle.png',
    baseHealth: 160, baseDamage: 24, baseDefense: 18, baseMana: 20,
    xpReward: 30, goldReward: 18, speed: 11,
    abilities: [
      { id: 'dw_slash', name: 'Rusted Slash', icon: 'sword', type: 'physical', damage: 1.2, description: 'A corroded blade cuts through the current' },
      { id: 'dw_charge', name: 'Dive Charge', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Charges forward with barnacle-crusted armor' },
      { id: 'dw_guard', name: 'Sunken Brace', icon: 'shield', type: 'buff', damage: 0, cooldown: 4, description: 'Braces behind corroded plating', effect: { stat: 'defense', flat: 22, duration: 2 } },
    ]
  },
  harpoon_diver: {
    name: 'Harpoon Hunter', icon: 'sword', color: '#5b8a72', portrait: '/sprites/enemies/harpoon_diver/Idle.png',
    baseHealth: 130, baseDamage: 28, baseDefense: 12, baseMana: 30,
    xpReward: 32, goldReward: 20, speed: 13,
    abilities: [
      { id: 'hd_harpoon', name: 'Harpoon Thrust', icon: 'sword', type: 'physical', damage: 1.3, description: 'Thrusts a rusted harpoon with deadly precision' },
      { id: 'hd_snipe', name: 'Deep Shot', icon: 'energy', type: 'physical', damage: 2.2, cooldown: 4, description: 'Fires a harpoon bolt from the murky depths', effect: { type: 'bleed', damage: 0.08, duration: 3 } },
      { id: 'hd_net', name: 'Tangled Net', icon: 'nature', type: 'magical', damage: 0.6, cooldown: 5, description: 'Throws a weighted net to slow prey', effect: { type: 'stun', duration: 1 } },
    ]
  },
  deep_archer: {
    name: 'Depth Marksman', icon: 'bow', color: '#6b7f5e', portrait: '/sprites/enemies/deep_archer/Idle.png',
    baseHealth: 110, baseDamage: 26, baseDefense: 8, baseMana: 40,
    xpReward: 28, goldReward: 16, speed: 15,
    abilities: [
      { id: 'da_arrow', name: 'Brine Arrow', icon: 'bow', type: 'physical', damage: 1.1, description: 'An arrow tipped with crystallized salt' },
      { id: 'da_volley', name: 'Depth Volley', icon: 'bow', type: 'physical', damage: 1.6, cooldown: 3, description: 'Fires a rapid volley of bone-tipped arrows' },
      { id: 'da_poison', name: 'Toxin Shot', icon: 'nature', type: 'physical', damage: 1.0, cooldown: 4, description: 'An arrow coated in pufferfish venom', effect: { type: 'poison', damage: 0.10, duration: 3 } },
    ]
  },
  merman: {
    name: 'Merfolk Scout', icon: 'trident', color: '#2563eb', portrait: '/sprites/enemies/merman/Idle.png',
    baseHealth: 140, baseDamage: 22, baseDefense: 14, baseMana: 60,
    xpReward: 28, goldReward: 16, speed: 16,
    abilities: [
      { id: 'mr_strike', name: 'Coral Blade', icon: 'sword', type: 'physical', damage: 1.1, description: 'Strikes with a sharpened coral dagger' },
      { id: 'mr_current', name: 'Riptide Slash', icon: 'ice', type: 'physical', damage: 1.7, cooldown: 3, description: 'Rides the current for a devastating cross-slash' },
      { id: 'mr_heal', name: 'Tidal Mend', icon: 'heart', type: 'heal', damage: 0, cooldown: 5, description: 'Channels the healing waters to restore vitality', healPercent: 0.12 },
    ]
  },
  siren: {
    name: 'Deepwater Siren', icon: 'crystal', color: '#7c3aed', portrait: '/sprites/enemies/siren/Idle.png',
    baseHealth: 120, baseDamage: 18, baseMagicDamage: 30, baseDefense: 10, baseMana: 120,
    xpReward: 35, goldReward: 22, speed: 14,
    abilities: [
      { id: 'sr_song', name: 'Drowning Song', icon: 'crystal', type: 'magical', damage: 1.3, description: 'An enchanting melody that crushes with pressure' },
      { id: 'sr_charm', name: 'Beguiling Call', icon: 'crystal', type: 'magical', damage: 0.8, cooldown: 4, description: 'A mesmerizing call that confuses the mind', effect: { type: 'confuse', duration: 2 } },
      { id: 'sr_scream', name: 'Sonic Wail', icon: 'energy', type: 'magical', damage: 2.0, cooldown: 4, description: 'A piercing shriek that shatters armor and will', effect: { type: 'lower_defense', flat: 15, duration: 2 } },
    ]
  },
  deep_angler: {
    name: 'Lantern Lurker', icon: 'fire', color: '#84cc16', portrait: '/sprites/enemies/deep_angler/Idle.png',
    baseHealth: 100, baseDamage: 20, baseDefense: 6, baseMana: 40,
    xpReward: 20, goldReward: 12, speed: 12,
    abilities: [
      { id: 'ang_bite', name: 'Lantern Snap', icon: 'fire', type: 'physical', damage: 1.2, description: 'Lunges from the dark with bioluminescent jaws' },
      { id: 'ang_lure', name: 'Hypnotic Lure', icon: 'crystal', type: 'magical', damage: 0.6, cooldown: 4, description: 'Its glowing lure dazzles and stuns prey', effect: { type: 'stun', duration: 1 } },
      { id: 'ang_devour', name: 'Abyssal Devour', icon: 'fire', type: 'physical', damage: 2.0, cooldown: 4, description: 'Unhinges its jaw for a massive bite', drainPercent: 0.3 },
    ]
  },
  sea_serpent: {
    name: 'Lake Leviathan', icon: 'dragon', color: '#059669', portrait: '/sprites/enemies/sea_serpent/Idle.png',
    baseHealth: 280, baseDamage: 32, baseDefense: 22, baseMana: 80,
    xpReward: 55, goldReward: 35, speed: 12,
    isBoss: false,
    abilities: [
      { id: 'ss_coil', name: 'Constricting Coil', icon: 'sword', type: 'physical', damage: 1.3, description: 'Wraps its massive body around prey' },
      { id: 'ss_breath', name: 'Torrent Breath', icon: 'ice', type: 'magical', damage: 1.8, cooldown: 3, description: 'Exhales a pressurized blast of water' },
      { id: 'ss_thrash', name: 'Lake Thrash', icon: 'sword', type: 'physical', damage: 2.2, cooldown: 4, description: 'Thrashes wildly sending shockwaves through the water', effect: { type: 'stun', duration: 1 } },
      { id: 'ss_scale', name: 'Ironscale', icon: 'shield', type: 'buff', damage: 0, cooldown: 5, description: 'Hardens its ancient scales', effect: { stat: 'defense', flat: 30, duration: 3 } },
    ]
  },
  merfolk_warrior: {
    name: 'Merfolk Warden', icon: 'trident', color: '#1d4ed8', portrait: '/sprites/enemies/merfolk_warrior/Idle.png',
    baseHealth: 200, baseDamage: 28, baseDefense: 20, baseMana: 50,
    xpReward: 42, goldReward: 26, speed: 13,
    abilities: [
      { id: 'mw_trident', name: 'Trident Thrust', icon: 'sword', type: 'physical', damage: 1.2, description: 'A precise three-pronged thrust' },
      { id: 'mw_spin', name: 'Whirlpool Strike', icon: 'sword', type: 'physical', damage: 1.8, cooldown: 3, description: 'Spins with trident creating a vortex of destruction' },
      { id: 'mw_rally', name: 'War Tide', icon: 'sparkle', type: 'buff', damage: 0, cooldown: 5, description: 'Rallies with an ancient merfolk war cry', effect: { stat: 'damage', multiplier: 1.4, duration: 3 } },
      { id: 'mw_javelin', name: 'Coral Javelin', icon: 'energy', type: 'physical', damage: 2.0, cooldown: 4, description: 'Hurls a coral-tipped javelin with devastating force', effect: { type: 'bleed', damage: 0.10, duration: 3 } },
    ]
  },
};

export const locations = [
  {
    id: 'verdant_plains',
    name: 'Shaded Shallows',
    description: 'Sunlit waters dance over vibrant root beds where the first fragment of the shattered Root Crown was found. Grove bandits and mantis shrimp prowl the shallows, emboldened by the fading light of the old world.',
    levelRange: [1, 3],
    enemies: ['goblin', 'wolf', 'mushroom', 'imp', 'shadow_bat', 'jellyfish_swarm', 'crab_warrior'],
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
    description: 'Towering kelp canopies sway in the currents, casting shifting shadows where predators lie in wait. Whispers among the fronds speak of a Crown fragment hidden deep within the tangled growth.',
    levelRange: [3, 5],
    enemies: ['wolf', 'goblin', 'skeleton', 'mushroom', 'flying_eye', 'shadow_bat', 'imp', 'jellyfish_swarm', 'crab_warrior', 'deep_angler', 'merman'],
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
    description: 'Giant anemones pulse with ancient magic, their tendrils weaving spells older than the Root Crown itself. Ink sorcerers gather here to channel the garden\'s power for dark purposes.',
    levelRange: [4, 6],
    enemies: ['goblin', 'wolf', 'dark_mage', 'mushroom', 'flying_eye', 'imp', 'siren', 'deep_angler'],
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
    description: 'Twisting caverns aglow with bioluminescent life, where eerie echoes ripple through crystal-clear water. Hermit mimics disguise themselves among the glowing walls, luring the unwary deeper.',
    levelRange: [3, 5],
    enemies: ['goblin', 'skeleton', 'flying_eye', 'shadow_bat', 'mimic', 'deep_archer', 'harpoon_diver'],
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
    description: 'A suffocating labyrinth of sargassum where the drowned drift among rotting fronds. The Abyss King\'s corruption seeps through these waters, raising barnacle warriors from their resting places.',
    levelRange: [5, 7],
    enemies: ['skeleton', 'dark_mage', 'wolf', 'mushroom', 'flying_eye', 'shadow_bat', 'diver_warrior', 'merman'],
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
    name: 'Sunken Citadel',
    description: 'The drowned fortress of an ancient betta kingdom, its root spires crumbling into the abyss. Abyssal knights and shadow eels patrol these haunted halls, guarding secrets of the shattered Crown.',
    levelRange: [6, 9],
    enemies: ['skeleton', 'dark_mage', 'skeleton_knight', 'mimic', 'crow_knight', 'dark_knight', 'shadow_warrior', 'merfolk_warrior', 'harpoon_diver'],
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
    description: 'Glittering caverns of living crystal hum with the resonance of the Root Crown. Stone crabs and root priestesses guard these sacred halls, carved by ancient artisans of the deep.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'goblin', 'orc', 'skeleton_knight', 'mimic', 'stone_guardian', 'water_priestess_mage', 'siren', 'sea_serpent'],
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
    name: 'Current Stream',
    description: 'A treacherous channel carved by relentless current forces, where powerful currents sweep the unwary into ambushes. Barracuda knights and hammerhead brutes control this vital passage between the shallows and the deep.',
    levelRange: [6, 8],
    enemies: ['wolf', 'goblin', 'orc', 'mushroom', 'crow_knight', 'imp', 'diver_warrior', 'deep_archer', 'merfolk_warrior'],
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
    name: 'Shipwreck Hollow',
    description: 'Shattered hulls of ancient vessels litter the lakebed, and in their shadow lurks Scylla — the first Gorgon Siren, once the gentlest guardian of the shallows. Her six serpentine heads now strike at anything that moves, her bat-like wings churning the water into a frenzy. The Crown fragment she guards pulses with fading light.',
    levelRange: [7, 9],
    enemies: ['skeleton', 'dark_mage', 'goblin', 'skeleton_knight', 'flying_eye', 'mimic', 'stone_guardian', 'water_priestess_mage'],
    bgGradient: 'linear-gradient(135deg, #155e75 0%, #164e63 50%, #0e7490 100%)',
    icon: 'shield',
    unlocked: false,
    unlockLevel: 6,
    boss: 'gorgon_siren_3',
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
    name: 'Root Fortress',
    description: 'A massive fortification of hardened root where the Abyss King\'s armies have established their first stronghold. The deep current brings organized war parties of abyssal knights and barracuda knights.',
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
    description: 'Superheated water erupts from the lakebed in blinding geysers of mineral-rich fury. The Trench Warlord commands this volcanic stronghold, forging weapons in the scalding vents for the Abyss King\'s armies.',
    levelRange: [9, 12],
    enemies: ['orc', 'skeleton', 'dark_mage', 'crow_knight', 'dark_knight', 'shadow_warrior', 'lava_crab'],
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
    description: 'Arctic currents have frozen these waters into a silent kingdom of ice, where a mighty Frost Serpent coils in the darkness below. The cold here is ancient, predating even the Root Crown.',
    levelRange: [10, 13],
    enemies: ['orc', 'skeleton', 'dark_mage', 'shadow_bat', 'water_priestess_mage', 'ice_elemental', 'frost_jellyfish'],
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
    name: "Leviathan's Wake",
    description: 'Volcanic peaks scarred by the passage of ancient leviathans, where river drakes nest among the smoldering rock. A Storm Elemental guards a Crown fragment lodged in the volcanic heart.',
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
    description: 'A desolate expanse of lakebed strewn with the bones and shells of warriors who fell in the First Current War. Scavengers pick through the remains while stone crabs guard buried relics.',
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
    name: 'Riptide Shelf',
    description: 'A narrow ridge battered by violent riptides that tear through the water with terrifying force. River drakes ride the currents overhead while barracuda knights ambush travelers from crevices below.',
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
    name: 'Volcanic Hearth',
    description: 'Rivers of magma snake beneath the lakebed, turning the water into a boiling cauldron of fire and steam. River drakes are drawn to the volcanic heat, nesting in the molten crevasses.',
    levelRange: [12, 14],
    enemies: ['dragon_whelp', 'orc', 'dark_mage', 'lava_crab'],
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
    description: 'Towering fungal growths twist upward from the lakebed, their caps glowing with corrupted bioluminescence. The Corrupted Grove Keeper has turned this once-beautiful forest into a breeding ground for the Abyss King\'s forces.',
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
    name: 'Obsidian Flats',
    description: 'A blasted wasteland of volcanic glass and black ash where nothing survives but the Abyss King\'s most hardened warriors. Toxic vents belch poisonous clouds across the desolate lakebed.',
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
    description: 'The crumbling remains of Abyssia\'s greatest city, destroyed when the Root Crown shattered. Dark spirits haunt the rubble, and ink sorcerers search the ruins for forbidden knowledge.',
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
    description: 'A festering trench where the Abyss King\'s corruption has poisoned the water itself. Toxic chemicals seep from the lakebed, corroding everything they touch and birthing twisted creatures.',
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
    description: 'A fortress of petrified root and living shadow, where Medusa — the second Gorgon Siren — weeps cursed pearls from her throne. Her serpent hair senses every disturbance in the water, and her blood-soaked blade has ended a thousand champions. The Crown fragment here is sealed behind walls of stone that were once living fish.',
    levelRange: [14, 17],
    enemies: ['dark_mage', 'dragon_whelp', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #000000 100%)',
    icon: 'shield',
    unlocked: false,
    unlockLevel: 13,
    boss: 'gorgon_siren_1',
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
    description: 'An underwater summit caught in an eternal churning vortex where raw elemental energy crackles through the water. The maelstrom\'s fury masks the approach to the Abyss King\'s inner territories.',
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
    name: 'Abyssal Gate',
    description: 'A massive cavern where the barrier between the waters and the Abyss grows thin, and monstrous creatures pour through the widening cracks. A Leviathan guards the passage with volcanic fury.',
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
    name: 'Hadal Trench',
    description: 'Lightless depths where the crushing pressure warps reality itself. The darkness here is alive, reaching out with tendrils of void energy to consume any light that dares enter.',
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
    name: 'Magma Forge',
    description: 'A volcanic forge where the Abyss King\'s weapons are tempered in magma and quenched in cursed brine. The endless hiss of superheated metal echoes through the scorching depths.',
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
    name: 'Dreadmaw Rift',
    description: 'A yawning rift in the lakebed filled with the bones of ancient leviathans, its walls lined with razor-sharp root teeth. The rift pulses like a living maw, hungry for those who enter.',
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
    description: 'The edge of the known waters, where light ends and the Abyss begins. A Void Sentinel stands eternal watch over the passage to the realm beyond, testing all who would challenge the darkness.',
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
    description: 'A twisted tower of blackened root that pierces upward from the lakebed, radiating waves of abyssal corruption. The last Crown fragment pulses faintly within its peak, calling out for rescue.',
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
    name: 'The Abyss Throne',
    description: 'In the crushing darkness beyond the deepest trench, the Abyss King sits upon a throne of devoured light. Here, where the waters\'s heart beats its last, the final battle for the Root Crown begins.',
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
    name: 'Temple of Currents',
    description: 'A grand temple of pearl and gold where Poseidon, Lord of Currents, holds dominion over the waters\'s currents. Only true Crusade champions may enter these hallowed waters and challenge divine authority.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'orc'],
    bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #0c4a6e 100%)',
    icon: 'lightning',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['gorgon_siren_3', 'frost_wyrm'],
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
    name: "The Devourer's Maw",
    description: 'A churning whirlpool of purple shadow and ancient fury where Charybdis — the third and most fearsome Gorgon Siren — rules from her throne of devoured souls. Her skull-crowned scepter channels the Weight of Law itself, twisted into pure destruction. She is the only being who witnessed the moment the Plankton Magic went silent. What she saw drove her to the edge of madness.',
    levelRange: [20, 20],
    enemies: ['dark_mage', 'skeleton'],
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #be123c 50%, #450a0a 100%)',
    icon: 'target',
    unlocked: false,
    unlockLevel: 20,
    unlockBoss: 'void_king',
    unlockRequiredBosses: ['shadow_beast', 'gorgon_siren_1'],
    boss: 'gorgon_siren_2',
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
    name: 'Leviathan Sanctum',
    description: 'A realm beyond mortal comprehension where The Leviathan, Weaver of Currents, reshapes the waters at will. Only Fabled champions may enter this sanctum and challenge the weaver of destiny itself.',
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
  },
  {
    id: 'void_maw',
    name: 'The Void Maw',
    description: 'Where the Plankton Magic once sang the song of unity, now only silence remains. The Cacodaemon feasts on the last embers of the Light of Unity, growing ever stronger. This is where it all ends — or begins again.',
    x: 50, y: 12,
    level: 20,
    terrain: 'abyss',
    enemies: ['void_sentinel', 'abyssal_demon', 'eldritch_horror'],
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 30%, #1c1917 70%, #0c0a09 100%)',
    icon: 'skull',
    unlocked: false,
    unlockLevel: 20,
    unlockRequiredBosses: ['god_odin', 'gorgon_siren_2', 'god_omni'],
    boss: 'cacodaemon',
    isFinalBoss: true,
    isGodFight: true,
    faction: 'void',
    enemyCount: [4, 5],
    allyCount: 4,
    raceClassEnemies: [
      { raceId: 'red_betta', classId: 'warrior', levelRange: [20, 20] },
      { raceId: 'purple_betta', classId: 'mage', levelRange: [20, 20] },
      { raceId: 'black_betta', classId: 'rogue', levelRange: [20, 20] },
      { raceId: 'gold_betta', classId: 'guardian', levelRange: [20, 20] },
    ],
  }
];

export const shieldBlockers = [
  {
    id: 'blocker_anemone',
    locationId: 'mystic_grove',
    name: 'Passage Guardian',
    condition: { type: 'level', value: 3 },
    message: 'Reach Level 3 to disable this Shield Droid',
    scale: 2.5,
  },
  {
    id: 'blocker_twilight',
    locationId: 'twilight_coast',
    name: 'Twilight Sentry',
    condition: { type: 'boss', value: 'skeleton_knight' },
    message: 'Defeat the Barnacle Knight in Biolume Caves to pass',
    scale: 2.5,
  },
  {
    id: 'blocker_ruins',
    locationId: 'cursed_ruins',
    name: 'Ruin Warden',
    condition: { type: 'level', value: 8 },
    message: 'Reach Level 8 to disable this Shield Droid',
    scale: 2.5,
  },
  {
    id: 'blocker_temple',
    locationId: 'sunken_temple',
    name: 'Temple Gatekeeper',
    condition: { type: 'boss', value: 'dark_knight' },
    message: 'Defeat the Angler Phantom in Shadow Grove to pass',
    scale: 2.5,
  },
  {
    id: 'blocker_volcano',
    locationId: 'dragon_peaks',
    name: 'Volcanic Sentinel',
    condition: { type: 'level', value: 12 },
    message: 'Reach Level 12 to disable this Shield Droid',
    scale: 2.5,
  },
  {
    id: 'blocker_necropolis',
    locationId: 'necropolis',
    name: 'Deep Guard',
    condition: { type: 'boss', value: 'gorgon_siren_1' },
    message: 'Defeat Medusa in the Shadow Citadel to pass',
    scale: 2.5,
  },
  {
    id: 'blocker_void',
    locationId: 'void_threshold',
    name: 'Final Blockade',
    condition: { type: 'level', value: 17 },
    message: 'Reach Level 17 to challenge the Abyss',
    scale: 3.0,
  },
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
