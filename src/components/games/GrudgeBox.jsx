import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  HITBOX_ZONES, ATTACK_ZONES, resolveZoneHit, calculateDamage, calculateStun,
  calculateKnockback, createPowerupState, activatePowerup,
  updatePowerup, isPoweredUp, POWERUP_DURATION, createSlashVFX, updateSlashVFX,
  SLASH_FRAME_COUNT, getAttackHitbox, PHYSICS, applyPhysics,
  resolveBodyCollision, createHitSpark, createDustPuff, createAfterimage,
  BAR_DEFS, BAR_NAMES, createBars, isBarDepleted, updateBars, applyBarDamage,
  getBarPercent, getBurnPercent, getEffectiveMax, applyBurnDamage, KNOCKDOWN,
  getIdleBounceY, MOUSE_GLOVE, clampGlovePosition, getPunchType,
  MOMENTUM, STUN_THRESHOLD_PCT,
} from '../../utils/gkoEngine';
import {
  createRagdoll, createRagdollWorld, addRagdollToWorld, launchRagdoll,
  updateRagdollWorld, removeRagdollFromWorld, drawRagdoll, isRagdollSettled,
  createFlashStep, drawFlashStep, updateFlashStep,
  createCastEffect, updateCastEffect, drawCastEffect,
  createWeaponState, startWeaponSwing, updateWeapon, drawWeapon,
} from '../../utils/ragdollEngine';
import { GKO_FIGHTERS, FIGHTER_SPECIALS, getFighterSheetPath } from '../../data/gkoFighters';
import { generateFighterTrashTalk } from '../../utils/xaiService';

const W = 960, H = 540;
const GROUND = PHYSICS.GROUND;
const GRAVITY = PHYSICS.GRAVITY;
const FW = 64, FH = 64;
const DRAW_SCALE = 4.5;
const DRAW_W = FW * DRAW_SCALE;
const DRAW_H = FH * DRAW_SCALE;

function boxFrameTable(row, groups) {
  const frames = [];
  for (const [colStart, count] of groups) {
    for (let c = colStart; c < colStart + count; c++) {
      frames.push({ col: c, row });
    }
  }
  return frames;
}

const ANIMS = {
  idle:     { frames: boxFrameTable(0, [[0, 6]]),  speed: 8,  loop: true },
  block:    { frames: boxFrameTable(1, [[0, 2]]),  speed: 6 },
  guard:    { frames: boxFrameTable(1, [[0, 2]]),  speed: 6 },
  stun:     { frames: boxFrameTable(2, [[0, 4]]),  speed: 4 },
  hurt:     { frames: boxFrameTable(3, [[0, 2]]),  speed: 4 },
  walk:     { frames: boxFrameTable(4, [[0, 4]]),  speed: 6,  loop: true },
  jab:      { frames: boxFrameTable(5, [[0, 4]]),  speed: 5 },
  walkjab:  { frames: boxFrameTable(6, [[0, 4]]),  speed: 5 },
  cross:    { frames: boxFrameTable(7, [[0, 4]]),  speed: 7 },
  lowkick:  { frames: boxFrameTable(8, [[0, 4]]),  speed: 5 },
  kick:     { frames: boxFrameTable(9, [[0, 4]]),  speed: 7 },
  upper:    { frames: boxFrameTable(7, [[0, 4]]),  speed: 8 },
  hook:     { frames: boxFrameTable(6, [[0, 4]]),  speed: 7 },
  highkick: { frames: boxFrameTable(9, [[0, 4]]),  speed: 5 },
  special:  { frames: boxFrameTable(7, [[0, 4]]),  speed: 6 },
  ko:       { frames: boxFrameTable(10, [[0, 4]]), speed: 6 },
  win:      { frames: boxFrameTable(11, [[0, 4]]), speed: 7 },
};

const ANIMS_LEFT = {};
for (const [key, val] of Object.entries(ANIMS)) {
  ANIMS_LEFT[key] = { ...val, flipped: true };
}

const ATTACKS = {
  jab:      { dmg: 6,  range: 130, startup: 3, active: 3, recovery: 4, stun: 6,  blockDmg: 1, blockStun: 4,  stamCost: 5,  focusCost: 2, meterGain: 4,  knockback: 2,  hitstun: 14, sound: 'hit_light', type: 'quick', barTarget: 'head' },
  cross:    { dmg: 16, range: 140, startup: 6, active: 4, recovery: 8, stun: 14, blockDmg: 5, blockStun: 10, stamCost: 14, focusCost: 4, meterGain: 8,  knockback: 8,  hitstun: 24, sound: 'hit_heavy', type: 'power', barTarget: 'body' },
  lowkick:  { dmg: 8,  range: 140, startup: 3, active: 3, recovery: 5, stun: 8,  blockDmg: 2, blockStun: 6,  stamCost: 5,  focusCost: 2, meterGain: 5,  knockback: 3,  hitstun: 16, sound: 'hit_light', type: 'quick', barTarget: 'body' },
  kick:     { dmg: 12, range: 150, startup: 5, active: 4, recovery: 6, stun: 12, blockDmg: 4, blockStun: 8,  stamCost: 8,  focusCost: 3, meterGain: 7,  knockback: 6,  hitstun: 20, sound: 'hit_mid', type: 'mid', barTarget: 'body' },
  upper:    { dmg: 22, range: 120, startup: 8, active: 4, recovery: 10, stun: 20, blockDmg: 8, blockStun: 14, stamCost: 18, focusCost: 6, meterGain: 14, knockback: 12, hitstun: 30, sound: 'hit_heavy', type: 'power', launcher: true, barTarget: 'head' },
  hook:     { dmg: 18, range: 130, startup: 6, active: 4, recovery: 8, stun: 16, blockDmg: 6, blockStun: 12, stamCost: 15, focusCost: 5, meterGain: 10, knockback: 10, hitstun: 26, sound: 'hit_heavy', type: 'power', barTarget: 'head' },
  highkick: { dmg: 14, range: 155, startup: 5, active: 4, recovery: 6, stun: 14, blockDmg: 5, blockStun: 8,  stamCost: 10, focusCost: 3, meterGain: 9,  knockback: 7,  hitstun: 22, sound: 'hit_mid', type: 'mid', barTarget: 'head' },
};

const COMBO_CHAINS = [
  { seq: ['jab', 'jab', 'cross'], name: '1-2 CROSS', bonus: 1.3 },
  { seq: ['jab', 'jab', 'kick'], name: 'RUSH KICK', bonus: 1.4 },
  { seq: ['jab', 'kick', 'upper'], name: 'LAUNCHER', bonus: 1.5 },
  { seq: ['jab', 'jab', 'jab', 'upper'], name: 'FURY UPPER', bonus: 1.8 },
  { seq: ['kick', 'kick', 'cross'], name: 'BLITZ', bonus: 1.5 },
  { seq: ['cross', 'kick'], name: 'POWER CHAIN', bonus: 1.3 },
  { seq: ['lowkick', 'lowkick', 'highkick'], name: 'LEG STORM', bonus: 1.5 },
  { seq: ['jab', 'cross', 'hook'], name: 'TRIPLE THREAT', bonus: 1.6 },
  { seq: ['hook', 'upper'], name: 'DEVASTATOR', bonus: 1.4 },
  { seq: ['lowkick', 'jab', 'cross', 'upper'], name: 'FULL COMBO', bonus: 2.0 },
  { seq: ['jab', 'lowkick', 'hook'], name: 'STREET MIX', bonus: 1.4 },
  { seq: ['highkick', 'cross', 'upper'], name: 'SKYSCRAPER', bonus: 1.7 },
];

const FIGHTER_WEAPONS = {
  raze: 'broadsword',
  volt: 'katana',
  venom: 'scythe',
  wraith: 'katana',
  blitz: 'greataxe',
  shade: 'scythe',
  ghost: 'staff',
  surge: 'warhammer',
};

const FIGHTER_CAST_TYPE = {
  raze: 'fire',
  volt: 'lightning',
  venom: 'dark',
  wraith: 'dark',
  blitz: 'charge',
  shade: 'ice',
  ghost: 'dark',
  surge: 'lightning',
};

const FIGHTERS = GKO_FIGHTERS.map(f => ({
  ...f,
  accent: f.colorAlt || f.color,
  portrait: getFighterSheetPath(f),
}));

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) { const c3 = 2.70158; return 1 + c3 * Math.pow(t - 1, 3) + (c3 - 1) * Math.pow(t - 1, 2); }
function easeOutElastic(t) { if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; }
function easeInCubic(t) { return t * t * t; }
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

const STAGES = [
  { id: 'underground', name: 'THE PIT', accentColor: '#ef4444', bgGrad: ['#1a0505', '#2a0a0a', '#0d0505'], floorGlow: 'rgba(239,68,68,0.2)', bgTheme: 'night' },
  { id: 'rooftop', name: 'SKYLINE', accentColor: '#a855f7', bgGrad: ['#0a0520', '#150a30', '#080318'], floorGlow: 'rgba(168,85,247,0.2)', bgTheme: 'day' },
  { id: 'street', name: 'BACK ALLEY', accentColor: '#f97316', bgGrad: ['#1a0f05', '#201508', '#0d0a04'], floorGlow: 'rgba(249,115,22,0.2)', bgTheme: 'night' },
  { id: 'arena', name: 'GRAND ARENA', accentColor: '#06b6d4', bgGrad: ['#051a1a', '#082828', '#030f0f'], floorGlow: 'rgba(6,182,212,0.2)', bgTheme: 'night' },
  { id: 'factory', name: 'IRON WORKS', accentColor: '#22c55e', bgGrad: ['#051a0a', '#082810', '#030f05'], floorGlow: 'rgba(34,197,94,0.2)', bgTheme: 'day' },
];

const ARENA_BG_PATH = '/sprites/grudge-box/arena';
let _arenaBgLayers = { night: [], day: [] };
let _arenaBgLoaded = false;

async function preloadArenaBgs() {
  if (_arenaBgLoaded) return;
  const themes = ['night', 'day'];
  for (const theme of themes) {
    const folder = theme === 'night' ? 'bg-night' : 'bg-day';
    const layers = [];
    for (let i = 1; i <= 5; i++) {
      const img = await loadImg(`${ARENA_BG_PATH}/${folder}/${i}.png`);
      layers.push(img);
    }
    _arenaBgLayers[theme] = layers;
  }
  _arenaBgLoaded = true;
}

function loadImg(src) {
  return new Promise(r => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => r(img);
    img.onerror = () => r(null);
    img.src = src;
  });
}

let _gkoAudioCtx = null;
function getAudioCtx() {
  if (!_gkoAudioCtx || _gkoAudioCtx.state === 'closed') {
    _gkoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_gkoAudioCtx.state === 'suspended') _gkoAudioCtx.resume();
  return _gkoAudioCtx;
}

function playSound(type) {
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    if (type === 'hit_light') { osc.frequency.value = 200; gain.gain.value = 0.15; osc.type = 'square'; osc.start(); osc.stop(ac.currentTime + 0.05); }
    else if (type === 'hit_heavy') { osc.frequency.value = 100; gain.gain.value = 0.2; osc.type = 'sawtooth'; osc.start(); osc.stop(ac.currentTime + 0.08); }
    else if (type === 'hit_mid') { osc.frequency.value = 150; gain.gain.value = 0.17; osc.type = 'triangle'; osc.start(); osc.stop(ac.currentTime + 0.06); }
    else if (type === 'block') { osc.frequency.value = 400; gain.gain.value = 0.1; osc.type = 'sine'; osc.start(); osc.stop(ac.currentTime + 0.03); }
    else if (type === 'ko') { osc.frequency.setValueAtTime(300, ac.currentTime); osc.frequency.linearRampToValueAtTime(50, ac.currentTime + 0.3); gain.gain.value = 0.25; osc.type = 'sawtooth'; osc.start(); osc.stop(ac.currentTime + 0.3); }
    else if (type === 'special') { osc.frequency.setValueAtTime(200, ac.currentTime); osc.frequency.linearRampToValueAtTime(800, ac.currentTime + 0.15); osc.frequency.linearRampToValueAtTime(100, ac.currentTime + 0.3); gain.gain.value = 0.2; osc.type = 'square'; osc.start(); osc.stop(ac.currentTime + 0.3); }
    else if (type === 'round') { osc.frequency.value = 600; gain.gain.value = 0.15; osc.type = 'sine'; osc.start(); osc.stop(ac.currentTime + 0.15); }
    else if (type === 'parry') { osc.frequency.value = 800; gain.gain.value = 0.12; osc.type = 'sine'; osc.start(); osc.stop(ac.currentTime + 0.04); }
    else if (type === 'stun') { osc.frequency.setValueAtTime(500, ac.currentTime); osc.frequency.linearRampToValueAtTime(200, ac.currentTime + 0.15); gain.gain.value = 0.18; osc.type = 'sawtooth'; osc.start(); osc.stop(ac.currentTime + 0.15); }
    else if (type === 'bar_depleted') { osc.frequency.setValueAtTime(600, ac.currentTime); osc.frequency.linearRampToValueAtTime(100, ac.currentTime + 0.2); gain.gain.value = 0.2; osc.type = 'square'; osc.start(); osc.stop(ac.currentTime + 0.2); }
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
  } catch (e) {}
}

function createFighter(x, facingRight, fighterDef) {
  const s = fighterDef?.stats || { power: 6, speed: 6, defense: 6, stamina: 6 };
  const bars = createBars(s);
  const hpBase = bars.head.max + bars.body.max;
  const stamBase = bars.stamina.max;
  const blockBase = 40 + s.defense * 4;
  return {
    x, y: GROUND, vx: 0, vy: 0,
    hp: hpBase, maxHp: hpBase,
    bars,
    barStunned: false,
    barStunnedBar: null,
    stamina: stamBase, maxStamina: stamBase,
    meter: 0, maxMeter: 100,
    blockHp: blockBase, maxBlockHp: blockBase,
    facingRight,
    state: 'idle',
    anim: 'idle', frame: 0, frameTimer: 0,
    attackFrame: 0,
    hitConnected: false,
    stunTimer: 0,
    invulnTimer: 0,
    comboChain: [],
    comboTimer: 0,
    comboMultiplier: 1,
    lastComboName: '',
    comboDisplayTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 0,
    lastTapDir: 0,
    lastTapTime: 0,
    specialReady: false,
    wins: 0,
    blockStunTimer: 0,
    parryWindow: 0,
    lastBlockTime: 0,
    moveSpeed: 3 + s.speed * 0.2,
    dmgMult: 0.8 + s.power * 0.04,
    stamRegen: 0.25 + s.stamina * 0.02,
    powerup: createPowerupState(),
    specialState: null,
    specialTimer: 0,
    poison: null,
    armorActive: false,
    phaseActive: false,
    counterWindow: 0,
    reflectWindow: 0,
    lastSpecialDmg: 0,
    fighterId: fighterDef?.id || 'raze',
    weapon: createWeaponState(FIGHTER_WEAPONS[fighterDef?.id] || 'broadsword'),
    airborne: false,
    landedHard: false,
    inputBuffer: null,
    inputBufferTimer: 0,
    hitstop: 0,
    momentum: 0,
    momentumBoost: 0,
    knockdown: false,
    knockdownTimer: 0,
    knockdownCount: 0,
    mashCount: 0,
    parryOrb: {
      angle: Math.random() * Math.PI * 2,
      litTimer: 0,
      cooldown: 60 + Math.floor(Math.random() * 120),
      radius: 45,
    },
  };
}

function createParticle(x, y, color, type = 'hit') {
  return {
    x, y,
    vx: (Math.random() - 0.5) * (type === 'hit' ? 8 : 4),
    vy: -Math.random() * (type === 'hit' ? 6 : 3) - 2,
    life: type === 'hit' ? 20 : 30,
    maxLife: type === 'hit' ? 20 : 30,
    color,
    size: type === 'hit' ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
    type,
  };
}

let _arenaCache = null;
let _arenaCacheStageId = null;

