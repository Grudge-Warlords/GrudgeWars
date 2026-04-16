import React, { useRef, useEffect, useState, useCallback } from 'react';
import { preloadAllEffects, spawnEffect, spawnRandomEffect, spawnRandomShootFx, spawnRandomHitFx, updateSpriteEffects, renderSpriteEffects, getMuzzleFrame } from '../../data/effectSprites.js';

const CANVAS_W = 960;
const CANVAS_H = 640;
const TILE = 64;
const PLAYER_SPEED = 3.2;
const PLAYER_MAX_HP = 100;
const PLAYER_MAX_SHIELD = 50;
const SHIELD_REGEN_RATE = 0.02;
const SHIELD_REGEN_DELAY = 180;
const DASH_SPEED = 8;
const DASH_DURATION = 10;
const DASH_COOLDOWN = 60;
const XP_PER_LEVEL = 100;
const GRENADE_COOLDOWN = 180;
const GRENADE_RADIUS = 100;
const GRENADE_DAMAGE = 60;
const GRENADE_SPEED = 5;
const COMBO_WINDOW = 90;

const ALLY_TYPES = {
  drone: {
    name: 'Combat Drone', hp: 60, damage: 8, fireRate: 20, range: 200, speed: 3,
    color: '#22d3ee', size: 14, behavior: 'orbit',
    desc: 'Orbits you and fires at nearby enemies',
  },
  turret: {
    name: 'Auto-Turret', hp: 120, damage: 15, fireRate: 35, range: 280, speed: 0,
    color: '#f59e0b', size: 18, behavior: 'stationary',
    desc: 'Deploys at your position and fires at enemies',
  },
  healBot: {
    name: 'Heal Bot', hp: 80, damage: 0, fireRate: 60, range: 150, speed: 2.5,
    color: '#22c55e', size: 12, behavior: 'follow',
    healAmount: 5, desc: 'Follows you and heals periodically',
  },
};

function spawnAlly(game, typeKey) {
  const at = ALLY_TYPES[typeKey];
  if (!at) return;
  const p = game.player;
  const ally = {
    type: typeKey,
    x: p.x + (Math.random() - 0.5) * 40,
    y: p.y + (Math.random() - 0.5) * 40,
    hp: at.hp,
    maxHp: at.hp,
    fireCd: 0,
    angle: Math.random() * Math.PI * 2,
    orbitAngle: Math.random() * Math.PI * 2,
    alive: true,
    spawnTime: game.time,
  };
  game.allies.push(ally);
  addAnnouncement(game, `${at.name} deployed!`, at.color, 60);
}

function updateAllies(game) {
  const p = game.player;
  if (p.dead) return;

  for (let i = game.allies.length - 1; i >= 0; i--) {
    const ally = game.allies[i];
    if (!ally.alive) { game.allies.splice(i, 1); continue; }
    const at = ALLY_TYPES[ally.type];
    if (!at) continue;

    if (ally.fireCd > 0) ally.fireCd--;

    if (at.behavior === 'orbit') {
      ally.orbitAngle += 0.03;
      const orbitR = 50;
      ally.x = p.x + Math.cos(ally.orbitAngle) * orbitR;
      ally.y = p.y + Math.sin(ally.orbitAngle) * orbitR;
    } else if (at.behavior === 'follow') {
      const dx = p.x - ally.x, dy = p.y - ally.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 40) {
        ally.x += (dx / d) * at.speed;
        ally.y += (dy / d) * at.speed;
      }
    }

    if (at.healAmount && ally.fireCd <= 0) {
      if (p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + at.healAmount);
        ally.fireCd = at.fireRate;
        addDamageNumber(game, p.x, p.y - 15, `+${at.healAmount}`, '#22c55e', false);
        for (let k = 0; k < 3; k++) {
          game.particles.push({
            x: ally.x, y: ally.y,
            vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random(),
            life: 20, maxLife: 20, color: '#22c55e', size: 2,
          });
        }
      }
      continue;
    }

    if (at.damage > 0 && ally.fireCd <= 0) {
      let closest = null, closestDist = at.range;
      for (const e of game.enemies) {
        if (e.dead) continue;
        const dx = e.x - ally.x, dy = e.y - ally.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) { closest = e; closestDist = d; }
      }
      if (closest) {
        ally.fireCd = at.fireRate;
        const angle = Math.atan2(closest.y - ally.y, closest.x - ally.x);
        ally.angle = angle;
        game.bullets.push({
          x: ally.x, y: ally.y,
          vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7,
          damage: at.damage, life: 60, pierce: false,
          color: at.color, size: 3, fromAlly: true, hitTargets: [],
        });
        game.muzzleFlashes.push({ x: ally.x, y: ally.y, life: 4, maxLife: 4 });
      }
    }
  }
}

const AOE_ABILITIES = {
  shockwave: {
    name: 'Shockwave', key: 'E', cooldown: 300, radius: 140, damage: 40,
    color: '#22d3ee', desc: 'Blast nearby enemies away',
    knockback: 12, stunDuration: 30,
  },
  poisonCloud: {
    name: 'Poison Cloud', key: 'F', cooldown: 420, radius: 120, damage: 8,
    color: '#22c55e', desc: 'Lingering toxic zone',
    duration: 180, tickRate: 20,
  },
  fireRing: {
    name: 'Fire Ring', key: 'R', cooldown: 360, radius: 100, damage: 30,
    color: '#f97316', desc: 'Ring of fire around you',
    duration: 120, expandSpeed: 2,
  },
  teleport: {
    name: 'Teleport', key: 'X', cooldown: 240, range: 300,
    color: '#c084fc', desc: 'Blink to cursor position',
  },
  swordMode: {
    name: 'Blade Storm', key: 'C', cooldown: 180, radius: 90, damage: 55,
    color: '#ec4899', desc: 'Melee AoE slash around you',
  },
  armorMode: {
    name: 'Armor Mode', key: 'V', cooldown: 600, duration: 300,
    damageReduction: 0.6, color: '#f59e0b', desc: 'Temporary heavy damage reduction',
  },
  superFlash: {
    name: 'Super Flash', key: 'Z', cooldown: 480, damage: 35,
    stunDuration: 60, color: '#fef08a', desc: 'Flash stun + damage all visible enemies',
  },
};

const WEAPONS = {
  pistol: { name: 'Pistol', damage: 25, cooldown: 12, speed: 8, lifetime: 80, spread: 0, count: 1, color: '#fbbf24', size: 4, piercing: false, desc: 'Balanced sidearm' },
  shotgun: { name: 'Shotgun', damage: 12, cooldown: 30, speed: 7, lifetime: 30, spread: 0.35, count: 5, color: '#f97316', size: 3, piercing: false, desc: '5 pellets, close range' },
  rifle: { name: 'Rifle', damage: 45, cooldown: 25, speed: 12, lifetime: 120, spread: 0, count: 1, color: '#22d3ee', size: 5, piercing: true, desc: 'High damage, piercing' },
  smg: { name: 'SMG', damage: 10, cooldown: 5, speed: 9, lifetime: 50, spread: 0.12, count: 1, color: '#a855f7', size: 3, piercing: false, desc: 'Rapid fire, low accuracy' },
  plasma: { name: 'Plasma', damage: 35, cooldown: 18, speed: 6, lifetime: 60, spread: 0.05, count: 1, color: '#22c55e', size: 6, piercing: false, desc: 'Explosive rounds', explosive: true, blastRadius: 50 },
};

const WEAPON_ORDER = ['pistol', 'shotgun', 'rifle', 'smg', 'plasma'];

const ENEMY_TYPES = {
  skeleton: {
    name: 'Skeleton', hp: 40, speed: 1.5, damage: 8, attackRange: 50, attackCd: 40,
    xp: 10, color: '#d4d4d8', accentColor: '#a1a1aa', size: 28,
    bodyShape: 'humanoid', headShape: 'skull',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Attack_without_shadow.png', frames: 9 },
      death: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Death_without_shadow.png', frames: 6 },
    },
    frameSize: 64, dirRows: 4,
  },
  slime: {
    name: 'Slime', hp: 30, speed: 1.0, damage: 5, attackRange: 40, attackCd: 50,
    xp: 8, color: '#4ade80', accentColor: '#22c55e', size: 24,
    bodyShape: 'blob', headShape: 'none',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/slime/Slime1_Idle_without_shadow.png', frames: 6 },
      run: { path: '/sprites/shadow-ops/enemies/slime/Slime1_Run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/slime/Slime1_Attack_without_shadow.png', frames: 10 },
      death: { path: '/sprites/shadow-ops/enemies/slime/Slime1_Death_without_shadow.png', frames: 10 },
    },
    frameSize: 64, dirRows: 4,
  },
  orc: {
    name: 'Orc', hp: 70, speed: 1.2, damage: 15, attackRange: 55, attackCd: 45,
    xp: 15, color: '#84cc16', accentColor: '#65a30d', size: 30,
    bodyShape: 'humanoid', headShape: 'round',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/orc/orc1_idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/orc/orc1_run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/orc/orc1_attack_without_shadow.png', frames: 8 },
      death: { path: '/sprites/shadow-ops/enemies/orc/orc1_death_without_shadow.png', frames: 8 },
    },
    frameSize: 64, dirRows: 4,
  },
  goblin: {
    name: 'Goblin', hp: 25, speed: 2.0, damage: 6, attackRange: 45, attackCd: 35,
    xp: 7, color: '#86efac', accentColor: '#4ade80', size: 22,
    bodyShape: 'small', headShape: 'pointy',
    directionalSprites: true,
    sprites: {
      idle: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Idle.png',
        ],
        frames: 4,
      },
      run: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Running.png',
        ],
        frames: 8,
      },
      attack: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Attacking.png',
        ],
        frames: 5,
      },
      death: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
        ],
        frames: 6,
      },
    },
    frameSize: 64, dirRows: 1,
  },
  gnoll: {
    name: 'Gnoll', hp: 55, speed: 1.6, damage: 12, attackRange: 50, attackCd: 40,
    xp: 12, color: '#d97706', accentColor: '#b45309', size: 28,
    bodyShape: 'humanoid', headShape: 'snout',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/gnoll/Gnoll1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/gnoll/Gnoll1_Run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/gnoll/Gnoll1_Attack_without_shadow.png', frames: 10 },
      death: { path: '/sprites/shadow-ops/enemies/gnoll/Gnoll_Death_without_shadow.png', frames: 6 },
    },
    frameSize: 64, dirRows: 4,
  },
  beholder: {
    name: 'Beholder', hp: 90, speed: 0.8, damage: 20, attackRange: 120, attackCd: 60,
    xp: 25, color: '#c084fc', accentColor: '#a855f7', size: 32,
    bodyShape: 'floating', headShape: 'eye',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/beholder/Beholder1_Idle_without_shadow.png', frames: 12 },
      run: { path: '/sprites/shadow-ops/enemies/beholder/Beholder1_Idle_without_shadow.png', frames: 12 },
      attack: { path: '/sprites/shadow-ops/enemies/beholder/Beholder1_Attack_without_shadow.png', frames: 12 },
      death: { path: '/sprites/shadow-ops/enemies/beholder/Beholder1_Death_without_shadow.png', frames: 9 },
    },
    frameSize: 64, dirRows: 4,
  },
  golem: {
    name: 'Golem', hp: 150, speed: 0.6, damage: 25, attackRange: 60, attackCd: 55,
    xp: 30, color: '#a8a29e', accentColor: '#78716c', size: 40,
    bodyShape: 'hulk', headShape: 'block',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/golem/Golem1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/golem/Golem1_Idle_without_shadow.png', frames: 4 },
      attack: { path: '/sprites/shadow-ops/enemies/golem/Golem1_Attack_without_shadow.png', frames: 9 },
      death: { path: '/sprites/shadow-ops/enemies/golem/Golem1_Death_without_shadow.png', frames: 8 },
    },
    frameSize: 128, dirRows: 4,
  },
  predatorPlant: {
    name: 'Predator Plant', hp: 45, speed: 0, damage: 18, attackRange: 80, attackCd: 50,
    xp: 15, color: '#22c55e', accentColor: '#15803d', size: 28, stationary: true,
    bodyShape: 'plant', headShape: 'maw',
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/predator-plant/Plant1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/predator-plant/Plant1_Idle_without_shadow.png', frames: 4 },
      attack: { path: '/sprites/shadow-ops/enemies/predator-plant/Plant1_Attack_without_shadow.png', frames: 7 },
      death: { path: '/sprites/shadow-ops/enemies/predator-plant/Plant1_Death_without_shadow.png', frames: 10 },
    },
    frameSize: 64, dirRows: 4,
  },
  skeletonArcher: {
    name: 'Skeleton Archer', hp: 35, speed: 1.3, damage: 12, attackRange: 220, attackCd: 70,
    xp: 14, color: '#e2e8f0', accentColor: '#94a3b8', size: 28,
    bodyShape: 'humanoid', headShape: 'skull',
    ranged: true, projectileSpeed: 5, projectileColor: '#fbbf24', projectileSize: 3,
    preferredRange: 160, fleeRange: 80,
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Attack_without_shadow.png', frames: 9 },
      death: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Death_without_shadow.png', frames: 6 },
    },
    frameSize: 64, dirRows: 4,
  },
  darkMage: {
    name: 'Dark Mage', hp: 50, speed: 1.0, damage: 18, attackRange: 250, attackCd: 120,
    xp: 20, color: '#7c3aed', accentColor: '#6d28d9', size: 30,
    bodyShape: 'humanoid', headShape: 'hood',
    ranged: true, projectileSpeed: 4, projectileColor: '#a855f7', projectileSize: 5,
    preferredRange: 200, fleeRange: 100,
    aoeAttack: true, aoeRadius: 70, aoeDelay: 60, aoeDamage: 22,
    sprites: {
      idle: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Idle_without_shadow.png', frames: 4 },
      run: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Run_without_shadow.png', frames: 8 },
      attack: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Attack_without_shadow.png', frames: 9 },
      death: { path: '/sprites/shadow-ops/enemies/skeleton/Skeleton1_Death_without_shadow.png', frames: 6 },
    },
    frameSize: 64, dirRows: 4,
  },
  fireImp: {
    name: 'Fire Imp', hp: 30, speed: 1.8, damage: 10, attackRange: 180, attackCd: 55,
    xp: 12, color: '#f97316', accentColor: '#ea580c', size: 22,
    bodyShape: 'small', headShape: 'pointy',
    ranged: true, projectileSpeed: 6, projectileColor: '#ef4444', projectileSize: 4,
    preferredRange: 130, fleeRange: 60,
    directionalSprites: true,
    sprites: {
      idle: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Idle.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Idle.png',
        ],
        frames: 4,
      },
      run: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Running.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Running.png',
        ],
        frames: 8,
      },
      attack: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Front - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Back - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Right - Attacking.png',
          '/sprites/shadow-ops/enemies/goblin/Left - Attacking.png',
        ],
        frames: 5,
      },
      death: {
        dirs: [
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
          '/sprites/shadow-ops/enemies/goblin/Dying.png',
        ],
        frames: 6,
      },
    },
    frameSize: 64, dirRows: 1,
  },
};

function buildSpriteLevel(lvl, prefix, attackFrames) {
  return {
    idle: { path: `/sprites/shadow-ops/player/${prefix}_Idle_without_shadow.png`, frames: 12 },
    run: { path: `/sprites/shadow-ops/player/${prefix}_Run_without_shadow.png`, frames: 8 },
    attack: { path: `/sprites/shadow-ops/player/${prefix}_attack_without_shadow.png`, frames: attackFrames },
    death: { path: `/sprites/shadow-ops/player/${prefix}_Death_without_shadow.png`, frames: 7 },
    hurt: { path: `/sprites/shadow-ops/player/${prefix}_Hurt_without_shadow.png`, frames: 5 },
  };
}

const PLAYER_SPRITE_LEVELS = {
  1: buildSpriteLevel(1, 'Swordsman_lvl1', 8),
  2: buildSpriteLevel(2, 'Swordsman_lvl2', 8),
  3: buildSpriteLevel(3, 'Swordsman_lvl3', 8),
  4: buildSpriteLevel(4, 'lvl4', 7),
  5: buildSpriteLevel(5, 'lvl5', 7),
  6: buildSpriteLevel(6, 'lvl6', 7),
  7: buildSpriteLevel(7, 'lvl7', 7),
  8: buildSpriteLevel(8, 'lvl8', 7),
  9: buildSpriteLevel(9, 'lvl9', 7),
};

function getPlayerSprites(level) {
  const spriteLvl = Math.min(Math.max(level, 1), 9);
  return PLAYER_SPRITE_LEVELS[spriteLvl] || PLAYER_SPRITE_LEVELS[1];
}

const MAGIC_EFFECTS = [
  { name: 'Lightning', path: '/sprites/shadow-ops/magic/Lightning.png', frames: 10, frameSize: 72 },
  { name: 'LightningBolt', path: '/sprites/shadow-ops/magic/Lightning-bolt.png', frames: 10, frameSize: 72 },
  { name: 'MidasTouch', path: '/sprites/shadow-ops/magic/Midas-touch.png', frames: 7, frameSize: 72 },
  { name: 'SunStrike', path: '/sprites/shadow-ops/magic/Sun-strike.png', frames: 10, frameSize: 72 },
  { name: 'Explosion', path: '/sprites/shadow-ops/magic/Explosion.png', frames: 10, frameSize: 72 },
  { name: 'Spikes', path: '/sprites/shadow-ops/magic/Spikes.png', frames: 10, frameSize: 72 },
  { name: 'FireWall', path: '/sprites/shadow-ops/magic/Fire-wall.png', frames: 10, frameSize: 72 },
  { name: 'Shield', path: '/sprites/shadow-ops/magic/Shield.png', frames: 8, frameSize: 72 },
  { name: 'BlackHole', path: '/sprites/shadow-ops/magic/Black-hole.png', frames: 8, frameSize: 72 },
  { name: 'FireBall', path: '/sprites/shadow-ops/magic/Fire-ball.png', frames: 8, frameSize: 72 },
];

function spawnMagicEffect(game, x, y, effectIdx) {
  const eff = ALL_MAGIC_EFFECTS[effectIdx % ALL_MAGIC_EFFECTS.length];
  game.magicEffects = game.magicEffects || [];
  game.magicEffects.push({
    x, y, effect: eff, frame: 0, frameTimer: 0, life: eff.frames * 4,
    size: 96,
  });
}

function spawnShotEffect(game, x, y, weaponKey) {
  const se = SHOT_EFFECTS[weaponKey];
  if (!se) return;
  game.shotEffects = game.shotEffects || [];
  game.shotEffects.push({ x, y, frames: se.frames, frame: 0, timer: 0, size: se.size, path: se.path, life: se.frames * 3 });
}

function spawnExplodeEffect(game, x, y) {
  game.shotEffects = game.shotEffects || [];
  game.shotEffects.push({ x, y, frames: EXPLODE_EFFECT.frames, frame: 0, timer: 0, size: EXPLODE_EFFECT.size, path: EXPLODE_EFFECT.path, life: EXPLODE_EFFECT.frames * 4 });
}

const HERO_WEAPON_SPRITES = {
  pistol: { held: '/sprites/shadow-ops/hero/pistol/Hero_Pistol.png', empty: '/sprites/shadow-ops/hero/pistol/Hero_Pistol_Empty.png', icon: '/sprites/shadow-ops/gui/weapons/Pistol HUD.png' },
  rifle: { held: '/sprites/shadow-ops/hero/rifle/Hero_Rifle.png', empty: '/sprites/shadow-ops/hero/rifle/Hero_Rifle_Empty.png', icon: '/sprites/shadow-ops/gui/weapons/SMG HUD.png' },
  smg: { held: '/sprites/shadow-ops/hero/machinegun/Hero_MachineGun.png', empty: '/sprites/shadow-ops/hero/machinegun/Hero_MachineGun_Empty.png', icon: '/sprites/shadow-ops/gui/weapons/MG HUD.png' },
  plasma: { held: '/sprites/shadow-ops/hero/grenadelauncher/Hero_GrenadeLauncher.png', empty: '/sprites/shadow-ops/hero/grenadelauncher/Hero_GrenadeLauncher_Empty.png', icon: '/sprites/shadow-ops/gui/weapons/RPG HUD.png' },
  shotgun: { held: '/sprites/shadow-ops/hero/flamethrower/Hero_Flamethrower.png', empty: '/sprites/shadow-ops/hero/flamethrower/Hero_Flamethrower_Empty.png', icon: '/sprites/shadow-ops/gui/weapons/Flamethrower HUD.png' },
};

const SHOT_EFFECTS = {
  pistol: { path: '/sprites/shadow-ops/effects/pistol-shot/', frames: 3, size: 24 },
  rifle: { path: '/sprites/shadow-ops/effects/rifle-shot/', frames: 3, size: 24 },
  smg: { path: '/sprites/shadow-ops/effects/machinegun-shot/', frames: 3, size: 24 },
  plasma: { path: '/sprites/shadow-ops/effects/grenade-shot/', frames: 4, size: 24 },
  shotgun: { path: '/sprites/shadow-ops/effects/pistol-shot/', frames: 3, size: 24 },
};

const EXPLODE_EFFECT = { path: '/sprites/shadow-ops/effects/explode/', frames: 4, size: 64 };

const PICKUP_SPRITES = {
  health: '/sprites/shadow-ops/props/HP.png',
  shield: '/sprites/shadow-ops/props/Armor.png',
  weapon: '/sprites/shadow-ops/props/Ammo.png',
  grenade: '/sprites/shadow-ops/props/Army Box.png',
  power: '/sprites/shadow-ops/props/Speed.png',
  money: '/sprites/shadow-ops/props/Money Big.png',
};

const HERO_WALK_FRAMES = 7;
const HERO_DIE_FRAMES = 4;

