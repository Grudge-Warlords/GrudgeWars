import React, { useState, useEffect } from 'react';
import GBuxAccess from './GBuxAccess.jsx';

export default function GBuxPage() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'gbux-scroll-fix';
    style.textContent = 'html, body { overflow-y: auto !important; height: auto !important; }';
    document.head.appendChild(style);
    return () => { const el = document.getElementById('gbux-scroll-fix'); if (el) el.remove(); };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('discordUser');
      if (stored) {
        const user = JSON.parse(stored);
        setUserId(user.id);
      }
    } catch {}
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: '#64748b', textDecoration: 'none', fontSize: '13px',
            marginBottom: '20px',
          }}>
            ← Back to Grudge Studios
          </a>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '36px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>GBuX Token Store</h1>
          <p style={{
            color: '#94a3b8', fontSize: '15px',
            fontFamily: "'Jost', sans-serif",
            maxWidth: '500px', margin: '0 auto',
          }}>
            Purchase GBuX tokens to unlock AI game generation, deployments, and premium features across all Grudge Studios titles.
          </p>
        </div>

        {!userId && (
          <div style={{
            textAlign: 'center', marginBottom: '24px',
            padding: '20px', borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}>
            <p style={{ color: '#a5b4fc', fontSize: '14px', marginBottom: '12px', fontFamily: "'Jost', sans-serif" }}>
              Log in with Discord to create a wallet and purchase GBuX
            </p>
            <a
              href="/discordauth"
              style={{
                display: 'inline-block',
                padding: '10px 24px', borderRadius: '8px',
                background: '#5865F2', color: 'white',
                textDecoration: 'none', fontSize: '14px', fontWeight: '600',
              }}
            >Login with Discord</a>
          </div>
        )}

        <GBuxAccess userId={userId} />

        <div style={{
          marginTop: '40px', textAlign: 'center',
          padding: '24px', borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(30, 41, 59, 0.4)',
        }}>
          <h3 style={{
            fontFamily: "'Cinzel', serif", fontSize: '16px',
            color: '#e2e8f0', marginBottom: '12px',
          }}>How It Works</h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px', textAlign: 'center',
          }}>
            {[
              { step: '1', title: 'Login', desc: 'Connect with Discord' },
              { step: '2', title: 'Create Wallet', desc: 'Automatic Solana wallet via Crossmint' },
              { step: '3', title: 'Buy GBuX', desc: 'Choose a package that fits your needs' },
              { step: '4', title: 'Create Games', desc: 'Use GBuX to unlock AI features' },
            ].map(item => (
              <div key={item.step}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#0a0a0f', fontWeight: '700', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>{item.step}</div>
                <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '13px', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
