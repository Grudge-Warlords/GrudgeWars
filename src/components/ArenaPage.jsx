import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { arenaTemplates } from '../data/missions';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';
import useIsMobile from '../hooks/useIsMobile';
import { isPuterAvailable } from '../utils/puterService';
import { useLocationLore } from '../hooks/usePuterAI';
import { announceArenaChallenge } from '../utils/discordAnnounce';

function postArenaToDiscord(playerName, victories, losses, level, activeHeroes, arenaTitle) {
  const session = (() => {
    try { return JSON.parse(localStorage.getItem('grudge-session') || '{}'); } catch { return {}; }
  })();
  const discordName = session.discordUser?.globalName || session.discordUser?.username || session.username || playerName || 'Unknown Warlord';
  const heroList = activeHeroes.map(h => {
    const cls = classDefinitions[h.classId];
    const race = raceDefinitions?.[h.raceId];
    return `Lv.${h.level} ${race?.name || ''} ${cls?.name || ''} "${h.name}"`;
  }).join('\n');
  const winRate = victories + losses > 0 ? ((victories / (victories + losses)) * 100).toFixed(1) : '0.0';
  const payload = {
    content: `**${discordName}** entered the Arena!`,
    embeds: [{
      title: `Arena: ${arenaTitle || 'Challenge'}`,
      color: 0xef4444,
      fields: [
        { name: 'Warlord', value: discordName, inline: true },
        { name: 'Level', value: `${level}`, inline: true },
        { name: 'Record', value: `${victories}W / ${losses}L (${winRate}%)`, inline: true },
        { name: 'War Party', value: heroList || 'Solo', inline: false },
      ],
      footer: { text: 'Betta Warlords Arena | Grudge Studios' },
      timestamp: new Date().toISOString(),
    }],
  };
  fetch('/api/discord/webhook/arena', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: payload.content, embeds: payload.embeds }),
  }).catch(() => {});
}

