import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { legion } from '../utils/legionService';

/**
 * useLegion — React hook for the Gruda Legion AI system.
 *
 * Provides:
 *  - trackEvent(type, data)  → log a game event to Legion telemetry
 *  - query(prompt, context)  → ask the Legion AI a question
 *  - history                 → array of { prompt, response, ts } for the session
 *  - isLoading               → true while a query is in flight
 *  - error                   → last error string or null
 *  - legionState             → current Legion client state snapshot
 *
 * USAGE:
 *   const { trackEvent, query, history, isLoading } = useLegion();
 *
 *   // In battle component:
 *   trackEvent('battle_start', { enemy: 'Reef Goblin', zone: 'Coral Reef' });
 *
 *   // In debug panel or AI editor:
 *   const result = await query('Suggest a loot drop for a level 5 player in zone 3');
 */
export function useLegion({ autoInit = true } = {}) {
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [legionState, setLegionState] = useState(() => legion.getState());
  const abortRef = useRef(null);

  // Init Legion on mount and keep scene in sync with router
  useEffect(() => {
    if (autoInit) {
      legion.init({ scene: location.pathname });
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [autoInit]);

  // Track scene changes automatically
  useEffect(() => {
    legion.setScene(location.pathname);
    setLegionState(legion.getState());
  }, [location.pathname]);

  const trackEvent = useCallback((type, data = {}) => {
    legion.track(type, data);
    setLegionState(legion.getState());
  }, []);

  const query = useCallback(async (prompt, extraContext = {}, options = {}) => {
    if (isLoading) return null;
    setIsLoading(true);
    setError(null);

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const result = await legion.query(prompt, extraContext, {
        ...options,
        signal: abortRef.current.signal,
      });

      const entry = { prompt, response: result.response, ts: result.ts || Date.now() };
      setHistory(prev => [...prev, entry]);
      setLegionState(legion.getState());
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      const msg = err.message || 'Legion query failed';
      setError(msg);
      console.warn('[useLegion] Query error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    trackEvent,
    query,
    history,
    isLoading,
    error,
    legionState,
    clearHistory,
    sessionId: legion.SESSION_ID,
  };
}

export default useLegion;
