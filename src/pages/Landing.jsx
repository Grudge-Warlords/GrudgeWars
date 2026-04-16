import React from 'react';
import { Link } from 'react-router-dom';

const GAMES = [
  { path: '/play', label: 'Betta Warlords RPG', desc: 'Tactical turn-based RPG in the Sunken Kingdom of Abyssia', color: '#06b6d4' },
  { path: '/grudge-box', label: 'GrudgeBox', desc: 'Fast-paced boxing with AI commentary', color: '#ef4444' },
  { path: '/shadow-ops', label: 'Shadow Ops', desc: 'Stealth-action tactical combat', color: '#8b5cf6' },
  { path: '/dungeon-crawler', label: 'Dungeon Crawler', desc: 'Procedural dungeon exploration', color: '#f59e0b' },
  { path: '/grudge-footsies', label: 'Grudge Footsies', desc: 'Precision fighting game fundamentals', color: '#ec4899' },
  { path: '/platform-runner', label: 'Platform Runner', desc: 'Endless run through pixel worlds', color: '#22c55e' },
  { path: '/grudge-drive', label: 'Grudge Drive', desc: 'Arcade racing with grudge mechanics', color: '#f97316' },
  { path: '/arena', label: 'Arena', desc: 'PvP battle arena', color: '#a855f7' },
];

const ECOSYSTEM = [
  { label: 'Grudge Studio', url: 'https://grudge-studio.com', desc: 'Backend, API, object storage, and platform hub for all Grudge services', color: '#22d3ee' },
  { label: 'Grudge Warlords', url: 'https://grudgewarlords.com', desc: 'The flagship Grudge game — characters, islands, professions, and cNFT minting', color: '#ef4444' },
  { label: 'GDevelop Assistant', url: 'https://gdevelop-assistant.vercel.app', desc: 'Game launcher, editor, and Grudge services manager', color: '#f59e0b' },
  { label: 'Grudge AI Hub', url: 'https://ai.grudge-studio.com', desc: 'Legion AI management and integrations for Grudge Studio', color: '#a855f7' },
];