function buildArenaCache(stageData) {
  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = H;
  const oc = offscreen.getContext('2d');

  const bgColors = stageData?.bgGrad || ['#0a0a1a', '#1a1a2e', '#16213e'];
  const accent = stageData?.accentColor || '#fbbf24';
  const floorGlow = stageData?.floorGlow || 'rgba(251,191,36,0.15)';
  const theme = stageData?.bgTheme || 'night';

  const grad = oc.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, bgColors[0]);
  grad.addColorStop(0.5, bgColors[1]);
  grad.addColorStop(1, bgColors[2]);
  oc.fillStyle = grad;
  oc.fillRect(0, 0, W, H);

  const layers = _arenaBgLayers[theme];
  if (layers && layers.length > 0) {
    oc.imageSmoothingEnabled = false;
    for (let i = 0; i < layers.length; i++) {
      const img = layers[i];
      if (!img) continue;
      oc.save();
      if (i < 3) {
        oc.globalAlpha = 0.55 + i * 0.12;
      } else {
        oc.globalAlpha = 0.9;
      }
      oc.drawImage(img, 0, 0, W, H);
      oc.restore();
    }
    oc.imageSmoothingEnabled = true;

    oc.save();
    oc.globalCompositeOperation = 'multiply';
    oc.globalAlpha = 0.45;
    const tintGrad = oc.createLinearGradient(0, 0, 0, H);
    tintGrad.addColorStop(0, bgColors[0]);
    tintGrad.addColorStop(0.5, bgColors[1]);
    tintGrad.addColorStop(1, bgColors[2]);
    oc.fillStyle = tintGrad;
    oc.fillRect(0, 0, W, H);
    oc.restore();

    oc.save();
    oc.globalCompositeOperation = 'screen';
    oc.globalAlpha = 0.08;
    oc.fillStyle = accent;
    oc.fillRect(0, 0, W, H);
    oc.restore();
  } else {
    oc.save();
    oc.globalAlpha = 0.04;
    const gridSize = 40;
    oc.strokeStyle = accent;
    oc.lineWidth = 0.5;
    oc.beginPath();
    for (let x = 0; x < W; x += gridSize) { oc.moveTo(x, 0); oc.lineTo(x, H); }
    for (let y = 0; y < H; y += gridSize) { oc.moveTo(0, y); oc.lineTo(W, y); }
    oc.stroke();
    oc.restore();
  }

  const postLeft = 60;
  const postRight = W - 60;
  const ropeY1 = GROUND - DRAW_H * 0.85;
  oc.save();
  oc.globalAlpha = 0.5;
  oc.strokeStyle = '#4a4a5a';
  oc.lineWidth = 4;
  oc.beginPath();
  oc.moveTo(postLeft, ropeY1 - 30);
  oc.lineTo(postLeft, GROUND + DRAW_H * 0.45);
  oc.moveTo(postRight, ropeY1 - 30);
  oc.lineTo(postRight, GROUND + DRAW_H * 0.45);
  oc.stroke();
  oc.restore();

  const spotX1 = W * 0.3;
  const spotX2 = W * 0.7;
  oc.save();
  oc.globalAlpha = 0.08;
  const spot1 = oc.createRadialGradient(spotX1, 0, 0, spotX1, 0, 400);
  spot1.addColorStop(0, accent);
  spot1.addColorStop(1, 'transparent');
  oc.fillStyle = spot1;
  oc.fillRect(0, 0, W, H);
  const spot2 = oc.createRadialGradient(spotX2, 0, 0, spotX2, 0, 400);
  spot2.addColorStop(0, accent);
  spot2.addColorStop(1, 'transparent');
  oc.fillStyle = spot2;
  oc.fillRect(0, 0, W, H);
  oc.restore();

  const floorY = GROUND + DRAW_H * 0.45;
  const floorGradient = oc.createLinearGradient(0, floorY - 4, 0, H);
  floorGradient.addColorStop(0, floorGlow);
  floorGradient.addColorStop(0.3, floorGlow.replace(/[\d.]+\)$/, '0.05)'));
  floorGradient.addColorStop(1, 'rgba(0,0,0,0)');
  oc.fillStyle = floorGradient;
  oc.fillRect(0, floorY - 4, W, H - floorY + 4);

  oc.strokeStyle = accent + '60';
  oc.lineWidth = 2;
  oc.beginPath();
  oc.moveTo(0, floorY);
  oc.lineTo(W, floorY);
  oc.stroke();

  oc.save();
  oc.font = 'bold 60px "Cinzel", serif';
  oc.textAlign = 'center';
  oc.fillStyle = accent + '0a';
  oc.fillText('G.K.O.', W / 2, H * 0.35);
  oc.restore();

  if (stageData?.name) {
    oc.save();
    oc.font = '10px Jost, sans-serif';
    oc.textAlign = 'right';
    oc.fillStyle = accent + '30';
    oc.fillText(stageData.name, W - 15, H - 8);
    oc.restore();
  }

  _arenaCache = offscreen;
  _arenaCacheStageId = stageData?.id;
}

