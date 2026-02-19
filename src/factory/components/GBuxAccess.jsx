import React, { useState, useEffect } from 'react';
import { getPricing, createWallet, getWallet, purchasePackage, getBalance, FEATURE_NAMES } from '../../services/gbuxClient.js';

export default function GBuxAccess({ userId, onAccessGranted, requiredFeature }) {
  const [pricing, setPricing] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [externalWallet, setExternalWallet] = useState('');
  const [useExternal, setUseExternal] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [pricingData, walletData] = await Promise.allSettled([
        getPricing(),
        userId ? getWallet(userId) : Promise.resolve(null),
      ]);

      if (pricingData.status === 'fulfilled') setPricing(pricingData.value);
      if (walletData.status === 'fulfilled' && walletData.value) {
        setWallet(walletData.value.wallet);
        setBalance(walletData.value.balance || 0);
      }
    } catch (e) {
      console.warn('GBuX load:', e.message);
    }
    setLoading(false);
  }

  async function handleCreateWallet() {
    if (!userId) {
      setError('Please log in with Discord first to create a wallet');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createWallet(userId);
      setWallet(result.wallet);
      setBalance(result.balance || 0);
      if (result.existing) {
        setSuccess('Wallet connected!');
      } else {
        setSuccess('Wallet created! You can now purchase GBuX.');
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handlePurchase(packageId) {
    if (!userId) {
      setError('Please log in first');
      return;
    }
    setPurchasing(packageId);
    setError(null);
    setSuccess(null);
    try {
      const address = useExternal && externalWallet ? externalWallet : undefined;
      const result = await purchasePackage(userId, packageId, address);
      setBalance(result.newBalance);
      setSuccess(`${result.package} purchased! ${result.gbuxAmount} GBuX added. Tx: ${result.signature.slice(0, 8)}...`);
      if (onAccessGranted) onAccessGranted(result.newBalance);
    } catch (e) {
      setError(e.message);
    }
    setPurchasing(null);
  }

  async function handleCheckExternal() {
    if (!externalWallet) return;
    setLoading(true);
    try {
      const result = await getBalance(externalWallet);
      setBalance(result.balance);
      setWallet({ address: externalWallet, type: 'external' });
      setSuccess(`Connected! Balance: ${result.balance} GBuX`);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  const featureCost = pricing?.featureCosts?.[requiredFeature] || 0;
  const hasAccess = balance >= featureCost;

  useEffect(() => {
    if (hasAccess && requiredFeature && onAccessGranted) {
      onAccessGranted(balance);
    }
  }, [hasAccess, balance, requiredFeature]);

  if (hasAccess && requiredFeature) {
    return null;
  }

  return (
    <div style={{
      background: 'rgba(10, 10, 15, 0.95)',
      border: '1px solid rgba(251, 191, 36, 0.15)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: "'Jost', sans-serif",
      color: '#e2e8f0',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <img src="/images/gruda_logo.png" alt="GBuX" style={{ height: '48px', marginBottom: '12px' }} />
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '28px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>GBuX Token Access</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          {requiredFeature
            ? `${FEATURE_NAMES[requiredFeature] || requiredFeature} requires ${featureCost} GBuX`
            : 'Purchase GBuX to unlock AI game creation, deployments, and more'}
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          color: '#fca5a5', fontSize: '13px', textAlign: 'center',
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px', padding: '12px', marginBottom: '16px',
          color: '#86efac', fontSize: '13px', textAlign: 'center',
        }}>{success}</div>
      )}

      {wallet && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.06)',
          border: '1px solid rgba(251, 191, 36, 0.12)',
          borderRadius: '12px', padding: '16px', marginBottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Wallet</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Pending...'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Balance</div>
            <div style={{
              fontSize: '24px', fontFamily: "'Cinzel', serif", fontWeight: '700',
              color: '#fbbf24',
            }}>{balance.toLocaleString()} <span style={{ fontSize: '14px', color: '#f59e0b' }}>GBuX</span></div>
          </div>
        </div>
      )}

      {!wallet && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            onClick={handleCreateWallet}
            disabled={!userId}
            style={{
              padding: '14px 32px', borderRadius: '10px', border: 'none',
              background: userId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#334155',
              color: userId ? '#0a0a0f' : '#64748b',
              fontSize: '15px', fontWeight: '700', cursor: userId ? 'pointer' : 'not-allowed',
              marginBottom: '12px',
            }}
          >Create GBuX Wallet</button>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Powered by Crossmint server-side wallets on Solana
          </div>

          <div style={{
            marginTop: '16px', padding: '16px',
            border: '1px solid rgba(30, 41, 59, 0.6)', borderRadius: '10px',
          }}>
            <div
              onClick={() => setUseExternal(!useExternal)}
              style={{ fontSize: '13px', color: '#06b6d4', cursor: 'pointer', fontWeight: '600' }}
            >
              {useExternal ? 'Hide' : 'Or connect your own Solana wallet'}
            </div>
            {useExternal && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <input
                  value={externalWallet}
                  onChange={e => setExternalWallet(e.target.value)}
                  placeholder="Your Solana wallet address"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #1e293b', background: '#0f172a',
                    color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCheckExternal}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: '1px solid #06b6d4',
                    background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  }}
                >Connect</button>
              </div>
            )}
          </div>
        </div>
      )}

      {pricing && (
        <div>
          <h3 style={{
            fontFamily: "'Cinzel', serif", fontSize: '18px',
            textAlign: 'center', marginBottom: '16px', color: '#e2e8f0',
          }}>GBuX Packages</h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {Object.entries(pricing.pricing).map(([id, pkg]) => {
              const isPopular = id === 'creator';
              return (
                <div key={id} style={{
                  background: isPopular ? 'rgba(251, 191, 36, 0.06)' : 'rgba(15, 23, 42, 0.6)',
                  border: `2px solid ${isPopular ? 'rgba(251, 191, 36, 0.3)' : 'rgba(30, 41, 59, 0.6)'}`,
                  borderRadius: '16px', padding: '24px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}>
                  {isPopular && (
                    <div style={{
                      position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                      background: '#fbbf24', color: '#0a0a0f', fontSize: '10px', fontWeight: '700',
                      padding: '2px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px',
                    }}>Popular</div>
                  )}
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: '700',
                    color: '#e2e8f0', marginBottom: '4px',
                  }}>{pkg.label}</div>
                  <div style={{
                    fontSize: '32px', fontWeight: '700', color: '#fbbf24',
                    fontFamily: "'Cinzel', serif", marginBottom: '4px',
                  }}>${pkg.usdPrice}</div>
                  <div style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '16px' }}>
                    {pkg.gbuxAmount.toLocaleString()} GBuX
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                    {pkg.features.map(f => (
                      <li key={f} style={{
                        fontSize: '12px', color: '#94a3b8', padding: '3px 0',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <span style={{ color: '#22c55e' }}>+</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase(id)}
                    disabled={purchasing === id}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                      background: purchasing === id ? '#334155'
                        : isPopular ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#1e293b',
                      color: purchasing === id ? '#64748b' : isPopular ? '#0a0a0f' : '#e2e8f0',
                      fontSize: '13px', fontWeight: '700', cursor: purchasing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{purchasing === id ? 'Processing...' : 'Purchase'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pricing?.featureCosts && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{
            fontFamily: "'Cinzel', serif", fontSize: '14px',
            color: '#94a3b8', marginBottom: '10px', textAlign: 'center',
          }}>Feature Costs</h4>
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {Object.entries(pricing.featureCosts).map(([key, cost]) => (
              <div key={key} style={{
                padding: '6px 14px', borderRadius: '20px',
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b',
                fontSize: '11px', color: '#94a3b8',
              }}>
                {FEATURE_NAMES[key] || key}: <span style={{ color: '#fbbf24', fontWeight: '600' }}>{cost} GBuX</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
          Loading...
        </div>
      )}
    </div>
  );
}
