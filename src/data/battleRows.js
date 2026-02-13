export const PLAYER_ROWS = {
  front: {
    id: 'front',
    name: 'Front Line',
    icon: 'shield',
    index: 0,
    description: 'Vanguard position. +5% Damage, +5% Crit, +10% Damage Taken. Guardian passive.',
    modifiers: {
      damageBonus: 0.05,
      critChanceBonus: 5,
      damageTakenBonus: 0.10,
    },
    hasGuardian: true,
  },
  battle: {
    id: 'battle',
    name: 'Battle Line',
    icon: 'crossed_swords',
    index: 1,
    description: 'Assault position. +5% Damage dealt, +5% Damage taken, -5% Block/Dodge.',
    modifiers: {
      damageBonus: 0.05,
      damageTakenBonus: 0.05,
      dodgePenalty: 5,
      blockPenalty: 5,
    },
  },
  support: {
    id: 'support',
    name: 'Support Row',
    icon: 'energy',
    index: 2,
    description: 'Tactical position. +5% Speed, +5% Accuracy, -2% Dodge/Block.',
    modifiers: {
      speedBonus: 0.05,
      accuracyBonus: 5,
      dodgePenalty: 2,
      blockPenalty: 2,
    },
  },
  back: {
    id: 'back',
    name: 'Back Row',
    icon: 'bow',
    index: 3,
    description: 'Rear position. +10% Healing, -10% All Damage, +10% Dodge/Block.',
    modifiers: {
      healingBonus: 0.10,
      damageBonus: -0.10,
      dodgeBonus: 10,
      blockBonus: 10,
    },
  },
};

export const ENEMY_ROWS = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    icon: 'crossed_swords',
    index: 0,
    description: 'Front-line enemy position.',
    modifiers: {},
  },
  formation: {
    id: 'formation',
    name: 'Formation',
    icon: 'shield',
    index: 1,
    description: 'Standard enemy position. Bosses command from here.',
    modifiers: {
      defenseBonus: 5,
    },
  },
  charge: {
    id: 'charge',
    name: 'Charge',
    icon: 'skull',
    index: 2,
    description: 'Aggressive assault. +Damage, +Crit, but -Defense, -Block.',
    modifiers: {
      damageMult: 1.25,
      critBonus: 10,
      defenseMult: 0.7,
      blockPenalty: 10,
    },
  },
};

export const RANGED_WEAPON_TYPES = ['bow', 'crossbow', 'gun', 'staff', 'tome'];

export function isUnitRanged(unit) {
  if (unit.classId === 'ranger' || unit.classId === 'mage') return true;
  const wt = unit.weaponType;
  if (wt && RANGED_WEAPON_TYPES.includes(wt)) return true;
  if (unit.templateId === 'dark_mage' || unit.templateId === 'lich') return true;
  if (unit.templateId === 'water_elemental' || unit.templateId === 'nature_elemental') return true;
  if (unit.templateId === 'corrupted_grove_keeper') return true;
  return false;
}

export function getRowModifiers(unit) {
  if (!unit.row) return {};
  if (unit.team === 'player') {
    return PLAYER_ROWS[unit.row]?.modifiers || {};
  }
  return ENEMY_ROWS[unit.row]?.modifiers || {};
}

export function getRowConfig(unit) {
  if (!unit.row) return null;
  if (unit.team === 'player') return PLAYER_ROWS[unit.row] || null;
  return ENEMY_ROWS[unit.row] || null;
}

export function getRowName(unit) {
  const cfg = getRowConfig(unit);
  return cfg?.name || 'Unknown';
}

export function getDefaultRow(unit) {
  if (unit.team === 'player') {
    if (isUnitRanged(unit)) return 'support';
    if (unit.classId === 'warrior') return 'front';
    return 'battle';
  }
  if (unit.isBoss) return 'formation';
  return 'vanguard';
}

export function getAdjacentRows(unit) {
  const rows = unit.team === 'player'
    ? ['front', 'battle', 'support', 'back']
    : ['vanguard', 'formation', 'charge'];
  const currentIndex = rows.indexOf(unit.row);
  if (currentIndex === -1) return [];
  const adjacent = [];
  if (currentIndex > 0) adjacent.push(rows[currentIndex - 1]);
  if (currentIndex < rows.length - 1) adjacent.push(rows[currentIndex + 1]);
  return adjacent;
}

export function getRowPositions(units, side) {
  const rows = side === 'player'
    ? ['front', 'battle', 'support', 'back']
    : ['charge', 'vanguard', 'formation'];

  const rowUnits = {};
  rows.forEach(r => { rowUnits[r] = []; });
  units.forEach(u => {
    const row = u.row || (side === 'player' ? 'battle' : 'vanguard');
    if (rowUnits[row]) rowUnits[row].push(u);
    else {
      const fallback = side === 'player' ? 'battle' : 'vanguard';
      if (rowUnits[fallback]) rowUnits[fallback].push(u);
    }
  });

  const positions = {};

  if (side === 'player') {
    const rowXBase = { front: 30, battle: 24, support: 16, back: 10 };
    const ySlots = [72, 88, 80, 96];
    rows.forEach(row => {
      const ru = rowUnits[row];
      const xBase = rowXBase[row];
      ru.forEach((u, i) => {
        const yPos = ySlots[i % ySlots.length];
        const xOffset = (i % 2 === 0) ? 0 : 6;
        positions[u.id] = { x: xBase + xOffset, y: yPos, column: i % 4 };
      });
    });
  } else {
    const rowXBase = { charge: 60, vanguard: 70, formation: 80 };
    const ySlots = [72, 88, 80, 96];
    rows.forEach(row => {
      const ru = rowUnits[row];
      const xBase = rowXBase[row];
      ru.forEach((u, i) => {
        const yPos = ySlots[i % ySlots.length];
        const xOffset = (i % 2 === 0) ? 0 : -6;
        positions[u.id] = { x: xBase + xOffset, y: yPos, column: i % 4 };
      });
    });
  }

  return positions;
}

