const FW = 64, FH = 64;
const DRAW_SCALE = 4.5;
const DRAW_W = FW * DRAW_SCALE;
const DRAW_H = FH * DRAW_SCALE;

export const HITBOX_ZONES = {
  head:  { offX: 0, offY: -0.85, w: 0.30, h: 0.20, dmgMult: 1.35, stunMult: 1.5, name: 'HEAD', bar: 'head' },
  chest: { offX: 0, offY: -0.55, w: 0.40, h: 0.30, dmgMult: 1.0,  stunMult: 1.0, name: 'BODY', bar: 'body' },
  arms:  { offX: 0.25, offY: -0.60, w: 0.20, h: 0.25, dmgMult: 0.8,  stunMult: 0.7, name: 'ARM', bar: 'body' },
  legs:  { offX: 0, offY: -0.20, w: 0.35, h: 0.25, dmgMult: 0.85, stunMult: 1.2, name: 'LEG', bar: 'body' },
};

export const ARM_HEIGHT = { HIGH: 'high', LOW: 'low' };

export const ATTACK_ZONES = {
  jab:      { primary: 'head',  secondary: 'chest', hitboxOff: { x: 0.55, y: -0.70 }, hitboxSize: { w: 0.30, h: 0.20 }, slashAngle: 0,    slashType: 1, armHeight: ARM_HEIGHT.HIGH },
  cross:    { primary: 'chest', secondary: 'head',  hitboxOff: { x: 0.60, y: -0.55 }, hitboxSize: { w: 0.35, h: 0.25 }, slashAngle: -15,  slashType: 3, armHeight: ARM_HEIGHT.HIGH },
  lowkick:  { primary: 'legs',  secondary: 'legs',  hitboxOff: { x: 0.50, y: -0.15 }, hitboxSize: { w: 0.40, h: 0.20 }, slashAngle: 30,   slashType: 2, armHeight: ARM_HEIGHT.LOW },
  kick:     { primary: 'chest', secondary: 'legs',  hitboxOff: { x: 0.55, y: -0.40 }, hitboxSize: { w: 0.35, h: 0.30 }, slashAngle: 15,   slashType: 4, armHeight: ARM_HEIGHT.LOW },
  upper:    { primary: 'head',  secondary: 'chest', hitboxOff: { x: 0.45, y: -0.80 }, hitboxSize: { w: 0.30, h: 0.30 }, slashAngle: -75,  slashType: 5, armHeight: ARM_HEIGHT.HIGH },
  hook:     { primary: 'head',  secondary: 'arms',  hitboxOff: { x: 0.50, y: -0.75 }, hitboxSize: { w: 0.30, h: 0.20 }, slashAngle: -30,  slashType: 6, armHeight: ARM_HEIGHT.HIGH },
  highkick: { primary: 'head',  secondary: 'chest', hitboxOff: { x: 0.55, y: -0.80 }, hitboxSize: { w: 0.35, h: 0.25 }, slashAngle: -60,  slashType: 7, armHeight: ARM_HEIGHT.HIGH },
  special:  { primary: 'chest', secondary: 'head',  hitboxOff: { x: 0.55, y: -0.55 }, hitboxSize: { w: 0.45, h: 0.40 }, slashAngle: 0,    slashType: 8, armHeight: ARM_HEIGHT.HIGH },
};

export function getArmAngle(atkName) {
  const zone = ATTACK_ZONES[atkName];
  if (!zone) return 0;
  return zone.armHeight === ARM_HEIGHT.HIGH ? -20 : 20;
}

export function getAttackHitboxWithArm(fighter, atkName, armAngleOverride = null) {
  const zone = ATTACK_ZONES[atkName];
  if (!zone) return null;
  const dir = fighter.facingRight ? 1 : -1;
  const armAngle = armAngleOverride !== null ? armAngleOverride : getArmAngle(atkName);
  const armRad = (armAngle * Math.PI) / 180;
  const baseX = zone.hitboxOff.x * DRAW_W * dir;
  const baseY = zone.hitboxOff.y * DRAW_H;
  const rotatedX = baseX * Math.cos(armRad) - baseY * Math.sin(armRad) * 0.3;
  const rotatedY = baseX * Math.sin(armRad) * 0.3 + baseY * Math.cos(armRad);
  return {
    x: fighter.x + rotatedX,
    y: fighter.y + rotatedY,
    w: zone.hitboxSize.w * DRAW_W,
    h: zone.hitboxSize.h * DRAW_H,
  };
}

