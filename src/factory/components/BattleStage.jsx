import { useState, useEffect, useRef, useCallback } from 'react';
import SpriteAnimator, { extractSpriteCollider, hitTestCollider } from './SpriteAnimator';
import { resolveHeroSprite, resolveEnemySprite, VFX_SPRITES, getVfxForAbility, getAttackStyle } from '../data/factoryBattleSprites';
import { buildCoreMotionSprite } from '../data/coreMotionSprites';
import { resolveShipSprite, SHOT_SPRITES, EXPLOSION_SPRITES, preloadShipAssets, getAutoMissileType, calcAutoMissileDamage, calcAutoDefenseChance } from '../data/starboundShipSprites';

const ATTACK_MOVE_MS = 600;
const ATTACK_ANIM_MS = 900;
const HURT_ANIM_MS = 650;
const VFX_DURATION_MS = 900;
const RETURN_MS = 550;
const MISSILE_FLY_MS = 800;

function FrameAnimatedVfx({ sprite, duration }) {
  const [frameIdx, setFrameIdx] = useState(0);
  const frames = sprite.frames;
  const speed = sprite.speed || 80;
  const size = sprite.size || 96;

  useEffect(() => {
    if (!frames || frames.length <= 1) return;
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      if (idx >= frames.length) idx = 0;
      setFrameIdx(idx);
    }, speed);
    return () => clearInterval(iv);
  }, [frames, speed]);

  return (
    <img
      src={frames[frameIdx]}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: 'auto',
        filter: sprite.filter || 'brightness(1.3) drop-shadow(0 0 10px rgba(255,200,50,0.5))',
      }}
    />
  );
}
const AUTO_MISSILE_INTERVAL = 3000;

function lerp(a, b, t) { return a + (b - a) * t; }

