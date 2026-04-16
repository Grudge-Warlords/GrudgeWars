import React, { useState, useEffect, useMemo } from 'react';
import {
  getAllFlatWeapons,
  getAllFlatArmor,
  getAllFlatMaterials,
  getAllFlatConsumables,
  weaponFullIconByType,
  armorFullIconBySlot,
  materialIcon,
  consumableIcon,
} from '../data/objectStoreService';

const TABS = [
  { id: 'weapons', label: 'Weapons', icon: '\u2694' },
  { id: 'armor', label: 'Armor', icon: '\uD83D\uDEE1' },
  { id: 'materials', label: 'Materials', icon: '\uD83D\uDC8E' },
  { id: 'consumables', label: 'Consumables', icon: '\uD83E\uDDEA' },
];

const TIER_COLORS = {
  common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6',
  epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444',
  iron: '#9ca3af', steel: '#60a5fa', silver: '#c0c0c0',
  mithril: '#22d3ee', adamantine: '#a855f7', orichalcum: '#f59e0b',
  dragonscale: '#ef4444', voidforged: '#ec4899',
};

const WEAPON_TYPE_MAP = {
  swords: 'sword', axes1h: 'axe', daggers: 'dagger', greatswords: 'sword',
  greataxes: 'axe', hammers1h: 'hammer', hammers2h: 'hammer', spears: 'spear',
  bows: 'bow', crossbows: 'crossbow', staves: 'staff',
};

