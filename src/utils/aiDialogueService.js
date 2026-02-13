import { puterAI, puterKV, isPuterAvailable } from './puterService';

const HERO_PROFILE_PREFIX = 'hero-profile:';
const HERO_HISTORY_PREFIX = 'hero-history:';
const PLAYER_STYLE_KEY = 'player-style';
const MAX_HISTORY_ENTRIES = 30;
const RATE_LIMIT_MS = 3000;
const CACHE_TTL_MS = 60000;

let lastCallTime = 0;
const responseCache = new Map();

function heroSHA(heroId) {
  let hash = 0;
  const str = `bw-hero-${heroId}`;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return `sha-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function buildHeroIdentity(hero) {
  return {
    uid: heroSHA(hero.id),
    name: hero.name,
    race: hero.raceId,
    class: hero.classId,
    level: hero.level || 1,
    id: hero.id,
  };
}

const PERSONALITY_SEEDS = {
  warrior: { traits: 'brave, direct, protective, battle-hungry', voice: 'speaks with military confidence and honor' },
  mage: { traits: 'curious, mystical, scholarly, contemplative', voice: 'speaks with arcane wisdom about ocean magic and ley currents' },
  rogue: { traits: 'cunning, stealthy, witty, street-smart', voice: 'speaks with sly humor and keen observation' },
  cleric: { traits: 'compassionate, devout, calm, resolute', voice: 'speaks with spiritual reverence for Poseidon and the ocean' },
};

const RACE_FLAVOR = {
  blue_betta: 'Halfmoon betta with majestic fan-shaped fins, graceful and regal',
  red_betta: 'Plakat betta with short powerful fins, aggressive and fearless fighter',
  purple_betta: 'Doubletail betta with twin caudal fins, perceptive and elegant',
  white_betta: 'Cambodian betta with pale translucent scales, serene and clear-minded',
  green_betta: 'Giant betta of massive size, strong and imposing protector',
  gold_betta: 'Crowntail betta with spiked ray fins, proud and commanding',
  orange_betta: 'Dragonscale betta with thick metallic scales, resilient and fiery',
  pink_betta: 'Butterfly betta with banded patterned fins, graceful and deceptive in combat',
};

function buildSystemPrompt(hero, context = {}) {
  const identity = buildHeroIdentity(hero);
  const classSeed = PERSONALITY_SEEDS[hero.classId] || PERSONALITY_SEEDS.warrior;
  const raceFlavor = RACE_FLAVOR[hero.raceId] || 'a unique betta fish warrior';

  let prompt = `You are ${identity.name} (ID: ${identity.uid}), a level ${identity.level} ${raceFlavor} of the ${hero.classId} class in "Betta Warlords," an underwater RPG set in the Sunken Kingdom of Abyssia.

PERSONALITY: ${classSeed.traits}. You ${classSeed.voice}.
WORLD: Underwater ocean kingdom with coral reefs, deep trenches, volcanic vents, frozen depths. Currency is Pearls. Enemies are sea creatures.`;

  if (context.memory) {
    prompt += `\n\nYOUR RECENT MEMORY:\n${context.memory}`;
  }

  if (context.playerStyle) {
    prompt += `\n\nPLAYER TENDENCY: ${context.playerStyle}`;
  }

  prompt += `\n\nRULES: Respond in 1-2 sentences only. Stay in character. Use ocean/underwater themes. Never break the fourth wall. Do NOT prefix with your name.`;

  return prompt;
}

async function rateLimitedCall(fn) {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastCallTime));
  if (wait > 0) {
    await new Promise(r => setTimeout(r, wait));
  }
  lastCallTime = Date.now();
  return fn();
}

function getCacheKey(heroId, contextType, contextData) {
  return `${heroId}:${contextType}:${JSON.stringify(contextData).slice(0, 100)}`;
}

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.text;
  }
  return null;
}

function setCachedResponse(key, text) {
  responseCache.set(key, { text, time: Date.now() });
  if (responseCache.size > 50) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
}

export async function loadHeroProfile(heroId) {
  if (!isPuterAvailable()) return null;
  try {
    return await puterKV.load(`${HERO_PROFILE_PREFIX}${heroId}`);
  } catch { return null; }
}

export async function saveHeroProfile(heroId, profile) {
  if (!isPuterAvailable()) return;
  try {
    await puterKV.save(`${HERO_PROFILE_PREFIX}${heroId}`, profile);
  } catch {}
}

export async function loadHeroHistory(heroId) {
  if (!isPuterAvailable()) return [];
  try {
    const data = await puterKV.load(`${HERO_HISTORY_PREFIX}${heroId}`);
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export async function appendHeroHistory(heroId, entry) {
  if (!isPuterAvailable()) return;
  try {
    const history = await loadHeroHistory(heroId);
    history.push({ ...entry, timestamp: Date.now() });
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }
    await puterKV.save(`${HERO_HISTORY_PREFIX}${heroId}`, history);
  } catch {}
}

export async function loadPlayerStyle() {
  if (!isPuterAvailable()) return null;
  try {
    return await puterKV.load(PLAYER_STYLE_KEY);
  } catch { return null; }
}

export async function savePlayerStyle(style) {
  if (!isPuterAvailable()) return;
  try {
    await puterKV.save(PLAYER_STYLE_KEY, style);
  } catch {}
}

export function computePlayerStyleSummary(styleData) {
  if (!styleData) return '';
  const parts = [];
  const { battles = 0, explores = 0, trades = 0, heals = 0, bossAttempts = 0 } = styleData;
  const total = battles + explores + trades + heals;
  if (total === 0) return 'New adventurer, still finding their way.';

  if (battles / total > 0.5) parts.push('aggressive fighter');
  else if (battles / total > 0.3) parts.push('balanced combatant');
  if (explores / total > 0.3) parts.push('curious explorer');
  if (trades / total > 0.2) parts.push('savvy trader');
  if (heals / total > 0.2) parts.push('cautious, prefers staying healed');
  if (bossAttempts > 3) parts.push('boss hunter');

  return parts.length > 0
    ? `The player is a ${parts.join(', ')}.`
    : 'Balanced play style.';
}

function buildMemorySummary(history) {
  if (!history || history.length === 0) return '';
  const recent = history.slice(-8);
  return recent.map(e => {
    if (e.type === 'dialogue') return `Said: "${e.text}"`;
    if (e.type === 'battle') return `Fought ${e.enemy} - ${e.result}`;
    if (e.type === 'event') return e.text;
    return '';
  }).filter(Boolean).join('. ');
}

export async function generateAIDialogue(hero, contextType, contextData = {}) {
  if (!isPuterAvailable()) return null;

  const cacheKey = getCacheKey(hero.id, contextType, contextData);
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  try {
    const [history, playerStyle] = await Promise.all([
      loadHeroHistory(hero.id),
      loadPlayerStyle(),
    ]);

    const memory = buildMemorySummary(history);
    const styleSummary = computePlayerStyleSummary(playerStyle);

    const systemPrompt = buildSystemPrompt(hero, { memory, playerStyle: styleSummary });

    let userPrompt = '';
    switch (contextType) {
      case 'idle_chat': {
        const { zoneName, trigger, allyName, allyLine } = contextData;
        if (allyLine) {
          userPrompt = `You are in ${zoneName || 'the depths'}. Your ally ${allyName} just said: "${allyLine}". Reply in character.`;
        } else if (trigger === 'low_health') {
          userPrompt = `You are wounded and low on health in ${zoneName || 'the depths'}. Express your current state.`;
        } else if (trigger === 'high_gold') {
          userPrompt = `Your school has amassed many pearls. Comment on the wealth.`;
        } else if (trigger === 'low_gold') {
          userPrompt = `Your school is low on pearls. React to the poverty.`;
        } else if (trigger === 'boss_nearby') {
          userPrompt = `A powerful predator lurks in ${zoneName || 'this zone'}. React to the danger.`;
        } else if (trigger === 'boss_defeated') {
          userPrompt = `You just defeated the boss of ${zoneName || 'this zone'}! Celebrate.`;
        } else if (trigger === 'high_conquer') {
          userPrompt = `You have conquered most of ${zoneName || 'this zone'}. Comment on your progress.`;
        } else if (trigger === 'new_zone') {
          userPrompt = `You just arrived in a new zone: ${zoneName || 'unknown waters'}. React to the new environment.`;
        } else {
          userPrompt = `You are idle in ${zoneName || 'the depths'} with your school of allies. Say something in character - about the surroundings, your adventures, or your feelings.`;
        }
        break;
      }
      case 'battle_narration': {
        const { attacker, defender, ability, damage } = contextData;
        userPrompt = `Narrate this battle moment: ${attacker} uses ${ability} against ${defender} for ${damage} damage. Describe it dramatically in 1 sentence.`;
        break;
      }
      case 'lore': {
        userPrompt = contextData.prompt || `Generate atmospheric lore about ${contextData.zoneName || 'the deep ocean'}.`;
        break;
      }
      case 'npc_dialogue': {
        userPrompt = contextData.prompt || `Respond as an NPC in the underwater kingdom.`;
        break;
      }
      default:
        userPrompt = 'Say something in character about your underwater adventures.';
    }

    const text = await rateLimitedCall(() =>
      puterAI.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
    );

    const result = typeof text === 'string' ? text : text?.message?.content || text?.toString() || '';
    const cleaned = result.replace(/^["']|["']$/g, '').trim();

    if (cleaned) {
      setCachedResponse(cacheKey, cleaned);

      appendHeroHistory(hero.id, {
        type: 'dialogue',
        text: cleaned.slice(0, 200),
        context: contextType,
      }).catch(() => {});
    }

    return cleaned || null;
  } catch (err) {
    console.warn('[AI Dialogue] Generation failed:', err);
    return null;
  }
}

export async function generateAIBattleNarration(hero, attacker, defender, ability, damage) {
  return generateAIDialogue(hero, 'battle_narration', { attacker, defender, ability, damage });
}

export async function generateAILore(hero, zoneName, zoneDescription) {
  return generateAIDialogue(hero, 'lore', {
    zoneName,
    prompt: `Generate a short atmospheric lore snippet (2-3 sentences) about "${zoneName}". Context: ${zoneDescription}`,
  });
}

export async function generateAINpcDialogue(hero, npcName, context) {
  return generateAIDialogue(hero, 'npc_dialogue', {
    prompt: `You are speaking with ${npcName}. Context: ${context}. Respond as ${npcName} would.`,
  });
}

export async function logBattleEvent(heroId, enemy, result) {
  await appendHeroHistory(heroId, { type: 'battle', enemy, result });
}

export async function logGameEvent(heroId, text) {
  await appendHeroHistory(heroId, { type: 'event', text });
}

export function trackPlayerAction(currentStyle, actionType) {
  const style = { ...(currentStyle || { battles: 0, explores: 0, trades: 0, heals: 0, bossAttempts: 0 }) };
  switch (actionType) {
    case 'battle': style.battles = (style.battles || 0) + 1; break;
    case 'explore': style.explores = (style.explores || 0) + 1; break;
    case 'trade': style.trades = (style.trades || 0) + 1; break;
    case 'heal': style.heals = (style.heals || 0) + 1; break;
    case 'boss': style.bossAttempts = (style.bossAttempts || 0) + 1; break;
  }
  return style;
}