export function getDefenderZone(attackerX, defenderX, defenderY, atkName) {
  const zone = ATTACK_ZONES[atkName];
  if (!zone) return null;
  const primary = HITBOX_ZONES[zone.primary];
  const secondary = HITBOX_ZONES[zone.secondary];
  return { primary, secondary, zone };
}

export function getAttackHitbox(fighter, atkName) {
  const zone = ATTACK_ZONES[atkName];
  if (!zone) return null;
  const dir = fighter.facingRight ? 1 : -1;
  return {
    x: fighter.x + zone.hitboxOff.x * DRAW_W * dir,
    y: fighter.y + zone.hitboxOff.y * DRAW_H,
    w: zone.hitboxSize.w * DRAW_W,
    h: zone.hitboxSize.h * DRAW_H,
  };
}

export function getDefenderHurtbox(fighter, zoneName) {
  const zone = HITBOX_ZONES[zoneName];
  if (!zone) return null;
  return {
    x: fighter.x + zone.offX * DRAW_W,
    y: fighter.y + zone.offY * DRAW_H,
    w: zone.w * DRAW_W,
    h: zone.h * DRAW_H,
  };
}

export function checkAABB(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

export function resolveZoneHit(attacker, defender, atkName) {
  const atkHitbox = getAttackHitboxWithArm(attacker, atkName) || getAttackHitbox(attacker, atkName);
  if (!atkHitbox) return null;

  const zoneData = ATTACK_ZONES[atkName];
  const zones = [zoneData.primary, zoneData.secondary];

  for (const zoneName of zones) {
    const hurtbox = getDefenderHurtbox(defender, zoneName);
    if (!hurtbox) continue;
    if (checkAABB(atkHitbox, hurtbox)) {
      return {
        zone: HITBOX_ZONES[zoneName],
        zoneName,
        contactX: (atkHitbox.x + hurtbox.x) / 2,
        contactY: (atkHitbox.y + hurtbox.y) / 2,
      };
    }
  }
  return null;
}

export function calculateDamage(baseDmg, attackerDmgMult, zoneHit, comboBonus, isPoweredUp) {
  const zoneMult = zoneHit ? zoneHit.zone.dmgMult : 1.0;
  const critRoll = Math.random();
  const critThreshold = zoneHit?.zoneName === 'head' ? 0.18 : 0.08;
  const isCrit = critRoll < critThreshold;
  const critMult = isCrit ? 1.5 : 1.0;
  let dmg = Math.floor(baseDmg * attackerDmgMult * zoneMult * comboBonus * critMult);
  if (isPoweredUp) dmg = Math.floor(dmg * 1.4);
  return { damage: dmg, isCrit };
}

export function calculateDamageCompat(baseDmg, attackerDmgMult, zoneHit, comboBonus, isPoweredUp) {
  const result = calculateDamage(baseDmg, attackerDmgMult, zoneHit, comboBonus, isPoweredUp);
  return result.damage;
}

export function calculateStun(baseStun, zoneHit, isPoweredUp) {
  const zoneMult = zoneHit ? zoneHit.zone.stunMult : 1.0;
  let stun = Math.floor(baseStun * zoneMult);
  if (isPoweredUp) stun = Math.floor(stun * 1.2);
  return stun;
}

export function calculateKnockback(baseKB, facingRight, zoneHit, isPoweredUp) {
  const dir = facingRight ? 1 : -1;
  let kb = baseKB * dir;
  if (zoneHit?.zoneName === 'head') kb *= 1.2;
  if (isPoweredUp) kb *= 1.3;
  return kb;
}

export { FIGHTER_SPECIALS } from '../data/gkoFighters';

export const POWERUP_DURATION = 600;
export const POWERUP_DMG_BOOST = 1.4;
export const POWERUP_SPEED_BOOST = 1.2;

export function createPowerupState() {
  return {
    active: false,
    timer: 0,
    used: false,
  };
}

export function activatePowerup(fighter) {
  if (fighter.powerup.used || fighter.powerup.active) return false;
  fighter.powerup.active = true;
  fighter.powerup.timer = POWERUP_DURATION;
  fighter.powerup.used = true;
  return true;
}

export function updatePowerup(fighter) {
  if (!fighter.powerup.active) return;
  fighter.powerup.timer--;
  if (fighter.powerup.timer <= 0) {
    fighter.powerup.active = false;
  }
}

export function isPoweredUp(fighter) {
  return fighter.powerup?.active || false;
}

export const SLASH_FRAME_COUNT = {
  1: 10, 2: 5, 3: 10, 4: 8, 5: 8,
  6: 10, 7: 10, 8: 10, 9: 8, 10: 8,
};

export function createSlashVFX(x, y, slashType, angle, scale = 1.0, color = null) {
  const frameCount = SLASH_FRAME_COUNT[slashType] || 8;
  return {
    x, y,
    slashType,
    angle: angle || 0,
    frame: 0,
    maxFrames: frameCount,
    frameTimer: 0,
    frameSpeed: 30,
    scale,
    color,
    alive: true,
  };
}

export function updateSlashVFX(vfx, dt) {
  vfx.frameTimer += dt;
  if (vfx.frameTimer >= vfx.frameSpeed) {
    vfx.frameTimer = 0;
    vfx.frame++;
    if (vfx.frame >= vfx.maxFrames) {
      vfx.alive = false;
    }
  }
}

export function getSlashImagePath(slashType, frameIndex) {
  return `/sprites/effects/slash/${slashType}/${frameIndex + 1}.png`;
}

export const PHYSICS = {
  GRAVITY: 0.7,
  FRICTION: 0.85,
  GROUND: 420,
  BOUNDARY_MIN: 50,
  BOUNDARY_MAX: 910,
  RECOIL_ATTACKER: -2.5,
  RECOIL_DEFENDER_LIGHT: 3,
  RECOIL_DEFENDER_HEAVY: 8,
  LAUNCH_VY: -10,
  JUMP_VY: -14,
  BODY_WIDTH: 80,
  BODY_PUSH_FORCE: 3.5,
  DASH_SPEED: 18,
  DASH_DURATION: 6,
  DASH_COOLDOWN: 30,
  HITSTOP_LIGHT: 4,
  HITSTOP_HEAVY: 7,
  HITSTOP_SPECIAL: 12,
};

export function applyPhysics(fighter) {
  fighter.vx *= PHYSICS.FRICTION;
  fighter.x += fighter.vx;
  fighter.vy += PHYSICS.GRAVITY;
  fighter.y += fighter.vy;
  const wasAirborne = fighter.y < PHYSICS.GROUND;
  if (fighter.y >= PHYSICS.GROUND) {
    if (wasAirborne && fighter.vy > 3) {
      fighter.landedHard = true;
    }
    fighter.y = PHYSICS.GROUND;
    fighter.vy = 0;
    fighter.airborne = false;
  } else {
    fighter.airborne = true;
  }
  fighter.x = Math.max(PHYSICS.BOUNDARY_MIN, Math.min(PHYSICS.BOUNDARY_MAX, fighter.x));
}

export function resolveBodyCollision(f1, f2) {
  const dist = Math.abs(f1.x - f2.x);
  if (dist < PHYSICS.BODY_WIDTH && f1.y >= PHYSICS.GROUND - 20 && f2.y >= PHYSICS.GROUND - 20) {
    const overlap = PHYSICS.BODY_WIDTH - dist;
    const push = overlap * 0.5;
    if (f1.x < f2.x) {
      f1.x -= push;
      f2.x += push;
    } else {
      f1.x += push;
      f2.x -= push;
    }
    f1.x = Math.max(PHYSICS.BOUNDARY_MIN, Math.min(PHYSICS.BOUNDARY_MAX, f1.x));
    f2.x = Math.max(PHYSICS.BOUNDARY_MIN, Math.min(PHYSICS.BOUNDARY_MAX, f2.x));
  }
}

export function createHitSpark(x, y, color, intensity = 1.0, dirAngle = null) {
  const sparks = [];
  const count = Math.floor(6 + intensity * 8);
  const hasDir = dirAngle !== null;
  for (let i = 0; i < count; i++) {
    let angle;
    if (hasDir) {
      const spread = 1.2;
      angle = dirAngle + (Math.random() - 0.5) * spread;
    } else {
      angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    }
    const speed = (3 + Math.random() * 5) * intensity;
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 12 + Math.floor(Math.random() * 8),
      maxLife: 20,
      color,
      size: 2 + Math.random() * 3 * intensity,
      type: 'spark',
      trail: [],
    });
  }
  const ringCount = Math.floor(2 + intensity * 2);
  for (let i = 0; i < ringCount; i++) {
    sparks.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      life: 8 + Math.floor(Math.random() * 6),
      maxLife: 14,
      color: '#fff',
      size: 4 + Math.random() * 4 * intensity,
      type: 'flash',
    });
  }
  return sparks;
}

