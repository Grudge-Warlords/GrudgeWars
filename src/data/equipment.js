export const EQUIPMENT_SLOTS = ['weapon', 'offhand', 'helmet', 'armor', 'feet', 'ring', 'relic'];

export const TIERS = {
  1: { name: 'Tier 1', color: '#9ca3af', multiplier: 1.0 },
  2: { name: 'Tier 2', color: '#22c55e', multiplier: 1.3 },
  3: { name: 'Tier 3', color: '#3b82f6', multiplier: 1.65 },
  4: { name: 'Tier 4', color: '#a855f7', multiplier: 2.1 },
  5: { name: 'Tier 5', color: '#f59e0b', multiplier: 2.7 },
  6: { name: 'Tier 6', color: '#ef4444', multiplier: 3.4 },
  7: { name: 'Tier 7', color: '#06b6d4', multiplier: 4.3 },
  8: { name: 'Tier 8', color: '#f472b6', multiplier: 5.5 },
};

export const UPGRADE_COSTS = { 1: 100, 2: 250, 3: 500, 4: 1000, 5: 2500, 6: 5000, 7: 10000 };

export const WEAPON_TYPES = {
  sword: { name: 'Fin Blade', icon: 'sword', hand: '1h' },
  axe: { name: 'Claw Axe', icon: 'axe', hand: '1h' },
  greatsword: { name: 'Current Blade', icon: 'crossed_swords', hand: '2h' },
  greataxe: { name: 'Anchor Axe', icon: 'axe', hand: '2h' },
  hammer2h: { name: 'Trident', icon: 'hammer', hand: '2h' },
  hammer1h: { name: 'Conch', icon: 'hammer', hand: '1h' },
  shield: { name: 'Shell Guard', icon: 'shield', hand: '1h' },
  staff: { name: 'Root Staff', icon: 'wand', hand: '2h' },
  dagger: { name: 'Water Spine', icon: 'sword', hand: '1h' },
  bow: { name: 'Spine Bow', icon: 'bow', hand: '2h' },
  crossbow: { name: 'Harpoon', icon: 'bow', hand: '2h' },
  gun: { name: 'Bubble Gun', icon: 'star', hand: '2h' },
  lance: { name: 'Narwhal Horn', icon: 'lance', hand: '2h' },
  tome: { name: 'Deep Codex', icon: 'book', hand: '1h' },
  relic: { name: 'Abyssal Relic', icon: 'crystal', hand: '1h' },
};

