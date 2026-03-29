/**
 * DevicePortal — Browser firmware interface
 *
 * Acts as a "soft" version of the ESP32-GRD17 firmware running in the browser.
 * Shows Grudge account info, on-chain balances, device status, and pairing.
 *
 * Balances:
 *   SOL   — native Solana balance via Helius RPC
 *   GBUX  — SPL token balance (55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray)
 *   GRUDA — GrudaChain status / block height via api.grudge-studio.com
 *   POLY  — Polygon zkEVM balance via public RPC
 *
 * Usage: <DevicePortal /> — standalone page, manages its own auth state
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const GRUDGE_ID_URL   = import.meta.env.VITE_AUTH_URL   || 'https://id.grudge-studio.com';
const GRUDGE_API_URL  = import.meta.env.VITE_API_URL    || 'https://api.grudge-studio.com';
const HELIUS_KEY      = import.meta.env.VITE_HELIUS_API_KEY || '08c34701-8900-412f-8174-b3c568cc5930';
const GBUX_MINT       = '55TpSoMNxbfsNJ9U1dQoo9H3dRtDmjBZVMcKqvU2nray';
const POLY_RPC        = 'https://polygon-rpc.com';
const FIRMWARE_VER    = '1.0.0-browser';
const HARDWARE_TYPE   = 'browser-firmware';

// ── Storage helpers ───────────────────────────────────────────────────────────

const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return localStorage.getItem(k); } },
  set: (k, v) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function heliusRpc(method, params) {
  const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const d = await r.json();
  return d.result;
}

async function fetchSolBalance(address) {
  if (!address) return null;
  try {
    const result = await heliusRpc('getBalance', [address]);
    return result?.value ? result.value / 1e9 : 0;
  } catch { return null; }
}

async function fetchGbuxBalance(address) {
  if (!address) return null;
  try {
    const result = await heliusRpc('getTokenAccountsByOwner', [
      address,
      { mint: GBUX_MINT },
      { encoding: 'jsonParsed' },
    ]);
    const accounts = result?.value || [];
    if (!accounts.length) return 0;
    const amt = accounts[0].account?.data?.parsed?.info?.tokenAmount;
    return amt ? parseFloat(amt.uiAmountString || '0') : 0;
  } catch { return null; }
}

async function fetchGrudaStats() {
  try {
    const r = await fetch(`${GRUDGE_API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return { status: d.status, service: d.service, version: d.version };
  } catch { return null; }
}

async function fetchPolyBalance(address) {
  if (!address) return null;
  try {
    const r = await fetch(POLY_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    if (!d.result) return 0;
    return parseInt(d.result, 16) / 1e18;
  } catch { return null; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BalanceRow({ label, value, unit, color = '#FAAC47', loading = false, error = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: 'monospace', color: error ? '#f87171' : loading ? 'rgba(255,255,255,0.2)' : color, fontWeight: 600 }}>
        {loading ? '···' : error ? 'ERR' : value == null ? '—' : `${typeof value === 'number' ? value.toFixed(4) : value} ${unit}`}
      </span>
    </div>
  );
}

function StatusPill({ online }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 10,
      background: online ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      fontSize: 10, letterSpacing: '0.08em', fontFamily: 'monospace',
      color: online ? '#4ade80' : '#f87171',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: online ? '#22c55e' : '#ef4444', display: 'inline-block', animation: online ? 'pulse 2s infinite' : 'none' }} />
      {online ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}

function Card({ title, children, action }) {
  return (
    <div style={{ background: 'linear-gradient(160deg,#0d0f1c,#120d1e)', border: '1px solid rgba(212,169,106,.18)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Main DevicePortal ─────────────────────────────────────────────────────────

export default function DevicePortal() {
  const [authToken, setAuthToken]   = useState(() => LS.get('grudge_auth_token'));
  const [grudgeId, setGrudgeId]     = useState(() => LS.get('grudge_id'));
  const [username, setUsername]     = useState(() => LS.get('grudge_username'));
  const [walletAddr, setWalletAddr] = useState(() => LS.get('grudge_wallet_address'));
  const [deviceToken, setDeviceToken] = useState(() => LS.get('grd_device_token'));
  const [deviceId, setDeviceId]     = useState(() => LS.get('grd_device_id'));

  // Balances
  const [solBal, setSolBal]   = useState(null);
  const [gbuxBal, setGbuxBal] = useState(null);
  const [polyBal, setPolyBal] = useState(null);
  const [grudaStats, setGrudaStats] = useState(null);
  const [loadingBal, setLoadingBal] = useState(false);

  // Device state
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [heartbeatTs, setHeartbeatTs]   = useState(null);
  const [uptime, setUptime]             = useState(0);
  const [pairCode, setPairCode]         = useState('');
  const [pairMsg, setPairMsg]           = useState('');

  const uptimeRef = useRef(0);
  const bootTime  = useRef(Date.now());

  // ── Handle SSO redirect token ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || params.get('sso_token');
    if (urlToken) {
      LS.set('grudge_auth_token', urlToken);
      setAuthToken(urlToken);
      fetch(`${GRUDGE_API_URL}/api/auth/user`, { headers: { Authorization: `Bearer ${urlToken}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => {
          if (u) {
            const gid = u.grudgeId || u.grudge_id;
            const name = u.username;
            const wallet = u.walletAddress || u.wallet_address || u.serverWalletAddress || u.server_wallet_address;
            LS.set('grudge_id', gid);
            LS.set('grudge_username', name);
            if (wallet) { LS.set('grudge_wallet_address', wallet); setWalletAddr(wallet); }
            setGrudgeId(gid);
            setUsername(name);
          }
        })
        .catch(() => {});
      history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Login / logout ─────────────────────────────────────────────────────────
  function login() {
    window.location.href = `${GRUDGE_ID_URL}/auth/sso-check?return=${encodeURIComponent(window.location.href)}`;
  }

  function logout() {
    ['grudge_auth_token','grudge_id','grudge_username','grudge_wallet_address',
     'grudge_session_token','grudge-session','grd_device_token','grd_device_id']
      .forEach(k => LS.del(k));
    setAuthToken(null); setGrudgeId(null); setUsername(null);
    setDeviceToken(null); setDeviceId(null);
  }

  // ── Register this browser as a device ─────────────────────────────────────
  const registerDevice = useCallback(async () => {
    if (!authToken) return;
    // Generate a stable browser pubkey from grudgeId
    const pubkey = `browser-${grudgeId || 'anon'}-${navigator.userAgent.slice(0,16).replace(/\s/g,'_')}`;
    try {
      const r = await fetch(`${GRUDGE_API_URL}/api/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ publicKey: pubkey, firmwareVersion: FIRMWARE_VER, hardwareType: HARDWARE_TYPE, deviceName: `Browser-${username || 'Guest'}` }),
      });
      if (r.ok) {
        const d = await r.json();
        LS.set('grd_device_token', d.deviceToken);
        LS.set('grd_device_id', d.deviceId);
        setDeviceToken(d.deviceToken);
        setDeviceId(d.deviceId);
        setDeviceOnline(true);
      }
    } catch {}
  }, [authToken, grudgeId, username]);

  // Auto-register when authenticated
  useEffect(() => {
    if (authToken && !deviceToken) {
      registerDevice();
    }
  }, [authToken, deviceToken, registerDevice]);

  // ── Heartbeat loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!deviceToken) return;
    const send = async () => {
      const ut = Math.floor((Date.now() - bootTime.current) / 1000);
      setUptime(ut);
      try {
        const r = await fetch(`${GRUDGE_API_URL}/api/devices/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Token': deviceToken },
          body: JSON.stringify({
            uptime: ut,
            hardwareType: HARDWARE_TYPE,
            firmwareVersion: FIRMWARE_VER,
            solBalance: solBal,
            gbuxBalance: gbuxBal,
            status: 'online',
          }),
        });
        if (r.ok) { setDeviceOnline(true); setHeartbeatTs(Date.now()); }
        else setDeviceOnline(false);
      } catch { setDeviceOnline(false); }
    };
    send();
    const id = setInterval(send, 30_000);
    return () => clearInterval(id);
  }, [deviceToken, solBal, gbuxBal]);

  // ── Balance refresh ────────────────────────────────────────────────────────
  const refreshBalances = useCallback(async () => {
    if (!walletAddr) return;
    setLoadingBal(true);
    const [sol, gbux, gruda] = await Promise.all([
      fetchSolBalance(walletAddr),
      fetchGbuxBalance(walletAddr),
      fetchGrudaStats(),
    ]);
    setSolBal(sol);
    setGbuxBal(gbux);
    setGrudaStats(gruda);
    setLoadingBal(false);
  }, [walletAddr]);

  useEffect(() => {
    if (walletAddr) { refreshBalances(); }
  }, [walletAddr, refreshBalances]);

  // ── Pair ESP32 device ──────────────────────────────────────────────────────
  async function pairDevice() {
    const code = pairCode.trim().toUpperCase();
    if (code.length !== 6) { setPairMsg('Enter a 6-character code'); return; }
    setPairMsg('');
    try {
      const r = await fetch(`${GRUDGE_API_URL}/device/auth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      setPairMsg(r.ok ? '✅ Device paired!' : `❌ ${d.error || 'Failed'}`);
      if (r.ok) setPairCode('');
    } catch { setPairMsg('❌ Connection error'); }
  }

  // ── Uptime display ─────────────────────────────────────────────────────────
  function fmtUptime(s) {
    if (!s) return '0s';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLoggedIn = !!authToken && !!grudgeId;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%,rgba(219,99,49,.12) 0%,#060810 60%)',
      padding: '20px 16px', fontFamily: 'Jost, sans-serif', color: '#e8dcc8',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Jost:wght@400;600&display=swap');
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'Cinzel', serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(250,172,71,.2); border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 420, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, margin: '0 auto 10px', background: 'rgba(219,99,49,.15)', border: '1px solid rgba(250,172,71,.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" stroke="#FAAC47" strokeWidth="1.2"/>
              <path d="M8 10l4-4 4 4v8h-3v-5H11v5H8V10z" fill="#FAAC47"/>
              <circle cx="12" cy="12" r="2" fill="#DB6331"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#FAAC47', letterSpacing: 4 }}>GRUDA NODE</div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginTop: 3 }}>
            Browser Firmware v{FIRMWARE_VER}
          </div>
        </div>

        {/* Device status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(0,0,0,.3)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(255,255,255,.05)' }}>
          <StatusPill online={deviceOnline} />
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,.25)' }}>
            UP {fmtUptime(uptime)}
          </span>
          {heartbeatTs && (
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,.2)' }}>
              ♡ {Math.floor((Date.now() - heartbeatTs) / 1000)}s
            </span>
          )}
        </div>

        {/* Auth */}
        {!isLoggedIn ? (
          <Card title="Identity">
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 14, textAlign: 'center' }}>
              Connect your Grudge ID to access wallets and account data
            </p>
            <button onClick={login} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#DB6331,#FAAC47)', border: 'none', borderRadius: 8, color: '#0a0a12', fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 900, letterSpacing: 2, cursor: 'pointer' }}>
              🛡️ CONNECT GRUDGE ID
            </button>
          </Card>
        ) : (
          <>
            {/* Account */}
            <Card title="Account" action={
              <button onClick={logout} style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                disconnect
              </button>
            }>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(250,172,71,.15)', border: '1px solid rgba(250,172,71,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🛡️</div>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'Cinzel, serif', color: '#FAAC47' }}>{username || 'Warlord'}</div>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,.3)', letterSpacing: 1, marginTop: 2 }}>
                    {grudgeId ? grudgeId.slice(0, 8).toUpperCase() + '...' : '—'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace' }}>DEVICE</div>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: deviceId ? '#4ade80' : 'rgba(255,255,255,.2)' }}>
                    {deviceId ? deviceId.slice(0, 8).toUpperCase() : 'UNREGISTERED'}
                  </div>
                </div>
              </div>
              {walletAddr && (
                <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(0,0,0,.3)', borderRadius: 6, fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,.35)', wordBreak: 'break-all' }}>
                  {walletAddr}
                </div>
              )}
            </Card>

            {/* Balances */}
            <Card title="Wallets" action={
              <button onClick={refreshBalances} disabled={loadingBal} style={{ fontSize: 10, color: '#FAAC47', background: 'none', border: 'none', cursor: 'pointer', opacity: loadingBal ? 0.4 : 1 }}>
                {loadingBal ? '···' : '↻ refresh'}
              </button>
            }>
              {!walletAddr ? (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', textAlign: 'center' }}>No wallet address on account</p>
              ) : (
                <>
                  <BalanceRow label="SOL"   value={solBal}   unit="SOL"  color="#9945FF" loading={loadingBal} error={solBal === null && !loadingBal} />
                  <BalanceRow label="GBUX"  value={gbuxBal}  unit="GBUX" color="#FAAC47" loading={loadingBal} error={gbuxBal === null && !loadingBal} />
                  <BalanceRow label="GRUDA" value={grudaStats ? 'LIVE' : null} unit="" color="#22c55e" loading={loadingBal}
                    error={!grudaStats && !loadingBal} />
                  <BalanceRow label="POLY"  value={polyBal}  unit="MATIC" color="#8247E5" loading={loadingBal} error={polyBal === null && !loadingBal} />
                </>
              )}
            </Card>

            {/* GRUDA chain */}
            {grudaStats && (
              <Card title="Gruda Chain">
                <BalanceRow label="Status"  value={grudaStats.status}  unit="" color="#4ade80" />
                <BalanceRow label="Service" value={grudaStats.service} unit="" color="rgba(255,255,255,.6)" />
                <BalanceRow label="Version" value={grudaStats.version} unit="" color="rgba(255,255,255,.4)" />
              </Card>
            )}

            {/* Pair hardware device */}
            <Card title="Pair ESP32 Node">
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>
                Enter the 6-char code shown on your hardware node display
              </p>
              <input
                value={pairCode}
                onChange={e => setPairCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && pairDevice()}
                placeholder="A1B2C3"
                maxLength={6}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 20, textAlign: 'center',
                  letterSpacing: 10, background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, color: '#FAAC47', outline: 'none',
                }}
              />
              <button
                onClick={pairDevice}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'linear-gradient(135deg,#DB6331,#FAAC47)', border: 'none', borderRadius: 8, color: '#0a0a12', fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 900, letterSpacing: 2, cursor: 'pointer' }}>
                PAIR DEVICE
              </button>
              {pairMsg && (
                <p style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: pairMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>
                  {pairMsg}
                </p>
              )}
            </Card>

            {/* Device info */}
            <Card title="Node Info">
              <BalanceRow label="Firmware"  value={FIRMWARE_VER}  unit="" color="rgba(255,255,255,.5)" />
              <BalanceRow label="Hardware"  value={HARDWARE_TYPE} unit="" color="rgba(255,255,255,.5)" />
              <BalanceRow label="Uptime"    value={fmtUptime(uptime)} unit="" color="rgba(255,255,255,.5)" />
              <BalanceRow label="Heartbeat" value={heartbeatTs ? `${Math.floor((Date.now()-heartbeatTs)/1000)}s ago` : 'pending'} unit="" color={heartbeatTs && (Date.now()-heartbeatTs)<35000 ? '#4ade80' : '#f87171'} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
