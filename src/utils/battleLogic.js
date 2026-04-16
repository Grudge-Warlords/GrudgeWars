import { calculateStats, getBuildClassification } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { skillTrees } from '../data/skillTrees';
import { getEquipmentStatBonuses } from '../data/equipment';
import { getDefaultLoadout, getAllAbilityMap } from '../utils/abilityLoadout';
import { getBestItemBonuses } from '../data/heroBestItems';
import { getDefaultRow, getRowPositions, applyRowCombatModifiers, getAIRowPreference } from '../data/battleRows';

export function floorTo2(n) { return Math.floor(n * 100) / 100; }

export function getHeroSkillBonuses(hero) {
  const bonuses = {};
  if (!hero.classId) return bonuses;
  const tree = skillTrees[hero.classId];
  if (!tree) return bonuses;
  const heroSkills = hero.unlockedSkills || {};
  tree.tiers.forEach(tier => {
    tier.skills.forEach(skill => {
      const points = heroSkills[skill.id] || 0;
      if (points > 0 && skill.bonuses) {
        Object.entries(skill.bonuses).forEach(([stat, val]) => {
          bonuses[stat] = (bonuses[stat] || 0) + val * points;
        });
      }
    });
  });
  return bonuses;
}

export function getHeroStatsWithBonuses(hero) {
  const stats = calculateStats(hero.attributePoints, hero.level);
  const skillBonuses = getHeroSkillBonuses(hero);
  Object.entries(skillBonuses).forEach(([key, val]) => {
    if (stats[key] !== undefined) stats[key] += val;
  });
  const equipBonuses = getEquipmentStatBonuses(hero.equipment || {});
  Object.entries(equipBonuses).forEach(([key, val]) => {
    if (stats[key] !== undefined) stats[key] += val;
    else stats[key] = val;
  });
  if (hero.enchantBonuses) {
    Object.entries(hero.enchantBonuses).forEach(([key, val]) => {
      if (stats[key] !== undefined) stats[key] += val;
      else stats[key] = val;
    });
  }
  const bestBonuses = getBestItemBonuses(hero);
  Object.entries(bestBonuses).forEach(([key, val]) => {
    if (stats[key] !== undefined) stats[key] += val;
    else stats[key] = val;
  });
  return stats;
}

export function getSkillTreeAbilities(hero) {
  const tree = skillTrees[hero.classId];
  if (!tree) return [];
  const abilities = [];
  const heroSkills = hero.unlockedSkills || {};
  for (const tier of tree.tiers) {
    for (const skill of tier.skills) {
      if (skill.grantedAbility && (heroSkills[skill.id] || 0) > 0) {
        abilities.push(skill.grantedAbility);
      }
    }
  }
  return abilities;
}

