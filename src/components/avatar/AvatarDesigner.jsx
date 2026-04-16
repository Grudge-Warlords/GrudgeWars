import React, { useState, useEffect, useRef, useCallback } from 'react';

export const SKIN_TONES = [
  { id: 'pale', color: '#FDDBB4', shadow: '#D4A574' },
  { id: 'light', color: '#F1C27D', shadow: '#C49A5C' },
  { id: 'medium', color: '#E0A860', shadow: '#B8834A' },
  { id: 'tan', color: '#C68642', shadow: '#9E6832' },
  { id: 'brown', color: '#8D5524', shadow: '#6B3E1A' },
  { id: 'dark', color: '#5C3310', shadow: '#3D220A' },
  { id: 'ashen', color: '#9CA3AF', shadow: '#6B7280' },
  { id: 'spectral', color: '#C4B5FD', shadow: '#8B5CF6' },
];

export const HAIR_STYLES = [
  { id: 'none', name: 'Bald' },
  { id: 'short', name: 'Short' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'long', name: 'Long' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'braids', name: 'Braids' },
  { id: 'afro', name: 'Afro' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1a1a2e' },
  { id: 'brown', color: '#6B3E1A' },
  { id: 'blonde', color: '#F5DEB3' },
  { id: 'red', color: '#C0392B' },
  { id: 'white', color: '#E8E8E8' },
  { id: 'blue', color: '#3B82F6' },
  { id: 'purple', color: '#8B5CF6' },
  { id: 'green', color: '#10B981' },
  { id: 'pink', color: '#EC4899' },
  { id: 'cyan', color: '#22D3EE' },
];

export const EYE_STYLES = [
  { id: 'normal', name: 'Normal' },
  { id: 'narrow', name: 'Narrow' },
  { id: 'wide', name: 'Wide' },
  { id: 'glowing', name: 'Glowing' },
  { id: 'cyber', name: 'Cyber' },
  { id: 'scar', name: 'Scarred' },
];

export const EYE_COLORS = [
  { id: 'brown', color: '#6B3E1A' },
  { id: 'blue', color: '#3B82F6' },
  { id: 'green', color: '#10B981' },
  { id: 'amber', color: '#F59E0B' },
  { id: 'red', color: '#EF4444' },
  { id: 'purple', color: '#A855F7' },
  { id: 'cyan', color: '#06B6D4' },
  { id: 'white', color: '#F1F5F9' },
];

export const ARMOR_SETS = [
  { id: 'none', name: 'Bare', bodyColor: null, accent: null },
  { id: 'leather', name: 'Leather', bodyColor: '#8B6914', accent: '#6B4F10' },
  { id: 'iron', name: 'Iron', bodyColor: '#9CA3AF', accent: '#6B7280' },
  { id: 'gold', name: 'Gold', bodyColor: '#F59E0B', accent: '#D97706' },
  { id: 'diamond', name: 'Diamond', bodyColor: '#22D3EE', accent: '#0891B2' },
  { id: 'shadow', name: 'Shadow', bodyColor: '#1E1B4B', accent: '#4C1D95' },
  { id: 'crimson', name: 'Crimson', bodyColor: '#991B1B', accent: '#7F1D1D' },
  { id: 'emerald', name: 'Emerald', bodyColor: '#065F46', accent: '#064E3B' },
  { id: 'plasma', name: 'Plasma', bodyColor: '#7C3AED', accent: '#6D28D9' },
  { id: 'grudge', name: 'Grudge Elite', bodyColor: '#050A18', accent: '#06B6D4' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'None' },
  { id: 'cape', name: 'Cape' },
  { id: 'scarf', name: 'Scarf' },
  { id: 'shoulder_pads', name: 'Shoulder Pads' },
  { id: 'belt', name: 'Belt' },
  { id: 'aura', name: 'Aura' },
];

export const ACCESSORY_COLORS = [
  { id: 'red', color: '#EF4444' },
  { id: 'blue', color: '#3B82F6' },
  { id: 'green', color: '#10B981' },
  { id: 'purple', color: '#A855F7' },
  { id: 'gold', color: '#F59E0B' },
  { id: 'cyan', color: '#22D3EE' },
  { id: 'white', color: '#F1F5F9' },
  { id: 'black', color: '#1E293B' },
];

export const BOOT_STYLES = [
  { id: 'sandals', name: 'Sandals' },
  { id: 'boots', name: 'Boots' },
  { id: 'armored', name: 'Armored' },
  { id: 'cyber', name: 'Cyber' },
];

export const DEFAULT_CONFIG = {
  skinTone: 'light',
  hairStyle: 'short',
  hairColor: 'brown',
  eyeStyle: 'normal',
  eyeColor: 'brown',
  armor: 'leather',
  accessory: 'none',
  accessoryColor: 'red',
  boots: 'boots',
  name: 'Warlord',
};

export function loadAvatarConfig() {
  try {
    const saved = localStorage.getItem('grudge_avatar');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (typeof merged.name !== 'string' || !merged.name) merged.name = DEFAULT_CONFIG.name;
      return merged;
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveAvatarConfig(config) {
  try { localStorage.setItem('grudge_avatar', JSON.stringify(config)); } catch {}
}

export const AVATAR_POSES = [
  { id: 'idle', name: 'Idle', icon: '🧍', frames: 4 },
  { id: 'run', name: 'Run', icon: '🏃', frames: 8 },
  { id: 'jump', name: 'Jump', icon: '🦘', frames: 8 },
  { id: 'punch', name: 'Punch', icon: '👊', frames: 8 },
  { id: 'kick', name: 'Kick', icon: '🦵', frames: 8 },
  { id: 'block', name: 'Block', icon: '🛡️', frames: 4 },
  { id: 'flex', name: 'Flex', icon: '💪', frames: 6 },
  { id: 'wave', name: 'Wave', icon: '👋', frames: 6 },
  { id: 'dodge', name: 'Dodge', icon: '💨', frames: 6 },
  { id: 'victory', name: 'Victory', icon: '🏆', frames: 6 },
];

function lerpFrames(arr, f) {
  const len = arr.length;
  const idx = f % len;
  const next = (idx + 1) % len;
  const t = (f % 1) || 0;
  return arr[idx] * (1 - t) + arr[next] * t;
}

export function getPoseOffsets(pose, frame, isSide) {
  const f = frame;
  const PI = Math.PI;
  switch (pose) {
    case 'idle': {
      const i = f % 4;
      const bob =     [ 0.0, -0.4, -0.2,  0.3][i];
      const breathe = [ 0.0,  0.15, 0.25, 0.08][i];
      const sway =    [ 0.0,  0.15, 0.0, -0.15][i];
      const kneeB =   [ 0.0,  0.1,  0.2,  0.1][i];
      return {
        bodyY: bob, headY: bob - breathe * 0.6,
        bodyX: sway,
        leftArmY: bob + breathe * 1.2, rightArmY: bob + breathe * 1.2,
        leftLegY: kneeB, rightLegY: kneeB,
        leftLegX: -0.15 + sway * 0.3, rightLegX: 0.15 + sway * 0.3,
        leftArmX: sway * 0.4, rightArmX: sway * 0.4,
        leftShoulderAngle: breathe * 0.15 + sway * 0.05,
        rightShoulderAngle: -breathe * 0.15 + sway * 0.05,
        leftElbowAngle: 0.08, rightElbowAngle: 0.08,
        shadowScale: 1,
      };
    }
    case 'run': {
      const i = f % 8;
      const legSwing =    [ 4.2,  3.0,  0.5, -2.0, -4.2, -3.0, -0.5,  2.0][i];
      const armSwing =    [-3.2, -2.0,  0.0,  2.0,  3.2,  2.0,  0.0, -2.0][i];
      const bounce =      [ 0.4, -1.6, -0.8,  0.5,  0.4, -1.6, -0.8,  0.5][i];
      const shoulderFwd = [ 0.8,  0.5,  0.0, -0.4, -0.8, -0.5,  0.0,  0.4][i];
      const elbowBend =   [ 0.9,  0.6,  0.3,  0.6,  0.9,  0.6,  0.3,  0.6][i];
      const bodyLean =    [ 0.5,  0.3,  0.0, -0.2, -0.5, -0.3,  0.0,  0.2][i];
      const hipDrop =     [ 0.3,  0.0, -0.1,  0.2,  0.3,  0.0, -0.1,  0.2][i];
      const kneeLift =    [ 0.5,  2.0,  0.8,  0.0,  0.5,  2.0,  0.8,  0.0][i];
      return {
        bodyY: bounce + hipDrop * 0.3, headY: bounce - 0.6 + hipDrop * 0.15,
        bodyX: bodyLean,
        leftArmY: armSwing * 0.9 + bounce, rightArmY: -armSwing * 0.9 + bounce,
        leftLegY: -(kneeLift + Math.abs(legSwing) * 0.4) * 0.5,
        rightLegY: -(kneeLift + Math.abs(-legSwing) * 0.4) * 0.3,
        leftLegX: legSwing * 0.45, rightLegX: -legSwing * 0.45,
        leftArmX: armSwing * 0.35, rightArmX: -armSwing * 0.35,
        leftShoulderAngle: shoulderFwd, rightShoulderAngle: -shoulderFwd,
        leftElbowAngle: elbowBend, rightElbowAngle: elbowBend,
        lean: isSide ? 1.8 : 0,
        shadowScale: bounce > 0 ? 0.7 : 0.9,
      };
    }
    case 'jump': {
      const i = f % 8;
      const h =           [ 0.8,  0.3, -1.5, -3.8, -5.2, -4.0, -1.8,  0.8][i];
      const armLift =     [ 0.5,  0.0, -1.5, -4.0, -5.0, -3.5, -1.0,  0.5][i];
      const legTuck =     [ 0.5,  0.0,  0.8,  2.0,  3.2,  2.0,  0.5,  0.5][i];
      const shoulderUp =  [ 0.2, -0.3, -0.8, -PI*0.55, -PI*0.75, -PI*0.45, -0.4, 0.2][i];
      const elbowBend =   [ 0.1,  0.3,  0.6,  1.0,  1.1,  0.8,  0.5,  0.1][i];
      const legSpread =   [ 0.3,  0.0,  0.4,  0.8,  1.2,  0.7,  0.3,  0.3][i];
      const crouchX =     [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0][i];
      return {
        bodyY: h, headY: h - 0.8,
        bodyX: crouchX,
        leftArmY: armLift - 1.5, rightArmY: armLift - 1.5,
        leftLegY: legTuck, rightLegY: legTuck,
        leftLegX: -legSpread, rightLegX: legSpread,
        leftArmX: -1.5, rightArmX: 1.5,
        leftShoulderAngle: shoulderUp, rightShoulderAngle: shoulderUp,
        leftElbowAngle: elbowBend, rightElbowAngle: elbowBend,
        shadowScale: Math.max(0.15, 1 + h * 0.12),
      };
    }
    case 'punch': {
      const i = f % 8;
      const shoulderAngles =  [-0.3, -0.8, -1.4, -1.0,  0.4,  1.5,  0.8,  0.0];
      const elbowAngles =     [ 0.8,  1.5,  2.2,  2.4,  0.3, -0.2,  0.2,  0.3];
      const guardShoulder =   [ 0.0, -0.3, -0.6, -0.8, -0.9, -0.7, -0.4,  0.0];
      const guardElbow =      [ 0.4,  0.8,  1.3,  1.6,  1.7,  1.5,  1.0,  0.4];
      const bodyDip =         [ 0.0, -0.3, -1.0, -1.2, -0.4,  0.5,  0.3,  0.0];
      const bodyTwist =       [ 0.0, -0.6, -1.4, -1.8,  0.8,  2.4,  1.2,  0.0];
      const legStance =       [ 0.0,  0.2,  0.6,  0.8,  0.9,  0.9,  0.5,  0.0];
      const headDip =         [ 0.0, -0.2, -0.6, -0.9, -0.5, -0.2,  0.0,  0.0];
      const headTilt =        [ 0.0, -0.2, -0.4, -0.3,  0.2,  0.35, 0.15, 0.0];
      const weightShift =     [ 0.0, -0.3, -0.6, -0.8,  0.5,  1.2,  0.6,  0.0];
      const frontStep =       [ 0.0,  0.0,  0.3,  0.5,  0.8,  1.0,  0.5,  0.0];
      const impactVfx =       [ 0.0,  0.0,  0.0,  0.0,  0.0,  1.0,  0.5,  0.0];
      return {
        bodyY: bodyDip[i], headY: headDip[i],
        bodyX: bodyTwist[i] + weightShift[i] * 0.4,
        leftArmY: bodyDip[i] * 0.7, rightArmY: -1.0 + bodyDip[i],
        leftLegY: -Math.abs(weightShift[i]) * 0.2, rightLegY: -frontStep[i] * 0.15,
        leftLegX: -legStance[i] - weightShift[i] * 0.25,
        rightLegX: legStance[i] + frontStep[i],
        leftArmX: -0.8, rightArmX: bodyTwist[i] * 0.8,
        rightShoulderAngle: shoulderAngles[i],
        rightElbowAngle: elbowAngles[i],
        leftShoulderAngle: guardShoulder[i],
        leftElbowAngle: guardElbow[i],
        headTilt: headTilt[i],
        shadowScale: 1 + bodyDip[i] * 0.06,
        vfxPunch: impactVfx[i],
        vfxSpeedLines: i >= 3 && i <= 5 ? (i === 5 ? 1.0 : i === 4 ? 0.7 : 0.3) : 0,
      };
    }
    case 'kick': {
      const i = f % 8;
      const legExt =       [ 0.0,  0.0,  0.5,  1.0,  2.5,  5.0,  5.5,  1.5];
      const legLift =      [ 0.0, -0.5, -1.5, -2.5, -2.8, -2.0, -1.5, -0.5];
      const leanBack =     [ 0.0, -0.2, -0.4, -0.8, -1.4, -2.0, -1.8, -0.4];
      const armCounter =   [ 0.0,  0.2,  0.5,  0.8,  1.2,  1.5,  1.3,  0.4];
      const guardElbow =   [ 0.3,  0.4,  0.7,  1.0,  1.3,  1.5,  1.2,  0.5];
      const pivotLeg =     [ 0.0,  0.0, -0.2, -0.5, -0.8, -1.0, -0.8, -0.3];
      const bodyTwist =    [ 0.0,  0.0,  0.2,  0.5,  1.0,  1.5,  1.2,  0.3];
      const headLean =     [ 0.0, -0.1, -0.2, -0.4, -0.6, -0.8, -0.6, -0.2];
      const hipShift =     [ 0.0,  0.0,  0.1,  0.3,  0.6,  0.8,  0.6,  0.2];
      const chamberKnee =  [ 0.0,  0.0,  1.0,  1.5,  0.3,  0.0,  0.3,  0.0];
      const impactVfx =    [ 0.0,  0.0,  0.0,  0.0,  0.0,  1.0,  0.7,  0.0];
      return {
        bodyY: leanBack[i], headY: headLean[i] + leanBack[i],
        bodyX: -bodyTwist[i] * 0.5 - hipShift[i],
        leftArmY: leanBack[i] * 0.7, rightArmY: leanBack[i] * 0.7,
        leftLegY: pivotLeg[i], rightLegY: legLift[i] - chamberKnee[i] * 0.3,
        leftLegX: -0.5 - pivotLeg[i] * 0.5, rightLegX: legExt[i],
        leftArmX: -0.7 - armCounter[i] * 0.5, rightArmX: 0.5 + armCounter[i] * 0.4,
        leftShoulderAngle: -armCounter[i] * 1.3, rightShoulderAngle: armCounter[i] * 1.1,
        leftElbowAngle: guardElbow[i], rightElbowAngle: guardElbow[i] * 0.5,
        shadowScale: 1 + leanBack[i] * 0.05,
        vfxKick: impactVfx[i],
        vfxSpeedLines: i >= 4 && i <= 6 ? (i === 5 ? 1.0 : i === 6 ? 0.6 : 0.4) : 0,
      };
    }
    case 'block': {
      const i = f % 4;
      const brace =   [ 0.0, -0.5, -0.8, -0.5][i];
      const tighten = [ 0.0,  0.15, 0.3,  0.15][i];
      const absorb =  [ 0.0,  0.1,  0.3,  0.15][i];
      return {
        bodyY: brace - absorb, headY: brace - 0.5 - absorb,
        bodyX: absorb * 0.3,
        leftArmY: -2.5 + brace * 0.4, rightArmY: -2.5 + brace * 0.4,
        leftLegY: absorb * 0.5, rightLegY: absorb * 0.5,
        leftLegX: -0.7 - tighten, rightLegX: 0.7 + tighten,
        leftArmX: 0.7 + tighten, rightArmX: -0.7 - tighten,
        leftShoulderAngle: -PI * 0.5, rightShoulderAngle: PI * 0.5,
        leftElbowAngle: PI * 0.6, rightElbowAngle: -PI * 0.6,
        shadowScale: 1.15 + absorb * 0.1,
      };
    }
    case 'flex': {
      const i = f % 6;
      const pump =       [ 0.0, -0.4, -1.0, -1.8, -1.0, -0.4][i];
      const bicepAngle = [PI*0.25, PI*0.32, PI*0.42, PI*0.55, PI*0.42, PI*0.32][i];
      const chest =      [ 0.0, -0.15, -0.3, -0.5, -0.3, -0.15][i];
      const widen =      [ 0.0,  0.1,  0.2,  0.35, 0.2,  0.1][i];
      return {
        bodyY: chest, headY: chest - 0.4,
        leftArmY: pump - 1.8, rightArmY: pump - 1.8,
        leftLegY: 0, rightLegY: 0,
        leftLegX: -0.6 - widen, rightLegX: 0.6 + widen,
        leftArmX: -2.0 - widen, rightArmX: 2.0 + widen,
        leftShoulderAngle: -PI * 0.6, rightShoulderAngle: PI * 0.6,
        leftElbowAngle: -bicepAngle, rightElbowAngle: bicepAngle,
        shadowScale: 1.08 + widen * 0.1,
      };
    }
    case 'wave': {
      const i = f % 6;
      const swing =      [ 0.0, -1.3, -2.5, -3.4, -2.5, -1.3][i];
      const waveAngle =  [ 0.0, -0.4, -0.8, -1.1, -0.8, -0.4][i];
      const bodyTilt =   [ 0.0,  0.05,-0.15,-0.3, -0.15, 0.05][i];
      const hipSway =    [ 0.0,  0.2,  0.3,  0.4,  0.3,  0.2][i];
      const weightLeg =  [ 0.0,  0.0,  0.1,  0.2,  0.1,  0.0][i];
      return {
        bodyY: bodyTilt, headY: bodyTilt + 0.15,
        bodyX: hipSway * 0.3,
        leftArmY: 0, rightArmY: swing,
        leftLegY: weightLeg, rightLegY: 0,
        leftLegX: hipSway * 0.2, rightLegX: -hipSway * 0.1,
        leftArmX: hipSway * 0.2, rightArmX: 1.2 + Math.abs(swing) * 0.25,
        leftShoulderAngle: 0.15, rightShoulderAngle: -PI * 0.72,
        leftElbowAngle: 0.12, rightElbowAngle: waveAngle,
        shadowScale: 1,
      };
    }
    case 'dodge': {
      const i = f % 6;
      const shift =    [ 0.0,  1.2,  2.8,  4.0,  2.5,  0.6][i];
      const duck =     [ 0.0, -0.4, -1.0, -2.0, -1.2, -0.3][i];
      const armGuard = [ 0.0, -0.3, -0.6, -0.9, -0.5, -0.15][i];
      const legPush =  [ 0.0,  0.5,  0.9,  1.2,  0.7,  0.2][i];
      const blur =     [ 0.0,  0.0,  0.2,  0.5,  0.2,  0.0][i];
      return {
        bodyY: duck, headY: duck - 0.5,
        bodyX: shift,
        leftArmY: duck * 0.8 + armGuard, rightArmY: duck * 0.8,
        leftLegY: -blur * 0.5, rightLegY: 0,
        leftLegX: shift * 0.5 - legPush, rightLegX: shift * 0.5 + legPush,
        leftArmX: shift * 0.25 - 0.4, rightArmX: shift * 0.25 + 0.4,
        leftShoulderAngle: -0.5 + armGuard, rightShoulderAngle: 0.4,
        leftElbowAngle: 0.7 - armGuard * 0.5, rightElbowAngle: 0.6,
        shadowScale: Math.max(0.5, 0.85 - blur * 0.3),
      };
    }
    case 'victory': {
      const i = f % 6;
      const bounce =    [ 0.0, -0.8, -1.8, -3.0, -1.8, -0.8][i];
      const armPump =   [ 0.0, -0.5, -1.2, -2.2, -1.2, -0.5][i];
      const legJump =   [ 0.0,  0.0, -0.5, -1.5, -0.5,  0.0][i];
      const twist =     [ 0.0,  0.2,  0.3,  0.0, -0.3, -0.2][i];
      const fistPump =  [ 0.0,  0.0,  0.2,  0.5,  0.2,  0.0][i];
      return {
        bodyY: bounce, headY: bounce - 0.6,
        bodyX: twist,
        leftArmY: -3.5 + bounce + armPump, rightArmY: -3.5 + bounce + armPump,
        leftLegY: legJump, rightLegY: legJump,
        leftLegX: -0.7, rightLegX: 0.7,
        leftArmX: -1.5 + twist * 0.3, rightArmX: 1.5 + twist * 0.3,
        leftShoulderAngle: -PI * 0.8, rightShoulderAngle: PI * 0.8,
        leftElbowAngle: -0.4 + fistPump * 0.3,
        rightElbowAngle: 0.4 - fistPump * 0.3,
        shadowScale: Math.max(0.3, 1 + bounce * 0.12),
      };
    }
    default:
      return {
        bodyY: 0, headY: 0,
        leftArmY: 0, rightArmY: 0,
        leftLegY: 0, rightLegY: 0,
        leftLegX: 0, rightLegX: 0,
        leftArmX: 0, rightArmX: 0,
        leftShoulderAngle: 0, rightShoulderAngle: 0,
        leftElbowAngle: 0, rightElbowAngle: 0,
        shadowScale: 1,
      };
  }
}

function drawPixel(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * size), Math.round(y * size), size, size);
}

function drawRect(ctx, x, y, w, h, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * size), Math.round(y * size), Math.round(w * size), Math.round(h * size));
}