export const WEAPON_SKILLS = {
  sword: {
    slot1: [
      { id: 'ws_sword_slash', name: 'Fin Slash', icon: 'crossed_swords', description: 'A swift horizontal fin strike that restores resources', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
      { id: 'ws_sword_thrust', name: 'Fin Thrust', icon: 'sword', description: 'A piercing fin thrust aimed at vital points', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 9 },
    ],
    slot23: [
      { id: 'ws_riposte', name: 'Current Riposte', icon: 'crossed_swords', description: 'Counter with a precise current-riding strike dealing 1.6x damage', type: 'physical', damage: 1.6, manaCost: 0, staminaCost: 18, cooldown: 2, target: 'enemy' },
      { id: 'ws_blade_dance', name: 'Fin Dance', icon: 'sparkle', description: 'Rapid fin slashes that boost attack speed for 2 turns', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy', effect: { stat: 'attackSpeed', flat: 15, duration: 2 } },
      { id: 'ws_mortal_wound', name: 'Deep Gash', icon: 'target', description: 'A deep cut from serrated fins causing bleed for 3 turns', type: 'physical', damage: 1.3, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.12, duration: 3 } },
    ],
  },
  axe: {
    slot1: [
      { id: 'ws_axe_chop', name: 'Claw Chop', icon: 'axe', description: 'A brutal claw strike restoring resources', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 9 },
      { id: 'ws_axe_hack', name: 'Grove Hack', icon: 'axe', description: 'A savage hack with root-edged claws', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_rend', name: 'Scale Rend', icon: 'target', description: 'Rip into the enemy tearing scales, causing heavy bleed for 3 turns', type: 'physical', damage: 1.4, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.15, duration: 3 } },
      { id: 'ws_whirlwind', name: 'Maelstrom', icon: 'chaos', description: 'Spin in a devastating whirlpool arc', type: 'physical', damage: 1.8, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
      { id: 'ws_sunder_armor', name: 'Shell Breaker', icon: 'bomb', description: 'Smash through shell defenses, reducing enemy damage for 2 turns', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 18, cooldown: 3, target: 'enemy', effect: { stat: 'damage', multiplier: 0.7, duration: 2 } },
    ],
  },
  greatsword: {
    slot1: [
      { id: 'ws_gs_sweep', name: 'Current Sweep', icon: 'crossed_swords', description: 'A wide sweeping current strike that restores resources', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
      { id: 'ws_gs_overhead', name: 'Overhead Crash', icon: 'crossed_swords', description: 'A powerful overhead crash from above', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 6, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_gs_cleave', name: 'Abyssal Cleave', icon: 'bomb', description: 'Massive cleaving strike dealing 2x damage', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 25, cooldown: 2, target: 'enemy' },
      { id: 'ws_gs_whirlwind', name: 'Waters Tempest', icon: 'chaos', description: 'Spin creating a tempest of crushing water', type: 'physical', damage: 1.7, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy' },
      { id: 'ws_gs_execute', name: 'Depth Crush', icon: 'skull', description: 'Aim for weak points, dealing bonus damage to low HP targets', type: 'physical', damage: 1.5, manaCost: 0, staminaCost: 28, cooldown: 4, target: 'enemy', executeDamage: 2.5, executeThreshold: 0.3 },
    ],
  },
  greataxe: {
    slot1: [
      { id: 'ws_ga_slam', name: 'Anchor Slam', icon: 'axe', description: 'Slam down with anchor-like force', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 9 },
      { id: 'ws_ga_swing', name: 'Undertow Swing', icon: 'axe', description: 'A heavy arcing undertow swing', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
    ],
    slot23: [
      { id: 'ws_ga_rampage', name: 'Feeding Frenzy', icon: 'bomb', description: 'Enter a frenzy, boosting damage by 25% for 3 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 28, cooldown: 5, target: 'self', effect: { stat: 'damage', multiplier: 1.25, duration: 3 } },
      { id: 'ws_ga_bonecrusher', name: 'Shell Crusher', icon: 'skull', description: 'Crush the enemy with overwhelming force', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 30, cooldown: 3, target: 'enemy' },
      { id: 'ws_ga_bloodrage', name: 'Bloodcurrent', icon: 'target', description: 'Sacrifice HP for massive current damage', type: 'physical', damage: 2.5, manaCost: 0, staminaCost: 20, cooldown: 4, target: 'enemy' },
    ],
  },
  hammer2h: {
    slot1: [
      { id: 'ws_h2_smash', name: 'Trident Smash', icon: 'hammer', description: 'A thunderous downward trident smash', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 9 },
      { id: 'ws_h2_bash', name: 'Root Bash', icon: 'hammer', description: 'Bash with hardened root', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
    ],
    slot23: [
      { id: 'ws_h2_shockwave', name: 'Pressure Wave', icon: 'bomb', description: 'Slam the lakebed sending a pressure wave', type: 'physical', damage: 1.8, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy', effect: { type: 'stun', duration: 1 } },
      { id: 'ws_h2_pulverize', name: 'Depth Charge', icon: 'skull', description: 'Crush the target with immense deepwater pressure', type: 'physical', damage: 2.3, manaCost: 0, staminaCost: 30, cooldown: 4, target: 'enemy' },
      { id: 'ws_h2_earthshatter', name: 'Lakebed Shatter', icon: 'fire', description: 'Shatter the lakebed reducing enemy defense for 3 turns', type: 'physical', damage: 1.5, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', effect: { stat: 'defense', flat: -15, duration: 3 } },
    ],
  },
  hammer1h: {
    slot1: [
      { id: 'ws_h1_strike', name: 'Conch Strike', icon: 'hammer', description: 'A current-charged conch blow restoring resources', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 6, staminaGain: 6 },
      { id: 'ws_h1_crack', name: 'Shell Crack', icon: 'hammer', description: 'Crack your conch against the enemy', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_h1_concuss', name: 'Stunning Strike', icon: 'sparkle', description: 'Stun the target with a precise concussive strike', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 18, cooldown: 3, target: 'enemy', effect: { type: 'stun', duration: 1 } },
      { id: 'ws_h1_chain_smash', name: 'Current Chain', icon: 'battle', description: 'Rapid conch strikes building momentum like currents', type: 'physical', damage: 1.6, manaCost: 0, staminaCost: 20, cooldown: 2, target: 'enemy' },
      { id: 'ws_h1_thunderstrike', name: 'Storm Surge', icon: 'lightning', description: 'Channel storm energy through your conch', type: 'magical', damage: 1.8, manaCost: 20, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.1, duration: 2 } },
    ],
  },
  staff: {
    slot1: [
      { id: 'ws_staff_strike', name: 'Root Staff Strike', icon: 'wand', description: 'Channel current energy through your staff', type: 'magical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 8, staminaGain: 4 },
      { id: 'ws_staff_pulse', name: 'Bioluminescent Pulse', icon: 'sparkle', description: 'Emit a pulse of bioluminescent magic', type: 'magical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 9, staminaGain: 3 },
    ],
    slot23: [
      { id: 'ws_staff_nova', name: 'Current Nova', icon: 'sparkle', description: 'Release a burst of current energy', type: 'magical', damage: 2.0, manaCost: 30, staminaCost: 0, cooldown: 3, target: 'enemy' },
      { id: 'ws_staff_barrier', name: 'Root Barrier', icon: 'shield', description: 'Raise a root barrier boosting defense for 3 turns', type: 'buff', damage: 0, manaCost: 25, staminaCost: 0, cooldown: 4, target: 'self', effect: { stat: 'defense', flat: 18, duration: 3 } },
      { id: 'ws_staff_drain', name: 'Siphon Current', icon: 'chaos', description: 'Drain life force from the target like a remora', type: 'magical', damage: 1.4, manaCost: 20, staminaCost: 0, cooldown: 3, target: 'enemy', drainPercent: 0.15 },
    ],
  },
  dagger: {
    slot1: [
      { id: 'ws_dagger_stab', name: 'Spine Jab', icon: 'sword', description: 'A quick spine jab restoring resources', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
      { id: 'ws_dagger_slash', name: 'Barb Slash', icon: 'sword', description: 'A swift slash with a venomous barb', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 9 },
    ],
    slot23: [
      { id: 'ws_backstab', name: 'Ambush Strike', icon: 'sword', description: 'Strike from the shadows of the grove for critical damage', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', guaranteedCrit: true },
      { id: 'ws_envenom', name: 'Lionfish Sting', icon: 'skull', description: 'Apply deadly lionfish venom dealing damage over 4 turns', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 15, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.18, duration: 4 } },
      { id: 'ws_fan_of_knives', name: 'Fan of Spines', icon: 'star', description: 'Hurl a fan of water urchin spines at the target', type: 'physical', damage: 1.7, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy' },
    ],
  },
  bow: {
    slot1: [
      { id: 'ws_bow_shot', name: 'Spine Dart', icon: 'bow', description: 'A swift spine dart restoring resources', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 7 },
      { id: 'ws_bow_aim', name: 'Aimed Dart', icon: 'target', description: 'A carefully aimed spine dart', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 6 },
    ],
    slot23: [
      { id: 'ws_bow_volley', name: 'Spine Volley', icon: 'bow', description: 'Rain spines for heavy damage', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
      { id: 'ws_bow_pierce', name: 'Piercing Spine', icon: 'lance', description: 'Fire an armor-piercing spine', type: 'physical', damage: 1.8, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy', armorPiercing: true },
      { id: 'ws_bow_poison', name: 'Toxic Dart', icon: 'skull', description: 'Dart tipped with pufferfish venom', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 15, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.15, duration: 3 } },
    ],
  },
  crossbow: {
    slot1: [
      { id: 'ws_xbow_bolt', name: 'Harpoon Bolt', icon: 'bow', description: 'Fire a heavy harpoon bolt', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 3, staminaGain: 8 },
      { id: 'ws_xbow_snap', name: 'Quick Bolt', icon: 'bow', description: 'A quick follow-up bolt', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_xbow_heavy', name: 'Depth Bolt', icon: 'bomb', description: 'Fire a heavy bolt that staggers the target', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', effect: { stat: 'damage', multiplier: 0.8, duration: 1 } },
      { id: 'ws_xbow_explosive', name: 'Pressure Bolt', icon: 'bomb', description: 'Fire a pressure-charged bolt dealing massive damage', type: 'physical', damage: 2.4, manaCost: 0, staminaCost: 28, cooldown: 4, target: 'enemy' },
      { id: 'ws_xbow_net', name: 'Kelp Net', icon: 'target', description: 'Fire a kelp net that stuns for 1 turn', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } },
    ],
  },
  gun: {
    slot1: [
      { id: 'ws_gun_shot', name: 'Bubble Cannon', icon: 'star', description: 'Fire a pressurized bubble at the target', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 3, staminaGain: 8 },
      { id: 'ws_gun_hip', name: 'Snap Blast', icon: 'star', description: 'Quick blast from the hip', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_gun_sniper', name: 'Depth Snipe', icon: 'target', description: 'A carefully aimed shot that always crits', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', guaranteedCrit: true },
      { id: 'ws_gun_buckshot', name: 'Scatter Shot', icon: 'bomb', description: 'Blast with scattered root shrapnel for heavy damage', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
      { id: 'ws_gun_suppressive', name: 'Ink Cloud', icon: 'fire', description: 'Lay down an ink cloud reducing enemy damage for 2 turns', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 20, cooldown: 4, target: 'enemy', effect: { stat: 'damage', multiplier: 0.65, duration: 2 } },
    ],
  },
  lance: {
    slot1: [
      { id: 'ws_lance_thrust', name: 'Narwhal Thrust', icon: 'lance', description: 'Thrust your narwhal horn with precision', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 8 },
      { id: 'ws_lance_jab', name: 'Trident Jab', icon: 'lance', description: 'A rapid trident jab', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 7 },
    ],
    slot23: [
      { id: 'ws_lance_charge', name: 'Torpedo Charge', icon: 'energy', description: 'Charge forward with devastating torpedo force', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
      { id: 'ws_lance_impale', name: 'Skewer', icon: 'skull', description: 'Skewer the target causing bleed for 3 turns', type: 'physical', damage: 1.5, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.14, duration: 3 } },
      { id: 'ws_lance_sweep', name: 'Trident Sweep', icon: 'chaos', description: 'Sweep your trident in a wide arc', type: 'physical', damage: 1.8, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy' },
    ],
  },
  tome: {
    slot1: [
      { id: 'ws_tome_bolt', name: 'Current Bolt', icon: 'sparkle', description: 'Channel a bolt of current energy from your tome', type: 'magical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 9, staminaGain: 3 },
      { id: 'ws_tome_blast', name: 'Deep Water Blast', icon: 'crystal', description: 'Unleash abyssal power from ancient waterlogged pages', type: 'magical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 8, staminaGain: 4 },
    ],
    slot23: [
      { id: 'ws_tome_curse', name: 'Water Curse', icon: 'skull', description: 'Curse the target with ancient water magic, reducing their damage for 3 turns', type: 'magical', damage: 1.0, manaCost: 25, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { stat: 'damage', multiplier: 0.65, duration: 3 } },
      { id: 'ws_tome_hex', name: 'Kraken Hex', icon: 'chaos', description: 'Hex the enemy with kraken magic', type: 'magical', damage: 1.8, manaCost: 30, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'ws_tome_restore', name: 'Tome of Currents', icon: 'heart', description: 'Read a healing current incantation restoring 20% HP', type: 'heal', damage: 0, manaCost: 30, staminaCost: 0, cooldown: 4, target: 'self', healPercent: 0.20 },
    ],
  },
};

export const ARMOR_TYPES = {
  cloth: { name: 'Kelp Weave', icon: 'armor' },
  leather: { name: 'Scale Hide', icon: 'armor' },
  metal: { name: 'Shell Plate', icon: 'shield' },
};

export const HELMET_TYPES = {
  plate: { name: 'Shell Helm', icon: 'helm' },
  leather: { name: 'Scale Hood', icon: 'helm' },
  cloth: { name: 'Root Crown', icon: 'crown' },
};

export const FEET_TYPES = {
  plate: { name: 'Shell Greaves', icon: 'boots' },
  leather: { name: 'Scale Fins', icon: 'boots' },
  cloth: { name: 'Kelp Wraps', icon: 'boots' },
};

export const CLASS_EQUIPMENT_RULES = {
  warrior: {
    weaponTypes: ['sword', 'axe', 'greatsword', 'greataxe', 'hammer2h'],
    offhandTypes: ['shield'],
    armorTypes: ['metal'],
    helmetTypes: ['plate'],
    feetTypes: ['plate'],
  },
  worge: {
    weaponTypes: ['hammer1h', 'staff', 'dagger'],
    offhandTypes: [],
    armorTypes: ['leather', 'cloth'],
    helmetTypes: ['leather', 'cloth'],
    feetTypes: ['leather'],
  },
  ranger: {
    weaponTypes: ['bow', 'crossbow', 'gun', 'dagger', 'lance'],
    offhandTypes: [],
    armorTypes: ['leather', 'metal'],
    helmetTypes: ['leather', 'plate'],
    feetTypes: ['leather', 'plate'],
  },
  mage: {
    weaponTypes: ['staff', 'tome'],
    offhandTypes: ['relic'],
    armorTypes: ['cloth'],
    helmetTypes: ['cloth'],
    feetTypes: ['cloth'],
  },
};

const weaponTemplates = [
  { id: 'bloodfeud_blade', name: 'Tidefury Fin', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 3, block: 2 } },
  { id: 'wraithfang', name: 'Abyssal Fang', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 7, criticalChance: 5, drainHealth: 2 } },
  { id: 'oathbreaker', name: 'Oathroot', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 5, block: 4, defense: 3 } },
  { id: 'kinrend', name: 'Rapids Edge', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 4, attackSpeed: 3 } },
  { id: 'dusksinger', name: 'Siren Fin', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 6, criticalChance: 6, criticalDamage: 5 } },
  { id: 'emberclad', name: 'Volcanic Fin', slot: 'weapon', weaponType: 'sword', icon: 'sword', classReq: ['warrior'], stats: { physicalDamage: 7, criticalChance: 4, block: 3 } },

  { id: 'gorehowl', name: 'Grove Cleaver', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 8, criticalDamage: 6 } },
  { id: 'skullsplitter', name: 'Shell Splitter', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 8, criticalDamage: 4, armorPenetration: 2 } },
  { id: 'veinreaver', name: 'Current Reaver', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 7, criticalDamage: 5, drainHealth: 2 } },
  { id: 'ironmaw', name: 'Iron Jaw', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 8, block: 3, defense: 3 } },
  { id: 'dreadcleaver', name: 'Dread Claw', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 7, criticalDamage: 5, attackSpeed: 3 } },
  { id: 'bonehew', name: 'Root Hewer', slot: 'weapon', weaponType: 'axe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 9, block: 4, defense: 2 } },

  { id: 'nightfang', name: 'Moray Fang', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 8, drainHealth: 2 } },
  { id: 'bloodshiv', name: 'Barracuda Shiv', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 9, attackSpeed: 3 } },
  { id: 'wraithclaw', name: 'Phantom Claw', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 4, criticalChance: 10, evasion: 3 } },
  { id: 'emberfang', name: 'Vent Fang', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 7, magicDamage: 2 } },
  { id: 'ironspike', name: 'Urchin Spike', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 4, criticalChance: 6, block: 3, defense: 2 } },
  { id: 'duskblade', name: 'Twilight Barb', slot: 'weapon', weaponType: 'dagger', icon: 'dagger', classReq: ['worge', 'ranger'], stats: { physicalDamage: 5, criticalChance: 11, criticalDamage: 8 } },

  { id: 'skullsunder', name: 'Anchor Sunder', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 12, criticalDamage: 8, armorPenetration: 3 } },
  { id: 'bloodreaver_ga', name: 'Current Reaver', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 13, criticalDamage: 6, drainHealth: 3 } },
  { id: 'wraithhew', name: 'Phantom Hewer', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 11, criticalDamage: 7, attackSpeed: 3 } },
  { id: 'embermaul', name: 'Magma Maul', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 12, criticalDamage: 6, magicDamage: 3 } },
  { id: 'ironrend', name: 'Iron Anchor', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 13, block: 4, defense: 4 } },
  { id: 'dusksplitter', name: 'Depth Splitter', slot: 'weapon', weaponType: 'greataxe', icon: 'axe', classReq: ['warrior'], stats: { physicalDamage: 11, criticalDamage: 9, criticalChance: 4 } },

  { id: 'doomspire', name: 'Leviathan Fin', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 11, criticalChance: 4, armorPenetration: 3 } },
  { id: 'bloodspire', name: 'Crimson Current', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 12, drainHealth: 3, defense: 3 } },
  { id: 'wraithblade_gs', name: 'Phantom Blade', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 10, criticalChance: 5, criticalDamage: 8 } },
  { id: 'emberbrand', name: 'Hydrothermal Edge', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 11, magicDamage: 3, criticalChance: 4 } },
  { id: 'ironwrath', name: 'Iron Kelp', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 12, block: 5, defense: 4 } },
  { id: 'duskreaver_gs', name: 'Depth Reaver', slot: 'weapon', weaponType: 'greatsword', icon: 'crossed_swords', classReq: ['warrior'], stats: { physicalDamage: 10, criticalChance: 6, attackSpeed: 4 } },

  { id: 'titanmaul', name: 'Titan Trident', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 14, defense: 5, block: 4 } },
  { id: 'bloodcrusher', name: 'Root Crusher', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 14, drainHealth: 3, armorPenetration: 3 } },
  { id: 'wraithmaul', name: 'Phantom Trident', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 13, criticalDamage: 6, defense: 4 } },
  { id: 'emberforge', name: 'Vent Forged Trident', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 14, magicDamage: 3, block: 5 } },
  { id: 'ironbreaker', name: 'Shellbreaker', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 15, block: 6, defense: 5 } },
  { id: 'duskmallet', name: 'Abyssal Mallet', slot: 'weapon', weaponType: 'hammer2h', icon: 'hammer', classReq: ['warrior'], stats: { physicalDamage: 13, attackSpeed: 3, criticalDamage: 7 } },

  { id: 'ironfist', name: 'Iron Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 2, defense: 3, attackSpeed: 3 } },
  { id: 'bloodmaul', name: 'Crimson Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 5, magicDamage: 2, drainHealth: 2, attackSpeed: 3 } },
  { id: 'wraithknocker', name: 'Phantom Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 3, evasion: 3, attackSpeed: 3 } },
  { id: 'embermallet', name: 'Vent Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 3, defense: 3, block: 3 } },
  { id: 'ironshard', name: 'Grove Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 5, magicDamage: 1, block: 5, defense: 4 } },
  { id: 'duskhammer', name: 'Twilight Conch', slot: 'weapon', weaponType: 'hammer1h', icon: 'hammer', classReq: ['worge'], stats: { physicalDamage: 4, magicDamage: 2, criticalChance: 5, attackSpeed: 4 } },

  { id: 'wraithbone_bow', name: 'Root Spine Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 6, accuracy: 4 } },
  { id: 'bloodstring_bow', name: 'Crimson Spine Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 7, attackSpeed: 3 } },
  { id: 'shadowflight_bow', name: 'Shadow Grove Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 8, criticalDamage: 6 } },
  { id: 'emberthorn_bow', name: 'Vent Thorn Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 5, magicDamage: 2 } },
  { id: 'ironvine_bow', name: 'Kelp Vine Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 6, criticalChance: 4, defense: 3, accuracy: 5 } },
  { id: 'duskreaver_bow', name: 'Deep Current Bow', slot: 'weapon', weaponType: 'bow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 9, criticalDamage: 8 } },

  { id: 'ironveil_repeater', name: 'Grove Harpoon', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 8, criticalDamage: 7, accuracy: 4 } },
  { id: 'skullpiercer', name: 'Shell Piercer', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 9, criticalDamage: 9, armorPenetration: 3 } },
  { id: 'bloodreaver_xbow', name: 'Crimson Harpoon', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 8, drainHealth: 2, criticalDamage: 6 } },
  { id: 'wraithspike', name: 'Phantom Harpoon', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 8, criticalDamage: 8, evasion: 3 } },
  { id: 'emberbolt', name: 'Magma Harpoon', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 8, magicDamage: 2, criticalDamage: 6 } },
  { id: 'duskpiercer_xbow', name: 'Depth Harpoon', slot: 'weapon', weaponType: 'crossbow', icon: 'bow', classReq: ['ranger'], stats: { physicalDamage: 9, criticalDamage: 10, attackSpeed: 3 } },

  { id: 'bloodshot_flintlock', name: 'Pressure Cannon', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 10, criticalDamage: 8, accuracy: 3 } },
  { id: 'wraithfire_pistol', name: 'Biolume Blaster', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 10, magicDamage: 3, criticalDamage: 6 } },
  { id: 'embercannon', name: 'Hydrothermal Cannon', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 12, criticalDamage: 10, armorPenetration: 4 } },
  { id: 'ironbore_musket', name: 'Grove Bore Cannon', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 11, armorPenetration: 5, accuracy: 4 } },
  { id: 'duskshot_repeater', name: 'Deep Shot Repeater', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 9, attackSpeed: 5, criticalChance: 4 } },
  { id: 'skullblast_cannon', name: 'Abyssal Cannon', slot: 'weapon', weaponType: 'gun', icon: 'star', classReq: ['ranger'], stats: { physicalDamage: 13, criticalDamage: 12 } },

  { id: 'bloodspear', name: 'Crimson Horn', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 4, accuracy: 5 } },
  { id: 'wraithpike', name: 'Phantom Horn', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 5, evasion: 3 } },
  { id: 'emberlance', name: 'Vent Lance', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 8, magicDamage: 2, criticalChance: 3 } },
  { id: 'ironthrust', name: 'Iron Tusk', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 8, armorPenetration: 3, accuracy: 5 } },
  { id: 'duskpiercer_lance', name: 'Depth Piercer', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 7, criticalChance: 6, criticalDamage: 6 } },
  { id: 'skullimpaler', name: 'Narwhal Impaler', slot: 'weapon', weaponType: 'lance', icon: 'lance', classReq: ['ranger'], stats: { physicalDamage: 9, armorPenetration: 4, accuracy: 4 } },

  { id: 'bloodthorn_staff', name: 'Crimson Root Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 5, mana: 20, drainHealth: 2 } },
  { id: 'wraithwood_staff', name: 'Driftwood Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 5, mana: 25, manaRegen: 1 } },
  { id: 'emberspire_staff', name: 'Vent Spire Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 6, mana: 20, criticalChance: 3 } },
  { id: 'ironsoul_staff', name: 'Grove Soul Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 4, mana: 30, defense: 3, resistance: 3 } },
  { id: 'duskweaver_staff', name: 'Current Weaver Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 6, mana: 20, cooldownReduction: 3 } },
  { id: 'skullshroud_staff', name: 'Abyssal Staff', slot: 'weapon', weaponType: 'staff', icon: 'staff', classReq: ['mage', 'worge'], stats: { magicDamage: 7, mana: 15, drainHealth: 3 } },

  { id: 'grimoire_grudges', name: 'Codex of Currents', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 5, mana: 25, cooldownReduction: 2 } },
  { id: 'bloodscript_tome', name: 'Crimson Codex', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 6, mana: 20, drainHealth: 2 } },
  { id: 'wraith_codex', name: 'Phantom Codex', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 5, mana: 30, manaRegen: 1.5 } },
  { id: 'ember_lexicon', name: 'Volcanic Lexicon', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 6, mana: 20, criticalChance: 4 } },
  { id: 'ironsoul_grimoire', name: 'Grove Grimoire', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 4, mana: 30, defense: 3, resistance: 4 } },
  { id: 'duskbound_tome', name: 'Abyssal Codex', slot: 'weapon', weaponType: 'tome', icon: 'book', classReq: ['mage'], stats: { magicDamage: 7, mana: 15, cooldownReduction: 3 } },
];

