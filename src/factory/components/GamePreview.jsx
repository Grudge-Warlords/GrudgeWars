import React, { useState, useEffect } from 'react';
import FactoryBattle from './FactoryBattle.jsx';
import SpriteAIWorker from './SpriteAIWorker.jsx';

export function GamePreview({ spec, generatedImages = {}, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const palette = spec.meta?.colorPalette || {};
  const fonts = spec.meta?.fonts || {};
  const images = { ...generatedImages, ...(spec.assets?.generatedImages || {}) };

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'preview-scroll-fix';
    style.textContent = `
      html, body, #root { overflow: auto !important; height: auto !important; overscroll-behavior: auto !important; position: static !important; }
      body { touch-action: auto !important; }
      #root { display: block !important; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('preview-scroll-fix'); if (el) el.remove(); };
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${palette.background || '#0a0a1a'} 0%, #1a1a2e 100%)`,
      color: palette.text || '#e2e8f0',
      fontFamily: `'${fonts.body || 'Jost'}', sans-serif`,
      padding: '20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    title: {
      fontFamily: `'${fonts.heading || 'Cinzel'}', serif`,
      fontSize: 'clamp(20px, 4vw, 32px)',
      background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    backBtn: {
      padding: '8px 20px',
      borderRadius: '8px',
      border: `1px solid ${palette.primary}`,
      background: 'transparent',
      color: palette.primary,
      cursor: 'pointer',
      fontSize: '13px',
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      marginBottom: '20px',
    },
    tab: (active) => ({
      padding: '8px 16px',
      borderRadius: '8px',
      background: active ? palette.primary : '#1e293b',
      color: active ? '#fff' : '#94a3b8',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: active ? '700' : '400',
    }),
    card: {
      background: 'rgba(15, 23, 42, 0.8)',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
    },
    sectionTitle: {
      fontFamily: `'${fonts.heading}', serif`,
      fontSize: '18px',
      color: palette.primary,
      marginBottom: '12px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '12px',
    },
    raceCard: (color) => ({
      padding: '16px',
      borderRadius: '10px',
      background: '#0f172a',
      border: `1px solid ${color}40`,
      borderLeft: `4px solid ${color}`,
    }),
    raceName: (color) => ({
      fontSize: '16px',
      fontWeight: '700',
      color,
      marginBottom: '4px',
    }),
    tag: (color) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      background: color + '20',
      color,
      marginRight: '4px',
      marginBottom: '4px',
    }),
    desc: { fontSize: '12px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.5' },
    statBar: (val, max, color) => ({
      height: '6px',
      borderRadius: '3px',
      background: '#1e293b',
      overflow: 'hidden',
      marginTop: '4px',
    }),
    statFill: (val, max, color) => ({
      width: `${Math.min(100, (val / max) * 100)}%`,
      height: '100%',
      background: color,
      borderRadius: '3px',
    }),
    loreBox: {
      padding: '20px',
      borderRadius: '12px',
      background: '#0f172a',
      border: `1px solid ${palette.primary}20`,
      lineHeight: '1.8',
      fontSize: '14px',
      whiteSpace: 'pre-wrap',
    },
    abilityChip: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      background: '#1e293b',
      fontSize: '11px',
      marginRight: '6px',
      marginBottom: '4px',
      border: '1px solid #334155',
    },
    chapterCard: (color) => ({
      padding: '16px',
      borderRadius: '10px',
      background: '#0f172a',
      border: `1px solid ${color}40`,
      borderTop: `3px solid ${color}`,
    }),
    mapRegion: (color) => ({
      padding: '12px',
      borderRadius: '8px',
      background: color + '10',
      border: `1px solid ${color}30`,
    }),
    bossCard: (color) => ({
      padding: '20px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, #0f172a, ${color}10)`,
      border: `1px solid ${color}60`,
      marginBottom: '12px',
    }),
    bossName: (color) => ({
      fontSize: '20px',
      fontFamily: `'${fonts.heading}', serif`,
      color,
      marginBottom: '4px',
    }),
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '2px',
    },
    specJson: {
      padding: '16px',
      borderRadius: '8px',
      background: '#0f172a',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#94a3b8',
      overflow: 'auto',
      maxHeight: '500px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    },
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'races', label: 'Races' },
    { id: 'classes', label: 'Classes' },
    { id: 'enemies', label: 'Enemies' },
    { id: 'bosses', label: 'Bosses' },
    { id: 'lore', label: 'Lore' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'world', label: 'World Map' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'battle', label: '⚔️ Play Battle' },
    { id: 'sprites', label: '🤖 Sprite Worker' },
    { id: 'raw', label: 'Raw JSON' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div style={styles.card}>
              <h2 style={{ ...styles.sectionTitle, fontSize: '24px' }}>{spec.meta?.gameName}</h2>
              <p style={{ color: palette.secondary, fontSize: '14px', marginBottom: '8px' }}>{spec.meta?.tagline}</p>
              <p style={styles.desc}>{spec.meta?.setting}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '16px' }}>
                <Stat label="Races" value={spec.races?.length || 0} color={palette.primary} />
                <Stat label="Classes" value={spec.classes?.length || 0} color={palette.secondary} />
                <Stat label="Enemies" value={spec.enemies?.length || 0} color={palette.danger} />
                <Stat label="Bosses" value={spec.bosses?.length || 0} color={palette.accent} />
                <Stat label="Chapters" value={spec.chapters?.length || 0} color="#22c55e" />
                <Stat label="Locations" value={spec.worldMap?.locations?.length || 0} color="#3b82f6" />
                <Stat label="Regions" value={spec.worldMap?.regions?.length || 0} color="#8b5cf6" />
                <Stat label="Art Style" value={spec.meta?.artStyle} color="#ec4899" />
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Color Palette</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(palette).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: v, border: '2px solid #334155' }} />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
            {Object.keys(images).length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>AI-Generated Artwork</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {Object.entries(images).map(([key, src]) => {
                    const labels = {
                      background: 'World Background', battleBg: 'Battle Arena', cardBg: 'Card Design',
                      titleBg: 'Title Screen', mapBg: 'World Map', bossPortrait: 'Boss Portrait',
                      characterPortrait: 'Character Portrait',
                    };
                    return (
                      <div key={key} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155' }}>
                        <img src={src} alt={labels[key] || key} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', background: '#0f172a' }}>
                          {labels[key] || key}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'races':
        return (
          <div style={styles.grid}>
            {(spec.races || []).map(r => (
              <div key={r.id} style={styles.raceCard(r.color)}>
                <div style={styles.raceName(r.color)}>{r.name}</div>
                <span style={styles.tag(r.color)}>{r.trait}</span>
                <span style={styles.tag('#94a3b8')}>{r.passive}</span>
                <p style={styles.desc}>{r.description}</p>
                <p style={{ ...styles.desc, fontSize: '11px', fontStyle: 'italic' }}>{r.lore}</p>
              </div>
            ))}
          </div>
        );

      case 'classes':
        return (
          <div style={styles.grid}>
            {(spec.classes || []).map(c => (
              <div key={c.id} style={styles.raceCard(c.color)}>
                <div style={styles.raceName(c.color)}>{c.name}</div>
                <span style={styles.tag(c.color)}>{c.role}</span>
                <p style={styles.desc}>{c.description}</p>
                <div style={{ marginTop: '8px' }}>
                  {(c.abilities || []).map(ab => (
                    <span key={ab.id} style={styles.abilityChip}>{ab.name} ({ab.type}, {ab.damage}x)</span>
                  ))}
                </div>
                {c.signatureAbility && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={styles.tag(palette.accent)}>Signature: {c.signatureAbility.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'enemies':
        return (
          <div style={styles.grid}>
            {(spec.enemies || []).map(e => (
              <div key={e.id} style={styles.raceCard(e.color)}>
                <div style={styles.raceName(e.color)}>{e.name}</div>
                <div style={styles.statRow}><span>HP: {e.baseHealth}</span><span>ATK: {e.baseDamage}</span><span>DEF: {e.baseDefense}</span></div>
                <div style={styles.statRow}><span>XP: {e.xpReward}</span><span>Gold: {e.goldReward}</span><span>SPD: {e.speed}</span></div>
                <p style={styles.desc}>{e.description}</p>
                <div style={{ marginTop: '6px' }}>
                  {(e.abilities || []).map(ab => (
                    <span key={ab.id} style={styles.abilityChip}>{ab.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'bosses':
        return (
          <div>
            {(spec.bosses || []).map(b => (
              <div key={b.id} style={styles.bossCard(b.color)}>
                <div style={styles.bossName(b.color)}>{b.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', marginBottom: '8px' }}>{b.title}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Level {b.level}</span>
                  <span>HP: {b.baseHealth}</span>
                  <span>ATK: {b.baseDamage}</span>
                  <span>DEF: {b.baseDefense}</span>
                </div>
                <p style={styles.desc}>{b.description}</p>
                {b.lore && <p style={{ ...styles.desc, fontStyle: 'italic', color: b.color }}>{b.lore}</p>}
                <div style={{ marginTop: '8px' }}>
                  {(b.abilities || []).map(ab => (
                    <span key={ab.id} style={styles.abilityChip}>{ab.name} ({ab.type})</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'lore':
        return (
          <div>
            <div style={styles.card}>
              <h2 style={{ ...styles.sectionTitle, fontSize: '22px' }}>{spec.lore?.title}</h2>
              <p style={{ color: palette.secondary, fontSize: '14px', fontStyle: 'italic', marginBottom: '16px' }}>{spec.lore?.subtitle}</p>
              <div style={styles.loreBox}>{spec.lore?.prologue}</div>
            </div>
            {spec.lore?.factions && (
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Factions</h3>
                <div style={styles.grid}>
                  {spec.lore.factions.map((f, i) => (
                    <div key={i} style={styles.raceCard(f.color)}>
                      <div style={styles.raceName(f.color)}>{f.icon} {f.name}</div>
                      <span style={styles.tag(f.color)}>{f.status}</span>
                      <p style={styles.desc}>{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {spec.lore?.worldHistory && (
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>World History</h3>
                <div style={styles.loreBox}>{spec.lore.worldHistory}</div>
              </div>
            )}
          </div>
        );

      case 'chapters':
        return (
          <div style={styles.grid}>
            {(spec.chapters || []).map(ch => (
              <div key={ch.id} style={styles.chapterCard(ch.color)}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Chapter {ch.number}</div>
                <div style={styles.raceName(ch.color)}>{ch.title}</div>
                <div style={{ fontSize: '12px', color: palette.secondary, fontStyle: 'italic', marginBottom: '6px' }}>{ch.subtitle}</div>
                <p style={styles.desc}>{ch.description}</p>
                <div style={{ marginTop: '8px', fontSize: '11px' }}>
                  {(ch.objectives || []).map(obj => (
                    <div key={obj.id} style={{ color: '#94a3b8', marginBottom: '2px' }}>- {obj.text}</div>
                  ))}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <span style={styles.tag(palette.accent)}>+{ch.rewards?.xp} XP</span>
                  <span style={styles.tag(palette.primary)}>+{ch.rewards?.currency} {spec.meta?.currency?.name}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'world':
        return (
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>{spec.worldMap?.name}</h3>
              <div style={styles.grid}>
                {(spec.worldMap?.regions || []).map(r => (
                  <div key={r.id} style={styles.mapRegion(r.color)}>
                    <div style={styles.raceName(r.color)}>{r.name}</div>
                    <span style={styles.tag(r.color)}>{r.terrainType}</span>
                    <span style={styles.tag('#64748b')}>Lv {r.levelRange?.[0]}-{r.levelRange?.[1]}</span>
                    <p style={styles.desc}>{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Locations ({spec.worldMap?.locations?.length})</h3>
              <div style={styles.grid}>
                {(spec.worldMap?.locations || []).map(loc => (
                  <div key={loc.id} style={{ ...styles.raceCard('#64748b'), padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>{loc.name}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <span style={styles.tag(palette.primary)}>{loc.type}</span>
                      <span style={styles.tag('#64748b')}>Lv {loc.levelRange?.[0]}-{loc.levelRange?.[1]}</span>
                    </div>
                    <p style={{ ...styles.desc, fontSize: '11px' }}>{loc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'equipment':
        return (
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Equipment Tiers</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(spec.equipment?.tiers || []).map(t => (
                  <div key={t.tier} style={{ padding: '10px 16px', borderRadius: '8px', background: '#0f172a', border: `2px solid ${t.color}` }}>
                    <div style={{ color: t.color, fontWeight: '700', fontSize: '14px' }}>{t.name}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{t.multiplier}x power</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Weapon Types</h3>
              <div style={styles.grid}>
                {(spec.equipment?.weaponTypes || []).map(w => (
                  <div key={w.id} style={{ ...styles.raceCard('#64748b'), padding: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>{w.name}</div>
                    <span style={styles.tag(palette.primary)}>{w.hand}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Equipment Slots</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(spec.equipment?.slots || []).map(s => (
                  <span key={s} style={styles.tag(palette.secondary)}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'battle':
        return (
          <FactoryBattle spec={spec} onBack={() => setActiveTab('overview')} />
        );

      case 'sprites':
        return <SpriteAIWorker />;

      case 'raw':
        return (
          <div style={styles.specJson}>
            {JSON.stringify(spec, null, 2)}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{spec.meta?.gameName} - Preview</h1>
        <button style={styles.backBtn} onClick={onBack}>Back to Factory</button>
      </div>
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={styles.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: '12px', borderRadius: '8px', background: '#0f172a', border: `1px solid ${color}30`, textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
    </div>
  );
}
