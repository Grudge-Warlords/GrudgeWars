import React, { useState, useEffect } from 'react';
import PortalHeader from './portal/PortalHeader';
import GameCard from './portal/GameCard';
import QuickLinks from './portal/QuickLinks';
import HeroPreview from './portal/HeroPreview';
import { checkGatewayOnBoot, gatewaySignOut, isGatewayAuthenticated } from '../utils/grudgeGateway.js';

export default function StudioPortal() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Try gateway token first (auto-hydrates from grudge-studio auth)
    const gwSession = checkGatewayOnBoot();
    if (gwSession) { setSession(gwSession); return; }
    // 2. Fallback: existing local session
    try {
      const s = JSON.parse(localStorage.getItem('grudge-session') || 'null');
      if (s && s.type && s.username) setSession(s);
    } catch {}
  }, []);

  // Any grudge-studio auth is valid — no standalone login wall needed
  const isLoggedIn = !!session || isGatewayAuthenticated();

  const handleSignOut = () => {
    gatewaySignOut();
    setSession(null);
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#0a0a12',
      color: '#e8dcc8',
      fontFamily: "'Jost', sans-serif",
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Full-page background art */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/backgrounds/world_map.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.06, filter: 'saturate(0.5)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(1200px 700px at 50% 110%, rgba(0,0,0,0.8), transparent 55%), radial-gradient(800px 400px at 10% -10%, rgba(10,15,40,0.6), transparent 60%), linear-gradient(180deg, rgba(10,10,18,0.5), rgba(10,10,18,0.95))',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PortalHeader session={session} onSignOut={handleSignOut} />
      </div>

      <main style={{
        flex: 1, maxWidth: 900, width: '100%', margin: '0 auto',
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 28,
        position: 'relative', zIndex: 1,
      }}>
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
