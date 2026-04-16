import React, { useEffect, useRef, useState, useCallback } from 'react';

const SHOWCASE_SPRITES = {
  fantasy: [
    { name: 'Shadow Knight', folder: 'dark-knight', frameW: 128, frameH: 96, idle: { file: 'idle.png', frames: 4 }, attack: { file: 'attack1.png', frames: 8 }, scale: 2.2, color: '#a855f7' },
    { name: 'Fire Knight', folder: 'fire-knight', frameW: 288, frameH: 128, idle: { file: 'idle.png', frames: 8 }, attack: { file: 'attack1.png', frames: 11 }, scale: 1.4, color: '#ef4444' },
    { name: 'Evil Wizard', folder: 'evil-wizard', frameW: 150, frameH: 150, idle: { file: 'idle.png', frames: 8 }, attack: { file: 'attack2.png', frames: 8 }, scale: 1.5, color: '#3b82f6' },
    { name: 'Necromancer', folder: 'necromancer', frameW: 160, frameH: 128, idle: { file: 'idle.png', frames: 8 }, attack: { file: 'attack2.png', frames: 13 }, scale: 1.6, color: '#22c55e' },
  ],
  scifi: [
    { name: 'Mecha Scout', folder: 'mecha-scout', frameW: 96, frameH: 96, idle: { file: 'Idle.png', frames: 4 }, attack: { file: 'Attack.png', frames: 6 }, scale: 2.2, color: '#06b6d4' },
    { name: 'Mecha Assault', folder: 'mecha-assault', frameW: 96, frameH: 96, idle: { file: 'Idle.png', frames: 4 }, attack: { file: 'Attack.png', frames: 6 }, scale: 2.2, color: '#f59e0b' },
    { name: 'Crystal Mauler', folder: 'crystal-mauler', frameW: 288, frameH: 128, idle: { file: 'idle.png', frames: 8 }, attack: { file: 'attack1.png', frames: 7 }, scale: 1.0, color: '#ec4899' },
    { name: 'Arcane Archer', folder: 'arcane-archer', frameW: 64, frameH: 64, idle: { file: 'idle.png', frames: 8 }, attack: { file: 'attack1.png', frames: 8 }, scale: 3.2, color: '#22d3ee' },
  ],
};

const VFX_PARTICLES = [
  { type: 'slash', color: '#fbbf24', size: 40, duration: 300 },
  { type: 'spark', color: '#ef4444', size: 24, duration: 200 },
  { type: 'magic', color: '#a855f7', size: 32, duration: 400 },
  { type: 'impact', color: '#22d3ee', size: 28, duration: 250 },
];