const MAGIC_EFFECTS_2 = [
  { name: 'Lightning2', path: '/sprites/shadow-ops/magic/effects2/1-Lightning.png', frames: 10, frameSize: 72 },
  { name: 'LightningBolt2', path: '/sprites/shadow-ops/magic/effects2/2-Lightning-bolt.png', frames: 10, frameSize: 72 },
  { name: 'MidasTouch2', path: '/sprites/shadow-ops/magic/effects2/3-Midas-touch.png', frames: 10, frameSize: 72 },
  { name: 'SunStrike2', path: '/sprites/shadow-ops/magic/effects2/4-Sun-strike.png', frames: 10, frameSize: 72 },
  { name: 'Explosion2', path: '/sprites/shadow-ops/magic/effects2/5-Explosion.png', frames: 10, frameSize: 72 },
  { name: 'Spikes2', path: '/sprites/shadow-ops/magic/effects2/6-Spikes.png', frames: 10, frameSize: 72 },
  { name: 'FireWall2', path: '/sprites/shadow-ops/magic/effects2/7-Fire-wall.png', frames: 10, frameSize: 72 },
  { name: 'Shield2', path: '/sprites/shadow-ops/magic/effects2/8-Shield.png', frames: 8, frameSize: 72 },
  { name: 'BlackHole2', path: '/sprites/shadow-ops/magic/effects2/9-Black-hole.png', frames: 8, frameSize: 72 },
  { name: 'FireBall2', path: '/sprites/shadow-ops/magic/effects2/10-Fire-ball.png', frames: 8, frameSize: 72 },
];

const MAGIC_EFFECTS_3 = [
  { name: 'FreeM1', path: '/sprites/shadow-ops/magic/effects3/1.png', frames: 8, frameSize: 72 },
  { name: 'FreeM2', path: '/sprites/shadow-ops/magic/effects3/2.png', frames: 8, frameSize: 72 },
  { name: 'FreeM3', path: '/sprites/shadow-ops/magic/effects3/3.png', frames: 8, frameSize: 72 },
  { name: 'FreeM4', path: '/sprites/shadow-ops/magic/effects3/4.png', frames: 8, frameSize: 72 },
  { name: 'FreeM5', path: '/sprites/shadow-ops/magic/effects3/5.png', frames: 8, frameSize: 72 },
  { name: 'FreeM6', path: '/sprites/shadow-ops/magic/effects3/6.png', frames: 8, frameSize: 72 },
  { name: 'FreeM7', path: '/sprites/shadow-ops/magic/effects3/7.png', frames: 8, frameSize: 72 },
  { name: 'FreeM8', path: '/sprites/shadow-ops/magic/effects3/8.png', frames: 8, frameSize: 72 },
  { name: 'FreeM9', path: '/sprites/shadow-ops/magic/effects3/9.png', frames: 8, frameSize: 72 },
  { name: 'FreeM10', path: '/sprites/shadow-ops/magic/effects3/10.png', frames: 8, frameSize: 72 },
];

const ALL_MAGIC_EFFECTS = [...MAGIC_EFFECTS, ...MAGIC_EFFECTS_2, ...MAGIC_EFFECTS_3];

const COLOR_TIERS = [
  { name: 'Standard', hue: 0, sat: 0, bright: 0, suffix: '' },
  { name: 'Crimson', hue: -30, sat: 40, bright: 10, suffix: '_r' },
  { name: 'Cobalt', hue: 180, sat: 30, bright: 5, suffix: '_b' },
  { name: 'Gold', hue: 50, sat: 50, bright: 15, suffix: '_g' },
];

const SHOT_TYPES = {
  standard: { name: 'Standard', color: '#fbbf24', desc: 'Basic bullet' },
  rapid: { name: 'Rapid', color: '#a855f7', desc: 'Fast firing, low damage' },
  heavy: { name: 'Heavy', color: '#ef4444', desc: 'Slow, high damage' },
  piercing: { name: 'Piercing', color: '#22d3ee', desc: 'Passes through enemies' },
  explosive: { name: 'Explosive', color: '#f97316', desc: 'AOE blast on impact' },
  missile: { name: 'Missile', color: '#ec4899', desc: 'Homing projectile' },
  spread: { name: 'Spread', color: '#84cc16', desc: 'Multi-pellet shotgun' },
  beam: { name: 'Beam', color: '#06b6d4', desc: 'Continuous laser' },
  heal: { name: 'Heal Pulse', color: '#22c55e', desc: 'Heals player on hit' },
  poison: { name: 'Toxic', color: '#a3e635', desc: 'Poisons enemies over time' },
};

const BASE_BARREL_STATS = [
  { dmg: 1.0, rate: 1.0, range: 60, speed: 8, shot: 'standard', count: 1, spread: 0 },
  { dmg: 1.2, rate: 0.9, range: 80, speed: 9, shot: 'standard', count: 1, spread: 0 },
  { dmg: 0.6, rate: 1.5, range: 50, speed: 10, shot: 'rapid', count: 1, spread: 0.1 },
  { dmg: 1.8, rate: 0.5, range: 120, speed: 12, shot: 'heavy', count: 1, spread: 0 },
  { dmg: 1.0, rate: 0.8, range: 100, speed: 10, shot: 'piercing', count: 1, spread: 0 },
  { dmg: 1.5, rate: 0.6, range: 70, speed: 6, shot: 'explosive', count: 1, spread: 0.05 },
  { dmg: 0.8, rate: 0.7, range: 90, speed: 7, shot: 'missile', count: 1, spread: 0 },
  { dmg: 0.5, rate: 1.0, range: 40, speed: 7, shot: 'spread', count: 5, spread: 0.3 },
  { dmg: 0.7, rate: 1.2, range: 110, speed: 14, shot: 'beam', count: 1, spread: 0 },
  { dmg: 0.4, rate: 0.9, range: 60, speed: 8, shot: 'heal', count: 1, spread: 0 },
];

const BASE_SIGHT_STATS = [
  { rateBonus: 0, accuracy: 0, critBonus: 0 },
  { rateBonus: 0.05, accuracy: 0.1, critBonus: 0 },
  { rateBonus: 0.1, accuracy: 0.15, critBonus: 0.02 },
  { rateBonus: 0, accuracy: 0.3, critBonus: 0.05 },
  { rateBonus: 0.15, accuracy: 0, critBonus: 0 },
  { rateBonus: 0.08, accuracy: 0.2, critBonus: 0.03 },
  { rateBonus: 0.2, accuracy: 0.05, critBonus: 0 },
  { rateBonus: 0, accuracy: 0.25, critBonus: 0.08 },
  { rateBonus: 0.12, accuracy: 0.1, critBonus: 0.04 },
  { rateBonus: 0.25, accuracy: 0.2, critBonus: 0.06 },
];

const BASE_TRIGGER_STATS = [
  { rateBonus: 0, dmgBonus: 0 },
  { rateBonus: 0.05, dmgBonus: 0.05 },
  { rateBonus: 0.1, dmgBonus: 0 },
  { rateBonus: 0, dmgBonus: 0.15 },
  { rateBonus: 0.15, dmgBonus: 0.05 },
  { rateBonus: 0.08, dmgBonus: 0.1 },
  { rateBonus: 0.2, dmgBonus: 0 },
  { rateBonus: 0, dmgBonus: 0.2 },
  { rateBonus: 0.12, dmgBonus: 0.12 },
  { rateBonus: 0.18, dmgBonus: 0.15 },
];

const BASE_STOCK_STATS = [
  { rangeBonus: 0, recoilReduce: 0, moveSpeed: 0 },
  { rangeBonus: 0.1, recoilReduce: 0.05, moveSpeed: 0 },
  { rangeBonus: 0.2, recoilReduce: 0, moveSpeed: -0.05 },
  { rangeBonus: 0, recoilReduce: 0.15, moveSpeed: 0.05 },
  { rangeBonus: 0.15, recoilReduce: 0.1, moveSpeed: 0 },
  { rangeBonus: 0.25, recoilReduce: 0, moveSpeed: -0.1 },
  { rangeBonus: 0.1, recoilReduce: 0.2, moveSpeed: 0.05 },
  { rangeBonus: 0.3, recoilReduce: 0.05, moveSpeed: -0.05 },
  { rangeBonus: 0.15, recoilReduce: 0.15, moveSpeed: 0.1 },
  { rangeBonus: 0.35, recoilReduce: 0.2, moveSpeed: 0 },
];

const BASE_BAYONET_STATS = [
  { meleeDmg: 0, effect: 'none' },
  { meleeDmg: 5, effect: 'none' },
  { meleeDmg: 8, effect: 'bleed' },
  { meleeDmg: 3, effect: 'slow' },
  { meleeDmg: 12, effect: 'none' },
  { meleeDmg: 6, effect: 'poison' },
  { meleeDmg: 10, effect: 'bleed' },
  { meleeDmg: 15, effect: 'stun' },
  { meleeDmg: 8, effect: 'lifesteal' },
  { meleeDmg: 20, effect: 'none' },
];

const PART_COSTS = {
  barrel: [0, 50, 80, 120, 150, 200, 250, 300, 400, 500],
  sight: [0, 30, 50, 80, 100, 130, 160, 200, 250, 350],
  trigger: [0, 40, 60, 90, 120, 150, 180, 220, 280, 400],
  stock: [0, 30, 50, 70, 100, 130, 160, 200, 250, 350],
  bayonet: [0, 60, 90, 120, 160, 200, 250, 300, 380, 500],
};
const COLOR_TIER_COST_MULTI = [1, 1.5, 2, 3];

const GUN_PARTS = {
  barrel: { count: 10, prefix: '1', label: 'Barrel', colorTiers: 4 },
  sight: { count: 10, prefix: '2', label: 'Sight', colorTiers: 4 },
  trigger: { count: 10, prefix: '3', label: 'Trigger', colorTiers: 4 },
  stock: { count: 10, prefix: '4', label: 'Stock', colorTiers: 4 },
  bayonet: { count: 10, prefix: '5', label: 'Bayonet', colorTiers: 4 },
};

function getGunPartPath(category, variant) {
  const base = ((variant - 1) % 10) + 1;
  return `/sprites/shadow-ops/guns/parts/${GUN_PARTS[category].prefix}_${base}.png`;
}

function getPartColorTier(variant) {
  return Math.floor((variant - 1) / 10);
}

function getPartBase(variant) {
  return ((variant - 1) % 10) + 1;
}

function getPartCost(category, variant) {
  const base = getPartBase(variant);
  const tier = getPartColorTier(variant);
  return Math.floor((PART_COSTS[category]?.[base - 1] || 0) * (COLOR_TIER_COST_MULTI[tier] || 1));
}

function getBarrelStats(variant) {
  const base = getPartBase(variant) - 1;
  const tier = getPartColorTier(variant);
  const s = BASE_BARREL_STATS[base] || BASE_BARREL_STATS[0];
  const tierMult = 1 + tier * 0.15;
  return { ...s, dmg: s.dmg * tierMult, range: s.range * (1 + tier * 0.1), speed: s.speed + tier * 0.5 };
}

function getSightStats(variant) {
  const base = getPartBase(variant) - 1;
  const tier = getPartColorTier(variant);
  const s = BASE_SIGHT_STATS[base] || BASE_SIGHT_STATS[0];
  const tierMult = 1 + tier * 0.12;
  return { rateBonus: s.rateBonus * tierMult, accuracy: s.accuracy * tierMult, critBonus: s.critBonus * tierMult };
}

function getTriggerStats(variant) {
  const base = getPartBase(variant) - 1;
  const tier = getPartColorTier(variant);
  const s = BASE_TRIGGER_STATS[base] || BASE_TRIGGER_STATS[0];
  const tierMult = 1 + tier * 0.12;
  return { rateBonus: s.rateBonus * tierMult, dmgBonus: s.dmgBonus * tierMult };
}

function getStockStats(variant) {
  const base = getPartBase(variant) - 1;
  const tier = getPartColorTier(variant);
  const s = BASE_STOCK_STATS[base] || BASE_STOCK_STATS[0];
  const tierMult = 1 + tier * 0.1;
  return { rangeBonus: s.rangeBonus * tierMult, recoilReduce: s.recoilReduce * tierMult, moveSpeed: s.moveSpeed * tierMult };
}

function getBayonetStats(variant) {
  const base = getPartBase(variant) - 1;
  const tier = getPartColorTier(variant);
  const s = BASE_BAYONET_STATS[base] || BASE_BAYONET_STATS[0];
  return { meleeDmg: Math.floor(s.meleeDmg * (1 + tier * 0.2)), effect: s.effect };
}

function getColorFilter(variant) {
  const tier = getPartColorTier(variant);
  const ct = COLOR_TIERS[tier];
  if (tier === 0) return 'none';
  return `hue-rotate(${ct.hue}deg) saturate(${100 + ct.sat}%) brightness(${100 + ct.bright}%)`;
}

const DEFAULT_GUN_CONFIG = { barrel: 1, sight: 1, trigger: 1, stock: 1, bayonet: 0 };

function getGunStats(gunConfig) {
  if (!gunConfig) return null;
  const barrel = gunConfig.barrel ? getBarrelStats(gunConfig.barrel) : getBarrelStats(1);
  const sight = gunConfig.sight ? getSightStats(gunConfig.sight) : getSightStats(1);
  const trigger = gunConfig.trigger ? getTriggerStats(gunConfig.trigger) : getTriggerStats(1);
  const stock = gunConfig.stock ? getStockStats(gunConfig.stock) : getStockStats(1);

  const dmgBonus = barrel.dmg * (1 + trigger.dmgBonus);
  const rateBonus = Math.max(0.2, 1 - sight.rateBonus - trigger.rateBonus);
  const range = barrel.range * (1 + stock.rangeBonus);
  const speed = barrel.speed + stock.rangeBonus * 2;
  const spread = Math.max(0, barrel.spread * (1 - sight.accuracy - stock.recoilReduce));
  const critChance = sight.critBonus;
  const shotType = barrel.shot;
  const count = barrel.count;
  const lifetime = Math.floor(range / speed * 1.2);
  const cooldown = Math.max(3, Math.floor(15 * rateBonus));

  return {
    dmgBonus, rateBonus, range, speed, spread, critChance,
    shotType, count, lifetime, cooldown,
    rangeLabel: range > 100 ? 'Long' : range > 60 ? 'Medium' : 'Short',
    baseDamage: Math.floor(25 * dmgBonus),
    color: SHOT_TYPES[shotType]?.color || '#fbbf24',
  };
}

const PLAYER_FRAME_SIZE = 64;

const WAVE_CONFIG = [
  { enemies: ['slime', 'slime', 'slime', 'goblin', 'goblin'] },
  { enemies: ['skeleton', 'skeleton', 'slime', 'slime', 'goblin', 'goblin'] },
  { enemies: ['skeleton', 'skeleton', 'skeletonArcher', 'orc', 'goblin', 'goblin', 'slime'] },
  { enemies: ['orc', 'orc', 'gnoll', 'gnoll', 'skeletonArcher', 'skeletonArcher', 'goblin', 'goblin'] },
  { enemies: ['gnoll', 'gnoll', 'gnoll', 'orc', 'orc', 'skeletonArcher', 'fireImp', 'predatorPlant', 'skeleton', 'skeleton'], boss: true },
  { enemies: ['beholder', 'darkMage', 'orc', 'orc', 'gnoll', 'gnoll', 'skeletonArcher', 'skeletonArcher', 'fireImp', 'goblin'] },
  { enemies: ['golem', 'darkMage', 'beholder', 'gnoll', 'gnoll', 'skeletonArcher', 'fireImp', 'fireImp', 'orc', 'orc', 'predatorPlant'] },
  { enemies: ['golem', 'golem', 'darkMage', 'darkMage', 'beholder', 'gnoll', 'gnoll', 'skeletonArcher', 'skeletonArcher', 'fireImp', 'orc', 'orc'] },
  { enemies: ['golem', 'golem', 'darkMage', 'darkMage', 'beholder', 'beholder', 'skeletonArcher', 'skeletonArcher', 'fireImp', 'fireImp', 'gnoll', 'gnoll', 'orc', 'orc'], boss: true },
  { enemies: ['golem', 'golem', 'golem', 'darkMage', 'darkMage', 'darkMage', 'beholder', 'beholder', 'skeletonArcher', 'skeletonArcher', 'fireImp', 'fireImp', 'gnoll', 'gnoll', 'predatorPlant', 'predatorPlant'], boss: true },
];

const ARENA_W = 2400;
const ARENA_H = 1600;

const UPGRADE_CARDS = [
  { id: 'dmg_up', name: 'Power Surge', desc: '+20% weapon damage', category: 'offense', color: '#ef4444', icon: '⚔', apply: (p) => { p.damageMulti += 0.2; } },
  { id: 'fire_rate', name: 'Trigger Finger', desc: '+15% fire rate', category: 'offense', color: '#f97316', icon: '🔥', apply: (p) => { p.fireRateMulti = (p.fireRateMulti || 1) * 0.85; } },
  { id: 'piercing_up', name: 'Armor Piercing', desc: 'Bullets pierce +1 target', category: 'offense', color: '#fbbf24', icon: '🎯', apply: (p) => { p.piercingBonus = (p.piercingBonus || 0) + 1; } },
  { id: 'crit_chance', name: 'Precision', desc: '+12% crit chance (2x dmg)', category: 'offense', color: '#dc2626', icon: '💀', apply: (p) => { p.critChance = (p.critChance || 0) + 0.12; } },
  { id: 'bullet_size', name: 'Heavy Rounds', desc: '+40% bullet size', category: 'offense', color: '#ea580c', icon: '💣', apply: (p) => { p.bulletSizeMulti = (p.bulletSizeMulti || 1) + 0.4; } },
  { id: 'hp_up', name: 'Vitality', desc: '+30 max HP, heal 30', category: 'defense', color: '#22c55e', icon: '❤', apply: (p) => { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); } },
  { id: 'shield_up', name: 'Shield Boost', desc: '+25 max shield', category: 'defense', color: '#06b6d4', icon: '🛡', apply: (p) => { p.maxShield += 25; p.shield = Math.min(p.shield + 25, p.maxShield); } },
  { id: 'shield_regen', name: 'Quick Charge', desc: '+50% shield regen', category: 'defense', color: '#0ea5e9', icon: '⚡', apply: (p) => { p.shieldRegenMulti = (p.shieldRegenMulti || 1) * 1.5; } },
  { id: 'armor', name: 'Armor Plating', desc: '-15% damage taken', category: 'defense', color: '#78716c', icon: '🪨', apply: (p) => { p.damageReduction = 1 - (1 - (p.damageReduction || 0)) * 0.85; } },
  { id: 'lifesteal', name: 'Vampiric Rounds', desc: 'Heal 5% of damage dealt', category: 'defense', color: '#be123c', icon: '🩸', apply: (p) => { p.lifesteal = (p.lifesteal || 0) + 0.05; } },
  { id: 'speed_up', name: 'Swift Boots', desc: '+15% move speed', category: 'utility', color: '#a855f7', icon: '👟', apply: (p) => { p.speedMulti += 0.15; } },
  { id: 'dash_cd', name: 'Quick Dash', desc: '-25% dash cooldown', category: 'utility', color: '#8b5cf6', icon: '💨', apply: (p) => { p.dashCdMulti = (p.dashCdMulti || 1) * 0.75; } },
  { id: 'grenade_plus', name: 'Munitions', desc: '+2 grenades, +30% blast', category: 'utility', color: '#f97316', icon: '💥', apply: (p) => { p.grenadeCount = Math.min(p.grenadeCount + 2, 8); p.grenadeRadiusMulti = (p.grenadeRadiusMulti || 1) * 1.3; } },
  { id: 'xp_boost', name: 'Wisdom', desc: '+25% XP gained', category: 'utility', color: '#eab308', icon: '📖', apply: (p) => { p.xpMulti = (p.xpMulti || 1) * 1.25; } },
  { id: 'aoe_shockwave', name: 'Shockwave', desc: 'Unlock [E] shockwave AOE', category: 'offense', color: '#22d3ee', icon: '🌊', apply: (p) => { p.abilities.shockwave = true; }, requires: (p) => !p.abilities.shockwave },
  { id: 'aoe_poison', name: 'Poison Cloud', desc: 'Unlock [F] poison cloud', category: 'offense', color: '#22c55e', icon: '☁', apply: (p) => { p.abilities.poisonCloud = true; }, requires: (p) => !p.abilities.poisonCloud },
  { id: 'aoe_fire', name: 'Fire Ring', desc: 'Unlock [R] fire ring', category: 'defense', color: '#f97316', icon: '🔥', apply: (p) => { p.abilities.fireRing = true; }, requires: (p) => !p.abilities.fireRing },
  { id: 'aoe_teleport', name: 'Teleport', desc: 'Unlock [X] blink to cursor', category: 'utility', color: '#c084fc', icon: '🌀', apply: (p) => { p.abilities.teleport = true; }, requires: (p) => !p.abilities.teleport },
  { id: 'aoe_sword', name: 'Blade Storm', desc: 'Unlock [C] melee AoE slash', category: 'offense', color: '#ec4899', icon: '⚔', apply: (p) => { p.abilities.swordMode = true; }, requires: (p) => !p.abilities.swordMode },
  { id: 'aoe_armor', name: 'Armor Mode', desc: 'Unlock [V] temp damage reduction', category: 'defense', color: '#f59e0b', icon: '🛡', apply: (p) => { p.abilities.armorMode = true; }, requires: (p) => !p.abilities.armorMode },
  { id: 'aoe_flash', name: 'Super Flash', desc: 'Unlock [Z] stun + damage all on screen', category: 'offense', color: '#fef08a', icon: '💫', apply: (p) => { p.abilities.superFlash = true; }, requires: (p) => !p.abilities.superFlash },
  { id: 'dash_melee_up', name: 'Impact Force', desc: '+100% dash melee damage', category: 'offense', color: '#06b6d4', icon: '💥', apply: (p) => { p.dashMeleeDmg = (p.dashMeleeDmg || 15) * 2; } },
  { id: 'aoe_cd', name: 'Arcane Flow', desc: '-20% ability cooldowns', category: 'utility', color: '#c084fc', icon: '✨', apply: (p) => { p.abilityCdMulti = (p.abilityCdMulti || 1) * 0.8; }, requires: (p) => p.abilities.shockwave || p.abilities.poisonCloud || p.abilities.fireRing || p.abilities.teleport || p.abilities.swordMode || p.abilities.armorMode || p.abilities.superFlash },
  { id: 'ally_drone', name: 'Combat Drone', desc: 'Deploy an orbiting attack drone', category: 'utility', color: '#22d3ee', icon: '🛸', apply: (p, game) => { if (game) spawnAlly(game, 'drone'); }, passGame: true },
  { id: 'ally_turret', name: 'Auto-Turret', desc: 'Deploy a stationary turret', category: 'utility', color: '#f59e0b', icon: '🔫', apply: (p, game) => { if (game) spawnAlly(game, 'turret'); }, passGame: true },
  { id: 'ally_healbot', name: 'Heal Bot', desc: 'Deploy a healing companion', category: 'defense', color: '#22c55e', icon: '💚', apply: (p, game) => { if (game) spawnAlly(game, 'healBot'); }, passGame: true },
  { id: 'gun_builder', name: 'Gun Forge', desc: 'Open the Gun Constructor to build a custom weapon', category: 'offense', color: '#8b5cf6', icon: '🔧', apply: () => {}, isGunBuilder: true },
];

