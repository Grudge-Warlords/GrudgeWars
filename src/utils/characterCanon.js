/**
 * Canonical character identity for Grudge Wars 2D.
 *
 * Same race/class IDs as api.grudge-studio.com, GrudgeBuilder, and WCS —
 * this module only normalizes aliases and maps backend records into the
 * local heroRoster shape used by SpriteAnimation (race×class → 2D sprite).
 */

import { calculateStats } from '../data/attributes.js';
import { classDefinitions } from '../data/classes.js';
import { raceDefinitions } from '../data/races.js';
import { getStartingEquipment } from '../data/equipment.js';
import { getDefaultLoadout } from './abilityLoadout.js';

/** Whitelist from GRUDGE_LLM_PROMPT.md / api.grudge-studio.com */
export const CANONICAL_RACES = ['human', 'elf', 'dwarf', 'orc', 'undead', 'barbarian', 'goblin'];
export const CANONICAL_CLASSES = ['warrior', 'mage', 'ranger', 'worge'];

const RACE_ALIASES = {
  wk: 'human',
  crusade_human: 'human',
  brb: 'barbarian',
  dwf: 'dwarf',
  ud: 'undead',
};

const CLASS_ALIASES = {
  druid: 'worge',
  shapeshifter: 'worge',
  rogue: 'ranger',
  archer: 'ranger',
  cleric: 'mage',
  wizard: 'mage',
  priest: 'mage',
  knight: 'warrior',
};

const ATTR_KEYS = ['Strength', 'Vitality', 'Endurance', 'Dexterity', 'Agility', 'Intellect', 'Wisdom', 'Tactics'];

const ATTR_ALIASES = {
  strength: 'Strength',
  vitality: 'Vitality',
  endurance: 'Endurance',
  dexterity: 'Dexterity',
  agility: 'Agility',
  intellect: 'Intellect',
  intelligence: 'Intellect',
  wisdom: 'Wisdom',
  tactics: 'Tactics',
};

export function normalizeRaceId(raceId) {
  if (!raceId) return 'human';
  const key = String(raceId).toLowerCase().trim();
  const mapped = RACE_ALIASES[key] || key;
  return CANONICAL_RACES.includes(mapped) ? mapped : 'human';
}

export function normalizeClassId(classId) {
  if (!classId) return 'warrior';
  const key = String(classId).toLowerCase().trim();
  const mapped = CLASS_ALIASES[key] || key;
  return CANONICAL_CLASSES.includes(mapped) ? mapped : 'warrior';
}

/** Resolve race from a hero record that may use race, raceId, or legacy fields. */
export function resolveHeroRaceId(hero) {
  if (!hero) return 'human';
  return normalizeRaceId(hero.raceId || hero.race || hero.race_id);
}

/** Resolve class from a hero record that may use class, classId, or legacy fields. */
export function resolveHeroClassId(hero) {
  if (!hero) return 'warrior';
  return normalizeClassId(hero.classId || hero.class || hero.class_id);
}

export function normalizeAttributePoints(raw) {
  const zero = Object.fromEntries(ATTR_KEYS.map(k => [k, 0]));
  if (!raw || typeof raw !== 'object') return { ...zero };

  const out = { ...zero };
  Object.entries(raw).forEach(([key, val]) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    const canon = ATTR_ALIASES[key.toLowerCase()] || (ATTR_KEYS.includes(key) ? key : null);
    if (canon) out[canon] = n;
  });
  return out;
}

function hasStructuredEquipment(equipment) {
  if (!equipment || typeof equipment !== 'object') return false;
  return Object.values(equipment).some(
    v => v && typeof v === 'object' && (v.weaponType || v.stats || v.tier || v.name)
  );
}

function buildDefaultAttributes(raceId, classId) {
  const zero = Object.fromEntries(ATTR_KEYS.map(k => [k, 0]));
  const classDef = classDefinitions[classId];
  const raceDef = raceDefinitions[raceId];
  const attributePoints = { ...(classDef?.startingAttributes || zero) };
  if (raceDef?.bonuses) {
    Object.entries(raceDef.bonuses).forEach(([attr, val]) => {
      if (attributePoints[attr] !== undefined) attributePoints[attr] += val;
    });
  }
  return attributePoints;
}

/** api.grudge-studio.com list() may return an array or { characters: [] }. */
export function parseCharacterListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.characters && Array.isArray(data.characters)) return data.characters;
  return [];
}

/** Prefer warlords-era roster; fall back to all if none tagged. */
export function filterWarlordsCharacters(chars) {
  const warlords = chars.filter(c => !c.gameEra || c.gameEra === 'warlords');
  return warlords.length > 0 ? warlords : chars;
}

/**
 * Convert a canonical backend character into a Grudge Wars heroRoster entry.
 * Sprite rendering is unchanged — callers still use getPlayerSprite(raceId, classId).
 */
export function backendCharacterToHero(bc) {
  const raceId = normalizeRaceId(bc.raceId || bc.race || bc.race_id);
  const classId = normalizeClassId(bc.classId || bc.class || bc.class_id);
  const level = Math.max(1, bc.level || 1);

  const rawAttrs = bc.attributePoints || bc.attributes || {};
  const hasAttrs = Object.values(rawAttrs).some(v => Number(v) > 0);
  const attributePoints = hasAttrs
    ? normalizeAttributePoints(rawAttrs)
    : buildDefaultAttributes(raceId, classId);

  const equip = hasStructuredEquipment(bc.equipment)
    ? bc.equipment
    : getStartingEquipment(classId);

  const stats = calculateStats(attributePoints, level);
  const backendId = bc.id ?? bc.characterId;

  return {
    id: `backend_${backendId}`,
    backendId,
    name: bc.name || 'Hero',
    raceId,
    classId,
    level,
    xp: bc.xp || 0,
    attributePoints,
    baseAttributePoints: { ...attributePoints },
    unspentPoints: bc.unspentPoints ?? bc.unspentAttributePoints ?? 0,
    skillPoints: bc.skillPoints ?? 1,
    unlockedSkills: bc.unlockedSkills || bc.selectedSkills || {},
    equipment: equip,
    currentHealth: bc.currentHealth ?? bc.hp ?? Math.floor(stats.health),
    currentMana: bc.currentMana ?? bc.energy ?? bc.mana ?? Math.floor(stats.mana),
    currentStamina: bc.currentStamina ?? bc.stamina ?? Math.floor(stats.stamina),
    abilityLoadout: bc.abilityLoadout || getDefaultLoadout(classId, equip?.weapon?.weaponType),
    source: 'backend',
    namedHeroId: bc.namedHeroId || bc.grudaWarsData?.namedHeroId || null,
    avatarUrl: bc.avatarUrl || null,
    gameEra: bc.gameEra || 'warlords',
    activeForEra: bc.activeForEra ?? false,
  };
}

/** Merge backend truth into an existing local hero without losing battle progress. */
export function mergeBackendIntoHero(localHero, bc) {
  const fromBackend = backendCharacterToHero(bc);
  return {
    ...localHero,
    ...fromBackend,
    id: localHero.id,
    battleRecord: localHero.battleRecord || fromBackend.battleRecord,
    namedHeroId: localHero.namedHeroId || fromBackend.namedHeroId,
  };
}

/** Pick the account's active warlords character, else the first in list. */
export function pickPrimaryBackendCharacter(chars) {
  if (!chars?.length) return null;
  return chars.find(c => c.activeForEra) || chars[0];
}