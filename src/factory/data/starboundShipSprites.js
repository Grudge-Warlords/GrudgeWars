const SB = '/sprites/starbound';

function makePlayerShip(shipNum, opts = {}) {
  return {
    type: 'player',
    shipNum,
    image: `${SB}/player/ship${shipNum}/ship_asset1.png`,
    levels: Array.from({ length: 7 }, (_, i) => `${SB}/player/ship${shipNum}/ship_asset${i + 1}.png`),
    damaged: Array.from({ length: 7 }, (_, i) => `${SB}/player/ship${shipNum}/ship_damaged${i + 1}.png`),
    width: 128,
    height: 128,
    missileOffset: { x: 50, y: 0 },
    exhaustOffset: { x: -40, y: 0 },
    ...opts,
  };
}

function makeEnemyShip(pack, shipNum, opts = {}) {
  const base = pack === 'aliens' ? 'aliens' : 'enemies';
  return {
    type: 'enemy',
    pack,
    shipNum,
    image: `${SB}/${base}/ship${shipNum}/ship.png`,
    parts: (opts.parts || []).map(p => `${SB}/${base}/ship${shipNum}/parts/${p}`),
    exhaust: Array.from({ length: 4 }, (_, i) => {
      const dir = pack === 'aliens' ? `alien${shipNum}` : `ship${shipNum}`;
      const flightType = pack === 'aliens' ? 'flight' : 'normal_flight';
      const pad = pack === 'aliens' ? String(i + 1).padStart(3, '0') : String(i * 2 + 1).padStart(3, '0');
      return `${SB}/exhaust/${dir}/Ship${shipNum}_${flightType}_${pad}.png`;
    }),
    explosion: Array.from({ length: 10 }, (_, i) => {
      const nums = ['001', '003', '008', '009', '012', '013', '014', '017', '019', '020'];
      return `${SB}/explosions/ship${shipNum}/Ship${shipNum}_Explosion_${nums[i] || '001'}.png`;
    }),
    width: opts.width || 128,
    height: opts.height || 128,
    missileOffset: { x: -50, y: 0 },
    exhaustOffset: { x: 40, y: 0 },
    ...opts,
  };
}

export const PLAYER_SHIPS = {
  gunslinger: makePlayerShip(1),
  vanguard: makePlayerShip(2),
  technomancer: makePlayerShip(3),
  riftwalker: makePlayerShip(1, { filter: 'hue-rotate(240deg) saturate(1.5) brightness(1.1)' }),
};

