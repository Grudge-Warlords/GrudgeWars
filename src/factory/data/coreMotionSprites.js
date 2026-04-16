const BASE = '/sprites/coremotion';

export const COREMOTION_ANIMS = {
  idle:    { src: `${BASE}/Walking.png`,              frames: 12, frameWidth: 128, frameHeight: 128 },
  walk:    { src: `${BASE}/Running.png`,              frames: 12, frameWidth: 128, frameHeight: 128 },
  attack1: { src: `${BASE}/Strike.png`,               frames: 3,  frameWidth: 128, frameHeight: 128 },
  hurt:    { src: `${BASE}/Falling.png`,              frames: 4,  frameWidth: 128, frameHeight: 128 },
  death:   { src: `${BASE}/LandingImpact.png`,        frames: 6,  frameWidth: 128, frameHeight: 128 },
  cast:    { src: `${BASE}/Crouch.png`,               frames: 3,  frameWidth: 128, frameHeight: 128 },
  roll:    { src: `${BASE}/Roll.png`,                 frames: 9,  frameWidth: 128, frameHeight: 128 },
};

export const WEAPON_TYPES = {
  sword:   { blade: 22, hilt: 6, color: '#94a3b8', accentColor: '#475569', shape: 'blade' },
  axe:     { blade: 18, hilt: 8, color: '#78716c', accentColor: '#57534e', shape: 'axe' },
  staff:   { blade: 28, hilt: 4, color: '#a78bfa', accentColor: '#7c3aed', shape: 'staff' },
  dagger:  { blade: 14, hilt: 5, color: '#e2e8f0', accentColor: '#64748b', shape: 'blade' },
  bow:     { blade: 20, hilt: 0, color: '#92400e', accentColor: '#78350f', shape: 'bow' },
  mace:    { blade: 16, hilt: 7, color: '#6b7280', accentColor: '#374151', shape: 'mace' },
  scythe:  { blade: 24, hilt: 8, color: '#1e1b4b', accentColor: '#a855f7', shape: 'scythe' },
  fists:   { blade: 0,  hilt: 0, color: '#fbbf24', accentColor: '#f59e0b', shape: 'fists' },
};

const CLASS_WEAPONS = {
  warrior: 'sword', knight: 'sword', paladin: 'sword', shadowblade: 'dagger',
  fighter: 'sword', berserker: 'axe', barbarian: 'axe', lumberjack: 'axe',
  mage: 'staff', wizard: 'staff', sorcerer: 'staff', necromancer: 'staff',
  warlock: 'staff', veilweaver: 'staff', doomcaller: 'staff', technomancer: 'staff',
  healer: 'staff', cleric: 'staff', priest: 'staff', druid: 'staff', shaman: 'staff',
  rogue: 'dagger', thief: 'dagger', assassin: 'dagger', ninja: 'dagger', scout: 'dagger',
  ranger: 'bow', archer: 'bow', hunter: 'bow', gunslinger: 'bow', marksman: 'bow',
  monk: 'fists', brawler: 'fists', pugilist: 'fists',
  reaper: 'scythe', death_knight: 'scythe',
  tank: 'mace', guardian: 'mace', sentinel: 'mace', vanguard: 'mace',
  emberknight: 'sword', riftwalker: 'dagger',
};

const CLASS_TINTS = {
  warrior: 0, knight: 20, paladin: 45, emberknight: 10,
  mage: 240, wizard: 220, sorcerer: 270, necromancer: 180,
  rogue: 30, thief: 35, assassin: 300, ninja: 280, shadowblade: 280,
  ranger: 100, archer: 90, hunter: 80, gunslinger: 160,
  healer: 120, cleric: 60, priest: 50, druid: 110,
  berserker: 350, barbarian: 15, monk: 40, brawler: 25,
  tank: 200, guardian: 190, vanguard: 170, sentinel: 210,
  reaper: 290, death_knight: 310, doomcaller: 260, veilweaver: 250,
  technomancer: 195, riftwalker: 145, warlock: 275, shaman: 130,
};

function canon(s) {
  return (s || '').toLowerCase().replace(/[\s_\-]+/g, '');
}

