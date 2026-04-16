import React from 'react';

export default function LoadingScreen({ progress = 0, total = 1, message = 'Loading...' }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 9998, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#020a18', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/images/loading.gif)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.75,
      }} />

      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(180deg, rgba(4,18,37,0.3) 0%, rgba(2,10,24,0.5) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        animation: 'fadeIn 0.5s ease'
      }}>
        <h2 className="font-cinzel" style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          background: 'linear-gradient(135deg, #22d3ee, #06b6d4, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 24
        }}>
          BETTA WARLORDS
        </h2>

        <div style={{
          width: 260, height: 6, background: 'rgba(255,255,255,0.1)',
          borderRadius: 3, overflow: 'hidden', margin: '0 auto 12px'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #22d3ee, #06b6d4)',
            borderRadius: 3, transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{
          color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: 2,
          opacity: 0.8
        }}>
          {message} {pct}%
        </div>
      </div>
    </div>
  );
}
