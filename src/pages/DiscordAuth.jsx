import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeDiscordLogin } from '../services/authService';
import { useAuthStore } from '../stores/useAuth';

export default function DiscordAuth() {
  const navigate = useNavigate();
  const { tryRestoreSession } = useAuthStore();
  const [status, setStatus] = useState('Authenticating with Discord...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      setStatus('No authorization code received.');
      return;
    }

    completeDiscordLogin(code, state)
      .then(() => {
        tryRestoreSession();
        navigate('/account');
      })
      .catch(err => {
        setStatus(`Discord login failed: ${err.message}`);
      });
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--deep)', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid #5865f2', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#94a3b8' }}>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
