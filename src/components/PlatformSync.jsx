import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';

/**
 * PlatformSync.jsx — Account & Backend Sync Panel
 * Auth is now shared via grudge_auth_token + id.grudge-studio.com SSO.
 * This panel shows identity status, balance, character sync state,
 * and push/pull controls. The old popup-based grudgeSyncSDK flow is removed.
 */

import { forcePush, pullSave, getLastSync, getGrudgeId, isLoggedIn } from '../services/cloudSync';
import { redirectToGateway } from '../utils/grudgeGateway';

const GOLD_COLOR = '#FAAC47';
const BORDER_COLOR = 'rgba(212,169,106,0.2)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MUTED_COLOR = 'rgba(255,255,255,0.4)';

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: ok ? '#22c55e' : '#ef4444',
      boxShadow: ok ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
      marginRight: 6, flexShrink: 0,
    }} />
  );
}

export default function PlatformSync({ onClose }) {
  const heroRoster        = useGameStore(s => s.heroRoster) || [];
  const accountBalance    = useGameStore(s => s.accountBalance);
  const backendSynced     = useGameStore(s => s.backendSynced);
  const lastBackendSync   = useGameStore(s => s.lastBackendSync);
  const loadAccountData   = useGameStore(s => s.loadAccountData);

  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [message, setMessage] = useState(null);

  const loggedIn = isLoggedIn();
  const grudgeId = getGrudgeId();
  const username = typeof localStorage !== 'undefined'
    ? localStorage.getItem('grudge_username') || null : null;

  const lastSyncText = lastBackendSync
    ? new Date(lastBackendSync).toLocaleTimeString()
    : (getLastSync() ? new Date(getLastSync().timestamp).toLocaleTimeString() : 'Never');

  function flash(text, error = false) {
    setMessage({ text, error });
    setTimeout(() => setMessage(null), 3500);
  }

  async function handlePush() {
    if (!loggedIn) return flash('Sign in to sync', true);
    setSyncing(true);
    try {
      const s = useGameStore.getState();
      const result = await forcePush(() => ({
        heroRoster: s.heroRoster, inventory: s.inventory, gold: s.gold,
        level: s.level, xp: s.xp, victories: s.victories, losses: s.losses,
        zoneConquer: s.zoneConquer, completedQuests: s.completedQuests,
      }));
      if (result.success) flash('Saved to cloud ✓');
      else flash(result.error || 'Sync failed', true);
    } catch (e) { flash(e.message || 'Sync failed', true); }
    setSyncing(false);
  }

  async function handlePull() {
    if (!loggedIn) return flash('Sign in to restore', true);
    setPulling(true);
    try {
      const result = await pullSave();
      if (result.success && result.data) flash('Cloud save loaded – refresh to apply ✓');
      else if (result.success) flash('No cloud save found');
      else flash(result.error || 'Restore failed', true);
    } catch (e) { flash(e.message || 'Restore failed', true); }
    setPulling(false);
  }

  async function handleRefresh() {
    setSyncing(true);
    try { await loadAccountData(); flash('Account refreshed ✓'); }
    catch (e) { flash('Could not reach backend', true); }
    setSyncing(false);
  }

  const backendHeroes    = heroRoster.filter(h => h.source === 'backend' || h.backendId);
  const localOnlyHeroes  = heroRoster.filter(h => !h.source && !h.backendId);

  return (
    <div style={{ color: '#e8dcc8', fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: GOLD_COLOR, fontSize: '1.1rem', letterSpacing: 2, margin: 0 }}>ACCOUNT SYNC</h2>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED_COLOR, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>}
      </div>

      {/* Identity */}
      <div style={{ background: PANEL_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED_COLOR, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Identity</div>
        {loggedIn ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <StatusDot ok />
              <span style={{ color: GOLD_COLOR, fontWeight: 700 }}>{username || 'Player'}</span>
              {backendSynced && <span style={{ marginLeft: 8, fontSize: '0.65rem', color: '#22c55e' }}>✓ Synced</span>}
            </div>
            {grudgeId && <div style={{ fontSize: '0.68rem', color: MUTED_COLOR, fontFamily: 'monospace' }}>{grudgeId}</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusDot ok={false} />
            <span style={{ color: MUTED_COLOR, fontSize: '0.85rem' }}>Not signed in</span>
            <button onClick={() => redirectToGateway(window.location.href)}
              style={{ marginLeft: 'auto', padding: '6px 14px', background: 'linear-gradient(135deg,#DB6331,#FAAC47)', border: 'none', borderRadius: 6, color: '#0a0a12', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Cinzel', serif", letterSpacing: 1 }}
            >SIGN IN</button>
          </div>
        )}
      </div>

      {/* Balance */}
      {accountBalance && (
        <div style={{ background: PANEL_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: '0.68rem', color: MUTED_COLOR, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Balance</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '0.65rem', color: MUTED_COLOR }}>Gold</div><div style={{ color: GOLD_COLOR, fontWeight: 700 }}>{(accountBalance.gold || 0).toLocaleString()}</div></div>
            <div><div style={{ fontSize: '0.65rem', color: MUTED_COLOR }}>GBUX</div><div style={{ color: '#c084fc', fontWeight: 700 }}>{(accountBalance.gbux || 0).toLocaleString()}</div></div>
            {accountBalance.walletAddress && (
              <div><div style={{ fontSize: '0.65rem', color: MUTED_COLOR }}>Wallet</div><div style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.7rem' }}>{accountBalance.walletAddress.slice(0, 8)}…</div></div>
            )}
          </div>
        </div>
      )}

      {/* Characters */}
      <div style={{ background: PANEL_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED_COLOR, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Characters</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div><div style={{ fontSize: '0.65rem', color: MUTED_COLOR }}>Roster</div><div style={{ color: '#e8dcc8', fontWeight: 700 }}>{heroRoster.length}</div></div>
          <div><div style={{ fontSize: '0.65rem', color: MUTED_COLOR }}>Backend</div><div style={{ color: '#22c55e', fontWeight: 700 }}>{backendHeroes.length}</div></div>
          {localOnlyHeroes.length > 0 && <div><div style={{ fontSize: '0.65rem', color: '#f59e0b' }}>Local Only</div><div style={{ color: '#f59e0b', fontWeight: 700 }}>{localOnlyHeroes.length}</div></div>}
        </div>
        {localOnlyHeroes.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 6 }}>
            ⚠ {localOnlyHeroes.length} hero{localOnlyHeroes.length > 1 ? 'es are' : ' is'} not yet saved to your account.{!loggedIn && ' Sign in to save.'}
          </div>
        )}
      </div>

      {/* Sync buttons */}
      <div style={{ background: PANEL_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: '0.68rem', color: MUTED_COLOR, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>Cloud Save · Last: {lastSyncText}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{label: syncing ? '↳ Saving…' : '↑ Save', fn: handlePush, dis: syncing||!loggedIn, gold: true},
            {label: pulling ? '↳ Loading…' : '↓ Restore', fn: handlePull, dis: pulling||!loggedIn, gold: false},
            {label: '⟳ Refresh', fn: handleRefresh, dis: syncing||!loggedIn, gold: false}]
            .map(({ label, fn, dis, gold }) => (
            <button key={label} onClick={fn} disabled={dis} style={{
              flex: 1, padding: '9px 6px', borderRadius: 7,
              background: gold ? (dis ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#DB6331,#FAAC47)') : 'rgba(255,255,255,0.04)',
              border: gold ? 'none' : `1px solid ${BORDER_COLOR}`,
              color: gold ? (dis ? MUTED_COLOR : '#0a0a12') : GOLD_COLOR,
              fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer',
              fontFamily: gold ? "'Cinzel', serif" : 'inherit',
              fontSize: '0.72rem', letterSpacing: gold ? 1 : 0, opacity: dis ? 0.4 : 1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem',
          background: message.error ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${message.error ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          color: message.error ? '#f87171' : '#4ade80',
        }}>{message.text}</div>
      )}
    </div>
  );
}
