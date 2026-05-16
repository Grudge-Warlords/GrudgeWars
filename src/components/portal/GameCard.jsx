import React, { useState } from 'react';
import useGameStore from '../../stores/gameStore';

export default function GameCard({ isLoggedIn }) {
  const heroRoster = useGameStore(s => s.heroRoster);
  const playerName = useGameStore(s => s.playerName);
  const [hovered, setHovered] = useState(false);

  const heroCount = heroRoster?.length || 0;
  const hasSave = playerName && playerName.length > 0;

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(20,26,43,0.9), rgba(15,20,35,0.95))',
        border: `2px solid ${hovered ? 'rgba(250,172,71,0.5)' : 'rgba(212,169,106,0.2)'}`,
        borderRadius: 14, padding: 0,
        cursor: 'pointer', transition: 'all 0.3s',
        boxShadow: hovered ? '0 8px 40px rgba(250,172,71,0.15)' : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (hasSave && heroCount === 0) return; window.location.href = '/play'; }}
    >
      {/* Background image */}
      <div style={{
        height: 220, position: 'relative', overflow: 'hidden',
      }}>
        <img
          src="/backgrounds/verdant_plains.png"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            filter: hovered ? 'saturate(1.1) brightness(0.55)' : 'saturate(0.8) brightness(0.4)',
            transition: 'all 0.5s',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(10,10,18,0.4) 50%, rgba(10,10,18,0.97) 100%)',
        }} />
        {/* Shimmer on hover */}
        {hovered && (
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            animation: 'lobbyCardShine 0.8s ease forwards',
            pointerEvents: 'none',
          }} />
        )}
        <div style={{
          position: 'absolute', bottom: 16, left: 20, right: 20,
        }}>
          <div style={{
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            fontSize: '1.8rem', letterSpacing: 4,
            background: 'linear-gradient(90deg, #DB6331, #FAAC47, #FFE0A0, #FAAC47, #DB6331)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          }}>
            GRUDGE WARLORDS
          </div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
            color: 'rgba(250,172,71,0.6)', letterSpacing: 2, marginTop: 2,
          }}>
            6 Races &bull; 4 Classes &bull; 24 Warlords
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {hasSave && (
            <div style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#6ee7b7',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: '0.9rem' }}>&#9876;</span>
              {heroCount} {heroCount === 1 ? 'Hero' : 'Heroes'}
            </div>
          )}
          {hasSave && (
            <div style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
            }}>
              Save found
            </div>
          )}
        </div>

        <div
          title={hasSave && heroCount === 0 ? 'Create a hero first to continue' : ''}
          style={{
            background: isLoggedIn && heroCount > 0
              ? 'linear-gradient(135deg, #DB6331, #FAAC47)'
              : 'rgba(255,255,255,0.05)',
            border: isLoggedIn && heroCount > 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 24px',
            color: isLoggedIn && heroCount > 0 ? '#0a0a12' : '#555',
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            fontSize: '0.95rem', fontWeight: 700, letterSpacing: 3,
            opacity: hasSave && heroCount === 0 ? 0.4 : 1,
            cursor: hasSave && heroCount === 0 ? 'not-allowed' : 'pointer',
            userSelect: 'none',
          }}
        >
          {hasSave && heroCount === 0 ? 'NO HEROES' : hasSave ? 'CONTINUE' : 'PLAY'}
        </div>
      </div>
    </div>
  );
}
