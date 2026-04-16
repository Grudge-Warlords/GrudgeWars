import React from 'react';
import { Link } from 'react-router-dom';

const GAMES = [
  { path: '/play', label: 'Betta Warlords RPG', desc: 'Tactical turn-based RPG set in the Sunken Kingdom of Abyssia. 8 breeds, 4 classes, 32 unique Warlords.', color: '#06b6d4', tags: ['RPG', 'Turn-Based', 'cNFT'] },
  { path: '/grudge-box', label: 'GrudgeBox', desc: 'Pixel-art boxing with AI-powered commentary, lore, and campaign mode. 8 fighters, cyberpunk setting.', color: '#ef4444', tags: ['Fighting', 'AI', 'Pixel'] },
  { path: '/shadow-ops', label: 'Shadow Ops', desc: 'Stealth-action tactical combat. Infiltrate, sabotage, and strike from the shadows.', color: '#8b5cf6', tags: ['Stealth', 'Tactical'] },
  { path: '/dungeon-crawler', label: 'Dungeon Crawler', desc: 'Procedural dungeon exploration with voxel enemies, loot, and boss encounters.', color: '#f59e0b', tags: ['Roguelike', 'Dungeon', 'Voxel'] },
  { path: '/grudge-footsies', label: 'Grudge Footsies', desc: 'Precision fighting game focused on spacing, whiff punishing, and fundamentals.', color: '#ec4899', tags: ['Fighting', 'Skill'] },
  { path: '/platform-runner', label: 'Platform Runner', desc: 'Endless platforming through procedurally generated pixel worlds.', color: '#22c55e', tags: ['Platformer', 'Endless'] },
  { path: '/grudge-drive', label: 'Grudge Drive', desc: 'Arcade racing with grudge mechanics — rivals remember and grow stronger.', color: '#f97316', tags: ['Racing', 'Arcade'] },
  { path: '/arena', label: 'Arena', desc: 'PvP battle arena. Pit your Warlords against other players in real-time.', color: '#a855f7', tags: ['PvP', 'Arena', 'Multiplayer'] },
];

export default function Games() {
  return (
    <div style={s.page}>
      <section style={s.header}>
        <h1 style={s.title}>GAMES</h1>
        <p style={s.sub}>All games built on the Grudge engine — play instantly in your browser</p>
      </section>

      <section style={s.grid}>
        {GAMES.map(g => (
          <Link key={g.path} to={g.path} style={{ ...s.card, borderColor: `${g.color}33` }}>
            <div style={{ ...s.cardAccent, background: `linear-gradient(90deg, ${g.color}, transparent)` }} />
            <h2 style={{ ...s.cardTitle, color: g.color }}>{g.label}</h2>
            <p style={s.cardDesc}>{g.desc}</p>
            <div style={s.tagRow}>
              {g.tags.map(t => (
                <span key={t} style={{ ...s.tag, background: `${g.color}18`, color: g.color, borderColor: `${g.color}44` }}>{t}</span>
              ))}
            </div>
            <div style={{ ...s.playBtn, background: `${g.color}22`, color: g.color, borderColor: `${g.color}55` }}>
              Launch Game →
            </div>
          </Link>
        ))}
      </section>

      <section style={s.ecosystem}>
        <p style={s.ecoText}>
          All games connect to{' '}
          <a href="https://grudge-studio.com" target="_blank" rel="noopener noreferrer" style={s.ecoLink}>grudge-studio.com</a>
          {' '}·{' '}
          <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer" style={s.ecoLink}>grudgewarlords.com</a>
          {' '}·{' '}
          <a href="https://gdevelop-assistant.vercel.app" target="_blank" rel="noopener noreferrer" style={s.ecoLink}>GDevelop</a>
        </p>
      </section>
    </div>
  );
}

const s = {
  page: { background: '#050a18', minHeight: '100vh', paddingTop: 56 },
  header: { textAlign: 'center', padding: '60px 24px 40px' },
  title: { fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.5rem)', background: 'linear-gradient(135deg, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 },
  sub: { color: '#94a3b8', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', maxWidth: 600, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, maxWidth: 1300, margin: '0 auto', padding: '0 24px 60px' },
  card: { background: 'rgba(14,22,48,0.7)', border: '1px solid', borderRadius: 20, padding: '32px 28px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '20px 20px 0 0' },
  cardTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.3rem', marginBottom: 10, marginTop: 8 },
  cardDesc: { fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: 16, flex: 1 },
  tagRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  tag: { padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', border: '1px solid' },
  playBtn: { display: 'inline-block', padding: '10px 22px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', border: '1px solid', textAlign: 'center' },
  ecosystem: { textAlign: 'center', padding: '24px 24px 48px' },
  ecoText: { color: '#64748b', fontSize: '0.85rem' },
  ecoLink: { color: '#06b6d4', textDecoration: 'none' },
};