function accentDarken(hexColor, factor) {
  if (!hexColor || hexColor.length < 7) return hexColor;
  const hex = hexColor.replace('#', '');
  const r = Math.max(0, Math.min(255, Math.round(parseInt(hex.substring(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(hex.substring(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(hex.substring(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function accentBrighten(hexColor, amount) {
  if (!hexColor || hexColor.length < 7) return hexColor;
  const hex = hexColor.replace('#', '');
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawRoundedBox(ctx, x, y, w, h, S, fill, outline) {
  drawRect(ctx, x + 1, y, w - 2, 1, S, outline);
  drawRect(ctx, x + 1, y + h - 1, w - 2, 1, S, outline);
  drawRect(ctx, x, y + 1, 1, h - 2, S, outline);
  drawRect(ctx, x + w - 1, y + 1, 1, h - 2, S, outline);
  if (w > 2 && h > 2) drawRect(ctx, x + 1, y + 1, w - 2, h - 2, S, fill);
}

function drawBox(ctx, x, y, w, h, S, fill, outline) {
  if (h <= 1) {
    drawRect(ctx, x, y, w, 1, S, fill);
    return;
  }
  if (h <= 2) {
    drawRect(ctx, x, y, w, 1, S, outline);
    drawRect(ctx, x, y + 1, w, 1, S, fill);
    return;
  }
  drawRect(ctx, x, y, w, 1, S, outline);
  drawRect(ctx, x, y + h - 1, w, 1, S, outline);
  drawRect(ctx, x, y + 1, 1, h - 2, S, outline);
  drawRect(ctx, x + w - 1, y + 1, 1, h - 2, S, outline);
  if (w > 2) drawRect(ctx, x + 1, y + 1, w - 2, h - 2, S, fill);
}

function addShading(ctx, x, y, w, h, S, highlight, shadow) {
  if (w > 3 && h > 3) {
    drawRect(ctx, x + 1, y + 1, w - 3, 1, S, highlight);
    drawRect(ctx, x + 1, y + 2, 1, h - 4, S, highlight);
    drawRect(ctx, x + 2, y + h - 2, w - 3, 1, S, shadow);
    drawRect(ctx, x + w - 2, y + 2, 1, h - 4, S, shadow);
  }
}

export function drawAvatar(canvas, config, rotation = 0, pose = 'idle', animFrame = 0) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  const S = Math.max(1, Math.floor(Math.min(W / 24, H / 28)));
  const cx = Math.floor(W / 2);
  const cg = Math.floor(cx / S);
  const baseY = Math.floor(H * 0.08);
  const bg = Math.max(0, Math.floor(baseY / S));

  const skin = SKIN_TONES.find(s => s.id === config.skinTone) || SKIN_TONES[1];
  const hairData = HAIR_COLORS.find(h => h.id === config.hairColor) || HAIR_COLORS[1];
  const eyeData = EYE_COLORS.find(e => e.id === config.eyeColor) || EYE_COLORS[0];
  const armor = ARMOR_SETS.find(a => a.id === config.armor) || ARMOR_SETS[0];
  const accColor = ACCESSORY_COLORS.find(a => a.id === config.accessoryColor) || ACCESSORY_COLORS[0];

  const skinHi = accentBrighten(skin.color, 30);
  const skinOl = accentDarken(skin.color, 0.3);
  const bodyColor = armor.bodyColor || skin.color;
  const accentColor = armor.accent || skin.shadow;
  const bodyHi = accentBrighten(bodyColor, 30);
  const bodySh = accentDarken(bodyColor, 0.65);
  const bodyOl = accentDarken(bodyColor, 0.3);
  const hairHi = accentBrighten(hairData.color, 25);
  const hairSh = accentDarken(hairData.color, 0.65);
  const hairOl = accentDarken(hairData.color, 0.3);

  const isFront = rotation === 0;
  const isBack = rotation === 2;
  const isSide = rotation === 1 || rotation === 3;
  const isLeft = rotation === 1;

  const poseInfo = AVATAR_POSES.find(p => p.id === pose) || AVATAR_POSES[0];
  const off = getPoseOffsets(pose, animFrame % poseInfo.frames, isSide);
  const bx = off.bodyX || 0;

  const drawShadow = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    const sw = S * 5 * (off.shadowScale || 1);
    ctx.ellipse(cx + bx * S, (bg + 22) * S, sw, S * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawAura = () => {
    if (config.accessory !== 'aura') return;
    const aY = (bg + 11 + (off.bodyY || 0)) * S;
    const grad = ctx.createRadialGradient(cx, aY, S * 2, cx, aY, S * 12);
    grad.addColorStop(0, accColor.color + '35');
    grad.addColorStop(0.4, accColor.color + '18');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = accColor.color + '50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx + bx * S, aY, S * 7, S * 11, 0, 0, Math.PI * 2);
    ctx.stroke();
    const t = animFrame * 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 0.3;
      const rad = S * (7 + Math.sin(t + i) * 1.5);
      const px = cx + bx * S + Math.cos(angle) * rad * 0.7;
      const py = aY + Math.sin(angle) * rad;
      ctx.fillStyle = accColor.color + '60';
      ctx.fillRect(Math.round(px), Math.round(py), Math.ceil(S * 0.5), Math.ceil(S * 0.5));
    }
  };

  const drawJointConnector = (fromX, fromY, toX, toY, w, color, olColor) => {
    const dy = toY - fromY;
    const dx = toX - fromX;
    if (Math.abs(dy) < 0.01 && Math.abs(dx) < 0.01) return;
    const steps = Math.max(Math.ceil(Math.abs(dy)), Math.ceil(Math.abs(dx)), 1);
    if (olColor) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = fromX + dx * t;
        const py = fromY + dy * t;
        drawRect(ctx, px - 0.5, py, w + 1, 1, S, olColor);
      }
    }
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = fromX + dx * t;
      const py = fromY + dy * t;
      drawRect(ctx, px, py, w, 1, S, color);
    }
  };

  const drawRotatedLimb = (startX, startY, angle, length, width, color, olColor) => {
    const endX = startX + Math.sin(angle) * length;
    const endY = startY + Math.cos(angle) * length;
    drawJointConnector(startX, startY, endX, endY, width, color, olColor);
    return { x: endX, y: endY };
  };

  const drawLegs = () => {
    const bootStyle = config.boots;
    const legColor = armor.bodyColor ? accentColor : skin.shadow;
    const legHi = accentBrighten(legColor, 20);
    const legOl = accentDarken(legColor, 0.3);
    const bootColor = bootStyle === 'cyber' ? '#374151' : bootStyle === 'armored' ? (accentColor || '#6B7280') : '#5C3310';
    const bootHi = accentBrighten(bootColor, 25);
    const bootOl = accentDarken(bootColor, 0.3);
    const bootAccent = bootStyle === 'cyber' ? '#06B6D4' : bootStyle === 'armored' ? (bodyColor || '#9CA3AF') : '#3D220A';

    const lly = off.leftLegY || 0;
    const rly = off.rightLegY || 0;
    const llx = off.leftLegX || 0;
    const rlx = off.rightLegX || 0;
    const by = off.bodyY || 0;
    const hipBase = bg + 15 + by;

    if (isSide) {
      const backX = cg - 2 + rlx + bx + (isLeft ? 1 : -1);
      const backY = hipBase + rly;
      const dLeg = accentDarken(legColor, 0.7);
      const dOl = accentDarken(legOl, 0.7);
      const dBoot = accentDarken(bootColor, 0.7);
      const dBOl = accentDarken(bootOl, 0.7);
      if (Math.abs(rly) > 0.1 || Math.abs(rlx) > 0.1) {
        drawJointConnector(cg - 2 + bx + (isLeft ? 1 : -1), hipBase - 1, backX, backY, 3, dLeg, dOl);
      }
      drawBox(ctx, backX, backY, 3, 5, S, dLeg, dOl);
      drawBox(ctx, backX - 0.5, backY + 4, 4, 2, S, dBoot, dBOl);

      const fX = cg - 2 + llx + bx;
      const fY = hipBase + lly;
      if (Math.abs(lly) > 0.1 || Math.abs(llx) > 0.1) {
        drawJointConnector(cg - 2 + bx, hipBase - 1, fX, fY, 3, legColor, legOl);
      }
      drawBox(ctx, fX, fY, 3, 5, S, legColor, legOl);
      addShading(ctx, fX, fY, 3, 5, S, legHi, accentDarken(legColor, 0.7));
      drawBox(ctx, fX - 0.5, fY + 4, 4, 2, S, bootColor, bootOl);
      if (bootStyle === 'cyber') {
        drawRect(ctx, fX, fY + 4, 2, 1, S, '#06B6D4');
      } else if (bootStyle === 'armored') {
        drawRect(ctx, fX, fY + 4, 2, 1, S, bootAccent);
        drawPixel(ctx, fX + 0.5, fY + 5, S, accentBrighten(bootAccent, 40));
      }
    } else {
      const lX = cg - 5 + llx + bx;
      const lY = hipBase + lly;
      const rX = cg + 1 + rlx + bx;
      const rY = hipBase + rly;

      if (Math.abs(lly) > 0.1 || Math.abs(llx) > 0.1) {
        drawJointConnector(cg - 5 + bx, hipBase - 1, lX, lY, 3, legColor, legOl);
      }
      if (Math.abs(rly) > 0.1 || Math.abs(rlx) > 0.1) {
        drawJointConnector(cg + 1 + bx, hipBase - 1, rX, rY, 3, legColor, legOl);
      }

      drawBox(ctx, lX, lY, 4, 5, S, legColor, legOl);
      addShading(ctx, lX, lY, 4, 5, S, legHi, accentDarken(legColor, 0.7));
      drawBox(ctx, rX, rY, 4, 5, S, legColor, legOl);
      addShading(ctx, rX, rY, 4, 5, S, legHi, accentDarken(legColor, 0.7));

      drawBox(ctx, lX - 0.5, lY + 4, 5, 2, S, bootColor, bootOl);
      drawBox(ctx, rX, rY + 4, 5, 2, S, bootColor, bootOl);

      if (bootStyle === 'cyber') {
        drawRect(ctx, lX, lY + 4, 3, 1, S, '#06B6D4');
        drawRect(ctx, rX + 1, rY + 4, 3, 1, S, '#06B6D4');
      } else if (bootStyle === 'armored') {
        drawRect(ctx, lX, lY + 4, 3, 1, S, bootAccent);
        drawRect(ctx, rX + 1, rY + 4, 3, 1, S, bootAccent);
        drawPixel(ctx, lX + 1, lY + 5, S, accentBrighten(bootAccent, 40));
        drawPixel(ctx, rX + 2, rY + 5, S, accentBrighten(bootAccent, 40));
      }
    }
  };

  const drawBody = () => {
    const by = off.bodyY || 0;
    const hy = off.headY || 0;
    const bY = bg + 8 + by;
    const nY = bg + 7 + Math.min(by, hy);
    const hasArmor = armor.id !== 'none';
    const isHeavy = ['iron','gold','diamond','grudge','plasma'].includes(armor.id);

    if (isSide) {
      drawRect(ctx, cg - 1 + bx, nY, 3, 1.5, S, skin.shadow);
      drawPixel(ctx, cg - 1 + bx, nY, S, skinOl);
      drawPixel(ctx, cg + 1 + bx, nY, S, skinOl);

      drawBox(ctx, cg - 4 + bx, bY, 8, 7, S, bodyColor, bodyOl);
      addShading(ctx, cg - 4 + bx, bY, 8, 7, S, bodyHi, bodySh);
      const shadowX = isLeft ? cg + 3 + bx : cg - 4 + bx;
      drawRect(ctx, shadowX, bY + 1, 1, 5, S, bodySh);
      if (hasArmor) {
        drawRect(ctx, cg - 3 + bx, bY + 1, 6, 1, S, accentColor);
        drawPixel(ctx, cg - 1 + bx, bY + 3, S, accentColor);
        drawPixel(ctx, cg + bx, bY + 3, S, accentColor);
        if (isHeavy) {
          drawRect(ctx, cg - 4 + bx, bY - 1, 8, 1, S, bodyOl);
          drawRect(ctx, cg - 3 + bx, bY - 1, 6, 1, S, accentColor);
        }
        drawRect(ctx, cg - 3 + bx, bY + 6, 6, 1, S, accentDarken(accentColor, 0.8));
      }
    } else {
      drawRect(ctx, cg - 1 + bx, nY, 3, 1.5, S, skin.shadow);
      drawPixel(ctx, cg - 1 + bx, nY, S, skinOl);
      drawPixel(ctx, cg + 1 + bx, nY, S, skinOl);

      drawBox(ctx, cg - 6 + bx, bY, 12, 7, S, bodyColor, bodyOl);
      addShading(ctx, cg - 6 + bx, bY, 12, 7, S, bodyHi, bodySh);

      if (isFront) {
        drawRect(ctx, cg - 5 + bx, bY + 1, 1, 5, S, bodyHi);
        drawRect(ctx, cg + 4 + bx, bY + 1, 1, 5, S, bodySh);
        if (hasArmor) {
          drawRect(ctx, cg - 4 + bx, bY + 1, 8, 1, S, accentColor);
          drawRect(ctx, cg - 2 + bx, bY + 3, 4, 1, S, accentColor);
          drawPixel(ctx, cg - 1 + bx, bY + 4, S, accentColor);
          drawPixel(ctx, cg + bx, bY + 4, S, accentColor);
          if (isHeavy) {
            drawRect(ctx, cg - 7 + bx, bY, 2, 2, S, bodyOl);
            drawRect(ctx, cg - 7 + bx, bY, 1, 1, S, bodyHi);
            drawRect(ctx, cg + 5 + bx, bY, 2, 2, S, bodyOl);
            drawRect(ctx, cg + 6 + bx, bY, 1, 1, S, bodyHi);
            drawRect(ctx, cg - 5 + bx, bY - 1, 10, 1, S, accentColor);
          }
          drawRect(ctx, cg - 4 + bx, bY + 6, 8, 1, S, accentDarken(accentColor, 0.8));
          drawPixel(ctx, cg + bx, bY + 6, S, accentBrighten(accentColor, 40));
        }
      } else {
        if (hasArmor) {
          drawRect(ctx, cg - 5 + bx, bY + 1, 10, 1, S, accentColor);
          drawRect(ctx, cg - 3 + bx, bY + 3, 6, 1, S, accentColor);
          if (isHeavy) {
            drawRect(ctx, cg - 7 + bx, bY, 2, 2, S, bodyOl);
            drawRect(ctx, cg + 5 + bx, bY, 2, 2, S, bodyOl);
            drawRect(ctx, cg - 5 + bx, bY - 1, 10, 1, S, accentColor);
          }
          drawRect(ctx, cg - 4 + bx, bY + 6, 8, 1, S, accentDarken(accentColor, 0.8));
        }
      }
    }
  };

  const drawArmorDetail = () => {
    if (armor.id === 'none') return;
    const by = off.bodyY || 0;
    const bY = bg + 8 + by;
    const bX = isSide ? cg - 4 + bx : cg - 6 + bx;
    const bW = isSide ? 8 : 12;

    switch(armor.id) {
      case 'leather': {
        for (let i = 1; i < 6; i += 2) {
          drawPixel(ctx, bX + 2, bY + i, S, accentColor);
          drawPixel(ctx, bX + bW - 3, bY + i, S, accentColor);
        }
        if (!isSide) {
          drawRect(ctx, bX + 3, bY + 2, bW - 6, 1, S, accentDarken(bodyColor, 0.85));
          drawRect(ctx, bX + 3, bY + 4, bW - 6, 1, S, accentDarken(bodyColor, 0.85));
        }
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 5, S, '#F59E0B');
          drawPixel(ctx, cg - 1 + bx, bY + 5, S, '#D97706');
          drawPixel(ctx, cg + bx, bY + 3, S, accentBrighten(bodyColor, 20));
        }
        break;
      }
      case 'iron': {
        const rivet = accentBrighten(bodyColor, 60);
        drawRect(ctx, bX + 2, bY + 2, bW - 4, 1, S, bodySh);
        drawRect(ctx, bX + 2, bY + 4, bW - 4, 1, S, bodySh);
        drawPixel(ctx, bX + 2, bY + 1, S, rivet);
        drawPixel(ctx, bX + bW - 3, bY + 1, S, rivet);
        drawPixel(ctx, bX + 2, bY + 3, S, rivet);
        drawPixel(ctx, bX + bW - 3, bY + 3, S, rivet);
        drawPixel(ctx, bX + 2, bY + 5, S, rivet);
        drawPixel(ctx, bX + bW - 3, bY + 5, S, rivet);
        if (isFront) {
          drawRect(ctx, cg - 1 + bx, bY + 2, 2, 3, S, accentBrighten(bodyColor, 15));
          drawPixel(ctx, cg + bx, bY + 2, S, bodyHi);
          drawRect(ctx, bX + 1, bY, 1, 7, S, bodySh);
          drawRect(ctx, bX + bW - 2, bY, 1, 7, S, bodySh);
        }
        break;
      }
      case 'gold': {
        for (let i = 0; i < bW - 2; i++) {
          if (i % 2 === 0) drawPixel(ctx, bX + 1 + i, bY + 1, S, bodyHi);
        }
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 3, S, '#EF4444');
          drawPixel(ctx, cg - 1 + bx, bY + 3, S, '#EF4444');
          drawPixel(ctx, cg + bx, bY + 2, S, '#ffffff90');
          drawRect(ctx, cg - 2 + bx, bY + 4, 4, 1, S, accentBrighten(bodyColor, 40));
          drawPixel(ctx, bX + 2, bY + 2, S, bodyHi);
          drawPixel(ctx, bX + bW - 3, bY + 2, S, bodyHi);
          drawPixel(ctx, bX + 2, bY + 4, S, bodyHi);
          drawPixel(ctx, bX + bW - 3, bY + 4, S, bodyHi);
        }
        for (let i = 0; i < bW - 2; i++) {
          if (i % 2 === 1) drawPixel(ctx, bX + 1 + i, bY + 5, S, bodyHi);
        }
        break;
      }
      case 'diamond': {
        const sparkle = '#ffffffc0';
        const sparkle2 = '#80f0ff90';
        drawPixel(ctx, bX + 2, bY + 1, S, sparkle);
        drawPixel(ctx, bX + bW - 3, bY + 1, S, sparkle2);
        drawPixel(ctx, bX + 3, bY + 3, S, sparkle2);
        drawPixel(ctx, bX + bW - 4, bY + 3, S, sparkle);
        drawPixel(ctx, bX + 2, bY + 5, S, sparkle2);
        drawPixel(ctx, bX + bW - 3, bY + 5, S, sparkle);
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 2, S, '#ffffffe0');
          drawPixel(ctx, cg - 1 + bx, bY + 2, S, '#ffffffa0');
          drawRect(ctx, cg - 2 + bx, bY + 3, 4, 1, S, accentBrighten(bodyColor, 30));
          drawPixel(ctx, cg + bx, bY + 4, S, sparkle);
        }
        const t = animFrame * 0.25;
        const sx = bX + 1 + Math.floor(Math.abs(Math.sin(t * 1.7)) * (bW - 3));
        const sy = bY + Math.floor(Math.abs(Math.cos(t * 1.3)) * 5);
        drawPixel(ctx, sx, sy, S, '#ffffffd0');
        break;
      }
      case 'shadow': {
        const t = animFrame * 0.3;
        const shadowPurple1 = '#7C3AED60';
        const shadowPurple2 = '#4C1D9540';
        for (let i = 0; i < 4; i++) {
          const sx = bX + 1 + Math.floor(Math.abs(Math.sin(t + i * 1.5)) * (bW - 3));
          const sy = bY + 1 + Math.floor(Math.abs(Math.cos(t * 0.7 + i * 1.2)) * 4);
          drawPixel(ctx, sx, sy, S, i % 2 === 0 ? shadowPurple1 : shadowPurple2);
        }
        drawRect(ctx, bX + 1, bY + 1, bW - 2, 1, S, '#4C1D9530');
        drawRect(ctx, bX + 1, bY + 5, bW - 2, 1, S, '#4C1D9520');
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 3, S, '#A855F780');
          drawPixel(ctx, cg - 1 + bx, bY + 3, S, '#7C3AED60');
          drawPixel(ctx, cg + bx, bY + 2, S, '#A855F740');
          drawPixel(ctx, cg - 1 + bx, bY + 4, S, '#7C3AED40');
        }
        break;
      }
      case 'crimson': {
        drawPixel(ctx, bX + 2, bY + 1, S, bodyHi);
        drawPixel(ctx, bX + bW - 3, bY + 1, S, bodyHi);
        drawRect(ctx, bX + 2, bY + 3, bW - 4, 1, S, accentDarken(bodyColor, 0.75));
        drawPixel(ctx, bX + 3, bY + 5, S, bodySh);
        drawPixel(ctx, bX + bW - 4, bY + 5, S, bodySh);
        if (isFront) {
          drawPixel(ctx, cg - 1 + bx, bY + 2, S, bodyHi);
          drawPixel(ctx, cg + bx, bY + 2, S, bodyHi);
          drawRect(ctx, cg - 1 + bx, bY + 4, 2, 1, S, '#FF6B6B');
          drawPixel(ctx, cg + bx, bY + 1, S, '#FF4444');
          drawPixel(ctx, bX + 2, bY + 4, S, accentBrighten(bodyColor, 25));
          drawPixel(ctx, bX + bW - 3, bY + 4, S, accentBrighten(bodyColor, 25));
        }
        break;
      }
      case 'emerald': {
        for (let i = 1; i < 6; i += 2) {
          drawPixel(ctx, bX + 2 + (i % 3), bY + i, S, bodyHi);
          drawPixel(ctx, bX + bW - 3 - (i % 2), bY + i, S, accentBrighten(bodyColor, 30));
        }
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 2, S, '#34D399');
          drawPixel(ctx, cg - 1 + bx, bY + 2, S, '#10B981');
          drawRect(ctx, cg - 2 + bx, bY + 4, 4, 1, S, accentBrighten(bodyColor, 15));
          drawPixel(ctx, cg + bx, bY + 3, S, '#ffffff50');
        }
        drawRect(ctx, bX + 1, bY + 3, bW - 2, 1, S, accentDarken(bodyColor, 0.85));
        break;
      }
      case 'plasma': {
        const t = animFrame * 0.4;
        for (let i = 0; i < 5; i++) {
          const px = bX + 1 + Math.floor(Math.abs(Math.sin(t + i * 1.3)) * (bW - 3));
          const py = bY + Math.floor(Math.abs(Math.cos(t * 0.8 + i * 0.9)) * 6);
          const alpha = Math.floor(100 + Math.abs(Math.sin(t + i)) * 155).toString(16);
          drawPixel(ctx, px, py, S, accentBrighten(bodyColor, 60) + alpha);
        }
        if (isFront) {
          const pulseAlpha = Math.floor(80 + Math.abs(Math.sin(t * 0.5)) * 175).toString(16).padStart(2, '0');
          drawPixel(ctx, cg + bx, bY + 2, S, '#E879F9' + pulseAlpha);
          drawPixel(ctx, cg - 1 + bx, bY + 3, S, '#C084FC' + pulseAlpha);
          drawPixel(ctx, cg + bx, bY + 4, S, '#A855F7' + pulseAlpha);
        }
        drawRect(ctx, bX + 1, bY + 1, bW - 2, 1, S, accentBrighten(bodyColor, 30) + '40');
        drawRect(ctx, bX + 1, bY + 5, bW - 2, 1, S, accentBrighten(bodyColor, 20) + '30');
        break;
      }
      case 'grudge': {
        const t = animFrame * 0.35;
        drawRect(ctx, bX + 1, bY + 1, bW - 2, 1, S, '#06B6D440');
        drawRect(ctx, bX + 1, bY + 3, bW - 2, 1, S, '#06B6D420');
        drawRect(ctx, bX + 1, bY + 5, bW - 2, 1, S, '#06B6D440');
        if (isFront) {
          drawPixel(ctx, cg + bx, bY + 2, S, '#22D3EE');
          drawPixel(ctx, cg - 1 + bx, bY + 2, S, '#06B6D4');
          drawPixel(ctx, cg + bx, bY + 4, S, '#06B6D4a0');
          drawPixel(ctx, cg - 1 + bx, bY + 4, S, '#22D3EEa0');
          const pulseA = Math.floor(120 + Math.sin(t) * 80).toString(16).padStart(2, '0');
          drawPixel(ctx, cg + bx, bY + 3, S, '#22D3EE' + pulseA);
        }
        drawPixel(ctx, bX + 2, bY + 2, S, '#06B6D460');
        drawPixel(ctx, bX + bW - 3, bY + 2, S, '#06B6D460');
        drawPixel(ctx, bX + 2, bY + 4, S, '#22D3EE50');
        drawPixel(ctx, bX + bW - 3, bY + 4, S, '#22D3EE50');
        break;
      }
    }
  };

  const drawArms = () => {
    const armColor = armor.bodyColor || skin.color;
    const handColor = skin.color;
    const shoulderColor = armor.bodyColor || skin.shadow;
    const armOl = accentDarken(armColor, 0.3);
    const handOl = accentDarken(handColor, 0.3);
    const shoulderOl = accentDarken(shoulderColor, 0.3);
    const lay = off.leftArmY || 0;
    const ray = off.rightArmY || 0;
    const lax = off.leftArmX || 0;
    const rax = off.rightArmX || 0;
    const by = off.bodyY || 0;
    const shoulderBase = bg + 9 + by;

    const lSA = off.leftShoulderAngle || 0;
    const rSA = off.rightShoulderAngle || 0;
    const lEA = off.leftElbowAngle || 0;
    const rEA = off.rightElbowAngle || 0;
    const hasRotation = Math.abs(lSA) > 0.01 || Math.abs(rSA) > 0.01 || Math.abs(lEA) > 0.01 || Math.abs(rEA) > 0.01;

    if (hasRotation) {
      const upperLen = 3.0;
      const foreLen = 3.0;
      const handLen = 1.5;

      if (isSide) {
        const backX = isLeft ? cg + 2 + bx : cg - 4 + bx;
        const armDk = accentDarken(armColor, 0.7);
        const handDk = accentDarken(handColor, 0.7);
        const shoulderDk = accentDarken(shoulderColor, 0.7);
        const olDk = accentDarken(armOl, 0.7);
        const rA = rSA + (ray * 0.05);
        const rElb = drawRotatedLimb(backX + 1, shoulderBase - 0.5, rA, upperLen, 2, shoulderDk, olDk);
        const rFA = rA + rEA;
        const rHnd = drawRotatedLimb(rElb.x, rElb.y, rFA, foreLen, 2, armDk, olDk);
        drawRect(ctx, rHnd.x - 0.5, rHnd.y, 2, handLen, S, handDk);

        const frontX = isLeft ? cg - 4 + bx : cg + 2 + bx;
        const lA = lSA + (lay * 0.05);
        const lElb = drawRotatedLimb(frontX + 1, shoulderBase - 0.5, lA, upperLen, 2, shoulderColor, shoulderOl);
        const lFA = lA + lEA;
        const lHnd = drawRotatedLimb(lElb.x, lElb.y, lFA, foreLen, 2, armColor, armOl);
        drawRect(ctx, lHnd.x - 0.5, lHnd.y, 2, handLen, S, handColor);
      } else {
        const lShX = cg - 7 + bx;
        const rShX = cg + 5 + bx;

        const lA = lSA + (lay * 0.05);
        const lElb = drawRotatedLimb(lShX + 1, shoulderBase - 0.5, lA, upperLen, 2, shoulderColor, shoulderOl);
        const lFA = lA + lEA;
        const lHnd = drawRotatedLimb(lElb.x, lElb.y, lFA, foreLen, 2, armColor, armOl);
        drawRect(ctx, lHnd.x - 0.5, lHnd.y, 2, handLen, S, handColor);

        const rA = rSA + (ray * 0.05);
        const rElb = drawRotatedLimb(rShX, shoulderBase - 0.5, rA, upperLen, 2, shoulderColor, shoulderOl);
        const rFA = rA + rEA;
        const rHnd = drawRotatedLimb(rElb.x, rElb.y, rFA, foreLen, 2, armColor, armOl);
        drawRect(ctx, rHnd.x - 0.5, rHnd.y, 2, handLen, S, handColor);

        if (config.accessory === 'shoulder_pads') {
          drawBox(ctx, lShX - 1, shoulderBase - 2, 4, 3, S, accColor.color, accentDarken(accColor.color, 0.4));
          drawPixel(ctx, lShX, shoulderBase - 1, S, accentBrighten(accColor.color, 40));
          drawBox(ctx, rShX - 1, shoulderBase - 2, 4, 3, S, accColor.color, accentDarken(accColor.color, 0.4));
          drawPixel(ctx, rShX, shoulderBase - 1, S, accentBrighten(accColor.color, 40));
        }
      }
    } else {
      if (isSide) {
        const backAncX = isLeft ? cg + 2 + bx : cg - 4 + bx;
        const backX = backAncX + rax;
        const backY = shoulderBase + ray;
        const armDk = accentDarken(armColor, 0.7);
        const handDk = accentDarken(handColor, 0.7);
        const olDk = accentDarken(armOl, 0.7);
        if (Math.abs(ray) > 0.1 || Math.abs(rax) > 0.1) {
          drawJointConnector(backAncX, shoulderBase - 0.5, backX, backY, 3, armDk, olDk);
        }
        drawBox(ctx, backX, backY, 3, 6, S, armDk, olDk);
        drawRect(ctx, backX + 0.5, backY + 5, 2, 1.5, S, handDk);

        const frontAncX = isLeft ? cg - 4 + bx : cg + 2 + bx;
        const frontX = frontAncX + lax;
        const frontY = shoulderBase + lay;
        if (Math.abs(lay) > 0.1 || Math.abs(lax) > 0.1) {
          drawJointConnector(frontAncX, shoulderBase - 0.5, frontX, frontY, 3, armColor, armOl);
        }
        drawBox(ctx, frontX, frontY, 3, 6, S, armColor, armOl);
        addShading(ctx, frontX, frontY, 3, 6, S, accentBrighten(armColor, 20), accentDarken(armColor, 0.7));
        drawRect(ctx, frontX + 0.5, frontY + 5, 2, 1.5, S, handColor);
        drawPixel(ctx, frontX + 0.5, frontY + 5, S, handOl);
      } else {
        const lAncX = cg - 8 + bx;
        const rAncX = cg + 6 + bx;
        const lTopX = lAncX + lax;
        const lTopY = shoulderBase + lay;
        const rTopX = rAncX + rax;
        const rTopY = shoulderBase + ray;

        if (Math.abs(lay) > 0.1 || Math.abs(lax) > 0.1) {
          drawJointConnector(cg - 6 + bx, shoulderBase - 0.5, lTopX + 1, lTopY, 2, shoulderColor, shoulderOl);
        }
        if (Math.abs(ray) > 0.1 || Math.abs(rax) > 0.1) {
          drawJointConnector(cg + 5 + bx, shoulderBase - 0.5, rTopX, rTopY, 2, shoulderColor, shoulderOl);
        }

        drawBox(ctx, lTopX, lTopY, 3, 7, S, armColor, armOl);
        addShading(ctx, lTopX, lTopY, 3, 7, S, accentBrighten(armColor, 20), accentDarken(armColor, 0.7));
        drawBox(ctx, rTopX, rTopY, 3, 7, S, armColor, armOl);
        addShading(ctx, rTopX, rTopY, 3, 7, S, accentBrighten(armColor, 20), accentDarken(armColor, 0.7));

        drawRect(ctx, lTopX + 0.5, lTopY + 5.5, 2, 1.5, S, handColor);
        drawPixel(ctx, lTopX + 0.5, lTopY + 5.5, S, handOl);
        drawRect(ctx, rTopX + 0.5, rTopY + 5.5, 2, 1.5, S, handColor);
        drawPixel(ctx, rTopX + 0.5, rTopY + 5.5, S, handOl);

        if (config.accessory === 'shoulder_pads') {
          drawBox(ctx, lTopX - 1, lTopY - 1.5, 4, 3, S, accColor.color, accentDarken(accColor.color, 0.4));
          drawPixel(ctx, lTopX, lTopY - 0.5, S, accentBrighten(accColor.color, 40));
          drawBox(ctx, rTopX, rTopY - 1.5, 4, 3, S, accColor.color, accentDarken(accColor.color, 0.4));
          drawPixel(ctx, rTopX + 1, rTopY - 0.5, S, accentBrighten(accColor.color, 40));
        }
      }
    }
  };

  const drawHead = () => {
    const hy = off.headY || 0;
    const hY = bg + 1 + hy;

    if (isSide) {
      const hW = 8;
      const hX = cg - 4 + bx;
      drawRoundedBox(ctx, hX, hY, hW, 7, S, skin.color, skinOl);
      addShading(ctx, hX, hY, hW, 7, S, skinHi, skin.shadow);
      const shadowSide = isLeft ? hX + hW - 2 : hX + 1;
      drawRect(ctx, shadowSide, hY + 2, 1, 3, S, skin.shadow);
      const earSide = isLeft ? hX : hX + hW - 1;
      drawPixel(ctx, earSide, hY + 3, S, skin.shadow);
    } else {
      const hW = 10;
      const hX = cg - 5 + bx;
      drawRoundedBox(ctx, hX, hY, hW, 7, S, skin.color, skinOl);
      addShading(ctx, hX, hY, hW, 7, S, skinHi, skin.shadow);
      drawRect(ctx, hX + 1, hY + 6, hW - 2, 1, S, skin.shadow + '40');
      drawPixel(ctx, hX, hY + 3, S, skin.shadow);
      drawPixel(ctx, hX + hW - 1, hY + 3, S, skin.shadow);
    }
  };

  const drawFace = () => {
    if (isBack) return;
    const hy = off.headY || 0;
    const hY = bg + 1 + hy;
    const eyeStyle = config.eyeStyle;

    if (isSide) {
      const eyeX = isLeft ? cg - 3 + bx : cg + 1 + bx;
      const eyeRow = hY + 3;

      if (eyeStyle === 'glowing') {
        ctx.shadowColor = eyeData.color;
        ctx.shadowBlur = S * 3;
        drawPixel(ctx, eyeX, eyeRow, S, '#ffffff');
        drawPixel(ctx, eyeX + 1, eyeRow, S, eyeData.color);
        ctx.shadowBlur = 0;
      } else if (eyeStyle === 'cyber') {
        drawRect(ctx, eyeX - 0.5, eyeRow, 3, 1, S, '#0f172a80');
        drawPixel(ctx, eyeX, eyeRow, S, '#ffffff');
        drawPixel(ctx, eyeX + 1, eyeRow, S, eyeData.color);
      } else if (eyeStyle === 'wide') {
        drawPixel(ctx, eyeX, eyeRow - 0.5, S, '#0f172a');
        drawPixel(ctx, eyeX, eyeRow + 0.5, S, eyeData.color);
        drawPixel(ctx, eyeX + 1, eyeRow, S, '#ffffff');
      } else if (eyeStyle === 'narrow') {
        drawRect(ctx, eyeX, eyeRow + 0.3, 2, 0.5, S, eyeData.color);
      } else if (eyeStyle === 'scar') {
        drawPixel(ctx, eyeX, eyeRow, S, '#ffffff');
        drawPixel(ctx, eyeX + 1, eyeRow, S, eyeData.color);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo((eyeX - 0.5) * S, (eyeRow - 0.5) * S);
        ctx.lineTo((eyeX + 1.5) * S, (eyeRow + 1.5) * S);
        ctx.stroke();
      } else {
        drawPixel(ctx, eyeX, eyeRow, S, '#ffffff');
        drawPixel(ctx, eyeX + 1, eyeRow, S, eyeData.color);
      }

      const mouthX = isLeft ? cg - 2 + bx : cg + bx;
      drawRect(ctx, mouthX, hY + 5, 1.5, 0.5, S, skin.shadow);
      return;
    }

    const browRow = hY + 2;
    const eyeRow = hY + 3;
    const leftEyeX = cg - 3 + bx;
    const rightEyeX = cg + 1 + bx;

    drawPixel(ctx, leftEyeX, browRow, S, skin.shadow);
    drawPixel(ctx, leftEyeX + 1, browRow, S, skin.shadow);
    drawPixel(ctx, rightEyeX, browRow, S, skin.shadow);
    drawPixel(ctx, rightEyeX + 1, browRow, S, skin.shadow);

    if (eyeStyle === 'glowing') {
      ctx.shadowColor = eyeData.color;
      ctx.shadowBlur = S * 3;
      drawPixel(ctx, leftEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, leftEyeX + 1, eyeRow, S, eyeData.color);
      drawPixel(ctx, rightEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, rightEyeX + 1, eyeRow, S, eyeData.color);
      ctx.shadowBlur = 0;
    } else if (eyeStyle === 'cyber') {
      drawRect(ctx, cg - 4 + bx, eyeRow, 8, 1, S, '#0f172a80');
      drawPixel(ctx, leftEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, leftEyeX + 1, eyeRow, S, eyeData.color);
      drawPixel(ctx, rightEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, rightEyeX + 1, eyeRow, S, eyeData.color);
      drawPixel(ctx, cg + bx, eyeRow, S, eyeData.color + '40');
    } else if (eyeStyle === 'wide') {
      drawPixel(ctx, leftEyeX, eyeRow - 0.5, S, '#0f172a');
      drawPixel(ctx, leftEyeX + 1, eyeRow - 0.5, S, '#0f172a');
      drawPixel(ctx, leftEyeX, eyeRow + 0.5, S, eyeData.color);
      drawPixel(ctx, leftEyeX + 1, eyeRow + 0.5, S, '#ffffff');
      drawPixel(ctx, rightEyeX, eyeRow - 0.5, S, '#0f172a');
      drawPixel(ctx, rightEyeX + 1, eyeRow - 0.5, S, '#0f172a');
      drawPixel(ctx, rightEyeX, eyeRow + 0.5, S, '#ffffff');
      drawPixel(ctx, rightEyeX + 1, eyeRow + 0.5, S, eyeData.color);
    } else if (eyeStyle === 'narrow') {
      drawRect(ctx, leftEyeX, eyeRow + 0.3, 2, 0.5, S, eyeData.color);
      drawRect(ctx, rightEyeX, eyeRow + 0.3, 2, 0.5, S, eyeData.color);
    } else if (eyeStyle === 'scar') {
      drawPixel(ctx, leftEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, leftEyeX + 1, eyeRow, S, eyeData.color);
      drawPixel(ctx, rightEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, rightEyeX + 1, eyeRow, S, eyeData.color);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo((leftEyeX - 0.5) * S, (eyeRow - 1) * S);
      ctx.lineTo((leftEyeX + 2) * S, (eyeRow + 1.5) * S);
      ctx.stroke();
    } else {
      drawPixel(ctx, leftEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, leftEyeX + 1, eyeRow, S, eyeData.color);
      drawPixel(ctx, rightEyeX, eyeRow, S, '#ffffff');
      drawPixel(ctx, rightEyeX + 1, eyeRow, S, eyeData.color);
    }

    drawRect(ctx, cg - 0.5 + bx, hY + 4, 0.5, 0.5, S, skin.shadow);
    drawRect(ctx, cg - 1 + bx, hY + 5, 2, 0.5, S, skin.shadow);
  };

  const drawHair = () => {
    const headOff = off.headY || 0;
    const hY = bg + 1 + headOff;
    const hc = hairData.color;
    const style = config.hairStyle;
    const hx = bx;

    if (style === 'none') return;

    if (style === 'short') {
      if (isSide) {
        const hw = 8;
        drawRoundedBox(ctx, cg - 4 + hx, hY - 1, hw, 3, S, hc, hairOl);
        drawRect(ctx, cg - 3 + hx, hY - 1, hw - 3, 1, S, hairHi);
        const sideX = isLeft ? cg + 3 + hx : cg - 4 + hx;
        drawRect(ctx, sideX, hY, 1, 3, S, hairSh);
      } else {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 1, 7, 1, S, hairHi);
        drawRect(ctx, cg - 5 + hx, hY + 1, 1, 2, S, hairSh);
        drawRect(ctx, cg + 4 + hx, hY + 1, 1, 2, S, hairSh);
      }
    } else if (style === 'spiky') {
      if (isSide) {
        drawRoundedBox(ctx, cg - 4 + hx, hY - 1, 8, 3, S, hc, hairOl);
        drawPixel(ctx, cg - 2 + hx, hY - 2, S, hc);
        drawPixel(ctx, cg + hx, hY - 3, S, hc);
        drawPixel(ctx, cg + 2 + hx, hY - 2, S, hc);
        drawPixel(ctx, cg - 2 + hx, hY - 2, S, hairOl);
        drawPixel(ctx, cg + hx, hY - 3, S, hairOl);
        drawPixel(ctx, cg + 2 + hx, hY - 2, S, hairOl);
        drawPixel(ctx, cg - 1 + hx, hY - 2, S, hairHi);
        drawPixel(ctx, cg + 1 + hx, hY - 2, S, hairHi);
        drawPixel(ctx, cg + hx, hY - 2, S, hc);
        const sideX = isLeft ? cg + 3 + hx : cg - 4 + hx;
        drawRect(ctx, sideX, hY, 1, 2, S, hairSh);
      } else {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawPixel(ctx, cg - 3 + hx, hY - 2, S, hc);
        drawPixel(ctx, cg - 1 + hx, hY - 3, S, hc);
        drawPixel(ctx, cg + 1 + hx, hY - 3, S, hc);
        drawPixel(ctx, cg + 3 + hx, hY - 2, S, hc);
        drawPixel(ctx, cg - 3 + hx, hY - 2, S, hairOl);
        drawPixel(ctx, cg - 1 + hx, hY - 3, S, hairOl);
        drawPixel(ctx, cg + 1 + hx, hY - 3, S, hairOl);
        drawPixel(ctx, cg + 3 + hx, hY - 2, S, hairOl);
        drawPixel(ctx, cg - 2 + hx, hY - 2, S, hairHi);
        drawPixel(ctx, cg + hx, hY - 2, S, hairHi);
        drawPixel(ctx, cg + 2 + hx, hY - 2, S, hairHi);
        drawPixel(ctx, cg - 5 + hx, hY + 1, S, hairSh);
        drawPixel(ctx, cg + 4 + hx, hY + 1, S, hairSh);
      }
    } else if (style === 'long') {
      if (isSide) {
        drawRoundedBox(ctx, cg - 4 + hx, hY - 1, 8, 3, S, hc, hairOl);
        drawRect(ctx, cg - 3 + hx, hY - 1, 5, 1, S, hairHi);
        const longX = isLeft ? cg + 3 + hx : cg - 5 + hx;
        drawRect(ctx, longX, hY, 2, 8, S, hc);
        drawRect(ctx, longX, hY, 2, 1, S, hairOl);
        drawRect(ctx, longX, hY + 7, 2, 1, S, hairOl);
        drawRect(ctx, longX + (isLeft ? 1 : 0), hY + 1, 1, 6, S, hairSh);
      } else {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 1, 7, 1, S, hairHi);
        drawRect(ctx, cg - 6 + hx, hY, 2, 8, S, hc);
        drawRect(ctx, cg + 4 + hx, hY, 2, 8, S, hc);
        drawRect(ctx, cg - 6 + hx, hY + 7, 2, 1, S, hairOl);
        drawRect(ctx, cg + 4 + hx, hY + 7, 2, 1, S, hairOl);
        drawRect(ctx, cg - 5 + hx, hY + 1, 1, 5, S, hairSh);
        drawRect(ctx, cg + 5 + hx, hY + 1, 1, 5, S, hairSh);
      }
    } else if (style === 'mohawk') {
      drawRect(ctx, cg - 1 + hx, hY - 4, 2, 5, S, hc);
      drawRect(ctx, cg - 1 + hx, hY - 4, 2, 1, S, hairOl);
      drawRect(ctx, cg - 2 + hx, hY - 4, 1, 5, S, hairOl);
      drawRect(ctx, cg + 1 + hx, hY - 4, 1, 5, S, hairOl);
      drawPixel(ctx, cg - 1 + hx, hY - 3, S, hairHi);
      drawPixel(ctx, cg + hx, hY - 2, S, hairSh);
      if (!isSide) {
        drawPixel(ctx, cg - 1 + hx, hY - 5, S, hc);
        drawPixel(ctx, cg + hx, hY - 5, S, hairOl);
      }
    } else if (style === 'ponytail') {
      if (isSide) {
        drawRoundedBox(ctx, cg - 4 + hx, hY - 1, 8, 3, S, hc, hairOl);
        drawRect(ctx, cg - 3 + hx, hY - 1, 5, 1, S, hairHi);
        const ptX = isLeft ? cg + 4 + hx : cg - 5 + hx;
        drawRect(ctx, ptX, hY, 1, 7, S, hc);
        drawRect(ctx, ptX, hY, 1, 1, S, hairOl);
        drawRect(ctx, ptX, hY + 6, 1, 1, S, hairSh);
        drawPixel(ctx, ptX + (isLeft ? 0 : 0), hY + 1, S, hairHi);
      } else if (isBack) {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 1, 7, 1, S, hairHi);
        drawRect(ctx, cg - 1 + hx, hY + 2, 2, 6, S, hc);
        drawRect(ctx, cg - 1 + hx, hY + 7, 2, 1, S, hairSh);
        drawRect(ctx, cg - 2 + hx, hY + 2, 1, 6, S, hairOl);
        drawRect(ctx, cg + 1 + hx, hY + 2, 1, 6, S, hairOl);
      } else {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 1, 7, 1, S, hairHi);
      }
    } else if (style === 'braids') {
      if (isSide) {
        drawRoundedBox(ctx, cg - 4 + hx, hY - 1, 8, 3, S, hc, hairOl);
        drawRect(ctx, cg - 3 + hx, hY - 1, 5, 1, S, hairHi);
        const brX = isLeft ? cg + 4 + hx : cg - 5 + hx;
        drawRect(ctx, brX, hY, 1, 9, S, hc);
        drawPixel(ctx, brX, hY + 8, S, hairSh);
        for (let i = 0; i < 9; i += 2) drawPixel(ctx, brX, hY + i, S, hairHi);
      } else {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 1, 10, 3, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 1, 7, 1, S, hairHi);
        drawRect(ctx, cg - 6 + hx, hY, 1, 9, S, hc);
        drawRect(ctx, cg + 5 + hx, hY, 1, 9, S, hc);
        drawPixel(ctx, cg - 6 + hx, hY + 8, S, hairSh);
        drawPixel(ctx, cg + 5 + hx, hY + 8, S, hairSh);
        for (let i = 0; i < 9; i += 2) {
          drawPixel(ctx, cg - 6 + hx, hY + i, S, hairHi);
          drawPixel(ctx, cg + 5 + hx, hY + i, S, hairHi);
        }
      }
    } else if (style === 'afro') {
      if (isSide) {
        drawRoundedBox(ctx, cg - 5 + hx, hY - 3, 10, 7, S, hc, hairOl);
        drawRect(ctx, cg - 4 + hx, hY - 3, 7, 1, S, hairHi);
        drawRect(ctx, cg - 5 + hx, hY - 1, 1, 3, S, hairSh);
        const sX = isLeft ? cg + 4 + hx : cg - 5 + hx;
        drawRect(ctx, sX, hY - 2, 1, 4, S, hairSh);
      } else {
        drawRoundedBox(ctx, cg - 6 + hx, hY - 3, 12, 7, S, hc, hairOl);
        drawRect(ctx, cg - 5 + hx, hY - 3, 9, 1, S, hairHi);
        drawRect(ctx, cg - 6 + hx, hY - 1, 1, 3, S, hairSh);
        drawRect(ctx, cg + 5 + hx, hY - 1, 1, 3, S, hairSh);
        drawPixel(ctx, cg - 5 + hx, hY - 3, S, hairSh);
        drawPixel(ctx, cg + 4 + hx, hY - 3, S, hairSh);
      }
    }
  };

  const drawCape = () => {
    if (config.accessory !== 'cape') return;
    if (isFront) return;
    const by = off.bodyY || 0;
    const capOl = accentDarken(accColor.color, 0.35);
    const capHi = accentBrighten(accColor.color, 25);
    const capSh = accentDarken(accColor.color, 0.65);

    if (isSide) {
      const cX = isLeft ? cg + 2 + bx : cg - 4 + bx;
      const cY = bg + 8 + by;
      drawBox(ctx, cX, cY, 3, 12, S, accColor.color, capOl);
      drawRect(ctx, cX + 1, cY + 1, 1, 1, S, capHi);
      drawRect(ctx, cX + 1, cY + 10, 1, 1, S, capSh);
    } else {
      const cX = cg - 5 + bx;
      const cY = bg + 8 + by;
      drawBox(ctx, cX, cY, 10, 12, S, accColor.color, capOl);
      addShading(ctx, cX, cY, 10, 12, S, capHi, capSh);
      drawRect(ctx, cX + 3, cY + 3, 4, 7, S, accColor.color + '60');
    }
  };

  const drawScarf = () => {
    if (config.accessory !== 'scarf') return;
    const by = off.bodyY || 0;
    const hy = off.headY || 0;
    const sY = bg + 7 + Math.min(by, hy);
    const sOl = accentDarken(accColor.color, 0.35);
    const sHi = accentBrighten(accColor.color, 25);

    if (isSide) {
      drawBox(ctx, cg - 4 + bx, sY, 8, 2, S, accColor.color, sOl);
      drawRect(ctx, cg - 3 + bx, sY, 5, 1, S, sHi);
    } else {
      drawBox(ctx, cg - 6 + bx, sY, 12, 2, S, accColor.color, sOl);
      drawRect(ctx, cg - 5 + bx, sY, 9, 1, S, sHi);
      if (isFront) {
        drawBox(ctx, cg + 3 + bx, sY + 1, 3, 5, S, accColor.color, sOl);
        drawPixel(ctx, cg + 4 + bx, sY + 5, S, accentDarken(accColor.color, 0.65));
      }
    }
  };

  const drawBelt = () => {
    if (config.accessory !== 'belt') return;
    const by = off.bodyY || 0;
    const beltY = bg + 13 + by;
    const bOl = accentDarken(accColor.color, 0.35);

    if (isSide) {
      drawBox(ctx, cg - 4 + bx, beltY, 8, 1, S, accColor.color, bOl);
    } else {
      drawBox(ctx, cg - 6 + bx, beltY, 12, 1, S, accColor.color, bOl);
      if (isFront) {
        drawPixel(ctx, cg + bx, beltY, S, '#F59E0B');
        drawPixel(ctx, cg - 1 + bx, beltY, S, accentBrighten(accColor.color, 30));
      }
    }
  };

  const drawCombatVfx = () => {
    const vfxPunch = off.vfxPunch || 0;
    const vfxKick = off.vfxKick || 0;
    const speedLines = off.vfxSpeedLines || 0;
    const by = off.bodyY || 0;

    if (speedLines > 0) {
      ctx.globalAlpha = speedLines * 0.5;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(1, S * 0.4);
      const lineCount = Math.floor(speedLines * 6) + 2;
      const originX = cx + bx * S;
      const originY = (bg + 10 + by) * S;
      for (let j = 0; j < lineCount; j++) {
        const angle = (pose === 'kick')
          ? -0.4 + (j / lineCount) * 0.8
          : -0.6 + (j / lineCount) * 1.2;
        const len = S * (4 + j * 2.5) * speedLines;
        const startR = S * 5;
        const dir = (pose === 'kick') ? 1 : 1;
        const sx2 = originX + Math.cos(angle) * startR * dir;
        const sy2 = originY + Math.sin(angle) * startR;
        const ex = originX + Math.cos(angle) * (startR + len) * dir;
        const ey = originY + Math.sin(angle) * (startR + len);
        ctx.beginPath();
        ctx.moveTo(sx2, sy2);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (vfxPunch > 0) {
      const fistX = cx + (bx + (off.bodyX || 0) * 0.5 + 6) * S;
      const fistY = (bg + 9 + by) * S;
      const burstR = S * 3.5 * vfxPunch;

      ctx.globalAlpha = vfxPunch * 0.9;
      const grad = ctx.createRadialGradient(fistX, fistY, 0, fistX, fistY, burstR);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fde68a');
      grad.addColorStop(0.6, '#f59e0b80');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fistX, fistY, burstR, 0, Math.PI * 2);
      ctx.fill();

      const sparkCount = Math.floor(vfxPunch * 5) + 2;
      for (let j = 0; j < sparkCount; j++) {
        const sa = (j / sparkCount) * Math.PI * 2 + animFrame * 0.8;
        const sr = burstR * (0.6 + Math.random() * 0.8);
        const spx = fistX + Math.cos(sa) * sr;
        const spy = fistY + Math.sin(sa) * sr;
        const sparkSize = S * (0.3 + Math.random() * 0.5);
        ctx.fillStyle = j % 2 === 0 ? '#fde68a' : '#ffffff';
        ctx.fillRect(spx, spy, sparkSize, sparkSize);
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1, S * 0.3);
      for (let j = 0; j < 3; j++) {
        const la = -0.5 + j * 0.5 + animFrame * 0.2;
        const lr = burstR * 0.8;
        ctx.beginPath();
        ctx.moveTo(fistX, fistY);
        ctx.lineTo(fistX + Math.cos(la) * lr, fistY + Math.sin(la) * lr);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (vfxKick > 0) {
      const kickX = cx + (bx + (off.rightLegX || 0) * 0.8 + 2) * S;
      const kickY = (bg + 17 + by + (off.rightLegY || 0)) * S;
      const burstR = S * 4 * vfxKick;

      ctx.globalAlpha = vfxKick * 0.85;
      const grad = ctx.createRadialGradient(kickX, kickY, 0, kickX, kickY, burstR);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#a78bfa');
      grad.addColorStop(0.5, '#7c3aed80');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(kickX, kickY, burstR, 0, Math.PI * 2);
      ctx.fill();

      const arcR = burstR * 1.2;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = Math.max(1, S * 0.5);
      ctx.beginPath();
      ctx.arc(kickX - arcR * 0.3, kickY, arcR, -0.8, 0.8);
      ctx.stroke();

      const sparkCount = Math.floor(vfxKick * 6) + 2;
      for (let j = 0; j < sparkCount; j++) {
        const sa = (j / sparkCount) * Math.PI * 2 + animFrame * 1.2;
        const sr = burstR * (0.5 + Math.random() * 0.9);
        const spx = kickX + Math.cos(sa) * sr;
        const spy = kickY + Math.sin(sa) * sr;
        const sparkSize = S * (0.4 + Math.random() * 0.5);
        ctx.fillStyle = j % 3 === 0 ? '#ffffff' : j % 3 === 1 ? '#c4b5fd' : '#a78bfa';
        ctx.fillRect(spx, spy, sparkSize, sparkSize);
      }
      ctx.globalAlpha = 1;
    }
  };

  drawAura();
  drawShadow();

  if (isBack) {
    drawCape();
    drawLegs();
    drawBody();
    drawArmorDetail();
    drawArms();
    drawHead();
    drawHair();
    drawBelt();
    drawCombatVfx();
  } else {
    drawLegs();
    drawBody();
    drawArmorDetail();
    drawArms();
    drawHead();
    drawFace();
    drawHair();
    drawScarf();
    drawBelt();
    drawCape();
    drawCombatVfx();
  }
}

const CATEGORIES = [
  { id: 'skin', label: 'Skin', icon: '👤' },
  { id: 'hair', label: 'Hair', icon: '💇' },
  { id: 'eyes', label: 'Eyes', icon: '👁️' },
  { id: 'armor', label: 'Armor', icon: '🛡️' },
  { id: 'boots', label: 'Boots', icon: '👢' },
  { id: 'accessory', label: 'Gear', icon: '⚔️' },
];

function ColorSwatch({ items, selected, onSelect, size = 28 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            width: size, height: size, borderRadius: '50%', border: selected === item.id ? '2px solid #22d3ee' : '2px solid transparent',
            background: item.color, cursor: 'pointer', outline: 'none',
            boxShadow: selected === item.id ? '0 0 8px #22d3ee80' : 'none',
            transition: 'all 0.15s',
          }}
          title={item.id}
        />
      ))}
    </div>
  );
}

