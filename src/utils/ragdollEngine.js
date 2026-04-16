import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Composite, Constraint, Events } = Matter;

const SEGMENT = {
  head:      { w: 18, h: 18, mass: 1.2 },
  torso:     { w: 22, h: 30, mass: 3.0 },
  upperArmL: { w: 8,  h: 18, mass: 0.6 },
  upperArmR: { w: 8,  h: 18, mass: 0.6 },
  lowerArmL: { w: 6,  h: 16, mass: 0.4 },
  lowerArmR: { w: 6,  h: 16, mass: 0.4 },
  upperLegL: { w: 10, h: 20, mass: 0.8 },
  upperLegR: { w: 10, h: 20, mass: 0.8 },
  lowerLegL: { w: 8,  h: 18, mass: 0.5 },
  lowerLegR: { w: 8,  h: 18, mass: 0.5 },
};

const JOINT_STIFFNESS = 0.4;
const JOINT_DAMPING = 0.3;
const LIMB_FRICTION = 0.3;
const LIMB_RESTITUTION = 0.2;

function createSegment(x, y, seg, label, color) {
  return Bodies.rectangle(x, y, seg.w, seg.h, {
    mass: seg.mass,
    friction: LIMB_FRICTION,
    restitution: LIMB_RESTITUTION,
    label,
    render: { fillStyle: color },
    collisionFilter: { group: -1 },
  });
}

function joint(bodyA, bodyB, offA, offB, stiffness = JOINT_STIFFNESS) {
  return Constraint.create({
    bodyA, bodyB,
    pointA: offA,
    pointB: offB,
    stiffness,
    damping: JOINT_DAMPING,
    length: 0,
  });
}

export function createRagdoll(x, y, scale = 1.0, color = '#e2e8f0') {
  const s = scale;
  const parts = {};
  const S = SEGMENT;

  parts.torso = createSegment(x, y, S.torso, 'torso', color);
  parts.head = createSegment(x, y - (S.torso.h / 2 + S.head.h / 2) * s, S.head, 'head', color);

  parts.upperArmL = createSegment(x - (S.torso.w / 2 + S.upperArmL.w / 2) * s, y - S.torso.h * 0.3 * s, S.upperArmL, 'upperArmL', color);
  parts.upperArmR = createSegment(x + (S.torso.w / 2 + S.upperArmR.w / 2) * s, y - S.torso.h * 0.3 * s, S.upperArmR, 'upperArmR', color);
  parts.lowerArmL = createSegment(x - (S.torso.w / 2 + S.upperArmL.w + S.lowerArmL.w / 2) * s, y - S.torso.h * 0.3 * s, S.lowerArmL, 'lowerArmL', color);
  parts.lowerArmR = createSegment(x + (S.torso.w / 2 + S.upperArmR.w + S.lowerArmR.w / 2) * s, y - S.torso.h * 0.3 * s, S.lowerArmR, 'lowerArmR', color);

  parts.upperLegL = createSegment(x - S.torso.w * 0.2 * s, y + (S.torso.h / 2 + S.upperLegL.h / 2) * s, S.upperLegL, 'upperLegL', color);
  parts.upperLegR = createSegment(x + S.torso.w * 0.2 * s, y + (S.torso.h / 2 + S.upperLegR.h / 2) * s, S.upperLegR, 'upperLegR', color);
  parts.lowerLegL = createSegment(x - S.torso.w * 0.2 * s, y + (S.torso.h / 2 + S.upperLegL.h + S.lowerLegL.h / 2) * s, S.lowerLegL, 'lowerLegL', color);
  parts.lowerLegR = createSegment(x + S.torso.w * 0.2 * s, y + (S.torso.h / 2 + S.upperLegR.h + S.lowerLegR.h / 2) * s, S.lowerLegR, 'lowerLegR', color);

  const joints = [];

  joints.push(joint(parts.torso, parts.head,
    { x: 0, y: -S.torso.h / 2 * s }, { x: 0, y: S.head.h / 2 * s }));

  joints.push(joint(parts.torso, parts.upperArmL,
    { x: -S.torso.w / 2 * s, y: -S.torso.h * 0.3 * s }, { x: S.upperArmL.w / 2 * s, y: 0 }));
  joints.push(joint(parts.torso, parts.upperArmR,
    { x: S.torso.w / 2 * s, y: -S.torso.h * 0.3 * s }, { x: -S.upperArmR.w / 2 * s, y: 0 }));

  joints.push(joint(parts.upperArmL, parts.lowerArmL,
    { x: -S.upperArmL.w / 2 * s, y: 0 }, { x: S.lowerArmL.w / 2 * s, y: 0 }, 0.3));
  joints.push(joint(parts.upperArmR, parts.lowerArmR,
    { x: S.upperArmR.w / 2 * s, y: 0 }, { x: -S.lowerArmR.w / 2 * s, y: 0 }, 0.3));

  joints.push(joint(parts.torso, parts.upperLegL,
    { x: -S.torso.w * 0.2 * s, y: S.torso.h / 2 * s }, { x: 0, y: -S.upperLegL.h / 2 * s }));
  joints.push(joint(parts.torso, parts.upperLegR,
    { x: S.torso.w * 0.2 * s, y: S.torso.h / 2 * s }, { x: 0, y: -S.upperLegR.h / 2 * s }));

  joints.push(joint(parts.upperLegL, parts.lowerLegL,
    { x: 0, y: S.upperLegL.h / 2 * s }, { x: 0, y: -S.lowerLegL.h / 2 * s }, 0.3));
  joints.push(joint(parts.upperLegR, parts.lowerLegR,
    { x: 0, y: S.upperLegR.h / 2 * s }, { x: 0, y: -S.lowerLegR.h / 2 * s }, 0.3));

  return { parts, joints, scale: s, color, active: false, timer: 0, maxTimer: 180 };
}