export function createDustPuff(x, y, dir = 0, count = 5) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + Math.random() * 4,
      vx: dir * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2 - 0.5,
      life: 15 + Math.floor(Math.random() * 10),
      maxLife: 25,
      color: 'rgba(180,160,120,0.6)',
      size: 4 + Math.random() * 6,
      type: 'dust',
    });
  }
  return particles;
}

export function createAfterimage(fighter, alpha = 0.3, owner = null) {
  return {
    x: fighter.x,
    y: fighter.y,
    frame: fighter.frame,
    anim: fighter.anim,
    facingRight: fighter.facingRight,
    alpha,
    life: 8,
    maxLife: 8,
    type: 'afterimage',
    owner,
  };
}

export const BAR_DEFS = {
  stamina: { label: 'STAMINA', color: '#22d3ee', maxBase: 100, regenRate: 1.5,  role: 'punch/block costs' },
  focus:   { label: 'FOCUS',   color: '#a855f7', maxBase: 80,  regenRate: 1.0,  role: 'accuracy/reaction' },
  head:    { label: 'HEAD',    color: '#ef4444', maxBase: 75,  regenRate: 0.8,  role: 'KO vulnerability' },
  body:    { label: 'BODY',    color: '#22c55e', maxBase: 90,  regenRate: 1.2,  role: 'movement speed' },
};

