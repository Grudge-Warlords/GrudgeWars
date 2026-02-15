import React, { useState, useEffect, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';
import useIsMobile from '../hooks/useIsMobile';
import { puterAuth, isPuterAvailable } from '../utils/puterService';

function Bubbles() {
  const bubbles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 14,
      duration: 6 + Math.random() * 12,
      delay: Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.3,
      wobble: 10 + Math.random() * 30,
    })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(100vh) translateX(0) scale(0.4); opacity: 0; }
          10% { opacity: var(--bubble-opacity); }
          50% { transform: translateY(50vh) translateX(var(--wobble)) scale(0.8); }
          90% { opacity: var(--bubble-opacity); }
          100% { transform: translateY(-20px) translateX(calc(var(--wobble) * -0.5)) scale(1); opacity: 0; }
        }
      `}</style>
      {bubbles.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          left: `${b.left}%`,
          bottom: -20,
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, rgba(34,211,238,${b.opacity + 0.15}), rgba(34,211,238,${b.opacity * 0.5}))`,
          border: `1px solid rgba(34,211,238,${b.opacity * 0.6})`,
          boxShadow: `0 0 ${b.size * 0.5}px rgba(34,211,238,${b.opacity * 0.3}), inset 0 -${b.size * 0.15}px ${b.size * 0.3}px rgba(255,255,255,0.1)`,
          animation: `bubbleRise ${b.duration}s ease-in-out ${b.delay}s infinite`,
          '--wobble': `${b.wobble}px`,
          '--bubble-opacity': b.opacity,
        }} />
      ))}
    </div>
  );
}

