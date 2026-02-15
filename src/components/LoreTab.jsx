import React, { useState } from 'react';
import { WORLD_LORE, LOCATION_LORE } from '../data/lore';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';
import { skillTrees } from '../data/skillTrees';
import { cities } from '../data/cities';

const SUB_TABS = [
  { key: 'world', label: 'WORLD' },
  { key: 'breeds', label: 'BREEDS' },
  { key: 'classes', label: 'CLASSES' },
  { key: 'bosses', label: 'BOSSES' },
  { key: 'regions', label: 'REGIONS' },
];

const cardBase = {
  background: 'rgba(10,22,40,0.8)',
  border: '1px solid rgba(34,211,238,0.15)',
  borderRadius: 10,
  padding: 16,
  marginBottom: 12,
};

const vesselColors = { betta: '#ef4444', gorgon: '#a78bfa', plankton: '#22d3ee' };

export default function LoreTab({ panelStyle }) {
  const [subTab, setSubTab] = useState('world');
  const [expandedTiers, setExpandedTiers] = useState({});

  const toggleTier = (key) => {
    setExpandedTiers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 className="font-cinzel" style={{ color: '#22d3ee', fontSize: '1.4rem', marginBottom: 16 }}>
        Codex of Abyssia
      </h2>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            style={{
              padding: '8px 16px',
              background: subTab === t.key ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)',
              border: subTab === t.key ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: subTab === t.key ? '#22d3ee' : 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem',
              fontFamily: "'Cinzel', serif",
              letterSpacing: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'world' && <WorldSection panelStyle={panelStyle} />}
      {subTab === 'breeds' && <BreedsSection panelStyle={panelStyle} />}
      {subTab === 'classes' && <ClassesSection panelStyle={panelStyle} expandedTiers={expandedTiers} toggleTier={toggleTier} />}
      {subTab === 'bosses' && <BossesSection panelStyle={panelStyle} />}
      {subTab === 'regions' && <RegionsSection panelStyle={panelStyle} />}
    </div>
  );
}

