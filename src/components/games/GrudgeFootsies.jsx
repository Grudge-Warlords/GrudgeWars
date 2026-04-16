import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS, ARMOR_SETS, BOOT_STYLES, loadAvatarConfig, DEFAULT_CONFIG } from '../avatar/AvatarDesigner';

const CW = 960, CH = 540;
const GROUND_Y = 430;
const STAGE_L = 60, STAGE_R = 900;
const CHAR_SCALE = 1.05;
const WALK_SPD = 2.8, BACK_SPD = 2.0, DASH_SPD = 8, DASH_DUR = 12;
const PUSH_W = 40, MAX_GUARD = 3, SPECIAL_HOLD = 30;

const FW = 60, FH = 50;

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r,r,r,r];
    if (!Array.isArray(r)) r = [0,0,0,0];
    const [tl,tr,br,bl] = r.map(v => Math.min(v, w/2, h/2));
    this.moveTo(x+tl,y); this.lineTo(x+w-tr,y); this.arcTo(x+w,y,x+w,y+tr,tr);
    this.lineTo(x+w,y+h-br); this.arcTo(x+w,y+h,x+w-br,y+h,br);
    this.lineTo(x+bl,y+h); this.arcTo(x,y+h,x,y+h-bl,bl);
    this.lineTo(x,y+tl); this.arcTo(x,y,x+tl,y,tl); this.closePath(); return this;
  };
}