export function createRagdollWorld(groundY, worldW = 960) {
  const engine = Engine.create({
    gravity: { x: 0, y: 1.8 },
  });
  const ground = Bodies.rectangle(worldW / 2, groundY + 30, worldW * 2, 60, {
    isStatic: true, friction: 0.8, restitution: 0.1,
    label: 'ground',
  });
  const wallL = Bodies.rectangle(-10, groundY - 200, 20, 600, { isStatic: true, label: 'wallL' });
  const wallR = Bodies.rectangle(worldW + 10, groundY - 200, 20, 600, { isStatic: true, label: 'wallR' });
  World.add(engine.world, [ground, wallL, wallR]);
  return engine;
}

export function addRagdollToWorld(engine, ragdoll) {
  const allBodies = Object.values(ragdoll.parts);
  World.add(engine.world, [...allBodies, ...ragdoll.joints]);
  ragdoll.active = true;
  ragdoll.timer = ragdoll.maxTimer;
}

export function launchRagdoll(ragdoll, impactX, impactY, forceX, forceY) {
  const torso = ragdoll.parts.torso;
  Body.applyForce(torso, { x: impactX, y: impactY }, { x: forceX * 0.015, y: forceY * 0.015 });
  Body.applyForce(ragdoll.parts.head, ragdoll.parts.head.position, { x: forceX * 0.008, y: forceY * 0.012 });
  const armForce = forceX * 0.005;
  Body.applyForce(ragdoll.parts.upperArmL, ragdoll.parts.upperArmL.position, { x: -armForce, y: -Math.abs(forceY) * 0.003 });
  Body.applyForce(ragdoll.parts.upperArmR, ragdoll.parts.upperArmR.position, { x: armForce, y: -Math.abs(forceY) * 0.003 });
  Body.setAngularVelocity(torso, forceX * 0.03);
}

export function updateRagdollWorld(engine, dt = 1000 / 60) {
  Engine.update(engine, dt);
}

export function removeRagdollFromWorld(engine, ragdoll) {
  const allBodies = Object.values(ragdoll.parts);
  World.remove(engine.world, [...allBodies, ...ragdoll.joints]);
  ragdoll.active = false;
}

