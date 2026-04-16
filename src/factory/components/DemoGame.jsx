import React, { useState, useMemo, useEffect, useRef } from 'react';
import FactoryBattle from './FactoryBattle';
import GameContainer from './GameContainer';
import ArsenalPanel from './ArsenalPanel';
import { SHADOW_KNIGHTS_SPEC } from '../schema/shadowKnightsSpec';
import { STARBOUND_CORSAIRS_SPEC } from '../schema/starboundCorsairsSpec';
import { CinematicCanvas } from '../../components/landing/CinematicTrailer';

const SPECS = {
  'shadow-knights': SHADOW_KNIGHTS_SPEC,
  'starbound-corsairs': STARBOUND_CORSAIRS_SPEC,
};

const SPLASH_KEYFRAMES = `
@keyframes splashFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes splashTitleIn {
  0% { opacity: 0; transform: scale(0.9) translateY(10px); letter-spacing: 6px; }
  60% { opacity: 1; transform: scale(1.02) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 2px; }
}
@keyframes splashGlow {
  0%, 100% { box-shadow: 0 0 30px var(--glow-color), 0 0 60px var(--glow-color-dim); }
  50% { box-shadow: 0 0 50px var(--glow-color), 0 0 100px var(--glow-color-dim), 0 0 140px var(--glow-color-faint); }
}
@keyframes splashBgPan {
  0% { transform: scale(1.1) translate(0, 0); }
  50% { transform: scale(1.15) translate(-1%, -1%); }
  100% { transform: scale(1.1) translate(0, 0); }
}
@keyframes splashDividerGrow {
  from { width: 0; opacity: 0; }
  to { width: 120px; opacity: 1; }
}
@keyframes splashPulseText {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
@keyframes splashParticle {
  0% { transform: translateY(0) scale(1); opacity: 0.6; }
  100% { transform: translateY(-100vh) scale(0); opacity: 0; }
}
`;