function darken(hex, f) {
  if (!hex||hex.length<7) return hex||'#000'; const h=hex.replace('#','');
  const r=Math.max(0,Math.min(255,Math.round(parseInt(h.substring(0,2),16)*f)));
  const g=Math.max(0,Math.min(255,Math.round(parseInt(h.substring(2,4),16)*f)));
  const b=Math.max(0,Math.min(255,Math.round(parseInt(h.substring(4,6),16)*f)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
function lighten(hex, a) {
  if (!hex||hex.length<7) return hex||'#fff'; const h=hex.replace('#','');
  const r=Math.min(255,parseInt(h.substring(0,2),16)+a);
  const g=Math.min(255,parseInt(h.substring(2,4),16)+a);
  const b=Math.min(255,parseInt(h.substring(4,6),16)+a);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

const SHEETS = {
  idle:       { type:'multi', files:['Idle_0','Idle_1','Idle_2','Idle_3','Idle_4'], count:5 },
  forward:    { sheet:'F00_Forward', cols:2, rows:3, count:6 },
  backward:   { sheet:'F00_Backward', cols:2, rows:3, count:6 },
  dash_fwd:   { sheet:'F00_ForwardDash', cols:2, rows:3, count:6 },
  dash_back:  { sheet:'F00_BackwardDash', cols:2, rows:2, count:4 },
  n_attack:   { sheet:'F00_Attack_0', cols:2, rows:3, count:5 },
  b_attack:   { sheet:'F00_Attack_2', cols:2, rows:3, count:6 },
  n_special:  { sheet:'F00_Attack_1', cols:3, rows:3, count:9 },
  b_special:  { sheet:'F00_Attack_3', cols:2, rows:4, count:8 },
  guard:      { sheet:'F00_StandGuard', cols:1, rows:2, count:2 },
  guard_break:{ sheet:'F00_GuardBreak', cols:1, rows:2, count:2 },
  damage:     { sheet:'F00_Damage', cols:2, rows:2, count:4 },
  dead:       { sheet:'F00_Dead', cols:3, rows:3, count:7 },
  win:        { sheet:'F00_Win', cols:3, rows:3, count:8 },
};

const ACT_SHEET_MAP = {
  0:'idle', 1:'forward', 2:'backward', 10:'dash_fwd', 11:'dash_back',
  100:'n_attack', 105:'b_attack', 110:'n_special', 115:'b_special',
  200:'damage', 305:'guard', 310:'guard_break', 500:'dead', 510:'win',
};

function getSpriteFrame(sheetKey, progress) {
  const s = SHEETS[sheetKey];
  if (!s) return { key: sheetKey, frameIdx: 0, src: null };
  const fi = Math.min(s.count - 1, Math.floor(progress * s.count));
  if (s.type === 'multi') return { key: s.files[fi], frameIdx: 0, src: null, single: true };
  const col = fi % s.cols, row = Math.floor(fi / s.cols);
  return { key: s.sheet, frameIdx: fi, sx: col * FW, sy: row * FH, single: false };
}

function drawSpriteRef(ctx, sprites, sheetKey, progress, x, groundY, facingRight, alpha) {
  if (alpha <= 0) return;
  const fr = getSpriteFrame(sheetKey, progress);
  const img = sprites[fr.key];
  if (!img || !img.complete || img.naturalWidth === 0) return;
  const scale = 2.6;
  const rw = FW * scale, rh = FH * scale;
  ctx.save(); ctx.globalAlpha = alpha;
  if (!facingRight) { ctx.translate(x, 0); ctx.scale(-1, 1); x = 0; }
  if (fr.single) {
    ctx.drawImage(img, x - rw/2, groundY - rh + 6, rw, rh);
  } else {
    ctx.drawImage(img, fr.sx, fr.sy, FW, FH, x - rw/2, groundY - rh + 6, rw, rh);
  }
  ctx.restore();
}

function K(t, hx,hy, lsx,lsy,lex,ley,lhx,lhy, rsx,rsy,rex,rey,rhx,rhy, lix,liy,lkx,lky,lfx,lfy, rix,riy,rkx,rky,rfx,rfy) {
  return { t, h:[hx,hy], ls:[lsx,lsy], le:[lex,ley], lh:[lhx,lhy], rs:[rsx,rsy], re:[rex,rey], rh:[rhx,rhy], li:[lix,liy], lk:[lkx,lky], lf:[lfx,lfy], ri:[rix,riy], rk:[rkx,rky], rf:[rfx,rfy] };
}
function lerpPt(a,b,t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]; }
function lerpSkel(a,b,t) {
  const r={}; for (const k of Object.keys(a)) {
    if (k==='t') continue;
    r[k] = Array.isArray(a[k]) ? lerpPt(a[k],b[k],t) : a[k]+(b[k]-a[k])*t;
  } return r;
}
function easeInOut(t) { return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
function getSkel(kfs, progress) {
  const p = Math.max(0, Math.min(0.999, progress));
  for (let i=0; i<kfs.length-1; i++) {
    if (p <= kfs[i+1].t) {
      const raw = (p-kfs[i].t)/(kfs[i+1].t-kfs[i].t);
      return lerpSkel(kfs[i], kfs[i+1], easeInOut(Math.max(0,Math.min(1,raw))));
    }
  }
  return kfs[kfs.length-1];
}

const idle = K(0, 3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5);
const SKEL = {
  idle: [
    K(0,   3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116,  8,72,12,40,16,5,  -6,72,-10,38,-12,5),
    K(0.25,3,128, 10,106,18,98,14,116,  -8,106,-14,98,-10,114,   8,70,12,39,16,5,  -6,70,-10,37,-12,5),
    K(0.5, 3,126, 10,104,18,96,14,114,  -8,104,-14,96,-10,112,   8,68,13,38,16,5,  -6,68,-11,36,-12,5),
    K(0.75,3,128, 10,106,18,98,14,116,  -8,106,-14,98,-10,114,   8,70,12,39,16,5,  -6,70,-10,37,-12,5),
    K(1,   3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116,  8,72,12,40,16,5,  -6,72,-10,38,-12,5),
  ],
  forward: [
    K(0,   6,128, 10,106,18,98,14,116,  -8,106,-14,100,-10,108,  10,70,18,38,22,5, -6,70,-8,42,-4,5),
    K(0.17,7,129, 10,107,16,97,12,114,  -8,107,-16,99,-12,110,   8,71,14,40,16,5,  -4,71,-6,40,-6,5),
    K(0.33,6,130, 10,108,14,98,10,116,  -8,108,-12,100,-8,114,   6,72,10,42,10,5,  -6,72,-10,40,-10,5),
    K(0.5, 6,128, 10,106,12,100,8,108,  -8,106,-18,98,-14,116,   4,70,-2,42,-4,5,  -4,70,12,38,18,5),
    K(0.67,7,129, 10,107,14,99,10,112,  -8,107,-16,99,-12,114,   6,71,6,40,8,5,    -4,71,4,40,6,5),
    K(0.83,6,130, 10,108,16,100,12,116, -8,108,-14,100,-10,116,   8,72,10,42,12,5,  -6,72,-8,40,-8,5),
    K(1,   6,128, 10,106,18,98,14,116,  -8,106,-14,100,-10,108,  10,70,18,38,22,5, -6,70,-8,42,-4,5),
  ],
  backward: [
    K(0,   -2,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116,  6,72,4,42,2,5,   -8,72,-14,40,-16,5),
    K(0.17,-3,129, 10,107,18,99,14,117,  -8,107,-14,99,-10,115,   8,71,8,41,8,5,   -6,71,-10,41,-10,5),
    K(0.33,-2,130, 10,108,16,100,12,118, -8,108,-12,100,-8,116,   6,72,10,40,10,5, -6,72,-10,40,-10,5),
    K(0.5, -2,130, 10,108,14,100,10,116, -8,108,-18,98,-14,118,   4,72,-2,42,-6,5, -4,72,8,38,14,5),
    K(0.67,-3,129, 10,107,16,99,12,117,  -8,107,-14,99,-10,115,   6,71,6,41,6,5,   -6,71,-6,41,-6,5),
    K(0.83,-2,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116,   8,72,8,40,8,5,  -8,72,-12,40,-14,5),
    K(1,   -2,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116,  6,72,4,42,2,5,   -8,72,-14,40,-16,5),
  ],
  dash_fwd: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.15, 8,126, 12,106,20,96,16,114, -6,106,-10,96,-6,112,   12,68,20,36,24,5, -10,68,-14,38,-16,5),
    K(0.35,16,122, 16,102,26,94,22,108, -4,102,-6,92,-2,106,    16,64,26,34,30,5, -14,64,-18,36,-20,5),
    K(0.55,18,120, 18,100,28,92,24,106, -2,100,-4,90,0,104,     18,62,28,32,32,5, -16,62,-20,34,-22,5),
    K(0.8, 10,126, 14,106,22,98,18,114, -6,106,-12,96,-8,112,   12,68,18,38,20,5, -10,68,-14,38,-16,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  dash_back: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.25,-8,134, 8,112,16,104,12,122, -10,112,-16,104,-12,120, 4,76,0,46,-4,10, -8,76,-14,44,-18,8),
    K(0.6,-14,130, 6,110,14,102,10,120, -12,110,-18,100,-14,118, 2,74,-4,44,-8,5, -10,74,-16,42,-20,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  n_attack: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.15, 0,124, 8,104,4,94,-2,100,   -10,104,-16,96,-12,108, 6,68,10,38,14,5, -8,68,-12,38,-14,5),
    K(0.3, -4,118, 6,100,0,88,-6,94,    -12,100,-18,92,-14,104, 4,64,8,36,12,5,  -10,64,-14,36,-16,5),
    K(0.5, 18,112, 20,96,38,92,54,86,   -6,96,-12,88,-8,98,     16,62,24,34,28,5, -14,62,-18,36,-20,5),
    K(0.65,14,116, 18,98,34,94,48,88,   -8,98,-12,90,-8,100,    14,64,22,36,26,5, -12,64,-16,36,-18,5),
    K(0.85, 6,124, 12,104,20,98,16,112, -8,104,-14,96,-10,110,  10,68,14,38,16,5, -8,68,-12,38,-14,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  b_attack: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.12, 0,126, 8,106,6,96,0,102,    -10,106,-18,98,-14,110, 6,70,10,40,14,5, -8,70,-12,38,-14,5),
    K(0.25,-6,120, 4,100,-2,88,-8,92,   -14,100,-20,90,-16,102, 4,66,6,36,10,5,  -10,66,-14,36,-16,5),
    K(0.42,16,114, 18,98,36,94,50,88,   -8,98,-14,88,-10,98,    14,64,22,34,26,5, -12,64,-16,36,-18,5),
    K(0.55,20,110, 22,96,42,90,58,84,   -6,96,-10,86,-6,96,     16,62,24,32,28,5, -14,62,-18,34,-20,5),
    K(0.7, 12,118, 16,102,30,96,40,92,  -8,102,-14,92,-10,104,  12,66,18,36,22,5, -10,66,-14,36,-16,5),
    K(0.85, 6,124, 12,104,20,98,16,112, -8,104,-14,96,-10,110,  10,68,14,38,16,5, -8,68,-12,38,-14,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  n_special: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.08, 2,128, 10,106,16,98,12,116, -8,106,-14,98,-10,114,  8,70,12,40,16,5, -6,70,-10,38,-12,5),
    K(0.18,-2,122, 6,102,2,90,-4,96,    -12,102,-20,92,-16,106, 4,66,8,36,10,5,  -10,66,-14,36,-16,5),
    K(0.3, -6,116, 4,98,-4,84,-10,88,   -14,98,-22,86,-18,100,  2,62,4,34,6,5,   -12,62,-16,34,-18,5),
    K(0.42,-8,112, 2,96,-6,80,-12,84,   -16,96,-24,82,-20,96,   0,58,2,32,4,5,   -14,58,-18,32,-20,5),
    K(0.55,22,108, 24,94,48,88,66,82,   -4,94,-8,84,-4,94,      18,60,28,30,32,5, -16,60,-20,32,-22,5),
    K(0.65,20,112, 22,96,44,90,60,84,   -6,96,-10,86,-6,96,     16,62,26,32,30,5, -14,62,-18,34,-20,5),
    K(0.8, 10,122, 14,104,24,96,20,110, -8,104,-14,94,-10,108,  10,68,16,38,18,5, -10,68,-14,38,-16,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  b_special: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.1,  2,128, 10,106,18,98,14,116, -8,106,-14,98,-10,114,  6,70,10,40,14,5, -6,70,-10,38,-12,5),
    K(0.2, -4,124, 8,104,14,96,10,112,  -10,104,-16,96,-12,110, 4,68,6,42,4,10,  -8,68,-12,38,-14,5),
    K(0.32,-8,120, 14,104,22,100,18,114, -14,104,-20,94,-16,108, 8,66,14,54,20,50, -12,64,-16,36,-18,5),
    K(0.45,-10,118, 16,102,24,98,20,112, -16,102,-22,92,-18,106, 14,68,28,64,42,52, -14,62,-18,34,-20,5),
    K(0.55,-12,116, 18,100,26,96,22,110, -18,100,-24,90,-20,104, 18,70,36,78,50,86, -16,60,-20,32,-22,5),
    K(0.65,-10,118, 16,102,24,98,20,112, -16,102,-22,92,-18,106, 14,68,28,64,38,48, -14,62,-18,34,-20,5),
    K(0.78,-6,124, 12,104,18,98,14,114, -12,104,-16,96,-12,110, 8,68,10,42,12,8,  -10,66,-14,36,-16,5),
    K(0.9,  0,128, 10,106,18,100,14,116, -8,106,-14,98,-10,114, 8,70,12,40,14,5,  -8,70,-10,38,-12,5),
    K(1,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
  ],
  guard: [
    K(0,   0,126, 8,106,14,100,6,118,  -6,106,-12,100,-4,118,  10,68,14,38,16,5, -10,68,-14,38,-16,5),
    K(0.5, 0,124, 8,104,14,98,6,116,   -6,104,-12,98,-4,116,   10,66,14,37,16,5, -10,66,-14,37,-16,5),
    K(1,   0,126, 8,106,14,100,6,118,  -6,106,-12,100,-4,118,  10,68,14,38,16,5, -10,68,-14,38,-16,5),
  ],
  guard_break: [
    K(0,    0,126, 8,106,14,100,6,118,  -6,106,-12,100,-4,118,  10,68,14,38,16,5, -10,68,-14,38,-16,5),
    K(0.3, -8,122, 18,106,28,96,32,86, -20,106,-30,94,-34,84,   6,66,8,38,6,5,   -8,66,-14,38,-16,5),
    K(0.6,-12,118, 22,104,32,92,36,82, -24,104,-34,90,-38,80,   4,64,4,38,2,5,   -10,64,-16,38,-18,5),
    K(1,   -6,124, 14,106,22,98,18,112, -14,106,-20,96,-16,108, 6,68,10,38,12,5, -8,68,-12,38,-14,5),
  ],
  damage: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.2, -6,126, 16,106,24,94,26,84,  -14,106,-22,92,-24,82,  4,68,6,40,4,5,   -8,68,-14,38,-16,5),
    K(0.5,-12,122, 20,104,28,90,30,80,  -18,104,-26,88,-28,78,  0,66,2,38,0,5,   -10,66,-16,36,-18,5),
    K(0.8, -8,126, 14,106,20,96,18,108, -14,106,-20,94,-18,104, 4,68,8,40,8,5,   -8,68,-12,38,-14,5),
    K(1,   -4,128, 12,106,18,98,14,114, -10,106,-16,96,-12,112, 6,70,10,40,12,5, -8,70,-10,38,-12,5),
  ],
  dead: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.1, -8,124, 18,106,26,92,28,82,  -16,106,-24,90,-26,80,  2,68,4,38,2,5,   -10,68,-16,38,-18,5),
    K(0.25,-16,110, 14,96,20,82,24,72,  -18,96,-24,80,-28,70,   -4,60,-2,32,-4,5, -14,60,-18,34,-20,5),
    K(0.4, -22,86, 8,72,14,58,18,48,    -16,72,-22,56,-26,46,   -8,48,-6,24,-8,5, -16,48,-20,26,-22,5),
    K(0.55,-26,60, 4,48,10,36,14,28,    -14,48,-20,34,-24,26,   -10,34,-8,16,-10,5, -18,34,-22,18,-24,5),
    K(0.75,-28,36, 2,28,10,20,16,14,    -12,28,-18,18,-22,12,   -10,20,-6,10,-8,5, -18,20,-22,12,-24,5),
    K(1,   -28,28, 2,22,14,16,20,10,    -10,22,-18,14,-24,8,    -10,16,-4,8,-6,5, -18,16,-22,10,-24,5),
  ],
  win: [
    K(0,    3,130, 10,108,18,100,14,118, -8,108,-14,100,-10,116, 8,72,12,40,16,5, -6,72,-10,38,-12,5),
    K(0.15, 2,134, 12,110,16,104,12,118, -10,110,-14,104,-10,118, 8,74,12,42,14,5, -8,74,-12,42,-14,5),
    K(0.3,  0,138, 14,114,18,122,14,136, -12,114,-16,122,-12,136, 8,76,12,44,14,5, -8,76,-12,44,-14,5),
    K(0.45, 0,140, 16,116,20,126,16,140, -14,116,-18,126,-14,140, 8,76,12,44,14,5, -8,76,-12,44,-14,5),
    K(0.6,  0,138, 14,114,12,120,6,126,  -12,114,-10,120,-4,126,  8,76,12,44,14,5, -8,76,-12,44,-14,5),
    K(0.75, 0,136, 12,112,8,116,2,122,   -10,112,-6,116,0,122,   8,76,12,44,14,5, -8,76,-12,44,-14,5),
    K(1,    0,138, 14,114,12,120,6,126,  -12,114,-10,120,-4,126,  8,76,12,44,14,5, -8,76,-12,44,-14,5),
  ],
};

