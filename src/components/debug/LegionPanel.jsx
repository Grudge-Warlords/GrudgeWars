import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLegion } from '../../hooks/useLegion';
import { DEBUG } from '../../debug';

/**
 * LegionPanel — debug-mode floating panel for the Gruda Legion AI system.
 *
 * Shows only when DEBUG=true (dev mode or ?debug=true on any URL).
 * Features:
 *  - Query the Legion AI with live game context
 *  - See recent telemetry events flowing through the session
 *  - Monitor active session ID and scene
 *  - Collapsible / draggable
 */
export default function LegionPanel() {
  if (!DEBUG) return null;

  return <LegionPanelInner />;
}

function LegionPanelInner() {
  const { query, history, isLoading, error, legionState, trackEvent } = useLegion({ autoInit: false });
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState('query'); // 'query' | 'telemetry'
  const [snapshot, setSnapshot] = useState(null);
  const historyRef = useRef(null);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  // Poll snapshot every 10s when telemetry tab is open
  useEffect(() => {
    if (tab !== 'telemetry' || collapsed) return;
    const fetchSnap = () =>
      fetch('/api/legion/snapshot').then(r => r.json()).then(setSnapshot).catch(() => {});
    fetchSnap();
    const t = setInterval(fetchSnap, 10000);
    return () => clearInterval(t);
  }, [tab, collapsed]);

  const handleQuery = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const prompt = input.trim();
    setInput('');
    await query(prompt);
  }, [input, isLoading, query]);

  const quickPrompts = [
    'What is the current game state?',
    'Suggest a next mission for this scene',
    'Are there any performance issues?',
    'Generate a random enemy encounter',
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header} onClick={() => setCollapsed(c => !c)}>
        <span style={styles.headerIcon}>⚡</span>
        <span style={styles.headerTitle}>GRUDA LEGION</span>
        <span style={styles.headerSession}>
          {legionState.sessionId?.slice(-8)}
        </span>
        <span style={styles.headerChevron}>{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <div style={styles.body}>
          {/* Tab bar */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(tab === 'query' ? styles.tabActive : {}) }}
              onClick={() => setTab('query')}
            >Query</button>
            <button
              style={{ ...styles.tab, ...(tab === 'telemetry' ? styles.tabActive : {}) }}
              onClick={() => setTab('telemetry')}
            >Telemetry</button>
          </div>

          {tab === 'query' && (
            <>
              {/* Conversation history */}
              <div style={styles.history} ref={historyRef}>
                {history.length === 0 && (
                  <div style={styles.placeholder}>
                    Ask Legion anything about the live game state...
                  </div>
                )}
                {history.map((entry, i) => (
                  <div key={i}>
                    <div style={styles.msgUser}>{entry.prompt}</div>
                    <div style={styles.msgLegion}>{entry.response}</div>
                  </div>
                ))}
                {isLoading && (
                  <div style={styles.msgLegion}>
                    <span style={styles.blink}>▌</span> Processing...
                  </div>
                )}
                {error && <div style={styles.msgError}>⚠ {error}</div>}
              </div>

              {/* Quick prompts */}
              <div style={styles.quickRow}>
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    style={styles.quickBtn}
                    onClick={() => setInput(p)}
                  >{p}</button>
                ))}
              </div>

              {/* Input */}
              <form style={styles.form} onSubmit={handleQuery}>
                <input
                  style={styles.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Command the Legion..."
                  disabled={isLoading}
                />
                <button style={styles.sendBtn} type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? '...' : '➤'}
                </button>
              </form>
            </>
          )}

          {tab === 'telemetry' && (
            <div style={styles.telemetry}>
              <div style={styles.telemetryRow}>
                <span style={styles.label}>Scene:</span>
                <span style={styles.value}>{legionState.scene || '/'}</span>
              </div>
              <div style={styles.telemetryRow}>
                <span style={styles.label}>Queued Events:</span>
                <span style={styles.value}>{legionState.queuedEvents}</span>
              </div>
              {legionState.recentPerf?.length > 0 && (
                <div style={styles.telemetryRow}>
                  <span style={styles.label}>Last FPS:</span>
                  <span style={{ ...styles.value, color: getFpsColor(legionState.recentPerf.at(-1)?.fps) }}>
                    {legionState.recentPerf.at(-1)?.fps ?? 'n/a'}
                  </span>
                </div>
              )}
              {snapshot && (
                <>
                  <div style={styles.separator} />
                  <div style={styles.telemetryRow}>
                    <span style={styles.label}>Server Sessions:</span>
                    <span style={styles.value}>{snapshot.activeSessions}</span>
                  </div>
                  {snapshot.sessions?.map((s, i) => (
                    <div key={i} style={styles.sessionCard}>
                      <div style={styles.sessionId}>{s.sessionId?.slice(-12)}</div>
                      <div style={styles.sessionScene}>{s.scene}</div>
                      <div style={styles.sessionEvents}>{s.eventCount} events</div>
                    </div>
                  ))}
                </>
              )}
              <button
                style={styles.trackBtn}
                onClick={() => trackEvent('manual_ping', { from: 'LegionPanel' })}
              >
                📡 Send Test Event
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getFpsColor(fps) {
  if (!fps) return '#aaa';
  if (fps >= 55) return '#4ade80';
  if (fps >= 30) return '#facc15';
  return '#f87171';
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    width: '360px',
    background: 'rgba(10, 10, 20, 0.95)',
    border: '1px solid #FF6B35',
    borderRadius: '8px',
    fontFamily: '"Courier New", monospace',
    fontSize: '12px',
    color: '#e2e8f0',
    zIndex: 10000,
    boxShadow: '0 0 20px rgba(255,107,53,0.3)',
    backdropFilter: 'blur(8px)',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,107,53,0.3)',
  },
  headerIcon: { fontSize: '14px' },
  headerTitle: { fontWeight: 'bold', color: '#FF6B35', flex: 1, letterSpacing: '2px', fontSize: '11px' },
  headerSession: { color: '#64748b', fontSize: '10px' },
  headerChevron: { color: '#FF6B35', fontSize: '10px' },
  body: { padding: '0' },
  tabs: { display: 'flex', borderBottom: '1px solid rgba(255,107,53,0.2)' },
  tab: {
    flex: 1, padding: '6px', background: 'transparent', border: 'none',
    color: '#64748b', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px',
  },
  tabActive: { color: '#FF6B35', borderBottom: '2px solid #FF6B35' },
  history: {
    height: '220px',
    overflowY: 'auto',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  placeholder: { color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' },
  msgUser: {
    background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)',
    borderRadius: '4px', padding: '6px 8px', color: '#fed7aa',
  },
  msgLegion: {
    background: 'rgba(125,249,255,0.07)', border: '1px solid rgba(125,249,255,0.2)',
    borderRadius: '4px', padding: '6px 8px', color: '#e2e8f0', lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  msgError: { color: '#f87171', padding: '4px 8px' },
  blink: { animation: 'none', opacity: 0.7 },
  quickRow: {
    display: 'flex', flexWrap: 'wrap', gap: '4px',
    padding: '4px 10px',
  },
  quickBtn: {
    background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)',
    borderRadius: '3px', color: '#94a3b8', fontSize: '10px',
    padding: '3px 6px', cursor: 'pointer', lineHeight: 1.2,
  },
  form: {
    display: 'flex', gap: '6px',
    padding: '8px 10px',
    borderTop: '1px solid rgba(255,107,53,0.2)',
  },
  input: {
    flex: 1, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,107,53,0.4)', borderRadius: '4px',
    color: '#e2e8f0', padding: '6px 8px', fontSize: '12px', outline: 'none',
  },
  sendBtn: {
    background: '#FF6B35', border: 'none', borderRadius: '4px',
    color: '#fff', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold',
  },
  telemetry: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  telemetryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#64748b', fontSize: '11px' },
  value: { color: '#7DF9FF', fontWeight: 'bold' },
  separator: { borderTop: '1px solid rgba(255,107,53,0.2)', margin: '4px 0' },
  sessionCard: {
    background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)',
    borderRadius: '4px', padding: '6px 8px', display: 'flex', gap: '8px', fontSize: '11px',
  },
  sessionId: { color: '#FF6B35', fontWeight: 'bold' },
  sessionScene: { color: '#94a3b8', flex: 1 },
  sessionEvents: { color: '#64748b' },
  trackBtn: {
    marginTop: '6px', background: 'rgba(125,249,255,0.1)',
    border: '1px solid rgba(125,249,255,0.3)', borderRadius: '4px',
    color: '#7DF9FF', padding: '6px', cursor: 'pointer', fontSize: '11px',
  },
};
