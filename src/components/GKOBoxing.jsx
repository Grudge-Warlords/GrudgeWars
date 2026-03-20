import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { spriteSheets } from '../data/spriteMap';

// ═══════════════════════════════════════════════════════════════════════
// FIGHTER SPRITE DEFINITIONS
// Each fighter has its own sprite sheet paths and frame counts.
// Drop your PNGs into public/sprites/boxer-raze/ and boxer-vex/
// If the boxer sheets aren't found, we fall back to existing RPG sprites.
// ═══════════════════════════════════════════════════════════════════════

const BOXER_RAZE = {
  frameWidth: 64,
  frameHeight: 64,
  idle:     { src: '/sprites/boxer-raze/idle.png', frames: 7 },
  walk:     { src: '/sprites/boxer-raze/walk.png', frames: 6 },
  jab:      { src: '/sprites/boxer-raze/jab.png', frames: 5 },
  walkjab:  { src: '/sprites/boxer-raze/walkjab.png', frames: 5 },
  cross:    { src: '/sprites/boxer-raze/cross.png', frames: 4 },
  lowkick:  { src: '/sprites/boxer-raze/lowkick.png', frames: 5 },
  midkick:  { src: '/sprites/boxer-raze/midkick.png', frames: 5 },
  block:    { src: '/sprites/boxer-raze/block.png', frames: 2 },
  stun:     { src: '/sprites/boxer-raze/stun.png', frames: 4 },
  hurt:     { src: '/sprites/boxer-raze/hurt.png', frames: 2 },
  death:    { src: '/sprites/boxer-raze/death.png', frames: 4 },
  win:      { src: '/sprites/boxer-raze/win.png', frames: 4 },
  // Fallbacks if boxer sheets not yet added
  attack1:  { src: '/sprites/boxer-raze/jab.png', frames: 5 },
  attack2:  { src: '/sprites/boxer-raze/cross.png', frames: 4 },
};

const BOXER_VEX = {
  frameWidth: 64,
  frameHeight: 64,
  idle:     { src: '/sprites/boxer-vex/idle.png', frames: 7 },
  walk:     { src: '/sprites/boxer-vex/walk.png', frames: 6 },
  jab:      { src: '/sprites/boxer-vex/jab.png', frames: 5 },
  walkjab:  { src: '/sprites/boxer-vex/walkjab.png', frames: 5 },
  cross:    { src: '/sprites/boxer-vex/cross.png', frames: 4 },
  lowkick:  { src: '/sprites/boxer-vex/lowkick.png', frames: 5 },
  midkick:  { src: '/sprites/boxer-vex/midkick.png', frames: 5 },
  block:    { src: '/sprites/boxer-vex/block.png', frames: 2 },
  stun:     { src: '/sprites/boxer-vex/stun.png', frames: 4 },
  hurt:     { src: '/sprites/boxer-vex/hurt.png', frames: 2 },
  death:    { src: '/sprites/boxer-vex/death.png', frames: 4 },
  win:      { src: '/sprites/boxer-vex/win.png', frames: 4 },
  attack1:  { src: '/sprites/boxer-vex/jab.png', frames: 5 },
  attack2:  { src: '/sprites/boxer-vex/cross.png', frames: 4 },
};

// Fallback to existing RPG sprites if boxer sheets not loaded
const FALLBACK_PLAYER = spriteSheets['hero-knight'];
const FALLBACK_OPPONENT = spriteSheets['fantasy-warrior'];

// Try to use boxer sprites, fall back to RPG sprites
function useFighterSprite(boxerSprite, fallback) {
  const [valid, setValid] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setValid(true);
    img.onerror = () => setValid(false);
    img.src = boxerSprite.idle.src;
  }, [boxerSprite.idle.src]);
  if (valid === null) return fallback; // loading
  return valid ? boxerSprite : fallback;
}

// ═══════════════════════════════════════════════════════════════════════
// MOVE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

const MOVES = {
  jab:     { anim: 'jab', damage: 5,  stamina: 6,  cooldown: 300,  hitFrame: 0.35 },
  walkjab: { anim: 'walkjab', damage: 7,  stamina: 8,  cooldown: 350,  hitFrame: 0.4 },
  cross:   { anim: 'cross', damage: 10, stamina: 14, cooldown: 500,  hitFrame: 0.4 },
  lowkick: { anim: 'lowkick', damage: 12, stamina: 16, cooldown: 600,  hitFrame: 0.45 },
  midkick: { anim: 'midkick', damage: 14, stamina: 18, cooldown: 650,  hitFrame: 0.45 },
};

// Combo-assisted finisher versions (J+J then K/I/O)
const COMBO_FINISHERS = {
  cross:   { damage: 18, stamina: 20, cooldown: 700, effect: 'slam',   label: 'POWER CROSS' },
  lowkick: { damage: 22, stamina: 24, cooldown: 800, effect: 'sweep',  label: 'SPIN KICK' },
  midkick: { damage: 20, stamina: 22, cooldown: 750, effect: 'flurry', label: 'FLURRY KICK' },
};