function getColors(config) {
  const skin = SKIN_TONES.find(s=>s.id===config.skinTone)||SKIN_TONES[1];
  const hair = HAIR_COLORS.find(h=>h.id===config.hairColor)||HAIR_COLORS[1];
  const eye = EYE_COLORS.find(e=>e.id===config.eyeColor)||EYE_COLORS[0];
  const armor = ARMOR_SETS.find(a=>a.id===config.armor)||ARMOR_SETS[0];
  const bootId = config.boots||'boots';
  const bodyCol = armor.bodyColor||skin.color;
  const accentCol = armor.accent||skin.shadow;
  const bootCol = bootId==='cyber'?'#374151':bootId==='armored'?(accentCol||'#6B7280'):'#5C3310';
  return {
    skin:skin.color, skinSh:skin.shadow, skinOl:darken(skin.color,0.3), skinHi:lighten(skin.color,30),
    hair:hair.color, hairSh:darken(hair.color,0.65), hairOl:darken(hair.color,0.3), hairHi:lighten(hair.color,25),
    eye:eye.color,
    body:bodyCol, bodySh:darken(bodyCol,0.65), bodyOl:darken(bodyCol,0.3), bodyHi:lighten(bodyCol,30),
    accent:accentCol, accentOl:darken(accentCol,0.3),
    boot:bootCol, bootOl:darken(bootCol,0.3), bootHi:lighten(bootCol,25),
    bootStyle:bootId, hasArmor:armor.id!=='none', armorId:armor.id,
  };
}

function drawLimb(ctx, ax,ay, bx,by, w, color, olColor) {
  const dx=bx-ax, dy=by-ay, len=Math.sqrt(dx*dx+dy*dy);
  if (len<1) return;
  const ang=Math.atan2(dy,dx);
  ctx.save(); ctx.translate(ax,ay); ctx.rotate(ang);
  if (olColor) { ctx.fillStyle=olColor; ctx.beginPath(); ctx.roundRect(-1,-w/2-1.5,len+2,w+3,w*0.4); ctx.fill(); }
  ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(0,-w/2,len,w,w*0.35); ctx.fill();
  ctx.restore();
}

function drawSegment(ctx, ax,ay, bx,by, w1, w2, color, olColor) {
  const dx=bx-ax, dy=by-ay, len=Math.sqrt(dx*dx+dy*dy);
  if (len<1) return;
  const ang=Math.atan2(dy,dx), perp=ang+Math.PI/2;
  const cp=Math.cos(perp), sp=Math.sin(perp);
  const pts = [
    [ax+cp*w1/2, ay+sp*w1/2], [ax-cp*w1/2, ay-sp*w1/2],
    [bx-cp*w2/2, by-sp*w2/2], [bx+cp*w2/2, by+sp*w2/2],
  ];
  if (olColor) {
    ctx.fillStyle=olColor; ctx.beginPath();
    ctx.moveTo(pts[0][0]-cp,pts[0][1]-sp); ctx.lineTo(pts[3][0]+cp,pts[3][1]+sp);
    ctx.lineTo(pts[2][0]+cp,pts[2][1]+sp); ctx.lineTo(pts[1][0]-cp,pts[1][1]-sp);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle=color; ctx.beginPath();
  ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[3][0],pts[3][1]);
  ctx.lineTo(pts[2][0],pts[2][1]); ctx.lineTo(pts[1][0],pts[1][1]);
  ctx.closePath(); ctx.fill();
}

function drawJoint(ctx,x,y,r,color) {
  ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
}

