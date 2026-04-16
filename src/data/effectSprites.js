const EFFECT_REGISTRY = {
  explosion1: { path: '/sprites/effects/explosions/type1', frames: 9, size: 96, speed: 3 },
  explosion2: { path: '/sprites/effects/explosions/type2', frames: 12, size: 96, speed: 3 },
  explosion3: { path: '/sprites/effects/explosions/type3', frames: 8, size: 80, speed: 3 },
  explosion4: { path: '/sprites/effects/explosions/type4', frames: 9, size: 96, speed: 3 },
  explosion5: { path: '/sprites/effects/explosions/type5', frames: 9, size: 96, speed: 3 },
  explosion6: { path: '/sprites/effects/explosions/type6', frames: 10, size: 96, speed: 3 },
  explosion7: { path: '/sprites/effects/explosions/type7', frames: 9, size: 96, speed: 3 },
  explosion8: { path: '/sprites/effects/explosions/type8', frames: 11, size: 96, speed: 3 },
  explosion9: { path: '/sprites/effects/explosions/type9', frames: 9, size: 80, speed: 3 },
  explosion10: { path: '/sprites/effects/explosions/type10', frames: 7, size: 80, speed: 3 },

  slash1: { path: '/sprites/effects/slashes/type1', frames: 10, size: 64, speed: 2 },
  slash2: { path: '/sprites/effects/slashes/type2', frames: 5, size: 64, speed: 2 },
  slash3: { path: '/sprites/effects/slashes/type3', frames: 10, size: 64, speed: 2 },
  slash4: { path: '/sprites/effects/slashes/type4', frames: 8, size: 64, speed: 2 },
  slash5: { path: '/sprites/effects/slashes/type5', frames: 8, size: 64, speed: 2 },
  slash6: { path: '/sprites/effects/slashes/type6', frames: 10, size: 64, speed: 2 },
  slash7: { path: '/sprites/effects/slashes/type7', frames: 10, size: 64, speed: 2 },
  slash8: { path: '/sprites/effects/slashes/type8', frames: 10, size: 64, speed: 2 },
  slash9: { path: '/sprites/effects/slashes/type9', frames: 8, size: 64, speed: 2 },
  slash10: { path: '/sprites/effects/slashes/type10', frames: 8, size: 64, speed: 2 },

  fire1: { path: '/sprites/effects/fire/type1', frames: 7, size: 64, speed: 3 },
  fire2: { path: '/sprites/effects/fire/type2', frames: 8, size: 64, speed: 3 },
  fire3: { path: '/sprites/effects/fire/type3', frames: 7, size: 64, speed: 3 },
  fire4: { path: '/sprites/effects/fire/type4', frames: 8, size: 64, speed: 3 },
  fire5: { path: '/sprites/effects/fire/type5', frames: 7, size: 64, speed: 3 },
  fire6: { path: '/sprites/effects/fire/type6', frames: 8, size: 64, speed: 3 },
  fire7: { path: '/sprites/effects/fire/type7', frames: 6, size: 64, speed: 3 },
  fire8: { path: '/sprites/effects/fire/type8', frames: 6, size: 64, speed: 3 },
  fire9: { path: '/sprites/effects/fire/type9', frames: 7, size: 64, speed: 3 },
  fire10: { path: '/sprites/effects/fire/type10', frames: 7, size: 64, speed: 3 },

  magic1: { path: '/sprites/effects/magic/type1', frames: 8, size: 80, speed: 3 },
  magic2: { path: '/sprites/effects/magic/type2', frames: 6, size: 80, speed: 3 },
  magic3: { path: '/sprites/effects/magic/type3', frames: 10, size: 80, speed: 3 },
  magic4: { path: '/sprites/effects/magic/type4', frames: 12, size: 96, speed: 3 },
  magic5: { path: '/sprites/effects/magic/type5', frames: 8, size: 80, speed: 3 },
  magic6: { path: '/sprites/effects/magic/type6', frames: 10, size: 96, speed: 3 },
  magic7: { path: '/sprites/effects/magic/type7', frames: 12, size: 96, speed: 3 },
  magic8: { path: '/sprites/effects/magic/type8', frames: 7, size: 80, speed: 3 },
  magic9: { path: '/sprites/effects/magic/type9', frames: 11, size: 96, speed: 3 },
  magic10: { path: '/sprites/effects/magic/type10', frames: 16, size: 96, speed: 2 },
};

