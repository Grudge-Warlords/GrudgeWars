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
import { PLAYER_ROWS, getDefaultRow } from '../data/battleRows';

const BAR_HEIGHT = '26.2%';
const POPUP_BOTTOM_OFFSET = 'calc(26.2% + 8px)';

function HarvestingPopup({ onClose, isMobile }) {
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
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: isMobile ? 4 : 10, zIndex: 10600,
      backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: 12, padding: isMobile ? 10 : 16, width: isMobile ? 'auto' : 360, maxWidth: isMobile ? 'calc(100vw - 16px)' : undefined, maxHeight: 400, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="pickaxe" size={14} /> Harvest Sites
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, fontSize: '0.55rem', flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(harvestResources).filter(([, v]) => v > 0).map(([k, v]) => (
          <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.15)', color: 'var(--gold)' }}>
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
                background: assignedHero ? 'rgba(251,191,36,0.06)' : 'rgba(42,49,80,0.2)',
                border: `1px solid ${assignedHero ? 'rgba(251,191,36,0.25)' : 'var(--border)'}`,
                borderRadius: 6, padding: '8px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>{node.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600 }}>{node.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>+{node.baseRate} {node.resource}/s</div>
                  </div>
                  {assignedHero ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'var(--gold)', fontSize: '0.6rem', fontWeight: 600 }}>
                        {assignedHero.name} (Lv.{assignedHero.level})
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); recallHarvest(node.id); }} style={{
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
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
                            background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                            borderRadius: 4, padding: '3px 6px', color: 'var(--text)',
                            fontSize: '0.6rem', width: '100%', cursor: 'pointer',
                          }}
                        >
                          <option value="">Assign idle hero...</option>
                          {idleHeroes.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: '0.55rem', fontStyle: 'italic' }}>No idle heroes</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', textAlign: 'center', padding: 12 }}>No harvest nodes unlocked yet</div>
      )}
    </div>
  );
}