export function applyRowCombatModifiers(attacker, defender, ability, result) {
  const atkMods = getRowModifiers(attacker);
  const defMods = getRowModifiers(defender);
  const isPhysical = ability?.type === 'physical';
  const isMagic = ability?.type === 'magical';
  const isHeal = ability?.type === 'heal';

  if (!isPhysical && !isMagic && !isHeal) return result;

  let { totalDmg, isCrit, blocked, evaded } = result;

  if (isHeal && atkMods.healingBonus) {
    totalDmg = Math.floor(totalDmg * (1 + atkMods.healingBonus));
    return { ...result, totalDmg };
  }

  let dodgeBonus = 0;
  if (defMods.dodgeBonus) dodgeBonus += defMods.dodgeBonus;
  if (defMods.dodgePenalty) dodgeBonus -= defMods.dodgePenalty;

  if (!evaded && dodgeBonus > 0) {
    if (Math.random() * 100 < dodgeBonus) {
      return { ...result, totalDmg: 0, evaded: true, rowEvaded: true };
    }
  }

  let blockBonus = 0;
  if (defMods.blockBonus) blockBonus += defMods.blockBonus;
  if (defMods.blockPenalty) blockBonus -= defMods.blockPenalty;

  if (!blocked && !evaded && blockBonus > 0) {
    if (Math.random() * 100 < blockBonus) {
      totalDmg = Math.floor(totalDmg * 0.4);
      blocked = true;
      result.rowBlocked = true;
    }
  }

  if (atkMods.damageBonus) {
    totalDmg = Math.floor(totalDmg * (1 + atkMods.damageBonus));
  }

  if (atkMods.critChanceBonus && !isCrit) {
    if (Math.random() * 100 < atkMods.critChanceBonus) {
      isCrit = true;
      totalDmg = Math.floor(totalDmg * 1.5);
    }
  }

  if (defMods.damageTakenBonus) {
    totalDmg = Math.floor(totalDmg * (1 + defMods.damageTakenBonus));
  }

  if (atkMods.accuracyBonus && !evaded && dodgeBonus > 0) {
    if (Math.random() * 100 < atkMods.accuracyBonus) {
      evaded = false;
    }
  }

  totalDmg = Math.max(1, totalDmg);

  return { ...result, totalDmg, isCrit, blocked, evaded };
}

export function getRowSpeedModifier(unit) {
  const mods = getRowModifiers(unit);
  return mods.speedBonus || 0;
}

export function getGuardianProcChance(guardianUnit) {
  if (!guardianUnit || !guardianUnit.attributePoints) return 0.05;
  const attrs = guardianUnit.attributePoints;
  const largestStat = Math.max(...Object.values(attrs).map(v => v || 0));
  return 0.05 + (0.005 * largestStat);
}

export function checkGuardianIntercept(defender, allPlayerUnits, attackerUnit) {
  if (!attackerUnit || isUnitRanged(attackerUnit)) return null;
  if (defender.row === 'front') return null;

  const frontLiners = allPlayerUnits.filter(u =>
    u.row === 'front' && u.health > 0 && u.id !== defender.id
  );
  if (frontLiners.length === 0) return null;

  const guardian = frontLiners[Math.floor(Math.random() * frontLiners.length)];
  const procChance = getGuardianProcChance(guardian);

  if (Math.random() < procChance) {
    return guardian;
  }
  return null;
}

export function shouldBossShiftRow(boss) {
  if (!boss.isBoss) return null;
  const hpPercent = boss.health / boss.maxHealth;

  if (hpPercent < 0.3 && boss.row === 'charge') {
    return 'formation';
  }
  if (hpPercent < 0.6 && hpPercent >= 0.3 && boss.row !== 'charge') {
    return 'charge';
  }
  return null;
}

export function getAIRowPreference(unit, allUnits) {
  const hpPercent = unit.health / unit.maxHealth;
  const ranged = isUnitRanged(unit);

  if (unit.isBoss) {
    return shouldBossShiftRow(unit);
  }

  if (hpPercent < 0.3 && unit.row === 'vanguard') {
    return 'formation';
  }

  if (ranged && unit.row === 'vanguard') {
    return Math.random() < 0.3 ? 'formation' : null;
  }

  if (!ranged && unit.row === 'formation' && hpPercent > 0.6) {
    return Math.random() < 0.3 ? 'vanguard' : null;
  }

  return null;
}
