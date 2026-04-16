import React, { useState, useEffect, useRef } from 'react';

const SHIELD_DROID = {
  frameWidth: 90,
  frameHeight: 31,
  pulse: { src: '/sprites/shield_droid/shield_pulse.png', frames: 6 },
  finished: { src: '/sprites/shield_droid/shield_finished.png', frames: 4 },
};

export default function ShieldBlockerSprite({ active, size = 60, onBreakComplete }) {
  const [frame, setFrame] = useState(0);
  const [breaking, setBreaking] = useState(false);
  const [particles, setParticles] = useState([]);
  const [done, setDone] = useState(!active);
  const intervalRef = useRef(null);
  const breakTimeoutRef = useRef(null);
  const prevActive = useRef(active);

  const anim = breaking ? SHIELD_DROID.finished : SHIELD_DROID.pulse;
  const totalFrames = anim.frames;

  useEffect(() => {
    if (prevActive.current && !active) {
      setBreaking(true);
      setFrame(0);

      const burstParticles = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
        burstParticles.push({
          id: i,
          x: 0, y: 0,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          size: 3 + Math.random() * 4,
          opacity: 1,
          color: ['#38bdf8', '#06b6d4', '#a855f7', '#22d3ee'][i % 4],
        });
      }
      setParticles(burstParticles);
    }
    if (!prevActive.current && active) {
      setDone(false);
      setBreaking(false);
      setFrame(0);
    }
    prevActive.current = active;
  }, [active]);

  useEffect(() => {
    if (done) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFrame(f => {
        const next = f + 1;
        if (breaking && next >= totalFrames) {
          clearInterval(intervalRef.current);
          breakTimeoutRef.current = setTimeout(() => {
            setDone(true);
            onBreakComplete?.();
          }, 400);
          return totalFrames - 1;
        }
        return next % totalFrames;
      });
    }, breaking ? 120 : 180);
    return () => clearInterval(intervalRef.current);
  }, [breaking, totalFrames, done]);

  useEffect(() => {
    if (particles.length === 0) return;
    const id = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          opacity: p.opacity - 0.03,
          size: p.size * 0.97,
        })).filter(p => p.opacity > 0);
        if (next.length === 0) clearInterval(id);
        return next;
      });
    }, 30);
    return () => clearInterval(id);
  }, [particles.length > 0]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(breakTimeoutRef.current);
    };
  }, []);

  if (done && particles.length === 0) return null;

  const scale = size / SHIELD_DROID.frameWidth;
  const displayW = SHIELD_DROID.frameWidth * scale;
  const displayH = SHIELD_DROID.frameHeight * scale;

  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: displayW, height: displayH,
      pointerEvents: 'none',
      zIndex: 30,
    }}>
      {!done && (
        <div style={{
          width: displayW,
          height: displayH,
          backgroundImage: `url(${anim.src})`,
          backgroundSize: `${totalFrames * displayW}px ${displayH}px`,
          backgroundPosition: `-${frame * displayW}px 0`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: breaking ? 'brightness(1.5) saturate(0.5)' : 'drop-shadow(0 0 4px rgba(56,189,248,0.6))',
          opacity: breaking ? (1 - frame / totalFrames * 0.5) : 1,
          transition: breaking ? 'opacity 0.2s' : 'none',
        }} />
      )}

      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: displayW / 2 + p.x,
          top: displayH / 2 + p.y,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.size}px ${p.color}`,
          opacity: p.opacity,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
        }} />
      ))}
    </div>
  );
}
