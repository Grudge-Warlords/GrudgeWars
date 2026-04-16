import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuth';

const GAMES = [
  { path: '/games', label: 'Games' },
  { path: '/play', label: 'RPG' },
  { path: '/grudge-box', label: 'GrudgeBox' },
  { path: '/shadow-ops', label: 'ShadowOps' },
  { path: '/dungeon-crawler', label: 'Dungeon' },
  { path: '/grudge-footsies', label: 'Footsies' },
  { path: '/platform-runner', label: 'Runner' },
  { path: '/grudge-drive', label: 'Drive' },
  { path: '/arena', label: 'Arena' },
];

const ECOSYSTEM_LINKS = [
  { url: 'https://grudgewarlords.com', label: 'Warlords' },
  { url: 'https://grudge-studio.com', label: 'Studio' },
  { url: 'https://gdevelop-assistant.vercel.app', label: 'GDevelop' },
];

export default function NavBar() {
  const location = useLocation();
  const { user, isLoggedIn, gbuxBalance, loginGuest, loginDiscord, logout } = useAuthStore();

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <img src="/grudge-logo.png" alt="Grudge" style={styles.logo} />
        <span style={styles.brandText}>GRUDGE</span>
      </Link>

      <div style={styles.games}>
        {GAMES.map(g => (
          <Link key={g.path} to={g.path}
            style={{ ...styles.gameLink, ...(location.pathname === g.path ? styles.activeLink : {}) }}>
            {g.label}
          </Link>
        ))}
      </div>

      <div style={styles.ecoLinks}>
        {ECOSYSTEM_LINKS.map(e => (
          <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" style={styles.ecoLink}>{e.label}</a>
        ))}
      </div>

      <div style={styles.right}>
        {isLoggedIn && (
          <span style={styles.gbux}>
            <span style={styles.gbuxIcon}>G</span>
            {gbuxBalance.toLocaleString()}
          </span>
        )}
        {isLoggedIn ? (
          <div style={styles.userArea}>
            <Link to="/account" style={styles.username}>{user?.username || 'Player'}</Link>
            <button onClick={logout} style={styles.logoutBtn}>✕</button>
          </div>
        ) : (
          <div style={styles.authBtns}>
            <button onClick={loginGuest} style={styles.playBtn}>Play Free</button>
            <button onClick={loginDiscord} style={styles.discordBtn}>Discord</button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56,
    background: 'rgba(5,10,24,0.92)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
  logo: { height: 32, filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.3))' },
  brandText: {
    fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: '1.1rem',
    background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '0.15em',
  },
  games: {
    display: 'flex', gap: 4, flex: 1, justifyContent: 'center', overflowX: 'auto',
  },
  gameLink: {
    color: '#94a3b8', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase', padding: '6px 10px',
    borderRadius: 6, transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  activeLink: {
    background: 'rgba(6,182,212,0.15)', color: '#22d3ee',
    border: '1px solid rgba(6,182,212,0.3)',
  },
  ecoLinks: {
    display: 'flex', gap: 8, alignItems: 'center',
  },
  ecoLink: {
    color: '#64748b', textDecoration: 'none', fontSize: '0.7rem', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase', padding: '4px 8px',
    borderRadius: 4, transition: 'color 0.2s',
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  gbux: {
    display: 'flex', alignItems: 'center', gap: 4,
    color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem',
  },
  gbuxIcon: {
    width: 18, height: 18, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    color: '#000', fontSize: '0.65rem', fontWeight: 900,
  },
  userArea: { display: 'flex', alignItems: 'center', gap: 8 },
  username: {
    color: '#22d3ee', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
  },
  logoutBtn: {
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    fontSize: '0.9rem', padding: 4,
  },
  authBtns: { display: 'flex', gap: 6 },
  playBtn: {
    background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
    color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6,
    fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '0.75rem',
    cursor: 'pointer', letterSpacing: '0.5px',
  },
  discordBtn: {
    background: 'rgba(88,101,242,0.2)', color: '#7289da', border: '1px solid rgba(88,101,242,0.3)',
    padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem',
    fontWeight: 600, cursor: 'pointer',
  },
};
