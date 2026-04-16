import React, { useState, useEffect, useRef } from 'react';
import { SPRITE_REGISTRY, CATEGORIES, GENRES, TYPES, searchSprites } from '../../data/spriteRegistry';

const COLORS = {
  bg: '#050a18',
  panel: 'rgba(6,182,212,0.06)',
  border: 'rgba(6,182,212,0.15)',
  borderHover: 'rgba(6,182,212,0.4)',
  accent: '#06b6d4',
  accentDim: '#0e7490',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
  cardBg: 'rgba(15,23,42,0.8)',
  selectedBg: 'rgba(6,182,212,0.12)',
};

const CATEGORY_LABELS = {
  heroes: 'Heroes',
  enemies: 'Enemies',
  bosses: 'Bosses',
  'sea-creatures': 'Sea Creatures',
  ships: 'Ships',
  effects: 'Effects',
  'grudge-box-fighters': 'Grudge Box Fighters',
  'grudge-box-enemies': 'Grudge Box Enemies',
};

const GENRE_ICONS = {
  fantasy: '\u2694',
  scifi: '\u{1F680}',
  underwater: '\u{1F30A}',
  cyberpunk: '\u{1F94A}',
};

function SpritePreview({ sprite, animName, scale = 2, autoPlay = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const a = sprite.animations.find(an => an.name === animName) || sprite.animations[0];
  if (!a) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${sprite.path}/${a.file}`;

    const fw = sprite.frameWidth;
    const fh = sprite.frameHeight;
    canvas.width = fw * scale;
    canvas.height = fh * scale;

    let frame = 0;
    let lastTime = 0;
    let cancelled = false;

    const draw = (time) => {
      if (cancelled) return;

      if (!autoPlay) {
        if (img.complete && img.naturalWidth > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, fw, fh, 0, 0, fw * scale, fh * scale);
        }
        return;
      }

      if (time - lastTime > a.speed) {
        lastTime = time;
        frame = (frame + 1) % a.frames;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (img.complete && img.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          img,
          frame * fw, 0, fw, fh,
          0, 0, fw * scale, fh * scale
        );
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    img.onload = () => {
      if (cancelled) return;
      if (autoPlay) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        draw(0);
      }
    };

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sprite.id, animName, scale, autoPlay]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}

function getCardScale(sprite, maxBoxSize) {
  const maxDim = Math.max(sprite.frameWidth, sprite.frameHeight);
  return maxBoxSize / maxDim;
}

function SpriteCard({ sprite, onClick, isSelected }) {
  const [hovered, setHovered] = useState(false);
  const maxDim = Math.max(sprite.frameWidth, sprite.frameHeight);
  const boxSize = maxDim <= 64 ? 100 : maxDim <= 128 ? 96 : 90;
  const scale = getCardScale(sprite, boxSize - 8);

  return (
    <div
      onClick={() => onClick(sprite)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? COLORS.selectedBg : COLORS.cardBg,
        border: `1px solid ${hovered || isSelected ? COLORS.borderHover : COLORS.border}`,
        borderRadius: '12px',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
      }}>
        <SpritePreview
          sprite={sprite}
          animName="idle"
          scale={scale}
        />
      </div>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ color: COLORS.text, fontSize: '12px', fontWeight: 600, fontFamily: 'Cinzel, serif' }}>
          {sprite.name}
        </div>
        <div style={{ color: COLORS.textMuted, fontSize: '10px', fontFamily: 'Jost, sans-serif', marginTop: '2px' }}>
          {sprite.frameWidth}x{sprite.frameHeight} | {sprite.animations.length} anims
        </div>
        <div style={{
          color: COLORS.accentDim,
          fontSize: '9px',
          fontFamily: 'monospace',
          marginTop: '3px',
          opacity: 0.7,
          wordBreak: 'break-all',
        }}>
          {sprite.id}
        </div>
      </div>
    </div>
  );
}

function SpriteDetail({ sprite, onClose }) {
  const [activeAnim, setActiveAnim] = useState(sprite.animations[0]?.name || 'idle');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '900px',
          width: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: COLORS.text, fontSize: '24px', fontFamily: 'Cinzel, serif', margin: 0 }}>{sprite.name}</h2>
            <div style={{ color: COLORS.textDim, fontSize: '12px', fontFamily: 'monospace', marginTop: '4px' }}>
              ID: {sprite.id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.textDim,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {'\u2715'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ background: COLORS.panel, borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', fontFamily: 'Jost, sans-serif' }}>
              <span style={{ color: COLORS.textMuted }}>Category:</span><span style={{ color: COLORS.text }}>{CATEGORY_LABELS[sprite.category] || sprite.category}</span>
              <span style={{ color: COLORS.textMuted }}>Genre:</span><span style={{ color: COLORS.text }}>{sprite.genre}</span>
              <span style={{ color: COLORS.textMuted }}>Type:</span><span style={{ color: COLORS.text }}>{sprite.type}</span>
              <span style={{ color: COLORS.textMuted }}>Frame Size:</span><span style={{ color: COLORS.text }}>{sprite.frameWidth}x{sprite.frameHeight}</span>
              <span style={{ color: COLORS.textMuted }}>Path:</span><span style={{ color: COLORS.accent, wordBreak: 'break-all' }}>{sprite.path}</span>
              {sprite.tags.length > 0 && (
                <><span style={{ color: COLORS.textMuted }}>Tags:</span><span style={{ color: COLORS.text }}>{sprite.tags.join(', ')}</span></>
              )}
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            minHeight: '200px',
          }}>
            <SpritePreview
              sprite={sprite}
              animName={activeAnim}
              scale={Math.min(4, Math.floor(200 / Math.max(sprite.frameWidth, sprite.frameHeight)) || 1)}
            />
          </div>
        </div>

        <div>
          <div style={{ color: COLORS.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Animations ({sprite.animations.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sprite.animations.map(a => (
              <button
                key={a.name}
                onClick={() => setActiveAnim(a.name)}
                style={{
                  background: activeAnim === a.name ? COLORS.selectedBg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeAnim === a.name ? COLORS.accent : COLORS.border}`,
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: activeAnim === a.name ? COLORS.accent : COLORS.textDim,
                  fontSize: '12px',
                  fontFamily: 'Jost, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                  {a.frames}f @ {a.speed}ms
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', background: COLORS.panel, borderRadius: '8px', padding: '12px' }}>
          <div style={{ color: COLORS.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Animation File Paths</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sprite.animations.map(a => (
              <div key={a.name} style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                <span style={{ color: COLORS.textDim, minWidth: '80px', display: 'inline-block' }}>{a.name}:</span>
                <span style={{ color: COLORS.accent }}>{sprite.path}/{a.file}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSpriteCatalog() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filtered = (() => {
    let list = SPRITE_REGISTRY;
    if (search) list = searchSprites(search);
    if (filterCategory !== 'all') list = list.filter(s => s.category === filterCategory);
    if (filterGenre !== 'all') list = list.filter(s => s.genre === filterGenre);
    if (filterType !== 'all') list = list.filter(s => s.type === filterType);
    return list;
  })();

  const grouped = {};
  for (const s of filtered) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: 'Jost, sans-serif',
      display: 'flex',
    }}>
      <div style={{
        width: sidebarCollapsed ? '50px' : '220px',
        borderRight: `1px solid ${COLORS.border}`,
        background: 'rgba(0,0,0,0.3)',
        padding: sidebarCollapsed ? '16px 8px' : '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'width 0.2s',
        overflowY: 'auto',
        overflowX: 'hidden',
        flexShrink: 0,
      }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textDim,
            cursor: 'pointer',
            fontSize: '18px',
            alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
          }}
        >
          {sidebarCollapsed ? '\u25B6' : '\u25C0'}
        </button>

        {!sidebarCollapsed && (
          <>
            <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <FilterBtn label="All" active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} count={SPRITE_REGISTRY.length} />
              {CATEGORIES.map(c => (
                <FilterBtn key={c} label={CATEGORY_LABELS[c] || c} active={filterCategory === c} onClick={() => setFilterCategory(c)} count={SPRITE_REGISTRY.filter(s => s.category === c).length} />
              ))}
            </div>

            <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Genre</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <FilterBtn label="All" active={filterGenre === 'all'} onClick={() => setFilterGenre('all')} />
              {GENRES.map(g => (
                <FilterBtn key={g} label={`${GENRE_ICONS[g] || ''} ${g}`} active={filterGenre === g} onClick={() => setFilterGenre(g)} />
              ))}
            </div>

            <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <FilterBtn label="All" active={filterType === 'all'} onClick={() => setFilterType('all')} />
              {TYPES.map(t => (
                <FilterBtn key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
              <a
                href="/"
                style={{ color: COLORS.textMuted, fontSize: '12px', textDecoration: 'none' }}
              >
                {'\u2190'} Back to Site
              </a>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '24px',
            margin: 0,
            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Sprite Catalog
          </h1>
          <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
            {filtered.length} / {SPRITE_REGISTRY.length} sprites
          </span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search sprites by name, category, genre, tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: `1px solid ${COLORS.border}`,
              background: 'rgba(0,0,0,0.3)',
              color: COLORS.text,
              fontSize: '14px',
              fontFamily: 'Jost, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {Object.entries(grouped).map(([cat, sprites]) => (
          <div key={cat} style={{ marginBottom: '28px' }}>
            <h2 style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '16px',
              color: COLORS.accent,
              margin: '0 0 12px 0',
              paddingBottom: '6px',
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              {CATEGORY_LABELS[cat] || cat}
              <span style={{ color: COLORS.textMuted, fontSize: '12px', fontFamily: 'Jost, sans-serif', marginLeft: '10px' }}>
                ({sprites.length})
              </span>
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
            }}>
              {sprites.map(s => (
                <SpriteCard
                  key={s.id}
                  sprite={s}
                  onClick={setSelectedSprite}
                  isSelected={selectedSprite?.id === s.id}
                />
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: COLORS.textMuted }}>
            No sprites match your filters.
          </div>
        )}
      </div>

      {selectedSprite && (
        <SpriteDetail sprite={selectedSprite} onClose={() => setSelectedSprite(null)} />
      )}
    </div>
  );
}

function FilterBtn({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? COLORS.selectedBg : 'transparent',
        border: 'none',
        borderRadius: '6px',
        padding: '5px 8px',
        cursor: 'pointer',
        color: active ? COLORS.accent : COLORS.textDim,
        fontSize: '12px',
        fontFamily: 'Jost, sans-serif',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.15s',
      }}
    >
      <span>{label}</span>
      {count !== undefined && <span style={{ opacity: 0.5, fontSize: '11px' }}>{count}</span>}
    </button>
  );
}