function drawArena(ctx, time, stageData) {
  if (!_arenaCache || _arenaCacheStageId !== stageData?.id) {
    buildArenaCache(stageData);
  }
  ctx.drawImage(_arenaCache, 0, 0);

  const accent = stageData?.accentColor || '#fbbf24';
  const ropeY1 = GROUND - DRAW_H * 0.85;
  const ropeY2 = GROUND - DRAW_H * 0.45;
  const ropeY3 = GROUND - DRAW_H * 0.1;
  const postLeft = 60;
  const postRight = W - 60;

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  [ropeY1, ropeY2, ropeY3].forEach((ry, i) => {
    const sag = 3 + i * 2;
    ctx.strokeStyle = i === 0 ? accent : (i === 1 ? '#fbbf24' : '#94a3b8');
    ctx.beginPath();
    ctx.moveTo(postLeft, ry);
    ctx.quadraticCurveTo(W / 2, ry + sag + Math.sin(time * 0.03 + i) * 1.5, postRight, ry);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  const spotPulse = 0.06 + Math.sin(time * 0.02) * 0.02;
  if (spotPulse > 0.061) {
    ctx.globalAlpha = spotPulse - 0.06;
    ctx.fillStyle = accent;
    ctx.globalCompositeOperation = 'lighter';
    const spotX1 = W * 0.3;
    const spotX2 = W * 0.7;
    const sg = ctx.createRadialGradient(spotX1, 0, 0, spotX1, 0, 400);
    sg.addColorStop(0, accent);
    sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    const sg2 = ctx.createRadialGradient(spotX2, 0, 0, spotX2, 0, 400);
    sg2.addColorStop(0, accent);
    sg2.addColorStop(1, 'transparent');
    ctx.fillStyle = sg2;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawFighterNameplate(ctx, fighter, fighterDef, time) {
  const nameY = fighter.y + DRAW_H * 0.02;
  const bounceY = (fighter.state === 'idle' || fighter.state === 'walk') ? getIdleBounceY(time) * 0.3 : 0;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.85;

  ctx.font = 'bold 11px Cinzel, serif';
  ctx.fillStyle = fighterDef.color || '#fbbf24';
  ctx.shadowColor = fighterDef.color || '#fbbf24';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeText(fighterDef.name, fighter.x, nameY + bounceY);
  ctx.fillText(fighterDef.name, fighter.x, nameY + bounceY);

  ctx.shadowBlur = 0;
  ctx.font = '8px Jost, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeText(fighterDef.title || '', fighter.x, nameY + 12 + bounceY);
  ctx.fillText(fighterDef.title || '', fighter.x, nameY + 12 + bounceY);
  ctx.restore();
}

function drawFighter(ctx, fighter, img, animSet, time, fighterDef) {
  if (!img) return;
  const animKey = fighter.anim || 'idle';
  const a = ANIMS[animKey] || ANIMS.idle;
  const flipped = !fighter.facingRight;
  const frameIdx = Math.min(fighter.frame, a.frames.length - 1);
  const { col, row } = a.frames[frameIdx];
  const blockOff = fighterDef?.blockOffset || 0;
  const rowOff = fighterDef?.rowOffset || 0;

  const sx = (col + blockOff) * FW;
  const sy = (row + rowOff) * FH;
  const drawX = fighter.x - DRAW_W / 2;

  const bounceY = (fighter.state === 'idle' || fighter.state === 'walk') ? getIdleBounceY(time) : 0;
  const drawY = fighter.y - DRAW_H * 0.55 + bounceY;

  ctx.save();

  if (fighter.phaseActive && Math.floor(time / 30) % 2 === 0) {
    ctx.globalAlpha = 0.3;
  } else if (fighter.invulnTimer > 0 && Math.floor(time / 50) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  if (fighter.barStunned) {
    ctx.filter = 'brightness(1.8) saturate(0.3) hue-rotate(180deg)';
  } else if (fighter.state === 'hurt' || fighter.state === 'stun') {
    ctx.filter = 'brightness(1.5) saturate(0.5)';
  } else if (fighter.blockStunTimer > 0) {
    ctx.filter = 'brightness(1.2) hue-rotate(30deg)';
  } else if (fighter.armorActive) {
    ctx.filter = 'brightness(1.3) saturate(1.5)';
  }

  if (isPoweredUp(fighter)) {
    const pulseAlpha = 0.3 + Math.sin(time * 0.15) * 0.15;
    const color = fighterDef?.color || '#fbbf24';
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + Math.sin(time * 0.1) * 8;

    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(fighter.x, fighter.y - DRAW_H * 0.25 + bounceY, DRAW_W * 0.38, DRAW_H * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (flipped) {
    ctx.save();
    ctx.translate(fighter.x, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, FW, FH, -DRAW_W / 2, 0, DRAW_W, DRAW_H);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, FW, FH, drawX, drawY, DRAW_W, DRAW_H);
  }

  if (fighter.barStunned) {
    const starCount = 3;
    for (let i = 0; i < starCount; i++) {
      const angle = (time * 0.08 + i * (Math.PI * 2 / starCount));
      const starX = fighter.x + Math.cos(angle) * 25;
      const starY = fighter.y - DRAW_H * 0.75 + bounceY + Math.sin(angle * 2) * 5;
      ctx.save();
      ctx.font = '14px sans-serif';
      ctx.fillStyle = `rgba(255,255,100,${0.5 + Math.sin(time * 0.2 + i) * 0.3})`;
      ctx.fillText('★', starX - 5, starY);
      ctx.restore();
    }
  }

  if (fighter.parryWindow > 0) {
    ctx.strokeStyle = `rgba(34, 211, 238, ${fighter.parryWindow / 8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - DRAW_H * 0.25 + bounceY, DRAW_W * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (fighter.counterWindow > 0) {
    ctx.strokeStyle = `rgba(34, 197, 94, ${fighter.counterWindow / 15})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - DRAW_H * 0.25 + bounceY, DRAW_W * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (fighter.reflectWindow > 0) {
    ctx.strokeStyle = `rgba(107, 114, 128, ${fighter.reflectWindow / 20})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    const shieldX = fighter.x + (fighter.facingRight ? DRAW_W * 0.3 : -DRAW_W * 0.3);
    ctx.moveTo(shieldX, fighter.y - DRAW_H * 0.7 + bounceY);
    ctx.lineTo(shieldX, fighter.y - DRAW_H * 0.1 + bounceY);
    ctx.stroke();
  }

  if (fighter.poison) {
    ctx.fillStyle = `rgba(34, 197, 94, ${0.15 + Math.sin(time * 0.2) * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(fighter.x, fighter.y - DRAW_H * 0.25 + bounceY, DRAW_W * 0.35, DRAW_H * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawGlove(ctx, gloveX, gloveY, fighterX, fighterY, isBlocking, time) {
  const anchorY = fighterY - DRAW_H * 0.4;

  ctx.save();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(fighterX + (gloveX > fighterX ? 15 : -15), anchorY);
  ctx.lineTo(gloveX, gloveY);
  ctx.stroke();
  ctx.setLineDash([]);

  const sz = 10;
  const pulse = 1 + Math.sin(time * 0.15) * 0.05;
  const drawSz = sz * pulse;

  if (isBlocking) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gloveX, gloveY, drawSz, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = `bold 8px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('●', gloveX, gloveY);
  } else {
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(gloveX, gloveY, drawSz, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(gloveX - 3, gloveY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gloveX + 3, gloveY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(gloveX - 4, gloveY + 5, 8, 4);
  }

  ctx.restore();
}

function drawParryOrb(ctx, fighter, time) {
  const orb = fighter.parryOrb;
  const cx = fighter.x;
  const cy = fighter.y - DRAW_H * 0.35;
  const lit = orb.litTimer > 0;
  const litFade = lit ? Math.min(1, orb.litTimer / 6) : 0;
  const numBalls = 8;
  const dashLen = 6;

  ctx.save();

  for (let i = 0; i < numBalls; i++) {
    const a = orb.angle + (i / numBalls) * Math.PI * 2;
    const bx = cx + Math.cos(a) * orb.radius;
    const by = cy + Math.sin(a) * orb.radius;

    if (lit) {
      const pulse = Math.sin(time * 0.5 + i) * 0.15 + 0.85;
      ctx.globalAlpha = litFade * pulse;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ef4444';
    } else {
      ctx.globalAlpha = 0.06;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ef4444';
    }
    ctx.beginPath();
    ctx.arc(bx, by, lit ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();

    const midA = a + (1 / numBalls) * Math.PI;
    const dx1 = cx + Math.cos(midA) * (orb.radius - dashLen * 0.5);
    const dy1 = cy + Math.sin(midA) * (orb.radius - dashLen * 0.5);
    const dx2 = cx + Math.cos(midA) * (orb.radius + dashLen * 0.5);
    const dy2 = cy + Math.sin(midA) * (orb.radius + dashLen * 0.5);

    ctx.globalAlpha = lit ? litFade * 0.7 : 0.04;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = lit ? 2 : 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(dx1, dy1);
    ctx.lineTo(dx2, dy2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMultiBarHUD(ctx, fighter, x, barW, isRight, fighterDef, time) {
  const barH = 8;
  const gap = 2;
  const startY = 18;

  const panelPad = 8;
  const panelH = BAR_NAMES.length * (barH + gap) + 50;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  const px = x - panelPad;
  const py = startY - 16;
  const pw = barW + panelPad * 2;
  const pr = 6;
  ctx.moveTo(px + pr, py);
  ctx.lineTo(px + pw - pr, py);
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
  ctx.lineTo(px + pw, py + panelH - pr);
  ctx.quadraticCurveTo(px + pw, py + panelH, px + pw - pr, py + panelH);
  ctx.lineTo(px + pr, py + panelH);
  ctx.quadraticCurveTo(px, py + panelH, px, py + panelH - pr);
  ctx.lineTo(px, py + pr);
  ctx.quadraticCurveTo(px, py, px + pr, py);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = (fighterDef.color || '#fbbf24') + '30';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 13px Jost, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = isRight ? 'right' : 'left';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeText(fighterDef.name, isRight ? x + barW : x, startY - 2);
  ctx.fillText(fighterDef.name, isRight ? x + barW : x, startY - 2);

  for (let i = 0; i < BAR_NAMES.length; i++) {
    const barName = BAR_NAMES[i];
    const def = BAR_DEFS[barName];
    const pct = getBarPercent(fighter.bars, barName);
    const burnPct = getBurnPercent(fighter.bars, barName);
    const by = startY + i * (barH + gap);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, by, barW, barH);

    if (burnPct > 0) {
      const burnColor = 'rgba(100,20,20,0.6)';
      if (isRight) {
        ctx.fillStyle = burnColor;
        ctx.fillRect(x, by, barW * burnPct, barH);
      } else {
        ctx.fillStyle = burnColor;
        ctx.fillRect(x + barW * (1 - burnPct), by, barW * burnPct, barH);
      }
    }

    const isDepleted = pct <= 0;
    const isLow = pct < 0.2;
    let barColor = def.color;
    if (isDepleted) {
      barColor = Math.floor(time / 8) % 2 === 0 ? '#ef4444' : '#7f1d1d';
    } else if (isLow) {
      barColor = Math.floor(time / 15) % 2 === 0 ? def.color : '#ef4444';
    }

    const availableW = barW * (1 - burnPct);
    if (isRight) {
      ctx.fillStyle = barColor;
      const barStart = x + barW * burnPct + availableW * (1 - pct);
      ctx.fillRect(barStart, by, availableW * pct, barH);
    } else {
      ctx.fillStyle = barColor;
      ctx.fillRect(x, by, availableW * pct, barH);
    }

    if (burnPct > 0) {
      const lineX = isRight ? x + barW * burnPct : x + barW * (1 - burnPct);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, by);
      ctx.lineTo(lineX, by + barH);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, by, barW, barH);

    ctx.font = '7px Jost, sans-serif';
    ctx.fillStyle = pct > 0.3 ? 'rgba(255,255,255,0.7)' : '#ef4444';
    ctx.textAlign = isRight ? 'right' : 'left';
    const labelText = burnPct > 0.05 ? `${def.label} (FATIGUED)` : def.label;
    ctx.fillText(labelText, isRight ? x + barW - 2 : x + 2, by + barH - 1);
  }

  const meterY = startY + BAR_NAMES.length * (barH + gap) + 4;
  const meterH = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, meterY, barW, meterH);

  const meterPct = fighter.meter / fighter.maxMeter;
  const meterFull = fighter.meter >= fighter.maxMeter;
  const meterColor = meterFull ? `hsl(${(time * 0.5) % 360}, 100%, 60%)` : '#fbbf24';

  if (isRight) {
    ctx.fillStyle = meterColor;
    ctx.fillRect(x + barW * (1 - meterPct), meterY, barW * meterPct, meterH);
  } else {
    ctx.fillStyle = meterColor;
    ctx.fillRect(x, meterY, barW * meterPct, meterH);
  }

  ctx.strokeStyle = 'rgba(251,191,36,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, meterY, barW, meterH);

  ctx.font = '8px Jost, sans-serif';
  ctx.textAlign = isRight ? 'right' : 'left';
  if (meterFull) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('⚡ SPECIAL READY', isRight ? x + barW : x, meterY + meterH + 10);
  } else {
    ctx.fillStyle = '#475569';
    ctx.fillText(`MOMENTUM ${Math.floor(meterPct * 100)}%`, isRight ? x + barW : x, meterY + meterH + 10);
  }

  if (fighter.barStunned) {
    const stunFlash = Math.sin(time * 0.3) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = stunFlash;
    ctx.font = 'bold 12px Jost, sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = isRight ? 'right' : 'left';
    const barLabel = BAR_DEFS[fighter.barStunnedBar]?.label || 'BAR';
    ctx.fillText(`${barLabel} DEPLETED — STUNNED`, isRight ? x + barW : x, meterY + meterH + 24);
    ctx.restore();
  }

  if (isPoweredUp(fighter)) {
    const pPct = fighter.powerup.timer / POWERUP_DURATION;
    const pY = meterY + meterH + 28;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(isRight ? x + barW - 80 : x, pY, 80, 4);
    ctx.fillStyle = `hsl(${(time * 2) % 360}, 100%, 60%)`;
    ctx.fillRect(isRight ? x + barW - 80 : x, pY, 80 * pPct, 4);
    ctx.font = '8px Jost';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillText('POWER UP', isRight ? x + barW : x, pY + 12);
  }

  if (fighter.comboDisplayTimer > 0) {
    if (!fighter._comboMaxTimer) fighter._comboMaxTimer = fighter.comboDisplayTimer;
    const elapsed = fighter._comboMaxTimer - fighter.comboDisplayTimer;
    const introT = Math.min(1, elapsed / 8);
    const outT = Math.min(1, fighter.comboDisplayTimer / 20);
    const popScale = elapsed < 8 ? easeOutBack(introT) : 1.0;
    const alpha = outT < 1 ? easeInCubic(outT) : 1;
    const baseScale = Math.min(1.5, 1 + (fighter.comboMultiplier - 1) * 0.3);
    const scale = baseScale * popScale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.floor(16 * scale)}px Cinzel, serif`;
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12 * scale;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    const comboY = meterY + meterH + 38;
    ctx.strokeText(fighter.lastComboName, isRight ? x + barW : x, comboY);
    ctx.fillText(fighter.lastComboName, isRight ? x + barW : x, comboY);
    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.floor(12 * scale)}px Jost`;
    ctx.fillStyle = '#22d3ee';
    if (isRight) {
      ctx.strokeText(`x${fighter.comboMultiplier.toFixed(1)}`, x + barW - ctx.measureText(fighter.lastComboName).width - 8, comboY);
      ctx.fillText(`x${fighter.comboMultiplier.toFixed(1)}`, x + barW - ctx.measureText(fighter.lastComboName).width - 8, comboY);
    } else {
      ctx.strokeText(`x${fighter.comboMultiplier.toFixed(1)}`, x + ctx.measureText(fighter.lastComboName).width + 8, comboY);
      ctx.fillText(`x${fighter.comboMultiplier.toFixed(1)}`, x + ctx.measureText(fighter.lastComboName).width + 8, comboY);
    }
    ctx.restore();
    if (fighter.comboDisplayTimer <= 0) fighter._comboMaxTimer = 0;
  }
}

function drawHUD(ctx, p1, p2, roundTimer, announcement, p1Fighter, p2Fighter, time) {
  const barW = 350, gap = 20;
  const p1x = gap, p2x = W - gap - barW;

  drawMultiBarHUD(ctx, p1, p1x, barW, false, p1Fighter, time);
  drawMultiBarHUD(ctx, p2, p2x, barW, true, p2Fighter, time);

  ctx.font = 'bold 28px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  const secs = Math.ceil(roundTimer / 60);
  ctx.fillText(secs > 0 ? secs : '0', W / 2, 42);

  const winY = 56;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 - 50 + i * 20, winY, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < p1.wins ? p1Fighter.color : 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2 + 50 - i * 20, winY, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < p2.wins ? p2Fighter.color : 'rgba(255,255,255,0.1)';
    ctx.fill();
  }

  if (announcement) {
    ctx.save();
    const maxT = announcement._maxTimer || announcement.timer;
    if (!announcement._maxTimer) announcement._maxTimer = announcement.timer;
    const elapsed = maxT - announcement.timer;
    const totalDur = maxT;
    const introPhase = Math.min(totalDur * 0.2, 15);
    const outroPhase = Math.min(totalDur * 0.25, 20);

    let alpha, scale;
    if (elapsed < introPhase) {
      const t = elapsed / introPhase;
      alpha = easeOutCubic(t);
      scale = easeOutBack(t);
    } else if (announcement.timer < outroPhase) {
      const t = announcement.timer / outroPhase;
      alpha = easeInCubic(t);
      scale = 1.0 + (1 - t) * 0.05;
    } else {
      alpha = 1;
      scale = 1;
    }

    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    const baseSize = announcement.size || 48;
    const fontSize = Math.round(baseSize * scale);
    ctx.font = `bold ${fontSize}px Cinzel, serif`;
    ctx.fillStyle = announcement.color || '#fbbf24';
    ctx.shadowColor = announcement.color || '#fbbf24';
    ctx.shadowBlur = 25 * alpha;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeText(announcement.text, W / 2, H * 0.4);
    ctx.fillText(announcement.text, W / 2, H * 0.4);
    ctx.shadowBlur = 0;
    if (announcement.sub) {
      const subAlpha = elapsed < introPhase + 8 ? easeOutCubic(Math.max(0, (elapsed - 6)) / introPhase) : alpha;
      ctx.globalAlpha = subAlpha;
      ctx.font = `bold ${Math.round(18 * Math.min(1, scale))}px Jost, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(announcement.sub, W / 2, H * 0.4 + 35);
      ctx.fillText(announcement.sub, W / 2, H * 0.4 + 35);
    }
    ctx.restore();
  }
}

function GrudgeBoxGame({ p1Color, p2Color, stage, mode, onExit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const mouseRef = useRef({ x: W / 2, y: H / 2, lmb: false, rmb: false, onCanvas: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let cancelled = false;
    let raf;

    const p1Def = FIGHTERS.find(f => f.id === p1Color) || FIGHTERS[0];
    const isVsAI = mode !== '2p';
    let p2Def;
    if (p2Color) {
      p2Def = FIGHTERS.find(f => f.id === p2Color) || FIGHTERS[1];
    } else {
      const colors = FIGHTERS.map(f => f.id).filter(c => c !== p1Color);
      const aiColor = colors[Math.floor(Math.random() * colors.length)];
      p2Def = FIGHTERS.find(f => f.id === aiColor) || FIGHTERS[1];
    }

    const stageData = STAGES.find(s => s.id === stage) || STAGES[Math.floor(Math.random() * STAGES.length)];

    let trashTalkLines = [];
    generateFighterTrashTalk(p1Def.id, p2Def.id, 'ranked match').then(r => {
      trashTalkLines = r.lines || [];
    }).catch(() => {});

    function createRecoverySpots() {
      const spots = [];
      const spotCount = 3;
      const margin = 120;
      const spacing = (W - margin * 2) / (spotCount + 1);
      for (let i = 0; i < spotCount; i++) {
        spots.push({
          x: margin + spacing * (i + 1),
          y: GROUND + DRAW_H * 0.35,
          radius: 22,
          active: false,
          cooldown: 0,
          spawnTimer: 300 + Math.floor(Math.random() * 300),
          barType: BAR_NAMES[Math.floor(Math.random() * BAR_NAMES.length)],
          healAmount: 8 + Math.floor(Math.random() * 8),
        });
      }
      return spots;
    }

    const game = {
      p1: createFighter(250, true, p1Def),
      p2: createFighter(710, false, p2Def),
      phase: 'intro',
      phaseTimer: 120,
      round: 1,
      roundTimer: 99 * 60,
      roundStartTime: 0,
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, timer: 0, maxTimer: 0 },
      koZoom: null,
      shockwave: null,
      flash: null,
      announcement: { text: 'ROUND 1', timer: 90, size: 56, color: '#fbbf24' },
      slowmo: 0,
      p1Img: null,
      p2Img: null,
      stageData: stageData,
      recoverySpots: createRecoverySpots(),
      slashEffects: [],
      afterimages: [],
      fxEffects: [],
      fxImgs: {},
      ragdollWorld: createRagdollWorld(GROUND + DRAW_H * 0.45, W),
      ragdolls: [],
      flashSteps: [],
      castEffects: [],
      time: 0,
      aiTimer: 0,
      aiDecision: null,
      showMoveList: false,
      trashTalkTimer: 0,
      trashTalkLine: '',
    };
    gameRef.current = game;

    async function init() {
      const [img1, img2] = await Promise.all([
        loadImg(getFighterSheetPath(p1Def)),
        loadImg(getFighterSheetPath(p2Def)),
      ]);
      game.p1Img = img1;
      game.p2Img = img2 || img1;

      const fxNames = ['Explosion1', 'Explosion2', 'Explosion3', 'Explosion4', 'Explosion5', 'Fire_big', 'Fire_small'];
      const fxPromises = fxNames.map(name => loadImg(`/sprites/grudge-box/fx/${name}.png`));
      const fxResults = await Promise.all(fxPromises);
      fxNames.forEach((name, i) => {
        if (fxResults[i]) game.fxImgs[name] = fxResults[i];
      });

      await preloadArenaBgs();
      _arenaCache = null;
      _arenaCacheStageId = null;

      if (!cancelled) raf = requestAnimationFrame(tick);
    }

    const FX_META = {
      Explosion1: { fw: 64,  fh: 64,  count: 10, speed: 3 },
      Explosion2: { fw: 128, fh: 128, count: 10, speed: 3 },
      Explosion3: { fw: 256, fh: 256, count: 10, speed: 3 },
      Explosion4: { fw: 64,  fh: 64,  count: 10, speed: 3 },
      Explosion5: { fw: 128, fh: 128, count: 10, speed: 3 },
      Fire_big:   { fw: 128, fh: 128, count: 17, speed: 2 },
      Fire_small: { fw: 32,  fh: 32,  count: 14, speed: 2 },
    };

    function spawnFX(name, x, y, scale = 1.0, tint = null) {
      const meta = FX_META[name];
      if (!meta) return;
      game.fxEffects.push({
        name, x, y, scale, tint,
        frame: 0, maxFrames: meta.count,
        frameTimer: 0, frameSpeed: meta.speed,
        fw: meta.fw, fh: meta.fh,
        alive: true,
      });
    }

    function handleAttack(attacker, defender, atkName) {
      const atk = ATTACKS[atkName];
      if (!atk) return;

      const staminaPct = getBarPercent(attacker.bars, 'stamina');
      if (staminaPct <= 0 || attacker.barStunned) {
        game.popups.push({ x: attacker.x, y: attacker.y - 130, text: 'EXHAUSTED', color: '#ef4444', timer: 30, vy: -1.5, size: 14 });
        return;
      }
      if (attacker.blockStunTimer > 0) return;

      applyBarDamage(attacker.bars, 'stamina', atk.stamCost);
      applyBarDamage(attacker.bars, 'focus', atk.focusCost || 0);

      attacker.state = 'attack';
      attacker.anim = atkName;
      attacker.frame = 0;
      attacker.frameTimer = game.time;
      attacker.attackFrame = 0;
      attacker.hitConnected = false;

      if (atk.type === 'power' && attacker.weapon) {
        const swingStyle = atkName === 'upper' ? 'overhead' : 'slash';
        startWeaponSwing(attacker.weapon, swingStyle);
      }

      attacker.comboChain.push(atkName);
      attacker.comboTimer = 50;
    }

    function resolveHit(attacker, defender, atkName) {
      const atk = ATTACKS[atkName];
      if (!atk || attacker.hitConnected) return;
      if (defender.knockdown || attacker.knockdown) return;

      const zoneHit = resolveZoneHit(attacker, defender, atkName);
      const dist = Math.abs(attacker.x - defender.x);
      if (!zoneHit && dist > atk.range) return;

      attacker.hitConnected = true;
      const powered = isPoweredUp(attacker);

      let comboBonus = 1;
      for (const chain of COMBO_CHAINS) {
        const cl = chain.seq.length;
        const recent = attacker.comboChain.slice(-cl);
        if (recent.length === cl && recent.every((a, i) => a === chain.seq[i])) {
          comboBonus = chain.bonus;
          attacker.lastComboName = chain.name;
          attacker.comboDisplayTimer = 90;
          attacker.comboMultiplier = chain.bonus;
          break;
        }
      }

      const dmgResult = calculateDamage(atk.dmg, attacker.dmgMult || 1, zoneHit, comboBonus, powered);
      let dmg = dmgResult.damage;
      const isCrit = dmgResult.isCrit;
      if (attacker.momentumBoost > 0) dmg = Math.floor(dmg * MOMENTUM.switchBonus.damageMultiplier);
      const stunFrames = calculateStun(atk.hitstun, zoneHit, powered);

      if (defender.reflectWindow > 0) {
        const reflectDmg = Math.floor(dmg * 1.5);
        applyBarDamage(attacker.bars, 'body', reflectDmg);
        attacker.state = 'hurt';
        attacker.anim = 'hurt';
        attacker.frame = 0;
        attacker.frameTimer = game.time;
        attacker.stunTimer = 30;
        attacker.vx = (defender.facingRight ? 1 : -1) * 18;
        defender.reflectWindow = 0;
        playSound('parry');
        game.popups.push({ x: attacker.x, y: attacker.y - 120, text: `REFLECTED ${reflectDmg}`, color: '#6b7280', timer: 60, vy: -2, size: 24 });
        game.flash = { color: '#6b7280', timer: 10 };
        game.shake.intensity = 12;
        game.shake.timer = 14;
        game.shake.maxTimer = 14;
        const slashVfx = createSlashVFX(attacker.x, attacker.y - 80, 9, 180, 1.2, '#6b7280');
        game.slashEffects.push(slashVfx);
        for (let i = 0; i < 15; i++) game.particles.push(createParticle(attacker.x, attacker.y - 80, '#6b7280'));
        return;
      }

      if (defender.counterWindow > 0) {
        const cSpec = FIGHTER_SPECIALS[defender.fighterId];
        if (cSpec && cSpec.type === 'counter') {
          const counterDmg = Math.floor(cSpec.dmg * (defender.dmgMult || 1));
          applyBarDamage(attacker.bars, 'head', counterDmg * 0.6);
          applyBarDamage(attacker.bars, 'body', counterDmg * 0.4);
          attacker.state = 'hurt';
          attacker.anim = 'hurt';
          attacker.frame = 0;
          attacker.frameTimer = game.time;
          attacker.stunTimer = cSpec.stun;
          attacker.vx = (defender.facingRight ? 1 : -1) * cSpec.kb;
          defender.counterWindow = 0;
          if (cSpec.poisonDmg) {
            attacker.poison = { dmg: cSpec.poisonDmg, timer: cSpec.poisonDur };
          }
          playSound('parry');
          game.popups.push({ x: attacker.x, y: attacker.y - 120, text: `COUNTER ${counterDmg}`, color: cSpec.color, timer: 60, vy: -2, size: 24 });
          game.flash = { color: cSpec.color, timer: 10 };
          game.shake.intensity = 10;
          game.shake.timer = 12;
          game.shake.maxTimer = 12;
          cSpec.slashTypes.forEach((st, i) => {
            game.slashEffects.push(createSlashVFX(attacker.x, attacker.y - 80, st, cSpec.slashAngles[i] || 0, 1.0, cSpec.color));
          });
          for (let i = 0; i < 12; i++) game.particles.push(createParticle(attacker.x, attacker.y - 80, cSpec.color));
          return;
        }
      }

      if (defender.parryWindow > 0) {
        playSound('parry');
        attacker.state = 'stun';
        attacker.anim = 'stun';
        attacker.frame = 0;
        attacker.frameTimer = game.time;
        attacker.stunTimer = 25;
        defender.parryWindow = 0;
        defender.meter = Math.min(defender.maxMeter, defender.meter + MOMENTUM.buildRate.blockSuccess);
        game.popups.push({ x: defender.x, y: defender.y - 120, text: 'PARRY!', color: '#22d3ee', timer: 50, vy: -2, size: 24 });
        game.flash = { color: '#22d3ee', timer: 8 };
        game.shake.intensity = 6;
        game.shake.timer = 8;
        game.shake.maxTimer = 8;
        for (let i = 0; i < 10; i++) game.particles.push(createParticle(defender.x, defender.y - 80, '#22d3ee'));
        return;
      }

      if (defender.armorActive && !attacker.armorActive) {
        dmg = Math.floor(dmg * 0.3);
        game.popups.push({ x: defender.x, y: defender.y - 100, text: 'ARMOR!', color: '#eab308', timer: 40, vy: -1.5, size: 18 });
        const barTarget = zoneHit?.zone?.bar || atk.barTarget || 'body';
        applyBarDamage(defender.bars, barTarget, dmg);
        attacker.vx += (defender.facingRight ? 1 : -1) * PHYSICS.RECOIL_ATTACKER;
        playSound('block');
        return;
      }

      if (defender.state === 'block') {
        const blockReduction = 0.85;
        const blockedDmg = Math.floor(dmg * (1 - blockReduction));
        applyBarDamage(defender.bars, 'body', blockedDmg);
        defender.blockHp -= atk.blockDmg;
        defender.blockStunTimer = atk.blockStun;
        attacker.meter += Math.floor(atk.meterGain * 0.3);
        attacker.vx += (attacker.facingRight ? -1 : 1) * PHYSICS.RECOIL_ATTACKER;
        playSound('block');

        defender.meter = Math.min(defender.maxMeter, defender.meter + MOMENTUM.buildRate.blockSuccess);

        if (atk.type === 'power') applyBarDamage(defender.bars, 'stamina', 5);

        if (defender.blockHp <= 0) {
          defender.blockHp = 0;
          defender.state = 'stun';
          defender.anim = 'stun';
          defender.frame = 0;
          defender.frameTimer = game.time;
          defender.stunTimer = 45;
          game.announcement = { text: 'GUARD BREAK!', timer: 60, size: 36, color: '#ef4444' };
          game.shake.intensity = 10;
          game.shake.timer = 14;
          game.shake.maxTimer = 14;
          playSound('stun');
          for (let i = 0; i < 12; i++) game.particles.push(createParticle(defender.x, defender.y - 80, '#60a5fa'));
        } else {
          for (let i = 0; i < 3; i++) game.particles.push(createParticle(defender.x, defender.y - 60, '#60a5fa'));
        }
        game.popups.push({ x: defender.x, y: defender.y - 100, text: blockedDmg > 0 ? `${blockedDmg}` : 'BLOCKED', color: '#60a5fa', timer: 40, vy: -2 });
        return;
      }

      const barTarget = zoneHit?.zone?.bar || atk.barTarget || 'body';
      applyBarDamage(defender.bars, barTarget, dmg);
      applyBarDamage(defender.bars, 'focus', Math.floor(dmg * 0.3));

      const targetBar = defender.bars[barTarget];
      if (targetBar && getBarPercent(defender.bars, barTarget) < 0.3) {
        const burnAmt = Math.floor(dmg * 0.12);
        if (burnAmt > 0) {
          applyBurnDamage(defender.bars, barTarget, burnAmt);
        }
      }

      defender.hp = defender.bars.head.current + defender.bars.body.current;

      const depletedBar = isBarDepleted(defender.bars);
      if (depletedBar && !defender.barStunned && !defender.knockdown) {
        defender.barStunned = true;
        defender.barStunnedBar = depletedBar;
        defender.knockdown = true;
        defender.knockdownTimer = KNOCKDOWN.countdownFrames;
        defender.knockdownCount++;
        defender.mashCount = 0;
        defender.state = 'ko';
        defender.anim = 'ko';
        defender.frame = 0;
        defender.frameTimer = game.time;
        applyBurnDamage(defender.bars, depletedBar, KNOCKDOWN.burnPerKnockdown * defender.knockdownCount);
        game.announcement = { text: 'DOWN!', timer: 80, size: 48, color: '#ef4444' };
        game.shake.intensity = 12;
        game.shake.timer = 16;
        game.shake.maxTimer = 16;
        game.flash = { color: BAR_DEFS[depletedBar].color, timer: 12 };
        playSound('bar_depleted');
        for (let i = 0; i < 20; i++) game.particles.push(createParticle(defender.x, defender.y - 80, BAR_DEFS[depletedBar].color));
      } else if (!defender.knockdown) {
        defender.state = 'hurt';
        defender.anim = 'hurt';
        defender.frame = 0;
        defender.frameTimer = game.time;
        defender.stunTimer = stunFrames;
      }

      const kb = calculateKnockback(atk.knockback, attacker.facingRight, zoneHit, powered);
      defender.vx = kb;
      defender.vy = atk.launcher ? PHYSICS.LAUNCH_VY : -2;
      attacker.vx += (attacker.facingRight ? -1 : 1) * PHYSICS.RECOIL_ATTACKER;

      const critMeterBonus = isCrit ? (MOMENTUM.buildRate.critHit || 0) : 0;
      attacker.meter = Math.min(attacker.maxMeter, attacker.meter + atk.meterGain + MOMENTUM.buildRate.punchHit + critMeterBonus);
      defender.meter = Math.max(0, defender.meter + MOMENTUM.buildRate.takeDamage);

      const hitstopBase = atk.type === 'power' ? PHYSICS.HITSTOP_HEAVY : PHYSICS.HITSTOP_LIGHT;
      const hitstopFrames = hitstopBase + 2;
      attacker.hitstop = hitstopFrames;
      defender.hitstop = hitstopFrames;

      playSound(atk.sound);
      game.shake.intensity = atk.type === 'power' ? 10 : 5;
      game.shake.timer = atk.type === 'power' ? 12 : 8;
      game.shake.maxTimer = game.shake.timer;

      const hitColor = comboBonus > 1 ? '#fbbf24' : (zoneHit?.zoneName === 'head' ? '#ef4444' : '#ff8800');

      if (atk.type === 'power') {
        game.slowmo = Math.max(game.slowmo || 0, 4);
        game.flash = { color: hitColor, timer: 5 };
      }

      if (comboBonus > 1) {
        game.shake.intensity = 14;
        game.shake.timer = 16;
        game.shake.maxTimer = 16;
        game.flash = { color: '#fbbf24', timer: 10 };
        game.slowmo = 10;
        attacker.hitstop = PHYSICS.HITSTOP_HEAVY + 2;
        defender.hitstop = PHYSICS.HITSTOP_HEAVY + 2;

        if (comboBonus >= 1.5) {
          const aDef = attacker === game.p1 ? p1Def : p2Def;
          const flashTarget = {
            x: defender.x + (attacker.facingRight ? -40 : 40),
            y: defender.y,
          };
          const fs = createFlashStep(attacker, flashTarget.x, flashTarget.y, aDef.color || '#22d3ee');
          game.flashSteps.push(fs);
        }
      }

      const contactX = zoneHit ? zoneHit.contactX : (attacker.x + defender.x) / 2;
      const contactY = zoneHit ? zoneHit.contactY : defender.y - 80;

      const atkZone = ATTACK_ZONES[atkName];
      if (atkZone) {
        const slashVfx = createSlashVFX(
          contactX, contactY,
          atkZone.slashType,
          atkZone.slashAngle * (attacker.facingRight ? 1 : -1),
          powered ? 1.4 : 1.0,
          powered ? '#fbbf24' : null
        );
        game.slashEffects.push(slashVfx);
        if (powered) {
          game.slashEffects.push(createSlashVFX(contactX, contactY, 10, atkZone.slashAngle * (attacker.facingRight ? 1 : -1) + 45, 0.7, '#fbbf24'));
        }
      }

      const sparkIntensity = atk.type === 'power' ? 2.0 : (comboBonus > 1 ? 2.2 : 1.2);
      const sparkColor = comboBonus > 1 ? '#fbbf24' : (zoneHit?.zoneName === 'head' ? '#ef4444' : '#ff8800');
      const hitDir = attacker.facingRight ? 0 : Math.PI;
      const sparks = createHitSpark(contactX, contactY, sparkColor, sparkIntensity, hitDir);
      game.particles.push(...sparks);

      const baseParticles = atk.type === 'power' ? 14 : 10;
      const particleCount = comboBonus > 1 ? baseParticles + 8 : baseParticles;
      for (let i = 0; i < particleCount; i++) {
        game.particles.push(createParticle(contactX, contactY, comboBonus > 1 ? '#fbbf24' : sparkColor));
      }

      if (atk.type === 'power' || comboBonus > 1) {
        const ringColor = comboBonus > 1 ? '#fbbf24' : sparkColor;
        game.shockwave = { x: contactX, y: contactY, timer: 0, maxTimer: 12, color: ringColor };
      }

      for (let i = 0; i < 3; i++) {
        const flashP = {
          x: contactX + (Math.random() - 0.5) * 20,
          y: contactY + (Math.random() - 0.5) * 20,
          vx: 0, vy: 0, life: 4 + Math.floor(Math.random() * 4),
          maxLife: 8, color: '#fff', size: 6 + Math.random() * 8, type: 'flash', trail: [],
        };
        game.particles.push(flashP);
      }

      if (atk.type === 'power') {
        const fxType = zoneHit?.zoneName === 'head' ? 'Explosion1' : 'Explosion4';
        spawnFX(fxType, contactX, contactY, 1.5);
      }

      if (Math.abs(kb) > 6) {
        const dustDir = attacker.facingRight ? 1 : -1;
        game.particles.push(...createDustPuff(defender.x, GROUND, dustDir, 5));
      }

      const barLabel = BAR_DEFS[barTarget]?.label || '';
      const popupText = isCrit ? `CRIT! ${dmg}` : (comboBonus > 1 ? `${dmg} COMBO!` : `${dmg} ${barLabel}`);
      const popupColor = isCrit ? '#ff4444' : (comboBonus > 1 ? '#fbbf24' : BAR_DEFS[barTarget]?.color || '#fff');
      const popupSize = isCrit ? 30 : (comboBonus > 1 ? 28 : (zoneHit?.zoneName === 'head' ? 24 : 20));
      game.popups.push({
        x: defender.x, y: defender.y - 120,
        text: popupText, color: popupColor,
        timer: isCrit ? 65 : 50, vy: isCrit ? -3 : -2.5,
        size: popupSize,
      });

      if (isCrit) {
        game.shake.intensity = Math.max(game.shake.intensity, 10);
        game.shake.timer = Math.max(game.shake.timer, 12);
        game.shake.maxTimer = game.shake.timer;
        game.flash = { color: '#ff4444', timer: 10 };
        game.slowmo = Math.max(game.slowmo || 0, 6);
        for (let i = 0; i < 12; i++) game.particles.push(createParticle(contactX, contactY, '#ff4444'));
      }
    }

    function handleSpecial(attacker, defender) {
      const fighterId = attacker === game.p1 ? p1Def.id : p2Def.id;
      const spec = FIGHTER_SPECIALS[fighterId];
      if (!spec) return;
      if (attacker.meter < spec.meterCost) return;
      if (getBarPercent(attacker.bars, 'stamina') < 0.1) return;

      attacker.meter = 0;
      applyBarDamage(attacker.bars, 'stamina', spec.stamCost || 15);
      attacker.state = 'attack';
      attacker.anim = 'special';
      attacker.frame = 0;
      attacker.frameTimer = game.time;
      attacker.attackFrame = 0;
      attacker.hitConnected = false;
      attacker.specialState = { type: spec.type, timer: 0, hitCount: 0, phase: 'active', fighterId };

      attacker.momentum = Math.min(MOMENTUM.specialMeterMax, attacker.momentum + MOMENTUM.switchBonus.meterGain);
      attacker.momentumBoost = MOMENTUM.switchBonus.speedBoostFrames;

      game.slowmo = 25;
      game.flash = { color: spec.color, timer: 15 };
      game.announcement = { text: spec.name, timer: 55, size: 36, color: spec.color, sub: spec.description };
      playSound('special');

      const dist = Math.abs(attacker.x - defender.x);

      if (fighterId === 'raze') {
        spawnFX('Fire_big', attacker.x, attacker.y - 60, 2.5);
        for (let i = 0; i < 3; i++) {
          setTimeout(() => spawnFX('Fire_small', attacker.x + (Math.random() - 0.5) * 100, attacker.y - 40 - i * 20, 3.0), i * 80);
        }
      } else if (fighterId === 'volt') {
        spawnFX('Explosion3', attacker.x, attacker.y - 100, 1.2);
        spawnFX('Explosion5', attacker.x - 80, attacker.y - 60, 1.0);
        spawnFX('Explosion5', attacker.x + 80, attacker.y - 60, 1.0);
      } else if (fighterId === 'venom') {
        spawnFX('Fire_small', attacker.x, attacker.y - 90, 4.0);
        for (let i = 0; i < 5; i++) {
          setTimeout(() => spawnFX('Fire_small', attacker.x + (Math.random() - 0.5) * 120, attacker.y - 20 - Math.random() * 100, 2.5), i * 60);
        }
      } else if (fighterId === 'wraith') {
        spawnFX('Explosion1', attacker.x, attacker.y - 80, 2.0);
        spawnFX('Explosion4', defender.x, defender.y - 80, 2.5);
      } else if (fighterId === 'blitz') {
        spawnFX('Explosion2', attacker.x + (attacker.facingRight ? 60 : -60), attacker.y - 80, 2.0);
        spawnFX('Fire_big', attacker.x, attacker.y - 40, 2.0);
      } else if (fighterId === 'shade') {
        spawnFX('Explosion4', attacker.x + (attacker.facingRight ? 40 : -40), attacker.y - 80, 3.0);
        spawnFX('Explosion1', attacker.x, attacker.y - 80, 2.0);
      } else if (fighterId === 'ghost') {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => spawnFX('Explosion1', attacker.x + (Math.random() - 0.5) * 150, attacker.y - 40 - Math.random() * 80, 2.0), i * 50);
        }
      } else if (fighterId === 'surge') {
        spawnFX('Explosion3', (attacker.x + defender.x) / 2, (attacker.y + defender.y) / 2 - 80, 1.5);
        spawnFX('Fire_big', defender.x, defender.y - 60, 2.0);
        spawnFX('Explosion5', defender.x, defender.y - 100, 1.2);
      }

      if (spec.type === 'teleport') {
        const behindX = defender.x + (defender.facingRight ? -120 : 120);
        attacker.x = Math.max(PHYSICS.BOUNDARY_MIN, Math.min(PHYSICS.BOUNDARY_MAX, behindX));
        attacker.facingRight = attacker.x < defender.x;
        attacker.phaseActive = true;
        setTimeout(() => { attacker.phaseActive = false; }, 200);
        game.flash = { color: spec.color, timer: 12 };
        for (let i = 0; i < 10; i++) game.particles.push(createParticle(attacker.x, attacker.y - 80, spec.color));
        spawnFX('Explosion4', behindX, attacker.y - 80, 2.5);
      }

      if (spec.type === 'counter') {
        attacker.counterWindow = spec.counterWindow;
        attacker.fighterId = fighterId;
        game.popups.push({ x: attacker.x, y: attacker.y - 140, text: 'COUNTER STANCE', color: spec.color, timer: 50, vy: -1.5, size: 20 });
        return;
      }

      if (spec.type === 'reflect') {
        attacker.reflectWindow = spec.reflectWindow;
        attacker.fighterId = fighterId;
        game.popups.push({ x: attacker.x, y: attacker.y - 140, text: 'IRON WALL!', color: spec.color, timer: 50, vy: -1.5, size: 20 });
        return;
      }

      if (spec.type === 'charge') {
        attacker.armorActive = true;
        attacker.specialState.chargeTimer = spec.chargeFrames;
        spawnFX('Fire_big', attacker.x, attacker.y - 40, 2.0);
        return;
      }

      if (spec.type === 'phase') {
        attacker.phaseActive = true;
        attacker.invulnTimer = spec.phaseDur;
        return;
      }

      const castType = FIGHTER_CAST_TYPE[attacker.fighterId] || 'fire';
      const ce = createCastEffect(attacker.x, attacker.y - DRAW_H * 0.35, castType, 1.2);
      game.castEffects.push(ce);

      if (dist < (spec.range || 180)) {
        executeSpecialDamage(attacker, defender, spec);
      }
    }

    function executeSpecialDamage(attacker, defender, spec) {
      let totalDmg = 0;
      const powered = isPoweredUp(attacker);

      if (spec.type === 'multi_hit' || spec.type === 'phase') {
        const perHitDmg = Math.floor((spec.dmgPerHit || 8) * (attacker.dmgMult || 1) * (powered ? 1.4 : 1));
        totalDmg = perHitDmg * (spec.hits || 3);
        for (let i = 0; i < (spec.hits || 3); i++) {
          const delay = i * (spec.hitInterval || 4);
          setTimeout(() => {
            if (defender.bars.head.current > 0 || defender.bars.body.current > 0) {
              const barTarget = i % 2 === 0 ? 'head' : 'body';
              applyBarDamage(defender.bars, barTarget, perHitDmg);
              applyBarDamage(defender.bars, 'focus', Math.floor(perHitDmg * 0.2));
              defender.hp = defender.bars.head.current + defender.bars.body.current;
              const hitX = (attacker.x + defender.x) / 2;
              const hitY = defender.y - 60 - i * 10;
              game.particles.push(createParticle(hitX, hitY, spec.color));
              game.particles.push(createParticle(hitX, hitY, spec.color));
              game.popups.push({ x: hitX + (Math.random() - 0.5) * 40, y: hitY, text: `${perHitDmg}`, color: spec.color, timer: 30, vy: -2, size: 16 });
              if (spec.slashTypes && spec.slashTypes[i]) {
                game.slashEffects.push(createSlashVFX(hitX, hitY, spec.slashTypes[i], (spec.slashAngles?.[i] || 0) * (attacker.facingRight ? 1 : -1), powered ? 1.3 : 1.0, spec.color));
              }
              game.shake.intensity = 5;
              game.shake.timer = 4;
              game.shake.maxTimer = 4;
              playSound('hit_light');
            }
          }, delay * 16);
        }
      } else if (spec.type === 'aoe') {
        totalDmg = Math.floor(spec.dmg * (attacker.dmgMult || 1) * (powered ? 1.4 : 1));
        applyBarDamage(defender.bars, 'body', totalDmg * 0.6);
        applyBarDamage(defender.bars, 'head', totalDmg * 0.4);
        defender.hp = defender.bars.head.current + defender.bars.body.current;
        spec.slashTypes?.forEach((st, i) => {
          game.slashEffects.push(createSlashVFX(attacker.x, attacker.y - 80, st, (spec.slashAngles?.[i] || 0), 1.5, spec.color));
        });
      } else if (spec.type === 'burst') {
        totalDmg = Math.floor((spec.baseDmg + 100 * spec.meterBonusMult) * (attacker.dmgMult || 1) * (powered ? 1.4 : 1));
        applyBarDamage(defender.bars, 'head', totalDmg * 0.5);
        applyBarDamage(defender.bars, 'body', totalDmg * 0.5);
        defender.hp = defender.bars.head.current + defender.bars.body.current;
        spec.slashTypes?.forEach((st, i) => {
          game.slashEffects.push(createSlashVFX(defender.x, defender.y - 80, st, (spec.slashAngles?.[i] || 0) * (attacker.facingRight ? 1 : -1), 1.4, spec.color));
        });
      } else if (spec.type === 'teleport') {
        totalDmg = Math.floor(spec.dmg * (attacker.dmgMult || 1) * (powered ? 1.4 : 1));
        applyBarDamage(defender.bars, 'head', totalDmg);
        defender.hp = defender.bars.head.current + defender.bars.body.current;
        spec.slashTypes?.forEach((st, i) => {
          game.slashEffects.push(createSlashVFX(defender.x, defender.y - 80, st, (spec.slashAngles?.[i] || 0) * (attacker.facingRight ? 1 : -1), 1.2, spec.color));
        });
      } else {
        totalDmg = Math.floor((spec.dmg || 30) * (attacker.dmgMult || 1) * (powered ? 1.4 : 1));
        applyBarDamage(defender.bars, 'body', totalDmg * 0.5);
        applyBarDamage(defender.bars, 'head', totalDmg * 0.5);
        defender.hp = defender.bars.head.current + defender.bars.body.current;
      }

      const depletedBar = isBarDepleted(defender.bars);
      if (depletedBar && !defender.barStunned) {
        defender.barStunned = true;
        defender.barStunnedBar = depletedBar;
        defender.stunTimer = Math.max(60, spec.stun || spec.stunFinal || 30);
        defender.state = 'stun';
        defender.anim = 'stun';
        game.announcement = { text: `${BAR_DEFS[depletedBar].label} DEPLETED!`, timer: 50, size: 30, color: BAR_DEFS[depletedBar].color };
        playSound('bar_depleted');
      } else {
        defender.state = 'hurt';
        defender.anim = 'hurt';
        defender.stunTimer = spec.stun || spec.stunFinal || 30;
      }
      defender.frame = 0;
      defender.frameTimer = game.time;
      defender.vx = (attacker.facingRight ? 1 : -1) * (spec.kb || spec.kbFinal || 18);
      defender.vy = -12;
      game.shake.intensity = 16;
      game.shake.timer = 20;
      game.shake.maxTimer = 20;
      for (let i = 0; i < 25; i++) game.particles.push(createParticle(defender.x, defender.y - 80, spec.color));
      game.popups.push({ x: defender.x, y: defender.y - 140, text: `${totalDmg} ${spec.name}!`, color: spec.color, timer: 70, vy: -3, size: 28 });
    }

    function updateAI(p2, p1, time) {
      if (p2.knockdown) {
        if (game.time % 4 === 0 && p2.barStunnedBar && p2.bars[p2.barStunnedBar]) {
          p2.mashCount++;
          p2.bars[p2.barStunnedBar].current += KNOCKDOWN.recoveryPerMash * 0.7;
        }
        return;
      }
      if (p2.state === 'hurt' || p2.state === 'stun') return;
      if (p2.stunTimer > 0 || p2.blockStunTimer > 0 || p2.barStunned) return;
      if (p2.state === 'attack') return;

      game.aiTimer--;
      if (game.aiTimer > 0 && game.aiDecision) {
        if (game.aiDecision === 'block' && p2.state !== 'block') {
          p2.state = 'block';
          p2.anim = 'block';
          p2.frame = 0;
          p2.frameTimer = game.time;
        }
        return;
      }

      const dist = Math.abs(p2.x - p1.x);
      const rand = Math.random();

      p2.facingRight = p2.x < p1.x;

      if (p1.state === 'attack' && dist < 180 && rand < 0.65) {
        if (p2.parryOrb.litTimer > 0 && rand < 0.55 && getBarPercent(p2.bars, 'stamina') > 0.15) {
          p2.parryWindow = 6;
          p2.parryOrb.litTimer = 0;
          p2.parryOrb.cooldown = 90 + Math.floor(Math.random() * 150);
          p2.lastBlockTime = game.time;
          game.aiTimer = 8;
          game.aiDecision = 'parry';
        } else {
          game.aiDecision = 'block';
          game.aiTimer = 20;
          p2.state = 'block';
          p2.anim = 'block';
          p2.frame = 0;
          p2.frameTimer = game.time;
        }
        return;
      }

      if (dist > 180) {
        p2.state = 'walk';
        p2.anim = 'walk';
        const aiSpd = p2.moveSpeed || 4;
        p2.x += p2.facingRight ? aiSpd : -aiSpd;
        game.aiTimer = 6;
        game.aiDecision = 'walk';
        return;
      }

      if (dist <= 180) {
        if (p2.meter >= p2.maxMeter && rand < 0.12) {
          handleSpecial(p2, p1);
          game.aiTimer = 30;
          game.aiDecision = 'special';
          return;
        }

        if (p1.state === 'block' && rand < 0.25) {
          const heavyAtks = ['cross', 'hook', 'upper'];
          const pick = heavyAtks[Math.floor(Math.random() * heavyAtks.length)];
          handleAttack(p2, p1, pick);
          game.aiTimer = 18;
          game.aiDecision = pick;
        } else if (rand < 0.30) {
          handleAttack(p2, p1, 'jab');
          game.aiTimer = 12;
          game.aiDecision = 'jab';
        } else if (rand < 0.45) {
          handleAttack(p2, p1, 'cross');
          game.aiTimer = 18;
          game.aiDecision = 'cross';
        } else if (rand < 0.55) {
          handleAttack(p2, p1, 'kick');
          game.aiTimer = 15;
          game.aiDecision = 'kick';
        } else if (rand < 0.62) {
          handleAttack(p2, p1, 'upper');
          game.aiTimer = 22;
          game.aiDecision = 'upper';
        } else if (rand < 0.68) {
          handleAttack(p2, p1, 'lowkick');
          game.aiTimer = 12;
          game.aiDecision = 'lowkick';
        } else if (rand < 0.74) {
          handleAttack(p2, p1, 'hook');
          game.aiTimer = 18;
          game.aiDecision = 'hook';
        } else if (rand < 0.80) {
          handleAttack(p2, p1, 'highkick');
          game.aiTimer = 15;
          game.aiDecision = 'highkick';
        } else if (rand < 0.92) {
          game.aiDecision = 'block';
          game.aiTimer = 18;
          p2.state = 'block';
          p2.anim = 'block';
          p2.frame = 0;
          p2.frameTimer = game.time;
        } else {
          p2.state = 'walk';
          p2.anim = 'walk';
          const retreatSpd = p2.moveSpeed || 4;
          p2.x += p2.facingRight ? -retreatSpd : retreatSpd;
          game.aiTimer = 8;
          game.aiDecision = 'retreat';
        }
      } else {
        game.aiTimer = 4;
        game.aiDecision = 'wait';
        p2.state = 'idle';
        p2.anim = 'idle';
      }
    }

    function updateFighter(f, dt) {
      if (f.hitstop > 0) { f.hitstop--; return; }

      if (f.stunTimer > 0) f.stunTimer--;
      if (f.invulnTimer > 0) f.invulnTimer--;
      if (f.dashCooldown > 0) f.dashCooldown--;
      if (f.blockStunTimer > 0) f.blockStunTimer--;
      if (f.parryWindow > 0) f.parryWindow--;
      if (f.counterWindow > 0) f.counterWindow--;
      if (f.reflectWindow > 0) f.reflectWindow--;
      if (f.inputBufferTimer > 0 && f.state !== 'attack') f.inputBufferTimer--;
      if (f.comboTimer > 0) {
        f.comboTimer--;
        if (f.comboTimer <= 0) f.comboChain = [];
      }
      if (f.comboDisplayTimer > 0) f.comboDisplayTimer--;
      if (f.momentumBoost > 0) f.momentumBoost--;

      const orb = f.parryOrb;
      orb.angle += 0.04;
      if (orb.litTimer > 0) {
        orb.litTimer--;
      } else {
        orb.cooldown--;
        if (orb.cooldown <= 0) {
          orb.litTimer = 18;
          orb.cooldown = 90 + Math.floor(Math.random() * 150);
        }
      }

      if (f.state === 'idle' && f.meter > 0) {
        f.meter = Math.max(0, f.meter - MOMENTUM.decayRate * 0.016);
      }

      updatePowerup(f);
      const roundElapsed = game.time - (game.roundStartTime || 0);
      updateBars(f, f.state === 'block', roundElapsed);

      const depletedBar = isBarDepleted(f.bars);
      if (depletedBar && !f.barStunned && f.state !== 'ko' && !f.knockdown) {
        f.barStunned = true;
        f.barStunnedBar = depletedBar;
        f.knockdown = true;
        f.knockdownTimer = KNOCKDOWN.countdownFrames;
        f.knockdownCount++;
        f.mashCount = 0;
        f.state = 'ko';
        f.anim = 'ko';
        f.frame = 0;
        f.frameTimer = game.time;
        applyBurnDamage(f.bars, depletedBar, KNOCKDOWN.burnPerKnockdown * f.knockdownCount);
        playSound('bar_depleted');
        game.shake.intensity = 10;
        game.shake.timer = 15;
        game.shake.maxTimer = 15;
        game.announcement = { text: 'DOWN!', timer: 80, size: 48, color: '#ef4444' };
      }

      if (f.knockdown) {
        f.knockdownTimer--;
        const knockdownBar = f.barStunnedBar && f.bars[f.barStunnedBar] ? f.bars[f.barStunnedBar] : null;
        const effMax = knockdownBar ? getEffectiveMax(knockdownBar) : 100;
        if (f.mashCount >= 10 && knockdownBar && knockdownBar.current >= effMax * KNOCKDOWN.getUpThreshold) {
          f.knockdown = false;
          f.knockdownTimer = 0;
          f.barStunned = false;
          f.barStunnedBar = null;
          f.state = 'idle';
          f.anim = 'idle';
          f.frame = 0;
          f.frameTimer = game.time;
          f.invulnTimer = 30;
          game.announcement = { text: 'GET UP!', timer: 40, size: 36, color: '#22d3ee' };
          playSound('round');
        }
      }

      if (f.barStunned && !f.knockdown) {
        const depBar = f.bars[f.barStunnedBar];
        const effMax = getEffectiveMax(depBar);
        if (depBar && depBar.current >= effMax * STUN_THRESHOLD_PCT) {
          f.barStunned = false;
          f.barStunnedBar = null;
        }
      }

      if (f.poison) {
        f.poison.timer--;
        if (game.time % 30 === 0) {
          applyBarDamage(f.bars, 'body', f.poison.dmg);
          f.hp = f.bars.head.current + f.bars.body.current;
          game.popups.push({ x: f.x, y: f.y - 100, text: `${f.poison.dmg}`, color: '#22c55e', timer: 20, vy: -1, size: 12 });
        }
        if (f.poison.timer <= 0) f.poison = null;
      }

      if (f.specialState) {
        f.specialState.timer++;
        const fId = f.specialState.fighterId;
        const spec = FIGHTER_SPECIALS[fId];
        if (spec) {
          if (spec.type === 'charge' && f.specialState.chargeTimer > 0) {
            f.specialState.chargeTimer--;
            if (f.specialState.chargeTimer <= 0) {
              f.armorActive = false;
              const other = f === game.p1 ? game.p2 : game.p1;
              const dist = Math.abs(f.x - other.x);
              if (dist < (spec.range || 170)) {
                executeSpecialDamage(f, other, spec);
              }
            }
          }
          if (spec.type === 'phase' && f.specialState.timer > spec.phaseDur) {
            f.phaseActive = false;
            const other = f === game.p1 ? game.p2 : game.p1;
            const dist = Math.abs(f.x - other.x);
            if (dist < (spec.range || 180)) {
              executeSpecialDamage(f, other, spec);
            }
          }
          if (f.specialState.timer > (spec.totalFrames || 30)) {
            f.specialState = null;
            f.armorActive = false;
            f.phaseActive = false;
          }
        }
      }

      f.blockHp = Math.min(f.maxBlockHp, f.blockHp + (f.state === 'block' ? 0.03 : 0.08));

      if (f.dashTimer > 0) {
        f.dashTimer--;
        f.vx = f.dashDir * PHYSICS.DASH_SPEED;
        if (game.time % 2 === 0) {
          const idx = f === game.p1 ? 0 : 1;
          game.afterimages.push(createAfterimage(f, 0.25, idx));
        }
        if (f.dashTimer <= 0) {
          f.vx = f.dashDir * 2;
          game.particles.push(...createDustPuff(f.x, GROUND, -f.dashDir, 3));
        }
      }

      applyPhysics(f);

      if (f.landedHard) {
        f.landedHard = false;
        game.particles.push(...createDustPuff(f.x, GROUND, 0, 4));
      }

      if (f.state === 'attack') {
        const a = ANIMS[f.anim] || ANIMS.idle;
        f.attackFrame++;
        const elapsed = game.time - f.frameTimer;
        const frameIdx = Math.floor(elapsed / (a.speed || 70));
        f.frame = Math.min(frameIdx, a.frames.length - 1);

        const atk = ATTACKS[f.anim];

        if (atk && f.attackFrame >= atk.startup - 1 && f.attackFrame <= atk.startup + atk.active + 2) {
          if (game.time % 2 === 0) {
            const idx = f === game.p1 ? 0 : 1;
            const trailAlpha = atk.type === 'power' ? 0.35 : 0.25;
            game.afterimages.push(createAfterimage(f, trailAlpha, idx));
          }
        }

        if (atk && f.attackFrame >= atk.startup && f.attackFrame <= atk.startup + atk.active) {
          const other = f === game.p1 ? game.p2 : game.p1;
          resolveHit(f, other, f.anim);
        }

        if (f.frame >= a.frames.length - 1 || f.attackFrame >= (atk ? atk.startup + atk.active + atk.recovery : 20)) {
          f.state = 'idle';
          f.anim = 'idle';
          f.frame = 0;
          f.frameTimer = game.time;
        }
      } else if (f.state === 'hurt' || f.state === 'stun') {
        if (f.stunTimer <= 0 && !f.barStunned) {
          f.state = 'idle';
          f.anim = 'idle';
          f.frame = 0;
          f.frameTimer = game.time;
        } else {
          const a = f.state === 'stun' ? ANIMS.stun : ANIMS.hurt;
          const elapsed = game.time - f.frameTimer;
          f.frame = Math.min(Math.floor(elapsed / (a.speed || 70)), a.frames.length - 1);
        }
      } else if (f.state === 'ko') {
        const a = ANIMS.ko;
        const elapsed = game.time - f.frameTimer;
        f.frame = Math.min(Math.floor(elapsed / (a.speed || 80)), a.frames.length - 1);
      } else if (f.state === 'block') {
        const a = ANIMS.block;
        const elapsed = game.time - f.frameTimer;
        f.frame = Math.min(Math.floor(elapsed / (a.speed || 100)), a.frames.length - 1);
      } else {
        const a = ANIMS[f.anim] || ANIMS.idle;
        if (a.loop) {
          const elapsed = game.time - f.frameTimer;
          f.frame = Math.floor(elapsed / (a.speed || 100)) % a.frames.length;
        }
      }
    }

    function processInput(player, keys, otherPlayer) {
      if (player.knockdown) {
        if ((keys.jab || keys.cross || keys.kick || keys.upper || keys.lowkick || keys.hook || keys.highkick || keys.block || keys.dash) && player.barStunnedBar && player.bars[player.barStunnedBar]) {
          player.mashCount++;
          player.bars[player.barStunnedBar].current += KNOCKDOWN.recoveryPerMash;
        }
        return;
      }
      if (player.dashTimer > 0) return;
      if (player.barStunned) return;

      if (player.inputBufferTimer > 0 && player.inputBuffer && player.state !== 'attack' && player.state !== 'hurt' && player.state !== 'stun' && player.state !== 'ko' && player.blockStunTimer <= 0) {
        const bufferedAtk = player.inputBuffer;
        player.inputBuffer = null;
        player.inputBufferTimer = 0;
        handleAttack(player, otherPlayer, bufferedAtk);
        return;
      }

      if (player.state === 'ko' || player.state === 'hurt' || player.state === 'stun') return;
      if (player.blockStunTimer > 0) return;

      if (player.state === 'attack') {
        const atkMap = [
          ['jab', keys.jab], ['cross', keys.cross], ['kick', keys.kick],
          ['upper', keys.upper], ['lowkick', keys.lowkick],
          ['hook', keys.hook], ['highkick', keys.highkick],
        ];
        for (const [name, pressed] of atkMap) {
          if (pressed) {
            player.inputBuffer = name;
            player.inputBufferTimer = 10;
            break;
          }
        }
        return;
      }

      if (keys.block) {
        if (player.state !== 'block') {
          player.state = 'block';
          player.anim = 'block';
          player.frame = 0;
          player.frameTimer = game.time;
          if (player.parryOrb.litTimer > 0) {
            player.parryWindow = 6;
            player.parryOrb.litTimer = 0;
            player.parryOrb.cooldown = 90 + Math.floor(Math.random() * 150);
            playSound('parry');
          }
          player.lastBlockTime = game.time;
        }
        return;
      } else if (player.state === 'block') {
        player.state = 'idle';
        player.anim = 'idle';
        player.frame = 0;
        player.frameTimer = game.time;
      }

      if (keys.powerup && !player.powerup.used && !player.powerup.active) {
        if (activatePowerup(player)) {
          game.slowmo = 15;
          game.flash = { color: '#fbbf24', timer: 12 };
          const fDef = player === game.p1 ? p1Def : p2Def;
          game.announcement = { text: 'POWER UP!', timer: 45, size: 40, color: fDef.color };
          playSound('special');
          for (let i = 0; i < 20; i++) game.particles.push(createParticle(player.x, player.y - 80, fDef.color, 'burst'));
        }
        return;
      }

      if (keys.special && player.meter >= player.maxMeter) {
        handleSpecial(player, otherPlayer);
        return;
      }

      if (keys.dash && !player._dashHeld && player.dashCooldown <= 0 && player.y >= GROUND - 5 && getBarPercent(player.bars, 'stamina') > 0.1) {
        player._dashHeld = true;
        player.dashTimer = PHYSICS.DASH_DURATION;
        player.dashCooldown = PHYSICS.DASH_COOLDOWN;
        player.dashDir = player.facingRight ? 1 : -1;
        applyBarDamage(player.bars, 'stamina', 8);
        player.invulnTimer = Math.floor(PHYSICS.DASH_DURATION * 0.6);
        game.particles.push(...createDustPuff(player.x, GROUND, -player.dashDir, 5));
        playSound('hit_light');
        return;
      }

      const atkMap = [
        ['jab', keys.jab], ['cross', keys.cross], ['kick', keys.kick],
        ['upper', keys.upper], ['lowkick', keys.lowkick],
        ['hook', keys.hook], ['highkick', keys.highkick],
      ];
      for (const [name, pressed] of atkMap) {
        if (pressed) {
          handleAttack(player, otherPlayer, name);
          return;
        }
      }

      if (!keys.dash) player._dashHeld = false;

      let moving = false;
      const spd = player.moveSpeed || 4;
      const spdMult = player.momentumBoost > 0 ? 1.2 : 1;
      if (keys.left) { player.x -= spd * spdMult; moving = true; }
      if (keys.right) { player.x += spd * spdMult; moving = true; }
      if (keys.jump && player.y >= GROUND) { player.vy = -14; player.y -= 1; }

      if (moving && player.state !== 'walk') {
        player.state = 'walk';
        player.anim = 'walk';
        player.frameTimer = game.time;
      } else if (!moving && player.state === 'walk') {
        player.state = 'idle';
        player.anim = 'idle';
        player.frameTimer = game.time;
      }

      player.facingRight = player.x < otherPlayer.x;
    }

    function processMouseInput(player, mouse, otherPlayer) {
      if (!mouse.onCanvas) return;

      if (player.knockdown) {
        if (mouse.lmbJustPressed && player.barStunnedBar && player.bars[player.barStunnedBar]) {
          player.mashCount++;
          player.bars[player.barStunnedBar].current += KNOCKDOWN.recoveryPerMash;
          mouse.lmbJustPressed = false;
        }
        return;
      }

      if (player.barStunned) { mouse.lmbJustPressed = false; return; }
      if (player.state === 'ko' || player.state === 'hurt' || player.state === 'stun') { mouse.lmbJustPressed = false; return; }
      if (player.blockStunTimer > 0) { mouse.lmbJustPressed = false; return; }

      if (mouse.rmb) {
        let absorbedSpot = false;
        for (const spot of game.recoverySpots) {
          if (!spot.active) continue;
          const dx = player.x - spot.x;
          const dy = player.y - spot.y + DRAW_H * 0.2;
          if (Math.sqrt(dx * dx + dy * dy) < spot.radius + 30) {
            const bar = player.bars[spot.barType];
            if (bar) {
              bar.current = Math.min(getEffectiveMax(bar), bar.current + spot.healAmount);
              player.hp = player.bars.head.current + player.bars.body.current;
              game.popups.push({ x: player.x, y: player.y - 120, text: `+${spot.healAmount} ${BAR_DEFS[spot.barType].label}`, color: BAR_DEFS[spot.barType].color, timer: 40, vy: -2, size: 16 });
              for (let i = 0; i < 8; i++) game.particles.push(createParticle(spot.x, spot.y, BAR_DEFS[spot.barType].color, 'burst'));
              spot.active = false;
              spot.cooldown = 480;
              spot.spawnTimer = 60;
              absorbedSpot = true;
              playSound('parry');
            }
            break;
          }
        }
        if (!absorbedSpot) {
          if (player.state !== 'block') {
            player.state = 'block';
            player.anim = 'block';
            player.frame = 0;
            player.frameTimer = game.time;
            if (player.parryOrb.litTimer > 0) {
              player.parryWindow = 6;
              player.parryOrb.litTimer = 0;
              player.parryOrb.cooldown = 90 + Math.floor(Math.random() * 150);
              playSound('parry');
            }
            player.lastBlockTime = game.time;
          }
        }
        mouse.lmbJustPressed = false;
        return;
      } else if (player.state === 'block' && !mouse.rmb) {
        const k = keysRef.current;
        if (!(k['ShiftLeft'] || k['ShiftRight'] || k['KeyS'])) {
          player.state = 'idle';
          player.anim = 'idle';
          player.frame = 0;
          player.frameTimer = game.time;
        }
      }

      if (mouse.lmbJustPressed) {
        const glove = clampGlovePosition(player.x, player.y, mouse.x, mouse.y);
        const punchType = getPunchType(player, glove.x, glove.y, player.dashTimer > 0);
        if (player.state === 'attack') {
          player.inputBuffer = punchType;
          player.inputBufferTimer = 10;
        } else {
          handleAttack(player, otherPlayer, punchType);
        }
        mouse.lmbJustPressed = false;
      }
    }

    function getP1Keys() {
      const k = keysRef.current;
      return {
        left: k['KeyA'] || k['ArrowLeft'],
        right: k['KeyD'] || k['ArrowRight'],
        jump: k['KeyW'] || k['ArrowUp'],
        block: k['ShiftLeft'] || k['ShiftRight'] || k['KeyS'],
        special: k['Space'] || k['KeyR'],
        powerup: k['KeyQ'],
        dash: k['KeyE'],
        jab: k['KeyX'], cross: k['KeyK'], kick: k['KeyL'],
        upper: k['KeyU'], lowkick: k['KeyI'], hook: k['KeyO'], highkick: k['KeyC'],
      };
    }

    function getP2Keys() {
      const k = keysRef.current;
      return {
        left: k['Numpad4'],
        right: k['Numpad6'],
        jump: k['Numpad8'],
        block: k['Numpad5'] || k['Numpad0'],
        special: k['NumpadEnter'],
        powerup: k['NumpadAdd'],
        dash: k['NumpadSubtract'],
        jab: k['Numpad7'], cross: k['Numpad9'], kick: k['Numpad3'],
        upper: k['Numpad1'], lowkick: k['Delete'], hook: k['End'], highkick: k['PageDown'],
      };
    }

    const gpPrevState = [
      { buttons: new Array(20).fill(false) },
      { buttons: new Array(20).fill(false) },
    ];

    function getGamepadKeys(padIndex) {
      try {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[padIndex];
        if (!gp || !gp.connected) return null;

        const prev = gpPrevState[padIndex];
        const pressed = (btnIdx) => gp.buttons[btnIdx]?.pressed || false;
        const justPressed = (btnIdx) => pressed(btnIdx) && !prev.buttons[btnIdx];

        const deadzone = 0.3;
        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;

        const dpadUp    = pressed(12) || ly < -deadzone;
        const dpadDown  = pressed(13) || ly > deadzone;
        const dpadLeft  = pressed(14) || lx < -deadzone;
        const dpadRight = pressed(15) || lx > deadzone;

        const keys = {
          left: dpadLeft,
          right: dpadRight,
          jump: dpadUp,
          block: pressed(4) || pressed(6),
          special: justPressed(5) || justPressed(7),
          powerup: justPressed(8) || justPressed(10),
          dash: justPressed(9) || justPressed(11),
          jab: justPressed(2),
          cross: justPressed(3),
          kick: justPressed(0),
          lowkick: justPressed(1),
          upper: justPressed(5) && pressed(0),
          hook: justPressed(3) && pressed(4),
          highkick: justPressed(2) && pressed(13),
        };

        for (let i = 0; i < gp.buttons.length; i++) {
          prev.buttons[i] = pressed(i);
        }

        return keys;
      } catch (e) { return null; }
    }

    function mergeKeys(kbKeys, gpKeys) {
      if (!gpKeys) return kbKeys;
      const merged = {};
      for (const k of Object.keys(kbKeys)) {
        merged[k] = kbKeys[k] || gpKeys[k];
      }
      return merged;
    }

    function triggerKO(loser, winner, color) {
      loser.hp = 0;
      loser.knockdown = false;
      loser.state = 'ko';
      loser.anim = 'ko';
      loser.frame = 0;
      loser.frameTimer = game.time;
      winner.state = 'idle';
      winner.anim = 'win';
      winner.frame = 0;
      winner.frameTimer = game.time;
      winner.wins++;
      game.phase = 'ko';
      game.phaseTimer = 180;
      game.announcement = { text: 'K.O.!', timer: 120, size: 64, color };
      game.shake.intensity = 18;
      game.shake.timer = 35;
      game.shake.maxTimer = 35;
      game.flash = { color, timer: 20 };
      game.slowmo = 30;
      game.koZoom = { timer: 60, cx: loser.x, cy: loser.y - 60, maxTimer: 60 };
      game.shockwave = { x: loser.x, y: loser.y - 60, timer: 0, maxTimer: 25, color };
      playSound('ko');
      for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 * i) / 40;
        const speed = 3 + Math.random() * 6;
        game.particles.push({
          x: loser.x, y: loser.y - 80,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life: 25 + Math.floor(Math.random() * 15),
          maxLife: 40,
          color,
          size: 2 + Math.random() * 5,
          type: 'spark',
          trail: [],
        });
      }

      const loserDef = loser === game.p1 ? p1Def : p2Def;
      const ragdoll = createRagdoll(loser.x, loser.y - DRAW_H * 0.3, 1.5, loserDef.color || '#e2e8f0');
      addRagdollToWorld(game.ragdollWorld, ragdoll);
      const dir = winner.facingRight ? 1 : -1;
      launchRagdoll(ragdoll, loser.x, loser.y - DRAW_H * 0.3, dir * 15, -12);
      game.ragdolls.push(ragdoll);
    }

    function checkKO() {
      const { p1, p2 } = game;

      if (p1.knockdown && p1.knockdownTimer <= 0) {
        triggerKO(p1, p2, '#ef4444');
        return;
      }
      if (p2.knockdown && p2.knockdownTimer <= 0) {
        triggerKO(p2, p1, '#22d3ee');
        return;
      }

      if (p1.knockdownCount >= KNOCKDOWN.maxKnockdowns && p1.knockdown) {
        triggerKO(p1, p2, '#ef4444');
        return;
      }
      if (p2.knockdownCount >= KNOCKDOWN.maxKnockdowns && p2.knockdown) {
        triggerKO(p2, p1, '#22d3ee');
        return;
      }
    }

    function startRound() {
      const reset = (f, x, facing) => {
        f.x = x; f.y = GROUND;
        f.bars = createBars(f === game.p1 ? p1Def.stats : p2Def.stats);
        f.hp = f.bars.head.max + f.bars.body.max;
        f.meter = 0; f.blockHp = f.maxBlockHp; f.state = 'idle'; f.anim = 'idle';
        f.frame = 0; f.vx = 0; f.vy = 0; f.facingRight = facing;
        f.comboChain = []; f.stunTimer = 0; f.blockStunTimer = 0; f.parryWindow = 0;
        f.specialState = null; f.armorActive = false; f.phaseActive = false;
        f.counterWindow = 0; f.reflectWindow = 0; f.poison = null;
        f.barStunned = false; f.barStunnedBar = null;
        f.momentum = 0; f.momentumBoost = 0;
        f.knockdown = false; f.knockdownTimer = 0; f.knockdownCount = 0; f.mashCount = 0;
        f.weapon = createWeaponState(FIGHTER_WEAPONS[f.fighterId] || 'broadsword');
        f.parryOrb = { angle: Math.random() * Math.PI * 2, litTimer: 0, cooldown: 60 + Math.floor(Math.random() * 120), radius: 45 };
      };
      reset(game.p1, 250, true);
      reset(game.p2, 710, false);
      game.roundTimer = 99 * 60;
      game.roundStartTime = game.time;
      game.recoverySpots = createRecoverySpots();
      game.particles = [];
      game.popups = [];
      game.slashEffects = [];
      game.afterimages = [];
      game.ragdolls.forEach(r => removeRagdollFromWorld(game.ragdollWorld, r));
      game.ragdolls = [];
      game.flashSteps = [];
      game.castEffects = [];
      game.aiTimer = 0;
      game.announcement = { text: `ROUND ${game.round}`, timer: 80, size: 56, color: '#fbbf24' };
      game.phase = 'intro';
      game.phaseTimer = 100;
      playSound('round');

      if (trashTalkLines.length > 0) {
        const line = trashTalkLines[Math.floor(Math.random() * trashTalkLines.length)];
        game.trashTalkLine = line;
        game.trashTalkTimer = 120;
      }
    }

    function tick(ts) {
      if (cancelled) return;
      game.time++;

      if (game.slowmo > 0) {
        game.slowmo--;
        if (game.time % 3 !== 0) { raf = requestAnimationFrame(tick); return; }
      }

      if (game.phase === 'intro') {
        game.phaseTimer--;
        if (game.trashTalkTimer > 0) game.trashTalkTimer--;
        if (game.phaseTimer <= 0) {
          game.phase = 'fight';
          game.announcement = { text: 'FIGHT!', timer: 60, size: 56, color: '#22d3ee' };
          playSound('round');
        }
      } else if (game.phase === 'fight') {
        const p1k = mergeKeys(getP1Keys(), getGamepadKeys(0));
        processInput(game.p1, p1k, game.p2);
        processMouseInput(game.p1, mouseRef.current, game.p2);
        updateFighter(game.p1, 1);

        game.p2.facingRight = game.p2.x < game.p1.x;
        if (isVsAI) {
          updateAI(game.p2, game.p1, game.time);
        } else {
          const p2k = mergeKeys(getP2Keys(), getGamepadKeys(1));
          processInput(game.p2, p2k, game.p1);
        }
        updateFighter(game.p2, 1);

        resolveBodyCollision(game.p1, game.p2);

        checkKO();

        for (const spot of game.recoverySpots) {
          if (!spot.active && spot.cooldown > 0) {
            spot.cooldown--;
          } else if (!spot.active && spot.cooldown <= 0 && spot.spawnTimer > 0) {
            spot.spawnTimer--;
          } else if (!spot.active && spot.cooldown <= 0 && spot.spawnTimer <= 0) {
            spot.active = true;
            spot.barType = BAR_NAMES[Math.floor(Math.random() * BAR_NAMES.length)];
            spot.healAmount = 8 + Math.floor(Math.random() * 8);
          }
        }

        game.roundTimer--;
        if (game.roundTimer <= 0 && game.phase === 'fight') {
          game.phase = 'ko';
          game.phaseTimer = 180;
          const p1Total = game.p1.bars.head.current + game.p1.bars.body.current;
          const p2Total = game.p2.bars.head.current + game.p2.bars.body.current;
          if (p1Total > p2Total) {
            game.p1.wins++;
            game.announcement = { text: 'TIME!', timer: 100, size: 48, color: '#fbbf24', sub: `${p1Def.name} wins` };
          } else if (p2Total > p1Total) {
            game.p2.wins++;
            game.announcement = { text: 'TIME!', timer: 100, size: 48, color: '#fbbf24', sub: `${p2Def.name} wins` };
          } else {
            game.announcement = { text: 'DRAW', timer: 100, size: 48, color: '#94a3b8' };
          }
        }
      } else if (game.phase === 'ko') {
        game.phaseTimer--;
        updateFighter(game.p1, 1);
        updateFighter(game.p2, 1);
        if (game.phaseTimer <= 0) {
          if (game.p1.wins >= 2 || game.p2.wins >= 2) {
            game.phase = 'victory';
            game.phaseTimer = 300;
            const winner = game.p1.wins >= 2 ? p1Def.name : p2Def.name;
            game.announcement = { text: winner, timer: 200, size: 40, color: '#fbbf24', sub: 'WINS!' };
          } else {
            game.round++;
            startRound();
          }
        }
      } else if (game.phase === 'victory') {
        game.phaseTimer--;
        if (game.phaseTimer <= 0) { if (onExit) onExit(); }
      }

      if (game.ragdollWorld) {
        updateRagdollWorld(game.ragdollWorld, 1000 / 60);
      }
      game.ragdolls = game.ragdolls.filter(r => {
        if (isRagdollSettled(r)) {
          r.settledTimer = (r.settledTimer || 0) + 1;
          if (r.settledTimer > 120) {
            removeRagdollFromWorld(game.ragdollWorld, r);
            return false;
          }
        } else {
          r.settledTimer = 0;
        }
        return true;
      });

      game.flashSteps = game.flashSteps.filter(fs => {
        return updateFlashStep(fs);
      });

      game.castEffects = game.castEffects.filter(ce => {
        return updateCastEffect(ce);
      });

      for (const f of [game.p1, game.p2]) {
        if (f.weapon) updateWeapon(f.weapon);
      }

      game.particles = game.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
        if (p.type === 'spark' && p.trail) {
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 4) p.trail.shift();
        }
        if (p.type === 'dust') { p.size *= 1.02; p.vx *= 0.95; }
        return p.life > 0;
      });
      game.popups = game.popups.filter(p => { p.y += p.vy; p.timer--; return p.timer > 0; });
      game.slashEffects.forEach(s => updateSlashVFX(s, 16));
      game.slashEffects = game.slashEffects.filter(s => s.alive);
      game.afterimages = game.afterimages.filter(a => { a.life--; return a.life > 0; });
      game.fxEffects.forEach(fx => {
        fx.frameTimer++;
        if (fx.frameTimer >= fx.frameSpeed) {
          fx.frameTimer = 0;
          fx.frame++;
          if (fx.frame >= fx.maxFrames) fx.alive = false;
        }
      });
      game.fxEffects = game.fxEffects.filter(fx => fx.alive);

      if (game.shake.timer > 0) {
        game.shake.timer--;
        const maxShakeT = game.shake.maxTimer || 20;
        const decay = Math.pow(game.shake.timer / maxShakeT, 2);
        const freq = game.shake.timer * 0.5;
        game.shake.x = Math.sin(freq * 7.1) * game.shake.intensity * decay;
        game.shake.y = Math.cos(freq * 5.3) * game.shake.intensity * decay * 0.7;
      } else { game.shake.x = 0; game.shake.y = 0; }

      if (game.announcement?.timer > 0) game.announcement.timer--;

      if (game.koZoom) {
        game.koZoom.timer--;
        if (game.koZoom.timer <= 0) game.koZoom = null;
      }
      if (game.shockwave) {
        game.shockwave.timer++;
        if (game.shockwave.timer >= game.shockwave.maxTimer) game.shockwave = null;
      }

      ctx.save();
      if (game.koZoom && game.koZoom.timer > 0) {
        const zoomT = game.koZoom.timer / game.koZoom.maxTimer;
        const zoomScale = 1 + easeOutCubic(1 - zoomT) * 0.06;
        ctx.translate(game.koZoom.cx, game.koZoom.cy);
        ctx.scale(zoomScale, zoomScale);
        ctx.translate(-game.koZoom.cx, -game.koZoom.cy);
      }
      ctx.translate(game.shake.x, game.shake.y);

      drawArena(ctx, game.time, game.stageData);

      for (const spot of game.recoverySpots) {
        if (!spot.active) continue;
        const spotColor = BAR_DEFS[spot.barType]?.color || '#22d3ee';
        const pulse = 0.5 + 0.5 * Math.sin(game.time * 0.08);
        ctx.save();
        ctx.globalAlpha = 0.3 + 0.2 * pulse;
        const grad = ctx.createRadialGradient(spot.x, spot.y, 2, spot.x, spot.y, spot.radius);
        grad.addColorStop(0, spotColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius + 4 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = spotColor;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      game.afterimages.forEach(ai => {
        const alpha = (ai.life / ai.maxLife) * ai.alpha;
        if (alpha < 0.02) return;
        const a = ANIMS[ai.anim] || ANIMS.idle;
        const frameIdx = Math.min(ai.frame, a.frames.length - 1);
        const { col, row } = a.frames[frameIdx];
        const aiDef = ai.owner === 0 ? p1Def : p2Def;
        const aiBlockOff = aiDef.blockOffset || 0;
        const aiRowOff = aiDef.rowOffset || 0;
        const sx = (col + aiBlockOff) * FW;
        const sy = (row + aiRowOff) * FH;
        const drawX = ai.x - DRAW_W / 2;
        const drawY = ai.y - DRAW_H * 0.55;
        const img = ai.owner === 0 ? game.p1Img : game.p2Img;
        if (!img) return;
        const lifeRatio = ai.life / ai.maxLife;
        const blurAmt = Math.round((1 - lifeRatio) * 6);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'lighter';
        ctx.filter = `brightness(1.8) saturate(0.2) blur(${blurAmt}px)`;
        if (!ai.facingRight) {
          ctx.translate(ai.x, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, sy, FW, FH, -DRAW_W / 2, 0, DRAW_W, DRAW_H);
        } else {
          ctx.drawImage(img, sx, sy, FW, FH, drawX, drawY, DRAW_W, DRAW_H);
        }
        ctx.restore();
      });

      game.ragdolls.forEach(r => drawRagdoll(ctx, r, r.color, r.color, game.time));

      drawFighter(ctx, game.p2, game.p2Img, ANIMS, game.time, p2Def);
      drawFighter(ctx, game.p1, game.p1Img, ANIMS, game.time, p1Def);

      drawFighterNameplate(ctx, game.p1, p1Def, game.time);
      drawFighterNameplate(ctx, game.p2, p2Def, game.time);

      for (const f of [game.p1, game.p2]) {
        if (f.weapon && f.weapon.swingTimer > 0) {
          drawWeapon(ctx, f.weapon, f.x, f.y - DRAW_H * 0.35, f.facingRight, 1.5, game.time);
        }
      }

      drawParryOrb(ctx, game.p1, game.time);
      drawParryOrb(ctx, game.p2, game.time);

      if (mouseRef.current.onCanvas && game.phase === 'fight') {
        const glove = clampGlovePosition(game.p1.x, game.p1.y, mouseRef.current.x, mouseRef.current.y);
        drawGlove(ctx, glove.x, glove.y, game.p1.x, game.p1.y, mouseRef.current.rmb || game.p1.state === 'block', game.time);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      game.particles.forEach(p => {
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio <= 0) return;

        if (p.type === 'spark' && p.trail && p.trail.length > 1) {
          ctx.save();
          ctx.globalAlpha = lifeRatio * 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.size * 0.5 * lifeRatio);
          ctx.lineCap = 'round';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = lifeRatio;
        if (p.type === 'flash') {
          ctx.globalAlpha = lifeRatio * 0.7;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * lifeRatio * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'dust') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = lifeRatio * 0.4;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.size * 2 * lifeRatio;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      ctx.restore();

      game.popups.forEach(p => {
        if (!p._maxTimer) p._maxTimer = p.timer;
        const elapsed = p._maxTimer - p.timer;
        const introT = Math.min(1, elapsed / 6);
        const outroT = Math.min(1, p.timer / 12);
        const popScale = elapsed < 6 ? easeOutBack(introT) : 1.0;
        const alpha = outroT < 1 ? easeInCubic(outroT) : 1;
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        const sz = (p.size || 20) * popScale;
        ctx.font = `bold ${Math.round(sz)}px Cinzel, serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6 * alpha;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });

      game.slashEffects.forEach(s => {
        if (!s.alive) return;
        const progress = s.frame / s.maxFrames;
        const alpha = Math.min(1, (s.maxFrames - s.frame) / 3) * 0.9;
        if (alpha <= 0.01) return;
        const sz = 120 * s.scale;
        const slashColor = s.color || '#22d3ee';
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.angle * Math.PI) / 180);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha;

        const arcStart = -Math.PI * 0.6 + progress * Math.PI * 0.3;
        const arcEnd = Math.PI * 0.3 + progress * Math.PI * 0.2;
        const radius = sz * 0.4 * (0.5 + progress * 0.5);
        const lineW = (8 - progress * 6) * s.scale;

        ctx.strokeStyle = slashColor;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.shadowColor = slashColor;
        ctx.shadowBlur = 15 * (1 - progress);
        ctx.beginPath();
        ctx.arc(0, 0, radius, arcStart, arcEnd);
        ctx.stroke();

        if (progress < 0.5) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = lineW * 0.4;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.95, arcStart + 0.1, arcEnd - 0.1);
          ctx.stroke();
        }

        const trailCount = 3;
        for (let t = 1; t <= trailCount; t++) {
          const trailAlpha = alpha * (0.3 - t * 0.08);
          if (trailAlpha <= 0) continue;
          ctx.globalAlpha = trailAlpha;
          ctx.strokeStyle = slashColor;
          ctx.lineWidth = lineW * (0.6 - t * 0.15);
          ctx.shadowBlur = 5;
          const offset = t * 0.15;
          ctx.beginPath();
          ctx.arc(0, 0, radius * (1 - t * 0.08), arcStart - offset, arcEnd - offset);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      });

      game.fxEffects.forEach(fx => {
        if (!fx.alive) return;
        const fxImg = game.fxImgs[fx.name];
        if (!fxImg) return;
        const drawSz = fx.fw * fx.scale;
        const drawSzH = fx.fh * fx.scale;
        const alpha = Math.min(1, (fx.maxFrames - fx.frame) / 3);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(
          fxImg,
          fx.frame * fx.fw, 0, fx.fw, fx.fh,
          fx.x - drawSz / 2, fx.y - drawSzH / 2, drawSz, drawSzH
        );
        ctx.restore();
      });

      game.flashSteps.forEach(fs => drawFlashStep(ctx, fs, game.time));
      game.castEffects.forEach(ce => drawCastEffect(ctx, ce, game.time));

      if (game.shockwave) {
        const sw = game.shockwave;
        const t = sw.timer / sw.maxTimer;
        const radius = easeOutCubic(t) * 180;
        const alpha = 1 - easeOutQuart(t);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = (6 - t * 5);
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      if (game.flash?.timer > 0) {
        const flashMax = game.flash._max || game.flash.timer;
        if (!game.flash._max) game.flash._max = game.flash.timer;
        const flashT = game.flash.timer / flashMax;
        ctx.save();
        ctx.globalAlpha = Math.pow(flashT, 2) * 0.6;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = game.flash.color;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        game.flash.timer--;
      }

      if (game.phase === 'ko' || game.phase === 'victory') {
        const vignetteAlpha = game.phase === 'victory' ? 0.4 : 0.25;
        ctx.save();
        const vGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
        vGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vGrad.addColorStop(1, `rgba(0,0,0,${vignetteAlpha})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      drawHUD(ctx, game.p1, game.p2, game.roundTimer, game.announcement?.timer > 0 ? game.announcement : null, p1Def, p2Def, game.time);

      for (const f of [game.p1, game.p2]) {
        if (f.knockdown) {
          const countSec = Math.ceil(f.knockdownTimer / 60);
          const isP1 = f === game.p1;
          ctx.save();
          ctx.font = 'bold 32px Cinzel, serif';
          ctx.textAlign = 'center';
          const flash = Math.floor(game.time / 8) % 2 === 0;
          ctx.fillStyle = countSec <= 3 ? (flash ? '#ef4444' : '#fbbf24') : '#fbbf24';
          ctx.fillText(countSec.toString(), f.x, f.y - DRAW_H * 0.7);
          ctx.font = '10px Jost, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('MASH TO GET UP!', f.x, f.y - DRAW_H * 0.55);
          const mashPct = Math.min(1, f.mashCount / 10);
          const mashBarW = 60;
          const mashBarH = 4;
          const mashBarX = f.x - mashBarW / 2;
          const mashBarY = f.y - DRAW_H * 0.5;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(mashBarX, mashBarY, mashBarW, mashBarH);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(mashBarX, mashBarY, mashBarW * mashPct, mashBarH);
          ctx.restore();
        }
      }

      if (game.trashTalkTimer > 0 && game.trashTalkLine) {
        const alpha = Math.min(1, game.trashTalkTimer / 30);
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.font = 'italic 12px Jost, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`"${game.trashTalkLine}"`, W / 2, H - 20);
        ctx.restore();
      }

      if (game.showMoveList) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = 'bold 24px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('MOVE LIST', W / 2, 40);
        ctx.font = '11px Jost, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Press TAB to close', W / 2, 58);

        const moves = [
          ['X / LMB', 'Jab', '6 DMG', 'Quick punch → HEAD bar'],
          ['K', 'Cross', '16 DMG', 'Heavy straight → BODY bar'],
          ['L', 'Kick', '12 DMG', 'Mid-range → BODY bar'],
          ['U', 'Uppercut', '22 DMG', 'Launcher → HEAD bar'],
          ['I', 'Low Kick', '8 DMG', 'Quick sweep → BODY bar'],
          ['O / LMB far', 'Hook', '18 DMG', 'Power hook → HEAD bar'],
          ['C', 'High Kick', '14 DMG', 'Overhead → HEAD bar'],
        ];
        const systems = [
          ['A/D', 'Move Left/Right'],
          ['W', 'Jump'],
          ['E', 'Dash (costs stamina, i-frames)'],
          ['S/Shift/RMB', 'Block (press when orb glows = Parry)'],
          ['Space/R', 'Special Move (full meter)'],
          ['Q', 'Power Up (once per round, +40% DMG)'],
          ['LMB', 'Punch toward mouse (glove)'],
          ['RMB', 'Block (parry when orb is lit)'],
        ];
        const barInfo = [
          ['STAMINA', '#22d3ee', 'Punch/block costs. 0 = STUNNED'],
          ['FOCUS', '#a855f7', 'Accuracy. Drains on hit taken'],
          ['HEAD', '#ef4444', 'Head damage. 0 = KO STUNNED'],
          ['BODY', '#22c55e', 'Body damage. 0 = STUNNED'],
        ];
        const combos = [
          ['X → X → K', '1-2 CROSS (x1.3)'],
          ['X → L → U', 'LAUNCHER (x1.5)'],
          ['X → X → X → U', 'FURY UPPER (x1.8)'],
          ['I → X → K → U', 'FULL COMBO (x2.0)'],
          ['O → U', 'DEVASTATOR (x1.4)'],
          ['C → K → U', 'SKYSCRAPER (x1.7)'],
        ];

        const colW = 300;
        const col1X = W / 2 - colW - 20;
        const col2X = W / 2 + 20;
        let y = 82;
        ctx.textAlign = 'left';

        ctx.font = 'bold 14px Cinzel, serif';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('ATTACKS', col1X, y);
        y += 18;
        ctx.font = '12px Jost, sans-serif';
        moves.forEach(([key, name, dmg, desc]) => {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(key, col1X, y);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(name, col1X + 80, y);
          ctx.fillStyle = '#ef4444';
          ctx.fillText(dmg, col1X + 150, y);
          ctx.fillStyle = '#64748b';
          ctx.fillText(desc, col1X + 210, y);
          y += 17;
        });

        y += 10;
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('CONTROLS', col1X, y);
        y += 18;
        ctx.font = '12px Jost, sans-serif';
        systems.forEach(([key, desc]) => {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(key, col1X, y);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(desc, col1X + 100, y);
          y += 17;
        });

        let y2 = 82;
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('MULTI-BAR SYSTEM', col2X, y2);
        y2 += 18;
        ctx.font = '12px Jost, sans-serif';
        barInfo.forEach(([name, color, desc]) => {
          ctx.fillStyle = color;
          ctx.fillText(name, col2X, y2);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(desc, col2X + 70, y2);
          y2 += 17;
        });

        y2 += 14;
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('COMBOS', col2X, y2);
        y2 += 18;
        ctx.font = '12px Jost, sans-serif';
        combos.forEach(([seq, name]) => {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(seq, col2X, y2);
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(name, col2X + 130, y2);
          y2 += 17;
        });

        y2 += 10;
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('SYSTEMS', col2X, y2);
        y2 += 18;
        ctx.font = '12px Jost, sans-serif';
        const tips = [
          'ANY bar → 0 = STUNNED until 5% refill',
          'Mouse cursor = boxing glove on leash',
          'LMB = punch toward glove, RMB = block',
          'Block shows red danger indicators',
          'Fighters idle-hop like real boxers',
          'Momentum builds from hits & blocks',
          'Head hits deal 35% extra damage',
        ];
        tips.forEach(t => {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('• ' + t, col2X, y2);
          y2 += 15;
        });

        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    }

    function onKeyDown(e) {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.code === 'Tab') game.showMoveList = !game.showMoveList;
    }
    function onKeyUp(e) { keysRef.current[e.code] = false; }

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    function onMouseMove(e) {
      const coords = getCanvasCoords(e);
      mouseRef.current.x = coords.x;
      mouseRef.current.y = coords.y;
    }

    function onMouseDown(e) {
      if (e.button === 0) {
        mouseRef.current.lmb = true;
        mouseRef.current.lmbJustPressed = true;
      }
      if (e.button === 2) {
        mouseRef.current.rmb = true;
      }
      e.preventDefault();
    }

    function onMouseUp(e) {
      if (e.button === 0) mouseRef.current.lmb = false;
      if (e.button === 2) mouseRef.current.rmb = false;
    }

    function onMouseEnter() { mouseRef.current.onCanvas = true; }
    function onMouseLeave() {
      mouseRef.current.onCanvas = false;
      mouseRef.current.lmb = false;
      mouseRef.current.rmb = false;
    }

    function onContextMenu(e) { e.preventDefault(); }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('contextmenu', onContextMenu);
    init();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('contextmenu', onContextMenu);

      if (game.ragdollWorld) {
        game.ragdolls.forEach(r => removeRagdollFromWorld(game.ragdollWorld, r));
        game.ragdolls = [];
        game.flashSteps = [];
        game.castEffects = [];
      }
      gameRef.current = null;
    };
  }, [p1Color, p2Color, stage, mode, onExit]);

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050a18', overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: `${W} / ${H}`,
          imageRendering: 'pixelated',
          cursor: 'none',
        }}
      />
    </div>
  );
}

function StatBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'Jost, sans-serif' }}>
      <span style={{ color: '#64748b', width: '50px', textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value * 10}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function FighterSpritePreview({ fighterId, active, large = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fighterDef = GKO_FIGHTERS.find(f => f.id === fighterId);
    const img = new Image();
    img.src = getFighterSheetPath(fighterDef || fighterId);
    const selBlockOff = fighterDef?.blockOffset || 0;
    const selRowOff = fighterDef?.rowOffset || 0;

    const idleAnim = ANIMS.idle;
    let frame = 0;
    let lastTime = 0;
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const animate = (t) => {
        if (cancelled) return;
        if (t - lastTime > 150) {
          frame = (frame + 1) % idleAnim.frames.length;
          lastTime = t;
          const { col, row } = idleAnim.frames[frame];
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, (col + selBlockOff) * FW, (row + selRowOff) * FH, FW, FH, 0, 0, canvas.width, canvas.height);
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fighterId]);

  return (
    <canvas
      ref={canvasRef}
      width={FW}
      height={FH}
      style={{
        width: large ? '100%' : '100%',
        height: large ? '100%' : '100%',
        imageRendering: 'pixelated',
        filter: active ? 'none' : 'brightness(0.6) grayscale(0.3)',
        transition: 'filter 0.3s',
      }}
    />
  );
}

const WHEEL_ROTATION_SPEED = 0.003;

function FighterWheel({ fighters, selectedId, onSelect }) {
  const [wheelAngle, setWheelAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const angleStartRef = useRef(0);
  const rafRef = useRef(null);
  const containerRef = useRef(null);

  const selectedIndex = fighters.findIndex(f => f.id === selectedId);

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement && document.activeElement !== containerRef.current && document.activeElement.tagName === 'INPUT') return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (selectedIndex - 1 + fighters.length) % fighters.length;
        onSelect(fighters[prev].id);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (selectedIndex + 1) % fighters.length;
        onSelect(fighters[next].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIndex, fighters, onSelect]);

  useEffect(() => {
    if (isDragging) return;
    const targetAngle = -(selectedIndex / fighters.length) * Math.PI * 2;

    let cancelled = false;
    const animate = () => {
      if (cancelled) return;
      setWheelAngle(prev => {
        let diff = targetAngle - prev;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < 0.005) return targetAngle;
        rafRef.current = requestAnimationFrame(animate);
        return prev + diff * 0.08;
      });
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelled = true; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [selectedIndex, isDragging]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = e.clientX;
    angleStartRef.current = wheelAngle;
  };

  const handlePointerMove = (e) => {
    if (!isDragging || dragStartRef.current === null) return;
    const dx = e.clientX - dragStartRef.current;
    const newAngle = angleStartRef.current + dx * WHEEL_ROTATION_SPEED;
    setWheelAngle(newAngle);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const normalized = (((-wheelAngle / (Math.PI * 2)) * fighters.length) % fighters.length + fighters.length) % fighters.length;
    const nearest = Math.round(normalized) % fighters.length;
    onSelect(fighters[nearest].id);
  };

  const currentFighter = fighters.find(f => f.id === selectedId);
  const wheelRadius = 200;

  const goLeft = () => {
    const prev = (selectedIndex - 1 + fighters.length) % fighters.length;
    onSelect(fighters[prev].id);
  };
  const goRight = () => {
    const next = (selectedIndex + 1) % fighters.length;
    onSelect(fighters[next].id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      goLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      goRight();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="Fighter selection wheel"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => isDragging && handlePointerUp()}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        height: '420px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        outline: 'none',
      }}
    >
      <style>{`
        @keyframes wheelGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes selectPulse {
          0%, 100% { box-shadow: 0 0 15px currentColor; }
          50% { box-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '260px', height: '260px',
        zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentFighter?.color || '#fbbf24'}15 0%, transparent 70%)`,
          animation: 'wheelGlow 3s ease-in-out infinite',
        }} />

        <div style={{
          width: '220px', height: '220px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <FighterSpritePreview fighterId={selectedId} active={true} large={true} />
        </div>

        <div style={{
          color: currentFighter?.color || '#fbbf24',
          fontSize: '22px', fontWeight: '900',
          fontFamily: "'Cinzel', serif",
          letterSpacing: '2px',
          textShadow: `0 0 20px ${currentFighter?.color || '#fbbf24'}80`,
          marginTop: '4px',
        }}>
          {currentFighter?.name}
        </div>
        <div style={{
          color: '#64748b', fontSize: '11px',
          fontFamily: 'Jost, sans-serif',
          letterSpacing: '2px', textTransform: 'uppercase',
        }}>
          {currentFighter?.title}
        </div>
      </div>

      {fighters.map((f, i) => {
        const angle = wheelAngle + (i / fighters.length) * Math.PI * 2;
        const x = Math.cos(angle) * wheelRadius;
        const y = Math.sin(angle) * wheelRadius * 0.35;
        const depth = Math.cos(angle);
        const scale = 0.5 + depth * 0.25;
        const isSelected = f.id === selectedId;
        const opacity = 0.3 + (depth + 1) * 0.35;

        return (
          <div
            key={f.id}
            role="option"
            aria-selected={isSelected}
            aria-label={f.name}
            onClick={(e) => { e.stopPropagation(); onSelect(f.id); }}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              width: '80px', height: '100px',
              borderRadius: '10px',
              border: isSelected ? `2px solid ${f.color}` : '1px solid rgba(255,255,255,0.1)',
              background: isSelected ? `${f.color}20` : 'rgba(10,10,20,0.7)',
              opacity,
              cursor: 'pointer',
              transition: 'border 0.3s, background 0.3s',
              zIndex: Math.floor((depth + 1) * 10),
              overflow: 'hidden',
              pointerEvents: 'auto',
              color: isSelected ? f.color : undefined,
              animation: isSelected ? 'selectPulse 2s ease-in-out infinite' : undefined,
            }}
          >
            <div style={{ width: '100%', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
              <FighterSpritePreview fighterId={f.id} active={isSelected || depth > 0} />
            </div>
            <div style={{
              fontSize: '9px', fontWeight: '700',
              fontFamily: "'Cinzel', serif",
              color: isSelected ? f.color : '#64748b',
              textAlign: 'center', padding: '2px',
              letterSpacing: '0.5px',
            }}>
              {f.name}
            </div>
          </div>
        );
      })}

      <button
        onClick={(e) => { e.stopPropagation(); goLeft(); }}
        aria-label="Previous fighter"
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 25, pointerEvents: 'auto',
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'rgba(5,10,24,0.7)', backdropFilter: 'blur(8px)',
          border: `1px solid ${currentFighter?.color || '#fbbf24'}40`,
          color: currentFighter?.color || '#fbbf24', fontSize: '20px', fontWeight: '700',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', boxShadow: `0 0 15px ${currentFighter?.color || '#fbbf24'}15`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${currentFighter?.color || '#fbbf24'}25`; e.currentTarget.style.boxShadow = `0 0 25px ${currentFighter?.color || '#fbbf24'}30`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(5,10,24,0.7)'; e.currentTarget.style.boxShadow = `0 0 15px ${currentFighter?.color || '#fbbf24'}15`; }}
      >
        <span style={{ marginRight: '2px' }}>&#9664;</span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); goRight(); }}
        aria-label="Next fighter"
        style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 25, pointerEvents: 'auto',
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'rgba(5,10,24,0.7)', backdropFilter: 'blur(8px)',
          border: `1px solid ${currentFighter?.color || '#fbbf24'}40`,
          color: currentFighter?.color || '#fbbf24', fontSize: '20px', fontWeight: '700',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', boxShadow: `0 0 15px ${currentFighter?.color || '#fbbf24'}15`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${currentFighter?.color || '#fbbf24'}25`; e.currentTarget.style.boxShadow = `0 0 25px ${currentFighter?.color || '#fbbf24'}30`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(5,10,24,0.7)'; e.currentTarget.style.boxShadow = `0 0 15px ${currentFighter?.color || '#fbbf24'}15`; }}
      >
        <span style={{ marginLeft: '2px' }}>&#9654;</span>
      </button>

      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'Jost, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>
          &#9664; A / D &#9654; &bull; drag to spin &bull; click to select
        </div>
        <div style={{
          display: 'flex', gap: '6px', alignItems: 'center',
        }}>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'Jost, sans-serif', padding: '2px 6px', border: '1px solid #1e293b', borderRadius: '4px', background: 'rgba(15,23,42,0.6)' }}>A</span>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'Jost, sans-serif', padding: '2px 6px', border: '1px solid #1e293b', borderRadius: '4px', background: 'rgba(15,23,42,0.6)' }}>&#8592;</span>
          <span style={{ color: '#334155', fontSize: '8px' }}>/</span>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'Jost, sans-serif', padding: '2px 6px', border: '1px solid #1e293b', borderRadius: '4px', background: 'rgba(15,23,42,0.6)' }}>&#8594;</span>
          <span style={{ fontSize: '9px', color: '#374151', fontFamily: 'Jost, sans-serif', padding: '2px 6px', border: '1px solid #1e293b', borderRadius: '4px', background: 'rgba(15,23,42,0.6)' }}>D</span>
        </div>
      </div>
    </div>
  );
}

