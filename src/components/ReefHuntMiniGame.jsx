import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playClick, playHurt } from '../utils/audioManager';
import { getPlayerSprite } from '../data/spriteMap';
import useGameStore from '../stores/gameStore';

const VIEWPORT_W = 800;
const VIEWPORT_H = 600;
const WORLD_W = 2400;
const WORLD_H = 1800;
const GAME_DURATION = 60;
const MAX_ENERGY = 100;
const SPAWN_INTERVAL = 2000;
const PREDATOR_SPAWN_INTERVAL = 10000;
const COLLECT_RADIUS = 50;
const MAX_ITEMS = 40;
const MAX_ENEMIES = 6;
const INVULN_TIME = 1500;
const PLAYER_SIZE = 40;

const SURFACE_Y = 120;
const AIR_GRAVITY = 0.18;
const LEAP_VELOCITY = -6;
const LEAP_COOLDOWN = 800;
const MAX_AIR_TIME = 3;
const SPLASH_PARTICLE_COUNT = 12;

const PARALLAX_FAR = 0.2;
const PARALLAX_MID = 0.5;

const WORLD_COLLISIONS = [
  { x: 0, y: 750, w: 600, h: 300 },
  { x: 0, y: 1350, w: 500, h: 450 },
  { x: 1500, y: 800, w: 600, h: 280 },
  { x: 1800, y: 1400, w: 600, h: 400 },
  { x: 700, y: 1100, w: 300, h: 200 },
  { x: 1050, y: 500, w: 200, h: 150 },
  { x: 400, y: 500, w: 150, h: 120 },
  { x: 900, y: 1500, w: 500, h: 300 },
  { x: 2000, y: 600, w: 400, h: 200 },
  { x: 100, y: 1100, w: 350, h: 250 },
];

const COLLECTIBLES = [
  { type: 'pearl', resource: 'gold', amount: 1, color: '#fbbf24', emoji: '🫧', size: 14, energy: 5, weight: 25 },
  { type: 'algae', resource: 'herbs', amount: 1, color: '#4ade80', emoji: '🌿', size: 12, energy: 8, weight: 25 },
  { type: 'coral', resource: 'wood', amount: 1, color: '#22d3ee', emoji: '🪸', size: 14, energy: 4, weight: 20 },
  { type: 'shell', resource: 'ore', amount: 1, color: '#94a3b8', emoji: '🐚', size: 16, energy: 3, weight: 15 },
  { type: 'crystal', resource: 'crystals', amount: 1, color: '#a78bfa', emoji: '💎', size: 12, energy: 6, weight: 8 },
  { type: 'plankton', resource: null, amount: 0, color: '#86efac', emoji: '✨', size: 8, energy: 12, weight: 30 },
  { type: 'shrimp', resource: 'gold', amount: 2, color: '#fb923c', emoji: '🦐', size: 16, energy: 10, weight: 10 },
  { type: 'starfish', resource: null, amount: 0, color: '#f472b6', emoji: '⭐', size: 18, energy: 15, weight: 5 },
];

const AIR_COLLECTIBLES = [
  { type: 'air_bubble', resource: null, amount: 0, color: '#7dd3fc', emoji: '💨', size: 18, energy: 20, weight: 40 },
  { type: 'seagull_drop', resource: 'gold', amount: 3, color: '#fbbf24', emoji: '🪙', size: 14, energy: 0, weight: 30 },
  { type: 'flying_fish', resource: null, amount: 0, color: '#38bdf8', emoji: '🐟', size: 16, energy: 0, weight: 20, scoreBonus: 100 },
];

const PREDATORS = [
  { type: 'shark', emoji: '🦈', size: 36, speed: 1.2, color: '#64748b', damage: 25, hp: 3 },
  { type: 'eel', emoji: '🐍', size: 28, speed: 1.5, color: '#7c3aed', damage: 15, hp: 2 },
  { type: 'jellyfish', emoji: '🪼', size: 24, speed: 0.6, color: '#c084fc', damage: 10, hp: 1 },
];

const FAR_MOUNTAINS = [];
(function generateMountains() {
  let x = 0;
  while (x < WORLD_W * 1.5) {
    const w = 200 + Math.random() * 400;
    const h = 150 + Math.random() * 250;
    FAR_MOUNTAINS.push({ x, w, h, peak: x + w * (0.3 + Math.random() * 0.4) });
    x += w * 0.6;
  }
})();

function buildCollisionMap() {
  return WORLD_COLLISIONS.map(c => ({ ...c }));
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, t);
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function weightedRandom(items) {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[0];
}