export default function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const [fadeClass, setFadeClass] = useState(false);
  const isMobile = useIsMobile();
  const [puterLoading, setPuterLoading] = useState(false);

  useEffect(() => {
    setBgm('intro');
    const t1 = setTimeout(() => setFadeClass(true), 200);
    return () => clearTimeout(t1);
  }, []);

  const handleLogin = (method) => {
    if (method === 'discord') {
      handleDiscordLogin();
      return;
    }
    const session = {
      type: method,
      username: method === 'guest' ? 'Adventurer' : null,
      loginTime: Date.now(),
    };
    localStorage.setItem('grudge-session', JSON.stringify(session));
    setScreen('intro');
  };

  const handleDiscordLogin = async () => {
    try {
      const res = await fetch('/api/discord/login');
      const data = await res.json();
      if (data.state) sessionStorage.setItem('discord_oauth_state', data.state);
      if (!data.url) return;

      const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

      if (isPWA) {
        const w = 500, h = 700;
        const left = (screen.width - w) / 2;
        const top = (screen.height - h) / 2;
        const popup = window.open(data.url, 'discord_auth', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);

        const onMessage = (e) => {
          if (e.data?.type === 'discord-auth-success' && e.data?.session) {
            window.removeEventListener('message', onMessage);
            clearInterval(pollTimer);
            setScreen('intro');
          }
        };
        window.addEventListener('message', onMessage);

        const pollTimer = setInterval(() => {
          try {
            if (!popup || popup.closed) {
              clearInterval(pollTimer);
              window.removeEventListener('message', onMessage);
              const session = localStorage.getItem('grudge-session');
              if (session) {
                const parsed = JSON.parse(session);
                if (parsed.type === 'discord' && parsed.loginTime > Date.now() - 120000) {
                  setScreen('intro');
                }
              }
              return;
            }
          } catch (e) {}
        }, 500);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Discord login failed:', err);
    }
  };

  const handlePuterLogin = async () => {
    if (puterLoading) return;
    setPuterLoading(true);
    try {
      await puterAuth.signIn();
      const user = await puterAuth.getUser();
      const session = {
        type: 'puter',
        username: user?.username || 'Puter User',
        puterUser: user,
        loginTime: Date.now(),
      };
      localStorage.setItem('grudge-session', JSON.stringify(session));
      const cloudLoadGame = useGameStore.getState().cloudLoadGame;
      if (cloudLoadGame) {
        const loaded = await cloudLoadGame();
        if (loaded) {
          console.log('[Puter] Restored cloud save');
        }
      }
      setScreen('intro');
    } catch (err) {
      console.error('Puter sign-in failed:', err);
    } finally {
      setPuterLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: 0,
      opacity: fadeClass ? 1 : 0,
      transition: 'opacity 1.5s ease',
      backgroundImage: 'url(/backgrounds/main_menu_bg.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(4,18,37,0.1) 0%, rgba(4,18,37,0.15) 40%, rgba(4,18,37,0.4) 70%, rgba(4,18,37,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      <Bubbles />

      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center',
        maxWidth: 400, padding: '0 20px', width: '100%',
        marginTop: 'auto', marginBottom: isMobile ? '10%' : '8%',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
          <MenuButton
            label="LOGIN WITH DISCORD"
            onClick={() => handleLogin('discord')}
            primary
            isMobile={isMobile}
            icon={
              <svg width="20" height="16" viewBox="0 0 71 55" fill="currentColor" style={{ marginRight: 10, flexShrink: 0 }}>
                <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
              </svg>
            }
            customStyle={{
              background: 'linear-gradient(135deg, rgba(88,101,242,0.35), rgba(88,101,242,0.15))',
              border: '2px solid rgba(88,101,242,0.6)',
              color: '#c4caff',
            }}
            customHoverStyle={{
              background: 'rgba(88,101,242,0.45)',
              boxShadow: '0 0 30px rgba(88,101,242,0.3)',
            }}
          />

          {isPuterAvailable() && (
            <MenuButton
              label={puterLoading ? 'SIGNING IN...' : 'SIGN IN WITH PUTER'}
              onClick={handlePuterLogin}
              isMobile={isMobile}
              icon={<span style={{ marginRight: 10, fontSize: 18, flexShrink: 0 }}>&#9729;</span>}
              customStyle={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1))',
                border: '2px solid rgba(34,197,94,0.5)',
                color: '#86efac',
              }}
              customHoverStyle={{
                background: 'rgba(34,197,94,0.35)',
                boxShadow: '0 0 30px rgba(34,197,94,0.3)',
              }}
            />
          )}

          <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          <button
            onClick={() => handleLogin('guest')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(176,190,197,0.7)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontFamily: "'Cinzel', serif",
              letterSpacing: 2,
              cursor: 'pointer',
              padding: '8px 16px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.textShadow = '0 0 10px rgba(34,211,238,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(176,190,197,0.7)'; e.currentTarget.style.textShadow = 'none'; }}
          >
            PLAY AS GUEST
          </button>
        </div>

        <div style={{
          color: 'var(--muted)', fontSize: '0.6rem', marginTop: 16, opacity: 0.5,
          letterSpacing: 1,
        }}>
          &copy; 2026 Grudge Studio
          {isPuterAvailable() && (
            <span> &bull; <a href="https://developer.puter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', opacity: 0.7 }}>Powered by Puter</a></span>
          )}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: isMobile ? 12 : 20,
        left: isMobile ? 12 : 20,
        zIndex: 2,
      }}>
        <SideButton
          label="GRUDGE STUDIO"
          onClick={() => window.open('https://grudgestudio.com', '_blank')}
          isMobile={isMobile}
          icon={<EssentialIcon name="Home" size={14} style={{ marginRight: 8, flexShrink: 0 }} />}
        />
      </div>
    </div>
  );
}

function MenuButton({ label, onClick, primary, icon, isMobile, customStyle, customHoverStyle }) {
  const [hovered, setHovered] = useState(false);

  const defaultBg = hovered
    ? 'rgba(34,211,238,0.3)'
    : 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.08))';

  const baseStyle = {
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: defaultBg,
    border: '2px solid var(--accent)',
    borderRadius: 8,
    padding: isMobile ? '14px 20px' : '14px 50px',
    color: 'var(--accent)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    letterSpacing: 3,
    transition: 'all 0.3s',
    width: isMobile ? '100%' : 320,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hovered ? '0 0 30px rgba(34,211,238,0.3)' : 'none',
    ...customStyle,
    ...(hovered ? customHoverStyle : {}),
  };

  return (
    <button
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}{label}
    </button>
  );
}

function SideButton({ label, onClick, icon, isMobile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: hovered ? 'rgba(4,18,37,0.8)' : 'rgba(4,18,37,0.55)',
        border: hovered ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: isMobile ? '8px 14px' : '8px 18px',
        color: hovered ? '#22d3ee' : '#b0bec5',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Cinzel', serif",
        letterSpacing: 1.5,
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        boxShadow: hovered ? '0 0 12px rgba(34,211,238,0.15)' : 'none',
      }}
    >
      {icon}{label}
    </button>
  );
}
