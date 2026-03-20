import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { spriteSheets } from '../data/spriteMap';

// ── Fighter sprite configs ──────────────────────────────────────────────
// We pick two melee sprites that have attack1/2/3, block, hurt, death, idle, walk
const PLAYER_SPRITE = spriteSheets['hero-knight']; // 180x180, elf warrior
const OPPONENT_SPRITE = spriteSheets['fantasy-warrior']; // 162x162

const FIGHTER_DEFAULTS = {
  maxHp: 100,
  maxStamina: 100,
  staminaRegen: 0.35,
  damage: { jab: 5, cross: 8, hook: 12, uppercut: 15 },
  staminaCost: { jab: 8, cross: 12, hook: 18, uppercut: 22, block: 0, dodge: 15 },
  blockReduction: 0.75,
  dodgeDuration: 400,
  attackCooldown: { jab: 350, cross: 500, hook: 650, uppercut: 750 },
};

// Map punch types to sprite animations; getAnim() handles missing anims
const ATTACK_ANIMS = {
  jab: 'attack1',
  cross: 'attack2',
  hook: 'attack2',
  uppercut: 'attack3',
};

// Safely resolve an animation name, falling back if the sprite doesn't have it
function getAnim(spriteData, animName) {
  if (spriteData?.[animName]) return animName;
  // fallback chain
  if (animName === 'attack3') return spriteData?.attack2 ? 'attack2' : 'attack1';
  if (animName === 'block') return spriteData?.hurt ? 'hurt' : 'idle';
  return 'idle';
}

const ROUND_TIME = 99; // seconds per round
const MAX_ROUNDS = 3;

