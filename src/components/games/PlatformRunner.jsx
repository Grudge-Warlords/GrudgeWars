import React, { useRef, useEffect, useState, useCallback } from 'react';

const TILE = 16;
const SCALE = 3;
const TS = TILE * SCALE;
const GAME_W = 960;
const GAME_H = 540;
const GRAVITY = 0.6;
const MAX_FALL = 14;
const PLAYER_SPEED = 3.8;
const JUMP_FORCE = -11;
const COYOTE_TIME = 6;
const JUMP_BUFFER = 8;
const WALL_JUMP_X = 7;
const WALL_JUMP_Y = -10;
const ROLL_SPEED = 7;
const ROLL_FRAMES = 24;
const ROLL_CD = 40;
const ATTACK_FRAMES = 42;
const HIT_IFRAME = 40;
const PROJ_SPEED = 8;
const PROJ_CD = 30;

const HERO_DEFS = [
  {
    id: 'knight',
    name: 'Dark Knight',
    desc: 'Balanced fighter with devastating combos',
    color: '#22d3ee',
    hp: 100,
    atk: 18,
    spd: 1.0,
    frameW: 128,
    frameH: 64,
    drawScale: 1.5,
    offsetY: -10,
    sheets: {
      idle:   { src: '/platformer/knight/idle.png',   cols: 2, rows: 4, count: 4, speed: 300 },
      run:    { src: '/platformer/knight/run.png',    cols: 2, rows: 4, count: 6, speed: 180 },
      jump:   { src: '/platformer/knight/jump.png',   cols: 2, rows: 4, count: 3, speed: 240 },
      fall:   { src: '/platformer/knight/jump.png',   cols: 2, rows: 4, count: 3, speed: 240, startFrame: 2 },
      roll:   { src: '/platformer/knight/roll.png',   cols: 2, rows: 2, count: 4, speed: 120 },
      attack1:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 100, row: 0 },
      attack2:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 100, row: 1 },
      attack3:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 100, row: 2 },
      hurt:   { src: '/platformer/knight/hurt.png',   cols: 2, rows: 2, count: 2, speed: 240 },
      death:  { src: '/platformer/knight/death.png',  cols: 2, rows: 2, count: 4, speed: 280 },
      crouch: { src: '/platformer/knight/crouch_idle.png', cols: 2, rows: 4, count: 4, speed: 400 },
      slide:  { src: '/platformer/knight/slide.png',  cols: 4, rows: 3, count: 4, speed: 160 },
      airAtk: { src: '/platformer/knight/attack_air.png', cols: 2, rows: 4, count: 4, speed: 130 },
      pray:   { src: '/platformer/knight/pray.png',   cols: 4, rows: 3, count: 8, speed: 240 },
      health: { src: '/platformer/knight/health.png', cols: 2, rows: 4, count: 6, speed: 200 },
      climb:  { src: '/platformer/knight/climb.png',  cols: 2, rows: 3, count: 6, speed: 240 },
      hang:   { src: '/platformer/knight/hanging.png',cols: 2, rows: 4, count: 4, speed: 400 },
    }
  },
  {
    id: 'warrior',
    name: 'Cliff Warrior',
    desc: 'Swift blade master from the Magic Cliffs',
    color: '#a855f7',
    hp: 80,
    atk: 22,
    spd: 1.15,
    frameW: 128,
    frameH: 96,
    drawScale: 1.3,
    offsetY: -16,
    sheets: {
      idle:   { src: '/platformer/player/idle.png',   cols: 4, rows: 1, count: 4, speed: 300 },
      run:    { src: '/platformer/player/run.png',    cols: 8, rows: 1, count: 8, speed: 160 },
      jump:   { src: '/platformer/player/jump.png',   cols: 3, rows: 1, count: 3, speed: 240 },
      fall:   { src: '/platformer/player/fall.png',   cols: 2, rows: 1, count: 2, speed: 280 },
      roll:   { src: '/platformer/player/crouch.png', cols: 3, rows: 1, count: 3, speed: 140 },
      attack1:{ src: '/platformer/player/attack.png', cols: 8, rows: 1, count: 8, speed: 100 },
      attack2:{ src: '/platformer/player/crouch-attack.png', cols: 5, rows: 1, count: 5, speed: 110 },
      attack3:{ src: '/platformer/player/jump-attack.png', cols: 5, rows: 1, count: 5, speed: 110 },
      hurt:   { src: '/platformer/player/hurt.png',   cols: 1, rows: 1, count: 1, speed: 400 },
      death:  { src: '/platformer/player/death.png',  cols: 8, rows: 1, count: 8, speed: 260 },
      crouch: { src: '/platformer/player/crouch.png', cols: 3, rows: 1, count: 3, speed: 400 },
      slide:  { src: '/platformer/player/crouch.png', cols: 3, rows: 1, count: 3, speed: 160 },
      airAtk: { src: '/platformer/player/jump-attack.png', cols: 5, rows: 1, count: 5, speed: 120 },
    }
  },
  {
    id: 'shadow',
    name: 'Shadow Ronin',
    desc: 'Deadly assassin wreathed in dark energy',
    color: '#f59e0b',
    hp: 70,
    atk: 26,
    spd: 1.3,
    frameW: 128,
    frameH: 64,
    drawScale: 1.5,
    offsetY: -10,
    tint: 'hue-rotate(200deg) saturate(1.4) brightness(0.85)',
    sheets: {
      idle:   { src: '/platformer/knight/idle.png',   cols: 2, rows: 4, count: 4, speed: 260 },
      run:    { src: '/platformer/knight/run.png',    cols: 2, rows: 4, count: 6, speed: 150 },
      jump:   { src: '/platformer/knight/jump.png',   cols: 2, rows: 4, count: 3, speed: 220 },
      fall:   { src: '/platformer/knight/jump.png',   cols: 2, rows: 4, count: 3, speed: 220, startFrame: 2 },
      roll:   { src: '/platformer/knight/roll.png',   cols: 2, rows: 2, count: 4, speed: 100 },
      attack1:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 84 },
      attack2:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 84, row: 1 },
      attack3:{ src: '/platformer/knight/attacks.png',cols: 8, rows: 5, count: 8, speed: 84, row: 2 },
      hurt:   { src: '/platformer/knight/hurt.png',   cols: 2, rows: 2, count: 2, speed: 200 },
      death:  { src: '/platformer/knight/death.png',  cols: 2, rows: 2, count: 4, speed: 260 },
      crouch: { src: '/platformer/knight/crouch_idle.png', cols: 2, rows: 4, count: 4, speed: 360 },
      slide:  { src: '/platformer/knight/slide.png',  cols: 4, rows: 3, count: 4, speed: 130 },
      airAtk: { src: '/platformer/knight/attack_air.png', cols: 2, rows: 4, count: 4, speed: 110 },
    }
  }
];

