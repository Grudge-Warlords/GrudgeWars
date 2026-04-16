import React, { useEffect, useRef, useState, useCallback } from 'react';
import { preloadAllEffects, spawnEffect, spawnRandomEffect, spawnRandomHitFx, updateSpriteEffects, renderSpriteEffects, getProjectileImg, getMuzzleFrame, getSmokeImg, getTankExplosionImg } from '../../data/effectSprites.js';

const W = 960, H = 640;
const TILE = 32;
const DRAW_SCALE = 2;
const MAP_W = 70, MAP_H = 70;

const SFX = {
  hit: ['/dungeon-crawler/sounds/hit1.mp3', '/dungeon-crawler/sounds/hit2.mp3', '/dungeon-crawler/sounds/hit3.mp3', '/dungeon-crawler/sounds/hit4.mp3', '/dungeon-crawler/sounds/hit5.mp3'],
  explode: ['/dungeon-crawler/sounds/explode1.mp3', '/dungeon-crawler/sounds/explode2.mp3', '/dungeon-crawler/sounds/explode3.mp3'],
  shot: ['/dungeon-crawler/sounds/shot1.mp3', '/dungeon-crawler/sounds/shot2.mp3', '/dungeon-crawler/sounds/shot3.mp3'],
  grunt: ['/dungeon-crawler/sounds/grunt1.mp3', '/dungeon-crawler/sounds/grunt2.mp3', '/dungeon-crawler/sounds/grunt3.mp3', '/dungeon-crawler/sounds/grunt4.mp3', '/dungeon-crawler/sounds/grunt5.mp3'],
  hurt: ['/dungeon-crawler/sounds/ouch.mp3', '/dungeon-crawler/sounds/ugh.mp3'],
  levelup: ['/dungeon-crawler/sounds/levelup.mp3'],
  portal: ['/dungeon-crawler/sounds/portal.mp3'],
};
const sfxCache = {};
const sfxPoolSize = 4;
let sfxMuted = false;
let sfxVolume = 0.35;

function playSound(category, vol) {
  if (sfxMuted) return;
  const list = SFX[category];
  if (!list || !list.length) return;
  const src = list[Math.floor(Math.random() * list.length)];
  if (!sfxCache[src]) sfxCache[src] = Array.from({ length: sfxPoolSize }, () => { const a = new Audio(src); a.preload = 'auto'; return a; });
  const pool = sfxCache[src];
  const a = pool.find(x => x.paused || x.ended) || pool[0];
  a.volume = Math.min(1, (vol ?? 1) * sfxVolume);
  a.currentTime = 0;
  a.play().catch(() => {});
}

function spawnBlood(g, x, y, count, spread) {
  const n = count || 6;
  const sp = spread || 3;
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * sp;
    g.bloodParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life: 25 + Math.floor(Math.random() * 20),
      maxLife: 45,
      color: Math.random() < 0.3 ? '#8b0000' : (Math.random() < 0.5 ? '#dc2626' : '#b91c1c'),
    });
  }
}

function updateBlood(g) {
  for (let i = g.bloodParticles.length - 1; i >= 0; i--) {
    const b = g.bloodParticles[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.92;
    b.vy *= 0.92;
    b.vy += 0.08;
    b.life--;
    if (b.life <= 0) g.bloodParticles.splice(i, 1);
  }
}

function renderBlood(ctx, particles, cx, cy) {
  for (const b of particles) {
    const sx = b.x - cx, sy = b.y - cy;
    if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
    const alpha = Math.min(1, b.life / (b.maxLife * 0.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(sx, sy, b.size * (1 - (1 - b.life / b.maxLife) * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
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

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randi(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function tileBlocked(grid, gx, gy) {
  if (gx < 0 || gx >= MAP_W || gy < 0 || gy >= MAP_H) return true;
  return grid[gy][gx] !== 0;
}

function aabbBlockedAt(grid, x, y, halfW) {
  const l = Math.floor((x - halfW) / TILE);
  const r = Math.floor((x + halfW) / TILE);
  const t = Math.floor((y - halfW) / TILE);
  const b = Math.floor((y + halfW) / TILE);
  for (let gy = t; gy <= b; gy++) {
    for (let gx = l; gx <= r; gx++) {
      if (tileBlocked(grid, gx, gy)) return true;
    }
  }
  return false;
}

function moveWithSlide(grid, x, y, dx, dy, halfW) {
  let nx = x + dx;
  let ny = y + dy;
  if (!aabbBlockedAt(grid, nx, ny, halfW)) return { x: nx, y: ny };
  if (!aabbBlockedAt(grid, nx, y, halfW)) return { x: nx, y: y };
  if (!aabbBlockedAt(grid, x, ny, halfW)) return { x: x, y: ny };
  return { x, y };
}

function moveStepwise(grid, x, y, dx, dy, halfW, steps) {
  const sdx = dx / steps;
  const sdy = dy / steps;
  let cx = x, cy = y;
  for (let i = 0; i < steps; i++) {
    const r = moveWithSlide(grid, cx, cy, sdx, sdy, halfW);
    cx = r.x; cy = r.y;
  }
  return { x: cx, y: cy };
}

const EQUIPMENT_DB = {
  body: [
    { id: 'b1', name: 'Tattered Vest', tier: 0, def: 2, skills: [
      { id: 'dodge', name: 'Dodge Roll', icon: 1, cd: 60, cost: 0, type: 'dash', dist: 100, desc: 'Quick evasive roll' },
      { id: 'heal', name: 'Bandage', icon: 2, cd: 300, cost: 0, type: 'heal', amount: 20, desc: 'Heal 20 HP' },
    ]},
    { id: 'b2', name: 'Chain Mail', tier: 1, def: 5, skills: [
      { id: 'dodge', name: 'Dodge Roll', icon: 1, cd: 45, cost: 0, type: 'dash', dist: 120, desc: 'Quick evasive roll' },
      { id: 'fortify', name: 'Fortify', icon: 3, cd: 240, cost: 0, type: 'buff', duration: 180, defBonus: 8, desc: 'Boost defense' },
    ]},
    { id: 'b3', name: 'Plate Armor', tier: 2, def: 10, skills: [
      { id: 'shieldwall', name: 'Shield Wall', icon: 4, cd: 200, cost: 0, type: 'shield', duration: 120, absorb: 40, desc: 'Absorb damage' },
      { id: 'stomp', name: 'Stomp', icon: 5, cd: 120, cost: 0, type: 'aoe', radius: 80, dmg: 15, stun: 30, desc: 'AOE stun' },
    ]},
  ],
  lower: [
    { id: 'l1', name: 'Worn Boots', tier: 0, spd: 0, skills: [
      { id: 'sprint', name: 'Sprint', icon: 6, cd: 120, cost: 0, type: 'speed', duration: 90, mult: 1.6, desc: 'Speed boost' },
      { id: 'kick', name: 'Kick', icon: 7, cd: 60, cost: 0, type: 'melee', dmg: 8, range: 40, kb: 80, desc: 'Knockback kick' },
    ]},
    { id: 'l2', name: 'Greaves', tier: 1, spd: 0.5, skills: [
      { id: 'sprint', name: 'Sprint', icon: 6, cd: 90, cost: 0, type: 'speed', duration: 120, mult: 1.8, desc: 'Speed boost' },
      { id: 'slide', name: 'Slide Kick', icon: 8, cd: 80, cost: 0, type: 'dash_atk', dist: 100, dmg: 12, desc: 'Sliding attack' },
    ]},
    { id: 'l3', name: 'Shadow Treads', tier: 2, spd: 1, skills: [
      { id: 'blink', name: 'Blink', icon: 9, cd: 60, cost: 0, type: 'teleport', dist: 150, desc: 'Short teleport' },
      { id: 'stomp2', name: 'Quake', icon: 10, cd: 150, cost: 0, type: 'aoe', radius: 100, dmg: 25, stun: 45, desc: 'Massive AOE' },
    ]},
  ],
  weapon: [
    { id: 'w1', name: 'Rusty Dagger', tier: 0, dmg: 8, range: 40, speed: 150, wtype: 'melee', skills: [
      { id: 'slash', name: 'Slash', icon: 11, cd: 0, cost: 0, type: 'melee', dmg: 10, range: 45, kb: 12, desc: 'Basic slash' },
      { id: 'stab', name: 'Backstab', icon: 12, cd: 90, cost: 0, type: 'melee', dmg: 25, range: 35, kb: 8, crit: 2, desc: 'Critical strike' },
    ], special: { name: 'Poison Blade', icon: 13, cd: 180, type: 'dot', dmg: 3, ticks: 5, range: 50, desc: 'Poison on hit' }},
    { id: 'w2', name: 'Broadsword', tier: 1, dmg: 14, range: 55, speed: 250, wtype: 'melee', skills: [
      { id: 'cleave', name: 'Cleave', icon: 14, cd: 0, cost: 0, type: 'melee_arc', dmg: 16, range: 60, arc: 90, kb: 18, desc: 'Wide swing' },
      { id: 'thrust', name: 'Thrust', icon: 15, cd: 60, cost: 0, type: 'melee', dmg: 28, range: 70, kb: 24, desc: 'Piercing thrust' },
    ], special: { name: 'Whirlwind', icon: 16, cd: 240, type: 'spin', dmg: 20, radius: 65, hits: 3, desc: '360° spin attack' }},
    { id: 'w3', name: 'War Axe', tier: 1, dmg: 20, range: 50, speed: 350, wtype: 'melee', skills: [
      { id: 'chop', name: 'Chop', icon: 17, cd: 0, cost: 0, type: 'melee', dmg: 24, range: 55, kb: 20, desc: 'Heavy chop' },
      { id: 'execute', name: 'Execute', icon: 18, cd: 120, cost: 0, type: 'melee', dmg: 50, range: 50, kb: 35, desc: 'Massive hit' },
    ], special: { name: 'Berserker', icon: 19, cd: 300, type: 'buff', duration: 180, dmgMult: 1.5, desc: 'Damage boost' }},
    { id: 'w4', name: 'Arcane Staff', tier: 1, dmg: 12, range: 200, speed: 300, wtype: 'ranged', projId: 5, skills: [
      { id: 'bolt', name: 'Arcane Bolt', icon: 20, cd: 0, cost: 0, type: 'ranged', dmg: 14, range: 220, projId: 5, desc: 'Magic projectile' },
      { id: 'blast', name: 'Arcane Blast', icon: 11, cd: 90, cost: 0, type: 'aoe_proj', dmg: 25, radius: 60, range: 180, projId: 7, desc: 'Exploding bolt' },
    ], special: { name: 'Meteor', icon: 12, cd: 360, type: 'ground_aoe', dmg: 40, radius: 90, desc: 'Ground AOE' }},
    { id: 'w5', name: 'Longbow', tier: 1, dmg: 11, range: 250, speed: 220, wtype: 'ranged', projId: 1, skills: [
      { id: 'shoot', name: 'Shoot', icon: 13, cd: 0, cost: 0, type: 'ranged', dmg: 13, range: 270, projId: 1, desc: 'Arrow shot' },
      { id: 'multi', name: 'Multi-Shot', icon: 14, cd: 120, cost: 0, type: 'ranged_multi', dmg: 10, range: 200, projId: 1, count: 3, spread: 0.3, desc: '3 arrows' },
    ], special: { name: 'Rain of Arrows', icon: 15, cd: 300, type: 'ground_aoe', dmg: 8, radius: 100, ticks: 5, desc: 'Arrow rain AOE' }},
    { id: 'w6', name: 'Shadow Cannon', tier: 2, dmg: 28, range: 160, speed: 600, wtype: 'ranged', projId: 10, skills: [
      { id: 'fire', name: 'Cannon Shot', icon: 16, cd: 0, cost: 0, type: 'ranged', dmg: 30, range: 180, projId: 10, desc: 'Heavy shot' },
      { id: 'barrage', name: 'Barrage', icon: 17, cd: 180, cost: 0, type: 'ranged_burst', dmg: 15, range: 160, projId: 10, count: 5, interval: 4, desc: '5 rapid shots' },
    ], special: { name: 'Nuke', icon: 18, cd: 420, type: 'ground_aoe', dmg: 80, radius: 120, desc: 'Massive explosion' }},
  ],
};

const CONSUMABLES = [
  { id: 'pot_hp', name: 'Health Potion', icon: 19, type: 'heal', amount: 40, desc: 'Restore 40 HP' },
  { id: 'pot_spd', name: 'Speed Elixir', icon: 20, type: 'speed', duration: 180, mult: 1.5, desc: 'Speed up' },
];

const LMB_LEVELS = [
  { name: 'Crypt Bolt I', bolts: 1, dmg: 10, cd: 28, speed: 6, spread: 0, pierce: false, desc: 'Single bolt' },
  { name: 'Crypt Bolt II', bolts: 1, dmg: 14, cd: 28, speed: 6.5, spread: 0, pierce: false, desc: '+40% damage' },
  { name: 'Crypt Bolt III', bolts: 1, dmg: 14, cd: 22, speed: 7, spread: 0, pierce: false, desc: 'Faster reload' },
  { name: 'Twin Bolts', bolts: 2, dmg: 14, cd: 22, speed: 7, spread: 0.15, pierce: false, desc: '2 bolts spread' },
  { name: 'Twin Bolts II', bolts: 2, dmg: 18, cd: 20, speed: 7.5, spread: 0.15, pierce: false, desc: '+30% damage' },
  { name: 'Triple Bolts', bolts: 3, dmg: 18, cd: 18, speed: 7.5, spread: 0.18, pierce: false, desc: '3 bolts' },
  { name: 'Triple Bolts II', bolts: 3, dmg: 22, cd: 16, speed: 8, spread: 0.18, pierce: false, desc: 'Rapid fire' },
  { name: 'Piercing Bolts', bolts: 3, dmg: 24, cd: 15, speed: 8, spread: 0.18, pierce: true, desc: 'Bolts pierce enemies' },
  { name: 'Quad Storm', bolts: 4, dmg: 26, cd: 12, speed: 8.5, spread: 0.2, pierce: true, desc: '4 piercing bolts' },
  { name: 'Crypt Barrage', bolts: 6, dmg: 30, cd: 8, speed: 9, spread: 0.22, pierce: true, desc: '6 piercing bolts!' },
];

const RMB_LEVELS = [
  { name: 'Crypt Rocket I', rockets: 1, dmg: 20, cd: 180, aoe: 55, speed: 4, homing: 0, desc: 'Explosive rocket' },
  { name: 'Crypt Rocket II', rockets: 1, dmg: 25, cd: 170, aoe: 70, speed: 4, homing: 0, desc: 'Larger blast' },
  { name: 'Crypt Rocket III', rockets: 1, dmg: 32, cd: 155, aoe: 80, speed: 4.5, homing: 0, desc: '+28% damage' },
  { name: 'Twin Rockets', rockets: 2, dmg: 30, cd: 145, aoe: 80, speed: 4.5, homing: 0, desc: '2 rockets' },
  { name: 'Homing Rockets', rockets: 2, dmg: 32, cd: 135, aoe: 85, speed: 5, homing: 0.03, desc: 'Light tracking' },
  { name: 'Homing Rockets II', rockets: 2, dmg: 36, cd: 125, aoe: 95, speed: 5, homing: 0.05, desc: 'Better tracking' },
  { name: 'Triple Rockets', rockets: 3, dmg: 36, cd: 115, aoe: 100, speed: 5.5, homing: 0.05, desc: '3 rockets' },
  { name: 'Inferno Salvo', rockets: 3, dmg: 42, cd: 100, aoe: 110, speed: 5.5, homing: 0.07, desc: 'Strong homing' },
  { name: 'Inferno Salvo II', rockets: 4, dmg: 48, cd: 85, aoe: 120, speed: 6, homing: 0.08, desc: '4 fast rockets' },
  { name: 'Crypt Apocalypse', rockets: 6, dmg: 55, cd: 60, aoe: 140, speed: 6.5, homing: 0.1, desc: '6 homing rockets!' },
];

const ENEMY_TYPES = [
  { id: 1, name: 'Slime', hp: 30, dmg: 5, speed: 1.2, xp: 10, aggroRange: 180 },
  { id: 2, name: 'Skeleton', hp: 45, dmg: 8, speed: 1.5, xp: 15, aggroRange: 200 },
  { id: 3, name: 'Goblin', hp: 35, dmg: 7, speed: 2.0, xp: 12, aggroRange: 220 },
  { id: 4, name: 'Demon', hp: 60, dmg: 12, speed: 1.3, xp: 20, aggroRange: 200 },
  { id: 5, name: 'Wraith', hp: 50, dmg: 10, speed: 1.8, xp: 18, aggroRange: 240 },
  { id: 6, name: 'Dragon', hp: 100, dmg: 18, speed: 1.0, xp: 40, aggroRange: 260 },
  { id: 7, name: 'Skeleton Wizard', hp: 55, dmg: 14, speed: 1.4, xp: 22, aggroRange: 240, newSprite: 'skeleton_wizard' },
  { id: 8, name: 'Skeleton Archer', hp: 40, dmg: 11, speed: 1.7, xp: 18, aggroRange: 280, newSprite: 'skeleton_archer' },
  { id: 9, name: 'Goblin Warrior', hp: 45, dmg: 9, speed: 2.2, xp: 16, aggroRange: 220, newSprite: 'goblin' },
  { id: 10, name: 'Bandit', hp: 50, dmg: 10, speed: 1.9, xp: 20, aggroRange: 230, newSprite: 'bandit' },
];

const MEGA_BOSS = {
  id: 99, name: 'Crypt Overlord', baseHp: 800, dmg: 25, speed: 0.8, xp: 200,
  aggroRange: 350, isBoss: true, frameSize: 256,
  anims: {
    idle:       { path: '/sprites/bosses/mega-boss/Idle.png', frames: 8 },
    attack1:    { path: '/sprites/bosses/mega-boss/Attack1.png', frames: 6 },
    attack2:    { path: '/sprites/bosses/mega-boss/Attack2.png', frames: 6 },
    attack3:    { path: '/sprites/bosses/mega-boss/Attack3.png', frames: 6 },
    hurt:       { path: '/sprites/bosses/mega-boss/Hurt.png', frames: 4 },
    death:      { path: '/sprites/bosses/mega-boss/Death.png', frames: 6 },
    appearance: { path: '/sprites/bosses/mega-boss/Appearance.png', frames: 8 },
    special:    { path: '/sprites/bosses/mega-boss/Special.png', frames: 6 },
  },
  phases: [
    { hpPct: 1.0, attackCd: 90, attacks: ['attack1'] },
    { hpPct: 0.6, attackCd: 70, attacks: ['attack1', 'attack2'] },
    { hpPct: 0.3, attackCd: 50, attacks: ['attack1', 'attack2', 'attack3', 'special'] },
  ],
};

function generateDungeon(floor) {
  const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(1));
  const rooms = [];

  function splitBSP(x, y, w, h, depth) {
    const minSize = 7;
    const maxDepth = 5 + Math.min(floor, 3);
    if (depth >= maxDepth || w < minSize * 2 + 3 || h < minSize * 2 + 3) {
      const minRoomFrac = 0.45;
      const maxRoomFrac = 0.75;
      const rwMin = Math.max(5, Math.floor(w * minRoomFrac));
      const rwMax = Math.min(w - 2, Math.floor(w * maxRoomFrac));
      const rhMin = Math.max(5, Math.floor(h * minRoomFrac));
      const rhMax = Math.min(h - 2, Math.floor(h * maxRoomFrac));
      if (rwMin > rwMax || rhMin > rhMax || w < 7 || h < 7) {
        const rw = Math.min(w - 2, 5);
        const rh = Math.min(h - 2, 5);
        if (rw < 3 || rh < 3) return;
        const rx = x + Math.floor((w - rw) / 2);
        const ry = y + Math.floor((h - rh) / 2);
        rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
        return;
      }
      let rw = randi(rwMin, rwMax);
      let rh = randi(rhMin, rhMax);
      if (Math.random() < 0.25 && rw > 6 && rh > 6) {
        const cutW = Math.floor(rw * 0.4);
        const cutH = Math.floor(rh * 0.4);
        const rx = x + randi(1, Math.max(1, w - rw - 1));
        const ry = y + randi(1, Math.max(1, h - rh - 1));
        rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2), composite: true, cutW, cutH, cutCorner: randi(0, 3) });
        return;
      }
      const rx = x + randi(1, Math.max(1, w - rw - 1));
      const ry = y + randi(1, Math.max(1, h - rh - 1));
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
      return;
    }
    const splitRandomness = 0.35;
    const minChild = minSize + 2;
    const horizontal = w < h ? true : h < w ? false : Math.random() < 0.5;
    if (horizontal) {
      const lo = Math.max(minChild, Math.floor(h * (0.5 - splitRandomness)));
      const hi = Math.min(h - minChild, Math.floor(h * (0.5 + splitRandomness)));
      if (lo > hi) return;
      const split = randi(lo, hi);
      splitBSP(x, y, w, split, depth + 1);
      splitBSP(x, y + split, w, h - split, depth + 1);
    } else {
      const lo = Math.max(minChild, Math.floor(w * (0.5 - splitRandomness)));
      const hi = Math.min(w - minChild, Math.floor(w * (0.5 + splitRandomness)));
      if (lo > hi) return;
      const split = randi(lo, hi);
      splitBSP(x, y, split, h, depth + 1);
      splitBSP(x + split, y, w - split, h, depth + 1);
    }
  }

  splitBSP(2, 2, MAP_W - 4, MAP_H - 4, 0);

  for (const r of rooms) {
    if (r.composite) {
      for (let ry = r.y; ry < r.y + r.h; ry++) {
        for (let rx = r.x; rx < r.x + r.w; rx++) {
          let skip = false;
          if (r.cutCorner === 0 && rx < r.x + r.cutW && ry < r.y + r.cutH) skip = true;
          else if (r.cutCorner === 1 && rx >= r.x + r.w - r.cutW && ry < r.y + r.cutH) skip = true;
          else if (r.cutCorner === 2 && rx < r.x + r.cutW && ry >= r.y + r.h - r.cutH) skip = true;
          else if (r.cutCorner === 3 && rx >= r.x + r.w - r.cutW && ry >= r.y + r.h - r.cutH) skip = true;
          if (!skip && ry >= 0 && ry < MAP_H && rx >= 0 && rx < MAP_W) grid[ry][rx] = 0;
        }
      }
    } else {
      for (let ry = r.y; ry < r.y + r.h; ry++)
        for (let rx = r.x; rx < r.x + r.w; rx++)
          if (ry >= 0 && ry < MAP_H && rx >= 0 && rx < MAP_W) grid[ry][rx] = 0;
    }
  }

  function carveCorridor(x1, y1, x2, y2, width) {
    const hw = Math.floor(width / 2);
    let cx = x1, cy = y1;
    while (cx !== x2) {
      for (let w = -hw; w <= hw; w++) {
        const gy = cy + w;
        if (gy >= 0 && gy < MAP_H && cx >= 0 && cx < MAP_W) grid[gy][cx] = 0;
      }
      cx += cx < x2 ? 1 : -1;
    }
    while (cy !== y2) {
      for (let w = -hw; w <= hw; w++) {
        const gx = cx + w;
        if (cy >= 0 && cy < MAP_H && gx >= 0 && gx < MAP_W) grid[cy][gx] = 0;
      }
      cy += cy < y2 ? 1 : -1;
    }
  }

  rooms.sort((a, b) => (a.cx + a.cy) - (b.cx + b.cy));

  for (let i = 1; i < rooms.length; i++) {
    const corridorW = randi(2, 3);
    carveCorridor(rooms[i - 1].cx, rooms[i - 1].cy, rooms[i].cx, rooms[i].cy, corridorW);
  }
  const extraLinks = randi(2, Math.min(4, Math.floor(rooms.length / 2)));
  for (let i = 0; i < extraLinks; i++) {
    const a = randi(0, rooms.length - 1);
    let b = randi(0, rooms.length - 1);
    while (b === a) b = randi(0, rooms.length - 1);
    carveCorridor(rooms[a].cx, rooms[a].cy, rooms[b].cx, rooms[b].cy, 2);
  }

  const enemies = [];
  const xpDrops = [];
  const traps = [];
  const lootDrops = [];
  const enemyCount = Math.min(4 + floor * 2, 30);
  const trapCount = Math.min(2 + floor, 15);

  let enemiesSpawned = 0;
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i];
    const remaining = enemyCount - enemiesSpawned;
    const roomsLeft = rooms.length - i;
    const count = Math.min(Math.ceil(remaining / roomsLeft), 5);
    if (count <= 0) break;
    for (let j = 0; j < count; j++) {
      const maxType = Math.min(floor + 3, ENEMY_TYPES.length);
      const typeIdx = Math.min(Math.floor(Math.random() * maxType), ENEMY_TYPES.length - 1);
      const et = ENEMY_TYPES[typeIdx];
      const hpMult = 1 + (floor - 1) * 0.15;
      enemies.push({
        ...et,
        hp: Math.floor(et.hp * hpMult),
        maxHp: Math.floor(et.hp * hpMult),
        x: (r.x + 1 + Math.random() * (r.w - 2)) * TILE,
        y: (r.y + 1 + Math.random() * (r.h - 2)) * TILE,
        alive: true,
        frame: 0,
        frameTimer: 0,
        facingDown: true,
        facingDir: 'down',
        hitTimer: 0,
        deathTimer: 0,
        state: 'idle',
        poisonTicks: 0,
        poisonDmg: 0,
        stunTimer: 0,
      });
      enemiesSpawned++;
    }

    if (i < rooms.length - 1 && Math.random() < 0.6) {
      for (let t = 0; t < Math.ceil(trapCount / (rooms.length - 2)); t++) {
        const trapType = ['electric', 'firebreath', 'gear', 'laser'][Math.floor(Math.random() * 4)];
        const tx = (r.x + 1 + Math.random() * (r.w - 2)) * TILE;
        const ty = (r.y + 1 + Math.random() * (r.h - 2)) * TILE;
        traps.push({
          type: trapType,
          x: tx, y: ty,
          active: true,
          timer: Math.random() * 120,
          frame: 0,
          triggered: false,
          angle: Math.random() * Math.PI * 2,
          variant: Math.random() < 0.5 ? 1 : 2,
        });
      }
    }
  }

  for (const r of rooms) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      xpDrops.push({
        x: (r.x + 1 + Math.random() * (r.w - 2)) * TILE,
        y: (r.y + 1 + Math.random() * (r.h - 2)) * TILE,
        value: 5 + Math.floor(Math.random() * 10),
        collected: false,
        type: 1 + Math.floor(Math.random() * 5),
      });
    }
  }

  const decorations = [];
  for (const r of rooms) {
    const decoCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < decoCount; i++) {
      const dx = (r.x + 1 + Math.random() * (r.w - 2)) * TILE;
      const dy = (r.y + 1 + Math.random() * (r.h - 2)) * TILE;
      decorations.push({
        x: dx, y: dy,
        spriteIdx: Math.floor(Math.random() * 15),
        scale: 0.08 + Math.random() * 0.06,
      });
    }
  }

  const validRoom = (r) => r.cx >= 0 && r.cx < MAP_W && r.cy >= 0 && r.cy < MAP_H && grid[r.cy][r.cx] === 0;
  const spawnRoom = rooms.find(validRoom) || rooms[0];
  const portalRoom = [...rooms].reverse().find(validRoom) || rooms[rooms.length - 1];
  const clampX = (v) => Math.max(TILE, Math.min(v, (MAP_W - 2) * TILE));
  const clampY = (v) => Math.max(TILE, Math.min(v, (MAP_H - 2) * TILE));
  const portal = { x: clampX(portalRoom.cx * TILE), y: clampY(portalRoom.cy * TILE), active: false, frame: 0 };

  let megaBoss = null;
  if (floor > 0 && floor % 5 === 0) {
    const bossRoom = rooms.length > 2 ? rooms[Math.floor(rooms.length / 2)] : portalRoom;
    const hpMult = 1 + (floor - 1) * 0.2;
    const bossHp = Math.floor(MEGA_BOSS.baseHp * hpMult);
    megaBoss = {
      ...MEGA_BOSS,
      hp: bossHp,
      maxHp: bossHp,
      dmg: Math.floor(MEGA_BOSS.dmg * (1 + (floor - 1) * 0.1)),
      x: clampX(bossRoom.cx * TILE),
      y: clampY(bossRoom.cy * TILE),
      alive: true,
      frame: 0,
      frameTimer: 0,
      anim: 'appearance',
      animCallback: 'idle',
      facingDir: 'down',
      facingDown: true,
      hitTimer: 0,
      deathTimer: 0,
      state: 'idle',
      poisonTicks: 0,
      poisonDmg: 0,
      stunTimer: 0,
      attackCd: 0,
      phase: 0,
      appeared: false,
    };
    enemies.push(megaBoss);
  }

  return { grid, rooms, enemies, xpDrops, traps, lootDrops, portal, megaBoss, decorations,
    spawnX: clampX(spawnRoom.cx * TILE), spawnY: clampY(spawnRoom.cy * TILE) };
}

