import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GrudgeDrive() {
  const navigate = useNavigate();
  return (
    <div className="game-container">
      <button className="game-frame-back" onClick={() => navigate('/')}>Back</button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'radial-gradient(ellipse at 50% 30%, #0a1128, #050a18)' }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#f97316', letterSpacing: '3px', textShadow: '0 0 30px #f9731644' }}>GRUDGE DRIVE</h1>
        <p style={{ color: '#94a3b8', maxWidth: 500, textAlign: 'center' }}>Vehicular combat in the arena. Drive, shoot, survive.</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }}>Start Game</button>
      </div>
    </div>
  );
}