export const ENEMY_SHIPS = {
  'scrap-drone': makeEnemyShip('enemies', 1, { width: 64, height: 64 }),
  'void-rat': makeEnemyShip('enemies', 2, { width: 64, height: 64 }),
  'pirate-grunt': makeEnemyShip('enemies', 3),
  'rogue-ai': makeEnemyShip('enemies', 4),
  'rift-crawler': makeEnemyShip('enemies', 5),
  'bounty-hunter': makeEnemyShip('enemies', 6),
  'mech-sentry': makeEnemyShip('aliens', 1),
  'void-leech': makeEnemyShip('aliens', 2),
  'plasma-beast': makeEnemyShip('aliens', 3),
  'corsair-captain': makeEnemyShip('aliens', 4),
  'synth-assassin': makeEnemyShip('aliens', 5),
  'nebula-wraith': makeEnemyShip('aliens', 6),
  'warp-spider': makeEnemyShip('enemies', 1, { filter: 'hue-rotate(90deg) saturate(1.3)' }),
  'war-frigate': makeEnemyShip('enemies', 6, { width: 160, height: 160 }),
  'xeno-warrior': makeEnemyShip('aliens', 2, { filter: 'hue-rotate(120deg)' }),
  'gravity-titan': makeEnemyShip('aliens', 4, { width: 160, height: 160 }),
  'data-phantom': makeEnemyShip('enemies', 3, { filter: 'hue-rotate(200deg) brightness(1.3)' }),
  'star-wyrm': makeEnemyShip('aliens', 6, { width: 160, height: 160 }),
  'rift-guardian': makeEnemyShip('aliens', 5, { filter: 'hue-rotate(270deg) saturate(1.5)' }),
  'shadow-fleet': makeEnemyShip('enemies', 5, { filter: 'brightness(0.5) saturate(0.3)' }),
  'quantum-horror': makeEnemyShip('aliens', 3, { filter: 'hue-rotate(300deg) saturate(2)', width: 160, height: 160 }),
  'tech-priest': makeEnemyShip('enemies', 4, { filter: 'hue-rotate(180deg)' }),
  'solar-knight': makeEnemyShip('aliens', 1, { filter: 'hue-rotate(60deg) saturate(1.5) brightness(1.3)' }),
  'void-herald': makeEnemyShip('aliens', 6, { filter: 'hue-rotate(270deg) brightness(0.8)', width: 160, height: 160 }),

  'alien-fighter': makeEnemyShip('aliens', 1, { width: 96, height: 96 }),
  'alien-interceptor': makeEnemyShip('aliens', 2, { width: 96, height: 96 }),
  'alien-bomber': makeEnemyShip('aliens', 3, { width: 96, height: 96 }),
  'alien-cruiser': makeEnemyShip('aliens', 4, { width: 128, height: 128 }),
  'alien-destroyer': makeEnemyShip('aliens', 5, { width: 128, height: 128 }),
  'alien-dreadnought': makeEnemyShip('aliens', 6, { width: 160, height: 160 }),
  'pirate-skiff': makeEnemyShip('enemies', 1, { width: 64, height: 64 }),
  'pirate-raider': makeEnemyShip('enemies', 2, { width: 96, height: 96 }),
  'pirate-corsair-ship': makeEnemyShip('enemies', 3, { width: 96, height: 96 }),
  'pirate-gunship': makeEnemyShip('enemies', 4, { width: 128, height: 128 }),
  'pirate-frigate': makeEnemyShip('enemies', 5, { width: 128, height: 128 }),
  'pirate-galleon': makeEnemyShip('enemies', 6, { width: 160, height: 160 }),
};

export const BOSS_SHIPS = {
  'iron-admiral': makeEnemyShip('enemies', 6, { width: 192, height: 192, filter: 'saturate(0.3) brightness(1.2)' }),
  'queen-nexus': makeEnemyShip('aliens', 6, { width: 192, height: 192, filter: 'hue-rotate(180deg) saturate(2)' }),
  'dread-corsair': makeEnemyShip('enemies', 5, { width: 192, height: 192, filter: 'hue-rotate(30deg) saturate(1.5)' }),
  'blackstar': makeEnemyShip('enemies', 5, { width: 192, height: 192, filter: 'hue-rotate(30deg) saturate(1.5)' }),
  'the-rift': makeEnemyShip('aliens', 3, { width: 220, height: 220, filter: 'hue-rotate(270deg) saturate(2) brightness(1.2)' }),
  'rift-entity': makeEnemyShip('aliens', 3, { width: 220, height: 220, filter: 'hue-rotate(270deg) saturate(2) brightness(1.2)' }),
};