function PartSelector({ items, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: selected === item.id ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)',
            color: selected === item.id ? '#22d3ee' : '#94a3b8',
            fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 500,
            outline: selected === item.id ? '1px solid rgba(34,211,238,0.4)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

export default function AvatarDesigner() {
  const [config, setConfig] = useState(loadAvatarConfig);
  const [category, setCategory] = useState('skin');
  const [rotation, setRotation] = useState(0);
  const [animFrame, setAnimFrame] = useState(0);
  const [saved, setSaved] = useState(false);
  const [pose, setPose] = useState('idle');
  const canvasRef = useRef(null);
  const miniCanvasRefs = useRef([null, null, null, null]);

  const update = useCallback((key, val) => {
    setConfig(prev => {
      const next = { ...prev, [key]: val };
      saveAvatarConfig(next);
      return next;
    });
    setSaved(false);
  }, []);

  useEffect(() => {
    if (canvasRef.current) drawAvatar(canvasRef.current, config, rotation, pose, animFrame);
    miniCanvasRefs.current.forEach((c, i) => {
      if (c) drawAvatar(c, config, i, pose, animFrame);
    });
  }, [config, rotation, animFrame, pose]);

  useEffect(() => {
    const speed = pose === 'idle' ? 450 : pose === 'run' ? 120 : pose === 'punch' || pose === 'kick' ? 100 : pose === 'dodge' ? 90 : pose === 'jump' ? 130 : 200;
    const id = setInterval(() => setAnimFrame(f => f + 1), speed);
    return () => clearInterval(id);
  }, [pose]);

  const handleSave = () => {
    saveAvatarConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRandomize = () => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)].id;
    const newConfig = {
      ...config,
      skinTone: pick(SKIN_TONES),
      hairStyle: pick(HAIR_STYLES),
      hairColor: pick(HAIR_COLORS),
      eyeStyle: pick(EYE_STYLES),
      eyeColor: pick(EYE_COLORS),
      armor: pick(ARMOR_SETS),
      accessory: pick(ACCESSORIES),
      accessoryColor: pick(ACCESSORY_COLORS),
      boots: pick(BOOT_STYLES),
    };
    setConfig(newConfig);
    saveAvatarConfig(newConfig);
    setSaved(false);
  };

  const rotationLabels = ['Front', 'Left', 'Back', 'Right'];

  return (
    <div style={{
      width: '100%', height: '100%', background: '#050a18', fontFamily: 'Jost, sans-serif',
      display: 'flex', flexDirection: 'column', color: '#e2e8f0', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes avatarPulse { 0%,100% { box-shadow: 0 0 30px rgba(34,211,238,0.1); } 50% { box-shadow: 0 0 50px rgba(34,211,238,0.2); } }
        @keyframes savedFlash { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }
        .avatar-cat-btn { transition: all 0.2s; }
        .avatar-cat-btn:hover { background: rgba(34,211,238,0.1) !important; }
      `}</style>

      <div style={{
        padding: '10px 20px', borderBottom: '1px solid rgba(6,182,212,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Avatar Designer</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Customize your Grudge Studios identity</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleRandomize} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.3)',
            background: 'rgba(168,85,247,0.1)', color: '#a855f7', cursor: 'pointer',
            fontFamily: 'Jost', fontSize: 13, fontWeight: 600,
          }}>🎲 Randomize</button>
          <button onClick={handleSave} style={{
            padding: '8px 24px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', cursor: 'pointer',
            fontFamily: 'Jost', fontSize: 13, fontWeight: 600,
          }}>{saved ? '✓ Saved!' : '💾 Save'}</button>
          <button onClick={() => window.location.href = '/social'} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer',
            fontFamily: 'Jost', fontSize: 13,
          }}>← Back</button>
        </div>
      </div>

      <div style={{
        display: 'flex', flex: 1, gap: 0, overflow: 'hidden', minHeight: 0,
      }}>
        <div style={{
          flex: '0 0 auto', width: 'clamp(240px, 28vw, 360px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 16px', borderRight: '1px solid rgba(6,182,212,0.1)',
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 70%)',
          overflow: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: 240, aspectRatio: '6/7', borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(5,10,24,0.95) 100%)',
            border: '1px solid rgba(34,211,238,0.15)', animation: 'avatarPulse 3s infinite',
            position: 'relative', flexShrink: 0,
          }}>
            <canvas ref={canvasRef} width={240} height={280} style={{ width: '100%', height: '100%' }} />
            <div style={{
              position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center',
              fontSize: 10, color: '#64748b', letterSpacing: 1,
            }}>{rotationLabels[rotation]} View</div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexShrink: 0 }}>
            {[0, 1, 2, 3].map(r => (
              <button key={r} onClick={() => setRotation(r)} style={{
                padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: rotation === r ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)',
                color: rotation === r ? '#22d3ee' : '#64748b', fontSize: 10, fontFamily: 'Jost',
              }}>{rotationLabels[r]}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexShrink: 0 }}>
            {[0, 1, 2, 3].map(i => (
              <canvas
                key={i}
                ref={el => miniCanvasRefs.current[i] = el}
                width={60}
                height={70}
                style={{
                  width: 48, height: 56, borderRadius: 6,
                  border: rotation === i ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(15,23,42,0.5)', cursor: 'pointer',
                }}
                onClick={() => setRotation(i)}
              />
            ))}
          </div>

          <div style={{
            marginTop: 12, width: '100%', flexShrink: 0,
          }}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 600, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6,
            }}>Animation</label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
            }}>
              {AVATAR_POSES.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPose(p.id); setAnimFrame(0); }}
                  title={p.name}
                  style={{
                    padding: '4px 2px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: pose === p.id ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                    outline: pose === p.id ? '1px solid rgba(168,85,247,0.5)' : 'none',
                    color: pose === p.id ? '#a855f7' : '#64748b',
                    fontSize: 9, fontFamily: 'Jost', fontWeight: 500,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 12, padding: '8px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center', width: '100%', flexShrink: 0,
          }}>
            <input
              value={config.name}
              onChange={e => update('name', e.target.value.slice(0, 20))}
              maxLength={20}
              style={{
                background: 'transparent', border: 'none', outline: 'none', textAlign: 'center',
                color: '#22d3ee', fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700,
                width: '100%',
              }}
              placeholder="Enter name..."
            />
            <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{config.name.length}/20</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(6,182,212,0.1)',
            padding: '0 16px', overflow: 'auto', flexShrink: 0,
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className="avatar-cat-btn"
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '14px 20px', border: 'none', cursor: 'pointer',
                  background: category === cat.id ? 'rgba(34,211,238,0.08)' : 'transparent',
                  color: category === cat.id ? '#22d3ee' : '#64748b',
                  fontFamily: 'Jost', fontSize: 13, fontWeight: 600,
                  borderBottom: category === cat.id ? '2px solid #22d3ee' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >{cat.icon} {cat.label}</button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }}>
            {category === 'skin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Skin Tone</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SKIN_TONES.map(t => (
                      <button key={t.id} onClick={() => update('skinTone', t.id)} style={{
                        width: 40, height: 40, borderRadius: 10, border: config.skinTone === t.id ? '2px solid #22d3ee' : '2px solid transparent',
                        background: `linear-gradient(135deg, ${t.color}, ${t.shadow})`, cursor: 'pointer',
                        boxShadow: config.skinTone === t.id ? '0 0 12px #22d3ee40' : 'none',
                        transition: 'all 0.15s',
                      }} title={t.id} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {category === 'hair' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Style</label>
                  <PartSelector items={HAIR_STYLES} selected={config.hairStyle} onSelect={v => update('hairStyle', v)} />
                </div>
                <div>
                  <label style={labelStyle}>Color</label>
                  <ColorSwatch items={HAIR_COLORS} selected={config.hairColor} onSelect={v => update('hairColor', v)} size={32} />
                </div>
              </div>
            )}

            {category === 'eyes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Style</label>
                  <PartSelector items={EYE_STYLES} selected={config.eyeStyle} onSelect={v => update('eyeStyle', v)} />
                </div>
                <div>
                  <label style={labelStyle}>Color</label>
                  <ColorSwatch items={EYE_COLORS} selected={config.eyeColor} onSelect={v => update('eyeColor', v)} size={32} />
                </div>
              </div>
            )}

            {category === 'armor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <label style={labelStyle}>Armor Set</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {ARMOR_SETS.map(a => (
                    <button key={a.id} onClick={() => update('armor', a.id)} style={{
                      padding: '14px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: config.armor === a.id
                        ? `linear-gradient(135deg, ${(a.bodyColor || '#334155') + '40'}, ${(a.accent || '#1e293b') + '60'})`
                        : 'rgba(255,255,255,0.03)',
                      outline: config.armor === a.id ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.05)',
                      color: config.armor === a.id ? '#e2e8f0' : '#94a3b8',
                      fontFamily: 'Jost', fontSize: 13, fontWeight: 500, textAlign: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, margin: '0 auto 6px',
                        background: a.bodyColor ? `linear-gradient(135deg, ${a.bodyColor}, ${a.accent})` : 'rgba(255,255,255,0.1)',
                      }} />
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {category === 'boots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <label style={labelStyle}>Boot Style</label>
                <PartSelector items={BOOT_STYLES} selected={config.boots} onSelect={v => update('boots', v)} />
              </div>
            )}

            {category === 'accessory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Accessory</label>
                  <PartSelector items={ACCESSORIES} selected={config.accessory} onSelect={v => update('accessory', v)} />
                </div>
                {config.accessory !== 'none' && (
                  <div>
                    <label style={labelStyle}>Color</label>
                    <ColorSwatch items={ACCESSORY_COLORS} selected={config.accessoryColor} onSelect={v => update('accessoryColor', v)} size={32} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
};