const OBSTACLES = [];
function generateObstacles() {
  OBSTACLES.length = 0;
  const rng = (min, max) => min + Math.random() * (max - min);
  for (let i = 0; i < 25; i++) {
    const ox = rng(200, ARENA_W - 200);
    const oy = rng(200, ARENA_H - 200);
    const ow = 40 + Math.random() * 60;
    const oh = 40 + Math.random() * 60;
    if (Math.abs(ox - ARENA_W / 2) < 150 && Math.abs(oy - ARENA_H / 2) < 150) continue;
    OBSTACLES.push({ x: ox, y: oy, w: ow, h: oh, shade: 10 + Math.floor(Math.random() * 8) });
  }
}

const imgCache = {};
function loadImg(src) {
  if (imgCache[src]) return imgCache[src];
  const img = new Image();
  img.src = src;
  imgCache[src] = img;
  return img;
}

function getDirection(dx, dy) {
  const angle = Math.atan2(dy, dx);
  if (angle > -Math.PI / 4 && angle <= Math.PI / 4) return 2;
  if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) return 0;
  if (angle > -3 * Math.PI / 4 && angle <= -Math.PI / 4) return 3;
  return 1;
}

function getDirAngle(dir) {
  const angles = [Math.PI / 2, Math.PI, 0, -Math.PI / 2];
  return angles[dir] || 0;
}

function drawSprite(ctx, img, frameSize, dirRow, frameIdx, x, y, scale = 1.5) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const maxCols = Math.floor(img.naturalWidth / frameSize) || 1;
  const maxRows = Math.floor(img.naturalHeight / frameSize) || 1;
  const safeFrame = frameIdx % maxCols;
  const safeDir = dirRow % maxRows;
  const sx = safeFrame * frameSize;
  const sy = safeDir * frameSize;
  const drawSize = frameSize * scale;
  ctx.drawImage(img, sx, sy, frameSize, frameSize, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
  return true;
}