export const SHOT_SPRITES = {
  plasma: {
    frames: [
      `${SB}/shots/shot1/fire_01_shot1.png`,
      `${SB}/shots/shot1/fire_02_shot2.png`,
      `${SB}/shots/shot1/fire_03_shot3.png`,
      `${SB}/shots/shot1/fire_04_shot4.png`,
    ],
    impact: [
      `${SB}/shots/shot1/fire_exp1.png`,
      `${SB}/shots/shot1/fire_exp2.png`,
      `${SB}/shots/shot1/fire_exp3.png`,
      `${SB}/shots/shot1/fire_exp4.png`,
    ],
    width: 64, height: 64,
    color: '#22d3ee',
  },
  laser: {
    frames: [
      `${SB}/shots/shot2/fire_01_shot1.png`,
      `${SB}/shots/shot2/fire_02_shot2.png`,
      `${SB}/shots/shot2/fire_03_shot3.png`,
      `${SB}/shots/shot2/fire_04_shot4.png`,
    ],
    impact: [
      `${SB}/shots/shot2/fire_exp1.png`,
      `${SB}/shots/shot2/fire_exp2.png`,
      `${SB}/shots/shot2/fire_exp3.png`,
      `${SB}/shots/shot2/fire_exp4.png`,
    ],
    width: 64, height: 64,
    color: '#ef4444',
  },
  missile: {
    frames: [
      `${SB}/shots/shot1_e/shot1_1.png`,
      `${SB}/shots/shot1_e/shot1_2.png`,
      `${SB}/shots/shot1_e/shot1_3.png`,
      `${SB}/shots/shot1_e/shot1_4.png`,
    ],
    impact: [
      `${SB}/shots/shot1_e/shot1_exp0.png`,
      `${SB}/shots/shot1_e/shot1_exp1.png`,
      `${SB}/shots/shot1_e/shot1_exp2.png`,
      `${SB}/shots/shot1_e/shot1_exp3.png`,
      `${SB}/shots/shot1_e/shot1_exp4.png`,
    ],
    width: 64, height: 64,
    color: '#f97316',
  },
  torpedo: {
    frames: [
      `${SB}/shots/shot2_e/shot2_1.png`,
      `${SB}/shots/shot2_e/shot2_2.png`,
      `${SB}/shots/shot2_e/shot2_3.png`,
      `${SB}/shots/shot2_e/shot2_4.png`,
    ],
    impact: [
      `${SB}/shots/shot2_e/shot2_exp1.png`,
      `${SB}/shots/shot2_e/shot2_exp2.png`,
      `${SB}/shots/shot2_e/shot2_exp3.png`,
      `${SB}/shots/shot2_e/shot2_exp4.png`,
    ],
    width: 64, height: 64,
    color: '#a855f7',
  },
};

export const EXPLOSION_SPRITES = {
  big: Array.from({ length: 11 }, (_, i) => `${SB}/explosions/big/explotion_big_${i + 1}.png`),
  small: Array.from({ length: 11 }, (_, i) => `${SB}/explosions/small/explotion_small_${i + 1}.png`),
  medium: Array.from({ length: 11 }, (_, i) => `${SB}/explosions/medium/explotion_middle_${i + 1}.png`),
};

const SHIP_KEYWORDS = {
  drone: 'scrap-drone',
  rat: 'void-rat',
  grunt: 'pirate-grunt',
  pirate: 'pirate-grunt',
  rogue: 'rogue-ai',
  crawler: 'rift-crawler',
  hunter: 'bounty-hunter',
  sentry: 'mech-sentry',
  leech: 'void-leech',
  beast: 'plasma-beast',
  captain: 'corsair-captain',
  assassin: 'synth-assassin',
  wraith: 'nebula-wraith',
  spider: 'warp-spider',
  frigate: 'war-frigate',
  warrior: 'xeno-warrior',
  titan: 'gravity-titan',
  phantom: 'data-phantom',
  wyrm: 'star-wyrm',
  guardian: 'rift-guardian',
  fleet: 'shadow-fleet',
  horror: 'quantum-horror',
  priest: 'tech-priest',
  knight: 'solar-knight',
  herald: 'void-herald',
  fighter: 'alien-fighter',
  interceptor: 'alien-interceptor',
  bomber: 'alien-bomber',
  cruiser: 'alien-cruiser',
  destroyer: 'alien-destroyer',
  dreadnought: 'alien-dreadnought',
  skiff: 'pirate-skiff',
  raider: 'pirate-raider',
  corsair: 'pirate-corsair-ship',
  gunship: 'pirate-gunship',
  galleon: 'pirate-galleon',
};

