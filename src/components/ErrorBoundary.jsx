import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Grudge Warlords Error:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      const { useGameStore } = require('../stores/gameStore');
      if (useGameStore?.getState) {
        useGameStore.getState().setScreen?.('title');
      }
    } catch (e) {}
  };

  handleHardReset = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'linear-gradient(135deg, #0a0a12 0%, #1a0a1a 50%, #0a0a12 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel', serif",
          color: '#e8d5b0',
          zIndex: 999999,
        }}>
          <div style={{
            maxWidth: 500, textAlign: 'center', padding: 40,
            background: 'rgba(20,15,10,0.8)',
            border: '2px solid rgba(184,134,11,0.4)',
            borderRadius: 12,
            boxShadow: '0 0 40px rgba(184,134,11,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8, filter: 'grayscale(0.3)' }}>
              &#x2694;
            </div>
            <h1 style={{
              fontSize: '1.4rem', color: '#d4a44a', marginBottom: 8,
              textShadow: '0 0 10px rgba(212,164,74,0.3)',
            }}>
              The Realm Has Faltered
            </h1>
            <p style={{
              fontSize: '0.9rem', color: 'rgba(232,213,176,0.7)',
              lineHeight: 1.6, marginBottom: 24,
              fontFamily: "'Jost', sans-serif",
            }}>
              An unexpected disruption struck the battlefield. Your progress is safe.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRecover}
                style={{
                  padding: '10px 24px', fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #2a5a1a, #1a3a10)',
                  border: '1px solid rgba(100,200,80,0.4)',
                  borderRadius: 6, color: '#b8e8a0',
                  cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = 'linear-gradient(135deg, #3a7a2a, #2a5a1a)'}
                onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, #2a5a1a, #1a3a10)'}
              >
                Try to Recover
              </button>
              <button
                onClick={this.handleHardReset}
                style={{
                  padding: '10px 24px', fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #3a2a15, #2a1a0a)',
                  border: '1px solid rgba(184,134,11,0.3)',
                  borderRadius: 6, color: '#d4a44a',
                  cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = 'linear-gradient(135deg, #4a3a20, #3a2a15)'}
                onMouseLeave={e => e.target.style.background = 'linear-gradient(135deg, #3a2a15, #2a1a0a)'}
              >
                Return to Title
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: 20, textAlign: 'left' }}>
                <summary style={{
                  cursor: 'pointer', fontSize: '0.75rem',
                  color: 'rgba(232,213,176,0.4)',
                  fontFamily: "'Jost', sans-serif",
                }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: 8, padding: 10,
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 4, fontSize: '0.65rem',
                  color: 'rgba(255,150,150,0.7)',
                  overflow: 'auto', maxHeight: 120,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack?.slice(0, 500)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
