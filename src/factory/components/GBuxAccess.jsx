import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getPricing, createWallet, getWallet, purchasePackage, getBalance, FEATURE_NAMES } from '../../services/gbuxClient.js';

export default function GBuxAccess({ userId, onAccessGranted, requiredFeature }) {
  const [pricing, setPricing] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [walletMode, setWalletMode] = useState('managed');
  const [externalWallet, setExternalWallet] = useState('');
  const [tokenPrice, setTokenPrice] = useState(null);

  const { publicKey, connected, disconnect: adapterDisconnect } = useWallet();

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    if (connected && publicKey) {
      handleAdapterConnect();
    }
  }, [connected, publicKey]);

  async function handleAdapterConnect() {
    const address = publicKey.toString();
    setLoading(true);
    setError(null);
    try {
      const balResult = await getBalance(address);
      setWallet({ address, type: 'wallet-adapter', name: 'Solana Wallet' });
      setBalance(balResult.balance || 0);
      setSuccess(`Wallet connected! Address: ${address.slice(0, 6)}...${address.slice(-4)}`);
      localStorage.setItem('connectedWallet', JSON.stringify({ address, type: 'wallet-adapter', name: 'Solana Wallet' }));
    } catch (e) {
      setError(`Failed to check balance: ${e.message}`);
    }
    setLoading(false);
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const savedWallet = localStorage.getItem('connectedWallet');
      if (savedWallet) {
        try {
          const parsed = JSON.parse(savedWallet);
          if (parsed.address) {
            const balResult = await getBalance(parsed.address);
            setWallet(parsed);
            setBalance(balResult.balance || 0);
          }
        } catch {}
      }

      const [pricingData, walletData] = await Promise.allSettled([
        getPricing(),
        userId ? getWallet(userId) : Promise.resolve(null),
      ]);

      if (pricingData.status === 'fulfilled') {
        setPricing(pricingData.value);
        if (pricingData.value?.tokenPrice) setTokenPrice(pricingData.value.tokenPrice);
      }
      if (walletData.status === 'fulfilled' && walletData.value && !savedWallet) {
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
      const address = walletMode === 'external' && externalWallet
        ? externalWallet
        : undefined;
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

  function handleDisconnect() {
    setWallet(null);
    setBalance(0);
    setWalletMode('managed');
    localStorage.removeItem('connectedWallet');
    if (connected) {
      try { adapterDisconnect(); } catch {}
    }
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
      <style>{`
        .wallet-adapter-button-trigger {
          background: linear-gradient(135deg, #a855f7, #7c3aed) !important;
          border-radius: 10px !important;
          font-family: 'Jost', sans-serif !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          height: 44px !important;
          padding: 0 24px !important;
          transition: all 0.2s !important;
        }
        .wallet-adapter-button-trigger:hover {
          background: linear-gradient(135deg, #9333ea, #6d28d9) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3) !important;
        }
        .wallet-adapter-modal-wrapper {
          background: rgba(10, 10, 20, 0.98) !important;
          border: 1px solid rgba(168, 85, 247, 0.2) !important;
          border-radius: 16px !important;
          font-family: 'Jost', sans-serif !important;
        }
        .wallet-adapter-modal-title {
          font-family: 'Cinzel', serif !important;
          color: #e2e8f0 !important;
        }
        .wallet-adapter-modal-list li {
          border-radius: 10px !important;
        }
        .wallet-adapter-modal-list .wallet-adapter-button {
          border-radius: 10px !important;
          font-family: 'Jost', sans-serif !important;
        }
        .wallet-adapter-modal-button-close {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .wallet-adapter-dropdown {
          display: flex;
          justify-content: center;
        }
      `}</style>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Wallet</div>
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                background: wallet.type === 'wallet-adapter' || wallet.type === 'external' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                color: wallet.type === 'wallet-adapter' ? '#a855f7' : wallet.type === 'external' ? '#06b6d4' : '#fbbf24',
                fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{wallet.type === 'wallet-adapter' ? 'Connected' : wallet.type === 'external' ? 'Manual' : 'Managed'}</span>
            </div>
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
          {(wallet.type === 'wallet-adapter' || wallet.type === 'external') && (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '4px 12px', borderRadius: '6px', border: '1px solid #334155',
                background: 'transparent', color: '#64748b', fontSize: '11px',
                cursor: 'pointer',
              }}
            >Disconnect</button>
          )}
        </div>
      )}

      {!wallet && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px',
          }}>
            <button
              onClick={() => setWalletMode('managed')}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid',
                borderColor: walletMode === 'managed' ? '#fbbf24' : '#1e293b',
                background: walletMode === 'managed' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                color: walletMode === 'managed' ? '#fbbf24' : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Easy (Managed)</button>
            <button
              onClick={() => setWalletMode('adapter')}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid',
                borderColor: walletMode === 'adapter' ? '#a855f7' : '#1e293b',
                background: walletMode === 'adapter' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                color: walletMode === 'adapter' ? '#a855f7' : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Connect Wallet</button>
            <button
              onClick={() => setWalletMode('external')}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid',
                borderColor: walletMode === 'external' ? '#06b6d4' : '#1e293b',
                background: walletMode === 'external' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                color: walletMode === 'external' ? '#06b6d4' : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Enter Address</button>
          </div>

          {walletMode === 'adapter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <WalletMultiButton />
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '320px', lineHeight: 1.5 }}>
                Connect any Solana wallet — Phantom, Solflare, Backpack, Ledger, and more.
                Your wallet will be detected automatically.
              </div>
              <div style={{
                display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
                marginTop: '4px',
              }}>
                {['Phantom', 'Solflare', 'Backpack', 'Ledger', 'Torus', 'Coinbase'].map(name => (
                  <span key={name} style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.08)',
                    color: '#94a3b8', border: '1px solid rgba(168, 85, 247, 0.15)',
                  }}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {walletMode === 'managed' && (
            <div>
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
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                No wallet app needed. We manage everything for you.
              </div>
            </div>
          )}

          {walletMode === 'external' && (
            <div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  Enter your Solana wallet address to check GBuX balance
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                Advanced users. Use your own wallet to hold GBuX tokens.
              </div>
            </div>
          )}
        </div>
      )}

      {tokenPrice && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px',
          padding: '10px 16px', borderRadius: '10px', flexWrap: 'wrap',
          background: 'rgba(251, 191, 36, 0.04)', border: '1px solid rgba(251, 191, 36, 0.1)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>GBuX Price</div>
            <div style={{ fontSize: '16px', color: '#fbbf24', fontWeight: '700' }}>${tokenPrice.priceUsd.toFixed(6)}</div>
          </div>
          {tokenPrice.marketCap > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Market Cap</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>
                ${tokenPrice.marketCap >= 1000000 ? (tokenPrice.marketCap / 1000000).toFixed(2) + 'M' : tokenPrice.marketCap >= 1000 ? (tokenPrice.marketCap / 1000).toFixed(1) + 'K' : tokenPrice.marketCap.toFixed(0)}
              </div>
            </div>
          )}
          {tokenPrice.volume24h > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>24h Vol</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>
                ${tokenPrice.volume24h >= 1000 ? (tokenPrice.volume24h / 1000).toFixed(1) + 'K' : tokenPrice.volume24h.toFixed(0)}
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Source</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{tokenPrice.source}</div>
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
                  }}>
                    {pkg.liveUsdPrice != null ? `$${pkg.liveUsdPrice.toFixed(2)}` : `$${pkg.usdPrice}`}
                  </div>
                  {pkg.liveUsdPrice != null && pkg.liveUsdPrice !== pkg.usdPrice && (
                    <div style={{ fontSize: '11px', color: '#64748b', textDecoration: 'line-through', marginBottom: '2px' }}>
                      was ${pkg.usdPrice}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>
                    {pkg.gbuxAmount.toLocaleString()} GBuX
                  </div>
                  {pkg.pricePerGbux && (
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>
                      ${pkg.pricePerGbux.toFixed(6)} per GBuX
                    </div>
                  )}
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
