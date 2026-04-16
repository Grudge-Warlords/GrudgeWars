import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameContainer from './GameContainer';
import BattleStage from './BattleStage';
import LootRewards from './LootRewards';

function assignWeapon(cls, spec) {
  const weapons = spec?.equipment?.weaponTypes || [];
  if (weapons.length === 0) return null;
  const classRole = (cls.role || '').toLowerCase();
  const className = (cls.name || '').toLowerCase();
  const matched = weapons.find(w => {
    const bonus = (w.statBonus || '').toLowerCase();
    if (classRole.includes('tank') || classRole.includes('frontline')) return w.base === 'sword' || w.base === 'hammer';
    if (classRole.includes('healer') || classRole.includes('support')) return w.base === 'staff' || w.base === 'tome';
    if (classRole.includes('ranged') || classRole.includes('dps') && className.includes('gun')) return w.base === 'gun' || w.base === 'crossbow' || w.base === 'bow';
    if (classRole.includes('assassin') || className.includes('shadow') || className.includes('rift')) return w.base === 'dagger' || w.base === 'sword';
    return false;
  });
  return matched || weapons[0];
}

function createHeroFromSpec(race, cls, level = 5, idx = 0, spec = null) {
  const baseHp = 80 + (race.bonuses?.health || 0) * 10 + (cls.startingAttributes?.Vitality || 5) * 12;
  const baseMana = 40 + (cls.startingAttributes?.Wisdom || 5) * 8;
  const baseStamina = 40 + (cls.startingAttributes?.Endurance || 5) * 6;
  const str = (cls.startingAttributes?.Strength || 5) + level;
  const intel = (cls.startingAttributes?.Intellect || cls.startingAttributes?.Intelligence || 5) + level;
  const agi = (cls.startingAttributes?.Agility || 5) + level;
  const hp = Math.floor(baseHp + level * 14);
  const mana = Math.floor(baseMana + level * 6);
  const stamina = Math.floor(baseStamina + level * 4);

  const abilities = (cls.abilities || []).slice(0, 4).map((a, i) => ({
    id: a.id || `ability_${i}`,
    name: a.name || `Ability ${i + 1}`,
    icon: a.icon || '',
    description: a.description || '',
    type: a.type || 'physical',
    damage: a.damage || 1.0,
    manaCost: a.manaCost || 0,
    staminaCost: a.staminaCost || 0,
    cooldown: a.cooldown || 0,
    target: a.target || 'enemy',
    effect: a.effect || null,
  }));

  if (abilities.length === 0) {
    abilities.push({ id: 'basic_attack', name: 'Attack', icon: '', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 5, cooldown: 0, target: 'enemy' });
  }

  return {
    id: `hero_${idx}`,
    name: `${race.name} ${cls.name}`,
    team: 'player',
    isPlayerControlled: true,
    classId: cls.id,
    raceId: race.id,
    raceIcon: race.icon || '',
    classIcon: cls.icon || '',
    className: cls.name,
    raceName: race.name,
    raceColor: race.color || '#06b6d4',
    classColor: cls.color || '#a855f7',
    role: cls.role || '',
    health: hp, maxHealth: hp,
    mana: mana, maxMana: mana,
    stamina: stamina, maxStamina: stamina,
    baseDamage: Math.floor(str * 2.5 + level * 3),
    physicalDamage: Math.floor(str * 2.5 + level * 3),
    magicDamage: Math.floor(intel * 2.2 + level * 2),
    baseDefense: Math.floor((cls.startingAttributes?.Vitality || 5) * 1.5 + level * 2),
    defense: Math.floor((cls.startingAttributes?.Vitality || 5) * 1.5 + level * 2),
    speed: 15 + Math.floor(agi * 0.5),
    critChance: 5 + Math.floor(agi * 0.3),
    criticalDamage: 50,
    evasion: Math.floor(agi * 0.4),
    abilities,
    cooldowns: {},
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    level,
    row: idx < 2 ? 'front' : 'back',
    weapon: assignWeapon(cls, spec),
  };
}