function drawDirectionalSprite(ctx, dirPaths, numFrames, dir, frameIdx, x, y, drawSize = 96) {
  const path = dirPaths[dir] || dirPaths[0];
  const img = loadImg(path);
  if (!img || !img.complete || !img.naturalWidth) return false;
  const fw = img.naturalWidth / numFrames;
  const fh = Math.min(fw, img.naturalHeight);
  const safeFrame = frameIdx % numFrames;
  const sx = safeFrame * fw;
  ctx.drawImage(img, sx, 0, fw, fh, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
  return true;
}

function drawProceduralPlayer(ctx, p, time) {
  const x = p.x;
  const y = p.y;
  const angle = getDirAngle(p.dir);
  const size = 14;
  const bob = p.anim === 'run' ? Math.sin(time * 0.3) * 2 : Math.sin(time * 0.08) * 0.5;

  ctx.save();
  ctx.translate(x, y + bob);

  if (p.dashTimer > 0) {
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 20;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.15 - i * 0.04;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(-Math.cos(angle) * (i + 1) * 8, -Math.sin(angle) * (i + 1) * 8, size - 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  const legSwing = p.anim === 'run' ? Math.sin(time * 0.4) * 6 : 0;
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.ellipse(-4 + Math.sin(legSwing) * 2, size * 0.6, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4 - Math.sin(legSwing) * 2, size * 0.6, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  bodyGrad.addColorStop(0, '#334155');
  bodyGrad.addColorStop(0.6, '#1e293b');
  bodyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.85, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(0, -2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.moveTo(-4, -8);
  ctx.lineTo(4, -8);
  ctx.stroke();

  const armSwing = p.anim === 'run' ? Math.sin(time * 0.4) * 4 : 0;
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(-size + 2, armSwing, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size - 2, -armSwing, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const gunLen = 18;
  const gunX = Math.cos(angle) * gunLen;
  const gunY = Math.sin(angle) * gunLen;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
  ctx.lineTo(gunX, gunY);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(gunX, gunY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (p.shootCd > 0 && p.shootCd > (WEAPONS[p.weapon]?.cooldown || 12) - 3) {
    ctx.fillStyle = WEAPONS[p.weapon]?.color || '#fbbf24';
    ctx.shadowColor = WEAPONS[p.weapon]?.color || '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(gunX + Math.cos(angle) * 4, gunY + Math.sin(angle) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const eyeOff = 3;
  const eyeDx = Math.cos(angle) * 2;
  const eyeDy = Math.sin(angle) * 2;
  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(-eyeOff + eyeDx, -4 + eyeDy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOff + eyeDx, -4 + eyeDy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawProceduralEnemy(ctx, e, et, time) {
  const x = e.x;
  const y = e.y;
  const scale = e.isBoss ? (e.bossScale || 2.2) : 1;
  const size = (et.size || 24) * scale * 0.5;
  const bob = e.anim === 'run' ? Math.sin(time * 0.25 + e.x) * 2 : Math.sin(time * 0.06 + e.x) * 0.8;
  const color = et.color || '#ef4444';
  const accent = et.accentColor || color;

  ctx.save();
  ctx.translate(x, y + bob);

  if (e.hurtTimer > 0) {
    ctx.filter = 'brightness(2.5) saturate(0.2)';
  }

  const shape = et.bodyShape || 'humanoid';

  if (shape === 'blob') {
    const squish = 1 + Math.sin(time * 0.15 + e.x) * 0.08;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 2, size * 1.2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.7, accent);
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 2, size * squish, size * 0.8 / squish, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.25, -size * 0.15, size * 0.15, size * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    const edx = Math.cos(getDirAngle(e.dir)) * 2;
    const edy = Math.sin(getDirAngle(e.dir)) * 2;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-3 + edx, -2 + edy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 + edx, -2 + edy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3 + edx + 0.5, -2.5 + edy, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 + edx + 0.5, -2.5 + edy, 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'floating') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, size + 4, size * 0.7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const floatY = Math.sin(time * 0.08 + e.x * 0.1) * 4 - 6;
    ctx.save();
    ctx.translate(0, floatY);
    const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    eyeGrad.addColorStop(0, '#e879f9');
    eyeGrad.addColorStop(0.5, color);
    eyeGrad.addColorStop(1, accent);
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const ta = (i / 5) * Math.PI * 2 + time * 0.02;
      const tx = Math.cos(ta) * size * 1.1;
      const ty = Math.sin(ta) * size * 1.1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(ta) * 8, ty + Math.sin(ta) * 8);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tx + Math.cos(ta) * 10, ty + Math.sin(ta) * 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    const pupilAngle = getDirAngle(e.dir);
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(Math.cos(pupilAngle) * 3, Math.sin(pupilAngle) * 3, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(Math.cos(pupilAngle) * 4, Math.sin(pupilAngle) * 4, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (shape === 'plant') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.4, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const la = (i / 6) * Math.PI * 2 + Math.sin(time * 0.05) * 0.1;
      ctx.save();
      ctx.rotate(la);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.6, 4, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (e.anim === 'attack') {
      const openAmt = Math.sin(time * 0.3) * 0.4 + 0.6;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -4, size * 0.5 * openAmt, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      for (let t = 0; t < 6; t++) {
        const fa = (t / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(fa) * size * 0.2, -4 + Math.sin(fa) * size * 0.2);
        ctx.lineTo(Math.cos(fa) * size * 0.45, -4 + Math.sin(fa) * size * 0.45);
        ctx.lineTo(Math.cos(fa + 0.2) * size * 0.2, -4 + Math.sin(fa + 0.2) * size * 0.2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, -4, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'hulk') {
    const legSwing = e.anim === 'run' ? Math.sin(time * 0.2 + e.y) * 4 : 0;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-size * 0.35 + legSwing, size * 0.6, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.35 - legSwing, size * 0.6, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    const bodyGrad = ctx.createRadialGradient(0, -2, 0, 0, -2, size * 1.1);
    bodyGrad.addColorStop(0, color);
    bodyGrad.addColorStop(0.8, accent);
    bodyGrad.addColorStop(1, '#44403c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -2, size, size * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const cx = (Math.random() - 0.5) * size;
      const cy = (Math.random() - 0.5) * size * 0.6 - 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const armSwing2 = e.anim === 'attack' ? Math.sin(time * 0.4) * 8 : (e.anim === 'run' ? Math.sin(time * 0.2) * 4 : 0);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-size - 4, -2 + armSwing2, size * 0.3, size * 0.4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size + 4, -2 - armSwing2, size * 0.3, size * 0.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-4, -size * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -size * 0.3, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const legSwing2 = e.anim === 'run' ? Math.sin(time * 0.35 + e.y) * 5 : 0;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-3 + legSwing2, size * 0.55, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3 - legSwing2, size * 0.55, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad2 = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    bodyGrad2.addColorStop(0, color);
    bodyGrad2.addColorStop(0.8, accent);
    bodyGrad2.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = bodyGrad2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (shape === 'small') {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.35);
      ctx.lineTo(-size * 0.7, -size * 0.8);
      ctx.lineTo(-size * 0.25, -size * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(size * 0.5, -size * 0.35);
      ctx.lineTo(size * 0.7, -size * 0.8);
      ctx.lineTo(size * 0.25, -size * 0.4);
      ctx.fill();
    }

    const headColor = shape === 'small' ? color : (et.headShape === 'skull' ? '#e8e8e8' : color);
    ctx.fillStyle = headColor;
    ctx.beginPath();
    if (et.headShape === 'skull') {
      ctx.arc(0, -size * 0.4, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(-size * 0.12, -size * 0.45, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.12, -size * 0.45, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, -size * 0.28);
      ctx.lineTo(0, -size * 0.22);
      ctx.lineTo(2, -size * 0.28);
      ctx.stroke();
    } else if (et.headShape === 'hood') {
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, -size * 0.15);
      ctx.lineTo(-size * 0.35, -size * 0.7);
      ctx.quadraticCurveTo(0, -size * 0.95, size * 0.35, -size * 0.7);
      ctx.lineTo(size * 0.4, -size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(0, -size * 0.4, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      const mEyeAngle = getDirAngle(e.dir);
      ctx.fillStyle = et.accentColor || '#a855f7';
      ctx.shadowColor = et.accentColor || '#a855f7';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(-3 + Math.cos(mEyeAngle) * 1.5, -size * 0.42 + Math.sin(mEyeAngle), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3 + Math.cos(mEyeAngle) * 1.5, -size * 0.42 + Math.sin(mEyeAngle), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (et.headShape === 'snout') {
      ctx.arc(0, -size * 0.35, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      const sAngle = getDirAngle(e.dir);
      ctx.beginPath();
      ctx.ellipse(Math.cos(sAngle) * 4, -size * 0.35 + Math.sin(sAngle) * 4, 5, 3.5, sAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-3, -size * 0.42, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, -size * 0.42, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(0, -size * 0.35, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      const edAngle = getDirAngle(e.dir);
      const edx2 = Math.cos(edAngle) * 1.5;
      const edy2 = Math.sin(edAngle) * 1.5;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-3 + edx2, -size * 0.4 + edy2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3 + edx2, -size * 0.4 + edy2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const armSwing3 = e.anim === 'attack' ? Math.sin(time * 0.4) * 6 : (e.anim === 'run' ? Math.sin(time * 0.35) * 3 : 0);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(-size * 0.7, armSwing3, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.7, -armSwing3, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (et.ranged) {
      const wAngle = getDirAngle(e.dir);
      if (et.aoeAttack) {
        ctx.strokeStyle = et.projectileColor || '#a855f7';
        ctx.shadowColor = et.projectileColor || '#a855f7';
        ctx.shadowBlur = e.anim === 'attack' ? 10 : 4;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(wAngle) * size * 0.5, Math.sin(wAngle) * size * 0.5);
        ctx.lineTo(Math.cos(wAngle) * size * 1.4, Math.sin(wAngle) * size * 1.4);
        ctx.stroke();
        ctx.fillStyle = et.projectileColor || '#a855f7';
        ctx.beginPath();
        ctx.arc(Math.cos(wAngle) * size * 1.4, Math.sin(wAngle) * size * 1.4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(wAngle) * size * 0.3, Math.sin(wAngle) * size * 0.3);
        ctx.lineTo(Math.cos(wAngle) * size * 1.3, Math.sin(wAngle) * size * 1.3);
        ctx.stroke();
        ctx.strokeStyle = et.projectileColor || '#fbbf24';
        ctx.lineWidth = 1.5;
        const bowAngle = wAngle + Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(wAngle) * size * 0.6, Math.sin(wAngle) * size * 0.6, size * 0.4, bowAngle - 0.8, bowAngle + 0.8);
        ctx.stroke();
      }
    } else if (e.anim === 'attack') {
      const wAngle = getDirAngle(e.dir);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(wAngle) * size * 0.5, Math.sin(wAngle) * size * 0.5);
      ctx.lineTo(Math.cos(wAngle) * size * 1.5, Math.sin(wAngle) * size * 1.5);
      ctx.stroke();
    }
  }

  if (e.isBoss) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, size + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.filter = 'none';
  ctx.restore();
}

function drawGroundTile(ctx, camX, camY) {
  const tileSize = 64;
  const startX = Math.floor(camX / tileSize) * tileSize;
  const startY = Math.floor(camY / tileSize) * tileSize;
  for (let gx = startX - tileSize; gx < camX + CANVAS_W + tileSize; gx += tileSize) {
    for (let gy = startY - tileSize; gy < camY + CANVAS_H + tileSize; gy += tileSize) {
      const sx = gx - camX;
      const sy = gy - camY;
      const hash = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
      const shade = 18 + (hash % 12);
      ctx.fillStyle = `rgb(${shade}, ${shade + 8}, ${shade + 4})`;
      ctx.fillRect(sx, sy, tileSize, tileSize);
      if (hash % 5 === 0) {
        ctx.fillStyle = `rgba(34, 80, 50, 0.15)`;
        ctx.beginPath();
        ctx.arc(sx + (hash % 40) + 12, sy + ((hash >> 8) % 40) + 12, 2 + (hash % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      if (hash % 11 === 0) {
        ctx.fillStyle = `rgba(20, 60, 40, 0.12)`;
        const grassX = sx + (hash % 50) + 7;
        const grassY = sy + ((hash >> 4) % 50) + 7;
        for (let b = 0; b < 3; b++) {
          ctx.fillRect(grassX + b * 3, grassY - 2 - (hash % 4), 1, 4 + (hash % 3));
        }
      }
    }
  }
}

function pointInObstacle(x, y) {
  for (const o of OBSTACLES) {
    if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true;
  }
  return false;
}

function lineHitsObstacle(x1, y1, x2, y2) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(steps, 1);
    if (pointInObstacle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return true;
  }
  return false;
}

function spawnEnemy(typeKey, wave, isBoss) {
  const t = ENEMY_TYPES[typeKey];
  if (!t) return null;
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 100;
  switch (side) {
    case 0: x = Math.random() * ARENA_W; y = -margin; break;
    case 1: x = ARENA_W + margin; y = Math.random() * ARENA_H; break;
    case 2: x = Math.random() * ARENA_W; y = ARENA_H + margin; break;
    default: x = -margin; y = Math.random() * ARENA_H; break;
  }
  const waveScale = 1 + wave * 0.15;
  const bossScale = isBoss ? 3 : 1;
  return {
    type: typeKey,
    x, y,
    hp: Math.floor(t.hp * waveScale * bossScale),
    maxHp: Math.floor(t.hp * waveScale * bossScale),
    speed: (t.speed + wave * 0.05) * (isBoss ? 0.7 : 1),
    damage: Math.floor(t.damage * (1 + wave * 0.1) * (isBoss ? 2 : 1)),
    attackRange: t.attackRange * (isBoss ? 1.5 : 1),
    attackCd: Math.floor(t.attackCd * (isBoss ? 0.8 : 1)),
    attackTimer: 0,
    anim: 'idle',
    frame: 0,
    frameTimer: 0,
    dir: 0,
    dead: false,
    deathTimer: 0,
    hurtTimer: 0,
    size: Math.floor(t.size * (isBoss ? 2 : 1)),
    stationary: t.stationary || false,
    isBoss,
    bossScale: isBoss ? 2.2 : 1,
    stunTimer: 0,
    poisonTimer: 0,
    poisonDmg: 0,
    burnTimer: 0,
  };
}

function createGame() {
  generateObstacles();
  return {
    player: {
      x: ARENA_W / 2, y: ARENA_H / 2,
      hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
      shield: 0, maxShield: PLAYER_MAX_SHIELD,
      shieldRegenDelay: 0,
      shieldRegenMulti: 1,
      anim: 'idle', frame: 0, frameTimer: 0,
      dir: 0,
      shootCd: 0,
      dashTimer: 0, dashCd: 0, dashDx: 0, dashDy: 0,
      dashCdMulti: 1,
      xp: 0, level: 1,
      kills: 0, score: 0,
      dead: false, deathTimer: 0,
      invuln: 0,
      damageMulti: 1,
      fireRateMulti: 1,
      speedMulti: 1,
      weapon: 'pistol',
      weaponsUnlocked: ['pistol'],
      grenadeCd: 0,
      grenadeCount: 3,
      grenadeRadiusMulti: 1,
      comboKills: 0,
      comboTimer: 0,
      bestCombo: 0,
      critChance: 0,
      piercingBonus: 0,
      bulletSizeMulti: 1,
      damageReduction: 0,
      lifesteal: 0,
      xpMulti: 1,
      abilities: { shockwave: false, poisonCloud: false, fireRing: false, teleport: false, swordMode: false, armorMode: false, superFlash: false },
      abilityCooldowns: { shockwave: 0, poisonCloud: 0, fireRing: 0, teleport: 0, swordMode: 0, armorMode: 0, superFlash: 0 },
      abilityCdMulti: 1,
      armorModeTimer: 0,
      armorModeReduction: 0,
      superFlashTimer: 0,
      dashMeleeDmg: 15,
      upgrades: [],
      gunConfig: { ...DEFAULT_GUN_CONFIG },
      guns: [{ ...DEFAULT_GUN_CONFIG }, null],
      activeGun: 0,
      coins: 0,
      unlockedParts: {
        barrel: [1], sight: [1], trigger: [1], stock: [1], bayonet: [0],
      },
    },
    enemies: [],
    bullets: [],
    enemyBullets: [],
    enemyAoeIndicators: [],
    particles: [],
    pickups: [],
    grenades: [],
    explosions: [],
    spriteEffects: [],
    muzzleFlashes: [],
    damageNumbers: [],
    announcements: [],
    aoeZones: [],
    allies: [],
    magicEffects: [],
    shotEffects: [],
    swordSlash: null,
    wave: 0,
    waveTimer: 0,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    time: 0,
    camX: 0, camY: 0,
    mouseX: CANVAS_W / 2, mouseY: CANVAS_H / 2,
    keys: {},
    gameOver: false,
    paused: false,
    started: false,
    totalKills: 0,
    screenShake: 0,
    screenShakeIntensity: 0,
    bossActive: false,
    bossKills: 0,
    upgradePhase: false,
    upgradeChoices: [],
  };
}

function getUpgradeChoices(player, count = 3) {
  const available = UPGRADE_CARDS.filter(c => {
    if (c.requires && !c.requires(player)) return false;
    return true;
  });
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function addDamageNumber(game, x, y, value, color, large) {
  game.damageNumbers.push({
    x, y: y - 10, value: String(value), color: color || '#fbbf24',
    life: 45, maxLife: 45, vy: -1.5, large: large || false,
  });
}

function addAnnouncement(game, text, color, duration) {
  game.announcements.push({ text, color: color || '#fbbf24', life: duration || 120, maxLife: duration || 120 });
}

function checkCombo(game) {
  const p = game.player;
  const combo = p.comboKills;
  if (combo >= 2) {
    const labels = ['', '', 'DOUBLE KILL', 'TRIPLE KILL', 'MEGA KILL', 'ULTRA KILL', 'RAMPAGE'];
    const colors = ['', '', '#fbbf24', '#f97316', '#ef4444', '#a855f7', '#ec4899'];
    const idx = Math.min(combo, labels.length - 1);
    addAnnouncement(game, labels[idx] + '!', colors[idx], 90);
    p.score += combo * 5;
  }
  if (combo > p.bestCombo) p.bestCombo = combo;
}

function updateGame(game) {
  if (game.paused || game.gameOver || !game.started || game.upgradePhase) return;
  game.time++;

  if (game.screenShake > 0) game.screenShake--;

  const p = game.player;
  if (p.dead) {
    p.deathTimer++;
    if (p.deathTimer > 60) game.gameOver = true;
    return;
  }

  if (p.invuln > 0) p.invuln--;
  if (p.shootCd > 0) p.shootCd--;
  if (p.dashCd > 0) p.dashCd--;
  if (p.grenadeCd > 0) p.grenadeCd--;

  for (const key of Object.keys(p.abilityCooldowns)) {
    if (p.abilityCooldowns[key] > 0) p.abilityCooldowns[key]--;
  }

  if (p.shieldRegenDelay > 0) {
    p.shieldRegenDelay--;
  } else if (p.shield < p.maxShield) {
    p.shield = Math.min(p.maxShield, p.shield + SHIELD_REGEN_RATE * p.shieldRegenMulti);
  }

  if (p.comboTimer > 0) {
    p.comboTimer--;
    if (p.comboTimer <= 0 && p.comboKills > 0) {
      checkCombo(game);
      p.comboKills = 0;
    }
  }

  let moveX = 0, moveY = 0;
  if (game.keys['w'] || game.keys['arrowup']) moveY = -1;
  if (game.keys['s'] || game.keys['arrowdown']) moveY = 1;
  if (game.keys['a'] || game.keys['arrowleft']) moveX = -1;
  if (game.keys['d'] || game.keys['arrowright']) moveX = 1;

  if (p.armorModeTimer > 0) {
    p.armorModeTimer--;
    if (p.armorModeTimer <= 0) {
      p.armorModeReduction = 0;
      addAnnouncement(game, 'ARMOR OFF', '#64748b', 60);
    }
  }

  if (p.superFlashTimer > 0) p.superFlashTimer--;

  if (p.dashTimer > 0) {
    p.dashTimer--;
    const nx = p.x + p.dashDx * DASH_SPEED;
    const ny = p.y + p.dashDy * DASH_SPEED;
    if (!pointInObstacle(nx, ny)) { p.x = nx; p.y = ny; }
    p.invuln = 5;
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      const e = game.enemies[j];
      if (e.dead) continue;
      const dd = Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2);
      if (dd < e.size + 20) {
        const meleeDmg = Math.floor(p.dashMeleeDmg * p.damageMulti);
        applyDamage(game, e, meleeDmg);
        if (!e.stationary && !e.dead) {
          const kbx = e.x - p.x, kby = e.y - p.y;
          const kbl = Math.sqrt(kbx * kbx + kby * kby) || 1;
          e.x += (kbx / kbl) * 6;
          e.y += (kby / kbl) * 6;
          e.stunTimer = Math.max(e.stunTimer, 15);
        }
        spawnRandomHitFx(game.spriteEffects, e.x, e.y, { size: 48, scale: 0.9, speed: 2 });
      }
    }
  } else {
    const moving = moveX !== 0 || moveY !== 0;
    if (moving) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      const nx = p.x + (moveX / len) * PLAYER_SPEED * p.speedMulti;
      const ny = p.y + (moveY / len) * PLAYER_SPEED * p.speedMulti;
      if (!pointInObstacle(nx, p.y)) p.x = nx;
      if (!pointInObstacle(p.x, ny)) p.y = ny;
    }
    p.anim = moving ? 'run' : 'idle';
  }

  p.x = Math.max(20, Math.min(ARENA_W - 20, p.x));
  p.y = Math.max(20, Math.min(ARENA_H - 20, p.y));

  const worldMouseX = game.mouseX + game.camX;
  const worldMouseY = game.mouseY + game.camY;
  p.dir = getDirection(worldMouseX - p.x, worldMouseY - p.y);

  p.frameTimer++;
  const animSpeed = p.anim === 'run' ? 6 : 10;
  const curSprites = getPlayerSprites(p.level);
  const maxFrames = curSprites[p.anim]?.frames || 4;
  if (p.frameTimer >= animSpeed) {
    p.frameTimer = 0;
    p.frame = (p.frame + 1) % maxFrames;
  }

  game.camX = p.x - CANVAS_W / 2;
  game.camY = p.y - CANVAS_H / 2;
  game.camX = Math.max(0, Math.min(ARENA_W - CANVAS_W, game.camX));
  game.camY = Math.max(0, Math.min(ARENA_H - CANVAS_H, game.camY));

  if (game.keys[' '] && p.dashTimer <= 0 && p.dashCd <= 0 && (moveX !== 0 || moveY !== 0)) {
    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    p.dashDx = moveX / len;
    p.dashDy = moveY / len;
    p.dashTimer = DASH_DURATION;
    p.dashCd = Math.floor(DASH_COOLDOWN * p.dashCdMulti);
  }

  if (game.keys['e'] && p.abilities.shockwave && p.abilityCooldowns.shockwave <= 0) {
    const aoe = AOE_ABILITIES.shockwave;
    p.abilityCooldowns.shockwave = Math.floor(aoe.cooldown * p.abilityCdMulti);
    game.screenShake = 8;
    game.screenShakeIntensity = 8;
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      const e = game.enemies[j];
      if (e.dead) continue;
      const dist = Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2);
      if (dist < aoe.radius) {
        const dmg = Math.floor(aoe.damage * p.damageMulti * (1 - dist / aoe.radius));
        applyDamage(game, e, dmg);
        if (!e.stationary) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const len2 = Math.sqrt(dx * dx + dy * dy) || 1;
          e.x += (dx / len2) * aoe.knockback;
          e.y += (dy / len2) * aoe.knockback;
          e.stunTimer = aoe.stunDuration;
        }
      }
    }
    for (let k = 0; k < 40; k++) {
      const angle = (k / 40) * Math.PI * 2;
      game.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(angle) * (4 + Math.random() * 3),
        vy: Math.sin(angle) * (4 + Math.random() * 3),
        life: 25, maxLife: 25, color: '#22d3ee', size: 3 + Math.random() * 3,
      });
    }
    game.explosions.push({ x: p.x, y: p.y, radius: aoe.radius, life: 15, maxLife: 15, color: '#22d3ee' });
    spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y,
      { size: 128, scale: 1.5, speed: 2 });
    spawnRandomEffect(game.spriteEffects, 'explosion', p.x, p.y,
      { size: 96, scale: 1.2, speed: 2 });
    addAnnouncement(game, 'SHOCKWAVE!', '#22d3ee', 60);
  }

  if (game.keys['f'] && p.abilities.poisonCloud && p.abilityCooldowns.poisonCloud <= 0) {
    const aoe = AOE_ABILITIES.poisonCloud;
    p.abilityCooldowns.poisonCloud = Math.floor(aoe.cooldown * p.abilityCdMulti);
    game.aoeZones.push({
      type: 'poison',
      x: worldMouseX, y: worldMouseY,
      radius: aoe.radius, damage: aoe.damage * p.damageMulti,
      life: aoe.duration, maxLife: aoe.duration,
      tickRate: aoe.tickRate, tickTimer: 0,
      color: '#22c55e',
    });
    spawnRandomEffect(game.spriteEffects, 'magic', worldMouseX, worldMouseY,
      { size: 96, scale: 1.0, speed: 3 });
    addAnnouncement(game, 'POISON CLOUD!', '#22c55e', 60);
  }

  if (game.keys['r'] && p.abilities.fireRing && p.abilityCooldowns.fireRing <= 0) {
    const aoe = AOE_ABILITIES.fireRing;
    p.abilityCooldowns.fireRing = Math.floor(aoe.cooldown * p.abilityCdMulti);
    game.aoeZones.push({
      type: 'fire',
      x: p.x, y: p.y,
      radius: aoe.radius, damage: aoe.damage * p.damageMulti,
      life: aoe.duration, maxLife: aoe.duration,
      expandSpeed: aoe.expandSpeed,
      followPlayer: true,
      tickRate: 15, tickTimer: 0,
      color: '#f97316',
    });
    spawnRandomEffect(game.spriteEffects, 'fire', p.x, p.y,
      { size: 96, scale: 1.3, speed: 2 });
    addAnnouncement(game, 'FIRE RING!', '#f97316', 60);
  }

  if (game.keys['x'] && p.abilities.teleport && p.abilityCooldowns.teleport <= 0) {
    const aoe = AOE_ABILITIES.teleport;
    p.abilityCooldowns.teleport = Math.floor(aoe.cooldown * p.abilityCdMulti);
    const tdx = worldMouseX - p.x, tdy = worldMouseY - p.y;
    const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
    const clampedDist = Math.min(tDist, aoe.range);
    const tx = p.x + (tdx / (tDist || 1)) * clampedDist;
    const ty = p.y + (tdy / (tDist || 1)) * clampedDist;
    const finalX = Math.max(30, Math.min(ARENA_W - 30, tx));
    const finalY = Math.max(30, Math.min(ARENA_H - 30, ty));
    if (!pointInObstacle(finalX, finalY)) {
      for (let k = 0; k < 15; k++) {
        const t = k / 15;
        game.particles.push({
          x: p.x + (finalX - p.x) * t, y: p.y + (finalY - p.y) * t,
          vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
          life: 20 + Math.random() * 10, maxLife: 30, color: '#c084fc', size: 3 + Math.random() * 2,
        });
      }
      spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y, { size: 64, scale: 0.8, speed: 2 });
      p.x = finalX;
      p.y = finalY;
      p.invuln = 15;
      spawnRandomEffect(game.spriteEffects, 'magic', finalX, finalY, { size: 80, scale: 1.0, speed: 2 });
      game.screenShake = 3;
      game.screenShakeIntensity = 3;
      addAnnouncement(game, 'TELEPORT!', '#c084fc', 40);
    }
    game.keys['x'] = false;
  }

  if (game.keys['c'] && p.abilities.swordMode && p.abilityCooldowns.swordMode <= 0) {
    const aoe = AOE_ABILITIES.swordMode;
    p.abilityCooldowns.swordMode = Math.floor(aoe.cooldown * p.abilityCdMulti);
    game.screenShake = 6;
    game.screenShakeIntensity = 6;
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      const e = game.enemies[j];
      if (e.dead) continue;
      const dist = Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2);
      if (dist < aoe.radius) {
        const dmg = Math.floor(aoe.damage * p.damageMulti);
        applyDamage(game, e, dmg);
        if (!e.stationary && !e.dead) {
          const sdx = e.x - p.x, sdy = e.y - p.y;
          const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
          e.x += (sdx / slen) * 8;
          e.y += (sdy / slen) * 8;
          e.stunTimer = Math.max(e.stunTimer, 20);
        }
      }
    }
    game.swordSlash = { x: p.x, y: p.y, radius: aoe.radius, life: 18, maxLife: 18, angle: Math.atan2(worldMouseY - p.y, worldMouseX - p.x) };
    for (let k = 0; k < 24; k++) {
      const angle = (k / 24) * Math.PI * 2;
      const r = aoe.radius * (0.5 + Math.random() * 0.5);
      game.particles.push({
        x: p.x + Math.cos(angle) * r * 0.3, y: p.y + Math.sin(angle) * r * 0.3,
        vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
        life: 15, maxLife: 15, color: '#ec4899', size: 3 + Math.random() * 2,
      });
    }
    spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y, { size: 120, scale: 1.4, speed: 2 });
    addAnnouncement(game, 'BLADE STORM!', '#ec4899', 60);
    game.keys['c'] = false;
  }

  if (game.keys['v'] && p.abilities.armorMode && p.abilityCooldowns.armorMode <= 0 && p.armorModeTimer <= 0) {
    const aoe = AOE_ABILITIES.armorMode;
    p.abilityCooldowns.armorMode = Math.floor(aoe.cooldown * p.abilityCdMulti);
    p.armorModeTimer = aoe.duration;
    p.armorModeReduction = aoe.damageReduction;
    game.screenShake = 4;
    game.screenShakeIntensity = 3;
    for (let k = 0; k < 20; k++) {
      const angle = (k / 20) * Math.PI * 2;
      game.particles.push({
        x: p.x + Math.cos(angle) * 25, y: p.y + Math.sin(angle) * 25,
        vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
        life: 30, maxLife: 30, color: '#f59e0b', size: 4,
      });
    }
    spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y, { size: 96, scale: 1.2, speed: 2 });
    addAnnouncement(game, 'ARMOR ENGAGED!', '#f59e0b', 90);
    game.keys['v'] = false;
  }

  if (game.keys['z'] && p.abilities.superFlash && p.abilityCooldowns.superFlash <= 0) {
    const aoe = AOE_ABILITIES.superFlash;
    p.abilityCooldowns.superFlash = Math.floor(aoe.cooldown * p.abilityCdMulti);
    p.superFlashTimer = 20;
    game.screenShake = 10;
    game.screenShakeIntensity = 10;
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      const e = game.enemies[j];
      if (e.dead) continue;
      const ex = e.x - game.camX, ey = e.y - game.camY;
      if (ex > -50 && ex < CANVAS_W + 50 && ey > -50 && ey < CANVAS_H + 50) {
        const dmg = Math.floor(aoe.damage * p.damageMulti);
        applyDamage(game, e, dmg);
        e.stunTimer = Math.max(e.stunTimer, aoe.stunDuration);
      }
    }
    for (let k = 0; k < 50; k++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 200;
      game.particles.push({
        x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r,
        vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
        life: 25, maxLife: 25, color: k % 2 === 0 ? '#fef08a' : '#fff', size: 4 + Math.random() * 3,
      });
    }
    spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y, { size: 200, scale: 2.5, speed: 1 });
    addAnnouncement(game, 'SUPER FLASH!', '#fef08a', 90);
    game.keys['z'] = false;
  }

  if (game.swordSlash) {
    game.swordSlash.life--;
    if (game.swordSlash.life <= 0) game.swordSlash = null;
  }

  for (let i = game.aoeZones.length - 1; i >= 0; i--) {
    const zone = game.aoeZones[i];
    zone.life--;
    if (zone.followPlayer) {
      zone.x = p.x;
      zone.y = p.y;
    }
    zone.tickTimer++;
    if (zone.tickTimer >= zone.tickRate) {
      zone.tickTimer = 0;
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        const e = game.enemies[j];
        if (e.dead) continue;
        const dist = Math.sqrt((e.x - zone.x) ** 2 + (e.y - zone.y) ** 2);
        if (zone.type === 'fire') {
          const innerR = zone.radius * 0.6;
          if (dist > innerR && dist < zone.radius) {
            applyDamage(game, e, Math.floor(zone.damage * 0.3));
            e.burnTimer = 30;
          }
        } else {
          if (dist < zone.radius) {
            applyDamage(game, e, Math.floor(zone.damage));
            e.poisonTimer = 30;
          }
        }
      }
    }
    if (zone.life <= 0) game.aoeZones.splice(i, 1);
  }

  const wpn = WEAPONS[p.weapon];
  const customStats = p.gunConfig ? getGunStats(p.gunConfig) : null;
  const fireWeapon = customStats || wpn;
  const fDamage = customStats ? customStats.baseDamage : wpn.damage;
  const fCooldown = customStats ? customStats.cooldown : wpn.cooldown;
  const fSpeed = customStats ? customStats.speed : wpn.speed;
  const fLifetime = customStats ? customStats.lifetime : wpn.lifetime;
  const fSpread = customStats ? customStats.spread : wpn.spread;
  const fCount = customStats ? customStats.count : wpn.count;
  const fColor = customStats ? customStats.color : wpn.color;
  const fShotType = customStats ? customStats.shotType : 'standard';
  const fCrit = customStats ? customStats.critChance : (p.critChance || 0);

  if (game.keys['mousedown'] && p.shootCd <= 0 && p.dashTimer <= 0) {
    const dx = worldMouseX - p.x;
    const dy = worldMouseY - p.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);

    for (let shot = 0; shot < fCount; shot++) {
      const spreadAngle = baseAngle + (Math.random() - 0.5) * fSpread * 2;
      const bvx = Math.cos(spreadAngle) * fSpeed;
      const bvy = Math.sin(spreadAngle) * fSpeed;
      const isCrit = Math.random() < fCrit;
      const dmg = fDamage * p.damageMulti * (isCrit ? 2 : 1);
      const isPiercing = fShotType === 'piercing' || fShotType === 'beam' || (p.piercingBonus > 0);
      const isExplosive = fShotType === 'explosive';
      const isMissile = fShotType === 'missile';
      const isHeal = fShotType === 'heal';
      const isPoison = fShotType === 'poison';
      game.bullets.push({
        x: p.x + (dx / len) * 12, y: p.y + (dy / len) * 12,
        vx: bvx, vy: bvy,
        life: fLifetime,
        damage: dmg,
        owner: 'player',
        color: isCrit ? '#ff0' : fColor,
        size: (fShotType === 'heavy' ? 6 : fShotType === 'beam' ? 3 : fShotType === 'missile' ? 5 : 4) * (p.bulletSizeMulti || 1),
        piercing: isPiercing,
        piercesLeft: isPiercing ? 999 : (p.piercingBonus || 0),
        explosive: isExplosive,
        blastRadius: isExplosive ? 50 : 0,
        hitTargets: [],
        isCrit,
        shotType: fShotType,
        homing: isMissile,
        healAmount: isHeal ? Math.floor(dmg * 0.3) : 0,
        poisonDmg: isPoison ? Math.floor(dmg * 0.15) : 0,
      });
    }
    p.shootCd = Math.floor(fCooldown * (p.fireRateMulti || 1));
    spawnShotEffect(game, p.x + (dx / len) * 16, p.y + (dy / len) * 16, p.weapon);
    for (let i = 0; i < 3; i++) {
      game.particles.push({
        x: p.x + (dx / len) * 16, y: p.y + (dy / len) * 16,
        vx: (dx / len) * 3 + (Math.random() - 0.5) * 2,
        vy: (dy / len) * 3 + (Math.random() - 0.5) * 2,
        life: 15, maxLife: 15, color: fColor, size: 3,
      });
    }
    game.screenShake = 3;
    game.screenShakeIntensity = fShotType === 'spread' ? 5 : fShotType === 'heavy' ? 4 : 2;
    const mAngle = Math.atan2(dy, dx);
    game.muzzleFlashes.push({
      x: p.x + (dx / len) * 18, y: p.y + (dy / len) * 18,
      frame: 0, timer: 0, type: fShotType === 'spread' ? 'flashB' : 'flashA', angle: mAngle,
    });
    spawnRandomShootFx(game.spriteEffects,
      p.x + (dx / len) * 22, p.y + (dy / len) * 22,
      { size: 36, scale: 0.7, speed: 2, angle: mAngle });
    if (fShotType === 'spread' || fShotType === 'explosive') {
      spawnRandomEffect(game.spriteEffects, 'fire',
        p.x + (dx / len) * 16, p.y + (dy / len) * 16,
        { size: 40, scale: 0.5, speed: 2, angle: mAngle });
    }
  }

  if (game.keys['rightmousedown'] && p.grenadeCd <= 0 && p.grenadeCount > 0) {
    const dx = worldMouseX - p.x;
    const dy = worldMouseY - p.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dist = Math.min(len, 300);
    game.grenades.push({
      x: p.x, y: p.y,
      tx: p.x + (dx / len) * dist,
      ty: p.y + (dy / len) * dist,
      progress: 0, duration: 30,
    });
    p.grenadeCd = GRENADE_COOLDOWN;
    p.grenadeCount--;
    game.keys['rightmousedown'] = false;
  }

  for (let i = game.grenades.length - 1; i >= 0; i--) {
    const g = game.grenades[i];
    g.progress++;
    const t = g.progress / g.duration;
    g.cx = g.x + (g.tx - g.x) * t;
    g.cy = g.y + (g.ty - g.y) * t - Math.sin(t * Math.PI) * 60;
    if (g.progress >= g.duration) {
      const gRadius = GRENADE_RADIUS * (p.grenadeRadiusMulti || 1);
      game.explosions.push({ x: g.tx, y: g.ty, radius: gRadius, life: 20, maxLife: 20 });
      spawnRandomEffect(game.spriteEffects, 'explosion', g.tx, g.ty,
        { size: 128, scale: 1.0 + gRadius / 150, speed: 2 });
      spawnRandomEffect(game.spriteEffects, 'fire', g.tx, g.ty,
        { size: 80, scale: 0.8, speed: 3 });
      game.screenShake = 8;
      game.screenShakeIntensity = 8;
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        const e = game.enemies[j];
        if (e.dead) continue;
        const dist = Math.sqrt((e.x - g.tx) ** 2 + (e.y - g.ty) ** 2);
        if (dist < gRadius) {
          const dmg = Math.floor(GRENADE_DAMAGE * (1 - dist / gRadius) * p.damageMulti);
          applyDamage(game, e, dmg);
        }
      }
      for (let k = 0; k < 30; k++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 4;
        game.particles.push({
          x: g.tx, y: g.ty,
          vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          life: 25 + Math.random() * 15, maxLife: 40,
          color: ['#f97316', '#fbbf24', '#ef4444'][Math.floor(Math.random() * 3)],
          size: 3 + Math.random() * 4,
        });
      }
      game.grenades.splice(i, 1);
    }
  }

  for (let i = game.explosions.length - 1; i >= 0; i--) {
    game.explosions[i].life--;
    if (game.explosions[i].life <= 0) game.explosions.splice(i, 1);
  }

  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    if (b.homing && b.owner === 'player') {
      let closest = null, closeDist = 200;
      for (const e of game.enemies) {
        if (e.dead) continue;
        const d = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
        if (d < closeDist) { closest = e; closeDist = d; }
      }
      if (closest) {
        const tAngle = Math.atan2(closest.y - b.y, closest.x - b.x);
        const curAngle = Math.atan2(b.vy, b.vx);
        let diff = tAngle - curAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.min(Math.abs(diff), 0.08) * Math.sign(diff);
        const newAngle = curAngle + turn;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = Math.cos(newAngle) * spd;
        b.vy = Math.sin(newAngle) * spd;
      }
    }
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    if (b.life <= 0 || b.x < -50 || b.x > ARENA_W + 50 || b.y < -50 || b.y > ARENA_H + 50 || pointInObstacle(b.x, b.y)) {
      if (b.explosive && b.owner === 'player') {
        game.explosions.push({ x: b.x, y: b.y, radius: b.blastRadius, life: 15, maxLife: 15 });
        spawnExplodeEffect(game, b.x, b.y);
        spawnRandomEffect(game.spriteEffects, 'explosion', b.x, b.y,
          { size: 80, scale: 0.8, speed: 2 });
        game.screenShake = 4;
        game.screenShakeIntensity = 4;
        for (let j = game.enemies.length - 1; j >= 0; j--) {
          const e = game.enemies[j];
          if (e.dead) continue;
          const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
          if (dist < b.blastRadius) {
            applyDamage(game, e, Math.floor(b.damage * 0.6 * (1 - dist / b.blastRadius)));
          }
        }
        for (let k = 0; k < 12; k++) {
          const angle = Math.random() * Math.PI * 2;
          game.particles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle) * (2 + Math.random() * 3), vy: Math.sin(angle) * (2 + Math.random() * 3),
            life: 20, maxLife: 20,
            color: '#22c55e', size: 3 + Math.random() * 2,
          });
        }
      }
      game.bullets.splice(i, 1);
      continue;
    }
    if (b.owner === 'player' || b.fromAlly) {
      let hitSomething = false;
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        const e = game.enemies[j];
        if (e.dead) continue;
        if (b.hitTargets && b.hitTargets.includes(j)) continue;
        const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
        if (dist < e.size + b.size + 4) {
          applyDamage(game, e, b.damage);
          spawnRandomHitFx(game.spriteEffects, e.x, e.y,
            { size: 44, scale: 0.8, speed: 2, angle: Math.atan2(b.vy, b.vx) });
          if (p.lifesteal > 0) {
            const healAmt = Math.floor(b.damage * p.lifesteal);
            if (healAmt > 0) {
              p.hp = Math.min(p.hp + healAmt, p.maxHp);
            }
          }
          if (b.healAmount > 0) {
            p.hp = Math.min(p.hp + b.healAmount, p.maxHp);
            game.damageNumbers.push({ x: p.x, y: p.y - 20, value: `+${b.healAmount}`, color: '#22c55e', life: 40 });
          }
          if (b.poisonDmg > 0 && !e.dead) {
            e.poisonTimer = Math.max(e.poisonTimer || 0, 120);
            e.poisonDmgPerTick = b.poisonDmg;
          }
          if (b.explosive) {
            game.explosions.push({ x: b.x, y: b.y, radius: b.blastRadius, life: 15, maxLife: 15 });
            spawnRandomEffect(game.spriteEffects, 'explosion', b.x, b.y,
              { size: 80, scale: 0.8, speed: 2 });
            for (let jj = game.enemies.length - 1; jj >= 0; jj--) {
              if (jj === j || game.enemies[jj].dead) continue;
              const d2 = Math.sqrt((game.enemies[jj].x - b.x) ** 2 + (game.enemies[jj].y - b.y) ** 2);
              if (d2 < b.blastRadius) {
                applyDamage(game, game.enemies[jj], Math.floor(b.damage * 0.5 * (1 - d2 / b.blastRadius)));
              }
            }
          }
          if (b.piercing) {
            b.hitTargets.push(j);
            b.damage *= 0.7;
            if (b.piercesLeft !== undefined && b.piercesLeft < 999) {
              b.piercesLeft--;
              if (b.piercesLeft <= 0) hitSomething = true;
            }
          } else {
            hitSomething = true;
          }
          game.screenShake = 2;
          game.screenShakeIntensity = 3;
          break;
        }
      }
      if (hitSomething) game.bullets.splice(i, 1);
    }
  }

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    const et = ENEMY_TYPES[e.type];
    if (e.dead) {
      e.deathTimer++;
      e.frameTimer++;
      const deathFrames = et?.sprites?.death?.frames || 6;
      if (e.frameTimer >= 8) {
        e.frameTimer = 0;
        e.frame = Math.min(e.frame + 1, deathFrames - 1);
      }
      if (e.deathTimer > 60) game.enemies.splice(i, 1);
      continue;
    }

    if (e.hurtTimer > 0) e.hurtTimer--;
    if (e.attackTimer > 0) e.attackTimer--;
    if (e.stunTimer > 0) { e.stunTimer--; continue; }
    if (e.poisonTimer > 0) e.poisonTimer--;
    if (e.burnTimer > 0) e.burnTimer--;

    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const isRanged = et.ranged || false;
    const prefRange = et.preferredRange || 0;
    const fleeRange = et.fleeRange || 0;

    const hasLineOfSight = !isRanged || !lineHitsObstacle(e.x, e.y, p.x, p.y);

    if (isRanged && !e.stationary && dist < fleeRange) {
      const spd = e.speed * 1.2;
      const nx = e.x - (dx / dist) * spd;
      const ny = e.y - (dy / dist) * spd;
      const clampX = Math.max(20, Math.min(ARENA_W - 20, nx));
      const clampY = Math.max(20, Math.min(ARENA_H - 20, ny));
      if (!pointInObstacle(clampX, clampY)) { e.x = clampX; e.y = clampY; }
      else if (!pointInObstacle(clampX, e.y)) e.x = clampX;
      else if (!pointInObstacle(e.x, clampY)) e.y = clampY;
      e.anim = 'run';
      e.dir = getDirection(-dx, -dy);
    } else if (isRanged && !e.stationary && dist > e.attackRange) {
      const spd = e.speed;
      const nx = e.x + (dx / dist) * spd;
      const ny = e.y + (dy / dist) * spd;
      if (!pointInObstacle(nx, ny)) { e.x = nx; e.y = ny; }
      else if (!pointInObstacle(nx, e.y)) e.x = nx;
      else if (!pointInObstacle(e.x, ny)) e.y = ny;
      e.anim = 'run';
      e.dir = getDirection(dx, dy);
    } else if (isRanged && !e.stationary && dist < prefRange * 0.7 && dist > fleeRange) {
      const spd = e.speed * 0.6;
      const strafeAngle = Math.atan2(dy, dx) + (Math.sin(game.time * 0.02 + i) > 0 ? Math.PI / 2 : -Math.PI / 2);
      const nx = e.x + Math.cos(strafeAngle) * spd;
      const ny = e.y + Math.sin(strafeAngle) * spd;
      const clampX = Math.max(20, Math.min(ARENA_W - 20, nx));
      const clampY = Math.max(20, Math.min(ARENA_H - 20, ny));
      if (!pointInObstacle(clampX, clampY)) { e.x = clampX; e.y = clampY; }
      e.anim = 'run';
      e.dir = getDirection(dx, dy);
    } else if (!e.stationary && !isRanged && dist > e.attackRange) {
      const spd = e.speed;
      const nx = e.x + (dx / dist) * spd;
      const ny = e.y + (dy / dist) * spd;
      if (!pointInObstacle(nx, ny)) { e.x = nx; e.y = ny; }
      else {
        if (!pointInObstacle(nx, e.y)) e.x = nx;
        else if (!pointInObstacle(e.x, ny)) e.y = ny;
        else {
          e.x += (Math.random() - 0.5) * spd * 2;
          e.y += (Math.random() - 0.5) * spd * 2;
        }
      }
      e.anim = 'run';
      e.dir = getDirection(dx, dy);
    } else if (isRanged && !hasLineOfSight && dist <= e.attackRange && !e.stationary) {
      const strafeAngle = Math.atan2(dy, dx) + (Math.sin(game.time * 0.03 + i * 2) > 0 ? Math.PI / 2 : -Math.PI / 2);
      const nx = e.x + Math.cos(strafeAngle) * e.speed;
      const ny = e.y + Math.sin(strafeAngle) * e.speed;
      const clampX = Math.max(20, Math.min(ARENA_W - 20, nx));
      const clampY = Math.max(20, Math.min(ARENA_H - 20, ny));
      if (!pointInObstacle(clampX, clampY)) { e.x = clampX; e.y = clampY; }
      e.anim = 'run';
      e.dir = getDirection(dx, dy);
    } else if (dist <= e.attackRange && e.attackTimer <= 0 && (hasLineOfSight || !isRanged)) {
      e.anim = 'attack';
      e.attackTimer = e.attackCd;
      e.frame = 0;
      e.frameTimer = 0;
      e.dir = getDirection(dx, dy);

      if (isRanged) {
        if (et.aoeAttack) {
          game.enemyAoeIndicators.push({
            x: p.x + (Math.random() - 0.5) * 40,
            y: p.y + (Math.random() - 0.5) * 40,
            radius: (et.aoeRadius || 70) * (e.isBoss ? 1.5 : 1),
            delay: et.aoeDelay || 60,
            maxDelay: et.aoeDelay || 60,
            damage: Math.floor((et.aoeDamage || 20) * (1 + game.wave * 0.1) * (e.isBoss ? 2 : 1)),
            color: et.projectileColor || '#a855f7',
            sourceType: e.type,
          });
          for (let k = 0; k < 5; k++) {
            game.particles.push({
              x: e.x, y: e.y - 10,
              vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3,
              life: 20, maxLife: 20, color: et.projectileColor || '#a855f7', size: 3,
            });
          }
        } else {
          const angle = Math.atan2(dy, dx);
          const spread = e.isBoss ? 0.15 : 0;
          const count = e.isBoss ? 3 : 1;
          for (let s = 0; s < count; s++) {
            const sa = angle + (s - Math.floor(count / 2)) * spread;
            const epSpd = (et.projectileSpeed || 4) * 0.6;
            game.enemyBullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(sa) * epSpd,
              vy: Math.sin(sa) * epSpd,
              damage: Math.floor(e.damage * (1 - (p.damageReduction || 0))),
              color: et.projectileColor || '#ef4444',
              size: (et.projectileSize || 3) * (e.isBoss ? 1.5 : 1),
              life: 120,
              sourceType: e.type,
            });
          }
          game.particles.push({
            x: e.x + Math.cos(angle) * 15, y: e.y + Math.sin(angle) * 15,
            vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
            life: 10, maxLife: 10, color: et.projectileColor || '#ef4444', size: 4,
          });
        }
      } else {
        if (p.invuln <= 0) {
          let rawDmg = e.damage;
          rawDmg = Math.floor(rawDmg * (1 - (p.damageReduction || 0)) * (1 - (p.armorModeReduction || 0)));
          if (p.shield > 0) {
            const shieldAbsorb = Math.min(p.shield, rawDmg);
            p.shield -= shieldAbsorb;
            rawDmg -= shieldAbsorb;
            p.shieldRegenDelay = SHIELD_REGEN_DELAY;
            if (shieldAbsorb > 0) {
              addDamageNumber(game, p.x, p.y - 20, `-${shieldAbsorb}🛡`, '#06b6d4');
              for (let k = 0; k < 6; k++) {
                const angle = Math.random() * Math.PI * 2;
                game.particles.push({
                  x: p.x + Math.cos(angle) * 15, y: p.y + Math.sin(angle) * 15,
                  vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                  life: 15, maxLife: 15, color: '#22d3ee', size: 3,
                });
              }
            }
          }
          if (rawDmg > 0) {
            p.hp -= rawDmg;
            addDamageNumber(game, p.x, p.y, rawDmg, '#ef4444');
          }
          p.invuln = 20;
          game.screenShake = 5;
          game.screenShakeIntensity = e.isBoss ? 8 : 4;
          for (let k = 0; k < 5; k++) {
            game.particles.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              life: 15, maxLife: 15, color: '#ff4444', size: 4,
            });
          }
          if (p.hp <= 0) {
            p.hp = 0;
            p.dead = true;
            p.deathTimer = 0;
            p.anim = 'death';
            p.frame = 0;
          }
        }
      }
    } else {
      if (isRanged && !e.stationary) {
        e.anim = 'idle';
        e.dir = getDirection(dx, dy);
      } else if (e.anim === 'attack') {
        const atkFrames = et?.sprites?.attack?.frames || 5;
        if (e.frame >= atkFrames - 1) e.anim = 'idle';
      } else {
        e.anim = 'idle';
      }
    }

    e.frameTimer++;
    const espd = e.anim === 'attack' ? 5 : e.anim === 'run' ? 6 : 10;
    const eMaxFrames = et?.sprites?.[e.anim]?.frames || 4;
    if (e.frameTimer >= espd) {
      e.frameTimer = 0;
      if (e.anim === 'attack') {
        e.frame = Math.min(e.frame + 1, eMaxFrames - 1);
      } else {
        e.frame = (e.frame + 1) % eMaxFrames;
      }
    }
  }

  for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
    const eb = game.enemyBullets[i];
    eb.x += eb.vx;
    eb.y += eb.vy;
    eb.life--;
    if (eb.life <= 0 || eb.x < -50 || eb.x > ARENA_W + 50 || eb.y < -50 || eb.y > ARENA_H + 50) {
      game.enemyBullets.splice(i, 1);
      continue;
    }
    if (pointInObstacle(eb.x, eb.y)) {
      game.particles.push({
        x: eb.x, y: eb.y, vx: 0, vy: 0,
        life: 10, maxLife: 10, color: eb.color, size: 3,
      });
      game.enemyBullets.splice(i, 1);
      continue;
    }
    const bDist = Math.sqrt((eb.x - p.x) ** 2 + (eb.y - p.y) ** 2);
    if (bDist < 18 && p.invuln <= 0 && !p.dead) {
      let rawDmg = Math.floor(eb.damage * (1 - (p.armorModeReduction || 0)));
      if (p.shield > 0) {
        const shieldAbsorb = Math.min(p.shield, rawDmg);
        p.shield -= shieldAbsorb;
        rawDmg -= shieldAbsorb;
        p.shieldRegenDelay = SHIELD_REGEN_DELAY;
        if (shieldAbsorb > 0) {
          addDamageNumber(game, p.x, p.y - 20, `-${shieldAbsorb}🛡`, '#06b6d4');
        }
      }
      if (rawDmg > 0) {
        p.hp -= rawDmg;
        addDamageNumber(game, p.x, p.y, rawDmg, '#ef4444');
      }
      p.invuln = 15;
      game.screenShake = 3;
      game.screenShakeIntensity = 3;
      for (let k = 0; k < 4; k++) {
        game.particles.push({
          x: p.x, y: p.y,
          vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
          life: 12, maxLife: 12, color: eb.color, size: 3,
        });
      }
      if (p.hp <= 0) {
        p.hp = 0; p.dead = true; p.deathTimer = 0; p.anim = 'death'; p.frame = 0;
      }
      game.enemyBullets.splice(i, 1);
    }
  }

  for (let i = game.enemyAoeIndicators.length - 1; i >= 0; i--) {
    const aoe = game.enemyAoeIndicators[i];
    aoe.delay--;
    if (aoe.delay <= 0) {
      game.explosions.push({
        x: aoe.x, y: aoe.y, radius: aoe.radius,
        life: 20, maxLife: 20, color: aoe.color,
      });
      spawnRandomEffect(game.spriteEffects, 'explosion', aoe.x, aoe.y,
        { size: 96, scale: 1.0, speed: 2 });
      game.screenShake = 4;
      game.screenShakeIntensity = 5;
      const dist = Math.sqrt((aoe.x - p.x) ** 2 + (aoe.y - p.y) ** 2);
      if (dist < aoe.radius && p.invuln <= 0 && !p.dead) {
        let rawDmg = Math.floor(aoe.damage * (1 - dist / aoe.radius));
        if (p.shield > 0) {
          const sa = Math.min(p.shield, rawDmg);
          p.shield -= sa;
          rawDmg -= sa;
          p.shieldRegenDelay = SHIELD_REGEN_DELAY;
          if (sa > 0) addDamageNumber(game, p.x, p.y - 20, `-${sa}🛡`, '#06b6d4');
        }
        if (rawDmg > 0) {
          p.hp -= rawDmg;
          addDamageNumber(game, p.x, p.y, rawDmg, '#ef4444');
        }
        p.invuln = 20;
        if (p.hp <= 0) {
          p.hp = 0; p.dead = true; p.deathTimer = 0; p.anim = 'death'; p.frame = 0;
        }
      }
      for (let k = 0; k < 15; k++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * aoe.radius * 0.8;
        game.particles.push({
          x: aoe.x + Math.cos(angle) * r, y: aoe.y + Math.sin(angle) * r,
          vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2 - 1,
          life: 25, maxLife: 25, color: aoe.color, size: 3 + Math.random() * 3,
        });
      }
      game.enemyAoeIndicators.splice(i, 1);
    }
  }

  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const pk = game.pickups[i];
    pk.life--;
    if (pk.life <= 0) { game.pickups.splice(i, 1); continue; }
    const dist = Math.sqrt((pk.x - p.x) ** 2 + (pk.y - p.y) ** 2);
    if (dist < 35) {
      if (pk.type === 'health') {
        const healed = Math.min(30, p.maxHp - p.hp);
        p.hp = Math.min(p.hp + 30, p.maxHp);
        if (healed > 0) addDamageNumber(game, p.x, p.y, `+${healed}`, '#22c55e');
      } else if (pk.type === 'shield') {
        const shieldGain = Math.min(25, p.maxShield - p.shield);
        p.shield = Math.min(p.shield + 25, p.maxShield);
        if (shieldGain > 0) addDamageNumber(game, p.x, p.y, `+${shieldGain} Shield`, '#06b6d4');
      } else if (pk.type === 'power') {
        p.damageMulti += 0.15;
        addDamageNumber(game, p.x, p.y, 'DMG UP', '#a855f7', true);
      } else if (pk.type === 'grenade') {
        p.grenadeCount = Math.min(p.grenadeCount + 2, 8);
        addDamageNumber(game, p.x, p.y, '+GRENADES', '#f97316', true);
      } else if (pk.type === 'weapon') {
        const locked = WEAPON_ORDER.filter(w => !p.weaponsUnlocked.includes(w));
        if (locked.length > 0) {
          const newWpn = locked[0];
          p.weaponsUnlocked.push(newWpn);
          p.weapon = newWpn;
          addAnnouncement(game, `${WEAPONS[newWpn].name.toUpperCase()} UNLOCKED!`, '#22d3ee', 120);
        } else {
          p.damageMulti += 0.2;
          addDamageNumber(game, p.x, p.y, 'DMG UP', '#a855f7', true);
        }
      }
      game.pickups.splice(i, 1);
      for (let k = 0; k < 10; k++) {
        game.particles.push({
          x: pk.x, y: pk.y,
          vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
          life: 20, maxLife: 20,
          color: pk.type === 'health' ? '#22c55e' : pk.type === 'shield' ? '#06b6d4' : pk.type === 'weapon' ? '#22d3ee' : pk.type === 'grenade' ? '#f97316' : '#a855f7',
          size: 3,
        });
      }
    }
  }

  for (let i = game.particles.length - 1; i >= 0; i--) {
    const pt = game.particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vx *= 0.95;
    pt.vy *= 0.95;
    pt.life--;
    if (pt.life <= 0) game.particles.splice(i, 1);
  }

  updateSpriteEffects(game.spriteEffects);

  if (game.magicEffects) {
    for (let i = game.magicEffects.length - 1; i >= 0; i--) {
      const me = game.magicEffects[i];
      me.frameTimer++;
      if (me.frameTimer >= 4) {
        me.frameTimer = 0;
        me.frame++;
      }
      me.life--;
      if (me.life <= 0 || me.frame >= me.effect.frames) {
        game.magicEffects.splice(i, 1);
      }
    }
  }

  for (let i = game.muzzleFlashes.length - 1; i >= 0; i--) {
    const m = game.muzzleFlashes[i];
    m.timer++;
    if (m.timer > 2) { m.frame++; m.timer = 0; }
    if (m.frame >= 5) game.muzzleFlashes.splice(i, 1);
  }

  for (let i = game.damageNumbers.length - 1; i >= 0; i--) {
    const dn = game.damageNumbers[i];
    dn.y += dn.vy;
    dn.life--;
    if (dn.life <= 0) game.damageNumbers.splice(i, 1);
  }

  for (let i = game.announcements.length - 1; i >= 0; i--) {
    game.announcements[i].life--;
    if (game.announcements[i].life <= 0) game.announcements.splice(i, 1);
  }

  updateAllies(game);

  if (!game.waveActive && game.enemies.filter(e => !e.dead).length === 0) {
    game.waveTimer++;
    if (game.waveTimer > 120) {
      if (game.wave > 0 && game.wave % 2 === 0) {
        game.upgradePhase = true;
        game.upgradeChoices = getUpgradeChoices(game.player);
        return;
      }
      startNextWave(game);
    }
  }

  if (game.waveActive && game.spawnQueue.length > 0) {
    game.spawnTimer++;
    if (game.spawnTimer >= 25) {
      game.spawnTimer = 0;
      const typeKey = game.spawnQueue.shift();
      const isBoss = game.bossActive && game.spawnQueue.length === 0;
      if (isBoss) {
        addAnnouncement(game, 'BOSS INCOMING!', '#ef4444', 150);
        game.screenShake = 10;
        game.screenShakeIntensity = 6;
      }
      const enemy = spawnEnemy(typeKey, game.wave, isBoss);
      if (enemy) game.enemies.push(enemy);
      if (game.spawnQueue.length === 0) {
        game.waveActive = false;
        game.bossActive = false;
      }
    }
  }
}