function SplashParticles({ color }) {
  const particles = useMemo(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
      p.push({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    return p;
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`,
          bottom: '-10px',
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          background: color,
          opacity: p.opacity,
          animation: `splashParticle ${p.duration}s ${p.delay}s infinite linear`,
        }} />
      ))}
    </div>
  );
}

export default function DemoGame({ gameId }) {
  const spec = SPECS[gameId];
  const [showInfo, setShowInfo] = useState(true);
  const [showArsenal, setShowArsenal] = useState(false);
  const [splashReady, setSplashReady] = useState(false);
  const [loopKey, setLoopKey] = useState(0);
  const palette = spec?.meta?.colorPalette || {};
  const trailerKey = gameId === 'starbound-corsairs' ? 'space' : 'fantasy';

  useEffect(() => {
    if (showInfo) {
      setSplashReady(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSplashReady(true));
      });
    }
  }, [showInfo]);

  if (!spec) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050a18', color: '#e2e8f0', fontFamily: "'Jost', sans-serif",
        flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '28px', color: '#fbbf24' }}>Game Not Found</div>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 32px', borderRadius: '10px', border: '1px solid #fbbf24',
            background: 'rgba(251,191,36,0.1)', color: '#fbbf24', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600',
          }}
        >Back to Home</button>
      </div>
    );
  }

  const splashBg = useMemo(() => {
    const bgs = spec?.meta?.battleBackgrounds || [];
    return bgs.length > 0 ? bgs[0] : null;
  }, [spec]);

  if (showInfo) {
    const primary = palette.primary || '#06b6d4';
    const accent = palette.accent || '#f59e0b';
    const secondary = palette.secondary || primary;
    const bg = palette.background || '#050a18';

    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color: '#e2e8f0',
        fontFamily: "'Jost', sans-serif", position: 'relative', overflow: 'hidden',
        '--glow-color': `${primary}60`,
        '--glow-color-dim': `${primary}30`,
        '--glow-color-faint': `${primary}15`,
      }}>
        <style>{SPLASH_KEYFRAMES}</style>

        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CinematicCanvas key={loopKey} trailerKey={trailerKey} playing={true} onEnd={() => setLoopKey(k => k + 1)} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${bg}cc, ${bg}bb)`,
          }} />
        </div>

        {splashBg && (
          <div style={{
            position: 'absolute', inset: '-10%',
            backgroundImage: `url(${splashBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.35,
            animation: 'splashBgPan 20s ease-in-out infinite',
          }} />
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 50% 35%, transparent 0%, ${bg}50 50%, ${bg}e0 75%, ${bg} 90%),
            linear-gradient(to top, ${bg} 0%, transparent 30%)
          `,
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, ${primary}0a 0%, transparent 50%)`,
        }} />

        <SplashParticles color={primary} />

        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          padding: '24px',
          maxWidth: '640px', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: splashReady ? 1 : 0,
          transition: 'opacity 0.3s',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '5px',
            color: accent, marginBottom: '20px',
            animation: splashReady ? 'splashFadeIn 0.6s 0.1s ease-out forwards' : 'none',
            opacity: 0,
          }}>Grudge Studios</div>

          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(44px, 8vw, 80px)',
            color: '#fff',
            margin: '0 0 4px',
            lineHeight: 1.0,
            textShadow: `0 0 60px ${primary}, 0 0 120px ${primary}80, 0 4px 8px rgba(0,0,0,0.95)`,
            animation: splashReady ? 'splashTitleIn 0.8s 0.2s ease-out forwards' : 'none',
            opacity: 0,
          }}>{spec.meta.gameName}</h1>

          <div style={{
            width: '0px', height: '2px', margin: '16px auto 18px',
            background: `linear-gradient(90deg, transparent, ${primary}, ${accent}, ${primary}, transparent)`,
            borderRadius: '2px',
            animation: splashReady ? 'splashDividerGrow 0.8s 0.6s ease-out forwards' : 'none',
            opacity: 0,
          }} />

          <div style={{
            fontSize: '15px', color: accent,
            fontStyle: 'italic', marginBottom: '32px',
            textShadow: `0 0 20px ${accent}30`,
            animation: splashReady ? 'splashFadeIn 0.6s 0.8s ease-out forwards' : 'none',
            opacity: 0,
            letterSpacing: '1px',
          }}>{spec.meta.tagline}</div>

          <div style={{
            display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap',
            marginBottom: '40px',
            animation: splashReady ? 'splashFadeIn 0.6s 1.0s ease-out forwards' : 'none',
            opacity: 0,
          }}>
            {[
              { v: spec.raceCount, l: 'Races', c: primary },
              { v: spec.classCount, l: 'Classes', c: accent },
              { v: spec.enemyCount, l: 'Enemies', c: secondary },
              { v: spec.bossCount, l: 'Bosses', c: '#ef4444' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700, color: s.c,
                  textShadow: `0 0 15px ${s.c}40`,
                  lineHeight: 1,
                }}>{s.v}</div>
                <div style={{ fontSize: '9px', color: '#536178', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowInfo(false)}
            style={{
              padding: '16px 56px', borderRadius: '4px',
              border: `1px solid ${primary}80`,
              background: `linear-gradient(180deg, ${primary}20 0%, ${primary}08 100%)`,
              color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '3px', textTransform: 'uppercase',
              textShadow: `0 0 20px ${primary}`,
              animation: splashReady ? 'splashFadeIn 0.6s 1.2s ease-out forwards, splashGlow 3s 2s ease-in-out infinite' : 'none',
              opacity: 0,
              transition: 'all 0.3s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              e.target.style.background = `linear-gradient(180deg, ${primary}40 0%, ${primary}15 100%)`;
              e.target.style.borderColor = primary;
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.target.style.background = `linear-gradient(180deg, ${primary}20 0%, ${primary}08 100%)`;
              e.target.style.borderColor = `${primary}80`;
              e.target.style.transform = 'scale(1)';
            }}
          >Enter Battle</button>

          <div style={{
            marginTop: '40px',
            animation: splashReady ? 'splashFadeIn 0.6s 1.6s ease-out forwards, splashPulseText 3s 2.5s ease-in-out infinite' : 'none',
            opacity: 0,
          }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '6px 16px', border: 'none', background: 'transparent',
                color: '#3a4560', fontSize: '11px', cursor: 'pointer',
                letterSpacing: '1px', transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = primary}
              onMouseLeave={e => e.target.style.color = '#3a4560'}
            >Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: palette.background || '#050a18',
      fontFamily: "'Jost', sans-serif",
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '16px',
        background: 'rgba(10,10,20,0.9)', borderBottom: `1px solid ${palette.primary}22`,
        flexShrink: 0, height: '44px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '6px 16px', borderRadius: '8px',
            border: `1px solid ${palette.primary}44`,
            background: 'transparent', color: palette.primary,
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
        >Home</button>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', color: palette.primary }}>
          {spec.meta.gameName}
        </span>
        <button
          onClick={() => setShowArsenal(true)}
          style={{
            padding: '6px 16px', borderRadius: '8px',
            border: `1px solid ${palette.accent || '#f59e0b'}44`,
            background: `${palette.accent || '#f59e0b'}10`,
            color: palette.accent || '#f59e0b',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto',
          }}
        >Arsenal</button>
        <button
          onClick={() => setShowInfo(true)}
          style={{
            padding: '6px 16px', borderRadius: '8px',
            border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8',
            fontSize: '12px', cursor: 'pointer',
          }}
        >Game Info</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <FactoryBattle spec={spec} onBack={() => setShowInfo(true)} />
      </div>
      {showArsenal && (
        <ArsenalPanel palette={palette} onClose={() => setShowArsenal(false)} />
      )}
    </div>
  );
}
