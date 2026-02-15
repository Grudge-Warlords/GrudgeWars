import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';

function getPlayerName() {
  try {
    const session = JSON.parse(localStorage.getItem('grudge-session') || '{}');
    return session.discordUser?.globalName || session.discordUser?.username || session.username || 'Unknown Warlord';
  } catch {
    return 'Unknown Warlord';
  }
}

function getHeroPartyString(heroRoster, activeHeroIds) {
  if (!heroRoster?.length) return null;
  const active = heroRoster.filter(h => activeHeroIds?.includes(h.id));
  if (!active.length) return null;
  return active.map(h => {
    const cls = classDefinitions[h.classId];
    const race = raceDefinitions?.[h.raceId];
    return `Lv.${h.level} ${race?.name || ''} ${cls?.name || ''} "${h.name}"`;
  }).join('\n');
}

function sendAnnounce(type, details) {
  const playerName = getPlayerName();
  fetch('/api/discord/webhook/announce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, playerName, details }),
  }).catch(() => {});
}

export function announceVictory(state, battleResults, locationName) {
  const heroParty = getHeroPartyString(state.heroRoster, state.activeHeroIds);
  const details = {
    warlord: getPlayerName(),
    level: `${state.level}`,
    location: locationName || state.currentLocation || 'Unknown',
    enemies: `${battleResults.enemiesDefeated || 0}`,
    xp: `${battleResults.xpGained || 0}`,
    pearls: `${battleResults.pearlsGained || 0}`,
  };
  if (heroParty) details.heroParty = heroParty;

  if (battleResults.flawless) {
    sendAnnounce('flawless', details);
  } else if (battleResults.isBoss) {
    details.boss = locationName || 'Boss';
    sendAnnounce('boss_kill', details);
  } else {
    sendAnnounce('victory', details);
  }
}

export function announceBossKill(state, bossName) {
  const heroParty = getHeroPartyString(state.heroRoster, state.activeHeroIds);
  sendAnnounce('boss_kill', {
    warlord: getPlayerName(),
    level: `${state.level}`,
    boss: bossName,
    heroParty,
  });
}

export function announceLevelUp(newLevel) {
  sendAnnounce('level_up', {
    warlord: getPlayerName(),
    level: `${newLevel}`,
  });
}

export function announceArenaChallenge(state, arenaTitle) {
  const heroParty = getHeroPartyString(state.heroRoster, state.activeHeroIds);
  const wins = state.victories || 0;
  const losses = state.losses || 0;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';
  sendAnnounce('challenge', {
    warlord: getPlayerName(),
    level: `${state.level}`,
    location: arenaTitle || 'Arena',
    record: `${wins}W / ${losses}L (${winRate}%)`,
    heroParty,
  });
}

export function announceHeroCreated(hero) {
  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions?.[hero.raceId];
  sendAnnounce('hero_created', {
    warlord: getPlayerName(),
    breed: race?.name || 'Unknown',
    class: cls?.name || 'Unknown',
  });
}

export function announceMilestone(milestoneText) {
  sendAnnounce('milestone', {
    warlord: getPlayerName(),
    milestone: milestoneText,
  });
}