export default function ArsenalPanel({ palette, onClose }) {
  const [tab, setTab] = useState('weapons');
  const [data, setData] = useState({ weapons: [], armor: [], materials: [], consumables: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllFlatWeapons().catch(() => ({ weapons: [] })),
      getAllFlatArmor().catch(() => ({ armor: [] })),
      getAllFlatMaterials().catch(() => []),
      getAllFlatConsumables().catch(() => []),
    ]).then(([w, a, m, c]) => {
      setData({
        weapons: w.weapons || [],
        armor: a.armor || [],
        materials: Array.isArray(m) ? m : [],
        consumables: Array.isArray(c) ? c : [],
      });
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const items = data[tab] || [];
    const cats = new Set(items.map(i => i.category || i.slot || i.setName || 'misc'));
    return ['all', ...Array.from(cats).sort()];
  }, [data, tab]);

  const filtered = useMemo(() => {
    let items = data[tab] || [];
    if (categoryFilter !== 'all') {
      items = items.filter(i =>
        (i.category || i.slot || i.setName || 'misc') === categoryFilter
      );
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.lore || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [data, tab, search, categoryFilter]);

  const primary = palette?.primary || '#06b6d4';
  const accent = palette?.accent || '#f59e0b';

  function getItemIcon(item) {
    if (tab === 'weapons') {
      const type = WEAPON_TYPE_MAP[item.category] || 'sword';
      const hash = (item.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return weaponFullIconByType(type, (hash % 40) + 1);
    }
    if (tab === 'armor') {
      const hash = (item.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return armorFullIconBySlot(item.slot || 'chest', (hash % 20) + 1);
    }
    if (tab === 'materials') {
      const slug = (item.name || '').toLowerCase().replace(/\s+/g, '-');
      return materialIcon(`${slug}.png`);
    }
    if (tab === 'consumables') {
      const hash = (item.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return consumableIcon(`alchemy_${(hash % 20) + 1}.png`);
    }
    return '';
  }

  function getTierColor(item) {
    const t = (item.tier || item.material || '').toLowerCase();
    return TIER_COLORS[t] || '#64748b';
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5, 10, 24, 0.95)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Jost', sans-serif",
      animation: 'fadeSlide 0.3s ease',
    }}>
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: `1px solid ${primary}25`,
        background: 'rgba(10, 15, 30, 0.9)',
      }}>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: '18px', fontWeight: 700,
          color: primary, textShadow: `0 0 20px ${primary}30`,
        }}>Grudge Arsenal</span>

        <div style={{
          display: 'flex', gap: '4px', marginLeft: '16px',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setCategoryFilter('all'); setSelectedItem(null); }}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: tab === t.id ? `${primary}25` : 'transparent',
                color: tab === t.id ? primary : '#64748b',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              padding: '6px 12px', borderRadius: '8px',
              border: `1px solid ${primary}30`, background: 'rgba(15, 23, 42, 0.8)',
              color: '#e2e8f0', fontSize: '12px', width: '160px', outline: 'none',
            }}
          />
          <button onClick={onClose} style={{
            padding: '6px 16px', borderRadius: '8px',
            border: `1px solid ${primary}44`, background: 'transparent',
            color: primary, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>

      <div style={{
        padding: '8px 20px', display: 'flex', gap: '4px', flexWrap: 'wrap',
        borderBottom: '1px solid rgba(100,116,139,0.15)',
      }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            style={{
              padding: '3px 10px', borderRadius: '6px', border: 'none',
              background: categoryFilter === c ? `${accent}20` : 'transparent',
              color: categoryFilter === c ? accent : '#475569',
              fontSize: '10px', fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
            {c}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569' }}>
          {filtered.length} items
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 20px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '8px', alignContent: 'start',
        }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '14px' }}>
              Loading arsenal data...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#475569', padding: '40px', fontSize: '13px' }}>
              No items found
            </div>
          ) : filtered.map((item, idx) => {
            const tierColor = getTierColor(item);
            const isSelected = selectedItem?.name === item.name && selectedItem?.category === item.category;
            return (
              <div key={`${item.name}-${idx}`}
                onClick={() => setSelectedItem(isSelected ? null : item)}
                style={{
                  padding: '8px', borderRadius: '10px', cursor: 'pointer',
                  background: isSelected
                    ? `linear-gradient(135deg, ${tierColor}18, ${tierColor}08)`
                    : 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${isSelected ? tierColor : 'rgba(100,116,139,0.15)'}`,
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.02)' : 'none',
                }}>
                <div style={{
                  width: '48px', height: '48px', margin: '0 auto 6px',
                  borderRadius: '8px', overflow: 'hidden',
                  background: `${tierColor}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${tierColor}25`,
                }}>
                  <img
                    src={getItemIcon(item)}
                    alt={item.name}
                    style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{
                  fontSize: '8px', fontWeight: 700, color: tierColor,
                  textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
                }}>{item.tier || item.material || ''}</div>
                <div style={{
                  fontSize: '11px', color: '#e2e8f0', fontWeight: 600, textAlign: 'center',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.name}</div>
                <div style={{
                  fontSize: '9px', color: '#475569', textAlign: 'center',
                  textTransform: 'capitalize',
                }}>{item.category || item.slot || ''}</div>
              </div>
            );
          })}
        </div>

        {selectedItem && (
          <div style={{
            width: '260px', flexShrink: 0, padding: '16px',
            borderLeft: '1px solid rgba(100,116,139,0.15)',
            background: 'rgba(10, 15, 30, 0.8)',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '80px', height: '80px', margin: '0 auto 12px',
              borderRadius: '12px', overflow: 'hidden',
              background: `${getTierColor(selectedItem)}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${getTierColor(selectedItem)}30`,
            }}>
              <img
                src={getItemIcon(selectedItem)}
                alt={selectedItem.name}
                style={{ width: '72px', height: '72px', objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>

            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 700,
              color: getTierColor(selectedItem), textAlign: 'center', marginBottom: '4px',
            }}>{selectedItem.name}</div>

            <div style={{
              fontSize: '10px', color: '#64748b', textAlign: 'center',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
            }}>
              {selectedItem.tier || selectedItem.material || ''} {selectedItem.category || selectedItem.slot || ''}
            </div>

            {selectedItem.lore && (
              <div style={{
                fontSize: '11px', color: '#94a3b8', lineHeight: 1.5,
                fontStyle: 'italic', marginBottom: '12px', textAlign: 'center',
              }}>"{selectedItem.lore}"</div>
            )}

            {selectedItem.damage && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderTop: '1px solid rgba(100,116,139,0.1)',
                fontSize: '11px',
              }}>
                <span style={{ color: '#64748b' }}>Damage</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>{selectedItem.damage}</span>
              </div>
            )}

            {selectedItem.defense && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderTop: '1px solid rgba(100,116,139,0.1)',
                fontSize: '11px',
              }}>
                <span style={{ color: '#64748b' }}>Defense</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{selectedItem.defense}</span>
              </div>
            )}

            {selectedItem.setName && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderTop: '1px solid rgba(100,116,139,0.1)',
                fontSize: '11px',
              }}>
                <span style={{ color: '#64748b' }}>Set</span>
                <span style={{ color: accent, fontWeight: 600 }}>{selectedItem.setName}</span>
              </div>
            )}

            {selectedItem.abilities && selectedItem.abilities.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Abilities</div>
                {selectedItem.abilities.map((ab, i) => (
                  <div key={i} style={{
                    padding: '4px 8px', marginBottom: '3px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '6px', fontSize: '10px', color: '#94a3b8',
                  }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{ab.name || ab}</span>
                    {ab.damage && <span style={{ color: '#ef4444', marginLeft: '6px' }}>DMG {ab.damage}</span>}
                  </div>
                ))}
              </div>
            )}

            {selectedItem.effect && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderTop: '1px solid rgba(100,116,139,0.1)',
                fontSize: '11px',
              }}>
                <span style={{ color: '#64748b' }}>Effect</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{selectedItem.effect}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