function drawFist(ctx,x,y,s,color,olColor) {
  const r=s*3.8;
  ctx.fillStyle=olColor; ctx.beginPath(); ctx.arc(x,y,r+1,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=lighten(color,15); ctx.beginPath(); ctx.arc(x-r*0.2,y-r*0.3,r*0.35,0,Math.PI*2); ctx.fill();
}

function drawBoot(ctx,x,y,s,col) {
  const w=s*10, h=s*8;
  ctx.fillStyle=col.bootOl;
  ctx.beginPath(); ctx.roundRect(x-w/2-1,y-h+1,w+2,h+2,3); ctx.fill();
  ctx.fillStyle=col.boot;
  ctx.beginPath(); ctx.roundRect(x-w/2,y-h+2,w,h,2); ctx.fill();
  if (col.bootStyle==='cyber') { ctx.fillStyle='#06B6D4'; ctx.fillRect(x-w/4,y-h+3,w/2,2); }
  else if (col.bootStyle==='armored') { ctx.fillStyle=col.accent; ctx.fillRect(x-w/4,y-h+3,w/2,2); }
  ctx.fillStyle=col.bootHi; ctx.fillRect(x-w/3,y-h+3,2,2);
}

function drawTorso(ctx, pts, col, s) {
  const pad=s*2;
  const lsh=pts.ls, rsh=pts.rs, lhi=pts.li, rhi=pts.ri;
  const cx=(lsh[0]+rsh[0]+lhi[0]+rhi[0])/4, cy=(lsh[1]+rsh[1]+lhi[1]+rhi[1])/4;
  ctx.fillStyle=col.bodyOl; ctx.beginPath();
  ctx.moveTo(lsh[0]+pad+1,lsh[1]-1); ctx.lineTo(rsh[0]-pad-1,rsh[1]-1);
  ctx.lineTo(rhi[0]-pad-2,rhi[1]+2); ctx.lineTo(lhi[0]+pad+2,lhi[1]+2);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle=col.body; ctx.beginPath();
  ctx.moveTo(lsh[0]+pad+2,lsh[1]); ctx.lineTo(rsh[0]-pad-2,rsh[1]);
  ctx.lineTo(rhi[0]-pad-1,rhi[1]); ctx.lineTo(lhi[0]+pad+1,lhi[1]);
  ctx.closePath(); ctx.fill();

  const midY=(lsh[1]+lhi[1])/2;
  if (col.hasArmor) {
    ctx.fillStyle=col.accent;
    const aw=Math.abs(lsh[0]-rsh[0])*0.4;
    ctx.fillRect(cx-aw/2, lsh[1]+s*2, aw, s*2);
    ctx.fillRect(cx-aw/3, midY, aw*0.66, s*2);
    ctx.fillStyle=col.bodyHi;
    ctx.fillRect(cx-aw/2, lsh[1]+s*1, aw, s*1);
  }
  ctx.fillStyle=col.bodySh;
  const beltW=Math.abs(lhi[0]-rhi[0])*0.7;
  ctx.fillRect(cx-beltW/2, lhi[1]-s*2, beltW, s*1.5);
}

function drawNeck(ctx, headPt, shoulderL, shoulderR, col, s) {
  const shCx=(shoulderL[0]+shoulderR[0])/2;
  const shCy=(shoulderL[1]+shoulderR[1])/2;
  const nw=s*6;
  drawSegment(ctx, headPt[0],headPt[1]+s*5, shCx,shCy, nw,nw*1.2, col.skin, col.skinOl);
}

function drawHeadPart(ctx, cx, cy, col, config, s, facingRight) {
  const w=s*12, h=s*10;
  const hairStyle=config.hairStyle;

  if (hairStyle==='long'||hairStyle==='braids'||hairStyle==='ponytail') {
    ctx.fillStyle=col.hairSh;
    const lx=facingRight?cx+w*0.3:cx-w*0.3;
    ctx.beginPath(); ctx.roundRect(lx-s*2,cy-s,s*4,s*16,2); ctx.fill();
  }

  ctx.fillStyle=col.skinOl;
  ctx.beginPath(); ctx.roundRect(cx-w/2-1,cy-h/2-1,w+2,h+2,s*3); ctx.fill();
  ctx.fillStyle=col.skin;
  ctx.beginPath(); ctx.roundRect(cx-w/2,cy-h/2,w,h,s*2.5); ctx.fill();
  ctx.fillStyle=col.skinHi;
  ctx.fillRect(cx-w/2+s,cy-h/2+s,w-s*3,s);

  if (hairStyle && hairStyle!=='none') {
    const hy=cy-h/2;
    ctx.fillStyle=col.hairOl;
    if (hairStyle==='short') {
      ctx.beginPath(); ctx.roundRect(cx-w/2-s,hy-s*3,w+s*2,s*5,s*2); ctx.fill();
      ctx.fillStyle=col.hair;
      ctx.beginPath(); ctx.roundRect(cx-w/2,hy-s*2,w,s*4,s*1.5); ctx.fill();
      ctx.fillStyle=col.hairHi; ctx.fillRect(cx-w/4,hy-s*2,w/2,s);
    } else if (hairStyle==='spiky') {
      ctx.beginPath(); ctx.roundRect(cx-w/2-s,hy-s*3,w+s*2,s*5,s*2); ctx.fill();
      ctx.fillStyle=col.hair;
      ctx.beginPath(); ctx.roundRect(cx-w/2,hy-s*2,w,s*4,s*1.5); ctx.fill();
      for (let i=-1;i<=1;i++) {
        ctx.fillStyle=col.hair; ctx.beginPath();
        ctx.moveTo(cx+i*s*3,hy-s*7); ctx.lineTo(cx+i*s*3-s*2,hy-s);
        ctx.lineTo(cx+i*s*3+s*2,hy-s); ctx.closePath(); ctx.fill();
      }
    } else if (hairStyle==='mohawk') {
      ctx.fillStyle=col.hair;
      ctx.beginPath(); ctx.roundRect(cx-s*2,hy-s*8,s*4,s*9,s); ctx.fill();
      ctx.fillStyle=col.hairHi; ctx.fillRect(cx-s,hy-s*7,s*2,s);
    } else if (hairStyle==='afro') {
      ctx.fillStyle=col.hairOl; ctx.beginPath(); ctx.arc(cx,cy-s*2,w*0.7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=col.hair; ctx.beginPath(); ctx.arc(cx,cy-s*2,w*0.6,0,Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.roundRect(cx-w/2-s,hy-s*3,w+s*2,s*5,s*2); ctx.fill();
      ctx.fillStyle=col.hair;
      ctx.beginPath(); ctx.roundRect(cx-w/2,hy-s*2,w,s*4,s*1.5); ctx.fill();
    }
  }

  const eyeDir=facingRight?1:-1;
  const eyeX=cx+s*2*eyeDir, eyeY=cy-s*0.5;
  ctx.fillStyle='#fff'; ctx.fillRect(eyeX-s,eyeY-s*0.5,s*2.2,s*1.8);
  ctx.fillStyle=col.eye; ctx.fillRect(eyeX+s*0.3*eyeDir,eyeY-s*0.3,s*1.2,s*1.5);
  if (config.eyeStyle==='glowing') {
    ctx.shadowColor=col.eye; ctx.shadowBlur=s*4;
    ctx.fillStyle=col.eye; ctx.fillRect(eyeX-s,eyeY-s*0.5,s*2.2,s*1.8);
    ctx.shadowBlur=0;
  }
  ctx.fillStyle=col.skinSh;
  ctx.fillRect(cx+s*eyeDir-s*0.5,cy+h/2-s*3,s*1.5,s*0.8);
}

function toScreen(pt, px, gy, s, flip) {
  return [px + pt[0]*s*flip, gy - pt[1]*s];
}

function drawFighter(ctx, config, actionId, actionFrame, px, groundY, facingRight, spriteAlpha, sprites) {
  const skelName = ACT_SHEET_MAP[actionId]||'idle';
  const kfs = SKEL[skelName];
  const actData = ACTIONS[actionId];
  const totalFrames = actData ? actData.frames : 60;
  const progress = actData && actData.loop
    ? (actionFrame % totalFrames) / totalFrames
    : Math.min(0.999, actionFrame / totalFrames);
  const skel = getSkel(kfs, progress);
  const s = CHAR_SCALE;
  const flip = facingRight?1:-1;

  const pts={};
  for (const k of Object.keys(skel)) {
    if (Array.isArray(skel[k])) pts[k]=toScreen(skel[k],px,groundY,s,flip);
  }

  const col = getColors(config);
  const armW=s*7.5, armW2=s*6.5;
  const legW=s*9, legW2=s*8;

  if (spriteAlpha>0 && sprites) {
    drawSpriteRef(ctx, sprites, skelName, progress, px, groundY, facingRight, spriteAlpha);
  }

  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(px,groundY+2,22*s,3*s,0,0,Math.PI*2); ctx.fill();

  drawSegment(ctx,pts.rs[0],pts.rs[1],pts.re[0],pts.re[1],armW*0.85,armW2*0.8,darken(col.body,0.65),darken(col.bodyOl,0.65));
  drawSegment(ctx,pts.re[0],pts.re[1],pts.rh[0],pts.rh[1],armW2*0.8,armW2*0.6,darken(col.skin,0.65),darken(col.skinOl,0.65));
  drawJoint(ctx,pts.re[0],pts.re[1],armW*0.32,darken(col.body,0.55));
  drawFist(ctx,pts.rh[0],pts.rh[1],s*0.65,darken(col.skin,0.65),darken(col.skinOl,0.65));

  drawSegment(ctx,pts.ri[0],pts.ri[1],pts.rk[0],pts.rk[1],legW*0.85,legW2*0.8,darken(col.accent||col.body,0.65),darken(col.bodyOl,0.65));
  drawSegment(ctx,pts.rk[0],pts.rk[1],pts.rf[0],pts.rf[1],legW2*0.8,legW2*0.65,darken(col.accent||col.body,0.65),darken(col.bodyOl,0.65));
  drawJoint(ctx,pts.rk[0],pts.rk[1],legW*0.3,darken(col.accent||col.body,0.55));
  drawBoot(ctx,pts.rf[0],pts.rf[1],s*0.65,col);

  drawNeck(ctx,pts.h,pts.ls,pts.rs,col,s);
  drawTorso(ctx,pts,col,s);

  drawSegment(ctx,pts.li[0],pts.li[1],pts.lk[0],pts.lk[1],legW,legW2,col.accent||col.body,col.accentOl||col.bodyOl);
  drawSegment(ctx,pts.li[0],pts.li[1],pts.lk[0],pts.lk[1],legW*0.7,legW2*0.7,lighten(col.accent||col.body,10),null);
  drawSegment(ctx,pts.lk[0],pts.lk[1],pts.lf[0],pts.lf[1],legW2,legW2*0.75,col.accent||col.body,col.accentOl||col.bodyOl);
  drawJoint(ctx,pts.lk[0],pts.lk[1],legW*0.32,col.bodySh);
  drawBoot(ctx,pts.lf[0],pts.lf[1],s,col);

  drawSegment(ctx,pts.ls[0],pts.ls[1],pts.le[0],pts.le[1],armW,armW2,col.body,col.bodyOl);
  drawSegment(ctx,pts.ls[0],pts.ls[1],pts.le[0],pts.le[1],armW*0.6,armW2*0.55,col.bodyHi,null);
  drawSegment(ctx,pts.le[0],pts.le[1],pts.lh[0],pts.lh[1],armW2,armW2*0.7,col.skin,col.skinOl);
  drawJoint(ctx,pts.le[0],pts.le[1],armW*0.35,col.bodySh);
  drawFist(ctx,pts.lh[0],pts.lh[1],s,col.skin,col.skinOl);

  drawHeadPart(ctx,pts.h[0],pts.h[1],col,config,s*1.8,facingRight);
}

const ACT = {
  STAND:0, FORWARD:1, BACKWARD:2,
  DASH_FORWARD:10, DASH_BACKWARD:11,
  N_ATTACK:100, B_ATTACK:105,
  N_SPECIAL:110, B_SPECIAL:115,
  DAMAGE:200, GUARD_STAND:305, GUARD_BREAK:310,
  DEAD:500, WIN:510,
};

const ACTIONS = {
  [ACT.STAND]:         { frames:60, loop:true, cancelable:true },
  [ACT.FORWARD]:       { frames:30, loop:true, cancelable:true },
  [ACT.BACKWARD]:      { frames:30, loop:true, cancelable:true },
  [ACT.DASH_FORWARD]:  { frames:DASH_DUR, loop:false, cancelable:false },
  [ACT.DASH_BACKWARD]: { frames:DASH_DUR+4, loop:false, cancelable:false },
  [ACT.N_ATTACK]:      { frames:18, loop:false, cancelable:false, hitStart:6, hitEnd:10, hitbox:{x:50,y:-70,w:60,h:40} },
  [ACT.B_ATTACK]:      { frames:24, loop:false, cancelable:false, hitStart:9, hitEnd:14, hitbox:{x:40,y:-90,w:70,h:50} },
  [ACT.N_SPECIAL]:     { frames:22, loop:false, cancelable:false, hitStart:11, hitEnd:15, hitbox:{x:30,y:-100,w:80,h:60}, isSpecial:true },
  [ACT.B_SPECIAL]:     { frames:28, loop:false, cancelable:false, hitStart:12, hitEnd:18, hitbox:{x:20,y:-100,w:80,h:80}, isSpecial:true },
  [ACT.DAMAGE]:        { frames:22, loop:false, cancelable:false },
  [ACT.GUARD_STAND]:   { frames:18, loop:false, cancelable:false },
  [ACT.GUARD_BREAK]:   { frames:35, loop:false, cancelable:false },
  [ACT.DEAD]:          { frames:40, loop:false, cancelable:false },
  [ACT.WIN]:           { frames:60, loop:true, cancelable:false },
};

const ATTACKS = {
  [ACT.N_ATTACK]:  { guardDmg:1, hitStun:12, guardStun:8, isSpecial:false },
  [ACT.B_ATTACK]:  { guardDmg:1, hitStun:16, guardStun:10, isSpecial:false },
  [ACT.N_SPECIAL]: { guardDmg:2, hitStun:20, guardStun:14, isSpecial:true },
  [ACT.B_SPECIAL]: { guardDmg:2, hitStun:24, guardStun:16, isSpecial:true },
};

const SPRITE_NAMES = [
  'Idle_0','Idle_1','Idle_2','Idle_3','Idle_4',
  'F00_Attack_0','F00_Attack_1','F00_Attack_2','F00_Attack_3',
  'F00_Forward','F00_Backward','F00_ForwardDash','F00_BackwardDash',
  'F00_StandGuard','F00_CrouchGuard','F00_GuardBreak',
  'F00_Damage','F00_Dead','F00_Win','HitEffect','Guard',
];

function loadSprites() {
  const sprites={};
  SPRITE_NAMES.forEach(name => { const img=new Image(); img.src=`/footsies/${name}.png`; sprites[name]=img; });
  return sprites;
}

function createFighter(x,facingRight,config) {
  return { x, y:GROUND_Y, vx:0, facingRight, actionId:ACT.STAND, actionFrame:0,
    hitStun:0, guardHealth:MAX_GUARD, alive:true,
    attackHeld:false, attackHeldFrames:0, hitConnected:false,
    config:{...config} };
}

function setAction(f,actId) { if(f.actionId===actId)return; f.actionId=actId; f.actionFrame=0; f.hitConnected=false; f.vx=0; }
function isActionEnd(f) { const a=ACTIONS[f.actionId]; return a?f.actionFrame>=a.frames:true; }
function isAttackAction(id) { return id===ACT.N_ATTACK||id===ACT.B_ATTACK||id===ACT.N_SPECIAL||id===ACT.B_SPECIAL; }

function createGame(p1Cfg,p2Cfg) {
  return { p1:createFighter(280,true,p1Cfg), p2:createFighter(680,false,p2Cfg),
    time:0, phase:'intro', introTimer:120,
    p1Score:0, p2Score:0, maxRounds:3,
    koTimer:0, endTimer:0,
    particles:[], shockwave:null,
    shake:{x:0,y:0,timer:0,intensity:0},
    flash:null, slowmo:0, hitEffects:[],
    spriteAlpha:0.3 };
}

function easeOut(t) { return 1-(1-t)*(1-t); }

function createParticle(x,y,color,type) {
  return { x,y, vx:(Math.random()-0.5)*(type==='spark'?12:6), vy:-Math.random()*5-2,
    life:type==='spark'?15:22, maxLife:type==='spark'?15:22,
    color, size:2+Math.random()*3, type:type||'hit',
    trail:type==='spark'?[{x,y}]:null };
}
function createHitSpark(x,y,color) {
  const sparks=[];
  for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+Math.random()*0.3,sp=3+Math.random()*5;
    sparks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:12+Math.random()*6,maxLife:18,
      color,size:1.5+Math.random()*2,type:'spark',trail:[{x,y}]});}
  return sparks;
}