const ARM_POSES = {};
GKO_FIGHTERS.forEach(f => {
  ARM_POSES[f.id] = {
    high: `/sprites/grudge-box/poses/${f.id}_high.png`,
    low: `/sprites/grudge-box/poses/${f.id}_low.png`,
  };
});

function ArmPositionPreview({ fighterId, armAngle = 0 }) {
  const isHigh = armAngle < 0;
  const poseSrc = ARM_POSES[fighterId]?.[isHigh ? 'high' : 'low'];
  const fighter = GKO_FIGHTERS.find(f => f.id === fighterId);
  if (!poseSrc) return null;

  return (
    <div style={{
      position: 'relative',
      width: '120px', height: '120px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${fighter?.color || '#fbbf24'}40`,
      background: 'rgba(0,0,0,0.4)',
    }}>
      <img
        src={poseSrc}
        alt={`${fighterId} ${isHigh ? 'high' : 'low'} punch`}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          transform: `rotate(${armAngle * 0.3}deg)`,
          transition: 'transform 0.3s ease',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 4, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '9px', fontWeight: '700',
        color: fighter?.color || '#fbbf24',
        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        fontFamily: "'Cinzel', serif",
        letterSpacing: '1px',
      }}>
        {isHigh ? 'HIGH' : 'LOW'}
      </div>
    </div>
  );
}