const offhandTemplates = [
  { id: 'bloodward_shield', name: 'Crimson Shell', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 5, block: 6, health: 20 } },
  { id: 'wraithguard_bulwark', name: 'Phantom Bulwark', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 6, block: 8, resistance: 4 } },
  { id: 'emberbulwark', name: 'Volcanic Shell', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 6, block: 7, health: 25, damageReduction: 2 } },
  { id: 'ironfort_shield', name: 'Iron Grove Shell', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 8, block: 10, health: 30 } },
  { id: 'duskwall', name: 'Depth Wall', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 5, block: 6, evasion: 4, attackSpeed: 2 } },
  { id: 'skullshield', name: 'Nautilus Guard', slot: 'offhand', weaponType: 'shield', icon: 'shield', classReq: ['warrior'], stats: { defense: 7, block: 9, damageReduction: 3, health: 15 } },

  { id: 'bloodstone_orb', name: 'Crimson Pearl', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 3, mana: 20, drainHealth: 2 } },
  { id: 'wraithsoul_crystal', name: 'Phantom Crystal', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 3, mana: 25, manaRegen: 1 } },
  { id: 'emberheart_focus', name: 'Volcanic Focus', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 4, mana: 20, criticalChance: 3 } },
  { id: 'ironsoul_relic', name: 'Grove Relic', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 2, mana: 30, resistance: 4, defense: 2 } },
  { id: 'duskbound_skull', name: 'Abyssal Skull', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 4, mana: 20, cooldownReduction: 3 } },
  { id: 'voidheart_relic', name: 'Deep Void Pearl', slot: 'offhand', weaponType: 'relic', icon: 'crystal', classReq: ['mage'], stats: { magicDamage: 5, mana: 30, manaRegen: 1.5, drainHealth: 2 } },
];

