import React, { useRef, useEffect, useState, useCallback } from 'react';
import { npcSpriteMap } from '../data/spriteMap';

function lerp(a, b, t) { return a + (b - a) * t; }
function rand(min, max) { return Math.random() * (max - min) + min; }

function pickTarget(homeX, homeY, rangeX, rangeY) {
  return {
    x: homeX + rand(-rangeX, rangeX),
    y: homeY + rand(-rangeY, rangeY),
  };
}

export default function NpcSprite({ npcId, scale = 3, flip: initialFlip = false, name, wanderRange = 26, wanderRangeY = 14, onPositionUpdate }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const offsetX = useRef(0);
  const offsetY = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const speed = useRef(rand(0.24, 0.56));
  const currentFlip = useRef(initialFlip);
  const [flipState, setFlipState] = useState(initialFlip);
  const phase = useRef('idle');
  const phaseTimer = useRef(rand(500, 2000));
  const tailWag = useRef(0);
  const dartCooldown = useRef(0);
  const animRef = useRef(null);
  const lastTime = useRef(0);
  const lastPosUpdate = useRef(0);

  const npcData = npcSpriteMap[npcId];
  if (!npcData) return null;

  const { src, frameWidth, frameHeight, frames } = npcData;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;
  const isStatic = frames <= 1;

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
  }, [src]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let frameInterval = 0;
    const frameDuration = 1000 / 6;

    const draw = (dt) => {
      frameInterval += dt;
      if (frameInterval >= frameDuration) {
        frameInterval -= frameDuration;
        frameRef.current = (frameRef.current + 1) % Math.max(frames, 1);
      }
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.save();
      if (currentFlip.current) {
        ctx.translate(displayWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        imgRef.current,
        frameRef.current * frameWidth, 0,
        frameWidth, frameHeight,
        0, 0,
        displayWidth, displayHeight
      );
      ctx.restore();
    };

    const tick = (timestamp) => {
      if (!lastTime.current) lastTime.current = timestamp;
      const dt = Math.min(timestamp - lastTime.current, 100);
      lastTime.current = timestamp;

      phaseTimer.current -= dt;
      dartCooldown.current -= dt;

      if (phaseTimer.current <= 0) {
        const r = Math.random();
        if (phase.current === 'idle') {
          if (r < 0.6) {
            phase.current = 'swim';
            const t = pickTarget(0, 0, wanderRange, wanderRangeY);
            targetX.current = t.x;
            targetY.current = t.y;
            speed.current = rand(0.32, 0.64);
            phaseTimer.current = rand(2400, 6000);
          } else if (r < 0.85) {
            phase.current = 'drift';
            targetX.current = offsetX.current + rand(-3, 3);
            targetY.current = offsetY.current + rand(-2, 2);
            speed.current = rand(0.064, 0.16);
            phaseTimer.current = rand(1800, 4200);
          } else {
            phase.current = 'dart';
            const t = pickTarget(0, 0, wanderRange * 0.7, wanderRangeY * 0.7);
            targetX.current = t.x;
            targetY.current = t.y;
            speed.current = rand(1.6, 3.2);
            phaseTimer.current = rand(360, 840);
            dartCooldown.current = 8000;
          }
        } else {
          phase.current = 'idle';
          phaseTimer.current = rand(800, 3000);
        }
      }

      if (phase.current === 'dart' && dartCooldown.current > 7500) {
        speed.current *= 0.98;
      }

      const sec = dt / 1000;
      if (phase.current !== 'idle') {
        const dx = targetX.current - offsetX.current;
        const dy = targetY.current - offsetY.current;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.3) {
          const moveSpeed = speed.current * 30 * sec;
          const step = Math.min(moveSpeed, dist);
          offsetX.current += (dx / dist) * step;
          offsetY.current += (dy / dist) * step;

          if (Math.abs(dx) > 0.5) {
            const newFlip = dx < 0;
            if (newFlip !== currentFlip.current) {
              currentFlip.current = newFlip;
              setFlipState(newFlip);
            }
          }
        } else if (phase.current === 'swim' || phase.current === 'dart') {
          phase.current = 'idle';
          phaseTimer.current = rand(800, 2500);
        }
      }

      tailWag.current += dt * 0.004;
      const wobbleX = Math.sin(tailWag.current * 1.3) * (phase.current === 'dart' ? 0.3 : 0.8);
      const wobbleY = Math.cos(tailWag.current * 0.9) * 1.2;

      const finalX = offsetX.current + wobbleX;
      const finalY = offsetY.current + wobbleY;

      if (canvasRef.current) {
        const el = canvasRef.current.parentElement;
        if (el) {
          el.style.transform = `translate(calc(-50% + ${finalX.toFixed(1)}px), calc(-50% + ${finalY.toFixed(1)}px))`;
          const tiltDeg = phase.current === 'dart'
            ? ((targetX.current - offsetX.current) > 0 ? -4 : 4)
            : Math.sin(tailWag.current * 1.1) * 3;
          el.style.rotate = `${tiltDeg.toFixed(1)}deg`;
          if (onPositionUpdate && timestamp - lastPosUpdate.current > 200) {
            lastPosUpdate.current = timestamp;
            const rect = el.getBoundingClientRect();
            onPositionUpdate({ x: rect.left + rect.width / 2, y: rect.top });
          }
        }
      }

      draw(dt);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [loaded, displayWidth, displayHeight, frames, frameWidth, frameHeight, isStatic, wanderRange, wanderRangeY]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      willChange: 'transform',
      transition: 'none',
    }}>
      <canvas
        ref={canvasRef}
        width={displayWidth}
        height={displayHeight}
        style={{ width: displayWidth, height: displayHeight, imageRendering: 'pixelated' }}
      />
      {name && (
        <div style={{
          color: '#e2e8f0', fontSize: '0.4rem', fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', marginTop: -2,
        }}>{name}</div>
      )}
    </div>
  );
}