// Special abilities per fighter (spacebar)
const SPECIALS = {
  raze: {
    name: 'FLYING LUNGE',
    damage: 30,
    stamina: 40,
    cooldown: 10000, // 10 seconds
    // Lunge forward, double punch, reverse back
    sequence: [
      { action: 'lunge_forward', duration: 300, distance: 15 },
      { action: 'play_anim', anim: 'win', duration: 400 },
      { action: 'play_anim_reverse', anim: 'win', duration: 400 },
      { action: 'lunge_back', duration: 300 },
    ],
  },
  vex: {
    name: 'FLURRY BARRAGE',
    damage: 25,
    stamina: 35,
    cooldown: 10000,
    // Midkick frames 2-3 oscillated rapidly
    sequence: [
      { action: 'flurry_anim', anim: 'midkick', startFrame: 1, endFrame: 2, repeats: 6, duration: 600 },
      { action: 'play_anim', anim: 'cross', duration: 350 },
    ],
  },
};

const ROUND_TIME = 99;
const MAX_ROUNDS = 3;
const BLOCK_REDUCTION = 0.75;
const HIT_RANGE = 30;
const COMBO_WINDOW = 600; // ms to chain next input

const AI_CONFIG = {
  reactionMs: 600,
  attackMin: 800,
  attackMax: 2000,
  blockChance: 0.25,
  dodgeChance: 0.12,
  comboChance: 0.2,
  specialChance: 0.08,
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ═══════════════════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════════════════
const SFX = { light: '/audio/swish_2.wav', medium: '/audio/swish_3.wav', heavy: '/audio/swish_4.wav' };
function playSfx(weight) {
  try { const a = new Audio(SFX[weight] || SFX.light); a.volume = 0.35; a.play().catch(() => {}); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (Health/Stamina/Round/Controls/FloatingText)
// ═══════════════════════════════════════════════════════════════════════

function HealthBar({ current, max, label, color = '#e53e3e', side = 'left' }) {
  const pct = clamp((current / max) * 100, 0, 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: side === 'left' ? 'flex-start' : 'flex-end', width: '100%' }}>
      <span style={{ color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', marginBottom: 2, textShadow: '1px 1px 2px #000' }}>{label}</span>
      <div style={{ width: '100%', height: 18, background: '#1a1a2e', border: '2px solid #333', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, [side]: 0, height: '100%', width: `${pct}%`, background: pct > 50 ? color : pct > 25 ? '#f6ad55' : '#e53e3e', transition: 'width 0.15s ease-out', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15)' }} />
        <span style={{ position: 'absolute', width: '100%', textAlign: 'center', top: 2, fontSize: '0.5rem', color: '#fff', fontFamily: "'Press Start 2P', monospace", textShadow: '1px 1px 1px #000' }}>{Math.ceil(current)}/{max}</span>
      </div>
    </div>
  );
}

function StaminaBar({ current, max, side = 'left' }) {
  const pct = clamp((current / max) * 100, 0, 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct > 40 ? '#48bb78' : '#ecc94b', transition: 'width 0.1s ease-out', float: side === 'left' ? 'left' : 'right' }} />
      </div>
    </div>
  );
}

function SpecialCooldownBar({ cooldownPct, name }) {
  const ready = cooldownPct <= 0;
  return (
    <div style={{ width: '100%', marginTop: 2 }}>
      <div style={{ width: '100%', height: 6, background: '#1a1a2e', border: '1px solid #333', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${ready ? 100 : 100 - cooldownPct}%`, background: ready ? '#ffd700' : '#555', transition: 'width 0.2s', borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.35rem', color: ready ? '#ffd700' : '#666', fontFamily: "'Press Start 2P', monospace" }}>
        {ready ? `[SPACE] ${name}` : 'SPECIAL'}
      </span>
    </div>
  );
}

function RoundDisplay({ round, timer, playerWins, opponentWins }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ color: '#ffd700', fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', textShadow: '0 0 8px rgba(255,215,0,0.6)' }}>ROUND {round}</span>
      <span style={{ color: timer <= 10 ? '#ff4444' : '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: '1.4rem', textShadow: timer <= 10 ? '0 0 12px rgba(255,50,50,0.8)' : '0 0 12px rgba(255,100,100,0.5)', animation: timer <= 10 ? 'timerPulse 0.5s ease-in-out infinite' : 'none' }}>{timer}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[...Array(MAX_ROUNDS)].map((_, i) => <div key={`pw${i}`} style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid #555', background: i < playerWins ? '#48bb78' : '#222' }} />)}
        <span style={{ color: '#666', fontSize: '0.5rem', alignSelf: 'center' }}>vs</span>
        {[...Array(MAX_ROUNDS)].map((_, i) => <div key={`ow${i}`} style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid #555', background: i < opponentWins ? '#e53e3e' : '#222' }} />)}
      </div>
    </div>
  );
}

function ControlsHUD() {
  const keys = [
    { key: 'J', action: 'Jab' }, { key: 'K', action: 'Cross' },
    { key: 'I', action: 'Low Kick' }, { key: 'O', action: 'Mid Kick' },
    { key: 'SHIFT', action: 'Block' }, { key: 'SPACE', action: 'Special' },
    { key: 'A/D', action: 'Move' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: 8, border: '1px solid #444', zIndex: 100 }}>
      {keys.map(k => (
        <div key={k.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{ background: '#333', color: '#ffd700', padding: '2px 6px', borderRadius: 3, fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', border: '1px solid #555', minWidth: 22, textAlign: 'center' }}>{k.key}</span>
          <span style={{ color: '#aaa', fontSize: '0.35rem', fontFamily: 'monospace' }}>{k.action}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ background: '#553300', color: '#ffd700', padding: '2px 6px', borderRadius: 3, fontFamily: "'Press Start 2P', monospace", fontSize: '0.35rem', border: '1px solid #886622' }}>J+J+K/I/O</span>
        <span style={{ color: '#ff8c00', fontSize: '0.3rem', fontFamily: 'monospace' }}>Combo</span>
      </div>
    </div>
  );
}

function FloatingTexts({ items }) {
  return items.map(item => (
    <span key={item.id} style={{ position: 'absolute', left: item.x, top: item.y || '40%', color: item.color || '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: item.size || '0.6rem', fontWeight: 900, textShadow: '2px 2px 0 #000, -1px -1px 0 #000', animation: 'actionFloat 0.9s ease-out forwards', pointerEvents: 'none', zIndex: 65, whiteSpace: 'nowrap' }}>{item.text}</span>
  ));
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ARENA_BG = '/sprites/arena-pack/3 Background/Night/BackgroundNight.png';

export default function GKOBoxing({ playerStats, opponentConfig, onFightEnd }) {
  // Resolve sprites (try boxer, fall back to RPG)
  const playerSprite = useFighterSprite(BOXER_RAZE, FALLBACK_PLAYER);
  const opponentSprite = useFighterSprite(BOXER_VEX, FALLBACK_OPPONENT);

  // Scale stats from campaign (defaults for standalone play)
  const str = playerStats?.strength || 10;
  const spd = playerStats?.speed || 10;
  const hp = playerStats?.health || 10;
  const dmgMult = 1 + (str - 10) * 0.02; // +2% damage per STR above 10
  const spdMult = 1 - (spd - 10) * 0.005; // -0.5% cooldown per SPD above 10
  const maxHp = Math.round(100 + (hp - 10) * 2); // +2 HP per health point above 10
  const aiDiff = opponentConfig?.difficulty || 1.0;
  const opMaxHp = Math.round(100 * aiDiff);
  const onFightEndRef = useRef(onFightEnd);
  onFightEndRef.current = onFightEnd;

  const [playerHp, setPlayerHp] = useState(maxHp);
  const [playerStamina, setPlayerStamina] = useState(100);
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [playerX, setPlayerX] = useState(25);
  const [playerDodging, setPlayerDodging] = useState(false);
  const [playerBlocking, setPlayerBlocking] = useState(false);
  const [playerStunned, setPlayerStunned] = useState(false);
  const [playerSpecialCd, setPlayerSpecialCd] = useState(0);

  const [opHp, setOpHp] = useState(opMaxHp);
  const [opStamina, setOpStamina] = useState(100);
  const [opAnim, setOpAnim] = useState('idle');
  const [opX, setOpX] = useState(65);
  const [opDodging, setOpDodging] = useState(false);
  const [opBlocking, setOpBlocking] = useState(false);
  const [opStunned, setOpStunned] = useState(false);
  const [opSpecialCd, setOpSpecialCd] = useState(0);

  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [playerWins, setPlayerWins] = useState(0);
  const [opWins, setOpWins] = useState(0);
  const [gamePhase, setGamePhase] = useState('ready');
  const [announcement, setAnnouncement] = useState('G.K.O. BOXING');
  const [floats, setFloats] = useState([]);
  const [screenShake, setScreenShake] = useState(false);

  // Combo tracking
  const [comboBuffer, setComboBuffer] = useState([]);
  const comboTimerRef = useRef(null);

  // Refs
  const keysRef = useRef({});
  const pcRef = useRef(false); // player cooldown
  const ocRef = useRef(false); // opponent cooldown
  const aiRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const floatIdRef = useRef(0);
  const containerRef = useRef(null);
  const gpRef = useRef(gamePhase);
  const pxRef = useRef(playerX);
  const oxRef = useRef(opX);
  const pdRef = useRef(playerDodging);
  const pbRef = useRef(playerBlocking);
  const odRef = useRef(opDodging);
  const obRef = useRef(opBlocking);
  const psRef = useRef(playerStunned);
  const osRef = useRef(opStunned);
  const specialInProgressRef = useRef(false);

  useEffect(() => { gpRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { pxRef.current = playerX; }, [playerX]);
  useEffect(() => { oxRef.current = opX; }, [opX]);
  useEffect(() => { pdRef.current = playerDodging; }, [playerDodging]);
  useEffect(() => { pbRef.current = playerBlocking; }, [playerBlocking]);
  useEffect(() => { odRef.current = opDodging; }, [opDodging]);
  useEffect(() => { obRef.current = opBlocking; }, [opBlocking]);
  useEffect(() => { psRef.current = playerStunned; }, [playerStunned]);
  useEffect(() => { osRef.current = opStunned; }, [opStunned]);

  // ── Styles ─────────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @keyframes actionFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-50px) scale(0.7); opacity: 0; } }
      @keyframes announceSlam { 0% { transform: scale(3); opacity: 0; } 30% { transform: scale(1); opacity: 1; } 80% { opacity: 1; } 100% { transform: scale(0.8) translateY(-20px); opacity: 0; } }
      @keyframes gkoDodgeTilt {
        0% { transform: rotate(0deg) translateX(0); }
        30% { transform: rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 10px)); }
        70% { transform: rotate(calc(var(--dodge-dir, 1) * -12deg)) translateX(calc(var(--dodge-dir, 1) * 10px)); }
        100% { transform: rotate(0deg) translateX(0); }
      }
      @keyframes gkoShake { 0% { transform: translate(0,0); } 15% { transform: translate(-4px,2px); } 30% { transform: translate(4px,-2px); } 45% { transform: translate(-3px,-1px); } 60% { transform: translate(3px,1px); } 100% { transform: translate(0,0); } }
      @keyframes timerPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      @keyframes specialFlash { 0% { filter: brightness(1); } 25% { filter: brightness(2) saturate(2); } 50% { filter: brightness(1.5); } 100% { filter: brightness(1); } }
      @keyframes stunStars { 0% { transform: translateY(0) rotate(0deg); opacity: 0.9; } 100% { transform: translateY(-8px) rotate(360deg); opacity: 0; } }
      @keyframes ringRopesBounce { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
      @keyframes comboFlash { 0% { box-shadow: 0 0 0 rgba(255,215,0,0); } 50% { box-shadow: 0 0 30px rgba(255,215,0,0.6); } 100% { box-shadow: 0 0 0 rgba(255,215,0,0); } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { containerRef.current?.focus(); }, []);

  // ── Helpers ─────────────────────────────────────────────────────────
  const spawnFloat = useCallback((text, xPct, color, yPct, size) => {
    const id = ++floatIdRef.current;
    setFloats(prev => [...prev, { id, text, x: `${xPct}%`, y: yPct || '40%', color, size }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1000);
  }, []);

  const triggerShake = useCallback(() => { setScreenShake(true); setTimeout(() => setScreenShake(false), 300); }, []);

  const inRange = useCallback(() => Math.abs(pxRef.current - oxRef.current) <= HIT_RANGE, []);

  // Resolve animation name with fallback
  const getAnim = useCallback((sprite, animName) => {
    if (sprite?.[animName]) return animName;
    if (animName === 'jab') return sprite?.attack1 ? 'attack1' : 'idle';
    if (animName === 'cross') return sprite?.attack2 ? 'attack2' : 'attack1';
    if (animName === 'lowkick') return sprite?.attack2 ? 'attack2' : 'attack1';
    if (animName === 'midkick') return sprite?.attack3 ? 'attack3' : sprite?.attack2 ? 'attack2' : 'attack1';
    if (animName === 'walkjab') return sprite?.attack1 ? 'attack1' : 'idle';
    if (animName === 'block') return sprite?.block ? 'block' : sprite?.hurt ? 'hurt' : 'idle';
    if (animName === 'stun') return sprite?.stun ? 'stun' : sprite?.hurt ? 'hurt' : 'idle';
    if (animName === 'win') return sprite?.win ? 'win' : 'idle';
    return 'idle';
  }, []);

  // ── Damage ─────────────────────────────────────────────────────────
  const dealDamageToOpponent = useCallback((damage, label, weight) => {
    playSfx(weight);
    spawnFloat(label, pxRef.current + 5, '#ffd700', '55%', '0.5rem');
    if (!inRange()) { spawnFloat('MISS', oxRef.current, '#888', '35%'); return; }
    if (odRef.current) { spawnFloat('DODGED', oxRef.current, '#66d9ef', '35%'); return; }
    let dmg = damage;
    if (obRef.current) { dmg = Math.round(dmg * (1 - BLOCK_REDUCTION)); spawnFloat('BLOCKED', oxRef.current, '#aaa', '30%'); }
    setOpHp(prev => Math.max(0, prev - dmg));
    spawnFloat(`-${dmg}`, oxRef.current, dmg >= 15 ? '#ff4444' : '#ff8888', '35%', dmg >= 15 ? '1rem' : '0.8rem');
    if (!obRef.current) { setOpAnim('hurt'); setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); }, 350); }
    if (dmg >= 12) triggerShake();
    // Stun on heavy hits
    if (dmg >= 20 && !obRef.current) {
      setOpStunned(true);
      setOpAnim('stun');
      setTimeout(() => { setOpStunned(false); if (gpRef.current === 'fight') setOpAnim('idle'); }, 800);
    }
  }, [spawnFloat, inRange, triggerShake]);

  const dealDamageToPlayer = useCallback((damage, weight) => {
    playSfx(weight);
    if (!inRange()) return;
    if (pdRef.current) { spawnFloat('DODGED', pxRef.current, '#66d9ef', '35%'); return; }
    let dmg = damage;
    if (pbRef.current) { dmg = Math.round(dmg * (1 - BLOCK_REDUCTION)); spawnFloat('BLOCKED', pxRef.current, '#aaa', '30%'); }
    setPlayerHp(prev => Math.max(0, prev - dmg));
    spawnFloat(`-${dmg}`, pxRef.current, dmg >= 15 ? '#ff4444' : '#ff8888', '35%', dmg >= 15 ? '1rem' : '0.8rem');
    if (!pbRef.current) { setPlayerAnim('hurt'); setTimeout(() => { if (gpRef.current === 'fight') setPlayerAnim('idle'); }, 350); }
    if (dmg >= 12) triggerShake();
    if (dmg >= 20 && !pbRef.current) {
      setPlayerStunned(true);
      setPlayerAnim('stun');
      setTimeout(() => { setPlayerStunned(false); if (gpRef.current === 'fight') setPlayerAnim('idle'); }, 800);
    }
  }, [spawnFloat, inRange, triggerShake]);

  // ── Execute move ───────────────────────────────────────────────────
  const executeMove = useCallback((moveKey, isComboFinisher) => {
    if (pcRef.current || gpRef.current !== 'fight' || psRef.current || specialInProgressRef.current) return;
    const moveDef = MOVES[moveKey];
    if (!moveDef) return;
    const finisher = isComboFinisher ? COMBO_FINISHERS[moveKey] : null;
    const damage = finisher ? finisher.damage : moveDef.damage;
    const stamCost = finisher ? finisher.stamina : moveDef.stamina;
    const cd = finisher ? finisher.cooldown : moveDef.cooldown;
    const weight = damage >= 15 ? 'heavy' : damage >= 8 ? 'medium' : 'light';

    if (playerStamina < stamCost) return;
    pcRef.current = true;
    setPlayerStamina(prev => Math.max(0, prev - stamCost));

    const resolvedAnim = getAnim(playerSprite, moveDef.anim);
    setPlayerAnim(resolvedAnim);

    const scaledDmg = Math.round(damage * dmgMult);
    const scaledCd = Math.round(cd * Math.max(0.5, spdMult));

    if (finisher) {
      spawnFloat(finisher.label, pxRef.current, '#ff8c00', '50%', '0.7rem');
      if (finisher.effect === 'sweep') {
        const startX = pxRef.current;
        setPlayerX(prev => clamp(prev + 8, 5, 85));
        setTimeout(() => setPlayerX(startX), scaledCd * 0.6);
      }
    }

    setTimeout(() => dealDamageToOpponent(scaledDmg, finisher?.label || moveKey.toUpperCase(), weight), scaledCd * moveDef.hitFrame);
    setTimeout(() => { if (gpRef.current === 'fight') setPlayerAnim('idle'); pcRef.current = false; }, Math.round(FIGHTER_DEFAULTS.attackCooldown[attackType] * Math.max(0.5, spdMult)));
  }, [playerStamina, dealDamageToOpponent, dmgMult, spdMult]);

  // ── Special ability ────────────────────────────────────────────────
  const executeSpecial = useCallback(() => {
    if (pcRef.current || gpRef.current !== 'fight' || psRef.current || specialInProgressRef.current) return;
    if (playerSpecialCd > 0 || playerStamina < SPECIALS.raze.stamina) return;

    const spec = SPECIALS.raze;
    specialInProgressRef.current = true;
    pcRef.current = true;
    setPlayerStamina(prev => Math.max(0, prev - spec.stamina));
    setPlayerSpecialCd(spec.cooldown);
    spawnFloat(spec.name, pxRef.current, '#ffd700', '45%', '0.8rem');

    // Execute sequence
    const startX = pxRef.current;
    let delay = 0;
    for (const step of spec.sequence) {
      const d = delay;
      if (step.action === 'lunge_forward') {
        setTimeout(() => setPlayerX(prev => clamp(prev + (step.distance || 12), 5, 85)), d);
      } else if (step.action === 'play_anim') {
        setTimeout(() => setPlayerAnim(getAnim(playerSprite, step.anim)), d);
      } else if (step.action === 'play_anim_reverse') {
        // Just replay same anim (SpriteAnimation doesn't support reverse, but visually works)
        setTimeout(() => { setPlayerAnim('idle'); setTimeout(() => setPlayerAnim(getAnim(playerSprite, step.anim)), 30); }, d);
      } else if (step.action === 'lunge_back') {
        setTimeout(() => setPlayerX(startX), d);
      } else if (step.action === 'flurry_anim') {
        setTimeout(() => setPlayerAnim(getAnim(playerSprite, step.anim)), d);
      }
      delay += step.duration;
    }
    // Deal damage at midpoint
    setTimeout(() => dealDamageToOpponent(spec.damage, spec.name, 'heavy'), delay * 0.5);
    // Finish
    setTimeout(() => {
      if (gpRef.current === 'fight') setPlayerAnim('idle');
      pcRef.current = false;
      specialInProgressRef.current = false;
    }, delay);
  }, [playerStamina, playerSpecialCd, playerSprite, getAnim, dealDamageToOpponent, spawnFloat]);

  // ── Combo buffer ───────────────────────────────────────────────────
  const handleAttackInput = useCallback((moveKey) => {
    if (gpRef.current !== 'fight' || psRef.current) return;

    setComboBuffer(prev => {
      const now = Date.now();
      const recent = prev.filter(e => now - e.time < COMBO_WINDOW);
      const updated = [...recent, { key: moveKey, time: now }];

      // Check for J+J+K/I/O combo
      if (updated.length >= 3) {
        const last3 = updated.slice(-3);
        if (last3[0].key === 'jab' && last3[1].key === 'jab' && ['cross', 'lowkick', 'midkick'].includes(last3[2].key)) {
          // Combo finisher!
          setTimeout(() => executeMove(last3[2].key, true), 0);
          return []; // clear buffer
        }
      }

      // Check J+J walkjab
      if (updated.length >= 2) {
        const last2 = updated.slice(-2);
        const isMoving = keysRef.current['a'] || keysRef.current['d'] || keysRef.current['arrowleft'] || keysRef.current['arrowright'];
        if (last2[0].key === 'jab' && last2[1].key === 'jab' && isMoving) {
          setTimeout(() => executeMove('walkjab', false), 0);
          return [];
        }
      }

      // Normal attack
      setTimeout(() => executeMove(moveKey, false), 0);
      return updated;
    });
  }, [executeMove]);

  // ── Dodge (spacebar when no special, or special when ready) ────────
  const playerDodge = useCallback(() => {
    if (playerDodging || pcRef.current || gpRef.current !== 'fight' || psRef.current) return;
    if (playerStamina < 15) return;
    setPlayerStamina(prev => prev - 15);
    setPlayerDodging(true);
    setTimeout(() => setPlayerDodging(false), 400);
  }, [playerDodging, playerStamina]);

  // ── Special cooldown tick ──────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setPlayerSpecialCd(prev => Math.max(0, prev - 100));
      setOpSpecialCd(prev => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── AI ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') { if (aiRef.current) clearTimeout(aiRef.current); return; }
    function aiTick() {
      if (gpRef.current !== 'fight' || osRef.current) { aiRef.current = setTimeout(aiTick, 500); return; }
      const roll = Math.random();
      if (roll < AI_CONFIG.dodgeChance) {
        setOpDodging(true);
        setTimeout(() => setOpDodging(false), 400);
      } else if (roll < AI_CONFIG.dodgeChance + AI_CONFIG.blockChance) {
        setOpBlocking(true);
        setOpAnim(getAnim(opponentSprite, 'block'));
        setTimeout(() => { setOpBlocking(false); if (gpRef.current === 'fight') setOpAnim('idle'); }, 600);
      } else if (roll < AI_CONFIG.dodgeChance + AI_CONFIG.blockChance + AI_CONFIG.specialChance && opSpecialCd <= 0 && opStamina >= 35) {
        // AI special
        ocRef.current = true;
        setOpStamina(prev => Math.max(0, prev - 35));
        setOpSpecialCd(10000);
        setOpAnim(getAnim(opponentSprite, 'midkick'));
        spawnFloat('FLURRY BARRAGE', oxRef.current, '#ff8c00', '45%', '0.7rem');
        setTimeout(() => dealDamageToPlayer(25, 'heavy'), 300);
        setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); ocRef.current = false; }, 700);
      } else if (!ocRef.current && opStamina >= 8) {
        const moves = ['jab', 'jab', 'cross', 'lowkick', 'midkick'];
        const pick = moves[Math.floor(Math.random() * moves.length)];
        const move = MOVES[pick];
        ocRef.current = true;
        setOpStamina(prev => Math.max(0, prev - move.stamina));
        setOpAnim(getAnim(opponentSprite, move.anim));
    const aiDmg = Math.round(move.damage * aiDiff);
        const aiCd = Math.round(move.cooldown / aiDiff);
        setTimeout(() => dealDamageToPlayer(aiDmg, aiDmg >= 12 ? 'heavy' : 'medium'), aiCd * move.hitFrame);
        setTimeout(() => { if (gpRef.current === 'fight') setOpAnim('idle'); ocRef.current = false; }, aiCd);
      }
      aiRef.current = setTimeout(aiTick, AI_CONFIG.attackMin + Math.random() * (AI_CONFIG.attackMax - AI_CONFIG.attackMin));
    }
    aiRef.current = setTimeout(aiTick, AI_CONFIG.reactionMs);
    return () => { if (aiRef.current) clearTimeout(aiRef.current); };
  }, [gamePhase, opStamina, opSpecialCd, opponentSprite, getAnim, dealDamageToPlayer, spawnFloat]);

  // ── Stamina regen ──────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      setPlayerStamina(prev => clamp(prev + 0.35, 0, 100));
      setOpStamina(prev => clamp(prev + 0.35, 0, 100));
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── Timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => { if (prev <= 1) { clearInterval(timerIntervalRef.current); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [gamePhase]);

  // ── Movement ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    const id = setInterval(() => {
      if (psRef.current || specialInProgressRef.current) return;
      const k = keysRef.current;
      if (k['a'] || k['arrowleft']) {
        setPlayerX(prev => clamp(prev - 1.2, 5, 85));
        if (!pcRef.current) setPlayerAnim(prev => prev === 'idle' ? 'walk' : prev);
      } else if (k['d'] || k['arrowright']) {
        setPlayerX(prev => clamp(prev + 1.2, 5, 85));
        if (!pcRef.current) setPlayerAnim(prev => prev === 'idle' ? 'walk' : prev);
      } else {
        setPlayerAnim(prev => prev === 'walk' ? 'idle' : prev);
      }
    }, 50);
    return () => clearInterval(id);
  }, [gamePhase]);

  // ── AI movement ────────────────────────────────────────────────────
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

  // ── KO detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'fight') return;
    if (playerHp <= 0) {
      setPlayerAnim('death'); setAnnouncement('K.O.!'); setGamePhase('ko'); triggerShake();
      setTimeout(() => { setOpAnim(getAnim(opponentSprite, 'win')); }, 500);
      setTimeout(() => { setOpWins(prev => prev + 1); setGamePhase('roundEnd'); }, 2000);
      return;
    }
    if (opHp <= 0) {
      setOpAnim('death'); setAnnouncement('K.O.!'); setGamePhase('ko'); triggerShake();
      setTimeout(() => { setPlayerAnim(getAnim(playerSprite, 'win')); }, 500);
      setTimeout(() => { setPlayerWins(prev => prev + 1); setGamePhase('roundEnd'); }, 2000);
      return;
    }
    if (timer <= 0) {
      if (playerHp >= opHp) { setPlayerWins(prev => prev + 1); setPlayerAnim(getAnim(playerSprite, 'win')); }
      else { setOpWins(prev => prev + 1); setOpAnim(getAnim(opponentSprite, 'win')); }
      setAnnouncement('TIME!'); setGamePhase('roundEnd');
    }
  }, [gamePhase, playerHp, opHp, timer, triggerShake, playerSprite, opponentSprite, getAnim]);

  // ── Round transitions ──────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'roundEnd') return;
    const pw = playerWins, ow = opWins, need = Math.ceil(MAX_ROUNDS / 2);
    const tid = setTimeout(() => {
      if (pw >= need) {
        setAnnouncement('YOU WIN!'); setGamePhase('matchEnd');
        if (onFightEndRef.current) setTimeout(() => onFightEndRef.current('win'), 2000);
      } else if (ow >= need) {
        setAnnouncement('YOU LOSE!'); setGamePhase('matchEnd');
        if (onFightEndRef.current) setTimeout(() => onFightEndRef.current('lose'), 2000);
      } else {
        setRound(prev => prev + 1);
        setPlayerHp(maxHp); setOpHp(opMaxHp); setPlayerStamina(100); setOpStamina(100);
        setPlayerAnim('idle'); setOpAnim('idle'); setPlayerStunned(false); setOpStunned(false);
        setTimer(ROUND_TIME); setPlayerX(25); setOpX(65);
        setPlayerSpecialCd(0); setOpSpecialCd(0);
        setAnnouncement(`ROUND ${round + 1}`); setGamePhase('ready');
      }
    }, 2500);
    return () => clearTimeout(tid);
  }, [gamePhase, playerWins, opWins, round]);

  useEffect(() => {
    if (gamePhase !== 'ready') return;
    const t1 = setTimeout(() => setAnnouncement('READY...'), 500);
    const t2 = setTimeout(() => setAnnouncement('FIGHT!'), 1800);
    const t3 = setTimeout(() => { setAnnouncement(''); setGamePhase('fight'); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [gamePhase]);

  const restartMatch = useCallback(() => {
    setRound(1); setTimer(ROUND_TIME); setPlayerHp(maxHp); setOpHp(opMaxHp);
    setPlayerStamina(100); setOpStamina(100); setPlayerAnim('idle'); setOpAnim('idle');
    setPlayerWins(0); setOpWins(0); setPlayerX(25); setOpX(65);
    setPlayerStunned(false); setOpStunned(false); setPlayerSpecialCd(0); setOpSpecialCd(0);
    setFloats([]); setComboBuffer([]); setAnnouncement('G.K.O. BOXING'); setGamePhase('ready');
  }, []);

  // ── Input ──────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    if (gpRef.current === 'matchEnd' && key === 'enter') { restartMatch(); return; }
    if (gpRef.current !== 'fight') return;
    if (key === 'j') handleAttackInput('jab');
    if (key === 'k') handleAttackInput('cross');
    if (key === 'i') handleAttackInput('lowkick');
    if (key === 'o') handleAttackInput('midkick');
    if (key === ' ') { e.preventDefault(); if (playerSpecialCd <= 0 && playerStamina >= SPECIALS.raze.stamina) executeSpecial(); else playerDodge(); }
    if (key === 'shift') { setPlayerBlocking(true); setPlayerAnim(getAnim(playerSprite, 'block')); }
  }, [handleAttackInput, executeSpecial, playerDodge, restartMatch, playerSpecialCd, playerStamina, playerSprite, getAnim]);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = false;
    if (key === 'shift') { setPlayerBlocking(false); setPlayerAnim(prev => prev === getAnim(playerSprite, 'block') ? 'idle' : prev); }
  }, [playerSprite, getAnim]);

  // ── Render fighter ─────────────────────────────────────────────────────
  const renderFighter = (sprite, anim, x, flip, dodging, blocking, stunned, side, colorFilter) => {
    const nativeFacesLeft = !!sprite?.facesLeft;
    const needsFlip = flip ? !nativeFacesLeft : nativeFacesLeft;
    const dodgeDir = side === 'left' ? 1 : -1;
    // Build combined filter: base color + state overlays
    const baseFilter = colorFilter && colorFilter !== 'none' ? colorFilter : '';
    const stateFilter = blocking ? 'brightness(0.85)' : stunned ? 'brightness(1.3) saturate(0.5)' : '';
    const combinedFilter = [baseFilter, stateFilter].filter(Boolean).join(' ') || 'none';
    return (
      <div style={{ position: 'absolute', left: `${x}%`, bottom: '12%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <div style={{ transform: needsFlip ? 'scaleX(-1)' : 'none', transformOrigin: 'center bottom' }}>
          <div style={{
            '--dodge-dir': dodgeDir * (needsFlip ? -1 : 1),
            animation: dodging ? 'gkoDodgeTilt 400ms ease-in-out' : stunned ? 'none' : 'none',
            transformOrigin: 'bottom center',
            transform: blocking ? 'scaleY(0.92)' : 'none',
            transition: blocking ? 'transform 0.1s' : 'none',
            filter: combinedFilter,
          }}>
            <SpriteAnimation
              spriteData={sprite}
              animation={getAnim(sprite, anim)}
              scale={3}
              flip={false}
              loop={['idle', 'walk', 'block', 'stun', 'win'].includes(anim)}
              speed={anim === 'idle' ? 140 : anim === 'walk' ? 90 : anim === 'stun' ? 200 : 80}
              containerless={false}
            />
          </div>
        </div>
        {/* Shadow */}
        <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 80, height: 12, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)' }} />
        {/* Stun stars */}
        {stunned && (
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => <span key={i} style={{ fontSize: '0.8rem', animation: `stunStars 0.8s ease-out ${i * 0.15}s infinite` }}>⭐</span>)}
          </div>
        )}
      </div>
    );
  };

  const announcementColor = announcement === 'K.O.!' ? '#ff3333' : announcement.includes('WIN') ? '#48bb78' : announcement.includes('LOSE') ? '#e53e3e' : '#ffd700';

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onContextMenu={e => e.preventDefault()}
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', cursor: 'crosshair', outline: 'none', userSelect: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${ARENA_BG})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', filter: 'brightness(0.45) saturate(0.7)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

      <div style={{ width: '100%', height: '100%', position: 'relative', animation: screenShake ? 'gkoShake 0.3s ease-out' : 'none' }}>
        {/* Ring */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', background: 'linear-gradient(180deg, rgba(61,43,31,0.8), rgba(42,28,18,0.9))', borderTop: '3px solid #8b7355', zIndex: 2 }}>
          {[22, 42, 62].map(pct => <div key={pct} style={{ position: 'absolute', top: `-${pct}vh`, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 2%, #aa8866 5%, #cc9966 50%, #aa8866 95%, transparent 98%)', opacity: 0.35, animation: 'ringRopesBounce 2s ease-in-out infinite', zIndex: 2 }} />)}
        </div>
        {[3, 97].map(x => <div key={x} style={{ position: 'absolute', bottom: '13%', left: `${x}%`, width: 8, height: 180, background: 'linear-gradient(180deg, #ffd700, #8b7355)', borderRadius: 4, zIndex: 5 }} />)}

        {/* HUD */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: '38%' }}>
        <HealthBar current={playerHp} max={maxHp} label="RAZE" color="#3b82f6" side="left" />
            <StaminaBar current={playerStamina} max={100} side="left" />
            <SpecialCooldownBar cooldownPct={(playerSpecialCd / SPECIALS.raze.cooldown) * 100} name={SPECIALS.raze.name} />
          </div>
          <RoundDisplay round={round} timer={timer} playerWins={playerWins} opponentWins={opWins} />
          <div style={{ width: '38%' }}>
        <HealthBar current={opHp} max={opMaxHp} label={opponentConfig?.name || 'VEX'} color="#e53e3e" side="right" />
            <StaminaBar current={opStamina} max={100} side="right" />
            <SpecialCooldownBar cooldownPct={(opSpecialCd / SPECIALS.vex.cooldown) * 100} name={SPECIALS.vex.name} />
          </div>
        </div>

        {/* Combo indicator */}
        {comboBuffer.length >= 2 && comboBuffer.slice(-2).every(e => e.key === 'jab') && (
          <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', zIndex: 150, pointerEvents: 'none', animation: 'comboFlash 0.6s ease-in-out infinite' }}>
            <span style={{ color: '#ff8c00', fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', textShadow: '0 0 10px rgba(255,140,0,0.8), 2px 2px 0 #000', padding: '4px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, border: '1px solid #ff8c00' }}>
              COMBO → K / I / O
            </span>
          </div>
        )}

        {/* Fighters */}
        {renderFighter(playerSprite, playerAnim, playerX, false, playerDodging, playerBlocking, playerStunned, 'left', null)}
        {renderFighter(opponentSprite, opAnim, opX, true, opDodging, opBlocking, opStunned, 'right', opponentConfig?.filter)}

        <FloatingTexts items={floats} />

        {announcement && (
          <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, textAlign: 'center', zIndex: 200, pointerEvents: 'none' }}>
            <span style={{ color: announcementColor, fontFamily: "'Press Start 2P', monospace", fontSize: announcement.length > 10 ? '1.6rem' : '2.4rem', textShadow: `0 0 20px ${announcementColor}88, 3px 3px 0 #000, -1px -1px 0 #000`, letterSpacing: 4, animation: 'announceSlam 1.5s ease-out forwards' }}>{announcement}</span>
          </div>
        )}

        {gamePhase === 'matchEnd' && (
          <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}>
            <button onClick={restartMatch} style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', border: '2px solid #fff', borderRadius: 8, padding: '12px 32px', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: '#000', letterSpacing: 2, boxShadow: '0 4px 20px rgba(255,215,0,0.4)' }}>REMATCH (ENTER)</button>
          </div>
        )}

        <a href="/" style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', color: '#888', fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem', textDecoration: 'none', zIndex: 100, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 4, border: '1px solid #444' }}>← BACK</a>
        <ControlsHUD />
      </div>
    </div>
  );
}