function startNextWave(game) {
  const p = game.player;
  game.wave++;
  game.waveActive = true;
  game.waveTimer = 0;
  const cfgIdx = Math.min(game.wave - 1, WAVE_CONFIG.length - 1);
  const cfg = WAVE_CONFIG[cfgIdx];
  let extraEnemies = [];
  if (game.wave > WAVE_CONFIG.length) {
    const extra = game.wave - WAVE_CONFIG.length;
    const types = Object.keys(ENEMY_TYPES);
    for (let i = 0; i < extra * 2 + 4; i++) {
      extraEnemies.push(types[Math.floor(Math.random() * types.length)]);
    }
  }
  game.spawnQueue = [...cfg.enemies, ...extraEnemies];
  game.spawnTimer = 0;
  game.bossActive = cfg.boss || (game.wave % 5 === 0 && game.wave > WAVE_CONFIG.length);

  if (game.wave % 3 === 0) {
    p.grenadeCount = Math.min(p.grenadeCount + 1, 8);
  }

  addAnnouncement(game, `WAVE ${game.wave}`, '#fbbf24', 90);

  if (game.wave > 1 && game.wave % 3 === 0) {
    const types = Object.keys(ALLY_TYPES);
    const pick = types[Math.floor(Math.random() * types.length)];
    spawnAlly(game, pick);
  }
}