const ENEMY_DEFS = {
  fox: {
    src: '/platformer/enemies/fox.png',
    frameW: 48, frameH: 48, frames: 13, speed: 200,
    hp: 30, atk: 8, moveSpeed: 1.2, w: 30, h: 36
  },
  foxSword: {
    src: '/platformer/enemies/fox-sword.png',
    frameW: 48, frameH: 48, frames: 13, speed: 180,
    hp: 50, atk: 14, moveSpeed: 1.5, w: 30, h: 36
  },
  ninja: {
    src: '/platformer/enemies/shuriken-dude.png',
    frameW: 64, frameH: 64, frames: 11, speed: 220,
    hp: 60, atk: 12, moveSpeed: 1.0, w: 36, h: 48, ranged: true
  }
};

const LEVEL_H = 18;

function generateLevel(stage = 1) {
  const seed = stage * 7 + 13;
  function seededRand(i) {
    let x = Math.sin(seed * 9301 + i * 4973) * 49297;
    return x - Math.floor(x);
  }
  let ri = 0;
  const rand = () => seededRand(ri++);

  const baseW = 100 + stage * 20;
  const LEVEL_W = Math.min(baseW, 200);
  const grid = Array.from({ length: LEVEL_H }, () => new Array(LEVEL_W).fill(0));

  const terrain = [];
  let groundY = 12;
  for (let x = 0; x < LEVEL_W; x++) {
    if (x > 10 && rand() < 0.04) {
      groundY = Math.max(9, Math.min(15, groundY + (rand() > 0.5 ? -2 : 2)));
    }
    if (x > 8 && x < LEVEL_W - 8 && rand() < 0.06 + stage * 0.01) {
      groundY = Math.max(9, Math.min(15, groundY + (rand() > 0.5 ? -3 : 3)));
    }
    terrain[x] = groundY;
    for (let y = groundY; y < LEVEL_H; y++) {
      grid[y][x] = y === groundY ? 1 : 2;
    }
  }

  const numGaps = 3 + stage * 2;
  const gaps = [];
  for (let i = 0; i < numGaps; i++) {
    const gx = 15 + Math.floor(rand() * (LEVEL_W - 30));
    const gw = 2 + Math.floor(rand() * (2 + stage));
    let skip = false;
    for (const prev of gaps) {
      if (Math.abs(gx - prev.x) < prev.w + 6) { skip = true; break; }
    }
    if (skip) continue;
    gaps.push({ x: gx, w: gw });
    for (let xx = gx; xx < gx + gw && xx < LEVEL_W; xx++) {
      for (let yy = 0; yy < LEVEL_H; yy++) grid[yy][xx] = 0;
      terrain[xx] = LEVEL_H;
    }
  }

  const platforms = [];
  const numPlats = 14 + stage * 4;
  for (let i = 0; i < numPlats; i++) {
    const px = 6 + Math.floor(rand() * (LEVEL_W - 12));
    const pw = 2 + Math.floor(rand() * 4);
    const minGround = Math.min(...terrain.slice(px, px + pw).filter(v => v < LEVEL_H));
    const py = Math.max(2, minGround - 2 - Math.floor(rand() * 4));
    let skip = false;
    for (const prev of platforms) {
      if (Math.abs(px - prev.x) < prev.w + 2 && Math.abs(py - prev.y) < 3) { skip = true; break; }
    }
    if (skip) continue;
    platforms.push({ x: px, y: py, w: pw });
    for (let xx = px; xx < px + pw && xx < LEVEL_W; xx++) {
      grid[py][xx] = 3;
    }
  }

  const numWalls = 2 + stage;
  const walls = [];
  for (let i = 0; i < numWalls; i++) {
    const wx = 20 + Math.floor(rand() * (LEVEL_W - 40));
    const groundAtW = terrain[wx];
    if (groundAtW >= LEVEL_H) continue;
    const wallH = 3 + Math.floor(rand() * 4);
    const wy1 = groundAtW - wallH;
    walls.push({ x: wx, y1: wy1, y2: groundAtW });
    for (let wy = wy1; wy < groundAtW; wy++) {
      if (wy >= 0) grid[wy][wx] = 4;
    }
    if (rand() > 0.4) {
      const platY = wy1 - 1;
      if (platY >= 2) {
        for (let xx = wx - 1; xx <= wx + 1 && xx < LEVEL_W && xx >= 0; xx++) {
          grid[platY][xx] = 3;
        }
      }
    }
  }

  const cliffSections = Math.floor(stage / 2) + 1;
  for (let c = 0; c < cliffSections; c++) {
    const cx = 25 + Math.floor(rand() * (LEVEL_W - 50));
    const cw = 6 + Math.floor(rand() * 4);
    const cliffTop = 4 + Math.floor(rand() * 3);
    for (let xx = cx; xx < cx + cw && xx < LEVEL_W; xx++) {
      const gt = terrain[xx];
      if (gt >= LEVEL_H) continue;
      for (let yy = cliffTop; yy < gt; yy++) {
        grid[yy][xx] = yy === cliffTop ? 1 : 2;
      }
      terrain[xx] = cliffTop;
    }
    for (let step = 0; step < 3; step++) {
      const sx = cx + cw + step * 2;
      const stepY = cliffTop + (step + 1) * 2;
      if (sx < LEVEL_W && stepY < LEVEL_H) {
        for (let xx = sx; xx < sx + 2 && xx < LEVEL_W; xx++) {
          grid[stepY][xx] = 3;
        }
      }
    }
  }

  const enemyTypes = ['fox', 'foxSword', 'ninja'];
  const enemies = [];
  const numEnemies = 8 + stage * 3;
  for (let i = 0; i < numEnemies; i++) {
    const ex = 10 + Math.floor(rand() * (LEVEL_W - 20));
    const gt = terrain[ex];
    if (gt >= LEVEL_H) continue;
    const typeIdx = Math.min(Math.floor(rand() * (1 + stage * 0.5)), enemyTypes.length - 1);
    enemies.push({ type: enemyTypes[typeIdx], x: ex, y: gt - 1 });
  }

  const pickups = [];
  const numPickups = 3 + stage;
  for (let i = 0; i < numPickups; i++) {
    const px = 10 + Math.floor(rand() * (LEVEL_W - 20));
    const gt = terrain[px];
    if (gt >= LEVEL_H) continue;
    pickups.push({ x: px, y: gt - 3, type: 'health' });
  }

  let spawnGround = terrain[3];
  if (spawnGround >= LEVEL_H) spawnGround = 12;

  let goalX = LEVEL_W - 4;
  let goalGround = terrain[goalX];
  if (goalGround >= LEVEL_H) goalGround = 12;

  return { grid, enemies, pickups, groundY: 12, spawn: { x: 3, y: spawnGround - 2 }, goal: { x: goalX, y: goalGround - 2 }, width: LEVEL_W };
}