const PROJECTILE_SPRITES = {
  heavyShell: '/sprites/effects/tank-projectiles/Heavy_Shell.png',
  lightShell: '/sprites/effects/tank-projectiles/Light_Shell.png',
  mediumShell: '/sprites/effects/tank-projectiles/Medium_Shell.png',
  sniperShell: '/sprites/effects/tank-projectiles/Sniper_Shell.png',
  plasma: '/sprites/effects/tank-projectiles/Plasma.png',
  laser: '/sprites/effects/tank-projectiles/Laser.png',
  shotgunShells: '/sprites/effects/tank-projectiles/Shotgun_Shells.png',
  grenadeShell: '/sprites/effects/tank-projectiles/Granade_Shell.png',
};

const MUZZLE_SPRITES = {
  flashA: [1, 2, 3, 4, 5].map(i => `/sprites/effects/muzzle-flash/Flash_A_0${i}.png`),
  flashB: [1, 2, 3, 4, 5].map(i => `/sprites/effects/muzzle-flash/Flash_B_0${i}.png`),
  light: [1, 2, 3].map(i => `/sprites/effects/muzzle-flash/Light_0${i}.png`),
};

const SMOKE_SPRITES = {
  smokeA: '/sprites/effects/smoke/Smoke_A.png',
  smokeB: '/sprites/effects/smoke/Smoke_B.png',
  smokeC: '/sprites/effects/smoke/Smoke_C.png',
  exhaust: '/sprites/effects/smoke/Exhaust_Fire.png',
};

const TANK_EXPLOSION_SPRITES = {
  A: '/sprites/effects/tank-explosions/Explosion_A.png',
  B: '/sprites/effects/tank-explosions/Explosion_B.png',
  C: '/sprites/effects/tank-explosions/Explosion_C.png',
  D: '/sprites/effects/tank-explosions/Explosion_D.png',
  E: '/sprites/effects/tank-explosions/Explosion_E.png',
  F: '/sprites/effects/tank-explosions/Explosion_F.png',
  G: '/sprites/effects/tank-explosions/Explosion_G.png',
  H: '/sprites/effects/tank-explosions/Explosion_H.png',
};

const BLAST_TRAIL_SPRITES = [1, 2, 3, 4, 5, 6].map(i => `/sprites/effects/blast-trails/Blast_Trail_0${i}.png`);