export function drawRagdoll(ctx, ragdoll, fighterColor, accentColor, time) {
  if (!ragdoll.active) return;

  const p = ragdoll.parts;
  const alpha = Math.min(1, ragdoll.timer / 30);
  ctx.save();
  ctx.globalAlpha = alpha;

  const darkColor = accentColor || fighterColor || '#e2e8f0';
  const lightColor = fighterColor || '#94a3b8';
  const skinColor = '#d4a574';

  drawLimb(ctx, p.upperLegL, SEGMENT.upperLegL, darkColor);
  drawLimb(ctx, p.lowerLegL, SEGMENT.lowerLegL, darkColor);
  drawLimb(ctx, p.upperLegR, SEGMENT.upperLegR, darkColor);
  drawLimb(ctx, p.lowerLegR, SEGMENT.lowerLegR, darkColor);

  drawLimb(ctx, p.upperArmL, SEGMENT.upperArmL, lightColor);
  drawLimb(ctx, p.lowerArmL, SEGMENT.lowerArmL, skinColor);

  drawLimb(ctx, p.torso, SEGMENT.torso, lightColor);

  drawLimb(ctx, p.upperArmR, SEGMENT.upperArmR, lightColor);
  drawLimb(ctx, p.lowerArmR, SEGMENT.lowerArmR, skinColor);

  ctx.save();
  ctx.translate(p.head.position.x, p.head.position.y);
  ctx.rotate(p.head.angle);
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 0, SEGMENT.head.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const eyeOff = SEGMENT.head.w * 0.2;
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(-eyeOff, -2, 2, 0, Math.PI * 2);
  ctx.arc(eyeOff, -2, 2, 0, Math.PI * 2);
  ctx.fill();

  if (time && Math.floor(time / 30) % 3 === 0) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('×', -eyeOff, 0);
    ctx.fillText('×', eyeOff, 0);
  }
  ctx.restore();

  ctx.restore();
}

function drawLimb(ctx, body, segDef, color) {
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;

  const hw = segDef.w / 2;
  const hh = segDef.h / 2;
  const r = Math.min(hw, hh) * 0.4;
  ctx.beginPath();
  ctx.moveTo(-hw + r, -hh);
  ctx.lineTo(hw - r, -hh);
  ctx.quadraticCurveTo(hw, -hh, hw, -hh + r);
  ctx.lineTo(hw, hh - r);
  ctx.quadraticCurveTo(hw, hh, hw - r, hh);
  ctx.lineTo(-hw + r, hh);
  ctx.quadraticCurveTo(-hw, hh, -hw, hh - r);
  ctx.lineTo(-hw, -hh + r);
  ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function getRagdollCenter(ragdoll) {
  const t = ragdoll.parts.torso;
  return { x: t.position.x, y: t.position.y };
}

export function isRagdollSettled(ragdoll) {
  const t = ragdoll.parts.torso;
  const speed = Math.sqrt(t.velocity.x ** 2 + t.velocity.y ** 2);
  return speed < 0.3 && Math.abs(t.angularVelocity) < 0.05;
}

export const FLASH_STEP = {
  DASH_DISTANCE: 120,
  AFTERIMAGE_COUNT: 5,
  AFTERIMAGE_SPACING: 3,
  TRAIL_DURATION: 12,
  SPEED_LINES_COUNT: 8,
};

export function createFlashStep(fighter, targetX, targetY, color) {
  const dx = targetX - fighter.x;
  const dy = targetY - fighter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = FLASH_STEP.AFTERIMAGE_COUNT;

  const afterimages = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    afterimages.push({
      x: fighter.x + dx * t,
      y: fighter.y + dy * t,
      alpha: 0.6 - t * 0.5,
      life: FLASH_STEP.TRAIL_DURATION + i * FLASH_STEP.AFTERIMAGE_SPACING,
      maxLife: FLASH_STEP.TRAIL_DURATION + steps * FLASH_STEP.AFTERIMAGE_SPACING,
      frame: fighter.frame,
      anim: fighter.anim,
      facingRight: fighter.facingRight,
      scale: 1.0 - t * 0.15,
      color,
    });
  }

  const speedLines = [];
  const angle = Math.atan2(dy, dx);
  for (let i = 0; i < FLASH_STEP.SPEED_LINES_COUNT; i++) {
    const spread = (Math.random() - 0.5) * 0.8;
    const lineAngle = angle + spread;
    const startDist = Math.random() * dist * 0.8;
    speedLines.push({
      x: fighter.x + Math.cos(lineAngle) * startDist,
      y: fighter.y + Math.sin(lineAngle) * startDist - FLASH_STEP.DASH_DISTANCE * 0.3,
      angle: lineAngle,
      length: 15 + Math.random() * 25,
      life: 8 + Math.floor(Math.random() * 6),
      maxLife: 14,
      color,
      width: 1 + Math.random() * 2,
    });
  }

  return { afterimages, speedLines, impactFlash: { x: targetX, y: targetY, life: 10, maxLife: 10, color } };
}