function applyDamage(game, e, damage) {
  const p = game.player;
  e.hp -= damage;
  e.hurtTimer = 8;
  addDamageNumber(game, e.x, e.y - 10, Math.floor(damage), e.isBoss ? '#ff6b6b' : '#fbbf24', e.isBoss);
  for (let k = 0; k < 4; k++) {
    game.particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
      life: 20, maxLife: 20, color: '#ef4444', size: 3,
    });
  }
  if (e.hp <= 0) {
    e.dead = true;
    e.deathTimer = 0;
    e.anim = 'death';
    e.frame = 0;
    e.frameTimer = 0;
    p.kills++;
    const xpGain = Math.floor((ENEMY_TYPES[e.type]?.xp || 10) * (e.isBoss ? 5 : 1) * (p.xpMulti || 1));
    p.score += xpGain;
    p.xp += xpGain;
    game.totalKills++;

    spawnRandomEffect(game.spriteEffects, 'explosion', e.x, e.y,
      { size: e.isBoss ? 128 : 64, scale: e.isBoss ? 1.5 : 0.6, speed: 2 });
    if (Math.random() < 0.5) {
      spawnRandomEffect(game.spriteEffects, 'fire', e.x, e.y,
        { size: 48, scale: 0.5, speed: 3 });
    }

    const coinDrop = e.isBoss ? 50 + Math.floor(Math.random() * 30) : 3 + Math.floor(Math.random() * 5);
    p.coins = (p.coins || 0) + coinDrop;
    game.damageNumbers.push({ x: e.x, y: e.y - 30, value: `+${coinDrop}$`, color: '#fbbf24', life: 40 });

    p.comboKills++;
    p.comboTimer = COMBO_WINDOW;
    if (p.comboKills > p.bestCombo) p.bestCombo = p.comboKills;

    if (e.isBoss) {
      game.bossKills++;
      addAnnouncement(game, 'BOSS DEFEATED!', '#22d3ee', 120);
      game.screenShake = 12;
      game.screenShakeIntensity = 10;
      spawnRandomEffect(game.spriteEffects, 'magic', e.x, e.y,
        { size: 160, scale: 2.0, speed: 2 });
      spawnRandomEffect(game.spriteEffects, 'explosion', e.x, e.y,
        { size: 128, scale: 1.8, speed: 2 });
      for (let k = 0; k < 40; k++) {
        const angle = Math.random() * Math.PI * 2;
        game.particles.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * (3 + Math.random() * 5), vy: Math.sin(angle) * (3 + Math.random() * 5),
          life: 40 + Math.random() * 20, maxLife: 60,
          color: ['#fbbf24', '#22d3ee', '#a855f7', '#ef4444'][Math.floor(Math.random() * 4)],
          size: 4 + Math.random() * 4,
        });
      }
    }

    if (p.xp >= XP_PER_LEVEL * p.level) {
      p.xp -= XP_PER_LEVEL * p.level;
      const prevLevel = p.level;
      p.level++;
      p.maxHp += 10;
      p.hp = Math.min(p.hp + 30, p.maxHp);
      p.damageMulti += 0.05;
      p.speedMulti += 0.03;
      p.maxShield += 5;

      const tierChanged = p.level <= 9 && prevLevel !== p.level;
      const isTierUpgrade = (p.level === 4 || p.level === 7);

      if (isTierUpgrade) {
        addAnnouncement(game, `TIER ${p.level >= 7 ? 'III' : 'II'} ASCENSION!`, '#a855f7', 150);
        game.screenShake = 12;
        game.screenShakeIntensity = 8;
        for (let m = 0; m < 3; m++) {
          spawnMagicEffect(game, p.x, p.y, Math.floor(Math.random() * MAGIC_EFFECTS.length));
        }
        spawnRandomEffect(game.spriteEffects, 'magic', p.x, p.y, { size: 160, scale: 2.0, speed: 2 });
        for (let k = 0; k < 40; k++) {
          const angle = (k / 40) * Math.PI * 2;
          game.particles.push({
            x: p.x, y: p.y,
            vx: Math.cos(angle) * (4 + Math.random() * 4), vy: Math.sin(angle) * (4 + Math.random() * 4),
            life: 50, maxLife: 50, color: ['#a855f7', '#22d3ee', '#fbbf24', '#ec4899'][k % 4], size: 5 + Math.random() * 3,
          });
        }
      } else {
        addAnnouncement(game, `LEVEL ${p.level}!`, '#fbbf24', 90);
        if (tierChanged) {
          spawnMagicEffect(game, p.x, p.y, (p.level - 1) % MAGIC_EFFECTS.length);
        }
        for (let k = 0; k < 20; k++) {
          game.particles.push({
            x: p.x, y: p.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 30, maxLife: 30, color: '#fbbf24', size: 4 + Math.random() * 3,
          });
        }
      }
    }

    const dropRoll = Math.random();
    if (e.isBoss) {
      game.pickups.push({ x: e.x - 20, y: e.y, type: 'health', life: 900 });
      game.pickups.push({ x: e.x + 20, y: e.y, type: 'weapon', life: 900 });
      game.pickups.push({ x: e.x, y: e.y - 20, type: 'grenade', life: 900 });
      game.pickups.push({ x: e.x, y: e.y + 20, type: 'shield', life: 900 });
    } else if (dropRoll < 0.06) {
      game.pickups.push({ x: e.x, y: e.y, type: 'weapon', life: 600 });
    } else if (dropRoll < 0.14) {
      game.pickups.push({ x: e.x, y: e.y, type: 'health', life: 600 });
    } else if (dropRoll < 0.19) {
      game.pickups.push({ x: e.x, y: e.y, type: 'grenade', life: 600 });
    } else if (dropRoll < 0.24) {
      game.pickups.push({ x: e.x, y: e.y, type: 'power', life: 600 });
    } else if (dropRoll < 0.30) {
      game.pickups.push({ x: e.x, y: e.y, type: 'shield', life: 600 });
    }
  }
}

