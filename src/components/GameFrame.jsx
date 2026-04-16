import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuth';

/**
 * GameFrame mounts a game module into a container div.
 * Passes auth context and GBuX earning hooks to the game.
 *
 * @param {string} gameId - Unique identifier for this game
 * @param {Function} mountFn - Function that mounts the game into a container element
 * @param {Function} [unmountFn] - Optional cleanup function
 */
export default function GameFrame({ gameId, mountFn, unmountFn }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { user, isLoggedIn, earnGBux, loginGuest } = useAuthStore();

  useEffect(() => {
    // Auto-login as guest if not logged in
    if (!isLoggedIn) {
      loginGuest().catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!containerRef.current || !mountFn) return;

    // Expose game bridge on window for the game to call
    window.__grudge = {
      user,
      isLoggedIn,
      gameId,
      earnGBux: (amount, reason) => earnGBux(amount, reason || gameId),
      goBack: () => navigate('/'),
    };

    // Mount the game
    const cleanup = mountFn(containerRef.current);

    return () => {
      if (unmountFn) unmountFn();
      if (typeof cleanup === 'function') cleanup();
      delete window.__grudge;
    };
  }, [mountFn, user]);

  return (
    <div className="game-container">
      <button className="game-frame-back" onClick={() => navigate('/')}>
        ← Back
      </button>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }} />
    </div>
  );
}