export const BAR_NAMES = ['stamina', 'focus', 'head', 'body'];

export const STUN_RECOVERY_RATE = 2.5;
export const STUN_THRESHOLD_PCT = 0.05;

export function createBars(fighterStats) {
  const s = fighterStats || { power: 6, speed: 6, defense: 6, stamina: 6 };
  return {
    stamina: { current: BAR_DEFS.stamina.maxBase + s.stamina * 5, max: BAR_DEFS.stamina.maxBase + s.stamina * 5, burned: 0 },
    focus:   { current: BAR_DEFS.focus.maxBase + s.defense * 3,   max: BAR_DEFS.focus.maxBase + s.defense * 3,   burned: 0 },
    head:    { current: BAR_DEFS.head.maxBase + s.defense * 4,    max: BAR_DEFS.head.maxBase + s.defense * 4,    burned: 0 },
    body:    { current: BAR_DEFS.body.maxBase + s.stamina * 3,    max: BAR_DEFS.body.maxBase + s.stamina * 3,    burned: 0 },
  };
}

export function getEffectiveMax(bar) {
  return Math.max(1, bar.max - bar.burned);
}

export function applyBurnDamage(bars, barName, amount) {
  if (!bars[barName]) return;
  bars[barName].burned = Math.min(bars[barName].max * 0.6, bars[barName].burned + amount);
  const effMax = getEffectiveMax(bars[barName]);
  if (bars[barName].current > effMax) bars[barName].current = effMax;
}

