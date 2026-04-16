import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, #0a1128 0%, #050a18 100%)',
    }}>
      <img src="/grudge-logo.png" alt="Loading" style={{
        width: 80, height: 80, animation: 'pulse 2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.4))',
      }} />
      <div style={{
        marginTop: 24, color: '#94a3b8', fontSize: '0.85rem',
        letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>Loading...</div>
    </div>
  );
}