export function createHeroBattleUnit(hero) {
  const cls = classDefinitions[hero.classId];
  if (!cls) return null;
  const stats = getHeroStatsWithBonuses(hero);
  const heroWeaponType = hero.equipment?.weapon?.weaponType || null;
  const buildInfo = getBuildClassification(stats, hero.attributePoints);
  const unit = {
    id: hero.id,
    name: hero.name,
    team: 'player',
    isPlayerControlled: true,
    classId: hero.classId,
    raceId: hero.raceId,
    templateId: null,
    weaponType: heroWeaponType,
    bearForm: false,
    demonBlade: false,
    eliteForm: buildInfo.rank <= 100,
    health: Math.min(hero.currentHealth, Math.floor(stats.health)),
    maxHealth: Math.floor(stats.health),
    mana: Math.min(hero.currentMana, Math.floor(stats.mana)),
    maxMana: Math.floor(stats.mana),
    stamina: Math.min(hero.currentStamina, Math.floor(stats.stamina)),
    maxStamina: Math.floor(stats.stamina),
    physicalDamage: stats.physicalDamage || 0,
    magicDamage: stats.magicDamage || 0,
    defense: stats.defense,
    speed: 20 + Math.floor((hero.attributePoints.Agility || 0) * 0.3),
    critChance: stats.criticalChance || 5,
    criticalDamage: stats.criticalDamage || 50,
    evasion: stats.evasion || 0,
    block: stats.block || 0,
    blockEffect: stats.blockEffect || 0,
    damageReduction: stats.damageReduction || 0,
    drainHealth: stats.drainHealth || 0,
    healthRegen: stats.healthRegen || 0,
    manaRegen: stats.manaRegen || 0,
    defenseBreak: stats.defenseBreak || 0,
    criticalEvasion: stats.criticalEvasion || 0,
    abilityLoadout: hero.abilityLoadout || getDefaultLoadout(hero.classId, heroWeaponType),
    abilities: Object.values(getAllAbilityMap(hero.classId, heroWeaponType, hero.unlockedSkills || {})),
    cooldowns: {},
    buffs: [], dots: [], stunned: false, alive: true,
    level: hero.level,
    focusStacks: 0,
    guaranteedCrit: false,
    grudge: 0,
  };
  const passiveProcs = [];
  const heroSkills = hero.unlockedSkills || {};
  const tree = skillTrees[hero.classId];
  if (tree) {
    tree.tiers.forEach(tier => {
      tier.skills.forEach(skill => {
        if (skill.passive && skill.procEffect && (heroSkills[skill.id] || 0) > 0) {
          const points = heroSkills[skill.id];
          const chance = (skill.bonuses?.procChance || 10) * points;
          passiveProcs.push({ ...skill.procEffect, chance, source: skill.name });
        }
      });
    });
  }
  unit.passiveProcs = passiveProcs;
  unit.row = getDefaultRow(unit);
  return unit;
}

export function calculateAttackDamage(attacker, defender, ability) {
  let evasionBonus = 0;
  (defender.buffs || []).forEach(b => {
    if (b.stat === 'evasion' && b.flat) evasionBonus += b.flat;
  });
  const isInvincible = (defender.buffs || []).some(b => b.source === 'Invincible');
  if (isInvincible) {
    return { totalDmg: 0, isCrit: false, blocked: false, evaded: false, drained: 0, absorbed: true };
  }
  const totalEvasion = (defender.evasion || 0) + evasionBonus;
  if (Math.random() * 100 < totalEvasion) {
    return { totalDmg: 0, isCrit: false, blocked: false, evaded: true, drained: 0 };
  }

  const isMagic = ability.type === 'magical';
  let baseDmg = isMagic
    ? (attacker.magicDamage || attacker.damage || 0)
    : (attacker.physicalDamage || attacker.damage || 0);
  baseDmg += (attacker.level || 1) * 2;

  let dmgMult = 1;
  (attacker.buffs || []).forEach(b => {
    if (b.stat === 'damage' && b.multiplier) dmgMult *= b.multiplier;
  });
  baseDmg = Math.floor(baseDmg * dmgMult);

  let totalDmg = Math.floor(baseDmg * (ability.damage || 1));

  let defenseVal = defender.defense || 0;
  (defender.buffs || []).forEach(b => {
    if (b.stat === 'defense' && b.flat) defenseVal += b.flat;
  });
  const attackerDefBreak = attacker.defenseBreak || 0;
  if (attackerDefBreak > 0) {
    defenseVal = Math.max(0, defenseVal * (1 - attackerDefBreak / 100));
  }
  const defReduction = Math.min(80, Math.sqrt(Math.max(0, defenseVal)));
  totalDmg = Math.floor(totalDmg * (100 - defReduction) / 100);

  if (defender.damageReduction > 0) {
    totalDmg = Math.floor(totalDmg * (1 - defender.damageReduction / 100));
  }

  const variance = 0.75 + Math.random() * 0.5;
  totalDmg = Math.floor(totalDmg * variance);

  let blocked = false;
  let isCrit = false;

  if (Math.random() * 100 < (defender.block || 0)) {
    const blockFactor = Math.min(90, defender.blockEffect || 0) / 100;
    const reduction = blockFactor > 0 ? blockFactor : 0.6;
    totalDmg = Math.floor(totalDmg * (1 - reduction));
    blocked = true;
  }

  if (!blocked) {
    let effectiveCritChance = attacker.critChance || 5;
    const critEvasion = defender.criticalEvasion || 0;
    effectiveCritChance = Math.max(0, effectiveCritChance - critEvasion);
    if (attacker.focusStacks > 0) {
      effectiveCritChance += attacker.focusStacks * 10;
    }
    isCrit = ability.guaranteedCrit || attacker.guaranteedCrit || Math.random() * 100 < effectiveCritChance;
    if (isCrit) {
      const critFactor = 1 + ((attacker.criticalDamage || 50) / 100);
      totalDmg = Math.floor(totalDmg * critFactor);
      if (attacker.focusStacks > 0) {
        attacker.focusStacks = 0;
        attacker.guaranteedCrit = false;
      }
    }
  }

  totalDmg = Math.max(1, totalDmg);

  let drained = 0;
  if ((attacker.drainHealth || 0) > 0 && totalDmg > 0 && !blocked) {
    drained = Math.floor(totalDmg * (attacker.drainHealth / 100));
  }

  let result = { totalDmg, isCrit, blocked, evaded: false, drained };
  result = applyRowCombatModifiers(attacker, defender, ability, result);
  return result;
}