function GearPopup({ onClose, isMobile }) {
  const { heroRoster, activeHeroIds, inventory } = useGameStore();
  const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
  const [selectedHero, setSelectedHero] = useState(activeHeroes[0]?.id || null);
  const hero = heroRoster.find(h => h.id === selectedHero);

  const slotNames = ['weapon', 'helmet', 'armor', 'boots', 'ring', 'shield', 'accessory'];

  return (
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: isMobile ? 4 : 10, zIndex: 10600,
      backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
      border: '1px solid rgba(110,231,183,0.3)',
      borderRadius: 12, padding: isMobile ? 10 : 16, width: isMobile ? 'auto' : 380, maxWidth: isMobile ? 'calc(100vw - 16px)' : undefined, maxHeight: 450, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="shield" size={14} /> Gear Overview
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(110,231,183,0.2)' : 'rgba(42,49,80,0.3)',
            border: `1px solid ${selectedHero === h.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, overflow: 'visible', borderRadius: 8, border: '2px solid var(--accent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.7} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
                Lv.{hero.level} {raceDefinitions[hero.raceId]?.name} {classDefinitions[hero.classId]?.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {slotNames.map(slot => {
              const eq = hero.equipment?.[slot];
              return (
                <div key={slot} style={{
                  background: eq ? 'rgba(110,231,183,0.06)' : 'rgba(42,49,80,0.15)',
                  border: `1px solid ${eq ? 'rgba(110,231,183,0.2)' : 'var(--border)'}`,
                  borderRadius: 6, padding: '6px 8px',
                }}>
                  <div style={{ fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{slot}</div>
                  {eq ? (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text)', fontWeight: 600 }}>{eq.name || `T${eq.tier} ${slot}`}</div>
                  ) : (
                    <div style={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.4)', fontStyle: 'italic' }}>Empty</div>
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

function CharacterPopup({ onClose, isMobile }) {
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
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: isMobile ? 4 : 10, zIndex: 10600,
      backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
      border: '1px solid rgba(168,85,247,0.3)',
      borderRadius: 12, padding: isMobile ? 10 : 16, width: isMobile ? 'auto' : 420, maxWidth: isMobile ? 'calc(100vw - 16px)' : undefined, maxHeight: 500, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="chart" size={14} /> Character Power
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(168,85,247,0.2)' : 'rgba(42,49,80,0.3)',
            border: `1px solid ${selectedHero === h.id ? '#a855f7' : 'var(--border)'}`,
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? '#c084fc' : 'var(--muted)',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && stats && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, overflow: 'visible', borderRadius: 10, border: '2px solid #a855f7', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.8} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
                Lv.{hero.level} {race?.name} {cls?.name}
              </div>
              <div style={{
                marginTop: 4, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(251,191,36,0.1))',
                border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '3px 8px',
                display: 'inline-block',
              }}>
                <span style={{ color: '#c084fc', fontSize: '0.7rem', fontWeight: 700 }}>Power: {combatPower.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: isMobile ? 8 : 16, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: '0 0 auto', alignSelf: isMobile ? 'center' : undefined }}>
              <RadarChart labels={attrLabels} values={radarValues} size={isMobile ? 120 : 160} color="#a855f7" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Attributes</div>
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
                      <span style={{ width: 20, fontSize: '0.5rem', color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{pts}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Combat Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                {combatStats.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0' }}>
                    <span style={{ fontSize: '0.45rem', color: '#999' }}>{s.label}</span>
                    <span style={{ fontSize: '0.5rem', color: s.color, fontWeight: 600 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 6, padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>
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

const ROW_ICON_NAMES = { front: 'shield', battle: 'sword', support: 'energy', back: 'target' };
const ROW_COLORS = { front: '#ef4444', battle: '#f59e0b', support: '#6ee7b7', back: '#60a5fa' };

function TacticalRowPanel({ onClose, isMobile }) {
  const { heroRoster, activeHeroIds, heroTacticalRows, setHeroTacticalRow } = useGameStore();
  const [dragHeroId, setDragHeroId] = useState(null);
  const [selectedHeroId, setSelectedHeroId] = useState(null);

  const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id) || h.id === 'player');
  const rows = Object.entries(PLAYER_ROWS);

  const getHeroRow = (heroId) => {
    if (heroTacticalRows[heroId]) return heroTacticalRows[heroId];
    const hero = heroRoster.find(h => h.id === heroId);
    if (!hero) return 'battle';
    const cls = classDefinitions[hero.classId];
    if (!cls) return 'battle';
    return getDefaultRow({ classId: hero.classId, team: 'player', weaponType: hero.equipment?.weapon?.weaponType || null });
  };

  const handleDrop = (rowId) => {
    if (dragHeroId) {
      setHeroTacticalRow(dragHeroId, rowId);
      setDragHeroId(null);
    }
  };

  const handleRowTap = (rowId) => {
    if (selectedHeroId) {
      setHeroTacticalRow(selectedHeroId, rowId);
      setSelectedHeroId(null);
    }
  };

  const handleHeroTap = (heroId) => {
    setSelectedHeroId(prev => prev === heroId ? null : heroId);
  };

  return (
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: isMobile ? 4 : 10, zIndex: 10600,
      backgroundImage: 'url(/images/ui-panel-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: 12, padding: isMobile ? 10 : 16, width: isMobile ? 'calc(100vw - 16px)' : 380, maxHeight: 420, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="sword" size={14} style={{ marginRight: 4 }} /> Tactical Positions
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>
      <div style={{ fontSize: '0.6rem', color: 'rgba(148,163,184,0.7)', marginBottom: 12, lineHeight: 1.4 }}>
        {isMobile ? 'Tap a hero to select, then tap a row to assign.' : 'Drag heroes to assign starting battle rows.'} These positions apply when entering combat.
      </div>
      {selectedHeroId && (
        <div style={{
          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 6, padding: '4px 10px', marginBottom: 8,
          fontSize: '0.55rem', color: 'var(--gold)', textAlign: 'center',
        }}>
          Hero selected — tap a row to assign position
        </div>
      )}

      {rows.map(([rowId, rowData]) => {
        const heroesInRow = activeHeroes.filter(h => getHeroRow(h.id) === rowId);
        return (
          <div
            key={rowId}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(rowId)}
            onClick={() => handleRowTap(rowId)}
            style={{
              marginBottom: 8,
              background: (dragHeroId || selectedHeroId) ? 'rgba(255,215,0,0.05)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${(dragHeroId || selectedHeroId) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              padding: isMobile ? '8px 8px' : '8px 12px',
              transition: 'all 0.15s',
              minHeight: 50,
              cursor: selectedHeroId ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <InlineIcon name={ROW_ICON_NAMES[rowId]} size={16} />
              <span className="font-cinzel" style={{ fontSize: '0.65rem', fontWeight: 700, color: ROW_COLORS[rowId] }}>
                {rowData.name}
              </span>
              {selectedHeroId && <span style={{ fontSize: '0.5rem', color: 'var(--gold)', marginLeft: 'auto', fontWeight: 600 }}>Tap to place</span>}
              {!selectedHeroId && <span style={{ fontSize: '0.5rem', color: 'rgba(148,163,184,0.5)', marginLeft: 'auto' }}>
                {rowData.description.split('.').slice(1).join('.').trim()}
              </span>}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 36 }}>
              {heroesInRow.length === 0 && (
                <div style={{
                  width: '100%', height: 36,
                  border: `1px dashed ${selectedHeroId ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', color: selectedHeroId ? 'var(--gold)' : 'rgba(148,163,184,0.3)', fontStyle: 'italic',
                }}>
                  {selectedHeroId ? 'Tap to assign here' : (isMobile ? 'Tap hero, then tap row' : 'Drag hero here')}
                </div>
              )}
              {heroesInRow.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const isSelected = selectedHeroId === hero.id;
                return (
                  <div
                    key={hero.id}
                    draggable={!isMobile}
                    onDragStart={() => setDragHeroId(hero.id)}
                    onDragEnd={() => setDragHeroId(null)}
                    onClick={(e) => { e.stopPropagation(); handleHeroTap(hero.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
                      border: `1px solid ${(isSelected || dragHeroId === hero.id) ? 'var(--gold)' : 'rgba(197,160,89,0.25)'}`,
                      borderRadius: 6, padding: '4px 10px 4px 4px',
                      cursor: isMobile ? 'pointer' : 'grab',
                      transition: 'all 0.15s',
                      opacity: dragHeroId === hero.id ? 0.5 : 1,
                      boxShadow: isSelected ? '0 0 8px rgba(255,215,0,0.3)' : 'none',
                    }}
                  >
                    <div style={{ width: 28, height: 28, overflow: 'visible', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.32} speed={180} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>{hero.name}</div>
                      <div style={{ fontSize: '0.45rem', color: 'var(--muted)' }}>Lv.{hero.level} {heroCls?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {heroesInRow.length === 0 && !dragHeroId && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {activeHeroes.map(hero => (
                  <button
                    key={hero.id}
                    onClick={() => setHeroTacticalRow(hero.id, rowId)}
                    style={{
                      background: 'rgba(255,215,0,0.08)',
                      border: '1px solid rgba(255,215,0,0.15)',
                      borderRadius: 4, padding: '2px 6px',
                      color: 'var(--gold)', fontSize: '0.45rem',
                      cursor: 'pointer', fontFamily: "'Cinzel', serif",
                    }}
                  >
                    + {hero.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => {
            activeHeroes.forEach(hero => {
              const defaultRow = getDefaultRow({ classId: hero.classId, team: 'player', weaponType: hero.equipment?.weapon?.weaponType || null });
              setHeroTacticalRow(hero.id, defaultRow);
            });
          }}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '6px 0',
            color: 'var(--muted)', fontSize: '0.55rem',
            cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 600,
          }}
        >
          Reset Defaults
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1, background: 'rgba(255,215,0,0.12)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 6, padding: '6px 0',
            color: 'var(--gold)', fontSize: '0.55rem',
            cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 700,
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default function MapBottomBar({
  chatLog,
  chatInput,
  setChatInput,
  setChatLog,
  chatLogRef,
  enterScene,
  setScreen,
  onToggleWarParty,
  onToggleGruda,
  showWarParty,
  showGruda,
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
  const [showTactical, setShowTactical] = useState(false);

  const closeAllPopups = () => {
    setShowHarvesting(false);
    setShowGear(false);
    setShowCharacter(false);
    setShowTactical(false);
  };

  const togglePopup = (which) => {
    closeAllPopups();
    if (which === 'harvest' && !showHarvesting) setShowHarvesting(true);
    else if (which === 'gear' && !showGear) setShowGear(true);
    else if (which === 'character' && !showCharacter) setShowCharacter(true);
    else if (which === 'tactical' && !showTactical) setShowTactical(true);
  };

  const hasUnspent = unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0);

  const buttons = [
    { id: 'camp', label: 'Camp', img: '/images/icons/btn-camp.png', color: '#4ade80', action: () => enterScene('camp', 'world') },
    { id: 'points', label: 'Points', img: '/images/icons/btn-points.png', color: hasUnspent ? '#ef4444' : '#94a3b8', action: () => setScreen('account'), pulse: hasUnspent },
    { id: 'council', label: 'Council', img: '/images/icons/btn-council.png', color: 'var(--gold)', action: () => setScreen('account') },
    { id: 'party', label: 'Party', img: '/images/icons/btn-party.png', color: 'var(--accent)', action: () => onToggleWarParty(), badge: Object.keys(activeHarvests).length > 0 ? Object.keys(activeHarvests).length : null },
    { id: 'gruda', label: 'Gruda', img: '/images/icons/btn-gruda.png', color: '#f87171', action: () => onToggleGruda() },
    { id: 'settings', label: 'Settings', img: '/images/icons/btn-settings.png', color: '#94a3b8', action: () => window.dispatchEvent(new Event('toggle-settings')) },
    { id: 'music', label: musicMuted ? 'Unmute' : 'Mute', img: '/images/icons/btn-music.png', color: musicMuted ? '#ef4444' : '#6ee7b7', action: () => {
      const newVal = !musicMuted;
      setMusicMutedState(newVal);
      setMusicMuted(newVal);
      setSfxMuted(newVal);
    }},
    { id: 'quests', label: 'Quests', img: '/images/icons/btn-quests.png', color: '#fbbf24', action: () => setScreen('account') },
  ];

  const popupButtons = [
    { id: 'harvest', iconSrc: '/sprites/ui/icons/icon_pickaxe.png', color: 'var(--gold)', label: 'Harvest', active: showHarvesting },
    { id: 'gear', iconSrc: '/sprites/ui/icons/icon_shield_blue.png', color: 'var(--accent)', label: 'Gear', active: showGear },
    { id: 'character', iconSrc: '/sprites/ui/icons/icon_chart.png', color: '#a855f7', label: 'Power', active: showCharacter },
    { id: 'tactical', icon: 'crossed_swords', color: '#ef4444', label: 'Tactical', active: showTactical },
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const leader = heroRoster.find(h => activeHeroIds.includes(h.id));
    const name = leader?.name || 'You';
    setChatLog(prev => [...prev.slice(-49), {
      id: Date.now(), speaker: name, line: chatInput.trim(), color: '#a78bfa',
    }]);
    setChatInput('');
  };

  const hudOverlay = document.getElementById('hud-overlay');

  const bottomBarContent = (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR_HEIGHT,
      zIndex: 10600,
      pointerEvents: 'none',
    }}>
      {showHarvesting && <div style={{ pointerEvents: 'auto' }}><HarvestingPopup onClose={() => setShowHarvesting(false)} isMobile={isMobile} /></div>}
      {showGear && <div style={{ pointerEvents: 'auto' }}><GearPopup onClose={() => setShowGear(false)} isMobile={isMobile} /></div>}
      {showCharacter && <div style={{ pointerEvents: 'auto' }}><CharacterPopup onClose={() => setShowCharacter(false)} isMobile={isMobile} /></div>}
      {showTactical && <div style={{ pointerEvents: 'auto' }}><TacticalRowPanel onClose={() => setShowTactical(false)} isMobile={isMobile} /></div>}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR_HEIGHT,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0',
        backgroundImage: 'url(/images/ui-bottombar-bg.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}>
        <div style={{
          flex: '0 0 28%',
          display: isMobile ? 'none' : 'flex', flexDirection: 'column',
          padding: '6px 8px 12px 28px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0 8px 2px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {(() => {
              const leader = heroRoster.find(h => h.id === 'player' || activeHeroIds.includes(h.id));
              return leader ? (
                <div style={{ width: 36, height: 40, overflow: 'visible', flexShrink: 0 }}>
                  <SpriteAnimation spriteData={getPlayerSprite(leader.classId, leader.raceId)} animation="idle" scale={0.9} speed={150} />
                </div>
              ) : null;
            })()}
            <span className="font-cinzel" style={{ fontSize: '0.55rem', color: 'rgba(255,215,0,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>PARTY LOG</span>
          </div>
          <div ref={chatLogRef} style={{
            flex: 1, overflowY: 'auto', padding: '2px 8px',
            fontSize: '0.82rem', lineHeight: 1.5,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
          }}>
            {chatLog.length > 0 ? chatLog.slice(-8).map(entry => (
              <div key={entry.id} style={{ marginBottom: 2 }}>
                <span style={{ fontWeight: 700, color: entry.color, marginRight: 4, fontSize: '0.75rem', textTransform: 'uppercase' }}>{entry.speaker}</span>
                <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 400 }}>{entry.line}</span>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: 'rgba(148,163,184,0.3)', fontStyle: 'italic' }}>Your party is quiet...</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, padding: '2px 6px 0', alignItems: 'center' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              placeholder="Say something..."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,215,0,0.1)',
                borderRadius: 4, padding: '3px 6px',
                color: 'rgba(226,232,240,0.9)', fontSize: '0.75rem',
                fontFamily: "'Jost', sans-serif", outline: 'none', minWidth: 0,
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.3)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
            />
            <button onClick={sendChat} style={{
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.15)',
              borderRadius: 4, padding: '2px 6px', color: 'var(--gold)', fontSize: '0.55rem',
              fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>Send</button>
          </div>
        </div>

        <div style={{
          flex: '1 1 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '4px 2px 2px' : '8px 4px 4px',
          position: 'relative',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? 360 : 520,
            aspectRatio: '1455 / 526',
            backgroundImage: 'url(/images/ui-toolbar-bg.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0 8% 0 8%' : '0 12.5% 0 12.5%',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: isMobile ? '1.5%' : '2.2%',
              width: '100%',
              alignItems: 'center',
              paddingTop: '3%',
            }}>
              {buttons.map((btn, idx) => (
                <div key={btn.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <button onClick={btn.action} style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '2px solid rgba(197,160,89,0.4)',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 0,
                    transition: 'all 0.15s',
                    position: 'relative',
                    animation: btn.pulse ? 'glow 2s infinite' : 'none',
                    aspectRatio: '1 / 1',
                    width: '100%',
                    minWidth: isMobile ? 36 : undefined,
                    minHeight: isMobile ? 36 : undefined,
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)',
                    borderRadius: '5px',
                  }}
                    onMouseEnter={e => { showTooltip(btn.label, e); e.currentTarget.style.borderColor = '#c5a059'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseMove={e => updateTooltipPosition(e)}
                    onMouseLeave={e => { hideTooltip(); e.currentTarget.style.borderColor = 'rgba(197,160,89,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {btn.img ? (
                      <img src={btn.img} alt={btn.label} style={{ width: '65%', height: '65%', objectFit: 'contain', borderRadius: 2, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
                    ) : btn.iconSrc ? (
                      <img src={btn.iconSrc} alt={btn.label} style={{ width: '60%', height: '60%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <InlineIcon name={btn.icon} size={20} />
                    )}
                    <span style={{ position: 'absolute', top: 1, left: 3, fontSize: '0.4rem', color: 'rgba(200,200,200,0.5)', fontWeight: 600, fontFamily: "'Cinzel', serif" }}>{idx + 1}</span>
                    {btn.badge && (
                      <span style={{
                        position: 'absolute', top: -2, right: -2,
                        background: 'var(--gold)', color: '#000', fontSize: '0.4rem',
                        fontWeight: 800, borderRadius: '50%', width: 14, height: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{btn.badge}</span>
                    )}
                  </button>
                  <span style={{ fontSize: isMobile ? '0.55rem' : '0.4rem', color: btn.color, fontWeight: 600, letterSpacing: '0.02em', fontFamily: "'Cinzel', serif", lineHeight: 1, textAlign: 'center' }}>{btn.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          flex: isMobile ? '0 0 25%' : '0 0 20%',
          display: 'flex', flexDirection: 'column',
          padding: isMobile ? '16px 8px 6px 4px' : '20px 28px 14px 8px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: isMobile ? 4 : 6,
          }}>
            {popupButtons.map(pb => (
              <button key={pb.id} onClick={() => togglePopup(pb.id)} style={{
                width: isMobile ? 36 : 30, height: isMobile ? 36 : 30, borderRadius: '50%',
                background: pb.active ? 'rgba(255,215,0,0.25)' : 'rgba(20,24,48,0.9)',
                border: `2px solid ${pb.active ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: pb.active ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
              }}
                onMouseEnter={e => { showTooltip(pb.label, e); e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,215,0,0.3)'; }}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={e => { hideTooltip(); if (!pb.active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {pb.iconSrc ? (
                  <img src={pb.iconSrc} alt={pb.label} style={{ width: isMobile ? 18 : 16, height: isMobile ? 18 : 16, objectFit: 'contain', imageRendering: 'pixelated' }} />
                ) : (
                  <InlineIcon name={pb.icon} size={14} />
                )}
              </button>
            ))}
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', paddingTop: 18,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(110,231,183,0.15) transparent',
          }}>
            <div className="font-cinzel" style={{ fontSize: isMobile ? '0.55rem' : '0.5rem', color: 'var(--accent)', fontWeight: 700, marginBottom: isMobile ? 2 : 4, letterSpacing: '0.05em', textAlign: 'center' }}>
              WAR PARTY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 3 }}>
              {heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id)).map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                const hpPercent = heroStats ? Math.round((hero.currentHealth / heroStats.health) * 100) : 100;
                return (
                  <div key={`bar_${hero.id}`} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
                    <div style={{ width: isMobile ? 22 : 28, height: isMobile ? 22 : 28, overflow: 'visible', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={isMobile ? 0.28 : 0.36} speed={180} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? '0.55rem' : '0.5rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hero.name}
                      </div>
                      <div style={{ fontSize: isMobile ? '0.55rem' : '0.4rem', color: 'var(--muted)' }}>Lv.{hero.level} {heroCls?.name}</div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${hpPercent}%`, background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return hudOverlay ? createPortal(bottomBarContent, hudOverlay) : bottomBarContent;
}