const armorTemplates = [
  { id: 'bloodforged_mail', name: 'Crimson Shell Mail', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 6, health: 25 } },
  { id: 'wraithsteel_plate', name: 'Phantom Scale Plate', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 7, health: 20, resistance: 4 } },
  { id: 'emberguard_plate', name: 'Volcanic Shell Plate', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 7, health: 25, damageReduction: 2 } },
  { id: 'ironbound_armor', name: 'Iron Grove Armor', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 9, health: 30, block: 3 } },
  { id: 'duskthorn_plate', name: 'Depth Thorn Plate', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 6, health: 20, evasion: 3, attackSpeed: 2 } },
  { id: 'skullforge_plate', name: 'Nautilus Plate', slot: 'armor', armorType: 'metal', icon: 'armor', classReq: ['warrior', 'ranger'], stats: { defense: 8, health: 25, damageReduction: 3 } },

  { id: 'bloodhide_vest', name: 'Crimson Scale Vest', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 4, health: 20, evasion: 3 } },
  { id: 'wraithskin_leather', name: 'Phantom Skin', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 4, health: 15, evasion: 4, resistance: 3 } },
  { id: 'emberscale_hide', name: 'Volcanic Scale Hide', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 5, health: 20, evasion: 3, damageReduction: 2 } },
  { id: 'ironweave_leather', name: 'Iron Kelp Weave', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 6, health: 25, evasion: 2 } },
  { id: 'duskcloak', name: 'Depth Cloak', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 3, health: 15, evasion: 6, attackSpeed: 3 } },
  { id: 'skullthorn_hide', name: 'Urchin Hide', slot: 'armor', armorType: 'leather', icon: 'armor', classReq: ['worge', 'ranger'], stats: { defense: 5, health: 20, evasion: 3, criticalChance: 3 } },

  { id: 'bloodweave_robe', name: 'Crimson Kelp Robe', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 25, resistance: 4, drainHealth: 1 } },
  { id: 'wraithshroud_vestment', name: 'Phantom Vestment', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 30, resistance: 5, manaRegen: 1 } },
  { id: 'emberwoven_robe', name: 'Volcanic Weave Robe', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 3, mana: 25, resistance: 3, magicDamage: 2 } },
  { id: 'ironsoul_vestment', name: 'Grove Soul Vestment', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 4, mana: 20, resistance: 6, health: 15 } },
  { id: 'duskthread_robe', name: 'Depth Thread Robe', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 2, mana: 25, resistance: 3, cooldownReduction: 3 } },
  { id: 'skullveil_robe', name: 'Abyssal Veil Robe', slot: 'armor', armorType: 'cloth', icon: 'armor', classReq: ['mage', 'worge'], stats: { defense: 3, mana: 30, resistance: 4, magicDamage: 3 } },
];