function renderGame(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  if (game.screenShake > 0) {
    const intensity = game.screenShakeIntensity * (game.screenShake / 10);
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }

  drawGroundTile(ctx, game.camX, game.camY);

  ctx.save();
  ctx.translate(-game.camX, -game.camY);

  ctx.strokeStyle = 'rgba(255,100,100,0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

  OBSTACLES.forEach(o => {
    ctx.fillStyle = `rgb(${o.shade}, ${o.shade + 2}, ${o.shade})`;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = `rgb(${o.shade + 6}, ${o.shade + 8}, ${o.shade + 4})`;
    ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(o.x + o.w, o.y + 4, 4, o.h);
    ctx.fillRect(o.x + 4, o.y + o.h, o.w, 4);
  });

  game.aoeZones.forEach(zone => {
    const t = zone.life / zone.maxLife;
    ctx.save();
    ctx.globalAlpha = t * 0.4;
    if (zone.type === 'poison') {
      const grad = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
      grad.addColorStop(0, 'rgba(34,197,94,0.6)');
      grad.addColorStop(0.5, 'rgba(22,163,74,0.3)');
      grad.addColorStop(1, 'rgba(34,197,94,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = t * 0.3;
      for (let i = 0; i < 8; i++) {
        const bx = zone.x + Math.cos(game.time * 0.03 + i * 0.8) * zone.radius * 0.6;
        const by = zone.y + Math.sin(game.time * 0.04 + i * 0.8) * zone.radius * 0.6;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(bx, by, 4 + Math.sin(game.time * 0.1 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (zone.type === 'fire') {
      const innerR = zone.radius * 0.6;
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = zone.radius - innerR;
      ctx.globalAlpha = t * 0.5;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, (innerR + zone.radius) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = t * 0.3;
      for (let i = 0; i < 12; i++) {
        const fa = (i / 12) * Math.PI * 2 + game.time * 0.05;
        const fr = (innerR + zone.radius) / 2 + Math.sin(game.time * 0.1 + i) * 5;
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.arc(zone.x + Math.cos(fa) * fr, zone.y + Math.sin(fa) * fr, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });

  game.explosions.forEach(ex => {
    const t = ex.life / ex.maxLife;
    ctx.save();
    ctx.globalAlpha = t * 0.6;
    const baseColor = ex.color || null;
    const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.radius * (1 - t * 0.3));
    if (baseColor === '#22d3ee') {
      grad.addColorStop(0, 'rgba(34,211,238,0.8)');
      grad.addColorStop(0.4, 'rgba(6,182,212,0.5)');
      grad.addColorStop(1, 'rgba(34,211,238,0)');
    } else {
      grad.addColorStop(0, 'rgba(255,200,50,0.8)');
      grad.addColorStop(0.4, 'rgba(255,100,20,0.5)');
      grad.addColorStop(1, 'rgba(255,50,0,0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius * (1 - t * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  game.pickups.forEach(pk => {
    const pulse = Math.sin(game.time * 0.1) * 0.3 + 0.7;
    const bob = Math.sin(game.time * 0.08 + pk.x) * 3;
    ctx.save();
    ctx.globalAlpha = pulse * (pk.life < 60 ? pk.life / 60 : 1);
    const spritePath = PICKUP_SPRITES[pk.type];
    const colors = { health: '#22c55e', shield: '#06b6d4', power: '#a855f7', grenade: '#f97316', weapon: '#fbbf24' };
    if (spritePath) {
      const pkImg = loadImg(spritePath);
      if (pkImg && pkImg.complete && pkImg.naturalWidth) {
        ctx.shadowColor = colors[pk.type] || '#fff';
        ctx.shadowBlur = 12;
        const sz = 28;
        ctx.drawImage(pkImg, pk.x - sz / 2, pk.y - sz / 2 + bob, sz, sz);
        ctx.restore();
        return;
      }
    }
    const icons = { health: '+', shield: 'S', power: '*', grenade: 'G', weapon: 'W' };
    ctx.fillStyle = colors[pk.type] || '#fff';
    ctx.shadowColor = colors[pk.type] || '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, pk.type === 'weapon' ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(icons[pk.type] || '+', pk.x, pk.y + bob + 4);
    ctx.restore();
  });

  const allUnits = [
    ...game.enemies.map((e, idx) => ({ ...e, isEnemy: true, _idx: idx })),
    { ...game.player, isEnemy: false },
  ];
  allUnits.sort((a, b) => a.y - b.y);

  allUnits.forEach(unit => {
    if (unit.isEnemy) {
      const et = ENEMY_TYPES[unit.type];
      if (!et) return;
      ctx.save();
      if (unit.dead) ctx.globalAlpha = Math.max(0, 1 - unit.deathTimer / 60);

      const spriteInfo = et.sprites[unit.anim] || et.sprites.idle;
      const scale = (et.frameSize === 128 ? 1.5 : 1.5) * (unit.bossScale || 1);
      let spriteDrawn = false;
      if (et.directionalSprites && spriteInfo.dirs) {
        const drawSz = et.frameSize * scale;
        spriteDrawn = drawDirectionalSprite(ctx, spriteInfo.dirs, spriteInfo.frames, unit.dir, unit.frame, unit.x, unit.y, drawSz);
      } else {
        const img = loadImg(spriteInfo.path);
        spriteDrawn = drawSprite(ctx, img, et.frameSize, unit.dir, unit.frame, unit.x, unit.y, scale);
      }

      if (!spriteDrawn) {
        drawProceduralEnemy(ctx, unit, et, game.time);
      }

      ctx.filter = 'none';
      ctx.globalAlpha = 1;

      if (!unit.dead) {
        const barW = unit.isBoss ? 60 : 30;
        const barH = unit.isBoss ? 5 : 3;
        const bx = unit.x - barW / 2;
        const by = unit.y - unit.size - 12;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
        ctx.fillStyle = unit.hp / unit.maxHp > 0.5 ? '#22c55e' : unit.hp / unit.maxHp > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(bx, by, barW * (unit.hp / unit.maxHp), barH);
        if (unit.isBoss) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BOSS', unit.x, by - 4);
        }

        if (unit.stunTimer > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('STUNNED', unit.x, by - (unit.isBoss ? 12 : 8));
        }

        if (unit.poisonTimer > 0) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(unit.x + unit.size * 0.5, unit.y - unit.size, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (unit.burnTimer > 0) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(unit.x - unit.size * 0.5, unit.y - unit.size, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else {
      const p = game.player;
      ctx.save();
      if (p.invuln > 0 && Math.floor(game.time / 3) % 2 === 0) ctx.globalAlpha = 0.4;
      if (p.dead) ctx.globalAlpha = Math.max(0, 1 - p.deathTimer / 60);

      if (p.armorModeTimer > 0) {
        ctx.save();
        const armorPulse = 0.3 + Math.sin(game.time * 0.12) * 0.15;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.globalAlpha = armorPulse + (p.armorModeTimer / AOE_ABILITIES.armorMode.duration) * 0.4;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = armorPulse * 0.3;
        ctx.fillStyle = 'rgba(245,158,11,0.12)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        if (p.invuln > 0 && Math.floor(game.time / 3) % 2 === 0) ctx.globalAlpha = 0.4;
      }

      if (p.shield > 0) {
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + (p.shield / p.maxShield) * 0.4;
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2 * (p.shield / p.maxShield));
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        if (p.invuln > 0 && Math.floor(game.time / 3) % 2 === 0) ctx.globalAlpha = 0.4;
      }

      const curPlayerSprites = getPlayerSprites(p.level);
      const spriteInfo = curPlayerSprites[p.anim] || curPlayerSprites.idle;
      const img = loadImg(spriteInfo.path);
      const spriteDrawn = drawSprite(ctx, img, PLAYER_FRAME_SIZE, p.dir, p.frame, p.x, p.y, 1.5);

      if (!spriteDrawn) {
        drawProceduralPlayer(ctx, p, game.time);
      }

      {
        ctx.save();
        ctx.translate(p.x, p.y);
        const worldMouseX = game.mouseX + game.camX;
        const worldMouseY = game.mouseY + game.camY;
        const gunAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
        ctx.rotate(gunAngle);
        if (p.gunConfig) {
          const barrelImg = loadImg(getGunPartPath('barrel', p.gunConfig.barrel || 1));
          const stockImg = loadImg(getGunPartPath('stock', p.gunConfig.stock || 1));
          const sightImg = loadImg(getGunPartPath('sight', p.gunConfig.sight || 1));
          const drawGunPart = (partImg, ox, oy, sc, variant) => {
            if (partImg && partImg.complete && partImg.naturalWidth) {
              ctx.save();
              const cf = variant ? getColorFilter(variant) : 'none';
              if (cf !== 'none') ctx.filter = cf;
              ctx.drawImage(partImg, ox, oy, partImg.naturalWidth * sc, partImg.naturalHeight * sc);
              ctx.restore();
            }
          };
          const sc = 1.5;
          drawGunPart(stockImg, 1, -2, sc, p.gunConfig.stock);
          drawGunPart(barrelImg, 8, -2, sc, p.gunConfig.barrel);
          drawGunPart(sightImg, 6, -5, sc, p.gunConfig.sight);
          if (p.gunConfig.bayonet && p.gunConfig.bayonet > 0) {
            const bayImg = loadImg(getGunPartPath('bayonet', p.gunConfig.bayonet));
            drawGunPart(bayImg, 18, -2, sc * 0.7, p.gunConfig.bayonet);
          }
        } else {
          const ws = HERO_WEAPON_SPRITES[p.weapon];
          if (ws) {
            const wImg = loadImg(ws.held);
            if (wImg && wImg.complete && wImg.naturalWidth) {
              ctx.drawImage(wImg, 2, -8, 16, 16);
            }
          }
        }
        ctx.restore();
      }

      ctx.restore();
    }
  });

  game.allies.forEach(ally => {
    if (!ally.alive) return;
    const at = ALLY_TYPES[ally.type];
    if (!at) return;
    ctx.save();
    const pulse = 0.8 + Math.sin(game.time * 0.08 + ally.orbitAngle) * 0.2;
    ctx.globalAlpha = pulse;

    if (at.behavior === 'orbit') {
      ctx.translate(ally.x, ally.y);
      ctx.rotate(ally.angle);
      ctx.fillStyle = at.color;
      ctx.shadowColor = at.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(at.size * 0.7, 0);
      ctx.lineTo(-at.size * 0.5, -at.size * 0.4);
      ctx.lineTo(-at.size * 0.3, 0);
      ctx.lineTo(-at.size * 0.5, at.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(at.size * 0.2, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (at.behavior === 'stationary') {
      ctx.translate(ally.x, ally.y);
      ctx.fillStyle = 'rgba(245,158,11,0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, at.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = at.color;
      ctx.shadowColor = at.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(-at.size / 2, -at.size / 2, at.size, at.size);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(-at.size / 2 + 3, -at.size / 2 + 3, at.size - 6, at.size - 6);
      ctx.save();
      ctx.rotate(ally.angle);
      ctx.fillStyle = at.color;
      ctx.fillRect(0, -2, at.size, 4);
      ctx.restore();
    } else {
      ctx.translate(ally.x, ally.y);
      ctx.fillStyle = at.color;
      ctx.shadowColor = at.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, at.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+', 0, 4);
    }
    ctx.restore();

    const hpPct = ally.hp / ally.maxHp;
    if (hpPct < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(ally.x - 10, ally.y - at.size - 4, 20, 3);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
      ctx.fillRect(ally.x - 10, ally.y - at.size - 4, 20 * hpPct, 3);
    }
  });

  game.bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = b.color || '#fbbf24';
    ctx.shadowColor = b.color || '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size || 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(b.x - b.vx * 2, b.y - b.vy * 2, (b.size || 4) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    if (b.isCrit) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, (b.size || 4) + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });

  game.enemyBullets.forEach(eb => {
    ctx.save();
    ctx.fillStyle = eb.color || '#ef4444';
    ctx.shadowColor = eb.color || '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.size || 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(eb.x - eb.vx * 1.5, eb.y - eb.vy * 1.5, (eb.size || 3) * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(eb.x - eb.vx * 3, eb.y - eb.vy * 3, (eb.size || 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  game.enemyAoeIndicators.forEach(aoe => {
    const progress = 1 - (aoe.delay / aoe.maxDelay);
    const pulse = Math.sin(game.time * 0.15) * 0.15 + 0.85;
    ctx.save();

    ctx.globalAlpha = 0.12 + progress * 0.25;
    const fillGrad = ctx.createRadialGradient(aoe.x, aoe.y, 0, aoe.x, aoe.y, aoe.radius);
    fillGrad.addColorStop(0, aoe.color + 'aa');
    fillGrad.addColorStop(0.6, aoe.color + '44');
    fillGrad.addColorStop(1, aoe.color + '00');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.arc(aoe.x, aoe.y, aoe.radius * progress * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3 + progress * 0.5;
    ctx.strokeStyle = aoe.color;
    ctx.lineWidth = 2 + progress * 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (progress > 0.5) {
      ctx.globalAlpha = (progress - 0.5) * 2 * pulse;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(aoe.x, aoe.y, aoe.radius * 0.3 * progress, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (progress > 0.7) {
      ctx.globalAlpha = (progress - 0.7) * 3;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', aoe.x, aoe.y - aoe.radius - 8);
    }

    ctx.restore();
  });

  game.grenades.forEach(g => {
    if (g.cx === undefined) return;
    ctx.save();
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  game.particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (pt.life / pt.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  renderSpriteEffects(ctx, game.spriteEffects, 0, 0);

  if (game.magicEffects) {
    game.magicEffects.forEach(me => {
      const img = loadImg(me.effect.path);
      if (img && img.complete && img.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, me.life / 10);
        const fs = me.effect.frameSize;
        const sx = me.frame * fs;
        const drawSize = me.size;
        ctx.drawImage(img, sx, 0, fs, fs, me.x - drawSize / 2, me.y - drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }
    });
  }

  if (game.shotEffects) {
    for (let i = game.shotEffects.length - 1; i >= 0; i--) {
      const se = game.shotEffects[i];
      se.timer++;
      if (se.timer >= 3) { se.timer = 0; se.frame++; }
      se.life--;
      if (se.life <= 0 || se.frame >= se.frames) { game.shotEffects.splice(i, 1); continue; }
      const sfImg = loadImg(`${se.path}${se.frame + 1}.png`);
      if (sfImg && sfImg.complete && sfImg.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, se.life / 4);
        const sz = se.size * 3;
        ctx.drawImage(sfImg, se.x - sz / 2, se.y - sz / 2, sz, sz);
        ctx.restore();
      }
    }
  }

  game.muzzleFlashes.forEach(m => {
    const mImg = getMuzzleFrame(m.type, m.frame);
    if (mImg) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(mImg, -20, -20, 40, 40);
      ctx.restore();
    }
  });

  game.damageNumbers.forEach(dn => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, dn.life / 15);
    ctx.fillStyle = dn.color;
    ctx.font = dn.large ? 'bold 18px "Cinzel", serif' : 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(dn.value, dn.x, dn.y);
    ctx.fillText(dn.value, dn.x, dn.y);
    ctx.restore();
  });

  if (game.swordSlash) {
    const ss = game.swordSlash;
    const t = ss.life / ss.maxLife;
    ctx.save();
    ctx.globalAlpha = t * 0.7;
    const sweepStart = ss.angle - Math.PI * 0.6;
    const sweepEnd = ss.angle + Math.PI * 0.6;
    const sweepProgress = 1 - t;
    const curSweep = sweepStart + (sweepEnd - sweepStart) * sweepProgress;
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4 + t * 4;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, ss.radius * (0.4 + sweepProgress * 0.6), sweepStart, curSweep);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = t * 0.5;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, ss.radius * 0.5, sweepStart, curSweep);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();

  if (game.player.superFlashTimer > 0) {
    ctx.save();
    const ft = game.player.superFlashTimer / 20;
    ctx.globalAlpha = ft * 0.8;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }

  if (!game.player.dead) {
    ctx.save();
    const wpn = WEAPONS[game.player.weapon];
    ctx.strokeStyle = wpn ? `${wpn.color}80` : 'rgba(34,211,238,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const cx = game.mouseX;
    const cy = game.mouseY;
    ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    if (wpn && wpn.spread > 0) {
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + wpn.spread * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (let i = game.announcements.length - 1; i >= 0; i--) {
    const ann = game.announcements[i];
    ctx.save();
    const t = ann.life / ann.maxLife;
    ctx.globalAlpha = t;
    ctx.fillStyle = ann.color;
    ctx.font = 'bold 28px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    const ay = CANVAS_H / 2 - 80 - (1 - t) * 30 + i * 40;
    ctx.strokeText(ann.text, CANVAS_W / 2, ay);
    ctx.fillText(ann.text, CANVAS_W / 2, ay);
    ctx.restore();
  }

  drawHUD(ctx, game);
  drawMinimap(ctx, game);

  ctx.restore();
}

function drawMinimap(ctx, game) {
  const mmW = 120, mmH = 80;
  const mx = CANVAS_W - mmW - 12, my = CANVAS_H - mmH - 12;
  const sx = mmW / ARENA_W, sy = mmH / ARENA_H;

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mx - 1, my - 1, mmW + 2, mmH + 2);
  ctx.strokeStyle = 'rgba(34,211,238,0.3)';
  ctx.strokeRect(mx - 1, my - 1, mmW + 2, mmH + 2);

  OBSTACLES.forEach(o => {
    ctx.fillStyle = 'rgba(80,80,80,0.6)';
    ctx.fillRect(mx + o.x * sx, my + o.y * sy, Math.max(2, o.w * sx), Math.max(2, o.h * sy));
  });

  game.aoeZones.forEach(zone => {
    ctx.fillStyle = zone.type === 'poison' ? 'rgba(34,197,94,0.4)' : 'rgba(249,115,22,0.4)';
    ctx.beginPath();
    ctx.arc(mx + zone.x * sx, my + zone.y * sy, Math.max(2, zone.radius * sx), 0, Math.PI * 2);
    ctx.fill();
  });

  game.enemies.forEach(e => {
    if (e.dead) return;
    const et = ENEMY_TYPES[e.type];
    ctx.fillStyle = e.isBoss ? '#ef4444' : (et?.ranged ? '#fbbf24' : '#ff6b6b');
    const dotSize = e.isBoss ? 3 : 1.5;
    ctx.fillRect(mx + e.x * sx - dotSize / 2, my + e.y * sy - dotSize / 2, dotSize, dotSize);
  });

  game.enemyAoeIndicators.forEach(aoe => {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = aoe.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(mx + aoe.x * sx, my + aoe.y * sy, aoe.radius * sx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  game.pickups.forEach(pk => {
    const colors = { health: '#22c55e', shield: '#06b6d4', power: '#a855f7', weapon: '#fbbf24', grenade: '#f97316' };
    ctx.fillStyle = colors[pk.type] || '#fff';
    ctx.fillRect(mx + pk.x * sx - 1, my + pk.y * sy - 1, 2, 2);
  });

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(mx + game.player.x * sx - 2, my + game.player.y * sy - 2, 4, 4);

  const vx = game.camX * sx, vy = game.camY * sy;
  const vw = CANVAS_W * sx, vh = CANVAS_H * sy;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(mx + vx, my + vy, vw, vh);

  ctx.restore();
}

function drawHUD(ctx, game) {
  const p = game.player;
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(10, 10, 220, 125);
  ctx.strokeStyle = 'rgba(34,211,238,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 220, 125);

  ctx.fillStyle = 'rgba(60,0,0,0.8)';
  ctx.fillRect(20, 20, 200, 14);
  const hpPct = p.hp / p.maxHp;
  const hpGrad = ctx.createLinearGradient(20, 0, 220, 0);
  if (hpPct > 0.5) { hpGrad.addColorStop(0, '#22c55e'); hpGrad.addColorStop(1, '#16a34a'); }
  else if (hpPct > 0.25) { hpGrad.addColorStop(0, '#f59e0b'); hpGrad.addColorStop(1, '#d97706'); }
  else { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(1, '#dc2626'); }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(20, 20, 200 * hpPct, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxHp}`, 120, 31);

  if (p.maxShield > 0) {
    ctx.fillStyle = 'rgba(0,40,60,0.8)';
    ctx.fillRect(20, 36, 200, 8);
    const shieldPct = p.shield / p.maxShield;
    const shieldGrad = ctx.createLinearGradient(20, 0, 220, 0);
    shieldGrad.addColorStop(0, '#22d3ee');
    shieldGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = shieldGrad;
    ctx.fillRect(20, 36, 200 * shieldPct, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SHIELD ${Math.ceil(p.shield)}/${p.maxShield}`, 120, 43);
  }

  ctx.fillStyle = 'rgba(0,0,60,0.8)';
  ctx.fillRect(20, 48, 200, 8);
  const xpPct = p.xp / (XP_PER_LEVEL * p.level);
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(20, 48, 200 * xpPct, 8);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px monospace';
  const tierLabel = p.level >= 7 ? 'III' : p.level >= 4 ? 'II' : 'I';
  ctx.fillText(`LVL ${p.level} [T${tierLabel}]`, 20, 70);
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(`SCORE: ${p.score}`, 120, 70);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`COINS: ${p.coins || 0}`, 230, 20);

  if (p.gunConfig) {
    const gunStats = getGunStats(p.gunConfig);
    const shotInfo = gunStats ? SHOT_TYPES[gunStats.shotType] : null;
    ctx.fillStyle = shotInfo?.color || '#8b5cf6';
    ctx.font = '8px monospace';
    ctx.fillText(`GUN ${p.activeGun + 1} [${shotInfo?.name || 'Custom'}]`, 120, 80);

    ctx.fillStyle = '#334155';
    for (let s = 0; s < 2; s++) {
      const sx = 20 + s * 50, sy = 90;
      ctx.fillRect(sx, sy, 44, 14);
      ctx.strokeStyle = p.activeGun === s ? '#22d3ee' : '#475569';
      ctx.lineWidth = p.activeGun === s ? 2 : 1;
      ctx.strokeRect(sx, sy, 44, 14);
      ctx.fillStyle = p.guns[s] ? '#e2e8f0' : '#475569';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.guns[s] ? `GUN ${s + 1}` : 'EMPTY', sx + 22, sy + 10);
    }
    ctx.textAlign = 'left';
  }

  const wpn = WEAPONS[p.weapon];
  const wpnSprite = HERO_WEAPON_SPRITES[p.weapon];
  if (wpnSprite && !p.gunConfig) {
    const wIcon = loadImg(wpnSprite.icon);
    if (wIcon && wIcon.complete && wIcon.naturalWidth) {
      ctx.drawImage(wIcon, 20, 76, 32, 18);
      ctx.fillStyle = wpn.color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${wpn.name}`, 56, 88);
    } else {
      ctx.fillStyle = wpn.color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`[${wpn.name}]`, 20, 84);
    }
  } else {
    ctx.fillStyle = wpn.color;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`[${wpn.name}]`, 20, 84);
  }
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText(wpn.desc, 20, 100);

  if (p.weaponsUnlocked.length > 1) {
    ctx.fillStyle = '#475569';
    ctx.font = '8px monospace';
    ctx.fillText('1-5: Switch weapons', 20, 112);
  }

  if (p.upgrades.length > 0) {
    ctx.fillStyle = '#475569';
    ctx.font = '8px monospace';
    ctx.fillText(`Upgrades: ${p.upgrades.length}`, 20, 122);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px "Cinzel", serif';
  ctx.fillText(`WAVE ${game.wave}`, CANVAS_W - 140, 28);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText(`Enemies: ${game.enemies.filter(e => !e.dead).length}`, CANVAS_W - 140, 46);
  ctx.fillText(`Kills: ${game.totalKills}`, CANVAS_W - 140, 60);
  if (p.bestCombo >= 2) {
    ctx.fillStyle = '#f97316';
    ctx.fillText(`Best Combo: ${p.bestCombo}x`, CANVAS_W - 140, 74);
  }

  let barY = 126;
  if (p.dashCd > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, barY, 80, 14);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(10, barY, 80 * (1 - p.dashCd / Math.floor(DASH_COOLDOWN * p.dashCdMulti)), 14);
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DASH', 50, barY + 11);
  } else {
    ctx.fillStyle = '#06b6d4';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[SPACE] DASH', 12, barY + 11);
  }

  barY += 16;
  ctx.textAlign = 'left';
  if (p.grenadeCount > 0) {
    ctx.fillStyle = p.grenadeCd > 0 ? '#64748b' : '#f97316';
    ctx.font = '9px monospace';
    ctx.fillText(`[RMB] GRENADE x${p.grenadeCount}`, 12, barY + 11);
    if (p.grenadeCd > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, barY, 80, 12);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(10, barY, 80 * (1 - p.grenadeCd / GRENADE_COOLDOWN), 12);
    }
  }

  barY += 16;
  if (p.armorModeTimer > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, barY, 80, 14);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(10, barY, 80 * (p.armorModeTimer / AOE_ABILITIES.armorMode.duration), 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARMOR', 50, barY + 11);
    barY += 16;
  }

  const abilityKeys = [
    { key: 'shockwave', label: 'E', color: '#22d3ee' },
    { key: 'poisonCloud', label: 'F', color: '#22c55e' },
    { key: 'fireRing', label: 'R', color: '#f97316' },
    { key: 'teleport', label: 'X', color: '#c084fc' },
    { key: 'swordMode', label: 'C', color: '#ec4899' },
    { key: 'armorMode', label: 'V', color: '#f59e0b' },
    { key: 'superFlash', label: 'Z', color: '#fef08a' },
  ];
  for (const ab of abilityKeys) {
    if (!p.abilities[ab.key]) continue;
    const cd = p.abilityCooldowns[ab.key];
    const maxCd = Math.floor(AOE_ABILITIES[ab.key].cooldown * p.abilityCdMulti);
    if (cd > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, barY, 80, 12);
      ctx.fillStyle = ab.color;
      ctx.fillRect(10, barY, 80 * (1 - cd / maxCd), 12);
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`[${ab.label}] ${AOE_ABILITIES[ab.key].name}`, 50, barY + 9);
    } else {
      ctx.fillStyle = ab.color;
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${ab.label}] ${AOE_ABILITIES[ab.key].name}`, 12, barY + 10);
    }
    barY += 14;
  }

  if (p.comboKills >= 2) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.fillText(`${p.comboKills}x COMBO`, CANVAS_W / 2, 30);
  }

  if (!game.waveActive && game.enemies.filter(e => !e.dead).length === 0 && !game.gameOver && game.started && !game.upgradePhase) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px "Cinzel", serif';
    const nextWave = game.wave + 1;
    const countdown = Math.ceil((120 - game.waveTimer) / 60);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeText(`WAVE ${nextWave} IN ${countdown}...`, CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.fillText(`WAVE ${nextWave} IN ${countdown}...`, CANVAS_W / 2, CANVAS_H / 2 - 20);
    if (game.wave > 0) {
      ctx.fillStyle = '#22d3ee';
      ctx.font = '14px monospace';
      ctx.fillText(`Wave ${game.wave} Complete!`, CANVAS_W / 2, CANVAS_H / 2 + 10);
    }
  }

  ctx.restore();
}

function UpgradeCardUI({ choices, onSelect }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(5,10,24,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 10, fontFamily: "'Jost', sans-serif",
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
        color: '#fbbf24', marginBottom: 8, letterSpacing: 3,
        textShadow: '0 0 20px rgba(251,191,36,0.4)',
      }}>
        CHOOSE AN UPGRADE
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 24 }}>
        Select one card to enhance your abilities
      </div>
      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 700, padding: '0 16px',
      }}>
        {choices.map((card, i) => (
          <button
            key={card.id + i}
            onClick={() => onSelect(card)}
            style={{
              width: 190, minHeight: 220,
              background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%)`,
              border: `2px solid ${card.color}40`,
              borderRadius: 14,
              padding: '20px 16px',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8,
              transition: 'all 0.25s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = `2px solid ${card.color}`;
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
              e.currentTarget.style.boxShadow = `0 8px 30px ${card.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = `2px solid ${card.color}40`;
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
            }} />
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>{card.icon}</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: '0.95rem', fontWeight: 700,
              color: card.color, textAlign: 'center', lineHeight: 1.2,
            }}>{card.name}</div>
            <div style={{
              fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase',
              letterSpacing: 1, fontWeight: 600,
            }}>{card.category}</div>
            <div style={{
              fontSize: '0.8rem', color: '#cbd5e1', textAlign: 'center', lineHeight: 1.4,
              marginTop: 'auto',
            }}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GunConstructorUI({ onConfirm, onCancel, initialConfig, playerCoins, playerGuns, playerUnlocked, onBuyPart }) {
  const [editSlot, setEditSlot] = useState(0);
  const [guns, setGuns] = useState(() => {
    const g0 = playerGuns?.[0] || initialConfig || { ...DEFAULT_GUN_CONFIG };
    const g1 = playerGuns?.[1] || null;
    return [g0, g1];
  });
  const [activeCategory, setActiveCategory] = useState('barrel');
  const [activeTier, setActiveTier] = useState(0);
  const previewRef = useRef(null);
  const categories = ['barrel', 'sight', 'trigger', 'stock', 'bayonet'];
  const selected = guns[editSlot] || { ...DEFAULT_GUN_CONFIG };

  const setSelected = (updater) => {
    setGuns(prev => {
      const next = [...prev];
      const cur = next[editSlot] || { ...DEFAULT_GUN_CONFIG };
      next[editSlot] = typeof updater === 'function' ? updater(cur) : updater;
      return next;
    });
  };

  const createGun2 = () => {
    setGuns(prev => {
      const next = [...prev];
      if (!next[1]) next[1] = { ...DEFAULT_GUN_CONFIG };
      return next;
    });
    setEditSlot(1);
  };

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 240, 100);
    ctx.imageSmoothingEnabled = false;
    const cur = guns[editSlot] || { ...DEFAULT_GUN_CONFIG };

    const drawPart = (cat, x, y, scale) => {
      if (!cur[cat] || cur[cat] === 0) return;
      const img = loadImg(getGunPartPath(cat, cur[cat]));
      if (img && img.complete && img.naturalWidth) {
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.save();
        const cf = getColorFilter(cur[cat]);
        if (cf !== 'none') ctx.filter = cf;
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
        ctx.restore();
      }
    };

    drawPart('stock', 50, 50, 4);
    drawPart('trigger', 80, 56, 4);
    drawPart('barrel', 130, 48, 4);
    drawPart('sight', 110, 35, 4);
    drawPart('bayonet', 165, 48, 3.5);
  }, [guns, editSlot]);

  const stats = getGunStats(selected);
  const shotInfo = stats ? SHOT_TYPES[stats.shotType] : null;

  const getPartDescription = (cat, v) => {
    if (!v || v === 0) return 'None';
    if (cat === 'barrel') {
      const s = getBarrelStats(v);
      return `${SHOT_TYPES[s.shot]?.name || s.shot} | DMG:${s.dmg.toFixed(1)} SPD:${s.speed.toFixed(0)} RNG:${s.range.toFixed(0)}${s.count > 1 ? ` x${s.count}` : ''}`;
    }
    if (cat === 'sight') { const s = getSightStats(v); return `Rate+${(s.rateBonus * 100).toFixed(0)}% Acc+${(s.accuracy * 100).toFixed(0)}% Crit+${(s.critBonus * 100).toFixed(0)}%`; }
    if (cat === 'trigger') { const s = getTriggerStats(v); return `Rate+${(s.rateBonus * 100).toFixed(0)}% DMG+${(s.dmgBonus * 100).toFixed(0)}%`; }
    if (cat === 'stock') { const s = getStockStats(v); return `Range+${(s.rangeBonus * 100).toFixed(0)}% Recoil-${(s.recoilReduce * 100).toFixed(0)}%`; }
    if (cat === 'bayonet') { const s = getBayonetStats(v); return `Melee:${s.meleeDmg} ${s.effect !== 'none' ? s.effect : ''}`; }
    return '';
  };

  const coins = playerCoins || 0;
  const unlocked = playerUnlocked || { barrel: [1], sight: [1], trigger: [1], stock: [1], bayonet: [0] };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(5,10,24,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 15, fontFamily: "'Jost', sans-serif", overflow: 'auto', padding: '16px 8px',
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
        color: '#22d3ee', marginBottom: 4, letterSpacing: 3,
        textShadow: '0 0 20px rgba(34,211,238,0.4)',
      }}>GUN FORGE</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
        <span style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>COINS: {coins}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1].map(s => (
            <button key={s} onClick={() => { if (s === 1 && !guns[1]) { createGun2(); } else setEditSlot(s); }} style={{
              padding: '4px 14px', borderRadius: 6, cursor: 'pointer',
              background: editSlot === s ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)',
              border: editSlot === s ? '2px solid #22d3ee' : '1px solid #475569',
              color: editSlot === s ? '#22d3ee' : '#94a3b8', fontWeight: 700, fontSize: '0.8rem',
            }}>{guns[s] ? `GUN ${s + 1}` : '+ GUN 2'}</button>
          ))}
        </div>
      </div>

      <canvas ref={previewRef} width={240} height={100} style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid #22d3ee20',
        borderRadius: 8, marginBottom: 8, imageRendering: 'pixelated',
      }} />

      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: '0.7rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: '#ef4444' }}>DMG: {stats.baseDamage}</span>
          <span style={{ color: '#22d3ee' }}>RATE: {stats.cooldown}f</span>
          <span style={{ color: '#a855f7' }}>RANGE: {stats.rangeLabel}</span>
          <span style={{ color: shotInfo?.color || '#fbbf24' }}>TYPE: {shotInfo?.name || 'Standard'}</span>
          {stats.critChance > 0 && <span style={{ color: '#f59e0b' }}>CRIT: {(stats.critChance * 100).toFixed(0)}%</span>}
          {stats.count > 1 && <span style={{ color: '#84cc16' }}>x{stats.count} pellets</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
            background: activeCategory === cat ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)',
            border: activeCategory === cat ? '1px solid #22d3ee' : '1px solid #334155',
            color: activeCategory === cat ? '#22d3ee' : '#94a3b8',
            textTransform: 'uppercase',
          }}>{GUN_PARTS[cat].label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {COLOR_TIERS.map((ct, ti) => (
          <button key={ti} onClick={() => setActiveTier(ti)} style={{
            padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem',
            background: activeTier === ti ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: activeTier === ti ? '1px solid #fbbf24' : '1px solid #1e293b',
            color: ti === 0 ? '#e2e8f0' : ti === 1 ? '#ef4444' : ti === 2 ? '#3b82f6' : '#fbbf24',
          }}>{ct.name}</button>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
        maxWidth: 400, width: '100%', marginBottom: 12, padding: '0 8px',
      }}>
        {activeCategory === 'bayonet' && (
          <button
            onClick={() => setSelected(s => ({ ...s, bayonet: 0 }))}
            style={{
              height: 48, border: selected.bayonet === 0 ? '2px solid #22d3ee' : '1px solid #334155',
              borderRadius: 6, background: 'rgba(0,0,0,0.4)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: '0.6rem',
            }}>NONE</button>
        )}
        {Array.from({ length: 10 }, (_, i) => {
          const baseV = i + 1;
          const v = activeTier * 10 + baseV;
          const cost = getPartCost(activeCategory, v);
          const isUnlocked = unlocked[activeCategory]?.includes(v) || (activeTier === 0 && baseV === 1);
          const isSelected = selected[activeCategory] === v;
          const partImg = loadImg(getGunPartPath(activeCategory, v));
          const desc = getPartDescription(activeCategory, v);

          return (
            <button
              key={v}
              onClick={() => {
                if (isUnlocked) {
                  setSelected(s => ({ ...s, [activeCategory]: v }));
                } else if (onBuyPart && coins >= cost) {
                  onBuyPart(activeCategory, v, cost);
                }
              }}
              title={desc}
              style={{
                height: 48, border: isSelected ? '2px solid #22d3ee' : isUnlocked ? '1px solid #475569' : '1px solid #1e293b',
                borderRadius: 6,
                background: isSelected ? 'rgba(34,211,238,0.15)' : isUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.5)',
                cursor: isUnlocked || coins >= cost ? 'pointer' : 'not-allowed',
                padding: 2, imageRendering: 'pixelated', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', opacity: !isUnlocked && coins < cost ? 0.4 : 1,
              }}
            >
              {partImg && partImg.complete ? (
                <img src={partImg.src} alt="" style={{
                  width: 24, height: 24, objectFit: 'contain',
                  imageRendering: 'pixelated',
                  filter: `${isSelected ? 'brightness(1.3)' : ''} ${getColorFilter(v) !== 'none' ? getColorFilter(v) : ''}`.trim() || 'none',
                }} />
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.55rem' }}>{baseV}</span>
              )}
              {!isUnlocked && (
                <span style={{ fontSize: '0.5rem', color: '#fbbf24', marginTop: 1 }}>{cost}$</span>
              )}
              {isUnlocked && (
                <span style={{ fontSize: '0.45rem', color: '#475569', marginTop: 1 }}>{desc.slice(0, 12)}</span>
              )}
            </button>
          );
        })}
      </div>

      {shotInfo && (
        <div style={{ fontSize: '0.65rem', color: shotInfo.color, marginBottom: 8, textAlign: 'center' }}>
          {shotInfo.name}: {shotInfo.desc}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onConfirm(guns[editSlot], editSlot, guns)} style={{
          background: 'rgba(34,211,238,0.2)', border: '2px solid #22d3ee',
          borderRadius: 8, padding: '8px 24px', color: '#22d3ee',
          fontFamily: "'Cinzel', serif", fontSize: '0.85rem', cursor: 'pointer',
        }}>EQUIP GUN {editSlot + 1}</button>
        <button onClick={onCancel} style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444',
          borderRadius: 8, padding: '8px 24px', color: '#ef4444',
          fontFamily: "'Cinzel', serif", fontSize: '0.85rem', cursor: 'pointer',
        }}>CLOSE</button>
      </div>
    </div>
  );
}