export function applyEffectToTarget(target, effect, sourceName, log) {
  if (!target.alive || !effect) return;
  const etype = effect.type;
  if (etype === 'bleed' || etype === 'burn' || etype === 'poison' || etype === 'dot') {
    target.dots.push({ damage: effect.damage, duration: effect.duration, source: sourceName });
    const label = etype === 'dot' ? 'bleeding' : (etype === 'burn' ? 'burning' : (etype === 'poison' ? 'poisoned' : 'bleeding'));
    log.push(`${target.name} is ${label} from ${sourceName}!`);
  } else if (etype === 'stun') {
    target.stunned = true;
    log.push(`[STUN] ${target.name} is stunned by ${sourceName}!`);
  } else if (etype === 'sleep') {
    target.stunned = true;
    target.buffs.push({ type: 'sleep', duration: effect.duration, source: sourceName });
    log.push(`[SLEEP] ${target.name} falls asleep from ${sourceName}!`);
  } else if (etype === 'confuse') {
    target.buffs.push({ type: 'confuse', duration: effect.duration, source: sourceName });
    log.push(`[CONFUSE] ${target.name} is confused by ${sourceName}!`);
  } else if (etype === 'lower_defense') {
    target.buffs.push({ stat: 'defense', multiplier: 1 - (effect.percent || 0.2), duration: effect.duration, source: sourceName });
    log.push(`[DEBUFF] ${target.name}'s defense is lowered by ${sourceName}!`);
  } else if (etype === 'lower_attack') {
    target.buffs.push({ stat: 'damage', multiplier: 1 - (effect.percent || 0.2), duration: effect.duration, source: sourceName });
    log.push(`[DEBUFF] ${target.name}'s attack is lowered by ${sourceName}!`);
  }
}

export function applyPassiveProcs(attacker, target, result, log, ability) {
  if (!attacker.passiveProcs || !target.alive || result.evaded || result.absorbed || result.totalDmg <= 0) return;
  for (const proc of attacker.passiveProcs) {
    if (proc.onCrit && !result.isCrit) continue;
    if (Math.random() * 100 < proc.chance) {
      if (proc.type === 'extra_attack') {
        const bonusDmg = Math.floor(result.totalDmg * (proc.damage || 0.5));
        target.health = Math.max(0, target.health - bonusDmg);
        log.push(`[PROC] ${proc.source} triggers! ${attacker.name} deals ${bonusDmg} bonus damage!`);
        if (target.health <= 0) { target.alive = false; log.push(`${target.name} has been slain!`); }
      } else if (proc.type === 'random_debuff' && proc.options) {
        const pick = proc.options[Math.floor(Math.random() * proc.options.length)];
        applyEffectToTarget(target, { type: pick, damage: 0.10, duration: 2, percent: 0.15 }, proc.source, log);
      } else if (proc.type === 'multi_dot' && proc.effects) {
        for (const eff of proc.effects) {
          applyEffectToTarget(target, { type: eff, damage: 0.08, duration: 3, percent: 0.10 }, proc.source, log);
        }
      } else {
        applyEffectToTarget(target, proc, proc.source, log);
      }
    }
  }
}

