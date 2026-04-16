import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Betta Warlords RPG — main game component.
 * This will be the full game implementation.
 * For now it provides the game container with a placeholder
 * until the RPG engine source is fully rebuilt.
 */
export default function BettaWarlords() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  return (
    <div className="game-container">
      <button className="game-frame-back" onClick={() => navigate('/')}>← Back</button>
      <div ref={containerRef} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20,
        background: 'radial-gradient(ellipse at 50% 30%, #0a1128, #050a18)',
      }}>
        <img src="/images/splash_logo.png" alt="Betta Warlords" style={{
          width: 'min(400px, 80vw)', animation: 'float 4s ease-in-out infinite',
          filter: 'drop-shadow(0 0 40px rgba(6,182,212,0.4))',
        }} />
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          background: 'linear-gradient(135deg, #22d3ee, #a855f7, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '3px',
        }}>BETTA WARLORDS</h1>
        <p style={{ color: '#94a3b8', maxWidth: 500, textAlign: 'center' }}>
          The Sunken Kingdom of Abyssia awaits. RPG engine loading...
        </p>
        <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>
      </div>
    </div>
  );
}
