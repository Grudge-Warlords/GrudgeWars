import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GKO_FIGHTERS, getFighterSheetPath } from '../../data/gkoFighters';

const TRAILER_W = 960;
const TRAILER_H = 540;
const FRAME_MS = 50;

function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function generatePlaceholderSheet(fw, fh, frames, color, type) {
  const c = document.createElement('canvas');
  c.width = fw * frames;
  c.height = fh;
  const ctx = c.getContext('2d');
  const hsl = color;
  for (let f = 0; f < frames; f++) {
    const ox = f * fw;
    const cx = ox + fw / 2;
    const cy = fh * 0.45;
    const phase = (f / frames) * Math.PI * 2;
    const bob = Math.sin(phase) * fh * 0.02;
    ctx.save();
    ctx.translate(0, bob);
    const headR = fh * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy - fh * 0.22, headR, 0, Math.PI * 2);
    ctx.fillStyle = hsl;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(cx - headR * 0.25, cy - fh * 0.22 - headR * 0.15, headR * 0.2, 0, Math.PI * 2);
    ctx.fill();
    const bodyTop = cy - fh * 0.12;
    const bodyBot = cy + fh * 0.15;
    const bodyW = fh * 0.18;
    ctx.fillStyle = hsl;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW, bodyBot);
    ctx.lineTo(cx - bodyW * 0.7, bodyTop);
    ctx.lineTo(cx + bodyW * 0.7, bodyTop);
    ctx.lineTo(cx + bodyW, bodyBot);
    ctx.closePath();
    ctx.fill();
    const legSpread = Math.sin(phase) * fh * 0.06;
    ctx.fillRect(cx - bodyW * 0.5 + legSpread, bodyBot, bodyW * 0.35, fh * 0.18);
    ctx.fillRect(cx + bodyW * 0.15 - legSpread, bodyBot, bodyW * 0.35, fh * 0.18);
    const armSwing = Math.sin(phase + 0.5) * fh * 0.08;
    if (type === 'attack') {
      ctx.save();
      ctx.translate(cx + bodyW, bodyTop + fh * 0.05);
      ctx.rotate(-0.8 + Math.sin(phase) * 0.6);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, -2, fh * 0.25, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(fh * 0.2, -4, 8, 8);
      ctx.restore();
    }
    ctx.fillStyle = hsl;
    ctx.fillRect(cx - bodyW - 2, bodyTop + fh * 0.02 + armSwing, bodyW * 0.35, fh * 0.12);
    ctx.fillRect(cx + bodyW * 0.7, bodyTop + fh * 0.02 - armSwing, bodyW * 0.35, fh * 0.12);
    ctx.restore();
  }
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

const UNIT_COLORS = {
  hero1: '#3b82f6', hero2: '#ef4444', hero3: '#a855f7', hero4: '#22c55e',
  enemy1: '#94a3b8', enemy2: '#78716c', enemy3: '#d97706', boss: '#dc2626',
  mech1: '#06b6d4', mech2: '#6366f1', war1: '#f97316',
  sea1: '#14b8a6', sea2: '#8b5cf6', sea3: '#64748b',
};

function getUnitColor(id) {
  return UNIT_COLORS[id] || '#' + (Math.floor(Math.random() * 0xffffff)).toString(16).padStart(6, '0');
}

