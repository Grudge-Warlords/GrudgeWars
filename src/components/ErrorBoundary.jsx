import React from 'react';
import useGameStore from '../stores/gameStore';

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
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReturnToWorld = () => {
    try {
      const state = useGameStore.getState();
      if (state.battleState) {
        state.returnToWorld();
      } else {
        useGameStore.setState({
          screen: 'world',
          battleState: null,
          battleUnits: [],
          battleTurnOrder: [],
          battleCurrentTurn: 0,
          selectedTargetId: null,
          lastAction: null,
          pendingLoot: [],
          battleResults: null,
          gameMessage: null,
        });
      }
    } catch (e) {
      useGameStore.setState({ screen: 'world', battleState: null, battleUnits: [], pendingLoot: [] });
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReturnToTitle = () => {
    try {
      useGameStore.setState({
        screen: 'title',
        battleState: null,
        battleUnits: [],
        battleTurnOrder: [],
        battleCurrentTurn: 0,
        selectedTargetId: null,
        lastAction: null,
        pendingLoot: [],
        battleResults: null,
        gameMessage: null,
      });
    } catch (e) {
      console.error('[ErrorBoundary] Failed to return to title:', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isBattle = this.props.name === 'battle';
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', width: '100%', background: 'linear-gradient(135deg, #041225, #0a1e3d)',
          padding: 20, textAlign: 'center', fontFamily: "'Jost', sans-serif",
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.5)', border: '2px solid #c5a059',
            borderRadius: 12, padding: '24px 32px', maxWidth: 400,
            boxShadow: '0 0 30px rgba(197,160,89,0.15)',
          }}>
            <div style={{ fontSize: '1.4rem', color: '#fbbf24', fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7dd3fc', marginBottom: 16, opacity: 0.8 }}>
              {this.props.name === 'battle' ? 'The battle encountered an issue.' : 'An unexpected error occurred.'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={this.handleRecover} style={{
                background: 'linear-gradient(135deg, #22d3ee, #10b981)', border: 'none',
                borderRadius: 8, padding: '10px 20px', color: '#0b1020',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
              }}>Try Again</button>
              {isBattle && (
                <button onClick={this.handleReturnToWorld} style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.1))',
                  border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 20px',
                  color: '#fbbf24', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}>Return to World</button>
              )}
              <button onClick={this.handleReturnToTitle} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, padding: '10px 20px', color: '#e0f2fe',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
              }}>Title Screen</button>
            </div>
            {this.state.error && (
              <div style={{
                marginTop: 12, fontSize: '0.55rem', color: '#ef4444', opacity: 0.6,
                maxHeight: 40, overflow: 'hidden', wordBreak: 'break-all',
              }}>
                {String(this.state.error?.message || this.state.error).slice(0, 200)}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