function pushOutOfCollisions(px, py, pw, ph, collisions) {
  let x = px, y = py;
  for (const c of collisions) {
    if (!rectsOverlap(x, y, pw, ph, c.x, c.y, c.w, c.h)) continue;
    const overlapLeft = (x + pw) - c.x;
    const overlapRight = (c.x + c.w) - x;
    const overlapTop = (y + ph) - c.y;
    const overlapBottom = (c.y + c.h) - y;
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    if (minOverlap === overlapLeft) x = c.x - pw;
    else if (minOverlap === overlapRight) x = c.x + c.w;
    else if (minOverlap === overlapTop) y = c.y - ph;
    else y = c.y + c.h;
  }
  return { x, y };
}

export default function ReefHuntMiniGame({ onClose, onComplete }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState('playing');
  const [results, setResults] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayEnergy, setDisplayEnergy] = useState(MAX_ENERGY);
  const [displayTimer, setDisplayTimer] = useState(GAME_DURATION);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [displayCollected, setDisplayCollected] = useState({ gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 });

  const hero = useGameStore(s => s.heroRoster.find(h => h.id === 'player'));
  const spriteData = getPlayerSprite(hero?.classId || 'warrior', hero?.raceId || 'blue_betta');

  const handleComplete = () => {
    if (results) {
      onComplete(results);
    }
    onClose();
  };

  useEffect(() => {
    const collisions = buildCollisionMap();
    const bgImg = new Image();
    bgImg.src = '/backgrounds/reef_hunt_bg.png';

    const spriteImg = new Image();
    const idleSrc = spriteData?.idle?.src || '/sprites/fish/blue_fish/idle.png';
    spriteImg.src = idleSrc;
    const frameW = spriteData?.frameWidth || 48;
    const frameH = spriteData?.frameHeight || 48;
    const frameCount = spriteData?.idle?.frames || 3;

    const g = {
      running: true,
      mouseScreenX: VIEWPORT_W / 2,
      mouseScreenY: VIEWPORT_H / 2,
      playerX: WORLD_W / 2,
      playerY: SURFACE_Y + 200,
      playerVx: 0,
      playerVy: 0,
      facingLeft: false,
      camX: 0,
      camY: 0,
      energy: MAX_ENERGY,
      timer: GAME_DURATION,
      score: 0,
      combo: 0,
      comboTimer: 0,
      collected: { gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 },
      totalCollected: 0,
      collectibles: [],
      airCollectibles: [],
      predators: [],
      particles: [],
      splashParticles: [],
      bubbles: [],
      lastSpawn: 0,
      lastPredatorSpawn: 0,
      lastAirSpawn: 0,
      lastTime: 0,
      invulnUntil: 0,
      shakeUntil: 0,
      flashUntil: 0,
      attackSpin: 0,
      attackSpinActive: false,
      attackAoe: null,
      spriteFrame: 0,
      spriteTimer: 0,
      buffsEarned: [],
      aboveWater: false,
      wasAboveWater: false,
      leapCooldownUntil: 0,
      airTime: 0,
      leapTrail: [],
      keysDown: {},
    };
    gameRef.current = g;

    for (let i = 0; i < 60; i++) {
      g.bubbles.push({
        x: Math.random() * WORLD_W,
        y: SURFACE_Y + Math.random() * (WORLD_H - SURFACE_Y),
        size: 2 + Math.random() * 4,
        vy: -0.3 - Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        alpha: 0.2 + Math.random() * 0.4,
        id: Math.random(),
      });
    }

    for (let i = 0; i < 10; i++) {
      spawnItem(g);
    }
    for (let i = 0; i < 3; i++) {
      spawnAirItem(g);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      g.mouseScreenX = ((e.clientX - rect.left) / rect.width) * VIEWPORT_W;
      g.mouseScreenY = ((e.clientY - rect.top) / rect.height) * VIEWPORT_H;
    };

    const onClick = (e) => {
      if (!g.running) return;
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * VIEWPORT_W;
      const sy = ((e.clientY - rect.top) / rect.height) * VIEWPORT_H;
      const wx = sx + g.camX;
      const wy = sy + g.camY;

      let collected = false;

      const allItems = g.aboveWater ? g.airCollectibles : g.collectibles;
      const key = g.aboveWater ? 'airCollectibles' : 'collectibles';

      g[key] = allItems.filter(c => {
        if (dist(wx, wy, c.x, c.y) < COLLECT_RADIUS) {
          if (c.resource) {
            g.collected[c.resource] = (g.collected[c.resource] || 0) + c.amount;
          }
          g.energy = Math.min(MAX_ENERGY, g.energy + (c.energy || 0));
          g.totalCollected++;
          g.combo++;
          g.comboTimer = 2;
          const bonus = c.scoreBonus || (10 + g.combo * 5);
          g.score += bonus;
          addParticle(g, c.x, c.y, c.color, c.scoreBonus ? `+${c.scoreBonus} pts` : `+${c.amount} ${c.type}`);
          collected = true;
          try { playClick(); } catch(err) {}
          return false;
        }
        return true;
      });

      if (!collected) {
        g.combo = 0;
      }
    };

    const onRightClick = (e) => {
      e.preventDefault();
      if (!g.running) return;
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * VIEWPORT_W;
      const sy = ((e.clientY - rect.top) / rect.height) * VIEWPORT_H;
      const wx = sx + g.camX;
      const wy = sy + g.camY;

      g.attackSpinActive = true;
      g.attackSpin = 0;
      g.attackAoe = { x: wx, y: wy, radius: 0, alpha: 1, maxRadius: 60 };

      g.predators = g.predators.filter(p => {
        if (dist(wx, wy, p.x, p.y) < 60 + p.size) {
          p.currentHp--;
          addParticle(g, p.x, p.y - 10, '#ef4444', '-1 HP');
          if (p.currentHp <= 0) {
            g.score += 50;
            addParticle(g, p.x, p.y, '#fbbf24', '+50 pts');
            return false;
          }
        }
        return true;
      });

      try { playClick(); } catch(err) {}
    };

    const onKeyDown = (e) => {
      g.keysDown[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    const onKeyUp = (e) => {
      g.keysDown[e.code] = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('contextmenu', onRightClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    g.lastTime = performance.now();

    const gameLoop = (now) => {
      if (!g.running) return;
      const dt = Math.min((now - g.lastTime) / 1000, 0.05);
      g.lastTime = now;

      g.timer -= dt;
      g.comboTimer -= dt;
      if (g.comboTimer <= 0) g.combo = 0;

      if (g.timer <= 0 || g.energy <= 0) {
        g.running = false;
        const finalResults = {
          resources: { ...g.collected },
          score: g.score,
          buffs: [...g.buffsEarned],
        };
        setResults(finalResults);
        setGameState('results');
        return;
      }

      g.wasAboveWater = g.aboveWater;
      g.aboveWater = g.playerY < SURFACE_Y;

      if (g.aboveWater && !g.wasAboveWater) {
        createSplash(g, g.playerX, SURFACE_Y, true);
        g.airTime = 0;
      }
      if (!g.aboveWater && g.wasAboveWater) {
        createSplash(g, g.playerX, SURFACE_Y, false);
      }

      if (g.aboveWater) {
        g.airTime += dt;
      }

      if (g.keysDown['Space'] && !g.aboveWater && g.playerY < SURFACE_Y + 100 && now > g.leapCooldownUntil) {
        g.playerVy = LEAP_VELOCITY;
        g.leapCooldownUntil = now + LEAP_COOLDOWN;
        createSplash(g, g.playerX, SURFACE_Y, true);
        addParticle(g, g.playerX, g.playerY, '#7dd3fc', 'LEAP!');
        g.score += 10;
      }

      const worldMouseX = g.mouseScreenX + g.camX;
      const worldMouseY = g.mouseScreenY + g.camY;
      const dx = worldMouseX - g.playerX;
      const dy = worldMouseY - g.playerY;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (g.aboveWater) {
        if (d > 5) {
          const accel = Math.min(d * 0.004, 2);
          g.playerVx = lerp(g.playerVx, (dx / d) * accel, 0.06);
          g.facingLeft = dx < 0;
        } else {
          g.playerVx *= 0.95;
        }
        g.playerVy += AIR_GRAVITY;

        if (g.airTime > MAX_AIR_TIME) {
          g.playerVy += 0.3;
        }
      } else {
        if (d > 5) {
          const accel = Math.min(d * 0.006, 3);
          g.playerVx = lerp(g.playerVx, (dx / d) * accel, 0.08);
          g.playerVy = lerp(g.playerVy, (dy / d) * accel, 0.08);
          g.facingLeft = dx < 0;
        } else {
          g.playerVx *= 0.92;
          g.playerVy *= 0.92;
        }
      }

      if (g.aboveWater && Math.abs(g.playerVx) > 0.5) {
        g.leapTrail.push({
          x: g.playerX, y: g.playerY, life: 0.6,
          size: 4 + Math.random() * 3,
        });
      }
      g.leapTrail = g.leapTrail.filter(t => {
        t.life -= dt * 2;
        return t.life > 0;
      });

      let newX = g.playerX + g.playerVx;
      let newY = g.playerY + g.playerVy;

      if (!g.aboveWater) {
        const pushed = pushOutOfCollisions(newX - PLAYER_SIZE / 2, newY - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, collisions);
        newX = pushed.x + PLAYER_SIZE / 2;
        newY = pushed.y + PLAYER_SIZE / 2;
      }

      g.playerX = clamp(newX, 20, WORLD_W - 20);
      g.playerY = clamp(newY, -80, WORLD_H - 20);

      const targetCamX = clamp(g.playerX - VIEWPORT_W / 2, 0, WORLD_W - VIEWPORT_W);
      const targetCamY = clamp(g.playerY - VIEWPORT_H / 2, -100, WORLD_H - VIEWPORT_H);
      g.camX = lerp(g.camX, targetCamX, 0.08);
      g.camY = lerp(g.camY, targetCamY, 0.08);

      if (now - g.lastSpawn > SPAWN_INTERVAL && g.collectibles.length < MAX_ITEMS) {
        spawnItem(g);
        g.lastSpawn = now;
      }

      if (now - g.lastAirSpawn > 4000 && g.airCollectibles.length < 8) {
        spawnAirItem(g);
        g.lastAirSpawn = now;
      }

      if (now - g.lastPredatorSpawn > PREDATOR_SPAWN_INTERVAL && g.predators.length < MAX_ENEMIES) {
        spawnEnemy(g);
        g.lastPredatorSpawn = now;
      }

      g.collectibles.forEach(c => {
        c.wobble += 0.03;
        c.vy += 0.05;
        if (c.vy > 1.0) c.vy = 1.0;
        c.x += c.vx;
        c.y += c.vy;

        for (const col of collisions) {
          if (rectsOverlap(c.x - 8, c.y - 8, 16, 16, col.x, col.y, col.w, col.h)) {
            c.y = col.y - 8;
            c.vy = 0;
            break;
          }
        }
        c.x = clamp(c.x, 0, WORLD_W);
        c.y = clamp(c.y, SURFACE_Y, WORLD_H);
      });

      g.airCollectibles.forEach(c => {
        c.wobble += 0.04;
        c.x += c.vx + Math.sin(c.wobble) * 0.3;
        c.y += c.vy;
        c.y = clamp(c.y, -60, SURFACE_Y - 10);
        c.x = clamp(c.x, 20, WORLD_W - 20);
      });

      g.predators.forEach(p => {
        const pd = dist(g.playerX, g.playerY, p.x, p.y);
        if (pd < 150) {
          p.phase = 'chase';
        }
        if (p.phase === 'chase') {
          const pdx = g.playerX - p.x;
          const pdy = g.playerY - p.y;
          const pdd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
          p.vx = lerp(p.vx, (pdx / pdd) * p.speed, 0.04);
          p.vy = lerp(p.vy, (pdy / pdd) * p.speed, 0.04);
        } else {
          p.wanderTimer -= dt * 1000;
          if (p.wanderTimer <= 0) {
            p.vx = (Math.random() - 0.5) * p.speed;
            p.vy = (Math.random() - 0.5) * p.speed * 0.5;
            p.wanderTimer = 2000 + Math.random() * 3000;
          }
        }
        p.x += p.vx;
        p.y += p.vy;

        const ep = pushOutOfCollisions(p.x - 16, p.y - 16, 32, 32, collisions);
        p.x = ep.x + 16;
        p.y = ep.y + 16;
        p.x = clamp(p.x, 20, WORLD_W - 20);
        p.y = clamp(p.y, SURFACE_Y, WORLD_H - 20);

        if (pd < 30 && now > g.invulnUntil) {
          g.energy -= p.damage;
          g.invulnUntil = now + INVULN_TIME;
          g.shakeUntil = now + 300;
          g.flashUntil = now + 200;
          g.combo = 0;
          addParticle(g, g.playerX, g.playerY - 20, '#ef4444', `-${p.damage} Energy!`);
          try { playHurt(); } catch(err) {}
        }
      });

      if (g.attackSpinActive) {
        g.attackSpin += (Math.PI * 2) / (0.4 / dt);
        if (g.attackSpin >= Math.PI * 2) {
          g.attackSpinActive = false;
          g.attackSpin = 0;
        }
      }

      if (g.attackAoe) {
        g.attackAoe.radius += 3;
        g.attackAoe.alpha -= dt * 2;
        if (g.attackAoe.alpha <= 0) g.attackAoe = null;
      }

      g.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * 1.5;
      });
      g.particles = g.particles.filter(p => p.life > 0);

      g.splashParticles.forEach(sp => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.12;
        sp.life -= dt * 2;
      });
      g.splashParticles = g.splashParticles.filter(sp => sp.life > 0);

      g.bubbles.forEach(b => {
        b.y += b.vy;
        b.x += Math.sin(b.y * 0.02) * 0.2 + b.vx;
        if (b.y < SURFACE_Y - 10) {
          b.y = WORLD_H + 10;
          b.x = Math.random() * WORLD_W;
        }
      });

      g.spriteTimer += dt;
      if (g.spriteTimer > 0.15) {
        g.spriteTimer = 0;
        g.spriteFrame = (g.spriteFrame + 1) % frameCount;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) render(ctx, g, now, bgImg, spriteImg, frameW, frameH, frameCount, collisions);

      setDisplayScore(g.score);
      setDisplayEnergy(Math.max(0, Math.floor(g.energy)));
      setDisplayTimer(Math.max(0, Math.ceil(g.timer)));
      setDisplayCombo(g.combo);
      setDisplayCollected({ ...g.collected });

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      g.running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('contextmenu', onRightClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [spriteData]);

  function spawnItem(g) {
    const template = weightedRandom(COLLECTIBLES);
    const x = Math.random() * (WORLD_W - 100) + 50;
    const y = SURFACE_Y + Math.random() * 200;
    g.collectibles.push({
      ...template,
      id: Date.now() + Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0,
      wobble: Math.random() * Math.PI * 2,
      alpha: 1,
    });
  }

  function spawnAirItem(g) {
    const template = weightedRandom(AIR_COLLECTIBLES);
    const x = Math.random() * (WORLD_W - 100) + 50;
    const y = -20 + Math.random() * (SURFACE_Y - 20);
    g.airCollectibles.push({
      ...template,
      id: Date.now() + Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.1,
      wobble: Math.random() * Math.PI * 2,
      alpha: 1,
    });
  }

  function spawnEnemy(g) {
    const template = PREDATORS[Math.floor(Math.random() * PREDATORS.length)];
    const x = Math.random() * WORLD_W;
    const y = SURFACE_Y + 50 + Math.random() * (WORLD_H - SURFACE_Y - 100);
    g.predators.push({
      ...template,
      id: Date.now() + Math.random(),
      x, y,
      vx: (Math.random() - 0.5) * template.speed,
      vy: (Math.random() - 0.5) * template.speed * 0.5,
      currentHp: template.hp,
      phase: 'wander',
      wanderTimer: 3000 + Math.random() * 2000,
    });
  }

  function createSplash(g, x, y, goingUp) {
    for (let i = 0; i < SPLASH_PARTICLE_COUNT; i++) {
      g.splashParticles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: goingUp ? -(2 + Math.random() * 3) : (1 + Math.random() * 2),
        size: 3 + Math.random() * 5,
        life: 0.8 + Math.random() * 0.4,
        color: i % 3 === 0 ? '#ffffff' : '#7dd3fc',
      });
    }
  }

  function addParticle(g, x, y, color, text) {
    g.particles.push({
      x, y, text, color,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random(),
      life: 1,
      id: Date.now() + Math.random(),
    });
  }

  function renderFarBackground(ctx, g, now) {
    const farCamX = g.camX * PARALLAX_FAR;
    const farCamY = g.camY * PARALLAX_FAR;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
    skyGrad.addColorStop(0, '#0a3d62');
    skyGrad.addColorStop(0.3, '#0c5a8a');
    skyGrad.addColorStop(0.6, '#0e7490');
    skyGrad.addColorStop(1, '#041225');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    ctx.globalAlpha = 0.25;
    for (const m of FAR_MOUNTAINS) {
      const sx = m.x - farCamX;
      const baseY = VIEWPORT_H * 0.6 - farCamY * 0.5;
      if (sx + m.w < -100 || sx > VIEWPORT_W + 100) continue;

      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.quadraticCurveTo(
        m.peak - farCamX, baseY - m.h,
        sx + m.w, baseY
      );
      ctx.closePath();
      ctx.fillStyle = '#0c4a6e';
      ctx.fill();
    }

    ctx.globalAlpha = 0.12;
    for (const m of FAR_MOUNTAINS) {
      const sx = m.x * 1.3 - farCamX * 1.5;
      const baseY = VIEWPORT_H * 0.55 - farCamY * 0.3;
      if (sx + m.w < -100 || sx > VIEWPORT_W + 100) continue;

      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.quadraticCurveTo(
        (m.peak * 1.3) - farCamX * 1.5, baseY - m.h * 0.7,
        sx + m.w * 1.1, baseY
      );
      ctx.closePath();
      ctx.fillStyle = '#164e63';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function renderMidBackground(ctx, g, now, bgImg) {
    if (!bgImg.complete || bgImg.naturalWidth <= 0) return;

    const midCamX = g.camX * PARALLAX_MID;
    const midCamY = g.camY * PARALLAX_MID;

    ctx.globalAlpha = 0.35;
    ctx.drawImage(bgImg, -midCamX, -midCamY + 50, WORLD_W, WORLD_H);
    ctx.globalAlpha = 1;
  }

  function renderForegroundBg(ctx, g, bgImg) {
    if (!bgImg.complete || bgImg.naturalWidth <= 0) return;
    ctx.drawImage(bgImg, -g.camX, -g.camY, WORLD_W, WORLD_H);
  }

  function renderSurface(ctx, g, now) {
    const surfaceScreenY = SURFACE_Y - g.camY;

    if (surfaceScreenY > -50 && surfaceScreenY < VIEWPORT_H + 50) {
      ctx.save();

      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= VIEWPORT_W; x += 5) {
        const worldX = x + g.camX;
        const waveOffset = Math.sin(worldX * 0.008 + now * 0.001) * 6
          + Math.sin(worldX * 0.015 + now * 0.0015) * 3;
        const y = surfaceScreenY + waveOffset;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= VIEWPORT_W; x += 5) {
        const worldX = x + g.camX;
        const waveOffset = Math.sin(worldX * 0.01 + now * 0.0008 + 2) * 4
          + Math.sin(worldX * 0.02 + now * 0.001) * 2;
        const y = surfaceScreenY + waveOffset - 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    }

    if (surfaceScreenY > 0) {
      ctx.globalAlpha = 0.06;
      const time = now * 0.001;
      for (let i = 0; i < 5; i++) {
        const lx = Math.sin(time * 0.15 + i * 1.2) * 200 + VIEWPORT_W * (0.2 + i * 0.15);
        const lgr = ctx.createLinearGradient(lx - 40, 0, lx + 40, surfaceScreenY);
        lgr.addColorStop(0, '#fffbe6');
        lgr.addColorStop(1, 'transparent');
        ctx.fillStyle = lgr;
        ctx.fillRect(lx - 40, 0, 80, surfaceScreenY);
      }
      ctx.globalAlpha = 1;
    }
  }

  function renderAboveWater(ctx, g, now) {
    const surfaceScreenY = SURFACE_Y - g.camY;
    if (surfaceScreenY <= 0) return;

    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceScreenY);
    skyGrad.addColorStop(0, 'rgba(135,206,235,0.15)');
    skyGrad.addColorStop(0.5, 'rgba(176,224,247,0.08)');
    skyGrad.addColorStop(1, 'rgba(125,211,252,0.03)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIEWPORT_W, surfaceScreenY);

    const time = now * 0.001;
    const cloudCamX = g.camX * 0.1;
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 6; i++) {
      const cx = (i * 400 + time * 10) % (WORLD_W + 200) - 100 - cloudCamX;
      const cy = 20 + i * 12 - g.camY * 0.05;
      if (cx < -200 || cx > VIEWPORT_W + 200 || cy > surfaceScreenY) continue;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 80 + i * 10, 15 + i * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 30, cy - 5, 50, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function render(ctx, g, now, bgImg, spriteImg, frameW, frameH, frameCount, collisions) {
    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    const shake = now < g.shakeUntil;
    ctx.save();
    if (shake) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    renderFarBackground(ctx, g, now);
    renderMidBackground(ctx, g, now, bgImg);
    renderForegroundBg(ctx, g, bgImg);
    renderAboveWater(ctx, g, now);

    const deepStart = WORLD_H / 3;
    const deepScreenY = deepStart - g.camY;
    if (deepScreenY < VIEWPORT_H) {
      const dg = ctx.createLinearGradient(0, Math.max(0, deepScreenY), 0, VIEWPORT_H);
      dg.addColorStop(0, 'rgba(0,0,20,0)');
      dg.addColorStop(1, 'rgba(0,0,20,0.4)');
      ctx.fillStyle = dg;
      ctx.fillRect(0, Math.max(0, deepScreenY), VIEWPORT_W, VIEWPORT_H - Math.max(0, deepScreenY));
    }

    g.bubbles.forEach(b => {
      const sx = b.x - g.camX;
      const sy = b.y - g.camY;
      if (sx < -10 || sx > VIEWPORT_W + 10 || sy < -10 || sy > VIEWPORT_H + 10) return;
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, b.size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34,211,238,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = b.alpha * 0.15;
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    g.airCollectibles.forEach(c => {
      const sx = c.x - g.camX;
      const sy = c.y - g.camY;
      if (sx < -30 || sx > VIEWPORT_W + 30 || sy < -30 || sy > VIEWPORT_H + 30) return;
      ctx.save();
      const bob = Math.sin(c.wobble) * 5;
      ctx.globalAlpha = c.alpha * 0.9;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 10;
      ctx.font = `${c.size + 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.emoji, sx, sy + bob);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    g.collectibles.forEach(c => {
      const sx = c.x - g.camX;
      const sy = c.y - g.camY;
      if (sx < -30 || sx > VIEWPORT_W + 30 || sy < -30 || sy > VIEWPORT_H + 30) return;
      ctx.save();
      const bob = Math.sin(c.wobble) * 3;
      ctx.globalAlpha = c.alpha;
      ctx.beginPath();
      ctx.arc(sx, sy + bob, c.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = c.color + '40';
      ctx.fill();
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 6;
      ctx.font = `${c.size + 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.emoji, sx, sy + bob);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    renderSurface(ctx, g, now);

    g.predators.forEach(p => {
      const sx = p.x - g.camX;
      const sy = p.y - g.camY;
      if (sx < -50 || sx > VIEWPORT_W + 50 || sy < -50 || sy > VIEWPORT_H + 50) return;
      ctx.save();
      const bob = Math.sin(now * 0.003 + p.id) * 4;
      ctx.globalAlpha = 0.9;
      if (p.phase === 'chase') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      }
      const flip = p.vx < 0;
      ctx.translate(sx, sy + bob);
      if (flip) ctx.scale(-1, 1);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.shadowBlur = 0;
      if (flip) ctx.scale(-1, 1);

      const barW = 30;
      const barH = 4;
      const barX = -barW / 2;
      const barY = -p.size / 2 - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      const hpPct = p.currentHp / p.hp;
      ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.restore();
    });

    g.leapTrail.forEach(t => {
      const sx = t.x - g.camX;
      const sy = t.y - g.camY;
      ctx.globalAlpha = t.life * 0.5;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(sx, sy, t.size * t.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    g.splashParticles.forEach(sp => {
      const sx = sp.x - g.camX;
      const sy = sp.y - g.camY;
      ctx.globalAlpha = Math.max(0, sp.life) * 0.7;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.size * sp.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const isInvuln = now < g.invulnUntil;
    ctx.save();
    if (isInvuln) {
      ctx.globalAlpha = 0.5 + Math.sin(now * 0.02) * 0.3;
    }

    const playerScreenX = g.playerX - g.camX;
    const playerScreenY = g.playerY - g.camY;

    ctx.translate(playerScreenX, playerScreenY);

    if (g.aboveWater) {
      const leapAngle = clamp(g.playerVy * 0.08, -0.5, 0.5);
      ctx.rotate(leapAngle * (g.facingLeft ? -1 : 1));
    }

    if (g.attackSpinActive) {
      ctx.rotate(g.attackSpin);
    }
    if (g.facingLeft) ctx.scale(-1, 1);

    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const srcX = g.spriteFrame * frameW;
      const srcY = 0;
      const drawSize = 64;
      ctx.drawImage(spriteImg, srcX, srcY, frameW, frameH, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (now < g.flashUntil) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
      ctx.globalAlpha = 1;
    }

    if (g.attackAoe) {
      const asx = g.attackAoe.x - g.camX;
      const asy = g.attackAoe.y - g.camY;
      ctx.save();
      ctx.globalAlpha = g.attackAoe.alpha * 0.5;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(asx, asy, g.attackAoe.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = g.attackAoe.alpha * 0.1;
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.restore();
    }

    g.particles.forEach(p => {
      const sx = p.x - g.camX;
      const sy = p.y - g.camY;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.font = 'bold 13px "Jost", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, sx, sy);
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    const cx = g.mouseScreenX;
    const cy = g.mouseScreenY;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 3, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 8, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, 8, 200, 50);
    ctx.strokeStyle = 'rgba(34,211,238,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 200, 50);

    ctx.font = 'bold 11px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText(`Score: ${g.score}`, 14, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Time: ${Math.ceil(Math.max(0, g.timer))}s`, 14, 38);
    if (g.combo > 1) {
      ctx.fillStyle = '#f97316';
      ctx.fillText(`x${g.combo} COMBO`, 14, 52);
    }

    const ebW = 120;
    const ebH = 8;
    const ebX = 130;
    const ebY = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(ebX, ebY, ebW, ebH);
    const ePct = Math.max(0, g.energy) / MAX_ENERGY;
    ctx.fillStyle = ePct > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(ebX, ebY, ebW * ePct, ebH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(ebX, ebY, ebW, ebH);
    ctx.font = '9px "Jost", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Energy', ebX + 2, ebY + 7);

    const rY = 62;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(8, rY, 200, 18);
    ctx.font = '9px "Jost", sans-serif';
    ctx.textAlign = 'left';
    const res = g.collected;
    const resText = `P:${res.gold} A:${res.herbs} C:${res.wood} S:${res.ore} X:${res.crystals}`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(resText, 12, rY + 12);

    if (g.playerY > SURFACE_Y - 100 && g.playerY < SURFACE_Y + 50) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(VIEWPORT_W / 2 - 60, VIEWPORT_H - 30, 120, 20);
      ctx.font = '10px "Jost", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText('SPACE to Leap!', VIEWPORT_W / 2, VIEWPORT_H - 17);
    }

    if (g.aboveWater && g.airTime > MAX_AIR_TIME - 1) {
      const urgency = Math.sin(now * 0.01) > 0 ? 1 : 0.4;
      ctx.globalAlpha = urgency;
      ctx.fillStyle = 'rgba(239,68,68,0.3)';
      ctx.fillRect(0, 0, VIEWPORT_W, 4);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 12px "Jost", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Returning to water!', VIEWPORT_W / 2, VIEWPORT_H - 40);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 11000,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {gameState === 'playing' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={VIEWPORT_W}
            height={VIEWPORT_H}
            tabIndex={0}
            style={{
              maxWidth: '100%', maxHeight: '100%', display: 'block', cursor: 'none',
              aspectRatio: `${VIEWPORT_W} / ${VIEWPORT_H}`, outline: 'none',
            }}
          />
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: 6, padding: '6px 16px', color: '#ef4444', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 700, zIndex: 11001,
          }}>EXIT</button>
        </div>
      )}

      {gameState === 'results' && results && (
        <div style={{
          width: '100%', maxWidth: 500,
          background: 'linear-gradient(180deg, #0c4a6e, #041225)',
          borderRadius: 16, border: '2px solid rgba(34,211,238,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 32,
          boxShadow: '0 0 40px rgba(34,211,238,0.2)',
        }}>
          <h2 className="font-cinzel" style={{
            color: '#22d3ee', fontSize: '1.5rem', margin: 0,
            textShadow: '0 0 20px rgba(34,211,238,0.5)',
          }}>Reef Hunt Complete!</h2>

          <div style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 16,
            border: '1px solid rgba(34,211,238,0.2)', minWidth: 280, width: '100%',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 700 }}>Score: {results.score}</span>
            </div>

            <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Resources Earned</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {Object.entries(results.resources).map(([key, val]) => (
                <div key={key} style={{
                  textAlign: 'center', padding: '6px 4px',
                  background: val > 0 ? 'rgba(34,211,238,0.1)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 6, border: `1px solid ${val > 0 ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: val > 0 ? '#22d3ee' : '#555' }}>{val}</div>
                  <div style={{ fontSize: '0.45rem', color: '#888', textTransform: 'capitalize' }}>
                    {key === 'gold' ? 'Pearls' : key === 'herbs' ? 'Algae' : key === 'wood' ? 'Coral' : key === 'ore' ? 'Shells' : key}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleComplete} className="font-cinzel" style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(6,182,212,0.2))',
            border: '2px solid rgba(34,211,238,0.5)', borderRadius: 8,
            padding: '10px 32px', color: '#22d3ee', fontSize: '0.85rem',
            fontWeight: 700, cursor: 'pointer', letterSpacing: 2,
            transition: 'all 0.2s',
          }}>
            COLLECT REWARDS
          </button>
        </div>
      )}
    </div>
  );
}