const helmetTemplates = [
  { id: 'bloodforged_helm', name: 'Crimson Shell Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 4, health: 20, damageReduction: 1 } },
  { id: 'wraithsteel_helm', name: 'Phantom Scale Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 5, health: 15, resistance: 3 } },
  { id: 'emberguard_helm', name: 'Volcanic Shell Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 5, health: 25, block: 2 } },
  { id: 'ironbound_helm', name: 'Iron Grove Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 6, health: 30 } },
  { id: 'duskthorn_helm', name: 'Depth Thorn Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 4, health: 15, criticalChance: 2, evasion: 2 } },
  { id: 'skullforge_helm', name: 'Nautilus Helm', slot: 'helmet', helmetType: 'plate', icon: 'helm', classReq: ['warrior', 'ranger'], stats: { defense: 5, health: 20, armorPenetration: 2 } },

  { id: 'bloodhide_hood', name: 'Crimson Scale Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 3, evasion: 3, criticalChance: 2 } },
  { id: 'wraithskin_hood', name: 'Phantom Skin Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 3, evasion: 4, resistance: 2 } },
  { id: 'emberscale_hood', name: 'Volcanic Scale Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 3, evasion: 3, attackSpeed: 3 } },
  { id: 'ironweave_hood', name: 'Iron Kelp Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 4, evasion: 2, health: 15 } },
  { id: 'duskcloak_hood', name: 'Depth Cloak Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 2, evasion: 5, criticalChance: 3 } },
  { id: 'skullthorn_hood', name: 'Urchin Hood', slot: 'helmet', helmetType: 'leather', icon: 'helm', classReq: ['worge', 'ranger'], stats: { defense: 3, evasion: 3, physicalDamage: 2 } },

  { id: 'bloodweave_crown', name: 'Crimson Root Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 20, resistance: 3, magicDamage: 2 } },
  { id: 'wraithshroud_crown', name: 'Phantom Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 25, resistance: 4, manaRegen: 1 } },
  { id: 'emberwoven_crown', name: 'Volcanic Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 20, magicDamage: 3, criticalChance: 2 } },
  { id: 'ironsoul_crown', name: 'Grove Soul Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 20, defense: 3, resistance: 4 } },
  { id: 'duskthread_crown', name: 'Depth Thread Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 20, magicDamage: 2, cooldownReduction: 3 } },
  { id: 'skullveil_crown', name: 'Abyssal Crown', slot: 'helmet', helmetType: 'cloth', icon: 'crown', classReq: ['mage', 'worge'], stats: { mana: 25, magicDamage: 3, drainHealth: 1 } },
];

const feetTemplates = [
  { id: 'bloodforged_greaves', name: 'Crimson Shell Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 3, health: 15, block: 2 } },
  { id: 'wraithsteel_greaves', name: 'Phantom Scale Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 4, health: 10, resistance: 2 } },
  { id: 'emberguard_greaves', name: 'Volcanic Shell Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 4, health: 20, damageReduction: 1 } },
  { id: 'ironbound_greaves', name: 'Iron Grove Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 5, health: 20, block: 3 } },
  { id: 'duskthorn_greaves', name: 'Depth Thorn Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 3, attackSpeed: 3, evasion: 2 } },
  { id: 'skullforge_greaves', name: 'Nautilus Greaves', slot: 'feet', feetType: 'plate', icon: 'boots', classReq: ['warrior', 'ranger'], stats: { defense: 4, health: 15, armorPenetration: 2 } },

  { id: 'bloodhide_boots', name: 'Crimson Scale Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { evasion: 4, attackSpeed: 3 } },
  { id: 'wraithskin_boots', name: 'Phantom Skin Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { evasion: 5, resistance: 2 } },
  { id: 'emberscale_boots', name: 'Volcanic Scale Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { evasion: 3, attackSpeed: 4, criticalChance: 2 } },
  { id: 'ironweave_boots', name: 'Iron Kelp Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { defense: 3, evasion: 3, health: 10 } },
  { id: 'duskcloak_boots', name: 'Depth Cloak Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { evasion: 6, attackSpeed: 4 } },
  { id: 'skullthorn_boots', name: 'Urchin Fins', slot: 'feet', feetType: 'leather', icon: 'boots', classReq: ['worge', 'ranger'], stats: { evasion: 3, criticalChance: 3, physicalDamage: 1 } },

  { id: 'bloodweave_sandals', name: 'Crimson Kelp Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 15, resistance: 2, manaRegen: 1 } },
  { id: 'wraithshroud_sandals', name: 'Phantom Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 20, resistance: 3 } },
  { id: 'emberwoven_sandals', name: 'Volcanic Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 15, magicDamage: 2, cooldownReduction: 2 } },
  { id: 'ironsoul_sandals', name: 'Grove Soul Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 15, defense: 2, resistance: 3 } },
  { id: 'duskthread_sandals', name: 'Depth Thread Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 15, evasion: 3, attackSpeed: 2 } },
  { id: 'skullveil_sandals', name: 'Abyssal Wraps', slot: 'feet', feetType: 'cloth', icon: 'boots', classReq: ['mage', 'worge'], stats: { mana: 20, magicDamage: 2, drainHealth: 1 } },
];

const ringTemplates = [
  { id: 'bloodrage_ring', name: 'Crimson Current Ring', slot: 'ring', icon: 'ring', stats: { physicalDamage: 3, criticalChance: 3 } },
  { id: 'wraithfury_band', name: 'Phantom Current Band', slot: 'ring', icon: 'ring', stats: { physicalDamage: 3, attackSpeed: 4 } },
  { id: 'emberflame_signet', name: 'Volcanic Signet', slot: 'ring', icon: 'ring', stats: { magicDamage: 3, criticalDamage: 6 } },
  { id: 'ironwill_ring', name: 'Iron Grove Ring', slot: 'ring', icon: 'ring', stats: { physicalDamage: 2, defense: 4 } },
  { id: 'duskstrike_ring', name: 'Depth Strike Ring', slot: 'ring', icon: 'ring', stats: { criticalChance: 4, criticalDamage: 8 } },
  { id: 'skullcrush_band', name: 'Shell Crush Band', slot: 'ring', icon: 'ring', stats: { physicalDamage: 3, armorPenetration: 3 } },
  { id: 'swiftblade_trinket', name: 'Swiftfin Trinket', slot: 'ring', icon: 'lightning', stats: { attackSpeed: 5, criticalChance: 3 } },
  { id: 'shadow_step_ring', name: 'Shadow Current Ring', slot: 'ring', icon: 'lightning', stats: { evasion: 5, attackSpeed: 4 } },
  { id: 'ember_quickness', name: 'Slipstream Charm', slot: 'ring', icon: 'lightning', stats: { attackSpeed: 5, cooldownReduction: 3 } },
  { id: 'ironside_buckle', name: 'Grove Buckle', slot: 'ring', icon: 'lightning', stats: { block: 5, defense: 3 } },
  { id: 'duskrunner_boots', name: 'Depth Runner Fins', slot: 'ring', icon: 'lightning', stats: { evasion: 4, attackSpeed: 5 } },
  { id: 'grudgebearer_seal', name: 'Currentcaller Seal', slot: 'ring', icon: 'lightning', stats: { physicalDamage: 2, magicDamage: 2, criticalChance: 2, criticalDamage: 4 } },
];

const relicTemplates = [
  { id: 'bloodward_amulet', name: 'Crimson Amulet', slot: 'relic', icon: 'crystal', stats: { defense: 4, health: 25 } },
  { id: 'wraithshield_pendant', name: 'Phantom Pendant', slot: 'relic', icon: 'crystal', stats: { resistance: 5, evasion: 3 } },
  { id: 'emberbark_talisman', name: 'Volcanic Talisman', slot: 'relic', icon: 'crystal', stats: { defense: 3, damageReduction: 3 } },
  { id: 'ironheart_medallion', name: 'Iron Grove Medallion', slot: 'relic', icon: 'crystal', stats: { health: 30, block: 4 } },
  { id: 'duskguard_charm', name: 'Depth Guard Charm', slot: 'relic', icon: 'crystal', stats: { defense: 3, resistance: 4 } },
  { id: 'skullfort_talisman', name: 'Nautilus Talisman', slot: 'relic', icon: 'crystal', stats: { damageReduction: 3, health: 20 } },
  { id: 'bloodmoon_crystal', name: 'Crimson Moon Crystal', slot: 'relic', icon: 'crystal', stats: { magicDamage: 4, mana: 25 } },
  { id: 'wraithsoul_gem', name: 'Phantom Gem', slot: 'relic', icon: 'crystal', stats: { magicDamage: 3, manaRegen: 2 } },
  { id: 'embervoid_prism', name: 'Volcanic Prism', slot: 'relic', icon: 'crystal', stats: { magicDamage: 3, cooldownReduction: 4 } },
  { id: 'ironsoul_shard', name: 'Grove Soul Shard', slot: 'relic', icon: 'crystal', stats: { mana: 30, resistance: 4 } },
  { id: 'duskweaver_stone', name: 'Current Weaver Stone', slot: 'relic', icon: 'crystal', stats: { magicDamage: 4, mana: 20 } },
  { id: 'void_crystal', name: 'Abyss Crystal', slot: 'relic', icon: 'crystal', stats: { magicDamage: 4, drainHealth: 3 } },
  { id: 'lifesblood_totem', name: 'Water Sponge Totem', slot: 'relic', icon: 'nature', stats: { healthRegen: 3, health: 30 } },
  { id: 'wraithbalm_idol', name: 'Phantom Idol', slot: 'relic', icon: 'nature', stats: { healthRegen: 2, manaRegen: 2 } },
  { id: 'emberheart_totem', name: 'Root Heart Totem', slot: 'relic', icon: 'nature', stats: { health: 25, resistance: 4 } },
  { id: 'ironpulse_stone', name: 'Grove Pulse Stone', slot: 'relic', icon: 'nature', stats: { healthRegen: 3, defense: 3 } },
  { id: 'duskleaf_charm', name: 'Kelp Leaf Charm', slot: 'relic', icon: 'nature', stats: { healthRegen: 2, evasion: 4 } },
  { id: 'natures_heart', name: 'Waters Heart', slot: 'relic', icon: 'nature', stats: { health: 25, manaRegen: 2 } },
];

export const allEquipmentTemplates = [...weaponTemplates, ...offhandTemplates, ...armorTemplates, ...helmetTemplates, ...feetTemplates, ...ringTemplates, ...relicTemplates];

export function canClassEquip(classId, item) {
  if (!classId || !item) return false;
  if (item.classReq && !item.classReq.includes(classId)) return false;
  const rules = CLASS_EQUIPMENT_RULES[classId];
  if (!rules) return true;
  if (item.slot === 'weapon' && item.weaponType) {
    return rules.weaponTypes.includes(item.weaponType);
  }
  if (item.slot === 'offhand' && item.weaponType) {
    return rules.offhandTypes.includes(item.weaponType);
  }
  if (item.slot === 'armor' && item.armorType) {
    return rules.armorTypes.includes(item.armorType);
  }
  if (item.slot === 'helmet' && item.helmetType) {
    return rules.helmetTypes ? rules.helmetTypes.includes(item.helmetType) : true;
  }
  if (item.slot === 'feet' && item.feetType) {
    return rules.feetTypes ? rules.feetTypes.includes(item.feetType) : true;
  }
  if (item.slot === 'ring' || item.slot === 'relic') {
    return true;
  }
  return true;
}

function getDropTier(playerLevel, isBoss) {
  let baseTier = 1;
  if (playerLevel >= 16) baseTier = 4;
  else if (playerLevel >= 12) baseTier = 3;
  else if (playerLevel >= 7) baseTier = 2;
  else baseTier = 1;

  if (isBoss) baseTier = Math.min(8, baseTier + 1);

  const roll = Math.random();
  if (roll < 0.05 && baseTier < 8) return Math.min(8, baseTier + 2);
  if (roll < 0.20 && baseTier < 8) return Math.min(8, baseTier + 1);
  return baseTier;
}

export function generateLoot(enemyTemplateId, playerLevel, isBoss = false) {
  const drops = [];
  const dropChance = isBoss ? 1.0 : 0.35;

  if (Math.random() > dropChance) return drops;

  const itemCount = isBoss ? (1 + Math.floor(Math.random() * 2)) : 1;

  for (let i = 0; i < itemCount; i++) {
    const template = allEquipmentTemplates[Math.floor(Math.random() * allEquipmentTemplates.length)];
    const tier = getDropTier(playerLevel, isBoss);
    const mult = TIERS[tier].multiplier;
    const scaledStats = {};
    Object.entries(template.stats).forEach(([key, val]) => {
      scaledStats[key] = Math.round(val * mult * 10) / 10;
    });

    drops.push({
      id: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      templateId: template.id,
      name: template.name,
      slot: template.slot,
      icon: template.icon,
      weaponType: template.weaponType || null,
      armorType: template.armorType || null,
      helmetType: template.helmetType || null,
      feetType: template.feetType || null,
      relicType: template.relicType || null,
      tier,
      classReq: template.classReq || null,
      stats: scaledStats,
    });
  }

  const potionDropChance = isBoss ? 0.6 : 0.15;
  if (Math.random() < potionDropChance) {
    const potionPool = ['health_potion', 'mana_potion', 'stamina_potion'];
    if (isBoss) potionPool.push('speed_potion', 'cure_potion');
    if (isBoss && Math.random() < 0.3) potionPool.push('rezzy');
    const pick = potionPool[Math.floor(Math.random() * potionPool.length)];
    const consumable = createConsumable(pick);
    if (consumable) drops.push(consumable);
  }

  return drops;
}

export function upgradeItem(item) {
  if (!item || item.tier >= 8) return null;
  const cost = UPGRADE_COSTS[item.tier];
  if (!cost) return null;

  const newTier = item.tier + 1;
  const template = allEquipmentTemplates.find(t => t.id === item.templateId);
  if (!template) return null;

  const mult = TIERS[newTier].multiplier;
  const scaledStats = {};
  Object.entries(template.stats).forEach(([key, val]) => {
    scaledStats[key] = Math.round(val * mult * 10) / 10;
  });

  return {
    ...item,
    tier: newTier,
    stats: scaledStats,
  };
}

function createStarterItem(template) {
  return {
    id: `${template.id}_starter_${Math.random().toString(36).slice(2, 6)}`,
    templateId: template.id,
    name: template.name,
    slot: template.slot,
    icon: template.icon,
    weaponType: template.weaponType || null,
    armorType: template.armorType || null,
    helmetType: template.helmetType || null,
    feetType: template.feetType || null,
    relicType: template.relicType || null,
    tier: 1,
    classReq: template.classReq || null,
    stats: { ...template.stats },
  };
}

export function getStartingEquipment(classId) {
  const equipment = {};
  const classWeapons = {
    warrior: 'bloodfeud_blade',
    worge: 'ironfist',
    mage: 'bloodthorn_staff',
    ranger: 'wraithbone_bow',
  };
  const classOffhands = {
    warrior: 'bloodward_shield',
    mage: 'bloodstone_orb',
  };
  const classArmor = {
    warrior: 'bloodforged_mail',
    worge: 'bloodhide_vest',
    mage: 'bloodweave_robe',
    ranger: 'bloodforged_mail',
  };

  const weaponId = classWeapons[classId];
  if (weaponId) {
    const tmpl = weaponTemplates.find(t => t.id === weaponId);
    if (tmpl) equipment.weapon = createStarterItem(tmpl);
  }

  const offhandId = classOffhands[classId];
  if (offhandId) {
    const tmpl = offhandTemplates.find(t => t.id === offhandId);
    if (tmpl) equipment.offhand = createStarterItem(tmpl);
  }

  const armorId = classArmor[classId];
  if (armorId) {
    const tmpl = armorTemplates.find(t => t.id === armorId);
    if (tmpl) equipment.armor = createStarterItem(tmpl);
  }

  const classHelmets = {
    warrior: 'bloodforged_helm',
    worge: 'bloodhide_hood',
    mage: 'bloodweave_crown',
    ranger: 'bloodhide_hood',
  };
  const classBoots = {
    warrior: 'bloodforged_greaves',
    worge: 'bloodhide_boots',
    mage: 'bloodweave_sandals',
    ranger: 'bloodhide_boots',
  };

  const helmetId = classHelmets[classId];
  if (helmetId) {
    const tmpl = helmetTemplates.find(t => t.id === helmetId);
    if (tmpl) equipment.helmet = createStarterItem(tmpl);
  }

  const bootsId = classBoots[classId];
  if (bootsId) {
    const tmpl = feetTemplates.find(t => t.id === bootsId);
    if (tmpl) equipment.feet = createStarterItem(tmpl);
  }

  const ringTmpl = ringTemplates.find(t => t.id === 'bloodrage_ring');
  if (ringTmpl) equipment.ring = createStarterItem(ringTmpl);

  return equipment;
}

export function getEquipmentStatBonuses(equipment) {
  const bonuses = {};
  EQUIPMENT_SLOTS.forEach(slot => {
    const item = equipment[slot];
    if (item && item.stats) {
      Object.entries(item.stats).forEach(([key, val]) => {
        bonuses[key] = (bonuses[key] || 0) + val;
      });
    }
  });
  return bonuses;
}

export function getItemPrice(item) {
  if (item.slot === 'consumable') return item.price || 20;
  const statWeights = {
    physicalDamage: 8, magicDamage: 8, defense: 6, health: 0.8, mana: 0.6, stamina: 0.5,
    criticalChance: 7, criticalDamage: 3, block: 5, evasion: 6, resistance: 5,
    attackSpeed: 6, armorPenetration: 7, drainHealth: 10, damageReduction: 8,
    accuracy: 4, healthRegen: 8, manaRegen: 6, cooldownReduction: 7,
    blockEffect: 3, defenseBreak: 5, criticalEvasion: 5,
  };
  
  let statValue = 0;
  if (item.stats) {
    Object.entries(item.stats).forEach(([key, val]) => {
      statValue += Math.abs(val) * (statWeights[key] || 3);
    });
  }
  
  const slotMult = { weapon: 1.2, offhand: 1.0, helmet: 0.95, armor: 1.1, feet: 0.9, ring: 0.85, relic: 0.85 };
  const mult = slotMult[item.slot] || 1.0;
  
  const tierPremium = { 1: 1, 2: 1.5, 3: 2.2, 4: 3.2, 5: 4.5, 6: 6, 7: 8, 8: 11 };
  const tierMult = tierPremium[item.tier] || 1;
  
  const basePrice = Math.max(5, Math.floor(statValue * mult * tierMult));
  return basePrice;
}

export function getSellPrice(item) {
  if (item.slot === 'consumable') return Math.max(1, Math.floor((item.price || 20) * 0.4));
  return Math.max(1, Math.floor(getItemPrice(item) * 0.4));
}

export const CONSUMABLE_ITEMS = [
  { id: 'health_potion', name: 'Healing Current Elixir', icon: 'heart', slot: 'consumable', consumableType: 'health', description: 'Restores 40% HP to one ally', price: 50 },
  { id: 'mana_potion', name: 'Mana Root Elixir', icon: 'mana', slot: 'consumable', consumableType: 'mana', description: 'Restores 40% MP to one ally', price: 45 },
  { id: 'stamina_potion', name: 'Stamina Kelp Tonic', icon: 'energy', slot: 'consumable', consumableType: 'stamina', description: 'Restores 40% SP to one ally', price: 40 },
  { id: 'speed_potion', name: 'Slipstream Tonic', icon: 'lightning', slot: 'consumable', consumableType: 'speed', description: 'Boosts speed by 50% for 3 turns', price: 60 },
  { id: 'cure_potion', name: 'Purifying Anemone', icon: 'sparkle', slot: 'consumable', consumableType: 'cure', description: 'Removes all debuffs and DoTs from one ally', price: 55 },
  { id: 'rezzy', name: 'Water Sponge', icon: 'lance', slot: 'consumable', consumableType: 'resurrect', description: 'Resurrects a fallen ally with 30% HP', price: 200 },
];

export function createConsumable(templateId) {
  const template = CONSUMABLE_ITEMS.find(c => c.id === templateId);
  if (!template) return null;
  return {
    ...template,
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    templateId: template.id,
    stats: {},
    tier: 0,
  };
}

export function generateShopInventory(playerLevel, classId) {
  const shopItems = [];
  const maxTier = Math.min(8, Math.max(1, Math.ceil(playerLevel / 3)));
  
  const availableTemplates = allEquipmentTemplates.filter(t => {
    if (t.classReq && !t.classReq.includes(classId)) return false;
    return true;
  });
  
  const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
  const count = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const template = shuffled[i];
    let tier = maxTier;
    const roll = Math.random();
    if (roll < 0.3) tier = Math.max(1, maxTier - 1);
    if (roll < 0.1) tier = Math.max(1, maxTier - 2);
    
    const mult = TIERS[tier].multiplier;
    const scaledStats = {};
    Object.entries(template.stats).forEach(([key, val]) => {
      scaledStats[key] = Math.round(val * mult * 10) / 10;
    });
    
    const item = {
      id: `shop_${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      templateId: template.id,
      name: template.name,
      slot: template.slot,
      icon: template.icon,
      weaponType: template.weaponType || null,
      armorType: template.armorType || null,
      helmetType: template.helmetType || null,
      feetType: template.feetType || null,
      relicType: template.relicType || null,
      tier,
      classReq: template.classReq || null,
      stats: scaledStats,
    };
    shopItems.push(item);
  }

  const potionTypes = ['health_potion', 'mana_potion', 'stamina_potion'];
  for (const pId of potionTypes) {
    const qty = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < qty; j++) {
      shopItems.push(createConsumable(pId));
    }
  }
  const extraConsumables = ['speed_potion', 'cure_potion', 'rezzy'];
  for (const cId of extraConsumables) {
    if (Math.random() < (cId === 'rezzy' ? 0.5 : 0.7)) {
      const qty = cId === 'rezzy' ? 1 : (1 + Math.floor(Math.random() * 2));
      for (let j = 0; j < qty; j++) {
        shopItems.push(createConsumable(cId));
      }
    }
  }
  
  return shopItems;
}
