import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { spriteSheets } from '../data/spriteMap';

// ── Fighter sprite configs ──────────────────────────────────────────────
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
  hitRange: 30,
};

const ATTACK_ANIMS = {
  jab: 'attack1',
  cross: 'attack2',
  hook: 'attack2',
  uppercut: 'attack3',
};

const PUNCH_LABELS = { jab: 'JAB', cross: 'CROSS', hook: 'HOOK', uppercut: 'UPPERCUT' };

function getAnim(spriteData, animName) {
  if (spriteData?.[animName]) return animName;
  if (animName === 'attack3') return spriteData?.attack2 ? 'attack2' : 'attack1';
  if (animName === 'block') return spriteData?.hurt ? 'hurt' : 'idle';
  return 'idle';
}

const ROUND_TIME = 99;
const MAX_ROUNDS = 3;

const AI_CONFIG = {
  reactionMs: 600,
  attackIntervalMin: 800,
  attackIntervalMax: 2000,
  blockChance: 0.3,
  dodgeChance: 0.15,
  comboChance: 0.2,
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

const SFX = {
  jab: '/audio/swish_2.wav',
  cross: '/audio/swish_3.wav',
  hook: '/audio/swish_4.wav',
  uppercut: '/audio/swish_4.wav',
};

function playPunchSfx(type) {
  try {
    const a = new Audio(SFX[type] || SFX.jab);
    a.volume = 0.35;
    a.play().catch(() => {});
  } catch {}
}

// ── Sub-components ───────────────────────────────────────────────────────

function HealthBar({ current, max, label, color = '#e53e3e', side = 'left' }) {
  const pct = clamp((current / max) * 100, 0, 100);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: side === 'left' ? 'flex-start' : 'flex-end', width: '100%',
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
          width: `${pct}%`,
          background: pct > 50 ? color : pct > 25 ? '#f6ad55' : '#e53e3e',
          transition: 'width 0.15s ease-out',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15)',
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
    <div style={{ width: '100%' }}>
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

function RoundDisplay({ round, timer, playerWins, opponentWins }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem',
        textShadow: '0 0 8px rgba(255,215,0,0.6)',
      }}>ROUND {round}</span>
      <span style={{
        color: timer <= 10 ? '#ff4444' : '#fff',
        fontFamily: "'Press Start 2P', monospace", fontSize: '1.4rem',
        textShadow: timer <= 10 ? '0 0 12px rgba(255,50,50,0.8)' : '0 0 12px rgba(255,100,100,0.5)',
        animation: timer <= 10 ? 'timerPulse 0.5s ease-in-out infinite' : 'none',
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

function ControlsHUD() {
  const keys = [
    { key: 'LMB', action: 'Jab' }, { key: 'RMB', action: 'Cross' },
    { key: 'Q', action: 'Hook' }, { key: 'E', action: 'Uppercut' },
    { key: 'SPACE', action: 'Dodge' }, { key: 'SHIFT', action: 'Block' },
    { key: 'A/D', action: 'Move' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 8, background: 'rgba(0,0,0,0.7)', padding: '6px 14px',
      borderRadius: 8, border: '1px solid #444', zIndex: 100,
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

function FloatingTexts({ items }) {
  return items.map(item => (
    <span key={item.id} style={{
      position: 'absolute', left: item.x, top: item.y || '40%',
      color: item.color || '#fff',
      fontFamily: "'Press Start 2P', monospace", fontSize: item.size || '0.6rem',
      fontWeight: 900, textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
      animation: 'actionFloat 0.9s ease-out forwards', pointerEvents: 'none', zIndex: 65,
      whiteSpace: 'nowrap',
    }}>{item.text}</span>
  ));
}

// ── Main component ───────────────────────────────────────────────────────
export default function GKOBoxing() {
  const [playerHp, setPlayerHp] = useState(FIGHTER_DEFAULTS.maxHp);
  const [playerStamina, setPlayerStamina] = useState(FIGHTER_DEFAULTS.maxStamina);
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [playerX, setPlayerX] = useState(25);
  const [playerDodging, setPlayerDodging] = useState(false);
  const [playerBlocking, setPlayerBlocking] = useState(false);

  const [opHp, setOpHp] = useState(FIGHTER_DEFAULTS.maxHp);
  const [opStamina, setOpStamina] = useState(FIGHTER_DEFAULTS.maxStamina);
  const [opAnim, setOpAnim] = useState('idle');
  const [opX, setOpX] = useState(65);
  const [opDodging, setOpDodging] = useState(false);
  const [opBlocking, setOpBlocking] = useState(false);

  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [playerWins, setPlayerWins] = useState(0);
  const [opWins, setOpWins] = useState(0);
  const [gamePhase, setGamePhase] = useState('ready');
  const [announcement, setAnnouncement] = useState('G.K.O. BOXING');
  const [floats, setFloats] = useState([]);
  const [screenShake, setScreenShake] = useState(false);

  // Refs for non-stale access inside timeouts/intervals
  const keysRef = useRef({});
  const playerCooldownRef = useRef(false);
  const opCooldownRef = useRef(false);
  const aiTimerRef = useRef(null);
  const timerRef = useRef(null);
  const floatIdRef = useRef(0);
  const containerRef = useRef(null);
  const gpRef = useRef(gamePhase);
  const pxRef = useRef(playerX);
  const oxRef = useRef(opX);
  const pdRef = useRef(playerDodging);
  const pbRef = useRef(playerBlocking);
  const odRef = useRef(opDodging);
  const obRef = useRef(opBlocking);

  useEffect(() => { gpRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { pxRef.current = playerX; }, [playerX]);
  useEffect(() => { oxRef.current = opX; }, [opX]);
  useEffect(() => { pdRef.current = playerDodging; }, [playerDodging]);
  useEffect(() => { pbRef.current = playerBlocking; }, [playerBlocking]);
  useEffect(() => { odRef.current = opDodging; }, [opDodging]);
  useEffect(() => { obRef.current = opBlocking; }, [opBlocking]);

  // ── Styles ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @keyframes hitFlashPop { 0% { transform: scale(0.3); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
      @keyframes dmgFloat { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-60px); opacity: 0; } }
      @keyframes actionFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-50px) scale(0.7); opacity: 0; } }
      @keyframes announceSlam { 0% { transform: scale(3); opacity: 0; } 30% { transform: scale(1); opacity: 1; } 80% { opacity: 1; } 100% { transform: scale(0.8) translateY(-20px); opacity: 0; } }
      @keyframes dodgeTilt {
        0% { transform: scaleX(var(--fighter-dir, 1)) rotate(0deg); }
        30% { transform: scaleX(var(--fighter-dir, 1)) rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 10px)); }
        70% { transform: scaleX(var(--fighter-dir, 1)) rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 10px)); }
        100% { transform: scaleX(var(--fighter-dir, 1)) rotate(0deg); }
      }
      @keyframes ringRopesBounce { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
      @keyframes timerPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      @keyframes gkoShake {
        0% { transform: translate(0,0); } 15% { transform: translate(-4px,2px); }
        30% { transform: translate(4px,-2px); } 45% { transform: translate(-3px,-1px); }
        60% { transform: translate(3px,1px); } 75% { transform: translate(-1px,2px); }
        100% { transform: translate(0,0); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { containerRef.current?.focus(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────
  const spawnFloat = useCallback((text, xPct, color, yPct, size) => {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, text, x: `${xPct}%`, y: yPct || '40%', color, size }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  }, []);

  const inRange = useCallback(() => Math.abs(pxRef.current - oxRef.current) <= FIGHTER_DEFAULTS.hitRange, []);

  // ── Damage ─────────────────────────────────────────────────────────────
  const dealDamageToOpponent = useCallback((attackType) => {
    playPunchSfx(attackType);
    spawnFloat(PUNCH_LABELS[attackType], pxRef.current + 5, '#ffd700', '55%', '0.5rem');
    if (!inRange()) { spawnFloat('MISS', oxRef.current, '#888', '35%'); return; }
    if (odRef.current) { spawnFloat('DODGED', oxRef.current, '#66d9ef', '35%'); return; }
    let dmg = FIGHTER_DEFAULTS.damage[attackType];
    if (obRef.current) {
      dmg = Math.round(dmg * (1 - FIGHTER_DEFAULTS.blockReduction));
      spawnFloat('BLOCKED', oxRef.current, '#aaa', '30%');
    }
    setOpHp(prev => Math.max(0, prev - dmg));
    spawnFloat(`-${dmg}`, oxRef.current, dmg >= 10 ? '#ff4444' : '#ff8888', '35%', dmg >= 10 ? '1rem' : '0.8rem');
    if (!obRef.current) {
      setOpAnim('hurt');
      setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); }, 350);
    }
    if (attackType === 'uppercut' || attackType === 'hook') triggerShake();
  }, [spawnFloat, inRange, triggerShake]);

  const dealDamageToPlayer = useCallback((attackType) => {
    playPunchSfx(attackType);
    if (!inRange()) return;
    if (pdRef.current) { spawnFloat('DODGED', pxRef.current, '#66d9ef', '35%'); return; }
    let dmg = FIGHTER_DEFAULTS.damage[attackType];
    if (pbRef.current) {
      dmg = Math.round(dmg * (1 - FIGHTER_DEFAULTS.blockReduction));
      spawnFloat('BLOCKED', pxRef.current, '#aaa', '30%');
    }
    setPlayerHp(prev => Math.max(0, prev - dmg));
    spawnFloat(`-${dmg}`, pxRef.current, dmg >= 10 ? '#ff4444' : '#ff8888', '35%', dmg >= 10 ? '1rem' : '0.8rem');
    if (!pbRef.current) {
      setPlayerAnim('hurt');
      setTimeout(() => { if (gpRef.current === 'fight') setPlayerAnim('idle'); }, 350);
    }
    if (attackType === 'uppercut' || attackType === 'hook') triggerShake();
  }, [spawnFloat, inRange, triggerShake]);

  // ── Player attack ──────────────────────────────────────────────────────
  const playerAttack = useCallback((attackType) => {
    if (playerCooldownRef.current || gpRef.current !== 'fight') return;
    const cost = FIGHTER_DEFAULTS.staminaCost[attackType];
    if (playerStamina < cost) return;
    playerCooldownRef.current = true;
    setPlayerStamina(prev => Math.max(0, prev - cost));
    setPlayerAnim(getAnim(PLAYER_SPRITE, ATTACK_ANIMS[attackType] || 'attack1'));
    setTimeout(() => dealDamageToOpponent(attackType), FIGHTER_DEFAULTS.attackCooldown[attackType] * 0.4);
    setTimeout(() => {
      if (gpRef.current === 'fight') setPlayerAnim('idle');
      playerCooldownRef.current = false;
    }, FIGHTER_DEFAULTS.attackCooldown[attackType]);
  }, [playerStamina, dealDamageToOpponent]);

  const playerDodge = useCallback(() => {
    if (playerDodging || playerCooldownRef.current || gpRef.current !== 'fight') return;
    if (playerStamina < FIGHTER_DEFAULTS.staminaCost.dodge) return;
    setPlayerStamina(prev => prev - FIGHTER_DEFAULTS.staminaCost.dodge);
    setPlayerDodging(true);
    setTimeout(() => setPlayerDodging(false), FIGHTER_DEFAULTS.dodgeDuration);
  }, [playerDodging, playerStamina]);

  // ── AI ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); return; }
    function aiTick() {
      if (gpRef.current !== 'fight') return;
      const roll = Math.random();
      if (roll < AI_CONFIG.dodgeChance) {
        setOpDodging(true);
        setTimeout(() => setOpDodging(false), FIGHTER_DEFAULTS.dodgeDuration);
      } else if (roll < AI_CONFIG.dodgeChance + AI_CONFIG.blockChance) {
        setOpBlocking(true);
        setOpAnim(getAnim(OPPONENT_SPRITE, 'block'));
        setTimeout(() => { setOpBlocking(false); if (gpRef.current === 'fight') setOpAnim('idle'); }, 600);
      } else if (!opCooldownRef.current && opStamina >= 12) {
        const attacks = ['jab', 'cross', 'hook', 'uppercut'];
        const weights = [0.4, 0.3, 0.2, 0.1];
        let r = Math.random(), atk = 'jab', c = 0;
        for (let i = 0; i < attacks.length; i++) { c += weights[i]; if (r <= c) { atk = attacks[i]; break; } }
        opCooldownRef.current = true;
        setOpStamina(prev => Math.max(0, prev - FIGHTER_DEFAULTS.staminaCost[atk]));
        setOpAnim(getAnim(OPPONENT_SPRITE, ATTACK_ANIMS[atk] || 'attack1'));
        setTimeout(() => dealDamageToPlayer(atk), FIGHTER_DEFAULTS.attackCooldown[atk] * 0.4);
        setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); opCooldownRef.current = false; }, FIGHTER_DEFAULTS.attackCooldown[atk]);
        if (Math.random() < AI_CONFIG.comboChance) {
          setTimeout(() => {
            if (gpRef.current !== 'fight') return;
            opCooldownRef.current = true;
            setOpAnim(getAnim(OPPONENT_SPRITE, 'attack2'));
            setOpStamina(prev => Math.max(0, prev - 10));
            setTimeout(() => dealDamageToPlayer('cross'), 200);
            setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); opCooldownRef.current = false; }, 500);
          }, FIGHTER_DEFAULTS.attackCooldown[atk] + 100);
        }
      }
      aiTimerRef.current = setTimeout(aiTick, AI_CONFIG.attackIntervalMin + Math.random() * (AI_CONFIG.attackIntervalMax - AI_CONFIG.attackIntervalMin));
    }
    aiTimerRef.current = setTimeout(aiTick, AI_CONFIG.reactionMs);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [gamePhase, opStamina, dealDamageToPlayer]);

  // ── Stamina regen ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setPlayerStamina(prev => clamp(prev + FIGHTER_DEFAULTS.staminaRegen, 0, FIGHTER_DEFAULTS.maxStamina));
      setOpStamina(prev => clamp(prev + FIGHTER_DEFAULTS.staminaRegen, 0, FIGHTER_DEFAULTS.maxStamina));
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    timerRef.current = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gamePhase]);

  // ── Movement ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      const k = keysRef.current;
      if (k['a'] || k['arrowleft']) {
        setPlayerX(prev => clamp(prev - 1.2, 5, 85));
        if (!playerCooldownRef.current) setPlayerAnim(prev => prev === 'idle' ? 'walk' : prev);
      } else if (k['d'] || k['arrowright']) {
        setPlayerX(prev => clamp(prev + 1.2, 5, 85));
        if (!playerCooldownRef.current) setPlayerAnim(prev => prev === 'idle' ? 'walk' : prev);
      } else {
        setPlayerAnim(prev => prev === 'walk' ? 'idle' : prev);
      }
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── AI movement ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setOpX(prev => {
        const target = pxRef.current + 22;
        const diff = target - prev;
        if (Math.abs(diff) < 1.5) return prev;
        return clamp(prev + Math.sign(diff) * (Math.abs(diff) > 15 ? 0.7 : 0.35), 10, 90);
      });
    }, 60);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── KO detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    if (playerHp <= 0) {
      setPlayerAnim('death'); setAnnouncement('K.O.!'); setGamePhase('ko'); triggerShake();
      setTimeout(() => { setOpWins(prev => prev + 1); setGamePhase('roundEnd'); }, 1500);
      return;
    }
    if (opHp <= 0) {
      setOpAnim('death'); setAnnouncement('K.O.!'); setGamePhase('ko'); triggerShake();
      setTimeout(() => { setPlayerWins(prev => prev + 1); setGamePhase('roundEnd'); }, 1500);
      return;
    }
    if (timer <= 0) {
      if (playerHp >= opHp) setPlayerWins(prev => prev + 1);
      else setOpWins(prev => prev + 1);
      setAnnouncement('TIME!'); setGamePhase('roundEnd');
    }
  }, [gamePhase, playerHp, opHp, timer, triggerShake]);

  // ── Round transitions ──────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'roundEnd') return;
    const pw = playerWins, ow = opWins, need = Math.ceil(MAX_ROUNDS / 2);
    const tid = setTimeout(() => {
      if (pw >= need) { setAnnouncement('YOU WIN!'); setGamePhase('matchEnd'); }
      else if (ow >= need) { setAnnouncement('YOU LOSE!'); setGamePhase('matchEnd'); }
      else {
        setRound(prev => prev + 1);
        setPlayerHp(FIGHTER_DEFAULTS.maxHp); setOpHp(FIGHTER_DEFAULTS.maxHp);
        setPlayerStamina(FIGHTER_DEFAULTS.maxStamina); setOpStamina(FIGHTER_DEFAULTS.maxStamina);
        setPlayerAnim('idle'); setOpAnim('idle');
        setTimer(ROUND_TIME); setPlayerX(25); setOpX(65);
        setAnnouncement(`ROUND ${round + 1}`); setGamePhase('ready');
      }
    }, 2000);
    return () => clearTimeout(tid);
  }, [gamePhase, playerWins, opWins, round]);

  // ── Ready → Fight ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'ready') return;
    const t1 = setTimeout(() => setAnnouncement('READY...'), 500);
    const t2 = setTimeout(() => setAnnouncement('FIGHT!'), 1800);
    const t3 = setTimeout(() => { setAnnouncement(''); setGamePhase('fight'); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [gamePhase]);

  // ── Restart ────────────────────────────────────────────────────────────
  const restartMatch = useCallback(() => {
    setRound(1); setTimer(ROUND_TIME);
    setPlayerHp(FIGHTER_DEFAULTS.maxHp); setOpHp(FIGHTER_DEFAULTS.maxHp);
    setPlayerStamina(FIGHTER_DEFAULTS.maxStamina); setOpStamina(FIGHTER_DEFAULTS.maxStamina);
    setPlayerAnim('idle'); setOpAnim('idle');
    setPlayerWins(0); setOpWins(0);
    setPlayerX(25); setOpX(65);
    setFloats([]); setAnnouncement('G.K.O. BOXING'); setGamePhase('ready');
  }, []);

  // ── Input ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    if (gpRef.current === 'matchEnd' && key === 'enter') { restartMatch(); return; }
    if (gpRef.current !== 'fight') return;
    if (key === ' ') { e.preventDefault(); playerDodge(); }
    if (key === 'shift') { setPlayerBlocking(true); setPlayerAnim(getAnim(PLAYER_SPRITE, 'block')); }
    if (key === 'q') playerAttack('hook');
    if (key === 'e') playerAttack('uppercut');
  }, [playerDodge, playerAttack, restartMatch]);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = false;
    if (key === 'shift') {
      setPlayerBlocking(false);
      setPlayerAnim(prev => prev === getAnim(PLAYER_SPRITE, 'block') ? 'idle' : prev);
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (gpRef.current !== 'fight') return;
    if (e.button === 0) playerAttack('jab');
    if (e.button === 2) playerAttack('cross');
  }, [playerAttack]);

  // ── Render fighter ─────────────────────────────────────────────────────
  const renderFighter = (spriteData, anim, x, flip, dodging, blocking, side) => {
    const dodgeDir = side === 'left' ? 1 : -1;
    const fighterDir = flip ? -1 : 1;
    return (
      <div style={{
        position: 'absolute', left: `${x}%`, bottom: '12%',
        transform: 'translateX(-50%)', zIndex: 20,
      }}>
        <div style={{
          '--fighter-dir': fighterDir, '--dodge-dir': dodgeDir,
          animation: dodging ? `dodgeTilt ${FIGHTER_DEFAULTS.dodgeDuration}ms ease-in-out` : 'none',
          transformOrigin: 'bottom center',
          transform: blocking ? `scaleX(${fighterDir}) scaleY(0.92)` : `scaleX(${fighterDir})`,
          transition: blocking ? 'transform 0.1s' : 'none',
          filter: blocking ? 'brightness(0.85)' : 'none',
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
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 12, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
        }} />
      </div>
    );
  };

  const announcementColor = announcement === 'K.O.!' ? '#ff3333'
    : announcement.includes('WIN') ? '#48bb78'
    : announcement.includes('LOSE') ? '#e53e3e' : '#ffd700';

  return (
    <div
      ref={containerRef} tabIndex={0}
      onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown} onContextMenu={e => e.preventDefault()}
      style={{
        width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
        cursor: 'crosshair', outline: 'none', userSelect: 'none',
      }}
    >
      {/* Arena background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/colosseum_arena.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center bottom',
        filter: 'brightness(0.45) saturate(0.7)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Shake wrapper */}
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        animation: screenShake ? 'gkoShake 0.3s ease-out' : 'none',
      }}>
        {/* Ring floor */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%',
          background: 'linear-gradient(180deg, rgba(61,43,31,0.8), rgba(42,28,18,0.9))',
          borderTop: '3px solid #8b7355', zIndex: 2,
        }}>
          {[22, 42, 62].map(pct => (
            <div key={pct} style={{
              position: 'absolute', top: `-${pct}vh`, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, transparent 2%, #aa8866 5%, #cc9966 50%, #aa8866 95%, transparent 98%)',
              opacity: 0.35, animation: 'ringRopesBounce 2s ease-in-out infinite', zIndex: 2,
            }} />
          ))}
        </div>
        {[3, 97].map(x => (
          <div key={x} style={{
            position: 'absolute', bottom: '13%', left: `${x}%`, width: 8, height: 180,
            background: 'linear-gradient(180deg, #ffd700, #8b7355)', borderRadius: 4, zIndex: 5,
          }} />
        ))}

        {/* HUD */}
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ width: '38%' }}>
            <HealthBar current={playerHp} max={FIGHTER_DEFAULTS.maxHp} label="PLAYER" color="#3b82f6" side="left" />
            <StaminaBar current={playerStamina} max={FIGHTER_DEFAULTS.maxStamina} side="left" />
          </div>
          <RoundDisplay round={round} timer={timer} playerWins={playerWins} opponentWins={opWins} />
          <div style={{ width: '38%' }}>
            <HealthBar current={opHp} max={FIGHTER_DEFAULTS.maxHp} label="OPPONENT" color="#e53e3e" side="right" />
            <StaminaBar current={opStamina} max={FIGHTER_DEFAULTS.maxStamina} side="right" />
          </div>
        </div>

        {/* Fighters */}
        {renderFighter(PLAYER_SPRITE, playerAnim, playerX, false, playerDodging, playerBlocking, 'left')}
        {renderFighter(OPPONENT_SPRITE, opAnim, opX, true, opDodging, opBlocking, 'right')}

        {/* Floating texts */}
        <FloatingTexts items={floats} />

        {/* Announcement */}
        {announcement && (
          <div style={{
            position: 'absolute', top: '28%', left: 0, right: 0, textAlign: 'center',
            zIndex: 200, pointerEvents: 'none',
          }}>
            <span style={{
              color: announcementColor,
              fontFamily: "'Press Start 2P', monospace",
              fontSize: announcement.length > 10 ? '1.6rem' : '2.4rem',
              textShadow: `0 0 20px ${announcementColor}88, 3px 3px 0 #000, -1px -1px 0 #000`,
              letterSpacing: 4, animation: 'announceSlam 1.5s ease-out forwards',
            }}>{announcement}</span>
          </div>
        )}

        {gamePhase === 'matchEnd' && (
          <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}>
            <button onClick={restartMatch} style={{
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)', border: '2px solid #fff',
              borderRadius: 8, padding: '12px 32px', cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem',
              color: '#000', letterSpacing: 2, boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
            }}>REMATCH (ENTER)</button>
          </div>
        )}

        <a href="/" style={{
          position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)',
          color: '#888', fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem',
          textDecoration: 'none', zIndex: 100, padding: '4px 10px',
          background: 'rgba(0,0,0,0.6)', borderRadius: 4, border: '1px solid #444',
        }}>← BACK</a>

        <ControlsHUD />
      </div>
    </div>
  );
}
