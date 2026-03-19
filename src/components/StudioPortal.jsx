import React, { useState, useEffect } from 'react';
import PortalHeader from './portal/PortalHeader';
import GameCard from './portal/GameCard';
import QuickLinks from './portal/QuickLinks';
import HeroPreview from './portal/HeroPreview';
import GrudgeAuthModal from './GrudgeAuthModal';

export default function StudioPortal() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('grudge-session') || 'null');
      if (s && s.type && s.username) setSession(s);
    } catch {}
  }, []);

  const isLoggedIn = session && ['discord', 'grudge', 'puter', 'wallet'].includes(session.type);

  const handleSignOut = () => {
    localStorage.removeItem('grudge-session');
    localStorage.removeItem('grudge_session_token');
    localStorage.removeItem('discordUser');
    localStorage.removeItem('grudge_studio_session');
    localStorage.removeItem('grudge_studio_user');
    setSession(null);
  };

  const handleAuthSuccess = (s) => {
    setSession(s);
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#0a0a12',
      color: '#e8dcc8',
      fontFamily: "'Jost', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <PortalHeader session={session} onSignOut={handleSignOut} />

      <main style={{
        flex: 1, maxWidth: 900, width: '100%', margin: '0 auto',
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {/* Auth section — only when not logged in */}
        {!isLoggedIn && (
          <GrudgeAuthModal onSuccess={handleAuthSuccess} inline />
        )}

        {/* Game card */}
        <GameCard isLoggedIn={isLoggedIn} />

        {/* Hero preview (only if save exists) */}
        <HeroPreview />

        {/* Quick links */}
        <QuickLinks />

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)',
        }}>
          &copy; 2026 Grudge Studio &mdash; All Rights Reserved
        </div>
      </main>
    </div>
  );
}