function aiSelectInput(game,frame) {
  const ai=game.p2, player=game.p1;
  const dist=Math.abs(ai.x-player.x);
  const input={left:false,right:false,attack:false,attackDown:false,attackUp:false};
  if(ai.actionId===ACT.DAMAGE||ai.actionId===ACT.GUARD_BREAK||ai.actionId===ACT.DEAD) return input;
  if(ai.hitStun>0) return input;
  const r=Math.random();
  const playerAttacking=isAttackAction(player.actionId);
  if(dist>250){if(r<0.6)input.right=!ai.facingRight;if(frame%90===0&&r<0.3)input.attackDown=true;}
  else if(dist>150){if(playerAttacking)input.left=ai.facingRight;else if(r<0.4)input.right=!ai.facingRight;else if(r<0.55)input.attackDown=true;}
  else if(dist>80){if(playerAttacking){if(r<0.5)input.left=ai.facingRight;else input.attackDown=true;}else if(r<0.35)input.attackDown=true;else if(r<0.5)input.left=ai.facingRight;}
  else{if(r<0.4)input.attackDown=true;else if(r<0.55)input.left=ai.facingRight;}
  if(ai._ht>0){ai._ht--;input.attack=true;if(ai._ht<=0){input.attackUp=true;input.attack=false;}}
  else if(input.attackDown&&r<0.3&&dist<200){ai._ht=SPECIAL_HOLD+Math.floor(Math.random()*10);input.attack=true;input.attackDown=false;}
  return input;
}