export default function GrudgeBox() {
  const [phase, setPhase] = useState('welcome');
  const [mode, setMode] = useState('1p');
  const [p1Color, setP1Color] = useState('raze');
  const [p2Color, setP2Color] = useState('volt');
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectStep, setSelectStep] = useState('p1');

  useEffect(() => {
    if (phase !== 'welcome') return;
    const handler = (e) => {
      if (e.type === 'keydown' || e.type === 'click') setPhase('menu');
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [phase]);

  const handleStart = useCallback(() => {
    const stage = selectedStage || STAGES[Math.floor(Math.random() * STAGES.length)].id;
    setSelectedStage(stage);
    setPhase('fight');
  }, [selectedStage]);

  const handleExit = useCallback(() => {
    setPhase('menu');
    setSelectStep('p1');
    setSelectedStage(null);
  }, []);

  const startSelect = (m) => {
    setMode(m);
    setSelectStep('p1');
    setPhase('select');
  };

  if (phase === 'welcome') {
    return (
      <div style={{
        position: 'relative',
        background: '#050a18',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}>
        <img src="/sprites/grudge-box/ui/menu_bg.png" alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, filter: 'saturate(1.2) contrast(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(5,10,24,0.2) 0%, rgba(5,10,24,0.75) 60%, rgba(5,10,24,0.95) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(transparent, rgba(5,10,24,0.95))', pointerEvents: 'none' }} />
        <style>{`
          @keyframes titleGlow { 0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.4), 0 0 60px rgba(251,191,36,0.1); filter: brightness(1); } 50% { text-shadow: 0 0 40px rgba(251,191,36,0.8), 0 0 100px rgba(251,191,36,0.3); filter: brightness(1.15); } }
          @keyframes pressStart { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
          @keyframes borderPulse { 0%, 100% { border-color: rgba(251,191,36,0.15); } 50% { border-color: rgba(251,191,36,0.4); } }
        `}</style>
        <div style={{
          position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '48px 40px 36px',
          background: 'rgba(5,10,24,0.5)', backdropFilter: 'blur(16px)',
          borderRadius: '24px', border: '1px solid rgba(251,191,36,0.2)',
          boxShadow: '0 8px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'borderPulse 4s ease-in-out infinite',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: '900', color: '#fbbf24', animation: 'titleGlow 3s ease-in-out infinite', textAlign: 'center', lineHeight: '1' }}>G.K.O. BOXING</div>
          <div style={{ width: '180px', height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', margin: '16px 0 12px', opacity: 0.5 }} />
          <div style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '6px', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif' }}>Grudge Studios</div>
          <div style={{ marginTop: '40px', fontSize: '15px', color: '#cbd5e1', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', animation: 'pressStart 1.5s ease-in-out infinite' }}>Press Any Key</div>
        </div>
      </div>
    );
  }

  if (phase === 'menu') {
    return (
      <div style={{ position: 'relative', background: '#050a18', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost, sans-serif', overflow: 'hidden' }}>
        <img src="/sprites/grudge-box/ui/menu_bg.png" alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45, filter: 'saturate(1.2) contrast(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(5,10,24,0.3) 0%, rgba(5,10,24,0.85) 65%, rgba(5,10,24,0.97) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(5,10,24,0.95))', pointerEvents: 'none' }} />
        <style>{`
          @keyframes neonFlicker { 0%, 100% { text-shadow: 0 0 10px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2); } 50% { text-shadow: 0 0 20px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.3); } }
          .gko-menu-btn { padding: 18px 32px; border-radius: 14px; border: 1px solid rgba(251,191,36,0.2); background: rgba(5,10,24,0.55); color: #fbbf24; font-size: 18px; font-weight: 800; cursor: pointer; font-family: 'Cinzel', serif; text-align: center; transition: all 0.25s; letter-spacing: 2px; backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04); }
          .gko-menu-btn:hover { background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.5); box-shadow: 0 4px 30px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.06); transform: translateY(-2px); }
          .gko-menu-btn:active { transform: scale(0.97) translateY(0); }
          .gko-back-btn { margin-top: 32px; padding: 10px 24px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(5,10,24,0.4); color: #64748b; font-size: 12px; cursor: pointer; font-family: Jost, sans-serif; position: relative; z-index: 2; backdrop-filter: blur(8px); transition: all 0.2s; }
          .gko-back-btn:hover { border-color: rgba(255,255,255,0.2); color: #94a3b8; background: rgba(5,10,24,0.6); }
        `}</style>
        <div style={{
          position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '40px 48px 32px',
          background: 'rgba(5,10,24,0.45)', backdropFilter: 'blur(20px)',
          borderRadius: '24px', border: '1px solid rgba(251,191,36,0.15)',
          boxShadow: '0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(36px, 6vw, 52px)', fontWeight: '900', color: '#fbbf24', marginBottom: '8px', textAlign: 'center', animation: 'neonFlicker 2s ease-in-out infinite' }}>G.K.O. BOXING</div>
          <div style={{ width: '140px', height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)', marginBottom: '32px', opacity: 0.4 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', minWidth: '280px' }}>
            {[
              { label: '1 PLAYER', sub: 'VS CPU', action: () => startSelect('1p') },
              { label: '2 PLAYERS', sub: 'LOCAL', action: () => startSelect('2p') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} className="gko-menu-btn">
                {item.label}
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Jost', letterSpacing: '3px', marginTop: '4px', fontWeight: '400' }}>{item.sub}</div>
              </button>
            ))}
          </div>
          <button onClick={() => window.location.href = '/'} className="gko-back-btn">Back to Home</button>
        </div>
      </div>
    );
  }

  if (phase === 'select') {
    const currentPick = selectStep === 'p1' ? p1Color : p2Color;
    const setCurrent = selectStep === 'p1' ? setP1Color : setP2Color;
    const currentFighter = FIGHTERS.find(f => f.id === currentPick);

    return (
      <div style={{ background: '#050a18', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', fontFamily: 'Jost, sans-serif', overflow: 'hidden', position: 'relative' }}>
        <img src="/sprites/grudge-box/ui/select_bg.png" alt="" onError={(e) => { e.target.style.display = 'none'; }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'saturate(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${currentFighter?.color || '#fbbf24'}12 0%, transparent 50%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,10,24,0.8) 80%, rgba(5,10,24,0.95) 100%)', pointerEvents: 'none' }} />

        <div style={{
          fontSize: '12px', color: currentFighter?.color || '#fbbf24', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '6px', zIndex: 10,
          padding: '6px 20px', background: 'rgba(5,10,24,0.6)', borderRadius: '20px', border: `1px solid ${currentFighter?.color || '#fbbf24'}30`,
          backdropFilter: 'blur(8px)', fontWeight: '600',
        }}>
          {selectStep === 'p1' ? 'PLAYER 1 — SELECT FIGHTER' : (selectStep === 'p2' ? 'PLAYER 2 — SELECT FIGHTER' : 'SELECT STAGE')}
        </div>

        {selectStep !== 'stage' && (
          <>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0, gap: '12px', zIndex: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <ArmPositionPreview fighterId={currentPick} armAngle={-15} />
                <ArmPositionPreview fighterId={currentPick} armAngle={15} />
              </div>

              <div style={{ flex: 1, minWidth: 0, maxWidth: '640px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <FighterWheel fighters={FIGHTERS} selectedId={currentPick} onSelect={setCurrent} />
              </div>

              <div style={{
                flexShrink: 0, zIndex: 20, width: '190px',
                background: 'rgba(5,10,24,0.6)', backdropFilter: 'blur(12px)',
                borderRadius: '16px', border: `1px solid ${currentFighter?.color || '#fbbf24'}25`,
                padding: '16px 20px',
                boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
                transition: 'border-color 0.3s',
              }}>
                <div style={{ color: currentFighter?.color || '#fbbf24', fontSize: '13px', fontWeight: '700', fontFamily: "'Cinzel', serif", letterSpacing: '2px', marginBottom: '2px' }}>{currentFighter?.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'italic', letterSpacing: '1px', marginBottom: '4px' }}>{currentFighter?.title || ''}</div>
                <div style={{ color: '#64748b', fontSize: '9px', letterSpacing: '1px', marginBottom: '14px', textTransform: 'uppercase' }}>{currentFighter?.style}</div>
                {currentFighter?.stats && Object.entries(currentFighter.stats).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: '55px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{key}</div>
                    <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${val * 10}%`, height: '100%', background: `linear-gradient(90deg, ${currentFighter?.color}90, ${currentFighter?.color})`, borderRadius: 3, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ width: '18px', fontSize: '10px', color: currentFighter?.color || '#fbbf24', fontWeight: '700', textAlign: 'right' }}>{val}</div>
                  </div>
                ))}
                {currentFighter?.special && (
                  <div style={{ marginTop: '12px', padding: '10px', background: `${currentFighter?.color}10`, borderRadius: '10px', border: `1px solid ${currentFighter?.color}20` }}>
                    <div style={{ fontSize: '10px', color: currentFighter?.color, fontWeight: '700', letterSpacing: '1px' }}>{currentFighter.special.name}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '3px', lineHeight: '1.3' }}>{currentFighter.special.description}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', zIndex: 10, marginTop: '8px' }}>
              <button onClick={() => { if (selectStep === 'p1' && mode === '2p') setSelectStep('p2'); else setSelectStep('stage'); }} style={{ padding: '13px 40px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0a0a0f', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: "'Cinzel', serif", boxShadow: '0 4px 30px rgba(251,191,36,0.3)', transition: 'all 0.2s' }}>
                {selectStep === 'p1' && mode === '2p' ? 'NEXT' : 'CHOOSE STAGE'}
              </button>
              <button onClick={() => { if (selectStep === 'p2') setSelectStep('p1'); else setPhase('menu'); }} style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,10,24,0.5)', backdropFilter: 'blur(8px)', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'all 0.2s' }}>Back</button>
            </div>
          </>
        )}

        {selectStep === 'stage' && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
              maxWidth: '660px', width: '100%', marginBottom: '16px', marginTop: '12px', zIndex: 10,
            }}>
              <button onClick={() => setSelectedStage(null)} style={{
                padding: '16px', borderRadius: '14px',
                border: !selectedStage ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.06)',
                background: !selectedStage ? 'rgba(251,191,36,0.08)' : 'rgba(5,10,24,0.6)',
                backdropFilter: 'blur(8px)',
                color: !selectedStage ? '#fbbf24' : '#64748b', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', fontFamily: "'Cinzel', serif", textAlign: 'center',
                transition: 'all 0.2s', boxShadow: !selectedStage ? '0 0 20px rgba(251,191,36,0.15)' : 'none',
              }}>RANDOM</button>
              {STAGES.map(s => {
                const stageImgMap = { underground: 'stage_pit', rooftop: 'stage_skyline', street: 'stage_alley', arena: 'stage_arena', factory: 'stage_factory' };
                const isActive = selectedStage === s.id;
                return (
                  <button key={s.id} onClick={() => setSelectedStage(s.id)} style={{
                    padding: 0, borderRadius: '14px',
                    border: isActive ? `2px solid ${s.accentColor}` : '2px solid rgba(255,255,255,0.06)',
                    background: 'rgba(5,10,24,0.7)', cursor: 'pointer', overflow: 'hidden', textAlign: 'center',
                    transition: 'all 0.25s',
                    boxShadow: isActive ? `0 4px 25px ${s.accentColor}30` : 'none',
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  }}>
                    <div style={{ width: '100%', height: '90px', position: 'relative', overflow: 'hidden' }}>
                      <img src={`/sprites/grudge-box/ui/${stageImgMap[s.id]}.png`} alt={s.name} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = s.bgGrad || 'linear-gradient(135deg, #1a1a2e, #16213e)'; }} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: isActive ? 'brightness(1.1) saturate(1.2)' : 'brightness(0.45) grayscale(0.4)',
                        transition: 'filter 0.3s',
                      }} />
                      {!isActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,24,0.3)' }} />}
                    </div>
                    <div style={{
                      padding: '8px', color: isActive ? s.accentColor : '#475569',
                      fontSize: '12px', fontWeight: '700', fontFamily: "'Cinzel', serif",
                      letterSpacing: '1px', transition: 'color 0.2s',
                    }}>{s.name}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', zIndex: 10 }}>
              <button onClick={handleStart} style={{ padding: '14px 48px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0a0a0f', fontSize: '18px', fontWeight: '800', cursor: 'pointer', fontFamily: "'Cinzel', serif", boxShadow: '0 4px 30px rgba(251,191,36,0.3)', letterSpacing: '2px', transition: 'all 0.2s' }}>FIGHT!</button>
              <button onClick={() => setSelectStep(mode === '2p' ? 'p2' : 'p1')} style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,10,24,0.5)', backdropFilter: 'blur(8px)', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', transition: 'all 0.2s' }}>Back</button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === 'fight') {
    return (
      <div style={{ background: '#050a18', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <GrudgeBoxGame p1Color={p1Color} p2Color={mode === '2p' ? p2Color : null} stage={selectedStage} mode={mode} onExit={handleExit} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 16px 10px',
          background: 'linear-gradient(transparent, rgba(5,10,24,0.85) 40%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', gap: '14px', color: '#475569', fontSize: '10px', fontFamily: 'Jost, sans-serif', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span><b style={{ color: '#94a3b8' }}>A/D</b> Move</span>
            <span><b style={{ color: '#94a3b8' }}>W</b> Jump</span>
            <span><b style={{ color: '#ef4444' }}>LMB</b> Punch</span>
            <span><b style={{ color: '#3b82f6' }}>RMB</b> Block</span>
            <span><b style={{ color: '#94a3b8' }}>X/C</b> Attacks</span>
            <span><b style={{ color: '#94a3b8' }}>E</b> Dash</span>
            <span><b style={{ color: '#94a3b8' }}>R/Space</b> Special</span>
            <span><b style={{ color: '#94a3b8' }}>TAB</b> Moves</span>
          </div>
          {mode === '2p' && (
            <div style={{ color: '#475569', fontSize: '9px', fontFamily: 'Jost', marginTop: '4px', textAlign: 'center' }}>
              P2: Num4/6 Move | Num8 Jump | Num5/0 Block | Num7 Jab | Num9 Cross | Num3 Kick | Num1 Upper | NumEnter Special
            </div>
          )}
          <button onClick={handleExit} style={{ marginTop: '6px', padding: '5px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,10,24,0.7)', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', pointerEvents: 'auto', backdropFilter: 'blur(4px)' }}>Exit</button>
        </div>
      </div>
    );
  }

  return null;
}