export function chooseAIAction(unit, allUnits) {
  const allies = allUnits.filter(u => u.team === unit.team && u.alive && u.health > 0);
  const enemies = allUnits.filter(u => u.team !== unit.team && u.alive && u.health > 0);
  if (enemies.length === 0) return null;
  if (!unit.abilities || unit.abilities.length === 0) return null;

  if (unit.team === 'player') {
    const lowAlly = allies.find(a => a.health / a.maxHealth < 0.45);
    const healAbility = unit.abilities.find(a =>
      (a.type === 'heal' || a.type === 'heal_over_time') &&
      (unit.cooldowns[a.id] || 0) <= 0 &&
      (a.manaCost || 0) <= unit.mana &&
      (a.staminaCost || 0) <= unit.stamina
    );
    if (lowAlly && healAbility) {
      return { abilityId: healAbility.id, targetId: lowAlly.id };
    }
  }

  const cls = classDefinitions[unit.classId];
  const bearSwapIds = cls?.bearFormAbilities ? Object.keys(cls.bearFormAbilities) : [];
  const bearReplacementIds = cls?.bearFormAbilities ? Object.values(cls.bearFormAbilities).map(a => a.id) : [];

  const availableAbilities = unit.abilities.filter(a =>
    (unit.cooldowns[a.id] || 0) <= 0 &&
    (a.manaCost || 0) <= unit.mana &&
    (a.staminaCost || 0) <= unit.stamina &&
    !(a.isBearForm && unit.bearForm) &&
    !(a.isDemonBlade && unit.demonBlade) &&
    !(unit.bearForm && bearSwapIds.includes(a.id)) &&
    !(!unit.bearForm && (bearReplacementIds.includes(a.id) || a.type === 'revert_form'))
  );
  if (availableAbilities.length === 0) return null;

  const attackAbilities = availableAbilities.filter(a => a.type === 'physical' || a.type === 'magical');
  const buffAbilities = availableAbilities.filter(a => a.type === 'buff');
  const debuffAbilities = availableAbilities.filter(a => a.type === 'debuff');
  const hotAbilities = availableAbilities.filter(a => a.type === 'heal_over_time');
  const healAbilities = availableAbilities.filter(a => a.type === 'heal');

  const transformAbilities = buffAbilities.filter(a => a.isBearForm || a.isDemonBlade);
  const regularBuffs = buffAbilities.filter(a => !a.isBearForm && !a.isDemonBlade);
  if (transformAbilities.length > 0 && !unit.bearForm && !unit.demonBlade && Math.random() < 0.5) {
    return { abilityId: transformAbilities[0].id, targetId: unit.id };
  }

  const hasActiveBuff = unit.buffs.some(b => b.stat === 'damage' || b.stat === 'defense' || b.stat === 'evasion');
  if (regularBuffs.length > 0 && !hasActiveBuff && Math.random() < 0.3) {
    return { abilityId: regularBuffs[0].id, targetId: unit.id };
  }

  const resAbilities = availableAbilities.filter(a => a.type === 'resurrect' || a.isResurrect);
  if (resAbilities.length > 0) {
    const allBattleUnits = [...allies, ...enemies];
    const deadAlly = allBattleUnits.find(a => a.team === unit.team && !a.alive && a.id !== unit.id);
    if (deadAlly && Math.random() < 0.7) {
      return { abilityId: resAbilities[0].id, targetId: deadAlly.id };
    }
  }

  if (healAbilities.length > 0) {
    if (unit.team === 'player') {
      const lowAlly = allies.find(a => a.health / a.maxHealth < 0.45);
      if (lowAlly) return { abilityId: healAbilities[0].id, targetId: lowAlly.id };
    } else {
      const lowAlly = allies.filter(a => a.alive && a.id !== unit.id).sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth))[0];
      if (lowAlly && lowAlly.health / lowAlly.maxHealth < 0.5 && Math.random() < 0.6) {
        return { abilityId: healAbilities[0].id, targetId: lowAlly.id };
      }
      if (unit.health / unit.maxHealth < 0.5 && Math.random() < 0.6) {
        return { abilityId: healAbilities[0].id, targetId: unit.id };
      }
    }
  }

  if (unit.team === 'player' && hotAbilities.length > 0 && unit.health / unit.maxHealth < 0.5 && Math.random() < 0.5) {
    return { abilityId: hotAbilities[0].id, targetId: unit.id };
  }

  const focusAbilities = availableAbilities.filter(a => a.type === 'focus' || a.isFocus);
  if (focusAbilities.length > 0 && (unit.focusStacks || 0) >= 2 && Math.random() < 0.5) {
    return { abilityId: focusAbilities[0].id, targetId: unit.id };
  }

  if (debuffAbilities.length > 0 && Math.random() < 0.25) {
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    return { abilityId: debuffAbilities[0].id, targetId: enemy.id };
  }

  const specials = attackAbilities.filter(a => a.cooldown && a.cooldown > 0);
  let ability;
  if (specials.length > 0 && Math.random() < 0.45) {
    ability = specials[Math.floor(Math.random() * specials.length)];
  } else if (attackAbilities.length > 0) {
    ability = attackAbilities[0];
  } else {
    ability = availableAbilities[0];
  }

  if (!ability) return null;

  const preferredRow = getAIRowPreference(unit, allUnits);
  if (preferredRow && preferredRow !== unit.row && Math.random() < 0.4) {
    return { type: 'move_row', targetRow: preferredRow };
  }

  let target;
  if (Math.random() < 0.6) {
    target = enemies.reduce((low, e) => e.health < low.health ? e : low, enemies[0]);
  } else {
    target = enemies[Math.floor(Math.random() * enemies.length)];
  }

  return { abilityId: ability.id, targetId: target.id };
}

