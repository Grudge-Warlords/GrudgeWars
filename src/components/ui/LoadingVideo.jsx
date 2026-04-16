import React, { useRef, useEffect, useCallback } from 'react';

const ZOOM_REGIONS = [
  { x: 0.03, y: 0.03, w: 0.22, h: 0.28 },
  { x: 0.27, y: 0.03, w: 0.22, h: 0.28 },
  { x: 0.52, y: 0.03, w: 0.22, h: 0.28 },
  { x: 0.76, y: 0.03, w: 0.22, h: 0.28 },
  { x: 0.03, y: 0.35, w: 0.22, h: 0.28 },
  { x: 0.27, y: 0.35, w: 0.22, h: 0.28 },
  { x: 0.52, y: 0.35, w: 0.22, h: 0.28 },
  { x: 0.76, y: 0.35, w: 0.22, h: 0.28 },
  { x: 0.03, y: 0.68, w: 0.22, h: 0.28 },
  { x: 0.27, y: 0.68, w: 0.22, h: 0.28 },
  { x: 0.52, y: 0.68, w: 0.22, h: 0.28 },
  { x: 0.76, y: 0.68, w: 0.22, h: 0.28 },
];

export default function LoadingVideo({ active = true, message = 'Loading...' }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const shuffledRef = useRef([]);

  const shuffle = useCallback(() => {
    const arr = [...ZOOM_REGIONS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffledRef.current = arr;
  }, []);

  useEffect(() => {
    if (!active) return;
    shuffle();
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.random() * (video.duration || 5);
      video.play().catch(() => {});
    }

    const ZOOM_DURATION = 1200;
    const HOLD_DURATION = 800;
    const UNZOOM_DURATION = 800;
    const OVERVIEW_DURATION = 600;
    const CYCLE = ZOOM_DURATION + HOLD_DURATION + UNZOOM_DURATION + OVERVIEW_DURATION;

    let startTime = performance.now();
    let regionIdx = Math.floor(Math.random() * ZOOM_REGIONS.length);

    const animate = (now) => {
      const elapsed = (now - startTime) % CYCLE;
      const region = shuffledRef.current[regionIdx % shuffledRef.current.length];
      const cx = (region.x + region.w / 2) * 100;
      const cy = (region.y + region.h / 2) * 100;
      const maxScale = 1 / Math.min(region.w, region.h);
      const targetScale = Math.min(maxScale, 3.5);

      let scale, origin;
      if (elapsed < ZOOM_DURATION) {
        const p = elapsed / ZOOM_DURATION;
        const ease = 1 - Math.pow(1 - p, 3);
        scale = 1 + (targetScale - 1) * ease;
        origin = `${cx}% ${cy}%`;
      } else if (elapsed < ZOOM_DURATION + HOLD_DURATION) {
        scale = targetScale;
        origin = `${cx}% ${cy}%`;
      } else if (elapsed < ZOOM_DURATION + HOLD_DURATION + UNZOOM_DURATION) {
        const p = (elapsed - ZOOM_DURATION - HOLD_DURATION) / UNZOOM_DURATION;
        const ease = p * p * p;
        scale = targetScale - (targetScale - 1) * ease;
        origin = `${cx}% ${cy}%`;
      } else {
        scale = 1;
        origin = '50% 50%';
        if (elapsed >= CYCLE - 20) {
          regionIdx = (regionIdx + 1) % shuffledRef.current.length;
          if (regionIdx === 0) shuffle();
          startTime = now;
        }
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        containerRef.current.style.transformOrigin = origin;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, shuffle]);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050a18',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        overflow: 'hidden',
      }}>
        <div ref={containerRef} style={{
          width: '100%', height: '100%',
          transition: 'none',
          willChange: 'transform',
        }}>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7) saturate(1.3)',
            }}
          >
            <source src="/videos/hero_scroll.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,10,24,0.85) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,10,24,0.6) 0%, transparent 20%, transparent 80%, rgba(5,10,24,0.8) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center', padding: '40px',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(28px, 5vw, 48px)',
          color: '#fbbf24',
          textShadow: '0 0 40px rgba(251,191,36,0.4), 0 4px 20px rgba(0,0,0,0.8)',
          marginBottom: '16px',
          animation: 'glow 3s ease-in-out infinite',
        }}>
          Grudge Studios
        </div>
        <div style={{
          fontSize: '14px', color: '#94a3b8',
          letterSpacing: '3px', textTransform: 'uppercase',
          marginBottom: '32px',
        }}>
          {message}
        </div>
        <div style={{
          width: '200px', height: '3px',
          background: 'rgba(251,191,36,0.15)',
          borderRadius: '2px', margin: '0 auto',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: '2px',
            animation: 'loadingBar 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
      `}</style>
    </div>
  );
}
