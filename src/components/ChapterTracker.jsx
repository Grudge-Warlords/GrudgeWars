import React, { useState, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { CHAPTERS, getCurrentChapter, getChapterProgress, isChapterComplete } from '../data/chapters';
import { InlineIcon } from '../data/uiSprites.jsx';

const vesselColors = { betta: '#ef4444', gorgon: '#a78bfa', plankton: '#22d3ee', all: '#c5a059' };

export default function ChapterTracker() {
  const [expanded, setExpanded] = useState(false);
  const [showLore, setShowLore] = useState(null);
  const gameState = useGameStore();
  const { completedChapters, completeChapter } = gameState;

  const chapter = useMemo(() => getCurrentChapter(gameState), [
    completedChapters, gameState.heroRoster, gameState.level, gameState.victories,
    gameState.visitedZones, gameState.bossesDefeated, gameState.zoneConquer,
    gameState.battleStats, gameState.inventory, gameState.activeHeroIds,
  ]);

  const progress = useMemo(() => getChapterProgress(chapter, gameState), [chapter, gameState]);
  const allComplete = useMemo(() => isChapterComplete(chapter, gameState), [chapter, gameState]);

  const completedCount = Object.values(progress).filter(p => p.complete).length;
  const totalCount = chapter.objectives.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleClaimReward = () => {
    if (allComplete && !completedChapters.includes(chapter.id)) {
      completeChapter(chapter.id);
      const store = useGameStore.getState();
      if (chapter.reward?.pearls) {
        if (store.addGold) store.addGold(chapter.reward.pearls);
        else useGameStore.setState(s => ({ gold: s.gold + chapter.reward.pearls }));
      }
      if (chapter.reward?.xp) {
        let newXp = (store.xp || 0) + chapter.reward.xp;
        let newLevel = store.level || 1;
        let newXpToNext = store.xpToNext || 50;
        while (newXp >= newXpToNext && newLevel < 20) {
          newXp -= newXpToNext;
          newLevel++;
          newXpToNext = Math.floor(newXpToNext * 1.4);
        }
        useGameStore.setState({ xp: newXp, level: newLevel, xpToNext: newXpToNext });
      }
      setShowLore(chapter.loreReveal);
    }
  };

  const accentColor = vesselColors[chapter.vesselFocus] || '#c5a059';

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          position: 'absolute', top: 80, left: 8, zIndex: 900,
          background: 'rgba(10,20,40,0.88)', border: `1px solid ${accentColor}40`,
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          backdropFilter: 'blur(4px)', minWidth: 140, maxWidth: 220,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <InlineIcon name="scroll" size={12} />
          <span className="font-cinzel" style={{ fontSize: '0.55rem', color: accentColor, fontWeight: 700, letterSpacing: '0.05em' }}>
            CH.{chapter.number}
          </span>
          <span style={{ fontSize: '0.55rem', color: '#ccc', fontWeight: 600 }}>{chapter.title}</span>
        </div>
        <div style={{
          height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
            borderRadius: 2, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: '0.45rem', color: '#888', marginTop: 2, textAlign: 'right' }}>
          {completedCount}/{totalCount}
        </div>
      </div>
    );
  }

  return (
    <>
      {showLore && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        }} onClick={() => setShowLore(null)}>
          <div style={{
            background: 'rgba(10,20,50,0.95)', border: `1px solid ${accentColor}60`,
            borderRadius: 12, padding: '24px 28px', maxWidth: 420, textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div className="font-cinzel" style={{ color: accentColor, fontSize: '0.8rem', marginBottom: 12, fontWeight: 700 }}>
              Lore Revealed
            </div>
            <p style={{ color: '#ddd', fontSize: '0.75rem', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 16px 0' }}>
              {showLore}
            </p>
            <button onClick={() => setShowLore(null)} style={{
              background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
              borderRadius: 6, padding: '6px 20px', color: accentColor,
              cursor: 'pointer', fontSize: '0.7rem',
            }}>Continue</button>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', top: 80, left: 8, zIndex: 900,
        background: 'rgba(10,20,40,0.94)', border: `1px solid ${accentColor}50`,
        borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(6px)',
        minWidth: 240, maxWidth: 300, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <InlineIcon name="scroll" size={14} />
            <span className="font-cinzel" style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 700 }}>
              Chapter {chapter.number}: {chapter.title}
            </span>
          </div>
          <button onClick={() => setExpanded(false)} style={{
            background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem', padding: 0,
          }}>×</button>
        </div>

        <p style={{ fontSize: '0.55rem', color: '#999', margin: '0 0 10px 0', lineHeight: 1.4, fontStyle: 'italic' }}>
          {chapter.subtitle}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {chapter.objectives.map(obj => {
            const p = progress[obj.id];
            return (
              <div key={obj.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 6px', borderRadius: 4,
                background: p?.complete ? `${accentColor}12` : 'rgba(255,255,255,0.03)',
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `1px solid ${p?.complete ? accentColor : '#555'}`,
                  background: p?.complete ? `${accentColor}33` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', color: p?.complete ? accentColor : '#666',
                  flexShrink: 0,
                }}>
                  {p?.complete ? '✓' : ''}
                </span>
                <span style={{
                  flex: 1, fontSize: '0.55rem',
                  color: p?.complete ? accentColor : '#aaa',
                  textDecoration: p?.complete ? 'line-through' : 'none',
                  opacity: p?.complete ? 0.8 : 1,
                }}>
                  {obj.text}
                </span>
                {p && !p.complete && p.target > 1 && (
                  <span style={{ fontSize: '0.45rem', color: '#666', flexShrink: 0 }}>
                    {p.current}/{p.target}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
            borderRadius: 2, transition: 'width 0.5s ease',
          }} />
        </div>

        {allComplete && !completedChapters.includes(chapter.id) ? (
          <button onClick={handleClaimReward} style={{
            width: '100%', padding: '6px 0', borderRadius: 6,
            background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
            border: `1px solid ${accentColor}`,
            color: accentColor, fontWeight: 700, cursor: 'pointer',
            fontSize: '0.65rem', animation: 'glow 2s infinite',
          }} className="font-cinzel">
            Complete Chapter — Claim Reward
          </button>
        ) : allComplete ? (
          <div style={{ textAlign: 'center', fontSize: '0.55rem', color: '#666' }}>
            Chapter Complete
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '0.5rem', color: '#555' }}>
            {completedCount} of {totalCount} objectives complete
          </div>
        )}

        {chapter.reward && (
          <div style={{ fontSize: '0.45rem', color: '#666', textAlign: 'center', marginTop: 4 }}>
            Reward: {chapter.reward.pearls && `${chapter.reward.pearls} pearls`}
            {chapter.reward.xp && ` • ${chapter.reward.xp} XP`}
          </div>
        )}
      </div>
    </>
  );
}