export const KNOCKDOWN = {
  countdownFrames: 600,
  getUpThreshold: 0.15,
  burnPerKnockdown: 3,
  recoveryPerMash: 2.5,
  maxKnockdowns: 3,
};

export function isBarDepleted(bars) {
  for (const name of BAR_NAMES) {
    if (bars[name].current <= 0) return name;
  }
  return null;
}

export function updateBars(fighter, isBlocking, roundElapsed) {
  const bars = fighter.bars;
  if (!bars) return;

  const stateMulti = fighter.state === 'idle' ? 1.4 : (isBlocking ? 0.6 : 0.3);
  const earlyFightBonus = roundElapsed !== undefined ? Math.max(1.0, 3.0 - (roundElapsed / 600)) : 1.0;

  for (const name of BAR_NAMES) {
    const def = BAR_DEFS[name];
    const bar = bars[name];
    const effMax = getEffectiveMax(bar);
    if (bar.current < effMax) {
      bar.current = Math.min(effMax, bar.current + def.regenRate * stateMulti * earlyFightBonus * 0.016);
    }
  }

  if (fighter.barStunned && !fighter.knockdown) {
    const depBar = bars[fighter.barStunnedBar];
    if (depBar) {
      const effMax = getEffectiveMax(depBar);
      if (depBar.current >= effMax * STUN_THRESHOLD_PCT) {
        fighter.barStunned = false;
        fighter.barStunnedBar = null;
      }
    }
  }
}

export function applyBarDamage(bars, barName, amount) {
  if (!bars[barName]) return;
  bars[barName].current = Math.max(0, bars[barName].current - amount);
}

export function getBarPercent(bars, barName) {
  const bar = bars[barName];
  if (!bar) return 1;
  return bar.current / getEffectiveMax(bar);
}

export function getBurnPercent(bars, barName) {
  const bar = bars[barName];
  if (!bar) return 0;
  return bar.burned / bar.max;
}

export const IDLE_BOUNCE = {
  amplitude: 2,
  frequency: 1.5,
  framesPerCycle: 60,
};

export function getIdleBounceY(time) {
  return Math.sin((time / IDLE_BOUNCE.framesPerCycle) * Math.PI * 2 * IDLE_BOUNCE.frequency) * IDLE_BOUNCE.amplitude;
}

export const MOUSE_GLOVE = {
  leashRadius: 14 * DRAW_SCALE,
  cursorSize: 18,
  punchZones: {
    jab:         { minRange: 4 * DRAW_SCALE, maxRange: 10 * DRAW_SCALE },
    steppingJab: { minRange: 8 * DRAW_SCALE, maxRange: 14 * DRAW_SCALE },
    dashingJab:  { minRange: 10 * DRAW_SCALE, maxRange: 16 * DRAW_SCALE },
  },
  blockIndicator: {
    glowRadius: 8 * DRAW_SCALE,
    warningFlashSpeed: 0.25,
  },
};

export const MOMENTUM = {
  specialMeterMax: 100,
  buildRate: {
    punchHit: 6,
    blockSuccess: 14,
    takeDamage: -2,
    critHit: 12,
  },
  decayRate: 0.35,
  switchBonus: {
    meterGain: 25,
    speedBoostFrames: 120,
    damageMultiplier: 1.3,
  },
};

export function getPunchType(fighter, mouseX, mouseY, isDashing) {
  const dx = mouseX - fighter.x;
  const dy = mouseY - (fighter.y - DRAW_H * 0.4);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (isDashing) return 'cross';
  if (dist > MOUSE_GLOVE.leashRadius * 0.6) return 'hook';
  return 'jab';
}

export function clampGlovePosition(fighterX, fighterY, mouseX, mouseY) {
  const anchorY = fighterY - DRAW_H * 0.4;
  const dx = mouseX - fighterX;
  const dy = mouseY - anchorY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= MOUSE_GLOVE.leashRadius) {
    return { x: mouseX, y: mouseY };
  }

  const ratio = MOUSE_GLOVE.leashRadius / dist;
  return {
    x: fighterX + dx * ratio,
    y: anchorY + dy * ratio,
  };
}