function loadImg(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadAllAssets(heroDef) {
  const assets = { sheets: {}, env: {}, enemies: {}, fx: {} };

  const sheetPromises = Object.entries(heroDef.sheets).map(async ([key, cfg]) => {
    assets.sheets[key] = await loadImg(cfg.src);
  });

  const envPromises = ['sky', 'far-grounds', 'clouds', 'sea', 'tileset'].map(async name => {
    assets.env[name] = await loadImg(`/platformer/env/${name}.png`);
  });

  const enemyPromises = Object.entries(ENEMY_DEFS).map(async ([key, def]) => {
    assets.enemies[key] = await loadImg(def.src);
  });

  const fxNames = [
    'Bolt', 'Pulse', 'charged', 'spark', 'hit', 'waveform', 'crossed',
    'explosion-1-a', 'explosion-1-b', 'explosion-1-c', 'explosion-1-d',
    'explosion-1-e', 'explosion-1-f', 'explosion-1-g'
  ];
  const fxPromises = fxNames.map(async name => {
    assets.fx[name] = await loadImg(`/platformer/fx/${name}.png`);
  });

  await Promise.all([...sheetPromises, ...envPromises, ...enemyPromises, ...fxPromises]);

  if (heroDef.tint) {
    const tinted = {};
    for (const [key, img] of Object.entries(assets.sheets)) {
      if (!img) continue;
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext('2d');
      cx.filter = heroDef.tint;
      cx.drawImage(img, 0, 0);
      tinted[key] = c;
    }
    assets.sheets = tinted;
  }

  return assets;
}

function tileAt(grid, tx, ty) {
  if (ty < 0 || ty >= LEVEL_H || tx < 0 || tx >= grid[0].length) return 0;
  return grid[ty][tx];
}

function isSolid(grid, tx, ty) {
  const t = tileAt(grid, tx, ty);
  return t === 1 || t === 2 || t === 4;
}

function isPlatform(grid, tx, ty) {
  return tileAt(grid, tx, ty) === 3;
}

function collidesWorld(grid, x, y, w, h, skipPlatforms = false) {
  const l = Math.floor(x / TS);
  const r = Math.floor((x + w - 1) / TS);
  const t = Math.floor(y / TS);
  const b = Math.floor((y + h - 1) / TS);
  for (let ty = t; ty <= b; ty++) {
    for (let tx = l; tx <= r; tx++) {
      if (isSolid(grid, tx, ty)) return true;
      if (!skipPlatforms && isPlatform(grid, tx, ty)) return true;
    }
  }
  return false;
}

function resolveY(grid, x, y, w, h, vy) {
  if (vy > 0) {
    const footY = y + h;
    const tileY = Math.floor(footY / TS);
    const l = Math.floor(x / TS);
    const r = Math.floor((x + w - 1) / TS);
    for (let tx = l; tx <= r; tx++) {
      if (isSolid(grid, tx, tileY) || isPlatform(grid, tx, tileY)) {
        const topOfTile = tileY * TS;
        if (y + h - vy <= topOfTile + 2) {
          return { y: topOfTile - h, grounded: true };
        }
      }
    }
  } else if (vy < 0) {
    const headY = y;
    const tileY = Math.floor(headY / TS);
    const l = Math.floor(x / TS);
    const r = Math.floor((x + w - 1) / TS);
    for (let tx = l; tx <= r; tx++) {
      if (isSolid(grid, tx, tileY)) {
        return { y: (tileY + 1) * TS, grounded: false };
      }
    }
  }
  return null;
}

function resolveX(grid, x, y, w, h, vx) {
  if (vx > 0) {
    const rightX = x + w;
    const tileX = Math.floor(rightX / TS);
    const t = Math.floor(y / TS);
    const b = Math.floor((y + h - 1) / TS);
    for (let ty = t; ty <= b; ty++) {
      if (isSolid(grid, tileX, ty)) {
        return { x: tileX * TS - w, wall: 1 };
      }
    }
  } else if (vx < 0) {
    const tileX = Math.floor(x / TS);
    const t = Math.floor(y / TS);
    const b = Math.floor((y + h - 1) / TS);
    for (let ty = t; ty <= b; ty++) {
      if (isSolid(grid, tileX, ty)) {
        return { x: (tileX + 1) * TS, wall: -1 };
      }
    }
  }
  return null;
}

function getAnimFrame(anim, timer) {
  const cfg = anim;
  if (!cfg) return { col: 0, row: 0 };
  const startFrame = cfg.startFrame || 0;
  const frame = (startFrame + Math.floor(timer / cfg.speed * 60)) % cfg.count;
  const row = cfg.row !== undefined ? cfg.row : Math.floor(frame / cfg.cols);
  const col = cfg.row !== undefined ? frame % cfg.cols : frame % cfg.cols;
  return { col, row };
}

function drawSprite(ctx, img, frameW, frameH, col, row, dx, dy, drawW, drawH, flip) {
  if (!img) return;
  ctx.save();
  if (flip) {
    ctx.translate(dx + drawW, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, dx, dy, drawW, drawH);
  }
  ctx.restore();
}

function drawSpriteRow(ctx, img, frameW, frameH, frame, dx, dy, drawW, drawH, flip) {
  if (!img) return;
  ctx.save();
  if (flip) {
    ctx.translate(dx + drawW, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, 0, 0, drawW, drawH);
  } else {
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, dx, dy, drawW, drawH);
  }
  ctx.restore();
}

const TILE_MAP = {
  1: { sx: 0, sy: 0 },
  2: { sx: 16, sy: 0 },
  3: { sx: 32, sy: 0 },
  4: { sx: 48, sy: 0 },
};