export default function ArenaPage() {
  const isMobile = useIsMobile();
  const { lore, loading: loreLoading, generateZoneLore } = useLocationLore();
  const {
    heroRoster, activeHeroIds, level, victories, losses,
    startArena, setScreen, bossesDefeated, playerName,
  } = useGameStore();
  const [shareStatus, setShareStatus] = useState(null);

  const activeHeroes = heroRoster.filter(h =>
    h.id === 'player' || (activeHeroIds || []).includes(h.id)
  );

  const availableArenas = arenaTemplates.filter(a => level >= (a.minLevel || 1));
  const winRate = victories + losses > 0 ? ((victories / (victories + losses)) * 100).toFixed(1) : '0.0';

  const handleShareToDiscord = () => {
    setShareStatus('sending');
    const session = (() => {
      try { return JSON.parse(localStorage.getItem('grudge-session') || '{}'); } catch { return {}; }
    })();
    const discordName = session.discordUser?.globalName || session.discordUser?.username || session.username || playerName || 'Warlord';
    const heroList = activeHeroes.map(h => {
      const cls = classDefinitions[h.classId];
      const race = raceDefinitions?.[h.raceId];
      return `Lv.${h.level} ${race?.name || ''} ${cls?.name || ''} "${h.name}"`;
    }).join('\n');
    const bossCount = Object.keys(bossesDefeated || {}).length;
    const payload = {
      content: `**${discordName}** shared their Arena stats!`,
      embeds: [{
        title: `${discordName}'s Arena Record`,
        color: 0xef4444,
        fields: [
          { name: 'Level', value: `${level}`, inline: true },
          { name: 'Victories', value: `${victories}`, inline: true },
          { name: 'Win Rate', value: `${winRate}%`, inline: true },
          { name: 'Losses', value: `${losses}`, inline: true },
          { name: 'Bosses Slain', value: `${bossCount}`, inline: true },
          { name: 'War Party', value: heroList || 'Solo', inline: false },
        ],
        footer: { text: 'Betta Warlords Arena | Grudge Studios' },
        timestamp: new Date().toISOString(),
      }],
    };
    fetch('/api/discord/webhook/arena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: payload.content, embeds: payload.embeds }),
    })
      .then(r => r.json())
      .then(data => {
        setShareStatus(data.error ? 'error' : 'sent');
        setTimeout(() => setShareStatus(null), 3000);
      })
      .catch(() => {
        setShareStatus('error');
        setTimeout(() => setShareStatus(null), 3000);
      });
  };

  const handleStartArena = (arenaId) => {
    const arena = arenaTemplates.find(a => a.id === arenaId);
    postArenaToDiscord(playerName, victories, losses, level, activeHeroes, arena?.title);
    const state = useGameStore.getState();
    announceArenaChallenge(state, arena?.title);
    startArena(arenaId);
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'linear-gradient(180deg, #041225 0%, #0a1e3d 50%, #041225 100%)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/ocean_battle_new.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.15,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 900, margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="font-cinzel" style={{
              color: '#ef4444', fontSize: isMobile ? '1.3rem' : '1.6rem',
              margin: 0, textShadow: '0 0 20px rgba(239,68,68,0.4)',
            }}>
              The Arena
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 2 }}>
              Test your War Party against waves of enemies
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleShareToDiscord} disabled={shareStatus === 'sending'} style={{
              background: shareStatus === 'sent' ? 'rgba(34,197,94,0.2)' : 'rgba(88,101,242,0.2)',
              border: `1px solid ${shareStatus === 'sent' ? 'rgba(34,197,94,0.4)' : 'rgba(88,101,242,0.4)'}`,
              borderRadius: 8, padding: '8px 14px',
              color: shareStatus === 'sent' ? '#4ade80' : '#7289da',
              cursor: shareStatus === 'sending' ? 'wait' : 'pointer', fontSize: '0.65rem',
              fontWeight: 600, minHeight: 36, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}>
              <svg width="14" height="11" viewBox="0 0 71 55" fill="currentColor">
                <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
              </svg>
              {shareStatus === 'sending' ? 'Sharing...' : shareStatus === 'sent' ? 'Shared!' : shareStatus === 'error' ? 'Failed' : 'Share Stats'}
            </button>
            <button onClick={() => setScreen('world')} style={{
              background: 'rgba(42,49,80,0.8)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 16px', color: 'var(--text)',
              cursor: 'pointer', fontSize: '0.75rem', minHeight: 36,
            }}>
              Back to Map
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '8px 16px',
          }}>
            <span style={{ color: '#ef4444', fontSize: '0.6rem', fontWeight: 600 }}>VICTORIES</span>
            <div style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700 }}>{victories}</div>
          </div>
          <div style={{
            background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)',
            borderRadius: 8, padding: '8px 16px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 600 }}>LOSSES</span>
            <div style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700 }}>{losses}</div>
          </div>
          <div style={{
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
            borderRadius: 8, padding: '8px 16px',
          }}>
            <span style={{ color: '#22d3ee', fontSize: '0.6rem', fontWeight: 600 }}>LEVEL</span>
            <div style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700 }}>{level}</div>
          </div>
          <div style={{
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 8, padding: '8px 16px',
          }}>
            <span style={{ color: '#fbbf24', fontSize: '0.6rem', fontWeight: 600 }}>WIN RATE</span>
            <div style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700 }}>{winRate}%</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(88,101,242,0.06)', border: '1px solid rgba(88,101,242,0.15)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="16" height="13" viewBox="0 0 71 55" fill="#5865F2" style={{ flexShrink: 0 }}>
            <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
          </svg>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.4 }}>
            <span style={{ color: '#7289da', fontWeight: 600 }}>Discord Arena</span> — Arena battles are broadcast to the Grudge Studios Discord. Share your stats and compete with other Warlords!
          </div>
        </div>

        {isPuterAvailable() && (
          <div style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          }}>
            {lore ? (
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
                <span style={{ color: '#ef4444', fontWeight: 600, fontStyle: 'normal', marginRight: 4 }}>Arena Lore:</span>
                {lore}
              </div>
            ) : (
              <button
                onClick={() => generateZoneLore('The Arena', 'An ancient underwater colosseum where betta warlords prove their strength')}
                disabled={loreLoading}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 6, padding: '6px 14px', color: '#ef4444',
                  fontSize: '0.65rem', cursor: loreLoading ? 'wait' : 'pointer',
                  fontFamily: "'Cinzel', serif", fontWeight: 600, width: '100%', minHeight: 32,
                }}
              >
                {loreLoading ? 'The crowd roars...' : 'Generate Arena Lore'}
              </button>
            )}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 8 }}>
            Your War Party ({activeHeroes.length})
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeHeroes.map(hero => {
              const cls = classDefinitions[hero.classId];
              const race = raceDefinitions?.[hero.raceId];
              return (
                <div key={hero.id} style={{
                  background: 'rgba(0,0,0,0.3)', border: `1px solid ${cls?.color || 'var(--border)'}40`,
                  borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 8,
                  minWidth: 140,
                }}>
                  <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1.5} speed={150} />
                  <div>
                    <div style={{ color: cls?.color || '#fff', fontSize: '0.7rem', fontWeight: 600 }}>{hero.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>Lv.{hero.level} {race?.name} {cls?.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h3 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 10 }}>
          Arena Challenges
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
          {availableArenas.map(arena => (
            <div key={arena.id} style={{
              background: 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(30,36,58,0.9))',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => handleStartArena(arena.id)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div className="font-cinzel" style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>
                    {arena.title}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.55rem', marginTop: 2 }}>
                    Lv.{arena.minLevel || 1}+ | {arena.waves?.length || 3} Waves
                  </div>
                </div>
                <InlineIcon name="crossedSwords" size={18} />
              </div>
              <div style={{ color: 'var(--text)', fontSize: '0.6rem', lineHeight: 1.4, opacity: 0.8 }}>
                {arena.description}
              </div>
            </div>
          ))}
          {availableArenas.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', gridColumn: '1 / -1', textAlign: 'center', padding: 30 }}>
              No arenas available yet. Keep leveling up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
