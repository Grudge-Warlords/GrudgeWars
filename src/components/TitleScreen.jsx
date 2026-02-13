import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { setBgm } from '../utils/audioManager';
import { EssentialIcon } from '../data/uiSprites';
import useIsMobile from '../hooks/useIsMobile';
import { puterAuth, isPuterAvailable } from '../utils/puterService';

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
    const session = {
      type: method,
      username: method === 'guest' ? 'Adventurer' : null,
      loginTime: Date.now(),
    };
    localStorage.setItem('grudge-session', JSON.stringify(session));
    setScreen('intro');
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
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          maxWidth: 400, padding: '0 20px',
          marginTop: 'auto', marginBottom: isMobile ? '15%' : '10%',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <MenuButton
              label="DIVE IN"
              onClick={() => handleLogin('guest')}
              primary
              isMobile={isMobile}
              icon={<EssentialIcon name="Gamepad" size={20} style={{ marginRight: 8 }} />}
            />

            <MenuButton
              label="CONNECT DISCORD"
              onClick={() => handleLogin('discord')}
              isMobile={isMobile}
              icon={
                <svg width="20" height="16" viewBox="0 0 71 55" fill="currentColor" style={{ marginRight: 8 }}>
                  <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
                </svg>
              }
            />

            {isPuterAvailable() && (
              <MenuButton
                label={puterLoading ? 'SIGNING IN...' : 'SIGN IN WITH PUTER'}
                onClick={handlePuterLogin}
                isMobile={isMobile}
                icon={<span style={{ marginRight: 8, fontSize: 18 }}>☁</span>}
              />
            )}

            <MenuButton
              label="GRUDGE STUDIO"
              onClick={() => window.open('https://grudgestudio.com', '_blank')}
              subtle
              isMobile={isMobile}
              icon={<EssentialIcon name="Home" size={16} style={{ marginRight: 8 }} />}
            />
          </div>

          <div style={{
            color: 'var(--muted)', fontSize: '0.6rem', marginTop: 20, opacity: 0.5,
            letterSpacing: 1,
          }}>
            &copy; 2026 Grudge Studio
            {isPuterAvailable() && (
              <span> &bull; <a href="https://developer.puter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', opacity: 0.7 }}>Powered by Puter</a></span>
            )}
          </div>
        </div>
      </div>
    );
}

function MenuButton({ label, onClick, primary, subtle, icon, isMobile }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    background: primary
      ? hovered
        ? 'rgba(34,211,238,0.3)'
        : 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.08))'
      : subtle
        ? 'rgba(4,18,37,0.5)'
        : hovered
          ? 'rgba(4,18,37,0.7)'
          : 'rgba(4,18,37,0.55)',
    border: primary
      ? '2px solid var(--accent)'
      : subtle
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: primary ? (isMobile ? '14px 20px' : '14px 50px') : (isMobile ? '10px 16px' : '10px 40px'),
    color: primary ? 'var(--accent)' : subtle ? 'var(--muted)' : '#ccc',
    fontSize: primary ? '1rem' : '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    letterSpacing: primary ? 3 : 2,
    transition: 'all 0.3s',
    width: isMobile ? '100%' : 280,
    minHeight: primary ? 44 : 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: hovered && primary ? '0 0 30px rgba(34,211,238,0.3)' : 'none',
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