const FLOOR_TILES = [1, 2, 3, 9, 10, 11, 25, 26, 27];
const FLOOR_DETAIL_TILES = [28, 29, 30, 33, 34, 35, 36, 37, 38];
const WALL_BG_COLOR = '#1a0f15';

function getTileType(gx, gy, grid) {
  const wall = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) ? 1 : grid[y][x];
  const up = wall(gx, gy - 1), dn = wall(gx, gy + 1), lt = wall(gx - 1, gy), rt = wall(gx + 1, gy);
  const ulc = wall(gx - 1, gy - 1), urc = wall(gx + 1, gy - 1);
  const dlc = wall(gx - 1, gy + 1), drc = wall(gx + 1, gy + 1);

  if (grid[gy][gx] === 0) {
    const edgeCount = up + dn + lt + rt;
    if (edgeCount >= 2) {
      if (up === 1 && lt === 1) return 17;
      if (up === 1 && rt === 1) return 18;
      if (dn === 1 && lt === 1) return 25;
      if (dn === 1 && rt === 1) return 26;
    }
    if (dn === 1) return 9;
    if (up === 1) return 1;
    if (lt === 1) return 33;
    if (rt === 1) return 34;
    if (dlc === 1) return 35;
    if (drc === 1) return 36;
    if (ulc === 1) return 28;
    if (urc === 1) return 29;
    const hash = Math.abs((gx * 7 + gy * 13 + gx * gy) % 17);
    if (hash < 3) return FLOOR_DETAIL_TILES[hash % FLOOR_DETAIL_TILES.length];
    return FLOOR_TILES[hash % FLOOR_TILES.length];
  }

  const adjFloors = (up === 0 ? 1 : 0) + (dn === 0 ? 1 : 0) + (lt === 0 ? 1 : 0) + (rt === 0 ? 1 : 0);
  if (adjFloors === 0) {
    const cornerFloors = (ulc === 0 ? 1 : 0) + (urc === 0 ? 1 : 0) + (dlc === 0 ? 1 : 0) + (drc === 0 ? 1 : 0);
    if (cornerFloors === 0) return 0;
    if (ulc === 0) return 30;
    if (urc === 0) return 27;
    if (dlc === 0) return 38;
    if (drc === 0) return 37;
    return 0;
  }

  if (up === 0 && dn === 0 && lt === 0 && rt === 0) return 10;
  if (up === 0 && lt === 0) return 17;
  if (up === 0 && rt === 0) return 18;
  if (dn === 0 && lt === 0) return 25;
  if (dn === 0 && rt === 0) return 26;
  if (up === 0 && dn === 0) return 2;
  if (lt === 0 && rt === 0) return 19;
  if (up === 0) return 1;
  if (dn === 0) return 9;
  if (lt === 0) return 33;
  if (rt === 0) return 34;
  return 0;
}

function createDefaultEquipment() {
  return {
    body: { ...EQUIPMENT_DB.body[0] },
    lower: { ...EQUIPMENT_DB.lower[0] },
    weapon: { ...EQUIPMENT_DB.weapon[0] },
  };
}

function getSkillsFromEquipment(equip) {
  const skills = [];
  if (equip.body) skills.push(...equip.body.skills);
  if (equip.lower) skills.push(...equip.lower.skills);
  if (equip.weapon) skills.push(...equip.weapon.skills);
  return skills;
}

