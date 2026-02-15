export const classDefinitions = {
  warrior: {
    name: 'Bruiser',
    icon: 'crossed_swords',
    color: '#ef4444',
    description: 'A fearless frontline fighter specializing in raw power and deepwater defense.',
    lore: 'Bred in the crushing depths of the Hadal Trench, Warriors are the backbone of any war party. Their strength and endurance are unmatched in the deep.',
    startingAttributes: { Strength: 5, Vitality: 3, Endurance: 2, Dexterity: 1, Agility: 1, Intellect: 0, Wisdom: 0, Tactics: 0 },
    abilities: [
      { id: 'slash', name: 'Fin Slash', icon: 'crossed_swords', description: 'A sweeping fin strike that restores resources', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 5, staminaGain: 8 },
      { id: 'power_strike', name: 'Tail Slam', icon: 'bomb', description: 'A devastating tail slam dealing 2x damage', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 25, cooldown: 2, target: 'enemy' },
      { id: 'war_cry', name: 'Battle Surge', icon: 'battle', description: 'Boost your damage by 30% for 3 turns with a primal surge', type: 'buff', damage: 0, manaCost: 0, staminaCost: 30, cooldown: 5, target: 'self', effect: { stat: 'damage', multiplier: 1.3, duration: 3 } },
      { id: 'shield_bash', name: 'Shell Bash', icon: 'shield', description: 'Stun the enemy with a hardened shell strike for 1 turn', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 20, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } },
      { id: 'cleave', name: 'Razor Fin', icon: 'target', description: 'Slice deep with razor-sharp fins, causing bleed for 3 turns', type: 'physical', damage: 1.5, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.12, duration: 3 } },
      { id: 'demon_blade', name: 'Leviathan Form', icon: 'sword', description: 'Transform into a Leviathan for 3 turns, gaining +40% damage and +15 defense', type: 'buff', damage: 0, manaCost: 0, staminaCost: 40, cooldown: 8, target: 'self', isDemonBlade: true, effect: { stat: 'damage', multiplier: 1.4, duration: 3 }, defenseBoost: { stat: 'defense', flat: 15, duration: 3 } },
    ],
    signatureAbility: { id: 'invincible', name: 'Abyssal Guard', icon: 'shield', description: 'Become invulnerable for 2 turns, encased in deepwater pressure armor', type: 'buff', damage: 0, manaCost: 0, staminaCost: 35, cooldown: 8, target: 'self', isInvincible: true, effect: { stat: 'defense', flat: 999, duration: 2 } }
  },
  mage: {
    name: 'Mystic',
    icon: 'crystal',
    color: '#8b5cf6',
    description: 'Master of current magic and root healing arts.',
    lore: 'Drawing power from volcanic vents and ancient root ley lines, Mage Priests wield destructive current magic alongside sacred healing — a balance few can master.',
    startingAttributes: { Strength: 0, Vitality: 1, Endurance: 1, Dexterity: 0, Agility: 0, Intellect: 5, Wisdom: 4, Tactics: 1 },
    abilities: [
      { id: 'arcane_bolt', name: 'Current Bolt', icon: 'sparkle', description: 'A focused current pulse that restores resources', type: 'magical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 8, staminaGain: 5 },
      { id: 'fireball', name: 'Hydrothermal Blast', icon: 'fire', description: 'Hurls superheated vent water dealing massive damage + burn', type: 'magical', damage: 2.5, manaCost: 35, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.1, duration: 2 } },
      { id: 'heal', name: 'Root Mend', icon: 'heart', description: 'Restore 30% of max HP with regenerative root magic', type: 'heal', damage: 0, manaCost: 40, staminaCost: 0, cooldown: 4, target: 'self', healPercent: 0.30 },
      { id: 'ice_storm', name: 'Frozen Current', icon: 'ice', description: 'Freezes the enemy in an icy current, reducing their damage', type: 'magical', damage: 1.8, manaCost: 30, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { stat: 'damage', multiplier: 0.6, duration: 2 } },
    ],
    signatureAbility: { id: 'mana_shield', name: 'Bubble Shield', icon: 'shield', description: 'Encase yourself in a pressurized bubble barrier', type: 'buff', damage: 0, manaCost: 50, staminaCost: 0, cooldown: 5, target: 'self', effect: { stat: 'defense', flat: 25, duration: 3 } }
  },
  worge: {
    name: 'Vesselist',
    icon: 'wolf',
    color: '#d97706',
    description: 'A shapeshifter who wields current and storm magic, then transforms into a devastating lake predator.',
    lore: 'Worges swim between forms — scholars of current and grove in mortal guise, unstoppable predators in beast form. Their conch and spine channel primal water energies until the wild within is unleashed.',
    startingAttributes: { Strength: 2, Vitality: 2, Endurance: 1, Dexterity: 2, Agility: 2, Intellect: 2, Wisdom: 1, Tactics: 0 },
    abilities: [
      { id: 'mace_strike', name: 'Conch Strike', icon: 'hammer', description: 'A current-charged conch blow that restores resources', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 6, staminaGain: 6 },
      { id: 'lightning_lash', name: 'Electric Eel Lash', icon: 'lightning', description: 'Call down a bolt of bioelectric energy on the target', type: 'magical', damage: 1.8, manaCost: 25, staminaCost: 0, cooldown: 2, target: 'enemy', effect: { type: 'dot', damage: 0.1, duration: 2 } },
      { id: 'natures_grasp', name: "Kelp Embrace", icon: 'nature', description: 'Healing kelp wraps restore health over 3 turns', type: 'heal_over_time', damage: 0, manaCost: 20, staminaCost: 0, cooldown: 4, target: 'self', healPercent: 0.08, duration: 3 },
      { id: 'dagger_toss', name: 'Spine Shot', icon: 'sword', description: 'Hurl a venomous spine, poisoning for 3 turns', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 15, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.15, duration: 3 } },
    ],
    signatureAbility: { id: 'bear_form', name: 'Shark Form', icon: 'wolf', description: 'Transform into a ferocious shark, boosting damage and defense', type: 'buff', damage: 0, manaCost: 0, staminaCost: 20, cooldown: 0, target: 'self', isBearForm: true, effect: { stat: 'damage', multiplier: 1.25, duration: 99 }, defenseBoost: { stat: 'defense', flat: 10, duration: 99 } },
    bearFormAbilities: {
      mace_strike: { id: 'maul', name: 'Savage Bite', icon: 'wolf', description: 'Savage jaws rip the target, restoring resources', type: 'physical', damage: 1.3, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 8 },
      natures_grasp: { id: 'natures_taunt', name: "Predator's Roar", icon: 'nature', description: 'Roar with primal fury, taunting all enemies and boosting defense for 2 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'self', effect: { stat: 'defense', flat: 15, duration: 2 } },
      dagger_toss: { id: 'worge_charge', name: 'Torpedo Rush', icon: 'wolf', description: 'Lunge at the enemy with torpedo speed, dealing heavy damage', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 25, cooldown: 3, target: 'enemy' },
    }
  },
  ranger: {
    name: 'Scraper',
    icon: 'bow',
    color: '#22c55e',
    description: 'A deadly marksman with precise long-range attacks from the kelp canopy.',
    lore: 'Silent and patient, Rangers strike from the kelp shadows with lethal precision. Their spines find gaps in even the thickest scales.',
    startingAttributes: { Strength: 1, Vitality: 1, Endurance: 1, Dexterity: 4, Agility: 3, Intellect: 1, Wisdom: 0, Tactics: 1 },
    abilities: [
      { id: 'quick_shot', name: 'Spine Dart', icon: 'bow', description: 'A swift spine dart that restores resources', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy', manaGain: 4, staminaGain: 7 },
      { id: 'aimed_shot', name: 'Harpoon Shot', icon: 'target', description: 'A carefully aimed harpoon that always crits', type: 'physical', damage: 2.0, manaCost: 0, staminaCost: 20, cooldown: 2, target: 'enemy', guaranteedCrit: true },
      { id: 'poison_arrow', name: 'Toxic Barb', icon: 'skull', description: 'Poisons the enemy with a toxic barb for damage over time', type: 'physical', damage: 0.7, manaCost: 0, staminaCost: 15, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.2, duration: 3 } },
      { id: 'evasive_maneuver', name: 'Slipstream', icon: 'energy', description: 'Increase evasion by 50% for 2 turns by riding the current', type: 'buff', damage: 0, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'self', effect: { stat: 'evasion', flat: 50, duration: 2 } },
      { id: 'volley', name: 'Spine Volley', icon: 'bow', description: 'Rain spines for heavy damage', type: 'physical', damage: 2.4, manaCost: 0, staminaCost: 28, cooldown: 4, target: 'enemy' },
    ],
    signatureAbility: { id: 'focus', name: 'Predator Focus', icon: 'target', description: 'Passive: +10% crit per turn (max 5 stacks). Critting spends stacks. Active: Double stacks and guarantee next crit.', type: 'focus', damage: 0, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'self', isFocus: true }
  }
};

export const CLASS_TIERS = [
  { minRank: 1, maxRank: 10, name: 'Legendary', className: 'legendary', desc: 'Mythical power achieved through perfect synergy.', color: '#89f7fe' },
  { minRank: 11, maxRank: 50, name: 'Warlord', className: 'warlord', desc: 'A dominant force on the battlefield.', color: '#f97316' },
  { minRank: 51, maxRank: 100, name: 'Epic', className: 'epic', desc: 'A hero of renown and great skill.', color: '#a855f7' },
  { minRank: 101, maxRank: 200, name: 'Hero', className: 'hero', desc: 'A capable adventurer with potential.', color: '#3b82f6' },
  { minRank: 201, maxRank: 300, name: 'Normal', className: 'normal', desc: 'A standard combatant.', color: '#9ca3af' }
];