function AnimatedSprite({ sprite, index, panelWidth }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const phaseRef = useRef('idle');
  const timerRef = useRef(null);
  const vfxTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const imgCacheRef = useRef({});
  const autoFramesRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const [vfx, setVfx] = useState(null);
  const attackCooldownRef = useRef(0);
  const canvasSizedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const toLoad = [
      { key: 'idle', src: `/sprites/${sprite.folder}/${sprite.idle.file}`, configFrames: sprite.idle.frames },
      { key: 'attack', src: `/sprites/${sprite.folder}/${sprite.attack.file}`, configFrames: sprite.attack.frames },
    ];
    let loadedCount = 0;
    toLoad.forEach(({ key, src, configFrames }) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgCacheRef.current[key] = img;
        const maxFrames = Math.floor(img.naturalWidth / sprite.frameW);
        autoFramesRef.current[key] = maxFrames > 0 ? Math.min(configFrames, maxFrames) : configFrames;
        loadedCount++;
        if (loadedCount === toLoad.length && alive) setLoaded(true);
      };
      img.src = src;
    });
    return () => { alive = false; };
  }, [sprite]);

  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawW = sprite.frameW * sprite.scale;
    const drawH = sprite.frameH * sprite.scale;
    if (!canvasSizedRef.current) {
      canvas.width = drawW;
      canvas.height = drawH;
      canvasSizedRef.current = true;
    }

    const staggerDelay = index * 1200 + Math.random() * 800;
    const attackInterval = 3000 + index * 700;

    const tick = () => {
      if (!mountedRef.current) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const phase = phaseRef.current;
      const animData = phase === 'attack' ? sprite.attack : sprite.idle;
      const img = imgCacheRef.current[phase] || imgCacheRef.current['idle'];
      if (!img) { timerRef.current = setTimeout(tick, 100); return; }

      const phaseKey = phase === 'attack' ? 'attack' : 'idle';
      const frameCount = autoFramesRef.current[phaseKey] || animData.frames;
      const fw = sprite.frameW;
      const fh = sprite.frameH;

      ctx.clearRect(0, 0, drawW, drawH);
      ctx.imageSmoothingEnabled = false;

      const sx = frameRef.current * fw;
      ctx.drawImage(img, sx, 0, fw, fh, 0, 0, drawW, drawH);

      frameRef.current++;

      if (frameRef.current >= frameCount) {
        frameRef.current = 0;
        if (phase === 'attack') {
          phaseRef.current = 'idle';
          if (mountedRef.current) setVfx(null);
        }
      }

      if (phase === 'attack' && frameRef.current === Math.floor(frameCount * 0.4)) {
        const vfxType = VFX_PARTICLES[index % VFX_PARTICLES.length];
        if (mountedRef.current) setVfx({ ...vfxType, id: Date.now() });
        if (vfxTimerRef.current) clearTimeout(vfxTimerRef.current);
        vfxTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setVfx(null);
        }, vfxType.duration);
      }

      attackCooldownRef.current--;
      if (attackCooldownRef.current <= 0 && phase === 'idle') {
        phaseRef.current = 'attack';
        frameRef.current = 0;
        attackCooldownRef.current = Math.floor(attackInterval / 80);
      }

      timerRef.current = setTimeout(tick, 80);
    };

    const startTimer = setTimeout(() => tick(), staggerDelay);
    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (vfxTimerRef.current) clearTimeout(vfxTimerRef.current);
    };
  }, [loaded, sprite, index]);

  const drawW = sprite.frameW * sprite.scale;
  const drawH = sprite.frameH * sprite.scale;

  return (
    <div style={{
      position: 'absolute',
      left: `${(index / 4) * 100 + 12.5}%`,
      bottom: '20px',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={drawW}
          height={drawH}
          style={{
            width: drawW, height: drawH,
            imageRendering: 'pixelated',
            filter: `drop-shadow(0 0 12px ${sprite.color}60)`,
          }}
        />
        {vfx && (
          <div style={{
            position: 'absolute',
            top: '20%', right: '-10px',
            width: vfx.size, height: vfx.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${vfx.color}cc, ${vfx.color}00)`,
            animation: 'vfxBurst 0.3s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}
        {vfx && vfx.type === 'slash' && (
          <div style={{
            position: 'absolute',
            top: '30%', right: '-20px',
            width: '50px', height: '3px',
            background: `linear-gradient(90deg, transparent, ${vfx.color}, transparent)`,
            transform: 'rotate(-25deg)',
            animation: 'slashSwipe 0.25s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}
      </div>
      <div style={{
        marginTop: '8px',
        fontSize: '10px', fontWeight: 700,
        color: sprite.color,
        textShadow: `0 0 8px ${sprite.color}40`,
        letterSpacing: '1px', textTransform: 'uppercase',
        fontFamily: "'Cinzel', serif",
      }}>{sprite.name}</div>
    </div>
  );
}

function BattleScene({ title, subtitle, sprites, accentColor, bgGradient }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [particleSeeds] = useState(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      speed: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.4,
    }))
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{
      borderRadius: '16px', overflow: 'hidden',
      border: `1px solid ${accentColor}25`,
      position: 'relative',
      height: '320px',
      background: bgGradient,
    }}>
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {particleSeeds.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: accentColor,
            opacity: p.opacity,
            animation: `floatParticle ${3 + p.speed}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${accentColor}40, ${accentColor}60, ${accentColor}40, transparent)`,
      }} />

      <div style={{
        position: 'absolute', bottom: '50px', left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent 5%, ${accentColor}15 20%, ${accentColor}20 50%, ${accentColor}15 80%, transparent 95%)`,
      }} />

      {sprites.map((sprite, i) => (
        <AnimatedSprite key={sprite.folder} sprite={sprite} index={i} panelWidth={width} />
      ))}

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,10,15,0.4) 0%, transparent 20%, transparent 70%, rgba(10,10,15,0.6) 100%)',
        pointerEvents: 'none', borderRadius: '16px',
      }} />

      <div style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 2 }}>
        <div style={{
          fontSize: '9px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: accentColor, marginBottom: '4px',
        }}>{subtitle}</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '18px',
          color: '#f1f5f9',
          textShadow: '0 2px 16px rgba(0,0,0,0.8)',
        }}>{title}</div>
      </div>

      <div style={{
        position: 'absolute', top: '16px', right: '20px', zIndex: 2,
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '9px', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '1px',
        }}>Live Sprites</span>
      </div>
    </div>
  );
}

export default function SpriteShowcase({ sectionInView = true }) {
  return (
    <div style={{
      marginTop: '48px',
      transform: sectionInView ? 'translateY(0)' : 'translateY(40px)',
      opacity: sectionInView ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s',
    }}>
      <style>{`
        @keyframes vfxBurst {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes slashSwipe {
          0% { transform: rotate(-25deg) scaleX(0); opacity: 1; }
          50% { transform: rotate(-25deg) scaleX(1.2); opacity: 1; }
          100% { transform: rotate(-25deg) scaleX(0.8); opacity: 0; }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-20px) scale(0.5); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          fontSize: '10px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '3px',
          color: '#fbbf24',
        }}>Live Animation Preview</div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '24px',
          color: '#f1f5f9', marginTop: '6px',
        }}>Sprites In Action</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        <BattleScene
          title="Shadow Knights"
          subtitle="Fantasy Combat"
          sprites={SHOWCASE_SPRITES.fantasy}
          accentColor="#a855f7"
          bgGradient="linear-gradient(135deg, #0a0515 0%, #1a0a2e 30%, #0d1117 60%, #150a20 100%)"
        />
        <BattleScene
          title="Starbound Corsairs"
          subtitle="Sci-Fi Warfare"
          sprites={SHOWCASE_SPRITES.scifi}
          accentColor="#06b6d4"
          bgGradient="linear-gradient(135deg, #050a18 0%, #0a1628 30%, #0d1117 60%, #081420 100%)"
        />
      </div>
    </div>
  );
}