const SHEET_EFFECT_REGISTRY = {
  shootBolt:    { sheet: '/sprites/shadow-ops/fx/bolt.png',     frames: 4, frameW: 48,  frameH: 32, speed: 2, size: 48 },
  shootPulse:   { sheet: '/sprites/shadow-ops/fx/pulse.png',    frames: 4, frameW: 63,  frameH: 32, speed: 2, size: 48 },
  shootCharged: { sheet: '/sprites/shadow-ops/fx/charged.png',  frames: 6, frameW: 63,  frameH: 48, speed: 2, size: 56 },
  shootCrossed: { sheet: '/sprites/shadow-ops/fx/crossed.png',  frames: 6, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  shootSpark:   { sheet: '/sprites/shadow-ops/fx/spark.png',    frames: 5, frameW: 63,  frameH: 32, speed: 2, size: 48 },
  shootWave:    { sheet: '/sprites/shadow-ops/fx/waveform.png', frames: 4, frameW: 95,  frameH: 32, speed: 2, size: 56 },
  hit1:         { sheet: '/sprites/shadow-ops/fx/hits_1.png',   frames: 5, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  hit2:         { sheet: '/sprites/shadow-ops/fx/hits_2.png',   frames: 7, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  hit3:         { sheet: '/sprites/shadow-ops/fx/hits_3.png',   frames: 5, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  hit4:         { sheet: '/sprites/shadow-ops/fx/hits_4.png',   frames: 7, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  hit5:         { sheet: '/sprites/shadow-ops/fx/hits_5.png',   frames: 7, frameW: 32,  frameH: 32, speed: 2, size: 40 },
  hit6:         { sheet: '/sprites/shadow-ops/fx/hits_6.png',   frames: 7, frameW: 32,  frameH: 32, speed: 2, size: 40 },
};

const SHOOT_FX_NAMES = ['shootBolt', 'shootPulse', 'shootCharged', 'shootCrossed', 'shootSpark', 'shootWave'];
const HIT_FX_NAMES = ['hit1', 'hit2', 'hit3', 'hit4', 'hit5', 'hit6'];

const sheetImgCache = {};

const imgCache = {};
function loadImg(src) {
  if (imgCache[src]) return imgCache[src];
  const p = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgCache[src] = Promise.resolve(img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imgCache[src] = p;
  return p;
}

function getImg(src) {
  const cached = imgCache[src];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

const frameCache = {};

export async function preloadEffects(effectNames) {
  const promises = [];
  for (const name of effectNames) {
    const reg = EFFECT_REGISTRY[name];
    if (!reg) continue;
    frameCache[name] = [];
    for (let i = 1; i <= reg.frames; i++) {
      const src = `${reg.path}/${i}.png`;
      const p = loadImg(src).then(img => {
        if (img) frameCache[name][i - 1] = img;
      });
      promises.push(p);
    }
  }

  for (const key of Object.keys(PROJECTILE_SPRITES)) {
    promises.push(loadImg(PROJECTILE_SPRITES[key]));
  }
  for (const key of Object.keys(MUZZLE_SPRITES)) {
    for (const src of MUZZLE_SPRITES[key]) {
      promises.push(loadImg(src));
    }
  }
  for (const key of Object.keys(SMOKE_SPRITES)) {
    promises.push(loadImg(SMOKE_SPRITES[key]));
  }
  for (const key of Object.keys(TANK_EXPLOSION_SPRITES)) {
    promises.push(loadImg(TANK_EXPLOSION_SPRITES[key]));
  }
  for (const src of BLAST_TRAIL_SPRITES) {
    promises.push(loadImg(src));
  }

  for (const key of Object.keys(SHEET_EFFECT_REGISTRY)) {
    const reg = SHEET_EFFECT_REGISTRY[key];
    if (!sheetImgCache[reg.sheet]) {
      const p = loadImg(reg.sheet).then(img => {
        if (img) sheetImgCache[reg.sheet] = img;
      });
      promises.push(p);
    }
  }

  await Promise.all(promises);

  for (const src in imgCache) {
    const img = await imgCache[src];
    if (img) imgCache[src]._resolved = img;
  }
}

export function preloadAllEffects() {
  return preloadEffects(Object.keys(EFFECT_REGISTRY));
}

export function spawnEffect(effectsArray, name, x, y, opts = {}) {
  const reg = EFFECT_REGISTRY[name];
  if (!reg) return;
  effectsArray.push({
    type: name,
    x,
    y,
    frame: 0,
    frameTimer: 0,
    speed: opts.speed || reg.speed,
    size: opts.size || reg.size,
    angle: opts.angle || 0,
    alpha: opts.alpha != null ? opts.alpha : 1,
    scale: opts.scale || 1,
    done: false,
  });
}

export function spawnSheetEffect(effectsArray, name, x, y, opts = {}) {
  const reg = SHEET_EFFECT_REGISTRY[name];
  if (!reg) return;
  effectsArray.push({
    type: name,
    isSheet: true,
    x,
    y,
    frame: 0,
    frameTimer: 0,
    speed: opts.speed || reg.speed,
    size: opts.size || reg.size,
    angle: opts.angle || 0,
    alpha: opts.alpha != null ? opts.alpha : 1,
    scale: opts.scale || 1,
    done: false,
  });
}

export function spawnRandomShootFx(effectsArray, x, y, opts = {}) {
  const name = SHOOT_FX_NAMES[Math.floor(Math.random() * SHOOT_FX_NAMES.length)];
  spawnSheetEffect(effectsArray, name, x, y, opts);
}

export function spawnRandomHitFx(effectsArray, x, y, opts = {}) {
  const name = HIT_FX_NAMES[Math.floor(Math.random() * HIT_FX_NAMES.length)];
  spawnSheetEffect(effectsArray, name, x, y, opts);
}

export function spawnRandomEffect(effectsArray, category, x, y, opts = {}) {
  const count = category === 'magic' ? 10 : 10;
  const idx = 1 + Math.floor(Math.random() * count);
  spawnEffect(effectsArray, `${category}${idx}`, x, y, opts);
}

export function updateSpriteEffects(effectsArray) {
  for (let i = effectsArray.length - 1; i >= 0; i--) {
    const e = effectsArray[i];
    e.frameTimer++;
    if (e.frameTimer >= e.speed) {
      e.frameTimer = 0;
      e.frame++;
      if (e.isSheet) {
        const reg = SHEET_EFFECT_REGISTRY[e.type];
        if (!reg || e.frame >= reg.frames) {
          e.done = true;
          effectsArray.splice(i, 1);
        }
      } else {
        const reg = EFFECT_REGISTRY[e.type];
        if (!reg || e.frame >= reg.frames) {
          e.done = true;
          effectsArray.splice(i, 1);
        }
      }
    }
  }
}

export function renderSpriteEffects(ctx, effectsArray, cameraX, cameraY) {
  for (const e of effectsArray) {
    if (e.isSheet) {
      const reg = SHEET_EFFECT_REGISTRY[e.type];
      if (!reg) continue;
      const img = sheetImgCache[reg.sheet];
      if (!img) continue;

      const sx = e.x - cameraX;
      const sy = e.y - cameraY;
      const halfSize = (e.size * e.scale) / 2;

      if (sx < -halfSize * 2 || sx > ctx.canvas.width + halfSize * 2 ||
          sy < -halfSize * 2 || sy > ctx.canvas.height + halfSize * 2) continue;

      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.translate(sx, sy);
      if (e.angle) ctx.rotate(e.angle);
      const srcX = e.frame * reg.frameW;
      ctx.drawImage(img, srcX, 0, reg.frameW, reg.frameH, -halfSize, -halfSize, halfSize * 2, halfSize * 2);
      ctx.restore();
    } else {
      const frames = frameCache[e.type];
      if (!frames) continue;
      const img = frames[e.frame];
      if (!img) continue;

      const sx = e.x - cameraX;
      const sy = e.y - cameraY;
      const halfSize = (e.size * e.scale) / 2;

      if (sx < -halfSize * 2 || sx > ctx.canvas.width + halfSize * 2 ||
          sy < -halfSize * 2 || sy > ctx.canvas.height + halfSize * 2) continue;

      ctx.save();
      ctx.globalAlpha = e.alpha;
      ctx.translate(sx, sy);
      if (e.angle) ctx.rotate(e.angle);
      ctx.drawImage(img, -halfSize, -halfSize, halfSize * 2, halfSize * 2);
      ctx.restore();
    }
  }
}

export function getProjectileImg(name) {
  const src = PROJECTILE_SPRITES[name];
  if (!src) return null;
  const cached = imgCache[src];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

export function getMuzzleFrame(type, frameIdx) {
  const arr = MUZZLE_SPRITES[type];
  if (!arr || !arr[frameIdx]) return null;
  const cached = imgCache[arr[frameIdx]];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

export function getSmokeImg(name) {
  const src = SMOKE_SPRITES[name];
  if (!src) return null;
  const cached = imgCache[src];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

export function getTankExplosionImg(letter) {
  const src = TANK_EXPLOSION_SPRITES[letter];
  if (!src) return null;
  const cached = imgCache[src];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

export function getBlastTrailImg(idx) {
  const src = BLAST_TRAIL_SPRITES[idx];
  if (!src) return null;
  const cached = imgCache[src];
  if (cached && cached._resolved) return cached._resolved;
  return null;
}

export { EFFECT_REGISTRY, SHEET_EFFECT_REGISTRY, SHOOT_FX_NAMES, HIT_FX_NAMES, PROJECTILE_SPRITES, MUZZLE_SPRITES, SMOKE_SPRITES, TANK_EXPLOSION_SPRITES, BLAST_TRAIL_SPRITES };
