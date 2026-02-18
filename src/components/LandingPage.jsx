import React, { useState, useEffect } from 'react';

export default function LandingPage() {
  const [hovered, setHovered] = useState(null);
  const [loaded, setLoaded] = useState(false);

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

  const features = [
    { icon: '🧬', title: 'Modular Race System', desc: 'Define any species, faction, or race with stat bonuses, lore, and unique traits' },
    { icon: '⚔️', title: 'Tactical Combat Engine', desc: 'Turn-based battles with speed initiative, positioning, abilities, and boss mechanics' },
    { icon: '🗺️', title: 'World Builder', desc: 'Generate interconnected maps with regions, locations, pathfinding, and terrain types' },
    { icon: '📖', title: 'Deep Lore Generator', desc: 'AI creates factions, history, conflicts, and chapter-driven story progression' },
    { icon: '🎨', title: 'Flexible Art & Style', desc: 'Pixel art, painterly, or minimalist — customize colors, fonts, and visual identity' },
    { icon: '🤖', title: 'AI-Powered Everything', desc: 'Free AI via Puter.js generates races, classes, enemies, lore, dialogue, and more' },
  ];

  const stats = [
    { value: '6', label: 'AI Agents', color: '#fbbf24' },
    { value: '32+', label: 'Warlord Combos', color: '#06b6d4' },
    { value: '∞', label: 'Free AI Calls', color: '#a855f7' },
    { value: '∞', label: 'Possible Games', color: '#22c55e' },
  ];

  const showcaseGames = [
    {
      id: 'betta',
      badge: 'Flagship Title',
      badgeColor: '#06b6d4',
      name: 'Betta Warlords',
      desc: 'An underwater freshwater adventure RPG with 8 betta fish species, 4 combat classes, tactical multi-hero battles, deep lore driven by the Three Vessels of Magic, and AI-powered hero dialogue.',
      tags: ['8 Breeds', '4 Classes', 'Tactical Combat', 'AI Dialogue', 'World Map', 'Lore System'],
      tagColor: '#06b6d4',
      logo: '/images/logo.png',
      action: () => navigate('/play'),
      actionLabel: 'Play Now',
      liveUrl: 'https://grudge-rpg.replit.app',
      gradient: 'rgba(6, 182, 212, 0.06), rgba(168, 85, 247, 0.06)',
      gradientHover: 'rgba(6, 182, 212, 0.12), rgba(168, 85, 247, 0.12)',
      borderHover: 'rgba(6, 182, 212, 0.5)',
    },
    {
      id: 'gruda',
      badge: 'Native Platform',
      badgeColor: '#fbbf24',
      name: 'GRUDA Wars',
      desc: 'The full GRUDGE Warlords platform experience. Arena PvP with 3v3 tactical battles, ELO rating, AI agent teams, crafting system with 5 professions, island territories, and cNFT character minting on Solana.',
      tags: ['Arena PvP', 'AI Agents', 'Crafting', 'cNFTs', 'ELO Rating', 'Territories'],
      tagColor: '#fbbf24',
      logo: '/images/grudge_logo.png',
      action: () => openExternal('https://grudgestudio.com'),
      actionLabel: 'Visit Platform',
      liveUrl: 'https://grudgestudio.com',
      gradient: 'rgba(251, 191, 36, 0.04), rgba(217, 119, 6, 0.06)',
      gradientHover: 'rgba(251, 191, 36, 0.1), rgba(217, 119, 6, 0.1)',
      borderHover: 'rgba(251, 191, 36, 0.5)',
    },
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
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-140px) translateX(40px); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.05); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(251, 191, 36, 0.15); }
          50% { border-color: rgba(251, 191, 36, 0.35); }
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

        {[...Array(15)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 4 === 0 ? '4px' : '2px',
            height: i % 4 === 0 ? '4px' : '2px',
            borderRadius: '50%',
            background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#a855f7' : '#06b6d4',
            left: `${5 + (i * 6.2)}%`,
            bottom: `${8 + (i % 6) * 13}%`,
            animation: `particleDrift ${3.5 + (i % 4) * 1.5}s ease-in-out infinite ${i * 0.5}s`,
            opacity: 0.5,
            zIndex: 2,
          }} />
        ))}

        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%',
          position: 'relative', zIndex: 10,
          boxSizing: 'border-box',
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => openExternal('https://grudgestudio.com')}
          >
            <img src="/images/grudge_logo.png" alt="Grudge Studios" style={{ height: '44px', animation: 'glow 3s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', fontWeight: '700', color: '#fbbf24' }}>Grudge Studio</span>
          </div>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#e2e8f0'}
              onMouseLeave={e => e.target.style.color = '#94a3b8'}
            >Features</a>
            <a href="#showcase" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#e2e8f0'}
              onMouseLeave={e => e.target.style.color = '#94a3b8'}
            >Showcase</a>
            <button onClick={() => navigate('/factory')} style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid #fbbf24',
              background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(251, 191, 36, 0.2)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(251, 191, 36, 0.08)'; }}
            >Launch Factory</button>
          </nav>
        </header>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '40px 40px 80px', position: 'relative', zIndex: 10,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '4px',
            color: '#fbbf24', marginBottom: '20px',
            animation: 'slideUp 0.6s ease both',
          }}>AI-Powered RPG Game Engine</div>

          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(42px, 7vw, 84px)', fontWeight: '700',
            lineHeight: '1.1', marginBottom: '24px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706, #fbbf24)',
            backgroundSize: '300% auto',
            animation: 'shimmer 5s linear infinite',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.25))',
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
            Powered by <span style={{ color: '#fbbf24', fontWeight: '600' }}>Grudge Studio</span>. One engine, infinite worlds.
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
          </div>

          <div style={{
            display: 'flex', gap: '48px', justifyContent: 'center', marginTop: '60px', flexWrap: 'wrap',
            animation: 'slideUp 0.6s ease 0.5s both',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
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
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 4vw, 38px)', textAlign: 'center',
          marginBottom: '12px', color: '#e2e8f0',
        }}>What You Get</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '48px', fontSize: '15px' }}>
          Every system is modular, data-driven, and AI-ready
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(15, 15, 25, 0.8)',
              border: '1px solid rgba(251, 191, 36, 0.08)',
              borderRadius: '16px', padding: '28px',
              backdropFilter: 'blur(12px)',
              animation: `slideUp 0.5s ease ${i * 0.1}s both`,
              transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(251, 191, 36, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', marginBottom: '8px', color: '#e2e8f0' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="showcase" style={{
        maxWidth: '1100px', margin: '0 auto', padding: '60px 40px 80px',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 4vw, 38px)', textAlign: 'center',
          marginBottom: '12px', color: '#e2e8f0',
        }}>Built With Game Factory</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '48px', fontSize: '15px' }}>
          Live games powered by the GRUDGE engine
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {showcaseGames.map((game) => (
            <div
              key={game.id}
              onMouseEnter={() => setHovered(game.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: `linear-gradient(135deg, ${hovered === game.id ? game.gradientHover : game.gradient})`,
                border: `2px solid ${hovered === game.id ? game.borderHover : 'rgba(30, 41, 59, 0.6)'}`,
                borderRadius: '20px', padding: '36px',
                display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '36px', alignItems: 'center',
                transform: hovered === game.id ? 'translateY(-4px)' : 'none',
                boxShadow: hovered === game.id ? `0 8px 40px ${game.borderHover.replace('0.5', '0.12')}` : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ textAlign: 'center', minWidth: '140px' }}>
                <img src={game.logo} alt={game.name} style={{
                  maxWidth: '120px', width: '100%',
                  animation: 'float 4s ease-in-out infinite',
                  filter: `drop-shadow(0 4px 20px ${game.tagColor}44)`,
                }} />
              </div>
              <div>
                <div style={{
                  display: 'inline-block',
                  fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px',
                  color: '#0a0a0f', background: game.badgeColor,
                  padding: '3px 10px', borderRadius: '4px', marginBottom: '10px',
                }}>{game.badge}</div>
                <h3 style={{
                  fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 3vw, 28px)', marginBottom: '10px',
                  color: '#e2e8f0',
                }}>{game.name}</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '14px', maxWidth: '600px' }}>
                  {game.desc}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {game.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600',
                      background: `${game.tagColor}18`, color: game.tagColor, border: `1px solid ${game.tagColor}30`,
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); game.action(); }}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      background: game.badgeColor, color: '#0a0a0f',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.filter = 'brightness(1.15)'}
                    onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
                  >{game.actionLabel}</button>
                  <a
                    href={game.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '12px', color: '#64748b', textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.color = game.tagColor}
                    onMouseLeave={e => e.target.style.color = '#64748b'}
                  >{game.liveUrl.replace('https://', '')} ↗</a>
                </div>
              </div>
            </div>
          ))}
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
          <img src="/images/grudge_logo.png" alt="" style={{ height: '28px', opacity: 0.7 }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: '#fbbf2488' }}>Grudge Studio</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '12px' }}>
          <a href="https://grudgestudio.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fbbf24'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >grudgestudio.com</a>
          <a href="https://grudge-rpg.replit.app" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#06b6d4'}
            onMouseLeave={e => e.target.style.color = '#475569'}
          >grudge-rpg.replit.app</a>
        </div>
        <p style={{ fontSize: '11px', color: '#374151' }}>
          Game Factory — One engine, infinite worlds. Powered by Puter.js free AI.
        </p>
      </footer>
    </div>
  );
}
