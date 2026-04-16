import React, { useState, useEffect, useRef } from 'react';
import SpriteShowcase from './SpriteShowcase';

const BETTA_SLIDES = [
  '/backgrounds/ocean_battle_new.png',
  '/backgrounds/coral_reef_city.png',
  '/backgrounds/kelp_forest.png',
  '/backgrounds/frozen_depths.png',
  '/backgrounds/volcanic_battle.png',
  '/backgrounds/sunken_temple.png',
  '/backgrounds/deep_trench.png',
  '/backgrounds/abyssal_depths.png',
];


function useInView(ref, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

function ParticleCanvas({ color1, color2, count = 40 }) {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; };
    resize();
    window.addEventListener('resize', resize);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      return () => { window.removeEventListener('resize', resize); };
    }

    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.3,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? color1 : color2,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        const glow = (Math.sin(p.pulse) + 1) / 2;
        const alpha = p.opacity * (0.5 + glow * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + glow * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('1)', `${alpha})`);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('1)', `${alpha * 0.15})`);
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [color1, color2, count]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />;
}

function Slideshow({ images, interval = 4000 }) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % images.length), interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: '12px' }}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          onLoad={() => setLoaded(prev => ({ ...prev, [i]: true }))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === current && loaded[i] ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            filter: 'brightness(0.85) saturate(1.2)',
          }}
        />
      ))}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(10,10,15,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,15,0.5) 100%)',
        zIndex: 1,
      }} />
      <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
        {images.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: i === current ? '20px' : '6px', height: '6px', borderRadius: '3px',
            background: i === current ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: 'pointer', transition: 'all 0.4s ease',
            border: 'none', padding: 0, outline: 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

const GRUDA_HEROES = [
  { id: 'human', name: 'Human', cls: 'Warrior', color: '#fbbf24' },
  { id: 'elf', name: 'Elf', cls: 'Mage', color: '#22d3ee' },
  { id: 'orc', name: 'Orc', cls: 'Berserker', color: '#ef4444' },
  { id: 'dwarf', name: 'Dwarf', cls: 'Ranger', color: '#f97316' },
  { id: 'barbarian', name: 'Barbarian', cls: 'Worg', color: '#a855f7' },
  { id: 'undead', name: 'Undead', cls: 'Necromancer', color: '#6ee7b7' },
];

const GRUDA_FEATURES = [
  { icon: '\u2694\uFE0F', label: '3v3 Arena PvP', desc: 'Tactical team battles with positioning', color: '#ef4444' },
  { icon: '\u2699\uFE0F', label: 'AI Agent Teams', desc: 'Smart AI controls your heroes', color: '#06b6d4' },
  { icon: '\u2692\uFE0F', label: '5 Crafting Professions', desc: 'Blacksmith, Alchemist & more', color: '#f59e0b' },
  { icon: '\u26A1', label: 'ELO Ranked', desc: 'Competitive matchmaking system', color: '#a855f7' },
  { icon: '\uD83C\uDFDD\uFE0F', label: 'Island Territories', desc: 'Conquer and hold territory', color: '#22c55e' },
  { icon: '\uD83D\uDDDD\uFE0F', label: 'cNFT Characters', desc: 'Mint heroes on Solana', color: '#ec4899' },
];

const GRUDA_STATS = [
  { value: '6', label: 'Playable Races', color: '#fbbf24' },
  { value: '4', label: 'Combat Classes', color: '#ef4444' },
  { value: '119+', label: 'Weapons', color: '#a855f7' },
  { value: '32', label: 'Map Zones', color: '#06b6d4' },
];

function GrudaContent({ isMobile }) {
  const [hoveredHero, setHoveredHero] = useState(null);
  const [hoveredFeat, setHoveredFeat] = useState(null);

  return (
    <div style={{
      position: 'relative', borderRadius: '24px', overflow: 'hidden',
      border: '2px solid rgba(251,191,36,0.3)',
      boxShadow: '0 20px 60px rgba(251,191,36,0.08), 0 0 80px rgba(251,191,36,0.04)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/images/showcase_gruda_hero.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.3) saturate(1.3)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,10,15,0.88) 0%, rgba(10,10,15,0.65) 40%, rgba(251,191,36,0.06) 100%)',
        zIndex: 1,
      }} />
      <ParticleCanvas color1="rgba(251, 191, 36, 1)" color2="rgba(239, 68, 68, 1)" count={25} />

      <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '28px 20px' : '48px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '40px', alignItems: 'start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#fbbf24' }}>Live Now</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <img src="/grudge-logo.png" alt="GRUDA Wars" style={{
                height: '56px', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.4))',
              }} />
              <h3 style={{
                fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '700',
                color: '#f1f5f9',
                textShadow: '0 0 40px rgba(251,191,36,0.3)',
              }}>GRUDA Wars</h3>
            </div>

            <p style={{ fontSize: '15px', color: '#b0bec5', lineHeight: '1.8', marginBottom: '20px', maxWidth: '500px' }}>
              The full GRUDGE Warlords platform. Arena PvP with 3v3 tactical battles, ELO ranking, 
              AI agent teams, 5 crafting professions, island territories, and cNFT character minting on Solana.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {['Solana', 'Free-to-Play', 'Cross-Platform', 'Live PvP'].map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: 'rgba(15,15,25,0.6)', color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.2)',
                  backdropFilter: 'blur(8px)',
                }}>{tag}</span>
              ))}
            </div>

            <button
              onClick={() => window.open('https://grudgewarlords.com', '_blank', 'noopener')}
              style={{
                padding: '14px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#0a0a0f', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(251,191,36,0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(251,191,36,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(251,191,36,0.4)'; }}
            >Play GRUDA Wars</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
              <video
                autoPlay loop muted playsInline preload="metadata"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  filter: 'brightness(0.8) saturate(1.2)',
                }}
              >
                <source src="/videos/hero_scroll.mp4" type="video/mp4" />
              </video>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(10,10,15,0.3) 0%, transparent 30%, transparent 70%, rgba(10,10,15,0.5) 100%)',
                pointerEvents: 'none',
              }} />
            </div>

            <div style={{
              padding: '16px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(10,10,20,0.9), rgba(20,15,30,0.85))',
              border: '1px solid rgba(251,191,36,0.12)',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#fbbf24', marginBottom: '12px' }}>
                Hero Roster
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {GRUDA_HEROES.map((hero, i) => {
                  const isHovered = hoveredHero === i;
                  return (
                    <div
                      key={hero.id}
                      onMouseEnter={() => setHoveredHero(i)}
                      onMouseLeave={() => setHoveredHero(null)}
                      style={{
                        padding: '8px 10px', borderRadius: '8px',
                        border: `1px solid ${isHovered ? hero.color + '60' : 'rgba(255,255,255,0.06)'}`,
                        background: isHovered ? `${hero.color}12` : 'rgba(15,15,25,0.5)',
                        transition: 'all 0.3s ease',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHovered ? `0 4px 16px ${hero.color}20` : 'none',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div style={{
                        fontSize: '9px', fontWeight: '700', color: isHovered ? hero.color : '#cbd5e1',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        transition: 'color 0.3s',
                      }}>{hero.name}</div>
                      <div style={{
                        fontSize: '8px', color: '#64748b', marginTop: '2px',
                      }}>{hero.cls}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {GRUDA_STATS.map(s => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px 6px', borderRadius: '10px',
                  background: 'rgba(10,10,20,0.7)', border: `1px solid ${s.color}20`,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: '700', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '10px',
          marginTop: '24px',
        }}>
          {GRUDA_FEATURES.map((feat, i) => {
            const isActive = hoveredFeat === i;
            return (
              <div
                key={feat.label}
                onMouseEnter={() => setHoveredFeat(i)}
                onMouseLeave={() => setHoveredFeat(null)}
                style={{
                  padding: '14px 12px', borderRadius: '12px',
                  background: isActive
                    ? `linear-gradient(135deg, ${feat.color}12, ${feat.color}06)`
                    : 'rgba(10,10,20,0.5)',
                  border: `1px solid ${isActive ? feat.color + '40' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    fontSize: '18px',
                    filter: isActive ? `drop-shadow(0 0 6px ${feat.color}60)` : 'none',
                    transition: 'filter 0.3s',
                  }}>{feat.icon}</div>
                  <div>
                    <div style={{
                      fontSize: '11px', fontWeight: '700', color: isActive ? feat.color : '#cbd5e1',
                      transition: 'color 0.3s',
                    }}>{feat.label}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{feat.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BettaContent({ isMobile }) {
  return (
    <div style={{
      position: 'relative', borderRadius: '24px', overflow: 'hidden',
      border: '2px solid rgba(6,182,212,0.3)',
      boxShadow: '0 20px 60px rgba(6,182,212,0.08), 0 0 80px rgba(6,182,212,0.04)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/images/showcase_betta_hero.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.3) saturate(1.3)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,10,15,0.88) 0%, rgba(10,10,15,0.65) 40%, rgba(6,182,212,0.06) 100%)',
        zIndex: 1,
      }} />
      <ParticleCanvas color1="rgba(6, 182, 212, 1)" color2="rgba(168, 85, 247, 1)" count={25} />

      <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '28px 20px' : '48px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '40px', alignItems: 'start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#06b6d4' }}>Beta</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <img src="/grudge-logo.png" alt="Betta Warlords" style={{
                height: '56px', filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.4))',
              }} />
              <h3 style={{
                fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '700',
                color: '#f1f5f9',
                textShadow: '0 0 40px rgba(6,182,212,0.3)',
              }}>Betta Warlords</h3>
            </div>

            <p style={{ fontSize: '15px', color: '#b0bec5', lineHeight: '1.8', marginBottom: '20px', maxWidth: '500px' }}>
              An underwater freshwater adventure RPG with 8 betta fish species, 4 combat classes, 
              tactical multi-hero battles, deep lore driven by the Three Vessels of Magic, and 
              AI-powered hero dialogue that makes every playthrough unique.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {['8 Breeds', '4 Classes', 'Tactical Combat', 'AI Dialogue', 'World Map', 'Deep Lore', 'Free AI', 'PWA'].map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: 'rgba(15,15,25,0.6)', color: '#06b6d4',
                  border: '1px solid rgba(6,182,212,0.2)',
                  backdropFilter: 'blur(8px)',
                }}>{tag}</span>
              ))}
            </div>

            <button
              onClick={() => { window.location.href = '/play'; }}
              style={{
                padding: '14px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#0a0a0f', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(6,182,212,0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(6,182,212,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(6,182,212,0.4)'; }}
            >Play Now</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Slideshow images={BETTA_SLIDES} />
            </div>

            <div style={{
              padding: '16px', borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.12)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#06b6d4', marginBottom: '10px' }}>
                32 Unique Warlords
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['blue', 'red', 'purple', 'white', 'green', 'gold', 'orange', 'pink'].map((c, i) => (
                  <img
                    key={c}
                    src={`/images/races/${c}_betta.png`}
                    alt={c}
                    style={{
                      width: '40px', height: '40px', objectFit: 'contain',
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))',
                      animation: `showcase-float ${3 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { value: '8', label: 'Betta Breeds', color: '#06b6d4' },
                { value: '4', label: 'Classes', color: '#a855f7' },
                { value: '32', label: 'Locations', color: '#22d3ee' },
                { value: '8', label: 'Chapters', color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px 6px', borderRadius: '10px',
                  background: 'rgba(10,10,20,0.7)', border: `1px solid ${s.color}20`,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: '700', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CRYPT_FEATURES = [
  { icon: '\u2694\uFE0F', label: 'Hack & Slash Combat', desc: 'Fast melee & ranged attacks with VFX', color: '#ef4444' },
  { icon: '\uD83D\uDDFA\uFE0F', label: 'Procedural Dungeons', desc: 'Unique rooms every run', color: '#a855f7' },
  { icon: '\uD83D\uDC09', label: '6 Enemy Types', desc: 'Slimes to Dragons with scaling AI', color: '#22c55e' },
  { icon: '\uD83D\uDD2B', label: '9 Weapons', desc: 'Daggers, bows, wands & more', color: '#06b6d4' },
  { icon: '\uD83D\uDCA5', label: 'Trap Gauntlets', desc: 'Spikes, lightning & exploding barrels', color: '#f97316' },
  { icon: '\u2728', label: 'Level Progression', desc: 'Gain XP, level up, grow stronger', color: '#fbbf24' },
];

function CryptCrawlersContent({ isMobile }) {
  const [hoveredFeat, setHoveredFeat] = useState(null);

  return (
    <div style={{
      position: 'relative', borderRadius: '24px', overflow: 'hidden',
      border: '2px solid rgba(139,92,246,0.3)',
      boxShadow: '0 20px 60px rgba(139,92,246,0.08), 0 0 80px rgba(139,92,246,0.04)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0a0f1a 0%, #1a0a2e 50%, #0a1a0f 100%)',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.6) 40%, rgba(139,92,246,0.08) 100%)',
        zIndex: 1,
      }} />
      <ParticleCanvas color1="rgba(139, 92, 246, 1)" color2="rgba(34, 197, 94, 1)" count={30} />

      <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '28px 20px' : '48px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '40px', alignItems: 'start' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#a855f7' }}>New Demo</span>
            </div>

            <h3 style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '700',
              color: '#f1f5f9', marginBottom: '8px',
              textShadow: '0 0 40px rgba(139,92,246,0.3)',
            }}>Crypt Crawlers</h3>
            <div style={{
              fontSize: '13px', color: '#a855f7', fontWeight: '600', marginBottom: '16px',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>Top-Down Dungeon Crawler</div>

            <p style={{ fontSize: '15px', color: '#b0bec5', lineHeight: '1.8', marginBottom: '20px', maxWidth: '500px' }}>
              Descend into procedurally generated crypts. Hack through 6 enemy types with 9 weapons, 
              dodge deadly traps, collect XP, and fight deeper through endless dungeon floors. Built 
              entirely with the Game Factory engine.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {['Roguelike', 'Hack & Slash', 'Procedural', 'Pixel Art'].map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: 'rgba(15,15,25,0.6)', color: '#a855f7',
                  border: '1px solid rgba(139,92,246,0.2)',
                  backdropFilter: 'blur(8px)',
                }}>{tag}</span>
              ))}
            </div>

            <button
              onClick={() => window.location.href = '/dungeon-crawler'}
              style={{
                padding: '14px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(139,92,246,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(139,92,246,0.4)'; }}
            >Enter the Crypt</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(10,10,20,0.9), rgba(20,10,30,0.85))',
              border: '1px solid rgba(139,92,246,0.12)',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: '#a855f7', marginBottom: '12px' }}>
                Features
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CRYPT_FEATURES.map((f, i) => (
                  <div
                    key={f.label}
                    onMouseEnter={() => setHoveredFeat(i)}
                    onMouseLeave={() => setHoveredFeat(null)}
                    style={{
                      padding: '10px', borderRadius: '10px',
                      background: hoveredFeat === i ? `${f.color}15` : 'rgba(15,15,25,0.5)',
                      border: `1px solid ${hoveredFeat === i ? `${f.color}40` : 'rgba(255,255,255,0.04)'}`,
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{f.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: f.color, marginBottom: '2px' }}>{f.label}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.4' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
            }}>
              {[
                { value: '9', label: 'Weapons', color: '#8b5cf6' },
                { value: '6', label: 'Enemies', color: '#ef4444' },
                { value: '\u221E', label: 'Floors', color: '#22c55e' },
                { value: '3', label: 'Trap Types', color: '#f97316' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px 6px', borderRadius: '10px',
                  background: 'rgba(10,10,20,0.7)', border: `1px solid ${s.color}20`,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: '700', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameShowcase() {
  const [activeGame, setActiveGame] = useState('gruda');
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, 0.05);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tabs = [
    { id: 'gruda', name: 'GRUDA Wars', color: '#fbbf24' },
    { id: 'betta', name: 'Betta Warlords', color: '#06b6d4' },
    { id: 'crypt', name: 'Crypt Crawlers', color: '#8b5cf6' },
  ];

  return (
    <section
      ref={sectionRef}
      id="showcase"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 100px', position: 'relative' }}
    >
      <style>{`
        @keyframes showcase-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes showcase-fadein { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{
        textAlign: 'center', marginBottom: '20px',
        transform: sectionInView ? 'translateY(0)' : 'translateY(40px)',
        opacity: sectionInView ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px',
          background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)',
          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px', color: '#fbbf24',
        }}>Live Games</div>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 5vw, 48px)',
          marginBottom: '12px', color: '#f1f5f9',
          textShadow: '0 0 40px rgba(251,191,36,0.15)',
        }}>Built With Game Factory</h2>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Powered by the GRUDGE engine
        </p>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px',
        transform: sectionInView ? 'translateY(0)' : 'translateY(30px)',
        opacity: sectionInView ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveGame(t.id)}
            style={{
              padding: '12px 28px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700',
              border: `2px solid ${activeGame === t.id ? t.color : 'rgba(30,41,59,0.5)'}`,
              background: activeGame === t.id ? `${t.color}18` : 'rgba(15,15,25,0.5)',
              color: activeGame === t.id ? t.color : '#64748b',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(8px)',
              boxShadow: activeGame === t.id ? `0 0 20px ${t.color}20` : 'none',
              transform: activeGame === t.id ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div
        key={activeGame}
        style={{
          transform: sectionInView ? 'translateY(0)' : 'translateY(40px)',
          opacity: sectionInView ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          animation: sectionInView ? 'showcase-fadein 0.5s ease-out' : 'none',
        }}
      >
        {activeGame === 'gruda' ? (
          <GrudaContent isMobile={isMobile} />
        ) : activeGame === 'betta' ? (
          <BettaContent isMobile={isMobile} />
        ) : (
          <CryptCrawlersContent isMobile={isMobile} />
        )}
      </div>

      <SpriteShowcase sectionInView={sectionInView} />
    </section>
  );
}
