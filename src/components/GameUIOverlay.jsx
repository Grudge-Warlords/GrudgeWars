import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, calculateCombatPower } from '../data/attributes';
import { InlineIcon } from '../data/uiSprites.jsx';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import RadarChart from './RadarChart';
import { setMusicMuted, setSfxMuted } from '../utils/audioManager';
import useIsMobile from '../hooks/useIsMobile';

const POPUP_BOTTOM = 'calc(180px + 10px)';

function HarvestingPopup({ onClose }) {
  const isMobile = useIsMobile();
  const {
    harvestNodes, activeHarvests, harvestResources,
    assignHarvest, recallHarvest, heroRoster, activeHeroIds, level
  } = useGameStore();

  const harvestingHeroIds = Object.values(activeHarvests);
  const idleHeroes = heroRoster.filter(h =>
    !activeHeroIds.includes(h.id) && !harvestingHeroIds.includes(h.id)
  );
  const unlockedNodes = (harvestNodes || []).filter(n => level >= n.unlockLevel);

  return (
    <div className="ui-popup" style={{ right: isMobile ? 4 : 10, width: isMobile ? 'calc(100vw - 16px)' : 360, maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: '#c5a059', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="pickaxe" size={14} /> Harvest Sites
        </h4>
        <button onClick={onClose} className="ui-close-btn">×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, fontSize: '0.55rem', flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(harvestResources).filter(([, v]) => v > 0).map(([k, v]) => (
          <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(197,160,89,0.25)', color: '#c5a059' }}>
            {k === 'gold' ? <InlineIcon name="gold" size={12} /> : k === 'herbs' ? <InlineIcon name="nature" size={12} /> : k === 'wood' ? <InlineIcon name="wood" size={12} /> : k === 'ore' ? <InlineIcon name="ore" size={12} /> : <InlineIcon name="diamond" size={12} />} {Math.floor(v)}
          </span>
        ))}
      </div>

      {unlockedNodes.length > 0 ? (
        <div style={{ display: 'grid', gap: 6 }}>
          {unlockedNodes.map(node => {
            const assignedHeroId = activeHarvests[node.id];
            const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
            return (
              <div key={node.id} style={{
                background: assignedHero ? 'rgba(197,160,89,0.08)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${assignedHero ? 'rgba(197,160,89,0.3)' : '#444'}`,
                borderRadius: 4, padding: '8px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>{node.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: '#ccc', fontSize: '0.7rem', fontWeight: 600 }}>{node.name}</div>
                    <div style={{ color: '#888', fontSize: '0.5rem' }}>+{node.baseRate} {node.resource}/s</div>
                  </div>
                  {assignedHero ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: '#c5a059', fontSize: '0.6rem', fontWeight: 600 }}>
                        {assignedHero.name} (Lv.{assignedHero.level})
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); recallHarvest(node.id); }} style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 4, padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.55rem',
                      }}>Recall</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4 }}>
                      {idleHeroes.length > 0 ? (
                        <select
                          onChange={(e) => { if (e.target.value) assignHarvest(node.id, e.target.value); e.target.value = ''; }}
                          defaultValue=""
                          style={{
                            background: 'rgba(0,0,0,0.5)', border: '1px solid #444',
                            borderRadius: 4, padding: '3px 6px', color: '#ccc',
                            fontSize: '0.6rem', width: '100%', cursor: 'pointer',
                          }}
                        >
                          <option value="">Assign idle hero...</option>
                          {idleHeroes.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ color: '#666', fontSize: '0.55rem', fontStyle: 'italic' }}>No idle heroes</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: '#666', fontSize: '0.65rem', textAlign: 'center', padding: 12 }}>No harvest nodes unlocked yet</div>
      )}
    </div>
  );
}