export function drawFlashStep(ctx, flashData, time) {
  if (!flashData) return;

  const { afterimages, speedLines, impactFlash } = flashData;

  afterimages.forEach(img => {
    if (img.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = img.alpha * (img.life / img.maxLife);
    ctx.fillStyle = img.color || '#22d3ee';
    ctx.shadowColor = img.color || '#22d3ee';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(img.x, img.y - 50, 14 * img.scale, 40 * img.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  speedLines.forEach(line => {
    if (line.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = line.life / line.maxLife;
    ctx.strokeStyle = line.color || '#22d3ee';
    ctx.lineWidth = line.width;
    ctx.shadowColor = line.color || '#22d3ee';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(
      line.x + Math.cos(line.angle) * line.length,
      line.y + Math.sin(line.angle) * line.length
    );
    ctx.stroke();
    ctx.restore();
  });

  if (impactFlash && impactFlash.life > 0) {
    const t = impactFlash.life / impactFlash.maxLife;
    ctx.save();
    ctx.globalAlpha = t * 0.8;
    const grad = ctx.createRadialGradient(
      impactFlash.x, impactFlash.y, 0,
      impactFlash.x, impactFlash.y, 40 * (1 - t) + 10
    );
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.3, impactFlash.color || '#22d3ee');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(impactFlash.x - 50, impactFlash.y - 50, 100, 100);
    ctx.restore();
  }
}

export function updateFlashStep(flashData) {
  if (!flashData) return false;
  let alive = false;
  flashData.afterimages.forEach(img => { if (img.life > 0) { img.life--; alive = true; } });
  flashData.speedLines.forEach(l => { if (l.life > 0) { l.life--; alive = true; } });
  if (flashData.impactFlash && flashData.impactFlash.life > 0) { flashData.impactFlash.life--; alive = true; }
  return alive;
}

export const CAST_TYPES = {
  charge: { name: 'Charge', particleCount: 20, ringCount: 2, duration: 45, color: '#a855f7' },
  fire: { name: 'Fire Release', particleCount: 30, ringCount: 3, duration: 35, color: '#f97316' },
  ice: { name: 'Ice Burst', particleCount: 25, ringCount: 2, duration: 40, color: '#22d3ee' },
  dark: { name: 'Shadow Cast', particleCount: 15, ringCount: 4, duration: 50, color: '#6b21a8' },
  lightning: { name: 'Thunder', particleCount: 35, ringCount: 1, duration: 25, color: '#fbbf24' },
  heal: { name: 'Restoration', particleCount: 20, ringCount: 3, duration: 55, color: '#22c55e' },
};

export function createCastEffect(x, y, castType = 'charge', scale = 1.0) {
  const config = CAST_TYPES[castType] || CAST_TYPES.charge;
  const particles = [];
  for (let i = 0; i < config.particleCount; i++) {
    const angle = (Math.PI * 2 * i) / config.particleCount;
    const dist = 30 + Math.random() * 60;
    particles.push({
      x: x + Math.cos(angle) * dist * scale,
      y: y + Math.sin(angle) * dist * scale,
      targetX: x,
      targetY: y,
      angle,
      dist: dist * scale,
      speed: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
    });
  }

  const rings = [];
  for (let i = 0; i < config.ringCount; i++) {
    rings.push({
      radius: 5 + i * 15 * scale,
      maxRadius: 60 + i * 20 * scale,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (0.05 + Math.random() * 0.05) * (i % 2 === 0 ? 1 : -1),
      dashOffset: i * 10,
      width: 1.5 + i * 0.5,
    });
  }

  return {
    x, y, particles, rings,
    color: config.color,
    timer: 0,
    duration: config.duration,
    castType,
    scale,
    phase: 'converge',
    burstTimer: 0,
  };
}

export function updateCastEffect(effect) {
  if (!effect) return false;
  effect.timer++;

  const progress = effect.timer / effect.duration;

  if (progress < 0.7) {
    effect.phase = 'converge';
    effect.particles.forEach(p => {
      const t = progress / 0.7;
      const convergeDist = p.dist * (1 - t * t);
      p.x = effect.x + Math.cos(p.angle + p.phase + effect.timer * 0.05) * convergeDist;
      p.y = effect.y + Math.sin(p.angle + p.phase + effect.timer * 0.05) * convergeDist;
      p.size = (2 + Math.random() * 4) * (1 + t * 0.5);
    });
    effect.rings.forEach(r => {
      r.rotation += r.rotSpeed;
      r.radius = r.maxRadius * (1 - progress / 0.7 * 0.6);
    });
  } else if (progress < 0.85) {
    effect.phase = 'hold';
    const pulse = Math.sin(effect.timer * 0.5) * 3;
    effect.particles.forEach(p => {
      p.x = effect.x + Math.cos(p.angle + effect.timer * 0.1) * (5 + pulse);
      p.y = effect.y + Math.sin(p.angle + effect.timer * 0.1) * (5 + pulse);
      p.size *= 1.02;
    });
  } else {
    effect.phase = 'burst';
    effect.burstTimer++;
    const burstT = (progress - 0.85) / 0.15;
    effect.particles.forEach(p => {
      const burstDist = p.dist * burstT * 2;
      p.x = effect.x + Math.cos(p.angle + p.phase) * burstDist;
      p.y = effect.y + Math.sin(p.angle + p.phase) * burstDist;
      p.size *= 0.95;
    });
    effect.rings.forEach(r => {
      r.radius = r.maxRadius * burstT * 1.5;
    });
  }

  return effect.timer < effect.duration;
}

export function drawCastEffect(ctx, effect, time) {
  if (!effect || effect.timer >= effect.duration) return;

  const progress = effect.timer / effect.duration;
  const alpha = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : Math.min(1, progress * 3);

  ctx.save();
  ctx.globalAlpha = alpha;

  effect.rings.forEach(ring => {
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(ring.rotation);
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = ring.width;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur = 8;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = ring.dashOffset + time * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  effect.particles.forEach(p => {
    ctx.fillStyle = effect.color;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur = p.size * 2;
    ctx.globalAlpha = alpha * (0.5 + Math.sin(p.phase + time * 0.1) * 0.3);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  if (effect.phase === 'hold' || effect.phase === 'burst') {
    const coreSize = effect.phase === 'burst' ? 8 + effect.burstTimer * 3 : 6 + Math.sin(time * 0.3) * 3;
    const coreAlpha = effect.phase === 'burst' ? alpha * 0.5 : alpha * 0.8;
    ctx.globalAlpha = coreAlpha;
    const grad = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, coreSize);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, effect.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(effect.x - coreSize, effect.y - coreSize, coreSize * 2, coreSize * 2);
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

export const WEAPON_DEFS = {
  broadsword: { name: 'Broadsword', length: 80, width: 12, hiltW: 20, pommelR: 4, color: '#94a3b8', edgeColor: '#e2e8f0', glowColor: '#22d3ee', trailLen: 6 },
  greataxe: { name: 'Great Axe', length: 70, width: 18, hiltW: 8, pommelR: 3, color: '#78716c', edgeColor: '#a8a29e', glowColor: '#f97316', trailLen: 5, axeHead: true },
  katana: { name: 'Katana', length: 90, width: 6, hiltW: 16, pommelR: 3, color: '#d4d4d8', edgeColor: '#fff', glowColor: '#a855f7', trailLen: 8 },
  warhammer: { name: 'War Hammer', length: 65, width: 14, hiltW: 10, pommelR: 5, color: '#57534e', edgeColor: '#a8a29e', glowColor: '#ef4444', trailLen: 4, hammerHead: true },
  staff: { name: 'Arcane Staff', length: 100, width: 8, hiltW: 6, pommelR: 6, color: '#7e22ce', edgeColor: '#c084fc', glowColor: '#a855f7', trailLen: 7, orbTop: true },
  scythe: { name: 'Scythe', length: 95, width: 6, hiltW: 8, pommelR: 3, color: '#374151', edgeColor: '#9ca3af', glowColor: '#22c55e', trailLen: 6, scytheBlade: true },
};

export function createWeaponState(weaponType = 'broadsword') {
  const def = WEAPON_DEFS[weaponType] || WEAPON_DEFS.broadsword;
  return {
    type: weaponType,
    def,
    angle: -30,
    targetAngle: -30,
    swingTimer: 0,
    swingDuration: 0,
    swingDir: 1,
    trail: [],
    glow: 0,
    equipped: true,
  };
}

export function startWeaponSwing(weapon, swingType = 'slash') {
  if (weapon.swingTimer > 0) return;
  if (swingType === 'slash') {
    weapon.targetAngle = 120;
    weapon.swingDuration = 12;
    weapon.swingDir = 1;
  } else if (swingType === 'overhead') {
    weapon.targetAngle = 180;
    weapon.swingDuration = 18;
    weapon.swingDir = 1;
  } else if (swingType === 'thrust') {
    weapon.targetAngle = 0;
    weapon.swingDuration = 8;
    weapon.swingDir = 0;
  }
  weapon.swingTimer = weapon.swingDuration;
  weapon.glow = 1.0;
}

export function updateWeapon(weapon) {
  if (!weapon) return;
  if (weapon.swingTimer > 0) {
    weapon.swingTimer--;
    const progress = 1 - weapon.swingTimer / weapon.swingDuration;
    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    if (weapon.swingDir === 1) {
      weapon.angle = -60 + (weapon.targetAngle + 60) * ease;
    } else {
      weapon.angle = -30;
    }

    if (weapon.swingTimer <= 0) {
      weapon.angle = -30;
    }
  }

  weapon.glow *= 0.92;

  const tipX = Math.cos((weapon.angle - 90) * Math.PI / 180) * weapon.def.length;
  const tipY = Math.sin((weapon.angle - 90) * Math.PI / 180) * weapon.def.length;
  weapon.trail.unshift({ x: tipX, y: tipY, alpha: 1.0 });
  if (weapon.trail.length > weapon.def.trailLen) weapon.trail.pop();
  weapon.trail.forEach((t, i) => { t.alpha = 1 - i / weapon.def.trailLen; });
}

export function drawWeapon(ctx, weapon, fighterX, fighterY, facingRight, drawScale, time) {
  if (!weapon || !weapon.equipped) return;
  const def = weapon.def;
  const dir = facingRight ? 1 : -1;
  const anchorX = fighterX + dir * drawScale * 8;
  const anchorY = fighterY - drawScale * 18;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.scale(dir, 1);
  ctx.rotate((weapon.angle - 90) * Math.PI / 180);

  if (weapon.trail.length > 1 && weapon.swingTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = def.glowColor;
    ctx.lineWidth = def.width * 0.8;
    ctx.lineCap = 'round';
    ctx.shadowColor = def.glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -def.hiltW);
    weapon.trail.forEach((t, i) => {
      if (i === 0) return;
      ctx.lineTo(t.x * 0.5, t.y * 0.5 - def.hiltW);
    });
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = '#4a3728';
  ctx.fillRect(-def.hiltW / 2, -4, def.hiltW, 8);

  ctx.beginPath();
  ctx.arc(0, 4, def.pommelR, 0, Math.PI * 2);
  ctx.fillStyle = def.glowColor;
  ctx.fill();

  const grad = ctx.createLinearGradient(-def.width / 2, -def.length, def.width / 2, -8);
  grad.addColorStop(0, def.edgeColor);
  grad.addColorStop(0.5, def.color);
  grad.addColorStop(1, def.edgeColor);

  if (def.axeHead) {
    ctx.fillStyle = grad;
    ctx.fillRect(-3, -def.length * 0.4, 6, def.length * 0.4 - 8);
    ctx.beginPath();
    ctx.moveTo(0, -def.length);
    ctx.lineTo(-def.width, -def.length * 0.65);
    ctx.lineTo(-def.width * 0.3, -def.length * 0.4);
    ctx.lineTo(3, -def.length * 0.4);
    ctx.lineTo(3, -def.length * 0.95);
    ctx.closePath();
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.strokeStyle = def.edgeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (def.hammerHead) {
    ctx.fillStyle = def.color;
    ctx.fillRect(-3, -def.length * 0.4, 6, def.length * 0.4 - 8);
    ctx.fillRect(-def.width, -def.length, def.width * 2, def.width * 1.2);
    ctx.strokeStyle = def.edgeColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-def.width, -def.length, def.width * 2, def.width * 1.2);
  } else if (def.orbTop) {
    ctx.fillStyle = def.color;
    ctx.fillRect(-def.width / 2, -def.length + 10, def.width, def.length - 18);
    ctx.beginPath();
    ctx.arc(0, -def.length, def.pommelR * 2.5, 0, Math.PI * 2);
    const orbGrad = ctx.createRadialGradient(0, -def.length, 0, 0, -def.length, def.pommelR * 2.5);
    orbGrad.addColorStop(0, '#fff');
    orbGrad.addColorStop(0.5, def.glowColor);
    orbGrad.addColorStop(1, def.color);
    ctx.fillStyle = orbGrad;
    ctx.fill();
    ctx.shadowColor = def.glowColor;
    ctx.shadowBlur = 12 + Math.sin(time * 0.1) * 6;
    ctx.stroke();
  } else if (def.scytheBlade) {
    ctx.fillStyle = def.color;
    ctx.fillRect(-def.width / 2, -def.length + 20, def.width, def.length - 28);
    ctx.beginPath();
    ctx.moveTo(0, -def.length);
    ctx.quadraticCurveTo(def.width * 3, -def.length + 10, def.width * 2.5, -def.length + 35);
    ctx.quadraticCurveTo(def.width * 1.5, -def.length + 25, 0, -def.length + 15);
    ctx.closePath();
    ctx.fillStyle = def.edgeColor;
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -def.length);
    ctx.lineTo(-def.width / 2, -def.length + 8);
    ctx.lineTo(-def.width / 2, -8);
    ctx.lineTo(def.width / 2, -8);
    ctx.lineTo(def.width / 2, -def.length + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  if (weapon.glow > 0.05) {
    ctx.save();
    ctx.globalAlpha = weapon.glow * 0.5;
    ctx.shadowColor = def.glowColor;
    ctx.shadowBlur = 20 * weapon.glow;
    ctx.strokeStyle = def.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -def.length);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function getWeaponHitbox(weapon, fighterX, fighterY, facingRight, drawScale) {
  if (!weapon || weapon.swingTimer <= 0) return null;
  const def = weapon.def;
  const dir = facingRight ? 1 : -1;
  const rad = (weapon.angle - 90) * Math.PI / 180;
  const anchorX = fighterX + dir * drawScale * 8;
  const anchorY = fighterY - drawScale * 18;
  const tipX = anchorX + Math.cos(rad) * def.length * dir;
  const tipY = anchorY + Math.sin(rad) * def.length;
  return {
    x: (anchorX + tipX) / 2,
    y: (anchorY + tipY) / 2,
    w: Math.abs(tipX - anchorX) + def.width * 2,
    h: Math.abs(tipY - anchorY) + def.width * 2,
    tipX, tipY,
  };
}