function updateFighter(f,input,opponent) {
  if(f.hitStun>0){f.hitStun--;return;}
  f.actionFrame++;
  const act=ACTIONS[f.actionId];
  if(isActionEnd(f)){if(act&&act.loop)f.actionFrame=0;else setAction(f,ACT.STAND);}
  if(f.actionId===ACT.DEAD||f.actionId===ACT.WIN)return;
  if(f.actionId===ACT.DAMAGE||f.actionId===ACT.GUARD_BREAK)return;
  if(input.attackDown&&!f.attackHeld){f.attackHeld=true;f.attackHeldFrames=0;}
  if(f.attackHeld)f.attackHeldFrames++;
  if(input.attackUp&&f.attackHeld){
    f.attackHeld=false;
    if(f.attackHeldFrames>=SPECIAL_HOLD){
      const isDir=input.left||input.right;
      if(act&&act.cancelable)setAction(f,isDir?ACT.B_SPECIAL:ACT.N_SPECIAL);
      else if(isAttackAction(f.actionId)&&f.hitConnected)setAction(f,ACT.N_SPECIAL);
    } else if(act&&act.cancelable){
      setAction(f,(input.left||input.right)?ACT.B_ATTACK:ACT.N_ATTACK);
    } else if(isAttackAction(f.actionId)&&f.hitConnected){
      setAction(f,ACT.N_SPECIAL);
    }
    f.attackHeldFrames=0; return;
  }
  if(act&&!act.cancelable)return;
  const fwd=f.facingRight?input.right:input.left;
  const back=f.facingRight?input.left:input.right;
  if(fwd){setAction(f,ACT.FORWARD);f.vx=f.facingRight?WALK_SPD:-WALK_SPD;}
  else if(back){
    if(Math.abs(f.x-opponent.x)<200&&isAttackAction(opponent.actionId))setAction(f,ACT.GUARD_STAND);
    else{setAction(f,ACT.BACKWARD);f.vx=f.facingRight?-BACK_SPD:BACK_SPD;}
  } else if(f.actionId===ACT.FORWARD||f.actionId===ACT.BACKWARD)setAction(f,ACT.STAND);
}

function updateCollision(game) {
  const{p1,p2}=game;
  [{att:p1,def:p2,ad:ACTIONS[p1.actionId]},{att:p2,def:p1,ad:ACTIONS[p2.actionId]}].forEach(({att,def,ad})=>{
    if(!ad||!ad.hitbox||att.hitConnected)return;
    if(att.actionFrame<ad.hitStart||att.actionFrame>ad.hitEnd)return;
    const sign=att.facingRight?1:-1;
    const hb={x:att.x+ad.hitbox.x*sign-(sign<0?ad.hitbox.w:0),y:att.y+ad.hitbox.y,w:ad.hitbox.w,h:ad.hitbox.h};
    const db={x:def.x-PUSH_W/2,y:def.y-140,w:PUSH_W,h:140};
    if(hb.x<db.x+db.w&&hb.x+hb.w>db.x&&hb.y<db.y+db.h&&hb.y+hb.h>db.y){
      att.hitConnected=true;
      const atkD=ATTACKS[att.actionId]; if(!atkD)return;
      const cx=(Math.max(hb.x,db.x)+Math.min(hb.x+hb.w,db.x+db.w))/2;
      const cy=(Math.max(hb.y,db.y)+Math.min(hb.y+hb.h,db.y+db.h))/2;
      const blocking=def.actionId===ACT.GUARD_STAND||def.actionId===ACT.BACKWARD;
      if(blocking){
        def.guardHealth-=atkD.guardDmg; att.hitStun=Math.floor(atkD.guardStun*0.6);
        def.hitStun=atkD.guardStun; setAction(def,ACT.GUARD_STAND);
        if(def.guardHealth<=0){
          def.guardHealth=0;setAction(def,ACT.GUARD_BREAK);def.hitStun=30;
          game.shake.intensity=8;game.shake.timer=10;game.flash={color:'#f59e0b',timer:8};
          for(let i=0;i<12;i++)game.particles.push(createParticle(cx,cy,'#f59e0b'));
          game.shockwave={x:cx,y:cy,timer:0,maxTimer:15,color:'#f59e0b'};
        } else {
          game.shake.intensity=3;game.shake.timer=5;
          for(let i=0;i<6;i++)game.particles.push(createParticle(cx,cy,'#22d3ee','spark'));
          game.hitEffects.push({x:cx,y:cy,timer:0,type:'guard'});
        }
      } else {
        if(atkD.isSpecial){
          def.alive=false;setAction(def,ACT.DEAD);def.vx=(att.facingRight?1:-1)*4;
          game.shake.intensity=12;game.shake.timer=15;game.flash={color:'#ef4444',timer:12};game.slowmo=20;
          game.shockwave={x:cx,y:cy,timer:0,maxTimer:20,color:'#ef4444'};
          for(let i=0;i<20;i++)game.particles.push(createParticle(cx,cy,'#ef4444'));
          game.particles.push(...createHitSpark(cx,cy,'#ff6644'));
          game.hitEffects.push({x:cx,y:cy,timer:0,type:'ko'});
        } else {
          setAction(def,ACT.DAMAGE);def.hitStun=atkD.hitStun;def.vx=(att.facingRight?1:-1)*2.5;
          att.hitStun=Math.floor(atkD.hitStun*0.5);
          game.shake.intensity=6;game.shake.timer=8;
          game.shockwave={x:cx,y:cy,timer:0,maxTimer:12,color:'#ff8800'};
          for(let i=0;i<10;i++)game.particles.push(createParticle(cx,cy,'#ff8800'));
          game.particles.push(...createHitSpark(cx,cy,'#ffaa44'));
          game.hitEffects.push({x:cx,y:cy,timer:0,type:'hit'});
        }
      }
    }
  });
}

function updatePush(p1,p2) {
  const overlap=PUSH_W-Math.abs(p1.x-p2.x);
  if(overlap>0){const push=overlap/2+1;if(p1.x<p2.x){p1.x-=push;p2.x+=push;}else{p1.x+=push;p2.x-=push;}}
  p1.x=Math.max(STAGE_L,Math.min(STAGE_R,p1.x));
  p2.x=Math.max(STAGE_L,Math.min(STAGE_R,p2.x));
}

function updateFacing(p1,p2) {
  if(p1.actionId!==ACT.DAMAGE&&p1.actionId!==ACT.DEAD&&!isAttackAction(p1.actionId))p1.facingRight=p1.x<p2.x;
  if(p2.actionId!==ACT.DAMAGE&&p2.actionId!==ACT.DEAD&&!isAttackAction(p2.actionId))p2.facingRight=p2.x<p1.x;
}

const P2_CONFIGS = [
  {...DEFAULT_CONFIG,skinTone:'ashen',hairStyle:'mohawk',hairColor:'red',armor:'crimson',eyeColor:'red',eyeStyle:'glowing',name:'Rival'},
  {...DEFAULT_CONFIG,skinTone:'dark',hairStyle:'braids',hairColor:'white',armor:'shadow',eyeColor:'purple',eyeStyle:'glowing',name:'Shadow'},
  {...DEFAULT_CONFIG,skinTone:'spectral',hairStyle:'spiky',hairColor:'cyan',armor:'plasma',eyeColor:'cyan',eyeStyle:'cyber',name:'Phantom'},
];

