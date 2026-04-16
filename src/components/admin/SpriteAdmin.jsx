import { useState, useEffect, useRef, useCallback } from 'react';

const CATEGORIES = {
  fighters: { label: 'Fighter Sheets', color: '#ef4444' },
  legacy: { label: 'Legacy FX', color: '#f59e0b' },
  explosions: { label: 'Explosions', color: '#f97316' },
  impacts: { label: 'Impacts', color: '#3b82f6' },
  lightning: { label: 'Lightning', color: '#a855f7' },
  blood: { label: 'Blood Splashes', color: '#dc2626' },
  splatters: { label: 'Splatters', color: '#be123c' },
  spells: { label: 'Fantasy Spells', color: '#10b981' },
  magic: { label: 'Magic Bursts', color: '#8b5cf6' },
  scifi: { label: 'Sci-Fi', color: '#06b6d4' },
  smoke: { label: 'Smoke', color: '#6b7280' },
  symbols: { label: 'Symbols', color: '#eab308' },
};

function AnimatedSprite({ sprite, scale = 2 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = sprite.path;
    imgRef.current = img;
    let cancelled = false;

    let frame = 0;
    let lastTime = 0;
    const speed = sprite.frames > 12 ? 60 : 100;

    const animate = (t) => {
      if (cancelled) return;
      if (t - lastTime > speed) {
        frame = (frame + 1) % sprite.frames;
        lastTime = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(
            img,
            frame * sprite.fw, 0, sprite.fw, sprite.fh,
            0, 0, canvas.width, canvas.height
          );
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    img.onload = () => {
      if (!cancelled) rafRef.current = requestAnimationFrame(animate);
    };

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sprite]);

  return (
    <canvas
      ref={canvasRef}
      width={sprite.fw * scale}
      height={sprite.fh * scale}
      style={{ imageRendering: 'pixelated', background: '#0a0a0a', borderRadius: 4 }}
    />
  );
}

function FighterPreview({ sprite }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = sprite.path;

    const offsets = [0, 6, 12, 18];
    const rowOffsets = [0, 12];
    let frame = 0;
    let lastTime = 0;
    const fw = 64, fh = 64;

    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      canvas.width = 4 * fw * 2;
      canvas.height = 2 * fh * 2;

      const animate = (t) => {
        if (cancelled) return;
        if (t - lastTime > 150) {
          frame = (frame + 1) % 6;
          lastTime = t;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;

          for (let ry = 0; ry < 2; ry++) {
            for (let cx = 0; cx < 4; cx++) {
              const sx = (frame + offsets[cx]) * fw;
              const sy = (0 + rowOffsets[ry]) * fh;
              ctx.drawImage(img, sx, sy, fw, fh, cx * fw * 2, ry * fh * 2, fw * 2, fh * 2);
            }
          }
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sprite]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={256}
      style={{ imageRendering: 'pixelated', background: '#0a0a0a', borderRadius: 6 }}
    />
  );
}

function SpriteSheetView({ sprite }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>Full Sheet ({sprite.w}x{sprite.h})</span>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} style={btnStyle}>-</button>
        <span style={{ color: '#e2e8f0', fontSize: 12 }}>{zoom}x</span>
        <button onClick={() => setZoom(z => Math.min(4, z + 0.5))} style={btnStyle}>+</button>
      </div>
      <div style={{ overflow: 'auto', maxWidth: '100%', maxHeight: 300, border: '1px solid #1e293b', borderRadius: 4 }}>
        <img
          src={sprite.path}
          alt={sprite.name}
          style={{ imageRendering: 'pixelated', width: sprite.w * zoom, height: sprite.h * zoom }}
        />
      </div>
    </div>
  );
}

const btnStyle = {
  background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12,
};

export default function SpriteAdmin() {
  const [manifest, setManifest] = useState(null);
  const [activeCategory, setActiveCategory] = useState('fighters');
  const [expandedSprite, setExpandedSprite] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/sprites/grudge-box/fx/manifest.json')
      .then(r => r.json())
      .then(setManifest)
      .catch(err => console.error('Failed to load manifest:', err));
  }, []);

  if (!manifest) {
    return (
      <div style={{ background: '#050a18', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontFamily: 'Jost, sans-serif' }}>Loading sprite manifest...</div>
      </div>
    );
  }

  const categories = Object.keys(manifest).filter(k => manifest[k].length > 0);
  const sprites = manifest[activeCategory] || [];
  const filtered = search
    ? sprites.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : sprites;

  const totalSprites = Object.values(manifest).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ background: '#050a18', minHeight: '100vh', fontFamily: 'Jost, sans-serif', color: '#e2e8f0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', color: '#fbbf24', margin: 0, fontSize: 28 }}>
            GKO SPRITE ADMIN
          </h1>
          <span style={{ color: '#64748b', fontSize: 13 }}>{totalSprites} sprites across {categories.length} categories</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {categories.map(cat => {
            const info = CATEGORIES[cat] || { label: cat, color: '#64748b' };
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setExpandedSprite(null); }}
                style={{
                  background: isActive ? info.color + '33' : '#0f172a',
                  color: isActive ? info.color : '#94a3b8',
                  border: `1px solid ${isActive ? info.color : '#1e293b'}`,
                  borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: isActive ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {info.label} ({manifest[cat].length})
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Search sprites..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '8px 14px',
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6,
            color: '#e2e8f0', fontFamily: 'Jost, sans-serif', fontSize: 14,
            marginBottom: 20, outline: 'none',
          }}
        />

        {activeCategory === 'fighters' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filtered.map(sprite => (
              <div key={sprite.file} style={{
                background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ color: '#fbbf24', fontFamily: 'Cinzel, serif', fontSize: 16 }}>{sprite.name}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{sprite.w}x{sprite.h} | 8 fighters | 12 anim rows each</span>
                </div>
                <FighterPreview sprite={sprite} />
                <SpriteSheetView sprite={sprite} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map(sprite => {
              const isExpanded = expandedSprite === sprite.file;
              const catInfo = CATEGORIES[activeCategory] || { color: '#64748b' };
              return (
                <div
                  key={sprite.file}
                  onClick={() => setExpandedSprite(isExpanded ? null : sprite.file)}
                  style={{
                    background: '#0f172a', border: `1px solid ${isExpanded ? catInfo.color : '#1e293b'}`,
                    borderRadius: 8, padding: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: catInfo.color, fontSize: 13, fontWeight: 600 }}>
                      {sprite.name.length > 28 ? sprite.name.slice(0, 28) + '...' : sprite.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
                    <AnimatedSprite sprite={sprite} scale={activeCategory === 'blood' ? 1 : 2} />
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>
                    {sprite.fw}x{sprite.fh} · {sprite.frames} frames · {sprite.w}x{sprite.h} sheet
                  </div>
                  {isExpanded && (
                    <div onClick={e => e.stopPropagation()}>
                      <SpriteSheetView sprite={sprite} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