export function resolveShipSprite(unit) {
  const classId = (unit.classId || '').toLowerCase();
  if (unit.team === 'player') {
    return PLAYER_SHIPS[classId] || PLAYER_SHIPS.gunslinger;
  }

  const id = (unit.id || unit.name || '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  const name = (unit.name || '').toLowerCase();

  if (unit.isBoss) {
    for (const [bossId, sprite] of Object.entries(BOSS_SHIPS)) {
      if (id.includes(bossId) || name.includes(bossId.replace(/-/g, ' '))) return sprite;
    }
    const bossArr = Object.values(BOSS_SHIPS);
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return bossArr[hash % bossArr.length];
  }

  for (const [enemyId, sprite] of Object.entries(ENEMY_SHIPS)) {
    if (id.includes(enemyId) || name.includes(enemyId.replace(/-/g, ' '))) return sprite;
  }

  for (const [keyword, enemyId] of Object.entries(SHIP_KEYWORDS)) {
    if (name.includes(keyword)) return ENEMY_SHIPS[enemyId];
  }

  const enemyArr = Object.values(ENEMY_SHIPS);
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return enemyArr[hash % enemyArr.length];
}

const imageCache = new Map();
const preloadQueue = [];
let preloading = false;

function processPreloadQueue() {
  if (preloading || preloadQueue.length === 0) return;
  preloading = true;
  const batch = preloadQueue.splice(0, 6);
  let loaded = 0;
  batch.forEach(src => {
    if (imageCache.has(src)) { loaded++; if (loaded >= batch.length) { preloading = false; processPreloadQueue(); } return; }
    const img = new Image();
    img.onload = () => { imageCache.set(src, img); loaded++; if (loaded >= batch.length) { preloading = false; processPreloadQueue(); } };
    img.onerror = () => { loaded++; if (loaded >= batch.length) { preloading = false; processPreloadQueue(); } };
    img.src = src;
  });
}

export function preloadShipAssets() {
  const allSrcs = [];
  Object.values(PLAYER_SHIPS).forEach(s => { allSrcs.push(s.image); s.levels?.forEach(l => allSrcs.push(l)); });
  Object.values(ENEMY_SHIPS).forEach(s => { allSrcs.push(s.image); s.exhaust?.forEach(e => allSrcs.push(e)); });
  Object.values(BOSS_SHIPS).forEach(s => { allSrcs.push(s.image); });
  Object.values(SHOT_SPRITES).forEach(s => { s.frames.forEach(f => allSrcs.push(f)); s.impact.forEach(f => allSrcs.push(f)); });
  Object.values(EXPLOSION_SPRITES).forEach(arr => arr.forEach(f => allSrcs.push(f)));

  const unique = [...new Set(allSrcs)];
  preloadQueue.push(...unique);
  processPreloadQueue();
}

export function getAutoMissileType(unit) {
  const classId = (unit.classId || '').toLowerCase();
  if (classId === 'gunslinger') return 'plasma';
  if (classId === 'vanguard') return 'missile';
  if (classId === 'technomancer') return 'torpedo';
  if (classId === 'riftwalker') return 'laser';
  const name = (unit.name || '').toLowerCase();
  if (name.includes('plasma') || name.includes('tech')) return 'plasma';
  if (name.includes('missile') || name.includes('rocket') || name.includes('ordnance')) return 'missile';
  if (name.includes('torpedo') || name.includes('void')) return 'torpedo';
  return 'laser';
}

export function calcAutoMissileDamage(unit) {
  const targeting = unit.targeting || unit.critChance || 5;
  const systems = unit.systems || unit.magicDamage || unit.baseDamage * 0.5;
  return Math.floor(systems * 0.15 + targeting * 0.5 + 2);
}

export function calcAutoDefenseChance(unit) {
  const sensors = unit.sensors || unit.evasion || 3;
  const thrusters = unit.thrusters || unit.speed || 10;
  return Math.min(60, Math.floor(sensors * 1.5 + thrusters * 0.8));
}