export default function GrudgeFootsies() {
  const canvasRef=useRef(null);
  const gameRef=useRef(null);
  const keysRef=useRef({});
  const prevKeysRef=useRef({});
  const spritesRef=useRef(null);
  const [phase,setPhase]=useState('menu');
  const [p1Score,setP1Score]=useState(0);
  const [p2Score,setP2Score]=useState(0);
  const [spriteAlpha,setSpriteAlpha]=useState(0.3);

  useEffect(()=>{spritesRef.current=loadSprites();},[]);

  const startGame=useCallback(()=>{
    const p1Cfg=loadAvatarConfig();
    const p2Cfg=P2_CONFIGS[Math.floor(Math.random()*P2_CONFIGS.length)];
    gameRef.current=createGame(p1Cfg,p2Cfg);
    gameRef.current.p2._ht=0;
    setP1Score(0);setP2Score(0);setPhase('playing');
  },[]);

  const startNextRound=useCallback(()=>{
    const g=gameRef.current;
    g.p1=createFighter(280,true,g.p1.config);
    g.p2=createFighter(680,false,g.p2.config);
    g.p2._ht=0;
    g.phase='intro';g.introTimer=90;
    g.particles=[];g.shockwave=null;g.hitEffects=[];
    g.flash=null;g.slowmo=0;
    g.shake={x:0,y:0,timer:0,intensity:0};
  },[]);

  useEffect(()=>{
    if(phase!=='playing')return;
    const canvas=canvasRef.current; if(!canvas)return;
    canvas.width=CW;canvas.height=CH;
    const ctx=canvas.getContext('2d');

    const onKeyDown=e=>{if(['a','d','j','z','t','arrowleft','arrowright',' ','[',']'].includes(e.key.toLowerCase()))e.preventDefault();keysRef.current[e.key.toLowerCase()]=true;};
    const onKeyUp=e=>{keysRef.current[e.key.toLowerCase()]=false;};
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('keyup',onKeyUp);

    let rafId, frameCount=0;

    function gameLoop() {
      rafId=requestAnimationFrame(gameLoop);
      const g=gameRef.current; if(!g)return;
      if(g.slowmo>0){g.slowmo--;if(frameCount%3!==0){frameCount++;return;}} frameCount++;g.time++;

      const keys=keysRef.current, prev=prevKeysRef.current;

      if(g.phase==='intro'){g.introTimer--;if(g.introTimer<=0)g.phase='fight';}

      if(g.phase==='fight'){
        const p1Input={left:keys['a']||keys['arrowleft'],right:keys['d']||keys['arrowright'],
          attack:keys['j']||keys['z'],
          attackDown:(keys['j']||keys['z'])&&!(prev['j']||prev['z']),
          attackUp:!(keys['j']||keys['z'])&&(prev['j']||prev['z'])};
        const p2Input=aiSelectInput(g,g.time);
        updateFacing(g.p1,g.p2);
        updateFighter(g.p1,p1Input,g.p2); updateFighter(g.p2,p2Input,g.p1);
        g.p1.x+=g.p1.vx;g.p2.x+=g.p2.vx;
        if(g.p1.actionId===ACT.DASH_FORWARD)g.p1.x+=(g.p1.facingRight?DASH_SPD:-DASH_SPD);
        if(g.p1.actionId===ACT.DASH_BACKWARD)g.p1.x+=(g.p1.facingRight?-DASH_SPD:DASH_SPD);
        if(g.p2.actionId===ACT.DASH_FORWARD)g.p2.x+=(g.p2.facingRight?DASH_SPD:-DASH_SPD);
        if(g.p2.actionId===ACT.DASH_BACKWARD)g.p2.x+=(g.p2.facingRight?-DASH_SPD:DASH_SPD);
        if(g.p1.actionId===ACT.DAMAGE||g.p1.actionId===ACT.DEAD)g.p1.vx*=0.92;
        if(g.p2.actionId===ACT.DAMAGE||g.p2.actionId===ACT.DEAD)g.p2.vx*=0.92;
        updatePush(g.p1,g.p2); updateCollision(g);
        if(!g.p1.alive||!g.p2.alive){
          g.phase='ko';g.koTimer=90;
          if(!g.p1.alive){g.p2Score++;setP2Score(s=>s+1);setAction(g.p2,ACT.WIN);}
          if(!g.p2.alive){g.p1Score++;setP1Score(s=>s+1);setAction(g.p1,ACT.WIN);}
        }
      }

      if(g.phase==='ko'){
        g.koTimer--;
        [g.p1,g.p2].forEach(f=>{f.actionFrame++;if(f.actionId===ACT.DEAD)f.vx*=0.95;f.x+=f.vx;f.x=Math.max(STAGE_L,Math.min(STAGE_R,f.x));});
        if(g.koTimer<=0){if(g.p1Score>=g.maxRounds||g.p2Score>=g.maxRounds){g.phase='end';g.endTimer=180;}else startNextRound();}
      }
      if(g.phase==='end'){g.endTimer--;[g.p1,g.p2].forEach(f=>{f.actionFrame++;});}

      g.particles=g.particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.18;p.life--;
        if(p.trail){p.trail.push({x:p.x,y:p.y});if(p.trail.length>4)p.trail.shift();}return p.life>0;});
      g.hitEffects=g.hitEffects.filter(h=>{h.timer++;return h.timer<15;});
      if(g.shockwave){g.shockwave.timer++;if(g.shockwave.timer>=g.shockwave.maxTimer)g.shockwave=null;}
      if(g.shake.timer>0){g.shake.timer--;const i=g.shake.intensity*(g.shake.timer/10);g.shake.x=(Math.random()-0.5)*i;g.shake.y=(Math.random()-0.5)*i;}else{g.shake.x=0;g.shake.y=0;}
      if(g.flash&&g.flash.timer>0)g.flash.timer--;

      if(keys['[']&&!prev['[']){g.spriteAlpha=Math.max(0,g.spriteAlpha-0.1);setSpriteAlpha(g.spriteAlpha);}
      if(keys[']']&&!prev[']']){g.spriteAlpha=Math.min(1,g.spriteAlpha+0.1);setSpriteAlpha(g.spriteAlpha);}
      if(keys['t']&&!prev['t']){g.spriteAlpha=g.spriteAlpha>0?0:0.3;setSpriteAlpha(g.spriteAlpha);}
      prevKeysRef.current={...keys};

      ctx.save(); ctx.translate(g.shake.x,g.shake.y);

      const bgGrad=ctx.createLinearGradient(0,0,0,CH);
      bgGrad.addColorStop(0,'#0a0a1a');bgGrad.addColorStop(0.6,'#1a1a2e');bgGrad.addColorStop(1,'#16213e');
      ctx.fillStyle=bgGrad;ctx.fillRect(0,0,CW,CH);
      ctx.fillStyle='#ffffff08';ctx.fillRect(STAGE_L,GROUND_Y,STAGE_R-STAGE_L,2);
      ctx.fillStyle='#06b6d410';ctx.fillRect(STAGE_L,GROUND_Y+2,STAGE_R-STAGE_L,110);
      for(let i=STAGE_L;i<STAGE_R;i+=60){ctx.fillStyle='#ffffff05';ctx.fillRect(i,GROUND_Y,1,80);}

      const sprites=spritesRef.current;
      drawFighter(ctx,g.p1.config,g.p1.actionId,g.p1.actionFrame,g.p1.x,GROUND_Y,g.p1.facingRight,g.spriteAlpha,sprites);
      drawFighter(ctx,g.p2.config,g.p2.actionId,g.p2.actionFrame,g.p2.x,GROUND_Y,g.p2.facingRight,g.spriteAlpha,sprites);

      ctx.save();ctx.globalCompositeOperation='lighter';
      g.particles.forEach(p=>{
        const lr=p.life/p.maxLife;if(lr<=0)return;
        ctx.save();ctx.globalAlpha=lr;ctx.fillStyle=p.color;
        ctx.shadowColor=p.color;ctx.shadowBlur=p.size*2*lr;
        if(p.trail&&p.trail.length>1){ctx.lineWidth=Math.max(1,p.size*0.5*lr);ctx.strokeStyle=p.color;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(p.trail[0].x,p.trail[0].y);for(let i=1;i<p.trail.length;i++)ctx.lineTo(p.trail[i].x,p.trail[i].y);ctx.lineTo(p.x,p.y);ctx.stroke();}
        ctx.beginPath();ctx.arc(p.x,p.y,p.size*lr,0,Math.PI*2);ctx.fill();ctx.restore();
      });ctx.restore();

      g.hitEffects.forEach(h=>{const t=h.timer/15,alpha=1-t;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;
        if(h.type==='guard'){ctx.strokeStyle='#22d3ee';ctx.lineWidth=3-t*2;ctx.beginPath();ctx.arc(h.x,h.y,20+t*30,0,Math.PI*2);ctx.stroke();}
        else{ctx.fillStyle=h.type==='ko'?'#ef4444':'#ff8800';ctx.beginPath();ctx.arc(h.x,h.y,(h.type==='ko'?20:15)+t*40,0,Math.PI*2);ctx.fill();}
        ctx.restore();});

      if(g.shockwave){const sw=g.shockwave,t=sw.timer/sw.maxTimer,radius=easeOut(t)*150,alpha=1-t;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*0.5;
        ctx.strokeStyle=sw.color;ctx.lineWidth=4-t*3;ctx.shadowColor=sw.color;ctx.shadowBlur=10*alpha;
        ctx.beginPath();ctx.arc(sw.x,sw.y,radius,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=alpha*0.25;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sw.x,sw.y,radius*0.65,0,Math.PI*2);ctx.stroke();ctx.restore();}

      ctx.restore();

      if(g.flash&&g.flash.timer>0){ctx.save();ctx.globalAlpha=(g.flash.timer/12)*0.3;ctx.fillStyle=g.flash.color;ctx.fillRect(0,0,CW,CH);ctx.restore();}

      ctx.save();ctx.fillStyle='#e2e8f0';ctx.font='bold 16px Jost, sans-serif';ctx.textAlign='center';
      const p1A=ARMOR_SETS.find(a=>a.id===g.p1.config.armor);
      const p2A=ARMOR_SETS.find(a=>a.id===g.p2.config.armor);
      ctx.fillStyle=p1A?.bodyColor||'#22d3ee';ctx.fillText(g.p1.config.name||'Player',200,30);
      ctx.fillStyle=p2A?.bodyColor||'#ef4444';ctx.fillText(g.p2.config.name||'CPU',760,30);
      ctx.font='bold 28px Cinzel, serif';ctx.fillStyle='#f59e0b';ctx.fillText(`${g.p1Score}`,420,35);
      ctx.fillStyle='#64748b';ctx.fillText(':',480,35);ctx.fillStyle='#f59e0b';ctx.fillText(`${g.p2Score}`,540,35);
      for(let i=0;i<MAX_GUARD;i++){ctx.fillStyle=i<g.p1.guardHealth?'#22d3ee':'#1e293b';ctx.fillRect(140+i*22,42,18,6);
        ctx.fillStyle=i<g.p2.guardHealth?'#ef4444':'#1e293b';ctx.fillRect(780-i*22,42,18,6);}

      if(g.phase==='intro'){ctx.globalAlpha=Math.min(1,g.introTimer/30);ctx.font='bold 48px Cinzel, serif';ctx.fillStyle='#22d3ee';ctx.textAlign='center';
        ctx.shadowColor='#22d3ee';ctx.shadowBlur=20;ctx.fillText(g.introTimer>60?'ROUND '+(g.p1Score+g.p2Score+1):'FIGHT!',CW/2,CH/2);ctx.shadowBlur=0;}
      if(g.phase==='ko'){ctx.globalAlpha=Math.min(1,(90-g.koTimer)/20);ctx.font='bold 60px Cinzel, serif';ctx.fillStyle='#ef4444';ctx.textAlign='center';
        ctx.shadowColor='#ef4444';ctx.shadowBlur=25;ctx.fillText('K.O.',CW/2,CH/2-20);ctx.shadowBlur=0;}
      if(g.phase==='end'){ctx.globalAlpha=Math.min(1,(180-g.endTimer)/30);ctx.font='bold 52px Cinzel, serif';ctx.fillStyle='#f59e0b';ctx.textAlign='center';
        ctx.shadowColor='#f59e0b';ctx.shadowBlur=20;const winner=g.p1Score>=g.maxRounds?(g.p1.config.name||'Player'):(g.p2.config.name||'CPU');
        ctx.fillText(`${winner} WINS!`,CW/2,CH/2-30);ctx.shadowBlur=0;
        ctx.font='20px Jost, sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('Press J or ENTER to continue',CW/2,CH/2+20);}

      ctx.font='11px Jost, sans-serif';ctx.fillStyle='#475569';ctx.textAlign='left';ctx.globalAlpha=0.6;
      ctx.fillText(`A/D Move | J Attack (hold = Special) | T Sprites | [ ] Opacity (${Math.round(g.spriteAlpha*100)}%)`,10,CH-8);
      ctx.globalAlpha=1;ctx.restore();

      if(g.phase==='end'&&g.endTimer<=0&&(keys['j']||keys['z']||keys['enter'])){setPhase('menu');keysRef.current={};prevKeysRef.current={};}
    }

    rafId=requestAnimationFrame(gameLoop);
    return()=>{cancelAnimationFrame(rafId);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);};
  },[phase,startNextRound]);

  if(phase==='menu'){
    return (
      <div style={{position:'fixed',inset:0,background:'linear-gradient(135deg,#050a18 0%,#0a1628 50%,#050a18 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Jost, sans-serif',color:'#e2e8f0'}}>
        <button onClick={()=>window.location.href='/'} style={{position:'absolute',top:16,left:16,background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.3)',color:'#22d3ee',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:'Jost, sans-serif',fontSize:14}}>← Back</button>
        <h1 style={{fontFamily:'Cinzel, serif',fontSize:52,color:'#22d3ee',textShadow:'0 0 40px rgba(34,211,238,0.4)',marginBottom:8}}>Grudge Footsies</h1>
        <p style={{color:'#64748b',fontSize:16,marginBottom:12}}>Inspired by FOOTSIES by HiFight</p>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:40,maxWidth:500,textAlign:'center',lineHeight:1.6}}>
          No health bar. One Special hit ends the round. Guard breaks after 3 blocks.
          Hold J to charge a Special. Your avatar is puppeteered by the Footsies skeleton.
        </p>
        <div style={{background:'rgba(10,22,40,0.8)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:12,padding:'24px 32px',marginBottom:32,minWidth:340}}>
          <h3 style={{fontFamily:'Cinzel, serif',color:'#f59e0b',fontSize:18,marginBottom:16}}>Controls</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 24px',fontSize:14}}>
            <div><span style={{color:'#22d3ee'}}>A/D</span> — Move</div>
            <div><span style={{color:'#22d3ee'}}>J</span> — Attack</div>
            <div><span style={{color:'#22d3ee'}}>Hold J</span> — Charge Special</div>
            <div><span style={{color:'#22d3ee'}}>Release J</span> — Special Move</div>
            <div><span style={{color:'#22d3ee'}}>Back</span> — Guard</div>
            <div><span style={{color:'#22d3ee'}}>T</span> — Toggle Sprites</div>
            <div><span style={{color:'#22d3ee'}}>[ ]</span> — Sprite Opacity</div>
          </div>
        </div>
        <button onClick={startGame} style={{background:'linear-gradient(135deg,#06b6d4,#0891b2)',border:'none',color:'#fff',padding:'16px 48px',borderRadius:12,fontSize:22,fontFamily:'Cinzel, serif',cursor:'pointer',boxShadow:'0 0 30px rgba(6,182,212,0.3)',transition:'transform 0.2s'}}
          onMouseEnter={e=>e.target.style.transform='scale(1.05)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>
          Begin Battle
        </button>
        <p style={{color:'#475569',fontSize:12,marginTop:24}}>
          Customize your avatar at <span style={{color:'#22d3ee',cursor:'pointer'}} onClick={()=>window.location.href='/avatar'}>Avatar Designer</span> first!
        </p>
      </div>
    );
  }

  return (
    <div style={{position:'fixed',inset:0,background:'#050a18',overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{display:'block',width:'100%',height:'100%',imageRendering:'pixelated'}} />
    </div>
  );
}