export default function PlatformRunner() {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('select');
  const [selectedHero, setSelectedHero] = useState(0);
  const [loading, setLoading] = useState(false);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const animFrameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);

  const startGame = useCallback(async (heroIdx, currentStage = 1, carryScore = 0, carryHp = null) => {
    setLoading(true);
    const heroDef = HERO_DEFS[heroIdx];
    const assets = await loadAllAssets(heroDef);
    const level = generateLevel(currentStage);

    const player = {
      x: level.spawn.x * TS,
      y: level.spawn.y * TS,
      vx: 0, vy: 0,
      w: 24, h: 40,
      facing: 1,
      grounded: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      wallDir: 0,
      wallSlideTimer: 0,
      state: 'idle',
      animTimer: 0,
      hp: carryHp !== null ? carryHp : heroDef.hp,
      maxHp: heroDef.hp,
      iframes: 0,
      rollTimer: 0,
      rollCd: 0,
      attackTimer: 0,
      attackCombo: 0,
      comboWindow: 0,
      projCd: 0,
      dead: false,
      deathTimer: 0,
    };

    const enemies = level.enemies.map((e, i) => {
      const def = ENEMY_DEFS[e.type];
      return {
        id: i,
        type: e.type,
        x: e.x * TS,
        y: e.y * TS - def.h * SCALE + TS,
        vx: 0, vy: 0,
        w: def.w, h: def.h,
        hp: def.hp,
        maxHp: def.hp,
        facing: -1,
        state: 'idle',
        animTimer: 0,
        frame: 0,
        patrolDir: 1,
        patrolTimer: 0,
        attackCd: 0,
        iframes: 0,
        dead: false,
        deathTimer: 0,
        aggro: false,
        aggroRange: 200,
        projCd: 0,
      };
    });

    const pickups = level.pickups.map(p => ({
      x: p.x * TS + TS / 4,
      y: p.y * TS,
      type: p.type,
      collected: false,
    }));

    const projectiles = [];
    const particles = [];
    const vfx = [];
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = GAME_W;
      canvas.height = GAME_H;
    }
    const initW = GAME_W;
    const initH = GAME_H;
    let camera = {
      x: Math.max(0, player.x + player.w / 2 - initW / 2),
      y: Math.max(0, player.y + player.h / 2 - initH / 2),
    };
    let gameTime = 0;
    let won = false;
    let scoreVal = carryScore;

    const game = {
      player, enemies, pickups, projectiles, particles, vfx,
      camera, level, assets, heroDef, gameTime, won, score: scoreVal,
      stage: currentStage, heroIdx,
    };
    gameRef.current = game;

    setLoading(false);
    setPhase('playing');

    const keys = keysRef.current;
    let lastTime = performance.now();

    function gameLoop(now) {
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;
      const g = gameRef.current;
      if (!g) return;

      g.gameTime += dt;
      updatePlayer(g, keys, dt);
      updateEnemies(g, dt);
      updateProjectiles(g, dt);
      updateParticles(g, dt);
      updateVFX(g, dt);
      checkPickups(g);
      checkGoal(g);
      updateCamera(g);
      render(g);
      setScore(Math.floor(g.score));

      if (g.player.dead && g.player.deathTimer > 120) {
        setPhase('dead');
        return;
      }
      if (g.won && g.gameTime > 30) {
        setStage(g.stage);
        setPhase('victory');
        return;
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyZ','KeyX','KeyC','KeyA','KeyD','KeyW','KeyS','ShiftLeft','ShiftRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = e.type === 'keydown';
      if (e.type === 'keydown') {
        keysRef.current[e.code + '_just'] = true;
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  function consumeKey(code) {
    const v = keysRef.current[code + '_just'];
    keysRef.current[code + '_just'] = false;
    return v;
  }

  function updatePlayer(g, keys, dt) {
    const p = g.player;
    const def = g.heroDef;
    const grid = g.level.grid;
    const spd = PLAYER_SPEED * def.spd;

    if (p.dead) {
      p.deathTimer += dt;
      const deathCfg = def.sheets['death'];
      if (deathCfg) {
        const maxTime = (deathCfg.count - 1) * (deathCfg.speed / 60);
        if (p.animTimer < maxTime) p.animTimer += dt;
      }
      return;
    }

    p.iframes = Math.max(0, p.iframes - dt);
    p.rollCd = Math.max(0, p.rollCd - dt);
    p.projCd = Math.max(0, p.projCd - dt);
    p.comboWindow = Math.max(0, p.comboWindow - dt);

    if (p.comboWindow <= 0) p.attackCombo = 0;

    if (p.rollTimer > 0) {
      p.rollTimer -= dt;
      p.vx = p.facing * ROLL_SPEED * def.spd;
      p.vy += GRAVITY * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const rx = resolveX(grid, p.x, p.y, p.w, p.h, p.vx);
      if (rx) { p.x = rx.x; p.vx = 0; }
      const ry = resolveY(grid, p.x, p.y, p.w, p.h, p.vy);
      if (ry) { p.y = ry.y; p.grounded = ry.grounded; if (ry.grounded) p.vy = 0; }

      p.state = 'roll';
      p.animTimer += dt;
      return;
    }

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      p.vx *= 0.85;
      p.vy += GRAVITY * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      p.y += p.vy * dt;
      p.x += p.vx * dt;

      const rx = resolveX(grid, p.x, p.y, p.w, p.h, p.vx);
      if (rx) p.x = rx.x;
      const ry = resolveY(grid, p.x, p.y, p.w, p.h, p.vy);
      if (ry) { p.y = ry.y; p.grounded = ry.grounded; if (ry.grounded) p.vy = 0; }

      if (p.attackTimer <= ATTACK_FRAMES * 0.4 && p.attackTimer > ATTACK_FRAMES * 0.3) {
        const atkBox = {
          x: p.x + (p.facing > 0 ? p.w : -40),
          y: p.y - 5,
          w: 40, h: p.h + 10,
        };
        g.enemies.forEach(e => {
          if (e.dead || e.iframes > 0) return;
          if (boxOverlap(atkBox, { x: e.x, y: e.y, w: e.w, h: e.h })) {
            e.hp -= def.atk;
            e.iframes = 20;
            e.vx = p.facing * 4;
            g.score += 10;
            spawnHitParticles(g, e.x + e.w / 2, e.y + e.h / 2, def.color);
            spawnVFX(g, 'slash', e.x + e.w / 2, e.y + e.h / 2, p.facing);
            spawnVFX(g, 'hit', e.x + e.w / 2 + p.facing * 8, e.y + e.h / 3, p.facing);
            if (e.hp <= 0) {
              e.dead = true;
              e.deathTimer = 0;
              g.score += 50;
              spawnVFX(g, 'splat', e.x + e.w / 2, e.y + e.h / 2, p.facing);
              spawnVFX(g, 'bigBlast', e.x + e.w / 2, e.y + e.h / 2, 1);
            }
          }
        });
      }

      const comboStr = p.grounded
        ? ['attack1', 'attack2', 'attack3'][Math.min(p.attackCombo, 2)]
        : 'airAtk';
      p.state = comboStr;
      p.animTimer += dt;

      if (consumeKey('KeyZ') || consumeKey('Space')) {
        if (p.attackTimer < ATTACK_FRAMES * 0.3 && p.attackCombo < 2) {
          p.attackCombo++;
          p.attackTimer = ATTACK_FRAMES;
          p.animTimer = 0;
        }
      }
      return;
    }

    let moveX = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) moveX = -1;
    if (keys['ArrowRight'] || keys['KeyD']) moveX = 1;

    if (moveX !== 0) p.facing = moveX;
    p.vx = moveX * spd;

    const wantJump = consumeKey('ArrowUp') || consumeKey('KeyW') || consumeKey('Space');
    const wantRoll = consumeKey('KeyX') || consumeKey('ShiftLeft') || consumeKey('ShiftRight');
    const wantAttack = consumeKey('KeyZ');
    const wantRanged = consumeKey('KeyC');

    if (p.grounded) {
      p.coyoteTimer = COYOTE_TIME;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (wantJump) p.jumpBuffer = JUMP_BUFFER;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

    if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBuffer = 0;
    } else if (wantJump && p.wallDir !== 0) {
      p.vx = -p.wallDir * WALL_JUMP_X;
      p.vy = WALL_JUMP_Y;
      p.facing = -p.wallDir;
      p.grounded = false;
      p.wallDir = 0;
      p.jumpBuffer = 0;
    }

    if (wantRoll && p.rollCd <= 0) {
      p.rollTimer = ROLL_FRAMES;
      p.rollCd = ROLL_CD;
      p.iframes = ROLL_FRAMES;
      p.animTimer = 0;
      return;
    }

    if (wantAttack) {
      p.attackTimer = ATTACK_FRAMES;
      p.comboWindow = ATTACK_FRAMES * 2;
      p.animTimer = 0;
      return;
    }

    if (wantRanged && p.projCd <= 0) {
      p.projCd = PROJ_CD;
      g.projectiles.push({
        x: p.x + (p.facing > 0 ? p.w : -8),
        y: p.y + p.h / 2 - 8,
        vx: p.facing * PROJ_SPEED,
        vy: 0,
        w: 16, h: 16,
        owner: 'player',
        atk: Math.floor(def.atk * 0.8),
        life: 80,
        fxType: 'Bolt',
      });
    }

    p.vy += GRAVITY * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    if (!(keys['ArrowUp'] || keys['KeyW']) && p.vy < -2) {
      p.vy *= 0.85;
    }

    p.x += p.vx * dt;
    const rx = resolveX(grid, p.x, p.y, p.w, p.h, p.vx);
    p.wallDir = 0;
    if (rx) {
      p.x = rx.x;
      p.vx = 0;
      if (!p.grounded && p.vy > 0) {
        p.wallDir = rx.wall;
        p.vy = Math.min(p.vy, 2);
      }
    }

    p.y += p.vy * dt;
    p.grounded = false;
    const ry = resolveY(grid, p.x, p.y, p.w, p.h, p.vy);
    if (ry) {
      p.y = ry.y;
      p.grounded = ry.grounded;
      if (ry.grounded) p.vy = 0;
      else p.vy = 0;
    }

    if (p.y > LEVEL_H * TS + 100) {
      p.hp = 0;
      p.dead = true;
      p.deathTimer = 0;
    }

    if (p.grounded) {
      if (Math.abs(moveX) > 0) p.state = 'run';
      else if (keys['ArrowDown'] || keys['KeyS']) p.state = 'crouch';
      else p.state = 'idle';
    } else {
      if (p.wallDir !== 0) p.state = 'slide';
      else if (p.vy < 0) p.state = 'jump';
      else p.state = 'fall';
    }

    p.animTimer += dt;
  }

  function updateEnemies(g, dt) {
    const p = g.player;
    g.enemies.forEach(e => {
      if (e.dead) {
        e.deathTimer += dt;
        e.animTimer += dt;
        return;
      }
      e.iframes = Math.max(0, e.iframes - dt);
      e.attackCd = Math.max(0, e.attackCd - dt);
      e.projCd = Math.max(0, e.projCd - dt);

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const def = ENEMY_DEFS[e.type];

      e.aggro = dist < e.aggroRange && !p.dead;

      if (e.aggro) {
        e.facing = dx > 0 ? 1 : -1;
        if (def.ranged) {
          if (dist > 100) {
            e.vx = e.facing * def.moveSpeed * 0.5;
          } else {
            e.vx = 0;
          }
          if (e.projCd <= 0 && dist < 250) {
            e.projCd = 60;
            g.projectiles.push({
              x: e.x + (e.facing > 0 ? e.w : -8),
              y: e.y + e.h / 2 - 4,
              vx: e.facing * 5,
              vy: 0,
              w: 12, h: 8,
              owner: 'enemy',
              atk: def.atk,
              life: 60,
              fxType: 'spark',
            });
          }
        } else {
          e.vx = e.facing * def.moveSpeed;
          if (dist < 40 && e.attackCd <= 0) {
            if (p.iframes <= 0 && !p.dead) {
              p.hp -= def.atk;
              p.iframes = HIT_IFRAME;
              p.vx = e.facing * 3;
              p.vy = -4;
              spawnHitParticles(g, p.x + p.w / 2, p.y + p.h / 2, '#ef4444');
              spawnVFX(g, 'impact', p.x + p.w / 2, p.y + p.h / 2, e.facing);
              spawnVFX(g, 'bleed', p.x + p.w / 2, p.y + p.h / 3, e.facing);
              if (p.hp <= 0) {
                p.dead = true;
                p.deathTimer = 0;
                p.state = 'death';
                p.animTimer = 0;
                spawnVFX(g, 'bigBlast', p.x + p.w / 2, p.y + p.h / 2, 1);
              }
            }
            e.attackCd = 40;
          }
        }
      } else {
        e.patrolTimer += dt;
        if (e.patrolTimer > 60) {
          e.patrolDir *= -1;
          e.patrolTimer = 0;
        }
        e.facing = e.patrolDir;
        e.vx = e.patrolDir * def.moveSpeed * 0.4;
      }

      e.vy = (e.vy || 0) + GRAVITY * dt;
      if (e.vy > MAX_FALL) e.vy = MAX_FALL;

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      const erx = resolveX(g.level.grid, e.x, e.y, e.w, e.h, e.vx);
      if (erx) {
        e.x = erx.x;
        e.vx = 0;
        if (!e.aggro) e.patrolDir *= -1;
      }

      const ery = resolveY(g.level.grid, e.x, e.y, e.w, e.h, e.vy);
      if (ery) {
        e.y = ery.y;
        if (ery.grounded) e.vy = 0;
      }

      e.animTimer += dt;
      e.frame = Math.floor(e.animTimer / (def.speed / 60)) % def.frames;
    });
  }

  function updateProjectiles(g, dt) {
    g.projectiles.forEach(proj => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
    });

    g.projectiles = g.projectiles.filter(proj => {
      if (proj.life <= 0) return false;
      if (proj.x < 0 || proj.x > g.level.width * TS) return false;

      const grid = g.level.grid;
      const tx = Math.floor(proj.x / TS);
      const ty = Math.floor(proj.y / TS);
      if (isSolid(grid, tx, ty)) {
        spawnHitParticles(g, proj.x, proj.y, '#60a5fa');
        spawnVFX(g, 'spark', proj.x, proj.y, proj.vx > 0 ? 1 : -1);
        return false;
      }

      if (proj.owner === 'player') {
        for (const e of g.enemies) {
          if (e.dead || e.iframes > 0) continue;
          if (boxOverlap(proj, { x: e.x, y: e.y, w: e.w, h: e.h })) {
            e.hp -= proj.atk;
            e.iframes = 15;
            e.vx = (proj.vx > 0 ? 1 : -1) * 3;
            g.score += 10;
            spawnHitParticles(g, proj.x, proj.y, g.heroDef.color);
            spawnVFX(g, 'impact', proj.x, proj.y, proj.vx > 0 ? 1 : -1);
            spawnVFX(g, 'splat', e.x + e.w / 2, e.y + e.h / 2, proj.vx > 0 ? 1 : -1);
            if (e.hp <= 0) {
              e.dead = true;
              e.deathTimer = 0;
              g.score += 50;
              spawnVFX(g, 'bigBlast', e.x + e.w / 2, e.y + e.h / 2, 1);
            }
            return false;
          }
        }
      } else {
        const p = g.player;
        if (!p.dead && p.iframes <= 0 && p.rollTimer <= 0) {
          if (boxOverlap(proj, { x: p.x, y: p.y, w: p.w, h: p.h })) {
            p.hp -= proj.atk;
            p.iframes = HIT_IFRAME;
            spawnHitParticles(g, p.x + p.w / 2, p.y + p.h / 2, '#ef4444');
            spawnVFX(g, 'impact', p.x + p.w / 2, p.y + p.h / 2, proj.vx > 0 ? 1 : -1);
            spawnVFX(g, 'bleed', p.x + p.w / 2, p.y + p.h / 3, proj.vx > 0 ? 1 : -1);
            if (p.hp <= 0) {
              p.dead = true;
              p.deathTimer = 0;
              p.state = 'death';
              p.animTimer = 0;
              spawnVFX(g, 'bigBlast', p.x + p.w / 2, p.y + p.h / 2, 1);
            }
            return false;
          }
        }
      }
      return true;
    });
  }

  function updateParticles(g, dt) {
    g.particles.forEach(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      pt.vy += 0.15 * dt;
    });
    g.particles = g.particles.filter(pt => pt.life > 0);
  }

  function checkPickups(g) {
    const p = g.player;
    if (p.dead) return;
    g.pickups.forEach(pk => {
      if (pk.collected) return;
      const dist = Math.abs(p.x + p.w / 2 - pk.x) + Math.abs(p.y + p.h / 2 - pk.y);
      if (dist < 40) {
        pk.collected = true;
        if (pk.type === 'health') {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          g.score += 25;
          for (let i = 0; i < 6; i++) {
            g.particles.push({
              x: pk.x, y: pk.y,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 4,
              life: 25, color: '#22c55e', size: 3,
            });
          }
        }
      }
    });
  }

  function checkGoal(g) {
    const p = g.player;
    if (p.dead || g.won) return;
    const goal = g.level.goal;
    if (Math.abs(p.x - goal.x * TS) < TS && Math.abs(p.y - goal.y * TS) < TS * 2) {
      g.won = true;
      g.score += 500 + g.stage * 200;
    }
  }

  function updateCamera(g) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const p = g.player;
    const levelPxW = g.level.width * TS;
    const levelPxH = LEVEL_H * TS;
    const targetX = p.x + p.w / 2 - W / 2;
    const targetY = p.y + p.h / 2 - H / 2;
    g.camera.x += (targetX - g.camera.x) * 0.12;
    g.camera.y += (targetY - g.camera.y) * 0.12;
    if (levelPxW <= W) {
      g.camera.x = -(W - levelPxW) / 2;
    } else {
      g.camera.x = Math.max(0, Math.min(levelPxW - W, g.camera.x));
    }
    if (levelPxH <= H) {
      g.camera.y = -(H - levelPxH) / 2;
    } else {
      g.camera.y = Math.max(0, Math.min(levelPxH - H, g.camera.y));
    }
  }

  function boxOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnHitParticles(g, x, y, color) {
    for (let i = 0; i < 8; i++) {
      g.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 20 + Math.random() * 15,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  const VFX_DEFS = {
    slash:    { sprite: 'crossed',       frameSize: 32,  duration: 20, scale: 2.8, tint: null },
    hit:      { sprite: 'hit',           frameSize: 32,  duration: 10, scale: 2.5, tint: null },
    impact:   { sprite: 'explosion-1-a', frameSize: 32,  duration: 18, scale: 2.2, tint: null },
    splat:    { sprite: 'explosion-1-f', frameSize: 48,  duration: 20, scale: 2.0, tint: null },
    bleed:    { sprite: 'spark',         frameSize: 32,  duration: 22, scale: 2.0, tint: 'hue-rotate(320deg) saturate(2)' },
    spark:    { sprite: 'spark',         frameSize: 32,  duration: 16, scale: 1.8, tint: null },
    bigBlast: { sprite: 'explosion-1-d', frameSize: 128, duration: 28, scale: 1.6, tint: null },
    wave:     { sprite: 'waveform',      frameSize: 32,  duration: 18, scale: 2.4, tint: null },
    charged:  { sprite: 'charged',       frameSize: 48,  duration: 24, scale: 2.0, tint: null },
    pulse:    { sprite: 'Pulse',         frameSize: 32,  duration: 16, scale: 2.2, tint: null },
  };

  function spawnVFX(g, type, x, y, facing = 1) {
    const def = VFX_DEFS[type];
    if (!def) return;
    g.vfx.push({
      type, x, y, facing,
      timer: 0,
      duration: def.duration,
      scale: def.scale,
      sprite: def.sprite,
      frameSize: def.frameSize,
      tint: def.tint,
    });
  }

  function updateVFX(g, dt) {
    for (let i = g.vfx.length - 1; i >= 0; i--) {
      g.vfx[i].timer += dt;
      if (g.vfx[i].timer >= g.vfx[i].duration) {
        g.vfx.splice(i, 1);
      }
    }
  }

  function drawVFX(ctx, g, cam) {
    g.vfx.forEach(v => {
      const img = g.assets.fx[v.sprite];
      if (!img) return;
      const fw = v.frameSize;
      const fh = img.height;
      const totalFrames = Math.floor(img.width / fw);
      if (totalFrames <= 0) return;
      const progress = v.timer / v.duration;
      const frame = Math.min(Math.floor(progress * totalFrames), totalFrames - 1);
      const drawW = fw * v.scale;
      const drawH = fh * v.scale;
      const sx = v.x - cam.x - drawW / 2;
      const sy = v.y - cam.y - drawH / 2;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - progress) * 2);
      if (v.tint) ctx.filter = v.tint;
      if (v.facing < 0) {
        ctx.translate(sx + drawW, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, frame * fw, 0, fw, fh, 0, 0, drawW, drawH);
      } else {
        ctx.drawImage(img, frame * fw, 0, fw, fh, sx, sy, drawW, drawH);
      }
      ctx.restore();
    });
  }

  function render(g) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cam = g.camera;
    const a = g.assets;

    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    drawParallax(ctx, cam, a, W, H);
    drawTiles(ctx, g.level.grid, cam, a, W, H);
    drawPickups(ctx, g, cam);
    drawGoalPortal(ctx, g, cam);

    g.enemies.forEach(e => {
      if (e.deathTimer > 40) return;
      const sx = e.x - cam.x;
      const sy = e.y - cam.y;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) return;
      const def = ENEMY_DEFS[e.type];
      const img = a.enemies[e.type];
      if (!img) return;
      const alpha = e.dead ? Math.max(0, 1 - e.deathTimer / 40) : (e.iframes > 0 ? 0.5 : 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawSpriteRow(ctx, img, def.frameW, def.frameH, e.frame, sx - 8, sy - 8, def.frameW * 1.8, def.frameH * 1.8, e.facing < 0);
      ctx.restore();

      if (!e.dead && e.hp < e.maxHp) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(sx - 2, sy - 10, e.w + 4, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx, sy - 8, (e.hp / e.maxHp) * e.w, 3);
      }
    });

    drawPlayer(ctx, g, cam, W);
    drawVFX(ctx, g, cam);

    g.projectiles.forEach(proj => {
      const sx = proj.x - cam.x;
      const sy = proj.y - cam.y;
      const fxImg = a.fx[proj.fxType];
      if (fxImg) {
        const fw = fxImg.height;
        const frames = Math.floor(fxImg.width / fw);
        const f = Math.floor(g.gameTime * 3) % Math.max(1, frames);
        ctx.save();
        if (proj.vx < 0) {
          ctx.translate(sx + 16, sy);
          ctx.scale(-1, 1);
          ctx.drawImage(fxImg, f * fw, 0, fw, fxImg.height, 0, 0, 24, 24);
        } else {
          ctx.drawImage(fxImg, f * fw, 0, fw, fxImg.height, sx, sy, 24, 24);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = proj.owner === 'player' ? '#22d3ee' : '#ef4444';
        ctx.fillRect(sx, sy, proj.w, proj.h);
      }
    });

    g.particles.forEach(pt => {
      const sx = pt.x - cam.x;
      const sy = pt.y - cam.y;
      const alpha = Math.min(1, pt.life / 10);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(sx, sy, pt.size, pt.size);
      ctx.restore();
    });

    drawHUD(ctx, g, W, H);

    if (g.won) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 48px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`STAGE ${g.stage} CLEAR`, W / 2, H / 2 - 30);
      ctx.font = '20px Jost, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Score: ${Math.floor(g.score)}`, W / 2, H / 2 + 10);
      ctx.fillStyle = '#22c55e';
      ctx.fillText('Press ENTER for next stage', W / 2, H / 2 + 45);
      ctx.restore();
    }
  }

  function drawParallax(ctx, cam, a, W, H) {
    const skyImg = a.env['sky'];
    if (skyImg) {
      for (let x = 0; x < W; x += skyImg.width * SCALE) {
        ctx.drawImage(skyImg, x, 0, skyImg.width * SCALE, H);
      }
    }

    const farImg = a.env['far-grounds'];
    if (farImg) {
      const px = -(cam.x * 0.1) % (farImg.width * SCALE);
      const fH = farImg.height * SCALE;
      const fY = H - fH - 60;
      for (let x = px - farImg.width * SCALE; x < W + farImg.width * SCALE; x += farImg.width * SCALE) {
        ctx.drawImage(farImg, x, fY, farImg.width * SCALE, fH);
      }
    }

    const cloudImg = a.env['clouds'];
    if (cloudImg) {
      const px = -(cam.x * 0.2) % (cloudImg.width * SCALE);
      for (let x = px - cloudImg.width * SCALE; x < W + cloudImg.width * SCALE; x += cloudImg.width * SCALE) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(cloudImg, x, 30, cloudImg.width * SCALE, cloudImg.height * SCALE);
        ctx.restore();
      }
    }

    const seaImg = a.env['sea'];
    if (seaImg) {
      const sH = seaImg.height * SCALE;
      const sY = H - sH;
      const px = -(cam.x * 0.3) % (seaImg.width * SCALE);
      for (let x = px - seaImg.width * SCALE; x < W + seaImg.width * SCALE; x += seaImg.width * SCALE) {
        ctx.drawImage(seaImg, x, sY, seaImg.width * SCALE, sH);
      }
    }
  }

  function drawTiles(ctx, grid, cam, a, W, H) {
    const tileImg = a.env['tileset'];
    if (!tileImg) return;

    const startCol = Math.floor(cam.x / TS);
    const endCol = Math.ceil((cam.x + W) / TS);
    const startRow = Math.floor(cam.y / TS);
    const endRow = Math.ceil((cam.y + H) / TS);

    for (let ty = startRow; ty <= endRow; ty++) {
      for (let tx = startCol; tx <= endCol; tx++) {
        const tile = tileAt(grid, tx, ty);
        if (tile === 0) continue;

        const sx = tx * TS - cam.x;
        const sy = ty * TS - cam.y;

        let tsX = 0, tsY = 0;
        if (tile === 1) {
          const above = tileAt(grid, tx, ty - 1);
          const left = tileAt(grid, tx - 1, ty);
          const right = tileAt(grid, tx + 1, ty);
          if (above === 0 || above === 3) {
            if (left === 0) tsX = 0;
            else if (right === 0) tsX = 32;
            else tsX = 16;
            tsY = 0;
          } else {
            tsX = 16;
            tsY = 16;
          }
        } else if (tile === 2) {
          tsX = 16;
          tsY = 32;
        } else if (tile === 3) {
          const left = tileAt(grid, tx - 1, ty) === 3;
          const right = tileAt(grid, tx + 1, ty) === 3;
          if (!left) tsX = 48;
          else if (!right) tsX = 80;
          else tsX = 64;
          tsY = 0;
        } else if (tile === 4) {
          tsX = 48;
          tsY = 16;
        }

        ctx.drawImage(tileImg, tsX, tsY, TILE, TILE, sx, sy, TS, TS);
      }
    }
  }

  function drawPickups(ctx, g, cam) {
    g.pickups.forEach(pk => {
      if (pk.collected) return;
      const sx = pk.x - cam.x;
      const sy = pk.y - cam.y + Math.sin(g.gameTime * 0.08) * 4;
      ctx.save();
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', sx, sy + 12);
      ctx.restore();
    });
  }

  function drawGoalPortal(ctx, g, cam) {
    const goal = g.level.goal;
    const gx = goal.x * TS - cam.x;
    const gy = goal.y * TS - cam.y;
    const pulse = Math.sin(g.gameTime * 0.06) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = pulse;
    const grad = ctx.createRadialGradient(gx + TS / 2, gy + TS, 4, gx + TS / 2, gy + TS, TS);
    grad.addColorStop(0, '#22d3ee');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(gx - TS / 2, gy - TS / 2, TS * 2, TS * 2);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(gx + TS / 2, gy + TS * 0.6, TS * 0.4, TS * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.fillText('EXIT', gx + TS / 2, gy - 4);
    ctx.restore();
  }

  function drawPlayer(ctx, g, cam, W) {
    const p = g.player;
    const def = g.heroDef;
    const a = g.assets;

    const sx = p.x - cam.x;
    const sy = p.y - cam.y;

    const animKey = p.state;
    const animCfg = def.sheets[animKey] || def.sheets['idle'];
    const sheet = a.sheets[animKey] || a.sheets['idle'];

    if (!sheet) return;

    const frameInfo = getAnimFrame(animCfg, p.animTimer);
    const drawW = def.frameW * def.drawScale;
    const drawH = def.frameH * def.drawScale;
    const drawX = sx - (drawW - p.w) / 2;
    const drawY = sy + p.h - drawH + (def.offsetY || 0);

    ctx.save();
    if (p.iframes > 0 && Math.floor(p.iframes * 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (animCfg.rows === 1) {
      const frame = (animCfg.startFrame || 0) + Math.floor(p.animTimer / animCfg.speed * 60) % animCfg.count;
      drawSpriteRow(ctx, sheet, def.frameW, def.frameH, frame, drawX, drawY, drawW, drawH, p.facing < 0);
    } else {
      drawSprite(ctx, sheet, def.frameW, def.frameH, frameInfo.col, frameInfo.row, drawX, drawY, drawW, drawH, p.facing < 0);
    }

    if (p.rollTimer > 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, sy + p.h, p.w * 0.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawHUD(ctx, g, W, H) {
    const p = g.player;

    ctx.fillStyle = 'rgba(5,10,24,0.8)';
    ctx.fillRect(10, 10, 200, 56);
    ctx.strokeStyle = g.heroDef.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 200, 56);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(18, 18, 140, 12);
    const hpFrac = Math.max(0, g.player.hp / g.player.maxHp);
    const hpColor = hpFrac > 0.5 ? '#22c55e' : hpFrac > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(18, 18, 140 * hpFrac, 12);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Jost, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.max(0, Math.ceil(g.player.hp))}/${g.player.maxHp}`, 18, 46);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Stage ${g.stage}`, 18, 58);
    ctx.fillStyle = g.heroDef.color;
    ctx.font = 'bold 13px Jost, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${Math.floor(g.score)}`, 205, 46);

    ctx.fillStyle = 'rgba(5,10,24,0.6)';
    ctx.fillRect(W - 200, H - 35, 190, 25);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Jost, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move  Space:Jump  Z:Attack  X:Roll  C:Ranged', W - 105, H - 18);
  }

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'dead' && phase !== 'victory') return;
    const handleRestart = (e) => {
      if (e.code === 'Enter') {
        const g = gameRef.current;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (phase === 'victory' || (g && g.won)) {
          const nextStage = (g ? g.stage : stage) + 1;
          const heroIdx = g ? g.heroIdx : selectedHero;
          const carryScore = g ? g.score : 0;
          const carryHp = g ? Math.min(g.player.hp + 20, g.player.maxHp) : null;
          gameRef.current = null;
          setStage(nextStage);
          startGame(heroIdx, nextStage, carryScore, carryHp);
        } else {
          gameRef.current = null;
          setStage(1);
          setPhase('select');
        }
      }
    };
    window.addEventListener('keydown', handleRestart);
    return () => window.removeEventListener('keydown', handleRestart);
  }, [phase, stage, selectedHero, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = GAME_W;
    canvas.height = GAME_H;
  }, []);

  if (phase === 'select') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #050a18 0%, #0a1628 50%, #050a18 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Jost, sans-serif', color: '#e2e8f0',
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
            color: '#22d3ee', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Jost, sans-serif', fontSize: 14,
          }}
        >
          ← Back
        </button>

        <h1 style={{
          fontFamily: 'Cinzel, serif', fontSize: 42, color: '#22d3ee',
          textShadow: '0 0 30px rgba(34,211,238,0.4)', marginBottom: 8,
        }}>
          Warlord's Gauntlet
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 40 }}>
          Choose your champion and conquer the Magic Cliffs
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
          {HERO_DEFS.map((hero, i) => (
            <div
              key={hero.id}
              onClick={() => setSelectedHero(i)}
              style={{
                width: 220, padding: '24px 20px',
                background: selectedHero === i
                  ? `linear-gradient(135deg, rgba(${hero.color === '#22d3ee' ? '34,211,238' : hero.color === '#a855f7' ? '168,85,247' : '245,158,11'},0.15), rgba(5,10,24,0.9))`
                  : 'rgba(10,22,40,0.8)',
                border: `2px solid ${selectedHero === i ? hero.color : 'rgba(100,116,139,0.3)'}`,
                borderRadius: 12, cursor: 'pointer',
                transition: 'all 0.3s',
                transform: selectedHero === i ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 80, height: 80, margin: '0 auto 16px',
                background: `radial-gradient(circle, ${hero.color}22, transparent)`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={`/platformer/avatars/avatar${i + 1}.png`}
                  alt={hero.name}
                  style={{ width: 64, height: 64, imageRendering: 'pixelated' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <h3 style={{
                fontFamily: 'Cinzel, serif', fontSize: 18, color: hero.color,
                textAlign: 'center', marginBottom: 8,
              }}>{hero.name}</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>
                {hero.desc}
              </p>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>HP</span>
                  <span style={{ color: '#22c55e' }}>{hero.hp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>ATK</span>
                  <span style={{ color: '#ef4444' }}>{hero.atk}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SPD</span>
                  <span style={{ color: '#3b82f6' }}>×{hero.spd.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => startGame(selectedHero)}
          disabled={loading}
          style={{
            background: loading ? 'rgba(100,116,139,0.3)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
            border: 'none', color: '#fff', padding: '14px 48px',
            borderRadius: 8, fontSize: 18, fontFamily: 'Cinzel, serif',
            cursor: loading ? 'default' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 20px rgba(6,182,212,0.3)',
          }}
        >
          {loading ? 'Loading...' : 'Begin Quest'}
        </button>
      </div>
    );
  }

  if (phase === 'dead') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #1a0000 0%, #050a18 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Jost, sans-serif', color: '#e2e8f0',
      }}>
        <h1 style={{
          fontFamily: 'Cinzel, serif', fontSize: 52, color: '#ef4444',
          textShadow: '0 0 40px rgba(239,68,68,0.5)', marginBottom: 16,
        }}>
          FALLEN
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 8 }}>
          Your journey ends at Stage {stage}...
        </p>
        <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>
          Score: {score}
        </p>
        <button
          onClick={() => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            gameRef.current = null;
            setStage(1);
            setPhase('select');
          }}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', color: '#fff', padding: '14px 40px',
            borderRadius: 8, fontSize: 18, fontFamily: 'Cinzel, serif',
            cursor: 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.3)',
          }}
        >
          Rise Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050a18', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