function WorldSection({ panelStyle }) {
  return (
    <div>
      <div style={{ ...panelStyle, ...cardBase }}>
        <h3 className="font-cinzel" style={{ color: '#d4a96a', fontSize: '1.1rem', marginBottom: 4 }}>
          {WORLD_LORE.title}
        </h3>
        <div style={{ color: '#a78bfa', fontSize: '0.8rem', marginBottom: 16, fontStyle: 'italic' }}>
          {WORLD_LORE.subtitle}
        </div>
        {WORLD_LORE.prologue.split('\n\n').map((p, i) => (
          <p key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: 12 }}>
            {p}
          </p>
        ))}
      </div>

      <h3 className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.95rem', marginBottom: 12 }}>
        The Three Vessels of Magic
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {WORLD_LORE.threeVessels.map(v => (
          <div key={v.name} style={{
            ...cardBase,
            borderColor: v.color,
            borderWidth: 1,
            borderStyle: 'solid',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{v.icon}</div>
            <div className="font-cinzel" style={{ color: v.color, fontSize: '0.9rem', marginBottom: 6 }}>
              {v.name}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: 10 }}>
              {v.description}
            </p>
            <div style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 4,
              background: `${v.color}22`,
              color: v.color,
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              {v.status}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...panelStyle, ...cardBase }}>
        <h3 className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.95rem', marginBottom: 6 }}>
          {WORLD_LORE.planktonMystery.name}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 12 }}>
          {WORLD_LORE.planktonMystery.description}
        </p>
        <div style={{ color: '#d4a96a', fontSize: '0.75rem', marginBottom: 8, fontWeight: 600 }}>CLUES DISCOVERED</div>
        {WORLD_LORE.planktonMystery.clues.map((c, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
          }}>
            <span style={{ color: '#22d3ee', fontSize: '0.75rem', flexShrink: 0 }}>✦</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreedsSection({ panelStyle }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {Object.entries(raceDefinitions).map(([key, race]) => (
          <div key={key} style={{
            ...panelStyle, ...cardBase,
            borderColor: race.color,
            borderWidth: 1,
            borderStyle: 'solid',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: race.color, flexShrink: 0,
              }} />
              <span className="font-cinzel" style={{ color: race.color, fontSize: '0.95rem' }}>
                {race.name}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 8 }}>
              {race.description}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>
              {race.lore}
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 10, marginBottom: 8,
            }}>
              <div style={{ color: '#d4a96a', fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>
                {race.trait}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                {race.traitDescription}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {Object.entries(race.bonuses).filter(([, v]) => v > 0).map(([attr, val]) => (
                <span key={attr} style={{
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(34,211,238,0.1)',
                  color: '#22d3ee', fontSize: '0.65rem',
                }}>
                  +{val} {attr}
                </span>
              ))}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>
              {race.passive}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassesSection({ panelStyle, expandedTiers, toggleTier }) {
  return (
    <div>
      {Object.entries(classDefinitions).map(([classKey, cls]) => (
        <div key={classKey} style={{ marginBottom: 24 }}>
          <div style={{
            ...panelStyle, ...cardBase,
            borderColor: cls.color,
            borderWidth: 1,
            borderStyle: 'solid',
          }}>
            <div className="font-cinzel" style={{ color: cls.color, fontSize: '1.05rem', marginBottom: 6 }}>
              {cls.name}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 6 }}>
              {cls.description}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic' }}>
              {cls.lore}
            </p>

            <div style={{ color: '#d4a96a', fontSize: '0.72rem', fontWeight: 600, marginBottom: 6 }}>STARTING ATTRIBUTES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {Object.entries(cls.startingAttributes).filter(([, v]) => v > 0).map(([attr, val]) => (
                <span key={attr} style={{
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(34,211,238,0.1)',
                  color: '#22d3ee', fontSize: '0.65rem',
                }}>
                  {attr}: {val}
                </span>
              ))}
            </div>

            <div style={{ color: '#d4a96a', fontSize: '0.72rem', fontWeight: 600, marginBottom: 6 }}>ABILITIES</div>
            {cls.abilities.map(ab => (
              <div key={ab.id} style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: 8, marginBottom: 6,
              }}>
                <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{ab.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' }}>{ab.description}</div>
              </div>
            ))}

            <div style={{
              background: `${cls.color}15`, borderRadius: 6, padding: 10, marginTop: 8,
              border: `1px solid ${cls.color}33`,
            }}>
              <div style={{ color: cls.color, fontSize: '0.72rem', fontWeight: 600, marginBottom: 2 }}>
                SIGNATURE: {cls.signatureAbility.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem' }}>
                {cls.signatureAbility.description}
              </div>
            </div>
          </div>

          {skillTrees[classKey] && (
            <div style={{ paddingLeft: 12 }}>
              {skillTrees[classKey].tiers.map((tier, ti) => {
                const tierKey = `${classKey}_${ti}`;
                const expanded = expandedTiers[tierKey];
                return (
                  <div key={ti} style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleTier(tierKey)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: expanded ? 'rgba(34,211,238,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', color: '#fff',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '0.78rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span>{tier.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                        Lv {tier.requiredLevel} {expanded ? '▲' : '▼'}
                      </span>
                    </button>
                    {expanded && (
                      <div style={{ padding: '0 14px 12px' }}>
                        {tier.skills.map(skill => (
                          <div key={skill.id} style={{
                            background: 'rgba(0,0,0,0.25)', borderRadius: 6,
                            padding: 8, marginBottom: 6,
                          }}>
                            <div style={{ color: '#d4a96a', fontSize: '0.75rem', fontWeight: 600 }}>
                              {skill.name}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                              {skill.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BossesSection({ panelStyle }) {
  return (
    <div>
      <div style={{ ...panelStyle, ...cardBase, marginBottom: 20 }}>
        <h3 className="font-cinzel" style={{ color: '#a78bfa', fontSize: '1rem', marginBottom: 6 }}>
          {WORLD_LORE.gorgonStoryArc.title}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 14 }}>
          {WORLD_LORE.gorgonStoryArc.description}
        </p>
        <div style={{ color: '#d4a96a', fontSize: '0.72rem', fontWeight: 600, marginBottom: 10 }}>PROGRESSION</div>
        {WORLD_LORE.gorgonStoryArc.progression.map((p, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(167,139,250,0.2)',
              border: '1px solid rgba(167,139,250,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a78bfa', fontSize: '0.7rem', fontWeight: 700,
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#a78bfa', fontSize: '0.8rem' }}>{p.phase}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: 2 }}>
                Level {p.level} — {p.boss} — {p.location}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                {p.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {WORLD_LORE.gorgonBosses.map(boss => (
        <div key={boss.id} style={{
          ...panelStyle, ...cardBase,
          borderColor: boss.color,
          borderWidth: 1,
          borderStyle: 'solid',
          marginBottom: 16,
        }}>
          <div className="font-cinzel" style={{ color: boss.color, fontSize: '1.05rem', marginBottom: 2 }}>
            {boss.name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: 10, fontStyle: 'italic' }}>
            {boss.title}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              background: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontSize: '0.68rem',
            }}>
              📍 {boss.location}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              background: 'rgba(212,169,106,0.15)', color: '#d4a96a', fontSize: '0.68rem',
            }}>
              Lv {boss.level}+
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: 8 }}>
            {boss.description}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: 14, fontStyle: 'italic' }}>
            {boss.lore}
          </p>

          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 14,
          }}>
            <div className="font-cinzel" style={{ color: '#d4a96a', fontSize: '0.8rem', marginBottom: 8 }}>
              {boss.encounterScene.title}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', lineHeight: 1.6, marginBottom: 10 }}>
              {boss.encounterScene.intro}
            </p>
            <div style={{
              borderLeft: `3px solid ${boss.color}`,
              paddingLeft: 12, marginBottom: 10,
              color: boss.color, fontSize: '0.78rem', fontStyle: 'italic', lineHeight: 1.5,
            }}>
              {boss.encounterScene.taunt}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'rgba(34,211,238,0.06)', borderRadius: 6, padding: 10 }}>
                <div style={{ color: '#22d3ee', fontSize: '0.68rem', fontWeight: 600, marginBottom: 4 }}>VICTORY</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {boss.encounterScene.victory}
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 6, padding: 10 }}>
                <div style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: 600, marginBottom: 4 }}>DEFEAT</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', lineHeight: 1.5 }}>
                  {boss.encounterScene.defeat}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RegionsSection({ panelStyle }) {
  return (
    <div>
      <h3 className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.95rem', marginBottom: 12 }}>
        Locations
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 24 }}>
        {Object.entries(LOCATION_LORE).map(([locId, loc]) => (
          <div key={locId} style={{ ...cardBase, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="font-cinzel" style={{ color: '#fff', fontSize: '0.85rem' }}>
                {loc.loreName}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: '0.6rem', fontWeight: 600,
                background: `${vesselColors[loc.vesselConnection]}22`,
                color: vesselColors[loc.vesselConnection],
              }}>
                {loc.vesselConnection.toUpperCase()}
              </span>
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.55)', fontSize: '0.73rem',
              fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6,
            }}>
              {loc.loreQuote}
            </div>
            <div style={{ color: '#d4a96a', fontSize: '0.68rem' }}>
              {loc.loreTag}
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-cinzel" style={{ color: '#d4a96a', fontSize: '0.95rem', marginBottom: 12 }}>
        Cities & Settlements
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cities.map(city => (
          <div key={city.id} style={{
            ...panelStyle, ...cardBase,
            borderColor: city.color,
            borderWidth: 1,
            borderStyle: 'solid',
          }}>
            <div className="font-cinzel" style={{ color: city.color, fontSize: '0.95rem', marginBottom: 4 }}>
              {city.name}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 8 }}>
              {city.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {city.services.map(s => (
                <span key={s} style={{
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(34,211,238,0.08)',
                  color: '#22d3ee', fontSize: '0.63rem',
                  textTransform: 'uppercase',
                }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}>
              {city.unlocked
                ? 'Unlocked from start'
                : `Unlock: Level ${city.unlockLevel}${city.unlockBoss ? ` — Defeat ${city.unlockBoss.replace(/_/g, ' ')}` : ''}`
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
