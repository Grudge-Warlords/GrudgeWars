import React from 'react';
import { useAuthStore } from '../stores/useAuth';

export default function Admin() {
  const { user, isLoggedIn } = useAuthStore();
  const isAdmin = user?.accountLevel === 'master_admin' || user?.accountLevel === 'admin';

  if (!isLoggedIn || !isAdmin) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#ef4444' }}>Access Denied</h2>
        <p style={{ color: '#94a3b8', marginTop: 12 }}>Admin access required.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, maxWidth: 900, margin: '0 auto', padding: '80px 20px' }}>
      <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', color: '#ef4444', marginBottom: 24 }}>
        Admin Panel
      </h1>
      <p style={{ color: '#94a3b8' }}>Welcome, {user.username}. Master admin controls coming soon.</p>
    </div>
  );
}