export default function ShadowOps() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('menu');
  const [upgradeUI, setUpgradeUI] = useState(null);
  const [gunBuilderOpen, setGunBuilderOpen] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('shadowops_highscore') || '0'); } catch { return 0; }
  });
  const [bestWave, setBestWave] = useState(() => {
    try { return parseInt(localStorage.getItem('shadowops_bestwave') || '0'); } catch { return 0; }
  });

  const handleGunConfirm = useCallback((gunConfig, slotIdx, allGuns) => {
    const game = gameRef.current;
    const p = game.player;
    if (p.gunStatsDmg) p.damageMulti /= p.gunStatsDmg;
    if (p.gunStatsRate) p.fireRateMulti /= p.gunStatsRate;
    p.guns = allGuns ? [...allGuns] : p.guns;
    p.activeGun = slotIdx || 0;
    p.gunConfig = gunConfig;
    savedGunConfig.current = { guns: p.guns, coins: p.coins, unlocked: p.unlockedParts };
    try { localStorage.setItem('shadowops_gunconfig', JSON.stringify(savedGunConfig.current)); } catch {}
    const stats = getGunStats(gunConfig);
    if (stats) {
      p.gunStatsDmg = stats.dmgBonus;
      p.gunStatsRate = stats.rateBonus;
      p.damageMulti *= stats.dmgBonus;
      p.fireRateMulti *= stats.rateBonus;
    } else {
      p.gunStatsDmg = 1;
      p.gunStatsRate = 1;
    }
    setGunBuilderOpen(false);
    addAnnouncement(game, `GUN ${(slotIdx || 0) + 1} EQUIPPED!`, '#22d3ee', 120);
    if (game.upgradePhase) {
      p.upgrades.push('gun_builder');
      game.upgradePhase = false;
      game.upgradeChoices = [];
      setUpgradeUI(null);
      startNextWave(game);
    }
  }, []);

  const handleBuyPart = useCallback((category, variant, cost) => {
    const game = gameRef.current;
    const p = game.player;
    if ((p.coins || 0) < cost) return;
    p.coins -= cost;
    if (!p.unlockedParts[category]) p.unlockedParts[category] = [];
    if (!p.unlockedParts[category].includes(variant)) {
      p.unlockedParts[category].push(variant);
    }
    savedGunConfig.current = { guns: p.guns, coins: p.coins, unlocked: p.unlockedParts };
    try { localStorage.setItem('shadowops_gunconfig', JSON.stringify(savedGunConfig.current)); } catch {}
    setGunBuilderOpen(false);
    setTimeout(() => setGunBuilderOpen(true), 0);
  }, []);

  const savedGunConfig = useRef(null);
  if (savedGunConfig.current === null) {
    try { const g = localStorage.getItem('shadowops_gunconfig'); if (g) savedGunConfig.current = JSON.parse(g); } catch {}
  }

  const startGame = useCallback(() => {
    const saved = savedGunConfig.current;
    gameRef.current = createGame();
    gameRef.current.started = true;
    const p = gameRef.current.player;
    if (saved) {
      if (saved.guns) {
        p.guns = saved.guns;
        p.gunConfig = saved.guns[0] || { ...DEFAULT_GUN_CONFIG };
        p.activeGun = 0;
      } else if (saved.barrel !== undefined) {
        p.gunConfig = saved;
        p.guns = [saved, null];
      }
      if (saved.coins !== undefined) p.coins = saved.coins;
      if (saved.unlocked) p.unlockedParts = saved.unlocked;
      const stats = getGunStats(p.gunConfig);
      if (stats) {
        p.gunStatsDmg = stats.dmgBonus;
        p.gunStatsRate = stats.rateBonus;
        p.damageMulti *= stats.dmgBonus;
        p.fireRateMulti *= stats.rateBonus;
      }
    }
    setUpgradeUI(null);
    setGunBuilderOpen(false);
    setPhase('playing');
  }, []);

  const handleUpgradeSelect = useCallback((card) => {
    if (card.isGunBuilder) {
      setGunBuilderOpen(true);
      return;
    }
    const game = gameRef.current;
    if (card.passGame) {
      card.apply(game.player, game);
    } else {
      card.apply(game.player);
    }
    game.player.upgrades.push(card.id);
    game.upgradePhase = false;
    game.upgradeChoices = [];
    setUpgradeUI(null);
    startNextWave(game);
  }, []);

  const handleRestart = useCallback(() => {
    const g = gameRef.current;
    if (g.player.score > highScore) {
      setHighScore(g.player.score);
      try { localStorage.setItem('shadowops_highscore', String(g.player.score)); } catch {}
    }
    if (g.wave > bestWave) {
      setBestWave(g.wave);
      try { localStorage.setItem('shadowops_bestwave', String(g.wave)); } catch {}
    }
    try {
      const stats = JSON.parse(localStorage.getItem('shadowops_stats') || '{}');
      stats.totalKills = (stats.totalKills || 0) + g.totalKills;
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.bestCombo = Math.max(stats.bestCombo || 0, g.player.bestCombo);
      stats.bossKills = (stats.bossKills || 0) + g.bossKills;
      localStorage.setItem('shadowops_stats', JSON.stringify(stats));
    } catch {}
    startGame();
  }, [highScore, bestWave, startGame]);

  const handleMenu = useCallback(() => {
    const g = gameRef.current;
    if (g.player.score > highScore) {
      setHighScore(g.player.score);
      try { localStorage.setItem('shadowops_highscore', String(g.player.score)); } catch {}
    }
    if (g.wave > bestWave) {
      setBestWave(g.wave);
      try { localStorage.setItem('shadowops_bestwave', String(g.wave)); } catch {}
    }
    try {
      const stats = JSON.parse(localStorage.getItem('shadowops_stats') || '{}');
      stats.totalKills = (stats.totalKills || 0) + g.totalKills;
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.bestCombo = Math.max(stats.bestCombo || 0, g.player.bestCombo);
      stats.bossKills = (stats.bossKills || 0) + g.bossKills;
      localStorage.setItem('shadowops_stats', JSON.stringify(stats));
    } catch {}
    setUpgradeUI(null);
    setPhase('menu');
  }, [highScore, bestWave]);

  const persistStats = useCallback(() => {
    const g = gameRef.current;
    if (!g || !g.started) return;
    if (g.player.score > highScore) {
      try { localStorage.setItem('shadowops_highscore', String(g.player.score)); } catch {}
    }
    if (g.wave > bestWave) {
      try { localStorage.setItem('shadowops_bestwave', String(g.wave)); } catch {}
    }
    try {
      const stats = JSON.parse(localStorage.getItem('shadowops_stats') || '{}');
      stats.totalKills = (stats.totalKills || 0) + g.totalKills;
      stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
      stats.bestCombo = Math.max(stats.bestCombo || 0, g.player.bestCombo);
      stats.bossKills = (stats.bossKills || 0) + g.bossKills;
      localStorage.setItem('shadowops_stats', JSON.stringify(stats));
    } catch {}
  }, [highScore, bestWave]);

  useEffect(() => {
    const onBeforeUnload = () => persistStats();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [persistStats]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'x', 'c', 'v', 'z'].includes(key)) {
        e.preventDefault();
      }
      game.keys[key] = true;
      if (key === '1' || key === '2') {
        const slot = parseInt(key) - 1;
        const p = game.player;
        if (p.guns[slot]) {
          p.activeGun = slot;
          p.gunConfig = p.guns[slot];
          const stats = getGunStats(p.gunConfig);
          if (p.gunStatsDmg) p.damageMulti /= p.gunStatsDmg;
          if (p.gunStatsRate) p.fireRateMulti /= p.gunStatsRate;
          if (stats) {
            p.gunStatsDmg = stats.dmgBonus;
            p.gunStatsRate = stats.rateBonus;
            p.damageMulti *= stats.dmgBonus;
            p.fireRateMulti *= stats.rateBonus;
          }
        }
      }
      if (key === 'q') {
        const p = game.player;
        const nextSlot = p.activeGun === 0 ? 1 : 0;
        if (p.guns[nextSlot]) {
          p.activeGun = nextSlot;
          p.gunConfig = p.guns[nextSlot];
          const stats = getGunStats(p.gunConfig);
          if (p.gunStatsDmg) p.damageMulti /= p.gunStatsDmg;
          if (p.gunStatsRate) p.fireRateMulti /= p.gunStatsRate;
          if (stats) {
            p.gunStatsDmg = stats.dmgBonus;
            p.gunStatsRate = stats.rateBonus;
            p.damageMulti *= stats.dmgBonus;
            p.fireRateMulti *= stats.rateBonus;
          }
        }
      }
    };
    const onKeyUp = (e) => { game.keys[e.key.toLowerCase()] = false; };
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      game.mouseX = (e.clientX - rect.left) * scaleX;
      game.mouseY = (e.clientY - rect.top) * scaleY;
    };
    const onMouseDown = (e) => {
      if (e.button === 0) { game.keys['mousedown'] = true; e.preventDefault(); }
      if (e.button === 2) { game.keys['rightmousedown'] = true; e.preventDefault(); }
    };
    const onMouseUp = (e) => {
      if (e.button === 0) game.keys['mousedown'] = false;
      if (e.button === 2) game.keys['rightmousedown'] = false;
    };
    const onContext = (e) => e.preventDefault();

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContext);

    const loop = () => {
      updateGame(game);

      if (game.upgradePhase && !upgradeUI) {
        setUpgradeUI(game.upgradeChoices);
      }

      renderGame(ctx, game);
      if (game.gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 48px "Cinzel", serif';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        ctx.strokeText('MISSION FAILED', CANVAS_W / 2, CANVAS_H / 2 - 80);
        ctx.fillText('MISSION FAILED', CANVAS_W / 2, CANVAS_H / 2 - 80);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 28px "Cinzel", serif';
        ctx.fillText(`Score: ${game.player.score}`, CANVAS_W / 2, CANVAS_H / 2 - 30);

        ctx.fillStyle = '#22d3ee';
        ctx.font = '15px monospace';
        ctx.fillText(`Wave ${game.wave} | Level ${game.player.level} | Kills: ${game.totalKills}`, CANVAS_W / 2, CANVAS_H / 2 + 5);

        ctx.fillStyle = '#a855f7';
        ctx.font = '13px monospace';
        const stats = [];
        if (game.player.bestCombo >= 2) stats.push(`Best Combo: ${game.player.bestCombo}x`);
        if (game.bossKills > 0) stats.push(`Bosses: ${game.bossKills}`);
        stats.push(`Weapons: ${game.player.weaponsUnlocked.length}`);
        stats.push(`Upgrades: ${game.player.upgrades.length}`);
        ctx.fillText(stats.join(' | '), CANVAS_W / 2, CANVAS_H / 2 + 30);

        if (game.player.score > highScore) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 16px "Cinzel", serif';
          ctx.fillText('NEW HIGH SCORE!', CANVAS_W / 2, CANVAS_H / 2 + 60);
        }

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px monospace';
        ctx.fillText('Press R to restart | ESC for menu', CANVAS_W / 2, CANVAS_H / 2 + 90);
        ctx.restore();
        setPhase('gameover');
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContext);
    };
  }, [phase, upgradeUI]);

  useEffect(() => {
    if (phase === 'playing') {
      for (let lvl = 1; lvl <= 9; lvl++) {
        Object.values(PLAYER_SPRITE_LEVELS[lvl]).forEach(s => loadImg(s.path));
      }
      ALL_MAGIC_EFFECTS.forEach(me => loadImg(me.path));
      Object.keys(GUN_PARTS).forEach(cat => {
        const info = GUN_PARTS[cat];
        for (let i = 1; i <= info.count; i++) loadImg(getGunPartPath(cat, i));
      });
      Object.values(HERO_WEAPON_SPRITES).forEach(ws => {
        loadImg(ws.held); loadImg(ws.empty); loadImg(ws.icon);
      });
      Object.values(PICKUP_SPRITES).forEach(sp => loadImg(sp));
      Object.values(SHOT_EFFECTS).forEach(se => {
        for (let i = 1; i <= se.frames; i++) loadImg(`${se.path}${i}.png`);
      });
      for (let i = 1; i <= EXPLODE_EFFECT.frames; i++) loadImg(`${EXPLODE_EFFECT.path}${i}.png`);
      for (let i = 1; i <= HERO_WALK_FRAMES; i++) loadImg(`/sprites/shadow-ops/hero/walk/${i}.png`);
      for (let i = 1; i <= HERO_DIE_FRAMES; i++) loadImg(`/sprites/shadow-ops/hero/die/${i}.png`);
      Object.values(ENEMY_TYPES).forEach(et => {
        Object.values(et.sprites).forEach(s => {
          if (s.dirs) {
            s.dirs.forEach(d => loadImg(d));
          } else if (s.path) {
            loadImg(s.path);
          }
        });
      });
      preloadAllEffects();
    }
  }, [phase]);

  useEffect(() => {
    const onKeyRestart = (e) => {
      if (e.key === 'r' && phase === 'gameover') handleRestart();
      if (e.key === 'Escape' && phase === 'gameover') handleMenu();
    };
    window.addEventListener('keydown', onKeyRestart);
    return () => window.removeEventListener('keydown', onKeyRestart);
  }, [phase, handleRestart, handleMenu]);

  if (phase === 'menu') {
    let stats = {};
    try { stats = JSON.parse(localStorage.getItem('shadowops_stats') || '{}'); } catch {}

    return (
      <div style={{
        width: '100%', height: '100%', background: 'linear-gradient(180deg, #050a18 0%, #0a1628 50%, #0f1d30 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Jost', sans-serif", color: '#e2e8f0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(168,85,247,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(34,211,238,0.06) 0%, transparent 50%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 500, width: '90%' }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 4, letterSpacing: 4,
          }}>SHADOW OPS</h1>
          <p style={{
            color: '#94a3b8', fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            letterSpacing: 2, marginBottom: 24, textTransform: 'uppercase',
          }}>Top-Down Survival Arena</p>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,238,0.15)',
            borderRadius: 12, padding: '16px 24px', marginBottom: 20, textAlign: 'left',
          }}>
            <div style={{ color: '#22d3ee', fontFamily: "'Cinzel', serif", fontSize: '0.85rem', marginBottom: 10 }}>CONTROLS</div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#94a3b8', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' }}>
              <div><span style={{ color: '#fbbf24' }}>WASD</span> - Move</div>
              <div><span style={{ color: '#fbbf24' }}>Mouse</span> - Aim</div>
              <div><span style={{ color: '#fbbf24' }}>Left Click</span> - Shoot</div>
              <div><span style={{ color: '#fbbf24' }}>Right Click</span> - Grenade</div>
              <div><span style={{ color: '#fbbf24' }}>Space</span> - Dash</div>
              <div><span style={{ color: '#fbbf24' }}>Q / 1-5</span> - Switch Weapon</div>
              <div><span style={{ color: '#fbbf24' }}>E</span> - Shockwave AOE</div>
              <div><span style={{ color: '#fbbf24' }}>F</span> - Poison Cloud</div>
              <div><span style={{ color: '#fbbf24' }}>R</span> - Fire Ring</div>
              <div><span style={{ color: '#fbbf24' }}>X</span> - Teleport</div>
              <div><span style={{ color: '#fbbf24' }}>C</span> - Blade Storm</div>
              <div><span style={{ color: '#fbbf24' }}>V</span> - Armor Mode</div>
              <div><span style={{ color: '#fbbf24' }}>Z</span> - Super Flash</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.15)',
            borderRadius: 12, padding: '14px 24px', marginBottom: 20, textAlign: 'left',
          }}>
            <div style={{ color: '#a855f7', fontFamily: "'Cinzel', serif", fontSize: '0.85rem', marginBottom: 8 }}>FEATURES</div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#94a3b8' }}>
              5 weapons (Pistol, Shotgun, Rifle, SMG, Plasma) - Boss enemies every 5 waves -
              Grenades with area damage - Dash melee attacks - Combo kill streaks -
              11 enemy types (ranged + melee) with scaling difficulty - AI line-of-sight raycasting -
              7 unlockable abilities (Shockwave, Poison Cloud, Fire Ring, Teleport, Blade Storm, Armor Mode, Super Flash) -
              Custom Gun Forge - Upgrade cards between rounds
            </div>
          </div>

          {(highScore > 0 || stats.gamesPlayed > 0) && (
            <div style={{
              display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap',
            }}>
              {highScore > 0 && <div style={{ color: '#fbbf24', fontSize: '0.85rem', background: 'rgba(251,191,36,0.1)', padding: '6px 14px', borderRadius: 8 }}>High Score: {highScore}</div>}
              {bestWave > 0 && <div style={{ color: '#22d3ee', fontSize: '0.85rem', background: 'rgba(34,211,238,0.1)', padding: '6px 14px', borderRadius: 8 }}>Best Wave: {bestWave}</div>}
              {stats.totalKills > 0 && <div style={{ color: '#a855f7', fontSize: '0.85rem', background: 'rgba(168,85,247,0.1)', padding: '6px 14px', borderRadius: 8 }}>Total Kills: {stats.totalKills}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={startGame} style={{
              background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(6,182,212,0.25))',
              border: '2px solid #22d3ee', borderRadius: 12,
              padding: '16px 48px', color: '#22d3ee',
              fontFamily: "'Cinzel', serif", fontSize: '1.2rem', fontWeight: 700,
              letterSpacing: 3, cursor: 'pointer',
              transition: 'all 0.3s', width: 260,
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(34,211,238,0.3)'; e.target.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.target.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(6,182,212,0.25))'; e.target.style.transform = 'scale(1)'; }}
            >
              START MISSION
            </button>

            <button onClick={() => setGunBuilderOpen(true)} style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.25))',
              border: '2px solid #a855f7', borderRadius: 12,
              padding: '12px 36px', color: '#a855f7',
              fontFamily: "'Cinzel', serif", fontSize: '0.95rem', fontWeight: 700,
              letterSpacing: 2, cursor: 'pointer',
              transition: 'all 0.3s', width: 260,
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(168,85,247,0.3)'; e.target.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.target.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.25))'; e.target.style.transform = 'scale(1)'; }}
            >
              BUILD CUSTOM GUN
            </button>
          </div>

          <div style={{ marginTop: 16, color: '#475569', fontSize: '0.75rem' }}>
            A Grudge Studios Game
          </div>
        </div>
        {gunBuilderOpen && (
          <GunConstructorUI
            onConfirm={handleGunConfirm}
            onCancel={() => setGunBuilderOpen(false)}
            initialConfig={gameRef.current.player.gunConfig}
            playerCoins={gameRef.current.player.coins}
            playerGuns={gameRef.current.player.guns}
            playerUnlocked={gameRef.current.player.unlockedParts}
            onBuyPart={handleBuyPart}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: '#050a18',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: '100%', height: '100%', objectFit: 'contain',
          imageRendering: 'pixelated', cursor: phase === 'playing' && !upgradeUI ? 'none' : 'default',
          background: '#000',
        }}
      />
      {upgradeUI && !gunBuilderOpen && (
        <UpgradeCardUI choices={upgradeUI} onSelect={handleUpgradeSelect} />
      )}
      {gunBuilderOpen && (
        <GunConstructorUI
          onConfirm={handleGunConfirm}
          onCancel={() => {
            setGunBuilderOpen(false);
          }}
          initialConfig={gameRef.current?.player?.gunConfig}
          playerCoins={gameRef.current?.player?.coins}
          playerGuns={gameRef.current?.player?.guns}
          playerUnlocked={gameRef.current?.player?.unlockedParts}
          onBuyPart={handleBuyPart}
        />
      )}
      {phase === 'gameover' && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 16,
        }}>
          <button onClick={handleRestart} style={{
            background: 'rgba(34,211,238,0.2)', border: '2px solid #22d3ee',
            borderRadius: 8, padding: '12px 32px', color: '#22d3ee',
            fontFamily: "'Cinzel', serif", fontSize: '1rem', cursor: 'pointer',
          }}>RESTART</button>
          <button onClick={handleMenu} style={{
            background: 'rgba(168,85,247,0.2)', border: '2px solid #a855f7',
            borderRadius: 8, padding: '12px 32px', color: '#a855f7',
            fontFamily: "'Cinzel', serif", fontSize: '1rem', cursor: 'pointer',
          }}>MENU</button>
        </div>
      )}
    </div>
  );
}
