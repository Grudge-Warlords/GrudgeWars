import { useEffect, useRef, useState, useCallback } from 'react';
import { drawWeapon, getWeaponAttachPoint } from '../data/coreMotionSprites';

const FRAME_DURATION = 120;
const BLEND_FRAMES = 4;

const PROC_COLORS = {
  'dark-knight': { body: '#2d1b4e', accent: '#7c3aed', skin: '#c4a882' },
  'fire-knight': { body: '#7f1d1d', accent: '#f97316', skin: '#c4a882' },
  'evil-wizard-2': { body: '#1e1b4b', accent: '#a855f7', skin: '#d4b896' },
  'necromancer': { body: '#1c1917', accent: '#22d3ee', skin: '#9ca3af' },
  'skeleton': { body: '#d1d5db', accent: '#9ca3af', skin: '#e5e7eb' },
  'skeleton-archer': { body: '#c4b5a0', accent: '#78716c', skin: '#e5e7eb' },
  'armored-skeleton': { body: '#6b7280', accent: '#4b5563', skin: '#e5e7eb' },
  'greatsword-skeleton': { body: '#9ca3af', accent: '#ef4444', skin: '#e5e7eb' },
  'evil-wizard': { body: '#312e81', accent: '#818cf8', skin: '#a78bfa' },
  'werewolf': { body: '#78350f', accent: '#d97706', skin: '#92400e' },
  'slime': { body: '#22c55e', accent: '#86efac', skin: '#16a34a' },
  'werebear': { body: '#713f12', accent: '#a16207', skin: '#854d0e' },
  'wizard': { body: '#1e3a5f', accent: '#60a5fa', skin: '#d4b896' },
  'wind-hashashin': { body: '#064e3b', accent: '#34d399', skin: '#c4a882' },
  'human-ranger': { body: '#365314', accent: '#84cc16', skin: '#c4a882' },
  'fantasy-warrior': { body: '#78350f', accent: '#fbbf24', skin: '#c4a882' },
  'orc': { body: '#14532d', accent: '#f97316', skin: '#166534' },
  'arcane-archer': { body: '#1e1b4b', accent: '#c084fc', skin: '#d4b896' },
  'armored-orc': { body: '#374151', accent: '#6b7280', skin: '#166534' },
  'crystal-mauler': { body: '#0c4a6e', accent: '#38bdf8', skin: '#155e75' },
  'barbarian-mage': { body: '#581c87', accent: '#d946ef', skin: '#c4a882' },
  'boss-demon': { body: '#450a0a', accent: '#dc2626', skin: '#7f1d1d' },
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getColor(folder) {
  if (PROC_COLORS[folder]) return PROC_COLORS[folder];
  const h = hashStr(folder || 'default');
  const hue = h % 360;
  return {
    body: `hsl(${hue}, 50%, 25%)`,
    accent: `hsl(${hue}, 70%, 55%)`,
    skin: `hsl(${(hue + 30) % 360}, 30%, 65%)`,
  };
}

function drawProceduralFrame(ctx, w, h, frame, animType, colors, isBoss) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const scale = isBoss ? 0.9 : 0.7;
  const bodyH = h * 0.35 * scale;
  const headR = h * 0.12 * scale;
  const legH = h * 0.2 * scale;
  const baseY = h * 0.85;

  let bobY = 0;
  let armAngle = 0;
  let lean = 0;
  let legSpread = 0;
  let bodyAlpha = 1;

  if (animType === 'idle') {
    bobY = Math.sin(frame * 0.8) * 2;
  } else if (animType === 'walk') {
    bobY = Math.sin(frame * 1.2) * 3;
    legSpread = Math.sin(frame * 1.2) * 8;
    lean = Math.sin(frame * 1.2) * 0.05;
  } else if (animType === 'attack1' || animType === 'attack2' || animType === 'cast') {
    const t = frame / 6;
    armAngle = t < 0.4 ? -Math.PI * 0.3 * (t / 0.4) : -Math.PI * 0.3 + Math.PI * 0.8 * ((t - 0.4) / 0.6);
    lean = 0.1 * Math.sin(t * Math.PI);
    bobY = -3 * Math.sin(t * Math.PI);
  } else if (animType === 'hurt') {
    lean = -0.15;
    bobY = 4;
    bodyAlpha = frame % 2 === 0 ? 0.6 : 1;
  } else if (animType === 'death') {
    const t = Math.min(frame / 4, 1);
    lean = -0.3 * t;
    bodyAlpha = 1 - t * 0.6;
    bobY = 10 * t;
  }

  ctx.save();
  ctx.globalAlpha = bodyAlpha;
  ctx.translate(cx, baseY + bobY);
  ctx.rotate(lean);

  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.moveTo(-6 * scale - legSpread, 0);
  ctx.lineTo(-4 * scale - legSpread, legH);
  ctx.lineTo(-1 * scale - legSpread, legH);
  ctx.lineTo(0, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6 * scale + legSpread, 0);
  ctx.lineTo(4 * scale + legSpread, legH);
  ctx.lineTo(1 * scale + legSpread, legH);
  ctx.lineTo(0, 2);
  ctx.fill();

  ctx.fillStyle = colors.body;
  const torsoTop = -bodyH;
  ctx.beginPath();
  ctx.moveTo(-10 * scale, 0);
  ctx.lineTo(-12 * scale, torsoTop * 0.3);
  ctx.quadraticCurveTo(-14 * scale, torsoTop * 0.6, -10 * scale, torsoTop);
  ctx.lineTo(10 * scale, torsoTop);
  ctx.quadraticCurveTo(14 * scale, torsoTop * 0.6, 12 * scale, torsoTop * 0.3);
  ctx.lineTo(10 * scale, 0);
  ctx.fill();

  ctx.fillStyle = colors.accent;
  ctx.fillRect(-8 * scale, torsoTop * 0.4, 16 * scale, 3);
  ctx.fillRect(-2, torsoTop, 4, bodyH * 0.5);

  ctx.save();
  ctx.translate(12 * scale, torsoTop * 0.9);
  ctx.rotate(armAngle);
  ctx.fillStyle = colors.body;
  ctx.fillRect(-3, 0, 6, bodyH * 0.7);
  if (animType === 'attack1' || animType === 'attack2') {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-2, bodyH * 0.6, 4, bodyH * 0.4);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(-1, bodyH * 0.95, 2, bodyH * 0.25);
  }
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, bodyH * 0.7, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-12 * scale, torsoTop * 0.9);
  ctx.rotate(-armAngle * 0.3);
  ctx.fillStyle = colors.body;
  ctx.fillRect(-3, 0, 6, bodyH * 0.65);
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, bodyH * 0.65, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const headY = torsoTop - headR;
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(0, headY - headR * 0.5, headR * 1.1, headR * 0.6, 0, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.arc(-headR * 0.3, headY - headR * 0.1, 1.5, 0, Math.PI * 2);
  ctx.arc(headR * 0.3, headY - headR * 0.1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

const proceduralCache = new Map();

function getProceduralSheet(folder, frameW, frameH, frameCount, animType, isBoss) {
  const key = `${folder}_${animType}_${frameW}x${frameH}_${frameCount}`;
  if (proceduralCache.has(key)) return proceduralCache.get(key);

  const offscreen = document.createElement('canvas');
  offscreen.width = frameW * frameCount;
  offscreen.height = frameH;
  const ctx = offscreen.getContext('2d');
  const colors = getColor(folder);

  for (let i = 0; i < frameCount; i++) {
    ctx.save();
    ctx.translate(i * frameW, 0);
    ctx.beginPath();
    ctx.rect(0, 0, frameW, frameH);
    ctx.clip();
    drawProceduralFrame(ctx, frameW, frameH, i, animType, colors, isBoss);
    ctx.restore();
  }

  proceduralCache.set(key, offscreen);
  return offscreen;
}

function ProceduralFallback({ animation = 'idle', flipX, scale = 1, opacity = 1, shake, flash, style = {}, onAnimationEnd, folderHint }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(null);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  const fw = 100;
  const fh = 100;
  const isOneShot = animation === 'attack1' || animation === 'attack2' || animation === 'hurt' || animation === 'death' || animation === 'cast';
  const fc = isOneShot ? 6 : 8;
  const colors = getColor(folderHint || 'default');

  useEffect(() => {
    let cancelled = false;
    frameRef.current = 0;

    const tick = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = opacity;
      if (flipX) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      drawProceduralFrame(ctx, fw, fh, frameRef.current, animation, colors, false);
      ctx.restore();

      frameRef.current++;
      if (isOneShot && frameRef.current >= fc) {
        onEndRef.current?.();
        return;
      }
      frameRef.current = frameRef.current % fc;
      timerRef.current = setTimeout(tick, FRAME_DURATION);
    };
    tick();
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, [animation, flipX, opacity, fc, isOneShot, colors]);

  const displayW = fw * scale;
  const displayH = fh * scale;

  const cssFilter = [
    flash ? 'brightness(3) saturate(0)' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <canvas
      ref={canvasRef}
      width={displayW}
      height={displayH}
      style={{
        width: displayW,
        height: displayH,
        imageRendering: 'pixelated',
        filter: cssFilter,
        animation: shake ? 'spriteShake 0.15s ease 3' : undefined,
        ...style,
      }}
    />
  );
}

const colliderCache = new Map();

export function extractSpriteCollider(img, frameW, frameH, frameIndex = 0, threshold = 20) {
  const key = `${img.src}_${frameIndex}_${frameW}x${frameH}`;
  if (colliderCache.has(key)) return colliderCache.get(key);

  const offscreen = document.createElement('canvas');
  offscreen.width = frameW;
  offscreen.height = frameH;
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(img, frameIndex * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
  const data = ctx.getImageData(0, 0, frameW, frameH).data;

  let minX = frameW, minY = frameH, maxX = 0, maxY = 0;
  const edgePoints = [];

  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const a = data[(y * frameW + x) * 4 + 3];
      if (a > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const isEdge =
          x === 0 || y === 0 || x === frameW - 1 || y === frameH - 1 ||
          data[(y * frameW + (x - 1)) * 4 + 3] <= threshold ||
          data[(y * frameW + (x + 1)) * 4 + 3] <= threshold ||
          data[((y - 1) * frameW + x) * 4 + 3] <= threshold ||
          data[((y + 1) * frameW + x) * 4 + 3] <= threshold;

        if (isEdge) {
          edgePoints.push({ x: x / frameW, y: y / frameH });
        }
      }
    }
  }

  const sampledEdge = [];
  const step = Math.max(1, Math.floor(edgePoints.length / 32));
  for (let i = 0; i < edgePoints.length; i += step) {
    sampledEdge.push(edgePoints[i]);
  }

  const collider = {
    bounds: {
      x: minX / frameW,
      y: minY / frameH,
      width: (maxX - minX) / frameW,
      height: (maxY - minY) / frameH,
    },
    edge: sampledEdge,
    cx: ((minX + maxX) / 2) / frameW,
    cy: ((minY + maxY) / 2) / frameH,
  };

  colliderCache.set(key, collider);
  return collider;
}

export function hitTestCollider(collider, hitX, hitY, spriteX, spriteY, spriteW, spriteH) {
  const localX = (hitX - spriteX) / spriteW;
  const localY = (hitY - spriteY) / spriteH;
  const b = collider.bounds;
  return localX >= b.x && localX <= b.x + b.width && localY >= b.y && localY <= b.y + b.height;
}

export default function SpriteAnimator({
  spriteData,
  animation = 'idle',
  flipX = false,
  scale = 1,
  onAnimationEnd,
  style = {},
  tint,
  shake = false,
  flash = false,
  opacity = 1,
  dropShadow = false,
  onImageLoad,
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(null);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [useProcedural, setUseProcedural] = useState(false);
  const autoFrameCountRef = useRef(null);
  const drawPropsRef = useRef({ flipX, opacity, tint, dropShadow });
  const onAnimationEndRef = useRef(onAnimationEnd);
  const animationRef = useRef(animation);
  const prevImgRef = useRef(null);
  const blendCounterRef = useRef(0);

  drawPropsRef.current = { flipX, opacity, tint, dropShadow };
  onAnimationEndRef.current = onAnimationEnd;
  animationRef.current = animation;

  const anim = spriteData?.[animation] || spriteData?.idle;
  const configuredFrameCount = anim?.frames || 1;
  const frameW = spriteData?.frameWidth || 100;
  const frameH = spriteData?.frameHeight || 100;
  const isOneShot = animation === 'attack1' || animation === 'attack2' || animation === 'attack3' || animation === 'hurt' || animation === 'death' || animation === 'cast';

  const getFrameCount = useCallback(() => {
    if (useProcedural) return configuredFrameCount;
    if (autoFrameCountRef.current !== null) return autoFrameCountRef.current;
    return configuredFrameCount;
  }, [configuredFrameCount, useProcedural]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { flipX: fx, opacity: op, tint: t, dropShadow: ds } = drawPropsRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = op;

    if (ds) {
      ctx.save();
      const shadowY = canvas.height * 0.88;
      const shadowW = canvas.width * 0.6;
      const shadowH = canvas.height * 0.08;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, shadowY, 0,
        canvas.width / 2, shadowY, shadowW / 2
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.45)');
      gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, shadowY, shadowW / 2, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (fx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    const spriteFilter = spriteData?.filter || '';
    if (spriteFilter && typeof ctx.filter !== 'undefined') {
      ctx.filter = spriteFilter;
    }

    const blendT = blendCounterRef.current > 0 ? blendCounterRef.current / BLEND_FRAMES : 0;
    if (blendT > 0 && prevImgRef.current) {
      const savedAlpha = ctx.globalAlpha;
      ctx.globalAlpha = op * blendT * 0.6;
      const prevImg = prevImgRef.current;
      ctx.drawImage(prevImg.img, prevImg.sx, 0, frameW, frameH, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = op * (1 - blendT * 0.3);
    }

    if (useProcedural) {
      const folder = spriteData?.folder || 'default';
      const isBoss = frameW > 150 || frameH > 150;
      const sheet = getProceduralSheet(folder, frameW, frameH, configuredFrameCount, animationRef.current, isBoss);
      const sx = frameRef.current * frameW;
      ctx.drawImage(sheet, sx, 0, frameW, frameH, 0, 0, canvas.width, canvas.height);
    } else {
      const img = imgRef.current;
      if (!img) { ctx.restore(); return; }
      const sx = frameRef.current * frameW;
      ctx.drawImage(img, sx, 0, frameW, frameH, 0, 0, canvas.width, canvas.height);
    }

    if (spriteFilter) {
      ctx.filter = 'none';
    }

    if (t) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = t;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    if (spriteData?.isCoreMotion && spriteData?.weapon) {
      const scaleX = canvas.width / frameW;
      const scaleY = canvas.height / frameH;
      const attach = getWeaponAttachPoint(animationRef.current, frameRef.current, frameW, frameH);
      ctx.save();
      if (fx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.globalAlpha = op;
      drawWeapon(ctx, spriteData.weapon, attach.x * scaleX, attach.y * scaleY, attach.angle, scaleX);
      ctx.restore();
    }
  }, [loaded, useProcedural, frameW, frameH, configuredFrameCount, spriteData?.folder, spriteData?.isCoreMotion, spriteData?.weapon]);

  useEffect(() => {
    if (!anim?.src) {
      setUseProcedural(true);
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setUseProcedural(false);
      if (frameW > 0) {
        const maxFrames = Math.floor(img.naturalWidth / frameW);
        if (maxFrames > 0 && maxFrames !== configuredFrameCount) {
          autoFrameCountRef.current = Math.min(configuredFrameCount, maxFrames);
        } else {
          autoFrameCountRef.current = null;
        }
      }
      onImageLoad?.(img);
      setLoaded(true);
    };
    img.onerror = () => {
      setUseProcedural(true);
      setLoaded(true);
    };
    img.src = anim.src;
    return () => { img.onload = null; img.onerror = null; };
  }, [anim?.src, frameW, configuredFrameCount]);

  useEffect(() => {
    if (!loaded) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (imgRef.current) {
      prevImgRef.current = {
        img: imgRef.current,
        sx: frameRef.current * frameW,
      };
      blendCounterRef.current = BLEND_FRAMES;
    }

    frameRef.current = 0;
    if (!useProcedural) {
      autoFrameCountRef.current = null;
      const img = imgRef.current;
      if (img && frameW > 0) {
        const maxFrames = Math.floor(img.naturalWidth / frameW);
        if (maxFrames > 0 && maxFrames < configuredFrameCount) {
          autoFrameCountRef.current = maxFrames;
        }
      }
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (blendCounterRef.current > 0) blendCounterRef.current--;
      if (blendCounterRef.current <= 0) prevImgRef.current = null;
      draw();
      frameRef.current++;

      const fc = getFrameCount();
      if (isOneShot && frameRef.current >= fc) {
        onAnimationEndRef.current?.();
        return;
      }

      frameRef.current = frameRef.current % fc;
      timerRef.current = setTimeout(tick, FRAME_DURATION);
    };

    tick();
    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loaded, useProcedural, animation, configuredFrameCount, draw, isOneShot, getFrameCount, frameW]);

  useEffect(() => {
    if (loaded) draw();
  }, [flipX, opacity, tint, dropShadow, loaded, draw]);

  const displayW = frameW * scale;
  const displayH = frameH * scale;

  if (!spriteData || !anim) {
    return (
      <ProceduralFallback
        animation={animation}
        flipX={flipX}
        scale={scale}
        opacity={opacity}
        shake={shake}
        flash={flash}
        style={style}
        onAnimationEnd={onAnimationEnd}
        folderHint={spriteData?.folder}
      />
    );
  }

  const cssFilter = [
    flash ? 'brightness(3) saturate(0)' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <canvas
      ref={canvasRef}
      width={displayW}
      height={displayH}
      style={{
        width: displayW,
        height: displayH,
        imageRendering: 'pixelated',
        filter: cssFilter,
        animation: shake ? 'spriteShake 0.15s ease 3' : undefined,
        ...style,
      }}
    />
  );
}