function GearPopup({ onClose }) {
  const isMobile = useIsMobile();
  const { heroRoster, activeHeroIds, inventory } = useGameStore();
  const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
  const [selectedHero, setSelectedHero] = useState(activeHeroes[0]?.id || null);
  const hero = heroRoster.find(h => h.id === selectedHero);

  const slotNames = ['weapon', 'helmet', 'armor', 'boots', 'ring', 'shield', 'accessory'];

  return (
    <div className="ui-popup" style={{ right: isMobile ? 4 : 10, width: isMobile ? 'calc(100vw - 16px)' : 380, maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="shield" size={14} /> Gear Overview
        </h4>
        <button onClick={onClose} className="ui-close-btn">×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(34,211,238,0.15)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${selectedHero === h.id ? '#22d3ee' : '#444'}`,
            borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? '#22d3ee' : '#888',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, overflow: 'visible', borderRadius: 6, border: '2px solid #22d3ee', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.7} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: '#888', fontSize: '0.55rem' }}>
                Lv.{hero.level} {raceDefinitions[hero.raceId]?.name} {classDefinitions[hero.classId]?.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {slotNames.map(slot => {
              const eq = hero.equipment?.[slot];
              return (
                <div key={slot} style={{
                  background: eq ? 'rgba(34,211,238,0.06)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${eq ? 'rgba(34,211,238,0.25)' : '#333'}`,
                  borderRadius: 4, padding: '6px 8px',
                }}>
                  <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{slot}</div>
                  {eq ? (
                    <div style={{ fontSize: '0.6rem', color: '#ccc', fontWeight: 600 }}>{eq.name || `T${eq.tier} ${slot}`}</div>
                  ) : (
                    <div style={{ fontSize: '0.55rem', color: '#555', fontStyle: 'italic' }}>Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterPopup({ onClose }) {
  const isMobile = useIsMobile();
  const { heroRoster, activeHeroIds } = useGameStore();
  const [selectedHero, setSelectedHero] = useState(() => {
    const active = heroRoster.filter(h => activeHeroIds.includes(h.id));
    return active[0]?.id || heroRoster[0]?.id || null;
  });
  const hero = heroRoster.find(h => h.id === selectedHero);
  const stats = hero ? getHeroStatsWithBonuses(hero) : null;
  const cls = hero ? classDefinitions[hero.classId] : null;
  const race = hero ? raceDefinitions[hero.raceId] : null;

  const attrKeys = Object.keys(attributeDefinitions);
  const attrLabels = attrKeys.map(k => k.slice(0, 3).toUpperCase());
  const attrPoints = hero?.attributePoints || {};
  const maxAttrPts = Math.max(1, ...attrKeys.map(k => attrPoints[k] || 0));
  const radarValues = attrKeys.map(k => Math.min(100, ((attrPoints[k] || 0) / Math.max(maxAttrPts, 20)) * 100));

  const combatPower = stats ? calculateCombatPower(stats) : 0;

  const combatStats = stats ? [
    { label: 'Health', value: Math.floor(stats.health), color: '#22c55e' },
    { label: 'Mana', value: Math.floor(stats.mana), color: '#3b82f6' },
    { label: 'Phys Dmg', value: Math.floor(stats.physicalDamage), color: '#ef4444' },
    { label: 'Magic Dmg', value: Math.floor(stats.magicDamage), color: '#a855f7' },
    { label: 'Defense', value: Math.floor(stats.defense), color: '#f59e0b' },
    { label: 'Crit %', value: stats.criticalChance?.toFixed(1), color: '#f97316' },
    { label: 'Crit Dmg', value: Math.floor(stats.criticalDamage) + '%', color: '#fb923c' },
    { label: 'Accuracy', value: stats.accuracy?.toFixed(1), color: '#06b6d4' },
    { label: 'Evasion', value: stats.evasion?.toFixed(1), color: '#14b8a6' },
    { label: 'Block %', value: stats.block?.toFixed(1), color: '#64748b' },
    { label: 'Atk Spd', value: stats.attackSpeed?.toFixed(1), color: '#22d3ee' },
    { label: 'Resistance', value: stats.resistance?.toFixed(1), color: '#8b5cf6' },
  ] : [];

  return (
    <div className="ui-popup" style={{ right: isMobile ? 4 : 10, width: isMobile ? 'calc(100vw - 16px)' : 420, maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="chart" size={14} /> Character Power
        </h4>
        <button onClick={onClose} className="ui-close-btn">×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${selectedHero === h.id ? '#a855f7' : '#444'}`,
            borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? '#c084fc' : '#888',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && stats && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, overflow: 'visible', borderRadius: 6, border: '2px solid #a855f7', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.8} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: '#888', fontSize: '0.55rem' }}>
                Lv.{hero.level} {race?.name} {cls?.name}
              </div>
              <div style={{
                marginTop: 4, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(197,160,89,0.1))',
                border: '1px solid rgba(168,85,247,0.3)', borderRadius: 4, padding: '3px 8px',
                display: 'inline-block',
              }}>
                <span style={{ color: '#c084fc', fontSize: '0.7rem', fontWeight: 700 }}>Power: {combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 16, alignItems: isMobile ? 'center' : 'flex-start' }}>
            <div style={{ flex: '0 0 auto' }}>
              <RadarChart labels={attrLabels} values={radarValues} size={isMobile ? 120 : 160} color="#a855f7" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Attributes</div>
              <div style={{ display: 'grid', gap: 3, marginBottom: 8 }}>
                {attrKeys.map(k => {
                  const pts = attrPoints[k] || 0;
                  const def = attributeDefinitions[k];
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 32, fontSize: '0.5rem', color: def.color, fontWeight: 700, textAlign: 'right' }}>{k.slice(0, 3).toUpperCase()}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, (pts / Math.max(maxAttrPts, 20)) * 100)}%`,
                          background: `linear-gradient(90deg, ${def.color}88, ${def.color})`,
                          borderRadius: 3, transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ width: 20, fontSize: '0.5rem', color: '#ccc', fontWeight: 600, textAlign: 'right' }}>{pts}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.5rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Combat Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                {combatStats.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0' }}>
                    <span style={{ fontSize: '0.45rem', color: '#999' }}>{s.label}</span>
                    <span style={{ fontSize: '0.5rem', color: s.color, fontWeight: 600 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6, padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                <div style={{ fontSize: '0.5rem', color: '#888' }}>
                  HP: {hero.currentHealth || 0}/{Math.floor(stats.health)} | MP: {hero.currentMana || 0}/{Math.floor(stats.mana)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameUIOverlay({
  chatLog = [],
  chatInput = '',
  setChatInput,
  setChatLog,
  chatLogRef,
  enterScene,
  setScreen,
  onToggleWarParty,
  onToggleGruda,
  showWarParty,
  showGruda,
  onPlayerChat,
}) {
  const isMobile = useIsMobile();
  const {
    heroRoster, activeHeroIds, activeHarvests, level,
    unspentPoints, skillPoints,
  } = useGameStore();

  const [musicMuted, setMusicMutedState] = useState(false);
  const [showHarvesting, setShowHarvesting] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);

  const closeAllPopups = () => {
    setShowHarvesting(false);
    setShowGear(false);
    setShowCharacter(false);
  };

  const togglePopup = (which) => {
    closeAllPopups();
    if (which === 'harvest' && !showHarvesting) setShowHarvesting(true);
    else if (which === 'gear' && !showGear) setShowGear(true);
    else if (which === 'character' && !showCharacter) setShowCharacter(true);
  };

  const hasUnspent = unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0);

  const hotbarButtons = [
    { id: 'camp', label: 'Camp', icon: 'camp', action: () => enterScene('camp', 'world') },
    { id: 'points', label: 'Points', icon: 'star', action: () => setScreen('account'), pulse: hasUnspent },
    { id: 'council', label: 'Council', icon: 'battle', action: () => setScreen('account') },
    { id: 'party', label: 'Party', icon: 'shield', action: () => onToggleWarParty(), badge: Object.keys(activeHarvests).length > 0 ? Object.keys(activeHarvests).length : null },
    { id: 'gruda', label: 'Gruda', icon: 'skull', action: () => onToggleGruda() },
    { id: 'settings', label: 'Settings', icon: 'scroll', action: () => window.dispatchEvent(new Event('toggle-settings')) },
    { id: 'music', label: musicMuted ? 'Unmute' : 'Mute', icon: 'energy', action: () => {
      const newVal = !musicMuted;
      setMusicMutedState(newVal);
      setMusicMuted(newVal);
      setSfxMuted(newVal);
    }},
    { id: 'quests', label: 'Quests', icon: 'scroll', action: () => setScreen('account') },
  ];

  const circleButtons = [
    { id: 'harvest', icon: 'pickaxe', label: 'Harvest', active: showHarvesting },
    { id: 'gear', icon: 'shield', label: 'Gear', active: showGear },
    { id: 'character', icon: 'chart', label: 'Power', active: showCharacter },
  ];

  const sendChat = () => {
    if (!chatInput?.trim()) return;
    const msg = chatInput.trim();
    setChatLog(prev => [...prev.slice(-49), {
      id: Date.now(), speaker: 'You', line: msg, color: '#60a5fa',
    }]);
    setChatInput('');
    if (onPlayerChat) onPlayerChat(msg);
  };

  const activeParty = heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id));
  const leader = activeParty[0];
  const leaderStats = leader ? getHeroStatsWithBonuses(leader) : null;

  const hudOverlay = document.getElementById('hud-overlay');

  const overlayContent = (
    <div className="game-ui-overlay">
      {showHarvesting && <HarvestingPopup onClose={() => setShowHarvesting(false)} />}
      {showGear && <GearPopup onClose={() => setShowGear(false)} />}
      {showCharacter && <CharacterPopup onClose={() => setShowCharacter(false)} />}

      <div className="ui-bottom-row">
        <div className="ui-element panel-style ui-panel-left">
          <div className="ui-panel-header">
            <span className="font-cinzel" style={{ fontSize: '0.55rem', color: '#c5a059', fontWeight: 700, letterSpacing: '0.08em' }}>PARTY LOG</span>
          </div>
          <div ref={chatLogRef} className="ui-chat-scroll">
            {chatLog.length > 0 ? chatLog.slice(-8).map(entry => (
              <div key={entry.id} style={{ marginBottom: 2 }}>
                <span style={{ fontWeight: 700, color: entry.color || '#c5a059', marginRight: 4, fontSize: '0.75rem', textTransform: 'uppercase' }}>{entry.speaker}</span>
                <span style={{ color: '#ccc', fontWeight: 400, fontSize: '0.82rem' }}>{entry.line}</span>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: '#555', fontStyle: 'italic' }}>Your party is quiet...</div>
            )}
          </div>
          <div className="ui-chat-input-row">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              placeholder="Say something..."
              className="ui-chat-input"
            />
            <button onClick={sendChat} className="ui-chat-send font-cinzel">Send</button>
          </div>
        </div>

        <div className="ui-element panel-style ui-panel-center">
          <div className="ui-hotbar">
            {hotbarButtons.map((btn, i) => (
              <div
                key={btn.id}
                className="hotbar-slot"
                onClick={btn.action}
                style={{ animation: btn.pulse ? 'glow 2s infinite' : 'none' }}
                onMouseEnter={e => { showTooltip(btn.label, e); }}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={() => hideTooltip()}
              >
                <span className="hotbar-num">{i + 1}</span>
                <InlineIcon name={btn.icon} size={20} />
                <span className="hotbar-label font-cinzel">{btn.label}</span>
                {btn.badge && (
                  <span className="hotbar-badge">{btn.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="ui-element ui-panel-right-wrapper">
          <div className="ui-circle-row">
            {circleButtons.map(pb => (
              <div
                key={pb.id}
                className={`circle-btn ${pb.active ? 'circle-btn-active' : ''}`}
                onClick={() => togglePopup(pb.id)}
                onMouseEnter={e => showTooltip(pb.label, e)}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={() => hideTooltip()}
              >
                <InlineIcon name={pb.icon} size={14} />
              </div>
            ))}
          </div>

          <div className="panel-style ui-panel-right">
            {leader ? (
              <div style={{ display: 'flex', padding: 8, gap: 8, height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 50 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', overflow: 'visible',
                    border: '2px solid #c5a059', background: '#000',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  }}>
                    <SpriteAnimation spriteData={getPlayerSprite(leader.classId, leader.raceId)} animation="idle" scale={0.5} speed={180} />
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#300', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${leaderStats ? Math.round((leader.currentHealth / leaderStats.health) * 100) : 100}%`, height: '100%', background: '#d00', borderRadius: 2 }} />
                  </div>
                  <div style={{ width: '100%', height: 4, background: '#003', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${leaderStats ? Math.round((leader.currentMana / leaderStats.mana) * 100) : 100}%`, height: '100%', background: '#00d', borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="font-cinzel" style={{ fontSize: '0.5rem', color: '#c5a059', borderBottom: '1px solid #444', marginBottom: 4, paddingBottom: 2 }}>WAR PARTY</div>
                  {activeParty.slice(0, 3).map(hero => {
                    const heroCls = classDefinitions[hero.classId];
                    const hStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                    const hpPct = hStats ? Math.round((hero.currentHealth / hStats.health) * 100) : 100;
                    return (
                      <div key={hero.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <div style={{ width: 18, height: 18, overflow: 'visible', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.24} speed={180} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.45rem', fontWeight: 700, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {hero.name}
                          </div>
                          <div style={{ height: 2, background: '#222', borderRadius: 1, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${hpPct}%`, background: hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444', borderRadius: 1 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '0.6rem' }}>No party</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return hudOverlay ? createPortal(overlayContent, hudOverlay) : overlayContent;
}
