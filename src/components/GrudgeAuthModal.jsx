import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/apiBase.js';

// ── SVG icons ────────────────────────────────────────────────────────────────
const DiscordSvg = ({ size = 18 }) => (
  <svg width={size} height={Math.round(size * 0.77)} viewBox="0 0 71 55" fill="currentColor">
    <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 010-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
  </svg>
);

const WalletSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
    <path d="M16 2H8L4 7h16l-4-5z"/>
    <circle cx="17" cy="14" r="1" fill="currentColor"/>
  </svg>
);

const GoogleSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const PhoneSvg = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
  </svg>
);

const EyeSvg = ({ size = 16, open = true }) => open ? (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'linear-gradient(160deg, rgba(12,16,28,0.98) 0%, rgba(20,14,30,0.98) 100%)',
    border: '1px solid rgba(212,169,106,0.25)',
    borderRadius: 14,
    padding: '28px 28px 24px',
    width: '100%',
    maxWidth: 380,
    margin: '0 auto',
    color: '#e8dcc8',
    fontFamily: "'Jost', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  goldBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: 'linear-gradient(90deg, #DB6331, #FAAC47, #DB6331)',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#FAAC47',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 1.1,
    textShadow: '0 2px 12px rgba(250,172,71,0.3)',
  },
  subtitle: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 20,
  },
  quickPlay: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 800,
    fontFamily: "'LifeCraft', 'Cinzel', serif",
    letterSpacing: 3,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(192,57,43,0.4)',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 8,
    marginBottom: 8,
  },
  wideGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 14,
  },
  iconBtn: (color, active) => ({
    padding: '10px 4px',
    background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? color + '66' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8,
    color: active ? color : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    fontSize: '0.58rem',
    fontFamily: "'Jost', sans-serif",
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    transition: 'all 0.18s',
    position: 'relative',
  }),
  wideBtn: (color, disabled) => ({
    padding: '10px 12px',
    background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: '0.72rem',
    fontFamily: "'Jost', sans-serif",
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    transition: 'all 0.18s',
    position: 'relative',
  }),
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '2px 0 12px',
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tab: (active) => ({
    padding: '9px',
    background: active ? 'rgba(250,172,71,0.12)' : 'transparent',
    border: 'none',
    color: active ? '#FAAC47' : 'rgba(255,255,255,0.35)',
    fontSize: '0.75rem',
    fontWeight: 700,
    fontFamily: "'Cinzel', serif",
    letterSpacing: 1,
    cursor: 'pointer',
    borderRight: active && !true ? '1px solid rgba(255,255,255,0.08)' : 'none',
    transition: 'all 0.15s',
  }),
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#e8dcc8',
    fontSize: '0.875rem',
    fontFamily: "'Jost', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  signInBtn: (loading) => ({
    width: '100%',
    padding: '11px',
    background: loading ? 'rgba(219,99,49,0.4)' : 'linear-gradient(135deg, #DB6331, #FAAC47)',
    border: 'none',
    borderRadius: 6,
    color: loading ? 'rgba(255,255,255,0.5)' : '#0a0a12',
    fontSize: '0.875rem',
    fontWeight: 800,
    fontFamily: "'Cinzel', serif",
    letterSpacing: 2,
    cursor: loading ? 'wait' : 'pointer',
    marginTop: 4,
    transition: 'all 0.2s',
  }),
  error: {
    color: '#ef4444',
    fontSize: '0.75rem',
    textAlign: 'center',
    padding: '6px 10px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 5,
    marginTop: 4,
  },
  soonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#DB6331',
    color: '#fff',
    fontSize: '0.45rem',
    fontWeight: 800,
    padding: '1px 4px',
    borderRadius: 4,
    letterSpacing: 0.5,
    pointerEvents: 'none',
  },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function GrudgeAuthModal({ onSuccess, inline = false }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [activeProvider, setActiveProvider] = useState(null); // null | 'grudge'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [puterAvailable, setPuterAvailable] = useState(false);

  useEffect(() => {
    const check = () => setPuterAvailable(!!(window.puter?.auth));
    check();
    const t = setTimeout(check, 1500);
    return () => clearTimeout(t);
  }, []);

  // ── Guest / Quick Play ───────────────────────────────────────────────────
  const handleGuest = () => {
    const session = { type: 'guest', username: 'Adventurer', loginTime: Date.now() };
    localStorage.setItem('grudge-session', JSON.stringify(session));
    if (onSuccess) onSuccess(session);
    else window.location.href = '/play';
  };

  // ── Puter ────────────────────────────────────────────────────────────────
  const handlePuter = async () => {
    if (!window.puter?.auth) return;
    setLoading(true); setError('');
    try {
      if (!window.puter.auth.isSignedIn()) {
        await window.puter.auth.signIn();
      }
      const user = await window.puter.auth.getUser();
      let grudgeId = null;
      try {
        const r = await fetch(`${API_BASE}/api/auth/puter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puterUsername: user.username, puterUuid: user.uuid || null }),
        });
        const data = await r.json();
        if (data.sessionToken) localStorage.setItem('grudge_session_token', data.sessionToken);
        grudgeId = data.user?.grudgeId || null;
      } catch {}
      const session = { type: 'puter', username: user.username, grudgeId, loginTime: Date.now() };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      if (onSuccess) onSuccess(session);
      else window.location.href = '/play';
    } catch (err) {
      setError('Puter sign-in cancelled or failed.');
    }
    setLoading(false);
  };

  // ── Phantom Wallet ───────────────────────────────────────────────────────
  const handleWallet = async () => {
    const provider = window.solana || window.phantom?.solana;
    if (!provider?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    setLoading(true); setError('');
    try {
      const { publicKey } = await provider.connect();
      const address = publicKey.toString();
      // Try to link to server; if unavailable, create local wallet session
      let sessionToken = null;
      let grudgeId = null;
      try {
        const r = await fetch(`${API_BASE}/api/auth/wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        if (r.ok) {
          const d = await r.json();
          sessionToken = d.sessionToken || null;
          grudgeId = d.grudgeId || null;
        }
      } catch {}
      if (sessionToken) localStorage.setItem('grudge_session_token', sessionToken);
      const session = {
        type: 'wallet',
        username: `${address.slice(0, 4)}…${address.slice(-4)}`,
        walletAddress: address,
        grudgeId,
        loginTime: Date.now(),
      };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      if (onSuccess) onSuccess(session);
      else window.location.href = '/play';
    } catch (err) {
      setError(err.message?.includes('cancel') ? 'Wallet connection cancelled.' : 'Could not connect wallet.');
    }
    setLoading(false);
  };

  // ── Discord ──────────────────────────────────────────────────────────────
  const handleDiscord = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/discord/login`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Could not get Discord login URL. Try again.');
      }
    } catch {
      setError('Discord server unreachable. Try again.');
    }
    setLoading(false);
  };

  // ── Grudge ID form ───────────────────────────────────────────────────────
  const handleGrudgeSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) { setError('Enter username and password.'); return; }
    setLoading(true); setError('');
    try {
      const endpoint = tab === 'register' ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Authentication failed.'); setLoading(false); return; }
      if (data.sessionToken) localStorage.setItem('grudge_session_token', data.sessionToken);
      const session = {
        type: 'grudge',
        username: data.user?.username || username,
        accountId: data.user?.id,
        grudgeId: data.user?.grudgeId || null,
        loginTime: Date.now(),
      };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      if (onSuccess) onSuccess(session);
      else window.location.href = '/play';
    } catch { setError('Server unreachable. Try again.'); }
    setLoading(false);
  };

  const toggleProvider = (p) => {
    setActiveProvider(prev => prev === p ? null : p);
    setError('');
  };

  const iconBtnHover = (e, color) => {
    e.currentTarget.style.background = `${color}18`;
    e.currentTarget.style.borderColor = `${color}55`;
    e.currentTarget.style.color = color;
  };
  const iconBtnLeave = (e, color, active) => {
    e.currentTarget.style.background = active ? `${color}22` : 'rgba(255,255,255,0.03)';
    e.currentTarget.style.borderColor = active ? `${color}66` : 'rgba(255,255,255,0.08)';
    e.currentTarget.style.color = active ? color : 'rgba(255,255,255,0.5)';
  };

  return (
    <div style={S.card}>
      <div style={S.goldBar} />

      {/* Logo + Title */}
      <div style={{ textAlign: 'center', marginBottom: 4, marginTop: 4 }}>
        <img
          src="/sprites/ui/grudge_logo.png"
          alt="Grudge"
          style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(250,172,71,0.5))' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <div style={S.title}>GRUDGE<br /><span style={{ fontSize: '1rem', letterSpacing: 4 }}>WARLORDS</span></div>
      <div style={S.subtitle}>Your Grudge ID is your Gaming Passport</div>

      {/* Quick Play */}
      <button
        style={S.quickPlay}
        onClick={handleGuest}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(192,57,43,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(192,57,43,0.4)'; }}
      >
        🎮 QUICK PLAY
      </button>

      {/* 4-icon grid: Wallet, Grudge, Discord, Puter */}
      <div style={S.iconGrid}>
        {/* Wallet */}
        <button
          style={S.iconBtn('#f59e0b', false)}
          onClick={handleWallet}
          disabled={loading}
          title="Phantom Wallet"
          onMouseEnter={e => iconBtnHover(e, '#f59e0b')}
          onMouseLeave={e => iconBtnLeave(e, '#f59e0b', false)}
        >
          <WalletSvg size={20} />
          Wallet
        </button>

        {/* Grudge */}
        <button
          style={S.iconBtn('#FAAC47', activeProvider === 'grudge')}
          onClick={() => toggleProvider('grudge')}
          title="Grudge ID"
          onMouseEnter={e => iconBtnHover(e, '#FAAC47')}
          onMouseLeave={e => iconBtnLeave(e, '#FAAC47', activeProvider === 'grudge')}
        >
          <img
            src="/sprites/ui/grudge_logo.png"
            alt="G"
            style={{ width: 20, height: 20, objectFit: 'contain', filter: activeProvider === 'grudge' ? 'none' : 'grayscale(0.4)' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          Grudge
        </button>

        {/* Discord */}
        <button
          style={S.iconBtn('#7289da', false)}
          onClick={handleDiscord}
          disabled={loading}
          title="Discord"
          onMouseEnter={e => iconBtnHover(e, '#7289da')}
          onMouseLeave={e => iconBtnLeave(e, '#7289da', false)}
        >
          <DiscordSvg size={20} />
          Discord
        </button>

        {/* Puter */}
        <button
          style={S.iconBtn(puterAvailable ? '#a78bfa' : '#555', false)}
          onClick={handlePuter}
          disabled={loading || !puterAvailable}
          title={puterAvailable ? 'Sign in with Puter' : 'Puter not available'}
          onMouseEnter={e => puterAvailable && iconBtnHover(e, '#a78bfa')}
          onMouseLeave={e => iconBtnLeave(e, '#a78bfa', false)}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4m0 4h.01"/>
          </svg>
          Puter
        </button>
      </div>

      {/* Wide grid: Google, GitHub */}
      <div style={S.wideGrid}>
        <button
          style={S.wideBtn('#4285F4', true)}
          disabled
          title="Coming soon"
        >
          <GoogleSvg size={16} />
          Google
          <span style={S.soonBadge}>SOON</span>
        </button>
        <button
          style={S.wideBtn('#fff', true)}
          disabled
          title="Coming soon"
        >
          <GithubSvg size={16} />
          GitHub
          <span style={S.soonBadge}>SOON</span>
        </button>
      </div>

      {/* Divider */}
      <div style={S.divider}>
        <div style={S.divLine} />
        OR CONTINUE WITH
        <div style={S.divLine} />
      </div>

      {/* Grudge form — shown when Grudge provider active */}
      {activeProvider === 'grudge' && (
        <form onSubmit={handleGrudgeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={S.tabRow}>
            <button type="button" style={S.tab(tab === 'login')} onClick={() => { setTab('login'); setError(''); }}>LOGIN</button>
            <button type="button" style={S.tab(tab === 'register')} onClick={() => { setTab('register'); setError(''); }}>REGISTER</button>
          </div>
          <input
            style={S.input}
            type="text"
            placeholder="Username / Email / Grudge ID"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete={tab === 'register' ? 'username' : 'username'}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(250,172,71,0.5)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 40 }}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(250,172,71,0.5)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2 }}
            >
              <EyeSvg size={15} open={showPass} />
            </button>
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" style={S.signInBtn(loading)} disabled={loading}>
            {loading ? 'Connecting…' : tab === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>
      )}

      {/* Default form (non-Grudge) — login/register shortcut */}
      {activeProvider !== 'grudge' && (
        <form onSubmit={handleGrudgeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={S.tabRow}>
            <button type="button" style={S.tab(tab === 'login')} onClick={() => { setTab('login'); setActiveProvider('grudge'); setError(''); }}>LOGIN</button>
            <button type="button" style={S.tab(tab === 'register')} onClick={() => { setTab('register'); setActiveProvider('grudge'); setError(''); }}>REGISTER</button>
          </div>
          <input
            style={S.input}
            type="text"
            placeholder="Username / Email / Grudge ID"
            value={username}
            onChange={e => { setUsername(e.target.value); setActiveProvider('grudge'); }}
            autoComplete="username"
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(250,172,71,0.5)'; setActiveProvider('grudge'); }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...S.input, paddingRight: 40 }}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setActiveProvider('grudge'); }}
              autoComplete="current-password"
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(250,172,71,0.5)'; setActiveProvider('grudge'); }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2 }}
            >
              <EyeSvg size={15} open={showPass} />
            </button>
          </div>
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" style={S.signInBtn(loading)} disabled={loading}>
            {loading ? 'Connecting…' : tab === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>
      )}

      {/* Phone divider */}
      <div style={{ ...S.divider, margin: '14px 0 10px' }}>
        <div style={S.divLine} />
        OR
        <div style={S.divLine} />
      </div>

      {/* Phone row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ ...S.input, flex: 1, opacity: 0.4, cursor: 'not-allowed' }}
          type="tel"
          placeholder="Phone Number (coming soon)"
          disabled
        />
        <button
          style={{ ...S.wideBtn('#10b981', true), padding: '10px 14px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 6 }}
          disabled
        >
          <PhoneSvg size={14} />
          Send Code
        </button>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 18, textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', letterSpacing: 1 }}>
        YOUR GRUDGE ID WORKS ACROSS ALL GRUDGE GAMES
      </div>
    </div>
  );
}