function generateVfxSheet(fw, fh, frames, color) {
  const c = document.createElement('canvas');
  c.width = fw * frames;
  c.height = fh;
  const ctx = c.getContext('2d');
  for (let f = 0; f < frames; f++) {
    const ox = f * fw;
    const cx = ox + fw / 2;
    const cy = fh / 2;
    const progress = f / (frames - 1 || 1);
    const r = fw * 0.3 * (1 - progress * 0.3);
    const alpha = 1 - progress * 0.4;
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.3, color || '#fbbf24');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    for (let s = 0; s < 6; s++) {
      const angle = (s / 6) * Math.PI * 2 + progress * 2;
      const dist = r * (0.5 + progress * 0.5);
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = color || '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

function generateSimpleSheet(fw, fh, frames, color) {
  const c = document.createElement('canvas');
  c.width = fw * frames;
  c.height = fh;
  const ctx = c.getContext('2d');
  for (let f = 0; f < frames; f++) {
    const ox = f * fw;
    const cx = ox + fw / 2;
    const cy = fh / 2;
    const phase = (f / frames) * Math.PI * 2;
    const r = fw * 0.25 + Math.sin(phase) * fw * 0.05;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, color || '#06b6d4');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

const TRAILERS = {
  fantasy: {
    title: 'Shadow Knights',
    subtitle: 'Rise of the Duskfall',
    bg: '/backgrounds/arena_battle.png',
    bgs: ['/backgrounds/arena_battle.png', '/backgrounds/shadow_citadel.png', '/backgrounds/infernal_arena.png', '/backgrounds/storm_ruins.png'],
    duration: 60000,
    color: '#a855f7',
    colorAlt: '#ef4444',
    units: [
      { id: 'hero1', folder: 'dark-knight', fw: 128, fh: 96, scale: 2.5, team: 'left', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 4, atkF: 8, hurtF: 3, deathF: 4, walkF: 6 },
      { id: 'hero2', folder: 'fire-knight', fw: 288, fh: 128, scale: 1.5, team: 'left', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'run.png', idleF: 8, atkF: 11, hurtF: 6, deathF: 13, walkF: 8 },
      { id: 'hero3', folder: 'evil-wizard-2', fw: 250, fh: 250, scale: 1.2, team: 'left', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 8, atkF: 8, hurtF: 3, deathF: 7, walkF: 8 },
      { id: 'hero4', folder: 'necromancer', fw: 160, fh: 128, scale: 1.5, team: 'left', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 8, atkF: 13, hurtF: 9, deathF: 5, walkF: 8 },
      { id: 'enemy1', folder: 'greatsword-skeleton', fw: 100, fh: 100, scale: 2.2, team: 'right', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 6, atkF: 9, hurtF: 4, deathF: 4, walkF: 8 },
      { id: 'enemy2', folder: 'armored-skeleton', fw: 100, fh: 100, scale: 2.2, team: 'right', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 6, atkF: 8, hurtF: 4, deathF: 4, walkF: 8 },
      { id: 'enemy3', folder: 'werewolf', fw: 100, fh: 100, scale: 2.2, team: 'right', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 6, atkF: 9, hurtF: 4, deathF: 4, walkF: 8 },
      { id: 'boss', folder: 'boss-demon', fw: 288, fh: 160, scale: 1.5, team: 'right', idle: 'idle.png', attack: 'cleave.png', hurt: 'take_hit.png', death: 'death.png', walk: 'walk.png', idleF: 6, atkF: 15, hurtF: 5, deathF: 22, walkF: 12 },
    ],
    vfx: [
      { id: 'slash', src: '/sprites/effects/effects_row1_strip.png', fw: 16, fh: 16, frames: 12 },
      { id: 'fire', src: '/sprites/effects/fire-pack/1 Fire/Idle.png', fw: 64, fh: 64, frames: 6 },
      { id: 'bomb', src: '/sprites/effects/bombs-explosions/2 Animation/1.png', fw: 48, fh: 48, frames: 6 },
    ],
  },
  space: {
    title: 'Starbound Corsairs',
    subtitle: 'The Void War',
    bg: '/backgrounds/space_battle_1.png',
    bgs: ['/backgrounds/space_battle_1.png', '/backgrounds/shadow_citadel.png', '/backgrounds/infernal_arena.png', '/backgrounds/void_throne.png', '/backgrounds/storm_ruins.png'],
    duration: 60000,
    color: '#06b6d4',
    colorAlt: '#fbbf24',
    units: [
      { id: 'hero1', folder: 'mecha-scout', fw: 96, fh: 96, scale: 2.5, team: 'left', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 6 },
      { id: 'hero2', folder: 'mecha-assault', fw: 96, fh: 96, scale: 2.5, team: 'left', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 6 },
      { id: 'hero3', folder: 'mecha-heavy', fw: 96, fh: 96, scale: 2.5, team: 'left', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 6 },
      { id: 'hero4', folder: 'arcane-archer', fw: 64, fh: 64, scale: 3, team: 'left', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 8, atkF: 8, hurtF: 8, deathF: 8, walkF: 8 },
      { id: 'enemy1', folder: 'cyber-police-officer', fw: 48, fh: 48, scale: 4, team: 'right', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 4, walkF: 6 },
      { id: 'enemy2', folder: 'cyber-police-sergeant', fw: 48, fh: 48, scale: 4, team: 'right', idle: 'Idle.png', attack: 'Attack1.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 4, hurtF: 2, deathF: 4, walkF: 6 },
      { id: 'enemy3', folder: 'nightborne', fw: 80, fh: 80, scale: 2.5, team: 'right', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 9, atkF: 12, hurtF: 5, deathF: 23, walkF: 6 },
      { id: 'boss', folder: 'shadow-warrior', fw: 128, fh: 96, scale: 2.5, team: 'right', idle: 'idle.png', attack: 'attack1.png', hurt: 'hurt.png', death: 'death.png', walk: 'walk.png', idleF: 4, atkF: 12, hurtF: 3, deathF: 4, walkF: 6 },
    ],
    vfx: [
      { id: 'plasma', src: '/sprites/space_traps/plasma_cycle.png', fw: 128, fh: 128, frames: 8 },
      { id: 'plasma_exp', src: '/sprites/space_traps/plasma_explode.png', fw: 128, fh: 128, frames: 15 },
      { id: 'bomb', src: '/sprites/space_traps/bomb_explode.png', fw: 256, fh: 256, frames: 13 },
      { id: 'meteor', src: '/sprites/space_traps/meteor.png', fw: 64, fh: 64, frames: 6 },
    ],
    shots: [
      { id: 'shot1', src: '/sprites/alien_ship1/shot.png', fw: 64, fh: 64, frames: 4 },
      { id: 'shot2', src: '/sprites/alien_ship2/shot.png', fw: 64, fh: 64, frames: 4 },
      { id: 'impact1', src: '/sprites/alien_ship1/shot_impact.png', fw: 64, fh: 64, frames: 5 },
    ],
  },
  underwater: {
    title: 'Betta Warlords',
    subtitle: 'Tides of War',
    bg: '/backgrounds/ocean_battle_new.png',
    bgs: ['/backgrounds/ocean_battle_new.png', '/backgrounds/coral_reef_city.png', '/backgrounds/volcanic_battle.png', '/backgrounds/deep_trench_battle.png'],
    duration: 60000,
    color: '#06b6d4',
    colorAlt: '#a855f7',
    units: [
      { id: 'mech1', folder: 'mecha-scout', fw: 96, fh: 96, scale: 2.5, team: 'left', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 4 },
      { id: 'mech2', folder: 'mecha-assault', fw: 96, fh: 96, scale: 2.5, team: 'left', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 4 },
      { id: 'war1', folder: 'fantasy-warrior', fw: 162, fh: 162, scale: 1.5, team: 'left', idle: 'Idle.png', attack: 'Attack1.png', hurt: 'TakeHit.png', death: 'Death.png', walk: 'Run.png', idleF: 10, atkF: 7, hurtF: 3, deathF: 7, walkF: 8 },
      { id: 'sea1', folder: 'sea-boss-kraken', fw: 96, fh: 96, scale: 2.5, team: 'right', idle: 'Idle.png', attack: 'Attack1.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 4 },
      { id: 'sea2', folder: 'sea-boss-leviathan', fw: 96, fh: 96, scale: 2.5, team: 'right', idle: 'Idle.png', attack: 'Attack1.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 4 },
      { id: 'sea3', folder: 'sea-shark', fw: 48, fh: 48, scale: 4, team: 'right', idle: 'Idle.png', attack: 'Attack.png', hurt: 'Hurt.png', death: 'Death.png', walk: 'Walk.png', idleF: 4, atkF: 6, hurtF: 2, deathF: 6, walkF: 4 },
    ],
    vfx: [
      { id: 'slash', src: '/sprites/effects/effects_row1_strip.png', fw: 16, fh: 16, frames: 12 },
      { id: 'fire', src: '/sprites/effects/fire-pack/1 Fire/Idle.png', fw: 64, fh: 64, frames: 6 },
      { id: 'bomb', src: '/sprites/effects/bombs-explosions/2 Animation/1.png', fw: 48, fh: 48, frames: 6 },
    ],
  },
  boxing: {
    title: 'G.K.O. Boxing',
    subtitle: 'Enter the Ring',
    bg: '/sprites/grudge-box/stages/arena.png',
    bgs: ['/sprites/grudge-box/stages/arena.png', '/sprites/grudge-box/stages/street.png', '/sprites/grudge-box/stages/rooftop.png', '/sprites/grudge-box/stages/underground.png', '/sprites/grudge-box/stages/factory.png'],
    duration: 60000,
    color: '#ef4444',
    colorAlt: '#fbbf24',
    isBoxing: true,
    fighters: GKO_FIGHTERS.map((f, i) => ({
      id: `fighter_${f.id}`,
      fighterId: f.id,
      name: f.name,
      team: i % 2 === 0 ? 'left' : 'right',
    })),
    units: [],
    vfx: [
      { id: 'slash', src: '/sprites/effects/effects_row1_strip.png', fw: 16, fh: 16, frames: 12 },
      { id: 'fire', src: '/sprites/effects/fire-pack/1 Fire/Idle.png', fw: 64, fh: 64, frames: 6 },
    ],
  },
  rogueops: {
    title: 'Rogue Ops',
    subtitle: 'No Mercy',
    bg: '/backgrounds/dark_forest.png',
    bgs: ['/backgrounds/dark_forest.png', '/backgrounds/shadow_citadel.png', '/backgrounds/infernal_arena.png', '/backgrounds/storm_ruins.png', '/backgrounds/void_throne.png'],
    duration: 60000,
    color: '#22c55e',
    colorAlt: '#ef4444',
    isRogueOps: true,
    units: [],
    vfx: [
      { id: 'hit1', src: '/sprites/rogue-ops/effects/1_1.png', fw: 192, fh: 96, frames: 3 },
      { id: 'hit2', src: '/sprites/rogue-ops/effects/2_1.png', fw: 192, fh: 96, frames: 3 },
      { id: 'boom', src: '/sprites/rogue-ops/enemies/Boom1.png', fw: 48, fh: 48, frames: 6 },
    ],
  },
};

const BOX_FW = 64, BOX_FH = 64;

function boxFrameTable(row, groups) {
  const frames = [];
  for (const [colStart, count] of groups) {
    for (let c = colStart; c < colStart + count; c++) {
      frames.push({ col: c, row });
    }
  }
  return frames;
}

const BOXING_ANIMS = {
  idle:     { frames: boxFrameTable(0, [[0, 6]]),  speed: 120, loop: true },
  walk:     { frames: boxFrameTable(2, [[0, 4]]),  speed: 80,  loop: true },
  jab:      { frames: boxFrameTable(1, [[0, 2]]),  speed: 55 },
  cross:    { frames: boxFrameTable(4, [[0, 4]]),  speed: 65 },
  lowkick:  { frames: boxFrameTable(6, [[0, 4]]),  speed: 55 },
  kick:     { frames: boxFrameTable(7, [[0, 4]]),  speed: 60 },
  midkick:  { frames: boxFrameTable(7, [[0, 4]]),  speed: 60 },
  upper:    { frames: boxFrameTable(5, [[0, 4]]),  speed: 60 },
  uppercut: { frames: boxFrameTable(5, [[0, 4]]),  speed: 60 },
  hook:     { frames: boxFrameTable(5, [[0, 4]]),  speed: 65 },
  block:    { frames: boxFrameTable(3, [[0, 2]]),  speed: 100 },
  guard:    { frames: boxFrameTable(3, [[0, 2]]),  speed: 100 },
  hurt:     { frames: boxFrameTable(3, [[0, 2]]),  speed: 55 },
  stun:     { frames: boxFrameTable(3, [[0, 2]]),  speed: 60 },
  highkick: { frames: boxFrameTable(8, [[0, 4]]),  speed: 55 },
  special:  { frames: boxFrameTable(9, [[0, 4]]),  speed: 50 },
  ko:       { frames: boxFrameTable(10, [[0, 4]]), speed: 80 },
  death:    { frames: boxFrameTable(10, [[0, 4]]), speed: 80 },
  win:      { frames: boxFrameTable(11, [[0, 4]]), speed: 90 },
};

const BOXING_ANIMS_LEFT = {};
for (const [key, val] of Object.entries(BOXING_ANIMS)) {
  BOXING_ANIMS_LEFT[key] = {
    ...val,
    frames: val.frames.map(f => ({ col: f.col, row: f.row + 12 })),
  };
}

function buildBoxingChoreography(trailer) {
  const events = [];
  const f = trailer.fighters;
  const f1 = f[0];
  const f2 = f[1];

  events.push({ time: 0, type: 'bg', bgIndex: 0 });
  events.push({ time: 0, type: 'camera', zoom: 1.2, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 0, type: 'text', text: 'GRUDGE STUDIOS PRESENTS', size: 14, y: 0.35, fade: 1200, hold: 2000, color: '#fbbf24' });
  events.push({ time: 2000, type: 'loreFlash', text: 'SETTLE THE SCORE', size: 64, y: 0.45, fade: 600, hold: 1800, color: '#ef4444' });
  events.push({ time: 2500, type: 'text', text: 'G.K.O. BOXING', size: 56, y: 0.45, fade: 800, hold: 2500, color: '#fff', font: 'Cinzel' });
  events.push({ time: 3200, type: 'text', text: 'Enter the Ring', size: 20, y: 0.58, fade: 800, hold: 1800, color: '#ef4444' });

  events.push({ time: 5500, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 5500, type: 'bg', bgIndex: 1 });
  events.push({ time: 5500, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });

  events.push({ time: 5800, type: 'boxSpawn', fighterId: f1.id, x: 0.2, y: 0.55 });
  events.push({ time: 5800, type: 'boxSpawn', fighterId: f2.id, x: 0.8, y: 0.55 });
  events.push({ time: 5800, type: 'dialogue', text: f1.name, size: 28, x: 0.2, y: 0.35, fade: 500, hold: 2000, color: '#fbbf24' });
  events.push({ time: 6200, type: 'dialogue', text: 'VS', size: 48, x: 0.5, y: 0.4, fade: 300, hold: 1500, color: '#fff' });
  events.push({ time: 6500, type: 'dialogue', text: f2.name, size: 28, x: 0.8, y: 0.35, fade: 500, hold: 2000, color: '#fbbf24' });

  events.push({ time: 8000, type: 'boxMove', fighterId: f1.id, toX: 0.35, toY: 0.55, dur: 800, anim: 'walk' });
  events.push({ time: 8000, type: 'boxMove', fighterId: f2.id, toX: 0.65, toY: 0.55, dur: 800, anim: 'walk' });
  events.push({ time: 8800, type: 'boxAnim', fighterId: f1.id, anim: 'idle' });
  events.push({ time: 8800, type: 'boxAnim', fighterId: f2.id, anim: 'idle' });

  events.push({ time: 9500, type: 'camera', zoom: 1.5, x: 0.35, y: 0.5, dur: 1000 });
  events.push({ time: 9500, type: 'loreFlash', text: 'ROUND 1', size: 72, y: 0.4, fade: 400, hold: 1000, color: '#fbbf24' });
  events.push({ time: 10000, type: 'shake', intensity: 'normal' });

  const attacks = ['jab', 'cross', 'hook', 'uppercut', 'highkick', 'midkick', 'jab', 'cross', 'special'];
  const comboStart = 11000;
  for (let i = 0; i < attacks.length; i++) {
    const t0 = comboStart + i * 600;
    const attacker = i % 2 === 0 ? f1.id : f2.id;
    const defender = i % 2 === 0 ? f2.id : f1.id;
    events.push({ time: t0, type: 'boxAnim', fighterId: attacker, anim: attacks[i] });
    events.push({ time: t0 + 250, type: 'boxAnim', fighterId: defender, anim: i === 3 ? 'block' : 'hurt' });
    events.push({ time: t0 + 250, type: 'shake', intensity: i === attacks.length - 1 ? 'heavy' : 'normal' });
    if (i > 2) {
      events.push({ time: t0 + 250, type: 'actionText', text: i === 8 ? 'DEVASTATION' : `COMBO x${i - 1}`, size: i === 8 ? 36 : 24, x: 0.5, y: 0.2, fade: 200, hold: 400, color: i === 8 ? '#ef4444' : '#fbbf24' });
    }
    const dmg = Math.floor(50 + Math.random() * 200);
    events.push({ time: t0 + 300, type: 'dmgPopup', targetId: defender, text: i === 3 ? 'BLOCKED' : `${dmg}`, crit: i === 8 });
    events.push({ time: t0 + 450, type: 'boxAnim', fighterId: attacker, anim: 'idle' });
    events.push({ time: t0 + 450, type: 'boxAnim', fighterId: defender, anim: 'idle' });
  }

  events.push({ time: 16500, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 16500, type: 'bg', bgIndex: 2 });
  events.push({ time: 16500, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });

  const f3 = f[2];
  const f4 = f[3];
  events.push({ time: 17000, type: 'boxDespawn', fighterId: f1.id });
  events.push({ time: 17000, type: 'boxDespawn', fighterId: f2.id });
  events.push({ time: 17000, type: 'boxSpawn', fighterId: f3.id, x: 0.25, y: 0.55 });
  events.push({ time: 17000, type: 'boxSpawn', fighterId: f4.id, x: 0.75, y: 0.55 });
  events.push({ time: 17000, type: 'dialogue', text: f3.name, size: 28, x: 0.25, y: 0.35, fade: 500, hold: 1500, color: '#22c55e' });
  events.push({ time: 17300, type: 'dialogue', text: f4.name, size: 28, x: 0.75, y: 0.35, fade: 500, hold: 1500, color: '#a855f7' });
  events.push({ time: 17500, type: 'loreFlash', text: 'ROUND 2', size: 72, y: 0.4, fade: 400, hold: 1000, color: '#fbbf24' });

  events.push({ time: 18500, type: 'boxMove', fighterId: f3.id, toX: 0.38, toY: 0.55, dur: 600, anim: 'walk' });
  events.push({ time: 18500, type: 'boxMove', fighterId: f4.id, toX: 0.62, toY: 0.55, dur: 600, anim: 'walk' });
  events.push({ time: 19100, type: 'boxAnim', fighterId: f3.id, anim: 'idle' });
  events.push({ time: 19100, type: 'boxAnim', fighterId: f4.id, anim: 'idle' });

  const attacks2 = ['jab', 'jab', 'cross', 'uppercut', 'special', 'highkick', 'hook'];
  for (let i = 0; i < attacks2.length; i++) {
    const t0 = 19500 + i * 550;
    const attacker = i % 2 === 0 ? f3.id : f4.id;
    const defender = i % 2 === 0 ? f4.id : f3.id;
    events.push({ time: t0, type: 'boxAnim', fighterId: attacker, anim: attacks2[i] });
    events.push({ time: t0 + 250, type: 'boxAnim', fighterId: defender, anim: 'hurt' });
    events.push({ time: t0 + 250, type: 'shake', intensity: i >= 4 ? 'heavy' : 'normal' });
    if (i === 4) events.push({ time: t0 + 250, type: 'flash', color: '#a855f7', dur: 150 });
    events.push({ time: t0 + 300, type: 'dmgPopup', targetId: defender, text: `${Math.floor(80 + Math.random() * 250)}`, crit: i >= 5 });
    events.push({ time: t0 + 450, type: 'boxAnim', fighterId: attacker, anim: 'idle' });
    events.push({ time: t0 + 450, type: 'boxAnim', fighterId: defender, anim: 'idle' });
  }

  events.push({ time: 23500, type: 'camera', zoom: 1.8, x: 0.62, y: 0.5, dur: 800 });
  events.push({ time: 23500, type: 'boxAnim', fighterId: f3.id, anim: 'special' });
  events.push({ time: 24000, type: 'flash', color: '#22c55e', dur: 300 });
  events.push({ time: 24000, type: 'shake', intensity: 'heavy' });
  events.push({ time: 24000, type: 'boxAnim', fighterId: f4.id, anim: 'stun' });
  events.push({ time: 24000, type: 'actionText', text: 'K.O.!', size: 64, x: 0.5, y: 0.3, fade: 300, hold: 1500, color: '#ef4444' });
  events.push({ time: 24500, type: 'boxAnim', fighterId: f4.id, anim: 'death' });
  events.push({ time: 24500, type: 'dmgPopup', targetId: f4.id, text: 'K.O.', crit: true });

  events.push({ time: 26000, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 26000, type: 'bg', bgIndex: 3 });
  events.push({ time: 26000, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });
  events.push({ time: 26000, type: 'boxDespawn', fighterId: f3.id });
  events.push({ time: 26000, type: 'boxDespawn', fighterId: f4.id });

  const f5 = f[4];
  const f6 = f[5];
  events.push({ time: 26500, type: 'boxSpawn', fighterId: f5.id, x: 0.25, y: 0.55 });
  events.push({ time: 26500, type: 'boxSpawn', fighterId: f6.id, x: 0.75, y: 0.55 });
  events.push({ time: 26500, type: 'dialogue', text: f5.name, size: 28, x: 0.25, y: 0.35, fade: 500, hold: 1500, color: '#eab308' });
  events.push({ time: 26800, type: 'dialogue', text: f6.name, size: 28, x: 0.75, y: 0.35, fade: 500, hold: 1500, color: '#334155' });
  events.push({ time: 27000, type: 'loreFlash', text: 'CHAMPIONSHIP BOUT', size: 56, y: 0.4, fade: 400, hold: 1200, color: '#fbbf24' });

  events.push({ time: 28000, type: 'boxMove', fighterId: f5.id, toX: 0.38, toY: 0.55, dur: 600, anim: 'walk' });
  events.push({ time: 28000, type: 'boxMove', fighterId: f6.id, toX: 0.62, toY: 0.55, dur: 600, anim: 'walk' });
  events.push({ time: 28600, type: 'boxAnim', fighterId: f5.id, anim: 'idle' });
  events.push({ time: 28600, type: 'boxAnim', fighterId: f6.id, anim: 'idle' });

  const rapidAttacks = ['jab', 'cross', 'jab', 'hook', 'uppercut', 'highkick', 'cross', 'special', 'jab', 'uppercut', 'hook', 'special'];
  for (let i = 0; i < rapidAttacks.length; i++) {
    const t0 = 29000 + i * 500;
    const attacker = i % 2 === 0 ? f5.id : f6.id;
    const defender = i % 2 === 0 ? f6.id : f5.id;
    events.push({ time: t0, type: 'boxAnim', fighterId: attacker, anim: rapidAttacks[i] });
    events.push({ time: t0 + 200, type: 'boxAnim', fighterId: defender, anim: i % 5 === 0 ? 'block' : 'hurt' });
    events.push({ time: t0 + 200, type: 'shake', intensity: i >= 9 ? 'heavy' : 'normal' });
    if (i >= 6) {
      events.push({ time: t0 + 200, type: 'actionText', text: `COMBO x${i - 4}`, size: 28, x: 0.5, y: 0.15, fade: 150, hold: 300, color: '#fbbf24' });
    }
    if (i === 11) {
      events.push({ time: t0 + 200, type: 'flash', color: '#ef4444', dur: 200 });
      events.push({ time: t0 + 200, type: 'actionText', text: 'ULTIMATE FINISH!', size: 48, x: 0.5, y: 0.25, fade: 300, hold: 1500, color: '#ef4444' });
    }
    events.push({ time: t0 + 250, type: 'dmgPopup', targetId: defender, text: i % 5 === 0 ? 'BLOCK' : `${Math.floor(100 + Math.random() * 300)}`, crit: i >= 10 });
    events.push({ time: t0 + 400, type: 'boxAnim', fighterId: attacker, anim: 'idle' });
    events.push({ time: t0 + 400, type: 'boxAnim', fighterId: defender, anim: 'idle' });
  }

  events.push({ time: 35500, type: 'camera', zoom: 2.0, x: 0.62, y: 0.5, dur: 800 });
  events.push({ time: 35800, type: 'boxAnim', fighterId: f5.id, anim: 'special' });
  events.push({ time: 36200, type: 'flash', color: '#fbbf24', dur: 400 });
  events.push({ time: 36200, type: 'shake', intensity: 'heavy' });
  events.push({ time: 36200, type: 'boxAnim', fighterId: f6.id, anim: 'death' });
  events.push({ time: 36200, type: 'actionText', text: 'G.K.O.!', size: 72, x: 0.5, y: 0.3, fade: 400, hold: 2000, color: '#ef4444' });
  events.push({ time: 36200, type: 'dmgPopup', targetId: f6.id, text: 'G.K.O.', crit: true });

  events.push({ time: 38500, type: 'boxAnim', fighterId: f5.id, anim: 'win' });

  events.push({ time: 40000, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 40000, type: 'bg', bgIndex: 4 });
  events.push({ time: 40000, type: 'camera', zoom: 0.9, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 40000, type: 'boxDespawn', fighterId: f5.id });
  events.push({ time: 40000, type: 'boxDespawn', fighterId: f6.id });

  for (let i = 0; i < 8; i++) {
    const fi = f[i];
    const col = i < 4 ? 0.1 + i * 0.12 : 0.54 + (i - 4) * 0.12;
    const showcaseFace = i < 4 ? 'left' : 'right';
    events.push({ time: 40500 + i * 200, type: 'boxSpawn', fighterId: fi.id, x: col, y: 0.55, faceOverride: showcaseFace });
    events.push({ time: 41500, type: 'boxAnim', fighterId: fi.id, anim: 'idle' });
  }

  events.push({ time: 41500, type: 'loreFlash', text: '8 FIGHTERS', size: 56, y: 0.2, fade: 500, hold: 1500, color: '#fbbf24' });
  events.push({ time: 43000, type: 'loreFlash', text: 'ONE CHAMPION', size: 56, y: 0.2, fade: 500, hold: 1500, color: '#ef4444' });

  for (let i = 0; i < 8; i++) {
    events.push({ time: 44500 + i * 150, type: 'boxAnim', fighterId: f[i].id, anim: ['jab', 'cross', 'uppercut', 'highkick', 'hook', 'special', 'midkick', 'jab'][i] });
  }
  events.push({ time: 45800, type: 'shake', intensity: 'heavy' });
  events.push({ time: 45800, type: 'flash', color: '#ef4444', dur: 300 });

  for (let i = 0; i < 8; i++) {
    events.push({ time: 46500, type: 'boxDespawn', fighterId: f[i].id });
  }

  events.push({ time: 47000, type: 'camera', zoom: 1.3, x: 0.5, y: 0.5, dur: 3000 });
  events.push({ time: 47000, type: 'bg', bgIndex: 0 });

  events.push({ time: 48000, type: 'boxSpawn', fighterId: f1.id, x: 0.5, y: 0.55, faceOverride: 'right' });
  events.push({ time: 48000, type: 'boxAnim', fighterId: f1.id, anim: 'win' });

  events.push({ time: 48500, type: 'text', text: 'CHAMPION', size: 56, y: 0.25, fade: 1000, hold: 3000, color: '#fbbf24', font: 'Cinzel' });
  events.push({ time: 49000, type: 'dialogue', text: f1.name, size: 36, x: 0.5, y: 0.15, fade: 800, hold: 2500, color: '#ef4444' });

  events.push({ time: 52000, type: 'text', text: 'G.K.O. BOXING', size: 48, y: 0.4, fade: 1000, hold: 3000, color: '#fff', font: 'Cinzel' });
  events.push({ time: 52500, type: 'text', text: 'COMING SOON', size: 18, y: 0.55, fade: 800, hold: 3000, color: '#94a3b8' });

  events.push({ time: 56000, type: 'text', text: 'GRUDGE STUDIOS', size: 20, y: 0.45, fade: 1000, hold: 3000, color: '#fbbf24', font: 'Cinzel' });

  return events.sort((a, b) => a.time - b.time);
}

function buildRogueOpsChoreography(trailer) {
  const events = [];

  events.push({ time: 0, type: 'bg', bgIndex: 0 });
  events.push({ time: 0, type: 'camera', zoom: 1.2, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 0, type: 'text', text: 'GRUDGE STUDIOS PRESENTS', size: 14, y: 0.35, fade: 1200, hold: 2000, color: '#fbbf24' });
  events.push({ time: 2000, type: 'loreFlash', text: 'NO MERCY', size: 72, y: 0.45, fade: 500, hold: 1500, color: '#22c55e' });
  events.push({ time: 2500, type: 'text', text: 'ROGUE OPS', size: 56, y: 0.45, fade: 800, hold: 2500, color: '#fff', font: 'Cinzel' });
  events.push({ time: 3200, type: 'text', text: 'Survive. Eliminate. Dominate.', size: 18, y: 0.58, fade: 800, hold: 1800, color: '#22c55e' });

  events.push({ time: 5500, type: 'flash', color: '#22c55e', dur: 200 });
  events.push({ time: 5500, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });

  events.push({ time: 5800, type: 'roSpawn', unitId: 'hero', variant: 1, x: -0.05, y: 0.6 });
  events.push({ time: 5800, type: 'roMove', unitId: 'hero', toX: 0.2, toY: 0.6, dur: 1200, anim: 'walk' });
  events.push({ time: 7000, type: 'roAnim', unitId: 'hero', anim: 'idle' });
  events.push({ time: 7000, type: 'dialogue', text: 'AGENT PHOENIX', size: 24, x: 0.2, y: 0.4, fade: 500, hold: 1500, color: '#22c55e' });
  events.push({ time: 7000, type: 'roEquipWeapon', unitId: 'hero', weaponIdx: 0 });

  events.push({ time: 8500, type: 'loreFlash', text: 'WAVE 1', size: 64, y: 0.4, fade: 400, hold: 1000, color: '#ef4444' });

  for (let i = 0; i < 4; i++) {
    events.push({ time: 9500 + i * 300, type: 'roSpawn', unitId: `enemy_w1_${i}`, variant: (i % 3) + 1, x: 1.1, y: 0.45 + i * 0.1, isEnemy: true });
    events.push({ time: 9500 + i * 300, type: 'roMove', unitId: `enemy_w1_${i}`, toX: 0.7 + i * 0.05, toY: 0.45 + i * 0.1, dur: 800, anim: 'walk' });
    events.push({ time: 10300 + i * 300, type: 'roAnim', unitId: `enemy_w1_${i}`, anim: 'idle' });
  }

  events.push({ time: 11000, type: 'camera', zoom: 1.3, x: 0.4, y: 0.55, dur: 1000 });

  for (let i = 0; i < 4; i++) {
    const t0 = 11500 + i * 800;
    events.push({ time: t0, type: 'roShoot', from: 'hero', to: `enemy_w1_${i}` });
    events.push({ time: t0 + 300, type: 'roHit', targetId: `enemy_w1_${i}` });
    events.push({ time: t0 + 300, type: 'shake', intensity: 'normal' });
    events.push({ time: t0 + 350, type: 'dmgPopup', targetId: `enemy_w1_${i}`, text: `${Math.floor(50 + Math.random() * 100)}`, crit: i === 3 });
    if (i === 3) events.push({ time: t0 + 350, type: 'actionText', text: 'HEADSHOT', size: 28, x: 0.5, y: 0.2, fade: 200, hold: 600, color: '#ef4444' });
    events.push({ time: t0 + 400, type: 'roDeath', unitId: `enemy_w1_${i}` });
  }

  events.push({ time: 15000, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 15000, type: 'bg', bgIndex: 1 });
  events.push({ time: 15000, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });
  events.push({ time: 15000, type: 'roTeleport', unitId: 'hero', x: 0.15, y: 0.6 });
  events.push({ time: 15500, type: 'roEquipWeapon', unitId: 'hero', weaponIdx: 2 });

  events.push({ time: 15500, type: 'loreFlash', text: 'WAVE 2', size: 64, y: 0.4, fade: 400, hold: 1000, color: '#ef4444' });

  for (let i = 0; i < 6; i++) {
    events.push({ time: 16500 + i * 250, type: 'roSpawn', unitId: `enemy_w2_${i}`, variant: (i % 6) + 1, x: 1.1, y: 0.35 + i * 0.08, isEnemy: true });
    events.push({ time: 16500 + i * 250, type: 'roMove', unitId: `enemy_w2_${i}`, toX: 0.65 + (i % 3) * 0.08, toY: 0.35 + i * 0.08, dur: 700, anim: 'walk' });
    events.push({ time: 17200 + i * 250, type: 'roAnim', unitId: `enemy_w2_${i}`, anim: 'idle' });
  }

  events.push({ time: 18000, type: 'camera', zoom: 1.2, x: 0.5, y: 0.5, dur: 1000 });

  for (let i = 0; i < 6; i++) {
    const t0 = 18500 + i * 600;
    events.push({ time: t0, type: 'roShoot', from: 'hero', to: `enemy_w2_${i}` });
    events.push({ time: t0 + 250, type: 'roHit', targetId: `enemy_w2_${i}` });
    events.push({ time: t0 + 250, type: 'shake', intensity: i >= 4 ? 'heavy' : 'normal' });
    events.push({ time: t0 + 300, type: 'dmgPopup', targetId: `enemy_w2_${i}`, text: `${Math.floor(80 + Math.random() * 150)}`, crit: i >= 4 });
    if (i >= 3) events.push({ time: t0 + 250, type: 'actionText', text: `COMBO x${i - 1}`, size: 24, x: 0.5, y: 0.15, fade: 150, hold: 400, color: '#fbbf24' });
    events.push({ time: t0 + 350, type: 'roDeath', unitId: `enemy_w2_${i}` });
  }
  events.push({ time: 22200, type: 'flash', color: '#22c55e', dur: 200 });
  events.push({ time: 22200, type: 'actionText', text: 'WAVE CLEARED', size: 36, x: 0.5, y: 0.3, fade: 300, hold: 1200, color: '#22c55e' });

  events.push({ time: 24000, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 24000, type: 'bg', bgIndex: 2 });
  events.push({ time: 24000, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });
  events.push({ time: 24000, type: 'roTeleport', unitId: 'hero', x: 0.15, y: 0.55 });
  events.push({ time: 24000, type: 'roEquipWeapon', unitId: 'hero', weaponIdx: 4 });

  events.push({ time: 24500, type: 'loreFlash', text: 'WAVE 3', size: 64, y: 0.4, fade: 400, hold: 1000, color: '#ef4444' });

  for (let i = 0; i < 8; i++) {
    events.push({ time: 25500 + i * 200, type: 'roSpawn', unitId: `enemy_w3_${i}`, variant: (i % 6) + 1, x: 1.1, y: 0.3 + i * 0.065, isEnemy: true });
    events.push({ time: 25500 + i * 200, type: 'roMove', unitId: `enemy_w3_${i}`, toX: 0.6 + (i % 4) * 0.07, toY: 0.3 + i * 0.065, dur: 600, anim: 'walk' });
    events.push({ time: 26100 + i * 200, type: 'roAnim', unitId: `enemy_w3_${i}`, anim: 'idle' });
  }

  events.push({ time: 27000, type: 'roMove', unitId: 'hero', toX: 0.3, toY: 0.55, dur: 500, anim: 'walk' });
  events.push({ time: 27500, type: 'roAnim', unitId: 'hero', anim: 'idle' });

  for (let i = 0; i < 8; i++) {
    const t0 = 27500 + i * 450;
    events.push({ time: t0, type: 'roShoot', from: 'hero', to: `enemy_w3_${i}` });
    events.push({ time: t0 + 200, type: 'roHit', targetId: `enemy_w3_${i}` });
    events.push({ time: t0 + 200, type: 'shake', intensity: i >= 5 ? 'heavy' : 'normal' });
    events.push({ time: t0 + 250, type: 'dmgPopup', targetId: `enemy_w3_${i}`, text: `${Math.floor(100 + Math.random() * 200)}`, crit: i >= 6 });
    events.push({ time: t0 + 300, type: 'roDeath', unitId: `enemy_w3_${i}` });
  }

  events.push({ time: 31500, type: 'flash', color: '#fff', dur: 300 });
  events.push({ time: 31500, type: 'actionText', text: 'ALL HOSTILES ELIMINATED', size: 32, x: 0.5, y: 0.25, fade: 300, hold: 1500, color: '#22c55e' });

  events.push({ time: 33500, type: 'flash', color: '#ef4444', dur: 300 });
  events.push({ time: 33500, type: 'bg', bgIndex: 3 });
  events.push({ time: 33500, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 1500 });
  events.push({ time: 33500, type: 'roTeleport', unitId: 'hero', x: 0.2, y: 0.55 });
  events.push({ time: 33500, type: 'roEquipWeapon', unitId: 'hero', weaponIdx: 5 });

  events.push({ time: 34000, type: 'loreFlash', text: 'BOSS ENCOUNTER', size: 56, y: 0.4, fade: 500, hold: 1500, color: '#ef4444' });
  events.push({ time: 34000, type: 'shake', intensity: 'heavy' });

  for (let i = 0; i < 3; i++) {
    events.push({ time: 35500 + i * 300, type: 'roSpawn', unitId: `boss_guard_${i}`, variant: (i % 3) + 4, x: 1.1, y: 0.4 + i * 0.12, isEnemy: true, isBoss: i === 2 });
    events.push({ time: 35500 + i * 300, type: 'roMove', unitId: `boss_guard_${i}`, toX: 0.7 + i * 0.05, toY: 0.4 + i * 0.12, dur: 800, anim: 'walk' });
    events.push({ time: 36300 + i * 300, type: 'roAnim', unitId: `boss_guard_${i}`, anim: 'idle' });
  }

  events.push({ time: 37000, type: 'camera', zoom: 1.5, x: 0.5, y: 0.5, dur: 1200 });

  for (let i = 0; i < 3; i++) {
    const t0 = 37500 + i * 1200;
    for (let j = 0; j < 3; j++) {
      events.push({ time: t0 + j * 300, type: 'roShoot', from: 'hero', to: `boss_guard_${i}` });
    }
    events.push({ time: t0 + 600, type: 'roHit', targetId: `boss_guard_${i}` });
    events.push({ time: t0 + 600, type: 'shake', intensity: 'heavy' });
    events.push({ time: t0 + 600, type: 'flash', color: i === 2 ? '#ef4444' : '#22c55e', dur: 200 });
    events.push({ time: t0 + 650, type: 'dmgPopup', targetId: `boss_guard_${i}`, text: i === 2 ? 'CRITICAL 999' : `${Math.floor(200 + Math.random() * 300)}`, crit: true });
    if (i === 2) events.push({ time: t0 + 650, type: 'actionText', text: 'BOSS ELIMINATED', size: 36, x: 0.5, y: 0.2, fade: 300, hold: 1500, color: '#ef4444' });
    events.push({ time: t0 + 800, type: 'roDeath', unitId: `boss_guard_${i}` });
  }

  events.push({ time: 42000, type: 'flash', color: '#fff', dur: 400 });
  events.push({ time: 42000, type: 'shake', intensity: 'heavy' });
  events.push({ time: 42500, type: 'roAnim', unitId: 'hero', anim: 'idle' });

  events.push({ time: 43000, type: 'bg', bgIndex: 4 });
  events.push({ time: 43000, type: 'camera', zoom: 1.2, x: 0.5, y: 0.5, dur: 3000 });

  events.push({ time: 44000, type: 'loreFlash', text: 'MISSION COMPLETE', size: 56, y: 0.35, fade: 800, hold: 2500, color: '#22c55e' });
  events.push({ time: 46000, type: 'text', text: 'ROGUE OPS', size: 48, y: 0.4, fade: 1000, hold: 3000, color: '#fff', font: 'Cinzel' });
  events.push({ time: 46500, type: 'text', text: 'No Mercy', size: 20, y: 0.55, fade: 800, hold: 2500, color: '#22c55e' });

  events.push({ time: 50000, type: 'text', text: 'COMING SOON', size: 18, y: 0.65, fade: 800, hold: 3000, color: '#94a3b8' });
  events.push({ time: 53000, type: 'text', text: 'GRUDGE STUDIOS', size: 20, y: 0.45, fade: 1000, hold: 3000, color: '#fbbf24', font: 'Cinzel' });
  events.push({ time: 56000, type: 'camera', zoom: 1.1, x: 0.5, y: 0.5, dur: 3000 });

  return events.sort((a, b) => a.time - b.time);
}

function buildChoreography(trailer) {
  if (trailer.isBoxing) return buildBoxingChoreography(trailer);
  if (trailer.isRogueOps) return buildRogueOpsChoreography(trailer);

  const events = [];
  const t = trailer;
  const leftUnits = t.units.filter(u => u.team === 'left');
  const rightUnits = t.units.filter(u => u.team === 'right');
  const isSpace = t.title === 'Starbound Corsairs';
  const isBetta = t.title === 'Betta Warlords';

  events.push({ time: 0, type: 'bg', bgIndex: 0 });
  events.push({ time: 0, type: 'camera', zoom: 1.3, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 0, type: 'text', text: 'GRUDGE STUDIOS PRESENTS', size: 14, y: 0.4, fade: 1500, hold: 2000, color: '#fbbf24' });
  events.push({ time: 1500, type: 'loreFlash', text: isSpace ? 'THE VOID HUNGERS' : isBetta ? 'FROM THE DEPTHS' : 'ANCIENT POWERS AWAKEN', size: 64, y: 0.45, fade: 600, hold: 1500, color: t.color });
  events.push({ time: 2500, type: 'text', text: t.title.toUpperCase(), size: 48, y: 0.45, fade: 800, hold: 2500, color: '#fff', font: 'Cinzel' });
  events.push({ time: 3000, type: 'text', text: t.subtitle, size: 18, y: 0.58, fade: 1000, hold: 2000, color: t.color });
  events.push({ time: 2000, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 3000 });

  events.push({ time: 5500, type: 'flash', color: '#fff', dur: 150 });
  events.push({ time: 5500, type: 'shake', intensity: 'heavy' });

  leftUnits.forEach((u, i) => {
    events.push({ time: 5800 + i * 300, type: 'spawn', unitId: u.id, x: -0.1, y: 0.25 + i * 0.2 });
    events.push({ time: 5800 + i * 300, type: 'move', unitId: u.id, toX: 0.15 + i * 0.04, toY: 0.25 + i * 0.18, dur: 800, anim: 'walk' });
    events.push({ time: 6600 + i * 300, type: 'anim', unitId: u.id, anim: 'idle' });
  });

  rightUnits.forEach((u, i) => {
    events.push({ time: 6000 + i * 300, type: 'spawn', unitId: u.id, x: 1.1, y: 0.2 + i * 0.22 });
    events.push({ time: 6000 + i * 300, type: 'move', unitId: u.id, toX: 0.78 - i * 0.04, toY: 0.2 + i * 0.22, dur: 800, anim: 'walk' });
    events.push({ time: 6800 + i * 300, type: 'anim', unitId: u.id, anim: 'idle' });
  });

  events.push({ time: 7500, type: 'dialogue', text: isSpace ? '"Weapons online."' : isBetta ? '"The ocean calls..."' : '"For honor and glory!"', size: 18, x: 0.2, y: 0.15, fade: 600, hold: 1800, color: '#fbbf24' });

  events.push({ time: 8000, type: 'camera', zoom: 1.4, x: 0.2, y: 0.35, dur: 1500 });
  if (leftUnits[0]) {
    events.push({ time: 8500, type: 'anim', unitId: leftUnits[0].id, anim: 'attack' });
    if (isSpace) {
      events.push({ time: 8700, type: 'projectile', from: leftUnits[0].id, to: rightUnits[0]?.id, speed: 600, vfx: 'plasma' });
    }
    events.push({ time: 9200, type: 'vfx', vfxId: 0, targetId: rightUnits[0]?.id, scale: 4 });
    events.push({ time: 9200, type: 'shake', intensity: 'normal' });
    events.push({ time: 9300, type: 'anim', unitId: rightUnits[0]?.id, anim: 'hurt' });
    events.push({ time: 9300, type: 'dmgPopup', targetId: rightUnits[0]?.id, text: '2847', crit: false });
    events.push({ time: 9800, type: 'anim', unitId: rightUnits[0]?.id, anim: 'idle' });
    events.push({ time: 9800, type: 'anim', unitId: leftUnits[0].id, anim: 'idle' });
  }

  events.push({ time: 10500, type: 'camera', zoom: 1.5, x: 0.8, y: 0.3, dur: 1200 });
  events.push({ time: 10500, type: 'dialogue', text: isSpace ? '"Target acquired."' : isBetta ? '"You dare challenge me?"' : '"Feel my wrath!"', size: 18, x: 0.8, y: 0.1, fade: 500, hold: 1500, color: '#ef4444' });
  if (rightUnits[0]) {
    events.push({ time: 11000, type: 'anim', unitId: rightUnits[0].id, anim: 'attack' });
    if (isSpace) {
      events.push({ time: 11100, type: 'projectile', from: rightUnits[0].id, to: leftUnits[0]?.id, speed: 500, vfx: 'plasma' });
    }
    events.push({ time: 11600, type: 'vfx', vfxId: 0, targetId: leftUnits[0]?.id, scale: 4 });
    events.push({ time: 11600, type: 'shake', intensity: 'heavy' });
    events.push({ time: 11600, type: 'flash', color: t.color, dur: 120 });
    events.push({ time: 11700, type: 'anim', unitId: leftUnits[0]?.id, anim: 'hurt' });
    events.push({ time: 11700, type: 'dmgPopup', targetId: leftUnits[0]?.id, text: 'CRITICAL 4521', crit: true });
    events.push({ time: 11700, type: 'actionText', text: 'CRITICAL HIT!', size: 32, x: 0.5, y: 0.2, fade: 300, hold: 800, color: '#ef4444' });
    events.push({ time: 12300, type: 'anim', unitId: leftUnits[0]?.id, anim: 'idle' });
    events.push({ time: 12300, type: 'anim', unitId: rightUnits[0].id, anim: 'idle' });
  }

  events.push({ time: 13000, type: 'camera', zoom: 0.85, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 13000, type: 'bg', bgIndex: 1 });
  events.push({ time: 13000, type: 'flash', color: '#fff', dur: 200 });
  events.push({ time: 13500, type: 'loreFlash', text: isSpace ? 'FLEET ENGAGEMENT' : isBetta ? 'UNDERWATER SIEGE' : 'THE WAR BEGINS', size: 64, y: 0.4, fade: 600, hold: 1500, color: t.color });

  const rapidStart = 15000;
  for (let i = 0; i < 6; i++) {
    const attacker = i % 2 === 0 ? leftUnits[i % leftUnits.length] : rightUnits[i % rightUnits.length];
    const target = i % 2 === 0 ? rightUnits[i % rightUnits.length] : leftUnits[i % leftUnits.length];
    if (!attacker || !target) continue;
    const t0 = rapidStart + i * 1200;
    events.push({ time: t0, type: 'anim', unitId: attacker.id, anim: 'attack' });
    if (isSpace) {
      events.push({ time: t0 + 100, type: 'projectile', from: attacker.id, to: target.id, speed: 500, vfx: i % 2 === 0 ? 'plasma' : 'bomb' });
    }
    events.push({ time: t0 + 500, type: 'vfx', vfxId: i % (t.vfx?.length || 1), targetId: target.id, scale: i === 4 ? 6 : 3.5 });
    events.push({ time: t0 + 500, type: 'shake', intensity: i === 4 ? 'heavy' : 'normal' });
    if (i === 4) events.push({ time: t0 + 500, type: 'flash', color: t.colorAlt, dur: 150 });
    events.push({ time: t0 + 550, type: 'anim', unitId: target.id, anim: 'hurt' });
    const dmg = Math.floor(1000 + Math.random() * 5000);
    events.push({ time: t0 + 550, type: 'dmgPopup', targetId: target.id, text: i === 4 ? `CRIT ${dmg}` : `${dmg}`, crit: i === 4 });
    if (i === 4) events.push({ time: t0 + 550, type: 'actionText', text: 'DEVASTATION', size: 36, x: 0.5, y: 0.15, fade: 300, hold: 1000, color: '#ef4444' });
    if (i >= 3) events.push({ time: t0 + 550, type: 'actionText', text: `COMBO x${i}`, size: 24, x: 0.5, y: 0.1, fade: 200, hold: 600, color: '#fbbf24' });
    events.push({ time: t0 + 900, type: 'anim', unitId: target.id, anim: 'idle' });
    events.push({ time: t0 + 900, type: 'anim', unitId: attacker.id, anim: 'idle' });
  }

  events.push({ time: 22500, type: 'camera', zoom: 1.8, x: 0.5, y: 0.4, dur: 1500 });
  events.push({ time: 22500, type: 'loreFlash', text: isSpace ? 'SHIELDS FAILING' : isBetta ? 'THE ABYSS STIRS' : 'DARKNESS RISES', size: 56, y: 0.3, fade: 500, hold: 1500, color: t.colorAlt });

  const multiStart = 23000;
  for (let wave = 0; wave < 3; wave++) {
    const wt = multiStart + wave * 2500;
    events.push({ time: wt, type: 'bg', bgIndex: (wave + 2) % t.bgs.length });
    events.push({ time: wt, type: 'flash', color: '#fff', dur: 100 });
    events.push({ time: wt, type: 'camera', zoom: wave === 2 ? 0.7 : 1.2 + wave * 0.3, x: 0.5, y: 0.5, dur: 2000 });

    leftUnits.forEach((u, i) => {
      events.push({ time: wt + 200 + i * 150, type: 'anim', unitId: u.id, anim: 'attack' });
    });
    rightUnits.forEach((u, i) => {
      events.push({ time: wt + 400 + i * 150, type: 'anim', unitId: u.id, anim: 'attack' });
    });

    for (let j = 0; j < 3; j++) {
      const vt = wt + 600 + j * 300;
      events.push({ time: vt, type: 'vfx', vfxId: j % (t.vfx?.length || 1), targetId: rightUnits[j % rightUnits.length]?.id, scale: 5 });
      events.push({ time: vt, type: 'shake', intensity: 'heavy' });
      events.push({ time: vt + 50, type: 'anim', unitId: rightUnits[j % rightUnits.length]?.id, anim: 'hurt' });
      events.push({ time: vt + 50, type: 'dmgPopup', targetId: rightUnits[j % rightUnits.length]?.id, text: `${Math.floor(3000 + Math.random() * 7000)}`, crit: j === 2 });
    }

    if (isSpace && wave < 2) {
      for (let p = 0; p < 4; p++) {
        events.push({ time: wt + 300 + p * 200, type: 'projectile', from: leftUnits[p % leftUnits.length]?.id, to: rightUnits[p % rightUnits.length]?.id, speed: 400 + p * 100, vfx: 'plasma' });
      }
    }

    events.push({ time: wt + 1500, type: 'flash', color: wave === 2 ? t.colorAlt : t.color, dur: 200 });

    [...leftUnits, ...rightUnits].forEach(u => {
      events.push({ time: wt + 1800, type: 'anim', unitId: u.id, anim: 'idle' });
    });
  }

  const deathStart = 31000;
  events.push({ time: deathStart, type: 'camera', zoom: 1.6, x: 0.75, y: 0.3, dur: 1500 });
  events.push({ time: deathStart, type: 'dialogue', text: isSpace ? '"This ends now."' : isBetta ? '"Return to the deep!"' : '"Fall before me!"', size: 22, x: 0.2, y: 0.1, fade: 500, hold: 1500, color: '#fbbf24' });
  if (rightUnits[0]) {
    events.push({ time: deathStart + 500, type: 'anim', unitId: leftUnits[0]?.id, anim: 'attack' });
    events.push({ time: deathStart + 1000, type: 'vfx', vfxId: 0, targetId: rightUnits[0].id, scale: 6 });
    events.push({ time: deathStart + 1000, type: 'shake', intensity: 'heavy' });
    events.push({ time: deathStart + 1000, type: 'flash', color: '#fff', dur: 300 });
    events.push({ time: deathStart + 1100, type: 'anim', unitId: rightUnits[0].id, anim: 'death' });
    events.push({ time: deathStart + 1100, type: 'dmgPopup', targetId: rightUnits[0].id, text: 'OBLITERATED', crit: true });
    events.push({ time: deathStart + 1100, type: 'actionText', text: 'OBLITERATED', size: 48, x: 0.5, y: 0.2, fade: 400, hold: 1200, color: '#ef4444' });
  }

  events.push({ time: 33500, type: 'camera', zoom: 0.7, x: 0.5, y: 0.5, dur: 2000 });
  events.push({ time: 33500, type: 'bg', bgIndex: 0 });
  events.push({ time: 33500, type: 'loreFlash', text: isSpace ? 'ALL SYSTEMS CRITICAL' : isBetta ? 'TIDAL FURY' : 'UNLEASH THE STORM', size: 56, y: 0.35, fade: 500, hold: 1500, color: t.color });

  const climaxStart = 35000;
  for (let i = 0; i < 8; i++) {
    const ct = climaxStart + i * 800;
    const a = i % 2 === 0 ? leftUnits[i % leftUnits.length] : rightUnits[(i + 1) % rightUnits.length];
    const d = i % 2 === 0 ? rightUnits[i % rightUnits.length] : leftUnits[(i + 1) % leftUnits.length];
    if (!a || !d) continue;
    events.push({ time: ct, type: 'anim', unitId: a.id, anim: 'attack' });
    if (isSpace) events.push({ time: ct + 80, type: 'projectile', from: a.id, to: d.id, speed: 700, vfx: 'plasma' });
    events.push({ time: ct + 350, type: 'vfx', vfxId: i % (t.vfx?.length || 1), targetId: d.id, scale: 4 + (i > 5 ? 3 : 0) });
    events.push({ time: ct + 350, type: 'shake', intensity: i > 5 ? 'heavy' : 'normal' });
    if (i > 5) events.push({ time: ct + 350, type: 'flash', color: t.colorAlt, dur: 100 });
    events.push({ time: ct + 400, type: 'anim', unitId: d.id, anim: 'hurt' });
    events.push({ time: ct + 400, type: 'dmgPopup', targetId: d.id, text: `${Math.floor(2000 + Math.random() * 8000)}`, crit: i > 5 });
    if (i > 5) events.push({ time: ct + 400, type: 'actionText', text: `COMBO x${i}`, size: 28, x: 0.5, y: 0.12, fade: 200, hold: 500, color: '#fbbf24' });
    events.push({ time: ct + 650, type: 'anim', unitId: a.id, anim: 'idle' });
    events.push({ time: ct + 650, type: 'anim', unitId: d.id, anim: 'idle' });
  }

  const bossStart = 42000;
  const bossUnit = rightUnits[rightUnits.length - 1];
  events.push({ time: bossStart, type: 'camera', zoom: 2.0, x: 0.8, y: 0.35, dur: 1500 });
  events.push({ time: bossStart, type: 'loreFlash', text: isSpace ? 'FLAGSHIP DETECTED' : isBetta ? 'LEVIATHAN RISES' : 'BOSS ENCOUNTER', size: 56, y: 0.35, fade: 500, hold: 1500, color: '#ef4444' });
  events.push({ time: bossStart + 500, type: 'shake', intensity: 'heavy' });
  events.push({ time: bossStart + 500, type: 'flash', color: '#ef4444', dur: 200 });
  events.push({ time: bossStart + 800, type: 'dialogue', text: isSpace ? '"Prepare for annihilation."' : isBetta ? '"I am the deep."' : '"You will kneel."', size: 20, x: 0.8, y: 0.1, fade: 500, hold: 1800, color: '#ef4444' });

  if (bossUnit) {
    events.push({ time: bossStart + 1500, type: 'camera', zoom: 1.0, x: 0.5, y: 0.5, dur: 2000 });
    events.push({ time: bossStart + 2000, type: 'anim', unitId: bossUnit.id, anim: 'attack' });
    leftUnits.forEach((u, i) => {
      events.push({ time: bossStart + 2600 + i * 200, type: 'vfx', vfxId: 0, targetId: u.id, scale: 5 });
      events.push({ time: bossStart + 2650 + i * 200, type: 'anim', unitId: u.id, anim: 'hurt' });
      events.push({ time: bossStart + 2650 + i * 200, type: 'dmgPopup', targetId: u.id, text: `${Math.floor(5000 + Math.random() * 5000)}`, crit: true });
    });
    events.push({ time: bossStart + 3200, type: 'shake', intensity: 'heavy' });
    events.push({ time: bossStart + 3200, type: 'flash', color: '#ef4444', dur: 300 });
    events.push({ time: bossStart + 3200, type: 'actionText', text: 'DEVASTATION', size: 40, x: 0.5, y: 0.15, fade: 300, hold: 1000, color: '#ef4444' });

    leftUnits.forEach(u => {
      events.push({ time: bossStart + 3800, type: 'anim', unitId: u.id, anim: 'idle' });
    });
    events.push({ time: bossStart + 3800, type: 'anim', unitId: bossUnit.id, anim: 'idle' });
    events.push({ time: bossStart + 4000, type: 'dialogue', text: isSpace ? '"All units, focus fire!"' : isBetta ? '"Together, warriors!"' : '"Now! Strike together!"', size: 18, x: 0.2, y: 0.1, fade: 400, hold: 1500, color: '#fbbf24' });

    events.push({ time: bossStart + 4500, type: 'camera', zoom: 1.6, x: 0.3, y: 0.4, dur: 1500 });
    leftUnits.forEach((u, i) => {
      events.push({ time: bossStart + 5000 + i * 300, type: 'anim', unitId: u.id, anim: 'attack' });
      if (isSpace) events.push({ time: bossStart + 5100 + i * 300, type: 'projectile', from: u.id, to: bossUnit.id, speed: 600, vfx: 'plasma' });
    });
    for (let i = 0; i < 4; i++) {
      events.push({ time: bossStart + 5500 + i * 200, type: 'vfx', vfxId: i % (t.vfx?.length || 1), targetId: bossUnit.id, scale: 6 });
      events.push({ time: bossStart + 5500 + i * 200, type: 'shake', intensity: 'heavy' });
    }
    events.push({ time: bossStart + 6300, type: 'flash', color: '#fff', dur: 500 });
    events.push({ time: bossStart + 6400, type: 'anim', unitId: bossUnit.id, anim: 'death' });
    events.push({ time: bossStart + 6400, type: 'dmgPopup', targetId: bossUnit.id, text: 'DEFEATED', crit: true });
    events.push({ time: bossStart + 6400, type: 'actionText', text: 'DEFEATED', size: 56, x: 0.5, y: 0.2, fade: 500, hold: 2000, color: '#fbbf24' });
    events.push({ time: bossStart + 6400, type: 'camera', zoom: 0.8, x: 0.5, y: 0.5, dur: 3000 });
  }

  const outroStart = 50000;
  leftUnits.forEach(u => {
    events.push({ time: outroStart, type: 'anim', unitId: u.id, anim: 'idle' });
  });
  events.push({ time: outroStart + 500, type: 'camera', zoom: 1.3, x: 0.3, y: 0.5, dur: 4000 });
  events.push({ time: outroStart + 1000, type: 'loreFlash', text: 'VICTORY', size: 72, y: 0.35, fade: 1000, hold: 3000, color: '#fbbf24' });
  events.push({ time: outroStart + 2000, type: 'text', text: isSpace ? 'grudgewarlords.com' : isBetta ? 'PLAY NOW' : 'grudgewarlords.com', size: 16, y: 0.55, fade: 800, hold: 3000, color: '#94a3b8' });

  events.push({ time: 56000, type: 'text', text: 'GRUDGE STUDIOS', size: 20, y: 0.45, fade: 1000, hold: 3000, color: '#fbbf24', font: 'Cinzel' });
  events.push({ time: 56500, type: 'text', text: t.title, size: 36, y: 0.55, fade: 1000, hold: 3000, color: '#fff', font: 'Cinzel' });
  events.push({ time: 57000, type: 'camera', zoom: 1.1, x: 0.5, y: 0.5, dur: 3000 });

  return events.sort((a, b) => a.time - b.time);
}

export function CinematicCanvas({ trailerKey, playing, onEnd }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const trailer = TRAILERS[trailerKey];
    if (!trailer) return;

    const events = buildChoreography(trailer);
    let cancelled = false;

    const state = {
      units: {},
      boxFighters: {},
      roUnits: {},
      camera: { zoom: 1, x: 0.5, y: 0.5, targetZoom: 1, targetX: 0.5, targetY: 0.5, dur: 1000, startTime: 0 },
      texts: [],
      vfxActive: [],
      projectiles: [],
      roProjectiles: [],
      dmgPopups: [],
      shake: null,
      flash: null,
      bgIndex: 0,
      bgImgs: [],
      unitImgs: {},
      vfxImgs: {},
      shotImgs: {},
      boxImgs: {},
      roImgs: {},
      particles: [],
      eventIdx: 0,
    };
    stateRef.current = state;

    async function loadAssets() {
      const bgPromises = trailer.bgs.map(src => loadImg(src));
      state.bgImgs = await Promise.all(bgPromises);

      for (const unit of trailer.units) {
        const base = `/sprites/${unit.folder}`;
        const [idle, attack, hurt, death, walk] = await Promise.all([
          loadImg(`${base}/${unit.idle}`),
          loadImg(`${base}/${unit.attack}`),
          loadImg(`${base}/${unit.hurt}`),
          loadImg(`${base}/${unit.death}`),
          loadImg(`${base}/${unit.walk}`),
        ]);
        const col = getUnitColor(unit.id);
        state.unitImgs[unit.id] = {
          idle: idle || generatePlaceholderSheet(unit.fw, unit.fh, unit.idleF, col, 'idle'),
          attack: attack || generatePlaceholderSheet(unit.fw, unit.fh, unit.atkF, col, 'attack'),
          hurt: hurt || generatePlaceholderSheet(unit.fw, unit.fh, unit.hurtF, col, 'hurt'),
          death: death || generatePlaceholderSheet(unit.fw, unit.fh, unit.deathF, col, 'death'),
          walk: walk || generatePlaceholderSheet(unit.fw, unit.fh, unit.walkF, col, 'walk'),
        };
      }

      if (trailer.vfx) {
        for (const v of trailer.vfx) {
          const img = await loadImg(v.src);
          state.vfxImgs[v.id] = img || generateVfxSheet(v.fw, v.fh, v.frames, trailer.color);
        }
      }
      if (trailer.shots) {
        for (const s of trailer.shots) {
          const img = await loadImg(s.src);
          state.shotImgs[s.id] = img || generateSimpleSheet(s.fw, s.fh, s.frames, trailer.colorAlt || '#fbbf24');
        }
      }

      if (trailer.isBoxing && trailer.fighters) {
        for (const fighter of trailer.fighters) {
          const sheet = await loadImg(getFighterSheetPath(fighter.fighterId));
          state.boxImgs[fighter.id] = { sheet, team: fighter.team, fighterId: fighter.fighterId };
        }
      }

      if (trailer.isRogueOps) {
        const roColors = ['#22c55e', '#34d399', '#10b981'];
        const heroVariants = {};
        for (let v = 1; v <= 3; v++) {
          const w = await loadImg(`/sprites/rogue-ops/character/Walk${v}.png`);
          const d = await loadImg(`/sprites/rogue-ops/character/Death${v}.png`);
          heroVariants[v] = {
            walk: w || generatePlaceholderSheet(64, 64, 8, roColors[v - 1], 'walk'),
            death: d || generatePlaceholderSheet(64, 64, 6, roColors[v - 1], 'hurt'),
          };
        }
        state.roImgs.hero = heroVariants;

        const enemyColors = ['#ef4444', '#f97316', '#dc2626', '#b91c1c', '#c2410c', '#991b1b'];
        const enemyVariants = {};
        for (let v = 1; v <= 6; v++) {
          const w = await loadImg(`/sprites/rogue-ops/enemies/${v}/RunSD.png`);
          const d = await loadImg(`/sprites/rogue-ops/enemies/${v}/DeathSD.png`);
          enemyVariants[v] = {
            walk: w || generatePlaceholderSheet(48, 48, 8, enemyColors[v - 1], 'walk'),
            death: d || generatePlaceholderSheet(48, 48, 6, enemyColors[v - 1], 'hurt'),
          };
        }
        state.roImgs.enemies = enemyVariants;

        const weaponImgs = [];
        for (let w = 1; w <= 7; w++) {
          const img = await loadImg(`/sprites/rogue-ops/weapons/${w}.png`);
          weaponImgs.push(img || generateSimpleSheet(32, 32, 1, '#c0c0c0'));
        }
        state.roImgs.weapons = weaponImgs;

        const projImgs = [];
        for (let p = 1; p <= 22; p++) {
          const img = await loadImg(`/sprites/rogue-ops/projectiles/${p}.png`);
          projImgs.push(img || generateSimpleSheet(16, 16, 1, '#fbbf24'));
        }
        state.roImgs.projectiles = projImgs;

        const boomImg = await loadImg('/sprites/rogue-ops/enemies/Boom1.png');
        state.roImgs.boom = boomImg || generateVfxSheet(48, 48, 6, '#ef4444');

        state.roImgs.hitEffects = [];
        for (let h = 1; h <= 3; h++) {
          const img = await loadImg(`/sprites/rogue-ops/effects/${h}_1.png`);
          state.roImgs.hitEffects.push(img || generateVfxSheet(192, 96, 3, '#22c55e'));
        }
      }

      if (!cancelled) {
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function processEvent(evt, now) {
      switch (evt.type) {
        case 'bg':
          state.bgIndex = evt.bgIndex;
          break;
        case 'camera':
          state.camera.targetZoom = evt.zoom;
          state.camera.targetX = evt.x;
          state.camera.targetY = evt.y;
          state.camera.dur = evt.dur;
          state.camera.startTime = now;
          state.camera.startZoom = state.camera.zoom;
          state.camera.startCX = state.camera.x;
          state.camera.startCY = state.camera.y;
          break;
        case 'spawn': {
          const unitDef = trailer.units.find(u => u.id === evt.unitId);
          if (unitDef) {
            state.units[evt.unitId] = { ...unitDef, x: evt.x, y: evt.y, anim: 'idle', frame: 0, frameTimer: 0, alive: true, moveTarget: null, opacity: 1 };
          }
          break;
        }
        case 'move': {
          const u = state.units[evt.unitId];
          if (u) {
            u.moveTarget = { x: evt.toX, y: evt.toY, dur: evt.dur, start: now, sx: u.x, sy: u.y };
            if (evt.anim) { u.anim = evt.anim; u.frame = 0; }
          }
          break;
        }
        case 'anim': {
          const u = state.units[evt.unitId];
          if (u) { u.anim = evt.anim; u.frame = 0; u.frameTimer = now; }
          break;
        }
        case 'vfx': {
          const target = state.units[evt.targetId] || state.boxFighters[evt.targetId] || state.roUnits[evt.targetId];
          if (target && trailer.vfx && trailer.vfx[evt.vfxId]) {
            state.vfxActive.push({ vfx: trailer.vfx[evt.vfxId], x: target.x, y: target.y, scale: evt.scale || 4, frame: 0, start: now });
          }
          break;
        }
        case 'projectile': {
          const from = state.units[evt.from];
          const to = state.units[evt.to];
          if (from && to) {
            state.projectiles.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, speed: evt.speed, start: now, vfx: evt.vfx, x: from.x, y: from.y });
          }
          break;
        }
        case 'text':
          state.texts.push({ ...evt, start: now });
          break;
        case 'loreFlash':
          state.texts.push({ ...evt, type: 'loreFlash', start: now });
          break;
        case 'dialogue':
          state.texts.push({ ...evt, type: 'dialogue', start: now });
          break;
        case 'actionText':
          state.texts.push({ ...evt, type: 'actionText', start: now });
          break;
        case 'shake':
          state.shake = { start: now, intensity: evt.intensity, dur: evt.intensity === 'heavy' ? 400 : 250 };
          break;
        case 'flash':
          state.flash = { color: evt.color, start: now, dur: evt.dur };
          break;
        case 'dmgPopup': {
          const target = state.units[evt.targetId] || state.boxFighters[evt.targetId] || state.roUnits[evt.targetId];
          if (target) {
            state.dmgPopups.push({ text: evt.text, x: target.x, y: target.y - 0.05, crit: evt.crit, start: now });
          }
          break;
        }
        case 'boxSpawn': {
          const fighterDef = trailer.fighters?.find(f => f.id === evt.fighterId);
          if (fighterDef) {
            state.boxFighters[evt.fighterId] = { ...fighterDef, x: evt.x, y: evt.y, anim: 'idle', frame: 0, frameTimer: now, alive: true, moveTarget: null, opacity: 1, ...(evt.faceOverride ? { team: evt.faceOverride } : {}) };
          }
          break;
        }
        case 'boxDespawn':
          delete state.boxFighters[evt.fighterId];
          break;
        case 'boxMove': {
          const bf = state.boxFighters[evt.fighterId];
          if (bf) {
            bf.moveTarget = { x: evt.toX, y: evt.toY, dur: evt.dur, start: now, sx: bf.x, sy: bf.y };
            if (evt.anim) { bf.anim = evt.anim; bf.frame = 0; bf.frameTimer = now; }
          }
          break;
        }
        case 'boxAnim': {
          const bf = state.boxFighters[evt.fighterId];
          if (bf) { bf.anim = evt.anim; bf.frame = 0; bf.frameTimer = now; }
          break;
        }
        case 'roSpawn': {
          state.roUnits[evt.unitId] = {
            id: evt.unitId, variant: evt.variant, x: evt.x, y: evt.y,
            anim: 'idle', frame: 0, frameTimer: now, alive: true,
            moveTarget: null, opacity: 1, isEnemy: !!evt.isEnemy, isBoss: !!evt.isBoss,
            weaponIdx: 0, scale: evt.isBoss ? 2.5 : (evt.isEnemy ? 2 : 2.5),
          };
          break;
        }
        case 'roMove': {
          const ru = state.roUnits[evt.unitId];
          if (ru) {
            ru.moveTarget = { x: evt.toX, y: evt.toY, dur: evt.dur, start: now, sx: ru.x, sy: ru.y };
            if (evt.anim) { ru.anim = evt.anim; ru.frame = 0; ru.frameTimer = now; }
          }
          break;
        }
        case 'roAnim': {
          const ru = state.roUnits[evt.unitId];
          if (ru) { ru.anim = evt.anim; ru.frame = 0; ru.frameTimer = now; }
          break;
        }
        case 'roTeleport': {
          const ru = state.roUnits[evt.unitId];
          if (ru) { ru.x = evt.x; ru.y = evt.y; }
          break;
        }
        case 'roEquipWeapon': {
          const ru = state.roUnits[evt.unitId];
          if (ru) { ru.weaponIdx = evt.weaponIdx; }
          break;
        }
        case 'roShoot': {
          const from = state.roUnits[evt.from];
          const to = state.roUnits[evt.to];
          if (from && to) {
            const projIdx = Math.floor(Math.random() * 22);
            state.roProjectiles.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y, speed: 800, start: now, projIdx, x: from.x, y: from.y });
          }
          break;
        }
        case 'roHit': {
          const ru = state.roUnits[evt.targetId];
          if (ru) {
            state.vfxActive.push({
              vfx: { id: 'roHit', fw: 192, fh: 96, frames: 3 },
              x: ru.x, y: ru.y, scale: 1.5, frame: 0, start: now, isRoHit: true,
            });
          }
          break;
        }
        case 'roDeath': {
          const ru = state.roUnits[evt.unitId];
          if (ru) {
            ru.anim = 'death';
            ru.frame = 0;
            ru.frameTimer = now;
            state.vfxActive.push({
              vfx: { id: 'roBoom', fw: 48, fh: 48, frames: 6 },
              x: ru.x, y: ru.y, scale: 2, frame: 0, start: now, isRoBoom: true,
            });
          }
          break;
        }
      }
    }

    function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function tick(timestamp) {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const now = timestamp - startTimeRef.current;

      while (state.eventIdx < events.length && events[state.eventIdx].time <= now) {
        processEvent(events[state.eventIdx], now);
        state.eventIdx++;
      }

      const cam = state.camera;
      if (cam.dur > 0) {
        const p = Math.min(1, (now - cam.startTime) / cam.dur);
        const ep = easeInOut(p);
        cam.zoom = (cam.startZoom || 1) + ((cam.targetZoom || 1) - (cam.startZoom || 1)) * ep;
        cam.x = (cam.startCX || 0.5) + ((cam.targetX || 0.5) - (cam.startCX || 0.5)) * ep;
        cam.y = (cam.startCY || 0.5) + ((cam.targetY || 0.5) - (cam.startCY || 0.5)) * ep;
      }

      Object.values(state.units).forEach(u => {
        if (u.moveTarget) {
          const mt = u.moveTarget;
          const p = Math.min(1, (now - mt.start) / mt.dur);
          u.x = mt.sx + (mt.x - mt.sx) * easeInOut(p);
          u.y = mt.sy + (mt.y - mt.sy) * easeInOut(p);
          if (p >= 1) u.moveTarget = null;
        }
        const elapsed = now - (u.frameTimer || 0);
        const animKey = u.anim || 'idle';
        let frameCount = u.idleF;
        if (animKey === 'attack') frameCount = u.atkF;
        else if (animKey === 'hurt') frameCount = u.hurtF;
        else if (animKey === 'death') frameCount = u.deathF;
        else if (animKey === 'walk') frameCount = u.walkF;
        const frameIdx = Math.floor(elapsed / (FRAME_MS * 2)) % Math.max(1, frameCount);
        u.frame = frameIdx;
        if (animKey === 'death' && frameIdx >= frameCount - 1) {
          u.opacity = Math.max(0, u.opacity - 0.02);
        }
      });

      Object.values(state.boxFighters).forEach(bf => {
        if (bf.moveTarget) {
          const mt = bf.moveTarget;
          const p = Math.min(1, (now - mt.start) / mt.dur);
          bf.x = mt.sx + (mt.x - mt.sx) * easeInOut(p);
          bf.y = mt.sy + (mt.y - mt.sy) * easeInOut(p);
          if (p >= 1) bf.moveTarget = null;
        }
        const elapsed = now - (bf.frameTimer || 0);
        const anim = BOXING_ANIMS[bf.anim] || BOXING_ANIMS.idle;
        const fc = anim.frames.length;
        const spd = anim.speed || 100;
        const frameIdx = anim.loop
          ? Math.floor(elapsed / spd) % fc
          : Math.min(Math.floor(elapsed / spd), fc - 1);
        bf.frame = frameIdx;
        if ((bf.anim === 'ko' || bf.anim === 'death') && frameIdx >= fc - 1) {
          bf.opacity = Math.max(0, bf.opacity - 0.02);
        }
      });

      Object.values(state.roUnits).forEach(ru => {
        if (ru.moveTarget) {
          const mt = ru.moveTarget;
          const p = Math.min(1, (now - mt.start) / mt.dur);
          ru.x = mt.sx + (mt.x - mt.sx) * easeInOut(p);
          ru.y = mt.sy + (mt.y - mt.sy) * easeInOut(p);
          if (p >= 1) { ru.moveTarget = null; ru.anim = 'idle'; }
        }
        const elapsed = now - (ru.frameTimer || 0);
        const isWalk = ru.anim === 'walk';
        const isDeath = ru.anim === 'death';
        const fw = ru.isEnemy ? 48 : 48;
        const frameCount = isDeath ? 4 : (isWalk ? (ru.isEnemy ? 6 : 4) : (ru.isEnemy ? 6 : 4));
        const frameIdx = Math.floor(elapsed / (FRAME_MS * 2)) % Math.max(1, frameCount);
        ru.frame = frameIdx;
        if (isDeath && frameIdx >= frameCount - 1) {
          ru.opacity = Math.max(0, ru.opacity - 0.03);
        }
      });

      state.projectiles = state.projectiles.filter(p => {
        const elapsed = now - p.start;
        const dx = p.tx - p.fx;
        const dy = p.ty - p.fy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const totalTime = (dist / p.speed) * 1000;
        const progress = Math.min(1, elapsed / totalTime);
        p.x = p.fx + dx * progress;
        p.y = p.fy + dy * progress;
        return progress < 1;
      });

      state.roProjectiles = state.roProjectiles.filter(p => {
        const elapsed = now - p.start;
        const dx = p.tx - p.fx;
        const dy = p.ty - p.fy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const totalTime = (dist / p.speed) * 1000;
        const progress = Math.min(1, elapsed / totalTime);
        p.x = p.fx + dx * progress;
        p.y = p.fy + dy * progress;
        return progress < 1;
      });

      state.vfxActive = state.vfxActive.filter(v => {
        const elapsed = now - v.start;
        v.frame = Math.floor(elapsed / (FRAME_MS * 2));
        return v.frame < v.vfx.frames;
      });

      state.dmgPopups = state.dmgPopups.filter(d => now - d.start < 1500);
      state.texts = state.texts.filter(t => now - t.start < (t.fade || 800) + (t.hold || 1500) + (t.fade || 800));

      let shakeX = 0, shakeY = 0;
      if (state.shake) {
        const sp = (now - state.shake.start) / state.shake.dur;
        if (sp < 1) {
          const mag = state.shake.intensity === 'heavy' ? 12 : 6;
          const decay = 1 - sp;
          shakeX = (Math.random() - 0.5) * mag * decay;
          shakeY = (Math.random() - 0.5) * mag * decay;
        } else {
          state.shake = null;
        }
      }

      ctx.save();
      ctx.clearRect(0, 0, TRAILER_W, TRAILER_H);

      const zScale = cam.zoom;
      const cx = cam.x * TRAILER_W;
      const cy = cam.y * TRAILER_H;
      ctx.translate(TRAILER_W / 2 + shakeX, TRAILER_H / 2 + shakeY);
      ctx.scale(zScale, zScale);
      ctx.translate(-cx, -cy);

      const bgImg = state.bgImgs[state.bgIndex];
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, TRAILER_W, TRAILER_H);
      } else {
        ctx.fillStyle = '#050a18';
        ctx.fillRect(0, 0, TRAILER_W, TRAILER_H);
      }

      const allUnits = Object.values(state.units).sort((a, b) => a.y - b.y);
      allUnits.forEach(u => {
        const imgs = state.unitImgs[u.id];
        if (!imgs) return;
        const animKey = u.anim || 'idle';
        const img = imgs[animKey] || imgs.idle;
        if (!img) return;

        const drawW = u.fw * u.scale;
        const drawH = u.fh * u.scale;
        const px = u.x * TRAILER_W - drawW / 2;
        const py = u.y * TRAILER_H - drawH / 2;

        ctx.save();
        ctx.globalAlpha = u.opacity ?? 1;

        const maxFrame = Math.max(0, Math.floor(img.naturalWidth / u.fw) - 1);
        const safeFrame = Math.min(u.frame, maxFrame);
        const sx = safeFrame * u.fw;

        if (u.team === 'right' && !u.isShip) {
          ctx.translate(px + drawW, py);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, 0, u.fw, u.fh, 0, 0, drawW, drawH);
        } else if (u.team === 'left' && u.isShip) {
          ctx.drawImage(img, sx, 0, u.fw, u.fh, px, py, drawW, drawH);
        } else if (u.team === 'right' && u.isShip) {
          ctx.translate(px + drawW, py);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, 0, u.fw, u.fh, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(img, sx, 0, u.fw, u.fh, px, py, drawW, drawH);
        }
        ctx.restore();
      });

      Object.values(state.boxFighters).forEach(bf => {
        const imgData = state.boxImgs[bf.id];
        if (!imgData || !imgData.sheet) return;
        const isRight = bf.team === 'right';
        const animTable = isRight ? BOXING_ANIMS_LEFT : BOXING_ANIMS;
        const anim = animTable[bf.anim] || animTable.idle;
        const safeFrame = Math.min(bf.frame, anim.frames.length - 1);
        const { col, row } = anim.frames[safeFrame];
        const bfDef = GKO_FIGHTERS.find(f => f.id === imgData.fighterId);
        const bfBlockOff = bfDef?.blockOffset || 0;
        const sx = (col + bfBlockOff) * BOX_FW;
        const sy = row * BOX_FH;

        const scale = 4.5;
        const drawW = BOX_FW * scale;
        const drawH = BOX_FH * scale;
        const cx = bf.x * TRAILER_W;
        const py = bf.y * TRAILER_H - drawH / 2;

        ctx.save();
        ctx.globalAlpha = bf.opacity ?? 1;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imgData.sheet, sx, sy, BOX_FW, BOX_FH, cx - drawW / 2, py, drawW, drawH);
        ctx.restore();
      });

      Object.values(state.roUnits).forEach(ru => {
        const isEnemy = ru.isEnemy;
        const variant = ru.variant;
        const isDeath = ru.anim === 'death';
        const isWalk = ru.anim === 'walk';

        let img = null;
        const fw = 48;
        const fh = 48;

        if (isEnemy) {
          const vImgs = state.roImgs.enemies?.[variant];
          if (vImgs) {
            img = isDeath ? vImgs.death : vImgs.walk;
          }
        } else {
          const vImgs = state.roImgs.hero?.[variant];
          if (vImgs) {
            img = isDeath ? vImgs.death : vImgs.walk;
          }
        }

        if (!img) return;

        const scale = ru.scale || 2;
        const drawW = fw * scale;
        const drawH = fh * scale;
        const px = ru.x * TRAILER_W - drawW / 2;
        const py = ru.y * TRAILER_H - drawH / 2;

        ctx.save();
        ctx.globalAlpha = ru.opacity ?? 1;

        const frameCount = isDeath ? 4 : (isEnemy ? 6 : 4);
        const maxFrame = Math.max(0, frameCount - 1);
        const safeFrame = Math.min(ru.frame, maxFrame);
        const sx = safeFrame * fw;

        if (isEnemy) {
          ctx.translate(px + drawW, py);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, 0, fw, fh, 0, 0, drawW, drawH);
        } else {
          ctx.drawImage(img, sx, 0, fw, fh, px, py, drawW, drawH);
        }

        if (!isEnemy && !isDeath && state.roImgs.weapons && state.roImgs.weapons[ru.weaponIdx]) {
          const wImg = state.roImgs.weapons[ru.weaponIdx];
          const ww = 48 * scale * 0.6;
          const wh = 48 * scale * 0.6;
          ctx.drawImage(wImg, 0, 0, 48, 48, px + drawW * 0.6, py + drawH * 0.2, ww, wh);
        }

        ctx.restore();
      });

      state.roProjectiles.forEach(p => {
        const px = p.x * TRAILER_W;
        const py = p.y * TRAILER_H;
        const projImg = state.roImgs.projectiles?.[p.projIdx];
        ctx.save();
        if (projImg) {
          ctx.drawImage(projImg, px - 8, py - 8, 16, 16);
        } else {
          ctx.beginPath();
          ctx.fillStyle = '#fbbf24';
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      state.projectiles.forEach(p => {
        const px = p.x * TRAILER_W;
        const py = p.y * TRAILER_H;
        ctx.save();
        ctx.beginPath();
        const grad = ctx.createRadialGradient(px, py, 2, px, py, 16);
        grad.addColorStop(0, 'rgba(6, 182, 212, 1)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad;
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      state.vfxActive.forEach(v => {
        if (v.isRoHit) {
          const hitImgs = state.roImgs.hitEffects || [];
          const hitImg = hitImgs[v.frame % hitImgs.length];
          if (hitImg) {
            const elapsed = now - v.start;
            const fi = Math.min(Math.floor(elapsed / (FRAME_MS * 2)), 5);
            const sx = fi * 96;
            const sz = 96 * (v.scale || 1.5);
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - elapsed / 500);
            ctx.drawImage(hitImg, sx, 0, 96, 96, v.x * TRAILER_W - sz / 2, v.y * TRAILER_H - sz / 2, sz, sz);
            ctx.restore();
          }
          return;
        }
        if (v.isRoBoom) {
          const boomImg = state.roImgs.boom;
          if (!boomImg) return;
          const vw = v.vfx.fw * v.scale;
          const vh = v.vfx.fh * v.scale;
          const px = v.x * TRAILER_W - vw / 2;
          const py = v.y * TRAILER_H - vh / 2;
          const maxF = Math.max(0, Math.floor(boomImg.naturalWidth / v.vfx.fw) - 1);
          const sf = Math.min(v.frame, maxF);
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(boomImg, sf * v.vfx.fw, 0, v.vfx.fw, v.vfx.fh, px, py, vw, vh);
          ctx.restore();
          return;
        }
        const img = state.vfxImgs[v.vfx.id];
        if (!img) return;
        const vw = v.vfx.fw * v.scale;
        const vh = v.vfx.fh * v.scale;
        const px = v.x * TRAILER_W - vw / 2;
        const py = v.y * TRAILER_H - vh / 2;
        const maxF = Math.max(0, Math.floor(img.naturalWidth / v.vfx.fw) - 1);
        const sf = Math.min(v.frame, maxF);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(img, sf * v.vfx.fw, 0, v.vfx.fw, v.vfx.fh, px, py, vw, vh);
        ctx.restore();
      });

      state.dmgPopups.forEach(d => {
        const elapsed = now - d.start;
        const rise = elapsed / 1500;
        const alpha = Math.max(0, 1 - rise * 1.2);
        const px = d.x * TRAILER_W;
        const py = (d.y - rise * 0.08) * TRAILER_H;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = d.crit ? 'bold 24px Cinzel, serif' : 'bold 16px Jost, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(d.text, px, py);
        ctx.fillStyle = d.crit ? '#fbbf24' : '#fff';
        ctx.fillText(d.text, px, py);
        ctx.restore();
      });

      ctx.restore();

      state.texts.forEach(t => {
        const elapsed = now - t.start;
        const fadeIn = t.fade || 800;
        const hold = t.hold || 1500;
        const fadeOut = t.fade || 800;
        let alpha;
        if (elapsed < fadeIn) alpha = elapsed / fadeIn;
        else if (elapsed < fadeIn + hold) alpha = 1;
        else alpha = Math.max(0, 1 - (elapsed - fadeIn - hold) / fadeOut);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (t.type === 'loreFlash') {
          ctx.font = `bold ${t.size || 64}px ${t.font || 'Cinzel'}, serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = t.color || '#fff';
          ctx.shadowBlur = 40;
          ctx.fillStyle = t.color || '#fff';
          ctx.fillText(t.text, TRAILER_W / 2, (t.y || 0.45) * TRAILER_H);
          ctx.shadowBlur = 60;
          ctx.fillText(t.text, TRAILER_W / 2, (t.y || 0.45) * TRAILER_H);
          ctx.shadowBlur = 0;
        } else if (t.type === 'dialogue') {
          ctx.font = `italic ${t.size || 18}px ${t.font || 'Jost'}, sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 15;
          ctx.fillStyle = t.color || '#fbbf24';
          const dx = (t.x || 0.5) * TRAILER_W;
          const dy = (t.y || 0.5) * TRAILER_H;
          ctx.fillText(t.text, dx, dy);
          ctx.shadowBlur = 0;
        } else if (t.type === 'actionText') {
          const scale = 1 + Math.sin(elapsed * 0.01) * 0.05;
          ctx.font = `bold ${Math.round((t.size || 28) * scale)}px ${t.font || 'Cinzel'}, serif`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = 'rgba(0,0,0,0.9)';
          ctx.lineWidth = 4;
          const ax = (t.x || 0.5) * TRAILER_W;
          const ay = (t.y || 0.2) * TRAILER_H;
          ctx.strokeText(t.text, ax, ay);
          ctx.fillStyle = t.color || '#fbbf24';
          ctx.shadowColor = t.color || '#fbbf24';
          ctx.shadowBlur = 20;
          ctx.fillText(t.text, ax, ay);
          ctx.shadowBlur = 0;
        } else {
          ctx.font = `bold ${t.size}px ${t.font || 'Jost'}, serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = t.color || '#fff';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 20;
          ctx.fillText(t.text, TRAILER_W / 2, t.y * TRAILER_H);
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      if (state.flash) {
        const fp = (now - state.flash.start) / state.flash.dur;
        if (fp < 1) {
          ctx.save();
          ctx.globalAlpha = (1 - fp) * 0.6;
          ctx.fillStyle = state.flash.color;
          ctx.fillRect(0, 0, TRAILER_W, TRAILER_H);
          ctx.restore();
        } else {
          state.flash = null;
        }
      }

      if (now < trailer.duration) {
        const progressPct = (now / trailer.duration) * 100;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, TRAILER_H - 3, TRAILER_W * progressPct / 100, 3);
        ctx.restore();

        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (onEnd) onEnd();
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trailerKey, playing, onEnd]);

  return (
    <canvas
      ref={canvasRef}
      width={TRAILER_W}
      height={TRAILER_H}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        borderRadius: '12px',
        background: '#050a18',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export default function CinematicTrailer() {
  const [activeTrailer, setActiveTrailer] = useState('fantasy');
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  const handlePlay = useCallback((key) => {
    setActiveTrailer(key);
    setPlaying(false);
    setEnded(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPlaying(true);
      });
    });
  }, []);

  const handleEnd = useCallback(() => {
    setEnded(true);
    setPlaying(false);
  }, []);

  const trailerOptions = [
    { key: 'fantasy', label: 'Shadow Knights', color: '#a855f7', icon: '\u2694' },
    { key: 'space', label: 'Starbound Corsairs', color: '#06b6d4', icon: '\uD83D\uDE80' },
    { key: 'underwater', label: 'Betta Warlords', color: '#22d3ee', icon: '\uD83C\uDF0A' },
    { key: 'boxing', label: 'G.K.O. Boxing', color: '#ef4444', icon: '\uD83E\uDD4A' },
    { key: 'rogueops', label: 'Rogue Ops', color: '#22c55e', icon: '\uD83D\uDD2B' },
  ];

  return (
    <section style={{
      padding: '60px 24px',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      <style>{`
        @keyframes trailerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.1), 0 20px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 40px rgba(251,191,36,0.2), 0 20px 60px rgba(0,0,0,0.5); }
        }
        @keyframes trailerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: '4px', color: '#fbbf24', marginBottom: '8px',
        }}>
          Cinematic Previews
        </div>
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(24px, 4vw, 38px)',
          color: '#e2e8f0',
          margin: 0,
          marginBottom: '8px',
        }}>
          Battle Trailers
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
          Real sprite animations. Real combat effects. Pure engine power.
        </p>
      </div>

      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        marginBottom: '24px', flexWrap: 'wrap',
      }}>
        {trailerOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => handlePlay(opt.key)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: `2px solid ${activeTrailer === opt.key && playing ? opt.color : 'rgba(255,255,255,0.1)'}`,
              background: activeTrailer === opt.key && playing ? `${opt.color}15` : 'rgba(15,15,25,0.8)',
              color: activeTrailer === opt.key && playing ? opt.color : '#94a3b8',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontFamily: "'Cinzel', serif",
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ marginRight: '8px' }}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${TRAILER_W}/${TRAILER_H}`,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(251,191,36,0.15)',
        animation: playing ? 'trailerGlow 3s ease-in-out infinite' : 'none',
        background: '#050a18',
      }}>
        {playing ? (
          <CinematicCanvas
            trailerKey={activeTrailer}
            playing={playing}
            onEnd={handleEnd}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, rgba(5,10,24,0.95), rgba(5,10,24,0.8))`,
            cursor: 'pointer',
          }}
            onClick={() => handlePlay(activeTrailer)}
          >
            {ended ? (
              <>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '28px',
                  color: '#fbbf24',
                  marginBottom: '12px',
                }}>
                  {TRAILERS[activeTrailer]?.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  marginBottom: '24px',
                }}>
                  Trailer complete
                </div>
              </>
            ) : null}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(251,191,36,0.15)',
              border: '2px solid rgba(251,191,36,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'trailerPulse 2s ease-in-out infinite',
            }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: '24px solid #fbbf24',
                borderTop: '14px solid transparent',
                borderBottom: '14px solid transparent',
                marginLeft: '6px',
              }} />
            </div>
            <div style={{
              marginTop: '16px',
              fontSize: '13px',
              color: '#64748b',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              {ended ? 'Replay' : 'Play Trailer'}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
