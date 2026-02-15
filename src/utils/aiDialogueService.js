import { puterAI, puterKV, isPuterAvailable } from './puterService';
import { getHeroBestItems, checkBestItemEquipped, checkInventoryForBestItems } from '../data/heroBestItems';

const HERO_PROFILE_PREFIX = 'hero-profile:';
const HERO_HISTORY_PREFIX = 'hero-history:';
const PLAYER_STYLE_KEY = 'player-style';
const MAX_HISTORY_ENTRIES = 30;
const RATE_LIMIT_MS = 3000;
const CACHE_TTL_MS = 60000;
const PER_HERO_COOLDOWN_MS = 90000;

let lastCallTime = 0;
const responseCache = new Map();
const heroLastSpoke = new Map();
const usedSentences = new Map();
const heroCallCount = new Map();

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

const BETTA_WIKI_KNOWLEDGE = `REAL BETTA FACTS (use naturally in dialogue):
- Betta splendens are labyrinth breathers who gulp air from the surface
- Wild bettas live in rice paddies, floodplains, and canals of Thailand, Cambodia, Laos, Vietnam
- Males build bubble nests at the surface for their young, tending eggs with devoted care
- Bettas are carnivores: they eat zooplankton, mosquito larvae, brine shrimp, daphnia, bloodworms
- Males flare their gill "beards" to intimidate rivals - a dramatic ruff-like display
- Halfmoons have majestic 180-degree fan-shaped caudal fins
- Plakats have short powerful fins bred for endurance and speed
- Crowntails have spiked ray extensions on their fins like a crown
- Doubletails have twin caudal fins giving enhanced perception
- Dragonscales have thick metallic iridescent scales like armor
- Giant bettas can reach 3+ inches, much larger than standard bettas
- Butterfly bettas have distinct color bands on their fins
- Cambodian bettas have pale/translucent bodies with colored fins
- Bettas are NOT puddle fish - even in dry season their waters are wide and connected
- Bettas prefer warm water 75-82°F with gentle or no current
- They are surprisingly intelligent, can recognize their owners, and learn tricks
- Bettas live 2-7 years and develop distinct personalities over time`;

const PERSONALITY_SEEDS = {
  warrior: { traits: 'brave, direct, protective, battle-hungry', voice: 'speaks with military confidence and honor, sometimes terse and commanding' },
  mage: { traits: 'curious, mystical, scholarly, contemplative', voice: 'speaks with arcane wisdom about water magic and ley currents, sometimes cryptically brief' },
  worge: { traits: 'cunning, stealthy, witty, street-smart', voice: 'speaks with sly humor and keen observation, often sharp and concise' },
  ranger: { traits: 'observant, patient, nature-attuned, independent', voice: 'speaks with quiet awareness of surroundings, sometimes in clipped hunter shorthand' },
  cleric: { traits: 'compassionate, devout, calm, resolute', voice: 'speaks with spiritual reverence for the water spirits, sometimes in serene brevity' },
  rogue: { traits: 'cunning, stealthy, witty, street-smart', voice: 'speaks with sly humor and keen observation' },
};

const RACE_FLAVOR = {
  blue_betta: 'Halfmoon betta with majestic 180-degree fan-shaped caudal fins, graceful and regal. In the wild, halfmoons are prized for their dramatic fin displays.',
  red_betta: 'Plakat betta with short powerful fins bred for endurance, aggressive and fearless fighter. Plakats are closest to wild bettas - fast, hardy, and fierce.',
  purple_betta: 'Doubletail betta with twin caudal fins giving enhanced spatial awareness, perceptive and elegant. The split tail is a rare genetic trait.',
  white_betta: 'Cambodian betta with pale translucent body and colored fins, serene and clear-minded. Their see-through scales let them blend with light.',
  green_betta: 'Giant betta of massive 3+ inch size, strong and imposing protector. Giants are selectively bred for their impressive stature.',
  gold_betta: 'Crowntail betta with spiked ray fin extensions like a living crown, proud and commanding. Their rays extend beyond the fin membrane.',
  orange_betta: 'Dragonscale betta with thick metallic iridescent scales like natural armor, resilient and fiery. Their scales shimmer like dragon mail.',
  pink_betta: 'Butterfly betta with distinct color bands on fins creating patterns, graceful and deceptive in combat. Their banded patterns confuse predators.',
};

