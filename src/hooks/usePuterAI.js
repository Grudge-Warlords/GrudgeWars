import { useState, useCallback, useRef, useEffect } from 'react';
import { puterAI, isPuterAvailable } from '../utils/puterService';

export function useBattleNarration() {
  const [narration, setNarration] = useState(null);
  const pendingRef = useRef(false);
  const timeoutRef = useRef(null);

  const narrateAction = useCallback(async (attacker, defender, ability, damage) => {
    if (!isPuterAvailable() || pendingRef.current) return;
    pendingRef.current = true;
    try {
      const text = await puterAI.battleNarration(attacker, defender, ability, damage);
      setNarration(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setNarration(null), 6000);
    } catch (err) {
      console.warn('[Puter AI] Battle narration failed:', err);
    } finally {
      pendingRef.current = false;
    }
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return { narration, narrateAction };
}

export function useLocationLore() {
  const [lore, setLore] = useState(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  const generateZoneLore = useCallback(async (zoneName, zoneDescription) => {
    if (!isPuterAvailable()) return null;
    if (cacheRef.current[zoneName]) {
      setLore(cacheRef.current[zoneName]);
      return cacheRef.current[zoneName];
    }
    setLoading(true);
    try {
      const text = await puterAI.generateLore(
        `Generate a short atmospheric lore snippet for the zone "${zoneName}". Base description: ${zoneDescription}`
      );
      cacheRef.current[zoneName] = text;
      setLore(text);
      return text;
    } catch (err) {
      console.warn('[Puter AI] Lore generation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lore, loading, generateZoneLore };
}

export function useNpcDialogue() {
  const [dialogue, setDialogue] = useState(null);
  const [loading, setLoading] = useState(false);

  const askNpc = useCallback(async (npcName, context) => {
    if (!isPuterAvailable()) return null;
    setLoading(true);
    try {
      const text = await puterAI.npcDialogue(npcName, context);
      setDialogue(text);
      return text;
    } catch (err) {
      console.warn('[Puter AI] NPC dialogue failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { dialogue, loading, askNpc };
}