// ── AI Difficulty ────────────────────────────────────────────────────────
const AI_CONFIG = {
  reactionMs: 600,
  attackIntervalMin: 800,
  attackIntervalMax: 2000,
  blockChance: 0.3,
  dodgeChance: 0.15,
  comboChance: 0.2,
};

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// ── Health Bar ───────────────────────────────────────────────────────────
function HealthBar({ current, max, label, color = '#e53e3e', side = 'left' }) {
  const pct = clamp((current / max) * 100, 0, 100);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: side === 'left' ? 'flex-start' : 'flex-end',
      width: '45%',
    }}>
      <span style={{
        color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem',
        marginBottom: 2, textShadow: '1px 1px 2px #000',
      }}>{label}</span>
      <div style={{
        width: '100%', height: 18, background: '#1a1a2e', border: '2px solid #333',
        borderRadius: 3, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, [side]: 0, height: '100%',
          width: `${pct}%`, background: pct > 50 ? color : pct > 25 ? '#f6ad55' : '#e53e3e',
          transition: 'width 0.15s ease-out',
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.15)`,
        }} />
        <span style={{
          position: 'absolute', width: '100%', textAlign: 'center', top: 2,
          fontSize: '0.5rem', color: '#fff', fontFamily: "'Press Start 2P', monospace",
          textShadow: '1px 1px 1px #000',
        }}>{Math.ceil(current)}/{max}</span>
      </div>
    </div>
  );
}

function StaminaBar({ current, max, side = 'left' }) {
  const pct = clamp((current / max) * 100, 0, 100);
  return (
    <div style={{ width: '45%', display: 'flex', justifyContent: side === 'left' ? 'flex-start' : 'flex-end' }}>
      <div style={{
        width: '100%', height: 8, background: '#1a1a2e', border: '1px solid #333',
        borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct > 40 ? '#48bb78' : '#ecc94b',
          transition: 'width 0.1s ease-out',
          float: side === 'left' ? 'left' : 'right',
        }} />
      </div>
    </div>
  );
}

// ── Round indicator ──────────────────────────────────────────────────────
function RoundDisplay({ round, timer, playerWins, opponentWins }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{
        color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem',
        textShadow: '0 0 8px rgba(255,215,0,0.6)',
      }}>ROUND {round}</span>
      <span style={{
        color: '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: '1.4rem',
        textShadow: '0 0 12px rgba(255,100,100,0.5)',
      }}>{timer}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[...Array(MAX_ROUNDS)].map((_, i) => (
          <div key={`pw${i}`} style={{
            width: 10, height: 10, borderRadius: '50%', border: '1px solid #555',
            background: i < playerWins ? '#48bb78' : '#222',
          }} />
        ))}
        <span style={{ color: '#666', fontSize: '0.5rem', alignSelf: 'center' }}>vs</span>
        {[...Array(MAX_ROUNDS)].map((_, i) => (
          <div key={`ow${i}`} style={{
            width: 10, height: 10, borderRadius: '50%', border: '1px solid #555',
            background: i < opponentWins ? '#e53e3e' : '#222',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Hit effect flash ─────────────────────────────────────────────────────
function HitFlash({ active, side }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'absolute', top: '30%', [side]: '25%', width: 60, height: 60,
      background: 'radial-gradient(circle, rgba(255,255,100,0.9) 0%, rgba(255,100,50,0.4) 50%, transparent 70%)',
      borderRadius: '50%', pointerEvents: 'none', animation: 'hitFlashPop 0.25s ease-out forwards',
      zIndex: 50,
    }} />
  );
}

// ── Damage number popup ──────────────────────────────────────────────────
function DamageNumber({ value, x, key: k }) {
  return (
    <span key={k} style={{
      position: 'absolute', left: x, top: '35%', color: '#ff4444',
      fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', fontWeight: 900,
      textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
      animation: 'dmgFloat 0.8s ease-out forwards', pointerEvents: 'none', zIndex: 60,
    }}>-{value}</span>
  );
}

// ── Controls legend ──────────────────────────────────────────────────────
function ControlsHUD() {
  const keys = [
    { key: 'LMB', action: 'Jab' },
    { key: 'RMB', action: 'Cross' },
    { key: 'Q', action: 'Hook' },
    { key: 'E', action: 'Uppercut' },
    { key: 'SPACE', action: 'Dodge' },
    { key: 'SHIFT', action: 'Block' },
    { key: 'A/D', action: 'Move' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 8, background: 'rgba(0,0,0,0.6)', padding: '6px 14px',
      borderRadius: 8, border: '1px solid #333', zIndex: 100,
    }}>
      {keys.map(k => (
        <div key={k.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{
            background: '#333', color: '#ffd700', padding: '2px 6px', borderRadius: 3,
            fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', border: '1px solid #555',
            minWidth: 22, textAlign: 'center',
          }}>{k.key}</span>
          <span style={{ color: '#aaa', fontSize: '0.35rem', fontFamily: 'monospace' }}>{k.action}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main GKO Boxing Component ────────────────────────────────────────────
export default function GKOBoxing() {
  // --- Fighter state ---
  const [playerHp, setPlayerHp] = useState(FIGHTER_DEFAULTS.maxHp);
  const [playerStamina, setPlayerStamina] = useState(FIGHTER_DEFAULTS.maxStamina);
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [playerX, setPlayerX] = useState(25); // % from left
  const [playerDodging, setPlayerDodging] = useState(false);
  const [playerBlocking, setPlayerBlocking] = useState(false);
  const [playerHitFlash, setPlayerHitFlash] = useState(false);

  const [opHp, setOpHp] = useState(FIGHTER_DEFAULTS.maxHp);
  const [opStamina, setOpStamina] = useState(FIGHTER_DEFAULTS.maxStamina);
  const [opAnim, setOpAnim] = useState('idle');
  const [opX, setOpX] = useState(65);
  const [opDodging, setOpDodging] = useState(false);
  const [opBlocking, setOpBlocking] = useState(false);
  const [opHitFlash, setOpHitFlash] = useState(false);

  // --- Game state ---
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [playerWins, setPlayerWins] = useState(0);
  const [opWins, setOpWins] = useState(0);
  const [gamePhase, setGamePhase] = useState('ready'); // ready, fight, roundEnd, ko, matchEnd
  const [announcement, setAnnouncement] = useState('G.K.O. BOXING');
  const [dmgNumbers, setDmgNumbers] = useState([]);

  // refs
  const keysRef = useRef({});
  const playerCooldownRef = useRef(false);
  const opCooldownRef = useRef(false);
  const aiTimerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);
  const dmgIdRef = useRef(0);
  const containerRef = useRef(null);

  // --- Inject keyframe styles ---
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hitFlashPop {
        0% { transform: scale(0.3); opacity: 1; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      @keyframes dmgFloat {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-60px); opacity: 0; }
      }
      @keyframes announceSlam {
        0% { transform: scale(3) translateY(0); opacity: 0; }
        30% { transform: scale(1) translateY(0); opacity: 1; }
        80% { transform: scale(1) translateY(0); opacity: 1; }
        100% { transform: scale(0.8) translateY(-20px); opacity: 0; }
      }
      @keyframes dodgeTilt {
        0% { transform: scaleX(var(--fighter-dir, 1)) rotate(0deg); }
        30% { transform: scaleX(var(--fighter-dir, 1)) rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 8px)); }
        70% { transform: scaleX(var(--fighter-dir, 1)) rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 8px)); }
        100% { transform: scaleX(var(--fighter-dir, 1)) rotate(0deg); }
      }
      @keyframes ringRopesBounce {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.02); }
      }
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // --- Focus container for key events ---
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // --- Utility: apply damage ---
  const spawnDmg = useCallback((value, xPct) => {
    const id = ++dmgIdRef.current;
    setDmgNumbers(prev => [...prev, { id, value, x: `${xPct}%` }]);
    setTimeout(() => setDmgNumbers(prev => prev.filter(d => d.id !== id)), 900);
  }, []);

  const dealDamageToOpponent = useCallback((attackType) => {
    if (opDodging) return; // missed
    let dmg = FIGHTER_DEFAULTS.damage[attackType];
    if (opBlocking) {
      dmg = Math.round(dmg * (1 - FIGHTER_DEFAULTS.blockReduction));
    }
    setOpHp(prev => Math.max(0, prev - dmg));
    setOpHitFlash(true);
    spawnDmg(dmg, opX);
    setTimeout(() => setOpHitFlash(false), 250);
    if (!opBlocking) {
      setOpAnim('hurt');
      setTimeout(() => setOpAnim('idle'), 350);
    }
  }, [opDodging, opBlocking, opX, spawnDmg]);

  const dealDamageToPlayer = useCallback((attackType) => {
    if (playerDodging) return;
    let dmg = FIGHTER_DEFAULTS.damage[attackType];
    if (playerBlocking) {
      dmg = Math.round(dmg * (1 - FIGHTER_DEFAULTS.blockReduction));
    }
    setPlayerHp(prev => Math.max(0, prev - dmg));
    setPlayerHitFlash(true);
    spawnDmg(dmg, playerX);
    setTimeout(() => setPlayerHitFlash(false), 250);
    if (!playerBlocking) {
      setPlayerAnim('hurt');
      setTimeout(() => setPlayerAnim('idle'), 350);
    }
  }, [playerDodging, playerBlocking, playerX, spawnDmg]);

  // --- Player attack ---
  const playerAttack = useCallback((attackType) => {
    if (playerCooldownRef.current || gamePhase !== 'fight') return;
    const cost = FIGHTER_DEFAULTS.staminaCost[attackType];
    if (playerStamina < cost) return;

    playerCooldownRef.current = true;
    setPlayerStamina(prev => Math.max(0, prev - cost));
    setPlayerAnim(getAnim(PLAYER_SPRITE, ATTACK_ANIMS[attackType] || 'attack1'));

    // damage lands partway through animation
    const hitDelay = FIGHTER_DEFAULTS.attackCooldown[attackType] * 0.4;
    setTimeout(() => dealDamageToOpponent(attackType), hitDelay);

    setTimeout(() => {
      setPlayerAnim('idle');
      playerCooldownRef.current = false;
    }, FIGHTER_DEFAULTS.attackCooldown[attackType]);
  }, [gamePhase, playerStamina, dealDamageToOpponent]);

  // --- Player dodge ---
  const playerDodge = useCallback(() => {
    if (playerDodging || playerCooldownRef.current || gamePhase !== 'fight') return;
    if (playerStamina < FIGHTER_DEFAULTS.staminaCost.dodge) return;
    setPlayerStamina(prev => prev - FIGHTER_DEFAULTS.staminaCost.dodge);
    setPlayerDodging(true);
    setTimeout(() => setPlayerDodging(false), FIGHTER_DEFAULTS.dodgeDuration);
  }, [playerDodging, playerStamina, gamePhase]);

  // --- AI logic ---
  useEffect(() => {
    if (gamePhase !== 'fight') {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      return;
    }
    function aiTick() {
      if (gamePhase !== 'fight') return;

      // Decide action
      const roll = Math.random();
      if (roll < AI_CONFIG.dodgeChance) {
        // AI dodge
        setOpDodging(true);
        setTimeout(() => setOpDodging(false), FIGHTER_DEFAULTS.dodgeDuration);
      } else if (roll < AI_CONFIG.dodgeChance + AI_CONFIG.blockChance) {
        // AI block
        setOpBlocking(true);
        setOpAnim(getAnim(OPPONENT_SPRITE, 'block'));
        setTimeout(() => { setOpBlocking(false); setOpAnim('idle'); }, 600);
      } else {
        // AI attack
        if (!opCooldownRef.current && opStamina >= 12) {
          const attacks = ['jab', 'cross', 'hook', 'uppercut'];
          const weights = [0.4, 0.3, 0.2, 0.1];
          let r = Math.random(), atkType = 'jab';
          let cumulative = 0;
          for (let i = 0; i < attacks.length; i++) {
            cumulative += weights[i];
            if (r <= cumulative) { atkType = attacks[i]; break; }
          }

          opCooldownRef.current = true;
          setOpStamina(prev => Math.max(0, prev - FIGHTER_DEFAULTS.staminaCost[atkType]));
          setOpAnim(getAnim(OPPONENT_SPRITE, ATTACK_ANIMS[atkType] || 'attack1'));

          const hitDelay = FIGHTER_DEFAULTS.attackCooldown[atkType] * 0.4;
          setTimeout(() => dealDamageToPlayer(atkType), hitDelay);

          setTimeout(() => {
            setOpAnim('idle');
            opCooldownRef.current = false;
          }, FIGHTER_DEFAULTS.attackCooldown[atkType]);

          // Combo chance
          if (Math.random() < AI_CONFIG.comboChance) {
            const comboDelay = FIGHTER_DEFAULTS.attackCooldown[atkType] + 100;
            setTimeout(() => {
              if (gamePhase !== 'fight') return;
              opCooldownRef.current = true;
              setOpAnim('attack2');
              setOpStamina(prev => Math.max(0, prev - 10));
              setTimeout(() => dealDamageToPlayer('cross'), 200);
              setTimeout(() => { setOpAnim('idle'); opCooldownRef.current = false; }, 500);
            }, comboDelay);
          }
        }
      }

      const nextInterval = AI_CONFIG.attackIntervalMin + Math.random() * (AI_CONFIG.attackIntervalMax - AI_CONFIG.attackIntervalMin);
      aiTimerRef.current = setTimeout(aiTick, nextInterval);
    }

    aiTimerRef.current = setTimeout(aiTick, AI_CONFIG.reactionMs);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gamePhase, opStamina, dealDamageToPlayer]);

  // --- Stamina regen loop ---
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setPlayerStamina(prev => clamp(prev + FIGHTER_DEFAULTS.staminaRegen, 0, FIGHTER_DEFAULTS.maxStamina));
      setOpStamina(prev => clamp(prev + FIGHTER_DEFAULTS.staminaRegen, 0, FIGHTER_DEFAULTS.maxStamina));
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase]);

  // --- Round timer ---
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gamePhase]);

  // --- Player movement (A/D keys) ---
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      const keys = keysRef.current;
      if (keys['a'] || keys['arrowleft']) {
        setPlayerX(prev => clamp(prev - 1.2, 5, 85));
        if (playerAnim === 'idle') setPlayerAnim('walk');
      } else if (keys['d'] || keys['arrowright']) {
        setPlayerX(prev => clamp(prev + 1.2, 5, 85));
        if (playerAnim === 'idle') setPlayerAnim('walk');
      } else if (playerAnim === 'walk') {
        setPlayerAnim('idle');
      }
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase, playerAnim]);

  // --- AI movement (follows player) ---
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setOpX(prev => {
        const target = playerX + 25;
        const diff = target - prev;
        if (Math.abs(diff) < 1) return prev;
        return prev + Math.sign(diff) * 0.4;
      });
    }, 60);
    return () => clearInterval(id);
  }, [gamePhase, playerX]);

  // --- Round end / KO detection ---
  useEffect(() => {
    if (gamePhase !== 'fight') return;

    if (playerHp <= 0) {
      setPlayerAnim('death');
      setAnnouncement('K.O.!');
      setGamePhase('ko');
      setTimeout(() => {
        setOpWins(prev => prev + 1);
        setGamePhase('roundEnd');
      }, 1500);
      return;
    }
    if (opHp <= 0) {
      setOpAnim('death');
      setAnnouncement('K.O.!');
      setGamePhase('ko');
      setTimeout(() => {
        setPlayerWins(prev => prev + 1);
        setGamePhase('roundEnd');
      }, 1500);
      return;
    }
    if (timer <= 0) {
      // time out — whoever has more HP wins the round
      if (playerHp >= opHp) {
        setPlayerWins(prev => prev + 1);
      } else {
        setOpWins(prev => prev + 1);
      }
      setAnnouncement('TIME!');
      setGamePhase('roundEnd');
    }
  }, [gamePhase, playerHp, opHp, timer]);

  // --- Round transitions ---
  useEffect(() => {
    if (gamePhase !== 'roundEnd') return;
    const totalPw = playerWins;
    const totalOw = opWins;
    const winsNeeded = Math.ceil(MAX_ROUNDS / 2);

    setTimeout(() => {
      if (totalPw >= winsNeeded) {
        setAnnouncement('YOU WIN!');
        setGamePhase('matchEnd');
      } else if (totalOw >= winsNeeded) {
        setAnnouncement('YOU LOSE!');
        setGamePhase('matchEnd');
      } else {
        // next round
        setRound(prev => prev + 1);
        setPlayerHp(FIGHTER_DEFAULTS.maxHp);
        setOpHp(FIGHTER_DEFAULTS.maxHp);
        setPlayerStamina(FIGHTER_DEFAULTS.maxStamina);
        setOpStamina(FIGHTER_DEFAULTS.maxStamina);
        setPlayerAnim('idle');
        setOpAnim('idle');
        setTimer(ROUND_TIME);
        setPlayerX(25);
        setOpX(65);
        setAnnouncement(`ROUND ${round + 1}`);
        setGamePhase('ready');
      }
    }, 2000);
  }, [gamePhase, playerWins, opWins, round]);

  // --- Ready → Fight countdown ---
  useEffect(() => {
    if (gamePhase !== 'ready') return;
    const t1 = setTimeout(() => setAnnouncement('READY...'), 500);
    const t2 = setTimeout(() => setAnnouncement('FIGHT!'), 1800);
    const t3 = setTimeout(() => {
      setAnnouncement('');
      setGamePhase('fight');
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [gamePhase]);

  // --- Restart match ---
  const restartMatch = useCallback(() => {
    setRound(1);
    setTimer(ROUND_TIME);
    setPlayerHp(FIGHTER_DEFAULTS.maxHp);
    setOpHp(FIGHTER_DEFAULTS.maxHp);
    setPlayerStamina(FIGHTER_DEFAULTS.maxStamina);
    setOpStamina(FIGHTER_DEFAULTS.maxStamina);
    setPlayerAnim('idle');
    setOpAnim('idle');
    setPlayerWins(0);
    setOpWins(0);
    setPlayerX(25);
    setOpX(65);
    setDmgNumbers([]);
    setAnnouncement('G.K.O. BOXING');
    setGamePhase('ready');
  }, []);

  // --- Keyboard input ---
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;

    if (gamePhase === 'matchEnd' && key === 'enter') { restartMatch(); return; }
    if (gamePhase !== 'fight') return;

    if (key === ' ') { e.preventDefault(); playerDodge(); }
    if (key === 'shift') { setPlayerBlocking(true); setPlayerAnim(getAnim(PLAYER_SPRITE, 'block')); }
    if (key === 'q') playerAttack('hook');
    if (key === 'e') playerAttack('uppercut');
  }, [gamePhase, playerDodge, playerAttack, restartMatch]);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = false;
    if (key === 'shift') { setPlayerBlocking(false); if (playerAnim === getAnim(PLAYER_SPRITE, 'block')) setPlayerAnim('idle'); }
  }, [playerAnim]);

  // Mouse attacks
  const handleMouseDown = useCallback((e) => {
    if (gamePhase !== 'fight') return;
    if (e.button === 0) playerAttack('jab');
    if (e.button === 2) playerAttack('cross');
  }, [gamePhase, playerAttack]);

  const handleContextMenu = useCallback((e) => e.preventDefault(), []);

  // --- Fighter sprite rendering ---
  const renderFighter = (spriteData, anim, x, flip, dodging, blocking, side) => {
    const dodgeDir = side === 'left' ? 1 : -1;
    const fighterDir = flip ? -1 : 1;
    return (
      <div style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: '12%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}>
        <div style={{
          '--fighter-dir': fighterDir,
          '--dodge-dir': dodgeDir,
          animation: dodging ? `dodgeTilt ${FIGHTER_DEFAULTS.dodgeDuration}ms ease-in-out` : 'none',
          transformOrigin: 'bottom center',
          transform: blocking ? `scaleX(${fighterDir}) scaleY(0.92)` : `scaleX(${fighterDir})`,
          transition: blocking ? 'transform 0.1s' : 'none',
        }}>
          <SpriteAnimation
            spriteData={spriteData}
            animation={anim}
            scale={2.5}
            flip={false}
            loop={anim === 'idle' || anim === 'walk' || anim === getAnim(spriteData, 'block')}
            speed={anim === 'idle' ? 140 : anim === 'walk' ? 90 : 80}
            containerless={false}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{
        width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #2d1b3d 100%)',
        cursor: 'crosshair', outline: 'none', userSelect: 'none',
      }}
    >
      {/* Ring floor */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%',
        background: 'linear-gradient(180deg, #3d2b1f 0%, #2a1c12 100%)',
        borderTop: '3px solid #8b7355',
      }}>
        {/* Ring ropes */}
        {[22, 42, 62].map(pct => (
          <div key={pct} style={{
            position: 'absolute', top: `-${pct}vh`, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent 2%, #aa8866 5%, #cc9966 50%, #aa8866 95%, transparent 98%)`,
            opacity: 0.4, animation: 'ringRopesBounce 2s ease-in-out infinite',
          }} />
        ))}
      </div>

      {/* Ring corner posts */}
      {[3, 97].map(x => (
        <div key={x} style={{
          position: 'absolute', bottom: '13%', left: `${x}%`, width: 8, height: 180,
          background: 'linear-gradient(180deg, #ffd700, #8b7355)', borderRadius: 4, zIndex: 5,
        }} />
      ))}

      {/* Crowd/atmosphere */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
        background: 'radial-gradient(ellipse at 50% 120%, rgba(60,20,80,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top HUD */}
      <div style={{
        position: 'absolute', top: 10, left: 10, right: 10, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{ width: '40%' }}>
          <HealthBar current={playerHp} max={FIGHTER_DEFAULTS.maxHp} label="PLAYER" color="#3b82f6" side="left" />
          <StaminaBar current={playerStamina} max={FIGHTER_DEFAULTS.maxStamina} side="left" />
        </div>
        <RoundDisplay round={round} timer={timer} playerWins={playerWins} opponentWins={opWins} />
        <div style={{ width: '40%' }}>
          <HealthBar current={opHp} max={FIGHTER_DEFAULTS.maxHp} label="OPPONENT" color="#e53e3e" side="right" />
          <StaminaBar current={opStamina} max={FIGHTER_DEFAULTS.maxStamina} side="right" />
        </div>
      </div>

      {/* Fighters */}
      {renderFighter(PLAYER_SPRITE, playerAnim, playerX, false, playerDodging, playerBlocking, 'left')}
      {renderFighter(OPPONENT_SPRITE, opAnim, opX, true, opDodging, opBlocking, 'right')}

      {/* Hit effects */}
      <HitFlash active={opHitFlash} side="right" />
      <HitFlash active={playerHitFlash} side="left" />

      {/* Damage numbers */}
      {dmgNumbers.map(d => <DamageNumber key={d.id} value={d.value} x={d.x} />)}

      {/* Announcement overlay */}
      {announcement && (
        <div style={{
          position: 'absolute', top: '30%', left: 0, right: 0, textAlign: 'center', zIndex: 200,
          pointerEvents: 'none',
        }}>
          <span style={{
            color: announcement === 'K.O.!' ? '#ff3333' : announcement.includes('WIN') ? '#48bb78' : announcement.includes('LOSE') ? '#e53e3e' : '#ffd700',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: announcement.length > 10 ? '1.6rem' : '2.2rem',
            textShadow: '0 0 20px rgba(255,215,0,0.6), 3px 3px 0 #000, -1px -1px 0 #000',
            letterSpacing: 4,
            animation: 'announceSlam 1.5s ease-out forwards',
          }}>{announcement}</span>
        </div>
      )}

      {/* Match end restart prompt */}
      {gamePhase === 'matchEnd' && (
        <div style={{
          position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 200,
        }}>
          <button onClick={restartMatch} style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)', border: '2px solid #fff',
            borderRadius: 8, padding: '12px 32px', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem',
            color: '#000', letterSpacing: 2, boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
          }}>
            REMATCH (ENTER)
          </button>
        </div>
      )}

      {/* Back button */}
      <a href="/" style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', marginTop: 80,
        color: '#888', fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem',
        textDecoration: 'none', zIndex: 100, padding: '4px 10px',
        background: 'rgba(0,0,0,0.5)', borderRadius: 4, border: '1px solid #333',
      }}>← BACK</a>

      <ControlsHUD />
    </div>
  );
}