export function getFormationPositions(count, side) {
  const p = {
    player: {
      1: [{x:35,y:90}],
      2: [{x:32,y:86},{x:38,y:94}],
      3: [{x:30,y:82},{x:36,y:90},{x:32,y:97}],
    },
    enemy: {
      1: [{x:65,y:90}],
      2: [{x:68,y:86},{x:62,y:94}],
      3: [{x:72,y:88},{x:62,y:82},{x:64,y:96}],
      4: [{x:72,y:86},{x:60,y:78},{x:62,y:92},{x:64,y:99}],
    }
  };
  const maxCount = side === 'player' ? 3 : 4;
  return p[side][Math.min(count, maxCount)] || p[side][1];
}

export function assignRowsAndPositions(playerTeam, enemyUnits) {
  playerTeam.forEach(u => {
    if (!u.row) u.row = getDefaultRow(u);
  });
  enemyUnits.forEach(u => {
    if (!u.row) u.row = getDefaultRow(u);
  });

  const pPos = getRowPositions(playerTeam, 'player');
  const ePos = getRowPositions(enemyUnits, 'enemy');
  playerTeam.forEach(u => { if (pPos[u.id]) u.position = pPos[u.id]; });
  enemyUnits.forEach(u => { if (ePos[u.id]) u.position = ePos[u.id]; });
}

export function recalcRowPositions(units) {
  const playerUnits = units.filter(u => u.team === 'player' && u.alive);
  const enemyUnits = units.filter(u => u.team === 'enemy' && u.alive);
  const pPos = getRowPositions(playerUnits, 'player');
  const ePos = getRowPositions(enemyUnits, 'enemy');
  return units.map(u => {
    const newPos = pPos[u.id] || ePos[u.id];
    if (newPos) return { ...u, position: newPos };
    return u;
  });
}
