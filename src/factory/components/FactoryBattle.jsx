import React, { useState, useEffect, useCallback, useRef } from 'react';

function createHeroFromSpec(race, cls, level = 5, idx = 0) {
  const baseHp = 80 + (race.bonuses?.health || 0) * 10 + (cls.startingAttributes?.Vitality || 5) * 12;
  const baseMana = 40 + (cls.startingAttributes?.Wisdom || 5) * 8;
  const baseStamina = 40 + (cls.startingAttributes?.Endurance || 5) * 6;
  const str = (cls.startingAttributes?.Strength || 5) + level;
  const intel = (cls.startingAttributes?.Intelligence || 5) + level;
  const agi = (cls.startingAttributes?.Agility || 5) + level;
  const hp = Math.floor(baseHp + level * 14);
  const mana = Math.floor(baseMana + level * 6);
  const stamina = Math.floor(baseStamina + level * 4);

  const abilities = (cls.abilities || []).slice(0, 4).map((a, i) => ({
    id: a.id || `ability_${i}`,
    name: a.name || `Ability ${i + 1}`,
    icon: a.icon || '⚡',
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
    abilities.push({ id: 'basic_attack', name: 'Attack', icon: '⚔️', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 5, cooldown: 0, target: 'enemy' });
  }

  return {
    id: `hero_${idx}`,
    name: `${race.name} ${cls.name}`,
    team: 'player',
    isPlayerControlled: true,
    classId: cls.id,
    raceId: race.id,
    raceIcon: race.icon || '🔷',
    classIcon: cls.icon || '⚔️',
    className: cls.name,
    raceName: race.name,
    raceColor: race.color || '#06b6d4',
    classColor: cls.color || '#a855f7',
    health: hp, maxHealth: hp,
    mana: mana, maxMana: mana,
    stamina: stamina, maxStamina: stamina,
    physicalDamage: Math.floor(str * 2.5 + level * 3),
    magicDamage: Math.floor(intel * 2.2 + level * 2),
    defense: Math.floor((cls.startingAttributes?.Vitality || 5) * 1.5 + level * 2),
    speed: 15 + Math.floor(agi * 0.5),
    critChance: 5 + Math.floor(agi * 0.3),
    criticalDamage: 50,
    evasion: Math.floor(agi * 0.4),
    abilities,
    cooldowns: {},
    buffs: [], dots: [], stunned: false, alive: true,
    level,
    row: idx < 2 ? 'front' : 'back',
  };
}

function createEnemyFromSpec(enemy, level = 5, idx = 0) {
  const scaledHp = Math.floor((enemy.baseHealth || 80) * (1 + level * 0.15));
  const scaledDmg = Math.floor((enemy.baseDamage || 12) * (1 + level * 0.12));
  const scaledDef = Math.floor((enemy.baseDefense || 4) * (1 + level * 0.1));

  const abilities = (enemy.abilities || []).slice(0, 3).map((a, i) => ({
    id: a.id || `enemy_ability_${i}`,
    name: a.name || `Attack ${i + 1}`,
    icon: a.icon || '💥',
    type: a.type || 'physical',
    damage: a.damage || 1.0,
    manaCost: a.manaCost || 0,
    staminaCost: a.staminaCost || 0,
    cooldown: a.cooldown || 0,
    target: a.target || 'enemy',
    effect: a.effect || null,
  }));

  if (abilities.length === 0) {
    abilities.push({ id: 'enemy_attack', name: 'Attack', icon: '👊', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'enemy' });
  }

  return {
    id: `enemy_${idx}`,
    name: enemy.name || `Enemy ${idx + 1}`,
    team: 'enemy',
    isPlayerControlled: false,
    icon: enemy.icon || '👹',
    color: enemy.color || '#ef4444',
    health: scaledHp, maxHealth: scaledHp,
    mana: enemy.baseMana || 30, maxMana: enemy.baseMana || 30,
    stamina: 50, maxStamina: 50,
    physicalDamage: scaledDmg,
    magicDamage: Math.floor(scaledDmg * 0.8),
    defense: scaledDef,
    speed: enemy.speed || 12,
    critChance: 5,
    criticalDamage: 40,
    evasion: 3,
    abilities,
    cooldowns: {},
    buffs: [], dots: [], stunned: false, alive: true,
    level,
    isBoss: enemy.isBoss || false,
    xpReward: enemy.xpReward || 20,
    goldReward: enemy.goldReward || 10,
    row: idx === 0 ? 'front' : 'back',
  };
}

function calcDamage(attacker, defender, ability) {
  const isPhysical = ability.type !== 'magic' && ability.type !== 'magical';
  const baseDmg = isPhysical ? attacker.physicalDamage : attacker.magicDamage;
  const multiplier = ability.damage || 1.0;
  let dmg = Math.floor(baseDmg * multiplier);
  const defReduction = Math.max(0, defender.defense * 0.4);
  dmg = Math.max(1, dmg - defReduction);
  const isCrit = Math.random() * 100 < (attacker.critChance || 5);
  if (isCrit) dmg = Math.floor(dmg * (1 + (attacker.criticalDamage || 50) / 100));
  const evaded = Math.random() * 100 < (defender.evasion || 0);
  if (evaded) dmg = 0;
  return { dmg, isCrit, evaded };
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
  const floatIdRef = useRef(0);
  const logEndRef = useRef(null);
  const enemyTimerRef = useRef(null);
  const executeEnemyTurnRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    if (!battleState || battleState.phase === 'victory' || battleState.phase === 'defeat') return;
    const currentId = battleState.turnOrder[battleState.currentTurn % battleState.turnOrder.length];
    const current = battleState.units.find(u => u.id === currentId);
    if (!current || !current.alive) {
      const nextTurn = findNextAliveTurn(battleState.units, battleState.turnOrder, battleState.currentTurn);
      setBattleState(prev => prev ? { ...prev, currentTurn: nextTurn } : prev);
      const nextUnit = battleState.units.find(u => u.id === battleState.turnOrder[nextTurn] && u.alive);
      if (nextUnit && !nextUnit.isPlayerControlled) {
        scheduleEnemyTurn(nextTurn);
      }
    }
  }, [battleState]);

  const scheduleEnemyTurn = useCallback((turnIdx) => {
    if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
    enemyTimerRef.current = setTimeout(() => {
      enemyTimerRef.current = null;
      if (executeEnemyTurnRef.current) executeEnemyTurnRef.current(turnIdx);
    }, 550);
  }, []);

  const addFloat = useCallback((unitId, text, color) => {
    const id = ++floatIdRef.current;
    setFloatingTexts(prev => [...prev, { id, unitId, text, color, created: Date.now() }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1500);
  }, []);

  const addLog = useCallback((msg) => {
    setLog(prev => [...prev.slice(-50), msg]);
  }, []);

  const startBattle = useCallback(() => {
    const heroes = selectedHeroes.map((combo, i) => createHeroFromSpec(combo.race, combo.cls, 5, i));
    const enemies = selectedEnemies.map((e, i) => createEnemyFromSpec(e, 5, i));
    const allUnits = [...heroes, ...enemies];
    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    setBattleState({
      units: allUnits,
      turnOrder,
      currentTurn: 0,
      phase: 'player',
    });
    setSelectedTarget(enemies[0]?.id || null);
    setLog([`⚔️ Battle begins! ${heroes.length} heroes vs ${enemies.length} enemies!`]);
    setPhase('battle');
  }, [selectedHeroes, selectedEnemies]);

  const getAliveUnitAtTurn = useCallback((units, turnOrder, turnIdx) => {
    const id = turnOrder[turnIdx % turnOrder.length];
    return units.find(u => u.id === id && u.alive) || null;
  }, []);

  const getCurrentUnit = useCallback(() => {
    if (!battleState) return null;
    return getAliveUnitAtTurn(battleState.units, battleState.turnOrder, battleState.currentTurn);
  }, [battleState, getAliveUnitAtTurn]);

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

  const executeAbility = useCallback((ability) => {
    if (!battleState) return;
    const current = getCurrentUnit();
    if (!current || !current.isPlayerControlled) return;

    const tickedCooldowns = { ...current.cooldowns };
    Object.keys(tickedCooldowns).forEach(k => {
      if (tickedCooldowns[k] > 0) tickedCooldowns[k]--;
    });

    const cd = tickedCooldowns[ability.id] || 0;
    if (cd > 0) {
      addLog(`${ability.name} is on cooldown (${cd} turns)!`);
      return;
    }
    if (ability.manaCost > current.mana) { addLog(`Not enough mana!`); return; }
    if (ability.staminaCost > current.stamina) { addLog(`Not enough stamina!`); return; }

    const target = battleState.units.find(u => u.id === selectedTarget && u.alive);
    if (!target) return;

    const newUnits = battleState.units.map(u => ({ ...u }));
    const attacker = newUnits.find(u => u.id === current.id);
    const defender = newUnits.find(u => u.id === target.id);

    attacker.cooldowns = { ...tickedCooldowns };
    attacker.mana -= ability.manaCost || 0;
    attacker.stamina -= ability.staminaCost || 0;

    if (ability.cooldown > 0) {
      attacker.cooldowns[ability.id] = ability.cooldown;
    }

    if (ability.target === 'self' || ability.target === 'ally') {
      attacker.health = Math.min(attacker.maxHealth, attacker.health + Math.floor(attacker.magicDamage * (ability.damage || 1)));
      addLog(`💚 ${attacker.name} uses ${ability.name} — healed!`);
      addFloat(attacker.id, `+${Math.floor(attacker.magicDamage * (ability.damage || 1))} HP`, '#22c55e');
    } else {
      const { dmg, isCrit, evaded } = calcDamage(attacker, defender, ability);
      if (evaded) {
        addLog(`${defender.name} evaded ${attacker.name}'s ${ability.name}!`);
        addFloat(defender.id, 'EVADE', '#60a5fa');
      } else {
        defender.health = Math.max(0, defender.health - dmg);
        if (defender.health <= 0) defender.alive = false;
        const critText = isCrit ? ' CRIT!' : '';
        addLog(`⚔️ ${attacker.name} uses ${ability.name} on ${defender.name} for ${dmg} damage!${critText}`);
        addFloat(defender.id, `${isCrit ? '💥' : ''}-${dmg}`, isCrit ? '#fbbf24' : '#ef4444');
        if (!defender.alive) addLog(`💀 ${defender.name} has been defeated!`);
      }
    }

    const result = checkBattleEnd(newUnits);
    if (result) {
      setBattleState(prev => ({ ...prev, units: newUnits, phase: result }));
      addLog(result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...');
      setPhase(result);
      return;
    }

    const nextTurn = findNextAliveTurn(newUnits, battleState.turnOrder, battleState.currentTurn);
    setBattleState(prev => ({ ...prev, units: newUnits, currentTurn: nextTurn }));

    const nextUnit = newUnits.find(u => u.id === battleState.turnOrder[nextTurn] && u.alive);
    if (nextUnit && !nextUnit.isPlayerControlled) {
      scheduleEnemyTurn(nextTurn);
    }
  }, [battleState, selectedTarget, getCurrentUnit, findNextAliveTurn, checkBattleEnd, addLog, addFloat, scheduleEnemyTurn]);

  const executeEnemyTurn = useCallback((turnIdx) => {
    setBattleState(prev => {
      if (!prev || prev.phase === 'victory' || prev.phase === 'defeat') return prev;
      const units = prev.units.map(u => ({ ...u }));
      const turnOrder = prev.turnOrder;

      const unitId = turnOrder[turnIdx % turnOrder.length];
      const enemy = units.find(u => u.id === unitId && u.alive);
      if (!enemy || enemy.isPlayerControlled) return { ...prev, units, currentTurn: turnIdx };

      enemy.cooldowns = { ...enemy.cooldowns };
      Object.keys(enemy.cooldowns).forEach(k => {
        if (enemy.cooldowns[k] > 0) enemy.cooldowns[k]--;
      });

      const targets = units.filter(u => u.team === 'player' && u.alive);
      if (targets.length === 0) return { ...prev, units, currentTurn: turnIdx };

      const target = targets[Math.floor(Math.random() * targets.length)];
      const usableAbilities = enemy.abilities.filter(a =>
        (!enemy.cooldowns[a.id] || enemy.cooldowns[a.id] <= 0) &&
        (a.manaCost || 0) <= enemy.mana &&
        (a.staminaCost || 0) <= enemy.stamina
      );
      const ability = usableAbilities.length > 0
        ? usableAbilities[Math.floor(Math.random() * usableAbilities.length)]
        : enemy.abilities[0] || { id: 'basic', name: 'Attack', type: 'physical', damage: 1.0 };

      const { dmg, isCrit, evaded } = calcDamage(enemy, target, ability);
      if (evaded) {
        setLog(l => [...l.slice(-50), `${target.name} evaded ${enemy.name}'s ${ability.name}!`]);
        addFloat(target.id, 'EVADE', '#60a5fa');
      } else {
        target.health = Math.max(0, target.health - dmg);
        if (target.health <= 0) target.alive = false;
        setLog(l => [...l.slice(-50), `👹 ${enemy.name} uses ${ability.name} on ${target.name} for ${dmg} damage!${isCrit ? ' CRIT!' : ''}`]);
        addFloat(target.id, `-${dmg}`, '#ef4444');
        if (!target.alive) setLog(l => [...l.slice(-50), `💀 ${target.name} has fallen!`]);
      }

      if (ability.cooldown > 0) {
        enemy.cooldowns[ability.id] = ability.cooldown;
      }
      enemy.mana -= ability.manaCost || 0;
      enemy.stamina -= ability.staminaCost || 0;

      const result = checkBattleEnd(units);
      if (result) {
        setLog(l => [...l.slice(-50), result === 'victory' ? '🎉 VICTORY!' : '💀 DEFEAT...']);
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
  }, [checkBattleEnd, addFloat, findNextAliveTurn, scheduleEnemyTurn]);

  executeEnemyTurnRef.current = executeEnemyTurn;

  useEffect(() => {
    return () => {
      if (enemyTimerRef.current) clearTimeout(enemyTimerRef.current);
    };
  }, []);

  const renderSetup = () => {
    const races = spec.races || [];
    const classes = spec.classes || [];
    const enemies = spec.enemies || [];
    const bosses = spec.bosses || [];
    const allEnemies = [...enemies, ...bosses.map(b => ({ ...b, isBoss: true }))].map((e, i) => ({
      ...e,
      id: e.id || `enemy_${i}`,
    }));

    return (
      <div style={{ padding: '20px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: palette.primary || '#06b6d4', fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>
          Assemble Your Party
        </h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
          Pick up to 4 heroes (race + class combo), then choose enemies to fight
        </p>

        <h3 style={{ color: palette.primary || '#06b6d4', fontSize: '16px', marginBottom: '12px', fontFamily: "'Cinzel', serif" }}>
          Your Heroes ({selectedHeroes.length}/4)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '24px' }}>
          {races.map(race => classes.map(cls => {
            const key = `${race.id}_${cls.id}`;
            const isSelected = selectedHeroes.some(h => `${h.race.id}_${h.cls.id}` === key);
            return (
              <button key={key} onClick={() => {
                if (isSelected) {
                  setSelectedHeroes(prev => prev.filter(h => `${h.race.id}_${h.cls.id}` !== key));
                } else if (selectedHeroes.length < 4) {
                  setSelectedHeroes(prev => [...prev, { race, cls }]);
                }
              }} style={{
                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                background: isSelected ? `rgba(${hexToRgb(race.color || '#06b6d4')}, 0.2)` : 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${isSelected ? (race.color || '#06b6d4') : '#1e293b'}`,
                textAlign: 'left', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconDisplay icon={race.icon} fallback="🔷" size={18} color={race.color} />
                  <IconDisplay icon={cls.icon} fallback="⚔️" size={18} color={cls.color} />
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 700 }}>{race.name}</div>
                    <div style={{ color: cls.color || '#a855f7', fontSize: '11px' }}>{cls.name}</div>
                  </div>
                </div>
              </button>
            );
          })).flat()}
        </div>

        <h3 style={{ color: palette.danger || '#ef4444', fontSize: '16px', marginBottom: '12px', fontFamily: "'Cinzel', serif" }}>
          Enemies ({selectedEnemies.length}/5)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '24px' }}>
          {allEnemies.map((enemy, i) => {
            const isSelected = selectedEnemies.some(e => e.id === enemy.id);
            return (
              <button key={enemy.id || i} onClick={() => {
                if (isSelected) {
                  setSelectedEnemies(prev => prev.filter(e => e.id !== enemy.id));
                } else if (selectedEnemies.length < 5) {
                  setSelectedEnemies(prev => [...prev, enemy]);
                }
              }} style={{
                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${isSelected ? '#ef4444' : '#1e293b'}`,
                textAlign: 'left', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconDisplay icon={enemy.icon} fallback="👹" size={18} color={enemy.isBoss ? '#fbbf24' : '#ef4444'} />
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 700 }}>{enemy.name}</div>
                    <div style={{ color: enemy.isBoss ? '#fbbf24' : '#94a3b8', fontSize: '11px' }}>
                      {enemy.isBoss ? 'BOSS' : `HP: ${enemy.baseHealth || 80}`} | DMG: {enemy.baseDamage || 12}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onBack} style={{
            padding: '12px 28px', borderRadius: '10px', border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '14px',
          }}>Back</button>
          <button
            onClick={startBattle}
            disabled={selectedHeroes.length === 0 || selectedEnemies.length === 0}
            style={{
              padding: '12px 36px', borderRadius: '10px', border: 'none',
              background: selectedHeroes.length > 0 && selectedEnemies.length > 0
                ? `linear-gradient(135deg, ${palette.primary || '#06b6d4'}, ${palette.accent || '#f59e0b'})`
                : '#334155',
              color: selectedHeroes.length > 0 && selectedEnemies.length > 0 ? '#0a0a0f' : '#64748b',
              cursor: selectedHeroes.length > 0 && selectedEnemies.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '15px', fontWeight: 700, fontFamily: "'Cinzel', serif",
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

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${palette.background || '#050a18'}, #0a0a1a)` }}>
        <div style={{
          flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '20px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            background: `radial-gradient(ellipse at 50% 80%, ${palette.primary || '#06b6d4'} 0%, transparent 60%)`,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1 }}>
            {heroes.map(hero => (
              <UnitCard key={hero.id} unit={hero} isActive={hero.id === currentUnitId} palette={palette}
                floats={floatingTexts.filter(f => f.unitId === hero.id)} />
            ))}
          </div>

          <div style={{
            fontSize: '28px', fontWeight: 900, color: palette.accent || '#f59e0b',
            fontFamily: "'Cinzel', serif", textShadow: `0 0 20px ${palette.accent || '#f59e0b'}44`,
          }}>VS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1 }}>
            {enemies.map(enemy => (
              <UnitCard key={enemy.id} unit={enemy} isActive={enemy.id === currentUnitId} palette={palette}
                isTarget={enemy.id === selectedTarget}
                onClick={() => enemy.alive && setSelectedTarget(enemy.id)}
                floats={floatingTexts.filter(f => f.unitId === enemy.id)} />
            ))}
          </div>
        </div>

        <div style={{
          flex: '0 0 auto',
          backgroundImage: 'url(/images/ui/battle-bar-bg.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          padding: '12px 20px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          minHeight: 130,
        }}>
          <div style={{ flex: '0 0 180px' }}>
            {heroes.map(h => (
              <div key={h.id} style={{ marginBottom: '4px', opacity: h.alive ? 1 : 0.4 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: h.id === currentUnitId ? (palette.accent || '#fbbf24') : '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconDisplay icon={h.raceIcon} fallback="🔷" size={14} color={h.raceColor} /> {h.name}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(h.health / h.maxHealth) * 100}%`, background: h.health / h.maxHealth > 0.5 ? '#22c55e' : h.health / h.maxHealth > 0.25 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>{h.health}/{h.maxHealth}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {phase === 'victory' || phase === 'defeat' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700,
                  color: phase === 'victory' ? '#fbbf24' : '#ef4444',
                  textShadow: `0 0 20px ${phase === 'victory' ? '#fbbf2444' : '#ef444444'}`,
                  marginBottom: '8px',
                }}>{phase === 'victory' ? 'Victory!' : 'Defeated...'}</div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => { setPhase('setup'); setBattleState(null); setLog([]); }} style={{
                    padding: '8px 20px', borderRadius: '8px', border: '1px solid #334155',
                    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                  }}>New Battle</button>
                  <button onClick={onBack} style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                    background: palette.primary || '#06b6d4', color: '#0a0a0f', cursor: 'pointer', fontWeight: 700,
                  }}>Back to Preview</button>
                </div>
              </div>
            ) : isPlayerTurn ? (
              <div style={{ width: '100%', maxWidth: 500 }}>
                <div style={{ fontSize: '11px', color: palette.accent || '#fbbf24', fontWeight: 700, textAlign: 'center', marginBottom: '4px', fontFamily: "'Cinzel', serif" }}>
                  {currentUnit?.name}'s Turn
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(currentUnit?.abilities || []).map(ability => {
                    const onCd = (currentUnit?.cooldowns?.[ability.id] || 0) > 0;
                    const noMana = (ability.manaCost || 0) > (currentUnit?.mana || 0);
                    const noStamina = (ability.staminaCost || 0) > (currentUnit?.stamina || 0);
                    const disabled = onCd || noMana || noStamina;
                    return (
                      <button key={ability.id} onClick={() => !disabled && executeAbility(ability)}
                        disabled={disabled}
                        title={ability.description || ability.name}
                        style={{
                          padding: '8px 14px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
                          background: disabled ? 'rgba(30, 41, 59, 0.6)' : `linear-gradient(135deg, rgba(${hexToRgb(palette.primary || '#06b6d4')}, 0.3), rgba(${hexToRgb(palette.secondary || '#a855f7')}, 0.2))`,
                          border: `1px solid ${disabled ? '#1e293b' : (palette.primary || '#06b6d4')}`,
                          color: disabled ? '#475569' : '#e2e8f0',
                          fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                          opacity: disabled ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                        <span style={{ fontSize: '16px' }}>{ability.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div>{ability.name}</div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>
                            {ability.manaCost > 0 && `${ability.manaCost}MP `}
                            {ability.staminaCost > 0 && `${ability.staminaCost}SP `}
                            {onCd && `CD:${currentUnit.cooldowns[ability.id]}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                Enemy turn...
              </div>
            )}
          </div>

          <div style={{
            flex: '0 0 200px', height: '100%', maxHeight: 100,
            overflowY: 'auto', fontSize: '10px', color: '#94a3b8',
            background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '6px',
          }}>
            {log.slice(-10).map((entry, i) => (
              <div key={i} style={{ marginBottom: '2px', lineHeight: 1.3 }}>{entry}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    );
  };

  if (phase === 'setup') return renderSetup();
  return renderBattle();
}

function IconDisplay({ icon, fallback, size = 22, color }) {
  if (!icon || icon === fallback) {
    return <span style={{ fontSize: `${size}px` }}>{fallback}</span>;
  }
  if (icon.includes('/') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.svg') || icon.includes('.webp')) {
    return (
      <div style={{
        width: size + 8, height: size + 8, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color || '#334155'}, ${color || '#1e293b'}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: `${size - 4}px`, fontWeight: 900, color: '#e2e8f0',
        border: `2px solid ${color || '#334155'}`,
        textTransform: 'uppercase', flexShrink: 0,
      }}>
        {(icon.split('/').pop()?.replace(/\.\w+$/, '') || '?')[0]}
      </div>
    );
  }
  return <span style={{ fontSize: `${size}px` }}>{icon}</span>;
}

function UnitCard({ unit, isActive, palette, isTarget, onClick, floats = [] }) {
  const isEnemy = unit.team === 'enemy';
  const hpPct = unit.maxHealth > 0 ? (unit.health / unit.maxHealth) * 100 : 0;
  const hpColor = !unit.alive ? '#555' : hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
  const unitIcon = isEnemy ? (unit.icon || '👹') : (unit.raceIcon || '🔷');
  const unitColor = isEnemy ? (unit.isBoss ? '#fbbf24' : '#ef4444') : (unit.raceColor || '#06b6d4');

  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', borderRadius: '12px',
      background: isTarget ? 'rgba(239, 68, 68, 0.15)' : isActive ? `rgba(${hexToRgb(palette.accent || '#fbbf24')}, 0.1)` : 'rgba(15, 23, 42, 0.7)',
      border: `2px solid ${isTarget ? '#ef4444' : isActive ? (palette.accent || '#fbbf24') : '#1e293b44'}`,
      opacity: unit.alive ? 1 : 0.3,
      cursor: isEnemy && unit.alive ? 'pointer' : 'default',
      transition: 'all 0.3s', position: 'relative',
      minWidth: 140,
      animation: isActive && unit.alive ? 'pulse 2s infinite' : 'none',
    }}>
      {floats.map(f => (
        <div key={f.id} style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          color: f.color, fontSize: '16px', fontWeight: 900, textShadow: '0 0 8px rgba(0,0,0,0.8)',
          animation: 'floatUp 1.2s forwards', pointerEvents: 'none', zIndex: 10,
        }}>{f.text}</div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <IconDisplay icon={unitIcon} fallback={isEnemy ? '👹' : '🔷'} size={22} color={unitColor} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? (palette.accent || '#fbbf24') : '#e2e8f0' }}>{unit.name}</div>
          <div style={{ fontSize: '10px', color: isEnemy ? (unit.isBoss ? '#fbbf24' : '#94a3b8') : (unit.classColor || '#a855f7') }}>
            {isEnemy ? (unit.isBoss ? 'BOSS' : 'Enemy') : unit.className}
          </div>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden', marginBottom: '3px' }}>
        <div style={{ height: '100%', width: `${hpPct}%`, background: hpColor, transition: 'width 0.4s ease', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
        <span>HP: {unit.health}/{unit.maxHealth}</span>
        <span>SPD: {unit.speed}</span>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '100, 100, 100';
}

const battleStyles = document.createElement('style');
battleStyles.textContent = `
@keyframes floatUp {
  0% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
}
`;
if (!document.getElementById('factory-battle-styles')) {
  battleStyles.id = 'factory-battle-styles';
  document.head.appendChild(battleStyles);
}