function createEnemyFromSpec(enemy, level = 5, idx = 0) {
  const scaledHp = Math.floor((enemy.baseHealth || 80) * (1 + level * 0.15));
  const scaledDmg = Math.floor((enemy.baseDamage || 12) * (1 + level * 0.12));
  const scaledDef = Math.floor((enemy.baseDefense || 4) * (1 + level * 0.1));

  const abilities = (enemy.abilities || []).slice(0, 3).map((a, i) => {
    if (typeof a === 'string') {
      return { id: a, name: a.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: '', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 0, cooldown: 2, target: 'enemy', effect: null };
    }
    return {
      id: a.id || `enemy_ability_${i}`,
      name: a.name || `Attack ${i + 1}`,
      icon: a.icon || '',
      type: a.type || 'physical',
      damage: a.damage || 1.0,
      manaCost: a.manaCost || 0,
      staminaCost: a.staminaCost || 0,
      cooldown: a.cooldown || 0,
      target: a.target || 'enemy',
      effect: a.effect || null,
    };
  });

  if (abilities.length === 0) {
    abilities.push({ id: 'enemy_attack', name: 'Attack', icon: '', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy' });
  }

  return {
    id: `enemy_${idx}`,
    name: enemy.name || `Enemy ${idx + 1}`,
    team: 'enemy',
    isPlayerControlled: false,
    icon: enemy.icon || '',
    color: enemy.color || '#ef4444',
    health: scaledHp, maxHealth: scaledHp,
    mana: enemy.baseMana || 30, maxMana: enemy.baseMana || 30,
    stamina: 50, maxStamina: 50,
    baseDamage: scaledDmg,
    physicalDamage: scaledDmg,
    magicDamage: Math.floor(scaledDmg * 0.8),
    baseDefense: scaledDef,
    defense: scaledDef,
    speed: enemy.speed || 12,
    critChance: 5,
    criticalDamage: 40,
    evasion: 3,
    abilities,
    cooldowns: {},
    buffs: [],
    dots: [],
    stunned: false,
    alive: true,
    level,
    isBoss: enemy.isBoss || false,
    xpReward: enemy.xpReward || 20,
    goldReward: enemy.goldReward || 10,
    row: idx === 0 ? 'front' : 'back',
  };
}

function getEffectiveStats(unit) {
  const hasBuff = (type) => (unit.buffs || []).some(b => b.type === type);
  return {
    physicalDamage: unit.baseDamage * (hasBuff('damage_boost') ? 1.4 : 1) * (hasBuff('lower_attack') ? 0.7 : 1),
    magicDamage: (unit.magicDamage || unit.baseDamage * 0.8) * (hasBuff('damage_boost') ? 1.4 : 1) * (hasBuff('lower_attack') ? 0.7 : 1),
    defense: unit.baseDefense * (hasBuff('defense_boost') ? 1.5 : 1) * (hasBuff('lower_defense') ? 0.5 : 1),
    evasion: (unit.evasion || 0) + (hasBuff('evasion_boost') ? 30 : 0),
    critChance: unit.critChance || 5,
  };
}

function calcDamage(attacker, defender, ability) {
  const isPhysical = ability.type !== 'magic' && ability.type !== 'magical';
  const atkStats = getEffectiveStats(attacker);
  const defStats = getEffectiveStats(defender);
  const baseDmg = isPhysical ? atkStats.physicalDamage : atkStats.magicDamage;
  const multiplier = ability.damage || 1.0;
  let dmg = Math.floor(baseDmg * multiplier);
  const defReduction = Math.max(0, defStats.defense * 0.4);
  dmg = Math.max(1, dmg - defReduction);
  const isCrit = Math.random() * 100 < atkStats.critChance;
  if (isCrit) dmg = Math.floor(dmg * (1 + (attacker.criticalDamage || 50) / 100));
  const evaded = Math.random() * 100 < defStats.evasion;
  if (evaded) dmg = 0;
  return { dmg, isCrit, evaded };
}

function applyEffect(target, effect, attacker) {
  if (!effect) return null;
  const t = { ...target, buffs: [...(target.buffs || [])], dots: [...(target.dots || [])] };
  switch (effect) {
    case 'bleed':
      t.dots.push({ type: 'bleed', damage: Math.floor(attacker.physicalDamage * 0.15), turns: 3, color: '#ef4444', label: 'Bleed' });
      return { unit: t, msg: `${t.name} is bleeding!` };
    case 'burn':
      t.dots.push({ type: 'burn', damage: Math.floor(attacker.magicDamage * 0.2), turns: 3, color: '#f97316', label: 'Burn' });
      return { unit: t, msg: `${t.name} is burning!` };
    case 'poison':
      t.dots.push({ type: 'poison', damage: Math.floor(attacker.magicDamage * 0.12), turns: 4, color: '#22c55e', label: 'Poison' });
      return { unit: t, msg: `${t.name} is poisoned!` };
    case 'stun':
      t.stunned = true;
      t.buffs.push({ type: 'stun', turns: 1, color: '#fbbf24', label: 'Stunned' });
      return { unit: t, msg: `${t.name} is stunned!` };
    case 'confuse':
      t.buffs.push({ type: 'confuse', turns: 2, color: '#a855f7', label: 'Confused' });
      return { unit: t, msg: `${t.name} is confused!` };
    case 'lower_defense':
      t.buffs.push({ type: 'lower_defense', turns: 3, color: '#f97316', label: 'DEF Down' });
      return { unit: t, msg: `${t.name}'s defense is lowered!` };
    case 'lower_attack':
      t.buffs.push({ type: 'lower_attack', turns: 3, color: '#ef4444', label: 'ATK Down' });
      return { unit: t, msg: `${t.name}'s attack is lowered!` };
    default:
      return null;
  }
}

function tickDots(unit) {
  if (!unit.alive || !unit.dots?.length) return { unit, msgs: [] };
  const u = { ...unit, dots: [...unit.dots] };
  const msgs = [];
  let totalDmg = 0;
  u.dots = u.dots.map(dot => {
    totalDmg += dot.damage;
    msgs.push(`🩸 ${u.name} takes ${dot.damage} ${dot.label} damage`);
    return { ...dot, turns: dot.turns - 1 };
  }).filter(d => d.turns > 0);
  u.health = Math.max(0, u.health - totalDmg);
  if (u.health <= 0) { u.alive = false; msgs.push(`💀 ${u.name} succumbed to ${u.dots.length > 0 ? 'their wounds' : 'damage over time'}!`); }
  return { unit: u, msgs };
}

function tickBuffs(unit) {
  if (!unit.alive || !unit.buffs?.length) return unit;
  const u = { ...unit, buffs: [...unit.buffs] };
  u.buffs = u.buffs.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0);
  u.stunned = u.buffs.some(b => b.type === 'stun');
  return u;
}

function applySelfBuff(caster, ability) {
  const u = { ...caster, buffs: [...(caster.buffs || [])] };
  u.mana -= ability.manaCost || 0;
  u.stamina -= ability.staminaCost || 0;
  if (ability.cooldown > 0) {
    u.cooldowns = { ...u.cooldowns, [ability.id]: ability.cooldown };
  }

  const type = ability.type;
  const nameLower = ability.name.toLowerCase();
  if (type === 'heal' || nameLower.includes('heal') || nameLower.includes('mend')) {
    const healAmt = Math.floor(u.magicDamage * (ability.damage || 1.5));
    u.health = Math.min(u.maxHealth, u.health + healAmt);
    return { unit: u, msg: `💚 ${u.name} uses ${ability.name} — healed ${healAmt} HP!`, healAmt };
  }

  if (nameLower.includes('shield') || nameLower.includes('ward') || nameLower.includes('guardian') || nameLower.includes('oath')) {
    u.buffs.push({ type: 'defense_boost', turns: 3, color: '#3b82f6', label: '+50% DEF' });
    return { unit: u, msg: `🛡️ ${u.name} uses ${ability.name} — defense boosted for 3 turns!` };
  }

  if (nameLower.includes('cloak') || nameLower.includes('stealth') || nameLower.includes('vanish')) {
    u.buffs.push({ type: 'evasion_boost', turns: 2, color: '#8b5cf6', label: '+30 EVA' });
    return { unit: u, msg: `👻 ${u.name} uses ${ability.name} — evasion greatly increased for 2 turns!` };
  }

  if (nameLower.includes('pact') || nameLower.includes('rage') || nameLower.includes('surge') || nameLower.includes('form')) {
    u.buffs.push({ type: 'damage_boost', turns: 3, color: '#ef4444', label: '+40% DMG' });
    return { unit: u, msg: `⚡ ${u.name} uses ${ability.name} — damage boosted for 3 turns!` };
  }

  u.buffs.push({ type: 'damage_boost', turns: 2, color: '#fbbf24', label: ability.name });
  const healAmt = Math.floor(u.maxHealth * 0.1);
  u.health = Math.min(u.maxHealth, u.health + healAmt);
  return { unit: u, msg: `✨ ${u.name} uses ${ability.name} — empowered! (+${healAmt} HP)` };
}

export default function FactoryBattle({ spec, onBack }) {
  const palette = spec.meta?.colorPalette || {};
  const [battleState, setBattleState] = useState(null);
  const [log, setLog] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [phase, setPhase] = useState('setup');
  const [selectedHeroes, setSelectedHeroes] = useState([]);
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [animationEvent, setAnimationEvent] = useState(null);
  const [animLocked, setAnimLocked] = useState(false);
  const [autoFight, setAutoFight] = useState(false);
  const animQueueRef = useRef([]);
  const floatIdRef = useRef(0);
  const logEndRef = useRef(null);
  const enemyTimerRef = useRef(null);
  const autoFightTimerRef = useRef(null);
  const executeEnemyTurnRef = useRef(null);
  const executeAbilityRef = useRef(null);

  const queueAnim = useCallback((event) => {
    animQueueRef.current.push(event);
    if (!animLocked) {
      setAnimLocked(true);
      const next = animQueueRef.current.shift();
      if (next) setAnimationEvent({ ...next, _ts: Date.now() });
    }
  }, [animLocked]);

  const onAnimationComplete = useCallback(() => {
    if (animQueueRef.current.length > 0) {
      const next = animQueueRef.current.shift();
      setAnimationEvent({ ...next, _ts: Date.now() });
    } else {
      setAnimationEvent(null);
      setAnimLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!animLocked) return;
    const safetyTimer = setTimeout(() => {
      animQueueRef.current = [];
      setAnimationEvent(null);
      setAnimLocked(false);
    }, 12000);
    return () => clearTimeout(safetyTimer);
  }, [animLocked, animationEvent]);

  const battleBackground = useMemo(() => {
    const bgs = spec.meta?.battleBackgrounds || [];
    return bgs.length > 0 ? bgs[Math.floor(Math.random() * bgs.length)] : null;
  }, [spec]);

  const themedAttributes = useMemo(() => spec.attributes || [], [spec]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    if (!battleState || battleState.phase === 'victory' || battleState.phase === 'defeat') return;
    const currentId = battleState.turnOrder[battleState.currentTurn % battleState.turnOrder.length];
    const current = battleState.units.find(u => u.id === currentId && u.alive);
    if (!current) {
      const nextTurn = findNextAliveTurn(battleState.units, battleState.turnOrder, battleState.currentTurn);
      setBattleState(prev => prev ? { ...prev, currentTurn: nextTurn } : prev);
      const nextUnit = battleState.units.find(u => u.id === battleState.turnOrder[nextTurn] && u.alive);
      if (nextUnit && !nextUnit.isPlayerControlled) {
        scheduleEnemyTurn(nextTurn);
      }
    } else if (current.stunned) {
      const { units: dotUnits, msgs: dotMsgs } = processTurnStart(battleState.units, currentId);
      dotMsgs.forEach(m => addLog(m));
      addLog(`💫 ${current.name} is stunned and cannot act!`);
      addFloat(current.id, 'STUNNED', '#fbbf24');
      const unitAfterDot = dotUnits.find(u => u.id === currentId);
      if (!unitAfterDot || !unitAfterDot.alive) {
        const result = checkBattleEnd(dotUnits);
        if (result) {
          setBattleState(prev => ({ ...prev, units: dotUnits, phase: result }));
          addLog(result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...');
          setPhase(result);
          return;
        }
      }
      const newUnits = dotUnits.map(u => u.id === currentId ? tickBuffs({ ...u, stunned: false }) : u);
      const nextTurn = findNextAliveTurn(newUnits, battleState.turnOrder, battleState.currentTurn);
      setTimeout(() => {
        setBattleState(prev => prev ? { ...prev, units: newUnits, currentTurn: nextTurn } : prev);
        const nextUnit = newUnits.find(u => u.id === battleState.turnOrder[nextTurn] && u.alive);
        if (nextUnit && !nextUnit.isPlayerControlled) scheduleEnemyTurn(nextTurn);
      }, 600);
    }
  }, [battleState]);

  const scheduleEnemyTurn = useCallback((turnIdx) => {
    if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
    enemyTimerRef.current = setTimeout(() => {
      enemyTimerRef.current = null;
      if (executeEnemyTurnRef.current) executeEnemyTurnRef.current(turnIdx);
    }, 650);
  }, []);

  const addFloat = useCallback((unitId, text, color) => {
    const id = ++floatIdRef.current;
    setFloatingTexts(prev => [...prev, { id, unitId, text, color, created: Date.now() }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const addLog = useCallback((msg) => {
    setLog(prev => [...prev.slice(-80), msg]);
  }, []);

  const startBattle = useCallback(() => {
    const heroes = selectedHeroes.map((combo, i) => createHeroFromSpec(combo.race, combo.cls, 5, i, spec));
    const enemies = selectedEnemies.map((e, i) => createEnemyFromSpec(e, 5, i));
    const allUnits = [...heroes, ...enemies];
    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    setBattleState({ units: allUnits, turnOrder, currentTurn: 0, phase: 'player' });
    setSelectedTarget(enemies[0]?.id || null);
    setLog([`⚔️ Battle begins! ${heroes.length} heroes vs ${enemies.length} enemies!`]);
    setPhase('battle');
    setTurnCount(1);
  }, [selectedHeroes, selectedEnemies]);

  const findNextAliveTurn = useCallback((units, turnOrder, fromIdx) => {
    let next = (fromIdx + 1) % turnOrder.length;
    let tries = 0;
    while (tries < turnOrder.length) {
      const unit = units.find(u => u.id === turnOrder[next]);
      if (unit && unit.alive) return next;
      next = (next + 1) % turnOrder.length;
      tries++;
    }
    return next;
  }, []);

  const checkBattleEnd = useCallback((units) => {
    const heroesAlive = units.filter(u => u.team === 'player' && u.alive);
    const enemiesAlive = units.filter(u => u.team === 'enemy' && u.alive);
    if (enemiesAlive.length === 0) return 'victory';
    if (heroesAlive.length === 0) return 'defeat';
    return null;
  }, []);

  const processTurnStart = useCallback((units, unitId) => {
    let newUnits = units.map(u => ({ ...u }));
    const unit = newUnits.find(u => u.id === unitId);
    if (!unit || !unit.alive) return { units: newUnits, msgs: [], dotAnims: [] };
    const msgs = [];
    const dotAnims = [];

    const { unit: dottedUnit, msgs: dotMsgs } = tickDots(unit);
    const idx = newUnits.findIndex(u => u.id === unitId);
    newUnits[idx] = tickBuffs(dottedUnit);
    msgs.push(...dotMsgs);

    if (unit.dots?.length > 0) {
      unit.dots.forEach(dot => {
        dotAnims.push({ type: 'dot_tick', targetId: unitId, damage: dot.damage, effectName: dot.type });
      });
    }

    newUnits[idx].mana = Math.min(newUnits[idx].maxMana, newUnits[idx].mana + 3);
    newUnits[idx].stamina = Math.min(newUnits[idx].maxStamina, newUnits[idx].stamina + 5);

    return { units: newUnits, msgs, dotAnims };
  }, []);

  const executeAbility = useCallback((ability, explicitTargetId) => {
    if (!battleState) return;
    const currentId = battleState.turnOrder[battleState.currentTurn % battleState.turnOrder.length];
    const current = battleState.units.find(u => u.id === currentId && u.alive);
    if (!current || !current.isPlayerControlled) return;
    const effectiveTarget = explicitTargetId || selectedTarget;

    const { units: turnStartUnits, msgs: turnStartMsgs, dotAnims } = processTurnStart(battleState.units, currentId);
    turnStartMsgs.forEach(m => addLog(m));
    if (dotAnims?.length > 0) dotAnims.forEach(a => queueAnim(a));
    const unitAfterTick = turnStartUnits.find(u => u.id === currentId);
    if (!unitAfterTick || !unitAfterTick.alive) {
      const result = checkBattleEnd(turnStartUnits);
      if (result) {
        setBattleState(prev => ({ ...prev, units: turnStartUnits, phase: result }));
        addLog(result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...');
        setPhase(result);
        return;
      }
      const nextTurn = findNextAliveTurn(turnStartUnits, battleState.turnOrder, battleState.currentTurn);
      setBattleState(prev => ({ ...prev, units: turnStartUnits, currentTurn: nextTurn }));
      return;
    }

    const tickedCooldowns = { ...unitAfterTick.cooldowns };
    Object.keys(tickedCooldowns).forEach(k => { if (tickedCooldowns[k] > 0) tickedCooldowns[k]--; });

    const cd = tickedCooldowns[ability.id] || 0;
    if (cd > 0) { addLog(`${ability.name} is on cooldown (${cd} turns)!`); return; }
    if (ability.manaCost > unitAfterTick.mana) { addLog(`Not enough mana for ${ability.name}!`); return; }
    if (ability.staminaCost > unitAfterTick.stamina) { addLog(`Not enough stamina for ${ability.name}!`); return; }

    let newUnits = turnStartUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], dots: [...(u.dots || [])] }));
    const attacker = newUnits.find(u => u.id === current.id);
    attacker.cooldowns = { ...tickedCooldowns };

    const isSelfBuff = ability.target === 'self' || ability.target === 'ally' || ability.target === 'all_allies' || ability.type === 'buff';
    const isHeal = ability.type === 'heal';
    const isAoe = ability.target === 'all_enemies';

    if (isSelfBuff && !isHeal) {
      const result = applySelfBuff(attacker, ability);
      const aIdx = newUnits.findIndex(u => u.id === attacker.id);
      newUnits[aIdx] = result.unit;
      addLog(result.msg);
      addFloat(attacker.id, result.healAmt ? `+${result.healAmt}` : 'BUFF', result.healAmt ? '#22c55e' : '#3b82f6');
      queueAnim({ type: 'buff', attackerId: attacker.id, targetId: attacker.id, ability, text: result.healAmt ? `+${result.healAmt}` : 'BUFF' });
    } else if (isHeal) {
      attacker.mana -= ability.manaCost || 0;
      attacker.stamina -= ability.staminaCost || 0;
      if (ability.cooldown > 0) attacker.cooldowns[ability.id] = ability.cooldown;
      const healTarget = ability.target === 'self' ? attacker : newUnits.filter(u => u.team === 'player' && u.alive).sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth))[0] || attacker;
      const healAmt = Math.floor(attacker.magicDamage * (ability.damage || 1.5));
      healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + healAmt);
      addLog(`💚 ${attacker.name} uses ${ability.name} on ${healTarget.name} — healed ${healAmt} HP!`);
      addFloat(healTarget.id, `+${healAmt}`, '#22c55e');
      queueAnim({ type: 'heal', attackerId: attacker.id, targetId: healTarget.id, ability, damage: healAmt, isHeal: true });
    } else if (isAoe) {
      attacker.mana -= ability.manaCost || 0;
      attacker.stamina -= ability.staminaCost || 0;
      if (ability.cooldown > 0) attacker.cooldowns[ability.id] = ability.cooldown;
      const targets = newUnits.filter(u => u.team === 'enemy' && u.alive);
      let totalDmg = 0;
      targets.forEach(defender => {
        const { dmg, isCrit, evaded } = calcDamage(attacker, defender, ability);
        if (evaded) {
          addFloat(defender.id, 'EVADE', '#60a5fa');
        } else {
          defender.health = Math.max(0, defender.health - dmg);
          if (defender.health <= 0) defender.alive = false;
          totalDmg += dmg;
          addFloat(defender.id, `${isCrit ? '💥' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#ef4444');
          if (!defender.alive) addLog(`💀 ${defender.name} has been defeated!`);
          if (ability.effect) {
            const effectResult = applyEffect(defender, ability.effect, attacker);
            if (effectResult) {
              const dIdx = newUnits.findIndex(u => u.id === defender.id);
              newUnits[dIdx] = effectResult.unit;
              addLog(`  ${effectResult.msg}`);
            }
          }
        }
      });
      addLog(`⚔️ ${attacker.name} uses ${ability.name} — ${totalDmg} total damage to ${targets.length} enemies!`);
      queueAnim({ type: 'attack', attackerId: attacker.id, targetId: targets[0]?.id, targets: targets.map(t => ({ id: t.id, damage: 0, isCrit: false, isEvade: false })), ability });
    } else {
      const target = newUnits.find(u => u.id === effectiveTarget && u.alive);
      if (!target) return;
      attacker.mana -= ability.manaCost || 0;
      attacker.stamina -= ability.staminaCost || 0;
      if (ability.cooldown > 0) attacker.cooldowns[ability.id] = ability.cooldown;

      const { dmg, isCrit, evaded } = calcDamage(attacker, target, ability);
      if (evaded) {
        addLog(`${target.name} evaded ${attacker.name}'s ${ability.name}!`);
        addFloat(target.id, 'EVADE', '#60a5fa');
      } else {
        target.health = Math.max(0, target.health - dmg);
        if (target.health <= 0) target.alive = false;
        const critText = isCrit ? ' CRIT!' : '';
        addLog(`⚔️ ${attacker.name} uses ${ability.name} on ${target.name} for ${dmg} damage!${critText}`);
        addFloat(target.id, `${isCrit ? '💥' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#ef4444');
        if (!target.alive) addLog(`💀 ${target.name} has been defeated!`);

        if (ability.effect && target.alive) {
          const effectResult = applyEffect(target, ability.effect, attacker);
          if (effectResult) {
            const tIdx = newUnits.findIndex(u => u.id === target.id);
            newUnits[tIdx] = effectResult.unit;
            addLog(`  ${effectResult.msg}`);
          }
        }

        if (ability.name.toLowerCase().includes('siphon') || ability.name.toLowerCase().includes('drain')) {
          const healAmt = Math.floor(dmg * 0.5);
          attacker.health = Math.min(attacker.maxHealth, attacker.health + healAmt);
          addLog(`  💚 ${attacker.name} drained ${healAmt} HP!`);
          addFloat(attacker.id, `+${healAmt}`, '#22c55e');
        }
      }
      queueAnim({ type: 'attack', attackerId: attacker.id, targetId: target.id, damage: dmg, isCrit, isEvade: evaded, ability, targets: [{ id: target.id, damage: dmg, isCrit, isEvade: evaded }] });
      if (!target.alive) queueAnim({ type: 'death', targetId: target.id });
    }

    const result = checkBattleEnd(newUnits);
    if (result) {
      setBattleState(prev => ({ ...prev, units: newUnits, phase: result }));
      addLog(result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...');
      setPhase(result);
      return;
    }

    const nextTurn = findNextAliveTurn(newUnits, battleState.turnOrder, battleState.currentTurn);
    if (nextTurn <= battleState.currentTurn) setTurnCount(c => c + 1);
    setBattleState(prev => ({ ...prev, units: newUnits, currentTurn: nextTurn }));

    const nextUnit = newUnits.find(u => u.id === battleState.turnOrder[nextTurn] && u.alive);
    if (nextUnit && !nextUnit.isPlayerControlled) {
      scheduleEnemyTurn(nextTurn);
    }
  }, [battleState, selectedTarget, findNextAliveTurn, checkBattleEnd, addLog, addFloat, scheduleEnemyTurn, processTurnStart, queueAnim]);

  const executeEnemyTurn = useCallback((turnIdx) => {
    setBattleState(prev => {
      if (!prev || prev.phase === 'victory' || prev.phase === 'defeat') return prev;
      let units = prev.units.map(u => ({ ...u, buffs: [...(u.buffs || [])], dots: [...(u.dots || [])] }));
      const turnOrder = prev.turnOrder;

      const unitId = turnOrder[turnIdx % turnOrder.length];
      const enemy = units.find(u => u.id === unitId && u.alive);
      if (!enemy || enemy.isPlayerControlled) return { ...prev, units, currentTurn: turnIdx };

      if (enemy.stunned) {
        setLog(l => [...l.slice(-80), `💫 ${enemy.name} is stunned!`]);
        addFloat(enemy.id, 'STUNNED', '#fbbf24');
        const stunIdx = units.findIndex(u => u.id === enemy.id);
        units[stunIdx] = tickBuffs(enemy);
        units[stunIdx].stunned = false;
        const nextTurnIdx = findNextAliveTurn(units, turnOrder, turnIdx);
        const nextUnit = units.find(u => u.id === turnOrder[nextTurnIdx] && u.alive);
        if (nextUnit && !nextUnit.isPlayerControlled) scheduleEnemyTurn(nextTurnIdx);
        else { const firstAliveEnemy = units.find(u => u.team === 'enemy' && u.alive); if (firstAliveEnemy) setSelectedTarget(firstAliveEnemy.id); }
        return { ...prev, units, currentTurn: nextTurnIdx };
      }

      const { units: processedUnits, msgs: dotMsgs, dotAnims } = processTurnStart(units, unitId);
      units = processedUnits;
      dotMsgs.forEach(m => setLog(l => [...l.slice(-80), m]));
      if (dotAnims?.length > 0) dotAnims.forEach(a => queueAnim(a));

      const enemyAfterDots = units.find(u => u.id === unitId);
      if (!enemyAfterDots || !enemyAfterDots.alive) {
        const result = checkBattleEnd(units);
        if (result) { setLog(l => [...l.slice(-80), result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...']); setPhase(result); return { ...prev, units, phase: result }; }
        const nextTurnIdx = findNextAliveTurn(units, turnOrder, turnIdx);
        const nextUnit = units.find(u => u.id === turnOrder[nextTurnIdx] && u.alive);
        if (nextUnit && !nextUnit.isPlayerControlled) scheduleEnemyTurn(nextTurnIdx);
        return { ...prev, units, currentTurn: nextTurnIdx };
      }

      const isConfused = (enemy.buffs || []).some(b => b.type === 'confuse');
      let targetPool = units.filter(u => u.team === 'player' && u.alive);
      if (isConfused && Math.random() < 0.4) {
        targetPool = units.filter(u => u.team === 'enemy' && u.alive && u.id !== enemy.id);
        if (targetPool.length > 0) setLog(l => [...l.slice(-80), `😵 ${enemy.name} is confused and attacks an ally!`]);
        else targetPool = units.filter(u => u.team === 'player' && u.alive);
      }
      if (targetPool.length === 0) return { ...prev, units, currentTurn: turnIdx };

      enemy.cooldowns = { ...(enemy.cooldowns || {}) };
      Object.keys(enemy.cooldowns).forEach(k => { if (enemy.cooldowns[k] > 0) enemy.cooldowns[k]--; });

      const usableAbilities = enemy.abilities.filter(a =>
        (!enemy.cooldowns[a.id] || enemy.cooldowns[a.id] <= 0) &&
        (a.manaCost || 0) <= enemy.mana &&
        (a.staminaCost || 0) <= enemy.stamina
      );
      const ability = usableAbilities.length > 0
        ? usableAbilities[Math.floor(Math.random() * usableAbilities.length)]
        : enemy.abilities[0] || { id: 'basic', name: 'Attack', type: 'physical', damage: 1.0 };

      const isEnemyAoe = ability.target === 'all_enemies';

      if (isEnemyAoe) {
        const aoeTargets = units.filter(u => u.team === 'player' && u.alive);
        let totalDmg = 0;
        aoeTargets.forEach(t => {
          const { dmg, isCrit, evaded } = calcDamage(enemy, t, ability);
          if (evaded) {
            addFloat(t.id, 'EVADE', '#60a5fa');
          } else {
            t.health = Math.max(0, t.health - dmg);
            if (t.health <= 0) t.alive = false;
            totalDmg += dmg;
            addFloat(t.id, `-${dmg}`, '#ef4444');
            if (!t.alive) setLog(l => [...l.slice(-80), `💀 ${t.name} has fallen!`]);
            if (ability.effect && t.alive) {
              const effectResult = applyEffect(t, ability.effect, enemy);
              if (effectResult) { const tIdx = units.findIndex(u => u.id === t.id); units[tIdx] = effectResult.unit; setLog(l => [...l.slice(-80), `  ${effectResult.msg}`]); }
            }
          }
        });
        setLog(l => [...l.slice(-80), `👹 ${enemy.name} uses ${ability.name} — ${totalDmg} total damage to all heroes!`]);
        queueAnim({ type: 'attack', attackerId: enemy.id, targetId: aoeTargets[0]?.id, targets: aoeTargets.map(t => ({ id: t.id, damage: 0, isCrit: false, isEvade: false })), ability });
      } else {
        const target = targetPool[Math.floor(Math.random() * targetPool.length)];
        const { dmg, isCrit, evaded } = calcDamage(enemy, target, ability);
        if (evaded) {
          setLog(l => [...l.slice(-80), `${target.name} evaded ${enemy.name}'s ${ability.name}!`]);
          addFloat(target.id, 'EVADE', '#60a5fa');
        } else {
          target.health = Math.max(0, target.health - dmg);
          if (target.health <= 0) target.alive = false;
          setLog(l => [...l.slice(-80), `👹 ${enemy.name} uses ${ability.name} on ${target.name} for ${dmg} damage!${isCrit ? ' CRIT!' : ''}`]);
          addFloat(target.id, `-${dmg}`, '#ef4444');
          if (!target.alive) setLog(l => [...l.slice(-80), `💀 ${target.name} has fallen!`]);

          if (ability.effect && target.alive) {
            const effectResult = applyEffect(target, ability.effect, enemy);
            if (effectResult) {
              const tIdx = units.findIndex(u => u.id === target.id);
              units[tIdx] = effectResult.unit;
              setLog(l => [...l.slice(-80), `  ${effectResult.msg}`]);
            }
          }
        }
        queueAnim({ type: 'attack', attackerId: enemy.id, targetId: target.id, damage: dmg, isCrit, isEvade: evaded, ability, targets: [{ id: target.id, damage: dmg, isCrit, isEvade: evaded }] });
        if (!target.alive) queueAnim({ type: 'death', targetId: target.id });
      }

      if (ability.cooldown > 0) enemy.cooldowns[ability.id] = ability.cooldown;
      enemy.mana -= ability.manaCost || 0;
      enemy.stamina -= ability.staminaCost || 0;

      const result = checkBattleEnd(units);
      if (result) {
        setLog(l => [...l.slice(-80), result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...']);
        setPhase(result);
        return { ...prev, units, currentTurn: turnIdx, phase: result };
      }

      const nextTurnIdx = findNextAliveTurn(units, turnOrder, turnIdx);
      const nextUnit = units.find(u => u.id === turnOrder[nextTurnIdx] && u.alive);
      if (nextUnit && !nextUnit.isPlayerControlled) {
        scheduleEnemyTurn(nextTurnIdx);
      } else {
        const firstAliveEnemy = units.find(u => u.team === 'enemy' && u.alive);
        if (firstAliveEnemy) setSelectedTarget(firstAliveEnemy.id);
      }

      return { ...prev, units, currentTurn: nextTurnIdx };
    });
  }, [checkBattleEnd, addFloat, findNextAliveTurn, scheduleEnemyTurn, processTurnStart, queueAnim]);

  executeEnemyTurnRef.current = executeEnemyTurn;
  executeAbilityRef.current = executeAbility;

  useEffect(() => {
    if (!autoFight || !battleState || animLocked) return;
    if (phase === 'victory' || phase === 'defeat') { setAutoFight(false); return; }
    const currentId = battleState.turnOrder[battleState.currentTurn % battleState.turnOrder.length];
    const current = battleState.units.find(u => u.id === currentId && u.alive);
    if (!current || !current.isPlayerControlled) return;

    autoFightTimerRef.current = setTimeout(() => {
      const aliveEnemies = battleState.units.filter(u => u.team === 'enemy' && u.alive);
      if (aliveEnemies.length === 0) return;
      const lowestHpEnemy = aliveEnemies.reduce((a, b) => (a.health / a.maxHealth) < (b.health / b.maxHealth) ? a : b);
      setSelectedTarget(lowestHpEnemy.id);

      const usable = (current.abilities || []).filter(a => {
        const cd = current.cooldowns?.[a.id] || 0;
        return cd <= 0 && (a.manaCost || 0) <= current.mana && (a.staminaCost || 0) <= current.stamina;
      });

      let pick = usable[0];
      if (usable.length > 1) {
        const aliveHeroes = battleState.units.filter(u => u.team === 'player' && u.alive);
        const needsHeal = aliveHeroes.some(h => h.health / h.maxHealth < 0.35);
        const healAbility = usable.find(a => a.type === 'heal');
        if (needsHeal && healAbility) {
          pick = healAbility;
        } else {
          const offensive = usable.filter(a => a.target !== 'self' && a.type !== 'buff' && a.type !== 'heal');
          pick = offensive.length > 0
            ? offensive.reduce((a, b) => (b.damage || 0) > (a.damage || 0) ? b : a)
            : usable[0];
        }
      }
      if (pick && executeAbilityRef.current) {
        executeAbilityRef.current(pick, lowestHpEnemy.id);
      }
    }, 500);
    return () => { if (autoFightTimerRef.current) clearTimeout(autoFightTimerRef.current); };
  }, [autoFight, battleState, animLocked, phase]);

  useEffect(() => {
    return () => {
      if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
      if (autoFightTimerRef.current) clearTimeout(autoFightTimerRef.current);
    };
  }, []);

  const quickBattle = useCallback(() => {
    const races = spec.races || [];
    const classes = spec.classes || [];
    const enemies = spec.enemies || [];
    const bosses = spec.bosses || [];
    const allEnemies = [...enemies, ...bosses.map(b => ({ ...b, isBoss: true }))].map((e, i) => ({ ...e, id: e.id || `enemy_${i}` }));

    const combos = [];
    for (let r = 0; r < races.length && combos.length < 4; r++) {
      for (let c = 0; c < classes.length && combos.length < 4; c++) {
        if (r === c || combos.length < Math.min(races.length, classes.length)) {
          combos.push({ race: races[r], cls: classes[c % classes.length] });
          break;
        }
      }
    }
    if (combos.length === 0 && races.length > 0 && classes.length > 0) {
      combos.push({ race: races[0], cls: classes[0] });
    }

    const picks = allEnemies.slice(0, Math.min(3, allEnemies.length));
    if (picks.length === 0 && allEnemies.length > 0) picks.push(allEnemies[0]);

    if (combos.length === 0 || picks.length === 0) return;

    setSelectedHeroes(combos);
    setSelectedEnemies(picks);

    const heroes = combos.map((combo, i) => createHeroFromSpec(combo.race, combo.cls, 5, i, spec));
    const enemyUnits = picks.map((e, i) => createEnemyFromSpec(e, 5, i));
    const allUnits = [...heroes, ...enemyUnits];
    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    setBattleState({ units: allUnits, turnOrder, currentTurn: 0, phase: 'player' });
    setSelectedTarget(enemyUnits[0]?.id || null);
    setLog([`⚔️ Battle begins! ${heroes.length} heroes vs ${enemyUnits.length} enemies!`]);
    setPhase('battle');
    setTurnCount(1);
  }, [spec]);

  const renderSetup = () => {
    const races = spec.races || [];
    const classes = spec.classes || [];
    const enemies = spec.enemies || [];
    const bosses = spec.bosses || [];
    const allEnemies = [...enemies, ...bosses.map(b => ({ ...b, isBoss: true }))].map((e, i) => ({ ...e, id: e.id || `enemy_${i}` }));

    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
        padding: '10px', boxSizing: 'border-box',
      }}>
        <div style={{
          textAlign: 'center', padding: '10px 16px', flexShrink: 0,
          background: `linear-gradient(135deg, ${palette.background || '#050a18'}, rgba(15,23,42,0.8))`,
          borderRadius: '12px', border: `1px solid ${palette.primary || '#06b6d4'}22`,
          marginBottom: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: palette.primary || '#06b6d4', fontSize: '20px', margin: 0 }}>
              Assemble Your Party
            </h2>
            <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0' }}>
              Choose heroes & enemies, or jump right in
            </p>
          </div>
          <button
            onClick={quickBattle}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none',
              background: `linear-gradient(135deg, ${palette.accent || '#f59e0b'}, ${palette.accent || '#f59e0b'}cc)`,
              color: '#0a0a0f', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              fontFamily: "'Cinzel', serif",
              boxShadow: `0 2px 12px ${palette.accent || '#f59e0b'}40`,
              transition: 'all 0.3s', whiteSpace: 'nowrap',
            }}
          >Quick Battle</button>
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: '12px', alignContent: 'start',
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '14px',
            border: `1px solid ${palette.primary || '#06b6d4'}20`,
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexShrink: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: `${palette.primary || '#06b6d4'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', border: `1px solid ${palette.primary || '#06b6d4'}40`,
              }}>⚔️</div>
              <div>
                <h3 style={{ color: palette.primary || '#06b6d4', fontSize: '14px', margin: 0, fontFamily: "'Cinzel', serif" }}>
                  Your Heroes
                </h3>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedHeroes.length}/4 selected</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: i < selectedHeroes.length ? (palette.primary || '#06b6d4') : '#1e293b',
                    border: `1px solid ${palette.primary || '#06b6d4'}40`,
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
            </div>
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {races.map(race => classes.map(cls => {
                  const key = `${race.id}_${cls.id}`;
                  const isSelected = selectedHeroes.some(h => `${h.race.id}_${h.cls.id}` === key);
                  return (
                    <button key={key} onClick={() => {
                      if (isSelected) setSelectedHeroes(prev => prev.filter(h => `${h.race.id}_${h.cls.id}` !== key));
                      else if (selectedHeroes.length < 4) setSelectedHeroes(prev => [...prev, { race, cls }]);
                    }} style={{
                      padding: '8px 10px', borderRadius: '8px', cursor: selectedHeroes.length >= 4 && !isSelected ? 'not-allowed' : 'pointer',
                      background: isSelected ? `${race.color || '#06b6d4'}18` : 'rgba(15, 23, 42, 0.6)',
                      border: `2px solid ${isSelected ? (race.color || '#06b6d4') : '#1e293b55'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                      opacity: selectedHeroes.length >= 4 && !isSelected ? 0.4 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SpecIcon icon={race.icon} color={race.color} size={22} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }}>{race.name}</div>
                          <div style={{ color: cls.color || '#a855f7', fontSize: '11px' }}>{cls.name} <span style={{ color: '#475569', fontSize: '10px' }}>({cls.role || 'DPS'})</span></div>
                          {cls.startingAttributes && (
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                              {Object.entries(cls.startingAttributes).filter(([,v]) => v >= 6).map(([key, val]) => {
                                const attr = themedAttributes.find(a => a.base === key || a.name === key);
                                return (
                                  <span key={key} style={{
                                    fontSize: '8px', padding: '0 3px', borderRadius: '2px',
                                    background: `${attr?.color || '#64748b'}15`, color: attr?.color || '#64748b',
                                    border: `1px solid ${attr?.color || '#64748b'}30`,
                                  }}>{attr?.abbr || key.slice(0,3).toUpperCase()} {val}</span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {isSelected && <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>}
                      </div>
                    </button>
                  );
                })).flat()}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '14px',
            border: '1px solid rgba(239,68,68,0.15)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexShrink: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', border: '1px solid rgba(239,68,68,0.3)',
              }}>👹</div>
              <div>
                <h3 style={{ color: '#ef4444', fontSize: '14px', margin: 0, fontFamily: "'Cinzel', serif" }}>
                  Enemies
                </h3>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{selectedEnemies.length}/5 selected</div>
              </div>
            </div>
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {allEnemies.map((enemy, i) => {
                  const isSelected = selectedEnemies.some(e => e.id === enemy.id);
                  return (
                    <button key={enemy.id || i} onClick={() => {
                      if (isSelected) setSelectedEnemies(prev => prev.filter(e => e.id !== enemy.id));
                      else if (selectedEnemies.length < 5) setSelectedEnemies(prev => [...prev, enemy]);
                    }} style={{
                      padding: '8px 10px', borderRadius: '8px', cursor: selectedEnemies.length >= 5 && !isSelected ? 'not-allowed' : 'pointer',
                      background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                      border: `2px solid ${isSelected ? '#ef4444' : '#1e293b55'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                      opacity: selectedEnemies.length >= 5 && !isSelected ? 0.4 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SpecIcon icon={enemy.icon} color={enemy.isBoss ? '#fbbf24' : '#ef4444'} size={18} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }}>{enemy.name}</div>
                          <div style={{ fontSize: '10px', color: enemy.isBoss ? '#fbbf24' : '#64748b' }}>
                            {enemy.isBoss ? '★ BOSS' : `HP:${enemy.baseHealth || 80}`} | DMG:{enemy.baseDamage || 12}
                          </div>
                        </div>
                        {isSelected && <span style={{ color: '#ef4444', fontSize: '14px' }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          {onBack && <button onClick={onBack} style={{
            padding: '10px 24px', borderRadius: '10px', border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '14px',
          }}>Back</button>}
          <button
            onClick={startBattle}
            disabled={selectedHeroes.length === 0 || selectedEnemies.length === 0}
            style={{
              padding: '12px 36px', borderRadius: '12px', border: 'none',
              background: selectedHeroes.length > 0 && selectedEnemies.length > 0
                ? `linear-gradient(135deg, ${palette.primary || '#06b6d4'}, ${palette.accent || '#f59e0b'})`
                : '#1e293b',
              color: selectedHeroes.length > 0 && selectedEnemies.length > 0 ? '#0a0a0f' : '#475569',
              cursor: selectedHeroes.length > 0 && selectedEnemies.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '15px', fontWeight: 700, fontFamily: "'Cinzel', serif",
              boxShadow: selectedHeroes.length > 0 && selectedEnemies.length > 0
                ? `0 4px 20px ${palette.primary || '#06b6d4'}40` : 'none',
              transition: 'all 0.3s',
            }}
          >Start Battle</button>
        </div>
      </div>
    );
  };

  const renderBattle = () => {
    if (!battleState) return null;
    const { units, turnOrder, currentTurn } = battleState;
    const currentUnitId = turnOrder[currentTurn % turnOrder.length];
    const currentUnit = units.find(u => u.id === currentUnitId && u.alive);
    const heroes = units.filter(u => u.team === 'player');
    const enemies = units.filter(u => u.team === 'enemy');
    const isPlayerTurn = currentUnit?.isPlayerControlled;
    const heroesAlive = heroes.filter(u => u.alive).length;
    const enemiesAlive = enemies.filter(u => u.alive).length;
    const gameId = spec.meta?.id || 'shadow-knights';

    return (
      <GameContainer spec={spec} style={{ height: '100%' }}>
      <div style={{
        height: '100%',
        background: `linear-gradient(180deg, ${palette.background || '#050a18'} 0%, #0a0a1a 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <style>{`
          @keyframes pulse { 0%, 100% { box-shadow: 0 0 8px ${palette.accent || '#fbbf24'}44; } 50% { box-shadow: 0 0 16px ${palette.accent || '#fbbf24'}66; } }
          @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.6)', borderBottom: `1px solid ${palette.primary || '#06b6d4'}15`,
          fontSize: '11px', color: '#64748b', zIndex: 2, height: '32px', boxSizing: 'border-box',
        }}>
          <span style={{ color: palette.primary || '#06b6d4', fontWeight: 700 }}>{heroesAlive} Heroes Alive</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'Cinzel', serif", color: palette.accent || '#fbbf24', fontSize: '13px' }}>Turn {turnCount}</span>
            {phase !== 'victory' && phase !== 'defeat' && (
              <button onClick={() => setAutoFight(f => !f)} style={{
                padding: '2px 10px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: autoFight ? `${palette.accent || '#fbbf24'}25` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${autoFight ? (palette.accent || '#fbbf24') : '#334155'}`,
                color: autoFight ? (palette.accent || '#fbbf24') : '#64748b',
                transition: 'all 0.2s',
              }}>
                {autoFight ? 'Auto: ON' : 'Auto'}
              </button>
            )}
          </div>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>{enemiesAlive} Enemies Alive</span>
        </div>

        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, bottom: '150px', overflow: 'hidden' }}>
          <BattleStage
            units={units}
            currentUnitId={currentUnitId}
            gameId={gameId}
            palette={palette}
            battleBackground={battleBackground}
            onSelectTarget={(id) => setSelectedTarget(id)}
            selectedTarget={selectedTarget}
            isPlayerTurn={isPlayerTurn && !animLocked}
            animationEvent={animationEvent}
            onAnimationComplete={onAnimationComplete}
          />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: `linear-gradient(180deg, rgba(10,15,30,0.95), rgba(5,10,24,0.98))`,
          borderTop: `2px solid ${palette.primary || '#06b6d4'}25`,
          padding: '10px 10px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px',
          height: '150px', boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <div style={{ overflowY: 'auto', minWidth: 0 }}>
            {heroes.map(h => (
              <div key={h.id} style={{ marginBottom: '6px', opacity: h.alive ? 1 : 0.3 }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700,
                  color: h.id === currentUnitId ? (palette.accent || '#fbbf24') : '#93c5fd',
                  display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px',
                }}>
                  <SpecIcon icon={h.raceIcon} color={h.raceColor} size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                </div>
                <ResourceBar value={h.health} max={h.maxHealth} color={h.health / h.maxHealth > 0.5 ? '#22c55e' : h.health / h.maxHealth > 0.25 ? '#f59e0b' : '#ef4444'} label="HP" />
                <ResourceBar value={h.mana} max={h.maxMana} color="#3b82f6" label="MP" />
                <ResourceBar value={h.stamina} max={h.maxStamina} color="#f59e0b" label="SP" />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0, overflowX: 'hidden', overflowY: 'auto' }}>
            {phase === 'victory' || phase === 'defeat' ? (
              <div style={{ textAlign: 'center', animation: 'fadeSlide 0.5s ease', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700,
                  color: phase === 'victory' ? '#fbbf24' : '#ef4444',
                  textShadow: `0 0 30px ${phase === 'victory' ? '#fbbf2455' : '#ef444455'}`,
                  marginBottom: phase === 'victory' ? '6px' : '10px',
                }}>{phase === 'victory' ? 'Victory!' : 'Defeated...'}</div>
                {phase === 'victory' && (
                  <LootRewards
                    visible={true}
                    palette={palette}
                    onClose={() => { setPhase('setup'); setBattleState(null); setLog([]); setTurnCount(0); setAnimationEvent(null); setAnimLocked(false); setAutoFight(false); animQueueRef.current = []; }}
                  />
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: phase === 'defeat' ? 0 : '4px' }}>
                  {phase === 'defeat' && <button onClick={() => { setPhase('setup'); setBattleState(null); setLog([]); setTurnCount(0); setAnimationEvent(null); setAnimLocked(false); setAutoFight(false); animQueueRef.current = []; }} style={{
                    padding: '10px 24px', borderRadius: '10px', border: `1px solid ${palette.primary || '#06b6d4'}44`,
                    background: `${palette.primary || '#06b6d4'}15`, color: palette.primary || '#06b6d4',
                    cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                  }}>New Battle</button>}
                  {onBack && <button onClick={onBack} style={{
                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                    background: palette.primary || '#06b6d4', color: '#0a0a0f', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  }}>Back</button>}
                </div>
              </div>
            ) : isPlayerTurn && !animLocked && !autoFight ? (
              <div style={{ width: '100%' }}>
                <div style={{
                  fontSize: '12px', color: palette.accent || '#fbbf24', fontWeight: 700, textAlign: 'center',
                  marginBottom: '6px', fontFamily: "'Cinzel', serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <span style={{ width: '20px', height: '1px', background: `${palette.accent || '#fbbf24'}44` }} />
                  {currentUnit?.name}'s Turn
                  <span style={{ width: '20px', height: '1px', background: `${palette.accent || '#fbbf24'}44` }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(currentUnit?.abilities || []).map(ability => {
                    const cd = (currentUnit?.cooldowns?.[ability.id] || 0);
                    const onCd = cd > 0;
                    const noMana = (ability.manaCost || 0) > (currentUnit?.mana || 0);
                    const noStamina = (ability.staminaCost || 0) > (currentUnit?.stamina || 0);
                    const disabled = onCd || noMana || noStamina;
                    const isSelf = ability.target === 'self' || ability.type === 'buff';
                    const isHealType = ability.type === 'heal';
                    const isAoe = ability.target === 'all_enemies';
                    const typeColor = isHealType ? '#22c55e' : isSelf ? '#3b82f6' : isAoe ? '#a855f7' : (palette.primary || '#06b6d4');
                    return (
                      <button key={ability.id} onClick={() => !disabled && executeAbility(ability)}
                        disabled={disabled}
                        title={ability.description || ability.name}
                        style={{
                          padding: '6px 8px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
                          background: disabled ? 'rgba(30, 41, 59, 0.5)' : `linear-gradient(135deg, ${typeColor}20, ${typeColor}10)`,
                          border: `1px solid ${disabled ? '#1e293b' : typeColor}`,
                          color: disabled ? '#475569' : '#e2e8f0',
                          fontSize: '11px', fontWeight: 600, transition: 'all 0.2s',
                          opacity: disabled ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', gap: '4px',
                          minWidth: 0, flex: '1 1 auto',
                        }}>
                        <SpecIcon icon={ability.icon} color={typeColor} size={18} />
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <div style={{ lineHeight: 1.2 }}>{ability.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {ability.damage > 0 && !isSelf && <span style={{ color: '#ef4444' }}>{ability.damage}x</span>}
                            {ability.manaCost > 0 && <span style={{ color: '#3b82f6' }}>{ability.manaCost}MP</span>}
                            {ability.staminaCost > 0 && <span style={{ color: '#f59e0b' }}>{ability.staminaCost}SP</span>}
                            {onCd && <span style={{ color: '#ef4444' }}>CD:{cd}</span>}
                            {ability.effect && <span style={{ color: '#a855f7' }}>{ability.effect}</span>}
                            {isAoe && <span style={{ color: '#a855f7' }}>AOE</span>}
                            {isSelf && <span style={{ color: '#3b82f6' }}>SELF</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '13px', color: '#94a3b8', fontStyle: 'italic',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  background: '#ef4444', animation: 'pulse 1.5s infinite',
                }} />
                {autoFight ? 'Auto Fight...' : animLocked ? 'Animating...' : 'Enemy turn...'}
              </div>
            )}
          </div>

          <div style={{
            minWidth: 0, overflowY: 'auto',
            fontSize: '10px', color: '#94a3b8',
            background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#475569', marginBottom: '4px' }}>Battle Log</div>
            {log.slice(-12).map((entry, i) => (
              <div key={i} style={{ marginBottom: '2px', lineHeight: 1.3, animation: i === log.slice(-12).length - 1 ? 'fadeSlide 0.3s ease' : 'none' }}>{entry}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
      </GameContainer>
    );
  };

  if (phase === 'setup') return renderSetup();
  return renderBattle();
}

function WeaponTag({ weapon }) {
  if (!weapon) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px',
    }}>
      <SpecIcon icon={weapon.icon} color="#f59e0b" size={10} />
      <span style={{ fontSize: '8px', color: '#f59e0b', fontWeight: 600 }}>{weapon.name}</span>
    </div>
  );
}

function SpecIcon({ icon, color, size = 22 }) {
  if (!icon) {
    return <span style={{
      display: 'inline-flex', width: size, height: size, borderRadius: '50%',
      background: `${color || '#334155'}30`, border: `1px solid ${color || '#334155'}60`,
      alignItems: 'center', justifyContent: 'center', fontSize: `${size * 0.5}px`, color: color || '#94a3b8',
      flexShrink: 0,
    }}>●</span>;
  }
  if (icon.includes('/') || icon.includes('.png') || icon.includes('.svg') || icon.includes('.webp')) {
    return (
      <img
        src={icon}
        alt=""
        style={{
          width: size, height: size, objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: `drop-shadow(0 0 3px ${color || '#fbbf24'}44)`,
          flexShrink: 0,
        }}
        onError={e => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          const parent = e.target.parentElement;
          if (parent) {
            const fallback = document.createElement('span');
            fallback.textContent = '⚡';
            fallback.style.fontSize = `${size}px`;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }
  return <span style={{ fontSize: `${size}px`, flexShrink: 0 }}>{icon}</span>;
}

function ResourceBar({ value, max, color, label }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '1px' }}>
      <span style={{ fontSize: '8px', color: '#475569', width: '14px', textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '8px', color: '#475569', width: '32px' }}>{value}/{max}</span>
    </div>
  );
}

function UnitCard({ unit, isActive, palette, isTarget, onClick, floats = [] }) {
  const isEnemy = unit.team === 'enemy';
  const hpPct = unit.maxHealth > 0 ? (unit.health / unit.maxHealth) * 100 : 0;
  const hpColor = !unit.alive ? '#555' : hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
  const unitIcon = isEnemy ? (unit.icon || '') : (unit.raceIcon || '');
  const unitColor = isEnemy ? (unit.isBoss ? '#fbbf24' : '#ef4444') : (unit.raceColor || '#06b6d4');

  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', borderRadius: '12px',
      background: isTarget ? 'rgba(239, 68, 68, 0.15)' : isActive ? `${palette.accent || '#fbbf24'}12` : 'rgba(15, 23, 42, 0.85)',
      border: `2px solid ${isTarget ? '#ef4444' : isActive ? (palette.accent || '#fbbf24') : '#1e293b44'}`,
      opacity: unit.alive ? 1 : 0.3,
      cursor: isEnemy && unit.alive ? 'pointer' : 'default',
      transition: 'all 0.3s', position: 'relative',
      minWidth: 160,
      animation: isActive && unit.alive ? 'pulse 2s infinite' : 'none',
      backdropFilter: 'blur(8px)',
    }}>
      {floats.map(f => (
        <div key={f.id} style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          color: f.color, fontSize: '16px', fontWeight: 900, textShadow: '0 0 8px rgba(0,0,0,0.8)',
          animation: 'floatUp 1.2s forwards', pointerEvents: 'none', zIndex: 10,
        }}>{f.text}</div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <SpecIcon icon={unitIcon} color={unitColor} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? (palette.accent || '#fbbf24') : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.name}</div>
          <div style={{ fontSize: '10px', color: isEnemy ? (unit.isBoss ? '#fbbf24' : '#94a3b8') : (unit.classColor || '#a855f7'), display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isEnemy ? (unit.isBoss ? '★ BOSS' : 'Enemy') : unit.className}
            {unit.row && <span style={{ fontSize: '8px', color: '#475569', padding: '0 3px', borderRadius: '2px', background: '#1e293b' }}>{unit.row}</span>}
          </div>
          {!isEnemy && unit.weapon && <WeaponTag weapon={unit.weapon} />}
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden', marginBottom: '3px' }}>
        <div style={{ height: '100%', width: `${hpPct}%`, background: hpColor, transition: 'width 0.4s ease', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
        <span>HP: {unit.health}/{unit.maxHealth}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ color: '#ef4444' }}>DMG:{unit.baseDamage}</span>
          <span style={{ color: '#3b82f6' }}>DEF:{unit.baseDefense}</span>
          <span>SPD:{unit.speed}</span>
        </div>
      </div>
      {(unit.buffs?.length > 0 || unit.dots?.length > 0) && (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px' }}>
          {(unit.buffs || []).map((b, i) => (
            <span key={`b${i}`} style={{
              fontSize: '8px', padding: '1px 4px', borderRadius: '3px',
              background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40`,
              fontWeight: 600,
            }}>{b.label} {b.turns}</span>
          ))}
          {(unit.dots || []).map((d, i) => (
            <span key={`d${i}`} style={{
              fontSize: '8px', padding: '1px 4px', borderRadius: '3px',
              background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40`,
              fontWeight: 600,
            }}>{d.label} {d.turns}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '100, 100, 100';
}
