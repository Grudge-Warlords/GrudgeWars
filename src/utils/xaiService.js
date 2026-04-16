const XAI_BASE = '/api/xai';

const loreCache = new Map();

async function xaiRequest(endpoint, body) {
  const res = await fetch(`${XAI_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`xAI API error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function generateFighterLore(fighterId, fighterName, fighterStyle) {
  const cacheKey = `lore_${fighterId}`;
  if (loreCache.has(cacheKey)) return loreCache.get(cacheKey);

  const result = await xaiRequest('/lore', {
    fighterId,
    fighterName,
    fighterStyle,
  });

  loreCache.set(cacheKey, result);
  return result;
}

export async function generateMatchCommentary(fighter1, fighter2, events) {
  return xaiRequest('/commentary', {
    fighter1,
    fighter2,
    events,
  });
}

export async function generateCampaignNarrative(fighterId, chapter, previousEvents) {
  return xaiRequest('/campaign', {
    fighterId,
    chapter,
    previousEvents,
  });
}

export async function generateFighterTrashTalk(fighterId, opponentId, matchContext) {
  const cacheKey = `talk_${fighterId}_${opponentId}`;
  if (loreCache.has(cacheKey)) return loreCache.get(cacheKey);

  const result = await xaiRequest('/trash-talk', {
    fighterId,
    opponentId,
    matchContext,
  });

  loreCache.set(cacheKey, result);
  return result;
}

export function clearLoreCache() {
  loreCache.clear();
}
