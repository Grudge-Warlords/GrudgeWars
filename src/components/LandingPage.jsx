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

  const features = [
    { icon: '🧬', title: 'Modular Race System', desc: 'Define any species, faction, or race with stat bonuses, lore, and unique traits' },
    { icon: '⚔️', title: 'Tactical Combat Engine', desc: 'Turn-based battles with speed initiative, positioning, abilities, and boss mechanics' },
    { icon: '🗺️', title: 'World Builder', desc: 'Generate interconnected maps with regions, locations, pathfinding, and terrain types' },
    { icon: '📖', title: 'Deep Lore Generator', desc: 'AI creates factions, history, conflicts, and chapter-driven story progression' },
    { icon: '🎨', title: 'Flexible Art & Style', desc: 'Pixel art, painterly, or minimalist — customize colors, fonts, and visual identity' },
    { icon: '🤖', title: 'AI-Powered Everything', desc: 'Free AI via Puter.js generates races, classes, enemies, lore, dialogue, and more' },
  ];

  const stats = [
    { value: '32+', label: 'Unique Combinations' },
    { value: '8', label: 'Playable Races' },
    { value: '4', label: 'Combat Classes' },
    { value: '∞', label: 'Possible Games' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #020a18 0%, #0a1628 30%, #0d1f3c 60%, #041225 100%)',
      color: '#e2e8f0',
      fontFamily: "'Jost', sans-serif",
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>

      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/images/grudge_logo.png" alt="Grudge Studios" style={{ height: '40px', animation: 'glow 3s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', fontWeight: '700', color: '#fbbf24' }}>Grudge Studios</span>
        </div>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Features</a>
          <a href="#showcase" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Showcase</a>
          <button onClick={() => navigate('/factory')} style={{
            padding: '8px 20px', borderRadius: '8px', border: '1px solid #06b6d4',
            background: 'transparent', color: '#06b6d4', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          }}>Launch Factory</button>
        </nav>
      </header>

      <section style={{
        maxWidth: '1200px', margin: '0 auto', padding: '80px 40px 60px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '3px',
          color: '#06b6d4', marginBottom: '20px',
        }}>Modular RPG Game Engine</div>

        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '700',
          lineHeight: '1.1', marginBottom: '24px',
          background: 'linear-gradient(135deg, #06b6d4, #a855f7, #fbbf24)',
          backgroundSize: '200% auto',
          animation: 'shimmer 4s linear infinite',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Game Factory</h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 22px)', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 16px',
          lineHeight: '1.6',
        }}>
          Build complete RPG games with AI. Define your theme, races, classes, and world — 
          the engine generates everything else.
        </p>
        <p style={{
          fontSize: '14px', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px',
        }}>
          Powered by Grudge Studios. One engine, infinite worlds.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/factory')}
            onMouseEnter={() => setHovered('create')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '16px 40px', borderRadius: '12px', border: 'none',
              background: hovered === 'create'
                ? 'linear-gradient(135deg, #0891b2, #7c3aed)'
                : 'linear-gradient(135deg, #06b6d4, #a855f7)',
              color: '#fff', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(6, 182, 212, 0.3)',
              transform: hovered === 'create' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >Create Your Game</button>

          <button
            onClick={() => navigate('/play')}
            onMouseEnter={() => setHovered('play')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '16px 40px', borderRadius: '12px',
              border: '2px solid #fbbf24',
              background: hovered === 'play' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
              color: '#fbbf24', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              transform: hovered === 'play' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >Play Betta Warlords</button>
        </div>

        <div style={{
          display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '60px', flexWrap: 'wrap',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: '32px', fontWeight: '700',
                color: ['#06b6d4', '#a855f7', '#fbbf24', '#22c55e'][i],
              }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{
        maxWidth: '1100px', margin: '0 auto', padding: '60px 40px',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 4vw, 36px)', textAlign: 'center',
          marginBottom: '12px', color: '#e2e8f0',
        }}>What You Get</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>
          Every system is modular, data-driven, and AI-ready
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b',
              borderRadius: '16px', padding: '28px',
              backdropFilter: 'blur(8px)',
              animation: `slideUp 0.5s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', marginBottom: '8px', color: '#e2e8f0' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="showcase" style={{
        maxWidth: '1100px', margin: '0 auto', padding: '60px 40px',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 4vw, 36px)', textAlign: 'center',
          marginBottom: '12px', color: '#e2e8f0',
        }}>Built With Game Factory</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>
          Our flagship title — proof the engine works
        </p>

        <div
          onClick={() => navigate('/play')}
          onMouseEnter={() => setHovered('betta')}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(168, 85, 247, 0.08))',
            border: hovered === 'betta' ? '2px solid #06b6d4' : '2px solid #1e293b',
            borderRadius: '20px', padding: '40px',
            cursor: 'pointer',
            display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px', alignItems: 'center',
            transform: hovered === 'betta' ? 'translateY(-4px)' : 'none',
            boxShadow: hovered === 'betta' ? '0 8px 40px rgba(6, 182, 212, 0.15)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <img src="/images/logo.png" alt="Betta Warlords" style={{
              maxWidth: '200px', width: '100%',
              animation: 'float 4s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 20px rgba(6, 182, 212, 0.3))',
            }} />
          </div>
          <div>
            <div style={{
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px',
              color: '#06b6d4', marginBottom: '8px',
            }}>Flagship Title</div>
            <h3 style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 3vw, 30px)', marginBottom: '12px',
              color: '#e2e8f0',
            }}>Betta Warlords</h3>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '16px' }}>
              An underwater freshwater adventure RPG with 8 betta fish species, 4 combat classes, 
              tactical multi-hero battles, deep lore driven by the Three Vessels of Magic, 
              and AI-powered hero dialogue. 32 unique Warlord combinations to discover.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['8 Breeds', '4 Classes', 'Tactical Combat', 'AI Dialogue', 'World Map', 'Lore System'].map(tag => (
                <span key={tag} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)',
                }}>{tag}</span>
              ))}
            </div>
            <div style={{ marginTop: '20px', fontSize: '13px', color: '#fbbf24', fontWeight: '600' }}>
              Click to play the example game →
            </div>
          </div>
        </div>
      </section>

      <section style={{
        maxWidth: '800px', margin: '0 auto', padding: '80px 40px', textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 4vw, 36px)',
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
              ? 'linear-gradient(135deg, #0891b2, #7c3aed, #d97706)'
              : 'linear-gradient(135deg, #06b6d4, #a855f7, #fbbf24)',
            backgroundSize: '200% auto',
            color: '#fff', fontSize: '18px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 30px rgba(6, 182, 212, 0.3)',
            transform: hovered === 'cta' ? 'translateY(-2px) scale(1.02)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >Open Game Factory</button>
      </section>

      <footer style={{
        borderTop: '1px solid #1e293b', padding: '30px 40px', textAlign: 'center',
        maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <img src="/images/grudge_logo.png" alt="" style={{ height: '24px', opacity: 0.6 }} />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: '#64748b' }}>Grudge Studios</span>
        </div>
        <p style={{ fontSize: '12px', color: '#475569' }}>
          Game Factory — One engine, infinite worlds. Powered by Puter.js free AI.
        </p>
      </footer>
    </div>
  );
}