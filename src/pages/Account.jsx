import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuth';
import { fetchAccount } from '../services/authService';

export default function Account() {
  const navigate = useNavigate();
  const { user, isLoggedIn, gbuxBalance, refreshGBux, loginGuest, loginDiscord, logout } = useAuthStore();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshGBux();
    fetchAccount().then(setAccount).catch(() => {});
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#22d3ee', marginBottom: 20 }}>Sign In</h2>
        <p style={{ color: '#94a3b8', marginBottom: 30 }}>Connect your account to save progress across all games.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={loginGuest}>Play as Guest</button>
          <button className="btn btn-ghost" onClick={loginDiscord}>Connect Discord</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, maxWidth: 700, margin: '0 auto', padding: '80px 20px 40px' }}>
      <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', marginBottom: 24,
        background: 'linear-gradient(135deg, #22d3ee, #a855f7)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Account
      </h1>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Player</div>
        <div style={{ fontSize: '1.4rem', fontFamily: "'Cinzel', serif", color: '#22d3ee' }}>{user?.username || 'Player'}</div>
        {user?.grudgeId && <div style={{ fontSize: '0.75rem', color: '#475569' }}>ID: {user.grudgeId}</div>}
        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>Type: {user?.type || 'guest'}</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>GBuX Balance</div>
        <div style={{ fontSize: '2rem', fontFamily: "'Cinzel', serif", color: '#f59e0b', fontWeight: 900 }}>
          {gbuxBalance.toLocaleString()}
        </div>
      </div>

      {account?.gameProgress && (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Game Progress</div>
          {Object.entries(account.gameProgress).map(([game, data]) => (
            <div key={game} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{game.replace(/-/g, ' ')}</span>
              <span style={{ color: '#22d3ee', fontWeight: 600 }}>Level {data.level || 1}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-ghost" onClick={logout} style={{ marginTop: 20 }}>Sign Out</button>
    </div>
  );
}

const cardStyle = {
  background: 'rgba(14,22,48,0.6)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12, padding: '20px 24px', marginBottom: 16,
};
