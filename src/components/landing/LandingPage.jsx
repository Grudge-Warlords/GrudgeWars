import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameShowcase from './GameShowcase';
import WantedBoard from './WantedBoard';
import CinematicTrailer, { CinematicCanvas } from './CinematicTrailer';

function IndustrialParticleCanvas() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const PARTICLE_COUNT = Math.min(80, Math.floor(w * h / 12000));
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.6,
        size: 1 + Math.random() * 2.5,
        opacity: 0.15 + Math.random() * 0.35,
        hue: Math.random() > 0.6 ? 38 : Math.random() > 0.5 ? 270 : 190,
        life: Math.random(),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.03,
      });
    }
    particlesRef.current = particles;

    const gridLines = [];
    const gridSpacing = 120;
    for (let gx = 0; gx < w + gridSpacing; gx += gridSpacing) {
      gridLines.push({ x1: gx, y1: 0, x2: gx, y2: h, vertical: true });
    }
    for (let gy = 0; gy < h + gridSpacing; gy += gridSpacing) {
      gridLines.push({ x1: 0, y1: gy, x2: w, y2: gy, vertical: false });
    }

    let tick = 0;
    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, w, h);

      ctx.globalAlpha = 0.025;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 0.5;
      for (const line of gridLines) {
        const offset = Math.sin(tick * 0.005 + (line.vertical ? line.x1 : line.y1) * 0.01) * 3;
        ctx.beginPath();
        if (line.vertical) {
          ctx.moveTo(line.x1 + offset, line.y1);
          ctx.lineTo(line.x2 + offset, line.y2);
        } else {
          ctx.moveTo(line.x1, line.y1 + offset);
          ctx.lineTo(line.x2, line.y2 + offset);
        }
        ctx.stroke();
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        p.life += 0.002;

        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const pulseAlpha = 0.5 + 0.5 * Math.sin(p.pulse);
        const alpha = p.opacity * pulseAlpha;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${p.hue}, 80%, 65%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = `hsl(${p.hue}, 90%, 75%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const CONNECTION_DIST = 100;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.08;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none', zIndex: 1,
    }} />
  );
}

const GRUDA_HEROES = [
  'human_warrior', 'elf_mage', 'orc_warrior', 'dwarf_ranger',
  'barbarian_worg', 'undead_mage', 'elf_ranger', 'orc_worg',
  'dwarf_warrior', 'human_mage', 'barbarian_warrior', 'undead_ranger',
];

function GkoBoxingCard({ navigate }) {
  const [loopKey, setLoopKey] = useState(0);
  return (
    <>
    <style>{`
      .gko-card { margin-top: 32px; border-radius: 20px; overflow: hidden; border: 1px solid rgba(239,68,68,0.13); position: relative; cursor: pointer; transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.3s ease; }
      .gko-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 16px 60px rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.27); }
    `}</style>
    <div className="gko-card" onClick={() => navigate('/gko-boxing')}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        borderRadius: '20px', overflow: 'hidden',
      }}>
        <CinematicCanvas key={loopKey} trailerKey="boxing" playing={true} onEnd={() => setLoopKey(k => k + 1)} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 5, 25, 0.75), rgba(30, 10, 10, 0.7))',
        }} />
      </div>
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          background: '#ef444425',
          border: '1px solid #ef444455',
          borderRadius: '8px', padding: '4px 14px',
          fontSize: '10px', fontWeight: '700', color: '#ef4444',
          textTransform: 'uppercase', letterSpacing: '2px',
          marginBottom: '16px',
        }}>New — Playable Now</div>
        <h3 style={{
          fontFamily: "'Cinzel', serif", fontSize: '28px',
          color: '#f59e0b', marginBottom: '8px',
          textShadow: '0 0 20px rgba(245,158,11,0.3)',
        }}>G.K.O. BOXING</h3>
        <div style={{
          fontSize: '13px', color: '#ef4444',
          fontStyle: 'italic', marginBottom: '12px',
          letterSpacing: '2px', textTransform: 'uppercase',
        }}>Cyberpunk 1v1 Boxing Arena</div>
        <p style={{
          fontSize: '13px', color: '#94a3b8', lineHeight: '1.7',
          maxWidth: '600px', marginBottom: '20px',
        }}>
          Step into the neon-lit underground. Pick your fighter, chain devastating combos, break guards,
          and unleash special attacks in this canvas-based cyberpunk boxing game. 8 unique fighters, AI opponent, best-of-3 rounds.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          {[
            { label: 'Fighters', value: '8', color: '#ef4444' },
            { label: 'Combos', value: '6', color: '#f59e0b' },
            { label: 'Rounds', value: 'Bo3', color: '#22d3ee' },
            { label: 'Controls', value: '8 Keys', color: '#a855f7' },
          ].map(s => (
            <div key={s.label} style={{
              background: `${s.color}12`,
              border: `1px solid ${s.color}30`,
              borderRadius: '8px', padding: '6px 12px',
              textAlign: 'center', minWidth: '65px',
            }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: s.color, fontFamily: "'Cinzel', serif" }}>{s.value}</div>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', color: '#0a0a0f', fontWeight: '700',
          padding: '12px 32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
          boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
          whiteSpace: 'nowrap',
        }}>
          <span>Enter the Ring</span>
          <span>&#9654;</span>
        </div>
      </div>
    </div>
    </>
  );
}

export default function LandingPage() {
  const [hovered, setHovered] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const heroScrollRef = useRef(0);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'landing-scroll-fix';
    style.textContent = `
      html, body, #root { overflow: auto !important; height: auto !important; overscroll-behavior: auto !important; position: static !important; }
      body { touch-action: auto !important; }
      #root { display: block !important; }
    `;
    document.head.appendChild(style);
    setLoaded(true);
    return () => { const el = document.getElementById('landing-scroll-fix'); if (el) el.remove(); };
  }, []);

  const navigate = (path) => {
    window.location.href = path;
  };

  const openExternal = (url) => {
    window.open(url, '_blank', 'noopener');
  };

  const gameExamples = [
    {
      name: 'Shadow Knights',
      tagline: 'Where Darkness Forges Champions',
      desc: 'Dark medieval fantasy RPG set in the shattered kingdom of Valtheris. 6 races, 4 classes, shadow and ember magic system with full world map and chapter progression.',
      image: '/images/showcase_shadow_knights.png',
      colors: { primary: '#8b5cf6', secondary: '#dc2626', accent: '#f59e0b' },
      races: 6, classes: 4, enemies: 24, bosses: 4,
      demoPath: '/demo/shadow-knights',
    },
    {
      name: 'Starbound Corsairs',
      tagline: 'Plunder the Stars, Rule the Void',
      desc: 'Space pirate RPG in the Shattered Expanse. Pirates, bounty hunters, and rogue AI factions battle over ancient alien tech and jump gate control.',
      image: '/images/showcase_starbound_corsairs.png',
      colors: { primary: '#22d3ee', secondary: '#f97316', accent: '#a855f7' },
      races: 6, classes: 4, enemies: 24, bosses: 4,
      demoPath: '/demo/starbound-corsairs',
    },
  ];

  const stats = [
    { value: '6', label: 'AI Agents', color: '#fbbf24' },
    { value: '32+', label: 'Warlord Combos', color: '#06b6d4' },
    { value: '∞', label: 'Free AI Calls', color: '#a855f7' },
    { value: '∞', label: 'Possible Games', color: '#22c55e' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      color: '#e2e8f0',
      fontFamily: "'Jost', sans-serif",
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.6s ease',
      background: '#0a0a0f',
    }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.08); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(251, 191, 36, 0.15); }
          50% { border-color: rgba(251, 191, 36, 0.35); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(0.5deg); }
          75% { transform: translateY(4px) rotate(-0.5deg); }
        }
        @keyframes borderSweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>

      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/images/landing-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }} />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(10,10,15,0.3) 0%, rgba(10,10,15,0.5) 35%, rgba(10,10,15,0.8) 70%, #0a0a0f 100%)',
          zIndex: 1,
        }} />

        <div style={{
          position: 'absolute',
          top: '10%', left: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulseGlow 6s ease-in-out infinite',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          top: '25%', right: '5%',
          width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulseGlow 8s ease-in-out infinite 2s',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '15%', left: '40%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulseGlow 7s ease-in-out infinite 4s',
          zIndex: 1,
        }} />

        <IndustrialParticleCanvas />

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '40px 40px 80px', position: 'relative', zIndex: 10,
          textAlign: 'center',
        }}>
          <div style={{
            animation: 'slideUp 0.6s ease both',
            marginBottom: '20px',
          }}>
            <img src="/grudge-logo.png" alt="Grudge Studios" style={{
              width: '80px', height: '80px', objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.4))',
              animation: 'heroFloat 6s ease-in-out infinite',
            }} />
          </div>

          <div style={{
            fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '4px',
            color: '#fbbf24', marginBottom: '20px',
            animation: 'slideUp 0.6s ease 0.1s both',
          }}>AI-Powered RPG Game Engine</div>

          <h1 style={{
            fontFamily: "'MedievalSharp', 'Cinzel', serif", fontSize: 'clamp(42px, 7vw, 84px)', fontWeight: '400',
            lineHeight: '1.1', marginBottom: '24px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706, #fbbf24)',
            backgroundSize: '300% auto',
            animation: 'shimmer 5s linear infinite',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.25))',
            letterSpacing: '2px',
          }}>Game Factory</h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 22px)', color: '#c8d6e5', maxWidth: '700px', margin: '0 auto 16px',
            lineHeight: '1.6',
            animation: 'slideUp 0.6s ease 0.2s both',
          }}>
            Build complete RPG games with AI. Define your theme, races, classes, and world — 
            the engine generates everything else.
          </p>
          <p style={{
            fontSize: '14px', color: '#7c8da5', maxWidth: '600px', margin: '0 auto 40px',
            animation: 'slideUp 0.6s ease 0.3s both',
          }}>
            Powered by <span style={{ color: '#fbbf24', fontWeight: '600' }}>Grudge Studios</span>. One engine, infinite worlds.
          </p>

          <div style={{
            display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'slideUp 0.6s ease 0.4s both',
          }}>
            <button
              onClick={() => navigate('/factory')}
              onMouseEnter={() => setHovered('create')}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px 40px', borderRadius: '12px', border: 'none',
                background: hovered === 'create'
                  ? 'linear-gradient(135deg, #d97706, #b45309)'
                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#0a0a0f', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                boxShadow: hovered === 'create'
                  ? '0 8px 40px rgba(251, 191, 36, 0.4)'
                  : '0 4px 24px rgba(251, 191, 36, 0.2)',
                transform: hovered === 'create' ? 'translateY(-3px)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >Create Your Game</button>

            <button
              onClick={() => navigate('/play')}
              onMouseEnter={() => setHovered('play')}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px 40px', borderRadius: '12px',
                border: '2px solid #06b6d4',
                background: hovered === 'play' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.05)',
                color: '#06b6d4', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                transform: hovered === 'play' ? 'translateY(-3px)' : 'none',
                boxShadow: hovered === 'play' ? '0 8px 30px rgba(6, 182, 212, 0.2)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >Play Betta Warlords</button>

            <button
              onClick={() => navigate('/gbux')}
              onMouseEnter={() => setHovered('gbux')}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px 40px', borderRadius: '12px',
                border: '2px solid #a855f7',
                background: hovered === 'gbux' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.05)',
                color: '#a855f7', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                transform: hovered === 'gbux' ? 'translateY(-3px)' : 'none',
                boxShadow: hovered === 'gbux' ? '0 8px 30px rgba(168, 85, 247, 0.2)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >Get GBuX</button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '32px 48px', justifyContent: 'center', marginTop: '60px',
            animation: 'slideUp 0.6s ease 0.5s both',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{
                  fontFamily: "'Cinzel', serif", fontSize: '36px', fontWeight: '700',
                  color: s.color,
                  textShadow: `0 0 25px ${s.color}44`,
                }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" style={{
        maxWidth: '1100px', margin: '0 auto', padding: '80px 40px',
        position: 'relative',
      }} >
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#fbbf24', marginBottom: '8px' }}>
            Built with Game Factory
          </div>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 4vw, 38px)',
            color: '#e2e8f0', marginBottom: '8px',
          }}>Games We Made</h2>
          <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '48px' }}>
            Two complete RPGs generated by the engine — fully playable with races, classes, lore, and combat
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '24px',
        }}>
          {gameExamples.map((game, i) => (
            <div key={game.name} style={{
              position: 'relative',
              borderRadius: '20px', overflow: 'hidden',
              border: `1px solid ${game.colors.primary}22`,
              background: 'rgba(10, 10, 20, 0.9)',
              cursor: 'pointer',
              animation: `slideUp 0.6s ease ${i * 0.15}s both`,
              transition: 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.3s ease',
            }}
              onClick={() => navigate(game.demoPath)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                e.currentTarget.style.boxShadow = `0 16px 60px ${game.colors.primary}20`;
                e.currentTarget.style.borderColor = `${game.colors.primary}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = `${game.colors.primary}22`;
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={game.image}
                  alt={game.name}
                  loading="lazy"
                  style={{
                    width: '100%', height: '220px', objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.6s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, rgba(10,10,20,0.95) 100%)`,
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: `${game.colors.primary}25`,
                  border: `1px solid ${game.colors.primary}55`,
                  borderRadius: '8px', padding: '4px 10px',
                  fontSize: '10px', fontWeight: '700', color: game.colors.primary,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  backdropFilter: 'blur(8px)',
                }}>
                  Playable Demo
                </div>
              </div>

              <div style={{ padding: '20px 24px 24px' }}>
                <h3 style={{
                  fontFamily: "'Cinzel', serif", fontSize: '22px',
                  color: '#f1f5f9', marginBottom: '4px',
                }}>{game.name}</h3>
                <div style={{
                  fontSize: '12px', color: game.colors.primary,
                  fontStyle: 'italic', marginBottom: '10px',
                }}>{game.tagline}</div>
                <p style={{
                  fontSize: '13px', color: '#94a3b8', lineHeight: '1.6',
                  marginBottom: '16px',
                }}>{game.desc}</p>

                <div style={{
                  display: 'flex', gap: '12px', flexWrap: 'wrap',
                }}>
                  {[
                    { label: 'Races', value: game.races, color: game.colors.primary },
                    { label: 'Classes', value: game.classes, color: game.colors.accent },
                    { label: 'Enemies', value: game.enemies, color: game.colors.secondary },
                    { label: 'Bosses', value: game.bosses, color: '#ef4444' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: `${s.color}12`,
                      border: `1px solid ${s.color}30`,
                      borderRadius: '8px', padding: '6px 12px',
                      textAlign: 'center', minWidth: '60px',
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: s.color, fontFamily: "'Cinzel', serif" }}>{s.value}</div>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '13px', color: '#0a0a0f', fontWeight: '700',
                  padding: '10px 20px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${game.colors.primary}, ${game.colors.accent})`,
                  justifyContent: 'center',
                  boxShadow: `0 4px 16px ${game.colors.primary}30`,
                  transition: 'all 0.3s',
                }}>
                  <span>Play Now</span>
                  <span style={{ fontSize: '14px' }}>&#9654;</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <GkoBoxingCard navigate={navigate} />

        <div style={{
          marginTop: '32px',
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid #a855f722',
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.3s ease',
        }}
          onClick={() => navigate('/shadow-ops')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 16px 60px rgba(168,85,247,0.15)';
            e.currentTarget.style.borderColor = '#a855f744';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#a855f722';
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(10, 5, 30, 0.9), rgba(20, 10, 40, 0.85))',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              background: '#a855f725',
              border: '1px solid #a855f755',
              borderRadius: '8px', padding: '4px 14px',
              fontSize: '10px', fontWeight: '700', color: '#a855f7',
              textTransform: 'uppercase', letterSpacing: '2px',
              marginBottom: '16px',
            }}>New — Survival Arena</div>
            <h3 style={{
              fontFamily: "'Cinzel', serif", fontSize: '28px',
              color: '#fbbf24', marginBottom: '8px',
              textShadow: '0 0 20px rgba(245,158,11,0.3)',
            }}>SHADOW OPS</h3>
            <div style={{
              fontSize: '13px', color: '#a855f7',
              fontStyle: 'italic', marginBottom: '12px',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>Top-Down Survival Shooter</div>
            <p style={{
              fontSize: '13px', color: '#94a3b8', lineHeight: '1.7',
              maxWidth: '600px', marginBottom: '20px',
            }}>
              Face endless waves of enemies in this top-down survival arena.
              8 enemy types, WASD movement, mouse aim, dash mechanics, and leveling.
              How long can you survive?
            </p>
            <div style={{
              display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px',
            }}>
              {[
                { value: '8', label: 'Enemy Types', color: '#a855f7' },
                { value: '∞', label: 'Waves', color: '#22d3ee' },
                { value: 'WASD', label: 'Controls', color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  borderRadius: '8px', padding: '6px 12px',
                  textAlign: 'center', minWidth: '65px',
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: s.color, fontFamily: "'Cinzel', serif" }}>{s.value}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', color: '#0a0a0f', fontWeight: '700',
              padding: '12px 32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
            }}>
              <span>Start Mission</span>
              <span>&#9654;</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', padding: '0 40px 40px' }}>
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid #06b6d422',
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.4s ease, box-shadow 0.4s ease, border-color 0.3s ease',
        }}
          onClick={() => navigate('/warlords-gauntlet')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 16px 60px rgba(6,182,212,0.15)';
            e.currentTarget.style.borderColor = '#06b6d444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#06b6d422';
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(5, 15, 30, 0.9), rgba(10, 20, 40, 0.85))',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              background: '#06b6d425',
              border: '1px solid #06b6d455',
              borderRadius: '8px', padding: '4px 14px',
              fontSize: '10px', fontWeight: '700', color: '#22d3ee',
              textTransform: 'uppercase', letterSpacing: '2px',
              marginBottom: '16px',
            }}>New — 2D Platformer</div>
            <h3 style={{
              fontFamily: "'Cinzel', serif", fontSize: '28px',
              color: '#22d3ee', marginBottom: '8px',
              textShadow: '0 0 20px rgba(34,211,238,0.3)',
            }}>WARLORD'S GAUNTLET</h3>
            <div style={{
              fontSize: '13px', color: '#f59e0b',
              fontStyle: 'italic', marginBottom: '12px',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>Side-Scrolling Action Platformer</div>
            <p style={{
              fontSize: '13px', color: '#94a3b8', lineHeight: '1.7',
              maxWidth: '600px', marginBottom: '20px',
            }}>
              Choose from 3 champions, each with unique sprites and stats.
              Conquer the Magic Cliffs with full physics, combo attacks, dodge rolls,
              ranged spells, and wall-jumping. Defeat enemies and reach the goal!
            </p>
            <div style={{
              display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px',
            }}>
              {[
                { value: '3', label: 'Heroes', color: '#22d3ee' },
                { value: '15+', label: 'Animations', color: '#a855f7' },
                { value: 'Combo', label: 'Combat', color: '#ef4444' },
                { value: 'Roll', label: 'Dodge', color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  borderRadius: '8px', padding: '6px 12px',
                  textAlign: 'center', minWidth: '65px',
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: s.color, fontFamily: "'Cinzel', serif" }}>{s.value}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', color: '#0a0a0f', fontWeight: '700',
              padding: '12px 32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
            }}>
              <span>Enter the Gauntlet</span>
              <span>&#9654;</span>
            </div>
          </div>
        </div>
      </section>

      <section id="hero-roster" style={{
        position: 'relative', padding: '60px 40px',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#fbbf24', marginBottom: '8px' }}>
              grudgewarlords.com — Live Now
            </div>
            <h2 style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 3.5vw, 34px)',
              color: '#e2e8f0', marginBottom: '8px',
            }}>GRUDA Wars Hero Roster</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              24 unique heroes across 6 races and 4 classes
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '10px',
          }}>
            {GRUDA_HEROES.map((id, i) => {
              const name = id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={id} style={{
                  padding: '10px 12px', borderRadius: '10px',
                  border: '1px solid rgba(251,191,36,0.15)',
                  background: 'rgba(10,10,20,0.7)',
                  animation: `slideUp 0.4s ease ${i * 0.04}s both`,
                  transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
                  textAlign: 'center',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,191,36,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(251,191,36,0.15)';
                  }}
                >
                  <div style={{
                    fontSize: '11px', fontWeight: '700', color: '#fbbf24',
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px',
                  }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <WantedBoard />

      <CinematicTrailer />

      <GameShowcase />

      <section style={{
        position: 'relative',
        padding: '80px 40px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.04) 30%, rgba(251,191,36,0.04) 70%, transparent 100%)',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px',
            background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)',
            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#a855f7',
          }}>Powered by GBuX</div>

          <h2 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 4vw, 38px)',
            marginBottom: '12px', color: '#e2e8f0',
          }}>Unlock Premium Features</h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '40px', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 40px' }}>
            GBuX tokens power AI game generation, deployments, custom themes, and premium editor access.
            Built on Solana for transparent, lightning-fast transactions.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px', marginBottom: '40px',
          }}>
            {[
              { name: 'Starter', price: '$10', gbux: '1,000', features: ['3 AI Generations', '1 Deployment', 'Account Creation'], color: '#06b6d4' },
              { name: 'Creator', price: '$25', gbux: '3,000', features: ['10 AI Generations', '5 Deployments', 'AI Editor Access', 'Priority'], color: '#fbbf24', popular: true },
              { name: 'Studio', price: '$50', gbux: '7,500', features: ['Unlimited Generations', 'Unlimited Deployments', 'Custom Themes', 'Priority Support'], color: '#a855f7' },
            ].map(pkg => (
              <div key={pkg.name} style={{
                position: 'relative',
                padding: '28px 24px', borderRadius: '16px',
                background: 'rgba(10, 10, 20, 0.8)',
                border: `1px solid ${pkg.color}${pkg.popular ? '50' : '25'}`,
                boxShadow: pkg.popular ? `0 0 40px ${pkg.color}15` : 'none',
                transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
                cursor: 'pointer',
              }}
                onClick={() => navigate('/gbux')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 40px ${pkg.color}20`;
                  e.currentTarget.style.borderColor = `${pkg.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = pkg.popular ? `0 0 40px ${pkg.color}15` : 'none';
                  e.currentTarget.style.borderColor = `${pkg.color}${pkg.popular ? '50' : '25'}`;
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${pkg.color}, #f59e0b)`,
                    padding: '3px 14px', borderRadius: '12px',
                    fontSize: '10px', fontWeight: '700', color: '#0a0a0f',
                    textTransform: 'uppercase', letterSpacing: '1px',
                  }}>Most Popular</div>
                )}
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: '700', color: pkg.color, marginBottom: '4px' }}>{pkg.name}</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#e2e8f0', marginBottom: '2px' }}>{pkg.price}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{pkg.gbux} GBuX</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pkg.features.map(f => (
                    <div key={f} style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: pkg.color, fontSize: '10px' }}>&#10003;</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/gbux')}
            onMouseEnter={() => setHovered('store')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '14px 36px', borderRadius: '12px', border: 'none',
              background: hovered === 'store'
                ? 'linear-gradient(135deg, #9333ea, #7c3aed)'
                : 'linear-gradient(135deg, #a855f7, #8b5cf6)',
              color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              boxShadow: hovered === 'store' ? '0 8px 30px rgba(168,85,247,0.3)' : '0 4px 20px rgba(168,85,247,0.15)',
              transform: hovered === 'store' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >Visit GBuX Store</button>
        </div>
      </section>

      <section style={{
        position: 'relative',
        padding: '80px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.03) 50%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 4vw, 38px)',
            marginBottom: '16px', color: '#e2e8f0',
          }}>Your Turn</h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', lineHeight: '1.7' }}>
            Pick a theme. The AI handles the rest. Medieval knights, space pirates, samurai cats, 
            sci-fi tech wars — or anything you can imagine.
          </p>
          <button
            onClick={() => navigate('/factory')}
            onMouseEnter={() => setHovered('cta')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '18px 48px', borderRadius: '14px', border: 'none',
              background: hovered === 'cta'
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#0a0a0f', fontSize: '18px', fontWeight: '700', cursor: 'pointer',
              boxShadow: hovered === 'cta'
                ? '0 8px 40px rgba(251, 191, 36, 0.35)'
                : '0 4px 30px rgba(251, 191, 36, 0.15)',
              transform: hovered === 'cta' ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >Open Game Factory</button>
        </div>
      </section>

      <footer style={{
        borderTop: '1px solid rgba(251, 191, 36, 0.1)', padding: '30px 40px', textAlign: 'center',
        maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <img src="/grudge-logo.png" alt="" style={{ height: '28px', opacity: 0.7 }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: '#fbbf2488' }}>Grudge Studios</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '12px' }}>
          <a href="https://grudgestudio.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fbbf24'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >grudgestudio.com</a>
          <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#06b6d4'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >grudgewarlords.com</a>
        </div>
        <p style={{ fontSize: '11px', color: '#374151' }}>
          Game Factory — One engine, infinite worlds. Powered by Puter.js free AI.
        </p>
      </footer>
    </div>
  );
}