export function getWeaponForClass(classId) {
  const key = canon(classId);
  for (const [cls, weapon] of Object.entries(CLASS_WEAPONS)) {
    const c = canon(cls);
    if (key.includes(c) || c.includes(key)) return WEAPON_TYPES[weapon];
  }
  const h = hashStr(key);
  const weapons = Object.values(WEAPON_TYPES);
  return weapons[h % weapons.length];
}

export function getTintForClass(classId) {
  const key = canon(classId);
  for (const [cls, hue] of Object.entries(CLASS_TINTS)) {
    const c = canon(cls);
    if (key.includes(c) || c.includes(key)) return hue;
  }
  return hashStr(key) % 360;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function drawWeapon(ctx, weapon, x, y, angle, scale = 1) {
  if (!weapon || weapon.shape === 'fists') return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const { blade, hilt, color, accentColor, shape } = weapon;

  if (shape === 'blade') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-2, -hilt, 4, hilt);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-2.5, -hilt);
    ctx.lineTo(-1.5, -hilt - blade);
    ctx.lineTo(0, -hilt - blade - 3);
    ctx.lineTo(1.5, -hilt - blade);
    ctx.lineTo(2.5, -hilt);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-0.5, -hilt - blade + 2, 1, blade - 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = accentColor;
    ctx.fillRect(-5, -hilt, 10, 3);
  } else if (shape === 'axe') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-2, -hilt, 4, hilt + 4);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-2, -hilt - blade * 0.3);
    ctx.quadraticCurveTo(-blade * 0.6, -hilt - blade * 0.7, -blade * 0.5, -hilt - blade);
    ctx.lineTo(0, -hilt - blade * 0.4);
    ctx.lineTo(2, -hilt - blade * 0.3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(-blade * 0.3, -hilt - blade * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (shape === 'staff') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-2, -hilt, 4, hilt + blade);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -hilt - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, -hilt - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (shape === 'bow') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, blade * 0.8, -Math.PI * 0.7, Math.PI * 0.7, false);
    ctx.stroke();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const bowR = blade * 0.8;
    ctx.moveTo(Math.cos(-Math.PI * 0.7) * bowR, Math.sin(-Math.PI * 0.7) * bowR);
    ctx.lineTo(Math.cos(Math.PI * 0.7) * bowR, Math.sin(Math.PI * 0.7) * bowR);
    ctx.stroke();
  } else if (shape === 'mace') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-2, -hilt, 4, hilt + 6);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -hilt - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const sa = (i / 4) * Math.PI * 2;
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * 8, -hilt - 4 + Math.sin(sa) * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'scythe') {
    ctx.fillStyle = accentColor;
    ctx.fillRect(-2, -hilt, 4, hilt + blade * 0.8);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -hilt - blade * 0.3);
    ctx.quadraticCurveTo(blade * 0.8, -hilt - blade, blade * 0.6, -hilt - blade * 0.2);
    ctx.lineTo(0, -hilt);
    ctx.fill();
  }

  ctx.restore();
}

export function getWeaponAttachPoint(animType, frame, fw, fh) {
  const cx = fw * 0.55;
  const handY = fh * 0.45;

  if (animType === 'attack1' || animType === 'attack2') {
    const t = Math.min(frame / Math.max(2, 2), 1);
    return {
      x: cx + 15 * Math.sin(t * Math.PI),
      y: handY - 10 * Math.sin(t * Math.PI),
      angle: -Math.PI * 0.3 + Math.PI * 0.8 * t,
    };
  }
  if (animType === 'cast') {
    return { x: cx + 5, y: handY - 15, angle: -Math.PI * 0.15 };
  }
  if (animType === 'hurt' || animType === 'death') {
    return { x: cx + 10, y: handY + 5, angle: Math.PI * 0.3 };
  }
  const bob = Math.sin(frame * 0.5) * 2;
  return { x: cx + 3, y: handY + bob, angle: -Math.PI * 0.1 };
}

export function buildCoreMotionSprite(classId) {
  const tintHue = getTintForClass(classId);
  const weapon = getWeaponForClass(classId);

  return {
    folder: classId || 'default',
    frameWidth: 128,
    frameHeight: 128,
    filter: `hue-rotate(${tintHue}deg) saturate(1.2) brightness(1.05)`,
    facesLeft: false,
    isCoreMotion: true,
    weapon,
    tintHue,
    ...COREMOTION_ANIMS,
  };
}
