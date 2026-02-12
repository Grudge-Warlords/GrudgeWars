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

export default function ArenaPage() {
  const isMobile = useIsMobile();
  const { lore, loading: loreLoading, generateZoneLore } = useLocationLore();
  const {
    heroRoster, activeHeroIds, level, victories, losses,
    startArena, setScreen, bossesDefeated,
  } = useGameStore();

  const activeHeroes = heroRoster.filter(h =>
    h.id === 'player' || (activeHeroIds || []).includes(h.id)
  );

  const availableArenas = arenaTemplates.filter(a => level >= (a.minLevel || 1));

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
          <button onClick={() => setScreen('world')} style={{
            background: 'rgba(42,49,80,0.8)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 16px', color: 'var(--text)',
            cursor: 'pointer', fontSize: '0.75rem', minHeight: 36,
          }}>
            Back to Map
          </button>
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
            onClick={() => startArena(arena.id)}
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