export default function Landing() {
  return (
    <div style={s.page}>
      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroContent}>
          <img src="/grudge-logo.png" alt="Grudge Studio" style={s.heroLogo} />
          <h1 style={s.heroTitle}>RPG MAKER STUDIO</h1>
          <p style={s.heroTagline}>
            The Grudge Studio game creation engine — build, play, and deploy games
            powered by the Grudge ecosystem.
          </p>
          <div style={s.heroBadges}>
            <span style={{ ...s.badge, borderColor: '#06b6d4', color: '#06b6d4', background: 'rgba(6,182,212,0.12)' }}>Game Engine</span>
            <span style={{ ...s.badge, borderColor: '#a855f7', color: '#a855f7', background: 'rgba(168,85,247,0.12)' }}>Modular</span>
            <span style={{ ...s.badge, borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}>GBuX Powered</span>
            <span style={{ ...s.badge, borderColor: '#22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.12)' }}>Open Platform</span>
          </div>
          <div style={s.ctaRow}>
            <Link to="/games" style={s.btnPrimary}>Browse Games</Link>
            <Link to="/play" style={s.btnSecondary}>Play Betta Warlords</Link>
            <a href="https://grudge-studio.com" target="_blank" rel="noopener noreferrer" style={s.btnGold}>Grudge Studio</a>
          </div>
        </div>
      </section>

      {/* Games Preview */}
      <section style={s.section}>
        <h2 style={s.sTitle}>Games</h2>
        <p style={s.sSub}>Play instantly in your browser — all built on the Grudge engine</p>
        <div style={s.gamesGrid}>
          {GAMES.map(g => (
            <Link key={g.path} to={g.path} style={{ ...s.gameCard, borderColor: `${g.color}33` }}>
              <h3 style={{ ...s.gameCardTitle, color: g.color }}>{g.label}</h3>
              <p style={s.gameCardDesc}>{g.desc}</p>
              <span style={{ ...s.playTag, background: `${g.color}22`, color: g.color, borderColor: `${g.color}55` }}>Play →</span>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/games" style={s.btnSecondary}>View All Games</Link>
        </div>
      </section>

      <div style={s.divider} />

      {/* Ecosystem */}
      <section style={s.section}>
        <h2 style={s.sTitle}>Grudge Ecosystem</h2>
        <p style={s.sSub}>RPG Maker Studio connects to the full Grudge Studio platform</p>
        <div style={s.ecoGrid}>
          {ECOSYSTEM.map(e => (
            <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer"
              style={{ ...s.ecoCard, borderColor: `${e.color}33` }}>
              <h4 style={{ ...s.ecoTitle, color: e.color }}>{e.label}</h4>
              <p style={s.ecoDesc}>{e.desc}</p>
              <span style={{ ...s.ecoLink, color: e.color }}>Visit →</span>
            </a>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* Footer */}
      <footer style={s.footer}>
        <img src="/grudge-logo.png" alt="Grudge Studio" style={s.footerLogo} />
        <p style={s.footerBrand}>Grudge Studios</p>
        <p style={s.footerSub}>RPG Maker Studio — Game Creation Engine</p>
        <div style={s.footerLinks}>
          <Link to="/games" style={s.footerLink}>Games</Link>
          <a href="https://grudgewarlords.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Grudge Warlords</a>
          <a href="https://grudge-studio.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Grudge Studio</a>
          <a href="https://gdevelop-assistant.vercel.app" target="_blank" rel="noopener noreferrer" style={s.footerLink}>GDevelop</a>
          <a href="https://ai.grudge-studio.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>AI Hub</a>
          <Link to="/account" style={s.footerLink}>Account</Link>
        </div>
        <p style={s.footerCopy}>© 2026 Grudge Studios — Racalvin The Pirate King. All rights reserved.</p>
      </footer>
    </div>
  );
}

const s = {
  page: { background: '#050a18', minHeight: '100vh' },
  hero: { position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', padding: '100px 24px 60px' },
  heroBg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(168,85,247,0.14) 0%, transparent 50%), linear-gradient(180deg, #050a18 0%, #0a1128 50%, #0e1630 100%)' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: 900 },
  heroLogo: { width: 120, marginBottom: 24, filter: 'drop-shadow(0 0 40px rgba(6,182,212,0.5))' },
  heroTitle: { fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 'clamp(2.5rem, 7vw, 5rem)', background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 40%, #ef4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 20, letterSpacing: 3 },
  heroTagline: { fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', color: '#94a3b8', marginBottom: 32, lineHeight: 1.7 },
  heroBadges: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 },
  badge: { padding: '8px 20px', borderRadius: 24, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', border: '1px solid' },
  ctaRow: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: 10, fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1rem', textDecoration: 'none', background: 'linear-gradient(135deg, #06b6d4, #a855f7)', color: '#fff', boxShadow: '0 6px 24px rgba(6,182,212,0.45)', letterSpacing: '1.5px' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: 10, fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.4)', letterSpacing: '1.5px' },
  btnGold: { display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: 10, fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1rem', textDecoration: 'none', background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#000', boxShadow: '0 6px 24px rgba(245,158,11,0.45)', letterSpacing: '1.5px' },
  section: { padding: '80px 24px', maxWidth: 1300, margin: '0 auto' },
  sTitle: { textAlign: 'center', fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 14, background: 'linear-gradient(135deg, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sSub: { textAlign: 'center', color: '#94a3b8', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', marginBottom: 48, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' },
  gamesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  gameCard: { background: 'rgba(14,22,48,0.7)', border: '1px solid', borderRadius: 16, padding: '28px 24px', textDecoration: 'none', display: 'block' },
  gameCardTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.15rem', marginBottom: 8 },
  gameCardDesc: { fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 },
  playTag: { display: 'inline-block', padding: '4px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.5px', border: '1px solid' },
  ecoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  ecoCard: { background: 'rgba(14,22,48,0.6)', border: '1px solid', borderRadius: 16, padding: '28px 24px', textDecoration: 'none', display: 'block' },
  ecoTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.1rem', marginBottom: 8 },
  ecoDesc: { fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 },
  ecoLink: { fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' },
  divider: { height: 1, maxWidth: 700, margin: '0 auto', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)' },
  footer: { textAlign: 'center', padding: '60px 24px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerLogo: { width: 100, marginBottom: 16, filter: 'drop-shadow(0 0 12px rgba(6,182,212,0.3))' },
  footerBrand: { fontFamily: "'Cinzel', serif", fontSize: '1.05rem', color: '#e2e8f0', marginBottom: 4 },
  footerSub: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 },
  footerLinks: { display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 },
  footerLink: { color: '#06b6d4', textDecoration: 'none', fontSize: '0.85rem' },
  footerCopy: { fontSize: '0.72rem', color: 'rgba(148,163,184,0.5)' },
};