export default function BattleStage({
  units,
  currentUnitId,
  gameId,
  palette,
  battleBackground,
  onSelectTarget,
  selectedTarget,
  isPlayerTurn,
  animationEvent,
  onAnimationComplete,
}) {
  const heroes = units.filter(u => u.team === 'player');
  const enemies = units.filter(u => u.team === 'enemy');
  const stageRef = useRef(null);

  const [unitAnims, setUnitAnims] = useState({});
  const [unitPositions, setUnitPositions] = useState({});
  const [vfxList, setVfxList] = useState([]);
  const [damagePopups, setDamagePopups] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState(null);
  const [particles, setParticles] = useState([]);
  const popupIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const [shockwaves, setShockwaves] = useState([]);
  const [afterimages, setAfterimages] = useState([]);
  const spriteImgCache = useRef(new Map());
  const [missiles, setMissiles] = useState([]);
  const [autoMissiles, setAutoMissiles] = useState([]);
  const [shieldFlashes, setShieldFlashes] = useState([]);
  const [shipExplosions, setShipExplosions] = useState([]);
  const [blinkTrails, setBlinkTrails] = useState([]);
  const autoMissileTimerRef = useRef(null);
  const missileIdRef = useRef(0);
  const isSpaceGame = gameId === 'starbound-corsairs';
  const isShadowKnights = gameId === 'shadow-knights';

  useEffect(() => {
    if (isSpaceGame) preloadShipAssets();
  }, [isSpaceGame]);

  const getBasePosition = useCallback((unit, index, total, side) => {
    const stageW = stageRef.current?.offsetWidth || 800;
    const stageH = stageRef.current?.offsetHeight || 400;
    const spacing = Math.min(100, (stageH - 80) / Math.max(total, 1));
    const yStart = (stageH - spacing * (total - 1)) / 2;
    const y = yStart + index * spacing;
    const x = side === 'left' ? stageW * 0.18 : stageW * 0.82;
    return { x, y };
  }, []);

  useEffect(() => {
    const positions = {};
    heroes.forEach((u, i) => {
      positions[u.id] = getBasePosition(u, i, heroes.length, 'left');
    });
    enemies.forEach((u, i) => {
      positions[u.id] = getBasePosition(u, i, enemies.length, 'right');
    });
    setUnitPositions(positions);
  }, [units.length, heroes.length, enemies.length, getBasePosition]);

  const triggerScreenShake = useCallback((intensity = 'normal') => {
    setScreenShake(intensity);
    setTimeout(() => setScreenShake(false), intensity === 'heavy' ? 400 : 250);
  }, []);

  const triggerScreenFlash = useCallback((color, duration = 200) => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), duration);
  }, []);

  const spawnParticles = useCallback((x, y, type = 'hit', count = 8) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const id = ++particleIdRef.current;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 60;
      const size = type === 'heal' ? 4 + Math.random() * 4 : 2 + Math.random() * 4;
      const lifetime = 600 + Math.random() * 400;
      const color = type === 'hit' ? ['#fff', '#fbbf24', '#ef4444', '#f97316'][Math.floor(Math.random() * 4)]
        : type === 'heal' ? ['#22c55e', '#86efac', '#4ade80', '#bbf7d0'][Math.floor(Math.random() * 4)]
        : type === 'magic' ? ['#a855f7', '#c084fc', '#818cf8', '#e879f9'][Math.floor(Math.random() * 4)]
        : type === 'crit' ? ['#fbbf24', '#fde68a', '#fff', '#f59e0b'][Math.floor(Math.random() * 4)]
        : '#fff';
      newParticles.push({
        id, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
        size, color, lifetime, born: Date.now(), type,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      const ids = new Set(newParticles.map(p => p.id));
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 1200);
  }, []);

  const spawnShockwave = useCallback((x, y, isCrit = false) => {
    const id = ++popupIdRef.current;
    const duration = isCrit ? 800 : 600;
    const maxRadius = isCrit ? 80 : 50;
    const color = isCrit ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 255, 255, 0.4)';
    setShockwaves(prev => [...prev, { id, x, y, duration, maxRadius, color, born: Date.now() }]);
    setTimeout(() => setShockwaves(prev => prev.filter(s => s.id !== id)), duration);
  }, []);

  const spawnAfterimage = useCallback((x, y, side, color = '#06b6d4') => {
    const id = ++popupIdRef.current;
    setAfterimages(prev => [...prev, { id, x, y, side, color, born: Date.now() }]);
    setTimeout(() => setAfterimages(prev => prev.filter(a => a.id !== id)), 500);
  }, []);

  const spawnBlinkTrail = useCallback((fromX, fromY, toX, toY, color = '#a855f7', count = 5) => {
    const trails = [];
    for (let i = 0; i < count; i++) {
      const id = ++popupIdRef.current;
      const t = i / count;
      const x = lerp(fromX, toX, t);
      const y = lerp(fromY, toY, t);
      const jitterX = (Math.random() - 0.5) * 20;
      const jitterY = (Math.random() - 0.5) * 15;
      trails.push({ id, x: x + jitterX, y: y + jitterY, color, born: Date.now(), delay: i * 40 });
    }
    setBlinkTrails(prev => [...prev, ...trails]);
    const ids = new Set(trails.map(t => t.id));
    setTimeout(() => setBlinkTrails(prev => prev.filter(t => !ids.has(t.id))), 800);
  }, []);

  const spawnMissile = useCallback((fromX, fromY, toX, toY, type = 'plasma', onImpact) => {
    const id = ++missileIdRef.current;
    const shotData = SHOT_SPRITES[type] || SHOT_SPRITES.plasma;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    setMissiles(prev => [...prev, {
      id, fromX, fromY, toX, toY, angle,
      shotType: type,
      frames: shotData.frames,
      impactFrames: shotData.impact,
      color: shotData.color,
      born: Date.now(),
      duration: MISSILE_FLY_MS,
      impacting: false,
    }]);
    setTimeout(() => {
      setMissiles(prev => prev.map(m => m.id === id ? { ...m, impacting: true } : m));
      spawnParticles(toX, toY, 'crit', 12);
      triggerScreenShake('normal');
      onImpact?.();
      setTimeout(() => setMissiles(prev => prev.filter(m => m.id !== id)), 500);
    }, MISSILE_FLY_MS);
  }, [spawnParticles, triggerScreenShake]);

  const spawnShieldFlash = useCallback((x, y) => {
    const id = ++missileIdRef.current;
    setShieldFlashes(prev => [...prev, { id, x, y, born: Date.now() }]);
    setTimeout(() => setShieldFlashes(prev => prev.filter(s => s.id !== id)), 600);
  }, []);

  const spawnShipExplosion = useCallback((x, y, size = 'small') => {
    const id = ++missileIdRef.current;
    const frames = EXPLOSION_SPRITES[size] || EXPLOSION_SPRITES.small;
    setShipExplosions(prev => [...prev, { id, x, y, frames, born: Date.now(), frameIndex: 0 }]);
    const interval = setInterval(() => {
      setShipExplosions(prev => prev.map(e => {
        if (e.id !== id) return e;
        const next = e.frameIndex + 1;
        if (next >= e.frames.length) { clearInterval(interval); return null; }
        return { ...e, frameIndex: next };
      }).filter(Boolean));
    }, 80);
    setTimeout(() => { clearInterval(interval); setShipExplosions(prev => prev.filter(e => e.id !== id)); }, frames.length * 80 + 200);
  }, []);

  useEffect(() => {
    if (!isSpaceGame || !units || units.length === 0) return;
    if (autoMissileTimerRef.current) clearInterval(autoMissileTimerRef.current);

    autoMissileTimerRef.current = setInterval(() => {
      const aliveUnits = units.filter(u => u.alive);
      const heroes = aliveUnits.filter(u => u.team === 'player');
      const enemies = aliveUnits.filter(u => u.team === 'enemy');
      if (heroes.length === 0 || enemies.length === 0) return;

      const shooter = aliveUnits[Math.floor(Math.random() * aliveUnits.length)];
      const targets = shooter.team === 'player' ? enemies : heroes;
      const target = targets[Math.floor(Math.random() * targets.length)];
      if (!shooter || !target) return;

      const shooterPos = unitPositions[shooter.id];
      const targetPos = unitPositions[target.id];
      if (!shooterPos || !targetPos) return;

      const defenseChance = calcAutoDefenseChance(target);
      const defended = Math.random() * 100 < defenseChance;
      const missileType = getAutoMissileType(shooter);

      const midX = (shooterPos.x + targetPos.x) / 2;
      const midY = Math.min(shooterPos.y, targetPos.y) - 30;

      const amId = ++missileIdRef.current;
      setAutoMissiles(prev => [...prev, {
        id: amId,
        fromX: shooterPos.x, fromY: shooterPos.y,
        toX: defended ? midX : targetPos.x,
        toY: defended ? midY : targetPos.y,
        type: missileType,
        color: SHOT_SPRITES[missileType]?.color || '#22d3ee',
        born: Date.now(),
        defended,
        targetId: target.id,
      }]);

      setTimeout(() => {
        if (defended) {
          spawnShieldFlash(targetPos.x, targetPos.y);
          spawnParticles(midX, midY, 'magic', 6);
        } else {
          spawnParticles(targetPos.x, targetPos.y, 'hit', 8);
        }
        setTimeout(() => setAutoMissiles(prev => prev.filter(m => m.id !== amId)), 300);
      }, MISSILE_FLY_MS * 0.7);
    }, AUTO_MISSILE_INTERVAL);

    return () => { if (autoMissileTimerRef.current) clearInterval(autoMissileTimerRef.current); };
  }, [isSpaceGame, units, unitPositions, spawnParticles, spawnShieldFlash]);

  const addDamagePopup = useCallback((unitId, text, color, isCrit = false) => {
    const id = ++popupIdRef.current;
    const pos = unitPositions[unitId];
    if (!pos) return;
    setDamagePopups(prev => [...prev, { id, x: pos.x, y: pos.y - 50, text, color, isCrit }]);
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== id));
    }, 1400);
  }, [unitPositions]);

  useEffect(() => {
    if (!animationEvent) return;

    const { type, attackerId, targetId, targets, damage, ability, isCrit, isEvade, isHeal, effectName, text } = animationEvent;

    if (type === 'attack') {
      const attackerPos = unitPositions[attackerId];
      const targetPos = unitPositions[targetId || targets?.[0]?.id];
      if (!attackerPos || !targetPos) {
        onAnimationComplete?.();
        return;
      }

      if (isSpaceGame) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'attack1' }));
        const hitTargets = targets || [{ id: targetId, damage, isCrit, isEvade }];
        const attacker = units.find(u => u.id === attackerId);
        const missileType = attacker ? getAutoMissileType(attacker) : 'plasma';

        hitTargets.forEach((t, i) => {
          const tPos = unitPositions[t.id];
          if (!tPos) return;
          setTimeout(() => {
            spawnMissile(attackerPos.x, attackerPos.y, tPos.x, tPos.y, missileType, () => {
              if (!t.isEvade) {
                setUnitAnims(prev => ({ ...prev, [t.id]: 'hurt' }));
                spawnShipExplosion(tPos.x, tPos.y, t.isCrit ? 'big' : 'small');
                spawnParticles(tPos.x, tPos.y, t.isCrit ? 'crit' : 'hit', t.isCrit ? 20 : 10);
                spawnShockwave(tPos.x, tPos.y, t.isCrit);
                if (t.isCrit) {
                  triggerScreenFlash('rgba(251, 191, 36, 0.2)', 350);
                  triggerScreenShake('heavy');
                } else {
                  triggerScreenShake('normal');
                }
              } else {
                spawnShieldFlash(tPos.x, tPos.y);
              }
              const dmgText = t.isEvade ? 'DEFLECTED' : t.isCrit ? `${t.damage}!` : `${t.damage}`;
              const dmgColor = t.isEvade ? '#60a5fa' : t.isCrit ? '#fbbf24' : '#ef4444';
              addDamagePopup(t.id, dmgText, dmgColor, t.isCrit);
              setTimeout(() => setUnitAnims(prev => ({ ...prev, [t.id]: 'idle' })), HURT_ANIM_MS);
            });
          }, i * 200);
        });

        setTimeout(() => {
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
          onAnimationComplete?.();
        }, MISSILE_FLY_MS + hitTargets.length * 200 + HURT_ANIM_MS + 200);
      } else {
      const attacker = units.find(u => u.id === attackerId);
      const atkStyle = isShadowKnights ? getAttackStyle(attacker?.classId, gameId) : 'melee';
      const vfxType = getVfxForAbility(ability, gameId);
      const hitTargets = targets || [{ id: targetId, damage, isCrit, isEvade }];
      const aSide = attackerPos.x < targetPos.x ? 'left' : 'right';

      const applyHits = (resolve) => {
        triggerScreenShake(hitTargets.some(ht => ht.isCrit) ? 'heavy' : 'normal');
        hitTargets.forEach(ht => {
          const tPos = unitPositions[ht.id];
          if (!tPos) return;
          if (!ht.isEvade) {
            setUnitAnims(prev => ({ ...prev, [ht.id]: 'hurt' }));
            const vfxId = ++popupIdRef.current;
            setVfxList(prev => [...prev, { id: vfxId, type: vfxType, x: tPos.x, y: tPos.y }]);
            setTimeout(() => setVfxList(prev => prev.filter(v => v.id !== vfxId)), VFX_DURATION_MS);
            spawnParticles(tPos.x, tPos.y, ht.isCrit ? 'crit' : 'hit', ht.isCrit ? 20 : 10);
            spawnShockwave(tPos.x, tPos.y, ht.isCrit);
            if (ht.isCrit) {
              triggerScreenFlash(atkStyle === 'blink' ? 'rgba(168,85,247,0.3)' : 'rgba(251,191,36,0.2)', 350);
              spawnParticles(tPos.x, tPos.y, 'magic', 8);
            } else {
              triggerScreenFlash('rgba(255,255,255,0.06)', 150);
            }
          }
          const dmgText = ht.isEvade ? 'MISS' : ht.isCrit ? `${ht.damage}!` : `${ht.damage}`;
          const dmgColor = ht.isEvade ? '#60a5fa' : ht.isCrit ? '#fbbf24' : '#ef4444';
          addDamagePopup(ht.id, dmgText, dmgColor, ht.isCrit);
          setTimeout(() => setUnitAnims(prev => ({ ...prev, [ht.id]: 'idle' })), HURT_ANIM_MS);
        });
        setTimeout(resolve, HURT_ANIM_MS + 120);
      };

      if (atkStyle === 'blink') {
        spawnBlinkTrail(attackerPos.x, attackerPos.y, targetPos.x, targetPos.y, '#a855f7', 6);
        triggerScreenFlash('rgba(168,85,247,0.15)', 200);
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'walk' }));
        setTimeout(() => {
          const behindX = targetPos.x + (attackerPos.x < targetPos.x ? 60 : -60);
          setUnitPositions(prev => ({ ...prev, [attackerId]: { x: behindX, y: targetPos.y } }));
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'attack1' }));
          spawnBlinkTrail(targetPos.x, targetPos.y, behindX, targetPos.y, '#c084fc', 4);
          setTimeout(() => applyHits(() => {
            spawnBlinkTrail(behindX, targetPos.y, attackerPos.x, attackerPos.y, '#a855f7', 5);
            setUnitPositions(prev => ({ ...prev, [attackerId]: attackerPos }));
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
            setTimeout(() => onAnimationComplete?.(), 200);
          }), 180);
        }, 250);

      } else if (atkStyle === 'cast') {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'cast' }));
        spawnParticles(attackerPos.x, attackerPos.y, 'magic', 6);
        triggerScreenFlash('rgba(168,85,247,0.08)', 300);
        setTimeout(() => {
          applyHits(() => {
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
            setTimeout(() => onAnimationComplete?.(), 200);
          });
        }, ATTACK_ANIM_MS * 0.5);

      } else if (atkStyle === 'dash') {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'walk' }));
        const dashX = lerp(attackerPos.x, targetPos.x, 0.75);
        const dashY = lerp(attackerPos.y, targetPos.y, 0.5);
        for (let ai = 0; ai < 5; ai++) {
          setTimeout(() => {
            const dt = (ai + 1) / 6;
            spawnAfterimage(lerp(attackerPos.x, dashX, dt), lerp(attackerPos.y, dashY, dt), aSide, '#f59e0b');
          }, ai * 60);
        }
        setUnitPositions(prev => ({ ...prev, [attackerId]: { x: dashX, y: dashY } }));
        setTimeout(() => {
          setUnitAnims(prev => ({ ...prev, [attackerId]: 'attack1' }));
          triggerScreenFlash('rgba(245,158,11,0.12)', 150);
          setTimeout(() => applyHits(() => {
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'walk' }));
            setUnitPositions(prev => ({ ...prev, [attackerId]: attackerPos }));
            setTimeout(() => {
              setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
              onAnimationComplete?.();
            }, RETURN_MS);
          }), 180);
        }, 350);

      } else {
      setUnitAnims(prev => ({ ...prev, [attackerId]: 'walk' }));
      const midX = lerp(attackerPos.x, targetPos.x, 0.55);
      const midY = lerp(attackerPos.y, targetPos.y, 0.3);
      setUnitPositions(prev => ({
        ...prev,
        [attackerId]: { x: midX, y: midY },
      }));

      for (let ai = 0; ai < 3; ai++) {
        setTimeout(() => {
          const t = (ai + 1) / 4;
          spawnAfterimage(
            lerp(attackerPos.x, midX, t),
            lerp(attackerPos.y, midY, t),
            aSide,
            palette?.primary || '#06b6d4'
          );
        }, ai * 100);
      }

      setTimeout(() => {
        setUnitAnims(prev => ({ ...prev, [attackerId]: ability?.type === 'magical' || ability?.type === 'magic' ? 'cast' : 'attack1' }));

        setTimeout(() => {
          applyHits(() => {
            setUnitAnims(prev => ({ ...prev, [attackerId]: 'walk' }));
            setUnitPositions(prev => ({ ...prev, [attackerId]: attackerPos }));
            setTimeout(() => {
              setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
              onAnimationComplete?.();
            }, RETURN_MS);
          });
        }, ATTACK_ANIM_MS * 0.4);
      }, ATTACK_MOVE_MS);
      }
      }
    } else if (type === 'heal' || type === 'buff') {
      const tId = targetId || attackerId;
      const tPos = unitPositions[tId];
      if (tPos) {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'cast' }));
        const vfxId = ++popupIdRef.current;
        const vfxType = isHeal ? 'heal' : 'shield';
        setVfxList(prev => [...prev, { id: vfxId, type: vfxType, x: tPos.x, y: tPos.y }]);
        setTimeout(() => setVfxList(prev => prev.filter(v => v.id !== vfxId)), VFX_DURATION_MS);
        addDamagePopup(tId, text || `+${damage || 0}`, '#22c55e');
        spawnParticles(tPos.x, tPos.y, 'heal', 12);
        triggerScreenFlash('rgba(34, 197, 94, 0.08)', 400);
      }
      setTimeout(() => {
        setUnitAnims(prev => ({ ...prev, [attackerId]: 'idle' }));
        onAnimationComplete?.();
      }, ATTACK_ANIM_MS);
    } else if (type === 'dot_tick') {
      addDamagePopup(targetId, `${damage}`, '#a855f7');
      const tPos = unitPositions[targetId];
      if (tPos) {
        const vfxId = ++popupIdRef.current;
        setVfxList(prev => [...prev, { id: vfxId, type: effectName === 'burn' ? 'fire' : effectName === 'poison' ? 'poison' : 'slash', x: tPos.x, y: tPos.y }]);
        setTimeout(() => setVfxList(prev => prev.filter(v => v.id !== vfxId)), VFX_DURATION_MS);
        spawnParticles(tPos.x, tPos.y, 'magic', 6);
      }
      setTimeout(() => onAnimationComplete?.(), 500);
    } else if (type === 'death') {
      setUnitAnims(prev => ({ ...prev, [targetId]: 'death' }));
      const tPos = unitPositions[targetId];
      if (tPos) {
        if (isSpaceGame) {
          spawnShipExplosion(tPos.x, tPos.y, 'big');
          spawnParticles(tPos.x, tPos.y, 'crit', 20);
          triggerScreenShake('heavy');
          triggerScreenFlash('rgba(255, 200, 50, 0.15)', 400);
        } else {
          spawnParticles(tPos.x, tPos.y, 'hit', 12);
        }
      }
      setTimeout(() => onAnimationComplete?.(), 800);
    } else if (type === 'status') {
      addDamagePopup(targetId, text || effectName || 'STATUS', '#60a5fa');
      setTimeout(() => onAnimationComplete?.(), 400);
    } else {
      onAnimationComplete?.();
    }
  }, [animationEvent]);

  const renderShip = (unit, index, total, side) => {
    const pos = unitPositions[unit.id];
    if (!pos) return null;

    const isEnemy = side === 'right';
    const shipSprite = resolveShipSprite(unit);
    const anim = unitAnims[unit.id] || 'idle';
    const isActive = unit.id === currentUnitId;
    const isTargeted = unit.id === selectedTarget;
    const maxStageSize = 220;
    const configW = shipSprite.width || 128;
    const configH = shipSprite.height || 128;
    const shipW = Math.min(configW, maxStageSize);
    const shipH = Math.min(configH, maxStageSize);
    const bobOffset = unit.alive && anim === 'idle' ? Math.sin(Date.now() / 1200 + index * 1.8) * 4 : 0;
    const hurtShake = anim === 'hurt' ? Math.sin(Date.now() / 30) * 5 : 0;
    const deathScale = anim === 'death' ? 0.3 : 1;
    const deathOpacity = anim === 'death' ? 0.2 : 1;

    if (!unit.alive && anim !== 'death') return null;

    const hpPct = unit.maxHealth > 0 ? unit.health / unit.maxHealth : 0;
    const hpColor = hpPct > 0.6 ? '#22c55e' : hpPct > 0.3 ? '#f59e0b' : '#ef4444';
    const shieldColor = palette?.primary || '#22d3ee';
    const shipImage = hpPct < 0.4 && shipSprite.damaged
      ? shipSprite.damaged[0]
      : shipSprite.image;

    return (
      <div
        key={unit.id}
        onClick={() => { if (isEnemy && unit.alive) onSelectTarget?.(unit.id); }}
        style={{
          position: 'absolute',
          left: pos.x - shipW / 2 + hurtShake,
          top: pos.y - shipH / 2 + bobOffset,
          width: shipW,
          height: shipH,
          cursor: isEnemy && unit.alive ? 'pointer' : 'default',
          zIndex: isActive ? 10 : 5,
          transition: 'transform 0.3s ease, opacity 0.5s ease',
          transform: `scale(${deathScale})`,
          opacity: deathOpacity,
        }}
      >
        {unit.alive && (
          <div style={{
            position: 'absolute',
            left: isEnemy ? shipW * 0.7 : -shipW * 0.3,
            top: '30%', width: shipW * 0.4, height: shipH * 0.4,
            background: `radial-gradient(ellipse, ${shieldColor}40 0%, ${shieldColor}15 40%, transparent 70%)`,
            filter: 'blur(3px)',
            animation: 'ambientGlow 2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}

        <img
          src={shipImage}
          alt={unit.name}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            transform: isEnemy ? 'scaleX(-1)' : 'none',
            filter: [
              shipSprite.filter || '',
              anim === 'hurt' ? 'brightness(2) saturate(0.5)' : '',
              !unit.alive ? 'grayscale(1) brightness(0.3)' : '',
              anim === 'attack1' ? 'brightness(1.3) drop-shadow(0 0 8px rgba(255,200,50,0.5))' : '',
            ].filter(Boolean).join(' ') || undefined,
            transition: 'filter 0.15s ease',
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {isActive && unit.alive && (
          <div style={{
            position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: `8px solid ${palette?.accent || '#fbbf24'}`,
            animation: 'indicatorBounce 1s ease infinite',
            filter: `drop-shadow(0 0 6px ${palette?.accent || '#fbbf24'})`,
          }} />
        )}

        {isTargeted && unit.alive && (
          <div style={{
            position: 'absolute', inset: -4,
            border: '2px solid #ef4444',
            borderRadius: '50%',
            animation: 'targetPulse 1s ease infinite',
            pointerEvents: 'none',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
          }} />
        )}

        <div style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '9px', fontWeight: 700,
            color: isActive ? (palette?.accent || '#fbbf24') : '#e2e8f0',
            textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            marginBottom: '2px', letterSpacing: '0.5px',
          }}>{unit.name}</div>
          <div style={{
            height: 4, width: 56, background: 'rgba(0,0,0,0.8)',
            borderRadius: 2, overflow: 'hidden', margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{
              height: '100%', width: `${hpPct * 100}%`,
              background: `linear-gradient(180deg, ${hpColor}, ${hpColor}cc)`,
              transition: 'width 0.4s ease', borderRadius: 2,
              boxShadow: `0 0 4px ${hpColor}44`,
            }} />
          </div>
          {hpPct < 1 && hpPct > 0 && (
            <div style={{
              height: 3, width: 56, background: 'rgba(0,0,0,0.6)',
              borderRadius: 2, overflow: 'hidden', margin: '1px auto 0',
              border: '1px solid rgba(34,211,238,0.15)',
            }}>
              <div style={{
                height: '100%', width: `${Math.min(100, calcAutoDefenseChance(unit) * 1.6)}%`,
                background: 'linear-gradient(180deg, #22d3ee, #0891b2)',
                borderRadius: 2,
              }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUnit = (unit, index, total, side) => {
    if (isSpaceGame) return renderShip(unit, index, total, side);

    const pos = unitPositions[unit.id];
    if (!pos) return null;

    const isEnemy = side === 'right';
    const resolved = isEnemy
      ? resolveEnemySprite(gameId, unit)
      : resolveHeroSprite(gameId, unit.classId || unit.className);
    const spriteData = resolved || buildCoreMotionSprite(unit.classId || unit.className || unit.name || 'default');
    const anim = unitAnims[unit.id] || 'idle';
    const isActive = unit.id === currentUnitId;
    const isTargeted = unit.id === selectedTarget;
    const fw = spriteData?.frameWidth || 128;
    const fh = spriteData?.frameHeight || 128;
    const maxDim = unit.isBoss ? 120 : 80;
    const sc = Math.min(maxDim / fw, maxDim / fh, 1.5);
    const bobOffset = unit.alive && anim === 'idle' ? Math.sin(Date.now() / 800 + index * 1.5) * 3 : 0;

    if (!unit.alive && anim !== 'death') return null;

    const hpPct = unit.maxHealth > 0 ? unit.health / unit.maxHealth : 0;
    const hpColor = hpPct > 0.6 ? '#22c55e' : hpPct > 0.3 ? '#f59e0b' : '#ef4444';

    return (
      <div
        key={unit.id}
        onClick={(e) => {
          if (!isEnemy || !unit.alive) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const cacheKey = spriteData?.idle?.src || unit.classId || unit.id;
          const cachedImg = spriteImgCache.current.get(cacheKey);
          if (cachedImg) {
            const collider = extractSpriteCollider(cachedImg, fw, fh, 0);
            if (!hitTestCollider(collider, clickX, clickY, 0, 0, fw * sc, fh * sc)) {
              return;
            }
          }
          onSelectTarget?.(unit.id);
        }}
        style={{
          position: 'absolute',
          left: pos.x - (fw * sc) / 2,
          top: pos.y - (fh * sc) / 2 + bobOffset,
          transition: anim === 'walk'
            ? `left ${ATTACK_MOVE_MS}ms ease-in-out, top ${ATTACK_MOVE_MS}ms ease-in-out, filter 0.2s ease`
            : `left ${RETURN_MS}ms ease-out, top ${RETURN_MS}ms ease-out, filter 0.2s ease`,
          cursor: isEnemy && unit.alive ? 'pointer' : 'default',
          zIndex: isActive ? 10 : 5,
          filter: !unit.alive ? 'grayscale(1) opacity(0.3)' : undefined,
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: fw * sc * 0.7,
          height: 8,
          background: `radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
          opacity: unit.alive ? 0.8 : 0.2,
        }} />

        {isActive && unit.alive && (
          <div style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: `10px solid ${palette?.accent || '#fbbf24'}`,
            animation: 'indicatorBounce 1s ease infinite',
            filter: `drop-shadow(0 0 6px ${palette?.accent || '#fbbf24'})`,
          }} />
        )}

        {isTargeted && unit.alive && (
          <>
            <div style={{
              position: 'absolute', inset: -6,
              border: `2px solid #ef4444`,
              borderRadius: '10px',
              animation: 'targetPulse 1s ease infinite',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', inset: -6,
              borderRadius: '10px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
              animation: 'targetPulse 1s ease infinite',
              pointerEvents: 'none',
            }} />
          </>
        )}

        <SpriteAnimator
          spriteData={spriteData}
          animation={spriteData?.[anim] ? anim : (anim.startsWith('attack') ? 'attack1' : 'idle')}
          flipX={isEnemy ? !(spriteData?.facesLeft) : !!(spriteData?.facesLeft)}
          scale={sc}
          opacity={unit.alive ? 1 : 0.3}
          onImageLoad={(img) => {
            const cacheKey = spriteData?.idle?.src || unit.classId || unit.id;
            spriteImgCache.current.set(cacheKey, img);
          }}
        />

        <div style={{
          position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 700,
            color: isActive ? (palette?.accent || '#fbbf24') : '#e2e8f0',
            textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6)',
            marginBottom: '3px',
            letterSpacing: '0.5px',
          }}>{unit.name}</div>
          <div style={{
            height: 5, width: 64, background: 'rgba(0,0,0,0.8)',
            borderRadius: 3, overflow: 'hidden', margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              height: '100%',
              width: `${hpPct * 100}%`,
              background: `linear-gradient(180deg, ${hpColor}, ${hpColor}cc)`,
              transition: 'width 0.4s ease',
              borderRadius: 3,
              boxShadow: `0 0 6px ${hpColor}44`,
            }} />
          </div>
        </div>
      </div>
    );
  };

  const shakeStyle = screenShake ? {
    animation: screenShake === 'heavy' ? 'heavyShake 0.4s ease' : 'lightShake 0.25s ease',
  } : {};

  return (
    <div ref={stageRef} style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      ...shakeStyle,
    }}>
      <style>{`
        @keyframes indicatorBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes targetPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes spriteShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes dmgPopup {
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.8); }
          15% { transform: translate(-50%, -10px) scale(1.4); }
          30% { transform: translate(-50%, -20px) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -60px) scale(0.7); }
        }
        @keyframes critPopup {
          0% { opacity: 1; transform: translate(-50%, 0) scale(0.5); }
          10% { transform: translate(-50%, -5px) scale(1.8); }
          25% { transform: translate(-50%, -15px) scale(1.3); }
          100% { opacity: 0; transform: translate(-50%, -70px) scale(0.6); }
        }
        @keyframes vfxPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(-10deg); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.3) rotate(5deg); }
          60% { opacity: 0.9; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(-5deg); }
        }
        @keyframes lightShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, 1px); }
          80% { transform: translate(2px, -1px); }
        }
        @keyframes heavyShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-6px, 3px); }
          20% { transform: translate(5px, -4px); }
          30% { transform: translate(-7px, 2px); }
          40% { transform: translate(4px, -3px); }
          50% { transform: translate(-3px, 5px); }
          60% { transform: translate(6px, -2px); }
          70% { transform: translate(-4px, 3px); }
          80% { transform: translate(3px, -4px); }
          90% { transform: translate(-2px, 1px); }
        }
        @keyframes screenFlashAnim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes particleFade {
          0% { opacity: 1; }
          70% { opacity: 0.8; }
          100% { opacity: 0; transform: scale(0.3); }
        }
        @keyframes dustFloat {
          0% { opacity: 0; transform: translateY(0); }
          30% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-40px); }
        }
        @keyframes ambientGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes shockwaveExpand {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          50% { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes afterimageFade {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.7); }
        }
        @keyframes impactRing {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; border-width: 3px; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 1px; }
        }
        @keyframes missileTrail {
          0% { opacity: 0.8; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0.3); }
        }
        @keyframes shieldDeflect {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          50% { opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes starDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {battleBackground && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${battleBackground})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.5, filter: 'blur(0.3px) saturate(1.2)',
        }} />
      )}

      <div style={{
        position: 'absolute', inset: 0,
        background: battleBackground
          ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.5) 100%)'
          : `radial-gradient(ellipse at 50% 80%, ${palette?.primary || '#06b6d4'}18 0%, transparent 60%)`,
      }} />

      {!battleBackground && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 20% 30%, ${palette?.primary || '#06b6d4'}08 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, ${palette?.secondary || '#a855f7'}06 0%, transparent 40%)`,
          animation: 'ambientGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.5))',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', bottom: '25%', left: '5%', right: '5%', height: '2px',
        background: `linear-gradient(90deg, transparent 5%, ${palette?.primary || '#06b6d4'}15 20%, ${palette?.primary || '#06b6d4'}08 50%, ${palette?.primary || '#06b6d4'}15 80%, transparent 95%)`,
        pointerEvents: 'none',
        opacity: 0.5,
      }} />

      {heroes.map((u, i) => renderUnit(u, i, heroes.length, 'left'))}
      {enemies.map((u, i) => renderUnit(u, i, enemies.length, 'right'))}

      {shockwaves.map(sw => (
        <div key={sw.id} style={{
          position: 'absolute', left: sw.x, top: sw.y,
          width: sw.maxRadius * 2, height: sw.maxRadius * 2,
          border: `2px solid ${sw.color}`,
          borderRadius: '50%',
          animation: `shockwaveExpand ${sw.duration}ms ease-out forwards`,
          pointerEvents: 'none', zIndex: 18,
          boxShadow: `0 0 12px ${sw.color}, inset 0 0 8px ${sw.color}`,
        }} />
      ))}

      {afterimages.map(ai => (
        <div key={ai.id} style={{
          position: 'absolute', left: ai.x - 20, top: ai.y - 30,
          width: 40, height: 60,
          background: `radial-gradient(ellipse, ${ai.color}55 0%, transparent 70%)`,
          borderRadius: '40%',
          animation: 'afterimageFade 500ms ease-out forwards',
          pointerEvents: 'none', zIndex: 4,
          filter: 'blur(3px)',
        }} />
      ))}

      {missiles.map(m => {
        const age = Date.now() - m.born;
        const t = Math.min(age / m.duration, 1);
        const cx = lerp(m.fromX, m.toX, t);
        const cy = lerp(m.fromY, m.toY, t);
        const frameIdx = Math.floor(age / 80) % (m.frames?.length || 1);
        const angleDeg = (m.angle * 180) / Math.PI;
        return (
          <div key={`missile-${m.id}`} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 22 }}>
            {!m.impacting && (
              <>
                <img
                  src={m.frames?.[frameIdx]}
                  alt=""
                  style={{
                    position: 'absolute',
                    left: cx - 24, top: cy - 24,
                    width: 48, height: 48,
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    transform: `rotate(${angleDeg}deg)`,
                    filter: `brightness(1.4) drop-shadow(0 0 8px ${m.color})`,
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: cx - 3, top: cy - 3,
                  width: 6, height: 6,
                  background: m.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 12px ${m.color}, 0 0 24px ${m.color}88`,
                  filter: 'blur(1px)',
                }} />
              </>
            )}
            {m.impacting && m.impactFrames && (
              <img
                src={m.impactFrames[Math.min(Math.floor((Date.now() - m.born - m.duration) / 80), m.impactFrames.length - 1)]}
                alt=""
                style={{
                  position: 'absolute',
                  left: m.toX - 32, top: m.toY - 32,
                  width: 64, height: 64,
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                  filter: `brightness(1.5) drop-shadow(0 0 12px ${m.color})`,
                }}
              />
            )}
          </div>
        );
      })}

      {autoMissiles.map(am => {
        const age = Date.now() - am.born;
        const flyT = Math.min(age / (MISSILE_FLY_MS * 0.7), 1);
        const cx = lerp(am.fromX, am.toX, flyT);
        const cy = lerp(am.fromY, am.toY, flyT);
        const angle = Math.atan2(am.toY - am.fromY, am.toX - am.fromX);
        return (
          <div key={`auto-${am.id}`} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 16 }}>
            <div style={{
              position: 'absolute',
              left: cx - 4, top: cy - 4,
              width: 8, height: 8,
              background: am.color,
              borderRadius: '50%',
              boxShadow: `0 0 8px ${am.color}, 0 0 16px ${am.color}66`,
              opacity: flyT >= 1 ? 0 : 0.7,
              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
            }} />
            <div style={{
              position: 'absolute',
              left: cx - 20, top: cy - 1,
              width: 20, height: 2,
              background: `linear-gradient(90deg, transparent, ${am.color}88)`,
              transform: `rotate(${(angle * 180) / Math.PI}deg)`,
              transformOrigin: 'right center',
              opacity: flyT >= 1 ? 0 : 0.5,
            }} />
          </div>
        );
      })}

      {shieldFlashes.map(sf => {
        const age = Date.now() - sf.born;
        const t = age / 600;
        return (
          <div key={`shield-${sf.id}`} style={{
            position: 'absolute',
            left: sf.x - 40, top: sf.y - 40,
            width: 80, height: 80,
            border: '2px solid rgba(34, 211, 238, 0.6)',
            borderRadius: '50%',
            pointerEvents: 'none', zIndex: 18,
            opacity: 1 - t,
            transform: `scale(${0.5 + t * 0.8})`,
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.3), inset 0 0 15px rgba(34, 211, 238, 0.15)',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
          }} />
        );
      })}

      {shipExplosions.map(ex => (
        <img
          key={`shipex-${ex.id}`}
          src={ex.frames[ex.frameIndex]}
          alt=""
          style={{
            position: 'absolute',
            left: ex.x - 64, top: ex.y - 64,
            width: 128, height: 128,
            objectFit: 'contain',
            imageRendering: 'pixelated',
            pointerEvents: 'none', zIndex: 21,
            filter: 'brightness(1.4) drop-shadow(0 0 16px rgba(255, 150, 50, 0.6))',
          }}
        />
      ))}

      {vfxList.map(vfx => {
        const sprite = VFX_SPRITES[vfx.type];
        return (
          <div key={vfx.id} style={{
            position: 'absolute',
            left: vfx.x, top: vfx.y,
            transform: 'translate(-50%, -50%)',
            animation: `vfxPop ${VFX_DURATION_MS}ms ease forwards`,
            pointerEvents: 'none', zIndex: 20,
          }}>
            {sprite?.type === 'frames' ? (
              <FrameAnimatedVfx sprite={sprite} duration={VFX_DURATION_MS} />
            ) : sprite?.src ? (
              <img src={sprite.src} alt="" style={{
                width: 96, height: 96, objectFit: 'contain',
                filter: 'brightness(1.4) drop-shadow(0 0 12px rgba(255,200,50,0.6))',
              }} />
            ) : (
              <div style={{
                width: 96, height: 96,
                background: 'radial-gradient(circle, rgba(255,200,50,0.7) 0%, transparent 70%)',
                borderRadius: '50%',
                boxShadow: '0 0 15px rgba(255,255,255,0.3)',
              }} />
            )}
          </div>
        );
      })}

      {blinkTrails.map(bt => {
        const age = Date.now() - bt.born;
        const delay = bt.delay || 0;
        const elapsed = age - delay;
        if (elapsed < 0) return null;
        const t = Math.min(elapsed / 600, 1);
        return (
          <div key={`blink-${bt.id}`} style={{
            position: 'absolute',
            left: bt.x, top: bt.y,
            width: 28, height: 28,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${bt.color}cc 0%, ${bt.color}44 50%, transparent 80%)`,
            boxShadow: `0 0 18px ${bt.color}88, 0 0 8px ${bt.color}44`,
            opacity: 1 - t,
            transform: `translate(-50%, -50%) scale(${0.4 + t * 1.2})`,
            pointerEvents: 'none',
            zIndex: 19,
          }} />
        );
      })}

      {particles.map(p => {
        const age = Date.now() - p.born;
        const t = Math.min(age / p.lifetime, 1);
        const px = p.x + p.vx * t;
        const py = p.y + p.vy * t + 30 * t * t;
        return (
          <div key={p.id} style={{
            position: 'absolute',
            left: px, top: py,
            width: p.size * (1 - t * 0.5),
            height: p.size * (1 - t * 0.5),
            background: p.color,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 25,
            opacity: 1 - t,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `particleFade ${p.lifetime}ms ease forwards`,
          }} />
        );
      })}

      {damagePopups.map(popup => (
        <div key={popup.id} style={{
          position: 'absolute',
          left: popup.x, top: popup.y,
          animation: popup.isCrit ? 'critPopup 1.4s ease forwards' : 'dmgPopup 1.4s ease forwards',
          pointerEvents: 'none', zIndex: 30,
          color: popup.color,
          fontSize: popup.isCrit ? '28px' : popup.text === 'MISS' ? '16px' : '20px',
          fontWeight: 900,
          fontFamily: "'Cinzel', serif",
          textShadow: `0 0 12px ${popup.color}aa, 0 0 24px ${popup.color}44, 0 2px 6px rgba(0,0,0,0.95)`,
          letterSpacing: popup.isCrit ? '2px' : '1px',
          WebkitTextStroke: popup.isCrit ? '1px rgba(0,0,0,0.3)' : undefined,
        }}>{popup.text}</div>
      ))}

      {screenFlash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: screenFlash,
          animation: 'screenFlashAnim 0.3s ease forwards',
          pointerEvents: 'none', zIndex: 35,
        }} />
      )}

      {isPlayerTurn && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          fontSize: '10px', color: palette?.accent || '#fbbf24',
          background: 'rgba(0,0,0,0.7)', padding: '4px 16px', borderRadius: '14px',
          border: `1px solid ${palette?.accent || '#fbbf24'}33`,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px',
          pointerEvents: 'none', zIndex: 15,
          backdropFilter: 'blur(4px)',
          boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${palette?.accent || '#fbbf24'}11`,
        }}>Select Target</div>
      )}
    </div>
  );
}