export default function DungeonCrawler() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const mouseRef = useRef({ x: 0, y: 0, clicked: false, rightClicked: false });
  const [screen, setScreen] = useState('title');
  const [loading, setLoading] = useState(true);
  const [charType, setCharType] = useState('adventurer');
  const assetsRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    async function loadAssets() {
      const range = (n, start = 1) => Array.from({ length: n }, (_, i) => i + start);
      const batch = (urls) => Promise.all(urls.map(loadImg));

      const [heroWalk, heroDeath, weapons, projectiles, tiles, xpItems, portal, rocks,
        slashFrames, smokeFrames, guiIcons, spikeFrames, lightningFrames, barrelFrames,
        barrelBoom, boomFrames, barsGreen, barsRed, barsYellow, barsBack, logo,
        cpBars, cpFrames, cpSkillIcons, cpCursors, cpNumbers, cpButtons, cpLogo, cryptLogo,
        crosshair,
        trapElectric1, trapElectric2, trapFirebreath, trapGear, trapLaser,
        arrowSheet, arrowDiag, obstacleProjs, obstacleDecos
      ] = await Promise.all([
        batch(range(3).map(i => `/dungeon-crawler/hero/Walk${i}.png`)),
        batch(range(3).map(i => `/dungeon-crawler/hero/Death${i}.png`)),
        batch(range(9).map(i => `/dungeon-crawler/weapons/${i}.png`)),
        batch(range(22).map(i => `/dungeon-crawler/weapons/projectiles/${i}.png`)),
        batch(range(40).map(i => `/dungeon-crawler/tiles/Tile_${String(i).padStart(2, '0')}.png`)),
        batch(range(5).map(i => `/dungeon-crawler/objects/xp/${i}.png`)),
        batch(range(2).map(i => `/dungeon-crawler/objects/portals/Portal${i}.png`)),
        batch(range(16).map(i => `/dungeon-crawler/objects/rocks/${i}.png`)),
        batch(range(10).map(i => `/dungeon-crawler/slash/1/${i}.png`)),
        batch(range(10).map(i => `/dungeon-crawler/smoke/circle/Circle_smoke${i}.png`)),
        batch(range(29).map(i => `/dungeon-crawler/gui/icons/Icon_${String(i).padStart(2, '0')}.png`)),
        batch(range(4).map(i => `/dungeon-crawler/traps/spikes/${i}.png`)),
        batch(range(4).map(i => `/dungeon-crawler/traps/lightning/${i}.png`)),
        batch(range(3).map(i => `/dungeon-crawler/traps/barrels/${i}.png`)),
        batch(range(3).map(i => `/dungeon-crawler/traps/barrels/Boom${i}.png`)),
        batch(['/dungeon-crawler/enemies/Boom1.png', '/dungeon-crawler/enemies/Boom2.png']),
        loadImg('/dungeon-crawler/gui/bars/HPBar_green.png'),
        loadImg('/dungeon-crawler/gui/bars/HPBar_red.png'),
        loadImg('/dungeon-crawler/gui/bars/HPBar_yellow.png'),
        loadImg('/dungeon-crawler/gui/bars/HPBar_back.png'),
        loadImg('/dungeon-crawler/gui/logo/Logo.png'),
        batch(['HealthBar1.png', 'HealthBar2.png', 'HealthBar3.png', 'HealthBar4.png',
          'EnergyBar1.png', 'EnergyBar2.png', 'EnergyBar3.png', 'EnergyBar4.png'].map(
          f => `/dungeon-crawler/gui/cyberpunk/bars/${f}`)),
        batch(range(10).map(i => `/dungeon-crawler/gui/cyberpunk/frames/Frame_${String(i).padStart(2, '0')}.png`)),
        batch(range(20).map(i => `/dungeon-crawler/gui/cyberpunk/skill-icons/Skillicon7_${String(i).padStart(2, '0')}.png`)),
        batch(range(4).map(i => `/dungeon-crawler/gui/cyberpunk/cursors/${i}.png`)),
        batch(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
          n => `/dungeon-crawler/gui/cyberpunk/numbers/${n}.png`)),
        batch(range(5).map(i => `/dungeon-crawler/gui/cyberpunk/buttons/ButtonMap${i}.png`)),
        batch(range(3).map(i => `/dungeon-crawler/gui/cyberpunk/logo/Logo${i}.png`)),
        loadImg('/dungeon-crawler/gui/crypt-logo.png'),
        loadImg('/dungeon-crawler/gui/crosshair.png'),
        batch(range(4).map(i => `/dungeon-crawler/traps/electric/e1_${i}.png`)),
        batch(range(4).map(i => `/dungeon-crawler/traps/electric/e2_${i}.png`)),
        batch(range(6).map(i => `/dungeon-crawler/traps/firebreath/${i}.png`)),
        batch(range(8).map(i => `/dungeon-crawler/traps/gear/${i}.png`)),
        batch(range(4).map(i => `/dungeon-crawler/traps/laser/${i}.png`)),
        loadImg('/dungeon-crawler/arrows/Arrows_4-Types_10x5pixelsEach.png'),
        loadImg('/dungeon-crawler/arrows/Arrows_4-Types-DiagonalDesign_9x9pixelsEach.png'),
        batch(range(10).map(i => `/dungeon-crawler/obstacles/projectiles/${i}.png`)),
        batch(range(15).map(i => `/dungeon-crawler/obstacles/decorations/${i}.png`)),
      ]);

      const enemies = await Promise.all(range(6).map(async i => ({
        runSD: await loadImg(`/dungeon-crawler/enemies/${i}/RunSD.png`),
        runSU: await loadImg(`/dungeon-crawler/enemies/${i}/RunSU.png`),
        deathSD: await loadImg(`/dungeon-crawler/enemies/${i}/DeathSD.png`),
        deathSU: await loadImg(`/dungeon-crawler/enemies/${i}/DeathSU.png`),
      })));

      const newEnemyNames = ['skeleton_wizard', 'skeleton_archer', 'goblin', 'bandit'];
      const newEnemies = await Promise.all(newEnemyNames.map(async name => ({
        runSD: await loadImg(`/dungeon-crawler/enemies/${name}/RunSD.png`),
        runSU: await loadImg(`/dungeon-crawler/enemies/${name}/RunSU.png`),
        runLeft: await loadImg(`/dungeon-crawler/enemies/${name}/RunLeft.png`),
        runRight: await loadImg(`/dungeon-crawler/enemies/${name}/RunRight.png`),
        deathSD: await loadImg(`/dungeon-crawler/enemies/${name}/DeathSD.png`),
        deathSU: await loadImg(`/dungeon-crawler/enemies/${name}/DeathSU.png`),
        attackSD: await loadImg(`/dungeon-crawler/enemies/${name}/AttackSD.png`),
      })));

      const goblinStateSprites = {
        attack: await loadImg('/dungeon-crawler/enemies/goblin/attack.png'),
        idle: await loadImg('/dungeon-crawler/enemies/goblin/idle.png'),
        run: await loadImg('/dungeon-crawler/enemies/goblin/run.png'),
        death: await loadImg('/dungeon-crawler/enemies/goblin/death.png'),
        frameCounts: { attack: 7, idle: 3, run: 6, death: 8 },
        frameSize: 672,
      };

      const advDirs = ['down', 'up', 'left', 'right'];
      const advBase = '/dungeon-crawler/hero/adventurer';
      const [advIdle, advRun, advAtk1, advAtk2] = await Promise.all([
        batch(advDirs.map(d => `${advBase}/idle/${d}.png`)),
        batch(advDirs.map(d => `${advBase}/run/${d}.png`)),
        batch(advDirs.map(d => `${advBase}/attack1/${d}.png`)),
        batch(advDirs.map(d => `${advBase}/attack2/${d}.png`)),
      ]);
      const adventurer = { idle: advIdle, run: advRun, attack1: advAtk1, attack2: advAtk2, dirs: advDirs, frameW: 96, frameH: 80, frameCount: 8 };

      await preloadAllEffects();

      const megaBossSprites = {};
      for (const [key, info] of Object.entries(MEGA_BOSS.anims)) {
        if (cancelled) return;
        megaBossSprites[key] = await loadImg(info.path);
      }

      if (cancelled) return;
      assetsRef.current = {
        heroWalk, heroDeath, weapons, projectiles, enemies, newEnemies, goblinStateSprites, tiles, xpItems, portal, rocks,
        slashFrames, smokeFrames, guiIcons, spikeFrames, lightningFrames, barrelFrames,
        barrelBoom, boomFrames,
        bars: { green: barsGreen, red: barsRed, yellow: barsYellow, back: barsBack },
        logo, cpBars, cpFrames, cpSkillIcons, cpCursors, cpNumbers, cpButtons, cpLogo,
        cryptLogo, crosshair, megaBossSprites,
        trapElectric1, trapElectric2, trapFirebreath, trapGear, trapLaser,
        adventurer, arrowSheet, arrowDiag, obstacleProjs, obstacleDecos,
      };
      setLoading(false);
    }
    loadAssets();
    return () => { cancelled = true; };
  }, []);

  const startGame = useCallback((selectedChar) => {
    const useChar = selectedChar || charType;
    const dungeon = generateDungeon(1);
    const equip = createDefaultEquipment();
    gameRef.current = {
      charType: useChar,
      player: {
        x: dungeon.spawnX, y: dungeon.spawnY,
        hp: 100, maxHp: 100, mana: 50, maxMana: 50,
        xp: 0, level: 1, xpToNext: 50,
        speed: 3, baseSpeed: 3,
        frame: 0, frameTimer: 0,
        facing: 'down', heroAnim: 'idle', attackAnim: 1, idleHold: 0,
        attacking: false, attackTimer: 0, attackCooldown: 0,
        dead: false, deathTimer: 0,
        invincible: 0,
        kills: 0,
        equipment: equip,
        skills: getSkillsFromEquipment(equip),
        skillCooldowns: {},
        inventory: [{ ...CONSUMABLES[0], qty: 3 }],
        buffs: [],
        shieldHP: 0,
        dashing: false, dashTimer: 0, dashDx: 0, dashDy: 0,
        dodgeRollTimer: 0,
        burstTimer: 0, burstCount: 0, burstSkill: null,
        aoeEffects: [],
        lmbLevel: 0,
        rmbLevel: 0,
        lmbCd: 0,
        rmbCd: 0,
      },
      camera: { x: 0, y: 0, snap: true },
      dungeon,
      floor: 1,
      projectiles: [],
      particles: [],
      slashEffects: [],
      smokeEffects: [],
      spriteEffects: [],
      muzzleFlashes: [],
      aoeZones: [],
      rocketTrails: [],
      bloodParticles: [],
      screenShake: 0,
      paused: false,
      gameOver: false,
      portalReady: false,
      time: 0,
      damageNumbers: [],
      showEquipUI: false,
      showUpgradeUI: false,
      lootOnGround: [],
    };
    setScreen('game');
  }, [charType]);

  useEffect(() => {
    if (screen !== 'game' || loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let animId;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      if (!gameRef.current) { animId = requestAnimationFrame(tick); return; }
      const g = gameRef.current;
      if (g.gameOver) {
        drawGameOver(ctx, g, assetsRef.current);
        animId = requestAnimationFrame(tick);
        return;
      }
      if (!g.paused && !g.showEquipUI && !g.showUpgradeUI) {
        g.time++;
        updatePlayer(g, keysRef.current, mouseRef.current, assetsRef.current);
        updateEnemies(g);
        updateProjectiles(g);
        updateTraps(g);
        updateAOEZones(g);
        updateBuffs(g);
        updateParticles(g);
        updateBlood(g);
        updateCamera(g);
        checkPortal(g);
        checkLoot(g);
      } else if (g.showUpgradeUI) {
        g.time++;
      }
      render(ctx, g, assetsRef.current);
      if (g.showEquipUI) drawEquipUI(ctx, g, assetsRef.current);
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(animId); };
  }, [screen, loading]);

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (e.type === 'keydown') {
        keysRef.current[key] = true;
        const g = gameRef.current;
        if (!g) return;

        if (key === 'escape' || key === '9') {
          if (g.gameOver) { setScreen('title'); return; }
          if (g.showEquipUI) { g.showEquipUI = false; return; }
          g.paused = !g.paused;
        }
        if (key === 'tab' || key === '8') {
          e.preventDefault();
          if (!g.paused && !g.gameOver) g.showEquipUI = !g.showEquipUI;
        }
        if (key === '7' && !g.paused && !g.showEquipUI && !g.gameOver) {
          useItem(g);
        }
        if (key === 'm') { sfxMuted = !sfxMuted; }
        if (g.showUpgradeUI) {
          if (key === '1' || key === 'a') applyUpgradeChoice(g, 'lmb');
          else if (key === '2' || key === 'd') applyUpgradeChoice(g, 'rmb');
        } else if (key >= '1' && key <= '6' && !g.paused && !g.showEquipUI && !g.gameOver) {
          const idx = parseInt(key) - 1;
          activateSkill(g, idx);
        }
        if (key === 'r' && g.gameOver) {
          startGame();
        }
      } else {
        keysRef.current[key] = false;
      }
    };
    const onMouse = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = (e.clientY - rect.top) * scaleY;
    };
    const onClick = (e) => {
      onMouse(e);
      if (e.button === 0) { mouseRef.current.clicked = true; mouseRef.current.lmbDown = true; }
      if (e.button === 2) { mouseRef.current.rightClicked = true; mouseRef.current.rmbDown = true; }
    };
    const onMouseUp = (e) => {
      if (e.button === 0) mouseRef.current.lmbDown = false;
      if (e.button === 2) mouseRef.current.rmbDown = false;
    };
    const onContext = (e) => e.preventDefault();

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContext);
    };
  }, [startGame]);

  function useItem(g) {
    const p = g.player;
    if (p.dead || p.inventory.length === 0) return;
    const item = p.inventory[0];
    if (!item || item.qty <= 0) return;
    if (item.type === 'heal') {
      p.hp = Math.min(p.hp + item.amount, p.maxHp);
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: `+${item.amount}`, timer: 40, color: '#22c55e' });
    } else if (item.type === 'speed') {
      p.buffs.push({ type: 'speed', mult: item.mult, timer: item.duration });
    }
    item.qty--;
    if (item.qty <= 0) p.inventory.splice(0, 1);
  }

  function activateSkill(g, idx) {
    const p = g.player;
    if (p.dead) return;
    const skill = p.skills[idx];
    if (!skill) return;
    const cdKey = skill.id + '_' + idx;
    if ((p.skillCooldowns[cdKey] || 0) > 0) return;

    const worldMouseX = mouseRef.current.x + g.camera.x;
    const worldMouseY = mouseRef.current.y + g.camera.y;
    const angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    p.skillCooldowns[cdKey] = skill.cd || 1;

    if (skill.type === 'melee' || skill.type === 'melee_arc') {
      p.attacking = true;
      p.attackTimer = 12;
      g.slashEffects.push({ x: p.x + Math.cos(angle) * 30, y: p.y + Math.sin(angle) * 30, frame: 0, timer: 0, angle });
      const arcHalf = skill.type === 'melee_arc' ? ((skill.arc || 90) * Math.PI / 180) / 2 : Math.PI;
      for (const e of g.dungeon.enemies) {
        if (!e.alive || e.stunTimer > 0) continue;
        const d = dist(p, e);
        if (d < (skill.range || 50)) {
          if (skill.type === 'melee_arc') {
            const eAngle = Math.atan2(e.y - p.y, e.x - p.x);
            let diff = eAngle - angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) > arcHalf) continue;
          }
          let dmg = skill.dmg + Math.floor(Math.random() * 5);
          if (skill.crit && Math.random() < 0.3) dmg = Math.floor(dmg * skill.crit);
          applyDamageToEnemy(g, e, dmg, skill.kb || 0, angle);
        }
      }
    } else if (skill.type === 'ranged') {
      g.projectiles.push({
        x: p.x, y: p.y, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
        dmg: skill.dmg, range: skill.range || 200, traveled: 0,
        projId: skill.projId || 1, owner: 'player',
      });
      g.slashEffects.push({ x: p.x + Math.cos(angle) * 20, y: p.y + Math.sin(angle) * 20, frame: 0, timer: 0, angle });
    } else if (skill.type === 'ranged_multi') {
      for (let i = 0; i < (skill.count || 3); i++) {
        const a = angle + (i - Math.floor(skill.count / 2)) * (skill.spread || 0.2);
        g.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
          dmg: skill.dmg, range: skill.range || 200, traveled: 0,
          projId: skill.projId || 1, owner: 'player',
        });
      }
    } else if (skill.type === 'ranged_burst') {
      p.burstTimer = 0;
      p.burstCount = skill.count || 5;
      p.burstSkill = { ...skill, angle };
    } else if (skill.type === 'aoe_proj') {
      g.projectiles.push({
        x: p.x, y: p.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
        dmg: skill.dmg, range: skill.range || 180, traveled: 0,
        projId: skill.projId || 7, owner: 'player', explosive: true, explosionRadius: skill.radius || 60,
      });
    } else if (skill.type === 'aoe') {
      g.aoeZones.push({
        x: p.x, y: p.y, radius: skill.radius || 80, dmg: skill.dmg, timer: 15,
        stun: skill.stun || 0, owner: 'player', color: '#06b6d4',
      });
      g.screenShake = 6;
    } else if (skill.type === 'ground_aoe') {
      g.aoeZones.push({
        x: worldMouseX, y: worldMouseY, radius: skill.radius || 90, dmg: skill.dmg,
        timer: skill.ticks ? skill.ticks * 15 : 20, stun: 0, owner: 'player', color: '#ef4444',
        tickInterval: 15, lastTick: 0,
      });
    } else if (skill.type === 'dash') {
      p.dashing = true;
      p.dashTimer = 8;
      p.dashDx = Math.cos(angle) * (skill.dist || 100) / 8;
      p.dashDy = Math.sin(angle) * (skill.dist || 100) / 8;
      p.invincible = 10;
      p.dodgeRollTimer = 8;
    } else if (skill.type === 'heal') {
      p.hp = Math.min(p.hp + (skill.amount || 20), p.maxHp);
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: `+${skill.amount}`, timer: 40, color: '#22c55e' });
    } else if (skill.type === 'buff') {
      p.buffs.push({ type: 'def', bonus: skill.defBonus || 0, timer: skill.duration || 180 });
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: 'BUFFED', timer: 40, color: '#fbbf24' });
    } else if (skill.type === 'shield') {
      p.shieldHP = skill.absorb || 40;
      p.buffs.push({ type: 'shield', timer: skill.duration || 120 });
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: 'SHIELDED', timer: 40, color: '#3b82f6' });
    } else if (skill.type === 'speed') {
      p.buffs.push({ type: 'speed', mult: skill.mult || 1.5, timer: skill.duration || 90 });
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: 'SPEED!', timer: 30, color: '#22d3ee' });
    } else if (skill.type === 'teleport') {
      const tx = p.x + Math.cos(angle) * (skill.dist || 150);
      const ty = p.y + Math.sin(angle) * (skill.dist || 150);
      const gx = Math.floor(tx / TILE), gy = Math.floor(ty / TILE);
      if (gx >= 0 && gx < MAP_W && gy >= 0 && gy < MAP_H && g.dungeon.grid[gy][gx] === 0) {
        g.smokeEffects.push({ x: p.x, y: p.y, frame: 0, timer: 0 });
        p.x = tx; p.y = ty;
        g.smokeEffects.push({ x: p.x, y: p.y, frame: 0, timer: 0 });
      }
    } else if (skill.type === 'dot') {
      for (const e of g.dungeon.enemies) {
        if (!e.alive) continue;
        if (dist(p, e) < (skill.range || 50)) {
          e.poisonTicks = skill.ticks || 5;
          e.poisonDmg = skill.dmg || 3;
          g.damageNumbers.push({ x: e.x, y: e.y - 15, value: 'POISON', timer: 30, color: '#22c55e' });
        }
      }
    } else if (skill.type === 'spin') {
      p.attacking = true;
      p.attackTimer = 20;
      for (let h = 0; h < (skill.hits || 3); h++) {
        const sa = (Math.PI * 2 / (skill.hits || 3)) * h;
        g.slashEffects.push({
          x: p.x + Math.cos(sa) * 30, y: p.y + Math.sin(sa) * 30,
          frame: 0, timer: -h * 4, angle: sa,
        });
      }
      for (const e of g.dungeon.enemies) {
        if (!e.alive) continue;
        if (dist(p, e) < (skill.radius || 65)) {
          applyDamageToEnemy(g, e, skill.dmg, 5, Math.atan2(e.y - p.y, e.x - p.x));
        }
      }
    } else if (skill.type === 'dash_atk') {
      p.dashing = true;
      p.dashTimer = 6;
      p.dashDx = Math.cos(angle) * (skill.dist || 100) / 6;
      p.dashDy = Math.sin(angle) * (skill.dist || 100) / 6;
      g.slashEffects.push({ x: p.x + Math.cos(angle) * 30, y: p.y + Math.sin(angle) * 30, frame: 0, timer: 0, angle });
      for (const e of g.dungeon.enemies) {
        if (!e.alive) continue;
        if (dist(p, e) < (skill.dist || 100)) {
          applyDamageToEnemy(g, e, skill.dmg, 3, angle);
        }
      }
    }
  }

  function fireLMB(g) {
    const p = g.player;
    if (p.dead || p.lmbCd > 0) return;
    const lvl = LMB_LEVELS[p.lmbLevel];
    p.lmbCd = lvl.cd;
    p.attacking = true;
    p.attackTimer = 10;
    playSound('shot', 0.5);

    const worldMouseX = mouseRef.current.x + g.camera.x;
    const worldMouseY = mouseRef.current.y + g.camera.y;
    const baseAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    for (let i = 0; i < lvl.bolts; i++) {
      const offset = lvl.bolts > 1 ? (i - (lvl.bolts - 1) / 2) * lvl.spread : 0;
      const a = baseAngle + offset;
      g.projectiles.push({
        x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14,
        vx: Math.cos(a) * lvl.speed, vy: Math.sin(a) * lvl.speed,
        dmg: lvl.dmg + Math.floor(Math.random() * 4), range: 280, traveled: 0,
        projId: 5, owner: 'player', lmbBolt: true, pierce: lvl.pierce,
        boltLevel: p.lmbLevel,
      });
    }

    g.slashEffects.push({
      x: p.x + Math.cos(baseAngle) * 22, y: p.y + Math.sin(baseAngle) * 22,
      frame: 0, timer: 0, angle: baseAngle,
    });

    const muzzleType = p.lmbLevel >= 7 ? 'magic' : p.lmbLevel >= 4 ? 'slash' : 'fire';
    const muzzleIdx = 1 + (p.lmbLevel % 10);
    spawnEffect(g.spriteEffects, `${muzzleType}${muzzleIdx}`,
      p.x + Math.cos(baseAngle) * 20, p.y + Math.sin(baseAngle) * 20,
      { size: 40 + p.lmbLevel * 4, angle: baseAngle, speed: 2, scale: 0.6 + p.lmbLevel * 0.05 });

    g.muzzleFlashes.push({ x: p.x + Math.cos(baseAngle) * 16, y: p.y + Math.sin(baseAngle) * 16, frame: 0, timer: 0, type: 'flashA', angle: baseAngle });

    if (lvl.bolts >= 4) {
      g.screenShake = 2;
    }
  }

  function fireRMB(g) {
    const p = g.player;
    if (p.dead || p.rmbCd > 0) return;
    const lvl = RMB_LEVELS[p.rmbLevel];
    p.rmbCd = lvl.cd;
    p.attacking = true;
    p.attackTimer = 14;
    playSound('shot', 0.7);

    const worldMouseX = mouseRef.current.x + g.camera.x;
    const worldMouseY = mouseRef.current.y + g.camera.y;
    const baseAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    for (let i = 0; i < lvl.rockets; i++) {
      const offset = lvl.rockets > 1 ? (i - (lvl.rockets - 1) / 2) * 0.25 : 0;
      const a = baseAngle + offset;
      const delay = i * 3;
      g.projectiles.push({
        x: p.x + Math.cos(a) * 12, y: p.y + Math.sin(a) * 12,
        vx: Math.cos(a) * lvl.speed, vy: Math.sin(a) * lvl.speed,
        dmg: lvl.dmg, range: 350, traveled: 0,
        projId: 10, owner: 'player', explosive: true,
        explosionRadius: lvl.aoe, isRocket: true,
        homing: lvl.homing, rocketLevel: p.rmbLevel,
        spawnDelay: delay,
      });
    }

    g.screenShake = 4 + Math.floor(lvl.rockets / 2);
    g.damageNumbers.push({ x: p.x, y: p.y - 35, value: lvl.name, timer: 30, color: '#f97316' });

    const rmbMuzzleIdx = 1 + Math.floor(Math.random() * 10);
    spawnEffect(g.spriteEffects, `fire${rmbMuzzleIdx}`,
      p.x + Math.cos(baseAngle) * 18, p.y + Math.sin(baseAngle) * 18,
      { size: 48 + p.rmbLevel * 5, angle: baseAngle, speed: 2, scale: 0.7 + p.rmbLevel * 0.06 });
    g.muzzleFlashes.push({ x: p.x + Math.cos(baseAngle) * 14, y: p.y + Math.sin(baseAngle) * 14, frame: 0, timer: 0, type: 'flashB', angle: baseAngle });
  }

  function activateWeaponSpecial(g) {
    const p = g.player;
    if (p.dead) return;
    const spec = p.equipment.weapon.special;
    if (!spec) return;
    const cdKey = 'special_weapon';
    if ((p.skillCooldowns[cdKey] || 0) > 0) return;
    p.skillCooldowns[cdKey] = spec.cd || 180;

    const worldMouseX = mouseRef.current.x + g.camera.x;
    const worldMouseY = mouseRef.current.y + g.camera.y;
    const angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    if (spec.type === 'dot') {
      for (const e of g.dungeon.enemies) {
        if (!e.alive || dist(p, e) > (spec.range || 50)) continue;
        e.poisonTicks = spec.ticks || 5;
        e.poisonDmg = spec.dmg || 3;
        g.damageNumbers.push({ x: e.x, y: e.y - 15, value: 'POISON', timer: 30, color: '#22c55e' });
      }
    } else if (spec.type === 'spin') {
      p.attacking = true;
      p.attackTimer = 20;
      for (const e of g.dungeon.enemies) {
        if (!e.alive || dist(p, e) > (spec.radius || 65)) continue;
        for (let h = 0; h < (spec.hits || 3); h++) {
          setTimeout(() => {
            if (e.alive) applyDamageToEnemy(g, e, spec.dmg, 5, Math.atan2(e.y - p.y, e.x - p.x));
          }, h * 100);
        }
      }
      for (let h = 0; h < 6; h++) {
        g.slashEffects.push({
          x: p.x + Math.cos(h * Math.PI / 3) * 30,
          y: p.y + Math.sin(h * Math.PI / 3) * 30,
          frame: 0, timer: -h * 2, angle: h * Math.PI / 3,
        });
      }
    } else if (spec.type === 'buff') {
      p.buffs.push({ type: 'dmg', mult: spec.dmgMult || 1.5, timer: spec.duration || 180 });
      g.damageNumbers.push({ x: p.x, y: p.y - 30, value: 'BERSERK!', timer: 50, color: '#ef4444' });
    } else if (spec.type === 'ground_aoe') {
      g.aoeZones.push({
        x: worldMouseX, y: worldMouseY, radius: spec.radius || 90, dmg: spec.dmg || 40,
        timer: spec.ticks ? spec.ticks * 15 : 20, stun: 0, owner: 'player', color: '#f97316',
        tickInterval: spec.ticks ? 15 : 0, lastTick: 0,
      });
      g.screenShake = 10;
      spawnRandomEffect(g.spriteEffects, 'fire', worldMouseX, worldMouseY,
        { size: 96, scale: 1.2, speed: 2 });
      spawnRandomEffect(g.spriteEffects, 'magic', worldMouseX, worldMouseY,
        { size: 80, scale: 1.0, speed: 3 });
    } else if (spec.type === 'meteor') {
      g.aoeZones.push({
        x: worldMouseX, y: worldMouseY, radius: spec.radius || 90, dmg: spec.dmg || 40,
        timer: 20, stun: 15, owner: 'player', color: '#f97316',
      });
      g.screenShake = 12;
      spawnRandomEffect(g.spriteEffects, 'explosion', worldMouseX, worldMouseY,
        { size: 128, scale: 1.5, speed: 2 });
      spawnRandomEffect(g.spriteEffects, 'fire', worldMouseX, worldMouseY,
        { size: 96, scale: 1.2, speed: 3 });
    }
  }

  function applyDamageToEnemy(g, e, dmg, kb, angle) {
    const p = g.player;
    let finalDmg = dmg;
    const dmgBuff = p.buffs.find(b => b.type === 'dmg');
    if (dmgBuff) finalDmg = Math.floor(finalDmg * dmgBuff.mult);

    e.hp -= finalDmg;
    e.hitTimer = 8;
    g.damageNumbers.push({ x: e.x, y: e.y - 20, value: finalDmg, timer: 40, color: '#fbbf24' });
    g.screenShake = 4;
    playSound('hit', 0.6);
    spawnBlood(g, e.x, e.y, 4 + Math.floor(Math.random() * 3), 2);
    spawnRandomHitFx(g.spriteEffects, e.x, e.y,
      { size: 40, scale: 0.7, speed: 2, angle: angle || 0 });

    if (kb > 0) {
      e.x += Math.cos(angle) * kb;
      e.y += Math.sin(angle) * kb;
    }

    if (e.hp <= 0) {
      e.alive = false;
      e.state = 'dying';
      e.deathTimer = 0;
      if (e.isBoss) e.anim = 'death';
      p.kills++;
      p.xp += e.xp;
      playSound('grunt', 0.8);
      spawnBlood(g, e.x, e.y, 12 + Math.floor(Math.random() * 6), 4);
      if (p.xp >= p.xpToNext) {
        p.level++;
        p.xp -= p.xpToNext;
        p.xpToNext = Math.floor(p.xpToNext * 1.4);
        p.maxHp += 10;
        p.hp = Math.min(p.hp + 20, p.maxHp);
        p.maxMana += 5;
        p.mana = p.maxMana;
        p.baseSpeed += 0.05;
        g.damageNumbers.push({ x: p.x, y: p.y - 40, value: 'LEVEL UP!', timer: 60, color: '#22d3ee' });
        playSound('levelup', 1);
      }
      g.smokeEffects.push({ x: e.x, y: e.y, frame: 0, timer: 0 });

      if (e.isBoss) {
        g.screenShake = 20;
        playSound('explode', 1);
        g.damageNumbers.push({ x: e.x, y: e.y - 60, value: 'BOSS DEFEATED!', timer: 120, color: '#fbbf24' });
        for (let k = 0; k < 5; k++) {
          const ox = (Math.random() - 0.5) * 80;
          const oy = (Math.random() - 0.5) * 80;
          spawnRandomEffect(g.spriteEffects, 'explosion', e.x + ox, e.y + oy,
            { size: 96, scale: 1.2, speed: 2 });
        }
        for (let k = 0; k < 3; k++) {
          dropLoot(g, e.x + (Math.random() - 0.5) * 60, e.y + (Math.random() - 0.5) * 60, g.floor + 2);
        }
        p.hp = Math.min(p.hp + 50, p.maxHp);
        g.damageNumbers.push({ x: p.x, y: p.y - 20, value: '+50 HP', timer: 60, color: '#22c55e' });
      } else {
        spawnRandomEffect(g.spriteEffects, 'explosion', e.x, e.y,
          { size: 64, scale: 0.6, speed: 2 });
        if (Math.random() < 0.5) {
          spawnRandomEffect(g.spriteEffects, 'fire', e.x, e.y,
            { size: 48, scale: 0.5, speed: 3 });
        }
      }

      if (!e.isBoss && Math.random() < 0.12) {
        dropLoot(g, e.x, e.y, g.floor);
      }
      if (Math.random() < 0.2) {
        g.dungeon.lootDrops.push({
          x: e.x, y: e.y, item: { ...CONSUMABLES[0], qty: 1 }, collected: false,
        });
      }
    }
  }

  function dropLoot(g, x, y, floor) {
    const slot = ['body', 'lower', 'weapon'][Math.floor(Math.random() * 3)];
    const pool = EQUIPMENT_DB[slot];
    const maxTier = Math.min(floor, pool.length - 1);
    const tierIdx = randi(0, maxTier);
    g.dungeon.lootDrops.push({
      x, y, item: { ...pool[tierIdx], slot }, collected: false,
    });
  }

  function checkLoot(g) {
    const p = g.player;
    for (const loot of g.dungeon.lootDrops) {
      if (loot.collected) continue;
      if (dist(p, loot) < 24) {
        loot.collected = true;
        if (loot.item.slot) {
          p.equipment[loot.item.slot] = loot.item;
          p.skills = getSkillsFromEquipment(p.equipment);
          g.damageNumbers.push({ x: p.x, y: p.y - 40, value: loot.item.name, timer: 60, color: '#a855f7' });
        } else if (loot.item.qty) {
          const existing = p.inventory.find(i => i.id === loot.item.id);
          if (existing) existing.qty += loot.item.qty;
          else p.inventory.push({ ...loot.item });
          g.damageNumbers.push({ x: p.x, y: p.y - 40, value: `+${loot.item.name}`, timer: 40, color: '#22c55e' });
        }
      }
    }
  }

  function updatePlayer(g, keys, mouse, assets) {
    const p = g.player;
    if (p.dead) {
      p.deathTimer++;
      if (p.deathTimer > 90) {
        g.gameOver = true;
        try {
          const prev = JSON.parse(localStorage.getItem('crypt_stats') || '{}');
          prev.bestFloorBeforeThisRun = prev.bestFloor || 0;
          prev.bestFloor = Math.max(prev.bestFloor || 0, g.floor);
          prev.totalKills = (prev.totalKills || 0) + p.kills;
          prev.gamesPlayed = (prev.gamesPlayed || 0) + 1;
          localStorage.setItem('crypt_stats', JSON.stringify(prev));
        } catch {}
      }
      return;
    }
    if (p.invincible > 0) p.invincible--;
    if (p.dodgeRollTimer > 0) p.dodgeRollTimer--;

    if (p.dashing) {
      const dr = moveStepwise(g.dungeon.grid, p.x, p.y, p.dashDx, p.dashDy, 10, 3);
      p.x = dr.x; p.y = dr.y;
      p.dashTimer--;
      if (p.dashTimer <= 0) p.dashing = false;
      return;
    }

    if (p.burstSkill && p.burstCount > 0) {
      p.burstTimer++;
      if (p.burstTimer % (p.burstSkill.interval || 4) === 0) {
        const a = p.burstSkill.angle + (Math.random() - 0.5) * 0.2;
        g.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
          dmg: p.burstSkill.dmg, range: p.burstSkill.range || 160, traveled: 0,
          projId: p.burstSkill.projId || 10, owner: 'player',
        });
        p.burstCount--;
        if (p.burstCount <= 0) p.burstSkill = null;
      }
    }

    let speedMult = 1;
    for (const b of p.buffs) {
      if (b.type === 'speed') speedMult = Math.max(speedMult, b.mult);
    }
    const spd = p.baseSpeed * speedMult;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const halfW = 10;
    const mv = moveWithSlide(g.dungeon.grid, p.x, p.y, dx * spd, dy * spd, halfW);
    p.x = mv.x; p.y = mv.y;

    const prevAnim = p.heroAnim;
    if (dx !== 0 || dy !== 0) {
      if (dy > 0) p.facing = 'down';
      else if (dy < 0) p.facing = 'up';
      else if (dx > 0) p.facing = 'right';
      else p.facing = 'left';
      p.heroAnim = 'run';
    } else {
      p.heroAnim = 'idle';
    }
    if (prevAnim !== p.heroAnim) { p.frame = 0; p.frameTimer = 0; p.idleHold = 0; }
    if (p.heroAnim === 'run') {
      p.frameTimer++;
      if (p.frameTimer > 6) { p.frame = (p.frame + 1) % 8; p.frameTimer = 0; }
    } else {
      if (p.idleHold > 0) {
        p.idleHold--;
      } else {
        p.frameTimer++;
        if (p.frameTimer > 12) {
          p.frame++;
          p.frameTimer = 0;
          if (p.frame >= 8) { p.frame = 0; p.idleHold = 40 + Math.floor(Math.random() * 20); }
        }
      }
    }

    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.lmbCd > 0) p.lmbCd--;
    if (p.rmbCd > 0) p.rmbCd--;

    for (const cdKey in p.skillCooldowns) {
      if (p.skillCooldowns[cdKey] > 0) p.skillCooldowns[cdKey]--;
    }

    mouse.clicked = false;
    mouse.rightClicked = false;

    if (!g.showUpgradeUI) {
      if (mouse.lmbDown) fireLMB(g);
      if (mouse.rmbDown) fireRMB(g);
    }

    if (p.attackTimer > 0) {
      p.attackTimer--;
      if (p.attackTimer <= 0) {
        p.attacking = false;
        p.attackAnim = p.attackAnim === 1 ? 2 : 1;
      }
    }

    for (const xd of g.dungeon.xpDrops) {
      if (xd.collected) continue;
      if (dist(p, xd) < 24) {
        xd.collected = true;
        p.xp += xd.value;
        g.damageNumbers.push({ x: xd.x, y: xd.y - 10, value: `+${xd.value} XP`, timer: 30, color: '#a855f7' });
        if (p.xp >= p.xpToNext) {
          p.level++;
          p.xp -= p.xpToNext;
          p.xpToNext = Math.floor(p.xpToNext * 1.4);
          p.maxHp += 10;
          p.hp = Math.min(p.hp + 20, p.maxHp);
          p.baseSpeed += 0.05;
          g.damageNumbers.push({ x: p.x, y: p.y - 40, value: 'LEVEL UP!', timer: 60, color: '#22d3ee' });
        }
      }
    }

    for (const e of g.dungeon.enemies) {
      if (!e.alive || p.invincible > 0 || e.stunTimer > 0) continue;
      if (dist(p, e) < 28) {
        let dmg = e.dmg;
        const defBuff = p.buffs.find(b => b.type === 'def');
        if (defBuff) dmg = Math.max(1, dmg - defBuff.bonus);
        if (p.shieldHP > 0) {
          const absorbed = Math.min(dmg, p.shieldHP);
          p.shieldHP -= absorbed;
          dmg -= absorbed;
        }
        if (dmg > 0) {
          p.hp -= dmg;
          g.damageNumbers.push({ x: p.x, y: p.y - 20, value: dmg, timer: 40, color: '#ef4444' });
          playSound('hurt', 0.6);
          spawnBlood(g, p.x, p.y, 4, 2);
        }
        p.invincible = 30;
        g.screenShake = 6;
        if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deathTimer = 0; }
      }
    }
  }

  function updateEnemies(g) {
    const p = g.player;
    for (const e of g.dungeon.enemies) {
      if (e.state === 'dying') {
        e.deathTimer++;
        if (e.deathTimer > 30) e.state = 'dead';
        continue;
      }
      if (!e.alive || e.state === 'dead') continue;
      if (e.hitTimer > 0) e.hitTimer--;
      if (e.stunTimer > 0) { e.stunTimer--; continue; }

      if (e.poisonTicks > 0) {
        if (g.time % 30 === 0) {
          e.hp -= e.poisonDmg;
          e.poisonTicks--;
          g.damageNumbers.push({ x: e.x, y: e.y - 15, value: e.poisonDmg, timer: 20, color: '#22c55e' });
          if (e.hp <= 0) {
            e.alive = false;
            e.state = 'dying';
            e.deathTimer = 0;
            p.kills++;
            p.xp += e.xp;
            g.smokeEffects.push({ x: e.x, y: e.y, frame: 0, timer: 0 });
          }
        }
      }

      const d = dist(p, e);
      if (d < e.aggroRange && !p.dead) {
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const spd = e.speed;
        const edx = Math.cos(angle) * spd;
        const edy = Math.sin(angle) * spd;
        const emv = moveWithSlide(g.dungeon.grid, e.x, e.y, edx, edy, 10);
        e.x = emv.x; e.y = emv.y;
        e.facingDown = p.y > e.y;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          e.facingDir = dx > 0 ? 'right' : 'left';
        } else {
          e.facingDir = dy > 0 ? 'down' : 'up';
        }
        if (d < 36) {
          e.state = 'attacking';
        } else {
          e.state = 'chase';
        }
      } else {
        e.state = 'idle';
      }

      e.frameTimer++;
      if (e.isBoss) {
        const animInfo = MEGA_BOSS.anims[e.anim];
        const maxFrames = animInfo ? animInfo.frames : 8;
        const spd = e.anim === 'idle' ? 12 : 8;
        if (e.frameTimer > spd) {
          e.frame++;
          e.frameTimer = 0;
          if (e.frame >= maxFrames) {
            e.frame = 0;
            if (e.anim === 'appearance') {
              e.anim = 'idle';
              e.appeared = true;
            } else if (e.anim !== 'idle') {
              e.anim = 'idle';
            }
          }
        }

        if (e.appeared && e.state === 'chase' && e.attackCd <= 0) {
          const d2 = dist(p, e);
          if (d2 < 120) {
            const hpPct = e.hp / e.maxHp;
            let currentPhase = MEGA_BOSS.phases[0];
            for (const ph of MEGA_BOSS.phases) {
              if (hpPct <= ph.hpPct) currentPhase = ph;
            }
            const atkList = currentPhase.attacks;
            e.anim = atkList[Math.floor(Math.random() * atkList.length)];
            e.frame = 0;
            e.frameTimer = 0;
            e.attackCd = currentPhase.attackCd;

            const angle = Math.atan2(p.y - e.y, p.x - e.x);
            const bDmg = e.dmg * (e.anim === 'special' ? 2 : 1);
            g.projectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 3.5, vy: Math.sin(angle) * 3.5,
              dmg: bDmg, owner: 'enemy', lifetime: 80,
              explosive: e.anim === 'special',
              explosionRadius: 80,
              size: 12, color: e.anim === 'special' ? '#a855f7' : '#ef4444',
            });
            g.screenShake = 6;
          }
        }
        if (e.attackCd > 0) e.attackCd--;
      } else {
        const isGoblinWarrior = e.id === 9;
        let maxFrames = 6;
        let animSpeed = 10;
        if (isGoblinWarrior) {
          if (e.state === 'attacking') { maxFrames = 7; animSpeed = 6; }
          else if (e.state === 'idle') { maxFrames = 3; animSpeed = 14; }
          else if (e.state === 'dying') { maxFrames = 8; animSpeed = 6; }
          else { maxFrames = 6; animSpeed = 8; }
        }
        if (e.frameTimer > animSpeed) {
          e.frame = (e.frame + 1) % maxFrames;
          e.frameTimer = 0;
        }
      }
    }
  }

  function updateProjectiles(g) {
    for (let i = g.projectiles.length - 1; i >= 0; i--) {
      const pr = g.projectiles[i];

      if (pr.spawnDelay && pr.spawnDelay > 0) {
        pr.spawnDelay--;
        continue;
      }

      if (pr.homing && pr.homing > 0) {
        let closest = null, closestD = 300;
        for (const e of g.dungeon.enemies) {
          if (!e.alive) continue;
          const d = dist(pr, e);
          if (d < closestD) { closestD = d; closest = e; }
        }
        if (closest) {
          const desired = Math.atan2(closest.y - pr.y, closest.x - pr.x);
          const current = Math.atan2(pr.vy, pr.vx);
          let diff = desired - current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = Math.sign(diff) * Math.min(Math.abs(diff), pr.homing);
          const newAngle = current + turn;
          const spd = Math.sqrt(pr.vx ** 2 + pr.vy ** 2);
          pr.vx = Math.cos(newAngle) * spd;
          pr.vy = Math.sin(newAngle) * spd;
        }
      }

      if (pr.isRocket) {
        g.rocketTrails.push({
          x: pr.x, y: pr.y, timer: 12,
          color: pr.rocketLevel >= 7 ? '#ef4444' : pr.rocketLevel >= 4 ? '#f97316' : '#fbbf24',
          size: 3 + pr.rocketLevel * 0.3,
        });
      }

      if (pr.lmbBolt) {
        g.rocketTrails.push({
          x: pr.x - pr.vx * 0.5, y: pr.y - pr.vy * 0.5, timer: 8,
          color: pr.boltLevel >= 7 ? '#22d3ee' : pr.boltLevel >= 4 ? '#06b6d4' : '#38bdf8',
          size: 2 + pr.boltLevel * 0.2,
        });
      }

      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.traveled += Math.sqrt(pr.vx ** 2 + pr.vy ** 2);

      const gx = Math.floor(pr.x / TILE), gy = Math.floor(pr.y / TILE);
      if (gx < 0 || gx >= MAP_W || gy < 0 || gy >= MAP_H || g.dungeon.grid[gy][gx] === 1 || pr.traveled > pr.range) {
        if (pr.explosive) {
          g.aoeZones.push({
            x: pr.x, y: pr.y, radius: pr.explosionRadius || 60, dmg: pr.dmg,
            timer: 15, stun: 0, owner: 'player', color: pr.isRocket ? '#f97316' : '#f97316',
          });
          g.smokeEffects.push({ x: pr.x, y: pr.y, frame: 0, timer: 0 });
          g.screenShake = pr.isRocket ? 8 : 6;
          playSound('explode', 0.5);
          const expIdx = 1 + Math.floor(Math.random() * 10);
          const expScale = 0.8 + (pr.explosionRadius || 60) / 80;
          spawnEffect(g.spriteEffects, `explosion${expIdx}`, pr.x, pr.y,
            { size: 96, scale: expScale, speed: 2 });
          if (pr.rocketLevel >= 5) {
            const fireIdx = 1 + Math.floor(Math.random() * 10);
            spawnEffect(g.spriteEffects, `fire${fireIdx}`, pr.x, pr.y,
              { size: 64, scale: expScale * 0.7, speed: 3 });
          }
          for (let sp = 0; sp < 6; sp++) {
            const sa = Math.random() * Math.PI * 2;
            const sr = Math.random() * (pr.explosionRadius || 60) * 0.6;
            g.rocketTrails.push({
              x: pr.x + Math.cos(sa) * sr, y: pr.y + Math.sin(sa) * sr,
              timer: 10 + Math.random() * 8,
              color: ['#f97316', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 3)],
              size: 3 + Math.random() * 4,
            });
          }
        } else if (pr.lmbBolt) {
          const magicIdx = 1 + Math.floor(Math.random() * 10);
          spawnEffect(g.spriteEffects, `magic${magicIdx}`, pr.x, pr.y,
            { size: 48, scale: 0.5 + pr.boltLevel * 0.05, speed: 2 });
        }
        g.projectiles.splice(i, 1);
        continue;
      }

      if (pr.owner === 'player') {
        for (const e of g.dungeon.enemies) {
          if (!e.alive) continue;
          if (dist(pr, e) < 24) {
            const angle = Math.atan2(pr.vy, pr.vx);
            if (pr.explosive) {
              g.aoeZones.push({
                x: pr.x, y: pr.y, radius: pr.explosionRadius || 60, dmg: pr.dmg,
                timer: 15, stun: 0, owner: 'player', color: '#f97316',
              });
              g.smokeEffects.push({ x: pr.x, y: pr.y, frame: 0, timer: 0 });
              g.screenShake = pr.isRocket ? 8 : 6;
              const hitExpIdx = 1 + Math.floor(Math.random() * 10);
              const hitExpScale = 0.8 + (pr.explosionRadius || 60) / 80;
              spawnEffect(g.spriteEffects, `explosion${hitExpIdx}`, pr.x, pr.y,
                { size: 96, scale: hitExpScale, speed: 2 });
              if (pr.rocketLevel >= 5) {
                spawnRandomEffect(g.spriteEffects, 'fire', pr.x, pr.y,
                  { size: 64, scale: hitExpScale * 0.7, speed: 3 });
              }
              for (let sp = 0; sp < 6; sp++) {
                const sa = Math.random() * Math.PI * 2;
                const sr = Math.random() * (pr.explosionRadius || 60) * 0.5;
                g.rocketTrails.push({
                  x: pr.x + Math.cos(sa) * sr, y: pr.y + Math.sin(sa) * sr,
                  timer: 8 + Math.random() * 6,
                  color: ['#f97316', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 3)],
                  size: 3 + Math.random() * 3,
                });
              }
              g.projectiles.splice(i, 1);
              break;
            } else if (pr.pierce) {
              pr._hitEnemies = pr._hitEnemies || [];
              if (!pr._hitEnemies.includes(e)) {
                applyDamageToEnemy(g, e, pr.dmg + Math.floor(Math.random() * 5), 2, angle);
                pr._hitEnemies.push(e);
                spawnRandomEffect(g.spriteEffects, 'slash', e.x, e.y,
                  { size: 48, scale: 0.5, speed: 2, angle });
              }
            } else {
              applyDamageToEnemy(g, e, pr.dmg + Math.floor(Math.random() * 5), 3, angle);
              if (pr.lmbBolt) {
                spawnRandomEffect(g.spriteEffects, 'magic', e.x, e.y,
                  { size: 56, scale: 0.5 + pr.boltLevel * 0.04, speed: 2 });
              } else {
                spawnRandomEffect(g.spriteEffects, 'slash', e.x, e.y,
                  { size: 48, scale: 0.6, speed: 2, angle });
              }
              g.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }

      if (pr.owner === 'enemy') {
        const p = g.player;
        if (!p.dead && p.invincible <= 0 && dist(pr, p) < 20) {
          let dmg = pr.dmg;
          const defBuff = p.buffs.find(b => b.type === 'def');
          if (defBuff) dmg = Math.floor(dmg * 0.6);
          if (p.shieldHP > 0) {
            const absorbed = Math.min(p.shieldHP, dmg);
            p.shieldHP -= absorbed;
            dmg -= absorbed;
          }
          if (dmg > 0) {
            p.hp -= dmg;
            p.invincible = 30;
            g.screenShake = 6;
            g.damageNumbers.push({ x: p.x, y: p.y - 20, value: dmg, timer: 40, color: '#ef4444' });
            spawnRandomEffect(g.spriteEffects, 'slash', p.x, p.y,
              { size: 48, scale: 0.5, speed: 2 });
            playSound('hurt', 0.7);
            spawnBlood(g, p.x, p.y, 5, 2);
            if (p.hp <= 0) {
              p.dead = true;
              p.hp = 0;
            }
          }
          if (pr.explosive) {
            g.aoeZones.push({
              x: pr.x, y: pr.y, radius: pr.explosionRadius || 80, dmg: Math.floor(pr.dmg * 0.5),
              timer: 15, stun: 0, owner: 'enemy', color: '#a855f7',
            });
            spawnRandomEffect(g.spriteEffects, 'explosion', pr.x, pr.y,
              { size: 96, scale: 1, speed: 2 });
            g.screenShake = 10;
          }
          g.projectiles.splice(i, 1);
          continue;
        }
      }
    }

    for (let i = g.rocketTrails.length - 1; i >= 0; i--) {
      g.rocketTrails[i].timer--;
      if (g.rocketTrails[i].timer <= 0) g.rocketTrails.splice(i, 1);
    }
  }

  function applyTrapDmg(g, dmg, color) {
    const p = g.player;
    if (p.invincible > 0 || p.dead) return;
    if (p.shieldHP > 0) { const a = Math.min(dmg, p.shieldHP); p.shieldHP -= a; dmg -= a; }
    if (dmg > 0) { p.hp -= dmg; g.damageNumbers.push({ x: p.x, y: p.y - 20, value: dmg, timer: 40, color }); playSound('hurt', 0.5); spawnBlood(g, p.x, p.y, 3, 1.5); }
    p.invincible = 50;
    g.screenShake = 5;
    if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deathTimer = 0; }
  }

  function updateTraps(g) {
    const p = g.player;
    for (const t of g.dungeon.traps) {
      if (!t.active) continue;
      t.timer++;

      if (t.type === 'electric') {
        t.frame = Math.floor(t.timer / 12) % 4;
        const on = Math.floor(t.timer / 80) % 3 !== 2;
        if (on && dist(p, t) < 30) applyTrapDmg(g, 12, '#60a5fa');
      } else if (t.type === 'firebreath') {
        t.frame = Math.floor(t.timer / 10) % 6;
        const on = Math.floor(t.timer / 100) % 2 === 0;
        const dx = p.x - t.x, dy = p.y - t.y;
        const pAngle = Math.atan2(dy, dx);
        let aDiff = pAngle - t.angle;
        while (aDiff > Math.PI) aDiff -= Math.PI * 2;
        while (aDiff < -Math.PI) aDiff += Math.PI * 2;
        if (on && Math.abs(aDiff) < 0.6 && dist(p, t) < 80) applyTrapDmg(g, 10, '#f97316');
      } else if (t.type === 'gear') {
        t.frame = Math.floor(t.timer / 8) % 8;
        if (dist(p, t) < 22) applyTrapDmg(g, 8, '#94a3b8');
      } else if (t.type === 'laser') {
        t.frame = Math.floor(t.timer / 14) % 4;
        const on = Math.floor(t.timer / 70) % 3 !== 0;
        const dx = p.x - t.x, dy = p.y - t.y;
        const beamDx = Math.cos(t.angle), beamDy = Math.sin(t.angle);
        const proj = dx * beamDx + dy * beamDy;
        const perp = Math.abs(dx * beamDy - dy * beamDx);
        if (on && proj > 0 && proj < 120 && perp < 10) applyTrapDmg(g, 14, '#ef4444');
      }
    }
  }

  function updateAOEZones(g) {
    for (let i = g.aoeZones.length - 1; i >= 0; i--) {
      const zone = g.aoeZones[i];
      zone.timer--;

      if (zone.tickInterval) {
        zone.lastTick = (zone.lastTick || 0) + 1;
        if (zone.lastTick >= zone.tickInterval) {
          zone.lastTick = 0;
          if (zone.owner === 'player') {
            for (const e of g.dungeon.enemies) {
              if (!e.alive) continue;
              if (dist(zone, e) < zone.radius) {
                applyDamageToEnemy(g, e, zone.dmg, 0, 0);
                if (zone.stun > 0) e.stunTimer = zone.stun;
              }
            }
          }
        }
      } else if (zone.timer === 14 || zone.timer === 0) {
        if (zone.owner === 'player') {
          for (const e of g.dungeon.enemies) {
            if (!e.alive) continue;
            if (dist(zone, e) < zone.radius) {
              applyDamageToEnemy(g, e, zone.dmg, 0, 0);
              if (zone.stun > 0) e.stunTimer = zone.stun;
            }
          }
        }
      }

      if (zone.timer <= 0) g.aoeZones.splice(i, 1);
    }
  }

  function updateBuffs(g) {
    const p = g.player;
    for (let i = p.buffs.length - 1; i >= 0; i--) {
      p.buffs[i].timer--;
      if (p.buffs[i].timer <= 0) {
        if (p.buffs[i].type === 'shield') p.shieldHP = 0;
        p.buffs.splice(i, 1);
      }
    }
  }

  function updateParticles(g) {
    for (let i = g.slashEffects.length - 1; i >= 0; i--) {
      const s = g.slashEffects[i];
      s.timer++;
      if (s.timer > 3) { s.frame++; s.timer = 0; }
      if (s.frame >= 10) g.slashEffects.splice(i, 1);
    }
    for (let i = g.smokeEffects.length - 1; i >= 0; i--) {
      const s = g.smokeEffects[i];
      s.timer++;
      if (s.timer > 4) { s.frame++; s.timer = 0; }
      if (s.frame >= 10) g.smokeEffects.splice(i, 1);
    }
    updateSpriteEffects(g.spriteEffects);
    for (let i = g.muzzleFlashes.length - 1; i >= 0; i--) {
      const m = g.muzzleFlashes[i];
      m.timer++;
      if (m.timer > 2) { m.frame++; m.timer = 0; }
      if (m.frame >= 5) g.muzzleFlashes.splice(i, 1);
    }
    for (let i = g.damageNumbers.length - 1; i >= 0; i--) {
      g.damageNumbers[i].timer--;
      g.damageNumbers[i].y -= 0.8;
      if (g.damageNumbers[i].timer <= 0) g.damageNumbers.splice(i, 1);
    }
    if (g.screenShake > 0) g.screenShake--;
  }

  function updateCamera(g) {
    const p = g.player;
    const targetX = p.x - W / 2;
    const targetY = p.y - H / 2;
    const dx = targetX - g.camera.x;
    const dy = targetY - g.camera.y;
    const deadZone = 4;
    if (Math.abs(dx) > deadZone || Math.abs(dy) > deadZone) {
      const speed = g.camera.snap ? 1.0 : 0.18;
      g.camera.x += dx * speed;
      g.camera.y += dy * speed;
      if (g.camera.snap) g.camera.snap = false;
    }
    g.camera.x = clamp(g.camera.x, 0, MAP_W * TILE - W);
    g.camera.y = clamp(g.camera.y, 0, MAP_H * TILE - H);
  }

  function checkPortal(g) {
    const alive = g.dungeon.enemies.filter(e => e.alive).length;
    g.dungeon.portal.active = alive === 0;
    if (g.dungeon.portal.active) {
      g.dungeon.portal.frame = (g.dungeon.portal.frame + 0.05) % 2;
      if (dist(g.player, g.dungeon.portal) < 30 && !g.showUpgradeUI) {
        g.showUpgradeUI = true;
        g.upgradeFloorPending = g.floor + 1;
      }
    }
  }

  function applyUpgradeChoice(g, choice) {
    const p = g.player;
    if (choice === 'lmb' && p.lmbLevel < 9) {
      p.lmbLevel++;
      g.damageNumbers.push({ x: p.x, y: p.y - 40, value: `LMB → ${LMB_LEVELS[p.lmbLevel].name}`, timer: 80, color: '#06b6d4' });
    } else if (choice === 'rmb' && p.rmbLevel < 9) {
      p.rmbLevel++;
      g.damageNumbers.push({ x: p.x, y: p.y - 40, value: `RMB → ${RMB_LEVELS[p.rmbLevel].name}`, timer: 80, color: '#f97316' });
    }
    g.showUpgradeUI = false;
    g.floor = g.upgradeFloorPending;
    const dungeon = generateDungeon(g.floor);
    g.dungeon = dungeon;
    g.player.x = dungeon.spawnX;
    g.player.y = dungeon.spawnY;
    g.player.hp = Math.min(g.player.hp + 30, g.player.maxHp);
    g.camera.snap = true;
    g.projectiles = [];
    g.slashEffects = [];
    g.smokeEffects = [];
    g.spriteEffects = [];
    g.muzzleFlashes = [];
    g.aoeZones = [];
    g.rocketTrails = [];
    g.bloodParticles = [];
    playSound('portal', 0.8);
    g.damageNumbers.push({ x: g.player.x, y: g.player.y - 50, value: `FLOOR ${g.floor}`, timer: 90, color: '#fbbf24' });
    if (g.floor > 0 && g.floor % 5 === 0) {
      g.damageNumbers.push({ x: g.player.x, y: g.player.y - 80, value: 'BOSS FLOOR!', timer: 150, color: '#ef4444' });
      g.screenShake = 10;
    }
  }

  function render(ctx, g, a) {
    const shakeAmt = g.screenShake > 0 ? g.screenShake * 1.5 : 0;
    const shakeX = shakeAmt > 0 ? Math.sin(g.time * 1.7) * shakeAmt * (Math.random() * 0.4 + 0.6) : 0;
    const shakeY = shakeAmt > 0 ? Math.cos(g.time * 2.3) * shakeAmt * (Math.random() * 0.4 + 0.6) : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    const cx = g.camera.x, cy = g.camera.y;
    const startCol = Math.floor(cx / TILE);
    const startRow = Math.floor(cy / TILE);
    const endCol = Math.min(startCol + Math.ceil(W / TILE) + 2, MAP_W);
    const endRow = Math.min(startRow + Math.ceil(H / TILE) + 2, MAP_H);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (col < 0 || row < 0) continue;
        const dx = col * TILE - cx;
        const dy = row * TILE - cy;
        const tileIdx = getTileType(col, row, g.dungeon.grid);
        if (tileIdx === 0) {
          ctx.fillStyle = WALL_BG_COLOR;
          ctx.fillRect(dx, dy, TILE, TILE);
          continue;
        }
        const tile = a.tiles[tileIdx - 1];
        if (tile) {
          if (g.dungeon.grid[row]?.[col] === 1) {
            ctx.fillStyle = WALL_BG_COLOR;
            ctx.fillRect(dx, dy, TILE, TILE);
          }
          ctx.drawImage(tile, dx, dy, TILE, TILE);
        } else {
          ctx.fillStyle = g.dungeon.grid[row]?.[col] === 1 ? WALL_BG_COLOR : '#2a2a3e';
          ctx.fillRect(dx, dy, TILE, TILE);
        }
      }
    }

    if (a.obstacleDecos && g.dungeon.decorations) {
      for (const dec of g.dungeon.decorations) {
        const sx = dec.x - cx, sy = dec.y - cy;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
        const img = a.obstacleDecos[dec.spriteIdx];
        if (img) {
          const dw = img.width * dec.scale;
          const dh = img.height * dec.scale;
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.drawImage(img, sx - dw / 2, sy - dh / 2, dw, dh);
          ctx.restore();
        }
      }
    }

    for (const zone of g.aoeZones) {
      const sx = zone.x - cx, sy = zone.y - cy;
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(g.time * 0.2) * 0.1;
      ctx.fillStyle = zone.color || '#06b6d4';
      ctx.beginPath();
      ctx.arc(sx, sy, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = zone.color || '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    for (const t of g.dungeon.traps) {
      if (!t.active) continue;
      const sx = t.x - cx, sy = t.y - cy;
      if (sx < -120 || sx > W + 120 || sy < -120 || sy > H + 120) continue;

      if (t.type === 'electric') {
        const frames = t.variant === 1 ? a.trapElectric1 : a.trapElectric2;
        const on = Math.floor(t.timer / 80) % 3 !== 2;
        if (on && frames) {
          const img = frames[t.frame % frames.length];
          if (img) {
            const scale = 0.08;
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t.angle);
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
          }
        } else {
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = '#60a5fa';
          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (t.type === 'firebreath') {
        const frames = a.trapFirebreath;
        const on = Math.floor(t.timer / 100) % 2 === 0;
        ctx.save();
        ctx.fillStyle = '#f9731633';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (on && frames) {
          const img = frames[t.frame % frames.length];
          if (img) {
            const scale = 0.1;
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t.angle);
            ctx.drawImage(img, 0, -dh / 2, dw, dh);
            ctx.restore();
          }
        }
      } else if (t.type === 'gear') {
        const frames = a.trapGear;
        if (frames) {
          const img = frames[t.frame % frames.length];
          if (img) {
            const scale = 0.2;
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t.timer * 0.04);
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
          }
        }
      } else if (t.type === 'laser') {
        const frames = a.trapLaser;
        const on = Math.floor(t.timer / 70) % 3 !== 0;
        ctx.save();
        ctx.fillStyle = on ? '#ef444466' : '#ef444422';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (on && frames) {
          const img = frames[t.frame % frames.length];
          if (img) {
            const scale = 0.08;
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(t.angle);
            ctx.drawImage(img, 0, -dh / 2, dw, dh);
            ctx.restore();
          }
        }
      }
    }

    if (g.dungeon.portal.active) {
      const portal = g.dungeon.portal;
      const sx = portal.x - cx, sy = portal.y - cy;
      const pImg = a.portal[Math.floor(portal.frame) % 2];
      if (pImg) {
        ctx.save();
        const glow = 0.5 + Math.sin(g.time * 0.1) * 0.3;
        ctx.globalAlpha = glow;
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(sx, sy, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.drawImage(pImg, sx - 20, sy - 20, 40, 40);
        ctx.restore();
      }
    }

    for (const xd of g.dungeon.xpDrops) {
      if (xd.collected) continue;
      const sx = xd.x - cx, sy = xd.y - cy;
      if (sx < -32 || sx > W + 32 || sy < -32 || sy > H + 32) continue;
      const img = a.xpItems[xd.type - 1];
      if (img) {
        const bob = Math.sin(g.time * 0.05 + xd.x) * 3;
        ctx.drawImage(img, sx - 8, sy - 8 + bob, 16, 16);
      }
    }

    for (const loot of g.dungeon.lootDrops) {
      if (loot.collected) continue;
      const sx = loot.x - cx, sy = loot.y - cy;
      if (sx < -32 || sx > W + 32 || sy < -32 || sy > H + 32) continue;
      const bob = Math.sin(g.time * 0.06 + loot.x) * 4;
      const glow = 0.6 + Math.sin(g.time * 0.08) * 0.3;
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = loot.item.slot ? '#a855f7' : '#22c55e';
      ctx.beginPath();
      ctx.arc(sx, sy + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px "Jost"';
      ctx.textAlign = 'center';
      ctx.fillText(loot.item.slot ? '⚔' : '♥', sx, sy + bob + 3);
      ctx.restore();
    }

    for (const e of g.dungeon.enemies) {
      if (e.state === 'dead') continue;
      const sx = e.x - cx, sy = e.y - cy;
      if (sx < -64 || sx > W + 64 || sy < -64 || sy > H + 64) continue;

      if (e.isBoss && a.megaBossSprites) {
        const animKey = e.anim || 'idle';
        const spriteSheet = a.megaBossSprites[animKey] || a.megaBossSprites.idle;
        const animInfo = MEGA_BOSS.anims[animKey] || MEGA_BOSS.anims.idle;
        if (spriteSheet) {
          const fw = MEGA_BOSS.frameSize;
          const fh = spriteSheet.height;
          const f = e.frame % animInfo.frames;
          const bossScale = DRAW_SCALE * 2.5;
          const drawW = fw * bossScale;
          const drawH = fh * bossScale;

          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (e.state === 'dying') {
            ctx.globalAlpha = Math.max(0, 1 - e.deathTimer / 30);
          }
          if (e.hitTimer > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(e.hitTimer * 2) * 0.5;
            ctx.filter = 'brightness(2) saturate(0.5)';
          }
          if (e.facingDir === 'left') {
            ctx.translate(sx, sy);
            ctx.scale(-1, 1);
            ctx.drawImage(spriteSheet, f * fw, 0, fw, fh, -drawW / 2, -drawH / 2, drawW, drawH);
          } else {
            ctx.drawImage(spriteSheet, f * fw, 0, fw, fh, sx - drawW / 2, sy - drawH / 2, drawW, drawH);
          }
          ctx.restore();

          if (e.alive && e.state !== 'dying') {
            const barW = 80, barH = 6;
            const hpRatio = e.hp / e.maxHp;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(sx - barW / 2 - 1, sy - drawH / 2 - 14, barW + 2, barH + 2);
            ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
            ctx.fillRect(sx - barW / 2, sy - drawH / 2 - 13, barW * hpRatio, barH);
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px "Cinzel"';
            ctx.textAlign = 'center';
            ctx.fillText('CRYPT OVERLORD', sx, sy - drawH / 2 - 20);
            const phaseTxt = hpRatio > 0.6 ? 'Phase 1' : hpRatio > 0.3 ? 'Phase 2' : 'Phase 3 - ENRAGED';
            ctx.fillStyle = hpRatio > 0.3 ? '#a855f7' : '#ef4444';
            ctx.font = '8px "Jost"';
            ctx.fillText(phaseTxt, sx, sy - drawH / 2 - 28);
          }
          ctx.restore();
        }
        continue;
      }

      const isNewType = e.id >= 7;
      const isGoblinWarrior = e.id === 9;
      const eAsset = isNewType ? a.newEnemies?.[e.id - 7] : a.enemies[e.id - 1];
      if (!eAsset) continue;

      let spriteSheet;
      let frameCount;
      let useStateSprite = false;
      const gob = a.goblinStateSprites;

      if (isGoblinWarrior && gob) {
        useStateSprite = true;
        if (e.state === 'dying') {
          spriteSheet = gob.death;
          frameCount = gob.frameCounts.death;
          e.frame = Math.min(Math.floor(e.deathTimer / 5), frameCount - 1);
        } else if (e.state === 'attacking') {
          spriteSheet = gob.attack;
          frameCount = gob.frameCounts.attack;
        } else if (e.state === 'idle') {
          spriteSheet = gob.idle;
          frameCount = gob.frameCounts.idle;
        } else {
          spriteSheet = gob.run;
          frameCount = gob.frameCounts.run;
        }
      } else if (e.state === 'dying') {
        spriteSheet = e.facingDown ? eAsset.deathSD : eAsset.deathSU;
        frameCount = 4;
        e.frame = Math.min(Math.floor(e.deathTimer / 8), 3);
      } else if (isNewType && eAsset.runLeft && eAsset.runRight) {
        if (e.facingDir === 'left') spriteSheet = eAsset.runLeft;
        else if (e.facingDir === 'right') spriteSheet = eAsset.runRight;
        else spriteSheet = e.facingDown ? eAsset.runSD : eAsset.runSU;
        frameCount = 6;
      } else {
        spriteSheet = e.facingDown ? eAsset.runSD : eAsset.runSU;
        frameCount = 6;
      }

      if (spriteSheet) {
        let fw, fh, srcX, srcY, drawW, drawH;
        if (useStateSprite) {
          fw = gob.frameSize;
          fh = gob.frameSize;
          srcX = (e.frame % frameCount) * fw;
          srcY = 0;
          const gobScale = 0.14;
          drawW = fw * gobScale;
          drawH = fh * gobScale;
        } else {
          fw = spriteSheet.width / frameCount;
          fh = spriteSheet.height;
          srcX = (e.frame % frameCount) * fw;
          srcY = 0;
          drawW = fw * DRAW_SCALE;
          drawH = fh * DRAW_SCALE;
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        if (e.hitTimer > 0) ctx.globalAlpha = 0.5 + Math.sin(e.hitTimer * 2) * 0.5;
        if (e.stunTimer > 0) ctx.filter = 'brightness(1.5) hue-rotate(180deg)';
        if (e.poisonTicks > 0) ctx.filter = 'hue-rotate(90deg) brightness(0.8)';
        ctx.drawImage(spriteSheet, srcX, srcY, fw, fh, sx - drawW / 2, sy - drawH / 2, drawW, drawH);
        ctx.restore();

        if (e.alive && e.state !== 'dying') {
          const barW = 40, barH = 4;
          const hpRatio = e.hp / e.maxHp;
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(sx - barW / 2, sy - drawH / 2 - 8, barW, barH);
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
          ctx.fillRect(sx - barW / 2, sy - drawH / 2 - 8, barW * hpRatio, barH);
        }
      }
    }

    const p = g.player;
    const px = p.x - cx, py = p.y - cy;

    if (!p.dead) {
      const isMachine = g.charType === 'machine';

      if (isMachine) {
        const walkFrames = a.heroWalk;
        const f = p.heroAnim === 'run' ? (p.frame % 3) : 1;
        const sheet = walkFrames[f];
        if (sheet) {
          const heroScale = DRAW_SCALE * 1.4;
          const drawW = sheet.width * heroScale;
          const drawH = sheet.height * heroScale;

          if (p.shieldHP > 0) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(px, py, drawW * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          ctx.save();
          ctx.imageSmoothingEnabled = false;

          if (p.dodgeRollTimer > 0) {
            const rollProgress = 1 - (p.dodgeRollTimer / 8);
            ctx.translate(px, py);
            ctx.rotate(rollProgress * Math.PI * 2);
            ctx.globalAlpha = 0.5 + rollProgress * 0.5;
            ctx.drawImage(sheet, -drawW / 2, -drawH / 2, drawW, drawH);
          } else if (p.facing === 'left') {
            ctx.translate(px, py);
            ctx.scale(-1, 1);
            if (!p.attacking && p.heroAnim === 'idle') {
              const breathT = (g.time || 0) * 0.04;
              const bobY = Math.sin(breathT) * 1.5;
              ctx.drawImage(sheet, -drawW / 2, -drawH / 2 + bobY, drawW, drawH);
            } else {
              ctx.drawImage(sheet, -drawW / 2, -drawH / 2, drawW, drawH);
            }
          } else {
            if (!p.attacking && p.heroAnim === 'idle') {
              const breathT = (g.time || 0) * 0.04;
              const bobY = Math.sin(breathT) * 1.5;
              ctx.drawImage(sheet, px - drawW / 2, py - drawH / 2 + bobY, drawW, drawH);
            } else {
              ctx.drawImage(sheet, px - drawW / 2, py - drawH / 2, drawW, drawH);
            }
          }
          ctx.restore();

          if (p.invincible > 0 && p.invincible % 4 < 2) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(px - drawW / 2, py - drawH / 2, drawW, drawH);
            ctx.restore();
          }
        }
      } else {
        const adv = a.adventurer;
        const dirIdx = adv.dirs.indexOf(p.facing);
        let animSet = adv.idle;
        let f;
        const isAtk = p.attacking && p.attackTimer > 2;
        if (isAtk) {
          animSet = p.attackAnim === 1 ? adv.attack1 : adv.attack2;
          const atkProgress = 1 - (p.attackTimer / 12);
          f = Math.min(Math.floor(atkProgress * adv.frameCount), adv.frameCount - 1);
        } else if (p.heroAnim === 'run') {
          animSet = adv.run;
          f = p.frame % adv.frameCount;
        } else {
          f = p.frame % adv.frameCount;
        }
        const sheet = animSet[dirIdx >= 0 ? dirIdx : 0];
        if (sheet) {
          const fw = adv.frameW;
          const fh = adv.frameH;
          const heroScale = 2.2;
          const drawW = fw * heroScale;
          const drawH = fh * heroScale;

          if (p.shieldHP > 0) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(px, py, drawW * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          ctx.save();
          ctx.imageSmoothingEnabled = false;

          if (p.dodgeRollTimer > 0) {
            const rollProgress = 1 - (p.dodgeRollTimer / 8);
            ctx.translate(px, py);
            ctx.rotate(rollProgress * Math.PI * 2);
            ctx.globalAlpha = 0.5 + rollProgress * 0.5;
            ctx.drawImage(sheet, f * fw, 0, fw, fh, -drawW / 2, -drawH / 2, drawW, drawH);
          } else if (!isAtk && p.heroAnim === 'idle') {
            const breathT = (g.time || 0) * 0.04;
            const bobY = Math.sin(breathT) * 1.5;
            const breathScale = 1 + Math.sin(breathT * 0.5) * 0.012;
            const bw = drawW * breathScale;
            const bh = drawH * breathScale;
            ctx.drawImage(sheet, f * fw, 0, fw, fh, px - bw / 2, py - bh / 2 + bobY, bw, bh);
          } else {
            ctx.drawImage(sheet, f * fw, 0, fw, fh, px - drawW / 2, py - drawH / 2, drawW, drawH);
          }
          ctx.restore();

          if (p.invincible > 0 && p.invincible % 4 < 2) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(px - drawW / 2, py - drawH / 2, drawW, drawH);
            ctx.restore();
          }
        }
      }

      if (p.dodgeRollTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.15 + (p.dodgeRollTimer / 8) * 0.2;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(px, py, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const worldMx = mouseRef.current.x + cx;
      const worldMy = mouseRef.current.y + cy;
      const weapAngle = Math.atan2(worldMy - p.y, worldMx - p.x);
      const weapIdx = Math.min(Math.floor((p.equipment?.weapon?.tier || 0) * 3), 8);
      const weapImg = a.weapons[weapIdx];
      if (weapImg) {
        const weapLen = 28 + (p.attacking ? 6 : 0);
        const weapScale = 0.75 + (p.attacking ? 0.1 : 0);
        const bobAngle = p.attacking ? Math.sin(p.attackTimer * 0.8) * 0.15 : Math.sin(g.time * 0.06) * 0.04;
        const tipX = px + Math.cos(weapAngle) * 10;
        const tipY = py + Math.sin(weapAngle) * 10;
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(weapAngle + Math.PI * 0.25 + bobAngle);
        const ww = weapImg.width * weapScale;
        const wh = weapImg.height * weapScale;
        ctx.drawImage(weapImg, -ww * 0.2, -wh * 0.8, ww, wh);
        ctx.restore();

        if (p.attacking && p.attackTimer > 4) {
          ctx.save();
          ctx.translate(tipX + Math.cos(weapAngle) * weapLen * 0.5, tipY + Math.sin(weapAngle) * weapLen * 0.5);
          ctx.rotate(weapAngle);
          ctx.globalAlpha = 0.25 + (p.attackTimer / 14) * 0.3;
          const trailLen = 18 + p.attackTimer * 1.5;
          const grad = ctx.createLinearGradient(0, 0, trailLen, 0);
          grad.addColorStop(0, 'rgba(6,182,212,0.6)');
          grad.addColorStop(1, 'rgba(6,182,212,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.lineTo(trailLen, 0);
          ctx.lineTo(0, 3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    } else {
      const deathSheet = g.charType === 'machine' ? a.heroDeath[0] : a.heroDeath[0];
      if (deathSheet) {
        const fw = deathSheet.width / 4;
        const fh = deathSheet.height;
        const f = Math.min(Math.floor(p.deathTimer / 12), 3);
        ctx.drawImage(deathSheet, f * fw, 0, fw, fh, px - fw * DRAW_SCALE / 2, py - fh * DRAW_SCALE / 2, fw * DRAW_SCALE, fh * DRAW_SCALE);
      }
    }

    for (const trail of g.rocketTrails) {
      const sx = trail.x - cx, sy = trail.y - cy;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      ctx.save();
      ctx.globalAlpha = trail.timer / 14;
      ctx.fillStyle = trail.color;
      ctx.beginPath();
      ctx.arc(sx, sy, trail.size * (trail.timer / 14), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const pr of g.projectiles) {
      if (pr.spawnDelay && pr.spawnDelay > 0) continue;
      const sx = pr.x - cx, sy = pr.y - cy;
      if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;
      const angle = Math.atan2(pr.vy, pr.vx);

      if (pr.isRocket) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        const rSize = 6 + pr.rocketLevel * 0.5;
        const grad = ctx.createLinearGradient(-rSize, 0, rSize, 0);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#fbbf24');
        grad.addColorStop(1, '#ef4444');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rSize, 0);
        ctx.lineTo(-rSize, -rSize * 0.5);
        ctx.lineTo(-rSize * 0.6, 0);
        ctx.lineTo(-rSize, rSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(rSize * 0.3, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(sx - Math.cos(angle) * 10, sy - Math.sin(angle) * 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.lmbBolt) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        const bSize = 5 + pr.boltLevel * 0.4;
        ctx.fillStyle = pr.boltLevel >= 7 ? '#22d3ee' : pr.boltLevel >= 4 ? '#06b6d4' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(bSize, 0);
        ctx.lineTo(-bSize * 0.5, -bSize * 0.4);
        ctx.lineTo(-bSize * 0.5, bSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8 + pr.boltLevel;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      } else if (pr.owner === 'enemy') {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        const eSize = pr.size || 8;
        const eColor = pr.color || '#ef4444';
        ctx.fillStyle = eColor;
        ctx.shadowColor = eColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(eSize, 0);
        ctx.lineTo(-eSize * 0.6, -eSize * 0.5);
        ctx.lineTo(-eSize * 0.3, 0);
        ctx.lineTo(-eSize * 0.6, eSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(eSize * 0.3, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = eColor;
        ctx.beginPath();
        ctx.arc(sx - pr.vx * 2, sy - pr.vy * 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const opIdx = pr.explosive ? 4 : (pr.projId - 1) % 10;
        const opImg = a.obstacleProjs && a.obstacleProjs[opIdx];
        const pImg = opImg || a.projectiles[Math.min(pr.projId - 1, a.projectiles.length - 1)];
        if (pImg) {
          const pSize = opImg ? 22 : 16;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.drawImage(pImg, -pSize / 2, -pSize / 2, pSize, pSize);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(sx - pr.vx * 2, sy - pr.vy * 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.arc(sx - pr.vx * 4, sy - pr.vy * 4, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx - 3, sy - 3, 6, 6);
        }
      }
    }

    for (const s of g.slashEffects) {
      if (s.timer < 0) continue;
      const sx = s.x - cx, sy = s.y - cy;
      const img = a.slashFrames[s.frame];
      if (img) {
        const progress = s.frame / 10;
        const fadeAlpha = s.frame < 3 ? 0.9 : Math.max(0, 0.9 - (s.frame - 3) * 0.12);
        const stretch = 1.2 + progress * 0.6;
        const squeeze = 1.0 - progress * 0.2;
        const advX = Math.cos(s.angle) * progress * 16;
        const advY = Math.sin(s.angle) * progress * 16;
        ctx.save();
        ctx.translate(sx + advX, sy + advY);
        ctx.rotate(s.angle);
        ctx.scale(stretch, squeeze);
        ctx.globalAlpha = fadeAlpha;
        ctx.drawImage(img, -36, -28, 72, 56);
        ctx.restore();

        if (s.frame < 5) {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(s.angle);
          ctx.globalAlpha = 0.35 * (1 - progress);
          const tLen = 30 + s.frame * 8;
          const grad = ctx.createLinearGradient(0, 0, tLen, 0);
          grad.addColorStop(0, 'rgba(34,211,238,0.5)');
          grad.addColorStop(0.6, 'rgba(168,85,247,0.3)');
          grad.addColorStop(1, 'rgba(168,85,247,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(-4, -5 - s.frame);
          ctx.quadraticCurveTo(tLen * 0.5, -2, tLen, 0);
          ctx.quadraticCurveTo(tLen * 0.5, 2, -4, 5 + s.frame);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

    for (const s of g.smokeEffects) {
      const sx = s.x - cx, sy = s.y - cy;
      if (sx < -64 || sx > W + 64 || sy < -64 || sy > H + 64) continue;
      const img = a.smokeFrames[s.frame];
      if (img) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.7 - s.frame * 0.06);
        ctx.drawImage(img, sx - 32, sy - 32, 64, 64);
        ctx.restore();
      }
    }

    renderSpriteEffects(ctx, g.spriteEffects, cx, cy);
    renderBlood(ctx, g.bloodParticles, cx, cy);

    for (const m of g.muzzleFlashes) {
      const mImg = getMuzzleFrame(m.type, m.frame);
      if (mImg) {
        const msx = m.x - cx, msy = m.y - cy;
        ctx.save();
        ctx.translate(msx, msy);
        ctx.rotate(m.angle);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(mImg, -20, -20, 40, 40);
        ctx.restore();
      }
    }

    for (const dn of g.damageNumbers) {
      const sx = dn.x - cx, sy = dn.y - cy;
      if (sx < -100 || sx > W + 100 || sy < -50 || sy > H + 50) continue;
      const alpha = Math.min(dn.timer / 20, 1);
      const scale = dn.timer > 25 ? 1 + (dn.timer - 25) * 0.02 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx, sy);
      ctx.scale(scale, scale);
      ctx.font = typeof dn.value === 'string' ? 'bold 16px "Jost"' : 'bold 14px "Jost"';
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(String(dn.value), 0, 0);
      ctx.fillText(String(dn.value), 0, 0);
      ctx.restore();
    }

    ctx.restore();
    drawHUD(ctx, g, a);
    drawCrosshair(ctx, g, mouseRef.current);
    if (g.showUpgradeUI) drawUpgradeUI(ctx, g);
  }

  function drawHUD(ctx, g, a) {
    const p = g.player;

    ctx.fillStyle = 'rgba(5,10,24,0.9)';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillRect(0, H - 56, W, 56);

    ctx.fillStyle = 'rgba(6,182,212,0.3)';
    ctx.fillRect(0, 56, W, 1);
    ctx.fillRect(0, H - 56, W, 1);

    const hpW = 180, hpH = 14;
    const hpX = 12, hpY = 8;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(hpX, hpY, hpW, hpH);
    const hpRatio = p.hp / p.maxHp;
    const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
    hpGrad.addColorStop(0, hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444');
    hpGrad.addColorStop(1, hpRatio > 0.5 ? '#16a34a' : hpRatio > 0.25 ? '#ca8a04' : '#dc2626');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(hpX, hpY, hpW * hpRatio, hpH);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpX, hpY, hpW, hpH);
    ctx.font = '10px "Jost"';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${p.hp}/${p.maxHp}`, hpX + hpW / 2, hpY + 11);

    if (p.shieldHP > 0) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(hpX, hpY + hpH + 2, hpW * (p.shieldHP / 40), 3);
    }

    const xpW = 180, xpH = 6;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(hpX, hpY + hpH + 6, xpW, xpH);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(hpX, hpY + hpH + 6, xpW * (p.xp / p.xpToNext), xpH);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Cinzel"';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`LVL ${p.level}`, hpX, hpY + hpH + 22);

    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Cinzel"';
    const isBossFloor = g.floor > 0 && g.floor % 5 === 0;
    ctx.fillStyle = isBossFloor ? '#fbbf24' : '#06b6d4';
    ctx.fillText(`FLOOR ${g.floor}${isBossFloor ? ' - BOSS' : ''}`, W - 12, 20);

    ctx.font = '11px "Jost"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Kills: ${p.kills}`, W - 12, 36);
    const aliveEnemies = g.dungeon.enemies.filter(e => e.alive).length;
    ctx.fillStyle = aliveEnemies === 0 ? '#22c55e' : '#ef4444';
    ctx.fillText(`Enemies: ${aliveEnemies}`, W - 12, 50);
    ctx.fillStyle = sfxMuted ? '#ef4444' : '#64748b';
    ctx.fillText(sfxMuted ? '[M] Muted' : '[M] Sound', W - 12, 64);

    const hotbarY = H - 50;
    const slotW = 36, slotH = 36, slotGap = 4;
    const totalSlots = 7;
    const hotbarW = totalSlots * (slotW + slotGap);
    const hotbarX = W / 2 - hotbarW / 2;

    for (let i = 0; i < 6; i++) {
      const x = hotbarX + i * (slotW + slotGap);
      const skill = p.skills[i];
      const cdKey = skill ? skill.id + '_' + i : '';
      const cd = p.skillCooldowns[cdKey] || 0;
      const onCd = cd > 0;

      ctx.fillStyle = onCd ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.7)';
      ctx.fillRect(x, hotbarY, slotW, slotH);

      const pairColor = i < 2 ? '#06b6d4' : i < 4 ? '#22c55e' : '#f59e0b';
      ctx.strokeStyle = onCd ? '#334155' : pairColor;
      ctx.lineWidth = onCd ? 1 : 2;
      ctx.strokeRect(x, hotbarY, slotW, slotH);

      if (skill) {
        const iconImg = a.cpSkillIcons?.[Math.min((skill.icon || 1) - 1, 19)];
        if (iconImg) {
          ctx.save();
          if (onCd) ctx.globalAlpha = 0.4;
          ctx.drawImage(iconImg, x + 2, hotbarY + 2, slotW - 4, slotH - 4);
          ctx.restore();
        }
        if (onCd) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          const cdRatio = cd / (skill.cd || 1);
          ctx.fillRect(x, hotbarY, slotW, slotH * cdRatio);
        }
      }

      ctx.font = '9px "Jost"';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x + slotW / 2, hotbarY - 3);
    }

    const itemX = hotbarX + 6 * (slotW + slotGap);
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.fillRect(itemX, hotbarY, slotW, slotH);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(itemX, hotbarY, slotW, slotH);
    if (p.inventory.length > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px "Jost"';
      ctx.textAlign = 'center';
      ctx.fillText('♥', itemX + slotW / 2, hotbarY + slotH / 2 + 5);
      ctx.font = '9px "Jost"';
      ctx.fillStyle = '#fff';
      ctx.fillText(`x${p.inventory[0].qty}`, itemX + slotW - 8, hotbarY + slotH - 2);
    }
    ctx.font = '9px "Jost"';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('7', itemX + slotW / 2, hotbarY - 3);

    const lmbLvl = LMB_LEVELS[p.lmbLevel];
    const rmbLvl = RMB_LEVELS[p.rmbLevel];
    ctx.textAlign = 'left';
    ctx.font = '10px "Jost"';
    ctx.fillStyle = p.lmbCd > 0 ? '#475569' : '#06b6d4';
    ctx.fillText(`LMB: ${lmbLvl.name} [${p.lmbLevel + 1}/10]${p.lmbCd > 0 ? ' ·' : ''}`, hotbarX, hotbarY + slotH + 12);
    ctx.fillStyle = p.rmbCd > 0 ? '#475569' : '#f97316';
    ctx.fillText(`RMB: ${rmbLvl.name} [${p.rmbLevel + 1}/10]${p.rmbCd > 0 ? ` (${Math.ceil(p.rmbCd / 60)}s)` : ''}`, hotbarX, hotbarY + slotH + 24);

    ctx.textAlign = 'right';
    ctx.font = '10px "Jost"';
    ctx.fillStyle = '#475569';
    ctx.fillText('[8/Tab] Equipment  [9/Esc] Pause', W - hotbarX, hotbarY + slotH + 12);

    const slotLabels = ['BODY', 'LEGS', 'WEAPON'];
    const slotKeys = ['body', 'lower', 'weapon'];
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const sx = hotbarX + i * 2 * (slotW + slotGap) + slotW / 2;
      ctx.font = '7px "Jost"';
      ctx.fillStyle = '#475569';
      ctx.fillText(slotLabels[i], sx + (slotW + slotGap) / 2, hotbarY - 10);
    }

    const mmSize = 120;
    const mmX = W - mmSize - 10, mmY = 58;
    ctx.fillStyle = 'rgba(5,10,24,0.85)';
    ctx.fillRect(mmX, mmY, mmSize, mmSize);
    ctx.strokeStyle = 'rgba(6,182,212,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmSize, mmSize);

    const mmScale = mmSize / (MAP_W * TILE);
    for (const r of g.dungeon.rooms) {
      ctx.fillStyle = 'rgba(42,42,62,0.8)';
      ctx.fillRect(mmX + r.x * TILE * mmScale, mmY + r.y * TILE * mmScale, r.w * TILE * mmScale, r.h * TILE * mmScale);
    }
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(mmX + g.player.x * mmScale - 2, mmY + g.player.y * mmScale - 2, 4, 4);
    for (const e of g.dungeon.enemies) {
      if (!e.alive) continue;
      if (e.isBoss) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(mmX + e.x * mmScale - 3, mmY + e.y * mmScale - 3, 6, 6);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(mmX + e.x * mmScale - 1, mmY + e.y * mmScale - 1, 2, 2);
      }
    }
    if (g.dungeon.portal.active) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(mmX + g.dungeon.portal.x * mmScale - 2, mmY + g.dungeon.portal.y * mmScale - 2, 4, 4);
    }

    if (p.buffs.length > 0) {
      ctx.textAlign = 'left';
      ctx.font = '10px "Jost"';
      let buffY = 58;
      for (const b of p.buffs) {
        const label = b.type === 'speed' ? 'SPEED' : b.type === 'def' ? 'DEF+' : b.type === 'shield' ? 'SHIELD' : b.type === 'dmg' ? 'DMG+' : 'BUFF';
        const c = b.type === 'speed' ? '#22d3ee' : b.type === 'dmg' ? '#ef4444' : '#3b82f6';
        ctx.fillStyle = c;
        ctx.fillText(`${label} ${Math.ceil(b.timer / 60)}s`, 12, buffY);
        buffY += 14;
      }
    }

    if (g.paused) {
      ctx.fillStyle = 'rgba(5,10,24,0.85)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Cinzel"';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('PAUSED', W / 2, H / 2 - 80);

      ctx.font = '15px "Jost"';
      ctx.fillStyle = '#94a3b8';
      const controls = [
        'WASD / Arrows — Move',
        'Left Click — Crypt Bolt (upgradeable)',
        'Right Click — Crypt Rocket (upgradeable)',
        '1-6 — Activate Skills',
        '7 — Use Item',
        '8 / Tab — Equipment Panel',
        '9 / ESC — Pause/Resume',
        `M — Sound ${sfxMuted ? 'OFF' : 'ON'}`,
      ];
      controls.forEach((line, i) => {
        ctx.fillText(line, W / 2, H / 2 - 30 + i * 24);
      });

      ctx.font = '13px "Jost"';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`Weapon: ${p.equipment.weapon.name}  |  Body: ${p.equipment.body.name}  |  Legs: ${p.equipment.lower.name}`, W / 2, H / 2 + 150);
    }
  }

  function drawCrosshair(ctx, g, mouse) {
    const mx = mouse.x, my = mouse.y;
    const p = g.player;
    const t = g.time;
    const lmbReady = p.lmbCd <= 0;
    const rmbReady = p.rmbCd <= 0;
    const pulse = Math.sin(t * 0.15) * 0.15;

    ctx.save();

    ctx.strokeStyle = lmbReady ? '#06b6d4' : '#334155';
    ctx.lineWidth = 2;
    const outerR = 12 + (lmbReady ? pulse * 3 : 0);
    ctx.beginPath();
    ctx.arc(mx, my, outerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = rmbReady ? '#f97316' : '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(mx, my, outerR + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const lineLen = 5;
    const gap = outerR + 2;
    ctx.strokeStyle = lmbReady ? '#22d3ee' : '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - gap - lineLen, my); ctx.lineTo(mx - gap, my);
    ctx.moveTo(mx + gap, my); ctx.lineTo(mx + gap + lineLen, my);
    ctx.moveTo(mx, my - gap - lineLen); ctx.lineTo(mx, my - gap);
    ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + gap + lineLen);
    ctx.stroke();

    ctx.fillStyle = lmbReady ? '#fff' : '#475569';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    if (p.lmbCd > 0) {
      const lmbLvl = LMB_LEVELS[p.lmbLevel];
      const cdRatio = 1 - p.lmbCd / lmbLvl.cd;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(mx, my, outerR, -Math.PI / 2, -Math.PI / 2 + cdRatio * Math.PI * 2);
      ctx.stroke();
    }

    if (p.rmbCd > 0) {
      const rmbLvl = RMB_LEVELS[p.rmbLevel];
      const cdRatio = 1 - p.rmbCd / rmbLvl.cd;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(mx, my, outerR + 5, -Math.PI / 2, -Math.PI / 2 + cdRatio * Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawUpgradeUI(ctx, g) {
    const p = g.player;

    ctx.fillStyle = 'rgba(5,10,24,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Cinzel"';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.fillText('FLOOR CLEARED!', W / 2, 80);
    ctx.shadowBlur = 0;

    ctx.font = '16px "Jost"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Choose an upgrade to power up', W / 2, 110);

    const cardW = 260, cardH = 280, cardGap = 40;
    const totalW = cardW * 2 + cardGap;
    const startX = W / 2 - totalW / 2;
    const cardY = 140;

    const nextLmb = Math.min(p.lmbLevel + 1, 9);
    const nextRmb = Math.min(p.rmbLevel + 1, 9);
    const lmbMaxed = p.lmbLevel >= 9;
    const rmbMaxed = p.rmbLevel >= 9;

    drawUpgradeCard(ctx, g, startX, cardY, cardW, cardH, 'lmb', LMB_LEVELS, p.lmbLevel, nextLmb, lmbMaxed, '#06b6d4', '1');
    drawUpgradeCard(ctx, g, startX + cardW + cardGap, cardY, cardW, cardH, 'rmb', RMB_LEVELS, p.rmbLevel, nextRmb, rmbMaxed, '#f97316', '2');

    ctx.font = '13px "Jost"';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Press [1] or [A] for LMB upgrade  ·  Press [2] or [D] for RMB upgrade', W / 2, cardY + cardH + 40);
  }

  function drawUpgradeCard(ctx, g, x, y, w, h, type, levels, curLvl, nextLvl, maxed, color, key) {
    const hover = false;
    ctx.save();

    ctx.fillStyle = maxed ? 'rgba(30,30,50,0.8)' : 'rgba(15,23,42,0.95)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();

    ctx.strokeStyle = maxed ? '#334155' : color;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!maxed) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Cinzel"';
    ctx.fillStyle = maxed ? '#475569' : color;
    ctx.fillText(type === 'lmb' ? 'PRIMARY BOLT' : 'EXPLOSIVE ROCKET', x + w / 2, y + 30);

    ctx.font = 'bold 13px "Jost"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Level ${curLvl + 1}/10`, x + w / 2, y + 50);

    if (!maxed) {
      ctx.fillStyle = 'rgba(6,182,212,0.08)';
      ctx.fillRect(x + 10, y + 60, w - 20, 1);

      ctx.font = 'bold 14px "Jost"';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('CURRENT', x + w / 2, y + 80);
      ctx.font = '12px "Jost"';
      ctx.fillStyle = '#e2e8f0';
      const cur = levels[curLvl];
      ctx.fillText(cur.name, x + w / 2, y + 98);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(cur.desc, x + w / 2, y + 114);

      if (type === 'lmb') {
        ctx.fillText(`${cur.bolts} bolt${cur.bolts > 1 ? 's' : ''} · ${cur.dmg} dmg · ${(60 / cur.cd).toFixed(1)}/s${cur.pierce ? ' · Pierce' : ''}`, x + w / 2, y + 130);
      } else {
        ctx.fillText(`${cur.rockets} rocket${cur.rockets > 1 ? 's' : ''} · ${cur.dmg} dmg · ${cur.aoe}r AOE${cur.homing > 0 ? ' · Homing' : ''}`, x + w / 2, y + 130);
      }

      ctx.fillStyle = 'rgba(251,191,36,0.15)';
      ctx.fillRect(x + 10, y + 142, w - 20, 1);

      ctx.font = 'bold 14px "Jost"';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`→ NEXT: [${key}]`, x + w / 2, y + 165);
      const nxt = levels[nextLvl];
      ctx.font = 'bold 13px "Jost"';
      ctx.fillStyle = '#fff';
      ctx.fillText(nxt.name, x + w / 2, y + 185);
      ctx.font = '12px "Jost"';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(nxt.desc, x + w / 2, y + 203);

      if (type === 'lmb') {
        const changes = [];
        if (nxt.bolts > cur.bolts) changes.push(`+${nxt.bolts - cur.bolts} bolt`);
        if (nxt.dmg > cur.dmg) changes.push(`+${nxt.dmg - cur.dmg} dmg`);
        if (nxt.cd < cur.cd) changes.push('Faster');
        if (nxt.pierce && !cur.pierce) changes.push('Pierce!');
        ctx.fillStyle = '#22c55e';
        ctx.fillText(changes.join(' · '), x + w / 2, y + 220);
      } else {
        const changes = [];
        if (nxt.rockets > cur.rockets) changes.push(`+${nxt.rockets - cur.rockets} rocket`);
        if (nxt.dmg > cur.dmg) changes.push(`+${nxt.dmg - cur.dmg} dmg`);
        if (nxt.aoe > cur.aoe) changes.push(`+${nxt.aoe - cur.aoe}r AOE`);
        if (nxt.homing > cur.homing) changes.push('Homing↑');
        if (nxt.cd < cur.cd) changes.push('Faster');
        ctx.fillStyle = '#22c55e';
        ctx.fillText(changes.join(' · '), x + w / 2, y + 220);
      }

      const barY = y + 238, barW = w - 40, barH = 8;
      const barX = x + 20;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * ((nextLvl + 1) / 10), barH, 4);
      ctx.fill();
    } else {
      ctx.font = 'bold 20px "Cinzel"';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('MAX LEVEL!', x + w / 2, y + h / 2);
      ctx.font = '12px "Jost"';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(levels[9].name, x + w / 2, y + h / 2 + 25);
    }

    ctx.restore();
  }

  function drawEquipUI(ctx, g, a) {
    ctx.fillStyle = 'rgba(5,10,24,0.88)';
    ctx.fillRect(0, 0, W, H);

    const panelW = 420, panelH = 360;
    const panelX = W / 2 - panelW / 2, panelY = H / 2 - panelH / 2;

    ctx.fillStyle = 'rgba(15,23,42,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Cinzel"';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('EQUIPMENT', W / 2, panelY + 30);

    ctx.fillStyle = 'rgba(6,182,212,0.3)';
    ctx.fillRect(panelX + 10, panelY + 40, panelW - 20, 1);

    const p = g.player;
    const slots = [
      { label: 'BODY', key: 'body', color: '#06b6d4', y: panelY + 60 },
      { label: 'LOWER', key: 'lower', color: '#22c55e', y: panelY + 160 },
      { label: 'WEAPON', key: 'weapon', color: '#f59e0b', y: panelY + 260 },
    ];

    for (const slot of slots) {
      const item = p.equipment[slot.key];
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px "Cinzel"';
      ctx.fillStyle = slot.color;
      ctx.fillText(slot.label, panelX + 20, slot.y);

      ctx.font = '13px "Jost"';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(item.name, panelX + 20, slot.y + 22);

      const tierColors = ['#94a3b8', '#22c55e', '#a855f7', '#f59e0b'];
      ctx.fillStyle = tierColors[Math.min(item.tier, 3)];
      ctx.font = '10px "Jost"';
      ctx.fillText(`Tier ${item.tier + 1}`, panelX + 20, slot.y + 38);

      if (item.skills) {
        ctx.font = '11px "Jost"';
        const skillStartIdx = slot.key === 'body' ? 0 : slot.key === 'lower' ? 2 : 4;
        for (let si = 0; si < item.skills.length; si++) {
          const sk = item.skills[si];
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`[${skillStartIdx + si + 1}] ${sk.name} — ${sk.desc}`, panelX + 20, slot.y + 55 + si * 16);
        }
      }

      if (slot.key === 'weapon' && item.special) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '11px "Jost"';
        ctx.fillText(`[RMB] ${item.special.name} — ${item.special.desc}`, panelX + 20, slot.y + 55 + (item.skills?.length || 0) * 16);
      }
    }

    ctx.textAlign = 'center';
    ctx.font = '12px "Jost"';
    ctx.fillStyle = '#475569';
    ctx.fillText('Press TAB or 8 to close', W / 2, panelY + panelH - 15);
  }

  function drawGameOver(ctx, g, a) {
    ctx.fillStyle = 'rgba(5,10,24,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.font = 'bold 52px "Cinzel"';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 30;
    ctx.fillText('DEFEATED', W / 2, H / 2 - 100);
    ctx.shadowBlur = 0;

    const boxW = 280, boxH = 120;
    const boxX = W / 2 - boxW / 2, boxY = H / 2 - 60;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(251,191,36,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px "Cinzel"';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Floor ${g.floor} — Level ${g.player.level}`, W / 2, boxY + 30);

    ctx.font = '16px "Jost"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Kills: ${g.player.kills}`, W / 2, boxY + 58);

    let prev = {};
    try { prev = JSON.parse(localStorage.getItem('crypt_stats') || '{}'); } catch {}
    const bestFloor = prev.bestFloor || g.floor;
    if (g.floor > (prev.bestFloorBeforeThisRun || 0)) {
      ctx.font = 'bold 14px "Cinzel"';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('NEW BEST FLOOR!', W / 2, boxY + 82);
    } else {
      ctx.font = '13px "Jost"';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Best Floor: ${bestFloor}`, W / 2, boxY + 82);
    }

    ctx.font = '15px "Jost"';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('[R] Restart   [ESC] Menu', W / 2, boxY + boxH + 30);

    ctx.font = '11px "Jost"';
    ctx.fillStyle = '#475569';
    ctx.fillText('A Grudge Studios Game', W / 2, boxY + boxH + 55);
  }

  if (loading) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: '#050a18',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel', serif",
      }}>
        <div style={{ color: '#fbbf24', fontSize: '32px', marginBottom: '20px' }}>CRYPT CRAWLERS</div>
        <div style={{ color: '#94a3b8', fontSize: '16px', fontFamily: "'Jost', sans-serif" }}>Loading dungeon assets...</div>
        <div style={{
          width: '200px', height: '4px', background: '#1a1a2e', borderRadius: '2px', marginTop: '20px', overflow: 'hidden',
        }}>
          <div style={{
            width: '60%', height: '100%', background: 'linear-gradient(90deg, #fbbf24, #06b6d4)',
            animation: 'loadPulse 1s ease-in-out infinite',
          }} />
        </div>
        <style>{`@keyframes loadPulse { 0%,100% { width: 30%; } 50% { width: 80%; } }`}</style>
      </div>
    );
  }

  if (screen === 'title') {
    let cryptStats = {};
    try { cryptStats = JSON.parse(localStorage.getItem('crypt_stats') || '{}'); } catch {}
    const hasPrevRuns = (cryptStats.gamesPlayed || 0) > 0;

    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, #0f1629 0%, #050a18 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel', serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(168,85,247,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6,182,212,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <img
          src="/dungeon-crawler/gui/crypt-logo.png"
          alt="Crypt Crawlers"
          style={{
            width: '120px', height: '120px',
            marginBottom: '16px',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 24px rgba(6,182,212,0.5))',
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <div style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          color: '#fbbf24',
          textShadow: '0 0 60px rgba(251,191,36,0.4), 0 4px 20px rgba(0,0,0,0.8)',
          marginBottom: '8px',
          letterSpacing: '4px',
        }}>
          CRYPT CRAWLERS
        </div>
        <div style={{
          fontSize: '14px', color: '#06b6d4',
          fontFamily: "'Jost', sans-serif",
          marginBottom: '28px',
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}>
          A Grudge Studios Dungeon
        </div>

        {hasPrevRuns && (
          <div style={{
            display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '8px', padding: '8px 18px', textAlign: 'center',
            }}>
              <div style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 700 }}>{cryptStats.bestFloor || 0}</div>
              <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: "'Jost', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Best Floor</div>
            </div>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', padding: '8px 18px', textAlign: 'center',
            }}>
              <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 700 }}>{cryptStats.totalKills || 0}</div>
              <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: "'Jost', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Total Kills</div>
            </div>
            <div style={{
              background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '8px', padding: '8px 18px', textAlign: 'center',
            }}>
              <div style={{ color: '#06b6d4', fontSize: '20px', fontWeight: 700 }}>{cryptStats.gamesPlayed || 0}</div>
              <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: "'Jost', sans-serif", letterSpacing: '1px', textTransform: 'uppercase' }}>Runs</div>
            </div>
          </div>
        )}

        <button
          onClick={() => setScreen('charSelect')}
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))',
            border: '2px solid #06b6d4',
            color: '#06b6d4',
            padding: '16px 48px',
            fontSize: '20px',
            fontFamily: "'Cinzel', serif",
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s',
            letterSpacing: '3px',
            marginBottom: '16px',
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(6,182,212,0.3)';
            e.target.style.boxShadow = '0 0 30px rgba(6,182,212,0.3)';
            e.target.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))';
            e.target.style.boxShadow = 'none';
            e.target.style.transform = 'scale(1)';
          }}
        >
          ENTER THE CRYPT
        </button>

        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: 'none',
            border: '1px solid #334155',
            color: '#64748b',
            padding: '10px 32px',
            fontSize: '13px',
            fontFamily: "'Jost', sans-serif",
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#64748b'; e.target.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.color = '#64748b'; }}
        >
          Back to Game Factory
        </button>

        <div style={{
          position: 'absolute', bottom: '20px',
          fontSize: '11px', color: '#475569',
          fontFamily: "'Jost', sans-serif",
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          WASD move · LMB bolt · RMB rocket · 1-6 skills · 7 item · 8/Tab equip · 9/Esc pause
        </div>

        <div style={{
          position: 'absolute', top: '20px', left: '20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer',
        }} onClick={() => window.location.href = '/'}>
          <img src="/images/grudge_logo.png" alt="Grudge" style={{ width: '32px', height: '32px' }} />
          <span style={{ color: '#fbbf24', fontSize: '14px', fontFamily: "'Cinzel', serif", letterSpacing: '2px' }}>GRUDGE STUDIO</span>
        </div>
      </div>
    );
  }

  if (screen === 'charSelect') {
    const characters = [
      {
        id: 'adventurer',
        name: 'THE ADVENTURER',
        subtitle: 'Man',
        desc: '4-directional combat specialist with fluid attack animations',
        color: '#06b6d4',
        preview: '/dungeon-crawler/hero/adventurer/idle/down.png',
        isSheet: true,
        traits: ['Directional sprites', 'Attack combos', 'Smooth animations'],
      },
      {
        id: 'machine',
        name: 'THE MACHINE',
        subtitle: 'Mech',
        desc: 'Original crypt walker — classic top-down hero with raw power',
        color: '#f59e0b',
        preview: '/dungeon-crawler/hero/Walk2.png',
        isSheet: false,
        traits: ['Classic style', 'Mirrored facing', 'Old school feel'],
      },
    ];

    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, #0f1629 0%, #050a18 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel', serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontSize: 'clamp(24px, 4vw, 40px)',
          color: '#fbbf24',
          textShadow: '0 0 40px rgba(251,191,36,0.3)',
          marginBottom: '6px',
          letterSpacing: '3px',
        }}>
          CHOOSE YOUR CRAWLER
        </div>
        <div style={{
          fontSize: '13px', color: '#64748b',
          fontFamily: "'Jost', sans-serif",
          marginBottom: '32px',
          letterSpacing: '2px',
        }}>
          SELECT A CHARACTER TO ENTER THE CRYPT
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {characters.map(c => {
            const isSelected = charType === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setCharType(c.id)}
                style={{
                  width: '240px',
                  background: isSelected
                    ? `linear-gradient(135deg, ${c.color}15, ${c.color}08)`
                    : 'rgba(15,23,42,0.8)',
                  border: `2px solid ${isSelected ? c.color : '#1e293b'}`,
                  borderRadius: '12px',
                  padding: '24px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'center',
                  boxShadow: isSelected ? `0 0 30px ${c.color}30` : 'none',
                }}
              >
                <div style={{
                  width: '100px', height: '100px',
                  margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  border: `1px solid ${c.color}33`,
                }}>
                  <img
                    src={c.preview}
                    alt={c.name}
                    style={{
                      maxWidth: c.isSheet ? '80px' : '60px',
                      maxHeight: '80px',
                      imageRendering: 'pixelated',
                      filter: `drop-shadow(0 0 8px ${c.color}80)`,
                    }}
                  />
                </div>

                <div style={{
                  fontSize: '18px',
                  color: c.color,
                  marginBottom: '4px',
                  letterSpacing: '2px',
                }}>
                  {c.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontFamily: "'Jost', sans-serif",
                  marginBottom: '10px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                }}>
                  {c.subtitle}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontFamily: "'Jost', sans-serif",
                  marginBottom: '14px',
                  lineHeight: '1.4',
                }}>
                  {c.desc}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {c.traits.map((t, i) => (
                    <div key={i} style={{
                      fontSize: '10px',
                      color: isSelected ? c.color : '#475569',
                      fontFamily: "'Jost', sans-serif",
                      letterSpacing: '1px',
                    }}>
                      {t}
                    </div>
                  ))}
                </div>

                {isSelected && (
                  <div style={{
                    marginTop: '12px',
                    fontSize: '10px',
                    color: c.color,
                    fontFamily: "'Jost', sans-serif",
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>
                    SELECTED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <button
            onClick={() => { startGame(charType); }}
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))',
              border: '2px solid #06b6d4',
              color: '#06b6d4',
              padding: '14px 44px',
              fontSize: '18px',
              fontFamily: "'Cinzel', serif",
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.3s',
              letterSpacing: '3px',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(6,182,212,0.3)';
              e.target.style.boxShadow = '0 0 30px rgba(6,182,212,0.3)';
              e.target.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ENTER THE CRYPT
          </button>
          <button
            onClick={() => setScreen('title')}
            style={{
              background: 'none',
              border: '1px solid #334155',
              color: '#64748b',
              padding: '14px 28px',
              fontSize: '13px',
              fontFamily: "'Jost', sans-serif",
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#64748b'; e.target.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#334155'; e.target.style.color = '#64748b'; }}
          >
            Back
          </button>
        </div>

        <div style={{
          position: 'absolute', bottom: '20px',
          fontSize: '11px', color: '#475569',
          fontFamily: "'Jost', sans-serif",
        }}>
          Click a character card to select, then ENTER THE CRYPT
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#050a18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'pixelated',
          cursor: 'none',
        }}
      />
    </div>
  );
}