function canHeroSpeak(heroId) {
  const lastSpoke = heroLastSpoke.get(heroId) || 0;
  return Date.now() - lastSpoke >= PER_HERO_COOLDOWN_MS;
}

function markHeroSpoke(heroId) {
  heroLastSpoke.set(heroId, Date.now());

  const now = Date.now();
  const windowStart = now - 180000;
  const calls = heroCallCount.get(heroId) || [];
  const recent = calls.filter(t => t > windowStart);
  recent.push(now);
  heroCallCount.set(heroId, recent);
}

function isHeroOverLimit(heroId, maxPerWindow = 2) {
  const now = Date.now();
  const windowStart = now - 180000;
  const calls = (heroCallCount.get(heroId) || []).filter(t => t > windowStart);
  return calls.length >= maxPerWindow;
}

function isDuplicateSentence(heroId, text) {
  const key = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const heroUsed = usedSentences.get(heroId) || new Set();

  if (heroUsed.has(key)) return true;

  heroUsed.add(key);
  if (heroUsed.size > 100) {
    const arr = [...heroUsed];
    arr.splice(0, arr.length - 80);
    usedSentences.set(heroId, new Set(arr));
  } else {
    usedSentences.set(heroId, heroUsed);
  }
  return false;
}

function buildSystemPrompt(hero, context = {}) {
  const identity = buildHeroIdentity(hero);
  const classSeed = PERSONALITY_SEEDS[hero.classId] || PERSONALITY_SEEDS.warrior;
  const raceFlavor = RACE_FLAVOR[hero.raceId] || 'a unique betta fish warrior';

  const shortMode = context.shortMode;

  let prompt = `You are ${identity.name} (ID: ${identity.uid}), a level ${identity.level} ${raceFlavor} of the ${hero.classId} class in "Betta Warlords," an underwater RPG set in the Sunken Kingdom of Abyssia.

PERSONALITY: ${classSeed.traits}. You ${classSeed.voice}.
WORLD: Underwater freshwater kingdom with root groves, deep trenches, volcanic vents, frozen depths. Currency is Pearls. Enemies are aquatic creatures.

${BETTA_WIKI_KNOWLEDGE}`;

  if (context.memory) {
    prompt += `\n\nYOUR RECENT MEMORY:\n${context.memory}`;
  }

  if (context.playerStyle) {
    prompt += `\n\nPLAYER TENDENCY: ${context.playerStyle}`;
  }

  if (context.bestItemInfo) {
    prompt += `\n\nITEM PREFERENCES: ${context.bestItemInfo}`;
  }

  if (context.previousLines && context.previousLines.length > 0) {
    prompt += `\n\nDO NOT REPEAT these previous lines:\n${context.previousLines.map(l => `- "${l}"`).join('\n')}`;
  }

  if (shortMode) {
    prompt += `\n\nRULES: Respond in EXACTLY 6-7 words. Be punchy, witty, or insightful. One short sentence only. Stay in character. Use real betta fish knowledge when fitting. Never break the fourth wall. Do NOT prefix with your name. NEVER repeat a previous line.`;
  } else {
    prompt += `\n\nRULES: Respond in 1-2 sentences only. Be fun, informative, or genuine. Weave in real betta facts naturally when relevant. Stay in character. Never break the fourth wall. Do NOT prefix with your name. NEVER repeat a previous line.`;
  }

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

function getRecentLines(heroId) {
  const heroUsed = usedSentences.get(heroId);
  if (!heroUsed) return [];
  return [...heroUsed].slice(-5);
}

function buildBestItemContext(hero, inventory) {
  const prefs = getHeroBestItems(hero);
  if (!prefs) return '';

  const { hasBest, bestSlots, totalBest } = checkBestItemEquipped(hero);
  const available = checkInventoryForBestItems(hero, inventory || []);

  let info = '';
  if (hasBest) {
    info += `You have ${totalBest} of your favorite items equipped (${bestSlots.join(', ')}). This makes you VERY happy. `;
  }
  if (available.length > 0) {
    const names = available.map(i => i.name);
    info += `The player has your DESIRED items in inventory: ${names.join(', ')}! You REALLY want them equipped on you. Ask for them enthusiastically but briefly. `;
  }
  if (!hasBest && available.length === 0) {
    info += `Your dream items: weapon="${prefs.weapon}", ring="${prefs.ring}", relic="${prefs.relic}". You occasionally mention longing for them. `;
  }

  return info;
}

export async function generateAIDialogue(hero, contextType, contextData = {}) {
  if (!isPuterAvailable()) return null;

  if (contextType === 'idle_chat') {
    if (isHeroOverLimit(hero.id, contextData.burstLimit || 2)) return null;
    if (!contextData.forceSpeech && !canHeroSpeak(hero.id)) return null;
  }

  const cacheKey = getCacheKey(hero.id, contextType, contextData);
  const cached = getCachedResponse(cacheKey);
  if (cached && !isDuplicateSentence(hero.id, cached)) return cached;

  try {
    const [history, playerStyle] = await Promise.all([
      loadHeroHistory(hero.id),
      loadPlayerStyle(),
    ]);

    const memory = buildMemorySummary(history);
    const styleSummary = computePlayerStyleSummary(playerStyle);
    const previousLines = getRecentLines(hero.id);
    const bestItemInfo = buildBestItemContext(hero, contextData.inventory);
    const shortMode = contextData.shortMode || Math.random() < 0.4;

    const systemPrompt = buildSystemPrompt(hero, {
      memory,
      playerStyle: styleSummary,
      previousLines,
      bestItemInfo,
      shortMode,
    });

    let userPrompt = '';
    switch (contextType) {
      case 'idle_chat': {
        const { zoneName, trigger, allyName, allyLine } = contextData;
        if (allyLine) {
          userPrompt = `You are in ${zoneName || 'the depths'}. Your ally ${allyName} just said: "${allyLine}". Reply in character.`;
        } else if (trigger === 'want_item') {
          userPrompt = `Mention a favorite item you wish you had, or express joy about one you're wearing. Be specific and in-character.`;
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
        } else if (trigger === 'betta_fact') {
          userPrompt = `Share something interesting you know about your betta species or life in the waters - a real fact woven into your RPG personality.`;
        } else {
          userPrompt = `You are idle in ${zoneName || 'the depths'} with your school of allies. Say something in character - about the surroundings, your adventures, feelings, or share a betta fact.`;
        }
        break;
      }
      case 'battle_narration': {
        const { attacker, defender, ability, damage } = contextData;
        userPrompt = `Narrate this battle moment: ${attacker} uses ${ability} against ${defender} for ${damage} damage. Describe it dramatically in 1 sentence.`;
        break;
      }
      case 'lore': {
        userPrompt = contextData.prompt || `Generate atmospheric lore about ${contextData.zoneName || 'the deep waters'}.`;
        break;
      }
      case 'npc_dialogue': {
        userPrompt = contextData.prompt || `Respond as an NPC in the underwater kingdom.`;
        break;
      }
      case 'player_chat': {
        const { playerMessage, zoneName } = contextData;
        userPrompt = `Your commander (the player) says to you: "${playerMessage}". You are in ${zoneName || 'the depths'}. Respond in character. Keep it natural and brief (1-2 sentences). React to what they said.`;
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
    let cleaned = result.replace(/^["']|["']$/g, '').trim();

    if (cleaned && isDuplicateSentence(hero.id, cleaned)) {
      cleaned = null;
    }

    if (cleaned) {
      setCachedResponse(cacheKey, cleaned);
      markHeroSpoke(hero.id);

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

export async function generatePlayerChatResponse(hero, playerMessage, zoneName, inventory) {
  return generateAIDialogue(hero, 'player_chat', {
    playerMessage,
    zoneName,
    inventory,
    forceSpeech: true,
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

export { canHeroSpeak, isHeroOverLimit };
