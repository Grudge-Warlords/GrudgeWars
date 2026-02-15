import { useState, useCallback, useRef, useEffect } from 'react';
import { isPuterAvailable } from '../utils/puterService';
import {
  generateAIBattleNarration,
  generateAILore,
  generateAINpcDialogue,
} from '../utils/aiDialogueService';

const BATTLE_FALLBACKS = [
  (a, d, ab, dmg) => `${a} strikes ${d} with ${ab}, dealing ${dmg} damage as the currents swirl!`,
  (a, d, ab, dmg) => `A flash of ${ab} erupts from ${a}, crashing into ${d} for ${dmg} damage!`,
  (a, d, ab, dmg) => `${a} unleashes ${ab} upon ${d}, the deep waters trembling with ${dmg} damage!`,
];

const LORE_FALLBACKS = [
  (z) => `The ancient waters of ${z} hold secrets that even the oldest currents have forgotten. Whispers of the First Current War echo through these depths.`,
  (z) => `${z} pulses with a mysterious energy. Bioluminescent patterns shift across the roots, spelling warnings in a language long forgotten.`,
  (z) => `Few dare to venture deep into ${z}. Those who return speak of strange lights and the distant song of leviathans.`,
];

export function useBattleNarration() {
  const [narration, setNarration] = useState(null);
  const pendingRef = useRef(false);
  const timeoutRef = useRef(null);

  const narrateAction = useCallback(async (attacker, defender, ability, damage, heroContext) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      let text = null;
      if (isPuterAvailable()) {
        const hero = heroContext || { id: 'narrator', name: attacker, classId: 'warrior', raceId: 'blue_betta', level: 1 };
        text = await generateAIBattleNarration(hero, attacker, defender, ability, damage);
      }
      if (!text) {
        const fn = BATTLE_FALLBACKS[Math.floor(Math.random() * BATTLE_FALLBACKS.length)];
        text = fn(attacker, defender, ability, damage);
      }
      setNarration(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setNarration(null), 6000);
    } catch (err) {
      console.warn('[AI] Battle narration failed:', err);
      const fn = BATTLE_FALLBACKS[Math.floor(Math.random() * BATTLE_FALLBACKS.length)];
      setNarration(fn(attacker, defender, ability, damage));
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

  const generateZoneLore = useCallback(async (zoneName, zoneDescription, heroContext) => {
    if (cacheRef.current[zoneName]) {
      setLore(cacheRef.current[zoneName]);
      return cacheRef.current[zoneName];
    }
    setLoading(true);
    try {
      let text = null;
      if (isPuterAvailable()) {
        const hero = heroContext || { id: 'lorekeeper', name: 'Narrator', classId: 'mage', raceId: 'purple_betta', level: 1 };
        text = await generateAILore(hero, zoneName, zoneDescription);
      }
      if (!text) {
        const fn = LORE_FALLBACKS[Math.floor(Math.random() * LORE_FALLBACKS.length)];
        text = fn(zoneName);
      }
      cacheRef.current[zoneName] = text;
      setLore(text);
      return text;
    } catch (err) {
      console.warn('[AI] Lore generation failed:', err);
      const fn = LORE_FALLBACKS[Math.floor(Math.random() * LORE_FALLBACKS.length)];
      const fallback = fn(zoneName);
      setLore(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lore, loading, generateZoneLore };
}

export function useNpcDialogue() {
  const [dialogue, setDialogue] = useState(null);
  const [loading, setLoading] = useState(false);

  const askNpc = useCallback(async (npcName, context, heroContext) => {
    setLoading(true);
    try {
      let text = null;
      if (isPuterAvailable()) {
        const hero = heroContext || { id: 'npc-talk', name: 'Traveler', classId: 'warrior', raceId: 'blue_betta', level: 1 };
        text = await generateAINpcDialogue(hero, npcName, context);
      }
      if (!text) {
        text = `${npcName} gazes at you through the murky water. "The currents carry many tales, traveler. What brings you to these depths?"`;
      }
      setDialogue(text);
      return text;
    } catch (err) {
      console.warn('[AI] NPC dialogue failed:', err);
      const fallback = `${npcName} nods slowly. "These waters hold many secrets. Perhaps you will uncover them in time."`;
      setDialogue(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  return { dialogue, loading, askNpc };
}
